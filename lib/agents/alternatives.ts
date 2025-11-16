import { HumanMessage, AIMessage } from "@langchain/core/messages"
import { createStructuredModel } from "../models/llm"
import { AssessmentState } from "../types/assessment-state"
import { AlternativesSchema } from "../schemas/alternatives"

export async function alternativesAgent(state: AssessmentState) {
  const model = createStructuredModel(AlternativesSchema)
  
  const prompt = `You are a Security Solutions Advisor.

Based on the assessment of: ${state.entityResolution?.productName || state.input}
Category: ${state.classification?.primaryCategory || "Unknown"}
Risk Level: ${state.riskScore?.riskLevel || "Unknown"}

Suggest 1-2 SAFER alternatives that:
- Serve similar use cases
- Have better security posture
- Are appropriate for enterprise use
- Include brief rationale for each

If the assessed product is already highly secure, mention market leaders or comparable alternatives.`

  try {
    const response = await model.invoke([new HumanMessage(prompt)])
    
    // Structured output is returned directly
    const structuredOutput = response as any
    
    // Validate the structured output matches our schema
    const validated = AlternativesSchema.safeParse(structuredOutput)
    
    if (!validated.success) {
      console.error("Structured output validation failed:", validated.error)
      throw new Error("Invalid structured output format")
    }
    
    return {
      alternatives: validated.data.alternatives,
      messages: [new AIMessage("Alternatives analysis completed")],
    }
  } catch (error) {
    console.error("Alternatives agent execution failed:", error)
    
    // Fallback data structure
    const fallback = {
      alternatives: []
    }
    
    return {
      alternatives: fallback.alternatives,
      messages: [new AIMessage("Alternatives agent execution failed. Returning fallback data.")],
    }
  }
}

