"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Send, User, FileText, Award, AlertCircle, ExternalLink } from "lucide-react"
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

interface ReportSuggestion {
  id: string
  input: string
  productName: string
  vendorName: string
  websiteUrl?: string
  trustScore: number
  riskLevel: string
  createdAt: string
}

export function ChatInterface() {
  const router = useRouter()
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [progressMessage, setProgressMessage] = React.useState<string>("")
  const [suggestions, setSuggestions] = React.useState<ReportSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = React.useState(-1)
  const [isSearchingSuggestions, setIsSearchingSuggestions] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = React.useRef<HTMLDivElement>(null)
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const hasMessages = messages.length > 0

  // Helper function to get domain from URL
  const getDomainFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  // Helper function to get favicon URL
  const getFaviconUrl = (url: string): string => {
    const domain = getDomainFromUrl(url)
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  }

  // Debounced search for suggestions
  React.useEffect(() => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Don't search if input is too short or if loading
    if (input.trim().length < 2 || isLoading) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    // Set loading state
    setIsSearchingSuggestions(true)

    // Debounce the search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/reports/search?q=${encodeURIComponent(input.trim())}&limit=5`)
        if (!response.ok) {
          throw new Error("Failed to search")
        }
        const data = await response.json()
        setSuggestions(data.suggestions || [])
        setShowSuggestions((data.suggestions || []).length > 0)
        setSelectedSuggestionIndex(-1)
      } catch (error) {
        console.error("Error searching suggestions:", error)
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setIsSearchingSuggestions(false)
      }
    }, 300) // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [input, isLoading])

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: ReportSuggestion) => {
    setInput("")
    setSuggestions([])
    setShowSuggestions(false)
    router.push(`/reports/${suggestion.id}`)
  }

  // Handle keyboard navigation in suggestions
  const handleSuggestionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSubmit(e)
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
          e.preventDefault()
          handleSelectSuggestion(suggestions[selectedSuggestionIndex])
        } else if (!e.shiftKey) {
          e.preventDefault()
          handleSubmit(e)
        }
        break
      case "Escape":
        e.preventDefault()
        setShowSuggestions(false)
        setSelectedSuggestionIndex(-1)
        break
    }
  }

  // Scroll selected suggestion into view
  React.useEffect(() => {
    if (selectedSuggestionIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedSuggestionIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" })
      }
    }
  }, [selectedSuggestionIndex])

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
    handleSuggestionKeyDown(e)
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case "low":
        return "text-emerald-600 dark:text-emerald-400"
      case "medium":
        return "text-amber-600 dark:text-amber-400"
      case "high":
        return "text-orange-600 dark:text-orange-400"
      case "critical":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-muted-foreground"
    }
  }

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400"
    if (score >= 60) return "text-amber-600 dark:text-amber-400"
    if (score >= 40) return "text-orange-600 dark:text-orange-400"
    return "text-red-600 dark:text-red-400"
  }

  return (
    <div className="flex h-full flex-col">
      {!hasMessages ? (
        // Centered welcome screen with input
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center space-y-6 max-w-2xl w-full mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Image
                src="/rep_logo.png"
                alt="Rep Recon Logo"
                width={100}
                height={100}
                className="logo-image object-contain"
              />
            </div>
            <h2 className="text-3xl">Welcome to Security Assessment Agent</h2>
            <p className="text-base text-muted-foreground">
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
                  onFocus={() => {
                    if (suggestions.length > 0) {
                      setShowSuggestions(true)
                    }
                  }}
                  onBlur={(e) => {
                    // Delay hiding to allow click on suggestion
                    const target = e.currentTarget
                    setTimeout(() => {
                      if (target && !target.contains(document.activeElement)) {
                        // Also check if active element is not in suggestions dropdown
                        const activeElement = document.activeElement
                        const suggestionsElement = suggestionsRef.current
                        if (!suggestionsElement?.contains(activeElement)) {
                          setShowSuggestions(false)
                        }
                      }
                    }, 200)
                  }}
                  placeholder="Enter application name or URL (e.g., 'Slack' or 'https://slack.com')..."
                  className="min-h-[60px] max-h-[200px] resize-none rounded-2xl pr-14 py-4 px-4 text-base focus:ring-2 focus:ring-offset-2 transition-all"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className={cn(
                    "absolute right-3 bottom-3 h-10 w-10 rounded-xl shrink-0",
                    "bg-black text-white hover:bg-black/80",
                    "dark:bg-white dark:text-black dark:hover:bg-white/90",
                    "transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
                    "shadow-sm hover:shadow-md"
                  )}
                  disabled={isLoading || !input.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-xl shadow-lg z-50 max-h-[400px] overflow-y-auto backdrop-blur-sm"
                    style={{ backgroundColor: 'hsl(var(--background))' }}
                  >
                    <div className="p-2">
                      <div className="text-xs font-medium text-muted-foreground px-3 py-2 mb-1">
                        Existing Reports
                      </div>
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={suggestion.id}
                          onClick={() => handleSelectSuggestion(suggestion)}
                          onMouseDown={(e) => {
                            // Prevent blur event on textarea when clicking suggestion
                            e.preventDefault()
                          }}
                          onMouseEnter={() => setSelectedSuggestionIndex(index)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                            "hover:bg-muted/50",
                            selectedSuggestionIndex === index && "bg-muted"
                          )}
                        >
                          {suggestion.websiteUrl ? (
                            <img
                              src={getFaviconUrl(suggestion.websiteUrl)}
                              alt={`${suggestion.productName} logo`}
                              className="w-8 h-8 shrink-0 rounded"
                              onError={(e) => {
                                e.currentTarget.style.display = "none"
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 shrink-0 rounded bg-muted flex items-center justify-center">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-sm truncate">
                                {suggestion.productName}
                              </p>
                            </div>
                            {suggestion.vendorName && (
                              <p className="text-xs text-muted-foreground truncate">
                                by {suggestion.vendorName}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <Award className="w-3 h-3 text-muted-foreground" />
                                <span className={cn("text-xs font-semibold", getTrustScoreColor(suggestion.trustScore))}>
                                  {suggestion.trustScore}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <AlertCircle className="w-3 h-3 text-muted-foreground" />
                                <span className={cn("text-xs font-medium capitalize", getRiskColor(suggestion.riskLevel))}>
                                  {suggestion.riskLevel}
                                </span>
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                      <Image
                        src="/rep_logo.png"
                        alt="Rep Recon Logo"
                        width={20}
                        height={20}
                        className="logo-image object-contain"
                      />
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
                    <Image
                      src="/rep_logo.png"
                      alt="Rep Recon Logo"
                      width={20}
                      height={20}
                      className="logo-image object-contain"
                    />
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
                  onFocus={() => {
                    if (suggestions.length > 0) {
                      setShowSuggestions(true)
                    }
                  }}
                  onBlur={(e) => {
                    // Delay hiding to allow click on suggestion
                    const target = e.currentTarget
                    setTimeout(() => {
                      if (target && !target.contains(document.activeElement)) {
                        // Also check if active element is not in suggestions dropdown
                        const activeElement = document.activeElement
                        const suggestionsElement = suggestionsRef.current
                        if (!suggestionsElement?.contains(activeElement)) {
                          setShowSuggestions(false)
                        }
                      }
                    }, 200)
                  }}
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
                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute bottom-full left-0 right-0 mb-2 bg-background border rounded-xl shadow-lg z-50 max-h-[400px] overflow-y-auto backdrop-blur-sm"
                    style={{ backgroundColor: 'hsl(var(--background))' }}
                  >
                    <div className="p-2">
                      <div className="text-xs font-medium text-muted-foreground px-3 py-2 mb-1">
                        Existing Reports
                      </div>
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={suggestion.id}
                          onClick={() => handleSelectSuggestion(suggestion)}
                          onMouseDown={(e) => {
                            // Prevent blur event on textarea when clicking suggestion
                            e.preventDefault()
                          }}
                          onMouseEnter={() => setSelectedSuggestionIndex(index)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                            "hover:bg-muted/50",
                            selectedSuggestionIndex === index && "bg-muted"
                          )}
                        >
                          {suggestion.websiteUrl ? (
                            <img
                              src={getFaviconUrl(suggestion.websiteUrl)}
                              alt={`${suggestion.productName} logo`}
                              className="w-8 h-8 shrink-0 rounded"
                              onError={(e) => {
                                e.currentTarget.style.display = "none"
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 shrink-0 rounded bg-muted flex items-center justify-center">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-sm truncate">
                                {suggestion.productName}
                              </p>
                            </div>
                            {suggestion.vendorName && (
                              <p className="text-xs text-muted-foreground truncate">
                                by {suggestion.vendorName}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <Award className="w-3 h-3 text-muted-foreground" />
                                <span className={cn("text-xs font-semibold", getTrustScoreColor(suggestion.trustScore))}>
                                  {suggestion.trustScore}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <AlertCircle className="w-3 h-3 text-muted-foreground" />
                                <span className={cn("text-xs font-medium capitalize", getRiskColor(suggestion.riskLevel))}>
                                  {suggestion.riskLevel}
                                </span>
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}

