/* FX — particles in three layers, plus short-lived dynamic lights.
     ground: lit by the night pass (debris, glass, water, fur tufts, shell casings)
     glow:   full brightness, additive-ish (fire, fireballs, sparks, muzzle flashes, tracers)
     top:    above the buildings (smoke columns, shockwaves)
   Particles are plain objects in pooled arrays; draw = discs or rects, always whole pixels. */
'use strict';
const Fx = (function () {
  const F = { ground: [], glow: [], top: [], lights: [], max: 900 };
  function add(layer, o) {
    const arr = F[layer];
    if (arr.length > (layer === 'glow' ? 500 : 350)) arr.shift();
    const p = Object.assign({ x: 0, y: 0, vx: 0, vy: 0, t: 0, life: 0.6, size: 1, grow: 0, drag: 2, col: '#fff', cols: null, shape: 'rect', z: 0, vz: 0, alpha: 1 }, o);
    arr.push(p);
    return p;
  }
  F.add = add;
  F.light = (x, y, r, col, life, a) => { F.lights.push({ x, y, r, col, life, t: 0, a: a === undefined ? 1 : a }); if (F.lights.length > 60) F.lights.shift(); };

  F.update = function (dt) {
    for (const layer of ['ground', 'glow', 'top']) {
      LP.prune(F[layer], (p) => {
        p.t += dt;
        if (p.t >= p.life) return true;
        const k = Math.exp(-p.drag * dt);
        p.vx *= k; p.vy *= k;
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.vz || p.z) { p.vz -= 240 * dt; p.z += p.vz * dt; if (p.z < 0) { p.z = 0; p.vz = -p.vz * 0.35; p.vx *= 0.6; p.vy *= 0.6; } }
        p.size += p.grow * dt;
        return false;
      });
    }
    LP.prune(F.lights, (l) => (l.t += dt) >= l.life);
  };

  function colOf(p) {
    if (!p.cols) return p.col;
    const i = Math.min(p.cols.length - 1, Math.floor(p.t / p.life * p.cols.length));
    return p.cols[i];
  }
  F.draw = function (g, layer, camX, camY) {
    for (const p of F[layer]) {
      if (p.kind === 'text') continue;
      const x = p.x - camX, y = p.y - camY - p.z;
      if (x < -40 || y < -40 || x > G.W + 40 || y > G.H + 40) continue;
      const fade = p.fade ? 1 - p.t / p.life : 1;
      const a = p.alpha * fade;
      if (a < 0.98) g.globalAlpha = Math.max(0, a);
      const c = colOf(p), s = Math.max(1, p.size);
      if (p.shape === 'disc') G.disc(x, y, s, c, g);
      else if (p.shape === 'ring') G.ring(x, y, s, c, g);
      else if (p.shape === 'line') { G.line(x, y, x - p.vx * 0.02, y - p.vy * 0.02, c, g); }
      else { g.fillStyle = c; g.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), Math.round(s), Math.round(s)); }
      if (a < 0.98) g.globalAlpha = 1;
    }
  };
  F.addLights = function (camX, camY) {
    for (const l of F.lights) Lights.add(l.x - camX, l.y - camY, l.r * (1 - 0.3 * l.t / l.life), l.col, l.a * (1 - l.t / l.life));
  };
  F.clear = function () { F.ground.length = 0; F.glow.length = 0; F.top.length = 0; F.lights.length = 0; };

  // ------------------------------------------------------------------ recipes
  const FIRE = ['#ffffff', '#fff2a0', '#ffd040', '#ff9020', '#e04010', '#802010'];
  F.FIRE = FIRE;
  F.explosion = function (x, y, r) {
    const n = Math.round(10 + r / 4);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = LP.rand(0.2, 1) * r * 2.2;
      add('glow', { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: LP.rand(0.35, 0.75), size: LP.rand(r * 0.18, r * 0.32), grow: -r * 0.2, drag: 5, shape: 'disc', cols: FIRE });
    }
    add('glow', { x, y, life: 0.25, size: r * 0.6, grow: r * 1.2, shape: 'disc', cols: ['#ffffff', '#fff2a0', '#ffd040'], drag: 0 });
    add('top', { x, y, life: 0.35, size: r * 0.5, grow: r * 2.6, shape: 'ring', col: '#fff0c0', fade: true, drag: 0 });
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2, s = LP.rand(10, 40);
      add('top', { x: x + Math.cos(a) * r * 0.3, y: y + Math.sin(a) * r * 0.3, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 10, life: LP.rand(1.2, 2.4), size: LP.rand(4, 8), grow: 6, drag: 1.2, shape: 'disc', col: Math.random() < 0.5 ? '#3a3640' : '#55505c', alpha: 0.75, fade: true });
    }
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2, s = LP.rand(60, 220);
      add('glow', { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: LP.rand(0.2, 0.6), size: 1, drag: 3, cols: ['#ffffff', '#ffe080', '#ff8020'] });
    }
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2, s = LP.rand(40, 160);
      add('ground', { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, z: 1, vz: LP.rand(60, 160), life: LP.rand(1.5, 3), size: 2, drag: 1.2, col: Math.random() < 0.5 ? '#2a2830' : '#5a5462' });
    }
    F.light(x, y, r * 3.2, '#ffb050', 0.6, 1);
  };
  F.smoke = function (x, y, dark) {
    add('top', { x: x + LP.rand(-2, 2), y: y + LP.rand(-2, 2), vx: LP.rand(-6, 6), vy: LP.rand(-14, -4), life: LP.rand(0.9, 1.6), size: LP.rand(2, 3), grow: 4, drag: 0.8, shape: 'disc', col: dark ? '#2a2630' : '#8a8694', alpha: dark ? 0.7 : 0.5, fade: true });
  };
  F.fire = function (x, y, s) {
    add('glow', { x: x + LP.rand(-2, 2) * s, y: y + LP.rand(-2, 2) * s, vx: LP.rand(-8, 8), vy: LP.rand(-30, -10), life: LP.rand(0.25, 0.5), size: LP.rand(1.5, 3) * s, grow: -3, drag: 1, shape: 'disc', cols: ['#fff2a0', '#ffd040', '#ff8020', '#d03010'] });
  };
  F.sparks = function (x, y, n, col) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = LP.rand(40, 140);
      add('glow', { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: LP.rand(0.1, 0.3), size: 1, drag: 4, col: col || '#ffe080' });
    }
  };
  F.debris = function (x, y, n, cols, sp) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = LP.rand(20, sp || 120);
      add('ground', { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, z: 1, vz: LP.rand(40, 120), life: LP.rand(0.8, 2), size: LP.rand(1, 2), drag: 2, col: cols[i % cols.length] });
    }
  };
  F.water = function (x, y, n, up) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = LP.rand(10, 60);
      add('ground', { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, z: 1, vz: LP.rand(40, up || 140), life: LP.rand(0.5, 1), size: LP.rand(1, 2), drag: 1, col: Math.random() < 0.5 ? '#bfe6ff' : '#e8f8ff' });
    }
  };
  F.text = function (x, y, str, col) {
    add('top', { x, y, vy: -26, life: 1.1, drag: 1, kind: 'text', text: str, col: col || '#ffd23e' });
  };
  F.drawText = function (g, camX, camY) {
    for (const p of F.top) if (p.kind === 'text') Font.draw(g, p.text, p.x - camX, p.y - camY, p.col, { face: 'small', align: 'center', outline: '#000' });
  };
  return F;
})();
