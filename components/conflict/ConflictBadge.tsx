'use client';

import { useConflicts } from '@/contexts/ConflictContext';

interface ConflictBadgeProps {
  onClick?: () => void;
}

export default function ConflictBadge({ onClick }: ConflictBadgeProps) {
  const { activeConflicts } = useConflicts();
  const count = activeConflicts.length;

  return (
    <button
      onClick={onClick}
      className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
      title="Active Conflicts"
    >
      <svg
        className="w-5 h-5 text-slate-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[11px] font-bold text-white bg-red-500 rounded-full animate-pulse">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
