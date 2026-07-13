'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import AppHeader from '@/components/app-shell/AppHeader';
import {
  createRun,
  createAutoRun,
  generateCases,
  getRun,
  listRuns,
  deleteRun,
} from '@/lib/evals';
import { EVAL_CRITERIA, type EvalCase, type EvalRun } from '@/types/eval';

type CaseInput = { query: string; expectedAnswer: string };

function scoreColor(score: number): string {
  if (score >= 4) return 'var(--ok)';
  if (score >= 2.5) return 'var(--ink)';
  return 'var(--accent)';
}

export default function EvaluationWorkbenchPage() {
  const params = useParams<{ workflowId: string }>();
  const workflowId = params.workflowId;

  const [cases, setCases] = useState<CaseInput[]>([
    { query: '', expectedAnswer: '' },
  ]);
  const [run, setRun] = useState<EvalRun | null>(null);
  const [history, setHistory] = useState<EvalRun[]>([]);
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await listRuns(workflowId));
    } catch {
      /* non-fatal */
    }
  }, [workflowId]);

  useEffect(() => {
    loadHistory();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadHistory]);

  // Poll the active run until it leaves "running".
  const startPolling = useCallback(
    (runId: string) => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const fresh = await getRun(workflowId, runId);
          setRun(fresh);
          if (fresh.status !== 'running') {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            setBusy(false);
            loadHistory();
          }
        } catch {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setBusy(false);
        }
      }, 2000);
    },
    [workflowId, loadHistory]
  );

  const handleRun = async (auto = false) => {
    setError(null);
    const payload: EvalCase[] = cases
      .filter((c) => c.query.trim())
      .map((c) => ({
        query: c.query.trim(),
        expectedAnswer: c.expectedAnswer.trim() || undefined,
      }));
    const useAuto = auto || payload.length === 0;
    if (!useAuto && payload.length === 0) {
      setError('Add at least one test case with a query, or generate them.');
      return;
    }
    setBusy(true);
    try {
      const created = useAuto
        ? await createAutoRun(workflowId, 5)
        : await createRun(workflowId, payload);
      setRun(created);
      setExpanded(null);
      if (created._id) startPolling(created._id);
    } catch {
      setError('Failed to start evaluation.');
      setBusy(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const gen = await generateCases(workflowId, 5);
      if (gen.length > 0) {
        setCases(
          gen.map((c) => ({
            query: c.query,
            expectedAnswer: c.expectedAnswer ?? '',
          }))
        );
      } else {
        setError('No cases were generated.');
      }
    } catch {
      setError('Failed to generate cases — check the backend / LLM.');
    } finally {
      setGenerating(false);
    }
  };

  const openHistoryRun = async (runId?: string) => {
    if (!runId) return;
    try {
      const full = await getRun(workflowId, runId);
      setRun(full);
      setExpanded(null);
      if (full.status === 'running') startPolling(runId);
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async (runId?: string) => {
    if (!runId) return;
    await deleteRun(workflowId, runId);
    if (run?._id === runId) setRun(null);
    loadHistory();
  };

  const m = run?.metrics;

  return (
    <div className="min-h-screen">
      <AppHeader
        title={run?.workflowName || 'Evaluation'}
        subtitle="Run test cases and score the agentic system"
        showBack
      />
      <main className="grid grid-cols-1 gap-6 px-6 py-6 xl:grid-cols-3">
        {/* Left: composer + history */}
        <section className="xl:col-span-1 space-y-6">
          <div className="border border-[var(--ink)] bg-[var(--paper)] p-5">
            <div className="flex items-center justify-between">
              <h3 className="display text-[16px] text-[var(--ink)]">Test cases</h3>
              <button
                type="button"
                onClick={() =>
                  setCases([...cases, { query: '', expectedAnswer: '' }])
                }
                className="mono border border-[var(--ink)] bg-[var(--paper)] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)] hover:bg-[var(--paper-2)]"
              >
                + Add
              </button>
            </div>
            <p className="mono mt-1 text-[9px] uppercase tracking-[0.2em] text-[var(--graphite)]">
              Query + optional expected answer — or generate with AI
            </p>

            <div className="mt-4 space-y-4">
              {cases.map((c, i) => (
                <div key={i} className="border border-[var(--rule-soft)] p-3">
                  <div className="flex items-center justify-between">
                    <span className="mono text-[9px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                      Case {i + 1}
                    </span>
                    {cases.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setCases(cases.filter((_, idx) => idx !== i))
                        }
                        className="mono text-[9px] uppercase tracking-[0.2em] text-[var(--accent)] hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <textarea
                    value={c.query}
                    onChange={(e) =>
                      setCases(
                        cases.map((x, idx) =>
                          idx === i ? { ...x, query: e.target.value } : x
                        )
                      )
                    }
                    placeholder="User query…"
                    rows={2}
                    className="mt-2 w-full resize-y border border-[var(--rule-soft)] bg-[var(--paper)] p-2 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--ink)]"
                  />
                  <textarea
                    value={c.expectedAnswer}
                    onChange={(e) =>
                      setCases(
                        cases.map((x, idx) =>
                          idx === i
                            ? { ...x, expectedAnswer: e.target.value }
                            : x
                        )
                      )
                    }
                    placeholder="Expected answer (optional)…"
                    rows={2}
                    className="mt-2 w-full resize-y border border-[var(--rule-soft)] bg-[var(--paper)] p-2 text-[13px] text-[var(--ink-2)] outline-none focus:border-[var(--ink)]"
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || busy}
                className="mono flex-1 border border-[var(--ink)] bg-[var(--paper)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)] hover:bg-[var(--paper-2)] disabled:opacity-50"
              >
                {generating ? 'Generating…' : '✨ Generate cases'}
              </button>
              <button
                type="button"
                onClick={() => handleRun()}
                disabled={busy}
                className="mono flex-1 border border-[var(--ink)] bg-[var(--ink)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--paper)] hover:bg-[var(--accent)] disabled:opacity-50"
              >
                {busy ? 'Running…' : 'Run evaluation'}
              </button>
            </div>
            {error && (
              <div className="mono mt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
                {error}
              </div>
            )}
          </div>

          {/* History */}
          <div className="border border-[var(--ink)] bg-[var(--paper)] p-5">
            <h3 className="display text-[16px] text-[var(--ink)]">History</h3>
            <div className="mt-3 space-y-2">
              {history.length === 0 ? (
                <div className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                  No runs yet
                </div>
              ) : (
                history.map((h) => (
                  <div
                    key={h._id}
                    className="flex items-center justify-between border border-[var(--rule-soft)] px-3 py-2"
                  >
                    <button
                      type="button"
                      onClick={() => openHistoryRun(h._id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="mono text-[11px] text-[var(--ink)]">
                        {h.metrics
                          ? `${h.metrics.overallScore.toFixed(1)}/5`
                          : h.status}
                      </div>
                      <div className="mono text-[9px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                        {new Date(h.createdAt).toLocaleString()} ·{' '}
                        {h.cases.length} cases
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(h._id)}
                      className="mono ml-2 text-[9px] uppercase tracking-[0.2em] text-[var(--accent)] hover:underline"
                    >
                      Del
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Right: scorecard + per-case results */}
        <section className="xl:col-span-2 space-y-6">
          {!run ? (
            <div className="flex h-64 items-center justify-center border border-dashed border-[var(--rule-soft)] mono text-[11px] uppercase tracking-[0.2em] text-[var(--graphite)]">
              Run an evaluation to see the scorecard
            </div>
          ) : (
            <>
              {run.status === 'running' && (
                <div className="border border-[var(--ink)] bg-[var(--paper-2)] px-5 py-3 mono text-[10px] uppercase tracking-[0.2em] text-[var(--ink)]">
                  Running… {run.results.length}/{run.cases.length} cases scored
                </div>
              )}
              {run.status === 'failed' && (
                <div className="border border-[var(--accent)] bg-[var(--accent)]/10 px-5 py-3 mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
                  Run failed: {run.error || 'unknown error'}
                </div>
              )}

              {/* Scorecard */}
              {m && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <MetricCard
                    label="Overall"
                    value={`${m.overallScore.toFixed(1)}/5`}
                    color={scoreColor(m.overallScore)}
                  />
                  <MetricCard
                    label="Success"
                    value={`${(m.successRate * 100).toFixed(0)}%`}
                  />
                  <MetricCard
                    label="Avg latency"
                    value={`${(m.avgDurationMs / 1000).toFixed(1)}s`}
                  />
                  <MetricCard
                    label="Cases"
                    value={`${m.evaluated}/${m.totalCases}`}
                  />
                </div>
              )}

              {/* Per-criterion averages */}
              {m && Object.keys(m.criteriaAverages).length > 0 && (
                <div className="border border-[var(--ink)] bg-[var(--paper)] p-5">
                  <h3 className="display text-[16px] text-[var(--ink)]">
                    Criteria averages
                  </h3>
                  <div className="mt-4 space-y-3">
                    {EVAL_CRITERIA.map((crit) => {
                      const v = m.criteriaAverages[crit];
                      if (v === undefined) return null;
                      return (
                        <div key={crit}>
                          <div className="flex justify-between mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-2)]">
                            <span>{crit}</span>
                            <span>{v.toFixed(1)}/5</span>
                          </div>
                          <div className="mt-1 h-2 w-full bg-[var(--paper-2)]">
                            <div
                              className="h-2"
                              style={{
                                width: `${(v / 5) * 100}%`,
                                background: scoreColor(v),
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Per-case results */}
              {run.results.length > 0 && (
                <div className="border border-[var(--ink)] bg-[var(--paper)] p-5">
                  <h3 className="display text-[16px] text-[var(--ink)]">
                    Per-case results
                  </h3>
                  <div className="mt-4 space-y-2">
                    {run.results.map((r, i) => (
                      <div key={i} className="border border-[var(--rule-soft)]">
                        <button
                          type="button"
                          onClick={() =>
                            setExpanded(expanded === i ? null : i)
                          }
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-[var(--paper-2)]"
                        >
                          <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--ink)]">
                            {r.query}
                          </span>
                          <span
                            className="mono shrink-0 text-[12px] font-semibold"
                            style={{
                              color: r.success
                                ? scoreColor(r.overallScore)
                                : 'var(--accent)',
                            }}
                          >
                            {r.success ? `${r.overallScore.toFixed(1)}/5` : 'ERR'}
                          </span>
                        </button>
                        {expanded === i && (
                          <div className="border-t border-[var(--rule-soft)] px-3 py-3 space-y-3">
                            {!r.success && (
                              <div className="mono text-[11px] text-[var(--accent)]">
                                Error: {r.error}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-3 mono text-[10px] uppercase tracking-[0.18em] text-[var(--graphite)]">
                              {EVAL_CRITERIA.map((crit) =>
                                r.scores[crit] !== undefined ? (
                                  <span key={crit}>
                                    {crit}: {r.scores[crit].toFixed(0)}
                                  </span>
                                ) : null
                              )}
                              <span>
                                {(r.durationMs / 1000).toFixed(1)}s
                              </span>
                              {r.agentsUsed.length > 0 && (
                                <span>agents: {r.agentsUsed.join(', ')}</span>
                              )}
                            </div>
                            {r.rationale && (
                              <div className="text-[12px] italic text-[var(--ink-2)]">
                                “{r.rationale}”
                              </div>
                            )}
                            {r.expectedAnswer && (
                              <div>
                                <div className="mono text-[9px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                                  Expected
                                </div>
                                <div className="whitespace-pre-wrap text-[12px] text-[var(--ink-2)]">
                                  {r.expectedAnswer}
                                </div>
                              </div>
                            )}
                            <div>
                              <div className="mono text-[9px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                                Response
                              </div>
                              <div className="whitespace-pre-wrap text-[12px] text-[var(--ink)]">
                                {r.response || '(empty)'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="border border-[var(--ink)] bg-[var(--paper)] p-4">
      <div
        className="display text-[28px] font-semibold leading-none"
        style={{ color: color || 'var(--ink)' }}
      >
        {value}
      </div>
      <div className="mono mt-2 text-[9px] uppercase tracking-[0.2em] text-[var(--graphite)]">
        {label}
      </div>
    </div>
  );
}
