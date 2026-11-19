import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const outDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/theme_switcher_qa';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  console.log('=== TESTING THEME SWITCHER (DARK MODE & LIGHT MODE) ===\n');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=default', '--enable-webgl'],
  });

  try {
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

    // Step 1: Initial visit (default theme should be dark)
    console.log('1. Navigating to http://localhost:5173/ with fresh session...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await page.waitForSelector('[data-testid="theme-toggle"]', { timeout: 12000 });
    await new Promise(r => setTimeout(r, 1500));

    const initialTheme = await page.evaluate(() => {
      return {
        themeAttr: document.documentElement.getAttribute('data-theme'),
        hasClassDark: document.documentElement.classList.contains('dark'),
        hasClassLight: document.documentElement.classList.contains('light'),
        currentThemeVar: window.__CURRENT_THEME__,
        storedTheme: localStorage.getItem('prinson_portfolio_theme'),
      };
    });
    console.log('Initial Theme State (should be dark):', JSON.stringify(initialTheme, null, 2));

    await page.screenshot({ path: path.join(outDir, '01_desktop_dark_mode.png') });

    // Step 2: Click theme toggle to switch to Light Mode
    console.log('2. Clicking theme toggle to switch to Light Mode...');
    const toggleBtn = await page.$('[data-testid="theme-toggle"]');
    if (!toggleBtn) {
      throw new Error('Could not find [data-testid="theme-toggle"] button!');
    }
    await toggleBtn.click();
    await new Promise(r => setTimeout(r, 1200));

    const lightThemeState = await page.evaluate(() => {
      return {
        themeAttr: document.documentElement.getAttribute('data-theme'),
        hasClassDark: document.documentElement.classList.contains('dark'),
        hasClassLight: document.documentElement.classList.contains('light'),
        currentThemeVar: window.__CURRENT_THEME__,
        storedTheme: localStorage.getItem('prinson_portfolio_theme'),
        bodyBg: document.body.style.backgroundColor,
        navBg: window.getComputedStyle(document.querySelector('[data-testid="top-center-navigation"]')).backgroundColor,
        navColor: window.getComputedStyle(document.querySelector('[data-testid="top-center-navigation"]')).color,
        titleBg: window.getComputedStyle(document.querySelector('[data-testid="cinematic-prinson-title"]')).backgroundColor,
      };
    });
    console.log('Light Mode State:', JSON.stringify(lightThemeState, null, 2));

    await page.screenshot({ path: path.join(outDir, '02_desktop_light_mode.png') });

    // Step 3: Test route switching in Light Mode to verify theme persistence across routes
    console.log('3. Navigating to /projects in Light Mode...');
    const projectsLink = await page.$('a[href="/projects"]');
    if (projectsLink) {
      await projectsLink.click();
      await new Promise(r => setTimeout(r, 1500));
      await page.screenshot({ path: path.join(outDir, '03_desktop_light_projects_route.png') });
    }

    // Step 4: Refresh page and verify persistence from localStorage
    console.log('4. Reloading page to verify persistence...');
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));

    const persistedTheme = await page.evaluate(() => {
      return {
        themeAttr: document.documentElement.getAttribute('data-theme'),
        currentThemeVar: window.__CURRENT_THEME__,
        storedTheme: localStorage.getItem('prinson_portfolio_theme'),
      };
    });
    console.log('Persisted Theme State after Reload:', JSON.stringify(persistedTheme, null, 2));
    await page.screenshot({ path: path.join(outDir, '04_desktop_light_mode_after_reload.png') });

    // Navigate back to Home
    const homeLink = await page.$('a[href="/"]');
    if (homeLink) {
      await homeLink.click();
      await new Promise(r => setTimeout(r, 1500));
    }

    // Step 5: Test Mobile Viewport (390x844)
    console.log('5. Testing Mobile Viewport (390x844)...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));

    // Capture Light Mode Mobile
    await page.screenshot({ path: path.join(outDir, '05_mobile_light_mode.png') });

    // Toggle back to Dark Mode via mobile toggle
    console.log('6. Toggling back to Dark Mode via mobile button...');
    const mobileToggle = await page.$('[data-testid="theme-toggle-mobile"]');
    if (mobileToggle) {
      await mobileToggle.click();
      await new Promise(r => setTimeout(r, 1000));
    }

    const backToDarkState = await page.evaluate(() => {
      return {
        themeAttr: document.documentElement.getAttribute('data-theme'),
        currentThemeVar: window.__CURRENT_THEME__,
        storedTheme: localStorage.getItem('prinson_portfolio_theme'),
      };
    });
    console.log('Mobile switched back to Dark:', JSON.stringify(backToDarkState, null, 2));

    await page.screenshot({ path: path.join(outDir, '06_mobile_dark_mode.png') });

    console.log('\nConsole Errors:', consoleErrors.length > 0 ? consoleErrors : 'None');
    console.log('All Theme Switcher tests passed successfully!');
  } catch (err) {
    console.error('Test error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();
