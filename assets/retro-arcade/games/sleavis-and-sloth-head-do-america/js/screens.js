/* SCREENS — the states the game can be in.
     boot     parse the two models (title art shows immediately)
     title    the SUPPLIED title art at full monitor resolution -> PRESS START -> menu
     options / help / continueMenu / chapters / confirmNew
     play     the game (Story + Modes + MiniGames + Stage)
     pause    pause menu;  fail  the death-message + retry screen;  ending  credits */
'use strict';
const Loading = (function () {
  const TIPS = [
    'TIP: SLEAVIS GETS FREAKIER WHEN HE GETS HIT. THIS IS ALSO TRUE IN REAL LIFE.',
    'TIP: SLOTH-HEAD CAN LIFT HEAVY THINGS. MOSTLY HIS OWN EGO.',
    'TIP: PROPERTY DAMAGE IS NOT A SCORE. (IT IS TOTALLY A SCORE.)',
    'LOADING: DRAWING MORE POLYGONS ON THE HEROES THAN ON ALL OF OHIO.',
    'LOADING: TEACHING NPCS TO HAVE ELBOWS. FAILED. MOVING ON.',
    'TIP: IF YOU GET STUCK, TRY PRESSING EVERY BUTTON. THAT IS HOW THE HEROES DO IT.',
    'FUN FACT: THE SLOTH IS THE ONLY MAMMAL THAT CAN SLEEP THROUGH THIS GAME.',
    'TIP: THE REMOTE IS NOT A TV REMOTE. DON\'T TELL SLOTH-HEAD.',
    'LOADING: RE-HEATING THE GAS STATION BURRITO. FOR THE THIRD TIME.',
    'TIP: SLARIA IS ALWAYS RIGHT. THIS IS NOT A TIP. IT IS A WARNING.',
    'LOADING: APOLOGIZING TO THE STATE OF NEVADA IN ADVANCE.',
    'TIP: HOLD STILL IN BUSHES TO HIDE. MOVING BUSHES ARE SUSPICIOUS.',
    'TIP: PRESS ' + 'SWAP TO SWITCH IDIOTS. THEY ARE INTERCHANGEABLE, SCIENTIFICALLY.',
    'LOADING: COUNTING HOW MANY TIMES SLEAVIS SAID IT. (MANY.)',
    'NOTICE: NO ARMADILLOS WERE HARMED. SEVERAL WERE INCONVENIENCED.',
    'LOADING: SCRAPING GUM OFF THE TEXTURES. LEAVING SOME FOR AUTHENTICITY.'
  ];
  const L = { text: TIPS[0] };
  L.tip = () => { L.text = LP.pick(TIPS); };
  return L;
})();

