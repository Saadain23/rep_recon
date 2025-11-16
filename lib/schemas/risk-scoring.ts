import { z } from "zod"

export const RiskScoringSchema = z.object({
  trustScore: z.number().min(0).max(100).describe("Trust score (0-100, where 100 is most trustworthy)"),
  confidenceLevel: z.enum(["Low", "Medium", "High"]).describe("Confidence level in the assessment"),
  riskLevel: z.enum(["Low", "Medium", "High", "Critical"]).describe("Overall risk level"),
  rationale: z.string().describe("Detailed rationale for the trust score"),
  keyRisks: z.array(z.string()).describe("Array of key risk factors"),
  keyStrengths: z.array(z.string()).describe("Array of key positive factors"),
  recommendation: z.enum(["Approve", "Approve with conditions", "Reject"]).describe("Final recommendation"),
})

export type RiskScoring = z.infer<typeof RiskScoringSchema>

