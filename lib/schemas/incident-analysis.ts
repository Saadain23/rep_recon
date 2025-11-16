import { z } from "zod"

export const DataBreachSchema = z.object({
  date: z.string().describe("Date of the breach"),
  description: z.string().describe("Description of what happened"),
  impact: z.string().optional().describe("Impact or number of affected users"),
  source: z.string().optional().describe("Source URL for the breach information"),
})

export const SecurityIncidentSchema = z.object({
  date: z.string().describe("Date of the incident"),
  description: z.string().describe("Description of the security incident"),
  severity: z.string().optional().describe("Severity level"),
  source: z.string().optional().describe("Source URL for the incident information"),
})

export const AbuseSignalSchema = z.object({
  type: z.string().describe("Type of abuse signal"),
  description: z.string().describe("Description of the abuse signal"),
  source: z.string().optional().describe("Source URL for the abuse signal"),
})

export const IncidentAnalysisSchema = z.object({
  dataBreaches: z.array(DataBreachSchema).describe("Array of data breaches (last 3 years)"),
  securityIncidents: z.array(SecurityIncidentSchema).describe("Array of security incidents reported"),
  abuseSignals: z.array(AbuseSignalSchema).describe("Array of abuse/misuse signals in the wild"),
  ransomwareAssociations: z.string().describe("Ransomware/malware associations or 'None found'"),
  vendorSecurityRating: z.number().min(1).max(10).describe("Vendor's security track record rating (1-10)"),
  transparency: z.number().min(1).max(10).describe("Public disclosure and transparency rating (1-10)"),
  summary: z.string().describe("Summary of incident analysis"),
  sources: z.array(z.string().refine((val) => URL.canParse(val), {
    message: "Must be a valid URL",
  })).describe("Array of source URLs from research"),
})

export type DataBreach = z.infer<typeof DataBreachSchema>
export type SecurityIncident = z.infer<typeof SecurityIncidentSchema>
export type AbuseSignal = z.infer<typeof AbuseSignalSchema>
export type IncidentAnalysis = z.infer<typeof IncidentAnalysisSchema>

