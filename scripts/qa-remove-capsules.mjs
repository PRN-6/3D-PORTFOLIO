import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\remove_capsules_qa';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function testRemoval() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to http://127.0.0.1:5175/ ...');
  await page.goto('http://127.0.0.1:5175/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // 1. Home Island
  await page.screenshot({ path: path.join(outDir, '01_home_screen.png') });
  console.log('Captured 01_home_screen.png');

  // 2. Click Projects link
  console.log('Clicking projects link...');
  const projectsLink = await page.$('a[href="/projects"]');
  if (projectsLink) {
    await projectsLink.click();
  } else {
    await page.goto('http://127.0.0.1:5175/projects', { waitUntil: 'networkidle2' });
  }

  // Wait for bubble transition to complete (bubble sweeps over, tears open, reveals Archive Island)
  await new Promise(r => setTimeout(r, 2500));

  // Verify that MetaballGridMorph container does not exist
  const hasMetaballGrid = await page.evaluate(() => {
    return !!document.querySelector('[name="MetaballGridMorphContainer"]') ||
           !!document.querySelector('[data-testid="metaball-column"]');
  });
  console.log('Is 5-column MetaballGridMorph present?:', hasMetaballGrid);

  // Capture projects page screenshot
  await page.screenshot({ path: path.join(outDir, '02_projects_archive_island.png') });
  console.log('Captured 02_projects_archive_island.png');

  // 3. Click Home link
  console.log('Clicking home link...');
  const homeLink = await page.$('a[href="/"]');
  if (homeLink) {
    await homeLink.click();
    await new Promise(r => setTimeout(r, 2500));
    await page.screenshot({ path: path.join(outDir, '03_home_after_transition.png') });
    console.log('Captured 03_home_after_transition.png');
  }

  await browser.close();
  console.log('Done removal QA!');
}

testRemoval().catch(err => {
  console.error('QA Error:', err);
  process.exit(1);
});
