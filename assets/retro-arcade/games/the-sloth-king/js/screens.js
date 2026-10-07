/* SCREENS — the title (the supplied artwork, untouched, at full monitor resolution, with
   the menu opening over its PRESS START line), how to play, options, pause, game over and
   continue, initials entry, high scores, credits — and FLOW, the story order of acts and
   scenes. Menus over the title art are drawn into the front pixel layer (G.fgc). */
'use strict';
const Flow = (function () {
  const STORY = [
    { scene: 'intro' }, { act: 0 }, { scene: 'after1' }, { act: 1 }, { scene: 'after2' }, { scene: 'before3' }, { act: 2 }, { scene: 'after3' },
    { act: 3 }, { scene: 'after4' }, { act: 4 }, { scene: 'after5' }, { act: 5 }, { scene: 'after6' }, { act: 6 }, { scene: 'after7' },
    { act: 7 }, { scene: 'after8' }, { act: 8 }, { scene: 'after9' }, { scene: 'before10' }, { act: 9 }, { scene: 'ending' }, { scene: 'gems', gems: true }, { credits: true }
  ];
  const F = { i: 0, STORY };
  F.run = function () {
    const s = STORY[F.i];
    if (!s) { LP.States.go('credits'); return; }
    if (s.gems && Game.run.gems.size < LEVELS.length) { F.next(); return; }
    if (s.scene) Scenes.play(s.scene, () => F.next());
    else if (s.act !== undefined) { Game.start(s.act); LP.States.go('play'); }
    else if (s.credits) LP.States.go('credits');
  };
  F.next = function () { F.i++; F.run(); };
  F.newGame = function () { Game.newRun(); F.i = 0; F.run(); };
  F.startAct = function (a) {
    Game.newRun();
    F.i = STORY.findIndex((s) => s.act === a);
    // play the scene that leads into the act, if there is one
    while (F.i > 0 && STORY[F.i - 1].scene && !STORY[F.i - 1].scene.startsWith('after')) F.i--;
    F.run();
  };
  return F;
})();

