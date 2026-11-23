// Local-only interaction/transition baseline. Does not submit contact forms or follow social links.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const base = process.env.AUDIT_URL || 'http://127.0.0.1:5175';
const out = path.resolve(process.env.AUDIT_OUT || 'docs/audit/baseline');
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const results = [];
try {
  for (const mobile of [false, true]) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    const name = mobile ? 'mobile' : 'desktop';
    await page.setViewport({ width: mobile ? 390 : 1440, height: mobile ? 844 : 900, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base, { waitUntil: 'networkidle0', timeout: 90000 });
    await page.waitForFunction(() => !document.querySelector('[data-testid="preloader-overlay"]') && window.__THREE_STATS__?.calls > 0);
    await new Promise(r => setTimeout(r, 3000));
    const row = { viewport: name, errors, transitions: [], screenshots: [] };
    for (const [route, group] of [['/products', 'BubbleWorkshopGroup'], ['/projects', 'BubbleArchiveGroup'], ['/about', 'BubbleForestGroup'], ['/', 'BubbleHomeGroup']]) {
      if (mobile) await page.click('button[aria-label="Open navigation menu"]');
      // Begin frame sampling before the click; collect across the full six-second transition window.
      await page.evaluate(() => {
        window.__AUDIT_FRAMES__ = [];
        const start = performance.now(); let last = start;
        function tick(t) { window.__AUDIT_FRAMES__.push(t - last); last = t; if (t - start < 6000) requestAnimationFrame(tick); }
        requestAnimationFrame(tick);
      });
      await page.click(`${mobile ? '[aria-label="Mobile Navigation"]' : 'nav[aria-label="Main Navigation"]'} a[href="${route}"]`);
      await page.waitForFunction(p => location.pathname === p, {}, route);
      await new Promise(r => setTimeout(r, 6500));
      const measurement = await page.evaluate(expected => {
        const samples = window.__AUDIT_FRAMES__.slice(1).sort((a, b) => a - b);
        const anchor = window.__THREE_SCENE__?.getObjectByName('BubblePresentationAnchor');
        const groups = anchor?.children.filter(o => o.visible && o.name.startsWith('Bubble')).map(o => o.name);
        return { p50Ms: samples[Math.floor(samples.length * .5)], p95Ms: samples[Math.floor(samples.length * .95)], maxMs: samples.at(-1), over50ms: samples.filter(x => x > 50).length,
          groups, passed: groups?.length === 1 && groups[0] === expected, stats: window.__THREE_STATS__ };
      }, group);
      row.transitions.push({ route, ...measurement });
      if (!measurement.passed) process.exitCode = 1;
      const themeButton = mobile ? '[data-testid="theme-toggle-mobile"]' : '[data-testid="theme-toggle"]';
      await page.click(themeButton);
      await new Promise(r => setTimeout(r, 600));
      const file = `${name}-${route.slice(1) || 'home'}-dark.png`;
      await page.screenshot({ path: path.join(out, file) });
      row.screenshots.push(file);
      await page.click(themeButton);
    }
    await page.goBack();
    await new Promise(r => setTimeout(r, 6500));
    row.backPath = await page.evaluate(() => location.pathname);
    await page.goForward();
    await new Promise(r => setTimeout(r, 6500));
    row.forwardPath = await page.evaluate(() => location.pathname);
    const resetButtons = await page.$$('button[aria-label="Reset camera view"]');
    for (const button of resetButtons) { if (await button.isVisible()) { await button.click(); break; } }
    await new Promise(r => setTimeout(r, 2500));
    row.resetCamera = await page.evaluate(() => window.__THREE_CAMERA__?.position.toArray());
    row.passed = row.transitions.every(t => t.passed) && row.backPath === '/about' && row.forwardPath === '/' && errors.length === 0;
    if (!row.passed) process.exitCode = 1;
    results.push(row);
    fs.writeFileSync(path.join(out, 'interactions.json'), JSON.stringify({ generatedAt: new Date().toISOString(), base,
      methodology: 'Warm SPA navigation; 6-second rAF window around each click, followed by dark-theme screenshots; desktop GPU for both viewports. Back/forward and reset exercised. No GPU timer, contact submit, full clip validation or mobile hardware test.', results }, null, 2) + '\n');
    console.log(JSON.stringify(row));
    await context.close();
  }
} finally { await browser.close(); }
