import { NextRequest, NextResponse } from "next/server"
import { withAuth, AuthRequest } from "@/lib/auth/middleware"
import { db } from "@/lib/db"
import { reports } from "@/lib/db/schema"
import { eq, desc, ilike, or, sql, and } from "drizzle-orm"

export const GET = withAuth(async (req: AuthRequest) => {
  try {
    const user = req.user
    if (!user?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get("q") || ""
    const limit = parseInt(searchParams.get("limit") || "5", 10)

    if (!query.trim()) {
      return NextResponse.json({ suggestions: [] })
    }

    // Extract domain from URL if query is a URL
    let searchQuery = query.trim()
    let domainQuery = ""
    try {
      const url = new URL(searchQuery)
      domainQuery = url.hostname.replace('www.', '')
    } catch {
      // Not a URL, use as-is
      domainQuery = searchQuery
    }

    // Build search pattern - prioritize product name, vendor name, and domain
    const searchPattern = `%${searchQuery}%`
    const domainPattern = `%${domainQuery}%`
    
    // Search in reportData JSON fields: product.productName, product.vendorName, product.websiteUrl
    // Reports are now visible to all authenticated users
    const whereCondition = or(
      // Direct product name match (highest priority)
      sql`${reports.reportData}->'product'->>'productName' ILIKE ${searchPattern}`,
      // Vendor name match
      sql`${reports.reportData}->'product'->>'vendorName' ILIKE ${searchPattern}`,
      // Domain/website URL match
      sql`${reports.reportData}->'product'->>'websiteUrl' ILIKE ${domainPattern}`,
      // Fallback to input field
      ilike(reports.input, searchPattern),
      // General text search in reportData (lowest priority)
      sql`${reports.reportData}::text ILIKE ${searchPattern}`
    )!

    // Get matching reports (limited for quick suggestions)
    const reportsList = await db
      .select({
        id: reports.id,
        input: reports.input,
        reportData: reports.reportData,
        createdAt: reports.createdAt,
      })
      .from(reports)
      .where(whereCondition)
      .orderBy(desc(reports.createdAt))
      .limit(limit * 2) // Get more to sort and filter

    // Extract metadata and score matches for prioritization
    const suggestionsWithScore = reportsList.map((report) => {
      const reportData = report.reportData as any
      const productName = reportData?.product?.productName || ""
      const vendorName = reportData?.product?.vendorName || ""
      const websiteUrl = reportData?.product?.websiteUrl || ""
      
      // Calculate match score (higher = better match)
      let score = 0
      const queryLower = searchQuery.toLowerCase()
      const domainLower = domainQuery.toLowerCase()
      
      // Product name exact match (highest priority)
      if (productName.toLowerCase() === queryLower) score += 100
      // Product name starts with query
      else if (productName.toLowerCase().startsWith(queryLower)) score += 50
      // Product name contains query
      else if (productName.toLowerCase().includes(queryLower)) score += 30
      
      // Vendor name exact match
      if (vendorName.toLowerCase() === queryLower) score += 80
      // Vendor name starts with query
      else if (vendorName.toLowerCase().startsWith(queryLower)) score += 40
      // Vendor name contains query
      else if (vendorName.toLowerCase().includes(queryLower)) score += 20
      
      // Domain match (extract domain from websiteUrl)
      if (websiteUrl) {
        try {
          const url = new URL(websiteUrl)
          const reportDomain = url.hostname.replace('www.', '').toLowerCase()
          if (reportDomain === domainLower) score += 90
          else if (reportDomain.includes(domainLower)) score += 45
        } catch {}
      }
      
      return {
        id: report.id,
        input: report.input,
        productName: productName || report.input,
        vendorName: vendorName,
        websiteUrl: websiteUrl,
        trustScore: reportData?.trustScore || 0,
        riskLevel: reportData?.riskLevel || "Unknown",
        createdAt: report.createdAt,
        matchScore: score,
      }
    })

    // Sort by match score (descending) and take top results
    const suggestions = suggestionsWithScore
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)
      .map(({ matchScore, ...suggestion }) => suggestion) // Remove matchScore from response

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("Error searching reports:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
})

