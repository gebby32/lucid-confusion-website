/* SET PIECES — the memorable moments, each driven by '!' markers in the map:
     stampede  Act 3: a thundering herd fills the gorge from the left; outrun it, leap the
               stragglers that overtake you (warned by a flashing "!"), climb to safety.
     raft      Act 6: ride a log raft down the river. Crouch under low rocks, swat the
               crocodiles, grab the vines, step off at the far dock.
     boulder   Act 8: a giant boulder chases you down the cavern.
     rise      Acts 9 + 10: lava / fire climbs up behind you during a vertical climb.
   Interface (all optional): preUpdate, update, camera(C) -> true if it owns the camera,
   drawBack / drawMid / drawFront / drawOver, playerInput(inp), checkpointData(). */
'use strict';
const SetPieces = (function () {
  const marks = () => World.ents.filter((e) => e.ch === '!').sort((a, b) => a.x - b.x);
  const overlap = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

  // ================================================================== STAMPEDE
  function stampede(cp) {
    const M = marks(), endX = M.length ? M[M.length - 1].x : World.pw;
    const S = {
      kind: 'stampede', front: (cp ? cp.x : Player.x) - 260, speed: 0, started: false, done: false, t: 0, warn: [], runners: [], rumbleT: 0,
      herd: Array.from({ length: 16 }, (_, i) => ({ dx: -(i % 4) * 26 - Math.floor(i / 4) * 9, dy: (i % 3) * 7 - ((i * 7) % 5), ph: i * 1.7, big: i % 5 === 0 })),
      far: Array.from({ length: 14 }, (_, i) => ({ x: i * 47, y: (i * 13) % 20, ph: i }))
    };
    S.update = function () {
      if (Game.phase !== 'play') return;      // the herd waits for the title card
      S.t++;
      if (S.done) return;
      if (!S.started) {
        if (S.t === 2) { Sfx('rumble'); }
        if (S.t > 90) S.started = true;
        LP.FX.shake(1, 2);
        return;
      }
      const P = Player;
      if (P.x >= endX && P.state !== 'dead') { S.done = true; S.speed = 0; Game.banner = 'SAFE!'; Game.bannerT = 90; return; }
      // the herd keeps a steady, relentless pace (and catches up if you dawdle far ahead)
      const target = 1.7 + Math.min(0.5, S.t / 2400);
      S.speed = LP.approach(S.speed, target, 0.02);
      const lag = P.x - S.front;
      S.front += S.speed + (lag > 360 ? (lag - 360) * 0.02 : 0);
      if (++S.rumbleT > 130) { S.rumbleT = 0; Sfx('rumble'); }
      if (S.t % 3 === 0) LP.FX.shake(1.5, 3);
      // trampled
      if (P.state !== 'dead' && P.x < S.front + 6) { P.die(); P.vy = -7; Sfx('thud'); }
      // stragglers that overtake along the gorge floor
      if (S.t % 260 === 120 && P.state !== 'dead') S.warn.push({ t: 70, y: P.y });
      for (const w of S.warn) if (--w.t === 0) {
        const r = { x: Game.cam.x - 40, y: w.y, vx: 3.9, t: 0 };
        S.runners.push(r); Sfx('snort');
      }
      LP.prune(S.warn, (w) => w.t <= 0);
      for (const r of S.runners) {
        r.t++; r.x += r.vx;
        const f = World.floor(r.x - 10, r.x + 10, r.y, r.y - 10, r.y + 24, false, true);
        if (f) r.y = f.y; else r.y += 3;
        if (r.x > Game.cam.x + 420 || r.y > World.ph) r.dead = true;
        if (P.state !== 'dead' && overlap(P.box(), { x0: r.x - 18, y0: r.y - 26, x1: r.x + 18, y1: r.y })) P.hurt(1, r.x - 20);
      }
      LP.prune(S.runners, (r) => r.dead);
    };
    S.camera = function (C) {
      // never look back past the herd
      C.lockX0 = Math.max(0, Math.min(S.front - 30, World.pw - 320));
      return false;
    };
    S.drawBack = function (g, cx, cy) {
      // a second herd thundering along the far canyon floor
      const yb = Math.round(200 - (cy - (World.ph - 240)) * 0.14);
      if (yb > 260) return;
      for (const h of S.far) {
        const x = ((h.x - cx * 0.25 + S.t * 1.6) % 700 + 700) % 700 - 60;
        const f = CharArt.get('gnu', 'run', (S.t >> 2) + h.ph);
        g.globalAlpha = 0.55; Art.draw(g, f, x, yb + h.y, false); g.globalAlpha = 1;
      }
      g.fillStyle = 'rgba(232,180,120,0.25)'; g.fillRect(0, yb - 10, 320, 30);
    };
    S.drawMid = function (g, cx, cy) {
      for (const r of S.runners) { const f = CharArt.get('gnuBig', 'run', r.t >> 2); Art.draw(g, f, r.x - cx, r.y - cy + 2, false); }
      if (!S.started && S.t < 2) return;
      const fx = S.front - cx;
      if (fx < -120) return;
      // the wall of dust: billowing, dithered clouds rolling with the herd
      const dustC = ['#8a5a38', '#b07a4c', '#d0a070', '#e8c090'];
      for (let k = 0; k < 26; k++) {
        const yy = (k * 23) % 250 - 10, ph = S.t / 7 + k * 1.3;
        const r = 20 + (k * 7) % 18 + Math.sin(ph) * 4;
        const xx = fx - 30 - ((k * 13) % 40) + Math.sin(ph * 0.7) * 6;
        Px.ellipse(g, xx, yy, r, r * 0.8, dustC[k % 3]);
        Px.ellipse(g, xx - r * 0.3, yy - r * 0.3, r * 0.6, r * 0.45, dustC[(k % 3) + 1]);
      }
      g.fillStyle = dustC[1]; g.fillRect(0, 0, Math.max(0, Math.round(fx - 60)), 240);
      for (let y = 0; y < 240; y += 2) for (let x = Math.max(0, Math.round(fx - 64)); x < fx - 40; x += 4) if (((x >> 1) + y + (S.t >> 1)) % 4 === 0) { g.fillStyle = dustC[2]; g.fillRect(x, y, 2, 1); }
      // the leading wildebeest
      const gy = Player.y - cy;
      for (const h of S.herd) {
        const f = CharArt.get(h.big ? 'gnuBig' : 'gnu', 'run', Math.floor((S.t + h.ph * 4) / 4));
        const fy = groundY(S.front + h.dx) - cy;
        Art.draw(g, f, fx + h.dx, (isFinite(fy) ? fy : gy) + h.dy * 0.3 - (h.dy > 4 ? 6 : 0), false);
      }
      for (let k = 0; k < 6; k++) { const px = fx + 10 + ((S.t * 3 + k * 23) % 40), py = gy - 4 - ((S.t * 2 + k * 11) % 16); g.fillStyle = 'rgba(230,190,140,0.8)'; g.fillRect(Math.round(px), Math.round(py), 5, 4); }
    };
    function groundY(x) { const f = World.floor(x - 2, x + 2, 0, 0, World.ph, false, true); return f ? f.y : Player.y; }
    S.drawOver = function (g) {
      for (const w of S.warn) if ((w.t >> 3) % 2) { Font.draw(g, '!', 10, Math.round(w.y - Game.cam.y - 24), '#ff3a3a', { scale: 2, outline: '#ffffff' }); }
      if (!S.started && Game.phase === 'play') Font.draw(g, 'RUN!', 160, 70, (S.t >> 3) % 2 ? '#ffe060' : '#ff6a3a', { align: 'center', scale: 3, shadow: '#5a1a00' });
    };
    return S;
  }

  // ================================================================== RAFT
  function raft(cp) {
    const M = marks();
    const startX = M.length ? M[0].x : 64, endX = M.length > 1 ? M[M.length - 1].x : World.pw - 200;
    let wy = M.length ? M[0].y : World.ph - 64;
    while (World.at(startX, wy) !== World.LIQ && wy < World.ph) wy += 16;
    const water = Math.floor(wy / 16) * 16 + 6;
    const x0 = cp && cp.raft ? cp.x : startX;
    const mids = M.slice(1, -1).map((m) => m.x).filter((x) => x > x0 + 8);
    const R = { kind: 'raft', x: x0, y: water - 8, speed: 0, on: false, done: false, t: 0, mv: { x: x0 - 34, y: water - 8, w: 68, dx: 0, dy: 0, solid: true, thin: false } };
    World.movers.push(R.mv);
    R.preUpdate = function () {
      R.t++;
      const P = Player;
      if (!R.on && P.onGround && P.mover === R.mv) { R.on = true; Game.banner = 'ALL ABOARD!'; Game.bannerT = 60; }
      if (R.on && !R.done) R.speed = LP.approach(R.speed, 1.15, 0.02);
      if (R.x >= endX) { R.speed = 0; R.done = true; }
      // markers along the river act as checkpoints: respawn back on the raft
      if (mids.length && R.x >= mids[0] && P.state !== 'dead') {
        mids.shift();
        Game.checkpoint = { x: R.x, y: R.mv.y - 2, key: 'raft' + Math.round(R.x), form: P.form, raft: true };
        Sfx('checkpoint'); Game.popup(R.x, R.mv.y - 40, 'CHECKPOINT', '#7affb0');
      }
      const nx = R.x + R.speed, ny = water - 8 + Math.sin(R.t / 22) * 1.2;
      R.mv.dx = nx - R.x; R.mv.dy = ny - R.mv.y; R.x = nx; R.mv.x = R.x - 34; R.mv.y = ny;
    };
    R.update = function () {
      if (R.on && !R.done && Player.state !== 'dead') {
        // the river current carries the camera: keep up!
        if (Player.x < Game.cam.x + 6) Player.x = Game.cam.x + 6;
      }
    };
    R.camera = function (C) {
      if (!R.on || R.done) return false;
      const tx = R.x - 110;
      C.x += LP.clamp(tx - C.x, -3, 3);
      C.lockX0 = Math.max(0, R.x - 160);
      return false;
    };
    R.drawMid = function (g, cx, cy) {
      const sx = Math.round(R.mv.x - cx), sy = Math.round(R.mv.y - cy);
      for (let k = 0; k < 4; k++) { Props.platform(g, 'log', sx + k * 17, sy + (k % 2), 1.06, World.theme); }
      Px.rect(g, sx + 4, sy + 2, 60, 1, '#c8a060');
      Px.rect(g, sx + 14, sy + 1, 2, 8, '#3a2a10'); Px.rect(g, sx + 50, sy + 1, 2, 8, '#3a2a10');
      if (R.on && R.t % 8 === 0) G.dust(R.mv.x - 2, water, 1, '#ffffff', { dir: -1 });
    };
    R.checkpointData = () => ({ x: R.x });
    return R;
  }

  // ================================================================== BOULDER
  function boulder(cp) {
    const M = marks();
    const trig = M[0] ? M[0].x : 0, endX = M.length > 1 ? M[M.length - 1].x : World.pw;
    const B = { kind: 'boulder', state: cp && cp.x > trig ? 'gone' : 'wait', x: trig - 240, y: 0, vy: 0, speed: 0, ang: 0, r: 28, t: 0 };
    B.update = function () {
      B.t++;
      const P = Player;
      if (B.state === 'wait') {
        if (P.x > trig && P.state !== 'dead') { B.state = 'roll'; B.x = Math.max(trig - 230, Game.cam.x - 40); B.y = Game.cam.y - 40; B.vy = 0; Sfx('rumble'); Game.banner = 'RUN!'; Game.bannerT = 60; }
        return;
      }
      if (B.state !== 'roll') return;
      B.speed = LP.approach(B.speed, 2.55, 0.03);
      B.x += B.speed; B.ang += B.speed / B.r;
      const f = World.floor(B.x - 4, B.x + 4, B.y, B.y - 20, B.y + Math.max(8, B.vy + 2), false, true);
      if (f && B.vy >= 0) { if (B.vy > 3) { LP.FX.shake(4, 10); Sfx('thud'); } B.y = f.y; B.vy = 0; }
      else { B.vy = Math.min(B.vy + 0.4, 8); B.y += B.vy; }
      World.hitBreakable(B.x + B.r - 4, B.y - B.r * 2, B.x + B.r + 2, B.y - 4);
      if (B.t % 26 === 0) Sfx('boulder');
      if (B.t % 4 === 0) LP.FX.shake(1.2, 3);
      if (P.state !== 'dead' && Math.hypot(P.x - B.x, (P.y - P.h / 2) - (B.y - B.r)) < B.r + 6) { P.die(); P.vy = -6; }
      if (B.x > endX || B.y > World.ph + 60) { B.state = 'gone'; G.burst(B.x, B.y - B.r, 30, '#8a7aa8', { colors: ['#3a2456', '#563a74', '#7a5a98'], speed: 3, life: 40, size: 3 }); Sfx('rubble'); LP.FX.shake(6, 20); }
    };
    B.drawMid = function (g, cx, cy) {
      if (B.state !== 'roll') return;
      const sx = B.x - cx, sy = B.y - B.r - cy, R = Themes.T[World.theme].terrain.ramp;
      Px.ellipse(g, sx, sy, B.r, B.r, R[0]);
      Px.ellipse(g, sx - 3, sy - 3, B.r - 4, B.r - 4, R[2]);
      Px.ellipse(g, sx - 9, sy - 10, B.r * 0.4, B.r * 0.3, R[3]);
      for (let k = 0; k < 5; k++) { const a = B.ang + k * 1.256; Px.ellipse(g, sx + Math.cos(a) * B.r * 0.6, sy + Math.sin(a) * B.r * 0.6, 3, 2, R[1]); }
      for (let k = 0; k < 3; k++) { g.fillStyle = '#c0b0e0'; g.fillRect(Math.round(sx - B.r - 4 - k * 6), Math.round(B.y - cy - 4 - k * 3 - (B.t + k * 3) % 5), 3, 3); }
    };
    return B;
  }

  // ================================================================== RISING LAVA / FIRE
  function rise(cp) {
    const M = marks();
    // triggered at the lowest marker, stops at the highest
    const topY = M.length ? Math.min(...M.map((m) => m.y)) : 0;
    const bottom = M.length ? Math.max(...M.map((m) => m.y)) : World.ph;
    const lava = World.theme === 'volcano';
    const R = { kind: 'rise', on: false, done: false, y: (cp ? cp.y : bottom) + 150, t: 0, lava };
    R.update = function () {
      R.t++;
      const P = Player;
      if (!R.on) {
        const start = M.find((m) => m.y === bottom);
        if (start && P.y <= start.y && Math.abs(P.x - start.x) < 200 && P.state !== 'dead') { R.on = true; R.y = Math.max(P.y + 170, R.y); Sfx('rumble'); Game.banner = lava ? 'THE LAVA IS RISING!' : 'THE FIRE IS SPREADING!'; Game.bannerT = 90; }
        return;
      }
      if (R.done) return;
      if (P.y <= topY + 2 && P.onGround) { R.done = true; return; }
      const gap = R.y - P.y;
      R.y -= gap > 230 ? 1.4 : 0.48;
      if (R.t % 40 === 0) Sfx('fire');
      if (P.state !== 'dead' && P.y > R.y + 4) { P.die(); P.vy = -7; Game.onSplash(P.x, R.y); }
    };
    R.drawFront = function (g, cx, cy) {
      if (!R.on) return;
      const sy = Math.round(R.y - cy);
      if (sy > 250) return;
      const c = lava ? ['#a02808', '#e04a0a', '#ff9a2a', '#fff0a0'] : ['#5a0e06', '#c8300a', '#ff7a1a', '#ffd060'];
      g.fillStyle = c[0]; g.fillRect(0, sy + 10, 320, 240);
      for (let x = 0; x < 320; x += 2) {
        const h = 6 + Math.sin(x * 0.11 + R.t * 0.15) * 4 + Math.sin(x * 0.37 - R.t * 0.3) * 3 + (lava ? 0 : Math.abs(Math.sin(x * 0.7 + R.t * 0.4)) * 8);
        g.fillStyle = c[1]; g.fillRect(x, sy + 10 - h, 2, h);
        g.fillStyle = c[2]; g.fillRect(x, sy + 12 - h * 0.5, 2, h * 0.5);
        if (h > 11) { g.fillStyle = c[3]; g.fillRect(x, sy + 10 - h, 2, 2); }
      }
      for (let k = 0; k < 12; k++) { const x = (k * 37 + R.t * 0.7) % 320, y = sy - 10 - ((R.t * 1.5 + k * 19) % 40); g.fillStyle = k % 2 ? c[3] : c[2]; g.fillRect(Math.round(x), Math.round(y), 2, 2); }
      if (!lava) { g.fillStyle = 'rgba(30,10,10,0.35)'; g.fillRect(0, sy - 60, 320, 40); }
    };
    R.camera = function (C) { if (R.on && !R.done) { /* keep the danger in view */ } return false; };
    return R;
  }

  const MAKERS = { stampede, raft, boulder, rise };
  function create(name, cp) { return MAKERS[name] ? MAKERS[name](cp) : null; }
  return { create, MAKERS };
})();
