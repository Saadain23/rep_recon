import { HumanMessage, AIMessage } from "@langchain/core/messages"
import { createStructuredModel } from "../models/llm"
import { AssessmentState } from "../types/assessment-state"
import { RiskScoringSchema } from "../schemas/risk-scoring"

/**
 * Risk Scoring Agent
 * Calculates comprehensive risk score based on all gathered data
 */
export async function riskScoringAgent(state: AssessmentState) {
  const model = createStructuredModel(RiskScoringSchema)
  
  const prompt = `You are a Risk Assessment specialist. Calculate a comprehensive risk score.

Analyze all gathered data:
Entity: ${JSON.stringify(state.entityResolution, null, 2)}
Classification: ${JSON.stringify(state.classification, null, 2)}
CVE Analysis: ${JSON.stringify(state.cveAnalysis, null, 2)}
Incidents: ${JSON.stringify(state.incidentAnalysis, null, 2)}
Compliance: ${JSON.stringify(state.complianceAnalysis, null, 2)}

Calculate a TRUST SCORE (0-100, where 100 is most trustworthy):
- Consider: vendor reputation, security track record, CVE trends, compliance, incidents
- Weight factors appropriately
- Provide detailed rationale
- Include confidence level (Low, Medium, or High)
- List key risk factors
- List key positive factors
- Provide recommendation (Approve, Approve with conditions, or Reject)
- Determine risk level (Low, Medium, High, or Critical)`

  try {
    const response = await model.invoke([new HumanMessage(prompt)])
    
    // Structured output is returned directly
    const structuredOutput = response as any
    
    // Validate the structured output matches our schema
    const validated = RiskScoringSchema.safeParse(structuredOutput)
    
    if (!validated.success) {
      console.error("Structured output validation failed:", validated.error)
      throw new Error("Invalid structured output format")
    }
    
    return {
      riskScore: validated.data,
      messages: [new AIMessage("Risk scoring completed")],
    }
  } catch (error) {
    console.error("Risk scoring agent execution failed:", error)
    
    // Fallback data structure
    const fallback = {
      trustScore: 50,
      confidenceLevel: "Low" as const,
      riskLevel: "Medium" as const,
      rationale: "Insufficient data for accurate scoring",
      keyRisks: [],
      keyStrengths: [],
      recommendation: "Approve with conditions" as const
    }
    
    return {
      riskScore: fallback,
      messages: [new AIMessage("Risk scoring agent execution failed. Returning fallback data.")],
    }
  }
}

