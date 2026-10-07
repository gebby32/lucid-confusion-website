/* WORLD — the current stage's geometry, fixtures and art.
   Platforms are sloped line segments (top surface). Everything that walks, rolls or
   lands asks the World: surf(), next(), landing(), ladderUp(), ladderDown().
   Fixtures: steam vents, slippery puddles, reversing conveyor belts, hydraulic presses.
   Static art (decor, ladders, girders, sofa, barrel stack) is rendered once per stage. */
'use strict';
const World = (function () {
  const W = {
    def: null, plats: [], ladders: [], items: [], vents: [], presses: [], puddles: [], drips: [],
    bg: null, time: 0, beltT: 0, beltWarn: false, beltSpeed: 0.42, thick: 8, floor: null, tiers: 5
  };

  // ------------------------------------------------------------------ geometry
  W.surf = (p, x) => p.y0 + (LP.clamp(x, p.x0, p.x1) - p.x0) * p.slope;
  W.slopeDir = (p) => (p.y1 > p.y0 ? 1 : p.y1 < p.y0 ? -1 : 0);   // +1 = downhill to the right

  // the segment that continues p's end in direction dir (touching, same height)
  W.next = function (p, dir) {
    const ex = dir > 0 ? p.x1 : p.x0, ey = dir > 0 ? p.y1 : p.y0;
    for (const q of W.plats) {
      if (q === p) continue;
      const sx = dir > 0 ? q.x0 : q.x1, sy = dir > 0 ? q.y0 : q.y1;
      if (Math.abs(sx - ex) <= 2 && Math.abs(sy - ey) <= 3) return q;
    }
    return null;
  };
  // a platform just across a small gap (fast hazards hop these)
  W.across = function (p, dir) {
    const ex = dir > 0 ? p.x1 : p.x0, ey = dir > 0 ? p.y1 : p.y0;
    for (const q of W.plats) {
      if (q === p) continue;
      const sx = dir > 0 ? q.x0 : q.x1, sy = dir > 0 ? q.y0 : q.y1, gap = (sx - ex) * dir;
      if (gap > 2 && gap <= 22 && Math.abs(sy - ey) <= 6) return q;
    }
    return null;
  };
  // highest platform whose surface is crossed going from y0 down to y1 at x
  W.landing = function (x, y0, y1, skip, pad) {
    let best = null, by = Infinity;
    pad = pad || 0;
    for (const q of W.plats) {
      if (skip && skip.has(q)) continue;
      if (x < q.x0 - pad || x > q.x1 + pad) continue;
      const s = W.surf(q, x);
      if (y0 <= s + 0.01 && y1 >= s && s < by) { best = q; by = s; }
    }
    return best;
  };
  // platform under (x, y) within tol px
  W.platAt = function (x, y, tol) {
    for (const q of W.plats) if (x >= q.x0 - 1 && x <= q.x1 + 1 && Math.abs(W.surf(q, x) - y) <= tol) return q;
    return null;
  };
  W.ladderUp = function (x, y) {
    const g = GAME_CONFIG.hero.ladderGrab;
    let best = null;
    for (const L of W.ladders) if (!L.broken && Math.abs(L.x - x) <= g && Math.abs(y - L.bot) <= 4 && (!best || Math.abs(L.x - x) < Math.abs(best.x - x))) best = L;
    return best;
  };
  W.ladderDown = function (x, y, plat) {
    const g = GAME_CONFIG.hero.ladderGrab;
    let best = null;
    for (const L of W.ladders) if (!L.broken && L.up === plat && Math.abs(L.x - x) <= g && Math.abs(y - L.top) <= 4 && (!best || Math.abs(L.x - x) < Math.abs(best.x - x))) best = L;
    return best;
  };
  W.puddleAt = function (p, x) { for (const d of W.puddles) if (d.p === p && x >= d.x0 && x <= d.x1) return d; return null; };

  // ------------------------------------------------------------------ load
  W.load = function (def) {
    W.def = def; W.thick = def.thick || 8; W.time = 0; W.beltT = 0; W.beltWarn = false; W.drips = [];
    W.plats = def.plats.map((a, i) => {
      const o = a[4] || {};
      const p = { i, x0: a[0], y0: a[1], x1: a[2], y1: a[3], goal: !!o.goal, belt: o.belt ? { dir: o.belt } : null };
      p.slope = (p.y1 - p.y0) / (p.x1 - p.x0);
      p.tier = Math.max(0, Math.round((226 - (p.y0 + p.y1) / 2) / def.tierH));
      return p;
    });
    W.floor = W.plats[0];
    W.tiers = def.tiers = Math.max(...W.plats.map((p) => p.tier));
    W.ladders = def.ladders.map(([x, u, l, broken]) => {
      const up = W.plats[u], lo = W.plats[l];
      if (x < up.x0 || x > up.x1 || x < lo.x0 || x > lo.x1) console.warn('ladder off its platforms', def.name, x);
      return { x, up, lo, broken: !!broken, top: W.surf(up, x), bot: W.surf(lo, x) };
    });
    W.items = (def.items || []).map(([kind, pi, x]) => ({ kind, p: W.plats[pi], x, y: W.surf(W.plats[pi], x), taken: false }));
    W.vents = (def.vents || []).map((v) => Object.assign({}, v, { p: W.plats[v.plat], y: W.surf(W.plats[v.plat], v.x), last: '' }));
    W.puddles = (def.puddles || []).map((d) => ({ p: W.plats[d.plat], x0: d.x0, x1: d.x1 }));
    W.presses = (def.presses || []).map((v) => {
      const p = W.plats[v.plat], bot = W.surf(p, v.x);
      let ceil = 20;
      for (const q of W.plats) { if (v.x < q.x0 || v.x > q.x1) continue; const s = W.surf(q, v.x); if (s < bot - 4 && s + W.thick > ceil) ceil = s + W.thick; }
      return Object.assign({}, v, { p, bot, ceil, rest: bot - 21, y: bot - 21, last: '' });
    });
    W.bg = renderStatic(def);
  };

  // ------------------------------------------------------------------ fixtures
  W.update = function (dt) {
    W.time += dt;
    // conveyor belts reverse every beltPeriod seconds (warning klaxon first)
    if (W.def.beltPeriod) {
      W.beltT += dt;
      if (!W.beltWarn && W.beltT > W.def.beltPeriod - 1.2) { W.beltWarn = true; LP.Audio.play('klaxon'); }
      if (W.beltT >= W.def.beltPeriod) {
        W.beltT = 0; W.beltWarn = false;
        for (const p of W.plats) if (p.belt) p.belt.dir *= -1;
        LP.Audio.play('clunk');
      }
    }
    for (const v of W.vents) {
      const ph = ventPhase(v);
      if (ph !== v.last) { if (ph === 'warn') LP.Audio.play('hiss'); if (ph === 'blast') LP.Audio.play('steam'); v.last = ph; }
    }
    for (const pr of W.presses) {
      const s = pressState(pr);
      pr.y = s.y;
      if (s.ph !== pr.last) {
        if (s.ph === 'warn') LP.Audio.play('clank');
        if (s.ph === 'hold') {
          LP.Audio.play('slam'); LP.FX.shake(2, 10);
          G.dust(pr.x - 8, pr.bot, 3, '#9a9aa8'); G.dust(pr.x + 8, pr.bot, 3, '#9a9aa8');
          Hazards.crushAt(pr.x - 9, pr.x + 9, pr.bot);
        }
        pr.last = s.ph;
      }
    }
    // leaks drip onto the puddles
    for (const d of W.puddles) if (Math.random() < dt * 0.9) W.drips.push({ x: LP.randi(d.x0 + 4, d.x1 - 4), y: W.surf(d.p, d.x0) - 30, vy: 0, p: d.p });
    LP.prune(W.drips, (r) => { r.vy += 0.08; r.y += r.vy; return r.y >= W.surf(r.p, r.x) - 1; });
  };

  function ventPhase(v) {
    const t = (W.time + v.offset) % v.period;
    return t < 0.9 ? 'warn' : t < 1.9 ? 'blast' : 'off';
  }
  function pressState(pr) {
    const P = pr.period, t = (W.time + pr.offset) % P, rest = pr.rest, bot = pr.bot;
    if (t < P - 1.8) return { ph: 'rest', y: rest };
    if (t < P - 1.2) return { ph: 'warn', y: rest + (Math.floor(t * 30) % 2) };
    if (t < P - 1.1) return { ph: 'slam', y: LP.lerp(rest, bot, (t - (P - 1.2)) / 0.1) };
    if (t < P - 0.6) return { ph: 'hold', y: bot };
    return { ph: 'rise', y: LP.lerp(bot, rest, (t - (P - 0.6)) / 0.6) };
  }

  // does this box touch live steam or a press? returns a cause or null
  W.deadly = function (b) {
    for (const v of W.vents) {
      if (ventPhase(v) !== 'blast') continue;
      const xa = Math.min(v.x + v.dir * 3, v.x + v.dir * v.len), xb = Math.max(v.x + v.dir * 3, v.x + v.dir * v.len);
      if (LP.Hit.overlap(b, { x: xa, y: v.y - 13, w: xb - xa, h: 12 })) return 'steam';
    }
    for (const pr of W.presses) if (pr.y > pr.rest + 2 && LP.Hit.overlap(b, { x: pr.x - 8, y: pr.ceil, w: 16, h: pr.y - pr.ceil })) return 'press';
    return null;
  };

  // ------------------------------------------------------------------ draw
  W.draw = function () {
    const g = LP.LCD.ctx, t = W.time;
    g.drawImage(W.bg, 0, 0);
    // belts: moving chevrons, red while about to reverse
    for (const p of W.plats) {
      if (!p.belt) continue;
      const warn = W.beltWarn && Math.floor(t * 8) % 2 === 0, col = warn ? '#ff3030' : '#f0c020';
      const off = Math.floor(t * 30 * p.belt.dir) ;
      for (let x = Math.ceil(p.x0) + 2; x < p.x1 - 3; x++) {
        const k = (((x - off) % 10) + 10) % 10;
        if (k < 3) {
          const y = Math.round(W.surf(p, x));
          const tip = p.belt.dir > 0 ? k : 2 - k;
          G.px(x, y + (tip === 1 ? 0 : 1), col);
        }
      }
    }
    // puddles: shimmering water on the pipe
    for (const d of W.puddles) for (let x = d.x0; x < d.x1; x++) {
      const y = Math.round(W.surf(d.p, x));
      G.px(x, y - 1, (x + Math.floor(t * 6)) % 7 === 0 ? '#e0f4ff' : '#4a8ae8');
    }
    for (const r of W.drips) G.rect(r.x, r.y, 1, 2, '#7ab8ff');
    // steam vents
    for (const v of W.vents) {
      const ph = ventPhase(v), nx = v.x, ny = Math.round(v.y);
      G.rect(nx - 2, ny - 6, 5, 6, '#5a6070'); G.rect(nx - 1, ny - 5, 3, 4, '#a8b0c0');
      G.rect(nx + (v.dir > 0 ? 3 : -4), ny - 5, 2, 3, '#a8b0c0');
      G.px(nx, ny - 7, ph === 'warn' && Math.floor(t * 12) % 2 ? '#ff4040' : '#802020');
      if (ph === 'warn') for (let i = 0; i < 3; i++) if (Math.random() < 0.5) G.px(nx + v.dir * LP.randi(4, 9), ny - LP.randi(4, 9), '#d8dce4');
      if (ph === 'blast') {
        for (let i = 4; i <= v.len; i += 3) {
          const x = nx + v.dir * i, r = 2.5 + Math.min(4, i / 10) + Math.sin(t * 25 + i) * 0.8;
          G.ellipse(x, ny - 7 + Math.sin(t * 17 + i * 0.7), r, r * 0.8, i % 2 ? '#f4f6fa' : '#c4cad6');
        }
      }
    }
    // presses
    for (const pr of W.presses) {
      const x = pr.x, top = Math.round(pr.ceil), y = Math.round(pr.y);
      G.rect(x - 3, top, 6, y - top - 4, '#8a8a96'); G.rect(x - 2, top, 2, y - top - 4, '#c8c8d4');
      G.rect(x - 9, y - 5, 18, 5, '#202024');
      for (let i = 0; i < 16; i++) G.rect(x - 8 + i, y - 4, 1, 3, ((i + Math.floor(i / 2)) >> 1) % 2 ? '#f0c020' : '#202024');
      G.rect(x - 9, y - 1, 18, 1, '#5a5a66');
      if (pressState(pr).ph === 'warn' && Math.floor(t * 10) % 2) G.rect(x - 1, top + 1, 2, 2, '#ff3030');
    }
    // pickups
    for (const it of W.items) {
      if (it.taken) continue;
      const s = Sprites.pickups[it.kind], bob = Math.round(Math.sin(t * 4 + it.x) * 1.2);
      G.draw(s, it.x - (s.width >> 1), it.y - s.height - 2 + bob);
      if (Math.floor(t * 4 + it.x) % 6 === 0) G.px(it.x + 3, it.y - s.height - 3 + bob, '#fff');
    }
  };

  // ------------------------------------------------------------------ static art
  const rnd = (seed) => () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

  const STYLES = {
    girder(g, x, y, lx) {
      const k = ((lx % 8) + 8) % 8, zig = k < 4 ? k : 7 - k;
      col(g, x, y, '#ff9a8a'); col(g, x, y + 1, '#e8282e');
      for (let r = 2; r <= 5; r++) col(g, x, y + r, '#2a0406');
      col(g, x, y + 2 + zig, '#e8282e');
      if (k === 0) for (let r = 2; r <= 5; r++) col(g, x, y + r, '#a01820');
      col(g, x, y + 6, '#e8282e'); col(g, x, y + 7, '#701014');
      if (((lx % 16) + 16) % 16 === 8) col(g, x, y + 1, '#ffd0c0');
    },
    pipe(g, x, y, lx) {
      const C = ['#4a2206', '#ffc080', '#e8904a', '#d07834', '#b8622a', '#9a4c1c', '#7a3a12', '#3a1a06'];
      for (let r = 0; r < 8; r++) col(g, x, y + r, C[r]);
      const k = ((lx % 40) + 40) % 40;
      if (k >= 18 && k <= 21) {
        for (let r = -1; r <= 8; r++) col(g, x, y + r, k === 18 ? '#e0e8f4' : k === 21 ? '#5a6070' : '#9aa2b4');
        if (k === 19 || k === 20) { col(g, x, y + 1, '#40444c'); col(g, x, y + 6, '#40444c'); }
      }
    },
    industrial(g, x, y, lx, p) {
      if (p.belt) {
        col(g, x, y, '#7a7a84'); col(g, x, y + 1, '#4a4a52');
        for (let r = 2; r <= 5; r++) col(g, x, y + r, '#18181e');
        const k = ((lx % 12) + 12) % 12;
        if (k >= 4 && k <= 7) { col(g, x, y + 3, '#6a6a78'); col(g, x, y + 4, k === 5 || k === 6 ? '#a0a0ae' : '#6a6a78'); }
        col(g, x, y + 6, '#4a4a52'); col(g, x, y + 7, '#0c0c10');
        return;
      }
      col(g, x, y, '#fff6a0'); col(g, x, y + 1, '#f0c020');
      for (let r = 2; r <= 5; r++) col(g, x, y + r, ((x + r) >> 2) & 1 ? '#e8b818' : '#1a1a1a');
      col(g, x, y + 6, '#f0c020'); col(g, x, y + 7, '#6a5000');
    },
    penthouse(g, x, y, lx) {
      const C = ['#ff7a8a', '#c0203a', '#7a30b8', '#5a2090', '#3a1060', '#ffd040'];
      for (let r = 0; r < 6; r++) col(g, x, y + r, C[r]);
      if (((lx % 12) + 12) % 12 === 6) col(g, x, y + 3, '#ffd040');
    }
  };
  function col(g, x, y, c) { g.fillStyle = c; g.fillRect(x, y, 1, 1); }

  function renderStatic(def) {
    const c = G.canvas(G.W, G.H), g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, G.W, G.H);
    for (const d of def.decor || []) DECOR[d](g, def);
    for (const L of W.ladders) drawLadder(g, L, def.ladder);
    for (const p of W.plats) {
      for (let x = Math.floor(p.x0); x < Math.ceil(p.x1); x++) STYLES[def.style](g, x, Math.round(W.surf(p, x + 0.5)), x - Math.floor(p.x0), p);
    }
    // belt end rollers
    for (const p of W.plats) if (p.belt) for (const ex of [p.x0 + 2, p.x1 - 3]) {
      const y = W.surf(p, ex);
      G.ellipse(ex, y + 4, 3, 3, '#3a3a42', g); G.ellipse(ex, y + 4, 1.5, 1.5, '#a0a0ae', g);
    }
    if (def.sofa) g.drawImage(Sprites.sofa, def.sofa.x, def.king.y - Sprites.sofa.height);
    if (def.stack) {
      const b = Sprites.barrelUp, y = def.king.y;
      g.drawImage(b, 18, y - 12); g.drawImage(b, 29, y - 12); g.drawImage(b, 23.5 | 0, y - 24);
    }
    // press housings
    for (const pr of W.presses) {
      g.fillStyle = '#3a3a44'; g.fillRect(pr.x - 7, Math.round(pr.ceil), 14, 3);
      g.fillStyle = '#6a6a78'; g.fillRect(pr.x - 6, Math.round(pr.ceil), 12, 1);
    }
    return c;
  }

  function drawLadder(g, L, color) {
    const top = Math.round(L.top), bot = Math.round(L.bot), xl = L.x - 5, xr = L.x + 4;
    const dark = '#1a3a5a';
    const seg = (y0, y1) => {
      g.fillStyle = color; g.fillRect(xl, y0, 1, y1 - y0); g.fillRect(xr, y0, 1, y1 - y0);
      g.fillStyle = dark; g.fillRect(xl + 1, y0, 1, y1 - y0); g.fillRect(xr - 1, y0, 1, y1 - y0);
      for (let y = y1 - 3; y >= y0; y -= 4) { g.fillStyle = color; g.fillRect(xl, y, 10, 1); }
    };
    if (!L.broken) seg(top, bot);
    else { seg(top, top + W.thick + 6); seg(bot - 9, bot); }
  }

  const DECOR = {
    scaffold(g) {
      for (const x0 of [0, 310]) {
        g.fillStyle = '#1c3c90'; g.fillRect(x0 + 1, 20, 2, 210); g.fillRect(x0 + 7, 20, 2, 210);
        g.fillStyle = '#4a7ae0'; g.fillRect(x0 + 1, 20, 1, 210); g.fillRect(x0 + 7, 20, 1, 210);
        for (let y = 24; y < 226; y += 16) {
          G.line(x0 + 2, y, x0 + 7, y + 8, '#16307a', g); G.line(x0 + 7, y + 8, x0 + 2, y + 16, '#16307a', g);
          g.fillStyle = '#8ab0ff'; g.fillRect(x0 + 1, y, 1, 1); g.fillRect(x0 + 8, y, 1, 1);
        }
      }
    },
    signs(g) {
      // a condemned notice and a traffic cone, kept dim so hazards stay readable
      g.fillStyle = '#3a0a0a'; g.fillRect(124, 203, 62, 11);
      g.fillStyle = '#5a1414'; g.fillRect(125, 204, 60, 9);
      Font.draw(g, 'CONDEMNED', 128, 206, '#c06060', { face: 'small' });
      g.fillStyle = '#3a2a2a'; g.fillRect(150, 214, 2, 12); g.fillRect(160, 214, 2, 12);
      for (let i = 0; i < 7; i++) { g.fillStyle = i % 3 === 1 ? '#d8d8d8' : '#c85010'; g.fillRect(236 - (i >> 1), 219 + i, 3 + i, 1); }
      g.fillStyle = '#c85010'; g.fillRect(231, 225, 13, 1);
    },
    pipes(g) {
      const r = rnd(7);
      for (const x of [66, 186, 300]) {
        g.fillStyle = '#0c2e2e'; g.fillRect(x - 3, 20, 7, 206);
        g.fillStyle = '#16484a'; g.fillRect(x - 2, 20, 2, 206);
        for (let y = 40; y < 220; y += 46) { g.fillStyle = '#28605e'; g.fillRect(x - 4, y, 9, 3); }
      }
      for (const [x, y] of [[66, 176], [186, 108], [300, 142]]) {
        G.ellipse(x, y, 4, 4, '#3a1a1a', g); G.ellipse(x, y, 3, 3, '#7a2a2a', g); g.fillStyle = '#c04040'; g.fillRect(x - 3, y, 7, 1); g.fillRect(x, y - 3, 1, 7);
      }
      // gauges
      for (const [x, y] of [[110, 140], [230, 74]]) { G.ellipse(x, y, 4, 4, '#2a3a3a', g); G.ellipse(x, y, 3, 3, '#c8d0c8', g); G.line(x, y, x + 2, y - 2, '#c03030', g); }
      for (let i = 0; i < 30; i++) { g.fillStyle = '#0a2020'; g.fillRect(r() * 320 | 0, 20 + r() * 200 | 0, 1, 1); }
    },
    factory(g) {
      const gear = (cx, cy, R) => {
        for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; G.ellipse(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 2.2, 2.2, '#1c1c26', g); }
        G.ellipse(cx, cy, R, R, '#1c1c26', g); G.ellipse(cx, cy, R * 0.45, R * 0.45, '#0a0a0e', g); G.ellipse(cx, cy, 2, 2, '#2a2a36', g);
      };
      gear(70, 174, 11); gear(262, 104, 14); gear(150, 66, 9); gear(300, 210, 9);
      g.fillStyle = '#16161e'; g.fillRect(200, 20, 14, 40); g.fillRect(222, 20, 10, 34);
      Font.draw(g, 'PENGUIN INDUSTRIES', 92, 207, '#5a5020', { face: 'small' });
      for (let x = 92; x < 164; x += 6) { g.fillStyle = '#2a2a10'; g.fillRect(x, 214, 3, 1); }
    },
    skyline(g) {
      const r = rnd(42);
      g.fillStyle = '#06061a'; g.fillRect(10, 20, 300, 206);
      g.fillStyle = '#0c0c2c'; for (let y = 20; y < 226; y += 2) g.fillRect(10, y, 300, 1);
      G.ellipse(286, 34, 7, 7, '#d8d4b0', g); G.ellipse(288, 32, 6, 6, '#06061a', g);
      // city
      for (let x = 12; x < 308;) {
        const w = 10 + (r() * 16 | 0), h = 30 + (r() * 90 | 0);
        g.fillStyle = '#12123a'; g.fillRect(x, 226 - h, w, h);
        for (let yy = 226 - h + 3; yy < 222; yy += 4) for (let xx = x + 2; xx < x + w - 2; xx += 3) if (r() < 0.3) { g.fillStyle = r() < 0.7 ? '#6a5a20' : '#c8a040'; g.fillRect(xx, yy, 1, 1); }
        x += w + 1;
      }
      // window mullions
      g.fillStyle = '#2a1a4a'; for (const x of [10, 110, 210, 309]) g.fillRect(x, 20, 2, 206);
      g.fillRect(10, 20, 300, 2);
      // chandelier
      g.fillStyle = '#806020'; g.fillRect(180, 20, 1, 8);
      G.ellipse(180, 30, 8, 2, '#ffd040', g); for (const dx of [-7, -3, 1, 5]) { g.fillStyle = '#fff8c0'; g.fillRect(180 + dx, 26, 2, 3); }
      // a portrait of guess who
      g.fillStyle = '#ffd040'; g.fillRect(268, 50, 26, 24); g.fillStyle = '#3a1060'; g.fillRect(270, 52, 22, 20);
      G.ellipse(281, 66, 6, 6, '#24369c', g); G.ellipse(282, 67, 4, 4, '#f2f2f6', g); G.ellipse(281, 58, 5, 4, '#24369c', g);
      g.fillStyle = '#ffd21a'; g.fillRect(278, 53, 7, 2); g.fillStyle = '#ffc21a'; g.fillRect(284, 59, 4, 2);
      g.fillStyle = '#fff'; g.fillRect(280, 57, 1, 1); g.fillRect(283, 57, 1, 1);
    }
  };

  return W;
})();
