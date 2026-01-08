"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, ImageIcon, Loader2 } from "lucide-react"
import { ChatBubble } from "@/components/chat-bubble"
import type { Chat, Message } from "@/types"

interface ChatWindowProps {
    chat?: Chat
    onSendMessage: (content: string, image: File | null) => void
    isGenerating?: boolean
}

export function ChatWindow({ chat, onSendMessage, isGenerating = false }: ChatWindowProps) {
    const [input, setInput] = useState("")
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [chat?.messages, isGenerating]) // Auto scroll on new messages or loading state

    const handleSend = async () => {
        if (!input.trim() || !chat) return

        onSendMessage(input, selectedImage)

        // Clear inputs
        setInput("")
        setSelectedImage(null)
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedImage(file)
        }
    }

    if (!chat) {
        return (
            <div className="flex-1 flex items-center justify-center overflow-hidden bg-background">
                <div className="text-center space-y-4 animate-in fade-in duration-500">
                    <div className="text-6xl">🎨</div>
                    <h2 className="text-2xl font-bold">Welcome to Ghibli Studio</h2>
                    <p className="text-muted-foreground">Create a new chat to start generating beautiful images</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6" ref={scrollRef}>
                <div className="max-w-4xl mx-auto space-y-6">
                    {chat.messages.map((message, index) => (
                        <ChatBubble key={message.id} message={message} index={index} />
                    ))}
                    {isGenerating && (
                        <div className="flex justify-start animate-in slide-in-from-left duration-300">
                            <div className="bg-accent text-accent-foreground rounded-2xl p-4 max-w-[70%]">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Generating your image...</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-border p-4 bg-card flex-shrink-0">
                <div className="max-w-4xl mx-auto space-y-3">
                    {selectedImage && (
                        <div className="flex items-center gap-2 p-2 bg-accent rounded-lg animate-in slide-in-from-bottom duration-200">
                            <ImageIcon className="h-4 w-4" />
                            <span className="text-sm flex-1 truncate">{selectedImage.name}</span>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedImage(null)} className="h-6 px-2">
                                Remove
                            </Button>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-shrink-0 transition-transform hover:scale-105"
                        >
                            <ImageIcon className="h-5 w-5" />
                        </Button>
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSend()
                                }
                            }}
                            placeholder="Describe the image you want to generate..."
                            className="min-h-[60px] max-h-[200px] resize-none flex-1"
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!input.trim() || isGenerating}
                            className="flex-shrink-0 transition-all hover:scale-105 disabled:scale-100"
                            size="icon"
                        >
                            <Send className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
