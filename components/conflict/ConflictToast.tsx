'use client';

import { useEffect, useState } from 'react';
import { useConflicts, Conflict } from '@/contexts/ConflictContext';

interface ConflictToastProps {
  adminEmail: string;
  onOpenPanel: () => void;
  workflowId?: string;
}

interface Toast {
  id: string;
  conflict: Conflict;
  show: boolean;
}

export default function ConflictToast({ adminEmail, onOpenPanel, workflowId }: ConflictToastProps) {
  const { activeConflicts } = useConflicts();
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Add new toasts for conflicts targeting this admin
  useEffect(() => {
    const targetingAdmin = activeConflicts.filter(
      (c) => c.ownerEmail === adminEmail || c.ownerEmail === 'unassigned'
    );

    setToasts((prev) => {
      const newToasts: Toast[] = [];
      const existingIds = new Set(prev.map((t) => t.id));

      targetingAdmin.forEach((conflict) => {
        if (!existingIds.has(conflict.queryId)) {
          newToasts.push({
            id: conflict.queryId,
            conflict,
            show: true,
          });
        }
      });

      // Remove resolved conflicts
      const activeIds = new Set(targetingAdmin.map((c) => c.queryId));
      const filtered = prev.filter((t) => activeIds.has(t.id));

      return [...filtered, ...newToasts];
    });
  }, [activeConflicts, adminEmail]);

  const dismissToast = (id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, show: false } : t))
    );

    // Remove from DOM after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  };

  const handleRespond = (toast: Toast) => {
    dismissToast(toast.id);
    onOpenPanel();
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(
        (toast) =>
          toast.show && (
            <div
              key={toast.id}
              className="w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden animate-in slide-in-from-right"
            >
              {/* Header */}
              <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border-b border-slate-700">
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-yellow-400">Conflict Alert</span>
                <button
                  onClick={() => dismissToast(toast.id)}
                  className="ml-auto text-slate-400 hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-3">
                <p className="text-xs text-slate-400 mb-1">
                  From: <span className="text-slate-300">{toast.conflict.nodeLabel}</span>
                </p>
                <p className="text-sm text-white line-clamp-2 mb-3">{toast.conflict.query}</p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleRespond(toast)}
                    className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700"
                  >
                    Respond
                  </button>
                  {workflowId && (
                    <a
                      href={`/workflows/${workflowId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-slate-600 text-white text-xs font-medium rounded hover:bg-slate-500 flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open
                    </a>
                  )}
                  <button
                    onClick={() => dismissToast(toast.id)}
                    className="px-3 py-1.5 bg-slate-700 text-white text-xs font-medium rounded hover:bg-slate-600"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              {/* Timeout bar */}
              <div className="h-1 bg-slate-800">
                <div
                  className="h-full bg-yellow-500 animate-[shrink_5m_linear_forwards]"
                  style={{
                    animationDuration: '300s',
                  }}
                />
              </div>
            </div>
          )
      )}
    </div>
  );
}
