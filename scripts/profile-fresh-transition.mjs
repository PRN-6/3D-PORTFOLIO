import puppeteer from 'puppeteer-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testFreshTransition() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=default'
    ],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE:', msg.text()));

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4500));

  console.log('--- STARTING PROFILING OF FRESH TRANSITION ---');

  // Install rAF probe before click
  await page.evaluate(() => {
    window.__FPS_LOG__ = [];
    window.__LONG_TASKS__ = [];
    const obs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__LONG_TASKS__.push({
          duration: entry.duration,
          startTime: entry.startTime,
        });
      }
    });
    try { obs.observe({ entryTypes: ['longtask'] }); } catch(e){}

    let last = performance.now();
    function tick(now) {
      const delta = now - last;
      last = now;
      if (delta > 0) {
        const stats = window.__THREE_STATS__ || {};
        window.__FPS_LOG__.push({
          time: now,
          delta,
          calls: stats.calls || 0,
          triangles: stats.triangles || 0,
          programs: stats.programs || 0,
        });
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });

  const startBtn = await page.waitForSelector('button[aria-label="Start Adventure"]');
  console.log('Clicking START ADVENTURE...');
  await startBtn.click();

  // Record for the full 6.0 seconds of the transition
  await new Promise(r => setTimeout(r, 6500));

  const report = await page.evaluate(() => {
    const log = window.__FPS_LOG__ || [];
    const deltas = log.map(l => l.delta);
    const sorted = [...deltas].sort((a, b) => a - b);
    const avg = deltas.reduce((a, b) => a + b, 0) / (deltas.length || 1);
    const minFps = 1000 / (sorted[sorted.length - 1] || 1);
    const maxFps = 1000 / (sorted[0] || 1);
    const avgFps = 1000 / avg;

    const dropped16 = deltas.filter(d => d > 18.0).length;
    const dropped33 = deltas.filter(d => d > 33.3).length;
    const dropped50 = deltas.filter(d => d > 50.0).length;
    const dropped100 = deltas.filter(d => d > 100.0).length;

    // Find the worst frames and what happened
    const worstFrames = [...log].sort((a, b) => b.delta - a.delta).slice(0, 10);

    return {
      totalFramesRecorded: log.length,
      avgFps: parseFloat(avgFps.toFixed(1)),
      minFps: parseFloat(minFps.toFixed(1)),
      avgFrameTime: parseFloat(avg.toFixed(2)),
      p95FrameTime: parseFloat((sorted[Math.floor(sorted.length * 0.95)] || 0).toFixed(2)),
      p99FrameTime: parseFloat((sorted[Math.floor(sorted.length * 0.99)] || 0).toFixed(2)),
      maxFrameTime: parseFloat((sorted[sorted.length - 1] || 0).toFixed(2)),
      droppedFramesOver18ms: dropped16,
      droppedFramesOver33ms: dropped33,
      droppedFramesOver50ms: dropped50,
      droppedFramesOver100ms: dropped100,
      longTasks: window.__LONG_TASKS__,
      worst10Frames: worstFrames.map(f => ({
        deltaMs: parseFloat(f.delta.toFixed(2)),
        calls: f.calls,
        triangles: f.triangles,
        programs: f.programs
      }))
    };
  });

  console.log('=== REAL TRANSITION PROFILE RESULT ===');
  console.log(JSON.stringify(report, null, 2));

  await browser.close();
}

testFreshTransition().catch(err => {
  console.error(err);
  process.exit(1);
});
