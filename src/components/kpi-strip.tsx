'use client';

type Metric = {
  key: 'visitors' | 'pageviews' | 'bounceRate' | 'avgDuration';
  label: string;
  value: number;
  delta: number | null;
  suffix?: string;
  format?: (v: number) => string;
};

type Props = {
  kpis: {
    visitors: { value: number; delta: number | null };
    pageviews: { value: number; delta: number | null };
    bounceRate: { value: number; delta: number | null };
    avgDuration: { value: number; delta: number | null };
  };
  selected: Metric['key'];
  onSelect: (k: Metric['key']) => void;
};

function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toLocaleString();
}
function fmtDur(s: number) {
  if (!s) return '0s';
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}m ${r}s` : `${m}m`;
}

const DOT_COLOR: Record<Metric['key'], string> = {
  visitors: '#FF6A45',
  pageviews: '#FFA463',
  bounceRate: '#E8502A',
  avgDuration: '#FFC187',
};

export function KPIStrip({ kpis, selected, onSelect }: Props) {
  const items: Metric[] = [
    { key: 'visitors', label: 'People', value: kpis.visitors.value, delta: kpis.visitors.delta, format: fmtNum },
    { key: 'pageviews', label: 'Views', value: kpis.pageviews.value, delta: kpis.pageviews.delta, format: fmtNum },
    { key: 'bounceRate', label: 'Bounced', value: kpis.bounceRate.value, delta: kpis.bounceRate.delta, suffix: '%' },
    { key: 'avgDuration', label: 'Duration', value: kpis.avgDuration.value, delta: kpis.avgDuration.delta, format: fmtDur },
  ];

  return (
    <div className="flex items-start gap-10">
      {items.map((m) => {
        const isSel = m.key === selected;
        const d = m.delta;
        const deltaStr = d === null ? '—' : `${d > 0 ? '+' : ''}${d}%`;
        const deltaColor =
          d === null || d === 0
            ? 'text-ink-900/35'
            : d > 0
            ? 'text-emerald-600/80'
            : 'text-coral-500/80';
        return (
          <button
            key={m.key}
            onClick={() => onSelect(m.key)}
            className="group relative text-left focus:outline-none press"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="w-1.5 h-1.5 rounded-full transition-all duration-200 ease-out-strong"
                style={{
                  backgroundColor: isSel ? DOT_COLOR[m.key] : 'rgba(45, 24, 16, 0.15)',
                  boxShadow: isSel ? `0 0 0 3px ${DOT_COLOR[m.key]}1a` : 'none',
                }}
              />
              <span
                className={`text-[10.5px] font-semibold uppercase tracking-[0.09em] transition-colors duration-200 ${
                  isSel ? 'text-ink-900' : 'text-ink-900/45 group-hover:text-ink-900/70'
                }`}
              >
                {m.label}
              </span>
            </div>
            <div
              className={`font-display text-[2.25rem] leading-[1] tabular-nums transition-colors duration-300 ${
                isSel ? 'text-ink-900' : 'text-ink-900/75'
              }`}
            >
              {m.format ? m.format(m.value) : m.value.toLocaleString()}
              {m.suffix && <span className="text-[1.75rem] font-display opacity-80">{m.suffix}</span>}
            </div>
            <div className={`text-[10.5px] font-medium mt-1 tabular-nums tracking-tight ${deltaColor}`}>
              {deltaStr}
            </div>
          </button>
        );
      })}
    </div>
  );
}
