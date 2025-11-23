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
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "12", 10)
    const search = searchParams.get("search") || ""
    const offset = (page - 1) * limit

    // Build where condition
    let whereCondition = eq(reports.userId, user.userId)

    // Add search condition if provided
    if (search) {
      const searchPattern = `%${search}%`
      whereCondition = and(
        whereCondition,
        or(
          ilike(reports.input, searchPattern),
          sql`${reports.reportData}::text ILIKE ${searchPattern}`
        )!
      )!
    }

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(reports)
      .where(whereCondition)

    const totalCount = Number(totalCountResult[0]?.count || 0)
    const totalPages = Math.ceil(totalCount / limit)

    // Get reports with pagination
    const reportsList = await db
      .select({
        id: reports.id,
        input: reports.input,
        reportData: reports.reportData,
        createdAt: reports.createdAt,
        updatedAt: reports.updatedAt,
      })
      .from(reports)
      .where(whereCondition)
      .orderBy(desc(reports.createdAt))
      .limit(limit)
      .offset(offset)

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

