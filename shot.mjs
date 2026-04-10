import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = 'http://localhost:8788';
const PASSWORD = 'peachy';
const [, , siteId, outPath] = process.argv;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
  defaultViewport: { width: 1440, height: 2200, deviceScaleFactor: 2 },
});
const page = await browser.newPage();

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
await page.type('input[name="password"]', PASSWORD);
await Promise.all([
  page.waitForNavigation({ waitUntil: 'networkidle2' }),
  page.click('button[type="submit"]'),
]);

await page.goto(`${BASE}/dashboard/${siteId}?range=24h`, { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: outPath, fullPage: true });

await browser.close();
console.log('saved', outPath);
