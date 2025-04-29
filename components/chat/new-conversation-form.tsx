"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { User } from "@prisma/client";
import { FaUsers } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import UserSearchInput from "@/components/chat/user-search-input";

const formSchema = z.object({
  name: z.string().optional(),
  isGroup: z.boolean(),
  userIds: z
    .array(z.string())
    .min(1, { message: "Please select at least one user" }),
});

type FormValues = z.infer<typeof formSchema>;

interface NewConversationFormProps {
  currentUser: User;
  onSuccess: () => void;
}

export default function NewConversationForm({
  currentUser,
  onSuccess,
}: NewConversationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      isGroup: false,
      userIds: [],
    },
  });

  const isGroup = form.watch("isGroup");

  async function onSubmit(data: FormValues) {
    setIsLoading(true);

    try {
      if (data.userIds.includes(currentUser.id)) {
        throw new Error("You cannot start a conversation with yourself");
      }

      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          isGroup: data.isGroup,
          userIds: data.userIds,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create conversation");
      }

      toast({
        title: "Success",
        description: data.isGroup 
          ? "Group created successfully" 
          : "Conversation started successfully",
      });

      form.reset();
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="isGroup"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Create a group chat</FormLabel>
              </div>
            </FormItem>
          )}
        />

        {isGroup && (
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Group Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <FaUsers className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      {...field}
                      placeholder="Enter group name"
                      disabled={isLoading}
                      className="pl-10"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="userIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select {isGroup ? "Members" : "User"}</FormLabel>
              <FormControl>
                <UserSearchInput
                  value={field.value}
                  onChange={(selectedIds) => {
                    // Filter out current user if accidentally selected
                    const filteredIds = selectedIds.filter(
                      (id) => id !== currentUser.id
                    );
                    field.onChange(filteredIds);
                  }}
                  currentUserId={currentUser.id}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              Creating...
            </span>
          ) : isGroup ? (
            "Create Group"
          ) : (
            "Start Conversation"
          )}
        </Button>
      </form>
    </Form>
  );
}