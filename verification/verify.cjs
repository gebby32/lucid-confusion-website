const { chromium } = require('C:/Users/gebby/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({headless:true,channel:'msedge'});
const errors=[];
async function setup(options){const context=await browser.newContext(options);const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});await page.goto('http://127.0.0.1:8771/?debug=1');await page.waitForFunction(()=>window.arcadeDebug);return {context,page};}
async function settle(page){await page.waitForFunction(()=>Math.abs(arcadeDebug.state.angle-arcadeDebug.state.target)<0.00011&&arcadeDebug.state.velocity===0);}
const {page}=await setup({viewport:{width:1440,height:900}});
assert.equal(await page.evaluate(()=>arcadeDebug.state.loaded),9);
assert.equal(await page.evaluate(()=>arcadeDebug.state.active),2);
const modelCheck=await page.evaluate(async()=>{const T=await import('/assets/vendor/three/three.module.min.js');return arcadeDebug.models.map(m=>{const model=m.children[0];const b=new T.Box3().setFromObject(model);const textures=new Set();model.traverse(o=>{if(o.material)for(const mat of [o.material].flat())for(const val of Object.values(mat))if(val?.isTexture)textures.add(val.uuid)});return {name:m.name,ground:b.min.y,height:b.max.y-b.min.y,textures:textures.size};})});
assert(modelCheck.every(m=>Math.abs(m.ground)<1e-6&&Math.abs(m.height-1.8)<1e-5&&m.textures>=4));
for(const direction of ['#next','#previous']) for(let i=0;i<18;i++){await page.click(direction);await settle(page);assert.equal(await page.evaluate(()=>arcadeDebug.models.filter(m=>m.visible&&m.parent===arcadeDebug.ring).length),9);}
assert.equal(await page.evaluate(()=>arcadeDebug.state.active),2);
await page.mouse.move(720,510);await page.mouse.down();for(let i=1;i<=12;i++){await page.mouse.move(720+i*30,510);await page.waitForTimeout(16)}await page.mouse.up();await settle(page);
assert.notEqual(await page.evaluate(()=>arcadeDebug.state.active),2);
assert(!((await page.locator('#announcement').innerText()).includes('Stay tuned')));
await page.click('[aria-label="Choose Retro Arcade"]');await settle(page);
const point=await page.evaluate(async()=>{const T=await import('/assets/vendor/three/three.module.min.js');const m=arcadeDebug.models.find(m=>m.name==='retro-arcade');const p=m.localToWorld(new T.Vector3(0,.9,.4)).project(arcadeDebug.camera);const r=document.querySelector('#arcade').getBoundingClientRect();return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2}});
await page.mouse.click(point.x,point.y);assert((await page.locator('#announcement').innerText()).includes('Stay tuned'));
await page.screenshot({path:'verification/desktop.png'});
await page.locator('#arcade').focus();await page.keyboard.press('ArrowRight');await settle(page);assert.equal(await page.evaluate(()=>arcadeDebug.state.active),3);
for(const url of ['privacy/','terms/']){const response=await page.request.get('http://127.0.0.1:8771/'+url);assert.equal(response.status(),200);}
const mobile=await setup({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const client=await mobile.context.newCDPSession(mobile.page);
await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:80,y:400}]});
for(let i=1;i<=12;i++){await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:80+i*19,y:400}]});await mobile.page.waitForTimeout(16);}
await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await settle(mobile.page);
assert.notEqual(await mobile.page.evaluate(()=>arcadeDebug.state.active),2);
assert(!(await mobile.page.locator('#announcement').innerText()).includes('Stay tuned'));
await mobile.page.click('[aria-label="Choose Retro Arcade"]');await settle(mobile.page);
await mobile.page.screenshot({path:'verification/mobile.png'});
assert(await mobile.page.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
await mobile.page.setViewportSize({width:768,height:1024});await mobile.page.waitForTimeout(300);await mobile.page.screenshot({path:'verification/tablet.png'});
await page.emulateMedia({reducedMotion:'reduce'});await page.click('#next');assert.equal(await page.evaluate(()=>arcadeDebug.state.angle===arcadeDebug.state.target),true);
assert.deepEqual(errors,[]);
console.log(JSON.stringify({passed:true,modelCheck,checks:['nine textured models','ground normalization','two full turns each direction','mouse drag and snap','touch drag and snap','drag activation suppression','front model raycast click','keyboard navigation','reduced motion','mobile overflow','legal pages'],errors},null,2));
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
