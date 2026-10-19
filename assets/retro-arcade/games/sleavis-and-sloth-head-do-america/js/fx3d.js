/* FX3 — cheap 3D juice in the chunky world layer: debris, beer spray, sparks, puke,
   explosions, and the orbital laser of the P.A.T.R.I.O.T. satellite.
   FX3.burst(pos, n, o) / FX3.explode(pos, size) / FX3.laser(x, z, cb) / FX3.update(dt) */
'use strict';
const FX3 = (function () {
  const F = { parts: [], blasts: [], beams: [], group: null };
  let geo = null;
  const mats = new Map();
  const mat = (c) => { if (!mats.has(c)) mats.set(c, new THREE.MeshBasicMaterial({ color: c })); return mats.get(c); };
  F.attach = function (scene) {
    if (!F.group) F.group = new THREE.Group();
    scene.add(F.group);
  };
  F.clear = function () {
    for (const p of F.parts) F.group.remove(p.m);
    for (const b of F.blasts) F.group.remove(b.m);
    for (const b of F.beams) F.group.remove(b.m);
    F.parts.length = F.blasts.length = F.beams.length = 0;
  };
  // n chunks flying out. o = { colors:[], speed, up, size, life, floor, grav }
  F.burst = function (pos, n, o) {
    o = o || {};
    if (!geo) geo = new THREE.BoxGeometry(1, 1, 1);
    const cols = o.colors || ['#a0a0a0', '#606060'];
    for (let i = 0; i < n; i++) {
      if (F.parts.length > 260) { const old = F.parts.shift(); F.group.remove(old.m); }
      const m = new THREE.Mesh(geo, mat(cols[i % cols.length]));
      const s = (o.size || 0.1) * LP.rand(0.6, 1.3);
      m.scale.set(s, s, s);
      m.position.set(pos.x + LP.rand(-0.1, 0.1), pos.y + LP.rand(-0.1, 0.1), pos.z + LP.rand(-0.1, 0.1));
      const a = Math.random() * Math.PI * 2, sp = (o.speed || 3) * LP.rand(0.3, 1);
      const dir = o.dir || null;
      const p = { m, vx: Math.cos(a) * sp + (dir ? dir.x * sp : 0), vz: Math.sin(a) * sp + (dir ? dir.z * sp : 0), vy: (o.up === undefined ? 3 : o.up) * LP.rand(0.5, 1.2),
        life: (o.life || 1.2) * LP.rand(0.7, 1.2), t: 0, floor: o.floor === undefined ? 0 : o.floor, grav: o.grav === undefined ? 14 : o.grav, spin: LP.rand(-10, 10) };
      F.group.add(m);
      F.parts.push(p);
    }
  };
  F.explode = function (pos, size, o) {
    o = o || {};
    size = size || 1;
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshBasicMaterial({ color: '#ffd040', transparent: true, opacity: 1 }));
    m.position.copy(pos); m.scale.setScalar(0.2);
    F.group.add(m);
    F.blasts.push({ m, t: 0, size, life: 0.55 });
    F.burst(pos, Math.round(14 * size), { colors: ['#ff8020', '#ffd040', '#3a3a3a', '#202020'], speed: 6 * Math.sqrt(size), up: 6 * Math.sqrt(size), size: 0.09 * Math.sqrt(size), life: 1.4, floor: o.floor !== undefined ? o.floor : (Stage.cur ? Stage.groundAt(pos.x, pos.z, pos.y) : 0) });
    if (!o.silent) GameAudio.sfx(size > 1.5 ? 'bigboom' : 'boom');
    Game.shake(size > 1.5 ? 0.35 : 0.2, 0.5);
    Game.flash(size > 1.5 ? 0.6 : 0.3);
  };
  // the orbital laser: a targeting ring, then a beam from the heavens, then a boom. cb(x, z) at impact.
  F.laser = function (x, z, cb, o) {
    o = o || {};
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.05, 12), new THREE.MeshBasicMaterial({ color: '#ff2020', side: THREE.DoubleSide, transparent: true, opacity: 0.9 }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(x, (o.y || 0) + 0.06, z);
    F.group.add(ring);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 120, 8, 1, true), new THREE.MeshBasicMaterial({ color: '#ff4060', transparent: true, opacity: 0, fog: false }));
    beam.position.set(x, (o.y || 0) + 60, z);
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 120, 6, 1, true), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, fog: false }));
    beam.add(core);
    F.group.add(beam);
    F.beams.push({ ring, m: beam, core, t: 0, delay: o.delay === undefined ? 1.1 : o.delay, x, z, y: o.y || 0, cb, fired: false, size: o.size || 1.6 });
    GameAudio.sfx('lockon');
  };
  F.update = function (dt) {
    LP.prune(F.parts, (p) => {
      p.t += dt;
      if (p.t >= p.life) { F.group.remove(p.m); return true; }
      p.vy -= p.grav * dt;
      p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt;
      if (p.m.position.y < p.floor + 0.03) { p.m.position.y = p.floor + 0.03; p.vy *= -0.35; p.vx *= 0.6; p.vz *= 0.6; p.spin *= 0.5; }
      p.m.rotation.x += p.spin * dt; p.m.rotation.y += p.spin * 0.7 * dt;
      return false;
    });
    LP.prune(F.blasts, (b) => {
      b.t += dt;
      const k = b.t / b.life;
      b.m.scale.setScalar(0.3 + k * 3.2 * b.size);
      b.m.material.opacity = Math.max(0, 1 - k);
      b.m.material.color.set(k < 0.3 ? '#fff0a0' : k < 0.6 ? '#ff9020' : '#802010');
      if (b.t >= b.life) { F.group.remove(b.m); b.m.geometry.dispose(); b.m.material.dispose(); return true; }
      return false;
    });
    LP.prune(F.beams, (b) => {
      b.t += dt;
      b.ring.rotation.z += dt * 4;
      b.ring.scale.setScalar(1 + Math.sin(b.t * 20) * 0.1);
      if (b.t >= b.delay && !b.fired) {
        b.fired = true;
        GameAudio.sfx('laser');
        F.explode(new THREE.Vector3(b.x, b.y + 0.5, b.z), b.size);
        if (b.cb) b.cb(b.x, b.z);
      }
      const on = b.t >= b.delay - 0.15 ? Math.max(0, 1 - (b.t - b.delay) / 0.6) : 0;
      b.m.material.opacity = on * 0.7; b.core.material.opacity = on;
      b.m.scale.set(0.4 + on, 1, 0.4 + on);
      if (b.t > b.delay + 0.7) { F.group.remove(b.ring); F.group.remove(b.m); return true; }
      return false;
    });
  };
  return F;
})();
