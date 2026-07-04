import type { WorkflowNode, Edge, ToolConfig } from '@/types/workflow';

// Re-export types for compatibility
export type { WorkflowNode, Edge, ToolConfig };

// Type tags used to render the node card. These are the few "letters" a
// node can wear — no emoji, no colored blob, just a 2–3 char monospace
// mark consistent with the rest of the design system.
type NodeKind = 'trigger' | 'router' | 'agent' | 'human' | 'service' | 'merge' | 'result';

const workflow01Nodes: WorkflowNode[] = [
  {
    id: '__start__',
    type: 'trigger',
    label: 'Start',
    description: 'Workflow entry point',
    x: 100,
    y: 360,
    icon: 'IN',
    accentColor: '#1f7a3a',
  },
  {
    id: 'router',
    type: 'function',
    label: 'Router',
    description: 'Routes tasks to appropriate agents',
    x: 350,
    y: 360,
    icon: 'RT',
    accentColor: '#0b0b0f',
    kind: 'router' as NodeKind,
  },
  {
    id: 'supply_chain_agent',
    type: 'service',
    label: 'Supply Chain Agent',
    description: 'Handles supply chain related tasks',
    x: 600,
    y: 160,
    icon: 'SC',
    accentColor: '#1a3a8a',
    kind: 'agent' as NodeKind,
    systemPrompt: 'You are a Supply Chain Agent specialized in managing and optimizing supply chain operations. Analyze inventory levels, track shipments, coordinate with suppliers, and identify potential bottlenecks in the supply chain. Provide actionable insights for improving efficiency and reducing costs.',
    goalsAndActions: 'When conflicts arise: 1) Prioritize critical inventory shortages, 2) Communicate immediately with affected suppliers, 3) Implement alternative routing strategies, 4) Document all decisions for post-mortem analysis'
  },
  {
    id: 'process_agent',
    type: 'service',
    label: 'Process Agent',
    description: 'Optimizes business processes',
    x: 600,
    y: 280,
    icon: 'PR',
    accentColor: '#0b0b0f',
    kind: 'agent' as NodeKind,
    systemPrompt: 'You are a Process Agent focused on analyzing and optimizing business processes. Identify inefficiencies, suggest automation opportunities, streamline workflows, and recommend best practices for process improvement. Focus on enhancing productivity and reducing operational costs.'
  },
  {
    id: 'client_agent',
    type: 'service',
    label: 'Client Agent',
    description: 'Manages client interactions',
    x: 600,
    y: 400,
    icon: 'CL',
    accentColor: '#1a3a8a',
    kind: 'agent' as NodeKind,
    systemPrompt: 'You are a Client Agent dedicated to managing and enhancing client relationships. Handle client communications, address concerns, gather feedback, and ensure customer satisfaction. Provide personalized service and maintain professional client engagement.',
    goalsAndActions: 'When conflicts arise: 1) Acknowledge client concerns immediately, 2) Escalate to appropriate team members if needed, 3) Offer temporary solutions while permanent fixes are developed, 4) Follow up to ensure resolution satisfaction'
  },
  {
    id: 'optimization_agent',
    type: 'service',
    label: 'Optimization Agent',
    description: 'Optimizes workflows and resources',
    x: 600,
    y: 520,
    icon: 'OP',
    accentColor: '#1a3a8a',
    kind: 'agent' as NodeKind,
    systemPrompt: 'You are an Optimization Agent specializing in maximizing efficiency and performance. Analyze workflows, resource allocation, and operational patterns to identify optimization opportunities. Recommend data-driven solutions for improving performance and reducing waste.'
  },
  {
    id: 'compliance_agent',
    type: 'service',
    label: 'Compliance Agent',
    description: 'Ensures regulatory compliance',
    x: 850,
    y: 240,
    icon: 'CO',
    accentColor: '#1a3a8a',
    kind: 'agent' as NodeKind,
    systemPrompt: 'You are a Compliance Agent responsible for ensuring regulatory adherence and risk management. Monitor compliance with industry standards, identify potential risks, maintain documentation, and provide guidance on regulatory requirements. Ensure all operations meet legal and ethical standards.'
  },
  {
    id: 'synthesizer',
    type: 'merge',
    label: 'Synthesizer',
    description: 'Combines outputs from all agents',
    x: 1100,
    y: 360,
    icon: 'SY',
    accentColor: '#0b0b0f',
    kind: 'merge' as NodeKind,
  },
  {
    id: '__end__',
    type: 'result',
    label: 'End',
    description: 'Workflow completion point',
    x: 1350,
    y: 360,
    icon: 'OUT',
    accentColor: '#5c5750',
    kind: 'result' as NodeKind,
  },
];

