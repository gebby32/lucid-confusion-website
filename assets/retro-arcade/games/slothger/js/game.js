/* GAME — stage flow, rules, scoring and the HUD.
   Phases inside the 'game' state:
     intro  stage banner; lanes already moving, the sloth waits      play   the sloth is yours
     dying  death animation (Player)        home   a sloth just got home      clear  all homes filled
   The lane clock Game.t runs in every phase (and stops while paused). */
'use strict';
const Game = (function () {
  const RULES = GAME_CONFIG.rules;
  const DEATH_TEXT = { squash: 'SQUISH!', press: 'CRUNCH!', splash: 'SPLOOSH!', drift: 'BYE BYE!', chomp: 'CHOMP!',
    train: 'TOOT TOOT!', fall: 'WHOOPS!', launch: 'WHEEE!', saw: 'YIKES!', time: 'ZZZ...' };
  const DEATH_SOUND = { squash: 'squash', press: 'crunch', splash: 'splash', drift: 'splash', chomp: 'chomp', train: 'trainhit',
    fall: 'fall', launch: 'launch', saw: 'zap', time: 'yawn' };

  const Gm = {
    stage: 1, score: 0, hiScore: 0, lives: RULES.lives, continuesLeft: RULES.continues, nextLife: RULES.extraLife,
    phase: 'intro', phaseT: 0, t: 0, frame: 0, timer: 0, timerMax: 0, def: null, homes: [], leaf: null,
    popups: [], ripples: [], checkRow: null, flyT: 0, gatorT: 0, leafT: 0, deaths: 0, hurry: false, worldCard: false,

    newGame(stage) {
      Gm.stage = stage || 1; Gm.score = 0; Gm.lives = RULES.lives; Gm.continuesLeft = RULES.continues;
      Gm.nextLife = RULES.extraLife; Gm.deaths = 0;
    },

    startStage(n) {
      Gm.stage = n;
      const def = Gm.def = StageInfo.def(n);
      Lanes.load(def);
      Gm.homes = (def.final ? [160] : [32, 96, 160, 224, 288]).map((x) => ({ x, filled: false, fly: 0, gator: 0 }));
      World.load(def, Gm.homes);
      Gm.t = 0; Gm.frame = 0; Gm.leaf = null; Gm.popups = []; Gm.ripples = []; Gm.checkRow = null;
      Gm.flyT = 300; Gm.gatorT = 420; Gm.leafT = 360;
      Player.startRow = Lanes.list.length + 1;
      Player.reset(Player.startRow);
      Gm.resetTimer();
      World.camY = World.maxCam();
      Gm.worldCard = n === WORLDS[StageInfo.world(n)].from;
      Gm.setPhase('intro');
      Player.frozen = true;
      LP.FX.clear();
      Screens.noteReached(n);
      GameAudio.setHurry(false); Gm.hurry = false;
      LP.Audio.startMusic(StageInfo.song(n));
      LP.Audio.play('ready');
    },
    setPhase(p) { Gm.phase = p; Gm.phaseT = 0; },
    resetTimer() { Gm.timerMax = Gm.timer = (Gm.def.time || 55) * 60; },

    // ------------------------------------------------------------------ scoring
    add(n) {
      Gm.score += n;
      if (Gm.score > Gm.hiScore) Gm.hiScore = Gm.score;
      while (Gm.score >= Gm.nextLife) {
        Gm.nextLife += RULES.extraLife; Gm.lives++;
        LP.Audio.play('oneup');
        Gm.popup(160, Player.feet()[1] - 24, '1UP!', '#58f898', true);
      }
    },
    forward() { Gm.add(RULES.step); },
    popup(x, wy, text, color, big) { Gm.popups.push({ x, wy, text, color: color || '#fcfcfc', big: !!big, t: 0 }); if (Gm.popups.length > 10) Gm.popups.shift(); },

    // ------------------------------------------------------------------ homes, bonuses
    slotAt(x) {
      for (const h of Gm.homes) if (!h.filled && Math.abs(h.x - x) <= 10) return h;
      return null;
    },
    reachHome(slot) {
      if (slot.gator > 0 && slot.gator <= 170) { Player.row = 0; return Player.die('chomp'); }
      slot.filled = true; slot.gator = 0;
      const secs = Math.ceil(Gm.timer / 60);
      let pts = RULES.home + secs * RULES.timeBonus;
      if (slot.fly > 0) { slot.fly = 0; pts += RULES.fly; LP.Audio.play('fly'); Gm.popup(slot.x, 0, 'FLY +' + RULES.fly, '#a4e4fc'); }
      Gm.add(pts);
      Gm.popup(slot.x, 12, '+' + pts, '#f8b800');
      G.burst(slot.x, World.rowY(0) + 8, 14, '#f8b800', { colors: ['#f8b800', '#fcfcfc', '#b8f818'], speed: 1.8 });
      Player.homeT = 1;
      if (Gm.homes.every((h) => h.filled)) {
        Gm.add(RULES.allHomes);
        LP.Audio.play('clear');
        LP.Audio.stopMusic();
        Gm.setPhase('clear');
      } else {
        LP.Audio.play('home');
        Gm.setPhase('home');
      }
    },
    checkpoint(row) {
      if (Gm.checkRow !== null && row >= Gm.checkRow) return;
      Gm.checkRow = row;
      LP.Audio.play('checkpoint');
      Gm.popup(160, row * 16 - 4, 'CHECKPOINT!', '#58f898', true);
    },
    touchLeaf(lane, it) {
      const L = Gm.leaf;
      if (!L || L.lane !== lane || L.item !== it) return;
      if (Math.abs(Player.x - (it.x + L.ox)) > 10) return;
      Gm.leaf = null;
      Gm.add(RULES.leaf);
      LP.Audio.play('leaf');
      Gm.popup(Player.x, lane.row * 16 - 6, 'YUM! +' + RULES.leaf, '#b8f818');
    },
    updateBonuses() {
      const def = Gm.def;
      for (const h of Gm.homes) { if (h.fly > 0) h.fly--; if (h.gator > 0) h.gator--; }
      const empty = Gm.homes.filter((h) => !h.filled && !h.fly && !h.gator);
      if (def.fly && --Gm.flyT <= 0) {
        Gm.flyT = LP.randi(360, 600);
        if (empty.length) { LP.pick(empty).fly = 300; LP.Audio.play('buzz'); }
      }
      if (def.gator && --Gm.gatorT <= 0) {
        Gm.gatorT = LP.randi(420, 720);
        const e2 = Gm.homes.filter((h) => !h.filled && !h.fly && !h.gator);
        if (e2.length > 1) LP.pick(e2).gator = 260;
      }
      // a tasty leaf rides a log now and then (sloths love leaves)
      if (Gm.leaf) { if (--Gm.leaf.t <= 0 || Gm.leaf.item.ds === 2) Gm.leaf = null; }
      else if (--Gm.leafT <= 0) {
        Gm.leafT = LP.randi(480, 840);
        const opts = [];
        for (const lane of Lanes.list) if (lane.type === 'water' && lane.sp) for (const it of lane.items) if (!it.dive && it.kind !== 'gator' && it.w >= 32 && it.x > 30 && it.x < 260) opts.push([lane, it]);
        if (opts.length) { const [lane, item] = LP.pick(opts); Gm.leaf = { lane, item, ox: 8 + 16 * LP.randi(0, item.cells - 1), t: 600 }; }
      }
    },

    // ------------------------------------------------------------------ deaths
    onDeath(kind, D) {
      Gm.setPhase('dying');
      Gm.deaths++;
      LP.Audio.play(DEATH_SOUND[kind] || 'squash');
      const sx = D.x, wy = D.wy;
      Gm.popup(sx, wy - 26, DEATH_TEXT[kind] || 'OUCH!', kind === 'time' ? '#a4e4fc' : '#f83800', true);
      if (kind === 'splash' || kind === 'drift' || kind === 'chomp') {
        const water = (THEMES[(D.lane && D.lane.th) || Gm.def.theme] || THEMES.meadow).water[2];
        G.burst(sx, wy - 4 + 16 - World.camY, 16, water, { speed: 2, lift: 1.6, g: 0.16, colors: [water, '#fcfcfc'] });
        Gm.ripples.push({ x: sx, wy: Player.row * 16 + 11, t: 0 });
      } else if (kind === 'squash' || kind === 'press') {
        G.burst(sx, wy - 4 + 16 - World.camY, 12, '#58d854', { speed: 1.6, colors: ['#58d854', '#b8f818', '#f8b800'] });
        LP.FX.shake(3, 10);
      } else if (kind === 'train' || kind === 'launch') LP.FX.shake(4, 14);
      if (kind !== 'time') LP.LCD.invert = 0;
    },
    afterDeath() {
      Gm.lives--;
      if (Gm.lives <= 0) {
        LP.Audio.stopMusic();
        LP.States.go(Gm.continuesLeft > 0 ? 'continue' : 'gameover');
        return;
      }
      Gm.respawn();
    },
    respawn() {
      Player.reset(Gm.checkRow || Player.startRow);
      Gm.resetTimer();
      if (Gm.hurry) { GameAudio.setHurry(false); Gm.hurry = false; }
      Gm.setPhase('ready');
      Player.frozen = true;
      LP.Audio.play('respawn');
    },
    continueGame() {
      Gm.continuesLeft--; Gm.lives = RULES.lives;
      Gm.startStage(Gm.stage);
    },

    // ------------------------------------------------------------------ update
    update() {
      Gm.t++; Gm.frame++; Gm.phaseT++;
      Lanes.update(Gm.t);
      // railway sounds for trains near the sloth
      for (const lane of Lanes.list) if (lane.type === 'rail') {
        const near = Math.abs(lane.row - Player.row) <= 5;
        if (near && lane.bell) LP.Audio.play('bell');
        if (near && lane.horn) LP.Audio.play('horn');
      }
      for (const lane of Lanes.list) if (lane.type === 'timed' && Math.abs(lane.row - Player.row) <= 3) for (const c of lane.cells) if (c.fire) { LP.Audio.play(lane.kind === 'press' ? 'slam' : lane.kind === 'manhole' ? 'clank' : 'whoosh'); break; }
      LP.FX.update();
      LP.prune(Gm.popups, (p) => ++p.t > 70);
      LP.prune(Gm.ripples, (r) => ++r.t > 40);

      switch (Gm.phase) {
        case 'intro': {
          // A / Space skips the banner; a direction skips it AND hops. (Enter pauses, as everywhere in play.)
          const I = LP.Input, early = Gm.phaseT > 30 && !I.pressed('pause');
          const skip = early && (I.consume('confirm') || ['up', 'down', 'left', 'right'].some((d) => I.pressed(d)));
          if (skip || Gm.phaseT > (Gm.worldCard ? 200 : 140)) { Gm.setPhase('play'); Player.frozen = false; LP.Audio.play('go'); }
          Player.update();
          break;
        }
        case 'ready':
          Player.update();
          if (Gm.phaseT > 30) { Gm.setPhase('play'); Player.frozen = false; }
          break;
        case 'play':
          Gm.updateBonuses();
          Player.update();
          if (Gm.phase !== 'play') break;
          if (--Gm.timer <= 0) { Gm.timer = 0; Player.die('time'); break; }
          if (!Gm.hurry && Gm.timer < RULES.lowTime * 60) { Gm.hurry = true; GameAudio.setHurry(true); LP.Audio.play('hurry'); }
          if (Gm.hurry && Gm.timer % 60 === 0) LP.Audio.play('tick');
          break;
        case 'dying':
          Gm.updateBonuses();
          Player.update();
          break;
        case 'home':
          Gm.updateBonuses();
          if (Gm.phaseT > 34) { Player.reset(Player.startRow); Gm.checkRow = null; Gm.resetTimer(); if (Gm.hurry) { GameAudio.setHurry(false); Gm.hurry = false; } Gm.setPhase('play'); }
          break;
        case 'clear':
          if (Gm.phaseT === 60) { const secs = Math.ceil(Gm.timer / 60); if (secs) LP.Audio.play('tally'); }
          if (Gm.phaseT > 230 || (Gm.phaseT > 90 && LP.Input.consume('confirm'))) {
            if (Gm.stage >= StageInfo.count) LP.States.go('ending');
            else Gm.startStage(Gm.stage + 1);
          }
          break;
      }

      // camera (only the tall final stage scrolls)
      const max = World.maxCam();
      if (max > 0) {
        const target = LP.clamp(Player.feet()[1] - 140, 0, max);
        World.camY = Math.round(LP.lerp(World.camY, target, Gm.phase === 'intro' ? 1 : 0.12));
      }
      if (LP.Input.consume('pause') && (Gm.phase === 'play' || Gm.phase === 'intro' || Gm.phase === 'ready')) LP.States.go('paused');
    },

    // ------------------------------------------------------------------ render
    render() {
      const g = LP.LCD.ctx, f = Gm.frame;
      G.g = g;
      g.fillStyle = '#000'; g.fillRect(0, 0, 320, 240);
      g.save(); g.translate(LP.FX.sx, LP.FX.sy);
      World.draw(Gm.t, f);
      // the leaf bonus
      if (Gm.leaf) { const L = Gm.leaf; g.drawImage(Sprites.leaf(), Math.round(L.item.x + L.ox - 5), World.rowY(L.lane.row) + 1 + ((f >> 4) % 2)); }
      // sloths already home (hi-res, small, looking pleased)
      for (const h of Gm.homes) if (h.filled) Sloth.queue({ dir: 'down', x: h.x, y: World.rowY(0) + 15, h: 17, sy: 1 + Math.sin(f * 0.07 + h.x) * 0.02 });
      if (Gm.phase !== 'home' && Gm.phase !== 'clear') Player.render();
      for (const r of Gm.ripples) G.ring(r.x, World.sy(r.wy), 2 + r.t * 0.4, r.t % 6 < 3 ? '#fcfcfc' : '#a4e4fc');
      LP.FX.draw(0, 0);
      if (Gm.def.night) World.night(g, Gm.lights());
      g.restore();
      World.bezel(g, f);
      Gm.hud(g);
      // vehicles keep rolling OVER a squashed sloth (the hi-res sloth is otherwise always on top)
      const D = Player.dead;
      if (D && (D.kind === 'squash') && D.lane) G.to(G.fgc, () => World.drawLane(G.fgc, D.lane, Gm.t, f));
      Gm.drawText();
    },
    lights() {
      const out = [];
      const [px, wy] = Player.feet();
      if (!Player.dead || Player.dead.t < 60) out.push({ x: px, y: World.sy(wy) - 10, r: 46 });
      for (const h of Gm.homes) out.push({ x: h.x, y: World.rowY(0) + 8, r: h.filled ? 22 : 14 });
      for (const lane of Lanes.list) {
        const y = World.rowY(lane.row);
        if (y < 0 || y > 240) continue;
        if (lane.type === 'road') for (const it of lane.items) {
          if (it.x > 330 || it.x + it.w < -10) continue;
          if (it.kind === 'snake' || it.kind === 'penguin' || it.kind === 'dog') { out.push({ x: it.x + it.w / 2, y: y + 8, r: 9 }); continue; }
          out.push({ x: lane.dir > 0 ? it.x + it.w - 1 : it.x + 1, y: y + 9, cone: lane.dir });
          out.push({ x: it.x + it.w / 2, y: y + 8, r: 10 + it.cells * 3 });
        }
        if (lane.type === 'rail' && lane.train) { const tr = lane.train; out.push({ x: lane.dir > 0 ? tr.x + tr.w : tr.x, y: y + 8, cone: lane.dir }); out.push({ x: tr.x + tr.w / 2, y: y + 8, r: 20 }); }
        if (lane.type === 'rail' && lane.warn) { out.push({ x: 4, y: y + 8, r: 10 }); out.push({ x: 316, y: y + 8, r: 10 }); }
        if (lane.type === 'timed') for (const c of lane.cells) if (c.state) out.push({ x: Lanes.colX(c.col), y: y + 6, r: 12 });
        if (lane.type === 'water') for (const it of lane.items) if (it.x < 330 && it.x + it.w > -10 && it.ds !== 2) out.push({ x: it.x + it.w / 2, y: y + 8, r: 6 + it.cells * 2 });
      }
      if (Gm.leaf) out.push({ x: Gm.leaf.item.x + Gm.leaf.ox, y: World.rowY(Gm.leaf.lane.row) + 6, r: 9 });
      return out;
    },

    hud(g) {
      const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
      r(0, 0, 320, 16, '#000'); r(0, 224, 320, 16, '#000');
      r(0, 15, 320, 1, '#202040'); r(0, 224, 320, 1, '#202040');
      // lives: tiny hi-res sloths (yes, really)
      const n = Math.min(Gm.lives - (Gm.phase === 'dying' ? 0 : 1), 8);
      for (let i = 0; i < n; i++) Sloth.queue({ dir: 'down', x: 14 + i * 11, y: 238, h: 12 });
      // timer bar
      const frac = Gm.timerMax ? Gm.timer / Gm.timerMax : 0, bw = 96;
      r(212, 229, bw + 2, 7, '#3c3c3c'); r(213, 230, bw, 5, '#101010');
      const low = Gm.timer < RULES.lowTime * 60;
      r(213, 230, Math.round(bw * frac), 5, low ? ((Gm.frame >> 3) % 2 ? '#f83800' : '#f8b800') : frac < 0.4 ? '#f8b800' : '#58d854');
    },
    drawText() {
      const g = G.fgc, f = Gm.frame;
      G.to(g, () => {
        Font.draw(g, '1UP', 10, 4, (f >> 4) % 2 || Gm.phase !== 'play' ? '#f83800' : '#fcfcfc');
        Font.draw(g, LP.pad(Gm.score, 6), 42, 4, '#fcfcfc');
        Font.draw(g, 'HI', 120, 4, '#f83800');
        Font.draw(g, LP.pad(Math.max(Gm.hiScore, Gm.score), 6), 140, 4, '#fcfcfc');
        Font.draw(g, 'STAGE ' + LP.pad(Gm.stage, 2), 310, 4, '#f8b800', { align: 'right' });
        if (Gm.lives - 1 > 8) Font.draw(g, 'x' + (Gm.lives - 1), 104, 229, '#fcfcfc', { face: 'small' });
        Font.draw(g, 'TIME', 207, 230, Gm.timer < RULES.lowTime * 60 ? '#f83800' : '#f8b800', { face: 'small', align: 'right' });
        if (Gm.def.final && Gm.checkRow) Font.draw(g, 'CHECKPOINT', 130, 230, '#58f898', { face: 'small' });
        // popups
        for (const p of Gm.popups) {
          if (p.t > 55 && p.t % 4 < 2) continue;
          const y = World.sy(p.wy) - Math.min(16, p.t * 0.6);
          if (y < 14 || y > 226) continue;
          Font.draw(g, p.text, LP.clamp(p.x, 40, 280), y, p.color, { face: p.big ? 'big' : 'small', align: 'center', outline: '#000' });
        }
        Gm.drawBanner(g, f);
      });
    },
    drawBanner(g, f) {
      if (Gm.phase === 'intro') {
        const T = Gm.phaseT;
        g.fillStyle = 'rgba(0,0,0,0.72)'; g.fillRect(0, 84, 320, Gm.worldCard ? 74 : 60);
        g.fillStyle = '#f8b800'; g.fillRect(0, 84, 320, 1); g.fillRect(0, Gm.worldCard ? 157 : 143, 320, 1);
        let y = 92;
        if (Gm.worldCard) { Font.draw(g, 'WORLD ' + (StageInfo.world(Gm.stage) + 1) + ': ' + WORLDS[StageInfo.world(Gm.stage)].name, 160, y, '#58f898', { align: 'center', outline: '#000' }); y += 14; }
        Font.draw(g, 'STAGE ' + Gm.stage, 160, y, '#f8b800', { align: 'center', outline: '#000' });
        Font.draw(g, Gm.def.name, 160, y + 12, '#fcfcfc', { align: 'center', outline: '#000', scale: Gm.def.name.length <= 17 ? 2 : 1 });
        Font.draw(g, Gm.def.tip, 160, y + (Gm.def.name.length <= 17 ? 32 : 24), '#a4e4fc', { face: 'small', align: 'center' });
        if (T > 60 && (T >> 4) % 2) Font.draw(g, 'READY!', 160, Gm.worldCard ? 166 : 152, '#fcfcfc', { align: 'center', outline: '#000' });
      }
      if (Gm.phase === 'play' && Gm.phaseT < 40 && Gm.frame > 60 && Gm.homes.every((h) => !h.filled) && Gm.deaths === 0) Font.draw(g, 'GO!', 160, 112, '#58f898', { align: 'center', outline: '#000', scale: 2 });
      if (Gm.phase === 'clear') {
        const T = Gm.phaseT;
        g.fillStyle = 'rgba(0,0,0,0.72)'; g.fillRect(0, 80, 320, 70);
        Font.draw(g, Gm.def.final ? 'HOME AT LAST!' : 'STAGE CLEAR!', 160, 88, (f >> 3) % 2 ? '#f8b800' : '#fcfcfc', { align: 'center', scale: 2, outline: '#000' });
        if (T > 40) Font.draw(g, 'ALL HOMES BONUS  ' + RULES.allHomes, 160, 112, '#58f898', { align: 'center' });
        if (T > 80) Font.draw(g, 'SCORE ' + LP.pad(Gm.score, 6), 160, 128, '#fcfcfc', { align: 'center' });
      }
    }
  };
  return Gm;
})();

LP.States.add({
  game: {
    enter(arg) {
      if (arg === 'new') Game.startStage(Game.stage);
      else if (arg === 'continue') Game.continueGame();
      else LP.Audio.startMusic(StageInfo.song(Game.stage));     // resume
      Screens.art = null;
    },
    update() { Game.update(); },
    render() { Game.render(); }
  }
});
