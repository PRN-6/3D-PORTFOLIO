import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // 1. Tablet Test (768 x 1024)
  const tabletPage = await browser.newPage();
  await tabletPage.setViewport({ width: 768, height: 1024, deviceScaleFactor: 2 });
  await tabletPage.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await tabletPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('Project Showcase'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 4000));
  await tabletPage.screenshot({ path: 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/cube_fix_qa/tablet_cubes_fixed.png' });
  console.log('Saved tablet screenshot');
  await tabletPage.close();

  // 2. Desktop Test (1440 x 900)
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await desktopPage.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await desktopPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('Project Showcase'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 4000));
  await desktopPage.screenshot({ path: 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/cube_fix_qa/desktop_cubes_fixed.png' });
  console.log('Saved desktop screenshot');

  // Test Return to Island
  await desktopPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('Return to Island'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 3500));
  await desktopPage.screenshot({ path: 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/cube_fix_qa/desktop_returned_home.png' });
  console.log('Saved return to home screenshot');

  await desktopPage.close();
  await browser.close();
})();
