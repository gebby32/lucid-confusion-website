// Real-time audio/graduation smoke check. Visibility events are simulated, not physical app switching.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:8771/';
const output = process.env.VERIFICATION_OUTPUT;
if (output) fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + 'retro-handheld/games/soup-squirrel-the-ninja-squire/?debug=1');
    await page.waitForFunction(() => window.arcadeDebug && !arcadeDebug.state.zoomTransition && document.documentElement.dataset.routing === 'ready');
    const iframe = page.locator('#handheld-player iframe');
    const frame = await (await iframe.elementHandle()).contentFrame();
    await frame.waitForFunction(() => window.GAME && LP.States.current === 'title');
    await page.keyboard.press('Enter'); await frame.waitForFunction(() => LP.States.current === 'menu');
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('z');
    await frame.waitForFunction(() => LP.States.current === 'tutorial');
    await page.keyboard.press('z');
    await frame.waitForFunction(() => LP.States.current === 'playing');
    await page.keyboard.down('ArrowRight'); await page.waitForTimeout(150); await page.keyboard.up('ArrowRight');
    await frame.waitForFunction(() => !!Voice.buffers.gt_hello);
    assert(await frame.evaluate(() => LP.Audio.ctx.state === 'running'));

    // Set up Gary's graduation encounter; timing itself runs on the normal real-time loop.
    const duration = await frame.evaluate(() => {
      Voice.stop();
      for (const p of Props.props) { if (p.type === 'npc' && p.voice !== 'gt_grad2') { p.said = true; p.pend = false; } }
      const g = Props.props.find(p => p.voice === 'gt_grad2');
      Game.placeHero(g.x - 20, g.y);
      return Voice.duration('gt_grad2');
    });
    await frame.waitForFunction(() => !!Voice.buffers.gt_grad2 && Voice.talking());
    const began = Date.now();
    await page.waitForTimeout(500);
    // Exercise the shipped visibility handlers without changing the game or its source.
    await frame.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
    await frame.waitForFunction(() => LP.States.current === 'paused' && LP.Audio.ctx.state === 'suspended');
    const pausedTime = await frame.evaluate(() => Game.lstats.time);
    await page.waitForTimeout(600);
    assert.equal(await frame.evaluate(() => Game.lstats.time), pausedTime);
    await frame.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
    await frame.waitForFunction(() => LP.Audio.ctx.state === 'running');
    await page.keyboard.press('Enter');
    await frame.waitForFunction(() => LP.States.current === 'diploma', null, { timeout: Math.ceil(duration * 1000 + 12000) });
    const elapsed = Date.now() - began;
    assert(elapsed >= duration * 1000 - 500, 'Voiced graduation waits for its line');
    assert(await frame.evaluate(() => LP.Store.get('tut2d')));
    if (output) await page.screenshot({ path: path.join(output, 'tutorial-real-time-diploma.png') });
    console.log(`Voiced 2D graduation passed in ${(elapsed / 1000).toFixed(1)}s for a ${duration.toFixed(1)}s line; simulated background pauses game/audio and resume completes`);
    // Unload while the diploma voice is playing; its audio context belongs to the detached document.
    await frame.waitForFunction(() => !!Voice.buffers.gt_dip);
    await page.locator('#handheld-back').click();
    await page.waitForFunction(() => !arcadeDebug.state.zoomTransition && location.pathname.replace(/\/$/, '') === '/retro-handheld/games');
    assert(frame.isDetached());
    assert.equal(await iframe.count(), 0);
    assert.deepEqual(errors, []);
    console.log('Active tutorial audio document unloads on cabinet return; no runtime errors');
    await context.close();
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
