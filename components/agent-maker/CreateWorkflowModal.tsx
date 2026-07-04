'use client';

import { useState } from 'react';

interface CreateWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, agenticSystem: string) => void;
}

const agenticSystems = [
  {
    id: 'basic',
    name: 'Basic agent system',
    description: 'Simple agent workflow with one service node and a single human checkpoint.',
  },
  {
    id: 'advanced',
    name: 'Advanced agent system',
    description: 'Multi-agent system with specialized roles (Supply Chain, Process, Client, Optimization, Compliance).',
  },
  {
    id: 'custom',
    name: 'Custom system',
    description: 'Start with a blank canvas. Drag in your own nodes.',
  },
];

export default function CreateWorkflowModal({ isOpen, onClose, onCreate }: CreateWorkflowModalProps) {
  const [workflowName, setWorkflowName] = useState('');
  const [selectedSystem, setSelectedSystem] = useState('basic');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (workflowName.trim()) {
      onCreate(workflowName.trim(), selectedSystem);
      setWorkflowName('');
      setSelectedSystem('basic');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[var(--ink)]/50"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md border border-[var(--ink)] bg-[var(--paper)]">
        {/* header strip */}
        <div className="flex items-center justify-between border-b border-[var(--ink)] bg-[var(--ink)] px-4 py-2.5 text-[var(--paper)]">
          <div className="mono text-[10px] font-semibold uppercase tracking-[0.2em]">
            Provision workflow
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mono border border-[var(--paper)] bg-transparent px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--paper)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label
              className="mono mb-1.5 block text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]"
              htmlFor="wf-name"
            >
              Workflow name
            </label>
            <input
              id="wf-name"
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="e.g. Acme supply chain"
              className="w-full border border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-[14px] text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
              required
            />
          </div>

          <div>
            <div className="mono mb-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]">
              Agentic system
            </div>
            <div className="space-y-1.5">
              {agenticSystems.map((system) => (
                <label
                  key={system.id}
                  className={`flex cursor-pointer items-start gap-3 border px-3 py-3 transition-colors ${
                    selectedSystem === system.id
                      ? 'border-[var(--ink)] bg-[var(--paper-2)]'
                      : 'border-[var(--rule-soft)] bg-[var(--paper)] hover:border-[var(--ink)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="agenticSystem"
                    value={system.id}
                    checked={selectedSystem === system.id}
                    onChange={(e) => setSelectedSystem(e.target.value)}
                    className="mt-1 accent-[var(--accent)]"
                  />
                  <div>
                    <div className="display text-[14px] font-semibold text-[var(--ink)]">
                      {system.name}
                    </div>
                    <div className="mt-0.5 text-[12.5px] text-[var(--ink-2)]">
                      {system.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-[var(--rule-soft)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="mono border border-[var(--ink)] bg-[var(--paper)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!workflowName.trim()}
              className="mono border border-[var(--ink)] bg-[var(--ink)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--paper)] hover:bg-[var(--accent)] disabled:opacity-50"
            >
              Create workflow →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
