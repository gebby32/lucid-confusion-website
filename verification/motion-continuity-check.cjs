const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:8771/';
const output = process.env.VERIFICATION_OUTPUT;
const ready = page => page.waitForFunction(()=>window.arcadeDebug&&document.documentElement.dataset.routing==='ready'&&!arcadeDebug.state.zoomTransition);
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  for(const viewport of [{width:1360,height:600},{width:390,height:844}]) {
   const context=await browser.newContext({viewport,...(output?{recordVideo:{dir:output,size:{width:1360,height:600}}}:{})});
   const page=await context.newPage();
   await page.goto(base+'?debug=1');await ready(page);
   await page.evaluate(async()=>{
    const T=await import('/assets/vendor/three/three.module.min.js'),d=arcadeDebug;
    const camera=d.camera.position.toArray(),rotation=d.camera.quaternion.toArray();
    const mounts=d.models.map(m=>({position:m.position.toArray(),rotation:m.quaternion.toArray()}));
    const feet=()=>{const r=document.querySelector('#arcade').getBoundingClientRect();return d.models.map(m=>{
     const p=new T.Vector3().setFromMatrixPosition(m.matrixWorld).project(d.camera);return r.y+(1-p.y)*r.height/2;
    });};
    window.observeMotion=direction=>{
     window.motionReport={errors:[],frames:0,maxStep:0};let previous=feet();window.sampling=true;
     const tick=()=>{if(!sampling)return;const report=motionReport;
      if(d.camera.position.toArray().some((n,i)=>Math.abs(n-camera[i])>1e-10))report.errors.push('Viewpoint moved');
      if(d.camera.quaternion.toArray().some((n,i)=>Math.abs(n-rotation[i])>1e-10))report.errors.push('Viewpoint tilted');
      if(d.ring.position.y!==0||d.ring.rotation.x!==0||d.ring.rotation.z!==0)report.errors.push('Floor tilted or lifted');
      if(d.models.some((m,i)=>m.position.toArray().some((n,j)=>n!==mounts[i].position[j])||m.quaternion.toArray().some((n,j)=>n!==mounts[i].rotation[j])))report.errors.push('Mounts moved within carousel');
      const scale=d.models[0].scale.x;
      if(d.models.some(m=>m.scale.toArray().some(n=>Math.abs(n-scale)>1e-10)))report.errors.push('Cabinet proportions/shared scaling changed');
      const current=feet();
      if(current.some((n,i)=>(n-previous[i])*direction<-.1))report.errors.push(`Ground contact reversed on screen: ${Math.min(...current.map((n,i)=>(n-previous[i])*direction))}px; view ${d.state.view}; moving ${d.state.zoomTransition}`);
      report.maxStep=Math.max(report.maxStep,...current.map((n,i)=>Math.abs(n-previous[i])));
      previous=current;report.frames++;requestAnimationFrame(tick);
     };requestAnimationFrame(tick);
    };
   });
   if(output)await page.screenshot({path:`${output}/locked-${viewport.width}-rest.png`});
   for(const [name,direction,control] of [['approach',1,'#arcade'],['monitor',1,'#arcade'],['return-cabinet',-1,'#screen-return'],['return-carousel',-1,'#screen-return']]) {
    await page.evaluate(direction=>observeMotion(direction),direction);
    if(control==='#arcade')await page.locator(control).press('Enter');else await page.locator(control).click();
    if(output)for(const n of [1,2,3]){await page.waitForTimeout(350);await page.screenshot({path:`${output}/locked-${viewport.width}-${name}-${n}.png`});}
    await ready(page);await page.waitForTimeout(80);
    const report=await page.evaluate(()=>{sampling=false;return motionReport;});
    assert.deepEqual([...new Set(report.errors)],[],`${viewport.width} ${name}`);
    assert(report.frames>10);console.log(`${viewport.width} ${name}: fixed viewpoint, level floor, shared proportions, monotonic contact; ${report.frames} frames`);
    if(output)await page.screenshot({path:`${output}/locked-${viewport.width}-${name}-end.png`});
   }
   const video=page.video();await context.close();
   if(video&&output)fs.renameSync(await video.path(),`${output}/locked-motion-${viewport.width}.webm`);
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
