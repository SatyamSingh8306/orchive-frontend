'use client';

import { useState, useRef, useEffect } from 'react';
import { FiMoreVertical, FiEdit2, FiTrash2 } from 'react-icons/fi';

interface WorkflowMenuProps {
  workflowId: string;
  workflowName: string;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
}

export default function WorkflowMenu({ workflowId, workflowName, onRename, onDelete }: WorkflowMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(workflowName);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsRenaming(false);
        setNewName(workflowName);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [workflowName]);

  const handleRename = () => {
    if (newName.trim() && newName !== workflowName) {
      onRename(workflowId, newName.trim());
    }
    setIsRenaming(false);
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${workflowName}"?`)) {
      onDelete(workflowId);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex h-6 w-6 items-center justify-center border border-transparent text-[var(--ink)]/60 hover:border-[var(--ink)] hover:text-[var(--ink)]"
        aria-label="Workflow actions"
      >
        <FiMoreVertical className="h-3.5 w-3.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 border border-[var(--ink)] bg-[var(--paper)] shadow-[0_2px_0_var(--ink)]">
          {isRenaming ? (
            <div className="space-y-2 p-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') {
                    setIsRenaming(false);
                    setNewName(workflowName);
                  }
                }}
                className="w-full border border-[var(--ink)] bg-[var(--paper)] px-2 py-1 text-[12px] text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
                autoFocus
              />
              <div className="flex gap-1">
                <button
                  onClick={handleRename}
                  className="mono flex-1 border border-[var(--ink)] bg-[var(--ink)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--paper)] hover:bg-[var(--accent)]"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsRenaming(false);
                    setNewName(workflowName);
                  }}
                  className="mono flex-1 border border-[var(--ink)] bg-[var(--paper)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRenaming(true);
                }}
                className="mono flex w-full items-center gap-2 border-b border-[var(--rule-soft)] px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)] hover:bg-[var(--paper-2)]"
              >
                <FiEdit2 className="h-3.5 w-3.5" />
                Rename
              </button>
              <button
                onClick={handleDelete}
                className="mono flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--paper)]"
              >
                <FiTrash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
