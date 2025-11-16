import { StateGraph, END, START } from "@langchain/langgraph"
import { AssessmentStateAnnotation } from "../types/assessment-state"
import {
  entityAndClassificationAgent,
  cveAnalysisAgent,
  incidentAnalysisAgent,
  complianceAnalysisAgent,
  riskScoringAgent,
  alternativesAgent,
  reportSynthesisAgent,
} from "../agents"

/**
 * Creates and compiles the assessment workflow
 * 
 * Workflow structure:
 * 1. Entity & Classification (combined) -> (CVE Analysis, Incident Analysis, Compliance Analysis) [parallel]
 * 2. (CVE, Incidents, Compliance) -> Risk Scoring
 * 3. Risk Scoring -> Find Alternatives
 * 4. Find Alternatives -> Synthesize Report
 * 5. Synthesize Report -> END
 */
export function createAssessmentWorkflow() {
  // Wrapper functions to add progress messages
  const entityAndClassificationWithProgress = async (state: any) => {
    if (state.progressCallback) {
      state.progressCallback("Starting entity resolution and classification...")
    }
    const result = await entityAndClassificationAgent(state)
    if (state.progressCallback) {
      state.progressCallback("Entity resolution and classification completed")
    }
    return result
  }

  const cveAnalysisWithProgress = async (state: any) => {
    if (state.progressCallback) {
      state.progressCallback("Starting CVE analysis...")
    }
    const result = await cveAnalysisAgent(state)
    if (state.progressCallback) {
      state.progressCallback("CVE analysis completed")
    }
    return result
  }

  const incidentAnalysisWithProgress = async (state: any) => {
    if (state.progressCallback) {
      state.progressCallback("Starting incident analysis...")
    }
    const result = await incidentAnalysisAgent(state)
    if (state.progressCallback) {
      state.progressCallback("Incident analysis completed")
    }
    return result
  }

  const complianceAnalysisWithProgress = async (state: any) => {
    if (state.progressCallback) {
      state.progressCallback("Starting compliance analysis...")
    }
    const result = await complianceAnalysisAgent(state)
    if (state.progressCallback) {
      state.progressCallback("Compliance analysis completed")
    }
    return result
  }

  const riskScoringWithProgress = async (state: any) => {
    if (state.progressCallback) {
      state.progressCallback("Calculating risk score...")
    }
    const result = await riskScoringAgent(state)
    if (state.progressCallback) {
      state.progressCallback("Risk scoring completed")
    }
    return result
  }

  const alternativesWithProgress = async (state: any) => {
    if (state.progressCallback) {
      state.progressCallback("Finding alternatives...")
    }
    const result = await alternativesAgent(state)
    if (state.progressCallback) {
      state.progressCallback("Alternatives analysis completed")
    }
    return result
  }

  const reportSynthesisWithProgress = async (state: any) => {
    if (state.progressCallback) {
      state.progressCallback("Synthesizing final report...")
    }
    const result = await reportSynthesisAgent(state)
    if (state.progressCallback) {
      state.progressCallback("Report synthesis completed")
    }
    return result
  }

  const workflow = new StateGraph(AssessmentStateAnnotation)
    .addNode("entityAndClassification", entityAndClassificationWithProgress)
    .addNode("analyzeCVE", cveAnalysisWithProgress)
    .addNode("analyzeIncidents", incidentAnalysisWithProgress)
    .addNode("analyzeCompliance", complianceAnalysisWithProgress)
    .addNode("scoreRisk", riskScoringWithProgress)
    .addNode("findAlternatives", alternativesWithProgress)
    .addNode("synthesizeReport", reportSynthesisWithProgress)
    .addEdge(START, "entityAndClassification")
    .addEdge("entityAndClassification", "analyzeCVE")
    .addEdge("entityAndClassification", "analyzeIncidents")
    .addEdge("entityAndClassification", "analyzeCompliance")
    .addEdge("analyzeCVE", "scoreRisk")
    .addEdge("analyzeIncidents", "scoreRisk")
    .addEdge("analyzeCompliance", "scoreRisk")
    .addEdge("scoreRisk", "findAlternatives")
    .addEdge("findAlternatives", "synthesizeReport")
    .addEdge("synthesizeReport", END)

  return workflow.compile()
}

