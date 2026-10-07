const {chromium}=require('playwright'), fs=require('node:fs'), assert=require('node:assert/strict'), crypto=require('node:crypto');
const ids=['sloth-kart-racing','star-sloth-69','the-legend-of-emcee'];
const inventory=JSON.parse(fs.readFileSync('verification/arcade-additions-source.json'));
for(const item of inventory){for(const file of [item.source,item.file])assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),file===item.source?item.sourceSha256:item.sha256,file)}
for(const file of ['assets/handhelds/catalog.json','assets/retro-arcade/catalog.json']){const entries=JSON.parse(fs.readFileSync(file));assert.equal(new Set(entries.map(e=>e.id)).size,entries.length)}
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 for(const mobile of [false,true]){
  const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile}), errors=[], requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});page.on('request',r=>requests.push(r.url()));
  await page.goto((process.env.PREVIEW_URL||'http://127.0.0.1:8771/')+'?debug=1');await page.waitForFunction(()=>window.arcadeDebug);await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('#arcade').focus();await page.keyboard.press('ArrowLeft');await page.keyboard.press('Enter');await page.waitForFunction(()=>arcadeDebug.state.view==='cabinet'&&!arcadeDebug.state.zoomTransition);await page.keyboard.press('Enter');await page.waitForSelector('#handheld-grid a');
  assert(!requests.some(u=>ids.some(id=>u.includes('/'+id+'/index.html'))));
  for(const id of ids){
   const link=page.locator(`#handheld-grid a[href*="/${id}/"]`);await link.scrollIntoViewIfNeeded();await link.locator('img').evaluate(i=>i.decode());
   if(process.env.VERIFICATION_OUTPUT)await page.screenshot({path:process.env.VERIFICATION_OUTPUT+'/new-grid-'+id+'-'+mobile+'.png'});
   const before=requests.length;if(mobile)await link.tap();else await link.click();
   const iframe=page.locator('#handheld-player iframe');await iframe.waitFor();const game=await(await iframe.elementHandle()).contentFrame();await game.waitForFunction(()=>window.LP?.Shell?.view&&LP.States.current);
   const fit=await game.evaluate(()=>{const r=LP.Shell.view.getBoundingClientRect(),s=GAME_CONFIG.shell.view||GAME_CONFIG.shell;return{w:r.width,h:r.height,x:r.x,y:r.y,vw:innerWidth,vh:innerHeight,ratio:s.width/s.height}});
   assert(Math.abs(fit.w/fit.h-fit.ratio)<.01);assert(fit.x>=-1&&fit.y>=-1&&fit.x+fit.w<=fit.vw+1&&fit.y+fit.h<=fit.vh+1);
   await game.evaluate(()=>{window.backArrivals=[];window.addEventListener('keydown',e=>{if(e.key==='Backspace')window.backArrivals.push(true)});window.focus()});
   await page.keyboard.down('Backspace');assert(await game.evaluate(()=>LP.Input.downKeys.has('Backspace')));await page.keyboard.up('Backspace');assert.equal(await page.locator('iframe').count(),1);assert.equal(await game.evaluate(()=>backArrivals.length),1);
   await page.keyboard.press('f');await page.waitForFunction(()=>document.fullscreenElement?.id==='handheld-player');await page.keyboard.press('f');await page.waitForFunction(()=>!document.fullscreenElement);
   await page.keyboard.press('Enter');await page.keyboard.press('ArrowRight');
   if(process.env.VERIFICATION_OUTPUT)await page.screenshot({path:process.env.VERIFICATION_OUTPUT+'/new-game-'+id+'-'+mobile+'.png'});
   await page.keyboard.press('f');await page.waitForFunction(()=>document.fullscreenElement?.id==='handheld-player');if(mobile)await page.locator('#handheld-back').tap();else await page.locator('#handheld-back').click();await page.waitForFunction(()=>!document.querySelector('iframe'));
   assert(game.isDetached());assert.equal(await page.evaluate(()=>document.fullscreenElement),null);assert(await page.locator('#handheld-grid').isVisible());
   assert(requests.slice(before).filter(u=>/\/handhelds\/[^/]+\/index.html/.test(u)).every(u=>u.includes('/'+id+'/')));
   console.log(`${mobile?'touch':'desktop'}: ${id} native Backspace, F fullscreen, fitting, lazy launch/unload passed`);
  }
  assert.deepEqual(errors,[]);await page.close();
 }
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
