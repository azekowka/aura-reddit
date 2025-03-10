import { Hono } from 'hono'
import mongoose, { Document, Schema } from 'mongoose';
import axios from 'axios';
import { LastSeenUserPost, RedditPost, RedditUser } from './models.js';
import OpenAI from "openai";
import 'dotenv/config'

const openai = new OpenAI({
    apiKey: process.env.AZURE_API_KEY,
    baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
    defaultQuery: { "api-version": process.env.AZURE_OPENAI_API_VERSION },
    defaultHeaders: { "api-key": process.env.AZURE_API_KEY }
});

interface PostAccumulator {
    posts: Array<{
        user_id: string;
        title: string;
        body: string;
        created_at: Date;
    }>;
    stopped: boolean;
}

const reddit_router = new Hono()

reddit_router.get('/:username', async (c) => {
    const username = c.req.param("username")

    let user = await RedditUser.findOne({ username: username })
    if (!user) {
        const user_details = await axios.get(`https://www.reddit.com/user/${username}/about.json`)

        const new_user = new RedditUser({
            username: username,
            pfp: user_details.data.data.snoovatar_img	
        })

        await new_user.save()
        user = new_user 
    }

    if (!user){
        return c.json({'message':'no user found'})
    }

    // let lastSeenPostDate = null 
    // const lastSeenPost = await LastSeenUserPost.findOne({ user_id: user._id }) 
    // if (lastSeenPost) {
    //     lastSeenPostDate = lastSeenPost.date
    // }

    const activity = await axios.get(`https://www.reddit.com/user/${username}.json`)

    const posts = activity.data.data.children
        .slice(0, 20)
        .reduce((acc: PostAccumulator, post: any) => {
            if (acc.stopped) return acc;
            
            const created_at = new Date(post.data.created_utc * 1000)
            
            // if (lastSeenPostDate && created_at <= lastSeenPostDate) {
            //     acc.stopped = true;
            //     return acc;
            // }
            
            acc.posts.push({
                user_id: user && user._id as string || "not_found",
                title: post.data.link_title || post.data.title,
                body: post.data.body_html || post.data.selftext_html,
                permalink: "https://reddit.com"+post.data.permalink,
                thumbnail: post.data.link_url,
                title_author: post.data.link_author || post.data.author,
                author: post.data.author,
                created_at,
            });
            
            return acc;
        }, { posts: [], stopped: false });

    const completion = await openai.chat.completions.create({
        messages: [
            { 
                role: "system", 
                content: "You are a helpful reddit assistant. Your task is to determine which aura post to publish so public could give aura points for the user. The post should be the most controversial and interesting to judge person for. You are given the posts. Return title of post with the most controversial content. If no controversial then the most cringe one. Dont return any other text- title only" 
            },
            {
                role: "user",
                content: posts.posts.map((post: any) => post.author === post.title_author && `${post.author} is saying:\nTitle: post.title.\n Body text: + post.body` || `$${post.author} is replying to ${post.title_author} post\nTitle: ${post.title} with comment: Body:\n${post.body}`).join("\n")
            }
        ],
        model: "gpt-4o-mini",
        store: false,
    });

    const response = completion.choices[0].message.content || ""

    const post = posts.posts.find((post: any) => post.title === response)

    if (!post){
        console.log(response)
        return c.json({'message':'no interesting post found'})
    }

    const new_post = new RedditPost({
        title: post.title,
        body: post.body,
        user_id: post.user_id,
        title_author: post.title_author,
        thumbnail: post.thumbnail,
        permalink: post.permalink,
        created_at: post.created_at
    })

    await new_post.save()
    
    const populated_post = await RedditPost.findById(new_post._id)
        .populate({
            path: 'user_id',
            model: RedditUser,
            select: 'username pfp' 
        })
        .exec()

    return c.json(populated_post)
})

export default reddit_router