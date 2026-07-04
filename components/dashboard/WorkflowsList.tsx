'use client';

import Link from 'next/link';
import { workflows } from '@/data/workflows';
import { useWorkflowSelection } from '@/components/app-shell/WorkflowContext';

export default function WorkflowsList() {
  const { selectedWorkflowId, setSelectedWorkflowId } = useWorkflowSelection();

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Workflows</h2>
        <Link
          href="/agents-chat"
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
        >
          Try for Free
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {workflows.map(w => {
          const active = selectedWorkflowId ? selectedWorkflowId === w.id : w.status === 'active';
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => setSelectedWorkflowId(w.id)}
              className={
                active
                  ? 'w-full rounded-xl border border-emerald-400/20 bg-[#0b0f35] px-4 py-3 text-left hover:bg-[#0e1342]'
                  : 'w-full rounded-xl border border-white/10 bg-[#0a0920]/40 px-4 py-3 text-left hover:bg-white/10'
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{w.name}</div>
                  <div className="text-[11px] text-white/60">
                    {w.nodes} Nodes • {w.logs} Logs
                  </div>
                </div>
                <span
                  className={
                    w.status === 'active'
                      ? 'rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-bold text-emerald-300 border border-emerald-400/20'
                      : 'rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-white/50 border border-white/10'
                  }
                >
                  {w.status.toUpperCase()}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
