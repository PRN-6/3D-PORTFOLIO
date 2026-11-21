import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\qa_master_fix';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runQAVerification() {
  console.log('--- STARTING MASTER FIX QA VERIFICATION ---');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=default',
    ],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  const consoleErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon')) {
        console.error('Browser console error:', text);
        consoleErrors.push(text);
      }
    }
  });

  page.on('pageerror', (err) => {
    console.error('Browser unhandled pageerror:', err.message);
    consoleErrors.push(err.message);
  });

  // Helper to click nav item
  const clickNav = async (label) => {
    await page.evaluate((lbl) => {
      const link = Array.from(document.querySelectorAll('a')).find(
        (a) => a.getAttribute('aria-label')?.toLowerCase() === lbl.toLowerCase() ||
               a.textContent?.toLowerCase().trim() === lbl.toLowerCase()
      );
      if (link) link.click();
    }, label);
    await sleep(1000);
  };

  // 1. Visit Desktop Home in Dark Mode
  console.log('1. Testing Desktop Home (Dark Mode)...');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:5175/', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(2500);
  await page.screenshot({ path: path.join(outDir, '01_desktop_home_dark.png') });

  // 2. Open Products Modal (Dark)
  console.log('2. Testing Products Modal (Dark Mode)...');
  await clickNav('products');
  await page.screenshot({ path: path.join(outDir, '02_desktop_products_dark.png') });
  await page.keyboard.press('Escape');
  await sleep(500);

  // 3. Open Projects Modal (Dark)
  console.log('3. Testing Projects Modal (Dark Mode)...');
  await clickNav('projects');
  await page.screenshot({ path: path.join(outDir, '03_desktop_projects_dark.png') });
  await page.keyboard.press('Escape');
  await sleep(500);

  // 4. Switch to Light Mode
  console.log('4. Switching to Light Mode...');
  const themeToggle = await page.waitForSelector('button[data-testid="theme-toggle"]', { timeout: 5000 });
  await themeToggle.click();
  await sleep(1000);
  await page.screenshot({ path: path.join(outDir, '04_desktop_home_light.png') });

  // 5. Open Products Modal in Light Mode
  console.log('5. Testing Products Modal (Light Mode)...');
  await clickNav('products');
  await page.screenshot({ path: path.join(outDir, '05_desktop_products_light.png') });
  await page.keyboard.press('Escape');
  await sleep(500);

  // 6. Open Projects Modal in Light Mode
  console.log('6. Testing Projects Modal (Light Mode)...');
  await clickNav('projects');
  await page.screenshot({ path: path.join(outDir, '06_desktop_projects_light.png') });
  await page.keyboard.press('Escape');
  await sleep(500);

  // 7. Open Contact Modal in Light Mode
  console.log('7. Testing Contact Modal (Light Mode)...');
  await clickNav('contact');
  await page.screenshot({ path: path.join(outDir, '07_desktop_contact_light.png') });
  await page.keyboard.press('Escape');
  await sleep(500);

  // 8. Open Fun Modal in Light Mode
  console.log('8. Testing Fun Modal (Light Mode)...');
  await clickNav('fun');
  await page.screenshot({ path: path.join(outDir, '08_desktop_fun_light.png') });
  await page.keyboard.press('Escape');
  await sleep(500);

  // 9. Navigate to About Me (/about) in Light Mode
  console.log('9. Testing About Me / Blue Flower Garden in Light Mode...');
  await clickNav('about me');
  await sleep(2500);
  await page.screenshot({ path: path.join(outDir, '09_desktop_about_light.png') });

  // 10. Open Biography Scroll Modal with BlueFlowerGardenShowcase in Light Mode
  console.log('10. Testing Biography Scroll Modal & 2D Showcase in Light Mode...');
  await page.evaluate(() => {
    const bioBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.toLowerCase().includes('biography')
    );
    if (bioBtn) bioBtn.click();
  });
  await sleep(1500);
  await page.screenshot({ path: path.join(outDir, '10_desktop_biography_modal_light.png') });
  await page.keyboard.press('Escape');
  await sleep(500);

  // 11. Switch back to Dark Mode on About Me
  console.log('11. Testing About Me in Dark Mode...');
  const themeToggleDark = await page.waitForSelector('button[data-testid="theme-toggle"]');
  await themeToggleDark.click();
  await sleep(1500);
  await page.screenshot({ path: path.join(outDir, '11_desktop_about_dark.png') });

  // 12. Open Biography Scroll Modal with BlueFlowerGardenShowcase in Dark Mode
  console.log('12. Testing Biography Scroll Modal & 2D Showcase in Dark Mode...');
  await page.evaluate(() => {
    const bioBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.toLowerCase().includes('biography')
    );
    if (bioBtn) bioBtn.click();
  });
  await sleep(1500);
  await page.screenshot({ path: path.join(outDir, '12_desktop_biography_modal_dark.png') });
  await page.keyboard.press('Escape');
  await sleep(500);

  // 13. Mobile Viewport Testing (390 x 844)
  console.log('13. Testing Mobile Viewport (390 x 844)...');
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:5175/', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(2000);
  await page.screenshot({ path: path.join(outDir, '13_mobile_home_dark.png') });

  // Mobile Light Mode
  console.log('14. Testing Mobile Light Mode...');
  const mobileThemeToggle = await page.waitForSelector('button[data-testid="theme-toggle-mobile"]');
  await mobileThemeToggle.click();
  await sleep(1000);
  await page.screenshot({ path: path.join(outDir, '14_mobile_home_light.png') });

  await browser.close();

  console.log('--- MASTER FIX QA VERIFICATION COMPLETE ---');
  console.log(`Console Errors Caught: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('List of console errors:');
    consoleErrors.forEach((e, idx) => console.error(`${idx + 1}: ${e}`));
  }
}

runQAVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
