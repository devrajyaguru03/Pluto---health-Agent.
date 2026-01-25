"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { PlutoLogo } from "@/components/pluto-logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Send,
  User,
  Bot,
  Stethoscope,
  Thermometer,
  Heart,
  Brain,
  Pill,
  AlertTriangle,
  Menu,
  X,
} from "lucide-react"

const QUICK_PROMPTS = [
  {
    icon: <Stethoscope className="h-4 w-4" />,
    title: "Symptom Check",
    prompt: "I have a headache and feeling tired. What could be the cause?",
  },
  {
    icon: <Thermometer className="h-4 w-4" />,
    title: "Fever Analysis",
    prompt: "I have a fever of 101°F with body aches. What should I do?",
  },
  {
    icon: <Heart className="h-4 w-4" />,
    title: "Heart Health",
    prompt: "What are the signs of good heart health I should look for?",
  },
  {
    icon: <Brain className="h-4 w-4" />,
    title: "Mental Wellness",
    prompt: "I've been feeling anxious lately. What are some coping strategies?",
  },
  {
    icon: <Pill className="h-4 w-4" />,
    title: "Medication Info",
    prompt: "What should I know about taking over-the-counter pain relievers?",
  },
  {
    icon: <AlertTriangle className="h-4 w-4" />,
    title: "When to Seek Help",
    prompt: "What symptoms indicate I should see a doctor immediately?",
  },
]

export default function ChatPage() {
  const [input, setInput] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  })

  const isLoading = status === "streaming" || status === "submitted"

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput("")
  }

  const handleQuickPrompt = (prompt: string) => {
    if (isLoading) return
    sendMessage({ text: prompt })
    setSidebarOpen(false)
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [input])

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col transform transition-transform duration-300 ease-in-out lg:transform-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link href="/">
            <PlutoLogo size="sm" />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Quick Health Prompts
            </p>
            <div className="space-y-2">
              {QUICK_PROMPTS.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickPrompt(item.prompt)}
                  disabled={isLoading}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left text-sm text-card-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-primary">{item.icon}</span>
                  <span>{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Disclaimer:</strong> Pluto provides
              health information for educational purposes only. Always consult a
              healthcare professional for medical advice.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-card-foreground">Pluto Health Assistant</p>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? "Analyzing..." : "Online"}
                </p>
              </div>
            </div>
          </div>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Sign In
            </Button>
          </Link>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6">
                <PlutoLogo size="md" showText={false} />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Welcome to Pluto
              </h2>
              <p className="text-muted-foreground max-w-md mb-8">
                I&apos;m your AI health assistant. Describe your symptoms or ask any
                health-related questions, and I&apos;ll provide helpful insights.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {QUICK_PROMPTS.slice(0, 4).map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickPrompt(item.prompt)}
                    disabled={isLoading}
                    className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-left disabled:opacity-50"
                  >
                    <span className="text-primary">{item.icon}</span>
                    <span className="text-sm text-card-foreground">{item.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-4 px-4 py-6",
                    message.role === "user"
                      ? "bg-muted/30"
                      : "bg-transparent"
                  )}
                >
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-gradient-to-br from-primary to-secondary text-primary-foreground"
                    )}
                  >
                    {message.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {message.role === "user" ? "You" : "Pluto"}
                    </p>
                    <div className="prose prose-sm max-w-none text-foreground">
                      {message.parts.map((part, index) => {
                        if (part.type === "text") {
                          return (
                            <div
                              key={index}
                              className="whitespace-pre-wrap leading-relaxed"
                            >
                              {part.text}
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
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Pluto
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Analyzing your health query...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-card p-4">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2 rounded-xl border border-border bg-input p-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
                placeholder="Describe your symptoms or ask a health question..."
                disabled={isLoading}
                rows={1}
                className="flex-1 resize-none bg-transparent border-0 focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground py-2 px-2 max-h-36"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                size="icon"
                className="h-10 w-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0"
              >
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
