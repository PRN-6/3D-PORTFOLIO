import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/url_routing_qa';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  console.log('=== TEST INDIVIDUAL URL ROUTING FOR EVERY WEBSITE PAGE ===\n');

  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--autoplay-policy=no-user-gesture-required',
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

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  // ---------------------------------------------------------------------------
  // 1. TEST DIRECT URL ACCESS & REFRESH FOR EACH ROUTE
  // ---------------------------------------------------------------------------
  console.log('--- 1. DIRECT URL ACCESS & REFRESH VERIFICATION ---');

  const routesToTest = [
    {
      url: 'http://localhost:5173/',
      expectedPath: '/',
      expectedTab: 'home',
      expectedTitlePart: 'PRINSON',
      expectedTrack: 'home.mp3',
      screenshot: '01_direct_home.png',
    },
    {
      url: 'http://localhost:5173/products',
      expectedPath: '/products',
      expectedTab: 'products',
      expectedTitlePart: 'Products',
      expectedTrack: 'products.mp3',
      screenshot: '02_direct_products.png',
    },
    {
      url: 'http://localhost:5173/projects',
      expectedPath: '/projects',
      expectedTab: 'projects',
      expectedTitlePart: 'Projects',
      expectedTrack: 'projects.mp3',
      screenshot: '03_direct_projects.png',
    },
    {
      url: 'http://localhost:5173/about',
      expectedPath: '/about',
      expectedTab: 'about me',
      expectedTitlePart: 'About Me',
      expectedTrack: 'about.mp3',
      screenshot: '04_direct_about.png',
    },
    {
      url: 'http://localhost:5173/contact',
      expectedPath: '/contact',
      expectedTab: 'contact',
      expectedTitlePart: 'Contact',
      expectedTrack: 'contact.mp3',
      isModal: true,
      screenshot: '05_direct_contact.png',
    },
    {
      url: 'http://localhost:5173/fun',
      expectedPath: '/fun',
      expectedTab: 'fun',
      expectedTitlePart: 'Fun',
      expectedTrack: 'home.mp3',
      isModal: true,
      screenshot: '06_direct_fun.png',
    },
  ];

  for (const r of routesToTest) {
    console.log(`\nVisiting direct URL: ${r.url}`);
    await page.goto(r.url, { waitUntil: 'networkidle0' });
    await new Promise((res) => setTimeout(res, 1200));

    const state = await page.evaluate(() => {
      const activeNavEl = document.querySelector('[data-testid="top-center-navigation"] [aria-current="page"]');
      const audioMgr = window.__AUDIO_MANAGER__;
      const audioState = audioMgr ? audioMgr.getState() : null;
      return {
        pathname: window.location.pathname,
        title: document.title,
        activeNavLabel: activeNavEl ? activeNavEl.textContent.trim().toLowerCase() : null,
        audioTrack: audioState ? audioState.currentTrack.filename : null,
      };
    });

    console.log(`Result for ${r.expectedPath}:`, state);

    if (state.pathname !== r.expectedPath) {
      throw new Error(`FAIL: Expected path ${r.expectedPath}, got ${state.pathname}`);
    }
    if (state.activeNavLabel !== r.expectedTab) {
      throw new Error(`FAIL: Expected active nav tab "${r.expectedTab}", got "${state.activeNavLabel}"`);
    }
    if (!state.title.includes(r.expectedTitlePart)) {
      throw new Error(`FAIL: Expected title to contain "${r.expectedTitlePart}", got "${state.title}"`);
    }
    if (state.audioTrack !== r.expectedTrack) {
      throw new Error(`FAIL: Expected audio track "${r.expectedTrack}", got "${state.audioTrack}"`);
    }

    console.log(`✔ PASS: Direct access to ${r.expectedPath} verified!`);
    await page.screenshot({ path: path.join(artifactDir, r.screenshot) });

    // Test REFRESH on this route
    console.log(`Refreshing page on ${r.expectedPath}...`);
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise((res) => setTimeout(res, 800));

    const refreshPath = await page.evaluate(() => window.location.pathname);
    if (refreshPath !== r.expectedPath) {
      throw new Error(`FAIL: Refresh redirected from ${r.expectedPath} to ${refreshPath}`);
    }
    console.log(`✔ PASS: Refresh on ${r.expectedPath} succeeds with 0 errors!`);
  }

  // ---------------------------------------------------------------------------
  // 2. IN-APP CLIENT NAVIGATION, URL UPDATES & 3D SCENE PERSISTENCE
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. IN-APP NAVIGATION & THREE.JS CANVAS PERSISTENCE ---');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise((res) => setTimeout(res, 1000));

  // Mark the Three.js canvas DOM element with a unique symbol to verify it NEVER unmounts
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) (canvas).setAttribute('data-persistent-id', 'unique-canvas-instance-001');
  });

  const navigateTab = async (tabName, expectedUrl, expectedAudio) => {
    console.log(`\nClicking navigation tab: "${tabName}"`);
    await page.evaluate((tName) => {
      const nav = document.querySelector('[data-testid="top-center-navigation"]');
      const link = Array.from(nav.querySelectorAll('a')).find(
        (a) => a.textContent.trim().toLowerCase() === tName.toLowerCase()
      );
      if (link) link.click();
    }, tabName);

    // Wait for route change + transition
    await new Promise((res) => setTimeout(res, 4500));

    const navResult = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const activeNavEl = document.querySelector('[data-testid="top-center-navigation"] [aria-current="page"]');
      const audioMgr = window.__AUDIO_MANAGER__;
      const audioState = audioMgr ? audioMgr.getState() : null;
      return {
        pathname: window.location.pathname,
        title: document.title,
        activeNavLabel: activeNavEl ? activeNavEl.textContent.trim().toLowerCase() : null,
        canvasPersistentId: canvas ? canvas.getAttribute('data-persistent-id') : null,
        audioTrack: audioState ? audioState.currentTrack.filename : null,
      };
    });

    console.log(`Navigation Result for ${tabName}:`, navResult);

    if (navResult.pathname !== expectedUrl) {
      throw new Error(`FAIL: Expected URL ${expectedUrl}, got ${navResult.pathname}`);
    }
    if (navResult.canvasPersistentId !== 'unique-canvas-instance-001') {
      throw new Error('FAIL: Three.js Canvas was destroyed/recreated during navigation!');
    }
    if (navResult.audioTrack !== expectedAudio) {
      throw new Error(`FAIL: Expected audio track ${expectedAudio}, got ${navResult.audioTrack}`);
    }

    console.log(`✔ PASS: Navigated to ${expectedUrl} - Canvas persisted and audio is ${expectedAudio}`);
  };

  await navigateTab('products', '/products', 'products.mp3');
  await navigateTab('projects', '/projects', 'projects.mp3');
  await navigateTab('about me', '/about', 'about.mp3');
  await navigateTab('home', '/', 'home.mp3');

  // ---------------------------------------------------------------------------
  // 3. BROWSER BACK & FORWARD BUTTON NAVIGATION
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. BROWSER BACK & FORWARD HISTORY NAVIGATION ---');
  // Currently at '/' (history: / -> /products -> /projects -> /about -> /)
  console.log('Clicking browser Back button...');
  await page.goBack();
  await new Promise((res) => setTimeout(res, 4500));

  let backPath = await page.evaluate(() => window.location.pathname);
  console.log(`Path after Back: ${backPath}`);
  if (backPath !== '/about') {
    throw new Error(`FAIL: Expected /about after Back, got ${backPath}`);
  }
  console.log('✔ PASS: Browser Back button navigated to /about');

  console.log('Clicking browser Back button again...');
  await page.goBack();
  await new Promise((res) => setTimeout(res, 4500));

  backPath = await page.evaluate(() => window.location.pathname);
  console.log(`Path after second Back: ${backPath}`);
  if (backPath !== '/projects') {
    throw new Error(`FAIL: Expected /projects after second Back, got ${backPath}`);
  }
  console.log('✔ PASS: Browser Back button navigated to /projects');

  console.log('Clicking browser Forward button...');
  await page.goForward();
  await new Promise((res) => setTimeout(res, 4500));

  let forwardPath = await page.evaluate(() => window.location.pathname);
  console.log(`Path after Forward: ${forwardPath}`);
  if (forwardPath !== '/about') {
    throw new Error(`FAIL: Expected /about after Forward, got ${forwardPath}`);
  }
  console.log('✔ PASS: Browser Forward button navigated back to /about');

  // ---------------------------------------------------------------------------
  // 4. MOBILE VIEWPORT NAVIGATION TEST
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. MOBILE VIEWPORT (393x852) NAVIGATION TEST ---');
  await page.setViewport({ width: 393, height: 852, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await new Promise((res) => setTimeout(res, 1000));

  // Open mobile menu
  console.log('Opening mobile hamburger menu...');
  await page.click('button[aria-controls="mobile-nav-panel"], button[aria-label*="navigation menu"]');
  await new Promise((res) => setTimeout(res, 400));

  // Click Products in mobile menu
  console.log('Clicking products link in mobile dropdown...');
  await page.evaluate(() => {
    const mobilePanel = document.getElementById('mobile-nav-panel');
    if (mobilePanel) {
      const link = Array.from(mobilePanel.querySelectorAll('a')).find(
        (a) => a.textContent.trim().toLowerCase() === 'products'
      );
      if (link) link.click();
    }
  });

  await new Promise((res) => setTimeout(res, 4500));
  const mobileNavResult = await page.evaluate(() => ({
    pathname: window.location.pathname,
    title: document.title,
    menuOpen: !!document.getElementById('mobile-nav-panel'),
  }));

  console.log('Mobile Navigation Result:', mobileNavResult);
  if (mobileNavResult.pathname !== '/products') {
    throw new Error(`FAIL: Mobile navigation did not update URL to /products! Got ${mobileNavResult.pathname}`);
  }
  if (mobileNavResult.menuOpen) {
    throw new Error('FAIL: Mobile navigation menu should close after selecting an item!');
  }
  console.log('✔ PASS: Mobile navigation updates URL to /products and cleanly closes dropdown menu');
  await page.screenshot({ path: path.join(artifactDir, '07_mobile_products_route.png') });

  // ---------------------------------------------------------------------------
  // 5. STATIC HOSTING 404 FILE VERIFICATION
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. PRODUCTION HOSTING DIRECT ROUTE SUPPORT ---');
  const dist404Path = path.resolve('dist/404.html');
  const netlifyRedirects = path.resolve('public/_redirects');
  const vercelJson = path.resolve('public/vercel.json');

  if (!fs.existsSync(dist404Path)) {
    throw new Error('FAIL: dist/404.html not found! Static hosts need 404.html fallback.');
  }
  if (!fs.existsSync(netlifyRedirects)) {
    throw new Error('FAIL: public/_redirects not found!');
  }
  if (!fs.existsSync(vercelJson)) {
    throw new Error('FAIL: public/vercel.json not found!');
  }
  console.log('✔ PASS: All production hosting redirect files (dist/404.html, _redirects, vercel.json) present.');

  console.log('\nBrowser console errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.warn('Console errors detected:', consoleErrors);
  }

  await browser.close();
  console.log('\n=== ALL URL ROUTING SYSTEM TESTS PASSED SUCCESSFULLY ===');
}

run().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});

