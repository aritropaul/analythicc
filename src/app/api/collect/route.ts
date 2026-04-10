import { getRequestContext } from '@cloudflare/next-on-pages';
import { drizzle } from 'drizzle-orm/d1';
import { NextRequest, NextResponse } from 'next/server';
import * as schema from '@/lib/schema';
import { parseReferrer, parseUA, parseUTM } from '@/lib/ua';

export const runtime = 'edge';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

type Body = {
  site?: string;
  session?: string;
  visitor?: string;
  type?: 'pageview' | 'event' | 'session_end';
  name?: string;
  url?: string;
  path?: string;
  ref?: string;
  title?: string;
  duration?: number;
  sw?: number;
  sh?: number;
  lang?: string;
  tz?: string;
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400, headers: CORS });
  }

  if (!body.site || !body.session || !body.visitor || !body.type || !body.url || !body.path) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400, headers: CORS });
  }
  if (!['pageview', 'event', 'session_end'].includes(body.type)) {
    return NextResponse.json({ error: 'bad type' }, { status: 400, headers: CORS });
  }

  const { env, cf } = getRequestContext();
  const db = drizzle(env.DB, { schema });

  // Confirm site exists. Cheap cache-less lookup; D1 handles fast.
  const site = await db.query.sites.findFirst({ where: (s, { eq }) => eq(s.id, body.site!) });
  if (!site) {
    return NextResponse.json({ error: 'unknown site' }, { status: 404, headers: CORS });
  }

  const ua = req.headers.get('user-agent') || '';
  const parsed = parseUA(ua);
  if (parsed.device === 'bot') {
    return NextResponse.json({ ok: true, bot: true }, { headers: CORS });
  }

  const { referrer, referrerDomain } = parseReferrer(body.ref);
  const { utmSource, utmMedium, utmCampaign } = parseUTM(body.url);

  // request.cf is Cloudflare-enriched geo. Only present on CF runtime.
  const country = (cf as any)?.country ?? null;
  const region = (cf as any)?.region ?? null;
  const city = (cf as any)?.city ?? null;

  try {
    await db.insert(schema.events).values({
      siteId: body.site,
      sessionId: body.session,
      visitorId: body.visitor,
      type: body.type,
      name: body.name ?? null,
      url: body.url.slice(0, 2048),
      path: body.path.slice(0, 1024),
      referrer: referrer?.slice(0, 2048) ?? null,
      referrerDomain,
      utmSource,
      utmMedium,
      utmCampaign,
      country,
      region,
      city,
      device: parsed.device,
      browser: parsed.browser,
      os: parsed.os,
      screenW: body.sw ?? null,
      screenH: body.sh ?? null,
      lang: body.lang?.slice(0, 16) ?? null,
      duration: body.duration ?? null,
      timestamp: new Date(),
    });
  } catch (err) {
    return NextResponse.json({ error: 'db write failed' }, { status: 500, headers: CORS });
  }

  return NextResponse.json({ ok: true }, { headers: CORS });
}
