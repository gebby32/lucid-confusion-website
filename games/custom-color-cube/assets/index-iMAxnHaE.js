(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function e(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(s){if(s.ep)return;s.ep=!0;const r=e(s);fetch(s.href,r)}})();const oh=["U","R","F","D","L","B"],rn=[[0,1,0],[1,0,0],[0,0,1],[0,-1,0],[-1,0,0],[0,0,-1]],Ya=[[1,0,0],[0,0,-1],[1,0,0],[1,0,0],[0,0,1],[-1,0,0]],ec=[[0,0,-1],[0,1,0],[0,1,0],[0,0,1],[0,1,0],[0,1,0]];function lh(i,t,e){const n=rn[i],s=Ya[i],r=ec[i],a=e-1,o=1-t;return[n[0]+a*s[0]+o*r[0],n[1]+a*s[1]+o*r[1],n[2]+a*s[2]+o*r[2]]}const Ka=[];for(let i=0;i<6;i++)for(let t=0;t<3;t++)for(let e=0;e<3;e++)Ka.push({index:i*9+t*3+e,face:i,row:t,col:e,pos:lh(i,t,e),normal:rn[i]});const ta=(i,t)=>`${i[0]},${i[1]},${i[2]}|${t[0]},${t[1]},${t[2]}`,ch=new Map(Ka.map(i=>[ta(i.pos,i.normal),i.index]));function ea(i,t){const e=ch.get(ta(i,t));if(e===void 0)throw new Error(`no facelet at ${ta(i,t)}`);return e}function Hi(i,t,e){e=(e%4+4)%4;let[n,s,r]=i;for(let a=0;a<e;a++)t===0?[s,r]=[-r,s]:t===1?[n,r]=[r,-n]:[n,s]=[-s,n];return[n,s,r]}function hh(i){const t=Math.floor(i/3),e=i%3+1,n=rn[t],s=n[0]?0:n[1]?1:2,r=n[s],a=e===2?2:e===1?-r:r;return{face:t,power:e,axis:s,layer:r,q:a}}const Za=[];for(let i=0;i<18;i++){const{axis:t,layer:e,q:n}=hh(i),s=new Int8Array(54);for(let r=0;r<54;r++)s[r]=r;for(const r of Ka){if(r.pos[t]!==e)continue;const a=ea(Hi(r.pos,t,n),Hi(r.normal,t,n));s[a]=r.index}Za.push(s)}function uh(){const i=new Int8Array(54);for(let t=0;t<54;t++)i[t]=Math.floor(t/9);return i}function dh(i,t){const e=Za[t],n=new Int8Array(54);for(let s=0;s<54;s++)n[s]=i[e[s]];return n}function fh(i){for(let t=0;t<6;t++){const e=i[t*9];for(let n=1;n<9;n++)if(i[t*9+n]!==e)return!1}return!0}const ph=[[8,9,20],[6,18,38],[0,36,47],[2,45,11],[29,26,15],[27,44,24],[33,53,42],[35,17,51]],Uo=[[5,10],[7,19],[3,37],[1,46],[32,16],[28,25],[30,43],[34,52],[23,12],[21,41],[50,39],[48,14]],an=0,Mn=1,Sn=2,on=3,bn=4,En=5,Io=[[an,Mn,Sn],[an,Sn,bn],[an,bn,En],[an,En,Mn],[on,Sn,Mn],[on,bn,Sn],[on,En,bn],[on,Mn,En]],rs=[[an,Mn],[an,Sn],[an,bn],[an,En],[on,Mn],[on,Sn],[on,bn],[on,En],[Sn,Mn],[Sn,bn],[En,bn],[En,Mn]];function mh(){return{cp:Int8Array.from([0,1,2,3,4,5,6,7]),co:new Int8Array(8),ep:Int8Array.from([0,1,2,3,4,5,6,7,8,9,10,11]),eo:new Int8Array(12)}}function na(i){const t=mh();for(let e=0;e<8;e++){const n=ph[e];let s=0;for(;s<3&&!(i[n[s]]===an||i[n[s]]===on);s++);if(s===3)throw new Error("invalid corner");const r=i[n[(s+1)%3]],a=i[n[(s+2)%3]];let o=-1;for(let l=0;l<8;l++)Io[l][1]===r&&Io[l][2]===a&&(o=l);if(o<0)throw new Error("invalid corner colours");t.cp[e]=o,t.co[e]=s}for(let e=0;e<12;e++){const n=i[Uo[e][0]],s=i[Uo[e][1]];let r=-1;for(let a=0;a<12;a++)rs[a][0]===n&&rs[a][1]===s?(r=a,t.eo[e]=0):rs[a][0]===s&&rs[a][1]===n&&(r=a,t.eo[e]=1);if(r<0)throw new Error("invalid edge colours");t.ep[e]=r}return t}Za.map((i,t)=>na(dh(uh(),t)));function gh(i){return`${i.cp.join("")}.${i.co.join("")}.${Array.from(i.ep,t=>t.toString(16)).join("")}.${i.eo.join("")}`}function vh(i){const t=[];for(const e of i.trim().split(/\s+/).filter(Boolean)){const n=oh.indexOf(e[0]);if(n<0)throw new Error(`bad move ${e}`);const s=e.slice(1),r=s===""?0:s==="2"?1:s==="'"?2:-1;if(r<0)throw new Error(`bad move ${e}`);t.push(n*3+r)}return t}function _h(i){return Math.floor(i/3)*3+(2-i%3)}const Qn=(i,t)=>i[0]*t[0]+i[1]*t[1]+i[2]*t[2];class Qs{constructor(){this.reset()}reset(){this.pieces=[];let t=0;for(let e=-1;e<=1;e++)for(let n=-1;n<=1;n++)for(let s=-1;s<=1;s++)!e&&!n&&!s||this.pieces.push({id:t++,home:[e,n,s],pos:[e,n,s],rot:[[1,0,0],[0,1,0],[0,0,1]]})}clone(){const t=new Qs;return t.pieces=this.pieces.map(e=>({id:e.id,home:e.home,pos:e.pos.slice(),rot:e.rot.map(n=>n.slice())})),t}turn(t,e,n){if(n=(n%4+4)%4,!!n)for(const s of this.pieces)s.pos[t]===e&&(s.pos=Hi(s.pos,t,n),s.rot=s.rot.map(r=>Hi(r,t,n)))}piecesInLayer(t,e){return this.pieces.filter(n=>n.pos[t]===e)}stickers(){const t=[];for(const e of this.pieces)for(let n=0;n<6;n++){const s=rn[n],r=s[0]?0:s[1]?1:2;if(e.home[r]!==s[r])continue;const a=[0,0,0];for(let o=0;o<3;o++)a[o]=e.rot[0][o]*s[0]+e.rot[1][o]*s[1]+e.rot[2][o]*s[2];t.push({piece:e,face:n,pos:e.pos,normal:a})}return t}spatialFacelets(){const t=new Int8Array(54);for(const e of this.stickers())t[ea(e.pos,e.normal)]=e.face;return t}isSolved(){return fh(this.spatialFacelets())}centerPos(t){const e=rn[t];return this.pieces.find(n=>n.home[0]===e[0]&&n.home[1]===e[1]&&n.home[2]===e[2]).pos}frame(){return{r:this.centerPos(1),u:this.centerPos(0),f:this.centerPos(2)}}normalizedFacelets(){const{r:t,u:e,f:n}=this.frame(),s=a=>[Qn(t,a),Qn(e,a),Qn(n,a)],r=new Int8Array(54);for(const a of this.stickers())r[ea(s(a.pos),s(a.normal))]=a.face;return r}stateKey(){return gh(na(this.normalizedFacelets()))}centerSpins(){const{r:t,u:e,f:n}=this.frame(),s=r=>[Qn(t,r),Qn(e,r),Qn(n,r)];return rn.map((r,a)=>{const o=this.pieces.find(u=>u.home[0]===r[0]&&u.home[1]===r[1]&&u.home[2]===r[2]),l=Ya[a],c=s([0,1,2].map(u=>l[0]*o.rot[0][u]+l[1]*o.rot[1][u]+l[2]*o.rot[2][u])),h=r[0]?0:r[1]?1:2,d=r[h];for(let u=0;u<4;u++){const f=Hi(l,h,-d*u);if(f[0]===c[0]&&f[1]===c[1]&&f[2]===c[2])return u}throw new Error("invalid centre orientation")})}isPictureSolved(t){return this.isSolved()?t?this.centerSpins().every((n,s)=>!(t>>s&1)||n===0):!0:!1}snapshot(){return this.pieces.map(t=>[t.pos.slice(),t.rot.map(e=>e.slice())])}restore(t){if(!Array.isArray(t)||t.length!==this.pieces.length)throw new Error("bad snapshot");const e=r=>Array.isArray(r)&&r.length===3&&r.every(a=>a===0||a===1||a===-1)&&Math.abs(r[0])+Math.abs(r[1])+Math.abs(r[2])===1,n=this.clone();if(t.forEach(([r,a],o)=>{if(!Array.isArray(r)||r.length!==3||!r.every(l=>l===0||l===1||l===-1))throw new Error("bad position");if(!Array.isArray(a)||a.length!==3||!a.every(e))throw new Error("bad rotation");n.pieces[o].pos=r.slice(),n.pieces[o].rot=a.map(l=>l.slice())}),new Set(n.pieces.map(r=>r.pos.join())).size!==n.pieces.length)throw new Error("overlapping pieces");na(n.normalizedFacelets()),n.centerSpins(),this.pieces=n.pieces}solverMoveToTurn(t){const{r:e,u:n,f:s}=this.frame(),r=Math.floor(t/3),a=t%3+1,o=rn[r],l=[0,1,2].map(u=>o[0]*e[u]+o[1]*n[u]+o[2]*s[u]),c=l[0]?0:l[1]?1:2,h=l[c],d=a===2?2:a===1?-h:h;return{axis:c,layer:h,q:d,face:r,power:a}}applySolverMoves(t){for(const e of t){const n=this.solverMoveToTurn(e);this.turn(n.axis,n.layer,n.q)}}}function xh(i,t){return(t%4+4)%4===0?0:i===0?2:1}function yh(){return new Worker(new URL(""+new URL("solver.worker-ISVH1NyP.js",import.meta.url).href,import.meta.url),{type:"module"})}class Mh extends Error{constructor(){super("cancelled"),this.name="CancelledError"}}class nc{constructor(){this.pending=new Map,this.nextId=1,this.spawn()}spawn(){this.worker=yh(),this.worker.onmessage=t=>{const{id:e,result:n,error:s,superseded:r}=t.data,a=this.pending.get(e);a&&(this.pending.delete(e),r?a.resolve(null):s?a.reject(new Error(s)):a.resolve(n))},this.ready=this.request({type:"init"}),this.ready.catch(()=>{})}request(t){const e=this.nextId++;return new Promise((n,s)=>{this.pending.set(e,{resolve:n,reject:s}),this.worker.postMessage({...t,id:e})})}cancel(){this.worker.terminate();for(const t of this.pending.values())t.reject(new Mh);this.pending.clear(),this.spawn()}solve(t,{channel:e="hint",optimalTime:n=5e3,fallbackTime:s=1500,centers:r=null}={}){return this.request({type:"solve",facelets:Array.from(t),channel:e,optimalTime:n,fallbackTime:s,centers:r})}generate(t,e,{timeLimit:n=45e3}={}){return this.request({type:"generate",min:t,max:e,timeLimit:n,channel:"generate"})}}/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Ja="169",Sh=0,No=1,bh=2,ic=1,sc=2,nn=3,Cn=0,xe=1,sn=2,An=0,Mi=1,Fo=2,Oo=3,Bo=4,Eh=5,Hn=100,wh=101,Th=102,Ah=103,Rh=104,Ch=200,Ph=201,Lh=202,Dh=203,ia=204,sa=205,Uh=206,Ih=207,Nh=208,Fh=209,Oh=210,Bh=211,zh=212,kh=213,Hh=214,ra=0,aa=1,oa=2,Ei=3,la=4,ca=5,ha=6,ua=7,rc=0,Vh=1,Gh=2,Rn=0,Wh=1,Xh=2,$h=3,qh=4,Yh=5,Kh=6,ac=7,oc=300,wi=301,Ti=302,da=303,fa=304,tr=306,Gs=1e3,Gn=1001,pa=1002,Ie=1003,Zh=1004,as=1005,ze=1006,hr=1007,Wn=1008,dn=1009,lc=1010,cc=1011,Yi=1012,ja=1013,qn=1014,ln=1015,Qi=1016,Qa=1017,to=1018,Ai=1020,hc=35902,uc=1021,dc=1022,He=1023,fc=1024,pc=1025,Si=1026,Ri=1027,mc=1028,eo=1029,gc=1030,no=1031,io=1033,Is=33776,Ns=33777,Fs=33778,Os=33779,ma=35840,ga=35841,va=35842,_a=35843,xa=36196,ya=37492,Ma=37496,Sa=37808,ba=37809,Ea=37810,wa=37811,Ta=37812,Aa=37813,Ra=37814,Ca=37815,Pa=37816,La=37817,Da=37818,Ua=37819,Ia=37820,Na=37821,Bs=36492,Fa=36494,Oa=36495,vc=36283,Ba=36284,za=36285,ka=36286,Jh=3200,jh=3201,_c=0,Qh=1,yn="",Re="srgb",Ln="srgb-linear",so="display-p3",er="display-p3-linear",Ws="linear",ne="srgb",Xs="rec709",$s="p3",ti=7680,zo=519,tu=512,eu=513,nu=514,xc=515,iu=516,su=517,ru=518,au=519,ko=35044,Ho="300 es",cn=2e3,qs=2001;class Pi{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;const n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;const s=this._listeners[t];if(s!==void 0){const r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const n=this._listeners[t.type];if(n!==void 0){t.target=this;const s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,t);t.target=null}}}const pe=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let Vo=1234567;const Vi=Math.PI/180,Ki=180/Math.PI;function Zn(){const i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(pe[i&255]+pe[i>>8&255]+pe[i>>16&255]+pe[i>>24&255]+"-"+pe[t&255]+pe[t>>8&255]+"-"+pe[t>>16&15|64]+pe[t>>24&255]+"-"+pe[e&63|128]+pe[e>>8&255]+"-"+pe[e>>16&255]+pe[e>>24&255]+pe[n&255]+pe[n>>8&255]+pe[n>>16&255]+pe[n>>24&255]).toLowerCase()}function ue(i,t,e){return Math.max(t,Math.min(e,i))}function ro(i,t){return(i%t+t)%t}function ou(i,t,e,n,s){return n+(i-t)*(s-n)/(e-t)}function lu(i,t,e){return i!==t?(e-i)/(t-i):0}function Gi(i,t,e){return(1-e)*i+e*t}function cu(i,t,e,n){return Gi(i,t,1-Math.exp(-e*n))}function hu(i,t=1){return t-Math.abs(ro(i,t*2)-t)}function uu(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*(3-2*i))}function du(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*i*(i*(i*6-15)+10))}function fu(i,t){return i+Math.floor(Math.random()*(t-i+1))}function pu(i,t){return i+Math.random()*(t-i)}function mu(i){return i*(.5-Math.random())}function gu(i){i!==void 0&&(Vo=i);let t=Vo+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function vu(i){return i*Vi}function _u(i){return i*Ki}function xu(i){return(i&i-1)===0&&i!==0}function yu(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function Mu(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function Su(i,t,e,n,s){const r=Math.cos,a=Math.sin,o=r(e/2),l=a(e/2),c=r((t+n)/2),h=a((t+n)/2),d=r((t-n)/2),u=a((t-n)/2),f=r((n-t)/2),g=a((n-t)/2);switch(s){case"XYX":i.set(o*h,l*d,l*u,o*c);break;case"YZY":i.set(l*u,o*h,l*d,o*c);break;case"ZXZ":i.set(l*d,l*u,o*h,o*c);break;case"XZX":i.set(o*h,l*g,l*f,o*c);break;case"YXY":i.set(l*f,o*h,l*g,o*c);break;case"ZYZ":i.set(l*g,l*f,o*h,o*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function _i(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function ve(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}const bu={DEG2RAD:Vi,RAD2DEG:Ki,generateUUID:Zn,clamp:ue,euclideanModulo:ro,mapLinear:ou,inverseLerp:lu,lerp:Gi,damp:cu,pingpong:hu,smoothstep:uu,smootherstep:du,randInt:fu,randFloat:pu,randFloatSpread:mu,seededRandom:gu,degToRad:vu,radToDeg:_u,isPowerOfTwo:xu,ceilPowerOfTwo:yu,floorPowerOfTwo:Mu,setQuaternionFromProperEuler:Su,normalize:ve,denormalize:_i};class it{constructor(t=0,e=0){it.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(ue(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,a=this.y-t.y;return this.x=r*n-a*s+t.x,this.y=r*s+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Bt{constructor(t,e,n,s,r,a,o,l,c){Bt.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,c)}set(t,e,n,s,r,a,o,l,c){const h=this.elements;return h[0]=t,h[1]=s,h[2]=o,h[3]=e,h[4]=r,h[5]=l,h[6]=n,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],h=n[4],d=n[7],u=n[2],f=n[5],g=n[8],x=s[0],p=s[3],m=s[6],T=s[1],y=s[4],b=s[7],N=s[2],C=s[5],A=s[8];return r[0]=a*x+o*T+l*N,r[3]=a*p+o*y+l*C,r[6]=a*m+o*b+l*A,r[1]=c*x+h*T+d*N,r[4]=c*p+h*y+d*C,r[7]=c*m+h*b+d*A,r[2]=u*x+f*T+g*N,r[5]=u*p+f*y+g*C,r[8]=u*m+f*b+g*A,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8];return e*a*h-e*o*c-n*r*h+n*o*l+s*r*c-s*a*l}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8],d=h*a-o*c,u=o*l-h*r,f=c*r-a*l,g=e*d+n*u+s*f;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const x=1/g;return t[0]=d*x,t[1]=(s*c-h*n)*x,t[2]=(o*n-s*a)*x,t[3]=u*x,t[4]=(h*e-s*l)*x,t[5]=(s*r-o*e)*x,t[6]=f*x,t[7]=(n*l-c*e)*x,t[8]=(a*e-n*r)*x,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,a,o){const l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+t,-s*c,s*l,-s*(-c*a+l*o)+o+e,0,0,1),this}scale(t,e){return this.premultiply(ur.makeScale(t,e)),this}rotate(t){return this.premultiply(ur.makeRotation(-t)),this}translate(t,e){return this.premultiply(ur.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const ur=new Bt;function yc(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function Ys(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Eu(){const i=Ys("canvas");return i.style.display="block",i}const Go={};function zs(i){i in Go||(Go[i]=!0,console.warn(i))}function wu(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}function Tu(i){const t=i.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function Au(i){const t=i.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}const Wo=new Bt().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),Xo=new Bt().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),Ui={[Ln]:{transfer:Ws,primaries:Xs,luminanceCoefficients:[.2126,.7152,.0722],toReference:i=>i,fromReference:i=>i},[Re]:{transfer:ne,primaries:Xs,luminanceCoefficients:[.2126,.7152,.0722],toReference:i=>i.convertSRGBToLinear(),fromReference:i=>i.convertLinearToSRGB()},[er]:{transfer:Ws,primaries:$s,luminanceCoefficients:[.2289,.6917,.0793],toReference:i=>i.applyMatrix3(Xo),fromReference:i=>i.applyMatrix3(Wo)},[so]:{transfer:ne,primaries:$s,luminanceCoefficients:[.2289,.6917,.0793],toReference:i=>i.convertSRGBToLinear().applyMatrix3(Xo),fromReference:i=>i.applyMatrix3(Wo).convertLinearToSRGB()}},Ru=new Set([Ln,er]),Kt={enabled:!0,_workingColorSpace:Ln,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(i){if(!Ru.has(i))throw new Error(`Unsupported working color space, "${i}".`);this._workingColorSpace=i},convert:function(i,t,e){if(this.enabled===!1||t===e||!t||!e)return i;const n=Ui[t].toReference,s=Ui[e].fromReference;return s(n(i))},fromWorkingColorSpace:function(i,t){return this.convert(i,this._workingColorSpace,t)},toWorkingColorSpace:function(i,t){return this.convert(i,t,this._workingColorSpace)},getPrimaries:function(i){return Ui[i].primaries},getTransfer:function(i){return i===yn?Ws:Ui[i].transfer},getLuminanceCoefficients:function(i,t=this._workingColorSpace){return i.fromArray(Ui[t].luminanceCoefficients)}};function bi(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function dr(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let ei;class Cu{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{ei===void 0&&(ei=Ys("canvas")),ei.width=t.width,ei.height=t.height;const n=ei.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=ei}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=Ys("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=bi(r[a]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(bi(e[n]/255)*255):e[n]=bi(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let Pu=0;class Mc{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Pu++}),this.uuid=Zn(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(fr(s[a].image)):r.push(fr(s[a]))}else r=fr(s);n.url=r}return e||(t.images[this.uuid]=n),n}}function fr(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Cu.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Lu=0;class ge extends Pi{constructor(t=ge.DEFAULT_IMAGE,e=ge.DEFAULT_MAPPING,n=Gn,s=Gn,r=ze,a=Wn,o=He,l=dn,c=ge.DEFAULT_ANISOTROPY,h=yn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Lu++}),this.uuid=Zn(),this.name="",this.source=new Mc(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new it(0,0),this.repeat=new it(1,1),this.center=new it(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Bt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==oc)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Gs:t.x=t.x-Math.floor(t.x);break;case Gn:t.x=t.x<0?0:1;break;case pa:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Gs:t.y=t.y-Math.floor(t.y);break;case Gn:t.y=t.y<0?0:1;break;case pa:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}ge.DEFAULT_IMAGE=null;ge.DEFAULT_MAPPING=oc;ge.DEFAULT_ANISOTROPY=1;class Jt{constructor(t=0,e=0,n=0,s=1){Jt.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*e+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*e+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*e+a[7]*n+a[11]*s+a[15]*r,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r;const l=t.elements,c=l[0],h=l[4],d=l[8],u=l[1],f=l[5],g=l[9],x=l[2],p=l[6],m=l[10];if(Math.abs(h-u)<.01&&Math.abs(d-x)<.01&&Math.abs(g-p)<.01){if(Math.abs(h+u)<.1&&Math.abs(d+x)<.1&&Math.abs(g+p)<.1&&Math.abs(c+f+m-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const y=(c+1)/2,b=(f+1)/2,N=(m+1)/2,C=(h+u)/4,A=(d+x)/4,U=(g+p)/4;return y>b&&y>N?y<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(y),s=C/n,r=A/n):b>N?b<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(b),n=C/s,r=U/s):N<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(N),n=A/r,s=U/r),this.set(n,s,r,e),this}let T=Math.sqrt((p-g)*(p-g)+(d-x)*(d-x)+(u-h)*(u-h));return Math.abs(T)<.001&&(T=1),this.x=(p-g)/T,this.y=(d-x)/T,this.z=(u-h)/T,this.w=Math.acos((c+f+m-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Du extends Pi{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new Jt(0,0,t,e),this.scissorTest=!1,this.viewport=new Jt(0,0,t,e);const s={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:ze,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);const r=new ge(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];const a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,s=t.textures.length;n<s;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;const e=Object.assign({},t.texture.image);return this.texture.source=new Mc(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Yn extends Du{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class Sc extends ge{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Ie,this.minFilter=Ie,this.wrapR=Gn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class Uu extends ge{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Ie,this.minFilter=Ie,this.wrapR=Gn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class hn{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,a,o){let l=n[s+0],c=n[s+1],h=n[s+2],d=n[s+3];const u=r[a+0],f=r[a+1],g=r[a+2],x=r[a+3];if(o===0){t[e+0]=l,t[e+1]=c,t[e+2]=h,t[e+3]=d;return}if(o===1){t[e+0]=u,t[e+1]=f,t[e+2]=g,t[e+3]=x;return}if(d!==x||l!==u||c!==f||h!==g){let p=1-o;const m=l*u+c*f+h*g+d*x,T=m>=0?1:-1,y=1-m*m;if(y>Number.EPSILON){const N=Math.sqrt(y),C=Math.atan2(N,m*T);p=Math.sin(p*C)/N,o=Math.sin(o*C)/N}const b=o*T;if(l=l*p+u*b,c=c*p+f*b,h=h*p+g*b,d=d*p+x*b,p===1-o){const N=1/Math.sqrt(l*l+c*c+h*h+d*d);l*=N,c*=N,h*=N,d*=N}}t[e]=l,t[e+1]=c,t[e+2]=h,t[e+3]=d}static multiplyQuaternionsFlat(t,e,n,s,r,a){const o=n[s],l=n[s+1],c=n[s+2],h=n[s+3],d=r[a],u=r[a+1],f=r[a+2],g=r[a+3];return t[e]=o*g+h*d+l*f-c*u,t[e+1]=l*g+h*u+c*d-o*f,t[e+2]=c*g+h*f+o*u-l*d,t[e+3]=h*g-o*d-l*u-c*f,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,s=t._y,r=t._z,a=t._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(s/2),d=o(r/2),u=l(n/2),f=l(s/2),g=l(r/2);switch(a){case"XYZ":this._x=u*h*d+c*f*g,this._y=c*f*d-u*h*g,this._z=c*h*g+u*f*d,this._w=c*h*d-u*f*g;break;case"YXZ":this._x=u*h*d+c*f*g,this._y=c*f*d-u*h*g,this._z=c*h*g-u*f*d,this._w=c*h*d+u*f*g;break;case"ZXY":this._x=u*h*d-c*f*g,this._y=c*f*d+u*h*g,this._z=c*h*g+u*f*d,this._w=c*h*d-u*f*g;break;case"ZYX":this._x=u*h*d-c*f*g,this._y=c*f*d+u*h*g,this._z=c*h*g-u*f*d,this._w=c*h*d+u*f*g;break;case"YZX":this._x=u*h*d+c*f*g,this._y=c*f*d+u*h*g,this._z=c*h*g-u*f*d,this._w=c*h*d-u*f*g;break;case"XZY":this._x=u*h*d-c*f*g,this._y=c*f*d-u*h*g,this._z=c*h*g+u*f*d,this._w=c*h*d+u*f*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],s=e[4],r=e[8],a=e[1],o=e[5],l=e[9],c=e[2],h=e[6],d=e[10],u=n+o+d;if(u>0){const f=.5/Math.sqrt(u+1);this._w=.25/f,this._x=(h-l)*f,this._y=(r-c)*f,this._z=(a-s)*f}else if(n>o&&n>d){const f=2*Math.sqrt(1+n-o-d);this._w=(h-l)/f,this._x=.25*f,this._y=(s+a)/f,this._z=(r+c)/f}else if(o>d){const f=2*Math.sqrt(1+o-n-d);this._w=(r-c)/f,this._x=(s+a)/f,this._y=.25*f,this._z=(l+h)/f}else{const f=2*Math.sqrt(1+d-n-o);this._w=(a-s)/f,this._x=(r+c)/f,this._y=(l+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(ue(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,s=t._y,r=t._z,a=t._w,o=e._x,l=e._y,c=e._z,h=e._w;return this._x=n*h+a*o+s*c-r*l,this._y=s*h+a*l+r*o-n*c,this._z=r*h+a*c+n*l-s*o,this._w=a*h-n*o-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const n=this._x,s=this._y,r=this._z,a=this._w;let o=a*t._w+n*t._x+s*t._y+r*t._z;if(o<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,o=-o):this.copy(t),o>=1)return this._w=a,this._x=n,this._y=s,this._z=r,this;const l=1-o*o;if(l<=Number.EPSILON){const f=1-e;return this._w=f*a+e*this._w,this._x=f*n+e*this._x,this._y=f*s+e*this._y,this._z=f*r+e*this._z,this.normalize(),this}const c=Math.sqrt(l),h=Math.atan2(c,o),d=Math.sin((1-e)*h)/c,u=Math.sin(e*h)/c;return this._w=a*d+this._w*u,this._x=n*d+this._x*u,this._y=s*d+this._y*u,this._z=r*d+this._z*u,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class R{constructor(t=0,e=0,n=0){R.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion($o.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion($o.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=t.elements,a=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(t){const e=this.x,n=this.y,s=this.z,r=t.x,a=t.y,o=t.z,l=t.w,c=2*(a*s-o*n),h=2*(o*e-r*s),d=2*(r*n-a*e);return this.x=e+l*c+a*d-o*h,this.y=n+l*h+o*c-r*d,this.z=s+l*d+r*h-a*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,s=t.y,r=t.z,a=e.x,o=e.y,l=e.z;return this.x=s*l-r*o,this.y=r*a-n*l,this.z=n*o-s*a,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return pr.copy(this).projectOnVector(t),this.sub(pr)}reflect(t){return this.sub(pr.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(ue(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const pr=new R,$o=new hn;class ts{constructor(t=new R(1/0,1/0,1/0),e=new R(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(Fe.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(Fe.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=Fe.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,Fe):Fe.fromBufferAttribute(r,a),Fe.applyMatrix4(t.matrixWorld),this.expandByPoint(Fe);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),os.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),os.copy(n.boundingBox)),os.applyMatrix4(t.matrixWorld),this.union(os)}const s=t.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Fe),Fe.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Ii),ls.subVectors(this.max,Ii),ni.subVectors(t.a,Ii),ii.subVectors(t.b,Ii),si.subVectors(t.c,Ii),pn.subVectors(ii,ni),mn.subVectors(si,ii),Un.subVectors(ni,si);let e=[0,-pn.z,pn.y,0,-mn.z,mn.y,0,-Un.z,Un.y,pn.z,0,-pn.x,mn.z,0,-mn.x,Un.z,0,-Un.x,-pn.y,pn.x,0,-mn.y,mn.x,0,-Un.y,Un.x,0];return!mr(e,ni,ii,si,ls)||(e=[1,0,0,0,1,0,0,0,1],!mr(e,ni,ii,si,ls))?!1:(cs.crossVectors(pn,mn),e=[cs.x,cs.y,cs.z],mr(e,ni,ii,si,ls))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Fe).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Fe).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Je[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Je[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Je[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Je[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Je[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Je[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Je[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Je[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Je),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const Je=[new R,new R,new R,new R,new R,new R,new R,new R],Fe=new R,os=new ts,ni=new R,ii=new R,si=new R,pn=new R,mn=new R,Un=new R,Ii=new R,ls=new R,cs=new R,In=new R;function mr(i,t,e,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){In.fromArray(i,r);const o=s.x*Math.abs(In.x)+s.y*Math.abs(In.y)+s.z*Math.abs(In.z),l=t.dot(In),c=e.dot(In),h=n.dot(In);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}const Iu=new ts,Ni=new R,gr=new R;class ao{constructor(t=new R,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):Iu.setFromPoints(t).getCenter(n);let s=0;for(let r=0,a=t.length;r<a;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Ni.subVectors(t,this.center);const e=Ni.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(Ni,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(gr.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Ni.copy(t.center).add(gr)),this.expandByPoint(Ni.copy(t.center).sub(gr))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const je=new R,vr=new R,hs=new R,gn=new R,_r=new R,us=new R,xr=new R;class bc{constructor(t=new R,e=new R(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,je)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=je.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(je.copy(this.origin).addScaledVector(this.direction,e),je.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){vr.copy(t).add(e).multiplyScalar(.5),hs.copy(e).sub(t).normalize(),gn.copy(this.origin).sub(vr);const r=t.distanceTo(e)*.5,a=-this.direction.dot(hs),o=gn.dot(this.direction),l=-gn.dot(hs),c=gn.lengthSq(),h=Math.abs(1-a*a);let d,u,f,g;if(h>0)if(d=a*l-o,u=a*o-l,g=r*h,d>=0)if(u>=-g)if(u<=g){const x=1/h;d*=x,u*=x,f=d*(d+a*u+2*o)+u*(a*d+u+2*l)+c}else u=r,d=Math.max(0,-(a*u+o)),f=-d*d+u*(u+2*l)+c;else u=-r,d=Math.max(0,-(a*u+o)),f=-d*d+u*(u+2*l)+c;else u<=-g?(d=Math.max(0,-(-a*r+o)),u=d>0?-r:Math.min(Math.max(-r,-l),r),f=-d*d+u*(u+2*l)+c):u<=g?(d=0,u=Math.min(Math.max(-r,-l),r),f=u*(u+2*l)+c):(d=Math.max(0,-(a*r+o)),u=d>0?r:Math.min(Math.max(-r,-l),r),f=-d*d+u*(u+2*l)+c);else u=a>0?-r:r,d=Math.max(0,-(a*u+o)),f=-d*d+u*(u+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,d),s&&s.copy(vr).addScaledVector(hs,u),f}intersectSphere(t,e){je.subVectors(t.center,this.origin);const n=je.dot(this.direction),s=je.dot(je)-n*n,r=t.radius*t.radius;if(s>r)return null;const a=Math.sqrt(r-s),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,a,o,l;const c=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,u=this.origin;return c>=0?(n=(t.min.x-u.x)*c,s=(t.max.x-u.x)*c):(n=(t.max.x-u.x)*c,s=(t.min.x-u.x)*c),h>=0?(r=(t.min.y-u.y)*h,a=(t.max.y-u.y)*h):(r=(t.max.y-u.y)*h,a=(t.min.y-u.y)*h),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),d>=0?(o=(t.min.z-u.z)*d,l=(t.max.z-u.z)*d):(o=(t.max.z-u.z)*d,l=(t.min.z-u.z)*d),n>l||o>s)||((o>n||n!==n)&&(n=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,je)!==null}intersectTriangle(t,e,n,s,r){_r.subVectors(e,t),us.subVectors(n,t),xr.crossVectors(_r,us);let a=this.direction.dot(xr),o;if(a>0){if(s)return null;o=1}else if(a<0)o=-1,a=-a;else return null;gn.subVectors(this.origin,t);const l=o*this.direction.dot(us.crossVectors(gn,us));if(l<0)return null;const c=o*this.direction.dot(_r.cross(gn));if(c<0||l+c>a)return null;const h=-o*gn.dot(xr);return h<0?null:this.at(h/a,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Qt{constructor(t,e,n,s,r,a,o,l,c,h,d,u,f,g,x,p){Qt.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,c,h,d,u,f,g,x,p)}set(t,e,n,s,r,a,o,l,c,h,d,u,f,g,x,p){const m=this.elements;return m[0]=t,m[4]=e,m[8]=n,m[12]=s,m[1]=r,m[5]=a,m[9]=o,m[13]=l,m[2]=c,m[6]=h,m[10]=d,m[14]=u,m[3]=f,m[7]=g,m[11]=x,m[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Qt().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,n=t.elements,s=1/ri.setFromMatrixColumn(t,0).length(),r=1/ri.setFromMatrixColumn(t,1).length(),a=1/ri.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,s=t.y,r=t.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),d=Math.sin(r);if(t.order==="XYZ"){const u=a*h,f=a*d,g=o*h,x=o*d;e[0]=l*h,e[4]=-l*d,e[8]=c,e[1]=f+g*c,e[5]=u-x*c,e[9]=-o*l,e[2]=x-u*c,e[6]=g+f*c,e[10]=a*l}else if(t.order==="YXZ"){const u=l*h,f=l*d,g=c*h,x=c*d;e[0]=u+x*o,e[4]=g*o-f,e[8]=a*c,e[1]=a*d,e[5]=a*h,e[9]=-o,e[2]=f*o-g,e[6]=x+u*o,e[10]=a*l}else if(t.order==="ZXY"){const u=l*h,f=l*d,g=c*h,x=c*d;e[0]=u-x*o,e[4]=-a*d,e[8]=g+f*o,e[1]=f+g*o,e[5]=a*h,e[9]=x-u*o,e[2]=-a*c,e[6]=o,e[10]=a*l}else if(t.order==="ZYX"){const u=a*h,f=a*d,g=o*h,x=o*d;e[0]=l*h,e[4]=g*c-f,e[8]=u*c+x,e[1]=l*d,e[5]=x*c+u,e[9]=f*c-g,e[2]=-c,e[6]=o*l,e[10]=a*l}else if(t.order==="YZX"){const u=a*l,f=a*c,g=o*l,x=o*c;e[0]=l*h,e[4]=x-u*d,e[8]=g*d+f,e[1]=d,e[5]=a*h,e[9]=-o*h,e[2]=-c*h,e[6]=f*d+g,e[10]=u-x*d}else if(t.order==="XZY"){const u=a*l,f=a*c,g=o*l,x=o*c;e[0]=l*h,e[4]=-d,e[8]=c*h,e[1]=u*d+x,e[5]=a*h,e[9]=f*d-g,e[2]=g*d-f,e[6]=o*h,e[10]=x*d+u}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Nu,t,Fu)}lookAt(t,e,n){const s=this.elements;return we.subVectors(t,e),we.lengthSq()===0&&(we.z=1),we.normalize(),vn.crossVectors(n,we),vn.lengthSq()===0&&(Math.abs(n.z)===1?we.x+=1e-4:we.z+=1e-4,we.normalize(),vn.crossVectors(n,we)),vn.normalize(),ds.crossVectors(we,vn),s[0]=vn.x,s[4]=ds.x,s[8]=we.x,s[1]=vn.y,s[5]=ds.y,s[9]=we.y,s[2]=vn.z,s[6]=ds.z,s[10]=we.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],h=n[1],d=n[5],u=n[9],f=n[13],g=n[2],x=n[6],p=n[10],m=n[14],T=n[3],y=n[7],b=n[11],N=n[15],C=s[0],A=s[4],U=s[8],Z=s[12],v=s[1],S=s[5],H=s[9],B=s[13],k=s[2],J=s[6],O=s[10],Q=s[14],G=s[3],ut=s[7],pt=s[11],mt=s[15];return r[0]=a*C+o*v+l*k+c*G,r[4]=a*A+o*S+l*J+c*ut,r[8]=a*U+o*H+l*O+c*pt,r[12]=a*Z+o*B+l*Q+c*mt,r[1]=h*C+d*v+u*k+f*G,r[5]=h*A+d*S+u*J+f*ut,r[9]=h*U+d*H+u*O+f*pt,r[13]=h*Z+d*B+u*Q+f*mt,r[2]=g*C+x*v+p*k+m*G,r[6]=g*A+x*S+p*J+m*ut,r[10]=g*U+x*H+p*O+m*pt,r[14]=g*Z+x*B+p*Q+m*mt,r[3]=T*C+y*v+b*k+N*G,r[7]=T*A+y*S+b*J+N*ut,r[11]=T*U+y*H+b*O+N*pt,r[15]=T*Z+y*B+b*Q+N*mt,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],a=t[1],o=t[5],l=t[9],c=t[13],h=t[2],d=t[6],u=t[10],f=t[14],g=t[3],x=t[7],p=t[11],m=t[15];return g*(+r*l*d-s*c*d-r*o*u+n*c*u+s*o*f-n*l*f)+x*(+e*l*f-e*c*u+r*a*u-s*a*f+s*c*h-r*l*h)+p*(+e*c*d-e*o*f-r*a*d+n*a*f+r*o*h-n*c*h)+m*(-s*o*h-e*l*d+e*o*u+s*a*d-n*a*u+n*l*h)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8],d=t[9],u=t[10],f=t[11],g=t[12],x=t[13],p=t[14],m=t[15],T=d*p*c-x*u*c+x*l*f-o*p*f-d*l*m+o*u*m,y=g*u*c-h*p*c-g*l*f+a*p*f+h*l*m-a*u*m,b=h*x*c-g*d*c+g*o*f-a*x*f-h*o*m+a*d*m,N=g*d*l-h*x*l-g*o*u+a*x*u+h*o*p-a*d*p,C=e*T+n*y+s*b+r*N;if(C===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const A=1/C;return t[0]=T*A,t[1]=(x*u*r-d*p*r-x*s*f+n*p*f+d*s*m-n*u*m)*A,t[2]=(o*p*r-x*l*r+x*s*c-n*p*c-o*s*m+n*l*m)*A,t[3]=(d*l*r-o*u*r-d*s*c+n*u*c+o*s*f-n*l*f)*A,t[4]=y*A,t[5]=(h*p*r-g*u*r+g*s*f-e*p*f-h*s*m+e*u*m)*A,t[6]=(g*l*r-a*p*r-g*s*c+e*p*c+a*s*m-e*l*m)*A,t[7]=(a*u*r-h*l*r+h*s*c-e*u*c-a*s*f+e*l*f)*A,t[8]=b*A,t[9]=(g*d*r-h*x*r-g*n*f+e*x*f+h*n*m-e*d*m)*A,t[10]=(a*x*r-g*o*r+g*n*c-e*x*c-a*n*m+e*o*m)*A,t[11]=(h*o*r-a*d*r-h*n*c+e*d*c+a*n*f-e*o*f)*A,t[12]=N*A,t[13]=(h*x*s-g*d*s+g*n*u-e*x*u-h*n*p+e*d*p)*A,t[14]=(g*o*s-a*x*s-g*n*l+e*x*l+a*n*p-e*o*p)*A,t[15]=(a*d*s-h*o*s+h*n*l-e*d*l-a*n*u+e*o*u)*A,this}scale(t){const e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),s=Math.sin(e),r=1-n,a=t.x,o=t.y,l=t.z,c=r*a,h=r*o;return this.set(c*a+n,c*o-s*l,c*l+s*o,0,c*o+s*l,h*o+n,h*l-s*a,0,c*l-s*o,h*l+s*a,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,a){return this.set(1,n,r,0,t,1,a,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){const s=this.elements,r=e._x,a=e._y,o=e._z,l=e._w,c=r+r,h=a+a,d=o+o,u=r*c,f=r*h,g=r*d,x=a*h,p=a*d,m=o*d,T=l*c,y=l*h,b=l*d,N=n.x,C=n.y,A=n.z;return s[0]=(1-(x+m))*N,s[1]=(f+b)*N,s[2]=(g-y)*N,s[3]=0,s[4]=(f-b)*C,s[5]=(1-(u+m))*C,s[6]=(p+T)*C,s[7]=0,s[8]=(g+y)*A,s[9]=(p-T)*A,s[10]=(1-(u+x))*A,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){const s=this.elements;let r=ri.set(s[0],s[1],s[2]).length();const a=ri.set(s[4],s[5],s[6]).length(),o=ri.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),t.x=s[12],t.y=s[13],t.z=s[14],Oe.copy(this);const c=1/r,h=1/a,d=1/o;return Oe.elements[0]*=c,Oe.elements[1]*=c,Oe.elements[2]*=c,Oe.elements[4]*=h,Oe.elements[5]*=h,Oe.elements[6]*=h,Oe.elements[8]*=d,Oe.elements[9]*=d,Oe.elements[10]*=d,e.setFromRotationMatrix(Oe),n.x=r,n.y=a,n.z=o,this}makePerspective(t,e,n,s,r,a,o=cn){const l=this.elements,c=2*r/(e-t),h=2*r/(n-s),d=(e+t)/(e-t),u=(n+s)/(n-s);let f,g;if(o===cn)f=-(a+r)/(a-r),g=-2*a*r/(a-r);else if(o===qs)f=-a/(a-r),g=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=d,l[12]=0,l[1]=0,l[5]=h,l[9]=u,l[13]=0,l[2]=0,l[6]=0,l[10]=f,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,s,r,a,o=cn){const l=this.elements,c=1/(e-t),h=1/(n-s),d=1/(a-r),u=(e+t)*c,f=(n+s)*h;let g,x;if(o===cn)g=(a+r)*d,x=-2*d;else if(o===qs)g=r*d,x=-1*d;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-u,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-f,l[2]=0,l[6]=0,l[10]=x,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}}const ri=new R,Oe=new Qt,Nu=new R(0,0,0),Fu=new R(1,1,1),vn=new R,ds=new R,we=new R,qo=new Qt,Yo=new hn;class Ve{constructor(t=0,e=0,n=0,s=Ve.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const s=t.elements,r=s[0],a=s[4],o=s[8],l=s[1],c=s[5],h=s[9],d=s[2],u=s[6],f=s[10];switch(e){case"XYZ":this._y=Math.asin(ue(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-ue(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,r),this._z=0);break;case"ZXY":this._x=Math.asin(ue(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-d,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-ue(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(u,f),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(ue(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-d,r)):(this._x=0,this._y=Math.atan2(o,f));break;case"XZY":this._z=Math.asin(-ue(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return qo.makeRotationFromQuaternion(t),this.setFromRotationMatrix(qo,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Yo.setFromEuler(this),this.setFromQuaternion(Yo,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Ve.DEFAULT_ORDER="XYZ";class oo{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let Ou=0;const Ko=new R,ai=new hn,Qe=new Qt,fs=new R,Fi=new R,Bu=new R,zu=new hn,Zo=new R(1,0,0),Jo=new R(0,1,0),jo=new R(0,0,1),Qo={type:"added"},ku={type:"removed"},oi={type:"childadded",child:null},yr={type:"childremoved",child:null};class fe extends Pi{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Ou++}),this.uuid=Zn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=fe.DEFAULT_UP.clone();const t=new R,e=new Ve,n=new hn,s=new R(1,1,1);function r(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new Qt},normalMatrix:{value:new Bt}}),this.matrix=new Qt,this.matrixWorld=new Qt,this.matrixAutoUpdate=fe.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=fe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new oo,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return ai.setFromAxisAngle(t,e),this.quaternion.multiply(ai),this}rotateOnWorldAxis(t,e){return ai.setFromAxisAngle(t,e),this.quaternion.premultiply(ai),this}rotateX(t){return this.rotateOnAxis(Zo,t)}rotateY(t){return this.rotateOnAxis(Jo,t)}rotateZ(t){return this.rotateOnAxis(jo,t)}translateOnAxis(t,e){return Ko.copy(t).applyQuaternion(this.quaternion),this.position.add(Ko.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Zo,t)}translateY(t){return this.translateOnAxis(Jo,t)}translateZ(t){return this.translateOnAxis(jo,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Qe.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?fs.copy(t):fs.set(t,e,n);const s=this.parent;this.updateWorldMatrix(!0,!1),Fi.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Qe.lookAt(Fi,fs,this.up):Qe.lookAt(fs,Fi,this.up),this.quaternion.setFromRotationMatrix(Qe),s&&(Qe.extractRotation(s.matrixWorld),ai.setFromRotationMatrix(Qe),this.quaternion.premultiply(ai.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Qo),oi.child=t,this.dispatchEvent(oi),oi.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(ku),yr.child=t,this.dispatchEvent(yr),yr.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Qe.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Qe.multiply(t.parent.matrixWorld)),t.applyMatrix4(Qe),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Qo),oi.child=t,this.dispatchEvent(oi),oi.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){const a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Fi,t,Bu),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Fi,zu,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){const s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){const d=l[c];r(t.shapes,d)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(t.materials,this.material[l]));s.material=o}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];s.animations.push(r(t.animations,l))}}if(e){const o=a(t.geometries),l=a(t.materials),c=a(t.textures),h=a(t.images),d=a(t.shapes),u=a(t.skeletons),f=a(t.animations),g=a(t.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),d.length>0&&(n.shapes=d),u.length>0&&(n.skeletons=u),f.length>0&&(n.animations=f),g.length>0&&(n.nodes=g)}return n.object=s,n;function a(o){const l=[];for(const c in o){const h=o[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const s=t.children[n];this.add(s.clone())}return this}}fe.DEFAULT_UP=new R(0,1,0);fe.DEFAULT_MATRIX_AUTO_UPDATE=!0;fe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const Be=new R,tn=new R,Mr=new R,en=new R,li=new R,ci=new R,tl=new R,Sr=new R,br=new R,Er=new R,wr=new Jt,Tr=new Jt,Ar=new Jt;class ke{constructor(t=new R,e=new R,n=new R){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),Be.subVectors(t,e),s.cross(Be);const r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){Be.subVectors(s,e),tn.subVectors(n,e),Mr.subVectors(t,e);const a=Be.dot(Be),o=Be.dot(tn),l=Be.dot(Mr),c=tn.dot(tn),h=tn.dot(Mr),d=a*c-o*o;if(d===0)return r.set(0,0,0),null;const u=1/d,f=(c*l-o*h)*u,g=(a*h-o*l)*u;return r.set(1-f-g,g,f)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,en)===null?!1:en.x>=0&&en.y>=0&&en.x+en.y<=1}static getInterpolation(t,e,n,s,r,a,o,l){return this.getBarycoord(t,e,n,s,en)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,en.x),l.addScaledVector(a,en.y),l.addScaledVector(o,en.z),l)}static getInterpolatedAttribute(t,e,n,s,r,a){return wr.setScalar(0),Tr.setScalar(0),Ar.setScalar(0),wr.fromBufferAttribute(t,e),Tr.fromBufferAttribute(t,n),Ar.fromBufferAttribute(t,s),a.setScalar(0),a.addScaledVector(wr,r.x),a.addScaledVector(Tr,r.y),a.addScaledVector(Ar,r.z),a}static isFrontFacing(t,e,n,s){return Be.subVectors(n,e),tn.subVectors(t,e),Be.cross(tn).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Be.subVectors(this.c,this.b),tn.subVectors(this.a,this.b),Be.cross(tn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return ke.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return ke.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return ke.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return ke.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return ke.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,s=this.b,r=this.c;let a,o;li.subVectors(s,n),ci.subVectors(r,n),Sr.subVectors(t,n);const l=li.dot(Sr),c=ci.dot(Sr);if(l<=0&&c<=0)return e.copy(n);br.subVectors(t,s);const h=li.dot(br),d=ci.dot(br);if(h>=0&&d<=h)return e.copy(s);const u=l*d-h*c;if(u<=0&&l>=0&&h<=0)return a=l/(l-h),e.copy(n).addScaledVector(li,a);Er.subVectors(t,r);const f=li.dot(Er),g=ci.dot(Er);if(g>=0&&f<=g)return e.copy(r);const x=f*c-l*g;if(x<=0&&c>=0&&g<=0)return o=c/(c-g),e.copy(n).addScaledVector(ci,o);const p=h*g-f*d;if(p<=0&&d-h>=0&&f-g>=0)return tl.subVectors(r,s),o=(d-h)/(d-h+(f-g)),e.copy(s).addScaledVector(tl,o);const m=1/(p+x+u);return a=x*m,o=u*m,e.copy(n).addScaledVector(li,a).addScaledVector(ci,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const Ec={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},_n={h:0,s:0,l:0},ps={h:0,s:0,l:0};function Rr(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}class Ht{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Re){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Kt.toWorkingColorSpace(this,e),this}setRGB(t,e,n,s=Kt.workingColorSpace){return this.r=t,this.g=e,this.b=n,Kt.toWorkingColorSpace(this,s),this}setHSL(t,e,n,s=Kt.workingColorSpace){if(t=ro(t,1),e=ue(e,0,1),n=ue(n,0,1),e===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+e):n+e-n*e,a=2*n-r;this.r=Rr(a,r,t+1/3),this.g=Rr(a,r,t),this.b=Rr(a,r,t-1/3)}return Kt.toWorkingColorSpace(this,s),this}setStyle(t,e=Re){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r;const a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){const r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Re){const n=Ec[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=bi(t.r),this.g=bi(t.g),this.b=bi(t.b),this}copyLinearToSRGB(t){return this.r=dr(t.r),this.g=dr(t.g),this.b=dr(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Re){return Kt.fromWorkingColorSpace(me.copy(this),t),Math.round(ue(me.r*255,0,255))*65536+Math.round(ue(me.g*255,0,255))*256+Math.round(ue(me.b*255,0,255))}getHexString(t=Re){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Kt.workingColorSpace){Kt.fromWorkingColorSpace(me.copy(this),e);const n=me.r,s=me.g,r=me.b,a=Math.max(n,s,r),o=Math.min(n,s,r);let l,c;const h=(o+a)/2;if(o===a)l=0,c=0;else{const d=a-o;switch(c=h<=.5?d/(a+o):d/(2-a-o),a){case n:l=(s-r)/d+(s<r?6:0);break;case s:l=(r-n)/d+2;break;case r:l=(n-s)/d+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,e=Kt.workingColorSpace){return Kt.fromWorkingColorSpace(me.copy(this),e),t.r=me.r,t.g=me.g,t.b=me.b,t}getStyle(t=Re){Kt.fromWorkingColorSpace(me.copy(this),t);const e=me.r,n=me.g,s=me.b;return t!==Re?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(_n),this.setHSL(_n.h+t,_n.s+e,_n.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(_n),t.getHSL(ps);const n=Gi(_n.h,ps.h,e),s=Gi(_n.s,ps.s,e),r=Gi(_n.l,ps.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const me=new Ht;Ht.NAMES=Ec;let Hu=0;class es extends Pi{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Hu++}),this.uuid=Zn(),this.name="",this.type="Material",this.blending=Mi,this.side=Cn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=ia,this.blendDst=sa,this.blendEquation=Hn,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ht(0,0,0),this.blendAlpha=0,this.depthFunc=Ei,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=zo,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=ti,this.stencilZFail=ti,this.stencilZPass=ti,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const s=this[e];if(s===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Mi&&(n.blending=this.blending),this.side!==Cn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==ia&&(n.blendSrc=this.blendSrc),this.blendDst!==sa&&(n.blendDst=this.blendDst),this.blendEquation!==Hn&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Ei&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==zo&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==ti&&(n.stencilFail=this.stencilFail),this.stencilZFail!==ti&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==ti&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){const a=[];for(const o in r){const l=r[o];delete l.metadata,a.push(l)}return a}if(e){const r=s(t.textures),a=s(t.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}}class nr extends es{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ht(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ve,this.combine=rc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const oe=new R,ms=new it;class $e{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=ko,this.updateRanges=[],this.gpuType=ln,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)ms.fromBufferAttribute(this,e),ms.applyMatrix3(t),this.setXY(e,ms.x,ms.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)oe.fromBufferAttribute(this,e),oe.applyMatrix3(t),this.setXYZ(e,oe.x,oe.y,oe.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)oe.fromBufferAttribute(this,e),oe.applyMatrix4(t),this.setXYZ(e,oe.x,oe.y,oe.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)oe.fromBufferAttribute(this,e),oe.applyNormalMatrix(t),this.setXYZ(e,oe.x,oe.y,oe.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)oe.fromBufferAttribute(this,e),oe.transformDirection(t),this.setXYZ(e,oe.x,oe.y,oe.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=_i(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=ve(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=_i(e,this.array)),e}setX(t,e){return this.normalized&&(e=ve(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=_i(e,this.array)),e}setY(t,e){return this.normalized&&(e=ve(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=_i(e,this.array)),e}setZ(t,e){return this.normalized&&(e=ve(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=_i(e,this.array)),e}setW(t,e){return this.normalized&&(e=ve(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=ve(e,this.array),n=ve(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=ve(e,this.array),n=ve(n,this.array),s=ve(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=ve(e,this.array),n=ve(n,this.array),s=ve(s,this.array),r=ve(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==ko&&(t.usage=this.usage),t}}class wc extends $e{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class Tc extends $e{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class ye extends $e{constructor(t,e,n){super(new Float32Array(t),e,n)}}let Vu=0;const De=new Qt,Cr=new fe,hi=new R,Te=new ts,Oi=new ts,he=new R;class Ke extends Pi{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Vu++}),this.uuid=Zn(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(yc(t)?Tc:wc)(t,1):this.index=t,this}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new Bt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return De.makeRotationFromQuaternion(t),this.applyMatrix4(De),this}rotateX(t){return De.makeRotationX(t),this.applyMatrix4(De),this}rotateY(t){return De.makeRotationY(t),this.applyMatrix4(De),this}rotateZ(t){return De.makeRotationZ(t),this.applyMatrix4(De),this}translate(t,e,n){return De.makeTranslation(t,e,n),this.applyMatrix4(De),this}scale(t,e,n){return De.makeScale(t,e,n),this.applyMatrix4(De),this}lookAt(t){return Cr.lookAt(t),Cr.updateMatrix(),this.applyMatrix4(Cr.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(hi).negate(),this.translate(hi.x,hi.y,hi.z),this}setFromPoints(t){const e=[];for(let n=0,s=t.length;n<s;n++){const r=t[n];e.push(r.x,r.y,r.z||0)}return this.setAttribute("position",new ye(e,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ts);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new R(-1/0,-1/0,-1/0),new R(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){const r=e[n];Te.setFromBufferAttribute(r),this.morphTargetsRelative?(he.addVectors(this.boundingBox.min,Te.min),this.boundingBox.expandByPoint(he),he.addVectors(this.boundingBox.max,Te.max),this.boundingBox.expandByPoint(he)):(this.boundingBox.expandByPoint(Te.min),this.boundingBox.expandByPoint(Te.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new ao);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new R,1/0);return}if(t){const n=this.boundingSphere.center;if(Te.setFromBufferAttribute(t),e)for(let r=0,a=e.length;r<a;r++){const o=e[r];Oi.setFromBufferAttribute(o),this.morphTargetsRelative?(he.addVectors(Te.min,Oi.min),Te.expandByPoint(he),he.addVectors(Te.max,Oi.max),Te.expandByPoint(he)):(Te.expandByPoint(Oi.min),Te.expandByPoint(Oi.max))}Te.getCenter(n);let s=0;for(let r=0,a=t.count;r<a;r++)he.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(he));if(e)for(let r=0,a=e.length;r<a;r++){const o=e[r],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)he.fromBufferAttribute(o,c),l&&(hi.fromBufferAttribute(t,c),he.add(hi)),s=Math.max(s,n.distanceToSquared(he))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,s=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new $e(new Float32Array(4*n.count),4));const a=this.getAttribute("tangent"),o=[],l=[];for(let U=0;U<n.count;U++)o[U]=new R,l[U]=new R;const c=new R,h=new R,d=new R,u=new it,f=new it,g=new it,x=new R,p=new R;function m(U,Z,v){c.fromBufferAttribute(n,U),h.fromBufferAttribute(n,Z),d.fromBufferAttribute(n,v),u.fromBufferAttribute(r,U),f.fromBufferAttribute(r,Z),g.fromBufferAttribute(r,v),h.sub(c),d.sub(c),f.sub(u),g.sub(u);const S=1/(f.x*g.y-g.x*f.y);isFinite(S)&&(x.copy(h).multiplyScalar(g.y).addScaledVector(d,-f.y).multiplyScalar(S),p.copy(d).multiplyScalar(f.x).addScaledVector(h,-g.x).multiplyScalar(S),o[U].add(x),o[Z].add(x),o[v].add(x),l[U].add(p),l[Z].add(p),l[v].add(p))}let T=this.groups;T.length===0&&(T=[{start:0,count:t.count}]);for(let U=0,Z=T.length;U<Z;++U){const v=T[U],S=v.start,H=v.count;for(let B=S,k=S+H;B<k;B+=3)m(t.getX(B+0),t.getX(B+1),t.getX(B+2))}const y=new R,b=new R,N=new R,C=new R;function A(U){N.fromBufferAttribute(s,U),C.copy(N);const Z=o[U];y.copy(Z),y.sub(N.multiplyScalar(N.dot(Z))).normalize(),b.crossVectors(C,Z);const S=b.dot(l[U])<0?-1:1;a.setXYZW(U,y.x,y.y,y.z,S)}for(let U=0,Z=T.length;U<Z;++U){const v=T[U],S=v.start,H=v.count;for(let B=S,k=S+H;B<k;B+=3)A(t.getX(B+0)),A(t.getX(B+1)),A(t.getX(B+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new $e(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let u=0,f=n.count;u<f;u++)n.setXYZ(u,0,0,0);const s=new R,r=new R,a=new R,o=new R,l=new R,c=new R,h=new R,d=new R;if(t)for(let u=0,f=t.count;u<f;u+=3){const g=t.getX(u+0),x=t.getX(u+1),p=t.getX(u+2);s.fromBufferAttribute(e,g),r.fromBufferAttribute(e,x),a.fromBufferAttribute(e,p),h.subVectors(a,r),d.subVectors(s,r),h.cross(d),o.fromBufferAttribute(n,g),l.fromBufferAttribute(n,x),c.fromBufferAttribute(n,p),o.add(h),l.add(h),c.add(h),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(x,l.x,l.y,l.z),n.setXYZ(p,c.x,c.y,c.z)}else for(let u=0,f=e.count;u<f;u+=3)s.fromBufferAttribute(e,u+0),r.fromBufferAttribute(e,u+1),a.fromBufferAttribute(e,u+2),h.subVectors(a,r),d.subVectors(s,r),h.cross(d),n.setXYZ(u+0,h.x,h.y,h.z),n.setXYZ(u+1,h.x,h.y,h.z),n.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)he.fromBufferAttribute(t,e),he.normalize(),t.setXYZ(e,he.x,he.y,he.z)}toNonIndexed(){function t(o,l){const c=o.array,h=o.itemSize,d=o.normalized,u=new c.constructor(l.length*h);let f=0,g=0;for(let x=0,p=l.length;x<p;x++){o.isInterleavedBufferAttribute?f=l[x]*o.data.stride+o.offset:f=l[x]*h;for(let m=0;m<h;m++)u[g++]=c[f++]}return new $e(u,h,d)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new Ke,n=this.index.array,s=this.attributes;for(const o in s){const l=s[o],c=t(l,n);e.setAttribute(o,c)}const r=this.morphAttributes;for(const o in r){const l=[],c=r[o];for(let h=0,d=c.length;h<d;h++){const u=c[h],f=t(u,n);l.push(f)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const c=a[o];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const l in n){const c=n[l];t.data.attributes[l]=c.toJSON(t.data)}const s={};let r=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],h=[];for(let d=0,u=c.length;d<u;d++){const f=c[d];h.push(f.toJSON(t.data))}h.length>0&&(s[l]=h,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(t.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone(e));const s=t.attributes;for(const c in s){const h=s[c];this.setAttribute(c,h.clone(e))}const r=t.morphAttributes;for(const c in r){const h=[],d=r[c];for(let u=0,f=d.length;u<f;u++)h.push(d[u].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;const a=t.groups;for(let c=0,h=a.length;c<h;c++){const d=a[c];this.addGroup(d.start,d.count,d.materialIndex)}const o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const el=new Qt,Nn=new bc,gs=new ao,nl=new R,vs=new R,_s=new R,xs=new R,Pr=new R,ys=new R,il=new R,Ms=new R;class jt extends fe{constructor(t=new Ke,e=new nr){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){const o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(t,e){const n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(s,t);const o=this.morphTargetInfluences;if(r&&o){ys.set(0,0,0);for(let l=0,c=r.length;l<c;l++){const h=o[l],d=r[l];h!==0&&(Pr.fromBufferAttribute(d,t),a?ys.addScaledVector(Pr,h):ys.addScaledVector(Pr.sub(e),h))}e.add(ys)}return e}raycast(t,e){const n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),gs.copy(n.boundingSphere),gs.applyMatrix4(r),Nn.copy(t.ray).recast(t.near),!(gs.containsPoint(Nn.origin)===!1&&(Nn.intersectSphere(gs,nl)===null||Nn.origin.distanceToSquared(nl)>(t.far-t.near)**2))&&(el.copy(r).invert(),Nn.copy(t.ray).applyMatrix4(el),!(n.boundingBox!==null&&Nn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,Nn)))}_computeIntersections(t,e,n){let s;const r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,d=r.attributes.normal,u=r.groups,f=r.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,x=u.length;g<x;g++){const p=u[g],m=a[p.materialIndex],T=Math.max(p.start,f.start),y=Math.min(o.count,Math.min(p.start+p.count,f.start+f.count));for(let b=T,N=y;b<N;b+=3){const C=o.getX(b),A=o.getX(b+1),U=o.getX(b+2);s=Ss(this,m,t,n,c,h,d,C,A,U),s&&(s.faceIndex=Math.floor(b/3),s.face.materialIndex=p.materialIndex,e.push(s))}}else{const g=Math.max(0,f.start),x=Math.min(o.count,f.start+f.count);for(let p=g,m=x;p<m;p+=3){const T=o.getX(p),y=o.getX(p+1),b=o.getX(p+2);s=Ss(this,a,t,n,c,h,d,T,y,b),s&&(s.faceIndex=Math.floor(p/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,x=u.length;g<x;g++){const p=u[g],m=a[p.materialIndex],T=Math.max(p.start,f.start),y=Math.min(l.count,Math.min(p.start+p.count,f.start+f.count));for(let b=T,N=y;b<N;b+=3){const C=b,A=b+1,U=b+2;s=Ss(this,m,t,n,c,h,d,C,A,U),s&&(s.faceIndex=Math.floor(b/3),s.face.materialIndex=p.materialIndex,e.push(s))}}else{const g=Math.max(0,f.start),x=Math.min(l.count,f.start+f.count);for(let p=g,m=x;p<m;p+=3){const T=p,y=p+1,b=p+2;s=Ss(this,a,t,n,c,h,d,T,y,b),s&&(s.faceIndex=Math.floor(p/3),e.push(s))}}}}function Gu(i,t,e,n,s,r,a,o){let l;if(t.side===xe?l=n.intersectTriangle(a,r,s,!0,o):l=n.intersectTriangle(s,r,a,t.side===Cn,o),l===null)return null;Ms.copy(o),Ms.applyMatrix4(i.matrixWorld);const c=e.ray.origin.distanceTo(Ms);return c<e.near||c>e.far?null:{distance:c,point:Ms.clone(),object:i}}function Ss(i,t,e,n,s,r,a,o,l,c){i.getVertexPosition(o,vs),i.getVertexPosition(l,_s),i.getVertexPosition(c,xs);const h=Gu(i,t,e,n,vs,_s,xs,il);if(h){const d=new R;ke.getBarycoord(il,vs,_s,xs,d),s&&(h.uv=ke.getInterpolatedAttribute(s,o,l,c,d,new it)),r&&(h.uv1=ke.getInterpolatedAttribute(r,o,l,c,d,new it)),a&&(h.normal=ke.getInterpolatedAttribute(a,o,l,c,d,new R),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const u={a:o,b:l,c,normal:new R,materialIndex:0};ke.getNormal(vs,_s,xs,u.normal),h.face=u,h.barycoord=d}return h}class Jn extends Ke{constructor(t=1,e=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};const o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);const l=[],c=[],h=[],d=[];let u=0,f=0;g("z","y","x",-1,-1,n,e,t,a,r,0),g("z","y","x",1,-1,n,e,-t,a,r,1),g("x","z","y",1,1,t,n,e,s,a,2),g("x","z","y",1,-1,t,n,-e,s,a,3),g("x","y","z",1,-1,t,e,n,s,r,4),g("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new ye(c,3)),this.setAttribute("normal",new ye(h,3)),this.setAttribute("uv",new ye(d,2));function g(x,p,m,T,y,b,N,C,A,U,Z){const v=b/A,S=N/U,H=b/2,B=N/2,k=C/2,J=A+1,O=U+1;let Q=0,G=0;const ut=new R;for(let pt=0;pt<O;pt++){const mt=pt*S-B;for(let kt=0;kt<J;kt++){const Xt=kt*v-H;ut[x]=Xt*T,ut[p]=mt*y,ut[m]=k,c.push(ut.x,ut.y,ut.z),ut[x]=0,ut[p]=0,ut[m]=C>0?1:-1,h.push(ut.x,ut.y,ut.z),d.push(kt/A),d.push(1-pt/U),Q+=1}}for(let pt=0;pt<U;pt++)for(let mt=0;mt<A;mt++){const kt=u+mt+J*pt,Xt=u+mt+J*(pt+1),W=u+(mt+1)+J*(pt+1),tt=u+(mt+1)+J*pt;l.push(kt,Xt,tt),l.push(Xt,W,tt),G+=6}o.addGroup(f,G,Z),f+=G,u+=Q}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Jn(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function Ci(i){const t={};for(const e in i){t[e]={};for(const n in i[e]){const s=i[e][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone():Array.isArray(s)?t[e][n]=s.slice():t[e][n]=s}}return t}function _e(i){const t={};for(let e=0;e<i.length;e++){const n=Ci(i[e]);for(const s in n)t[s]=n[s]}return t}function Wu(i){const t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function Ac(i){const t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Kt.workingColorSpace}const Xu={clone:Ci,merge:_e};var $u=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,qu=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Pn extends es{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=$u,this.fragmentShader=qu,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Ci(t.uniforms),this.uniformsGroups=Wu(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const s in this.uniforms){const a=this.uniforms[s].value;a&&a.isTexture?e.uniforms[s]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[s]={type:"m4",value:a.toArray()}:e.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}}class Rc extends fe{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Qt,this.projectionMatrix=new Qt,this.projectionMatrixInverse=new Qt,this.coordinateSystem=cn}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const xn=new R,sl=new it,rl=new it;class Ce extends Rc{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=Ki*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(Vi*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Ki*2*Math.atan(Math.tan(Vi*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){xn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(xn.x,xn.y).multiplyScalar(-t/xn.z),xn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(xn.x,xn.y).multiplyScalar(-t/xn.z)}getViewSize(t,e){return this.getViewBounds(t,sl,rl),e.subVectors(rl,sl)}setViewOffset(t,e,n,s,r,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(Vi*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*s/l,e-=a.offsetY*n/c,s*=a.width/l,n*=a.height/c}const o=this.filmOffset;o!==0&&(r+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const ui=-90,di=1;class Yu extends fe{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new Ce(ui,di,t,e);s.layers=this.layers,this.add(s);const r=new Ce(ui,di,t,e);r.layers=this.layers,this.add(r);const a=new Ce(ui,di,t,e);a.layers=this.layers,this.add(a);const o=new Ce(ui,di,t,e);o.layers=this.layers,this.add(o);const l=new Ce(ui,di,t,e);l.layers=this.layers,this.add(l);const c=new Ce(ui,di,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,s,r,a,o,l]=e;for(const c of e)this.remove(c);if(t===cn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===qs)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[r,a,o,l,c,h]=this.children,d=t.getRenderTarget(),u=t.getActiveCubeFace(),f=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;const x=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,s),t.render(e,r),t.setRenderTarget(n,1,s),t.render(e,a),t.setRenderTarget(n,2,s),t.render(e,o),t.setRenderTarget(n,3,s),t.render(e,l),t.setRenderTarget(n,4,s),t.render(e,c),n.texture.generateMipmaps=x,t.setRenderTarget(n,5,s),t.render(e,h),t.setRenderTarget(d,u,f),t.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class Cc extends ge{constructor(t,e,n,s,r,a,o,l,c,h){t=t!==void 0?t:[],e=e!==void 0?e:wi,super(t,e,n,s,r,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class Ku extends Yn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new Cc(s,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:ze}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Jn(5,5,5),r=new Pn({name:"CubemapFromEquirect",uniforms:Ci(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:xe,blending:An});r.uniforms.tEquirect.value=e;const a=new jt(s,r),o=e.minFilter;return e.minFilter===Wn&&(e.minFilter=ze),new Yu(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e,n,s){const r=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,s);t.setRenderTarget(r)}}const Lr=new R,Zu=new R,Ju=new Bt;class zn{constructor(t=new R(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const s=Lr.subVectors(n,e).cross(Zu.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const n=t.delta(Lr),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const r=-(t.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||Ju.getNormalMatrix(t),s=this.coplanarPoint(Lr).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const Fn=new ao,bs=new R;class lo{constructor(t=new zn,e=new zn,n=new zn,s=new zn,r=new zn,a=new zn){this.planes=[t,e,n,s,r,a]}set(t,e,n,s,r,a){const o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=cn){const n=this.planes,s=t.elements,r=s[0],a=s[1],o=s[2],l=s[3],c=s[4],h=s[5],d=s[6],u=s[7],f=s[8],g=s[9],x=s[10],p=s[11],m=s[12],T=s[13],y=s[14],b=s[15];if(n[0].setComponents(l-r,u-c,p-f,b-m).normalize(),n[1].setComponents(l+r,u+c,p+f,b+m).normalize(),n[2].setComponents(l+a,u+h,p+g,b+T).normalize(),n[3].setComponents(l-a,u-h,p-g,b-T).normalize(),n[4].setComponents(l-o,u-d,p-x,b-y).normalize(),e===cn)n[5].setComponents(l+o,u+d,p+x,b+y).normalize();else if(e===qs)n[5].setComponents(o,d,x,y).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Fn.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Fn.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Fn)}intersectsSprite(t){return Fn.center.set(0,0,0),Fn.radius=.7071067811865476,Fn.applyMatrix4(t.matrixWorld),this.intersectsSphere(Fn)}intersectsSphere(t){const e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const s=e[n];if(bs.x=s.normal.x>0?t.max.x:t.min.x,bs.y=s.normal.y>0?t.max.y:t.min.y,bs.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(bs)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function Pc(){let i=null,t=!1,e=null,n=null;function s(r,a){e(r,a),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function ju(i){const t=new WeakMap;function e(o,l){const c=o.array,h=o.usage,d=c.byteLength,u=i.createBuffer();i.bindBuffer(l,u),i.bufferData(l,c,h),o.onUploadCallback();let f;if(c instanceof Float32Array)f=i.FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?f=i.HALF_FLOAT:f=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=i.SHORT;else if(c instanceof Uint32Array)f=i.UNSIGNED_INT;else if(c instanceof Int32Array)f=i.INT;else if(c instanceof Int8Array)f=i.BYTE;else if(c instanceof Uint8Array)f=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:d}}function n(o,l,c){const h=l.array,d=l.updateRanges;if(i.bindBuffer(c,o),d.length===0)i.bufferSubData(c,0,h);else{d.sort((f,g)=>f.start-g.start);let u=0;for(let f=1;f<d.length;f++){const g=d[u],x=d[f];x.start<=g.start+g.count+1?g.count=Math.max(g.count,x.start+x.count-g.start):(++u,d[u]=x)}d.length=u+1;for(let f=0,g=d.length;f<g;f++){const x=d[f];i.bufferSubData(c,x.start*h.BYTES_PER_ELEMENT,h,x.start,x.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=t.get(o);l&&(i.deleteBuffer(l.buffer),t.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const h=t.get(o);(!h||h.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const c=t.get(o);if(c===void 0)t.set(o,e(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:s,remove:r,update:a}}class ns extends Ke{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};const r=t/2,a=e/2,o=Math.floor(n),l=Math.floor(s),c=o+1,h=l+1,d=t/o,u=e/l,f=[],g=[],x=[],p=[];for(let m=0;m<h;m++){const T=m*u-a;for(let y=0;y<c;y++){const b=y*d-r;g.push(b,-T,0),x.push(0,0,1),p.push(y/o),p.push(1-m/l)}}for(let m=0;m<l;m++)for(let T=0;T<o;T++){const y=T+c*m,b=T+c*(m+1),N=T+1+c*(m+1),C=T+1+c*m;f.push(y,b,C),f.push(b,N,C)}this.setIndex(f),this.setAttribute("position",new ye(g,3)),this.setAttribute("normal",new ye(x,3)),this.setAttribute("uv",new ye(p,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new ns(t.width,t.height,t.widthSegments,t.heightSegments)}}var Qu=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,td=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,ed=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,nd=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,id=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,sd=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,rd=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,ad=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,od=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,ld=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,cd=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,hd=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,ud=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,dd=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,fd=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,pd=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,md=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,gd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,vd=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,_d=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,xd=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,yd=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Md=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,Sd=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,bd=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Ed=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,wd=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Td=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Ad=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Rd=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Cd="gl_FragColor = linearToOutputTexel( gl_FragColor );",Pd=`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Ld=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Dd=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Ud=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Id=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Nd=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Fd=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Od=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Bd=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,zd=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,kd=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Hd=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Vd=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Gd=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Wd=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Xd=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,$d=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,qd=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Yd=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Kd=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Zd=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Jd=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,jd=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Qd=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,tf=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,ef=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,nf=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,sf=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,rf=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,af=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,of=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,lf=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,cf=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,hf=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,uf=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,df=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,ff=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,pf=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,mf=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,gf=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,vf=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,_f=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,xf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,yf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Mf=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Sf=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,bf=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Ef=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,wf=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Tf=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Af=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Rf=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Cf=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Pf=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Lf=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Df=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Uf=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,If=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Nf=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,Ff=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Of=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Bf=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,zf=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,kf=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Hf=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Vf=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Gf=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Wf=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Xf=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,$f=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,qf=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Yf=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Kf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Zf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Jf=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,jf=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Qf=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,tp=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,ep=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,np=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,ip=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,sp=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,rp=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,ap=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,op=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,lp=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,cp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,hp=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,up=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,dp=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,fp=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,pp=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,mp=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,gp=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,vp=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,_p=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,xp=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,yp=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Mp=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Sp=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,bp=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Ep=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,wp=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Tp=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Ap=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Rp=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Cp=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Pp=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Lp=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Dp=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ot={alphahash_fragment:Qu,alphahash_pars_fragment:td,alphamap_fragment:ed,alphamap_pars_fragment:nd,alphatest_fragment:id,alphatest_pars_fragment:sd,aomap_fragment:rd,aomap_pars_fragment:ad,batching_pars_vertex:od,batching_vertex:ld,begin_vertex:cd,beginnormal_vertex:hd,bsdfs:ud,iridescence_fragment:dd,bumpmap_pars_fragment:fd,clipping_planes_fragment:pd,clipping_planes_pars_fragment:md,clipping_planes_pars_vertex:gd,clipping_planes_vertex:vd,color_fragment:_d,color_pars_fragment:xd,color_pars_vertex:yd,color_vertex:Md,common:Sd,cube_uv_reflection_fragment:bd,defaultnormal_vertex:Ed,displacementmap_pars_vertex:wd,displacementmap_vertex:Td,emissivemap_fragment:Ad,emissivemap_pars_fragment:Rd,colorspace_fragment:Cd,colorspace_pars_fragment:Pd,envmap_fragment:Ld,envmap_common_pars_fragment:Dd,envmap_pars_fragment:Ud,envmap_pars_vertex:Id,envmap_physical_pars_fragment:Xd,envmap_vertex:Nd,fog_vertex:Fd,fog_pars_vertex:Od,fog_fragment:Bd,fog_pars_fragment:zd,gradientmap_pars_fragment:kd,lightmap_pars_fragment:Hd,lights_lambert_fragment:Vd,lights_lambert_pars_fragment:Gd,lights_pars_begin:Wd,lights_toon_fragment:$d,lights_toon_pars_fragment:qd,lights_phong_fragment:Yd,lights_phong_pars_fragment:Kd,lights_physical_fragment:Zd,lights_physical_pars_fragment:Jd,lights_fragment_begin:jd,lights_fragment_maps:Qd,lights_fragment_end:tf,logdepthbuf_fragment:ef,logdepthbuf_pars_fragment:nf,logdepthbuf_pars_vertex:sf,logdepthbuf_vertex:rf,map_fragment:af,map_pars_fragment:of,map_particle_fragment:lf,map_particle_pars_fragment:cf,metalnessmap_fragment:hf,metalnessmap_pars_fragment:uf,morphinstance_vertex:df,morphcolor_vertex:ff,morphnormal_vertex:pf,morphtarget_pars_vertex:mf,morphtarget_vertex:gf,normal_fragment_begin:vf,normal_fragment_maps:_f,normal_pars_fragment:xf,normal_pars_vertex:yf,normal_vertex:Mf,normalmap_pars_fragment:Sf,clearcoat_normal_fragment_begin:bf,clearcoat_normal_fragment_maps:Ef,clearcoat_pars_fragment:wf,iridescence_pars_fragment:Tf,opaque_fragment:Af,packing:Rf,premultiplied_alpha_fragment:Cf,project_vertex:Pf,dithering_fragment:Lf,dithering_pars_fragment:Df,roughnessmap_fragment:Uf,roughnessmap_pars_fragment:If,shadowmap_pars_fragment:Nf,shadowmap_pars_vertex:Ff,shadowmap_vertex:Of,shadowmask_pars_fragment:Bf,skinbase_vertex:zf,skinning_pars_vertex:kf,skinning_vertex:Hf,skinnormal_vertex:Vf,specularmap_fragment:Gf,specularmap_pars_fragment:Wf,tonemapping_fragment:Xf,tonemapping_pars_fragment:$f,transmission_fragment:qf,transmission_pars_fragment:Yf,uv_pars_fragment:Kf,uv_pars_vertex:Zf,uv_vertex:Jf,worldpos_vertex:jf,background_vert:Qf,background_frag:tp,backgroundCube_vert:ep,backgroundCube_frag:np,cube_vert:ip,cube_frag:sp,depth_vert:rp,depth_frag:ap,distanceRGBA_vert:op,distanceRGBA_frag:lp,equirect_vert:cp,equirect_frag:hp,linedashed_vert:up,linedashed_frag:dp,meshbasic_vert:fp,meshbasic_frag:pp,meshlambert_vert:mp,meshlambert_frag:gp,meshmatcap_vert:vp,meshmatcap_frag:_p,meshnormal_vert:xp,meshnormal_frag:yp,meshphong_vert:Mp,meshphong_frag:Sp,meshphysical_vert:bp,meshphysical_frag:Ep,meshtoon_vert:wp,meshtoon_frag:Tp,points_vert:Ap,points_frag:Rp,shadow_vert:Cp,shadow_frag:Pp,sprite_vert:Lp,sprite_frag:Dp},lt={common:{diffuse:{value:new Ht(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Bt},alphaMap:{value:null},alphaMapTransform:{value:new Bt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Bt}},envmap:{envMap:{value:null},envMapRotation:{value:new Bt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Bt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Bt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Bt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Bt},normalScale:{value:new it(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Bt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Bt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Bt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Bt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ht(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Ht(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Bt},alphaTest:{value:0},uvTransform:{value:new Bt}},sprite:{diffuse:{value:new Ht(16777215)},opacity:{value:1},center:{value:new it(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Bt},alphaMap:{value:null},alphaMapTransform:{value:new Bt},alphaTest:{value:0}}},Xe={basic:{uniforms:_e([lt.common,lt.specularmap,lt.envmap,lt.aomap,lt.lightmap,lt.fog]),vertexShader:Ot.meshbasic_vert,fragmentShader:Ot.meshbasic_frag},lambert:{uniforms:_e([lt.common,lt.specularmap,lt.envmap,lt.aomap,lt.lightmap,lt.emissivemap,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.fog,lt.lights,{emissive:{value:new Ht(0)}}]),vertexShader:Ot.meshlambert_vert,fragmentShader:Ot.meshlambert_frag},phong:{uniforms:_e([lt.common,lt.specularmap,lt.envmap,lt.aomap,lt.lightmap,lt.emissivemap,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.fog,lt.lights,{emissive:{value:new Ht(0)},specular:{value:new Ht(1118481)},shininess:{value:30}}]),vertexShader:Ot.meshphong_vert,fragmentShader:Ot.meshphong_frag},standard:{uniforms:_e([lt.common,lt.envmap,lt.aomap,lt.lightmap,lt.emissivemap,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.roughnessmap,lt.metalnessmap,lt.fog,lt.lights,{emissive:{value:new Ht(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ot.meshphysical_vert,fragmentShader:Ot.meshphysical_frag},toon:{uniforms:_e([lt.common,lt.aomap,lt.lightmap,lt.emissivemap,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.gradientmap,lt.fog,lt.lights,{emissive:{value:new Ht(0)}}]),vertexShader:Ot.meshtoon_vert,fragmentShader:Ot.meshtoon_frag},matcap:{uniforms:_e([lt.common,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.fog,{matcap:{value:null}}]),vertexShader:Ot.meshmatcap_vert,fragmentShader:Ot.meshmatcap_frag},points:{uniforms:_e([lt.points,lt.fog]),vertexShader:Ot.points_vert,fragmentShader:Ot.points_frag},dashed:{uniforms:_e([lt.common,lt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ot.linedashed_vert,fragmentShader:Ot.linedashed_frag},depth:{uniforms:_e([lt.common,lt.displacementmap]),vertexShader:Ot.depth_vert,fragmentShader:Ot.depth_frag},normal:{uniforms:_e([lt.common,lt.bumpmap,lt.normalmap,lt.displacementmap,{opacity:{value:1}}]),vertexShader:Ot.meshnormal_vert,fragmentShader:Ot.meshnormal_frag},sprite:{uniforms:_e([lt.sprite,lt.fog]),vertexShader:Ot.sprite_vert,fragmentShader:Ot.sprite_frag},background:{uniforms:{uvTransform:{value:new Bt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ot.background_vert,fragmentShader:Ot.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Bt}},vertexShader:Ot.backgroundCube_vert,fragmentShader:Ot.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ot.cube_vert,fragmentShader:Ot.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ot.equirect_vert,fragmentShader:Ot.equirect_frag},distanceRGBA:{uniforms:_e([lt.common,lt.displacementmap,{referencePosition:{value:new R},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ot.distanceRGBA_vert,fragmentShader:Ot.distanceRGBA_frag},shadow:{uniforms:_e([lt.lights,lt.fog,{color:{value:new Ht(0)},opacity:{value:1}}]),vertexShader:Ot.shadow_vert,fragmentShader:Ot.shadow_frag}};Xe.physical={uniforms:_e([Xe.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Bt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Bt},clearcoatNormalScale:{value:new it(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Bt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Bt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Bt},sheen:{value:0},sheenColor:{value:new Ht(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Bt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Bt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Bt},transmissionSamplerSize:{value:new it},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Bt},attenuationDistance:{value:0},attenuationColor:{value:new Ht(0)},specularColor:{value:new Ht(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Bt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Bt},anisotropyVector:{value:new it},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Bt}}]),vertexShader:Ot.meshphysical_vert,fragmentShader:Ot.meshphysical_frag};const Es={r:0,b:0,g:0},On=new Ve,Up=new Qt;function Ip(i,t,e,n,s,r,a){const o=new Ht(0);let l=r===!0?0:1,c,h,d=null,u=0,f=null;function g(T){let y=T.isScene===!0?T.background:null;return y&&y.isTexture&&(y=(T.backgroundBlurriness>0?e:t).get(y)),y}function x(T){let y=!1;const b=g(T);b===null?m(o,l):b&&b.isColor&&(m(b,1),y=!0);const N=i.xr.getEnvironmentBlendMode();N==="additive"?n.buffers.color.setClear(0,0,0,1,a):N==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(i.autoClear||y)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function p(T,y){const b=g(y);b&&(b.isCubeTexture||b.mapping===tr)?(h===void 0&&(h=new jt(new Jn(1,1,1),new Pn({name:"BackgroundCubeMaterial",uniforms:Ci(Xe.backgroundCube.uniforms),vertexShader:Xe.backgroundCube.vertexShader,fragmentShader:Xe.backgroundCube.fragmentShader,side:xe,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(N,C,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),On.copy(y.backgroundRotation),On.x*=-1,On.y*=-1,On.z*=-1,b.isCubeTexture&&b.isRenderTargetTexture===!1&&(On.y*=-1,On.z*=-1),h.material.uniforms.envMap.value=b,h.material.uniforms.flipEnvMap.value=b.isCubeTexture&&b.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=y.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(Up.makeRotationFromEuler(On)),h.material.toneMapped=Kt.getTransfer(b.colorSpace)!==ne,(d!==b||u!==b.version||f!==i.toneMapping)&&(h.material.needsUpdate=!0,d=b,u=b.version,f=i.toneMapping),h.layers.enableAll(),T.unshift(h,h.geometry,h.material,0,0,null)):b&&b.isTexture&&(c===void 0&&(c=new jt(new ns(2,2),new Pn({name:"BackgroundMaterial",uniforms:Ci(Xe.background.uniforms),vertexShader:Xe.background.vertexShader,fragmentShader:Xe.background.fragmentShader,side:Cn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=b,c.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,c.material.toneMapped=Kt.getTransfer(b.colorSpace)!==ne,b.matrixAutoUpdate===!0&&b.updateMatrix(),c.material.uniforms.uvTransform.value.copy(b.matrix),(d!==b||u!==b.version||f!==i.toneMapping)&&(c.material.needsUpdate=!0,d=b,u=b.version,f=i.toneMapping),c.layers.enableAll(),T.unshift(c,c.geometry,c.material,0,0,null))}function m(T,y){T.getRGB(Es,Ac(i)),n.buffers.color.setClear(Es.r,Es.g,Es.b,y,a)}return{getClearColor:function(){return o},setClearColor:function(T,y=1){o.set(T),l=y,m(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(T){l=T,m(o,l)},render:x,addToRenderList:p}}function Np(i,t){const e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=u(null);let r=s,a=!1;function o(v,S,H,B,k){let J=!1;const O=d(B,H,S);r!==O&&(r=O,c(r.object)),J=f(v,B,H,k),J&&g(v,B,H,k),k!==null&&t.update(k,i.ELEMENT_ARRAY_BUFFER),(J||a)&&(a=!1,b(v,S,H,B),k!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(k).buffer))}function l(){return i.createVertexArray()}function c(v){return i.bindVertexArray(v)}function h(v){return i.deleteVertexArray(v)}function d(v,S,H){const B=H.wireframe===!0;let k=n[v.id];k===void 0&&(k={},n[v.id]=k);let J=k[S.id];J===void 0&&(J={},k[S.id]=J);let O=J[B];return O===void 0&&(O=u(l()),J[B]=O),O}function u(v){const S=[],H=[],B=[];for(let k=0;k<e;k++)S[k]=0,H[k]=0,B[k]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:S,enabledAttributes:H,attributeDivisors:B,object:v,attributes:{},index:null}}function f(v,S,H,B){const k=r.attributes,J=S.attributes;let O=0;const Q=H.getAttributes();for(const G in Q)if(Q[G].location>=0){const pt=k[G];let mt=J[G];if(mt===void 0&&(G==="instanceMatrix"&&v.instanceMatrix&&(mt=v.instanceMatrix),G==="instanceColor"&&v.instanceColor&&(mt=v.instanceColor)),pt===void 0||pt.attribute!==mt||mt&&pt.data!==mt.data)return!0;O++}return r.attributesNum!==O||r.index!==B}function g(v,S,H,B){const k={},J=S.attributes;let O=0;const Q=H.getAttributes();for(const G in Q)if(Q[G].location>=0){let pt=J[G];pt===void 0&&(G==="instanceMatrix"&&v.instanceMatrix&&(pt=v.instanceMatrix),G==="instanceColor"&&v.instanceColor&&(pt=v.instanceColor));const mt={};mt.attribute=pt,pt&&pt.data&&(mt.data=pt.data),k[G]=mt,O++}r.attributes=k,r.attributesNum=O,r.index=B}function x(){const v=r.newAttributes;for(let S=0,H=v.length;S<H;S++)v[S]=0}function p(v){m(v,0)}function m(v,S){const H=r.newAttributes,B=r.enabledAttributes,k=r.attributeDivisors;H[v]=1,B[v]===0&&(i.enableVertexAttribArray(v),B[v]=1),k[v]!==S&&(i.vertexAttribDivisor(v,S),k[v]=S)}function T(){const v=r.newAttributes,S=r.enabledAttributes;for(let H=0,B=S.length;H<B;H++)S[H]!==v[H]&&(i.disableVertexAttribArray(H),S[H]=0)}function y(v,S,H,B,k,J,O){O===!0?i.vertexAttribIPointer(v,S,H,k,J):i.vertexAttribPointer(v,S,H,B,k,J)}function b(v,S,H,B){x();const k=B.attributes,J=H.getAttributes(),O=S.defaultAttributeValues;for(const Q in J){const G=J[Q];if(G.location>=0){let ut=k[Q];if(ut===void 0&&(Q==="instanceMatrix"&&v.instanceMatrix&&(ut=v.instanceMatrix),Q==="instanceColor"&&v.instanceColor&&(ut=v.instanceColor)),ut!==void 0){const pt=ut.normalized,mt=ut.itemSize,kt=t.get(ut);if(kt===void 0)continue;const Xt=kt.buffer,W=kt.type,tt=kt.bytesPerElement,Mt=W===i.INT||W===i.UNSIGNED_INT||ut.gpuType===ja;if(ut.isInterleavedBufferAttribute){const ct=ut.data,Pt=ct.stride,Ct=ut.offset;if(ct.isInstancedInterleavedBuffer){for(let Nt=0;Nt<G.locationSize;Nt++)m(G.location+Nt,ct.meshPerAttribute);v.isInstancedMesh!==!0&&B._maxInstanceCount===void 0&&(B._maxInstanceCount=ct.meshPerAttribute*ct.count)}else for(let Nt=0;Nt<G.locationSize;Nt++)p(G.location+Nt);i.bindBuffer(i.ARRAY_BUFFER,Xt);for(let Nt=0;Nt<G.locationSize;Nt++)y(G.location+Nt,mt/G.locationSize,W,pt,Pt*tt,(Ct+mt/G.locationSize*Nt)*tt,Mt)}else{if(ut.isInstancedBufferAttribute){for(let ct=0;ct<G.locationSize;ct++)m(G.location+ct,ut.meshPerAttribute);v.isInstancedMesh!==!0&&B._maxInstanceCount===void 0&&(B._maxInstanceCount=ut.meshPerAttribute*ut.count)}else for(let ct=0;ct<G.locationSize;ct++)p(G.location+ct);i.bindBuffer(i.ARRAY_BUFFER,Xt);for(let ct=0;ct<G.locationSize;ct++)y(G.location+ct,mt/G.locationSize,W,pt,mt*tt,mt/G.locationSize*ct*tt,Mt)}}else if(O!==void 0){const pt=O[Q];if(pt!==void 0)switch(pt.length){case 2:i.vertexAttrib2fv(G.location,pt);break;case 3:i.vertexAttrib3fv(G.location,pt);break;case 4:i.vertexAttrib4fv(G.location,pt);break;default:i.vertexAttrib1fv(G.location,pt)}}}}T()}function N(){U();for(const v in n){const S=n[v];for(const H in S){const B=S[H];for(const k in B)h(B[k].object),delete B[k];delete S[H]}delete n[v]}}function C(v){if(n[v.id]===void 0)return;const S=n[v.id];for(const H in S){const B=S[H];for(const k in B)h(B[k].object),delete B[k];delete S[H]}delete n[v.id]}function A(v){for(const S in n){const H=n[S];if(H[v.id]===void 0)continue;const B=H[v.id];for(const k in B)h(B[k].object),delete B[k];delete H[v.id]}}function U(){Z(),a=!0,r!==s&&(r=s,c(r.object))}function Z(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:U,resetDefaultState:Z,dispose:N,releaseStatesOfGeometry:C,releaseStatesOfProgram:A,initAttributes:x,enableAttribute:p,disableUnusedAttributes:T}}function Fp(i,t,e){let n;function s(c){n=c}function r(c,h){i.drawArrays(n,c,h),e.update(h,n,1)}function a(c,h,d){d!==0&&(i.drawArraysInstanced(n,c,h,d),e.update(h,n,d))}function o(c,h,d){if(d===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,h,0,d);let f=0;for(let g=0;g<d;g++)f+=h[g];e.update(f,n,1)}function l(c,h,d,u){if(d===0)return;const f=t.get("WEBGL_multi_draw");if(f===null)for(let g=0;g<c.length;g++)a(c[g],h[g],u[g]);else{f.multiDrawArraysInstancedWEBGL(n,c,0,h,0,u,0,d);let g=0;for(let x=0;x<d;x++)g+=h[x];for(let x=0;x<u.length;x++)e.update(g,n,u[x])}}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function Op(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){const A=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(A){return!(A!==He&&n.convert(A)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(A){const U=A===Qi&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(A!==dn&&n.convert(A)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&A!==ln&&!U)}function l(A){if(A==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp";const h=l(c);h!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);const d=e.logarithmicDepthBuffer===!0,u=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control");if(u===!0){const A=t.get("EXT_clip_control");A.clipControlEXT(A.LOWER_LEFT_EXT,A.ZERO_TO_ONE_EXT)}const f=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=i.getParameter(i.MAX_TEXTURE_SIZE),p=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),m=i.getParameter(i.MAX_VERTEX_ATTRIBS),T=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),y=i.getParameter(i.MAX_VARYING_VECTORS),b=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),N=g>0,C=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:d,reverseDepthBuffer:u,maxTextures:f,maxVertexTextures:g,maxTextureSize:x,maxCubemapSize:p,maxAttributes:m,maxVertexUniforms:T,maxVaryings:y,maxFragmentUniforms:b,vertexTextures:N,maxSamples:C}}function Bp(i){const t=this;let e=null,n=0,s=!1,r=!1;const a=new zn,o=new Bt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,u){const f=d.length!==0||u||n!==0||s;return s=u,n=d.length,f},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(d,u){e=h(d,u,0)},this.setState=function(d,u,f){const g=d.clippingPlanes,x=d.clipIntersection,p=d.clipShadows,m=i.get(d);if(!s||g===null||g.length===0||r&&!p)r?h(null):c();else{const T=r?0:n,y=T*4;let b=m.clippingState||null;l.value=b,b=h(g,u,y,f);for(let N=0;N!==y;++N)b[N]=e[N];m.clippingState=b,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=T}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(d,u,f,g){const x=d!==null?d.length:0;let p=null;if(x!==0){if(p=l.value,g!==!0||p===null){const m=f+x*4,T=u.matrixWorldInverse;o.getNormalMatrix(T),(p===null||p.length<m)&&(p=new Float32Array(m));for(let y=0,b=f;y!==x;++y,b+=4)a.copy(d[y]).applyMatrix4(T,o),a.normal.toArray(p,b),p[b+3]=a.constant}l.value=p,l.needsUpdate=!0}return t.numPlanes=x,t.numIntersection=0,p}}function zp(i){let t=new WeakMap;function e(a,o){return o===da?a.mapping=wi:o===fa&&(a.mapping=Ti),a}function n(a){if(a&&a.isTexture){const o=a.mapping;if(o===da||o===fa)if(t.has(a)){const l=t.get(a).texture;return e(l,a.mapping)}else{const l=a.image;if(l&&l.height>0){const c=new Ku(l.height);return c.fromEquirectangularTexture(i,a),t.set(a,c),a.addEventListener("dispose",s),e(c.texture,a.mapping)}else return null}}return a}function s(a){const o=a.target;o.removeEventListener("dispose",s);const l=t.get(o);l!==void 0&&(t.delete(o),l.dispose())}function r(){t=new WeakMap}return{get:n,dispose:r}}class Lc extends Rc{constructor(t=-1,e=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let r=n-t,a=n+t,o=s+e,l=s-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}const xi=4,al=[.125,.215,.35,.446,.526,.582],Vn=20,Dr=new Lc,ol=new Ht;let Ur=null,Ir=0,Nr=0,Fr=!1;const kn=(1+Math.sqrt(5))/2,fi=1/kn,ll=[new R(-kn,fi,0),new R(kn,fi,0),new R(-fi,0,kn),new R(fi,0,kn),new R(0,kn,-fi),new R(0,kn,fi),new R(-1,1,-1),new R(1,1,-1),new R(-1,1,1),new R(1,1,1)];class Ha{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,s=100){Ur=this._renderer.getRenderTarget(),Ir=this._renderer.getActiveCubeFace(),Nr=this._renderer.getActiveMipmapLevel(),Fr=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(t,n,s,r),e>0&&this._blur(r,0,0,e),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=ul(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=hl(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(Ur,Ir,Nr),this._renderer.xr.enabled=Fr,t.scissorTest=!1,ws(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===wi||t.mapping===Ti?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),Ur=this._renderer.getRenderTarget(),Ir=this._renderer.getActiveCubeFace(),Nr=this._renderer.getActiveMipmapLevel(),Fr=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:ze,minFilter:ze,generateMipmaps:!1,type:Qi,format:He,colorSpace:Ln,depthBuffer:!1},s=cl(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=cl(t,e,n);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=kp(r)),this._blurMaterial=Hp(r,t,e)}return s}_compileMaterial(t){const e=new jt(this._lodPlanes[0],t);this._renderer.compile(e,Dr)}_sceneToCubeUV(t,e,n,s){const o=new Ce(90,1,e,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],h=this._renderer,d=h.autoClear,u=h.toneMapping;h.getClearColor(ol),h.toneMapping=Rn,h.autoClear=!1;const f=new nr({name:"PMREM.Background",side:xe,depthWrite:!1,depthTest:!1}),g=new jt(new Jn,f);let x=!1;const p=t.background;p?p.isColor&&(f.color.copy(p),t.background=null,x=!0):(f.color.copy(ol),x=!0);for(let m=0;m<6;m++){const T=m%3;T===0?(o.up.set(0,l[m],0),o.lookAt(c[m],0,0)):T===1?(o.up.set(0,0,l[m]),o.lookAt(0,c[m],0)):(o.up.set(0,l[m],0),o.lookAt(0,0,c[m]));const y=this._cubeSize;ws(s,T*y,m>2?y:0,y,y),h.setRenderTarget(s),x&&h.render(g,o),h.render(t,o)}g.geometry.dispose(),g.material.dispose(),h.toneMapping=u,h.autoClear=d,t.background=p}_textureToCubeUV(t,e){const n=this._renderer,s=t.mapping===wi||t.mapping===Ti;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=ul()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=hl());const r=s?this._cubemapMaterial:this._equirectMaterial,a=new jt(this._lodPlanes[0],r),o=r.uniforms;o.envMap.value=t;const l=this._cubeSize;ws(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(a,Dr)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const s=this._lodPlanes.length;for(let r=1;r<s;r++){const a=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),o=ll[(s-r-1)%ll.length];this._blur(t,r-1,r,a,o)}e.autoClear=n}_blur(t,e,n,s,r){const a=this._pingPongRenderTarget;this._halfBlur(t,a,e,n,s,"latitudinal",r),this._halfBlur(a,t,n,n,s,"longitudinal",r)}_halfBlur(t,e,n,s,r,a,o){const l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const h=3,d=new jt(this._lodPlanes[s],c),u=c.uniforms,f=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*f):2*Math.PI/(2*Vn-1),x=r/g,p=isFinite(r)?1+Math.floor(h*x):Vn;p>Vn&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${Vn}`);const m=[];let T=0;for(let A=0;A<Vn;++A){const U=A/x,Z=Math.exp(-U*U/2);m.push(Z),A===0?T+=Z:A<p&&(T+=2*Z)}for(let A=0;A<m.length;A++)m[A]=m[A]/T;u.envMap.value=t.texture,u.samples.value=p,u.weights.value=m,u.latitudinal.value=a==="latitudinal",o&&(u.poleAxis.value=o);const{_lodMax:y}=this;u.dTheta.value=g,u.mipInt.value=y-n;const b=this._sizeLods[s],N=3*b*(s>y-xi?s-y+xi:0),C=4*(this._cubeSize-b);ws(e,N,C,3*b,2*b),l.setRenderTarget(e),l.render(d,Dr)}}function kp(i){const t=[],e=[],n=[];let s=i;const r=i-xi+1+al.length;for(let a=0;a<r;a++){const o=Math.pow(2,s);e.push(o);let l=1/o;a>i-xi?l=al[a-i+xi-1]:a===0&&(l=0),n.push(l);const c=1/(o-2),h=-c,d=1+c,u=[h,h,d,h,d,d,h,h,d,d,h,d],f=6,g=6,x=3,p=2,m=1,T=new Float32Array(x*g*f),y=new Float32Array(p*g*f),b=new Float32Array(m*g*f);for(let C=0;C<f;C++){const A=C%3*2/3-1,U=C>2?0:-1,Z=[A,U,0,A+2/3,U,0,A+2/3,U+1,0,A,U,0,A+2/3,U+1,0,A,U+1,0];T.set(Z,x*g*C),y.set(u,p*g*C);const v=[C,C,C,C,C,C];b.set(v,m*g*C)}const N=new Ke;N.setAttribute("position",new $e(T,x)),N.setAttribute("uv",new $e(y,p)),N.setAttribute("faceIndex",new $e(b,m)),t.push(N),s>xi&&s--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function cl(i,t,e){const n=new Yn(i,t,e);return n.texture.mapping=tr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function ws(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function Hp(i,t,e){const n=new Float32Array(Vn),s=new R(0,1,0);return new Pn({name:"SphericalGaussianBlur",defines:{n:Vn,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:co(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:An,depthTest:!1,depthWrite:!1})}function hl(){return new Pn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:co(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:An,depthTest:!1,depthWrite:!1})}function ul(){return new Pn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:co(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:An,depthTest:!1,depthWrite:!1})}function co(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Vp(i){let t=new WeakMap,e=null;function n(o){if(o&&o.isTexture){const l=o.mapping,c=l===da||l===fa,h=l===wi||l===Ti;if(c||h){let d=t.get(o);const u=d!==void 0?d.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==u)return e===null&&(e=new Ha(i)),d=c?e.fromEquirectangular(o,d):e.fromCubemap(o,d),d.texture.pmremVersion=o.pmremVersion,t.set(o,d),d.texture;if(d!==void 0)return d.texture;{const f=o.image;return c&&f&&f.height>0||h&&f&&s(f)?(e===null&&(e=new Ha(i)),d=c?e.fromEquirectangular(o):e.fromCubemap(o),d.texture.pmremVersion=o.pmremVersion,t.set(o,d),o.addEventListener("dispose",r),d.texture):null}}}return o}function s(o){let l=0;const c=6;for(let h=0;h<c;h++)o[h]!==void 0&&l++;return l===c}function r(o){const l=o.target;l.removeEventListener("dispose",r);const c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function a(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:a}}function Gp(i){const t={};function e(n){if(t[n]!==void 0)return t[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const s=e(n);return s===null&&zs("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function Wp(i,t,e,n){const s={},r=new WeakMap;function a(d){const u=d.target;u.index!==null&&t.remove(u.index);for(const g in u.attributes)t.remove(u.attributes[g]);for(const g in u.morphAttributes){const x=u.morphAttributes[g];for(let p=0,m=x.length;p<m;p++)t.remove(x[p])}u.removeEventListener("dispose",a),delete s[u.id];const f=r.get(u);f&&(t.remove(f),r.delete(u)),n.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,e.memory.geometries--}function o(d,u){return s[u.id]===!0||(u.addEventListener("dispose",a),s[u.id]=!0,e.memory.geometries++),u}function l(d){const u=d.attributes;for(const g in u)t.update(u[g],i.ARRAY_BUFFER);const f=d.morphAttributes;for(const g in f){const x=f[g];for(let p=0,m=x.length;p<m;p++)t.update(x[p],i.ARRAY_BUFFER)}}function c(d){const u=[],f=d.index,g=d.attributes.position;let x=0;if(f!==null){const T=f.array;x=f.version;for(let y=0,b=T.length;y<b;y+=3){const N=T[y+0],C=T[y+1],A=T[y+2];u.push(N,C,C,A,A,N)}}else if(g!==void 0){const T=g.array;x=g.version;for(let y=0,b=T.length/3-1;y<b;y+=3){const N=y+0,C=y+1,A=y+2;u.push(N,C,C,A,A,N)}}else return;const p=new(yc(u)?Tc:wc)(u,1);p.version=x;const m=r.get(d);m&&t.remove(m),r.set(d,p)}function h(d){const u=r.get(d);if(u){const f=d.index;f!==null&&u.version<f.version&&c(d)}else c(d);return r.get(d)}return{get:o,update:l,getWireframeAttribute:h}}function Xp(i,t,e){let n;function s(u){n=u}let r,a;function o(u){r=u.type,a=u.bytesPerElement}function l(u,f){i.drawElements(n,f,r,u*a),e.update(f,n,1)}function c(u,f,g){g!==0&&(i.drawElementsInstanced(n,f,r,u*a,g),e.update(f,n,g))}function h(u,f,g){if(g===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,f,0,r,u,0,g);let p=0;for(let m=0;m<g;m++)p+=f[m];e.update(p,n,1)}function d(u,f,g,x){if(g===0)return;const p=t.get("WEBGL_multi_draw");if(p===null)for(let m=0;m<u.length;m++)c(u[m]/a,f[m],x[m]);else{p.multiDrawElementsInstancedWEBGL(n,f,0,r,u,0,x,0,g);let m=0;for(let T=0;T<g;T++)m+=f[T];for(let T=0;T<x.length;T++)e.update(m,n,x[T])}}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=d}function $p(i){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(e.calls++,a){case i.TRIANGLES:e.triangles+=o*(r/3);break;case i.LINES:e.lines+=o*(r/2);break;case i.LINE_STRIP:e.lines+=o*(r-1);break;case i.LINE_LOOP:e.lines+=o*r;break;case i.POINTS:e.points+=o*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function qp(i,t,e){const n=new WeakMap,s=new Jt;function r(a,o,l){const c=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,d=h!==void 0?h.length:0;let u=n.get(o);if(u===void 0||u.count!==d){let Z=function(){A.dispose(),n.delete(o),o.removeEventListener("dispose",Z)};u!==void 0&&u.texture.dispose();const f=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,x=o.morphAttributes.color!==void 0,p=o.morphAttributes.position||[],m=o.morphAttributes.normal||[],T=o.morphAttributes.color||[];let y=0;f===!0&&(y=1),g===!0&&(y=2),x===!0&&(y=3);let b=o.attributes.position.count*y,N=1;b>t.maxTextureSize&&(N=Math.ceil(b/t.maxTextureSize),b=t.maxTextureSize);const C=new Float32Array(b*N*4*d),A=new Sc(C,b,N,d);A.type=ln,A.needsUpdate=!0;const U=y*4;for(let v=0;v<d;v++){const S=p[v],H=m[v],B=T[v],k=b*N*4*v;for(let J=0;J<S.count;J++){const O=J*U;f===!0&&(s.fromBufferAttribute(S,J),C[k+O+0]=s.x,C[k+O+1]=s.y,C[k+O+2]=s.z,C[k+O+3]=0),g===!0&&(s.fromBufferAttribute(H,J),C[k+O+4]=s.x,C[k+O+5]=s.y,C[k+O+6]=s.z,C[k+O+7]=0),x===!0&&(s.fromBufferAttribute(B,J),C[k+O+8]=s.x,C[k+O+9]=s.y,C[k+O+10]=s.z,C[k+O+11]=B.itemSize===4?s.w:1)}}u={count:d,texture:A,size:new it(b,N)},n.set(o,u),o.addEventListener("dispose",Z)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,e);else{let f=0;for(let x=0;x<c.length;x++)f+=c[x];const g=o.morphTargetsRelative?1:1-f;l.getUniforms().setValue(i,"morphTargetBaseInfluence",g),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",u.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",u.size)}return{update:r}}function Yp(i,t,e,n){let s=new WeakMap;function r(l){const c=n.render.frame,h=l.geometry,d=t.get(l,h);if(s.get(d)!==c&&(t.update(d),s.set(d,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),s.get(l)!==c&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){const u=l.skeleton;s.get(u)!==c&&(u.update(),s.set(u,c))}return d}function a(){s=new WeakMap}function o(l){const c=l.target;c.removeEventListener("dispose",o),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:r,dispose:a}}class Dc extends ge{constructor(t,e,n,s,r,a,o,l,c,h=Si){if(h!==Si&&h!==Ri)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===Si&&(n=qn),n===void 0&&h===Ri&&(n=Ai),super(null,s,r,a,o,l,h,n,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=o!==void 0?o:Ie,this.minFilter=l!==void 0?l:Ie,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}const Uc=new ge,dl=new Dc(1,1),Ic=new Sc,Nc=new Uu,Fc=new Cc,fl=[],pl=[],ml=new Float32Array(16),gl=new Float32Array(9),vl=new Float32Array(4);function Li(i,t,e){const n=i[0];if(n<=0||n>0)return i;const s=t*e;let r=fl[s];if(r===void 0&&(r=new Float32Array(s),fl[s]=r),t!==0){n.toArray(r,0);for(let a=1,o=0;a!==t;++a)o+=e,i[a].toArray(r,o)}return r}function le(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function ce(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function ir(i,t){let e=pl[t];e===void 0&&(e=new Int32Array(t),pl[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function Kp(i,t){const e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function Zp(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(le(e,t))return;i.uniform2fv(this.addr,t),ce(e,t)}}function Jp(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(le(e,t))return;i.uniform3fv(this.addr,t),ce(e,t)}}function jp(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(le(e,t))return;i.uniform4fv(this.addr,t),ce(e,t)}}function Qp(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(le(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),ce(e,t)}else{if(le(e,n))return;vl.set(n),i.uniformMatrix2fv(this.addr,!1,vl),ce(e,n)}}function tm(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(le(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),ce(e,t)}else{if(le(e,n))return;gl.set(n),i.uniformMatrix3fv(this.addr,!1,gl),ce(e,n)}}function em(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(le(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),ce(e,t)}else{if(le(e,n))return;ml.set(n),i.uniformMatrix4fv(this.addr,!1,ml),ce(e,n)}}function nm(i,t){const e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function im(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(le(e,t))return;i.uniform2iv(this.addr,t),ce(e,t)}}function sm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(le(e,t))return;i.uniform3iv(this.addr,t),ce(e,t)}}function rm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(le(e,t))return;i.uniform4iv(this.addr,t),ce(e,t)}}function am(i,t){const e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function om(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(le(e,t))return;i.uniform2uiv(this.addr,t),ce(e,t)}}function lm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(le(e,t))return;i.uniform3uiv(this.addr,t),ce(e,t)}}function cm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(le(e,t))return;i.uniform4uiv(this.addr,t),ce(e,t)}}function hm(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(dl.compareFunction=xc,r=dl):r=Uc,e.setTexture2D(t||r,s)}function um(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||Nc,s)}function dm(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||Fc,s)}function fm(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||Ic,s)}function pm(i){switch(i){case 5126:return Kp;case 35664:return Zp;case 35665:return Jp;case 35666:return jp;case 35674:return Qp;case 35675:return tm;case 35676:return em;case 5124:case 35670:return nm;case 35667:case 35671:return im;case 35668:case 35672:return sm;case 35669:case 35673:return rm;case 5125:return am;case 36294:return om;case 36295:return lm;case 36296:return cm;case 35678:case 36198:case 36298:case 36306:case 35682:return hm;case 35679:case 36299:case 36307:return um;case 35680:case 36300:case 36308:case 36293:return dm;case 36289:case 36303:case 36311:case 36292:return fm}}function mm(i,t){i.uniform1fv(this.addr,t)}function gm(i,t){const e=Li(t,this.size,2);i.uniform2fv(this.addr,e)}function vm(i,t){const e=Li(t,this.size,3);i.uniform3fv(this.addr,e)}function _m(i,t){const e=Li(t,this.size,4);i.uniform4fv(this.addr,e)}function xm(i,t){const e=Li(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function ym(i,t){const e=Li(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function Mm(i,t){const e=Li(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function Sm(i,t){i.uniform1iv(this.addr,t)}function bm(i,t){i.uniform2iv(this.addr,t)}function Em(i,t){i.uniform3iv(this.addr,t)}function wm(i,t){i.uniform4iv(this.addr,t)}function Tm(i,t){i.uniform1uiv(this.addr,t)}function Am(i,t){i.uniform2uiv(this.addr,t)}function Rm(i,t){i.uniform3uiv(this.addr,t)}function Cm(i,t){i.uniform4uiv(this.addr,t)}function Pm(i,t,e){const n=this.cache,s=t.length,r=ir(e,s);le(n,r)||(i.uniform1iv(this.addr,r),ce(n,r));for(let a=0;a!==s;++a)e.setTexture2D(t[a]||Uc,r[a])}function Lm(i,t,e){const n=this.cache,s=t.length,r=ir(e,s);le(n,r)||(i.uniform1iv(this.addr,r),ce(n,r));for(let a=0;a!==s;++a)e.setTexture3D(t[a]||Nc,r[a])}function Dm(i,t,e){const n=this.cache,s=t.length,r=ir(e,s);le(n,r)||(i.uniform1iv(this.addr,r),ce(n,r));for(let a=0;a!==s;++a)e.setTextureCube(t[a]||Fc,r[a])}function Um(i,t,e){const n=this.cache,s=t.length,r=ir(e,s);le(n,r)||(i.uniform1iv(this.addr,r),ce(n,r));for(let a=0;a!==s;++a)e.setTexture2DArray(t[a]||Ic,r[a])}function Im(i){switch(i){case 5126:return mm;case 35664:return gm;case 35665:return vm;case 35666:return _m;case 35674:return xm;case 35675:return ym;case 35676:return Mm;case 5124:case 35670:return Sm;case 35667:case 35671:return bm;case 35668:case 35672:return Em;case 35669:case 35673:return wm;case 5125:return Tm;case 36294:return Am;case 36295:return Rm;case 36296:return Cm;case 35678:case 36198:case 36298:case 36306:case 35682:return Pm;case 35679:case 36299:case 36307:return Lm;case 35680:case 36300:case 36308:case 36293:return Dm;case 36289:case 36303:case 36311:case 36292:return Um}}class Nm{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=pm(e.type)}}class Fm{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=Im(e.type)}}class Om{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const s=this.seq;for(let r=0,a=s.length;r!==a;++r){const o=s[r];o.setValue(t,e[o.id],n)}}}const Or=/(\w+)(\])?(\[|\.)?/g;function _l(i,t){i.seq.push(t),i.map[t.id]=t}function Bm(i,t,e){const n=i.name,s=n.length;for(Or.lastIndex=0;;){const r=Or.exec(n),a=Or.lastIndex;let o=r[1];const l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===s){_l(e,c===void 0?new Nm(o,i,t):new Fm(o,i,t));break}else{let d=e.map[o];d===void 0&&(d=new Om(o),_l(e,d)),e=d}}}class ks{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){const r=t.getActiveUniform(e,s),a=t.getUniformLocation(e,r.name);Bm(r,a,this)}}setValue(t,e,n,s){const r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){const s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,a=e.length;r!==a;++r){const o=e[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,s)}}static seqWithValue(t,e){const n=[];for(let s=0,r=t.length;s!==r;++s){const a=t[s];a.id in e&&n.push(a)}return n}}function xl(i,t,e){const n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}const zm=37297;let km=0;function Hm(i,t){const e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let a=s;a<r;a++){const o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}function Vm(i){const t=Kt.getPrimaries(Kt.workingColorSpace),e=Kt.getPrimaries(i);let n;switch(t===e?n="":t===$s&&e===Xs?n="LinearDisplayP3ToLinearSRGB":t===Xs&&e===$s&&(n="LinearSRGBToLinearDisplayP3"),i){case Ln:case er:return[n,"LinearTransferOETF"];case Re:case so:return[n,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",i),[n,"LinearTransferOETF"]}}function yl(i,t,e){const n=i.getShaderParameter(t,i.COMPILE_STATUS),s=i.getShaderInfoLog(t).trim();if(n&&s==="")return"";const r=/ERROR: 0:(\d+)/.exec(s);if(r){const a=parseInt(r[1]);return e.toUpperCase()+`

`+s+`

`+Hm(i.getShaderSource(t),a)}else return s}function Gm(i,t){const e=Vm(t);return`vec4 ${i}( vec4 value ) { return ${e[0]}( ${e[1]}( value ) ); }`}function Wm(i,t){let e;switch(t){case Wh:e="Linear";break;case Xh:e="Reinhard";break;case $h:e="Cineon";break;case qh:e="ACESFilmic";break;case Kh:e="AgX";break;case ac:e="Neutral";break;case Yh:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const Ts=new R;function Xm(){Kt.getLuminanceCoefficients(Ts);const i=Ts.x.toFixed(4),t=Ts.y.toFixed(4),e=Ts.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function $m(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(ki).join(`
`)}function qm(i){const t=[];for(const e in i){const n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function Ym(i,t){const e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){const r=i.getActiveAttrib(t,s),a=r.name;let o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),e[a]={type:r.type,location:i.getAttribLocation(t,a),locationSize:o}}return e}function ki(i){return i!==""}function Ml(i,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Sl(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const Km=/^[ \t]*#include +<([\w\d./]+)>/gm;function Va(i){return i.replace(Km,Jm)}const Zm=new Map;function Jm(i,t){let e=Ot[t];if(e===void 0){const n=Zm.get(t);if(n!==void 0)e=Ot[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return Va(e)}const jm=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function bl(i){return i.replace(jm,Qm)}function Qm(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function El(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function tg(i){let t="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===ic?t="SHADOWMAP_TYPE_PCF":i.shadowMapType===sc?t="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===nn&&(t="SHADOWMAP_TYPE_VSM"),t}function eg(i){let t="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case wi:case Ti:t="ENVMAP_TYPE_CUBE";break;case tr:t="ENVMAP_TYPE_CUBE_UV";break}return t}function ng(i){let t="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case Ti:t="ENVMAP_MODE_REFRACTION";break}return t}function ig(i){let t="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case rc:t="ENVMAP_BLENDING_MULTIPLY";break;case Vh:t="ENVMAP_BLENDING_MIX";break;case Gh:t="ENVMAP_BLENDING_ADD";break}return t}function sg(i){const t=i.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:n,maxMip:e}}function rg(i,t,e,n){const s=i.getContext(),r=e.defines;let a=e.vertexShader,o=e.fragmentShader;const l=tg(e),c=eg(e),h=ng(e),d=ig(e),u=sg(e),f=$m(e),g=qm(r),x=s.createProgram();let p,m,T=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(ki).join(`
`),p.length>0&&(p+=`
`),m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(ki).join(`
`),m.length>0&&(m+=`
`)):(p=[El(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(ki).join(`
`),m=[El(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+h:"",e.envMap?"#define "+d:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Rn?"#define TONE_MAPPING":"",e.toneMapping!==Rn?Ot.tonemapping_pars_fragment:"",e.toneMapping!==Rn?Wm("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Ot.colorspace_pars_fragment,Gm("linearToOutputTexel",e.outputColorSpace),Xm(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(ki).join(`
`)),a=Va(a),a=Ml(a,e),a=Sl(a,e),o=Va(o),o=Ml(o,e),o=Sl(o,e),a=bl(a),o=bl(o),e.isRawShaderMaterial!==!0&&(T=`#version 300 es
`,p=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,m=["#define varying in",e.glslVersion===Ho?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Ho?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);const y=T+p+a,b=T+m+o,N=xl(s,s.VERTEX_SHADER,y),C=xl(s,s.FRAGMENT_SHADER,b);s.attachShader(x,N),s.attachShader(x,C),e.index0AttributeName!==void 0?s.bindAttribLocation(x,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(x,0,"position"),s.linkProgram(x);function A(S){if(i.debug.checkShaderErrors){const H=s.getProgramInfoLog(x).trim(),B=s.getShaderInfoLog(N).trim(),k=s.getShaderInfoLog(C).trim();let J=!0,O=!0;if(s.getProgramParameter(x,s.LINK_STATUS)===!1)if(J=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,x,N,C);else{const Q=yl(s,N,"vertex"),G=yl(s,C,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(x,s.VALIDATE_STATUS)+`

Material Name: `+S.name+`
Material Type: `+S.type+`

Program Info Log: `+H+`
`+Q+`
`+G)}else H!==""?console.warn("THREE.WebGLProgram: Program Info Log:",H):(B===""||k==="")&&(O=!1);O&&(S.diagnostics={runnable:J,programLog:H,vertexShader:{log:B,prefix:p},fragmentShader:{log:k,prefix:m}})}s.deleteShader(N),s.deleteShader(C),U=new ks(s,x),Z=Ym(s,x)}let U;this.getUniforms=function(){return U===void 0&&A(this),U};let Z;this.getAttributes=function(){return Z===void 0&&A(this),Z};let v=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return v===!1&&(v=s.getProgramParameter(x,zm)),v},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(x),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=km++,this.cacheKey=t,this.usedTimes=1,this.program=x,this.vertexShader=N,this.fragmentShader=C,this}let ag=0;class og{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,n=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(n),a=this._getShaderCacheForMaterial(t);return a.has(s)===!1&&(a.add(s),s.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new lg(t),e.set(t,n)),n}}class lg{constructor(t){this.id=ag++,this.code=t,this.usedTimes=0}}function cg(i,t,e,n,s,r,a){const o=new oo,l=new og,c=new Set,h=[],d=s.logarithmicDepthBuffer,u=s.reverseDepthBuffer,f=s.vertexTextures;let g=s.precision;const x={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function p(v){return c.add(v),v===0?"uv":`uv${v}`}function m(v,S,H,B,k){const J=B.fog,O=k.geometry,Q=v.isMeshStandardMaterial?B.environment:null,G=(v.isMeshStandardMaterial?e:t).get(v.envMap||Q),ut=G&&G.mapping===tr?G.image.height:null,pt=x[v.type];v.precision!==null&&(g=s.getMaxPrecision(v.precision),g!==v.precision&&console.warn("THREE.WebGLProgram.getParameters:",v.precision,"not supported, using",g,"instead."));const mt=O.morphAttributes.position||O.morphAttributes.normal||O.morphAttributes.color,kt=mt!==void 0?mt.length:0;let Xt=0;O.morphAttributes.position!==void 0&&(Xt=1),O.morphAttributes.normal!==void 0&&(Xt=2),O.morphAttributes.color!==void 0&&(Xt=3);let W,tt,Mt,ct;if(pt){const Se=Xe[pt];W=Se.vertexShader,tt=Se.fragmentShader}else W=v.vertexShader,tt=v.fragmentShader,l.update(v),Mt=l.getVertexShaderID(v),ct=l.getFragmentShaderID(v);const Pt=i.getRenderTarget(),Ct=k.isInstancedMesh===!0,Nt=k.isBatchedMesh===!0,zt=!!v.map,q=!!v.matcap,w=!!G,rt=!!v.aoMap,st=!!v.lightMap,j=!!v.bumpMap,at=!!v.normalMap,At=!!v.displacementMap,gt=!!v.emissiveMap,E=!!v.metalnessMap,_=!!v.roughnessMap,I=v.anisotropy>0,X=v.clearcoat>0,Y=v.dispersion>0,$=v.iridescence>0,Et=v.sheen>0,ot=v.transmission>0,xt=I&&!!v.anisotropyMap,Vt=X&&!!v.clearcoatMap,et=X&&!!v.clearcoatNormalMap,yt=X&&!!v.clearcoatRoughnessMap,Ut=$&&!!v.iridescenceMap,It=$&&!!v.iridescenceThicknessMap,St=Et&&!!v.sheenColorMap,Gt=Et&&!!v.sheenRoughnessMap,Ft=!!v.specularMap,te=!!v.specularColorMap,P=!!v.specularIntensityMap,vt=ot&&!!v.transmissionMap,V=ot&&!!v.thicknessMap,K=!!v.gradientMap,dt=!!v.alphaMap,_t=v.alphaTest>0,Wt=!!v.alphaHash,ae=!!v.extensions;let Me=Rn;v.toneMapped&&(Pt===null||Pt.isXRRenderTarget===!0)&&(Me=i.toneMapping);const $t={shaderID:pt,shaderType:v.type,shaderName:v.name,vertexShader:W,fragmentShader:tt,defines:v.defines,customVertexShaderID:Mt,customFragmentShaderID:ct,isRawShaderMaterial:v.isRawShaderMaterial===!0,glslVersion:v.glslVersion,precision:g,batching:Nt,batchingColor:Nt&&k._colorsTexture!==null,instancing:Ct,instancingColor:Ct&&k.instanceColor!==null,instancingMorph:Ct&&k.morphTexture!==null,supportsVertexTextures:f,outputColorSpace:Pt===null?i.outputColorSpace:Pt.isXRRenderTarget===!0?Pt.texture.colorSpace:Ln,alphaToCoverage:!!v.alphaToCoverage,map:zt,matcap:q,envMap:w,envMapMode:w&&G.mapping,envMapCubeUVHeight:ut,aoMap:rt,lightMap:st,bumpMap:j,normalMap:at,displacementMap:f&&At,emissiveMap:gt,normalMapObjectSpace:at&&v.normalMapType===Qh,normalMapTangentSpace:at&&v.normalMapType===_c,metalnessMap:E,roughnessMap:_,anisotropy:I,anisotropyMap:xt,clearcoat:X,clearcoatMap:Vt,clearcoatNormalMap:et,clearcoatRoughnessMap:yt,dispersion:Y,iridescence:$,iridescenceMap:Ut,iridescenceThicknessMap:It,sheen:Et,sheenColorMap:St,sheenRoughnessMap:Gt,specularMap:Ft,specularColorMap:te,specularIntensityMap:P,transmission:ot,transmissionMap:vt,thicknessMap:V,gradientMap:K,opaque:v.transparent===!1&&v.blending===Mi&&v.alphaToCoverage===!1,alphaMap:dt,alphaTest:_t,alphaHash:Wt,combine:v.combine,mapUv:zt&&p(v.map.channel),aoMapUv:rt&&p(v.aoMap.channel),lightMapUv:st&&p(v.lightMap.channel),bumpMapUv:j&&p(v.bumpMap.channel),normalMapUv:at&&p(v.normalMap.channel),displacementMapUv:At&&p(v.displacementMap.channel),emissiveMapUv:gt&&p(v.emissiveMap.channel),metalnessMapUv:E&&p(v.metalnessMap.channel),roughnessMapUv:_&&p(v.roughnessMap.channel),anisotropyMapUv:xt&&p(v.anisotropyMap.channel),clearcoatMapUv:Vt&&p(v.clearcoatMap.channel),clearcoatNormalMapUv:et&&p(v.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:yt&&p(v.clearcoatRoughnessMap.channel),iridescenceMapUv:Ut&&p(v.iridescenceMap.channel),iridescenceThicknessMapUv:It&&p(v.iridescenceThicknessMap.channel),sheenColorMapUv:St&&p(v.sheenColorMap.channel),sheenRoughnessMapUv:Gt&&p(v.sheenRoughnessMap.channel),specularMapUv:Ft&&p(v.specularMap.channel),specularColorMapUv:te&&p(v.specularColorMap.channel),specularIntensityMapUv:P&&p(v.specularIntensityMap.channel),transmissionMapUv:vt&&p(v.transmissionMap.channel),thicknessMapUv:V&&p(v.thicknessMap.channel),alphaMapUv:dt&&p(v.alphaMap.channel),vertexTangents:!!O.attributes.tangent&&(at||I),vertexColors:v.vertexColors,vertexAlphas:v.vertexColors===!0&&!!O.attributes.color&&O.attributes.color.itemSize===4,pointsUvs:k.isPoints===!0&&!!O.attributes.uv&&(zt||dt),fog:!!J,useFog:v.fog===!0,fogExp2:!!J&&J.isFogExp2,flatShading:v.flatShading===!0,sizeAttenuation:v.sizeAttenuation===!0,logarithmicDepthBuffer:d,reverseDepthBuffer:u,skinning:k.isSkinnedMesh===!0,morphTargets:O.morphAttributes.position!==void 0,morphNormals:O.morphAttributes.normal!==void 0,morphColors:O.morphAttributes.color!==void 0,morphTargetsCount:kt,morphTextureStride:Xt,numDirLights:S.directional.length,numPointLights:S.point.length,numSpotLights:S.spot.length,numSpotLightMaps:S.spotLightMap.length,numRectAreaLights:S.rectArea.length,numHemiLights:S.hemi.length,numDirLightShadows:S.directionalShadowMap.length,numPointLightShadows:S.pointShadowMap.length,numSpotLightShadows:S.spotShadowMap.length,numSpotLightShadowsWithMaps:S.numSpotLightShadowsWithMaps,numLightProbes:S.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:v.dithering,shadowMapEnabled:i.shadowMap.enabled&&H.length>0,shadowMapType:i.shadowMap.type,toneMapping:Me,decodeVideoTexture:zt&&v.map.isVideoTexture===!0&&Kt.getTransfer(v.map.colorSpace)===ne,premultipliedAlpha:v.premultipliedAlpha,doubleSided:v.side===sn,flipSided:v.side===xe,useDepthPacking:v.depthPacking>=0,depthPacking:v.depthPacking||0,index0AttributeName:v.index0AttributeName,extensionClipCullDistance:ae&&v.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ae&&v.extensions.multiDraw===!0||Nt)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:v.customProgramCacheKey()};return $t.vertexUv1s=c.has(1),$t.vertexUv2s=c.has(2),$t.vertexUv3s=c.has(3),c.clear(),$t}function T(v){const S=[];if(v.shaderID?S.push(v.shaderID):(S.push(v.customVertexShaderID),S.push(v.customFragmentShaderID)),v.defines!==void 0)for(const H in v.defines)S.push(H),S.push(v.defines[H]);return v.isRawShaderMaterial===!1&&(y(S,v),b(S,v),S.push(i.outputColorSpace)),S.push(v.customProgramCacheKey),S.join()}function y(v,S){v.push(S.precision),v.push(S.outputColorSpace),v.push(S.envMapMode),v.push(S.envMapCubeUVHeight),v.push(S.mapUv),v.push(S.alphaMapUv),v.push(S.lightMapUv),v.push(S.aoMapUv),v.push(S.bumpMapUv),v.push(S.normalMapUv),v.push(S.displacementMapUv),v.push(S.emissiveMapUv),v.push(S.metalnessMapUv),v.push(S.roughnessMapUv),v.push(S.anisotropyMapUv),v.push(S.clearcoatMapUv),v.push(S.clearcoatNormalMapUv),v.push(S.clearcoatRoughnessMapUv),v.push(S.iridescenceMapUv),v.push(S.iridescenceThicknessMapUv),v.push(S.sheenColorMapUv),v.push(S.sheenRoughnessMapUv),v.push(S.specularMapUv),v.push(S.specularColorMapUv),v.push(S.specularIntensityMapUv),v.push(S.transmissionMapUv),v.push(S.thicknessMapUv),v.push(S.combine),v.push(S.fogExp2),v.push(S.sizeAttenuation),v.push(S.morphTargetsCount),v.push(S.morphAttributeCount),v.push(S.numDirLights),v.push(S.numPointLights),v.push(S.numSpotLights),v.push(S.numSpotLightMaps),v.push(S.numHemiLights),v.push(S.numRectAreaLights),v.push(S.numDirLightShadows),v.push(S.numPointLightShadows),v.push(S.numSpotLightShadows),v.push(S.numSpotLightShadowsWithMaps),v.push(S.numLightProbes),v.push(S.shadowMapType),v.push(S.toneMapping),v.push(S.numClippingPlanes),v.push(S.numClipIntersection),v.push(S.depthPacking)}function b(v,S){o.disableAll(),S.supportsVertexTextures&&o.enable(0),S.instancing&&o.enable(1),S.instancingColor&&o.enable(2),S.instancingMorph&&o.enable(3),S.matcap&&o.enable(4),S.envMap&&o.enable(5),S.normalMapObjectSpace&&o.enable(6),S.normalMapTangentSpace&&o.enable(7),S.clearcoat&&o.enable(8),S.iridescence&&o.enable(9),S.alphaTest&&o.enable(10),S.vertexColors&&o.enable(11),S.vertexAlphas&&o.enable(12),S.vertexUv1s&&o.enable(13),S.vertexUv2s&&o.enable(14),S.vertexUv3s&&o.enable(15),S.vertexTangents&&o.enable(16),S.anisotropy&&o.enable(17),S.alphaHash&&o.enable(18),S.batching&&o.enable(19),S.dispersion&&o.enable(20),S.batchingColor&&o.enable(21),v.push(o.mask),o.disableAll(),S.fog&&o.enable(0),S.useFog&&o.enable(1),S.flatShading&&o.enable(2),S.logarithmicDepthBuffer&&o.enable(3),S.reverseDepthBuffer&&o.enable(4),S.skinning&&o.enable(5),S.morphTargets&&o.enable(6),S.morphNormals&&o.enable(7),S.morphColors&&o.enable(8),S.premultipliedAlpha&&o.enable(9),S.shadowMapEnabled&&o.enable(10),S.doubleSided&&o.enable(11),S.flipSided&&o.enable(12),S.useDepthPacking&&o.enable(13),S.dithering&&o.enable(14),S.transmission&&o.enable(15),S.sheen&&o.enable(16),S.opaque&&o.enable(17),S.pointsUvs&&o.enable(18),S.decodeVideoTexture&&o.enable(19),S.alphaToCoverage&&o.enable(20),v.push(o.mask)}function N(v){const S=x[v.type];let H;if(S){const B=Xe[S];H=Xu.clone(B.uniforms)}else H=v.uniforms;return H}function C(v,S){let H;for(let B=0,k=h.length;B<k;B++){const J=h[B];if(J.cacheKey===S){H=J,++H.usedTimes;break}}return H===void 0&&(H=new rg(i,S,v,r),h.push(H)),H}function A(v){if(--v.usedTimes===0){const S=h.indexOf(v);h[S]=h[h.length-1],h.pop(),v.destroy()}}function U(v){l.remove(v)}function Z(){l.dispose()}return{getParameters:m,getProgramCacheKey:T,getUniforms:N,acquireProgram:C,releaseProgram:A,releaseShaderCache:U,programs:h,dispose:Z}}function hg(){let i=new WeakMap;function t(a){return i.has(a)}function e(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,l){i.get(a)[o]=l}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function ug(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.z!==t.z?i.z-t.z:i.id-t.id}function wl(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function Tl(){const i=[];let t=0;const e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function a(d,u,f,g,x,p){let m=i[t];return m===void 0?(m={id:d.id,object:d,geometry:u,material:f,groupOrder:g,renderOrder:d.renderOrder,z:x,group:p},i[t]=m):(m.id=d.id,m.object=d,m.geometry=u,m.material=f,m.groupOrder=g,m.renderOrder=d.renderOrder,m.z=x,m.group=p),t++,m}function o(d,u,f,g,x,p){const m=a(d,u,f,g,x,p);f.transmission>0?n.push(m):f.transparent===!0?s.push(m):e.push(m)}function l(d,u,f,g,x,p){const m=a(d,u,f,g,x,p);f.transmission>0?n.unshift(m):f.transparent===!0?s.unshift(m):e.unshift(m)}function c(d,u){e.length>1&&e.sort(d||ug),n.length>1&&n.sort(u||wl),s.length>1&&s.sort(u||wl)}function h(){for(let d=t,u=i.length;d<u;d++){const f=i[d];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:o,unshift:l,finish:h,sort:c}}function dg(){let i=new WeakMap;function t(n,s){const r=i.get(n);let a;return r===void 0?(a=new Tl,i.set(n,[a])):s>=r.length?(a=new Tl,r.push(a)):a=r[s],a}function e(){i=new WeakMap}return{get:t,dispose:e}}function fg(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new R,color:new Ht};break;case"SpotLight":e={position:new R,direction:new R,color:new Ht,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new R,color:new Ht,distance:0,decay:0};break;case"HemisphereLight":e={direction:new R,skyColor:new Ht,groundColor:new Ht};break;case"RectAreaLight":e={color:new Ht,position:new R,halfWidth:new R,halfHeight:new R};break}return i[t.id]=e,e}}}function pg(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new it};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new it};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new it,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}let mg=0;function gg(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function vg(i){const t=new fg,e=pg(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new R);const s=new R,r=new Qt,a=new Qt;function o(c){let h=0,d=0,u=0;for(let Z=0;Z<9;Z++)n.probe[Z].set(0,0,0);let f=0,g=0,x=0,p=0,m=0,T=0,y=0,b=0,N=0,C=0,A=0;c.sort(gg);for(let Z=0,v=c.length;Z<v;Z++){const S=c[Z],H=S.color,B=S.intensity,k=S.distance,J=S.shadow&&S.shadow.map?S.shadow.map.texture:null;if(S.isAmbientLight)h+=H.r*B,d+=H.g*B,u+=H.b*B;else if(S.isLightProbe){for(let O=0;O<9;O++)n.probe[O].addScaledVector(S.sh.coefficients[O],B);A++}else if(S.isDirectionalLight){const O=t.get(S);if(O.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){const Q=S.shadow,G=e.get(S);G.shadowIntensity=Q.intensity,G.shadowBias=Q.bias,G.shadowNormalBias=Q.normalBias,G.shadowRadius=Q.radius,G.shadowMapSize=Q.mapSize,n.directionalShadow[f]=G,n.directionalShadowMap[f]=J,n.directionalShadowMatrix[f]=S.shadow.matrix,T++}n.directional[f]=O,f++}else if(S.isSpotLight){const O=t.get(S);O.position.setFromMatrixPosition(S.matrixWorld),O.color.copy(H).multiplyScalar(B),O.distance=k,O.coneCos=Math.cos(S.angle),O.penumbraCos=Math.cos(S.angle*(1-S.penumbra)),O.decay=S.decay,n.spot[x]=O;const Q=S.shadow;if(S.map&&(n.spotLightMap[N]=S.map,N++,Q.updateMatrices(S),S.castShadow&&C++),n.spotLightMatrix[x]=Q.matrix,S.castShadow){const G=e.get(S);G.shadowIntensity=Q.intensity,G.shadowBias=Q.bias,G.shadowNormalBias=Q.normalBias,G.shadowRadius=Q.radius,G.shadowMapSize=Q.mapSize,n.spotShadow[x]=G,n.spotShadowMap[x]=J,b++}x++}else if(S.isRectAreaLight){const O=t.get(S);O.color.copy(H).multiplyScalar(B),O.halfWidth.set(S.width*.5,0,0),O.halfHeight.set(0,S.height*.5,0),n.rectArea[p]=O,p++}else if(S.isPointLight){const O=t.get(S);if(O.color.copy(S.color).multiplyScalar(S.intensity),O.distance=S.distance,O.decay=S.decay,S.castShadow){const Q=S.shadow,G=e.get(S);G.shadowIntensity=Q.intensity,G.shadowBias=Q.bias,G.shadowNormalBias=Q.normalBias,G.shadowRadius=Q.radius,G.shadowMapSize=Q.mapSize,G.shadowCameraNear=Q.camera.near,G.shadowCameraFar=Q.camera.far,n.pointShadow[g]=G,n.pointShadowMap[g]=J,n.pointShadowMatrix[g]=S.shadow.matrix,y++}n.point[g]=O,g++}else if(S.isHemisphereLight){const O=t.get(S);O.skyColor.copy(S.color).multiplyScalar(B),O.groundColor.copy(S.groundColor).multiplyScalar(B),n.hemi[m]=O,m++}}p>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=lt.LTC_FLOAT_1,n.rectAreaLTC2=lt.LTC_FLOAT_2):(n.rectAreaLTC1=lt.LTC_HALF_1,n.rectAreaLTC2=lt.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=d,n.ambient[2]=u;const U=n.hash;(U.directionalLength!==f||U.pointLength!==g||U.spotLength!==x||U.rectAreaLength!==p||U.hemiLength!==m||U.numDirectionalShadows!==T||U.numPointShadows!==y||U.numSpotShadows!==b||U.numSpotMaps!==N||U.numLightProbes!==A)&&(n.directional.length=f,n.spot.length=x,n.rectArea.length=p,n.point.length=g,n.hemi.length=m,n.directionalShadow.length=T,n.directionalShadowMap.length=T,n.pointShadow.length=y,n.pointShadowMap.length=y,n.spotShadow.length=b,n.spotShadowMap.length=b,n.directionalShadowMatrix.length=T,n.pointShadowMatrix.length=y,n.spotLightMatrix.length=b+N-C,n.spotLightMap.length=N,n.numSpotLightShadowsWithMaps=C,n.numLightProbes=A,U.directionalLength=f,U.pointLength=g,U.spotLength=x,U.rectAreaLength=p,U.hemiLength=m,U.numDirectionalShadows=T,U.numPointShadows=y,U.numSpotShadows=b,U.numSpotMaps=N,U.numLightProbes=A,n.version=mg++)}function l(c,h){let d=0,u=0,f=0,g=0,x=0;const p=h.matrixWorldInverse;for(let m=0,T=c.length;m<T;m++){const y=c[m];if(y.isDirectionalLight){const b=n.directional[d];b.direction.setFromMatrixPosition(y.matrixWorld),s.setFromMatrixPosition(y.target.matrixWorld),b.direction.sub(s),b.direction.transformDirection(p),d++}else if(y.isSpotLight){const b=n.spot[f];b.position.setFromMatrixPosition(y.matrixWorld),b.position.applyMatrix4(p),b.direction.setFromMatrixPosition(y.matrixWorld),s.setFromMatrixPosition(y.target.matrixWorld),b.direction.sub(s),b.direction.transformDirection(p),f++}else if(y.isRectAreaLight){const b=n.rectArea[g];b.position.setFromMatrixPosition(y.matrixWorld),b.position.applyMatrix4(p),a.identity(),r.copy(y.matrixWorld),r.premultiply(p),a.extractRotation(r),b.halfWidth.set(y.width*.5,0,0),b.halfHeight.set(0,y.height*.5,0),b.halfWidth.applyMatrix4(a),b.halfHeight.applyMatrix4(a),g++}else if(y.isPointLight){const b=n.point[u];b.position.setFromMatrixPosition(y.matrixWorld),b.position.applyMatrix4(p),u++}else if(y.isHemisphereLight){const b=n.hemi[x];b.direction.setFromMatrixPosition(y.matrixWorld),b.direction.transformDirection(p),x++}}}return{setup:o,setupView:l,state:n}}function Al(i){const t=new vg(i),e=[],n=[];function s(h){c.camera=h,e.length=0,n.length=0}function r(h){e.push(h)}function a(h){n.push(h)}function o(){t.setup(e)}function l(h){t.setupView(e,h)}const c={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:o,setupLightsView:l,pushLight:r,pushShadow:a}}function _g(i){let t=new WeakMap;function e(s,r=0){const a=t.get(s);let o;return a===void 0?(o=new Al(i),t.set(s,[o])):r>=a.length?(o=new Al(i),a.push(o)):o=a[r],o}function n(){t=new WeakMap}return{get:e,dispose:n}}class xg extends es{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Jh,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class yg extends es{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const Mg=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Sg=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function bg(i,t,e){let n=new lo;const s=new it,r=new it,a=new Jt,o=new xg({depthPacking:jh}),l=new yg,c={},h=e.maxTextureSize,d={[Cn]:xe,[xe]:Cn,[sn]:sn},u=new Pn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new it},radius:{value:4}},vertexShader:Mg,fragmentShader:Sg}),f=u.clone();f.defines.HORIZONTAL_PASS=1;const g=new Ke;g.setAttribute("position",new $e(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const x=new jt(g,u),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=ic;let m=this.type;this.render=function(C,A,U){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||C.length===0)return;const Z=i.getRenderTarget(),v=i.getActiveCubeFace(),S=i.getActiveMipmapLevel(),H=i.state;H.setBlending(An),H.buffers.color.setClear(1,1,1,1),H.buffers.depth.setTest(!0),H.setScissorTest(!1);const B=m!==nn&&this.type===nn,k=m===nn&&this.type!==nn;for(let J=0,O=C.length;J<O;J++){const Q=C[J],G=Q.shadow;if(G===void 0){console.warn("THREE.WebGLShadowMap:",Q,"has no shadow.");continue}if(G.autoUpdate===!1&&G.needsUpdate===!1)continue;s.copy(G.mapSize);const ut=G.getFrameExtents();if(s.multiply(ut),r.copy(G.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/ut.x),s.x=r.x*ut.x,G.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/ut.y),s.y=r.y*ut.y,G.mapSize.y=r.y)),G.map===null||B===!0||k===!0){const mt=this.type!==nn?{minFilter:Ie,magFilter:Ie}:{};G.map!==null&&G.map.dispose(),G.map=new Yn(s.x,s.y,mt),G.map.texture.name=Q.name+".shadowMap",G.camera.updateProjectionMatrix()}i.setRenderTarget(G.map),i.clear();const pt=G.getViewportCount();for(let mt=0;mt<pt;mt++){const kt=G.getViewport(mt);a.set(r.x*kt.x,r.y*kt.y,r.x*kt.z,r.y*kt.w),H.viewport(a),G.updateMatrices(Q,mt),n=G.getFrustum(),b(A,U,G.camera,Q,this.type)}G.isPointLightShadow!==!0&&this.type===nn&&T(G,U),G.needsUpdate=!1}m=this.type,p.needsUpdate=!1,i.setRenderTarget(Z,v,S)};function T(C,A){const U=t.update(x);u.defines.VSM_SAMPLES!==C.blurSamples&&(u.defines.VSM_SAMPLES=C.blurSamples,f.defines.VSM_SAMPLES=C.blurSamples,u.needsUpdate=!0,f.needsUpdate=!0),C.mapPass===null&&(C.mapPass=new Yn(s.x,s.y)),u.uniforms.shadow_pass.value=C.map.texture,u.uniforms.resolution.value=C.mapSize,u.uniforms.radius.value=C.radius,i.setRenderTarget(C.mapPass),i.clear(),i.renderBufferDirect(A,null,U,u,x,null),f.uniforms.shadow_pass.value=C.mapPass.texture,f.uniforms.resolution.value=C.mapSize,f.uniforms.radius.value=C.radius,i.setRenderTarget(C.map),i.clear(),i.renderBufferDirect(A,null,U,f,x,null)}function y(C,A,U,Z){let v=null;const S=U.isPointLight===!0?C.customDistanceMaterial:C.customDepthMaterial;if(S!==void 0)v=S;else if(v=U.isPointLight===!0?l:o,i.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0){const H=v.uuid,B=A.uuid;let k=c[H];k===void 0&&(k={},c[H]=k);let J=k[B];J===void 0&&(J=v.clone(),k[B]=J,A.addEventListener("dispose",N)),v=J}if(v.visible=A.visible,v.wireframe=A.wireframe,Z===nn?v.side=A.shadowSide!==null?A.shadowSide:A.side:v.side=A.shadowSide!==null?A.shadowSide:d[A.side],v.alphaMap=A.alphaMap,v.alphaTest=A.alphaTest,v.map=A.map,v.clipShadows=A.clipShadows,v.clippingPlanes=A.clippingPlanes,v.clipIntersection=A.clipIntersection,v.displacementMap=A.displacementMap,v.displacementScale=A.displacementScale,v.displacementBias=A.displacementBias,v.wireframeLinewidth=A.wireframeLinewidth,v.linewidth=A.linewidth,U.isPointLight===!0&&v.isMeshDistanceMaterial===!0){const H=i.properties.get(v);H.light=U}return v}function b(C,A,U,Z,v){if(C.visible===!1)return;if(C.layers.test(A.layers)&&(C.isMesh||C.isLine||C.isPoints)&&(C.castShadow||C.receiveShadow&&v===nn)&&(!C.frustumCulled||n.intersectsObject(C))){C.modelViewMatrix.multiplyMatrices(U.matrixWorldInverse,C.matrixWorld);const B=t.update(C),k=C.material;if(Array.isArray(k)){const J=B.groups;for(let O=0,Q=J.length;O<Q;O++){const G=J[O],ut=k[G.materialIndex];if(ut&&ut.visible){const pt=y(C,ut,Z,v);C.onBeforeShadow(i,C,A,U,B,pt,G),i.renderBufferDirect(U,null,B,pt,C,G),C.onAfterShadow(i,C,A,U,B,pt,G)}}}else if(k.visible){const J=y(C,k,Z,v);C.onBeforeShadow(i,C,A,U,B,J,null),i.renderBufferDirect(U,null,B,J,C,null),C.onAfterShadow(i,C,A,U,B,J,null)}}const H=C.children;for(let B=0,k=H.length;B<k;B++)b(H[B],A,U,Z,v)}function N(C){C.target.removeEventListener("dispose",N);for(const U in c){const Z=c[U],v=C.target.uuid;v in Z&&(Z[v].dispose(),delete Z[v])}}}const Eg={[ra]:aa,[oa]:ha,[la]:ua,[Ei]:ca,[aa]:ra,[ha]:oa,[ua]:la,[ca]:Ei};function wg(i){function t(){let P=!1;const vt=new Jt;let V=null;const K=new Jt(0,0,0,0);return{setMask:function(dt){V!==dt&&!P&&(i.colorMask(dt,dt,dt,dt),V=dt)},setLocked:function(dt){P=dt},setClear:function(dt,_t,Wt,ae,Me){Me===!0&&(dt*=ae,_t*=ae,Wt*=ae),vt.set(dt,_t,Wt,ae),K.equals(vt)===!1&&(i.clearColor(dt,_t,Wt,ae),K.copy(vt))},reset:function(){P=!1,V=null,K.set(-1,0,0,0)}}}function e(){let P=!1,vt=!1,V=null,K=null,dt=null;return{setReversed:function(_t){vt=_t},setTest:function(_t){_t?Mt(i.DEPTH_TEST):ct(i.DEPTH_TEST)},setMask:function(_t){V!==_t&&!P&&(i.depthMask(_t),V=_t)},setFunc:function(_t){if(vt&&(_t=Eg[_t]),K!==_t){switch(_t){case ra:i.depthFunc(i.NEVER);break;case aa:i.depthFunc(i.ALWAYS);break;case oa:i.depthFunc(i.LESS);break;case Ei:i.depthFunc(i.LEQUAL);break;case la:i.depthFunc(i.EQUAL);break;case ca:i.depthFunc(i.GEQUAL);break;case ha:i.depthFunc(i.GREATER);break;case ua:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}K=_t}},setLocked:function(_t){P=_t},setClear:function(_t){dt!==_t&&(i.clearDepth(_t),dt=_t)},reset:function(){P=!1,V=null,K=null,dt=null}}}function n(){let P=!1,vt=null,V=null,K=null,dt=null,_t=null,Wt=null,ae=null,Me=null;return{setTest:function($t){P||($t?Mt(i.STENCIL_TEST):ct(i.STENCIL_TEST))},setMask:function($t){vt!==$t&&!P&&(i.stencilMask($t),vt=$t)},setFunc:function($t,Se,Ze){(V!==$t||K!==Se||dt!==Ze)&&(i.stencilFunc($t,Se,Ze),V=$t,K=Se,dt=Ze)},setOp:function($t,Se,Ze){(_t!==$t||Wt!==Se||ae!==Ze)&&(i.stencilOp($t,Se,Ze),_t=$t,Wt=Se,ae=Ze)},setLocked:function($t){P=$t},setClear:function($t){Me!==$t&&(i.clearStencil($t),Me=$t)},reset:function(){P=!1,vt=null,V=null,K=null,dt=null,_t=null,Wt=null,ae=null,Me=null}}}const s=new t,r=new e,a=new n,o=new WeakMap,l=new WeakMap;let c={},h={},d=new WeakMap,u=[],f=null,g=!1,x=null,p=null,m=null,T=null,y=null,b=null,N=null,C=new Ht(0,0,0),A=0,U=!1,Z=null,v=null,S=null,H=null,B=null;const k=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let J=!1,O=0;const Q=i.getParameter(i.VERSION);Q.indexOf("WebGL")!==-1?(O=parseFloat(/^WebGL (\d)/.exec(Q)[1]),J=O>=1):Q.indexOf("OpenGL ES")!==-1&&(O=parseFloat(/^OpenGL ES (\d)/.exec(Q)[1]),J=O>=2);let G=null,ut={};const pt=i.getParameter(i.SCISSOR_BOX),mt=i.getParameter(i.VIEWPORT),kt=new Jt().fromArray(pt),Xt=new Jt().fromArray(mt);function W(P,vt,V,K){const dt=new Uint8Array(4),_t=i.createTexture();i.bindTexture(P,_t),i.texParameteri(P,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(P,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Wt=0;Wt<V;Wt++)P===i.TEXTURE_3D||P===i.TEXTURE_2D_ARRAY?i.texImage3D(vt,0,i.RGBA,1,1,K,0,i.RGBA,i.UNSIGNED_BYTE,dt):i.texImage2D(vt+Wt,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,dt);return _t}const tt={};tt[i.TEXTURE_2D]=W(i.TEXTURE_2D,i.TEXTURE_2D,1),tt[i.TEXTURE_CUBE_MAP]=W(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),tt[i.TEXTURE_2D_ARRAY]=W(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),tt[i.TEXTURE_3D]=W(i.TEXTURE_3D,i.TEXTURE_3D,1,1),s.setClear(0,0,0,1),r.setClear(1),a.setClear(0),Mt(i.DEPTH_TEST),r.setFunc(Ei),st(!1),j(No),Mt(i.CULL_FACE),w(An);function Mt(P){c[P]!==!0&&(i.enable(P),c[P]=!0)}function ct(P){c[P]!==!1&&(i.disable(P),c[P]=!1)}function Pt(P,vt){return h[P]!==vt?(i.bindFramebuffer(P,vt),h[P]=vt,P===i.DRAW_FRAMEBUFFER&&(h[i.FRAMEBUFFER]=vt),P===i.FRAMEBUFFER&&(h[i.DRAW_FRAMEBUFFER]=vt),!0):!1}function Ct(P,vt){let V=u,K=!1;if(P){V=d.get(vt),V===void 0&&(V=[],d.set(vt,V));const dt=P.textures;if(V.length!==dt.length||V[0]!==i.COLOR_ATTACHMENT0){for(let _t=0,Wt=dt.length;_t<Wt;_t++)V[_t]=i.COLOR_ATTACHMENT0+_t;V.length=dt.length,K=!0}}else V[0]!==i.BACK&&(V[0]=i.BACK,K=!0);K&&i.drawBuffers(V)}function Nt(P){return f!==P?(i.useProgram(P),f=P,!0):!1}const zt={[Hn]:i.FUNC_ADD,[wh]:i.FUNC_SUBTRACT,[Th]:i.FUNC_REVERSE_SUBTRACT};zt[Ah]=i.MIN,zt[Rh]=i.MAX;const q={[Ch]:i.ZERO,[Ph]:i.ONE,[Lh]:i.SRC_COLOR,[ia]:i.SRC_ALPHA,[Oh]:i.SRC_ALPHA_SATURATE,[Nh]:i.DST_COLOR,[Uh]:i.DST_ALPHA,[Dh]:i.ONE_MINUS_SRC_COLOR,[sa]:i.ONE_MINUS_SRC_ALPHA,[Fh]:i.ONE_MINUS_DST_COLOR,[Ih]:i.ONE_MINUS_DST_ALPHA,[Bh]:i.CONSTANT_COLOR,[zh]:i.ONE_MINUS_CONSTANT_COLOR,[kh]:i.CONSTANT_ALPHA,[Hh]:i.ONE_MINUS_CONSTANT_ALPHA};function w(P,vt,V,K,dt,_t,Wt,ae,Me,$t){if(P===An){g===!0&&(ct(i.BLEND),g=!1);return}if(g===!1&&(Mt(i.BLEND),g=!0),P!==Eh){if(P!==x||$t!==U){if((p!==Hn||y!==Hn)&&(i.blendEquation(i.FUNC_ADD),p=Hn,y=Hn),$t)switch(P){case Mi:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Fo:i.blendFunc(i.ONE,i.ONE);break;case Oo:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Bo:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",P);break}else switch(P){case Mi:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Fo:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case Oo:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Bo:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",P);break}m=null,T=null,b=null,N=null,C.set(0,0,0),A=0,x=P,U=$t}return}dt=dt||vt,_t=_t||V,Wt=Wt||K,(vt!==p||dt!==y)&&(i.blendEquationSeparate(zt[vt],zt[dt]),p=vt,y=dt),(V!==m||K!==T||_t!==b||Wt!==N)&&(i.blendFuncSeparate(q[V],q[K],q[_t],q[Wt]),m=V,T=K,b=_t,N=Wt),(ae.equals(C)===!1||Me!==A)&&(i.blendColor(ae.r,ae.g,ae.b,Me),C.copy(ae),A=Me),x=P,U=!1}function rt(P,vt){P.side===sn?ct(i.CULL_FACE):Mt(i.CULL_FACE);let V=P.side===xe;vt&&(V=!V),st(V),P.blending===Mi&&P.transparent===!1?w(An):w(P.blending,P.blendEquation,P.blendSrc,P.blendDst,P.blendEquationAlpha,P.blendSrcAlpha,P.blendDstAlpha,P.blendColor,P.blendAlpha,P.premultipliedAlpha),r.setFunc(P.depthFunc),r.setTest(P.depthTest),r.setMask(P.depthWrite),s.setMask(P.colorWrite);const K=P.stencilWrite;a.setTest(K),K&&(a.setMask(P.stencilWriteMask),a.setFunc(P.stencilFunc,P.stencilRef,P.stencilFuncMask),a.setOp(P.stencilFail,P.stencilZFail,P.stencilZPass)),At(P.polygonOffset,P.polygonOffsetFactor,P.polygonOffsetUnits),P.alphaToCoverage===!0?Mt(i.SAMPLE_ALPHA_TO_COVERAGE):ct(i.SAMPLE_ALPHA_TO_COVERAGE)}function st(P){Z!==P&&(P?i.frontFace(i.CW):i.frontFace(i.CCW),Z=P)}function j(P){P!==Sh?(Mt(i.CULL_FACE),P!==v&&(P===No?i.cullFace(i.BACK):P===bh?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):ct(i.CULL_FACE),v=P}function at(P){P!==S&&(J&&i.lineWidth(P),S=P)}function At(P,vt,V){P?(Mt(i.POLYGON_OFFSET_FILL),(H!==vt||B!==V)&&(i.polygonOffset(vt,V),H=vt,B=V)):ct(i.POLYGON_OFFSET_FILL)}function gt(P){P?Mt(i.SCISSOR_TEST):ct(i.SCISSOR_TEST)}function E(P){P===void 0&&(P=i.TEXTURE0+k-1),G!==P&&(i.activeTexture(P),G=P)}function _(P,vt,V){V===void 0&&(G===null?V=i.TEXTURE0+k-1:V=G);let K=ut[V];K===void 0&&(K={type:void 0,texture:void 0},ut[V]=K),(K.type!==P||K.texture!==vt)&&(G!==V&&(i.activeTexture(V),G=V),i.bindTexture(P,vt||tt[P]),K.type=P,K.texture=vt)}function I(){const P=ut[G];P!==void 0&&P.type!==void 0&&(i.bindTexture(P.type,null),P.type=void 0,P.texture=void 0)}function X(){try{i.compressedTexImage2D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function Y(){try{i.compressedTexImage3D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function $(){try{i.texSubImage2D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function Et(){try{i.texSubImage3D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function ot(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function xt(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function Vt(){try{i.texStorage2D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function et(){try{i.texStorage3D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function yt(){try{i.texImage2D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function Ut(){try{i.texImage3D.apply(i,arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function It(P){kt.equals(P)===!1&&(i.scissor(P.x,P.y,P.z,P.w),kt.copy(P))}function St(P){Xt.equals(P)===!1&&(i.viewport(P.x,P.y,P.z,P.w),Xt.copy(P))}function Gt(P,vt){let V=l.get(vt);V===void 0&&(V=new WeakMap,l.set(vt,V));let K=V.get(P);K===void 0&&(K=i.getUniformBlockIndex(vt,P.name),V.set(P,K))}function Ft(P,vt){const K=l.get(vt).get(P);o.get(vt)!==K&&(i.uniformBlockBinding(vt,K,P.__bindingPointIndex),o.set(vt,K))}function te(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),c={},G=null,ut={},h={},d=new WeakMap,u=[],f=null,g=!1,x=null,p=null,m=null,T=null,y=null,b=null,N=null,C=new Ht(0,0,0),A=0,U=!1,Z=null,v=null,S=null,H=null,B=null,kt.set(0,0,i.canvas.width,i.canvas.height),Xt.set(0,0,i.canvas.width,i.canvas.height),s.reset(),r.reset(),a.reset()}return{buffers:{color:s,depth:r,stencil:a},enable:Mt,disable:ct,bindFramebuffer:Pt,drawBuffers:Ct,useProgram:Nt,setBlending:w,setMaterial:rt,setFlipSided:st,setCullFace:j,setLineWidth:at,setPolygonOffset:At,setScissorTest:gt,activeTexture:E,bindTexture:_,unbindTexture:I,compressedTexImage2D:X,compressedTexImage3D:Y,texImage2D:yt,texImage3D:Ut,updateUBOMapping:Gt,uniformBlockBinding:Ft,texStorage2D:Vt,texStorage3D:et,texSubImage2D:$,texSubImage3D:Et,compressedTexSubImage2D:ot,compressedTexSubImage3D:xt,scissor:It,viewport:St,reset:te}}function Rl(i,t,e,n){const s=Tg(n);switch(e){case uc:return i*t;case fc:return i*t;case pc:return i*t*2;case mc:return i*t/s.components*s.byteLength;case eo:return i*t/s.components*s.byteLength;case gc:return i*t*2/s.components*s.byteLength;case no:return i*t*2/s.components*s.byteLength;case dc:return i*t*3/s.components*s.byteLength;case He:return i*t*4/s.components*s.byteLength;case io:return i*t*4/s.components*s.byteLength;case Is:case Ns:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Fs:case Os:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case ga:case _a:return Math.max(i,16)*Math.max(t,8)/4;case ma:case va:return Math.max(i,8)*Math.max(t,8)/2;case xa:case ya:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Ma:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Sa:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case ba:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case Ea:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case wa:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case Ta:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case Aa:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case Ra:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case Ca:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case Pa:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case La:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case Da:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case Ua:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case Ia:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case Na:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case Bs:case Fa:case Oa:return Math.ceil(i/4)*Math.ceil(t/4)*16;case vc:case Ba:return Math.ceil(i/4)*Math.ceil(t/4)*8;case za:case ka:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function Tg(i){switch(i){case dn:case lc:return{byteLength:1,components:1};case Yi:case cc:case Qi:return{byteLength:2,components:1};case Qa:case to:return{byteLength:2,components:4};case qn:case ja:case ln:return{byteLength:4,components:1};case hc:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}function Ag(i,t,e,n,s,r,a){const o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new it,h=new WeakMap;let d;const u=new WeakMap;let f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(E,_){return f?new OffscreenCanvas(E,_):Ys("canvas")}function x(E,_,I){let X=1;const Y=gt(E);if((Y.width>I||Y.height>I)&&(X=I/Math.max(Y.width,Y.height)),X<1)if(typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&E instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&E instanceof ImageBitmap||typeof VideoFrame<"u"&&E instanceof VideoFrame){const $=Math.floor(X*Y.width),Et=Math.floor(X*Y.height);d===void 0&&(d=g($,Et));const ot=_?g($,Et):d;return ot.width=$,ot.height=Et,ot.getContext("2d").drawImage(E,0,0,$,Et),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+Y.width+"x"+Y.height+") to ("+$+"x"+Et+")."),ot}else return"data"in E&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+Y.width+"x"+Y.height+")."),E;return E}function p(E){return E.generateMipmaps&&E.minFilter!==Ie&&E.minFilter!==ze}function m(E){i.generateMipmap(E)}function T(E,_,I,X,Y=!1){if(E!==null){if(i[E]!==void 0)return i[E];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+E+"'")}let $=_;if(_===i.RED&&(I===i.FLOAT&&($=i.R32F),I===i.HALF_FLOAT&&($=i.R16F),I===i.UNSIGNED_BYTE&&($=i.R8)),_===i.RED_INTEGER&&(I===i.UNSIGNED_BYTE&&($=i.R8UI),I===i.UNSIGNED_SHORT&&($=i.R16UI),I===i.UNSIGNED_INT&&($=i.R32UI),I===i.BYTE&&($=i.R8I),I===i.SHORT&&($=i.R16I),I===i.INT&&($=i.R32I)),_===i.RG&&(I===i.FLOAT&&($=i.RG32F),I===i.HALF_FLOAT&&($=i.RG16F),I===i.UNSIGNED_BYTE&&($=i.RG8)),_===i.RG_INTEGER&&(I===i.UNSIGNED_BYTE&&($=i.RG8UI),I===i.UNSIGNED_SHORT&&($=i.RG16UI),I===i.UNSIGNED_INT&&($=i.RG32UI),I===i.BYTE&&($=i.RG8I),I===i.SHORT&&($=i.RG16I),I===i.INT&&($=i.RG32I)),_===i.RGB_INTEGER&&(I===i.UNSIGNED_BYTE&&($=i.RGB8UI),I===i.UNSIGNED_SHORT&&($=i.RGB16UI),I===i.UNSIGNED_INT&&($=i.RGB32UI),I===i.BYTE&&($=i.RGB8I),I===i.SHORT&&($=i.RGB16I),I===i.INT&&($=i.RGB32I)),_===i.RGBA_INTEGER&&(I===i.UNSIGNED_BYTE&&($=i.RGBA8UI),I===i.UNSIGNED_SHORT&&($=i.RGBA16UI),I===i.UNSIGNED_INT&&($=i.RGBA32UI),I===i.BYTE&&($=i.RGBA8I),I===i.SHORT&&($=i.RGBA16I),I===i.INT&&($=i.RGBA32I)),_===i.RGB&&I===i.UNSIGNED_INT_5_9_9_9_REV&&($=i.RGB9_E5),_===i.RGBA){const Et=Y?Ws:Kt.getTransfer(X);I===i.FLOAT&&($=i.RGBA32F),I===i.HALF_FLOAT&&($=i.RGBA16F),I===i.UNSIGNED_BYTE&&($=Et===ne?i.SRGB8_ALPHA8:i.RGBA8),I===i.UNSIGNED_SHORT_4_4_4_4&&($=i.RGBA4),I===i.UNSIGNED_SHORT_5_5_5_1&&($=i.RGB5_A1)}return($===i.R16F||$===i.R32F||$===i.RG16F||$===i.RG32F||$===i.RGBA16F||$===i.RGBA32F)&&t.get("EXT_color_buffer_float"),$}function y(E,_){let I;return E?_===null||_===qn||_===Ai?I=i.DEPTH24_STENCIL8:_===ln?I=i.DEPTH32F_STENCIL8:_===Yi&&(I=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):_===null||_===qn||_===Ai?I=i.DEPTH_COMPONENT24:_===ln?I=i.DEPTH_COMPONENT32F:_===Yi&&(I=i.DEPTH_COMPONENT16),I}function b(E,_){return p(E)===!0||E.isFramebufferTexture&&E.minFilter!==Ie&&E.minFilter!==ze?Math.log2(Math.max(_.width,_.height))+1:E.mipmaps!==void 0&&E.mipmaps.length>0?E.mipmaps.length:E.isCompressedTexture&&Array.isArray(E.image)?_.mipmaps.length:1}function N(E){const _=E.target;_.removeEventListener("dispose",N),A(_),_.isVideoTexture&&h.delete(_)}function C(E){const _=E.target;_.removeEventListener("dispose",C),Z(_)}function A(E){const _=n.get(E);if(_.__webglInit===void 0)return;const I=E.source,X=u.get(I);if(X){const Y=X[_.__cacheKey];Y.usedTimes--,Y.usedTimes===0&&U(E),Object.keys(X).length===0&&u.delete(I)}n.remove(E)}function U(E){const _=n.get(E);i.deleteTexture(_.__webglTexture);const I=E.source,X=u.get(I);delete X[_.__cacheKey],a.memory.textures--}function Z(E){const _=n.get(E);if(E.depthTexture&&E.depthTexture.dispose(),E.isWebGLCubeRenderTarget)for(let X=0;X<6;X++){if(Array.isArray(_.__webglFramebuffer[X]))for(let Y=0;Y<_.__webglFramebuffer[X].length;Y++)i.deleteFramebuffer(_.__webglFramebuffer[X][Y]);else i.deleteFramebuffer(_.__webglFramebuffer[X]);_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer[X])}else{if(Array.isArray(_.__webglFramebuffer))for(let X=0;X<_.__webglFramebuffer.length;X++)i.deleteFramebuffer(_.__webglFramebuffer[X]);else i.deleteFramebuffer(_.__webglFramebuffer);if(_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer),_.__webglMultisampledFramebuffer&&i.deleteFramebuffer(_.__webglMultisampledFramebuffer),_.__webglColorRenderbuffer)for(let X=0;X<_.__webglColorRenderbuffer.length;X++)_.__webglColorRenderbuffer[X]&&i.deleteRenderbuffer(_.__webglColorRenderbuffer[X]);_.__webglDepthRenderbuffer&&i.deleteRenderbuffer(_.__webglDepthRenderbuffer)}const I=E.textures;for(let X=0,Y=I.length;X<Y;X++){const $=n.get(I[X]);$.__webglTexture&&(i.deleteTexture($.__webglTexture),a.memory.textures--),n.remove(I[X])}n.remove(E)}let v=0;function S(){v=0}function H(){const E=v;return E>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+E+" texture units while this GPU supports only "+s.maxTextures),v+=1,E}function B(E){const _=[];return _.push(E.wrapS),_.push(E.wrapT),_.push(E.wrapR||0),_.push(E.magFilter),_.push(E.minFilter),_.push(E.anisotropy),_.push(E.internalFormat),_.push(E.format),_.push(E.type),_.push(E.generateMipmaps),_.push(E.premultiplyAlpha),_.push(E.flipY),_.push(E.unpackAlignment),_.push(E.colorSpace),_.join()}function k(E,_){const I=n.get(E);if(E.isVideoTexture&&at(E),E.isRenderTargetTexture===!1&&E.version>0&&I.__version!==E.version){const X=E.image;if(X===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(X.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{Xt(I,E,_);return}}e.bindTexture(i.TEXTURE_2D,I.__webglTexture,i.TEXTURE0+_)}function J(E,_){const I=n.get(E);if(E.version>0&&I.__version!==E.version){Xt(I,E,_);return}e.bindTexture(i.TEXTURE_2D_ARRAY,I.__webglTexture,i.TEXTURE0+_)}function O(E,_){const I=n.get(E);if(E.version>0&&I.__version!==E.version){Xt(I,E,_);return}e.bindTexture(i.TEXTURE_3D,I.__webglTexture,i.TEXTURE0+_)}function Q(E,_){const I=n.get(E);if(E.version>0&&I.__version!==E.version){W(I,E,_);return}e.bindTexture(i.TEXTURE_CUBE_MAP,I.__webglTexture,i.TEXTURE0+_)}const G={[Gs]:i.REPEAT,[Gn]:i.CLAMP_TO_EDGE,[pa]:i.MIRRORED_REPEAT},ut={[Ie]:i.NEAREST,[Zh]:i.NEAREST_MIPMAP_NEAREST,[as]:i.NEAREST_MIPMAP_LINEAR,[ze]:i.LINEAR,[hr]:i.LINEAR_MIPMAP_NEAREST,[Wn]:i.LINEAR_MIPMAP_LINEAR},pt={[tu]:i.NEVER,[au]:i.ALWAYS,[eu]:i.LESS,[xc]:i.LEQUAL,[nu]:i.EQUAL,[ru]:i.GEQUAL,[iu]:i.GREATER,[su]:i.NOTEQUAL};function mt(E,_){if(_.type===ln&&t.has("OES_texture_float_linear")===!1&&(_.magFilter===ze||_.magFilter===hr||_.magFilter===as||_.magFilter===Wn||_.minFilter===ze||_.minFilter===hr||_.minFilter===as||_.minFilter===Wn)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(E,i.TEXTURE_WRAP_S,G[_.wrapS]),i.texParameteri(E,i.TEXTURE_WRAP_T,G[_.wrapT]),(E===i.TEXTURE_3D||E===i.TEXTURE_2D_ARRAY)&&i.texParameteri(E,i.TEXTURE_WRAP_R,G[_.wrapR]),i.texParameteri(E,i.TEXTURE_MAG_FILTER,ut[_.magFilter]),i.texParameteri(E,i.TEXTURE_MIN_FILTER,ut[_.minFilter]),_.compareFunction&&(i.texParameteri(E,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(E,i.TEXTURE_COMPARE_FUNC,pt[_.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(_.magFilter===Ie||_.minFilter!==as&&_.minFilter!==Wn||_.type===ln&&t.has("OES_texture_float_linear")===!1)return;if(_.anisotropy>1||n.get(_).__currentAnisotropy){const I=t.get("EXT_texture_filter_anisotropic");i.texParameterf(E,I.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(_.anisotropy,s.getMaxAnisotropy())),n.get(_).__currentAnisotropy=_.anisotropy}}}function kt(E,_){let I=!1;E.__webglInit===void 0&&(E.__webglInit=!0,_.addEventListener("dispose",N));const X=_.source;let Y=u.get(X);Y===void 0&&(Y={},u.set(X,Y));const $=B(_);if($!==E.__cacheKey){Y[$]===void 0&&(Y[$]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,I=!0),Y[$].usedTimes++;const Et=Y[E.__cacheKey];Et!==void 0&&(Y[E.__cacheKey].usedTimes--,Et.usedTimes===0&&U(_)),E.__cacheKey=$,E.__webglTexture=Y[$].texture}return I}function Xt(E,_,I){let X=i.TEXTURE_2D;(_.isDataArrayTexture||_.isCompressedArrayTexture)&&(X=i.TEXTURE_2D_ARRAY),_.isData3DTexture&&(X=i.TEXTURE_3D);const Y=kt(E,_),$=_.source;e.bindTexture(X,E.__webglTexture,i.TEXTURE0+I);const Et=n.get($);if($.version!==Et.__version||Y===!0){e.activeTexture(i.TEXTURE0+I);const ot=Kt.getPrimaries(Kt.workingColorSpace),xt=_.colorSpace===yn?null:Kt.getPrimaries(_.colorSpace),Vt=_.colorSpace===yn||ot===xt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Vt);let et=x(_.image,!1,s.maxTextureSize);et=At(_,et);const yt=r.convert(_.format,_.colorSpace),Ut=r.convert(_.type);let It=T(_.internalFormat,yt,Ut,_.colorSpace,_.isVideoTexture);mt(X,_);let St;const Gt=_.mipmaps,Ft=_.isVideoTexture!==!0,te=Et.__version===void 0||Y===!0,P=$.dataReady,vt=b(_,et);if(_.isDepthTexture)It=y(_.format===Ri,_.type),te&&(Ft?e.texStorage2D(i.TEXTURE_2D,1,It,et.width,et.height):e.texImage2D(i.TEXTURE_2D,0,It,et.width,et.height,0,yt,Ut,null));else if(_.isDataTexture)if(Gt.length>0){Ft&&te&&e.texStorage2D(i.TEXTURE_2D,vt,It,Gt[0].width,Gt[0].height);for(let V=0,K=Gt.length;V<K;V++)St=Gt[V],Ft?P&&e.texSubImage2D(i.TEXTURE_2D,V,0,0,St.width,St.height,yt,Ut,St.data):e.texImage2D(i.TEXTURE_2D,V,It,St.width,St.height,0,yt,Ut,St.data);_.generateMipmaps=!1}else Ft?(te&&e.texStorage2D(i.TEXTURE_2D,vt,It,et.width,et.height),P&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,et.width,et.height,yt,Ut,et.data)):e.texImage2D(i.TEXTURE_2D,0,It,et.width,et.height,0,yt,Ut,et.data);else if(_.isCompressedTexture)if(_.isCompressedArrayTexture){Ft&&te&&e.texStorage3D(i.TEXTURE_2D_ARRAY,vt,It,Gt[0].width,Gt[0].height,et.depth);for(let V=0,K=Gt.length;V<K;V++)if(St=Gt[V],_.format!==He)if(yt!==null)if(Ft){if(P)if(_.layerUpdates.size>0){const dt=Rl(St.width,St.height,_.format,_.type);for(const _t of _.layerUpdates){const Wt=St.data.subarray(_t*dt/St.data.BYTES_PER_ELEMENT,(_t+1)*dt/St.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,V,0,0,_t,St.width,St.height,1,yt,Wt,0,0)}_.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,V,0,0,0,St.width,St.height,et.depth,yt,St.data,0,0)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,V,It,St.width,St.height,et.depth,0,St.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ft?P&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,V,0,0,0,St.width,St.height,et.depth,yt,Ut,St.data):e.texImage3D(i.TEXTURE_2D_ARRAY,V,It,St.width,St.height,et.depth,0,yt,Ut,St.data)}else{Ft&&te&&e.texStorage2D(i.TEXTURE_2D,vt,It,Gt[0].width,Gt[0].height);for(let V=0,K=Gt.length;V<K;V++)St=Gt[V],_.format!==He?yt!==null?Ft?P&&e.compressedTexSubImage2D(i.TEXTURE_2D,V,0,0,St.width,St.height,yt,St.data):e.compressedTexImage2D(i.TEXTURE_2D,V,It,St.width,St.height,0,St.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ft?P&&e.texSubImage2D(i.TEXTURE_2D,V,0,0,St.width,St.height,yt,Ut,St.data):e.texImage2D(i.TEXTURE_2D,V,It,St.width,St.height,0,yt,Ut,St.data)}else if(_.isDataArrayTexture)if(Ft){if(te&&e.texStorage3D(i.TEXTURE_2D_ARRAY,vt,It,et.width,et.height,et.depth),P)if(_.layerUpdates.size>0){const V=Rl(et.width,et.height,_.format,_.type);for(const K of _.layerUpdates){const dt=et.data.subarray(K*V/et.data.BYTES_PER_ELEMENT,(K+1)*V/et.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,K,et.width,et.height,1,yt,Ut,dt)}_.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,et.width,et.height,et.depth,yt,Ut,et.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,It,et.width,et.height,et.depth,0,yt,Ut,et.data);else if(_.isData3DTexture)Ft?(te&&e.texStorage3D(i.TEXTURE_3D,vt,It,et.width,et.height,et.depth),P&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,et.width,et.height,et.depth,yt,Ut,et.data)):e.texImage3D(i.TEXTURE_3D,0,It,et.width,et.height,et.depth,0,yt,Ut,et.data);else if(_.isFramebufferTexture){if(te)if(Ft)e.texStorage2D(i.TEXTURE_2D,vt,It,et.width,et.height);else{let V=et.width,K=et.height;for(let dt=0;dt<vt;dt++)e.texImage2D(i.TEXTURE_2D,dt,It,V,K,0,yt,Ut,null),V>>=1,K>>=1}}else if(Gt.length>0){if(Ft&&te){const V=gt(Gt[0]);e.texStorage2D(i.TEXTURE_2D,vt,It,V.width,V.height)}for(let V=0,K=Gt.length;V<K;V++)St=Gt[V],Ft?P&&e.texSubImage2D(i.TEXTURE_2D,V,0,0,yt,Ut,St):e.texImage2D(i.TEXTURE_2D,V,It,yt,Ut,St);_.generateMipmaps=!1}else if(Ft){if(te){const V=gt(et);e.texStorage2D(i.TEXTURE_2D,vt,It,V.width,V.height)}P&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,yt,Ut,et)}else e.texImage2D(i.TEXTURE_2D,0,It,yt,Ut,et);p(_)&&m(X),Et.__version=$.version,_.onUpdate&&_.onUpdate(_)}E.__version=_.version}function W(E,_,I){if(_.image.length!==6)return;const X=kt(E,_),Y=_.source;e.bindTexture(i.TEXTURE_CUBE_MAP,E.__webglTexture,i.TEXTURE0+I);const $=n.get(Y);if(Y.version!==$.__version||X===!0){e.activeTexture(i.TEXTURE0+I);const Et=Kt.getPrimaries(Kt.workingColorSpace),ot=_.colorSpace===yn?null:Kt.getPrimaries(_.colorSpace),xt=_.colorSpace===yn||Et===ot?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,xt);const Vt=_.isCompressedTexture||_.image[0].isCompressedTexture,et=_.image[0]&&_.image[0].isDataTexture,yt=[];for(let K=0;K<6;K++)!Vt&&!et?yt[K]=x(_.image[K],!0,s.maxCubemapSize):yt[K]=et?_.image[K].image:_.image[K],yt[K]=At(_,yt[K]);const Ut=yt[0],It=r.convert(_.format,_.colorSpace),St=r.convert(_.type),Gt=T(_.internalFormat,It,St,_.colorSpace),Ft=_.isVideoTexture!==!0,te=$.__version===void 0||X===!0,P=Y.dataReady;let vt=b(_,Ut);mt(i.TEXTURE_CUBE_MAP,_);let V;if(Vt){Ft&&te&&e.texStorage2D(i.TEXTURE_CUBE_MAP,vt,Gt,Ut.width,Ut.height);for(let K=0;K<6;K++){V=yt[K].mipmaps;for(let dt=0;dt<V.length;dt++){const _t=V[dt];_.format!==He?It!==null?Ft?P&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,dt,0,0,_t.width,_t.height,It,_t.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,dt,Gt,_t.width,_t.height,0,_t.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Ft?P&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,dt,0,0,_t.width,_t.height,It,St,_t.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,dt,Gt,_t.width,_t.height,0,It,St,_t.data)}}}else{if(V=_.mipmaps,Ft&&te){V.length>0&&vt++;const K=gt(yt[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,vt,Gt,K.width,K.height)}for(let K=0;K<6;K++)if(et){Ft?P&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,yt[K].width,yt[K].height,It,St,yt[K].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Gt,yt[K].width,yt[K].height,0,It,St,yt[K].data);for(let dt=0;dt<V.length;dt++){const Wt=V[dt].image[K].image;Ft?P&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,dt+1,0,0,Wt.width,Wt.height,It,St,Wt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,dt+1,Gt,Wt.width,Wt.height,0,It,St,Wt.data)}}else{Ft?P&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,0,0,It,St,yt[K]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,0,Gt,It,St,yt[K]);for(let dt=0;dt<V.length;dt++){const _t=V[dt];Ft?P&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,dt+1,0,0,It,St,_t.image[K]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+K,dt+1,Gt,It,St,_t.image[K])}}}p(_)&&m(i.TEXTURE_CUBE_MAP),$.__version=Y.version,_.onUpdate&&_.onUpdate(_)}E.__version=_.version}function tt(E,_,I,X,Y,$){const Et=r.convert(I.format,I.colorSpace),ot=r.convert(I.type),xt=T(I.internalFormat,Et,ot,I.colorSpace);if(!n.get(_).__hasExternalTextures){const et=Math.max(1,_.width>>$),yt=Math.max(1,_.height>>$);Y===i.TEXTURE_3D||Y===i.TEXTURE_2D_ARRAY?e.texImage3D(Y,$,xt,et,yt,_.depth,0,Et,ot,null):e.texImage2D(Y,$,xt,et,yt,0,Et,ot,null)}e.bindFramebuffer(i.FRAMEBUFFER,E),j(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,X,Y,n.get(I).__webglTexture,0,st(_)):(Y===i.TEXTURE_2D||Y>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&Y<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,X,Y,n.get(I).__webglTexture,$),e.bindFramebuffer(i.FRAMEBUFFER,null)}function Mt(E,_,I){if(i.bindRenderbuffer(i.RENDERBUFFER,E),_.depthBuffer){const X=_.depthTexture,Y=X&&X.isDepthTexture?X.type:null,$=y(_.stencilBuffer,Y),Et=_.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ot=st(_);j(_)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ot,$,_.width,_.height):I?i.renderbufferStorageMultisample(i.RENDERBUFFER,ot,$,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,$,_.width,_.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,Et,i.RENDERBUFFER,E)}else{const X=_.textures;for(let Y=0;Y<X.length;Y++){const $=X[Y],Et=r.convert($.format,$.colorSpace),ot=r.convert($.type),xt=T($.internalFormat,Et,ot,$.colorSpace),Vt=st(_);I&&j(_)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Vt,xt,_.width,_.height):j(_)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Vt,xt,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,xt,_.width,_.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function ct(E,_){if(_&&_.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(i.FRAMEBUFFER,E),!(_.depthTexture&&_.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!n.get(_.depthTexture).__webglTexture||_.depthTexture.image.width!==_.width||_.depthTexture.image.height!==_.height)&&(_.depthTexture.image.width=_.width,_.depthTexture.image.height=_.height,_.depthTexture.needsUpdate=!0),k(_.depthTexture,0);const X=n.get(_.depthTexture).__webglTexture,Y=st(_);if(_.depthTexture.format===Si)j(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,X,0,Y):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,X,0);else if(_.depthTexture.format===Ri)j(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,X,0,Y):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,X,0);else throw new Error("Unknown depthTexture format")}function Pt(E){const _=n.get(E),I=E.isWebGLCubeRenderTarget===!0;if(_.__boundDepthTexture!==E.depthTexture){const X=E.depthTexture;if(_.__depthDisposeCallback&&_.__depthDisposeCallback(),X){const Y=()=>{delete _.__boundDepthTexture,delete _.__depthDisposeCallback,X.removeEventListener("dispose",Y)};X.addEventListener("dispose",Y),_.__depthDisposeCallback=Y}_.__boundDepthTexture=X}if(E.depthTexture&&!_.__autoAllocateDepthBuffer){if(I)throw new Error("target.depthTexture not supported in Cube render targets");ct(_.__webglFramebuffer,E)}else if(I){_.__webglDepthbuffer=[];for(let X=0;X<6;X++)if(e.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer[X]),_.__webglDepthbuffer[X]===void 0)_.__webglDepthbuffer[X]=i.createRenderbuffer(),Mt(_.__webglDepthbuffer[X],E,!1);else{const Y=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,$=_.__webglDepthbuffer[X];i.bindRenderbuffer(i.RENDERBUFFER,$),i.framebufferRenderbuffer(i.FRAMEBUFFER,Y,i.RENDERBUFFER,$)}}else if(e.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer),_.__webglDepthbuffer===void 0)_.__webglDepthbuffer=i.createRenderbuffer(),Mt(_.__webglDepthbuffer,E,!1);else{const X=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Y=_.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,Y),i.framebufferRenderbuffer(i.FRAMEBUFFER,X,i.RENDERBUFFER,Y)}e.bindFramebuffer(i.FRAMEBUFFER,null)}function Ct(E,_,I){const X=n.get(E);_!==void 0&&tt(X.__webglFramebuffer,E,E.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),I!==void 0&&Pt(E)}function Nt(E){const _=E.texture,I=n.get(E),X=n.get(_);E.addEventListener("dispose",C);const Y=E.textures,$=E.isWebGLCubeRenderTarget===!0,Et=Y.length>1;if(Et||(X.__webglTexture===void 0&&(X.__webglTexture=i.createTexture()),X.__version=_.version,a.memory.textures++),$){I.__webglFramebuffer=[];for(let ot=0;ot<6;ot++)if(_.mipmaps&&_.mipmaps.length>0){I.__webglFramebuffer[ot]=[];for(let xt=0;xt<_.mipmaps.length;xt++)I.__webglFramebuffer[ot][xt]=i.createFramebuffer()}else I.__webglFramebuffer[ot]=i.createFramebuffer()}else{if(_.mipmaps&&_.mipmaps.length>0){I.__webglFramebuffer=[];for(let ot=0;ot<_.mipmaps.length;ot++)I.__webglFramebuffer[ot]=i.createFramebuffer()}else I.__webglFramebuffer=i.createFramebuffer();if(Et)for(let ot=0,xt=Y.length;ot<xt;ot++){const Vt=n.get(Y[ot]);Vt.__webglTexture===void 0&&(Vt.__webglTexture=i.createTexture(),a.memory.textures++)}if(E.samples>0&&j(E)===!1){I.__webglMultisampledFramebuffer=i.createFramebuffer(),I.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,I.__webglMultisampledFramebuffer);for(let ot=0;ot<Y.length;ot++){const xt=Y[ot];I.__webglColorRenderbuffer[ot]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,I.__webglColorRenderbuffer[ot]);const Vt=r.convert(xt.format,xt.colorSpace),et=r.convert(xt.type),yt=T(xt.internalFormat,Vt,et,xt.colorSpace,E.isXRRenderTarget===!0),Ut=st(E);i.renderbufferStorageMultisample(i.RENDERBUFFER,Ut,yt,E.width,E.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ot,i.RENDERBUFFER,I.__webglColorRenderbuffer[ot])}i.bindRenderbuffer(i.RENDERBUFFER,null),E.depthBuffer&&(I.__webglDepthRenderbuffer=i.createRenderbuffer(),Mt(I.__webglDepthRenderbuffer,E,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if($){e.bindTexture(i.TEXTURE_CUBE_MAP,X.__webglTexture),mt(i.TEXTURE_CUBE_MAP,_);for(let ot=0;ot<6;ot++)if(_.mipmaps&&_.mipmaps.length>0)for(let xt=0;xt<_.mipmaps.length;xt++)tt(I.__webglFramebuffer[ot][xt],E,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ot,xt);else tt(I.__webglFramebuffer[ot],E,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ot,0);p(_)&&m(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(Et){for(let ot=0,xt=Y.length;ot<xt;ot++){const Vt=Y[ot],et=n.get(Vt);e.bindTexture(i.TEXTURE_2D,et.__webglTexture),mt(i.TEXTURE_2D,Vt),tt(I.__webglFramebuffer,E,Vt,i.COLOR_ATTACHMENT0+ot,i.TEXTURE_2D,0),p(Vt)&&m(i.TEXTURE_2D)}e.unbindTexture()}else{let ot=i.TEXTURE_2D;if((E.isWebGL3DRenderTarget||E.isWebGLArrayRenderTarget)&&(ot=E.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(ot,X.__webglTexture),mt(ot,_),_.mipmaps&&_.mipmaps.length>0)for(let xt=0;xt<_.mipmaps.length;xt++)tt(I.__webglFramebuffer[xt],E,_,i.COLOR_ATTACHMENT0,ot,xt);else tt(I.__webglFramebuffer,E,_,i.COLOR_ATTACHMENT0,ot,0);p(_)&&m(ot),e.unbindTexture()}E.depthBuffer&&Pt(E)}function zt(E){const _=E.textures;for(let I=0,X=_.length;I<X;I++){const Y=_[I];if(p(Y)){const $=E.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:i.TEXTURE_2D,Et=n.get(Y).__webglTexture;e.bindTexture($,Et),m($),e.unbindTexture()}}}const q=[],w=[];function rt(E){if(E.samples>0){if(j(E)===!1){const _=E.textures,I=E.width,X=E.height;let Y=i.COLOR_BUFFER_BIT;const $=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Et=n.get(E),ot=_.length>1;if(ot)for(let xt=0;xt<_.length;xt++)e.bindFramebuffer(i.FRAMEBUFFER,Et.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+xt,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,Et.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+xt,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,Et.__webglMultisampledFramebuffer),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,Et.__webglFramebuffer);for(let xt=0;xt<_.length;xt++){if(E.resolveDepthBuffer&&(E.depthBuffer&&(Y|=i.DEPTH_BUFFER_BIT),E.stencilBuffer&&E.resolveStencilBuffer&&(Y|=i.STENCIL_BUFFER_BIT)),ot){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,Et.__webglColorRenderbuffer[xt]);const Vt=n.get(_[xt]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Vt,0)}i.blitFramebuffer(0,0,I,X,0,0,I,X,Y,i.NEAREST),l===!0&&(q.length=0,w.length=0,q.push(i.COLOR_ATTACHMENT0+xt),E.depthBuffer&&E.resolveDepthBuffer===!1&&(q.push($),w.push($),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,w)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,q))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),ot)for(let xt=0;xt<_.length;xt++){e.bindFramebuffer(i.FRAMEBUFFER,Et.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+xt,i.RENDERBUFFER,Et.__webglColorRenderbuffer[xt]);const Vt=n.get(_[xt]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,Et.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+xt,i.TEXTURE_2D,Vt,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,Et.__webglMultisampledFramebuffer)}else if(E.depthBuffer&&E.resolveDepthBuffer===!1&&l){const _=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[_])}}}function st(E){return Math.min(s.maxSamples,E.samples)}function j(E){const _=n.get(E);return E.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&_.__useRenderToTexture!==!1}function at(E){const _=a.render.frame;h.get(E)!==_&&(h.set(E,_),E.update())}function At(E,_){const I=E.colorSpace,X=E.format,Y=E.type;return E.isCompressedTexture===!0||E.isVideoTexture===!0||I!==Ln&&I!==yn&&(Kt.getTransfer(I)===ne?(X!==He||Y!==dn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",I)),_}function gt(E){return typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement?(c.width=E.naturalWidth||E.width,c.height=E.naturalHeight||E.height):typeof VideoFrame<"u"&&E instanceof VideoFrame?(c.width=E.displayWidth,c.height=E.displayHeight):(c.width=E.width,c.height=E.height),c}this.allocateTextureUnit=H,this.resetTextureUnits=S,this.setTexture2D=k,this.setTexture2DArray=J,this.setTexture3D=O,this.setTextureCube=Q,this.rebindTextures=Ct,this.setupRenderTarget=Nt,this.updateRenderTargetMipmap=zt,this.updateMultisampleRenderTarget=rt,this.setupDepthRenderbuffer=Pt,this.setupFrameBufferTexture=tt,this.useMultisampledRTT=j}function Rg(i,t){function e(n,s=yn){let r;const a=Kt.getTransfer(s);if(n===dn)return i.UNSIGNED_BYTE;if(n===Qa)return i.UNSIGNED_SHORT_4_4_4_4;if(n===to)return i.UNSIGNED_SHORT_5_5_5_1;if(n===hc)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===lc)return i.BYTE;if(n===cc)return i.SHORT;if(n===Yi)return i.UNSIGNED_SHORT;if(n===ja)return i.INT;if(n===qn)return i.UNSIGNED_INT;if(n===ln)return i.FLOAT;if(n===Qi)return i.HALF_FLOAT;if(n===uc)return i.ALPHA;if(n===dc)return i.RGB;if(n===He)return i.RGBA;if(n===fc)return i.LUMINANCE;if(n===pc)return i.LUMINANCE_ALPHA;if(n===Si)return i.DEPTH_COMPONENT;if(n===Ri)return i.DEPTH_STENCIL;if(n===mc)return i.RED;if(n===eo)return i.RED_INTEGER;if(n===gc)return i.RG;if(n===no)return i.RG_INTEGER;if(n===io)return i.RGBA_INTEGER;if(n===Is||n===Ns||n===Fs||n===Os)if(a===ne)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Is)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Ns)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Fs)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Os)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Is)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Ns)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Fs)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Os)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===ma||n===ga||n===va||n===_a)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===ma)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===ga)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===va)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===_a)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===xa||n===ya||n===Ma)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===xa||n===ya)return a===ne?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Ma)return a===ne?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===Sa||n===ba||n===Ea||n===wa||n===Ta||n===Aa||n===Ra||n===Ca||n===Pa||n===La||n===Da||n===Ua||n===Ia||n===Na)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Sa)return a===ne?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===ba)return a===ne?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Ea)return a===ne?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===wa)return a===ne?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Ta)return a===ne?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Aa)return a===ne?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Ra)return a===ne?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Ca)return a===ne?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Pa)return a===ne?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===La)return a===ne?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Da)return a===ne?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Ua)return a===ne?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Ia)return a===ne?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Na)return a===ne?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Bs||n===Fa||n===Oa)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===Bs)return a===ne?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Fa)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Oa)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===vc||n===Ba||n===za||n===ka)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===Bs)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Ba)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===za)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===ka)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Ai?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}class Cg extends Ce{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class wn extends fe{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Pg={type:"move"};class Br{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new wn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new wn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new R,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new R),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new wn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new R,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new R),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,a=null;const o=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){a=!0;for(const x of t.hand.values()){const p=e.getJointPose(x,n),m=this._getHandJoint(c,x);p!==null&&(m.matrix.fromArray(p.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=p.radius),m.visible=p!==null}const h=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],u=h.position.distanceTo(d.position),f=.02,g=.005;c.inputState.pinching&&u>f+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&u<=f-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Pg)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new wn;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const Lg=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Dg=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class Ug{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){const s=new ge,r=t.properties.get(s);r.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=s}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new Pn({vertexShader:Lg,fragmentShader:Dg,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new jt(new ns(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class Ig extends Pi{constructor(t,e){super();const n=this;let s=null,r=1,a=null,o="local-floor",l=1,c=null,h=null,d=null,u=null,f=null,g=null;const x=new Ug,p=e.getContextAttributes();let m=null,T=null;const y=[],b=[],N=new it;let C=null;const A=new Ce;A.layers.enable(1),A.viewport=new Jt;const U=new Ce;U.layers.enable(2),U.viewport=new Jt;const Z=[A,U],v=new Cg;v.layers.enable(1),v.layers.enable(2);let S=null,H=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(W){let tt=y[W];return tt===void 0&&(tt=new Br,y[W]=tt),tt.getTargetRaySpace()},this.getControllerGrip=function(W){let tt=y[W];return tt===void 0&&(tt=new Br,y[W]=tt),tt.getGripSpace()},this.getHand=function(W){let tt=y[W];return tt===void 0&&(tt=new Br,y[W]=tt),tt.getHandSpace()};function B(W){const tt=b.indexOf(W.inputSource);if(tt===-1)return;const Mt=y[tt];Mt!==void 0&&(Mt.update(W.inputSource,W.frame,c||a),Mt.dispatchEvent({type:W.type,data:W.inputSource}))}function k(){s.removeEventListener("select",B),s.removeEventListener("selectstart",B),s.removeEventListener("selectend",B),s.removeEventListener("squeeze",B),s.removeEventListener("squeezestart",B),s.removeEventListener("squeezeend",B),s.removeEventListener("end",k),s.removeEventListener("inputsourceschange",J);for(let W=0;W<y.length;W++){const tt=b[W];tt!==null&&(b[W]=null,y[W].disconnect(tt))}S=null,H=null,x.reset(),t.setRenderTarget(m),f=null,u=null,d=null,s=null,T=null,Xt.stop(),n.isPresenting=!1,t.setPixelRatio(C),t.setSize(N.width,N.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(W){r=W,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(W){o=W,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(W){c=W},this.getBaseLayer=function(){return u!==null?u:f},this.getBinding=function(){return d},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(W){if(s=W,s!==null){if(m=t.getRenderTarget(),s.addEventListener("select",B),s.addEventListener("selectstart",B),s.addEventListener("selectend",B),s.addEventListener("squeeze",B),s.addEventListener("squeezestart",B),s.addEventListener("squeezeend",B),s.addEventListener("end",k),s.addEventListener("inputsourceschange",J),p.xrCompatible!==!0&&await e.makeXRCompatible(),C=t.getPixelRatio(),t.getSize(N),s.renderState.layers===void 0){const tt={antialias:p.antialias,alpha:!0,depth:p.depth,stencil:p.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(s,e,tt),s.updateRenderState({baseLayer:f}),t.setPixelRatio(1),t.setSize(f.framebufferWidth,f.framebufferHeight,!1),T=new Yn(f.framebufferWidth,f.framebufferHeight,{format:He,type:dn,colorSpace:t.outputColorSpace,stencilBuffer:p.stencil})}else{let tt=null,Mt=null,ct=null;p.depth&&(ct=p.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,tt=p.stencil?Ri:Si,Mt=p.stencil?Ai:qn);const Pt={colorFormat:e.RGBA8,depthFormat:ct,scaleFactor:r};d=new XRWebGLBinding(s,e),u=d.createProjectionLayer(Pt),s.updateRenderState({layers:[u]}),t.setPixelRatio(1),t.setSize(u.textureWidth,u.textureHeight,!1),T=new Yn(u.textureWidth,u.textureHeight,{format:He,type:dn,depthTexture:new Dc(u.textureWidth,u.textureHeight,Mt,void 0,void 0,void 0,void 0,void 0,void 0,tt),stencilBuffer:p.stencil,colorSpace:t.outputColorSpace,samples:p.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1})}T.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await s.requestReferenceSpace(o),Xt.setContext(s),Xt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return x.getDepthTexture()};function J(W){for(let tt=0;tt<W.removed.length;tt++){const Mt=W.removed[tt],ct=b.indexOf(Mt);ct>=0&&(b[ct]=null,y[ct].disconnect(Mt))}for(let tt=0;tt<W.added.length;tt++){const Mt=W.added[tt];let ct=b.indexOf(Mt);if(ct===-1){for(let Ct=0;Ct<y.length;Ct++)if(Ct>=b.length){b.push(Mt),ct=Ct;break}else if(b[Ct]===null){b[Ct]=Mt,ct=Ct;break}if(ct===-1)break}const Pt=y[ct];Pt&&Pt.connect(Mt)}}const O=new R,Q=new R;function G(W,tt,Mt){O.setFromMatrixPosition(tt.matrixWorld),Q.setFromMatrixPosition(Mt.matrixWorld);const ct=O.distanceTo(Q),Pt=tt.projectionMatrix.elements,Ct=Mt.projectionMatrix.elements,Nt=Pt[14]/(Pt[10]-1),zt=Pt[14]/(Pt[10]+1),q=(Pt[9]+1)/Pt[5],w=(Pt[9]-1)/Pt[5],rt=(Pt[8]-1)/Pt[0],st=(Ct[8]+1)/Ct[0],j=Nt*rt,at=Nt*st,At=ct/(-rt+st),gt=At*-rt;if(tt.matrixWorld.decompose(W.position,W.quaternion,W.scale),W.translateX(gt),W.translateZ(At),W.matrixWorld.compose(W.position,W.quaternion,W.scale),W.matrixWorldInverse.copy(W.matrixWorld).invert(),Pt[10]===-1)W.projectionMatrix.copy(tt.projectionMatrix),W.projectionMatrixInverse.copy(tt.projectionMatrixInverse);else{const E=Nt+At,_=zt+At,I=j-gt,X=at+(ct-gt),Y=q*zt/_*E,$=w*zt/_*E;W.projectionMatrix.makePerspective(I,X,Y,$,E,_),W.projectionMatrixInverse.copy(W.projectionMatrix).invert()}}function ut(W,tt){tt===null?W.matrixWorld.copy(W.matrix):W.matrixWorld.multiplyMatrices(tt.matrixWorld,W.matrix),W.matrixWorldInverse.copy(W.matrixWorld).invert()}this.updateCamera=function(W){if(s===null)return;let tt=W.near,Mt=W.far;x.texture!==null&&(x.depthNear>0&&(tt=x.depthNear),x.depthFar>0&&(Mt=x.depthFar)),v.near=U.near=A.near=tt,v.far=U.far=A.far=Mt,(S!==v.near||H!==v.far)&&(s.updateRenderState({depthNear:v.near,depthFar:v.far}),S=v.near,H=v.far);const ct=W.parent,Pt=v.cameras;ut(v,ct);for(let Ct=0;Ct<Pt.length;Ct++)ut(Pt[Ct],ct);Pt.length===2?G(v,A,U):v.projectionMatrix.copy(A.projectionMatrix),pt(W,v,ct)};function pt(W,tt,Mt){Mt===null?W.matrix.copy(tt.matrixWorld):(W.matrix.copy(Mt.matrixWorld),W.matrix.invert(),W.matrix.multiply(tt.matrixWorld)),W.matrix.decompose(W.position,W.quaternion,W.scale),W.updateMatrixWorld(!0),W.projectionMatrix.copy(tt.projectionMatrix),W.projectionMatrixInverse.copy(tt.projectionMatrixInverse),W.isPerspectiveCamera&&(W.fov=Ki*2*Math.atan(1/W.projectionMatrix.elements[5]),W.zoom=1)}this.getCamera=function(){return v},this.getFoveation=function(){if(!(u===null&&f===null))return l},this.setFoveation=function(W){l=W,u!==null&&(u.fixedFoveation=W),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=W)},this.hasDepthSensing=function(){return x.texture!==null},this.getDepthSensingMesh=function(){return x.getMesh(v)};let mt=null;function kt(W,tt){if(h=tt.getViewerPose(c||a),g=tt,h!==null){const Mt=h.views;f!==null&&(t.setRenderTargetFramebuffer(T,f.framebuffer),t.setRenderTarget(T));let ct=!1;Mt.length!==v.cameras.length&&(v.cameras.length=0,ct=!0);for(let Ct=0;Ct<Mt.length;Ct++){const Nt=Mt[Ct];let zt=null;if(f!==null)zt=f.getViewport(Nt);else{const w=d.getViewSubImage(u,Nt);zt=w.viewport,Ct===0&&(t.setRenderTargetTextures(T,w.colorTexture,u.ignoreDepthValues?void 0:w.depthStencilTexture),t.setRenderTarget(T))}let q=Z[Ct];q===void 0&&(q=new Ce,q.layers.enable(Ct),q.viewport=new Jt,Z[Ct]=q),q.matrix.fromArray(Nt.transform.matrix),q.matrix.decompose(q.position,q.quaternion,q.scale),q.projectionMatrix.fromArray(Nt.projectionMatrix),q.projectionMatrixInverse.copy(q.projectionMatrix).invert(),q.viewport.set(zt.x,zt.y,zt.width,zt.height),Ct===0&&(v.matrix.copy(q.matrix),v.matrix.decompose(v.position,v.quaternion,v.scale)),ct===!0&&v.cameras.push(q)}const Pt=s.enabledFeatures;if(Pt&&Pt.includes("depth-sensing")){const Ct=d.getDepthInformation(Mt[0]);Ct&&Ct.isValid&&Ct.texture&&x.init(t,Ct,s.renderState)}}for(let Mt=0;Mt<y.length;Mt++){const ct=b[Mt],Pt=y[Mt];ct!==null&&Pt!==void 0&&Pt.update(ct,tt,c||a)}mt&&mt(W,tt),tt.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:tt}),g=null}const Xt=new Pc;Xt.setAnimationLoop(kt),this.setAnimationLoop=function(W){mt=W},this.dispose=function(){}}}const Bn=new Ve,Ng=new Qt;function Fg(i,t){function e(p,m){p.matrixAutoUpdate===!0&&p.updateMatrix(),m.value.copy(p.matrix)}function n(p,m){m.color.getRGB(p.fogColor.value,Ac(i)),m.isFog?(p.fogNear.value=m.near,p.fogFar.value=m.far):m.isFogExp2&&(p.fogDensity.value=m.density)}function s(p,m,T,y,b){m.isMeshBasicMaterial||m.isMeshLambertMaterial?r(p,m):m.isMeshToonMaterial?(r(p,m),d(p,m)):m.isMeshPhongMaterial?(r(p,m),h(p,m)):m.isMeshStandardMaterial?(r(p,m),u(p,m),m.isMeshPhysicalMaterial&&f(p,m,b)):m.isMeshMatcapMaterial?(r(p,m),g(p,m)):m.isMeshDepthMaterial?r(p,m):m.isMeshDistanceMaterial?(r(p,m),x(p,m)):m.isMeshNormalMaterial?r(p,m):m.isLineBasicMaterial?(a(p,m),m.isLineDashedMaterial&&o(p,m)):m.isPointsMaterial?l(p,m,T,y):m.isSpriteMaterial?c(p,m):m.isShadowMaterial?(p.color.value.copy(m.color),p.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function r(p,m){p.opacity.value=m.opacity,m.color&&p.diffuse.value.copy(m.color),m.emissive&&p.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(p.map.value=m.map,e(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,e(m.alphaMap,p.alphaMapTransform)),m.bumpMap&&(p.bumpMap.value=m.bumpMap,e(m.bumpMap,p.bumpMapTransform),p.bumpScale.value=m.bumpScale,m.side===xe&&(p.bumpScale.value*=-1)),m.normalMap&&(p.normalMap.value=m.normalMap,e(m.normalMap,p.normalMapTransform),p.normalScale.value.copy(m.normalScale),m.side===xe&&p.normalScale.value.negate()),m.displacementMap&&(p.displacementMap.value=m.displacementMap,e(m.displacementMap,p.displacementMapTransform),p.displacementScale.value=m.displacementScale,p.displacementBias.value=m.displacementBias),m.emissiveMap&&(p.emissiveMap.value=m.emissiveMap,e(m.emissiveMap,p.emissiveMapTransform)),m.specularMap&&(p.specularMap.value=m.specularMap,e(m.specularMap,p.specularMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest);const T=t.get(m),y=T.envMap,b=T.envMapRotation;y&&(p.envMap.value=y,Bn.copy(b),Bn.x*=-1,Bn.y*=-1,Bn.z*=-1,y.isCubeTexture&&y.isRenderTargetTexture===!1&&(Bn.y*=-1,Bn.z*=-1),p.envMapRotation.value.setFromMatrix4(Ng.makeRotationFromEuler(Bn)),p.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=m.reflectivity,p.ior.value=m.ior,p.refractionRatio.value=m.refractionRatio),m.lightMap&&(p.lightMap.value=m.lightMap,p.lightMapIntensity.value=m.lightMapIntensity,e(m.lightMap,p.lightMapTransform)),m.aoMap&&(p.aoMap.value=m.aoMap,p.aoMapIntensity.value=m.aoMapIntensity,e(m.aoMap,p.aoMapTransform))}function a(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,m.map&&(p.map.value=m.map,e(m.map,p.mapTransform))}function o(p,m){p.dashSize.value=m.dashSize,p.totalSize.value=m.dashSize+m.gapSize,p.scale.value=m.scale}function l(p,m,T,y){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.size.value=m.size*T,p.scale.value=y*.5,m.map&&(p.map.value=m.map,e(m.map,p.uvTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,e(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function c(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.rotation.value=m.rotation,m.map&&(p.map.value=m.map,e(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,e(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function h(p,m){p.specular.value.copy(m.specular),p.shininess.value=Math.max(m.shininess,1e-4)}function d(p,m){m.gradientMap&&(p.gradientMap.value=m.gradientMap)}function u(p,m){p.metalness.value=m.metalness,m.metalnessMap&&(p.metalnessMap.value=m.metalnessMap,e(m.metalnessMap,p.metalnessMapTransform)),p.roughness.value=m.roughness,m.roughnessMap&&(p.roughnessMap.value=m.roughnessMap,e(m.roughnessMap,p.roughnessMapTransform)),m.envMap&&(p.envMapIntensity.value=m.envMapIntensity)}function f(p,m,T){p.ior.value=m.ior,m.sheen>0&&(p.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),p.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(p.sheenColorMap.value=m.sheenColorMap,e(m.sheenColorMap,p.sheenColorMapTransform)),m.sheenRoughnessMap&&(p.sheenRoughnessMap.value=m.sheenRoughnessMap,e(m.sheenRoughnessMap,p.sheenRoughnessMapTransform))),m.clearcoat>0&&(p.clearcoat.value=m.clearcoat,p.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(p.clearcoatMap.value=m.clearcoatMap,e(m.clearcoatMap,p.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,e(m.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(p.clearcoatNormalMap.value=m.clearcoatNormalMap,e(m.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===xe&&p.clearcoatNormalScale.value.negate())),m.dispersion>0&&(p.dispersion.value=m.dispersion),m.iridescence>0&&(p.iridescence.value=m.iridescence,p.iridescenceIOR.value=m.iridescenceIOR,p.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(p.iridescenceMap.value=m.iridescenceMap,e(m.iridescenceMap,p.iridescenceMapTransform)),m.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=m.iridescenceThicknessMap,e(m.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),m.transmission>0&&(p.transmission.value=m.transmission,p.transmissionSamplerMap.value=T.texture,p.transmissionSamplerSize.value.set(T.width,T.height),m.transmissionMap&&(p.transmissionMap.value=m.transmissionMap,e(m.transmissionMap,p.transmissionMapTransform)),p.thickness.value=m.thickness,m.thicknessMap&&(p.thicknessMap.value=m.thicknessMap,e(m.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=m.attenuationDistance,p.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(p.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(p.anisotropyMap.value=m.anisotropyMap,e(m.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=m.specularIntensity,p.specularColor.value.copy(m.specularColor),m.specularColorMap&&(p.specularColorMap.value=m.specularColorMap,e(m.specularColorMap,p.specularColorMapTransform)),m.specularIntensityMap&&(p.specularIntensityMap.value=m.specularIntensityMap,e(m.specularIntensityMap,p.specularIntensityMapTransform))}function g(p,m){m.matcap&&(p.matcap.value=m.matcap)}function x(p,m){const T=t.get(m).light;p.referencePosition.value.setFromMatrixPosition(T.matrixWorld),p.nearDistance.value=T.shadow.camera.near,p.farDistance.value=T.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function Og(i,t,e,n){let s={},r={},a=[];const o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(T,y){const b=y.program;n.uniformBlockBinding(T,b)}function c(T,y){let b=s[T.id];b===void 0&&(g(T),b=h(T),s[T.id]=b,T.addEventListener("dispose",p));const N=y.program;n.updateUBOMapping(T,N);const C=t.render.frame;r[T.id]!==C&&(u(T),r[T.id]=C)}function h(T){const y=d();T.__bindingPointIndex=y;const b=i.createBuffer(),N=T.__size,C=T.usage;return i.bindBuffer(i.UNIFORM_BUFFER,b),i.bufferData(i.UNIFORM_BUFFER,N,C),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,y,b),b}function d(){for(let T=0;T<o;T++)if(a.indexOf(T)===-1)return a.push(T),T;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(T){const y=s[T.id],b=T.uniforms,N=T.__cache;i.bindBuffer(i.UNIFORM_BUFFER,y);for(let C=0,A=b.length;C<A;C++){const U=Array.isArray(b[C])?b[C]:[b[C]];for(let Z=0,v=U.length;Z<v;Z++){const S=U[Z];if(f(S,C,Z,N)===!0){const H=S.__offset,B=Array.isArray(S.value)?S.value:[S.value];let k=0;for(let J=0;J<B.length;J++){const O=B[J],Q=x(O);typeof O=="number"||typeof O=="boolean"?(S.__data[0]=O,i.bufferSubData(i.UNIFORM_BUFFER,H+k,S.__data)):O.isMatrix3?(S.__data[0]=O.elements[0],S.__data[1]=O.elements[1],S.__data[2]=O.elements[2],S.__data[3]=0,S.__data[4]=O.elements[3],S.__data[5]=O.elements[4],S.__data[6]=O.elements[5],S.__data[7]=0,S.__data[8]=O.elements[6],S.__data[9]=O.elements[7],S.__data[10]=O.elements[8],S.__data[11]=0):(O.toArray(S.__data,k),k+=Q.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,H,S.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function f(T,y,b,N){const C=T.value,A=y+"_"+b;if(N[A]===void 0)return typeof C=="number"||typeof C=="boolean"?N[A]=C:N[A]=C.clone(),!0;{const U=N[A];if(typeof C=="number"||typeof C=="boolean"){if(U!==C)return N[A]=C,!0}else if(U.equals(C)===!1)return U.copy(C),!0}return!1}function g(T){const y=T.uniforms;let b=0;const N=16;for(let A=0,U=y.length;A<U;A++){const Z=Array.isArray(y[A])?y[A]:[y[A]];for(let v=0,S=Z.length;v<S;v++){const H=Z[v],B=Array.isArray(H.value)?H.value:[H.value];for(let k=0,J=B.length;k<J;k++){const O=B[k],Q=x(O),G=b%N,ut=G%Q.boundary,pt=G+ut;b+=ut,pt!==0&&N-pt<Q.storage&&(b+=N-pt),H.__data=new Float32Array(Q.storage/Float32Array.BYTES_PER_ELEMENT),H.__offset=b,b+=Q.storage}}}const C=b%N;return C>0&&(b+=N-C),T.__size=b,T.__cache={},this}function x(T){const y={boundary:0,storage:0};return typeof T=="number"||typeof T=="boolean"?(y.boundary=4,y.storage=4):T.isVector2?(y.boundary=8,y.storage=8):T.isVector3||T.isColor?(y.boundary=16,y.storage=12):T.isVector4?(y.boundary=16,y.storage=16):T.isMatrix3?(y.boundary=48,y.storage=48):T.isMatrix4?(y.boundary=64,y.storage=64):T.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",T),y}function p(T){const y=T.target;y.removeEventListener("dispose",p);const b=a.indexOf(y.__bindingPointIndex);a.splice(b,1),i.deleteBuffer(s[y.id]),delete s[y.id],delete r[y.id]}function m(){for(const T in s)i.deleteBuffer(s[T]);a=[],s={},r={}}return{bind:l,update:c,dispose:m}}class Bg{constructor(t={}){const{canvas:e=Eu(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1}=t;this.isWebGLRenderer=!0;let u;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");u=n.getContextAttributes().alpha}else u=a;const f=new Uint32Array(4),g=new Int32Array(4);let x=null,p=null;const m=[],T=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Re,this.toneMapping=Rn,this.toneMappingExposure=1;const y=this;let b=!1,N=0,C=0,A=null,U=-1,Z=null;const v=new Jt,S=new Jt;let H=null;const B=new Ht(0);let k=0,J=e.width,O=e.height,Q=1,G=null,ut=null;const pt=new Jt(0,0,J,O),mt=new Jt(0,0,J,O);let kt=!1;const Xt=new lo;let W=!1,tt=!1;const Mt=new Qt,ct=new Qt,Pt=new R,Ct=new Jt,Nt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let zt=!1;function q(){return A===null?Q:1}let w=n;function rt(M,L){return e.getContext(M,L)}try{const M={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Ja}`),e.addEventListener("webglcontextlost",K,!1),e.addEventListener("webglcontextrestored",dt,!1),e.addEventListener("webglcontextcreationerror",_t,!1),w===null){const L="webgl2";if(w=rt(L,M),w===null)throw rt(L)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(M){throw console.error("THREE.WebGLRenderer: "+M.message),M}let st,j,at,At,gt,E,_,I,X,Y,$,Et,ot,xt,Vt,et,yt,Ut,It,St,Gt,Ft,te,P;function vt(){st=new Gp(w),st.init(),Ft=new Rg(w,st),j=new Op(w,st,t,Ft),at=new wg(w),j.reverseDepthBuffer&&at.buffers.depth.setReversed(!0),At=new $p(w),gt=new hg,E=new Ag(w,st,at,gt,j,Ft,At),_=new zp(y),I=new Vp(y),X=new ju(w),te=new Np(w,X),Y=new Wp(w,X,At,te),$=new Yp(w,Y,X,At),It=new qp(w,j,E),et=new Bp(gt),Et=new cg(y,_,I,st,j,te,et),ot=new Fg(y,gt),xt=new dg,Vt=new _g(st),Ut=new Ip(y,_,I,at,$,u,l),yt=new bg(y,$,j),P=new Og(w,At,j,at),St=new Fp(w,st,At),Gt=new Xp(w,st,At),At.programs=Et.programs,y.capabilities=j,y.extensions=st,y.properties=gt,y.renderLists=xt,y.shadowMap=yt,y.state=at,y.info=At}vt();const V=new Ig(y,w);this.xr=V,this.getContext=function(){return w},this.getContextAttributes=function(){return w.getContextAttributes()},this.forceContextLoss=function(){const M=st.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){const M=st.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return Q},this.setPixelRatio=function(M){M!==void 0&&(Q=M,this.setSize(J,O,!1))},this.getSize=function(M){return M.set(J,O)},this.setSize=function(M,L,F=!0){if(V.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}J=M,O=L,e.width=Math.floor(M*Q),e.height=Math.floor(L*Q),F===!0&&(e.style.width=M+"px",e.style.height=L+"px"),this.setViewport(0,0,M,L)},this.getDrawingBufferSize=function(M){return M.set(J*Q,O*Q).floor()},this.setDrawingBufferSize=function(M,L,F){J=M,O=L,Q=F,e.width=Math.floor(M*F),e.height=Math.floor(L*F),this.setViewport(0,0,M,L)},this.getCurrentViewport=function(M){return M.copy(v)},this.getViewport=function(M){return M.copy(pt)},this.setViewport=function(M,L,F,z){M.isVector4?pt.set(M.x,M.y,M.z,M.w):pt.set(M,L,F,z),at.viewport(v.copy(pt).multiplyScalar(Q).round())},this.getScissor=function(M){return M.copy(mt)},this.setScissor=function(M,L,F,z){M.isVector4?mt.set(M.x,M.y,M.z,M.w):mt.set(M,L,F,z),at.scissor(S.copy(mt).multiplyScalar(Q).round())},this.getScissorTest=function(){return kt},this.setScissorTest=function(M){at.setScissorTest(kt=M)},this.setOpaqueSort=function(M){G=M},this.setTransparentSort=function(M){ut=M},this.getClearColor=function(M){return M.copy(Ut.getClearColor())},this.setClearColor=function(){Ut.setClearColor.apply(Ut,arguments)},this.getClearAlpha=function(){return Ut.getClearAlpha()},this.setClearAlpha=function(){Ut.setClearAlpha.apply(Ut,arguments)},this.clear=function(M=!0,L=!0,F=!0){let z=0;if(M){let D=!1;if(A!==null){const nt=A.texture.format;D=nt===io||nt===no||nt===eo}if(D){const nt=A.texture.type,ft=nt===dn||nt===qn||nt===Yi||nt===Ai||nt===Qa||nt===to,bt=Ut.getClearColor(),wt=Ut.getClearAlpha(),Lt=bt.r,Dt=bt.g,Tt=bt.b;ft?(f[0]=Lt,f[1]=Dt,f[2]=Tt,f[3]=wt,w.clearBufferuiv(w.COLOR,0,f)):(g[0]=Lt,g[1]=Dt,g[2]=Tt,g[3]=wt,w.clearBufferiv(w.COLOR,0,g))}else z|=w.COLOR_BUFFER_BIT}L&&(z|=w.DEPTH_BUFFER_BIT,w.clearDepth(this.capabilities.reverseDepthBuffer?0:1)),F&&(z|=w.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),w.clear(z)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",K,!1),e.removeEventListener("webglcontextrestored",dt,!1),e.removeEventListener("webglcontextcreationerror",_t,!1),xt.dispose(),Vt.dispose(),gt.dispose(),_.dispose(),I.dispose(),$.dispose(),te.dispose(),P.dispose(),Et.dispose(),V.dispose(),V.removeEventListener("sessionstart",wo),V.removeEventListener("sessionend",To),Dn.stop()};function K(M){M.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),b=!0}function dt(){console.log("THREE.WebGLRenderer: Context Restored."),b=!1;const M=At.autoReset,L=yt.enabled,F=yt.autoUpdate,z=yt.needsUpdate,D=yt.type;vt(),At.autoReset=M,yt.enabled=L,yt.autoUpdate=F,yt.needsUpdate=z,yt.type=D}function _t(M){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function Wt(M){const L=M.target;L.removeEventListener("dispose",Wt),ae(L)}function ae(M){Me(M),gt.remove(M)}function Me(M){const L=gt.get(M).programs;L!==void 0&&(L.forEach(function(F){Et.releaseProgram(F)}),M.isShaderMaterial&&Et.releaseShaderCache(M))}this.renderBufferDirect=function(M,L,F,z,D,nt){L===null&&(L=Nt);const ft=D.isMesh&&D.matrixWorld.determinant()<0,bt=ih(M,L,F,z,D);at.setMaterial(z,ft);let wt=F.index,Lt=1;if(z.wireframe===!0){if(wt=Y.getWireframeAttribute(F),wt===void 0)return;Lt=2}const Dt=F.drawRange,Tt=F.attributes.position;let Zt=Dt.start*Lt,ee=(Dt.start+Dt.count)*Lt;nt!==null&&(Zt=Math.max(Zt,nt.start*Lt),ee=Math.min(ee,(nt.start+nt.count)*Lt)),wt!==null?(Zt=Math.max(Zt,0),ee=Math.min(ee,wt.count)):Tt!=null&&(Zt=Math.max(Zt,0),ee=Math.min(ee,Tt.count));const se=ee-Zt;if(se<0||se===1/0)return;te.setup(D,z,bt,F,wt);let be,qt=St;if(wt!==null&&(be=X.get(wt),qt=Gt,qt.setIndex(be)),D.isMesh)z.wireframe===!0?(at.setLineWidth(z.wireframeLinewidth*q()),qt.setMode(w.LINES)):qt.setMode(w.TRIANGLES);else if(D.isLine){let Rt=z.linewidth;Rt===void 0&&(Rt=1),at.setLineWidth(Rt*q()),D.isLineSegments?qt.setMode(w.LINES):D.isLineLoop?qt.setMode(w.LINE_LOOP):qt.setMode(w.LINE_STRIP)}else D.isPoints?qt.setMode(w.POINTS):D.isSprite&&qt.setMode(w.TRIANGLES);if(D.isBatchedMesh)if(D._multiDrawInstances!==null)qt.renderMultiDrawInstances(D._multiDrawStarts,D._multiDrawCounts,D._multiDrawCount,D._multiDrawInstances);else if(st.get("WEBGL_multi_draw"))qt.renderMultiDraw(D._multiDrawStarts,D._multiDrawCounts,D._multiDrawCount);else{const Rt=D._multiDrawStarts,de=D._multiDrawCounts,Yt=D._multiDrawCount,Ne=wt?X.get(wt).bytesPerElement:1,jn=gt.get(z).currentProgram.getUniforms();for(let Ee=0;Ee<Yt;Ee++)jn.setValue(w,"_gl_DrawID",Ee),qt.render(Rt[Ee]/Ne,de[Ee])}else if(D.isInstancedMesh)qt.renderInstances(Zt,se,D.count);else if(F.isInstancedBufferGeometry){const Rt=F._maxInstanceCount!==void 0?F._maxInstanceCount:1/0,de=Math.min(F.instanceCount,Rt);qt.renderInstances(Zt,se,de)}else qt.render(Zt,se)};function $t(M,L,F){M.transparent===!0&&M.side===sn&&M.forceSinglePass===!1?(M.side=xe,M.needsUpdate=!0,ss(M,L,F),M.side=Cn,M.needsUpdate=!0,ss(M,L,F),M.side=sn):ss(M,L,F)}this.compile=function(M,L,F=null){F===null&&(F=M),p=Vt.get(F),p.init(L),T.push(p),F.traverseVisible(function(D){D.isLight&&D.layers.test(L.layers)&&(p.pushLight(D),D.castShadow&&p.pushShadow(D))}),M!==F&&M.traverseVisible(function(D){D.isLight&&D.layers.test(L.layers)&&(p.pushLight(D),D.castShadow&&p.pushShadow(D))}),p.setupLights();const z=new Set;return M.traverse(function(D){if(!(D.isMesh||D.isPoints||D.isLine||D.isSprite))return;const nt=D.material;if(nt)if(Array.isArray(nt))for(let ft=0;ft<nt.length;ft++){const bt=nt[ft];$t(bt,F,D),z.add(bt)}else $t(nt,F,D),z.add(nt)}),T.pop(),p=null,z},this.compileAsync=function(M,L,F=null){const z=this.compile(M,L,F);return new Promise(D=>{function nt(){if(z.forEach(function(ft){gt.get(ft).currentProgram.isReady()&&z.delete(ft)}),z.size===0){D(M);return}setTimeout(nt,10)}st.get("KHR_parallel_shader_compile")!==null?nt():setTimeout(nt,10)})};let Se=null;function Ze(M){Se&&Se(M)}function wo(){Dn.stop()}function To(){Dn.start()}const Dn=new Pc;Dn.setAnimationLoop(Ze),typeof self<"u"&&Dn.setContext(self),this.setAnimationLoop=function(M){Se=M,V.setAnimationLoop(M),M===null?Dn.stop():Dn.start()},V.addEventListener("sessionstart",wo),V.addEventListener("sessionend",To),this.render=function(M,L){if(L!==void 0&&L.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(b===!0)return;if(M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),L.parent===null&&L.matrixWorldAutoUpdate===!0&&L.updateMatrixWorld(),V.enabled===!0&&V.isPresenting===!0&&(V.cameraAutoUpdate===!0&&V.updateCamera(L),L=V.getCamera()),M.isScene===!0&&M.onBeforeRender(y,M,L,A),p=Vt.get(M,T.length),p.init(L),T.push(p),ct.multiplyMatrices(L.projectionMatrix,L.matrixWorldInverse),Xt.setFromProjectionMatrix(ct),tt=this.localClippingEnabled,W=et.init(this.clippingPlanes,tt),x=xt.get(M,m.length),x.init(),m.push(x),V.enabled===!0&&V.isPresenting===!0){const nt=y.xr.getDepthSensingMesh();nt!==null&&ar(nt,L,-1/0,y.sortObjects)}ar(M,L,0,y.sortObjects),x.finish(),y.sortObjects===!0&&x.sort(G,ut),zt=V.enabled===!1||V.isPresenting===!1||V.hasDepthSensing()===!1,zt&&Ut.addToRenderList(x,M),this.info.render.frame++,W===!0&&et.beginShadows();const F=p.state.shadowsArray;yt.render(F,M,L),W===!0&&et.endShadows(),this.info.autoReset===!0&&this.info.reset();const z=x.opaque,D=x.transmissive;if(p.setupLights(),L.isArrayCamera){const nt=L.cameras;if(D.length>0)for(let ft=0,bt=nt.length;ft<bt;ft++){const wt=nt[ft];Ro(z,D,M,wt)}zt&&Ut.render(M);for(let ft=0,bt=nt.length;ft<bt;ft++){const wt=nt[ft];Ao(x,M,wt,wt.viewport)}}else D.length>0&&Ro(z,D,M,L),zt&&Ut.render(M),Ao(x,M,L);A!==null&&(E.updateMultisampleRenderTarget(A),E.updateRenderTargetMipmap(A)),M.isScene===!0&&M.onAfterRender(y,M,L),te.resetDefaultState(),U=-1,Z=null,T.pop(),T.length>0?(p=T[T.length-1],W===!0&&et.setGlobalState(y.clippingPlanes,p.state.camera)):p=null,m.pop(),m.length>0?x=m[m.length-1]:x=null};function ar(M,L,F,z){if(M.visible===!1)return;if(M.layers.test(L.layers)){if(M.isGroup)F=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(L);else if(M.isLight)p.pushLight(M),M.castShadow&&p.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||Xt.intersectsSprite(M)){z&&Ct.setFromMatrixPosition(M.matrixWorld).applyMatrix4(ct);const ft=$.update(M),bt=M.material;bt.visible&&x.push(M,ft,bt,F,Ct.z,null)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||Xt.intersectsObject(M))){const ft=$.update(M),bt=M.material;if(z&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),Ct.copy(M.boundingSphere.center)):(ft.boundingSphere===null&&ft.computeBoundingSphere(),Ct.copy(ft.boundingSphere.center)),Ct.applyMatrix4(M.matrixWorld).applyMatrix4(ct)),Array.isArray(bt)){const wt=ft.groups;for(let Lt=0,Dt=wt.length;Lt<Dt;Lt++){const Tt=wt[Lt],Zt=bt[Tt.materialIndex];Zt&&Zt.visible&&x.push(M,ft,Zt,F,Ct.z,Tt)}}else bt.visible&&x.push(M,ft,bt,F,Ct.z,null)}}const nt=M.children;for(let ft=0,bt=nt.length;ft<bt;ft++)ar(nt[ft],L,F,z)}function Ao(M,L,F,z){const D=M.opaque,nt=M.transmissive,ft=M.transparent;p.setupLightsView(F),W===!0&&et.setGlobalState(y.clippingPlanes,F),z&&at.viewport(v.copy(z)),D.length>0&&is(D,L,F),nt.length>0&&is(nt,L,F),ft.length>0&&is(ft,L,F),at.buffers.depth.setTest(!0),at.buffers.depth.setMask(!0),at.buffers.color.setMask(!0),at.setPolygonOffset(!1)}function Ro(M,L,F,z){if((F.isScene===!0?F.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[z.id]===void 0&&(p.state.transmissionRenderTarget[z.id]=new Yn(1,1,{generateMipmaps:!0,type:st.has("EXT_color_buffer_half_float")||st.has("EXT_color_buffer_float")?Qi:dn,minFilter:Wn,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Kt.workingColorSpace}));const nt=p.state.transmissionRenderTarget[z.id],ft=z.viewport||v;nt.setSize(ft.z,ft.w);const bt=y.getRenderTarget();y.setRenderTarget(nt),y.getClearColor(B),k=y.getClearAlpha(),k<1&&y.setClearColor(16777215,.5),y.clear(),zt&&Ut.render(F);const wt=y.toneMapping;y.toneMapping=Rn;const Lt=z.viewport;if(z.viewport!==void 0&&(z.viewport=void 0),p.setupLightsView(z),W===!0&&et.setGlobalState(y.clippingPlanes,z),is(M,F,z),E.updateMultisampleRenderTarget(nt),E.updateRenderTargetMipmap(nt),st.has("WEBGL_multisampled_render_to_texture")===!1){let Dt=!1;for(let Tt=0,Zt=L.length;Tt<Zt;Tt++){const ee=L[Tt],se=ee.object,be=ee.geometry,qt=ee.material,Rt=ee.group;if(qt.side===sn&&se.layers.test(z.layers)){const de=qt.side;qt.side=xe,qt.needsUpdate=!0,Co(se,F,z,be,qt,Rt),qt.side=de,qt.needsUpdate=!0,Dt=!0}}Dt===!0&&(E.updateMultisampleRenderTarget(nt),E.updateRenderTargetMipmap(nt))}y.setRenderTarget(bt),y.setClearColor(B,k),Lt!==void 0&&(z.viewport=Lt),y.toneMapping=wt}function is(M,L,F){const z=L.isScene===!0?L.overrideMaterial:null;for(let D=0,nt=M.length;D<nt;D++){const ft=M[D],bt=ft.object,wt=ft.geometry,Lt=z===null?ft.material:z,Dt=ft.group;bt.layers.test(F.layers)&&Co(bt,L,F,wt,Lt,Dt)}}function Co(M,L,F,z,D,nt){M.onBeforeRender(y,L,F,z,D,nt),M.modelViewMatrix.multiplyMatrices(F.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),D.onBeforeRender(y,L,F,z,M,nt),D.transparent===!0&&D.side===sn&&D.forceSinglePass===!1?(D.side=xe,D.needsUpdate=!0,y.renderBufferDirect(F,L,z,D,M,nt),D.side=Cn,D.needsUpdate=!0,y.renderBufferDirect(F,L,z,D,M,nt),D.side=sn):y.renderBufferDirect(F,L,z,D,M,nt),M.onAfterRender(y,L,F,z,D,nt)}function ss(M,L,F){L.isScene!==!0&&(L=Nt);const z=gt.get(M),D=p.state.lights,nt=p.state.shadowsArray,ft=D.state.version,bt=Et.getParameters(M,D.state,nt,L,F),wt=Et.getProgramCacheKey(bt);let Lt=z.programs;z.environment=M.isMeshStandardMaterial?L.environment:null,z.fog=L.fog,z.envMap=(M.isMeshStandardMaterial?I:_).get(M.envMap||z.environment),z.envMapRotation=z.environment!==null&&M.envMap===null?L.environmentRotation:M.envMapRotation,Lt===void 0&&(M.addEventListener("dispose",Wt),Lt=new Map,z.programs=Lt);let Dt=Lt.get(wt);if(Dt!==void 0){if(z.currentProgram===Dt&&z.lightsStateVersion===ft)return Lo(M,bt),Dt}else bt.uniforms=Et.getUniforms(M),M.onBeforeCompile(bt,y),Dt=Et.acquireProgram(bt,wt),Lt.set(wt,Dt),z.uniforms=bt.uniforms;const Tt=z.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(Tt.clippingPlanes=et.uniform),Lo(M,bt),z.needsLights=rh(M),z.lightsStateVersion=ft,z.needsLights&&(Tt.ambientLightColor.value=D.state.ambient,Tt.lightProbe.value=D.state.probe,Tt.directionalLights.value=D.state.directional,Tt.directionalLightShadows.value=D.state.directionalShadow,Tt.spotLights.value=D.state.spot,Tt.spotLightShadows.value=D.state.spotShadow,Tt.rectAreaLights.value=D.state.rectArea,Tt.ltc_1.value=D.state.rectAreaLTC1,Tt.ltc_2.value=D.state.rectAreaLTC2,Tt.pointLights.value=D.state.point,Tt.pointLightShadows.value=D.state.pointShadow,Tt.hemisphereLights.value=D.state.hemi,Tt.directionalShadowMap.value=D.state.directionalShadowMap,Tt.directionalShadowMatrix.value=D.state.directionalShadowMatrix,Tt.spotShadowMap.value=D.state.spotShadowMap,Tt.spotLightMatrix.value=D.state.spotLightMatrix,Tt.spotLightMap.value=D.state.spotLightMap,Tt.pointShadowMap.value=D.state.pointShadowMap,Tt.pointShadowMatrix.value=D.state.pointShadowMatrix),z.currentProgram=Dt,z.uniformsList=null,Dt}function Po(M){if(M.uniformsList===null){const L=M.currentProgram.getUniforms();M.uniformsList=ks.seqWithValue(L.seq,M.uniforms)}return M.uniformsList}function Lo(M,L){const F=gt.get(M);F.outputColorSpace=L.outputColorSpace,F.batching=L.batching,F.batchingColor=L.batchingColor,F.instancing=L.instancing,F.instancingColor=L.instancingColor,F.instancingMorph=L.instancingMorph,F.skinning=L.skinning,F.morphTargets=L.morphTargets,F.morphNormals=L.morphNormals,F.morphColors=L.morphColors,F.morphTargetsCount=L.morphTargetsCount,F.numClippingPlanes=L.numClippingPlanes,F.numIntersection=L.numClipIntersection,F.vertexAlphas=L.vertexAlphas,F.vertexTangents=L.vertexTangents,F.toneMapping=L.toneMapping}function ih(M,L,F,z,D){L.isScene!==!0&&(L=Nt),E.resetTextureUnits();const nt=L.fog,ft=z.isMeshStandardMaterial?L.environment:null,bt=A===null?y.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:Ln,wt=(z.isMeshStandardMaterial?I:_).get(z.envMap||ft),Lt=z.vertexColors===!0&&!!F.attributes.color&&F.attributes.color.itemSize===4,Dt=!!F.attributes.tangent&&(!!z.normalMap||z.anisotropy>0),Tt=!!F.morphAttributes.position,Zt=!!F.morphAttributes.normal,ee=!!F.morphAttributes.color;let se=Rn;z.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&(se=y.toneMapping);const be=F.morphAttributes.position||F.morphAttributes.normal||F.morphAttributes.color,qt=be!==void 0?be.length:0,Rt=gt.get(z),de=p.state.lights;if(W===!0&&(tt===!0||M!==Z)){const Le=M===Z&&z.id===U;et.setState(z,M,Le)}let Yt=!1;z.version===Rt.__version?(Rt.needsLights&&Rt.lightsStateVersion!==de.state.version||Rt.outputColorSpace!==bt||D.isBatchedMesh&&Rt.batching===!1||!D.isBatchedMesh&&Rt.batching===!0||D.isBatchedMesh&&Rt.batchingColor===!0&&D.colorTexture===null||D.isBatchedMesh&&Rt.batchingColor===!1&&D.colorTexture!==null||D.isInstancedMesh&&Rt.instancing===!1||!D.isInstancedMesh&&Rt.instancing===!0||D.isSkinnedMesh&&Rt.skinning===!1||!D.isSkinnedMesh&&Rt.skinning===!0||D.isInstancedMesh&&Rt.instancingColor===!0&&D.instanceColor===null||D.isInstancedMesh&&Rt.instancingColor===!1&&D.instanceColor!==null||D.isInstancedMesh&&Rt.instancingMorph===!0&&D.morphTexture===null||D.isInstancedMesh&&Rt.instancingMorph===!1&&D.morphTexture!==null||Rt.envMap!==wt||z.fog===!0&&Rt.fog!==nt||Rt.numClippingPlanes!==void 0&&(Rt.numClippingPlanes!==et.numPlanes||Rt.numIntersection!==et.numIntersection)||Rt.vertexAlphas!==Lt||Rt.vertexTangents!==Dt||Rt.morphTargets!==Tt||Rt.morphNormals!==Zt||Rt.morphColors!==ee||Rt.toneMapping!==se||Rt.morphTargetsCount!==qt)&&(Yt=!0):(Yt=!0,Rt.__version=z.version);let Ne=Rt.currentProgram;Yt===!0&&(Ne=ss(z,L,D));let jn=!1,Ee=!1,or=!1;const re=Ne.getUniforms(),fn=Rt.uniforms;if(at.useProgram(Ne.program)&&(jn=!0,Ee=!0,or=!0),z.id!==U&&(U=z.id,Ee=!0),jn||Z!==M){j.reverseDepthBuffer?(Mt.copy(M.projectionMatrix),Tu(Mt),Au(Mt),re.setValue(w,"projectionMatrix",Mt)):re.setValue(w,"projectionMatrix",M.projectionMatrix),re.setValue(w,"viewMatrix",M.matrixWorldInverse);const Le=re.map.cameraPosition;Le!==void 0&&Le.setValue(w,Pt.setFromMatrixPosition(M.matrixWorld)),j.logarithmicDepthBuffer&&re.setValue(w,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(z.isMeshPhongMaterial||z.isMeshToonMaterial||z.isMeshLambertMaterial||z.isMeshBasicMaterial||z.isMeshStandardMaterial||z.isShaderMaterial)&&re.setValue(w,"isOrthographic",M.isOrthographicCamera===!0),Z!==M&&(Z=M,Ee=!0,or=!0)}if(D.isSkinnedMesh){re.setOptional(w,D,"bindMatrix"),re.setOptional(w,D,"bindMatrixInverse");const Le=D.skeleton;Le&&(Le.boneTexture===null&&Le.computeBoneTexture(),re.setValue(w,"boneTexture",Le.boneTexture,E))}D.isBatchedMesh&&(re.setOptional(w,D,"batchingTexture"),re.setValue(w,"batchingTexture",D._matricesTexture,E),re.setOptional(w,D,"batchingIdTexture"),re.setValue(w,"batchingIdTexture",D._indirectTexture,E),re.setOptional(w,D,"batchingColorTexture"),D._colorsTexture!==null&&re.setValue(w,"batchingColorTexture",D._colorsTexture,E));const lr=F.morphAttributes;if((lr.position!==void 0||lr.normal!==void 0||lr.color!==void 0)&&It.update(D,F,Ne),(Ee||Rt.receiveShadow!==D.receiveShadow)&&(Rt.receiveShadow=D.receiveShadow,re.setValue(w,"receiveShadow",D.receiveShadow)),z.isMeshGouraudMaterial&&z.envMap!==null&&(fn.envMap.value=wt,fn.flipEnvMap.value=wt.isCubeTexture&&wt.isRenderTargetTexture===!1?-1:1),z.isMeshStandardMaterial&&z.envMap===null&&L.environment!==null&&(fn.envMapIntensity.value=L.environmentIntensity),Ee&&(re.setValue(w,"toneMappingExposure",y.toneMappingExposure),Rt.needsLights&&sh(fn,or),nt&&z.fog===!0&&ot.refreshFogUniforms(fn,nt),ot.refreshMaterialUniforms(fn,z,Q,O,p.state.transmissionRenderTarget[M.id]),ks.upload(w,Po(Rt),fn,E)),z.isShaderMaterial&&z.uniformsNeedUpdate===!0&&(ks.upload(w,Po(Rt),fn,E),z.uniformsNeedUpdate=!1),z.isSpriteMaterial&&re.setValue(w,"center",D.center),re.setValue(w,"modelViewMatrix",D.modelViewMatrix),re.setValue(w,"normalMatrix",D.normalMatrix),re.setValue(w,"modelMatrix",D.matrixWorld),z.isShaderMaterial||z.isRawShaderMaterial){const Le=z.uniformsGroups;for(let cr=0,ah=Le.length;cr<ah;cr++){const Do=Le[cr];P.update(Do,Ne),P.bind(Do,Ne)}}return Ne}function sh(M,L){M.ambientLightColor.needsUpdate=L,M.lightProbe.needsUpdate=L,M.directionalLights.needsUpdate=L,M.directionalLightShadows.needsUpdate=L,M.pointLights.needsUpdate=L,M.pointLightShadows.needsUpdate=L,M.spotLights.needsUpdate=L,M.spotLightShadows.needsUpdate=L,M.rectAreaLights.needsUpdate=L,M.hemisphereLights.needsUpdate=L}function rh(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return N},this.getActiveMipmapLevel=function(){return C},this.getRenderTarget=function(){return A},this.setRenderTargetTextures=function(M,L,F){gt.get(M.texture).__webglTexture=L,gt.get(M.depthTexture).__webglTexture=F;const z=gt.get(M);z.__hasExternalTextures=!0,z.__autoAllocateDepthBuffer=F===void 0,z.__autoAllocateDepthBuffer||st.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),z.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(M,L){const F=gt.get(M);F.__webglFramebuffer=L,F.__useDefaultFramebuffer=L===void 0},this.setRenderTarget=function(M,L=0,F=0){A=M,N=L,C=F;let z=!0,D=null,nt=!1,ft=!1;if(M){const wt=gt.get(M);if(wt.__useDefaultFramebuffer!==void 0)at.bindFramebuffer(w.FRAMEBUFFER,null),z=!1;else if(wt.__webglFramebuffer===void 0)E.setupRenderTarget(M);else if(wt.__hasExternalTextures)E.rebindTextures(M,gt.get(M.texture).__webglTexture,gt.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){const Tt=M.depthTexture;if(wt.__boundDepthTexture!==Tt){if(Tt!==null&&gt.has(Tt)&&(M.width!==Tt.image.width||M.height!==Tt.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");E.setupDepthRenderbuffer(M)}}const Lt=M.texture;(Lt.isData3DTexture||Lt.isDataArrayTexture||Lt.isCompressedArrayTexture)&&(ft=!0);const Dt=gt.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(Dt[L])?D=Dt[L][F]:D=Dt[L],nt=!0):M.samples>0&&E.useMultisampledRTT(M)===!1?D=gt.get(M).__webglMultisampledFramebuffer:Array.isArray(Dt)?D=Dt[F]:D=Dt,v.copy(M.viewport),S.copy(M.scissor),H=M.scissorTest}else v.copy(pt).multiplyScalar(Q).floor(),S.copy(mt).multiplyScalar(Q).floor(),H=kt;if(at.bindFramebuffer(w.FRAMEBUFFER,D)&&z&&at.drawBuffers(M,D),at.viewport(v),at.scissor(S),at.setScissorTest(H),nt){const wt=gt.get(M.texture);w.framebufferTexture2D(w.FRAMEBUFFER,w.COLOR_ATTACHMENT0,w.TEXTURE_CUBE_MAP_POSITIVE_X+L,wt.__webglTexture,F)}else if(ft){const wt=gt.get(M.texture),Lt=L||0;w.framebufferTextureLayer(w.FRAMEBUFFER,w.COLOR_ATTACHMENT0,wt.__webglTexture,F||0,Lt)}U=-1},this.readRenderTargetPixels=function(M,L,F,z,D,nt,ft){if(!(M&&M.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let bt=gt.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&ft!==void 0&&(bt=bt[ft]),bt){at.bindFramebuffer(w.FRAMEBUFFER,bt);try{const wt=M.texture,Lt=wt.format,Dt=wt.type;if(!j.textureFormatReadable(Lt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!j.textureTypeReadable(Dt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}L>=0&&L<=M.width-z&&F>=0&&F<=M.height-D&&w.readPixels(L,F,z,D,Ft.convert(Lt),Ft.convert(Dt),nt)}finally{const wt=A!==null?gt.get(A).__webglFramebuffer:null;at.bindFramebuffer(w.FRAMEBUFFER,wt)}}},this.readRenderTargetPixelsAsync=async function(M,L,F,z,D,nt,ft){if(!(M&&M.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let bt=gt.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&ft!==void 0&&(bt=bt[ft]),bt){const wt=M.texture,Lt=wt.format,Dt=wt.type;if(!j.textureFormatReadable(Lt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!j.textureTypeReadable(Dt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(L>=0&&L<=M.width-z&&F>=0&&F<=M.height-D){at.bindFramebuffer(w.FRAMEBUFFER,bt);const Tt=w.createBuffer();w.bindBuffer(w.PIXEL_PACK_BUFFER,Tt),w.bufferData(w.PIXEL_PACK_BUFFER,nt.byteLength,w.STREAM_READ),w.readPixels(L,F,z,D,Ft.convert(Lt),Ft.convert(Dt),0);const Zt=A!==null?gt.get(A).__webglFramebuffer:null;at.bindFramebuffer(w.FRAMEBUFFER,Zt);const ee=w.fenceSync(w.SYNC_GPU_COMMANDS_COMPLETE,0);return w.flush(),await wu(w,ee,4),w.bindBuffer(w.PIXEL_PACK_BUFFER,Tt),w.getBufferSubData(w.PIXEL_PACK_BUFFER,0,nt),w.deleteBuffer(Tt),w.deleteSync(ee),nt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(M,L=null,F=0){M.isTexture!==!0&&(zs("WebGLRenderer: copyFramebufferToTexture function signature has changed."),L=arguments[0]||null,M=arguments[1]);const z=Math.pow(2,-F),D=Math.floor(M.image.width*z),nt=Math.floor(M.image.height*z),ft=L!==null?L.x:0,bt=L!==null?L.y:0;E.setTexture2D(M,0),w.copyTexSubImage2D(w.TEXTURE_2D,F,0,0,ft,bt,D,nt),at.unbindTexture()},this.copyTextureToTexture=function(M,L,F=null,z=null,D=0){M.isTexture!==!0&&(zs("WebGLRenderer: copyTextureToTexture function signature has changed."),z=arguments[0]||null,M=arguments[1],L=arguments[2],D=arguments[3]||0,F=null);let nt,ft,bt,wt,Lt,Dt;F!==null?(nt=F.max.x-F.min.x,ft=F.max.y-F.min.y,bt=F.min.x,wt=F.min.y):(nt=M.image.width,ft=M.image.height,bt=0,wt=0),z!==null?(Lt=z.x,Dt=z.y):(Lt=0,Dt=0);const Tt=Ft.convert(L.format),Zt=Ft.convert(L.type);E.setTexture2D(L,0),w.pixelStorei(w.UNPACK_FLIP_Y_WEBGL,L.flipY),w.pixelStorei(w.UNPACK_PREMULTIPLY_ALPHA_WEBGL,L.premultiplyAlpha),w.pixelStorei(w.UNPACK_ALIGNMENT,L.unpackAlignment);const ee=w.getParameter(w.UNPACK_ROW_LENGTH),se=w.getParameter(w.UNPACK_IMAGE_HEIGHT),be=w.getParameter(w.UNPACK_SKIP_PIXELS),qt=w.getParameter(w.UNPACK_SKIP_ROWS),Rt=w.getParameter(w.UNPACK_SKIP_IMAGES),de=M.isCompressedTexture?M.mipmaps[D]:M.image;w.pixelStorei(w.UNPACK_ROW_LENGTH,de.width),w.pixelStorei(w.UNPACK_IMAGE_HEIGHT,de.height),w.pixelStorei(w.UNPACK_SKIP_PIXELS,bt),w.pixelStorei(w.UNPACK_SKIP_ROWS,wt),M.isDataTexture?w.texSubImage2D(w.TEXTURE_2D,D,Lt,Dt,nt,ft,Tt,Zt,de.data):M.isCompressedTexture?w.compressedTexSubImage2D(w.TEXTURE_2D,D,Lt,Dt,de.width,de.height,Tt,de.data):w.texSubImage2D(w.TEXTURE_2D,D,Lt,Dt,nt,ft,Tt,Zt,de),w.pixelStorei(w.UNPACK_ROW_LENGTH,ee),w.pixelStorei(w.UNPACK_IMAGE_HEIGHT,se),w.pixelStorei(w.UNPACK_SKIP_PIXELS,be),w.pixelStorei(w.UNPACK_SKIP_ROWS,qt),w.pixelStorei(w.UNPACK_SKIP_IMAGES,Rt),D===0&&L.generateMipmaps&&w.generateMipmap(w.TEXTURE_2D),at.unbindTexture()},this.copyTextureToTexture3D=function(M,L,F=null,z=null,D=0){M.isTexture!==!0&&(zs("WebGLRenderer: copyTextureToTexture3D function signature has changed."),F=arguments[0]||null,z=arguments[1]||null,M=arguments[2],L=arguments[3],D=arguments[4]||0);let nt,ft,bt,wt,Lt,Dt,Tt,Zt,ee;const se=M.isCompressedTexture?M.mipmaps[D]:M.image;F!==null?(nt=F.max.x-F.min.x,ft=F.max.y-F.min.y,bt=F.max.z-F.min.z,wt=F.min.x,Lt=F.min.y,Dt=F.min.z):(nt=se.width,ft=se.height,bt=se.depth,wt=0,Lt=0,Dt=0),z!==null?(Tt=z.x,Zt=z.y,ee=z.z):(Tt=0,Zt=0,ee=0);const be=Ft.convert(L.format),qt=Ft.convert(L.type);let Rt;if(L.isData3DTexture)E.setTexture3D(L,0),Rt=w.TEXTURE_3D;else if(L.isDataArrayTexture||L.isCompressedArrayTexture)E.setTexture2DArray(L,0),Rt=w.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}w.pixelStorei(w.UNPACK_FLIP_Y_WEBGL,L.flipY),w.pixelStorei(w.UNPACK_PREMULTIPLY_ALPHA_WEBGL,L.premultiplyAlpha),w.pixelStorei(w.UNPACK_ALIGNMENT,L.unpackAlignment);const de=w.getParameter(w.UNPACK_ROW_LENGTH),Yt=w.getParameter(w.UNPACK_IMAGE_HEIGHT),Ne=w.getParameter(w.UNPACK_SKIP_PIXELS),jn=w.getParameter(w.UNPACK_SKIP_ROWS),Ee=w.getParameter(w.UNPACK_SKIP_IMAGES);w.pixelStorei(w.UNPACK_ROW_LENGTH,se.width),w.pixelStorei(w.UNPACK_IMAGE_HEIGHT,se.height),w.pixelStorei(w.UNPACK_SKIP_PIXELS,wt),w.pixelStorei(w.UNPACK_SKIP_ROWS,Lt),w.pixelStorei(w.UNPACK_SKIP_IMAGES,Dt),M.isDataTexture||M.isData3DTexture?w.texSubImage3D(Rt,D,Tt,Zt,ee,nt,ft,bt,be,qt,se.data):L.isCompressedArrayTexture?w.compressedTexSubImage3D(Rt,D,Tt,Zt,ee,nt,ft,bt,be,se.data):w.texSubImage3D(Rt,D,Tt,Zt,ee,nt,ft,bt,be,qt,se),w.pixelStorei(w.UNPACK_ROW_LENGTH,de),w.pixelStorei(w.UNPACK_IMAGE_HEIGHT,Yt),w.pixelStorei(w.UNPACK_SKIP_PIXELS,Ne),w.pixelStorei(w.UNPACK_SKIP_ROWS,jn),w.pixelStorei(w.UNPACK_SKIP_IMAGES,Ee),D===0&&L.generateMipmaps&&w.generateMipmap(Rt),at.unbindTexture()},this.initRenderTarget=function(M){gt.get(M).__webglFramebuffer===void 0&&E.setupRenderTarget(M)},this.initTexture=function(M){M.isCubeTexture?E.setTextureCube(M,0):M.isData3DTexture?E.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?E.setTexture2DArray(M,0):E.setTexture2D(M,0),at.unbindTexture()},this.resetState=function(){N=0,C=0,A=null,at.reset(),te.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return cn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=t===so?"display-p3":"srgb",e.unpackColorSpace=Kt.workingColorSpace===er?"display-p3":"srgb"}}class Oc extends fe{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Ve,this.environmentIntensity=1,this.environmentRotation=new Ve,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}class ho extends ge{constructor(t,e,n,s,r,a,o,l,c){super(t,e,n,s,r,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class Ge{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(t,e){const n=this.getUtoTmapping(t);return this.getPoint(n,e)}getPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return e}getSpacedPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPointAt(n/t));return e}getLength(){const t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const e=[];let n,s=this.getPoint(0),r=0;e.push(0);for(let a=1;a<=t;a++)n=this.getPoint(a/t),r+=n.distanceTo(s),e.push(r),s=n;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e){const n=this.getLengths();let s=0;const r=n.length;let a;e?a=e:a=t*n[r-1];let o=0,l=r-1,c;for(;o<=l;)if(s=Math.floor(o+(l-o)/2),c=n[s]-a,c<0)o=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,n[s]===a)return s/(r-1);const h=n[s],u=n[s+1]-h,f=(a-h)/u;return(s+f)/(r-1)}getTangent(t,e){let s=t-1e-4,r=t+1e-4;s<0&&(s=0),r>1&&(r=1);const a=this.getPoint(s),o=this.getPoint(r),l=e||(a.isVector2?new it:new R);return l.copy(o).sub(a).normalize(),l}getTangentAt(t,e){const n=this.getUtoTmapping(t);return this.getTangent(n,e)}computeFrenetFrames(t,e){const n=new R,s=[],r=[],a=[],o=new R,l=new Qt;for(let f=0;f<=t;f++){const g=f/t;s[f]=this.getTangentAt(g,new R)}r[0]=new R,a[0]=new R;let c=Number.MAX_VALUE;const h=Math.abs(s[0].x),d=Math.abs(s[0].y),u=Math.abs(s[0].z);h<=c&&(c=h,n.set(1,0,0)),d<=c&&(c=d,n.set(0,1,0)),u<=c&&n.set(0,0,1),o.crossVectors(s[0],n).normalize(),r[0].crossVectors(s[0],o),a[0].crossVectors(s[0],r[0]);for(let f=1;f<=t;f++){if(r[f]=r[f-1].clone(),a[f]=a[f-1].clone(),o.crossVectors(s[f-1],s[f]),o.length()>Number.EPSILON){o.normalize();const g=Math.acos(ue(s[f-1].dot(s[f]),-1,1));r[f].applyMatrix4(l.makeRotationAxis(o,g))}a[f].crossVectors(s[f],r[f])}if(e===!0){let f=Math.acos(ue(r[0].dot(r[t]),-1,1));f/=t,s[0].dot(o.crossVectors(r[0],r[t]))>0&&(f=-f);for(let g=1;g<=t;g++)r[g].applyMatrix4(l.makeRotationAxis(s[g],f*g)),a[g].crossVectors(s[g],r[g])}return{tangents:s,normals:r,binormals:a}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){const t={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}class uo extends Ge{constructor(t=0,e=0,n=1,s=1,r=0,a=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=n,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=a,this.aClockwise=o,this.aRotation=l}getPoint(t,e=new it){const n=e,s=Math.PI*2;let r=this.aEndAngle-this.aStartAngle;const a=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(a?r=0:r=s),this.aClockwise===!0&&!a&&(r===s?r=-s:r=r-s);const o=this.aStartAngle+t*r;let l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){const h=Math.cos(this.aRotation),d=Math.sin(this.aRotation),u=l-this.aX,f=c-this.aY;l=u*h-f*d+this.aX,c=u*d+f*h+this.aY}return n.set(l,c)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){const t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}}class zg extends uo{constructor(t,e,n,s,r,a){super(t,e,n,n,s,r,a),this.isArcCurve=!0,this.type="ArcCurve"}}function fo(){let i=0,t=0,e=0,n=0;function s(r,a,o,l){i=r,t=o,e=-3*r+3*a-2*o-l,n=2*r-2*a+o+l}return{initCatmullRom:function(r,a,o,l,c){s(a,o,c*(o-r),c*(l-a))},initNonuniformCatmullRom:function(r,a,o,l,c,h,d){let u=(a-r)/c-(o-r)/(c+h)+(o-a)/h,f=(o-a)/h-(l-a)/(h+d)+(l-o)/d;u*=h,f*=h,s(a,o,u,f)},calc:function(r){const a=r*r,o=a*r;return i+t*r+e*a+n*o}}}const As=new R,zr=new fo,kr=new fo,Hr=new fo;class kg extends Ge{constructor(t=[],e=!1,n="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=n,this.tension=s}getPoint(t,e=new R){const n=e,s=this.points,r=s.length,a=(r-(this.closed?0:1))*t;let o=Math.floor(a),l=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/r)+1)*r:l===0&&o===r-1&&(o=r-2,l=1);let c,h;this.closed||o>0?c=s[(o-1)%r]:(As.subVectors(s[0],s[1]).add(s[0]),c=As);const d=s[o%r],u=s[(o+1)%r];if(this.closed||o+2<r?h=s[(o+2)%r]:(As.subVectors(s[r-1],s[r-2]).add(s[r-1]),h=As),this.curveType==="centripetal"||this.curveType==="chordal"){const f=this.curveType==="chordal"?.5:.25;let g=Math.pow(c.distanceToSquared(d),f),x=Math.pow(d.distanceToSquared(u),f),p=Math.pow(u.distanceToSquared(h),f);x<1e-4&&(x=1),g<1e-4&&(g=x),p<1e-4&&(p=x),zr.initNonuniformCatmullRom(c.x,d.x,u.x,h.x,g,x,p),kr.initNonuniformCatmullRom(c.y,d.y,u.y,h.y,g,x,p),Hr.initNonuniformCatmullRom(c.z,d.z,u.z,h.z,g,x,p)}else this.curveType==="catmullrom"&&(zr.initCatmullRom(c.x,d.x,u.x,h.x,this.tension),kr.initCatmullRom(c.y,d.y,u.y,h.y,this.tension),Hr.initCatmullRom(c.z,d.z,u.z,h.z,this.tension));return n.set(zr.calc(l),kr.calc(l),Hr.calc(l)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(s.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const s=this.points[e];t.points.push(s.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(new R().fromArray(s))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}}function Cl(i,t,e,n,s){const r=(n-t)*.5,a=(s-e)*.5,o=i*i,l=i*o;return(2*e-2*n+r+a)*l+(-3*e+3*n-2*r-a)*o+r*i+e}function Hg(i,t){const e=1-i;return e*e*t}function Vg(i,t){return 2*(1-i)*i*t}function Gg(i,t){return i*i*t}function Wi(i,t,e,n){return Hg(i,t)+Vg(i,e)+Gg(i,n)}function Wg(i,t){const e=1-i;return e*e*e*t}function Xg(i,t){const e=1-i;return 3*e*e*i*t}function $g(i,t){return 3*(1-i)*i*i*t}function qg(i,t){return i*i*i*t}function Xi(i,t,e,n,s){return Wg(i,t)+Xg(i,e)+$g(i,n)+qg(i,s)}class Bc extends Ge{constructor(t=new it,e=new it,n=new it,s=new it){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new it){const n=e,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(Xi(t,s.x,r.x,a.x,o.x),Xi(t,s.y,r.y,a.y,o.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class Yg extends Ge{constructor(t=new R,e=new R,n=new R,s=new R){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new R){const n=e,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(Xi(t,s.x,r.x,a.x,o.x),Xi(t,s.y,r.y,a.y,o.y),Xi(t,s.z,r.z,a.z,o.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class zc extends Ge{constructor(t=new it,e=new it){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new it){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new it){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Kg extends Ge{constructor(t=new R,e=new R){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new R){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new R){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class kc extends Ge{constructor(t=new it,e=new it,n=new it){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new it){const n=e,s=this.v0,r=this.v1,a=this.v2;return n.set(Wi(t,s.x,r.x,a.x),Wi(t,s.y,r.y,a.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Hc extends Ge{constructor(t=new R,e=new R,n=new R){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new R){const n=e,s=this.v0,r=this.v1,a=this.v2;return n.set(Wi(t,s.x,r.x,a.x),Wi(t,s.y,r.y,a.y),Wi(t,s.z,r.z,a.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Vc extends Ge{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new it){const n=e,s=this.points,r=(s.length-1)*t,a=Math.floor(r),o=r-a,l=s[a===0?a:a-1],c=s[a],h=s[a>s.length-2?s.length-1:a+1],d=s[a>s.length-3?s.length-1:a+2];return n.set(Cl(o,l.x,c.x,h.x,d.x),Cl(o,l.y,c.y,h.y,d.y)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(s.clone())}return this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const s=this.points[e];t.points.push(s.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(new it().fromArray(s))}return this}}var Ks=Object.freeze({__proto__:null,ArcCurve:zg,CatmullRomCurve3:kg,CubicBezierCurve:Bc,CubicBezierCurve3:Yg,EllipseCurve:uo,LineCurve:zc,LineCurve3:Kg,QuadraticBezierCurve:kc,QuadraticBezierCurve3:Hc,SplineCurve:Vc});class Zg extends Ge{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){const t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){const n=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Ks[n](e,t))}return this}getPoint(t,e){const n=t*this.getLength(),s=this.getCurveLengths();let r=0;for(;r<s.length;){if(s[r]>=n){const a=s[r]-n,o=this.curves[r],l=o.getLength(),c=l===0?0:1-a/l;return o.getPointAt(c,e)}r++}return null}getLength(){const t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const t=[];let e=0;for(let n=0,s=this.curves.length;n<s;n++)e+=this.curves[n].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){const e=[];let n;for(let s=0,r=this.curves;s<r.length;s++){const a=r[s],o=a.isEllipseCurve?t*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?t*a.points.length:t,l=a.getPoints(o);for(let c=0;c<l.length;c++){const h=l[c];n&&n.equals(h)||(e.push(h),n=h)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const s=t.curves[e];this.curves.push(s.clone())}return this.autoClose=t.autoClose,this}toJSON(){const t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,n=this.curves.length;e<n;e++){const s=this.curves[e];t.curves.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const s=t.curves[e];this.curves.push(new Ks[s.type]().fromJSON(s))}return this}}class Pl extends Zg{constructor(t){super(),this.type="Path",this.currentPoint=new it,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,n=t.length;e<n;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){const n=new zc(this.currentPoint.clone(),new it(t,e));return this.curves.push(n),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,n,s){const r=new kc(this.currentPoint.clone(),new it(t,e),new it(n,s));return this.curves.push(r),this.currentPoint.set(n,s),this}bezierCurveTo(t,e,n,s,r,a){const o=new Bc(this.currentPoint.clone(),new it(t,e),new it(n,s),new it(r,a));return this.curves.push(o),this.currentPoint.set(r,a),this}splineThru(t){const e=[this.currentPoint.clone()].concat(t),n=new Vc(e);return this.curves.push(n),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,n,s,r,a){const o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(t+o,e+l,n,s,r,a),this}absarc(t,e,n,s,r,a){return this.absellipse(t,e,n,n,s,r,a),this}ellipse(t,e,n,s,r,a,o,l){const c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(t+c,e+h,n,s,r,a,o,l),this}absellipse(t,e,n,s,r,a,o,l){const c=new uo(t,e,n,s,r,a,o,l);if(this.curves.length>0){const d=c.getPoint(0);d.equals(this.currentPoint)||this.lineTo(d.x,d.y)}this.curves.push(c);const h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){const t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}}class po extends Ke{constructor(t=1,e=1,n=1,s=32,r=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:s,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};const c=this;s=Math.floor(s),r=Math.floor(r);const h=[],d=[],u=[],f=[];let g=0;const x=[],p=n/2;let m=0;T(),a===!1&&(t>0&&y(!0),e>0&&y(!1)),this.setIndex(h),this.setAttribute("position",new ye(d,3)),this.setAttribute("normal",new ye(u,3)),this.setAttribute("uv",new ye(f,2));function T(){const b=new R,N=new R;let C=0;const A=(e-t)/n;for(let U=0;U<=r;U++){const Z=[],v=U/r,S=v*(e-t)+t;for(let H=0;H<=s;H++){const B=H/s,k=B*l+o,J=Math.sin(k),O=Math.cos(k);N.x=S*J,N.y=-v*n+p,N.z=S*O,d.push(N.x,N.y,N.z),b.set(J,A,O).normalize(),u.push(b.x,b.y,b.z),f.push(B,1-v),Z.push(g++)}x.push(Z)}for(let U=0;U<s;U++)for(let Z=0;Z<r;Z++){const v=x[Z][U],S=x[Z+1][U],H=x[Z+1][U+1],B=x[Z][U+1];t>0&&(h.push(v,S,B),C+=3),e>0&&(h.push(S,H,B),C+=3)}c.addGroup(m,C,0),m+=C}function y(b){const N=g,C=new it,A=new R;let U=0;const Z=b===!0?t:e,v=b===!0?1:-1;for(let H=1;H<=s;H++)d.push(0,p*v,0),u.push(0,v,0),f.push(.5,.5),g++;const S=g;for(let H=0;H<=s;H++){const k=H/s*l+o,J=Math.cos(k),O=Math.sin(k);A.x=Z*O,A.y=p*v,A.z=Z*J,d.push(A.x,A.y,A.z),u.push(0,v,0),C.x=J*.5+.5,C.y=O*.5*v+.5,f.push(C.x,C.y),g++}for(let H=0;H<s;H++){const B=N+H,k=S+H;b===!0?h.push(k,k+1,B):h.push(k+1,k,B),U+=3}c.addGroup(m,U,b===!0?1:2),m+=U}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new po(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class mo extends po{constructor(t=1,e=1,n=32,s=1,r=!1,a=0,o=Math.PI*2){super(0,t,e,n,s,r,a,o),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:a,thetaLength:o}}static fromJSON(t){return new mo(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Gc extends Pl{constructor(t){super(t),this.uuid=Zn(),this.type="Shape",this.holes=[]}getPointsHoles(t){const e=[];for(let n=0,s=this.holes.length;n<s;n++)e[n]=this.holes[n].getPoints(t);return e}extractPoints(t){return{shape:this.getPoints(t),holes:this.getPointsHoles(t)}}copy(t){super.copy(t),this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){const s=t.holes[e];this.holes.push(s.clone())}return this}toJSON(){const t=super.toJSON();t.uuid=this.uuid,t.holes=[];for(let e=0,n=this.holes.length;e<n;e++){const s=this.holes[e];t.holes.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.uuid=t.uuid,this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){const s=t.holes[e];this.holes.push(new Pl().fromJSON(s))}return this}}const Jg={triangulate:function(i,t,e=2){const n=t&&t.length,s=n?t[0]*e:i.length;let r=Wc(i,0,s,e,!0);const a=[];if(!r||r.next===r.prev)return a;let o,l,c,h,d,u,f;if(n&&(r=nv(i,t,r,e)),i.length>80*e){o=c=i[0],l=h=i[1];for(let g=e;g<s;g+=e)d=i[g],u=i[g+1],d<o&&(o=d),u<l&&(l=u),d>c&&(c=d),u>h&&(h=u);f=Math.max(c-o,h-l),f=f!==0?32767/f:0}return Zi(r,a,e,o,l,f,0),a}};function Wc(i,t,e,n,s){let r,a;if(s===fv(i,t,e,n)>0)for(r=t;r<e;r+=n)a=Ll(r,i[r],i[r+1],a);else for(r=e-n;r>=t;r-=n)a=Ll(r,i[r],i[r+1],a);return a&&sr(a,a.next)&&(ji(a),a=a.next),a}function Kn(i,t){if(!i)return i;t||(t=i);let e=i,n;do if(n=!1,!e.steiner&&(sr(e,e.next)||ie(e.prev,e,e.next)===0)){if(ji(e),e=t=e.prev,e===e.next)break;n=!0}else e=e.next;while(n||e!==t);return t}function Zi(i,t,e,n,s,r,a){if(!i)return;!a&&r&&ov(i,n,s,r);let o=i,l,c;for(;i.prev!==i.next;){if(l=i.prev,c=i.next,r?Qg(i,n,s,r):jg(i)){t.push(l.i/e|0),t.push(i.i/e|0),t.push(c.i/e|0),ji(i),i=c.next,o=c.next;continue}if(i=c,i===o){a?a===1?(i=tv(Kn(i),t,e),Zi(i,t,e,n,s,r,2)):a===2&&ev(i,t,e,n,s,r):Zi(Kn(i),t,e,n,s,r,1);break}}}function jg(i){const t=i.prev,e=i,n=i.next;if(ie(t,e,n)>=0)return!1;const s=t.x,r=e.x,a=n.x,o=t.y,l=e.y,c=n.y,h=s<r?s<a?s:a:r<a?r:a,d=o<l?o<c?o:c:l<c?l:c,u=s>r?s>a?s:a:r>a?r:a,f=o>l?o>c?o:c:l>c?l:c;let g=n.next;for(;g!==t;){if(g.x>=h&&g.x<=u&&g.y>=d&&g.y<=f&&yi(s,o,r,l,a,c,g.x,g.y)&&ie(g.prev,g,g.next)>=0)return!1;g=g.next}return!0}function Qg(i,t,e,n){const s=i.prev,r=i,a=i.next;if(ie(s,r,a)>=0)return!1;const o=s.x,l=r.x,c=a.x,h=s.y,d=r.y,u=a.y,f=o<l?o<c?o:c:l<c?l:c,g=h<d?h<u?h:u:d<u?d:u,x=o>l?o>c?o:c:l>c?l:c,p=h>d?h>u?h:u:d>u?d:u,m=Ga(f,g,t,e,n),T=Ga(x,p,t,e,n);let y=i.prevZ,b=i.nextZ;for(;y&&y.z>=m&&b&&b.z<=T;){if(y.x>=f&&y.x<=x&&y.y>=g&&y.y<=p&&y!==s&&y!==a&&yi(o,h,l,d,c,u,y.x,y.y)&&ie(y.prev,y,y.next)>=0||(y=y.prevZ,b.x>=f&&b.x<=x&&b.y>=g&&b.y<=p&&b!==s&&b!==a&&yi(o,h,l,d,c,u,b.x,b.y)&&ie(b.prev,b,b.next)>=0))return!1;b=b.nextZ}for(;y&&y.z>=m;){if(y.x>=f&&y.x<=x&&y.y>=g&&y.y<=p&&y!==s&&y!==a&&yi(o,h,l,d,c,u,y.x,y.y)&&ie(y.prev,y,y.next)>=0)return!1;y=y.prevZ}for(;b&&b.z<=T;){if(b.x>=f&&b.x<=x&&b.y>=g&&b.y<=p&&b!==s&&b!==a&&yi(o,h,l,d,c,u,b.x,b.y)&&ie(b.prev,b,b.next)>=0)return!1;b=b.nextZ}return!0}function tv(i,t,e){let n=i;do{const s=n.prev,r=n.next.next;!sr(s,r)&&Xc(s,n,n.next,r)&&Ji(s,r)&&Ji(r,s)&&(t.push(s.i/e|0),t.push(n.i/e|0),t.push(r.i/e|0),ji(n),ji(n.next),n=i=r),n=n.next}while(n!==i);return Kn(n)}function ev(i,t,e,n,s,r){let a=i;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&hv(a,o)){let l=$c(a,o);a=Kn(a,a.next),l=Kn(l,l.next),Zi(a,t,e,n,s,r,0),Zi(l,t,e,n,s,r,0);return}o=o.next}a=a.next}while(a!==i)}function nv(i,t,e,n){const s=[];let r,a,o,l,c;for(r=0,a=t.length;r<a;r++)o=t[r]*n,l=r<a-1?t[r+1]*n:i.length,c=Wc(i,o,l,n,!1),c===c.next&&(c.steiner=!0),s.push(cv(c));for(s.sort(iv),r=0;r<s.length;r++)e=sv(s[r],e);return e}function iv(i,t){return i.x-t.x}function sv(i,t){const e=rv(i,t);if(!e)return t;const n=$c(e,i);return Kn(n,n.next),Kn(e,e.next)}function rv(i,t){let e=t,n=-1/0,s;const r=i.x,a=i.y;do{if(a<=e.y&&a>=e.next.y&&e.next.y!==e.y){const u=e.x+(a-e.y)*(e.next.x-e.x)/(e.next.y-e.y);if(u<=r&&u>n&&(n=u,s=e.x<e.next.x?e:e.next,u===r))return s}e=e.next}while(e!==t);if(!s)return null;const o=s,l=s.x,c=s.y;let h=1/0,d;e=s;do r>=e.x&&e.x>=l&&r!==e.x&&yi(a<c?r:n,a,l,c,a<c?n:r,a,e.x,e.y)&&(d=Math.abs(a-e.y)/(r-e.x),Ji(e,i)&&(d<h||d===h&&(e.x>s.x||e.x===s.x&&av(s,e)))&&(s=e,h=d)),e=e.next;while(e!==o);return s}function av(i,t){return ie(i.prev,i,t.prev)<0&&ie(t.next,i,i.next)<0}function ov(i,t,e,n){let s=i;do s.z===0&&(s.z=Ga(s.x,s.y,t,e,n)),s.prevZ=s.prev,s.nextZ=s.next,s=s.next;while(s!==i);s.prevZ.nextZ=null,s.prevZ=null,lv(s)}function lv(i){let t,e,n,s,r,a,o,l,c=1;do{for(e=i,i=null,r=null,a=0;e;){for(a++,n=e,o=0,t=0;t<c&&(o++,n=n.nextZ,!!n);t++);for(l=c;o>0||l>0&&n;)o!==0&&(l===0||!n||e.z<=n.z)?(s=e,e=e.nextZ,o--):(s=n,n=n.nextZ,l--),r?r.nextZ=s:i=s,s.prevZ=r,r=s;e=n}r.nextZ=null,c*=2}while(a>1);return i}function Ga(i,t,e,n,s){return i=(i-e)*s|0,t=(t-n)*s|0,i=(i|i<<8)&16711935,i=(i|i<<4)&252645135,i=(i|i<<2)&858993459,i=(i|i<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,i|t<<1}function cv(i){let t=i,e=i;do(t.x<e.x||t.x===e.x&&t.y<e.y)&&(e=t),t=t.next;while(t!==i);return e}function yi(i,t,e,n,s,r,a,o){return(s-a)*(t-o)>=(i-a)*(r-o)&&(i-a)*(n-o)>=(e-a)*(t-o)&&(e-a)*(r-o)>=(s-a)*(n-o)}function hv(i,t){return i.next.i!==t.i&&i.prev.i!==t.i&&!uv(i,t)&&(Ji(i,t)&&Ji(t,i)&&dv(i,t)&&(ie(i.prev,i,t.prev)||ie(i,t.prev,t))||sr(i,t)&&ie(i.prev,i,i.next)>0&&ie(t.prev,t,t.next)>0)}function ie(i,t,e){return(t.y-i.y)*(e.x-t.x)-(t.x-i.x)*(e.y-t.y)}function sr(i,t){return i.x===t.x&&i.y===t.y}function Xc(i,t,e,n){const s=Cs(ie(i,t,e)),r=Cs(ie(i,t,n)),a=Cs(ie(e,n,i)),o=Cs(ie(e,n,t));return!!(s!==r&&a!==o||s===0&&Rs(i,e,t)||r===0&&Rs(i,n,t)||a===0&&Rs(e,i,n)||o===0&&Rs(e,t,n))}function Rs(i,t,e){return t.x<=Math.max(i.x,e.x)&&t.x>=Math.min(i.x,e.x)&&t.y<=Math.max(i.y,e.y)&&t.y>=Math.min(i.y,e.y)}function Cs(i){return i>0?1:i<0?-1:0}function uv(i,t){let e=i;do{if(e.i!==i.i&&e.next.i!==i.i&&e.i!==t.i&&e.next.i!==t.i&&Xc(e,e.next,i,t))return!0;e=e.next}while(e!==i);return!1}function Ji(i,t){return ie(i.prev,i,i.next)<0?ie(i,t,i.next)>=0&&ie(i,i.prev,t)>=0:ie(i,t,i.prev)<0||ie(i,i.next,t)<0}function dv(i,t){let e=i,n=!1;const s=(i.x+t.x)/2,r=(i.y+t.y)/2;do e.y>r!=e.next.y>r&&e.next.y!==e.y&&s<(e.next.x-e.x)*(r-e.y)/(e.next.y-e.y)+e.x&&(n=!n),e=e.next;while(e!==i);return n}function $c(i,t){const e=new Wa(i.i,i.x,i.y),n=new Wa(t.i,t.x,t.y),s=i.next,r=t.prev;return i.next=t,t.prev=i,e.next=s,s.prev=e,n.next=e,e.prev=n,r.next=n,n.prev=r,n}function Ll(i,t,e,n){const s=new Wa(i,t,e);return n?(s.next=n.next,s.prev=n,n.next.prev=s,n.next=s):(s.prev=s,s.next=s),s}function ji(i){i.next.prev=i.prev,i.prev.next=i.next,i.prevZ&&(i.prevZ.nextZ=i.nextZ),i.nextZ&&(i.nextZ.prevZ=i.prevZ)}function Wa(i,t,e){this.i=i,this.x=t,this.y=e,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}function fv(i,t,e,n){let s=0;for(let r=t,a=e-n;r<e;r+=n)s+=(i[a]-i[r])*(i[r+1]+i[a+1]),a=r;return s}class $i{static area(t){const e=t.length;let n=0;for(let s=e-1,r=0;r<e;s=r++)n+=t[s].x*t[r].y-t[r].x*t[s].y;return n*.5}static isClockWise(t){return $i.area(t)<0}static triangulateShape(t,e){const n=[],s=[],r=[];Dl(t),Ul(n,t);let a=t.length;e.forEach(Dl);for(let l=0;l<e.length;l++)s.push(a),a+=e[l].length,Ul(n,e[l]);const o=Jg.triangulate(n,s);for(let l=0;l<o.length;l+=3)r.push(o.slice(l,l+3));return r}}function Dl(i){const t=i.length;t>2&&i[t-1].equals(i[0])&&i.pop()}function Ul(i,t){for(let e=0;e<t.length;e++)i.push(t[e].x),i.push(t[e].y)}class go extends Ke{constructor(t=new Gc([new it(.5,.5),new it(-.5,.5),new it(-.5,-.5),new it(.5,-.5)]),e={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:t,options:e},t=Array.isArray(t)?t:[t];const n=this,s=[],r=[];for(let o=0,l=t.length;o<l;o++){const c=t[o];a(c)}this.setAttribute("position",new ye(s,3)),this.setAttribute("uv",new ye(r,2)),this.computeVertexNormals();function a(o){const l=[],c=e.curveSegments!==void 0?e.curveSegments:12,h=e.steps!==void 0?e.steps:1,d=e.depth!==void 0?e.depth:1;let u=e.bevelEnabled!==void 0?e.bevelEnabled:!0,f=e.bevelThickness!==void 0?e.bevelThickness:.2,g=e.bevelSize!==void 0?e.bevelSize:f-.1,x=e.bevelOffset!==void 0?e.bevelOffset:0,p=e.bevelSegments!==void 0?e.bevelSegments:3;const m=e.extrudePath,T=e.UVGenerator!==void 0?e.UVGenerator:pv;let y,b=!1,N,C,A,U;m&&(y=m.getSpacedPoints(h),b=!0,u=!1,N=m.computeFrenetFrames(h,!1),C=new R,A=new R,U=new R),u||(p=0,f=0,g=0,x=0);const Z=o.extractPoints(c);let v=Z.shape;const S=Z.holes;if(!$i.isClockWise(v)){v=v.reverse();for(let q=0,w=S.length;q<w;q++){const rt=S[q];$i.isClockWise(rt)&&(S[q]=rt.reverse())}}const B=$i.triangulateShape(v,S),k=v;for(let q=0,w=S.length;q<w;q++){const rt=S[q];v=v.concat(rt)}function J(q,w,rt){return w||console.error("THREE.ExtrudeGeometry: vec does not exist"),q.clone().addScaledVector(w,rt)}const O=v.length,Q=B.length;function G(q,w,rt){let st,j,at;const At=q.x-w.x,gt=q.y-w.y,E=rt.x-q.x,_=rt.y-q.y,I=At*At+gt*gt,X=At*_-gt*E;if(Math.abs(X)>Number.EPSILON){const Y=Math.sqrt(I),$=Math.sqrt(E*E+_*_),Et=w.x-gt/Y,ot=w.y+At/Y,xt=rt.x-_/$,Vt=rt.y+E/$,et=((xt-Et)*_-(Vt-ot)*E)/(At*_-gt*E);st=Et+At*et-q.x,j=ot+gt*et-q.y;const yt=st*st+j*j;if(yt<=2)return new it(st,j);at=Math.sqrt(yt/2)}else{let Y=!1;At>Number.EPSILON?E>Number.EPSILON&&(Y=!0):At<-Number.EPSILON?E<-Number.EPSILON&&(Y=!0):Math.sign(gt)===Math.sign(_)&&(Y=!0),Y?(st=-gt,j=At,at=Math.sqrt(I)):(st=At,j=gt,at=Math.sqrt(I/2))}return new it(st/at,j/at)}const ut=[];for(let q=0,w=k.length,rt=w-1,st=q+1;q<w;q++,rt++,st++)rt===w&&(rt=0),st===w&&(st=0),ut[q]=G(k[q],k[rt],k[st]);const pt=[];let mt,kt=ut.concat();for(let q=0,w=S.length;q<w;q++){const rt=S[q];mt=[];for(let st=0,j=rt.length,at=j-1,At=st+1;st<j;st++,at++,At++)at===j&&(at=0),At===j&&(At=0),mt[st]=G(rt[st],rt[at],rt[At]);pt.push(mt),kt=kt.concat(mt)}for(let q=0;q<p;q++){const w=q/p,rt=f*Math.cos(w*Math.PI/2),st=g*Math.sin(w*Math.PI/2)+x;for(let j=0,at=k.length;j<at;j++){const At=J(k[j],ut[j],st);ct(At.x,At.y,-rt)}for(let j=0,at=S.length;j<at;j++){const At=S[j];mt=pt[j];for(let gt=0,E=At.length;gt<E;gt++){const _=J(At[gt],mt[gt],st);ct(_.x,_.y,-rt)}}}const Xt=g+x;for(let q=0;q<O;q++){const w=u?J(v[q],kt[q],Xt):v[q];b?(A.copy(N.normals[0]).multiplyScalar(w.x),C.copy(N.binormals[0]).multiplyScalar(w.y),U.copy(y[0]).add(A).add(C),ct(U.x,U.y,U.z)):ct(w.x,w.y,0)}for(let q=1;q<=h;q++)for(let w=0;w<O;w++){const rt=u?J(v[w],kt[w],Xt):v[w];b?(A.copy(N.normals[q]).multiplyScalar(rt.x),C.copy(N.binormals[q]).multiplyScalar(rt.y),U.copy(y[q]).add(A).add(C),ct(U.x,U.y,U.z)):ct(rt.x,rt.y,d/h*q)}for(let q=p-1;q>=0;q--){const w=q/p,rt=f*Math.cos(w*Math.PI/2),st=g*Math.sin(w*Math.PI/2)+x;for(let j=0,at=k.length;j<at;j++){const At=J(k[j],ut[j],st);ct(At.x,At.y,d+rt)}for(let j=0,at=S.length;j<at;j++){const At=S[j];mt=pt[j];for(let gt=0,E=At.length;gt<E;gt++){const _=J(At[gt],mt[gt],st);b?ct(_.x,_.y+y[h-1].y,y[h-1].x+rt):ct(_.x,_.y,d+rt)}}}W(),tt();function W(){const q=s.length/3;if(u){let w=0,rt=O*w;for(let st=0;st<Q;st++){const j=B[st];Pt(j[2]+rt,j[1]+rt,j[0]+rt)}w=h+p*2,rt=O*w;for(let st=0;st<Q;st++){const j=B[st];Pt(j[0]+rt,j[1]+rt,j[2]+rt)}}else{for(let w=0;w<Q;w++){const rt=B[w];Pt(rt[2],rt[1],rt[0])}for(let w=0;w<Q;w++){const rt=B[w];Pt(rt[0]+O*h,rt[1]+O*h,rt[2]+O*h)}}n.addGroup(q,s.length/3-q,0)}function tt(){const q=s.length/3;let w=0;Mt(k,w),w+=k.length;for(let rt=0,st=S.length;rt<st;rt++){const j=S[rt];Mt(j,w),w+=j.length}n.addGroup(q,s.length/3-q,1)}function Mt(q,w){let rt=q.length;for(;--rt>=0;){const st=rt;let j=rt-1;j<0&&(j=q.length-1);for(let at=0,At=h+p*2;at<At;at++){const gt=O*at,E=O*(at+1),_=w+st+gt,I=w+j+gt,X=w+j+E,Y=w+st+E;Ct(_,I,X,Y)}}}function ct(q,w,rt){l.push(q),l.push(w),l.push(rt)}function Pt(q,w,rt){Nt(q),Nt(w),Nt(rt);const st=s.length/3,j=T.generateTopUV(n,s,st-3,st-2,st-1);zt(j[0]),zt(j[1]),zt(j[2])}function Ct(q,w,rt,st){Nt(q),Nt(w),Nt(st),Nt(w),Nt(rt),Nt(st);const j=s.length/3,at=T.generateSideWallUV(n,s,j-6,j-3,j-2,j-1);zt(at[0]),zt(at[1]),zt(at[3]),zt(at[1]),zt(at[2]),zt(at[3])}function Nt(q){s.push(l[q*3+0]),s.push(l[q*3+1]),s.push(l[q*3+2])}function zt(q){r.push(q.x),r.push(q.y)}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON(),e=this.parameters.shapes,n=this.parameters.options;return mv(e,n,t)}static fromJSON(t,e){const n=[];for(let r=0,a=t.shapes.length;r<a;r++){const o=e[t.shapes[r]];n.push(o)}const s=t.options.extrudePath;return s!==void 0&&(t.options.extrudePath=new Ks[s.type]().fromJSON(s)),new go(n,t.options)}}const pv={generateTopUV:function(i,t,e,n,s){const r=t[e*3],a=t[e*3+1],o=t[n*3],l=t[n*3+1],c=t[s*3],h=t[s*3+1];return[new it(r,a),new it(o,l),new it(c,h)]},generateSideWallUV:function(i,t,e,n,s,r){const a=t[e*3],o=t[e*3+1],l=t[e*3+2],c=t[n*3],h=t[n*3+1],d=t[n*3+2],u=t[s*3],f=t[s*3+1],g=t[s*3+2],x=t[r*3],p=t[r*3+1],m=t[r*3+2];return Math.abs(o-h)<Math.abs(a-c)?[new it(a,1-l),new it(c,1-d),new it(u,1-g),new it(x,1-m)]:[new it(o,1-l),new it(h,1-d),new it(f,1-g),new it(p,1-m)]}};function mv(i,t,e){if(e.shapes=[],Array.isArray(i))for(let n=0,s=i.length;n<s;n++){const r=i[n];e.shapes.push(r.uuid)}else e.shapes.push(i.uuid);return e.options=Object.assign({},t),t.extrudePath!==void 0&&(e.options.extrudePath=t.extrudePath.toJSON()),e}class vo extends Ke{constructor(t=new Hc(new R(-1,-1,0),new R(-1,1,0),new R(1,1,0)),e=64,n=1,s=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:t,tubularSegments:e,radius:n,radialSegments:s,closed:r};const a=t.computeFrenetFrames(e,r);this.tangents=a.tangents,this.normals=a.normals,this.binormals=a.binormals;const o=new R,l=new R,c=new it;let h=new R;const d=[],u=[],f=[],g=[];x(),this.setIndex(g),this.setAttribute("position",new ye(d,3)),this.setAttribute("normal",new ye(u,3)),this.setAttribute("uv",new ye(f,2));function x(){for(let y=0;y<e;y++)p(y);p(r===!1?e:0),T(),m()}function p(y){h=t.getPointAt(y/e,h);const b=a.normals[y],N=a.binormals[y];for(let C=0;C<=s;C++){const A=C/s*Math.PI*2,U=Math.sin(A),Z=-Math.cos(A);l.x=Z*b.x+U*N.x,l.y=Z*b.y+U*N.y,l.z=Z*b.z+U*N.z,l.normalize(),u.push(l.x,l.y,l.z),o.x=h.x+n*l.x,o.y=h.y+n*l.y,o.z=h.z+n*l.z,d.push(o.x,o.y,o.z)}}function m(){for(let y=1;y<=e;y++)for(let b=1;b<=s;b++){const N=(s+1)*(y-1)+(b-1),C=(s+1)*y+(b-1),A=(s+1)*y+b,U=(s+1)*(y-1)+b;g.push(N,C,U),g.push(C,A,U)}}function T(){for(let y=0;y<=e;y++)for(let b=0;b<=s;b++)c.x=y/e,c.y=b/s,f.push(c.x,c.y)}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON();return t.path=this.parameters.path.toJSON(),t}static fromJSON(t){return new vo(new Ks[t.path.type]().fromJSON(t.path),t.tubularSegments,t.radius,t.radialSegments,t.closed)}}class Zs extends es{constructor(t){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new Ht(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ht(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=_c,this.normalScale=new it(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ve,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class Il extends Zs{constructor(t){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new it(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return ue(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new Ht(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Ht(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Ht(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(t)}get anisotropy(){return this._anisotropy}set anisotropy(t){this._anisotropy>0!=t>0&&this.version++,this._anisotropy=t}get clearcoat(){return this._clearcoat}set clearcoat(t){this._clearcoat>0!=t>0&&this.version++,this._clearcoat=t}get iridescence(){return this._iridescence}set iridescence(t){this._iridescence>0!=t>0&&this.version++,this._iridescence=t}get dispersion(){return this._dispersion}set dispersion(t){this._dispersion>0!=t>0&&this.version++,this._dispersion=t}get sheen(){return this._sheen}set sheen(t){this._sheen>0!=t>0&&this.version++,this._sheen=t}get transmission(){return this._transmission}set transmission(t){this._transmission>0!=t>0&&this.version++,this._transmission=t}copy(t){return super.copy(t),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=t.anisotropy,this.anisotropyRotation=t.anisotropyRotation,this.anisotropyMap=t.anisotropyMap,this.clearcoat=t.clearcoat,this.clearcoatMap=t.clearcoatMap,this.clearcoatRoughness=t.clearcoatRoughness,this.clearcoatRoughnessMap=t.clearcoatRoughnessMap,this.clearcoatNormalMap=t.clearcoatNormalMap,this.clearcoatNormalScale.copy(t.clearcoatNormalScale),this.dispersion=t.dispersion,this.ior=t.ior,this.iridescence=t.iridescence,this.iridescenceMap=t.iridescenceMap,this.iridescenceIOR=t.iridescenceIOR,this.iridescenceThicknessRange=[...t.iridescenceThicknessRange],this.iridescenceThicknessMap=t.iridescenceThicknessMap,this.sheen=t.sheen,this.sheenColor.copy(t.sheenColor),this.sheenColorMap=t.sheenColorMap,this.sheenRoughness=t.sheenRoughness,this.sheenRoughnessMap=t.sheenRoughnessMap,this.transmission=t.transmission,this.transmissionMap=t.transmissionMap,this.thickness=t.thickness,this.thicknessMap=t.thicknessMap,this.attenuationDistance=t.attenuationDistance,this.attenuationColor.copy(t.attenuationColor),this.specularIntensity=t.specularIntensity,this.specularIntensityMap=t.specularIntensityMap,this.specularColor.copy(t.specularColor),this.specularColorMap=t.specularColorMap,this}}class _o extends fe{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Ht(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}}class gv extends _o{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(fe.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Ht(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}}const Vr=new Qt,Nl=new R,Fl=new R;class qc{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new it(512,512),this.map=null,this.mapPass=null,this.matrix=new Qt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new lo,this._frameExtents=new it(1,1),this._viewportCount=1,this._viewports=[new Jt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,n=this.matrix;Nl.setFromMatrixPosition(t.matrixWorld),e.position.copy(Nl),Fl.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Fl),e.updateMatrixWorld(),Vr.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Vr),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Vr)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}const Ol=new Qt,Bi=new R,Gr=new R;class vv extends qc{constructor(){super(new Ce(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new it(4,2),this._viewportCount=6,this._viewports=[new Jt(2,1,1,1),new Jt(0,1,1,1),new Jt(3,1,1,1),new Jt(1,1,1,1),new Jt(3,0,1,1),new Jt(1,0,1,1)],this._cubeDirections=[new R(1,0,0),new R(-1,0,0),new R(0,0,1),new R(0,0,-1),new R(0,1,0),new R(0,-1,0)],this._cubeUps=[new R(0,1,0),new R(0,1,0),new R(0,1,0),new R(0,1,0),new R(0,0,1),new R(0,0,-1)]}updateMatrices(t,e=0){const n=this.camera,s=this.matrix,r=t.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),Bi.setFromMatrixPosition(t.matrixWorld),n.position.copy(Bi),Gr.copy(n.position),Gr.add(this._cubeDirections[e]),n.up.copy(this._cubeUps[e]),n.lookAt(Gr),n.updateMatrixWorld(),s.makeTranslation(-Bi.x,-Bi.y,-Bi.z),Ol.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Ol)}}class _v extends _o{constructor(t,e,n=0,s=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new vv}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}}class xv extends qc{constructor(){super(new Lc(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Bl extends _o{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(fe.DEFAULT_UP),this.updateMatrix(),this.target=new fe,this.shadow=new xv}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}class yv{constructor(t=!0){this.autoStart=t,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=zl(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let t=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){const e=zl();t=(e-this.oldTime)/1e3,this.oldTime=e,this.elapsedTime+=t}return t}}function zl(){return performance.now()}const kl=new Qt;class Mv{constructor(t,e,n=0,s=1/0){this.ray=new bc(t,e),this.near=n,this.far=s,this.camera=null,this.layers=new oo,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,(e.near+e.far)/(e.near-e.far)).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):console.error("THREE.Raycaster: Unsupported camera type: "+e.type)}setFromXRController(t){return kl.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(kl),this}intersectObject(t,e=!0,n=[]){return Xa(t,this,n,e),n.sort(Hl),n}intersectObjects(t,e=!0,n=[]){for(let s=0,r=t.length;s<r;s++)Xa(t[s],this,n,e);return n.sort(Hl),n}}function Hl(i,t){return i.distance-t.distance}function Xa(i,t,e,n){let s=!0;if(i.layers.test(t.layers)&&i.raycast(t,e)===!1&&(s=!1),s===!0&&n===!0){const r=i.children;for(let a=0,o=r.length;a<o;a++)Xa(r[a],t,e,!0)}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Ja}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Ja);const xo=new URL(""+new URL("lucid-confusion-logo-DBlpkqp4.png",import.meta.url).href,import.meta.url).href,qi=["#eef0f3","#c4111f","#0d9a48","#f5d61d","#f2650f","#0a47b3"],Vl=0;function Sv(i=256,t=.55,e=.22){const n=document.createElement("canvas");n.width=n.height=i;const s=n.getContext("2d"),r=s.createImageData(i,i),a=new Float32Array(i*i);for(const[l,c]of[[32,.55],[12,.3],[4,.15]]){const h=Math.ceil(i/l)+1,d=Array.from({length:h*h},Math.random);for(let u=0;u<i;u++)for(let f=0;f<i;f++){const g=f/l,x=u/l,p=Math.floor(g),m=Math.floor(x),T=g-p,y=x-m,b=T*T*(3-2*T),N=y*y*(3-2*y),C=d[m*h+p],A=d[m*h+p+1],U=d[(m+1)*h+p],Z=d[(m+1)*h+p+1];a[u*i+f]+=c*((C*(1-b)+A*b)*(1-N)+(U*(1-b)+Z*b)*N)}}for(let l=0;l<i*i;l++){const c=Math.max(0,Math.min(1,t+(a[l]-.5)*2*e))*255;r.data[l*4]=r.data[l*4+1]=r.data[l*4+2]=c,r.data[l*4+3]=255}s.putImageData(r,0,0);const o=new ho(n);return o.wrapS=o.wrapT=Gs,o}let Wr=null;function bv(){return Wr||(Wr=new Promise(i=>{const t=new Image;t.onload=()=>i(t),t.onerror=()=>i(null),t.src=xo})),Wr}class Ev{constructor(){this.faceColors=qi.slice(),this.faceImages=[null,null,null,null,null,null],this.logoImage=null,this.roughness=Sv(),this.cache=new Map,this.version=0,this.bodyMaterial=new Il({color:657931,roughness:.3,metalness:0,clearcoat:.75,clearcoatRoughness:.16,envMapIntensity:1})}setFaceColor(t,e){this.faceColors[t]=e,this.invalidate(t)}setFaceImage(t,e,n="span"){this.faceImages[t]=e?{image:e,mode:n}:null,this.invalidate(t)}setFaceImageMode(t,e){this.faceImages[t]&&(this.faceImages[t].mode=e,this.invalidate(t))}setLogo(t){this.logoImage=t,this.invalidate(Vl)}invalidate(t){for(const[e,n]of this.cache)e.startsWith(`${t}:`)&&(n.map&&n.map.dispose(),n.dispose(),this.cache.delete(e));this.version++}baseMaterial(t){return new Il({roughness:.26,metalness:0,clearcoat:.45,clearcoatRoughness:.22,roughnessMap:this.roughness,envMapIntensity:.85,...t})}material(t,e,n){const s=this.faceImages[t],r=t===Vl&&e===1&&n===1&&!s&&this.logoImage,a=s?`${t}:${s.mode}:${s.mode==="span"?`${e}${n}`:"all"}`:r?`${t}:logo`:`${t}:plain`;let o=this.cache.get(a);if(o)return o;if(s){const l=new ge(s.image);l.colorSpace=Re,l.anisotropy=8,s.mode==="span"&&(l.repeat.set(1/3,1/3),l.offset.set(n/3,(2-e)/3)),l.needsUpdate=!0,o=this.baseMaterial({color:16777215,map:l})}else r?o=this.baseMaterial({color:16777215,map:this.logoTexture(this.faceColors[t])}):o=this.baseMaterial({color:new Ht(this.faceColors[t])});return this.cache.set(a,o),o}logoTexture(t){const n=document.createElement("canvas");n.width=n.height=512;const s=n.getContext("2d");s.fillStyle=t,s.fillRect(0,0,512,512);const r=512*.97;s.drawImage(this.logoImage,(512-r)/2,(512-r)/2,r,r);const a=new ho(n);return a.colorSpace=Re,a.anisotropy=8,a}}const zi=new R;function Ue(i,t,e,n,s,r){const a=2*Math.PI*s/4,o=Math.max(r-2*s,0),l=Math.PI/4;zi.copy(t),zi[n]=0,zi.normalize();const c=.5*a/(a+o),h=1-zi.angleTo(i)/l;return Math.sign(zi[e])===1?h*c:o/(a+o)+c+c*(1-h)}class wv extends Jn{constructor(t=1,e=1,n=1,s=2,r=.1){if(s=s*2+1,r=Math.min(t/2,e/2,n/2,r),super(1,1,1,s,s,s),s===1)return;const a=this.toNonIndexed();this.index=null,this.attributes.position=a.attributes.position,this.attributes.normal=a.attributes.normal,this.attributes.uv=a.attributes.uv;const o=new R,l=new R,c=new R(t,e,n).divideScalar(2).subScalar(r),h=this.attributes.position.array,d=this.attributes.normal.array,u=this.attributes.uv.array,f=h.length/6,g=new R,x=.5/s;for(let p=0,m=0;p<h.length;p+=3,m+=2)switch(o.fromArray(h,p),l.copy(o),l.x-=Math.sign(l.x)*x,l.y-=Math.sign(l.y)*x,l.z-=Math.sign(l.z)*x,l.normalize(),h[p+0]=c.x*Math.sign(o.x)+l.x*r,h[p+1]=c.y*Math.sign(o.y)+l.y*r,h[p+2]=c.z*Math.sign(o.z)+l.z*r,d[p+0]=l.x,d[p+1]=l.y,d[p+2]=l.z,Math.floor(p/f)){case 0:g.set(1,0,0),u[m+0]=Ue(g,l,"z","y",r,n),u[m+1]=1-Ue(g,l,"y","z",r,e);break;case 1:g.set(-1,0,0),u[m+0]=1-Ue(g,l,"z","y",r,n),u[m+1]=1-Ue(g,l,"y","z",r,e);break;case 2:g.set(0,1,0),u[m+0]=1-Ue(g,l,"x","z",r,t),u[m+1]=Ue(g,l,"z","x",r,n);break;case 3:g.set(0,-1,0),u[m+0]=1-Ue(g,l,"x","z",r,t),u[m+1]=1-Ue(g,l,"z","x",r,n);break;case 4:g.set(0,0,1),u[m+0]=1-Ue(g,l,"x","y",r,t),u[m+1]=1-Ue(g,l,"y","x",r,e);break;case 5:g.set(0,0,-1),u[m+0]=Ue(g,l,"x","y",r,t),u[m+1]=1-Ue(g,l,"y","x",r,e);break}}}class Tv extends Oc{constructor(){super();const t=new Jn;t.deleteAttribute("uv");const e=new Zs({side:xe}),n=new Zs,s=new _v(16777215,900,28,2);s.position.set(.418,16.199,.3),this.add(s);const r=new jt(t,e);r.position.set(-.757,13.219,.717),r.scale.set(31.713,28.305,28.591),this.add(r);const a=new jt(t,n);a.position.set(-10.906,2.009,1.846),a.rotation.set(0,-.195,0),a.scale.set(2.328,7.905,4.651),this.add(a);const o=new jt(t,n);o.position.set(-5.607,-.754,-.758),o.rotation.set(0,.994,0),o.scale.set(1.97,1.534,3.955),this.add(o);const l=new jt(t,n);l.position.set(6.167,.857,7.803),l.rotation.set(0,.561,0),l.scale.set(3.927,6.285,3.687),this.add(l);const c=new jt(t,n);c.position.set(-2.017,.018,6.124),c.rotation.set(0,.333,0),c.scale.set(2.002,4.566,2.064),this.add(c);const h=new jt(t,n);h.position.set(2.291,-.756,-2.621),h.rotation.set(0,-.286,0),h.scale.set(1.546,1.552,1.496),this.add(h);const d=new jt(t,n);d.position.set(-2.193,-.369,-5.547),d.rotation.set(0,.516,0),d.scale.set(3.875,3.487,2.986),this.add(d);const u=new jt(t,pi(50));u.position.set(-16.116,14.37,8.208),u.scale.set(.1,2.428,2.739),this.add(u);const f=new jt(t,pi(50));f.position.set(-16.109,18.021,-8.207),f.scale.set(.1,2.425,2.751),this.add(f);const g=new jt(t,pi(17));g.position.set(14.904,12.198,-1.832),g.scale.set(.15,4.265,6.331),this.add(g);const x=new jt(t,pi(43));x.position.set(-.462,8.89,14.52),x.scale.set(4.38,5.441,.088),this.add(x);const p=new jt(t,pi(20));p.position.set(3.235,11.486,-12.541),p.scale.set(2.5,2,.1),this.add(p);const m=new jt(t,pi(100));m.position.set(0,20,0),m.scale.set(1,.1,1),this.add(m)}dispose(){const t=new Set;this.traverse(e=>{e.isMesh&&(t.add(e.geometry),t.add(e.material))});for(const e of t)e.dispose()}}function pi(i){const t=new nr;return t.color.setScalar(i),t}const Av=[new R(1,0,0),new R(0,1,0),new R(0,0,1)],Rv=i=>1-Math.pow(1-i,3),Hs=i=>i<.5?4*i*i*i:1-Math.pow(-2*i+2,3)/2;class Cv{constructor(t,{clock:e=()=>performance.now()}={}){this.model=t,this.clock=e,this.listeners={},this.tweens=[],this.turning=null,this.demo=null,this.cube=new wn,this.pivot=new wn,this.cube.add(this.pivot),this.pieceObjects=new Map;for(const n of t.pieces){const s=new wn;s.userData.pieceId=n.id,this.cube.add(s),this.pieceObjects.set(n.id,s)}this.syncAll()}on(t,e){(this.listeners[t]||=[]).push(e)}emit(t,e){(this.listeners[t]||[]).forEach(n=>n(e))}syncPiece(t){const e=this.pieceObjects.get(t.id);e.position.set(t.pos[0],t.pos[1],t.pos[2]);const[n,s,r]=t.rot,a=new Qt().makeBasis(new R(...n),new R(...s),new R(...r));e.quaternion.setFromRotationMatrix(a)}syncAll(){this.demo=null,this.cancelTurn();for(const t of this.model.pieces)this.syncPiece(t)}get busy(){return!!this.turning&&!this.turning.demo}beginTurn(t,e){this.stopDemo(),this.turning&&this.cancelTurn(),this.pivot.quaternion.identity();const n=this.model.piecesInLayer(t,e).map(s=>s.id);for(const s of n)this.pivot.attach(this.pieceObjects.get(s));return this.turning={axis:t,layer:e,ids:n,angle:0,tween:null},this.turning}setTurnAngle(t){this.turning&&(this.turning.angle=t,this.pivot.quaternion.setFromAxisAngle(Av[this.turning.axis],t))}finishTurn(t,e=180,n=Rv){const s=this.turning;if(!s||s.demo)return Promise.resolve(!1);s.tween&&this.cancelTween(s.tween);const r=s.angle,a=t*Math.PI/2,o=Math.max(40,e*Math.min(1.6,Math.abs(a-r)/(Math.PI/2)+.25)),l=this.tween(o,c=>{this.turning===s&&this.setTurnAngle(r+(a-r)*n(c))});return s.tween=l.entry,l.then(c=>{if(!c||this.turning!==s)return!1;this.releasePieces(s),this.turning=null,this.model.turn(s.axis,s.layer,t);for(const h of s.ids)this.syncPiece(this.model.pieces[h]);return this.emit("turned",{axis:s.axis,layer:s.layer,q:t}),!0})}animateTurn(t,e,n,s=220){return this.beginTurn(t,e),this.finishTurn(n,s,Hs)}cancelTurn(){const t=this.turning;if(t){this.turning=null,t.tween&&this.cancelTween(t.tween),this.releasePieces(t);for(const e of t.ids)this.syncPiece(this.model.pieces[e])}}releasePieces(t){this.pivot.quaternion.identity();for(const e of t.ids)this.cube.add(this.pieceObjects.get(e))}startDemo(t){if(this.stopDemo(),this.turning)return;const e=t.q===2?1:Math.sign(t.q);this.beginTurn(t.axis,t.layer).demo=!0,this.demo={sign:e,start:this.clock()}}stopDemo(){this.demo&&(this.demo=null,this.turning&&this.turning.demo&&this.cancelTurn())}tween(t,e){let n;const s=new Promise(r=>{n={start:this.clock(),duration:t,fn:e,resolve:r},this.tweens.push(n)});return s.entry=n,s}cancelTween(t){const e=this.tweens.indexOf(t);e>=0&&this.tweens.splice(e,1),t.resolve(!1)}update(t=this.clock()){if(this.tweens.length){const e=this.tweens;this.tweens=[];const n=[];for(const s of e){const r=Math.min(1,(t-s.start)/s.duration);s.fn(r),r>=1?s.resolve(!0):n.push(s)}this.tweens=n.concat(this.tweens)}if(this.demo&&this.turning&&this.turning.demo){const n=(t-this.demo.start)/1e3%1.6/1.6,s=.38*Math.sin(Math.PI*Math.min(1,n/.7))*(n<.7?1:0);this.setTurnAngle(this.demo.sign*s)}}}const Ps=.97,Ls=.765,mi=[new R(1,0,0),new R(0,1,0),new R(0,0,1)];function Pv(){const i=Ls/2-.006,t=.075,e=new Gc;e.moveTo(-i+t,-i),e.lineTo(i-t,-i),e.quadraticCurveTo(i,-i,i,-i+t),e.lineTo(i,i-t),e.quadraticCurveTo(i,i,i-t,i),e.lineTo(-i+t,i),e.quadraticCurveTo(-i,i,-i,i-t),e.lineTo(-i,-i+t),e.quadraticCurveTo(-i,-i,-i+t,-i);const n=new go(e,{depth:.006,bevelEnabled:!0,bevelThickness:.005,bevelSize:.006,bevelSegments:3,curveSegments:6}),s=n.attributes.position,r=n.attributes.uv,a=Ls/2;for(let o=0;o<s.count;o++)r.setXY(o,(s.getX(o)+a)/Ls,(s.getY(o)+a)/Ls);return r.needsUpdate=!0,n.computeVertexNormals(),n}function Lv(){const i=document.createElement("canvas");i.width=i.height=256;const t=i.getContext("2d"),e=t.createRadialGradient(128,128,0,128,128,128);return e.addColorStop(0,"rgba(0,0,0,0.55)"),e.addColorStop(.45,"rgba(0,0,0,0.25)"),e.addColorStop(1,"rgba(0,0,0,0)"),t.fillStyle=e,t.fillRect(0,0,256,256),new ho(i)}class Yc{constructor({container:t,model:e,appearance:n,shadows:s=!0,groundShadow:r=!0,pixelRatioCap:a=2}){this.container=t,this.model=e,this.appearance=n,this.zoom=1,this.listeners={},this.hint=null,this.spin=new it;const o=new Bg({antialias:!0,alpha:!0,powerPreference:"high-performance"});o.setPixelRatio(Math.min(window.devicePixelRatio||1,a)),o.setClearColor(0,0),o.outputColorSpace=Re,o.toneMapping=ac,o.toneMappingExposure=1.05,o.shadowMap.enabled=s,o.shadowMap.type=sc,t.appendChild(o.domElement),this.renderer=o,this.canvas=o.domElement;const l=new Oc,c=new Ha(o);l.environment=c.fromScene(new Tv,.04).texture,l.environmentIntensity=.9,this.scene=l,this.camera=new Ce(30,1,.1,100);const h=new Bl(16777215,2.2);h.position.set(-4,7,6),h.castShadow=s,h.shadow.mapSize.set(2048,2048),Object.assign(h.shadow.camera,{left:-3.2,right:3.2,top:3.2,bottom:-3.2,near:1,far:20}),h.shadow.bias=-4e-4,h.shadow.normalBias=.025,h.shadow.radius=3,l.add(h);const d=new Bl(14674175,.8);if(d.position.set(5,2,-5),l.add(d),l.add(new gv(16777215,2763312,.35)),r){const u=new jt(new ns(6,6),new nr({map:Lv(),transparent:!0,depthWrite:!1}));u.rotation.x=-Math.PI/2,u.position.y=-2.9,l.add(u),this.groundShadow=u}this.rig=new Cv(e),this.rig.on("turned",u=>this.emit("turned",u)),this.cube=this.rig.cube,this.pivot=this.rig.pivot,this.pieceObjects=this.rig.pieceObjects,this.cube.quaternion.setFromEuler(new Ve(.52,-.68,0,"XYZ")),this.homeQuaternion=this.cube.quaternion.clone(),l.add(this.cube),this.buildPieces(),this.buildHintArrow(),this.raycaster=new Mv,this.resizeObserver=new ResizeObserver(()=>this.resize()),this.resizeObserver.observe(t),this.resize(),this.clock=new yv,this.running=!0,o.setAnimationLoop(()=>this.frame())}on(t,e){(this.listeners[t]||=[]).push(e)}emit(t,e){(this.listeners[t]||[]).forEach(n=>n(e))}buildPieces(){const t=new wv(Ps,Ps,Ps,4,.075),e=Pv();this.stickerMeshes=[],this.pickables=[];for(const n of this.model.pieces){const s=this.pieceObjects.get(n.id),r=new jt(t,this.appearance.bodyMaterial);r.castShadow=r.receiveShadow=!0,s.add(r),this.pickables.push(r);for(let a=0;a<6;a++){const o=rn[a],l=o[0]?0:o[1]?1:2;if(n.home[l]!==o[l])continue;const c=Ya[a],h=ec[a],d=n.home[0]*c[0]+n.home[1]*c[1]+n.home[2]*c[2]+1,u=1-(n.home[0]*h[0]+n.home[1]*h[1]+n.home[2]*h[2]),f=new jt(e,this.appearance.material(a,u,d));f.userData={face:a,row:u,col:d},f.receiveShadow=!0;const g=new Qt().makeBasis(new R(...c),new R(...h),new R(...o));f.quaternion.setFromRotationMatrix(g),f.position.set(o[0],o[1],o[2]).multiplyScalar(Ps/2-.004),s.add(f),this.stickerMeshes.push(f),this.pickables.push(f)}}}refreshMaterials(){for(const t of this.stickerMeshes)t.material=this.appearance.material(t.userData.face,t.userData.row,t.userData.col)}get turning(){return this.rig.turning}get demo(){return this.rig.demo}get tweens(){return this.rig.tweens}get busy(){return this.rig.busy}syncPiece(t){this.rig.syncPiece(t)}syncAll(){this.rig.syncAll()}beginTurn(t,e){return this.rig.beginTurn(t,e)}setTurnAngle(t){this.rig.setTurnAngle(t)}finishTurn(t,e,n){return this.rig.finishTurn(t,e,n)}animateTurn(t,e,n,s){return this.rig.animateTurn(t,e,n,s)}cancelTurnVisual(){this.rig.cancelTurn()}buildHintArrow(){const t=new wn,e=new Zs({color:16777215,emissive:11824127,emissiveIntensity:.9,roughness:.3,transparent:!0,opacity:.95}),n=1.05,s=-Math.PI*.62,r=Math.PI*.42,a=new Ge;a.getPoint=h=>{const d=s+(r-s)*h;return new R(Math.cos(d)*n,Math.sin(d)*n,0)},t.add(new jt(new vo(a,48,.055,10,!1),e));const o=new jt(new mo(.16,.36,18),e);o.position.set(Math.cos(r)*n,Math.sin(r)*n,0),o.rotation.z=r,t.add(o);const l=o.clone(),c=(s+r)/2;l.position.set(Math.cos(c)*n,Math.sin(c)*n,0),l.rotation.z=c,t.add(l),t.visible=!1,this.arrow={group:t,double:l,mat:e},this.cube.add(t)}showHint(t){const{axis:e,layer:n,q:s}=t,r=this.arrow,a=mi[e].clone().multiplyScalar(s<0&&s!==2?-1:1),o=new hn().setFromUnitVectors(new R(0,0,1),a);r.group.quaternion.copy(o);const l=n===0?0:n*1.72;r.group.position.copy(mi[e]).multiplyScalar(l),r.group.scale.setScalar(n===0?1.55:1),r.double.visible=Math.abs(s)===2,r.group.visible=!0,this.hint={...t,t0:performance.now()},this.startDemo(t)}hideHint(){this.arrow.group.visible=!1,this.hint=null,this.stopDemo()}startDemo(t){this.rig.startDemo(t)}stopDemo(){this.rig.stopDemo()}layerFacesAway(t,e){if(e===0)return!1;const n=mi[t].clone().multiplyScalar(e).applyQuaternion(this.cube.quaternion),s=this.camera.position.clone().normalize();return n.dot(s)<.2}bringFaceIntoView(t,e,n=650){const s=mi[t].clone().multiplyScalar(e||1).applyQuaternion(this.cube.quaternion).normalize(),r=new R(.45,.5,1).normalize(),a=new hn().setFromUnitVectors(s,r),o=this.cube.quaternion.clone(),l=a.multiply(o);return this.spin.set(0,0),this.tween(n,c=>this.cube.quaternion.slerpQuaternions(o,l,Hs(c)))}rotateView(t,e){const n=new hn().setFromAxisAngle(mi[1],t),s=new hn().setFromAxisAngle(mi[0],e);this.cube.quaternion.premultiply(n).premultiply(s),this.emit("viewRotate",Math.abs(t)+Math.abs(e))}resetView(t=500){const e=this.cube.quaternion.clone();return this.spin.set(0,0),this.tween(t,n=>this.cube.quaternion.slerpQuaternions(e,this.homeQuaternion,Hs(n)))}setShift(t,e=260){const n=this.shift||0;return this.shiftTarget=t,this.tween(e,s=>{this.shift=n+(t-n)*Hs(s),this.updateCamera()})}setZoom(t){this.zoom=Math.max(.55,Math.min(1.8,t)),this.updateCamera()}resize(){const t=this.container.clientWidth||1,e=this.container.clientHeight||1;this.renderer.setSize(t,e,!1),this.canvas.style.width="100%",this.canvas.style.height="100%",this.camera.aspect=t/e,this.updateCamera()}updateCamera(){const e=bu.degToRad(this.camera.fov),n=2*Math.atan(Math.tan(e/2)*this.camera.aspect),s=3/Math.sin(Math.min(e,n)/2);this.camera.position.set(0,0,s/this.zoom),this.camera.lookAt(0,0,0);const r=this.container.clientWidth||1,a=this.container.clientHeight||1;this.shift?this.camera.setViewOffset(r,a,this.shift,0,r,a):this.camera.clearViewOffset(),this.camera.updateProjectionMatrix()}ndc(t,e){const n=this.canvas.getBoundingClientRect();return new it((t-n.left)/n.width*2-1,-((e-n.top)/n.height)*2+1)}pick(t,e){this.raycaster.setFromCamera(this.ndc(t,e),this.camera);const n=this.raycaster.intersectObjects(this.pickables,!1)[0];if(!n)return null;let s=n.object;for(;s&&s.userData.pieceId===void 0;)s=s.parent;const r=this.cube.worldToLocal(n.point.clone()),a=[Math.abs(r.x),Math.abs(r.y),Math.abs(r.z)],o=a.indexOf(Math.max(...a));return{pieceId:s.userData.pieceId,local:r,faceAxis:o,faceSign:Math.sign(r.getComponent(o))}}projectLocal(t){const e=this.cube.localToWorld(t.clone()).project(this.camera),n=this.canvas.getBoundingClientRect();return new it((e.x+1)/2*n.width,(1-e.y)/2*n.height)}tween(t,e){return this.rig.tween(t,e)}frame(){const t=Math.min(.05,this.clock.getDelta()),e=performance.now();if(this.rig.update(e),this.spin.lengthSq()>1e-6&&(this.rotateView(this.spin.x*t,this.spin.y*t),this.spin.multiplyScalar(Math.pow(.02,t))),this.onFrame&&this.onFrame(t),this.hint){const n=.75+.25*Math.sin((e-this.hint.t0)/180);this.arrow.mat.emissiveIntensity=n}this.renderer.render(this.scene,this.camera)}dispose(){this.renderer.setAnimationLoop(null),this.resizeObserver.disconnect(),this.renderer.dispose(),this.canvas.remove()}}const Kc=80,Dv=.09,Uv=Math.PI/2;function Gl(i,t,e){for(i.push({t,angle:e});i.length>2&&t-i[1].t>Kc;)i.shift();return i}function Iv(i,t,e){const n=i.filter(r=>t-r.t<=Kc);if(!n.length)return 0;const s=Math.max(t-n[0].t,16)/1e3;return(e-n[0].angle)/s}function Nv(i,t,e){const n=Iv(i,t,e),s=Math.round((e+n*Dv)/Uv);return Math.max(-2,Math.min(2,s))}const Fv=[new R(1,0,0),new R(0,1,0),new R(0,0,1)],Ds=.0085,Wl=2,Ov=7;class Bv{constructor(t,{canTwist:e=()=>!0,onZoom:n=()=>{},onTwistStart:s=()=>{}}={}){this.view=t,this.canTwist=e,this.onZoom=n,this.onTwistStart=s,this.enabled=!0,this.pointers=new Map,this.mode=null,this.keys=new Set;const r=t.canvas;r.style.touchAction="none",r.addEventListener("pointerdown",a=>this.down(a)),r.addEventListener("pointermove",a=>this.move(a)),r.addEventListener("pointerup",a=>this.up(a)),r.addEventListener("pointercancel",a=>this.up(a,!0)),r.addEventListener("wheel",a=>{a.preventDefault(),this.onZoom(t.zoom*Math.exp(-a.deltaY*.0012))},{passive:!1}),r.addEventListener("contextmenu",a=>a.preventDefault()),window.addEventListener("keydown",a=>{if(zv(a))return;const o=Xl(a);o&&(this.keys.add(o),a.preventDefault())}),window.addEventListener("keyup",a=>this.keys.delete(Xl(a))),window.addEventListener("blur",()=>this.keys.clear()),t.onFrame=a=>this.frame(a)}frame(t){if(!this.enabled||!this.keys.size)return;let e=0,n=0;this.keys.has("left")&&(e-=1),this.keys.has("right")&&(e+=1),this.keys.has("up")&&(n-=1),this.keys.has("down")&&(n+=1),(e||n)&&(this.view.spin.set(0,0),this.view.rotateView(e*Wl*t,n*Wl*t))}down(t){if(!this.enabled)return;if(this.view.canvas.setPointerCapture(t.pointerId),this.pointers.set(t.pointerId,{x:t.clientX,y:t.clientY}),this.pointers.size===2){this.mode==="twist"&&this.view.finishTurn(0);const[n,s]=[...this.pointers.values()];this.mode="pinch",this.pinch={dist:Math.hypot(n.x-s.x,n.y-s.y),zoom:this.view.zoom};return}if(this.pointers.size>2)return;this.view.spin.set(0,0),this.start={x:t.clientX,y:t.clientY,t:performance.now()},this.last={x:t.clientX,y:t.clientY,t:performance.now()},this.velocity=new it;const e=this.view.pick(t.clientX,t.clientY);e&&this.canTwist()&&!this.view.busy?(this.mode="twist-pending",this.hit=e):this.mode="rotate"}move(t){const e=this.pointers.get(t.pointerId);if(!e)return;if(e.x=t.clientX,e.y=t.clientY,this.mode==="pinch"&&this.pointers.size>=2){const[o,l]=[...this.pointers.values()],c=Math.hypot(o.x-l.x,o.y-l.y);this.onZoom(this.pinch.zoom*(c/Math.max(1,this.pinch.dist)));return}const n=performance.now(),s=t.clientX-this.last.x,r=t.clientY-this.last.y,a=Math.max(1,n-this.last.t);if(this.mode==="rotate")this.view.rotateView(s*Ds,r*Ds),this.velocity.set(s*Ds/(a/1e3),r*Ds/(a/1e3));else if(this.mode==="twist-pending"){const o=new it(t.clientX-this.start.x,t.clientY-this.start.y);o.length()>Ov&&this.beginTwist(o)}if(this.mode==="twist"){const l=new it(t.clientX-this.start.x,t.clientY-this.start.y).dot(this.twist.screenDir)/this.twist.pxPerRad;this.twist.angle=l,Gl(this.twist.samples,n,l),this.view.setTurnAngle(l)}this.last={x:t.clientX,y:t.clientY,t:n}}beginTwist(t){const{local:e,faceAxis:n,pieceId:s}=this.hit,r=this.view.model.pieces.find(l=>l.id===s),a=this.view.projectLocal(e);let o=null;for(let l=0;l<3;l++){if(l===n)continue;const c=.05,h=new R().crossVectors(Fv[l],e).multiplyScalar(c),d=this.view.projectLocal(e.clone().add(h)).sub(a),u=d.length();if(u<1e-4)continue;const f=Math.abs(t.dot(d)/u);(!o||f>o.score)&&(o={axis:l,score:f,screenDir:d.clone().normalize(),pxPerRad:u/c})}if(!o||this.view.busy){this.mode="rotate";return}this.twist={axis:o.axis,layer:r.pos[o.axis],screenDir:o.screenDir,pxPerRad:o.pxPerRad,angle:0,samples:[]},Gl(this.twist.samples,this.start.t,0),this.view.beginTurn(this.twist.axis,this.twist.layer),this.onTwistStart({...this.twist,startedAt:this.start.t}),this.mode="twist"}up(t,e=!1){if(this.pointers.has(t.pointerId)){if(this.pointers.delete(t.pointerId),this.mode==="pinch"){this.pointers.size===0&&(this.mode=null);return}if(this.mode==="twist"){const n=this.twist,s=e?0:Nv(n.samples,performance.now(),n.angle);this.view.finishTurn(s)}else this.mode==="rotate"&&performance.now()-this.last.t<60&&this.view.spin.copy(this.velocity).clampLength(0,9);this.mode=null}}}function zv(i){const t=i.target;return t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"||t.tagName==="SELECT"||t.isContentEditable)}function Xl(i){switch(i.code){case"KeyW":case"ArrowUp":return"up";case"KeyS":case"ArrowDown":return"down";case"KeyA":case"ArrowLeft":return"left";case"KeyD":case"ArrowRight":return"right";default:return null}}const un=[{id:"very-easy-01",difficulty:"very-easy",number:1,scramble:"L",optimal:1},{id:"very-easy-02",difficulty:"very-easy",number:2,scramble:"R'",optimal:1},{id:"very-easy-03",difficulty:"very-easy",number:3,scramble:"D",optimal:1},{id:"very-easy-04",difficulty:"very-easy",number:4,scramble:"R2",optimal:1},{id:"very-easy-05",difficulty:"very-easy",number:5,scramble:"F",optimal:1},{id:"very-easy-06",difficulty:"very-easy",number:6,scramble:"F2",optimal:1},{id:"very-easy-07",difficulty:"very-easy",number:7,scramble:"B2",optimal:1},{id:"very-easy-08",difficulty:"very-easy",number:8,scramble:"L2",optimal:1},{id:"very-easy-09",difficulty:"very-easy",number:9,scramble:"B'",optimal:1},{id:"very-easy-10",difficulty:"very-easy",number:10,scramble:"R F",optimal:2},{id:"very-easy-11",difficulty:"very-easy",number:11,scramble:"R F'",optimal:2},{id:"very-easy-12",difficulty:"very-easy",number:12,scramble:"B2 L",optimal:2},{id:"very-easy-13",difficulty:"very-easy",number:13,scramble:"R2 U2",optimal:2},{id:"very-easy-14",difficulty:"very-easy",number:14,scramble:"B' D",optimal:2},{id:"very-easy-15",difficulty:"very-easy",number:15,scramble:"R2 F",optimal:2},{id:"very-easy-16",difficulty:"very-easy",number:16,scramble:"B L",optimal:2},{id:"very-easy-17",difficulty:"very-easy",number:17,scramble:"U' B2",optimal:2},{id:"very-easy-18",difficulty:"very-easy",number:18,scramble:"R D2 L",optimal:3},{id:"very-easy-19",difficulty:"very-easy",number:19,scramble:"L' D' R",optimal:3},{id:"very-easy-20",difficulty:"very-easy",number:20,scramble:"B R F'",optimal:3},{id:"very-easy-21",difficulty:"very-easy",number:21,scramble:"D' L U'",optimal:3},{id:"very-easy-22",difficulty:"very-easy",number:22,scramble:"U2 R2 L",optimal:3},{id:"very-easy-23",difficulty:"very-easy",number:23,scramble:"F2 U' R'",optimal:3},{id:"very-easy-24",difficulty:"very-easy",number:24,scramble:"F D2 B",optimal:3},{id:"very-easy-25",difficulty:"very-easy",number:25,scramble:"B2 D B",optimal:3},{id:"easy-01",difficulty:"easy",number:1,scramble:"D' L B' R2",optimal:4},{id:"easy-02",difficulty:"easy",number:2,scramble:"U R D' B2",optimal:4},{id:"easy-03",difficulty:"easy",number:3,scramble:"F' D2 L B",optimal:4},{id:"easy-04",difficulty:"easy",number:4,scramble:"R2 L D2 F'",optimal:4},{id:"easy-05",difficulty:"easy",number:5,scramble:"U' D2 L' D'",optimal:4},{id:"easy-06",difficulty:"easy",number:6,scramble:"B D' F B'",optimal:4},{id:"easy-07",difficulty:"easy",number:7,scramble:"F2 U2 F D2",optimal:4},{id:"easy-08",difficulty:"easy",number:8,scramble:"U2 F2 B2 D2",optimal:4},{id:"easy-09",difficulty:"easy",number:9,scramble:"L2 B2 D2 F'",optimal:4},{id:"easy-10",difficulty:"easy",number:10,scramble:"U B' R U2 B2",optimal:5},{id:"easy-11",difficulty:"easy",number:11,scramble:"D' R2 L2 B R2",optimal:5},{id:"easy-12",difficulty:"easy",number:12,scramble:"U D' B2 D' L2",optimal:5},{id:"easy-13",difficulty:"easy",number:13,scramble:"R' F L' D' R'",optimal:5},{id:"easy-14",difficulty:"easy",number:14,scramble:"R2 U D' B2 R",optimal:5},{id:"easy-15",difficulty:"easy",number:15,scramble:"F B' L2 D2 B2",optimal:5},{id:"easy-16",difficulty:"easy",number:16,scramble:"R U' D2 B' L'",optimal:5},{id:"easy-17",difficulty:"easy",number:17,scramble:"L D F2 B' L2",optimal:5},{id:"easy-18",difficulty:"easy",number:18,scramble:"R' L D' L2 F' D2",optimal:6},{id:"easy-19",difficulty:"easy",number:19,scramble:"R' D' B2 R D2 B",optimal:6},{id:"easy-20",difficulty:"easy",number:20,scramble:"U' L2 F2 U' B' U2",optimal:6},{id:"easy-21",difficulty:"easy",number:21,scramble:"D B' R L2 F2 U'",optimal:6},{id:"easy-22",difficulty:"easy",number:22,scramble:"D' L U2 F2 D' F'",optimal:6},{id:"easy-23",difficulty:"easy",number:23,scramble:"F2 B' D2 F R2 D",optimal:6},{id:"easy-24",difficulty:"easy",number:24,scramble:"R' F2 B' U' L F'",optimal:6},{id:"easy-25",difficulty:"easy",number:25,scramble:"L' D' L D2 F L'",optimal:6},{id:"medium-01",difficulty:"medium",number:1,scramble:"F' D2 L B2 L' B U'",optimal:7},{id:"medium-02",difficulty:"medium",number:2,scramble:"F U' F' L' F2 L D2",optimal:7},{id:"medium-03",difficulty:"medium",number:3,scramble:"B2 R U2 F2 U2 F R2",optimal:7},{id:"medium-04",difficulty:"medium",number:4,scramble:"B2 R2 D' F2 D' B2 U'",optimal:7},{id:"medium-05",difficulty:"medium",number:5,scramble:"D2 B' U2 D' R2 U' B'",optimal:7},{id:"medium-06",difficulty:"medium",number:6,scramble:"L' F D' F2 D F B2",optimal:7},{id:"medium-07",difficulty:"medium",number:7,scramble:"L' B D2 R2 L U' R",optimal:7},{id:"medium-08",difficulty:"medium",number:8,scramble:"R L' B' D L' D' R",optimal:7},{id:"medium-09",difficulty:"medium",number:9,scramble:"B2 U D' B' R2 D' B'",optimal:7},{id:"medium-10",difficulty:"medium",number:10,scramble:"L' U' R' F' D2 L U2 F2",optimal:8},{id:"medium-11",difficulty:"medium",number:11,scramble:"D2 L2 B' D' L' U' F B'",optimal:8},{id:"medium-12",difficulty:"medium",number:12,scramble:"U2 F B' R2 D' R' U L'",optimal:8},{id:"medium-13",difficulty:"medium",number:13,scramble:"F' U B L' U' B2 L2 B2",optimal:8},{id:"medium-14",difficulty:"medium",number:14,scramble:"B2 L F L B U2 D2 F2",optimal:8},{id:"medium-15",difficulty:"medium",number:15,scramble:"U' F D2 B R' L' B' D",optimal:8},{id:"medium-16",difficulty:"medium",number:16,scramble:"L U D2 B L2 D' R' U2",optimal:8},{id:"medium-17",difficulty:"medium",number:17,scramble:"L' F' L' U B2 U R2 F",optimal:8},{id:"medium-18",difficulty:"medium",number:18,scramble:"B D' F L2 U' D2 R' F' L",optimal:9},{id:"medium-19",difficulty:"medium",number:19,scramble:"L' F R L2 B' L2 U R F2",optimal:9},{id:"medium-20",difficulty:"medium",number:20,scramble:"F' R2 F L U B2 U2 R F'",optimal:9},{id:"medium-21",difficulty:"medium",number:21,scramble:"U F' L' U' D2 R D L' B2",optimal:9},{id:"medium-22",difficulty:"medium",number:22,scramble:"B U B R D2 R F' B U2",optimal:9},{id:"medium-23",difficulty:"medium",number:23,scramble:"D' L D2 F' U2 B2 L B L2",optimal:9},{id:"medium-24",difficulty:"medium",number:24,scramble:"R' F D R F' L2 B R B'",optimal:9},{id:"medium-25",difficulty:"medium",number:25,scramble:"B R' B L D R2 D' R D'",optimal:9},{id:"hard-01",difficulty:"hard",number:1,scramble:"B' L' D2 L2 D L' U D' R2 U2",optimal:10},{id:"hard-02",difficulty:"hard",number:2,scramble:"D B' D2 B2 L B2 L' D2 L2 B'",optimal:10},{id:"hard-03",difficulty:"hard",number:3,scramble:"D' B' U R2 B' R' D' L2 U2 F2",optimal:10},{id:"hard-04",difficulty:"hard",number:4,scramble:"D' L B D F2 L2 D' F' U2 L",optimal:10},{id:"hard-05",difficulty:"hard",number:5,scramble:"R2 B U' B' R B' R2 L2 F' U",optimal:10},{id:"hard-06",difficulty:"hard",number:6,scramble:"F2 B' R F' L U R2 B' U L2",optimal:10},{id:"hard-07",difficulty:"hard",number:7,scramble:"R' B' L B2 R' B' L2 D' R2 F",optimal:10},{id:"hard-08",difficulty:"hard",number:8,scramble:"F2 B' U D' F' B' L' B2 R2 L2",optimal:10},{id:"hard-09",difficulty:"hard",number:9,scramble:"D B2 D2 R2 B2 L U' L2 D2 L",optimal:10},{id:"hard-10",difficulty:"hard",number:10,scramble:"U' R' B' L D' R' B' R2 U B D'",optimal:11},{id:"hard-11",difficulty:"hard",number:11,scramble:"R F2 U' B D R U B L B2 D2",optimal:11},{id:"hard-12",difficulty:"hard",number:12,scramble:"L B2 R D' R F L U2 L D R'",optimal:11},{id:"hard-13",difficulty:"hard",number:13,scramble:"F' U F2 L' B2 R' F' D' R L B",optimal:11},{id:"hard-14",difficulty:"hard",number:14,scramble:"D2 L2 D' R' L' D R' U2 F' D B'",optimal:11},{id:"hard-15",difficulty:"hard",number:15,scramble:"F' U2 F' R2 L' U R' D R' L B2",optimal:11},{id:"hard-16",difficulty:"hard",number:16,scramble:"U' L' B U' R2 U2 R2 B U R' F'",optimal:11},{id:"hard-17",difficulty:"hard",number:17,scramble:"F U' D' R B2 U' B2 U' F' D L2",optimal:11},{id:"hard-18",difficulty:"hard",number:18,scramble:"R F' R2 D L U' L' U D' B D R'",optimal:12},{id:"hard-19",difficulty:"hard",number:19,scramble:"D2 R' U2 F' B2 R2 L2 F L2 U F U'",optimal:12},{id:"hard-20",difficulty:"hard",number:20,scramble:"R2 U D' F D' R F' L' F2 U D' F2",optimal:12},{id:"hard-21",difficulty:"hard",number:21,scramble:"L D2 R' F2 R U' D2 L2 U' D2 R L2",optimal:12},{id:"hard-22",difficulty:"hard",number:22,scramble:"U2 R2 L B2 R' L' F' U B D2 L U",optimal:12},{id:"hard-23",difficulty:"hard",number:23,scramble:"R2 B2 U B2 D' R U D' L' F L2 U2",optimal:12},{id:"hard-24",difficulty:"hard",number:24,scramble:"U D B L2 D R2 U D2 R' F2 R2 B'",optimal:12},{id:"hard-25",difficulty:"hard",number:25,scramble:"F' B L2 U2 F L B' L2 D' L U2 D",optimal:12}],Tn=[{id:"very-easy",name:"Very Easy",range:[1,3]},{id:"easy",name:"Easy",range:[4,6]},{id:"medium",name:"Medium",range:[7,9]},{id:"hard",name:"Hard",range:[10,12]}],kv=1,Hv=14;function Vs(i){return Tn.find(t=>t.id===i)}const Js=[{id:"novice",name:"Novice",secPerMove:4.6,mistakeRate:.35,inspect:5},{id:"club",name:"Club",secPerMove:2.7,mistakeRate:.18,inspect:3.5},{id:"expert",name:"Expert",secPerMove:1.4,mistakeRate:.06,inspect:2.2},{id:"master",name:"Master",secPerMove:.7,mistakeRate:0,inspect:1.4},{id:"machine",name:"Machine",secPerMove:.3,mistakeRate:0,inspect:.6}];class yo{constructor(){this.fns=new Set}onEvent(t){return this.fns.add(t),()=>this.fns.delete(t)}emit(t){this.fns.forEach(e=>e(t))}}class Vv extends yo{constructor(t){super(),this.id="local",this.name=t,this.kind="local"}start(){}stop(){}reportMove(t,e){this.emit({type:"move",move:t,count:e})}reportFinished(t,e){this.emit({type:"finished",timeMs:t,moves:e})}}class Gv extends yo{constructor(t,e){super(),this.level=Js.find(n=>n.id===t)||Js[1],this.id="cpu",this.kind="computer",this.name=`CPU · ${this.level.name}`,this.plan=this.buildPlan(e),this.timer=null}buildPlan(t){const e=[];for(const n of t){if(Math.random()<this.level.mistakeRate){let s;do s=Math.floor(Math.random()*18);while(Math.floor(s/3)===Math.floor(n/3));e.push({move:s,pause:1},{move:_h(s),pause:1.8})}e.push({move:n,pause:1})}return e}start(t,e){let n=0,s=0;const r=e,a=()=>{if(n>=this.plan.length){this.emit({type:"finished",timeMs:Date.now()-r,moves:s});return}const l=this.plan[n++];s++,this.emit({type:"move",move:l.move,count:s,remaining:this.plan.length-n}),this.timer=setTimeout(a,this.delay(l.pause))},o=Math.max(0,e-Date.now())+this.level.inspect*1e3*(.7+Math.random()*.6);this.timer=setTimeout(a,o)}delay(t){const e=.6+Math.random()*.8;return Math.max(120,this.level.secPerMove*1e3*t*e)}stop(){clearTimeout(this.timer),this.timer=null}}class Wv extends yo{constructor({puzzle:t,participants:e,id:n=null}){super(),this.id=n||`race-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`,this.puzzle=t,this.participants=e,this.results=new Map,this.state="pending",this.unsubs=e.map(s=>s.onEvent(r=>this.handle(s,r)))}start(t=3e3){this.startAt=Date.now()+t,this.state="countdown",this.participants.forEach(e=>e.start(this.puzzle,this.startAt)),this.emit({type:"countdown",startAt:this.startAt}),this.startTimer=setTimeout(()=>{this.state="racing",this.emit({type:"go"})},t)}handle(t,e){this.state!=="finished"&&(e.type==="move"&&this.emit({...e,type:"progress",participant:t}),e.type==="finished"&&!this.results.has(t.id)&&(this.results.set(t.id,e),this.results.size===1&&(this.winner=t,this.emit({...e,type:"winner",participant:t})),this.results.size===this.participants.length&&this.end()))}end(){this.state="finished",clearTimeout(this.startTimer),this.participants.forEach(t=>t.stop()),this.unsubs.forEach(t=>t()),this.emit({type:"ended",winner:this.winner})}}function Xn(i,t){try{const e=localStorage.getItem(i);return e?JSON.parse(e):t}catch{return t}}const $a=new Set;function Xv(i){return $a.add(i),()=>$a.delete(i)}function Mo(i,t){$a.forEach(e=>e({key:i,error:t}))}function $n(i,t){try{return localStorage.setItem(i,JSON.stringify(t)),!0}catch(e){return Mo(i,e),!1}}function $l(i){try{return localStorage.removeItem(i),!0}catch(t){return Mo(i,t),!1}}function qa(i,t){const e=globalThis.navigator&&globalThis.navigator.locks;return e&&e.request?e.request(i,()=>t()):Promise.resolve().then(t)}function $v(i,t){if(typeof window>"u"||!window.addEventListener)return()=>{};const e=n=>{(n.key===i||n.key===null)&&t()};return window.addEventListener("storage",e),()=>window.removeEventListener("storage",e)}const Zc="cccp.settings.v1",ql={faceColors:qi.slice(),faceImages:[!1,!1,!1,!1,!1,!1],faceImageModes:["span","span","span","span","span","span"],background:"studio",zoom:1,station:"lucid",volume:.6,muted:!1,sfx:!0,playerName:"Player",tutorialDone:!1,libraryTab:"very-easy",versusDifficulty:"easy",versusLevel:"club",customMoves:8,randomDifficulty:"easy"};function qv(){const i={...ql,...Xn(Zc,{})};for(const t of["faceColors","faceImages","faceImageModes"])(!Array.isArray(i[t])||i[t].length!==6)&&(i[t]=ql[t].slice());return i}function Yv(i){return $n(Zc,i)}const Kv="cccp-assets";let Xr=null;function Zv(){return Xr||(Xr=new Promise((i,t)=>{const e=indexedDB.open(Kv,1);e.onupgradeneeded=()=>e.result.createObjectStore("blobs"),e.onsuccess=()=>i(e.result),e.onerror=()=>t(e.error)})),Xr}async function $r(i,t){const e=await Zv();return new Promise((n,s)=>{const r=e.transaction("blobs",i),a=t(r.objectStore("blobs"));r.oncomplete=()=>n(a&&a.result),r.onerror=()=>s(r.error),r.onabort=()=>s(r.error||new Error("transaction aborted"))})}const Jc={async put(i,t){try{return await $r("readwrite",e=>e.put(t,i)),!0}catch(e){return Mo(`asset:${i}`,e),!1}},async get(i){try{return await $r("readonly",t=>t.get(i))}catch{return null}},async remove(i){try{await $r("readwrite",t=>t.delete(i))}catch{}}};async function jc(i,t=1024){const e=URL.createObjectURL(i);try{const n=await new Promise((a,o)=>{const l=new Image;l.onload=()=>a(l),l.onerror=o,l.src=e}),s=Math.min(1,t/Math.max(n.naturalWidth,n.naturalHeight)),r=document.createElement("canvas");return r.width=Math.round(n.naturalWidth*s),r.height=Math.round(n.naturalHeight*s),r.getContext("2d").drawImage(n,0,0,r.width,r.height),r}finally{setTimeout(()=>URL.revokeObjectURL(e),1e3)}}const qr="cccp.session.v1",gi="cccp.race.v1",Yl=45e3,Jv=()=>`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;class jv{constructor({model:t,view:e,solver:n,generator:s,records:r,leaderboard:a,sfx:o,settings:l,now:c=()=>performance.now(),pictureMask:h=()=>0}){Object.assign(this,{model:t,view:e,solver:n,generator:s,records:r,leaderboard:a,sfx:o,settings:l,now:c,pictureMask:h}),this.listeners={},this.puzzle=null,this.state="free",this.moves=0,this.startTime=0,this.endTime=0,this.pendingStart=null,this.baseElapsed=0,this.generating=null,this.assisted=!1,this.attemptCounted=!1,this.scrambling=!1,this.hintPlan=null,this.hintBusy=null,this.versus=null,this.epoch=0,this.countdownMs=3e3,e.on("turned",d=>this.onTurned(d))}on(t,e){(this.listeners[t]||=[]).push(e)}emit(t,e){(this.listeners[t]||[]).forEach(n=>n(e))}get elapsed(){return this.state==="running"?this.now()-this.startTime:this.state==="solved"?this.endTime-this.startTime:this.state==="ready"?this.baseElapsed+(this.pendingStart!==null?this.now()-this.pendingStart:0):0}isComplete(){return this.model.isPictureSolved(this.pictureMask())}canTwist(){return!this.scrambling&&this.state!=="loading"&&!(this.versus&&this.versus.match.state==="countdown")}newEpoch(){return this.epoch++,this.generating!==null&&(this.generating=null,this.generator.cancel()),this.view.hideHint(),this.view.syncAll(),this.hintPlan=null,this.pendingStart=null,this.hintBusy!==null&&(this.hintBusy=null,this.emit("hint-loading",!1)),this.emit("hint-cleared"),this.epoch}twistStarted(t=this.now()){this.state==="ready"&&!this.scrambling&&!this.versus&&(this.pendingStart=t)}onTurned({layer:t,q:e}){if(this.scrambling)return;const n=xh(t,e);if(!n){this.state==="ready"&&(this.pendingStart=null);return}this.sfx.click(),this.view.hideHint(),this.emit("hint-cleared"),this.moves+=n,this.state==="ready"&&(this.state="running",this.startTime=(this.pendingStart??this.now())-this.baseElapsed,this.pendingStart=null,this.baseElapsed=0,!this.attemptCounted&&this.puzzle&&(this.records.recordAttempt(this.puzzle),this.attemptCounted=!0)),this.versus&&this.versus.local.reportMove({layer:t,q:e},this.moves),this.emit("moves",this.moves),this.state==="running"&&this.isComplete()?this.complete():this.saveSession(),this.emit("turn",{layer:t,q:e})}presetPuzzle(t){const e=un.find(s=>s.id===t),n=Vs(e.difficulty);return{kind:"preset",id:e.id,difficulty:e.difficulty,number:e.number,label:`${n.name} #${e.number}`,scramble:vh(e.scramble),optimal:e.optimal}}async loadPreset(t){return this.endVersus(),this.loadPuzzle(this.presetPuzzle(t))}async newRandom(t){this.endVersus();const e=this.newEpoch(),n=Vs(t)||Tn[1],s=await this.generate(n.range[0],n.range[1],`Generating a ${n.name} puzzle…`,e);return s?this.loadPuzzle({kind:"random",difficulty:n.id,label:`Random · ${n.name}`,scramble:s.scramble,optimal:s.optimal,solution:s.solution},{epoch:e}):!1}async newCustom(t){this.endVersus();const e=this.newEpoch(),n=await this.generate(t,t,`Generating a puzzle that needs exactly ${t} moves…`,e);return n?this.loadPuzzle({kind:"custom",label:`Custom · ${t} moves`,scramble:n.scramble,optimal:n.optimal,solution:n.solution},{epoch:e}):!1}async generate(t,e,n,s){const r=this.state;this.state="loading",this.generating=s,this.emit("loading",n);let a=null,o=null;try{a=await this.generator.generate(t,e,{timeLimit:Yl})}catch(l){o=l}if(this.generating===s&&(this.generating=null),s!==this.epoch)return null;if(this.emit("loading",null),!o&&a&&!a.timedOut)return a;if(o&&o.name!=="CancelledError"&&this.emit("error",`Could not generate a puzzle: ${o.message}`),a&&a.timedOut){const l=t===e?`a puzzle that needs exactly ${t} moves`:"a puzzle";this.emit("error",`Couldn't build and verify ${l} within ${Yl/1e3} seconds. Please try again${t===e?" or choose fewer moves":""}.`)}return r==="loading"||r==="free"&&!this.puzzle?this.reset():(this.state=r,this.emit("state",this.state)),null}cancelGeneration(){this.generating!==null&&(this.generating=null,this.generator.cancel())}async loadPuzzle(t,{animate:e=!0,epoch:n}={}){if(n===void 0)n=this.newEpoch();else if(n!==this.epoch)return!1;if(this.state="loading",this.puzzle=t,this.moves=0,this.baseElapsed=0,this.assisted=!1,this.attemptCounted=!1,this.model.reset(),this.view.syncAll(),this.emit("puzzle",t),this.emit("moves",0),this.emit("assisted",!1),this.scrambling=!0,e){const s=Math.max(70,Math.min(170,1300/t.scramble.length));for(const r of t.scramble){const a=this.model.solverMoveToTurn(r);if(await this.view.animateTurn(a.axis,a.layer,a.q,s),n!==this.epoch)return!1}}else this.model.applySolverMoves(t.scramble),this.view.syncAll();return this.scrambling=!1,this.state="ready",this.emit("state",this.state),this.saveSession(),!0}async restart(){return this.puzzle?this.versus?this.startVersus(this.versus.options,this.puzzle):this.loadPuzzle(this.puzzle):this.reset()}reset(){this.endVersus(),this.newEpoch(),this.puzzle=null,this.state="free",this.scrambling=!1,this.moves=0,this.baseElapsed=0,this.assisted=!1,this.model.reset(),this.view.syncAll(),this.clearSession(),this.emit("loading",null),this.emit("puzzle",null),this.emit("moves",0),this.emit("assisted",!1),this.emit("state",this.state)}async complete(){const t=this.puzzle,e=this.epoch;this.state="solved",this.endTime=this.now(),this.view.hideHint(),this.sfx.chime(),this.clearSession();const n={runId:Jv(),moves:this.moves,timeMs:Math.round(this.endTime-this.startTime),assisted:this.assisted,player:this.settings.playerName};let s=null,r=null;if(this.versus){const c=this.versus;c.local.reportFinished(n.timeMs,n.moves);const h=c.match.winner===c.local;s={won:h,opponent:c.opponent.name,opponentResult:c.match.results.get(c.opponent.id)||null},n.versus={opponent:c.opponent.name,won:h},r=await this.recordRaceResult(c,h),c.match.state!=="finished"&&c.match.end()}const a=await this.records.recordCompletion(t,n);let o=null,l=null;if(t.kind==="preset"&&!n.assisted){const c=await this.leaderboard.submit(t.id,{...n,date:Date.now()});o=c.rank,l=c.saved}e===this.epoch&&(this.emit("state",this.state),this.emit("solved",{puzzle:t,run:n,flags:a.flags,rank:o,versusResult:s,stat:a.saved?a.stat:this.records.stat(t),saved:a.saved,leaderboardSaved:l,versusSaved:r}))}nextPreset(){if(!this.puzzle||this.puzzle.kind!=="preset")return null;const t=un.findIndex(e=>e.id===this.puzzle.id);return un[t+1]||null}markAssisted(){(this.state==="ready"||this.state==="running")&&!this.assisted&&(this.assisted=!0,this.emit("assisted",!0),this.saveSession())}async hint(){if(this.scrambling||this.state==="loading"||this.isComplete()||this.versus&&this.versus.match.state==="countdown")return;const t=this.epoch;this.markAssisted();const e=this.pictureMask(),n=this.hintKey(this.model,e);let s=this.hintPlan?this.hintPlan.keys.indexOf(n):-1;if(s<0||s>=this.hintPlan.moves.length){if(this.hintBusy===t)return;this.hintBusy=t,this.emit("hint-loading",!0);let l=null;try{const d=e?{spins:this.model.centerSpins(),mask:e}:null;l=await this.solver.solve(this.model.normalizedFacelets(),{optimalTime:6e3,fallbackTime:1500,centers:d})}finally{this.hintBusy===t&&(this.hintBusy=null,this.emit("hint-loading",!1))}if(!l||t!==this.epoch||this.hintKey(this.model,e)!==n)return;const c=this.model.clone(),h=[n];for(const d of l.moves)c.applySolverMoves([d]),h.push(this.hintKey(c,e));this.hintPlan={moves:l.moves,keys:h,optimal:l.optimal},s=0}const r=this.hintPlan.moves[s],a=this.model.solverMoveToTurn(r);if(this.view.layerFacesAway(a.axis,a.layer)&&await this.view.bringFaceIntoView(a.axis,a.layer),t!==this.epoch||this.hintKey(this.model,e)!==n)return;this.markAssisted(),this.view.showHint(a);const o=this.faceAt(a.axis,a.layer);this.emit("hint",{turn:a,face:o,step:s+1,total:this.hintPlan.moves.length,remaining:this.hintPlan.moves.length-s,optimal:this.hintPlan.optimal})}hintKey(t,e){const n=t.stateKey();if(!e)return n;const s=t.centerSpins();return`${n}|${s.map((r,a)=>e>>a&1?r:"-").join("")}`}faceAt(t,e){const n=this.model.pieces.find(s=>s.pos[t]===e&&s.pos.filter(r=>r===0).length===2);return rn.findIndex(s=>s[0]===n.home[0]&&s[1]===n.home[1]&&s[2]===n.home[2])}async startVersus(t,e=null){this.endVersus();const n=this.newEpoch();let s=e;if(!s){const l=Vs(t.difficulty)||Tn[1],c=await this.generate(l.range[0],l.range[1],`Setting up a ${l.name} race…`,n);if(!c)return!1;const h=Js.find(d=>d.id===t.level);s={kind:"random",difficulty:l.id,label:`Versus · ${l.name} vs ${h.name}`,scramble:c.scramble,optimal:c.optimal,solution:c.solution,versus:!0}}if(!await this.loadPuzzle(s,{epoch:n}))return!1;const r=new Vv(this.settings.playerName),a=new Gv(t.level,s.solution),o=new Wv({puzzle:s,participants:[r,a]});return this.versus={match:o,local:r,opponent:a,options:t,started:!1,recording:null,releaseLock:null},o.onEvent(l=>{this.versus&&this.versus.match===o&&this.onVersusEvent(l)}),this.emit("versus-start",{opponent:a,puzzle:s}),o.start(this.countdownMs),!0}onVersusEvent(t){const e=this.versus;t.type==="go"&&(e.started=!0,this.markRaceActive(e),this.state==="ready"&&(this.state="running",this.startTime=this.now(),this.records.recordAttempt(this.puzzle),this.attemptCounted=!0,this.emit("state",this.state))),t.type==="winner"&&t.participant!==e.local&&this.recordRaceResult(e,!1).then(n=>this.emit("versus-recorded",{won:!1,saved:n})),this.emit("versus",t)}markRaceActive(t){const e=Xn(gi,{})||{};e[t.match.id]=Date.now(),$n(gi,e);const n=globalThis.navigator&&globalThis.navigator.locks;n&&n.request&&n.request(`cccp-race-${t.match.id}`,()=>new Promise(s=>{t.releaseLock=s})).catch(()=>{})}clearRaceMarker(t){const e=Xn(gi,{})||{};t in e&&(delete e[t],Object.keys(e).length?$n(gi,e):$l(gi))}recordRaceResult(t,e){return t.recording||(this.clearRaceMarker(t.match.id),t.releaseLock&&(t.releaseLock(),t.releaseLock=null),t.recording=this.records.recordVersus(t.match.id,e).then(n=>n.saved)),t.recording}async resolveAbandonedRaces(){const t=Xn(gi,{})||{},e=globalThis.navigator&&globalThis.navigator.locks;let n=0;for(const[s,r]of Object.entries(t)){if(!(e&&e.request?await e.request(`cccp-race-${s}`,{ifAvailable:!0},l=>!!l):Date.now()-r>6e5))continue;const o=await this.records.recordVersus(s,!1);o.duplicate||n++,o.saved&&this.clearRaceMarker(s)}return n}endVersus(){const t=this.versus;t&&(t.started&&this.recordRaceResult(t,!1),t.match.state!=="finished"&&t.match.end(),t.releaseLock&&(t.releaseLock(),t.releaseLock=null),this.versus=null,this.emit("versus-end"))}saveSession(){if(this.versus||this.puzzle&&this.puzzle.versus||this.state==="solved")return this.clearSession();if(this.state==="loading"||this.scrambling)return!0;if(this.state==="free"&&this.model.isSolved())return this.clearSession();const t=this.puzzle;return $n(qr,{v:1,savedAt:Date.now(),puzzle:t?{kind:t.kind,id:t.id||null,difficulty:t.difficulty||null,number:t.number||null,label:t.label,scramble:t.scramble,optimal:t.optimal,solution:t.solution||null}:null,cube:this.model.snapshot(),moves:this.moves,elapsed:Math.round(this.elapsed),assisted:this.assisted,attemptCounted:this.attemptCounted})}clearSession(){return $l(qr)}revivePuzzle(t){if(!t||typeof t!="object")return null;if(t.kind==="preset")return un.some(n=>n.id===t.id)?this.presetPuzzle(t.id):null;const e=n=>Array.isArray(n)&&n.every(s=>Number.isInteger(s)&&s>=0&&s<18);return!["random","custom"].includes(t.kind)||!e(t.scramble)||!Number.isInteger(t.optimal)||typeof t.label!="string"?null:{kind:t.kind,difficulty:t.difficulty||void 0,label:t.label,scramble:t.scramble,optimal:t.optimal,solution:e(t.solution)?t.solution:void 0}}restoreSession(){const t=Xn(qr,null);if(!t||t.v!==1)return null;try{const e=t.puzzle?this.revivePuzzle(t.puzzle):null;if(t.puzzle&&!e)throw new Error("unknown puzzle");const n=this.model.clone();return n.restore(t.cube),this.endVersus(),this.newEpoch(),this.puzzle=e,this.model.pieces=n.pieces,this.view.syncAll(),this.scrambling=!1,this.moves=Number.isInteger(t.moves)&&t.moves>=0?t.moves:0,this.assisted=!!t.assisted,this.attemptCounted=!!t.attemptCounted,this.baseElapsed=e&&Number.isFinite(t.elapsed)&&t.elapsed>0?t.elapsed:0,this.state=e?"ready":"free",this.emit("puzzle",e),this.emit("moves",this.moves),this.emit("assisted",this.assisted),this.emit("state",this.state),{puzzle:e,moves:this.moves,elapsed:this.baseElapsed}}catch{return this.clearSession(),null}}}const Yr="cccp.records.v1",Qv=400,Kl=300,js=()=>({attempts:0,completions:0,assistedCompletions:0,bestTime:null,bestTimeMoves:null,fewestMoves:null,fewestMovesTime:null,lastPlayed:null});function t0(i){const t=i&&typeof i=="object"?i:{},e=t.versus&&typeof t.versus=="object"?t.versus:{};return{presets:t.presets||{},random:t.random||{},runs:Array.isArray(t.runs)?t.runs:[],versus:{wins:e.wins||0,losses:e.losses||0,recorded:Array.isArray(e.recorded)?e.recorded:[]}}}function e0(i){return i.kind==="preset"?["presets",i.id]:i.kind==="custom"?["random",`custom-${i.optimal}`]:["random",`random-${i.difficulty}`]}function Kr(i,t,e){const[n,s]=e0(t);return e?i[n][s]||=js():i[n][s]||js()}class n0{constructor(){this.data=this.load(),this.listeners=new Set,$v(Yr,()=>{this.data=this.load(),this.listeners.forEach(t=>t())})}load(){return t0(Xn(Yr,null))}onChange(t){return this.listeners.add(t),()=>this.listeners.delete(t)}mutate(t){return qa("cccp-records",()=>{const e=this.load(),n=t(e)||{};if(n.skipWrite)return this.data=e,{saved:!0,...n};const s=$n(Yr,e);return this.data=s?e:this.load(),{saved:s,...n}})}stat(t){return Kr(this.data,t,!1)}presetStat(t){return this.data.presets[t]||js()}recordAttempt(t){return this.mutate(e=>{const n=Kr(e,t,!0);n.attempts++,n.lastPlayed=Date.now()})}recordCompletion(t,e){return this.mutate(n=>{const s=Kr(n,t,!0),r={bestTime:!1,fewestMoves:!1,firstClear:s.completions+s.assistedCompletions===0};return e.assisted?s.assistedCompletions++:(s.completions++,(s.bestTime===null||e.timeMs<s.bestTime)&&(s.bestTime=e.timeMs,s.bestTimeMoves=e.moves,r.bestTime=!0),(s.fewestMoves===null||e.moves<s.fewestMoves||e.moves===s.fewestMoves&&e.timeMs<s.fewestMovesTime)&&(r.fewestMoves=s.fewestMoves===null||e.moves<s.fewestMoves,s.fewestMoves=e.moves,s.fewestMovesTime=e.timeMs)),s.lastPlayed=Date.now(),n.runs.unshift({date:Date.now(),kind:t.kind,puzzleId:t.id||null,label:t.label,difficulty:t.difficulty||null,optimal:t.optimal,moves:e.moves,timeMs:e.timeMs,assisted:!!e.assisted,versus:e.versus||null,player:e.player}),n.runs.length=Math.min(n.runs.length,Qv),{flags:r,stat:{...s}}})}recordVersus(t,e){return this.mutate(n=>n.versus.recorded.includes(t)?{duplicate:!0,skipWrite:!0}:(e?n.versus.wins++:n.versus.losses++,n.versus.recorded.push(t),n.versus.recorded.length>Kl&&n.versus.recorded.splice(0,n.versus.recorded.length-Kl),{duplicate:!1}))}isVersusRecorded(t){return this.load().versus.recorded.includes(t)}summary(){const t=Tn.map(o=>{const l=un.filter(f=>f.difficulty===o.id);let c=0,h=0,d=0;for(const f of l){const g=this.data.presets[f.id];g&&(d+=g.attempts,g.completions+g.assistedCompletions>0&&c++,g.completions>0&&h++)}const u=this.data.random[`random-${o.id}`]||js();return{...o,total:l.length,completed:c,clean:h,attempts:d,random:u}}),e=[...Object.values(this.data.presets),...Object.values(this.data.random)],n=e.reduce((o,l)=>o+l.completions+l.assistedCompletions,0),s=e.reduce((o,l)=>o+l.attempts,0),r=t.reduce((o,l)=>o+l.completed,0),a=Object.entries(this.data.random).filter(([o])=>o.startsWith("custom-")).map(([o,l])=>({moves:Number(o.slice(7)),...l})).sort((o,l)=>o.moves-l.moves);return{perDifficulty:t,totalSolved:n,totalAttempts:s,presetsCompleted:r,presetsTotal:un.length,completionPct:Math.round(r/un.length*100),solveRate:s?Math.round(n/s*100):0,custom:a,versus:this.data.versus,runs:this.data.runs}}reset(){return this.mutate(t=>{t.presets={},t.random={},t.runs=[],t.versus={wins:0,losses:0,recorded:t.versus.recorded}})}}function Ae(i){if(i==null)return"—";const t=Math.floor(i/10),e=t%100,n=Math.floor(t/100)%60;return`${Math.floor(t/6e3)}:${String(n).padStart(2,"0")}.${String(e).padStart(2,"0")}`}function i0(i,t){return i.moves-t.moves||i.timeMs-t.timeMs||i.date-t.date}class s0{constructor(t="cccp.leaderboard.v1",e=50){this.key=t,this.keep=e,this.online=!1}get boards(){const t=Xn(this.key,{});return t&&typeof t=="object"?t:{}}submit(t,e){return e.assisted?Promise.resolve({rank:null,saved:!1,rejected:"assisted"}):qa("cccp-leaderboard",()=>{const n=this.boards,s=n[t]||=[];if(e.runId&&s.some(l=>l.runId===e.runId))return{rank:null,saved:!0,duplicate:!0};const r={player:e.player||"Player",moves:e.moves,timeMs:e.timeMs,date:e.date||Date.now()};e.runId&&(r.runId=e.runId),s.push(r),s.sort(i0),s.length=Math.min(s.length,this.keep);const a=s.indexOf(r),o=$n(this.key,n);return{rank:o&&a>=0?a+1:null,saved:o}})}async top(t,e=10){return(this.boards[t]||[]).slice(0,e)}clear(){return qa("cccp-leaderboard",()=>({saved:$n(this.key,{})}))}}const Zl="./";class r0{constructor({volume:t=.6,muted:e=!1,station:n="lucid"}={}){this.audio=new Audio,this.audio.preload="auto",this.stations=[],this.stationId=n,this.order=[],this.index=0,this.listeners=new Set,this.setVolume(t),this.setMuted(e),this.audio.addEventListener("ended",()=>this.next()),this.audio.addEventListener("play",()=>this.emit()),this.audio.addEventListener("pause",()=>this.emit()),this.audio.addEventListener("error",()=>{this.playing&&setTimeout(()=>this.next(),300)})}async load(){try{const e=await(await fetch(`${Zl}audio/stations.json`,{cache:"no-cache"})).json();this.stations=e.stations||[]}catch{this.stations=[]}this.stations.length||(this.stations=[{id:"lucid",name:"Lucid Radio",tracks:[]},{id:"confusion",name:"Confusion Radio",tracks:[]}]),this.station||(this.stationId=this.stations[0]?.id),this.shuffle(),this.emit()}get station(){return this.stations.find(t=>t.id===this.stationId)}get playing(){return!this.audio.paused}get hasTracks(){return!!(this.station&&this.station.tracks.length)}onChange(t){return this.listeners.add(t),()=>this.listeners.delete(t)}emit(){this.listeners.forEach(t=>t(this))}shuffle(){const t=this.station?this.station.tracks.length:0;this.order=[...Array(t).keys()];for(let e=t-1;e>0;e--){const n=Math.floor(Math.random()*(e+1));[this.order[e],this.order[n]]=[this.order[n],this.order[e]]}this.index=0}trackUrl(){const t=this.station.tracks[this.order[this.index]];return/^(https?:)?\//.test(t)?t:`${Zl}audio/${t}`}selectStation(t){const e=this.playing;this.stationId=t,this.audio.pause(),this.audio.removeAttribute("src"),this.shuffle(),(e||this.hasTracks)&&this.play(),this.emit()}play(){if(!this.hasTracks){this.emit();return}this.audio.src||(this.audio.src=this.trackUrl()),this.audio.play().catch(()=>{}),this.emit()}pause(){this.audio.pause(),this.emit()}toggle(){this.playing?this.pause():this.play()}next(){this.hasTracks&&(this.index=(this.index+1)%this.order.length,this.index===0&&this.shuffle(),this.audio.src=this.trackUrl(),this.audio.play().catch(()=>{}),this.emit())}setVolume(t){this.volume=t,this.audio.volume=t,this.emit()}setMuted(t){this.muted=t,this.audio.muted=t,this.emit()}}class a0{constructor(t=!0){this.enabled=t,this.ctx=null}ensure(){if(!this.ctx){const t=window.AudioContext||window.webkitAudioContext;t&&(this.ctx=new t)}return this.ctx&&this.ctx.state==="suspended"&&this.ctx.resume(),this.ctx}click(t=1){if(!this.enabled)return;const e=this.ensure();if(!e)return;const n=e.currentTime,s=Math.floor(e.sampleRate*.05),r=e.createBuffer(1,s,e.sampleRate),a=r.getChannelData(0);for(let u=0;u<s;u++)a[u]=(Math.random()*2-1)*Math.pow(1-u/s,4);const o=e.createBufferSource();o.buffer=r;const l=e.createBiquadFilter();l.type="bandpass",l.frequency.value=1800+Math.random()*500,l.Q.value=1.2;const c=e.createGain();c.gain.value=.22*t,o.connect(l).connect(c).connect(e.destination),o.start(n);const h=e.createOscillator();h.frequency.setValueAtTime(190,n),h.frequency.exponentialRampToValueAtTime(70,n+.06);const d=e.createGain();d.gain.setValueAtTime(.12*t,n),d.gain.exponentialRampToValueAtTime(1e-4,n+.07),h.connect(d).connect(e.destination),h.start(n),h.stop(n+.08)}chime(){if(!this.enabled)return;const t=this.ensure();if(!t)return;const e=t.currentTime;[523.25,659.25,783.99,1046.5].forEach((n,s)=>{const r=t.createOscillator();r.type="triangle",r.frequency.value=n;const a=t.createGain();a.gain.setValueAtTime(1e-4,e+s*.09),a.gain.exponentialRampToValueAtTime(.18,e+s*.09+.02),a.gain.exponentialRampToValueAtTime(1e-4,e+s*.09+.6),r.connect(a).connect(t.destination),r.start(e+s*.09),r.stop(e+s*.09+.7)})}}function Zr(i){const t=parseInt(i.replace("#",""),16),e=(t>>16&255)/255,n=(t>>8&255)/255,s=(t&255)/255,r=Math.max(e,n,s),a=Math.min(e,n,s),o=r-a;let l=0;return o&&(r===e?l=(n-s)/o%6:r===n?l=(s-e)/o+2:l=(e-n)/o+4,l*=60,l<0&&(l+=360)),{h:l,s:r?o/r:0,v:r}}function Jr({h:i,s:t,v:e}){const n=s=>{const r=(s+i/60)%6;return Math.round((e-e*t*Math.max(0,Math.min(r,4-r,1)))*255)};return`#${[n(5),n(3),n(1)].map(s=>s.toString(16).padStart(2,"0")).join("")}`}class o0{constructor(t,{size:e=168,value:n="#ff0000",onChange:s=()=>{}}={}){this.size=e,this.onChange=s,this.hsv=Zr(n);const r=document.createElement("div");r.className="wheel-wrap";const a=Math.min(2,window.devicePixelRatio||1);this.canvas=document.createElement("canvas"),this.canvas.width=this.canvas.height=e*a,this.canvas.style.width=this.canvas.style.height=`${e}px`,this.canvas.setAttribute("aria-label","Colour wheel"),this.ctx=this.canvas.getContext("2d"),this.ctx.scale(a,a);const o=document.createElement("div");o.className="wheel-side",o.innerHTML=`
      <div class="preview"></div>
      <label class="small">Brightness<input type="range" class="value-slider" min="0" max="1" step="0.005" aria-label="Brightness"></label>
      <input type="text" maxlength="7" spellcheck="false" aria-label="Hex colour">`,r.append(this.canvas,o),t.append(r),this.preview=o.querySelector(".preview"),this.slider=o.querySelector("input[type=range]"),this.hex=o.querySelector("input[type=text]"),this.base=this.renderBase();const l=c=>{const h=this.canvas.getBoundingClientRect(),d=c.clientX-h.left-e/2,u=c.clientY-h.top-e/2,f=e/2-4;this.hsv.h=(Math.atan2(u,d)*180/Math.PI+360)%360,this.hsv.s=Math.min(1,Math.hypot(d,u)/f),this.hsv.v<.15&&(this.hsv.v=1),this.update(!0)};this.canvas.addEventListener("pointerdown",c=>{this.canvas.setPointerCapture(c.pointerId),this.dragging=!0,l(c)}),this.canvas.addEventListener("pointermove",c=>{this.dragging&&l(c)}),this.canvas.addEventListener("pointerup",()=>{this.dragging=!1}),this.slider.addEventListener("input",()=>{this.hsv.v=Number(this.slider.value),this.update(!0)}),this.hex.addEventListener("change",()=>{const c=this.hex.value.trim();/^#?[0-9a-f]{6}$/i.test(c)?(this.hsv=Zr(c.startsWith("#")?c:`#${c}`),this.update(!0)):this.update(!1)}),this.update(!1)}renderBase(){const t=this.size,e=document.createElement("canvas");e.width=e.height=t;const n=e.getContext("2d"),s=n.createImageData(t,t),r=t/2-4;for(let a=0;a<t;a++)for(let o=0;o<t;o++){const l=o-t/2,c=a-t/2,h=Math.hypot(l,c),d=(a*t+o)*4;if(h>r+1)continue;const u=Jr({h:(Math.atan2(c,l)*180/Math.PI+360)%360,s:Math.min(1,h/r),v:1}),f=parseInt(u.slice(1),16);s.data[d]=f>>16,s.data[d+1]=f>>8&255,s.data[d+2]=f&255,s.data[d+3]=h>r?Math.round(255*(r+1-h)):255}return n.putImageData(s,0,0),e}set(t){this.hsv=Zr(t),this.update(!1)}get value(){return Jr(this.hsv)}update(t){const e=this.size,n=this.ctx,s=e/2-4;n.clearRect(0,0,e,e),n.drawImage(this.base,0,0,e,e),n.fillStyle=`rgba(0,0,0,${1-this.hsv.v})`,n.beginPath(),n.arc(e/2,e/2,s+1,0,Math.PI*2),n.fill();const r=this.hsv.h*Math.PI/180,a=this.hsv.s*s,o=e/2+Math.cos(r)*a,l=e/2+Math.sin(r)*a;n.lineWidth=3,n.strokeStyle="#fff",n.beginPath(),n.arc(o,l,8,0,Math.PI*2),n.stroke(),n.lineWidth=1.5,n.strokeStyle="#000",n.beginPath(),n.arc(o,l,10,0,Math.PI*2),n.stroke();const c=this.value;this.preview.style.background=c,this.slider.value=this.hsv.v,this.slider.style.setProperty("--hue-color",Jr({...this.hsv,v:1})),document.activeElement!==this.hex&&(this.hex.value=c.toUpperCase()),t&&this.onChange(c)}}const Jl="./";function l0(){const e=document.createElement("canvas");e.width=900,e.height=600;const n=e.getContext("2d");n.fillStyle="#d9d6d0",n.fillRect(0,0,900,600);const s=(a,o)=>a+Math.random()*(o-a);for(let a=0;a<70;a++){const o=s(0,900),l=s(0,600),c=s(40,160),h=n.createRadialGradient(o,l,0,o,l,c),d=Math.random()<.5?"255,255,255":"150,145,140";h.addColorStop(0,`rgba(${d},0.18)`),h.addColorStop(1,`rgba(${d},0)`),n.fillStyle=h,n.fillRect(o-c,l-c,c*2,c*2)}const r=[["#3a3836",2600,.6,3.2],["#6e6a66",2400,.5,2.6],["#8a7f78",900,.6,2.4],["#f7f6f3",1800,.8,3.6],["#24211f",500,1.2,4.5]];for(const[a,o,l,c]of r){n.fillStyle=a;for(let h=0;h<o;h++){const d=s(0,900),u=s(0,600),f=s(l,c);n.beginPath(),n.ellipse(d,u,f*s(.6,1.6),f*s(.5,1.2),s(0,Math.PI),0,Math.PI*2),n.fill()}}return e.toDataURL("image/jpeg",.85)}const c0=[{id:"studio",name:"Studio",css:"radial-gradient(circle at 50% 38%, #5b5f69 0%, #2a2c33 46%, #111216 100%)"},{id:"lucid",name:"Lucid",css:"radial-gradient(circle at 50% 42%, #4a2378 0%, #1b0d30 55%, #07040c 100%)"},{id:"midnight",name:"Midnight",css:"radial-gradient(circle at 50% 35%, #213159 0%, #0b1122 62%, #04060c 100%)"},{id:"emerald",name:"Emerald",css:"radial-gradient(circle at 50% 40%, #1f5a3c 0%, #0a2418 58%, #030b07 100%)"},{id:"daylight",name:"Daylight",css:"radial-gradient(circle at 50% 35%, #ffffff 0%, #dfe3ea 50%, #b9c0cb 100%)"},{id:"granite",name:"Granite",image:l0}];let Us=null;async function jl(){if(Us)return Us;let i=[];try{i=((await(await fetch(`${Jl}assets/backgrounds/backgrounds.json`,{cache:"no-cache"})).json()).backgrounds||[]).map(n=>({id:`file:${n.id}`,name:n.name,url:`${Jl}assets/backgrounds/${n.file}`}))}catch{}return Us=[...c0,...i],Us}const jr=new Map;function Ql(i){return i.css?i.css:i.url?`center / cover no-repeat url("${i.url}")`:i.image?(jr.has(i.id)||jr.set(i.id,i.image()),`center / cover no-repeat url("${jr.get(i.id)}")`):"#111216"}function h0(i,t){const e=Math.min(2,window.devicePixelRatio||1),n=i.clientWidth,s=i.clientHeight;i.width=n*e,i.height=s*e;const r=i.getContext("2d");r.setTransform(e,0,0,e,0,0);const a=Array.from({length:180},()=>({x:n/2+(Math.random()-.5)*120,y:s*.45,vx:(Math.random()-.5)*16,vy:-Math.random()*15-5,s:6+Math.random()*7,r:Math.random()*Math.PI,vr:(Math.random()-.5)*.4,c:t[Math.floor(Math.random()*t.length)]})),o=performance.now(),l=c=>{const h=(c-o)/1e3;r.clearRect(0,0,n,s);for(const d of a)d.vy+=.42,d.vx*=.99,d.x+=d.vx,d.y+=d.vy,d.r+=d.vr,r.save(),r.globalAlpha=Math.max(0,1-h/3.2),r.translate(d.x,d.y),r.rotate(d.r),r.fillStyle=d.c,r.fillRect(-d.s/2,-d.s/4,d.s,d.s/2),r.restore();h<3.3?requestAnimationFrame(l):r.clearRect(0,0,n,s)};requestAnimationFrame(l)}const tc=[{title:"Turn the whole cube",text:"Drag on the empty space around the cube, or hold <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>, to look at it from any side.",event:"rotate"},{title:"Twist a layer",text:"Press on a sticker and drag across the cube to twist that row or column. Let go and it snaps into place.",event:"turn"},{title:"Zoom",text:"Use the zoom slider at the bottom, the mouse wheel, or pinch with two fingers.",event:"zoom"},{title:"Ask for a hint",text:"Press <b>Hint</b>. CCCP calculates an optimal solution and shows the next move with an arrow. Press again for the step after that.",event:"hint"},{title:"You're ready",text:"Open <b>Play</b> to choose from 100 preset puzzles, random and custom puzzles, or a race against the computer. Hint-assisted runs are marked and don’t count for leaderboards.",event:null}];class u0{constructor(t,{subscribe:e,onFinish:n,onOpenPlay:s}){this.el=t,this.subscribe=e,this.onFinish=n,this.onOpenPlay=s,this.unsub=null}start(){this.show(0)}show(t){this.cleanup(),this.index=t;const e=tc[t];this.el.hidden=!1,this.el.innerHTML=`
      <div class="step">Tutorial · ${t+1} of ${tc.length}</div>
      <h4>${e.title}</h4>
      <p>${e.text}</p>
      <div class="row">
        <button class="btn" data-act="skip">${e.event?"Skip tutorial":"Close"}</button>
        ${e.event?'<span class="small" data-status>Try it now…</span>':'<button class="btn primary" data-act="play">Open Play</button>'}
      </div>`,this.el.querySelector("[data-act=skip]").onclick=()=>this.finish();const n=this.el.querySelector("[data-act=play]");if(n&&(n.onclick=()=>{this.finish(),this.onOpenPlay()}),e.event){let s=0;this.unsub=this.subscribe(e.event,r=>{if(e.event==="rotate"&&(s+=r||0,s<1))return;this.cleanup();const a=this.el.querySelector("[data-status]");a&&(a.className="done-check",a.textContent="✓ Nice!"),setTimeout(()=>{!this.el.hidden&&this.index===t&&this.show(t+1)},750)})}}cleanup(){this.unsub&&(this.unsub(),this.unsub=null)}finish(){this.cleanup(),this.el.hidden=!0,this.onFinish()}}const Qr=["Up","Right","Front","Down","Left","Back"],d0=["#ffffff","#111111","#ff2d95","#9b5cff","#4fe36b","#00d4ff","#ffd400","#8b5a2b","#ff7a00","#7a7f8a"],ht=(i,t=document)=>t.querySelector(i),We=i=>String(i).replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]);class f0{constructor(){this.map=new Map}on(t,e){return this.map.has(t)||this.map.set(t,new Set),this.map.get(t).add(e),()=>this.map.get(t).delete(e)}emit(t,e){(this.map.get(t)||[]).forEach(n=>n(e))}}class p0{constructor(t){Object.assign(this,t),this.bus=new f0,this.panel=null,this.selectedFace=0,this.faceThumbs=[null,null,null,null,null,null],this.oppView=null}init(){this.bindToolbar(),this.bindMenu(),this.bindGame(),this.applyBackground(),this.hudLoop(),this.view.on("viewRotate",t=>this.bus.emit("rotate",t)),this.tutorial=new u0(ht("#tutorial"),{subscribe:(t,e)=>this.bus.on(t,e),onFinish:()=>{this.settings.tutorialDone=!0,this.persist()},onOpenPlay:()=>this.openPanel("play")}),this.settings.tutorialDone||setTimeout(()=>this.tutorial.start(),900)}bindToolbar(){ht("#btnScramble").onclick=()=>{this.sfx.ensure(),this.game.newRandom(this.settings.randomDifficulty)},ht("#btnRestart").onclick=()=>this.game.restart(),ht("#btnReset").onclick=()=>this.game.reset(),ht("#btnHint").onclick=()=>{this.sfx.ensure(),this.game.hint()};const t=ht("#zoom");t.value=this.settings.zoom,this.view.setZoom(this.settings.zoom),t.addEventListener("input",()=>this.setZoom(Number(t.value))),window.addEventListener("keydown",e=>{e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||(e.code==="KeyH"&&this.game.hint(),e.code==="Escape"&&(this.closePanel(),this.closeModal()))})}setZoom(t){this.view.setZoom(t),ht("#zoom").value=this.view.zoom,this.settings.zoom=this.view.zoom,this.persistSoon(),this.bus.emit("zoom")}hudLoop(){const t=ht("#statTime"),e=()=>{t.textContent=Ae(this.game.elapsed),requestAnimationFrame(e)};e()}updateHud(){const t=this.game.puzzle;ht("#puzzleLabel").textContent=t?t.label:"Free Play",ht("#statMin").textContent=t?String(t.optimal):"—",ht("#statMin").title=t?"Proven minimum number of moves (half-turn metric)":"",ht("#statMoves").textContent=String(this.game.moves),ht("#assistedBadge").hidden=!this.game.assisted;const e=this.game.state==="loading";for(const n of["#btnScramble","#btnRestart","#btnHint"])ht(n).disabled=e}bindGame(){const t=this.game;t.on("puzzle",()=>{this.updateHud(),this.closeModal(),this.panel==="play"&&this.renderPanel()}),t.on("moves",()=>this.updateHud()),t.on("state",()=>this.updateHud()),t.on("assisted",()=>this.updateHud()),t.on("turn",()=>this.bus.emit("turn")),t.on("loading",e=>{ht("#loading").hidden=!e,ht("#loadingText").textContent=e||"",ht("#loadingCancel").hidden=!e||t.generating===null,this.updateHud()}),ht("#loadingCancel").onclick=()=>t.cancelGeneration(),t.on("versus-recorded",e=>{e.saved||this.toast("The race result could not be saved (storage is full or blocked).",4500)}),this.records.onChange(()=>{(this.panel==="play"||this.panel==="progress")&&this.renderPanel()}),t.on("error",e=>this.toast(e,4e3)),t.on("hint-loading",e=>{ht("#btnHint").classList.toggle("loading",e),e&&this.showHintBar('<div class="spinner"></div><span>Calculating an optimal solution…</span>')}),t.on("hint-cleared",()=>{ht("#hintBar").hidden=!0}),t.on("hint",e=>{const n=e.turn.power===2?"a half turn (180°)":e.turn.power===1?"clockwise":"counter-clockwise",s=this.appearance.faceImages[e.face]?null:this.appearance.faceColors[e.face],r=s?`<i class="swatch" style="background:${s}"></i>`:'<i class="swatch" style="background:#555"></i>',a=e.face===0&&!this.appearance.faceImages[0]?"the face with the logo centre":"the face with this centre",o=e.optimal?`${e.remaining} move${e.remaining===1?"":"s"} left on an optimal path`:`${e.remaining} moves left · fast solve, not proven optimal`;this.showHintBar(`${r}<span>Turn ${a} <b>${n}</b></span><span class="note">· ${o}</span>`),this.bus.emit("hint")}),t.on("solved",e=>this.showSolved(e)),t.on("versus-start",e=>this.startVersusUi(e)),t.on("versus",e=>this.onVersusEvent(e)),t.on("versus-end",()=>this.endVersusUi())}showHintBar(t){const e=ht("#hintBar");e.innerHTML=t,e.hidden=!1}storageWarning(){const t=Date.now();this.lastStorageWarning&&t-this.lastStorageWarning<2e4||(this.lastStorageWarning=t,this.toast("Progress could not be saved: browser storage is full or blocked.",5e3))}toast(t,e=2600){const n=ht("#toast");n.textContent=t,n.hidden=!1,clearTimeout(this.toastTimer),this.toastTimer=setTimeout(()=>{n.hidden=!0},e)}bindMenu(){document.querySelectorAll(".menu-btn").forEach(t=>{t.onclick=()=>this.panel===t.dataset.panel?this.closePanel():this.openPanel(t.dataset.panel)}),ht("#panelClose").onclick=()=>this.closePanel()}openPanel(t){this.panel=t,ht("#panel").hidden=!1,document.querySelectorAll(".menu-btn").forEach(e=>e.classList.toggle("active",e.dataset.panel===t)),this.view.setShift(window.innerWidth>640?200:0),this.renderPanel()}closePanel(){this.panel=null,ht("#panel").hidden=!0,document.querySelectorAll(".menu-btn").forEach(t=>t.classList.remove("active")),this.view.setShift(0)}renderPanel(){const t={play:"Play",customize:"Customize",music:"Music",progress:"Progress & Records",help:"How to play"};ht("#panelTitle").textContent=t[this.panel];const e=ht("#panelBody"),n=e.scrollTop;e.innerHTML="",this[`render_${this.panel}`](e),e.scrollTop=n}render_play(t){const e=this.settings,n=e.libraryTab,s=Vs(n),r=un.filter(h=>h.difficulty===n),a=r.filter(h=>{const d=this.records.presetStat(h.id);return d.completions+d.assistedCompletions>0}).length,o=this.game.puzzle&&this.game.puzzle.kind==="preset"?this.game.puzzle.id:null;t.innerHTML=`
      <h3>Puzzle library</h3>
      <div class="seg" data-g="lib">${Tn.map(h=>`<button data-v="${h.id}" class="${h.id===n?"on":""}">${h.name}</button>`).join("")}</div>
      <div class="progress-line"><span>${a} / ${r.length} completed</span><span>Minimum ${s.range[0]}–${s.range[1]} moves</span></div>
      <div class="lib-grid">${r.map(h=>{const d=this.records.presetStat(h.id),u=d.completions?"done":d.assistedCompletions?"assisted":"",f=d.completions?"✓":d.assistedCompletions?"◐":"",g=d.completions?`Best ${Ae(d.bestTime)} · fewest ${d.fewestMoves} moves`:d.assistedCompletions?"Completed with hints":"Not completed yet";return`<button class="lib-tile ${u} ${o===h.id?"current":""}" data-preset="${h.id}" title="${g}"><span class="mark">${f}</span><b>${h.number}</b><small>${h.optimal} move${h.optimal===1?"":"s"}</small></button>`}).join("")}</div>
      <p class="small">✓ solved · ◐ solved with hints. Replay any puzzle to improve your records.</p>

      <h3>Random puzzle</h3>
      <div class="seg" data-g="rand">${Tn.map(h=>`<button data-v="${h.id}" class="${h.id===e.randomDifficulty?"on":""}">${h.name}</button>`).join("")}</div>
      <button class="btn primary block" data-act="random">New random puzzle</button>
      <p class="small">Unlimited puzzles, each with a verified minimum. The Scramble button uses this difficulty.</p>

      <h3>Custom</h3>
      <div class="field"><div class="row between"><span>Exact minimum number of moves</span><b class="mono" data-custom-val>${e.customMoves}</b></div>
        <input type="range" min="${kv}" max="${Hv}" step="1" value="${e.customMoves}" data-custom></div>
      <button class="btn block" data-act="custom">Generate puzzle</button>
      <p class="small">The generated puzzle needs exactly this many moves to solve, no fewer. Verifying 13–14 moves can take up to a minute.</p>

      <h3>Versus computer</h3>
      <div class="small">Puzzle difficulty</div>
      <div class="seg" data-g="vsdiff">${Tn.map(h=>`<button data-v="${h.id}" class="${h.id===e.versusDifficulty?"on":""}">${h.name}</button>`).join("")}</div>
      <div class="small" style="margin-top:10px">Opponent</div>
      <div class="seg" data-g="vslevel">${Js.map(h=>`<button data-v="${h.id}" class="${h.id===e.versusLevel?"on":""}">${h.name}</button>`).join("")}</div>
      <button class="btn primary block" data-act="versus">Start race</button>
      <p class="small">You and the computer get the identical scramble. The clock starts at GO.</p>`;const l=(h,d)=>t.querySelectorAll(`[data-g=${h}] button`).forEach(u=>{u.onclick=()=>{e[d]=u.dataset.v,this.persist(),this.renderPanel()}});l("lib","libraryTab"),l("rand","randomDifficulty"),l("vsdiff","versusDifficulty"),l("vslevel","versusLevel"),t.querySelectorAll("[data-preset]").forEach(h=>{h.onclick=()=>{this.closePanelOnMobile(),this.game.loadPreset(h.dataset.preset)}});const c=ht("[data-custom]",t);c.oninput=()=>{e.customMoves=Number(c.value),ht("[data-custom-val]",t).textContent=c.value,this.persistSoon()},ht("[data-act=random]",t).onclick=()=>{this.closePanelOnMobile(),this.game.newRandom(e.randomDifficulty)},ht("[data-act=custom]",t).onclick=()=>{this.closePanelOnMobile(),this.game.newCustom(e.customMoves)},ht("[data-act=versus]",t).onclick=()=>{this.closePanel(),this.game.startVersus({difficulty:e.versusDifficulty,level:e.versusLevel})}}closePanelOnMobile(){window.innerWidth<=640&&this.closePanel()}render_customize(t){const e=this.appearance,n=this.selectedFace,s=e.faceImages[n];t.innerHTML=`
      <h3>Face colours</h3>
      <div class="face-chips">${Qr.map((a,o)=>`<button class="face-chip ${o===n?"on":""}" data-face="${o}"><i style="${this.chipStyle(o)}"></i>${a}</button>`).join("")}</div>
      <div data-wheel></div>
      <div class="swatches">${[...qi,...d0].map(a=>`<button style="background:${a}" data-swatch="${a}" title="${a}"></button>`).join("")}</div>
      <div class="row" style="margin-top:12px"><button class="btn" data-act="reset-colors">Restore classic colours</button></div>
      <p class="small">Each face is one uniform colour across all nine squares.</p>

      <h3>Face image · ${Qr[n]}</h3>
      <p class="small">Upload a PNG to cover the ${Qr[n]} face. It can span the whole face (a picture that's complete when solved) or repeat on every square.</p>
      <div class="seg" data-g="imgmode"><button data-v="span" class="${this.settings.faceImageModes[n]==="span"?"on":""}">Span the face</button><button data-v="tile" class="${this.settings.faceImageModes[n]==="tile"?"on":""}">Repeat per square</button></div>
      <div class="row" style="margin-top:10px">
        <label class="btn">Upload image<input type="file" accept="image/png,image/jpeg,image/webp" hidden data-face-file></label>
        ${s?'<button class="btn danger" data-act="remove-img">Remove image</button>':""}
      </div>

      <h3>Background</h3>
      <div class="bg-grid" data-bgs></div>

      <h3>Sound</h3>
      <div class="toggle"><span>Twist sound effects</span><button class="switch ${this.settings.sfx?"on":""}" data-act="sfx" aria-label="Toggle sound effects"></button></div>`,t.querySelectorAll("[data-face]").forEach(a=>{a.onclick=()=>{this.selectedFace=Number(a.dataset.face),this.renderPanel()}}),this.wheel=new o0(ht("[data-wheel]",t),{value:e.faceColors[n],onChange:a=>this.setFaceColor(n,a)}),t.querySelectorAll("[data-swatch]").forEach(a=>{a.onclick=()=>{this.setFaceColor(n,a.dataset.swatch),this.wheel.set(a.dataset.swatch)}}),ht("[data-act=reset-colors]",t).onclick=()=>{qi.forEach((a,o)=>e.setFaceColor(o,a)),this.settings.faceColors=qi.slice(),this.refreshCubes(),this.persist(),this.renderPanel()},t.querySelectorAll("[data-g=imgmode] button").forEach(a=>{a.onclick=()=>{this.settings.faceImageModes[n]=a.dataset.v,e.setFaceImageMode(n,a.dataset.v),this.refreshCubes(),this.persist(),this.renderPanel()}}),ht("[data-face-file]",t).onchange=async a=>{const o=a.target.files[0];if(o)try{const l=await jc(o,1024),c=await this.assets.put(`face-${n}`,o);e.setFaceImage(n,l,this.settings.faceImageModes[n]),this.faceThumbs[n]=Qc(l),this.settings.faceImages[n]=c,c||this.toast("Image applied for this session only. It could not be saved (storage is full or blocked).",5e3),this.refreshCubes(),this.persist(),this.renderPanel()}catch{this.toast("That image could not be loaded.")}};const r=ht("[data-act=remove-img]",t);r&&(r.onclick=async()=>{await this.assets.remove(`face-${n}`),e.setFaceImage(n,null),this.faceThumbs[n]=null,this.settings.faceImages[n]=!1,this.refreshCubes(),this.persist(),this.renderPanel()}),ht("[data-act=sfx]",t).onclick=a=>{this.settings.sfx=!this.settings.sfx,this.sfx.enabled=this.settings.sfx,a.currentTarget.classList.toggle("on",this.settings.sfx),this.persist()},this.renderBackgrounds(ht("[data-bgs]",t))}chipStyle(t){return this.faceThumbs[t]?`background-image:url(${this.faceThumbs[t]})`:`background:${this.appearance.faceColors[t]}`}setFaceColor(t,e){this.appearance.setFaceColor(t,e),this.settings.faceColors[t]=e,this.refreshCubes(),this.persistSoon();const n=document.querySelector(`.face-chip[data-face="${t}"] i`);n&&!this.faceThumbs[t]&&(n.style.background=e)}refreshCubes(){this.view.refreshMaterials(),this.oppView&&this.oppView.refreshMaterials()}async renderBackgrounds(t){const e=await jl(),n=this.settings.background;t.innerHTML=e.map(s=>`<button class="bg-tile ${s.id===n?"on":""}" data-bg="${We(s.id)}" style="background:${Ql(s)}">${We(s.name)}</button>`).join("")+(this.customBgUrl?`<button class="bg-tile ${n==="custom"?"on":""}" data-bg="custom" style="background:center/cover url('${this.customBgUrl}')">Your image</button>`:"")+'<label class="bg-tile upload">+ Upload<input type="file" accept="image/*" hidden data-bg-file></label>',t.querySelectorAll("[data-bg]").forEach(s=>{s.onclick=()=>{this.settings.background=s.dataset.bg,this.persist(),this.applyBackground(),this.renderBackgrounds(t)}}),ht("[data-bg-file]",t).onchange=async s=>{const r=s.target.files[0];if(!r)return;await this.assets.put("background",r)||this.toast("Background applied for this session only. It could not be saved (storage is full or blocked).",5e3),this.customBgUrl&&URL.revokeObjectURL(this.customBgUrl),this.customBgUrl=URL.createObjectURL(r),this.settings.background="custom",this.persist(),this.applyBackground(),this.renderBackgrounds(t)}}async applyBackground(){const t=ht("#bg"),e=this.settings.background;if(e==="custom"){if(!this.customBgUrl){const r=await this.assets.get("background");r&&(this.customBgUrl=URL.createObjectURL(r))}if(this.customBgUrl){t.style.background=`center / cover no-repeat url("${this.customBgUrl}")`;return}}const n=await jl(),s=n.find(r=>r.id===e)||n[0];t.style.background=Ql(s)}render_music(t){const e=this.music;t.innerHTML=`
      <h3>Stations</h3>
      <div class="stations">${e.stations.map(s=>`<button class="station ${s.id===e.stationId?"on":""} ${s.id===e.stationId&&e.playing?"playing":""}" data-station="${We(s.id)}"><span class="eq"><i></i><i></i><i></i><i></i></span>${We(s.name)}</button>`).join("")}</div>
      <div class="player-row">
        <button class="round primary" data-act="toggle" aria-label="${e.playing?"Pause":"Play"}">${e.playing?'<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>':'<svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z" class="fill"/></svg>'}</button>
        <button class="round" data-act="next" aria-label="Next track"><svg viewBox="0 0 24 24"><path d="M6 5l9 7-9 7zM18 5v14"/></svg></button>
        <button class="round" data-act="mute" aria-label="${e.muted?"Unmute":"Mute"}">${e.muted?'<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4zM17 9l5 6M22 9l-5 6"/></svg>':'<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4zM17 8.5a5 5 0 0 1 0 7M19.5 6a8.5 8.5 0 0 1 0 12"/></svg>'}</button>
        <input type="range" min="0" max="1" step="0.01" value="${e.volume}" aria-label="Music volume" data-vol>
      </div>
      ${e.hasTracks?"":'<p class="small" style="margin-top:14px">No tracks have been added to this station yet.</p>'}`,t.querySelectorAll("[data-station]").forEach(s=>{s.onclick=()=>{e.selectStation(s.dataset.station),this.settings.station=s.dataset.station,this.persist()}}),ht("[data-act=toggle]",t).onclick=()=>e.toggle(),ht("[data-act=next]",t).onclick=()=>e.next(),ht("[data-act=mute]",t).onclick=()=>{e.setMuted(!e.muted),this.settings.muted=e.muted,this.persist()};const n=ht("[data-vol]",t);n.oninput=()=>{e.setVolume(Number(n.value)),this.settings.volume=e.volume,this.persistSoon()},this.musicBound||(this.musicBound=!0,e.onChange(()=>{this.panel==="music"&&document.activeElement?.dataset?.vol===void 0&&this.renderPanel()}))}render_progress(t){const e=this.records.summary(),n=this.settings,s=this.lbDiff||n.libraryTab,r=this.lbNum||1,a=`${s}-${String(r).padStart(2,"0")}`,o=this.records.presetStat(a),l=e.perDifficulty.map(u=>`<tr><td>${u.name}</td><td class="num">${u.random.completions+u.random.assistedCompletions}</td><td class="num">${u.random.attempts}</td><td class="num">${Ae(u.random.bestTime)}</td><td class="num">${u.random.fewestMoves??"—"}</td></tr>`).join(""),c=e.custom.map(u=>`<tr><td>${u.moves} moves</td><td class="num">${u.completions+u.assistedCompletions}</td><td class="num">${u.attempts}</td><td class="num">${Ae(u.bestTime)}</td><td class="num">${u.fewestMoves??"—"}</td></tr>`).join(""),h=e.runs.slice(0,15).map(u=>`<tr><td>${We(u.label)}${u.versus?` <span class="badge ${u.versus.won?"good":""}">${u.versus.won?"Won":"Lost"}</span>`:""}</td><td class="num">${u.moves} <span class="small">/ ${u.optimal}</span></td><td class="num">${Ae(u.timeMs)}</td><td>${u.assisted?'<span class="badge warn">Hints</span>':""}</td></tr>`).join("");t.innerHTML=`
      <div class="field"><span>Player name (shown on leaderboards)</span><input type="text" maxlength="24" value="${We(n.playerName)}" data-name></div>
      <div class="kpis">
        <div class="kpi"><b>${e.totalSolved}</b><span>Puzzles solved</span></div>
        <div class="kpi"><b>${e.totalAttempts}</b><span>Attempts · ${e.solveRate}% solved</span></div>
        <div class="kpi"><b>${e.completionPct}%</b><span>Library · ${e.presetsCompleted}/${e.presetsTotal}</span></div>
        <div class="kpi"><b>${e.versus.wins}–${e.versus.losses}</b><span>Versus wins–losses</span></div>
      </div>

      <h3>Library progress</h3>
      ${e.perDifficulty.map(u=>`<div class="diff-row"><div class="row between"><span>${u.name}</span><span class="small">${u.completed}/${u.total} · ${Math.round(u.completed/u.total*100)}%${u.completed-u.clean?` · ${u.completed-u.clean} with hints only`:""}</span></div><div class="bar"><i style="width:${u.completed/u.total*100}%"></i></div></div>`).join("")}

      <h3>Leaderboard</h3>
      <div class="row">
        <select data-lb-diff>${Tn.map(u=>`<option value="${u.id}" ${u.id===s?"selected":""}>${u.name}</option>`).join("")}</select>
        <select data-lb-num>${Array.from({length:25},(u,f)=>`<option value="${f+1}" ${f+1===r?"selected":""}>Puzzle #${f+1}</option>`).join("")}</select>
        <button class="btn" data-act="play-lb">Play</button>
      </div>
      <p class="small">Your bests: ${o.completions?`${Ae(o.bestTime)} fastest · ${o.fewestMoves} fewest moves · minimum ${un.find(u=>u.id===a).optimal}`:"not completed without hints yet"}</p>
      <div data-lb><div class="empty">Loading…</div></div>
      <p class="small">Ranked by fewest moves, then time. Runs that used hints are not ranked.${this.leaderboard.online?"":" Rankings are stored on this device."}</p>

      <h3>Random puzzles</h3>
      <table class="tbl"><tr><th>Difficulty</th><th>Solved</th><th>Tries</th><th>Best</th><th>Fewest</th></tr>${l}</table>
      ${c?`<h3>Custom puzzles</h3><table class="tbl"><tr><th>Minimum</th><th>Solved</th><th>Tries</th><th>Best</th><th>Fewest</th></tr>${c}</table>`:""}

      <h3>Recent runs</h3>
      ${h?`<table class="tbl"><tr><th>Puzzle</th><th>Moves / min</th><th>Time</th><th></th></tr>${h}</table>`:'<div class="empty">No completed puzzles yet.</div>'}

      <button class="btn danger block" data-act="reset-progress" style="margin-top:22px">Reset all progress…</button>`;const d=ht("[data-name]",t);d.onchange=()=>{n.playerName=d.value.trim().slice(0,24)||"Player",this.persist()},ht("[data-lb-diff]",t).onchange=u=>{this.lbDiff=u.target.value,this.renderPanel()},ht("[data-lb-num]",t).onchange=u=>{this.lbNum=Number(u.target.value),this.renderPanel()},ht("[data-act=play-lb]",t).onclick=()=>{this.closePanelOnMobile(),this.game.loadPreset(a)},ht("[data-act=reset-progress]",t).onclick=async()=>{confirm("Erase all progress, records and local leaderboards? This cannot be undone.")&&(this.records.reset(),await this.leaderboard.clear?.(),this.renderPanel())},this.leaderboard.top(a,10).then(u=>{const f=ht("[data-lb]",t);f&&(f.innerHTML=u.length?`<table class="tbl"><tr><th>#</th><th>Player</th><th>Moves</th><th>Time</th></tr>${u.map((g,x)=>`<tr class="${g.player===n.playerName?"me":""}"><td>${x+1}</td><td>${We(g.player)}</td><td class="num">${g.moves}</td><td class="num">${Ae(g.timeMs)}</td></tr>`).join("")}</table>`:'<div class="empty">No ranked runs yet. Be the first!</div>')})}render_help(t){t.innerHTML=`
      <p>Return every face of the cube to a single colour. It plays exactly like a classic 3×3 puzzle cube.</p>
      <h3>Controls</h3>
      <ul class="help-list">
        <li><b>Twist a row or column:</b> press on the cube and drag across it. Release to snap into place.</li>
        <li><b>Rotate the whole cube:</b> drag outside the cube, or hold <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> (or the arrow keys).</li>
        <li><b>Zoom:</b> slider, mouse wheel, or pinch.</li>
        <li><b>Hint:</b> the Hint button or <kbd>H</kbd>.</li>
        <li>On touchscreens: swipe on the cube to twist, swipe outside the cube to rotate it.</li>
      </ul>
      <h3>Scoring</h3>
      <ul class="help-list">
        <li><b>Minimum</b> is the proven fewest moves that solve the puzzle. It comes from an exhaustive optimal search, not from the scramble length.</li>
        <li>With picture faces, the puzzle is complete only when every picture lines up, centre squares included.</li>
        <li><b>Moves</b> use the half-turn metric: any quarter or half turn of an outer face counts as 1, and a middle-slice turn counts as 2. Turning the whole cube is free.</li>
        <li>The timer starts with your first twist (at GO in a race).</li>
        <li>Each Hint shows the next move of an optimal solution from wherever you are, and updates if you go your own way. Runs that use hints are marked and don't count for leaderboards.</li>
      </ul>
      <h3>Buttons</h3>
      <ul class="help-list">
        <li><b>Scramble</b>: a new random puzzle at your chosen difficulty.</li>
        <li><b>Restart</b>: the same puzzle again from the start.</li>
        <li><b>Reset</b>: back to a solved cube for free play.</li>
      </ul>
      <button class="btn primary block" data-act="tutorial">Start the tutorial</button>`,ht("[data-act=tutorial]",t).onclick=()=>{this.closePanel(),this.tutorial.start()}}showSolved({puzzle:t,run:e,flags:n,rank:s,versusResult:r,stat:a,saved:o=!0,leaderboardSaved:l=null,versusSaved:c=null}){h0(ht("#confetti"),[...this.appearance.faceColors,"#9b5cff","#4fe36b"]);const h=Math.round(t.optimal/Math.max(1,e.moves)*100),d=[];r&&d.push(r.won?'<span class="badge good">You won the race!</span>':`<span class="badge">${We(r.opponent)} finished first</span>`),e.assisted&&d.push('<span class="badge warn">Solved with hints · not ranked</span>'),e.moves===t.optimal&&!e.assisted&&d.push('<span class="badge accent">Optimal solve!</span>'),o&&(n.bestTime&&!n.firstClear&&d.push('<span class="badge good">New best time</span>'),n.fewestMoves&&!n.firstClear&&d.push('<span class="badge good">New fewest moves</span>'),n.firstClear&&d.push('<span class="badge">First clear</span>')),s&&d.push(`<span class="badge accent">Leaderboard #${s}</span>`);const u=[!o&&"your records",l===!1&&"the leaderboard",c===!1&&"the race result"].filter(Boolean);u.length&&d.push(`<span class="badge warn">Not saved: ${u.join(", ")} (storage is full or blocked)</span>`);const f=r&&r.opponentResult?`<p class="sub">${We(r.opponent)}: ${Ae(r.opponentResult.timeMs)} · ${r.opponentResult.moves} moves</p>`:"",g=this.game.nextPreset(),x=ht("#modal");x.innerHTML=`
      <div class="card" role="dialog" aria-label="Puzzle solved">
        <h2>${r&&r.won?"Victory!":"Solved!"}</h2>
        <div class="sub">${We(t.label)}</div>
        <div class="result-grid">
          <div><b>${Ae(e.timeMs)}</b><span>Time</span></div>
          <div><b>${e.moves}</b><span>Moves</span></div>
          <div><b>${t.optimal}</b><span>Minimum</span></div>
        </div>
        <div class="sub" style="margin-bottom:8px">Efficiency ${h}%${a.bestTime!==null?` · Best ${Ae(a.bestTime)} · Fewest ${a.fewestMoves}`:""}</div>
        ${f}
        <div class="badges">${d.join("")}</div>
        <div class="row">
          <button class="btn" data-act="close">Close</button>
          <button class="btn" data-act="replay">Replay</button>
          ${g?'<button class="btn primary" data-act="next">Next puzzle</button>':t.kind==="preset"?"":'<button class="btn primary" data-act="new">New puzzle</button>'}
        </div>
      </div>`,x.hidden=!1,x.onclick=T=>{T.target===x&&this.closeModal()},ht("[data-act=close]",x).onclick=()=>this.closeModal(),ht("[data-act=replay]",x).onclick=()=>{this.closeModal(),this.game.restart()};const p=ht("[data-act=next]",x);p&&(p.onclick=()=>{this.closeModal(),this.game.loadPreset(g.id)});const m=ht("[data-act=new]",x);m&&(m.onclick=()=>{this.closeModal(),r?this.game.startVersus(this.game.versus?.options||{difficulty:this.settings.versusDifficulty,level:this.settings.versusLevel}):t.kind==="custom"?this.game.newCustom(t.optimal):this.game.newRandom(t.difficulty)}),(this.panel==="play"||this.panel==="progress")&&this.renderPanel()}closeModal(){ht("#modal").hidden=!0}startVersusUi({opponent:t,puzzle:e}){this.endVersusUi(),ht("#versusBox").hidden=!1,ht("#oppName").textContent=t.name,ht("#oppStatus").textContent="Inspecting…",ht("#oppMoves").textContent="0",ht("#oppBar").style.width="0%",this.oppPlanLength=t.plan.length;const n=new Qs;n.applySolverMoves(e.scramble),this.oppView=new Yc({container:ht("#oppStage"),model:n,appearance:this.appearance,shadows:!1,groundShadow:!1,pixelRatioCap:1.5}),this.oppView.setZoom(1.3),this.oppQueue=Promise.resolve()}onVersusEvent(t){if(t.type==="countdown"&&this.runCountdown(t.startAt),t.type==="progress"&&t.participant.kind==="computer"&&this.oppView){const e=this.oppView;ht("#oppStatus").textContent="Solving…",ht("#oppMoves").textContent=String(t.count),ht("#oppBar").style.width=`${Math.min(100,t.count/this.oppPlanLength*100)}%`,this.oppQueue=this.oppQueue.then(()=>{if(this.oppView!==e)return null;const n=e.model.solverMoveToTurn(t.move);return e.animateTurn(n.axis,n.layer,n.q,200)})}t.type==="winner"&&t.participant.kind==="computer"&&(ht("#oppStatus").textContent=`Solved in ${Ae(t.timeMs)}`,this.toast(`${t.participant.name} solved it in ${Ae(t.timeMs)}. Finish yours!`,4e3))}runCountdown(t){const e=ht("#countdown");e.hidden=!1;const n=()=>{const s=Math.ceil((t-Date.now())/1e3);s>0?(e.innerHTML=`<span>${s}</span>`,setTimeout(n,Math.max(30,t-Date.now()-(s-1)*1e3))):(e.innerHTML="<span>GO!</span>",setTimeout(()=>{e.hidden=!0},700))};n()}endVersusUi(){ht("#versusBox").hidden=!0,ht("#countdown").hidden=!0,this.oppView&&(this.oppView.dispose(),this.oppView=null)}persistSoon(){clearTimeout(this.persistTimer),this.persistTimer=setTimeout(()=>this.persist(),300)}}function Qc(i){const t=document.createElement("canvas");return t.width=t.height=64,t.getContext("2d").drawImage(i,0,0,64,64),t.toDataURL()}document.getElementById("brandLogo").src=xo;document.getElementById("favicon").href=xo;const Pe=qv(),th=()=>Yv(Pe),Di=new Ev;Pe.faceColors.forEach((i,t)=>Di.setFaceColor(t,i));const So=new Qs,rr=new Yc({container:document.getElementById("stage"),model:So,appearance:Di}),m0=new nc,g0=new nc,bo=new n0,eh=new s0,Eo=new a0(Pe.sfx),nh=new r0({volume:Pe.volume,muted:Pe.muted,station:Pe.station});nh.load();const v0=()=>Di.faceImages.reduce((i,t,e)=>t?i|1<<e:i,0),qe=new jv({model:So,view:rr,solver:m0,generator:g0,records:bo,leaderboard:eh,sfx:Eo,settings:Pe,pictureMask:v0}),Ye=new p0({game:qe,view:rr,appearance:Di,settings:Pe,persist:th,records:bo,leaderboard:eh,music:nh,sfx:Eo,assets:Jc}),_0=new Bv(rr,{canTwist:()=>qe.canTwist(),onZoom:i=>Ye.setZoom(i),onTwistStart:i=>qe.twistStarted(i.startedAt)});Ye.controls=_0;Xv(()=>Ye.storageWarning());Ye.init();const vi=qe.restoreSession();Ye.updateHud();vi&&vi.puzzle&&Ye.toast(`Resumed ${vi.puzzle.label}: ${vi.moves} move${vi.moves===1?"":"s"}, ${Ae(vi.elapsed)}. The clock continues with your next move.`,5e3);qe.resolveAbandonedRaces().then(i=>{i&&Ye.toast("An unfinished race was counted as a loss.",4e3)});setInterval(()=>{qe.state==="running"&&qe.saveSession()},5e3);window.addEventListener("pagehide",()=>qe.saveSession());document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&qe.saveSession()});window.addEventListener("pointerdown",()=>Eo.ensure(),{once:!0});bv().then(i=>{i&&(Di.setLogo(i),Ye.refreshCubes())});(async()=>{for(let i=0;i<6;i++){if(!Pe.faceImages[i])continue;const t=await Jc.get(`face-${i}`);if(!t){Pe.faceImages[i]=!1;continue}try{const e=await jc(t,1024);Di.setFaceImage(i,e,Pe.faceImageModes[i]),Ye.faceThumbs[i]=Qc(e)}catch{Pe.faceImages[i]=!1}}Ye.refreshCubes(),th()})();window.cccp={game:qe,view:rr,model:So,records:bo,settings:Pe};
