/* SCREENS — title (the supplied title artwork, shown untouched at full monitor resolution),
   main menu, sloth select, how to play, options, high scores, pause, continue, game over,
   initials entry, and the ending + credits. Menus are NES windows drawn in the front layer. */
'use strict';
const Screens = {
  titleArt: LP.loadImage('assets/title.png'),
  scores: [], menu: 0, pmenu: 0, omenu: 0, pick: 'slub', startIdx: 0, page: 0, idle: 0,
  entryQueue: [], entry: null, lastRank: -1, scoresFrom: 'title', confirmReset: false, optFrom: 'title',
  art: null,           // post hook: draws hi-res art under the sloths (title / select)

  loadScores() {
    return LP.Scores.list().then((l) => { Screens.scores = l; Game.hiScore = Math.max(Game.hiScore, l.length ? l[0].score : 0); });
  },
  noteReached(n) {
    const r = LP.Store.get('reached', 1);
    if (n > r) LP.Store.set('reached', n);
  },
  starts() {
    const r = LP.Store.get('reached', 1), out = [];
    for (let s = 1; s <= Math.min(91, r); s += 10) out.push(s);
    return out;
  },
  applySettings() {
    LP.Audio.applySettings();
    LP.Shell.setFit(LP.Settings.get('fit'));
  },
  nav() {
    const I = LP.Input;
    return { up: I.consume('up'), down: I.consume('down'), left: I.consume('left'), right: I.consume('right'), ok: I.consume('confirm') || I.consume('start'), back: I.consume('back') };
  },

  // ---------------------------------------------------------------- shared drawing
  drawTitleArt(octx, k) {
    const img = Screens.titleArt;
    if (img.complete && img.naturalWidth) { octx.imageSmoothingEnabled = true; octx.imageSmoothingQuality = 'high'; octx.drawImage(img, 0, 0, 256 * k, 192 * k); }
  },
  backdrop(theme) {
    // a pixel-art stage behind menus
    if (Screens._bdTheme !== theme) { World.load(theme === 'throne' ? 95 : 1, null); Screens._bdTheme = theme; }
    G.g = LP.LCD.ctx;
    World.drawBack();
  },
  clearFg() { G.fgc.clearRect(0, 0, 256, 192); },
  menuList(items, sel, x, y, gap, opts) {
    opts = opts || {};
    items.forEach((it, i) => {
      const on = i === sel;
      const c = on ? (opts.on || '#f8b800') : (opts.off || '#fcfcfc');
      Font.draw(G.fgc, it, x, y + i * gap, c, { align: opts.align || 'left', outline: '#000' });
      if (on && (LP.Loop.frame >> 3) % 2 === 0) {
        const w = Font.width(it, 'big');
        const lx = opts.align === 'center' ? x - w / 2 - 12 : x - 12;
        Font.draw(G.fgc, '>', lx, y + i * gap, '#f83800');
        if (opts.align === 'center') Font.draw(G.fgc, '<', x + w / 2 + 5, y + i * gap, '#f83800');
      }
    });
  },
  controlsText() {
    return [['SLUB / 1P', 'ARROWS MOVE  UP/X JUMP  Z BUBBLE', '#b8f818'], ['SLOB / 2P', 'A D MOVE  W/G JUMP  F BUBBLE', '#3cbcfc'],
      ['BOTH', 'DOWN+JUMP DROP  ENTER PAUSE', '#fcfcfc'], ['', 'M MUTE  F2 FULLSCREEN  GAMEPADS OK', '#bcbcbc']];
  }
};

