const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:8771/';
const output = process.env.VERIFICATION_OUTPUT;
const ready = page => page.waitForFunction(() => window.arcadeDebug && document.documentElement.dataset.routing === 'ready' && !arcadeDebug.state.zoomTransition);
const state = page => page.evaluate(() => arcadeDebug.state.view);
const camera = page => page.evaluate(() => ({p:arcadeDebug.camera.position.toArray(),q:arcadeDebug.camera.quaternion.toArray(),zoom:arcadeDebug.camera.zoom,view:arcadeDebug.camera.view}));
async function monitor(page) {
  return page.evaluate(() => {
    const d=arcadeDebug,r=document.querySelector('#arcade').getBoundingClientRect();
    const p=d.screens.get(d.state.active).focusPose().target.project(d.camera);
    return {x:r.x+(p.x+1)*r.width/2,y:r.y+(1-p.y)*r.height/2};
  });
}
async function background(page) {
  await page.locator('#arcade canvas, #screen-return').evaluateAll(es=>es.forEach(e=>e.style.visibility='hidden'));
  const image=await page.screenshot();
  await page.locator('#arcade canvas, #screen-return').evaluateAll(es=>es.forEach(e=>e.style.visibility=''));
  return image;
}
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    for(const viewport of [{width:1360,height:600},{width:1520,height:695},{width:1920,height:916},{width:1440,height:900},{width:390,height:844},{width:320,height:568},{width:844,height:390}]) {
      const mobile=viewport.width<1000;
      const page=await browser.newPage({viewport,isMobile:mobile,hasTouch:mobile}),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.goto(base+'?debug=1');await ready(page);
      await page.evaluate(()=>scrollTo(0,9999));
      assert.deepEqual(await page.evaluate(()=>({scrollY,height:document.documentElement.scrollHeight,stageY:document.querySelector('#arcade').getBoundingClientRect().y})),{scrollY:0,height:viewport.height,stageY:0},'The scene must fit the visible viewport without page scrolling');
      const resting=await camera(page),room=await background(page);
      if(output)await page.screenshot({path:`${output}/corrected-root-${viewport.width}.png`});
      await page.evaluate(async()=>{
        const T=await import('/assets/vendor/three/three.module.min.js'),d=arcadeDebug,initialRotation=d.camera.quaternion.toArray();
        const mounts=d.models.map(m=>m.matrix.toArray());
        let lastZ=d.ring.position.z;
        let feet=d.models.map(m=>new T.Vector3().setFromMatrixPosition(m.matrixWorld).project(d.camera).y);
        window.motionErrors=[];window.motionFrames=0;window.recordMotion=true;window.layoutShifts=0;
        new PerformanceObserver(list=>{for(const e of list.getEntries())layoutShifts+=e.value;}).observe({type:'layout-shift'});
        function sample(){
          if(!recordMotion)return;
          if(d.camera.quaternion.toArray().some((v,i)=>Math.abs(v-initialRotation[i])>1e-12))motionErrors.push('First zoom tipped the view');
          if(d.ring.position.z<lastZ-1e-8)motionErrors.push(`Carousel moved backward: ${lastZ} -> ${d.ring.position.z}`);
          lastZ=d.ring.position.z;
          const nextFeet=d.models.map(m=>new T.Vector3().setFromMatrixPosition(m.matrixWorld).project(d.camera).y);
          if(nextFeet.some((y,i)=>y>feet[i]+1e-5))motionErrors.push(`A cabinet foot rose on screen: ${Math.max(...nextFeet.map((y,i)=>y-feet[i]))}`);
          feet=nextFeet;
          if(d.ring.position.y!==0||d.ring.rotation.x!==0||d.ring.rotation.z!==0)motionErrors.push('Carousel left its floor plane');
          if(d.ring.scale.toArray().some(s=>s!==1))motionErrors.push('Carousel geometry changed size');
          if(d.models.some((m,i)=>JSON.stringify(m.matrix.toArray())!==JSON.stringify(mounts[i])))motionErrors.push('Relative cabinet transform changed');
          motionFrames++;requestAnimationFrame(sample);
        }requestAnimationFrame(sample);
      });
      const click=async()=>{const p=await monitor(page);if(mobile)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);await ready(page);};
      await click();assert.equal(await state(page),'intro');
      await page.waitForFunction(()=>arcadeDebug.screens.get(arcadeDebug.state.active).mode==='texture');
      assert.deepEqual(await page.evaluate(()=>{recordMotion=false;return motionErrors;}),[]);
      assert(await page.evaluate(()=>motionFrames>5));
      assert.equal(await page.evaluate(()=>layoutShifts),0);
      const introCamera=await camera(page);
      assert.deepEqual(await background(page),room,'The full background, branding and decorations remain pixel-identical');
      const bounds=await page.evaluate(async()=>{
        const T=await import('/assets/vendor/three/three.module.min.js'),d=arcadeDebug,r=document.querySelector('#arcade').getBoundingClientRect();
        let top=Infinity,bottom=-Infinity,left=Infinity,right=-Infinity;
        d.screens.get(d.state.active).root.traverse(o=>{const a=o.geometry?.attributes.position;if(a)for(let i=0;i<a.count;i++){const p=new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld).project(d.camera);const x=r.x+(p.x+1)*r.width/2,y=r.y+(1-p.y)*r.height/2;top=Math.min(top,y);bottom=Math.max(bottom,y);left=Math.min(left,x);right=Math.max(right,x);}});
        return {top,bottom,left,right};
      });
      assert(bounds.top>=-1&&bounds.bottom<=viewport.height+1&&bounds.left>=-1&&bounds.right<=viewport.width+1,'Cabinet fits without clipping');
      assert(Math.abs(bounds.bottom-viewport.height)<1);
      assert(bounds.top<1||Math.max(viewport.width-bounds.right,bounds.left)<viewport.width*.025,'Fill height unless width limits it');
      assert.equal(await page.locator('.site-footer').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
      if(output){await page.waitForTimeout(1300);await page.screenshot({path:`${output}/corrected-cabinet-${viewport.width}.png`});}
      await click();assert.equal(await state(page),'crt');assert(await page.locator('#retro-grid').isVisible());
      const contentCamera=await camera(page);assert.notDeepEqual(contentCamera,resting);
      const frame=await page.locator('#crt-content').boundingBox();assert(Math.abs(frame.width/frame.height-4/3)<.01);
      if(output)await page.screenshot({path:`${output}/content-${viewport.width}.png`});
      const length=await page.evaluate(()=>history.length);
      await page.goBack();await ready(page);assert.equal(await state(page),'intro');assert.deepEqual(await camera(page),introCamera);
      await page.goForward();await ready(page);assert.equal(await state(page),'crt');assert.deepEqual(await camera(page),contentCamera);
      await page.locator('#screen-return').click();await ready(page);assert.equal(await state(page),'intro');
      await page.locator('#screen-return').click();await ready(page);assert.equal(await state(page),'carousel');
      assert.deepEqual(await camera(page),resting);assert.equal(await page.evaluate(()=>history.length),length);
      await page.goForward();await ready(page);assert.equal(await state(page),'intro');
      await page.goForward();await ready(page);assert.equal(await state(page),'crt');
      await page.locator('#screen-return').click();await ready(page);
      // Refit after an orientation change, then restore the original viewport.
      await page.setViewportSize({width:viewport.height,height:viewport.width});
      await page.waitForTimeout(100);await page.setViewportSize(viewport);await page.waitForTimeout(100);
      await page.locator('#screen-return').click();await ready(page);
      if(!mobile){
        const side=await page.evaluate(()=>{
          const d=arcadeDebug,r=document.querySelector('#arcade').getBoundingClientRect();
          const p=d.screens.get(3).focusPose().target.project(d.camera);
          return{x:r.x+(p.x+1)*r.width/2,y:r.y+(1-p.y)*r.height/2,index:3,angle:d.state.angle};
        });
        await page.mouse.click(side.x,side.y);await ready(page);
        assert.equal(await page.evaluate(()=>arcadeDebug.state.active),side.index);
        assert.equal(await state(page),'intro');
        assert(await page.evaluate(()=>{const d=arcadeDebug,m=d.models.find(m=>m.userData.cabinetIndex===d.state.active);return Math.abs(Math.sin(d.ring.rotation.y+m.rotation.y))<1e-10;}));
        await page.locator('#screen-return').click();await ready(page);
        assert(Math.abs(await page.evaluate(()=>arcadeDebug.state.angle)-side.angle)<1e-10);
      }
      await page.emulateMedia({reducedMotion:'reduce'});
      for(const slug of ['about-us','retro-handheld','retro-arcade','demo-arcade','merch-shop','links','new-stuff','coming-soon','contact-us']) {
        await page.goto(base+slug+'/?debug=1');await ready(page);assert.equal(await state(page),'intro');
        await page.waitForFunction(()=>arcadeDebug.screens.get(arcadeDebug.state.active).mode==='texture');
        await click();assert.equal(await state(page),'crt');
        await page.locator(slug==='links'?'#links-return':'#screen-return').click();await ready(page);assert.equal(await state(page),'intro');
        await page.locator('#screen-return').click();await ready(page);assert.equal(await state(page),'carousel');
      }
      assert.deepEqual(errors,[]);
      console.log(`${viewport.width}x${viewport.height}: no page scroll, fixed background, rigid forward motion, monotonic floor contact in screen space, full framing, two click/tap zooms, UI/history round trips, resize and nine cabinets passed`);
      await page.close();
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
