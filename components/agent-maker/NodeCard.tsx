'use client';

import type { WorkflowNode } from '@/utils/nodes';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useRef } from 'react';

export default function NodeCard({
  node,
  width,
  height,
  isConnectingFrom,
  onNodeMouseDown,
  onSelect,
  onPortMouseDown,
  onDeleteNode,
}: {
  node: WorkflowNode;
  width: number;
  height: number;
  isConnectingFrom: boolean;
  onNodeMouseDown: (e: ReactMouseEvent<HTMLDivElement>, nodeId: string) => void;
  onSelect: (nodeId: string) => void;
  onPortMouseDown: (
    e: ReactMouseEvent<HTMLDivElement>,
    nodeId: string,
    side: 'left' | 'right',
  ) => void;
  onDeleteNode?: (nodeId: string) => void;
}) {
  const lastClickTime = useRef(0);

  const handleDoubleClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onSelect(node.id);
  };

  const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onNodeMouseDown(e, node.id);
  };

  const handleDelete = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onDeleteNode) {
      onDeleteNode(node.id);
    }
  };

  // Resolve the visual discriminator: explicit `kind` wins, otherwise
  // fall back to the functional `type`. Lets us paint a router or a
  // human checkpoint differently from a generic service node.
  const kind: string = (node.kind ?? node.type ?? 'service').toLowerCase();
  const isRouter = kind === 'router';
  const isTrigger = kind === 'trigger';
  const isResult = kind === 'result';
  const isHuman = kind === 'human';
  const isMerge = kind === 'merge';

  // The hairline top stripe is the only place the node's accentColor
  // shows up; the body stays on the paper system.
  const stripeColor = node.accentColor || '#0b0b0f';

  return (
    <div
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      className="absolute select-none cursor-move"
      style={{
        // Defensive defaults: the backend's `WorkflowNode` schema
        // doesn't round-trip `x` / `y` (or `icon` / `accentColor`
        // / `kind`), so a saved-and-reloaded workflow can hand us
        // `undefined` here. React then writes `NaN` into the CSS
        // `left` / `top` properties and the console explodes —
        // fall back to 0 so the node renders somewhere instead of
        // nowhere.
        left: typeof node.x === 'number' ? node.x : 0,
        top: typeof node.y === 'number' ? node.y : 0,
        width,
        height,
      }}
    >
      <div
        className={`relative flex h-full w-full flex-col justify-between border bg-[var(--paper)] text-[var(--ink)] transition-colors ${
          isConnectingFrom
            ? 'border-[var(--accent)] shadow-[0_0_0_1px_var(--accent)]'
            : 'border-[var(--ink)]'
        } ${isHuman ? 'border-[var(--accent)]' : ''}`}
        style={{ borderRadius: 0 }}
      >
        {/* accent hairline — top stripe */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{ backgroundColor: stripeColor }}
        />

        {onDeleteNode && (
          <button
            onClick={handleDelete}
            className="absolute right-1 top-1.5 z-10 flex h-4 w-4 items-center justify-center border border-[var(--ink)] bg-[var(--paper)] text-[10px] leading-none text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
            aria-label="Delete node"
          >
            ×
          </button>
        )}

        {/* header: monospace mark + type tag + label */}
        <div className="flex items-start gap-2.5 px-3 pt-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--ink)] bg-[var(--paper-2)] text-[10px] font-semibold tracking-[0.18em] text-[var(--ink)]"
            style={{ borderRadius: 0 }}
          >
            {node.icon ?? node.type.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex min-w-0 flex-1 flex-col pr-4">
            <span className="mono text-[9px] uppercase tracking-[0.2em] text-[var(--graphite)]">
              {isRouter
                ? 'router'
                : isHuman
                ? 'human'
                : isTrigger
                ? 'trigger'
                : isMerge
                ? 'synth'
                : isResult
                ? 'result'
                : 'agent'}
              <span className="ml-1 text-[var(--ink)]">·</span>
              <span className="ml-1 text-[var(--ink)]">
                {(node.id.length > 10 ? node.id.slice(0, 10) : node.id)
                  .replace(/[^a-z0-9_]/gi, '')
                  .toUpperCase()}
              </span>
            </span>
            <span className="display truncate text-[14px] font-semibold leading-tight text-[var(--ink)]">
              {node.label}
            </span>
          </div>
        </div>

        {node.description && (
          <p className="mt-1.5 line-clamp-2 px-3 text-[11px] leading-snug text-[var(--ink-2)]">
            {node.description}
          </p>
        )}

        {/* ports */}
        <div className="absolute left-[-6px] top-1/2 -translate-y-1/2">
          <div
            onMouseDown={e => onPortMouseDown(e, node.id, 'left')}
            className="h-3 w-3 border border-[var(--ink)] bg-[var(--paper)] shadow-[0_0_0_2px_var(--paper)] hover:bg-[var(--paper-2)]"
            style={{ borderRadius: 0 }}
          />
        </div>
        <div className="absolute right-[-6px] top-1/2 -translate-y-1/2">
          <div
            onMouseDown={e => onPortMouseDown(e, node.id, 'right')}
            className={`h-3 w-3 border bg-[var(--paper)] shadow-[0_0_0_2px_var(--paper)] hover:bg-[var(--paper-2)] ${
              isConnectingFrom
                ? 'border-[var(--accent)]'
                : 'border-[var(--ink)]'
            }`}
            style={{ borderRadius: 0 }}
          />
        </div>
      </div>
    </div>
  );
}
