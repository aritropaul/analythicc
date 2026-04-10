export function ExperienceScore({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const label =
    clamped >= 85
      ? 'Excellent'
      : clamped >= 70
      ? 'Good'
      : clamped >= 50
      ? 'Fair'
      : clamped >= 30
      ? 'Needs work'
      : 'Poor';
  const copy =
    clamped >= 85
      ? 'Great work. Most visitors had an excellent experience.'
      : clamped >= 70
      ? 'Solid. Some room to improve engagement.'
      : clamped >= 50
      ? "It's okay. Consider deeper content and faster pages."
      : clamped >= 30
      ? 'Rough edges. Reduce bounce and boost time on page.'
      : 'Rough. Very few visitors engage meaningfully.';

  const color = clamped >= 70 ? '#10b981' : clamped >= 40 ? '#FF8A4C' : '#E8502A';
  const r = 38;
  const c = 2 * Math.PI * r;
  const off = c - (clamped / 100) * c;

  return (
    <div className="card p-5 min-h-[168px]">
      <div className="flex items-center justify-between mb-4">
        <span className="section-label">Experience Score</span>
        <span className="text-[10px] text-ink-900/40 bg-ink-900/[0.04] border border-ink-900/[0.06] px-1.5 py-0.5 rounded-full">
          Beta
        </span>
      </div>
      <div className="flex items-center gap-5 mt-2">
        <div className="relative shrink-0">
          <svg width={96} height={96} viewBox="0 0 96 96">
            <circle cx={48} cy={48} r={r} fill="none" stroke="rgba(45,24,16,0.06)" strokeWidth={6} />
            <circle
              cx={48}
              cy={48}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={off}
              transform="rotate(-90 48 48)"
              style={{ transition: 'stroke-dashoffset 1200ms cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-[1.6rem] text-ink-900 tabular-nums leading-none">
              {clamped}
            </span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[1.35rem] text-ink-900 leading-tight">{label}</div>
          <p className="text-[11.5px] text-ink-900/55 leading-snug mt-1 max-w-[24ch]">{copy}</p>
        </div>
      </div>
    </div>
  );
}
