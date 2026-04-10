'use client';

import { useState } from 'react';
import { EventsTable } from '@/components/events-table';
import { ExperienceScore } from '@/components/experience-score';
import { HeroChart } from '@/components/hero-chart';
import { KPIStrip } from '@/components/kpi-strip';
import { RealtimeCard } from '@/components/realtime-card';
import { TabbedCard } from '@/components/tabbed-card';

type MetricKey = 'visitors' | 'pageviews' | 'bounceRate' | 'avgDuration';

type TopRow = { key: string; visitors: number; hits: number };
type Point = { t: number; visitors: number; pageviews: number; sessions: number };

type Props = {
  siteId: string;
  range: string;
  kpis: {
    visitors: { value: number; delta: number | null };
    pageviews: { value: number; delta: number | null };
    bounceRate: { value: number; delta: number | null };
    avgDuration: { value: number; delta: number | null };
    sessions: { value: number; delta: number | null };
    experienceScore: number;
  };
  series: Point[];
  live: number;
  liveSeries: Array<{ t: number; visitors: number }>;
  pages: { top: TopRow[]; entered: TopRow[]; exited: TopRow[] };
  sources: { referrer: TopRow[]; links: TopRow[]; campaign: TopRow[] };
  locations: { countries: TopRow[]; regions: TopRow[]; cities: TopRow[] };
  devices: { browsers: TopRow[]; os: TopRow[]; devices: TopRow[] };
  events: Array<{ key: string; people: number; count: number; pct: number }>;
};

function flag(code: string) {
  if (!code || code.length !== 2) return '🌐';
  const base = 0x1f1e6;
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => base + c.charCodeAt(0) - 65));
}

const browserIcon = (b: string) => {
  const l = b.toLowerCase();
  if (l.includes('chrome')) return '🟢';
  if (l.includes('safari')) return '🔵';
  if (l.includes('firefox')) return '🟠';
  if (l.includes('edge')) return '🔷';
  if (l.includes('opera')) return '🔴';
  if (l.includes('arc')) return '⚫';
  if (l.includes('brave')) return '🦁';
  return '⚪';
};

const deviceIcon = (d: string) => {
  if (d === 'desktop') return '🖥️';
  if (d === 'mobile') return '📱';
  if (d === 'tablet') return '💻';
  return '❓';
};

const sourceIcon = (s: string) => {
  const l = s.toLowerCase();
  if (l === 'direct') return '→';
  if (l.includes('google')) return '🔍';
  if (l.includes('reddit')) return '🔶';
  if (l.includes('twitter') || l.includes('x.com')) return '✕';
  if (l.includes('github')) return '🐙';
  if (l.includes('hacker')) return '🟧';
  if (l.includes('bing')) return '🔷';
  if (l.includes('chatgpt') || l.includes('openai')) return '✨';
  return '🔗';
};

export function DashView(props: Props) {
  const [metric, setMetric] = useState<MetricKey>('visitors');

  return (
    <div>
      {/* KPI strip — centered, narrow */}
      <div
        className="max-w-5xl mx-auto px-6 mb-10 animate-fade-up"
        style={{ animationDelay: '60ms' }}
      >
        <div className="flex justify-center">
          <KPIStrip kpis={props.kpis} selected={metric} onSelect={setMetric} />
        </div>
      </div>

      {/* Hero chart — FULL BLEED edge-to-edge */}
      <div
        className="w-full px-0 mb-12 animate-fade-up"
        style={{ animationDelay: '120ms' }}
      >
        <HeroChart data={props.series} range={props.range} metric={metric} />
      </div>

      {/* Rest of content — narrow */}
      <div className="max-w-5xl mx-auto px-6 space-y-5">
        {/* Realtime + Experience */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-up"
          style={{ animationDelay: '200ms' }}
        >
          <RealtimeCard siteId={props.siteId} initialCount={props.live} initialSeries={props.liveSeries} />
          <ExperienceScore score={props.kpis.experienceScore} />
        </div>

        {/* Pages + Sources */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-up"
          style={{ animationDelay: '260ms' }}
        >
          <TabbedCard
            title="Pages"
            tabs={[
              { key: 'top', label: 'Top', rows: props.pages.top },
              { key: 'entered', label: 'Entered', rows: props.pages.entered },
              { key: 'exited', label: 'Exited', rows: props.pages.exited },
            ]}
          />
          <TabbedCard
            title="Sources"
            tabs={[
              { key: 'referrer', label: 'Referrer', rows: props.sources.referrer },
              { key: 'links', label: 'Links', rows: props.sources.links },
              { key: 'campaign', label: 'Campaign', rows: props.sources.campaign },
            ]}
            iconFor={sourceIcon}
          />
        </div>

        {/* Locations + Devices */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-up"
          style={{ animationDelay: '320ms' }}
        >
          <TabbedCard
            title="Locations"
            tabs={[
              { key: 'countries', label: 'Countries', rows: props.locations.countries },
              { key: 'regions', label: 'Regions', rows: props.locations.regions },
              { key: 'cities', label: 'Cities', rows: props.locations.cities },
            ]}
            iconFor={(k) => flag(k)}
          />
          <TabbedCard
            title="Devices"
            tabs={[
              { key: 'browsers', label: 'Browsers', rows: props.devices.browsers },
              { key: 'os', label: 'OS', rows: props.devices.os },
              { key: 'devices', label: 'Devices', rows: props.devices.devices },
            ]}
            iconFor={(k) => {
              if (['desktop', 'mobile', 'tablet'].includes(k)) return deviceIcon(k);
              return browserIcon(k);
            }}
          />
        </div>

        {/* Events */}
        <div className="animate-fade-up" style={{ animationDelay: '380ms' }}>
          <EventsTable rows={props.events} />
        </div>
      </div>
    </div>
  );
}
