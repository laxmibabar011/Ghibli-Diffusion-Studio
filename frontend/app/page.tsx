"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { ChatWindow } from "@/components/chat-window"
import { Gallery } from "@/components/gallery"
import { ThemeProvider } from "@/components/theme-provider"
import { ProfileDropdown } from "@/components/profile-dropdown"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import type { Chat, Message, GeneratedImage } from "@/types"

export default function Page() {
  const router = useRouter()

  // --- STATE ---
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [chats, setChats] = useState<Chat[]>([]) // Maps to 'sessions'
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<GeneratedImage[]>([]) // For gallery
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [showGallery, setShowGallery] = useState(false)

  // App specific state
  const [userId, setUserId] = useState<number | null>(null)
  const [guidance, setGuidance] = useState(1.5) // Keeping default settings for now
  const [strength, setStrength] = useState(0.55)

  // Auth Helper
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("token")
    const headers = {
      ...options.headers,
      "Authorization": `Bearer ${token}`
    } as HeadersInit

    try {
      const res = await fetch(url, { ...options, headers })
      if (res.status === 401) {
        localStorage.removeItem("token")
        router.replace("/login")
        return null
      }
      if (!res.ok) return null
      return await res.json()
    } catch (err) {
      return null
    }
  }

  // Initial Load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        router.replace("/login")
        return
      }

      const userData = await authFetch("http://localhost:8000/users/me")
      if (userData) setUserId(userData.id)

      const data = await authFetch("http://localhost:8000/chats")
      if (data) {
        // Map backend sessions to Chat interface (mocking messages for the list)
        const mappedChats: Chat[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          messages: [],
          createdAt: new Date()
        }))
        setChats(mappedChats)
        if (mappedChats.length > 0) setCurrentChatId(mappedChats[0].id)
        setIsCheckingAuth(false)
      }
    }
    checkAuth()
  }, [])

  // Fetch Messages when Chat Changes
  useEffect(() => {
    const fetchMessages = async (id: string) => {
      const data = await authFetch(`http://localhost:8000/chats/${id}`)
      if (data) {
        // Ensure messages map correctly
        setMessages(data)
      }
    }

    if (currentChatId && !isCheckingAuth) {
      fetchMessages(currentChatId)
    }
  }, [currentChatId, isCheckingAuth])

  // WebSocket Connection
  useEffect(() => {
    if (!userId) return

    const ws = new WebSocket(`ws://localhost:8000/ws/${userId}`)

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log("[WS] Received:", data) // DEBUG log

      setMessages((prev) => {
        // Check if we have the message
        const exists = prev.some(m => m.taskId === data.taskId)
        if (!exists) {
          console.warn("[WS] No matching message found for task:", data.taskId)
        }

        return prev.map(msg => {
          if (msg.taskId === data.taskId) {
            console.log("[WS] Updating message:", msg.id, "Status:", data.status)
            const isComplete = data.status === "COMPLETED"
            if (isComplete || data.status === "FAILED") {
              setLoading(false)
            }

            return {
              ...msg,
              status: data.status,
              image: data.result,
              content: data.status === "FAILED" ? "Generation Failed ❌" : (data.content || msg.content)
            }
          }
          return msg
        })
      })
    }

    return () => ws.close()
  }, [userId])

  // POLLING FALLBACK (For background tabs or lost WS connections)
  // Checks any "PENDING" message every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const pendingMessages = messages.filter(m => m.status === "PENDING" && m.taskId)
      if (pendingMessages.length === 0) return

      for (const msg of pendingMessages) {
        console.log("[Polling] Checking task:", msg.taskId)
        const res = await authFetch(`http://localhost:8000/tasks/${msg.taskId}`)
        if (res && (res.status === "COMPLETED" || res.status === "FAILED")) {
          console.log("[Polling] Task updated:", res)
          setMessages(prev => prev.map(m => {
            if (m.taskId === msg.taskId) {
              if (res.status === "COMPLETED" || res.status === "FAILED") setLoading(false)
              return {
                ...m,
                status: res.status,
                image: res.result,
                content: res.status === "FAILED" ? "Generation Failed ❌" : (res.content || m.content)
              }
            }
            return m
          }))
        }
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [messages])

  // Actions
  const createNewChat = async () => {
    // Optimistic default. The backend handles real ID. 
    // We fetch immediately after to sync state if needed, or trust the response.
    const newSession = await authFetch("http://localhost:8000/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "" }), // Backend will assign "Chat N"
    })
    if (newSession) {
      const newChat: Chat = {
        id: newSession.id,
        title: newSession.title,
        messages: [],
        createdAt: new Date()
      }
      setChats([newChat, ...chats])
      setCurrentChatId(newChat.id)
      setMessages([])
      setShowGallery(false)
    }
  }

  const deleteChat = async (chatId: string) => {
    // Call API to soft-delete
    const res = await authFetch(`http://localhost:8000/chats/${chatId}`, {
      method: "DELETE"
    })

    if (res) {
      setChats(chats.filter(c => c.id !== chatId))
      if (currentChatId === chatId) setCurrentChatId(null)
    }
  }

  const fetchGallery = async () => {
    const data = await authFetch("http://localhost:8000/gallery")
    if (data && data.images) {
      // Map strings to GeneratedImage objects
      const mappedImages: GeneratedImage[] = data.images.map((url: string, idx: number) => ({
        id: `gallery-${idx}`,
        url: url,
        prompt: "Saved Image", // Backend API might need update to return prompt
        timestamp: new Date(),
        chatId: "unknown"
      }))
      setImages(mappedImages)
    }
  }

  // Handle Send from ChatWindow
  const handleSendMessage = async (content: string, file: File | null) => {
    if (!currentChatId) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content || "Image Upload",
      image: file ? URL.createObjectURL(file) : undefined,
      timestamp: new Date()
    }

    const taskId = crypto.randomUUID()
    console.log("[UI] Created Task ID:", taskId) // DEBUG log

    const aiPlaceholder: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "Dreaming...",
      status: "PENDING",
      taskId: taskId, // Use generated ID immediately
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg, aiPlaceholder])
    setLoading(true)

    try {
      const token = localStorage.getItem("token")
      let res

      if (file) {
        const formData = new FormData()
        formData.append("chat_id", currentChatId)
        formData.append("prompt", content || "make it ghibli style")
        formData.append("file", file)
        formData.append("strength", strength.toString())
        formData.append("guidance", guidance.toString())
        formData.append("id", taskId) // Send Client ID to backend

        res = await fetch("http://localhost:8000/remix", {
          method: "POST",
          body: formData,
          headers: { "Authorization": `Bearer ${token}` }
        })
      } else {
        res = await fetch("http://localhost:8000/draw", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            chat_id: currentChatId,
            prompt: content,
            guidance: guidance,
            id: taskId // Send to backend
          })
        })
      }

      if (res && res.ok) {
        // No need to update taskId anymore as it's already set correctly!
      } else {
        setLoading(false)
      }
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"))
  }

  // Computed Current Chat
  const currentChat: Chat | undefined = currentChatId ? {
    ...(chats.find(c => c.id === currentChatId) || { id: currentChatId, title: "Chat", messages: [] }),
    messages: messages // Use the live messages state
  } : undefined

  if (isCheckingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/95 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">G</div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-foreground tracking-tight">Ghibli Studio</h1>
              <p className="text-xs text-muted-foreground">AI Image Generator</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full transition-transform hover:scale-110"
            >
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <ProfileDropdown />
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <Sidebar
            chats={chats}
            currentChatId={currentChatId}
            onChatSelect={(id) => { setCurrentChatId(id); setShowGallery(false); }}
            onNewChat={createNewChat}
            onDeleteChat={deleteChat}
            onShowGallery={() => { fetchGallery(); setShowGallery(true); }}
          />

          {/* Main Content */}
          <div className="flex-1 flex flex-col relative min-w-0">
            {showGallery ? (
              <Gallery images={images} onClose={() => setShowGallery(false)} />
            ) : (
              <ChatWindow
                chat={currentChat}
                onSendMessage={handleSendMessage}
                isGenerating={loading}
              />
            )}
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}