import { and, eq, gte, isNotNull, lte, sql } from 'drizzle-orm';
import { db } from './db';
import { events } from './schema';

export type Range = '24h' | '7d' | '30d' | '90d' | 'live';

export function rangeToMs(range: Range): { from: number; to: number; bucket: 'minute' | 'hour' | 'day' } {
  const now = Date.now();
  switch (range) {
    case 'live':
      return { from: now - 30 * 60 * 1000, to: now, bucket: 'minute' };
    case '24h':
      return { from: now - 24 * 60 * 60 * 1000, to: now, bucket: 'hour' };
    case '7d':
      return { from: now - 7 * 24 * 60 * 60 * 1000, to: now, bucket: 'day' };
    case '30d':
      return { from: now - 30 * 24 * 60 * 60 * 1000, to: now, bucket: 'day' };
    case '90d':
      return { from: now - 90 * 24 * 60 * 60 * 1000, to: now, bucket: 'day' };
  }
}

async function kpisForWindow(siteId: string, from: number, to: number) {
  const d = db();
  const rows = await d
    .select({
      visitors: sql<number>`COUNT(DISTINCT ${events.visitorId})`,
      sessions: sql<number>`COUNT(DISTINCT ${events.sessionId})`,
      pageviews: sql<number>`SUM(CASE WHEN ${events.type} = 'pageview' THEN 1 ELSE 0 END)`,
      avgDuration: sql<number>`AVG(CASE WHEN ${events.type} = 'session_end' THEN ${events.duration} END)`,
    })
    .from(events)
    .where(and(eq(events.siteId, siteId), gte(events.timestamp, new Date(from)), lte(events.timestamp, new Date(to))));

  const k = rows[0] ?? { visitors: 0, sessions: 0, pageviews: 0, avgDuration: 0 };

  const bounce = await d.run(sql`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN pv_count = 1 THEN 1 ELSE 0 END) AS bounced
    FROM (
      SELECT session_id, COUNT(*) AS pv_count
      FROM events
      WHERE site_id = ${siteId}
        AND type = 'pageview'
        AND timestamp >= ${from}
        AND timestamp <= ${to}
      GROUP BY session_id
    )
  `);
  const br = (bounce.results?.[0] ?? {}) as { total?: number; bounced?: number };
  const totalSessions = Number(br.total) || 0;
  const bouncedSessions = Number(br.bounced) || 0;
  const bounceRate = totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;

  return {
    visitors: Number(k.visitors) || 0,
    sessions: Number(k.sessions) || 0,
    pageviews: Number(k.pageviews) || 0,
    avgDuration: Math.round(Number(k.avgDuration) || 0),
    bounceRate,
  };
}

function pct(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null;
  return Math.round(((curr - prev) / prev) * 100);
}

export async function getKPIs(siteId: string, range: Range) {
  const { from, to } = rangeToMs(range);
  const span = to - from;
  const prevFrom = from - span;
  const prevTo = from;

  const [curr, prev] = await Promise.all([
    kpisForWindow(siteId, from, to),
    kpisForWindow(siteId, prevFrom, prevTo),
  ]);

  return {
    visitors: { value: curr.visitors, delta: pct(curr.visitors, prev.visitors) },
    pageviews: { value: curr.pageviews, delta: pct(curr.pageviews, prev.pageviews) },
    bounceRate: {
      value: Math.round(curr.bounceRate * 10) / 10,
      delta: pct(Math.round(curr.bounceRate), Math.round(prev.bounceRate)),
    },
    avgDuration: { value: curr.avgDuration, delta: pct(curr.avgDuration, prev.avgDuration) },
    sessions: { value: curr.sessions, delta: pct(curr.sessions, prev.sessions) },
    experienceScore: computeExperienceScore(curr),
  };
}

