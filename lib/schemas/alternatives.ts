import { z } from "zod"

export const AlternativeSchema = z.object({
  name: z.string().describe("Alternative product name"),
  vendor: z.string().describe("Vendor/company name"),
  reason: z.string().describe("Brief rationale for why this is a safer alternative"),
  trustScore: z.number().min(0).max(100).optional().describe("Trust score (0-100) if available"),
  website: z.string().refine((val) => val === "" || URL.canParse(val), {
    message: "Must be a valid URL or empty string",
  }).optional().describe("Website URL if available"),
})

export const AlternativesSchema = z.object({
  alternatives: z.array(AlternativeSchema).min(1).max(2).describe("Array of 1-2 safer alternatives"),
})

export type Alternative = z.infer<typeof AlternativeSchema>
export type Alternatives = z.infer<typeof AlternativesSchema>

