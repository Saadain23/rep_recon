"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AssessmentReportDisplay } from "@/components/display-report"

export default function ReportDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const id = params.id as string
        if (!id) {
          setError("Report ID is missing")
          setLoading(false)
          return
        }

        const response = await fetch(`/api/reports/${id}`)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error("API Error:", response.status, errorData)
          
          if (response.status === 404) {
            setError("Report not found")
          } else if (response.status === 401) {
            setError("Unauthorized - Please log in again")
          } else {
            setError(`Failed to load report: ${errorData.error || response.statusText}`)
          }
          setLoading(false)
          return
        }

        const data = await response.json()
        console.log("Report data received:", data)
        
        // The API returns reportData, which is the full report object
        if (!data.reportData) {
          setError("Report data is missing")
          setLoading(false)
          return
        }
        
        setReport(data.reportData)
      } catch (err) {
        console.error("Error fetching report:", err)
        setError(`Failed to load report: ${err instanceof Error ? err.message : "Unknown error"}`)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchReport()
    } else {
      setError("Report ID is missing")
      setLoading(false)
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="bg-card p-6 border-b">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading report...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="flex h-full flex-col">
        <div className="bg-card p-6 border-b">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium mb-2">{error || "Report not found"}</p>
            <Button onClick={() => router.push("/reports")}>
              Go to Reports
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="bg-card p-6 border-b">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Reports
        </Button>
      </div>
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <AssessmentReportDisplay report={report} />
        </div>
      </div>
    </div>
  )
}

