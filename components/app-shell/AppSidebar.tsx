'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FiGrid, FiList, FiMessageSquare } from 'react-icons/fi';
import { useWorkflowSelection } from './WorkflowContext';
import { useState, useEffect } from 'react';
import api from '@/lib/axios'; // Global axios instance
import { FiArrowLeft } from 'react-icons/fi';

type NavItemProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

function NavItem({ href, label, icon }: NavItemProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 border px-3 py-2 mono text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors ${
        active
          ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]'
          : 'border-transparent text-[var(--ink-2)] hover:border-[var(--rule-soft)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)]'
      }`}
    >
      <span className="text-base leading-none">{icon}</span>
      {label}
    </Link>
  );
}

type WorkflowListItem = {
  id: string;
  name: string;
  lastModified: string;
  status: 'active' | 'inactive';
  nodes: number;
  logs: number;
};

export default function AppSidebar() {
  const { selectedWorkflowId, setSelectedWorkflowId } = useWorkflowSelection();
  const [userWorkflows, setUserWorkflows] = useState<WorkflowListItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    const loadUserWorkflows = async () => {
      try {
        // Use global axios instance
        const { data } = await api.get('/workflows');

        const list: WorkflowListItem[] = data.map(
          (w: {
            id: string;
            name: string;
            updated_at: string;
            status: 'active' | 'inactive';
            nodes?: unknown[];
          }) => ({
            id: w.id,
            name: w.name,
            lastModified: new Date(w.updated_at).toLocaleDateString(),
            status: w.status,
            nodes: w.nodes?.length || 0,
            logs: 0,
          })
        );
        setUserWorkflows(list);
      } catch (error: any) {
        console.error('Failed to load workflows:', error);
        // Handle 401 if needed
        if (error.response?.status === 401) {
          // The global api instance should handle this via interceptor
        }
      }
    };

    loadUserWorkflows();
  }, []);

  return (
    <aside className="flex h-screen w-[280px] shrink-0 flex-col border-r border-[var(--ink)] bg-[var(--paper)]">
      {/* Brand block */}
      <div className="border-b border-[var(--ink)] px-4 py-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center border border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]">
            <span className="display text-[14px] leading-none">Ø</span>
          </span>
          <span className="flex flex-col leading-none">
            <span className="display text-[16px] font-medium tracking-[-0.01em] text-[var(--ink)]">
              ORKAIVE
            </span>
            <span className="mono text-[8px] uppercase tracking-[0.22em] text-[var(--graphite)]">
              Console
            </span>
          </span>
        </Link>
      </div>

      {/* Primary nav */}
      <div className="border-b border-[var(--ink)] px-3 py-4">
        <nav className="space-y-1.5">
          <NavItem href="/dashboard" label="Dashboard" icon={<FiGrid />} />
          <NavItem href="/chats" label="Chats" icon={<FiMessageSquare />} />
          <NavItem href="/data-logs" label="Data Logs" icon={<FiList />} />
        </nav>
      </div>

      {/* Workflow list */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mono mb-3 flex items-center justify-between px-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--graphite)]">
          <span>Your Workflows</span>
          <span className="text-[var(--ink)]">
            {String(userWorkflows.length).padStart(2, '0')}
          </span>
        </div>

        <div className="space-y-1.5">
          {userWorkflows.length > 0 ? (
            userWorkflows.map((w) => {
              const active = selectedWorkflowId
                ? selectedWorkflowId === w.id
                : w.status === 'active';
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => {
                    setSelectedWorkflowId(w.id);
                    window.location.href = `/workflow-chat/${w.id}`;
                  }}
                  className={`flex w-full flex-col gap-1.5 border px-3 py-3 text-left transition-colors ${
                    active
                      ? 'border-[var(--ink)] bg-[var(--paper-2)]'
                      : 'border-[var(--rule-soft)] bg-[var(--paper)] hover:border-[var(--ink)] hover:bg-[var(--paper-2)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div
                        className="display truncate text-[14px] leading-tight text-[var(--ink)]"
                        title={w.name}
                      >
                        {w.name}
                      </div>
                      <div className="mono mt-1 text-[9.5px] uppercase tracking-[0.18em] text-[var(--graphite)]">
                        {w.nodes} nodes · {w.lastModified}
                      </div>
                    </div>
                    <span
                      className={`mono border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] ${
                        w.status === 'active'
                          ? 'border-[var(--ok)]/40 bg-[var(--ok)]/10 text-[var(--ok)]'
                          : 'border-[var(--rule-soft)] bg-[var(--paper-2)] text-[var(--graphite)]'
                      }`}
                    >
                      {w.status === 'active' ? '● ON' : '○ OFF'}
                    </span>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="border border-dashed border-[var(--rule-soft)] p-4 text-center">
              <div className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                No workflows yet
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Back button */}
      <div className="border-b border-[var(--ink)] px-3 py-3">
        <button
          onClick={() => {router.push('/agent-maker')}}
          className="flex w-full items-center gap-2 border border-transparent px-3 py-2 mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-2)] transition-colors hover:border-[var(--rule-soft)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)]"
        >
          <FiArrowLeft className="text-base" />
          Back
        </button>
      </div>

      {/* Footer meta */}
      <div className="border-t border-[var(--ink)] px-4 py-3">
        <div className="mono flex items-center justify-end text-[9px] uppercase tracking-[0.2em] text-[var(--graphite)]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--ok)] animate-pulse-dot" />
            live
          </span>
        </div>
      </div>
    </aside>
  );
}