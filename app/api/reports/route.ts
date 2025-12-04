import { NextRequest, NextResponse } from "next/server"
import { withAuth, AuthRequest } from "@/lib/auth/middleware"
import { db } from "@/lib/db"
import { reports } from "@/lib/db/schema"
import { eq, desc, ilike, or, sql, and } from "drizzle-orm"

export const GET = withAuth(async (req: AuthRequest) => {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "12", 10)
    const search = searchParams.get("search") || ""
    const offset = (page - 1) * limit

    // Build where condition - reports are now visible to all authenticated users
    // Add search condition if provided
    const whereCondition = search
      ? or(
          ilike(reports.input, `%${search}%`),
          sql`${reports.reportData}::text ILIKE ${`%${search}%`}`
        )!
      : undefined

    // Get total count for pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(reports)
    
    const totalCountResult = whereCondition
      ? await countQuery.where(whereCondition)
      : await countQuery

    const totalCount = Number(totalCountResult[0]?.count || 0)
    const totalPages = Math.ceil(totalCount / limit)

    // Get reports with pagination
    const reportsQuery = db
      .select({
        id: reports.id,
        input: reports.input,
        reportData: reports.reportData,
        createdAt: reports.createdAt,
        updatedAt: reports.updatedAt,
      })
      .from(reports)

    const reportsList = whereCondition
      ? await reportsQuery.where(whereCondition).orderBy(desc(reports.createdAt)).limit(limit).offset(offset)
      : await reportsQuery.orderBy(desc(reports.createdAt)).limit(limit).offset(offset)

    // Extract product name from reportData for easier display
    const reportsWithMetadata = reportsList.map((report) => {
      const reportData = report.reportData as any
      return {
        id: report.id,
        input: report.input,
        productName: reportData?.product?.productName || report.input,
        vendorName: reportData?.product?.vendorName || "",
        websiteUrl: reportData?.product?.websiteUrl || "",
        trustScore: reportData?.trustScore || 0,
        riskLevel: reportData?.riskLevel || "Unknown",
        recommendation: reportData?.recommendation || "",
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      }
    })

    return NextResponse.json({
      reports: reportsWithMetadata,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    })
  } catch (error) {
    console.error("Error fetching reports:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
})

