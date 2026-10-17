const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:8771/';
const output = process.env.VERIFICATION_OUTPUT;
const ready = page => page.waitForFunction(() => window.arcadeDebug && document.documentElement.dataset.routing === 'ready' && !arcadeDebug.state.zoomTransition);
async function measure(page) {
 return page.evaluate(async () => {
  const T=await import('/assets/vendor/three/three.module.min.js'),d=arcadeDebug,r=document.querySelector('#arcade').getBoundingClientRect();
  let top=Infinity,bottom=-Infinity,left=Infinity,right=-Infinity;
  d.screens.get(d.state.active).root.traverse(o=>{const a=o.geometry?.attributes.position;if(a)for(let i=0;i<a.count;i++){
   const p=new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld).project(d.camera);
   const x=r.x+(p.x+1)*r.width/2,y=r.y+(1-p.y)*r.height/2;
   top=Math.min(top,y);bottom=Math.max(bottom,y);left=Math.min(left,x);right=Math.max(right,x);
  }});
  return {top:top/innerHeight,bottom:bottom/innerHeight,left:left/innerWidth,right:right/innerWidth,
   brand:document.querySelector('.brand').getBoundingClientRect().width/innerHeight,
   decoration:document.querySelector('.construction').getBoundingClientRect().width/innerHeight,
   scrollY,overflow:document.documentElement.scrollHeight-innerHeight};
 });
}
function fits(b) {
 assert(b.top>=-1e-5 && b.bottom<=1.00001 && b.left>=0 && b.right<=1,JSON.stringify(b));
 assert(Math.abs(b.bottom-1)<1e-5,'Cabinet bottom must touch the viewport bottom');
 assert(b.top<1e-5 || Math.min(b.left,1-b.right)<.025,'Fill height unless the cabinet reaches the available width');
 assert.equal(b.scrollY,0);assert.equal(b.overflow,0);
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  let baseline;
  // Same physical 1920x900 area at 100%, 125%, and 150% display scaling.
  for(const density of [1,1.25,1.5]) {
   const page=await browser.newPage({viewport:{width:1920/density,height:900/density},deviceScaleFactor:density});
   await page.goto(base+'?debug=1');await ready(page);
   const root=await measure(page);
   if(!baseline)baseline=root;
   for(const key of Object.keys(root))assert(Math.abs(root[key]-baseline[key])<.0001,`${key} differs at ${density}x display scale`);
   await page.mouse.wheel(0,1000);await page.waitForTimeout(100);assert.equal((await measure(page)).scrollY,0);
   await page.locator('#arcade').press('Enter');await ready(page);fits(await measure(page));
   const length=await page.evaluate(()=>history.length);
   await page.reload();await ready(page);fits(await measure(page));
   assert.equal(await page.evaluate(()=>history.length),length);
   const links=await page.locator('.site-footer a').evaluateAll(es=>es.map(e=>{
    const r=e.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===e;
   }));assert.deepEqual(links,[true,true],'Both legal links must be visible and clickable over the cabinet');
   await page.goBack();await ready(page);assert.equal(await page.evaluate(()=>arcadeDebug.state.view),'carousel');
   await page.goForward();await ready(page);fits(await measure(page));
   console.log(`${density}x display scale: same normalized composition, full-height fit, no scrolling, reload/history and legal links passed`);
   await page.close();
  }
  const page=await browser.newPage({viewport:{width:1360,height:600}});
  await page.goto(base+'?debug=1');await ready(page);
  if(output)await page.screenshot({path:output+'/motion-0.png'});
  await page.locator('#arcade').press('Enter');
  if(output)for(const n of [1,2,3]){await page.waitForTimeout(400);await page.screenshot({path:output+`/motion-${n}.png`});}
  await ready(page);fits(await measure(page));
  if(output)await page.screenshot({path:output+'/motion-4.png'});
  await page.locator('#screen-return').click();await ready(page);
  await page.locator('#arcade').press('Enter');await page.waitForTimeout(400);
  await page.setViewportSize({width:390,height:844});await ready(page);fits(await measure(page));
  await page.locator('#arcade').press('Enter');await page.waitForTimeout(300);
  await page.setViewportSize({width:844,height:390});await ready(page);
  assert.equal(await page.evaluate(()=>arcadeDebug.state.view),'crt');
  const content=await page.locator('#crt-content').boundingBox();assert(Math.abs(content.width/content.height-4/3)<.001);
  await page.goBack();await ready(page);fits(await measure(page));
  await page.goBack();await ready(page);assert.equal((await measure(page)).overflow,0);
  console.log('Resizing during both animated zooms, full cabinet refit, 4:3 content and reverse history passed');
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const viewport of [{width:1360,height:600},{width:390,height:844}]) {
   await page.setViewportSize(viewport);
   for(const slug of ['about-us','retro-handheld','retro-arcade','demo-arcade','merch-shop','links','new-stuff','coming-soon','contact-us']) {
    await page.evaluate(async slug=>{const {navigate}=await import('/router.js');navigate('/'+slug);},slug);
    await ready(page);fits(await measure(page));
    await page.locator('#screen-return').click();await ready(page);
   }
   console.log(`${viewport.width}x${viewport.height}: all nine actual cabinet meshes fit without cropping`);
  }
  await page.close();
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
