import { Hono } from 'hono'
import { RedditUser, AuraPoints, Poll } from './models.js'

const aura_router = new Hono()

aura_router.get('/:username', async (c) => {
    const username = c.req.param("username")
    
    const user = await RedditUser.findOne({
        username: username
    })

    if (!user){
        return c.json({'message':'no user found'})
    }

    const auraPoints = await AuraPoints.find({
        user: user._id
    })

    const positivePoints = auraPoints
        .filter(point => point.points > 0)
        .reduce((sum, point) => sum + point.points, 0)

    const negativePoints = auraPoints
        .filter(point => point.points < 0)
        .reduce((sum, point) => sum + point.points, 0)

    const totalPoints = positivePoints + negativePoints

    const recentVotes = await AuraPoints.find({
        user: user._id
    })
    .sort({ date: -1 })
    .limit(3)
    .select('points voter date pfp')

    return c.json({
        username: user.username,
        totalAuraPoints: totalPoints,
        positivePoints,
        negativePoints,
        recentVotes
    })
})

aura_router.post('/vote', async (c) => {
    const body = await c.req.json()
    const { username, points, poll_id } = body

    const poll = await Poll.findOne({ _id: poll_id })
    if (!poll) {
        return c.json({ message: 'Poll not found' })
    }

    const new_vote = new AuraPoints({
        user: poll.user_id,
        points,
        poll_id,
        post_id: poll.post_id,
        voter: username,
        date: new Date()
    })

    await new_vote.save()

    return c.json({ message: 'Vote saved' })
})



export default aura_router