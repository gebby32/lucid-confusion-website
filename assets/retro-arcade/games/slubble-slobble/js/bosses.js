/* BOSSES — seven original big pixel bosses. Nobody here has a damage sponge: every hit
   comes from the BUBBLE mechanic.
     LAUNCH   pop a bubbled minion near the boss -> it rockets INTO the boss
     RETURN   bubble a boss projectile, pop it -> it homes back to the sender
     WEAKSPOT bubble a weak point while it's exposed (open bill, open core, dazed skull)
     PARTS    bubble Sir Rattles' hands three times -> they float away trapped
     CLOG     feed trapped minions to the DUSTLORD 3000's nozzle
   Finale: knock the Generalissimo dizzy, then trap HIM in a bubble and pop it. */
'use strict';
const Bosses = (function () {
  const TOP = 16, BOT = 184;
  let b = null;
  const missiles = [];

  const col = (c) => (b && b.inv > 0 && (b.inv >> 2) % 2 ? '#fcfcfc' : c);
  // ellipses get a 1px black outline so bosses read against any backdrop
  const E = (cx, cy, rx, ry, c, g) => { if (c !== '#000' && c !== '#fcfcfc' && rx > 3) G.ellipse(cx, cy, rx + 1, ry + 1, '#000', g); G.ellipse(cx, cy, rx, ry, c, g); };
  const R = (x, y, w, h, c) => G.rect(x, y, w, h, col(c));
  const over = (a, r) => a.x < r.x + r.w && a.x + a.w > r.x && a.y < r.y + r.h && a.y + a.h > r.y;
  const nearestP = (x, y) => { let best = null, bd = 1e9; for (const p of Players.list) if (Players.active(p)) { const d = Math.abs(p.x - x) + Math.abs(p.y - y); if (d < bd) { bd = d; best = p; } } return best; };
  const minions = (name) => Enemies.list.filter((e) => e.name === name || e.minion).length;
  function spawnMinion(name, x, y, o) { const e = Enemies.spawn(name, x, y, Object.assign({ minion: true, appear: 20 }, o)); e.dir = x < 128 ? 1 : -1; return e; }
  function throwShot(kind, x, y, vx, vy, g, draw, extra) {
    return Enemies.shot(kind, x, y, vx, vy, g, Object.assign({ returnable: true, r: 5, draw }, extra));
  }
  const aim = (x, y, sp) => { const p = nearestP(x, y) || { x: 128, y: 150 }; const dx = p.x - x, dy = p.y - 10 - y, d = Math.hypot(dx, dy) || 1; return [dx / d * sp, dy / d * sp]; };

  // ------------------------------------------------------------------ projectile art
  const ART = {
    claw(g, s) { E(s.x, s.y, 4, 3, '#f83800', g); G.px(s.x + 3, s.y - 3, '#f83800'); G.px(s.x + 4, s.y - 2, '#f83800'); G.px(s.x - 1, s.y - 1, '#fca044'); },
    trash(g, s) { G.rect(s.x - 3, s.y - 4, 7, 8, '#7c7c7c'); G.rect(s.x - 4, s.y - 5, 9, 2, '#bcbcbc'); G.px(s.x, s.y - 1, '#00a800'); },
    quack(g, s) { G.ring(s.x, s.y, 3 + ((s.t >> 3) & 1), '#f8b800', g); G.px(s.x, s.y, '#fcfcfc'); },
    missile(g, s) { G.rect(s.x - 4, s.y - 2, 8, 4, '#bcbcbc'); G.rect(s.x + (s.vx > 0 ? 3 : -5), s.y - 2, 2, 4, '#f83800'); G.px(s.x + (s.vx > 0 ? -5 : 4), s.y, (s.t >> 1) % 2 ? '#f8b800' : '#f83800'); },
    dust(g, s) { E(s.x, s.y, 4, 4, '#7c7c7c', g); G.px(s.x - 1, s.y - 1, '#fcfcfc'); G.px(s.x + 1, s.y - 1, '#fcfcfc'); },
    fishm(g, s) { G.drawC(Sprites.enemy('fish', 0, s.vx < 0, 'angry'), s.x, s.y); },
    bonebig(g, s) { G.drawC(Sprites.icon('bone'), s.x, s.y); },
    laserbeam(g, s) { G.rect(s.x - 6, s.y - 1, 12, 3, (s.t >> 1) % 2 ? '#f83800' : '#fcfcfc'); }
  };

  // ------------------------------------------------------------------ boss definitions
  const DEFS = {
    // =========================================================== KING CROAKUS
    frog: {
      hp: 6, init: () => ({ x: 170, y: BOT, vx: 0, vy: 0, w: 46, h: 32, act: 'sit', at: 90, mouth: 0, tongue: 0 }),
      update(o) {
        const p = nearestP(o.x, o.y);
        if (o.act === 'air') {
          o.vy += 0.2; o.x += o.vx; o.y += o.vy;
          if (o.x < 40 || o.x > 216) { o.vx = -o.vx; o.x = LP.clamp(o.x, 40, 216); }
          if (o.y >= BOT) { o.y = BOT; o.act = 'sit'; o.at = 50; LP.FX.shake(4, 14); LP.Audio.play('thudBig'); }
          return;
        }
        if (o.tongue > 0) { o.tongue--; return; }
        if (--o.at > 0) { o.mouth = Math.max(0, o.mouth - 1); return; }
        const r = Math.random();
        if (p && Math.abs(p.y - o.y) < 14 && Math.abs(p.x - o.x) < 110 && r < 0.4) { o.dir = p.x < o.x ? -1 : 1; o.tongue = 46; o.at = 40; LP.Audio.play('tongue'); }
        else if (minions('fly') < 4 && r < 0.75) {
          o.mouth = 30; o.at = 70; LP.Audio.play('spit');
          for (let i = 0; i < 2; i++) spawnMinion('fly', o.x + (i ? 14 : -14), o.y - 30);
        } else { o.act = 'air'; o.vy = -5.2; o.vx = LP.clamp(((p ? p.x : 128) - o.x) / 40, -2.2, 2.2); LP.Audio.play('bigHop'); }
      },
      hurt: (o) => [{ x: o.x - 22, y: o.y - 30, w: 44, h: 30 }],
      danger(o) {
        const out = [{ x: o.x - 20, y: o.y - 26, w: 40, h: 26 }];
        if (o.tongue > 0 && o.tongue < 38) { const len = Math.min(90, (38 - o.tongue) * 8) * (o.tongue < 14 ? o.tongue / 14 : 1); out.push({ x: o.dir > 0 ? o.x + 14 : o.x - 14 - len, y: o.y - 16, w: len, h: 5 }); }
        return out;
      },
      draw(o) {
        const x = Math.round(o.x), y = Math.round(o.y), squash = o.act === 'sit' && o.at > 35 ? 2 : 0;
        E(x - 18, y - 4, 9, 5, col('#005800'), G.g); E(x + 18, y - 4, 9, 5, col('#005800'), G.g);
        E(x, y - 14 + squash, 24, 15 - squash, col('#00a800'), G.g);
        E(x, y - 8 + squash, 16, 8, col('#b8f818'), G.g);
        for (const s of [-1, 1]) {
          E(x + s * 12, y - 30 + squash, 7, 7, col('#00a800'), G.g); E(x + s * 12, y - 30 + squash, 5, 5, '#fcfcfc', G.g);
          const pp = nearestP(x, y), lx = pp ? LP.clamp((pp.x - x) / 40, -2, 2) : 0;
          R(x + s * 12 - 1 + lx, y - 31 + squash, 3, 3, '#000');
          R(x + s * 12 - 5, y - 37 + squash, 10, 2, '#000');     // furious eyebrows
        }
        // crown
        R(x - 7, y - 40 + squash, 14, 5, '#f8b800'); for (let i = 0; i < 3; i++) R(x - 7 + i * 6, y - 43 + squash, 2, 3, '#f8b800'); R(x - 1, y - 39 + squash, 2, 2, '#f83800');
        if (o.mouth > 0 || o.tongue > 0) { E(x, y - 14, 12, 4, col('#a81000'), G.g); E(x, y - 13, 8, 2, col('#f83800'), G.g); }
        else R(x - 14, y - 15, 28, 1, '#000');
        if (o.tongue > 0 && o.tongue < 38) {
          const len = Math.min(90, (38 - o.tongue) * 8) * (o.tongue < 14 ? o.tongue / 14 : 1);
          const tx = o.dir > 0 ? x + 14 : x - 14 - len;
          R(tx, y - 15, len, 3, '#f878f8'); E(o.dir > 0 ? tx + len : tx, y - 14, 3, 3, col('#f83800'), G.g);
        }
      }
    },

    // =========================================================== ADMIRAL PINCHWORTH
    crab: {
      hp: 6, init: () => ({ x: 128, y: BOT, w: 56, h: 28, dir: 1, at: 80, snap: 0 }),
      update(o) {
        o.x += o.dir * (o.snap > 0 ? 0 : 0.7 + (6 - b.hp) * 0.08);
        if (o.x < 50 || o.x > 206) o.dir = -o.dir;
        if (o.snap > 0) { o.snap--; return; }
        if (--o.at > 0) return;
        const r = Math.random();
        if (r < 0.55) {
          LP.Audio.play('throw');
          for (const s of [-1, 1]) { const [vx] = aim(o.x, o.y - 30, 2.2); throwShot('claw', o.x + s * 24, o.y - 30, vx * 0.8 + s * 0.6, -3.2, 0.09, ART.claw); }
          o.at = 90;
        } else if (r < 0.8 && minions('crab') < 3) { spawnMinion('crab', o.x, o.y - 30); o.at = 70; LP.Audio.play('spit'); }
        else { o.snap = 50; o.at = 60; LP.Audio.play('snap'); }
      },
      hurt: (o) => [{ x: o.x - 26, y: o.y - 26, w: 52, h: 24 }],
      danger(o) {
        const out = [{ x: o.x - 24, y: o.y - 20, w: 48, h: 20 }];
        if (o.snap > 0 && o.snap < 36) { out.push({ x: o.x - 40, y: o.y - 52, w: 18, h: 26 }, { x: o.x + 22, y: o.y - 52, w: 18, h: 26 }); }
        return out;
      },
      draw(o) {
        const x = Math.round(o.x), y = Math.round(o.y), up = o.snap > 0 && o.snap < 36 ? 18 : 0, walk = (b.t >> 3) & 1;
        for (let i = 0; i < 3; i++) for (const s of [-1, 1]) G.line(x + s * (14 + i * 6), y - 6, x + s * (20 + i * 6), y - (i + walk) % 2, col('#a81000'));
        E(x, y - 14, 28, 11, col('#f83800'), G.g); E(x, y - 17, 22, 6, col('#fca044'), G.g);
        for (const s of [-1, 1]) {
          G.line(x + s * 8, y - 22, x + s * 9, y - 30, col('#a81000'));
          E(x + s * 9, y - 31, 3, 3, '#fcfcfc', G.g); R(x + s * 9, y - 31, 1, 1, '#000');
          // claws
          const cx = x + s * 32, cy = y - 22 - up;
          G.line(x + s * 22, y - 14, cx, cy + 6, col('#a81000'));
          E(cx, cy, 8, 6, col('#f83800'), G.g); R(cx + s * 2, cy - 7, 6 * s, 4, '#000');
          E(cx + s * 3, cy - 6, 4, 2, col('#fca044'), G.g);
        }
        // the admiral's hat
        R(x - 14, y - 40, 28, 4, '#202060'); E(x, y - 40, 9, 5, col('#202060'), G.g); R(x - 2, y - 43, 4, 3, '#f8b800');
        R(x - 6, y - 15, 12, 1, '#000');
      }
    },

    // =========================================================== TRASH PANDAMONIUM
    raccoon: {
      hp: 5, init: () => ({ x: 128, y: BOT, vx: 0, vy: 0, w: 44, h: 40, act: 'stand', at: 70, perch: 0 }),
      update(o) {
        if (o.act === 'air') {
          o.vy += 0.22; o.x += o.vx; o.y += o.vy;
          if (o.vy > 0 && o.y >= o.ty) { o.y = o.ty; o.act = 'stand'; o.at = 40; LP.FX.shake(3, 10); LP.Audio.play('thudBig'); }
          return;
        }
        if (--o.at > 0) return;
        const r = Math.random();
        if (r < 0.45) {
          LP.Audio.play('throw');
          const [vx, vy] = aim(o.x, o.y - 40, 2.0);
          throwShot('trash', o.x, o.y - 40, vx, Math.min(vy, -0.6) - 1.4, 0.07, ART.trash);
          o.at = 70;
        } else if (r < 0.7 && minions('rat') < 3) { spawnMinion('rat', o.x, o.y - 20); spawnMinion('rat', o.x, o.y - 20); o.at = 80; LP.Audio.play('spit'); }
        else {
          // leap to another perch: floor or the high ledges
          const spots = [[64, BOT], [192, BOT], [128, BOT], [128, TOP + 5 * 8], [84, TOP + 13 * 8], [172, TOP + 13 * 8], [32, TOP + 9 * 8], [224, TOP + 9 * 8]];
          const s = LP.pick(spots);
          o.tx = s[0]; o.ty = s[1]; o.vy = -6.2; o.vx = (o.tx - o.x) / 52; o.act = 'air'; LP.Audio.play('bigHop');
        }
      },
      hurt: (o) => [{ x: o.x - 18, y: o.y - 38, w: 36, h: 36 }],
      danger: (o) => [{ x: o.x - 16, y: o.y - 34, w: 32, h: 32 }],
      draw(o) {
        const x = Math.round(o.x), y = Math.round(o.y), wob = (b.t >> 3) & 1;
        // ringed tail
        for (let i = 0; i < 5; i++) E(x - 22 - i * 3, y - 10 - i * 4, 5, 4, col(i % 2 ? '#202020' : '#7c7c7c'), G.g);
        E(x, y - 16, 18, 16, col('#7c7c7c'), G.g); E(x, y - 12, 11, 10, col('#bcbcbc'), G.g);
        E(x, y - 34, 15, 11, col('#7c7c7c'), G.g);
        R(x - 15, y - 44, 6, 8, '#7c7c7c'); R(x + 9, y - 44, 6, 8, '#7c7c7c');
        R(x - 14, y - 37, 28, 6, '#202020');                         // the mask
        R(x - 10, y - 36, 4, 3, '#58f898'); R(x + 6, y - 36, 4, 3, '#58f898');  // glowing mutant eyes
        R(x - 2, y - 29, 4, 3, '#000'); R(x - 6, y - 25, 12, 2, '#fcfcfc'); R(x - 5, y - 25, 1, 2, '#000'); R(x + 2, y - 25, 1, 2, '#000');
        // third mutant eye
        E(x, y - 44, 3, 3, '#fcfcfc', G.g); R(x - 1, y - 45, 2, 2, '#f83800');
        R(x - 20, y - 4 - wob, 8, 4, '#202020'); R(x + 12, y - 4 + wob - 1, 8, 4, '#202020');
      }
    },

    // =========================================================== QUACKULA
    duck: {
      hp: 7, init: () => ({ x: 170, y: TOP + 14 * 8, w: 48, h: 36, dir: -1, at: 60, quack: 0, vy: 0, dive: 0 }),
      update(o) {
        const water = World.waterY;
        if (o.dive) {                                   // underwater, then bursts out
          o.dive++;
          if (o.dive < 50) o.y += 1.2;
          else if (o.dive === 50) { const p = nearestP(o.x, o.y); o.x = p ? LP.clamp(p.x, 50, 206) : 128; o.vy = -5.6; LP.Audio.play('splash'); }
          else { o.vy += 0.18; o.y += o.vy; if (o.vy > 0 && o.y >= water + 8) { o.y = water + 8; o.dive = 0; o.at = 50; LP.FX.shake(3, 10); LP.Audio.play('splash'); } }
          return;
        }
        o.y += ((water + 8 + Math.sin(b.t * 0.08) * 2) - o.y) * 0.1;
        o.x += o.dir * 0.6;
        if (o.x < 46 || o.x > 210) o.dir = -o.dir;
        if (o.quack > 0) {
          o.quack--;
          if (o.quack === 30 || o.quack === 15) { const [vx, vy] = aim(o.x + o.dir * 22, o.y - 22, 1.5); throwShot('quack', o.x + o.dir * 22, o.y - 22, vx, vy, 0, ART.quack); }
          return;
        }
        if (--o.at > 0) return;
        const r = Math.random();
        if (r < 0.45) { o.quack = 60; o.at = 50; LP.Audio.play('quack'); }
        else if (r < 0.75 && minions('duckling') < 4) { for (let i = 0; i < 2; i++) spawnMinion('duckling', o.x + (i ? 16 : -16), o.y - 40); o.at = 80; LP.Audio.play('spit'); }
        else { o.dive = 1; o.at = 60; }
      },
      weak(o) { return o.quack > 0 ? { x: o.x + (o.dir > 0 ? 14 : -26), y: o.y - 30, w: 12, h: 12 } : null; },
      hurt: (o) => [{ x: o.x - 22, y: o.y - 34, w: 44, h: 26 }],
      danger: (o) => (o.dive > 0 && o.dive < 50 ? [] : [{ x: o.x - 20, y: o.y - 30, w: 40, h: 22 }]),
      draw(o) {
        const x = Math.round(o.x), y = Math.round(o.y), d = o.dir;
        if (o.dive > 0 && o.dive < 50) { G.ring(x, World.waterY + 2, 6 + (o.dive >> 2) % 6, '#fcfcfc'); return; }
        // cape
        E(x - d * 6, y - 22, 20, 12, col('#a81000'), G.g); E(x - d * 6, y - 24, 16, 8, col('#202020'), G.g);
        E(x, y - 14, 24, 12, col('#f8b800'), G.g); E(x - d * 4, y - 18, 14, 6, col('#f8d878'), G.g);
        E(x + d * 12, y - 32, 11, 10, col('#f8b800'), G.g);
        // bill (open while quacking = weak spot)
        const bx = x + d * 22;
        if (o.quack > 0) { R(bx - 5, y - 34, 10, 3, '#f83800'); R(bx - 5, y - 27, 10, 3, '#f83800'); R(bx - 4, y - 31, 8, 4, '#a81000'); if ((b.t >> 2) % 2) G.ring(bx, y - 30, 7, '#fcfcfc'); }
        else R(bx - 5, y - 31, 10, 5, '#f83800');
        R(x + d * 14 - 2, y - 36, 4, 4, '#fcfcfc'); R(x + d * 15 - 1, y - 35, 2, 2, '#f83800');   // evil eye
        R(x + d * 18, y - 28, 1, 3, '#fcfcfc');                                               // fang
        R(x + d * 8, y - 42, 6, 2, '#202020');                                                // widow's peak
      }
    },

    // =========================================================== SIR RATTLES
    skeleton: {
      hp: 6, init() {
        return { x: 128, y: 70, w: 40, h: 34, at: 70, daze: 0,
          hands: [-1, 1].map((s) => ({ s, x: 128 + s * 60, y: 110, vy: 0, act: 'hover', at: 60 + (s > 0 ? 50 : 0), coat: 0, trapped: 0 })) };
      },
      update(o) {
        if (o.daze > 0) {
          o.daze--; o.y += (130 - o.y) * 0.05;
          if (o.daze === 0) for (const h of o.hands) { h.trapped = 0; h.coat = 0; }
        } else {
          o.y += (58 + Math.sin(b.t * 0.03) * 8 - o.y) * 0.05;
          o.x = 128 + Math.sin(b.t * 0.012) * 60;
        }
        for (const h of o.hands) {
          if (h.trapped > 0) { h.trapped--; h.y += (40 - h.y) * 0.03; h.x += Math.sin(b.t * 0.05 + h.s) * 0.3; if (h.trapped === 0) h.coat = 0; continue; }
          if (o.daze > 0) continue;
          if (h.act === 'hover') {
            const p = nearestP(h.x, h.y);
            const tx = p ? LP.clamp(p.x, 30, 226) : o.x + h.s * 60;
            h.x += (tx - h.x) * 0.03; h.y += (o.y + 40 - h.y) * 0.05;
            if (--h.at <= 0) { h.act = 'slam'; h.vy = 0; LP.Audio.play('whoosh'); }
          } else if (h.act === 'slam') {
            h.vy += 0.35; h.y += h.vy;
            if (h.y >= BOT - 6) { h.y = BOT - 6; h.act = 'rest'; h.at = 40; LP.FX.shake(4, 12); LP.Audio.play('thudBig'); G.dust(h.x, BOT, 6, '#bcbcbc'); }
          } else if (--h.at <= 0) { h.act = 'hover'; h.at = LP.randi(70, 130); }
        }
        if (o.daze === 0 && o.hands.every((h) => h.trapped > 0)) { o.daze = 300; LP.Audio.play('daze'); Game.banner('HE\'S DIZZY! BUBBLE THE SKULL!', '#f8b800', 90); }
        if (--o.at <= 0 && o.daze === 0) {
          o.at = LP.randi(100, 160);
          if (minions('skull') < 2) spawnMinion('skull', o.x, o.y + 20);
          else { const [vx, vy] = aim(o.x, o.y + 10, 1.6); throwShot('bonebig', o.x, o.y + 10, vx, vy, 0, ART.bonebig); }
        }
      },
      weak(o) { return o.daze > 0 ? { x: o.x - 18, y: o.y - 16, w: 36, h: 32 } : null; },
      hurt: (o) => [{ x: o.x - 18, y: o.y - 16, w: 36, h: 32 }],
      danger(o) {
        const out = [];
        for (const h of o.hands) if (!h.trapped && o.daze === 0) out.push({ x: h.x - 11, y: h.y - 8, w: 22, h: 14 });
        return out;
      },
      // shot bubbles coat the hands; three coats = trapped hand
      part(o, bub) {
        for (const h of o.hands) {
          if (h.trapped || !LP.Hit.rectCircle({ x: h.x - 12, y: h.y - 9, w: 24, h: 16 }, bub)) continue;
          h.coat++; LP.Audio.play('coat');
          if (h.coat >= 3) { h.trapped = 420; h.act = 'hover'; LP.Audio.play('trap'); Game.banner('HAND TRAPPED!', '#a4e4fc', 50); }
          return true;
        }
        return false;
      },
      draw(o) {
        const x = Math.round(o.x), y = Math.round(o.y);
        // ribcage hint under the skull
        for (let i = 0; i < 3; i++) R(x - 12 + i * 2, y + 18 + i * 5, 24 - i * 4, 2, '#bcbcbc');
        R(x - 1, y + 16, 2, 18, '#bcbcbc');
        E(x, y - 2, 20, 16, col('#fcfcfc'), G.g); R(x - 12, y + 10, 24, 8, '#fcfcfc');
        E(x - 8, y, 5, 5, '#000', G.g); E(x + 8, y, 5, 5, '#000', G.g);
        if (o.daze > 0) { G.draw(Sprites.icon('swirl'), x - 10, y - 2); G.draw(Sprites.icon('swirl'), x + 6, y - 2); for (let i = 0; i < 3; i++) { const a = b.t * 0.1 + i * 2.1; G.draw(Sprites.icon('star'), x + Math.cos(a) * 22 - 3, y - 22 + Math.sin(a) * 4); } }
        else { R(x - 9, y - 1, 2, 2, '#f83800'); R(x + 7, y - 1, 2, 2, '#f83800'); }
        R(x - 2, y + 6, 4, 3, '#000');
        for (let i = 0; i < 5; i++) R(x - 9 + i * 4, y + 12, 1, 6, '#000');
        // crown of a fallen knight
        R(x - 10, y - 20, 20, 3, '#7c7c7c'); for (let i = 0; i < 4; i++) R(x - 10 + i * 6, y - 23, 2, 3, '#7c7c7c');
        for (const h of o.hands) {
          const hx = Math.round(h.x), hy = Math.round(h.y);
          R(hx - 10, hy - 6, 20, 8, '#fcfcfc');
          for (let i = 0; i < 4; i++) R(hx - 10 + i * 5, hy + 2, 3, 5 + (h.act === 'slam' ? 1 : 0), '#fcfcfc');
          R(hx + h.s * 10, hy - 4, 4 * h.s, 4, '#fcfcfc');
          R(hx - 8, hy - 3, 16, 1, '#bcbcbc');
          if (h.coat && !h.trapped) for (let i = 0; i < h.coat; i++) G.ring(hx, hy - 1, 10 + i * 2, '#a4e4fc');
          if (h.trapped) { G.ring(hx, hy - 1, 15, (h.trapped < 90 && (b.t >> 2) % 2) ? '#f83800' : '#a4e4fc'); G.px(hx - 8, hy - 9, '#fcfcfc'); }
        }
      }
    },

    // =========================================================== MECHA-MOP 9000
    robot: {
      hp: 8, init: () => ({ x: 180, y: BOT, w: 48, h: 56, dir: -1, at: 80, core: 0, sweep: 0, laser: 0 }),
      update(o) {
        if (o.core > 0) { o.core--; return; }
        if (o.laser > 0) {
          o.laser--;
          if (o.laser === 40) LP.Audio.play('laserBig');
          return;
        }
        o.x += o.dir * 0.45;
        if (o.x < 50 || o.x > 206) o.dir = -o.dir;
        if (o.sweep > 0) o.sweep--;
        if (--o.at > 0) return;
        const r = Math.random();
        if (r < 0.4) {
          LP.Audio.play('missile');
          for (let i = 0; i < 2; i++) throwShot('missile', o.x + (i ? 12 : -12), o.y - 58, (i ? 1 : -1) * 1.2, -1.5, 0, ART.missile, { homing: 140 });
          o.core = 150; o.at = 40;                     // fired: the core vents open
        } else if (r < 0.65) { o.laser = 80; o.ly = (nearestP(o.x, o.y) || { y: BOT }).y - 8; o.at = 70; LP.Audio.play('charge'); }
        else if (r < 0.85 && minions('robot') < 2) { spawnMinion('robot', o.x, o.y - 40); o.at = 60; LP.Audio.play('spit'); }
        else { o.sweep = 60; o.at = 50; LP.Audio.play('whoosh'); }
      },
      weak(o) { return o.core > 0 && o.core < 140 ? { x: o.x - 9, y: o.y - 40, w: 18, h: 16 } : null; },
      hurt: (o) => [{ x: o.x - 22, y: o.y - 56, w: 44, h: 54 }],
      danger(o) {
        const out = [{ x: o.x - 20, y: o.y - 50, w: 40, h: 50 }];
        if (o.sweep > 0) out.push({ x: o.x + (o.dir > 0 ? 18 : -54), y: o.y - 10, w: 36, h: 10 });
        if (o.laser > 0 && o.laser < 40) out.push({ x: 16, y: o.ly - 2, w: 224, h: 5 });
        return out;
      },
      draw(o) {
        const x = Math.round(o.x), y = Math.round(o.y), step = (b.t >> 3) & 1;
        R(x - 16, y - 12, 10, 12 - step, '#7c7c7c'); R(x + 6, y - 12, 10, 11 + step, '#7c7c7c');
        R(x - 22, y - 52, 44, 40, '#bcbcbc'); R(x - 22, y - 52, 44, 3, '#fcfcfc'); R(x - 22, y - 15, 44, 3, '#7c7c7c');
        R(x - 14, y - 66, 28, 15, '#bcbcbc'); R(x - 10, y - 62, 20, 6, '#000');
        R(x - 8 + ((b.t >> 3) % 4) * 4, y - 61, 4, 4, '#f83800');                         // scanning visor
        R(x - 1, y - 72, 2, 6, '#7c7c7c'); R(x - 2, y - 74, 4, 2, (b.t >> 3) % 2 ? '#f83800' : '#f8b800');
        // chest core
        if (o.core > 0 && o.core < 140) { R(x - 9, y - 40, 18, 16, '#000'); E(x, y - 32, 6, 6, (b.t >> 2) % 2 ? '#f83800' : '#f8b800', G.g); }
        else { R(x - 9, y - 40, 18, 16, '#7c7c7c'); R(x - 9, y - 33, 18, 1, '#404040'); }
        // mop arm
        const ax = x + o.dir * 22, sw = o.sweep > 0 ? Math.sin(o.sweep * 0.3) * 10 : 0;
        R(ax - 2, y - 46, 4, 36, '#7c7c7c');
        R(ax - 8 + sw, y - 12, 16, 4, '#ac7c00'); for (let i = 0; i < 6; i++) R(ax - 8 + sw + i * 3, y - 8, 2, 8, '#fcfcfc');
        R(x - o.dir * 26, y - 44, 6, 14, '#7c7c7c'); R(x - o.dir * 28, y - 32, 10, 6, '#404040');      // missile pod
        if (o.laser > 0) {
          if (o.laser >= 40) { if ((o.laser >> 2) % 2) R(16, o.ly, 224, 1, '#f83800'); }
          else { R(16, o.ly - 2, 224, 5, (b.t >> 1) % 2 ? '#fcfcfc' : '#f83800'); R(16, o.ly, 224, 1, '#fcfcfc'); }
        }
      }
    },

    // =========================================================== THE FINALE
    final: {
      hp: 6, init: () => ({ x: 128, y: 62, w: 72, h: 44, phase: 1, dir: 1, at: 90, inhale: 0, gulp: 0, dizzy: 0, vx: 0, vy: 0, jx: 128, jy: 70, hp2: 4 }),
      update(o) {
        if (o.phase === 1) {
          o.x += o.dir * 0.5; if (o.x < 70 || o.x > 186) o.dir = -o.dir;
          o.y = 58 + Math.sin(b.t * 0.04) * 4;
          if (o.gulp > 0) o.gulp--;
          if (o.inhale > 0) {
            o.inhale--;
            const nx = o.x, ny = o.y + 26;
            for (const bub of Bubbles.list) {
              if (bub.dead) continue;
              const dx = nx - bub.x, dy = ny - bub.y, d = Math.hypot(dx, dy) || 1;
              if (d < 150) { bub.x += dx / d * 1.6; bub.y += dy / d * 1.6; }
              if (d < 14) {
                bub.dead = true;
                if (bub.trapped.length) { for (const e of bub.trapped) e.state = 'dead'; B.damage(1, 'CLOG!'); }
                else { o.gulp = 12; Game.popup(nx, ny + 10, 'NOM', '#fcfcfc'); LP.Audio.play('nom'); }
              }
            }
            for (const p of Players.list) if (Players.active(p) && !p.riding) { const dx = nx - p.x; if (Math.abs(dx) < 140) p.vx += Math.sign(dx) * 0.11; }
            if (b.t % 6 === 0) LP.FX.spawn({ x: nx + LP.rand(-60, 60), y: ny + LP.rand(10, 100), vx: 0, vy: 0, g: 0, drag: 1, life: 20, color: '#fcfcfc', draw: (g, pt, X, Y) => { pt.x += (nx - pt.x) * 0.12; pt.y += (ny - pt.y) * 0.12; G._part(g, pt, X, Y); } });
            return;
          }
          if (--o.at > 0) return;
          const r = Math.random();
          if (r < 0.35) { o.inhale = 160; o.at = 70; LP.Audio.play('vacuum'); Game.banner('IT INHALES BUBBLES! FEED IT TRAPPED TROOPERS!', '#f8b800', 80); }
          else if (r < 0.7 && minions('penguin') < 4) { for (let i = 0; i < 2; i++) spawnMinion('penguin', o.x + (i ? 30 : -30), o.y + 20); o.at = 80; LP.Audio.play('spit'); }
          else { for (let i = -1; i <= 1; i++) { const [vx, vy] = aim(o.x, o.y + 24, 1.3); throwShot('dust', o.x, o.y + 24, vx + i * 0.5, vy, 0, ART.dust); } o.at = 80; LP.Audio.play('throw'); }
        } else {
          // phase 2: the Generalissimo himself, jetpacking about
          if (o.dizzy > 0) {
            o.dizzy--; o.jy += (120 - o.jy) * 0.02; o.jx += Math.sin(b.t * 0.05) * 0.6;
            if (o.dizzy === 0) { o.hp2 = 1; Game.banner('HE RECOVERED! HIT HIM AGAIN!', '#f83800', 60); }
            return;
          }
          if (o.trappedIn) return;
          o.vx += (o.tx - o.jx) * 0.002; o.vy += (o.ty - o.jy) * 0.002;
          o.vx *= 0.97; o.vy *= 0.97; o.jx += o.vx; o.jy += o.vy;
          if (b.t % 120 === 0 || Math.hypot(o.tx - o.jx, o.ty - o.jy) < 10) { o.tx = LP.rand(40, 216); o.ty = LP.rand(36, 140); }
          if (--o.at > 0) return;
          const r = Math.random();
          if (r < 0.5) { const [vx, vy] = aim(o.jx, o.jy, 1.6); throwShot('fishm', o.jx, o.jy, vx, vy, 0, ART.fishm, { homing: 90 }); o.at = 60; LP.Audio.play('missile'); }
          else if (minions('penguin') < 3) { spawnMinion('penguin', o.jx, o.jy + 10); o.at = 70; LP.Audio.play('spit'); }
          else o.at = 30;
        }
      },
      weak() { return null; },
      hurt(o) { return o.phase === 1 ? [{ x: o.x - 34, y: o.y - 20, w: 68, h: 44 }] : [{ x: o.jx - 10, y: o.jy - 12, w: 20, h: 24 }]; },
      danger(o) { return o.phase === 1 ? [{ x: o.x - 30, y: o.y - 16, w: 60, h: 40 }] : (o.dizzy || o.trappedIn ? [] : [{ x: o.jx - 8, y: o.jy - 10, w: 16, h: 20 }]); },
      // phase 2: once dizzy, any bubble traps the Generalissimo
      part(o, bub) {
        if (o.phase !== 2 || !o.dizzy || o.trappedIn) return false;
        if (!LP.Hit.rectCircle({ x: o.jx - 10, y: o.jy - 12, w: 20, h: 24 }, bub)) return false;
        bub.dead = true;
        const big = Bubbles.spawn({ x: o.jx, y: o.jy, r: 16, vx: 0, vy: -0.2, state: 'float', owner: bub.owner, who: bub.who, trapped: [], max: 1, boss: true });
        big.life = 14 * 60; o.trappedIn = big; o.dizzy = 0;
        LP.Audio.play('trap'); Game.banner('GOT HIM! NOW POP IT!', '#b8f818', 80);
        return true;
      },
      draw(o) {
        if (o.phase === 1) {
          const x = Math.round(o.x), y = Math.round(o.y);
          // DUSTLORD 3000
          R(x - 34, y - 14, 68, 30, '#6844fc'); R(x - 34, y - 14, 68, 3, '#9878f8'); R(x - 34, y + 13, 68, 3, '#202060');
          R(x - 30, y - 6, 60, 10, '#202060'); Font.draw(G.g, 'DUSTLORD 3000', x, y - 4, col('#f8b800'), { face: 'small', align: 'center' });
          for (const s of [-1, 1]) { E(x + s * 30, y + 18, 7, 7, col('#202020'), G.g); E(x + s * 30, y + 18, 3, 3, col('#7c7c7c'), G.g); }
          // nozzle
          const open = o.inhale > 0 ? 2 + ((b.t >> 1) & 1) : 0;
          R(x - 6, y + 16, 12, 10, '#7c7c7c'); R(x - 9 - open, y + 24, 18 + open * 2, 4, '#404040'); R(x - 6, y + 26, 12, 2, '#000');
          if (o.gulp) R(x - 4, y + 18, 8, 6, '#f8b800');
          // cockpit dome with the Generalissimo inside
          E(x, y - 22, 14, 12, '#a4e4fc', G.g);
          G.draw(Sprites.enemy('penguin', (b.t >> 4) & 1, false, b.inv > 0 ? 'white' : ''), x - 7, y - 32);
          R(x - 5, y - 35, 12, 2, '#202060'); R(x - 3, y - 37, 8, 2, '#202060'); R(x, y - 36, 2, 1, '#f8b800');   // officer's cap
          G.px(x - 9, y - 30, '#fcfcfc'); G.px(x - 8, y - 31, '#fcfcfc');
          R(x - 14, y - 12, 28, 2, '#9878f8');
        } else {
          const x = Math.round(o.jx), y = Math.round(o.jy);
          if (o.trappedIn && !o.trappedIn.dead) { o.jx = o.trappedIn.x; o.jy = o.trappedIn.y; }
          // jetpack flames
          if (!o.dizzy && !o.trappedIn) { R(x - 7, y + 8, 3, 4 + ((b.t >> 1) & 1) * 3, '#f8b800'); R(x + 4, y + 8, 3, 4 + ((b.t >> 1) & 1) * 3, '#f83800'); }
          R(x - 9, y - 4, 4, 12, '#7c7c7c'); R(x + 5, y - 4, 4, 12, '#7c7c7c');
          G.draw(Sprites.enemy('penguin', (b.t >> 3) & 1, o.vx < 0, o.dizzy ? '' : b.inv > 0 ? 'white' : 'angry'), x - 7, y - 10);
          R(x - 6, y - 13, 12, 2, '#202060'); R(x - 4, y - 15, 8, 2, '#202060'); R(x - 1, y - 14, 2, 1, '#f8b800');
          R(x - 2, y - 2, 4, 1, '#f8b800'); R(x - 2, y + 1, 4, 1, '#f8b800');                // medals
          if (o.dizzy) for (let i = 0; i < 3; i++) { const a = b.t * 0.12 + i * 2.1; G.draw(Sprites.icon('star'), x + Math.cos(a) * 12 - 3, y - 20 + Math.sin(a) * 3); }
        }
      }
    }
  };

  // ------------------------------------------------------------------ framework
  const B = {
    get active() { return b; },
    x: () => (b ? (b.kind === 'final' && b.phase === 2 ? b.jx : b.x) : 128),
    alive: () => !!b && !b.done,
    reset() { b = null; missiles.length = 0; },
    start(kind) {
      const def = DEFS[kind];
      b = Object.assign({ kind, def, t: 0, hp: def.hp, maxHp: def.hp, inv: 0, dir: -1, dying: 0, done: false }, def.init());
      if (kind === 'final') b.maxHp = def.hp + 4;
    },
    update() {
      if (!b || b.done) return;
      b.t++;
      if (b.inv > 0) b.inv--;
      if (b.dying) {
        b.dying++;
        if (b.dying % 8 === 0) { const hb = b.def.hurt(b)[0]; G.burst(hb.x + Math.random() * hb.w, hb.y + Math.random() * hb.h, 10, LP.pick(['#f8b800', '#f83800', '#fcfcfc']), { speed: 2.2 }); LP.Audio.play('boom'); LP.FX.shake(3, 8); }
        if (b.dying > 150) { b.done = true; Game.bossDefeated(b); }
        return;
      }
      if (Game.phase === 'play') b.def.update(b);
      if (Game.freeze > 0 && b.t % 2) b.t--;
      // launched minions (popped near the boss) and returned projectiles hurt it
      for (const c of Enemies.corpses) {
        if (!c.launched || c.spent) continue;
        const box = { x: c.x - 6, y: c.y - 6, w: 12, h: 12 };
        if (b.def.hurt(b).some((r) => over(box, r))) { c.spent = true; c.vx = -c.vx * 0.3; c.vy = -2; B.damage(1, 'BONK!'); }
      }
      for (const s of Enemies.shots) {
        if (!s.friendly || s.dead) continue;
        const tx = B.x(), ty = b.def.hurt(b)[0].y + b.def.hurt(b)[0].h / 2;
        const dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy) || 1;
        s.vx += dx / d * 0.35; s.vy += dy / d * 0.35; const sp = Math.hypot(s.vx, s.vy); if (sp > 4) { s.vx *= 4 / sp; s.vy *= 4 / sp; }
        const box = { x: s.x - 4, y: s.y - 4, w: 8, h: 8 };
        if (b.def.hurt(b).some((r) => over(box, r))) { s.dead = true; B.damage(1, 'RETURN TO SENDER!'); }
      }
      // homing missiles
      for (const s of Enemies.shots) {
        if (s.homing > 0 && !s.friendly) {
          s.homing--;
          const p = nearestP(s.x, s.y);
          if (p) { const dx = p.x - s.x, dy = p.y - 10 - s.y, d = Math.hypot(dx, dy) || 1; s.vx += dx / d * 0.05; s.vy += dy / d * 0.05; const sp = Math.hypot(s.vx, s.vy); if (sp > 1.7) { s.vx *= 1.7 / sp; s.vy *= 1.7 / sp; } }
        }
      }
      // the final boss's trap bubble: popped = victory
      if (b.kind === 'final' && b.trappedIn) {
        const big = b.trappedIn;
        if (big.dead) {
          if (big.t >= big.life) { b.trappedIn = null; b.dizzy = 0; b.hp2 = 1; Game.banner('HE ESCAPED! AGAIN!', '#f83800', 60); }
          else { b.trappedIn = null; b.hp = 0; B.defeat(); }
        }
      }
    },
    damage(n, label) {
      if (!b || b.inv > 0 || b.dying) return;
      b.inv = 50;
      LP.FX.shake(4, 12); LP.FX.hitstop(5);
      LP.Audio.play('bossHit');
      const hb = b.def.hurt(b)[0];
      G.burst(hb.x + hb.w / 2, hb.y + hb.h / 2, 14, '#fcfcfc', { speed: 2.4 });
      if (label) Game.popup(hb.x + hb.w / 2, hb.y - 6, label, '#f8b800', true);
      Game.addScore(Players.list[0], 2000, hb.x + hb.w / 2, hb.y - 14, '#f8b800', true);
      if (b.kind === 'final' && b.phase === 2) {
        b.hp2--; b.hp = Math.max(1, b.hp - 1);
        if (b.hp2 <= 0) { b.dizzy = 480; Game.banner('DIZZY! TRAP HIM IN A BUBBLE!', '#b8f818', 90); LP.Audio.play('daze'); }
        return;
      }
      b.hp -= n;
      if (b.hp <= 0) {
        if (b.kind === 'final' && b.phase === 1) {
          b.phase = 2; b.hp = 4; b.hp2 = 4; b.jx = b.x; b.jy = b.y - 20; b.vx = 0; b.vy = -1; b.tx = 128; b.ty = 80; b.at = 60; b.inv = 90;
          for (let i = 0; i < 6; i++) G.burst(b.x + LP.rand(-30, 30), b.y + LP.rand(-10, 20), 10, LP.pick(['#f8b800', '#f83800', '#9878f8']), { speed: 2.5 });
          LP.Audio.play('boom'); LP.FX.shake(6, 30);
          Game.banner('THE DUSTLORD IS DUST! WADDLES BAILS OUT!', '#f8b800', 100);
          Game.music('final2');
          return;
        }
        B.defeat();
      }
    },
    defeat() {
      b.dying = 1; b.inv = 0;
      for (const e of Enemies.list) if (e.minion && e.state === 'live') { e.state = 'dead'; G.burst(e.x, e.y - 6, 6, '#fcfcfc'); }
      Enemies.shots.length = 0;
      LP.Audio.play('bossDown');
      Game.music(null);
    },
    // a bubble meets the boss: weak points, parts, projectiles
    bubbleHit(bub) {
      if (!b || b.dying) return;
      if (b.def.part && bub.state === 'shot' && b.def.part(b, bub)) { if (!bub.dead) Bubbles.burst(bub, true); return; }
      const wk = b.def.weak && b.def.weak(b);
      if (wk && bub.state === 'shot' && LP.Hit.rectCircle(wk, bub)) { Bubbles.burst(bub, true); B.damage(1, 'WEAK SPOT!'); return; }
      // returnable projectiles get bubbled
      if (bub.state === 'shot' && !bub.cargo) {
        for (const s of Enemies.shots) {
          if (!s.returnable || s.dead || s.friendly) continue;
          if (Math.hypot(s.x - bub.x, s.y - bub.y) < bub.r + s.r + 1) {
            s.dead = true; bub.cargo = s; bub.r = GAME_CONFIG.bubble.r + 3; bub.life = Bubbles.trapLife(); bub.t = 0; bub.vx *= 0.3; bub.state = 'float'; bub.max = 0;
            LP.Audio.play('trap'); Game.addScore(Players.list[bub.owner], 100, bub.x, bub.y - 10);
            return;
          }
        }
      }
    },
    // a popped bubble carrying a boss projectile: it flies home
    launchCargo(bub, pi) {
      const s = bub.cargo;
      Enemies.shot(s.kind, bub.x, bub.y, 0, -2, 0, { friendly: true, r: 5, draw: s.draw });
      LP.Audio.play('returnShot');
    },
    hurts(box) {
      if (!b || b.dying) return false;
      return b.def.danger(b).some((r) => over(box, r));
    },
    draw() {
      if (!b) return;
      if (b.dying && (b.dying >> 2) % 2) return;
      b.def.draw(b);
    },
    drawHud() {
      if (!b || b.done) return;
      const info = BOSS_INFO[b.kind], w = 120, x = 128 - w / 2, y = 18;
      G.rect(x - 1, y - 1, w + 2, 5, '#000');
      const frac = b.kind === 'final' ? (b.phase === 1 ? (b.hp + 4) / b.maxHp : Math.max(0, b.hp2) / b.maxHp) : Math.max(0, b.hp) / b.maxHp;
      G.rect(x, y, w, 3, '#a81000'); G.rect(x, y, Math.round(w * frac), 3, (b.t >> 3) % 2 && frac < 0.3 ? '#fcfcfc' : '#f83800');
      G.textC(info.name, 128, y + 5, '#fcfcfc', { face: 'small', outline: '#000' });
    }
  };
  return B;
})();
