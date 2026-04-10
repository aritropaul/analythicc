'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Point = { t: number; visitors: number; pageviews: number; sessions: number };
type Metric = 'visitors' | 'pageviews' | 'bounceRate' | 'avgDuration';

const COLOR: Record<Metric, string> = {
  visitors: '#FF6A45',
  pageviews: '#F2923A',
  bounceRate: '#E8502A',
  avgDuration: '#FFA463',
};

const FIELD: Record<Metric, keyof Point> = {
  visitors: 'visitors',
  pageviews: 'pageviews',
  bounceRate: 'sessions',
  avgDuration: 'sessions',
};

const LABEL: Record<Metric, string> = {
  visitors: 'Visitors',
  pageviews: 'Pageviews',
  bounceRate: 'Sessions',
  avgDuration: 'Sessions',
};

export function HeroChart({
  data,
  range,
  metric,
}: {
  data: Point[];
  range: string;
  metric: Metric;
}) {
  const field = FIELD[metric];
  const color = COLOR[metric];
  const label = LABEL[metric];

  const { formatted, peak } = useMemo(() => {
    const f = data.map((d) => ({ ...d, v: Number(d[field]) || 0 }));
    let peakIdx = -1;
    let peakVal = 0;
    f.forEach((p, i) => {
      if (p.v > peakVal) {
        peakVal = p.v;
        peakIdx = i;
      }
    });
    return { formatted: f, peak: peakVal > 0 ? f[peakIdx] : null };
  }, [data, field]);

  const fmtTick = (t: number) => {
    const d = new Date(t);
    if (range === 'live') {
      const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
      return mins === 0 ? 'now' : `${mins}m`;
    }
    if (range === '24h') return d.getHours().toString().padStart(2, '0') + ':00';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const fmtFull = (t: number) => {
    return new Date(t).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-[380px] md:h-[440px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={formatted}
          margin={{ top: 40, right: 40, bottom: 36, left: 40 }}
        >
          <defs>
            <linearGradient id={`heroGrad-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="55%" stopColor={color} stopOpacity={0.08} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={fmtTick}
            tick={{ fill: 'rgba(45,24,16,0.5)', fontSize: 10.5, fontFamily: 'Inter' }}
            tickLine={{ stroke: 'rgba(45,24,16,0.15)', strokeWidth: 1 }}
            axisLine={{ stroke: 'rgba(45,24,16,0.1)', strokeWidth: 1 }}
            interval="preserveStartEnd"
            minTickGap={60}
            padding={{ left: 0, right: 0 }}
          />
          <YAxis hide domain={[0, 'dataMax + 2']} />
          <Tooltip
            cursor={{
              stroke: color,
              strokeWidth: 1,
              strokeDasharray: '3 4',
              opacity: 0.55,
            }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as Point & { v: number };
              return (
                <div className="bg-ink-900 text-cream-50 rounded-xl px-3 py-1.5 text-xs shadow-lg pointer-events-none">
                  <div className="tabular-nums font-semibold leading-tight">
                    {row.v.toLocaleString()}{' '}
                    <span className="text-cream-50/55 font-normal">{label.toLowerCase()}</span>
                  </div>
                  <div className="text-cream-50/55 text-[10px] tabular-nums mt-0.5">
                    {fmtFull(row.t)}
                  </div>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={`url(#heroGrad-${metric})`}
            fillOpacity={1}
            activeDot={{
              r: 5,
              fill: color,
              stroke: '#FFFBF5',
              strokeWidth: 2,
            }}
            animationDuration={1400}
            animationEasing="ease-out"
          />
          {peak && (
            <ReferenceDot
              x={peak.t}
              y={peak.v}
              r={0}
              ifOverflow="visible"
              shape={(props: any) => (
                <g>
                  <line
                    x1={props.cx}
                    x2={props.cx}
                    y1={props.cy - 6}
                    y2={props.viewBox?.y + props.viewBox?.height}
                    stroke={color}
                    strokeWidth={1}
                    strokeDasharray="2 3"
                    opacity={0.45}
                  />
                  <circle cx={props.cx} cy={props.cy} r={4} fill={color} stroke="#FFFBF5" strokeWidth={2} />
                  <circle cx={props.cx} cy={props.cy - 24} r={13} fill="#FFFBF5" stroke={color} strokeWidth={1.5} />
                  <text
                    x={props.cx}
                    y={props.cy - 20}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={600}
                    fill={color}
                    fontStyle="italic"
                    fontFamily="Instrument Serif, serif"
                  >
                    P
                  </text>
                </g>
              )}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
