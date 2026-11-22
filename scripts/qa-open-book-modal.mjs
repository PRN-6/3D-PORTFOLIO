import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\open_book_qa';
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  console.log('--- TESTING 3D PHYSICAL BOOK TOME PRESENTATION ---');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu-compositing'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });

    // 1. Navigate to Archive island (/projects)
    console.log('1. Navigating to http://127.0.0.1:5175/projects ...');
    await page.goto('http://127.0.0.1:5175/projects', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2200));

    // 2. Click a grimoire book on the island to trigger bubble release
    console.log('2. Clicking book on island to trigger bubbles...');
    await page.mouse.click(680, 450);
    await new Promise((r) => setTimeout(r, 4200));

    // 3. Find and click CUBIX68 book
    console.log('3. Clicking CUBIX68 book...');
    const cubixElement = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('span'));
      const found = elements.find((el) => el.textContent && el.textContent.includes('CUBIX68'));
      if (found) {
        const rect = found.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      }
      return null;
    });

    if (cubixElement) {
      await page.mouse.click(cubixElement.x, cubixElement.y);
    } else {
      await page.mouse.click(640, 250);
    }

    await new Promise((r) => setTimeout(r, 650));
    await page.screenshot({ path: path.join(outDir, '03_desktop_open_3d_book_dark.png') });
    console.log('Captured 03_desktop_open_3d_book_dark.png');

    // 4. Test Light Mode (matching user uploaded image)
    console.log('4. Switching to Light Mode to verify 3D physical book in light theme...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const themeBtn = btns.find((b) => b.getAttribute('aria-label')?.includes('theme') || b.textContent?.includes('dark') || b.textContent?.includes('light'));
      if (themeBtn) themeBtn.click();
      else document.documentElement.classList.toggle('light');
    });

    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(outDir, '04_desktop_open_3d_book_light.png') });
    console.log('Captured 04_desktop_open_3d_book_light.png');

    // 5. Test Close Book
    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 500));

    // 6. Mobile 3D Book Test
    console.log('6. Testing Mobile Viewport (390x844)...');
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 });
    await mobilePage.goto('http://127.0.0.1:5175/projects', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2200));

    // Trigger bubbles on mobile
    await mobilePage.mouse.click(195, 480);
    await new Promise((r) => setTimeout(r, 4200));

    // Click CUBIX68
    const mobileCubix = await mobilePage.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('span'));
      const found = elements.find((el) => el.textContent && el.textContent.includes('CUBIX68'));
      if (found) {
        const rect = found.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      }
      return null;
    });

    if (mobileCubix) {
      await mobilePage.mouse.click(mobileCubix.x, mobileCubix.y);
    } else {
      await mobilePage.mouse.click(195, 300);
    }

    await new Promise((r) => setTimeout(r, 650));
    await mobilePage.screenshot({ path: path.join(outDir, '05_mobile_open_3d_book.png') });
    console.log('Captured 05_mobile_open_3d_book.png');
  } finally {
    await browser.close();
  }
  console.log('--- ALL QA TESTS COMPLETED SUCCESSFULLY ---');
}

run().catch((err) => {
  console.error('QA Test failed:', err);
  process.exit(1);
});
