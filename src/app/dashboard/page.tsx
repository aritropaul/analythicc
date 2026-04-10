import Link from 'next/link';
import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { sites } from '@/lib/schema';
import { getAllSiteSummaries } from '@/lib/stats';
import { Sparkline } from '@/components/sparkline';
import { AddSiteDialog } from './_add-site';

export const runtime = 'edge';

function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toLocaleString();
}

export default async function DashboardHome() {
  const rows = await db().select().from(sites).orderBy(desc(sites.createdAt));
  const summaries = await getAllSiteSummaries(rows.map((r) => r.id));

  return (
    <div className="max-w-5xl mx-auto px-6 animate-fade-up">
      {/* Header row */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-[2rem] text-ink-900 leading-none tracking-[-0.015em]">
            Projects
          </h1>
          <span className="text-[13px] text-ink-900/35 tabular-nums">
            {rows.length}
          </span>
        </div>
        <AddSiteDialog />
      </div>

      {rows.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4 animate-float inline-block">🌱</div>
          <h2 className="font-display text-3xl text-ink-900 mb-2">No projects yet</h2>
          <p className="text-ink-900/50 text-[13px]">
            Add your first site to start collecting fresh data.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((s, i) => {
            const sum = summaries[s.id];
            const hasData = sum && (sum.visitors24h > 0 || sum.live > 0);
            return (
              <Link
                key={s.id}
                href={`/dashboard/${s.id}`}
                className="card p-5 flex flex-col transition-all duration-300 ease-out-strong hover:-translate-y-[2px] hover:shadow-peach-sm active:scale-[0.99] group relative overflow-hidden animate-fade-up"
                style={{ animationDelay: `${80 + i * 60}ms` }}
              >
                {/* Header row: avatar + arrow */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-coral-400 to-peach-300 flex items-center justify-center text-cream-50 font-display text-[16px] shadow-peach-sm">
                      {s.name[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-[1.125rem] text-ink-900 leading-[1.1] tracking-[-0.01em] truncate">
                        {s.name}
                      </h3>
                      <p className="text-[10.5px] text-ink-900/40 font-mono truncate mt-0.5">
                        {s.domain}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] text-ink-900/25 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-300 ease-out-strong">
                    →
                  </span>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1.5">
                    {sum && sum.live > 0 ? (
                      <span className="relative flex h-[6px] w-[6px]">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral-400 opacity-60" />
                        <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-coral-500" />
                      </span>
                    ) : (
                      <span className="inline-block w-[6px] h-[6px] rounded-full bg-ink-900/15" />
                    )}
                    <span className="text-[11.5px] text-ink-900/70 tabular-nums">
                      <span className="font-semibold text-ink-900">
                        {sum?.live ?? 0}
                      </span>{' '}
                      <span className="text-ink-900/45">live</span>
                    </span>
                  </div>
                  <span className="w-px h-3 bg-ink-900/10" />
                  <span className="text-[11.5px] text-ink-900/70 tabular-nums">
                    <span className="font-semibold text-ink-900">
                      {fmtNum(sum?.visitors24h ?? 0)}
                    </span>{' '}
                    <span className="text-ink-900/45">visitors · 24h</span>
                  </span>
                </div>

                {/* Sparkline */}
                <div className="mt-auto -mx-1 h-9">
                  {hasData ? (
                    <Sparkline data={sum.sparkline} />
                  ) : (
                    <div className="h-full flex items-end">
                      <div className="w-full h-[1px] bg-ink-900/[0.06]" />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
