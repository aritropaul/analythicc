'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

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

export function HeroChart({ data, range, metric }: { data: Point[]; range: string; metric: Metric }) {
  const [hover, setHover] = useState<number | null>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLen, setPathLen] = useState(0);
  const [drawn, setDrawn] = useState(false);

  const width = 1600;
  const height = 440;
  const pad = { t: 44, r: 42, b: 44, l: 42 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;

  const field = FIELD[metric];
  const color = COLOR[metric];

  const { linePath, areaPath, points, xTicks, peak } = useMemo(() => {
    if (!data.length) {
      return { linePath: '', areaPath: '', points: [], xTicks: [], peak: null };
    }
    const values = data.map((d) => Number(d[field]) || 0);
    const maxV = Math.max(1, ...values);
    const stepX = innerW / Math.max(1, data.length - 1);
    const pts = data.map((d, i) => ({
      x: i * stepX,
      y: innerH - ((Number(d[field]) || 0) / maxV) * (innerH * 0.82),
      d,
    }));

    const smooth = (p: Array<{ x: number; y: number }>) => {
      if (p.length < 2) return '';
      let out = `M ${p[0].x} ${p[0].y}`;
      for (let i = 0; i < p.length - 1; i++) {
        const p0 = p[i - 1] || p[i];
        const p1 = p[i];
        const p2 = p[i + 1];
        const p3 = p[i + 2] || p2;
        const c1x = p1.x + (p2.x - p0.x) / 6;
        const c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6;
        const c2y = p2.y - (p3.y - p1.y) / 6;
        out += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
      }
      return out;
    };

    const line = smooth(pts);
    const area = `M 0 ${innerH} ` + pts.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ` L ${innerW} ${innerH} Z`;

    const ticks: Array<{ x: number; label: string; major: boolean }> = [];
    const count = range === '24h' ? 8 : range === 'live' ? 6 : 8;
    for (let i = 0; i <= count; i++) {
      const idx = Math.round(((data.length - 1) / count) * i);
      const p = pts[idx];
      if (!p) continue;
      const dt = new Date(data[idx].t);
      let label = '';
      if (range === 'live') label = `${dt.getMinutes()}m`;
      else if (range === '24h')
        label = dt.getHours().toString().padStart(2, '0') + ':00';
      else label = dt.toLocaleDateString([], { month: 'short', day: 'numeric' });
      ticks.push({ x: p.x, label, major: i % 2 === 0 });
    }

    let peakIdx = 0;
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[peakIdx]) peakIdx = i;
    }
    const peakInfo = values[peakIdx] > 0 ? { idx: peakIdx, pt: pts[peakIdx], v: values[peakIdx] } : null;

    return { linePath: line, areaPath: area, points: pts, xTicks: ticks, peak: peakInfo };
  }, [data, field, innerH, innerW, range]);

  // Measure path length for draw-in animation
  useEffect(() => {
    if (pathRef.current && linePath) {
      const len = pathRef.current.getTotalLength();
      setPathLen(len);
      setDrawn(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setDrawn(true));
      });
    }
  }, [linePath]);

  return (
    <div className="relative group">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto block" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`heroGrad-${metric}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="50%" stopColor={color} stopOpacity="0.08" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <g transform={`translate(${pad.l}, ${pad.t})`}>
          {/* Baseline hairline */}
          <line x1={0} x2={innerW} y1={innerH} y2={innerH} stroke="currentColor" strokeWidth={1} className="text-ink-900/8" />

          {/* Area fill */}
          <path
            d={areaPath}
            fill={`url(#heroGrad-${metric})`}
            style={{
              transition: 'opacity 500ms cubic-bezier(0.16, 1, 0.3, 1)',
              opacity: drawn ? 1 : 0,
            }}
          />

          {/* Line with draw-in */}
          <path
            ref={pathRef}
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={pathLen || 0}
            strokeDashoffset={drawn ? 0 : pathLen}
            style={{
              transition: 'stroke-dashoffset 1400ms cubic-bezier(0.16, 1, 0.3, 1), stroke 400ms cubic-bezier(0.23, 1, 0.32, 1)',
            }}
          />

          {/* X ticks */}
          {xTicks.map((t, i) => (
            <g key={i} opacity={t.major ? 0.6 : 0.35}>
              <line x1={t.x} x2={t.x} y1={innerH} y2={innerH + 4} stroke="currentColor" className="text-ink-900" strokeWidth={1} />
              {t.major && (
                <text
                  x={t.x}
                  y={innerH + 22}
                  textAnchor="middle"
                  fontSize={10.5}
                  fill="currentColor"
                  className="text-ink-900/50 tabular-nums"
                  style={{ fontFeatureSettings: '"tnum"' }}
                >
                  {t.label}
                </text>
              )}
            </g>
          ))}

          {/* Peak marker — Godly-style "G" style: thin vertical line + letter circle at top */}
          {peak && drawn && (
            <g style={{ animation: 'fade-in 400ms 1200ms cubic-bezier(0.16, 1, 0.3, 1) both' }}>
              <line
                x1={peak.pt.x}
                x2={peak.pt.x}
                y1={peak.pt.y - 6}
                y2={innerH - 1}
                stroke={color}
                strokeWidth={1}
                strokeDasharray="2 3"
                opacity={0.45}
              />
              <circle
                cx={peak.pt.x}
                cy={peak.pt.y - 24}
                r={13}
                fill="#FFFBF5"
                stroke={color}
                strokeWidth={1.5}
              />
              <text
                x={peak.pt.x}
                y={peak.pt.y - 20}
                textAnchor="middle"
                fontSize={12}
                fontWeight={600}
                fill={color}
                className="font-display"
                style={{ fontStyle: 'italic' }}
              >
                P
              </text>
              <circle cx={peak.pt.x} cy={peak.pt.y} r={4} fill={color} stroke="#FFFBF5" strokeWidth={2} />
            </g>
          )}

          {/* Hover hit areas */}
          {points.map((p, i) => (
            <rect
              key={i}
              x={p.x - (innerW / Math.max(1, points.length - 1)) / 2}
              y={0}
              width={innerW / Math.max(1, points.length - 1)}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
          {hover !== null && points[hover] && (
            <g pointerEvents="none">
              <line
                x1={points[hover].x}
                x2={points[hover].x}
                y1={0}
                y2={innerH}
                stroke={color}
                strokeWidth={1}
                strokeDasharray="3 4"
                opacity={0.55}
              />
              <circle cx={points[hover].x} cy={points[hover].y} r={5} fill={color} stroke="#FFFBF5" strokeWidth={2} />
            </g>
          )}
        </g>
      </svg>
      {hover !== null && points[hover] && (
        <div
          className="absolute pointer-events-none bg-ink-900 text-cream-50 rounded-xl px-3 py-1.5 text-xs shadow-lg animate-scale-in"
          style={{
            left: `${((points[hover].x + pad.l) / width) * 100}%`,
            top: 4,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="tabular-nums font-semibold">
            {Number(points[hover].d[field])?.toLocaleString() || 0}
          </div>
          <div className="text-cream-50/55 text-[10px] tabular-nums">
            {new Date(points[hover].d.t).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      )}
    </div>
  );
}
