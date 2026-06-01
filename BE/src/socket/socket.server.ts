import { Server as HttpServer } from 'http'
import { Server as SocketServer, Socket } from 'socket.io'

let io: SocketServer

export function initSocket(server: HttpServer) {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : '*',
      credentials: process.env.NODE_ENV === 'production',
    },
  })

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] connected: ${socket.id}`)

    // 특정 기구 룸에 입장
    socket.on('join:equipment', (equipmentId: number) => {
      socket.join(`equipment:${equipmentId}`)
      console.log(`[Socket] ${socket.id} joined equipment:${equipmentId}`)
    })

    socket.on('leave:equipment', (equipmentId: number) => {
      socket.leave(`equipment:${equipmentId}`)
    })

    // 유저 전용 룸 (알림용)
    socket.on('join:user', (userId: number) => {
      socket.join(`user:${userId}`)
      console.log(`[Socket] ${socket.id} joined user:${userId}`)
    })

    socket.on('disconnect', () => {
      console.log(`[Socket] disconnected: ${socket.id}`)
    })
  })

  return io
}

export function getIo() {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}

// 기구 상태 변경 브로드캐스트
export function emitEquipmentUpdate(equipmentId: number, data: unknown) {
  getIo().to(`equipment:${equipmentId}`).emit('equipment:updated', data)
}

// 유저에게 알림 전송
export function emitUserNotification(userId: number, notification: unknown) {
  getIo().to(`user:${userId}`).emit('notification:new', notification)
}
