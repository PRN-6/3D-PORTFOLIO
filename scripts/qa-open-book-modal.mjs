import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\open_book_qa';
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  console.log('--- TESTING BOOK OPENING ANIMATION & THEMED GRIMOIRE MODAL ---');
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

    // Wait for bubbles to release and pop into the 6 books
    await new Promise((r) => setTimeout(r, 4200));
    await page.screenshot({ path: path.join(outDir, '01_desktop_6_books_popped.png') });
    console.log('Captured 01_desktop_6_books_popped.png');

    // 3. Find and click CUBIX68 pill/badge
    console.log('3. Finding and clicking CUBIX68 book...');
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
      console.log(`Clicking CUBIX68 badge at (${cubixElement.x}, ${cubixElement.y})...`);
      await page.mouse.click(cubixElement.x, cubixElement.y);
    } else {
      console.log('Badge not found by text query, clicking coordinates near top-middle...');
      await page.mouse.click(640, 250);
    }

    // Capture midway book zoom and opening
    await new Promise((r) => setTimeout(r, 180));
    await page.screenshot({ path: path.join(outDir, '02_desktop_book_zooming_open.png') });
    console.log('Captured 02_desktop_book_zooming_open.png');

    // Capture full-screen open grimoire modal
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outDir, '03_desktop_open_grimoire_modal.png') });
    console.log('Captured 03_desktop_open_grimoire_modal.png');

    // 4. Test Closing Book and Returning to 6-book Constellation
    console.log('4. Pressing Escape or clicking return button to close book...');
    await page.keyboard.press('Escape');

    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: path.join(outDir, '04_desktop_returned_to_6_books.png') });
    console.log('Captured 04_desktop_returned_to_6_books.png');

    // =========================================================================
    // MOBILE VIEWPORT TEST (390 x 844 iPhone)
    // =========================================================================
    console.log('5. Testing Mobile Viewport (390x844)...');
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 });

    await mobilePage.goto('http://127.0.0.1:5175/projects', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2200));

    // Click book on mobile island (centered)
    await mobilePage.mouse.click(195, 480);
    await new Promise((r) => setTimeout(r, 4200));

    await mobilePage.screenshot({ path: path.join(outDir, '05_mobile_6_books_popped.png') });
    console.log('Captured 05_mobile_6_books_popped.png');

    // Click CUBIX68 on mobile
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
      console.log(`Clicking mobile CUBIX68 at (${mobileCubix.x}, ${mobileCubix.y})...`);
      await mobilePage.mouse.click(mobileCubix.x, mobileCubix.y);
    } else {
      console.log('Clicking near upper area on mobile...');
      await mobilePage.mouse.click(195, 300);
    }

    await new Promise((r) => setTimeout(r, 650));
    await mobilePage.screenshot({ path: path.join(outDir, '06_mobile_open_grimoire_lore.png') });
    console.log('Captured 06_mobile_open_grimoire_lore.png');

    // Click tab 2: Spells & Actions
    await mobilePage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const tab2 = btns.find((b) => b.textContent && b.textContent.includes('Page II'));
      if (tab2) tab2.click();
    });

    await new Promise((r) => setTimeout(r, 300));
    await mobilePage.screenshot({ path: path.join(outDir, '07_mobile_open_grimoire_spells.png') });
    console.log('Captured 07_mobile_open_grimoire_spells.png');
  } finally {
    await browser.close();
  }
  console.log('--- ALL QA TESTS COMPLETED SUCCESSFULLY ---');
}

run().catch((err) => {
  console.error('QA Test failed:', err);
  process.exit(1);
});
