type EventRow = { key: string; people: number; count: number; pct: number };

export function EventsTable({ rows }: { rows: EventRow[] }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13.5px] font-semibold text-ink-900 tracking-[-0.01em]">Events</h3>
        <span className="text-[10px] text-ink-900/35 font-mono tracking-tight">
          window.ana('event', ...)
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-[11px] text-ink-900/30">
          No events — call{' '}
          <code className="text-coral-500/80 text-[11px] ml-1">window.ana('event', 'name')</code>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="section-label text-left font-semibold pb-2 px-1">Value</th>
                <th className="section-label text-right font-semibold pb-2 px-1 w-24">People</th>
                <th className="section-label text-right font-semibold pb-2 px-1 w-24">Events</th>
                <th className="section-label text-right font-semibold pb-2 px-1 w-16">%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.key} className="group">
                  <td
                    className={`py-[9px] px-1 ${i > 0 ? 'border-t border-ink-900/[0.05]' : ''}`}
                  >
                    <span className="inline-block bg-ink-900/[0.04] border border-ink-900/[0.06] rounded-md px-2 py-0.5 text-[11.5px] font-mono text-ink-900/85 transition-colors group-hover:bg-ink-900/[0.06]">
                      {r.key}
                    </span>
                  </td>
                  <td
                    className={`text-right tabular-nums text-ink-900/70 text-[12.5px] px-1 ${
                      i > 0 ? 'border-t border-ink-900/[0.05]' : ''
                    }`}
                  >
                    {r.people.toLocaleString()}
                  </td>
                  <td
                    className={`text-right tabular-nums text-ink-900 font-medium text-[12.5px] px-1 ${
                      i > 0 ? 'border-t border-ink-900/[0.05]' : ''
                    }`}
                  >
                    {r.count.toLocaleString()}
                  </td>
                  <td
                    className={`text-right tabular-nums text-ink-900/40 text-[11.5px] px-1 ${
                      i > 0 ? 'border-t border-ink-900/[0.05]' : ''
                    }`}
                  >
                    {r.pct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
