import { HumanMessage, AIMessage } from "@langchain/core/messages"
import { createModel } from "../models/llm"
import { AssessmentState } from "../types/assessment-state"
import { ComplianceAnalysisSchema } from "../schemas/compliance-analysis"
import { webSearchTool } from "../tools/web-search"
import { createAgent } from "langchain"

/**
 * Compliance & Data Handling Agent
 * Analyzes compliance posture and data handling practices
 */
export async function complianceAnalysisAgent(state: AssessmentState) {
  const agent = createAgent({
    model: createModel(),
    tools: [webSearchTool],
    systemPrompt: `You are a Compliance and Data Handling specialist. Your task is to research and analyze compliance posture for software products.

Your research should cover:
1. Certifications (SOC 2, ISO 27001, GDPR, HIPAA, etc.)
2. Data handling practices
3. Data residency options
4. Privacy policy quality
5. Third-party audits
6. Compliance documentation availability
7. Admin controls and permissions model
8. Data encryption (at rest and in transit)

Use the tavily_search tool to find current, accurate information. You can perform multiple searches if needed to gather complete information. Be thorough and verify information from multiple sources when possible.

Think step by step:
1. What compliance information do I need?
2. What search queries would help me find this information?
3. Search and analyze the results
4. Determine if I need more information
5. Once you have sufficient information, provide a comprehensive analysis`,
    responseFormat: ComplianceAnalysisSchema,
  })

  try {
    console.log(`Starting compliance analysis for: ${state.entityResolution?.productName || state.input}`)
    
    const response = await agent.invoke({
      messages: [
        {
          role: "user",
          content: `Analyze compliance posture for: ${state.entityResolution?.productName || state.input}
Category: ${state.classification?.primaryCategory || "Unknown"}

Research and provide:
1. Certifications (SOC 2, ISO 27001, GDPR, HIPAA, etc.)
2. Data handling practices
3. Data residency options
4. Privacy policy quality (score 1-10)
5. Third-party audits
6. Compliance documentation availability
7. Admin controls and permissions model
8. Data encryption (at rest and in transit)
9. Overall compliance score (1-10)
10. Summary of compliance posture
11. Sources (URLs from research findings)

Important:
- privacyScore and complianceScore must be between 1-10
- sources should include URLs from the research findings`,
        },
      ],
    })

    console.log(`Compliance analysis completed for: ${state.entityResolution?.productName || state.input}`)

    // Extract structured response from the agent
    const structuredOutput = response.structuredResponse || (response as any).structuredResponse
    
    if (!structuredOutput) {
      // Fallback: try to extract from messages
      const lastMessage = response.messages?.[response.messages.length - 1]
      if (lastMessage && typeof lastMessage.content === "object") {
        const validated = ComplianceAnalysisSchema.safeParse(lastMessage.content)
        if (validated.success) {
          return {
            complianceAnalysis: validated.data,
            messages: [lastMessage as AIMessage],
          }
        }
      }
      throw new Error("No structured output received from agent")
    }

    // Validate the structured output matches our schema
    const validated = ComplianceAnalysisSchema.safeParse(structuredOutput)
    
    if (!validated.success) {
      console.error("Structured output validation failed:", validated.error)
      throw new Error("Invalid structured output format")
    }

    // Extract the last message from the agent for context
    const messages = response.messages || []
    const lastMessage = messages[messages.length - 1] || new AIMessage("Compliance analysis completed")
    
    return {
      complianceAnalysis: validated.data,
      messages: [lastMessage as AIMessage],
    }
    
  } catch (error) {
    console.error("Compliance analysis agent execution failed:", error)
    
    // Fallback data structure
    const fallback = {
      certifications: [],
      dataHandling: "Unknown",
      dataResidency: "Unknown",
      privacyScore: 5,
      adminControls: "Unknown",
      encryption: "Unknown",
      complianceScore: 5,
      summary: "Insufficient compliance information",
      sources: []
    }
    
    return {
      complianceAnalysis: fallback,
      messages: [new AIMessage("Compliance analysis agent execution failed. Returning fallback data.")],
    }
  }
}

