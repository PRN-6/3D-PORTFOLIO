import puppeteer from 'puppeteer-core';

async function check() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Check Home
  console.log('1. Checking Home route...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  const homeCheck = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="cinematic-prinson-title"]');
    const text = document.querySelector('[data-testid="prinson-text"]');
    const wrapper = text ? text.closest('.transition-opacity') : null;
    return {
      hasContainer: !!el,
      hasText: !!text,
      wrapperClasses: wrapper ? wrapper.className : null
    };
  });
  console.log('Home result:', homeCheck);

  // 2. Check About Me
  console.log('2. Checking About route...');
  await page.goto('http://localhost:5173/about', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  const aboutCheck = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="cinematic-prinson-title"]');
    const text = document.querySelector('[data-testid="prinson-text"]');
    const wrapper = text ? text.closest('.transition-opacity') : null;
    return {
      hasContainer: !!el,
      hasText: !!text,
      wrapperClasses: wrapper ? wrapper.className : null
    };
  });
  console.log('About result:', aboutCheck);

  // 3. Take screenshot of Home to ensure it has not regressed
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'scripts/home_verified.png' });
  console.log('Saved scripts/home_verified.png');

  await browser.close();
}

check().catch(console.error);
