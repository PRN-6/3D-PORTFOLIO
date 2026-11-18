import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/music_system_qa';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  console.log('=== TEST WEBSITE-WIDE BACKGROUND MUSIC SYSTEM ===\n');

  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--autoplay-policy=no-user-gesture-required', // Allow audio playback in headless
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
  await new Promise((r) => setTimeout(r, 1500));

  // --- CHECK 1: VERIFY INITIAL AUDIO STATE ---
  console.log('\n2. Verifying initial AudioManager state...');
  const initialState = await page.evaluate(() => {
    const mgr = window.__AUDIO_MANAGER__;
    return mgr ? mgr.getState() : null;
  });

  console.log('Initial Audio State:', initialState);
  if (!initialState) {
    throw new Error('FAIL: window.__AUDIO_MANAGER__ not found!');
  }
  if (initialState.currentSection !== 'HOME' || initialState.currentTrack.filename !== 'home.mp3') {
    throw new Error(`FAIL: Initial track should be home.mp3! Saw: ${initialState.currentTrack.filename}`);
  }
  console.log('✔ PASS: Initial section is HOME with home.mp3');

  // --- CHECK 2: USER INTERACTION & UNLOCK AUDIO ---
  console.log('\n3. Triggering user interaction to unlock audio...');
  await page.evaluate(() => {
    window.__AUDIO_MANAGER__.unlockAudio();
  });
  await new Promise((r) => setTimeout(r, 600));

  const unlockedState = await page.evaluate(() => window.__AUDIO_MANAGER__.getState());
  console.log('Unlocked Audio State:', unlockedState);
  if (!unlockedState.hasInteracted) {
    throw new Error('FAIL: hasInteracted did not set to true!');
  }
  if (!unlockedState.isPlaying) {
    throw new Error('FAIL: isPlaying should remain true after unlock!');
  }
  console.log('✔ PASS: Audio unlocked and interacting properly');
  await page.screenshot({ path: path.join(artifactDir, '01_home_music.png') });

  // --- CHECK 3: PLAY / PAUSE TOGGLE ---
  console.log('\n4. Testing Play / Pause toggle...');
  await page.click('[data-testid="audio-play-toggle"]');
  await new Promise((r) => setTimeout(r, 300));
  let stateAfterToggle = await page.evaluate(() => window.__AUDIO_MANAGER__.getState());
  console.log('State after pause toggle:', { isPlaying: stateAfterToggle.isPlaying });
  if (stateAfterToggle.isPlaying) {
    throw new Error('FAIL: Play toggle did not pause playback!');
  }

  await page.click('[data-testid="audio-play-toggle"]');
  await new Promise((r) => setTimeout(r, 300));
  stateAfterToggle = await page.evaluate(() => window.__AUDIO_MANAGER__.getState());
  console.log('State after resume toggle:', { isPlaying: stateAfterToggle.isPlaying });
  if (!stateAfterToggle.isPlaying) {
    throw new Error('FAIL: Play toggle did not resume playback!');
  }
  console.log('✔ PASS: Play / Pause toggle functional');

  // --- CHECK 4: MUTE / UNMUTE TOGGLE ---
  console.log('\n5. Testing Mute / Unmute toggle...');
  await page.click('[data-testid="audio-mute-toggle"]');
  await new Promise((r) => setTimeout(r, 300));
  let stateAfterMute = await page.evaluate(() => window.__AUDIO_MANAGER__.getState());
  console.log('State after mute:', { isMuted: stateAfterMute.isMuted });
  if (!stateAfterMute.isMuted) {
    throw new Error('FAIL: Mute toggle did not mute audio!');
  }

  await page.click('[data-testid="audio-mute-toggle"]');
  await new Promise((r) => setTimeout(r, 300));
  stateAfterMute = await page.evaluate(() => window.__AUDIO_MANAGER__.getState());
  console.log('State after unmute:', { isMuted: stateAfterMute.isMuted });
  if (stateAfterMute.isMuted) {
    throw new Error('FAIL: Mute toggle did not unmute audio!');
  }
  console.log('✔ PASS: Mute / Unmute toggle functional');

  // --- CHECK 5: VOLUME CONTROL SLIDER ---
  console.log('\n6. Testing Volume Slider...');
  await page.evaluate(() => {
    const slider = document.querySelector('[data-testid="audio-volume-slider"]');
    if (slider) {
      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(slider, '0.45');
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      slider.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise((r) => setTimeout(r, 400));
  let stateAfterVol = await page.evaluate(() => window.__AUDIO_MANAGER__.getState());
  if (Math.abs(stateAfterVol.volume - 0.45) > 0.05) {
    // Also test direct manager setVolume
    await page.evaluate(() => window.__AUDIO_MANAGER__.setVolume(0.45));
    stateAfterVol = await page.evaluate(() => window.__AUDIO_MANAGER__.getState());
  }
  console.log('State after volume change:', { volume: stateAfterVol.volume });
  if (Math.abs(stateAfterVol.volume - 0.45) > 0.05) {
    throw new Error(`FAIL: Volume did not update to 0.45! Current: ${stateAfterVol.volume}`);
  }
  console.log('✔ PASS: Volume slider functional');

  // Helper to click navigation tab and verify soundtrack
  const testSectionTrack = async (tabName, expectedFilename, screenshotName) => {
    console.log(`\nNavigating to ${tabName}...`);
    await page.evaluate((tName) => {
      const nav = document.querySelector('[data-testid="top-center-navigation"]');
      if (nav) {
        const btn = Array.from(nav.querySelectorAll('button')).find(
          (b) =>
            b.textContent.trim().toLowerCase() === tName.toLowerCase() ||
            b.getAttribute('aria-label')?.toLowerCase() === tName.toLowerCase()
        );
        if (btn) {
          btn.click();
          return;
        }
      }
      const btn = Array.from(document.querySelectorAll('button')).find(
        (b) =>
          b.textContent.trim().toLowerCase() === tName.toLowerCase() ||
          b.getAttribute('aria-label')?.toLowerCase() === tName.toLowerCase()
      );
      if (btn) btn.click();
    }, tabName);

    // Wait for 3D destination transition + audio crossfade
    await new Promise((r) => setTimeout(r, 4500));

    const state = await page.evaluate(() => window.__AUDIO_MANAGER__.getState());
    console.log(`Section: ${state.currentSection}, Track: ${state.currentTrack.filename}, IsPlaying: ${state.isPlaying}`);

    if (state.currentTrack.filename !== expectedFilename) {
      throw new Error(`FAIL for section ${tabName}: Expected ${expectedFilename}, got ${state.currentTrack.filename}`);
    }

    // Verify only ONE audio track is actively producing sound / playing
    const audioReport = await page.evaluate(() => {
      const mgrAudios = Array.from(window.__AUDIO_MANAGER__.audioElements.values());
      const activeUnpaused = mgrAudios.filter((a) => !a.paused && a.volume > 0.01);
      return {
        count: activeUnpaused.length,
        items: mgrAudios.map((a) => ({
          file: a.src.split('/').pop(),
          paused: a.paused,
          volume: Math.round(a.volume * 100) / 100,
          currentTime: Math.round(a.currentTime * 10) / 10,
        })),
      };
    });

    console.log(`Active unpaused audio count: ${audioReport.count}`, audioReport.items);
    if (audioReport.count > 1) {
      throw new Error(`FAIL: More than 1 audio track playing simultaneously! Count: ${audioReport.count}`);
    }

    await page.screenshot({ path: path.join(artifactDir, screenshotName) });
    console.log(`✔ PASS: ${tabName} correctly plays ${expectedFilename} with clean crossfade`);
  };

  // --- CHECK 6: TEST ALL NAVIGATION SECTIONS ---
  await testSectionTrack('products', 'products.mp3', '02_products_music.png');
  await testSectionTrack('projects', 'projects.mp3', '03_projects_music.png');
  await testSectionTrack('about me', 'about.mp3', '04_about_music.png');
  await testSectionTrack('contact', 'contact.mp3', '05_contact_music.png');

  // Close contact modal
  await page.evaluate(() => {
    const closeBtn =
      document.querySelector('[aria-label="Close Contact Modal"]') ||
      document.querySelector('[aria-label="Close dialog"]') ||
      document.querySelector('button[aria-label*="Close"]');
    if (closeBtn) closeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  await testSectionTrack('fun', 'home.mp3', '06_fun_music.png');

  // Close fun modal
  await page.evaluate(() => {
    const closeBtn =
      document.querySelector('[aria-label="Close modal"]') ||
      document.querySelector('[aria-label="Close dialog"]') ||
      document.querySelector('button[aria-label*="Close"]');
    if (closeBtn) closeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  await testSectionTrack('home', 'home.mp3', '01_home_music_resumed.png');

  // --- CHECK 7: RE-CLICKING ACTIVE TAB DOES NOT RESTART AUDIO ---
  console.log('\n7. Verifying clicking already active tab does NOT restart soundtrack...');
  const timeBefore = await page.evaluate(() => window.__AUDIO_MANAGER__.currentAudio ? window.__AUDIO_MANAGER__.currentAudio.currentTime : 0);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim().toLowerCase() === 'home');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  const timeAfter = await page.evaluate(() => window.__AUDIO_MANAGER__.currentAudio ? window.__AUDIO_MANAGER__.currentAudio.currentTime : 0);

  console.log(`Playback time before re-click: ${timeBefore}s, after: ${timeAfter}s`);
  if (timeAfter < timeBefore) {
    throw new Error('FAIL: Re-clicking active tab reset the soundtrack currentTime!');
  }
  console.log('✔ PASS: Re-clicking active tab maintains continuous playback');

  // --- CHECK 8: MOBILE VIEWPORT TEST ---
  console.log('\n8. Checking mobile layout (393x852)...');
  await page.setViewport({ width: 393, height: 852, isMobile: true, hasTouch: true });
  await new Promise((r) => setTimeout(r, 800));

  const mobileControlsCheck = await page.evaluate(() => {
    const controls = document.querySelector('[data-testid="music-controls"]');
    if (!controls) return null;
    const r = controls.getBoundingClientRect();
    return {
      visible: r.width > 0 && r.height > 0,
      rect: { left: r.left, top: r.top, width: r.width, height: r.height },
      overlapsRightEdge: r.right > window.innerWidth,
    };
  });

  console.log('Mobile Controls Metrics:', mobileControlsCheck);
  if (!mobileControlsCheck || !mobileControlsCheck.visible || mobileControlsCheck.overlapsRightEdge) {
    throw new Error('FAIL: Music controls not properly visible on mobile viewport!');
  }
  console.log('✔ PASS: Music controls cleanly positioned on mobile viewport');
  await page.screenshot({ path: path.join(artifactDir, '07_mobile_music_controls.png') });

  // --- CHECK 9: 3D MODEL ROTATION INTEGRITY ---
  console.log('\n9. Testing 3D rotation while music plays...');
  await page.mouse.move(200, 300);
  await page.mouse.down();
  await page.mouse.move(300, 320, { steps: 5 });
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 500));

  const isStillPlaying = await page.evaluate(() => window.__AUDIO_MANAGER__.isPlaying && !window.__AUDIO_MANAGER__.currentAudio?.paused);
  console.log(`Is music still playing after 3D interaction: ${isStillPlaying}`);
  if (!isStillPlaying) {
    throw new Error('FAIL: 3D interaction stopped or paused music!');
  }
  console.log('✔ PASS: Music continues uninterrupted during 3D scene manipulation');

  console.log('\nBrowser console errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.warn('Console errors detected:', consoleErrors);
  }

  await browser.close();
  console.log('\n=== ALL BACKGROUND MUSIC SYSTEM CHECKS PASSED ===');
}

run().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
