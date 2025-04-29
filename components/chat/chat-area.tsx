"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import type { Conversation, Message, User } from "@prisma/client";
import { format } from "date-fns";
import { FaPaperPlane, FaTrash } from "react-icons/fa";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useChatContext } from "@/components/socket-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatAreaProps {
  conversation:
    | (Conversation & {
        participants: {
          user: User;
        }[];
      })
    | null;
  currentUser: User;
  onConversationDeleted?: () => void;
}

export default function ChatArea({
  conversation,
  currentUser,
  onConversationDeleted,
}: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isOnline } = useChatContext();
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [isDeleteConversationDialogOpen, setIsDeleteConversationDialogOpen] =
    useState(false);
  const router = useRouter();

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!conversation) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `/api/conversations/${conversation.id}/messages`
        );
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
          if (data.length > 0) {
            setLastMessageId(data[data.length - 1].id);
          }
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [conversation]);

  // Poll for new messages
  useEffect(() => {
    if (!conversation || !isOnline) return;

    const pollInterval = setInterval(async () => {
      try {
        const url = lastMessageId
          ? `/api/conversations/${conversation.id}/messages/poll?lastMessageId=${lastMessageId}`
          : `/api/conversations/${conversation.id}/messages`;

        const response = await fetch(url);

        if (response.ok) {
          const newMessages = await response.json();

          if (newMessages.length > 0) {
            setMessages((prev) => [...prev, ...newMessages]);
            setLastMessageId(newMessages[newMessages.length - 1].id);
          }
        }
      } catch (error) {
        console.error("Error polling messages:", error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [conversation, lastMessageId, isOnline]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || !conversation || isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/conversations/${conversation.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: input,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const newMessage = await response.json();

      // Optimistically add the message to the UI
      setMessages((prev) => [...prev, newMessage]);
      setLastMessageId(newMessage.id);
      setInput("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!conversation) return;

    try {
      const response = await fetch(
        `/api/conversations/${conversation.id}/messages/${messageId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete message");
      }

      // Remove the message from the UI
      setMessages((prev) => prev.filter((message) => message.id !== messageId));

      toast({
        title: "Success",
        description: "Message deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete message. Please try again.",
        variant: "destructive",
      });
      console.error("Error deleting message:", error);
    } finally {
      setMessageToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversation) return;
  
    try {
      const response = await fetch(`/api/conversations/${conversation.id}`, {
        method: "DELETE",
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.message || "Failed to delete conversation");
      }
  
      toast({
        title: "Success",
        description: "Conversation deleted successfully",
      });
  
      if (onConversationDeleted) {
        onConversationDeleted();
      }
  
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete conversation. Please try again.",
        variant: "destructive",
      });
      console.error("Error deleting conversation:", error);
    } finally {
      setIsDeleteConversationDialogOpen(false);
    }
  };
  

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const formatMessageTime = (date: Date) => {
    return format(new Date(date), "HH:mm");
  };

  // Check if current user is admin in this conversation
  const isCurrentUserAdmin = () => {
    if (!conversation) return false;

    // Find the current user's participant record
    const currentParticipant = conversation.participants.find(
      (p) => p.user.id === currentUser.id
    );

    // For debugging
    // console.log("Current participant:", currentParticipant);

    return !!currentParticipant;
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">
          Select a conversation to start chatting
        </p>
      </div>
    );
  }

  const getConversationName = () => {
    if (conversation.name) return conversation.name;

    const otherParticipants = conversation.participants
      .filter((participant) => participant.user.id !== currentUser.id)
      .map((participant) => participant.user.name);

    return otherParticipants.join(", ") || "No participants";
  };

  // For debugging
  // console.log("Conversation:", conversation);
  // console.log("Current user:", currentUser);
  // console.log("Is group:", conversation.isGroup);
  // console.log("Is admin:", isCurrentUserAdmin());
  // console.log("Participants:", conversation.participants);

  // Determine if the delete button should be enabled
  const canDelete = !conversation.isGroup || isCurrentUserAdmin();

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center">
          <Avatar className="mr-2">
            {conversation.isGroup ? (
              <AvatarFallback>GP</AvatarFallback>
            ) : (
              <>
                <AvatarImage
                  src={
                    conversation.participants.find(
                      (p) => p.user.id !== currentUser.id
                    )?.user.image || undefined
                  }
                />
                <AvatarFallback>
                  {getInitials(getConversationName())}
                </AvatarFallback>
              </>
            )}
          </Avatar>
          <div>
            <h2 className="font-medium">{getConversationName()}</h2>
            <p className="text-xs text-muted-foreground">
              {isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Delete button - always visible but conditionally enabled */}
        <Button
          variant="destructive"
          size="sm"
          className="flex items-center gap-1"
          onClick={() => setIsDeleteConversationDialogOpen(true)}
          disabled={!canDelete}
          title={
            !canDelete ? "Only group admins can delete groups" : undefined
          }>
          <FaTrash className="h-3 w-3" />
          <span>Delete {conversation.isGroup ? "Group" : "Conversation"}</span>
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground">No messages yet</p>
          ) : (
            messages.map((message) => {
              const isCurrentUser = message.senderId === currentUser.id;
              const sender = conversation.participants.find(
                (p) => p.user.id === message.senderId
              )?.user;

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    isCurrentUser ? "justify-end" : "justify-start"
                  }`}>
                  <div
                    className={`flex ${
                      isCurrentUser ? "flex-row-reverse" : "flex-row"
                    } items-end gap-2 max-w-[80%] group`}>
                    {!isCurrentUser && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={sender?.image || undefined} />
                        <AvatarFallback>
                          {getInitials(sender?.name || "User")}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`rounded-lg p-3 relative ${
                        isCurrentUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}>
                      <p>{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isCurrentUser
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}>
                        {formatMessageTime(message.createdAt)}
                      </p>

                      {/* Delete message button - only visible on hover and for own messages or admins */}
                      {(isCurrentUser || isCurrentUserAdmin()) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background shadow opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setMessageToDelete(message.id);
                            setIsDeleteDialogOpen(true);
                          }}>
                          <FaTrash className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || !isOnline}
          />
          <Button type="submit" size="icon" disabled={isLoading || !isOnline}>
            <FaPaperPlane className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Delete Message Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                messageToDelete && handleDeleteMessage(messageToDelete)
              }>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Conversation Confirmation Dialog */}
      <AlertDialog
        open={isDeleteConversationDialogOpen}
        onOpenChange={setIsDeleteConversationDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {conversation.isGroup ? "Group" : "Conversation"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this{" "}
              {conversation.isGroup ? "group" : "conversation"}? All messages
              will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConversation}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
