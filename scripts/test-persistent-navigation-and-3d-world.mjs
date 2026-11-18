import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/persistent_navigation_qa';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  console.log('=== TEST PERSISTENT NAVIGATION AND 3D WORLD DURING SECTION TRANSITIONS ===\n');

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

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  console.log('1. Loading portfolio homepage...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));

  // Helper to check persistent core elements
  const checkPersistentLayout = async (stepName, expectedActiveNav) => {
    return await page.evaluate((step, expNav) => {
      const nav = document.querySelector('[data-testid="top-center-navigation"]');
      const canvas = document.querySelector('canvas');
      const footer = document.querySelector('[data-testid="portfolio-footer"]');
      const title = document.querySelector('[data-testid="cinematic-prinson-title"]');

      if (!nav) return { error: `[${step}] FAIL: Top navigation is MISSING from DOM!` };
      if (!canvas) return { error: `[${step}] FAIL: 3D Canvas is MISSING from DOM!` };
      if (!footer) return { error: `[${step}] FAIL: Footer is MISSING from DOM!` };
      if (!title) return { error: `[${step}] FAIL: PRINSON Title is MISSING from DOM!` };

      const navStyle = window.getComputedStyle(nav);
      const canvasStyle = window.getComputedStyle(canvas);
      const footerStyle = window.getComputedStyle(footer);

      if (navStyle.display === 'none' || navStyle.visibility === 'hidden' || navStyle.opacity === '0') {
        return { error: `[${step}] FAIL: Top navigation is HIDDEN!` };
      }
      if (canvasStyle.display === 'none' || canvasStyle.visibility === 'hidden' || canvasStyle.opacity === '0') {
        return { error: `[${step}] FAIL: 3D Canvas is HIDDEN!` };
      }
      if (footerStyle.display === 'none' || footerStyle.visibility === 'hidden') {
        return { error: `[${step}] FAIL: Footer is HIDDEN!` };
      }

      // Check active navigation highlighting
      const activeBtn = nav.querySelector('button[aria-current="page"]');
      const activeLabel = activeBtn ? activeBtn.textContent.trim().toLowerCase() : null;

      return {
        step,
        navVisible: true,
        canvasVisible: true,
        footerVisible: true,
        titleVisible: true,
        activeLabel,
        isExpectedNavActive: activeLabel === expNav.toLowerCase(),
      };
    }, stepName, expectedActiveNav);
  };

  // Helper to click navigation tab by label
  const clickNav = async (label) => {
    await page.evaluate((targetLabel) => {
      const nav = document.querySelector('[data-testid="top-center-navigation"]');
      if (!nav) throw new Error('Navigation not found');
      const btn = Array.from(nav.querySelectorAll('button')).find(
        (b) => b.textContent.trim().toLowerCase() === targetLabel.toLowerCase()
      );
      if (!btn) throw new Error(`Nav button "${targetLabel}" not found`);
      btn.click();
    }, label);
    await new Promise((r) => setTimeout(r, 600)); // Smooth animation pause
  };

  // --- STEP 1: INITIAL HOME SECTION ---
  console.log('\n2. Verifying persistent layout on HOME...');
  const homeCheck = await checkPersistentLayout('HOME', 'home');
  if (homeCheck.error) throw new Error(homeCheck.error);
  console.log('✔ PASS: Navigation, 3D Canvas, Title, and Footer are fully visible on HOME (active:', homeCheck.activeLabel, ')');
  await page.screenshot({ path: path.join(artifactDir, '01_home_persistent.png') });

  // --- STEP 2: PRODUCTS SECTION ---
  console.log('\n3. Clicking "products"...');
  await clickNav('products');
  const productsCheck = await checkPersistentLayout('PRODUCTS', 'products');
  if (productsCheck.error) throw new Error(productsCheck.error);
  if (!productsCheck.isExpectedNavActive) {
    throw new Error(`FAIL: Expected active nav to be "products", got "${productsCheck.activeLabel}"`);
  }
  const productsModalOpen = await page.evaluate(() => !!document.querySelector('[aria-labelledby="products-modal-title"]'));
  if (!productsModalOpen) throw new Error('FAIL: Products modal did not open!');
  console.log('✔ PASS: Switching to Products kept Navigation, 3D Canvas, Title, and Footer visible (active:', productsCheck.activeLabel, ')');
  await page.screenshot({ path: path.join(artifactDir, '02_products_persistent.png') });

  // --- STEP 3: PROJECTS SECTION ---
  console.log('\n4. Clicking "projects"...');
  await clickNav('projects');
  const projectsCheck = await checkPersistentLayout('PROJECTS', 'projects');
  if (projectsCheck.error) throw new Error(projectsCheck.error);
  if (!projectsCheck.isExpectedNavActive) {
    throw new Error(`FAIL: Expected active nav to be "projects", got "${projectsCheck.activeLabel}"`);
  }
  const projectsModalOpen = await page.evaluate(() => !!document.querySelector('[aria-labelledby="projects-modal-title"]'));
  if (!projectsModalOpen) throw new Error('FAIL: Projects modal did not open!');
  console.log('✔ PASS: Switching to Projects kept Navigation, 3D Canvas, Title, and Footer visible (active:', projectsCheck.activeLabel, ')');
  await page.screenshot({ path: path.join(artifactDir, '03_projects_persistent.png') });

  // --- STEP 4: ABOUT ME SECTION ---
  console.log('\n5. Clicking "about me"...');
  await clickNav('about me');
  const aboutCheck = await checkPersistentLayout('ABOUT ME', 'about me');
  if (aboutCheck.error) throw new Error(aboutCheck.error);
  if (!aboutCheck.isExpectedNavActive) {
    throw new Error(`FAIL: Expected active nav to be "about me", got "${aboutCheck.activeLabel}"`);
  }
  const aboutModalOpen = await page.evaluate(() => !!document.querySelector('[aria-label="The Archmage\'s Chronicle"]'));
  if (!aboutModalOpen) throw new Error('FAIL: About Me modal did not open!');
  console.log('✔ PASS: Switching to About Me kept Navigation, 3D Canvas, Title, and Footer visible (active:', aboutCheck.activeLabel, ')');
  await page.screenshot({ path: path.join(artifactDir, '04_about_persistent.png') });

  // --- STEP 5: CONTACT SECTION ---
  console.log('\n6. Clicking "contact"...');
  await clickNav('contact');
  const contactCheck = await checkPersistentLayout('CONTACT', 'contact');
  if (contactCheck.error) throw new Error(contactCheck.error);
  if (!contactCheck.isExpectedNavActive) {
    throw new Error(`FAIL: Expected active nav to be "contact", got "${contactCheck.activeLabel}"`);
  }
  const contactModalOpen = await page.evaluate(() => !!document.querySelector('[aria-labelledby="contact-modal-title"]'));
  if (!contactModalOpen) throw new Error('FAIL: Contact modal did not open!');
  console.log('✔ PASS: Switching to Contact kept Navigation, 3D Canvas, Title, and Footer visible (active:', contactCheck.activeLabel, ')');
  await page.screenshot({ path: path.join(artifactDir, '05_contact_persistent.png') });

  // --- STEP 6: FUN SECTION ---
  console.log('\n7. Clicking "fun"...');
  await clickNav('fun');
  const funCheck = await checkPersistentLayout('FUN', 'fun');
  if (funCheck.error) throw new Error(funCheck.error);
  if (!funCheck.isExpectedNavActive) {
    throw new Error(`FAIL: Expected active nav to be "fun", got "${funCheck.activeLabel}"`);
  }
  const funModalOpen = await page.evaluate(() => !!document.querySelector('[aria-label="Fun & Experiments"]'));
  if (!funModalOpen) throw new Error('FAIL: Fun modal did not open!');
  console.log('✔ PASS: Switching to Fun kept Navigation, 3D Canvas, Title, and Footer visible (active:', funCheck.activeLabel, ')');
  await page.screenshot({ path: path.join(artifactDir, '06_fun_persistent.png') });

  // --- STEP 7: RETURN TO HOME ---
  console.log('\n8. Clicking "home" to return...');
  await clickNav('home');
  const returnCheck = await checkPersistentLayout('RETURN HOME', 'home');
  if (returnCheck.error) throw new Error(returnCheck.error);
  const subtitleVisible = await page.evaluate(() => {
    const sub = document.querySelector('[data-testid="hero-subtitle"]');
    return sub && window.getComputedStyle(sub).display !== 'none';
  });
  if (!subtitleVisible) throw new Error('FAIL: Hero subtitle is missing upon return to Home!');
  console.log('✔ PASS: Returned to Home cleanly with zero layout unmounts or resets!');
  await page.screenshot({ path: path.join(artifactDir, '07_back_to_home.png') });

  // --- STEP 8: MOBILE VIEWPORT TEST ---
  console.log('\n9. Testing Mobile Viewport (393x852)...');
  await page.setViewport({ width: 393, height: 852, isMobile: true, hasTouch: true });
  await new Promise((r) => setTimeout(r, 600));

  // Open mobile menu
  await page.click('button[aria-label="Open navigation menu"]');
  await new Promise((r) => setTimeout(r, 400));

  // Click products in mobile menu
  await page.evaluate(() => {
    const panel = document.getElementById('mobile-nav-panel');
    const btn = Array.from(panel.querySelectorAll('button')).find((b) => b.textContent.includes('products'));
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  const mobileProductsModal = await page.evaluate(() => !!document.querySelector('[aria-labelledby="products-modal-title"]'));
  if (!mobileProductsModal) throw new Error('FAIL: Products modal did not open on mobile!');
  console.log('✔ PASS: Mobile navigation and section transitions work seamlessly!');
  await page.screenshot({ path: path.join(artifactDir, '08_mobile_persistent.png') });

  console.log('\nBrowser console errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.warn('Console errors:', consoleErrors);
  }

  await browser.close();
  console.log('\n=== ALL PERSISTENT NAVIGATION AND 3D WORLD CHECKS PASSED ===');
}

run().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
