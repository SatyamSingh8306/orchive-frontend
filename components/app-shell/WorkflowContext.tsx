'use client';

import { createContext, useContext, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export type WorkflowSelectionContextValue = {
  selectedWorkflowId: string | null;
  setSelectedWorkflowId: (workflowId: string | null) => void;
};

const WorkflowSelectionContext = createContext<WorkflowSelectionContextValue | undefined>(undefined);

export function useWorkflowSelection() {
  const ctx = useContext(WorkflowSelectionContext);
  if (!ctx) {
    throw new Error('useWorkflowSelection must be used within WorkflowSelectionProvider');
  }
  return ctx;
}

export function WorkflowSelectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedWorkflowId = searchParams.get('workflow');

  const value = useMemo<WorkflowSelectionContextValue>(() => {
    return {
      selectedWorkflowId,
      setSelectedWorkflowId: (workflowId: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (!workflowId) params.delete('workflow');
        else params.set('workflow', workflowId);
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
      },
    };
  }, [pathname, router, searchParams, selectedWorkflowId]);

  return <WorkflowSelectionContext.Provider value={value}>{children}</WorkflowSelectionContext.Provider>;
}
