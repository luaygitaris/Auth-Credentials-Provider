import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const messageSchema = z.object({
  content: z.string().min(1, { message: "Message cannot be empty" }),
})

// export async function GET(req: Request, { params }: { params: { conversationId: string } }) {
//   try {
//     const session = await getServerSession(authOptions)

//     if (!session?.user) {
//       return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
//     }

//     const conversationId = params.conversationId

//     // Check if user is part of the conversation
//     const conversation = await prisma.conversation.findFirst({
//       where: {
//         id: conversationId,
//         participants: {
//           some: {
//             userId: session.user.id,
//           },
//         },
//       },
//     })

//     if (!conversation) {
//       return NextResponse.json({ message: "Conversation not found" }, { status: 404 })
//     }

//     const messages = await prisma.message.findMany({
//       where: {
//         conversationId,
//       },
//       include: {
//         sender: {
//           select: {
//             id: true,
//             name: true,
//             image: true,
//           },
//         },
//       },
//       orderBy: {
//         createdAt: "asc",
//       },
//     })

//     return NextResponse.json(messages, { status: 200 })
//   } catch (error) {
//     console.error("Error fetching messages:", error)
//     return NextResponse.json({ message: "Internal server error" }, { status: 500 })
//   }
// }

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/");

  const conversationId = pathSegments[pathSegments.indexOf("conversations") + 1];

  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }


    // Check if user is part of the conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId: session.user.id,
          },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ message: "Conversation not found" }, { status: 404 })
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    return NextResponse.json(messages, { status: 200 })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
  // lanjutkan dengan logic seperti sebelumnya...
}


// export async function POST(req: Request, { params }: { params: { conversationId: string } }) {
//   try {
//     const session = await getServerSession(authOptions)

//     if (!session?.user) {
//       return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
//     }

//     const conversationId = params.conversationId

//     // Check if user is part of the conversation
//     const conversation = await prisma.conversation.findFirst({
//       where: {
//         id: conversationId,
//         participants: {
//           some: {
//             userId: session.user.id,
//           },
//         },
//       },
//       include: {
//         participants: true,
//       },
//     })

//     if (!conversation) {
//       return NextResponse.json({ message: "Conversation not found" }, { status: 404 })
//     }

//     const body = await req.json()

//     const validation = messageSchema.safeParse(body)

//     if (!validation.success) {
//       return NextResponse.json({ message: "Invalid input", errors: validation.error.errors }, { status: 400 })
//     }

//     const { content } = validation.data

//     // Create message
//     const message = await prisma.message.create({
//       data: {
//         content,
//         conversationId,
//         senderId: session.user.id,
//       },
//       include: {
//         sender: {
//           select: {
//             id: true,
//             name: true,
//             image: true,
//           },
//         },
//       },
//     })

//     // Update conversation's updatedAt
//     await prisma.conversation.update({
//       where: {
//         id: conversationId,
//       },
//       data: {
//         updatedAt: new Date(),
//       },
//     })

//     // Get the server object to access Socket.io
//     const res = NextResponse.next()
//     const httpServer = res.socket?.server as any

//     // If Socket.io is initialized, emit the message to all participants
//     if (httpServer?.io) {
//       const io = httpServer.io

//       // Emit to all participants in the conversation
//       conversation.participants.forEach((participant) => {
//         io.to(participant.userId).emit("message", message)
//       })
//     }

//     return NextResponse.json(message, { status: 201 })
//   } catch (error) {
//     console.error("Error creating message:", error)
//     return NextResponse.json({ message: "Internal server error" }, { status: 500 })
//   }
// }


export async function POST(req: Request) {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/");

  const conversationId = pathSegments[pathSegments.indexOf("conversations") + 1];

  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }


    // Check if user is part of the conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        participants: true,
      },
    })

    if (!conversation) {
      return NextResponse.json({ message: "Conversation not found" }, { status: 404 })
    }

    const body = await req.json()

    const validation = messageSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ message: "Invalid input", errors: validation.error.errors }, { status: 400 })
    }

    const { content } = validation.data

    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        conversationId,
        senderId: session.user.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    // Update conversation's updatedAt
    await prisma.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        updatedAt: new Date(),
      },
    })

    // Get the server object to access Socket.io
    const res = NextResponse.next()
    const httpServer = res.socket?.server as any

    // If Socket.io is initialized, emit the message to all participants
    if (httpServer?.io) {
      const io = httpServer.io

      // Emit to all participants in the conversation
      conversation.participants.forEach((participant) => {
        io.to(participant.userId).emit("message", message)
      })
    }

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
  // lanjutkan dengan logic seperti sebelumnya...
}
