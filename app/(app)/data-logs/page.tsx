'use client';

import { useMemo, useState, useEffect } from 'react';
import AppHeader from '@/components/app-shell/AppHeader';
import DateFilters from '@/components/data-logs/DateFilters';
import LogsTable from '@/components/data-logs/LogsTable';
import { WorkflowRun, TraceEvent } from '@/types/dashboard';
import { LogRow, LogIO } from '@/data/logs';
import api from '@/lib/axios'; // Global axios instance

export default function DataLogsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [traceEvents, setTraceEvents] = useState<TraceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-select the latest run when data loads
  useEffect(() => {
    if (runs.length > 0 && !selectedRunId) {
      setSelectedRunId(runs[0].run_id);
    }
  }, [runs, selectedRunId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Fetch global execution runs using the global axios instance
      const { data: runsData } = await api.get('/dashboard/runs', {
        params: { limit: 50 },
      });

      setRuns(runsData);

      // 2. Fetch trace events for all runs
      if (runsData.length > 0) {
        const eventsPromises = runsData.map(async (run: WorkflowRun) => {
          try {
            // Fetch details for specific run ID
            const { data } = await api.get(`/dashboard/runs/${run.run_id}`);
            return data.steps || [];
          } catch (err) {
            console.error(`Failed to fetch events for run ${run.run_id}:`, err);
            return [];
          }
        });

        const allSteps = await Promise.all(eventsPromises);
        const flatEvents = allSteps.flat();
        setTraceEvents(flatEvents);
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Failed to fetch global logs:', err);
      setLoading(false);
    }
  };

  // Filter runs based on search term and date range
  const filteredRuns = useMemo(() => {
    let filtered = runs;
    
    // Filter by search term (Run ID only, since it's a global instance)
    if (searchTerm) {
      filtered = filtered.filter(run => 
        run.run_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by date range
    if (from) {
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(run => new Date(run.started_at) >= fromDate);
    }
    
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(run => new Date(run.started_at) <= toDate);
    }
    
    return filtered;
  }, [runs, searchTerm, from, to]);

  // Convert trace events to log rows format for the selected run
  const logRows = useMemo(() => {
    if (!selectedRunId) return [];
    
    return traceEvents
      .filter(event => event.run_id === selectedRunId)
      .map((event, index) => ({
        id: event.step_id,
        workflowId: event.workflow_id,
        step: index + 1,
        node: event.name,
        type: event.step_type,
        io: (event.input ? 'Input' : 'Output') as LogIO,
        data: event.input || event.output || JSON.stringify(event.metadata),
        timestamp: new Date(event.start_time).toLocaleTimeString()
      }));
  }, [selectedRunId, traceEvents]);

  const totalRuns = runs.length;
  const activeRuns = runs.filter(run => run.status === 'started').length;
  const totalLogs = traceEvents.length;

  const selectedRun = runs.find(run => run.run_id === selectedRunId);

  return (
    <div className="min-h-screen">
      <AppHeader title="Global Logs" subtitle="Monitor execution history of the global agent" />

      <main className="px-6 py-6">
        <DateFilters from={from} to={to} setFrom={setFrom} setTo={setTo} />

        {/* Stats */}
        <div className="mt-5 grid grid-cols-1 gap-px overflow-hidden border border-[var(--ink)] bg-[var(--ink)] md:grid-cols-3">
          <div className="bg-[var(--paper)] p-5">
            <div className="mono text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--graphite)]">
              Total Runs
            </div>
            <div className="display mt-2 text-[36px] leading-none text-[var(--ink)]">
              {totalRuns}
            </div>
          </div>
          <div className="bg-[var(--paper)] p-5">
            <div className="mono text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--graphite)]">
              Active Runs
            </div>
            <div className="display mt-2 text-[36px] leading-none text-[var(--ink)]">
              {activeRuns}
            </div>
          </div>
          <div className="bg-[var(--paper)] p-5">
            <div className="mono text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--graphite)]">
              Total Logs
            </div>
            <div className="display mt-2 text-[36px] leading-none text-[var(--ink)]">
              {totalLogs}
            </div>
          </div>
        </div>

        {/* Run Selector */}
        <div className="mt-6">
          <div className="border border-[var(--ink)] bg-[var(--paper)] p-4">
            <div className="mb-3 flex items-center gap-3">
              <span className="mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]">
                Execution History
              </span>
              <span className="h-px flex-1 bg-[var(--rule-soft)]" />
            </div>

            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search runs by ID…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mono w-full border border-[var(--ink)] bg-[var(--paper)] px-3 py-2 pl-9 text-[12px] text-[var(--ink)] placeholder:text-[var(--graphite)] focus:border-[var(--accent)] focus:outline-none"
                />
                <svg
                  className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--graphite)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Runs Grid */}
            <div className="mb-6 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
              {filteredRuns.length === 0 ? (
                <div className="col-span-full border border-dashed border-[var(--rule-soft)] py-8 text-center">
                  <svg
                    className="mx-auto mb-3 h-8 w-8 text-[var(--graphite)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <p className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                    No execution runs found
                  </p>
                </div>
              ) : (
                filteredRuns.map((run) => {
                  const isSelected = selectedRunId === run.run_id;
                  const statusTone =
                    run.status === 'completed'
                      ? 'border-[var(--ok)]/40 bg-[var(--ok)]/10 text-[var(--ok)]'
                      : run.status === 'started'
                        ? 'border-[var(--blueprint)]/40 bg-[var(--blueprint-soft)] text-[var(--blueprint)]'
                        : 'border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]';
                  
                  return (
                    <button
                      key={run.run_id}
                      type="button"
                      onClick={() => setSelectedRunId(run.run_id)}
                      className={`flex flex-col items-start gap-2 border bg-[var(--paper)] p-4 text-left transition-colors ${
                        isSelected
                          ? 'border-[var(--ink)] bg-[var(--paper-2)]'
                          : 'border-[var(--rule-soft)] hover:border-[var(--ink)]'
                      }`}
                    >
                      <div className="flex w-full items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="display truncate text-[14px] font-semibold text-[var(--ink)]">
                            {run.workflow_name || 'Global Agent'}
                          </div>
                          <div className="mono mt-0.5 truncate text-[10px] uppercase tracking-[0.18em] text-[var(--graphite)]">
                            {run.run_id}
                          </div>
                        </div>
                        <span
                          className={`mono shrink-0 border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] ${statusTone}`}
                        >
                          {run.status}
                        </span>
                      </div>
                      <div className="mono flex w-full justify-between text-[9.5px] uppercase tracking-[0.18em] text-[var(--graphite)]">
                        <span>{run.total_steps} steps</span>
                        <span>{run.completed_steps} done</span>
                        <span>{new Date(run.started_at).toLocaleTimeString()}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Selected Run Details */}
            {selectedRun && (
              <div className="border-t border-[var(--ink)] pt-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="mono text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]">
                      Selected Execution
                    </div>
                    <div className="display mt-1 text-[18px] font-semibold text-[var(--ink)]">
                      {selectedRun.workflow_name || 'Global Agent'}
                    </div>
                    <div className="mono mt-0.5 text-[10px] uppercase tracking-[0.18em] text-[var(--graphite)]">
                      ID: {selectedRun.run_id} · {selectedRun.total_steps} steps ·{' '}
                      {selectedRun.completed_steps} done
                    </div>
                  </div>
                  <span
                    className={`mono border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] ${
                      selectedRun.status === 'completed'
                        ? 'border-[var(--ok)]/40 bg-[var(--ok)]/10 text-[var(--ok)]'
                        : selectedRun.status === 'started'
                          ? 'border-[var(--blueprint)]/40 bg-[var(--blueprint-soft)] text-[var(--blueprint)]'
                          : 'border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]'
                    }`}
                  >
                    {selectedRun.status}
                  </span>
                </div>

                {logRows.length > 0 && (
                  <div className="mt-4">
                    <LogsTable rows={logRows} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}