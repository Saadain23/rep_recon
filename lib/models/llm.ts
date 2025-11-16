import { ChatAnthropic } from "@langchain/anthropic"
import { z } from "zod"

export function createModel() {
  return new ChatAnthropic({
    model: "claude-sonnet-4-20250514",
    temperature: 0.3,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  })
}

/**
 * Creates a model with structured output support using Zod schema
 */
export function createStructuredModel<T extends z.ZodTypeAny>(schema: T) {
  return createModel().withStructuredOutput(schema, {
    name: "structured_output",
  })
}

