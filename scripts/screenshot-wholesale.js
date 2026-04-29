const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const url = process.argv[2] || 'https://website-three-omega-62.vercel.app/wholesale';
  const out = process.argv[3] || path.join(__dirname, '..', '..', 'wholesale_screenshot.png');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.screenshot({ path: out, fullPage: true });
  await browser.close();
  console.log(`Saved: ${out}`);
})().catch(err => { console.error(err); process.exit(1); });
