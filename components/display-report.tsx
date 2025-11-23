import { AlertTriangle, CheckCircle, XCircle, Shield, Lock, FileText, TrendingUp, TrendingDown, Minus, ExternalLink, Award, AlertCircle, Info, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import * as React from "react"

// Helper function to get domain from URL
function getDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return url
  }
}

// Helper function to get favicon URL
function getFaviconUrl(url: string): string {
  const domain = getDomainFromUrl(url)
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
}

// Component for individual source item with favicon
function SourceItem({ source }: { source: string }) {
  const domain = getDomainFromUrl(source)
  const faviconUrl = getFaviconUrl(source)
  const [showFavicon, setShowFavicon] = React.useState(true)
  
  return (
    <a
      href={source}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
      title={source}
    >
      {showFavicon && (
        <img
          src={faviconUrl}
          alt={`${domain} favicon`}
          className="w-4 h-4 shrink-0"
          onError={() => {
            setShowFavicon(false)
          }}
        />
      )}
      {!showFavicon && (
        <div className="w-4 h-4 shrink-0 rounded bg-muted flex items-center justify-center">
          <ExternalLink className="w-2.5 h-2.5 text-muted-foreground" />
        </div>
      )}
      <span className="text-xs text-muted-foreground group-hover:text-foreground truncate max-w-[200px]">
        {domain}
      </span>
      <ExternalLink className="w-3 h-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  )
}

// Component to display sources with favicons
function SourcesDisplay({ sources, title }: { sources: string[] | undefined, title?: string }) {
  if (!sources || sources.length === 0) return null

  return (
    <div className="mt-4 pt-4 border-t">
      <p className="text-xs font-medium text-muted-foreground mb-2">
        {title || "Sources"}
      </p>
      <div className="flex flex-wrap gap-2">
        {sources.map((source: string, idx: number) => (
          <SourceItem key={idx} source={source} />
        ))}
      </div>
    </div>
  )
}

// Component to render text with inline citations
function TextWithCitations({ 
  text, 
  citations 
}: { 
  text: string, 
  citations?: Array<{ number: number; url: string; description?: string }> 
}) {
  if (!citations || citations.length === 0) {
    return <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{text}</p>
  }

  // Create a map of citation numbers to citation objects
  const citationMap = new Map(citations.map(c => [c.number, c]))

  // Parse the text and replace citation markers with clickable links
  const parts: React.ReactNode[] = []
  const citationRegex = /\[(\d+)\]/g
  let lastIndex = 0
  let match
  let keyCounter = 0

  // Split text by newlines to preserve formatting
  const lines = text.split('\n')
  
  return (
    <div>
      <div className="text-muted-foreground leading-relaxed">
        {lines.map((line, lineIdx) => {
          const lineParts: React.ReactNode[] = []
          let lineLastIndex = 0
          const lineMatch = [...line.matchAll(citationRegex)]
          
          lineMatch.forEach((match) => {
            // Add text before the citation
            if (match.index !== undefined && match.index > lineLastIndex) {
              lineParts.push(line.substring(lineLastIndex, match.index))
            }

            // Add the citation link
            const citationNumber = parseInt(match[1], 10)
            const citation = citationMap.get(citationNumber)
            
            if (citation) {
              lineParts.push(
                <a
                  key={`citation-${lineIdx}-${keyCounter++}`}
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-primary hover:underline font-medium mx-0.5"
                  title={citation.description || citation.url}
                >
                  [{citationNumber}]
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              )
            } else {
              // Citation not found, just show the marker
              lineParts.push(`[${citationNumber}]`)
            }

            lineLastIndex = (match.index || 0) + match[0].length
          })

          // Add remaining text
          if (lineLastIndex < line.length) {
            lineParts.push(line.substring(lineLastIndex))
          }

          return (
            <React.Fragment key={lineIdx}>
              {lineParts.length > 0 ? lineParts : line}
              {lineIdx < lines.length - 1 && <br />}
            </React.Fragment>
          )
        })}
      </div>
      {/* Citation list */}
      {citations.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-3">Citations</p>
          <div className="space-y-2">
            {citations.map((citation) => (
              <div key={citation.number} className="flex items-start gap-2 text-xs">
                <span className="font-medium text-primary shrink-0">[{citation.number}]</span>
                <div className="flex-1 min-w-0">
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 break-all"
                  >
                    {citation.url}
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                  {citation.description && (
                    <p className="text-muted-foreground mt-0.5">{citation.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Component to display assessment report
export function AssessmentReportDisplay({ report }: { report: any }) {
    const [isDownloading, setIsDownloading] = React.useState(false)

    const handleDownloadPDF = async () => {
      setIsDownloading(true)
      try {
        const response = await fetch('/api/report/pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(report),
        })

        if (!response.ok) {
          throw new Error('Failed to generate PDF')
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `security-assessment-${report.product?.productName || 'report'}-${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } catch (error) {
        console.error('Error downloading PDF:', error)
        alert('Failed to download PDF. Please try again.')
      } finally {
        setIsDownloading(false)
      }
    }

    const getRiskColor = (riskLevel: string) => {
      switch (riskLevel?.toLowerCase()) {
        case "low":
          return {
            text: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-950/20",
            border: "border-emerald-200 dark:border-emerald-800",
            badge: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
          }
        case "medium":
          return {
            text: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-950/20",
            border: "border-amber-200 dark:border-amber-800",
            badge: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
          }
        case "high":
          return {
            text: "text-orange-600 dark:text-orange-400",
            bg: "bg-orange-50 dark:bg-orange-950/20",
            border: "border-orange-200 dark:border-orange-800",
            badge: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
          }
        case "critical":
          return {
            text: "text-red-600 dark:text-red-400",
            bg: "bg-red-50 dark:bg-red-950/20",
            border: "border-red-200 dark:border-red-800",
            badge: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
          }
        default:
          return {
            text: "text-muted-foreground",
            bg: "bg-muted/50",
            border: "border-border",
            badge: "bg-muted text-muted-foreground"
          }
      }
    }
  
    const getTrustScoreColor = (score: number) => {
      if (score >= 80) {
        return {
          text: "text-emerald-600 dark:text-emerald-400",
          bg: "bg-emerald-50 dark:bg-emerald-950/20",
          border: "border-emerald-200 dark:border-emerald-800",
          badge: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
        }
      }
      if (score >= 60) {
        return {
          text: "text-amber-600 dark:text-amber-400",
          bg: "bg-amber-50 dark:bg-amber-950/20",
          border: "border-amber-200 dark:border-amber-800",
          badge: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
        }
      }
      if (score >= 40) {
        return {
          text: "text-orange-600 dark:text-orange-400",
          bg: "bg-orange-50 dark:bg-orange-950/20",
          border: "border-orange-200 dark:border-orange-800",
          badge: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
        }
      }
      return {
        text: "text-red-600 dark:text-red-400",
        bg: "bg-red-50 dark:bg-red-950/20",
        border: "border-red-200 dark:border-red-800",
        badge: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
      }
    }
  
    const getSeverityColor = (severity: string) => {
      const sev = severity?.toLowerCase() || ""
      if (sev.includes("critical")) {
        return "text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
      }
      if (sev.includes("high")) {
        return "text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800"
      }
      if (sev.includes("medium")) {
        return "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
      }
      return "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
    }
  
    const getTrendIcon = (trend: string) => {
      switch (trend?.toLowerCase()) {
        case "improving":
          return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
        case "declining":
          return <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
        default:
          return <Minus className="w-4 h-4 text-muted-foreground" />
      }
    }
  
    const trustScoreColors = getTrustScoreColor(report.trustScore || 0)
    const riskColors = getRiskColor(report.riskLevel || "Unknown")
  
    return (
      <div className="space-y-6 text-sm">
        {/* Header Card */}
        <div className={cn("rounded-xl p-5 border-1", riskColors.border)}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Assessment Report
                </h3>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border bg-background hover:bg-muted transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "text-sm font-medium"
                  )}
                  title="Download PDF Report"
                >
                  <Download className="w-4 h-4" />
                  {isDownloading ? 'Generating...' : 'Download PDF'}
                </button>
              </div>
              {report.product && (
                <div className="space-y-2">
                  <div>
                    <p className="text-3xl font-semibold flex items-center gap-2"> <img src={getFaviconUrl(report.product.websiteUrl)} alt={`${report.product.productName} logo`} className="w-5 h-5 shrink-0 rounded" />  {report.product.productName || "Unknown Product"}</p>
                    <p className="text-muted-foreground">by {report.product.vendorName || "Unknown Vendor"}</p>
                  </div>
                  {report.product.websiteUrl && (
                    <a 
                      href={report.product.websiteUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary hover:underline flex items-center gap-1 text-xs"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {report.product.websiteUrl}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
  
          {/* Trust Score & Risk Level Cards */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className={cn("rounded-lg p-4 border", trustScoreColors.border)}>
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trust Score</p>
              </div>
              <p className={cn("text-3xl font-bold", trustScoreColors.text)}>
                {report.trustScore || 0}
                <span className="text-lg text-muted-foreground">/100</span>
              </p>
            </div>
            <div className={cn("rounded-lg p-4 border", riskColors.border)}>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4" />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Risk Level</p>
              </div>
              <p className={cn("text-2xl font-bold", riskColors.text)}>
                {report.riskLevel || "Unknown"}
              </p>
            </div>
          </div>
        </div>
  
        {/* Recommendation Card */}
        {report.recommendation && (
          <div className={cn(
            "rounded-xl p-5 border-2",
            report.recommendation.toLowerCase().includes("approve") && !report.recommendation.toLowerCase().includes("reject")
              ? "border-green-200 dark:border-green-900"
              : report.recommendation.toLowerCase().includes("reject")
              ? "border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20"
              : "border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-950/20"
          )}>
            <div className="flex items-start gap-3">
              {report.recommendation.toLowerCase().includes("approve") && !report.recommendation.toLowerCase().includes("reject") ? (
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
              ) : report.recommendation.toLowerCase().includes("reject") ? (
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-semibold text-base mb-2">Recommendation</p>
                <p className="text-muted-foreground leading-relaxed">{report.recommendation}</p>
              </div>
            </div>
          </div>
        )}
  
        {/* Executive Summary */}
        {report.executiveSummary && (
          <div className="rounded-xl p-5 border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-primary" />
              <p className="font-semibold text-base">Executive Summary</p>
            </div>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{report.executiveSummary}</p>
          </div>
        )}
  
        {/* Product Overview */}
        {report.productOverview && (
          <div className="rounded-xl p-5 border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-primary" />
              <p className="font-semibold text-base">Product Overview</p>
            </div>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{report.productOverview}</p>
          </div>
        )}
  
        {/* Product Information Card */}
        {report.product && (
          <div className="rounded-xl p-5 border bg-card">
            <p className="font-semibold text-base mb-4">Product Information</p>
            <div className="grid grid-cols-2 gap-4">
              {report.product.headquarters && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Headquarters</p>
                  <p className="font-medium">{report.product.headquarters}</p>
                </div>
              )}
              {report.product.yearFounded && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Founded</p>
                  <p className="font-medium">{report.product.yearFounded}</p>
                </div>
              )}
            </div>
            {report.product.companyOverview && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Company Overview</p>
                <p className="text-muted-foreground leading-relaxed">{report.product.companyOverview}</p>
              </div>
            )}
            <SourcesDisplay sources={report.product.sources} />
          </div>
        )}
  
        {/* Classification Card */}
        {report.classification && (
          <div className="rounded-xl p-5 border bg-card">
            <p className="font-semibold text-base mb-4">Classification</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Primary Category</p>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {report.classification.primaryCategory || "Unknown"}
                </span>
              </div>
              {report.classification.deploymentModel && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Deployment Model</p>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-blue-700 dark:text-blue-300">
                    {report.classification.deploymentModel}
                  </span>
                </div>
              )}
              {report.classification.targetUsers && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Target Users</p>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-purple-700 dark:text-purple-300">
                    {report.classification.targetUsers}
                  </span>
                </div>
              )}
            </div>
            {report.classification.keyFeatures && report.classification.keyFeatures.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Key Features</p>
                <div className="flex flex-wrap gap-2">
                  {report.classification.keyFeatures.map((feature: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-muted text-muted-foreground">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {report.classification.secondaryCategories && report.classification.secondaryCategories.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Secondary Categories</p>
                <div className="flex flex-wrap gap-2">
                  {report.classification.secondaryCategories.map((cat: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-muted text-muted-foreground">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
  
        {/* Security Posture Summary */}
        {report.securityPostureSummary && (
          <div className="rounded-xl p-5 border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-primary" />
              <p className="font-semibold text-base">Security Posture Summary</p>
            </div>
            <TextWithCitations 
              text={report.securityPostureSummary} 
              citations={report.securityPostureCitations}
            />
          </div>
        )}
  
        {/* Key Findings */}
        {report.keyFindings && (
          <div className="rounded-xl p-5 border bg-card">
            <p className="font-semibold text-base mb-4">Key Findings</p>
            {report.keyFindings.risks && report.keyFindings.risks.length > 0 && (
              <div className="mb-4">
                <p className="font-medium text-sm mb-3 flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  Risks
                </p>
                <div className="space-y-2">
                  {report.keyFindings.risks.map((risk: string, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg border border-red-200 dark:border-red-900">
                      <p className="text-sm">{risk}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {report.keyFindings.strengths && report.keyFindings.strengths.length > 0 && (
              <div>
                <p className="font-medium text-sm mb-3 flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  Strengths
                </p>
                <div className="space-y-2">
                  {report.keyFindings.strengths.map((strength: string, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg border border-green-200 dark:border-green-900">
                      <p className="text-sm">{strength}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
  
        {/* Trust Score Rationale */}
        {report.trustScoreRationale && (
          <div className="rounded-xl p-5 border bg-card">
            <p className="font-semibold text-base mb-3">Trust Score Rationale</p>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{report.trustScoreRationale}</p>
          </div>
        )}
  
        {/* CVE Analysis */}
        {report.detailedFindings?.cve && (
          <div className="rounded-xl p-5 border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-primary" />
              <p className="font-semibold text-base">CVE Analysis</p>
            </div>
            
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                {report.detailedFindings.cve.totalCVEs !== undefined && (
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Total CVEs (2 years)</p>
                    <p className="text-2xl font-bold">{report.detailedFindings.cve.totalCVEs}</p>
                  </div>
                )}
                {report.detailedFindings.cve.trend && (
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Trend</p>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(report.detailedFindings.cve.trend)}
                      <p className="text-lg font-semibold capitalize">{report.detailedFindings.cve.trend}</p>
                    </div>
                  </div>
                )}
              </div>
  
              {/* Severity Breakdown */}
              {report.detailedFindings.cve.severityBreakdown && (
                <div>
                  <p className="font-medium text-sm mb-3">Severity Breakdown</p>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="p-3 rounded-lg border border-red-200 dark:border-red-900 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Critical</p>
                      <p className="text-xl font-bold text-red-600 dark:text-red-400">
                        {report.detailedFindings.cve.severityBreakdown.critical || 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border border-orange-200 dark:border-orange-900 text-center">
                      <p className="text-xs text-muted-foreground mb-1">High</p>
                      <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                        {report.detailedFindings.cve.severityBreakdown.high || 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border border-yellow-200 dark:border-yellow-900 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Medium</p>
                      <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                        {report.detailedFindings.cve.severityBreakdown.medium || 0}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-900 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Low</p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {report.detailedFindings.cve.severityBreakdown.low || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}
  
              {/* Recent Critical CVEs */}
              {report.detailedFindings.cve.recentCritical && report.detailedFindings.cve.recentCritical.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-3 text-red-600 dark:text-red-400">Recent Critical Vulnerabilities</p>
                  <div className="space-y-2">
                    {report.detailedFindings.cve.recentCritical.map((cve: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
                        <div className="flex items-start justify-between mb-2">
                          {cve.cveId && (
                            <span className="font-mono text-xs font-semibold text-red-700 dark:text-red-300">{cve.cveId}</span>
                          )}
                          {cve.severity && (
                            <span className={cn("px-2 py-1 rounded text-xs font-medium", getSeverityColor(cve.severity))}>
                              {cve.severity}
                            </span>
                          )}
                        </div>
                        <p className="text-sm mb-1">{cve.description}</p>
                        {cve.date && (
                          <p className="text-xs text-muted-foreground">Date: {cve.date}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
  
              {/* Average Patch Time */}
              {report.detailedFindings.cve.avgPatchTime && (
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Average Patch Response Time</p>
                  <p className="font-semibold">{report.detailedFindings.cve.avgPatchTime}</p>
                </div>
              )}
  
              {/* Notable Incidents */}
              {report.detailedFindings.cve.notableIncidents && report.detailedFindings.cve.notableIncidents.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-2">Notable Incidents</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    {report.detailedFindings.cve.notableIncidents.map((incident: string, idx: number) => (
                      <li key={idx} className="text-sm">{incident}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <SourcesDisplay sources={report.detailedFindings.cve.sources} />
          </div>
        )}
  
        {/* Incident Analysis */}
        {report.detailedFindings?.incidents && (
          <div className="rounded-xl p-5 border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-primary" />
              <p className="font-semibold text-base">Incident & Abuse Analysis</p>
            </div>
            
            <div className="space-y-4">
              {/* Summary */}
              {report.detailedFindings.incidents.summary && (
                <p className="text-muted-foreground leading-relaxed">{report.detailedFindings.incidents.summary}</p>
              )}
  
              {/* Ratings */}
              <div className="grid grid-cols-2 gap-4">
                {report.detailedFindings.incidents.vendorSecurityRating !== undefined && (
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Vendor Security Rating</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{report.detailedFindings.incidents.vendorSecurityRating}</p>
                      <span className="text-muted-foreground">/10</span>
                    </div>
                  </div>
                )}
                {report.detailedFindings.incidents.transparency !== undefined && (
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Transparency Rating</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{report.detailedFindings.incidents.transparency}</p>
                      <span className="text-muted-foreground">/10</span>
                    </div>
                  </div>
                )}
              </div>
  
              {/* Data Breaches */}
              {report.detailedFindings.incidents.dataBreaches && report.detailedFindings.incidents.dataBreaches.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-3 text-red-600 dark:text-red-400">Data Breaches</p>
                  <div className="space-y-3">
                    {report.detailedFindings.incidents.dataBreaches.map((breach: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-lg border border-red-200 dark:border-red-900 ">
                        {breach.date && (
                          <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">{breach.date}</p>
                        )}
                        <p className="text-sm mb-2">{breach.description}</p>
                        {breach.impact && (
                          <p className="text-xs text-muted-foreground">Impact: {breach.impact}</p>
                        )}
                        {breach.source && (
                          <a href={breach.source} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-2">
                            <ExternalLink className="w-3 h-3" />
                            Source
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
  
              {/* Security Incidents */}
              {report.detailedFindings.incidents.securityIncidents && report.detailedFindings.incidents.securityIncidents.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-3 text-orange-600 dark:text-orange-400">Security Incidents</p>
                  <div className="space-y-3">
                    {report.detailedFindings.incidents.securityIncidents.map((incident: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-lg border border-orange-200 dark:border-orange-900">
                        {incident.date && (
                          <p className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">{incident.date}</p>
                        )}
                        <p className="text-sm mb-2">{incident.description}</p>
                        {incident.severity && (
                          <span className={cn("inline-flex items-center px-2 py-1 rounded text-xs font-medium", getSeverityColor(incident.severity))}>
                            {incident.severity}
                          </span>
                        )}
                        {incident.source && (
                          <a href={incident.source} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-2">
                            <ExternalLink className="w-3 h-3" />
                            Source
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
  
              {/* Abuse Signals */}
              {report.detailedFindings.incidents.abuseSignals && report.detailedFindings.incidents.abuseSignals.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-3 text-yellow-600 dark:text-yellow-400">Abuse Signals</p>
                  <div className="space-y-2">
                    {report.detailedFindings.incidents.abuseSignals.map((abuse: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg border border-yellow-200 dark:border-yellow-900">
                        {abuse.type && (
                          <p className="font-medium text-sm mb-1">{abuse.type}</p>
                        )}
                        {abuse.description && (
                          <p className="text-sm text-muted-foreground">{abuse.description}</p>
                        )}
                        {abuse.source && (
                          <a href={abuse.source} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-2">
                            <ExternalLink className="w-3 h-3" />
                            Source
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
  
              {/* Ransomware Associations */}
              {report.detailedFindings.incidents.ransomwareAssociations && (
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Ransomware/Malware Associations</p>
                  <p className="text-sm font-medium">{report.detailedFindings.incidents.ransomwareAssociations}</p>
                </div>
              )}
            </div>
            <SourcesDisplay sources={report.detailedFindings.incidents.sources} />
          </div>
        )}
  
        {/* Compliance Analysis */}
        {report.detailedFindings?.compliance && (
          <div className="rounded-xl p-5 border bg-card">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-primary" />
              <p className="font-semibold text-base">Compliance & Data Handling</p>
            </div>
            
            <div className="space-y-4">
              {/* Summary */}
              {report.detailedFindings.compliance.summary && (
                <p className="text-muted-foreground leading-relaxed">{report.detailedFindings.compliance.summary}</p>
              )}
  
              {/* Scores */}
              <div className="grid grid-cols-2 gap-4">
                {report.detailedFindings.compliance.complianceScore !== undefined && (
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Compliance Score</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{report.detailedFindings.compliance.complianceScore}</p>
                      <span className="text-muted-foreground">/10</span>
                    </div>
                  </div>
                )}
                {report.detailedFindings.compliance.privacyScore !== undefined && (
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Privacy Score</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{report.detailedFindings.compliance.privacyScore}</p>
                      <span className="text-muted-foreground">/10</span>
                    </div>
                  </div>
                )}
              </div>
  
              {/* Certifications */}
              {report.detailedFindings.compliance.certifications && report.detailedFindings.compliance.certifications.length > 0 ? (
                <div>
                  <p className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Certifications
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {report.detailedFindings.compliance.certifications.map((cert: string, idx: number) => (
                      <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium text-green-700 dark:text-emerald-300">
                        <Award className="w-3 h-3 mr-1.5" />
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-950/20">
                  <p className="text-sm text-muted-foreground">No certifications verified</p>
                </div>
              )}
  
              {/* Data Handling */}
              {report.detailedFindings.compliance.dataHandling && (
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Data Handling Practices</p>
                  <p className="text-sm">{report.detailedFindings.compliance.dataHandling}</p>
                </div>
              )}
  
              {/* Data Residency */}
              {report.detailedFindings.compliance.dataResidency && (
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Data Residency</p>
                  <p className="text-sm">{report.detailedFindings.compliance.dataResidency}</p>
                </div>
              )}
  
              {/* Encryption */}
              {report.detailedFindings.compliance.encryption && (
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Encryption</p>
                  <p className="text-sm">{report.detailedFindings.compliance.encryption}</p>
                </div>
              )}
  
              {/* Admin Controls */}
              {report.detailedFindings.compliance.adminControls && (
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Admin Controls</p>
                  <p className="text-sm">{report.detailedFindings.compliance.adminControls}</p>
                </div>
              )}
            </div>
            <SourcesDisplay sources={report.detailedFindings.compliance.sources} />
          </div>
        )}
  
        {/* Risk Analysis Details */}
        {report.detailedFindings?.riskAnalysis && (
          <div className="rounded-xl p-5 border bg-card">
            <p className="font-semibold text-base mb-4">Risk Analysis Details</p>
            
            <div className="space-y-4">
              {/* Rationale */}
              {report.detailedFindings.riskAnalysis.rationale && (
                <div>
                  <p className="font-medium text-sm mb-2">Rationale</p>
                  <p className="text-muted-foreground leading-relaxed">{report.detailedFindings.riskAnalysis.rationale}</p>
                </div>
              )}
  
              {/* Confidence Level */}
              {report.detailedFindings.riskAnalysis.confidenceLevel && (
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Confidence Level</p>
                  <p className="text-lg font-semibold">{report.detailedFindings.riskAnalysis.confidenceLevel}</p>
                </div>
              )}
  
              {/* Key Risks */}
              {report.detailedFindings.riskAnalysis.keyRisks && report.detailedFindings.riskAnalysis.keyRisks.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-3 flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    Key Risks
                  </p>
                  <div className="space-y-2">
                    {report.detailedFindings.riskAnalysis.keyRisks.map((risk: string, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg border border-red-200 dark:border-red-900">
                        <p className="text-sm">{risk}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
  
              {/* Key Strengths */}
              {report.detailedFindings.riskAnalysis.keyStrengths && report.detailedFindings.riskAnalysis.keyStrengths.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-3 flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    Key Strengths
                  </p>
                  <div className="space-y-2">
                    {report.detailedFindings.riskAnalysis.keyStrengths.map((strength: string, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg border border-green-200 dark:border-green-900">
                        <p className="text-sm">{strength}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
  
        {/* Alternative Options */}
        {(() => {
          // Handle both array and object structures
          const alternativesArray = Array.isArray(report.alternatives) 
            ? report.alternatives 
            : report.alternatives?.alternatives
          
          return (alternativesArray && alternativesArray.length > 0) || report.alternativeOptions ? (
            <div className="rounded-xl p-5 border bg-card">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <p className="font-semibold text-base">Alternative Options</p>
              </div>
              
              {/* Structured Alternatives */}
              {alternativesArray && alternativesArray.length > 0 && (
                <div className="space-y-4 mb-4">
                  {alternativesArray.map((alt: any, idx: number) => {
                  const trustScoreColors = alt.trustScore !== undefined ? getTrustScoreColor(alt.trustScore) : null
                  const domain = alt.website ? getDomainFromUrl(alt.website) : null
                  const faviconUrl = alt.website ? getFaviconUrl(alt.website) : null
                  
                  return (
                    <div 
                      key={idx} 
                      className={cn(
                        "p-5 rounded-xl border-2 transition-all hover:shadow-md",
                        trustScoreColors 
                          ? `${trustScoreColors.border} ${trustScoreColors.bg}`
                          : "border-primary/20 bg-primary/5"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {alt.website && faviconUrl && (
                              <img
                                src={faviconUrl}
                                alt={`${domain} favicon`}
                                className="w-6 h-6 shrink-0 rounded"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            )}
                            <div>
                              <p className="font-semibold text-lg">{alt.name || alt.product}</p>
                              {alt.vendor && (
                                <p className="text-sm text-muted-foreground">by {alt.vendor}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        {alt.trustScore !== undefined && (
                          <div className={cn("px-4 py-2 rounded-lg border shrink-0", trustScoreColors?.border, trustScoreColors?.bg)}>
                            <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Trust Score</p>
                            <p className={cn("text-2xl font-bold", trustScoreColors?.text)}>
                              {alt.trustScore}
                              <span className="text-sm text-muted-foreground">/100</span>
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {alt.reason && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1.5">Why this alternative?</p>
                          <p className="text-sm leading-relaxed">{alt.reason}</p>
                        </div>
                      )}
                      
                      {alt.website && (
                        <a 
                          href={alt.website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-background hover:bg-muted/50 transition-colors text-sm text-primary group"
                        >
                          <ExternalLink className="w-4 h-4 shrink-0" />
                          <span className="truncate max-w-[300px]">{domain || alt.website}</span>
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            
            {/* Text-based Alternative Options (from synthesis) */}
            {report.alternativeOptions && (
              <div className={cn(
                alternativesArray && alternativesArray.length > 0 
                  ? "pt-4 border-t" 
                  : ""
              )}>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{report.alternativeOptions}</p>
              </div>
            )}
          </div>
          ) : null
        })()}
  
        {/* Report Metadata */}
        {report.assessmentDate && (
          <div className="rounded-xl p-4 border bg-muted/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div>
                <p>Assessment Date: {new Date(report.assessmentDate).toLocaleDateString()}</p>
                {report.generatedBy && <p className="mt-1">Generated by: {report.generatedBy}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }