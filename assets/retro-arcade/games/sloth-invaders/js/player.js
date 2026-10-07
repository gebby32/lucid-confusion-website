/* PLAYER — one penguin, one tiny fighter, one energy cannon.
   Movement is instant (no acceleration) and the hitbox is smaller than the ship.
   One shot on screen at a time unless RAPID; holding FIRE refires as soon as allowed.
   control = { left, right, fire } so the attract-mode pilot can fly it too. */
'use strict';
const Player = {
  create() {
    const C = GAME_CONFIG.player;
    return {
      x: 192, y: C.y, alive: true, invul: C.respawnInvul, shots: [], cool: 0, t: 0,
      power: null, powerT: 0, shield: 0, glareT: 6, deadT: 0, fired: 0, hits: 0, wobble: 0, moving: 0
    };
  },
  box(p) { return { x: p.x - 5, y: p.y + 4, w: 10, h: 9 }; },             // the art is 17x13
  bodyBox(p) { return { x: p.x - 8, y: p.y, w: 17, h: 13 }; },

  update(p, dt, ctl) {
    const C = GAME_CONFIG.player;
    p.t += dt;
    if (p.invul > 0) p.invul -= dt;
    if (p.cool > 0) p.cool--;
    if (p.glareT > 0) p.glareT -= dt; else if (LP.chance(0.004)) p.glareT = LP.rand(4, 9);
    if (p.power && p.power !== 'shield' && (p.powerT -= dt) <= 0) Player.endPower(p);
    if (p.shield > 0 && (p.shield -= dt) <= 0) { p.shield = 0; if (p.power === 'shield') p.power = null; GameAudio.powerDown(); }

    const d = (ctl.right ? 1 : 0) - (ctl.left ? 1 : 0);
    p.moving = d;
    p.x = LP.clamp(p.x + d * C.speed, C.minX, C.maxX);
    if (ctl.fire) Player.fire(p);
  },

  maxShots(p) { return p.power === 'rapid' ? 3 : 1; },
  fire(p) {
    const live = new Set(p.shots.map((s) => s.volley)).size;
    if (p.cool > 0 || live >= Player.maxShots(p)) return false;
    const C = GAME_CONFIG.player, pierce = p.power === 'pierce' ? 4 : 0, volley = ++p.fired;
    const mk = (x) => p.shots.push({ x, y: p.y - 6, prevY: p.y - 6, pierce, volley, hitSet: new Set(), scored: false });
    if (p.power === 'double') { mk(p.x - 4); mk(p.x + 4); } else mk(p.x);
    p.cool = p.power === 'rapid' ? 7 : C.cooldown;
    GameAudio.playerShot(p.power);
    return true;
  },

  givePower(p, kind) {
    const T = GAME_CONFIG.rules.powerups;
    if (kind === 'freeze') { Formation.freezeT = T.freeze; GameAudio.freeze(); return; }
    if (kind === 'shield') { p.shield = T.shield; if (!p.power) p.power = 'shield'; GameAudio.shieldUp(); return; }
    p.power = kind; p.powerT = T[kind];
    GameAudio.powerUp();
  },
  endPower(p) { p.power = p.shield > 0 ? 'shield' : null; p.powerT = 0; GameAudio.powerDown(); },

  // shots move and are tested against everything by Game (it owns the scoring)
  moveShots(p, hitTest) {
    const sp = GAME_CONFIG.player.shotSpeed;
    LP.prune(p.shots, (s) => {
      s.prevY = s.y;
      s.y -= sp;
      if (s.y < 16) { Game.shotMissed(s); return true; }
      return hitTest(s);
    });
  },

  draw(p) {
    const g = LP.LCD.ctx, t = p.t;
    if (!p.alive) return;
    if (p.invul > 0 && Math.floor(t * 15) % 2) return;
    const x = Math.round(p.x) - 8, y = p.y;
    // engine flame (flickers; longer while moving)
    const f = Math.floor(t * 20) % 2, len = 2 + f + (p.moving ? 1 : 0);
    G.rect(x + 8, y + 13, 1, len, f ? '#ffd040' : '#58d8ff');
    G.rect(x + 5, y + 12, 1, 1 + f, '#3a8aff'); G.rect(x + 11, y + 12, 1, 2 - f, '#3a8aff');
    g.drawImage(p.glareT > 0 && p.glareT < 0.6 ? Sprites.playerGlare : Sprites.player, x, y);
    if (p.shield > 0 && (p.shield > 2 || Math.floor(t * 10) % 2)) {
      const k = Math.floor(t * 8) % 4;
      g.fillStyle = k < 2 ? '#58d8ff' : '#1a8aff';
      for (let a = 0; a < 32; a++) {
        const r = a / 32 * Math.PI * 2;
        if ((a + k) % 4 === 0) continue;
        g.fillRect(Math.round(p.x + Math.cos(r) * 12), Math.round(y + 7 + Math.sin(r) * 9), 1, 1);
      }
    }
  },
  drawShots(p) {
    const g = LP.LCD.ctx;
    for (const s of p.shots) g.drawImage(s.pierce ? Sprites.shotPierce : Sprites.shot, Math.round(s.x) - 1, Math.round(s.y));
  },

  // the debris of a penguin fighter (2-frame flicker, then smoke)
  drawWreck(p) {
    const g = LP.LCD.ctx, k = Math.floor(p.deadT * 12) % 2;
    if (p.deadT < 1.4) g.drawImage(Sprites.boom[k], Math.round(p.x) - 9, p.y + 3);
    else if (p.deadT < 2.2 && k) g.drawImage(Sprites.boom[1], Math.round(p.x) - 9, p.y + 3);
  }
};
