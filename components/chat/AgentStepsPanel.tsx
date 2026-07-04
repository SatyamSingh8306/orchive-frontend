"use client";

/**
 * AgentStepsPanel — collapsible right rail showing which agents ran
 * for the current turn.
 *
 * Currently a simple per-agent row with status (running / completed /
 * error). When fully populated it will also show each agent's text
 * and tool calls.
 *
 * The panel is hidden by default and toggled from the chat header. On
 * narrow screens it slides in from the right.
 */

import { FiCheckCircle, FiCircle, FiCpu, FiXCircle } from "react-icons/fi";

import type { AgentStep } from "@/types/chat";

interface AgentStepsPanelProps {
  steps: AgentStep[];
  open: boolean;
  onClose: () => void;
}

function statusIcon(status: AgentStep["status"]) {
  if (status === "completed") {
    return <FiCheckCircle className="h-3.5 w-3.5 text-[var(--ok)]" />;
  }
  if (status === "error") {
    return <FiXCircle className="h-3.5 w-3.5 text-[var(--accent)]" />;
  }
  return <FiCircle className="h-3.5 w-3.5 animate-pulse text-[var(--warn)]" />;
}

export default function AgentStepsPanel({
  steps,
  open,
  onClose,
}: AgentStepsPanelProps) {
  if (!open) return null;
  return (
    <aside
      className="flex h-full w-72 shrink-0 flex-col border-l border-[var(--ink)] bg-[var(--paper)]"
      aria-label="Agent steps"
    >
      <div className="flex items-center justify-between border-b border-[var(--ink)] px-4 py-3">
        <div className="flex items-center gap-2">
          <FiCpu className="h-3.5 w-3.5 text-[var(--ink)]" />
          <span className="display text-[14px] font-medium text-[var(--ink)]">
            Agent steps
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close agent steps panel"
          className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--graphite)] hover:text-[var(--ink)]"
        >
          Close
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {steps.length === 0 ? (
          <p className="mono px-2 py-6 text-center text-[10px] uppercase tracking-[0.2em] text-[var(--graphite)]">
            Send a message to see which agents run.
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {steps.map((s, i) => (
              <li
                key={`${s.agent}-${i}`}
                className="border border-[var(--rule-soft)] bg-[var(--paper-2)] px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  {statusIcon(s.status)}
                  <span className="display truncate text-[13px] text-[var(--ink)]">
                    {s.agent}
                  </span>
                </div>
                {s.content && (
                  <p className="mt-1 line-clamp-3 text-[12px] leading-snug text-[var(--ink-2)]">
                    {s.content}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </aside>
  );
}
