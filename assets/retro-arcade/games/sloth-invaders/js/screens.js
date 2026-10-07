/* SCREENS — the title (the supplied artwork, shown at full monitor resolution with live
   scores over it), the unattended-cabinet attract cycle
       title -> score advance table -> the situation -> demo play -> high scores -> title
   and options, pause, game over and initials entry.
   Menus: UP/DOWN choose, LEFT/RIGHT adjust, ENTER/FIRE confirm, ESC back. */
'use strict';
const Screens = {
  scores: [], rank: -1, lastScore: 0, ret: 'title', menu: 0, pmenu: 0,
  CHARS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.!- ',
  titleArt: LP.loadImage('assets/title.png'),

  confirm: () => LP.Input.consume('start') || LP.Input.consume('fire'),
  back: () => LP.Input.consume('back') || LP.Input.consume('pause'),
  blink: (hz) => Math.floor(LP.Loop.time * hz * 2) % 2 === 0,
  loadScores(rank) { return LP.Scores.list().then((l) => { Screens.scores = l; Screens.rank = rank === undefined ? -1 : rank; }); },
  top: () => (Screens.scores.length ? Screens.scores[0].score : 0),

  // every attract screen: ENTER (or FIRE) starts a game, ESC opens the options
  attractKeys() {
    if (Screens.confirm()) { LP.Audio.play('coin'); Screens.startGame(); return true; }
    if (Screens.back()) { LP.Audio.play('menu'); LP.States.go('options', 'title'); return true; }
    return false;
  },
  startGame() { Game.newGame(false); LP.States.go('game'); },

  text(str, x, y, color, o) { return Font.draw(LP.LCD.ctx, str, x, y, color, o); },
  clear() { G.rect(0, 0, 384, 216, '#000'); },
  typed(str, t, cps) { return str.slice(0, Math.max(0, Math.floor(t * (cps || 18)))); },

  // ------------------------------------------------------------------ title artwork overlay
  // Drawn at OUTPUT resolution (LP.LCD.post) so the art stays sharp; coordinates are in
  // the artwork's own 1672x941 pixels.
  drawTitleArt(octx, k) {
    const img = Screens.titleArt, ow = LP.LCD.W * k, oh = LP.LCD.H * k, s = ow / 1672;
    if (!img.complete || !img.naturalWidth) return;
    octx.imageSmoothingEnabled = true; octx.imageSmoothingQuality = 'high';
    octx.drawImage(img, 0, 0, ow, oh);
    octx.imageSmoothingEnabled = false;
    const box = (x, y, w, h) => { octx.fillStyle = '#000'; octx.fillRect(Math.floor(x * s), Math.floor(y * s), Math.ceil(w * s), Math.ceil(h * s)); };
    const txt = (str, color, x, y, w, h) => { const c = Font.canvas(str, color); octx.drawImage(c, Math.round(x * s), Math.round(y * s), Math.round(w * s), Math.round(h * s)); };
    // live scores over the artwork's placeholders
    box(250, 43, 166, 33); txt(LP.pad(Screens.lastScore, 6), '#e8ecf8', 258, 46, 150, 26);
    box(756, 40, 168, 32); txt(LP.pad(Screens.top(), 6), '#cfeeff', 765, 43, 150, 26);
    // single player cabinet: no 2UP. The cabinet is on free play.
    box(1262, 8, 176, 70); txt('FREE', '#ff3a32', 1307, 14, 86, 26); txt('PLAY', '#e8ecf8', 1307, 46, 86, 26);
    // PRESS ENTER blinks
    if (!Screens.blink(0.9)) box(290, 796, 350, 52);
    // controls hint in the bottom corners (game pixels)
    const hintL = Font.canvas('ESC OPTIONS', '#5a6a9a', 'small'), hintR = Font.canvas('F FULLSCREEN', '#5a6a9a', 'small');
    octx.drawImage(hintL, Math.round(4 * k), Math.round(209 * k), hintL.width * k, hintL.height * k);
    octx.drawImage(hintR, Math.round((380 - hintR.width) * k), Math.round(209 * k), hintR.width * k, hintR.height * k);
  },

  demoOver() { Screens.demoEnd = LP.States.t; }
};

