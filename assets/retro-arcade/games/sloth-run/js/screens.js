/* SCREENS — title (the supplied artwork, untouched, at full monitor resolution), main menu,
   radio-station select, the race wrapper, pause, game over, the four endings, initials entry,
   high scores, options, how to play, and the attract-mode demo.
   Menus and HUD are drawn into the front pixel layer (G.fgc); the world into LP.LCD.ctx. */
'use strict';
const STATIONS = [
  { freq: '88.8', name: 'HANG LOOSE HIGHWAY', song: 'drive0', color: '#ffe14a' },
  { freq: '101.1', name: 'LAZY BREEZE', song: 'drive1', color: '#7aff5a' },
  { freq: '107.7', name: 'NEON SLOTH', song: 'drive2', color: '#ff4fd0' },
  { freq: '--.-', name: 'CRICKETS (NO MUSIC)', song: 'quiet', color: '#8a8aa0' }
];

const Screens = {
  titleArt: LP.loadImage('assets/title.png'),
  art: null,                 // post hook painting hi-res art under the front layer
  scores: [], menu: 0, menuOpen: false, idle: 0, pmenu: 0, omenu: 0, page: 0, entry: null,
  lastRank: -1, scoresFrom: 'title', optFrom: 'title', howFrom: 'title', confirmReset: false, endPage: 0, endT: 0,

  W: 400, H: 300,
  song() { return STATIONS[LP.Settings.get('station')].song; },
  loadScores() { return LP.Scores.list().then((l) => { Screens.scores = l; }); },
  applySettings() { LP.Audio.applySettings(); LP.Shell.setFit(LP.Settings.get('fit')); },
  nav() {
    const I = LP.Input;
    return { up: I.consume('up'), down: I.consume('down'), left: I.consume('left'), right: I.consume('right'), ok: I.consume('confirm') || I.consume('start'), back: I.consume('back') };
  },
  clearFg() { G.fgc.clearRect(0, 0, 400, 300); },
  // hi-res title art (optionally a crop of it) painted at output resolution
  drawArt(octx, k, crop, dst) {
    const img = Screens.titleArt;
    if (!img.complete || !img.naturalWidth) return;
    octx.imageSmoothingEnabled = true; octx.imageSmoothingQuality = 'high';
    if (crop) octx.drawImage(img, crop[0], crop[1], crop[2], crop[3], dst[0] * k, dst[1] * k, dst[2] * k, dst[3] * k);
    else octx.drawImage(img, 0, 0, 400 * k, 300 * k);
  },
  // twinkles on the logo + a pulse on the baked-in PRESS START
  titleFx(octx, k) {
    const t = LP.Loop.time;
    octx.save(); octx.globalCompositeOperation = 'lighter';
    const spots = [[78, 18, 0], [236, 12, 1.7], [334, 31, 3.1], [146, 70, 4.4], [372, 72, 5.6]];
    for (const [x, y, ph] of spots) {
      const a = Math.max(0, Math.sin(t * 2.2 + ph)) ** 6;
      if (a < 0.02) continue;
      const r = (4 + 6 * a) * k;
      octx.globalAlpha = a;
      octx.fillStyle = '#ffffff';
      octx.fillRect(x * k - r, y * k - k * 0.3, r * 2, k * 0.6);
      octx.fillRect(x * k - k * 0.3, y * k - r, k * 0.6, r * 2);
      const gr = octx.createRadialGradient(x * k, y * k, 0, x * k, y * k, r * 0.7);
      gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,200,255,0)');
      octx.fillStyle = gr; octx.fillRect(x * k - r, y * k - r, r * 2, r * 2);
    }
    if (!Screens.menuOpen) {
      const a = 0.18 + 0.18 * Math.sin(t * 5);
      const gr = octx.createRadialGradient(200 * k, 264 * k, 0, 200 * k, 264 * k, 80 * k);
      gr.addColorStop(0, 'rgba(160,220,255,' + a + ')'); gr.addColorStop(1, 'rgba(160,220,255,0)');
      octx.globalAlpha = 1; octx.fillStyle = gr; octx.fillRect(110 * k, 250 * k, 180 * k, 30 * k);
    }
    octx.restore();
  },
  panel(x, y, w, h, edge, fill) {
    G.rect(x, y, w, h, fill || 'rgba(14,6,34,0.86)');
    G.frame(x, y, w, h, edge || '#ff4fd0');
    G.frame(x + 2, y + 2, w - 4, h - 4, '#3cf0ff');
  },
  menuList(items, sel, x, y, gap, o) {
    o = o || {};
    items.forEach((it, i) => {
      const on = i === sel;
      Font.draw(G.fgc, it, x, y + i * gap, on ? '#ffe14a' : (o.off || '#ffffff'), { align: o.align || 'center', outline: '#1a0a2a', scale: o.scale || 1 });
      if (on && (LP.Loop.frame >> 3) % 2 === 0) {
        const w = Font.width(it, 'big', o.scale || 1);
        Font.draw(G.fgc, '>', x - w / 2 - 14, y + i * gap, '#ff4fd0', { outline: '#1a0a2a' });
        Font.draw(G.fgc, '<', x + w / 2 + 7, y + i * gap, '#ff4fd0', { outline: '#1a0a2a' });
      }
    });
  },
  // a calm, dark scenic backdrop for menus (stage 4's sunset, slowly drifting)
  backdrop(stageId) {
    const st = STAGES[stageId === undefined ? 3 : stageId], B = Backgrounds.get(st), g = LP.LCD.ctx, t = LP.Loop.time;
    Road.background(g, { bgA: B, off: [t * 0.004, t * 0.008, t * 0.014], bgShift: 0 });
    // a simple straight road to the horizon
    const C = st.colors;
    for (let y = Road.HORIZON; y < 300; y++) {
      const d = (y - Road.HORIZON) / (300 - Road.HORIZON), w = 6 + d * 380, band = Math.floor(60 / (d + 0.05) + t * 30) % 2;
      G.to(g, () => {
        G.rect(0, y, 400, 1, C.grass[band]);
        G.rect(200 - w * 1.14, y, w * 2.28, 1, C.rumble[band]);
        G.rect(200 - w, y, w * 2, 1, band ? C.road : C.road2);
        if (band) G.rect(200 - w * 0.02, y, Math.max(1, w * 0.04), 1, C.lane);
      });
    }
    g.fillStyle = 'rgba(10,4,30,0.45)'; g.fillRect(0, 0, 400, 300);
  },
  startRun() {
    LP.Audio.play('start');
    LP.Loop.reset();
    LP.States.go('radio');
  },
  // called by Race when the run is over
  raceOver(won) {
    if (Race.demo) return Screens.demoOver();
    LP.States.go(won ? 'ending' : 'over');
  },
  demoOver() { GameAudio.Engine.stop(); LP.Audio.stopMusic(); Screens.scoresFrom = 'attract'; LP.States.go('scores'); },
  routeName() {
    const last = STAGES[Race.route[Race.route.length - 1]];
    return Race.results ? last.short : 'STAGE ' + (Race.leg + 1);
  },
  toEntryOrScores() {
    const s = Math.floor(Race.score);
    LP.Scores.qualifies(s).then((q) => {
      if (q) LP.States.go('entry');
      else { Screens.lastRank = -1; Screens.scoresFrom = 'game'; LP.States.go('scores'); }
    });
  }
};

