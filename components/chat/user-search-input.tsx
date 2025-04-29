"use client"

import { useEffect, useState } from "react"
import type { User } from "@prisma/client"
import { X } from "lucide-react"
import { FaSearch } from "react-icons/fa"

import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface UserSearchInputProps {
  value: string[]
  onChange: (value: string[]) => void
  currentUserId: string
  disabled?: boolean
}

export default function UserSearchInput({ value, onChange, currentUserId, disabled }: UserSearchInputProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchSelectedUsers = async () => {
      if (value.length === 0) return

      try {
        const response = await fetch(`/api/users?ids=${value.join(",")}`)
        if (response.ok) {
          const data = await response.json()
          setSelectedUsers(data)
        }
      } catch (error) {
        console.error("Error fetching selected users:", error)
      }
    }

    fetchSelectedUsers()
  }, [value])

  useEffect(() => {
    const fetchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        return
      }

      setIsLoading(true)

      try {
        const response = await fetch(`/api/users/search?q=${searchQuery}`)
        if (response.ok) {
          const data = await response.json()
          setSearchResults(data.filter((user: User) => user.id !== currentUserId && !value.includes(user.id)))
        }
      } catch (error) {
        console.error("Error searching users:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(fetchUsers, 500)
    return () => clearTimeout(debounce)
  }, [searchQuery, currentUserId, value])

  const handleSelect = (user: User) => {
    onChange([...value, user.id])
    setSearchQuery("")
  }

  const handleRemove = (userId: string) => {
    onChange(value.filter((id) => id !== userId))
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedUsers.map((user) => (
          <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
            {user.name}
            <button
              type="button"
              onClick={() => handleRemove(user.id)}
              className="ml-1 rounded-full hover:bg-muted p-0.5"
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      <div className="relative">
        <FaSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          disabled={disabled}
        />
      </div>

      {searchQuery.length >= 2 && (
        <div className="relative">
          <ScrollArea className="h-60 border rounded-md">
            <div className="p-2">
              {isLoading ? (
                <p className="text-center text-sm text-muted-foreground p-2">Loading...</p>
              ) : searchResults.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground p-2">No users found</p>
              ) : (
                searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className="flex items-center gap-3 w-full p-2 hover:bg-muted rounded-md transition-colors"
                    onClick={() => handleSelect(user)}
                    disabled={disabled}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image || undefined} />
                      <AvatarFallback>{getInitials(user.name || "User")}</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
