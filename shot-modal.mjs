import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = 'http://localhost:8788';
const [, , which = 'new', outPath = '/tmp/ana-shots/modal.png'] = process.argv;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
});
const page = await browser.newPage();

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
await page.type('input[name="password"]', 'peachy');
await Promise.all([
  page.waitForNavigation({ waitUntil: 'networkidle2' }),
  page.click('button[type="submit"]'),
]);

if (which === 'new') {
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 600));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => /new project/i.test(x.textContent || ''));
    if (b) b.click();
  });
} else {
  // install snippet modal on site page
  const siteId = 'f861b52133cdd704';
  await page.goto(`${BASE}/dashboard/${siteId}?range=24h`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 800));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((x) => /install snippet/i.test(x.textContent || ''));
    if (b) b.click();
  });
}

await new Promise((r) => setTimeout(r, 700));
await page.screenshot({ path: outPath, fullPage: false });
await browser.close();
console.log('saved', outPath);
