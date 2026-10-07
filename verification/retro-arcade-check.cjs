const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs'), crypto = require('node:crypto');
const catalog = JSON.parse(fs.readFileSync('assets/retro-arcade/catalog.json'));
const url = process.env.PREVIEW_URL || 'http://127.0.0.1:61863/';
const output = process.env.VERIFICATION_OUTPUT;
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
for (const item of JSON.parse(fs.readFileSync('verification/retro-arcade-source.json'))) {
  assert.equal(hash('assets/retro-arcade/' + item.file), item.sha256);
  assert.equal(hash('C:/Retro Arcade/' + item.source), item.sha256);
}
(async () => {
 const browser = await chromium.launch({headless:true,channel:'msedge'});
 try {
  for (const size of [{width:1440,height:900},{width:390,height:844},{width:820,height:1180}]) {
   const mobile = size.width !== 1440;
   const context = await browser.newContext({viewport:size,isMobile:mobile,hasTouch:mobile});
   const page = await context.newPage(), requests=[], errors=[];
   page.on('request',r=>requests.push(r.url()));
   page.on('pageerror',e=>errors.push(e.message));
   page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
   page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
   await page.goto(url+'?debug=1');
   await page.waitForFunction(()=>window.arcadeDebug?.screens.size===9);
   assert(!requests.some(u=>u.includes('/retro-arcade/')));
   await page.locator('#arcade').focus(); await page.keyboard.press('Enter');
   await page.waitForFunction(()=>arcadeDebug.state.view==='cabinet'&&!arcadeDebug.state.zoomTransition);
   await page.waitForFunction(()=>document.querySelector('#retro-frame').naturalWidth>0);
   await page.waitForFunction(()=>arcadeDebug.screens.get(2).source?.image instanceof HTMLCanvasElement);
   const early = await page.evaluate(()=>arcadeDebug.screens.get(2).source.image.toDataURL());
   await page.waitForTimeout(1400);
   const complete = await page.evaluate(()=>arcadeDebug.screens.get(2).source.image.toDataURL());
   assert.notEqual(early,complete,'Typewriter canvas advances');
   await page.emulateMedia({reducedMotion:'reduce'});
   assert(!requests.some(u=>/retro-arcade\/(catalog|games|art\/[^/]+\.webp)/.test(u)));
   if(output)await page.screenshot({path:output+'/retro-teaser-'+size.width+'.png'});
   const monitor = await page.evaluate(()=>{const v=arcadeDebug.screens.get(2).focusPose().target.project(arcadeDebug.camera),r=document.querySelector('#arcade').getBoundingClientRect();return{x:r.x+(v.x+1)*r.width/2,y:r.y+(1-v.y)*r.height/2}});
   if(mobile)await page.touchscreen.tap(monitor.x,monitor.y);else await page.mouse.click(monitor.x,monitor.y);
   await page.waitForSelector('#retro-grid a');
   assert.equal(await page.locator('#retro-grid a').count(),5);
   assert.equal(await page.locator('#retro-grid > div').innerText(),'COMING SOON...');
   assert(!requests.some(u=>u.includes('/retro-arcade/games/')));
   await page.locator('#retro-grid > div').click();
   assert.equal(await page.locator('#retro-game-viewport iframe').count(),0);
   await page.locator('#retro-grid').evaluate(e=>e.scrollTop=0);
   await page.waitForFunction(()=>[...document.querySelectorAll('#retro-grid img')].every(i=>i.complete&&i.naturalWidth>0));
   const bounds=await page.locator('#retro-frame').boundingBox();assert(Math.abs(bounds.width/bounds.height-4/3)<.01);
   if(output)await page.screenshot({path:output+'/retro-grid-'+size.width+'.png'});
   for(const item of catalog.filter(g=>g.url)) {
    const start=requests.length;
    const link=page.getByRole('link',{name:item.title,exact:true});if(mobile)await link.tap();else await link.click();
    const iframe=page.locator('#retro-game-viewport iframe');await iframe.waitFor();
    const game=await(await iframe.elementHandle()).contentFrame();await game.waitForFunction(()=>window.LP?.Shell?.canvas&&LP.States?.current);
    assert(!(await page.locator('#retro-frame').isVisible()));assert(!(await page.locator('#retro-grid').isVisible()));
    assert.equal(await page.locator('iframe').count(),1);
    await page.locator('#retro-back img').evaluate(i=>i.decode());
    const fit=await game.evaluate(()=>{const r=LP.Shell.view.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,vw:innerWidth,vh:innerHeight,ratio:LP.LCD.W/LP.LCD.H}});
    assert(Math.abs(fit.w/fit.h-fit.ratio)<.01);assert(fit.x>=-1&&fit.y>=-1&&fit.x+fit.w<=fit.vw+1&&fit.y+fit.h<=fit.vh+1);
    assert(Math.min(fit.vw/fit.w,fit.vh/fit.h)<=1.26);
    assert(Math.abs((fit.vw-fit.w)/2-fit.x)<=1&&Math.abs((fit.vh-fit.h)/2-fit.y)<=1);
    await game.evaluate(()=>window.focus());
    const playState=item.id==='sloth-run'?'race':'game';
    for(let attempt=0;attempt<8;attempt++) {
     if(await game.evaluate(state=>LP.States.current===state,playState))break;
     await page.keyboard.press('Enter');await page.waitForTimeout(750);
    }
    assert.equal(await game.evaluate(()=>LP.States.current),playState,'Native menu starts gameplay: '+item.title);
    await game.evaluate(()=>{window.testKeys=[];window.addEventListener('keydown',e=>window.testKeys.push(e.key));window.focus()});
    for(const key of ['Escape','Backspace']) {await page.keyboard.press(key);assert.equal(await page.locator('iframe').count(),1);assert((await game.evaluate(()=>window.testKeys)).includes(key));}
    // Original input mapping still receives a held directional key.
    await page.keyboard.down('ArrowRight');assert(await game.evaluate(()=>LP.Input.downKeys.has('ArrowRight')));await page.keyboard.up('ArrowRight');
    const key=item.id==='slubble-slobble'?'F2':'f';
    if(item.id==='slubble-slobble') {await page.keyboard.down('f');assert(await game.evaluate(()=>LP.Input.held('p2fire')));assert.equal(await page.evaluate(()=>document.fullscreenElement),null);await page.keyboard.up('f');}
    await page.keyboard.press(key);await page.waitForFunction(()=>document.fullscreenElement?.id==='retro-player');
    assert(await page.locator('#retro-back').isVisible());
    await page.keyboard.press(key);await page.waitForFunction(()=>!document.fullscreenElement);
    if(output)await page.screenshot({path:output+'/retro-'+item.id+'-'+size.width+'.png'});
    await page.keyboard.press(key);await page.waitForFunction(()=>document.fullscreenElement?.id==='retro-player');
    if(mobile)await page.locator('#retro-back').tap();else await page.locator('#retro-back').click();
    await page.waitForFunction(()=>!document.querySelector('#retro-game-viewport iframe'));
    assert.equal(await page.evaluate(()=>document.fullscreenElement),null);assert(await page.locator('#retro-grid').isVisible());assert(game.isDetached());
    const loaded=requests.slice(start).filter(u=>u.includes('/retro-arcade/games/'));
    assert(loaded.length>0);assert(loaded.every(u=>u.includes('/games/'+item.id+'/')));
    console.log(size.width+': '+item.title+' lazy launch, native scaling/input, fullscreen, return/unload passed');
   }
   await page.locator('#screen-return').click();await page.waitForFunction(()=>arcadeDebug.state.view==='cabinet'&&!arcadeDebug.state.zoomTransition);
   await page.locator('#screen-return').click();await page.waitForFunction(()=>arcadeDebug.state.view==='carousel');
   assert.deepEqual(errors,[]);await context.close();
  }
 } finally {await browser.close()}
 console.log('Source hashes, five games, Coming Soon, desktop/phone/tablet checks passed.');
})().catch(e=>{console.error(e);process.exit(1)});
