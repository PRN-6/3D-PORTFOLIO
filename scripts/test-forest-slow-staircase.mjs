import puppeteer from 'puppeteer-core';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173');
  await new Promise((r) => setTimeout(r, 2000));

  // 1. Go to Archive immediately
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('START ADVENTURE')
    );
    btn?.click();
  });
  console.log('Transitioning to Archive...');
  await new Promise((r) => setTimeout(r, 18000));

  // 2. Ascend to Forest
  console.log('Ascending to Forest...');
  const forestBtn = await page.waitForSelector('button[aria-label="Ascend to Whispering Forest"]');
  await forestBtn.click();

  // Capture mid-staircase formation for Forest
  await new Promise((r) => setTimeout(r, 7000));
  await page.screenshot({
    path: 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/slow_staircase_qa/09_forest_stairs_mid_formation.png',
  });
  console.log('Captured: 09_forest_stairs_mid_formation.png');

  // Wait for Forest arrival
  await new Promise((r) => setTimeout(r, 11000));
  await page.screenshot({
    path: 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/slow_staircase_qa/10_forest_destination_settled.png',
  });
  console.log('Captured: 10_forest_destination_settled.png');

  await browser.close();
}

run().catch(console.error);

