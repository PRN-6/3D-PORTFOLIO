import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/remove_start_adventure_qa';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  console.log('=== TEST START ADVENTURE BUTTON REMOVAL ===\n');

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
  console.log('1. Loading portfolio starting screen...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1500));

  // --- CHECK 1: VERIFY START ADVENTURE IS GONE ---
  console.log('\n2. Checking for any START ADVENTURE button in DOM...');
  const startAdventureFound = await page.evaluate(() => {
    const allButtons = Array.from(document.querySelectorAll('button'));
    const startBtn = allButtons.find((b) => {
      const text = (b.textContent || '').toUpperCase();
      const label = (b.getAttribute('aria-label') || '').toUpperCase();
      return text.includes('START ADVENTURE') || label.includes('START ADVENTURE');
    });
    return !!startBtn;
  });

  console.log(`START ADVENTURE button present in DOM: ${startAdventureFound}`);
  if (startAdventureFound) {
    throw new Error('FAIL: START ADVENTURE button was found in the DOM, but should have been removed!');
  } else {
    console.log('PASS: START ADVENTURE button has been completely removed!');
  }

  // --- CHECK 2: VERIFY 5 MINIMAL BUTTONS ---
  console.log('\n3. Verifying 5 minimal navigation buttons...');
  const navButtons = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Main Navigation"]');
    if (!nav) return [];
    return Array.from(nav.querySelectorAll('button')).map((b) => ({
      text: b.textContent.trim(),
      isActive: b.getAttribute('aria-current') === 'page' || b.className.includes('bg-white/15'),
    }));
  });

  console.log('Detected Navigation Buttons:', navButtons);
  if (navButtons.length !== 5) {
    throw new Error(`Expected exactly 5 navigation buttons, found ${navButtons.length}`);
  }

  const expected = ['Home', 'Products', 'About Me', 'Projects', 'Contact'];
  expected.forEach((label, idx) => {
    if (navButtons[idx].text !== label) {
      throw new Error(`Expected button ${idx} to be "${label}", got "${navButtons[idx].text}"`);
    }
  });

  // Capture screenshot of the starting screen
  const screenshotPath = path.join(artifactDir, '01_home_screen_no_start_adventure.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`Saved screenshot: ${screenshotPath}`);

  // Test mobile viewport
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 400));
  const mobileScreenshotPath = path.join(artifactDir, '02_mobile_screen_no_start_adventure.png');
  await page.screenshot({ path: mobileScreenshotPath });
  console.log(`Saved mobile screenshot: ${mobileScreenshotPath}`);

  // Check console errors
  console.log('\n4. Checking console errors...');
  if (consoleErrors.length > 0) {
    console.warn(`WARNING: Encountered ${consoleErrors.length} errors:`, consoleErrors);
  } else {
    console.log('ZERO console errors detected.');
  }

  console.log('\n=== ALL VERIFICATIONS PASSED SUCCESSFULLY! ===');
  await browser.close();
}

run().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});

