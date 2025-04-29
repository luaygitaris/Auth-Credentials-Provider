import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// export async function DELETE(
//   req: Request,
//   { params }: { params: { conversationId: string } }
// ) {
//   try {
//     const session = await getServerSession(authOptions);

//     if (!session?.user) {
//       return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
//     }

//     const conversationId = params.conversationId;

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
//     });

//     if (!conversation) {
//       return NextResponse.json(
//         { message: "Conversation not found" },
//         { status: 404 }
//       );
//     }

//     // For group conversations, check if the user is an admin
//     if (conversation.isGroup) {
//       const isAdmin = await prisma.conversationParticipant.findFirst({
//         where: {
//           conversationId,
//           userId: session.user.id,
//           isAdmin: true,
//         },
//       });

//       // Log for debugging
//       // console.log("User ID:", session.user.id)
//       // console.log("Is admin check result:", isAdmin)
//       // console.log("All participants:", conversation.participants)

//       if (!isAdmin) {
//         return NextResponse.json(
//           { message: "Only group admins can delete this conversation" },
//           { status: 403 }
//         );
//       }
//     }

//     // Delete all messages in the conversation
//     await prisma.message.deleteMany({
//       where: {
//         conversationId,
//       },
//     });

//     // Delete all participants
//     await prisma.conversationParticipant.deleteMany({
//       where: {
//         conversationId,
//       },
//     });

//     // Delete the conversation
//     await prisma.conversation.delete({
//       where: {
//         id: conversationId,
//       },
//     });

//     return NextResponse.json(
//       { message: "Conversation deleted successfully" },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Error deleting conversation:", error);
//     return NextResponse.json(
//       { message: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/");

  const conversationId = pathSegments[pathSegments.indexOf("conversations") + 1];

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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
    });

    if (!conversation) {
      return NextResponse.json(
        { message: "Conversation not found" },
        { status: 404 }
      );
    }

    // For group conversations, check if the user is an admin
    if (conversation.isGroup) {
      const isAdmin = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId,
          userId: session.user.id,
          isAdmin: true,
        },
      });

      // Log for debugging
      // console.log("User ID:", session.user.id)
      // console.log("Is admin check result:", isAdmin)
      // console.log("All participants:", conversation.participants)

      if (!isAdmin) {
        return NextResponse.json(
          { message: "Only group admins can delete this conversation" },
          { status: 403 }
        );
      }
    }

    // Delete all messages in the conversation
    await prisma.message.deleteMany({
      where: {
        conversationId,
      },
    });

    // Delete all participants
    await prisma.conversationParticipant.deleteMany({
      where: {
        conversationId,
      },
    });

    // Delete the conversation
    await prisma.conversation.delete({
      where: {
        id: conversationId,
      },
    });

    return NextResponse.json(
      { message: "Conversation deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }

  // lanjutkan dengan logic seperti sebelumnya...
}