const Screens = (function () {
  const S = { art: null, menu: 0, open: false, idle: 0, opt: 0, page: 0, pmenu: 0, entry: null, scoresFrom: 'title', optFrom: 'title', howFrom: 'title', confirmReset: false, cont: 0, contT: 0, credT: 0, lastRank: -1, scores: [] };
  S.titleArt = LP.loadImage('assets/title.png');
  const fg = () => G.fgc;
  const nav = () => { const I = LP.Input; return { up: I.consume('up'), down: I.consume('down'), left: I.consume('left'), right: I.consume('right'), ok: I.consume('confirm') || I.consume('start'), back: I.consume('back') }; };
  const txt = (g, s, x, y, c, o) => Font.draw(g, s, x, y, c, Object.assign({ outline: '#120804' }, o));
  S.loadScores = () => LP.Scores.list().then((l) => { S.scores = l; });

  function panel(g, x, y, w, h, alpha) {
    g.fillStyle = 'rgba(16,8,4,' + (alpha || 0.88) + ')'; g.fillRect(x, y, w, h);
    g.fillStyle = '#c8901a'; g.fillRect(x, y, w, 1); g.fillRect(x, y + h - 1, w, 1); g.fillRect(x, y, 1, h); g.fillRect(x + w - 1, y, 1, h);
    g.fillStyle = '#6a4010'; g.fillRect(x + 2, y + 2, w - 4, 1); g.fillRect(x + 2, y + h - 3, w - 4, 1);
  }
  function list(g, items, sel, x, y, gap, o) {
    o = o || {};
    items.forEach((it, i) => {
      const on = i === sel, dis = it.startsWith('~');
      const label = dis ? it.slice(1) : it;
      txt(g, label, x, y + i * gap, dis ? '#6a5a4a' : on ? '#ffd040' : '#fff4e0', { align: o.align || 'center' });
      if (on && (LP.Loop.frame >> 3) % 2 === 0) {
        const w = Font.width(label, 'big');
        const px = o.align === 'left' ? x - 12 : x - w / 2 - 14;
        Art.draw(g, Hud.paw(1), px, y + i * gap - 1);
      }
    });
  }
  // dark scenic backdrop for menus
  function backdrop(g, theme) {
    Themes.drawBackground(g, theme || 'savanna', LP.Loop.frame * 0.25, 0, 0, LP.Loop.frame / 60);
    g.fillStyle = 'rgba(10,4,20,0.55)'; g.fillRect(0, 0, 320, 240);
  }
  S.backdrop = backdrop; S.panel = panel; S.list = list;
  function drawArt(octx, k) {
    const img = S.titleArt;
    if (!img.complete || !img.naturalWidth) return;
    octx.imageSmoothingEnabled = true; octx.imageSmoothingQuality = 'high';
    octx.drawImage(img, 0, 0, 320 * k, 240 * k);
  }
  const progress = () => LP.Store.get('progress', 0);
  function titleItems() {
    const p = progress();
    return ['START GAME', p > 0 ? 'CONTINUE: ACT ' + (p + 1) : '~CONTINUE', 'HOW TO PLAY', 'OPTIONS', 'HIGH SCORES'];
  }

  LP.States.add({
    // ================================================================ TITLE
    title: {
      enter() { S.open = false; S.idle = 0; S.art = drawArt; LP.Audio.startMusic('title'); S.loadScores(); LP.Input.clearPresses(); },
      exit() { S.art = null; },
      update(dt) {
        const n = nav();
        S.idle += dt;
        if (!S.open) {
          if (n.ok || LP.Input.consume('jump')) { S.open = true; S.menu = 0; S.idle = 0; Sfx('select'); }
          if (S.idle > 40) { S.scoresFrom = 'title'; LP.States.go('scores'); }
          return;
        }
        if (n.up || n.down || n.ok || n.back) S.idle = 0;
        if (S.idle > 45) { S.open = false; S.idle = 0; }
        const items = titleItems();
        if (n.up) { do { S.menu = (S.menu + items.length - 1) % items.length; } while (items[S.menu].startsWith('~')); Sfx('move'); }
        if (n.down) { do { S.menu = (S.menu + 1) % items.length; } while (items[S.menu].startsWith('~')); Sfx('move'); }
        if (n.back) { S.open = false; Sfx('back'); }
        if (n.ok) {
          Sfx('select');
          switch (S.menu) {
            case 0: Flow.newGame(); break;
            case 1: Flow.startAct(progress()); break;
            case 2: S.howFrom = 'title'; LP.States.go('howto'); break;
            case 3: S.optFrom = 'title'; LP.States.go('options'); break;
            case 4: S.scoresFrom = 'title'; LP.States.go('scores'); break;
          }
        }
      },
      render(g) {
        g.fillStyle = '#000'; g.fillRect(0, 0, 320, 240);
        if (!S.open) return;
        const f = fg(), items = titleItems();
        panel(f, 92, 158, 136, 68);
        list(f, items, S.menu, 160, 164, 12);
      }
    },

    // ================================================================ HOW TO PLAY
    howto: {
      enter() { S.page = 0; LP.Input.clearPresses(); },
      update() {
        const n = nav();
        if (n.left && S.page > 0) { S.page--; Sfx('move'); }
        if (n.right && S.page < 2) { S.page++; Sfx('move'); }
        if (n.ok) { if (S.page < 2) { S.page++; Sfx('move'); } else { Sfx('back'); LP.States.go(S.howFrom); } }
        if (n.back) { Sfx('back'); LP.States.go(S.howFrom); }
      },
      render(g) {
        backdrop(g, ['savanna', 'jungle', 'night'][S.page]);
        panel(g, 10, 10, 300, 220);
        txt(g, 'HOW TO PLAY', 160, 18, '#ffd040', { align: 'center' });
        txt(g, (S.page + 1) + '/3', 300, 18, '#c8a060', { align: 'right', face: 'small' });
        const rows = [
          [['', 'KEYBOARD', 'XBOX PAD'], ['MOVE', 'ARROWS / WASD', 'D-PAD / STICK'], ['JUMP', 'SPACE / Z', 'A'], ['SWIPE', 'X', 'X / Y'], ['ROAR', 'C', 'B / RB / LB'],
            ['START / PAUSE', 'ENTER', 'START'], ['BACK', 'ESC', 'B / VIEW'], ['MUTE', 'M', ''], ['FULLSCREEN', 'F2', '']],
          [['HOLD JUMP', 'JUMP HIGHER'], ['RUN + DOWN', 'ROLL - SMASH CRACKED ROCK'], ['JUMP INTO A VINE', 'HANG - LEFT/RIGHT TO MOVE'], ['UP ON A VINE', 'CLIMB'], ['DOWN + JUMP', 'DROP THROUGH A BRANCH'],
            ['FALL PAST A LEDGE', 'GRAB IT AND PULL UP'], ['JUMP ON HEADS', 'BOUNCE ATTACK'], ['ROAR', 'STUN FOES, FLIP SPIKY ONES'], ['UP / DOWN', 'LOOK AROUND']],
          [['GOLDEN LEAF', '100 = EXTRA LIFE'], ['MANGO', 'HEALS ONE PAW'], ['MELON', 'HEALS FULLY'], ['BLUE BUG', 'REFILLS ROAR'], ['SLOTH DOLL', 'EXTRA LIFE'],
            ['ROYAL GEM', 'ONE HIDDEN IN EVERY ACT'], ['HANDPRINT STONE', 'CHECKPOINT'], ['TOOTS ON A NEST', 'BONUS GAME'], ['BANNER', 'END OF THE ACT']]
        ][S.page];
        rows.forEach((r, i) => {
          const y = 40 + i * 19;
          if (S.page === 0) {
            txt(g, r[0], 20, y, '#ffd040', { face: 'small' }); txt(g, r[1], 120, y, '#fff4e0', { face: 'small' }); txt(g, r[2], 220, y, '#a8e0ff', { face: 'small' });
          } else { txt(g, r[0], 20, y, '#ffd040', { face: 'small' }); txt(g, r[1], 140, y, '#fff4e0', { face: 'small' }); }
        });
        if (S.page === 2) {
          const icons = ['leaf', 'mango', 'melon', 'bug', 'oneup', 'gem'];
          icons.forEach((n, i) => Art.draw(g, Ents.itemFrame(n, 0), 124, 42 + i * 19));
        }
        txt(g, '< > PAGE    ESC BACK', 160, 214, '#c8a060', { align: 'center', face: 'small' });
      }
    },

    // ================================================================ OPTIONS
    options: {
      enter() { S.opt = 0; S.confirmReset = false; LP.Input.clearPresses(); },
      update() {
        const n = nav(), St = LP.Settings, items = 8;
        if (n.up) { S.opt = (S.opt + items - 1) % items; Sfx('move'); S.confirmReset = false; }
        if (n.down) { S.opt = (S.opt + 1) % items; Sfx('move'); S.confirmReset = false; }
        const d = n.left ? -1 : n.right ? 1 : 0;
        if (d || n.ok) {
          switch (S.opt) {
            case 0: St.set('music', LP.clamp(St.get('music') + (d || 1), 0, 10)); LP.Audio.applySettings(); break;
            case 1: St.set('sfx', LP.clamp(St.get('sfx') + (d || 1), 0, 10)); LP.Audio.applySettings(); Sfx('leaf'); break;
            case 2: St.set('difficulty', (St.get('difficulty') + (d || 1) + 3) % 3); break;
            case 3: St.set('scanlines', !St.get('scanlines')); break;
            case 4: St.set('fit', St.get('fit') === 'pixel' ? 'fill' : 'pixel'); LP.Shell.setFit(St.get('fit')); break;
            case 5: if (n.ok) LP.Shell.toggleFullscreen(); break;
            case 6: if (n.ok) { if (S.confirmReset) { LP.Scores.clear(); LP.Store.set('progress', 0); S.loadScores(); S.confirmReset = false; Sfx('hurt'); } else S.confirmReset = true; } break;
            case 7: if (n.ok) { LP.States.go(S.optFrom); Sfx('back'); return; } break;
          }
          if (S.opt !== 7 && S.opt !== 6) Sfx('move');
        }
        if (n.back) { Sfx('back'); LP.States.go(S.optFrom); }
      },
      render(g) {
        if (S.optFrom === 'pause') Game.render(g); else backdrop(g, 'falls');
        panel(g, 30, 22, 260, 196);
        txt(g, 'OPTIONS', 160, 30, '#ffd040', { align: 'center' });
        const St = LP.Settings, bar = (v) => '#'.repeat(v) + '-'.repeat(10 - v);
        const rows = [['MUSIC', bar(St.get('music'))], ['SOUND', bar(St.get('sfx'))], ['DIFFICULTY', ['EASY', 'NORMAL', 'HARD'][St.get('difficulty')]],
          ['SCANLINES', St.get('scanlines') ? 'ON' : 'OFF'], ['PIXELS', St.get('fit') === 'pixel' ? 'SHARP' : 'FILL'], ['FULLSCREEN', LP.Shell.isFullscreen() ? 'ON' : 'OFF'],
          ['RESET SCORES', S.confirmReset ? 'SURE? PRESS AGAIN' : ''], ['BACK', '']];
        rows.forEach((r, i) => {
          const on = i === S.opt, y = 52 + i * 19;
          txt(g, r[0], 48, y, on ? '#ffd040' : '#fff4e0');
          txt(g, r[1], 276, y, on ? '#ffffff' : '#c8b090', { align: 'right', face: i < 2 ? 'big' : 'small' });
          if (on && (LP.Loop.frame >> 3) % 2 === 0) Art.draw(g, Hud.paw(1), 36, y - 1);
        });
        txt(g, 'DIFFICULTY APPLIES TO THE NEXT ACT', 160, 206, '#a08060', { align: 'center', face: 'small' });
      }
    },

    // ================================================================ PLAY + PAUSE
    play: {
      enter(arg, prev) { LP.Input.clearPresses(); if (prev === 'pause' && Player.state !== 'dead' && Game.phase !== 'clear') LP.Audio.startMusic(Game.boss && Game.boss.active && !Game.boss.done ? Game.boss.music : Game.curMusic); },
      update() {
        if (Game.phase === 'play' && Player.state !== 'dead' && LP.Input.consume('pause')) { LP.States.go('pause'); return; }
        LP.Input.consume('pause');
        Game.update();
      },
      render(g) { Game.render(g); }
    },
    pause: {
      enter(arg, prev) { if (prev === 'play') { S.pmenu = 0; Sfx('pause'); LP.Audio.stopMusic(); } LP.Input.clearPresses(); },
      update() {
        const n = nav();
        const items = 4;
        if (LP.Input.consume('pause') && !n.ok) { LP.States.go('play'); return; }
        if (n.up) { S.pmenu = (S.pmenu + items - 1) % items; Sfx('move'); }
        if (n.down) { S.pmenu = (S.pmenu + 1) % items; Sfx('move'); }
        if (n.back) { LP.States.go('play'); return; }
        if (n.ok) {
          Sfx('select');
          if (S.pmenu === 0) LP.States.go('play');
          else if (S.pmenu === 1) { if (Game.run.lives > 0) { Game.run.lives--; Game.start(Game.idx, { respawn: true }); } LP.States.go('play'); }
          else if (S.pmenu === 2) { S.optFrom = 'pause'; LP.States.go('options'); }
          else { LP.Audio.stopMusic(); LP.States.go('title'); }
        }
      },
      render(g) {
        Game.render(g);
        g.fillStyle = 'rgba(8,4,16,0.55)'; g.fillRect(0, 0, 320, 240);
        panel(g, 84, 60, 152, 120);
        txt(g, 'PAUSED', 160, 68, '#ffd040', { align: 'center' });
        const lvl = Game.lvl;
        txt(g, 'ACT ' + lvl.act + ' ' + lvl.name, 160, 82, '#c8b090', { align: 'center', face: 'small' });
        list(g, ['RESUME', 'RETRY CHECKPOINT', 'OPTIONS', 'QUIT TO TITLE'], S.pmenu, 160, 98, 15);
        txt(g, 'GEMS ' + Game.run.gems.size + '/' + LEVELS.length + '   LEAVES ' + Game.stats.leaves + '/' + Game.stats.leavesTotal, 160, 162, '#ffb0c8', { align: 'center', face: 'small' });
      }
    },

    // ================================================================ GAME OVER / CONTINUE
    gameover: {
      enter() { S.contT = 0; S.cont = 9; LP.Audio.startMusic('gameover'); LP.Input.clearPresses(); },
      update() {
        S.contT++;
        const n = nav(), R = Game.run;
        if (R.continues > 0) {
          if (S.contT % 60 === 0 && S.contT > 60) { S.cont--; Sfx('tally'); }
          if (S.contT > 40 && (n.ok || LP.Input.consume('jump'))) { Sfx('select'); Game.continueRun(); LP.States.go('play'); return; }
          if (S.cont < 0 || n.back) S.toEntry();
        } else if (S.contT > 200 || (S.contT > 60 && n.ok)) S.toEntry();
      },
      render(g) {
        g.fillStyle = '#000'; g.fillRect(0, 0, 320, 240);
        const t = S.contT;
        const f = SlothArt.get(Game.lvl ? Game.lvl.form : 'cub', 'sit', 0);
        Art.draw(g, f, 160, 140);
        txt(g, 'GAME OVER', 160, 60, '#ff6a4a', { align: 'center', scale: 2 });
        if (Game.run.continues > 0 && t > 40) {
          txt(g, 'CONTINUE?', 160, 160, '#ffffff', { align: 'center' });
          txt(g, String(Math.max(0, S.cont)), 160, 176, '#ffd040', { align: 'center', scale: 2 });
          txt(g, 'CREDITS LEFT ' + Game.run.continues, 160, 202, '#a08060', { align: 'center', face: 'small' });
        }
      }
    },

    // ================================================================ INITIALS
    entry: {
      enter() { S.entry = { name: LP.Store.get('lastName', 'AAA').split(''), pos: 0 }; LP.Audio.startMusic('story'); LP.Input.clearPresses(); },
      update() {
        const n = nav(), E = S.entry, A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .!?-';
        if (n.up || n.down) { const i = A.indexOf(E.name[E.pos]); E.name[E.pos] = A[(i + (n.up ? 1 : A.length - 1)) % A.length]; Sfx('move'); }
        if (n.left && E.pos > 0) { E.pos--; Sfx('move'); }
        if (n.right && E.pos < 2) { E.pos++; Sfx('move'); }
        if (n.back && E.pos > 0) { E.pos--; Sfx('back'); }
        if (n.ok || LP.Input.consume('jump')) {
          if (E.pos < 2) { E.pos++; Sfx('select'); }
          else {
            const name = E.name.join(''); LP.Store.set('lastName', name); Sfx('oneup');
            LP.Scores.submit(name, Game.run.score, { act: Game.lvl ? Game.lvl.act : 1, gems: Game.run.gems.size }).then((r) => { S.lastRank = r; S.scoresFrom = 'game'; S.loadScores().then(() => LP.States.go('scores')); });
          }
        }
      },
      render(g) {
        backdrop(g, 'night');
        panel(g, 50, 50, 220, 140);
        txt(g, 'A NEW HIGH SCORE!', 160, 62, '#ffd040', { align: 'center' });
        txt(g, LP.pad(Game.run.score, 7), 160, 82, '#ffffff', { align: 'center', scale: 2 });
        const E = S.entry;
        for (let i = 0; i < 3; i++) {
          const x = 130 + i * 22, on = i === E.pos;
          txt(g, E.name[i], x, 120, on ? '#ffd040' : '#fff4e0', { scale: 2 });
          if (on && (LP.Loop.frame >> 3) % 2) { g.fillStyle = '#ffd040'; g.fillRect(x, 138, 14, 2); }
        }
        txt(g, 'UP/DOWN LETTER   ENTER OK', 160, 168, '#c8a060', { align: 'center', face: 'small' });
      }
    },

    // ================================================================ HIGH SCORES
    scores: {
      enter() { S.loadScores(); S.idle = 0; LP.Input.clearPresses(); if (S.scoresFrom !== 'title') LP.Audio.startMusic('title'); },
      update(dt) {
        S.idle += dt;
        const n = nav();
        if (n.ok || n.back || LP.Input.consume('jump') || S.idle > 15) { S.lastRank = -1; LP.States.go('title'); }
      },
      render(g) {
        backdrop(g, 'savanna');
        panel(g, 40, 14, 240, 212);
        txt(g, 'GREATEST KINGS', 160, 22, '#ffd040', { align: 'center' });
        S.scores.slice(0, 10).forEach((e, i) => {
          const y = 44 + i * 17, me = i === S.lastRank, c = me && (LP.Loop.frame >> 3) % 2 ? '#7aff9a' : i === 0 ? '#ffd040' : '#fff4e0';
          txt(g, (i + 1) + '.', 74, y, c, { align: 'right' });
          txt(g, e.name, 84, y, c);
          txt(g, LP.pad(e.score, 7), 210, y, c, { align: 'right' });
          if (e.act) txt(g, 'ACT ' + e.act, 254, y + 1, '#a08060', { face: 'small', align: 'right' });
        });
      }
    },

    // ================================================================ CREDITS
    credits: {
      enter() { S.credT = 0; LP.Audio.startMusic('ending'); LP.Input.clearPresses(); },
      update() {
        S.credT++;
        if (S.credT > 120 && (LP.Input.consume('start') || LP.Input.consume('confirm'))) S.credT = Math.max(S.credT, 1900);
        if (S.credT > 2000) S.toEntry();
      },
      render(g) {
        Themes.drawBackground(g, 'savanna', S.credT * 0.3, 0, 0, S.credT / 60);
        g.fillStyle = 'rgba(10,4,20,0.4)'; g.fillRect(0, 0, 320, 240);
        const lines = [
          ['THE SLOTH KING', '#ffd040', 2], ['', ''], ['A LUCID CONFUSION CREATIONS GAME', '#fff4e0'], ['', ''],
          ['STARRING', '#c8a060'], ['SLOTHBA', '#ffffff'], ['', ''], ['WITH', '#c8a060'], ['KING BRAMBLE   QUEEN WILLOW', '#ffffff'], ['MOBO THE MANDRILL', '#ffffff'], ['LUNA', '#ffffff'], ['TOOTS AND DOZER', '#ffffff'], ['', ''],
          ['AND INTRODUCING', '#c8a060'], ['MALGRIM', '#ff8a7a'], ['CACKLE   GNASH   BRUNO', '#ff8a7a'], ['BRISTLEBACK   SNAPJAW', '#ff8a7a'], ['WIDOWMAW', '#ff8a7a'], ['', ''],
          ['ART, MUSIC, LEVELS AND CODE', '#c8a060'], ['MADE WITH CARE, SLOWLY', '#ffffff'], ['BUILT ON LUCID PLUMBING', '#ffffff'], ['', ''],
          ['YOUR SCORE', '#c8a060'], [LP.pad(Game.run ? Game.run.score : 0, 7), '#ffffff'], ['ROYAL GEMS ' + (Game.run ? Game.run.gems.size : 0) + ' / ' + LEVELS.length, '#ffb0c8'], ['', ''], ['', ''],
          ['THANK YOU FOR PLAYING', '#ffd040'], ['', ''], ['THE END', '#ffffff', 2]
        ];
        const f = SlothArt.get('adult', 'run', LP.Loop.frame >> 2);
        g.fillStyle = 'rgba(20,8,4,0.6)'; g.fillRect(0, 222, 320, 18);
        Art.draw(g, f, -20 + (S.credT * 0.6) % 360, 238);
        const y0 = 250 - S.credT * 0.32;
        lines.forEach((l, i) => { const y = y0 + i * 16; if (y > -20 && y < 214 && l[0]) txt(g, l[0], 160, y, l[1], { align: 'center', scale: l[2] || 1 }); });
      }
    }
  });

  S.toEntry = function () {
    if (S.leaving) return;
    S.leaving = true;
    LP.Scores.qualifies(Game.run ? Game.run.score : 0).then((q) => {
      S.leaving = false;
      if (q) LP.States.go('entry');
      else { S.lastRank = -1; S.scoresFrom = 'game'; LP.States.go('scores'); }
    });
  };
  return S;
})();
