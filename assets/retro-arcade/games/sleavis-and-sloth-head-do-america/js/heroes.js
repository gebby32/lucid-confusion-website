/* HEROES — Sleavis and Sloth-Head, from the SUPPLIED .glb models, untouched.
   The models arrive as ~600 static meshes each (no rig). At load time we:
     1. bake every mesh into model space and merge them per material (22 draw calls, not 600),
     2. give the merged mesh a 12-bone skeleton with procedural skin weights
        (head / chest / hips / upper+fore arms / thighs / shins, smoothly blended),
     3. keep the original PBR materials and add a studio env-map so they look GOOD
        against the deliberately ugly PS1 world.
   Heroes.load(cb) -> Heroes.sleavis, Heroes.slothhead : Hero visuals
   Hero visual: root (Group, world position + heading), setAnim(name), update(dt),
                headWorld(), forward(), show(on). */
'use strict';
const Heroes = (function () {
  const H = { ready: false, progress: 0, error: null };
  const SCALE = 0.74;                       // 2.52 m sculpt -> 1.86 m idiot (hood included)
  // joint pivots in model space (metres, Y up, facing +Z). "L" = -X side.
  const PIV = {
    hips: [0, 1.0, 0], chest: [0, 1.36, 0], head: [0, 1.78, 0.01],
    uArmL: [-0.24, 1.66, 0], fArmL: [-0.37, 1.34, 0.01], uArmR: [0.24, 1.66, 0], fArmR: [0.37, 1.34, 0.01],
    thighL: [-0.18, 0.98, 0], shinL: [-0.21, 0.56, 0.01], thighR: [0.18, 0.98, 0], shinR: [0.21, 0.56, 0.01]
  };
  const PARENT = { hips: null, chest: 'hips', head: 'chest', uArmL: 'chest', fArmL: 'uArmL', uArmR: 'chest', fArmR: 'uArmR', thighL: 'hips', shinL: 'thighL', thighR: 'hips', shinR: 'thighR' };
  const ORDER = ['hips', 'chest', 'head', 'uArmL', 'fArmL', 'uArmR', 'fArmR', 'thighL', 'shinL', 'thighR', 'shinR'];
  const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  // procedural skin weights for one vertex -> array over ORDER
  function weights(x, y, z) {
    const ax = Math.abs(x), L = x < 0;
    const w = new Float32Array(ORDER.length);
    // arms: anything outside the torso silhouette, between hand-claw tips and the shoulder
    const edge = y > 1.0 ? 0.205 + (1.72 - Math.min(1.72, y)) * 0.17 : 0.34;
    let arm = sm(edge - 0.035, edge + 0.035, ax) * sm(0.76, 0.82, y) * sm(1.86, 1.74, y);
    // head + hood
    const head = sm(1.70, 1.84, y) * (1 - arm);
    // legs
    const leg = sm(1.03, 0.88, y) * (1 - arm);
    const fore = sm(1.44, 1.26, y);
    const shin = sm(0.64, 0.48, y);
    const rest = Math.max(0, 1 - arm - head - leg);
    const chest = rest * sm(1.18, 1.42, y);
    w[ORDER.indexOf('hips')] = rest - chest;
    w[ORDER.indexOf('chest')] = chest;
    w[ORDER.indexOf('head')] = head;
    w[ORDER.indexOf(L ? 'uArmL' : 'uArmR')] = arm * (1 - fore);
    w[ORDER.indexOf(L ? 'fArmL' : 'fArmR')] = arm * fore;
    w[ORDER.indexOf(L ? 'thighL' : 'thighR')] = leg * (1 - shin);
    w[ORDER.indexOf(L ? 'shinL' : 'shinR')] = leg * shin;
    return w;
  }

  function b64ToBuf(b64) {
    const bin = atob(b64), n = bin.length, u = new Uint8Array(n);
    for (let i = 0; i < n; i++) u[i] = bin.charCodeAt(i);
    return u.buffer;
  }

  function build(gltf, name) {
    const T = THREE, BGU = T.BufferGeometryUtils;
    const root = gltf.scene;
    root.updateMatrixWorld(true);
    const byMat = new Map();
    root.traverse((o) => {
      if (!o.isMesh) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      let g = o.geometry.clone();
      g.applyMatrix4(o.matrixWorld);
      for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
      if (!g.attributes.normal) g.computeVertexNormals();
      if (!g.index) { const n = g.attributes.position.count, idx = new Uint32Array(n); for (let i = 0; i < n; i++) idx[i] = i; g.setIndex(new T.BufferAttribute(idx, 1)); }
      g.morphAttributes = {};
      const m = mats[0];
      if (!byMat.has(m)) byMat.set(m, []);
      byMat.get(m).push(g);
    });
    const parts = [], materials = [];
    for (const [m, list] of byMat) {
      const merged = BGU.mergeGeometries(list, false);
      if (!merged) continue;
      parts.push(merged);
      m.envMap = R3.envMap; m.envMapIntensity = 0.55;
      if (m.roughness !== undefined) m.roughness = Math.min(1, m.roughness * 1.05);
      m.side = T.DoubleSide;           // the hood shell is a thin open surface
      materials.push(m);
    }
    const geo = BGU.mergeGeometries(parts, true);
    // skin attributes
    const pos = geo.attributes.position, n = pos.count;
    const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    let minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < n; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      const w = weights(x, y, z);
      // top 4 influences
      const idx = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].sort((a, b) => w[b] - w[a]).slice(0, 4);
      let s = 0; for (const j of idx) s += w[j];
      if (s <= 0) { idx[0] = 0; w[0] = 1; s = 1; }
      for (let k = 0; k < 4; k++) { si[i * 4 + k] = idx[k] + 1; sw[i * 4 + k] = w[idx[k]] / s; }   // +1: bone 0 is the root
    }
    geo.setAttribute('skinIndex', new T.Uint16BufferAttribute(si, 4));
    geo.setAttribute('skinWeight', new T.Float32BufferAttribute(sw, 4));
    // skeleton
    const bones = { root: new T.Bone() }, list = [bones.root];
    for (const b of ORDER) {
      const bone = new T.Bone(); bone.name = b;
      const p = PIV[b], pp = PARENT[b] ? PIV[PARENT[b]] : [0, 0, 0];
      bone.position.set(p[0] - pp[0], p[1] - pp[1], p[2] - pp[2]);
      (PARENT[b] ? bones[PARENT[b]] : bones.root).add(bone);
      bones[b] = bone; list.push(bone);
    }
    const mesh = new T.SkinnedMesh(geo, materials);
    mesh.add(bones.root);
    mesh.bind(new T.Skeleton(list));
    mesh.frustumCulled = false;
    mesh.layers.set(1);
    return { mesh, bones, tris: geo.index.count / 3, verts: n, height: maxY - minY };
  }

  function makeHero(name, built) {
    const T = THREE;
    const h = {
      name, root: new T.Group(), model: new T.Group(), mesh: built.mesh, bones: built.bones,
      anim: 'idle', animT: 0, animO: {}, cur: null, style: name, blob: Mk.blob(0.42), visible: true, extraY: 0, tilt: 0
    };
    h.model.scale.setScalar(SCALE);
    h.model.add(built.mesh);
    h.root.add(h.model);
    h.root.add(h.blob);
    h.blob.layers.set(0);
    h.setAnim = function (a, o) {
      if (a !== h.anim || (o && o.restart)) { h.anim = a; h.animT = 0; }
      h.animO = o || {};
    };
    h.update = function (dt) {
      h.animT += dt;
      const o = Object.assign({ style: h.style }, h.animO);
      const c = Anim.apply(h, h.anim, h.animT, o, dt);
      h.model.position.y = c.rootY + h.extraY;
      // lying down (KO): rotate the whole model back onto the floor around the feet
      h.model.rotation.x = -c.lie * Math.PI / 2 + c.lean;
      h.model.position.z = 0;
      if (c.lie > 0.01) h.model.position.y += c.lie * 0.18;
      h.model.rotation.z = h.tilt;
      h.blob.position.y = 0.075 - h.root.position.y + (h.groundY || 0);
      h.blob.scale.setScalar(Math.max(0.3, 1 - Math.max(0, h.root.position.y - (h.groundY || 0)) * 0.3));
    };
    h.show = function (on) { h.root.visible = !!on; h.visible = !!on; };
    const v = new T.Vector3();
    h.headWorld = function () { h.bones.head.updateWorldMatrix(true, false); v.setFromMatrixPosition(h.bones.head.matrixWorld); return v.clone().add(new T.Vector3(0, 0.22, 0)); };
    h.forward = function () { const a = h.root.rotation.y; return new T.Vector3(Math.sin(a), 0, Math.cos(a)); };
    h.handWorld = function (right) {
      const b = h.bones[right ? 'fArmR' : 'fArmL']; b.updateWorldMatrix(true, false);
      return new T.Vector3(0, -0.36, 0.05).applyMatrix4(b.matrixWorld);
    };
    return h;
  }

  // Parse both embedded GLBs (window.GLB.*, see tools/embed-models.js), one per tick so the
  // loading screen can breathe.
  H.load = function (done) {
    const loader = new THREE.GLTFLoader();
    const todo = [['sleavis', 'sleavis'], ['slothhead', 'slothhead']];
    const next = () => {
      const item = todo.shift();
      if (!item) { H.ready = true; H.progress = 1; done && done(); return; }
      const b64 = window.GLB && window.GLB[item[1]];
      if (!b64) {
        // the model scripts may still be arriving: wait for them (up to ~60 s)
        item.tries = (item.tries || 0) + 1;
        if (item.tries > 600) { H.error = 'Model data missing: ' + item[1]; console.error(H.error); return; }
        todo.unshift(item); setTimeout(next, 100); return;
      }
      setTimeout(() => {
        try {
          loader.parse(b64ToBuf(b64), '', (gltf) => {
            try {
              const built = build(gltf, item[0]);
              H[item[0]] = makeHero(item[0], built);
              H.stats = H.stats || {}; H.stats[item[0]] = { tris: built.tris, verts: built.verts, height: built.height };
              window.GLB[item[1]] = null;               // free the base64 copy
              H.progress += 0.5;
              setTimeout(next, 30);
            } catch (e) { H.error = String(e); console.error(e); }
          }, (err) => { H.error = String(err && err.message || err); console.error(err); });
        } catch (e) { H.error = String(e); console.error(e); }
      }, 30);
    };
    next();
  };
  H.both = () => [H.sleavis, H.slothhead];
  return H;
})();
