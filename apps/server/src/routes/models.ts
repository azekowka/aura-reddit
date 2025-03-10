import mongoose, { Document, Schema } from 'mongoose';

export interface IAuraPoints extends Document {
    user_id: string 
    poll_id: string 
    post_id: string 
    points: number
    date: Date
}

const AuraPointsSchema = new Schema({
    user_id: { type: String, required: true, ref: 'RedditUser' },
    points: { type: Number, required: true },
    poll_id: { type: String, required: true, ref: 'Poll' },
    post_id: { type: String, required: true, ref: 'RedditPost' },
    voter: { type: String, required: true },
    date: { type: Date, required: true },
})

export const AuraPoints = mongoose.model<IAuraPoints>('AuraPoints', AuraPointsSchema)

export interface IRedditUser extends Document {
    username: string 
    pfp: string 
}

const RedditUserSchema = new Schema({
    username: { type: String, required: true, unique: true },
    pfp: { type: String, required: true }
})

export const RedditUser = mongoose.model<IRedditUser>('RedditUser', RedditUserSchema)

export interface ILastSeenUserPost extends Document {
    user_id: string
    post_id: string
    date: Date
}

const LastSeenUserPostSchema = new Schema({
    user_id: { type: String, required: true, ref: 'RedditUser', unique: true },
    post_id: { type: String, required: true, ref: 'RedditPost' },
    date: { type: Date, required: true }
})

export const LastSeenUserPost = mongoose.model<ILastSeenUserPost>('LastSeenUserPost', LastSeenUserPostSchema)

export interface IRedditPost extends Document {
    title: string
    body: string 
    user_id: string 
    created_at: Date
    title_author: string 
    thumbnail?: string 
    permalink: string 
}

const RedditPostSchema = new Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    user_id: { type: String, required: true, ref: 'RedditUser' },
    title_author: { type: String },
    thumbnail: { type: String },
    permalink: { type: String },
    created_at: { type: Date, required: true }
})

export const RedditPost = mongoose.model<IRedditPost>('RedditPost', RedditPostSchema)

export interface IPoll extends Document {
    user_id: string 
    post_id: string 
    created_at: Date
}

const PollSchema = new Schema({
    user_id: { type: String, required: true, ref: 'RedditUser' },
    post_id: { type: String, required: true, ref: 'RedditPost' },
    created_at: { type: Date, required: true }
})

export const Poll = mongoose.model<IPoll>('Poll', PollSchema)