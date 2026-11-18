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

  // Test different camera poses directly on the settled archive
  const testPoses = [
    { name: 'pose_21', pos: [0, 7.8, 21.0], target: [0, 1.8, 0] },
    { name: 'pose_23', pos: [0, 8.2, 23.0], target: [0, 1.8, 0] },
    { name: 'pose_25', pos: [0, 8.8, 25.0], target: [0, 1.8, 0] },
    { name: 'pose_27', pos: [0, 9.5, 27.0], target: [0, 1.8, 0] },
  ];

  for (const pose of testPoses) {
    await page.evaluate((p) => {
      // Find OrbitControls or set camera directly
      const canvas = document.querySelector('canvas');
      const r3f = canvas?.__r3f;
      // In Archive, we can set __FORCE_CAM_POSE__ or access camera
      window.__SET_CAM__?.(p.pos, p.target);
    }, pose);
  }

  await browser.close();
})();
