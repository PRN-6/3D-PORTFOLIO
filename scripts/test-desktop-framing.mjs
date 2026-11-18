import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  // Transition to archive
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('START ADVENTURE'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 6500));

  const testPoses = [
    { id: '22', pos: [0, 8.0, 22.0], target: [0, 1.8, 0] },
    { id: '24', pos: [0, 8.8, 24.0], target: [0, 1.8, 0] },
    { id: '26', pos: [0, 9.5, 26.0], target: [0, 1.8, 0] },
    { id: '28', pos: [0, 10.2, 28.0], target: [0, 1.8, 0] },
  ];

  for (const p of testPoses) {
    await page.evaluate((pose) => {
      window.__FORCE_CAM_POSE__ = pose;
      // In ArchiveCameraController, if controls exist:
      const canvas = document.querySelector('canvas');
      const r3f = canvas?.__r3f;
      // Also trigger render
    }, p);
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: `C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/scratch/archive_desktop_test_${p.id}.png` });
    console.log(`Saved scratch/archive_desktop_test_${p.id}.png`);
  }

  await browser.close();
})();
