/* VEHICLES — every car in Lethargy City.
   Types + looks, sprites baked at 64 angles (vector shapes -> crisp pixels), arcade
   physics (velocity in world space, grip kills the sideways slide, handbrake lets it go),
   rigid-body bumps against walls / props / other cars, damage -> smoke -> fire -> boom,
   sinking in the bay, and the drivers' brains: traffic, pursuit, escort and flee. */
'use strict';
const Cars = (function () {
  const VT = {
    sedan: { name: 'LAZARUS', len: 24, wid: 12, mass: 1.0, accel: 235, top: 255, rev: 95, turn: 3.1, grip: 9, hp: 100, look: 'sedan' },
    compact: { name: 'DOZER MINI', len: 20, wid: 11, mass: 0.8, accel: 245, top: 235, rev: 95, turn: 3.5, grip: 9, hp: 80, look: 'compact' },
    taxi: { name: 'CAB-A-SNOOZE', len: 24, wid: 12, mass: 1.0, accel: 245, top: 262, rev: 95, turn: 3.1, grip: 9, hp: 100, cols: ['#f0c020'], look: 'taxi' },
    sports: { name: 'SLOTH GT', len: 24, wid: 12, mass: 0.95, accel: 345, top: 350, rev: 105, turn: 3.45, grip: 10.5, hp: 95, cols: ['#e02828', '#f4f4f4', '#28a0e0', '#f0c020'], look: 'sports' },
    muscle: { name: 'TORPOR V8', len: 26, wid: 13, mass: 1.25, accel: 315, top: 318, rev: 100, turn: 2.95, grip: 8.4, hp: 125, look: 'muscle' },
    van: { name: 'HAMMOCK VAN', len: 28, wid: 14, mass: 1.6, accel: 175, top: 218, rev: 85, turn: 2.6, grip: 9, hp: 150, look: 'van' },
    pickup: { name: 'MUDLARK', len: 27, wid: 13, mass: 1.35, accel: 220, top: 248, rev: 90, turn: 2.8, grip: 8.5, hp: 130, look: 'pickup' },
    truck: { name: 'HEAVY HAULER', len: 36, wid: 15, mass: 2.6, accel: 140, top: 192, rev: 75, turn: 2.15, grip: 9, hp: 230, look: 'truck' },
    bus: { name: 'PARTY BUS', len: 42, wid: 15, mass: 3.0, accel: 130, top: 190, rev: 65, turn: 1.95, grip: 9, hp: 420, cols: ['#7a2fbf'], look: 'bus' },
    police: { name: 'CRUISER 27', len: 25, wid: 12, mass: 1.15, accel: 300, top: 300, rev: 105, turn: 3.25, grip: 10, hp: 140, cols: ['#1c2230'], look: 'police', siren: true },
    swat: { name: 'SWAT VAN', len: 30, wid: 15, mass: 2.3, accel: 230, top: 262, rev: 85, turn: 2.55, grip: 9.5, hp: 300, cols: ['#1c2434'], look: 'swat', siren: true },
    limo: { name: 'VELVET LIMO', len: 38, wid: 13, mass: 2.0, accel: 215, top: 275, rev: 75, turn: 2.25, grip: 9, hp: 320, cols: ['#1a1420'], look: 'limo' },
    tanker: { name: 'HUSTLE TANKER', len: 42, wid: 15, mass: 3.2, accel: 130, top: 198, rev: 65, turn: 1.85, grip: 9, hp: 260, cols: ['#ff7a2e'], look: 'tanker' }
  };
  const CIV_COLS = ['#c83030', '#3060c0', '#e4e4ec', '#2a2a32', '#30a060', '#d8a820', '#a040a0', '#e07020', '#60b0d0', '#8a8a96', '#7a3020', '#f080b0'];
  const TRAFFIC = [['sedan', 30], ['compact', 15], ['taxi', 12], ['muscle', 8], ['sports', 5], ['van', 10], ['pickup', 10], ['truck', 6], ['bus', 2]];
  const N_ANG = 64;
  for (const k in VT) {
    const t = VT[k], span = t.len - t.wid, n = Math.max(2, Math.ceil(span / (t.wid * 0.7)) + 1);
    t.key = k; t.cr = t.wid / 2; t.circ = [];
    for (let i = 0; i < n; i++) t.circ.push(-span / 2 + span * i / (n - 1));
    t.I = t.mass * (t.len * t.len + t.wid * t.wid) / 12 * 2.6;
    t.size = Math.ceil(Math.hypot(t.len, t.wid)) + 4;
  }

  // ------------------------------------------------------------------ sprites
  const shade = (c, a) => City.shade(c, a);
  function rr(g, x, y, w, h, r, col) {
    g.fillStyle = col; g.beginPath();
    g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r);
    g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
    g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath(); g.fill();
  }
  const GLASS = '#2c3c58', GLASS_HI = '#6a8ab8';
  function drawShape(g, t, col) {
    const L = t.len, W = t.wid, hl = L / 2, hw = W / 2, look = t.look;
    const dark = shade(col, -0.35), light = shade(col, 0.28);
    // tyres peeking out
    g.fillStyle = '#111';
    for (const fx of [hl - 5.5, -hl + 5.5]) { g.fillRect(fx - 2.5, -hw - 0.6, 5, 1.6); g.fillRect(fx - 2.5, hw - 1, 5, 1.6); }
    rr(g, -hl, -hw, L, W, look === 'bus' || look === 'truck' || look === 'van' || look === 'swat' || look === 'tanker' ? 2 : 3.5, dark);
    rr(g, -hl + 0.8, -hw + 0.8, L - 1.6, W - 1.6, 3, col);
    const glass = (x0, x1, inset) => { g.fillStyle = GLASS; g.fillRect(x0, -hw + inset, x1 - x0, W - inset * 2); g.fillStyle = GLASS_HI; g.fillRect(x1 - 1.4, -hw + inset + 1, 1, W * 0.35); };
    const roof = (x0, x1, c2) => { g.fillStyle = c2 || light; g.fillRect(x0, -hw + 2.2, x1 - x0, W - 4.4); };
    switch (look) {
      case 'sedan': case 'taxi':
        glass(L * 0.06, L * 0.22, 1.6); roof(-L * 0.2, L * 0.06); glass(-L * 0.32, -L * 0.2, 2);
        g.fillStyle = light; g.fillRect(hl - 6, -1, 4, 2);
        if (look === 'taxi') { g.fillStyle = '#fff6c0'; g.fillRect(-L * 0.1, -2, 4, 4); g.fillStyle = '#222'; for (let x = -hl + 3; x < hl - 3; x += 2) { g.fillRect(x, -hw + 0.8, 1, 1); g.fillRect(x + 1, hw - 1.8, 1, 1); } }
        break;
      case 'compact':
        glass(L * 0.02, L * 0.2, 1.4); roof(-L * 0.28, L * 0.02); glass(-L * 0.4, -L * 0.28, 1.8); break;
      case 'sports':
        glass(-L * 0.04, L * 0.14, 1.8); roof(-L * 0.22, -L * 0.04, shade(col, -0.15)); glass(-L * 0.3, -L * 0.22, 2.4);
        g.fillStyle = col === '#f4f4f4' ? '#e02828' : '#f4f4f4'; g.fillRect(-hl + 1, -1.6, L - 2, 1); g.fillRect(-hl + 1, 0.8, L - 2, 1);
        g.fillStyle = '#111'; g.fillRect(-hl + 0.5, -hw + 1, 1.5, W - 2);
        break;
      case 'muscle':
        glass(-L * 0.02, L * 0.15, 1.6); roof(-L * 0.24, -L * 0.02); glass(-L * 0.34, -L * 0.24, 2);
        g.fillStyle = '#1a1a1a'; g.fillRect(hl - 9, -1.5, 5, 3); g.fillStyle = shade(col, 0.5); g.fillRect(-hl + 1, -hw + 2, L - 2, 1);
        break;
      case 'van':
        glass(L * 0.26, L * 0.38, 1.4); roof(-hl + 2, L * 0.26, shade(col, 0.12));
        g.fillStyle = shade(col, -0.12); for (let x = -hl + 5; x < L * 0.2; x += 5) g.fillRect(x, -hw + 2.5, 1, W - 5);
        break;
      case 'pickup':
        glass(L * 0.12, L * 0.26, 1.4); roof(-L * 0.06, L * 0.12); glass(-L * 0.1, -L * 0.06, 2);
        g.fillStyle = shade(col, -0.5); g.fillRect(-hl + 2, -hw + 2, L * 0.38, W - 4); g.fillStyle = shade(col, -0.3); for (let x = -hl + 4; x < -hl + 2 + L * 0.38; x += 3) g.fillRect(x, -hw + 2, 1, W - 4);
        break;
      case 'truck':
        g.fillStyle = '#d8d8e0'; g.fillRect(-hl + 1, -hw + 0.8, L * 0.68, W - 1.6); g.fillStyle = '#b0b0bc'; for (let x = -hl + 4; x < -hl + L * 0.68; x += 4) g.fillRect(x, -hw + 1.5, 1, W - 3);
        g.fillStyle = '#2a2a30'; g.fillRect(-hl + 1 + L * 0.68, -hw + 1, 1.5, W - 2);
        glass(hl - 6, hl - 2.5, 1.4);
        break;
      case 'bus':
        roof(-hl + 2, hl - 4, shade(col, 0.1));
        g.fillStyle = GLASS; g.fillRect(-hl + 3, -hw + 0.8, L - 9, 2); g.fillRect(-hl + 3, hw - 2.8, L - 9, 2);
        g.fillStyle = '#ffd23e'; for (let x = -hl + 4; x < hl - 6; x += 5) { g.fillRect(x, -hw + 0.8, 2, 1); g.fillRect(x + 2, hw - 1.8, 2, 1); }
        g.fillStyle = '#ff4fb4'; g.fillRect(-hl + 6, -1, L - 14, 2);
        g.fillStyle = '#9a9aa6'; g.fillRect(-4, -3, 6, 6); g.fillRect(-15, -3, 6, 6);
        glass(hl - 4, hl - 1.5, 1.2);
        break;
      case 'police':
        g.fillStyle = '#f0f0f4'; g.fillRect(-L * 0.18, -hw + 0.8, L * 0.3, W - 1.6);
        glass(L * 0.08, L * 0.22, 1.6); roof(-L * 0.18, L * 0.08, '#f0f0f4'); glass(-L * 0.3, -L * 0.18, 2);
        g.fillStyle = '#c01818'; g.fillRect(-2.5, -hw + 2, 3, hw - 2); g.fillStyle = '#1838d0'; g.fillRect(-2.5, 0, 3, hw - 2);
        break;
      case 'swat':
        roof(-hl + 2, L * 0.3, shade(col, 0.15)); glass(L * 0.3, L * 0.42, 1.4);
        g.fillStyle = '#c01818'; g.fillRect(L * 0.18, -hw + 2.2, 3, hw - 2.2); g.fillStyle = '#1838d0'; g.fillRect(L * 0.18, 0, 3, hw - 2.2);
        g.fillStyle = '#e8e8f0'; g.fillRect(-hl + 4, -1, L * 0.45, 2);
        break;
      case 'limo':
        glass(L * 0.14, L * 0.26, 1.6); roof(-L * 0.36, L * 0.14, shade(col, 0.15)); glass(-L * 0.42, -L * 0.36, 2);
        g.fillStyle = '#ffd23e'; g.fillRect(-hl + 1, -hw + 1, L - 2, 0.9); g.fillRect(-hl + 1, hw - 1.9, L - 2, 0.9);
        g.fillStyle = GLASS; g.fillRect(-L * 0.18, -2, 7, 4); g.fillRect(-L * 0.04 + 1, -2, 6, 4);
        break;
      case 'tanker':
        g.fillStyle = '#d0d4dc'; rr(g, -hl + 1, -hw + 1, L * 0.7, W - 2, 5, '#c8ccd6');
        g.fillStyle = '#e8ecf4'; g.fillRect(-hl + 3, -1.5, L * 0.66, 2); g.fillStyle = '#a0a4b0'; g.fillRect(-hl + 3, hw - 3.5, L * 0.66, 1.5);
        g.fillStyle = '#ff7a2e'; g.fillRect(-hl + 10, -hw + 1, 8, W - 2);
        g.fillStyle = '#1a1a1a'; g.fillRect(-hl + 1 + L * 0.7, -hw + 2, 1.5, W - 4);
        glass(hl - 6, hl - 2.5, 1.4);
        break;
    }
    // lights
    g.fillStyle = '#fff6c8'; g.fillRect(hl - 1.6, -hw + 1.2, 1.6, 2.2); g.fillRect(hl - 1.6, hw - 3.4, 1.6, 2.2);
    g.fillStyle = '#d01818'; g.fillRect(-hl, -hw + 1.2, 1.4, 2.2); g.fillRect(-hl, hw - 3.4, 1.4, 2.2);
  }
  const cache = new Map();
  function sprites(type, col, burnt) {
    const key = type + col + (burnt ? 'B' : '');
    let s = cache.get(key);
    if (!s) { s = { a: new Array(N_ANG), sh: new Array(N_ANG), type, col, burnt }; cache.set(key, s); }
    return s;
  }
  function frame(s, i) {
    if (!s.a[i]) {
      const t = VT[s.type];
      let img = G.bake(t.size, t.size, i / N_ANG * Math.PI * 2, (g) => drawShape(g, t, s.col));
      if (s.burnt) img = G.tint(img, '#1c1612', 0.82);
      s.a[i] = img;
      s.sh[i] = G.silhouette(img, '#000');
    }
    return i;
  }
  const angIdx = (a) => ((Math.round(a / (Math.PI * 2) * N_ANG) % N_ANG) + N_ANG) % N_ANG;

  // ------------------------------------------------------------------ the car object
  let nextId = 1;
  function make(type, x, y, a, o) {
    const t = VT[type];
    o = o || {};
    const c = {
      id: nextId++, t, type, x, y, a: a || 0, vx: 0, vy: 0, w: 0,
      col: o.col || (t.cols ? t.cols[Math.floor(Math.random() * t.cols.length)] : CIV_COLS[Math.floor(Math.random() * CIV_COLS.length)]),
      hp: t.hp * (o.hpMul || 1), maxHp: t.hp * (o.hpMul || 1), driver: null, passenger: null, ai: null,
      throttle: 0, steer: 0, hand: false, skid: 0, siren: !!t.siren && !!o.siren, burn: 0, wreck: false, sink: 0, gone: false,
      mission: !!o.mission, faction: o.faction || null, police: !!t.siren, parked: !!o.parked, hornT: 0, lastHit: null, hitT: 0,
      smokeT: 0, crashCD: 0, spd: 0, stolen: false, armored: !!o.armored, label: o.label || null
    };
    c.spr = sprites(type, c.col);
    return c;
  }
  function respray(c, col) { c.col = col; c.spr = sprites(c.type, col); }

  // ------------------------------------------------------------------ physics
  const tmpProps = [];
  function physics(c, dt) {
    const t = c.t;
    if (c.wreck) { c.throttle = 0; c.steer = 0; }
    c.a += c.w * dt;
    const ca = Math.cos(c.a), sa = Math.sin(c.a);
    let vf = c.vx * ca + c.vy * sa, vr = -c.vx * sa + c.vy * ca;
    const thr = c.throttle, top = t.top * (c.topMul || 1);
    if (c.sink > 0) { vf *= Math.pow(0.15, dt); vr *= Math.pow(0.15, dt); }
    else if (thr > 0) {
      if (vf < -10) vf += 600 * dt * thr;
      else { const k = Math.max(0, 1 - Math.pow(Math.max(0, vf) / top, 2)); vf += t.accel * thr * dt * (0.25 + 0.75 * k) * (vf > top ? 0 : 1); }
    } else if (thr < 0) {
      if (vf > 10) vf -= 620 * dt * -thr;
      else if (vf > -t.rev) vf -= t.accel * 0.7 * dt * -thr;
    } else {
      vf -= Math.sign(vf) * Math.min(Math.abs(vf), (40 + Math.abs(vf) * 0.35) * dt);
    }
    let grip = t.grip;
    if (c.hand) { grip = 1.5; vf -= Math.sign(vf) * Math.min(Math.abs(vf), 110 * dt); }
    if (c.wreck) grip = 4;
    vr *= Math.exp(-grip * dt);
    c.skid = Math.min(1, Math.max(0, (Math.abs(vr) - 30) / 90) + (c.hand && Math.abs(vf) > 60 ? 0.5 : 0) + (thr > 0.5 && vf > 0 && vf < 60 && t.accel > 290 ? 0.3 : 0));
    // steering: needs speed, a bit less twitchy flat out
    const spd = Math.abs(vf);
    const k = Math.min(1, spd / 65) * (1 - 0.32 * Math.min(1, spd / Math.max(1, top)));
    const target = c.steer * t.turn * k * (vf < -1 ? -1 : 1) * (c.hand ? 1.45 : 1);
    c.w += (target - c.w) * Math.min(1, 9 * dt);
    c.vx = ca * vf - sa * vr; c.vy = sa * vf + ca * vr;
    c.x += c.vx * dt; c.y += c.vy * dt;
    c.spd = Math.hypot(c.vx, c.vy);
    c.fwd = vf;
    collideWorld(c);
    if (c.crashCD > 0) c.crashCD -= dt;
  }

  function circles(c, out) {
    const ca = Math.cos(c.a), sa = Math.sin(c.a);
    out.length = 0;
    for (const o of c.t.circ) out.push(c.x + ca * o, c.y + sa * o);
    return out;
  }
  const circ = [];
  function collideWorld(c) {
    const r = c.t.cr, T = City.T;
    for (let pass = 0; pass < 2; pass++) {
      circles(c, circ);
      let best = null;
      for (let i = 0; i < circ.length; i += 2) {
        const px = circ[i], py = circ[i + 1];
        const tx0 = Math.floor((px - r) / T), tx1 = Math.floor((px + r) / T), ty0 = Math.floor((py - r) / T), ty1 = Math.floor((py + r) / T);
        for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
          if (!City.solidCar(tx, ty)) continue;
          const qx = Math.max(tx * T, Math.min(px, tx * T + T)), qy = Math.max(ty * T, Math.min(py, ty * T + T));
          let dx = px - qx, dy = py - qy, d = Math.hypot(dx, dy), pen;
          if (d < 1e-4) {
            // centre inside the tile: push out the shortest way
            const l = px - tx * T, rr2 = tx * T + T - px, u = py - ty * T, b = ty * T + T - py, m = Math.min(l, rr2, u, b);
            dx = m === l ? -1 : m === rr2 ? 1 : 0; dy = m === u ? -1 : m === b ? 1 : 0; pen = m + r; d = 1;
          } else { if (d >= r) continue; pen = r - d; dx /= d; dy /= d; }
          if (!best || pen > best.pen) best = { pen, nx: dx, ny: dy, px: px - dx * r, py: py - dy * r };
        }
        // props
        City.propsNear(px, py, r + 12, tmpProps);
        for (const p of tmpProps) {
          if (!p.solid || p.r <= 0) continue;
          let dx = px - p.x, dy = py - p.y; const d = Math.hypot(dx, dy) || 0.01;
          if (d >= r + p.r) continue;
          if (p.knock || (p.explode && c.spd > 150)) { World.hitProp(p, c.spd, c.driver || c); if (p.knock) { c.vx *= 0.93; c.vy *= 0.93; continue; } }
          if (p.dead) continue;
          const pen = r + p.r - d; dx /= d; dy /= d;
          if (!best || pen > best.pen) best = { pen, nx: dx, ny: dy, px: px - dx * r, py: py - dy * r };
        }
      }
      if (!best) break;
      c.x += best.nx * best.pen; c.y += best.ny * best.pen;
      impulseWall(c, best.px, best.py, best.nx, best.ny);
    }
    // the bay
    if (!c.gone && City.isWater(c.x, c.y)) {
      if (c.sink === 0) World.splash(c);
      c.sink += 1 / 60;
    }
  }
  function impulseWall(c, cx, cy, nx, ny) {
    const t = c.t, rx = cx - c.x, ry = cy - c.y;
    const vpx = c.vx - c.w * ry, vpy = c.vy + c.w * rx;
    const vn = vpx * nx + vpy * ny;
    if (vn >= 0) return;
    const rn = rx * ny - ry * nx;
    const j = -(1.25) * vn / (1 / t.mass + rn * rn / t.I);
    c.vx += j * nx / t.mass; c.vy += j * ny / t.mass;
    c.w += rn * j / t.I;
    c.vx *= 0.96; c.vy *= 0.96;
    const imp = -vn;
    if (imp > 40) World.carCrash(c, null, imp, cx, cy);
  }
  function collidePair(A, B) {
    const ra = A.t.cr, rb = B.t.cr;
    const reach = A.t.len / 2 + B.t.len / 2 + 2;
    if (Math.abs(A.x - B.x) > reach || Math.abs(A.y - B.y) > reach) return;
    const ca = circles(A, []), cb = circles(B, []);
    let best = null;
    for (let i = 0; i < ca.length; i += 2) for (let j = 0; j < cb.length; j += 2) {
      const dx = ca[i] - cb[j], dy = ca[i + 1] - cb[j + 1], d = Math.hypot(dx, dy);
      if (d >= ra + rb) continue;
      const pen = ra + rb - d;
      if (!best || pen > best.pen) { const dd = d || 0.01; best = { pen, nx: dx / dd, ny: dy / dd, x: cb[j] + dx / dd * rb, y: cb[j + 1] + dy / dd * rb }; }
    }
    if (!best) return;
    const ma = A.t.mass * (A.armored ? 2.5 : 1), mb = B.t.mass * (B.armored ? 2.5 : 1);
    const sa = mb / (ma + mb), sb = ma / (ma + mb);
    A.x += best.nx * best.pen * sa; A.y += best.ny * best.pen * sa;
    B.x -= best.nx * best.pen * sb; B.y -= best.ny * best.pen * sb;
    const rax = best.x - A.x, ray = best.y - A.y, rbx = best.x - B.x, rby = best.y - B.y;
    const vax = A.vx - A.w * ray, vay = A.vy + A.w * rax, vbx = B.vx - B.w * rby, vby = B.vy + B.w * rbx;
    const vn = (vax - vbx) * best.nx + (vay - vby) * best.ny;
    if (vn >= 0) return;
    const rna = rax * best.ny - ray * best.nx, rnb = rbx * best.ny - rby * best.nx;
    const j = -1.3 * vn / (1 / ma + 1 / mb + rna * rna / A.t.I + rnb * rnb / B.t.I);
    A.vx += j * best.nx / ma; A.vy += j * best.ny / ma; A.w += rna * j / A.t.I;
    B.vx -= j * best.nx / mb; B.vy -= j * best.ny / mb; B.w -= rnb * j / B.t.I;
    if (-vn > 35) World.carCrash(A, B, -vn, best.x, best.y);
  }

  // ------------------------------------------------------------------ AI drivers
  function steerTo(c, tx, ty, gain) {
    const want = Math.atan2(ty - c.y, tx - c.x);
    let d = angDiff(c.a, want);
    if (c.fwd < -5) d = -d;
    return LP.clamp(d * (gain || 2.4), -1, 1);
  }
  // something in the way ahead? returns distance or Infinity
  function blockedAhead(c, range, list) {
    const ca = Math.cos(c.a), sa = Math.sin(c.a);
    let best = Infinity;
    const half = c.t.len / 2;
    for (const o of list) {
      if (o === c || o.gone) continue;
      const dx = o.x - c.x, dy = o.y - c.y;
      const f = dx * ca + dy * sa;
      if (f < half - 2 || f > range + half) continue;
      const lat = Math.abs(-dx * sa + dy * ca);
      const ow = o.skin ? 5 : o.t.wid / 2 + 2;
      if (lat < c.t.wid / 2 + ow) best = Math.min(best, f - half);
    }
    return best;
  }
  function pickNext(at, from) {
    const opts = at.nb.filter((n) => n.n !== from);
    if (!opts.length) return from;
    // prefer going straight a little
    const dx = Math.sign(at.x - from.x), dy = Math.sign(at.y - from.y);
    const straight = opts.find((o) => Math.sign(o.n.x - at.x) === dx && Math.sign(o.n.y - at.y) === dy);
    if (straight && Math.random() < 0.45) return straight.n;
    return opts[Math.floor(Math.random() * opts.length)].n;
  }
  function laneFor(from, to, prefer) {
    const e = edgeBetween(from, to);
    const lanes = e ? City.laneOffsets(e) : [8];
    return lanes[Math.min(lanes.length - 1, prefer || 0)];
  }
  function edgeBetween(a, b) { for (const n of a.nb) if (n.n === b) return n.e; return null; }

  // TRAFFIC: follow the right-hand lane, pick turns at junctions, brake for things in front
  function traffic(c, dt, near) {
    const ai = c.ai;
    let dx, dy, len, s;
    for (let k = 0; k < 3; k++) {
      dx = Math.sign(ai.to.x - ai.from.x); dy = Math.sign(ai.to.y - ai.from.y);
      len = Math.abs(ai.to.x - ai.from.x) + Math.abs(ai.to.y - ai.from.y);
      s = (c.x - ai.from.x) * dx + (c.y - ai.from.y) * dy;
      if (!ai.next) ai.next = pickNext(ai.to, ai.from);
      if (len - s >= 28 - ai.off + 4) break;
      const nf = ai.to, nt = ai.next;
      ai.from = nf; ai.to = nt; ai.next = null; ai.off = laneFor(nf, nt, ai.lane);
    }
    if (!ai.next) ai.next = pickNext(ai.to, ai.from);
    const look = 18 + c.spd * 0.12;
    const tx = ai.from.x + dx * (s + look) - dy * ai.off, ty = ai.from.y + dy * (s + look) + dx * ai.off;
    c.steer = steerTo(c, tx, ty, 2.6);
    // slow for turns
    let want = ai.cruise;
    const ndx = Math.sign(ai.next.x - ai.to.x), ndy = Math.sign(ai.next.y - ai.to.y);
    const turning = ndx !== dx || ndy !== dy;
    if (turning && len - s < 90) want = Math.min(want, 85);
    if (Math.abs(angDiff(c.a, Math.atan2(dy, dx))) > 0.6) want = Math.min(want, 70);
    const blk = blockedAhead(c, 18 + c.spd * 0.4, near);
    if (blk < Infinity) { want = blk < 10 ? 0 : Math.min(want, blk * 2); ai.wait += dt; } else ai.wait = 0;
    if (ai.wait > 2.2 && c.hornT <= 0 && World.nearPlayer(c, 120)) { c.hornT = 3; GameAudio.horn(c); }
    if (ai.wait > 6) want = 60;                               // give up waiting: nudge through
    c.throttle = c.spd < want - 5 ? 0.8 : c.spd > want + 15 ? -0.7 : 0.05;
    c.hand = false;
  }

  // PURSUE / ESCORT / FLEE share a road-graph navigator with direct steering when close
  function navigate(c, dt, gx, gy, o) {
    const ai = c.ai;
    o = o || {};
    ai.repath = (ai.repath || 0) - dt;
    const d = dist(c.x, c.y, gx, gy);
    let tx = gx, ty = gy;
    const direct = o.direct !== false && d < (o.directRange || 220) && City.los(c.x, c.y, gx, gy);
    if (!direct) {
      if (ai.repath <= 0 || !ai.path || !ai.path.length) {
        ai.repath = 1.2;
        const a = City.nearestNode(c.x + Math.cos(c.a) * 40, c.y + Math.sin(c.a) * 40), b = City.nearestNode(gx, gy);
        ai.path = City.route(a, b) || [];
      }
      while (ai.path.length && dist(c.x, c.y, ai.path[0].x, ai.path[0].y) < 34) ai.path.shift();
      if (ai.path.length) { tx = ai.path[0].x; ty = ai.path[0].y; }
    }
    c.steer = steerTo(c, tx, ty, 2.8);
    // whiskers: steer away from walls
    const ca = Math.cos(c.a), sa = Math.sin(c.a), wl = 14 + c.spd * 0.16;
    for (const side of [-1, 1]) {
      const ang = c.a + side * 0.45, wx = c.x + Math.cos(ang) * wl, wy = c.y + Math.sin(ang) * wl;
      if (City.solidCar(Math.floor(wx / 16), Math.floor(wy / 16))) c.steer -= side * 0.7;
    }
    c.steer = LP.clamp(c.steer, -1, 1);
    const turnAmt = Math.abs(angDiff(c.a, Math.atan2(ty - c.y, tx - c.x)));
    let want = o.speed || c.t.top;
    if (turnAmt > 0.9 && c.spd > 110) want = 100;
    if (o.stopAt && d < o.stopAt) want = 0;
    if (o.near) { const blk = blockedAhead(c, 14 + c.spd * 0.3, o.near); if (blk < Infinity) want = Math.min(want, blk < 8 ? 0 : blk * 2.5); }
    c.throttle = c.spd < want ? 1 : (c.spd > want + 30 ? -0.8 : 0);
    c.hand = turnAmt > 1.3 && c.spd > 150 && !o.noHand;
    // unstick: reverse out
    if (c.throttle > 0 && c.spd < 14) ai.stuck = (ai.stuck || 0) + dt; else ai.stuck = Math.max(0, (ai.stuck || 0) - dt * 2);
    if (ai.rev > 0) { ai.rev -= dt; c.throttle = -1; c.steer = -c.steer; c.hand = false; }
    else if (ai.stuck > 0.9) { ai.rev = 0.8; ai.stuck = 0; ai.path = null; }
    void ca; void sa;
    return d;
  }

  // ------------------------------------------------------------------ drawing
  function draw(g, c, camX, camY) {
    const s = c.wreck ? (c.sprB || (c.sprB = sprites(c.type, c.col, true))) : c.spr;
    const i = frame(s, angIdx(c.a)), img = s.a[i];
    let x = Math.round(c.x - camX - img.width / 2), y = Math.round(c.y - camY - img.height / 2);
    if (x > G.W + 10 || y > G.H + 10 || x + img.width < -10 || y + img.height < -10) return;
    if (c.sink > 0) { g.globalAlpha = Math.max(0, 1 - c.sink * 0.8); }
    else { g.globalAlpha = 0.35; g.drawImage(s.sh[i], x + 2, y + 3); g.globalAlpha = 1; }
    g.drawImage(img, x, y);
    g.globalAlpha = 1;
  }
  // tail-lights, headlights, sirens: bright pixels after the night pass
  function drawEmissive(g, c, camX, camY, time) {
    if (c.wreck || c.sink > 0) return;
    const ca = Math.cos(c.a), sa = Math.sin(c.a), hl = c.t.len / 2, hw = c.t.wid / 2;
    const P = (f, r) => [Math.round(c.x + ca * f - sa * r - camX), Math.round(c.y + sa * f + ca * r - camY)];
    const driven = !!c.driver;
    if (driven) {
      g.fillStyle = '#fffbe0';
      for (const r of [-hw + 2.2, hw - 2.2]) { const p = P(hl - 0.5, r); g.fillRect(p[0], p[1], 1, 1); }
      g.fillStyle = c.throttle < 0 ? '#ff3030' : '#c01010';
      for (const r of [-hw + 2.2, hw - 2.2]) { const p = P(-hl + 0.5, r); g.fillRect(p[0], p[1], 1, 1); }
    }
    if (c.siren) {
      const ph = Math.floor(time * 8) % 2;
      const off = c.type === 'swat' ? c.t.len * 0.18 : -1;
      const p1 = P(off, -2.5), p2 = P(off, 2.5);
      g.fillStyle = ph ? '#ff2020' : '#601010'; g.fillRect(p1[0] - 1, p1[1] - 1, 2, 2);
      g.fillStyle = ph ? '#203060' : '#3060ff'; g.fillRect(p2[0] - 1, p2[1] - 1, 2, 2);
    }
  }
  function addLights(c, camX, camY, time) {
    if (c.wreck || c.sink > 0) return;
    const ca = Math.cos(c.a), sa = Math.sin(c.a), hl = c.t.len / 2;
    if (c.driver) Lights.beam(c.x + ca * hl - camX, c.y + sa * hl - camY, c.a);
    if (c.driver && c.throttle < 0) Lights.add(c.x - ca * hl - camX, c.y - sa * hl - camY, 18, '#ff2020', 0.5);
    if (c.siren) {
      const ph = Math.floor(time * 8) % 2;
      Lights.add(c.x - camX, c.y - camY, 46, ph ? '#ff2a2a' : '#2a50ff', 0.85);
    }
  }

  return {
    VT, CIV_COLS, TRAFFIC, make, respray, physics, collidePair, circles, traffic, navigate, steerTo, blockedAhead, pickNext, laneFor, edgeBetween,
    draw, drawEmissive, addLights, angIdx,
    trafficType() { let n = 0; for (const t of TRAFFIC) n += t[1]; let r = Math.random() * n; for (const t of TRAFFIC) { r -= t[1]; if (r <= 0) return t[0]; } return 'sedan'; }
  };
})();
