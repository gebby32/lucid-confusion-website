/* ENTITIES — everything that lives in a level besides Slothba and the bosses:
   pickups, checkpoints, hint stones, the exit, bouncers, geysers, moving / falling /
   floating platforms, swing vines, stalactites, projectiles, and the enemies.
   Ents.spawn(ch, x, y) builds one from its map letter (see levels.js legend).
   Every entity: { kind, x, y (feet), w, h, dead, update(), draw(g, cx, cy) }.
   Enemies add: hp, dmg, stompable, spiky, flying, stun(t), hit(dmg, src), stomp(). */
'use strict';
const Ents = (function () {
  const box = (e) => ({ x0: e.x - e.w / 2, y0: e.y - e.h, x1: e.x + e.w / 2, y1: e.y });
  const near = (e, dx, dy) => Math.abs(Player.x - e.x) < dx && Math.abs((Player.y - Player.h / 2) - (e.y - e.h / 2)) < dy;
  const variantFor = (kind) => {
    const th = World.theme;
    if (kind === 'beetle') return { jungle: 'green', falls: 'green', volcano: 'fire', final: 'fire', cave: 'crystal', night: 'crystal' }[th] || 'blue';
    if (kind === 'snake') return { jungle: 'jungle', falls: 'jungle', night: 'night', cave: 'cave' }[th] || 'savanna';
    if (kind === 'spider') return th === 'cave' ? 'cave' : 'forest';
    if (kind === 'vulture') return (th === 'volcano' || th === 'final') ? 'fire' : 'dusk';
    return undefined;
  };

  // ------------------------------------------------------------------ enemy base
  function enemy(o) {
    const e = Object.assign({
      enemy: true, x: 0, y: 0, w: 16, h: 14, vx: 0, vy: 0, hp: 1, dmg: 1, facing: -1, t: 0, onGround: false,
      stompable: true, spiky: false, flying: false, roarable: true, rollable: true, score: 100, stunT: 0, hitT: 0, dead: false, invulnT: 0,
      art: 'beetle', anim: 'walk', frame: 0, variant: undefined, harmless: false
    }, o);
    if (!o.box) e.box = () => box(e);
    e.stun = (t) => { if (!e.roarable) return; e.stunT = Math.max(e.stunT, t); e.vx = 0; if (e.onStun) e.onStun(); };
    if (!o.hit) e.hit = (dmg, src) => {
      if (e.invulnT > 0 || e.dead) return false;
      if (e.onHit && e.onHit(dmg, src) === false) return false;
      e.hp -= dmg; e.hitT = 8; e.invulnT = 14;
      if (e.hp <= 0) { Game.defeat(e); return true; }
      Sfx('hit');
      e.vx = (e.x < Player.x ? -1 : 1) * 1.5;
      return true;
    };
    if (!o.stomp) e.stomp = () => e.hit(Math.max(1, Player.F.dmg), 'stomp');
    e.common = () => {
      e.t++;
      if (e.hitT > 0) e.hitT--;
      if (e.invulnT > 0) e.invulnT--;
      if (e.stunT > 0) { e.stunT--; return true; }
      return false;
    };
    e.drawSprite = (g, cx, cy, anim, frame, flipV) => {
      const f = CharArt.get(e.art, anim || e.anim, frame === undefined ? e.frame : frame, e.variant);
      if (flipV) {
        g.save(); g.translate(Math.round(e.x - cx), Math.round(e.y - cy - e.h / 2)); g.scale(1, -1);
        Art.draw(g, f, 0, -e.h / 2 + 0, e.facing < 0 ? false : true, { white: e.hitT > 0 && (e.hitT >> 1) % 2 === 0 }); g.restore();
        return;
      }
      Art.draw(g, f, e.x - cx, e.y - cy, e.facing > 0 ? false : true, { white: e.hitT > 0 && (e.hitT >> 1) % 2 === 0 });
      if (e.stunT > 0) stars(g, e.x - cx, e.y - e.h - 4 - cy);
    };
    e.draw = e.draw || ((g, cx, cy) => e.drawSprite(g, cx, cy));
    return e;
  }
  function stars(g, x, y) {
    const t = LP.Loop.frame / 8;
    for (let k = 0; k < 3; k++) {
      const a = t + k * 2.1, sx = x + Math.cos(a) * 8, sy = y + Math.sin(a) * 2.5;
      g.fillStyle = k === 1 ? '#ffffff' : '#ffe040'; g.fillRect(Math.round(sx) - 1, Math.round(sy), 3, 1); g.fillRect(Math.round(sx), Math.round(sy) - 1, 1, 3);
    }
  }
  // ground walker physics (gravity, walls, optional turn at ledges)
  function walk(e, turnAtEdge) {
    e.vy = Math.min(e.vy + 0.35, 6);
    if (e.vx) {
      const nx = e.x + e.vx, s = Math.sign(e.vx), ahead = nx + s * e.w / 2;
      const wall = World.wall(ahead, e.y - e.h + 2, e.y - 6) !== null;
      const edge = e.onGround && turnAtEdge && !World.floor(ahead - 1, ahead + 1, e.y, e.y - 4, e.y + 12, false);
      if (wall || edge || ahead < 4 || ahead > World.pw - 4) { e.vx = -e.vx; e.facing = Math.sign(e.vx) || e.facing; if (e.onTurn) e.onTurn(wall); }
      else e.x = nx;
    }
    const f = World.floor(e.x - e.w / 2 + 1, e.x + e.w / 2 - 1, e.y, e.y - (e.onGround ? 8 : 0), e.y + e.vy + (e.onGround ? 6 : 0), false);
    if (f) { e.y = f.y; e.vy = 0; e.onGround = true; if (f.m) e.x += f.m.dx; } else { e.y += e.vy; e.onGround = false; }
    if (e.y > World.ph + 64) e.dead = true;
  }

  // ------------------------------------------------------------------ enemies
  const E = {};
  E.beetle = (x, y) => enemy({ x, y, w: 16, h: 11, vx: -0.45, art: 'beetle', variant: variantFor('beetle'), score: 100,
    update() { if (this.common()) return; walk(this, true); this.facing = Math.sign(this.vx) || this.facing; this.frame = (this.t >> 3) & 1; },
    draw(g, cx, cy) { this.drawSprite(g, cx, cy, this.stunT > 0 ? 'flipped' : 'walk', (this.t >> 3) & 1); } });

  E.hyena = (x, y, o) => {
    const art = (o && o.art) || 'hyena';
    return enemy({ x, y, w: art === 'jackal' ? 26 : 28, h: 20, hp: art === 'jackal' ? 2 : 2, dmg: 1, art, score: 300, home: x, range: 64, mode: 'walk', modeT: 0, vx: -0.6, speed: art === 'jackal' ? 0.9 : 0.6,
      update() {
        if (this.common()) { this.mode = 'laugh'; this.modeT = 30; return; }
        this.modeT--;
        const dx = Player.x - this.x;
        switch (this.mode) {
          case 'walk':
            if (this.x < this.home - this.range) this.vx = this.speed; else if (this.x > this.home + this.range) this.vx = -this.speed;
            if (Math.abs(this.vx) < 0.1) this.vx = this.speed * this.facing;
            this.facing = Math.sign(this.vx);
            if (near(this, art === 'jackal' ? 150 : 120, 30) && Math.sign(dx) === this.facing && Player.state !== 'dead') { this.mode = 'crouch'; this.modeT = art === 'jackal' ? 18 : 30; this.vx = 0; Sfx('growl'); }
            else if (near(this, 90, 30) && Player.state !== 'dead') { this.facing = Math.sign(dx); this.vx = this.speed * this.facing; }
            break;
          case 'crouch':
            this.vx = 0; this.facing = Math.sign(dx) || this.facing;
            if (this.modeT <= 0) { this.mode = 'lunge'; this.modeT = 34; this.vx = this.facing * (art === 'jackal' ? 3.6 : 3.2); this.vy = -2.6; this.onGround = false; }
            break;
          case 'lunge':
            if (this.onGround && this.modeT < 26) { this.vx = LP.approach(this.vx, 0, 0.25); }
            if (this.modeT <= 0) { this.mode = 'laugh'; this.modeT = 50; this.vx = 0; Sfx('cackle'); }
            break;
          case 'laugh':
            this.vx = 0;
            if (this.modeT <= 0) { this.mode = 'walk'; this.vx = this.speed * this.facing; }
            break;
        }
        walk(this, this.mode === 'walk');
      },
      draw(g, cx, cy) {
        const m = this.stunT > 0 ? 'hurt' : this.mode === 'walk' ? 'walk' : this.mode === 'crouch' ? 'crouch' : this.mode === 'lunge' ? 'lunge' : 'laugh';
        this.drawSprite(g, cx, cy, m, m === 'walk' ? (this.t >> 3) : (this.t >> 3));
      } });
  };
  E.jackal = (x, y) => E.hyena(x, y, { art: 'jackal' });

  E.snake = (x, y) => enemy({ x, y, w: 18, h: 16, hp: 1, art: 'snake', variant: variantFor('snake'), score: 150, strikeT: 0, cool: 0, facing: -1,
    update() {
      if (this.common()) return;
      this.facing = Player.x < this.x ? -1 : 1;
      if (this.cool > 0) this.cool--;
      if (this.strikeT > 0) this.strikeT--;
      else if (this.cool === 0 && near(this, 56, 24)) { this.strikeT = 22; this.cool = 70; Sfx('hiss'); }
      walk(this, true);
    },
    box() { const b = box(this); if (this.strikeT > 4 && this.strikeT < 18) { if (this.facing > 0) b.x1 += 16; else b.x0 -= 16; b.y0 -= 4; } return b; },
    draw(g, cx, cy) { this.drawSprite(g, cx, cy, this.strikeT > 4 && this.strikeT < 18 ? 'strike' : 'idle', (this.t >> 4) & 1); } });

  E.vulture = (x, y) => enemy({ x, y: y - 8, w: 24, h: 16, hp: 1, flying: true, art: 'vulture', variant: variantFor('vulture'), score: 200, hx: x, hy: y - 8, mode: 'circle', modeT: 0, ang: Math.random() * 6,
    update() {
      if (this.common()) { this.vy = Math.min(this.vy + 0.2, 3); this.y += this.vy; if (this.y > World.ph + 40) this.dead = true; return; }
      this.modeT--;
      if (this.mode === 'circle') {
        this.ang += 0.02;
        const tx = this.hx + Math.cos(this.ang) * 48, ty = this.hy + Math.sin(this.ang * 2) * 8;
        this.facing = Math.cos(this.ang + 0.1) > Math.cos(this.ang) ? 1 : -1;
        this.x += (tx - this.x) * 0.08; this.y += (ty - this.y) * 0.08;
        if (Math.abs(Player.x - this.x) < 90 && Player.y > this.y + 20 && Player.y - this.y < 170 && this.modeT < 0 && Player.state !== 'dead') {
          this.mode = 'dive'; this.modeT = 60; const dx = Player.x - this.x, dy = (Player.y - Player.h * 0.6) - this.y, d = Math.hypot(dx, dy);
          this.vx = dx / d * 3.2; this.vy = dy / d * 3.2; this.facing = Math.sign(dx); Sfx('screech');
        }
      } else if (this.mode === 'dive') {
        this.x += this.vx; this.y += this.vy;
        if (this.modeT < 30 || World.solidAt(this.x, this.y + 4)) { this.mode = 'rise'; this.modeT = 90; }
      } else {
        this.x += (this.hx - this.x) * 0.03; this.y += (this.hy - this.y) * 0.04; this.facing = Math.sign(this.hx - this.x) || this.facing;
        if (this.modeT <= 0 || Math.abs(this.y - this.hy) < 4) { this.mode = 'circle'; this.modeT = 70; }
      }
    },
    draw(g, cx, cy) { this.drawSprite(g, cx, cy + this.h / 2 - 4, this.stunT > 0 ? 'hurt' : this.mode === 'dive' ? 'dive' : 'fly', this.t >> 3); } });

  E.porcupine = (x, y) => enemy({ x, y, w: 22, h: 14, hp: 1, spiky: true, rollable: false, art: 'porcupine', vx: -0.4, score: 250,
    update() { if (this.common()) { walk(this, true); return; } this.spiky = true; walk(this, true); this.facing = Math.sign(this.vx) || this.facing; },
    onStun() { this.spiky = false; Sfx('flip'); },
    onHit(dmg, src) {
      // the cub must flip it with a roar first; the adult's swipe is strong enough on its own
      if (this.stunT > 0 || (src !== 'stomp' && Player.form === 'adult')) return true;
      if (src === 'stomp') return false;
      Sfx('clink'); return false;
    },
    draw(g, cx, cy) { if (this.stunT > 0) { this.drawSprite(g, cx, cy, 'flipped', (this.t >> 3) & 1); stars(g, this.x - cx, this.y - this.h - 6 - cy); } else this.drawSprite(g, cx, cy, 'walk', (this.t >> 3) & 1); } });

  E.monkey = (x, y) => enemy({ x, y, w: 18, h: 24, hp: 1, art: 'monkey', score: 250, cool: 60, throwT: 0,
    update() {
      if (this.common()) { this.vy = Math.min(this.vy + 0.3, 6); this.y += this.vy; if (World.floor(this.x - 4, this.x + 4, this.y - this.vy, this.y - this.vy, this.y, false)) this.vy = 0; return; }
      this.facing = Player.x < this.x ? -1 : 1;
      if (this.throwT > 0) this.throwT--;
      if (this.cool > 0) this.cool--;
      else if (Math.abs(Player.x - this.x) < 170 && Math.abs(Player.y - this.y) < 140 && Player.state !== 'dead') {
        this.cool = 140; this.throwT = 24;
        const dx = Player.x - this.x, t = 44, vx = LP.clamp(dx / t, -3, 3);
        const dy = (Player.y - 12) - (this.y - 20), vy = (dy - 0.5 * 0.2 * t * t) / t;
        Game.addShot(Ents.shot({ x: this.x + this.facing * 6, y: this.y - 22, vx, vy: LP.clamp(vy, -5, 2), g: 0.2, art: 'coconut', r: 4, spin: true }));
        Sfx('throw');
      }
    },
    draw(g, cx, cy) { this.drawSprite(g, cx, cy, this.stunT > 0 ? 'hurt' : this.throwT > 12 ? 'throw' : this.throwT > 0 ? 'throw' : 'sit', this.throwT > 12 ? 0 : 1); } });

  E.croc = (x, y) => {
    const e = enemy({ x, y: y - 6, w: 56, h: 10, hp: 99, art: 'croc', stompable: false, roarable: false, harmless: true, score: 0, home: x, open: 0, cool: 90,
      update() {
        this.t++;
        const nx = this.home + Math.sin(this.t / 160) * 24;
        this.mv.dx = nx - this.x; this.x = nx; this.facing = this.mv.dx >= 0 ? 1 : -1;
        this.mv.x = this.x - 26; this.mv.y = this.y - 8; this.mv.dy = 0;
        if (this.cool > 0) this.cool--;
        if (this.open > 0) this.open--;
        else if (this.cool === 0 && Math.abs(Player.x - (this.x + this.facing * 22)) < 46 && Math.abs(Player.y - this.y) < 50) { this.open = 50; this.cool = 120; Sfx('snap'); }
      },
      box() { const hx = this.x + this.facing * 24; return this.open > 10 && this.open < 40 ? { x0: hx - 12, y0: this.y - 24, x1: hx + 12, y1: this.y - 4 } : { x0: 0, y0: -99, x1: 0, y1: -99 }; },
      hit() { Sfx('clink'); return false; },
      draw(g, cx, cy) { const f = CharArt.get('croc', this.open > 10 && this.open < 40 ? 'snap' : 'idle', (this.open >> 3) & 1); Art.draw(g, f, this.x - cx, this.y - cy + 4, this.facing < 0); } });
    e.mv = { x: x - 26, y: y - 14, w: 48, dx: 0, dy: 0, solid: true };
    e.harmless = false;
    World.movers.push(e.mv);
    return e;
  };

  E.spider = (x, y) => enemy({ x, y: y - 16, w: 16, h: 14, hp: 1, flying: true, art: 'spider', variant: variantFor('spider'), score: 200, top: y - 16, drop: 0,
    update() {
      if (this.common()) { this.drop = Math.max(0, this.drop - 1); this.y = this.top + this.drop + 14; return; }
      const want = Math.abs(Player.x - this.x) < 44 && Player.y > this.top ? Math.min(Player.y - 10 - this.top, 120) : 0;
      this.drop += LP.clamp(want - this.drop, -1, 2.4);
      this.y = this.top + this.drop + 14;
    },
    draw(g, cx, cy) {
      g.fillStyle = '#d8d8e8'; g.fillRect(Math.round(this.x - cx), Math.round(this.top - 14 - cy), 1, Math.round(this.drop + 16));
      const f = CharArt.get('spider', this.hitT > 0 ? 'hurt' : 'idle', this.t >> 3, this.variant);
      Art.draw(g, f, this.x - cx, this.y - 14 - cy, false, { white: this.hitT > 0 && (this.hitT >> 1) % 2 === 0 });
      if (this.stunT > 0) stars(g, this.x - cx, this.y - 18 - cy);
    } });

  E.bat = (x, y) => enemy({ x, y: y - 16 + 10, w: 16, h: 10, hp: 1, flying: true, art: 'bat', score: 150, hx: x, hy: y - 6, mode: 'hang', ph: Math.random() * 6,
    update() {
      if (this.common()) { this.vy = Math.min(this.vy + 0.2, 3); this.y += this.vy; if (this.y > World.ph + 40) this.dead = true; return; }
      if (this.mode === 'hang') { if (near(this, 110, 120) && Player.state !== 'dead') { this.mode = 'fly'; Sfx('flap'); } return; }
      this.ph += 0.08;
      const dx = Player.x - this.x, dy = (Player.y - Player.h * 0.7) - this.y;
      this.vx = LP.clamp(this.vx + Math.sign(dx) * 0.06, -1.6, 1.6);
      this.x += this.vx; this.y += LP.clamp(dy * 0.02, -1, 1) + Math.sin(this.ph) * 1.2;
      this.facing = Math.sign(this.vx) || 1;
    },
    draw(g, cx, cy) { const f = CharArt.get('bat', this.mode === 'hang' ? 'hang' : 'fly', this.t >> 2); Art.draw(g, f, this.x - cx, this.y - cy, this.facing < 0, { white: this.hitT > 0 }); if (this.stunT > 0) stars(g, this.x - cx, this.y - 10 - cy); } });

  E.scorpion = (x, y) => enemy({ x, y, w: 22, h: 12, hp: 2, art: 'scorpion', vx: -0.5, score: 250, sting: 0, cool: 40,
    update() {
      if (this.common()) { walk(this, true); return; }
      if (this.sting > 0) { this.sting--; this.vx = 0; if (this.sting === 0) this.vx = 0.5 * this.facing; }
      else if (this.cool-- <= 0 && near(this, 50, 20)) { this.facing = Math.sign(Player.x - this.x); this.sting = 28; this.cool = 80; Sfx('hiss'); }
      walk(this, true); if (this.vx) this.facing = Math.sign(this.vx);
    },
    box() { const b = box(this); if (this.sting > 6 && this.sting < 20) { if (this.facing > 0) b.x1 += 10; else b.x0 -= 10; } return b; },
    draw(g, cx, cy) { this.drawSprite(g, cx, cy, this.sting > 6 && this.sting < 20 ? 'sting' : 'walk', (this.t >> 3) & 1); } });

  E.boar = (x, y) => enemy({ x, y, w: 30, h: 18, hp: 2, dmg: 1, art: 'boar', score: 400, mode: 'idle', modeT: 40, vx: 0,
    update() {
      if (this.common()) { this.mode = 'dazed'; this.modeT = 40; return; }
      this.modeT--;
      if (this.mode === 'idle') {
        this.vx = 0;
        if (this.modeT <= 0 && near(this, 170, 30) && Player.state !== 'dead') { this.facing = Math.sign(Player.x - this.x); this.mode = 'charge'; Sfx('snort'); }
      } else if (this.mode === 'charge') {
        this.vx = LP.approach(this.vx, this.facing * 3.2, 0.12);
        if (this.t % 6 === 0) G.dust(this.x - this.facing * 12, this.y, 1, '#c8b090');
      } else if (this.mode === 'dazed') { this.vx = 0; if (this.modeT <= 0) { this.mode = 'idle'; this.modeT = 50; } }
      walk(this, this.mode !== 'charge');
    },
    onTurn(wall) { if (this.mode === 'charge') { this.mode = 'dazed'; this.modeT = 70; this.vx = 0; this.facing = -this.facing; if (wall) { Sfx('thud'); LP.FX.shake(2, 6); } } },
    draw(g, cx, cy) { this.drawSprite(g, cx, cy, this.mode === 'dazed' || this.stunT > 0 ? 'dazed' : this.mode === 'charge' ? 'run' : 'stand', this.t >> 2); if (this.mode === 'dazed') stars(g, this.x + this.facing * 10 - cx, this.y - 24 - cy); } });

  E.owl = (x, y) => enemy({ x, y, w: 16, h: 18, hp: 1, flying: true, art: 'owl', score: 200, hx: x, hy: y, mode: 'perch', modeT: 0,
    update() {
      if (this.common()) { this.vy = Math.min(this.vy + 0.2, 3); this.y += this.vy; return; }
      this.modeT--;
      if (this.mode === 'perch') { this.facing = Player.x < this.x ? -1 : 1; if (this.modeT < 0 && near(this, 130, 120) && Player.state !== 'dead') { this.mode = 'dive'; this.modeT = 70; this.sx = this.x; this.sy = this.y; this.tx = Player.x; this.ty = Player.y - 10; Sfx('hoot'); } }
      else if (this.mode === 'dive') {
        const t = 1 - this.modeT / 70, ex = this.tx + (this.tx - this.sx);
        this.x = this.sx + (ex - this.sx) * t; this.y = this.sy + (this.ty - this.sy) * Math.sin(t * Math.PI) * 1.1;
        this.facing = Math.sign(ex - this.sx) || 1;
        if (this.modeT <= 0) { this.mode = 'return'; this.modeT = 80; }
      } else { this.x += (this.hx - this.x) * 0.05; this.y += (this.hy - this.y) * 0.05; if (this.modeT <= 0) { this.x = this.hx; this.y = this.hy; this.mode = 'perch'; this.modeT = 60; } }
    },
    draw(g, cx, cy) { this.drawSprite(g, cx, cy, this.mode === 'perch' ? 'perch' : this.mode === 'dive' ? 'dive' : 'fly', this.t >> 3); } });

  E.wasp = (x, y) => enemy({ x, y: y - 8, w: 12, h: 10, hp: 1, flying: true, art: 'wasp', score: 100, hx: x, hy: y - 8, ph: Math.random() * 6,
    update() { if (this.common()) { this.vy = Math.min(this.vy + 0.2, 3); this.y += this.vy; return; } this.ph += 0.035; const ox = this.x; this.x = this.hx + Math.sin(this.ph) * 30; this.y = this.hy + Math.sin(this.ph * 2) * 12; this.facing = this.x > ox ? 1 : -1; },
    draw(g, cx, cy) { const f = CharArt.get('wasp', 'fly', this.t >> 1); Art.draw(g, f, this.x - cx, this.y - cy - 5, this.facing < 0, { white: this.hitT > 0 }); } });

  E.fish = (x, y) => enemy({ x, y: y + 20, w: 14, h: 10, hp: 1, flying: true, art: 'fish', score: 150, hy: y + 20, cool: 60 + Math.floor(Math.random() * 60), roarable: false,
    update() {
      this.t++; if (this.hitT > 0) this.hitT--; if (this.invulnT > 0) this.invulnT--;
      if (this.cool > 0) { this.cool--; this.y = this.hy; if (this.cool === 0) { this.vy = -7.2; Sfx('splashSmall'); } return; }
      this.vy += 0.22; this.y += this.vy;
      if (this.y >= this.hy && this.vy > 0) { this.y = this.hy; this.cool = 90; Sfx('splashSmall'); }
    },
    draw(g, cx, cy) { if (this.cool > 0) return; const f = CharArt.get('fish', 'swim', this.t >> 3); g.save(); g.translate(Math.round(this.x - cx), Math.round(this.y - cy - 5)); g.rotate(this.vy < 0 ? -1.4 : 1.4); Art.draw(g, f, 0, 0); g.restore(); } });

  // ------------------------------------------------------------------ pickups
  const ITEMS = {
    o: { name: 'leaf', score: 50 }, m: { name: 'mango', score: 200 }, M: { name: 'melon', score: 500 }, r: { name: 'bug', score: 200 }, '1': { name: 'oneup', score: 1000 }, '*': { name: 'gem', score: 5000 }
  };
  const itemArt = {};
  function itemFrame(name, i) {
    const key = name + i;
    if (itemArt[key]) return itemArt[key];
    let f;
    const A = Art;
    switch (name) {
      case 'leaf': f = A.build(16, 16, 8, 8, (g) => {   // a golden acacia leaf that turns as it floats
        const sx = [1, 0.7, 0.3, 0.7][i], rot = 0.55, ca = Math.cos(rot), sa = Math.sin(rot);
        const T = (x, y) => [8 + x * sx * ca - y * sa, 8 + x * sx * sa + y * ca];
        A.poly(g, [[0, -6.5], [3.8, -2], [3.2, 3], [0, 6.5], [-3.2, 3], [-3.8, -2]].map((p) => T(p[0], p[1])), '#d89a12');
        A.poly(g, [[0, -6], [3.2, -2], [2.6, 3], [0, 5.5], [0, -6]].map((p) => T(p[0], p[1])), '#b07808');
        A.poly(g, [[-0.5, -5], [-2.8, -2], [-2.4, 1], [-0.5, -1]].map((p) => T(p[0], p[1])), '#ffe070');
        const v0 = T(0, -5), v1 = T(0, 7.5); A.line(g, v0[0], v0[1], v1[0], v1[1], '#8a5a06');
        const h = T(-1.6, -3); A.px(g, h[0], h[1], '#fffbd0');
      }); break;
      case 'mango': f = A.build(16, 16, 8, 8, (g) => { A.blob(g, 8, 9, 5.4, 4.8, 0.4, ['#c83a1a', '#ff8a2a', '#ffd060']); A.ell(g, 9, 3, 2.4, 1.2, 0.5, '#3aa83a'); A.line(g, 8, 4, 8, 2, '#5a3a1a'); }); break;
      case 'melon': f = A.build(20, 18, 10, 9, (g) => { A.blob(g, 10, 10, 8, 6.4, 0, ['#2a7a2a', '#4ab03a', '#8ae06a']); for (let k = 0; k < 4; k++) A.line(g, 4 + k * 4, 5, 3 + k * 4, 15, '#2a6a20'); A.px(g, 7, 6, '#e0ffe0'); }); break;
      case 'bug': f = A.build(16, 14, 8, 7, (g) => {   // a fat blue roar beetle with flapping wings
        A.ell(g, 4 + i, 4, 3, 2, -0.5, '#d0f0ff'); A.ell(g, 12 - i, 4, 3, 2, 0.5, '#d0f0ff');
        A.blob(g, 8, 8, 4.4, 4, 0, ['#1a3a9a', '#3a7aff', '#a0d0ff']); A.ell(g, 8, 3.5, 2.4, 1.6, 0, '#1a1a3a'); A.px(g, 7, 7, '#ffffff');
      }); break;
      case 'oneup': f = A.build(20, 22, 10, 11, (g) => { const fr = SlothArt.get('cub', 'win', 0); g.drawImage(fr.c, fr.ax - 10, fr.ay - 30, 20, 22, 0, 0, 20, 22); }, false); break;
      case 'gem': f = A.build(16, 16, 8, 8, (g) => {
        const c = ['#9a1a3a', '#ff3a6a', '#ffb0c8', '#ffffff'];
        A.poly(g, [[8, 1], [14, 6], [8, 15], [2, 6]], c[0]); A.poly(g, [[8, 2], [13, 6], [8, 13], [3, 6]], c[1]); A.poly(g, [[8, 2], [10, 6], [8, 8], [5, 6]], c[2]);
        A.px(g, 6, 4, c[3]); if (i % 2) A.px(g, 11, 9, c[3]);
      }); break;
    }
    return (itemArt[key] = f);
  }
  function item(ch, x, y) {
    const d = ITEMS[ch];
    return { kind: 'item', item: d.name, score: d.score, x, y: y - 8, w: 12, h: 12, t: Math.floor(Math.random() * 60), dead: false, bob: d.name !== 'oneup',
      box() { return { x0: this.x - 7, y0: this.y - 7, x1: this.x + 7, y1: this.y + 7 }; },
      update() { this.t++; },
      draw(g, cx, cy) {
        const by = this.bob ? Math.round(Math.sin(this.t / 12) * 2) : 0;
        const fr = this.item === 'leaf' ? (this.t >> 3) & 3 : this.item === 'bug' ? (this.t >> 2) & 1 : this.item === 'gem' ? (this.t >> 4) & 1 : 0;
        Art.draw(g, itemFrame(this.item, fr), this.x - cx, this.y - cy + by);
        if (this.item === 'gem' && (this.t % 40) < 6) { g.fillStyle = '#ffffff'; g.fillRect(Math.round(this.x - cx + 5), Math.round(this.y - cy - 8 + by), 1, 3); g.fillRect(Math.round(this.x - cx + 4), Math.round(this.y - cy - 7 + by), 3, 1); }
      } };
  }

  // ------------------------------------------------------------------ level furniture
  function checkpoint(x, y) {
    return { kind: 'checkpoint', x, y, w: 20, h: 32, on: false, t: 0, dead: false,
      box() { return { x0: this.x - 12, y0: this.y - 40, x1: this.x + 12, y1: this.y }; },
      update() { this.t++; },
      draw(g, cx, cy) {
        const sx = Math.round(this.x - cx), sy = Math.round(this.y - cy);
        // carved standing stone with Mobo's painted handprint
        Px.poly(g, [[sx - 8, sy], [sx - 7, sy - 26], [sx - 3, sy - 31], [sx + 4, sy - 30], [sx + 8, sy - 24], [sx + 8, sy]], '#3a3430');
        Px.poly(g, [[sx - 7, sy - 1], [sx - 6, sy - 25], [sx - 3, sy - 29], [sx + 3, sy - 28], [sx + 6, sy - 23], [sx + 6, sy - 1]], '#7a7068');
        Px.rect(g, sx - 6, sy - 25, 2, 23, '#9a9088');
        const c = this.on ? ((this.t >> 3) % 2 ? '#ffe060' : '#ff9a30') : '#5a4a44';
        Px.ellipse(g, sx, sy - 14, 3, 3.4, c);
        for (let k = 0; k < 4; k++) Px.rect(g, sx - 3 + k * 2, sy - 21 + (k % 3 === 0 ? 1 : 0), 1, 4, c);
        Px.rect(g, sx + 3, sy - 15, 3, 1, c);
        if (this.on && this.t % 20 < 10) { g.fillStyle = '#fff6c0'; g.fillRect(sx - 1, sy - 35 - ((this.t >> 2) % 6), 2, 2); }
      } };
  }
  function exitMark(x, y) {
    return { kind: 'exit', x, y, w: 24, h: 48, t: 0, dead: false,
      box() { return { x0: this.x - 10, y0: this.y - 48, x1: this.x + 10, y1: this.y }; },
      update() { this.t++; },
      draw(g, cx, cy) {
        const sx = Math.round(this.x - cx), sy = Math.round(this.y - cy);
        // the royal banner of Slow Rock on a pole
        Px.rect(g, sx - 1, sy - 56, 3, 56, '#3a2010'); Px.rect(g, sx, sy - 56, 1, 56, '#8a5a2a');
        Px.ellipse(g, sx, sy - 57, 2.4, 2.4, '#ffd040');
        const wave = (k) => Math.round(Math.sin(this.t / 8 + k / 4) * 2);
        for (let k = 0; k < 22; k++) { Px.rect(g, sx + 2 + k, sy - 54 + wave(k), 1, 16, k % 6 === 0 ? '#a02020' : '#d83030'); Px.rect(g, sx + 2 + k, sy - 54 + wave(k), 1, 1, '#ff7a6a'); }
        for (let k = 4; k < 18; k++) if (Math.abs(k - 11) < 6) Px.rect(g, sx + 2 + k, sy - 49 + wave(k), 1, 6 - Math.abs(k - 11) * 0.8, '#ffd040');
      } };
  }
  function hintStone(x, y, text) {
    return { kind: 'hint', x, y, w: 16, h: 20, text, t: 0, dead: false,
      box() { return { x0: this.x - 14, y0: this.y - 30, x1: this.x + 14, y1: this.y }; },
      update() { this.t++; },
      draw(g, cx, cy) {
        const sx = Math.round(this.x - cx), sy = Math.round(this.y - cy);
        Px.poly(g, [[sx - 7, sy], [sx - 6, sy - 13], [sx, sy - 16], [sx + 6, sy - 13], [sx + 7, sy]], '#4a4440');
        Px.poly(g, [[sx - 6, sy - 1], [sx - 5, sy - 12], [sx, sy - 15], [sx + 5, sy - 12], [sx + 6, sy - 1]], '#8a8278');
        Font.draw(g, '?', sx - 3, sy - 12, (this.t >> 4) % 2 ? '#ffe060' : '#ffffff', { face: 'big' });
      } };
  }
  function bouncer(x, y) {
    const style = Themes.T[World.theme].bouncer;
    return { kind: 'bouncer', style, x, y, w: style === 'rhino' ? 40 : 26, h: style === 'rhino' ? 20 : 16, squash: 0, t: 0, dead: false,
      box() { return { x0: this.x - this.w / 2, y0: this.y - this.h, x1: this.x + this.w / 2, y1: this.y }; },
      update() { this.t++; if (this.squash > 0) this.squash--; },
      draw(g, cx, cy) {
        const sx = Math.round(this.x - cx), sy = Math.round(this.y - cy);
        if (this.style === 'rhino') { Art.draw(g, CharArt.get('rhino', this.squash > 0 ? 'squash' : 'idle', 0), sx, sy + 1); if (this.t % 90 < 45 && !this.squash) Font.draw(g, 'z', sx + 18, sy - 30 - ((this.t % 45) >> 3), '#ffffff', { face: 'small' }); return; }
        const sq = this.squash > 0 ? 3 : 0, glow = this.style === 'glowshroom';
        const cap = glow ? ['#1a6a7a', '#3ae0c8', '#c0fff0'] : ['#8a1a2a', '#e03a4a', '#ffb0b0'];
        Px.rect(g, sx - 4, sy - 10 + sq, 8, 10 - sq, glow ? '#a8c8d8' : '#f0e0c0'); Px.rect(g, sx - 4, sy - 10 + sq, 2, 10 - sq, glow ? '#88a8b8' : '#c8b898');
        Art.blob(g, sx, sy - 12 + sq, 13 + (sq ? 2 : 0), 7 - sq, 0, cap);
        for (const [dx, dy] of [[-6, -14], [2, -16], [7, -12], [-1, -11]]) Px.ellipse(g, sx + dx, sy + dy + sq, 1.6, 1.2, '#ffffff');
      } };
  }
  function geyser(x, y) {
    const hot = World.theme === 'volcano' || World.theme === 'final';
    return { kind: 'geyser', hot, x, y, w: 16, h: 80, t: Math.floor(Math.random() * 60), dead: false, period: 200,
      phase() { const p = this.t % this.period; return p < 120 ? 'idle' : p < 150 ? 'warn' : 'blow'; },
      box() { return { x0: this.x - 9, y0: this.y - 88, x1: this.x + 9, y1: this.y }; },
      update() { this.t++; const p = this.t % this.period; if (p === 150 && Game.onScreen(this.x, this.y)) Sfx(this.hot ? 'fireGeyser' : 'geyser'); },
      draw(g, cx, cy) {
        const sx = Math.round(this.x - cx), sy = Math.round(this.y - cy), ph = this.phase();
        Px.ellipse(g, sx, sy - 1, 9, 3, hot ? '#3a0a06' : '#2a2a24'); Px.ellipse(g, sx, sy - 2, 6, 2, hot ? '#ff6a1a' : '#5a6a5a');
        if (ph === 'warn' && this.t % 6 < 3) for (let k = 0; k < 3; k++) Px.ellipse(g, sx - 4 + k * 4, sy - 4 - (this.t % 5), 1.6, 1.6, hot ? '#ffb040' : '#d0e0e0');
        if (ph === 'blow') {
          const p = this.t % this.period - 150, hgt = Math.min(88, p * 9) * (p > 42 ? Math.max(0, (50 - p) / 8) : 1);
          const c = hot ? ['#a02008', '#e8500e', '#ff9a2a', '#fff0a0'] : ['#7a9aa4', '#c0d8dc', '#e8f4f4', '#ffffff'];
          for (let yy = 0; yy < hgt; yy += 2) {
            const k = yy / Math.max(1, hgt), w = 3 + k * 4 + Math.sin(yy * 0.35 + this.t * 0.7) * 1.4;
            Px.rect(g, sx - w, sy - yy - 3, w * 2, 2, c[k > 0.7 ? 2 : k > 0.3 ? 1 : 0]);
            Px.rect(g, sx - w * 0.35, sy - yy - 3, w * 0.7, 2, c[k > 0.5 ? 3 : 2]);
          }
          if (hgt > 8) for (let j = 0; j < 4; j++) {
            const a = this.t * 0.3 + j * 1.6, px = sx + Math.cos(a) * 6, py = sy - hgt - 2 + Math.sin(a * 1.3) * 3;
            if (hot) Px.poly(g, [[px - 3, py + 4], [px, py - 6 - (j % 2) * 3], [px + 3, py + 4]], c[(j + (this.t >> 2)) % 2 ? 2 : 3]);
            else Px.ellipse(g, px, py, 4 + (j % 2), 3, c[j % 2 ? 2 : 3]);
          }
        }
      } };
  }
  // horizontal (P) / vertical (V) movers and floating logs (D): pure functions of time
  function mover(ch, x, y) {
    let x1 = x, y1 = y;
    const tx = Math.floor(x / 16), ty = Math.floor((y - 16) / 16);
    if (ch === 'P') { const m = World.markers.find((k) => k[1] === ty && k[0] > tx); x1 = m ? m[0] * 16 + 8 : x + 64; }
    if (ch === 'V') { const m = World.markers.filter((k) => k[0] === tx && k[1] < ty).sort((a, b) => b[1] - a[1])[0]; y1 = m ? m[1] * 16 + 16 : y - 64; }
    const dist = Math.hypot(x1 - x, y1 - y), period = Math.max(120, dist / 0.8 * 2);
    const mv = { x: x - 20, y: y - 16, w: 40, dx: 0, dy: 0, solid: true, thin: true };
    World.movers.push(mv);
    const style = Themes.T[World.theme].platform;
    return { kind: 'mover', mv, x0: x, y0: y - 16, x1, y1: y1 - 16, period, dead: false,
      pos(t) { const k = 0.5 - 0.5 * Math.cos(t / this.period * Math.PI * 2); return [this.x0 + (this.x1 - this.x0) * k, this.y0 + (this.y1 - this.y0) * k]; },
      update() {
        const [px, py] = this.pos(Game.time);
        const nx = px - 20, ny = py;
        this.mv.dx = nx - this.mv.x; this.mv.dy = ny - this.mv.y; this.mv.x = nx; this.mv.y = ny;
      },
      draw(g, cx, cy) { Props.platform(g, style === 'branch' || style === 'branchburnt' ? 'log' : style, Math.round(this.mv.x - cx), Math.round(this.mv.y - cy), 2.5, World.theme); } };
  }
  function floatLog(x, y) {
    const mv = { x: x - 22, y: y - 19, w: 44, dx: 0, dy: 0, solid: true, thin: false };
    World.movers.push(mv);
    return { kind: 'log', mv, bx: x, by: y - 19, sink: 0, t: Math.random() * 100, dead: false,
      update() {
        this.t++;
        const on = Player.onGround && Player.mover === this.mv;
        this.sink = LP.approach(this.sink, on ? 3 : 0, 0.3);
        const ny = this.by + Math.sin(this.t / 30) * 1.2 + this.sink;
        this.mv.dy = ny - this.mv.y; this.mv.y = ny; this.mv.dx = 0;
      },
      draw(g, cx, cy) { drawLog(g, Math.round(this.mv.x - cx), Math.round(this.mv.y - cy), 44); } };
  }
  // a round floating log with bark, rings on the cut ends and a little moss
  function drawLog(g, sx, sy, w) {
    const night = World.theme === 'night';
    const c = night ? ['#141420', '#3a3048', '#5a4a6a', '#8a7aa0', '#b0a0c8'] : ['#2a160a', '#6a3e1c', '#94602e', '#c08a4a', '#e0b070'];
    Px.rect(g, sx + 3, sy, w - 6, 12, c[0]);
    Px.rect(g, sx + 3, sy + 1, w - 6, 10, c[1]);
    Px.rect(g, sx + 3, sy + 2, w - 6, 3, c[2]);
    Px.rect(g, sx + 3, sy + 2, w - 6, 1, c[3]);
    for (let k = 7; k < w - 7; k += 5) { Px.px(g, sx + k, sy + 6 + (k % 3), c[0]); Px.px(g, sx + k + 1, sy + 7 + (k % 3), c[0]); }
    for (const ex of [sx + 3, sx + w - 3]) { Px.ellipse(g, ex, sy + 6, 3, 6, c[0]); Px.ellipse(g, ex, sy + 6, 2, 5, c[4]); Px.ellipse(g, ex, sy + 6, 1, 2, c[2]); }
    for (let k = 8; k < w - 8; k += 7) { Px.px(g, sx + k, sy + 1, night ? '#3a8a7a' : '#4a9a3a'); Px.px(g, sx + k + 1, sy, night ? '#5ab8a0' : '#6ac04a'); }
  }
  function crumble(x, y) {
    const mv = { x: x - 8, y: y - 16, w: 16, dx: 0, dy: 0, solid: true, thin: true };
    World.movers.push(mv);
    const style = Themes.T[World.theme].platform;
    return { kind: 'crumble', mv, hx: x - 8, hy: y - 16, state: 'idle', t: 0, dead: false,
      update() {
        const on = Player.onGround && Player.mover === this.mv;
        if (this.state === 'idle' && on) { this.state = 'shake'; this.t = 0; Sfx('crack'); }
        else if (this.state === 'shake') { this.t++; this.mv.dx = 0; if (this.t > 26) { this.state = 'fall'; this.t = 0; this.vy = 0; } }
        else if (this.state === 'fall') { this.t++; this.vy = Math.min(this.vy + 0.3, 6); this.mv.dy = this.vy; this.mv.y += this.vy; if (this.t > 30) this.mv.solid = false; if (this.t > 240) { this.state = 'idle'; this.mv.y = this.hy; this.mv.dy = 0; this.mv.solid = true; } }
        if (this.state !== 'fall') this.mv.dy = 0;
      },
      draw(g, cx, cy) {
        if (this.state === 'fall' && this.t > 60) return;
        const shake = this.state === 'shake' ? ((this.t >> 1) % 2 ? 1 : -1) : 0;
        Props.platform(g, style === 'bone' ? 'bone' : style === 'branch' || style === 'log' || style === 'branchburnt' ? 'branch' : 'ledge', Math.round(this.mv.x - cx + shake), Math.round(this.mv.y - cy), 1, World.theme);
        if (this.state === 'shake') { g.fillStyle = '#2a1a10'; g.fillRect(Math.round(this.mv.x - cx + 7 + shake), Math.round(this.mv.y - cy + 2), 1, 5); }
      } };
  }
  // rope swing: anchor at the tile, rope 5 tiles long
  function swing(x, y) {
    const s = { kind: 'swing', ax: x, ay: y - 16, len: 76, ang: 0.5, av: 0, held: null, t: 0, dead: false,
      tip() { return [this.ax + Math.sin(this.ang) * this.len, this.ay + Math.cos(this.ang) * this.len]; },
      tipVel() { return [Math.cos(this.ang) * this.av * this.len, -Math.sin(this.ang) * this.av * this.len]; },
      grab(p) { this.held = p; const dx = p.x - this.ax; this.ang = Math.asin(LP.clamp(dx / this.len, -0.95, 0.95)); this.av += p.vx / this.len * 0.6; },
      release() { this.held = null; },
      pump(dir) { if (dir && Math.sign(this.av) === dir) this.av += dir * 0.0009; },
      update() {
        this.t++;
        this.av += -Math.sin(this.ang) * 0.0042;
        this.av *= this.held ? 0.999 : 0.995;
        if (!this.held && Math.abs(this.ang) < 0.25) this.av += Math.sin(this.t / 60) * 0.0004;
        this.ang = LP.clamp(this.ang + this.av, -1.25, 1.25);
      },
      draw(g, cx, cy) {
        const [tx, ty] = this.tip();
        const c = World.theme === 'night' ? ['#0a1a20', '#2e6a6e'] : World.theme === 'cave' ? ['#2a160a', '#7a5028'] : ['#0e2a0e', '#4a9a32'];
        const n = 24;
        for (let k = 0; k <= n; k++) { const x = this.ax + (tx - this.ax) * k / n, y = this.ay + (ty - this.ay) * k / n; g.fillStyle = c[0]; g.fillRect(Math.round(x - cx) - 1, Math.round(y - cy), 3, 3); g.fillStyle = c[1]; g.fillRect(Math.round(x - cx), Math.round(y - cy), 1, 2); }
        Px.ellipse(g, Math.round(this.ax - cx), Math.round(this.ay - cy), 3, 2, c[0]);
        if (!this.held) { Px.ellipse(g, Math.round(tx - cx), Math.round(ty - cy) + 2, 3, 3, c[1]); }
      } };
    return s;
  }
  function stalactite(x, y) {
    const top = y - 16;
    return { kind: 'stalactite', enemyShot: false, x, y: top, w: 10, h: 18, vy: 0, state: 'hang', t: 0, dead: false, home: top,
      box() { return this.state === 'fall' ? { x0: this.x - 5, y0: this.y, x1: this.x + 5, y1: this.y + 18 } : { x0: 0, y0: -99, x1: 0, y1: -99 }; },
      update() {
        if (this.state === 'hang') { if (Math.abs(Player.x - this.x) < 30 && Player.y > this.y) { this.state = 'shake'; this.t = 0; Sfx('crack'); } }
        else if (this.state === 'shake') { if (++this.t > 22) { this.state = 'fall'; } }
        else if (this.state === 'fall') { this.vy = Math.min(this.vy + 0.35, 7); this.y += this.vy; if (World.solidAt(this.x, this.y + 18)) { this.state = 'gone'; this.t = 0; G.burst(this.x, this.y + 14, 8, '#8a7aa8'); Sfx('rubble'); } }
        else if (++this.t > 300) { this.state = 'hang'; this.y = this.home; this.vy = 0; }
      },
      hurtsPlayer: true,
      draw(g, cx, cy) {
        if (this.state === 'gone') return;
        const R = Themes.T[World.theme].terrain.ramp, sx = Math.round(this.x - cx + (this.state === 'shake' ? (this.t % 2 ? 1 : -1) : 0)), sy = Math.round(this.y - cy);
        Px.poly(g, [[sx - 6, sy], [sx + 6, sy], [sx, sy + 18]], R[1]); Px.poly(g, [[sx - 3, sy], [sx + 1, sy], [sx - 1, sy + 14]], R[3]);
      } };
  }
  function bonusPortal(x, y) {
    return { kind: 'bonus', x, y, w: 24, h: 24, t: 0, dead: false, used: false,
      box() { return { x0: this.x - 12, y0: this.y - 28, x1: this.x + 12, y1: this.y }; },
      update() { this.t++; },
      draw(g, cx, cy) {
        if (this.used) return;
        // Toots waiting on a nest of twigs, beckoning
        const sx = Math.round(this.x - cx), sy = Math.round(this.y - cy);
        Px.ellipse(g, sx, sy - 3, 12, 4, '#5a3a1a'); Px.ellipse(g, sx, sy - 4, 9, 2.4, '#8a5a2a');
        Art.draw(g, CharArt.get('toots', (this.t >> 4) % 3 === 0 ? 'fly' : 'perch', this.t >> 3), sx, sy - 4);
        if ((this.t >> 4) % 2) Font.draw(g, 'BONUS', sx, sy - 40, '#ffe060', { face: 'small', align: 'center', outline: '#3a1a00' });
      } };
  }

  // ------------------------------------------------------------------ projectiles
  // { x, y, vx, vy, g, art, r, spin, life, frame(i) custom draw }
  function shot(o) {
    return Object.assign({ kind: 'shot', x: 0, y: 0, vx: 0, vy: 0, g: 0, r: 4, life: 300, t: 0, dead: false, deflectable: true, dmg: 1,
      box() { return { x0: this.x - this.r, y0: this.y - this.r, x1: this.x + this.r, y1: this.y + this.r }; },
      update() {
        this.t++; this.vy += this.g; this.x += this.vx; this.y += this.vy;
        if (this.t > this.life || this.y > World.ph + 40) this.dead = true;
        if (this.solidStop !== false && World.solidAt(this.x, this.y)) { this.dead = true; G.burst(this.x, this.y, 5, this.color || '#9a6a38'); }
      },
      draw(g, cx, cy) {
        if (this.drawFn) return this.drawFn(g, this.x - cx, this.y - cy, this.t);
        const f = CharArt.get(this.art, 'idle', 0);
        if (this.spin) { g.save(); g.translate(Math.round(this.x - cx), Math.round(this.y - cy)); g.rotate(Math.round(this.t / 4) * Math.PI / 2); Art.draw(g, f, 0, 0); g.restore(); }
        else Art.draw(g, f, this.x - cx, this.y - cy);
      } }, o);
  }

  // ------------------------------------------------------------------ registry
  const ENEMY = { b: 'beetle', h: 'hyena', j: 'jackal', s: 'snake', v: 'vulture', p: 'porcupine', k: 'monkey', c: 'croc', x: 'spider', a: 'bat', z: 'scorpion', g: 'boar', u: 'owl', n: 'wasp', f: 'fish' };
  function spawn(ch, x, y, extra) {
    if (ENEMY[ch]) return E[ENEMY[ch]](x, y);
    if (ITEMS[ch]) return item(ch, x, y);
    switch (ch) {
      case 'K': return checkpoint(x, y);
      case 'E': return exitMark(x, y);
      case 'i': return hintStone(x, y, extra);
      case 'R': return bouncer(x, y);
      case 'G': return geyser(x, y);
      case 'P': case 'V': return mover(ch, x, y);
      case 'D': return floatLog(x, y);
      case 'F': return crumble(x, y);
      case 'S': return swing(x, y);
      case 'l': return stalactite(x, y);
      case '$': return bonusPortal(x, y);
    }
    return null;
  }

  return { spawn, shot, enemy, walk, E, box, stars, itemFrame, ITEMS };
})();