const OPTIONS = [
  { label: 'MUSIC / AMBIENCE', key: 'music', min: 0, max: 10 },
  { label: 'SOUND EFFECTS', key: 'sfx', min: 0, max: 10 },
  { label: 'SOUND', key: 'muted', toggle: true },
  { label: 'FULLSCREEN', act: 'fullscreen' },
  { label: 'CRT SCANLINES', key: 'scanlines', toggle: true },
  { label: 'HIGH SCORES', act: 'scores' },
  { label: 'BACK', act: 'back' }
];

// apply persisted picture / sound settings
Screens.applySettings = function () {
  LP.Audio.applySettings();
  LP.LCD.setContrast(LP.Settings.get('contrast'));
  LP.LCD.setScanlines(LP.Settings.get('scanlines') ? GAME_CONFIG.lcd.scanlines : 0);
};

LP.States.add({
  // ---------------------------------------------------------------- title
  title: {
    enter() {
      Screens.loadScores();
      LP.Audio.stopMusic();
      LP.LCD.post = Screens.drawTitleArt;
      const prev = LP.States.prev;
      if (!prev || ['gameover', 'scores', 'paused'].includes(prev) && (prev !== 'scores' || Screens.scoresFrom === 'entry')) LP.Audio.play('titleJingle');
    },
    exit() { LP.LCD.post = null; },
    update() {
      if (Screens.attractKeys()) return;
      if (LP.States.t > 12) LP.States.go('points');
    },
    render() { Screens.clear(); }
  },

  // ---------------------------------------------------------------- score advance table
  points: {
    update() {
      if (Screens.attractKeys()) return;
      if (LP.States.t > 12) LP.States.go('story');
    },
    render() {
      const g = LP.LCD.ctx, t = LP.States.t, T = LP.Loop.time;
      Backdrop.draw(T, { ground: false, planets: false });
      Screens.text('*SCORE ADVANCE TABLE*', 192, 16, '#ff3a32', { align: 'center' });
      const rows = [
        [Sprites.ship[Math.floor(T * 4) % 2], '= ? MYSTERY', 'THE SLOTHERSHIP', '#ff50e0'],
        [Sprites.cmd[Math.floor(T * 2) % 2], '= 100 POINTS', 'COMMANDER SLOTH', '#ffd040'],
        [Sprites.atk[Math.floor(T * 2) % 2], '= 30 POINTS', 'ATTACK SLOTH', '#ff7a5a'],
        [Sprites.walk[Math.floor(T * 2) % 2], '= 20 POINTS', 'SPACEWALK SLOTH', '#e8ecf8'],
        [Sprites.ufo[Math.floor(T * 2) % 2], '= 10 POINTS', 'UFO SLOTH', '#58d8ff']
      ];
      rows.forEach(([img, pts, name, c], i) => {
        const t0 = 0.6 + i * 1.1, y = 36 + i * 24;
        if (t < t0) return;
        g.drawImage(img, 116 - img.width / 2, y + 7 - img.height / 2);
        Screens.text(Screens.typed(pts, t - t0 - 0.2, 16), 140, y + 1, '#ffffff');
        if (t > t0 + 0.8) Screens.text(name, 140, y + 11, c, { face: 'small' });
      });
      if (t > 6.5) {
        Screens.text('DIVING SLOTHS SCORE DOUBLE', 192, 160, '#9ae8ff', { face: 'small', align: 'center' });
        Screens.text('SHOOT DOWN ACORNS, MUGS AND COUCHES  = 50', 192, 169, '#9ae8ff', { face: 'small', align: 'center' });
        Screens.text('EXTRA PENGUIN AT 7500, THEN EVERY 20000', 192, 178, '#40ff60', { face: 'small', align: 'center' });
      }
      // a sloth lowers itself in on a tether, at its own pace, and stays
      const ty = Math.min(150, 4 + t * 16);
      G.rect(340, 0, 1, ty, '#545a6c');
      g.drawImage(Sprites.walk[Math.floor(T * 0.8) % 2], 333, ty);
      if (ty >= 150 && Math.floor(T * 1.2) % 3 !== 0) Screens.text('Z', 352 + Math.sin(T * 2) * 2, 140 - (T * 6) % 14, '#9ae8ff', { face: 'small' });
      if (Screens.blink(0.9)) Screens.text('PRESS ENTER', 192, 198, '#ffd040', { align: 'center' });
    }
  },

  // ---------------------------------------------------------------- the situation
  story: {
    update() {
      if (Screens.attractKeys()) return;
      if (LP.States.t > 15) LP.States.go('demo');
    },
    render() {
      const g = LP.LCD.ctx, t = LP.States.t, T = LP.Loop.time;
      Backdrop.draw(T, { ground: false, planets: false });
      // Earth, and something approaching it
      g.drawImage(Sprites.earth, 300, 120);
      for (let i = 0; i < 5; i++) {
        const x = 40 + i * 22 + t * 2, y = 150 + (i % 2) * 10 + Math.sin(T + i) * 1;
        g.drawImage(Sprites.ufo[Math.floor(T * 1.5 + i) % 2], Math.round(x), Math.round(y));
      }
      const lines = [
        ['EARTH HAS BEEN INVADED', '#ffffff'], ['BY SLOTHS.', '#ffffff'], ['', ''],
        ['NOBODY KNOWS WHY.', '#9ae8ff'],
        ['NOBODY KNOWS HOW THEY DEVELOPED', '#9ae8ff'], ['INTERSTELLAR TRAVEL.', '#9ae8ff'], ['', ''],
        ['THERE IS NO TIME TO INVESTIGATE.', '#ffffff'],
        ['THE PENGUINS HAVE BEEN CALLED IN.', '#ffd040']
      ];
      let start = 0.4;
      lines.forEach(([s, c], i) => {
        if (t > start) Screens.text(Screens.typed(s, t - start, 30), 18, 14 + i * 13, c);
        start += s.length / 30 + 0.3;
      });
      if (t > start + 0.4) {
        g.drawImage(Sprites.pilot, 300, 26);
        Screens.text('YOUR PILOT', 309, 45, '#58d8ff', { face: 'small', align: 'center' });
      }
      if (t > start + 1.2) Screens.text('ONLY THE PENGUINS CAN STOP THEM.', 192, 190, '#ff3a32', { align: 'center' });
    }
  },

  // ---------------------------------------------------------------- demo play
  demo: {
    enter() {
      Screens.demoEnd = 0;
      GameAudio.attenuate(0.4);
      Game.newGame(true);
      const w = LP.pick([1, 1, 2, 3, 4]);
      if (w > 1) Game.startWave(w);
    },
    exit() { GameAudio.attenuate(1); LP.Audio.stopMusic(); LP.Audio.stopAll(); Game.demo = false; },
    update(dt) {
      if (Screens.attractKeys()) return;
      if (Screens.demoEnd) { if (LP.States.t - Screens.demoEnd > 2.5) LP.States.go('scores', 'attract'); return; }
      Game.update(dt);
      if (LP.States.t > 38 && (Game.phase === 'play' || Game.phase === 'clear')) LP.States.go('scores', 'attract');
    },
    render() {
      Game.render();
      if (Screens.demoEnd) {
        Game.panel(132, 96, 120, 24, '#ff3a32');
        Screens.text('GAME OVER', 192, 104, '#ff3a32', { align: 'center' });
      }
    }
  },

  // ---------------------------------------------------------------- high scores
  scores: {
    enter(arg) { Screens.scoresFrom = arg || 'attract'; },
    update() {
      if (Screens.scoresFrom === 'attract') {
        if (Screens.attractKeys()) return;
        if (LP.States.t > 9) LP.States.go('title');
        return;
      }
      if (LP.States.t > 0.3 && (Screens.confirm() || Screens.back()) || (Screens.scoresFrom === 'entry' && LP.States.t > 10)) {
        LP.Audio.play('menu'); Screens.rank = -1;
        LP.States.go(Screens.scoresFrom === 'options' ? 'options' : 'title');
      }
    },
    render() {
      const g = LP.LCD.ctx, T = LP.Loop.time;
      Backdrop.draw(T, { ground: false, planets: false });
      Screens.text('HIGH SCORES', 192, 10, '#ff3a32', { align: 'center', scale: 2, shadow: '#601010' });
      Screens.text('RANK   SCORE   NAME', 192, 36, '#58d8ff', { align: 'center' });
      const COLORS = ['#ffd040', '#e8ecf8', '#ff9a50', '#ffffff'];
      const RANK = ['1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH', '9TH', '10TH'];
      Screens.scores.slice(0, 10).forEach((s, i) => {
        const y = 50 + i * 14, on = i === Screens.rank;
        if (on && Screens.blink(2)) G.rect(106, y - 3, 172, 13, '#2a3aa0');
        const c = on ? '#40ff60' : COLORS[Math.min(i, 3)];
        Screens.text(RANK[i], 116, y, c);
        Screens.text(LP.pad(s.score, 6), 164, y, c);
        Screens.text(s.name, 236, y, c);
      });
      // a UFO sloth drifts across, in no hurry whatsoever
      g.drawImage(Sprites.ufo[Math.floor(T * 2) % 2], Math.round(((T * 12) % 420) - 20), 194);
      if (Screens.scoresFrom === 'attract') { if (Screens.blink(0.9)) Screens.text('PRESS ENTER', 192, 196, '#ffd040', { align: 'center' }); }
      else Screens.text('ENTER: BACK', 192, 196, '#8a8aa8', { align: 'center' });
    }
  },

  // ---------------------------------------------------------------- options
  options: {
    enter(arg) { if (arg === 'title' || arg === 'paused') Screens.ret = arg; },
    update() {
      const I = LP.Input, n = OPTIONS.length;
      if (Screens.back()) { LP.Audio.play('menu'); LP.States.go(Screens.ret, 'options'); return; }
      if (I.pressed('up')) { Screens.menu = (Screens.menu + n - 1) % n; LP.Audio.play('menu'); }
      if (I.pressed('down')) { Screens.menu = (Screens.menu + 1) % n; LP.Audio.play('menu'); }
      const o = OPTIONS[Screens.menu], d = (I.pressed('right') ? 1 : 0) - (I.pressed('left') ? 1 : 0), ok = Screens.confirm();
      if (o.key && o.toggle && (d || ok)) {
        LP.Settings.set(o.key, !LP.Settings.get(o.key));
        Screens.applySettings(); LP.Audio.play('select');
      } else if (o.key && d) {
        LP.Settings.set(o.key, LP.clamp(LP.Settings.get(o.key) + d, o.min, o.max));
        Screens.applySettings(); LP.Audio.play(o.key === 'music' ? 'pickup' : 'laser');
      } else if (o.act && ok) {
        LP.Audio.play('select');
        if (o.act === 'fullscreen') LP.Shell.toggleFullscreen();
        else if (o.act === 'scores') Screens.loadScores().then(() => LP.States.go('scores', 'options'));
        else LP.States.go(Screens.ret, 'options');
      }
    },
    render() {
      const S = LP.Settings;
      if (Screens.ret === 'paused') { Game.render(); LP.LCD.ctx.fillStyle = 'rgba(0,0,0,0.75)'; LP.LCD.ctx.fillRect(0, 0, 384, 216); }
      else Backdrop.draw(LP.Loop.time, { ground: false });
      Game.panel(72, 18, 240, 176);
      Screens.text('OPTIONS', 192, 28, '#ffd040', { align: 'center', scale: 2, shadow: '#a02020' });
      OPTIONS.forEach((o, i) => {
        const y = 56 + i * 16, sel = i === Screens.menu;
        if (sel) G.rect(82, y - 4, 220, 13, '#2a3aa0');
        Screens.text(o.label, 90, y, sel ? '#ffffff' : '#9a9ab8', { face: 'small' });
        let v = '';
        if (o.key === 'muted') v = S.get('muted') ? 'OFF' : 'ON';
        else if (o.key === 'scanlines') v = S.get('scanlines') ? 'ON' : 'OFF';
        else if (o.act === 'fullscreen') v = LP.Shell.isFullscreen() ? 'ON' : 'OFF';
        if (v) Screens.text((sel && o.toggle ? '< ' : '') + v + (sel && o.toggle ? ' >' : ''), 294, y, sel ? '#58d8ff' : '#6a6a8a', { face: 'small', align: 'right' });
        if (o.max) for (let k = 0; k < o.max; k++) {
          const on = k < S.get(o.key);
          G.rect(206 + k * 9, y - 1, 7, 7, on ? (sel ? '#58d8ff' : '#4a6ab8') : '#1a1a2a');
        }
      });
      Screens.text('UP/DOWN SELECT  LEFT/RIGHT CHANGE  ESC BACK', 192, 180, '#6a6a8a', { face: 'small', align: 'center' });
    }
  },

  // ---------------------------------------------------------------- pause
  paused: {
    enter(arg) { LP.Audio.stopMusic(); if (arg !== 'options') Screens.pmenu = 0; },
    update() {
      const I = LP.Input;
      if (Screens.back()) { LP.Audio.play('pause'); LP.States.go('game', 'resume'); return; }
      if (I.pressed('up')) { Screens.pmenu = (Screens.pmenu + 2) % 3; LP.Audio.play('menu'); }
      if (I.pressed('down')) { Screens.pmenu = (Screens.pmenu + 1) % 3; LP.Audio.play('menu'); }
      if (Screens.confirm()) {
        LP.Audio.play('select');
        if (Screens.pmenu === 0) LP.States.go('game', 'resume');
        else if (Screens.pmenu === 1) LP.States.go('options', 'paused');
        else { LP.Audio.stopAll(); LP.States.go('title'); }
      }
    },
    render() {
      Game.render();
      const g = LP.LCD.ctx;
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 19, 384, 188);
      Game.panel(128, 70, 128, 78);
      Screens.text('PAUSED', 192, 78, '#ffd040', { align: 'center', scale: 2, shadow: '#a02020' });
      ['RESUME', 'OPTIONS', 'QUIT TO TITLE'].forEach((s, i) => {
        const sel = i === Screens.pmenu, y = 102 + i * 13;
        if (sel) G.rect(136, y - 3, 112, 12, '#2a3aa0');
        Screens.text(s, 192, y, sel ? '#ffffff' : '#9a9ab8', { face: 'small', align: 'center' });
      });
    }
  },

  // ---------------------------------------------------------------- game over
  gameover: {
    enter() {
      Screens.lastScore = Game.score;
      LP.Audio.stopMusic(); LP.Audio.play('gameOver');
    },
    update() {
      if (LP.States.t < 1.5 || !(Screens.confirm() || LP.States.t > 7)) return;
      LP.States.go('wait');
      LP.Scores.qualifies(Screens.lastScore).then((ok) => {
        if (ok) LP.States.go('entry');
        else Screens.loadScores().then(() => LP.States.go('title'));
      });
    },
    render() {
      Game.render();
      const g = LP.LCD.ctx, t = LP.States.t;
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 19, 384, 188);
      Game.panel(92, 72, 200, 66, '#ff3a32');
      Screens.text('GAME OVER', 192, 80, '#ff3a32', { align: 'center', scale: 2, shadow: '#400000' });
      if (t > 0.8) Screens.text('EARTH HAS FALLEN TO THE SLOTHS.', 192, 100, '#ffffff', { face: 'small', align: 'center' });
      Screens.text('SCORE ' + LP.pad(Screens.lastScore, 6) + '   WAVE ' + Game.wave, 192, 112, '#ffd040', { face: 'small', align: 'center' });
      if (t > 1.5 && Screens.blink(1)) Screens.text('PRESS ENTER', 192, 125, '#7a7a96', { face: 'small', align: 'center' });
    }
  },

  wait: { render() { } },

  // ---------------------------------------------------------------- initials
  entry: {
    enter() {
      Screens.initials = [0, 0, 0]; Screens.pos = 0; Screens.typed = 0;
      LP.Audio.play('extraLife');
    },
    update() {
      const I = LP.Input, E = Screens.initials, n = Screens.CHARS.length;
      if (Screens.typedT > 0) { Screens.typedT--; I.clearPresses(); return; }   // a letter was typed directly
      if (I.pressed('up')) { E[Screens.pos] = (E[Screens.pos] + 1) % n; LP.Audio.play('menu'); }
      if (I.pressed('down')) { E[Screens.pos] = (E[Screens.pos] + n - 1) % n; LP.Audio.play('menu'); }
      if ((I.pressed('left') || I.consume('back')) && Screens.pos > 0) { Screens.pos--; LP.Audio.play('menu'); }
      if (I.pressed('right') && Screens.pos < 2) { Screens.pos++; LP.Audio.play('menu'); }
      if (I.consume('start') || I.consume('fire')) {
        LP.Audio.play('select');
        if (Screens.pos < 2) { Screens.pos++; return; }
        Screens.submit();
      }
    },
    render() {
      const E = Screens.initials, T = LP.Loop.time, g = LP.LCD.ctx;
      Backdrop.draw(T, { ground: false, planets: false });
      Screens.text('NEW HIGH SCORE!', 192, 20, '#ffd040', { align: 'center', scale: 2, shadow: '#a02020' });
      Screens.text(LP.pad(Screens.lastScore, 6), 192, 46, '#ffffff', { align: 'center', scale: 2 });
      Screens.text('ENTER YOUR INITIALS, PILOT', 192, 74, '#58d8ff', { align: 'center' });
      E.forEach((c, i) => {
        const x = 144 + i * 36, sel = i === Screens.pos;
        G.rect(x - 2, 92, 28, 32, sel ? '#2a3aa0' : '#101030');
        if (!sel || Screens.blink(2)) Screens.text(Screens.CHARS[c] === ' ' ? '_' : Screens.CHARS[c], x + 2, 98, sel ? '#ffffff' : '#c8c8e0', { scale: 3 });
      });
      Screens.text('UP/DOWN LETTER  LEFT/RIGHT MOVE  ENTER OK', 192, 140, '#8a8aa8', { face: 'small', align: 'center' });
      Screens.text('(OR JUST TYPE THEM)', 192, 150, '#6a6a8a', { face: 'small', align: 'center' });
      g.drawImage(Sprites.pilot, 22, 150);
      Screens.text('THE PENGUINS', 31, 170 + 1, '#58d8ff', { face: 'small', align: 'center' });
      Screens.text('SALUTE YOU', 31, 177 + 1, '#58d8ff', { face: 'small', align: 'center' });
    }
  }
});

Screens.submit = function () {
  const name = Screens.initials.map((i) => Screens.CHARS[i]).join('');
  LP.States.go('wait');
  LP.Scores.submit(name, Screens.lastScore, { wave: Game.wave })
    .then((rank) => Screens.loadScores(rank)).then(() => LP.States.go('scores', 'entry'));
};

// type initials directly with letter / digit keys
window.addEventListener('keydown', (e) => {
  if (!LP.States.is('entry')) return;
  const m = /^(?:Key([A-Z])|Digit([0-9]))$/.exec(e.code);
  if (!m) return;
  e.preventDefault();
  const ch = m[1] || m[2], i = Screens.CHARS.indexOf(ch);
  if (i < 0) return;
  Screens.initials[Screens.pos] = i;
  Screens.typedT = 2;
  LP.Audio.play('menu');
  if (Screens.pos < 2) Screens.pos++;
});
