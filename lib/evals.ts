// Typed wrappers over the global axios instance for the evaluation API.
import api from '@/lib/axios';
import type { EvalCase, EvalRun } from '@/types/eval';

export interface WorkflowListItem {
  id: string;
  name: string;
  status?: string;
  nodes?: unknown[];
  updated_at?: string;
}

export async function listWorkflows(): Promise<WorkflowListItem[]> {
  const { data } = await api.get('/workflows');
  return Array.isArray(data) ? data : [];
}

export async function createRun(
  workflowId: string,
  cases: EvalCase[]
): Promise<EvalRun> {
  const { data } = await api.post(`/evaluations/${workflowId}/runs`, { cases });
  return data;
}

/** Start a run and let the backend synthesize the test cases. */
export async function createAutoRun(
  workflowId: string,
  numCases = 5
): Promise<EvalRun> {
  const { data } = await api.post(`/evaluations/${workflowId}/runs`, {
    auto_generate: true,
    num_cases: numCases,
  });
  return data;
}

/** Preview AI-generated test cases without running them. */
export async function generateCases(
  workflowId: string,
  numCases = 5
): Promise<EvalCase[]> {
  const { data } = await api.post(`/evaluations/${workflowId}/generate`, {
    num_cases: numCases,
  });
  return data?.cases ?? [];
}

export async function listRuns(workflowId: string): Promise<EvalRun[]> {
  const { data } = await api.get(`/evaluations/${workflowId}/runs`);
  return data?.runs ?? [];
}

export async function getRun(
  workflowId: string,
  runId: string
): Promise<EvalRun> {
  const { data } = await api.get(`/evaluations/${workflowId}/runs/${runId}`);
  return data;
}

export async function getLatest(workflowId: string): Promise<EvalRun | null> {
  const { data } = await api.get(`/evaluations/${workflowId}/latest`);
  return data?.run ?? null;
}

export async function deleteRun(
  workflowId: string,
  runId: string
): Promise<void> {
  await api.delete(`/evaluations/${workflowId}/runs/${runId}`);
}
