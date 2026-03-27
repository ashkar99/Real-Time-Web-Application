/**
 * @file WebSocket Server Configuration.
 * Creates an independent WebSocket instance to be upgraded manually by the Express server.
 * @module webSocketServer - Configures the WebSocket server for real-time communication with clients.
 */
import { WebSocketServer } from 'ws'

// noServer to prevents the WebSocket server from binding to a port independently.
export const wss = new WebSocketServer({ noServer: true })

wss.on('connection', (socket) => {
  console.log('WebSocket client connected.')

  socket.on('close', () => {
    console.log('WebSocket client disconnected.')
  })
})
