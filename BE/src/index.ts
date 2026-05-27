import 'dotenv/config'
import http from 'http'
import app from './app'
import { initSocket } from './socket/socket.server'

const PORT = process.env.PORT ?? 4000

const server = http.createServer(app)
initSocket(server)

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
