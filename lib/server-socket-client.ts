// lib/server-socket-client.ts
import axios from "axios";

export async function emitSocketMessage(message: any) {
  try {
    await axios.post(`${process.env.SOCKET_SERVER_URL}/emit`, message);
  } catch (error) {
    console.error("Failed to emit socket message:", error);
  }
}
