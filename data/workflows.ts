export type WorkflowStatus = 'active' | 'inactive';

export type Workflow = {
  id: string;
  name: string;
  nodes: number;
  logs: number;
  status: WorkflowStatus;
};

export const workflows: Workflow[] = [
  { id: 'inventory_restock', name: 'Inventory_Restock', nodes: 2, logs: 2, status: 'active' },
  { id: 'customer_support_bot', name: 'Customer_Support_Bot', nodes: 2, logs: 1, status: 'active' },
  { id: 'logistics_optimizer', name: 'Logistics_Optimizer', nodes: 2, logs: 2, status: 'inactive' },
  { id: 'compliance_check', name: 'Compliance_Check', nodes: 0, logs: 0, status: 'active' },
];
