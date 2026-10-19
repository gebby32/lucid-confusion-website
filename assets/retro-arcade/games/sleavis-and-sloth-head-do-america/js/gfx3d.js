/* GFX3D — the 3D picture.
   Two layers, on purpose:
     layer 0  the WORLD: low-poly boxes, chunky nearest-filtered 32px textures, no mipmaps,
              wobbly snapped vertices, fog. Rendered into a SMALL target (PS1 resolution),
              then 15-bit colour + ordered dither, then blown up blocky.
     layer 1  SLEAVIS and SLOTH-HEAD: the supplied high-detail models, rendered at full
              monitor resolution on top, depth-tested against the chunky world.
   R3.render(k) draws a frame at (480k x 360k) into R3.canvas; js/main.js copies it
   under the pixel HUD in LP.LCD.post.
   Also: Tex (procedural textures + sign text), Mat (PS1 materials), Mk (geometry helpers). */
'use strict';
const R3 = (function () {
  const R = { renderer: null, canvas: null, scene: null, camera: null, envRT: null, outW: 0, outH: 0, envW: 0, envH: 0,
    active: false, portrait: null, sun: null, hemi: null, snapU: { value: null }, shakeX: 0, shakeY: 0 };
  const CHUNK = [[0, 0], [640, 480], [480, 360], [320, 240]];      // 0 = off (full res)

  R.init = function () {
    const T = THREE;
    R.canvas = document.createElement('canvas');
    R.renderer = new T.WebGLRenderer({ canvas: R.canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
    R.renderer.setPixelRatio(1);
    R.renderer.outputColorSpace = T.SRGBColorSpace;
    R.renderer.toneMapping = T.NoToneMapping;
    R.scene = new T.Scene();
    R.camera = new T.PerspectiveCamera(55, 4 / 3, 0.1, 400);
    R.camera.layers.enableAll();
    R.snapU.value = new T.Vector2(240, 180);
    // lights: on every layer so both the world and the heroes see them
    R.hemi = new T.HemisphereLight(0xcfe4ff, 0x5a4a38, 1.25); R.hemi.layers.enableAll();
    R.sun = new T.DirectionalLight(0xfff0d8, 2.2); R.sun.position.set(-6, 12, 8); R.sun.layers.enableAll();
    R.sun.target.position.set(0, 0, 0);
    R.fill = new T.DirectionalLight(0x8090ff, 0.5); R.fill.position.set(6, 4, -6); R.fill.layers.enableAll();
    // a little rim light that only the heroes get (layer 1): they should pop off the ugly world
    R.rim = new T.DirectionalLight(0xffe0b0, 1.1); R.rim.position.set(0, 6, -10); R.rim.layers.set(1);
    R.lights = new T.Group(); R.lights.add(R.hemi, R.sun, R.sun.target, R.fill, R.rim);
    // environment map for the heroes' PBR materials (pretty) — the world never uses it (ugly)
    const pm = new T.PMREMGenerator(R.renderer);
    R.envMap = pm.fromScene(new T.RoomEnvironment(), 0.04).texture;
    // composite pass: chunky world colour + its depth -> screen
    R.quadScene = new T.Scene();
    R.quadCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    R.quadMat = new T.ShaderMaterial({
      uniforms: { tColor: { value: null }, tDepth: { value: null }, res: { value: new T.Vector2(480, 360) }, dither: { value: 1 }, tint: { value: new T.Vector3(1, 1, 1) }, flash: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: [
        'uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 res; uniform float dither; uniform vec3 tint; uniform float flash;',
        'varying vec2 vUv;',
        'float bayer(vec2 p){ int x=int(mod(p.x,4.0)), y=int(mod(p.y,4.0)); int i=x+y*4;',
        '  int b[16]; b[0]=0;b[1]=8;b[2]=2;b[3]=10;b[4]=12;b[5]=4;b[6]=14;b[7]=6;b[8]=3;b[9]=11;b[10]=1;b[11]=9;b[12]=15;b[13]=7;b[14]=13;b[15]=5;',
        '  for(int k=0;k<16;k++){ if(k==i) return float(b[k])/16.0; } return 0.0; }',
        'vec3 toSRGB(vec3 c){ return mix(c*12.92, 1.055*pow(max(c,vec3(0.0)),vec3(1.0/2.4))-0.055, step(vec3(0.0031308),c)); }',
        'void main(){',
        '  vec3 c = toSRGB(texture2D(tColor, vUv).rgb) * tint;',
        '  vec2 p = floor(vUv * res);',
        '  float b = (bayer(p) - 0.47) * dither;',
        '  c = floor(c * 31.0 + b + 0.5) / 31.0;',
        '  c = mix(c, vec3(1.0), flash);',
        '  gl_FragColor = vec4(c, 1.0);',
        '  gl_FragDepth = texture2D(tDepth, vUv).x;',
        '}'
      ].join('\n'),
      depthTest: true, depthFunc: THREE.AlwaysDepth, depthWrite: true, toneMapped: false
    });
    const q = new T.Mesh(new T.PlaneGeometry(2, 2), R.quadMat); q.frustumCulled = false;
    R.quadScene.add(q);
    R.portraitCam = new T.PerspectiveCamera(24, 1, 0.05, 20);
    R.portraitCam.layers.enableAll();
  };

  function ensureSize(k) {
    const W = G.W * k, H = G.H * k;
    if (W !== R.outW || H !== R.outH) { R.outW = W; R.outH = H; R.renderer.setSize(W, H, false); }
    const ch = CHUNK[LP.Settings.get('chunk') | 0] || CHUNK[2];
    let ew = ch[0] || W, eh = ch[1] || H;
    if (ew > W) { ew = W; eh = H; }
    if (!R.envRT || R.envW !== ew || R.envH !== eh) {
      if (R.envRT) { R.envRT.dispose(); R.envRT.depthTexture.dispose(); }
      R.envW = ew; R.envH = eh;
      const T = THREE;
      R.envRT = new T.WebGLRenderTarget(ew, eh, { minFilter: T.NearestFilter, magFilter: T.NearestFilter, generateMipmaps: false, colorSpace: T.SRGBColorSpace });
      R.envRT.depthTexture = new T.DepthTexture(ew, eh);
      R.envRT.depthTexture.minFilter = R.envRT.depthTexture.magFilter = T.NearestFilter;
      R.quadMat.uniforms.tColor.value = R.envRT.texture;
      R.quadMat.uniforms.tDepth.value = R.envRT.depthTexture;
      R.quadMat.uniforms.res.value.set(ew, eh);
      R.snapU.value.set(ew / 2, eh / 2);
    }
  }

  // One frame. Called from LP.LCD.post at output resolution.
  R.render = function (k) {
    if (!R.active) return false;
    ensureSize(k);
    const r = R.renderer, cam = R.camera;
    cam.aspect = 4 / 3; cam.updateProjectionMatrix();
    if (R.shakeX || R.shakeY) { cam.position.x += R.shakeX; cam.position.y += R.shakeY; }
    cam.updateMatrixWorld();
    // 1. the chunky world
    cam.layers.set(0);
    r.setRenderTarget(R.envRT);
    r.render(R.scene, cam);
    // 2. composite it to the screen (colour + depth)
    r.setRenderTarget(null);
    r.autoClear = true;
    r.render(R.quadScene, R.quadCam);
    // 3. the heroes, crisp, on top (a colour background would force a clear, so hide it)
    const bg = R.scene.background; R.scene.background = null;
    cam.layers.set(1);
    r.autoClear = false;
    r.render(R.scene, cam);
    cam.layers.enableAll();
    // 4. dialogue portrait (live 3D close-up of whoever is talking)
    if (R.portrait) drawPortrait(k);
    R.scene.background = bg;
    r.autoClear = true;
    if (R.shakeX || R.shakeY) { cam.position.x -= R.shakeX; cam.position.y -= R.shakeY; }
    return true;
  };

  // R.portrait = { hero, x, y, w, h (HUD pixels), bg: '#hex' }
  function drawPortrait(k) {
    const p = R.portrait, r = R.renderer, h = p.hero;
    if (!h || !h.root.visible) return;
    const x = p.x * k, w = p.w * k, hh = p.h * k, y = R.outH - (p.y + p.h) * k;
    r.setScissorTest(true); r.setScissor(x, y, w, hh); r.setViewport(x, y, w, hh);
    r.setClearColor(p.bg || '#1a1030', 1); r.clear(true, true, true);
    const head = h.headWorld(), fwd = h.forward();
    const pc = R.portraitCam;
    pc.aspect = w / hh; pc.updateProjectionMatrix();
    const side = (p.side || 0.35);
    pc.position.set(head.x + fwd.x * 1.25 + fwd.z * side, head.y + 0.05, head.z + fwd.z * 1.25 - fwd.x * side);
    pc.lookAt(head.x, head.y - 0.02, head.z);
    r.render(R.scene, pc);
    r.setScissorTest(false); r.setViewport(0, 0, R.outW, R.outH);
    r.setClearColor(0x000000, 1);
  }

  R.setSky = function (top, fogColor, near, far) {
    R.scene.background = new THREE.Color(top);
    R.scene.fog = new THREE.Fog(fogColor || top, near || 30, far || 120);
  };
  R.setLight = function (o) {
    o = o || {};
    R.hemi.color.set(o.sky || 0xcfe4ff); R.hemi.groundColor.set(o.ground || 0x5a4a38); R.hemi.intensity = o.hemi === undefined ? 1.25 : o.hemi;
    R.sun.color.set(o.sun || 0xfff0d8); R.sun.intensity = o.sunI === undefined ? 2.2 : o.sunI;
    if (o.sunPos) R.sun.position.set(o.sunPos[0], o.sunPos[1], o.sunPos[2]); else R.sun.position.set(-6, 12, 8);
    R.fill.intensity = o.fillI === undefined ? 0.5 : o.fillI;
    R.rim.intensity = o.rimI === undefined ? 1.1 : o.rimI;
    R.quadMat.uniforms.tint.value.set(1, 1, 1);
  };
  return R;
})();

// ---------------------------------------------------------------------- procedural textures
const Tex = (function () {
  const cache = new Map();
  const T = {};
  function finish(c, o) {
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
    t.wrapS = t.wrapT = (o && o.clamp) ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  T.make = function (key, w, h, fn, o) {
    if (cache.has(key)) return cache.get(key);
    const c = G.canvas(w, h), g = c.getContext('2d');
    fn(g, w, h);
    const t = finish(c, o);
    t.userData.canvas = c;
    cache.set(key, t);
    return t;
  };
  // noisy fill
  T.noise = function (g, w, h, base, amt, seed) {
    const r = RNG(seed || 7);
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = (r() - 0.5) * amt;
      g.fillStyle = v > 0 ? 'rgba(255,255,255,' + v + ')' : 'rgba(0,0,0,' + (-v) + ')';
      g.fillRect(x, y, 1, 1);
    }
  };
  const lib = {
    asphalt: (g, w, h) => { T.noise(g, w, h, '#3b3a3f', 0.35, 1); },
    road: (g, w, h) => { T.noise(g, w, h, '#38373c', 0.3, 2); g.fillStyle = '#e8c33a'; g.fillRect(w / 2 - 1, 0, 2, h / 2); },
    roadx: (g, w, h) => { T.noise(g, w, h, '#38373c', 0.3, 2); g.fillStyle = '#e8c33a'; g.fillRect(0, h / 2 - 1, w / 2, 2); },
    concrete: (g, w, h) => { T.noise(g, w, h, '#9a968c', 0.22, 3); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, w, 1); g.fillRect(0, 0, 1, h); },
    dirt: (g, w, h) => { T.noise(g, w, h, '#8a6a44', 0.35, 4); },
    sand: (g, w, h) => { T.noise(g, w, h, '#c79a62', 0.25, 5); },
    grass: (g, w, h) => { T.noise(g, w, h, '#5a7a2a', 0.4, 6); const r = RNG(66); g.fillStyle = '#8a8a3a'; for (let i = 0; i < 30; i++) g.fillRect(r.int(0, w), r.int(0, h), 2, 1); },
    deadgrass: (g, w, h) => { T.noise(g, w, h, '#8a8040', 0.4, 61); },
    brick: (g, w, h) => {
      T.noise(g, w, h, '#8a3a2a', 0.25, 7); g.fillStyle = '#5a4a40';
      for (let y = 0; y < h; y += 8) { g.fillRect(0, y, w, 1); for (let x = (y / 8) % 2 ? 0 : 8; x < w; x += 16) g.fillRect(x, y, 1, 8); }
    },
    planks: (g, w, h) => { T.noise(g, w, h, '#7a5432', 0.3, 8); g.fillStyle = '#3a2818'; for (let x = 0; x < w; x += 8) g.fillRect(x, 0, 1, h); },
    siding: (g, w, h) => { T.noise(g, w, h, '#b8c0a8', 0.12, 9); g.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = 0; y < h; y += 6) g.fillRect(0, y, w, 1); },
    stucco: (g, w, h) => { T.noise(g, w, h, '#d8b890', 0.25, 10); },
    pinkstucco: (g, w, h) => { T.noise(g, w, h, '#d89aa0', 0.22, 11); },
    tile: (g, w, h) => { T.noise(g, w, h, '#d8dcd0', 0.1, 12); g.fillStyle = '#8a9088'; for (let i = 0; i < w; i += 8) { g.fillRect(i, 0, 1, h); g.fillRect(0, i, w, 1); } g.fillStyle = 'rgba(120,100,20,0.35)'; g.fillRect(3, 20, 9, 7); },
    grosstile: (g, w, h) => { T.noise(g, w, h, '#b8c0a0', 0.18, 13); g.fillStyle = '#5a6040'; for (let i = 0; i < w; i += 8) { g.fillRect(i, 0, 1, h); g.fillRect(0, i, w, 1); } const r = RNG(3); for (let i = 0; i < 8; i++) { g.fillStyle = r.pick(['rgba(90,70,10,0.5)', 'rgba(40,60,10,0.4)', 'rgba(120,40,20,0.3)']); g.fillRect(r.int(0, w), r.int(0, h), r.int(2, 8), r.int(2, 6)); } },
    carpet: (g, w, h) => { T.noise(g, w, h, '#7a3a4a', 0.35, 14); g.fillStyle = 'rgba(200,180,60,0.4)'; for (let i = 0; i < w; i += 8) for (let j = (i / 8) % 2 * 4; j < h; j += 8) g.fillRect(i + 2, j, 2, 2); g.fillStyle = 'rgba(40,30,10,0.55)'; g.fillRect(14, 10, 10, 6); g.fillRect(17, 8, 4, 2); },
    checker: (g, w, h) => { for (let y = 0; y < h; y += 8) for (let x = 0; x < w; x += 8) { g.fillStyle = ((x + y) / 8) % 2 ? '#ddd8c8' : '#2a2a30'; g.fillRect(x, y, 8, 8); } T.noiseOver(g, w, h, 0.12, 15); },
    metal: (g, w, h) => { T.noise(g, w, h, '#8a9098', 0.15, 16); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, h - 1, w, 1); },
    corrugated: (g, w, h) => { T.noise(g, w, h, '#8a8a84', 0.12, 17); for (let x = 0; x < w; x += 4) { g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x, 0, 1, h); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x + 2, 0, 1, h); } g.fillStyle = 'rgba(140,60,20,0.4)'; g.fillRect(4, 20, 12, 10); },
    shingles: (g, w, h) => { T.noise(g, w, h, '#8a6a58', 0.3, 18); g.fillStyle = 'rgba(0,0,0,0.4)'; for (let y = 0; y < h; y += 4) { g.fillRect(0, y, w, 1); for (let x = (y / 4) % 2 ? 0 : 3; x < w; x += 6) g.fillRect(x, y, 1, 4); } },
    water: (g, w, h) => { T.noise(g, w, h, '#2a5a8a', 0.2, 19); g.fillStyle = 'rgba(255,255,255,0.3)'; for (let i = 0; i < 6; i++) g.fillRect((i * 11) % w, (i * 7) % h, 5, 1); },
    mud: (g, w, h) => { T.noise(g, w, h, '#4a3420', 0.35, 20); },
    rock: (g, w, h) => { T.noise(g, w, h, '#a0522d', 0.3, 21); g.fillStyle = 'rgba(80,30,10,0.4)'; for (let y = 0; y < h; y += 5) g.fillRect(0, y, w, 1); },
    wallpaper: (g, w, h) => { T.noise(g, w, h, '#a89a6a', 0.12, 22); g.fillStyle = 'rgba(90,60,30,0.45)'; for (let x = 0; x < w; x += 8) for (let y = (x / 8) % 2 * 4; y < h; y += 8) { g.fillRect(x + 3, y + 1, 2, 4); g.fillRect(x + 2, y + 2, 4, 2); } g.fillStyle = 'rgba(80,60,20,0.3)'; g.fillRect(0, 24, w, 8); },
    paneling: (g, w, h) => { T.noise(g, w, h, '#6a4424', 0.2, 23); g.fillStyle = '#3a2412'; for (let x = 0; x < w; x += 10) g.fillRect(x, 0, 1, h); },
    linoleum: (g, w, h) => { T.noise(g, w, h, '#c8c0a0', 0.18, 24); g.fillStyle = 'rgba(80,70,40,0.3)'; for (let i = 0; i < w; i += 16) { g.fillRect(i, 0, 1, h); g.fillRect(0, i, w, 1); } },
    camo: (g, w, h) => { T.noise(g, w, h, '#5a6a3a', 0.2, 25); const r = RNG(9); for (let i = 0; i < 14; i++) { g.fillStyle = r.pick(['#3a4a2a', '#7a7a4a', '#2a2a1a']); g.fillRect(r.int(0, w), r.int(0, h), r.int(4, 10), r.int(3, 6)); } },
    marble: (g, w, h) => { T.noise(g, w, h, '#e0dcd4', 0.1, 26); g.strokeStyle = 'rgba(120,110,100,0.4)'; g.beginPath(); g.moveTo(0, 8); g.lineTo(12, 14); g.lineTo(20, 6); g.lineTo(32, 18); g.stroke(); },
    neon: (g, w, h) => { g.fillStyle = '#1a0a2a'; g.fillRect(0, 0, w, h); },
    redcarpet: (g, w, h) => { T.noise(g, w, h, '#8a1a2a', 0.25, 27); g.fillStyle = 'rgba(255,210,60,0.5)'; for (let i = 0; i < w; i += 8) for (let j = 0; j < h; j += 8) g.fillRect(i + 3, j + 3, 2, 2); },
    stars: (g, w, h) => { g.fillStyle = '#1a2a6a'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; for (let i = 0; i < w; i += 8) for (let j = 0; j < h; j += 8) g.fillRect(i + 3, j + 3, 2, 2); },
    stripes: (g, w, h) => { for (let y = 0; y < h; y += 4) { g.fillStyle = (y / 4) % 2 ? '#fff' : '#c02020'; g.fillRect(0, y, w, 4); } },
    hazard: (g, w, h) => { for (let x = -h; x < w; x += 8) { g.fillStyle = '#e8c020'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 4, 0); g.lineTo(x + 4 + h, h); g.lineTo(x + h, h); g.fill(); } g.globalCompositeOperation = 'destination-over'; g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, w, h); },
    cornbatter: (g, w, h) => { T.noise(g, w, h, '#c8862a', 0.3, 28); g.fillStyle = 'rgba(90,50,10,0.4)'; for (let i = 0; i < 10; i++) g.fillRect((i * 13) % w, (i * 5) % h, 3, 2); },
    sky: (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a3aa0'); gr.addColorStop(0.6, '#e87a8a'); gr.addColorStop(1, '#f8b060'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
  };
  T.noiseOver = function (g, w, h, amt, seed) {
    const r = RNG(seed);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = (r() - 0.5) * amt; g.fillStyle = v > 0 ? 'rgba(255,255,255,' + v + ')' : 'rgba(0,0,0,' + (-v) + ')'; g.fillRect(x, y, 1, 1); }
  };
  T.get = function (name) { return T.make(name, 32, 32, lib[name] || lib.concrete); };
  T.has = (name) => !!lib[name];

  // A painted sign: text lines on a board. o = { w, h, bg, fg, border, font: 'big'|'small', lines: [..], scale }
  T.sign = function (text, o) {
    o = o || {};
    const key = 'sign:' + text + JSON.stringify(o);
    const lines = String(text).split('\n');
    const face = o.font || 'big', sc = o.scale || 1;
    const lw = Math.max(...lines.map((l) => Font.width(l, face, sc)));
    const lh = (face === 'big' ? 9 : 7) * sc;
    const pad = o.pad === undefined ? 4 : o.pad;
    const w = o.w || Math.max(8, lw + pad * 2), h = o.h || lines.length * lh + pad * 2 - sc;
    return T.make(key, w, h, (g) => {
      g.fillStyle = o.bg || '#f4f0e0'; g.fillRect(0, 0, w, h);
      if (o.grime !== false) T.noiseOver(g, w, h, o.grime || 0.12, text.length);
      if (o.border) { g.strokeStyle = o.border; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2); }
      const y0 = Math.round((h - lines.length * lh + sc) / 2);
      lines.forEach((l, i) => Font.draw(g, l, w / 2, y0 + i * lh, o.fg || '#202020', { face, align: 'center', scale: sc, shadow: o.shadow }));
    }, { clamp: true });
  };
  // A crude face for the low-poly people (16x16, drawn on the head box's front)
  T.face = function (o) {
    const key = 'face:' + JSON.stringify(o);
    return T.make(key, 16, 16, (g) => {
      g.fillStyle = o.skin; g.fillRect(0, 0, 16, 16);
      if (o.hair) { g.fillStyle = o.hair; g.fillRect(0, 0, 16, o.bald ? 1 : 4); if (o.longHair) { g.fillRect(0, 0, 2, 12); g.fillRect(14, 0, 2, 12); } }
      // eyes
      g.fillStyle = '#fff'; g.fillRect(3, 6, 4, 3); g.fillRect(9, 6, 4, 3);
      g.fillStyle = o.eye || '#201810'; g.fillRect(o.cross ? 6 : 4, 7, 2, 2); g.fillRect(o.cross ? 9 : 10, 7, 2, 2);
      if (o.shades) { g.fillStyle = '#101010'; g.fillRect(2, 6, 12, 3); g.fillStyle = '#5a5a7a'; g.fillRect(3, 6, 2, 1); }
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(3, 5, 4, 1); g.fillRect(9, 5, 4, 1);
      if (o.angry) { g.fillStyle = '#201810'; g.fillRect(3, 4, 2, 1); g.fillRect(5, 5, 2, 1); g.fillRect(11, 4, 2, 1); g.fillRect(9, 5, 2, 1); }
      // nose + mouth
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(7, 9, 2, 2);
      g.fillStyle = o.lip || '#6a2020';
      if (o.mouth === 'o') g.fillRect(6, 12, 4, 3);
      else if (o.mouth === 'grin') { g.fillRect(4, 12, 8, 2); g.fillStyle = '#fff'; g.fillRect(5, 12, 6, 1); }
      else if (o.mouth === 'frown') { g.fillRect(5, 13, 6, 1); g.fillRect(4, 14, 1, 1); g.fillRect(11, 14, 1, 1); }
      else g.fillRect(5, 13, 6, 1);
      if (o.beard) { g.fillStyle = o.beard; g.fillRect(2, 11, 12, 5); g.fillStyle = o.lip || '#6a2020'; g.fillRect(6, 12, 4, 1); }
      if (o.stache) { g.fillStyle = o.stache; g.fillRect(4, 11, 8, 1); }
      if (o.makeup) { g.fillStyle = o.makeup; g.fillRect(3, 9, 2, 1); g.fillRect(11, 9, 2, 1); }
      if (o.glasses) { g.strokeStyle = '#202020'; g.lineWidth = 1; g.strokeRect(2.5, 5.5, 5, 4); g.strokeRect(8.5, 5.5, 5, 4); }
    }, { clamp: true });
  };
  return T;
})();

