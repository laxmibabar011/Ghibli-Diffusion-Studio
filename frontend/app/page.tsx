"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// --- TYPES ---
interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string;
  taskId?: string; // Track async task
  status?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
}

interface Session {
  id: string;
  title: string;
}

export default function GhibliApp() {
  const router = useRouter();

  // --- STATE ---
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [guidance, setGuidance] = useState(1.5); // Default for LCM
  const [strength, setStrength] = useState(0.55);
  const [userId, setUserId] = useState<number | null>(null);

  // File Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // --- 1. INITIAL AUTH CHECK ---
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/login");
        return;
      }

      // Fetch User Info for WebSocket
      const userData = await authFetch("http://localhost:8000/users/me");
      if (userData) setUserId(userData.id);

      const data = await authFetch("http://localhost:8000/chats");
      if (data) {
        setSessions(data);
        if (data.length > 0) setActiveSessionId(data[0].id);
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (activeSessionId && !isCheckingAuth) fetchMessages(activeSessionId);
  }, [activeSessionId, isCheckingAuth]);

  // --- WEBSOCKET CONNECTION ---
  useEffect(() => {
    if (!userId) return;

    const ws = new WebSocket(`ws://localhost:8000/ws/${userId}`);

    ws.onopen = () => {
      console.log("Connected to WebSocket");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WS Message:", data);

      setMessages((prev) => prev.map(msg => {
        if (msg.taskId === data.taskId) {
          const isComplete = data.status === "COMPLETED";
          if (isComplete || data.status === "FAILED") {
            setLoading(false);
          }

          return {
            ...msg,
            status: data.status,
            image: data.result,
            content: isComplete ? (msg.content.includes("Remix") ? "Remix complete:" : "Here is your art:") : msg.content
          };
        }
        return msg;
      }));
    };

    ws.onclose = () => console.log("Disconnected from WebSocket");

    return () => {
      ws.close();
    };
  }, [userId]);

  // --- 2. SILENT AUTH FETCH ---
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("token");
    const headers = {
      ...options.headers,
      "Authorization": `Bearer ${token}`
    } as HeadersInit;

    try {
      const res = await fetch(url, { ...options, headers });
      if (res.status === 401) {
        localStorage.removeItem("token");
        router.replace("/login");
        return null;
      }
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      return null;
    }
  };

  // --- DATA FETCHING ---
  const createSession = async () => {
    const newSession = await authFetch("http://localhost:8000/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `Chat ${sessions.length + 1}` }),
    });
    if (newSession) {
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession.id);
      setMessages([]);
    }
  };

  const fetchMessages = async (id: string) => {
    const data = await authFetch(`http://localhost:8000/chats/${id}`);
    if (data) setMessages(data);
  };

  const fetchGallery = async () => {
    const data = await authFetch("http://localhost:8000/gallery");
    if (data) setGalleryImages(data.images);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleSend = async () => {
    if ((!input && !selectedFile) || !activeSessionId) return;

    // 1. Add User Message
    const userMsg: Message = {
      role: "user",
      content: input || "Image Upload",
      image: selectedFile ? URL.createObjectURL(selectedFile) : undefined
    };

    // 2. Add Placeholder AI Message
    const aiPlaceholder: Message = {
      role: "assistant",
      content: "Dreaming...",
      status: "PENDING",
      taskId: "temp-id" // Will be updated
    };

    setMessages((prev) => [...prev, userMsg, aiPlaceholder]);
    setLoading(true);
    setInput("");
    const currentFile = selectedFile; // Capture for upload
    setSelectedFile(null);

    try {
      let res;
      const token = localStorage.getItem("token");
      let taskId = "";

      if (currentFile) {
        const formData = new FormData();
        formData.append("chat_id", activeSessionId);
        formData.append("prompt", input || "make it ghibli style");
        formData.append("file", currentFile);
        formData.append("strength", strength.toString());
        formData.append("guidance", guidance.toString());

        res = await fetch("http://localhost:8000/remix", {
          method: "POST",
          body: formData,
          headers: { "Authorization": `Bearer ${token}` }
        });
      } else {
        res = await fetch("http://localhost:8000/draw", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            chat_id: activeSessionId,
            prompt: userMsg.content,
            guidance: guidance
          }),
        });
      }

      if (res && res.ok) {
        const data = await res.json();
        taskId = data.task_id;

        // Update placeholder with real Task ID
        setMessages((prev) => prev.map(msg =>
          msg.taskId === "temp-id" ? { ...msg, taskId: taskId } : msg
        ));

        // No more polling! WebSocket will handle updates.
      } else {
        setLoading(false);
        // Handle error (remove placeholder or show error)
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // --- 3. VIEW STATE ---
  const [view, setView] = useState<"chat" | "gallery">("chat");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans overflow-hidden">

      {/* SIDEBAR */}
      <div className="w-64 bg-gray-950 flex flex-col border-r border-gray-800 flex-shrink-0">
        <div className="p-5">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 mb-6 tracking-wide">
            GHIBLI STUDIO
          </h1>
          <button onClick={createSession} className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all border border-gray-700 hover:border-gray-600">
            <span>+</span> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          {sessions.map((s) => (
            <button key={s.id} onClick={() => { setActiveSessionId(s.id); setView("chat"); }} className={`w-full text-left px-4 py-3 rounded-lg text-sm truncate transition-colors ${activeSessionId === s.id && view === "chat" ? "bg-gray-800 text-white" : "text-gray-400 hover:bg-gray-900 hover:text-gray-200"}`}>
              {s.title}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-gray-800 space-y-2">
          <button onClick={() => { setView("gallery"); fetchGallery(); }} className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${view === "gallery" ? "bg-orange-600 text-white" : "bg-transparent text-gray-400 hover:text-white"}`}>
            🖼 View Gallery
          </button>
          <button onClick={handleLogout} className="w-full py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-gray-900 transition-colors">
            Log Out
          </button>
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col relative bg-gradient-to-b from-gray-900 to-gray-900">

        {/* HEADER */}
        <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="text-sm text-gray-400">
            {view === "chat" ? "Current Session" : "Art Gallery"}
          </div>

          <div className="relative">
            <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-full hover:bg-gray-800 transition ${showSettings ? 'text-orange-400 bg-gray-800' : 'text-gray-400'}`} title="Advanced Settings">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>

            {showSettings && (
              <div className="absolute right-0 top-12 w-72 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-4 z-20">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-4">Generation Settings</h3>
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1"><span className="text-gray-300">Creativity (LCM)</span><span className="text-orange-400">{guidance}</span></div>
                  <input type="range" min="1" max="3" step="0.1" value={guidance} onChange={(e) => setGuidance(parseFloat(e.target.value))} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1"><span>Strict</span><span>Wild</span></div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs mb-1"><span className="text-gray-300">Remix Strength</span><span className="text-orange-400">{strength}</span></div>
                  <input type="range" min="0.1" max="1.0" step="0.05" value={strength} onChange={(e) => setStrength(parseFloat(e.target.value))} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1"><span>Subtle</span><span>Extreme</span></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* GALLERY VIEW */}
        {view === "gallery" && (
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {galleryImages.map((url, idx) => (
                <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-800 border border-gray-800 hover:border-orange-500/50 transition duration-300">
                  <img src={url} alt="Gallery" className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <a href={url} download className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full backdrop-blur-sm text-xs font-bold border border-white/20">Download</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CHAT VIEW */}
        {view === "chat" && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50 select-none">
                  <div className="text-6xl mb-4">🎨</div>
                  <p className="text-lg font-light">Imagine something wonderful...</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-5 py-4 ${msg.role === "user" ? "bg-orange-600 text-white rounded-br-none" : "bg-gray-800 text-gray-200 rounded-bl-none"}`}>
                      {msg.role === "assistant" && <div className="text-orange-500 text-xs font-bold mb-1 uppercase tracking-wider">Ghibli Bot</div>}

                      {msg.image && (
                        <div className={`mb-3 rounded-lg overflow-hidden border border-white/10 shadow-lg ${msg.role === 'user' ? 'w-40' : 'w-full'}`}>
                          <img src={msg.image} alt="Content" className="w-full h-auto object-cover" />
                        </div>
                      )}

                      {msg.status && msg.status !== "COMPLETED" && (
                        <div className="flex items-center gap-2 text-sm text-orange-400 mb-2">
                          <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                          <span>{msg.status === "PENDING" ? "Queued..." : "Painting..."}</span>
                        </div>
                      )}

                      {msg.content && <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* INPUT AREA */}
            <div className="w-full bg-gray-900 p-4 pb-6">
              <div className="max-w-4xl mx-auto bg-gray-800 rounded-xl p-2 flex items-end gap-2 border border-gray-700 shadow-lg relative">
                {selectedFile && (
                  <div className="absolute -top-12 left-0 bg-gray-800 border border-gray-700 p-2 rounded-lg flex items-center gap-3 shadow-xl">
                    <div className="w-8 h-8 bg-gray-700 rounded overflow-hidden"><img src={URL.createObjectURL(selectedFile)} className="w-full h-full object-cover" /></div>
                    <span className="text-xs text-gray-300 max-w-[150px] truncate">{selectedFile.name}</span>
                    <button onClick={() => setSelectedFile(null)} className="text-gray-500 hover:text-red-400 px-1">✕</button>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} />
                <button onClick={() => fileInputRef.current?.click()} className={`p-3 rounded-lg transition-colors ${selectedFile ? "text-orange-400 bg-orange-400/10" : "text-gray-400 hover:text-white hover:bg-gray-700"}`} title="Upload Image">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                </button>
                <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={selectedFile ? "How should I remix this image?" : "Describe a scene..."} className="flex-1 bg-transparent text-white placeholder-gray-500 p-3 h-12 max-h-32 resize-none focus:outline-none text-sm leading-relaxed custom-scrollbar" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
                <button onClick={handleSend} disabled={loading || (!input && !selectedFile)} className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:hover:bg-orange-600 text-white p-3 rounded-lg transition-all shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
              </div>
              <div className="text-center mt-2"><p className="text-[10px] text-gray-600">Turbo Mode Active: 4-step generation.</p></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}