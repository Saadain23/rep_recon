"use client"

import * as React from "react"
import { Send, Bot, User} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { AssessmentReportDisplay } from "@/components/display-report"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  report?: any
}

export function ChatInterface() {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [progressMessage, setProgressMessage] = React.useState<string>("")
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const hasMessages = messages.length > 0

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userInput = input.trim()
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userInput,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setProgressMessage("Starting security assessment...")

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: userInput,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText || "Failed to get assessment" }
        }
        throw new Error(errorData.error || "Failed to get assessment")
      }

      if (!response.body) {
        throw new Error("No response body")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === "progress") {
                setProgressMessage(data.message)
              } else if (data.type === "complete") {
                if (data.report) {
                  const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: formatAssessmentReport(data.report),
                    timestamp: new Date(),
                    report: data.report,
                  }
                  setMessages((prev) => [...prev, assistantMessage])
                  setProgressMessage("")
                } else {
                  throw new Error("No report received")
                }
              } else if (data.type === "error") {
                throw new Error(data.error || "Unknown error")
              }
            } catch (parseError) {
              console.error("Error parsing SSE data:", parseError)
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. Please try again.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      setProgressMessage("")
    } finally {
      setIsLoading(false)
    }
  }

  const formatAssessmentReport = (report: any): string => {
    if (!report) return "No assessment data available"
    
    let formatted = `# Security Assessment Report\n\n`
    
    if (report.product) {
      formatted += `**Product:** ${report.product.productName || "Unknown"}\n`
      formatted += `**Vendor:** ${report.product.vendorName || "Unknown"}\n\n`
    }
    
    formatted += `**Trust Score:** ${report.trustScore || 0}/100\n`
    formatted += `**Risk Level:** ${report.riskLevel || "Unknown"}\n`
    formatted += `**Recommendation:** ${report.recommendation || "Further review needed"}\n\n`
    
    if (report.executiveSummary) {
      formatted += `## Executive Summary\n${report.executiveSummary}\n\n`
    }
    
    return formatted
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {!hasMessages ? (
        // Centered welcome screen with input
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center space-y-6 max-w-2xl w-full mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">Welcome to Security Assessment Agent</h2>
            <p className="text-lg text-muted-foreground">
              Enter an application name or URL to receive a comprehensive security assessment including entity resolution, CVE analysis, compliance review, and risk scoring.
            </p>
          </div>
          <div className="w-full max-w-3xl">
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter application name or URL (e.g., 'Slack' or 'https://slack.com')..."
                  className="min-h-[60px] max-h-[200px] resize-none rounded-2xl pr-[72px] py-3"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className={cn(
                    "absolute right-2 bottom-2 h-9 w-9 rounded-lg shrink-0",
                    "bg-foreground text-background hover:bg-foreground/90",
                    "dark:bg-background dark:text-foreground dark:hover:bg-background/90",
                    "transition-colors"
                  )}
                  disabled={isLoading || !input.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        // Chat view with messages and bottom input
        <>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6 max-w-3xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-4",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 max-w-[80%]",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.report ? (
                      <AssessmentReportDisplay report={message.report} />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  {message.role === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div className="rounded-2xl px-4 py-3 bg-muted">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {progressMessage || "Running security assessment..."}
                      </p>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div className="border-t bg-background p-4 sticky bottom-0">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter application name or URL (e.g., 'Slack' or 'https://slack.com')..."
                  className="min-h-[60px] max-h-[200px] resize-none rounded-2xl pr-[72px] py-3"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className={cn(
                    "absolute right-2 bottom-2 h-9 w-9 rounded-lg shrink-0",
                    "bg-foreground text-background hover:bg-foreground/90",
                    "dark:bg-background dark:text-foreground dark:hover:bg-background/90",
                    "transition-colors"
                  )}
                  disabled={isLoading || !input.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}

