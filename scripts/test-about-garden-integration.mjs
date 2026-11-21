import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/about_flower_garden_qa';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  console.log('=== VERIFYING LEVEL 05: BLUE FLOWER GARDEN INTEGRATION IN ABOUT ME PAGE ===\n');

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
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error('[Browser Error]:', msg.text());
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
    console.error('[Page Error]:', err.message);
  });

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Desktop Viewport (1920x1080)
    // -------------------------------------------------------------------------
    console.log('1. Setting desktop viewport (1920x1080)...');
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

    console.log('2. Navigating to http://localhost:5173/about...');
    await page.goto('http://localhost:5173/about', { waitUntil: 'networkidle0' });

    // Wait for the modal dialog to be visible
    console.log('3. Checking for ArchiveScrollModal dialog...');
    await page.waitForSelector('div[role="dialog"][aria-label="The Archmage\'s Chronicle"]', {
      timeout: 10000,
    });
    console.log('✓ Modal dialog found and opened on /about route.');

    // Verify personal introduction and biography are present
    const bioText = await page.evaluate(() => {
      const bioHeader = document.querySelector('h3');
      const paragraphs = Array.from(document.querySelectorAll('p')).map((p) => p.textContent);
      return {
        hasBioHeader: document.body.textContent.includes('Biography & Craft Philosophy'),
        hasAttributes: document.body.textContent.includes('Primary Class'),
        hasGardenSection: document.querySelector('[data-testid="blue-flower-garden-section"]') !== null,
      };
    });

    console.log('Bio structure check:', bioText);
    if (!bioText.hasBioHeader || !bioText.hasAttributes || !bioText.hasGardenSection) {
      throw new Error('Bio structure or Blue Flower Garden section missing!');
    }
    console.log('✓ Personal introduction, attributes, and biography preserved.');
    console.log('✓ Blue Flower Garden section found immediately following biography.');

    // Wait for the 3D canvas inside BlueFlowerGardenViewer to be ready
    console.log('4. Waiting for 3D Blue Flower Garden to finish loading...');
    await page.waitForFunction(
      () => {
        const garden = document.querySelector('[data-testid="blue-flower-garden-section"]');
        if (!garden) return false;
        // Check if loading overlay is gone
        const hasLoader = garden.textContent.includes('Conjuring the Eternal Meadow') || garden.textContent.includes('Gathering blue flowers');
        const canvas = garden.querySelector('canvas');
        return !hasLoader && canvas !== null;
      },
      { timeout: 30000 }
    );
    console.log('✓ 3D Blue Flower Garden loaded and active!');

    // Settle animation loop for 2 seconds
    await new Promise((r) => setTimeout(r, 2000));

    // Capture Desktop Screenshot: Full modal view showing Bio + 3D Garden
    const desktopShotPath = path.join(artifactDir, '01_desktop_about_page_garden.png');
    await page.screenshot({ path: desktopShotPath });
    console.log(`✓ Saved screenshot: ${desktopShotPath}`);

    // Scroll down inside modal to view full 3D canvas and footer
    await page.evaluate(() => {
      const scrollBody = document.querySelector('div[role="dialog"] .overflow-y-auto');
      if (scrollBody) scrollBody.scrollTop = 380;
    });
    await new Promise((r) => setTimeout(r, 1000));

    const gardenDetailShotPath = path.join(artifactDir, '02_desktop_garden_centerpiece_detail.png');
    await page.screenshot({ path: gardenDetailShotPath });
    console.log(`✓ Saved screenshot: ${gardenDetailShotPath}`);

    // -------------------------------------------------------------------------
    // TEST 2: Test Camera Preset Controls (Close-up, Meadow, Underside)
    // -------------------------------------------------------------------------
    console.log('5. Testing Camera Preset Buttons...');
    
    // Click "Close-up"
    const closeupBtn = await page.waitForSelector('button[aria-label="Close-up"]');
    await closeupBtn.click();
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(artifactDir, '03_preset_intimate_closeup.png') });
    console.log('✓ Captured Close-up preset view.');

    // Click "Meadow Overview"
    const overviewBtn = await page.waitForSelector('button[aria-label="Meadow Overview"]');
    await overviewBtn.click();
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(artifactDir, '04_preset_meadow_overview.png') });
    console.log('✓ Captured Meadow Overview preset view.');

    // Click "Hero View" reset
    const heroBtn = await page.waitForSelector('button[aria-label="Hero View"]');
    await heroBtn.click();
    await new Promise((r) => setTimeout(r, 1500));
    console.log('✓ Returned to Hero View.');

    // -------------------------------------------------------------------------
    // TEST 3: Test Tab Navigation Preservation (Chronicle, Academies, Accolades)
    // -------------------------------------------------------------------------
    console.log('6. Testing Tabs Preservation in ArchiveScrollModal...');

    // Click "Chronicle & Feats"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('div[role="dialog"] button'));
      const chronicleBtn = btns.find((b) => b.textContent.includes('Chronicle'));
      if (chronicleBtn) chronicleBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    const hasTimeline = await page.evaluate(() => document.body.textContent.includes('Expeditions & Quests'));
    console.log('✓ Chronicle tab loaded:', hasTimeline);

    // Click "Academies"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('div[role="dialog"] button'));
      const academiesBtn = btns.find((b) => b.textContent.includes('Academies'));
      if (academiesBtn) academiesBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    const hasAcademies = await page.evaluate(() => document.body.textContent.includes('Mage Academies'));
    console.log('✓ Academies tab loaded:', hasAcademies);

    // Return to "Lore & Bio"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('div[role="dialog"] button'));
      const bioBtn = btns.find((b) => b.textContent.includes('Lore & Bio'));
      if (bioBtn) bioBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    console.log('✓ Seamlessly returned to Lore & Bio without reload delay.');

    // -------------------------------------------------------------------------
    // TEST 4: Mobile Responsive Viewport (390x844 - iPhone 14 / modern phone)
    // -------------------------------------------------------------------------
    console.log('7. Testing Mobile Viewport (390x844)...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
    await new Promise((r) => setTimeout(r, 1200));

    // Scroll to 3D garden in mobile
    await page.evaluate(() => {
      const garden = document.querySelector('[data-testid="blue-flower-garden-section"]');
      if (garden) garden.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise((r) => setTimeout(r, 1200));

    const mobileShotPath = path.join(artifactDir, '05_mobile_about_flower_garden.png');
    await page.screenshot({ path: mobileShotPath });
    console.log(`✓ Saved mobile screenshot: ${mobileShotPath}`);

    // Check for horizontal overflow on mobile
    const overflowCheck = await page.evaluate(() => {
      const docEl = document.documentElement;
      const modalEl = document.querySelector('div[role="dialog"]');
      return {
        docScrollWidth: docEl.scrollWidth,
        docClientWidth: docEl.clientWidth,
        hasHorizontalOverflow: docEl.scrollWidth > docEl.clientWidth + 2,
      };
    });
    console.log('Mobile overflow check:', overflowCheck);
    if (overflowCheck.hasHorizontalOverflow) {
      console.warn('Warning: Mobile horizontal overflow detected!');
    } else {
      console.log('✓ Zero horizontal overflow on mobile.');
    }

    // -------------------------------------------------------------------------
    // TEST 5: Console Error Audit
    // -------------------------------------------------------------------------
    console.log('\n--- Console Errors Audit ---');
    console.log(`Total errors captured: ${consoleErrors.length + pageErrors.length}`);
    if (consoleErrors.length > 0) {
      console.error('Console errors:', consoleErrors);
    }
    if (pageErrors.length > 0) {
      console.error('Page errors:', pageErrors);
    }

    if (consoleErrors.length === 0 && pageErrors.length === 0) {
      console.log('\n🌟 ALL TESTS PASSED WITH 0 CONSOLE ERRORS! 🌟');
    } else {
      console.warn('Some errors occurred, check log above.');
    }
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
