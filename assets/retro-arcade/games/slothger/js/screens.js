/* SCREENS — title (the supplied title artwork, shown untouched at full monitor resolution),
   main menu, stage select, how to play, options, high scores, pause, continue, game over,
   initials entry, and the ending. Menus are arcade windows drawn in the front pixel layer. */
'use strict';
const Screens = {
  titleArt: LP.loadImage('assets/title.png'),
  scores: [], menu: 0, pmenu: 0, omenu: 0, startIdx: 0, page: 0, idle: 0, menuOpen: false,
  entryQueue: [], entry: null, lastRank: -1, scoresFrom: 'title', confirmReset: false, optFrom: 'title', howFrom: 'title',
  won: false,
  art: null,           // post hook: draws hi-res art under the sloth (title)

  loadScores() {
    return LP.Scores.list().then((l) => { Screens.scores = l; Game.hiScore = Math.max(Game.hiScore, l.length ? l[0].score : 0); });
  },
  noteReached(n) { if (n > LP.Store.get('reached', 1)) LP.Store.set('reached', n); },
  starts() {
    const r = LP.Store.get('reached', 1);
    return WORLDS.filter((w) => w.from <= r).map((w) => w.from);
  },
  applySettings() {
    LP.Audio.applySettings();
    LP.Shell.setFit(LP.Settings.get('fit'));
  },
  nav() {
    const I = LP.Input;
    return { up: I.consume('up'), down: I.consume('down'), left: I.consume('left'), right: I.consume('right'), ok: I.consume('confirm') || I.consume('start'), back: I.consume('back') };
  },
  drawTitleArt(octx, k) {
    const img = Screens.titleArt;
    if (img.complete && img.naturalWidth) { octx.imageSmoothingEnabled = true; octx.imageSmoothingQuality = 'high'; octx.drawImage(img, 0, 0, 320 * k, 240 * k); }
  },
  clearFg() { G.fgc.clearRect(0, 0, 320, 240); },
  // a pixel scene behind menus: a calm meadow lane set
  backdrop() {
    if (!Screens._bd) {
      Screens._bd = G.make(320, 240, (g) => {
        const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
        r(0, 0, 320, 240, '#1848c8');
        for (let y = 0; y < 240; y += 32) { r(0, y, 320, 16, '#38a028'); for (let x = 0; x < 320; x += 4) r(x + ((y >> 4) % 3), y + 3 + (x * 7) % 10, 1, 2, '#207818'); }
        for (let y = 16; y < 240; y += 32) for (let x = (y * 3) % 40; x < 320; x += 40) r(x, y + 5, 10, 1, '#2c68e8');
      });
    }
    LP.LCD.ctx.drawImage(Screens._bd, 0, 0);
    const t = LP.Loop.frame, g = LP.LCD.ctx;
    for (let i = 0; i < 6; i++) {
      const y = 16 + i * 32 + 2, dir = i % 2 ? -1 : 1, x = ((t * 0.4 * dir + i * 70) % 400 + 400) % 400 - 60;
      g.drawImage(Sprites.log(48), Math.round(x), y);
    }
  },
  menuList(items, sel, x, y, gap, opts) {
    opts = opts || {};
    items.forEach((it, i) => {
      const on = i === sel;
      Font.draw(G.fgc, it, x, y + i * gap, on ? (opts.on || '#f8b800') : (opts.off || '#fcfcfc'), { align: opts.align || 'left', outline: '#000' });
      if (on && (LP.Loop.frame >> 3) % 2 === 0) {
        const w = Font.width(it, 'big');
        const lx = opts.align === 'center' ? x - w / 2 - 12 : x - 12;
        Font.draw(G.fgc, '>', lx, y + i * gap, '#f83800');
        if (opts.align === 'center') Font.draw(G.fgc, '<', x + w / 2 + 5, y + i * gap, '#f83800');
      }
    });
  },
  startGame(stage) {
    LP.Audio.play('start');
    Game.newGame(stage);
    Screens.won = false;
    LP.States.go('game', 'new');
  }
};

