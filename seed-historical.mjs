// Seed historical events directly via wrangler d1 execute.
// Spreads events across the past 24h with realistic distribution.
import { execSync } from 'child_process';

const SITE_ID = process.argv[2];
if (!SITE_ID) {
  console.error('usage: node seed-historical.mjs <site_id>');
  process.exit(1);
}

const now = Date.now();
const HOURS = 24;
const EVENTS_PER_HOUR_AVG = 25;

const paths = ['/', '/info', '/pricing', '/blog', '/website/augen-1014', '/website/superpower-1015', '/website/unveil-1016', '/website/notion-1013', '/about', '/docs'];
const countries = ['US', 'IN', 'GB', 'DE', 'VN', 'KR', 'FR', 'CA', 'BR', 'JP', 'AU', 'NL'];
const regions = ['California', 'New York', 'Maharashtra', 'Karnataka', 'England', 'Bavaria', 'Île-de-France', 'Ontario'];
const cities = ['San Francisco', 'Mumbai', 'London', 'Berlin', 'Paris', 'Bangalore', 'Tokyo', 'Seoul', 'Toronto', 'Amsterdam'];
const referrers = [
  { d: 'news.ycombinator.com', utm: null },
  { d: 'google.com', utm: 'google' },
  { d: 'reddit.com', utm: null },
  { d: 'twitter.com', utm: 'twitter' },
  { d: 'github.com', utm: null },
  { d: 'bing.com', utm: 'bing' },
  { d: 'chatgpt.com', utm: 'ai' },
  { d: 'producthunt.com', utm: 'launch' },
  { d: null, utm: null }, // direct
];
const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Opera', 'Arc', 'Brave'];
const oses = ['macOS', 'Windows', 'iOS', 'Android', 'Linux'];
const devices = ['desktop', 'mobile', 'tablet'];
const langs = ['en-US', 'en-GB', 'de-DE', 'fr-FR', 'ja-JP', 'hi-IN'];
const eventNames = ['cta_hero', 'signup_click', 'filter', 'sponsor', 'share_click'];

function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function q(s) { return s === null || s === undefined ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`; }

const rows = [];
let sessionCounter = 0;

for (let h = 0; h < HOURS; h++) {
  // Bell-curve-ish activity: more during "afternoon" hours
  const hourFactor = 0.4 + 0.6 * Math.sin((h / HOURS) * Math.PI);
  const count = Math.floor(EVENTS_PER_HOUR_AVG * hourFactor * (0.7 + Math.random() * 0.6));
  for (let i = 0; i < count; i++) {
    const ts = now - (HOURS - h) * 3600_000 + Math.floor(Math.random() * 3600_000);
    const sid = `hs${sessionCounter++}`;
    const vid = `hv${Math.floor(Math.random() * 90)}`;
    const path = pick(paths);
    const ref = pick(referrers);
    const browser = pick(browsers);
    const os = pick(oses);
    const device = pick(devices);
    const country = pick(countries);
    const region = pick(regions);
    const city = pick(cities);
    const lang = pick(langs);

    rows.push(`(${q(SITE_ID)}, ${q(sid)}, ${q(vid)}, 'pageview', NULL, ${q('https://demo.example.com' + path)}, ${q(path)}, ${q(ref.d ? 'https://' + ref.d + '/' : null)}, ${q(ref.d)}, ${q(ref.utm)}, NULL, NULL, ${q(country)}, ${q(region)}, ${q(city)}, ${q(device)}, ${q(browser)}, ${q(os)}, 1920, 1080, ${q(lang)}, NULL, ${ts})`);

    // Non-bounce: second pageview in same session
    if (Math.random() < 0.35) {
      const ts2 = ts + Math.floor(Math.random() * 300_000);
      const path2 = pick(paths);
      rows.push(`(${q(SITE_ID)}, ${q(sid)}, ${q(vid)}, 'pageview', NULL, ${q('https://demo.example.com' + path2)}, ${q(path2)}, ${q(ref.d ? 'https://' + ref.d + '/' : null)}, ${q(ref.d)}, ${q(ref.utm)}, NULL, NULL, ${q(country)}, ${q(region)}, ${q(city)}, ${q(device)}, ${q(browser)}, ${q(os)}, 1920, 1080, ${q(lang)}, NULL, ${ts2})`);
    }

    // Custom event
    if (Math.random() < 0.2) {
      const name = pick(eventNames);
      rows.push(`(${q(SITE_ID)}, ${q(sid)}, ${q(vid)}, 'event', ${q(name)}, ${q('https://demo.example.com' + path)}, ${q(path)}, NULL, NULL, NULL, NULL, NULL, ${q(country)}, ${q(region)}, ${q(city)}, ${q(device)}, ${q(browser)}, ${q(os)}, 1920, 1080, ${q(lang)}, NULL, ${ts + 1})`);
    }

    // session_end with duration
    const dur = Math.floor(Math.random() * 400) + 5;
    rows.push(`(${q(SITE_ID)}, ${q(sid)}, ${q(vid)}, 'session_end', NULL, ${q('https://demo.example.com' + path)}, ${q(path)}, NULL, NULL, NULL, NULL, NULL, ${q(country)}, ${q(region)}, ${q(city)}, ${q(device)}, ${q(browser)}, ${q(os)}, 1920, 1080, ${q(lang)}, ${dur}, ${ts + 10_000})`);
  }
}

console.log(`Prepared ${rows.length} rows across ${HOURS}h for site ${SITE_ID}`);

// Chunk into groups of 200 rows per SQL statement.
const chunks = [];
for (let i = 0; i < rows.length; i += 200) chunks.push(rows.slice(i, i + 200));

for (const chunk of chunks) {
  const sql = `INSERT INTO events (site_id, session_id, visitor_id, type, name, url, path, referrer, referrer_domain, utm_source, utm_medium, utm_campaign, country, region, city, device, browser, os, screen_w, screen_h, lang, duration, timestamp) VALUES ${chunk.join(', ')};`;
  try {
    execSync(`npx wrangler d1 execute analythicc --local --command ${JSON.stringify(sql)}`, {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    process.stdout.write('.');
  } catch (e) {
    console.error('\nchunk failed:', e.stderr?.toString() || e.message);
    process.exit(1);
  }
}
console.log('\n✓ historical seed complete');
