export type LogIO = 'Input' | 'Output' | 'Transfer';

export type LogRow = {
  id: string;
  workflowId: string;
  step: number;
  node: string;
  type: string;
  io: LogIO;
  data: string;
  timestamp: string;
};

export const logs: LogRow[] = [
  {
    id: 'inv-1',
    workflowId: 'inventory_restock',
    step: 1,
    node: 'API Input',
    type: 'Api-Input',
    io: 'Input',
    data: 'No Data Recorded',
    timestamp: '—',
  },
  {
    id: 'inv-2',
    workflowId: 'inventory_restock',
    step: 2,
    node: 'API Input',
    type: 'Api-Input',
    io: 'Transfer',
    data: 'Received 245 Product Stock Levels From Warehouse API',
    timestamp: 'Dec 27, 2025 17:26',
  },
  {
    id: 'inv-3',
    workflowId: 'inventory_restock',
    step: 3,
    node: 'Inventory Manager',
    type: 'Inventory',
    io: 'Input',
    data: 'Received 245 Product Stock Levels From Warehouse API',
    timestamp: 'Dec 27, 2025 17:26',
  },
  {
    id: 'inv-4',
    workflowId: 'inventory_restock',
    step: 4,
    node: 'Inventory Manager',
    type: 'Inventory',
    io: 'Output',
    data: 'Generated 12 Purchase Orders For Low-Stock Items',
    timestamp: 'Dec 27, 2025 17:26',
  },
  {
    id: 'cs-1',
    workflowId: 'customer_support_bot',
    step: 1,
    node: 'Ticket Intake',
    type: 'Api-Input',
    io: 'Input',
    data: 'New Ticket #4521: Shipping Delay Inquiry',
    timestamp: 'Dec 27, 2025 15:02',
  },
  {
    id: 'log-1',
    workflowId: 'logistics_optimizer',
    step: 1,
    node: 'Route Planner',
    type: 'Optimization',
    io: 'Transfer',
    data: 'Passed 48 Optimized Routes For Process Analysis',
    timestamp: 'Dec 26, 2025 18:10',
  },
  {
    id: 'log-2',
    workflowId: 'logistics_optimizer',
    step: 2,
    node: 'Dispatcher',
    type: 'Ops',
    io: 'Output',
    data: 'Updated Dispatch Plan For Region-West',
    timestamp: 'Dec 26, 2025 18:12',
  },
];
