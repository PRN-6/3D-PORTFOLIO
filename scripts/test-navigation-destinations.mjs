import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/nav_destinations_qa';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  console.log('=== TEST NAVIGATION BUTTON DESTINATIONS ===\n');

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
  console.log('1. Loading portfolio starting screen...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1500));

  // Helper to get nav buttons info
  const getNavButtons = async () => {
    return page.evaluate(() => {
      const nav = document.querySelector('nav[aria-label="Main Navigation"]');
      if (!nav) return [];
      const buttons = Array.from(nav.querySelectorAll('button'));
      return buttons.map((b) => ({
        text: b.textContent.trim(),
        isActive: b.getAttribute('aria-current') === 'page' || b.className.includes('bg-white/15'),
        disabled: b.disabled,
      }));
    });
  };

  // Helper to click a nav button by its label
  const clickNavButton = async (label) => {
    const clicked = await page.evaluate((targetLabel) => {
      const nav = document.querySelector('nav[aria-label="Main Navigation"]');
      if (!nav) return false;
      const buttons = Array.from(nav.querySelectorAll('button'));
      const btn = buttons.find((b) => b.textContent.trim().toLowerCase() === targetLabel.toLowerCase());
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    }, label);

    if (!clicked) {
      throw new Error(`Could not find nav button with label "${label}"`);
    }
  };

  // Helper to wait for transition to target island
  const waitForIsland = async (expectedIsland, timeoutMs = 8000) => {
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

  // --- STEP 1: INITIAL VERIFICATION ON HOME ---
  console.log('\n2. Verifying initial 5 buttons on Hero\'s Home...');
  const initialButtons = await getNavButtons();
  console.log('Detected Navigation Buttons:', initialButtons);

  if (initialButtons.length !== 5) {
    throw new Error(`Expected exactly 5 buttons, found ${initialButtons.length}`);
  }

  const expectedLabels = ['Home', 'Products', 'About Me', 'Projects', 'Contact'];
  expectedLabels.forEach((label, idx) => {
    if (initialButtons[idx].text !== label) {
      throw new Error(`Button ${idx} expected "${label}", found "${initialButtons[idx].text}"`);
    }
  });

  const initialActive = initialButtons.find((b) => b.isActive);
  console.log(`Initial active button: "${initialActive?.text}"`);
  if (initialActive?.text !== 'Home') {
    throw new Error(`Expected Home to be active, found "${initialActive?.text}"`);
  }

  const initialIsland = await page.evaluate(() => window.__CURRENT_ACTIVE_ISLAND__);
  console.log(`Current active 3D Island: "${initialIsland}"`);
  if (initialIsland !== 'HOME') {
    throw new Error(`Expected HOME island, got "${initialIsland}"`);
  }

  const homeScreenshot = path.join(artifactDir, '01_nav_home.png');
  await page.screenshot({ path: homeScreenshot });
  console.log(`Saved screenshot: ${homeScreenshot}`);

  // --- STEP 2: TEST PRODUCTS -> RUNE CREATION WORKSHOP ---
  console.log('\n3. Clicking "Products" -> Expecting Rune Creation Workshop (Island 04)...');
  await clickNavButton('Products');
  await waitForIsland('WORKSHOP');
  await new Promise((r) => setTimeout(r, 800));

  const workshopButtons = await getNavButtons();
  const workshopActive = workshopButtons.find((b) => b.isActive);
  console.log(`Active button after Products click: "${workshopActive?.text}"`);
  if (workshopActive?.text !== 'Products') {
    throw new Error(`Expected "Products" to be active, found "${workshopActive?.text}"`);
  }

  const workshopIsland = await page.evaluate(() => window.__CURRENT_ACTIVE_ISLAND__);
  console.log(`Current active 3D Island: "${workshopIsland}"`);
  if (workshopIsland !== 'WORKSHOP') {
    throw new Error(`Expected WORKSHOP island, got "${workshopIsland}"`);
  }

  const productsScreenshot = path.join(artifactDir, '02_nav_products_workshop.png');
  await page.screenshot({ path: productsScreenshot });
  console.log(`Saved screenshot: ${productsScreenshot}`);

  // --- STEP 3: TEST ABOUT ME -> WHISPERING FOREST ---
  console.log('\n4. Clicking "About Me" -> Expecting Whispering Forest (Island 03)...');
  await clickNavButton('About Me');
  await waitForIsland('FOREST');
  await new Promise((r) => setTimeout(r, 800));

  const forestButtons = await getNavButtons();
  const forestActive = forestButtons.find((b) => b.isActive);
  console.log(`Active button after About Me click: "${forestActive?.text}"`);
  if (forestActive?.text !== 'About Me') {
    throw new Error(`Expected "About Me" to be active, found "${forestActive?.text}"`);
  }

  const forestIsland = await page.evaluate(() => window.__CURRENT_ACTIVE_ISLAND__);
  console.log(`Current active 3D Island: "${forestIsland}"`);
  if (forestIsland !== 'FOREST') {
    throw new Error(`Expected FOREST island, got "${forestIsland}"`);
  }

  const aboutScreenshot = path.join(artifactDir, '03_nav_about_forest.png');
  await page.screenshot({ path: aboutScreenshot });
  console.log(`Saved screenshot: ${aboutScreenshot}`);

  // --- STEP 4: TEST PROJECTS -> GRAND MAGE'S ARCHIVE ---
  console.log('\n5. Clicking "Projects" -> Expecting Grand Mage\'s Archive (Island 02)...');
  await clickNavButton('Projects');
  await waitForIsland('ARCHIVE');
  await new Promise((r) => setTimeout(r, 800));

  const archiveButtons = await getNavButtons();
  const archiveActive = archiveButtons.find((b) => b.isActive);
  console.log(`Active button after Projects click: "${archiveActive?.text}"`);
  if (archiveActive?.text !== 'Projects') {
    throw new Error(`Expected "Projects" to be active, found "${archiveActive?.text}"`);
  }

  const archiveIsland = await page.evaluate(() => window.__CURRENT_ACTIVE_ISLAND__);
  console.log(`Current active 3D Island: "${archiveIsland}"`);
  if (archiveIsland !== 'ARCHIVE') {
    throw new Error(`Expected ARCHIVE island, got "${archiveIsland}"`);
  }

  const projectsScreenshot = path.join(artifactDir, '04_nav_projects_archive.png');
  await page.screenshot({ path: projectsScreenshot });
  console.log(`Saved screenshot: ${projectsScreenshot}`);

  // --- STEP 5: TEST RETURN TO HOME -> HERO'S HOME ---
  console.log('\n6. Clicking "Home" -> Expecting Hero\'s Home (Island 01)...');
  await clickNavButton('Home');
  await waitForIsland('HOME');
  await new Promise((r) => setTimeout(r, 800));

  const returnHomeButtons = await getNavButtons();
  const returnHomeActive = returnHomeButtons.find((b) => b.isActive);
  console.log(`Active button after Home click: "${returnHomeActive?.text}"`);
  if (returnHomeActive?.text !== 'Home') {
    throw new Error(`Expected "Home" to be active, found "${returnHomeActive?.text}"`);
  }

  const returnedIsland = await page.evaluate(() => window.__CURRENT_ACTIVE_ISLAND__);
  console.log(`Current active 3D Island: "${returnedIsland}"`);
  if (returnedIsland !== 'HOME') {
    throw new Error(`Expected HOME island, got "${returnedIsland}"`);
  }

  const returnedScreenshot = path.join(artifactDir, '05_nav_home_returned.png');
  await page.screenshot({ path: returnedScreenshot });
  console.log(`Saved screenshot: ${returnedScreenshot}`);

  // --- STEP 6: TEST CONTACT MODAL ---
  console.log('\n7. Clicking "Contact" -> Expecting Contact Modal...');
  await clickNavButton('Contact');
  await new Promise((r) => setTimeout(r, 600));

  const modalInfo = await page.evaluate(() => {
    // Look for contact modal elements
    const heading = document.querySelector('h2, h3');
    const emailInput = document.querySelector('input[type="email"], input[name="email"]');
    const closeBtn = document.querySelector('button[aria-label="Close modal"], button[aria-label="Close"]');
    return {
      hasModal: !!(heading || emailInput),
      headingText: heading?.textContent?.trim() || '',
      hasEmailInput: !!emailInput,
      hasCloseBtn: !!closeBtn,
    };
  });
  console.log('Contact Modal info:', modalInfo);

  const contactScreenshot = path.join(artifactDir, '06_nav_contact_modal.png');
  await page.screenshot({ path: contactScreenshot });
  console.log(`Saved screenshot: ${contactScreenshot}`);

  // Close Contact Modal
  console.log('\n8. Closing Contact Modal...');
  const closed = await page.evaluate(() => {
    const closeBtn = document.querySelector('button[aria-label="Close modal"], button[aria-label="Close"]');
    if (closeBtn) {
      closeBtn.click();
      return true;
    }
    // Alternatively press Escape
    return false;
  });

  if (!closed) {
    await page.keyboard.press('Escape');
  }
  await new Promise((r) => setTimeout(r, 500));

  const postCloseButtons = await getNavButtons();
  const postCloseActive = postCloseButtons.find((b) => b.isActive);
  console.log(`Active button after closing Contact: "${postCloseActive?.text}"`);
  if (postCloseActive?.text !== 'Home') {
    throw new Error(`Expected active button to return to "Home", found "${postCloseActive?.text}"`);
  }

  const closedScreenshot = path.join(artifactDir, '07_nav_contact_closed.png');
  await page.screenshot({ path: closedScreenshot });
  console.log(`Saved screenshot: ${closedScreenshot}`);

  // Check for any console errors
  console.log('\n9. Checking console errors...');
  if (consoleErrors.length > 0) {
    console.warn(`WARNING: Encountered ${consoleErrors.length} console errors:`, consoleErrors);
  } else {
    console.log('ZERO console errors detected! Perfect.');
  }

  console.log('\n=== ALL NAVIGATION DESTINATION TESTS PASSED SUCCESSFULLY! ===');
  await browser.close();
}

run().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
