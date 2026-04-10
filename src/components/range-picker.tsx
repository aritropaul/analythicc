'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const RANGES: Array<{ key: string; label: string }> = [
  { key: 'live', label: 'Live' },
  { key: '24h', label: '24h' },
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: '90d', label: '90d' },
];

export function RangePicker({ current }: { current: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState<{ left: number; width: number }>({ left: 4, width: 0 });
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    const btn = btnRefs.current[current];
    const container = containerRef.current;
    if (!btn || !container) return;
    const br = btn.getBoundingClientRect();
    const cr = container.getBoundingClientRect();
    setPill({ left: br.left - cr.left, width: br.width });
    setMounted(true);
  }, [current]);

  function set(r: string) {
    const q = new URLSearchParams(sp.toString());
    q.set('range', r);
    router.push(`?${q.toString()}`);
  }

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center p-1 rounded-full bg-white/50 backdrop-blur-md border border-ink-900/[0.06] shadow-sm"
    >
      {/* Sliding pill */}
      <div
        aria-hidden
        className="absolute top-1 bottom-1 rounded-full bg-ink-900 shadow-sm pointer-events-none"
        style={{
          left: `${pill.left}px`,
          width: `${pill.width}px`,
          transition: mounted
            ? 'left 320ms cubic-bezier(0.23, 1, 0.32, 1), width 320ms cubic-bezier(0.23, 1, 0.32, 1)'
            : 'none',
        }}
      />
      {RANGES.map((r) => {
        const active = current === r.key;
        return (
          <button
            key={r.key}
            ref={(el) => {
              btnRefs.current[r.key] = el;
            }}
            onClick={() => set(r.key)}
            className={`relative z-10 px-3.5 py-1 rounded-full text-[12px] font-medium tabular-nums transition-colors duration-300 ease-out-strong ${
              active ? 'text-cream-50' : 'text-ink-700/55 hover:text-ink-900'
            }`}
          >
            {r.key === 'live' && (
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle transition-colors duration-300 ${
                  active ? 'bg-coral-400' : 'bg-coral-400/70'
                } ${active ? 'animate-pulse-peach' : ''}`}
              />
            )}
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
