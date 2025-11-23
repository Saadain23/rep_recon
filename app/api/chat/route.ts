import { NextRequest, NextResponse } from "next/server"
import { createAssessmentWorkflow } from "@/lib/workflow/assessment-workflow"
import { withAuth } from "@/lib/auth/middleware"

// Initializing the assessment workflow
const app = createAssessmentWorkflow()

export const POST = withAuth(async (req) => {
  try {
    const { input } = await req.json()

    if (!input) {
      return NextResponse.json(
        { error: "Application name or URL is required" },
        { status: 400 }
      )
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      )
    }

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        
        const sendProgress = (message: string) => {
          const data = JSON.stringify({ type: "progress", message })
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        }

        const sendError = (error: string) => {
          const data = JSON.stringify({ type: "error", error })
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        }

        const sendComplete = (report: any) => {
          const data = JSON.stringify({ type: "complete", report })
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          controller.close()
        }

        try {
          // Send initial progress message
          sendProgress("Initializing security assessment...")
          
          // Running the assessment workflow with progress callbacks
          const result = await app.invoke({
            input,
            progressCallback: sendProgress,
          })

          sendComplete(result.finalReport)
        } catch (error) {
          console.error("Error in security assessment:", error)
          sendError(error instanceof Error ? error.message : "Unknown error")
          controller.close()
        }
      },
    })

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })
  } catch (error) {
    console.error("Error setting up SSE:", error)
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
})