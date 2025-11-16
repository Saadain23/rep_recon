import { HumanMessage, AIMessage } from "@langchain/core/messages"
import { createStructuredModel } from "../models/llm"
import { AssessmentState } from "../types/assessment-state"
import { ReportSynthesisSchema } from "../schemas/report-synthesis"

// Synthesizes all gathered intelligence into a concise, executive-ready brief
 
export async function reportSynthesisAgent(state: AssessmentState) {
  const model = createStructuredModel(ReportSynthesisSchema)
  
  // Collect all sources from previous analyses
  const allSources: string[] = []
  if (state.cveAnalysis?.sources) {
    allSources.push(...state.cveAnalysis.sources)
  }
  if (state.incidentAnalysis?.sources) {
    allSources.push(...state.incidentAnalysis.sources)
  }
  if (state.complianceAnalysis?.sources) {
    allSources.push(...state.complianceAnalysis.sources)
  }
  if (state.entityResolution?.sources) {
    allSources.push(...(Array.isArray(state.entityResolution.sources) ? state.entityResolution.sources : []))
  }
  
  // Remove duplicates
  const uniqueSources = Array.from(new Set(allSources))
  
  const prompt = `You are a CISO Report Writer. Synthesize all gathered intelligence into a concise, executive-ready brief.

Compile data from:
${JSON.stringify({
  entity: state.entityResolution,
  classification: state.classification,
  cve: state.cveAnalysis,
  incidents: state.incidentAnalysis,
  compliance: state.complianceAnalysis,
  risk: state.riskScore,
  alternatives: state.alternatives
}, null, 2)}

Available sources for citation:
${JSON.stringify(uniqueSources, null, 2)}

Create a CISO-ready brief with:
1. Executive Summary (2-3 sentences)
2. Product Overview
3. Security Posture Summary - CRITICAL: This section requires HIGH-QUALITY, PRECISE citations. 
   - Use inline citation markers [1], [2], [3], etc. after each claim or fact
   - Each claim about security posture, CVEs, incidents, compliance, or vulnerabilities MUST be cited
   - Cite specific sources from the available sources list above
   - For CVE-related claims, cite the specific NIST CVE URLs
   - For incident-related claims, cite the specific incident source URLs
   - For compliance claims, cite the specific compliance documentation URLs
   - Example: "The product has 15 critical CVEs in the past 2 years [1], with an average patch time of 30 days [2]."
4. Key Findings (risks and strengths)
5. Trust Score with rationale
6. Recommendation
7. Alternative Options
8. All sources cited (collect all sources from previous analyses)

For Security Posture Summary citations:
- Create a securityPostureCitations array with objects containing: number (matching the [1], [2] markers), url (from available sources), and optional description
- Ensure every citation number in the text has a corresponding entry in securityPostureCitations
- Prioritize citing primary sources (NIST for CVEs, official vendor pages for compliance, reputable security news for incidents)

Make it clear, actionable, and decision-ready. Use professional tone suitable for C-level executives.`

  try {
    const response = await model.invoke([new HumanMessage(prompt)])
    
    // Structured output is returned directly
    const structuredOutput = response as any
    
    // Validate the structured output matches our schema
    const validated = ReportSynthesisSchema.safeParse(structuredOutput)
    
    if (!validated.success) {
      console.error("Structured output validation failed:", validated.error)
      throw new Error("Invalid structured output format")
    }
    
    // Create final report combining structured output with state data
    const finalReport = {
      assessmentDate: new Date().toISOString(),
      product: state.entityResolution,
      classification: state.classification,
      trustScore: state.riskScore?.trustScore || 0,
      riskLevel: state.riskScore?.riskLevel || "Unknown",
      recommendation: state.riskScore?.recommendation || "Further review needed",
      executiveSummary: validated.data.executiveSummary,
      productOverview: validated.data.productOverview,
      securityPostureSummary: validated.data.securityPostureSummary,
      securityPostureCitations: validated.data.securityPostureCitations || [],
      keyFindings: validated.data.keyFindings,
      trustScoreRationale: validated.data.trustScoreRationale,
      alternativeOptions: validated.data.alternativeOptions,
      detailedFindings: {
        cve: state.cveAnalysis,
        incidents: state.incidentAnalysis,
        compliance: state.complianceAnalysis,
        riskAnalysis: state.riskScore
      },
      alternatives: state.alternatives,
      sources: validated.data.sources,
      generatedBy: "Reputation Recon Agent v1.0"
    }
    
    return {
      finalReport,
      messages: [new AIMessage("Report synthesis completed")],
    }
  } catch (error) {
    console.error("Report synthesis agent execution failed:", error)
    
    // Fallback data structure
    const fallback = {
      assessmentDate: new Date().toISOString(),
      product: state.entityResolution,
      classification: state.classification,
      trustScore: state.riskScore?.trustScore || 0,
      riskLevel: state.riskScore?.riskLevel || "Unknown",
      recommendation: state.riskScore?.recommendation || "Further review needed",
      executiveSummary: "Unable to generate executive summary - agent execution failed",
      productOverview: "Unable to generate product overview",
      securityPostureSummary: "Unable to generate security posture summary",
      securityPostureCitations: [],
      keyFindings: {
        risks: [],
        strengths: []
      },
      trustScoreRationale: "Unable to generate rationale",
      alternativeOptions: "Unable to generate alternative options",
      detailedFindings: {
        cve: state.cveAnalysis,
        incidents: state.incidentAnalysis,
        compliance: state.complianceAnalysis,
        riskAnalysis: state.riskScore
      },
      alternatives: state.alternatives,
      sources: [],
      generatedBy: "Reputation Recon Agent v1.0"
    }
    
    return {
      finalReport: fallback,
      messages: [new AIMessage("Report synthesis agent execution failed. Returning fallback data.")],
    }
  }
}

