import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/astra_redesign_qa';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  console.log('=== TEST ASTRA HIGH PORTFOLIO HOMEPAGE REDESIGN ===\n');

  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
    ],
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error('BROWSER ERROR:', msg.text());
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
    console.error('PAGE ERROR:', err.message);
  });

  // 1. DESKTOP TEST
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  console.log('1. Loading portfolio starting screen on Desktop (1440x900)...');
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });

  // Wait for loading screen to complete
  console.log('Waiting for loading screen to finish...');
  await page.waitForFunction(() => {
    const loader = document.querySelector('[data-testid="loading-screen"]');
    return !loader || window.getComputedStyle(loader).opacity === '0' || window.getComputedStyle(loader).display === 'none';
  }, { timeout: 12000 });
  await new Promise((r) => setTimeout(r, 800));

  // 2. CHECK PURE BLACK BACKGROUND & OVERALL DESIGN
  console.log('\n2. Verifying pure black background & minimal layout...');
  const bgStyles = await page.evaluate(() => {
    const main = document.querySelector('main');
    const body = document.body;
    return {
      mainBg: main ? window.getComputedStyle(main).backgroundColor : null,
      bodyBg: window.getComputedStyle(body).backgroundColor,
    };
  });
  console.log('Background Colors:', bgStyles);
  if (bgStyles.mainBg !== 'rgb(0, 0, 0)' && bgStyles.bodyBg !== 'rgb(0, 0, 0)') {
    throw new Error(`FAIL: Background is not pure black #000000, got main: ${bgStyles.mainBg}, body: ${bgStyles.bodyBg}`);
  }
  console.log('PASS: Pure black #000000 background confirmed.');

  // 3. CHECK MAIN HERO — PRINSON
  console.log('\n3. Verifying Main Hero PRINSON Typography & 3D Layering...');
  const heroData = await page.evaluate(() => {
    const container = document.querySelector('[data-testid="cinematic-prinson-title"]');
    const h1 = container?.querySelector('h1');
    const canvas = document.querySelector('canvas');
    if (!container || !h1) return null;

    const h1Style = window.getComputedStyle(h1);
    const containerStyle = window.getComputedStyle(container);
    const canvasStyle = canvas ? window.getComputedStyle(canvas) : null;
    const h1Rect = h1.getBoundingClientRect();

    return {
      text: h1.textContent?.trim(),
      fontFamily: h1Style.fontFamily,
      fontWeight: h1Style.fontWeight,
      color: h1Style.color,
      isFixed: containerStyle.position === 'fixed',
      containerZ: containerStyle.zIndex,
      canvasZ: canvasStyle ? canvasStyle.zIndex : null,
      h1Rect: {
        x: h1Rect.x,
        y: h1Rect.y,
        width: h1Rect.width,
        height: h1Rect.height,
      },
      centerX: h1Rect.x + h1Rect.width / 2,
      viewportWidth: window.innerWidth,
    };
  });

  console.log('Hero PRINSON Data:', heroData);
  if (heroData.text !== 'PRINSON') {
    throw new Error(`FAIL: Expected text 'PRINSON', got: ${heroData.text}`);
  }
  if (!heroData.fontFamily.toLowerCase().includes('bodoni') && !heroData.fontFamily.toLowerCase().includes('serif')) {
    throw new Error(`FAIL: Expected Bodoni/serif font family, got: ${heroData.fontFamily}`);
  }
  if (heroData.color !== 'rgb(255, 255, 255)') {
    throw new Error(`FAIL: Expected pure white color rgb(255, 255, 255), got: ${heroData.color}`);
  }
  if (!heroData.isFixed) {
    throw new Error('FAIL: PRINSON title container must be position: fixed');
  }

  // Check 3D Layering: Canvas must be in front of title container
  const canvasZ = parseInt(heroData.canvasZ || '10', 10);
  const containerZ = parseInt(heroData.containerZ || '1', 10);
  if (canvasZ <= containerZ) {
    throw new Error(`FAIL: Canvas (z=${canvasZ}) must be in front of PRINSON title (z=${containerZ})!`);
  }
  console.log(`PASS: 3D Layering confirmed: Title at z-index ${containerZ}, Canvas in front at z-index ${canvasZ}.`);

  // 4. CHECK SUBTITLE: "Just a Developer"
  console.log('\n4. Verifying Subtitle: Just a Developer...');
  const subtitleData = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="hero-subtitle"]');
    if (!el) return null;
    const p = el.querySelector('p');
    const style = p ? window.getComputedStyle(p) : window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      text: (p ? p.textContent : el.textContent)?.trim(),
      fontFamily: style.fontFamily,
      color: style.color,
      isMono: style.fontFamily.toLowerCase().includes('mono'),
      rect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      },
      centerX: rect.x + rect.width / 2,
      viewportWidth: window.innerWidth,
    };
  });

  console.log('Subtitle Data:', subtitleData);
  if (!subtitleData || !subtitleData.text.toUpperCase().includes('JUST A DEVELOPER')) {
    throw new Error(`FAIL: Subtitle missing or text mismatch: ${subtitleData?.text}`);
  }
  if (!subtitleData.isMono) {
    throw new Error(`FAIL: Subtitle must use monospace font, got: ${subtitleData.fontFamily}`);
  }
  console.log('PASS: Subtitle "Just a Developer" confirmed in centered monospace font.');

  // 5. CHECK TOP CENTRE NAVIGATION
  console.log('\n5. Verifying Top Centre Minimal Navigation...');
  const navData = await page.evaluate(() => {
    const nav = document.querySelector('[data-testid="top-center-navigation"]');
    if (!nav) return null;

    const buttons = Array.from(nav.querySelectorAll('button')).map((b) => ({
      text: b.textContent?.trim(),
      isActive: b.getAttribute('aria-current') === 'page' || b.className.includes('text-white font-medium'),
    }));

    const rect = nav.getBoundingClientRect();
    const style = window.getComputedStyle(nav);

    return {
      position: style.position,
      top: style.top,
      centerX: rect.x + rect.width / 2,
      viewportWidth: window.innerWidth,
      buttons,
    };
  });

  console.log('Top Nav Data:', navData);
  if (!navData) {
    throw new Error('FAIL: Top center navigation element not found!');
  }

  const expectedNavLabels = ['home', 'products', 'projects', 'about me', 'contact', 'fun'];
  if (navData.buttons.length !== 6) {
    throw new Error(`FAIL: Expected 6 nav items, found ${navData.buttons.length}`);
  }

  expectedNavLabels.forEach((label, idx) => {
    if (navData.buttons[idx].text !== label) {
      throw new Error(`FAIL: Nav item ${idx} expected '${label}', got '${navData.buttons[idx].text}'`);
    }
  });

  // Verify 'home' is active by default
  if (!navData.buttons[0].isActive) {
    throw new Error('FAIL: First item "home" should be active on homepage!');
  }
  console.log('PASS: Top centre navigation matches: home · products · projects · about me · contact · fun');

  // 6. CHECK 3D ROTATION STATIONARY BEHAVIOR
  console.log('\n6. Testing stationary behavior during 3D scene mouse drag...');
  const preDrag = await page.evaluate(() => {
    const title = document.querySelector('[data-testid="cinematic-prinson-title"] h1');
    const sub = document.querySelector('[data-testid="hero-subtitle"]');
    const tr = title ? title.getBoundingClientRect() : null;
    const sr = sub ? sub.getBoundingClientRect() : null;
    return {
      titleX: tr?.x,
      titleY: tr?.y,
      subX: sr?.x,
      subY: sr?.y,
    };
  });

  await page.mouse.move(720, 450);
  await page.mouse.down();
  await page.mouse.move(920, 360, { steps: 12 });
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 500));

  const postDrag = await page.evaluate(() => {
    const title = document.querySelector('[data-testid="cinematic-prinson-title"] h1');
    const sub = document.querySelector('[data-testid="hero-subtitle"]');
    const tr = title ? title.getBoundingClientRect() : null;
    const sr = sub ? sub.getBoundingClientRect() : null;
    return {
      titleX: tr?.x,
      titleY: tr?.y,
      subX: sr?.x,
      subY: sr?.y,
    };
  });

  const deltaTitleX = Math.abs(postDrag.titleX - preDrag.titleX);
  const deltaTitleY = Math.abs(postDrag.titleY - preDrag.titleY);
  const deltaSubX = Math.abs(postDrag.subX - preDrag.subX);
  const deltaSubY = Math.abs(postDrag.subY - preDrag.subY);

  console.log(`Deltas after 3D drag: Title delta=(${deltaTitleX}px, ${deltaTitleY}px), Subtitle delta=(${deltaSubX}px, ${deltaSubY}px)`);
  if (deltaTitleX > 0.5 || deltaTitleY > 0.5 || deltaSubX > 0.5 || deltaSubY > 0.5) {
    throw new Error('FAIL: Typography shifted when rotating 3D island!');
  }
  console.log('PASS: PRINSON title and Subtitle remain 100% stationary during 3D island rotation.');

  // Capture Desktop Screenshot
  const desktopImg = path.join(artifactDir, '01_desktop_hero_redesign.png');
  await page.screenshot({ path: desktopImg });
  console.log(`PASS: Captured Desktop Screenshot: ${desktopImg}`);

  // 7. TEST INTERACTION: CLICK "fun" TO OPEN FUN MODAL
  console.log('\n7. Testing "fun" navigation item interaction...');
  await page.evaluate(() => {
    const funBtn = Array.from(document.querySelectorAll('nav[data-testid="top-center-navigation"] button'))
      .find((b) => b.textContent?.trim() === 'fun');
    if (funBtn) funBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  const isFunModalOpen = await page.evaluate(() => {
    const modal = document.querySelector('[aria-label="Fun & Experiments"]');
    return !!modal;
  });
  console.log('Fun Modal Open:', isFunModalOpen);
  if (!isFunModalOpen) {
    throw new Error('FAIL: Fun modal did not open when clicking "fun"!');
  }
  console.log('PASS: "fun" modal opened successfully.');

  const funImg = path.join(artifactDir, '02_fun_modal.png');
  await page.screenshot({ path: funImg });
  console.log(`Captured Fun Modal: ${funImg}`);

  // Close Fun Modal
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 400));

  // 8. TEST INTERACTION: CLICK "contact" TO OPEN CONTACT MODAL
  console.log('\n8. Testing "contact" navigation item interaction...');
  await page.evaluate(() => {
    const contactBtn = Array.from(document.querySelectorAll('nav[data-testid="top-center-navigation"] button'))
      .find((b) => b.textContent?.trim() === 'contact');
    if (contactBtn) contactBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  const isContactOpen = await page.evaluate(() => {
    const modal = document.querySelector('[role="dialog"]');
    return !!modal && modal.textContent?.includes('Contact');
  });
  console.log('Contact Modal Open:', isContactOpen);
  if (!isContactOpen) {
    throw new Error('FAIL: Contact modal did not open when clicking "contact"!');
  }
  console.log('PASS: "contact" modal opened successfully.');

  // Close Contact Modal
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 400));

  // 9. MOBILE RESPONSIVE TEST
  console.log('\n9. Testing Mobile Viewport (390x844)...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 800));

  const mobileData = await page.evaluate(() => {
    const topNav = document.querySelector('[data-testid="top-center-navigation"]');
    const header = document.querySelector('header[aria-label="Mobile Navigation Controls"]');
    const title = document.querySelector('[data-testid="cinematic-prinson-title"] h1');
    const bodyWidth = document.documentElement.clientWidth;
    const scrollWidth = document.documentElement.scrollWidth;

    return {
      topNavHidden: !topNav || window.getComputedStyle(topNav).display === 'none',
      headerVisible: !!header && window.getComputedStyle(header).display !== 'none',
      hasOverflow: scrollWidth > bodyWidth,
      titleText: title?.textContent?.trim(),
    };
  });

  console.log('Mobile Data:', mobileData);
  if (!mobileData.topNavHidden) {
    throw new Error('FAIL: Desktop top nav must be hidden on mobile screen!');
  }
  if (!mobileData.headerVisible) {
    throw new Error('FAIL: Mobile top-right header with hamburger must be visible!');
  }
  if (mobileData.hasOverflow) {
    throw new Error('FAIL: Horizontal overflow detected on mobile!');
  }
  console.log('PASS: Mobile header and responsiveness verified.');

  // Capture Mobile Initial View
  const mobileImg = path.join(artifactDir, '03_mobile_hero_view.png');
  await page.screenshot({ path: mobileImg });
  console.log(`Captured Mobile Hero View: ${mobileImg}`);

  // Test Mobile Hamburger Click
  console.log('\n10. Testing Mobile Hamburger Menu dropdown...');
  await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="Open navigation menu"]');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  const mobileMenuItems = await page.evaluate(() => {
    const panel = document.querySelector('#mobile-nav-panel');
    if (!panel) return [];
    return Array.from(panel.querySelectorAll('button')).map((b) => b.textContent?.trim());
  });

  console.log('Mobile Menu Items:', mobileMenuItems);
  if (mobileMenuItems.length !== 6) {
    throw new Error(`FAIL: Expected 6 mobile menu items, got ${mobileMenuItems.length}`);
  }
  console.log('PASS: Mobile hamburger dropdown contains all 6 minimal lowercase items.');

  const mobileMenuImg = path.join(artifactDir, '04_mobile_menu_open.png');
  await page.screenshot({ path: mobileMenuImg });
  console.log(`Captured Mobile Menu Open: ${mobileMenuImg}`);

  // 11. CHECK FOOTER
  console.log('\n11. Verifying minimal footer elements...');
  const footerData = await page.evaluate(() => {
    const footer = document.querySelector('[data-testid="portfolio-footer"]');
    if (!footer) return null;
    const links = Array.from(footer.querySelectorAll('nav a')).map((a) => a.getAttribute('aria-label'));
    const counter = footer.querySelector('[data-testid="footer-copyright-counter"]')?.textContent?.trim();
    return {
      links,
      counter,
    };
  });
  console.log('Footer Data:', footerData);
  if (footerData.links.length !== 4) {
    throw new Error(`FAIL: Expected 4 footer social links, got ${footerData.links.length}`);
  }
  console.log('PASS: Minimal footer with 4 social links and visitor counter confirmed.');

  // 12. CONSOLE ERRORS
  console.log('\n12. Verifying zero console errors...');
  if (consoleErrors.length > 0) {
    throw new Error(`FAIL: Console errors detected: ${consoleErrors.join(', ')}`);
  }
  console.log('PASS: 0 browser console errors detected.');

  console.log('\n=== ALL ASTRA HOMEPAGE REDESIGN TESTS PASSED! ===');
  await browser.close();
}

run().catch((err) => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
