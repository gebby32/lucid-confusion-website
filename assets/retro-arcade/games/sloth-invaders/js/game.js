/* GAME — one play session: score, lives, waves, scoring rules, collisions, deaths,
   wave clears, boss encounters and the HUD.
   Phases inside the 'game' app state:
     intro -> play -> dying | landed | clear (tally) -> intro (next wave) ...
   Game.demo = true runs the same game for the attract mode, flown by Autopilot. */
'use strict';
const Game = {
  score: 0, hi: 0, lives: 3, wave: 1, def: null, player: null, phase: 'intro', phaseT: 0,
  extraNext: 0, demo: false, pops: [], tally: null, banner: null, hitVolleys: new Set(), startFy: 0, firstWave: true,

  get R() { return GAME_CONFIG.rules; },

  newGame(demo) {
    const R = Game.R;
    Object.assign(Game, { score: 0, lives: R.lives, wave: 1, extraNext: R.extraLife[0], demo: !!demo, firstWave: true });
    LP.Scores.list().then((l) => { Game.hi = l.length ? l[0].score : 0; });
    LP.Loop.reset();
    Game.player = Player.create();
    Game.startWave(1);
  },

  startWave(w) {
    const d = Game.def = Waves.def(w);
    Game.wave = w;
    Backdrop.setWave(w);
    Bullets.reset();
    Barriers.build(d.barrierDamage);
    Slothership.reset();
    if (d.kind === 'boss') { Formation.load(Object.assign({}, d, { layout: { rows: [''] } })); Boss.start(d.level); }
    else { Formation.load(d); Boss.b = null; }
    Game.startFy = Formation.fy;
    const p = Game.player;
    p.shots = []; p.fired = 0; p.hits = 0; p.alive = true; p.invul = 0;
    Game.hitVolleys = new Set();
    Object.assign(Game, { phase: 'intro', phaseT: 0, pops: [], tally: null, banner: null });
    GameAudio.resetMarch();
    LP.Audio.stopMusic();
    LP.FX.clear();
    LP.Audio.play(d.kind === 'boss' ? 'bossWarning' : d.kind === 'special' ? 'special' : 'waveStart');
  },

  introLength() { const k = Game.def.kind; return k === 'boss' ? 3.6 : k === 'special' ? 3.2 : Game.firstWave ? 2.6 : 2; },

  control() {
    if (Game.demo) return Autopilot.control();
    const I = LP.Input;
    return { left: I.held('left'), right: I.held('right'), fire: I.held('fire') || I.pressed('fire') };
  },

  // ------------------------------------------------------------------ update
  update(dt) {
    Game.phaseT += dt;
    const p = Game.player;
    switch (Game.phase) {
      case 'intro': {
        const c = Game.control();
        Player.update(p, dt, { left: c.left, right: c.right, fire: false });
        Boss.update(dt, { px: p.x, firing: false });
        if (Game.phaseT > Game.introLength()) {
          Game.phase = 'play'; Game.phaseT = 0; Game.firstWave = false;
          if (Game.def.kind === 'boss') GameAudio.bossMusic(); else GameAudio.ambience();
        }
        break;
      }
      case 'play': Game.play(dt); break;
      case 'dying': Game.dying(dt); break;
      case 'landed': Game.dying(dt); break;
      case 'respawn':
        Player.update(p, dt, Game.control());
        Player.moveShots(p, Game.shotHits);
        if (Game.phaseT > 0.9) { Game.phase = 'play'; Game.phaseT = 0; }
        break;
      case 'bossdown':
        Boss.update(dt, { px: p.x, firing: false, onDefeat: () => { Game.bossGone = true; } });
        Player.update(p, dt, { left: Game.control().left, right: Game.control().right, fire: false });
        Player.moveShots(p, () => false);
        Bullets.update(dt);
        if (Game.bossGone && Game.phaseT > 3.6) Game.waveClear();
        break;
      case 'clear': Game.clearSeq(dt); break;
    }
    LP.FX.update();
    Formation.tickPops();
    LP.prune(Game.pops, (q) => { q.t++; if (q.t < 20) q.y -= 0.4; return q.t > q.life; });
  },

  play(dt) {
    const p = Game.player, R = Game.R, boss = Game.def.kind === 'boss';
    Player.update(p, dt, Game.control());
    Player.moveShots(p, Game.shotHits);
    if (Game.phase !== 'play') return;
    const wasFrozen = Formation.freezeT > 0;
    if (Formation.alive > 0) Formation.update(dt, { px: p.x, onLand: Game.landed });
    if (wasFrozen && Formation.freezeT <= 0) LP.Audio.play('unfreeze');
    if (Game.phase !== 'play') return;
    if (boss) Boss.update(dt, { px: p.x, firing: true });
    Slothership.update(dt, !boss && Formation.alive >= 8);
    Bullets.update(dt);

    // the penguin gets hit
    const pb = Player.box(p);
    for (let i = 0; i < Bullets.list.length; i++) {
      const b = Bullets.list[i];
      if (!LP.Hit.overlap(pb, Bullets.box(b))) continue;
      if (p.shield > 0) { Bullets.list.splice(i--, 1); Game.shieldHit(); continue; }
      if (p.invul <= 0) return Game.playerHit();
    }
    for (const s of Formation.list) {
      if (!s.alive || s.state === 'form' || s.state === 'sleep') continue;
      if (!LP.Hit.overlap(pb, Formation.body(s))) continue;
      Formation.kill(s); LP.Audio.play('slothHit');
      if (p.shield > 0) { Game.shieldHit(); continue; }
      if (p.invul <= 0) return Game.playerHit();
    }
    // pickups
    const body = Player.bodyBox(p);
    LP.prune(Bullets.pickups, (q) => {
      if (!LP.Hit.overlap(body, { x: q.x, y: q.y, w: 9, h: 9 })) return false;
      Player.givePower(p, q.kind);
      LP.Audio.play('pickup');
      Game.popup(p.x, p.y - 10, q.kind.toUpperCase() + (q.kind === 'freeze' ? '!' : ''), Sprites.PICK[q.kind].c);
      return true;
    });

    if (!boss && Formation.alive === 0) Game.waveClear();
  },

  // a player shot this frame: true = remove it
  shotHits(s) {
    const p = Game.player, R = Game.R;
    const box = { x: s.x - 1, y: s.y, w: 3, h: s.prevY - s.y + 7 };
    // own ice bunkers (piercing shots pass through them)
    if (!s.pierce) {
      const c = Barriers.sweep(s.x - 1, s.x + 1, s.prevY, s.y);
      if (c) { Barriers.carve(c.b, c.lx, c.ly, -1); GameAudio.crunch(); return true; }
    }
    // shoot their shots
    for (let i = 0; i < Bullets.list.length; i++) {
      const b = Bullets.list[i], bb = Bullets.box(b);
      if (!LP.Hit.overlap(box, { x: bb.x - 1, y: bb.y, w: bb.w + 2, h: bb.h })) continue;
      Bullets.list.splice(i, 1);
      G.burst(b.x + b.K.w / 2, b.y + 3, 5, '#ffffff', { speed: 1, life: 10 });
      if (b.K.comedy) {
        Game.score1(s); Game.addScore(R.projectilePoints, b.x + 2, b.y - 4, '#ffd040', b.K.name + ' ' + R.projectilePoints);
        LP.Audio.play('comedyHit');
      } else LP.Audio.play('clash');
      return !s.pierce;
    }
    // the formation
    const t = Formation.hit(box, s.hitSet);
    if (t) {
      const dive = t.state === 'dive' || t.state === 'return';
      const pts = R.points[t.T.pts] * (dive ? R.diveMultiplier : 1);
      Formation.kill(t);
      Game.score1(s);
      const show = t.T.cmd || dive || t.state === 'sleep';
      Game.addScore(pts, show ? t.x + t.w / 2 : null, t.y - 4, dive ? '#ff50e0' : '#ffd040');
      LP.Audio.play(t.T.cmd ? 'cmdHit' : 'slothHit');
      if (t.T.cmd) Game.maybeDrop(t.x + t.w / 2, t.y + t.h, 0.35);
      if (Formation.alive === 1) { const last = Formation.list.find((q) => q.alive); Game.popup(last.x + last.w / 2, last.y - 6, '!!', '#ff3a32'); }
      if (s.pierce > 1) { s.pierce--; s.hitSet.add(t); return false; }
      return true;
    }
    // the Slothership
    const sb = Slothership.box();
    if (sb && LP.Hit.overlap(box, sb)) {
      const S = Slothership.s, lucky = s.volley % R.lucky === 0;
      let pts = S.fast ? R.slothershipFast : LP.pick(R.slothership);
      if (lucky && !S.fast) pts = R.luckyPoints;
      const x = S.x + 15, y = S.y;
      Slothership.kill(pts);
      Game.score1(s); Game.addScore(pts);
      LP.Audio.play(lucky || S.fast ? 'lucky' : 'shipHit');
      if (lucky || S.fast) LP.Audio.play('shipHit');
      Game.maybeDrop(x, y + 12, 0.5);
      return true;
    }
    // the Great Slothership
    const h = Boss.hit(box);
    if (h) {
      const b = Boss.b;
      if (h.part === 'pod') {
        if (Boss.damagePod(h.pod)) {
          Game.score1(s); Game.addScore(500, b.x + h.pod.px, b.y + 40, '#ffd040');
          LP.Audio.play('podDown');
          if (!b.shield) { LP.Audio.play('shieldDown'); Game.banner = { text: 'SHIELD DOWN!', sub: 'HIT THE COMMANDER', t: 0, color: '#58d8ff' }; Game.maybeDrop(b.x + 68, b.y + 30, 1); }
        } else { Game.score1(s); Game.addScore(20); LP.Audio.play('slothHit'); }
      } else if (h.part === 'core') {
        Game.score1(s); Game.addScore(50);
        if (Boss.damageCore()) {
          Game.addScore(2500 * b.level, b.x + 68, b.y + 10, '#ffffff');
          Game.phase = 'bossdown'; Game.phaseT = 0; Game.bossGone = false;
          Bullets.list = []; LP.Audio.stopMusic();
        } else LP.Audio.play('cmdHit');
      } else {
        G.burst(s.x, s.y, 3, h.part === 'shield' ? '#58d8ff' : '#e6eaf4', { speed: 0.8, life: 8 });
        LP.Audio.play(h.part === 'shield' ? 'bossShield' : 'bossHull');
      }
      return true;
    }
    return false;
  },
  // a volley counts once towards accuracy
  score1(s) { if (!Game.hitVolleys.has(s.volley)) { Game.hitVolleys.add(s.volley); Game.player.hits++; } },
  shotMissed(s) { G.burst(s.x, 18, 4, '#ff3a32', { speed: 0.7, life: 10, g: 0 }); },

  maybeDrop(x, y, chance) {
    if (!Game.def.pickups || Bullets.pickups.length || !LP.chance(chance)) return;
    const r = Math.random();
    Bullets.drop(r < 0.25 ? 'freeze' : r < 0.45 ? 'shield' : r < 0.65 ? 'double' : r < 0.85 ? 'rapid' : 'pierce', x, y);
  },

  addScore(n, x, y, color, label) {
    Game.score += n;
    if (!Game.demo && Game.score > Game.hi) Game.hi = Game.score;
    if (x !== undefined && x !== null) Game.popup(x, y, label || String(n), color || '#fff');
    while (Game.score >= Game.extraNext) {
      Game.lives++;
      Game.extraNext += Game.R.extraLife[1];
      LP.Audio.play('extraLife');
      Game.popup(Game.player.x, Game.player.y - 12, 'EXTRA PENGUIN!', '#40ff60');
    }
  },
  popup(x, y, text, color) {
    Game.pops.push({ x, y, text, color, t: 0, life: 50 });
    if (Game.pops.length > 12) Game.pops.shift();
  },

  shieldHit() {
    const p = Game.player;
    p.shield = 0; if (p.power === 'shield') p.power = null;
    p.invul = Math.max(p.invul, 0.7);
    LP.Audio.play('shieldHit');
    G.burst(p.x, p.y + 6, 12, '#58d8ff', { speed: 1.6, life: 18 });
  },

  // ------------------------------------------------------------------ death
  playerHit(landed) {
    const p = Game.player;
    if (Game.phase !== 'play' && !landed) return;
    p.alive = false; p.deadT = 0; p.shots = []; p.power = null; p.shield = 0;
    Game.phase = landed ? 'landed' : 'dying'; Game.phaseT = 0;
    Bullets.list = [];
    LP.Audio.stopMusic();
    LP.Audio.play('playerDie');
    if (landed) LP.Audio.play('landed');
    LP.FX.shake(3, 18); LP.FX.flash(2); LP.FX.hitstop(8);
    G.burst(p.x, p.y + 7, 14, '#e6eaf4', { speed: 1.8, life: 30 });
    G.burst(p.x, p.y + 7, 8, '#ff3a32', { speed: 1.4, life: 26 });
    G.burst(p.x, p.y + 4, 4, '#14141c', { speed: 1.2, life: 40, g: 0.1 });   // feathers
  },
  // THE SLOTHS HAVE LANDED: lose a life, the formation is pushed back up to where it started
  landed() { if (Game.phase === 'play') Game.playerHit(true); },

  dying(dt) {
    const p = Game.player;
    p.deadT += dt;
    if (Game.phaseT < (Game.phase === 'landed' ? 3.2 : 2.4)) return;
    Game.lives--;
    if (Game.lives <= 0) { Game.over(); return; }
    if (Game.phase === 'landed') {
      Formation.fy = Game.startFy; Formation.dropNext = false;
      for (const s of Formation.list) if (s.alive) { s.state = 'form'; s.x = Formation.fx + s.ox; s.y = Formation.fy + s.oy; }
    }
    const np = Player.create();
    np.fired = p.fired; np.hits = p.hits;
    Game.player = np;
    Game.phase = 'respawn'; Game.phaseT = 0;
    LP.Audio.play('respawn');
    if (Game.def.kind === 'boss') GameAudio.bossMusic(); else GameAudio.ambience();
  },
  over() {
    if (Game.demo) { Screens.demoOver(); return; }
    LP.States.go('gameover');
  },

  // ------------------------------------------------------------------ wave clear + tally
  waveClear() {
    const R = Game.R, d = Game.def, p = Game.player;
    Game.phase = 'clear'; Game.phaseT = 0;
    p.shots = []; Bullets.list = [];
    LP.Audio.stopMusic();
    LP.Audio.play('waveClear');
    const acc = p.fired ? Math.round(100 * Math.min(1, p.hits / p.fired)) : 0;
    const lines = [['WAVE ' + d.w + ' BONUS', Math.min(R.waveBonusMax, R.waveBonus * d.w)]];
    if (acc >= R.accuracyMin) lines.push([acc === 100 ? 'PERFECT ACCURACY!' : 'ACCURACY ' + acc + '%', acc === 100 ? 2500 : acc * 10]);
    else lines.push(['ACCURACY ' + acc + '%', 0]);
    if (d.kind === 'special') lines.push(['SPECIAL WAVE BONUS', R.specialBonus]);
    if (d.kind === 'boss') lines.push(['SLOTHERSHIP BONUS', 5000 * d.level]);
    Game.tally = { lines, shown: 0, nextT: 1.0 };
  },
  clearSeq(dt) {
    const T = Game.tally, p = Game.player;
    Player.update(p, dt, { left: Game.control().left, right: Game.control().right, fire: false });
    if (T.shown < T.lines.length && Game.phaseT >= T.nextT) {
      const [, pts] = T.lines[T.shown++];
      if (pts) Game.addScore(pts);
      LP.Audio.play(pts ? 'tallyDone' : 'tallyTick');
      T.nextT = Game.phaseT + 0.7;
    }
    if (T.shown >= T.lines.length && Game.phaseT > T.nextT + 1.3) Game.startWave(Game.wave + 1);
  },

  // ------------------------------------------------------------------ render
  render() {
    const g = LP.LCD.ctx, t = LP.Loop.time, p = Game.player;
    g.save();
    g.translate(LP.FX.sx, LP.FX.sy);
    Backdrop.draw(t);
    Barriers.draw();
    Formation.draw();
    Boss.draw();
    Slothership.draw();
    Bullets.draw();
    Player.drawShots(p);
    if (p.alive) Player.draw(p); else Player.drawWreck(p);
    LP.FX.draw();
    for (const q of Game.pops) {
      if (q.t > q.life - 12 && q.t % 4 < 2) continue;
      Font.draw(g, q.text, q.x, q.y, q.color, { face: 'small', align: 'center', outline: '#000' });
    }
    g.restore();
    if (Formation.freezeT > 0 && Formation.alive) Game.drawFrost(t);
    Game.drawHud();
    Game.drawPhase();
  },

  drawFrost(t) {
    const g = LP.LCD.ctx, left = Formation.freezeT, blink = left > 1.5 || Math.floor(t * 8) % 2;
    if (!blink) return;
    g.fillStyle = 'rgba(120,200,255,0.07)'; g.fillRect(0, 19, 384, 185);
    for (let i = 0; i < 24; i++) {
      const k = (i * 37) % 23;
      G.rect(k, 19 + i, Math.max(0, 22 - i - k / 2), 1, '#9ae8ff');
      G.rect(383 - k - Math.max(0, 22 - i - k / 2), 19 + i, Math.max(0, 22 - i - k / 2), 1, '#9ae8ff');
    }
    Font.draw(g, 'FREEZE', 192, 21, '#e8f4ff', { face: 'small', align: 'center', outline: '#1a5aa8' });
  },

  drawHud() {
    const g = LP.LCD.ctx, t = LP.Loop.time, p = Game.player;
    G.rect(0, 0, 384, 19, '#000');
    if (Game.phase !== 'play' || Math.floor(t * 2.5) % 2 === 0) Font.draw(g, '1UP', 46, 1, '#ff3a32', { align: 'center' });
    Font.draw(g, LP.pad(Game.score, 6), 46, 10, '#ffffff', { align: 'center' });
    Font.draw(g, 'HIGH SCORE', 192, 1, '#ff3a32', { align: 'center' });
    Font.draw(g, LP.pad(Game.hi, 6), 192, 10, '#ffffff', { align: 'center' });
    Font.draw(g, 'WAVE', 338, 1, '#ff3a32', { align: 'center' });
    Font.draw(g, LP.pad(Game.wave, 2), 338, 10, Game.def.kind === 'normal' ? '#ffffff' : Game.def.kind === 'boss' ? '#ff50e0' : '#ffd040', { align: 'center' });
    // bottom: reserve penguins + active power
    G.rect(0, 207, 384, 9, '#000');
    Font.draw(g, String(Math.max(0, Game.lives)), 8, 208, '#58d8ff');
    for (let i = 0; i < Math.min(8, Game.lives - 1); i++) g.drawImage(Sprites.lifeIcon, 20 + i * 11, 209);
    if (p.power && p.power !== 'shield') {
      const P = Sprites.PICK[p.power], full = GAME_CONFIG.rules.powerups[p.power], w = Math.round(40 * p.powerT / full);
      if (p.powerT > 2 || Math.floor(t * 8) % 2) {
        Font.draw(g, p.power.toUpperCase(), 324, 209, P.c, { face: 'small', align: 'right' });
        G.rect(330, 210, 40, 3, '#101830'); G.rect(330, 210, w, 3, P.c);
      }
    }
    if (p.shield > 0) Font.draw(g, 'SHIELD', p.power && p.power !== 'shield' ? 250 : 324, 209, '#58d8ff', { face: 'small', align: 'right' });
    if (Game.demo) {
      if (Math.floor(t * 1.5) % 2) Font.draw(g, 'DEMO PLAY', 192, 208, '#ffd040', { face: 'small', align: 'center' });
      else Font.draw(g, 'PRESS ENTER', 192, 208, '#ffffff', { face: 'small', align: 'center' });
    }
  },

  panel(x, y, w, h, border) {
    G.rect(x, y, w, h, '#000');
    G.frame(x, y, w, h, border || '#3a6af0'); G.frame(x + 2, y + 2, w - 4, h - 4, '#1a2a7a');
  },

  drawPhase() {
    const g = LP.LCD.ctx, t = Game.phaseT, d = Game.def, F = (s, x, y, c, o) => Font.draw(g, s, x, y, c, o);
    if (Game.phase === 'intro') {
      if (d.kind === 'boss') {
        if (Math.floor(t * 4) % 2 === 0) { Game.panel(108, 92, 168, 20, '#ff3a32'); F('WARNING!', 192, 98, '#ff3a32', { align: 'center' }); }
        F('THE GREAT SLOTHERSHIP', 192, 122, '#ff50e0', { align: 'center', outline: '#000' });
        F('IS APPROACHING EARTH', 192, 134, '#ffffff', { face: 'small', align: 'center', outline: '#000' });
        F('DESTROY ITS WEAPON PODS FIRST', 192, 143, '#9ae8ff', { face: 'small', align: 'center', outline: '#000' });
      } else if (d.kind === 'special') {
        Game.panel(92, 86, 200, 58, '#ffd040');
        F('SPECIAL WAVE', 192, 92, Math.floor(t * 6) % 2 ? '#ffd040' : '#ffffff', { align: 'center' });
        F(d.special.name, 192, 104, '#ff50e0', { align: 'center' });
        d.special.blurb.forEach((s, i) => { if (t > 0.6 + i * 0.5) F(s, 192, 118 + i * 8, '#9ae8ff', { face: 'small', align: 'center' }); });
      } else {
        Game.panel(136, 96, 112, Game.firstWave ? 42 : 30);
        F('WAVE ' + d.w, 192, 104, '#ffd040', { align: 'center', scale: 1 });
        F(Game.firstWave ? 'GOOD LUCK, PILOT' : d.layout.name, 192, 116, '#9ae8ff', { face: 'small', align: 'center' });
        if (Game.firstWave) F('DEFEND THE EARTH', 192, 126, '#ffffff', { face: 'small', align: 'center' });
      }
    }
    if (Game.phase === 'respawn' && Math.floor(t * 6) % 2 === 0) F('READY', 192, 120, '#ffd040', { align: 'center', outline: '#000' });
    if (Game.phase === 'landed' && t > 0.3) {
      Game.panel(80, 88, 224, 40, '#ff3a32');
      F('THE SLOTHS', 192, 95, '#ff3a32', { align: 'center' });
      F('HAVE LANDED!', 192, 106, Math.floor(t * 6) % 2 ? '#ff3a32' : '#ffffff', { align: 'center' });
      if (t > 1.4) F('REGROUP AND PUSH THEM BACK', 192, 118, '#9ae8ff', { face: 'small', align: 'center' });
    }
    if (Game.banner) {
      const b = Game.banner;
      b.t += 1 / 60;
      if (b.t > 2.2) Game.banner = null;
      else if (Math.floor(b.t * 6) % 2 === 0 || b.t > 1) {
        F(b.text, 192, 96, b.color, { align: 'center', outline: '#000' });
        if (b.sub) F(b.sub, 192, 107, '#ffffff', { face: 'small', align: 'center', outline: '#000' });
      }
    }
    if (Game.phase === 'clear' && Game.tally) {
      const T = Game.tally, h = 32 + T.lines.length * 10;
      Game.panel(96, 70, 192, h, d.kind === 'boss' ? '#ff50e0' : '#40c060');
      const title = d.kind === 'boss' ? 'SLOTHERSHIP DESTROYED!' : d.kind === 'special' ? d.special.name + ' CLEARED!' : 'WAVE ' + d.w + ' CLEARED!';
      F(title, 192, 77, Math.floor(t * 6) % 2 ? '#ffd040' : '#ffffff', { face: title.length > 20 ? 'small' : 'big', align: 'center' });
      T.lines.slice(0, T.shown).forEach(([label, pts], i) => {
        const y = 92 + i * 10;
        F(label, 108, y, '#9ae8ff', { face: 'small' });
        F(pts ? String(pts) : '-', 276, y, pts ? '#ffd040' : '#6a6a8a', { face: 'small', align: 'right' });
      });
    }
  }
};

// ------------------------------------------------------------------ app state
LP.States.add({
  game: {
    enter(arg) {
      if (arg === 'resume') {
        if (Game.phase === 'play' || Game.phase === 'respawn') { if (Game.def.kind === 'boss') GameAudio.bossMusic(); else GameAudio.ambience(); }
      }
    },
    update(dt) {
      const I = LP.Input;
      if (I.consume('start') || I.consume('back') || I.consume('pause')) { LP.Audio.play('pause'); LP.States.go('paused'); return; }
      Game.update(dt);
    },
    render() { Game.render(); }
  }
});
