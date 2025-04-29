import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// export async function DELETE(
//   req: NextRequest,
//   { params }: { params: { conversationId: string; messageId: string } }
// ) {
//   try {
//     const session = await getServerSession(authOptions);

//     if (!session?.user) {
//       return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
//     }

//     const { conversationId, messageId } = params;

//     const conversation = await prisma.conversation.findFirst({
//       where: {
//         id: conversationId,
//         participants: {
//           some: {
//             userId: session.user.id,
//           },
//         },
//       },
//     });

//     if (!conversation) {
//       return NextResponse.json({ message: "Conversation not found" }, { status: 404 });
//     }

//     const message = await prisma.message.findUnique({
//       where: { id: messageId },
//     });

//     if (!message || message.conversationId !== conversationId) {
//       return NextResponse.json({ message: "Message not found" }, { status: 404 });
//     }

//     const isAdmin = conversation.isGroup
//       ? await prisma.conversationParticipant.findFirst({
//           where: {
//             conversationId,
//             userId: session.user.id,
//             isAdmin: true,
//           },
//         })
//       : null;

//     if (message.senderId !== session.user.id && !isAdmin) {
//       return NextResponse.json({ message: "You can only delete your own messages" }, { status: 403 });
//     }

//     await prisma.message.delete({ where: { id: messageId } });

//     return NextResponse.json({ message: "Message deleted successfully" }, { status: 200 });
//   } catch (error) {
//     console.error("Error deleting message:", error);
//     return NextResponse.json({ message: "Internal server error" }, { status: 500 });
//   }
// }

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/");

  const conversationId = pathSegments[pathSegments.indexOf("conversations") + 1];
  const messageId = pathSegments[pathSegments.indexOf("messages") + 1];

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ message: "Conversation not found" }, { status: 404 });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.conversationId !== conversationId) {
      return NextResponse.json({ message: "Message not found" }, { status: 404 });
    }

    const isAdmin = conversation.isGroup
      ? await prisma.conversationParticipant.findFirst({
          where: {
            conversationId,
            userId: session.user.id,
            isAdmin: true,
          },
        })
      : null;

    if (message.senderId !== session.user.id && !isAdmin) {
      return NextResponse.json({ message: "You can only delete your own messages" }, { status: 403 });
    }

    await prisma.message.delete({ where: { id: messageId } });

    return NextResponse.json({ message: "Message deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
  // lanjutkan dengan logic seperti sebelumnya...
}

