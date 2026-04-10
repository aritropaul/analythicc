'use client';

import { useLayoutEffect, useRef, useState } from 'react';

type Row = { key: string; visitors: number; hits: number };
type Tab = { key: string; label: string; rows: Row[] };

export function TabbedCard({
  title,
  tabs,
  iconFor,
  keyFormatter,
}: {
  title: string;
  tabs: Tab[];
  iconFor?: (k: string) => React.ReactNode;
  keyFormatter?: (k: string) => React.ReactNode;
}) {
  const [active, setActive] = useState(tabs[0]?.key ?? '');
  const current = tabs.find((t) => t.key === active) ?? tabs[0];
  const rows = current?.rows ?? [];
  const max = Math.max(1, ...rows.map((r) => r.visitors));

  // Sliding pill for sub-tabs
  const tabWrap = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  const [pillMounted, setPillMounted] = useState(false);

  useLayoutEffect(() => {
    const btn = tabRefs.current[active];
    const w = tabWrap.current;
    if (!btn || !w) return;
    const br = btn.getBoundingClientRect();
    const wr = w.getBoundingClientRect();
    setPill({ left: br.left - wr.left, width: br.width });
    setPillMounted(true);
  }, [active]);

  return (
    <div className="card p-5 transition-shadow duration-300 ease-out-strong hover:shadow-peach-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13.5px] font-semibold text-ink-900 tracking-[-0.01em]">{title}</h3>
        <div ref={tabWrap} className="relative flex items-center text-[11px]">
          <div
            aria-hidden
            className="absolute top-0 bottom-0 rounded-md bg-ink-900/[0.06] pointer-events-none"
            style={{
              left: `${pill.left}px`,
              width: `${pill.width}px`,
              transition: pillMounted
                ? 'left 280ms cubic-bezier(0.23, 1, 0.32, 1), width 280ms cubic-bezier(0.23, 1, 0.32, 1)'
                : 'none',
            }}
          />
          {tabs.map((t) => (
            <button
              key={t.key}
              ref={(el) => {
                tabRefs.current[t.key] = el;
              }}
              onClick={() => setActive(t.key)}
              className={`relative z-10 px-2 py-0.5 rounded-md transition-colors duration-300 ${
                t.key === active ? 'text-ink-900 font-medium' : 'text-ink-700/45 hover:text-ink-900/75'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-[11px] text-ink-900/30">
          No data
        </div>
      ) : (
        <div key={active} className="space-y-px animate-fade-in">
          {rows.slice(0, 7).map((r, i) => {
            const pct = (r.visitors / max) * 100;
            return (
              <div
                key={r.key + i}
                className="relative flex items-center justify-between pl-2.5 pr-3 py-[7px] rounded-lg hover:bg-peach-50/50 transition-colors duration-200 group"
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r from-peach-200/50 via-peach-100/25 to-transparent"
                  style={{
                    width: `${pct}%`,
                    transition: 'width 600ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
                <div className="relative flex items-center gap-2 min-w-0 flex-1">
                  {iconFor && <span className="shrink-0 text-[13px] w-4 text-center">{iconFor(r.key)}</span>}
                  <span className="truncate text-[12.5px] text-ink-900/85 tracking-[-0.005em]">
                    {keyFormatter ? keyFormatter(r.key) : r.key}
                  </span>
                </div>
                <span className="relative text-[12.5px] text-ink-900 tabular-nums font-medium shrink-0 ml-3">
                  {r.visitors.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