LP.States.add({
  // ================================================================ TITLE
  title: {
    enter() {
      Screens.idle = 0; Screens.menuOpen = false;
      Screens.art = (o, k) => { Screens.drawArt(o, k); Screens.titleFx(o, k); };
      Screens.loadScores();
      GameAudio.Engine.stop();
      LP.Audio.startMusic('title');
      LP.Input.clearPresses();
    },
    exit() { Screens.art = null; },
    update(dt) {
      const n = Screens.nav();
      Screens.idle += dt;
      if (!Screens.menuOpen) {
        if (n.ok) { Screens.menuOpen = true; Screens.menu = 0; Screens.idle = 0; LP.Audio.play('select'); }
        if (Screens.idle > 22) LP.States.go('demo');
        return;
      }
      if (n.up || n.down || n.left || n.right || n.ok || n.back) Screens.idle = 0;
      if (Screens.idle > 30) { Screens.menuOpen = false; Screens.idle = 0; }
      if (n.up) { Screens.menu = (Screens.menu + 3) % 4; LP.Audio.play('menu'); }
      if (n.down) { Screens.menu = (Screens.menu + 1) % 4; LP.Audio.play('menu'); }
      if (n.back) { Screens.menuOpen = false; LP.Audio.play('back'); }
      if (n.ok) {
        switch (Screens.menu) {
          case 0: Screens.startRun(); break;
          case 1: LP.Audio.play('select'); LP.States.go('howto', 'title'); break;
          case 2: LP.Audio.play('select'); Screens.scoresFrom = 'title'; Screens.lastRank = -1; LP.States.go('scores'); break;
          case 3: LP.Audio.play('select'); LP.States.go('options', 'title'); break;
        }
      }
    },
    render() {
      const g = LP.LCD.ctx; g.fillStyle = '#000'; g.fillRect(0, 0, 400, 300);
      Screens.clearFg();
      if (!Screens.menuOpen) return;                 // the art itself says PRESS START
      G.to(G.fgc, () => {
        Screens.panel(112, 228, 176, 70, '#ff4fd0', '#120626');
        Screens.menuList(['START GAME', 'HOW TO PLAY', 'HIGH SCORES', 'OPTIONS'], Screens.menu, 200, 238, 14);
      });
    }
  },

  // ================================================================ RADIO (pick the soundtrack, like tuning the car stereo)
  radio: {
    enter() {
      Screens.page = LP.Settings.get('station'); Screens.endT = 10;
      LP.Audio.startMusic(STATIONS[Screens.page].song);
      LP.Input.clearPresses();
    },
    update(dt) {
      const n = Screens.nav();
      Screens.endT -= dt;
      if (n.left || n.up) { Screens.page = (Screens.page + 3) % 4; LP.Audio.play('radio'); LP.Audio.startMusic(STATIONS[Screens.page].song); }
      if (n.right || n.down) { Screens.page = (Screens.page + 1) % 4; LP.Audio.play('radio'); LP.Audio.startMusic(STATIONS[Screens.page].song); }
      if (n.back) { LP.Audio.play('back'); LP.States.go('title'); return; }
      if (n.ok || Screens.endT <= 0) {
        LP.Settings.set('station', Screens.page);
        LP.Audio.play('select'); LP.Audio.stopMusic();
        Race.start();
        LP.States.go('race');
      }
    },
    render() {
      Screens.backdrop(0);
      Screens.clearFg();
      const g = G.fgc, t = LP.Loop.time, S = STATIONS[Screens.page];
      G.to(g, () => {
        // the dashboard
        G.rect(0, 168, 400, 132, '#2a0c14'); G.rect(0, 168, 400, 3, '#ff5a5a'); G.rect(0, 171, 400, 6, '#8a1018');
        for (let y = 182; y < 300; y += 6) G.rect(0, y, 400, 1, '#22080e');
        // the radio
        G.rect(90, 186, 220, 92, '#101018'); G.frame(90, 186, 220, 92, '#a8acb8'); G.frame(92, 188, 216, 88, '#5a5e6a');
        G.rect(104, 196, 192, 34, '#0a1a0e'); G.frame(104, 196, 192, 34, '#3a5a3a');
        Font.draw(g, S.freq + (S.freq[0] === '-' ? '' : ' FM'), 200, 201, '#7aff5a', { align: 'center', scale: 2 });
        const name = S.name;
        Font.draw(g, name, 200, 219, S.color, { align: 'center', face: 'small', scale: 2 });
        // tuning needle
        G.rect(108, 234, 184, 3, '#2a2a34');
        const nx = 112 + Screens.page * 58; G.rect(nx, 232, 2, 7, '#ff3c3c');
        // preset buttons
        for (let i = 0; i < 4; i++) {
          const x = 108 + i * 47, on = i === Screens.page;
          G.rect(x, 244, 38, 20, on ? '#ffe14a' : '#3a3a48'); G.frame(x, 244, 38, 20, '#a8acb8');
          Font.draw(g, String(i + 1), x + 19, 250, on ? '#1a0a2a' : '#c8c8d8', { align: 'center' });
        }
        // knobs
        for (const kx of [98, 302]) { G.rect(kx - 5, 254, 10, 10, '#8a8e9a'); G.rect(kx - 3, 256, 6, 6, '#c8ccd8'); }
        // the sloth's claw reaching for the preset
        const cx = 108 + Screens.page * 47 + 19 + Math.sin(t * 3) * 1.5;
        G.to(g, () => {
          g.save(); g.translate(Math.round(cx), 262);
          Px.stroke(g, [[-40, 46], [-14, 22], [-4, 8]], 6, '#5e4228');
          Px.stroke(g, [[-40, 45], [-14, 21], [-4, 8]], 4.6, '#8a6440');
          Px.ellipse(g, -3, 5, 6, 5, '#8a6440');
          for (let i = 0; i < 3; i++) Px.stroke(g, [[-6 + i * 3, 2], [-5 + i * 3, -6], [-3 + i * 3, -9]], 0.6, '#efe4c4');
          g.restore();
        });
        // header
        Screens.panel(70, 14, 260, 54);
        Font.draw(g, 'SELECT MUSIC', 200, 22, '#ffe14a', { align: 'center', scale: 2, outline: '#1a0a2a', shadow: '#ff4fd0' });
        Font.draw(g, '< >  TUNE     ENTER / A  GO', 200, 46, '#ffffff', { align: 'center', face: 'small', scale: 2 });
        Font.draw(g, String(Math.max(0, Math.ceil(Screens.endT))), 372, 24, '#ffffff', { align: 'center', scale: 2, outline: '#1a0a2a' });
      });
    }
  },

  // ================================================================ THE RACE
  race: {
    enter(arg) { LP.Input.clearPresses(); if (arg === 'resume') { GameAudio.Engine.start(); if (Race.phase === 'drive') LP.Audio.startMusic(Screens.song()); } },
    update(dt) {
      if (LP.Input.consume('pause') && ['count', 'drive'].includes(Race.phase)) { LP.States.go('pause'); return; }
      Race.update(dt);
    },
    render(g) { Race.render(g); Screens.clearFg(); Race.hud(G.fgc); }
  },

  // ================================================================ ATTRACT DEMO
  demo: {
    enter() { Race.start({ demo: true }); LP.Audio.stopMusic(); LP.Input.clearPresses(); },
    exit() { GameAudio.Engine.stop(); },
    update(dt) {
      const I = LP.Input;
      if (I.consume('start') || I.consume('confirm') || I.consume('back') || I.consume('pause')) { LP.Audio.play('select'); LP.States.go('title'); return; }
      Race.update(dt);
      if (Race.phase === 'drive' && !LP.Audio.wantSong) LP.Audio.startMusic(Screens.song());
    },
    render(g) { Race.render(g); Screens.clearFg(); Race.hud(G.fgc); }
  },

  // ================================================================ PAUSE
  pause: {
    enter() { Screens.pmenu = 0; GameAudio.Engine.stop(); LP.Audio.stopMusic(); LP.Input.clearPresses(); },
    update() {
      const n = Screens.nav();
      if (n.up) { Screens.pmenu = (Screens.pmenu + 2) % 3; LP.Audio.play('menu'); }
      if (n.down) { Screens.pmenu = (Screens.pmenu + 1) % 3; LP.Audio.play('menu'); }
      if (n.ok) {
        LP.Audio.play('select');
        if (Screens.pmenu === 0) LP.States.go('race', 'resume');
        else if (Screens.pmenu === 1) Screens.startRun();
        else LP.States.go('title');
        return;
      }
      if (n.back || LP.Input.consume('pause')) { LP.Audio.play('select'); LP.States.go('race', 'resume'); }
    },
    render(g) {
      Race.render(g);
      g.fillStyle = 'rgba(10,4,30,0.55)'; g.fillRect(0, 0, 400, 300);
      Screens.clearFg();
      G.to(G.fgc, () => {
        Race.hud(G.fgc);
        Screens.panel(110, 100, 180, 100);
        Font.draw(G.fgc, 'PAUSED', 200, 110, '#3cf0ff', { align: 'center', scale: 2, outline: '#1a0a2a', shadow: '#ff4fd0' });
        Screens.menuList(['RESUME', 'RESTART', 'QUIT TO TITLE'], Screens.pmenu, 200, 140, 16);
        Font.draw(G.fgc, 'M = MUTE', 200, 188, '#8a8aa0', { align: 'center', face: 'small' });
      });
    }
  },

  // ================================================================ GAME OVER (time ran out)
  over: {
    enter() { LP.Audio.stopMusic(); LP.Audio.play('gameover'); LP.Input.clearPresses(); },
    update() {
      const n = Screens.nav();
      if (LP.States.t > 6 || (LP.States.t > 1.5 && (n.ok || n.back))) Screens.toEntryOrScores();
    },
    render(g) {
      Race.render(g);
      g.fillStyle = 'rgba(10,4,30,' + Math.min(0.6, LP.States.t * 0.4) + ')'; g.fillRect(0, 0, 400, 300);
      Screens.clearFg();
      const f = G.fgc, t = LP.States.t;
      G.to(f, () => {
        Font.draw(f, 'GAME OVER', 200, 84, '#ff3c5c', { align: 'center', scale: 4, outline: '#1a0a2a', shadow: '#7a1a8a' });
        if (t > 1) Font.draw(f, 'SCORE ' + Math.floor(Race.score), 200, 136, '#ffffff', { align: 'center', scale: 2, outline: '#1a0a2a' });
        if (t > 1.6) Font.draw(f, 'YOU REACHED STAGE ' + (Race.leg + 1) + ': ' + Race.stage().name, 200, 164, '#ffe14a', { align: 'center', outline: '#1a0a2a' });
        if (t > 2.2) Font.draw(f, 'THE SLOTH IS NOT UPSET. HE IS NAPPING.', 200, 186, '#3cf0ff', { align: 'center', face: 'small', scale: 2 });
      });
    }
  },

  // ================================================================ THE ENDING (one per goal)
  ending: {
    enter() { Screens.endPage = 0; Screens.endT = 0; LP.Audio.startMusic('ending'); LP.Input.clearPresses(); },
    exit() { Screens.art = null; },
    update(dt) {
      Screens.endT += dt;
      const n = Screens.nav();
      const next = n.ok && Screens.endT > 1.2;
      if (Screens.endPage === 0 && (next || Screens.endT > 12)) { Screens.endPage = 1; Screens.endT = 0; LP.Audio.play('select'); }
      else if (Screens.endPage === 1 && (next || Screens.endT > 12)) {
        Screens.endPage = 2; Screens.endT = 0; LP.Audio.play('select');
        Screens.art = (o, k) => Screens.drawArt(o, k, [430, 420, 680, 510], [118, 64, 164, 123]);
      } else if (Screens.endPage === 2 && (next || Screens.endT > 10)) Screens.toEntryOrScores();
    },
    render(g) {
      const st = STAGES[Race.results ? Race.results.goal : Race.info.id], t = Screens.endT, f = G.fgc;
      if (Screens.endPage < 2) { Race.render(g); g.fillStyle = 'rgba(10,4,30,0.45)'; g.fillRect(0, 0, 400, 300); }
      else Screens.backdrop(st.id);
      Screens.clearFg();
      G.to(f, () => {
        if (Screens.endPage === 0) {
          Font.draw(f, 'YOU MADE IT TO', 200, 40, '#ffffff', { align: 'center', outline: '#1a0a2a' });
          Font.draw(f, st.name, 200, 54, '#ffe14a', { align: 'center', scale: 3, outline: '#1a0a2a', shadow: '#ff4fd0' });
          const lines = st.ending || [];
          Screens.panel(24, 112, 352, 90);
          lines.forEach((ln, i) => {
            const shown = Math.floor(LP.clamp((t - 0.6 - i * 1.4) * 28, 0, ln.length));
            Font.draw(f, ln.slice(0, shown), 200, 126 + i * 17, i === lines.length - 1 ? '#7aff5a' : '#ffffff', { align: 'center' });
          });
        } else if (Screens.endPage === 1) {
          Screens.panel(40, 30, 320, 240);
          Font.draw(f, 'THE ROAD TRIP', 200, 42, '#3cf0ff', { align: 'center', scale: 2, outline: '#1a0a2a', shadow: '#ff4fd0' });
          Race.splits.forEach((sp, i) => {
            const s = STAGES[sp.id], tt = sp.t;
            const lap = Math.floor(tt / 60) + "'" + LP.pad(Math.floor(tt % 60), 2) + '"' + LP.pad(Math.floor((tt % 1) * 100), 2);
            if (t > 0.4 + i * 0.4) { Font.draw(f, (i + 1) + ' ' + s.short, 60, 74 + i * 16, '#ffffff'); Font.draw(f, lap, 340, 74 + i * 16, '#ffe14a', { align: 'right' }); }
          });
          const r = Race.results || { timeLeft: 0, timeBonus: 0 };
          if (t > 2.2) { Font.draw(f, 'TIME LEFT ' + Math.floor(r.timeLeft) + ' SEC', 60, 152, '#ffffff'); Font.draw(f, '+' + r.timeBonus, 340, 152, '#7aff5a', { align: 'right' }); }
          if (t > 2.8) { Font.draw(f, 'CLOSE CALLS', 60, 168, '#ffffff'); Font.draw(f, String(Race.nearMisses), 340, 168, '#7aff5a', { align: 'right' }); }
          if (t > 3.2) { Font.draw(f, 'BUMPS', 60, 184, '#ffffff'); Font.draw(f, String(Race.crashes), 340, 184, '#ff9ad8', { align: 'right' }); }
          if (t > 3.8) { Font.draw(f, 'FINAL SCORE', 200, 210, '#ffe14a', { align: 'center' }); Font.draw(f, String(Math.floor(Race.score)), 200, 226, '#ffffff', { align: 'center', scale: 3, outline: '#1a0a2a', shadow: '#2c64e0' }); }
        } else {
          Screens.panel(114, 60, 172, 131, '#ffe14a', 'rgba(0,0,0,0)');
          Font.draw(f, 'THE END', 200, 24, '#ffe14a', { align: 'center', scale: 3, outline: '#1a0a2a', shadow: '#ff4fd0' });
          Font.draw(f, 'STAY COOL. DRIVE SLOW... ISH.', 200, 206, '#ffffff', { align: 'center', outline: '#1a0a2a' });
          Font.draw(f, 'SLOTH RUN', 200, 228, '#3cf0ff', { align: 'center', scale: 2, outline: '#1a0a2a' });
          Font.draw(f, 'A LUCID CONFUSION CREATION', 200, 252, '#ff9ad8', { align: 'center', outline: '#1a0a2a' });
          const left = ROUTE[3].filter((id) => id !== st.id).length;
          Font.draw(f, left + ' OTHER ENDINGS ARE OUT THERE...', 200, 272, '#8a8aa0', { align: 'center', face: 'small', scale: 2 });
        }
        if (Screens.endT > 1.2 && (LP.Loop.frame >> 4) % 2) Font.draw(f, 'PRESS START', 392, 290, '#ffffff', { align: 'right', face: 'small' });
      });
    }
  },

  // ================================================================ INITIALS ENTRY
  entry: {
    enter() { Screens.entry = { name: ['A', 'A', 'A'], pos: 0 }; LP.Audio.startMusic('ending'); LP.Input.clearPresses(); },
    update() {
      const n = Screens.nav(), E = Screens.entry;
      const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .!?';
      const cyc = (d) => { const i = CH.indexOf(E.name[E.pos]); E.name[E.pos] = CH[(i + d + CH.length) % CH.length]; LP.Audio.play('entry'); };
      if (n.up) cyc(1);
      if (n.down) cyc(-1);
      if (n.left && E.pos > 0) { E.pos--; LP.Audio.play('menu'); }
      if (n.right && E.pos < 2) { E.pos++; LP.Audio.play('menu'); }
      if (n.back && E.pos > 0) { E.pos--; LP.Audio.play('back'); }
      if (n.ok) {
        if (E.pos < 2) { E.pos++; LP.Audio.play('select'); return; }
        LP.Audio.play('select');
        LP.Scores.submit(E.name.join(''), Math.floor(Race.score), { route: Screens.routeName() }).then((rank) => {
          Screens.lastRank = rank; Screens.scoresFrom = 'game';
          Screens.loadScores().then(() => LP.States.go('scores'));
        });
        Screens.entry.done = true;
      }
    },
    render() {
      Screens.backdrop(6);
      Screens.clearFg();
      const f = G.fgc, E = Screens.entry;
      G.to(f, () => {
        Screens.panel(60, 50, 280, 200);
        Font.draw(f, 'NEW HIGH SCORE!', 200, 66, '#ffe14a', { align: 'center', scale: 2, outline: '#1a0a2a', shadow: '#ff4fd0' });
        Font.draw(f, String(Math.floor(Race.score)), 200, 96, '#ffffff', { align: 'center', scale: 2 });
        Font.draw(f, 'ENTER YOUR INITIALS', 200, 126, '#3cf0ff', { align: 'center' });
        for (let i = 0; i < 3; i++) {
          const x = 158 + i * 42, on = i === E.pos;
          Font.draw(f, E.name[i] === ' ' ? '_' : E.name[i], x, 148, on ? '#ffe14a' : '#ffffff', { align: 'center', scale: 4, outline: '#1a0a2a' });
          if (on && (LP.Loop.frame >> 3) % 2) { G.rect(x - 14, 184, 28, 3, '#ff4fd0'); }
        }
        Font.draw(f, 'UP/DOWN LETTER  LEFT/RIGHT MOVE', 200, 204, '#c8c8d8', { align: 'center', face: 'small', scale: 2 });
        Font.draw(f, 'ENTER / A TO CONFIRM', 200, 222, '#c8c8d8', { align: 'center', face: 'small', scale: 2 });
      });
    }
  },

  // ================================================================ HIGH SCORES
  scores: {
    enter() { Screens.loadScores(); LP.Input.clearPresses(); if (Screens.scoresFrom !== 'game') LP.Audio.startMusic('title'); },
    update() {
      const n = Screens.nav();
      const auto = Screens.scoresFrom === 'attract' && LP.States.t > 10;
      if (n.ok || n.back || auto) { LP.Audio.play('back'); LP.States.go('title'); if (Screens.scoresFrom === 'title') Screens.menuOpen = true; }
    },
    render() {
      Screens.backdrop(8);
      Screens.clearFg();
      const f = G.fgc;
      G.to(f, () => {
        Screens.panel(30, 14, 340, 272);
        Font.draw(f, 'HIGH SCORES', 200, 24, '#ffe14a', { align: 'center', scale: 2, outline: '#1a0a2a', shadow: '#ff4fd0' });
        Font.draw(f, 'RANK  NAME       SCORE   ROUTE', 52, 52, '#3cf0ff', { face: 'small', scale: 2 });
        Screens.scores.forEach((e, i) => {
          const y = 70 + i * 20, me = i === Screens.lastRank, c = me ? ((LP.Loop.frame >> 3) % 2 ? '#ffe14a' : '#ffffff') : (i < 3 ? ['#ffe14a', '#e0e0f0', '#ff9a3c'][i] : '#ffffff');
          Font.draw(f, String(i + 1).padStart(2, ' '), 70, y, c, { align: 'right' });
          Font.draw(f, e.name, 92, y, c);
          Font.draw(f, String(e.score), 236, y, c, { align: 'right' });
          Font.draw(f, (e.route || '-').slice(0, 16), 250, y + 1, me ? c : '#a8a8c8', { face: 'small' });
        });
      });
    }
  },

  // ================================================================ OPTIONS
  options: {
    enter(from) { Screens.optFrom = from || 'title'; Screens.omenu = 0; Screens.confirmReset = false; LP.Input.clearPresses(); },
    update() {
      const n = Screens.nav(), S = LP.Settings, N = 8;
      if (n.up) { Screens.omenu = (Screens.omenu + N - 1) % N; Screens.confirmReset = false; LP.Audio.play('menu'); }
      if (n.down) { Screens.omenu = (Screens.omenu + 1) % N; Screens.confirmReset = false; LP.Audio.play('menu'); }
      const d = (n.right ? 1 : 0) - (n.left ? 1 : 0);
      const leave = () => { LP.Audio.play('back'); LP.States.go(Screens.optFrom); if (Screens.optFrom === 'title') Screens.menuOpen = true; };
      if (n.back) return leave();
      switch (Screens.omenu) {
        case 0: if (d) { S.set('music', LP.clamp(S.get('music') + d, 0, 10)); Screens.applySettings(); LP.Audio.play('menu'); } break;
        case 1: if (d) { S.set('sfx', LP.clamp(S.get('sfx') + d, 0, 10)); Screens.applySettings(); LP.Audio.play('menu'); } break;
        case 2: if (d || n.ok) { S.set('muted', !S.get('muted')); Screens.applySettings(); LP.Audio.play('menu'); } break;
        case 3: if (d || n.ok) { S.set('scanlines', !S.get('scanlines')); LP.Audio.play('menu'); } break;
        case 4: if (d || n.ok) { S.set('fit', S.get('fit') === 'pixel' ? 'fill' : 'pixel'); Screens.applySettings(); LP.Audio.play('menu'); } break;
        case 5: if (n.ok) { LP.Shell.toggleFullscreen(); LP.Audio.play('select'); } break;
        case 6: if (n.ok) {
          if (!Screens.confirmReset) { Screens.confirmReset = true; LP.Audio.play('menu'); }
          else { LP.Scores.clear(); Screens.loadScores(); Screens.confirmReset = false; LP.Audio.play('select'); }
        } break;
        case 7: if (n.ok) leave(); break;
      }
    },
    render() {
      Screens.backdrop(1);
      Screens.clearFg();
      const f = G.fgc, S = LP.Settings;
      G.to(f, () => {
        Screens.panel(40, 18, 320, 264);
        Font.draw(f, 'OPTIONS', 200, 30, '#ffe14a', { align: 'center', scale: 2, outline: '#1a0a2a', shadow: '#ff4fd0' });
        const rows = [
          ['MUSIC', S.get('music')], ['SOUND FX', S.get('sfx')], ['MUTE', S.get('muted') ? 'ON' : 'OFF'],
          ['SCANLINES', S.get('scanlines') ? 'ON' : 'OFF'], ['SCREEN', S.get('fit') === 'pixel' ? 'SHARP PIXELS' : 'FILL'],
          ['FULLSCREEN', LP.Shell.isFullscreen() ? 'ON' : 'OFF'], ['RESET SCORES', Screens.confirmReset ? 'SURE? PRESS AGAIN' : ''], ['BACK', '']
        ];
        rows.forEach(([k, v], i) => {
          const on = i === Screens.omenu, y = 62 + i * 22, c = on ? '#ffe14a' : '#ffffff';
          if (on && (LP.Loop.frame >> 3) % 2 === 0) Font.draw(f, '>', 54, y, '#ff4fd0');
          Font.draw(f, k, 68, y, c, { outline: '#1a0a2a' });
          if (typeof v === 'number') {
            for (let b = 0; b < 10; b++) G.rect(244 + b * 10, y - 1 + (9 - b) * 0.4, 7, 9 - (9 - b) * 0.4, b < v ? (on ? '#3cf0ff' : '#a8a8c8') : '#2a1a3a');
          } else Font.draw(f, v, 344, y, on ? '#3cf0ff' : '#a8a8c8', { align: 'right', outline: '#1a0a2a' });
        });
        Font.draw(f, 'LEFT/RIGHT CHANGE   ESC / B BACK', 200, 248, '#8a8aa0', { align: 'center', face: 'small', scale: 2 });
        Font.draw(f, 'M MUTES ANY TIME.  F2 / DOUBLE-CLICK = FULLSCREEN', 200, 264, '#8a8aa0', { align: 'center', face: 'small' });
      });
    }
  },

  // ================================================================ HOW TO PLAY
  howto: {
    enter(from) { Screens.howFrom = from || 'title'; Screens.page = 0; LP.Input.clearPresses(); },
    update() {
      const n = Screens.nav();
      if (n.left && Screens.page > 0) { Screens.page--; LP.Audio.play('menu'); }
      if ((n.right || n.ok) && Screens.page < 2) { Screens.page++; LP.Audio.play('menu'); return; }
      if (n.back || (n.ok && Screens.page === 2)) { LP.Audio.play('back'); LP.States.go(Screens.howFrom); if (Screens.howFrom === 'title') Screens.menuOpen = true; }
    },
    render() {
      Screens.backdrop(0);
      Screens.clearFg();
      const f = G.fgc, p = Screens.page;
      const line = (s, y, c, o) => Font.draw(f, s, 200, y, c || '#ffffff', Object.assign({ align: 'center', outline: '#1a0a2a' }, o));
      G.to(f, () => {
        Screens.panel(20, 14, 360, 272);
        Font.draw(f, ['THE ROAD TRIP', 'CONTROLS', 'SLOTH TIPS'][p], 200, 26, '#ffe14a', { align: 'center', scale: 2, outline: '#1a0a2a', shadow: '#ff4fd0' });
        if (p === 0) {
          line('DRIVE THE COAST IN STYLE.', 58);
          line('REACH EACH CHECKPOINT BEFORE', 82, '#3cf0ff'); line('THE CLOCK RUNS OUT.', 96, '#3cf0ff');
          line('EVERY CHECKPOINT ADDS TIME.', 114);
          line('AT THE END OF EACH STAGE THE', 138, '#ff9ad8'); line('ROAD SPLITS. PICK A SIDE!', 152, '#ff9ad8');
          line('LEFT = CHILL    RIGHT = TOUGH', 170, '#7aff5a');
          line('4 LEGS. 10 STAGES. 4 ENDINGS.', 196, '#ffe14a');
          line('TIME LEFT AT THE GOAL = BIG BONUS.', 214);
          line('THE SLOTH NEVER PANICS. NOR SHOULD YOU.', 244, '#8a8aa0', { face: 'small', scale: 2 });
        } else if (p === 1) {
          Font.draw(f, 'KEYBOARD', 110, 54, '#3cf0ff', { align: 'center' });
          Font.draw(f, 'XBOX PAD', 290, 54, '#3cf0ff', { align: 'center' });
          const rows = [['STEER', 'LEFT / RIGHT', 'STICK / D-PAD'], ['GAS', 'UP / X / SPACE', 'A / RT'], ['BRAKE', 'DOWN / Z', 'B / LT'],
            ['PAUSE', 'ENTER / ESC', 'START'], ['BACK', 'ESC', 'B / BACK'], ['MUTE', 'M', '-'], ['FULLSCREEN', 'F2', '-']];
          rows.forEach(([a, k, pd], i) => {
            const y = 76 + i * 20;
            Font.draw(f, a, 200, y, '#ffe14a', { align: 'center', face: 'small', scale: 2 });
            Font.draw(f, k, 110, y, '#ffffff', { align: 'center', face: 'small', scale: 2 });
            Font.draw(f, pd, 290, y, '#ffffff', { align: 'center', face: 'small', scale: 2 });
          });
          line('THE LEFT STICK STEERS SMOOTHLY.', 230, '#8a8aa0', { face: 'small', scale: 2 });
          line('TRIGGERS ARE ANALOG GAS AND BRAKE.', 246, '#8a8aa0', { face: 'small', scale: 2 });
        } else {
          const tips = [['GRASS IS SLOW.', 'STAY ON THE BLACKTOP.', '#7aff5a'], ['SCENERY SPINS YOU OUT.', 'PALM TREES DO NOT MOVE.', '#ff9ad8'],
            ['BRAKE + STEER AT SPEED = DRIFT.', 'HOLD IT FOR DRIFT POINTS.', '#ff9a3c'], ['SKIM PAST TRAFFIC = CLOSE CALL.', 'CHAIN THEM FOR A COMBO!', '#3cf0ff'],
            ['LIFT OFF IN THE TIGHTEST BENDS', 'OR THEY WILL FLING YOU WIDE.', '#ffe14a']];
          tips.forEach(([a, b, c], i) => { line(a, 56 + i * 42, c); line(b, 70 + i * 42, '#ffffff', { face: 'small', scale: 2 }); });
        }
        Font.draw(f, '< ' + (p + 1) + ' / 3 >', 200, 268, '#8a8aa0', { align: 'center' });
      });
    }
  }
});