const Screens = (function () {
  const S = { art: null, titleImg: null };
  const I = () => LP.Input;
  const T = (str, x, y, col, o) => Font.draw(G.g, str, x, y, col, o);

  S.applySettings = function () {
    LP.Audio.applySettings();
    LP.Shell.setFit(LP.Settings.get('fit') === 'fill' ? 'fill' : 'pixel');
  };

  // ------------------------------------------------------------------ a reusable menu
  function Menu(items) {
    const m = { items, sel: 0, rects: [] };
    const ok = (it) => !it.enabled || it.enabled();
    m.fix = () => { let n = 0; while (!ok(m.items[m.sel]) && n++ < 20) m.sel = (m.sel + 1) % m.items.length; };
    m.update = function () {
      m.fix();
      const len = m.items.length;
      if (I().pressed('down')) { do { m.sel = (m.sel + 1) % len; } while (!ok(m.items[m.sel])); GameAudio.sfx('menu'); }
      if (I().pressed('up')) { do { m.sel = (m.sel - 1 + len) % len; } while (!ok(m.items[m.sel])); GameAudio.sfx('menu'); }
      const it = m.items[m.sel];
      if (it.adjust) {
        if (I().pressed('left')) { it.adjust(-1); GameAudio.sfx('menu'); }
        if (I().pressed('right')) { it.adjust(1); GameAudio.sfx('menu'); }
      }
      for (let i = 0; i < m.rects.length; i++) {
        const r = m.rects[i];
        if (Ctl.mouseT < 0.05 && Ctl.mx >= r[0] && Ctl.mx <= r[0] + r[2] && Ctl.my >= r[1] && Ctl.my <= r[1] + r[3] && ok(m.items[i]) && m.sel !== i) { m.sel = i; GameAudio.sfx('menu'); }
        if (Ctl.mPress && Ctl.mx >= r[0] && Ctl.mx <= r[0] + r[2] && Ctl.my >= r[1] && Ctl.my <= r[1] + r[3] && ok(m.items[i])) {
          m.sel = i; const ii = m.items[i];
          if (ii.adjust) { ii.adjust(Ctl.mx > r[0] + r[2] / 2 ? 1 : -1); GameAudio.sfx('menu'); } else if (ii.act) { GameAudio.sfx('select'); ii.act(); }
          return;
        }
      }
      if ((I().pressed('confirm') || I().pressed('jump')) && it.act) { GameAudio.sfx('select'); it.act(); }
      else if ((I().pressed('confirm') || I().pressed('jump')) && it.adjust) { it.adjust(1); GameAudio.sfx('menu'); }
    };
    m.draw = function (cx, y, gap, o) {
      o = o || {};
      m.rects = [];
      m.items.forEach((it, i) => {
        const label = typeof it.label === 'function' ? it.label() : it.label;
        const on = i === m.sel, en = ok(it);
        const col = !en ? '#5a5060' : on ? '#ffd23e' : '#f0ecf8';
        const w = Font.width(label, 'big');
        if (on && en) {
          G.rect(cx - w / 2 - 10, y - 3, w + 20, 13, 'rgba(255,120,40,0.28)');
          const b = Math.floor(LP.Loop.time * 6) % 2;
          T('>', cx - w / 2 - 9 - b, y, '#ff7a2a'); T('<', cx + w / 2 + 3 + b, y, '#ff7a2a');
        }
        T(label, cx, y, col, { align: 'center', outline: '#000' });
        m.rects.push([cx - w / 2 - 12, y - 3, w + 24, gap]);
        y += gap;
      });
    };
    return m;
  }
  S.Menu = Menu;
  const vol = (k) => ({ label: () => (k === 'music' ? 'MUSIC ' : 'SOUND FX ') + '< ' + LP.Settings.get(k) + ' >', adjust: (d) => { LP.Settings.set(k, LP.clamp(LP.Settings.get(k) + d, 0, 10)); LP.Audio.applySettings(); if (k === 'sfx') GameAudio.sfx('punch'); } });
  const VOICES = ['OFF', 'GRUNTS + LAUGHS', 'ROBOT VOICES'];
  const CHUNK = ['OFF (SHARP)', 'LOW', 'PS1', 'MAXIMUM PS1'];
  function optionItems(back) {
    return [
      vol('music'), vol('sfx'),
      { label: () => 'MUTE: ' + (LP.Settings.get('muted') ? 'ON' : 'OFF'), adjust: () => LP.Audio.toggleMute() },
      { label: () => 'VOICES: ' + VOICES[LP.Settings.get('voice')], adjust: (d) => { LP.Settings.set('voice', (LP.Settings.get('voice') + (d || 1) + 3) % 3); GameAudio.laugh('sleavis'); } },
      { label: () => 'CHUNKY PIXELS: ' + CHUNK[LP.Settings.get('chunk')], adjust: (d) => LP.Settings.set('chunk', (LP.Settings.get('chunk') + (d || 1) + 4) % 4) },
      { label: () => 'SCREEN SHAKE: ' + (LP.Settings.get('shake') ? 'ON' : 'OFF'), adjust: () => LP.Settings.set('shake', !LP.Settings.get('shake')) },
      { label: () => 'SCREEN: ' + (LP.Settings.get('fit') === 'fill' ? 'FILL' : 'SHARP PIXELS'), adjust: () => { LP.Settings.set('fit', LP.Settings.get('fit') === 'fill' ? 'pixel' : 'fill'); S.applySettings(); } },
      { label: 'FULLSCREEN', act: () => LP.Shell.toggleFullscreen() },
      back
    ];
  }

  // ------------------------------------------------------------------ title art (supplied, untouched)
  S.titleImg = LP.loadImage('assets/title.png');
  function drawTitleArt(octx, k) {
    const img = S.titleImg, W = G.W * k, H = G.H * k;
    octx.fillStyle = '#000'; octx.fillRect(0, 0, W, H);
    if (img.complete && img.naturalWidth) {
      const s = Math.min(W / img.naturalWidth, H / img.naturalHeight);
      const w = img.naturalWidth * s, h = img.naturalHeight * s;
      octx.imageSmoothingEnabled = true; octx.imageSmoothingQuality = 'high';
      octx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
      octx.imageSmoothingEnabled = false;
    }
  }
  S.drawTitleArt = drawTitleArt;
  function dim(a) { G.rect(0, 0, G.W, G.H, 'rgba(0,0,0,' + a + ')'); }

  let titleMenu = null, titlePhase = 'press';
  LP.States.add({
    // ------------------------------------------------------------------ BOOT
    boot: {
      enter() { S.art = drawTitleArt; R3.active = false; },
      update() {
        if (!Heroes.ready) return;
        Game.makeHeroActors();
        // dev helper: index.html?ch=3&seg=1 jumps straight into the story (1-based chapter)
        const q = new URLSearchParams(location.search);
        if (q.has('ch')) { Game.reset(); startAt(Math.max(0, (+q.get('ch') || 1) - 1), +q.get('seg') || 0); return; }
        LP.States.go('title');
      },
      render() {
        G.to(G.fgc, () => {
          const p = Heroes.progress, err = Heroes.error;
          G.rect(G.W / 2 - 100, 318, 200, 26, 'rgba(0,0,0,0.85)');
          T(err ? 'ERROR: ' + err.slice(0, 40) : 'LOADING IDIOTS... ' + Math.round(p * 100) + '%', G.W / 2, 322, err ? '#ff4040' : '#ffe040', { face: 'small', align: 'center' });
          HUD.bar(G.W / 2 - 90, 334, 180, 4, p + (Math.sin(LP.Loop.time * 4) + 1) * 0.02, '#ff8030');
        });
      }
    },
    // ------------------------------------------------------------------ TITLE
    title: {
      enter(arg) {
        titlePhase = arg === 'menu' ? 'menu' : 'press';
        S.art = drawTitleArt; R3.active = false; R3.portrait = null;
        GameAudio.music('title');
        titleMenu = Menu([
          { label: 'NEW GAME', act: () => { if (Game.hasSave()) LP.States.go('confirmNew'); else startNew(); } },
          { label: 'CONTINUE', enabled: () => Game.hasSave(), act: () => LP.States.go('continueMenu') },
          { label: 'HOW TO PLAY', act: () => LP.States.go('help', 'title') },
          { label: 'OPTIONS', act: () => LP.States.go('options') }
        ]);
        if (Game.hasSave()) titleMenu.sel = 1;
      },
      update() {
        if (titlePhase === 'press') {
          if (I().pressed('confirm') || I().pressed('start') || I().pressed('jump') || Ctl.mPress) { titlePhase = 'menu'; GameAudio.sfx('start'); GameAudio.laugh(LP.pick(['sleavis', 'slothhead'])); LP.Input.clearPresses(); }
          return;
        }
        if (I().pressed('back')) { titlePhase = 'press'; GameAudio.sfx('back'); return; }
        titleMenu.update();
      },
      render() {
        G.to(G.fgc, () => {
          if (titlePhase === 'press') {
            if (Math.floor(LP.States.t * 2) % 2 === 0) { G.rect(G.W / 2 - 62, 346, 124, 2, '#ffe040'); }
            T('LUCIDCONFUSION.GG', G.W - 6, G.H - 8, 'rgba(255,255,255,0.5)', { face: 'small', align: 'right' });
            return;
          }
          G.rect(G.W / 2 - 90, 262, 180, 86, 'rgba(12,6,2,0.88)');
          G.frame(G.W / 2 - 90, 262, 180, 86, '#ffd23e'); G.frame(G.W / 2 - 88, 264, 176, 82, '#7a3a10');
          titleMenu.draw(G.W / 2, 272, 18);
        });
      }
    },
    confirmNew: {
      enter() { S.cm = Menu([{ label: 'NO, KEEP MY SAVE', act: () => LP.States.go('title', 'menu') }, { label: 'YES, START OVER', act: () => { LP.Store.remove('save'); startNew(); } }]); },
      update() { if (I().pressed('back')) return LP.States.go('title', 'menu'); S.cm.update(); },
      render() {
        G.to(G.fgc, () => {
          dim(0.4);
          HUD.panel(G.W / 2 - 130, 240, 260, 90, '#ff4040');
          T('START A NEW GAME?', G.W / 2, 250, '#ffffff', { align: 'center' });
          T('YOUR SAVE WILL BE ERASED. (CHAPTERS STAY UNLOCKED.)', G.W / 2, 264, '#ff9090', { face: 'small', align: 'center' });
          S.cm.draw(G.W / 2, 284, 17);
        });
      }
    },
    continueMenu: {
      enter() {
        const s = LP.Store.get('save', null);
        const ch = s ? s.ch : 0;
        S.km = Menu([
          { label: 'RESUME: CHAPTER ' + (ch + 1), act: () => continueGame() },
          { label: 'CHAPTER SELECT', act: () => LP.States.go('chapters') },
          { label: 'BACK', act: () => LP.States.go('title', 'menu') }
        ]);
      },
      update() { if (I().pressed('back')) return LP.States.go('title', 'menu'); S.km.update(); },
      render() {
        G.to(G.fgc, () => {
          const s = LP.Store.get('save', null);
          HUD.panel(G.W / 2 - 130, 236, 260, 104, '#ffd23e');
          if (s && Story.chapters[s.ch]) { T(Story.chapters[s.ch].title, G.W / 2, 246, '#ff9a4e', { align: 'center', outline: '#000' }); T('PROPERTY DAMAGE SO FAR: ' + fmtMoney(s.stats.damage || 0), G.W / 2, 260, '#80ff80', { face: 'small', align: 'center' }); }
          S.km.draw(G.W / 2, 278, 18);
        });
      }
    },
    chapters: {
      enter() {
        const reached = Math.max(LP.Store.get('reached', 0), (LP.Store.get('save', {}) || {}).ch || 0);
        S.chm = Menu(Story.chapters.map((c, i) => ({ label: () => (i <= reached ? (i + 1) + '. ' + c.title : (i + 1) + '. ???'), enabled: () => i <= reached, act: () => { startAt(i, 0); } })).concat([{ label: 'BACK', act: () => LP.States.go('continueMenu') }]));
      },
      update() { if (I().pressed('back')) return LP.States.go('continueMenu'); S.chm.update(); },
      render() {
        G.to(G.fgc, () => {
          dim(0.55);
          HUD.panel(G.W / 2 - 150, 40, 300, 290, '#ffd23e');
          T('CHAPTER SELECT', G.W / 2, 50, '#ffd23e', { align: 'center', outline: '#000' });
          S.chm.draw(G.W / 2, 72, 19);
        });
      }
    },
    options: {
      enter(from) {
        S.optFrom = from || 'title';
        S.om = Menu(optionItems({ label: 'BACK', act: () => goBack() }));
        function goBack() { GameAudio.sfx('back'); if (S.optFrom === 'pause') LP.States.go('pause', 'keep'); else LP.States.go('title', 'menu'); }
        S.omBack = goBack;
      },
      update() { if (I().pressed('back')) return S.omBack(); S.om.update(); },
      render() {
        const draw = () => {
          dim(S.optFrom === 'pause' ? 0.6 : 0.5);
          HUD.panel(G.W / 2 - 130, 60, 260, 230, '#40c0ff');
          T('OPTIONS', G.W / 2, 70, '#40c0ff', { align: 'center', outline: '#000' });
          S.om.draw(G.W / 2, 92, 20);
          const it = S.om.items[S.om.sel];
          const help = it && it.label && typeof it.label === 'function' ? (/VOICES/.test(it.label()) ? 'ROBOT VOICES USE YOUR SYSTEM\'S SPEECH. IT IS AWFUL. ON PURPOSE.' : /CHUNKY/.test(it.label()) ? 'HOW CRUMMY THE WORLD LOOKS. THE IDIOTS STAY CRISP.' : '') : '';
          if (help) T(help, G.W / 2, 276, '#a0c0d0', { face: 'small', align: 'center' });
        };
        G.to(G.fgc, draw);
      }
    },
    help: {
      enter(from) { S.helpFrom = from || 'title'; S.helpPage = 0; },
      update() {
        if (I().pressed('right') || I().pressed('left')) { S.helpPage = 1 - S.helpPage; GameAudio.sfx('menu'); }
        if (I().pressed('back') || I().pressed('confirm') || Ctl.mPress || I().pressed('pause')) { GameAudio.sfx('back'); LP.Input.clearPresses(); if (S.helpFrom === 'pause') LP.States.go('pause', 'keep'); else LP.States.go('title', 'menu'); }
      },
      render() {
        G.to(G.fgc, () => {
          dim(0.7);
          HUD.panel(14, 14, G.W - 28, G.H - 28, '#ff8a3e');
          T(S.helpPage ? 'HOW TO PLAY (2/2): BEING AN IDIOT' : 'HOW TO PLAY (1/2): CONTROLS', G.W / 2, 24, '#ff8a3e', { align: 'center', outline: '#000' });
          const rows = S.helpPage ? [
            ['SWITCH', 'PLAY AS SLEAVIS OR SLOTH-HEAD. THE OTHER ONE TAGS'],
            ['', 'ALONG AND HELPS (BADLY). SOME THINGS NEED A'],
            ['', 'SPECIFIC IDIOT. SWAP WHEN IT TELLS YOU TO.'],
            ['SLEAVIS', 'FAST, FRANTIC, BREAKS STUFF FASTER. FILL HIS FREAK'],
            ['', 'METER (GET HIT, BREAK STUFF, DRINK) THEN PRESS'],
            ['', 'SPECIAL TO BECOME *SLOTHZILLA* FOR A FEW SECONDS.'],
            ['SLOTH-HEAD', 'SLOWER, SMUGGER, LIFTS HEAVY THINGS, THROWS FARTHER.'],
            ['', 'LATER HE GETS "THE REMOTE": SPECIAL CALLS DOWN AN'],
            ['', 'ORBITAL LASER. HE THINKS IT CHANGES THE CHANNEL.'],
            ['DAMAGE', 'EVERYTHING YOU BREAK IS ADDED TO PROPERTY DAMAGE.'],
            ['', 'IT IS NOT A SCORE. IT IS A SCORE.'],
            ['FAILING', 'YOU WILL. YOU RETRY FROM THE LAST SCENE.'],
            ['SAVING', 'AUTOMATIC. CONTINUE PICKS UP WHERE YOU DIED.']
          ] : [
            ['', 'KEYBOARD             XBOX PAD'],
            ['MOVE', 'WASD / ARROWS        LEFT STICK / D-PAD'],
            ['JUMP / OK', 'SPACE (ENTER)        A'],
            ['PUNCH', 'J / CTRL / K         X'],
            ['USE / TALK / GRAB', 'E / F                B'],
            ['THROW', 'J OR E WHILE HOLDING X OR B'],
            ['SWITCH IDIOT', 'Q / TAB              Y'],
            ['SPECIAL', 'SHIFT / L            LB / RB'],
            ['DRIVING', 'STEER A/D  GAS W  BRAKE S  HONK J'],
            ['', 'PAD: STICK, RT GAS, LT BRAKE, X HONK'],
            ['PAUSE / MUTE', 'ESC / M              START'],
            ['FULLSCREEN', 'F2']
          ];
          let y = 44;
          for (const r of rows) { T(r[0], 120, y, '#ffd23e', { face: 'small', align: 'right' }); T(r[1], 130, y, '#f0ecf8', { face: 'small' }); y += S.helpPage ? 12 : 14; }
          T('LEFT / RIGHT: PAGE     ENTER / ESC: BACK', G.W / 2, G.H - 26, '#a098b0', { face: 'small', align: 'center' });
        });
      }
    },

    // ------------------------------------------------------------------ PLAY
    play: {
      enter(arg, prev) { S.art = null; R3.active = true; if (prev !== 'pause') LP.Input.clearPresses(); },
      update(dt) {
        if (I().consume('pause')) { LP.States.go('pause'); return; }
        Story.update(dt);
        if (!LP.States.is('play')) return;
        const blocked = Story.blocking();
        Modes.update(dt, blocked || !!MiniGames.cur);
        MiniGames.update(dt, blocked);
        Stage.update(dt);
        Game.update(dt);
        Modes.camera(dt);
        HUD.update(dt);
      },
      render() { G.to(G.fgc, drawPlay); }
    },
    pause: {
      enter(arg) {
        GameAudio.voiceStop();
        if (arg === 'keep' && S.pm) return;
        S.pm = Menu([
          { label: 'RESUME', act: () => LP.States.go('play') },
          { label: 'RESTART SCENE', act: () => { LP.States.go('play'); Story.fadeA = 1; Story.retry(); } },
          { label: 'OPTIONS', act: () => LP.States.go('options', 'pause') },
          { label: 'HOW TO PLAY', act: () => LP.States.go('help', 'pause') },
          { label: 'QUIT TO TITLE', act: () => { GameAudio.silence(); Modes.stop(); MiniGames.stop(); LP.States.go('title', 'menu'); } }
        ]);
      },
      update() { if (I().consume('pause') || I().pressed('back')) { GameAudio.sfx('back'); LP.States.go('play'); return; } S.pm.update(); },
      render() {
        G.to(G.fgc, () => {
          drawPlay();
          dim(0.55);
          HUD.panel(G.W / 2 - 110, 70, 220, 160, '#ff8a3e');
          T('PAUSED', G.W / 2, 80, '#ff8a3e', { align: 'center', outline: '#000', scale: 2 });
          S.pm.draw(G.W / 2, 108, 20);
          const c = Story.chapters[Story.ch];
          if (c) T('CHAPTER ' + (Story.ch + 1) + ': ' + c.title, G.W / 2, 214, '#a098b0', { face: 'small', align: 'center' });
          T('PROPERTY DAMAGE: ' + fmtMoney(Game.stats.damage) + '   SLUTT-HEADS: ' + Game.stats.slutt, G.W / 2, 246, '#80ff80', { face: 'small', align: 'center', outline: '#000' });
        });
      }
    },
    fail: {
      enter(arg) {
        S.failMsg = (arg && arg.msg) || 'You failed.';
        S.failHead = LP.pick(['YOU SUCK', 'WASTED (AGAIN)', 'NICE GOING', 'EPIC FAIL', 'DUMBASS DETECTED', 'GAME OVER, MAN']);
        GameAudio.silence(); GameAudio.sfx('fail');
        HUD.dialog = null; R3.portrait = null;
        S.fm = Menu([{ label: 'TRY AGAIN', act: () => { LP.States.go('play'); Story.fadeA = 1; Story.retry(); } }, { label: 'QUIT TO TITLE', act: () => { Modes.stop(); MiniGames.stop(); LP.States.go('title', 'menu'); } }]);
        S.failT = 0;
        setTimeout(() => GameAudio.laugh(LP.pick(['sleavis', 'slothhead'])), 900);
      },
      update(dt) { S.failT += dt; Stage.update(dt * 0.3); if (S.failT > 0.8) S.fm.update(); },
      render() {
        G.to(G.fgc, () => {
          dim(Math.min(0.65, S.failT));
          const sc = S.failT < 0.3 ? 5 : 3;
          T(S.failHead, G.W / 2, 92, '#ff3030', { align: 'center', outline: '#300000', scale: sc });
          const lines = G.wrap(S.failMsg.toUpperCase(), 380, 'big');
          lines.forEach((l, i) => T(l, G.W / 2, 140 + i * 12, '#ffffff', { align: 'center', outline: '#000' }));
          if (S.failT > 0.8) { HUD.panel(G.W / 2 - 90, 220, 180, 54, '#ff3030'); S.fm.draw(G.W / 2, 230, 20); }
        });
      }
    },
    // ------------------------------------------------------------------ CREDITS (after the finale)
    ending: {
      enter() {
        S.et = 0; S.art = null; R3.active = true;
        GameAudio.music('ending');
        Game.save(Story.chapters.length - 1, Story.chapters[Story.chapters.length - 1].segs.length - 1);
        LP.Store.set('beaten', true);
      },
      update(dt) {
        S.et += dt;
        Stage.update(dt); Game.update(dt); Modes.camera(dt);
        if (S.et > 3 && (I().pressed('confirm') || I().pressed('back') || I().pressed('jump'))) S.et += 6;
        if (S.et > CREDITS.length * 1.1 + 16) LP.States.go('title', 'menu');
      },
      render() {
        G.to(G.fgc, () => {
          dim(0.45);
          let y = G.H - S.et * 22;
          for (const c of CREDITS) {
            if (y > -20 && y < G.H + 10) {
              if (c[0] === 'H') T(c[1], G.W / 2, y, '#ffd23e', { align: 'center', outline: '#3a1000', scale: 2 });
              else if (c[0] === 'S') T(c[1], G.W / 2, y, '#ff8a3e', { align: 'center', outline: '#000' });
              else T(c[1], G.W / 2, y, '#f0ecf8', { face: 'small', align: 'center', outline: '#000' });
            }
            y += c[0] === 'H' ? 30 : c[0] === 'S' ? 18 : 11;
          }
          // the stats card at the end
          const st = Game.stats;
          if (y < G.H - 40) {
            const t0 = Math.max(y, 40);
            const rows = [['PROPERTY DAMAGE', fmtMoney(st.damage)], ['TIMES SLEAVIS SAID "SLUTT-HEAD"', st.slutt], ['PEOPLE PUNCHED UNCONSCIOUS', st.kos], ['ORBITAL LASER STRIKES', st.lasers], ['BEERS FOUND ON THE GROUND', st.beers], ['TIMES YOU DIED', st.deaths], ['TIMES THEY SCORED', '0']];
            T('FINAL TALLY', G.W / 2, t0, '#ffd23e', { align: 'center', outline: '#000', scale: 2 });
            rows.forEach((r, i) => { T(r[0], G.W / 2 - 8, t0 + 30 + i * 16, '#c8c4d8', { face: 'small', align: 'right' }); T(String(r[1]), G.W / 2 + 8, t0 + 28 + i * 16, i === rows.length - 1 ? '#ff4040' : '#ffffff', { outline: '#000' }); });
          }
        });
      }
    }
  });

  // the play-state picture: mini-game UI, then the HUD (dialogue on top), then the fade
  function drawPlay() {
    if (MiniGames.cur) { MiniGames.draw(); HUD.draw({ noGame: true }); }
    else Modes.draw();
    if (Story.fadeA > 0) {
      G.rect(0, 0, G.W, G.H, 'rgba(0,0,0,' + Story.fadeA + ')');
      if (Story.fadeA >= 1) {
        const lines = G.wrap(Loading.text, 380, 'small');
        lines.forEach((l, i) => T(l, G.W / 2, G.H - 40 + i * 9, '#a098b0', { face: 'small', align: 'center' }));
      }
    }
  }
  S.drawPlay = drawPlay;

  function startNew() {
    GameAudio.sfx('start');
    Game.reset();
    LP.Store.remove('save');
    startAt(0, 0);
  }
  function startAt(ch, seg) {
    S.art = null;
    HUD.reset();
    Story.fadeA = 1; Story.fadeTo = 1;
    LP.States.go('play');
    Story.start(ch, seg);
  }
  function continueGame() {
    const s = Game.load();
    if (!s) return startNew();
    startAt(s.ch, s.seg);
  }
  S.startAt = startAt;
  return S;
})();

