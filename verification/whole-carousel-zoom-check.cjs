const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:8773/';
const output = process.env.VERIFICATION_OUTPUT;
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    for (const viewport of [{width:1920,height:916},{width:1440,height:900},{width:390,height:844},{width:320,height:568},{width:844,height:390}]) {
      const page = await browser.newPage({viewport,isMobile:viewport.width<1000,hasTouch:viewport.width<1000});
      const errors=[]; page.on('pageerror',e=>errors.push(e.message));
      await page.goto(base+'?debug=1'); await page.waitForFunction(()=>window.arcadeDebug&&document.documentElement.dataset.routing==='ready');
      await page.evaluate(async()=>{
        const T=await import('/assets/vendor/three/three.module.min.js'),d=arcadeDebug;
        const points=d.models.flatMap(m=>{const c=new T.Box3().setFromObject(m).getCenter(new T.Vector3());return[c,c.clone().add(new T.Vector3(.1,.3,.1))]});
        const pos=d.camera.position.clone(),q=d.camera.quaternion.clone(),zoom=d.camera.zoom;
        const transforms=d.models.map(m=>m.matrixWorld.toArray());
        const original=points.map(p=>p.clone().project(d.camera));
        window.zoomErrors=[]; window.zoomFrames=0; window.recordZoom=true;
        function sample(){
          if(!recordZoom)return;
          const k=d.camera.zoom/zoom, projected=points.map(p=>p.clone().project(d.camera));
          const tx=projected[0].x-k*original[0].x,ty=projected[0].y-k*original[0].y;
          if(d.camera.position.distanceTo(pos)>1e-8||d.camera.quaternion.angleTo(q)>1e-7)zoomErrors.push('Camera moved or tilted');
          if(projected.some((p,i)=>Math.abs(p.x-k*original[i].x-tx)>1e-7||Math.abs(p.y-k*original[i].y-ty)>1e-7))zoomErrors.push('Non-uniform scale or perspective change');
          if(d.models.some((m,i)=>m.matrixWorld.toArray().some((v,j)=>Math.abs(v-transforms[i][j])>1e-8)))zoomErrors.push('Cabinet transform changed');
          zoomFrames++;requestAnimationFrame(sample);
        }requestAnimationFrame(sample);
      });
      await page.locator('#arcade').focus();await page.keyboard.press('Enter');
      await page.waitForFunction(()=>arcadeDebug.state.view==='cabinet'&&!arcadeDebug.state.zoomTransition&&document.documentElement.dataset.routing==='ready');
      const stats=await page.evaluate(async()=>{
        recordZoom=false;
        const T=await import('/assets/vendor/three/three.module.min.js'),d=arcadeDebug,r=document.querySelector('#arcade').getBoundingClientRect();
        const xs=[],ys=[];
        d.screens.get(d.state.active).root.traverse(o=>{const a=o.geometry?.attributes.position;if(a)for(let i=0;i<a.count;i++){const p=new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld).project(d.camera);xs.push(r.x+(p.x+1)*r.width/2);ys.push(r.y+(1-p.y)*r.height/2)}});
        return{errors:zoomErrors,frames:zoomFrames,left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys),tilt:d.camera.getWorldDirection(new T.Vector3()).y,zoom:d.camera.zoom,position:d.camera.position.toArray(),quaternion:d.camera.quaternion.toArray(),offset:d.camera.view.offsetY};
      });
      assert.deepEqual(stats.errors,[]); assert(stats.frames>5);assert(Math.abs(stats.tilt)<1e-9);
      assert(stats.left>=7&&stats.right<=viewport.width-7);assert(stats.top>=11&&stats.bottom<=viewport.height-35);
      assert((stats.bottom-stats.top)/(viewport.height-48)>.99||(stats.right-stats.left)/viewport.width>.95,'Fill available height unless width constrains aspect ratio');
      if(output)await page.screenshot({path:`${output}/whole-carousel-${viewport.width}.png`});
      await page.keyboard.press('Enter');await page.waitForFunction(()=>arcadeDebug.state.view==='crt'&&!arcadeDebug.state.zoomTransition);
      await page.locator('#screen-return').click();await page.waitForFunction(()=>arcadeDebug.state.view==='cabinet'&&!arcadeDebug.state.zoomTransition);
      const restored=await page.evaluate(()=>({zoom:arcadeDebug.camera.zoom,position:arcadeDebug.camera.position.toArray(),quaternion:arcadeDebug.camera.quaternion.toArray(),offset:arcadeDebug.camera.view.offsetY}));
      assert(Math.abs(restored.zoom-stats.zoom)<1e-9&&Math.abs(restored.offset-stats.offset)<1e-9);
      assert(restored.position.every((v,i)=>Math.abs(v-stats.position[i])<1e-9));
      assert(restored.quaternion.every((v,i)=>Math.abs(v-stats.quaternion[i])<1e-9));
      assert.deepEqual(errors,[]);console.log(`${viewport.width}x${viewport.height}: ${stats.frames} frames; fixed camera/angles, uniform whole-carousel scale, full front cabinet, content return passed`);
      await page.close();
    }
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
