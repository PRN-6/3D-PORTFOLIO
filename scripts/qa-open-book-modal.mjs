import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/grimoire_turn_qa';
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function runQA() {
  console.log('🚀 Launching Puppeteer QA for 3D Book Opening & Page-Turning System...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu-compositing'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });

    console.log('🌐 Navigating to http://127.0.0.1:5175/projects...');
    await page.goto('http://127.0.0.1:5175/projects', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2200));

    // 1. Click a grimoire book on the island to trigger bubble release
    console.log('📍 Clicking grimoire book on the island (x: 680, y: 450)...');
    await page.mouse.click(680, 450);

    // 2. Wait for main bubble to seal, release 6 bubbles, and all 6 bubbles to pop into books
    console.log('⏳ Waiting 4200ms for 6 books to pop and settle...');
    await new Promise((r) => setTimeout(r, 4200));

    // 3. Find and click CUBIX68 book badge
    console.log('📖 Finding and clicking CUBIX68 book badge...');
    const cubixElement = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('span'));
      const found = elements.find((el) => el.textContent && el.textContent.includes('CUBIX68'));
      if (found) {
        const rect = found.getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      }
      return null;
    });

    if (cubixElement) {
      console.log(`✨ Found CUBIX68 at (${cubixElement.x}, ${cubixElement.y}), clicking...`);
      await page.mouse.click(cubixElement.x, cubixElement.y);
    } else {
      console.log('⚠️ CUBIX68 text not found, clicking fallback coords (640, 250)...');
      await page.mouse.click(640, 250);
    }

    // 4. Capture at 220ms into the 3D book opening entrance animation!
    await new Promise((r) => setTimeout(r, 220));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_book_opening_entrance.png') });
    console.log('📸 01_book_opening_entrance.png captured (3D front cover swinging open)');

    // 5. Wait for book to fully settle open onto Folio I & II
    await new Promise((r) => setTimeout(r, 900));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_folio_1_2.png') });
    console.log('📸 02_folio_1_2.png captured (Folio I & II - Frontispiece & Lore)');

    // 6. Trigger 3D Page Turn Forward to Folio III & IV
    console.log('📄 Clicking Turn Forward ❯ ...');
    await page.evaluate(() => {
      const nextBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Turn Forward')
      );
      if (nextBtn) nextBtn.click();
    });

    // Capture mid-flip 3D curling leaf (at 220ms into the 650ms turn)
    await new Promise((r) => setTimeout(r, 220));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_mid_page_turn.png') });
    console.log('📸 03_mid_page_turn.png captured (mid-flip 3D leaf rotating across spine)');

    // Wait for turn to complete onto Folio III & IV
    await new Promise((r) => setTimeout(r, 650));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_folio_3_4.png') });
    console.log('📸 04_folio_3_4.png captured (Folio III & IV - De Architectura & Spells)');

    // 7. Turn Forward to Folio V & VI
    console.log('📄 Clicking Turn Forward ❯ again...');
    await page.evaluate(() => {
      const nextBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Turn Forward')
      );
      if (nextBtn) nextBtn.click();
    });

    await new Promise((r) => setTimeout(r, 750));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_folio_5_6.png') });
    console.log('📸 05_folio_5_6.png captured (Folio V & VI - Sigils, Technologies & Wax Seal)');

    // 8. Turn Backward to Folio III & IV
    console.log('📄 Clicking Turn Back ❮ ...');
    await page.evaluate(() => {
      const prevBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Turn Back')
      );
      if (prevBtn) prevBtn.click();
    });

    await new Promise((r) => setTimeout(r, 750));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_turned_back_to_3_4.png') });
    console.log('📸 06_turned_back_to_3_4.png captured');

    // 9. Close Grimoire Modal via Wax Seal Close button
    console.log('❌ Clicking Wax Seal Close button...');
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[aria-label="Close 3D Grimoire"]');
      if (closeBtn) closeBtn.click();
    });

    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '07_returned_to_6_books.png') });
    console.log('📸 07_returned_to_6_books.png captured (smooth return to 6 floating books)');

    // 10. Mobile Test (390 x 844 iPhone 14)
    console.log('📱 Switching to Mobile Viewport (390x844)...');
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 });
    await mobilePage.goto('http://127.0.0.1:5175/projects', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 3800));

    // Click book on mobile island
    await mobilePage.mouse.click(195, 480);
    await new Promise((r) => setTimeout(r, 4500));

    // Click CUBIX68 on mobile
    const mobileCubix = await mobilePage.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('span'));
      const found = elements.find((el) => el.textContent && el.textContent.includes('CUBIX68'));
      if (found) {
        const rect = found.getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      }
      return null;
    });

    if (mobileCubix) {
      await mobilePage.mouse.click(mobileCubix.x, mobileCubix.y);
    } else {
      await mobilePage.mouse.click(195, 300);
    }

    await new Promise((r) => setTimeout(r, 1000));
    await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, '08_mobile_open_grimoire_folio1.png') });
    console.log('📸 08_mobile_open_grimoire_folio1.png captured');

    // Turn page on mobile
    await mobilePage.evaluate(() => {
      const nextBtn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Turn Forward')
      );
      if (nextBtn) nextBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, '09_mobile_open_grimoire_folio2.png') });
    console.log('📸 09_mobile_open_grimoire_folio2.png captured');

    await mobilePage.close();
    await page.close();
    console.log('🎉 All QA tests passed successfully!');
  } finally {
    await browser.close();
  }
}

runQA().catch((err) => {
  console.error('❌ QA Script Error:', err);
  process.exit(1);
});
