'use client';

import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';

export function Sparkline({
  data,
  color = '#FF6A45',
  height = 36,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  if (!data.length) return <div style={{ height }} />;
  const formatted = data.map((v, i) => ({ i, v }));
  const id = `spark-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 2, right: 0, bottom: 1, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={[0, 'dataMax + 1']} />
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={`url(#${id})`}
            fillOpacity={1}
            isAnimationActive={false}
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
