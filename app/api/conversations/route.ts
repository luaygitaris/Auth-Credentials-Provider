import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const conversationSchema = z.object({
  name: z.string().optional(),
  isGroup: z.boolean().default(false),
  userIds: z.array(z.string()).min(1, { message: "Please select at least one user" }),
  isAdmin: z.boolean().default(false),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    const validation = conversationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ message: "Invalid input", errors: validation.error.errors }, { status: 400 })
    }

    const { name, isGroup, userIds } = validation.data

    // For direct messages, check if conversation already exists
    if (!isGroup && userIds.length === 1) {
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          AND: [
            { isGroup: false },
            {
              participants: {
                some: {
                  userId: session.user.id,
                },
              },
            },
            {
              participants: {
                some: {
                  userId: userIds[0],
                },
              },
            },
          ],
        },
        include: {
          participants: {
            include: {
              user: true,
            },
          },
        },
      })

      if (existingConversation) {
        return NextResponse.json(existingConversation, { status: 200 })
      }
    }

    // Create new conversation group
    const conversation = await prisma.conversation.create({
      data: {
        name: isGroup ? name : undefined,
        isGroup,
        participants: {
          create: [
            {
              userId: session.user.id,
              isAdmin: true, // Pembuat grup jadi admin
            },
            ...userIds.map((userId) => ({
              userId,
              isAdmin: false,
            })),
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    })

    return NextResponse.json(conversation, { status: 201 })
  } catch (error) {
    console.error("Error creating conversation:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
