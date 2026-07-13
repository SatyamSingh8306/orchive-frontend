// Evaluation types — mirror app/schemas/eval.py (camelCase aliases).

export interface EvalCase {
  query: string;
  expectedAnswer?: string;
}

export interface EvalCaseResult {
  query: string;
  expectedAnswer?: string;
  response: string;
  agentOutputs?: Record<string, unknown>;
  agentsUsed: string[];
  durationMs: number;
  success: boolean;
  error?: string;
  scores: Record<string, number>; // criterion -> 1..5
  overallScore: number;
  rationale: string;
}

export interface EvalMetrics {
  totalCases: number;
  evaluated: number;
  errors: number;
  successRate: number; // 0..1
  avgDurationMs: number;
  avgOverallScore: number; // 1..5
  criteriaAverages: Record<string, number>;
  overallScore: number; // 1..5 composite
}

export type EvalStatus = 'running' | 'completed' | 'failed';

export interface EvalRun {
  _id?: string;
  workflowId: string;
  workflowName: string;
  status: EvalStatus;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  cases: EvalCase[];
  results: EvalCaseResult[];
  metrics?: EvalMetrics | null;
  error?: string;
}

export const EVAL_CRITERIA = [
  'relevance',
  'correctness',
  'completeness',
  'coherence',
] as const;
