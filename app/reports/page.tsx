"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Shield, AlertCircle, Award, Calendar, ChevronLeft, ChevronRight, FileText, TrendingUp, TrendingDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Report {
  id: string
  input: string
  productName: string
  vendorName: string
  websiteUrl?: string
  trustScore: number
  riskLevel: string
  recommendation: string
  createdAt: string
  updatedAt: string
}

interface Pagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export default function ReportsPage() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState("")

  const fetchReports = async (page: number = 1, searchQuery: string = "") => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
      })
      if (searchQuery) {
        params.append("search", searchQuery)
      }

      const response = await fetch(`/api/reports?${params.toString()}`)
      if (!response.ok) {
        throw new Error("Failed to fetch reports")
      }

      const data = await response.json()
      setReports(data.reports || [])
      setPagination(data.pagination)
    } catch (error) {
      console.error("Error fetching reports:", error)
      setReports([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports(currentPage, search)
  }, [currentPage, search])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setCurrentPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case "low":
        return "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20"
      case "medium":
        return "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20"
      case "high":
        return "text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20"
      case "critical":
        return "text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20"
      default:
        return "text-muted-foreground border-border bg-muted/50"
    }
  }

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400"
    if (score >= 60) return "text-amber-600 dark:text-amber-400"
    if (score >= 40) return "text-orange-600 dark:text-orange-400"
    return "text-red-600 dark:text-red-400"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

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

  return (
    <div className="flex h-full flex-col">
      <div className="bg-card p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="w-8 h-8" />
              Reports
            </h1>
            <p className="mt-2 text-muted-foreground">
              Browse all security assessment reports
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mt-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by product name, vendor, or input..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading reports...</div>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No reports found</p>
            <p className="text-muted-foreground">
              {search ? "Try adjusting your search query" : "Start by creating your first security assessment"}
            </p>
          </div>
        ) : (
          <>
            {/* Reports Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => router.push(`/reports/${report.id}`)}
                  className="group cursor-pointer rounded-xl border bg-card p-6 hover:shadow-lg hover:border-primary/50 transition-all duration-200"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1 truncate group-hover:text-primary transition-colors flex items-center gap-2">
                        {report.websiteUrl && (
                          <img 
                            src={getFaviconUrl(report.websiteUrl)} 
                            alt={`${report.productName} logo`} 
                            className="w-5 h-5 shrink-0 rounded" 
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        )}
                        {report.productName}
                      </h3>
                      {report.vendorName && (
                        <p className="text-sm text-muted-foreground truncate">
                          by {report.vendorName}
                        </p>
                      )}
                    </div>
                    <Shield className="w-5 h-5 text-primary shrink-0 ml-2" />
                  </div>

                  {/* Trust Score and Risk Level */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-lg border p-3 bg-muted/30">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Award className="w-3.5 h-3.5 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Trust</p>
                      </div>
                      <p className={cn("text-2xl font-bold", getTrustScoreColor(report.trustScore))}>
                        {report.trustScore}
                      </p>
                    </div>
                    <div className={cn("rounded-lg border p-3", getRiskColor(report.riskLevel))}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Risk</p>
                      </div>
                      <p className="text-lg font-bold capitalize">
                        {report.riskLevel}
                      </p>
                    </div>
                  </div>

                  {/* Recommendation Badge */}
                  {report.recommendation && (
                    <div className="mb-4">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                          report.recommendation.toLowerCase().includes("approve") &&
                            !report.recommendation.toLowerCase().includes("reject")
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                            : report.recommendation.toLowerCase().includes("reject")
                            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                            : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                        )}
                      >
                        {report.recommendation}
                      </span>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(report.createdAt)}</span>
                    </div>
                    <span className="text-primary group-hover:underline">View Report →</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-6">
                <div className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{" "}
                  {pagination.totalCount} reports
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPreviousPage}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum: number
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i
                      } else {
                        pageNum = pagination.page - 2 + i
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={pagination.page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="min-w-[2.5rem]"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