function computeExperienceScore(k: {
  bounceRate: number;
  avgDuration: number;
  pageviews: number;
}): number {
  // Synthetic 0-100 score. Lower bounce + longer sessions = higher.
  if (k.pageviews === 0) return 0;
  const bouncePenalty = k.bounceRate; // 0-100
  const durationBonus = Math.min(100, (k.avgDuration / 300) * 100); // cap at 5min
  const score = 60 - bouncePenalty * 0.4 + durationBonus * 0.4;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function getTimeseries(siteId: string, range: Range) {
  const { from, to, bucket } = rangeToMs(range);
  const d = db();
  const bucketMs =
    bucket === 'minute' ? 60 * 1000 : bucket === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

  // Use raw SQL with literal bucket size to avoid Drizzle parameter-binding
  // issues with the same expression in SELECT / GROUP BY / ORDER BY.
  const result = await d.run(sql`
    SELECT
      (timestamp / ${sql.raw(String(bucketMs))}) * ${sql.raw(String(bucketMs))} AS bucket,
      COUNT(DISTINCT visitor_id) AS visitors,
      SUM(CASE WHEN type = 'pageview' THEN 1 ELSE 0 END) AS pageviews,
      COUNT(DISTINCT session_id) AS sessions
    FROM events
    WHERE site_id = ${siteId}
      AND timestamp >= ${from}
      AND timestamp <= ${to}
    GROUP BY bucket
    ORDER BY bucket ASC
  `);
  const rows = (result.results ?? []) as Array<{
    bucket: number;
    visitors: number;
    pageviews: number;
    sessions: number;
  }>;

  const filled: Array<{ t: number; visitors: number; pageviews: number; sessions: number }> = [];
  for (let t = Math.floor(from / bucketMs) * bucketMs; t <= to; t += bucketMs) {
    const row = rows.find((r) => Number(r.bucket) === t);
    filled.push({
      t,
      visitors: row ? Number(row.visitors) : 0,
      pageviews: row ? Number(row.pageviews) : 0,
      sessions: row ? Number(row.sessions) : 0,
    });
  }
  return filled;
}

type TopRow = { key: string; visitors: number; hits: number };

async function topBy(
  siteId: string,
  range: Range,
  column: 'path' | 'referrerDomain' | 'country' | 'region' | 'city' | 'device' | 'browser' | 'os' | 'utmSource' | 'utmCampaign'
): Promise<TopRow[]> {
  const { from, to } = rangeToMs(range);
  const d = db();
  const col = events[column];
  const visitorsExpr = sql<number>`COUNT(DISTINCT ${events.visitorId})`;
  const hitsExpr = sql<number>`SUM(CASE WHEN ${events.type} = 'pageview' THEN 1 ELSE 0 END)`;
  const rows = await d
    .select({ key: col, visitors: visitorsExpr, hits: hitsExpr })
    .from(events)
    .where(
      and(
        eq(events.siteId, siteId),
        gte(events.timestamp, new Date(from)),
        lte(events.timestamp, new Date(to)),
        isNotNull(col as any)
      )
    )
    .groupBy(col as any)
    .orderBy(sql`${visitorsExpr} DESC`)
    .limit(20);
  return rows.map((r) => ({ key: (r.key as string) ?? '—', visitors: Number(r.visitors), hits: Number(r.hits) }));
}

// Pages: Top / Entered / Exited
export async function getPages(siteId: string, range: Range) {
  const { from, to } = rangeToMs(range);
  const d = db();

  const top = await topBy(siteId, range, 'path');

  const entered = await d.run(sql`
    SELECT path AS key, COUNT(DISTINCT session_id) AS visitors, COUNT(*) AS hits
    FROM (
      SELECT session_id, path,
        ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY timestamp ASC) AS rn
      FROM events
      WHERE site_id = ${siteId} AND type = 'pageview'
        AND timestamp >= ${from} AND timestamp <= ${to}
    )
    WHERE rn = 1
    GROUP BY path
    ORDER BY visitors DESC
    LIMIT 20
  `);

  const exited = await d.run(sql`
    SELECT path AS key, COUNT(DISTINCT session_id) AS visitors, COUNT(*) AS hits
    FROM (
      SELECT session_id, path,
        ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY timestamp DESC) AS rn
      FROM events
      WHERE site_id = ${siteId} AND type = 'pageview'
        AND timestamp >= ${from} AND timestamp <= ${to}
    )
    WHERE rn = 1
    GROUP BY path
    ORDER BY visitors DESC
    LIMIT 20
  `);

  const toRows = (results: any[]): TopRow[] =>
    (results || []).map((r) => ({
      key: String(r.key ?? '—'),
      visitors: Number(r.visitors) || 0,
      hits: Number(r.hits) || 0,
    }));

  return {
    top,
    entered: toRows(entered.results as any[]),
    exited: toRows(exited.results as any[]),
  };
}

export async function getSources(siteId: string, range: Range) {
  const referrer = await topBy(siteId, range, 'referrerDomain');
  const links = await topBy(siteId, range, 'utmSource');
  const campaign = await topBy(siteId, range, 'utmCampaign');
  return {
    referrer: referrer.length ? referrer : [{ key: 'Direct', visitors: 0, hits: 0 }],
    links,
    campaign,
  };
}

export async function getLocations(siteId: string, range: Range) {
  const [countries, regions, cities] = await Promise.all([
    topBy(siteId, range, 'country'),
    topBy(siteId, range, 'region'),
    topBy(siteId, range, 'city'),
  ]);
  return { countries, regions, cities };
}

export async function getDevices(siteId: string, range: Range) {
  const [browsers, os, devices] = await Promise.all([
    topBy(siteId, range, 'browser'),
    topBy(siteId, range, 'os'),
    topBy(siteId, range, 'device'),
  ]);
  return { browsers, os, devices };
}

export async function getEvents(siteId: string, range: Range) {
  const { from, to } = rangeToMs(range);
  const d = db();
  const rows = await d
    .select({
      key: events.name,
      people: sql<number>`COUNT(DISTINCT ${events.visitorId})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(events)
    .where(
      and(
        eq(events.siteId, siteId),
        eq(events.type, 'event'),
        gte(events.timestamp, new Date(from)),
        lte(events.timestamp, new Date(to)),
        isNotNull(events.name)
      )
    )
    .groupBy(events.name)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(20);

  // Total pageviews for percentage calc.
  const totalRow = await d
    .select({ n: sql<number>`COUNT(*)` })
    .from(events)
    .where(
      and(
        eq(events.siteId, siteId),
        eq(events.type, 'pageview'),
        gte(events.timestamp, new Date(from)),
        lte(events.timestamp, new Date(to))
      )
    );
  const total = Number(totalRow[0]?.n) || 0;

  return rows.map((r) => ({
    key: String(r.key ?? '—'),
    people: Number(r.people) || 0,
    count: Number(r.count) || 0,
    pct: total > 0 ? Math.round((Number(r.count) / total) * 1000) / 10 : 0,
  }));
}

export async function getRealtime(siteId: string) {
  const { from, to } = rangeToMs('live');
  const d = db();
  const rows = await d
    .select({ visitors: sql<number>`COUNT(DISTINCT ${events.visitorId})` })
    .from(events)
    .where(and(eq(events.siteId, siteId), gte(events.timestamp, new Date(from)), lte(events.timestamp, new Date(to))));
  return Number(rows[0]?.visitors || 0);
}

export async function getRealtimeSeries(siteId: string) {
  // 30 buckets of 1 min each.
  const ts = await getTimeseries(siteId, 'live');
  return ts.slice(-30);
}

export type SiteSummary = {
  siteId: string;
  visitors24h: number;
  pageviews24h: number;
  live: number;
  sparkline: number[];
};

export async function getAllSiteSummaries(siteIds: string[]): Promise<Record<string, SiteSummary>> {
  if (siteIds.length === 0) return {};
  const d = db();
  const now = Date.now();
  const from24h = now - 24 * 60 * 60 * 1000;
  const from30m = now - 30 * 60 * 1000;

  const placeholders = siteIds.map(() => '?').join(', ');

  // 24h aggregates per site
  const aggResult = await d.run(sql`
    SELECT site_id,
      COUNT(DISTINCT visitor_id) AS visitors,
      SUM(CASE WHEN type = 'pageview' THEN 1 ELSE 0 END) AS pageviews
    FROM events
    WHERE site_id IN (${sql.raw(siteIds.map((id) => `'${id.replace(/'/g, "''")}'`).join(','))})
      AND timestamp >= ${from24h}
    GROUP BY site_id
  `);
  const aggRows = (aggResult.results ?? []) as Array<{
    site_id: string;
    visitors: number;
    pageviews: number;
  }>;

  // Live (last 30m) per site
  const liveResult = await d.run(sql`
    SELECT site_id, COUNT(DISTINCT visitor_id) AS live
    FROM events
    WHERE site_id IN (${sql.raw(siteIds.map((id) => `'${id.replace(/'/g, "''")}'`).join(','))})
      AND timestamp >= ${from30m}
    GROUP BY site_id
  `);
  const liveRows = (liveResult.results ?? []) as Array<{ site_id: string; live: number }>;

  // Hourly sparkline (24 buckets) per site
  const bucketMs = 60 * 60 * 1000;
  const sparkResult = await d.run(sql`
    SELECT site_id,
      (timestamp / ${sql.raw(String(bucketMs))}) * ${sql.raw(String(bucketMs))} AS bucket,
      COUNT(DISTINCT visitor_id) AS visitors
    FROM events
    WHERE site_id IN (${sql.raw(siteIds.map((id) => `'${id.replace(/'/g, "''")}'`).join(','))})
      AND timestamp >= ${from24h}
    GROUP BY site_id, bucket
    ORDER BY site_id, bucket ASC
  `);
  const sparkRows = (sparkResult.results ?? []) as Array<{
    site_id: string;
    bucket: number;
    visitors: number;
  }>;

  const result: Record<string, SiteSummary> = {};
  for (const id of siteIds) {
    const agg = aggRows.find((r) => r.site_id === id);
    const live = liveRows.find((r) => r.site_id === id);
    const siteSparkRows = sparkRows.filter((r) => r.site_id === id);

    // Fill 24 buckets
    const sparkline: number[] = [];
    const startBucket = Math.floor(from24h / bucketMs) * bucketMs;
    for (let b = startBucket; b <= now; b += bucketMs) {
      const row = siteSparkRows.find((r) => Number(r.bucket) === b);
      sparkline.push(row ? Number(row.visitors) : 0);
    }

    result[id] = {
      siteId: id,
      visitors24h: Number(agg?.visitors) || 0,
      pageviews24h: Number(agg?.pageviews) || 0,
      live: Number(live?.live) || 0,
      sparkline,
    };
  }
  return result;
}
