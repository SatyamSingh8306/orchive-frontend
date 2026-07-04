export interface DashboardStats {
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  active_runs: number;
  success_rate: number;
  avg_duration_ms: number;
  unique_workflows: number;
}

export interface WorkflowRun {
  run_id: string;
  workflow_id: string;
  workflow_name: string;
  status: 'started' | 'completed' | 'error' | 'cancelled';
  started_at: string;
  duration_ms?: number;
  total_steps: number;
  completed_steps: number;
  error_steps: number;
  has_error: boolean;
  input?: any;
  output?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface TraceEvent {
  run_id: string;
  workflow_id: string;
  step_id: string;
  parent_step_id?: string;
  step_type: 'workflow' | 'agent' | 'tool' | 'chain';
  name: string;
  status: 'started' | 'completed' | 'error' | 'cancelled';
  input?: any;
  output?: any;
  error?: string;
  start_time: string;
  end_time?: string;
  duration_ms?: number;
  metadata: Record<string, any>;
  token_usage?: Record<string, number>;
  children?: TraceEvent[];
}

export interface StepDetail {
  step_id: string;
  parent_step_id?: string;
  step_type: 'workflow' | 'agent' | 'tool' | 'chain';
  name: string;
  status: 'started' | 'completed' | 'error' | 'cancelled';
  start_time: string;
  end_time?: string;
  duration_ms?: number;
  input_preview?: string;
  output_preview?: string;
  input?: any;
  output?: any;
  error?: string;
  metadata: Record<string, any>;
  children: StepDetail[];
}

export interface RunDetails {
  run: WorkflowRun;
  steps: StepDetail[];
}

export interface RealtimeEvent {
  type: 'run_started' | 'run_completed' | 'step_started' | 'step_completed';
  data: any;
  timestamp: string;
}

export interface Workflow {
  workflow_id: string;
  workflow_name: string;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  last_run?: string;
}
