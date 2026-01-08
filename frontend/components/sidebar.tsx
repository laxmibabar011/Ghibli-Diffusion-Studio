"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlusCircle, MessageSquare, Trash2, ImageIcon, ChevronLeft, ChevronRight } from "lucide-react"
import type { Chat } from "@/types"
import { cn } from "@/lib/utils"

interface SidebarProps {
    chats: Chat[]
    currentChatId: string | null
    onChatSelect: (chatId: string) => void
    onNewChat: () => void
    onDeleteChat: (chatId: string) => void
    onShowGallery: () => void
}

export function Sidebar({ chats, currentChatId, onChatSelect, onNewChat, onDeleteChat, onShowGallery }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false)

    return (
        <div
            className={cn(
                "border-r border-border bg-card transition-all duration-300 ease-in-out flex flex-col relative",
                isCollapsed ? "w-16" : "w-80",
            )}
        >
            <div className="absolute -right-4 top-4 z-10">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="h-8 w-8 rounded-full bg-card border-2 border-border shadow-md hover:bg-accent transition-all"
                >
                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
            </div>

            <div
                className={cn(
                    "flex flex-col flex-1 overflow-hidden transition-all duration-300",
                    isCollapsed && "opacity-0 pointer-events-none hidden", // Hiding content when collapsed
                )}
            >
                <div className="p-4 border-b border-border">
                    <Button onClick={onNewChat} className="w-full bg-primary hover:bg-primary/90 transition-all duration-200">
                        <PlusCircle className="h-5 w-5 mr-2" />
                        New Chat
                    </Button>
                </div>

                {/* Chat List */}
                <ScrollArea className="flex-1 p-2">
                    <div className="space-y-2">
                        {chats.map((chat) => (
                            <div
                                key={chat.id}
                                className={cn(
                                    "group relative rounded-lg p-3 cursor-pointer transition-all duration-200 hover:bg-accent/50",
                                    currentChatId === chat.id && "bg-accent",
                                )}
                                onClick={() => onChatSelect(chat.id)}
                            >
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                                    <span className="flex-1 truncate text-sm">{chat.title}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onDeleteChat(chat.id)
                                        }}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                {/* Gallery Button */}
                <div className="p-4 border-t border-border">
                    <Button
                        onClick={onShowGallery}
                        variant="outline"
                        className="w-full transition-all duration-200 bg-transparent"
                    >
                        <ImageIcon className="h-5 w-5 mr-2" />
                        Gallery
                    </Button>
                </div>
            </div>

            {/* Collapsed State Icons */}
            {isCollapsed && (
                <div className="flex flex-col items-center pt-16 gap-4">
                    <Button variant="ghost" size="icon" onClick={onNewChat} title="New Chat">
                        <PlusCircle className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onShowGallery} title="Gallery">
                        <ImageIcon className="h-5 w-5" />
                    </Button>
                </div>
            )}
        </div>
    )
}
