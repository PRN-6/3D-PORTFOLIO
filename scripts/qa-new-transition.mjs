import puppeteer from 'puppeteer-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  console.log('=== 1. TESTING DESKTOP TRANSITION (1440x900) ===');
  const deskPage = await browser.newPage();
  await deskPage.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await deskPage.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  await deskPage.screenshot({ path: 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/transition_qa/01_desktop_home_initial.png' });
  console.log('Saved 01_desktop_home_initial.png');

  // Click START ADVENTURE
  await deskPage.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('START ADVENTURE'));
    if (btn) btn.click();
  });
  console.log('Clicked START ADVENTURE');

  // Sample mid-transition (at ~2.5s)
  await new Promise(r => setTimeout(r, 2600));
  await deskPage.screenshot({ path: 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/transition_qa/02_desktop_mid_vertical_rise.png' });
  console.log('Saved 02_desktop_mid_vertical_rise.png');

  // Sample at completion (at ~6.0s)
  await new Promise(r => setTimeout(r, 3800));
  await deskPage.screenshot({ path: 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/transition_qa/03_desktop_archive_settled.png' });
  console.log('Saved 03_desktop_archive_settled.png');

  // Test Return to Home
  await deskPage.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Return to Island'));
    if (btn) btn.click();
  });
  console.log('Clicked Return to Island');

  await new Promise(r => setTimeout(r, 6500));
  await deskPage.screenshot({ path: 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/transition_qa/04_desktop_returned_home.png' });
  console.log('Saved 04_desktop_returned_home.png');
  await deskPage.close();

  console.log('\n=== 2. TESTING MOBILE TRANSITION (401x843) ===');
  const mobPage = await browser.newPage();
  await mobPage.setViewport({ width: 401, height: 843, deviceScaleFactor: 2 });
  await mobPage.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  await mobPage.screenshot({ path: 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/transition_qa/05_mobile_home_initial.png' });
  console.log('Saved 05_mobile_home_initial.png');

  await mobPage.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('START ADVENTURE'));
    if (btn) btn.click();
  });
  console.log('Clicked START ADVENTURE on mobile');

  await new Promise(r => setTimeout(r, 2600));
  await mobPage.screenshot({ path: 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/transition_qa/06_mobile_mid_vertical_rise.png' });
  console.log('Saved 06_mobile_mid_vertical_rise.png');

  await new Promise(r => setTimeout(r, 3800));
  await mobPage.screenshot({ path: 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/transition_qa/07_mobile_archive_settled.png' });
  console.log('Saved 07_mobile_archive_settled.png');
  await mobPage.close();

  await browser.close();
  console.log('\nAll QA screenshots captured successfully!');
})();
