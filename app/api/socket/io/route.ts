// // app/api/socket/route.ts
// import { NextResponse } from "next/server";
// import { Server as SocketIOServer } from "socket.io";
// import { createServer } from "http";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import { prisma } from "@/lib/prisma";

// export async function GET(req: Request) {
//   const session = await getServerSession(authOptions);

//   if (!session?.user) {
//     return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
//   }

//   try {
//     if (!global.io) {
//       console.log("Setting up Socket.io server...");

//       const httpServer = createServer();

//       const io = new SocketIOServer(httpServer, {
//         path: "/api/socket/io",
//         addTrailingSlash: false,
//       });

//       io.on("connection", (socket) => {
//         const userId = socket.handshake.auth.userId;

//         if (!userId) {
//           socket.disconnect();
//           return;
//         }

//         console.log(`User connected: ${userId}`);
//         socket.join(userId);

//         prisma.conversation
//           .findMany({
//             where: {
//               participants: {
//                 some: {
//                   userId,
//                 },
//               },
//             },
//           })
//           .then((conversations) => {
//             conversations.forEach((conversation) => {
//               socket.join(`conversation:${conversation.id}`);
//             });
//           });

//         socket.on("message", async (data) => {
//           const { conversationId, message } = data;
//           io.to(`conversation:${conversationId}`).emit("message", message);
//         });

//         socket.on("disconnect", () => {
//           console.log(`User disconnected: ${userId}`);
//         });
//       });

//       global.io = io;

//       httpServer.listen(3001, () => {
//         console.log("Socket.io server is running on port 3001");
//       });
//     }

//     return NextResponse.json({ message: "Socket.io server is running" }, { status: 200 });
//   } catch (error) {
//     console.error("Socket.io server error:", error);
//     return NextResponse.json({ message: "Internal server error" }, { status: 500 });
//   }
// }
