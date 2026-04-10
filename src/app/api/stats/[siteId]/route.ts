import { NextRequest, NextResponse } from 'next/server';
import { isAuthed } from '@/lib/auth';
import {
  getDevices,
  getEvents,
  getKPIs,
  getLocations,
  getPages,
  getRealtime,
  getRealtimeSeries,
  getSources,
  getTimeseries,
  Range,
} from '@/lib/stats';

export const runtime = 'edge';

const RANGES: Range[] = ['live', '24h', '7d', '30d', '90d'];

export async function GET(req: NextRequest, ctx: { params: Promise<{ siteId: string }> }) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { siteId } = await ctx.params;
  const r = (req.nextUrl.searchParams.get('range') as Range) || '7d';
  const range: Range = RANGES.includes(r) ? r : '7d';

  const [kpis, series, pages, sources, locations, devices, events, live, liveSeries] = await Promise.all([
    getKPIs(siteId, range),
    getTimeseries(siteId, range),
    getPages(siteId, range),
    getSources(siteId, range),
    getLocations(siteId, range),
    getDevices(siteId, range),
    getEvents(siteId, range),
    getRealtime(siteId),
    getRealtimeSeries(siteId),
  ]);

  return NextResponse.json({
    range,
    kpis,
    series,
    pages,
    sources,
    locations,
    devices,
    events,
    live,
    liveSeries,
  });
}
