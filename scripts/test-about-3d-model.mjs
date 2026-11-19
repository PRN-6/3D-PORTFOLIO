import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/about_3d_model_qa';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  console.log('=== VERIFYING ABOUT ME 3D MODEL IS LEVEL 05 BLUE FLOWER GARDEN ===\n');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
    ],
  });

  const page = await browser.newPage();
  const consoleErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error('[Browser Error]:', msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
    console.error('[Page Error]:', err.message);
  });

  try {
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

    console.log('1. Navigating to http://localhost:5173/about...');
    await page.goto('http://localhost:5173/about', { waitUntil: 'networkidle0' });

    // Wait for the 3D canvas to mount and render
    await page.waitForSelector('canvas', { timeout: 15000 });
    console.log('✓ Main 3D Canvas mounted.');

    // Wait 3 seconds for 3D assets to load and settle
    console.log('2. Waiting for 3D assets to load in the scene...');
    await new Promise((r) => setTimeout(r, 4000));

    // Verify Blue Flower Garden nodes are present in the Three.js scene
    const sceneInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const r3f = canvas?.__r3f;
      const root = r3f?.root?.current;
      
      let foundGarden = false;
      let foundHimmel = false;
      let foundFrieren = false;
      let foundClouds = false;
      let foundRocks = false;

      if (root?.scene) {
        root.scene.traverse((obj) => {
          if (obj.name.includes('BlueFlowerGarden') || obj.name.includes('GardenEnvironment')) foundGarden = true;
          if (obj.name.includes('Himmel')) foundHimmel = true;
          if (obj.name.includes('Frieren')) foundFrieren = true;
          if (obj.name.includes('DreamyClouds') || obj.name.includes('floating-petals')) foundClouds = true;
          if (obj.name.includes('floating-rocks')) foundRocks = true;
        });
      }

      const toolbar = document.querySelector('.bottom-20, .bottom-22');
      const toolbarText = toolbar?.textContent || '';

      return {
        foundGarden,
        foundHimmel,
        foundFrieren,
        foundClouds,
        foundRocks,
        toolbarText,
        pageTitle: document.title,
      };
    });

    console.log('Scene node inspection:', sceneInfo);

    // Capture Screenshot 1: Full-Screen 3D Blue Flower Garden Model (Overview / Initial landing)
    const shot1 = path.join(artifactDir, '01_about_me_3d_blue_flower_garden_overview.png');
    await page.screenshot({ path: shot1 });
    console.log(`✓ Saved screenshot: ${shot1}`);

    // Click "Himmel & Frieren" button in the bottom toolbar to focus directly on them
    console.log('3. Clicking "Himmel & Frieren" in toolbar...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const charBtn = buttons.find((b) => b.textContent.includes('Himmel & Frieren'));
      if (charBtn) charBtn.click();
    });
    await new Promise((r) => setTimeout(r, 2000));

    // Capture Screenshot 2: Himmel & Frieren focal view
    const shot2 = path.join(artifactDir, '02_about_me_3d_himmel_and_frieren_view.png');
    await page.screenshot({ path: shot2 });
    console.log(`✓ Saved screenshot: ${shot2}`);

    // Click "Flower Meadow" in toolbar
    console.log('4. Clicking "Flower Meadow" in toolbar...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const meadowBtn = buttons.find((b) => b.textContent.includes('Flower Meadow'));
      if (meadowBtn) meadowBtn.click();
    });
    await new Promise((r) => setTimeout(r, 2000));

    // Capture Screenshot 3: Meadow close view
    const shot3 = path.join(artifactDir, '03_about_me_3d_flower_meadow_view.png');
    await page.screenshot({ path: shot3 });
    console.log(`✓ Saved screenshot: ${shot3}`);

    // Click "Biography Pedestal" button in the toolbar to open the About Me Codex modal
    console.log('5. Clicking "Biography Pedestal" to open modal...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const bioBtn = buttons.find((b) => b.textContent.includes('Biography Pedestal'));
      if (bioBtn) bioBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1500));

    // Capture Screenshot 4: Modal open on top of the 3D scene
    const shot4 = path.join(artifactDir, '04_about_me_biography_modal_open.png');
    await page.screenshot({ path: shot4 });
    console.log(`✓ Saved screenshot: ${shot4}`);

    // Dismiss the modal
    console.log('6. Dismissing modal...');
    await page.evaluate(() => {
      const dismissBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent.includes('DISMISS SCROLL')
      );
      if (dismissBtn) dismissBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1000));

    // -------------------------------------------------------------------------
    // Mobile Viewport (390x844)
    // -------------------------------------------------------------------------
    console.log('7. Testing Mobile Viewport (390x844)...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
    await new Promise((r) => setTimeout(r, 2000));

    const shot5 = path.join(artifactDir, '05_mobile_about_me_3d_blue_flower_garden.png');
    await page.screenshot({ path: shot5 });
    console.log(`✓ Saved mobile screenshot: ${shot5}`);

    // -------------------------------------------------------------------------
    // Light Mode Test
    // -------------------------------------------------------------------------
    console.log('8. Testing Light Mode on Desktop...');
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    await page.evaluate(() => {
      const btn = document.querySelector('[data-testid="theme-toggle"]');
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 1500));
    const shot6 = path.join(artifactDir, '06_desktop_about_me_garden_light_mode.png');
    await page.screenshot({ path: shot6 });
    console.log(`✓ Saved light mode screenshot: ${shot6}`);

    console.log('\n--- Console Errors Audit ---');
    console.log(`Total errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.error('Console errors:', consoleErrors);
    } else {
      console.log('🌟 ZERO CONSOLE ERRORS! 🌟');
    }
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
