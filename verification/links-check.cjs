const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
for(const name of ['Google Play — OmniStash','Apple App Store — Coming Soon...','YouTube — youtube.com/@Lucid_Confusion','Website — lucidconfusion.gg','Instagram — instagram.com/not_Lucid_Confusion','Reddit — reddit.com/r/LucidConfusion','X — x.com/Lucid_Confusion','Twitch — twitch.tv/not_Lucid_Confusion'])assert(html.includes(name));
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 for(const size of [{width:1440,height:1000},{width:390,height:844},{width:844,height:390}]){
  const mobile=size.width!==1440,context=await browser.newContext({viewport:size,isMobile:mobile,hasTouch:mobile});
  // Verify new-tab destinations without contacting third-party services.
  await context.route(/https:\/\/(play\.google\.com|youtube\.com|instagram\.com|reddit\.com|x\.com|twitch\.tv)\//,r=>r.fulfill({contentType:'text/html',body:'<title>External destination verification</title>'}));
  const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});page.on('request',r=>requests.push(r.url()));
  await page.goto((process.env.PREVIEW_URL||'http://127.0.0.1:8771/')+'?debug=1');await page.waitForFunction(()=>window.arcadeDebug);await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#arcade').focus();for(let i=0;i<3;i++)await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');await page.waitForFunction(()=>arcadeDebug.state.view==='cabinet'&&!arcadeDebug.state.zoomTransition);
  assert.equal(await page.locator('#announcement').innerText(),'Important Links to Important Things <click to continue>');assert(!requests.some(u=>u.includes('/assets/links/')));
  if(process.env.VERIFICATION_OUTPUT)await page.screenshot({path:process.env.VERIFICATION_OUTPUT+'/links-intro-'+size.width+'.png'});
  const p=await page.evaluate(()=>{const d=arcadeDebug,v=d.screens.get(5).focusPose().target.project(d.camera),r=document.querySelector('#arcade').getBoundingClientRect();return{x:r.x+(v.x+1)*r.width/2,y:r.y+(1-v.y)*r.height/2}});if(mobile)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);
  await page.waitForSelector('#links-panel:not([hidden])');await page.locator('#links-battle img').evaluate(i=>i.decode());await page.locator('#links-frame').evaluate(i=>i.decode());
  assert.equal(await page.locator('#links-battle a').count(),6);assert.equal(await page.locator('#links-directory').count(),0);assert(!(await page.locator('#screen-return').isVisible()));
  const art=await page.locator('#links-battle').boundingBox(),frame=await page.locator('#links-frame').boundingBox();assert(Math.abs(art.width/art.height-4/3)<.01);assert(Math.abs(frame.width/frame.height-4/3)<.01);
  assert(await page.locator('#crt-content').evaluate(e=>e.scrollWidth===e.clientWidth));
  assert(Math.abs(frame.width-Math.min(size.width,(size.height-80)*4/3))<2,'Frame fills available viewport');
  const returnRect=await page.locator('#links-return').boundingBox();assert(returnRect.x<=8&&returnRect.y<=4&&returnRect.y+returnRect.height<=frame.y);
  for(const span of await page.locator('.links-hotspot span').all())assert(await span.evaluate(e=>{const s=getComputedStyle(e);return s.display!=='none'&&s.visibility==='visible'&&s.clipPath==='inset(50%)'}));
  await page.locator('.links-google').focus();
  for(const selector of ['.links-apple','.links-youtube','.links-website','.links-instagram','.links-reddit','.links-x','.links-twitch','#links-return']) {await page.keyboard.press('Tab');assert(await page.locator(selector).evaluate(e=>e===document.activeElement));}
  if(process.env.VERIFICATION_OUTPUT)await page.screenshot({path:process.env.VERIFICATION_OUTPUT+'/links-main-'+size.width+'.png'});
  for(const link of await page.locator('#links-battle a').all()){
   assert.equal(await link.getAttribute('target'),'_blank');assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
   const pending=page.waitForEvent('popup');if(mobile)await link.tap();else await link.click();const popup=await pending;await popup.waitForLoadState();assert.equal(popup.url(),await link.getAttribute('href'));await popup.close();assert.equal(await page.evaluate(()=>arcadeDebug.state.view),'crt');
  }
  if(mobile)await page.locator('.links-apple').tap();else{await page.locator('.links-apple').focus();await page.keyboard.press('Enter')}assert(await page.locator('#links-apple-notice').isVisible());assert.equal(await page.locator('#links-apple-notice').innerText(),'Coming Soon...');assert.equal(context.pages().length,1);
  if(process.env.VERIFICATION_OUTPUT)await page.screenshot({path:process.env.VERIFICATION_OUTPUT+'/links-app-store-'+size.width+'.png'});
  await page.locator('.links-website').focus();await page.keyboard.press('Space');await page.locator('#links-beach img').evaluate(i=>i.decode());assert(await page.locator('#links-beach').isVisible());assert(!(await page.locator('#links-battle').isVisible()));assert.deepEqual(await page.locator('#links-frame').boundingBox(),frame);
  if(process.env.VERIFICATION_OUTPUT)await page.screenshot({path:process.env.VERIFICATION_OUTPUT+'/links-beach-'+size.width+'.png'});
  assert.deepEqual(await page.locator('#links-return').boundingBox(),returnRect);assert(!(await page.locator('#links-apple-notice').isVisible()));
  if(mobile)await page.locator('#links-beach').tap();else await page.keyboard.press('Enter');assert(await page.locator('#links-battle').isVisible());assert.equal(await page.evaluate(()=>document.activeElement.className),'links-hotspot links-website');
  await page.locator('.links-website').click();assert(await page.locator('#links-beach').isVisible());await page.locator('#links-return').click();await page.waitForFunction(()=>arcadeDebug.state.view==='cabinet'&&!arcadeDebug.state.zoomTransition);
  await page.locator('#arcade').focus();await page.keyboard.press('Enter');await page.waitForSelector('#links-battle:not([hidden])');assert(!(await page.locator('#links-beach').isVisible()));
  await page.locator('.links-google').focus();const popupPromise=page.waitForEvent('popup');await page.keyboard.press('Space');const popup=await popupPromise;await popup.waitForLoadState();assert(popup.url().startsWith('https://play.google.com/'));await popup.close();
  await page.locator('#links-return').click();await page.waitForFunction(()=>arcadeDebug.state.view==='cabinet'&&!arcadeDebug.state.zoomTransition);await page.keyboard.press('Escape');await page.waitForFunction(()=>arcadeDebug.state.view==='carousel');assert(!await page.evaluate(()=>document.body.classList.contains('links-open')));
  await page.locator('#arcade').focus();for(let i=0;i<5;i++)await page.keyboard.press('ArrowLeft');await page.keyboard.press('Enter');await page.waitForFunction(()=>arcadeDebug.state.view==='cabinet'&&!arcadeDebug.state.zoomTransition);await page.keyboard.press('Enter');await page.waitForSelector('#about-story:not([hidden])');
  const aboutBack=page.locator('#screen-return');assert.equal(await aboutBack.locator('img').getAttribute('alt'),'Back to Cabinet');const aboutRect=await aboutBack.boundingBox();assert(aboutRect.x<=8&&aboutRect.y<=4);assert((await page.locator('#about-story').innerText()).includes('Frankencomputer'));
  await page.locator('#about-story').evaluate(e=>e.scrollTop=e.scrollHeight);assert(await page.locator('#about-story').evaluate(e=>e.scrollTop>0));
  if(process.env.VERIFICATION_OUTPUT)await page.screenshot({path:process.env.VERIFICATION_OUTPUT+'/about-cleanup-'+size.width+'.png'});
  await aboutBack.click();await page.waitForFunction(()=>arcadeDebug.state.view==='cabinet'&&!arcadeDebug.state.zoomTransition);
  assert.deepEqual(errors,[]);console.log(`${size.width}x${size.height}: Links sizing, six destinations, hidden semantic text, App Store feedback, beach/back states, About Us image return and scrolling, no errors passed`);await context.close();
 }
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
