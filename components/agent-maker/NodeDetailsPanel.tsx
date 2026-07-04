'use client';

import { useState, useEffect } from 'react';
import type { WorkflowNode, ToolConfig } from '@/types/workflow';

export default function NodeDetailsPanel({
  node,
  onClose,
  onUpdate,
  workflowId,
}: {
  node: WorkflowNode | null;
  onClose: () => void;
  onUpdate: (patch: Partial<Pick<WorkflowNode, 'label' | 'description' | 'systemPrompt' | 'goalsAndActions' | 'ownerEmail'>>) => void;
  workflowId: string;
}) {
  const [tools, setTools] = useState<ToolConfig[]>([]);
  const [newTool, setNewTool] = useState<Partial<ToolConfig>>({
    name: '',
    method: 'GET',
    url: '',
    headers: {},
    query_params: {},
    body: null,
    timeout: 30
  });
  const [editingTool, setEditingTool] = useState<ToolConfig | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [headersInput, setHeadersInput] = useState(JSON.stringify({}, null, 2));
  const [queryParamsInput, setQueryParamsInput] = useState(JSON.stringify({}, null, 2));
  const [bodyInput, setBodyInput] = useState(JSON.stringify(null, null, 2));

  // Load tools for current node when it changes
  useEffect(() => {
    if (!node) {
      setTools([]);
      return;
    }

    const loadTools = async () => {
      try {
        const response = await fetch(`/api/tools?workflowId=${workflowId}&nodeId=${node.id}`);
        if (response.ok) {
          const result = await response.json();
          setTools(result.data || []);
        }
      } catch (error) {
        console.error('Failed to load tools:', error);
      }
    };

    loadTools();
  }, [node, workflowId]);

  if (!node) return null;

  const handleAddTool = async () => {
    if (!newTool.name || !newTool.url || !node) return;

    let headers = {};
    let query_params = {};
    let body = null;

    try {
      headers = JSON.parse(headersInput);
    } catch (e) {
      console.error('Invalid headers JSON, using empty object. Error:', e);
    }

    try {
      query_params = JSON.parse(queryParamsInput);
    } catch (e) {
      console.error('Invalid query params JSON, using empty object. Error:', e);
    }

    try {
      body = JSON.parse(bodyInput);
    } catch (e) {
      console.error('Invalid body JSON, using null. Error:', e);
    }

    const toolConfig: ToolConfig = {
      name: newTool.name,
      method: newTool.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
      url: newTool.url,
      headers,
      query_params,
      body,
      timeout: newTool.timeout,
      workflowId,
      nodeId: node.id
    };

    try {
      const response = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toolConfig)
      });

      if (response.ok) {
        const result = await response.json();
        const updatedTools = [...tools, { ...toolConfig, _id: result.data._id }];
        setTools(updatedTools);

        setNewTool({
          name: '',
          method: 'GET',
          url: '',
          headers: {},
          query_params: {},
          body: null,
          timeout: 30
        });
        setHeadersInput(JSON.stringify({}, null, 2));
        setQueryParamsInput(JSON.stringify({}, null, 2));
        setBodyInput(JSON.stringify(null, null, 2));
      }
    } catch (error) {
      console.error('Failed to save tool:', error);
    }
  };

  const handleRemoveTool = async (toolId: string, index: number) => {
    try {
      const response = await fetch(`/api/tools?id=${toolId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const updatedTools = tools.filter((_, i) => i !== index);
        setTools(updatedTools);
      } else {
        const error = await response.json();
        console.error('Failed to delete tool:', error.error);
        alert(error.error);
      }
    } catch (error) {
      console.error('Error deleting tool:', error);
      alert(error);
    }
  };

  const handleEditTool = (tool: ToolConfig) => {
    setEditingTool(tool);
    setIsEditMode(true);
    setHeadersInput(JSON.stringify(tool.headers || {}, null, 2));
    setQueryParamsInput(JSON.stringify(tool.query_params || {}, null, 2));
    setBodyInput(JSON.stringify(tool.body || null, null, 2));
  };

  const handleUpdateTool = async () => {
    if (!editingTool || !editingTool.name || !editingTool.url || !node) return;

    let headers = {};
    let query_params = {};
    let body = null;

    try { headers = JSON.parse(headersInput); } catch (e) { console.error('Invalid headers JSON', e); }
    try { query_params = JSON.parse(queryParamsInput); } catch (e) { console.error('Invalid query params JSON', e); }
    try { body = JSON.parse(bodyInput); } catch (e) { console.error('Invalid body JSON', e); }

    const updatedToolConfig: ToolConfig = {
      ...editingTool,
      name: editingTool.name,
      method: editingTool.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
      url: editingTool.url,
      headers,
      query_params,
      body,
      timeout: editingTool.timeout
    };

    try {
      const response = await fetch('/api/tools', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedToolConfig)
      });

      if (response.ok) {
        const result = await response.json();
        const updatedTools = tools.map(tool =>
          tool._id === editingTool._id ? { ...updatedToolConfig, _id: result.data._id } : tool
        );
        setTools(updatedTools);

        setEditingTool(null);
        setIsEditMode(false);
        setHeadersInput(JSON.stringify({}, null, 2));
        setQueryParamsInput(JSON.stringify({}, null, 2));
        setBodyInput(JSON.stringify(null, null, 2));
      } else {
        const error = await response.json();
        console.error('Failed to update tool:', error.error);
        alert(error.error);
      }
    } catch (error) {
      console.error('Failed to update tool:', error);
      alert('Failed to update tool');
    }
  };

  const handleCancelEdit = () => {
    setEditingTool(null);
    setIsEditMode(false);
    setHeadersInput(JSON.stringify({}, null, 2));
    setQueryParamsInput(JSON.stringify({}, null, 2));
    setBodyInput(JSON.stringify(null, null, 2));
  };

  // Shared form-control classes so the panel reads as one paper surface.
  const inputClass =
    'w-full border border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-[13px] text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none';
  const labelClass = 'mono mb-1 block text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]';

  return (
    <div className="flex h-full w-96 flex-col overflow-y-auto border-l border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--ink)] bg-[var(--ink)] px-4 py-2.5 text-[var(--paper)]">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center border border-[var(--paper)] text-[10px] font-semibold tracking-[0.18em] text-[var(--paper)]">
            {node.icon ?? node.type.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <div className="mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--paper)]">
              Node configuration
            </div>
            <div className="mono text-[9px] uppercase tracking-[0.2em] text-[var(--paper)]/60">
              {node.id}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mono border border-[var(--paper)] bg-transparent px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--paper)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
        >
          Close
        </button>
      </div>

      <div className="space-y-5 p-5">
        <div>
          <div className={labelClass}>Type</div>
          <div className="mono inline-flex border border-[var(--ink)] bg-[var(--paper-2)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)]">
            {node.kind ?? node.type}
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="node-label">
            Label
          </label>
          <input
            id="node-label"
            value={node.label}
            onChange={e => onUpdate({ label: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="node-desc">
            Description
          </label>
          <textarea
            id="node-desc"
            value={node.description ?? ''}
            onChange={e => onUpdate({ description: e.target.value })}
            className={`${inputClass} min-h-[80px]`}
          />
        </div>

        {(node.type === 'service' || node.id.includes('agent')) && (
          <>
            <div>
              <label className={labelClass} htmlFor="node-owner">
                Agent owner (conflict escalation)
              </label>
              <input
                id="node-owner"
                value={node.ownerEmail ?? ''}
                onChange={e => onUpdate({ ownerEmail: e.target.value })}
                placeholder="admin@company.com"
                className={inputClass}
              />
              <p className="mono mt-1.5 text-[9.5px] uppercase tracking-[0.18em] text-[var(--graphite)]">
                This admin is notified when the agent raises a conflict.
              </p>
            </div>

            <div>
              <label className={labelClass} htmlFor="system-prompt">
                System prompt
              </label>
              <textarea
                id="system-prompt"
                value={node.systemPrompt ?? ''}
                onChange={e => onUpdate({ systemPrompt: e.target.value })}
                placeholder="Enter the system prompt for this agent…"
                className={`${inputClass} min-h-[100px] font-mono text-[12px]`}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="goals-actions">
                Conflict goals & actions
              </label>
              <textarea
                id="goals-actions"
                value={node.goalsAndActions ?? ''}
                onChange={e => onUpdate({ goalsAndActions: e.target.value })}
                placeholder="Enter the goals and actions to do in conflict situations…"
                className={`${inputClass} min-h-[80px] font-mono text-[12px]`}
              />
            </div>

            {node.id !== 'deep_search_agent' && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className={`${labelClass} mb-0`}>HTTP tools</label>
                  <span className="mono text-[9px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                    {tools.length} configured
                  </span>
                </div>

                {/* Current Tools */}
                <div className="mb-3 space-y-1.5">
                  {tools.map((tool: ToolConfig, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-2 border border-[var(--rule-soft)] bg-[var(--paper-2)] px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="display truncate text-[13px] font-semibold text-[var(--ink)]">
                          {tool.name}
                        </div>
                        <div className="mono truncate text-[10px] uppercase tracking-[0.18em] text-[var(--graphite)]">
                          {tool.method} · {tool.url}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <button
                          onClick={() => handleEditTool(tool)}
                          className="mono border border-[var(--ink)] bg-[var(--paper)] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => tool._id && handleRemoveTool(tool._id, index)}
                          className="mono border border-[var(--accent)] bg-[var(--paper)] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--paper)]"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add/Edit Tool Form */}
                <div className="space-y-3 border border-[var(--rule-soft)] bg-[var(--paper-2)] p-3">
                  <div className="mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)]">
                    {isEditMode ? 'Edit HTTP tool' : 'Add HTTP tool'}
                  </div>

                  <div>
                    <label className={labelClass}>Tool name</label>
                    <input
                      type="text"
                      value={isEditMode ? editingTool?.name || '' : newTool.name}
                      onChange={e => {
                        if (isEditMode && editingTool) {
                          setEditingTool({ ...editingTool, name: e.target.value });
                        } else {
                          setNewTool(prev => ({ ...prev, name: e.target.value }));
                        }
                      }}
                      placeholder="e.g. fetch_user_data"
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Method</label>
                      <select
                        value={isEditMode ? editingTool?.method || 'GET' : newTool.method}
                        onChange={e => {
                          if (isEditMode && editingTool) {
                            setEditingTool({ ...editingTool, method: e.target.value as any });
                          } else {
                            setNewTool(prev => ({ ...prev, method: e.target.value as any }));
                          }
                        }}
                        className={inputClass}
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                        <option value="PATCH">PATCH</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Timeout (s)</label>
                      <input
                        type="number"
                        value={isEditMode ? editingTool?.timeout || 30 : newTool.timeout}
                        onChange={e => {
                          const timeout = parseInt(e.target.value) || 30;
                          if (isEditMode && editingTool) {
                            setEditingTool({ ...editingTool, timeout });
                          } else {
                            setNewTool(prev => ({ ...prev, timeout }));
                          }
                        }}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>URL</label>
                    <input
                      type="url"
                      value={isEditMode ? editingTool?.url || '' : newTool.url}
                      onChange={e => {
                        if (isEditMode && editingTool) {
                          setEditingTool({ ...editingTool, url: e.target.value });
                        } else {
                          setNewTool(prev => ({ ...prev, url: e.target.value }));
                        }
                      }}
                      placeholder="https://api.example.com/endpoint"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Headers (JSON)</label>
                    <textarea
                      value={headersInput}
                      onChange={e => setHeadersInput(e.target.value)}
                      placeholder='{"Authorization": "Bearer your_token_here", "Content-Type": "application/json"}'
                      className={`${inputClass} h-16 font-mono text-[11px]`}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Query params (JSON)</label>
                    <textarea
                      value={queryParamsInput}
                      onChange={e => setQueryParamsInput(e.target.value)}
                      placeholder='{"user_id": "123", "limit": 10}'
                      className={`${inputClass} h-16 font-mono text-[11px]`}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Body (JSON)</label>
                    <textarea
                      value={bodyInput}
                      onChange={e => setBodyInput(e.target.value)}
                      placeholder='{"action": "get_data", "params": {}}'
                      className={`${inputClass} h-16 font-mono text-[11px]`}
                    />
                  </div>

                  <div className="flex gap-2">
                    {isEditMode ? (
                      <>
                        <button
                          onClick={handleUpdateTool}
                          disabled={!editingTool?.name || !editingTool?.url}
                          className="mono flex-1 border border-[var(--ink)] bg-[var(--ink)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--paper)] hover:bg-[var(--accent)] disabled:opacity-50"
                        >
                          Update tool
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="mono flex-1 border border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleAddTool}
                        disabled={!newTool.name || !newTool.url}
                        className="mono w-full border border-[var(--ink)] bg-[var(--ink)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--paper)] hover:bg-[var(--accent)] disabled:opacity-50"
                      >
                        Add tool
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
