/* PLAYER — Slothba. Movement, the move set and his animation choice.
   Feet-anchored hitbox: (x, y) is the bottom centre. The game feeds one input snapshot
   per frame (Player.update(inp)) so the same code runs for the keyboard, a gamepad,
   or the test bot.
     inp = { left, right, up, down, jump, jumpP, attackP, roarP, downP }
   Moves: run (with skid), variable jump (coyote time + buffer), drop through branches,
   ledge grab + pull-up, hang hand-over-hand from vines/ribs, climb vines, roll (down
   while running), claw swipe, roar (stuns everything around), bounce on heads. */
'use strict';
const Player = (function () {
  const FORMS = {
    cub:   { look: 'cub', w: 14, h: 26, rollH: 14, run: 2.5, acc: 0.17, dec: 0.24, airAcc: 0.14, jumpV: 6.0, gHold: 0.24, g: 0.4, maxFall: 6.6,
             hangSpeed: 1.05, climbSpeed: 1.25, hand: 29, reach: [21, 18], roarR: 64, roarCharge: 300, hp: 4, dmg: 1 },
    adult: { look: 'adult', w: 16, h: 38, rollH: 18, run: 2.85, acc: 0.18, dec: 0.25, airAcc: 0.15, jumpV: 6.6, gHold: 0.25, g: 0.42, maxFall: 7.2,
             hangSpeed: 1.25, climbSpeed: 1.45, hand: 41, reach: [28, 26], roarR: 120, roarCharge: 240, hp: 5, dmg: 2 }
  };

  const P = {
    FORMS, x: 0, y: 0, vx: 0, vy: 0, form: 'cub', F: FORMS.cub, w: 14, h: 26, facing: 1,
    state: 'normal', onGround: false, coyote: 0, jumping: false, mover: null, slope: 0,
    hp: 4, maxHp: 4, roar: 1, invuln: 0, attackT: 0, attackCool: 0, hitSet: new Set(), roarT: 0,
    rolling: false, rollT: 0, idleT: 0, landT: 0, hurtT: 0, deadT: 0, dist: 0, crouch: false, lookUp: false,
    hangCool: 0, ledgeCool: 0, climbCool: 0, dropT: 0, barY: 0, ledge: null, pullT: 0, swing: null, swingCool: 0,
    frozen: false, winT: 0, lastSafe: null, fallStart: 0, combo: 0
  };

  P.setForm = function (form) {
    P.form = form; P.F = FORMS[form]; P.w = P.F.w; P.h = P.F.h;
  };
  P.reset = function (form, x, y, keepHp) {
    P.setForm(form);
    P.x = x; P.y = y; P.vx = 0; P.vy = 0; P.facing = 1; P.state = 'normal'; P.onGround = false; P.coyote = 0; P.jumping = false; P.mover = null;
    const diff = LP.Settings.get('difficulty');
    P.maxHp = P.F.hp + (diff === 0 ? 2 : diff === 2 ? -1 : 0);
    if (!keepHp) P.hp = P.maxHp;
    P.roar = 1; P.invuln = 0; P.attackT = 0; P.attackCool = 0; P.roarT = 0; P.rolling = false; P.rollT = 0; P.idleT = 0; P.landT = 0;
    P.hurtT = 0; P.deadT = 0; P.hangCool = 0; P.ledgeCool = 0; P.climbCool = 0; P.dropT = 0; P.swing = null; P.swingCool = 0; P.frozen = false; P.winT = 0;
    P.lastSafe = [x, y]; P.combo = 0;
  };

  // ------------------------------------------------------------------ geometry
  P.curH = () => (P.rolling ? P.F.rollH : P.crouch ? Math.round(P.F.h * 0.7) : P.F.h);
  P.box = () => { const h = P.curH(); return { x0: P.x - P.w / 2, y0: P.y - h, x1: P.x + P.w / 2, y1: P.y }; };
  P.attackBox = function () {
    if (P.attackT < 5 || P.attackT > 14) return null;
    const R = P.F.reach, cy = P.y - P.F.h * 0.55;
    const x0 = P.facing > 0 ? P.x + P.w / 2 - 6 : P.x - P.w / 2 + 6 - R[0];
    return { x0, y0: cy - R[1] / 2, x1: x0 + R[0], y1: cy + R[1] / 2 };
  };
  const headroom = (h) => W_clear(P.x - P.w / 2 + 1, P.x + P.w / 2 - 1, P.y - h, P.y - 2);
  function W_clear(xl, xr, top, bot) {
    for (let y = top; y <= bot; y += 8) for (const x of [xl, xr]) if (World.solidAt(x, y)) return false;
    for (const x of [xl, xr]) if (World.solidAt(x, bot)) return false;
    return true;
  }

  // ------------------------------------------------------------------ moving with collision
  function moveX(dx) {
    if (!dx) return 0;
    P.x += dx;
    const h = P.curH(), top = P.y - h + 1, bot = P.y - 1 - (P.onGround ? 8 : 0);
    if (dx > 0) {
      const tx = World.wall(P.x + P.w / 2 - 0.01, top, bot);
      if (tx !== null) { P.x = tx * 16 - P.w / 2; return 1; }
    } else {
      const tx = World.wall(P.x - P.w / 2, top, bot);
      if (tx !== null) { P.x = (tx + 1) * 16 + P.w / 2; return -1; }
    }
    return 0;
  }
  function moveY(dy, snap) {
    const h = P.curH();
    if (dy >= 0) {
      const prev = P.y, ny = P.y + dy;
      const from = prev - (P.onGround ? 8 : 0), to = ny + (snap ? 7 : 0);
      const f = World.floor(P.x - P.w / 2 + 1, P.x + P.w / 2 - 1, prev, from, to, P.dropT > 0);
      if (f) { P.y = f.y; P.vy = 0; const was = P.onGround; P.onGround = true; P.mover = f.m; P.slope = f.slope; return was ? 0 : 2; }
      P.y = ny; P.onGround = false; P.mover = null; P.slope = 0;
      return 0;
    }
    const ny = P.y + dy, ty = World.ceiling(P.x - P.w / 2 + 1, P.x + P.w / 2 - 1, ny - h);
    if (ty !== null) {
      // corner correction: a head that only clips the edge of a block slides around it
      for (let d = 1; d <= 5; d++) for (const s of [-1, 1]) {
        const nx = P.x + s * d;
        if (World.ceiling(nx - P.w / 2 + 1, nx + P.w / 2 - 1, ny - h) === null && W_clear(nx - P.w / 2 + 1, nx + P.w / 2 - 1, ny - h, P.y - 2)) {
          P.x = nx; P.y = ny; P.onGround = false; P.mover = null; return 0;
        }
      }
      P.y = (ty + 1) * 16 + h; P.vy = 0; P.jumping = false; P.onGround = false; return -1;
    }
    P.y = ny; P.onGround = false; P.mover = null;
    return 0;
  }

  // ------------------------------------------------------------------ events
  P.hurt = function (dmg, fromX) {
    if (P.invuln > 0 || P.state === 'dead' || P.frozen || Game.cheat.god) return false;
    P.hp -= dmg;
    if (Game.stats) Game.stats.hits++;
    Sfx('hurt');
    LP.FX.shake(3, 10);
    if (P.hp <= 0) { P.hp = 0; P.die(); return true; }
    P.state = 'hurt'; P.hurtT = 26; P.rolling = false; P.attackT = 0; P.roarT = 0; P.swing = null;
    P.vx = (P.x < (fromX === undefined ? P.x + P.facing : fromX) ? -1 : 1) * 2.2; P.vy = -3.6; P.onGround = false; P.jumping = false;
    P.invuln = 110;
    return true;
  };
  P.die = function () {
    if (P.state === 'dead') return;
    P.state = 'dead'; P.deadT = 0; P.vx = 0; P.vy = -6.5; P.rolling = false; P.swing = null; P.hp = 0;
    Sfx('die'); LP.Audio.stopMusic();
    LP.FX.shake(4, 16);
  };
  P.bounce = function (inp, power) {
    P.vy = -(inp && inp.jump ? P.F.jumpV * 1.02 : P.F.jumpV * 0.72) * (power || 1);
    P.jumping = !!(inp && inp.jump); P.onGround = false; P.coyote = 0; P.state = 'normal';
  };
  P.heal = function (n) { P.hp = Math.min(P.maxHp, P.hp + n); };

  // ------------------------------------------------------------------ update
  P.update = function (inp) {
    const F = P.F;
    if (P.invuln > 0) P.invuln--;
    if (P.attackCool > 0) P.attackCool--;
    if (P.hangCool > 0) P.hangCool--;
    if (P.ledgeCool > 0) P.ledgeCool--;
    if (P.climbCool > 0) P.climbCool--;
    if (P.swingCool > 0) P.swingCool--;
    if (P.dropT > 0) P.dropT--;
    if (P.landT > 0) P.landT--;
    if (P.roar < 1 && P.roarT === 0) P.roar = Math.min(1, P.roar + 1 / F.roarCharge);

    if (P.state === 'dead') {
      P.deadT++;
      if (P.deadT > 24) { P.vy = Math.min(P.vy + 0.3, 7); P.y += P.vy; }
      return;
    }
    if (P.frozen) { P.vx = 0; gravityOnly(); P.idleT = 0; return; }
    if (P.state === 'win') { P.winT++; P.vx = LP.approach(P.vx, 0, 0.2); gravityOnly(); return; }
    if (P.state === 'exit') { P.vx = P.facing * 1.6; P.facing = Math.sign(P.vx) || 1; gravityOnly(true); return; }

    switch (P.state) {
      case 'hang': return updateHang(inp);
      case 'climb': return updateClimb(inp);
      case 'ledge': return updateLedge(inp);
      case 'pull': return updatePull();
      case 'swing': return updateSwing(inp);
      case 'hurt': {
        P.hurtT--;
        P.vy = Math.min(P.vy + F.g, F.maxFall);
        moveX(P.vx); P.vx = LP.approach(P.vx, 0, 0.05);
        moveY(P.vy, false);
        hazards();
        if (P.hurtT <= 0 && (P.onGround || P.hurtT < -30)) P.state = 'normal';
        return;
      }
    }
    updateNormal(inp);
  };

  function gravityOnly(walk) {
    P.vy = Math.min(P.vy + P.F.g, P.F.maxFall);
    if (P.mover && P.onGround) { P.x += P.mover.dx; P.y += P.mover.dy; }
    if (walk) moveX(P.vx);
    moveY(P.vy, P.onGround);
  }

  function updateNormal(inp) {
    const F = P.F;
    let dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    const wasGround = P.onGround;
    // crouch / look up
    P.crouch = P.onGround && inp.down && !P.rolling && Math.abs(P.vx) < 1.3 && P.attackT === 0;
    P.lookUp = P.onGround && inp.up && !dir && !P.rolling && Math.abs(P.vx) < 0.3;
    // start a roll
    if (P.onGround && !P.rolling && inp.downP && Math.abs(P.vx) > 1.1 && P.attackT === 0) {
      P.rolling = true; P.rollT = 40; P.vx = Math.sign(P.vx) * Math.max(Math.abs(P.vx), F.run * 1.08); P.crouch = false;
      Sfx('roll'); G.dust(P.x - P.facing * 4, P.y, 4, '#e8d0a0', { dir: -P.facing });
    }
    if (P.crouch || P.roarT > 0 || (P.attackT > 0 && P.onGround)) dir = 0;
    if (P.rolling) {
      P.rollT--;
      if (P.onGround) {
        if (P.slope) { const down = P.slope === World.SL_R ? -1 : 1; P.vx = LP.clamp(P.vx + down * 0.14, -4.6, 4.6); if (Math.sign(P.vx) === down) P.rollT = Math.max(P.rollT, 6); }
        else P.vx = LP.approach(P.vx, 0, 0.02);
      }
      if (P.rollT <= 0 || Math.abs(P.vx) < 0.5) {
        if (headroom(F.h)) P.rolling = false;
        else { P.rollT = 4; if (Math.abs(P.vx) < 1.2) P.vx = (P.facing || 1) * 1.2; }
      }
      if (P.rolling && (Math.floor(P.dist / 18) !== Math.floor((P.dist + Math.abs(P.vx)) / 18)) && P.onGround) Sfx('rollstep');
    } else {
      const target = dir * F.run;
      if (P.onGround) {
        if (dir && Math.sign(P.vx) === -dir && Math.abs(P.vx) > 0.6) { P.vx = LP.approach(P.vx, target, F.dec * 1.5); if (Math.abs(P.vx) > 1.4 && LP.Loop.frame % 4 === 0) G.dust(P.x + P.facing * 4, P.y, 1, '#e8d8b0'); }
        else if (dir) P.vx = LP.approach(P.vx, target, F.acc);
        else P.vx = LP.approach(P.vx, 0, F.dec);
      } else {
        if (dir) P.vx = LP.approach(P.vx, target, F.airAcc);
        else P.vx = LP.approach(P.vx, 0, 0.03);
      }
      if (dir && (P.attackT === 0 || !P.onGround)) P.facing = dir;
    }

    // jump / drop through
    if (P.onGround) P.coyote = 7; else if (P.coyote > 0) P.coyote--;
    if (inp.jumpP && (P.onGround || P.coyote > 0) && P.roarT === 0) {
      const onOneWay = P.onGround && !P.mover && World.code(Math.floor(P.x / 16), Math.floor((P.y + 1) / 16)) === World.ONEWAY;
      const onThin = P.onGround && P.mover && P.mover.thin;
      if (inp.down && (onOneWay || onThin) && !P.rolling) {
        P.dropT = 12; P.onGround = false; P.y += 2; P.coyote = 0; P.mover = null;
      } else {
        P.vy = -F.jumpV - (Math.abs(P.vx) > 2 ? 0.25 : 0);
        P.onGround = false; P.coyote = 0; P.jumping = true; P.mover = null; P.crouch = false;
        Sfx('jump');
      }
      inp.jumpUsed = true;
    }
    // gravity with variable height
    if (P.jumping && !inp.jump && P.vy < -2) { P.vy *= 0.5; P.jumping = false; }
    const g = (P.vy < 0 && P.jumping && inp.jump) ? F.gHold : F.g;
    P.vy = Math.min(P.vy + g, F.maxFall);
    if (P.vy >= 0) P.jumping = false;

    // attack / roar
    if (inp.attackP && P.attackCool === 0 && P.roarT === 0) {
      P.attackT = 18; P.attackCool = 22; P.hitSet.clear(); P.rolling = false;
      Sfx(P.form === 'adult' ? 'swipeBig' : 'swipe');
    }
    if (P.attackT > 0) P.attackT--;
    if (inp.roarP && P.roarT === 0 && P.attackT === 0) {
      if (P.roar >= 1) { P.roarT = 44; P.roar = 0; P.rolling = false; Game.onRoar(P); }
      else Sfx('roarEmpty');
    }
    if (P.roarT > 0) P.roarT--;

    // ride movers
    if (P.mover && P.onGround) { P.x += P.mover.dx; P.y = P.mover.y + P.mover.dy; }
    const vyBefore = P.vy;
    const hit = moveX(P.vx);
    if (hit) { if (P.rolling) { P.vx = -P.vx * 0.4; if (Math.abs(P.vx) < 0.8) P.vx = 0; Sfx('bump'); } else P.vx = 0; }
    const r = moveY(P.vy, wasGround && !P.jumping && P.vy >= 0);
    P.dist += Math.abs(P.vx);
    if (r === 2) {
      P.landT = vyBefore > 4 ? 7 : 4; P.jumping = false;
      if (vyBefore > 3) { G.dust(P.x, P.y, vyBefore > 5.5 ? 6 : 3, '#e8d8b0'); Sfx('land'); }
    }
    if (P.onGround && !P.mover) P.lastSafe = [P.x, P.y];

    // idle timer
    if (P.onGround && !dir && Math.abs(P.vx) < 0.05 && !P.crouch && !P.lookUp && P.attackT === 0 && P.roarT === 0 && !inp.jump) P.idleT++;
    else P.idleT = 0;

    hazards();
    if (P.state !== 'normal') return;
    if (!P.onGround) tryGrabs(inp);
    else if (inp.up && !P.rolling && P.climbCool === 0 && World.climbAt(P.x, P.y - P.h * 0.5)) startClimb();
  }

  function hazards() {
    const b = P.box();
    if (World.spikeAt(b.x0 + 2, b.x1 - 2, b.y0, b.y1)) {
      if (P.hurt(1, P.x - P.facing)) { P.vy = -4.6; P.vx = -P.facing * 1.4; }
    }
    if (World.liquidAt(P.x, P.y - 3) !== null) { Sfx('splash'); P.die(); P.vy = -2; Game.onSplash(P.x, P.y); return; }
    if (P.y > World.ph + 48) P.die();
  }

  // ------------------------------------------------------------------ grabs
  function tryGrabs(inp) {
    const F = P.F;
    // swing vines (entities)
    if (P.swingCool === 0 && !P.rolling) {
      const s = Game.swingNear(P.x, P.y - F.hand);
      if (s) { P.state = 'swing'; P.swing = s; s.grab(P); P.attackT = 0; Sfx('grab'); return; }
    }
    // hang bars: hands just above the head
    if (P.hangCool === 0 && !inp.down && P.vy > -3.2) {
      const hy = P.y - F.hand;
      for (const dy of [-6, -2, 2, 6]) {
        if (World.hangAt(P.x, hy + dy)) {
          const barY = Math.floor((hy + dy) / 16) * 16 + 4;
          if (Math.abs(hy - barY) <= 8 && !World.solidAt(P.x, barY + 8)) {
            P.state = 'hang'; P.barY = barY; P.y = barY + F.hand; P.vx = 0; P.vy = 0; P.rolling = false; P.attackT = 0;
            Sfx('grab'); return;
          }
        }
      }
    }
    // climbing vines
    if (inp.up && P.climbCool === 0 && World.climbAt(P.x, P.y - P.h * 0.6)) { startClimb(); return; }
    // ledges
    if (P.ledgeCool === 0 && P.vy > 0.4 && !inp.down && !P.rolling) {
      const dirIn = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      const face = dirIn || P.facing;
      if (dirIn === 0 && Math.abs(P.vx) < 0.3) return;       // only when moving or pushing toward the wall
      const fx = face > 0 ? P.x + P.w / 2 + 2 : P.x - P.w / 2 - 2;
      const hand = P.y - P.h + 3, ty = Math.floor(hand / 16), top = ty * 16;
      if (hand - top > 9) return;
      const tx = Math.floor(fx / 16);
      if (!World.solidCode(World.code(tx, ty)) || World.solidCode(World.code(tx, ty - 1))) return;
      if (World.code(tx, ty) === World.BREAK) return;
      // room to stand on top
      const sx = face > 0 ? tx * 16 + 2 + P.w / 2 : (tx + 1) * 16 - 2 - P.w / 2;
      if (!W_clear(sx - P.w / 2 + 1, sx + P.w / 2 - 1, top - P.F.h, top - 2)) return;
      // and the body itself must be clear where it hangs
      P.state = 'ledge'; P.facing = face; P.ledge = { top, sx, tx };
      P.x = face > 0 ? tx * 16 - P.w / 2 : (tx + 1) * 16 + P.w / 2;
      P.y = top + P.h - 3; P.vx = 0; P.vy = 0; P.pullT = 0; P.attackT = 0;
      Sfx('grab');
    }
  }
  function startClimb() {
    const tx = Math.floor(P.x / 16);
    P.state = 'climb'; P.x = tx * 16 + 8; P.vx = 0; P.vy = 0; P.rolling = false; P.attackT = 0; P.climbX = P.x;
    Sfx('grab');
  }

  function updateHang(inp) {
    const F = P.F;
    const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (dir) P.facing = dir;
    let vx = dir * F.hangSpeed;
    if (vx && !World.hangAt(P.x + vx + dir * 4, P.barY)) vx = 0;
    if (vx) { const h = moveX(vx); if (h) vx = 0; }
    P.vx = vx; P.dist += Math.abs(vx);
    P.y = P.barY + F.hand;
    if (inp.attackP && P.attackCool === 0) { P.attackT = 18; P.attackCool = 22; P.hitSet.clear(); Sfx('swipe'); }
    if (P.attackT > 0) P.attackT--;
    if (inp.jumpP) {
      P.state = 'normal'; P.hangCool = 16; inp.jumpUsed = true;
      if (!World.solidAt(P.x, P.barY - 10)) { P.vy = -F.jumpV * 0.92; P.jumping = true; Sfx('jump'); }
      else P.vy = 0.5;
      return;
    }
    if (inp.downP) { P.state = 'normal'; P.hangCool = 16; P.vy = 0.5; return; }
    if (inp.up && World.climbAt(P.x, P.barY)) { startClimb(); return; }
    if (inp.roarP && P.roar >= 1) { P.roarT = 44; P.roar = 0; Game.onRoar(P); }
    if (P.roarT > 0) P.roarT--;
  }

  function updateClimb(inp) {
    const F = P.F;
    const v = ((inp.down ? 1 : 0) - (inp.up ? 1 : 0)) * F.climbSpeed;
    const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (dir) P.facing = dir;
    if (inp.jumpP) {
      P.state = 'normal'; P.climbCool = 14; inp.jumpUsed = true;
      P.vx = (dir || P.facing) * 2.2 * (dir ? 1 : 0.6); P.vy = -F.jumpV * 0.8; P.jumping = true; Sfx('jump');
      return;
    }
    if (inp.attackP && P.attackCool === 0) { P.attackT = 18; P.attackCool = 22; P.hitSet.clear(); Sfx('swipe'); }
    if (P.attackT > 0) P.attackT--;
    if (v < 0) {
      const ny = P.y + v;
      if (!World.climbAt(P.x, ny - P.h + 6)) {
        // top of the vine: step off onto a ledge beside or above it
        for (const side of [P.facing, -P.facing]) {
          const fx = P.x + side * 12, top = Math.floor((ny - P.h + 6) / 16) * 16 + 16;
          if (World.solidAt(fx, top + 2) && !World.solidAt(fx, top - 4) && W_clear(fx - P.w / 2 + 1, fx + P.w / 2 - 1, top - P.F.h, top - 2) && top >= P.y - P.h - 8) {
            P.state = 'pull'; P.facing = side; P.ledge = { top, sx: P.x + side * (P.w / 2 + 6) }; P.pullT = 0; P.pullFrom = [P.x, P.y]; Sfx('pull');
            return;
          }
        }
        // vine top in open air: pop up over it
        if (!World.solidAt(P.x, ny - P.h - 4)) { P.state = 'normal'; P.climbCool = 18; P.vy = -4.2; P.jumping = false; return; }
      } else if (World.ceiling(P.x - P.w / 2 + 1, P.x + P.w / 2 - 1, ny - P.h) === null) { P.y = ny; P.dist += -v; }
    } else if (v > 0) {
      const f = World.floor(P.x - P.w / 2 + 1, P.x + P.w / 2 - 1, P.y, P.y, P.y + v, true, true);
      if (f) { P.y = f.y; P.state = 'normal'; P.onGround = true; P.climbCool = 10; return; }
      P.y += v; P.dist += v;
      if (!World.climbAt(P.x, P.y - 8)) { P.state = 'normal'; P.climbCool = 14; P.vy = 0.5; return; }
    }
    if (inp.roarP && P.roar >= 1) { P.roarT = 44; P.roar = 0; Game.onRoar(P); }
    if (P.roarT > 0) P.roarT--;
    P.vx = 0; P.vy = 0;
  }

  function updateLedge(inp) {
    P.pullT++;
    const dirIn = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (inp.downP || dirIn === -P.facing) { P.state = 'normal'; P.ledgeCool = 18; P.vy = 0.5; return; }
    if (P.pullT > 5 && (inp.up || inp.jump || dirIn === P.facing || P.pullT > 16)) {
      P.state = 'pull'; P.pullT = 0; P.pullFrom = [P.x, P.y]; Sfx('pull');
    }
  }
  function updatePull() {
    P.pullT++;
    const [fx, fy] = P.pullFrom, L = P.ledge, n = 14;
    const t = Math.min(1, P.pullT / n);
    if (t < 0.6) P.y = fy + (L.top - fy) * (t / 0.6);
    else { P.y = L.top; P.x = fx + (L.sx - fx) * ((t - 0.6) / 0.4); }
    if (t >= 1) { P.state = 'normal'; P.onGround = true; P.vy = 0; P.vx = 0; P.x = L.sx; P.y = L.top; P.ledgeCool = 8; }
  }

  function updateSwing(inp) {
    const s = P.swing;
    const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    s.pump(dir);
    if (dir) P.facing = dir;
    const [hx, hy] = s.tip();
    P.x = hx; P.y = hy + P.F.hand;
    if (inp.jumpP) {
      const [vx, vy] = s.tipVel();
      P.state = 'normal'; P.swing = null; s.release(); P.swingCool = 24; inp.jumpUsed = true;
      P.vx = LP.clamp(vx * 1.15, -4.2, 4.2); P.vy = Math.min(vy * 1.1, 0) - 4.6; P.jumping = true; P.facing = Math.sign(P.vx) || P.facing;
      Sfx('jump');
    } else if (inp.downP) { P.state = 'normal'; P.swing = null; s.release(); P.swingCool = 24; P.vy = 1; }
  }

  // ------------------------------------------------------------------ animation + drawing
  P.anim = function () {
    const t = LP.Loop.frame;
    if (P.state === 'dead') return ['dead', 0];
    if (P.state === 'hurt') return ['hurt', 0];
    if (P.state === 'win') return ['win', (P.winT >> 4) & 1];
    if (P.state === 'hang') return Math.abs(P.vx) > 0.1 ? ['hangmove', Math.floor(P.dist / 6)] : P.attackT > 0 ? ['hangmove', 0] : ['hang', (t >> 4)];
    if (P.state === 'climb') return ['climb', Math.floor(P.dist / 6)];
    if (P.state === 'ledge') return ['pull', 0];
    if (P.state === 'pull') return ['pull', P.pullT > 7 ? 1 : 0];
    if (P.rolling) return ['roll', Math.floor(P.dist / 3.5)];
    if (P.roarT > 0) return ['roar', (t >> 2) & 1];
    if (P.attackT > 0) return ['attack', P.attackT > 13 ? 0 : P.attackT > 6 ? 1 : 2];
    if (!P.onGround) {
      if (P.vy < -1.4) return ['jump', 0];
      if (P.vy < 1.4) return ['peak', 0];
      return ['fall', (t >> 3) & 1];
    }
    if (P.landT > 0) return ['land', 0];
    const dir = Math.sign(P.vx);
    if (P.crouch) return ['crouch', 0];
    if (Math.abs(P.vx) > 0.25) {
      if (dir !== P.facing && Math.abs(P.vx) > 1) return ['skid', 0];
      return ['run', Math.floor(P.dist / 5.2)];
    }
    if (P.lookUp) return ['lookup', 0];
    if (P.idleT > 720) return ['sleep', (t >> 5) & 1];
    if (P.idleT > 520) return ['yawn', 0];
    if ((t % 200) < 8) return ['blink', 0];
    return ['idle', (t >> 4) & 3];
  };

  P.draw = function (g, cx, cy) {
    if (P.invuln > 0 && P.state !== 'dead' && (P.invuln >> 2) % 2 === 0) return;
    const look = P.F.look;
    if (P.state === 'swing' && P.swing) {
      const f = SlothArt.swing(look, P.swing.ang * (P.facing > 0 ? 1 : -1));
      const [hx, hy] = P.swing.tip();
      Art.draw(g, f, hx - cx, hy - cy, P.facing < 0);
      return;
    }
    const [a, i] = P.anim();
    const f = SlothArt.get(look, a, i);
    Art.draw(g, f, P.x - cx, P.y - cy, P.facing < 0);
    // claw swipe smear
    if (P.attackT >= 6 && P.attackT <= 13) {
      const R = P.F.reach, k = (13 - P.attackT) / 7, cxp = P.x - cx + P.facing * (P.w / 2 + R[0] * 0.35), cyp = P.y - cy - P.F.h * 0.55;
      const rr = R[0] * 0.75;
      for (let j = 0; j < 14; j++) {
        const a0 = -1.4 + j * 0.2 + k * 0.5;
        if (a0 > -1.4 + k * 2.8) break;
        const px0 = cxp + Math.cos(a0) * rr * P.facing, py0 = cyp + Math.sin(a0) * rr;
        g.fillStyle = j > 10 ? '#ffffff' : j > 5 ? '#fff4c0' : '#ffd060';
        g.fillRect(Math.round(px0), Math.round(py0), 2, 2);
        g.fillStyle = 'rgba(255,255,255,0.5)';
        g.fillRect(Math.round(cxp + Math.cos(a0) * (rr - 3) * P.facing), Math.round(cyp + Math.sin(a0) * (rr - 3)), 1, 1);
      }
    }
    if (P.state === 'normal' && P.idleT > 720 && (LP.Loop.frame % 50) === 0) Game.popup(P.x + P.facing * 8, P.y - P.h - 4, 'z', '#d0e8ff');
  };

  return P;
})();
