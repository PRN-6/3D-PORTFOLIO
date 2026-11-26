// Production-preview baseline using existing puppeteer-core. No app code injection or asset mutation.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const out = path.resolve(process.env.AUDIT_OUT || 'docs/audit/baseline');
const base = process.env.AUDIT_URL || 'http://127.0.0.1:5175';
const executablePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--enable-webgl'], defaultViewport: null });
const report = { generatedAt: new Date().toISOString(), commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  browser: await browser.version(), platform: `${os.platform()} ${os.release()}`, cpu: os.cpus()[0]?.model,
  base, methodology: 'Production preview, fresh browser context per direct route, cache disabled, unthrottled loopback. 5-second rAF sample after loader disappears and 5-second settle. Mobile is viewport/touch emulation on this desktop GPU, not a phone benchmark. Renderer stats are existing app snapshots updated every 30 frames; not GPU timings.', results: [] };
try {
  for (const viewport of [{ name: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1 }, { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]) {
    for (const route of process.env.AUDIT_ROUTES?.split(',') || ['/', '/products', '/projects', '/about', '/contact', '/fun']) {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      const { name, ...size } = viewport;
      await page.setViewport(size);
      await page.setCacheEnabled(false);
      const errors = [], warnings = [], failedRequests = [], httpErrors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); if (m.type() === 'warn') warnings.push(m.text()); });
      page.on('requestfailed', r => failedRequests.push({ url: r.url(), error: r.failure()?.errorText }));
      page.on('response', r => { if (r.status() >= 400) httpErrors.push({ url: r.url(), status: r.status() }); });
      const row = { viewport, route, errors, warnings, failedRequests, httpErrors };
      try {
        const start = Date.now();
        await page.goto(base + route, { waitUntil: 'networkidle0', timeout: 90000 });
        await page.waitForFunction(() => !document.querySelector('[data-testid="preloader-overlay"]') && window.__THREE_STATS__?.calls > 0, { timeout: 90000 });
        row.readyObservedMs = Date.now() - start;
        await new Promise(r => setTimeout(r, 5000));
        row.sample = await page.evaluate(async () => {
          const times = [], start = performance.now(); let last = start;
          await new Promise(resolve => { function frame(now) { times.push(now - last); last = now; if (now - start < 5000) requestAnimationFrame(frame); else resolve(); } requestAnimationFrame(frame); });
          const sorted = times.slice(1).sort((a, b) => a - b);
          const canvas = document.querySelector('canvas'), gl = canvas?.getContext('webgl2');
          const ext = gl?.getExtension('WEBGL_debug_renderer_info');
          const scene = window.__THREE_SCENE__; let totalMeshes = 0, visibleMeshes = 0, lights = 0, shadowLights = 0;
          scene?.traverse(o => { if (o.isMesh) totalMeshes++; });
          scene?.traverseVisible(o => { if (o.isMesh) visibleMeshes++; if (o.isLight) { lights++; if (o.castShadow) shadowLights++; } });
          return { medianFrameMs: sorted[Math.floor(sorted.length / 2)], p95FrameMs: sorted[Math.floor(sorted.length * .95)],
            meanFps: 1000 / (sorted.reduce((a, b) => a + b, 0) / sorted.length), framesOver50ms: sorted.filter(t => t > 50).length,
            stats: window.__THREE_STATS__, totalMeshes, visibleMeshes, lights, shadowLights,
            gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null, canvas: { width: canvas?.width, height: canvas?.height },
            title: document.title, horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
            visibleIslandGroups: scene?.getObjectByName('BubblePresentationAnchor')?.children.filter(o => o.visible).map(o => o.name),
            resources: performance.getEntriesByType('resource').map(r => ({ url: r.name, duration: r.duration, transferSize: r.transferSize, decodedBodySize: r.decodedBodySize })),
            controls: [...document.querySelectorAll('button,a')].map(e => { const b = e.getBoundingClientRect(); return { text: e.getAttribute('aria-label') || e.textContent?.trim().slice(0, 60), x: b.x, y: b.y, width: b.width, height: b.height }; }).filter(b => b.width && b.height),
          };
        });
        row.screenshot = `${name}-${route.slice(1) || 'home'}.png`;
        await page.screenshot({ path: path.join(out, row.screenshot) });
      } catch (e) { row.failure = e.message; process.exitCode = 1; }
      report.results.push(row);
      fs.writeFileSync(path.join(out, 'browser.json'), JSON.stringify(report, null, 2) + '\n');
      console.log(JSON.stringify({ viewport: name, route, failure: row.failure, readyMs: row.readyObservedMs, stats: row.sample?.stats, fps: row.sample?.meanFps, errors: errors.length }));
      await context.close();
    }
  }
} finally { await browser.close(); }
