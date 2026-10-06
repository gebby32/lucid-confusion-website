import * as THREE from 'three';

/** Per-cabinet CRT adapter. Call update(timeSeconds) from the shared render loop. */
export class CabinetScreen {
  constructor(root) {
    this.root=root;
    this.display=root.getObjectByName('Screen_Display');
    this.glass=root.getObjectByName('CRT_Glass');
    if(!this.display?.isMesh||!this.glass?.isMesh)throw new Error('Missing arcade-crt-v1 screen nodes');
    this.originalDisplay=this.display.material;this.originalGlass=this.glass.material;
    this.display.material=new THREE.MeshBasicMaterial({color:0x020405,toneMapped:false});
    this.glass.material=this.originalGlass.clone();
    this.glass.material.transparent=true;this.glass.material.opacity=.12;this.glass.material.depthWrite=false;
    this.glass.renderOrder=2;
    this.mode='idle';this.owned=new Set();this.noiseCanvas=document.createElement('canvas');
    this.noiseCanvas.width=128;this.noiseCanvas.height=96;this.ctx=this.noiseCanvas.getContext('2d');
    this.noiseImage=this.ctx.createImageData(128,96);this.noiseTexture=this.prepare(new THREE.CanvasTexture(this.noiseCanvas));
    this.owned.add(this.noiseTexture);this.lastNoise=-Infinity;
  }
  prepare(texture){texture.colorSpace=THREE.SRGBColorSpace;texture.flipY=false;texture.needsUpdate=true;return texture}
  releaseSource(){if(this.source&&this.source!==this.noiseTexture&&this.owned.has(this.source)){this.source.dispose();this.owned.delete(this.source)}this.source=null}
  setTexture(texture,{owned=false}={}){
    if(this.source!==texture)this.releaseSource();
    this.source=this.prepare(texture);if(owned)this.owned.add(texture);
    this.mode='texture';this.display.material.map=texture;this.display.material.color.set(0xffffff);this.display.material.needsUpdate=true;
  }
  setCanvas(canvas){this.setTexture(new THREE.CanvasTexture(canvas),{owned:true})}
  setVideo(video){this.setTexture(new THREE.VideoTexture(video),{owned:true});this.mode='video'}
  setIdle(){this.releaseSource();this.mode='idle';this.display.material.map=null;this.display.material.color.set(0x020405);this.display.material.needsUpdate=true}
  setNoise(){this.setTexture(this.noiseTexture);this.mode='noise'}
  setGlow(color=0x4bd8b7){this.releaseSource();this.mode='glow';this.display.material.map=null;this.display.material.color.set(color);this.display.material.needsUpdate=true}
  update(seconds){
    if(this.mode==='noise'&&seconds-this.lastNoise>=1/12){
      const data=this.noiseImage.data;
      for(let i=0;i<data.length;i+=4){const row=Math.floor(i/4/128),v=Math.random()*170+(row%3?20:0);data[i]=v*.65;data[i+1]=v*.9;data[i+2]=v;data[i+3]=255}
      this.ctx.putImageData(this.noiseImage,0,0);this.noiseTexture.needsUpdate=true;this.lastNoise=seconds;
    }
    if(this.source?.isCanvasTexture&&this.mode==='texture')this.source.needsUpdate=true;
  }
  /** Ignores the glass for picking, but rejects hits occluded by cabinet geometry. */
  hit(raycaster){
    const displayHit=raycaster.intersectObject(this.display,false)[0];if(!displayHit)return null;
    const first=raycaster.intersectObject(this.root,true).find(h=>h.object!==this.glass);
    return first?.object===this.display?displayHit:null;
  }
  /** World-space camera target; independent of the cabinet's carousel transform. */
  focusPose(distance=.40){
    this.root.updateMatrixWorld(true);this.display.geometry.computeBoundingBox();
    const target=this.display.localToWorld(this.display.geometry.boundingBox.getCenter(new THREE.Vector3()));
    const normals=this.display.geometry.attributes.normal,n=new THREE.Vector3();
    for(let i=0;i<normals.count;i++)n.add(new THREE.Vector3().fromBufferAttribute(normals,i));
    n.normalize().transformDirection(this.display.matrixWorld);
    return {target,position:target.clone().addScaledVector(n,distance)};
  }
  dispose(){this.display.material.dispose();this.glass.material.dispose();for(const t of this.owned)t.dispose();this.owned.clear();this.display.material=this.originalDisplay;this.glass.material=this.originalGlass}
}

/** Resolves after zoom; caller owns the actual route transition. Returns cancellation. */
export function zoomToScreen({screen,camera,controls,duration=700,onComplete=()=>{}}){
  const pose=screen.focusPose(),from=camera.position.clone(),target=controls.target.clone();
  const start=performance.now(),previous=controls.enabled;let cancelled=false,frame;
  controls.enabled=false;
  const step=now=>{
    if(cancelled)return;
    const t=Math.min(1,(now-start)/duration),ease=t*t*(3-2*t);
    camera.position.lerpVectors(from,pose.position,ease);controls.target.lerpVectors(target,pose.target,ease);controls.update();
    if(t<1)frame=requestAnimationFrame(step);else{controls.enabled=previous;onComplete()}
  };
  frame=requestAnimationFrame(step);
  return ()=>{cancelled=true;cancelAnimationFrame(frame);controls.enabled=previous};
}
