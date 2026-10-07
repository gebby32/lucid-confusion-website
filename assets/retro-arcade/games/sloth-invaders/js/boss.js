/* BOSS — THE GREAT SLOTHERSHIP. Every fifth wave. A huge saucer crewed by several
   visible sloths: knock out the four weapon pods, which drops the force field around
   the command dome, then hit the Grand Commander himself. Short, loud, then back to
   formations at a higher difficulty. */
'use strict';
const Boss = {
  b: null, W: 136, H: 50,
  PODS: [20, 44, 92, 116],

  // the Grand Commander (20x15, mirrored halves)
  face: null,
  build() {
    const half = [
      '.......RRR',
      '.....RRRRy',
      '....RRRRyy',
      '...RRRRRRy',
      '..Yyyyyyyy',
      '..bbbbcccc',
      '.bbbcccccc',
      '.bbkkkkkcc',
      '.bkkkwkkcc',
      '.bbkkkkccc',
      '.bbcccccck',
      '..bbkccccc',
      '..bbbckkkk',
      '...bbbbbbb',
      '...yybbbbb'
    ];
    Boss.face = G.sprite(half.map((r) => r + [...r].reverse().join('')), Sprites.P);
    // pod gunner (12x11, mirrored)
    const pod = [
      '..GGgg',
      '.Gghhh',
      'Gghbbc',
      'Gghkwc',
      'Gghbcd',
      'GgGhhh',
      'GgggGG',
      '.GGGGG',
      '...Gkk',
      '....kk',
      '....kk'
    ];
    Boss.pod = G.sprite(pod.map((r) => r + [...r].reverse().join('')), Sprites.P);
    Boss.podDead = G.sprite(['..GG..GG....', '.GkkGGkG....', 'GkGGkkGkG...'.slice(0, 12), '.kG..Gk.....', '..k...k.....'].map((r) => r.slice(0, 12)), Sprites.P);
    // the hull (static) is drawn once
    const c = G.canvas(Boss.W, Boss.H), g = c.getContext('2d');
    G.ellipse(68, 33, 66, 9, '#2a2e3c', g);
    G.ellipse(68, 32, 65, 8, '#545a6c', g);
    G.ellipse(68, 31, 63, 6, '#a8b0c0', g);
    G.ellipse(68, 29, 58, 3, '#e6eaf4', g);
    G.ellipse(68, 38, 50, 5, '#4a1a8a', g);
    G.ellipse(68, 37, 46, 3, '#9a50ff', g);
    G.ellipse(68, 19, 19, 16, '#1a5aa8', g);
    G.ellipse(68, 19, 18, 15, '#58d8ff', g);
    G.ellipse(68, 19, 16, 13, '#0a1830', g);
    g.fillStyle = '#e6eaf4'; g.fillRect(56, 9, 2, 3); g.fillRect(55, 12, 1, 3);   // glass glint
    g.drawImage(Boss.face, 58, 11);
    // portholes: more crew, peering out, unconcerned
    for (const px of [24, 38, 92, 106]) {
      G.ellipse(px, 29, 3, 2, '#2a2e3c', g);
      g.fillStyle = '#f6deb0'; g.fillRect(px - 2, 28, 5, 3);
      g.fillStyle = '#1e1008'; g.fillRect(px - 2, 28, 1, 1); g.fillRect(px + 2, 28, 1, 1); g.fillRect(px, 30, 1, 1);
      g.fillStyle = '#a8682c'; g.fillRect(px - 1, 27, 3, 1);
    }
    Boss.hull = c;
    Boss.faceW = G.silhouette(Boss.face, '#ffffff'); Boss.podW = G.silhouette(Boss.pod, '#ffffff');
  },

  start(level) {
    if (!Boss.hull) Boss.build();
    const podHp = Math.min(7, 3 + level), coreHp = Math.min(26, 10 + 4 * level);   // capped: stays a short spectacle
    Boss.b = {
      level, x: 192 - Boss.W / 2, y: -60, t: 0, phase: 'enter', spd: Math.min(0.75, 0.45 + 0.08 * level),
      pods: Boss.PODS.map((px, i) => ({ px, hp: podHp, max: podHp, alive: true, fireT: 1.2 + i * 0.45, flash: 0 })),
      core: { hp: coreHp, max: coreHp, flash: 0 }, shield: true, coreT: 2, flash: 0, deathT: 0, boomT: 0
    };
  },

  podsLeft() { return Boss.b ? Boss.b.pods.filter((p) => p.alive).length : 0; },

  update(dt, ctx) {
    const b = Boss.b;
    if (!b) return;
    b.t += dt;
    for (const p of b.pods) if (p.flash > 0) p.flash--;
    if (b.core.flash > 0) b.core.flash--;
    if (b.phase === 'enter') {
      b.y = Math.min(24, b.y + 0.55);
      if (b.y >= 24) { b.phase = 'fight'; b.t = 0; }
      return;
    }
    if (b.phase === 'dying') return Boss.dying(dt, ctx);
    const frantic = !b.shield, spd = b.spd * (frantic ? 1.6 : 1);
    b.ph = (b.ph || 0) + dt * spd;
    b.x = 192 - Boss.W / 2 + Math.sin(b.ph) * 108;
    b.y = 24 + Math.sin(b.t * 1.7) * 2 + (frantic ? Math.sin(b.t * 5) * 2 : 0);
    if (!ctx.firing) return;
    const lim = 4 + b.level, sp = Math.min(2.6, 1.5 + 0.15 * b.level);
    for (const p of b.pods) {
      if (!p.alive || (p.fireT -= dt) > 0) continue;
      p.fireT = LP.rand(1.4, 2.4) / (1 + 0.15 * b.level);
      if (Bullets.enemyCount() >= lim) continue;
      const x = b.x + p.px, y = b.y + 47;
      const aim = b.level >= 2 && LP.chance(0.5) ? LP.clamp((ctx.px - x) / 120, -0.6, 0.6) : 0;
      Bullets.fire(b.level >= 3 && LP.chance(0.3) ? 'needle' : 'orb', x, y, sp, aim);
    }
    // the exposed commander gets personal: couches, spreads
    if (!b.shield && (b.coreT -= dt) <= 0) {
      b.coreT = Math.max(0.7, 1.5 - 0.15 * b.level);
      const x = b.x + 68, y = b.y + 36;
      if (LP.chance(0.45)) Bullets.comedy(x, y, { bulletSpeed: sp }, LP.pick(['couch', 'couch', 'mug', 'banana']));
      else [-0.7, 0, 0.7].forEach((vx) => Bullets.fire('drop', x, y, sp * 0.9, vx));
    }
  },

  // a player shot's box -> what it hit: { part: 'pod'|'core'|'hull'|'shield', pod }
  hit(box) {
    const b = Boss.b;
    if (!b || b.phase !== 'fight') return null;
    const inside = (x, y, w, h) => box.x < b.x + x + w && box.x + box.w > b.x + x && box.y < b.y + y + h && box.y + box.h > b.y + y;
    for (const p of b.pods) if (p.alive && inside(p.px - 6, 36, 12, 12)) return { part: 'pod', pod: p };
    // the dome and the hull right beneath it are the command cockpit (reachable from below)
    if (inside(52, 3, 32, 42)) return { part: b.shield ? 'shield' : 'core' };
    if (inside(4, 24, 128, 17)) return { part: 'hull' };
    return null;
  },
  damagePod(p) {
    p.hp--; p.flash = 4;
    if (p.hp > 0) return false;
    const b = Boss.b;
    p.alive = false;
    G.burst(b.x + p.px, b.y + 42, 14, '#ffd040', { speed: 1.8, life: 24 });
    G.burst(b.x + p.px, b.y + 42, 8, '#a8682c', { speed: 1.2, life: 26, g: 0.08 });
    LP.FX.shake(2, 10);
    if (!Boss.podsLeft()) { b.shield = false; b.coreT = 1.4; }
    return true;
  },
  damageCore() {
    const b = Boss.b;
    b.core.hp--; b.core.flash = 4;
    if (b.core.hp > 0) return false;
    b.phase = 'dying'; b.deathT = 0; b.boomT = 0;
    return true;
  },
  dying(dt, ctx) {
    const b = Boss.b;
    b.deathT += dt;
    b.y += 0.12;
    if ((b.boomT -= dt) <= 0 && b.deathT < 2.2) {
      b.boomT = 0.09;
      const x = b.x + LP.rand(8, Boss.W - 8), y = b.y + LP.rand(6, 42);
      G.burst(x, y, 7, LP.pick(['#ffd040', '#ff8a1a', '#ffffff', '#ff3a32']), { speed: 1.6, life: 18 });
      GameAudio.bossBoom();
      LP.FX.shake(2, 6);
    }
    if (b.deathT >= 2.2 && !b.gone) {
      b.gone = true;
      LP.FX.flash(3); LP.FX.shake(5, 30);
      const cx = b.x + 68, cy = b.y + 25;
      G.burst(cx, cy, 40, '#ffffff', { speed: 3, life: 34 });
      G.burst(cx, cy, 30, '#ffd040', { speed: 2.4, life: 40 });
      G.burst(cx, cy, 20, '#a8682c', { speed: 1.6, life: 44, g: 0.06 });
      GameAudio.bossDie();
      if (ctx.onDefeat) ctx.onDefeat();
    }
  },

  draw() {
    const b = Boss.b, g = LP.LCD.ctx;
    if (!b || b.gone) return;
    const x = Math.round(b.x), y = Math.round(b.y), t = b.t;
    if (b.phase === 'dying' && Math.floor(b.deathT * 20) % 3 === 0) g.globalAlpha = 0.6;
    g.drawImage(Boss.hull, x, y);
    if (b.core.flash) g.drawImage(Boss.faceW, x + 58, y + 11);
    // running lights
    const cols = ['#ff3a32', '#ffd040', '#40ff60', '#58d8ff'];
    for (let i = 0; i < 15; i++) {
      const lx = x + 12 + i * 8, on = (i + Math.floor(t * 8)) % 4;
      G.rect(lx, y + 32, 2, 1, cols[on]);
    }
    // weapon pods
    for (const p of b.pods) {
      const px = x + p.px - 6, py = y + 37;
      if (!p.alive) {
        g.drawImage(Boss.podDead, px, py);
        if (Math.random() < 0.3) LP.FX.spawn({ x: px + 6 + LP.rand(-2, 2), y: py + 2, vx: LP.rand(-0.2, 0.2), vy: -0.4, g: -0.005, life: 22, color: LP.pick(['#545a6c', '#2a2e3c', '#ff8a1a']), size: 1, draw: G._part });
        continue;
      }
      g.drawImage(p.flash ? Boss.podW : Boss.pod, px, py);
      // damage pips
      for (let k = 0; k < p.max; k++) if (k >= p.hp) G.px(px + 1 + k % 10, py - 1, '#ff3a32');
    }
    // force field around the command dome
    if (b.shield) {
      const k = Math.floor(t * 12) % 3;
      g.fillStyle = ['#58d8ff', '#9ae8ff', '#1a8aff'][k];
      for (let a = 0; a < 60; a++) {
        if ((a + k) % 3 === 0) continue;
        const r = a / 60 * Math.PI;
        g.fillRect(Math.round(x + 68 - Math.cos(r) * 22), Math.round(y + 21 - Math.sin(r) * 19), 1, 1);
      }
    } else if (b.phase === 'fight') {
      // core health bar on the hull
      const w = Math.round(40 * b.core.hp / b.core.max);
      G.rect(x + 48, y + 44, 40, 2, '#3a0a0a'); G.rect(x + 48, y + 44, w, 2, Math.floor(t * 6) % 2 ? '#ff3a32' : '#ffd040');
    }
    g.globalAlpha = 1;
  }
};
