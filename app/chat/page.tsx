"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { PlutoLogo } from "@/components/pluto-logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Send, User, Bot, Stethoscope, Thermometer, Heart, Brain,
  Pill, AlertTriangle, Menu, X, Plus, MessageSquare, LogOut, History,
  Trash2, Paperclip, FileText, ImageIcon,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────

interface ChatSession {
  id: number
  title: string
  created_at: string
  updated_at: string
}

interface UserInfo {
  id: number
  name: string
  email: string
}

interface HistoryMessage {
  id: number
  role: "user" | "assistant"
  content: string
  created_at: string
}

interface AttachedFile {
  name: string
  type: string       // MIME type
  dataUrl: string    // base64 data URL
  preview?: string   // For images: same as dataUrl, for PDFs: null
}

// ─── Prompts ─────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  { icon: <Stethoscope className="h-4 w-4" />, title: "Symptom Check", prompt: "I have a headache and feeling tired. What could be the cause?" },
  { icon: <Thermometer className="h-4 w-4" />, title: "Fever Analysis", prompt: "I have a fever of 101F with body aches. What should I do?" },
  { icon: <Heart className="h-4 w-4" />, title: "Heart Health", prompt: "What are the signs of good heart health I should look for?" },
  { icon: <Brain className="h-4 w-4" />, title: "Mental Wellness", prompt: "I've been feeling anxious lately. What are some coping strategies?" },
  { icon: <Pill className="h-4 w-4" />, title: "Medication Info", prompt: "What should I know about taking over-the-counter pain relievers?" },
  { icon: <AlertTriangle className="h-4 w-4" />, title: "When to Seek Help", prompt: "What symptoms indicate I should see a doctor immediately?" },
]

// ─── Component ───────────────────────────────────────────────────

