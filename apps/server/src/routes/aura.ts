import { Hono } from 'hono'

const aura_router = new Hono()

aura_router.get('/:username', (c) => {
    const username = c.req.param("username")
    return c.json('list authors')
})

export default aura_router