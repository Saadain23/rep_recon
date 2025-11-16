import { HumanMessage, AIMessage } from "@langchain/core/messages"
import { createModel } from "../models/llm"
import { AssessmentState } from "../types/assessment-state"
import { EntityAndClassificationSchema } from "../schemas/entity-classification"
import { webSearchTool } from "../tools/web-search"
import { createAgent } from "langchain"

export async function entityAndClassificationAgent(state: AssessmentState) {

  const agent = createAgent({
    model: createModel(),
    tools: [webSearchTool],
    systemPrompt: `You are a Software Intelligence Research specialist. Your task is to research and gather comprehensive information about software products.

Your research should cover:
1. Official product name and vendor/company information
2. Company website, headquarters, founding year
3. Company overview and background
4. Software category and classification
5. Deployment model and target users
6. Key features and capabilities

Use the tavily_search tool to find current, accurate information. You can perform multiple searches if needed to gather complete information. Be thorough and verify information from multiple sources when possible.

Think step by step:
1. What information do I need?
2. What search queries would help me find this information?
3. Search and analyze the results
4. Determine if I need more information
5. Once you have sufficient information, provide a comprehensive summary`,
    responseFormat: EntityAndClassificationSchema,
  })

  try {
    console.log(`Starting research for: ${state.input}`)
    
    // Invoke the agent with the research query
    // The agent will automatically use tools, iterate, and return structured output
    const response = await agent.invoke({
      messages: [
        {
          role: "user",
          content: `Research and analyze the following software: ${state.input}

Based on your research, perform entity resolution and classification:

TASK 1 - Entity Resolution:
Extract and identify:
1. Official product name
2. Vendor/company name
3. Official website URL (must be a valid URL or empty string)
4. Company headquarters location
5. Year founded (can be a year string or "Unknown")
6. Brief company overview (2-3 sentences)

TASK 2 - Classification:
Based on the research, classify the software:
- ONE primary category from: File Sharing/Storage, GenAI Tool/LLM Platform, SaaS CRM, Endpoint Agent/Security Tool, Communication/Collaboration, Development Tool/IDE, Analytics/BI Platform, Cloud Infrastructure, Identity/Access Management, API/Integration Platform, Other
- Up to 3 secondary categories
- Deployment model (Cloud/SaaS, On-premise, or Hybrid)
- Target users (Enterprise, SMB, or Individual)
- Key features (exactly 3-5 items)
- Brief reasoning for the classification

Important:
- websiteUrl must be a valid URL or an empty string ""
- sources should include URLs from the research findings
- All enum values must match exactly (case-sensitive)
- keyFeatures must have between 3-5 items`,
        },
      ],
    })

    console.log(`Research completed for: ${state.input}`)

    // Extract structured response from the agent
    // According to LangChain docs, structured output is available via structuredResponse
    const structuredOutput = response.structuredResponse || (response as any).structuredResponse
    
    if (!structuredOutput) {
      // Fallback: try to extract from messages
      const lastMessage = response.messages?.[response.messages.length - 1]
      if (lastMessage && typeof lastMessage.content === "object") {
        const validated = EntityAndClassificationSchema.safeParse(lastMessage.content)
        if (validated.success) {
          return {
            entityResolution: validated.data.entityResolution,
            classification: validated.data.classification,
            messages: [lastMessage as AIMessage],
          }
        }
      }
      throw new Error("No structured output received from agent")
    }

    // Validate the structured output matches our schema
    const validated = EntityAndClassificationSchema.safeParse(structuredOutput)
    
    if (!validated.success) {
      console.error("Structured output validation failed:", validated.error)
      throw new Error("Invalid structured output format")
    }

    // Extract the last message from the agent for context
    const messages = response.messages || []
    const lastMessage = messages[messages.length - 1] || new AIMessage("Research completed")
    
    return {
      entityResolution: validated.data.entityResolution,
      classification: validated.data.classification,
      messages: [lastMessage as AIMessage],
    }
    
  } catch (error) {
    console.error("Agent execution failed:", error)
    
    // Fallback data structure
    const fallback = {
      entityResolution: {
        productName: state.input,
        vendorName: "Unknown",
        websiteUrl: "",
        headquarters: "Unknown",
        yearFounded: "Unknown",
        companyOverview: "Unable to resolve entity - agent execution failed",
        sources: []
      },
      classification: {
        primaryCategory: "Other" as const,
        secondaryCategories: [],
        deploymentModel: "Cloud/SaaS" as const,
        targetUsers: "Enterprise" as const,
        keyFeatures: ["Feature 1", "Feature 2", "Feature 3"],
        reasoning: `Unable to classify - ${error instanceof Error ? error.message : "Unknown error"}`
      }
    }
    
    return {
      entityResolution: fallback.entityResolution,
      classification: fallback.classification,
      messages: [new AIMessage("Agent execution failed. Returning fallback data.")],
    }
  }
}