const workflow01Edges: Edge[] = [
  { id: 'e1', from: '__start__', to: 'router' },
  { id: 'e2', from: 'client_agent', to: 'router' },
  { id: 'e3', from: 'client_agent', to: 'synthesizer' },
  { id: 'e4', from: 'compliance_agent', to: 'router' },
  { id: 'e5', from: 'compliance_agent', to: 'synthesizer' },
  { id: 'e6', from: 'optimization_agent', to: 'router' },
  { id: 'e7', from: 'optimization_agent', to: 'synthesizer' },
  { id: 'e8', from: 'process_agent', to: 'router' },
  { id: 'e9', from: 'process_agent', to: 'synthesizer' },
  { id: 'e10', from: 'router', to: 'client_agent' },
  { id: 'e11', from: 'router', to: 'compliance_agent' },
  { id: 'e12', from: 'router', to: 'optimization_agent' },
  { id: 'e13', from: 'router', to: 'process_agent' },
  { id: 'e14', from: 'router', to: 'supply_chain_agent' },
  { id: 'e15', from: 'router', to: 'synthesizer' },
  { id: 'e16', from: 'supply_chain_agent', to: 'router' },
  { id: 'e17', from: 'supply_chain_agent', to: 'synthesizer' },
  { id: 'e18', from: 'synthesizer', to: '__end__' },
];

export const workflowPresets: Record<
  string,
  {
    nodes: WorkflowNode[];
    edges: Edge[];
  }
> = {};

const initialNodes: WorkflowNode[] = [];
const initialEdges: Edge[] = [];

