import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const sites = sqliteTable('sites', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  domain: text('domain').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const events = sqliteTable(
  'events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    siteId: text('site_id')
      .notNull()
      .references(() => sites.id, { onDelete: 'cascade' }),
    sessionId: text('session_id').notNull(),
    visitorId: text('visitor_id').notNull(),
    type: text('type', { enum: ['pageview', 'event', 'session_end'] }).notNull(),
    name: text('name'),
    url: text('url').notNull(),
    path: text('path').notNull(),
    referrer: text('referrer'),
    referrerDomain: text('referrer_domain'),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    country: text('country'),
    region: text('region'),
    city: text('city'),
    device: text('device'),
    browser: text('browser'),
    os: text('os'),
    screenW: integer('screen_w'),
    screenH: integer('screen_h'),
    lang: text('lang'),
    duration: integer('duration'),
    timestamp: integer('timestamp', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => ({
    siteTs: index('idx_events_site_ts').on(t.siteId, t.timestamp),
    siteSession: index('idx_events_site_session').on(t.siteId, t.sessionId),
    siteType: index('idx_events_site_type').on(t.siteId, t.type),
  })
);

export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
