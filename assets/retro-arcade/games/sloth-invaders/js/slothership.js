/* THE SLOTHERSHIP — the bonus craft. Every so often it drifts across the top of the
   screen at a leisurely sloth pace (one crew member hanging underneath by its claws).
   Mystery score. Very rarely it is unexpectedly, alarmingly fast. */
'use strict';
const Slothership = {
  s: null, timer: 20, score: null,

  reset() { Slothership.s = null; Slothership.score = null; Slothership.timer = LP.rand(14, 22); },

  update(dt, canSpawn) {
    const S = Slothership;
    if (S.score && (S.score.t += dt) > 1.4) S.score = null;
    if (!S.s) {
      if (canSpawn && (S.timer -= dt) <= 0) S.spawn();
      return;
    }
    const s = S.s;
    s.t += dt; s.x += s.vx;
    if ((s.sndT -= dt) <= 0) { s.sndT = s.fast ? 0.14 : 0.36; GameAudio.shipLoop(s.fast); }
    if ((s.vx > 0 && s.x > 390) || (s.vx < 0 && s.x < -36)) { S.s = null; S.timer = LP.rand(18, 30); }
  },

  spawn() {
    const dir = LP.chance(0.5) ? 1 : -1, fast = LP.chance(0.05);
    Slothership.s = { x: dir > 0 ? -32 : 386, y: 22, vx: dir * (fast ? 3.2 : 0.55), fast, t: 0, sndT: 0 };
  },

  box() { const s = Slothership.s; return s && { x: s.x + 1, y: s.y, w: 28, h: 16 }; },

  // destroyed: the score hangs where it was, cabinet style
  kill(points) {
    const s = Slothership.s;
    Slothership.score = { x: s.x + 15, y: s.y + 4, pts: points, t: 0 };
    G.burst(s.x + 15, s.y + 8, 16, '#ff50e0', { speed: 1.8, life: 26, g: 0.04 });
    G.burst(s.x + 15, s.y + 8, 8, '#ffd040', { speed: 1.2, life: 22, g: 0.04 });
    G.burst(s.x + 15, s.y + 12, 5, '#a8682c', { speed: 1, life: 24, g: 0.08 });
    Slothership.s = null; Slothership.timer = LP.rand(18, 30);
  },

  draw() {
    const S = Slothership, g = LP.LCD.ctx, s = S.s;
    if (s) {
      const x = Math.round(s.x), y = Math.round(s.y + Math.sin(s.t * 2.2) * 1);
      if (s.fast) {
        g.fillStyle = '#ff50e0';
        for (let i = 0; i < 4; i++) g.fillRect(x + (s.vx > 0 ? -6 - i * 7 : 31 + i * 7), y + 6 + (i % 2) * 3, 5, 1);
      }
      g.drawImage(Sprites.ship[Math.floor(s.t * (s.fast ? 16 : 4)) % 2], x, y);
    }
    if (S.score && Math.floor(S.score.t * 8) % 4 !== 3) Font.draw(g, String(S.score.pts), S.score.x, S.score.y, '#ff50e0', { align: 'center', outline: '#000' });
  }
};
