import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { sites } from '@/lib/schema';
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
import { RangePicker } from '@/components/range-picker';
import { DashView } from './_dash-view';
import { SiteHeader } from './_header';

export const runtime = 'edge';

const VALID_RANGES: Range[] = ['live', '24h', '7d', '30d', '90d'];

export default async function SiteDash({
  params,
  searchParams,
}: {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { siteId } = await params;
  const sp = await searchParams;
  const range = (VALID_RANGES.includes(sp.range as Range) ? sp.range : '24h') as Range;

  const site = await db().select().from(sites).where(eq(sites.id, siteId)).get();
  if (!site) notFound();

  const [kpis, series, pages, sources, locations, devices, eventsData, live, liveSeries] = await Promise.all([
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

  return (
    <div className="space-y-6">
      <div className="max-w-5xl mx-auto px-6">
        <SiteHeader site={site} />
      </div>
      <div className="max-w-5xl mx-auto px-6 flex items-center justify-center">
        <RangePicker current={range} />
      </div>
      <DashView
        siteId={siteId}
        range={range}
        kpis={kpis}
        series={series}
        live={live}
        liveSeries={liveSeries}
        pages={pages}
        sources={sources}
        locations={locations}
        devices={devices}
        events={eventsData}
      />
    </div>
  );
}
