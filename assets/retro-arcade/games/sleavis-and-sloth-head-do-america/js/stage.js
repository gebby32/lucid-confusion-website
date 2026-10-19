/* STAGE — the current 3D place: its geometry root, colliders, hotspots, triggers,
   breakable/throwable props, actors, and the camera rig.
   Stage.load(builderFn, arg) -> info (whatever the builder returns: spawn points etc.)
   Collision is circles (actors) against boxes (optionally rotated) and circles. Box tops
   are walkable, so the same code serves top-down exploring and side-on brawling. */
'use strict';
const Stage = (function () {
  const S = { cur: null, time: 0 };
  const T = () => THREE;

  S.load = function (builder, arg) {
    const sc = R3.scene;
    if (S.cur) { sc.remove(S.cur.root); for (const a of S.cur.actors) if (!a.hero) sc.remove(a.vis.root); }
    FX3.clear();
    const root = new THREE.Group();
    S.cur = { root, boxes: [], circles: [], hot: [], trig: [], props: [], actors: [], ticks: [], bounds: null, info: {}, name: builder.name || 'stage', floor: 0 };
    sc.add(root); sc.add(R3.lights); FX3.attach(sc);
    for (const h of Heroes.both()) { sc.add(h.root); h.show(false); }
    R3.setLight({});
    S.cam.mode = 'follow'; S.cam.yaw = 0; S.cam.dist = 7.5; S.cam.height = 4.6; S.cam.fixed = null; S.cam.snap = true; S.cam.lookH = 1.0; S.cam.fov = 55;
    S.cam.side = { z: 9, y: 2.8, lookY: 1.3 };
    const info = builder(root, S.cur, arg) || {};
    S.cur.info = info;
    return info;
  };
  S.tick = function (fn) { S.cur.ticks.push(fn); return fn; };

  // ------------------------------------------------------------------ colliders
  // box: x,z centre; y bottom; w (x), h, d (z); ry rotation. o = { name, walkable }
  S.addBox = function (x, y, z, w, h, d, ry, o) {
    const b = { x, z, y0: y || 0, y1: (y || 0) + h, hw: w / 2, hd: d / 2, c: Math.cos(ry || 0), s: Math.sin(ry || 0), on: true, o: o || {} };
    S.cur.boxes.push(b);
    return b;
  };
  S.addCircle = function (x, z, r, y, h) { const c = { x, z, r, y0: y || 0, y1: (y || 0) + (h || 3), on: true }; S.cur.circles.push(c); return c; };
  S.bounds = function (minx, maxx, minz, maxz) { S.cur.bounds = { minx, maxx, minz, maxz }; };

  function local(b, x, z) { const dx = x - b.x, dz = z - b.z; return [dx * b.c - dz * b.s, dx * b.s + dz * b.c]; }
  function world(b, lx, lz) { const c = b.c, s = -b.s; return [b.x + lx * c - lz * s, b.z + lx * s + lz * c]; }

  // highest walkable surface under (x, z) at or below height y (+ step)
  S.groundAt = function (x, z, y, r) {
    let g = S.cur ? S.cur.floor : 0;
    if (!S.cur) return g;
    r = r || 0;
    for (const b of S.cur.boxes) {
      if (!b.on || b.y1 > y + 0.36 || b.y1 <= g) continue;
      const l = local(b, x, z);
      if (Math.abs(l[0]) <= b.hw + r * 0.3 && Math.abs(l[1]) <= b.hd + r * 0.3) g = b.y1;
    }
    return g;
  };

  // push a circle (x, z, r) at feet height y, body height h out of every solid. returns [x, z, hitSomething]
  S.resolve = function (x, z, r, y, h) {
    let hit = false;
    if (!S.cur) return [x, z, false];
    for (let pass = 0; pass < 2; pass++) {
      for (const b of S.cur.boxes) {
        if (!b.on || b.y1 <= y + 0.35 || b.y0 >= y + h) continue;
        const l = local(b, x, z);
        const cx = LP.clamp(l[0], -b.hw, b.hw), cz = LP.clamp(l[1], -b.hd, b.hd);
        let dx = l[0] - cx, dz = l[1] - cz, d = Math.hypot(dx, dz);
        if (d >= r) continue;
        hit = true;
        if (d < 1e-4) {   // centre inside: push out along the shallowest axis
          const px = b.hw - Math.abs(l[0]), pz = b.hd - Math.abs(l[1]);
          if (px < pz) { l[0] = Math.sign(l[0] || 1) * (b.hw + r); } else { l[1] = Math.sign(l[1] || 1) * (b.hd + r); }
        } else { l[0] = cx + dx / d * r; l[1] = cz + dz / d * r; }
        const w = world(b, l[0], l[1]); x = w[0]; z = w[1];
      }
      for (const c of S.cur.circles) {
        if (!c.on || c.y1 <= y + 0.35 || c.y0 >= y + h) continue;
        const dx = x - c.x, dz = z - c.z, d = Math.hypot(dx, dz), m = c.r + r;
        if (d >= m) continue;
        hit = true;
        if (d < 1e-4) { x += m; continue; }
        x = c.x + dx / d * m; z = c.z + dz / d * m;
      }
    }
    const B = S.cur.bounds;
    if (B) { x = LP.clamp(x, B.minx + r, B.maxx - r); z = LP.clamp(z, B.minz + r, B.maxz - r); }
    return [x, z, hit];
  };

  // is the straight line between two points blocked by a tall box? (guards' eyes)
  S.blocked = function (x0, z0, x1, z1, eyeY) {
    const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.4);
    for (let i = 1; i < n; i++) {
      const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
      for (const b of S.cur.boxes) {
        if (!b.on || b.y1 < (eyeY || 1.4) || b.y0 > (eyeY || 1.4) || b.o.seeThrough) continue;
        const l = local(b, x, z);
        if (Math.abs(l[0]) < b.hw && Math.abs(l[1]) < b.hd) return true;
      }
    }
    return false;
  };

  // ------------------------------------------------------------------ hotspots / triggers / props
  // hot = { x, z, r, label, who: null|'sleavis'|'slothhead', act(S, actor) (fn or generator fn), cond(), once }
  S.hot = function (h) { h.r = h.r || 1.4; S.cur.hot.push(h); return h; };
  S.trigger = function (t) { t.r = t.r || 2; S.cur.trig.push(t); return t; };
  // prop = { mesh, x, y, z, kind: 'throw'|'break'|'pickup', hp, value, heavy, item, onBreak, r, box }
  S.prop = function (p) {
    p.r = p.r || 0.5; p.y = p.y || 0; p.alive = true;
    if (p.mesh) { p.mesh.position.x = p.x; p.mesh.position.z = p.z; if (!p.mesh.parent) S.cur.root.add(p.mesh); }
    S.cur.props.push(p);
    return p;
  };
  S.breakProp = function (p, by) {
    if (!p.alive) return;
    p.alive = false;
    if (p.box) p.box.on = false;
    if (p.mesh) p.mesh.visible = false;
    const pos = new THREE.Vector3(p.x, p.y + (p.cy || 0.6), p.z);
    FX3.burst(pos, p.chunks || 12, { colors: p.colors || ['#8a8a8a', '#4a4a4a', '#c8c8c8'], speed: 4, up: 4, size: p.chunkSize || 0.14 });
    if (p.value) Game.damage(p.value, pos);
    GameAudio.sfx(p.sound || 'smash');
    if (p.onBreak) p.onBreak(p, by);
  };
  S.addActor = function (a) { S.cur.actors.push(a); if (!a.hero) S.cur.root.add(a.vis.root); return a; };
  S.removeActor = function (a) { const i = S.cur.actors.indexOf(a); if (i >= 0) S.cur.actors.splice(i, 1); if (!a.hero) S.cur.root.remove(a.vis.root); };
  S.find = (id) => S.cur.actors.find((a) => a.id === id);

  // ------------------------------------------------------------------ camera
  S.cam = { mode: 'follow', yaw: 0, dist: 7.5, height: 4.6, lookH: 1.0, fixed: null, snap: true, pos: null, look: null, fov: 55, side: { z: 9, y: 2.8, lookY: 1.3 }, lerp: 5, xMin: -1e9, xMax: 1e9 };
  // cutscene shot: camera moves to pos looking at look over dur seconds (0 = cut)
  S.shot = function (pos, look, dur) {
    S.cam.fixed = { from: S.cam.pos ? S.cam.pos.clone() : new THREE.Vector3(...pos), fromLook: S.cam.look ? S.cam.look.clone() : new THREE.Vector3(...look), to: new THREE.Vector3(...pos), toLook: new THREE.Vector3(...look), t: 0, dur: dur || 0 };
  };
  S.release = function () { S.cam.fixed = null; };
  S.updateCamera = function (dt, focus) {
    const T3 = THREE, C = S.cam, cam = R3.camera;
    if (!C.pos) { C.pos = new T3.Vector3(0, 5, 8); C.look = new T3.Vector3(); }
    let tp, tl;
    if (C.fixed) {
      const f = C.fixed; f.t += dt;
      const k = f.dur > 0 ? Math.min(1, f.t / f.dur) : 1, e = k * k * (3 - 2 * k);
      tp = f.from.clone().lerp(f.to, e); tl = f.fromLook.clone().lerp(f.toLook, e);
      C.pos.copy(tp); C.look.copy(tl);
    } else if (focus) {
      if (C.mode === 'side') {
        const x = LP.clamp(focus.x, C.xMin, C.xMax);
        tp = new T3.Vector3(x, C.side.y + focus.y, focus.z * 0.4 + C.side.z + (C.side.zOff || 0));
        tl = new T3.Vector3(x, C.side.lookY + focus.y, focus.z * 0.4 + (C.side.zOff || 0));
      } else {
        const yw = C.yaw;
        tp = new T3.Vector3(focus.x + Math.sin(yw) * C.dist, focus.y + C.height, focus.z + Math.cos(yw) * C.dist);
        tl = new T3.Vector3(focus.x, focus.y + C.lookH, focus.z);
      }
      if (C.snap) { C.pos.copy(tp); C.look.copy(tl); C.snap = false; }
      else { const k = 1 - Math.exp(-C.lerp * dt); C.pos.lerp(tp, k); C.look.lerp(tl, k); }
    }
    cam.fov = C.fov; cam.position.copy(C.pos); cam.lookAt(C.look);
  };
  // camera-relative movement: input (ix, iy) -> world (dx, dz)
  S.inputToWorld = function (ix, iy) {
    if (S.cam.mode === 'side') return [ix, iy];
    const cam = R3.camera, f = new THREE.Vector3(); cam.getWorldDirection(f); f.y = 0; f.normalize();
    const r = new THREE.Vector3(-f.z, 0, f.x);
    return [r.x * ix - f.x * iy, r.z * ix - f.z * iy];
  };
  // world -> HUD pixel
  S.toScreen = function (v) {
    const p = v.clone().project(R3.camera);
    return [(p.x + 1) / 2 * G.W, (1 - p.y) / 2 * G.H, p.z < 1];
  };

  S.update = function (dt) {
    if (!S.cur) return;
    S.time += dt;
    for (const f of S.cur.ticks) f(dt, S.time);
    for (const a of S.cur.actors.slice()) a.update(dt);
    FX3.update(dt);
  };
  return S;
})();
