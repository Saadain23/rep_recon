import { z } from "zod"

export const CitationSchema = z.object({
  number: z.number().min(1).describe("Citation number (e.g., 1, 2, 3)"),
  url: z.string().refine((val) => URL.canParse(val), {
    message: "Must be a valid URL",
  }).describe("Source URL for this citation"),
  description: z.string().optional().describe("Brief description of what this source provides"),
})

export const ReportSynthesisSchema = z.object({
  executiveSummary: z.string().describe("Executive summary (2-3 sentences)"),
  productOverview: z.string().describe("Product overview section"),
  securityPostureSummary: z.string().describe("Security posture summary with inline citations using [1], [2], etc. markers. Each claim should be precisely cited with the appropriate citation number."),
  securityPostureCitations: z.array(CitationSchema).describe("Array of citations referenced in the Security Posture Summary. Each citation should have a number matching the markers in the text."),
  keyFindings: z.object({
    risks: z.array(z.string()).describe("Array of key risks"),
    strengths: z.array(z.string()).describe("Array of key strengths"),
  }).describe("Key findings section"),
  trustScore: z.number().min(0).max(100).describe("Trust score with rationale"),
  trustScoreRationale: z.string().describe("Rationale for the trust score"),
  recommendation: z.string().describe("Final recommendation"),
  alternativeOptions: z.string().describe("Alternative options section"),
  sources: z.array(z.string().refine((val) => URL.canParse(val), {
    message: "Must be a valid URL",
  })).describe("All sources cited in the report"),
})

export type ReportSynthesis = z.infer<typeof ReportSynthesisSchema>
export type Citation = z.infer<typeof CitationSchema>

