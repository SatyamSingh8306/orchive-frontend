'use client';

import {
  useState,
  useEffect,
  useRef,
  MouseEvent as ReactMouseEvent,
  WheelEvent as ReactWheelEvent,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import WorkflowBackground from '@/components/ui/WorkflowBackground';
import WorkflowCanvas from '@/components/agent-maker/WorkflowCanvas';
import NodeDetailsPanel from '@/components/agent-maker/NodeDetailsPanel';
import CreateWorkflowModal from '@/components/agent-maker/CreateWorkflowModal';
import IntegrationModal from '@/components/agent-maker/IntegrationModal';
import WorkflowMenu from '@/components/ui/WorkflowMenu';
import type { WorkflowNode, Edge } from '@/types/workflow';
import { workflowPresets, workflow01Nodes, workflow01Edges, sidebarNodes } from '@/utils/nodes';
import { initialNodes, initialEdges } from '@/utils/nodes';
import { FiArrowLeft } from 'react-icons/fi';
// Replaced authFetch with the global axios instance
import api from '@/lib/axios'; 

interface WorkflowListItem {
  id: string;
  name: string;
  lastModified: string;
  status: 'active' | 'inactive';
  nodes?: WorkflowNode[];
  edges?: Edge[];
  description?: string;
}

interface Viewport {
  x: number;
  y: number;
  scale: number;
}

interface DragState {
  nodeId: string;
  pointerStart: { x: number; y: number };
  nodeStart: { x: number; y: number };
}

interface PanState {
  pointerStart: { x: number; y: number };
  viewportStart: { x: number; y: number };
}

const WORLD_WIDTH = 2600;
const WORLD_HEIGHT = 1400;
const NODE_WIDTH = 220;
const NODE_HEIGHT = 110;

/**
 * Force-coerce a node's `x` / `y` to finite numbers.
 *
 * The backend's `WorkflowNode` schema didn't round-trip `x` / `y`
 * (Pydantic v2 silently dropped them on save). Old saved workflows
 * in Mongo + localStorage can come back with `x`/`y` set to
 * `undefined`, which then renders as `NaN` in CSS `left`/`top` and
 * poisons every downstream math (`Math.min(...nodes.map(n => n.x))`
 * becomes `NaN`). Run every loaded node list through this once so
 * the rest of the canvas can assume finite numbers.
 */
function sanitizeNodes(nodes: WorkflowNode[]): WorkflowNode[] {
  return nodes.map((n) => ({
    ...n,
    x: typeof n.x === 'number' && Number.isFinite(n.x) ? n.x : 0,
    y: typeof n.y === 'number' && Number.isFinite(n.y) ? n.y : 0,
  }));
}

const DUPLICATABLE_IDS = new Set(['custom-agent']);

function normalizeNodeId(id: string): string {
  for (const canonical of ['__start__', 'router', 'synthesizer', '__end__', 'human_checkpoint']) {
    if (id === canonical) return canonical;
    if (id.startsWith(canonical + '-')) return canonical;
  }
  if (DUPLICATABLE_IDS.has(id)) return id;
  const m = id.match(/^([a-z0-9_]+)-\d{10,}$/);
  if (m && m[1] !== 'custom-agent') return m[1];
  return id;
}

function normalizeNodes(nodes: WorkflowNode[]): WorkflowNode[] {
  return sanitizeNodes(
    nodes.map(n => (n.id !== normalizeNodeId(n.id) ? { ...n, id: normalizeNodeId(n.id) } : n)),
  );
}

function normalizeEdges(edges: Edge[]): Edge[] {
  return edges.map(e => ({
    ...e,
    from: normalizeNodeId(e.from),
    to: normalizeNodeId(e.to),
  }));
}

export default function AgentMaker() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('Workflows_01');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState<boolean>(true);

  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const [connectingFromNodeId, setConnectingFromNodeId] = useState<string | null>(null);
  const [connectionCursorWorld, setConnectionCursorWorld] = useState<{ x: number; y: number } | null>(null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [viewport, setViewport] = useState<Viewport>({
    x: 80,
    y: 40,
    scale: 1,
  });

  const [workflowsState, setWorkflowsState] = useState<WorkflowListItem[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleRenameWorkflow = async (workflowId: string, newName: string) => {
    try {
      // Using global api instance
      await api.put(`/workflows/${workflowId}`, { name: newName });
      
      setWorkflowsState(prev =>
        prev.map(w => w.id === workflowId ? { ...w, name: newName } : w)
      );
    } catch (error) {
      console.error('Error renaming workflow:', error);
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    try {
      // Using global api instance
      await api.delete(`/workflows/${workflowId}`);
      
      setWorkflowsState(prev => prev.filter(w => w.id !== workflowId));
      if (selectedWorkflow === workflowId) {
        const remaining = workflowsState.filter(w => w.id !== workflowId);
        setSelectedWorkflow(remaining.length > 0 ? remaining[0].id : '');
      }
    } catch (error) {
      console.error('Error deleting workflow:', error);
    }
  };

  const [isCompiling, setIsCompiling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [saveMessageType, setSaveMessageType] = useState<'success' | 'error' | ''>('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showWorkflowId, setShowWorkflowId] = useState(false);
  const [integrationType, setIntegrationType] = useState<'code' | 'script'>('code');

  // // Fetch graph from FastAPI on mount
  // useEffect(() => {
  //   (async () => {
  //     try {
  //       // Using global api instance
  //       const { data: graphRes } = await api.get('/graph');
  //       // Graph is available but not currently used
  //     } catch (err) {
  //       console.error('Failed to load graph', err);
  //     }
  //   })();
  // }, []);

  useEffect(() => {
    const workflow = workflowsState.find(w => w.id === selectedWorkflow);

    if (workflow && workflow.nodes && workflow.edges) {
      console.log('Using database workflow data for:', selectedWorkflow);
      try {
        const saved = window.localStorage.getItem(`workflow:${selectedWorkflow}`);
        if (saved) {
          const parsed = JSON.parse(saved) as { nodes: WorkflowNode[]; edges: Edge[] };
          setNodes(normalizeNodes(parsed.nodes));
          setEdges(normalizeEdges(parsed.edges));
        } else {
          setNodes(normalizeNodes(workflow.nodes));
          setEdges(normalizeEdges(workflow.edges));
        }
      } catch {
        setNodes(normalizeNodes(workflow.nodes));
        setEdges(normalizeEdges(workflow.edges));
      }
    } else {
      const preset = workflowPresets[selectedWorkflow];
      if (preset) {
        console.log('Using preset workflow data for:', selectedWorkflow);
        try {
          const saved = window.localStorage.getItem(`workflow:${selectedWorkflow}`);
          if (saved) {
            const parsed = JSON.parse(saved) as { nodes: WorkflowNode[]; edges: Edge[] };
            setNodes(normalizeNodes(parsed.nodes));
            setEdges(normalizeEdges(parsed.edges));
          } else {
            setNodes(normalizeNodes(preset.nodes));
            setEdges(normalizeEdges(preset.edges));
          }
        } catch {
          setNodes(normalizeNodes(preset.nodes));
          setEdges(normalizeEdges(preset.edges));
        }
      } else {
        console.log('No workflow data found for:', selectedWorkflow);
        setNodes([]);
        setEdges([]);
      }
    }

    setConnectingFromNodeId(null);
    setConnectionCursorWorld(null);
    setViewport({ x: 80, y: 40, scale: 1 });
  }, [selectedWorkflow, workflowsState]);

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [panState, setPanState] = useState<PanState | null>(null);
  const [draggedFunction, setDraggedFunction] = useState<{
    name: string;
    icon: string | undefined;
    color: string;
    nodeId?: string;
    nodeData?: WorkflowNode;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredSidebarNodes = sidebarNodes.filter((node: WorkflowNode) => 
    node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canvasRef = useRef<HTMLDivElement | null>(null);

  const workflows = workflowsState;

  const workflowCategories = [
    { name: 'Supply Chain', glyph: 'SC', color: 'border-[var(--ink)] text-[var(--ink)]' },
    { name: 'Process', glyph: 'PR', color: 'border-[var(--ink)] text-[var(--ink)]' },
    { name: 'Client', glyph: 'CL', color: 'border-[var(--ink)] text-[var(--ink)]' },
    { name: 'Optimization', glyph: 'OP', color: 'border-[var(--ink)] text-[var(--ink)]' },
  ];

  const exportWorkflowToSvg = () => {
    const padding = 80;
    const minX = Math.min(...nodes.map(n => n.x), 0) - padding;
    const minY = Math.min(...nodes.map(n => n.y), 0) - padding;
    const maxX = Math.max(...nodes.map(n => n.x + NODE_WIDTH), WORLD_WIDTH) + padding;
    const maxY = Math.max(...nodes.map(n => n.y + NODE_HEIGHT), WORLD_HEIGHT) + padding;

    const width = maxX - minX;
    const height = maxY - minY;

    const esc = (s: string) =>
      s
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

    const getPortPosition = (node: WorkflowNode, side: 'left' | 'right') => {
      const x = side === 'left' ? node.x : node.x + NODE_WIDTH;
      const y = node.y + NODE_HEIGHT / 2;
      return { x, y };
    };

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    const edgePaths = edges
      .map(edge => {
        const fromNode = nodeMap.get(edge.from);
        const toNode = nodeMap.get(edge.to);
        if (!fromNode || !toNode) return '';

        const start = getPortPosition(fromNode, 'right');
        const end = getPortPosition(toNode, 'left');
        const dx = Math.max(80, Math.abs(end.x - start.x) * 0.4);
        const d = `M ${start.x - minX} ${start.y - minY} C ${start.x + dx - minX} ${start.y - minY}, ${end.x - dx - minX} ${end.y - minY}, ${end.x - minX} ${end.y - minY}`;

        return `<path d="${d}" fill="none" stroke="#0b0b0f" stroke-width="1.5" stroke-linecap="square" />`;
      })
      .join('');

    const nodeRects = nodes
      .map(n => {
        const x = n.x - minX;
        const y = n.y - minY;
        const title = esc(n.label);
        const type = esc(n.kind ?? n.type);
        const desc = n.description ? esc(n.description) : '';
        const accent = n.accentColor || '#0b0b0f';

        const leftPortX = x - 6;
        const rightPortX = x + NODE_WIDTH + 6;
        const portY = y + NODE_HEIGHT / 2 - 6;

        return `
          <g>
            <rect x="${x}" y="${y}" width="${NODE_WIDTH}" height="${NODE_HEIGHT}" fill="#f4efe6" stroke="#0b0b0f" stroke-width="1" />
            <rect x="${x}" y="${y}" width="${NODE_WIDTH}" height="3" fill="${accent}" />
            <rect x="${x + 12}" y="${y + 12}" width="36" height="36" fill="#ece5d6" stroke="#0b0b0f" stroke-width="1" />
            <text x="${x + 30}" y="${y + 36}" font-size="11" font-weight="600" font-family="ui-monospace, monospace" text-anchor="middle" dominant-baseline="middle" fill="#0b0b0f" letter-spacing="2">${esc((n.icon ?? type.slice(0, 2)).toUpperCase())}</text>
            <text x="${x + 60}" y="${y + 26}" font-size="9" fill="#5c5750" font-family="ui-monospace, monospace" letter-spacing="2">${type.toUpperCase()}</text>
            <text x="${x + 60}" y="${y + 46}" font-size="14" font-weight="600" fill="#0b0b0f">${title}</text>
            ${desc ? `<text x="${x + 16}" y="${y + 86}" font-size="10" fill="#1c1c22">${desc}</text>` : ''}
            <rect x="${leftPortX}" y="${portY}" width="12" height="12" fill="#f4efe6" stroke="#0b0b0f" stroke-width="1" />
            <rect x="${rightPortX - 12}" y="${portY}" width="12" height="12" fill="#f4efe6" stroke="#0b0b0f" stroke-width="1" />
          </g>
        `;
      })
      .join('');

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${width}" height="${height}" fill="#f4efe6" />
  ${edgePaths}
  ${nodeRects}
</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedWorkflow}.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    const payload = JSON.stringify({ workflowId: selectedWorkflow, nodes, edges, viewport }, null, 2);
    try {
      await navigator.clipboard.writeText(payload);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = payload;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    setSaveMessageType('');

    try {
      window.localStorage.setItem(`workflow:${selectedWorkflow}`, JSON.stringify({ nodes, edges }));

      const existingWorkflow = workflows.find(w => w.id === selectedWorkflow);

      const workflowData = {
        name: existingWorkflow?.name || 'Agent Workflow',
        description: 'Agent workflow with tools and system prompts',
        nodes,
        edges,
        status: 'active',
        createdBy: user?.id
      };

      let result : any;
      if (existingWorkflow) {
        // Using global api instance
        const { data } = await api.put(`/workflows/${selectedWorkflow}`, { ...workflowData });
        result = data;
        console.log('Workflow updated in MongoDB:', result);
        setWorkflowsState(prev =>
          prev.map(w => w.id === selectedWorkflow ? { ...w, ...result, lastModified: 'Just now' } : w)
        );
        setSaveMessage('Workflow updated successfully!');
      } else {
        // Using global api instance
        const { data } = await api.post('/workflows', workflowData);
        result = data;
        console.log('Workflow saved to MongoDB:', result);
        const newWorkflow = {
          id: result.id,
          name: result.name,
          lastModified: 'Just now',
          status: result.status as 'active' | 'inactive'
        };
        setWorkflowsState(prev => [...prev, newWorkflow]);
        setSelectedWorkflow(result.id);
        setSaveMessage('Workflow created successfully!');
      }
      setSaveMessageType('success');

      setTimeout(() => {
        setSaveMessage('');
        setSaveMessageType('');
      }, 3000);
    } catch (error: any) {
      // Axios error handling
      const errorMessage = error.response?.data?.error || error.message || 'Network error: Failed to save workflow';
      console.error('Save error:', errorMessage);
      setSaveMessage(errorMessage);
      setSaveMessageType('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompileAndRun = async () => {
    setIsCompiling(true);
    try {
      const workflowId = selectedWorkflow;
      if (workflowId) {
        router.push(`/workflow-chat/${workflowId}`);
      }
    } catch (err) {
      console.error('Compile error:', err);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleToggleActive = () => {
    setWorkflowsState(prev =>
      prev.map(w =>
        w.id === selectedWorkflow ? { ...w, status: w.status === 'active' ? 'inactive' : 'active' } : w,
      ),
    );
  };

  // Load workflows from database on mount
  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        // Using global api instance
        const { data: result } = await api.get('/workflows');
        console.log('Workflows loaded from MongoDB:', result);
        const workflows = result.map((w: any) => ({
          id: w.id,
          name: w.name,
          lastModified: new Date(w.updated_at).toLocaleDateString(),
          status: w.status,
          nodes: w.nodes,
          edges: w.edges,
          description: w.description
        }));
        console.log('Processed workflows:', workflows);
        setWorkflowsState(workflows);

        if (workflows.length > 0 && !selectedWorkflow) {
          setSelectedWorkflow(workflows[0].id);
        }
      } catch (error) {
        console.error('Failed to load workflows:', error);
      }
    };

    loadWorkflows();
  }, []);

  const handleCreateWorkflow = async (name: string, agenticSystem: string) => {
    try {
      let initialNodes: WorkflowNode[] = [];
      let initialEdges: Edge[] = [];

      if (agenticSystem === 'basic') {
        initialNodes = [
          {
            id: '__start__',
            type: 'trigger',
            label: 'Start',
            description: 'Workflow entry point',
            x: 100,
            y: 360,
            icon: 'ST',
            accentColor: '#22c55e'
          },
          {
            id: 'custom_agent_1243537',
            type: 'service',
            label: 'Agent',
            description: 'Main agent node',
            x: 400,
            y: 360,
            icon: 'CU',
            accentColor: '#3b82f6',
            systemPrompt: 'You are a helpful AI assistant designed to assist with various tasks. Process user requests efficiently, provide accurate information, and maintain a professional and friendly tone. Adapt your responses based on the context and user needs.'
          },
          {
            id: '__end__',
            type: 'result',
            label: 'End',
            description: 'Workflow completion point',
            x: 700,
            y: 360,
            icon: 'ED',
            accentColor: '#6b7280'
          }
        ];
        initialEdges = [
          { id: 'e1', from: '__start__', to: 'custom_agent_1243537' },
          { id: 'e2', from: 'custom_agent_1243537', to: '__end__' }
        ];
      } else if (agenticSystem === 'advanced') {
        initialNodes = workflow01Nodes;
        initialEdges = workflow01Edges;
      }

      const workflowData = {
        name,
        description: `${agenticSystem} agentic system workflow`,
        nodes: initialNodes,
        edges: initialEdges,
        status: 'active' as const,
        createdBy: user?.id
      };

      // Using global api instance
      const { data: result } = await api.post('/workflows', workflowData);
      
      const newWorkflow = {
        id: result.id,
        name: result.name,
        lastModified: 'Just now',
        status: result.status as 'active' | 'inactive',
        nodes: initialNodes,
        edges: initialEdges
      };

      setWorkflowsState(prev => [...prev, newWorkflow]);
      setSelectedWorkflow(result.id);
      setNodes(sanitizeNodes(initialNodes));
      setEdges(initialEdges);
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleNodeMouseDown = (e: ReactMouseEvent<HTMLDivElement>, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setDragState({
      nodeId,
      pointerStart: { x: e.clientX, y: e.clientY },
      nodeStart: { x: node.x, y: node.y },
    });
  };

  const handleCanvasMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();

    if (connectingFromNodeId) {
      setConnectingFromNodeId(null);
      setConnectionCursorWorld(null);
      return;
    }

    setPanState({
      pointerStart: { x: e.clientX, y: e.clientY },
      viewportStart: { x: viewport.x, y: viewport.y },
    });
  };

  const handleWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const delta = -e.deltaY;
    const zoomFactor = delta > 0 ? 1.1 : 0.9;

    let newScale = viewport.scale * zoomFactor;
    newScale = Math.min(Math.max(newScale, 0.3), 2.5);

    const xs = (cursorX - viewport.x) / viewport.scale;
    const ys = (cursorY - viewport.y) / viewport.scale;

    setViewport({
      scale: newScale,
      x: cursorX - xs * newScale,
      y: cursorY - ys * newScale,
    });
  };

  const handleCanvasDoubleClick = () => {
    setViewport({ x: 80, y: 40, scale: 1 });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragState) {
        const dx = (e.clientX - dragState.pointerStart.x) / viewport.scale;
        const dy = (e.clientY - dragState.pointerStart.y) / viewport.scale;

        setNodes(prev =>
          prev.map(node =>
            node.id === dragState.nodeId
              ? { ...node, x: dragState.nodeStart.x + dx, y: dragState.nodeStart.y + dy }
              : node,
          ),
        );
      }

      if (panState) {
        const dx = e.clientX - panState.pointerStart.x;
        const dy = e.clientY - panState.pointerStart.y;

        setViewport(v => ({
          ...v,
          x: panState.viewportStart.x + dx,
          y: panState.viewportStart.y + dy,
        }));
      }

      if (connectingFromNodeId && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const worldX = (e.clientX - rect.left - viewport.x) / viewport.scale;
        const worldY = (e.clientY - rect.top - viewport.y) / viewport.scale;
        setConnectionCursorWorld({ x: worldX, y: worldY });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (draggedFunction && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const isOverCanvas =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;

        if (isOverCanvas) {
          const worldX = (e.clientX - rect.left - viewport.x) / viewport.scale;
          const worldY = (e.clientY - rect.top - viewport.y) / viewport.scale;

          const SINGLETON_IDS = new Set([
            '__start__',
            'router',
            'synthesizer',
            '__end__',
            'human_checkpoint',
          ]);
          const dragId = draggedFunction.nodeData?.id ?? draggedFunction.nodeId;
          if (dragId && SINGLETON_IDS.has(dragId)) {
            const existing = nodes.find(n => n.id === dragId);
            if (existing) {
              setNodes(prev =>
                prev.map(n =>
                  n.id === dragId
                    ? {
                        ...n,
                        x: worldX - NODE_WIDTH / 2,
                        y: worldY - NODE_HEIGHT / 2,
                      }
                    : n,
                ),
              );
              setDragState(null);
              setPanState(null);
              setDraggedFunction(null);
              return;
            }
          }

          const newNode: WorkflowNode = draggedFunction.nodeData ? {
            ...draggedFunction.nodeData,
            x: worldX - NODE_WIDTH / 2,
            y: worldY - NODE_HEIGHT / 2,
          } : {
            id: `node-${Date.now()}`,
            type: 'function' as const,
            label: draggedFunction.name,
            description: '',
            x: worldX - NODE_WIDTH / 2,
            y: worldY - NODE_HEIGHT / 2,
            icon: draggedFunction.icon,
            accentColor: '#3b82f6',
          };
          setNodes(prev => [...prev, newNode]);
        }
      }

      setDragState(null);
      setPanState(null);
      setDraggedFunction(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, panState, viewport.scale, draggedFunction, viewport.x, viewport.y, connectingFromNodeId]);

  const handlePortMouseDown = (
    e: ReactMouseEvent<HTMLDivElement>,
    nodeId: string,
    side: 'left' | 'right',
  ) => {
    e.stopPropagation();
    e.preventDefault();

    if (side === 'right') {
      setConnectingFromNodeId(nodeId);
      setConnectionCursorWorld(null);
    }

    if (side === 'left' && connectingFromNodeId && connectingFromNodeId !== nodeId) {
      setEdges(prev => {
        const id = `e-${Date.now()}`;
        return [...prev, { id, from: connectingFromNodeId, to: nodeId }];
      });
      setConnectingFromNodeId(null);
      setConnectionCursorWorld(null);
    }
  };

  const handleDeleteNode = (nodeId: string) => {
    console.log('Delete node attempt:', { nodeId, selectedWorkflow });

    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setEdges(prev => prev.filter(edge => edge.from !== nodeId && edge.to !== nodeId));

    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }

    console.log('Node deleted successfully');
  };

  const handleDeleteEdge = (edgeId: string) => {
    console.log('Delete edge attempt:', { edgeId, selectedWorkflow });

    setEdges(prev => prev.filter(edge => edge.id !== edgeId));
    console.log('Edge deleted successfully');
  };

  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) ?? null : null;

  const isPanning = !!panState;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] relative overflow-hidden">
        <WorkflowBackground />

        {/* Navbar */}
        <header className="fixed top-0 left-0 w-full z-50 border-b border-[var(--ink)] bg-[var(--paper)]/90 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-full items-center justify-between px-6">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-3 text-[var(--ink)]" aria-label="Orkaive home">
                <span className="flex h-7 w-7 items-center justify-center border border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]">
                  <span className="display text-[14px] leading-none">Ø</span>
                </span>
                <span className="flex flex-col leading-none">
                  <span className="display text-[15px] font-medium tracking-[-0.01em]">
                    ORKAIVE
                  </span>
                  <span className="mono text-[8px] uppercase tracking-[0.22em] text-[var(--graphite)]">
                    Agent maker
                  </span>
                </span>
              </Link>

              <div className="h-8 w-px bg-[var(--rule-soft)]" />

              <div>
                <div className="display text-[14px] font-semibold text-[var(--ink)]">
                  {workflows.find(w => w.id === selectedWorkflow)?.name}
                </div>
                <div className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                  Workflow · {selectedWorkflow}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/workflow-room/${selectedWorkflow}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mono inline-flex items-center gap-2 border border-[var(--ink)] bg-[var(--paper)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
              >
                Enter room
              </Link>

              <button
                onClick={() => setShowCodeModal(true)}
                className="mono inline-flex items-center gap-2 border border-[var(--ink)] bg-[var(--paper)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
              >
                Code
              </button>

              <button
                onClick={handleCopy}
                className={`mono inline-flex items-center gap-2 border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors ${
                  copySuccess
                    ? 'border-[var(--ok)] bg-[var(--ok)]/10 text-[var(--ok)]'
                    : 'border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]'
                }`}
              >
                {copySuccess ? 'Copied' : 'Copy'}
              </button>

              <button
                onClick={exportWorkflowToSvg}
                className="mono inline-flex items-center gap-2 border border-[var(--ink)] bg-[var(--paper)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
              >
                Download
              </button>

              <button
                onClick={logout}
                className="mono inline-flex items-center gap-2 border border-[var(--ink)] bg-[var(--paper)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <div className="flex h-screen pt-14 relative">

          {/* Left Sidebar Toggle Button */}
          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className="absolute top-1/2 z-40 -translate-y-1/2 border border-[var(--ink)] bg-[var(--paper)] p-2 text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
            style={{ left: leftSidebarOpen ? '256px' : '0px' }}
            aria-label="Toggle left sidebar"
          >
            <svg
              className="h-5 w-5 transition-transform duration-300"
              style={{ transform: leftSidebarOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path strokeLinecap="square" strokeLinejoin="miter" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Left Sidebar */}
          <div
            className={`border-r border-[var(--ink)] bg-[var(--paper-2)] transition-all duration-300 ease-in-out ${
              leftSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
            }`}
          >

            <div className="mb-4">
  <button
    onClick={() => {
      router.push('/')
    }}
    className="mono flex w-full items-center gap-2 border px-3 py-2 text-[10px] uppercase tracking-[0.2em] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
  >
    ← Back
  </button>
</div>

            <div
              className={`p-4 ${leftSidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
            >
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]">
                    Workflows
                  </h3>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="mono border border-[var(--ink)] bg-[var(--paper)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
                  >
                    + New
                  </button>
                </div>
                <div className="space-y-1.5">
                  {workflows.map(workflow => (
                    <div
                      key={workflow.id}
                      className={`flex flex-col gap-1 border px-3 py-2.5 transition-colors ${
                        selectedWorkflow === workflow.id
                          ? 'border-[var(--ink)] bg-[var(--paper)]'
                          : 'border-[var(--rule-soft)] bg-[var(--paper)] hover:border-[var(--ink)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => setSelectedWorkflow(workflow.id)}
                        >
                          <div className="display text-[13px] font-semibold text-[var(--ink)]">
                            {workflow.name}
                          </div>
                          <div className="mono mt-0.5 text-[10px] uppercase tracking-[0.18em] text-[var(--graphite)]">
                            {workflow.lastModified}
                          </div>
                          <div className="mt-1">
                            <span
                              className={`mono border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] ${
                                workflow.status === 'active'
                                  ? 'border-[var(--ok)]/40 bg-[var(--ok)]/10 text-[var(--ok)]'
                                  : 'border-[var(--rule-soft)] bg-[var(--paper-2)] text-[var(--graphite)]'
                              }`}
                            >
                              {workflow.status === 'active' ? '● ON' : '○ OFF'}
                            </span>
                          </div>
                        </div>
                        <WorkflowMenu
                          workflowId={workflow.id}
                          workflowName={workflow.name}
                          onRename={handleRenameWorkflow}
                          onDelete={handleDeleteWorkflow}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-[var(--rule-soft)] pt-4">
                <div className="space-y-1.5 text-xs">
                  <Link
                    href="/dashboard"
                    className="mono block border border-[var(--rule-soft)] bg-[var(--paper)] px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)] hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
                  >
                    Dashboard →
                  </Link>
                  <Link
                    href="/data-logs"
                    className="mono block border border-[var(--rule-soft)] bg-[var(--paper)] px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)] hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
                  >
                    Data logs →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-1 flex-col">
            {/* Top Bar */}
            <div className="border-b border-[var(--ink)] bg-[var(--paper)] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleCompileAndRun}
                    disabled={isCompiling}
                    className="mono inline-flex items-center gap-2 border border-[var(--ink)] bg-[var(--ink)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--paper)] transition-colors hover:bg-[var(--accent)] disabled:opacity-50"
                  >
                    {isCompiling ? 'Compiling…' : 'Compile & Run →'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="mono inline-flex items-center gap-2 border border-[var(--ink)] bg-[var(--paper)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)] transition-colors hover:bg-[var(--ink)] hover:text-[var(--paper)] disabled:opacity-50"
                  >
                    {isSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {workflowCategories.map(category => (
                    <span
                      key={category.name}
                      className={`mono inline-flex items-center gap-2 border bg-[var(--paper)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${category.color}`}
                    >
                      <span className="border border-[var(--ink)] bg-[var(--paper-2)] px-1.5 text-[9px]">
                        {category.glyph}
                      </span>
                      <span>{category.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Save Message Notification */}
            {saveMessage && (
              <div
                className={`mono border-b px-4 py-2 text-center text-[10px] uppercase tracking-[0.2em] ${
                  saveMessageType === 'success'
                    ? 'border-[var(--ok)]/40 bg-[var(--ok)]/10 text-[var(--ok)]'
                    : 'border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]'
                }`}
              >
                {saveMessage}
              </div>
            )}

            <WorkflowCanvas
              canvasRef={canvasRef}
              nodeWidth={NODE_WIDTH}
              nodeHeight={NODE_HEIGHT}
              worldWidth={WORLD_WIDTH}
              worldHeight={WORLD_HEIGHT}
              nodes={nodes}
              edges={edges}
              viewport={viewport}
              isPanning={isPanning}
              connectingFromNodeId={connectingFromNodeId}
              connectionCursorWorld={connectionCursorWorld}
              onCanvasMouseDown={handleCanvasMouseDown}
              onWheel={handleWheel}
              onDoubleClick={handleCanvasDoubleClick}
              onNodeMouseDown={handleNodeMouseDown}
              onSelectNode={setSelectedNodeId}
              onPortMouseDown={(e, nodeId, side) => handlePortMouseDown(e, nodeId, side)}
              onDeleteNode={handleDeleteNode}
              onDeleteEdge={handleDeleteEdge}
            />

            <div
              className={`fixed inset-0 z-[60] ${selectedNode ? 'pointer-events-auto' : 'pointer-events-none'}`}
            >
              <div
                className={`absolute inset-0 bg-[var(--ink)]/40 transition-opacity ${
                  selectedNode ? 'opacity-100' : 'opacity-0'
                }`}
                onMouseDown={() => setSelectedNodeId(null)}
              />
              <div
                className={`absolute right-0 top-0 h-full transition-transform duration-300 ${
                  selectedNode ? 'translate-x-0' : 'translate-x-full'
                }`}
                onMouseDown={e => e.stopPropagation()}
              >
                <NodeDetailsPanel
                  node={selectedNode}
                  onClose={() => setSelectedNodeId(null)}
                  onUpdate={patch => {
                    if (!selectedNodeId) return;
                    setNodes(prev => prev.map(n => (n.id === selectedNodeId ? { ...n, ...patch } : n)));
                  }}
                  workflowId={selectedWorkflow}
                />
              </div>
            </div>
          </div>

          {/* Right Sidebar Toggle Button */}
          <button
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className="absolute right-0 top-1/2 z-40 -translate-y-1/2 border border-[var(--ink)] bg-[var(--paper)] p-2 text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
            style={{ right: rightSidebarOpen ? '256px' : '0px' }}
            aria-label="Toggle right sidebar"
          >
            <svg
              className="h-5 w-5 transition-transform duration-300"
              style={{ transform: rightSidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path strokeLinecap="square" strokeLinejoin="miter" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Right Sidebar - Functions */}
          <div
            className={`border-l border-[var(--ink)] bg-[var(--paper-2)] transition-all duration-300 ease-in-out ${
              rightSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
            }`}
          >
            <div
              className={`flex h-full flex-col p-4 ${
                rightSidebarOpen ? 'opacity-100' : 'opacity-0'
              } transition-opacity duration-300`}
            >
              <h3 className="mono mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]">
                Agents & nodes
              </h3>

              {/* Search Bar */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Search nodes…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mono w-full border border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[var(--ink)] placeholder:text-[var(--graphite)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              {/* Scrollable Node List */}
              <div className="flex-1 space-y-1.5 overflow-y-auto">
                {filteredSidebarNodes.map((node) => (
                  <div
                    key={node.id}
                    onMouseDown={e => {
                      e.preventDefault();
                      const nodeId = node.id === 'custom-agent'
                        ? `${node.id}-${Date.now()}`
                        : node.id;

                      setDraggedFunction({
                        name: node.label,
                        icon: node.icon || '',
                        color: node.accentColor,
                        nodeId: nodeId,
                        nodeData: {
                          ...node,
                          id: nodeId,
                          x: 0,
                          y: 0
                        }
                      });
                    }}
                    className="flex cursor-move items-center gap-2.5 border border-[var(--rule-soft)] bg-[var(--paper)] px-2.5 py-2 transition-colors hover:border-[var(--ink)]"
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--ink)] bg-[var(--paper-2)] text-[9px] font-semibold tracking-[0.18em] text-[var(--ink)]"
                      style={{ borderRadius: 0 }}
                    >
                      {node.icon ?? node.type.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="display block truncate text-[13px] font-semibold text-[var(--ink)]">
                        {node.label}
                      </span>
                      <span className="mono block truncate text-[9.5px] uppercase tracking-[0.18em] text-[var(--graphite)]">
                        {node.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Workflow Modal */}
      <CreateWorkflowModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateWorkflow}
      />

      {/* Integration Modal */}
      <IntegrationModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        selectedWorkflow={selectedWorkflow}
      />
    </ProtectedRoute>
  );
}