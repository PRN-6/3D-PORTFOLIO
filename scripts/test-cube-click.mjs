import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 401, height: 843, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  // Go to project showcase
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.includes('Project Showcase'));
    if (btn) btn.click();
  });

  await new Promise(r => setTimeout(r, 4500));
  
  // Click on the first cube (PRIVACY68) or trigger select via R3F / canvas click
  // In canvas at ~ (width * 0.25, height * 0.2):
  // Let's click at the position of PRIVACY68
  await page.mouse.click(105, 160);
  console.log('Clicked near top-left cube (PRIVACY68)');
  await new Promise(r => setTimeout(r, 1500));

  // Check if modal or selected state is active
  const modalVisible = await page.evaluate(() => {
    const heading = document.querySelector('h2, h3');
    return document.body.innerText.includes('PRIVACY68') || document.body.innerText.includes('Autonomous');
  });
  console.log('Modal visible:', modalVisible);

  await page.screenshot({ path: 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/cube_fix_qa/mobile_cube_selected.png' });
  console.log('Saved selected screenshot');

  await browser.close();
})();
