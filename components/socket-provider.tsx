"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

type ChatContextType = {
  isOnline: boolean
  setIsOnline: (value: boolean) => void
}

const ChatContext = createContext<ChatContextType>({
  isOnline: true,
  setIsOnline: () => {},
})

export const useChatContext = () => {
  return useContext(ChatContext)
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)

  return (
    <ChatContext.Provider value={{ isOnline, setIsOnline }}>
      {children}
    </ChatContext.Provider>
  )
}
