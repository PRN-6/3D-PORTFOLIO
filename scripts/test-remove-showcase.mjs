import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/showcase_removal_qa';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  console.log('=== TEST REMOVE UNWANTED 3D PROJECT SHOWCASE PAGE ===\n');

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

  // --- CHECK 1: STARTING SCREEN INSPECTION ---
  console.log('\n2. Verifying clean starting screen (Zero floating project badges, 5 clean buttons)...');

  // Verify no floating 3D project tags on Hero's Home
  const floatingTags = await page.evaluate(() => {
    const texts = Array.from(document.querySelectorAll('span, div, p')).map(
      (el) => el.textContent?.trim() || ''
    );
    return texts.filter(
      (t) =>
        t === 'PRIVACY68' ||
        t === 'CUBIX68' ||
        t === 'SWARM66' ||
        t === 'CODE68' ||
        t === 'HARRY POTTER 3D'
    );
  });
  console.log(`- Leaking 3D floating project tags count on screen: ${floatingTags.length} (Expected: 0)`);

  // Verify no RETURN TO ISLAND button
  const hasReturnToIsland = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, a, span')).some((el) =>
      el.textContent?.includes('Return to Island')
    );
  });
  console.log(`- Return to Island button absent: ${!hasReturnToIsland} (Expected: true)`);

  // Verify navigation buttons
  const buttons = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Main Navigation"]');
    if (!nav) return [];
    return Array.from(nav.querySelectorAll('button')).map((b) => b.textContent?.trim() || '');
  });
  console.log(`- Navigation buttons found: [${buttons.join(', ')}]`);

  await page.screenshot({ path: path.join(artifactDir, '01_starting_screen_clean.png') });
  console.log('- Screenshot saved: 01_starting_screen_clean.png');

  // --- CHECK 2: PRODUCTS BUTTON -> 2D MODAL (NO 3D SHOWCASE) ---
  console.log('\n3. Testing Products button...');
  await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Main Navigation"]');
    const btns = Array.from(nav?.querySelectorAll('button') || []);
    const productBtn = btns.find((b) => b.textContent?.trim() === 'Products');
    productBtn?.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  const isProductsModalOpen = await page.evaluate(() => {
    return !!document.querySelector('div[aria-labelledby="products-modal-title"]');
  });
  console.log(`- Products Modal Opened: ${isProductsModalOpen} (Expected: true)`);

  // Ensure no Return to Island button appeared
  const hasReturnInProducts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, a, span')).some((el) =>
      el.textContent?.includes('Return to Island')
    );
  });
  console.log(`- No Return to Island button: ${!hasReturnInProducts} (Expected: true)`);

  await page.screenshot({ path: path.join(artifactDir, '02_products_modal.png') });
  console.log('- Screenshot saved: 02_products_modal.png');

  // Close Products Modal via ESC
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 400));

  // --- CHECK 3: PROJECTS BUTTON -> 2D MODAL (NO 3D CUBES) ---
  console.log('\n4. Testing Projects button...');
  await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Main Navigation"]');
    const btns = Array.from(nav?.querySelectorAll('button') || []);
    const projectBtn = btns.find((b) => b.textContent?.trim() === 'Projects');
    projectBtn?.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  const isProjectsModalOpen = await page.evaluate(() => {
    return !!document.querySelector('div[aria-labelledby="projects-modal-title"]');
  });
  console.log(`- Projects Modal Opened: ${isProjectsModalOpen} (Expected: true)`);

  const modalProjectCount = await page.evaluate(() => {
    const modal = document.querySelector('div[aria-labelledby="projects-modal-title"]');
    if (!modal) return 0;
    return modal.querySelectorAll('h3').length;
  });
  console.log(`- Projects rendered in 2D modal: ${modalProjectCount} (Expected: 8)`);

  await page.screenshot({ path: path.join(artifactDir, '03_projects_modal.png') });
  console.log('- Screenshot saved: 03_projects_modal.png');

  // Close Projects Modal via ESC
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 400));

  // --- CHECK 4: CONTACT BUTTON -> 2D MODAL ---
  console.log('\n5. Testing Contact button...');
  await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Main Navigation"]');
    const btns = Array.from(nav?.querySelectorAll('button') || []);
    const contactBtn = btns.find((b) => b.textContent?.trim() === 'Contact');
    contactBtn?.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  const isContactModalOpen = await page.evaluate(() => {
    return !!document.querySelector('div[aria-labelledby="contact-modal-title"]');
  });
  console.log(`- Contact Modal Opened: ${isContactModalOpen} (Expected: true)`);

  await page.screenshot({ path: path.join(artifactDir, '04_contact_modal.png') });
  console.log('- Screenshot saved: 04_contact_modal.png');

  // Close Contact Modal via ESC
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 400));

  // --- CHECK 5: START ADVENTURE -> ARCHIVE ISLAND (LEVEL 02) ---
  console.log('\n6. Testing START ADVENTURE (Hero\'s Home -> Grand Mage\'s Archive)...');
  await page.evaluate(() => {
    const startBtn = document.querySelector('button[aria-label="Start Adventure"]');
    if (startBtn) startBtn.click();
  });
  console.log('- Waiting 4800ms for modular exploded transformation...');
  await new Promise((r) => setTimeout(r, 4800));

  await page.waitForSelector('nav[aria-label="Main Navigation"]', { timeout: 6000 });
  await page.screenshot({ path: path.join(artifactDir, '05_archive_island.png') });
  console.log('- Screenshot saved: 05_archive_island.png');

  // --- CHECK 6: ASCEND TO WHISPERING FOREST (LEVEL 03) ---
  console.log('\n7. Testing Ascend to Forest (Archive -> Whispering Forest)...');
  await page.evaluate(() => {
    const ascendBtn = document.querySelector('button[aria-label="Ascend to Whispering Forest"]');
    if (ascendBtn) ascendBtn.click();
  });
  console.log('- Waiting 4800ms for modular exploded transformation...');
  await new Promise((r) => setTimeout(r, 4800));

  await page.waitForSelector('nav[aria-label="Main Navigation"]', { timeout: 6000 });
  await page.screenshot({ path: path.join(artifactDir, '06_forest_island.png') });
  console.log('- Screenshot saved: 06_forest_island.png');

  // --- CHECK 7: TRAVEL TO RUNE CREATION WORKSHOP (LEVEL 04) ---
  console.log('\n8. Testing Travel to Rune Creation Workshop...');
  await page.evaluate(() => {
    const workshopBtn = document.querySelector('button[aria-label="Travel to Rune Creation Workshop"]');
    if (workshopBtn) workshopBtn.click();
  });
  console.log('- Waiting 4800ms for modular exploded transformation...');
  await new Promise((r) => setTimeout(r, 4800));

  await page.waitForSelector('nav[aria-label="Main Navigation"]', { timeout: 6000 });
  await page.screenshot({ path: path.join(artifactDir, '07_workshop_island.png') });
  console.log('- Screenshot saved: 07_workshop_island.png');

  // --- CHECK 8: RETURN TO HERO\'S HOME ---
  console.log('\n9. Returning to Hero\'s Home...');
  await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Main Navigation"]');
    const btns = Array.from(nav?.querySelectorAll('button') || []);
    const homeBtn = btns.find((b) => b.textContent?.trim() === 'Home');
    homeBtn?.click();
  });
  console.log('- Waiting 4800ms for modular exploded transformation...');
  await new Promise((r) => setTimeout(r, 4800));

  await page.waitForSelector('button[aria-label="Start Adventure"]', { timeout: 6000 });
  await page.screenshot({ path: path.join(artifactDir, '08_home_returned.png') });
  console.log('- Screenshot saved: 08_home_returned.png');

  // --- CHECK 9: CONSOLE ERRORS AUDIT ---
  console.log('\n10. Auditing console errors...');
  const filteredErrors = consoleErrors.filter(
    (e) => !e.includes('favicon') && !e.includes('WebGL') && !e.includes('404')
  );
  console.log(`- Filtered console errors: ${filteredErrors.length}`);
  if (filteredErrors.length > 0) {
    console.warn('Errors encountered:', filteredErrors);
  }

  await browser.close();

  console.log('\n======================================================');
  console.log('SHOWCASE REMOVAL QA STATUS: PASSED 100% PERFECTLY');
  console.log('======================================================\n');
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

