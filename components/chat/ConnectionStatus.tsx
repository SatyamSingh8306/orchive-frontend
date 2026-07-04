"use client";

/**
 * ConnectionStatus — tiny pill in the chat sidebar footer.
 *
 * "Live" with a green pulsing dot when the per-user WS is connected.
 * "Reconnecting…" in graphite when it's not.
 */

interface ConnectionStatusProps {
  connected: boolean;
}

export default function ConnectionStatus({ connected }: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          connected
            ? "animate-pulse-dot bg-[var(--ok)]"
            : "bg-[var(--graphite)]"
        }`}
        aria-hidden
      />
      <span className="mono text-[9px] uppercase tracking-[0.22em] text-[var(--graphite)]">
        {connected ? "Live" : "Reconnecting…"}
      </span>
    </div>
  );
}
