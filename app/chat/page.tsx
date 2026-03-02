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
  Trash2,
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

  // Auth & session state
  const [user, setUser] = useState<UserInfo | null>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null)
  const [historyMessages, setHistoryMessages] = useState<HistoryMessage[] | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

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

  // ─── Live chat (new session) ───────────────────────────────────

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onFinish: async ({ message }) => {
      // After AI responds, save the pair and refresh sidebar
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

  // ─── Start a new chat session ──────────────────────────────────

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
    if (!input.trim() || isLoading) return
    const text = input.trim()

    // If authenticated and no session yet, create one
    if (user && !currentSessionId && historyMessages === null) {
      const id = await createSession(text)
      if (id) {
        setCurrentSessionId(id)
        await refreshSessions()
      }
    }

    setInput("")
    setHistoryMessages(null) // Back to live mode
    sendMessage({ text })
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
    setMessages([]) // clear live messages

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

  // ─── Start a brand new chat ───────────────────────────────────

  const startNewChat = () => {
    setCurrentSessionId(null)
    setHistoryMessages(null)
    setMessages([])
    setInput("")
    setSidebarOpen(false)
  }

  // ─── Delete a session ─────────────────────────────────────────

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

  // ─── Logout ───────────────────────────────────────────────────

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    setSessions([])
    startNewChat()
  }

  // ─── Render messages (history or live) ───────────────────────

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

    // Show past session
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
          {/* Continue chat button */}
          <div className="flex justify-center py-4">
            <Button variant="outline" size="sm" onClick={() => {
              setHistoryMessages(null)
              setMessages([])
            }} className="gap-2">
              <Send className="h-3 w-3" /> Continue this conversation
            </Button>
          </div>
          <div ref={messagesEndRef} />
        </div>
      )
    }

    // Show empty state or live messages
    if (messages.length === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6">
            <PlutoLogo size="md" showText={false} />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {user ? `Welcome back, ${user.name.split(" ")[0]}!` : "Welcome to Pluto"}
          </h2>
          <p className="text-muted-foreground max-w-md mb-8">
            {user
              ? "Your conversations are saved. Start a new health query below."
              : "I'm your AI health assistant. Describe your symptoms or ask any health-related questions."}
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
                <span className="text-sm text-muted-foreground">Analyzing your health query...</span>
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
        {/* Sidebar header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link href="/"><PlutoLogo size="sm" /></Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
          {/* New Chat button */}
          <button
            onClick={startNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </button>

          {/* Chat History (authenticated users) */}
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

          {/* Quick Prompts */}
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

        {/* Sidebar footer - user info or sign in */}
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
            <div className="relative flex items-end gap-2 rounded-xl border border-border bg-input p-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e) }
                }}
                placeholder="Describe your symptoms or ask a health question..."
                disabled={isLoading}
                rows={1}
                className="flex-1 resize-none bg-transparent border-0 focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground py-2 px-2 max-h-36"
              />
              <Button type="submit" disabled={isLoading || !input.trim()} size="icon"
                className="h-10 w-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0">
                <Send className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Pluto may make mistakes. Always verify health information with a professional.
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