// ---------------------------------------------------------------------- PS1 materials
const Mat = (function () {
  const cache = new Map();
  const M = {};
  // wobble: snap every world vertex to the chunky screen grid (the PS1's integer GTE look)
  M.snap = function (mat) {
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.snapRes = R3.snapU;
      sh.vertexShader = 'uniform vec2 snapRes;\n' + sh.vertexShader.replace('#include <project_vertex>',
        '#include <project_vertex>\n  if (gl_Position.w > 0.5) gl_Position.xy = floor(gl_Position.xy / gl_Position.w * snapRes + 0.5) / snapRes * gl_Position.w;');
    };
    mat.customProgramCacheKey = () => 'ps1snap';
    return mat;
  };
  // M.get('brick') / M.get('#ff0000') / M.get('brick', { color, tile }) ...
  M.get = function (look, o) {
    o = o || {};
    const key = (look && look.isTexture ? 'tex:' + look.uuid : look) + '|' + JSON.stringify(o);
    if (cache.has(key)) return cache.get(key);
    let m;
    const isCol = typeof look === 'number' || /^#/.test(look);
    const params = { side: o.double ? THREE.DoubleSide : THREE.FrontSide };
    if (isCol) params.color = new THREE.Color(look);
    else if (look && look.isTexture) params.map = look;
    else { params.map = Tex.get(look); if (o.color) params.color = new THREE.Color(o.color); }
    if (o.transparent) { params.transparent = true; params.opacity = o.opacity === undefined ? 1 : o.opacity; params.alphaTest = o.alphaTest || 0; }
    if (o.alphaTest) params.alphaTest = o.alphaTest;
    if (o.unlit) m = new THREE.MeshBasicMaterial(params);
    else { if (o.emissive) params.emissive = new THREE.Color(o.emissive); m = new THREE.MeshLambertMaterial(params); }
    if (o.fog === false) m.fog = false;
    M.snap(m);
    cache.set(key, m);
    return m;
  };
  M.sign = function (text, o) {
    const t = Tex.sign(text, o);
    const m = new THREE.MeshLambertMaterial({ map: t, side: THREE.DoubleSide, emissive: o && o.glow ? new THREE.Color(o.glow) : 0x000000, emissiveMap: o && o.glow ? t : null });
    if (o && o.unlit) { const b = new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }); return M.snap(b); }
    return M.snap(m);
  };
  return M;
})();

