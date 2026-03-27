/**
 * @file Entry point for the B3 Production Dashboard application.
 * Initializes the Express server, mounts middleware, configures sessions,
 * and attaches the WebSocket server for real-time communication.
 * @module server - Main server setup and configuration.
 */
import express from 'express'
import session from 'express-session'
import 'dotenv/config'
import { homeRouter } from './routes/homeRouter.js'
import { authRouter } from './routes/authRouter.js'
import { webhookRouter } from './routes/webhookRouter.js'
import { wss } from './config/webSocketServer.js'

const app = express()
const PORT = process.env.PORT || 3000

// Session Middleware Configuration
app.use(session({
  name: 'b3.session',
  secret: process.env.SESSION_SECRET || 'fallback_secret_if_missing_in_env',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    sameSite: 'lax'
  }
}))

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static('public'))

// View Engine
app.set('view engine', 'ejs')
app.set('views', './src/views')

// Attach the WebSocket server instance to the response object for easy access in controllers
app.use((req, res, next) => {
  res.wss = wss
  next()
})

app.use('/', homeRouter)
app.use('/auth', authRouter)
app.use('/webhook', webhookRouter)

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (socket) => {
    wss.emit('connection', socket, request)
  })
})
