const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const id = 'sleavis-and-sloth-head-do-america';
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:8771/';
const output = process.env.VERIFICATION_OUTPUT;
if (output) fs.mkdirSync(output, { recursive: true });
const catalog = JSON.parse(fs.readFileSync('assets/retro-arcade/catalog.json'));
const old = JSON.parse(execFileSync('git', ['show', 'HEAD:assets/retro-arcade/catalog.json']));
assert.equal(catalog.length, old.length);
assert.deepEqual(catalog.slice(0, -1), old.slice(0, -1), 'Other games unchanged');
assert.equal(catalog.at(-1).id, id);
const inventory = JSON.parse(fs.readFileSync('verification/sleavis-source.json'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
for (const item of inventory) {
  assert.equal(hash(item.source), item.sha256);
  assert.equal(hash(item.file), item.sha256, 'Runtime source copied unchanged: ' + item.file);
}
const ready = (page, route) => page.waitForFunction(route => window.arcadeDebug && !arcadeDebug.state.zoomTransition && document.documentElement.dataset.routing === 'ready' && (location.pathname.replace(/\/$/, '') || '/') === route, route);
const snap = (page, name) => output ? page.screenshot({ path: path.join(output, name + '.png') }) : Promise.resolve();
const loadedGame = async page => {
  const iframe = page.locator('#retro-game-viewport iframe');
  await iframe.waitFor();
  const frame = await (await iframe.elementHandle()).contentFrame();
  await frame.waitForFunction(() => window.GAME?.Heroes.ready && LP.States.current === 'title', null, { timeout: 45000 });
  return frame;
};
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    for (const mobile of [false, true]) {
      const label = mobile ? 'mobile' : 'desktop';
      const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' });
      const page = await context.newPage(), errors = [], requests = [], gameRequests = [];
      page.on('pageerror', e => errors.push(e.stack));
      page.on('console', m => { if (m.type() === 'error' && !m.location().url.endsWith('/favicon.ico')) errors.push(m.text()); });
      page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) errors.push(r.status() + ' ' + r.url()); });
      page.on('requestfailed', r => errors.push(r.failure().errorText + ' ' + r.url()));
      page.on('request', r => { if (/^https?:/.test(r.url())) { requests.push(r.url()); if (r.frame() !== page.mainFrame()) gameRequests.push(r.url()); } });
      await page.goto(base + 'retro-arcade/games/?debug=1');
      await ready(page, '/retro-arcade/games');
      assert.equal(await page.locator('#retro-grid a').count(), 8);
      assert.equal(await page.locator('#retro-grid > div').count(), 0);
      assert(!requests.some(url => url.includes('/assets/retro-arcade/games/')));
      const link = page.locator(`#retro-grid a[data-game="${id}"]`);
      await link.scrollIntoViewIfNeeded(); await link.locator('img').evaluate(img => img.decode());
      assert.equal(await link.innerText(), 'Sleavis and Sloth-Head Do America');
      await snap(page, 'sleavis-selection-' + label);
      if (mobile) await link.tap(); else await link.click();
      const route = '/retro-arcade/games/' + id;
      await ready(page, route);
      const game = await loadedGame(page);
      assert.equal(await game.title(), 'Sleavis and Sloth-Head Do America');
      assert.equal(await game.evaluate(() => GAME.Heroes.error), null);
      assert(await game.evaluate(() => !!GAME.Heroes.sleavis && !!GAME.Heroes.slothhead));
      assert.deepEqual(await game.evaluate(() => GAME_CONFIG.controls), [], 'Supplied build has no touch gameplay zones');
      assert(await page.locator('#retro-back').isVisible());
      await snap(page, 'sleavis-title-' + label);
      const fit = async () => {
        const r = await game.evaluate(() => { const r = LP.Shell.view.getBoundingClientRect(); return { x:r.x,y:r.y,w:r.width,h:r.height,vw:innerWidth,vh:innerHeight }; });
        assert(Math.abs(r.w / r.h - 4 / 3) < .01);
        assert(r.x >= -1 && r.y >= -1 && r.x + r.w <= r.vw + 1 && r.y + r.h <= r.vh + 1);
        assert(Math.abs((r.vw-r.w)/2-r.x) < 1 && Math.abs((r.vh-r.h)/2-r.y) < 1);
      };
      await fit();
      // Exercise the original Gamepad API polling, rather than calling game actions.
      // This is a simulated standard controller; physical hardware is not connected.
      await game.evaluate(() => {
        window.testPad = { id:'Verification standard gamepad',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0})),timestamp:0 };
        Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[testPad]});
      });
      const pad = async (button, ms = 90) => {
        await game.evaluate(button => { testPad.buttons[button] = {pressed:true,touched:true,value:1};testPad.timestamp++; }, button);
        await page.waitForTimeout(ms);
        await game.evaluate(button => { testPad.buttons[button] = {pressed:false,touched:false,value:0};testPad.timestamp++; }, button);
        await page.waitForTimeout(90);
      };
      const key = async (key, ms = 90) => { await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); await page.waitForTimeout(90); };
      const confirm = () => mobile ? pad(0) : key('Enter');
      await confirm(); await confirm();
      await game.waitForFunction(() => LP.States.current === 'play');
      // Advance the opening dialogue through the game's own confirm controls.
      for (let n = 0; n < 150; n++) {
        if (await game.evaluate(() => GAME.Modes.cur?.name === 'action' && !GAME.Story.blocking())) break;
        await confirm();
      }
      assert(await game.evaluate(() => GAME.Modes.cur?.name === 'action' && !GAME.Story.blocking()), 'Opening story reaches playable exploration');
      const position = () => game.evaluate(() => { const p=GAME.Game.leaderActor();return {x:p.x,y:p.y,z:p.z}; });
      const before = await position();
      if (mobile) {
        await game.evaluate(() => { testPad.axes[0] = .85; }); await page.waitForTimeout(500); await game.evaluate(() => { testPad.axes[0] = 0; });
      } else await key('ArrowRight', 500);
      const after = await position();
      assert(Math.hypot(after.x-before.x,after.z-before.z) > .15, 'Movement affects player');
      if (mobile) await pad(0); else await key('Space');
      assert((await position()).y > after.y, 'Jump affects player');
      const punches = await game.evaluate(() => GAME.Game.stats.punches);
      if (mobile) await pad(2); else await key('j');
      assert(await game.evaluate(n => GAME.Game.stats.punches > n, punches), 'Punch triggers combat');
      const leader = await game.evaluate(() => GAME.Game.leader);
      if (mobile) await pad(3); else await key('q');
      assert.notEqual(await game.evaluate(() => GAME.Game.leader), leader, 'Character switch');
      // Native F/use must never be intercepted by website fullscreen.
      await page.keyboard.down('f');
      assert(await game.evaluate(() => LP.Input.held('use')));
      assert.equal(await page.evaluate(() => document.fullscreenElement), null);
      await page.keyboard.up('f');
      await pad(9); await game.waitForFunction(() => LP.States.current === 'pause');
      await pad(9); await game.waitForFunction(() => LP.States.current === 'play');
      await game.evaluate(() => { testPad.buttons[6]={pressed:true,value:.8};testPad.buttons[7]={pressed:true,value:.7}; });
      await game.waitForFunction(() => LP.Input.held('gas') && LP.Input.held('brake'));
      assert(await game.evaluate(() => Ctl.gas() > 0 && Ctl.brake() > 0));
      await game.evaluate(() => { testPad.buttons[6]={pressed:false,value:0};testPad.buttons[7]={pressed:false,value:0}; });
      await snap(page, 'sleavis-gameplay-' + label);
      for (const size of [{width:844,height:390},{width:320,height:640},{width:820,height:1180},mobile?{width:390,height:844}:{width:1440,height:900}]) {
        await page.setViewportSize(size);await page.waitForTimeout(300);await fit();
      }
      // Pointer/touch interaction inside the original canvas must not change site routes.
      if (mobile) { await game.locator('#lp-lcd').tap({position:{x:20,y:20}});assert.equal(new URL(page.url()).pathname,route+'/'); }
      assert(gameRequests.every(url => url.startsWith(new URL('assets/retro-arcade/games/'+id+'/',base).href)), 'All gameplay dependencies load from its own directory: '+JSON.stringify(gameRequests));
      for (const item of inventory) assert(gameRequests.some(url => new URL(url).pathname === '/'+item.file), 'Runtime requested: '+item.file);
      await game.evaluate(() => window.focus());
      await page.keyboard.press('F2');await page.waitForFunction(() => document.querySelector('#retro-player').classList.contains('game-expanded'));
      assert(await page.locator('#retro-back').isVisible());
      if (mobile) await page.locator('#retro-back').tap();else await page.locator('#retro-back').click();
      await ready(page,'/retro-arcade/games');assert(game.isDetached());assert.equal(await page.locator('iframe').count(),0);assert.equal(await page.evaluate(()=>document.querySelector('.game-expanded')),null);
      await page.goForward();await ready(page,route);await loadedGame(page);
      await page.goBack();await ready(page,'/retro-arcade/games');assert.equal(await page.locator('iframe').count(),0);
      await page.goForward();await ready(page,route);await loadedGame(page);
      await page.reload();await ready(page,route);const refreshed=await loadedGame(page);
      await page.locator('#retro-back').click();await ready(page,'/retro-arcade/games');assert(refreshed.isDetached());
      await page.locator('#screen-return').click();await ready(page,'/retro-arcade');
      await page.locator('#screen-return').click();await ready(page,'/');
      assert.deepEqual(errors,[]);
      console.log(`${label}: all local assets, models, gameplay, keyboard/simulated controller, 4:3 fitting, fullscreen, unload and history passed`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
