"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import type { Conversation, Message, User } from "@prisma/client"
import { format } from "date-fns"
import { FaPlus, FaSignOutAlt, FaUsers, FaTrash, FaEllipsisV } from "react-icons/fa"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import NewConversationForm from "@/components/chat/new-conversation-form"
import { cn } from "@/lib/tailwindMerge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

type ConversationWithParticipantsAndLastMessage = Conversation & {
  participants: {
    user: User
    isAdmin?: boolean
  }[]
  messages: Message[]
}

interface SidebarProps {
  conversations: ConversationWithParticipantsAndLastMessage[]
  activeConversation: ConversationWithParticipantsAndLastMessage | null
  setActiveConversation: (conversation: ConversationWithParticipantsAndLastMessage) => void
  currentUser: User
  onConversationDeleted?: () => void
}

export default function Sidebar({
  conversations,
  activeConversation,
  setActiveConversation,
  currentUser,
  onConversationDeleted,
}: SidebarProps) {
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const getConversationName = (conversation: ConversationWithParticipantsAndLastMessage) => {
    if (conversation.name) return conversation.name

    const otherParticipants = conversation.participants
      .filter((participant) => participant.user.id !== currentUser.id)
      .map((participant) => participant.user.name)

    return otherParticipants.join(", ") || "No participants"
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const getLastMessage = (conversation: ConversationWithParticipantsAndLastMessage) => {
    if (conversation.messages.length === 0) return "No messages yet"
    return conversation.messages[0].content
  }

  const getLastMessageTime = (conversation: ConversationWithParticipantsAndLastMessage) => {
    if (conversation.messages.length === 0) return ""
    return format(new Date(conversation.messages[0].createdAt), "HH:mm")
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/")
  }

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete conversation")
      }

      toast({
        title: "Success",
        description: "Conversation deleted successfully",
      })

      // Remove the conversation from the list
      if (onConversationDeleted) {
        onConversationDeleted()
      }

      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete conversation. Please try again.",
        variant: "destructive",
      })
      console.error("Error deleting conversation:", error)
    } finally {
      setConversationToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }

  const isUserAdmin = (conversation: ConversationWithParticipantsAndLastMessage) => {
    return conversation.participants.some(
      (participant) => participant.user.id === currentUser.id && participant.isAdmin,
    )
  }

  return (
    <div className="w-80 border-r flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Avatar>
            <AvatarImage src={currentUser.image || undefined} />
            <AvatarFallback>{getInitials(currentUser.name || "User")}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground">{currentUser.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
          <FaSignOutAlt className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-4 border-b">
        <Dialog open={isNewConversationOpen} onOpenChange={setIsNewConversationOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <FaPlus className="mr-2 h-4 w-4" />
              New Conversation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Conversation</DialogTitle>
            </DialogHeader>
            <NewConversationForm
              currentUser={currentUser}
              onSuccess={() => {
                setIsNewConversationOpen(false)
                router.refresh()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {conversations.length === 0 ? (
            <p className="text-center text-muted-foreground p-4">No conversations yet</p>
          ) : (
            conversations.map((conversation) => (
              <div key={conversation.id} className="relative group">
                <button
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-colors",
                    activeConversation?.id === conversation.id ? "bg-primary/10" : "hover:bg-muted",
                  )}
                  onClick={() => setActiveConversation(conversation)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar>
                      {conversation.isGroup ? (
                        <>
                          <AvatarFallback>
                            <FaUsers />
                          </AvatarFallback>
                        </>
                      ) : (
                        <>
                          <AvatarImage
                            src={
                              conversation.participants.find((p) => p.user.id !== currentUser.id)?.user.image ||
                              undefined
                            }
                          />
                          <AvatarFallback>{getInitials(getConversationName(conversation))}</AvatarFallback>
                        </>
                      )}
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{getConversationName(conversation)}</p>
                        <span className="text-xs text-muted-foreground">{getLastMessageTime(conversation)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{getLastMessage(conversation)}</p>
                    </div>
                  </div>
                </button>

                {/* Delete conversation button - only visible on hover */}
                {(conversation.isGroup ? isUserAdmin(conversation) : true) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FaEllipsisV className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          setConversationToDelete(conversation.id)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <FaTrash className="h-3 w-3 mr-2" />
                        Delete {conversation.isGroup ? "Group" : "Conversation"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Delete Conversation Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? All messages will be permanently deleted. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => conversationToDelete && handleDeleteConversation(conversationToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
