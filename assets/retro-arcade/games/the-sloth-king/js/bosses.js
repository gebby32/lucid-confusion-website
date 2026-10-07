/* BOSSES — seven big fights with simple, readable patterns. Each one telegraphs its
   attacks and opens up for a moment afterwards (dizzy, stuck, tired, flipped by a roar).
     Bristleback (porcupine)   Cackle & the Snickerpack (hyenas)   Bruno (bush boar)
     Snapjaw (crocodile)       Widowmaw (spider queen)              Gnash (hyena brute)
     Malgrim (the jaguar who would be king) — three phases on the summit of Slow Rock.
   Shared shape: Bosses.create(name, spawn) -> { name, hp, maxHp, active, done, update(),
   draw(g, cx, cy), collide(pb, ab, inp, prevY), onRoar(x, y, r, p) }. */
'use strict';
const Bosses = (function () {
  const overlap = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
  const rect = (x, y, w, h) => ({ x0: x - w / 2, y0: y - h, x1: x + w / 2, y1: y });
  const NONE = { x0: -9, y0: -9, x1: -9, y1: -9 };

  function base(o, spawn) {
    const lvl = Game.lvl, diff = LP.Settings.get('difficulty');
    const hp = Math.max(2, Math.round(o.hp * (diff === 0 ? 0.7 : diff === 2 ? 1.25 : 1)));
    const B = Object.assign({
      hp, maxHp: hp, active: false, done: false, dieT: 0, t: 0, mode: 'wait', modeT: 0, hitT: 0, invulnT: 0, facing: -1, dmg: 1,
      x: spawn.x, y: spawn.y, gy: spawn.y, ax0: lvl.arena[0] * 16, ax1: (lvl.arena[1] + 1) * 16, vx: 0, vy: 0,
      music: 'boss', minions: []
    }, o);
    B.go = (m, t) => { B.mode = m; B.modeT = t || 0; };
    B.damage = function (n) {
      if (B.invulnT > 0 || B.done) return;
      B.hp -= n; B.hitT = 12; B.invulnT = B.iframes || 50;
      Sfx('bossHit'); LP.FX.shake(3, 10); LP.Loop.hitstop(5);
      Game.addScore(500);
      Game.hitSpark(B.x, B.y - (B.h || 30) / 2);
      if (B.hp <= 0) { B.hp = 0; B.die(); } else if (B.onHurt) B.onHurt();
    };
    B.die = function () {
      B.done = true; B.dieT = 0; LP.Audio.stopMusic(); Sfx('bossDie');
      for (const m of B.minions) if (!m.dead) Game.defeat(m);
      Game.addScore(10000); Game.popup(B.x, B.y - 60, '10000', '#ffe060');
      if (B.onDie) B.onDie();
    };
    B.startFight = function () {
      B.active = true;
      const C = Game.cam;
      C.lockX0 = B.ax0; C.lockX1 = Math.max(B.ax0, B.ax1 - 320);
      if (B.lockY !== undefined) { C.lockY0 = C.lockY1 = B.lockY; }
      Game.music(B.music);
      Game.banner = B.name; Game.bannerT = 120;
      Sfx('bossRoar');
      if (B.onStart) B.onStart();
    };
    B.update = function () {
      B.t++;
      if (B.hitT > 0) B.hitT--;
      if (B.invulnT > 0) B.invulnT--;
      if (!B.active) {
        if (Player.x > B.ax0 + 36 && Player.state !== 'dead') B.startFight();
        else { if (B.idle) B.idle(); return; }
      }
      // keep Slothba inside the arena
      if (Player.x < B.ax0 + 10) { Player.x = B.ax0 + 10; if (Player.vx < 0) Player.vx = 0; }
      if (Player.x > B.ax1 - 10) { Player.x = B.ax1 - 10; if (Player.vx > 0) Player.vx = 0; }
      if (B.done) {
        B.dieT++;
        if (B.dieT % 8 === 0 && B.dieT < 90) G.burst(B.x + LP.rand(-20, 20), B.y - LP.rand(5, 40), 10, '#ffffff', { colors: ['#ffffff', '#ffe060', '#ff8a2a'], speed: 2.4, life: 26 });
        if (B.dying) B.dying();
        if (B.dieT === (B.outroT || 150)) { Game.cam.lockX0 = Game.cam.lockX1 = Game.cam.lockY0 = Game.cam.lockY1 = null; if (B.finish) B.finish(); else Game.clearAct(); }
        return;
      }
      B.modeT--;
      B.think();
      LP.prune(B.minions, (m) => m.dead);
    };
    B.collide = function (pb, ab, inp, prevY) {
      const P = Player;
      if (!B.active || B.done || P.state === 'dead') return;
      const hb = B.hurtBox();
      const vuln = B.vuln();
      if (ab && overlap(ab, hb) && !P.hitSet.has(B)) {
        P.hitSet.add(B);
        if (vuln) B.damage(P.F.dmg);
        else { Sfx('clink'); Game.hitSpark((ab.x0 + ab.x1) / 2, (ab.y0 + ab.y1) / 2); if (B.onBlocked) B.onBlocked(); }
      }
      if (P.vy > 0.5 && prevY <= hb.y0 + 10 && overlap(pb, hb) && P.state === 'normal') {
        if (vuln && B.stompable !== false) { B.damage(P.F.dmg); P.bounce(inp, 1.05); Sfx('stomp'); return; }
        if (B.spikyTop && B.spikyTop()) { P.hurt(1, B.x); P.vy = -5.5; return; }
        P.bounce(inp, 0.85); return;
      }
      if (P.rolling && vuln && overlap(pb, hb) && !P.hitSet.has(B)) { P.hitSet.add(B); B.damage(P.F.dmg); return; }
      for (const d of B.danger()) if (overlap(pb, d)) { P.hurt(B.dmg, B.x); break; }
    };
    B.onRoar = B.onRoar || (() => {});
    B.sprite = function (g, cx, cy, art, anim, frame, flip, o) {
      const f = CharArt.get(art, anim, frame);
      const blink = B.invulnT > 0 && B.invulnT % 6 < 3;
      Art.draw(g, f, B.x - cx, B.y - cy, flip === undefined ? B.facing < 0 : flip, Object.assign({ white: B.hitT > 6 || (blink && B.hitT > 0) }, o));
    };
    B.drawDeath = function (g, cx, cy, art, anim) {
      if (B.dieT > 100 && B.dieT % 4 < 2) return true;
      return false;
    };
    return B;
  }
  const stars = (g, x, y) => Ents.stars(g, x, y);
  const quill = (x, y, vx, vy) => Ents.shot({ x, y, vx, vy, g: 0.18, r: 3, life: 200, deflectable: true,
    drawFn(g, sx, sy) { const a = Math.atan2(this.vy, this.vx); for (let k = 0; k < 6; k++) { g.fillStyle = k < 2 ? '#2a1c10' : '#efe2c4'; g.fillRect(Math.round(sx - Math.cos(a) * k), Math.round(sy - Math.sin(a) * k), 1, 1); } } });

  // ================================================================== BRISTLEBACK
  function bristleback(sp) {
    const B = base({ name: 'BRISTLEBACK', hp: 5, w: 40, h: 26 }, sp);
    B.idle = () => { B.facing = -1; };
    B.vuln = () => B.mode === 'dizzy' || B.mode === 'flipped';
    B.spikyTop = () => !B.vuln();
    B.hurtBox = () => rect(B.x, B.y, 42, B.mode === 'roll' ? 34 : 28);
    B.danger = () => B.vuln() ? [] : [rect(B.x, B.y, B.mode === 'roll' ? 34 : 36, B.mode === 'roll' ? 32 : 24)];
    B.onStart = () => B.go('walk', 100);
    B.onHurt = () => { B.go('recover', 30); B.vx = 0; };
    B.onRoar = (x, y, r) => { if (Math.abs(B.x - x) < r + 30 && (B.mode === 'walk' || B.mode === 'bristle')) { B.go('flipped', 150); Sfx('flip'); B.vx = 0; } };
    function ground() { B.vy = Math.min(B.vy + 0.4, 7); B.y += B.vy; if (B.y >= B.gy) { B.y = B.gy; B.vy = 0; } }
    B.think = function () {
      const dx = Player.x - B.x;
      switch (B.mode) {
        case 'walk':
          B.facing = Math.sign(dx) || B.facing; B.vx = B.facing * 0.9;
          B.x += B.vx;
          if (B.modeT <= 0) B.go(B.t % 2 ? 'bristle' : 'curl', 36);
          break;
        case 'bristle':
          if (B.modeT === 0) {
            Sfx('quill');
            const n = B.hp <= 2 ? 7 : 5;
            for (let k = 0; k < n; k++) { const a = -Math.PI / 2 + (k - (n - 1) / 2) * 0.32; Game.addShot(quill(B.x, B.y - 26, Math.cos(a) * 3.6, Math.sin(a) * 5.2)); }
          }
          if (B.modeT < -30) B.go('walk', 90);
          break;
        case 'curl':
          if (B.modeT <= 0) { B.go('roll', 0); B.vx = B.facing * (B.hp <= 2 ? 4.4 : 3.6); B.bounces = 2; Sfx('roll'); }
          break;
        case 'roll':
          B.x += B.vx;
          if (B.x < B.ax0 + 24 || B.x > B.ax1 - 24) {
            B.x = LP.clamp(B.x, B.ax0 + 24, B.ax1 - 24); B.vx = -B.vx; B.vy = -3; Sfx('thud'); LP.FX.shake(2, 8);
            if (--B.bounces < 0) { B.go('dizzy', 110); B.vx = 0; }
          }
          break;
        case 'dizzy': case 'flipped':
          if (B.modeT <= 0) B.go('walk', 80);
          break;
        case 'recover':
          if (B.modeT <= 0) B.go('curl', 24);
          break;
      }
      ground();
    };
    B.draw = function (g, cx, cy) {
      if (!B.active && !Game.onScreen(B.x, B.y)) return;
      if (B.done) { if (B.dieT > 100 && B.dieT % 4 < 2) return; B.sprite(g, cx, cy, 'bristleback', 'flipped', 0); return; }
      const m = B.mode;
      if (m === 'roll' || m === 'curl') {
        const f = CharArt.get('bristleback', 'curl', 0);
        g.save(); g.translate(Math.round(B.x - cx), Math.round(B.y - cy - 18)); g.rotate(m === 'roll' ? B.x / 14 : 0);
        Art.draw(g, f, 0, 18, false, { white: B.hitT > 0 }); g.restore();
        return;
      }
      if (m === 'dizzy' || m === 'flipped') { B.sprite(g, cx, cy, 'bristleback', 'flipped', B.t >> 3); stars(g, B.x - cx, B.y - 40 - cy); return; }
      if (m === 'bristle' && B.modeT > 0) { B.sprite(g, cx + ((B.t >> 1) % 2 ? 1 : -1), cy, 'bristleback', 'bristle', 0); return; }
      B.sprite(g, cx, cy, 'bristleback', m === 'bristle' ? 'bristle' : 'walk', B.t >> 3);
    };
    return B;
  }

  // ================================================================== CACKLE & THE SNICKERPACK
  function cackle(sp) {
    const B = base({ name: 'CACKLE & THE SNICKERPACK', hp: 3, w: 40, h: 30, perch: null, music: 'boss' }, sp);
    const ledgeL = { x: B.ax0 + 48, y: sp.y - 80 }, ledgeR = { x: B.ax1 - 48, y: sp.y - 80 };
    B.idle = () => { B.facing = -1; };
    B.vuln = () => B.mode === 'dazed';
    B.hurtBox = () => rect(B.x, B.y, 40, 30);
    B.danger = () => (B.mode === 'dazed' || B.mode === 'perch' || B.mode === 'leap') ? [] : [rect(B.x, B.y, 38, 26)];
    function spawnPack(n) {
      for (let k = 0; k < n; k++) {
        const side = k % 2 ? 1 : -1, x = side > 0 ? B.ax1 - 30 : B.ax0 + 30;
        const h = Ents.E.hyena(x, B.gy); h.home = (B.ax0 + B.ax1) / 2; h.range = (B.ax1 - B.ax0) / 2 - 40; h.score = 300; h.vx = -side * 0.8; h.facing = -side;
        B.minions.push(Game.addEnt(h));
      }
    }
    B.onStart = () => { B.go('perch', 60); B.perch = ledgeR; B.x = ledgeR.x; B.y = ledgeR.y; spawnPack(2); };
    B.onHurt = () => { B.go('leapUp', 1); };
    B.think = function () {
      const dx = Player.x - B.x;
      switch (B.mode) {
        case 'perch':
          B.facing = Math.sign(dx) || -1;
          if (B.modeT <= 0) {
            B.modeT = 100;
            // lob a bone at Slothba
            const t = 50, vx = (Player.x - B.x) / t, vy = ((Player.y - 20) - (B.y - 30) - 0.5 * 0.2 * t * t) / t;
            Game.addShot(Ents.shot({ x: B.x, y: B.y - 30, vx, vy: LP.clamp(vy, -6, 1), g: 0.2, r: 4, spin: true, life: 160,
              drawFn(g, sx, sy, tt) { const a = tt / 4; g.fillStyle = '#efe8d0'; for (let k = -3; k <= 3; k++) g.fillRect(Math.round(sx + Math.cos(a) * k), Math.round(sy + Math.sin(a) * k), 2, 2); g.fillStyle = '#ffffff'; g.fillRect(Math.round(sx + Math.cos(a) * 4) - 1, Math.round(sy + Math.sin(a) * 4) - 1, 3, 3); g.fillRect(Math.round(sx - Math.cos(a) * 4) - 1, Math.round(sy - Math.sin(a) * 4) - 1, 3, 3); } }));
            Sfx('cackle');
          }
          if (B.minions.length === 0) { B.go('leap', 0); B.vy = -5; B.vx = (Player.x > B.x ? 1 : -1) * 2; }
          break;
        case 'leap':
          B.x += B.vx; B.vy += 0.3; B.y += B.vy;
          if (B.y >= B.gy && B.vy > 0) { B.y = B.gy; B.vy = 0; B.go('crouch', 40); Sfx('thud'); }
          break;
        case 'crouch':
          B.facing = Math.sign(dx) || B.facing;
          if (B.modeT <= 0) { B.go('charge', 0); B.vx = B.facing * 4.6; Sfx('growl'); }
          break;
        case 'charge':
          B.x += B.vx;
          if (B.t % 4 === 0) G.dust(B.x - B.facing * 16, B.y, 1, '#c8c0a8');
          if (B.x < B.ax0 + 22 || B.x > B.ax1 - 22) { B.x = LP.clamp(B.x, B.ax0 + 22, B.ax1 - 22); B.go('dazed', 100); Sfx('thud'); LP.FX.shake(4, 12); }
          break;
        case 'dazed':
          if (B.modeT <= 0) B.go('crouch', 34);
          break;
        case 'leapUp': {
          // retreat to the far ledge and call another hyena
          const tgt = Player.x < (B.ax0 + B.ax1) / 2 ? ledgeR : ledgeL;
          if (B.modeT === 0) { B.vy = -7.6; B.tx = tgt.x; B.ty = tgt.y; spawnPack(1); }
          B.x += (B.tx - B.x) * 0.06; B.vy += 0.3; B.y += B.vy;
          if (B.vy > 0 && B.y >= B.ty) { B.y = B.ty; B.go('perch', 50); }
          break;
        }
      }
    };
    B.draw = function (g, cx, cy) {
      if (!B.active && !Game.onScreen(B.x, B.y)) return;
      if (B.done) { if (B.dieT > 100 && B.dieT % 4 < 2) return; B.sprite(g, cx, cy, 'cackle', 'hurt', 0); return; }
      const m = B.mode;
      const anim = m === 'perch' ? 'laugh' : m === 'crouch' ? 'crouch' : m === 'charge' ? 'run' : m === 'dazed' ? 'hurt' : m === 'leap' || m === 'leapUp' ? 'lunge' : 'stand';
      B.sprite(g, cx, cy, 'cackle', anim, B.t >> (m === 'charge' ? 2 : 3));
      if (m === 'dazed') stars(g, B.x + B.facing * 14 - cx, B.y - 44 - cy);
    };
    B.drawBack = function (g, cx, cy) {
      // the two bone ledges
      for (const L of [ledgeL, ledgeR]) Props.platform(g, 'bone', Math.round(L.x - 32 - cx), Math.round(L.y - cy), 4, 'bones');
    };
    B.ledges = [ledgeL, ledgeR];
    return B;
  }

  // ================================================================== BRUNO
  function bruno(sp) {
    const B = base({ name: 'BRUNO THE BUSH BOAR', hp: 6, w: 56, h: 36 }, sp);
    B.idle = () => { B.facing = -1; };
    B.vuln = () => B.mode === 'dazed';
    B.hurtBox = () => rect(B.x, B.y, 56, 36);
    B.danger = () => B.mode === 'dazed' ? [] : [rect(B.x + B.facing * 6, B.y, 50, 32)];
    B.onStart = () => B.go('paw', 60);
    B.onHurt = () => { if (B.mode === 'dazed') B.modeT = Math.min(B.modeT, 20); };
    B.onRoar = (x, y, r) => { if (Math.abs(B.x - x) < r + 30 && B.mode === 'paw') { B.go('dazed', 70); Sfx('flip'); } };
    B.think = function () {
      const dx = Player.x - B.x;
      switch (B.mode) {
        case 'paw':
          B.facing = Math.sign(dx) || B.facing;
          if (B.t % 10 === 0) G.dust(B.x - B.facing * 20, B.y, 2, '#b89a6a', { dir: -B.facing });
          if (B.t % 20 === 0) Sfx('snort');
          if (B.modeT <= 0) { B.go(B.hp <= 3 && B.t % 3 === 0 ? 'hop' : 'charge', 0); B.vx = B.facing * (B.hp <= 3 ? 5 : 4.2); if (B.mode === 'hop') { B.vy = -6; } }
          break;
        case 'hop':
          B.x += B.vx * 0.7; B.vy += 0.35; B.y += B.vy;
          if (B.y >= B.gy) { B.y = B.gy; B.vy = 0; B.go('charge', 0); LP.FX.shake(3, 8); Sfx('thud'); }
          break;
        case 'charge':
          B.x += B.vx;
          if (B.t % 3 === 0) G.dust(B.x - B.facing * 24, B.y, 1, '#c8b090');
          if (B.x < B.ax0 + 30 || B.x > B.ax1 - 30) {
            B.x = LP.clamp(B.x, B.ax0 + 30, B.ax1 - 30); B.go('dazed', B.hp <= 3 ? 80 : 110); Sfx('thud'); LP.FX.shake(5, 16);
            // the tree shakes loose some coconuts
            for (let k = 0; k < (B.hp <= 3 ? 3 : 2); k++) Game.addShot(Ents.shot({ x: LP.rand(B.ax0 + 40, B.ax1 - 40), y: Game.cam.y - 10 - k * 40, vx: 0, vy: 0, g: 0.18, art: 'coconut', r: 4, spin: true, life: 300 }));
          }
          break;
        case 'dazed':
          if (B.modeT <= 0) { B.facing = Math.sign(dx) || -B.facing; B.go('paw', B.hp <= 3 ? 40 : 60); }
          break;
      }
    };
    B.draw = function (g, cx, cy) {
      if (!B.active && !Game.onScreen(B.x, B.y)) return;
      if (B.done) { if (B.dieT > 100 && B.dieT % 4 < 2) return; B.sprite(g, cx, cy, 'bruno', 'hurt', 0); return; }
      const m = B.mode;
      B.sprite(g, cx, cy, 'bruno', m === 'dazed' ? 'dazed' : m === 'charge' || m === 'hop' ? 'run' : 'stand', B.t >> 2);
      if (m === 'dazed') stars(g, B.x + B.facing * 20 - cx, B.y - 48 - cy);
    };
    return B;
  }

  // ================================================================== SNAPJAW
  function snapjaw(sp) {
    const B = base({ name: 'OLD SNAPJAW', hp: 5, w: 90, h: 30, stompable: true, rise: 0 }, sp);
    // the pool: find the water surface under the spawn
    let sy = sp.y; while (World.at(sp.x, sy) !== World.LIQ && sy < World.ph) sy += 16;
    B.water = Math.floor(sy / 16) * 16 + 6;
    B.y = B.water + 30; B.gy = B.water;
    B.pool = (() => { let x0 = sp.x, x1 = sp.x; while (World.at(x0 - 16, B.water) === World.LIQ) x0 -= 16; while (World.at(x1 + 16, B.water) === World.LIQ) x1 += 16; return [x0 - 8 + 40, x1 + 8 - 40]; })();
    B.vuln = () => B.mode === 'rest';
    B.hurtBox = () => B.mode === 'rest' || B.mode === 'snap' ? { x0: B.x - 40, y0: B.water - 22, x1: B.x + 40, y1: B.water + 4 } : NONE;
    B.danger = () => B.mode === 'snap' && B.modeT < 30 && B.modeT > 4 ? [{ x0: B.x + B.facing * 18 - 30, y0: B.water - 56, x1: B.x + B.facing * 18 + 30, y1: B.water }] : [];
    B.onStart = () => B.go('hidden', 60);
    B.onHurt = () => { B.go('reel', 55); Sfx('splash'); Game.onSplash(B.x + B.facing * 20, B.water); };
    // resting (and reeling) head is something to stand on
    B.mv = { x: 0, y: 0, w: 70, dx: 0, dy: 0, solid: false, thin: false };
    World.movers.push(B.mv);
    B.think = function () {
      B.mv.solid = B.mode === 'rest' || B.mode === 'reel' || (B.mode === 'sink' && B.modeT > 16);
      B.mv.x = B.x - 35; B.mv.y = B.water - 14; B.mv.dx = 0; B.mv.dy = 0;
      switch (B.mode) {
        case 'hidden': {
          const tx = LP.clamp(Player.x, B.pool[0], B.pool[1]);
          B.x += LP.clamp(tx - B.x, -2.2, 2.2);
          if (B.t % 6 === 0) G.dust(B.x + LP.rand(-20, 20), B.water, 1, '#e8f8ff', { g: -0.02 });
          if (B.modeT <= 0 && Math.abs(tx - B.x) < 8) { B.go('rise', B.hp <= 2 ? 26 : 40); Sfx('splashSmall'); B.facing = Player.x < B.x ? -1 : 1; }
          break;
        }
        case 'rise':
          if (B.t % 3 === 0) G.burst(B.x + LP.rand(-24, 24), B.water, 2, '#ffffff', { speed: 1.2, g: 0.1, life: 14 });
          if (B.modeT <= 0) { B.go('snap', 40); Sfx('snap'); Game.onSplash(B.x, B.water); }
          break;
        case 'snap':
          if (B.modeT <= 0) B.go('rest', B.hp <= 2 ? 70 : 100);
          break;
        case 'rest':
          if (B.modeT <= 0) { B.go('sink', 20); }
          break;
        case 'reel':
          if (B.t % 8 === 0) G.burst(B.x + LP.rand(-30, 30), B.water, 2, '#ffffff', { speed: 1.4, g: 0.12, life: 14 });
          if (B.modeT <= 0) B.go('sink', 20);
          break;
        case 'sink':
          // a sloth still standing on his head gets flung back to the nearest bank
          if (Player.onGround && Player.mover === B.mv) {
            const left = Player.x - B.pool[0] < B.pool[1] - Player.x;
            Player.vy = -7.4; Player.vx = left ? -2.6 : 2.6; Player.onGround = false; Player.mover = null; Player.jumping = false; Sfx('boing');
          }
          if (B.modeT <= 0) B.go('hidden', 40);
          break;
      }
    };
    B.draw = function (g, cx, cy) {
      const m = B.mode;
      if (!B.active || m === 'hidden') {
        // eyes and nostrils gliding along the surface
        const ex = B.x - cx, ey = B.water - cy;
        g.fillStyle = '#36602a'; g.fillRect(Math.round(ex - 20), Math.round(ey - 3), 8, 3); g.fillRect(Math.round(ex + 18), Math.round(ey - 2), 5, 2);
        g.fillStyle = '#ffd030'; g.fillRect(Math.round(ex - 18), Math.round(ey - 3), 2, 1);
        return;
      }
      if (B.done && B.dieT > 100 && B.dieT % 4 < 2) return;
      const rise = m === 'rise' ? 22 + B.modeT * 0.3 : m === 'sink' ? 30 - B.modeT : m === 'snap' ? 0 : 14;
      const anim = B.done || m === 'reel' ? 'hurt' : m === 'snap' ? 'snap' : 'idle';
      const f = CharArt.get('snapjaw', anim, (B.t >> 3) & 1);
      Art.draw(g, f, B.x - cx + (m === 'reel' ? ((B.t >> 1) % 2 ? 1 : -1) : 0), B.water + rise + 6 - cy, B.facing < 0, { white: B.hitT > 6 });
      if (m === 'rest' || B.done) stars(g, B.x + B.facing * 4 - cx, B.water - 34 - cy + rise);
    };
    return B;
  }

  // ================================================================== WIDOWMAW
  function widowmaw(sp) {
    const B = base({ name: 'WIDOWMAW, QUEEN OF THE DEEP', hp: 12, w: 60, h: 50, music: 'boss' }, sp);
    B.top = sp.y - 150; B.y = B.top; B.thread = B.top - 60;
    B.vuln = () => B.mode === 'floor' || B.mode === 'stunned';
    B.hurtBox = () => ({ x0: B.x - 26, y0: B.y + 14, x1: B.x + 26, y1: B.y + 60 });
    B.danger = () => B.mode === 'stunned' ? [] : [{ x0: B.x - 22, y0: B.y + 18, x1: B.x + 22, y1: B.y + 58 }];
    B.onStart = () => B.go('ceiling', 90);
    B.onHurt = () => { if (B.mode === 'floor' && B.hp % 4 === 0) B.go('climb', 0); };
    B.onRoar = (x, y, r) => { if (B.mode === 'floor' || B.mode === 'drop') { B.go('stunned', 120); Sfx('flip'); } };
    B.think = function () {
      const dx = Player.x - B.x;
      switch (B.mode) {
        case 'ceiling':
          B.y += (B.top - B.y) * 0.1;
          B.x += LP.clamp(dx * 0.03, -1.6, 1.6);
          B.x = LP.clamp(B.x, B.ax0 + 40, B.ax1 - 40);
          if (B.modeT % 70 === 35) {   // web ball
            const d = Math.hypot(dx, Player.y - B.y), v = 2.6;
            Game.addShot(Ents.shot({ x: B.x, y: B.y + 40, vx: dx / d * v, vy: (Player.y - 16 - B.y - 40) / d * v, g: 0, r: 5, life: 200, deflectable: true,
              drawFn(g, sx, sy, tt) { g.fillStyle = '#e8e8f8'; g.fillRect(Math.round(sx) - 4, Math.round(sy) - 4, 8, 8); g.fillStyle = '#b8b8d8'; g.fillRect(Math.round(sx) - 3 + (tt >> 2) % 2, Math.round(sy) - 1, 6, 1); g.fillRect(Math.round(sx) - 1, Math.round(sy) - 3, 1, 6); } }));
            Sfx('web');
          }
          if (B.modeT % 160 === 80 && B.minions.length < 3) { const s = Ents.E.spider(B.x + LP.rand(-40, 40), B.top + 30); s.variant = 'cave'; B.minions.push(Game.addEnt(s)); }
          if (B.modeT <= 0 && Math.abs(dx) < 50) { B.go('shake', 30); Sfx('crack'); }
          if (B.modeT < -200) { B.go('shake', 30); }
          break;
        case 'shake':
          if (B.modeT <= 0) { B.go('drop', 0); B.vy = 0; }
          break;
        case 'drop':
          B.vy = Math.min(B.vy + 0.5, 9); B.y += B.vy;
          if (B.y + 60 >= B.gy) { B.y = B.gy - 60; B.go('floor', B.hp <= 6 ? 120 : 160); LP.FX.shake(5, 18); Sfx('thud');
            // the slam sends little shock sparks along the floor
            for (const s of [-1, 1]) Game.addShot(Ents.shot({ x: B.x + s * 20, y: B.gy - 6, vx: s * 3, vy: 0, g: 0, r: 5, life: 90, deflectable: false, solidStop: false,
              drawFn(g, sx, sy, tt) { g.fillStyle = tt % 4 < 2 ? '#c0b8ff' : '#ffffff'; g.fillRect(Math.round(sx) - 3, Math.round(sy) - 6 + (tt % 3), 6, 6); } }));
          }
          break;
        case 'floor':
          B.facing = Math.sign(dx) || B.facing;
          B.x += B.facing * 0.7;
          B.x = LP.clamp(B.x, B.ax0 + 40, B.ax1 - 40);
          if (B.modeT <= 0) B.go('climb', 0);
          break;
        case 'stunned':
          if (B.modeT <= 0) B.go('climb', 0);
          break;
        case 'climb':
          B.y -= 2.4;
          if (B.y <= B.top) { B.y = B.top; B.go('ceiling', B.hp <= 6 ? 120 : 170); }
          break;
      }
    };
    B.draw = function (g, cx, cy) {
      if (!B.active && !Game.onScreen(B.x, B.y + 40)) return;
      if (B.done && B.dieT > 100 && B.dieT % 4 < 2) return;
      g.fillStyle = '#d8d8e8'; g.fillRect(Math.round(B.x - cx), Math.round(B.thread - cy), 1, Math.round(B.y - B.thread + 10));
      const shake = B.mode === 'shake' ? ((B.t >> 1) % 2 ? 2 : -2) : 0;
      const f = CharArt.get('widowmaw', B.done || B.mode === 'stunned' ? 'hurt' : 'idle', B.t >> 3);
      Art.draw(g, f, B.x - cx + shake, B.y - cy, false, { white: B.hitT > 6 });
      if (B.mode === 'stunned') stars(g, B.x - cx, B.y + 6 - cy);
    };
    return B;
  }

  // ================================================================== GNASH
  function gnash(sp) {
    const B = base({ name: 'GNASH THE BONECRUSHER', hp: 14, w: 60, h: 46 }, sp);
    B.vuln = () => B.mode === 'stuck' || B.mode === 'flinch';
    B.hurtBox = () => rect(B.x, B.y, 62, 50);
    B.danger = () => B.vuln() ? [] : [rect(B.x + B.facing * 4, B.y, 56, 44)];
    B.onStart = () => B.go('stalk', 80);
    B.onRoar = (x, y, r) => { if (Math.abs(B.x - x) < r + 40 && !B.vuln() && B.mode !== 'leap') { B.go('flinch', 90); Sfx('flip'); } };
    B.onHurt = () => {};
    function wave(dir) {
      Game.addShot(Ents.shot({ x: B.x + dir * 30, y: B.gy - 8, vx: dir * 3.4, vy: 0, g: 0, r: 7, life: 120, deflectable: false, solidStop: false,
        drawFn(g, sx, sy, tt) { for (let k = 0; k < 4; k++) { g.fillStyle = k % 2 ? '#ffb040' : '#ff5a10'; const h = 14 - k * 3 + ((tt + k) % 3); g.fillRect(Math.round(sx) - 6 + k * 3, Math.round(sy) + 8 - h, 3, h); } } }));
    }
    B.think = function () {
      const dx = Player.x - B.x;
      switch (B.mode) {
        case 'stalk':
          B.facing = Math.sign(dx) || B.facing;
          B.x += B.facing * 0.9;
          if (B.modeT % 90 === 45) {   // bone boomerang
            const bone = Ents.shot({ x: B.x, y: B.y - 40, vx: B.facing * 4.2, vy: 0, g: 0, r: 6, life: 140, deflectable: true, home: B, back: false,
              update() { this.t++; this.vx -= Math.sign(this.vx0 || (this.vx0 = this.vx)) * 0.07; this.x += this.vx; this.y += Math.sin(this.t / 10) * 0.6; if (this.t > this.life || (this.t > 40 && Math.abs(this.x - B.x) < 20)) this.dead = true; },
              drawFn(g, sx, sy, tt) { const a = tt / 3; g.fillStyle = '#efe8d0'; for (let k = -5; k <= 5; k++) g.fillRect(Math.round(sx + Math.cos(a) * k), Math.round(sy + Math.sin(a) * k), 2, 2); g.fillStyle = '#ffffff'; g.fillRect(Math.round(sx + Math.cos(a) * 6) - 1, Math.round(sy + Math.sin(a) * 6) - 1, 3, 3); g.fillRect(Math.round(sx - Math.cos(a) * 6) - 1, Math.round(sy - Math.sin(a) * 6) - 1, 3, 3); } });
            Game.addShot(bone); Sfx('throw');
          }
          if (B.modeT <= 0) { if (B.t % 2) { B.go('crouch', 30); } else { B.go('leapPrep', 26); } }
          break;
        case 'crouch':
          B.facing = Math.sign(dx) || B.facing;
          if (B.modeT <= 0) { B.go('charge', 0); B.vx = B.facing * (B.hp <= 7 ? 5 : 4.4); Sfx('growl'); }
          break;
        case 'charge':
          B.x += B.vx;
          if (B.t % 3 === 0) G.dust(B.x - B.facing * 26, B.y, 1, '#706058');
          if (B.x < B.ax0 + 34 || B.x > B.ax1 - 34) { B.x = LP.clamp(B.x, B.ax0 + 34, B.ax1 - 34); B.go('stuck', 70); Sfx('thud'); LP.FX.shake(5, 14); }
          break;
        case 'leapPrep':
          if (B.modeT <= 0) { B.go('leap', 0); B.vy = -8.4; B.vx = LP.clamp(dx / 50, -3.6, 3.6); }
          break;
        case 'leap':
          B.x += B.vx; B.vy += 0.34; B.y += B.vy;
          B.x = LP.clamp(B.x, B.ax0 + 34, B.ax1 - 34);
          if (B.y >= B.gy && B.vy > 0) { B.y = B.gy; B.vy = 0; B.go('stuck', 60); LP.FX.shake(6, 18); Sfx('thud'); wave(-1); wave(1); }
          break;
        case 'stuck': case 'flinch':
          if (B.modeT <= 0) B.go('stalk', B.hp <= 7 ? 60 : 100);
          break;
      }
    };
    B.draw = function (g, cx, cy) {
      if (!B.active && !Game.onScreen(B.x, B.y)) return;
      if (B.done) { if (B.dieT > 100 && B.dieT % 4 < 2) return; B.sprite(g, cx, cy, 'gnash', 'hurt', 0); return; }
      const m = B.mode;
      const anim = m === 'stalk' ? 'walk' : m === 'crouch' || m === 'leapPrep' ? 'crouch' : m === 'charge' ? 'run' : m === 'leap' ? 'lunge' : m === 'stuck' || m === 'flinch' ? 'hurt' : 'stand';
      B.sprite(g, cx, cy, 'gnash', anim, B.t >> (m === 'charge' ? 2 : 3));
      if (B.vuln()) stars(g, B.x + B.facing * 16 - cx, B.y - 64 - cy);
    };
    return B;
  }

  // ================================================================== MALGRIM
  function malgrim(sp) {
    const B = base({ name: 'MALGRIM', hp: 24, w: 70, h: 40, music: 'finalboss', iframes: 40, outroT: 260 }, sp);
    // the high ledge for phase two: the tallest solid column inside the arena, right half
    B.ledge = { x: B.ax1 - 56, y: sp.y - 96 };
    B.phase = 1;
    B.vuln = () => B.mode === 'recover' || B.mode === 'stagger';
    B.hurtBox = () => rect(B.x, B.y, 72, 42);
    B.danger = () => {
      if (B.vuln() || B.mode === 'ledge' || B.mode === 'taunt') return [];
      const d = [rect(B.x, B.y, 60, 36)];
      if (B.mode === 'swipe' && B.modeT < 16 && B.modeT > 4) d.push({ x0: B.x + (B.facing > 0 ? 20 : -60), y0: B.y - 60, x1: B.x + (B.facing > 0 ? 60 : -20), y1: B.y });
      return d;
    };
    B.onStart = () => { B.go('taunt', 90); Game.banner = 'MALGRIM'; };
    B.onHurt = () => {
      if (B.phase === 1 && B.hp <= 16) { B.phase = 2; B.go('toLedge', 1); Sfx('bossRoar'); return; }
      if (B.phase === 2 && B.hp <= 8) { B.phase = 3; B.go('fromLedge', 1); Sfx('bossRoar'); return; }
      B.go('retreat', 26);
    };
    B.onRoar = (x, y, r, p) => {
      if (Math.abs(B.x - x) < r + 50 && (B.mode === 'prowl' || B.mode === 'crouch' || B.mode === 'swipe')) { B.go('stagger', 80); Sfx('flip'); }
    };
    B.onBlocked = () => { if (B.mode === 'prowl') { B.go('swipe', 24); } };
    function onGround() { B.vy = Math.min(B.vy + 0.36, 8); B.y += B.vy; if (B.y >= B.gy) { const was = B.vy > 2; B.y = B.gy; B.vy = 0; return was ? 2 : 1; } return 0; }
    B.think = function () {
      const dx = Player.x - B.x, fast = B.phase === 3;
      switch (B.mode) {
        case 'taunt':
          B.facing = Math.sign(dx) || -1;
          if (B.modeT <= 0) B.go('prowl', 70);
          onGround(); break;
        case 'prowl':
          B.facing = Math.sign(dx) || B.facing;
          if (Math.abs(dx) > 90) B.x += B.facing * (fast ? 1.8 : 1.3);
          else if (Math.abs(dx) < 60) B.x -= B.facing * 0.8;
          B.x = LP.clamp(B.x, B.ax0 + 40, B.ax1 - 40);
          if (Math.abs(dx) < 52 && B.modeT < 40) B.go('swipe', 24);
          else if (B.modeT <= 0) B.go('crouch', fast ? 18 : 30);
          onGround(); break;
        case 'swipe':
          if (B.modeT === 12) Sfx('swipeBig');
          if (B.modeT <= 0) B.go(fast && B.t % 2 ? 'crouch' : 'prowl', fast ? 16 : 60);
          onGround(); break;
        case 'crouch':
          B.facing = Math.sign(dx) || B.facing;
          if (B.modeT <= 0) { B.go('pounce', 0); B.vy = -6.6; B.vx = LP.clamp(dx / 38, -5.2, 5.2); Sfx('growl'); B.pounces = (B.pounces || 0) + 1; }
          onGround(); break;
        case 'pounce':
          B.x += B.vx; B.x = LP.clamp(B.x, B.ax0 + 36, B.ax1 - 36);
          if (onGround() === 2) {
            LP.FX.shake(3, 8); Sfx('thud');
            if (fast) { for (const s of [-1, 1]) Game.addShot(Ents.shot({ x: B.x + s * 26, y: B.gy - 6, vx: s * 3, vy: 0, g: 0, r: 6, life: 80, deflectable: false, solidStop: false,
              drawFn(g, sx, sy, tt) { for (let k = 0; k < 3; k++) { g.fillStyle = k % 2 ? '#ffb040' : '#ff5a10'; const h = 12 - k * 3 + ((tt + k) % 3); g.fillRect(Math.round(sx) - 5 + k * 3, Math.round(sy) + 6 - h, 3, h); } } })); }
            if (fast && B.pounces % 2 === 1) B.go('crouch', 14);
            else B.go('recover', fast ? 45 : 60);
          }
          break;
        case 'recover': case 'stagger':
          if (B.modeT <= 0) B.go('prowl', 80);
          onGround(); break;
        case 'retreat':
          B.x -= B.facing * 3; B.x = LP.clamp(B.x, B.ax0 + 40, B.ax1 - 40);
          if (B.modeT <= 0) B.go('prowl', 50);
          onGround(); break;
        case 'toLedge':
          // leap up to the high rock
          if (B.modeT === 0) { B.vy = -9.4; }
          B.x += (B.ledge.x - B.x) * 0.06; B.vy += 0.36; B.y += B.vy;
          if (B.vy > 0 && B.y >= B.ledge.y) { B.y = B.ledge.y; B.go('ledge', 40); B.volley = 0; }
          break;
        case 'ledge':
          B.facing = -1;
          if (B.modeT <= 0) {
            B.volley++;
            if (B.volley % 3 === 0 && B.minions.length < 2) {
              const h = Ents.E.hyena(B.ax0 + 30, B.gy); h.home = (B.ax0 + B.ax1) / 2; h.range = 100; B.minions.push(Game.addEnt(h)); Sfx('cackle');
            } else {
              // kick a burning boulder down the slope of the summit
              Game.addShot(Ents.shot({ x: B.x - 20, y: B.y - 14, vx: -2.6, vy: -2, g: 0.3, r: 9, life: 400, deflectable: false, solidStop: false, bounce: true,
                update() { this.t++; this.vy += 0.3; this.x += this.vx; this.y += this.vy; if (this.y > B.gy - 9) { this.y = B.gy - 9; this.vy = this.t < 60 ? -2.5 : 0; } if (this.x < B.ax0 - 20) this.dead = true; if (this.t % 20 === 0) Sfx('boulder'); },
                drawFn(g, sx, sy, tt) { Px.ellipse(g, Math.round(sx), Math.round(sy), 9, 9, '#3a1a10'); Px.ellipse(g, Math.round(sx) - 2, Math.round(sy) - 2, 6, 6, '#6a3420'); for (let k = 0; k < 4; k++) { const a = tt / 6 + k * 1.57; g.fillStyle = '#ff7a1a'; g.fillRect(Math.round(sx + Math.cos(a) * 6), Math.round(sy + Math.sin(a) * 6), 2, 2); } g.fillStyle = (tt >> 2) % 2 ? '#ffb040' : '#ff5a10'; g.fillRect(Math.round(sx) - 3, Math.round(sy) - 13 - (tt % 4), 6, 4); } }));
              Sfx('throw');
            }
            B.modeT = 70;
            if (B.volley >= 7) { B.go('fromLedge', 1); }
          }
          break;
        case 'fromLedge':
          if (B.modeT === 0) { B.vy = -4; B.vx = LP.clamp((Player.x - B.x) / 40, -4, 4); }
          B.x += B.vx; B.x = LP.clamp(B.x, B.ax0 + 36, B.ax1 - 36);
          if (onGround() === 2) { LP.FX.shake(4, 10); Sfx('thud'); B.go('recover', 70); if (B.phase === 2) B.backUp = true; }
          break;
      }
      // phase two: after a grounded round, back up to the ledge
      if (B.phase === 2 && B.backUp && B.mode === 'prowl' && B.modeT <= 10) { B.backUp = false; B.go('toLedge', 1); }
    };
    B.dying = function () {
      // he staggers back toward the edge... and the summit gives way under him
      if (B.dieT < 120) { B.x += 0.8; }
      else if (B.dieT === 120) { Sfx('rubble'); B.vy = -3; }
      else { B.vy += 0.3; B.y += B.vy; B.x += 1.6; }
      if (B.dieT === 60) { Player.frozen = true; Player.facing = 1; }
      if (B.dieT === 70) { Player.roarT = 44; Sfx('roarBig'); Game.rings.push({ x: Player.x, y: Player.y - 30, r: 4, max: 150, t: 0 }); LP.FX.shake(5, 30); }
      if (B.dieT === 160) { Game.rain = true; Sfx('thunder'); LP.FX.flash(4); }
    };
    B.finish = () => { Player.frozen = false; Game.clearAct(); };
    B.draw = function (g, cx, cy) {
      if (!B.active && !Game.onScreen(B.x, B.y)) return;
      if (B.done) { if (B.y > Game.cam.y + 300) return; B.sprite(g, cx, cy, 'malgrim', B.dieT < 120 ? 'hurt' : 'fall', 0); return; }
      const m = B.mode;
      const anim = { taunt: 'roar', prowl: Math.abs(B.vx) > 0 || true ? 'walk' : 'idle', swipe: 'swipe', crouch: 'crouch', pounce: 'pounce', recover: 'dizzy', stagger: 'dizzy', retreat: 'walk', toLedge: 'pounce', ledge: 'idle', fromLedge: 'pounce' }[m] || 'idle';
      const flip = m === 'retreat' ? B.facing > 0 : B.facing < 0;
      B.sprite(g, cx, cy, 'malgrim', anim, B.t >> 3, flip);
      if (B.vuln()) stars(g, B.x + B.facing * 22 - cx, B.y - 50 - cy);
    };
    B.drawBack = function (g, cx, cy) {
      // the high rock he leaps onto in phase two
      const L = B.ledge, sx = Math.round(L.x - 40 - cx), sy = Math.round(L.y - cy);
      const R = Themes.T[World.theme].terrain.ramp;
      Px.poly(g, [[sx, sy], [sx + 80, sy], [sx + 76, sy + 14], [sx + 60, sy + 22], [sx + 16, sy + 22], [sx + 4, sy + 12]], R[0]);
      Px.rect(g, sx + 2, sy + 1, 76, 6, R[2]); Px.rect(g, sx + 2, sy + 1, 76, 1, R[4]);
    };
    return B;
  }

  const MAKERS = { bristleback, cackle, bruno, snapjaw, widowmaw, gnash, malgrim };
  function create(name, spawn) {
    if (!MAKERS[name] || !spawn) return null;
    return MAKERS[name](spawn);
  }
  return { create, MAKERS };
})();
