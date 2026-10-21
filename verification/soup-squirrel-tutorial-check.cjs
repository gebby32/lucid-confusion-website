// Local review: native keyboard / multi-touch inputs with the game's built-in manual clock.
// Room positioning isolates lessons; it is not a claim of an uninterrupted human playthrough.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:8771/';
const output = process.env.VERIFICATION_OUTPUT;
if (output) fs.mkdirSync(output, { recursive: true });
const id = 'soup-squirrel-the-ninja-squire';
const route = '/retro-handheld/games/' + id;
const ready = (p, r) => p.waitForFunction(r => window.arcadeDebug && !arcadeDebug.state.zoomTransition && document.documentElement.dataset.routing === 'ready' && location.pathname.replace(/\/$/, '') === r, r);
const keys = { start: 'Enter', jump: 'Space', punch: 'z', kick: 'x', soup: 'c', up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const mobile of [false, true]) {
      const label = mobile ? 'mobile' : 'desktop';
      const context = await browser.newContext({ viewport: mobile ? { width: 844, height: 390 } : { width: 1440, height: 900 }, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error' && !m.location().url.endsWith('/favicon.ico')) errors.push(m.text()); });
      page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) errors.push(r.status() + ' ' + r.url()); });
      await page.goto(base + route.slice(1) + '/?debug=1'); await ready(page, route);
      const iframe = page.locator('#handheld-player iframe');
      const frame = await (await iframe.elementHandle()).contentFrame();
      await frame.waitForFunction(() => window.GAME && LP.States.current === 'title');
      const cdp = await context.newCDPSession(page);
      const step = n => frame.evaluate(n => LP.Loop.step(n), n);
      const state = () => frame.evaluate(() => LP.States.current);
      const snap = async name => {
        if (!output) return;
        await page.waitForTimeout(350);
        await frame.evaluate(() => { for (let i = 0; i < 12; i++) LP.Loop.draw(); });
        await page.screenshot({ path: path.join(output, `tutorial-${label}-${name}.png`) });
      };
      await frame.evaluate(() => { LP.Loop.manual = true; });
      const act = async (actions, frames = 3) => {
        if (!Array.isArray(actions)) actions = [actions];
        if (mobile && actions.length) {
          const points = await frame.evaluate(actions => actions.map((action, index) => {
            const z = GAME_CONFIG.controls.find(z => z.action === action || (z.type === 'dpad' && ['up', 'down', 'left', 'right'].includes(action)));
            let x = z.x, y = z.y;
            if (z.type === 'dpad') { x += action === 'right' ? z.r * .65 : action === 'left' ? -z.r * .65 : 0; y += action === 'down' ? z.r * .65 : action === 'up' ? -z.r * .65 : 0; }
            const r = LP.Shell.device.getBoundingClientRect();
            return { id: index + 1, x: r.x + x * r.width / GAME_CONFIG.shell.width, y: r.y + y * r.height / GAME_CONFIG.shell.height };
          }), actions);
          const box = await iframe.boundingBox();
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points.map(p => ({ ...p, x: p.x + box.x, y: p.y + box.y })) });
        } else for (const action of actions) await page.keyboard.down(keys[action]);
        await step(frames);
        if (mobile && actions.length) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        else for (const action of actions) await page.keyboard.up(keys[action]);
        await step(1);
      };
      const saved = { progress: 2, beaten: true, bonusProgress: 7, bonusBeaten: false, scores: [{ name: 'QA ', score: 54321, date: 1 }] };
      await frame.evaluate(saved => { for (const [k, v] of Object.entries(saved)) LP.Store.set(k, v); Cheats.unlocked = true; }, saved);
      const checkSaves = async () => assert.deepEqual(await frame.evaluate(keys => Object.fromEntries(keys.map(k => [k, LP.Store.get(k, null)])), Object.keys(saved)), saved);
      const choose = async text => {
        const menu = await frame.evaluate(text => ({ steps: Screens.pauseItems().indexOf(text), current: Screens.pmenu }), text);
        assert(menu.steps >= 0);
        for (let i = menu.current; i < menu.steps; i++) await act('down');
        await act('jump');
      };
      const enterClass = async kind => {
        assert.equal(await state(), 'tutorial');
        const desired = kind === '2d' ? 0 : 1;
        const current = await frame.evaluate(() => Tutorial.sel);
        for (let i = 0; i < (desired - current + 3) % 3; i++) await act('down');
        await act('jump'); await step(270);
        assert.equal(await state(), 'playing');
        assert.equal(await frame.evaluate(() => GAME.Game.lvl.tutorial), kind);
        if (kind === '3d') await step(100);
      };
      const room = async (k, col = 4, y = 480) => {
        await frame.evaluate(({ k, col, y }) => {
          const h = GAME.Game.placeHero(k * 384 + col * 16 + 8, y);
          h.onGround = true; GAME.Game.hearts = GAME.Game.maxHearts;
          GAME.World.camUpdate(h, true); LP.Loop.step(2);
        }, { k, col, y });
      };
      const rope = k => frame.evaluate(k => Array.from({ length: World.h }, (_, y) => World.at(k * 24 + 23, y)).filter(c => c === '|').length, k);

      await act('start'); assert.equal(await state(), 'menu');
      assert.equal(await frame.evaluate(() => Screens.menuItems().length), 8);
      await snap('full-menu');
      const menuIndex = await frame.evaluate(() => Screens.menuItems().findIndex(i => i.id === 'tut'));
      for (let i = 0; i < menuIndex; i++) await act('down');
      await act('jump'); assert.equal(await state(), 'tutorial'); await snap('picker');
      await enterClass('2d');
      assert.equal(await frame.evaluate(() => Props.props.filter(p => p.type === 'npc').length), 10);
      for (let k = 1; k <= 8; k++) assert(await rope(k) > 0, 'All lesson ropes start closed');

      // Start each lesson before its original obstacle; perform the move via native inputs.
      await room(1, 9);
      await act('jump', 15); assert(await rope(1) > 0, 'One jump does not pass the double-jump lesson');
      await act('jump', 8); assert.equal(await rope(1), 0);
      console.log(`${label}: native double jump passes`);
      await room(2, 11);
      for (let i = 0; i < 5 && await rope(2); i++) { await act(['left', 'jump'], 16); await act('left', 12); await act(['left', 'jump'], 8); }
      assert.equal(await rope(2), 0, 'Wall jump works with direction and jump together');
      await room(3, 7);
      for (let i = 0; i < 6 && await rope(3); i++) await act('punch', 8);
      assert.equal(await rope(3), 0, 'Combo lesson passes');
      await room(4, 6); await act('jump', 8); await act('punch', 4); assert.equal(await rope(4), 0);
      await room(5, 7); await act('soup', 3); await step(20); assert.equal(await rope(5), 0);
      await room(6, 9); await act('soup', 40); assert.equal(await rope(6), 0);
      await room(7, 7); await act(['up', 'soup'], 40); assert.equal(await rope(7), 0);
      await room(8, 4); await act('jump', 15); await act('down', 2); await step(90); assert.equal(await rope(8), 0);
      await snap('lessons');
      console.log(`${label}: all eight lesson ropes opened via native ${mobile ? 'multi-touch' : 'keyboard'} inputs`);

      // Death/restart must preserve earned ropes and must not consume a tutorial life.
      const lives = await frame.evaluate(() => GAME.Game.lives);
      await act('start'); await choose('RESTART FROM CHECKPOINT'); await step(20);
      assert.equal(await frame.evaluate(() => GAME.Game.lives), lives);
      assert.equal(await rope(1), 0);
      await checkSaves();
      // Verify the low-heart safety net in an isolated lesson state.
      await room(8, 4);
      await frame.evaluate(() => { Game.hearts = 1; }); await step(2);
      assert.equal(await frame.evaluate(() => Game.hearts), 5);

      // Muted graduation uses the real voice duration in game frames and must finish.
      await frame.evaluate(() => { Voice.stop(); LP.Settings.set('muted', true); LP.Audio.applySettings(); });
      await room(9, 13);
      await step(await frame.evaluate(() => Math.ceil(Voice.duration('gt_grad2') * 60 + 120)));
      assert.equal(await state(), 'diploma'); await snap('2d-diploma'); await checkSaves();
      assert.equal(await frame.evaluate(() => LP.Store.get('tut2d')), true);
      await step(70); await act('jump'); assert.equal(await state(), 'tutorial');
      // A fresh class attempt must rebuild its ropes, while the persistent passed stamp remains.
      await enterClass('2d'); assert(await rope(1) > 0); assert(await rope(8) > 0);
      await act('start'); await choose('LEAVE CLASS'); assert.equal(await state(), 'tutorial');
      await enterClass('3d');
      assert(await frame.evaluate(() => Run3D.active));
      // Test native movement, jump, combat and held soup in the 3D lesson.
      const z = await frame.evaluate(() => Run3D.hero.z);
      await act('up', 20); assert(await frame.evaluate(z => Run3D.hero.z > z, z));
      await act(['up', 'jump'], 5); assert(await frame.evaluate(() => !Run3D.hero.onGround));
      await act('kick', 4); assert.equal(await frame.evaluate(() => Run3D.hero.atk), 'kick');
      await act('start'); await choose('RESTART FROM CHECKPOINT'); await step(20);
      assert.equal(await frame.evaluate(() => Game.lives), 3);
      await act('start'); await choose('LEAVE CLASS'); assert.equal(await state(), 'tutorial');
      assert.equal(await frame.evaluate(() => Run3D.active), false);
      await enterClass('3d');
      // Drive the complete 3D track using the source project's input-only runner, no god mode or teleport.
      await frame.evaluate(fs.readFileSync('C:/Retro Handhelds/Soup Squirrel The Ninja Squire/tools/test-helpers.js', 'utf8'));
      const run = await frame.evaluate(() => T.bot3d(14000, false));
      assert.equal(await state(), 'diploma', JSON.stringify(run));
      assert.equal(await frame.evaluate(() => Game.stats.deaths), 0);
      assert.equal(await frame.evaluate(() => LP.Store.get('tut3d')), true);
      await snap('3d-diploma'); await checkSaves();
      console.log(`${label}: repeated classes, checkpoint restarts, muted diploma, complete 3D track, and saved progress isolation passed`);
      await step(70); await act('jump');
      // Exit tutorial through its own menu and start ordinary play.
      await act('kick'); assert.equal(await state(), 'menu');
      const selected = await frame.evaluate(() => Screens.menu);
      for (let i = 0; i < selected; i++) await act('up');
      await act('jump'); await step(60); await act('start'); await step(350);
      assert.equal(await state(), 'playing');
      assert.equal(await frame.evaluate(() => !!Game.lvl.tutorial), false);
      const normalLives = await frame.evaluate(() => Game.lives);
      await act('start'); await choose('RESTART FROM CHECKPOINT');
      assert.equal(await frame.evaluate(() => Game.lives), normalLives - 1);
      await checkSaves();
      // Return to a class, then exercise website unloading and history around the active tutorial.
      await act('start'); await choose('QUIT TO TITLE');
      const index = await frame.evaluate(() => Screens.menuItems().findIndex(i => i.id === 'tut') - Screens.menu);
      for (let i = 0; i < index; i++) await act('down');
      await act('jump'); await enterClass('2d');
      await frame.evaluate(() => { LP.Loop.manual = false; });
      await page.locator('#handheld-back').click(); await ready(page, '/retro-handheld/games'); assert(frame.isDetached());
      await page.goForward(); await ready(page, route);
      const restored = await (await iframe.elementHandle()).contentFrame();
      await restored.waitForFunction(() => window.GAME && LP.States.current === 'title');
      assert(await restored.evaluate(() => LP.Store.get('tut2d') && LP.Store.get('tut3d')));
      await page.goBack(); await ready(page, '/retro-handheld/games'); assert(restored.isDetached());
      assert.deepEqual(errors, []);
      console.log(`${label}: tutorial return to ordinary game, life rules, browser history, stamps, and clean unload passed`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
