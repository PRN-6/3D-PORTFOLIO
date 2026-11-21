import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\qa_master_fix';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function captureModals() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5175/about', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(2000);

  // Switch to Light Mode first
  const themeToggle = await page.waitForSelector('button[data-testid="theme-toggle"]');
  await themeToggle.click();
  await sleep(1000);

  // Click "Biography Pedestal" button on bottom toolbar
  console.log('Clicking Biography Pedestal in Light Mode...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const bioBtn = btns.find((b) => b.textContent?.includes('Biography Pedestal'));
    if (bioBtn) bioBtn.click();
  });
  await sleep(1500);
  await page.screenshot({ path: path.join(outDir, '15_biography_modal_light_opened.png') });

  // Dismiss modal
  await page.keyboard.press('Escape');
  await sleep(600);

  // Open Grimoire or Project detail if on archive
  console.log('Navigating to /projects (Archive island)...');
  await page.evaluate(() => {
    const link = Array.from(document.querySelectorAll('a')).find((a) => a.getAttribute('aria-label') === 'projects');
    if (link) link.click();
  });
  await sleep(2500);

  // In Archive island, click Grimoire 1
  console.log('Clicking Grimoire 1 in Archive island...');
  await page.evaluate(() => {
    // Open scroll modal via pedestal if available
    const pedestal = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes('Biography') || b.textContent?.includes('Scroll'));
    if (pedestal) pedestal.click();
  });
  await sleep(1000);

  await browser.close();
  console.log('Done capturing modal snapshots!');
}

captureModals().catch(console.error);

