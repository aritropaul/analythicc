'use client';

import { useEffect, useState } from 'react';

type Point = { t: number; visitors: number };

export function RealtimeCard({
  siteId,
  initialCount,
  initialSeries,
}: {
  siteId: string;
  initialCount: number;
  initialSeries: Point[];
}) {
  const [count, setCount] = useState(initialCount);
  const [series, setSeries] = useState(initialSeries);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const r = await fetch(`/api/stats/${siteId}?range=live`, { cache: 'no-store' });
        if (!r.ok) return;
        const d = (await r.json()) as { live: number; liveSeries: Point[] };
        if (!cancelled) {
          setCount(d.live);
          setSeries(d.liveSeries);
        }
      } catch {}
    };
    const id = setInterval(tick, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [siteId]);

  const max = Math.max(1, ...series.map((p) => p.visitors));

  return (
    <div className="card p-5 flex flex-col min-h-[168px]">
      <div className="flex items-start justify-between mb-auto">
        <div className="flex items-center gap-2">
          <span className="relative flex h-[7px] w-[7px]">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral-400 opacity-55" />
            <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-coral-500" />
          </span>
          <span className="section-label">Realtime</span>
        </div>
        <span className="text-[10px] text-ink-900/35 tabular-nums">last 30m</span>
      </div>

      <div className="flex items-baseline gap-2 mt-6 mb-4">
        <span className="font-display text-[3rem] leading-[0.9] text-ink-900 tabular-nums">
          {count}
        </span>
        <span className="text-[12px] text-ink-900/50">
          {count === 1 ? 'person online' : 'people online'}
        </span>
      </div>

      <div className="flex items-end gap-[3px] h-8 mt-auto">
        {series.map((p, i) => {
          const h = (p.visitors / max) * 100;
          const active = p.visitors > 0;
          return (
            <div
              key={i}
              className={`flex-1 rounded-full ${active ? 'bg-coral-400' : 'bg-ink-900/[0.06]'}`}
              style={{
                height: active ? `${Math.max(14, h)}%` : '14%',
                transition: 'height 500ms cubic-bezier(0.16, 1, 0.3, 1), background-color 300ms ease',
              }}
              title={`${p.visitors} @ ${new Date(p.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            />
          );
        })}
      </div>
    </div>
  );
}
