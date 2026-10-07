/* FORMATION — the invading sloths. The whole formation moves in discrete steps; the
   time between steps shrinks with every sloth destroyed:
       interval = 1 + (base - 1) * (alive - 1) / (total - 1)      frames
   so wave 1 crawls along at one step a second... until the last few sloths are moving
   every single frame. Steps also drive the march sound and the two-frame animation.
   Sloths can leave the formation: 'dive' (attack runs), 'sleep' (SPACE NAP) and
   'return' (flying back to their slot). */
'use strict';
const Formation = {
  list: [], pops: [], fx: 0, fy: 0, dir: 1, stepT: 0, anim: 0, N: 0, alive: 0, def: null,
  colW: 24, rowH: 15, cols: 10, dropNext: false, steps: 0, lastPx: 3,
  freezeT: 0, fireT: 0, diveT: 0, napT: 0,
  MIN_X: 6, MAX_X: 378, DROP: 6, BASE_Y: 108,

  TYPES: {
    U: { key: 'ufo', pts: 'ufo', shot: 'zap' },
    S: { key: 'walk', pts: 'walk', shot: 'drop' },
    A: { key: 'atk', pts: 'attack', shot: 'needle', diver: true },
    C: { key: 'cmd', pts: 'commander', shot: 'needle', cmd: true, diver: true },
    M: { key: 'mini', pts: 'mini', shot: 'zap' }
  },
  sprites(T) { return Sprites[T.key]; },

  load(def) {
    const F = Formation, L = def.layout, swarm = L === Waves.SWARM;
    F.def = def; F.list = []; F.pops = [];
    F.cols = L.rows[0].length; F.colW = swarm ? 19 : 24; F.rowH = swarm ? 12 : 15;
    F.fx = Math.round((384 - F.cols * F.colW) / 2);
    F.fy = F.BASE_Y - (L.rows.length - 1) * F.rowH + def.lower;
    F.dir = 1; F.anim = 0; F.dropNext = false; F.steps = 0; F.freezeT = 0;
    const cellH = swarm ? 10 : 14;
    // however low a wave starts, the bottom row begins above the bunkers (LOW ORBIT: just above)
    const bottom = F.fy + (L.rows.length - 1) * F.rowH + cellH;
    const limit = Barriers.Y - (def.special && def.special.id === 'low' ? 8 : 20);
    if (bottom > limit) F.fy -= bottom - limit;
    L.rows.forEach((row, r) => [...row].forEach((ch, c) => {
      const T = F.TYPES[ch];
      if (!T) return;
      const spr = F.sprites(T)[0];
      const s = {
        T, ch, r, c, w: spr.width, h: spr.height, alive: true, state: 'form', t: 0,
        ox: c * F.colW + Math.floor((F.colW - spr.width) / 2), oy: r * F.rowH + (cellH - spr.height),
        cmdT: T.cmd ? LP.rand(2, def.cmdEvery) : 0, sleepT: 0, vx: 0, vy: 0, shotsLeft: 0
      };
      s.x = F.fx + s.ox; s.y = F.fy + s.oy;
      F.list.push(s);
    }));
    F.N = F.alive = F.list.length;
    F.stepT = F.interval();
    F.fireT = 1.6; F.diveT = def.diveEvery ? def.diveEvery * LP.rand(0.8, 1.2) : 0; F.napT = 2;
    // SPACE NAP: a quarter of them are already asleep when the wave arrives
    if (def.sleepers) for (const s of F.list) if (!s.T.cmd && LP.chance(0.22)) F.sleep(s, LP.rand(4, 12));
  },

  // frames between steps for the current number of sloths (the central joke lives here)
  interval() {
    const F = Formation, base = F.def.stepBase;
    if (F.freezeT > 0) return Math.max(base, 54);                    // FREEZE: back to stereotype
    const frac = F.N > 1 ? (F.alive - 1) / (F.N - 1) : 0;
    return Math.max(1, 1 + (base - 1) * frac);
  },
  stepPx() {
    const F = Formation;
    if (F.freezeT > 0) return 2;
    return F.alive === 1 ? 4 : 3;
  },
  // horizontal speed in px / frame (for the demo pilot's aim)
  speed() { return Formation.dir * Formation.stepPx() / Formation.interval(); },

  tickPops() { LP.prune(Formation.pops, (p) => ++p.t > 16); },

  slot(s) { return [Formation.fx + s.ox, Formation.fy + s.oy]; },

  // ------------------------------------------------------------------ update
  update(dt, ctx) {
    const F = Formation;
    if (F.freezeT > 0) F.freezeT -= dt;
    F.stepT -= 1;
    if (F.stepT <= 0) { F.step(ctx); F.stepT += F.interval(); if (F.stepT < 1) F.stepT = 1; }

    for (const s of F.list) {
      if (!s.alive) continue;
      s.t += dt;
      if (s.state === 'sleep') { if ((s.sleepT -= dt) <= 0) { s.state = 'wake'; s.t = 0; Game.popup(s.x + s.w / 2, s.y - 6, '!', '#ffd040'); } }
      else if (s.state === 'wake') { if (s.t > 0.45) s.state = 'return'; }
      else if (s.state === 'return') F.flyHome(s);
      else if (s.state === 'dive') F.dive(s, ctx);
      if (s.T.cmd && s.state === 'form' && (s.cmdT -= dt) <= 0) {
        s.cmdT = F.def.cmdEvery * LP.rand(0.7, 1.4) * (F.freezeT > 0 ? 2 : 1);
        if (Bullets.enemyCount() < F.def.maxBullets + 2) Bullets.comedy(s.x + s.w / 2, s.y + s.h, F.def);
      }
    }

    // regular fire from the lowest sloth of a column
    if ((F.fireT -= dt) <= 0) {
      F.fireT = F.def.fireEvery * LP.rand(0.6, 1.4) * (F.freezeT > 0 ? 2.5 : 1);
      if (Bullets.enemyCount() < F.def.maxBullets) F.shoot(ctx.px);
    }
    // attack runs
    if (F.def.diveEvery && (F.diveT -= dt) <= 0) {
      F.diveT = F.def.diveEvery * LP.rand(0.7, 1.3);
      F.startDive(ctx.px);
    }
    // SPACE NAP: someone else nods off
    if (F.def.sleepers && (F.napT -= dt) <= 0) {
      F.napT = LP.rand(1.2, 2.6);
      const awake = F.list.filter((s) => s.alive && s.state === 'form' && !s.T.cmd);
      const asleep = F.list.filter((s) => s.alive && (s.state === 'sleep' || s.state === 'wake')).length;
      if (awake.length > 2 && asleep < F.alive * F.def.sleepers) F.sleep(LP.pick(awake), LP.rand(5, 11));
    }
  },

  step(ctx) {
    const F = Formation, px = F.stepPx();
    F.lastPx = px;
    if (F.dropNext) { F.fy += F.DROP; F.dir = -F.dir; F.dropNext = false; }
    else F.fx += F.dir * px;
    // will the next step take any slot past the edge? then drop instead
    let lo = 999, hi = -999;
    for (const s of F.list) if (s.alive) { lo = Math.min(lo, F.fx + s.ox); hi = Math.max(hi, F.fx + s.ox + s.w); }
    if ((F.dir > 0 && hi + px > F.MAX_X) || (F.dir < 0 && lo - px < F.MIN_X)) F.dropNext = true;
    F.anim ^= 1; F.steps++;
    let landed = false;
    for (const s of F.list) {
      if (!s.alive || s.state !== 'form') continue;
      s.x = F.fx + s.ox; s.y = F.fy + s.oy;
      if (s.y + s.h > Barriers.Y) Barriers.erase(s);
      if (s.y + s.h >= GAME_CONFIG.rules.landLine) landed = true;
    }
    GameAudio.march(F);
    if (landed && ctx.onLand) ctx.onLand();
  },

  shoot(px) {
    const F = Formation, low = {};
    for (const s of F.list) if (s.alive && s.state === 'form' && (!low[s.c] || s.r > low[s.c].r)) low[s.c] = s;
    const cand = Object.values(low);
    if (!cand.length) return;
    let s;
    if (LP.chance(F.def.aimed)) s = cand.reduce((a, b) => (Math.abs(b.x + b.w / 2 - px) < Math.abs(a.x + a.w / 2 - px) ? b : a));
    else s = LP.pick(cand);
    F.fireFrom(s);
  },
  fireFrom(s) {
    const x = s.x + s.w / 2, y = s.y + s.h - 2;
    if (LP.chance(Formation.def.comedy)) Bullets.comedy(x, y, Formation.def);
    else Bullets.fire(s.T.shot, x, y, Formation.def.bulletSpeed);
  },

  // ------------------------------------------------------------------ leaving the formation
  sleep(s, secs) { s.state = 'sleep'; s.sleepT = secs; s.t = 0; },

  startDive(px) {
    const F = Formation;
    if (F.list.some((s) => s.alive && s.state === 'dive')) return;   // one at a time: deliberate, readable
    const cand = F.list.filter((s) => s.alive && s.state === 'form' && s.T.diver);
    if (!cand.length || F.alive < 2) return;
    const s = cand.reduce((a, b) => (Math.abs(b.x - px) + LP.rand(0, 120) < Math.abs(a.x - px) + LP.rand(0, 120) ? b : a));
    s.state = 'dive'; s.t = 0; s.vx = (s.x < 192 ? -0.6 : 0.6); s.vy = -1.4; s.shotsLeft = LP.randi(1, 2);
    GameAudio.dive();
  },
  dive(s, ctx) {
    const sp = Math.min(2.4, 1.3 + 0.08 * Formation.def.w);
    s.vy = Math.min(sp, s.vy + 0.06);
    // steers toward the penguin on the way down, then commits to its line (dodgeable)
    if (s.t > 0.35 && s.y < 104) s.vx = LP.clamp(s.vx + LP.clamp((ctx.px - (s.x + s.w / 2)) * 0.004, -0.06, 0.06), -1.2, 1.2);
    s.x += s.vx; s.y += s.vy;
    if (s.shotsLeft > 0 && s.y > 60 && s.y < 130 && LP.chance(0.03)) {
      s.shotsLeft--;
      Bullets.fire(s.T.shot, s.x + s.w / 2, s.y + s.h, Formation.def.bulletSpeed + 0.3);
    }
    if (s.y + s.h > Barriers.Y) Barriers.erase(s);
    if (s.y > 218) { s.state = 'return'; s.x = Formation.slot(s)[0]; s.y = -16; }
  },
  flyHome(s) {
    const [tx, ty] = Formation.slot(s), dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy), v = 3.2;
    if (d <= v) { s.x = tx; s.y = ty; s.state = 'form'; return; }
    s.x += dx / d * v; s.y += dy / d * v;
  },

  // ------------------------------------------------------------------ damage
  // first live sloth touching box (1px forgiveness in the player's favour), skipping `skip`
  hit(box, skip) {
    for (const s of Formation.list) {
      if (!s.alive || (skip && skip.has(s))) continue;
      if (box.x < s.x + s.w + 1 && box.x + box.w > s.x - 1 && box.y < s.y + s.h && box.y + box.h > s.y) return s;
    }
    return null;
  },
  kill(s) {
    const F = Formation;
    s.alive = false; F.alive--;
    F.pops.push({ x: s.x + s.w / 2 - 8, y: s.y + s.h / 2 - 6, t: 0 });
    G.burst(s.x + s.w / 2, s.y + s.h / 2, 6, '#a8682c', { speed: 1.4, life: 20, g: 0.05 });
    G.burst(s.x + s.w / 2, s.y + s.h / 2, 3, '#f6deb0', { speed: 1, life: 16, g: 0.05 });
  },
  // body box for ramming the penguin: the art minus its fins and saucer rims
  body(s) { return { x: s.x + 3, y: s.y + 2, w: s.w - 6, h: s.h - 3 }; },
  lowest() { let y = 0; for (const s of Formation.list) if (s.alive && s.state === 'form') y = Math.max(y, s.y + s.h); return y; },
  top() { let y = 999; for (const s of Formation.list) if (s.alive && s.state === 'form') y = Math.min(y, s.y); return y; },

  // ------------------------------------------------------------------ draw
  draw() {
    const F = Formation, g = LP.LCD.ctx, t = LP.Loop.time;
    // late-wave speed: afterimages trail the survivors
    const iv = F.interval(), fast = iv <= 3 && F.alive <= 6 && F.freezeT <= 0;
    for (const s of F.list) {
      if (!s.alive) continue;
      const set = F.sprites(s.T);
      let img;
      if (s.state === 'sleep') img = Sprites.asleep[s.T.key];
      else if (s.state === 'form') img = set[F.anim];
      else img = set[Math.floor(s.t * 8) % 2];
      let x = Math.round(s.x), y = Math.round(s.y);
      if (s.state === 'sleep') y += Math.round(Math.sin(s.t * 2) * 1);
      if (s.state === 'wake') x += (Math.floor(s.t * 30) % 2) * 2 - 1;
      if (fast && s.state === 'form') {
        g.globalAlpha = 0.3; g.drawImage(img, x - F.dir * 10, y);
        g.globalAlpha = 0.15; g.drawImage(img, x - F.dir * 20, y);
        g.globalAlpha = 1;
      }
      g.drawImage(img, x, y);
      if (s.state === 'sleep') {
        const k = (s.t * 0.9) % 1;
        Font.draw(g, 'Z', x + s.w - 2 + k * 4, y - 3 - k * 8, k < 0.8 ? '#9ae8ff' : '#3a6aa0', { face: 'small' });
        if (k > 0.4) Font.draw(g, 'Z', x + s.w + 3 + (k - 0.4) * 4, y - 6 - (k - 0.4) * 6, '#5a9ad0', { face: 'small' });
      }
      if (F.freezeT > 0 && s.state === 'form' && Math.floor(t * 3 + s.c) % 7 === 0) G.px(x + s.w - 3, y + 1, '#ffffff');
    }
    for (const p of F.pops) g.drawImage(Sprites.pop[p.t < 8 ? 0 : 1], Math.round(p.x), Math.round(p.y));
  }
};
