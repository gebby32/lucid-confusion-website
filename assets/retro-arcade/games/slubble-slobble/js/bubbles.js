/* BUBBLES — the heart of the game.
   A shot bubble flies forward fast, slows down, then floats up (or sinks, in heavy air),
   gathers under the ceiling and eventually bursts. While it is still flying it TRAPS the
   first enemy it touches (rainbow bubbles: up to three). Trapped enemies float around
   looking annoyed until a sloth touches / jumps into / shoots the bubble — POP — or
   until they break free, furious.
   Popping a bubble pops every bubble touching it a few frames later: chain reactions.
   Land on a bubble while HOLDING JUMP to bounce off it; hold DOWN to ride it upward. */
'use strict';
const Bubbles = (function () {
  const COL = {
    slub: { ring: '#b8f818', dark: '#00a800', glint: '#fcfcfc' },
    slob: { ring: '#3cbcfc', dark: '#0058f8', glint: '#fcfcfc' },
    boss: { ring: '#f8b800', dark: '#a81000', glint: '#fcfcfc' }
  };
  const RAINBOW = ['#f83800', '#f8b800', '#b8f818', '#3cbcfc', '#6844fc', '#f878f8'];
  let pending = [], chainId = 0;

  const B = {
    list: [],
    reset() { B.list.length = 0; pending = []; },
    count: () => B.list.length,
    trappedCount() { let n = 0; for (const b of B.list) if (b.trapped.length) n += b.trapped.length; return n; },

    fire(p) {
      const cfg = GAME_CONFIG.bubble, pw = p.power;
      const giant = !!pw.giant, rainbow = !!pw.rainbow;
      const r = giant ? cfg.giantR : cfg.r;
      const [mx, my] = Sloths.muzzle(p.who, p.dir, p.x, p.y);
      const lane = p.y - (giant ? 13 : 11);
      // point blank: if the muzzle is inside a wall, the bubble appears in front of the face
      let x = mx + p.dir * (r - 3), y = Math.min(my + 3, lane);
      if (World.at(x, y) === TILE.SOLID || x < 16 + r || x > 240 - r) x = LP.clamp(p.x + p.dir * 4, 16 + r, 240 - r);
      const shots = pw.triple ? [-1.1, 0, 1.1] : [0];
      for (const sv of shots) {
        B.spawn({
          x, y, r, vx: p.dir * cfg.speed * (pw.long ? 1.1 : 1), vy: sv, lane: lane + sv * 14,
          drag: pw.long ? cfg.longDrag : cfg.drag, owner: p.idx, who: p.who, giant, rainbow, max: rainbow ? 3 : (giant ? 2 : 1)
        });
      }
      // too many bubbles: the oldest empty one bursts
      let empties = B.list.filter((b) => !b.trapped.length && b.state === 'float');
      while (B.list.length > 48 && empties.length) { B.burst(empties.shift(), true); empties = B.list.filter((b) => !b.trapped.length && b.state === 'float' && !b.dead); }
    },

    spawn(o) {
      const b = Object.assign({ state: 'shot', t: 0, life: GAME_CONFIG.bubble.life * 60, trapped: [], dead: false, seed: Math.random() * 6.28, rider: null, bounce: 0, flash: 0 }, o);
      B.list.push(b);
      return b;
    },

    trapLife() {
      const [a, z] = GAME_CONFIG.bubble.trapLife;
      return Math.round((a + (z - a) * Math.min(1, (World.n - 1) / 98)) * 60);
    },

    update() {
      const W = World, TOPY = W.TOP + 8, BOTY = W.BOT - 8;
      for (const b of B.list) {
        if (b.dead) continue;
        b.t++;
        if (b.flash > 0) b.flash--;
        if (b.state === 'shot') {
          b.x += b.vx; b.vx *= b.drag;
          b.y += b.vy; b.vy *= 0.85;
          if (b.lane !== undefined) b.y += LP.clamp(b.lane - b.y, -0.5, 0.5);
          // walls stop it
          const ahead = W.at(b.x + Math.sign(b.vx) * b.r, b.y);
          if (ahead === TILE.SOLID || b.x < 16 + b.r || b.x > 240 - b.r) { b.x = LP.clamp(b.x - b.vx, 16 + b.r, 240 - b.r); b.vx = 0; }
          B.hitEnemies(b);
          if (b.dead) continue;
          B.hitBubbles(b);
          if (Math.abs(b.vx) < 0.8) { b.state = 'float'; if (!b.trapped.length && Math.random() < 0.3) LP.Audio.play('float'); }
        } else {
          // float: rise (or sink), gather under the ceiling toward the air point, wobble
          const water = b.y > W.waterY;
          const rise = W.sink ? 0.32 : -(GAME_CONFIG.bubble.rise * (water ? 1.6 : 1) * (b.trapped.length ? 0.75 : 1));
          b.vy += (rise - b.vy) * 0.05;
          const air = W.def.air || [128, 40];
          const nearTop = W.sink ? b.y > BOTY - b.r - 6 : b.y < TOPY + b.r + 10;
          let tx = Math.sin(b.t * 0.03 + b.seed) * 0.12;
          if (nearTop) tx += LP.clamp((air[0] - b.x) * 0.006, -0.35, 0.35);
          tx += W.wind * 1.4;
          b.vx += (tx - b.vx) * 0.05;
          b.x += b.vx; b.y += b.vy;
        }
        // bubbles nudge each other apart (clusters look great and stay poppable)
        for (const o of B.list) {
          if (o === b || o.dead) continue;
          const dx = b.x - o.x, dy = b.y - o.y, d2 = dx * dx + dy * dy, rr = (b.r + o.r) * 0.92;
          if (d2 < rr * rr && d2 > 0.01) { const d = Math.sqrt(d2), push = (rr - d) * 0.06; b.x += dx / d * push; b.y += dy / d * push; }
        }
        // stay inside the arena; solid blocks push bubbles out
        b.x = LP.clamp(b.x, 16 + b.r, 240 - b.r);
        b.y = LP.clamp(b.y, TOPY + b.r, BOTY - b.r + 4);
        if (W.at(b.x, b.y) === TILE.SOLID) { b.y += W.sink ? -1 : 1; }
        // timers
        if (b.trapped.length || b.cargo) {
          if (b.t > b.life) B.escape(b);
        } else if (b.t > b.life) B.burst(b, true);
        if (b.rider) { const p = b.rider; if (!p.riding || p.riding !== b) b.rider = null; }
      }
      // chain reactions
      const now = LP.Loop.frame;
      for (let i = pending.length - 1; i >= 0; i--) {
        const q = pending[i];
        if (now >= q.at) { pending.splice(i, 1); B.pop(q.b, q.pi, q.chain); }
      }
      for (const ch of B._chains || []) if (!ch.done && !pending.some((q) => q.chain === ch)) { ch.done = true; Game.chainDone(ch); }
      B._chains = (B._chains || []).filter((c) => !c.done);
      LP.prune(B.list, (b) => b.dead);
    },

    // a flying bubble meets enemies / boss projectiles
    hitEnemies(b) {
      if (b.dead) return;
      for (const e of Enemies.list) {
        if (b.trapped.length >= b.max) break;
        if (e.state !== 'live' || e.fade > 0 || e.noTrap) continue;
        const box = { x: e.x - e.w / 2 - 1, y: e.y - e.h - 1, w: e.w + 2, h: e.h + 2 };
        if (!LP.Hit.rectCircle(box, b)) continue;
        const res = Enemies.trapBy(e, b);
        if (res === 'armor') { B.burst(b, false); return; }
        if (res === 'trapped') {
          b.trapped.push(e);
          b.r = (b.giant ? GAME_CONFIG.bubble.giantR : GAME_CONFIG.bubble.r) + 4;
          b.life = B.trapLife(); b.t = 0;
          b.mood = e.sp.mood || LP.pick(['dizzy', 'angry', 'panic', 'confused']);
          if (b.trapped.length >= b.max) { b.vx *= 0.25; b.state = 'float'; }
        }
      }
      if (b.state === 'shot' || b.trapped.length) Bosses.bubbleHit(b);
      Enemies.projectileHit(b);
    },
    // a flying bubble shot into a trapped bubble pops it
    hitBubbles(b) {
      for (const o of B.list) {
        if (o === b || o.dead || !(o.trapped.length || o.cargo) || o.t < 4) continue;
        if (LP.Hit.circles(b, o)) { B.burst(b, false); B.pop(o, b.owner); return; }
      }
    },

    // a sloth touches bubbles: bounce (jump held), ride (down held), otherwise POP
    touch(p) {
      for (const b of B.list) {
        if (b.dead || (b.state === 'shot' && !b.trapped.length)) continue;     // fresh shots fly past sloths
        const box = { x: p.x - p.w / 2, y: p.y - p.h, w: p.w, h: p.h };
        if (!LP.Hit.rectCircle(box, b)) continue;
        const fromAbove = p.vy >= 0 && p.y <= b.y - b.r * 0.15 && Math.abs(p.x - b.x) < b.r + 4;
        if (fromAbove && Players.held(p, 'down') && !b.trapped.length && b.state === 'float') {
          p.riding = b; b.rider = p; p.vy = 0; p.y = b.y - b.r + 1;
          continue;
        }
        if (fromAbove && Players.held(p, 'jump') && b.state === 'float') {
          p.vy = -(p.power.jump ? GAME_CONFIG.sloth.superJumpV : GAME_CONFIG.sloth.jumpV) * 1.05;
          p.y = b.y - b.r - 1; p.bounced = 10;
          b.vy += 1.4; b.flash = 6;
          LP.Audio.play('boing');
          continue;
        }
        if (p.riding === b) continue;
        B.pop(b, p.idx);
      }
    },

    // POP (by a sloth): defeats trapped enemies, sets off neighbours
    pop(b, pi, chain) {
      if (b.dead) return;
      b.dead = true;
      if (!chain) { chain = { id: ++chainId, n: 0, pi, x: b.x, y: b.y, done: false }; (B._chains = B._chains || []).push(chain); }
      const enemies = b.trapped;
      if (b.cargo) { Bosses.launchCargo(b, pi); B.ringBurst(b); LP.Audio.play('popBig', { n: 1 }); }
      else if (enemies.length) {
        for (const e of enemies) { chain.n++; Game.enemyPopped(e, pi, chain, b.x, b.y); }
        LP.Audio.play('popBig', { n: chain.n });
        G.burst(b.x, b.y, 12, '#fcfcfc', { speed: 2.2, life: 18, colors: ['#fcfcfc', COL[b.who || 'slub'].ring, '#f8b800'] });
        LP.FX.shake(2, 6);
      } else {
        Game.addScore(Players.list[pi], GAME_CONFIG.rules.emptyPop, b.x, b.y, null, true);
        LP.Audio.play('pop', { n: chain.n });
        B.ringBurst(b);
      }
      chain.x = b.x; chain.y = b.y;
      // neighbours pop a moment later
      for (const o of B.list) {
        if (o.dead || o === b || pending.some((q) => q.b === o)) continue;
        const dx = o.x - b.x, dy = o.y - b.y, rr = o.r + b.r + 3;
        if (dx * dx + dy * dy <= rr * rr) pending.push({ b: o, pi, chain, at: LP.Loop.frame + 5 });
      }
    },
    // bursting on its own (timed out / blocked): no points
    burst(b, quiet) {
      if (b.dead) return;
      b.dead = true;
      if (b.trapped.length) { for (const e of b.trapped) Enemies.release(e, b.x, b.y); }
      B.ringBurst(b);
      if (!quiet) LP.Audio.play('pip');
    },
    escape(b) {
      if (b.dead) return;
      b.dead = true;
      for (const e of b.trapped) Enemies.release(e, b.x, b.y);
      B.ringBurst(b);
      LP.Audio.play('escape');
    },
    ringBurst(b) {
      const c = COL[b.who] || COL.slub;
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2;
        LP.FX.spawn({ x: b.x + Math.cos(a) * b.r, y: b.y + Math.sin(a) * b.r, vx: Math.cos(a) * 1.2, vy: Math.sin(a) * 1.2, g: 0, drag: 0.85, life: 12, color: i % 2 ? c.ring : '#fcfcfc', draw: G._part });
      }
    },
    popAll() {
      // level clear: every leftover bubble bursts in a satisfying cascade (no enemies left inside)
      let i = 0;
      for (const b of B.list) if (!b.dead) { pending.push({ b, pi: 0, chain: { id: -1, n: 0, done: true }, at: LP.Loop.frame + 2 + (i++) * 3 }); }
    },

    draw() {
      const g = G.g;
      for (const b of B.list) {
        if (b.dead) continue;
        const c = b.rainbow ? { ring: RAINBOW[(b.t >> 2) % 6], dark: RAINBOW[((b.t >> 2) + 3) % 6], glint: '#fcfcfc' } : (COL[b.who] || COL.slub);
        let ring = c.ring, dark = c.dark;
        const left = b.life - b.t;
        if (b.trapped.length) {
          // warning colours as escape approaches
          if (left < 180) { const fast = left < 70 ? 3 : 5; if ((b.t >> fast) % 2 === 0) { ring = '#f83800'; dark = '#a81000'; } else { ring = '#f8b800'; dark = '#ac7c00'; } }
          for (let i = 0; i < b.trapped.length; i++) {
            const e = b.trapped[i], img = Sprites.enemy(e.name, (b.t >> 4) & 1, ((b.t >> 5) & 1) === 1, left < 70 ? 'angry' : '');
            const wob = b.mood === 'panic' ? ((b.t >> 1) % 2) : Math.round(Math.sin(b.t * 0.2));
            const ox = b.trapped.length > 1 ? (i - (b.trapped.length - 1) / 2) * 6 : 0;
            const s = img.height > 14 && b.r < 12 ? 1 : 1;
            g.drawImage(img, Math.round(b.x - img.width / 2 + ox + wob), Math.round(b.y - img.height / 2 + (b.mood === 'dizzy' ? Math.round(Math.cos(b.t * 0.2)) : 0)), img.width * s, img.height * s);
          }
          // the mood, above the bubble
          const icon = { dizzy: 'swirl', angry: 'vein', panic: 'sweat', confused: 'quest' }[b.mood] || 'swirl';
          if ((b.t >> 4) % 3 !== 2) G.draw(Sprites.icon(icon), b.x + b.r - 3, b.y - b.r - 4 + ((b.t >> 3) & 1));
        } else if (b.cargo) {
          if (left < 120 && (b.t >> 3) % 2) { ring = '#f83800'; dark = '#a81000'; }
          b.cargo.draw(g, { x: b.x + Math.round(Math.sin(b.t * 0.2)), y: b.y, t: b.t, vx: 1 });
        } else if (left < 90 && (b.t >> 2) % 2) {
          ring = '#fcfcfc';
        }
        // the bubble itself: ring, inner shade arc, glints
        G.ring(b.x, b.y, b.r, b.flash ? '#fcfcfc' : ring, g);
        g.fillStyle = dark;
        for (let a = 0.4; a < 2.4; a += 0.18) g.fillRect(Math.round(b.x + Math.cos(a) * (b.r - 1.5)), Math.round(b.y + Math.sin(a) * (b.r - 1.5)), 1, 1);
        g.fillStyle = c.glint;
        const gx = Math.round(b.x - b.r * 0.45), gy = Math.round(b.y - b.r * 0.5);
        g.fillRect(gx, gy, 2, 1); g.fillRect(gx - 1, gy + 1, 1, 2);
        if (b.r > 8) g.fillRect(gx + 3, gy - 1, 1, 1);
        if (b.state === 'shot' && !b.trapped.length && b.t < 4) G.ring(b.x, b.y, b.r - 2, '#fcfcfc', g);
      }
    }
  };
  return B;
})();
