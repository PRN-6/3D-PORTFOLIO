import puppeteer from 'puppeteer-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runStageSampler(page, stageName, durationMs = 3000) {
  console.log(`\n=== SAMPLING STAGE: ${stageName} (${durationMs}ms) ===`);

  const metrics = await page.evaluate(async (sampleDuration) => {
    return new Promise((resolve) => {
      const frames = [];
      let startTime = performance.now();
      let lastTime = startTime;
      let longTasks = [];

      let observer = null;
      try {
        observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            longTasks.push({
              duration: entry.duration,
              startTime: entry.startTime,
            });
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // longtask not supported or blocked
      }

      function loop(now) {
        const delta = now - lastTime;
        lastTime = now;
        if (delta > 0) {
          frames.push(delta);
        }

        if (now - startTime < sampleDuration) {
          requestAnimationFrame(loop);
        } else {
          if (observer) observer.disconnect();

          const totalFrames = frames.length;
          const avgDelta = frames.reduce((a, b) => a + b, 0) / (totalFrames || 1);
          const fps = 1000 / avgDelta;
          const sorted = [...frames].sort((a, b) => a - b);
          const medianDelta = sorted[Math.floor(sorted.length * 0.5)] || 0;
          const p95Delta = sorted[Math.floor(sorted.length * 0.95)] || 0;
          const p99Delta = sorted[Math.floor(sorted.length * 0.99)] || 0;
          const maxDelta = sorted[sorted.length - 1] || 0;
          const dropped33 = frames.filter((f) => f > 33.3).length;
          const dropped50 = frames.filter((f) => f > 50.0).length;

          const stats = (window).__THREE_STATS__ || {};
          const mem = (performance).memory ? {
            usedJSHeapSize: ((performance).memory.usedJSHeapSize / 1048576).toFixed(1) + ' MB',
            totalJSHeapSize: ((performance).memory.totalJSHeapSize / 1048576).toFixed(1) + ' MB'
          } : 'N/A';

          resolve({
            fps: parseFloat(fps.toFixed(1)),
            totalFrames,
            avgFrameTime: parseFloat(avgDelta.toFixed(2)),
            medianFrameTime: parseFloat(medianDelta.toFixed(2)),
            p95FrameTime: parseFloat(p95Delta.toFixed(2)),
            p99FrameTime: parseFloat(p99Delta.toFixed(2)),
            maxFrameTime: parseFloat(maxDelta.toFixed(2)),
            droppedFramesOver33ms: dropped33,
            droppedFramesOver50ms: dropped50,
            longTasksCount: longTasks.length,
            longTasksTotalDuration: parseFloat(longTasks.reduce((a, b) => a + b.duration, 0).toFixed(1)),
            drawCalls: stats.calls || 0,
            triangles: stats.triangles || 0,
            geometries: stats.geometries || 0,
            textures: stats.textures || 0,
            programs: stats.programs || 0,
            jsHeap: mem
          });
        }
      }

      requestAnimationFrame(loop);
    });
  }, durationMs);

  console.log(JSON.stringify(metrics, null, 2));
  return metrics;
}

async function profileAll() {
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
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('warn') || text.includes('error')) console.log('PAGE:', text);
  });

  console.log('Navigating to app...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));

  const results = {};

  // STAGE A: Hero's Home running without a transition
  results.stageA_HeroHome = await runStageSampler(page, "Stage A: Hero's Home Alone", 3000);

  // STAGE C: Both worlds loaded but transition inactive (forced progress = 0 in transition)
  console.log('\nTriggering START ADVENTURE for Stage C...');
  const startBtn = await page.waitForSelector('button[aria-label="Start Adventure"]');
  await startBtn.click();
  await new Promise(r => setTimeout(r, 300));

  // Freeze transition at p = 0.01 (both worlds loaded, but static)
  await page.evaluate(() => {
    window.__FORCE_TRANSITION_PROGRESS__ = 0.01;
    window.__FORCE_CAM_POSE__ = {
      pos: [14.0, 10.0, 14.0],
      target: [0.0, 0.5, 0.0]
    };
  });
  await new Promise(r => setTimeout(r, 600));
  results.stageC_BothWorldsLoadedInactive = await runStageSampler(page, "Stage C: Both Worlds Loaded (Inactive Transition)", 3000);

  // STAGE D: Staircase animation running (midway, steps floating, but static camera)
  console.log('\nSetting up Stage D: Staircase animation running...');
  await page.evaluate(() => {
    window.__FORCE_TRANSITION_PROGRESS__ = 0.35; // Steps 0-10 materialized and hovering
    window.__FORCE_CAM_POSE__ = {
      pos: [12.0, 6.5, 7.5],
      target: [6.2, 4.2, -1.0]
    };
  });
  await new Promise(r => setTimeout(r, 600));
  results.stageD_StaircaseAnimation = await runStageSampler(page, "Stage D: Staircase Animation Running", 3000);

  // STAGE E: Camera moving actively between the two worlds (unfreeze and sample active transition)
  console.log('\nSetting up Stage E: Active Transition with Camera Moving...');
  await page.evaluate(() => {
    delete window.__FORCE_TRANSITION_PROGRESS__;
    delete window.__FORCE_CAM_POSE__;
  });
  results.stageE_ActiveTransition = await runStageSampler(page, "Stage E: Active Transition with Camera Journey", 4000);

  // Wait until settled at Grand Mage's Archive for Stage B
  console.log('\nWaiting for transition to complete into Archive...');
  await new Promise(r => setTimeout(r, 3000));

  // STAGE B: Grand Mage's Archive running independently
  results.stageB_ArchiveAlone = await runStageSampler(page, "Stage B: Grand Mage's Archive Alone", 3000);

  await browser.close();

  console.log('\n======================================================');
  console.log('              FULL DIAGNOSTIC SUMMARY                 ');
  console.log('======================================================');
  console.log(JSON.stringify(results, null, 2));
}

profileAll().catch(err => {
  console.error('PROFILING ERROR:', err);
  process.exit(1);
});
