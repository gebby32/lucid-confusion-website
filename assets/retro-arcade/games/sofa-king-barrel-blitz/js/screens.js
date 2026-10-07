/* SCREENS — title (the finished title artwork, shown at full monitor resolution with
   live scores over it), attract mode (scores / how to play), options, pause, stage
   intro cards, loop card, game over, initials entry.
   Menus: UP/DOWN choose, LEFT/RIGHT adjust, ENTER/JUMP confirm, ESC back. */
'use strict';
const Screens = {
  scores: [], rank: -1, lastScore: 0, ret: 'title', menu: 0, pmenu: 0, confirmReset: false,
  CHARS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.!- ',
  titleArt: LP.loadImage('assets/title.png'),
  overlay: null,

  confirm: () => LP.Input.consume('start') || LP.Input.consume('jump'),
  back: () => LP.Input.consume('back') || LP.Input.consume('pause'),
  blink: (hz) => Math.floor(LP.Loop.time * hz * 2) % 2 === 0,
  loadScores(rank) { return LP.Scores.list().then((l) => { Screens.scores = l; Screens.rank = rank === undefined ? -1 : rank; }); },
  top: () => (Screens.scores.length ? Screens.scores[0].score : 0),

  // attract-mode screens and the title share these keys
  attractKeys() {
    if (Screens.confirm()) { LP.Audio.play('start'); Screens.startGame(); return true; }
    if (Screens.back()) { LP.Audio.play('menu'); LP.States.go('options', 'title'); return true; }
    return false;
  },
  startGame() { Game.newGame(); LP.States.go('intro'); },

  text(str, x, y, color, o) { return Font.draw(LP.LCD.ctx, str, x, y, color, o); },
  clear() { G.rect(0, 0, 320, 240, '#000'); },

  // ------------------------------------------------------------------ title artwork overlay
  // Drawn at OUTPUT resolution (LP.LCD.post) so the art stays sharp; coordinates are in
  // the artwork's own 1448x1086 pixels.
  drawTitleArt(octx, k) {
    const img = Screens.titleArt, ow = LP.LCD.W * k, oh = LP.LCD.H * k, s = ow / 1448;
    if (!img.complete || !img.naturalWidth) return;
    octx.imageSmoothingEnabled = true; octx.imageSmoothingQuality = 'high';
    octx.drawImage(img, 0, 0, ow, oh);
    octx.imageSmoothingEnabled = false;
    const box = (x, y, w, h) => { octx.fillStyle = '#000'; octx.fillRect(Math.floor(x * s), Math.floor(y * s), Math.ceil(w * s), Math.ceil(h * s)); };
    const txt = (str, color, x, y, w, h) => { const c = Font.canvas(str, color); octx.drawImage(c, Math.round(x * s), Math.round(y * s), Math.round(w * s), Math.round(h * s)); };
    // live scores over the artwork's 000000 placeholders
    box(200, 46, 170, 36); txt(LP.pad(Screens.lastScore, 6), '#ececf4', 207, 51, 156, 27);
    box(1088, 46, 172, 36); txt(LP.pad(Screens.top(), 6), '#ececf4', 1096, 52, 156, 26);
    // PRESS START blinks
    if (!Screens.blink(0.9)) box(578, 870, 400, 56);
    // controls hint along the bottom edge (game pixels)
    const hint = Font.canvas('ENTER START   ESC OPTIONS   F FULLSCREEN', '#8a8aa8', 'small');
    octx.drawImage(hint, Math.round((ow - hint.width * k) / 2), Math.round(233 * k), hint.width * k, hint.height * k);
  }
};

const OPTIONS = [
  { label: 'MUSIC VOLUME', key: 'music', min: 0, max: 10 },
  { label: 'SFX VOLUME', key: 'sfx', min: 0, max: 10 },
  { label: 'SOUND', key: 'muted', toggle: true },
  { label: 'SCANLINES', key: 'scanlines', toggle: true },
  { label: 'PICTURE', key: 'fit', toggle: true },
  { label: 'FULLSCREEN', act: 'fullscreen' },
  { label: 'HOW TO PLAY', act: 'howto' },
  { label: 'HIGH SCORES', act: 'scores' },
  { label: 'RESET HIGH SCORES', act: 'reset' },
  { label: 'BACK', act: 'back' }
];

