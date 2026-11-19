import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/blue_flower_garden_qa';
const publicPreviewDir = path.resolve('public/models/blue-flower-garden/previews');

[artifactDir, publicPreviewDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function run() {
  console.log('=== VERIFYING LEVEL 05: BLUE FLOWER GARDEN 3D PREVIEW ===\n');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--ignore-gpu-blocklist'
    ],
  });

  try {
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

    console.log('1. Navigating to http://localhost:5173/models/blue-flower-garden/preview.html...');
    await page.goto('http://localhost:5173/models/blue-flower-garden/preview.html', { waitUntil: 'networkidle0' });

    // Wait for the scene to finish loading
    await page.waitForFunction(() => window.gardenPreview && window.gardenPreview.isReady() === true, {
      timeout: 30000,
    });
    console.log('Scene fully loaded and initialized!');

    // Settle animations
    await new Promise(r => setTimeout(r, 2000));

    // Capture shots for all 5 presets
    const shots = [
      { name: '01_hero_reference_view', preset: 'heroFront', desc: 'Reference Composition: Himmel & Frieren in flower meadow' },
      { name: '02_aerial_overview', preset: 'overview', desc: 'Full aerial view showing dense blue flower carpet across island' },
      { name: '03_romance_closeup', preset: 'romanceCloseUp', desc: 'Intimate close-up of Himmel and Frieren' },
      { name: '04_horizon_distant', preset: 'horizonDistant', desc: 'Diagonal view across flowering trees and fluffy clouds' },
      { name: '05_underside_crystals', preset: 'undersideInspection', desc: 'Rocky underside with stalactites and floating crystals' },
    ];

    for (const shot of shots) {
      console.log(`Capturing ${shot.preset} (${shot.desc})...`);
      await page.evaluate(presetName => {
        window.gardenPreview.shot(presetName);
      }, shot.preset);
      await new Promise(r => setTimeout(r, 1200));

      const fileArtifact = path.join(artifactDir, `${shot.name}.png`);
      const filePublic = path.join(publicPreviewDir, `${shot.name}.png`);
      await page.screenshot({ path: fileArtifact });
      fs.copyFileSync(fileArtifact, filePublic);
    }

    const sceneStats = await page.evaluate(() => {
      const p = window.gardenPreview;
      let meshCount = 0;
      let triCount = 0;
      p.scene.traverse(obj => {
        if (obj.isMesh) {
          meshCount++;
          if (obj.geometry) {
            triCount += obj.geometry.index ? obj.geometry.index.count / 3 : obj.geometry.attributes.position.count / 3;
          }
        }
      });
      return {
        meshCount,
        triCount: Math.round(triCount),
        himmelLoaded: !!p.himmel(),
        frierenLoaded: !!p.frieren(),
        activeMixers: p.mixers.length,
      };
    });

    console.log('\n--- Scene Render Diagnostics ---');
    console.log('Meshes in Scene:', sceneStats.meshCount);
    console.log('Rendered Triangles:', sceneStats.triCount);
    console.log('Himmel Model Loaded:', sceneStats.himmelLoaded);
    console.log('Frieren Model Loaded:', sceneStats.frierenLoaded);
    console.log('Active Animation Mixers:', sceneStats.activeMixers);
    console.log('Console Errors:', consoleErrors.length === 0 ? 'None' : consoleErrors);

    if (consoleErrors.length > 0) {
      throw new Error(`Encountered console errors: ${consoleErrors.join(', ')}`);
    }

    console.log('\nAll Level 05: Blue Flower Garden tests passed successfully!');
  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();
