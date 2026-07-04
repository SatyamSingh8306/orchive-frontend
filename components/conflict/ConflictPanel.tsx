'use client';

import { useState } from 'react';
import { useConflicts, Conflict } from '@/contexts/ConflictContext';

interface ConflictPanelProps {
  isOpen: boolean;
  onClose: () => void;
  adminEmail: string;
}

export default function ConflictPanel({ isOpen, onClose, adminEmail }: ConflictPanelProps) {
  const { conflicts, activeConflicts, respondToConflict, isLoading, removeConflict } = useConflicts();
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [response, setResponse] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'answered'>('pending');

  const filteredConflicts = conflicts.filter((c) => {
    if (filter === 'pending') return c.status === 'pending';
    if (filter === 'answered') return c.status === 'answered';
    return true;
  });

  const handleSubmitResponse = async () => {
    if (!selectedConflict || !response.trim()) return;

    await respondToConflict(selectedConflict.queryId, response.trim(), adminEmail);
    setResponse('');
    setSelectedConflict(null);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTimeRemaining = (timeoutAt: string) => {
    const remaining = new Date(timeoutAt).getTime() - Date.now();
    if (remaining <= 0) return 'Timed out';
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-[480px] bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-white">Conflict Resolution</h2>
            <p className="text-sm text-slate-400">
              {activeConflicts.length} active, {conflicts.filter(c => c.status === 'answered').length} resolved
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-slate-700">
          {(['pending', 'answered', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 text-sm font-medium capitalize ${
                filter === f
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f}
              {f === 'pending' && activeConflicts.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full">
                  {activeConflicts.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Conflict List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredConflicts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No {filter} conflicts</p>
            </div>
          ) : (
            filteredConflicts.map((conflict) => (
              <div
                key={conflict.queryId}
                onClick={() => {
                  setSelectedConflict(conflict);
                  setResponse(conflict.response || '');
                }}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedConflict?.queryId === conflict.queryId
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      conflict.status === 'pending' ? 'bg-yellow-500 animate-pulse' :
                      conflict.status === 'answered' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm font-medium text-white">{conflict.nodeLabel}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{formatTime(conflict.contextSnapshot.timestamp)}</span>
                </div>

                <p className="text-sm text-slate-300 line-clamp-2 mb-2">{conflict.query}</p>

                {conflict.status === 'pending' && (
                  <div className="flex items-center gap-1.5 text-[11px] text-yellow-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {getTimeRemaining(conflict.timeoutAt)}
                  </div>
                )}

                {conflict.status === 'answered' && conflict.respondedBy && (
                  <div className="text-[11px] text-green-400">
                    Resolved by {conflict.respondedBy}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Response Form */}
        {selectedConflict && selectedConflict.status === 'pending' && (
          <div className="border-t border-slate-700 p-4 bg-slate-800/30">
            <h3 className="text-sm font-medium text-white mb-2">Respond to Conflict</h3>
            <p className="text-xs text-slate-400 mb-3">{selectedConflict.query}</p>

            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Enter your guidance for the agent..."
              className="w-full min-h-[100px] rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white outline-none resize-none mb-3"
            />

            <div className="flex gap-2">
              <button
                onClick={handleSubmitResponse}
                disabled={isLoading || !response.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : 'Send Response'}
              </button>
              <button
                onClick={() => {
                  setSelectedConflict(null);
                  setResponse('');
                }}
                className="px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Show Response for Answered Conflicts */}
        {selectedConflict && selectedConflict.status === 'answered' && (
          <div className="border-t border-slate-700 p-4 bg-slate-800/30">
            <h3 className="text-sm font-medium text-white mb-2">Resolution</h3>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-700">
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{selectedConflict.response}</p>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Resolved by {selectedConflict.respondedBy} at {selectedConflict.respondedAt && formatTime(selectedConflict.respondedAt)}
            </p>
            <button
              onClick={() => removeConflict(selectedConflict.queryId)}
              className="mt-3 text-xs text-red-400 hover:text-red-300"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
