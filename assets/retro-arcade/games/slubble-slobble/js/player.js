/* PLAYERS — Slub (green) and Slob (blue). Arcade-tight movement under deliberately
   expensive-looking sloths: instant turns, a touch of momentum, coyote time, jump buffer,
   variable jump height, drop-through (DOWN + JUMP), ladders, swimming, springs.
   The hitbox (12x16) is far smaller than the render, so collisions feel fair.
   Animation is only gentle transforms of the supplied renders (see Players.queueDraw). */
'use strict';
const Players = (function () {
  const CFG = GAME_CONFIG.sloth;
  const P = {
    list: [], solo: true,

    // who: 'slub' | 'slob'. In one-player mode the sloth listens to both control sets.
    create(idx, who, solo) {
      return {
        idx, who, solo, x: 0, y: 0, w: CFG.w, h: CFG.h, vx: 0, vy: 0, dir: who === 'slub' ? 1 : -1,
        onGround: false, ground: 0, coyote: 0, jumpBuf: 0, fireCool: 0, recoil: 0, glow: 0,
        invul: 0, stun: 0, lives: GAME_CONFIG.rules.lives, score: 0, nextLife: GAME_CONFIG.rules.extraLife[0],
        out: false, dying: 0, joined: true, power: {}, riding: null, climbing: false, drop: 0, tp: 0,
        t: 0, walk: 0, landT: 0, hurtT: 0, victory: false, bounced: 0, hitsThisLevel: 0, swimCool: 0, continues: 0
      };
    },
    setup(mode, who) {
      P.solo = mode === 1;
      P.list = mode === 1 ? [P.create(0, who, true)] : [P.create(0, 'slub', false), P.create(1, 'slob', false)];
    },
    held(p, a) {
      const I = LP.Input;
      if (p.solo) return I.held('p1' + a) || I.held('p2' + a);
      return I.held('p' + (p.idx + 1) + a);
    },
    pressed(p, a) {
      const I = LP.Input;
      if (p.solo) return I.pressed('p1' + a) || I.pressed('p2' + a);
      return I.pressed('p' + (p.idx + 1) + a);
    },
    active: (p) => p && !p.out && !p.dying,

    place(p, slot) {
      const left = slot === 0, spot = World.safeSpot(left ? 5 : 26);
      p.x = spot.x; p.y = spot.y; p.dir = left ? 1 : -1;
      p.vx = p.vy = 0; p.onGround = false; p.riding = null; p.climbing = false; p.drop = 0;
      p.victory = false; p.hitsThisLevel = 0;
    },
    startLevel() {
      P.list.forEach((p, i) => { P.place(p, P.solo ? (p.who === 'slub' ? 0 : 1) : i); p.invul = Math.max(p.invul, 1.2); });
    },

    givePower(p, id) {
      const def = POWERS[id];
      if (id === 'freeze') { Game.freeze = def.time * 60; LP.Audio.play('freeze'); return; }
      if (id === 'shield') { p.power.shield = def.time * 60; return; }
      if (id === 'triple') delete p.power.giant;
      if (id === 'giant') delete p.power.triple;
      p.power[id] = def.time * 60;
    },
    vacuumNear(it) {
      for (const p of P.list) if (P.active(p) && p.power.vacuum && Math.hypot(p.x - it.x, p.y - it.y) < 90) return p;
      return null;
    },

    update() {
      for (const p of P.list) P.updateOne(p);
    },
    updateOne(p) {
      p.t++;
      if (p.out) return;
      if (p.dying > 0) {                      // tumbling off the screen
        p.dying++; p.vy += 0.15; p.y += p.vy; p.x += p.vx;
        if (p.dying > 110) { p.dying = 0; p.out = true; Game.playerOut(p); }
        return;
      }
      for (const k in p.power) if (--p.power[k] <= 0) delete p.power[k];
      if (p.invul > 0) p.invul -= 1 / 60;
      if (p.fireCool > 0) p.fireCool--;
      if (p.recoil > 0) p.recoil--;
      if (p.glow > 0) p.glow -= 0.12;
      if (p.landT > 0) p.landT--;
      if (p.bounced > 0) p.bounced--;
      if (p.tp > 0) p.tp--;
      if (p.swimCool > 0) p.swimCool--;
      const ctl = (Game.phase === 'play' || Game.phase === 'clear') && p.stun <= 0;
      if (p.stun > 0) p.stun--;
      if (p.hurtT > 0) p.hurtT--;

      const L = ctl && P.held(p, 'left'), Rt = ctl && P.held(p, 'right'), Dn = ctl && P.held(p, 'down'), Up = ctl && P.held(p, 'up');
      if (ctl && P.pressed(p, 'jump')) p.jumpBuf = CFG.buffer;
      else if (p.jumpBuf > 0) p.jumpBuf--;
      const water = World.inWater(p);
      const ice = p.onGround && p.ground === TILE.ICE;

      // ---- riding a bubble: carried upward until you jump off or it pops
      if (p.riding) {
        const b = p.riding;
        if (b.dead || (!ctl && Game.phase !== 'intro')) { p.riding = null; }
        else {
          p.x = b.x + LP.clamp(p.x - b.x + ((Rt ? 0.8 : 0) - (L ? 0.8 : 0)), -b.r, b.r);
          p.y = b.y - b.r + 1; p.vx = 0; p.vy = 0;
          if (L) p.dir = -1; if (Rt) p.dir = 1;
          b.vy = Math.min(b.vy, -0.25);
          if (p.jumpBuf > 0) { p.riding = null; b.rider = null; p.vy = -CFG.jumpV; p.jumpBuf = 0; LP.Audio.play('jump'); B_pop(b, p); }
          if (ctl && P.pressed(p, 'fire')) P.fire(p);
          P.hazards(p);
          return;
        }
      }

      // ---- ladders (UP climbs; jump buttons still jump)
      const onLadder = World.ladderAt(p.x, p.y - 4) || World.ladderAt(p.x, p.y + 2);
      if (!p.climbing && onLadder && (Up || (Dn && World.ladderAt(p.x, p.y + 4))) && ctl) { p.climbing = true; p.jumpBuf = 0; }
      if (p.climbing) {
        p.vx = (Rt ? 0.6 : 0) - (L ? 0.6 : 0);
        p.vy = Up ? -1.1 : Dn ? 1.1 : 0;
        p.x += ((Math.floor(p.x / 8) * 8 + 4) - p.x) * 0.25;
        p.x += p.vx; p.y += p.vy;
        const still = World.ladderAt(p.x, p.y - 2) || World.ladderAt(p.x, p.y + 1);
        if (!still) {
          p.climbing = false; p.vy = 0;
          // stepped off the top: snap onto the ladder's top
          if (Up) p.y = Math.ceil((p.y - World.TOP) / 8) * 8 + World.TOP;
        }
        if (ctl && P.pressed(p, 'fire')) P.fire(p);
        if (!Up && p.jumpBuf > 0 && !P.held(p, 'up')) { p.climbing = false; p.vy = -CFG.jumpV * 0.9; p.jumpBuf = 0; LP.Audio.play('jump'); }
        p.onGround = false;
        P.hazards(p);
        return;
      }

      // ---- horizontal
      const speedMul = (p.power.speed ? 1.75 : 1) * (water ? 0.7 : 1);
      const target = ((Rt ? 1 : 0) - (L ? 1 : 0)) * CFG.walk * speedMul;
      if (L && !Rt) p.dir = -1; else if (Rt && !L) p.dir = 1;
      let acc;
      if (target === 0) acc = ice ? CFG.iceDecel : p.onGround ? CFG.decel : CFG.airAccel * 0.6;
      else if (Math.sign(target) !== Math.sign(p.vx) && p.vx !== 0) acc = ice ? CFG.iceAccel * 1.5 : p.onGround ? CFG.turn : CFG.airAccel * 1.4;
      else acc = ice ? CFG.iceAccel : p.onGround ? CFG.accel : CFG.airAccel;
      p.vx = LP.approach(p.vx, target, acc * speedMul);
      if (!p.onGround) p.vx += World.wind * 0.35;

      // ---- jumping / dropping / swimming
      if (p.onGround) p.coyote = CFG.coyote; else if (p.coyote > 0) p.coyote--;
      if (p.jumpBuf > 0) {
        if (water && !p.onGround) {
          // near the surface a stroke becomes a proper leap out of the water
          if (p.y - p.h - World.waterY < 6) { p.vy = -CFG.jumpV * 0.95; p.jumpBuf = 0; p.swimCool = 12; LP.Audio.play('jump'); G.burst(p.x, World.waterY, 6, '#a4e4fc', { speed: 1.2 }); }
          else if (p.swimCool <= 0) { p.vy = -CFG.swimV; p.jumpBuf = 0; p.swimCool = 8; LP.Audio.play('swim'); }
        } else if (Dn && p.onGround && p.ground !== TILE.SOLID && p.y < World.BOT - 4) {
          p.drop = 14; p.vy = 0.8; p.jumpBuf = 0; p.onGround = false; p.coyote = 0;
        } else if (p.onGround || p.coyote > 0) {
          p.vy = -(p.power.jump ? CFG.superJumpV : CFG.jumpV) * (water ? 0.75 : 1);
          p.onGround = false; p.coyote = 0; p.jumpBuf = 0;
          LP.Audio.play('jump');
        }
      }
      // ---- gravity (released jump = shorter hop)
      const gmul = World.grav;
      if (water) { p.vy = Math.min(p.vy + CFG.waterGravity * gmul, CFG.waterMaxFall); }
      else {
        const rising = p.vy < 0;
        const g = rising && !P.held(p, 'jump') && !p.bounced ? CFG.cutGravity : CFG.gravity;
        p.vy = Math.min(p.vy + g * gmul, CFG.maxFall);
      }
      if (p.drop > 0) p.drop--;
      const wasGround = p.onGround;
      World.move(p);
      if (p.landed) {
        p.landT = 8;
        if (!water) { LP.Audio.play('land'); G.dust(p.x, p.y, 3, '#fcfcfc'); }
      }
      if (p.onGround && p.ground === TILE.SPRING) {
        p.vy = -6.6 * (World.grav < 1 ? 0.85 : 1); p.onGround = false; p.bounced = 20;
        World.springAt(Math.floor(p.x / 8), Math.floor((p.y - World.TOP) / 8));
        LP.Audio.play('spring');
      }
      if (World.teleport(p)) { LP.Audio.play('warp'); G.burst(p.x, p.y - 8, 10, '#00e8d8', { speed: 1.5 }); }
      if (!wasGround && p.onGround) p.vx *= 0.9;
      p.walk += p.onGround ? Math.abs(p.vx) * 0.16 : 0;

      if (ctl && P.pressed(p, 'fire')) P.fire(p);
      P.hazards(p);
    },

    fire(p) {
      if (p.fireCool > 0) return;
      Bubbles.fire(p);
      p.fireCool = p.power.rapid ? CFG.rapidCool : CFG.fireCool;
      p.recoil = 8; p.glow = 1;
      if (p.power.rainbow) p.power.rainbow = Math.max(1, p.power.rainbow);
      LP.Audio.play('fire', { who: p.who });
    },

    // everything that can hurt a sloth
    hazards(p) {
      if (Game.phase !== 'play') return;
      const box = { x: p.x - p.w / 2 + 1, y: p.y - p.h + 2, w: p.w - 2, h: p.h - 2 };
      const fh = World.floorHazard(p);
      if (fh === 'lava' && p.invul > 0) { P.respawn(p); return; }            // never stand in lava
      if (fh) { P.hurt(p, p.x - p.dir, fh === 'lava'); if (fh === 'lava') return; }
      if (World.flameHit(box)) P.hurt(p, p.x - p.dir);
      if (p.invul > 0) return;
      for (const e of Enemies.list) {
        if (e.state !== 'live' || e.appear > 0 || e.fade || e.dead_) continue;
        if (LP.Hit.overlap(box, { x: e.x - e.w / 2 + 1, y: e.y - e.h + 1, w: e.w - 2, h: e.h - 2 })) { P.hurt(p, e.x); return; }
      }
      for (const s of Enemies.shots) {
        if (s.dead || s.friendly) continue;
        if (LP.Hit.rectCircle(box, s)) { s.dead = true; P.hurt(p, s.x); return; }
      }
      if (Bosses.hurts(box)) P.hurt(p, Bosses.x());
    },

    hurt(p, fromX, respawn) {
      if (p.invul > 0 || p.dying || p.out || Game.phase !== 'play') return;
      if (p.power.shield) {
        delete p.power.shield; p.invul = 1.2;
        LP.Audio.play('shieldPop'); G.burst(p.x, p.y - 10, 12, '#a4e4fc', { speed: 2 });
        if (respawn) P.respawn(p);
        return;
      }
      p.lives--; p.hitsThisLevel++;
      Game.noDamage = false;
      p.riding = null; p.climbing = false;
      LP.FX.shake(3, 10);
      if (p.lives <= 0) {
        p.dying = 1; p.vx = (p.x < fromX ? -1 : 1) * 1.2; p.vy = -4.2; p.invul = 0;
        LP.Audio.play('death');
        return;
      }
      LP.Audio.play('hurt');
      p.invul = CFG.invul; p.stun = CFG.hurtStun; p.hurtT = 30;
      p.vx = (p.x < fromX ? -1 : 1) * 2.2; p.vy = -2.6;
      if (respawn) P.respawn(p);
    },
    respawn(p) {
      const slot = P.solo ? (p.who === 'slub' ? 0 : 1) : p.idx;
      P.place(p, slot);
      p.vy = 0; p.invul = Math.max(p.invul, CFG.invul);
      LP.Audio.play('respawn');
    },
    revive(p) {                                // after a continue
      p.out = false; p.dying = 0; p.lives = GAME_CONFIG.rules.lives; p.power = {};
      P.respawn(p);
    },

    // ---------------------------------------------------------------- drawing
    // Queue the hi-res render (drawn after the pixel picture is scaled — see main.js)
    queueDraw(p) {
      if (p.out) return;
      const t = p.t;
      let x = p.x, y = p.y, sx = 1, sy = 1, rot = 0, alpha = 1, white = 0, dir = p.dir, h = CFG.drawH;
      if (p.dying) {
        rot = p.dying * 0.18 * (p.vx < 0 ? -1 : 1);
        y -= 10; white = p.dying < 8 ? 1 : 0;
        Sloths.queue({ who: p.who, dir, x, y: y + 12, h, rot, alpha: 1, white });
        return;
      }
      if (p.victory) {
        const ph = t * 0.13;
        y -= Math.abs(Math.sin(ph)) * 7;
        rot = Math.sin(ph) * 0.07;
        dir = Math.floor(t / 36) % 2 ? -1 : 1;
        sy = 1 + Math.abs(Math.cos(ph)) * 0.03;
      } else if (p.climbing) {
        rot = Math.sin(t * 0.25) * 0.05;
      } else if (p.riding) {
        rot = Math.sin(t * 0.1) * 0.06; sy = 0.99;
      } else if (!p.onGround) {
        if (World.inWater(p)) rot = Math.sin(t * 0.08) * 0.08;
        else if (p.vy < 0) { sy = 1.045; sx = 0.97; rot = -0.06 * dir; }
        else { sy = 0.985; rot = 0.05 * dir; }
      } else if (Math.abs(p.vx) > 0.2) {
        const ph = p.walk;
        y -= Math.abs(Math.sin(ph)) * 1.4;
        rot = Math.sin(ph) * 0.045;
      } else {
        const b = Math.sin(t * 0.06);
        sy = 1 + b * 0.016; sx = 1 - b * 0.008;          // breathing
      }
      if (p.landT > 0) { const k = p.landT / 8; sy *= 1 - 0.08 * k; sx *= 1 + 0.06 * k; }
      if (p.recoil > 0) { const k = p.recoil / 8; x -= dir * k * 1.6; rot -= dir * 0.07 * k; }
      if (p.hurtT > 0) { rot += Math.sin(t * 0.9) * 0.12 * (p.hurtT / 30); white = p.hurtT > 24 ? 0.8 : 0; }
      if (p.invul > 0 && !p.victory && (t >> 2) % 2) alpha = 0.35;
      Sloths.queue({ who: p.who, dir, x, y: y + 1, h, sx, sy, rot, alpha, white, glow: Math.max(0, p.glow) });
    },
    // pixel-art extras drawn in FRONT of the render (shield bubble, power timers)
    drawFront(p) {
      if (p.out || p.dying) return;
      if (p.power.shield) {
        const r = 15 + ((p.t >> 3) & 1);
        G.ring(p.x, p.y - 13, r, (p.t >> 2) % 2 ? '#a4e4fc' : '#fcfcfc');
        G.px(p.x - 8, p.y - 22, '#fcfcfc'); G.px(p.x - 9, p.y - 21, '#fcfcfc');
      }
      if (p.power.speed && (p.t >> 1) % 2 && p.onGround && Math.abs(p.vx) > 1) G.dust(p.x - p.dir * 6, p.y, 1, '#f8b800');
      if (!P.solo && Game.phase === 'intro') G.textC(p.idx ? '2P' : '1P', p.x, p.y - 36, p.idx ? '#3cbcfc' : '#b8f818', { face: 'small' });
    }
  };
  function B_pop(b, p) { /* jumping off a ridden bubble leaves it floating */ b.vy = 0.6; }
  return P;
})();
