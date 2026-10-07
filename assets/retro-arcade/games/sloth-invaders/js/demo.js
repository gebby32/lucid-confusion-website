/* AUTOPILOT — flies the penguin in the attract-mode demo (and for tools/bot.js).
   A competent but mortal pilot: dodges what it sees coming, leads its shots on the
   formation, chases the Slothership and pickups, and sometimes simply hesitates. */
'use strict';
const Autopilot = {
  hesitate: 0, lastAim: 192,

  control() {
    const p = Game.player, out = { left: false, right: false, fire: false };
    if (!p || !p.alive) return out;
    const go = (dir) => { if (dir < 0) out.left = true; else if (dir > 0) out.right = true; };

    // 1. dodge: list everything that will cross our row soon, and never stand under it
    const threats = [];
    for (const b of Bullets.list) {
      const bb = Bullets.box(b);
      if (bb.y > p.y + 14 || bb.y + bb.h < p.y - 70) continue;           // already past, or far away
      const fr = Math.max(0, p.y + 4 - (bb.y + bb.h)) / Math.max(0.4, b.vy);
      threats.push({ x: bb.x + bb.w / 2 + b.vx * fr, r: 10 + bb.w / 2 });
      if (b.vx) threats.push({ x: bb.x + bb.w / 2, r: 9 + bb.w / 2 });
    }
    for (const s of Formation.list) {
      if (!s.alive || (s.state !== 'dive' && s.state !== 'return')) continue;
      const dy = p.y - (s.y + s.h);
      if (dy > -14 && dy < 80) {
        threats.push({ x: s.x + s.w / 2, r: 16 });
        if (s.vy > 0) threats.push({ x: s.x + s.w / 2 + s.vx * Math.max(0, dy) / s.vy, r: 16 });
      }
    }
    const unsafe = (x) => threats.some((t) => Math.abs(t.x - x) < t.r);
    if (unsafe(p.x)) {
      // the nearest safe spot, either side
      for (let d = 2; d < 120; d += 2) {
        if (p.x + d <= 374 && !unsafe(p.x + d)) { go(1); return out; }
        if (p.x - d >= 10 && !unsafe(p.x - d)) { go(-1); return out; }
      }
      return out;
    }
    if (this.hesitate > 0) { this.hesitate--; return out; }
    if (Math.random() < 0.004) this.hesitate = LP.randi(10, 40);

    // 2. choose something to aim at
    let aim = null, tight = 3;
    const pick = Bullets.pickups[0];
    if (pick && pick.y > 120) aim = pick.x + 4;
    const S = Slothership.s;
    if (aim === null && S && !S.fast) {
      const fr = (p.y - S.y) / 5, ax = S.x + 15 + S.vx * fr;
      if (ax > 20 && ax < 364) aim = ax;
    }
    if (aim === null && Boss.b && Boss.b.phase === 'fight') {
      const b = Boss.b, live = b.pods.filter((q) => q.alive);
      const tx = live.length ? live.reduce((a, q) => (Math.abs(b.x + q.px - p.x) < Math.abs(b.x + a.px - p.x) ? q : a)).px : 68;
      const vx = this.bossX === undefined ? 0 : b.x - this.bossX;   // lead the target
      this.bossX = b.x;
      aim = b.x + tx + vx * (p.y - b.y - 44) / 5; tight = 4;
    }
    if (aim === null && Formation.alive) {
      const low = {};
      for (const s of Formation.list) if (s.alive && (!low[s.c] || s.r > low[s.c].r || s.state !== 'form')) low[s.c] = s;
      const v = Formation.speed();
      let best = null, bd = 1e9;
      for (const s of Object.values(low)) {
        const fr = (p.y - (s.y + s.h)) / 5;
        const ax = s.x + s.w / 2 + (s.state === 'form' ? v * fr : 0);
        const d = Math.abs(ax - p.x);
        if (d < bd) { bd = d; best = ax; }
      }
      aim = best;
    }
    if (aim === null) aim = this.lastAim;
    aim = LP.clamp(aim, 10, 374);
    this.lastAim = aim;
    const dx = aim - p.x;
    if (Math.abs(dx) > 1.5 && !unsafe(p.x + Math.sign(dx) * 2)) go(Math.sign(dx));
    if (Math.abs(dx) < tight) out.fire = true;
    return out;
  }
};