// ---------------------------------------------------------------------- geometry helpers
const Mk = (function () {
  const K = {};
  const geoCache = new Map();
  // box with UVs scaled so textures tile once per `tile` metres
  K.boxGeo = function (w, h, d, tile) {
    tile = tile || 2;
    const key = w + ',' + h + ',' + d + ',' + tile;
    if (geoCache.has(key)) return geoCache.get(key);
    const g = new THREE.BoxGeometry(w, h, d);
    const uv = g.attributes.uv;
    const spans = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const j = f * 4 + i; uv.setXY(j, uv.getX(j) * spans[f][0] / tile, uv.getY(j) * spans[f][1] / tile); }
    geoCache.set(key, g);
    return g;
  };
  // box(parent, w, h, d, look, x, y, z, o): y = BOTTOM of the box. o = { tile, ry, mat, collide, name }
  K.box = function (parent, w, h, d, look, x, y, z, o) {
    o = o || {};
    const mat = o.mat || (Array.isArray(look) ? look.map((l) => (l && l.isMaterial ? l : Mat.get(l))) : (look && look.isMaterial ? look : Mat.get(look, o.m)));
    const m = new THREE.Mesh(K.boxGeo(w, h, d, o.tile), mat);
    m.position.set(x || 0, (y || 0) + h / 2, z || 0);
    if (o.ry) m.rotation.y = o.ry;
    if (o.rx) m.rotation.x = o.rx;
    if (o.rz) m.rotation.z = o.rz;
    if (parent) parent.add(m);
    if (o.collide && Stage.cur) Stage.addBox(x, y, z, w, h, d, o.ry, o.collide === true ? {} : o.collide);
    return m;
  };
  K.plane = function (parent, w, d, look, x, y, z, o) {
    o = o || {};
    const g = new THREE.PlaneGeometry(w, d);
    const tile = o.tile || 2, uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / tile, uv.getY(i) * d / tile);
    const m = new THREE.Mesh(g, look && look.isMaterial ? look : Mat.get(look, o.m));
    m.rotation.x = -Math.PI / 2;
    if (o.ry) m.rotation.z = o.ry;
    m.position.set(x || 0, y || 0, z || 0);
    if (parent) parent.add(m);
    return m;
  };
  // an upright sign board (double sided), centre at x,y,z
  K.sign = function (parent, text, x, y, z, o) {
    o = o || {};
    const t = Tex.sign(text, o);
    const ppm = o.ppm || 24;                         // texture pixels per metre
    const w = o.width || t.image.width / ppm, h = o.height || t.image.height / ppm * (o.width ? o.width / (t.image.width / ppm) : 1);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), Mat.sign(text, o));
    m.position.set(x, y, z);
    m.rotation.y = o.ry || 0;
    if (parent) parent.add(m);
    if (o.post) K.box(parent, 0.12, y - h / 2, 0.12, o.post, x, 0, z);
    return m;
  };
  K.cyl = function (parent, rt, rb, h, look, x, y, z, o) {
    o = o || {};
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, o.seg || 7), look && look.isMaterial ? look : Mat.get(look, o.m));
    m.position.set(x || 0, (y || 0) + h / 2, z || 0);
    if (o.rx) m.rotation.x = o.rx;
    if (o.rz) m.rotation.z = o.rz;
    if (parent) parent.add(m);
    if (o.collide && Stage.cur) Stage.addCircle(x, z, Math.max(rt, rb), y, h);
    return m;
  };
  K.ball = function (parent, r, look, x, y, z, o) {
    o = o || {};
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, o.seg || 6, o.rings || 4), look && look.isMaterial ? look : Mat.get(look, o.m));
    m.position.set(x || 0, y || 0, z || 0);
    if (o.sy) m.scale.y = o.sy;
    if (parent) parent.add(m);
    return m;
  };
  K.cone = function (parent, r, h, look, x, y, z, o) {
    o = o || {};
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, o.seg || 6), look && look.isMaterial ? look : Mat.get(look, o.m));
    m.position.set(x || 0, (y || 0) + h / 2, z || 0);
    if (parent) parent.add(m);
    return m;
  };
  K.group = function (parent, x, y, z, ry) {
    const g = new THREE.Group(); g.position.set(x || 0, y || 0, z || 0); g.rotation.y = ry || 0;
    if (parent) parent.add(g);
    return g;
  };
  // flat round blob shadow under a character
  let blobMat = null;
  K.blob = function (r) {
    if (!blobMat) {
      const t = Tex.make('blob', 16, 16, (g) => { g.fillStyle = 'rgba(0,0,0,0.55)'; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (Math.hypot(x - 7.5, y - 7.5) < 7.5) g.fillRect(x, y, 1, 1); }, { clamp: true });
      blobMat = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false });
    }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), blobMat);
    m.rotation.x = -Math.PI / 2; m.position.y = 0.02; m.renderOrder = 1;
    return m;
  };
  return K;
})();
