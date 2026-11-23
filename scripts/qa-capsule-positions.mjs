import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\capsule_layout_qa';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to http://127.0.0.1:5175/ ...');
  await page.goto('http://127.0.0.1:5175/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Take screenshot of Home page light mode (default)
  await page.screenshot({ path: path.join(outDir, '01_home_light_capsules.png') });
  console.log('Captured 01_home_light_capsules.png');

  // Inspect elements
  const positions = await page.evaluate(() => {
    const music = document.querySelector('[data-testid="music-controls"]')?.getBoundingClientRect();
    const nav = document.querySelector('[data-testid="top-center-navigation"]')?.getBoundingClientRect();
    const brand = document.querySelector('[data-flip-id="brand-prn"]')?.getBoundingClientRect();
    const copyright = document.querySelector('[data-testid="footer-copyright-counter"]')?.getBoundingClientRect();
    return {
      window: { width: window.innerWidth, height: window.innerHeight },
      music: music ? { top: music.top, bottom: music.bottom, left: music.left, right: music.right, width: music.width, height: music.height } : null,
      nav: nav ? { top: nav.top, bottom: nav.bottom, left: nav.left, right: nav.right, width: nav.width, height: nav.height } : null,
      brand: brand ? { top: brand.top, left: brand.left, width: brand.width, height: brand.height } : null,
      copyright: copyright ? { bottom: copyright.bottom, right: copyright.right } : null,
    };
  });
  console.log('Element positions on desktop (1440x900):', JSON.stringify(positions, null, 2));

  // Navigate to /projects
  console.log('Clicking projects navigation link...');
  const navProjectsLink = await page.$('a[href="/projects"]');
  if (navProjectsLink) {
    await navProjectsLink.click();
  } else {
    await page.goto('http://127.0.0.1:5175/projects', { waitUntil: 'networkidle2' });
  }
  await new Promise(r => setTimeout(r, 2600));

  await page.screenshot({ path: path.join(outDir, '02_projects_light_capsules.png') });
  console.log('Captured 02_projects_light_capsules.png');

  // Toggle dark mode
  const themeToggle = await page.$('[aria-label*="theme" i], [data-testid="theme-toggle"], button[title*="theme" i], button[aria-label*="mode" i]');
  if (themeToggle) {
    await themeToggle.click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outDir, '03_projects_dark_capsules.png') });
    console.log('Captured 03_projects_dark_capsules.png');
  }

  // Mobile viewport test (390x844)
  await page.setViewport({ width: 390, height: 844 });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, '04_mobile_projects_capsules.png') });
  console.log('Captured 04_mobile_projects_capsules.png');

  await browser.close();
  console.log('Done QA run!');
}

run().catch(err => {
  console.error('QA Error:', err);
  process.exit(1);
});
