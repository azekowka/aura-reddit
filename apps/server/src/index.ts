import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import reddit_router from './routes/reddit.js'
import aura_router from './routes/aura.js'
import 'dotenv/config'
import connectDB from './db.js'

connectDB()

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.route('/reddit', reddit_router)
app.route('/aura', aura_router)

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
