import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:/Users/prins/.gemini/antigravity/brain/e4c6333e-6fb0-498b-a912-02511bcc08f6/music_player_top_left_qa';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  console.log('=== TEST MUSIC PLAYER FIXED TOP-LEFT (DESKTOP & MOBILE) ===\n');

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

  // ---------------------------------------------------------------------------
  // 1. DESKTOP VIEWPORT TEST (1440 x 900)
  // ---------------------------------------------------------------------------
  console.log('1. Testing Desktop Viewport (1440x900)...');
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1500));

  const desktopMetrics = await page.evaluate(() => {
    const player = document.querySelector('[data-testid="music-controls"]');
    const centerNav = document.querySelector('[data-testid="top-center-navigation"]');
    const resetBtn = document.querySelector('button[aria-label="Reset camera view"]');
    if (!player) return null;

    const r = player.getBoundingClientRect();
    const navRect = centerNav ? centerNav.getBoundingClientRect() : null;
    const resetRect = resetBtn ? resetBtn.getBoundingClientRect() : null;

    const trackName = document.querySelector('[data-testid="current-track-name"]');
    const playToggle = document.querySelector('[data-testid="audio-play-toggle"]');
    const muteToggle = document.querySelector('[data-testid="audio-mute-toggle"]');
    const slider = document.querySelector('[data-testid="audio-volume-slider"]');

    return {
      rect: { left: r.left, top: r.top, right: r.right, width: r.width, height: r.height },
      isFixedTopLeft: r.left < 50 && r.top < 50,
      hasRequiredElements: !!(trackName && playToggle && muteToggle && slider),
      trackText: trackName ? trackName.textContent : null,
      centerNavDistance: navRect ? navRect.left - r.right : null,
      resetBtnDistance: resetRect ? resetRect.left - r.right : null,
      zIndex: parseInt(window.getComputedStyle(player).zIndex || '0', 10),
    };
  });

  console.log('Desktop Music Player Metrics:', desktopMetrics);
  if (!desktopMetrics || !desktopMetrics.isFixedTopLeft) {
    throw new Error(`FAIL: Desktop player not in top-left! Left: ${desktopMetrics?.rect.left}, Top: ${desktopMetrics?.rect.top}`);
  }
  if (!desktopMetrics.hasRequiredElements) {
    throw new Error('FAIL: Missing required music control elements on desktop!');
  }
  if (desktopMetrics.centerNavDistance !== null && desktopMetrics.centerNavDistance < 50) {
    throw new Error(`FAIL: Too close or overlapping center navigation! Distance: ${desktopMetrics.centerNavDistance}px`);
  }
  if (desktopMetrics.zIndex < 30) {
    throw new Error(`FAIL: Music player zIndex is too low (${desktopMetrics.zIndex}) to stay above 3D scene!`);
  }
  console.log('✔ PASS: Desktop music player fixed in top-left with ample clearance and full controls');
  await page.screenshot({ path: path.join(artifactDir, '01_desktop_top_left_player.png') });

  // ---------------------------------------------------------------------------
  // 2. MOBILE VIEWPORT TEST (393 x 852 - iPhone 14 / modern smartphone)
  // ---------------------------------------------------------------------------
  console.log('\n2. Testing Mobile Viewport (393x852)...');
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await new Promise((r) => setTimeout(r, 800));

  const mobileMetrics = await page.evaluate(() => {
    const player = document.querySelector('[data-testid="music-controls"]');
    const mobileNavWrapper = document.querySelector('.md\\:hidden.fixed.top-0.right-0');
    if (!player) return null;

    const r = player.getBoundingClientRect();
    const rightNavRect = mobileNavWrapper ? mobileNavWrapper.getBoundingClientRect() : null;

    const trackName = document.querySelector('[data-testid="current-track-name"]');
    const playToggle = document.querySelector('[data-testid="audio-play-toggle"]');
    const muteToggle = document.querySelector('[data-testid="audio-mute-toggle"]');
    const slider = document.querySelector('[data-testid="audio-volume-slider"]');

    // Clearance to top-right hamburger/reset controls
    const clearance = rightNavRect ? rightNavRect.left - r.right : window.innerWidth - r.right;

    return {
      rect: { left: r.left, top: r.top, right: r.right, width: r.width, height: r.height },
      isFixedTopLeft: r.left < 40 && r.top < 40,
      visible: r.width > 0 && r.height > 0,
      trackText: trackName ? trackName.textContent : null,
      trackVisible: trackName ? window.getComputedStyle(trackName).display !== 'none' : false,
      clearanceToRightControls: clearance,
      noOverlapWithRightControls: clearance > 20,
      hasControls: !!(playToggle && muteToggle && slider),
    };
  });

  console.log('Mobile Music Player Metrics (393x852):', mobileMetrics);
  if (!mobileMetrics || !mobileMetrics.isFixedTopLeft || !mobileMetrics.visible) {
    throw new Error('FAIL: Mobile music player not visible in top-left!');
  }
  if (!mobileMetrics.noOverlapWithRightControls) {
    throw new Error(`FAIL: Mobile music player overlaps top-right menu! Clearance: ${mobileMetrics.clearanceToRightControls}px`);
  }
  if (!mobileMetrics.trackVisible) {
    throw new Error('FAIL: Track name hidden on mobile! It should be visible and compact.');
  }
  console.log(`✔ PASS: Mobile music player visible in top-left with ${mobileMetrics.clearanceToRightControls.toFixed(1)}px clearance from top-right buttons`);
  await page.screenshot({ path: path.join(artifactDir, '02_mobile_393_top_left_player.png') });

  // ---------------------------------------------------------------------------
  // 3. ULTRA-COMPACT MOBILE VIEWPORT TEST (360 x 780 - Galaxy S8 / Android Small)
  // ---------------------------------------------------------------------------
  console.log('\n3. Testing Small Mobile Viewport (360x780)...');
  await page.setViewport({ width: 360, height: 780, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await new Promise((r) => setTimeout(r, 600));

  const smallMobileMetrics = await page.evaluate(() => {
    const player = document.querySelector('[data-testid="music-controls"]');
    const mobileNavWrapper = document.querySelector('.md\\:hidden.fixed.top-0.right-0');
    if (!player) return null;

    const r = player.getBoundingClientRect();
    const rightNavRect = mobileNavWrapper ? mobileNavWrapper.getBoundingClientRect() : null;
    const clearance = rightNavRect ? rightNavRect.left - r.right : window.innerWidth - r.right;

    return {
      width: r.width,
      right: r.right,
      clearance,
      fitsScreen: r.right < window.innerWidth,
      noOverlap: clearance > 15,
    };
  });

  console.log('Small Mobile Metrics (360x780):', smallMobileMetrics);
  if (!smallMobileMetrics.noOverlap) {
    throw new Error(`FAIL: Small mobile player overlaps top-right controls! Clearance: ${smallMobileMetrics.clearance}px`);
  }
  console.log(`✔ PASS: Small mobile screen fits player with ${smallMobileMetrics.clearance.toFixed(1)}px clearance.`);
  await page.screenshot({ path: path.join(artifactDir, '03_mobile_360_top_left_player.png') });

  // ---------------------------------------------------------------------------
  // 4. TEST FUNCTIONALITY: PLAY / PAUSE / MUTE / SLIDER IN TOP-LEFT POSITION
  // ---------------------------------------------------------------------------
  console.log('\n4. Testing Audio Interaction in new Top-Left position...');
  // Unlock audio
  await page.evaluate(() => window.__AUDIO_MANAGER__.unlockAudio());
  await new Promise((r) => setTimeout(r, 400));

  // Toggle pause
  await page.click('[data-testid="audio-play-toggle"]');
  await new Promise((r) => setTimeout(r, 300));
  let state = await page.evaluate(() => window.__AUDIO_MANAGER__.getState());
  if (state.isPlaying) throw new Error('FAIL: Top-left play toggle failed to pause!');

  // Toggle resume
  await page.click('[data-testid="audio-play-toggle"]');
  await new Promise((r) => setTimeout(r, 300));
  state = await page.evaluate(() => window.__AUDIO_MANAGER__.getState());
  if (!state.isPlaying) throw new Error('FAIL: Top-left play toggle failed to resume!');

  // Toggle mute
  await page.click('[data-testid="audio-mute-toggle"]');
  await new Promise((r) => setTimeout(r, 300));
  state = await page.evaluate(() => window.__AUDIO_MANAGER__.getState());
  if (!state.isMuted) throw new Error('FAIL: Top-left mute toggle failed to mute!');

  // Toggle unmute
  await page.click('[data-testid="audio-mute-toggle"]');
  await new Promise((r) => setTimeout(r, 300));
  state = await page.evaluate(() => window.__AUDIO_MANAGER__.getState());
  if (state.isMuted) throw new Error('FAIL: Top-left mute toggle failed to unmute!');

  console.log('✔ PASS: Audio controls fully functional in top-left position');

  // ---------------------------------------------------------------------------
  // 5. TEST 3D ROTATION: PLAYER REMAINS FIXED AND UNAFFECTED
  // ---------------------------------------------------------------------------
  console.log('\n5. Testing 3D rotation integrity with Top-Left player...');
  const playerPosBefore = await page.evaluate(() => {
    const r = document.querySelector('[data-testid="music-controls"]').getBoundingClientRect();
    return { top: r.top, left: r.left };
  });

  await page.mouse.move(200, 300);
  await page.mouse.down();
  await page.mouse.move(300, 350, { steps: 5 });
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 400));

  const playerPosAfter = await page.evaluate(() => {
    const r = document.querySelector('[data-testid="music-controls"]').getBoundingClientRect();
    return { top: r.top, left: r.left };
  });

  if (playerPosBefore.top !== playerPosAfter.top || playerPosBefore.left !== playerPosAfter.left) {
    throw new Error('FAIL: Music player position moved during 3D rotation!');
  }
  console.log('✔ PASS: Music player remains strictly fixed to viewport during 3D interactions');

  await browser.close();
  console.log('\n=== ALL TOP-LEFT MUSIC PLAYER CHECKS PASSED ===');
}

run().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});

