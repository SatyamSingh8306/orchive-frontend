'use client';

import { useState, useEffect } from 'react';
import { WorkflowRun, StepDetail } from '@/types/dashboard';
import api from '@/lib/axios';

interface TraceViewerProps {
  run: WorkflowRun | null;
  isOpen: boolean;
  onClose: () => void;
}

interface TraceNode {
  id: string;
  name: string;
  type: 'workflow' | 'agent' | 'tool' | 'chain';
  status: 'started' | 'completed' | 'error' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration?: number;
  input?: any;
  output?: any;
  error?: string;
  tokens?: number;
  parent?: string;
  children?: string[];
  position?: { x: number; y: number };
}

export default function TraceViewer({ run, isOpen, onClose }: TraceViewerProps) {
  const [nodes, setNodes] = useState<TraceNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<TraceNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && run) {
      fetchTraceData();
    }
  }, [isOpen, run]);

  const fetchTraceData = async () => {
    if (!run) return;

    try {
      setLoading(true);
      const { data } = await api.get(`/dashboard/runs/${run.run_id}`);
      const traceNodes = convertStepsToNodes(data.steps || []);
      setNodes(traceNodes);

      // Auto-select first node
      if (traceNodes.length > 0) {
        setSelectedNode(traceNodes[0]);
      }
    } catch (err) {
      console.error('Failed to fetch trace data:', err);
    } finally {
      setLoading(false);
    }
  };

  const convertStepsToNodes = (steps: StepDetail[]): TraceNode[] => {
    const nodeMap = new Map<string, TraceNode>();

    const processStep = (step: StepDetail, parent?: string) => {
      const node: TraceNode = {
        id: step.step_id,
        name: step.name,
        type: step.step_type,
        status: step.status,
        startTime: step.start_time,
        endTime: step.end_time,
        duration: step.duration_ms,
        input: step.input,
        output: step.output,
        error: step.error,
        parent,
        children: [],
        position: calculateNodePosition(step.step_id, parent)
      };

      nodeMap.set(step.step_id, node);

      // Process children
      if (step.children && step.children.length > 0) {
        step.children.forEach(child => processStep(child, step.step_id));
      }
    };

    steps.forEach(step => processStep(step));

    // Build parent-child relationships
    nodeMap.forEach((node, id) => {
      if (node.parent) {
        const parent = nodeMap.get(node.parent);
        if (parent) {
          parent.children = [...(parent.children || []), id];
        }
      }
    });

    return Array.from(nodeMap.values());
  };

  const calculateNodePosition = (nodeId: string, parentId?: string) => {
    const level = parentId ? 1 : 0;
    const index = nodes.length;

    return {
      x: 100 + (level * 200) + (index % 3) * 50,
      y: 80 + Math.floor(index / 3) * 120
    };
  };

  const getNodeColor = (type: string, status: string) => {
    if (status === 'error') return { fill: '#ef4444', stroke: '#dc2626' };
    if (status === 'completed') return { fill: '#10b981', stroke: '#059669' };
    if (status === 'started') return { fill: '#3b82f6', stroke: '#2563eb' };

    switch (type) {
      case 'workflow': return { fill: '#8b5cf6', stroke: '#7c3aed' };
      case 'agent': return { fill: '#3b82f6', stroke: '#2563eb' };
      case 'tool': return { fill: '#f97316', stroke: '#ea580c' };
      default: return { fill: '#6b7280', stroke: '#4b5563' };
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'workflow':
        return (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'agent':
        return (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'tool':
        return (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543.826 3.31 2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c.94-1.543-.826-3.31-2.37-2.37a1.724 1.724 0 00-2.572-1.065z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  const [activeTab, setActiveTab] = useState<'run' | 'feedback' | 'metadata'>('run');

  if (!isOpen) return null;

  return (
    <>
      {/* Slide-in Sidebar from Right */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-5xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header with Tabs */}
        <div className="border-b border-gray-200 flex-shrink-0">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {run ? run.workflow_name : 'Loading...'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {run ? `ID: ${run.run_id.slice(0, 8)}...` : ''}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="px-6 flex space-x-6">
            <button
              onClick={() => setActiveTab('run')}
              className={`pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${activeTab === 'run'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Run
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${activeTab === 'feedback'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Feedback
            </button>
            <button
              onClick={() => setActiveTab('metadata')}
              className={`pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${activeTab === 'metadata'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Metadata
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden h-[calc(100vh-120px)]">
          {activeTab === 'run' && (
            <>
              {/* Left Panel - Trace Tree/List */}
              <div className="w-1/3 border-r border-gray-200 overflow-y-auto bg-gray-50">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-gray-500 text-sm">Loading trace data...</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 space-y-2">
                    {nodes.map((node, index) => {
                      const colors = getNodeColor(node.type, node.status);
                      const isSelected = selectedNode?.id === node.id;

                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNode(node)}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${isSelected
                              ? 'bg-blue-50 border-2 border-blue-500'
                              : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: colors.fill }}
                            >
                              {getNodeIcon(node.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                  {node.name}
                                </h4>
                                <span className="text-xs text-gray-500 ml-2">
                                  {formatDuration(node.duration)}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-gray-500">{node.type}</span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className={`text-xs font-medium ${node.status === 'completed' ? 'text-green-600' :
                                    node.status === 'error' ? 'text-red-600' :
                                      node.status === 'started' ? 'text-blue-600' :
                                        'text-gray-600'
                                  }`}>
                                  {node.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Panel - Node Details */}
              <div className="flex-1 overflow-y-auto bg-white">
                {selectedNode ? (
                  <div className="p-6">
                    {/* Node Header */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <div className="flex items-start space-x-4">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: getNodeColor(selectedNode.type, selectedNode.status).fill,
                          }}
                        >
                          {getNodeIcon(selectedNode.type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {selectedNode.name}
                          </h3>
                          <div className="flex items-center space-x-3 text-sm">
                            <span className="text-gray-500">{selectedNode.type}</span>
                            <span className="text-gray-300">•</span>
                            <span className={`font-medium ${selectedNode.status === 'completed' ? 'text-green-600' :
                                selectedNode.status === 'error' ? 'text-red-600' :
                                  selectedNode.status === 'started' ? 'text-blue-600' :
                                    'text-gray-600'
                              }`}>
                              {selectedNode.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Start Time</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(selectedNode.startTime).toLocaleString()}
                        </p>
                      </div>
                      {selectedNode.endTime && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">End Time</label>
                          <p className="mt-1 text-sm text-gray-900">
                            {new Date(selectedNode.endTime).toLocaleString()}
                          </p>
                        </div>
                      )}
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Duration</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {formatDuration(selectedNode.duration) || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Latency</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {formatDuration(selectedNode.duration) || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Input Section */}
                    {selectedNode.input && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          Input
                        </h4>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono">
                            {typeof selectedNode.input === 'string'
                              ? selectedNode.input
                              : JSON.stringify(selectedNode.input, null, 2)
                            }
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Output Section */}
                    {selectedNode.output && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Output
                        </h4>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono">
                            {typeof selectedNode.output === 'string'
                              ? selectedNode.output
                              : JSON.stringify(selectedNode.output, null, 2)
                            }
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Error Section */}
                    {selectedNode.error && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Error
                        </h4>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <pre className="text-xs text-red-700 whitespace-pre-wrap font-mono">
                            {selectedNode.error}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-400">
                      <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <p className="text-sm">Select a node to view details</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'feedback' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-sm">Feedback feature coming soon</p>
              </div>
            </div>
          )}

          {activeTab === 'metadata' && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Run Metadata</h3>
                {run && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Run ID</label>
                        <p className="mt-1 text-sm text-gray-900 font-mono">{run.run_id}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Workflow Name</label>
                        <p className="mt-1 text-sm text-gray-900">{run.workflow_name}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
                        <p className="mt-1 text-sm text-gray-900">{run.status}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Duration</label>
                        <p className="mt-1 text-sm text-gray-900">{formatDuration(run.duration_ms)}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Started At</label>
                        <p className="mt-1 text-sm text-gray-900">{new Date(run.started_at).toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Steps</label>
                        <p className="mt-1 text-sm text-gray-900">{run.completed_steps} / {run.total_steps}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
