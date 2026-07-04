'use client';

import { useState } from 'react';

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWorkflow: string;
}

export default function IntegrationModal({ isOpen, onClose, selectedWorkflow }: IntegrationModalProps) {
  const [showWorkflowId, setShowWorkflowId] = useState(false);
  const [integrationType, setIntegrationType] = useState<'code' | 'script'>('code');
  const [copySuccess, setCopySuccess] = useState(false);

  const getIntegrationCode = () => {
    return `from sasefied.agentic_systems import SasefiedAgenticSystem
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Get workflow ID from environment variables
WORKFLOW_ID = os.getenv("WORKFLOW_ID")

# Initialize the agentic system with workflow ID
agentic_system = SasefiedAgenticSystem(workflow_id=WORKFLOW_ID)

if __name__ == "__main__":
    ans = agentic_system.chat("What can you do?")
    print(ans.response)`;
  };

  const getScriptTag = () => {
    return `<script src="http://localhost:3000/public/widget.js" data-workflow="${selectedWorkflow}" data-theme="light"></script>`;
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleCopyIntegrationCode = () => copyText(getIntegrationCode());
  const handleCopyScriptTag = () => copyText(getScriptTag());
  const handleCopyWorkflowId = () => copyText(selectedWorkflow);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--ink)]/60" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-4xl flex-col overflow-hidden border border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)]">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--ink)] bg-[var(--ink)] px-4 py-2.5 text-[var(--paper)]">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center border border-[var(--paper)] text-[10px] font-semibold tracking-[0.18em] text-[var(--paper)]">
              CD
            </span>
            <div>
              <h3 className="mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--paper)]">
                Integration code
              </h3>
              <p className="mono text-[9px] uppercase tracking-[0.2em] text-[var(--paper)]/60">
                Python or widget tag for this workflow
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="mono border border-[var(--paper)] bg-transparent px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--paper)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
          >
            Close
          </button>
        </div>

        {/* Integration Type Toggle */}
        <div className="flex shrink-0 items-center gap-2 border-b border-[var(--ink)] bg-[var(--paper-2)] px-4 py-3">
          <button
            onClick={() => setIntegrationType('code')}
            className={`mono inline-flex items-center gap-2 border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors ${
              integrationType === 'code'
                ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]'
                : 'border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]'
            }`}
          >
            Python
          </button>
          <button
            onClick={() => setIntegrationType('script')}
            className={`mono inline-flex items-center gap-2 border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors ${
              integrationType === 'script'
                ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]'
                : 'border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]'
            }`}
          >
            Script tag
          </button>
        </div>

        {/* Workflow ID Section */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--ink)] bg-[var(--paper-2)] px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="mono mb-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]">
              Workflow ID
            </div>
            <div className="flex items-center gap-2">
              <input
                type={showWorkflowId ? 'text' : 'password'}
                value={selectedWorkflow}
                readOnly
                className="mono flex-1 border border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-[12px] text-[var(--ink)] focus:outline-none"
              />
              <button
                onClick={() => setShowWorkflowId(!showWorkflowId)}
                className="mono border border-[var(--ink)] bg-[var(--paper)] px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
                title={showWorkflowId ? 'Hide workflow ID' : 'Show workflow ID'}
              >
                {showWorkflowId ? 'Hide' : 'Show'}
              </button>
              <button
                onClick={handleCopyWorkflowId}
                className={`mono border px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors ${
                  copySuccess
                    ? 'border-[var(--ok)] bg-[var(--ok)]/10 text-[var(--ok)]'
                    : 'border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--accent)]'
                }`}
              >
                {copySuccess ? 'Copied' : 'Copy ID'}
              </button>
            </div>
          </div>
        </div>

        {/* Code Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="border border-[var(--ink)] bg-[var(--ink)]">
              <div className="flex items-center justify-between border-b border-[var(--paper)]/10 px-3 py-2 text-[var(--paper)]">
                <div className="mono flex items-center gap-2 text-[9px] uppercase tracking-[0.2em]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                  {integrationType === 'code' ? 'integration.py' : 'widget.html'}
                </div>
                <button
                  onClick={integrationType === 'code' ? handleCopyIntegrationCode : handleCopyScriptTag}
                  className={`mono border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors ${
                    copySuccess
                      ? 'border-[var(--ok)] bg-[var(--ok)]/10 text-[var(--ok)]'
                      : 'border-[var(--paper)] bg-transparent text-[var(--paper)] hover:bg-[var(--paper)] hover:text-[var(--ink)]'
                  }`}
                >
                  {copySuccess ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-[var(--paper)]">
                <code>{integrationType === 'code' ? getIntegrationCode() : getScriptTag()}</code>
              </pre>
            </div>
          </div>

          {/* Instructions */}
          <div className="border-t border-[var(--rule-soft)] bg-[var(--paper-2)] p-5">
            <h4 className="mono mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)]">
              Instructions
            </h4>
            {integrationType === 'code' ? (
              <ol className="mono list-decimal space-y-1.5 pl-5 text-[11px] uppercase tracking-[0.16em] text-[var(--ink-2)]">
                <li>Install dependencies: <code className="border border-[var(--ink)] bg-[var(--paper)] px-1.5 py-0.5 text-[10px] text-[var(--ink)]">pip install python-dotenv</code></li>
                <li>Create a <code className="border border-[var(--ink)] bg-[var(--paper)] px-1.5 py-0.5 text-[10px] text-[var(--ink)]">.env</code> with <code className="border border-[var(--ink)] bg-[var(--paper)] px-1.5 py-0.5 text-[10px] text-[var(--ink)]">WORKFLOW_ID={selectedWorkflow}</code></li>
                <li>The workflow ID is loaded from environment variables for security</li>
                <li>Run with: <code className="border border-[var(--ink)] bg-[var(--paper)] px-1.5 py-0.5 text-[10px] text-[var(--ink)]">python integration.py</code></li>
              </ol>
            ) : (
              <ol className="mono list-decimal space-y-1.5 pl-5 text-[11px] uppercase tracking-[0.16em] text-[var(--ink-2)]">
                <li>Choose your widget file: <code className="border border-[var(--ink)] bg-[var(--paper)] px-1.5 py-0.5 text-[10px] text-[var(--ink)]">widget.js</code></li>
                <li>Add the script tag to your HTML where you want the widget to appear</li>
                <li>The workflow ID is passed as a <code className="border border-[var(--ink)] bg-[var(--paper)] px-1.5 py-0.5 text-[10px] text-[var(--ink)]">data-workflow</code> attribute</li>
                <li>Configure theme with <code className="border border-[var(--ink)] bg-[var(--paper)] px-1.5 py-0.5 text-[10px] text-[var(--ink)]">data-theme</code> (light / dark)</li>
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
