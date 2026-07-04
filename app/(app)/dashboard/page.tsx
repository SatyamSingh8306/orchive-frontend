'use client';

import { useState, useEffect } from 'react';
import AppHeader from '@/components/app-shell/AppHeader';
import WorkflowRunsList from '@/components/dashboard/WorkflowRunsList';
import WorkflowStats from '@/components/dashboard/WorkflowStats';
import RealtimeActivity from '@/components/dashboard/RealtimeActivity';
import { WorkflowRun, DashboardStats } from '@/types/dashboard';
import api from '@/lib/axios'; // Global axios instance

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data on mount.
  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch stats using global axios instance
      const { data: statsData } = await api.get('/dashboard/stats');
      setStats(statsData);

      // Fetch recent runs
      const { data: runsData } = await api.get('/dashboard/runs', {
        params: { limit: 20 },
      });
      setRuns(runsData);

      setLoading(false);
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      // Handle 401 silently (interceptor should redirect)
      if (err.response?.status === 401) {
        setError(null);
        setLoading(false);
        return;
      }
      setError('Failed to fetch dashboard data');
      setLoading(false);
    }
  };

  const handleRealtimeUpdate = (data: any) => {
    console.log('Real-time update:', data);

    if (data.type === 'run_started' || data.type === 'run_completed') {
      fetchRuns();
    }

    if (data.type === 'step_started' || data.type === 'step_completed') {
      if (selectedRun && data.data.run_id === selectedRun.run_id) {
        fetchRunDetails(selectedRun.run_id);
      }
    }
  };

  const fetchRuns = async () => {
    try {
      const { data } = await api.get('/dashboard/runs', {
        params: { limit: 20 },
      });
      setRuns(data);
    } catch (err) {
      console.error('Failed to fetch runs:', err);
    }
  };

  const fetchRunDetails = async (runId: string) => {
    try {
      const { data } = await api.get(`/dashboard/runs/${runId}`);

      setRuns((prev: WorkflowRun[]) =>
        prev.map(run =>
          run.run_id === runId ? { ...run, ...data.run } : run,
        ),
      );

      if (selectedRun?.run_id === runId) {
        setSelectedRun((prev: WorkflowRun | null) =>
          prev ? { ...prev, ...data.run } : null,
        );
      }
    } catch (err) {
      console.error('Failed to fetch run details:', err);
    }
  };

  const handleRunSelect = (run: WorkflowRun) => {
    setSelectedRun(run);
    fetchRunDetails(run.run_id);
  };

  if (loading) {
    return (
      <div className="paper flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
            Loading dashboard…
          </div>
          <div className="mx-auto mt-3 h-px w-32 animate-pulse bg-[var(--ink)]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="paper flex min-h-screen items-center justify-center">
        <div className="border border-[var(--accent)] bg-[var(--accent)]/10 px-6 py-5 text-center">
          <div className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
            {error}
          </div>
          <button
            onClick={fetchDashboardData}
            className="mono mt-4 border border-[var(--ink)] bg-[var(--ink)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--paper)] hover:bg-[var(--accent)]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader title="Workflow Dashboard" subtitle="Real-time workflow execution monitoring and analytics" />

      <main className="px-6 py-6">
        {/* Stats Overview */}
        {stats && <WorkflowStats stats={stats} />}

        {/* Charts Section */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Success Rate Chart - Will be populated with real data */}
          <div className="border border-[var(--ink)] bg-[var(--paper)] p-6">
            <h3 className="display text-[18px] font-semibold text-[var(--ink)]">
              Success rate trend
            </h3>
            <div className="mt-4 flex h-48 items-center justify-center text-[var(--graphite)]">
              <div className="text-center">
                <svg
                  className="mx-auto mb-3 h-12 w-12 text-[var(--graphite)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p className="text-[13px] text-[var(--ink-2)]">
                  Chart data will be populated from the API
                </p>
                <p className="mono mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                  Historical success rate trends
                </p>
              </div>
            </div>
          </div>

          {/* Workflow Distribution - Based on actual workflow types */}
          <div className="border border-[var(--ink)] bg-[var(--paper)] p-6">
            <h3 className="display text-[18px] font-semibold text-[var(--ink)]">
              Workflow distribution
            </h3>
            <div className="mt-4 flex h-48 items-center justify-center">
              {runs.length > 0 ? (
                <div className="text-center">
                  <div className="display text-[40px] font-semibold text-[var(--ink)]">
                    {runs.length}
                  </div>
                  <div className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                    Recent runs
                  </div>
                  <div className="mono mt-3 text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                    Distribution by workflow type
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <svg
                    className="mx-auto mb-3 h-12 w-12 text-[var(--graphite)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                      d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                    />
                    <path
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                      d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                    />
                  </svg>
                  <p className="text-[13px] text-[var(--ink-2)]">No workflow data available</p>
                  <p className="mono mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                    Run workflows to see distribution
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="border border-[var(--ink)] bg-[var(--paper)] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="display text-[18px] font-semibold text-[var(--ink)]">
                Avg response time
              </h3>
              <span className="mono text-[9px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                Performance
              </span>
            </div>
            <div className="display text-[36px] font-semibold leading-none text-[var(--ink)]">
              {stats ? (stats.avg_duration_ms / 1000).toFixed(2) : '0.00'}s
            </div>
            <div className="mono mt-2 text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
              Average execution time
            </div>
            <div className="mt-4 border-t border-[var(--rule-soft)] pt-3 mono text-[9.5px] uppercase tracking-[0.2em] text-[var(--graphite)]">
              Performance metric
            </div>
          </div>

          <div className="border border-[var(--ink)] bg-[var(--paper)] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="display text-[18px] font-semibold text-[var(--ink)]">Error rate</h3>
              <span className="mono text-[9px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                Quality
              </span>
            </div>
            <div className="display text-[36px] font-semibold leading-none text-[var(--ink)]">
              {stats ? (100 - stats.success_rate).toFixed(1) : '0.0'}%
            </div>
            <div className="mono mt-2 text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
              Based on recent runs
            </div>
            <div className="mt-4 border-t border-[var(--rule-soft)] pt-3 mono text-[9.5px] uppercase tracking-[0.2em] text-[var(--graphite)]">
              Quality metric
            </div>
          </div>

          <div className="border border-[var(--ink)] bg-[var(--paper)] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="display text-[18px] font-semibold text-[var(--ink)]">
                Active workflows
              </h3>
              <span className="mono text-[9px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                System
              </span>
            </div>
            <div className="display text-[36px] font-semibold leading-none text-[var(--ink)]">
              {stats?.unique_workflows || 0}
            </div>
            <div className="mono mt-2 text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
              Unique workflow types
            </div>
            <div className="mt-4 border-t border-[var(--rule-soft)] pt-3 mono text-[9.5px] uppercase tracking-[0.2em] text-[var(--graphite)]">
              System metric
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Runs List */}
          <div className="xl:col-span-2">
            <WorkflowRunsList
              runs={runs}
              onRunSelect={handleRunSelect}
              selectedRunId={selectedRun?.run_id}
            />
          </div>

          {/* Real-time Activity */}
          <div className="xl:col-span-1">
            <RealtimeActivity onRealtimeUpdate={handleRealtimeUpdate} />
          </div>
        </div>
      </main>
    </div>
  );
}