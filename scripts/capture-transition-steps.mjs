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

  // Trigger transition
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('START ADVENTURE'));
    if (btn) btn.click();
  });
  console.log('Clicked START ADVENTURE');

  // Capture at 0.5s, 1.5s, 2.7s, 3.8s, 4.8s, 6.0s
  const times = [500, 1000, 1200, 1100, 1000, 1200];
  for (let i = 0; i < times.length; i++) {
    await new Promise(r => setTimeout(r, times[i]));
    await page.screenshot({ path: `C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/scratch/transition_step_${i}.png` });
    console.log(`Saved scratch/transition_step_${i}.png`);
  }

  await browser.close();
})();
