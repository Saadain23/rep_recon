import { z } from "zod"

// Entity Resolution Schema
export const EntityResolutionSchema = z.object({
  productName: z.string().describe("Official product name"),
  vendorName: z.string().describe("Vendor/company name"),
  websiteUrl: z.string().refine((val) => val === "" || URL.canParse(val), {
    message: "Must be a valid URL or empty string",
  }).describe("Official website URL"),
  headquarters: z.string().describe("Company headquarters location"),
  yearFounded: z.string().describe("Year founded (can be a year or 'Unknown')"),
  companyOverview: z.string().describe("Brief company overview (2-3 sentences)"),
  sources: z.array(z.string().refine((val) => URL.canParse(val), {
    message: "Must be a valid URL",
  })).describe("Array of URLs that were checked or would be checked for verification"),
})

// Classification Schema
export const ClassificationSchema = z.object({
  primaryCategory: z.enum([
    "File Sharing/Storage",
    "GenAI Tool/LLM Platform",
    "SaaS CRM",
    "Endpoint Agent/Security Tool",
    "Communication/Collaboration",
    "Development Tool/IDE",
    "Analytics/BI Platform",
    "Cloud Infrastructure",
    "Identity/Access Management",
    "API/Integration Platform",
    "Other",
  ]).describe("Primary software category. If 'Other' is selected, specify the category in reasoning."),
  secondaryCategories: z.array(z.string()).max(3).optional().default([]).describe("Up to 3 secondary categories"),
  deploymentModel: z.enum(["Cloud/SaaS", "On-premise", "Hybrid"]).describe("Deployment model"),
  targetUsers: z.enum(["Enterprise", "SMB", "Individual"]).describe("Target user base"),
  keyFeatures: z.array(z.string()).min(3).max(5).describe("List of 3-5 key features"),
  reasoning: z.string().describe("Brief reasoning for the classification. If primaryCategory is 'Other', specify the actual category here."),
})

// Combined Output Schema
export const EntityAndClassificationSchema = z.object({
  entityResolution: EntityResolutionSchema,
  classification: ClassificationSchema,
})

export type EntityResolution = z.infer<typeof EntityResolutionSchema>
export type Classification = z.infer<typeof ClassificationSchema>
export type EntityAndClassification = z.infer<typeof EntityAndClassificationSchema>