const CREDITS = [
  ['H', 'SLEAVIS AND'], ['H', 'SLOTH-HEAD'], ['H', 'DO AMERICA'], ['', ''],
  ['S', 'STARRING'], ['', 'SLEAVIS ......... HIMSELF, UNFORTUNATELY'], ['', 'SLOTH-HEAD ...... HIMSELF, SMUGLY'], ['', 'SLARIA .......... THE ONLY ONE WHO GETS IT'], ['', ''],
  ['S', 'ALSO STARRING'], ['', 'DEKE FONTAINE ... A VILLAIN IN A WHITE SUIT'], ['', 'LYLE + DWAYNE ... HIS EXTREMELY HIRED GOONS'], ['', 'AGENT STRUNK ... HOMELAND INSECURITY'], ['', 'AGENT PIP ...... HER INTERN, MOSTLY BANDAGES'],
  ['', 'DOUG ........... NIGHT MANAGER OF AMERICA'], ['', 'EARL ........... TRUCKER, REGRETTER'], ['', 'WADE ........... WAS RIGHT ABOUT EVERYTHING'], ['', 'CHUCK THUNDER .. STAR OF "PUNCH FIST 3"'],
  ['', 'BIG MAMA KRULL . BIKER, POET'], ['', 'TAMMY .......... DOES NOT CARE'], ['', 'CORNELIUS ...... CORN DOG, FURIOUS'], ['', 'GASPY .......... GAS CAN, UNSETTLING'], ['', 'THE ARMADILLOS . THEMSELVES (RIP)'], ['', ''],
  ['S', 'MADE WITH'], ['', 'LUCID PLUMBING (INPUT, PADS, SAVES, AUDIO BUSES)'], ['', 'THREE.JS'], ['', 'TWO VERY EXPENSIVE SLOTH SUITS'], ['', 'AND APPROXIMATELY 400 POLYGONS FOR ALL OF AMERICA'], ['', ''],
  ['S', 'MUSIC'], ['', '"DO AMERICA" "HIGHWAY TO HECK" "SLOTH BUTT BOOGIE"'], ['', '"MOTEL BOSSA (ROOM 6 MIX)" "MALL OF SOULS"'], ['', 'ALL ORIGINAL. ALL SYNTHESIZED. ALL LOUD.'], ['', ''],
  ['S', 'NO ONE WAS HARMED'], ['', 'EXCEPT THE HOOVER DAMN, A CORN DOG, SEVERAL VANS,'], ['', 'A TRUCK STOP, A MALL, A FESTIVAL, A BLIMP, AND OHIO.'], ['', ''],
  ['S', 'THANK YOU FOR PLAYING'], ['', 'A LUCIDCONFUSION.GG RETRO ARCADE GAME'], ['', ''], ['', ''], ['', '"UH HUH HUH. IT SAID \'THE END\'."'], ['', ''], ['', '']
];
