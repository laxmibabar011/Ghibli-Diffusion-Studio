export interface Message {
    id: string
    role: "user" | "assistant"
    content: string
    image?: string // Changed from imageUrl to match backend 'image'
    imageUrl?: string // Keep for V0 compatibility if needed
    timestamp?: Date | string
    status?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
    taskId?: string
}

export interface Chat {
    id: string
    title: string
    messages: Message[]
    createdAt?: Date
}

export interface GeneratedImage {
    id: string
    url: string
    prompt: string
    timestamp: Date
    chatId: string
}
