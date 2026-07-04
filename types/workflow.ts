export type NodeType = 'trigger' | 'function' | 'service' | 'merge' | 'result';

/**
 * Optional visual discriminator for the node card. A node's `type` is
 * its functional role (trigger, function, …); `kind` is a finer-grained
 * marker that affects only how the card is rendered (e.g. router vs
 * human checkpoint vs plain agent). Falls back to `type` if unset.
 */
export type NodeKind = 'trigger' | 'router' | 'agent' | 'human' | 'service' | 'merge' | 'result';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  kind?: NodeKind;
  label: string;
  description?: string;
  x: number;
  y: number;
  icon?: string;
  accentColor: string;
  systemPrompt?: string;
  goalsAndActions?: string;
  ownerId?: string;
  ownerEmail?: string;
}

export interface ToolConfig {
  _id?: string; // Use string instead of ObjectId on client side
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  query_params?: Record<string, any>;
  body?: any;
  timeout?: number;
  workflowId: string;
  nodeId: string;
}

export interface WorkflowEdge {
  id: string;
  from: string;
  to: string;
}

export type Edge = WorkflowEdge;

export interface Workflow {
  _id?: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  lastModified: string;
  status: 'active' | 'inactive';
  createdBy?: string;
}