LP.States.add({
  // ================================================================ TITLE
  title: {
    enter() {
      Screens.menuOpen = false; Screens.idle = 0; Screens.art = Screens.drawTitleArt; Sloths.clear();
      Screens.loadScores();
      if (!LP.Audio.ctx) LP.Audio.wantSong = 'title'; else LP.Audio.startMusic('title');
    },
    exit() { Screens.art = null; },
    update(dt) {
      const n = Screens.nav();
      Screens.idle += dt;
      if (!Screens.menuOpen) {
        if (n.ok || LP.Input.consume('p1fire') || LP.Input.consume('p2fire')) { Screens.menuOpen = true; Screens.menu = 0; Screens.idle = 0; LP.Audio.play('start'); LP.Audio.startMusic('title'); }
        if (Screens.idle > 22) { Screens.scoresFrom = 'attract'; LP.States.go('scores'); }
        return;
      }
      if (n.up || n.down || n.ok || n.back) Screens.idle = 0;
      if (Screens.idle > 30) { Screens.menuOpen = false; Screens.idle = 0; }
      const items = 5;
      if (n.up) { Screens.menu = (Screens.menu + items - 1) % items; LP.Audio.play('menu'); }
      if (n.down) { Screens.menu = (Screens.menu + 1) % items; LP.Audio.play('menu'); }
      if (n.back) { Screens.menuOpen = false; LP.Audio.play('menu'); }
      if (n.ok) {
        LP.Audio.play('select');
        switch (Screens.menu) {
          case 0: LP.States.go('select', 1); break;
          case 1: LP.States.go('select', 2); break;
          case 2: LP.States.go('howto', 'title'); break;
          case 3: Screens.scoresFrom = 'title'; LP.States.go('scores'); break;
          case 4: LP.States.go('options', 'title'); break;
        }
      }
    },
    render() {
      const L = LP.LCD; L.ctx.fillStyle = '#000'; L.ctx.fillRect(0, 0, 256, 192);
      Screens.clearFg();
      G.to(G.fgc, () => {
        if (!Screens.menuOpen) return;                     // the art itself says PRESS START
        G.panel(60, 112, 136, 78, '#000', '#fcfcfc');
        Screens.menuList(['1 PLAYER', '2 PLAYERS', 'HOW TO PLAY', 'HIGH SCORES', 'OPTIONS'], Screens.menu, 128, 120, 13, { align: 'center' });
      });
    }
  },

  // ================================================================ SLOTH SELECT
  select: {
    enter(mode) { Screens.mode = mode; Screens.startIdx = 0; Screens.pickT = 0; },
    exit() { Sloths.clear(); },
    update(dt) {
      const n = Screens.nav(), starts = Screens.starts();
      Screens.pickT += dt;
      if (n.back) { LP.Audio.play('menu'); LP.States.go('title'); Screens.menuOpen = true; return; }
      if (Screens.mode === 1 && (n.left || n.right)) { Screens.pick = Screens.pick === 'slub' ? 'slob' : 'slub'; LP.Audio.play('menu'); Screens.pickT = 0; }
      if (starts.length > 1) {
        if (n.up) { Screens.startIdx = (Screens.startIdx + 1) % starts.length; LP.Audio.play('menu'); }
        if (n.down) { Screens.startIdx = (Screens.startIdx + starts.length - 1) % starts.length; LP.Audio.play('menu'); }
      }
      if (n.ok || LP.Input.consume('p1fire') || LP.Input.consume('p2fire')) {
        LP.Audio.play('start');
        Game.newGame(Screens.mode, Screens.pick, starts[Screens.startIdx] || 1);
        LP.States.go('game', 'new');
      }
    },
    render() {
      Screens.backdrop('meadow');
      LP.LCD.ctx.fillStyle = 'rgba(0,0,0,0.35)'; LP.LCD.ctx.fillRect(0, 16, 256, 176);
      Screens.clearFg();
      const t = LP.Loop.frame;
      const both = Screens.mode === 2;
      for (const who of ['slub', 'slob']) {
        const on = both || Screens.pick === who, x = who === 'slub' ? 76 : 180;
        const bob = on ? Math.abs(Math.sin(t * 0.08)) * 4 : 0, breathe = 1 + Math.sin(t * 0.06) * 0.015;
        Sloths.queue({ who, dir: who === 'slub' ? 1 : -1, x, y: 150 - bob, h: 88, sy: breathe, sx: 2 - breathe, alpha: on ? 1 : 0.35, rot: on && !both ? Math.sin(t * 0.08) * 0.03 : 0, glow: on && (t % 90) < 10 ? 1 : 0 });
      }
      G.to(G.fgc, () => {
        G.rect(0, 0, 256, 16, '#000');
        Font.draw(G.fgc, both ? '2 PLAYERS' : 'CHOOSE YOUR SLOTH', 128, 4, '#f8b800', { align: 'center' });
        const lab = (who, x) => {
          const on = both || Screens.pick === who, c = who === 'slub' ? '#b8f818' : '#3cbcfc';
          Font.draw(G.fgc, who === 'slub' ? 'SLUB' : 'SLOB', x, 154, on ? c : '#7c7c7c', { align: 'center', outline: '#000' });
          Font.draw(G.fgc, who === 'slub' ? (both ? '1P: ARROWS Z X' : 'GREEN. BRAVE. SLOW.') : (both ? '2P: WASD F G' : 'BLUE. BRAVER. SLOWER.'), x, 165, on ? '#fcfcfc' : '#7c7c7c', { face: 'small', align: 'center', outline: '#000' });
        };
        lab('slub', 76); lab('slob', 180);
        if (!both && (t >> 4) % 2) { Font.draw(G.fgc, '<', Screens.pick === 'slub' ? 28 : 132, 100, '#f83800', { outline: '#000' }); Font.draw(G.fgc, '>', Screens.pick === 'slub' ? 118 : 222, 100, '#f83800', { outline: '#000' }); }
        const starts = Screens.starts();
        if (starts.length > 1) Font.draw(G.fgc, 'START AT LEVEL ' + starts[Screens.startIdx] + '  (UP/DOWN)', 128, 177, '#f878f8', { face: 'small', align: 'center', outline: '#000' });
        else Font.draw(G.fgc, 'PRESS START', 128, 178, (t >> 4) % 2 ? '#fcfcfc' : '#f8b800', { face: 'small', align: 'center', outline: '#000' });
      });
    }
  },

  // ================================================================ HOW TO PLAY
  howto: {
    enter(from) { Screens.page = 0; Screens.howFrom = from || 'title'; Screens.howT = 0; },
    update(dt) {
      const n = Screens.nav();
      Screens.howT += dt;
      const pages = 4;
      if (n.left) { Screens.page = (Screens.page + pages - 1) % pages; LP.Audio.play('menu'); }
      if (n.right || n.ok) {
        if (n.ok && Screens.page === pages - 1) { LP.States.go(Screens.howFrom === 'attract' ? 'title' : Screens.howFrom === 'paused' ? 'paused' : 'title'); if (Screens.howFrom !== 'attract') Screens.menuOpen = true; return; }
        Screens.page = (Screens.page + 1) % pages; LP.Audio.play('menu');
      }
      if (n.back) { LP.Audio.play('menu'); LP.States.go(Screens.howFrom === 'paused' ? 'paused' : 'title'); if (Screens.howFrom === 'title') Screens.menuOpen = true; }
      if (Screens.howFrom === 'attract') { if (Screens.howT > 7) { Screens.howT = 0; Screens.page++; if (Screens.page >= pages) LP.States.go('title'); } if (LP.Input.any()) LP.States.go('title'); }
    },
    render() {
      Screens.backdrop('meadow');
      LP.LCD.ctx.fillStyle = 'rgba(0,0,40,0.6)'; LP.LCD.ctx.fillRect(0, 0, 256, 192);
      Screens.clearFg();
      const g = G.fgc, t = LP.Loop.frame;
      G.to(g, () => {
        G.panel(4, 4, 248, 184, '#000', '#3cbcfc');
        Font.draw(g, 'HOW TO PLAY  ' + (Screens.page + 1) + '/4', 128, 12, '#f8b800', { align: 'center' });
        const line = (s, y, c, o) => Font.draw(g, s, 16, y, c || '#fcfcfc', Object.assign({ face: 'small' }, o));
        if (Screens.page === 0) {
          line('BLOW BUBBLES AT THE PESTS. THEY GET TRAPPED.', 30);
          line('TOUCH, JUMP INTO OR SHOOT THE BUBBLE TO POP IT.', 40);
          line('POPPED PESTS TURN INTO SNACKS AND TREASURE.', 50);
          line('CLEAR EVERY PEST TO FINISH THE LEVEL. 100 LEVELS.', 60, '#f8b800');
          let y = 80;
          for (const [who, txt, c] of Screens.controlsText()) { Font.draw(g, who, 16, y, c, { face: 'small' }); Font.draw(g, txt, 70, y, '#fcfcfc', { face: 'small' }); y += 12; }
          line('ONE PLAYER: EITHER SET OF KEYS WORKS.', 130, '#f8b800');
          line('ENTER / ESC  PAUSE        GAMEPAD: A JUMP  X FIRE', 140, '#bcbcbc');
          // demo: a bubble with a trapped penguin
          const bx = 128 + Math.sin(t * 0.03) * 60, by = 157;
          g.drawImage(Sprites.enemy('penguin', (t >> 4) & 1, false, ''), bx - 7, by - 8);
          G.ring(bx, by, 11, '#b8f818'); G.draw(Sprites.icon('vein'), bx + 8, by - 14);
        } else if (Screens.page === 1) {
          line('CHAIN POPS: BUBBLES TOUCHING A POPPED BUBBLE POP TOO.', 30);
          line('EACH PEST IN A CHAIN SCORES DOUBLE THE LAST ONE:', 40);
          line('1000  2000  4000  8000 ...', 52, '#f8b800');
          line('POP!  DOUBLE POP!  TRIPLE POP!  BUBBLE CHAIN!', 64, '#b8f818');
          line('SLOTHASTIC!  ABSURD!', 74, '#f878f8');
          line('HOLD JUMP WHEN LANDING ON A BUBBLE TO BOUNCE HIGHER.', 92);
          line('HOLD DOWN WHEN LANDING ON ONE TO RIDE IT UPWARD.', 102);
          line('WAIT TOO LONG AND TRAPPED PESTS ESCAPE - ANGRY.', 116, '#f83800');
          line('ARMOURED PESTS NEED TWO BUBBLES.', 126);
          line('TAKE TOO LONG AND THE LANDLORD COMES FOR THE RENT.', 140, '#58f898');
          g.drawImage(Sprites.enemy('landlord', (t >> 4) & 1, false, ''), 120, 154);
        } else if (Screens.page === 2) {
          line('POWER-UPS (SOME PESTS DROP THEM):', 28, '#f8b800');
          let i = 0;
          for (const id in POWERS) {
            const x = i < 5 ? 16 : 132, y = 42 + (i % 5) * 18;
            g.drawImage(Items.icon(id), x, y - 3);
            Font.draw(g, POWERS[id].name, x + 15, y, POWERS[id].color, { face: 'small' });
            i++;
          }
          line('FOOD AND TREASURE ARE WORTH 100 TO 20000 POINTS.', 140);
          const foods = ['cherry', 'burger', 'pizza', 'donut', 'gem', 'crown', 'idol'];
          foods.forEach((f, j) => g.drawImage(Sprites.item(f), 40 + j * 26, 156));
        } else {
          line('BOSSES IGNORE NORMAL BUBBLES. USE THE BUBBLES CLEVERLY:', 30, '#f8b800');
          line('- POP A BUBBLED MINION NEAR A BOSS: IT GETS LAUNCHED.', 44);
          line('- BUBBLE A BOSS PROJECTILE, POP IT: RETURN TO SENDER.', 56);
          line('- BUBBLE WEAK SPOTS WHEN THEY OPEN UP.', 68);
          line('WALK OFF THE SCREEN EDGE OR FALL THROUGH A FLOOR', 86);
          line('GAP ON SOME LEVELS TO WRAP AROUND.', 96);
          line('SPRINGS, ICE, WATER, LAVA, WIND, TELEPORTERS AND', 110);
          line('DARKNESS SHOW UP IN LATER WORLDS.', 120);
          line('TWO PLAYERS: KNOCKED-OUT SLOTHS PRESS FIRE TO REJOIN.', 138, '#3cbcfc');
        }
        Font.draw(g, '< LEFT / RIGHT >     ESC BACK', 128, 176, '#7c7c7c', { face: 'small', align: 'center' });
      });
    }
  },

  // ================================================================ OPTIONS
  options: {
    enter(from) { if (from) Screens.optFrom = from; Screens.omenu = 0; Screens.confirmReset = false; },
    update() {
      const n = Screens.nav(), S = LP.Settings;
      const items = 8;
      if (n.up) { Screens.omenu = (Screens.omenu + items - 1) % items; LP.Audio.play('menu'); Screens.confirmReset = false; }
      if (n.down) { Screens.omenu = (Screens.omenu + 1) % items; LP.Audio.play('menu'); Screens.confirmReset = false; }
      const d = n.left ? -1 : n.right ? 1 : 0;
      const back = () => { LP.States.go(Screens.optFrom === 'paused' ? 'paused' : 'title'); if (Screens.optFrom === 'title') Screens.menuOpen = true; };
      if (n.back) { LP.Audio.play('menu'); back(); return; }
      switch (Screens.omenu) {
        case 0: if (d) { S.set('music', LP.clamp(S.get('music') + d, 0, 10)); LP.Audio.applySettings(); LP.Audio.play('menu'); } break;
        case 1: if (d) { S.set('sfx', LP.clamp(S.get('sfx') + d, 0, 10)); LP.Audio.applySettings(); LP.Audio.play('pickup'); } break;
        case 2: if (d || n.ok) { LP.Audio.toggleMute(); LP.Audio.play('menu'); } break;
        case 3: if (d || n.ok) { S.set('scanlines', !S.get('scanlines')); LP.Audio.play('menu'); } break;
        case 4: if (d || n.ok) { S.set('fit', S.get('fit') === 'pixel' ? 'fill' : 'pixel'); LP.Shell.setFit(S.get('fit')); LP.Audio.play('menu'); } break;
        case 5: if (n.ok) { LP.Shell.toggleFullscreen(); LP.Audio.play('select'); } break;
        case 6: if (n.ok) { if (Screens.confirmReset) { LP.Scores.clear(); LP.Store.set('reached', 1); Screens.loadScores(); Screens.confirmReset = false; LP.Audio.play('hurt'); } else { Screens.confirmReset = true; LP.Audio.play('menu'); } } break;
        case 7: if (n.ok) { LP.Audio.play('select'); back(); } break;
      }
    },
    render() {
      if (Screens.optFrom === 'paused') Game.render(); else Screens.backdrop('meadow');
      LP.LCD.ctx.fillStyle = 'rgba(0,0,0,0.55)'; LP.LCD.ctx.fillRect(0, 0, 256, 192);
      Screens.clearFg();
      const S = LP.Settings, g = G.fgc;
      G.to(g, () => {
        G.panel(24, 20, 208, 160, '#000', '#f878f8');
        Font.draw(g, 'OPTIONS', 128, 28, '#f8b800', { align: 'center' });
        const bar = (v) => '[' + '#'.repeat(v) + '.'.repeat(10 - v) + ']';
        const items = [
          'MUSIC   ' + bar(S.get('music')),
          'SOUND   ' + bar(S.get('sfx')),
          'MUTE    ' + (S.get('muted') ? 'ON' : 'OFF'),
          'SCANLINES ' + (S.get('scanlines') ? 'ON' : 'OFF'),
          'SCALING  ' + (S.get('fit') === 'pixel' ? 'PIXEL' : 'FILL'),
          'FULLSCREEN ' + (LP.Shell.isFullscreen() ? 'ON' : 'OFF'),
          Screens.confirmReset ? 'REALLY RESET? ' : 'RESET SCORES',
          'BACK'
        ];
        Screens.menuList(items, Screens.omenu, 44, 46, 15, {});
        Font.draw(g, 'LEFT/RIGHT CHANGE   F2 FULLSCREEN   M MUTE', 128, 168, '#7c7c7c', { face: 'small', align: 'center' });
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
        if (LP.Input.any()) { LP.States.go('title'); return; }
        return;
      }
      if (n.ok || n.back || (Screens.scoresFrom === 'entry' && Screens.scoreT > 12)) { LP.Audio.play('menu'); LP.States.go('title'); if (Screens.scoresFrom === 'title') Screens.menuOpen = true; }
    },
    render() {
      Screens.backdrop('throne');
      LP.LCD.ctx.fillStyle = 'rgba(0,0,0,0.55)'; LP.LCD.ctx.fillRect(0, 0, 256, 192);
      Screens.clearFg();
      const g = G.fgc, t = LP.Loop.frame;
      G.to(g, () => {
        G.panel(28, 8, 200, 176, '#000', '#f8b800');
        Font.draw(g, 'BEST SLOTHS', 128, 16, '#f8b800', { align: 'center' });
        Font.draw(g, 'RANK  NAME     SCORE   LV', 40, 30, '#7c7c7c', { face: 'small' });
        Screens.scores.slice(0, 10).forEach((s, i) => {
          const hi = Screens.scoresFrom === 'entry' && i === Screens.lastRank && (t >> 3) % 2;
          const c = hi ? '#f83800' : i === 0 ? '#f8b800' : i < 3 ? '#b8f818' : '#fcfcfc';
          const y = 42 + i * 13;
          Font.draw(g, String(i + 1).padStart(2, ' '), 40, y, c);
          Font.draw(g, s.name, 72, y, c);
          Font.draw(g, LP.pad(s.score, 7), 108, y, c);
          Font.draw(g, s.level ? String(s.level) : '-', 210, y, c, { face: 'small', align: 'right' });
        });
      });
    }
  },

  // ================================================================ PAUSE
  paused: {
    enter() { Screens.pmenu = 0; LP.Audio.stopMusic(); Sloths.clear(); },
    update() {
      const n = Screens.nav(), I = LP.Input;
      if (I.consume('pause')) { LP.Audio.play('start'); LP.States.go('game', 'resume'); return; }
      if (n.up) { Screens.pmenu = (Screens.pmenu + 3) % 4; LP.Audio.play('menu'); }
      if (n.down) { Screens.pmenu = (Screens.pmenu + 1) % 4; LP.Audio.play('menu'); }
      if (n.ok) {
        LP.Audio.play('select');
        if (Screens.pmenu === 0) LP.States.go('game', 'resume');
        else if (Screens.pmenu === 1) LP.States.go('howto', 'paused');
        else if (Screens.pmenu === 2) LP.States.go('options', 'paused');
        else { LP.States.go('title'); }
      }
    },
    render() {
      Game.render();
      Sloths.clear();
      for (const p of Players.list) Players.queueDraw(p);
      G.to(G.fgc, () => {
        G.fgc.fillStyle = 'rgba(0,0,0,0.45)'; G.fgc.fillRect(0, 16, 256, 176);
        G.panel(64, 48, 128, 92, '#000', '#3cbcfc');
        Font.draw(G.fgc, 'PAUSED', 128, 56, '#f8b800', { align: 'center' });
        Screens.menuList(['RESUME', 'HOW TO PLAY', 'OPTIONS', 'QUIT'], Screens.pmenu, 128, 74, 14, { align: 'center' });
        Font.draw(G.fgc, 'LEVEL ' + Game.level + ' - ' + WORLDS[LevelInfo.world(Game.level)].name, 128, 150, '#bcbcbc', { face: 'small', align: 'center', outline: '#000' });
      });
    }
  },

  // ================================================================ CONTINUE?
  continue: {
    enter() { Screens.contT = 10; LP.Audio.play('continue'); if (Game.continuesLeft <= 0) Screens.contT = 0; },
    update(dt) {
      if (Game.continuesLeft <= 0) { LP.States.go('gameover'); return; }
      const before = Math.ceil(Screens.contT);
      Screens.contT -= dt;
      if (Math.ceil(Screens.contT) !== before && Screens.contT > 0) LP.Audio.play('tick');
      const I = LP.Input;
      if (I.consume('start') || I.consume('confirm') || I.consume('p1fire') || I.consume('p2fire')) { LP.Audio.play('start'); LP.States.go('game', 'continue'); return; }
      if (I.consume('back') || I.consume('p1jump') || I.consume('p2jump')) Screens.contT = Math.floor(Screens.contT);
      if (Screens.contT <= 0) LP.States.go('gameover');
    },
    render() {
      Game.render();
      Sloths.clear();
      G.to(G.fgc, () => {
        G.fgc.fillStyle = 'rgba(0,0,0,0.6)'; G.fgc.fillRect(0, 16, 256, 176);
        Font.draw(G.fgc, 'CONTINUE?', 128, 60, '#f8b800', { align: 'center', scale: 2, outline: '#000' });
        Font.draw(G.fgc, String(Math.max(0, Math.ceil(Screens.contT))), 128, 84, '#fcfcfc', { align: 'center', scale: 3, outline: '#000' });
        Font.draw(G.fgc, 'CONTINUES LEFT: ' + Game.continuesLeft, 128, 120, '#bcbcbc', { face: 'small', align: 'center' });
        Font.draw(G.fgc, 'PRESS START OR FIRE', 128, 134, (LP.Loop.frame >> 4) % 2 ? '#fcfcfc' : '#f8b800', { face: 'small', align: 'center' });
        Font.draw(G.fgc, 'YOU KEEP YOUR LEVEL AND YOUR SCORE.', 128, 150, '#7c7c7c', { face: 'small', align: 'center' });
      });
    },
    exit(next) { if (next === 'game') for (const p of Players.list) { p.scoreBefore = p.scoreBefore || 0; } }
  },

  // ================================================================ GAME OVER
  gameover: {
    enter() {
      Screens.goT = 0; LP.Audio.stopMusic(); LP.Audio.play(Screens.won ? 'highscore' : 'gameover');
      // who goes on the board?
      Screens.entryQueue = [];
      const list = Players.list.slice().sort((a, b) => b.score - a.score);
      let chain = Promise.resolve();
      for (const p of list) chain = chain.then(() => LP.Scores.qualifies(p.score).then((q) => { if (q) Screens.entryQueue.push(p); }));
      Screens._q = chain;
    },
    update(dt) {
      Screens.goT += dt;
      if (Screens.goT > 4 || (Screens.goT > 1.5 && LP.Input.consume('start'))) Screens._q.then(() => {
        if (!LP.States.is('gameover')) return;
        if (Screens.entryQueue.length) LP.States.go('entry'); else { Screens.scoresFrom = 'title'; LP.States.go('title'); }
      });
    },
    render() {
      const L = LP.LCD; L.ctx.fillStyle = '#000'; L.ctx.fillRect(0, 0, 256, 192);
      Screens.clearFg();
      G.to(G.fgc, () => {
        const y = 70 + Math.max(0, 30 - Screens.goT * 40);
        Font.draw(G.fgc, Screens.won ? 'YOU WIN!' : 'GAME OVER', 128, y, Screens.won ? '#f8b800' : '#f83800', { align: 'center', scale: 2 });
        Font.draw(G.fgc, Screens.won ? 'NOW THE SLOTHS NEED A NAP.' : 'THE SLOTHS NEED A NAP.', 128, y + 30, '#7c7c7c', { face: 'small', align: 'center' });
        Players.list.forEach((p, i) => Font.draw(G.fgc, (p.who === 'slub' ? 'SLUB ' : 'SLOB ') + LP.pad(p.score, 7), 128, 130 + i * 12, p.who === 'slub' ? '#b8f818' : '#3cbcfc', { align: 'center' }));
        Font.draw(G.fgc, 'REACHED LEVEL ' + Game.level, 128, 160, '#f8b800', { face: 'small', align: 'center' });
      });
    }
  },

  // ================================================================ INITIALS
  entry: {
    enter() {
      const p = Screens.entryQueue.shift();
      Screens.entry = { p, chars: ['A', 'A', 'A'], pos: 0 };
      LP.Audio.play('highscore');
      if (!Screens._typing) {
        Screens._typing = true;
        window.addEventListener('keydown', (e) => {
          if (!LP.States.is('entry') || !Screens.entry) return;
          const k = e.key.toUpperCase();
          if (/^[A-Z0-9]$/.test(k)) { Screens.entry.chars[Screens.entry.pos] = k; Screens.entry.pos = Math.min(2, Screens.entry.pos + 1); Screens.typedAt = LP.Loop.frame; LP.Audio.play('menu'); }
        });
      }
    },
    update() {
      const n = Screens.nav(), E = Screens.entry;
      if (LP.Loop.frame - (Screens.typedAt || -9) < 3) { n.up = n.down = n.left = n.right = false; if (!LP.Input.held('start')) n.ok = false; }
      const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.!? ';
      const cur = ABC.indexOf(E.chars[E.pos]);
      if (n.up) { E.chars[E.pos] = ABC[(cur + 1) % ABC.length]; LP.Audio.play('menu'); }
      if (n.down) { E.chars[E.pos] = ABC[(cur + ABC.length - 1) % ABC.length]; LP.Audio.play('menu'); }
      if (n.left) E.pos = Math.max(0, E.pos - 1);
      if (n.right) E.pos = Math.min(2, E.pos + 1);
      if (n.ok) {
        if (E.pos < 2 && !LP.Input.held('start')) { E.pos++; LP.Audio.play('select'); return; }
        LP.Audio.play('start');
        LP.Scores.submit(E.chars.join(''), E.p.score, { level: Game.level, who: E.p.who }).then((rank) => {
          Screens.lastRank = rank;
          return Screens.loadScores();
        }).then(() => {
          if (Screens.entryQueue.length) LP.States.go('entry');
          else { Screens.scoresFrom = 'entry'; LP.States.go('scores'); }
        });
      }
    },
    render() {
      Screens.backdrop('throne');
      LP.LCD.ctx.fillStyle = 'rgba(0,0,0,0.6)'; LP.LCD.ctx.fillRect(0, 0, 256, 192);
      Screens.clearFg();
      const E = Screens.entry, g = G.fgc, t = LP.Loop.frame;
      Sloths.queue({ who: E.p.who, dir: 1, x: 40, y: 170, h: 60, rot: Math.sin(t * 0.1) * 0.05 });
      G.to(g, () => {
        G.panel(70, 30, 170, 130, '#000', '#f8b800');
        Font.draw(g, 'NEW HIGH SCORE!', 155, 40, (t >> 3) % 2 ? '#f8b800' : '#fcfcfc', { align: 'center' });
        Font.draw(g, (E.p.who === 'slub' ? 'SLUB  ' : 'SLOB  ') + LP.pad(E.p.score, 7), 155, 58, E.p.who === 'slub' ? '#b8f818' : '#3cbcfc', { align: 'center' });
        Font.draw(g, 'ENTER YOUR INITIALS', 155, 76, '#fcfcfc', { face: 'small', align: 'center' });
        for (let i = 0; i < 3; i++) {
          const x = 131 + i * 18;
          Font.draw(g, E.chars[i], x, 94, i === E.pos ? '#f8b800' : '#fcfcfc', { scale: 2 });
          if (i === E.pos && (t >> 3) % 2) G.rect(x, 112, 14, 2, '#f83800');
        }
        Font.draw(g, 'UP/DOWN LETTER  OR TYPE', 155, 126, '#7c7c7c', { face: 'small', align: 'center' });
        Font.draw(g, 'ENTER / FIRE CONFIRM', 155, 136, '#7c7c7c', { face: 'small', align: 'center' });
      });
    }
  },

  // ================================================================ THE ENDING
  ending: {
    enter() {
      Screens.endT = 0;
      World.load(100, { m: { 16: '..............' }, theme: 'throne' });
      Screens._bdTheme = null;
      Bubbles.reset(); Enemies.reset(); Items.reset(); Bosses.reset(); LP.FX.clear();
      Screens.parade = Object.keys(SPECIES).filter((k) => !/Bare|landlord/.test(k) && Sprites.has(k));
      LP.Audio.startMusic('ending');
      Screens.finalScore = Players.list.reduce((s, p) => s + p.score, 0);
      for (const p of Players.list) { p.out = false; p.dying = 0; p.victory = true; }
    },
    update(dt) {
      Screens.endT += dt;
      const T = Screens.endT;
      // bubbles shower
      if (T < 26 && LP.Loop.frame % 4 === 0) Bubbles.spawn({ x: LP.rand(24, 232), y: World.BOT - 10, r: LP.randi(4, 9), vx: 0, vy: -0.5, state: 'float', who: LP.pick(['slub', 'slob']), owner: 0, max: 0, life: 400 });
      Bubbles.update();
      for (const b of Bubbles.list) if (b.y < 40 && Math.random() < 0.02) Bubbles.burst(b, true);
      LP.FX.update();
      for (const p of Players.list) p.t++;
      if (T > 34 && (LP.Input.consume('start') || LP.Input.consume('confirm'))) Screens.endT = 999;
      if (T > 6 && LP.Input.consume('start')) Screens.endT = Math.max(Screens.endT, 34);
      if (Screens.endT > 62) {
        LP.Audio.stopMusic();
        Game.level = 100; Screens.won = true;
        LP.States.go('gameover');
      }
    },
    render() {
      const T = Screens.endT, t = LP.Loop.frame, g = LP.LCD.ctx;
      G.g = g;
      World.drawBack();
      // the parade of rescued (now friendly) creatures
      const n = Screens.parade.length;
      for (let i = 0; i < n; i++) {
        const x = ((T * 22 + i * 26) % (n * 26)) - 20, name = Screens.parade[i];
        if (x < -20 || x > 270) continue;
        const img = Sprites.enemy(name, (t >> 3) & 1, false, 'happy');
        const hop = Math.abs(Math.sin(t * 0.1 + i)) * 3;
        g.drawImage(img, Math.round(x), Math.round(World.BOT - img.height - hop));
        if ((t >> 4) % 3 === i % 3) G.draw(Sprites.icon('heart'), x + 4, World.BOT - img.height - 9 - hop);
      }
      Bubbles.draw();
      LP.FX.draw();
      Screens.clearFg();
      // the heroes, dancing, hi-res
      const both = Players.list.length > 1;
      const dancers = both ? ['slub', 'slob'] : [Players.list[0].who];
      dancers.forEach((who, i) => {
        const x = both ? (i ? 160 : 96) : 128, ph = t * 0.12 + i;
        Sloths.queue({ who, dir: Math.floor(t / 40 + i) % 2 ? -1 : 1, x, y: 150 - Math.abs(Math.sin(ph)) * 10, h: 44, rot: Math.sin(ph) * 0.08, glow: (t % 60) < 8 ? 1 : 0 });
      });
      G.to(G.fgc, () => {
        G.rect(0, 0, 256, 16, '#000');
        const msg = 'THE SLOTHS HAVE SAVED WHATEVER THIS PLACE IS.';
        if (T < 34) {
          const shown = msg.slice(0, Math.floor(T * 14));
          Font.draw(G.fgc, 'CONGRATULATIONS!', 128, 4, (t >> 3) % 2 ? '#f8b800' : '#fcfcfc', { align: 'center' });
          Font.draw(G.fgc, shown, 128, 30, '#fcfcfc', { face: 'small', align: 'center', outline: '#000' });
          if (T > 5) Font.draw(G.fgc, 'GENERALISSIMO WADDLES HAS BEEN SENT TO HIS ROOM.', 128, 44, '#bcbcbc', { face: 'small', align: 'center', outline: '#000' });
          if (T > 9) Font.draw(G.fgc, 'THE PESTS ARE PESTS NO MORE. THEY ARE JUST GUYS NOW.', 128, 54, '#bcbcbc', { face: 'small', align: 'center', outline: '#000' });
          if (T > 14) { Font.draw(G.fgc, 'FINAL SCORE', 128, 70, '#f8b800', { align: 'center', outline: '#000' }); Font.draw(G.fgc, LP.pad(Math.min(Screens.finalScore, Math.floor((T - 14) / 3 * Screens.finalScore)), 8), 128, 82, '#fcfcfc', { align: 'center', scale: 2, outline: '#000' }); }
          if (T > 18) {
            const rank = Screens.scores.filter((s) => s.score > Screens.finalScore).length + 1;
            Font.draw(G.fgc, rank <= 10 ? 'THAT RANKS #' + rank + ' ON THE BOARD!' : 'NOT BAD FOR A SLOTH.', 128, 104, '#b8f818', { face: 'small', align: 'center', outline: '#000' });
          }
        } else {
          // the credits roll
          const lines = [
            ['SLUBBLE SLOBBLE', '#b8f818'], ['BUBBLE-BLASTING SLOTH BROS.', '#f878f8'], ['', ''],
            ['A LUCID CONFUSION CREATION', '#f8b800'], ['', ''],
            ['SLUB .......... AS SLUB', '#b8f818'], ['SLOB .......... AS SLOB', '#3cbcfc'], ['', ''],
            ['KING CROAKUS ... A FROG', '#fcfcfc'], ['ADMIRAL PINCHWORTH ... CRAB', '#fcfcfc'],
            ['TRASH PANDAMONIUM ... ALSO TRASH', '#fcfcfc'], ['QUACKULA ... RUBBER, EVIL', '#fcfcfc'],
            ['SIR RATTLES ... BONES', '#fcfcfc'], ['MECHA-MOP 9000 ... CLEAN', '#fcfcfc'],
            ['GENERALISSIMO WADDLES ... GROUNDED', '#fcfcfc'], ['THE LANDLORD ... STILL WANTS RENT', '#58f898'], ['', ''],
            ['PHYSICS ........ SLOWLY', '#bcbcbc'], ['BUBBLES ...... VERY MANY', '#bcbcbc'], ['MUSIC ...... STUCK IN YOUR HEAD', '#bcbcbc'], ['', ''],
            ['NO SLOTHS WERE RUSHED', '#f8b800'], ['IN THE MAKING OF THIS GAME', '#f8b800'], ['', ''],
            ['LUCIDCONFUSION.GG RETRO ARCADE', '#f878f8'], ['', ''], ['THANKS FOR PLAYING!', '#fcfcfc']
          ];
          const y0 = 200 - (T - 34) * 16;
          lines.forEach(([s, c], i) => { const y = y0 + i * 12; if (y > 14 && y < 128) Font.draw(G.fgc, s, 128, y, c, { face: s.length > 28 ? 'small' : 'big', align: 'center', outline: '#000' }); });
          if (y0 + lines.length * 12 < 70) Font.draw(G.fgc, 'THE END', 128, 60, '#f8b800', { align: 'center', scale: 2, outline: '#000' });
        }
      });
    }
  }
});
