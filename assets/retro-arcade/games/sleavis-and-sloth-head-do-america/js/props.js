/* PROPS — the low-poly furniture of a dying nation. Every builder is
   P.thing(parent, x, z, ry, o) and returns its Group. While Props.col is true (area
   building) solid things also register colliders; the streaming modes switch it off.
   Breakable / throwable versions register Stage props (see P.breakable / P.throwable). */
'use strict';
const Props = (function () {
  const P = { col: true };
  const B = Mk.box, C = Mk.cyl;
  const grp = (p, x, z, ry, y) => { const g = new THREE.Group(); g.position.set(x || 0, y || 0, z || 0); g.rotation.y = ry || 0; if (p) p.add(g); return g; };
  // collider for a whole prop: local box w x d around the prop origin (rotated with ry)
  function solid(x, z, w, h, d, ry, y, o) { if (P.col && Stage.cur) return Stage.addBox(x, y || 0, z, w, h, d, ry || 0, o); return null; }
  P.solid = solid;
  // wrap a group as a breakable Stage prop
  P.breakable = function (g, o) {
    o = o || {};
    const box = o.box === false ? null : solid(g.position.x, g.position.z, o.w || 0.8, o.h || 1.2, o.d || 0.8, g.rotation.y, g.position.y);
    return Stage.prop(Object.assign({ mesh: g, x: g.position.x, y: g.position.y, z: g.position.z, kind: 'break', hp: o.hp || 2, value: o.value || 100, box, r: o.r || 0.6 }, o));
  };
  P.throwable = function (g, o) { return Stage.prop(Object.assign({ mesh: g, x: g.position.x, y: g.position.y, z: g.position.z, kind: 'throw', r: 0.5 }, o)); };

  // ------------------------------------------------------------------ outdoors
  P.house = function (p, x, z, ry, o) {
    o = o || {};
    const g = grp(p, x, z, ry), w = o.w || 8, d = o.d || 7, h = o.h || 3.2;
    B(g, w, h, d, Mat.get('siding', { color: o.color || '#c8b890' }), 0, 0, 0);
    // roof: two slanted slabs
    const roofM = Mat.get('shingles', { color: o.roof || '#ffffff' });
    const rw = d / 2 / Math.cos(0.5) + 0.4;
    B(g, w + 0.6, 0.2, rw, roofM, 0, h + Math.sin(0.5) * rw / 2 - 0.2, -d / 4, { rx: 0.5 });
    B(g, w + 0.6, 0.2, rw, roofM, 0, h + Math.sin(0.5) * rw / 2 - 0.2, d / 4, { rx: -0.5 });
    B(g, w, Math.tan(0.5) * d / 2, 0.2, Mat.get('siding', { color: o.color || '#c8b890' }), 0, h, 0, { rx: 0 });
    B(g, 1.1, 2.1, 0.1, o.door || '#6a3a20', o.doorX || 0, 0, d / 2 + 0.02);
    for (const wx of [-w / 3, w / 3]) { B(g, 1.3, 1.1, 0.08, Mat.get('#283848', { emissive: o.night ? '#a08030' : '#101820' }), wx, 1.1, d / 2 + 0.03); B(g, 1.5, 0.12, 0.12, '#e8e8e0', wx, 1.0, d / 2 + 0.05); }
    solid(x, z, ...(Math.abs(Math.sin(ry || 0)) > 0.5 ? [d, h, w] : [w, h, d]));
    return g;
  };
  P.building = function (p, x, z, w, d, h, o) {
    o = o || {};
    const g = grp(p, x, z, o.ry || 0);
    B(g, w, h, d, Mat.get(o.tex || 'stucco', { color: o.color }), 0, 0, 0, { tile: o.tile || 2 });
    B(g, w + 0.2, 0.3, d + 0.2, o.trim || '#6a5a4a', 0, h, 0);
    if (o.sign) { const s = Mk.sign(g, o.sign, 0, h + (o.signH || 0.9), d / 2 + 0.12, Object.assign({ bg: '#f8f0d0', fg: '#c02020', border: '#c02020' }, o.signO)); }
    if (o.windows !== false) for (let i = 0; i < Math.floor(w / 3); i++) B(g, 1.6, 1.2, 0.06, Mat.get('#3a4a5a', { emissive: '#182028' }), -w / 2 + 1.5 + i * 3, 1.0, d / 2 + 0.02);
    if (o.door !== false) B(g, 1.2, 2.2, 0.06, o.doorCol || '#5a3a2a', o.doorX || 0, 0, d / 2 + 0.04);
    if (o.solid !== false) solid(x, z, ...(Math.abs(Math.sin(o.ry || 0)) > 0.5 ? [d, h, w] : [w, h, d]));
    return g;
  };
  P.tree = function (p, x, z, o) {
    o = o || {};
    const g = grp(p, x, z, LP.rand(0, 6));
    C(g, 0.15, 0.22, 2.4, '#5a3a20', 0, 0, 0, { seg: 5 });
    if (o.dead) { B(g, 0.1, 1.2, 0.1, '#5a3a20', 0.3, 1.8, 0, { rz: -0.7 }); B(g, 0.1, 1, 0.1, '#5a3a20', -0.3, 2, 0, { rz: 0.6 }); }
    else { Mk.ball(g, 1.4, Mat.get('grass', { color: '#8aba6a' }), 0, 3.2, 0, { seg: 5, rings: 4 }); }
    solid(x, z, 0.5, 3, 0.5);
    return g;
  };
  P.palm = function (p, x, z) {
    const g = grp(p, x, z, LP.rand(0, 6));
    for (let i = 0; i < 6; i++) B(g, 0.32 - i * 0.02, 0.9, 0.32 - i * 0.02, '#8a6a3a', Math.sin(i * 0.3) * 0.2 * i, i * 0.85, 0, { rz: -0.06 });
    for (let i = 0; i < 6; i++) B(g, 0.5, 0.06, 2.4, '#3a8a3a', 0, 5, 0, { ry: i * 1.05, rx: 0.35 });
    solid(x, z, 0.5, 5, 0.5);
    return g;
  };
  P.pole = function (p, x, z) {
    const g = grp(p, x, z);
    C(g, 0.12, 0.15, 7, '#5a4030', 0, 0, 0, { seg: 5 });
    B(g, 2.2, 0.12, 0.12, '#5a4030', 0, 6.4, 0);
    solid(x, z, 0.35, 6, 0.35);
    return g;
  };
  P.farm = function (p, x, z) {
    const g = grp(p, x, z, LP.rand(-0.4, 0.4));
    B(g, 8, 5, 10, Mat.get('planks', { color: '#c04030' }), 0, 0, 0);
    B(g, 8.6, 0.3, 6, '#5a5a5a', 0, 5.6, -2.4, { rx: 0.6 }); B(g, 8.6, 0.3, 6, '#5a5a5a', 0, 5.6, 2.4, { rx: -0.6 });
    Mk.sign(g, 'JESUS HATES\nCITY FOLK', 0, 3, 5.05, { bg: '#f0f0e0', fg: '#202020', font: 'small' });
    return g;
  };
  P.cactus = function (p, x, z) {
    const g = grp(p, x, z, LP.rand(0, 6)), s = LP.rand(0.7, 1.4);
    const m = Mat.get('grass', { color: '#7ab05a' });
    B(g, 0.45 * s, 2.6 * s, 0.45 * s, m, 0, 0, 0);
    B(g, 0.3 * s, 1.0 * s, 0.3 * s, m, 0.5 * s, 1.0 * s, 0); B(g, 0.6 * s, 0.3 * s, 0.3 * s, m, 0.3 * s, 1.0 * s, 0);
    B(g, 0.3 * s, 0.8 * s, 0.3 * s, m, -0.5 * s, 1.4 * s, 0); B(g, 0.6 * s, 0.3 * s, 0.3 * s, m, -0.3 * s, 1.4 * s, 0);
    solid(x, z, 0.5 * s, 2.6 * s, 0.5 * s);
    return g;
  };
  P.mesa = function (p, x, z) {
    const g = grp(p, x, z, LP.rand(0, 6)), s = LP.rand(0.8, 1.6);
    const m = Mat.get('rock', { color: '#e0a080' });
    B(g, 18 * s, 10 * s, 12 * s, m, 0, 0, 0, { tile: 6 });
    B(g, 10 * s, 6 * s, 8 * s, m, 3 * s, 10 * s, 0, { tile: 6 });
    return g;
  };
  P.mailbox = function (p, x, z) {
    const g = grp(p, x, z);
    B(g, 0.1, 1.0, 0.1, '#5a4030', 0, 0, 0);
    B(g, 0.3, 0.3, 0.5, Mat.get('metal', { color: LP.pick(['#3050a0', '#a03030', '#e0e0e0', '#303030']) }), 0, 1.0, 0);
    return g;
  };
  P.billboard = function (p, x, z, text, ry) {
    const g = grp(p, x, z, ry || 0);
    B(g, 0.25, 5, 0.25, '#4a3a2a', -2.5, 0, 0); B(g, 0.25, 5, 0.25, '#4a3a2a', 2.5, 0, 0);
    const t = typeof text === 'string' ? { text, bg: '#f0e8c8', fg: '#c02020' } : text;
    Mk.sign(g, t.text, 0, 5.4, 0.15, { width: 7.5, height: 3.2, bg: t.bg, fg: t.fg, border: t.fg, font: t.font || 'big', scale: t.scale || 1, w: 150, h: 64 });
    B(g, 7.8, 3.4, 0.2, '#3a3a3a', 0, 3.7, 0);
    return g;
  };
  P.can = function (p, x, z) {
    const g = grp(p, x, z);
    C(g, 0.15, 0.15, 0.42, Mat.get(Tex.make('beercan', 16, 16, (c) => { c.fillStyle = '#e8e8f0'; c.fillRect(0, 0, 16, 16); c.fillStyle = '#c02020'; c.fillRect(0, 5, 16, 6); c.fillStyle = '#2040c0'; c.fillRect(0, 0, 16, 3); }), { emissive: '#302010' }), 0, 0.5, 0, { seg: 6 });
    g.userData.spin = true;
    return g;
  };
  P.cone = function (p, x, z) { const g = grp(p, x, z); Mk.cone(g, 0.28, 0.75, Mat.get('stripes', { color: '#ff8030' }), 0, 0, 0, { seg: 5 }); B(g, 0.6, 0.06, 0.6, '#ff7020', 0, 0, 0); return g; };
  P.armadillo = function (p, x, z) {
    const g = grp(p, x, z, Math.PI / 2);
    Mk.ball(g, 0.4, Mat.get('metal', { color: '#8a8a7a' }), 0, 0.15, 0, { sy: 0.55 });
    B(g, 0.15, 0.15, 0.3, '#9a8a7a', 0, 0.05, 0.4);
    for (const s of [-1, 1]) for (const f of [-1, 1]) B(g, 0.06, 0.25, 0.06, '#7a6a5a', s * 0.2, 0.25, f * 0.2, { rz: s * 0.3 });   // legs. up. respectfully.
    return g;
  };
  P.tumbleweed = function (p, x, z) { const g = grp(p, x, z); Mk.ball(g, 0.45, Mat.get('#a08050', { transparent: true, opacity: 0.85 }), 0, 0.45, 0, { seg: 5, rings: 4 }); return g; };
  P.hydrant = function (p, x, z) { const g = grp(p, x, z); C(g, 0.14, 0.16, 0.7, '#d02020', 0, 0, 0, { seg: 6 }); B(g, 0.45, 0.1, 0.1, '#d02020', 0, 0.4, 0); solid(x, z, 0.35, 0.8, 0.35); return g; };
  P.lamp = function (p, x, z, o) {
    const g = grp(p, x, z, (o && o.ry) || 0);
    C(g, 0.07, 0.1, 5.5, '#4a4a50', 0, 0, 0, { seg: 5 });
    B(g, 1.2, 0.1, 0.1, '#4a4a50', 0.5, 5.4, 0);
    B(g, 0.4, 0.15, 0.25, Mat.get('#fff0a0', { emissive: '#d0b040' }), 1.0, 5.25, 0);
    solid(x, z, 0.25, 5, 0.25);
    return g;
  };
  P.fence = function (p, x0, z0, x1, z1, o) {
    o = o || {};
    const len = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0) - Math.PI / 2;
    const g = grp(p, (x0 + x1) / 2, (z0 + z1) / 2, ry);
    const h = o.h || 1.3;
    if (o.chain) { B(g, len, h, 0.05, Mat.get(Tex.make('chain', 16, 16, (c) => { c.clearRect(0, 0, 16, 16); c.strokeStyle = '#b0b0b0'; c.lineWidth = 1; for (let i = -16; i < 32; i += 4) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 16, 16); c.stroke(); c.beginPath(); c.moveTo(i + 16, 0); c.lineTo(i, 16); c.stroke(); } }), { transparent: true, alphaTest: 0.5, double: true }), 0, 0, 0, { tile: 1 }); }
    else B(g, len, h, 0.08, Mat.get('planks', { color: o.color || '#c8a878' }), 0, 0, 0, { tile: 1.5 });
    for (let i = 0; i <= Math.floor(len / 2.5); i++) B(g, 0.14, h + 0.15, 0.14, o.chain ? '#909090' : '#8a6a4a', -len / 2 + i * 2.5, 0, 0);
    if (P.col && Stage.cur) Stage.addBox((x0 + x1) / 2, 0, (z0 + z1) / 2, len, h + (o.extra || 0), 0.3, ry, { seeThrough: !!o.chain });
    return g;
  };
  P.wall = function (p, x0, z0, x1, z1, h, look, o) {
    o = o || {};
    const len = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0) - Math.PI / 2;
    const g = grp(p, (x0 + x1) / 2, (z0 + z1) / 2, ry);
    B(g, len, h, o.thick || 0.25, look, 0, o.y || 0, 0, { tile: o.tile || 2 });
    if (P.col && Stage.cur && o.solid !== false) Stage.addBox((x0 + x1) / 2, o.y || 0, (z0 + z1) / 2, len, h, (o.thick || 0.25) + 0.1, ry);
    return g;
  };
  // a whole room: floor + 4 walls (front wall optional so the camera can see in)
  P.room = function (p, x, z, w, d, h, o) {
    o = o || {};
    Mk.plane(p, w, d, o.floor || 'linoleum', x, 0.005, z, { tile: o.floorTile || 2 });
    const wl = o.wall || 'wallpaper';
    P.wall(p, x - w / 2, z - d / 2, x + w / 2, z - d / 2, h, wl);
    P.wall(p, x - w / 2, z - d / 2, x - w / 2, z + d / 2, h, wl);
    P.wall(p, x + w / 2, z - d / 2, x + w / 2, z + d / 2, h, wl);
    if (o.front) P.wall(p, x - w / 2, z + d / 2, x + w / 2, z + d / 2, h, wl);
    else if (P.col && Stage.cur) Stage.addBox(x, 0, z + d / 2 + 0.15, w, 3, 0.3, 0, { seeThrough: true });
    if (o.ceiling) Mk.plane(p, w, d, o.ceiling, x, h, z, { tile: 2 }).rotation.x = Math.PI / 2;
  };

  // ------------------------------------------------------------------ vehicles (face +Z)
  function wheels(g, xs, zs, r) { for (const x of xs) for (const z of zs) C(g, r, r, 0.28, '#1a1a1a', x, r - 0.14, z, { rz: Math.PI / 2, seg: 7 }); }
  P.car = function (p, x, z, ry, o) {
    o = o || {};
    const g = grp(p, x, z, ry), col = o.color || LP.pick(['#a03030', '#3050a0', '#d0c040', '#e0e0e0', '#405a40', '#7a4a8a', '#d08030']);
    B(g, 1.9, 0.7, 4.2, Mat.get('metal', { color: col }), 0, 0.35, 0);
    B(g, 1.7, 0.6, 2.1, Mat.get('#283848', { emissive: '#101820' }), 0, 1.05, -0.2);
    B(g, 1.72, 0.08, 2.0, Mat.get('metal', { color: col }), 0, 1.65, -0.2);
    B(g, 0.4, 0.2, 0.05, '#fff8c0', -0.6, 0.6, 2.11); B(g, 0.4, 0.2, 0.05, '#fff8c0', 0.6, 0.6, 2.11);
    B(g, 0.4, 0.2, 0.05, '#c02020', -0.6, 0.6, -2.11); B(g, 0.4, 0.2, 0.05, '#c02020', 0.6, 0.6, -2.11);
    wheels(g, [-0.9, 0.9], [-1.3, 1.3], 0.38);
    if (o.solid) solid(x, z, ...(Math.abs(Math.sin(ry || 0)) > 0.5 ? [4.3, 1.7, 2] : [2, 1.7, 4.3]));
    return g;
  };
  P.copcar = function (p, x, z, ry, o) {
    const g = P.car(p, x, z, ry, Object.assign({ color: '#e8e8e8' }, o));
    B(g, 1.92, 0.3, 1.4, '#1a1a1a', 0, 0.6, 0.4);
    const l1 = B(g, 0.5, 0.18, 0.3, Mat.get('#ff2020', { unlit: true }), -0.35, 1.73, -0.2);
    const l2 = B(g, 0.5, 0.18, 0.3, Mat.get('#2040ff', { unlit: true }), 0.35, 1.73, -0.2);
    l1.material = new THREE.MeshBasicMaterial({ color: '#ff2020' }); l2.material = new THREE.MeshBasicMaterial({ color: '#2040ff' });
    g.userData.lights = [l1, l2];
    Mk.sign(g, 'POLICE', 0, 0.9, 2.12, { bg: '#e8e8e8', fg: '#1a1a6a', font: 'small' });
    return g;
  };
  P.pickup = function (p, x, z, ry, o) {
    o = o || {};
    const g = grp(p, x, z, ry), col = o.color || LP.pick(['#8a3a2a', '#3a5a8a', '#6a6a5a', '#c0a060']);
    B(g, 2, 0.8, 5, Mat.get('metal', { color: col }), 0, 0.4, 0);
    B(g, 1.9, 0.75, 1.6, Mat.get('#283848', { emissive: '#101820' }), 0, 1.2, 0.6);
    B(g, 1.92, 0.08, 1.5, Mat.get('metal', { color: col }), 0, 1.95, 0.6);
    B(g, 2, 0.5, 0.1, Mat.get('metal', { color: col }), 0, 1.2, -2.45); B(g, 0.1, 0.5, 2.4, Mat.get('metal', { color: col }), -0.95, 1.2, -1.2); B(g, 0.1, 0.5, 2.4, Mat.get('metal', { color: col }), 0.95, 1.2, -1.2);
    if (o.gun) B(g, 1.6, 0.08, 0.1, '#3a2a1a', 0, 1.6, -0.2);
    wheels(g, [-0.95, 0.95], [-1.6, 1.5], 0.45);
    if (o.solid) solid(x, z, ...(Math.abs(Math.sin(ry || 0)) > 0.5 ? [5, 2, 2] : [2, 2, 5]));
    return g;
  };
  // glass you can see the (crisp) heroes through: transparent and NOT written to depth
  let glassM = null;
  P.glass = () => glassM || (glassM = Mat.snap(new THREE.MeshLambertMaterial({ color: '#80a0c0', transparent: true, opacity: 0.25, depthWrite: false })));
  P.semi = function (p, x, z, ry, o) {
    o = o || {};
    const g = grp(p, x, z, ry);
    if (o.bobtail) {
      // Earl's rig, minus the trailer, with windows all round so you can watch the idiots drive
      const col = Mat.get('metal', { color: o.color || '#c03030' });
      B(g, 2.5, 1.2, 2.6, col, 0, 0.6, 4.2); B(g, 2.5, 0.25, 2.6, col, 0, 2.95, 4.2);
      for (const sx of [-1.17, 1.17]) for (const sz of [2.97, 5.43]) B(g, 0.16, 1.15, 0.16, col, sx, 1.8, sz);
      B(g, 2.3, 1.1, 0.04, P.glass(), 0, 1.82, 5.45); B(g, 2.3, 1.1, 0.04, P.glass(), 0, 1.82, 2.95);
      B(g, 0.04, 1.1, 2.3, P.glass(), -1.24, 1.82, 4.2); B(g, 0.04, 1.1, 2.3, P.glass(), 1.24, 1.82, 4.2);
      B(g, 2.6, 1.0, 3.2, col, 0, 0.6, 6.9);                                         // the long nose
      B(g, 2.2, 0.8, 1.6, '#2a2a2a', 0, 0.6, 1.8);                                   // the fifth wheel. no fifth wheel was harmed.
      Mk.sign(g, 'BIG EARL', 1.27, 1.2, 4.2, { bg: '#e8e8e8', fg: '#a02020', font: 'small' }).rotation.y = Math.PI / 2;
      C(g, 0.1, 0.1, 1.8, '#c0c0c0', 1.0, 2.6, 3.0, { seg: 5 }); C(g, 0.1, 0.1, 1.8, '#c0c0c0', -1.0, 2.6, 3.0, { seg: 5 });
      wheels(g, [-1.1, 1.1], [7.4, 4.0, 1.8], 0.55);
      return g;
    }
    B(g, 2.5, 2.6, 2.6, Mat.get('metal', { color: o.color || LP.pick(['#c03030', '#3050a0', '#e8e8e8', '#e0a020']) }), 0, 0.6, 4.2);
    B(g, 2.3, 0.9, 0.1, Mat.get('#283848', { emissive: '#101820' }), 0, 2.0, 5.52);
    B(g, 2.6, 3.4, 9, Mat.get('corrugated', { color: '#e8e8e8' }), 0, 0.9, -1.8, { tile: 3 });
    if (o.logo !== false) Mk.sign(g, LP.pick(['MEAT\nTRUCKING', 'LIVESTOCK?\nNO.', 'HONK IF\nYOU\'RE LOST', 'BIG EARL\'S\nFREIGHT']), 1.31, 2.6, -1.8, { bg: '#e8e8e8', fg: '#a02020', font: 'big' }).rotation.y = Math.PI / 2;
    C(g, 0.1, 0.1, 1.8, '#c0c0c0', 1.0, 2.6, 3.0, { seg: 5 }); C(g, 0.1, 0.1, 1.8, '#c0c0c0', -1.0, 2.6, 3.0, { seg: 5 });
    wheels(g, [-1.1, 1.1], [4.8, 2.5, -4, -5.4], 0.55);
    if (o.solid) solid(x, z, ...(Math.abs(Math.sin(ry || 0)) > 0.5 ? [12, 4, 2.6] : [2.6, 4, 12]));
    return g;
  };
  P.rv = function (p, x, z, ry) {
    const g = grp(p, x, z, ry);
    B(g, 2.5, 2.8, 7, Mat.get('siding', { color: '#f0e8d0' }), 0, 0.5, 0);
    B(g, 2.52, 0.4, 7, '#a06030', 0, 1.6, 0);
    B(g, 2.2, 0.8, 0.1, Mat.get('#283848', { emissive: '#101820' }), 0, 2.0, 3.52);
    Mk.sign(g, 'GRANDMA\'S\nON BOARD', 1.27, 2.4, -1.5, { bg: '#f0e8d0', fg: '#3050a0', font: 'small' }).rotation.y = Math.PI / 2;
    wheels(g, [-1.2, 1.2], [-2.5, 2.4], 0.5);
    return g;
  };
  // THE VAN. o = { roof, graffiti, solid }
  P.van = function (p, x, z, ry, o) {
    o = o || {};
    const g = grp(p, x, z, ry);
    const vanTex = Tex.make('vanside' + (o.graffiti ? 'g' : ''), 64, 32, (c) => {
      Tex.noise(c, 64, 32, '#a8b0c0', 0.22, 41);
      c.fillStyle = 'rgba(120,60,20,0.55)'; for (let i = 0; i < 18; i++) c.fillRect((i * 37) % 64, (i * 13) % 32, 3 + (i % 4), 2 + (i % 3));
      if (o.graffiti) { Font.draw(c, 'SLOTHS', 32, 6, '#1a1a1a', { face: 'small', align: 'center', scale: 2 }); Font.draw(c, 'RULE', 32, 19, '#1a1a1a', { face: 'small', align: 'center', scale: 2 }); }
    });
    const side = Mat.get(vanTex), body = Mat.get('metal', { color: '#a8b0c0' });
    const H = o.roof ? 2.3 : 1.55;
    // side panels carry one big decal each (plain 0..1 UVs, no tiling)
    const sideGeo = new THREE.BoxGeometry(0.1, H - 0.5, 4.8);
    for (const sx of [-1.0, 1.0]) { const m = new THREE.Mesh(sideGeo, [side, side, body, body, body, body]); m.position.set(sx, 0.5 + (H - 0.5) / 2, 0); g.add(m); }
    B(g, 2.1, H - 0.5, 0.1, body, 0, 0.5, 2.35); B(g, 2.1, H - 0.5, 0.1, body, 0, 0.5, -2.35);
    B(g, 2.0, 0.08, 4.7, '#3a3428', 0, 0.5, 0);
    if (o.roof) B(g, 2.1, 0.1, 4.8, body, 0, H - 0.1, 0);
    if (o.roof) { B(g, 1.9, 0.7, 0.08, Mat.get('#283848', { emissive: '#101820' }), 0, 1.4, 2.42); B(g, 0.08, 0.6, 0.9, Mat.get('#283848', { emissive: '#101820' }), 1.06, 1.45, 1.6); B(g, 0.08, 0.6, 0.9, Mat.get('#283848', { emissive: '#101820' }), -1.06, 1.45, 1.6); }
    else {
      // convertible now, thanks to the remote: a scorched, sliced-off top edge and a windshield frame
      for (const sx of [-1.03, 1.03]) B(g, 0.12, 0.06, 4.82, '#2a2a2a', sx, H, 0);                       // scorched edge
      for (const sz of [-2.38, 2.38]) B(g, 2.12, 0.06, 0.12, '#2a2a2a', 0, H, sz);
      B(g, 1.9, 0.6, 0.06, Mat.get('#5a7090', { transparent: true, opacity: 0.45 }), 0, H, 1.95, { rx: -0.3 });
      B(g, 0.6, 0.18, 0.6, '#5a4a3a', 0.5, 0.55, 0.4); B(g, 0.6, 0.18, 0.6, '#5a4a3a', -0.5, 0.55, 0.4);     // seats
      B(g, 0.6, 0.7, 0.12, '#5a4a3a', 0.5, 0.7, 0.05); B(g, 0.6, 0.7, 0.12, '#5a4a3a', -0.5, 0.7, 0.05);
      C(g, 0.18, 0.18, 0.05, '#1a1a1a', 0.5, 1.2, 1.3, { rx: 1.2, seg: 8 });                                // steering wheel
      B(g, 1.9, 0.4, 1.3, '#4a4a40', 0, 0.55, -1.5);                                                         // junk in the back
    }
    B(g, 0.35, 0.2, 0.05, '#fff8c0', -0.7, 0.75, 2.42); B(g, 0.35, 0.2, 0.05, '#fff8c0', 0.7, 0.75, 2.42);
    B(g, 0.3, 0.4, 0.05, '#c02020', -0.85, 0.9, -2.42); B(g, 0.3, 0.4, 0.05, '#c02020', 0.85, 0.9, -2.42);
    B(g, 2.2, 0.25, 0.25, '#5a5a5a', 0, 0.35, 2.45);
    wheels(g, [-0.95, 0.95], [-1.5, 1.5], 0.42);
    if (o.solid) solid(x, z, ...(Math.abs(Math.sin(ry || 0)) > 0.5 ? [4.9, 2, 2.2] : [2.2, 2, 4.9]));
    return g;
  };
  P.cart = function (p, x, z, ry) {   // golf cart
    const g = grp(p, x, z, ry);
    B(g, 1.3, 0.5, 2.3, '#e8e8e0', 0, 0.3, 0);
    for (const sx of [-0.6, 0.6]) for (const sz of [-0.9, 0.9]) B(g, 0.06, 1.3, 0.06, '#c0c0c0', sx, 0.8, sz);
    B(g, 1.4, 0.08, 2.2, '#3a7a3a', 0, 2.05, 0);
    wheels(g, [-0.65, 0.65], [-0.8, 0.8], 0.25);
    return g;
  };

  // ------------------------------------------------------------------ indoors
  P.counter = function (p, x, z, w, ry, o) { const g = grp(p, x, z, ry); B(g, w, 1.0, 0.8, Mat.get((o && o.tex) || 'planks', { color: (o && o.color) || '#c8c0b0' }), 0, 0, 0); B(g, w + 0.1, 0.06, 0.9, (o && o.top) || '#e8e0d0', 0, 1.0, 0); solid(x, z, ...(Math.abs(Math.sin(ry || 0)) > 0.5 ? [0.9, 1.1, w] : [w, 1.1, 0.9])); return g; };
  P.shelf = function (p, x, z, w, ry, o) {
    const g = grp(p, x, z, ry);
    B(g, w, 1.9, 0.6, '#9a9a9a', 0, 0, 0);
    const cols = (o && o.cols) || ['#c03030', '#e0c030', '#3050c0', '#30a040', '#e07020', '#a040a0'];
    for (let s = 0; s < 3; s++) for (let i = 0; i < Math.floor(w / 0.35); i++) B(g, 0.24, 0.3, 0.3, cols[(i * 7 + s * 3) % cols.length], -w / 2 + 0.2 + i * 0.35, 0.25 + s * 0.6, 0.18);
    solid(x, z, ...(Math.abs(Math.sin(ry || 0)) > 0.5 ? [0.7, 2, w] : [w, 2, 0.7]));
    return g;
  };
  P.fridge = function (p, x, z, ry) { const g = grp(p, x, z, ry); B(g, 0.8, 1.9, 0.75, Mat.get('metal', { color: '#e8e4d0' }), 0, 0, 0); B(g, 0.05, 0.5, 0.05, '#808080', 0.3, 1.1, 0.4); Mk.sign(g, 'DO NOT\nOPEN\nEVER', 0, 1.4, 0.38, { bg: '#ffff80', fg: '#202020', font: 'small' }); solid(x, z, 0.8, 1.9, 0.75, ry); return g; };
  P.tv = function (p, x, z, ry, o) {
    const g = grp(p, x, z, ry, (o && o.y) || 0);
    B(g, 1.0, 0.8, 0.7, '#3a3028', 0, 0, 0);
    const scr = Tex.make('tvstatic' + ((o && o.ch) || ''), 32, 24, (c) => { const r = RNG(5); for (let y = 0; y < 24; y++) for (let x2 = 0; x2 < 32; x2++) { const v = Math.floor(r() * 255); c.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; c.fillRect(x2, y, 1, 1); } });
    const s = B(g, 0.78, 0.58, 0.04, new THREE.MeshBasicMaterial({ map: scr }), -0.05, 0.11, 0.36);
    g.userData.screen = s;
    B(g, 0.06, 0.25, 0.06, '#a0a0a0', 0.2, 0.8, 0, { rz: 0.4 }); B(g, 0.06, 0.25, 0.06, '#a0a0a0', -0.2, 0.8, 0, { rz: -0.4 });
    return g;
  };
  P.couch = function (p, x, z, ry, o) {
    const g = grp(p, x, z, ry), m = Mat.get('carpet', { color: (o && o.color) || '#c08a50' });
    B(g, 2.4, 0.5, 0.9, m, 0, 0, 0); B(g, 2.4, 0.6, 0.25, m, 0, 0.5, -0.33); B(g, 0.25, 0.3, 0.9, m, -1.1, 0.5, 0); B(g, 0.25, 0.3, 0.9, m, 1.1, 0.5, 0);
    B(g, 0.9, 0.12, 0.6, '#8a5a3a', -0.5, 0.5, 0.05, { ry: 0.1 }); B(g, 0.9, 0.12, 0.6, '#9a6a4a', 0.5, 0.5, 0.05, { ry: -0.08 });
    solid(x, z, ...(Math.abs(Math.sin(ry || 0)) > 0.5 ? [1, 0.8, 2.4] : [2.4, 0.8, 1]));
    return g;
  };
  P.bed = function (p, x, z, ry, o) {
    const g = grp(p, x, z, ry);
    B(g, 1.6, 0.5, 2.1, '#6a4a2a', 0, 0, 0);
    B(g, 1.55, 0.2, 2.0, Mat.get('carpet', { color: (o && o.color) || '#e0a0b0' }), 0, 0.5, 0);
    B(g, 1.6, 1.0, 0.12, '#6a4a2a', 0, 0, -1.05);
    B(g, 0.6, 0.15, 0.4, '#f0f0e0', -0.4, 0.7, -0.7); B(g, 0.6, 0.15, 0.4, '#f0f0e0', 0.4, 0.7, -0.7);
    solid(x, z, ...(Math.abs(Math.sin(ry || 0)) > 0.5 ? [2.1, 0.7, 1.6] : [1.6, 0.7, 2.1]));
    return g;
  };
  P.toilet = function (p, x, z, ry, o) {
    const g = grp(p, x, z, ry), m = Mat.get('#f0f0e8');
    B(g, 0.45, 0.42, 0.55, m, 0, 0, 0.05); B(g, 0.5, 0.06, 0.6, (o && o.gross) ? '#c8b060' : '#f8f8f0', 0, 0.42, 0.07);
    B(g, 0.5, 0.6, 0.22, m, 0, 0.4, -0.28);
    if (o && o.gross) B(g, 0.36, 0.02, 0.4, '#8a6a20', 0, 0.45, 0.08);
    solid(x, z, 0.6, 0.9, 0.8, ry);
    return g;
  };
  P.sink = function (p, x, z, ry) { const g = grp(p, x, z, ry); B(g, 0.6, 0.85, 0.45, '#d8d8d0', 0, 0, 0); B(g, 0.08, 0.25, 0.08, '#a0a0a0', 0, 0.85, -0.1); B(g, 0.6, 0.8, 0.04, Mat.get('#a0b8c8', { emissive: '#203038' }), 0, 1.3, -0.24); solid(x, z, 0.6, 0.9, 0.5, ry); return g; };
  P.urinal = function (p, x, z, ry) { const g = grp(p, x, z, ry); B(g, 0.45, 0.7, 0.35, '#f0f0e8', 0, 0.5, 0); B(g, 0.3, 0.05, 0.2, '#e8d060', 0, 0.55, 0.05); return g; };
  P.stall = function (p, x, z, ry, o) {
    const g = grp(p, x, z, ry), m = Mat.get('metal', { color: (o && o.color) || '#7a8a9a' });
    B(g, 0.06, 1.9, 1.5, m, -0.6, 0.15, 0); B(g, 0.06, 1.9, 1.5, m, 0.6, 0.15, 0);
    if (!(o && o.open)) B(g, 1.1, 1.7, 0.06, m, 0, 0.25, 0.73);
    if (P.col && Stage.cur) { Stage.addBox(x + Math.cos(ry || 0) * -0.6, 0, z - Math.sin(ry || 0) * -0.6, 0.15, 2, 1.5, ry || 0); Stage.addBox(x + Math.cos(ry || 0) * 0.6, 0, z - Math.sin(ry || 0) * 0.6, 0.15, 2, 1.5, ry || 0); }
    return g;
  };
  P.vending = function (p, x, z, ry, o) {
    o = o || {};
    const g = grp(p, x, z, ry);
    B(g, 1.1, 2.0, 0.8, Mat.get('metal', { color: o.color || '#c02020' }), 0, 0, 0);
    const front = Tex.make('vend' + (o.label || ''), 32, 48, (c) => {
      c.fillStyle = '#202830'; c.fillRect(0, 0, 32, 48);
      const cs = ['#e04040', '#e0c040', '#40a0e0', '#60c040', '#e080c0'];
      for (let r = 0; r < 5; r++) for (let i = 0; i < 4; i++) { c.fillStyle = cs[(r + i) % 5]; c.fillRect(2 + i * 6, 3 + r * 7, 4, 5); }
      c.fillStyle = '#e8e8e8'; c.fillRect(26, 6, 5, 20); c.fillStyle = '#101010'; c.fillRect(2, 40, 22, 6);
      Font.draw(c, o.label || 'SNAX', 16, 42, '#ffe040', { face: 'small', align: 'center' });
    });
    B(g, 0.95, 1.6, 0.04, Mat.get(front, { emissive: '#303030' }), 0, 0.25, 0.41);
    return g;
  };
  P.icemachine = function (p, x, z, ry) { const g = grp(p, x, z, ry); B(g, 1.0, 1.6, 0.8, Mat.get('metal', { color: '#d8dce0' }), 0, 0, 0); Mk.sign(g, 'ICE', 0, 1.3, 0.41, { bg: '#2050c0', fg: '#ffffff' }); Mk.sign(g, 'OUT OF\nORDER\nSINCE \'91', 0, 0.8, 0.42, { bg: '#ffff80', fg: '#202020', font: 'small' }); solid(x, z, 1, 1.6, 0.8, ry); return g; };
  P.arcade = function (p, x, z, ry, o) {
    const g = grp(p, x, z, ry);
    B(g, 0.8, 1.9, 0.8, Mat.get('planks', { color: (o && o.color) || '#3a2a6a' }), 0, 0, 0);
    B(g, 0.7, 0.5, 0.05, new THREE.MeshBasicMaterial({ color: '#40e0a0' }), 0, 1.15, 0.38, { rx: -0.2 });
    B(g, 0.8, 0.12, 0.35, '#202020', 0, 0.95, 0.5);
    Mk.sign(g, (o && o.title) || 'SLOTH\nINVADERS', 0, 1.78, 0.41, { bg: '#101020', fg: '#ff40c0', font: 'small' });
    solid(x, z, 0.8, 1.9, 0.9, ry);
    return g;
  };
  P.jukebox = function (p, x, z, ry) { const g = grp(p, x, z, ry); B(g, 1.0, 1.5, 0.6, Mat.get('#c06020', { emissive: '#402010' }), 0, 0, 0); Mk.ball(g, 0.5, Mat.get('#e0a040', { emissive: '#a05010' }), 0, 1.5, 0, { sy: 0.6 }); B(g, 0.7, 0.5, 0.05, new THREE.MeshBasicMaterial({ color: '#ff60a0' }), 0, 0.8, 0.31); solid(x, z, 1, 1.8, 0.7, ry); return g; };
  P.pooltable = function (p, x, z, ry) { const g = grp(p, x, z, ry); B(g, 1.4, 0.75, 2.6, '#5a3a20', 0, 0, 0); B(g, 1.2, 0.04, 2.4, '#2a7a3a', 0, 0.75, 0); for (let i = 0; i < 6; i++) Mk.ball(g, 0.05, LP.pick(['#e0e040', '#e04040', '#4040e0', '#ffffff', '#202020']), LP.rand(-0.4, 0.4), 0.82, LP.rand(-1, 1)); solid(x, z, ...(Math.abs(Math.sin(ry || 0)) > 0.5 ? [2.6, 0.9, 1.4] : [1.4, 0.9, 2.6])); return g; };
  P.stool = function (p, x, z) { const g = grp(p, x, z); C(g, 0.05, 0.05, 0.75, '#a0a0a0', 0, 0, 0, { seg: 4 }); C(g, 0.22, 0.22, 0.08, '#c02020', 0, 0.75, 0, { seg: 8 }); return g; };
  P.table = function (p, x, z, o) { const g = grp(p, x, z); B(g, (o && o.w) || 1.2, 0.06, (o && o.d) || 1.2, (o && o.top) || '#d8c8a0', 0, 0.75, 0); B(g, 0.12, 0.75, 0.12, '#606060', 0, 0, 0); solid(x, z, (o && o.w) || 1.2, 0.8, (o && o.d) || 1.2); return g; };
  P.booth = function (p, x, z, ry) {
    const g = grp(p, x, z, ry), m = Mat.get('#c03030');
    B(g, 1.6, 0.45, 0.6, m, 0, 0, -0.8); B(g, 1.6, 0.8, 0.15, m, 0, 0.45, -1.05);
    B(g, 1.6, 0.45, 0.6, m, 0, 0, 0.8); B(g, 1.6, 0.8, 0.15, m, 0, 0.45, 1.05);
    B(g, 1.4, 0.06, 0.9, '#e8e0c0', 0, 0.75, 0); B(g, 0.1, 0.75, 0.1, '#808080', 0, 0, 0);
    solid(x, z, ...(Math.abs(Math.sin(ry || 0)) > 0.5 ? [2.3, 1.2, 1.6] : [1.6, 1.2, 2.3]));
    return g;
  };
  P.trashcan = function (p, x, z, o) { const g = grp(p, x, z); C(g, 0.3, 0.26, 0.85, Mat.get('metal', { color: '#7a8070' }), 0, 0, 0, { seg: 7 }); C(g, 0.33, 0.33, 0.06, '#606860', 0, 0.85, 0, { seg: 7 }); return g; };
  P.dumpster = function (p, x, z, ry) { const g = grp(p, x, z, ry); B(g, 2.2, 1.3, 1.3, Mat.get('metal', { color: '#2a5a3a' }), 0, 0, 0); B(g, 2.25, 0.08, 1.35, '#1a3a2a', 0, 1.3, -0.05, { rx: -0.15 }); Mk.sign(g, 'NO\nDUMPING', 0, 0.7, 0.66, { bg: '#e8e8e8', fg: '#202020', font: 'small' }); solid(x, z, ...(Math.abs(Math.sin(ry || 0)) > 0.5 ? [1.3, 1.4, 2.2] : [2.2, 1.4, 1.3])); return g; };
  P.crate = function (p, x, z, s, o) { s = s || 1; const g = grp(p, x, z, (o && o.ry) || 0, (o && o.y) || 0); B(g, s, s, s, 'planks', 0, 0, 0, { tile: s }); B(g, s * 1.02, 0.08, s * 1.02, '#4a3020', 0, s * 0.45, 0); if (!(o && o.loose)) solid(x, z, s, s + ((o && o.y) || 0), s, 0, 0); return g; };
  P.barrel = function (p, x, z, o) { const g = grp(p, x, z); C(g, 0.35, 0.35, 1.0, Mat.get('metal', { color: (o && o.color) || '#3a6a9a' }), 0, 0, 0, { seg: 8 }); C(g, 0.36, 0.36, 0.05, '#2a2a2a', 0, 0.3, 0, { seg: 8 }); C(g, 0.36, 0.36, 0.05, '#2a2a2a', 0, 0.7, 0, { seg: 8 }); return g; };
  P.chair = function (p, x, z, ry) { const g = grp(p, x, z, ry); B(g, 0.5, 0.06, 0.5, 'planks', 0, 0.45, 0); B(g, 0.5, 0.55, 0.06, 'planks', 0, 0.5, -0.22); for (const a of [-0.2, 0.2]) for (const b of [-0.2, 0.2]) B(g, 0.05, 0.45, 0.05, '#4a3020', a, 0, b); return g; };
  P.gaspump = function (p, x, z, ry) {
    const g = grp(p, x, z, ry);
    B(g, 0.8, 1.7, 0.6, Mat.get('metal', { color: '#e8e8e0' }), 0, 0.2, 0);
    B(g, 0.9, 0.2, 0.7, '#c02020', 0, 1.9, 0);
    B(g, 0.5, 0.3, 0.04, new THREE.MeshBasicMaterial({ color: '#304030' }), 0, 1.3, 0.31);
    B(g, 1.0, 0.2, 0.8, '#9a9a90', 0, 0, 0);
    B(g, 0.1, 0.5, 0.1, '#202020', 0.45, 0.8, 0.1);
    solid(x, z, 1, 2.1, 0.8, ry);
    return g;
  };
  P.canopy = function (p, x, z, w, d, o) {
    const g = grp(p, x, z);
    for (const sx of [-w / 2 + 0.5, w / 2 - 0.5]) for (const sz of [-d / 2 + 0.5, d / 2 - 0.5]) { C(g, 0.18, 0.18, 4.5, '#e8e8e0', sx, 0, sz, { seg: 6 }); solid(x + sx, z + sz, 0.4, 4.5, 0.4); }
    B(g, w, 0.6, d, Mat.get('#e8e8e0'), 0, 4.5, 0);
    B(g, w + 0.05, 0.3, d + 0.05, (o && o.stripe) || '#c02020', 0, 4.65, 0);
    B(g, w * 0.9, 0.05, d * 0.9, Mat.get('#fff8e0', { emissive: '#a09060' }), 0, 4.45, 0);
    return g;
  };
  P.neon = function (p, x, y, z, text, o) {
    o = o || {};
    const t = Tex.sign(text, { bg: '#100818', fg: o.color || '#ff40a0', font: o.font || 'big', scale: o.scale || 1, grime: false, shadow: o.shadow || '#601040' });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(o.width || t.image.width / 16, (o.width || t.image.width / 16) * t.image.height / t.image.width), Mat.snap(new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide })));
    m.position.set(x, y, z); m.rotation.y = o.ry || 0;
    p.add(m);
    return m;
  };
  P.watertower = function (p, x, z) {
    const g = grp(p, x, z);
    for (const a of [0, 1.57, 3.14, 4.71]) B(g, 0.25, 9, 0.25, '#8a8a8a', Math.cos(a) * 2, 0, Math.sin(a) * 2);
    C(g, 3, 3, 4, Mat.get('metal', { color: '#a0b0b8' }), 0, 9, 0, { seg: 10 });
    Mk.cone(g, 3.2, 1.2, '#808890', 0, 13, 0, { seg: 10 });
    Mk.sign(g, 'DUMPTON', 0, 11.2, 3.05, { bg: '#a0b0b8', fg: '#1a2a5a', scale: 2, grime: 0.05 });
    solid(x, z, 4.5, 14, 4.5);
    return g;
  };
  P.portapotty = function (p, x, z, ry, o) {
    const g = grp(p, x, z, ry);
    B(g, 1.2, 2.3, 1.2, Mat.get('metal', { color: (o && o.color) || '#3a70c0' }), 0, 0, 0);
    B(g, 1.3, 0.12, 1.3, '#e8e8e8', 0, 2.3, 0);
    Mk.sign(g, (o && o.label) || 'SLOTH-\nJOHN', 0, 1.7, 0.61, { bg: '#e8e8e8', fg: '#2040a0', font: 'small' });
    B(g, 0.2, 0.08, 0.04, '#c02020', 0.35, 1.2, 0.61);
    if (o && o.solid !== false || !o) solid(x, z, 1.2, 2.3, 1.2, ry);
    return g;
  };
  P.bush = function (p, x, z, s) { s = s || 1; const g = grp(p, x, z); Mk.ball(g, 0.9 * s, Mat.get('grass', { color: '#6a9a4a' }), 0, 0.6 * s, 0, { seg: 6, rings: 4, sy: 0.75 }); return g; };
  P.slot = function (p, x, z, ry) {
    const g = grp(p, x, z, ry);
    B(g, 0.8, 1.6, 0.7, Mat.get('metal', { color: '#c0a020' }), 0, 0, 0);
    B(g, 0.6, 0.35, 0.04, new THREE.MeshBasicMaterial({ color: '#f0f0e0' }), 0, 1.0, 0.36);
    Mk.ball(g, 0.12, '#d02020', 0.5, 1.6, 0); B(g, 0.05, 0.5, 0.05, '#a0a0a0', 0.5, 1.1, 0);
    Mk.sign(g, '777', 0, 1.45, 0.36, { bg: '#e03030', fg: '#ffe040', font: 'small' });
    solid(x, z, 0.9, 1.6, 0.8, ry);
    return g;
  };
  P.speaker = function (p, x, z, s, ry) { s = s || 1; const g = grp(p, x, z, ry); B(g, 1.2 * s, 2 * s, 0.9 * s, '#1a1a1a', 0, 0, 0); C(g, 0.4 * s, 0.4 * s, 0.05, '#3a3a3a', 0, 1.3 * s, 0.45 * s, { rx: Math.PI / 2, seg: 8 }); C(g, 0.25 * s, 0.25 * s, 0.05, '#3a3a3a', 0, 0.5 * s, 0.45 * s, { rx: Math.PI / 2, seg: 8 }); solid(x, z, 1.2 * s, 2 * s, 0.9 * s, ry); return g; };
  P.tower = function (p, x, z) {
    const g = grp(p, x, z);
    for (const a of [0.78, 2.36, 3.93, 5.5]) B(g, 0.2, 6, 0.2, '#6a6a5a', Math.cos(a) * 1.4, 0, Math.sin(a) * 1.4);
    B(g, 3, 1.4, 3, Mat.get('camo'), 0, 6, 0); B(g, 3.4, 0.2, 3.4, '#4a4a3a', 0, 8.2, 0);
    B(g, 0.3, 0.3, 0.6, Mat.get('#fff0a0', { emissive: '#d0c060' }), 0, 7.6, 1.6);
    solid(x, z, 3, 6, 3);
    return g;
  };
  P.sandbags = function (p, x, z, ry) { const g = grp(p, x, z, ry); for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) Mk.ball(g, 0.3, Mat.get('sand', { color: '#c0b080' }), -0.9 + j * 0.6 + (i % 2) * 0.3, 0.2 + i * 0.3, 0, { sy: 0.5 }); solid(x, z, 2.4, 0.9, 0.6, ry); return g; };
  P.satdish = function (p, x, z, ry) { const g = grp(p, x, z, ry); C(g, 0.2, 0.3, 2.5, '#a0a0a0', 0, 0, 0); Mk.cone(g, 2, 0.8, Mat.get('#e8e8e8', { double: true }), 0, 2.8, 0.3, { seg: 10 }).rotation.x = -2.2; solid(x, z, 1, 3, 1); return g; };

  // ------------------------------------------------------------------ the runner corridors
  P.runnerSide = function (root, th, x, z, side) {
    const r = Math.random();
    const was = P.col; P.col = false;
    let g;
    if (th === 'mall') g = r < 0.5 ? P.building(root, x + side * 2, z, 4, 8, 4, { tex: 'stucco', color: LP.pick(['#e0c0d0', '#c0d0e0', '#e0e0c0']), sign: LP.pick(['GAG ME GIFTS', 'PRETZEL HUT', 'CANDLE BARN', 'MALL-WART', 'SUNGLASS SHACK', 'VAPE ZONE']), signO: { font: 'small', bg: '#202020', fg: '#ff60c0' }, ry: side > 0 ? -Math.PI / 2 : Math.PI / 2, solid: false }) : r < 0.8 ? P.palm(root, x, z) : P.kiosk(root, x, z);
    else if (th === 'fest') g = r < 0.3 ? P.portapotty(root, x, z, side > 0 ? -Math.PI / 2 : Math.PI / 2, { color: LP.pick(['#3a70c0', '#c03030', '#30a040']), solid: false }) : r < 0.6 ? P.tent(root, x + side, z) : P.speaker(root, x, z, 1.4);
    else if (th === 'casino') g = r < 0.5 ? P.slot(root, x, z, side > 0 ? -Math.PI / 2 : Math.PI / 2) : P.palm(root, x, z);
    else if (th === 'dam') g = P.lamp(root, x, z);
    else g = r < 0.4 ? P.crate(root, x, z, LP.rand(1, 1.6), { loose: true }) : r < 0.7 ? P.barrel(root, x, z, { color: '#4a5a3a' }) : P.tower(root, x + side * 3, z);
    P.col = was;
    return g;
  };
  P.runnerObstacle = function (root, th, kind, x, z) {
    const g = grp(root, x, z);
    if (kind === 'low') {
      if (th === 'mall') { B(g, 1.6, 0.9, 0.9, '#c0c0c8', 0, 0.2, 0); B(g, 1.6, 0.06, 0.06, '#a0a0a0', 0, 1.1, -0.45); Mk.sign(g, 'PRETZELS', 0, 0.75, 0.47, { bg: '#e0a020', fg: '#5a2010', font: 'small' }); wheels(g, [-0.6, 0.6], [0], 0.15); }
      else if (th === 'fest') { B(g, 1.6, 0.05, 1.2, Mat.get('mud', { color: '#5a4020' }), 0, 0, 0); B(g, 1.4, 0.7, 0.4, '#2a6ac0', 0, 0, 0); Mk.sign(g, 'COOLER', 0, 0.45, 0.21, { bg: '#e8e8e8', fg: '#2a6ac0', font: 'small' }); }
      else if (th === 'casino') { B(g, 1.6, 0.8, 0.6, '#c0a020', 0, 0, 0); Mk.sign(g, 'VELVET\nROPE', 0, 0.5, 0.31, { bg: '#600010', fg: '#ffe040', font: 'small' }); }
      else { B(g, 1.7, 0.8, 0.5, 'hazard', 0, 0, 0); }
      g.userData.value = 120;
    } else if (kind === 'high') {
      B(g, 0.12, 2.4, 0.12, '#808080', -0.9, 0, 0); B(g, 0.12, 2.4, 0.12, '#808080', 0.9, 0, 0);
      Mk.sign(g, th === 'mall' ? 'SALE!!\n70% OFF' : th === 'fest' ? 'SLOTHSTOCK\n\'99' : th === 'casino' ? 'JACKPOT!' : 'DANGER:\nLASER', 0, 1.6, 0, { width: 2, height: 0.8, bg: '#e03030', fg: '#ffffff', font: 'small' });
      g.userData.value = 60;
    } else {
      if (th === 'mall') { B(g, 1.6, 2.2, 0.4, Mat.get('#88a8c8', { transparent: true, opacity: 0.7 }), 0, 0, 0); Mk.sign(g, 'WET\nFLOOR', 0, 0.6, 0.25, { bg: '#ffe040', fg: '#202020', font: 'small' }); }
      else if (th === 'fest') { P.portapotty(g, 0, 0, 0, { solid: false }); }
      else if (th === 'casino') { P.slot(g, 0, 0, 0); }
      else { B(g, 1.8, 2.2, 1.8, Mat.get('metal', { color: '#5a6a4a' }), 0, 0, 0); Mk.sign(g, 'CLASSIFIED', 0, 1.2, 0.91, { bg: '#202020', fg: '#ff3030', font: 'small' }); }
      g.userData.value = 300;
    }
    return g;
  };
  P.kiosk = function (p, x, z) { const g = grp(p, x, z); B(g, 1.6, 1.1, 1.0, '#e0e0e8', 0, 0, 0); B(g, 1.8, 0.1, 1.2, '#ff60a0', 0, 2.2, 0); B(g, 0.08, 1.1, 0.08, '#c0c0c0', -0.7, 1.1, 0); B(g, 0.08, 1.1, 0.08, '#c0c0c0', 0.7, 1.1, 0); return g; };
  P.tent = function (p, x, z) { const g = grp(p, x, z, LP.rand(0, 6)); const c = LP.pick(['#e04040', '#40a0e0', '#e0c020', '#40c060']); Mk.cone(g, 1.6, 1.8, Mat.get(c), 0, 0, 0, { seg: 4 }); return g; };
  return P;
})();
