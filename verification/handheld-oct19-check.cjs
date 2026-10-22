const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const inventory = JSON.parse(fs.readFileSync('verification/handheld-oct19-source.json'));
const catalog = JSON.parse(fs.readFileSync('assets/handhelds/catalog.json'));
const original = JSON.parse(execFileSync('git', ['show', 'HEAD:assets/handhelds/catalog.json']));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const withoutVersion = games => games.map(game => ({ ...game, url: game.url.split('?')[0] }));
assert.deepEqual(withoutVersion(catalog.slice(0, original.length)), withoutVersion(original), 'Existing games and ordering remain unchanged');
for (const item of inventory) {
  assert.equal(hash(fs.readFileSync(item.source)), item.sourceSha256);
  assert.equal(hash(fs.readFileSync(item.file)), item.sourceSha256, 'Game copied byte-for-byte');
  assert.equal(hash(fs.readFileSync(item.artSource)), item.artSha256);
  assert(fs.readFileSync(item.file, 'utf8').includes(fs.readFileSync(item.artSource).toString('base64')));
}
const output = process.env.VERIFICATION_OUTPUT;
if (output) fs.mkdirSync(output, { recursive: true });
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:8771/';
const ready = (page, route) => page.waitForFunction(route => window.arcadeDebug && !arcadeDebug.state.zoomTransition && document.documentElement.dataset.routing === 'ready' && location.pathname.replace(/\/$/, '') === route, route);
const snapshot = (page, name) => output ? page.screenshot({ path: path.join(output, name + '.png') }) : Promise.resolve();

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const mobile of [false, true]) {
      const label = mobile ? 'mobile' : 'desktop';
      const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' });
      const page = await context.newPage(), errors = [], requests = [];
      page.on('pageerror', e => errors.push(e.message));
      // The existing static route bootstrap has no favicon; browsers probe /favicon.ico.
      page.on('console', m => { if (m.type() === 'error' && m.location().url !== new URL('favicon.ico', base).href) errors.push(m.text()); });
      page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
      page.on('requestfailed', r => errors.push(r.failure().errorText + ' ' + r.url()));
      page.on('request', r => { if (!r.url().startsWith('data:')) requests.push(r.url()); });
      const cdp = await context.newCDPSession(page);
      await page.goto(base + 'retro-handheld/games/?debug=1');
      await ready(page, '/retro-handheld/games');
      assert.equal(await page.locator('#handheld-grid a').count(), 25);
      assert(!requests.some(url => /\/assets\/handhelds\/[^/]+\/index.html/.test(url)));
      for (const item of inventory) {
        const soup = item.id.startsWith('soup'), route = '/retro-handheld/games/' + item.id;
        const link = page.locator(`#handheld-grid a[data-game="${item.id}"]`);
        await link.scrollIntoViewIfNeeded();
        await link.locator('img').evaluate(img => img.decode());
        assert.equal(await link.locator('span').evaluate(el => getComputedStyle(el).color), 'rgb(57, 255, 106)');
        const boxes = await link.evaluate(el => { const i = el.querySelector('img').getBoundingClientRect(), t = el.querySelector('span').getBoundingClientRect(); return { bottom: i.bottom, title: t.top }; });
        assert(boxes.title >= boxes.bottom, 'Title appears beneath console image');
        await snapshot(page, `grid-${item.id}-${label}`);
        const before = requests.length;
        if (mobile) await link.tap(); else await link.click();
        await ready(page, route);
        const iframe = page.locator('#handheld-player iframe');
        const game = await (await iframe.elementHandle()).contentFrame();
        await game.waitForFunction(() => window.GAME && LP.States.current === 'title', null, { timeout: 45000 });
        await game.locator('#lp-shell').evaluate(img => img.decode());
        assert.equal(await game.locator('#lp-fail').count(), 0);
        const fit = async () => {
          const r = await game.evaluate(() => { const r = LP.Shell.view.getBoundingClientRect(), s = GAME_CONFIG.shell.view || GAME_CONFIG.shell; return { w: r.width, h: r.height, x: r.x, y: r.y, vw: innerWidth, vh: innerHeight, ratio: s.width / s.height }; });
          assert(Math.abs(r.w / r.h - r.ratio) < .02, 'Original aspect ratio');
          assert(r.x >= -1 && r.y >= -1 && r.x + r.w <= r.vw + 1 && r.y + r.h <= r.vh + 1, 'Complete console fits');
        };
        await fit();
        const input = async (action, key, hold = 100) => {
          if (!mobile) { await page.keyboard.down(key); await page.waitForTimeout(hold); await page.keyboard.up(key); }
          else {
            const p = await game.evaluate(action => {
              const z = GAME_CONFIG.controls.find(z => z.action === action || (z.type === 'dpad' && ['left', 'right', 'up', 'down'].includes(action)));
              let x = z.x, y = z.y;
              if (z.type === 'dpad') { x += action === 'right' ? z.r * .65 : action === 'left' ? -z.r * .65 : 0; y += action === 'down' ? z.r * .65 : action === 'up' ? -z.r * .65 : 0; }
              if (z.type === 'poly') { x = z.points.reduce((n,p) => n+p[0],0)/z.points.length; y = z.points.reduce((n,p) => n+p[1],0)/z.points.length; }
              const r = LP.Shell.device.getBoundingClientRect();
              return { x: r.x + x * r.width / GAME_CONFIG.shell.width, y: r.y + y * r.height / GAME_CONFIG.shell.height };
            }, action);
            const box = await iframe.boundingBox();
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + p.x, y: box.y + p.y }] });
            await page.waitForTimeout(hold);
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          }
          await page.waitForTimeout(100);
        };
        await input('start', 'Enter'); // title -> menu
        await input('start', 'Enter'); // new game -> story
        await game.waitForFunction(() => LP.States.current === 'story');
        await input('start', 'Enter'); // skip story through native control
        await game.waitForFunction(soup => LP.States.current === (soup ? 'playing' : 'play') && (soup ? !!GAME.Game.hero?.onGround : GAME.Game.mode === 'play'), soup, { timeout: 20000 });
        const x = await game.evaluate(soup => soup ? GAME.Game.hero.x : GAME.Game.p.x, soup);
        await input('right', 'ArrowRight', 350);
        assert(await game.evaluate(({soup,x}) => (soup ? GAME.Game.hero.x : GAME.Game.p.x) > x, {soup,x}), 'Movement changes player position');
        if (soup) {
          const y = await game.evaluate(() => GAME.Game.hero.y);
          await input('jump', 'Space');
          assert(await game.evaluate(y => GAME.Game.hero.y < y, y), 'Jump moves hero upward');
          await input('punch', 'z', 45);
          assert(await game.evaluate(() => GAME.Game.hero.atkId > 0), 'Punch triggers attack');
          await input('kick', 'x');
          await input('soup', 'c');
          await game.evaluate(() => window.focus());
          await page.keyboard.press('Backspace');
          await game.waitForFunction(() => LP.States.current === 'paused');
          await page.keyboard.press('Backspace');
          await game.waitForFunction(() => LP.States.current === 'playing');
        } else {
          const shots = await game.evaluate(() => GAME.Game.stats.shots);
          await input('a', 'z', 350);
          assert(await game.evaluate(shots => GAME.Game.stats.shots > shots, shots), 'Laser fire');
          const bombs = await game.evaluate(() => GAME.Game.run.bombs);
          await input('b', 'x');
          assert.equal(await game.evaluate(() => GAME.Game.run.bombs), bombs - 1, 'Bomb launches');
          await input('c', 'c', 45);
          assert(await game.evaluate(() => GAME.Game.p.rollT > 0), 'Barrel roll');
          await game.evaluate(() => window.focus());
          await page.keyboard.down('Backspace');
          assert(await game.evaluate(() => LP.Input.downKeys.has('Backspace')), 'Native select receives Backspace');
          await page.keyboard.up('Backspace');
          assert.equal(await page.locator('#handheld-player iframe').count(), 1);
        }
        await input('start', 'Enter');
        await game.waitForFunction(() => LP.States.current === 'paused');
        await input('start', 'Enter');
        await game.waitForFunction(soup => LP.States.current === (soup ? 'playing' : 'play'), soup);
        await snapshot(page, `game-${item.id}-${label}`);
        for (const viewport of [{width:844,height:390},{width:320,height:640},mobile ? {width:390,height:844} : {width:1440,height:900}]) {
          await page.setViewportSize(viewport); await page.waitForTimeout(200); await fit();
        }
        assert(requests.slice(before).filter(url => /\/assets\/handhelds\/[^/]+\/index.html/.test(url)).every(url => url.includes('/'+item.id+'/')), 'Only selected game loads');
        await game.evaluate(() => window.focus());
        await page.keyboard.press('f');
        await page.waitForFunction(() => document.querySelector('#handheld-player').classList.contains('game-expanded'));
        if (mobile) await page.locator('#handheld-back').tap(); else await page.locator('#handheld-back').click();
        await ready(page, '/retro-handheld/games');
        assert(game.isDetached());
        assert.equal(await page.locator('iframe').count(), 0);
        assert.equal(await page.evaluate(() => document.fullscreenElement), null);
        await page.goForward(); await ready(page, route);
        const forward = await (await page.locator('#handheld-player iframe').elementHandle()).contentFrame();
        await forward.waitForFunction(() => window.GAME && LP.States.current === 'title', null, { timeout: 45000 });
        await page.goBack(); await ready(page, '/retro-handheld/games');
        assert.equal(await page.locator('iframe').count(), 0);
        await page.goForward(); await ready(page, route);
        const beforeReload = await (await page.locator('#handheld-player iframe').elementHandle()).contentFrame();
        await beforeReload.waitForFunction(() => window.GAME && LP.States.current === 'title', null, { timeout: 45000 });
        await page.reload(); await ready(page, route);
        const refreshed = await (await page.locator('#handheld-player iframe').elementHandle()).contentFrame();
        await refreshed.waitForFunction(() => window.GAME && LP.States.current === 'title', null, { timeout:45000 });
        await page.locator('#handheld-back').click(); await ready(page, '/retro-handheld/games');
        assert(refreshed.isDetached());
        console.log(`${label}: ${item.id} gameplay, native controls, resize, fullscreen, unload, history and deep-link refresh passed`);
      }
      await page.locator('#screen-return').click(); await ready(page, '/retro-handheld');
      await page.locator('#screen-return').click();
      await page.waitForFunction(() => arcadeDebug.state.view === 'carousel' && !arcadeDebug.state.zoomTransition);
      assert.deepEqual(errors, []);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
