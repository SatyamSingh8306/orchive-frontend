'use client';

interface DateFiltersProps {
  from: string;
  to: string;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
}

const QUICK_RANGES: { id: 'today' | 'yesterday' | 'last7' | 'last30'; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last7', label: 'Last 7 days' },
  { id: 'last30', label: 'Last 30 days' },
];

export default function DateFilters({ from, to, setFrom, setTo }: DateFiltersProps) {
  const setQuickDateRange = (range: 'today' | 'yesterday' | 'last7' | 'last30') => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const fromDate = new Date();
    fromDate.setHours(0, 0, 0, 0);

    switch (range) {
      case 'today':
        break;
      case 'yesterday':
        fromDate.setDate(fromDate.getDate() - 1);
        break;
      case 'last7':
        fromDate.setDate(fromDate.getDate() - 7);
        break;
      case 'last30':
        fromDate.setDate(fromDate.getDate() - 30);
        break;
    }

    setFrom(fromDate.toISOString().split('T')[0]);
    setTo(today.toISOString().split('T')[0]);
  };

  const clearFilters = () => {
    setFrom('');
    setTo('');
  };

  return (
    <section className="border border-[var(--ink)] bg-[var(--paper)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]">
          Date filters
        </div>
        <button
          onClick={clearFilters}
          className="mono border border-[var(--ink)] bg-[var(--paper)] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
          type="button"
        >
          Clear
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex items-center gap-3">
          <label className="mono text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]">
            From
          </label>
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="mono h-9 flex-1 border border-[var(--ink)] bg-[var(--paper)] px-3 text-[12px] text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="mono text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]">
            To
          </label>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="mono h-9 flex-1 border border-[var(--ink)] bg-[var(--paper)] px-3 text-[12px] text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="mono mb-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]">
          Quick ranges
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setQuickDateRange(r.id)}
              type="button"
              className="mono border border-[var(--ink)] bg-[var(--paper)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
