'use client';

import { logs } from '@/data/logs';
import { workflows } from '@/data/workflows';

function workflowName(workflowId: string) {
  return workflows.find(w => w.id === workflowId)?.name ?? workflowId;
}

export default function RecentActivity() {
  const items = [...logs]
    .filter(l => l.timestamp !== '—')
    .slice(0, 4);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
      </div>

      <div className="mt-4 space-y-3">
        {items.map(item => (
          <div
            key={item.id}
            className="rounded-xl border border-white/10 bg-[#0a0920]/40 px-4 py-3"
          >
            <div className="text-sm font-semibold text-white">{item.data}</div>
            <div className="mt-1 text-[11px] text-white/60">
              {workflowName(item.workflowId)} • {item.timestamp}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
