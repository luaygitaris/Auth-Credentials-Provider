// lib/socket.ts
import { io } from "socket.io-client";

const socket = io(process.env.SOCKET_SERVER_URL || "http://localhost:3001", {
  transports: ["websocket"],
});

export default socket;
