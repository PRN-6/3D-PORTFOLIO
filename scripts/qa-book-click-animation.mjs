import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\book_click_qa';
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  console.log('--- TESTING STAGED BOOK CLICK ANIMATION ---');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu-compositing'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });

  // 1. Navigate to Archive island (/projects)
  console.log('Navigating to http://127.0.0.1:5175/projects ...');
  await page.goto('http://127.0.0.1:5175/projects', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2200));

  await page.screenshot({ path: path.join(outDir, '01_archive_before_click.png') });
  console.log('Captured 01_archive_before_click.png');

  // 2. Click a grimoire book on the island (Grimoire 5 at x: 680, y: 450)
  console.log('Clicking book on canvas...');
  await page.mouse.click(680, 450);

  // STAGE 1: Mid-descent (350ms after click) -> ONLY this book shown while moving down!
  await new Promise(r => setTimeout(r, 350));
  await page.screenshot({ path: path.join(outDir, '02_archive_moving_down_only_this_book.png') });
  console.log('Captured 02_archive_moving_down_only_this_book.png');

  // STAGE 2: Arrived at bottom (1800ms after click) -> THEN show all books fanned out!
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, '03_archive_arrived_then_show_books.png') });
  console.log('Captured 03_archive_arrived_then_show_books.png');

  // 3. Dismiss modal (Escape key)
  console.log('Closing modal via Escape key...');
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({ path: path.join(outDir, '04_archive_book_closed_restored.png') });
  console.log('Captured 04_archive_book_closed_restored.png');

  console.log('Staged QA Book Click test complete!');
  await browser.close();
}

run().catch(err => {
  console.error('QA script error:', err);
  process.exit(1);
});
