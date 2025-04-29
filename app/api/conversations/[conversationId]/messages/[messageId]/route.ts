import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function DELETE(req: Request, { params }: { params: { conversationId: string; messageId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { conversationId, messageId } = params

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

    // Check if the message exists
    const message = await prisma.message.findUnique({
      where: {
        id: messageId,
        conversationId,
      },
    })

    if (!message) {
      return NextResponse.json({ message: "Message not found" }, { status: 404 })
    }

    // Check if the user is the sender of the message or a group admin
    const isAdmin = conversation.isGroup
      ? await prisma.conversationParticipant.findFirst({
          where: {
            conversationId,
            userId: session.user.id,
            isAdmin: true,
          },
        })
      : null

    if (message.senderId !== session.user.id && !isAdmin) {
      return NextResponse.json({ message: "You can only delete your own messages" }, { status: 403 })
    }

    // Delete the message
    await prisma.message.delete({
      where: {
        id: messageId,
      },
    })

    return NextResponse.json({ message: "Message deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting message:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