// Sidebar roster — drag-onto-canvas primitives. No emoji; the card
// renders the 2–3 char monospace mark from `icon` inside a thin ink
// frame, with the node's accentColor as a hairline top stripe only.
export const sidebarNodes: WorkflowNode[] = [
  {
    id: '__start__',
    type: 'trigger',
    label: 'Start',
    description: 'Workflow entry point',
    x: 0,
    y: 0,
    icon: 'IN',
    accentColor: '#1f7a3a',
    kind: 'trigger' as NodeKind,
  },
  {
    id: 'router',
    type: 'function',
    label: 'Router',
    description: 'Routes tasks to appropriate agents',
    x: 0,
    y: 0,
    icon: 'RT',
    accentColor: '#0b0b0f',
    kind: 'router' as NodeKind,
  },
  {
    id: 'supply_chain_agent',
    type: 'service',
    label: 'Supply Chain Agent',
    description: 'Handles supply chain related tasks',
    x: 0,
    y: 0,
    icon: 'SC',
    accentColor: '#1a3a8a',
    kind: 'agent' as NodeKind,
    systemPrompt: 'You are a Supply Chain Agent specialized in managing and optimizing supply chain operations. Analyze inventory levels, track shipments, coordinate with suppliers, and identify potential bottlenecks in the supply chain. Provide actionable insights for improving efficiency and reducing costs.'
  },
  {
    id: 'process_agent',
    type: 'service',
    label: 'Process Agent',
    description: 'Optimizes business processes',
    x: 0,
    y: 0,
    icon: 'PR',
    accentColor: '#0b0b0f',
    kind: 'agent' as NodeKind,
    systemPrompt: 'You are a Process Agent focused on analyzing and optimizing business processes. Identify inefficiencies, suggest automation opportunities, streamline workflows, and recommend best practices for process improvement. Focus on enhancing productivity and reducing operational costs.'
  },
  {
    id: 'client_agent',
    type: 'service',
    label: 'Client Agent',
    description: 'Manages client interactions',
    x: 0,
    y: 0,
    icon: 'CL',
    accentColor: '#1a3a8a',
    kind: 'agent' as NodeKind,
    systemPrompt: 'You are a Client Agent dedicated to managing and enhancing client relationships. Handle client communications, address concerns, gather feedback, and ensure customer satisfaction. Provide personalized service and maintain professional client engagement.'
  },
  {
    id: 'optimization_agent',
    type: 'service',
    label: 'Optimization Agent',
    description: 'Optimizes workflows and resources',
    x: 0,
    y: 0,
    icon: 'OP',
    accentColor: '#1a3a8a',
    kind: 'agent' as NodeKind,
    systemPrompt: 'You are an Optimization Agent specializing in maximizing efficiency and performance. Analyze workflows, resource allocation, and operational patterns to identify optimization opportunities. Recommend data-driven solutions for improving performance and reducing waste.'
  },
  {
    id: 'compliance_agent',
    type: 'service',
    label: 'Compliance Agent',
    description: 'Ensures regulatory compliance',
    x: 0,
    y: 0,
    icon: 'CO',
    accentColor: '#1a3a8a',
    kind: 'agent' as NodeKind,
    systemPrompt: 'You are a Compliance Agent responsible for ensuring regulatory adherence and risk management. Monitor compliance with industry standards, identify potential risks, maintain documentation, and provide guidance on regulatory requirements. Ensure all operations meet legal and ethical standards.'
  },
  {
    id: 'deep_search_agent',
    type: 'service',
    label: 'Deep Search Agent',
    description: 'Performs deep research and analysis',
    x: 0,
    y: 0,
    icon: 'DS',
    accentColor: '#1a3a8a',
    kind: 'agent' as NodeKind,
    systemPrompt: `You are a Deep Search Agent designed for advanced web research.

      Your capabilities:
            - Crawl websites and extract relevant information
      - Handle large webpages using chunked processing
        - Reason across multiple sources
        - Summarize long - form content accurately
        - Detect contradictions and outdated information

      Tool Selection Guidelines:
        - Use 'crawl_website_deep' when you need to explore a website thoroughly(follows links)
        - Use 'crawl_single_page' when you have a specific page URL and don't need related pages
        - Use 'deep_search' when you have multiple specific URLs to analyze together

      Guidelines:
        1. Prefer factual accuracy over speculation
        2. Cross - check information across sources when possible
        3. Clearly separate facts from assumptions
        4. Summarize content before reasoning on it
        5. Be explicit when information is incomplete

      When responding:
        - Cite the source URL when possible
        - Combine multiple chunks into coherent insights
        - Provide concise summaries before deep analysis
        - Flag uncertainty or missing data
        - If a page has multiple chunks, read all chunks before drawing conclusions

      Web Links:
      [Link1] : https://www.example.com
      `
  },
  {
    id: 'custom-agent',
    type: 'service',
    label: 'Custom Agent',
    description: 'Create your own custom agent',
    x: 0,
    y: 0,
    icon: 'CU',
    accentColor: '#ff4d1f',
    kind: 'agent' as NodeKind,
    systemPrompt: 'You are a Custom Agent. Configure your role and capabilities based on the specific requirements of this workflow. Adapt your behavior to meet the unique needs of the task at hand.'
  },
  {
    id: 'human_checkpoint',
    type: 'function',
    label: 'Human Checkpoint',
    description: 'Pause for human review',
    x: 0,
    y: 0,
    icon: 'HU',
    accentColor: '#ff4d1f',
    kind: 'human' as NodeKind,
  },
  {
    id: 'synthesizer',
    type: 'merge',
    label: 'Synthesizer',
    description: 'Combines outputs from all agents',
    x: 0,
    y: 0,
    icon: 'SY',
    accentColor: '#0b0b0f',
    kind: 'merge' as NodeKind,
  },
  {
    id: '__end__',
    type: 'result',
    label: 'End',
    description: 'Workflow completion point',
    x: 0,
    y: 0,
    icon: 'OUT',
    accentColor: '#5c5750',
    kind: 'result' as NodeKind,
  },
];

export { initialNodes, initialEdges };
export { workflow01Nodes, workflow01Edges };
export default initialNodes;
