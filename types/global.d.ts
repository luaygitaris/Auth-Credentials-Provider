// types/global.d.ts

import type { Server as SocketIOServer } from "socket.io";

declare global {
  let io: SocketIOServer | undefined;
}

export {};
