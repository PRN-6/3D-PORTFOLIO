import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/minimal_nav_qa';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  console.log('=== SIMPLIFIED MINIMAL NAVIGATION BUTTONS QA TEST ===\n');

  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
    ],
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  console.log('1. Loading portfolio starting screen...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2500));

  // --- STEP 1: VERIFY STARTING SCREEN BUTTONS & REMOVAL OF UNNECESSARY ELEMENTS ---
  console.log('\n2. Verifying starting screen elements...');
  
  // A. Check that "CHOOSE YOUR DESTINATION" is gone
  const hasHeading = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('*')).some((el) =>
      el.textContent?.includes('CHOOSE YOUR DESTINATION')
    );
  });
  console.log(`- "CHOOSE YOUR DESTINATION" heading removed: ${!hasHeading} (Expected: true)`);

  // B. Check that category badges like "UPCOMING" and subtitles like "Sanctuary & Campfire" are gone
  const hasSubtitlesOrBadges = await page.evaluate(() => {
    const text = document.body.innerText;
    return (
      text.includes('Sanctuary & Campfire') ||
      text.includes('Arcane Grimoires') ||
      text.includes('Pending Delivery') ||
      text.includes('UPCOMING')
    );
  });
  console.log(`- Subtitles & badges removed: ${!hasSubtitlesOrBadges} (Expected: true)`);

  // C. Check that START ADVENTURE button is present
  const hasStartAdventure = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.some((b) => b.textContent?.includes('START ADVENTURE'));
  });
  console.log(`- START ADVENTURE button preserved: ${hasStartAdventure} (Expected: true)`);

  // D. Check the five navigation buttons
  const navButtons = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Main Navigation"]');
    if (!nav) return [];
    return Array.from(nav.querySelectorAll('button')).map((b) => ({
      text: b.textContent?.trim(),
      hasIcon: !!b.querySelector('svg'),
      height: b.getBoundingClientRect().height,
    }));
  });

  console.log(`- Navigation buttons found (${navButtons.length}):`);
  navButtons.forEach((b) => {
    console.log(`  • "${b.text}" (hasIcon: ${b.hasIcon}, height: ${b.height}px)`);
  });

  const expectedLabels = ['Home', 'Products', 'About Me', 'Projects', 'Contact'];
  const matchesExpected =
    navButtons.length === 5 &&
    expectedLabels.every((lbl, idx) => navButtons[idx]?.text === lbl);
  console.log(`- All 5 buttons match expected labels: ${matchesExpected} (Expected: true)`);

  const allSameHeight = navButtons.every((b) => b.height === navButtons[0]?.height);
  console.log(`- All 5 buttons have identical height: ${allSameHeight} (Expected: true)`);

  const hasNoIconsInNav = navButtons.every((b) => !b.hasIcon);
  console.log(`- No icons inside navigation buttons: ${hasNoIconsInNav} (Expected: true)`);

  await page.screenshot({ path: path.join(artifactDir, '01_minimal_starting_screen.png') });
  console.log('- Screenshot saved: 01_minimal_starting_screen.png');

  // --- STEP 2: TEST CONTACT BUTTON ---
  console.log('\n3. Testing Contact button...');
  await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Main Navigation"]');
    const contactBtn = Array.from(nav.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Contact')
    );
    contactBtn?.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  const contactModalVisible = await page.evaluate(() => {
    const modal = document.querySelector('[role="dialog"][aria-labelledby="contact-modal-title"]');
    return !!modal;
  });
  console.log(`- Contact Modal Opened: ${contactModalVisible} (Expected: true)`);

  await page.screenshot({ path: path.join(artifactDir, '02_contact_modal_open.png') });
  console.log('- Screenshot saved: 02_contact_modal_open.png');

  // Close Contact Modal
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 500));

  // --- STEP 3: TEST PRODUCTS BUTTON ---
  console.log('\n4. Testing Products button (Product Showcase)...');
  await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Main Navigation"]');
    const btn = Array.from(nav.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Products')
    );
    btn?.click();
  });
  // Wait for 2.4s downward transition to complete into PROJECT_WORLD
  await new Promise((r) => setTimeout(r, 3400));
  await page.waitForSelector('nav[aria-label="Main Navigation"]', { timeout: 5000 });

  await page.screenshot({ path: path.join(artifactDir, '03_products_showcase.png') });
  console.log('- Screenshot saved: 03_products_showcase.png');

  // Return to Home via Home nav button
  console.log('\n5. Returning to Home via Home button...');
  await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Main Navigation"]');
    const btn = Array.from(nav.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Home')
    );
    btn?.click();
  });
  // Wait for 2.4s upward transition to complete into HOME_IDLE
  await new Promise((r) => setTimeout(r, 3400));
  await page.waitForSelector('nav[aria-label="Main Navigation"]', { timeout: 5000 });

  // --- STEP 4: TEST ABOUT ME BUTTON ---
  console.log('\n6. Testing About Me button (Whispering Forest)...');
  await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Main Navigation"]');
    const btn = Array.from(nav.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('About Me')
    );
    btn?.click();
  });
  // Wait for 1.8s disassemble + 0.25s pause + 2.2s reassemble = 4.25s
  await new Promise((r) => setTimeout(r, 4800));
  await page.waitForSelector('nav[aria-label="Main Navigation"]', { timeout: 5000 });

  await page.screenshot({ path: path.join(artifactDir, '04_about_me_forest.png') });
  console.log('- Screenshot saved: 04_about_me_forest.png');

  // --- STEP 5: TEST PROJECTS BUTTON ---
  console.log('\n7. Testing Projects button (Rune Creation Workshop)...');
  await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Main Navigation"]');
    const btn = Array.from(nav.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Projects')
    );
    btn?.click();
  });
  await new Promise((r) => setTimeout(r, 4800));
  await page.waitForSelector('nav[aria-label="Main Navigation"]', { timeout: 5000 });

  await page.screenshot({ path: path.join(artifactDir, '05_projects_workshop.png') });
  console.log('- Screenshot saved: 05_projects_workshop.png');

  // --- STEP 6: TEST RETURNING HOME ---
  console.log('\n8. Returning to Hero\'s Home...');
  await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Main Navigation"]');
    const btn = Array.from(nav.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Home')
    );
    btn?.click();
  });
  await new Promise((r) => setTimeout(r, 4800));
  await page.waitForSelector('nav[aria-label="Main Navigation"]', { timeout: 5000 });

  // --- STEP 7: TEST RESPONSIVE MOBILE VIEWPORT ---
  console.log('\n9. Testing mobile viewport (375x667 iPhone SE)...');
  await page.setViewport({ width: 375, height: 667, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 1000));

  const mobileOverflow = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Main Navigation"]');
    return {
      scrollWidth: document.body.scrollWidth,
      clientWidth: document.body.clientWidth,
      navWidth: nav ? nav.getBoundingClientRect().width : 0,
    };
  });
  console.log(`- Mobile viewport: body scrollWidth = ${mobileOverflow.scrollWidth}, clientWidth = ${mobileOverflow.clientWidth}`);
  console.log(`- Horizontal overflow absent: ${mobileOverflow.scrollWidth <= mobileOverflow.clientWidth} (Expected: true)`);

  await page.screenshot({ path: path.join(artifactDir, '06_mobile_starting_screen.png') });
  console.log('- Screenshot saved: 06_mobile_starting_screen.png');

  await browser.close();

  const success =
    !hasHeading &&
    !hasSubtitlesOrBadges &&
    hasStartAdventure &&
    matchesExpected &&
    allSameHeight &&
    hasNoIconsInNav &&
    contactModalVisible &&
    consoleErrors.length === 0;

  console.log('\n======================================================');
  console.log(`OVERALL TEST STATUS: ${success ? 'PASSED 100% PERFECTLY' : 'FAILED'}`);
  console.log('======================================================');

  if (!success) {
    console.error('Console errors:', consoleErrors);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
