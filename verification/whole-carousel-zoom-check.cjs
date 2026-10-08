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
        const local=d.models.map(m=>m.matrix.toArray()),pos=d.camera.position.clone(),zoom=d.camera.zoom;
        const points=[];d.screens.get(d.state.active).root.traverse(o=>{const a=o.geometry?.attributes.position;if(a)for(let i=0;i<a.count;i++)points.push(new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld))});
        const foot=()=>Math.max(...points.map(p=>{const v=p.clone();v.z+=d.ring.position.z;v.project(d.camera);return(1-v.y)*document.querySelector('#arcade').clientHeight/2}));
        const fromBottom=foot();let lastBottom=fromBottom,lastZ=0;
        window.zoomErrors=[];window.zoomFrames=0;window.recordZoom=true;window.initialZoom=zoom;
        window.floorSamples=[];
        function sample(){
          if(!recordZoom)return;
          const bottom=foot(),z=d.ring.position.z;
          if(Math.abs(d.camera.position.x-pos.x)>1e-8||Math.abs(d.camera.position.z-pos.z)>1e-8||d.camera.position.y>pos.y+1e-8)zoomErrors.push('Camera left the floor-level approach path');
          if(d.ring.position.x!==0||d.ring.position.y!==0||z+1e-8<lastZ)zoomErrors.push('Carousel did not advance straight along floor');
          if(d.models.some((m,i)=>m.matrix.toArray().some((v,j)=>Math.abs(v-local[i][j])>1e-8)))zoomErrors.push('Relative cabinet positions/angles/scales changed');
          if(fromBottom<innerHeight-2&&bottom+0.05<lastBottom)zoomErrors.push('Front feet levitated');
          if(d.camera.zoom/zoom>1.080001)zoomErrors.push('Optical zoom exceeded gentle finish');
          floorSamples.push({z,bottom,zoom:d.camera.zoom/zoom});lastBottom=bottom;lastZ=z;
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
        return{errors:zoomErrors,frames:zoomFrames,left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys),travel:d.ring.position.z,samples:floorSamples,tilt:d.camera.getWorldDirection(new T.Vector3()).y,zoom:d.camera.zoom,position:d.camera.position.toArray(),quaternion:d.camera.quaternion.toArray(),offset:d.camera.view.offsetY};
      });
      assert.deepEqual(stats.errors,[]); assert(stats.frames>5);assert(stats.travel>0.1);assert(Math.abs(stats.tilt)<0.061);
      assert(stats.left>=2&&stats.right<=viewport.width-2);assert(stats.top>=1&&Math.abs(stats.bottom-(viewport.height-2))<0.1);
      assert((stats.bottom-stats.top)/(viewport.height-4)>.99||(stats.right-stats.left)/viewport.width>.95,'Fill available height unless width constrains aspect ratio');
      if(output)await page.screenshot({path:`${output}/whole-carousel-${viewport.width}.png`});
      await page.keyboard.press('Enter');await page.waitForFunction(()=>arcadeDebug.state.view==='crt'&&!arcadeDebug.state.zoomTransition);
      await page.locator('#screen-return').click();await page.waitForFunction(()=>arcadeDebug.state.view==='cabinet'&&!arcadeDebug.state.zoomTransition);
      const restored=await page.evaluate(()=>({zoom:arcadeDebug.camera.zoom,position:arcadeDebug.camera.position.toArray(),quaternion:arcadeDebug.camera.quaternion.toArray(),offset:arcadeDebug.camera.view.offsetY}));
      assert(Math.abs(restored.zoom-stats.zoom)<1e-9&&Math.abs(restored.offset-stats.offset)<1e-9);
      assert(restored.position.every((v,i)=>Math.abs(v-stats.position[i])<1e-9));
      assert(restored.quaternion.every((v,i)=>Math.abs(v-stats.quaternion[i])<1e-9));
      await page.keyboard.press('Escape');await page.waitForFunction(()=>arcadeDebug.state.view==='carousel'&&document.documentElement.dataset.routing==='ready');
      assert.equal(await page.evaluate(()=>arcadeDebug.ring.position.z),0);
      assert.deepEqual(errors,[]);console.log(`${viewport.width}x${viewport.height}: ${stats.frames} frames; 3D floor travel, no front-foot lift, delayed gentle zoom, full front cabinet, content return passed`);
      await page.close();
    }
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
