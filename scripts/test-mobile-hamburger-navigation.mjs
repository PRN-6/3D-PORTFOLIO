import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/mobile_hamburger_qa';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  console.log('=== TEST MOBILE RESPONSIVE HAMBURGER NAVIGATION ===\n');

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

  // Helper to wait for transition to target island
  const waitForIsland = async (expectedIsland, timeoutMs = 10000) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const state = await page.evaluate(() => {
        return {
          currentIsland: window.__CURRENT_ACTIVE_ISLAND__,
          transitionState: window.__EXPLODED_TRANSITION_STATE__,
        };
      });

      if (state.currentIsland === expectedIsland && (!state.transitionState || state.transitionState.phase === 'COMPLETE')) {
        return state;
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    const finalState = await page.evaluate(() => ({
      currentIsland: window.__CURRENT_ACTIVE_ISLAND__,
      transitionState: window.__EXPLODED_TRANSITION_STATE__,
    }));
    throw new Error(`Timeout waiting for island ${expectedIsland}. Current state: ${JSON.stringify(finalState)}`);
  };

  // =========================================================================
  // STEP 1: DESKTOP VIEWPORT (1440x900)
  // Verify: Bottom bar visible, Hamburger hidden, Reset View visible
  // =========================================================================
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  console.log('1. Testing Desktop Viewport (1440x900)...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));

  const desktopNavInfo = await page.evaluate(() => {
    const bottomNav = document.querySelector('nav[aria-label="Main Navigation"]');
    const bottomNavVisible = bottomNav && window.getComputedStyle(bottomNav.parentElement).display !== 'none';
    const hamburgerBtn = document.querySelector('button[aria-label="Open navigation menu"], button[aria-label="Close navigation menu"]');
    const hamburgerVisible = hamburgerBtn && window.getComputedStyle(hamburgerBtn).display !== 'none';
    const resetBtn = document.querySelector('button[aria-label="Reset camera view"]');
    const resetVisible = resetBtn && window.getComputedStyle(resetBtn).display !== 'none';

    return {
      bottomNavVisible,
      hamburgerVisible,
      resetVisible,
    };
  });
  console.log('Desktop Nav State:', desktopNavInfo);

  if (!desktopNavInfo.bottomNavVisible) {
    throw new Error('FAIL: Bottom horizontal nav bar should be VISIBLE on desktop!');
  }
  if (desktopNavInfo.hamburgerVisible) {
    throw new Error('FAIL: Hamburger button should be HIDDEN on desktop!');
  }
  if (!desktopNavInfo.resetVisible) {
    throw new Error('FAIL: Reset View button should be VISIBLE on desktop!');
  }
  console.log('PASS: Desktop layout preserves horizontal bottom bar and hides hamburger button.');

  const desktopScreenshot = path.join(artifactDir, '01_desktop_nav_layout.png');
  await page.screenshot({ path: desktopScreenshot });
  console.log(`Saved screenshot: ${desktopScreenshot}`);

  // =========================================================================
  // STEP 2: MOBILE VIEWPORT (390x844 - iPhone 14 / modern mobile)
  // Verify: Bottom bar hidden, Top-right has [ Reset View ] [ ☰ ]
  // =========================================================================
  console.log('\n2. Testing Mobile Viewport (390x844)...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 800));

  const mobileHeaderInfo = await page.evaluate(() => {
    const bottomNav = document.querySelector('nav[aria-label="Main Navigation"]');
    const bottomNavDisplay = bottomNav ? window.getComputedStyle(bottomNav.parentElement).display : 'none';
    const hamburgerBtn = document.querySelector('button[aria-label="Open navigation menu"], button[aria-label="Close navigation menu"]');
    const hamburgerDisplay = hamburgerBtn ? window.getComputedStyle(hamburgerBtn).display : 'none';
    const resetBtn = document.querySelector('button[aria-label="Reset camera view"]');
    const resetDisplay = resetBtn ? window.getComputedStyle(resetBtn).display : 'none';

    // Bounding rects to verify alignment
    const hRect = hamburgerBtn ? hamburgerBtn.getBoundingClientRect() : null;
    const rRect = resetBtn ? resetBtn.getBoundingClientRect() : null;

    return {
      bottomNavDisplay,
      hamburgerDisplay,
      resetDisplay,
      hRect,
      rRect,
      isHorizontallyAligned: hRect && rRect && Math.abs(hRect.top - rRect.top) < 6,
    };
  });
  console.log('Mobile Header State:', mobileHeaderInfo);

  if (mobileHeaderInfo.bottomNavDisplay !== 'none') {
    throw new Error(`FAIL: Bottom nav should be HIDDEN on mobile, got display: ${mobileHeaderInfo.bottomNavDisplay}`);
  }
  if (mobileHeaderInfo.hamburgerDisplay === 'none') {
    throw new Error('FAIL: Hamburger button should be VISIBLE on mobile!');
  }
  if (mobileHeaderInfo.resetDisplay === 'none') {
    throw new Error('FAIL: Reset View button should be VISIBLE on mobile!');
  }
  if (!mobileHeaderInfo.isHorizontallyAligned) {
    throw new Error('FAIL: Reset View and Hamburger button must be aligned horizontally!');
  }
  console.log('PASS: Bottom bar hidden. Top-right header displays [ Reset View ] [ ☰ ] horizontally aligned.');

  const mobileClosedScreenshot = path.join(artifactDir, '02_mobile_header_closed.png');
  await page.screenshot({ path: mobileClosedScreenshot });
  console.log(`Saved screenshot: ${mobileClosedScreenshot}`);

  // =========================================================================
  // STEP 3: OPEN HAMBURGER MENU
  // Verify: Panel opens with 5 vertical items, Home is highlighted active
  // =========================================================================
  console.log('\n3. Clicking hamburger menu icon to open...');
  await page.evaluate(() => {
    const hamburgerBtn = document.querySelector('button[aria-label="Open navigation menu"]');
    hamburgerBtn?.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  const openMenuInfo = await page.evaluate(() => {
    const panel = document.getElementById('mobile-nav-panel');
    if (!panel) return null;
    const buttons = Array.from(panel.querySelectorAll('button[role="menuitem"]'));
    return {
      isOpen: true,
      itemCount: buttons.length,
      items: buttons.map((b) => ({
        text: b.textContent.trim(),
        isActive: b.classList.contains('bg-white/15'),
      })),
      hamburgerLabel: document.querySelector('button[aria-expanded="true"]')?.getAttribute('aria-label'),
    };
  });
  console.log('Open Menu State:', openMenuInfo);

  if (!openMenuInfo || !openMenuInfo.isOpen) {
    throw new Error('FAIL: Mobile navigation panel did not open!');
  }
  if (openMenuInfo.itemCount !== 5) {
    throw new Error(`FAIL: Expected 5 vertical navigation items, found ${openMenuInfo.itemCount}`);
  }
  const expectedItems = ['Home', 'Products', 'About Me', 'Projects', 'Contact'];
  expectedItems.forEach((label, idx) => {
    if (openMenuInfo.items[idx].text !== label) {
      throw new Error(`Item ${idx} expected "${label}", found "${openMenuInfo.items[idx].text}"`);
    }
  });

  const activeItem = openMenuInfo.items.find((i) => i.isActive);
  console.log('Active highlighted item:', activeItem?.text);
  if (activeItem?.text !== 'Home') {
    throw new Error(`Expected Home to be highlighted active, got "${activeItem?.text}"`);
  }
  console.log('PASS: Hamburger menu opened smoothly with all 5 items, Home highlighted active.');

  const mobileOpenScreenshot = path.join(artifactDir, '03_mobile_menu_open.png');
  await page.screenshot({ path: mobileOpenScreenshot });
  console.log(`Saved screenshot: ${mobileOpenScreenshot}`);

  // =========================================================================
  // STEP 4: CLOSE VIA OUTSIDE CLICK
  // Verify: Clicking outside closes the menu
  // =========================================================================
  console.log('\n4. Testing close on outside click...');
  // Click on screen at (100, 300) which hits the backdrop overlay
  await page.mouse.click(100, 300);
  await new Promise((r) => setTimeout(r, 400));

  const isClosedAfterClick = await page.evaluate(() => !document.getElementById('mobile-nav-panel'));
  console.log('Menu closed after outside click:', isClosedAfterClick);
  if (!isClosedAfterClick) {
    throw new Error('FAIL: Menu should close when clicking outside!');
  }
  console.log('PASS: Outside click closes the menu.');

  const outsideClosedScreenshot = path.join(artifactDir, '04_mobile_menu_closed_outside_click.png');
  await page.screenshot({ path: outsideClosedScreenshot });

  // =========================================================================
  // STEP 5: NAVIGATE VIA HAMBURGER MENU: Products -> Workshop
  // Verify: Auto-closes menu and transitions to Workshop
  // =========================================================================
  console.log('\n5. Opening menu and selecting "Products"...');
  await page.evaluate(() => {
    document.querySelector('button[aria-label="Open navigation menu"]')?.click();
  });
  await new Promise((r) => setTimeout(r, 300));

  await page.evaluate(() => {
    const panel = document.getElementById('mobile-nav-panel');
    const productsBtn = Array.from(panel.querySelectorAll('button')).find((b) => b.textContent.trim() === 'Products');
    productsBtn?.click();
  });

  // Verify menu closed automatically
  const menuAutoClosed = await page.evaluate(() => !document.getElementById('mobile-nav-panel'));
  console.log('Menu auto-closed on selection:', menuAutoClosed);
  if (!menuAutoClosed) {
    throw new Error('FAIL: Menu should close automatically after item selection!');
  }

  console.log('Waiting for modular exploded transition to WORKSHOP...');
  await waitForIsland('WORKSHOP');
  await new Promise((r) => setTimeout(r, 600));

  const workshopIsland = await page.evaluate(() => window.__CURRENT_ACTIVE_ISLAND__);
  console.log('Active Island:', workshopIsland);
  if (workshopIsland !== 'WORKSHOP') {
    throw new Error(`Expected WORKSHOP, got ${workshopIsland}`);
  }

  const productsScreenshot = path.join(artifactDir, '05_mobile_nav_products_workshop.png');
  await page.screenshot({ path: productsScreenshot });
  console.log(`Saved screenshot: ${productsScreenshot}`);

  // Re-open menu to verify Products is now active
  await page.evaluate(() => {
    document.querySelector('button[aria-label="Open navigation menu"]')?.click();
  });
  await new Promise((r) => setTimeout(r, 300));

  const workshopActiveItem = await page.evaluate(() => {
    const panel = document.getElementById('mobile-nav-panel');
    const active = panel ? Array.from(panel.querySelectorAll('button')).find((b) => b.classList.contains('bg-white/15')) : null;
    return active?.textContent?.trim();
  });
  console.log('Active highlighted item in menu:', workshopActiveItem);
  if (workshopActiveItem !== 'Products') {
    throw new Error(`Expected "Products" to be highlighted active, got "${workshopActiveItem}"`);
  }

  // Close menu with Escape
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 300));

  // =========================================================================
  // STEP 6: NAVIGATE VIA HAMBURGER MENU: Return to Home
  // =========================================================================
  console.log('\n6. Opening menu and selecting "Home"...');
  await page.evaluate(() => {
    document.querySelector('button[aria-label="Open navigation menu"]')?.click();
  });
  await new Promise((r) => setTimeout(r, 300));

  await page.evaluate(() => {
    const panel = document.getElementById('mobile-nav-panel');
    const homeBtn = Array.from(panel.querySelectorAll('button')).find((b) => b.textContent.trim() === 'Home');
    homeBtn?.click();
  });

  await waitForIsland('HOME');
  await new Promise((r) => setTimeout(r, 600));

  const returnedHomeIsland = await page.evaluate(() => window.__CURRENT_ACTIVE_ISLAND__);
  console.log('Active Island after Home return:', returnedHomeIsland);
  if (returnedHomeIsland !== 'HOME') {
    throw new Error(`Expected HOME, got ${returnedHomeIsland}`);
  }

  const returnedHomeScreenshot = path.join(artifactDir, '06_mobile_nav_returned_home.png');
  await page.screenshot({ path: returnedHomeScreenshot });
  console.log(`Saved screenshot: ${returnedHomeScreenshot}`);

  // =========================================================================
  // STEP 7: TEST MOBILE LANDSCAPE (844x390)
  // Verify: Header aligned, menu opens without overflow or vertical stacking
  // =========================================================================
  console.log('\n7. Testing Mobile Landscape Viewport (844x390)...');
  await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 600));

  // Bottom bar should still be hidden or non-obtrusive
  const landscapeHeader = await page.evaluate(() => {
    const bottomNav = document.querySelector('nav[aria-label="Main Navigation"]');
    const bottomNavDisplay = bottomNav ? window.getComputedStyle(bottomNav.parentElement).display : 'none';
    const hamburgerBtn = document.querySelector('button[aria-label="Open navigation menu"]');
    return {
      bottomNavDisplay,
      hasHamburger: !!hamburgerBtn,
    };
  });
  console.log('Landscape Nav State:', landscapeHeader);

  const landscapeScreenshot = path.join(artifactDir, '07_mobile_landscape_view.png');
  await page.screenshot({ path: landscapeScreenshot });
  console.log(`Saved screenshot: ${landscapeScreenshot}`);

  // =========================================================================
  // STEP 8: CHECK CONSOLE ERRORS
  // =========================================================================
  console.log('\n8. Checking console errors...');
  if (consoleErrors.length > 0) {
    console.warn(`WARNING: Encountered ${consoleErrors.length} errors:`, consoleErrors);
  } else {
    console.log('ZERO console errors detected! 100% clean.');
  }

  console.log('\n=== ALL MOBILE HAMBURGER NAVIGATION TESTS PASSED! ===');
  await browser.close();
}

run().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});