// apply persisted picture / sound settings
Screens.applySettings = function () {
  LP.Audio.applySettings();
  LP.LCD.setContrast(LP.Settings.get('contrast'));
  LP.LCD.setScanlines(LP.Settings.get('scanlines') ? GAME_CONFIG.lcd.scanlines : 0);
  LP.Shell.setFit(LP.Settings.get('fit'));
};

LP.States.add({
  // ---------------------------------------------------------------- title
  title: {
    enter() {
      Screens.loadScores();
      LP.Audio.stopMusic();
      LP.LCD.post = Screens.drawTitleArt;
      const prev = LP.States.prev;
      if ((prev && !['options', 'scores', 'howto'].includes(prev)) || (prev === 'scores' && Screens.scoresFrom === 'entry')) LP.Audio.play('titleJingle');
    },
    exit() { LP.LCD.post = null; },
    update() {
      if (Screens.attractKeys()) return;
      if (LP.States.t > 14) LP.States.go('scores', 'attract');
    },
    render() { Screens.clear(); }
  },

  // ---------------------------------------------------------------- high scores
  scores: {
    enter(arg) { Screens.scoresFrom = arg || 'attract'; },
    update() {
      if (Screens.scoresFrom === 'attract') {
        if (Screens.attractKeys()) return;
        if (LP.States.t > 8) LP.States.go('howto', 'attract');
        return;
      }
      if (LP.States.t > 0.3 && (Screens.confirm() || Screens.back()) || (Screens.scoresFrom === 'entry' && LP.States.t > 12)) {
        LP.Audio.play('menu'); Screens.rank = -1;
        LP.States.go(Screens.scoresFrom === 'options' ? 'options' : 'title');
      }
    },
    render() {
      const g = LP.LCD.ctx, t = LP.Loop.time;
      Screens.clear();
      Screens.text('HIGH SCORES', 160, 14, '#ff3a3a', { align: 'center', scale: 2, shadow: '#601010' });
      Screens.text('RANK  SCORE   NAME', 160, 42, '#7ad8ff', { align: 'center' });
      const COLORS = ['#ffd040', '#e0e0e8', '#ff9a50', '#ffffff'];
      const RANK = ['1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH', '9TH', '10TH'];
      Screens.scores.slice(0, 10).forEach((s, i) => {
        const y = 58 + i * 15, on = i === Screens.rank;
        if (on && Screens.blink(2)) G.rect(70, y - 3, 180, 13, '#2a3aa0');
        const c = on ? '#40ff80' : COLORS[Math.min(i, 3)];
        Screens.text(RANK[i], 82, y, c);
        Screens.text(LP.pad(s.score, 6), 130, y, c);
        Screens.text(s.name, 200, y, c);
      });
      if (Screens.scoresFrom === 'attract') { if (Screens.blink(0.9)) Screens.text('PRESS ENTER', 160, 222, '#ffffff', { align: 'center' }); }
      else Screens.text('ENTER: BACK', 160, 222, '#8a8aa8', { align: 'center' });
      // a barrel rolls along the bottom for company
      G.draw(Sprites.barrel[Math.floor(t * 12) % 8], ((t * 40) % 360) - 20, 206);
    }
  },

  // ---------------------------------------------------------------- how to play / cast
  howto: {
    enter(arg) { Screens.howFrom = arg || 'attract'; },
    update() {
      if (Screens.howFrom === 'attract') {
        if (Screens.attractKeys()) return;
        if (LP.States.t > 13) LP.States.go('title');
        return;
      }
      if (LP.States.t > 0.3 && (Screens.confirm() || Screens.back())) { LP.Audio.play('menu'); LP.States.go('options'); }
    },
    render() {
      const g = LP.LCD.ctx, t = LP.Loop.time;
      Screens.clear();
      Screens.text('HOW TO PLAY', 160, 6, '#ffd040', { align: 'center', scale: 2, shadow: '#a02020' });
      // cast
      King.drawPose(44, 64, 1, King.POSES[Math.floor(t) % 2 ? 'pound' : 'idle'], t);
      Screens.text('SOFA KING', 74, 30, '#ff3a3a');
      Screens.text('A VERY ANGRY PENGUIN.', 74, 41, '#c8c8d8', { face: 'small' });
      Screens.text('REACH HIS PERCH TO CLEAR', 74, 49, '#c8c8d8', { face: 'small' });
      Screens.text('THE STAGE. 4 STAGES A LOOP.', 74, 56, '#c8c8d8', { face: 'small' });
      G.draw(Sprites.hero[Math.floor(t * 4) % 2 ? 'walkA' : 'walkB'], 236, 40);
      Screens.text('YOU', 230, 60, '#7ad8ff', { face: 'small' });
      // controls
      const rows = [['ARROWS / WASD', 'MOVE + CLIMB'], ['SPACE / Z', 'JUMP'], ['X / SHIFT', 'SLOTH TIME'], ['ENTER / ESC', 'PAUSE'], ['M  /  F', 'MUTE / FULLSCREEN']];
      rows.forEach(([a, b], i) => { Screens.text(a, 34, 78 + i * 10, '#ffffff', { face: 'small' }); Screens.text(b, 150, 78 + i * 10, '#7ad8ff', { face: 'small' }); });
      // scoring
      const y0 = 136;
      G.draw(Sprites.barrel[Math.floor(t * 10) % 8], 34, y0); Screens.text('JUMP A BARREL    100', 52, y0 + 3, '#ffffff', { face: 'small' });
      G.draw(Sprites.items.toilet, 33, y0 + 13); Screens.text('JUMP AN ODDITY   300', 52, y0 + 18, '#ffffff', { face: 'small' });
      G.draw(Sprites.items.duck, 35, y0 + 30); Screens.text('JUMP A DUCK      500', 52, y0 + 32, '#ffffff', { face: 'small' });
      G.draw(Sprites.pickups.remote, 188, y0); Screens.text('REMOTE  300', 200, y0 + 3, '#ffe060', { face: 'small' });
      G.draw(Sprites.pickups.chips, 186, y0 + 13); Screens.text('CHIPS   500', 200, y0 + 18, '#ffe060', { face: 'small' });
      G.draw(Sprites.pickups.pillow, 184, y0 + 30); Screens.text('PILLOW  +1 Z', 200, y0 + 32, '#7ad8ff', { face: 'small' });
      Screens.text('SLOTH TIME SLOWS THE WHOLE WORLD. EXTRA SLOTH AT 10000.', 160, 190, '#9ae8ff', { face: 'small', align: 'center' });
      Screens.text('JUMP BARRELS IN A ROW FOR COMBOS. CLIMBING HIGHER SCORES.', 160, 199, '#9ae8ff', { face: 'small', align: 'center' });
      if (Screens.howFrom === 'attract') { if (Screens.blink(0.9)) Screens.text('PRESS ENTER', 160, 222, '#ffffff', { align: 'center' }); }
      else Screens.text('ENTER: BACK', 160, 222, '#8a8aa8', { align: 'center' });
    }
  },

  // ---------------------------------------------------------------- options
  options: {
    enter(arg) { if (arg === 'title' || arg === 'paused') Screens.ret = arg; Screens.confirmReset = false; },
    update() {
      const I = LP.Input, n = OPTIONS.length;
      if (Screens.back()) { LP.Audio.play('menu'); LP.States.go(Screens.ret, 'options'); return; }
      if (I.pressed('up')) { Screens.menu = (Screens.menu + n - 1) % n; LP.Audio.play('menu'); Screens.confirmReset = false; }
      if (I.pressed('down')) { Screens.menu = (Screens.menu + 1) % n; LP.Audio.play('menu'); Screens.confirmReset = false; }
      const o = OPTIONS[Screens.menu], d = (I.pressed('right') ? 1 : 0) - (I.pressed('left') ? 1 : 0), ok = Screens.confirm();
      if (o.key && o.toggle && (d || ok)) {
        const S = LP.Settings;
        if (o.key === 'fit') S.set('fit', S.get('fit') === 'fill' ? 'pixel' : 'fill');
        else S.set(o.key, !S.get(o.key));
        Screens.applySettings(); LP.Audio.play('select');
      } else if (o.key && d) {
        LP.Settings.set(o.key, LP.clamp(LP.Settings.get(o.key) + d, o.min, o.max));
        Screens.applySettings(); LP.Audio.play(o.key === 'music' ? 'pickup' : 'points');
      } else if (o.act && ok) {
        LP.Audio.play('select');
        if (o.act === 'fullscreen') LP.Shell.toggleFullscreen();
        else if (o.act === 'howto') LP.States.go('howto', 'options');
        else if (o.act === 'scores') Screens.loadScores().then(() => LP.States.go('scores', 'options'));
        else if (o.act === 'reset') {
          if (!Screens.confirmReset) Screens.confirmReset = true;
          else { LP.Scores.clear(); Screens.loadScores(); Game.hi = 0; Screens.confirmReset = false; LP.Audio.play('crunch'); }
        } else LP.States.go(Screens.ret, 'options');
      }
    },
    render() {
      const S = LP.Settings;
      if (Screens.ret === 'paused') { Game.render(); LP.LCD.ctx.fillStyle = 'rgba(0,0,0,0.75)'; LP.LCD.ctx.fillRect(0, 0, 320, 240); }
      else Screens.clear();
      Game.panel(40, 18, 240, 206);
      Screens.text('OPTIONS', 160, 28, '#ffd040', { align: 'center', scale: 2, shadow: '#a02020' });
      OPTIONS.forEach((o, i) => {
        const y = 56 + i * 15, sel = i === Screens.menu;
        if (sel) G.rect(50, y - 3, 220, 13, '#2a3aa0');
        Screens.text(o.label, 58, y, sel ? '#ffffff' : '#9a9ab8', { face: 'small' });
        let v = '';
        if (o.key === 'muted') v = S.get('muted') ? 'OFF' : 'ON';
        else if (o.key === 'scanlines') v = S.get('scanlines') ? 'ON' : 'OFF';
        else if (o.key === 'fit') v = S.get('fit') === 'fill' ? 'FILL SCREEN' : 'PIXEL PERFECT';
        else if (o.act === 'fullscreen') v = LP.Shell.isFullscreen() ? 'ON' : 'OFF';
        else if (o.act === 'reset' && Screens.confirmReset && sel) v = 'ENTER AGAIN!';
        if (v) Screens.text((sel && o.toggle ? '< ' : '') + v + (sel && o.toggle ? ' >' : ''), 262, y, sel ? '#7ad8ff' : '#6a6a8a', { face: 'small', align: 'right' });
        if (o.max) for (let k = 0; k < o.max; k++) {
          const on = k < S.get(o.key);
          G.rect(170 + k * 9, y - 1, 7, 7, on ? (sel ? '#7ad8ff' : '#4a6ab8') : '#1a1a2a');
        }
      });
      Screens.text('UP/DOWN SELECT  LEFT/RIGHT CHANGE  ESC BACK', 160, 212, '#6a6a8a', { face: 'small', align: 'center' });
    }
  },

  // ---------------------------------------------------------------- pause
  paused: {
    enter(arg) { LP.Audio.stopMusic(); if (arg !== 'options') Screens.pmenu = 0; },
    update() {
      const I = LP.Input;
      if (Screens.back()) { LP.Audio.play('start'); LP.States.go('game', 'resume'); return; }
      if (I.pressed('up')) { Screens.pmenu = (Screens.pmenu + 2) % 3; LP.Audio.play('menu'); }
      if (I.pressed('down')) { Screens.pmenu = (Screens.pmenu + 1) % 3; LP.Audio.play('menu'); }
      if (Screens.confirm()) {
        LP.Audio.play('select');
        if (Screens.pmenu === 0) LP.States.go('game', 'resume');
        else if (Screens.pmenu === 1) LP.States.go('options', 'paused');
        else { GameAudio.setSlow(false); GameAudio.setHurry(false); LP.States.go('title'); }
      }
    },
    render() {
      Game.render();
      const g = LP.LCD.ctx;
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 20, 320, 220);
      Game.panel(96, 84, 128, 78);
      Screens.text('PAUSED', 160, 92, '#ffd040', { align: 'center', scale: 2, shadow: '#a02020' });
      ['RESUME', 'OPTIONS', 'QUIT TO TITLE'].forEach((s, i) => {
        const sel = i === Screens.pmenu, y = 116 + i * 13;
        if (sel) G.rect(104, y - 3, 112, 12, '#2a3aa0');
        Screens.text(s, 160, y, sel ? '#ffffff' : '#9a9ab8', { face: 'small', align: 'center' });
      });
    }
  },

  // ---------------------------------------------------------------- stage intro card
  intro: {
    enter() {
      Game.startStage(true);
      Screens.introKing = { x: -20 };
      LP.Audio.stopMusic();
      LP.Audio.play('intro');
    },
    update() {
      const t = LP.States.t;
      if ((t > 0.6 && Screens.confirm()) || t > 3.4) { LP.States.go('game'); return; }
    },
    render() {
      const t = LP.States.t, d = Game.def, g = LP.LCD.ctx;
      Screens.clear();
      // a strip of this stage's girder for flavour
      for (let x = 40; x < 280; x++) G.rect(x, 152, 1, 1, ['#e8282e', '#d07834', '#f0c020', '#c0203a'][Game.stageIdx]);
      if (Game.loop > 1) Screens.text('LOOP ' + Game.loop, 160, 26, '#ff60ff', { align: 'center' });
      Screens.text('STAGE ' + (Game.stageIdx + 1), 160, 44, '#ffd040', { align: 'center', scale: 3, shadow: '#a02020' });
      Screens.text(d.name, 160, 78, '#ffffff', { align: 'center' });
      const kx = Math.min(160, -20 + t * 140);
      King.drawPose(kx, 152, 1, t < 1.3 ? { wl: 60 + Math.sin(t * 20) * 30, wr: 60 - Math.sin(t * 20) * 30, beak: 1, fl: Math.floor(t * 8) % 2 * 2 } : King.POSES[Math.floor(t * 3) % 2 ? 'pound' : 'laugh'], t);
      if (t > 1.3) G.bubble(kx + 12, 117, Game.loop > 1 && Game.stageIdx === 0 ? "AGAIN?! YOU'RE SOFA KING STUBBORN!" : d.taunt, 1);
      if (t > 0.6 && Screens.blink(1)) Screens.text('PRESS ENTER', 160, 214, '#7a7a96', { face: 'small', align: 'center' });
    }
  },

  // ---------------------------------------------------------------- next loop
  loopcard: {
    enter() { LP.Audio.play('clear'); },
    update() { if ((LP.States.t > 1 && Screens.confirm()) || LP.States.t > 4.5) LP.States.go('intro'); },
    render() {
      const t = LP.States.t;
      Screens.clear();
      Screens.text('LOOP ' + Game.loop, 160, 50, '#ff60ff', { align: 'center', scale: 3, shadow: '#400040' });
      Screens.text("HE'S BACK...", 160, 100, '#ffffff', { align: 'center' });
      if (t > 0.8) Screens.text("AND HE'S SOFA KING MAD.", 160, 114, '#ff5050', { align: 'center' });
      if (t > 1.6) {
        Screens.text('FASTER BARRELS  ANGRIER KING', 160, 140, '#7ad8ff', { face: 'small', align: 'center' });
        Screens.text('MORE WEIRD STUFF', 160, 150, '#7ad8ff', { face: 'small', align: 'center' });
      }
      King.drawPose(160, 210, 1, King.POSES.mad, t);
    }
  },

  // ---------------------------------------------------------------- game over
  gameover: {
    enter() {
      Screens.lastScore = Game.score;
      LP.Audio.stopMusic(); LP.Audio.play('gameover');
      King.setState('laugh'); King.talk('GAME OVER, SLOWPOKE!', 5);
    },
    update(dt) {
      King.update(dt, Game.diff, Game.hero, Game.def);
      if (LP.States.t < 1.2 || !(Screens.confirm() || LP.States.t > 7)) return;
      LP.States.go('wait');
      LP.Scores.qualifies(Screens.lastScore).then((ok) => {
        if (ok) LP.States.go('entry');
        else Screens.loadScores().then(() => LP.States.go('title'));
      });
    },
    render() {
      Game.render();
      const g = LP.LCD.ctx;
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 20, 320, 220);
      Game.panel(80, 96, 160, 50, '#ff3030');
      Screens.text('GAME OVER', 160, 104, '#ff3a3a', { align: 'center', scale: 2, shadow: '#400000' });
      Screens.text('SCORE ' + LP.pad(Screens.lastScore, 6), 160, 124, '#ffffff', { align: 'center' });
      if (LP.States.t > 1.2 && Screens.blink(1)) Screens.text('PRESS ENTER', 160, 136, '#7a7a96', { face: 'small', align: 'center' });
    }
  },

  wait: { render() { } },

  // ---------------------------------------------------------------- initials
  entry: {
    enter() {
      Screens.initials = [0, 0, 0]; Screens.pos = 0; Screens.typed = 0;
      LP.Audio.play('oneup');
    },
    update() {
      const I = LP.Input, E = Screens.initials, n = Screens.CHARS.length;
      if (Screens.typed > 0) { Screens.typed--; I.clearPresses(); return; }    // a letter was typed directly
      if (I.pressed('up')) { E[Screens.pos] = (E[Screens.pos] + 1) % n; LP.Audio.play('menu'); }
      if (I.pressed('down')) { E[Screens.pos] = (E[Screens.pos] + n - 1) % n; LP.Audio.play('menu'); }
      if ((I.pressed('left') || I.consume('back')) && Screens.pos > 0) { Screens.pos--; LP.Audio.play('menu'); }
      if (I.pressed('right') && Screens.pos < 2) { Screens.pos++; LP.Audio.play('menu'); }
      if (Screens.confirm()) {
        LP.Audio.play('select');
        if (Screens.pos < 2) { Screens.pos++; return; }
        Screens.submit();
      }
    },
    render() {
      const E = Screens.initials, t = LP.Loop.time;
      Screens.clear();
      Screens.text('NEW HIGH SCORE!', 160, 30, '#ffd040', { align: 'center', scale: 2, shadow: '#a02020' });
      Screens.text(LP.pad(Screens.lastScore, 6), 160, 60, '#ffffff', { align: 'center', scale: 2 });
      Screens.text('ENTER YOUR INITIALS', 160, 92, '#7ad8ff', { align: 'center' });
      E.forEach((c, i) => {
        const x = 112 + i * 36, sel = i === Screens.pos;
        G.rect(x - 2, 112, 28, 32, sel ? '#2a3aa0' : '#101030');
        if (!sel || Screens.blink(2)) Screens.text(Screens.CHARS[c] === ' ' ? '_' : Screens.CHARS[c], x + 2, 118, sel ? '#ffffff' : '#c8c8e0', { scale: 3 });
      });
      Screens.text('UP/DOWN LETTER  LEFT/RIGHT MOVE  ENTER OK', 160, 166, '#8a8aa8', { face: 'small', align: 'center' });
      Screens.text('(OR JUST TYPE THEM)', 160, 176, '#6a6a8a', { face: 'small', align: 'center' });
      King.drawPose(270, 226, -1, King.POSES[Math.floor(t * 2) % 2 ? 'mad' : 'idle'], t);
      G.bubble(250, 194, 'HMPH. LUCKY.', -1);
    }
  }
});

Screens.submit = function () {
  const name = Screens.initials.map((i) => Screens.CHARS[i]).join('');
  LP.States.go('wait');
  LP.Scores.submit(name, Screens.lastScore, { loop: Game.loop, stage: Game.stageIdx + 1 })
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
  Screens.typed = 2;
  LP.Audio.play('menu');
  if (Screens.pos < 2) Screens.pos++;
});
