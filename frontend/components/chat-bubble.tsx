"use client"

import type { Message } from "@/types"
import { cn } from "@/lib/utils"
import { User, Sparkles } from "lucide-react"

interface ChatBubbleProps {
    message: Message
    index: number
}

export function ChatBubble({ message, index }: ChatBubbleProps) {
    const isUser = message.role === "user"
    const imageUrl = message.image || message.imageUrl

    const formatTime = (timestamp?: Date | string) => {
        if (!timestamp) return ""
        const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }

    return (
        <div
            className={cn(
                "flex gap-3 animate-in slide-in-from-bottom duration-300",
                isUser ? "justify-end" : "justify-start",
            )}
            style={{ animationDelay: `${index * 50}ms` }}
        >
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-lg">
                    <Sparkles className="h-4 w-4 text-white" />
                </div>
            )}

            <div
                className={cn(
                    "rounded-2xl p-4 shadow-sm transition-all hover:shadow-md",
                    isUser
                        ? "bg-primary text-primary-foreground rounded-tr-sm max-w-[35%]"
                        : "bg-accent text-accent-foreground rounded-tl-sm max-w-[35%]",
                )}
            >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

                {imageUrl && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-border animate-in fade-in zoom-in duration-500 max-w-[100%]">
                        <img
                            src={imageUrl || "/placeholder.svg"}
                            alt="Generated"
                            className="w-full h-auto transition-transform hover:scale-105 duration-300"
                        />
                    </div>
                )}

                <span className="text-xs opacity-60 mt-2 block">
                    {formatTime(message.timestamp)}
                </span>
            </div>

            {isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <User className="h-4 w-4 text-white" />
                </div>
            )}
        </div>
    )
}