LP.States.add({
  // ================================================================ TITLE
  title: {
    enter() {
      Screens.idle = 0; Screens.art = Screens.drawTitleArt; Sloth.clear();
      Screens.loadScores();
      if (!LP.Audio.ctx) LP.Audio.wantSong = 'title'; else LP.Audio.startMusic('title');
    },
    exit() { Screens.art = null; },
    update(dt) {
      const n = Screens.nav();
      Screens.idle += dt;
      if (!Screens.menuOpen) {
        if (n.ok) { Screens.menuOpen = true; Screens.menu = 0; Screens.idle = 0; LP.Audio.play('select'); LP.Audio.startMusic('title'); }
        if (Screens.idle > 20) { Screens.scoresFrom = 'attract'; LP.States.go('scores'); }
        return;
      }
      if (n.up || n.down || n.left || n.right || n.ok || n.back) Screens.idle = 0;
      if (Screens.idle > 30) { Screens.menuOpen = false; Screens.idle = 0; }
      const M = Screens.menu;
      if (n.up || n.down) { Screens.menu = M ^ 2; LP.Audio.play('menu'); }
      if (n.left || n.right) { Screens.menu = M ^ 1; LP.Audio.play('menu'); }
      if (n.back) { Screens.menuOpen = false; LP.Audio.play('menu'); }
      if (n.ok) {
        LP.Audio.play('select');
        switch (Screens.menu) {
          case 0: if (Screens.starts().length > 1) LP.States.go('select'); else Screens.startGame(1); break;
          case 1: LP.States.go('howto', 'title'); break;
          case 2: Screens.scoresFrom = 'title'; LP.States.go('scores'); break;
          case 3: LP.States.go('options', 'title'); break;
        }
      }
    },
    render() {
      const g = LP.LCD.ctx; g.fillStyle = '#000'; g.fillRect(0, 0, 320, 240);
      Screens.clearFg();
      G.to(G.fgc, () => {
        if (!Screens.menuOpen) return;                     // the art itself says PRESS START
        G.panel(54, 196, 212, 42, '#000', '#58d854');
        const items = ['START', 'HOW TO PLAY', 'HIGH SCORES', 'OPTIONS'];
        items.forEach((it, i) => {
          const x = i % 2 ? 214 : 108, y = 205 + (i >> 1) * 15, on = i === Screens.menu;
          Font.draw(G.fgc, it, x, y, on ? '#f8b800' : '#fcfcfc', { align: 'center' });
          if (on && (LP.Loop.frame >> 3) % 2 === 0) Font.draw(G.fgc, '>', x - Font.width(it) / 2 - 11, y, '#f83800');
        });
      });
    }
  },

  // ================================================================ STAGE SELECT (worlds reached so far)
  select: {
    enter() { Screens.startIdx = 0; },
    update() {
      const n = Screens.nav(), starts = Screens.starts();
      if (n.back) { LP.Audio.play('menu'); LP.States.go('title'); Screens.menuOpen = true; return; }
      if (n.up) { Screens.startIdx = (Screens.startIdx + starts.length - 1) % starts.length; LP.Audio.play('menu'); }
      if (n.down) { Screens.startIdx = (Screens.startIdx + 1) % starts.length; LP.Audio.play('menu'); }
      if (n.ok) Screens.startGame(starts[Screens.startIdx]);
    },
    render() {
      Screens.backdrop();
      LP.LCD.ctx.fillStyle = 'rgba(0,0,30,0.55)'; LP.LCD.ctx.fillRect(0, 0, 320, 240);
      Screens.clearFg();
      const g = G.fgc, t = LP.Loop.frame, starts = Screens.starts();
      G.to(g, () => {
        G.panel(70, 24, 236, 196, '#000', '#58d854');
        Font.draw(g, 'WHERE TO START?', 188, 36, '#f8b800', { align: 'center' });
        WORLDS.forEach((w, i) => {
          const open = starts.includes(w.from), on = open && starts[Screens.startIdx] === w.from, y = 62 + i * 22;
          Font.draw(g, 'WORLD ' + (i + 1), 92, y, on ? '#f8b800' : open ? '#fcfcfc' : '#3c3c3c');
          Font.draw(g, open ? w.name : '? ? ?', 92, y + 10, on ? '#58f898' : open ? '#bcbcbc' : '#3c3c3c', { face: 'small' });
          if (on && (t >> 3) % 2 === 0) Font.draw(g, '>', 80, y, '#f83800');
          if (open) Font.draw(g, 'STAGE ' + w.from, 296, y, on ? '#f8b800' : '#7c7c7c', { face: 'small', align: 'right' });
        });
        Font.draw(g, 'UP/DOWN CHOOSE   ENTER / A GO   ESC BACK', 188, 206, '#7c7c7c', { face: 'small', align: 'center' });
      });
      Sloth.queue({ dir: 'down', x: 36, y: 200 - Math.abs(Math.sin(t * 0.08)) * 6, h: 64, sy: 1 + Math.sin(t * 0.06) * 0.015 });
    }
  },

  // ================================================================ HOW TO PLAY
  howto: {
    enter(from) { Screens.page = 0; Screens.howFrom = from || 'title'; Screens.howT = 0; },
    update(dt) {
      const n = Screens.nav(), pages = 3;
      Screens.howT += dt;
      const leave = () => { LP.States.go(Screens.howFrom === 'paused' ? 'paused' : 'title'); if (Screens.howFrom === 'title') Screens.menuOpen = true; };
      if (Screens.howFrom === 'attract') {
        if (Screens.howT > 7) { Screens.howT = 0; if (++Screens.page >= pages) LP.States.go('title'); }
        if (LP.Input.any()) { LP.Input.clearPresses(); LP.States.go('title'); }
        return;
      }
      if (n.left) { Screens.page = (Screens.page + pages - 1) % pages; LP.Audio.play('menu'); }
      if (n.right || n.ok) {
        if (n.ok && Screens.page === pages - 1) { LP.Audio.play('menu'); return leave(); }
        Screens.page = (Screens.page + 1) % pages; LP.Audio.play('menu');
      }
      if (n.back) { LP.Audio.play('menu'); leave(); }
    },
    render() {
      if (Screens.howFrom === 'paused') Game.render(); else Screens.backdrop();
      Sloth.clear();
      LP.LCD.ctx.fillStyle = 'rgba(0,0,30,0.6)'; LP.LCD.ctx.fillRect(0, 0, 320, 240);
      Screens.clearFg();
      const g = G.fgc, t = LP.Loop.frame, P2 = Screens.page;
      G.to(g, () => {
        G.panel(4, 4, 312, 232, '#000', '#3cbcfc');
        Font.draw(g, 'HOW TO PLAY  ' + (P2 + 1) + '/3', 160, 12, '#f8b800', { align: 'center' });
        const line = (s, y, c, x) => Font.draw(g, s, x || 18, y, c || '#fcfcfc', { face: 'small' });
        if (P2 === 0) {
          line('GET THE SLOTH HOME. ONE HOP AT A TIME.', 30, '#58f898');
          line('HOP INTO EVERY EMPTY HOME AT THE TOP TO CLEAR THE STAGE.', 42);
          line('CARS SQUASH. WATER SINKS. RIDE LOGS, TURTLES AND RAFTS.', 54);
          line('DO NOT RIDE OFF THE EDGE OF THE SCREEN.', 66);
          line('BEAT THE CLOCK: THE TIMER BAR IS AT THE BOTTOM.', 78);
          line('30 STAGES IN 6 WORLDS. THE LAST ONE IS THE ROAD HOME.', 90, '#f8b800');
          line('MOVE', 112, '#f8b800', 18); line('ARROW KEYS OR W A S D   /   D-PAD OR LEFT STICK', 112, '#fcfcfc', 62);
          line('PAUSE', 124, '#f8b800', 18); line('ENTER OR ESC   /   START', 124, '#fcfcfc', 62);
          line('MENUS', 136, '#f8b800', 18); line('ENTER = OK  ESC = BACK   /   A = OK  B = BACK', 136, '#fcfcfc', 62);
          line('MUTE', 148, '#f8b800', 18); line('M        FULLSCREEN: F2', 148, '#fcfcfc', 62);
          line('TAP A DIRECTION FOR ONE HOP. HOLD IT TO KEEP HOPPING.', 166, '#a4e4fc');
          const x = 40 + ((t * 0.6) % 240);
          g.drawImage(Sprites.log(64), Math.round(x) - 20, 186);
          g.drawImage(Sprites.vehicle('car', 0, -1, 0), Math.round(300 - ((t * 1.1) % 300)), 210);
        } else if (P2 === 1) {
          line('THINGS THAT WANT TO HELP:', 28, '#58f898');
          const row = (img, x, y, txt) => { g.drawImage(img, x, y); line(txt, y + 3, '#fcfcfc', x + img.width + 6); };
          row(Sprites.log(32), 18, 40, 'LOGS, RAFTS, CRATES');
          row(Sprites.turtle(0), 170, 40, 'TURTLES (SOME DIVE)');
          row(Sprites.pad(0, 0), 18, 58, 'LILY PADS (PINK ONES SINK)');
          row(Sprites.floe(32, 1), 170, 58, 'ICE (CRACKED ONES SINK)');
          row(Sprites.gator(false, 1), 18, 76, 'GATOR BACKS. NOT THE HEAD!');
          line('CONVEYOR BELTS CARRY YOU ALONG LIKE LOGS.', 98, '#a4e4fc');
          line('THINGS THAT DO NOT:', 114, '#f83800');
          row(Sprites.vehicle('truck', 1, 1, 0), 18, 126, 'TRAFFIC');
          row(Sprites.loco('works', 1), 170, 126, 'TRAINS (WATCH THE LIGHTS)');
          row(Sprites.vehicle('snake', 0, 1, (t >> 3) & 1), 18, 146, 'SNAKES');
          row(Sprites.saw((t >> 2) & 1), 170, 146, 'SAWS ON BELTS');
          line('PRESSES, MANHOLES, GEYSERS AND STEAM VENTS WARN YOU', 170);
          line('FIRST: THEY SHAKE, RATTLE OR BUBBLE. THEN THEY GO.', 180);
          line('THIN ICE CRACKS UNDER A SLOTH THAT STANDS STILL.', 194, '#a4e4fc');
        } else {
          line('SCORING', 28, '#f8b800');
          const pts = [['EACH NEW ROW FORWARD', '10'], ['GETTING HOME', '50'], ['+ EVERY SECOND LEFT', '10'], ['FLY IN A HOME', '200'],
            ['LEAF RIDING A LOG (EAT IT)', '100'], ['ALL HOMES FILLED', '1000'], ['EXTRA SLOTH EVERY', '20000']];
          pts.forEach(([a, b], i) => { line(a, 42 + i * 12); Font.draw(g, b, 300, 42 + i * 12, '#f8b800', { face: 'small', align: 'right' }); });
          g.drawImage(Sprites.fly((t >> 2) & 1), 150, 79); g.drawImage(Sprites.leaf(), 150, 89);
          line('GATORS SOMETIMES HIDE IN THE HOMES. WAIT FOR THEM TO GO.', 136, '#f83800');
          line('THE FINAL STAGE IS TALL. CHECKPOINTS SAVE YOUR PROGRESS.', 150, '#58f898');
          line('NO SLOTHS ARE HURRIED IN THIS GAME. EXCEPT THIS ONE.', 170, '#a4e4fc');
          g.drawImage(Sprites.gatorHead(1), 150, 186);
        }
        Font.draw(g, '< LEFT / RIGHT >     ESC BACK', 160, 222, '#7c7c7c', { face: 'small', align: 'center' });
      });
    }
  },

  // ================================================================ OPTIONS
  options: {
    enter(from) { if (from) Screens.optFrom = from; Screens.omenu = 0; Screens.confirmReset = false; },
    update() {
      const n = Screens.nav(), S = LP.Settings, items = 8;
      if (n.up) { Screens.omenu = (Screens.omenu + items - 1) % items; LP.Audio.play('menu'); Screens.confirmReset = false; }
      if (n.down) { Screens.omenu = (Screens.omenu + 1) % items; LP.Audio.play('menu'); Screens.confirmReset = false; }
      const d = n.left ? -1 : n.right ? 1 : 0;
      const back = () => { LP.States.go(Screens.optFrom === 'paused' ? 'paused' : 'title'); if (Screens.optFrom === 'title') Screens.menuOpen = true; };
      if (n.back) { LP.Audio.play('menu'); back(); return; }
      switch (Screens.omenu) {
        case 0: if (d) { S.set('music', LP.clamp(S.get('music') + d, 0, 10)); LP.Audio.applySettings(); LP.Audio.play('menu'); } break;
        case 1: if (d) { S.set('sfx', LP.clamp(S.get('sfx') + d, 0, 10)); LP.Audio.applySettings(); LP.Audio.play('hop', { d: 'up' }); } break;
        case 2: if (d || n.ok) { LP.Audio.toggleMute(); LP.Audio.play('menu'); } break;
        case 3: if (d || n.ok) { S.set('scanlines', !S.get('scanlines')); LP.Audio.play('menu'); } break;
        case 4: if (d || n.ok) { S.set('fit', S.get('fit') === 'pixel' ? 'fill' : 'pixel'); LP.Shell.setFit(S.get('fit')); LP.Audio.play('menu'); } break;
        case 5: if (n.ok) { LP.Shell.toggleFullscreen(); LP.Audio.play('select'); } break;
        case 6: if (n.ok) { if (Screens.confirmReset) { LP.Scores.clear(); LP.Store.set('reached', 1); Screens.loadScores(); Game.hiScore = 0; Screens.confirmReset = false; LP.Audio.play('bonk'); } else { Screens.confirmReset = true; LP.Audio.play('menu'); } } break;
        case 7: if (n.ok) { LP.Audio.play('select'); back(); } break;
      }
    },
    render() {
      if (Screens.optFrom === 'paused') Game.render(); else Screens.backdrop();
      Sloth.clear();
      LP.LCD.ctx.fillStyle = 'rgba(0,0,0,0.55)'; LP.LCD.ctx.fillRect(0, 0, 320, 240);
      Screens.clearFg();
      const S = LP.Settings, g = G.fgc;
      G.to(g, () => {
        G.panel(48, 28, 224, 184, '#000', '#f878f8');
        Font.draw(g, 'OPTIONS', 160, 38, '#f8b800', { align: 'center' });
        const bar = (v) => '#'.repeat(v) + '-'.repeat(10 - v);
        const items = [
          'MUSIC  ' + bar(S.get('music')),
          'SOUND  ' + bar(S.get('sfx')),
          'MUTE       ' + (S.get('muted') ? 'ON' : 'OFF'),
          'SCANLINES  ' + (S.get('scanlines') ? 'ON' : 'OFF'),
          'SCALING    ' + (S.get('fit') === 'pixel' ? 'PIXEL' : 'FILL'),
          'FULLSCREEN ' + (LP.Shell.isFullscreen() ? 'ON' : 'OFF'),
          Screens.confirmReset ? 'REALLY RESET?' : 'RESET SCORES',
          'BACK'
        ];
        Screens.menuList(items, Screens.omenu, 72, 58, 16, {});
        Font.draw(g, 'LEFT/RIGHT CHANGE   F2 FULLSCREEN   M MUTE', 160, 198, '#7c7c7c', { face: 'small', align: 'center' });
      });
    }
  },

  // ================================================================ HIGH SCORES
  scores: {
    enter() { Screens.scoreT = 0; Screens.loadScores(); },
    update(dt) {
      Screens.scoreT += dt;
      const n = Screens.nav();
      if (Screens.scoresFrom === 'attract') {
        if (Screens.scoreT > 7) { LP.States.go('howto', 'attract'); return; }
        if (LP.Input.any()) { LP.Input.clearPresses(); LP.States.go('title'); }
        return;
      }
      if (n.ok || n.back || (Screens.scoresFrom === 'entry' && Screens.scoreT > 12)) { LP.Audio.play('menu'); LP.States.go('title'); if (Screens.scoresFrom === 'title') Screens.menuOpen = true; }
    },
    render() {
      Screens.backdrop();
      LP.LCD.ctx.fillStyle = 'rgba(0,0,0,0.55)'; LP.LCD.ctx.fillRect(0, 0, 320, 240);
      Screens.clearFg();
      const g = G.fgc, t = LP.Loop.frame;
      G.to(g, () => {
        G.panel(40, 12, 240, 216, '#000', '#f8b800');
        Font.draw(g, 'FASTEST SLOW SLOTHS', 160, 22, '#f8b800', { align: 'center' });
        Font.draw(g, 'RANK  NAME    SCORE    STAGE', 60, 38, '#7c7c7c', { face: 'small' });
        Screens.scores.slice(0, 10).forEach((s, i) => {
          const hi = Screens.scoresFrom === 'entry' && i === Screens.lastRank && (t >> 3) % 2;
          const c = hi ? '#f83800' : i === 0 ? '#f8b800' : i < 3 ? '#58d854' : '#fcfcfc';
          const y = 50 + i * 16;
          Font.draw(g, String(i + 1).padStart(2, ' '), 60, y, c);
          Font.draw(g, s.name, 92, y, c);
          Font.draw(g, LP.pad(s.score, 6), 140, y, c);
          Font.draw(g, s.stage ? (s.stage > StageInfo.count ? 'HOME' : String(s.stage)) : '-', 254, y, c, { face: 'small', align: 'right' });
        });
      });
    }
  },

  // ================================================================ PAUSE
  paused: {
    enter() { Screens.pmenu = 0; LP.Audio.stopMusic(); LP.Audio.play('pause'); },
    update() {
      const n = Screens.nav(), I = LP.Input;
      if (I.consume('pause')) { LP.States.go('game', 'resume'); return; }
      if (n.up) { Screens.pmenu = (Screens.pmenu + 3) % 4; LP.Audio.play('menu'); }
      if (n.down) { Screens.pmenu = (Screens.pmenu + 1) % 4; LP.Audio.play('menu'); }
      if (n.ok) {
        LP.Audio.play('select');
        if (Screens.pmenu === 0) LP.States.go('game', 'resume');
        else if (Screens.pmenu === 1) LP.States.go('howto', 'paused');
        else if (Screens.pmenu === 2) LP.States.go('options', 'paused');
        else LP.States.go('title');
      }
    },
    render() {
      Game.render();
      G.to(G.fgc, () => {
        G.fgc.fillStyle = 'rgba(0,0,0,0.45)'; G.fgc.fillRect(0, 16, 320, 208);
        G.panel(88, 64, 144, 100, '#000', '#3cbcfc');
        Font.draw(G.fgc, 'PAUSED', 160, 74, '#f8b800', { align: 'center' });
        Screens.menuList(['RESUME', 'HOW TO PLAY', 'OPTIONS', 'QUIT'], Screens.pmenu, 160, 94, 15, { align: 'center' });
        Font.draw(G.fgc, 'STAGE ' + Game.stage + ' - ' + Game.def.name, 160, 176, '#bcbcbc', { face: 'small', align: 'center', outline: '#000' });
      });
    }
  },

  // ================================================================ CONTINUE?
  continue: {
    enter() { Screens.contT = 10; LP.Audio.play('continue'); },
    update(dt) {
      const before = Math.ceil(Screens.contT);
      Screens.contT -= dt;
      if (Math.ceil(Screens.contT) !== before && Screens.contT > 0) LP.Audio.play('tick');
      const I = LP.Input;
      if (I.consume('start') || I.consume('confirm')) { LP.Audio.play('start'); LP.States.go('game', 'continue'); return; }
      if (I.consume('back')) Screens.contT = Math.floor(Screens.contT);
      if (Screens.contT <= 0) LP.States.go('gameover');
    },
    render() {
      Game.render();
      Sloth.clear();
      G.to(G.fgc, () => {
        G.fgc.fillStyle = 'rgba(0,0,0,0.65)'; G.fgc.fillRect(0, 16, 320, 208);
        Font.draw(G.fgc, 'CONTINUE?', 160, 70, '#f8b800', { align: 'center', scale: 2, outline: '#000' });
        Font.draw(G.fgc, String(Math.max(0, Math.ceil(Screens.contT))), 160, 96, '#fcfcfc', { align: 'center', scale: 3, outline: '#000' });
        Font.draw(G.fgc, 'CONTINUES LEFT: ' + Game.continuesLeft, 160, 134, '#bcbcbc', { face: 'small', align: 'center' });
        Font.draw(G.fgc, 'PRESS ENTER OR A', 160, 148, (LP.Loop.frame >> 4) % 2 ? '#fcfcfc' : '#f8b800', { face: 'small', align: 'center' });
        Font.draw(G.fgc, 'YOU KEEP YOUR STAGE AND YOUR SCORE.', 160, 164, '#7c7c7c', { face: 'small', align: 'center' });
      });
      Sloth.queue({ dir: 'down', x: 160, y: 214, h: 40, rot: Math.PI / 2 * 0.9, alpha: 0.9 });
    }
  },

  // ================================================================ GAME OVER
  gameover: {
    enter() {
      Screens.goT = 0; LP.Audio.stopMusic(); LP.Audio.play(Screens.won ? 'fanfare' : 'gameover');
      Screens.entryQueue = [];
      Screens._q = LP.Scores.qualifies(Game.score).then((q) => { if (q) Screens.entryQueue.push({ score: Game.score, stage: Screens.won ? StageInfo.count + 1 : Game.stage }); });
    },
    update(dt) {
      Screens.goT += dt;
      if (Screens.goT > 4.5 || (Screens.goT > 1.5 && (LP.Input.consume('start') || LP.Input.consume('confirm')))) Screens._q.then(() => {
        if (!LP.States.is('gameover')) return;
        if (Screens.entryQueue.length) LP.States.go('entry'); else LP.States.go('title');
      });
    },
    render() {
      const g = LP.LCD.ctx; g.fillStyle = '#000'; g.fillRect(0, 0, 320, 240);
      Screens.clearFg();
      const won = Screens.won;
      G.to(G.fgc, () => {
        const y = 80 + Math.max(0, 30 - Screens.goT * 40);
        Font.draw(G.fgc, won ? 'YOU MADE IT HOME!' : 'GAME OVER', 160, y, won ? '#f8b800' : '#f83800', { align: 'center', scale: 2 });
        Font.draw(G.fgc, won ? 'THE SLOWEST HERO THERE EVER WAS.' : 'THE SLOTH NEEDS A NAP.', 160, y + 30, '#7c7c7c', { face: 'small', align: 'center' });
        Font.draw(G.fgc, 'SCORE ' + LP.pad(Game.score, 6), 160, 150, '#fcfcfc', { align: 'center' });
        Font.draw(G.fgc, won ? 'ALL 30 STAGES CLEARED' : 'REACHED STAGE ' + Game.stage, 160, 168, '#f8b800', { face: 'small', align: 'center' });
      });
      if (!won) Sloth.queue({ dir: 'down', x: 160, y: 226, h: 36, rot: Math.PI / 2, alpha: Math.min(1, Screens.goT) });
      else Sloth.queue({ dir: 'down', x: 160, y: 232 - Math.abs(Math.sin(LP.Loop.frame * 0.1)) * 8, h: 44 });
    }
  },

  // ================================================================ INITIALS
  entry: {
    enter() {
      const e = Screens.entryQueue.shift();
      Screens.entry = { e, chars: ['A', 'A', 'A'], pos: 0 };
      LP.Audio.play('highscore');
      if (!Screens._typing) {
        Screens._typing = true;
        window.addEventListener('keydown', (ev) => {
          if (!LP.States.is('entry') || !Screens.entry) return;
          const k = ev.key.toUpperCase();
          if (/^[A-Z0-9]$/.test(k)) { Screens.entry.chars[Screens.entry.pos] = k; Screens.entry.pos = Math.min(2, Screens.entry.pos + 1); Screens.typedAt = LP.Loop.frame; LP.Audio.play('menu'); }
        });
      }
    },
    update() {
      const n = Screens.nav(), E = Screens.entry;
      if (!E) return;                                        // submitted; waiting for the score table
      // typed letters arrive as keys too (W/A/S/D move the cursor): ignore those just after typing
      if (LP.Loop.frame - (Screens.typedAt || -9) < 3) { n.up = n.down = n.left = n.right = false; }
      if (n.back) { E.pos = Math.max(0, E.pos - 1); LP.Audio.play('menu'); return; }
      const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.!? ';
      const cur = ABC.indexOf(E.chars[E.pos]);
      if (n.up) { E.chars[E.pos] = ABC[(cur + 1) % ABC.length]; LP.Audio.play('menu'); }
      if (n.down) { E.chars[E.pos] = ABC[(cur + ABC.length - 1) % ABC.length]; LP.Audio.play('menu'); }
      if (n.left) E.pos = Math.max(0, E.pos - 1);
      if (n.right) E.pos = Math.min(2, E.pos + 1);
      if (n.ok) {
        if (E.pos < 2) { E.pos++; LP.Audio.play('select'); return; }
        LP.Audio.play('start');
        Screens.entry = null;
        LP.Scores.submit(E.chars.join(''), E.e.score, { stage: E.e.stage }).then((rank) => {
          Screens.lastRank = rank;
          return Screens.loadScores();
        }).then(() => { Screens.scoresFrom = 'entry'; LP.States.go('scores'); });
      }
    },
    render() {
      Screens.backdrop();
      LP.LCD.ctx.fillStyle = 'rgba(0,0,0,0.6)'; LP.LCD.ctx.fillRect(0, 0, 320, 240);
      Screens.clearFg();
      const E = Screens.entry, g = G.fgc, t = LP.Loop.frame;
      if (!E) return;
      Sloth.queue({ dir: 'down', x: 52, y: 190 - Math.abs(Math.sin(t * 0.1)) * 6, h: 70 });
      G.to(g, () => {
        G.panel(100, 40, 200, 150, '#000', '#f8b800');
        Font.draw(g, 'NEW HIGH SCORE!', 200, 52, (t >> 3) % 2 ? '#f8b800' : '#fcfcfc', { align: 'center' });
        Font.draw(g, LP.pad(E.e.score, 6), 200, 70, '#58d854', { align: 'center', scale: 2 });
        Font.draw(g, 'ENTER YOUR INITIALS', 200, 96, '#fcfcfc', { face: 'small', align: 'center' });
        for (let i = 0; i < 3; i++) {
          const x = 172 + i * 22;
          Font.draw(g, E.chars[i], x, 112, i === E.pos ? '#f8b800' : '#fcfcfc', { scale: 2 });
          if (i === E.pos && (t >> 3) % 2) G.rect(x, 130, 14, 2, '#f83800');
        }
        Font.draw(g, 'UP/DOWN LETTER  OR TYPE IT', 200, 148, '#7c7c7c', { face: 'small', align: 'center' });
        Font.draw(g, 'ENTER / A CONFIRM   ESC / B BACK', 200, 160, '#7c7c7c', { face: 'small', align: 'center' });
      });
    }
  },

  // ================================================================ THE ENDING
  ending: {
    enter() {
      Screens.endT = 0; Screens.art = null;
      LP.FX.clear();
      LP.Audio.startMusic('ending');
      Screens._house = null;
    },
    update(dt) {
      Screens.endT += dt;
      const T = Screens.endT;
      if (T > 3 && T < 30 && LP.Loop.frame % 20 === 0) {
        const x = LP.rand(40, 280), y = LP.rand(30, 90), cols = LP.pick([['#f8b800', '#fcfcfc'], ['#f878f8', '#a4e4fc'], ['#58f898', '#fcfcfc'], ['#f83800', '#f8b800']]);
        G.burst(x, y, 26, cols[0], { colors: cols, speed: 2.2, g: 0.05, life: 50, lift: 0 });
        LP.Audio.play('clank');
      }
      LP.FX.update();
      if (T > 12 && (LP.Input.consume('start') || LP.Input.consume('confirm'))) Screens.endT = Math.max(T, 52);
      if (Screens.endT > 54) {
        LP.Audio.stopMusic();
        Screens.won = true;
        LP.States.go('gameover');
      }
    },
    render() {
      const T = Screens.endT, t = LP.Loop.frame, g = LP.LCD.ctx;
      G.g = g;
      if (!Screens._house) Screens._house = G.make(320, 240, (h) => {
        const r = (x, y, w, hh, c) => { h.fillStyle = c; h.fillRect(x, y, w, hh); };
        r(0, 0, 320, 240, '#0c1c58');
        for (let i = 0; i < 70; i++) r((i * 97) % 320, (i * 53) % 130, 1, 1, i % 5 ? '#a4e4fc' : '#fcfcfc');
        r(0, 150, 320, 90, '#38a028'); for (let x = 0; x < 320; x += 3) r(x, 150 + (x * 7) % 88, 1, 2, '#207818');
        // the house from the title screen, at last, up close
        r(100, 92, 120, 64, '#e8d0a0'); for (let y = 96; y < 156; y += 6) r(100, y, 120, 1, '#d0b888');
        for (let i = 0; i < 16; i++) r(92 + i * 2, 92 - i * 2, 136 - i * 4, 2, i % 2 ? '#c84020' : '#e85030');
        r(184, 50, 12, 26, '#a85030'); r(182, 48, 16, 4, '#803820');
        r(146, 116, 28, 40, '#604020'); r(149, 119, 22, 37, '#f8d878'); r(166, 136, 2, 2, '#604020');
        for (const wx of [112, 188]) { r(wx, 108, 22, 18, '#604020'); r(wx + 2, 110, 18, 14, '#f8e8a8'); r(wx + 10, 110, 2, 14, '#604020'); r(wx + 2, 116, 18, 2, '#604020'); r(wx - 2, 126, 26, 4, '#58c040'); }
        r(232, 40, 2, 52, '#bcbcbc'); r(234, 40, 22, 14, '#fcfcfc'); r(240, 43, 9, 8, '#58d854'); r(241, 42, 2, 2, '#fcfcfc'); r(246, 42, 2, 2, '#fcfcfc');
        for (let x = 0; x < 320; x += 8) { if (x > 92 && x < 228) continue; r(x + 2, 140, 4, 18, '#fcfcfc'); } r(0, 145, 92, 2, '#fcfcfc'); r(228, 145, 92, 2, '#fcfcfc');
        r(150, 156, 20, 84, '#c8a878'); for (let y = 160; y < 240; y += 8) r(150, y, 20, 1, '#a88858');
      });
      g.drawImage(Screens._house, 0, 0);
      LP.FX.draw(0, 0);
      Screens.clearFg();
      // the sloth walks the last few steps, turns around, and is very pleased with itself
      let sx = 160, sy, dir, h = 40;
      if (T < 6) { sy = 236 - T * 13; dir = 'up'; h = 40 - T * 2.6; }
      else { sy = 158 - Math.abs(Math.sin(t * 0.1)) * (T > 7 ? 6 : 0); dir = 'down'; h = 24.4; }
      Sloth.queue({ dir, x: sx, y: sy, h, sy: 1 + Math.sin(t * 0.08) * 0.02 });
      G.to(G.fgc, () => {
        const f = G.fgc;
        if (T > 6.5 && T < 30) {
          Font.draw(f, 'HOME AT LAST!', 160, 14, (t >> 3) % 2 ? '#f8b800' : '#fcfcfc', { align: 'center', scale: 2, outline: '#000' });
          if (T > 9) Font.draw(f, 'THE SLOTH HAS CROSSED EVERY ROAD, RIVER, RAILWAY,', 160, 178, '#fcfcfc', { face: 'small', align: 'center', outline: '#000' });
          if (T > 11) Font.draw(f, 'SWAMP, GLACIER AND FACTORY BETWEEN HERE AND THERE.', 160, 188, '#fcfcfc', { face: 'small', align: 'center', outline: '#000' });
          if (T > 14) Font.draw(f, 'IT WOULD LIKE TO SIT DOWN NOW. FOR ABOUT A YEAR.', 160, 202, '#a4e4fc', { face: 'small', align: 'center', outline: '#000' });
          if (T > 18) Font.draw(f, 'FINAL SCORE ' + LP.pad(Game.score, 6), 160, 218, '#f8b800', { align: 'center', outline: '#000' });
        }
        if (T >= 30) {
          const lines = [['SLOTHGER', '#58d854'], ['THE SLOW ROAD HOME', '#f8b800'], ['', ''], ['A LUCID CONFUSION CREATION', '#f878f8'], ['', ''],
            ['STARRING', '#7c7c7c'], ['A SLOTH IN A FROG SUIT', '#fcfcfc'], ['', ''],
            ['TRAFFIC ............ VERY RUDE', '#bcbcbc'], ['TURTLES ...... MOSTLY HELPFUL', '#bcbcbc'], ['GATORS ......... NOT HELPFUL', '#bcbcbc'],
            ['TRAINS ........ ON SCHEDULE', '#bcbcbc'], ['THE SNAKE ...... JUST A SNAKE', '#bcbcbc'], ['', ''],
            ['NO SLOTHS WERE RUSHED', '#f8b800'], ['(EXCEPT THIS ONE)', '#f8b800'], ['', ''], ['LUCIDCONFUSION.GG RETRO ARCADE', '#58f898'], ['', ''], ['THANKS FOR PLAYING!', '#fcfcfc']];
          const y0 = 240 - (T - 30) * 18;
          f.fillStyle = 'rgba(0,0,0,0.55)'; f.fillRect(40, 0, 240, 240);
          lines.forEach(([s, c], i) => { const y = y0 + i * 13; if (y > -10 && y < 240) Font.draw(f, s, 160, y, c, { face: s.length > 26 ? 'small' : 'big', align: 'center', outline: '#000' }); });
          if (y0 + lines.length * 13 < 110) Font.draw(f, 'THE END', 160, 110, '#f8b800', { align: 'center', scale: 2, outline: '#000' });
        }
      });
    }
  }
});
