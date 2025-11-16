import { Annotation } from "@langchain/langgraph"
import { BaseMessage } from "@langchain/core/messages"

// Define the assessment state
export const AssessmentStateAnnotation = Annotation.Root({
  input: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  entityResolution: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  classification: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  securityPosture: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  cveAnalysis: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  incidentAnalysis: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  complianceAnalysis: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  riskScore: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  alternatives: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  finalReport: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  messages: Annotation<BaseMessage[]>({
    reducer: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
    default: () => [],
  }),
  progressCallback: Annotation<((message: string) => void) | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
})

export type AssessmentState = typeof AssessmentStateAnnotation.State

