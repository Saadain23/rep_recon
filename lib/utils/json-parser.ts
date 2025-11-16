/**
 * Extracts and parses JSON from a string response
 * Falls back to a default value if parsing fails
 */
export function parseJsonResponse<T>(
  content: string,
  fallback: T
): T {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T
    }
    return fallback
  } catch (error) {
    console.error("Failed to parse JSON response:", error)
    return fallback
  }
}

