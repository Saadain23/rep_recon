import { z } from "zod"

export const ComplianceAnalysisSchema = z.object({
  certifications: z.array(z.string()).describe("Array of certifications (SOC 2, ISO 27001, GDPR, HIPAA, etc.)"),
  dataHandling: z.string().describe("Description of data handling practices"),
  dataResidency: z.string().describe("Data residency options (regions, countries, etc.)"),
  privacyScore: z.number().min(1).max(10).describe("Privacy policy quality score (1-10)"),
  adminControls: z.string().describe("Description of admin controls and permissions model"),
  encryption: z.string().describe("Data encryption details (at rest and in transit)"),
  complianceScore: z.number().min(1).max(10).describe("Overall compliance score (1-10)"),
  summary: z.string().describe("Summary of compliance posture"),
  sources: z.array(z.string().refine((val) => URL.canParse(val), {
    message: "Must be a valid URL",
  })).describe("Array of source URLs from research"),
})

export type ComplianceAnalysis = z.infer<typeof ComplianceAnalysisSchema>

