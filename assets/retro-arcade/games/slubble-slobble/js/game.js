/* GAME — one play session: level flow (LEVEL n / READY! -> play -> clear -> bonus tally ->
   next), scoring, chains + combos, extra lives, hurry-up, bosses, continues, HUD.
   Phases inside the 'game' state: intro | play | clear | tally | dead | victory */
'use strict';
const Game = {
  mode: 1, who: 'slub', level: 1, phase: 'intro', pt: 0, levelTime: 0,
  freeze: 0, hurry: false, landlord: null, noDamage: true, startedAt: 1,
  popups: [], banners: [], combo: [0, 0], comboT: [0, 0], tally: null, hiScore: 0, onScreenAudio: true,
  continuesLeft: 0, curMusic: null, best: 1,

  newGame(mode, who, start) {
    Game.mode = mode; Game.who = who || 'slub';
    Players.setup(mode, Game.who);
    Game.continuesLeft = GAME_CONFIG.rules.continues;
    Screens.won = false;
    Game.startedAt = start || 1;
    LP.Loop.reset();
    Screens.loadScores();
    Game.startLevel(start || 1);
  },

  startLevel(n) {
    Game.level = n;
    Game.best = Math.max(Game.best, n);
    Screens.noteReached(n);
    World.load(n);
    Bubbles.reset(); Enemies.reset(); Items.reset(); Bosses.reset(); LP.FX.clear();
    Game.popups.length = 0; Game.banners.length = 0;
    Game.freeze = 0; Game.hurry = false; Game.landlord = null; Game.noDamage = true; Game.levelTime = 0;
    Game.combo = [0, 0]; Game.comboT = [0, 0];
    Players.startLevel();
    const def = LEVELS[n];
    if (def.boss) {
      Bosses.start(def.boss);
    } else {
      const foes = LevelInfo.foes(n), spawns = World.spawns.slice().sort((a, b) => a.r - b.r || a.c - b.c);
      let total = foes.reduce((s, f) => s + f[1], 0);
      if (Game.mode === 2 && n > 5) foes.push([foes[0][0], 1]), total++;   // co-op: one extra pest
      const list = [];
      for (const [name, k] of foes) for (let i = 0; i < k; i++) list.push(name);
      // interleave species so the same ones don't all spawn side by side
      list.sort((a, b) => (list.indexOf(a) % 2) - (list.indexOf(b) % 2));
      list.forEach((name, i) => {
        const sp = spawns.length ? spawns[Math.floor(i * spawns.length / total) % spawns.length] : { c: 16, r: 3 };
        const dup = list.slice(0, i).filter((_, j) => Math.floor(j * spawns.length / total) % spawns.length === Math.floor(i * spawns.length / total) % spawns.length).length;
        let x = sp.c * 8 + 4 + dup * 10 * (sp.c < 16 ? 1 : -1), y = World.TOP + (sp.r + 1) * 8;
        // fish start in the water when there is some
        if (SPECIES[name].move === 'swimmer' && World.waterY < World.BOT && y - 8 < World.waterY) { x = LP.rand(40, 216); y = LP.rand(World.waterY + 20, World.BOT - 12); }
        Enemies.spawn(name, LP.clamp(x, 24, 232), y);
      });
    }
    Game.phase = 'intro'; Game.pt = 0;
    Game.introLen = def.boss ? 3.2 : (n === Game.startedAt || (n - 1) % 10 === 0 ? 2.4 : 1.5);
    Game.music(null);
    LP.Audio.play(def.boss ? 'warning' : 'ready');
  },

  music(name) {
    if (name === null) { LP.Audio.stopMusic(); Game.curMusic = null; return; }
    if (name === undefined) {
      const def = LEVELS[Game.level];
      name = def.boss ? (def.boss === 'final' ? 'final' : 'boss') : WORLDS[LevelInfo.world(Game.level)].music;
    }
    Game.curMusic = name;
    GameAudio.setHurry(false);
    LP.Audio.startMusic(name);
  },

  powerChance() { return Bosses.alive() ? 0.12 : 0.075 + Math.min(0.03, Game.level * 0.0004); },

  // ---------------------------------------------------------------- scoring
  addScore(p, pts, x, y, color, quiet) {
    if (!p) p = Players.list[0];
    p.score += pts;
    if (p.score >= p.nextLife) {
      p.lives++; p.nextLife += GAME_CONFIG.rules.extraLife[1];
      LP.Audio.play('oneup');
      Game.banner((p.who === 'slub' ? 'SLUB' : 'SLOB') + ' 1UP!', '#b8f818', 70);
    }
    if (p.score > Game.hiScore) Game.hiScore = p.score;
    if (!quiet && x !== undefined) Game.popup(x, y, String(pts), color || '#fcfcfc', pts >= 1000);
  },
  popup(x, y, text, color, big) {
    Game.popups.push({ x, y, text, color: color || '#fcfcfc', big: !!big, t: 0 });
    if (Game.popups.length > 14) Game.popups.shift();
  },
  banner(text, color, life, y) {
    Game.banners = Game.banners.filter((b) => b.text !== text);
    Game.banners.push({ text, color: color || '#fcfcfc', t: 0, life: life || 70, y: y || 96 });
    if (Game.banners.length > 3) Game.banners.shift();
  },
  onTrap(e, b) {
    const p = Players.list[b.owner] || Players.list[0];
    Game.addScore(p, GAME_CONFIG.rules.trap, e.x, e.y - e.h - 2, '#a4e4fc', true);
    LP.Audio.play('trap');
  },
  // a trapped enemy got popped: escalating chain points, spin-off corpse -> food
  enemyPopped(e, pi, chain, x, y) {
    const p = Players.list[pi] || Players.list[0];
    const R = GAME_CONFIG.rules;
    const pts = Math.min(R.killCap, R.kill * Math.pow(2, chain.n - 1));
    Game.addScore(p, pts, x, y - 12, chain.n >= 3 ? '#f8b800' : chain.n === 2 ? '#b8f818' : '#fcfcfc');
    // rapid successive pops build a combo
    const i = pi || 0;
    if (Game.comboT[i] > 0) { Game.combo[i]++; } else Game.combo[i] = 1;
    Game.comboT[i] = 90;
    if (Game.combo[i] >= 3) { Game.addScore(p, 100 * Math.min(20, Game.combo[i]), x, y + 2, '#f878f8', true); }
    // where does the body fly? In boss fights: AT the boss.
    let dir = p ? (x < p.x ? -1 : 1) : 1, launched = false;
    if (Bosses.alive()) { dir = Bosses.x() < x ? -1 : 1; launched = true; }
    e.owner = pi;
    Enemies.kill(e, x, y, dir, Math.min(3, chain.n - 1), launched);
    if (launched) { const c = Enemies.corpses[Enemies.corpses.length - 1]; c.vx = dir * 3.6; c.vy = -1.6; }
  },
  chainDone(ch) {
    if (ch.id < 0 || !ch.n) return;
    const LABELS = [null, 'POP!', 'DOUBLE POP!', 'TRIPLE POP!', 'BUBBLE CHAIN!', 'SLOTHASTIC!', 'ABSURD!'];
    const label = LABELS[Math.min(6, ch.n)];
    if (ch.n === 1) Game.popup(ch.x, ch.y - 22, label, '#f8b800', false);
    else { Game.banner(label, ['#b8f818', '#f8b800', '#f878f8', '#3cbcfc', '#f83800'][Math.min(4, ch.n - 2)], 60, LP.clamp(ch.y - 20, 40, 160)); LP.Audio.play('chain', { n: ch.n }); }
    const i = ch.pi || 0;
    if (Game.combo[i] >= 3) Game.popup(ch.x, ch.y - 32, 'COMBO x' + Game.combo[i], '#f878f8', false);
  },
  playerOut(p) {
    if (Players.list.every((q) => q.out)) { Game.phase = 'dead'; Game.pt = 0; Game.music(null); }
  },
  bossDefeated(b) {
    const big = b.kind === 'final' ? 200000 : b.kind === 'raccoon' ? 30000 : 50000;
    for (const p of Players.list) if (!p.out) Game.addScore(p, big / Players.list.length, 128, 90, '#f8b800');
    Game.banner(BOSS_INFO[b.kind].name + ' DEFEATED!', '#f8b800', 150, 70);
    for (let i = 0; i < 12; i++) Items.dropFood(LP.rand(40, 216), LP.rand(30, 80), 3);
    Items.dropPower(128, 60);
    Game.toClear(true);
  },
  toClear(boss) {
    Game.phase = 'clear'; Game.pt = 0; Game.clearBoss = !!boss;
    Bubbles.popAll();
    for (const s of Enemies.shots) s.dead = true;
    if (Game.landlord) { Game.landlord.state = 'dead'; Game.landlord = null; }
    Game.music(null);
    LP.Audio.play(Game.level === 100 ? 'fanfare' : 'clear');
  },

  // ---------------------------------------------------------------- update
  update(dt) {
    Game.pt += dt;
    for (let i = 0; i < 2; i++) if (Game.comboT[i] > 0) Game.comboT[i]--;
    const ph = Game.phase;
    if (ph === 'intro') {
      Players.list.forEach((p) => { p.t++; p.invul = Math.max(p.invul, 0.5); });
      if (Game.pt >= Game.introLen) { Game.phase = 'play'; Game.pt = 0; Game.music(); }
      World.update(dt);
      return;
    }
    if (Game.freeze > 0) Game.freeze--;
    World.update(dt);
    Players.update();
    for (const p of Players.list) if (Players.active(p)) {
      Bubbles.touch(p);
      for (const it of Items.list) if (!it.taken && it.t > 10 && LP.Hit.overlap({ x: p.x - 8, y: p.y - 16, w: 16, h: 16 }, { x: it.x - 5, y: it.y - 10, w: 10, h: 10 })) Items.collect(it, p);
    }
    Bubbles.update();
    Enemies.update();
    Bosses.update();
    Items.update();
    LP.FX.update();
    for (const pp of Game.popups) pp.t++;
    LP.prune(Game.popups, (pp) => pp.t > 50);
    for (const bn of Game.banners) bn.t++;
    LP.prune(Game.banners, (bn) => bn.t > bn.life);

    if (ph === 'play') {
      Game.levelTime += dt;
      const def = LEVELS[Game.level];
      if (!def.boss && Enemies.alive() === 0 && Bubbles.trappedCount() === 0) { Game.toClear(false); return; }
      // HURRY UP -> everything angry -> the Landlord comes to collect
      const hurryAt = GAME_CONFIG.rules.hurry + Math.min(25, Game.level * 0.2);
      if (!def.boss && !Game.hurry && Game.levelTime > hurryAt) {
        Game.hurry = true; Game.banner('HURRY UP!', '#f83800', 90); LP.Audio.play('hurry'); GameAudio.setHurry(true);
        for (const e of Enemies.list) e.angry = true;
      }
      if (!def.boss && Game.hurry && !Game.landlord && Game.levelTime > hurryAt + 12) {
        Game.landlord = Enemies.spawn('landlord', 128, World.TOP + 10, { appear: 30 });
        Game.banner('THE LANDLORD IS HERE FOR THE RENT!', '#58f898', 110);
        LP.Audio.play('landlord');
      }
    } else if (ph === 'clear') {
      for (const p of Players.list) p.victory = !p.out && p.onGround && Math.abs(p.vx) < 0.15;
      if (Game.pt > (Game.clearBoss ? 4.5 : 2.2)) {
        Game.phase = 'tally'; Game.pt = 0;
        const R = GAME_CONFIG.rules, t = Game.levelTime;
        const tb = LEVELS[Game.level].boss ? 10000 : Math.max(0, Math.round(R.timePar - t)) * R.timeBonus;
        const perfect = Game.noDamage ? R.perfect * (LEVELS[Game.level].boss ? 4 : 1) : 0;
        Game.tally = { time: tb, perfect, shown: 0, secs: t };
        for (const p of Players.list) if (!p.out) Game.addScore(p, Math.round((tb + perfect) / Players.list.filter((q) => !q.out).length), undefined, undefined, null, true);
      }
    } else if (ph === 'tally') {
      for (const p of Players.list) p.victory = !p.out;
      const T = Game.tally, total = T.time + T.perfect;
      if (T.shown < total) { T.shown = Math.min(total, T.shown + Math.max(100, Math.round(total / 30))); if ((LP.Loop.frame & 3) === 0) LP.Audio.play('tick'); }
      if (Game.pt > 1.7) Game.next();
    } else if (ph === 'dead') {
      if (Game.pt > 1.6) LP.States.go('continue');
    }
  },
  next() {
    if (Game.level >= 100) { LP.States.go('ending'); return; }
    // revive any player who is out but still has continues? (two-player: they rejoin at the next level)
    Game.startLevel(Game.level + 1);
  },
  continueGame() {
    Game.continuesLeft--;
    for (const p of Players.list) { if (p.out || p.lives <= 0) { Players.revive(p); p.continues++; } }
    Game.phase = 'play'; Game.pt = 0;
    Game.music();
  },
  // two-player: a knocked-out sloth can buy back in with a continue (their FIRE button)
  checkRejoin() {
    if (Game.mode !== 2 || Game.continuesLeft <= 0) return;
    for (const p of Players.list) {
      if (p.out && LP.Input.pressed('p' + (p.idx + 1) + 'fire') && Players.list.some((q) => !q.out)) {
        Game.continuesLeft--; Players.revive(p); p.continues++;
        LP.Audio.play('start');
        Game.banner((p.who === 'slub' ? 'SLUB' : 'SLOB') + ' IS BACK!', p.who === 'slub' ? '#b8f818' : '#3cbcfc', 70);
      }
    }
  },
  // debug / test helper: warp straight to any level
  warp(n) { if (!LP.States.is('game')) { Game.newGame(Game.mode || 1, Game.who || 'slub', n); LP.States.go('game', 'keep'); } else Game.startLevel(n); },

  // ---------------------------------------------------------------- render
  render() {
    const g = LP.LCD.ctx;
    G.g = g;
    g.save();
    g.translate(LP.FX.sx, LP.FX.sy);
    World.drawBack();
    Items.draw();
    Enemies.draw();
    Bosses.draw();
    Bubbles.draw();
    LP.FX.draw();
    const lights = [];
    if (World.dark) {
      for (const p of Players.list) if (!p.out) lights.push({ x: p.x, y: p.y - 12, r: 40 });
      for (const b of Bubbles.list) if (b.trapped.length) lights.push({ x: b.x, y: b.y, r: 13 });
      for (const it of Items.list) lights.push({ x: it.x, y: it.y - 5, r: 9 });
    }
    World.drawFront(lights);
    g.restore();
    // hi-res sloths (queued; drawn by the post hook in main.js)
    for (const p of Players.list) Players.queueDraw(p);
    // front pixel layer
    G.to(G.fgc, () => {
      G.fgc.save(); G.fgc.translate(LP.FX.sx, LP.FX.sy);
      for (const p of Players.list) Players.drawFront(p);
      for (const pp of Game.popups) {
        if (pp.t > 40 && (pp.t >> 1) % 2) continue;
        const yy = pp.y - Math.min(16, pp.t * 0.6);
        Font.draw(G.fgc, pp.text, pp.x, yy, pp.color, { face: pp.big ? 'big' : 'small', align: 'center', outline: '#000' });
      }
      G.fgc.restore();
      for (const bn of Game.banners) {
        if (bn.t > bn.life - 12 && (bn.t >> 1) % 2) continue;
        const s = bn.text.length > 24 ? 1 : 1, wob = bn.t < 8 ? (8 - bn.t) : 0;
        const w = Font.width(bn.text, 'big', s);
        if (w > 240) Font.draw(G.fgc, bn.text, 128, bn.y - wob, bn.color, { face: 'small', align: 'center', outline: '#000' });
        else Font.draw(G.fgc, bn.text, 128, bn.y - wob, bn.color, { align: 'center', outline: '#000', scale: s });
      }
      Game.drawHud();
      Bosses.drawHud();
      Game.drawPhase();
    });
  },

  drawHud() {
    const g = G.fgc;
    G.rect(0, 0, 256, 16, '#000');
    const slot = (p, side) => {
      const x = side ? 252 : 4, col = p.who === 'slub' ? '#b8f818' : '#3cbcfc';
      Font.draw(g, (p.who === 'slub' ? 'SLUB' : 'SLOB'), side ? x - 58 : x, 1, col, { face: 'small', align: side ? 'right' : 'left' });
      Font.draw(g, LP.pad(p.score, 7), side ? x : x + 18, 1, '#fcfcfc', { face: 'big', align: side ? 'right' : 'left' });
      const icon = Sprites.icon(p.who === 'slub' ? 'slubHead' : 'slobHead');
      if (p.out) Font.draw(g, Game.mode === 2 && Game.continuesLeft > 0 && (LP.Loop.frame >> 4) % 2 ? 'FIRE TO JOIN' : 'GAME OVER', x, 9, '#f83800', { face: 'small', align: side ? 'right' : 'left' });
      else {
        const n = Math.min(6, p.lives);
        for (let i = 0; i < n; i++) g.drawImage(icon, side ? x - 7 - i * 8 : x + i * 8, 9);
        if (p.lives > 6) Font.draw(g, 'x' + p.lives, side ? x - 52 : x + 50, 10, '#fcfcfc', { face: 'small', align: side ? 'right' : 'left' });
        // active power-ups (icons with blinking when nearly out)
        let k = 0;
        for (const id in p.power) {
          const left = p.power[id];
          if (left < 120 && (LP.Loop.frame >> 2) % 2) { k++; continue; }
          const ic = Items.icon(id), px = side ? x - 60 - k * 9 : x + 52 + k * 9;
          g.drawImage(ic, 0, 0, 11, 11, px, 8, 8, 8); k++;
        }
      }
    };
    if (Game.mode === 1) slot(Players.list[0], Players.list[0].who === 'slob');
    else { slot(Players.list[0], false); slot(Players.list[1], true); }
    // centre: hi-score + level
    const cx = Game.mode === 1 ? (Players.list[0].who === 'slob' ? 70 : 186) : 128;
    Font.draw(g, 'HI ' + LP.pad(Math.max(Game.hiScore, Players.list.reduce((m, p) => Math.max(m, p.score), 0)), 7), cx, 1, '#f878f8', { face: 'small', align: 'center' });
    Font.draw(g, 'LEVEL ' + Game.level, cx, 9, '#f8b800', { face: 'small', align: 'center' });
    if (Game.freeze > 0) Font.draw(g, 'FREEZE', cx, 9, (Game.freeze >> 3) % 2 ? '#3cbcfc' : '#fcfcfc', { face: 'small', align: 'center' });
  },

  drawPhase() {
    const g = G.fgc, ph = Game.phase;
    if (ph === 'intro') {
      const def = LEVELS[Game.level], w = LevelInfo.world(Game.level);
      if (def.boss) {
        const info = BOSS_INFO[def.boss];
        if ((LP.Loop.frame >> 3) % 2) Font.draw(g, 'WARNING!', 128, 50, '#f83800', { align: 'center', scale: 2, outline: '#000' });
        G.panel(32, 76, 192, 46, '#000', '#f83800');
        Font.draw(g, 'LEVEL ' + Game.level, 128, 84, '#f8b800', { align: 'center' });
        Font.draw(g, info.name, 128, 96, '#fcfcfc', { align: 'center' });
        Font.draw(g, info.sub, 128, 108, '#bcbcbc', { face: 'small', align: 'center' });
        return;
      }
      const showWorld = Game.introLen > 2;
      G.panel(56, showWorld ? 64 : 72, 144, showWorld ? 56 : 40);
      if (showWorld) Font.draw(g, 'WORLD ' + (w + 1), 128, 72, '#3cbcfc', { face: 'small', align: 'center' }), Font.draw(g, WORLDS[w].name, 128, 80, '#fcfcfc', { face: 'small', align: 'center' });
      const y0 = showWorld ? 92 : 80;
      Font.draw(g, 'LEVEL ' + Game.level, 128, y0, '#f8b800', { align: 'center' });
      if (Game.pt > (showWorld ? 0.9 : 0.4)) Font.draw(g, 'READY!', 128, y0 + 12, '#fcfcfc', { align: 'center' });
      if (def.tip) { const tw = Font.width(def.tip, 'small'); G.rect(128 - tw / 2 - 4, 156, tw + 8, 11, '#000'); Font.draw(g, def.tip, 128, 159, '#b8f818', { face: 'small', align: 'center' }); }
    } else if (ph === 'clear') {
      const s = Game.pt < 0.3 ? 3 : 2;
      if (Game.level !== 100 || Game.pt < 2) Font.draw(g, Game.clearBoss ? 'BOSS DOWN!' : 'CLEAR!', 128, 40, (LP.Loop.frame >> 2) % 2 ? '#f8b800' : '#fcfcfc', { align: 'center', scale: s, outline: '#000' });
    } else if (ph === 'tally') {
      const T = Game.tally;
      G.panel(40, 60, 176, 72);
      Font.draw(g, 'LEVEL ' + Game.level + ' CLEAR!', 128, 68, '#f8b800', { align: 'center' });
      Font.draw(g, 'TIME ' + T.secs.toFixed(1) + 'S', 52, 84, '#fcfcfc', { face: 'small' });
      Font.draw(g, String(Math.min(T.shown, T.time)), 204, 84, '#fcfcfc', { face: 'small', align: 'right' });
      Font.draw(g, 'NO DAMAGE', 52, 96, T.perfect ? '#b8f818' : '#7c7c7c', { face: 'small' });
      Font.draw(g, String(T.perfect ? Math.max(0, T.shown - T.time) : 0), 204, 96, T.perfect ? '#b8f818' : '#7c7c7c', { face: 'small', align: 'right' });
      Font.draw(g, 'BONUS', 52, 112, '#f878f8');
      Font.draw(g, String(T.shown), 204, 112, '#f878f8', { align: 'right' });
    } else if (ph === 'dead') {
      Font.draw(g, 'OH NO!', 128, 88, '#f83800', { align: 'center', scale: 2, outline: '#000' });
    }
  }
};

LP.States.add({
  game: {
    enter(arg) { LP.LCD.resetGhost(); if (arg === 'resume') Game.music(); else if (arg === 'continue') Game.continueGame(); },
    update(dt) {
      const I = LP.Input;
      if (I.consume('start') || I.consume('pause')) { LP.Audio.play('pause'); LP.States.go('paused'); return; }
      Game.checkRejoin();
      Game.update(dt);
    },
    render: () => Game.render()
  }
});
