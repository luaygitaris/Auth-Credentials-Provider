"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

import type { Conversation, Message, User } from "@prisma/client"
import Sidebar from "@/components/chat/sidebar"
import ChatArea from "@/components/chat/chat-area"

type ConversationWithParticipantsAndLastMessage = Conversation & {
  participants: {
    user: User
    isAdmin?: boolean
  }[]
  messages: Message[]
}

interface ChatLayoutProps {
  initialConversations: ConversationWithParticipantsAndLastMessage[]
}

export default function ChatLayout({ initialConversations }: ChatLayoutProps) {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState(initialConversations)
  const [activeConversation, setActiveConversation] = useState<ConversationWithParticipantsAndLastMessage | null>(
    initialConversations.length > 0 ? initialConversations[0] : null,
  )
  const router = useRouter()

  if (!session?.user) {
    return null
  }

  const handleConversationDeleted = () => {
    // Remove the deleted conversation from the list
    setConversations((prev) => prev.filter((conv) => conv.id !== activeConversation?.id))

    // Set the active conversation to the first one in the list or null
    setActiveConversation(conversations.length > 1 ? conversations[0] : null)

    // Refresh the page to get updated data
    router.refresh()
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        conversations={conversations}
        activeConversation={activeConversation}
        setActiveConversation={setActiveConversation}
        currentUser={session.user}
        onConversationDeleted={handleConversationDeleted}
      />
      <ChatArea
        conversation={activeConversation}
        currentUser={session.user}
        onConversationDeleted={handleConversationDeleted}
      />
    </div>
  )
}
