/* GAME — one act being played: loading, the per-frame rules (collisions, pickups,
   hazards, checkpoints, deaths, the exit), the camera, the HUD and the clear tally.
   Bosses (bosses.js) and set pieces (setpieces.js) plug in through Game.boss / Game.set.
   The run (score, lives, leaves, gems, continues) lives in Game.run across acts. */
'use strict';
const Game = (function () {
  const Gm = {
    run: null, lvl: null, idx: 0, ents: [], shots: [], fx: [], popups: [], rings: [],
    cam: { x: 0, y: 0, look: 0, lockX0: null, lockX1: null, lockY0: null, lockY1: null, refY: 0 },
    time: 0, phase: 'play', phaseT: 0, fade: 1, boss: null, set: null, hint: null, hintT: 0, checkpoint: null,
    collected: new Set(), stats: null, cheat: { god: false }, input: null, bot: null, banner: null, bannerT: 0, shake: 0
  };

  // ------------------------------------------------------------------ run / act lifecycle
  Gm.newRun = function () {
    const diff = LP.Settings.get('difficulty');
    Gm.run = { score: 0, lives: diff === 0 ? 5 : diff === 2 ? 2 : 3, leaves: 0, gems: new Set(), continues: 3, nextLife: 50000 };
  };
  Gm.start = function (idx, opts) {
    opts = opts || {};
    Gm.idx = idx; Gm.lvl = LEVELS[idx];
    if (!opts.respawn) { Gm.collected = new Set(); Gm.checkpoint = null; Gm.stats = { leaves: 0, leavesTotal: 0, kills: 0, hits: 0, gem: false, time: 0 }; }
    if (opts.respawn) World.resetGrid(); else World.load(Gm.lvl);
    World.movers.length = 0;
    Gm.ents = []; Gm.shots = []; Gm.popups = []; Gm.rings = []; Gm.fx = [];
    LP.FX.clear();
    Gm.boss = null; Gm.set = null; Gm.hint = null; Gm.time = 0; Gm.banner = null; Gm.rain = false;
    let start = null;
    const hintOrder = World.ents.filter((e) => e.ch === 'i').sort((a, b) => a.tx - b.tx || a.ty - b.ty);
    for (const e of World.ents) {
      if (e.ch === '@') { start = e; continue; }
      if (e.ch === 'T') continue;
      if (e.ch === 'Y') { Gm.bossSpawn = e; continue; }
      if (e.ch === '!' || e.ch === 'O') continue;
      const key = e.tx + ',' + e.ty;
      if (Ents.ITEMS[e.ch]) {
        if (!opts.respawn && e.ch === 'o') Gm.stats.leavesTotal++;
        if (Gm.collected.has(key)) continue;
      }
      const ent = Ents.spawn(e.ch, e.x, e.y, e.ch === 'i' ? (Gm.lvl.hints || [])[hintOrder.indexOf(e)] : undefined);
      if (!ent) { console.warn('unknown map entity', e.ch, e.tx, e.ty); continue; }
      ent.key = key;
      if (ent.kind === 'checkpoint' && Gm.checkpoint && Gm.checkpoint.key === key) ent.on = true;
      if (ent.kind === 'bonus' && Gm.collected.has('bonus')) ent.used = true;
      Gm.ents.push(ent);
    }
    const sp = Gm.checkpoint || start || { x: 40, y: 64 };
    Player.reset(Gm.lvl.form, sp.x, sp.y, false);
    if (opts.respawn && Gm.checkpoint && Gm.checkpoint.form) Player.setForm(Gm.checkpoint.form);
    if (Gm.lvl.boss) Gm.boss = Bosses.create(Gm.lvl.boss, Gm.bossSpawn);
    if (Gm.lvl.set) Gm.set = SetPieces.create(Gm.lvl.set, opts.respawn ? Gm.checkpoint : null);
    Gm.cam.lockX0 = Gm.cam.lockX1 = Gm.cam.lockY0 = Gm.cam.lockY1 = null;
    Gm.cam.refY = World.ph - 240;
    Gm.snapCamera();
    Gm.phase = opts.respawn ? 'play' : 'card'; Gm.phaseT = 0; Gm.fade = 1;
    Gm.music(Gm.lvl.music || Themes.T[Gm.lvl.theme].music);
    LP.Input.clearPresses();
  };
  Gm.music = (name) => { Gm.curMusic = name; LP.Audio.startMusic(name); };

  // ------------------------------------------------------------------ helpers used by entities
  Gm.addShot = (s) => { Gm.shots.push(s); return s; };
  Gm.addEnt = (e) => { Gm.ents.push(e); return e; };
  Gm.popup = (x, y, text, color) => { Gm.popups.push({ x, y, text: String(text), t: 0, color: color || '#ffffff' }); if (Gm.popups.length > 12) Gm.popups.shift(); };
  Gm.onScreen = (x, y, m) => { m = m || 40; return x > Gm.cam.x - m && x < Gm.cam.x + 320 + m && y > Gm.cam.y - m && y < Gm.cam.y + 240 + m; };
  Gm.addScore = function (n) {
    const R = Gm.run; R.score += n;
    while (R.score >= R.nextLife) { R.lives++; R.nextLife += 50000; Sfx('oneup'); Gm.popup(Player.x, Player.y - 50, '1UP', '#7aff7a'); }
  };
  Gm.swingNear = function (x, y) {
    for (const e of Gm.ents) if (e.kind === 'swing' && !e.held) { const [tx, ty] = e.tip(); if (Math.abs(tx - x) < 12 && Math.abs(ty - y) < 14) return e; }
    return null;
  };
  Gm.onBreak = function (x, y) {
    Sfx('rubble');
    const R = Themes.T[World.theme].terrain.ramp;
    G.burst(x, y, 12, R[2], { colors: [R[1], R[2], R[3]], speed: 2.2, g: 0.18, life: 30, size: 2 });
    Gm.addScore(50);
  };
  Gm.onSplash = function (x, y) {
    const c = World.liquidKind === 'lava' ? ['#ffe080', '#ff8a2a', '#c83a0a'] : World.liquidKind === 'tar' ? ['#6a7a5a', '#3a4a32'] : ['#ffffff', '#a8e0ff', '#4aa0e0'];
    G.burst(x, y - 4, 16, c[0], { colors: c, speed: 2.6, g: 0.2, life: 34, size: 2 });
  };
  Gm.onRoar = function (p) {
    const r = p.F.roarR, cx = p.x, cy = p.y - p.h * 0.6;
    Sfx(p.form === 'adult' ? 'roarBig' : 'roarCub');
    Gm.rings.push({ x: cx, y: cy, r: 4, max: r, t: 0 });
    if (p.form === 'adult') LP.FX.shake(3, 16);
    for (const e of Gm.ents) {
      if (!e.enemy || e.dead) continue;
      const d = Math.hypot(e.x - cx, e.y - e.h / 2 - cy);
      if (d > r + 10) continue;
      e.stun(p.form === 'adult' ? 200 : 170);
      if (e.roarable) { e.vx = Math.sign(e.x - cx) * 1.2; if (p.form === 'adult' && !e.spiky) e.hit(1, 'roar'); }
    }
    for (const s of Gm.shots) if (Math.hypot(s.x - cx, s.y - cy) < r && s.deflectable) { s.vx = Math.sign(s.x - cx) * 4; s.vy = -2; s.friendly = true; }
    if (Gm.boss) Gm.boss.onRoar && Gm.boss.onRoar(cx, cy, r, p);
    if (Gm.set && Gm.set.onRoar) Gm.set.onRoar(cx, cy, r);
  };
  Gm.defeat = function (e) {
    e.dead = true;
    Gm.stats.kills++;
    Gm.addScore(e.score * Math.max(1, Player.combo));
    Gm.popup(e.x, e.y - e.h - 4, e.score * Math.max(1, Player.combo), '#ffe060');
    Sfx('defeat');
    G.burst(e.x, e.y - e.h / 2, 8, '#ffffff', { colors: ['#ffffff', '#ffe060', '#ffb040'], speed: 2, life: 20 });
    // the classic flip-and-fall off the screen
    const f = CharArt.get(e.art, e.art === 'beetle' ? 'flipped' : 'hurt', 0, e.variant);
    Gm.fx.push({ kind: 'corpse', f, x: e.x, y: e.y, vx: (e.x < Player.x ? -1 : 1) * 1.2, vy: -4.5, flip: e.facing < 0, t: 0 });
    if (Math.random() < 0.18) Gm.ents.push(Object.assign(Ents.spawn('o', e.x, e.y - 4), { key: null, dropT: 0 }));
  };

  // ------------------------------------------------------------------ input
  Gm.readInput = function () {
    if (Gm.bot) return Gm.bot();
    const I = LP.Input;
    return { left: I.held('left'), right: I.held('right'), up: I.held('up'), down: I.held('down'), jump: I.held('jump'),
      jumpP: I.recent('jump', 6), attackP: I.pressed('attack'), roarP: I.pressed('roar'), downP: I.pressed('down') };
  };

  // ------------------------------------------------------------------ update
  Gm.update = function () {
    Gm.phaseT++;
    if (Gm.bannerT > 0) Gm.bannerT--;
    if (Gm.phase === 'card') {
      Gm.fade = Math.max(0, Gm.fade - 0.04);
      if (Gm.phaseT > 120 || (Gm.phaseT > 30 && (LP.Input.consume('confirm') || LP.Input.consume('jump')))) { Gm.phase = 'play'; Gm.phaseT = 0; LP.Input.clearPresses(); }
      Gm.updateWorld(false);
      return;
    }
    if (Gm.phase === 'clear') { Gm.updateClear(); return; }
    if (Gm.phase === 'fadeout') {
      Gm.fade = Math.min(1, Gm.fade + 0.04);
      Gm.updateWorld(false);
      if (Gm.fade >= 1 && Gm.phaseT > 30) Gm.afterFade();
      return;
    }
    Gm.fade = Math.max(0, Gm.fade - 0.05);
    Gm.updateWorld(true);
  };

  Gm.updateWorld = function (live) {
    Gm.time++;
    if (live) Gm.stats.time++;
    const inp = live ? Gm.readInput() : { };
    const pPrevY = Player.y, pPrevVy = Player.vy;
    if (Gm.set && Gm.set.preUpdate) Gm.set.preUpdate();
    for (const e of Gm.ents) if (e.kind === 'mover' || e.kind === 'log' || e.kind === 'crumble' || e.kind === 'croc') e.update();
    if (live || Player.state === 'dead') {
      if (Gm.set && Gm.set.playerInput) Gm.set.playerInput(inp);
      Player.update(inp);
      if (inp.jumpUsed) LP.Input.consume('jump');
    }
    for (const e of Gm.ents) if (!(e.kind === 'mover' || e.kind === 'log' || e.kind === 'crumble' || e.kind === 'croc')) e.update();
    for (const s of Gm.shots) s.update();
    if (Gm.boss) Gm.boss.update();
    if (Gm.set) Gm.set.update();
    LP.FX.update();
    for (const f of Gm.fx) { f.t++; f.vy += 0.3; f.x += f.vx; f.y += f.vy; if (f.y > Gm.cam.y + 300) f.dead = true; }
    for (const p of Gm.popups) p.t++;
    for (const r of Gm.rings) { r.t++; r.r += (r.max - r.r) * 0.16 + 0.5; }
    if (live && Player.state !== 'dead') Gm.collide(inp, pPrevY, pPrevVy);
    LP.prune(Gm.ents, (e) => e.dead);
    LP.prune(Gm.shots, (s) => s.dead);
    LP.prune(Gm.fx, (f) => f.dead || f.t > 200);
    LP.prune(Gm.popups, (p) => p.t > 50);
    LP.prune(Gm.rings, (r) => r.t > 26);
    Gm.updateCamera();
    if (Player.state === 'dead' && Player.deadT > 120 && Gm.phase === 'play') { Gm.phase = 'fadeout'; Gm.phaseT = 0; Gm.after = 'death'; }
  };

  const overlap = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
  Gm.overlap = overlap;

  Gm.collide = function (inp, prevY, prevVy) {
    const P = Player, pb = P.box(), ab = P.attackBox();
    if (P.onGround) P.combo = 0;
    // attack breaks blocks
    if (ab) World.hitBreakable(ab.x0, ab.y0, ab.x1, ab.y1);
    if (P.rolling) World.hitBreakable(pb.x0 - 2, pb.y0, pb.x1 + 2, pb.y1 - 2);
    for (const e of Gm.ents) {
      if (e.dead) continue;
      if (e.enemy) {
        const eb = e.box();
        if (ab && !P.hitSet.has(e) && overlap(ab, eb)) { P.hitSet.add(e); if (e.hit(P.F.dmg, 'swipe')) { Gm.hitSpark((ab.x0 + ab.x1) / 2, (ab.y0 + ab.y1) / 2); LP.Loop.hitstop(3); } continue; }
        if (!overlap(pb, eb)) continue;
        const stompable = e.stompable && (!e.spiky || e.stunT > 0);
        if (P.vy > 0.5 && prevY <= eb.y0 + 8 && P.state === 'normal') {
          if (stompable) { P.combo++; e.stomp(); P.bounce(inp); Gm.hitSpark(e.x, eb.y0); Sfx('stomp'); continue; }
          if (e.spiky) { P.hurt(e.dmg, e.x); P.vy = -5; continue; }
        }
        if (P.rolling && e.rollable && !e.spiky) { if (!P.hitSet.has(e)) { P.hitSet.add(e); e.hit(P.F.dmg, 'roll'); Gm.hitSpark(e.x, e.y - e.h / 2); } continue; }
        if (e.stunT > 0 || e.harmless) continue;
        P.hurt(e.dmg, e.x);
        continue;
      }
      switch (e.kind) {
        case 'item':
          if (overlap(pb, e.box())) Gm.collect(e);
          break;
        case 'checkpoint':
          if (!e.on && overlap(pb, e.box())) {
            for (const o of Gm.ents) if (o.kind === 'checkpoint') o.on = false;
            e.on = true; Gm.checkpoint = { x: e.x, y: e.y, key: e.key, form: P.form, extra: Gm.set && Gm.set.checkpointData ? Gm.set.checkpointData() : null };
            Sfx('checkpoint'); Gm.popup(e.x, e.y - 44, 'CHECKPOINT', '#7affb0'); P.heal(1);
          }
          break;
        case 'exit':
          if (overlap(pb, e.box()) && P.state !== 'dead') Gm.clearAct();
          break;
        case 'hint':
          if (overlap(pb, e.box())) { Gm.hint = e.text; Gm.hintT = 4; }
          break;
        case 'bouncer': {
          const b = e.box();
          if (P.vy > 0 && prevY <= b.y0 + 6 && overlap(pb, b)) {
            e.squash = 10; P.y = b.y0; P.vy = inp.jump ? -8.8 : -7.2; P.jumping = !!inp.jump; P.onGround = false; P.rolling = false;
            Sfx('boing');
          }
          break;
        }
        case 'geyser':
          if (e.phase() === 'blow' && overlap(pb, e.box())) {
            if (e.hot) P.hurt(1, e.x);
            else if (P.state === 'normal') { P.vy = Math.min(P.vy, -8.6); P.onGround = false; P.jumping = true; }
          }
          break;
        case 'stalactite':
          if (overlap(pb, e.box())) P.hurt(1, e.x);
          break;
        case 'bonus':
          if (!e.used && overlap(pb, e.box()) && P.onGround) { e.used = true; Gm.collected.add('bonus'); Gm.enterBonus(); }
          break;
      }
    }
    for (const s of Gm.shots) {
      if (s.dead) continue;
      const sb = s.box();
      if (s.friendly) { for (const e of Gm.ents) if (e.enemy && !e.dead && overlap(sb, e.box())) { e.hit(1, 'shot'); s.dead = true; } if (Gm.boss && Gm.boss.shotHit) Gm.boss.shotHit(s); continue; }
      if (ab && s.deflectable && overlap(ab, sb)) { s.vx = -s.vx * 1.2 || P.facing * 4; s.vy = -2.5; s.friendly = true; Sfx('deflect'); Gm.hitSpark(s.x, s.y); continue; }
      if (overlap(pb, sb)) { if (P.hurt(s.dmg || 1, s.x)) s.dead = !s.pierce; }
    }
    if (Gm.boss) Gm.boss.collide(pb, ab, inp, prevY);
  };
  Gm.hitSpark = function (x, y) {
    Gm.fx.push({ kind: 'spark', x, y, vx: 0, vy: -0.3, t: 0 });
  };
  Gm.collect = function (e) {
    e.dead = true;
    if (e.key) Gm.collected.add(e.key);
    const P = Player, R = Gm.run;
    Gm.addScore(e.score);
    switch (e.item) {
      case 'leaf':
        R.leaves++; Gm.stats.leaves++; Sfx('leaf');
        if (R.leaves >= 100) { R.leaves -= 100; R.lives++; Sfx('oneup'); Gm.popup(e.x, e.y - 12, '1UP', '#7aff7a'); }
        break;
      case 'mango': P.heal(1); Sfx('eat'); Gm.popup(e.x, e.y - 10, '+1', '#ff9a50'); break;
      case 'melon': P.heal(99); Sfx('eat'); Gm.popup(e.x, e.y - 10, 'FULL', '#7aff7a'); break;
      case 'bug': P.roar = 1; Sfx('bug'); Gm.popup(e.x, e.y - 10, 'ROAR!', '#7ac8ff'); break;
      case 'oneup': R.lives++; Sfx('oneup'); Gm.popup(e.x, e.y - 10, '1UP', '#7aff7a'); break;
      case 'gem': R.gems.add(Gm.lvl.id); Gm.stats.gem = true; Sfx('gem'); Gm.popup(e.x, e.y - 12, 'ROYAL GEM!', '#ff7aa8'); Gm.banner = 'ROYAL GEM FOUND'; Gm.bannerT = 120; break;
    }
    G.burst(e.x, e.y, 6, '#fff6a0', { colors: ['#ffffff', '#fff6a0', '#ffd040'], speed: 1.4, life: 16, g: 0 });
  };

  // ------------------------------------------------------------------ act clear / death / bonus
  Gm.clearAct = function () {
    if (Gm.phase !== 'play') return;
    Gm.phase = 'clear'; Gm.phaseT = 0; Gm.tally = null;
    Player.state = 'win'; Player.winT = 0; Player.vx = 0; Player.rolling = false; Player.attackT = 0; Player.roarT = 0;
    LP.Audio.startMusic('clear');
  };
  Gm.updateClear = function () {
    Gm.updateWorld(false);
    Player.update({});
    if (!Gm.tally && Gm.phaseT > 90) {
      const S = Gm.stats;
      const leafBonus = S.leaves * 100, gemBonus = S.gem ? 5000 : 0, perfect = S.hits === 0 && Player.hp === Player.maxHp ? 10000 : 0, hpBonus = Player.hp * 1000;
      Gm.tally = { rows: [['LEAVES ' + S.leaves + '/' + S.leavesTotal, leafBonus], ['HEALTH', hpBonus], ['ROYAL GEM', gemBonus], ['FLAWLESS', perfect]], shown: 0, t: 0, total: leafBonus + gemBonus + perfect + hpBonus, added: false };
    }
    if (Gm.tally) {
      const T = Gm.tally; T.t++;
      if (T.t % 30 === 0 && T.shown < T.rows.length) { T.shown++; Sfx('tally'); }
      if (T.shown >= T.rows.length && !T.added) { T.added = true; Gm.addScore(T.total); }
      if (T.added && (T.t > 260 || (T.t > 150 && (LP.Input.consume('confirm') || LP.Input.consume('jump'))))) {
        Gm.phase = 'fadeout'; Gm.phaseT = 0; Gm.after = 'clear';
      }
    }
  };
  Gm.afterFade = function () {
    if (Gm.after === 'clear') { Gm.saveProgress(Gm.idx + 1); Flow.next(); return; }
    if (Gm.after === 'death') {
      const R = Gm.run;
      if (Gm.cheat.infinite) R.lives = Math.max(R.lives, 1);
      R.lives--;
      if (R.lives < 0) { LP.States.go('gameover'); return; }
      Gm.start(Gm.idx, { respawn: true });
    }
  };
  Gm.saveProgress = function (next) {
    const best = LP.Store.get('progress', 0);
    if (next > best && next < LEVELS.length) LP.Store.set('progress', next);
  };
  Gm.continueRun = function () {
    const R = Gm.run;
    R.continues--; R.lives = LP.Settings.get('difficulty') === 0 ? 5 : 3; R.score = Math.floor(R.score / 2 / 10) * 10;
    Gm.checkpoint = null;
    Gm.start(Gm.idx, {});
  };
  Gm.enterBonus = function () {
    Gm.bonusReturn = { x: Player.x, y: Player.y };
    LP.States.go('bonus');
  };
  Gm.resumeFromBonus = function () {
    Gm.music(Gm.curMusicLevel || Gm.lvl.music || Themes.T[Gm.lvl.theme].music);
    Gm.phase = 'play'; Gm.fade = 1;
  };

  // ------------------------------------------------------------------ camera
  Gm.snapCamera = function () {
    const C = Gm.cam;
    C.x = LP.clamp(Player.x - 160, 0, World.pw - 320); C.y = LP.clamp(Player.y - 150, 0, World.ph - 240); C.look = 0;
    Gm.clampCam();
  };
  Gm.clampCam = function () {
    const C = Gm.cam;
    const x0 = C.lockX0 !== null ? C.lockX0 : 0, x1 = C.lockX1 !== null ? C.lockX1 : World.pw - 320;
    const y0 = C.lockY0 !== null ? C.lockY0 : 0, y1 = C.lockY1 !== null ? C.lockY1 : World.ph - 240;
    C.x = LP.clamp(C.x, x0, Math.max(x0, x1)); C.y = LP.clamp(C.y, y0, Math.max(y0, y1));
  };
  Gm.updateCamera = function () {
    const C = Gm.cam, P = Player;
    if (Gm.set && Gm.set.camera && Gm.set.camera(C)) { Gm.clampCam(); return; }
    if (P.state === 'dead') return;
    const moving = Math.abs(P.vx) > 1.2;
    if (moving) C.look = LP.approach(C.look, Math.sign(P.vx) * 40, 0.7);
    else if (P.state === 'normal' && P.onGround) C.look = LP.approach(C.look, P.facing * 16, 0.3);
    const tx = P.x - 160 + C.look;
    C.x += LP.clamp((tx - C.x) * 0.14, -9, 9);
    let ty = P.y - 146;
    if (P.lookUp) C.lookT = (C.lookT || 0) + 1; else if (P.crouch) C.lookT = (C.lookT || 0) - 1; else C.lookT = 0;
    if (C.lookT > 40) ty -= 70; else if (C.lookT < -40) ty += 70;
    const grounded = P.onGround || P.state === 'hang' || P.state === 'climb' || P.state === 'swing' || P.state === 'ledge' || P.state === 'pull';
    const k = grounded || C.lookT ? 0.09 : 0.05;
    C.y += LP.clamp((ty - C.y) * k, -6, 6);
    // never let him leave the screen vertically
    const sy = P.y - C.y;
    if (sy > 214) C.y = P.y - 214;
    if (sy - P.h < 24) C.y = P.y - P.h - 24;
    Gm.clampCam();
  };

  // ------------------------------------------------------------------ render
  Gm.render = function (g) {
    const C = Gm.cam;
    const cx = Math.round(C.x) - LP.FX.sx, cy = Math.round(C.y) - LP.FX.sy;
    const t = Gm.time / 60;
    Themes.drawBackground(g, World.theme, cx, cy, C.refY, t);
    if (Gm.set && Gm.set.drawBack) Gm.set.drawBack(g, cx, cy);
    World.drawBack(g, cx, cy, t);
    World.drawLevel(g, cx, cy);
    World.drawDynamic(g, cx, cy, t);
    if (Gm.boss && Gm.boss.drawBack) Gm.boss.drawBack(g, cx, cy);
    for (const e of Gm.ents) if (!e.enemy && e.kind !== 'shot') e.draw(g, cx, cy);
    for (const e of Gm.ents) if (e.enemy) e.draw(g, cx, cy);
    if (Gm.boss) Gm.boss.draw(g, cx, cy);
    if (Gm.set && Gm.set.drawMid) Gm.set.drawMid(g, cx, cy);
    Player.draw(g, cx, cy);
    for (const s of Gm.shots) s.draw(g, cx, cy);
    World.drawFronts(g, cx, cy);
    World.drawLiquids(g, cx, cy, t);
    if (Gm.set && Gm.set.drawFront) Gm.set.drawFront(g, cx, cy);
    if (Gm.boss && Gm.boss.drawFront) Gm.boss.drawFront(g, cx, cy);
    for (const f of Gm.fx) {
      if (f.kind === 'corpse') {
        g.save(); g.translate(Math.round(f.x - cx), Math.round(f.y - cy)); g.scale(1, -1); Art.draw(g, f.f, 0, 0, f.flip); g.restore();
      } else if (f.kind === 'spark') {
        const s = 6 - f.t; if (s > 0) { g.fillStyle = f.t < 3 ? '#ffffff' : '#ffe060'; g.fillRect(Math.round(f.x - cx - s), Math.round(f.y - cy), s * 2 + 1, 1); g.fillRect(Math.round(f.x - cx), Math.round(f.y - cy - s), 1, s * 2 + 1); g.fillRect(Math.round(f.x - cx - s / 2), Math.round(f.y - cy - s / 2), 1, 1); g.fillRect(Math.round(f.x - cx + s / 2), Math.round(f.y - cy + s / 2), 1, 1); }
        if (f.t > 6) f.dead = true;
      }
    }
    for (const r of Gm.rings) drawRing(g, r.x - cx, r.y - cy, r.r, r.t);
    LP.FX.draw(cx, cy);
    Ambient.draw(g, World.theme, cx, cy, Gm.time);
    for (const p of Gm.popups) if (p.t < 40 || p.t % 4 < 2) Font.draw(g, p.text, p.x - cx, p.y - cy - Math.min(p.t, 20) * 0.6, p.color, { face: 'small', align: 'center', outline: '#1a0a00' });
    if (Gm.set && Gm.set.drawOver) Gm.set.drawOver(g);
    Hud.draw(g);
    if (Gm.phase === 'card' || (Gm.phase === 'play' && Gm.phaseT < 20 && Gm.fade > 0)) Hud.card(g, Gm.lvl, Gm.phaseT);
    if (Gm.phase === 'clear') Hud.clear(g);
    if (Gm.fade > 0) { g.fillStyle = 'rgba(0,0,0,' + Gm.fade.toFixed(3) + ')'; g.fillRect(0, 0, 320, 240); }
  };
  function drawRing(g, x, y, r, t) {
    const n = Math.max(16, Math.round(r * 1.2));
    const cols = t < 8 ? ['#ffffff', '#fff6c0'] : t < 16 ? ['#fff6c0', '#ffd060'] : ['#ffb040', '#c87020'];
    for (let k = 0; k < n; k++) {
      if ((k + t) % 3 === 0) continue;
      const a = k / n * Math.PI * 2;
      g.fillStyle = cols[k % 2];
      g.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r * 0.8), 2, 2);
    }
    if (t < 10) for (let k = 0; k < n / 2; k++) { const a = k / n * Math.PI * 4 + 0.2; g.fillStyle = '#ffffff'; g.fillRect(Math.round(x + Math.cos(a) * r * 0.7), Math.round(y + Math.sin(a) * r * 0.56), 1, 1); }
  }

  return Gm;
})();
