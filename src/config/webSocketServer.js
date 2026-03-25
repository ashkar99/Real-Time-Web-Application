import { WebSocketServer } from 'ws'

// noServer to prevents the WebSocket server from binding to a port independently.
export const wss = new WebSocketServer({ noServer: true })

wss.on('connection', (socket) => {
  console.log('WebSocket client connected.')

  socket.on('close', () => {
    console.log('WebSocket client disconnected.')
  })
})
