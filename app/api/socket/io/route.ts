// app/api/socket/route.ts
import { NextResponse } from 'next/server'
import { Server as SocketIOServer } from 'socket.io'
// import { Server as NetServer } from 'http'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Simpan io secara global untuk menghindari inisialisasi berulang
declare global {
  let io: SocketIOServer | undefined
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const socketServer = (global as any).io

    if (!socketServer) {
      console.log('Setting up Socket.io server...')

      const { Server } = await import('socket.io')
      const { createServer } = await import('http')

      // Create a standalone HTTP server
      const httpServer = createServer()

      const io = new Server(httpServer, {
        path: '/api/socket/io',
        addTrailingSlash: false,
      })

      io.on('connection', (socket) => {
        const userId = socket.handshake.auth.userId

        if (!userId) {
          socket.disconnect()
          return
        }

        console.log(`User connected: ${userId}`)

        socket.join(userId)

        prisma.conversation
          .findMany({
            where: {
              participants: {
                some: {
                  userId,
                },
              },
            },
          })
          .then((conversations) => {
            conversations.forEach((conversation) => {
              socket.join(`conversation:${conversation.id}`)
            })
          })

        socket.on('message', async (data) => {
          const { conversationId, message } = data
          io.to(`conversation:${conversationId}`).emit('message', message)
        })

        socket.on('disconnect', () => {
          console.log(`User disconnected: ${userId}`)
        })
      })

      // Simpan instance ke global agar tidak re-initialize
      global.io = io

      // Listen server if not already started
      if (!httpServer.listening) {
        httpServer.listen(3001, () => {
          console.log('Socket.io server is running on port 3001')
        })
      }
    }

    return NextResponse.json({ message: 'Socket.io server is running' }, { status: 200 })
  } catch (error) {
    console.error('Socket.io server error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
