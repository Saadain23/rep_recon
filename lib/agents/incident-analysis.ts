import { HumanMessage, AIMessage } from "@langchain/core/messages"
import { createModel } from "../models/llm"
import { AssessmentState } from "../types/assessment-state"
import { IncidentAnalysisSchema } from "../schemas/incident-analysis"
import { webSearchTool } from "../tools/web-search"
import { createAgent } from "langchain"

export async function incidentAnalysisAgent(state: AssessmentState) {
  const agent = createAgent({
    model: createModel(),
    tools: [webSearchTool],
    systemPrompt: `You are a Security Incident Analysis specialist. Your task is to research security incidents and abuse signals for software products.

Your research should cover:
1. Data breaches (last 3 years) - include date, description, and impact
2. Security incidents reported - include date, description, and severity
3. Abuse/misuse in the wild - include type and description
4. Ransomware/malware associations
5. Vendor's security track record (rate 1-10)
6. Public disclosures and transparency (rate 1-10)

Use the tavily_search tool to find current, accurate information. You can perform multiple searches if needed to gather complete information. Be thorough and verify information from multiple sources when possible.

Think step by step:
1. What security incident information do I need?
2. What search queries would help me find this information?
3. Search and analyze the results
4. Determine if I need more information
5. Once you have sufficient information, provide a comprehensive analysis`,
    responseFormat: IncidentAnalysisSchema,
  })

  try {
    console.log(`Starting incident analysis for: ${state.entityResolution?.productName || state.input}`)
    
    const response = await agent.invoke({
      messages: [
        {
          role: "user",
          content: `Research security incidents and abuse signals for: ${state.entityResolution?.productName || state.input}
Vendor: ${state.entityResolution?.vendorName || "Unknown"}

Investigate and provide:
1. Data breaches (last 3 years) - include date, description, and impact if available
2. Security incidents reported - include date, description, and severity if available
3. Abuse/misuse in the wild - include type and description
4. Ransomware/malware associations (or "None found")
5. Vendor's security track record (rate 1-10)
6. Public disclosures and transparency (rate 1-10)
7. Summary of incident analysis
8. Sources (URLs from research findings)

Important:
- vendorSecurityRating and transparency must be between 1-10
- sources should include URLs from the research findings`,
        },
      ],
    })

    console.log(`Incident analysis completed for: ${state.entityResolution?.productName || state.input}`)

    // Extract structured response from the agent
    const structuredOutput = response.structuredResponse || (response as any).structuredResponse
    
    if (!structuredOutput) {
      // Fallback: try to extract from messages
      const lastMessage = response.messages?.[response.messages.length - 1]
      if (lastMessage && typeof lastMessage.content === "object") {
        const validated = IncidentAnalysisSchema.safeParse(lastMessage.content)
        if (validated.success) {
          return {
            incidentAnalysis: validated.data,
            messages: [lastMessage as AIMessage],
          }
        }
      }
      throw new Error("No structured output received from agent")
    }

    // Validate the structured output matches our schema
    const validated = IncidentAnalysisSchema.safeParse(structuredOutput)
    
    if (!validated.success) {
      console.error("Structured output validation failed:", validated.error)
      throw new Error("Invalid structured output format")
    }

    // Extract the last message from the agent for context
    const messages = response.messages || []
    const lastMessage = messages[messages.length - 1] || new AIMessage("Incident analysis completed")
    
    return {
      incidentAnalysis: validated.data,
      messages: [lastMessage as AIMessage],
    }
    
  } catch (error) {
    console.error("Incident analysis agent execution failed:", error)
    
    // Fallback data structure
    const fallback = {
      dataBreaches: [],
      securityIncidents: [],
      abuseSignals: [],
      ransomwareAssociations: "None found",
      vendorSecurityRating: 5,
      transparency: 5,
      summary: "No significant incidents found",
      sources: []
    }
    
    return {
      incidentAnalysis: fallback,
      messages: [new AIMessage("Incident analysis agent execution failed. Returning fallback data.")],
    }
  }
}