export default function ChatPage() {
  const [input, setInput] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auth & session state
  const [user, setUser] = useState<UserInfo | null>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null)
  const [historyMessages, setHistoryMessages] = useState<HistoryMessage[] | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // File attachment state
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  // ─── Fetch user on mount ───────────────────────────────────────

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user) })
      .catch(() => { })
  }, [])

  // ─── Fetch sessions when user is known ────────────────────────

  const refreshSessions = useCallback(async () => {
    if (!user) return
    try {
      const r = await fetch("/api/chat/sessions")
      const d = await r.json()
      if (d.sessions) setSessions(d.sessions)
    } catch { }
  }, [user])

  useEffect(() => { refreshSessions() }, [refreshSessions])

  // ─── Live chat ─────────────────────────────────────────────────

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onFinish: async ({ message }) => {
      if (user && currentSessionId) {
        const lastUser = [...messages].reverse().find(m => m.role === "user")
        const userContent = lastUser?.parts
          ?.filter((p: any) => p.type === "text")
          .map((p: any) => p.text as string)
          .join("") || ""
        const assistantContent = (message as any).parts
          ?.filter((p: any) => p.type === "text")
          .map((p: any) => p.text as string)
          .join("") || (message as any).content || ""
        if (userContent && assistantContent) {
          await fetch(`/api/chat/sessions/${currentSessionId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userMessage: userContent, assistantMessage: assistantContent }),
          }).catch(() => { })
          await refreshSessions()
        }
      }
    },
  })

  const isLoading = status === "streaming" || status === "submitted"

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, historyMessages])

  useEffect(() => {
    const ta = textareaRef.current
    if (ta) { ta.style.height = "auto"; ta.style.height = `${Math.min(ta.scrollHeight, 150)}px` }
  }, [input])

  // ─── File Handling ─────────────────────────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileError(null)

    // Validate type
    const isImage = file.type.startsWith("image/")
    const isPdf = file.type === "application/pdf"

    if (!isImage && !isPdf) {
      setFileError("Only images (JPG, PNG, WEBP) and PDF files are supported.")
      e.target.value = ""
      return
    }

    // Validate size: 4MB max for base64
    if (file.size > 4 * 1024 * 1024) {
      setFileError("File is too large. Maximum size is 4MB.")
      e.target.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setAttachedFile({
        name: file.name,
        type: file.type,
        dataUrl,
        preview: isImage ? dataUrl : undefined,
      })
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const removeAttachment = () => {
    setAttachedFile(null)
    setFileError(null)
  }

  // ─── Session helpers ───────────────────────────────────────────

  const createSession = useCallback(async (firstMessage: string): Promise<number | null> => {
    if (!user) return null
    const title = firstMessage.length > 50 ? firstMessage.slice(0, 50) + "…" : firstMessage
    try {
      const r = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      })
      const d = await r.json()
      return d.session?.id || null
    } catch { return null }
  }, [user])

  // ─── Handle send ──────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if ((!text && !attachedFile) || isLoading) return

    // Create session if needed
    if (user && !currentSessionId && historyMessages === null) {
      const label = text || (attachedFile ? `[File: ${attachedFile.name}]` : "New chat")
      const id = await createSession(label)
      if (id) { setCurrentSessionId(id); await refreshSessions() }
    }

    const parts: any[] = []

    // Add image/file part FIRST for clarity
    if (attachedFile) {
      if (attachedFile.type.startsWith("image/")) {
        parts.push({ type: "image", data: attachedFile.dataUrl })
      } else {
        // PDF: extract via base64 text hint
        parts.push({
          type: "image",
          data: attachedFile.dataUrl,
        })
      }
    }

    // Add the text part
    parts.push({
      type: "text",
      text: text || (attachedFile ? `Please analyze this ${attachedFile.type.startsWith("image/") ? "image" : "document"} and provide health insights.` : ""),
    })

    setInput("")
    setAttachedFile(null)
    setHistoryMessages(null)

    sendMessage({
      text: text || `[Analyzing ${attachedFile?.name}]`,
      parts,
    } as any)
  }

  const handleQuickPrompt = async (prompt: string) => {
    if (isLoading) return
    setSidebarOpen(false)
    if (user && !currentSessionId) {
      const id = await createSession(prompt)
      if (id) { setCurrentSessionId(id); await refreshSessions() }
    }
    setHistoryMessages(null)
    sendMessage({ text: prompt })
  }

  // ─── Load a past session ──────────────────────────────────────

  const loadSession = async (session: ChatSession) => {
    setLoadingHistory(true)
    setSidebarOpen(false)
    setCurrentSessionId(session.id)
    setMessages([])
    try {
      const r = await fetch(`/api/chat/sessions/${session.id}`)
      const d = await r.json()
      setHistoryMessages(d.session?.messages || [])
    } catch {
      setHistoryMessages([])
    } finally {
      setLoadingHistory(false)
    }
  }

  const startNewChat = () => {
    setCurrentSessionId(null)
    setHistoryMessages(null)
    setMessages([])
    setInput("")
    setAttachedFile(null)
    setSidebarOpen(false)
  }

  const deleteSession = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingId(id)
    try {
      await fetch(`/api/chat/sessions/${id}`, { method: "DELETE" })
      if (currentSessionId === id) startNewChat()
      await refreshSessions()
    } catch { } finally {
      setDeletingId(null)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    setSessions([])
    startNewChat()
  }

  // ─── Render messages ──────────────────────────────────────────

  const renderMessages = () => {
    if (loadingHistory) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      )
    }

    if (historyMessages !== null) {
      return (
        <div className="max-w-3xl mx-auto py-4">
          {historyMessages.length === 0 && (
            <p className="text-center text-muted-foreground py-10 text-sm">No messages in this session.</p>
          )}
          {historyMessages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-4 px-4 py-6", msg.role === "user" ? "bg-muted/30" : "bg-transparent")}>
              <div className={cn("h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-gradient-to-br from-primary to-secondary text-primary-foreground")}>
                {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1">{msg.role === "user" ? (user?.name || "You") : "Pluto"}</p>
                <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              </div>
            </div>
          ))}
          <div className="flex justify-center py-4">
            <Button variant="outline" size="sm" onClick={() => { setHistoryMessages(null); setMessages([]) }} className="gap-2">
              <Send className="h-3 w-3" /> Continue this conversation
            </Button>
          </div>
          <div ref={messagesEndRef} />
        </div>
      )
    }

    if (messages.length === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6">
            <PlutoLogo size="md" showText={false} />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {user ? `Welcome back, ${user.name.split(" ")[0]}!` : "Welcome to Pluto"}
          </h2>
          <p className="text-muted-foreground max-w-md mb-2">
            {user
              ? "Your conversations are saved. Start a new health query below."
              : "I'm your AI health assistant. Describe your symptoms or ask any health-related questions."}
          </p>
          <p className="text-xs text-muted-foreground max-w-md mb-8 flex items-center gap-1.5">
            <Paperclip className="h-3 w-3" />
            You can also attach blood reports, X-rays, or photos of body parts for AI analysis
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
            {QUICK_PROMPTS.slice(0, 4).map((item, index) => (
              <button key={index} onClick={() => handleQuickPrompt(item.prompt)} disabled={isLoading}
                className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-left disabled:opacity-50">
                <span className="text-primary">{item.icon}</span>
                <span className="text-sm text-card-foreground">{item.title}</span>
              </button>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="max-w-3xl mx-auto py-4">
        {messages.map((message) => (
          <div key={message.id} className={cn("flex gap-4 px-4 py-6", message.role === "user" ? "bg-muted/30" : "bg-transparent")}>
            <div className={cn("h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
              message.role === "user" ? "bg-primary text-primary-foreground" : "bg-gradient-to-br from-primary to-secondary text-primary-foreground")}>
              {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1">{message.role === "user" ? (user?.name || "You") : "Pluto"}</p>
              <div className="prose prose-sm max-w-none text-foreground">
                {message.parts.map((part: any, index: number) => {
                  if (part.type === "text") {
                    return <div key={index} className="whitespace-pre-wrap leading-relaxed">{part.text}</div>
                  }
                  // Show image preview in chat
                  if (part.type === "image" && part.data) {
                    return (
                      <div key={index} className="mt-2 mb-2">
                        {part.data.startsWith("data:image/") ? (
                          <img
                            src={part.data}
                            alt="Attached image"
                            className="max-w-xs max-h-64 rounded-lg border border-border object-contain"
                          />
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 w-fit">
                            <FileText className="h-4 w-4" />
                            <span>Document attached</span>
                          </div>
                        )}
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-4 px-4 py-6">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground mb-1">Pluto</p>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-sm text-muted-foreground">
                  {messages.some((m: any) => m.parts?.some((p: any) => p.type === "image"))
                    ? "Analyzing your report/image..."
                    : "Analyzing your health query..."}
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    )
  }

  // ─── JSX ──────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col transform transition-transform duration-300 ease-in-out lg:transform-none",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link href="/"><PlutoLogo size="sm" /></Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
          <button
            onClick={startNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </button>

          {user && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                <History className="h-3 w-3" /> Chat History
              </p>
              {sessions.length === 0 ? (
                <p className="text-xs text-muted-foreground px-1 py-2">No saved sessions yet.</p>
              ) : (
                <div className="space-y-1">
                  {sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => loadSession(session)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-colors group",
                        currentSessionId === session.id && historyMessages !== null
                          ? "bg-primary/10 text-primary"
                          : "text-card-foreground hover:bg-muted"
                      )}
                    >
                      <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">{session.title}</span>
                      <button
                        onClick={(e) => deleteSession(session.id, e)}
                        disabled={deletingId === session.id}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Quick Health Prompts
            </p>
            <div className="space-y-1">
              {QUICK_PROMPTS.map((item, index) => (
                <button key={index} onClick={() => handleQuickPrompt(item.prompt)} disabled={isLoading}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left text-sm text-card-foreground hover:bg-muted transition-colors disabled:opacity-50">
                  <span className="text-primary">{item.icon}</span>
                  <span>{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-card-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <button onClick={handleLogout} title="Sign out"
                className="ml-2 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Sign in to save your chat history</p>
              <Link href="/login" className="block">
                <Button size="sm" className="w-full">Sign In</Button>
              </Link>
            </div>
          )}
          <div className="mt-3 p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Disclaimer:</strong> Pluto provides health information for educational purposes only.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground">
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-card-foreground">Pluto Health Assistant</p>
                <p className="text-xs text-muted-foreground">{isLoading ? "Analyzing..." : "Online"}</p>
              </div>
            </div>
          </div>
          {!user && (
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Sign In</Button>
            </Link>
          )}
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">{renderMessages()}</div>

        {/* Input */}
        <div className="border-t border-border bg-card p-4">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">

            {/* File attachment preview */}
            {attachedFile && (
              <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
                {attachedFile.preview ? (
                  <img src={attachedFile.preview} alt="Preview" className="h-12 w-12 rounded object-cover flex-shrink-0 border border-border" />
                ) : (
                  <div className="h-12 w-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{attachedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {attachedFile.type.startsWith("image/") ? "Image" : "PDF"} · Ready to analyze
                  </p>
                </div>
                <button type="button" onClick={removeAttachment} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* File error */}
            {fileError && (
              <div className="mb-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                {fileError}
              </div>
            )}

            <div className="relative flex items-end gap-2 rounded-xl border border-border bg-input p-2">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />

              {/* Attach button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                title="Attach image or report"
                className={cn(
                  "flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                  attachedFile
                    ? "text-primary bg-primary/10 hover:bg-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {attachedFile?.type.startsWith("image/")
                  ? <ImageIcon className="h-5 w-5" />
                  : attachedFile
                    ? <FileText className="h-5 w-5" />
                    : <Paperclip className="h-5 w-5" />}
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e) }
                }}
                placeholder={attachedFile ? "Ask about this report or image... (or just press send)" : "Describe your symptoms or ask a health question..."}
                disabled={isLoading}
                rows={1}
                className="flex-1 resize-none bg-transparent border-0 focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground py-2 px-2 max-h-36"
              />
              <Button type="submit" disabled={isLoading || (!input.trim() && !attachedFile)} size="icon"
                className="h-10 w-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0">
                <Send className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Attach images or PDF reports · Pluto may make mistakes · Always verify with a professional
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
