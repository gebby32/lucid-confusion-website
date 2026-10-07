/* GAME — one play session: score, lives, loops, bonus timer, SLOTH TIME, scoring
   rules, collisions, deaths, stage clears, the penthouse finale and the HUD.
   Phases inside the 'game' app state: ready -> play -> dying | clear | victory. */
'use strict';
const Game = {
  score: 0, hi: 0, lives: 3, loop: 1, stageIdx: 0, def: null, hero: null, diff: null,
  phase: 'ready', phaseT: 0, bonus: 0, bonusT: 0, charges: 1, slothT: 0, extraNext: 0,
  stageTime: 0, hurry: false, raged: false, pops: [], seq: null,

  get R() { return GAME_CONFIG.rules; },

  newGame() {
    const R = Game.R;
    Object.assign(Game, { score: 0, lives: R.lives, loop: 1, stageIdx: 0, charges: 0, extraNext: R.extraLife[0] });
    LP.Scores.list().then((l) => { Game.hi = l.length ? l[0].score : 0; });
    LP.Loop.reset();
  },

  difficulty(loop, s) {
    const L = loop - 1;
    return {
      speed: Math.min(1.8, 0.92 + 0.07 * s + 0.14 * L) * (s === 3 ? 1.15 : 1),
      interval: Math.max(0.8, 2.6 - 0.2 * s - 0.3 * L),
      maxHazards: Math.min(12, 5 + s + 2 * L),
      odd: Math.min(0.22, 0.05 + 0.02 * s + 0.035 * L),
      wild: Math.min(0.26, (s === 0 && !L ? 0.02 : 0.06) + 0.03 * s + 0.04 * L),
      kick: Math.min(0.32, 0.06 + 0.03 * s + 0.05 * L),
      ladder: Math.min(0.5, 0.2 + 0.04 * s + 0.06 * L),
      stomp: s === 3 || L >= 1,
      stompMin: Math.max(3.5, (s === 3 ? 6 : 11) - L), stompMax: Math.max(5, (s === 3 ? 9 : 15) - L),
      rage: false
    };
  },

  // fresh = arriving at a new stage (gets a SLOTH TIME charge); otherwise a retry after a death
  startStage(fresh) {
    const R = Game.R;
    Game.def = STAGES[Game.stageIdx];
    World.load(Game.def);
    Hazards.reset();
    King.reset(Game.def);
    Game.diff = Game.difficulty(Game.loop, Game.stageIdx);
    Game.bonus = Math.min(R.bonusMax, R.bonusStart + R.bonusLoopAdd * (Game.loop - 1));
    Game.bonusT = 0;
    if (fresh) Game.charges = Math.min(R.slothTime.maxCharges, Game.charges + 1);
    Game.hero = Hero.create(Game.def);
    Object.assign(Game, { phase: 'ready', phaseT: 0, stageTime: 0, hurry: false, raged: false, slothT: 0, pops: [], seq: null });
    GameAudio.setSlow(false); GameAudio.setHurry(false);
    LP.FX.clear();
  },

  // ------------------------------------------------------------------ update
  update(dt) {
    Game.phaseT += dt;
    const ts = Game.slothT > 0 ? Game.R.slothTime.scale : 1;
    switch (Game.phase) {
      case 'ready':
        World.update(dt); King.update(dt, Game.diff, Game.hero, Game.def);
        if (Game.phaseT > 1.7) { Game.phase = 'play'; Game.phaseT = 0; GameAudio.music(Game.stageIdx); }
        break;
      case 'play': Game.play(dt, ts); break;
      case 'dying': Game.dying(dt); break;
      case 'clear': Game.clearSeq(dt); break;
      case 'victory': Game.victorySeq(dt); break;
    }
    LP.FX.update();
    LP.prune(Game.pops, (p) => { p.t++; if (p.t < 20) p.y -= 0.5; return p.t > p.life; });
  },

  play(dt, ts) {
    const h = Game.hero, R = Game.R;
    Game.stageTime += dt * ts;
    if (LP.Input.consume('action')) Game.slothTime();
    if (Game.slothT > 0 && (Game.slothT -= dt) <= 0) { Game.slothT = 0; GameAudio.setSlow(false); LP.Audio.play('speedup'); }

    Hero.update(h, dt, ts);
    if (Game.phase !== 'play') return;                    // fell to his doom
    World.update(dt * ts);
    King.update(dt * ts, Game.diff, h, Game.def);
    Hazards.update(ts);

    // bonus timer
    Game.bonusT += dt * ts;
    if (Game.bonusT >= R.bonusEvery) {
      Game.bonusT -= R.bonusEvery;
      Game.bonus = Math.max(0, Game.bonus - R.bonusTick);
      if (Game.bonus <= 1000 && !Game.hurry) { Game.hurry = true; GameAudio.setHurry(true); LP.Audio.play('hurry'); }
      if (Game.bonus === 0 && !Game.raged) {
        Game.raged = true; Game.diff.rage = true; Game.diff.interval *= 0.65; Game.diff.wild += 0.08;
        King.talk("THAT'S IT! NO MORE MR NICE PENGUIN!", 3); LP.Audio.play('grumble');
      }
    }

    // collisions (favour the sloth: small boxes all round)
    const hb = Hero.box(h);
    if (h.invul <= 0) {
      for (const z of Hazards.list) if (LP.Hit.overlap(hb, Hazards.box(z))) return Game.heroDie('hit', z);
      const cause = World.deadly(hb);
      if (cause) return Game.heroDie(cause);
    }

    // jumping over things
    if (h.state === 'air' && h.jumping) {
      for (const z of Hazards.list) {
        if (z.jumped === h.jumpId) continue;
        const top = z.y - z.h;
        if (Math.abs(z.x - h.x) < z.w / 2 + 3 && h.y <= top + 4 && z.y - h.y < 34 && z.state !== 'ladder') {
          z.jumped = h.jumpId; h.combo++;
          const base = R.points[z.K.pts] || 100, pts = base * h.combo;
          Game.addScore(pts, z.x, top - 6, h.combo > 1 ? '#ff60ff' : '#ffffff');
          LP.Audio.play(h.combo > 1 ? 'combo' : 'points');
        }
      }
    }

    // pickups
    for (const it of World.items) {
      if (it.taken || Math.abs(it.x - h.x) > 8 || h.y < it.y - 14 || h.y > it.y + 3) continue;
      it.taken = true;
      LP.Audio.play('pickup');
      G.burst(it.x, it.y - 6, 8, '#ffe060', { speed: 1.2, life: 16 });
      if (it.kind === 'pillow') {
        if (Game.charges < R.slothTime.maxCharges) { Game.charges++; Game.popup(it.x, it.y - 16, 'SLOTH TIME +1', '#7ad8ff'); }
        else Game.addScore(800, it.x, it.y - 16, '#7ad8ff');
      } else Game.addScore(it.kind === 'chips' ? 500 : 300, it.x, it.y - 16, '#ffe060');
    }

    // new heights
    if ((h.state === 'ground' || h.state === 'climb') && h.tier > h.maxTier) {
      h.maxTier = h.tier;
      Game.addScore(R.points.tier, h.x, h.y - 26, '#60ff80');
    }

    // made it to the King's perch
    if (h.state === 'ground' && h.plat.goal) Game.stageClear();
  },

  slothTime() {
    if (Game.slothT > 0) return;
    if (Game.charges <= 0) { LP.Audio.play('denied'); return; }
    Game.charges--;
    Game.slothT = Game.R.slothTime.seconds;
    GameAudio.setSlow(true);
    LP.Audio.play('slowmo');
    Game.popup(Game.hero.x, Game.hero.y - 24, 'SLOTH TIME!', '#7ad8ff');
    if (Math.random() < 0.5) King.talk('WHY IS EVERYTHING SO SLOOOW', 2);
  },

  addScore(n, x, y, color) {
    Game.score += n;
    if (Game.score > Game.hi) Game.hi = Game.score;
    if (x !== undefined && x !== null) Game.popup(x, y, String(n), color || '#fff');
    while (Game.score >= Game.extraNext) {
      Game.lives++;
      Game.extraNext += Game.R.extraLife[1];
      LP.Audio.play('oneup');
      if (Game.hero) Game.popup(Game.hero.x, Game.hero.y - 30, 'EXTRA SLOTH!', '#40ff60');
    }
  },

  popup(x, y, text, color) {
    Game.pops.push({ x, y, text, color, t: 0, life: 50 });
    if (Game.pops.length > 12) Game.pops.shift();
  },

  steamPuff(x, y) {
    LP.FX.spawn({ x: x + LP.rand(-3, 3), y, vx: LP.rand(-0.2, 0.2), vy: -0.5, g: -0.01, drag: 0.97, life: 24, color: '#d8d8e0', size: 2, draw: G._part });
  },

  onStomp() {
    LP.FX.shake(3, 22);
    LP.Audio.play('stomp');
    G.dust(King.x - 5, King.y, 4, '#c0a0e0'); G.dust(King.x + 5, King.y, 4, '#c0a0e0');
    Hazards.stomp();
    Hero.jolt(Game.hero);
  },

  // ------------------------------------------------------------------ death
  heroDie(cause) {
    if (Game.phase !== 'play') return;
    const h = Game.hero;
    Game.phase = 'dying'; Game.phaseT = 0; Game.seq = { sting: false, laughed: false };
    h.state = 'dead'; h.deadT = 0; h.invul = 0; h.vx = 0;
    Game.slothT = 0; GameAudio.setSlow(false);
    LP.Audio.stopMusic();
    LP.Audio.play('hit');
    LP.FX.shake(3, 14); LP.FX.flash(2); LP.FX.hitstop(10);
    const words = { steam: 'TOO HOT!', press: 'FLATTENED!', fall: 'SPLAT!' };
    if (words[cause]) Game.popup(h.x, h.y - 24, words[cause], '#ff6040');
  },

  dying(dt) {
    Hero.update(Game.hero, dt, 1);
    King.update(dt, Game.diff, Game.hero, Game.def);
    const s = Game.seq, t = Game.phaseT;
    if (t > 0.45 && !s.sting) { s.sting = true; LP.Audio.play('death'); }
    if (t > 1.7 && !s.laughed) { s.laughed = true; King.laugh(); }
    if (t > 3.8) {
      Game.lives--;
      if (Game.lives <= 0) { LP.States.go('gameover'); return; }
      Game.startStage(false);
    }
  },

  // ------------------------------------------------------------------ stage clear (1-3)
  stageClear() {
    const h = Game.hero;
    Game.phase = Game.def.penthouse ? 'victory' : 'clear';
    Game.phaseT = 0;
    h.state = 'win'; h.deadT = 0; h.vx = 0; h.invul = 0;
    Game.slothT = 0; GameAudio.setSlow(false);
    Hazards.poof();
    LP.Audio.stopMusic();
    King.pending = null;
    King.setState('tantrum');
    Game.seq = { step: 0, tally: false, doneT: 0, extra: Game.R.clearBonus + 500 * (Game.loop - 1) };
    if (Game.phase === 'clear') {
      LP.Audio.play('clear');
      King.talk(LP.pick(['HMPH! NOT FAIR!', 'BEGINNERS LUCK!', 'GRRR! FINE!']), 1.6);
    } else {
      LP.Audio.play('grumble');
      King.talk('NO! NOT MY SOFA!', 1.6);
      Game.seq.extra = 5000 * Game.loop;
    }
  },

  clearSeq(dt) {
    const s = Game.seq, t = Game.phaseT;
    Hero.update(Game.hero, dt, 1);
    King.update(dt, Game.diff, Game.hero, Game.def);
    World.update(dt);
    if (s.step === 0 && t > 1.5) {
      s.step = 1; King.setState('fly'); King.vy = -0.2;
      King.talk("YOU HAVEN'T SEEN THE LAST OF ME!", 2.5); LP.Audio.play('flapaway');
    }
    if (t > 3.2) Game.tally(s);
    if (s.doneT && t - s.doneT > 1.6) {
      Game.stageIdx++;
      LP.States.go('intro');
    }
  },

  // bonus count-down into the score, then the completion bonus
  tally(s) {
    if (s.doneT) return;
    if (Game.bonus > 0) {
      if (Game.phaseT * 60 % 2 < 1) {
        const step = Math.min(100, Game.bonus);
        Game.bonus -= step; Game.addScore(step);
        LP.Audio.play('tick');
      }
      return;
    }
    if (!s.tally) { s.tally = true; Game.addScore(s.extra); LP.Audio.play('points'); s.doneT = Game.phaseT; }
  },

  // ------------------------------------------------------------------ the penthouse finale
  victorySeq(dt) {
    const s = Game.seq, t = Game.phaseT, K = King, h = Game.hero;
    Hero.update(h, dt, 1);
    World.update(dt);
    K.t += dt; K.time += dt;
    if (K.sayT > 0 && (K.sayT -= dt) <= 0) K.say = null;
    const sofaX = Game.def.sofa.x + 20, seatY = Game.def.king.y - 7;
    if (s.step === 0 && t > 1.4) { s.step = 1; s.x0 = K.x; K.setState('tantrum'); K.talk('GET OFF MY PERCH!', 1.2); }
    if (s.step === 1) {
      // hop onto the sofa
      const u = LP.clamp((t - 1.4) / 0.45, 0, 1);
      K.x = LP.lerp(s.x0, sofaX, u); K.y = LP.lerp(Game.def.king.y, seatY, u) - Math.sin(u * Math.PI) * 14;
      if (u >= 1) { s.step = 2; s.b = 0; s.bt = t; LP.Audio.play('boing'); }
    }
    if (s.step === 2) {
      // bounce, bounce, bouncier... the springs are not rated for this
      const hgt = [7, 12, 18][s.b], dur = 0.36 + s.b * 0.06, u = (t - s.bt) / dur;
      K.y = seatY - Math.sin(Math.min(1, u) * Math.PI) * hgt;
      if (u >= 1) {
        s.b++; s.bt = t; LP.Audio.play('boing');
        if (s.b === 3) { s.step = 3; K.setState('launched'); K.vy = -5.2; K.vx = 1.25; LP.Audio.play('launch'); LP.FX.shake(2, 10); K.talk('WHOOOOAAA!', 1.5); s.springT = t; }
      }
    }
    if (s.step === 3) {
      K.vy += 0.12; K.y += K.vy; K.x += K.vx;
      if (K.y < -50 && K.vy > 0 || t - s.springT > 1.6) { s.step = 4; s.fallT = t; LP.Audio.play('whistle'); K.x = 160; K.y = -40; K.vy = 0; K.vx = 0; }
    }
    if (s.step === 4 && t - s.fallT > 0.7) {
      K.vy = Math.min(K.vy + 0.12, 5); K.y += K.vy;
      if (K.y >= World.floor.y0 - 4) {
        s.step = 5; s.crashT = t; K.hidden = true; K.say = null;
        s.barrel = { x: 160, y: World.floor.y0 };
        LP.Audio.play('crash'); LP.FX.shake(4, 24); LP.FX.flash(2);
        G.burst(160, World.floor.y0 - 8, 16, '#a08870', { speed: 2 });
        s.crown = { x0: 160, y0: World.floor.y0 - 20, t: 0 };
      }
    }
    if (s.step >= 5 && s.crown && !h.crown) {
      s.crown.t += dt;
      if (s.crown.t > 1.3) { h.crown = true; LP.Audio.play('crown'); Game.popup(h.x, h.y - 28, 'SLOTH KING!', '#ffd21a'); }
    }
    if (s.step === 5 && t - s.crashT > 1.6) { s.step = 6; s.bannerT = t; LP.Audio.play('victory'); }
    if (s.step === 6 && t - s.bannerT > 3.4) Game.tally(s);
    if (s.doneT && t - s.doneT > 2) {
      Game.loop++; Game.stageIdx = 0;
      LP.States.go('loopcard');
    }
  },

  // ------------------------------------------------------------------ render
  render() {
    const g = LP.LCD.ctx, h = Game.hero, s = Game.seq;
    g.save();
    g.translate(LP.FX.sx, LP.FX.sy);
    World.draw();
    if (Game.phase === 'victory' && s && s.step >= 3) Game.drawSprings(s);
    King.draw(h);
    if (s && s.barrel) Game.drawStuckKing(s.barrel.x, s.barrel.y);
    Hazards.draw();
    Hero.draw(h);
    if (s && s.crown && !h.crown) {
      const u = LP.clamp(s.crown.t / 1.3, 0, 1);
      const x = LP.lerp(s.crown.x0, h.x - 3, u), y = LP.lerp(s.crown.y0, h.y - 19, u) - Math.sin(u * Math.PI) * 70;
      Hero.drawCrown(x, y);
    }
    LP.FX.draw();
    for (const p of Game.pops) {
      if (p.t > p.life - 12 && p.t % 4 < 2) continue;
      Font.draw(g, p.text, p.x, p.y, p.color, { face: 'small', align: 'center', outline: '#000' });
    }
    g.restore();

    if (Game.slothT > 0) {
      g.fillStyle = 'rgba(40,90,220,0.13)'; g.fillRect(0, 20, 320, 220);
      const blink = Game.slothT > 1 || Math.floor(Game.slothT * 8) % 2;
      if (blink) { G.frame(0, 20, 320, 220, '#4ad0ff'); G.frame(1, 21, 318, 218, '#1a5ab0'); }
      const w = Math.round(80 * Game.slothT / Game.R.slothTime.seconds);
      G.rect(120, 29, 80, 3, '#0a2050'); G.rect(120, 29, w, 3, '#4ad0ff');
      Font.draw(g, 'SLOTH TIME', 160, 22, '#9ae8ff', { face: 'small', align: 'center', outline: '#000' });
    }
    Game.drawHud();
    Game.drawPhase();
  },

  drawHud() {
    const g = LP.LCD.ctx, t = LP.Loop.time;
    if (Game.phase !== 'play' || Math.floor(t * 2.5) % 2 === 0) Font.draw(g, '1UP', 20, 1, '#ff3a3a');
    Font.draw(g, LP.pad(Game.score, 6), 8, 10, '#ffffff');
    for (let i = 0; i < Game.charges; i++) Font.draw(g, 'Z', 62 + i * 9, 1, '#7ad8ff', { shadow: '#1a3a9a' });
    for (let i = 0; i < Math.min(6, Game.lives - 1); i++) g.drawImage(Sprites.lifeIcon, 62 + i * 9, 10);
    Font.draw(g, 'HIGH SCORE', 160, 1, '#ff3a3a', { align: 'center' });
    Font.draw(g, LP.pad(Game.hi, 6), 160, 10, '#ffffff', { align: 'center' });
    const hurry = Game.hurry && Game.phase === 'play', blink = hurry && Math.floor(t * 4) % 2;
    G.rect(246, 0, 64, 19, '#000');
    G.frame(246, 0, 64, 19, blink ? '#ff3030' : '#3a6af0'); G.frame(247, 1, 62, 17, blink ? '#801010' : '#1a2a7a');
    Font.draw(g, 'BONUS', 278, 3, '#ffd040', { face: 'small', align: 'center' });
    Font.draw(g, LP.pad(Game.bonus, 4), 278, 10, hurry ? '#ff5050' : '#ffffff', { align: 'center' });
    Font.draw(g, 'STAGE ' + (Game.stageIdx + 1) + (Game.loop > 1 ? '  LOOP ' + Game.loop : ''), 306, 22, '#7a7a96', { face: 'small', align: 'right' });
  },

  panel(x, y, w, h, border) {
    G.rect(x, y, w, h, '#000');
    G.frame(x, y, w, h, border || '#3a6af0'); G.frame(x + 2, y + 2, w - 4, h - 4, '#1a2a7a');
  },

  drawPhase() {
    const g = LP.LCD.ctx, t = Game.phaseT, s = Game.seq;
    if (Game.phase === 'ready') {
      Game.panel(104, 104, 112, 34);
      Font.draw(g, 'PLAYER 1', 160, 111, '#7ad8ff', { align: 'center' });
      if (Math.floor(t * 4) % 2 === 0 || t > 1) Font.draw(g, 'READY!', 160, 123, '#ffd040', { align: 'center' });
    }
    if (Game.phase === 'clear' && t > 0.6) {
      Game.panel(76, 98, 168, t > 3.2 ? 54 : 30, '#40c060');
      Font.draw(g, 'STAGE CLEAR!', 160, 106, Math.floor(t * 6) % 2 ? '#ffd040' : '#ffffff', { align: 'center', shadow: '#a02020' });
      if (t > 3.2) Game.drawTally(118, s);
    }
    if (Game.phase === 'victory' && s && s.step >= 6) {
      const tt = t - s.bannerT;
      Game.panel(40, 86, 240, s.doneT || tt > 3.4 ? 72 : 46, '#ffd040');
      Font.draw(g, 'SOFA KING', 160, 94, '#ffd040', { align: 'center', scale: 2, shadow: '#a02020' });
      Font.draw(g, 'DETHRONED!', 160, 112, Math.floor(tt * 6) % 2 ? '#ffffff' : '#ff7070', { align: 'center' });
      if (tt > 3.4) Game.drawTally(126, s, 'DETHRONE BONUS');
    }
  },

  drawTally(y, s, label) {
    const g = LP.LCD.ctx;
    Font.draw(g, 'TIME BONUS', 92, y, '#7ad8ff', { face: 'small' });
    Font.draw(g, LP.pad(Game.bonus, 4), 228, y, '#ffffff', { face: 'small', align: 'right' });
    if (s.tally) {
      Font.draw(g, label || 'CLEAR BONUS', 92, y + 10, '#7ad8ff', { face: 'small' });
      Font.draw(g, String(s.extra), 228, y + 10, '#ffd040', { face: 'small', align: 'right' });
    }
  },

  // the sofa springs give way (finale): a coil boings out of the seat and wobbles
  drawSprings(s) {
    const x = Game.def.sofa.x + 20, y = Game.def.king.y - 8, age = Game.phaseT - s.springT;
    const len = Math.round(LP.clamp(age * 40, 0, 12) + Math.sin(age * 18) * Math.max(0, 3 - age));
    for (let i = 0; i < len; i++) G.rect(x - 3 + (i % 2) * 2, y - i, 4, 1, i % 2 ? '#d8d8e8' : '#808090');
  },

  // Sofa King, head first in a barrel, feet kicking
  drawStuckKing(x, y) {
    const g = LP.LCD.ctx, k = Math.floor(LP.Loop.time * 8) % 2;
    G.ellipse(x, y - 17, 7, 6, '#121c5a'); G.ellipse(x, y - 17, 6, 5, '#24369c'); G.ellipse(x + 1, y - 16, 4, 3, '#f2f2f6');
    G.rect(x - 5, y - 27 - k * 2, 3, 6, '#ff9a10'); G.rect(x - 7, y - 28 - k * 2, 6, 2, '#ff9a10');
    G.rect(x + 3, y - 27 - (1 - k) * 2, 3, 6, '#ff9a10'); G.rect(x + 2, y - 28 - (1 - k) * 2, 6, 2, '#ff9a10');
    // the barrel
    for (let r = 0; r < 16; r++) {
      const w = r === 0 || r === 15 ? 12 : 14;
      G.rect(x - w / 2, y - 16 + r, w, 1, '#1a0c04');
      G.rect(x - w / 2 + 1, y - 16 + r, w - 2, 1, '#b8682c');
      G.rect(x - w / 2 + 2, y - 16 + r, 2, 1, '#f0a050');
    }
    G.rect(x - 7, y - 13, 14, 1, '#9aa2b4'); G.rect(x - 7, y - 4, 14, 1, '#9aa2b4');
    G.rect(x - 6, y - 16, 12, 1, '#3a1a08');
    if (Math.floor(LP.Loop.time * 2) % 2) Font.draw(g, 'MMPH!', x + 10, y - 30, '#fff', { face: 'small' });
  }
};

// ------------------------------------------------------------------ app states
LP.States.add({
  game: {
    enter(arg) {
      if (arg === 'resume') { if (Game.phase === 'play') GameAudio.music(Game.stageIdx); return; }
    },
    update(dt) {
      const I = LP.Input;
      if (I.consume('start') || I.consume('back') || I.consume('pause')) { LP.Audio.play('pause'); LP.States.go('paused'); return; }
      Game.update(dt);
    },
    render() { Game.render(); }
  }
});
