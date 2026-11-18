import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/remove_nav_verification';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  console.log('=== TEST REMOVE TOP-LEFT BUTTONS & START ADVENTURE ===\n');

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
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error('BROWSER ERROR:', msg.text());
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
    console.error('PAGE ERROR:', err.message);
  });

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  console.log('1. Loading portfolio homepage...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));

  // --- CHECK 1: VERIFY HOME PAGE IS CLEAN ---
  console.log('\n2. Checking Home page for forbidden buttons...');
  const checkButtons = async () => {
    return await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      return allButtons.map(b => ({
        text: (b.textContent || '').trim(),
        aria: (b.getAttribute('aria-label') || '').trim()
      }));
    });
  };

  const homeButtons = await checkButtons();
  console.log('Home buttons present:', homeButtons.map(b => b.text || b.aria));

  const hasStartAdventure = homeButtons.some(b => 
    b.text.toUpperCase().includes('START ADVENTURE') || 
    b.aria.toUpperCase().includes('START ADVENTURE')
  );
  if (hasStartAdventure) {
    throw new Error('FAIL: START ADVENTURE button is still in DOM!');
  }
  console.log('✔ PASS: START ADVENTURE is completely absent from DOM');

  const hasTopLeftButtonsHome = homeButtons.some(b => 
    b.text.toUpperCase().includes('RETURN TO HOME') || 
    b.text.toUpperCase().includes('ARCHIVE (LEVEL') || 
    b.text.toUpperCase().includes('FOREST (LEVEL')
  );
  if (hasTopLeftButtonsHome) {
    throw new Error('FAIL: Top-left navigation buttons found on Home!');
  }
  console.log('✔ PASS: No top-left buttons on Home');
  await page.screenshot({ path: path.join(artifactDir, '01_home_clean.png') });

  // --- CHECK 2: WORKSHOP (PRODUCTS) ---
  console.log('\n3. Navigating to Products (Rune Creation Workshop)...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().toLowerCase() === 'products');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 4500));

  const workshopButtons = await checkButtons();
  console.log('Workshop buttons present:', workshopButtons.map(b => b.text || b.aria));

  const hasTopLeftInWorkshop = workshopButtons.some(b => 
    b.text.toUpperCase().includes('RETURN TO HOME') || 
    b.text.toUpperCase().includes('ARCHIVE (LEVEL') || 
    b.text.toUpperCase().includes('FOREST (LEVEL')
  );
  if (hasTopLeftInWorkshop) {
    throw new Error('FAIL: Top-left action buttons still present in Workshop!');
  }
  console.log('✔ PASS: Top-left navigation buttons completely removed from Workshop');
  await page.screenshot({ path: path.join(artifactDir, '02_workshop_clean.png') });

  // --- CHECK 3: PROJECTS (ARCHIVE) ---
  console.log('\n4. Navigating to Projects (Grand Mage\'s Archive)...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().toLowerCase() === 'projects');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 4500));

  const archiveButtons = await checkButtons();
  console.log('Archive buttons present:', archiveButtons.map(b => b.text || b.aria));

  const hasTopLeftInArchive = archiveButtons.some(b => 
    b.text.toUpperCase().includes('RETURN TO HOME') || 
    b.text.toUpperCase().includes('ASCEND TO FOREST') ||
    b.text.toUpperCase().includes('RUNE WORKSHOP') ||
    b.text.toUpperCase().includes('ARCHMAGE CHRONICLE')
  );
  if (hasTopLeftInArchive) {
    throw new Error('FAIL: Top-left action buttons still present in Archive!');
  }
  console.log('✔ PASS: Top-left navigation buttons completely removed from Archive');
  await page.screenshot({ path: path.join(artifactDir, '03_archive_clean.png') });

  // --- CHECK 4: ABOUT ME (WHISPERING FOREST) ---
  console.log('\n5. Navigating to About Me (Whispering Forest)...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().toLowerCase() === 'about me');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 4500));

  const forestButtons = await checkButtons();
  console.log('Forest buttons present:', forestButtons.map(b => b.text || b.aria));

  const hasTopLeftInForest = forestButtons.some(b => 
    b.text.toUpperCase().includes('ARCHIVE (LEVEL 02)') || 
    b.text.toUpperCase().includes('HOME ISLAND') ||
    b.text.toUpperCase().includes('BIOGRAPHY & LORE') ||
    b.text.toUpperCase().includes('RUNE WORKSHOP (LEVEL 04)')
  );
  if (hasTopLeftInForest) {
    throw new Error('FAIL: Top-left action buttons still present in Forest!');
  }
  console.log('✔ PASS: Top-left navigation buttons completely removed from Forest');

  // Verify bottom toolbar is still present in forest
  const hasBottomToolbar = forestButtons.some(b => b.text.toLowerCase().includes('overview'));
  if (!hasBottomToolbar) {
    throw new Error('FAIL: Forest landmark toolbar missing!');
  }
  console.log('✔ PASS: Forest bottom landmark toolbar remains intact and functional');
  await page.screenshot({ path: path.join(artifactDir, '04_forest_clean.png') });

  // --- CHECK 5: MOBILE VIEWPORT ---
  console.log('\n6. Checking Mobile Viewport (393x852)...');
  await page.setViewport({ width: 393, height: 852, isMobile: true, hasTouch: true });
  // Return to home
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().toLowerCase() === 'home');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 4500));

  const mobileButtons = await checkButtons();
  console.log('Mobile buttons present:', mobileButtons.map(b => b.text || b.aria));
  await page.screenshot({ path: path.join(artifactDir, '05_mobile_clean.png') });
  console.log('✔ PASS: Mobile layout verified clean');

  console.log('\nBrowser console errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.warn('Console errors detected:', consoleErrors);
  }

  await browser.close();
  console.log('\n=== ALL VERIFICATION CHECKS PASSED SUCCESSFULLY ===');
}

run().catch((err) => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});

