'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ConflictPayload, ConflictResponse } from '@/types/socket';

export interface Conflict extends ConflictPayload {
  status: 'pending' | 'answered' | 'timeout';
  response?: string;
  respondedBy?: string;
  respondedAt?: string;
}

interface ConflictContextType {
  conflicts: Conflict[];
  activeConflicts: Conflict[];
  addConflict: (conflict: ConflictPayload) => void;
  resolveConflict: (response: ConflictResponse) => void;
  removeConflict: (queryId: string) => void;
  respondToConflict: (queryId: string, response: string, adminEmail: string) => Promise<void>;
  isLoading: boolean;
}

const ConflictContext = createContext<ConflictContextType | undefined>(undefined);

export function ConflictProvider({ children }: { children: ReactNode }) {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addConflict = useCallback((payload: ConflictPayload) => {
    setConflicts((prev) => {
      // Check if conflict already exists
      if (prev.some((c) => c.queryId === payload.queryId)) {
        return prev;
      }
      return [
        {
          ...payload,
          status: 'pending',
        },
        ...prev,
      ];
    });
  }, []);

  const resolveConflict = useCallback((response: ConflictResponse) => {
    setConflicts((prev) =>
      prev.map((c) =>
        c.queryId === response.queryId
          ? {
              ...c,
              status: 'answered',
              response: response.response,
              respondedBy: response.adminEmail,
              respondedAt: response.respondedAt,
            }
          : c
      )
    );
  }, []);

  const removeConflict = useCallback((queryId: string) => {
    setConflicts((prev) => prev.filter((c) => c.queryId !== queryId));
  }, []);

  const respondToConflict = useCallback(
    async (queryId: string, response: string, adminEmail: string) => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/conflicts/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queryId, response, adminEmail }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to respond');
        }

        const data = await res.json();

        // Find the conflict to get workflowId
        const conflict = conflicts.find(c => c.queryId === queryId);
        if (!conflict) {
          throw new Error('Conflict not found');
        }

        // Update local state
        resolveConflict({
          queryId,
          workflowId: conflict.workflowId,
          response,
          adminEmail,
          respondedAt: data.data.respondedAt,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [resolveConflict, conflicts]
  );

  const activeConflicts = conflicts.filter((c) => c.status === 'pending');

  return (
    <ConflictContext.Provider
      value={{
        conflicts,
        activeConflicts,
        addConflict,
        resolveConflict,
        removeConflict,
        respondToConflict,
        isLoading,
      }}
    >
      {children}
    </ConflictContext.Provider>
  );
}

export function useConflicts() {
  const context = useContext(ConflictContext);
  if (context === undefined) {
    throw new Error('useConflicts must be used within a ConflictProvider');
  }
  return context;
}
