import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\projects_bg_name_qa';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to http://127.0.0.1:5175/projects ...');
  await page.goto('http://127.0.0.1:5175/projects', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));

  // Check background title visibility
  const titleInfo = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="cinematic-prinson-title"]');
    const upperText = document.querySelector('[data-testid="prinson-text"]');
    const lowerText = document.querySelector('[data-testid="royal-text"]');
    const wrapper = el?.querySelector('div[class*="transition-opacity"]');
    return {
      titleExists: !!el,
      wrapperClasses: wrapper?.className,
      wrapperOpacity: wrapper ? window.getComputedStyle(wrapper).opacity : null,
      upperText: upperText?.textContent?.trim()?.slice(0, 50),
      lowerText: lowerText?.textContent?.trim()?.slice(0, 50),
    };
  });
  console.log('Projects background title state:', JSON.stringify(titleInfo, null, 2));

  // Capture light mode on projects page
  await page.screenshot({ path: path.join(outDir, '01_projects_light_with_bg_name.png') });
  console.log('Captured 01_projects_light_with_bg_name.png');

  // Toggle dark mode
  const themeToggle = await page.$('[aria-label*="theme" i], button[title*="theme" i], button[aria-label*="mode" i]');
  if (themeToggle) {
    await themeToggle.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(outDir, '02_projects_dark_with_bg_name.png') });
    console.log('Captured 02_projects_dark_with_bg_name.png');
  }

  // Mobile test
  await page.setViewport({ width: 390, height: 844 });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(outDir, '03_projects_mobile_with_bg_name.png') });
  console.log('Captured 03_projects_mobile_with_bg_name.png');

  await browser.close();
  console.log('Done QA run!');
}

run().catch(err => {
  console.error('QA Error:', err);
  process.exit(1);
});
