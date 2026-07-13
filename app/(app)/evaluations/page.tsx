'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppHeader from '@/components/app-shell/AppHeader';
import { listWorkflows, getLatest, type WorkflowListItem } from '@/lib/evals';
import type { EvalRun } from '@/types/eval';

type Row = {
  workflow: WorkflowListItem;
  latest: EvalRun | null;
};

function scoreColor(score: number): string {
  if (score >= 4) return 'var(--ok)';
  if (score >= 2.5) return 'var(--ink)';
  return 'var(--accent)';
}

export default function EvaluationsLandingPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const workflows = await listWorkflows();
        // Fetch each workflow's latest completed run in parallel.
        const latest = await Promise.all(
          workflows.map((w) => getLatest(w.id).catch(() => null))
        );
        setRows(workflows.map((w, i) => ({ workflow: w, latest: latest[i] })));
      } catch {
        setError('Failed to load workflows');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen">
      <AppHeader
        title="Evaluations"
        subtitle="Score each workflow's multi-agent system against test cases"
      />
      <main className="px-6 py-6">
        {loading ? (
          <div className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
            Loading workflows…
          </div>
        ) : error ? (
          <div className="border border-[var(--accent)] bg-[var(--accent)]/10 px-6 py-5 mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
            {error}
          </div>
        ) : rows.length === 0 ? (
          <div className="border border-dashed border-[var(--rule-soft)] p-8 text-center mono text-[11px] uppercase tracking-[0.2em] text-[var(--graphite)]">
            No workflows yet — build one in the agent maker first.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rows.map(({ workflow, latest }) => {
              const m = latest?.metrics;
              return (
                <Link
                  key={workflow.id}
                  href={`/evaluations/${workflow.id}`}
                  className="flex flex-col gap-3 border border-[var(--ink)] bg-[var(--paper)] p-5 transition-colors hover:bg-[var(--paper-2)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="display truncate text-[18px] text-[var(--ink)]"
                      title={workflow.name}
                    >
                      {workflow.name}
                    </div>
                    <span className="mono text-[9px] uppercase tracking-[0.18em] text-[var(--graphite)]">
                      {workflow.nodes?.length ?? 0} nodes
                    </span>
                  </div>

                  {m ? (
                    <div className="flex items-end justify-between">
                      <div>
                        <div
                          className="display text-[40px] font-semibold leading-none"
                          style={{ color: scoreColor(m.overallScore) }}
                        >
                          {m.overallScore.toFixed(1)}
                          <span className="mono text-[12px] text-[var(--graphite)]">
                            /5
                          </span>
                        </div>
                        <div className="mono mt-1 text-[9px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                          Overall score
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="mono text-[11px] text-[var(--ink)]">
                          {(m.successRate * 100).toFixed(0)}% ok
                        </div>
                        <div className="mono text-[9px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                          {m.totalCases} cases
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                      Not evaluated yet
                    </div>
                  )}

                  <div className="mono mt-1 border-t border-[var(--rule-soft)] pt-2 text-[9px] uppercase tracking-[0.2em] text-[var(--ink-2)]">
                    Evaluate →
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
