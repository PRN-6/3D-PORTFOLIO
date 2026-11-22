import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = 'C:\\Users\\prins\\.gemini\\antigravity\\brain\\e4c6333e-6fb0-498b-a912-02511bcc08f6\\projects_morph_qa';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function runTest() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Test 1: Direct load on /projects with dark mode (to compare directly with user reference image media_1795360639711_4496815d.jpg)
  console.log('Navigating to http://127.0.0.1:5175/projects...');
  await page.goto('http://127.0.0.1:5175/projects', { waitUntil: 'networkidle0' });

  // Wait for preloader transition (settle beat + FLIP flight: ~1.8s)
  await new Promise(r => setTimeout(r, 2200));

  // Toggle dark mode via theme button
  await page.evaluate(() => {
    const toggle = document.querySelector('button[data-testid="theme-toggle"]');
    if (toggle) toggle.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Wait for 5 capsules to fully settle (Phase 1: 0.6s, Phase 2: 0.7s, Phase 3: 0.7s -> total 2.4s)
  await new Promise(r => setTimeout(r, 2500));

  const shot1 = path.join(OUTPUT_DIR, '01_desktop_projects_settled_dark.png');
  await page.screenshot({ path: shot1 });
  console.log('Saved:', shot1);

  // Test 2: Hover over center capsule (screen center)
  console.log('Hovering over center capsule...');
  await page.mouse.move(720, 450);
  await new Promise(r => setTimeout(r, 500));

  const shot2 = path.join(OUTPUT_DIR, '02_hover_center_capsule.png');
  await page.screenshot({ path: shot2 });
  console.log('Saved:', shot2);

  // Test 3: Click center capsule to open Project Detail modal
  console.log('Clicking center capsule...');
  await page.mouse.click(720, 450);
  await new Promise(r => setTimeout(r, 800));

  const shot3 = path.join(OUTPUT_DIR, '03_project_detail_modal_open.png');
  await page.screenshot({ path: shot3 });
  console.log('Saved:', shot3);

  // Close modal via Escape
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 600));

  // Test 4: Reverse animation - Click 'home' nav link
  console.log('Clicking home nav link to test reverse retract -> big bubble -> burst -> reveal new 3D model...');
  await page.evaluate(() => {
    const homeLink = Array.from(document.querySelectorAll('nav a')).find(a => a.textContent?.trim().toLowerCase() === 'home');
    if (homeLink) homeLink.click();
  });

  // Capture intermediate moments:
  // 1. Capsules retracting into droplets & merging into big bubble (0.4s)
  await new Promise(r => setTimeout(r, 450));
  const shot4 = path.join(OUTPUT_DIR, '04_capsules_retracting_merging_bubble.png');
  await page.screenshot({ path: shot4 });
  console.log('Saved:', shot4);

  // 2. Big bubble formed & sealed (1.3s from start)
  await new Promise(r => setTimeout(r, 850));
  const shot5 = path.join(OUTPUT_DIR, '05_big_bubble_sealed.png');
  await page.screenshot({ path: shot5 });
  console.log('Saved:', shot5);

  // 3. Big bubble bursting / tearing open (1.7s)
  await new Promise(r => setTimeout(r, 350));
  const shot6 = path.join(OUTPUT_DIR, '06_bubble_bursting_tear.png');
  await page.screenshot({ path: shot6 });
  console.log('Saved:', shot6);

  // 4. Hero's Home island revealed & settled (2.5s)
  await new Promise(r => setTimeout(r, 800));
  const shot7 = path.join(OUTPUT_DIR, '07_heros_home_revealed.png');
  await page.screenshot({ path: shot7 });
  console.log('Saved:', shot7);

  // Test 5: Default Light Theme on /projects
  console.log('Navigating to /projects with default light mode...');
  // Clear localStorage theme
  await page.evaluate(() => localStorage.removeItem('theme'));
  await page.goto('http://127.0.0.1:5175/projects', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 4500)); // wait for load + settle

  const shot8 = path.join(OUTPUT_DIR, '08_projects_settled_light_mode.png');
  await page.screenshot({ path: shot8 });
  console.log('Saved:', shot8);

  await browser.close();
  console.log('All QA tests completed successfully!');
}

runTest().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
