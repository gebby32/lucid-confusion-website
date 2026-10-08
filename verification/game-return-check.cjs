const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 for(const mobile of [false,true])for(const kind of ['handheld','retro']){
  const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile}),errors=[],loads=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('request',r=>{if(/\/assets\/(handhelds\/[^/]+|retro-arcade\/games\/[^/]+)\/index.html/.test(r.url()))loads.push(r.url())});
  await page.goto((process.env.PREVIEW_URL||'http://127.0.0.1:8771/')+'?debug=1');await page.waitForFunction(()=>window.arcadeDebug);await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('#arcade').focus();if(kind==='handheld')await page.keyboard.press('ArrowLeft');await page.keyboard.press('Enter');await page.waitForFunction(()=>arcadeDebug.state.view==='intro'&&!arcadeDebug.state.zoomTransition);await page.keyboard.press('Enter');await page.waitForSelector('#'+kind+'-grid a');assert.equal(loads.length,0);
  for(const fullscreen of [false,true]){
   const selectionBack=page.locator('#screen-return');
   assert.equal(await selectionBack.locator('img').getAttribute('src'),'./assets/arcade/art/back-to-cabinet-transparent.png');
   const selectionRect=await selectionBack.boundingBox();assert(selectionRect.x<=8&&selectionRect.y<=4);
   assert.equal(await selectionBack.evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
   const link=page.locator('#'+kind+'-grid a').first();if(mobile)await link.tap();else await link.click();
   const iframe=page.locator('#'+kind+'-player iframe');await iframe.waitFor();const game=await(await iframe.elementHandle()).contentFrame();await game.waitForLoadState('load');
   const button=page.locator('#'+kind+'-back'),image=button.locator('img');await image.evaluate(i=>i.decode());assert((await image.getAttribute('src')).endsWith('/assets/arcade/art/back-to-arcade-transparent.png'));assert.equal(await button.getAttribute('aria-label'),'Back to Arcade');
   assert.equal(await button.evaluate(e=>getComputedStyle(e).position),'fixed');const rect=await button.boundingBox();assert(rect.x<=8&&rect.y<=4&&rect.width===216&&rect.height===72);assert(!(await page.locator('#screen-return').isVisible()));
   assert(await button.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))}));
   const gameRect=await iframe.boundingBox();assert(Math.abs(gameRect.y-(kind==='handheld'?52.4:76))<1,'Existing game viewport retained');
   assert.equal(await button.evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
   assert.equal(await page.locator('.'+kind+'-toolbar').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
   await game.evaluate(()=>{window.receivedDouble=0;window.addEventListener('dblclick',()=>window.receivedDouble++)});
   await game.locator('body').dblclick({position:{x:10,y:100}});assert.equal(await game.evaluate(()=>window.receivedDouble),1);assert.equal(await page.locator('iframe').count(),1);
   await game.evaluate(()=>window.focus());await page.keyboard.press('f');await page.waitForFunction(k=>document.fullscreenElement?.id===k+'-player',kind);assert(await button.isVisible());await page.keyboard.press('f');await page.waitForFunction(()=>!document.fullscreenElement);
   if(fullscreen){await page.keyboard.press('f');await page.waitForFunction(()=>document.fullscreenElement)}
   await page.evaluate(k=>{window.removedInFullscreen=null;new MutationObserver(records=>{if(records.some(r=>[...r.removedNodes].some(n=>n.nodeName==='IFRAME')))window.removedInFullscreen=!!document.fullscreenElement}).observe(document.querySelector('#'+k+'-game-viewport'),{childList:true})},kind);
   if(process.env.VERIFICATION_OUTPUT)await page.screenshot({path:process.env.VERIFICATION_OUTPUT+'/return-'+kind+'-'+mobile+'-'+fullscreen+'.png'});
   if(mobile)await button.tap();else await button.click();await page.waitForFunction(()=>document.querySelectorAll('iframe').length===0);assert(game.isDetached());assert.equal(await page.evaluate(()=>document.fullscreenElement),null);assert.equal(await page.evaluate(()=>window.removedInFullscreen),false);assert(await page.locator('#'+kind+'-grid').isVisible());
  }
  await page.locator('#screen-return').click();await page.waitForFunction(()=>arcadeDebug.state.view==='carousel'&&document.documentElement.dataset.routing==='ready');assert(!(await page.locator('#screen-return').isVisible()));
  assert.equal(loads.length,2);assert.deepEqual(errors,[]);console.log(`${kind} ${mobile?'mobile':'desktop'}: shared image, fixed upper-left, hidden bottom control, unchanged game bounds, F toggle, normal/fullscreen return and unload passed`);await page.close();
 }
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
