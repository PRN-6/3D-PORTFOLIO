import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\qa_screenshots';

async function testAllGrimoires() {
  console.log('Testing all 6 Grimoire clicks and modals...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=default'
    ],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  // Go to archive
  const archiveBtn = await page.waitForSelector('button[aria-label="Visit Grand Mage\'s Archive"]');
  await archiveBtn.click();
  await new Promise(r => setTimeout(r, 4000));

  const targets = [
    { id: 'frontend', name: '1_Frontend_Magic', x: 138, y: 565 },
    { id: 'backend', name: '2_Backend_Alchemy', x: 275, y: 585 },
    { id: 'ai-agents', name: '3_AI_Agents', x: 550, y: 620 },
    { id: 'systems', name: '4_Systems_Programming', x: 890, y: 620 },
    { id: 'creative-3d', name: '5_Creative_3D', x: 1165, y: 585 },
    { id: 'tools', name: '6_Tools_Technologies', x: 1302, y: 565 }
  ];

  for (const t of targets) {
    console.log(`\nTesting Grimoire: ${t.name} at (${t.x}, ${t.y})...`);
    await page.mouse.click(t.x, t.y);
    await new Promise(r => setTimeout(r, 1600));

    // Verify modal appeared (div with role=dialog and aria-label)
    const modal = await page.$('div[role="dialog"][aria-label]');
    if (modal) {
      const title = await page.evaluate(el => el.getAttribute('aria-label'), modal);
      console.log(`✔ Modal successfully opened: "${title}"`);
      await page.screenshot({ path: path.join(outDir, `grimoire_${t.name}_modal.png`) });
      console.log(`Saved screenshot: grimoire_${t.name}_modal.png`);

      // Close modal by clicking the X button
      const closeBtn = await page.$('button[aria-label="Close grimoire modal"]');
      if (closeBtn) {
        await closeBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
      await new Promise(r => setTimeout(r, 1500));
    } else {
      console.warn(`✖ Failed to open modal for ${t.name} at (${t.x}, ${t.y})`);
      await page.screenshot({ path: path.join(outDir, `fail_${t.name}.png`) });
    }
  }

  await browser.close();
  console.log('\nAll 6 grimoire modal tests finished!');
}

testAllGrimoires().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
