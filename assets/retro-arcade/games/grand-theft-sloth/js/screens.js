/* SCREENS + GAME FLOW — the states the arcade cabinet can be in.
     title   the supplied title art at full monitor resolution, then the main menu
     intro   the opening narration over a slow pan of the city
     play    the game;  brief  mission briefings;  pause  the pause menu (CHEAT CODE lives here)
     dead    WASTED / BUSTED;  result  mission failed: retry or carry on
     ending  the finale, the stats and the credits;  help / options / credits from the title
   Game.* is the glue the rest of the code calls (save, wasted, busted, brief, ending...). */
'use strict';
const Game = { invuln: 0, pending: 0, deadInfo: null, briefData: null };
const Screens = (function () {
  const S = { art: null, titleImg: null };
  const I = () => LP.Input;
  const T = (str, x, y, col, o) => Font.draw(G.g, str, x, y, col, o);

  // ------------------------------------------------------------------ settings + save
  S.applySettings = function () {
    LP.Audio.applySettings();
    LP.Shell.setFit(LP.Settings.get('fit') === 'fill' ? 'fill' : 'pixel');
  };
  Game.hasSave = () => !!LP.Store.get('save', null);
  Game.save = function () {
    LP.Store.set('save', { v: 1, done: Missions.done, money: Player.money, inv: Weapons.Inv.save(), stats: Player.stats });
  };
  Game.newGame = function () {
    World.reset(); HUD.reset(); Missions.reset(0); Police.reset(); Weapons.Inv.reset();
    Player.money = 0; Player.shown = 0; Player.stats = Player.freshStats();
    const z = City.zones.safehouse;
    Player.spawn(z.x - 20, z.y + 4, Math.PI / 2);
    World.snapCamera();
    LP.States.go('intro');
  };
  Game.continueGame = function () {
    const s = LP.Store.get('save', null);
    World.reset(); HUD.reset(); Police.reset();
    Missions.reset(s ? s.done : 0);
    Weapons.Inv.load(s && s.inv);
    Player.money = s ? s.money : 0; Player.shown = Player.money;
    Player.stats = Object.assign(Player.freshStats(), s && s.stats);
    const z = City.zones.safehouse;
    Player.spawn(z.x - 20, z.y + 4, Math.PI / 2);
    World.snapCamera();
    LP.States.go('play');
    HUD.toast('WELCOME BACK, TWO-TOES', '#9dff4a');
    if (Missions.done >= Missions.list.length) HUD.tip('The story is complete. Lethargy City is yours: cause some chaos!', 6);
  };

  // ------------------------------------------------------------------ game events
  Game.wasted = function (how) {
    if (!LP.States.is('play')) return;
    Player.stats.deaths++;
    LP.States.go('dead', { kind: 'wasted', how });
  };
  Game.busted = function () {
    if (!LP.States.is('play')) return;
    Player.stats.busts++;
    LP.States.go('dead', { kind: 'busted' });
  };
  Game.failed = function () { Game.pending = 2.2; };
  Game.brief = function (def, done) { LP.States.go('brief', { def, done }); };
  Game.ending = function () { LP.States.go('ending'); };

  function respawn(kind) {
    const pl = Player.ped;
    if (pl.inCar) { const c = pl.inCar; pl.inCar = null; c.driver = null; c.throttle = 0; }
    const z = City.zones[kind === 'busted' ? 'precinct' : 'hospital'];
    const fee = Math.min(Player.money, Math.max(100, Math.round(Player.money * 0.1)));
    Player.money -= fee; Player.shown = Player.money;
    Player.spawn(z.x, z.y + 6, Math.PI / 2);
    Police.clear(); Police.heli = null;
    for (const c of World.cars) if (c.police && c.ai && (c.ai.mode === 'parkedCop' || c.ai.mode === 'block')) c.gone = true;
    for (const p of World.peds) if ((p.kind === 'cop' || p.kind === 'swat') && !p.mission) p.gone = true;
    World.snapCamera();
    Game.invuln = 2;
    if (fee) HUD.toast((kind === 'busted' ? 'BAIL: -' : 'HOSPITAL BILL: -') + fmtMoney(fee), '#ff7a7a');
    if (kind === 'busted') HUD.toast('YOU KEPT YOUR WEAPONS. LUCKY.', '#3ef0ff');
  }

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
      // mouse hover + click
      for (let i = 0; i < m.rects.length; i++) {
        const r = m.rects[i];
        if (Ctl.mouseT < 0.05 && Ctl.mx >= r[0] && Ctl.mx <= r[0] + r[2] && Ctl.my >= r[1] && Ctl.my <= r[1] + r[3] && ok(m.items[i])) { if (m.sel !== i) { m.sel = i; GameAudio.sfx('menu'); } }
        if (Ctl.mPress && Ctl.mx >= r[0] && Ctl.mx <= r[0] + r[2] && Ctl.my >= r[1] && Ctl.my <= r[1] + r[3] && ok(m.items[i])) {
          m.sel = i;
          const ii = m.items[i];
          if (ii.adjust) { ii.adjust(Ctl.mx > r[0] + r[2] / 2 ? 1 : -1); GameAudio.sfx('menu'); }
          else if (ii.act) { GameAudio.sfx('select'); ii.act(); }
          return;
        }
      }
      if (I().pressed('confirm') && it.act) { GameAudio.sfx('select'); it.act(); }
      else if (I().pressed('confirm') && it.adjust) { it.adjust(1); GameAudio.sfx('menu'); }
    };
    m.draw = function (cx, y, gap, o) {
      o = o || {};
      m.rects = [];
      m.items.forEach((it, i) => {
        const label = typeof it.label === 'function' ? it.label() : it.label;
        const on = i === m.sel, en = ok(it);
        const col = !en ? '#55506a' : on ? (o.hi || '#ffd23e') : '#e8e4f4';
        const w = Font.width(label, 'big');
        if (on && en) {
          G.rect(cx - w / 2 - 10, y - 3, w + 20, 13, 'rgba(255,79,180,0.25)');
          const b = Math.floor(LP.Loop.time * 6) % 2;
          T('>', cx - w / 2 - 9 - b, y, '#ff4fb4'); T('<', cx + w / 2 + 3 + b, y, '#ff4fb4');
        }
        T(label, cx, y, col, { align: 'center', outline: '#000' });
        m.rects.push([cx - w / 2 - 12, y - 3, w + 24, gap]);
        y += gap;
      });
    };
    return m;
  }
  const vol = (k) => ({ label: () => (k === 'music' ? 'MUSIC  ' : 'SOUND FX  ') + '< ' + LP.Settings.get(k) + ' >', adjust: (d) => { LP.Settings.set(k, LP.clamp(LP.Settings.get(k) + d, 0, 10)); LP.Audio.applySettings(); if (k === 'sfx') GameAudio.sfx('pistol'); } });
  const muteItem = { label: () => 'MUTE: ' + (LP.Settings.get('muted') ? 'ON' : 'OFF'), adjust: () => { LP.Audio.toggleMute(); } };
  const cheatItem = {
    label: () => 'CHEAT CODE: ' + (LP.Settings.get('cheat') ? 'ON' : 'OFF'),
    adjust: () => {
      const on = !LP.Settings.get('cheat');
      LP.Settings.set('cheat', on);
      Weapons.Inv.validate();
      if (on) HUD.toast('CHEAT ON: ALL WEAPONS + UNLIMITED AMMO', '#ff4fb4'); else HUD.toast('CHEAT OFF', '#e8e4f4');
    }
  };

  // ------------------------------------------------------------------ TITLE
  let titleMenu = null, titlePhase = 'press';
  S.titleImg = LP.loadImage('assets/title.png');
  function drawTitleArt(octx, k) {
    const img = S.titleImg;
    const W = G.W * k, H = G.H * k;
    octx.fillStyle = '#000'; octx.fillRect(0, 0, W, H);
    if (img.complete && img.naturalWidth) {
      const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const w = img.naturalWidth * s, h = img.naturalHeight * s;
      octx.imageSmoothingEnabled = true; octx.imageSmoothingQuality = 'high';
      octx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
      octx.imageSmoothingEnabled = false;
    }
  }
  LP.States.add({
    title: {
      enter(arg) {
        titlePhase = arg === 'menu' ? 'menu' : 'press';
        S.art = drawTitleArt;
        GameAudio.refreshMusic();
        LP.Shell.view.style.cursor = '';
        titleMenu = Menu([
          { label: 'NEW GAME', act: () => { if (Game.hasSave()) LP.States.go('confirmNew'); else { GameAudio.sfx('start'); S.art = null; Game.newGame(); } } },
          { label: 'CONTINUE', enabled: () => Game.hasSave(), act: () => { GameAudio.sfx('start'); S.art = null; Game.continueGame(); } },
          { label: 'HOW TO PLAY', act: () => LP.States.go('help', 'title') },
          { label: 'OPTIONS', act: () => LP.States.go('options') },
          { label: 'CREDITS', act: () => LP.States.go('credits') }
        ]);
        if (Game.hasSave()) titleMenu.sel = 1;
      },
      update() {
        if (titlePhase === 'press') {
          if (I().pressed('confirm') || I().pressed('start') || Ctl.mPress || I().pressed('enter')) { titlePhase = 'menu'; GameAudio.sfx('select'); LP.Input.clearPresses(); }
          return;
        }
        if (I().pressed('back')) { titlePhase = 'press'; GameAudio.sfx('back'); return; }
        titleMenu.update();
      },
      render(g) {
        g.fillStyle = '#000'; g.fillRect(0, 0, G.W, G.H);
        G.to(G.fgc, () => {
          if (titlePhase === 'press') {
            if (Math.floor(LP.States.t * 2) % 2 === 0) {
              G.rect(G.W / 2 - 74, 323, 148, 2, '#ff4fb4');
            }
            T('LUCIDCONFUSION.GG', G.W / 2, G.H - 9, '#8a84a0', { face: 'small', align: 'center' });
            return;
          }
          G.rect(G.W / 2 - 96, 254, 192, 98, 'rgba(10,6,20,0.88)');
          G.frame(G.W / 2 - 96, 254, 192, 98, '#ff4fb4'); G.frame(G.W / 2 - 94, 256, 188, 94, '#3a2050');
          titleMenu.draw(G.W / 2, 264, 17);
        });
      }
    },
    confirmNew: {
      enter() { S.cm = Menu([{ label: 'NO, KEEP MY SAVE', act: () => LP.States.go('title', 'menu') }, { label: 'YES, START OVER', act: () => { LP.Store.remove('save'); GameAudio.sfx('start'); S.art = null; Game.newGame(); } }]); },
      update() { if (I().pressed('back')) return LP.States.go('title', 'menu'); S.cm.update(); },
      render(g) {
        g.fillStyle = '#000'; g.fillRect(0, 0, G.W, G.H);
        G.to(G.fgc, () => {
          G.rect(G.W / 2 - 130, 240, 260, 90, 'rgba(10,6,20,0.92)'); G.frame(G.W / 2 - 130, 240, 260, 90, '#ff4040');
          T('START A NEW GAME?', G.W / 2, 250, '#ffffff', { align: 'center' });
          T('YOUR SAVED PROGRESS WILL BE ERASED.', G.W / 2, 264, '#ff9090', { face: 'small', align: 'center' });
          S.cm.draw(G.W / 2, 284, 17);
        });
      }
    },

    // ------------------------------------------------------------------ OPTIONS (from the title)
    options: {
      enter() {
        S.art = drawTitleArt;
        S.om = Menu([
          vol('music'), vol('sfx'), muteItem, cheatItem,
          { label: () => 'SCANLINES: ' + (LP.Settings.get('scanlines') ? 'ON' : 'OFF'), adjust: () => LP.Settings.set('scanlines', !LP.Settings.get('scanlines')) },
          { label: () => 'SCREEN: ' + (LP.Settings.get('fit') === 'fill' ? 'FILL' : 'SHARP PIXELS'), adjust: () => { LP.Settings.set('fit', LP.Settings.get('fit') === 'fill' ? 'pixel' : 'fill'); S.applySettings(); } },
          { label: 'FULLSCREEN', act: () => LP.Shell.toggleFullscreen() },
          { label: 'ERASE SAVE', enabled: () => Game.hasSave(), act: () => { LP.Store.remove('save'); GameAudio.sfx('back'); } },
          { label: 'BACK', act: () => LP.States.go('title', 'menu') }
        ]);
      },
      update() { if (I().pressed('back')) { GameAudio.sfx('back'); return LP.States.go('title', 'menu'); } S.om.update(); },
      render(g) {
        g.fillStyle = '#000'; g.fillRect(0, 0, G.W, G.H);
        G.to(G.fgc, () => {
          G.rect(G.W / 2 - 120, 150, 240, 200, 'rgba(10,6,20,0.92)'); G.frame(G.W / 2 - 120, 150, 240, 200, '#3ef0ff');
          T('OPTIONS', G.W / 2, 160, '#3ef0ff', { align: 'center', outline: '#000' });
          S.om.draw(G.W / 2, 180, 18);
        });
      }
    },
    credits: {
      enter() { S.art = drawTitleArt; },
      update() { if (I().pressed('back') || I().pressed('confirm') || Ctl.mPress) { GameAudio.sfx('back'); LP.States.go('title', 'menu'); } },
      render(g) {
        g.fillStyle = '#000'; g.fillRect(0, 0, G.W, G.H);
        G.to(G.fgc, () => {
          G.rect(40, 150, G.W - 80, 196, 'rgba(10,6,20,0.92)'); G.frame(40, 150, G.W - 80, 196, '#ffd23e');
          let y = 160;
          const L2 = (s, c, o) => { T(s, G.W / 2, y, c, Object.assign({ align: 'center' }, o)); y += o && o.face === 'small' ? 9 : 13; };
          L2('GRAND THEFT SLOTH', '#ffd23e', { outline: '#000' });
          L2('A LUCIDCONFUSION.GG RETRO ARCADE GAME', '#e8e4f4', { face: 'small' });
          y += 6;
          L2('STARRING', '#ff7ab4', { face: 'small' });
          L2('TWO-TOES  MAMA MOSS  DJ HAMMOCK', '#ffffff', { face: 'small' });
          L2('LT. CRULLER  THREE-TOE TERRY  BARON VELVET', '#ffffff', { face: 'small' });
          y += 6;
          L2('CODE, PIXELS, MUSIC + SOUND MADE FROM SCRATCH', '#3ef0ff', { face: 'small' });
          L2('BUILT ON LUCID PLUMBING', '#3ef0ff', { face: 'small' });
          y += 6;
          L2('NO SLOTHS WERE HURRIED IN THE MAKING OF THIS GAME.', '#9dff4a', { face: 'small' });
          y += 10;
          L2('PRESS ENTER', Math.floor(LP.States.t * 2) % 2 ? '#ffffff' : '#8a84a0', { face: 'small' });
        });
      }
    },

    // ------------------------------------------------------------------ HOW TO PLAY
    help: {
      enter(from) { S.helpFrom = from || 'title'; S.helpPage = 0; if (S.helpFrom === 'title') S.art = drawTitleArt; },
      update() {
        if (I().pressed('right') || I().pressed('left')) { S.helpPage = 1 - S.helpPage; GameAudio.sfx('menu'); }
        if (I().pressed('back') || I().pressed('confirm') || Ctl.mPress || I().pressed('pause')) { GameAudio.sfx('back'); LP.Input.clearPresses(); if (S.helpFrom === 'pause') LP.States.go('pause', 'keep'); else LP.States.go('title', 'menu'); }
      },
      render(g) {
        if (S.helpFrom === 'pause') { World.render(g); g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 0, G.W, G.H); }
        else { g.fillStyle = '#000'; g.fillRect(0, 0, G.W, G.H); }
        const draw = () => {
          G.rect(14, 14, G.W - 28, G.H - 28, 'rgba(10,6,20,0.94)'); G.frame(14, 14, G.W - 28, G.H - 28, '#ff4fb4');
          T(S.helpPage ? 'HOW TO PLAY (2/2): THE STREETS' : 'HOW TO PLAY (1/2): CONTROLS', G.W / 2, 24, '#ff4fb4', { align: 'center', outline: '#000' });
          const rows = S.helpPage ? [
            ['MISSIONS', 'WALK INTO THE RINGING PINK PAYPHONE'],
            ['', 'FOLLOW THE YELLOW ARROW + RADAR BLIP'],
            ['HEAT', 'CRIMES ADD BADGES. MORE BADGES = MORE COPS'],
            ['', '3+: ROADBLOCKS   4+: SWAT + CHOPPER'],
            ['LOSE HEAT', 'STAY OUT OF SIGHT, GRAB A BRIBE STAR,'],
            ['', 'OR RESPRAY AT SLOW-N-SPRAY ($250, CYAN)'],
            ['BUSTED', 'DON\'T LET COPS GRAB YOU WHILE STOPPED'],
            ['CARS', 'SHOT-UP CARS SMOKE, BURN, THEN BLOW UP'],
            ['', 'GET OUT WHEN IT SAYS GET OUT!'],
            ['PICKUPS', 'LEAF = HEALTH  VEST = ARMOR  GUNS = AMMO'],
            ['WATER', 'CARS SINK. SLOTHS CAN\'T SWIM. SADLY.'],
            ['CHEAT', 'PAUSE MENU: ALL WEAPONS + UNLIMITED AMMO'],
            ['', '(NOT INVINCIBLE. YOU STILL NEED TO DODGE.)']
          ] : [
            ['', 'KEYBOARD + MOUSE       XBOX PAD'],
            ['MOVE / STEER', 'WASD / ARROWS       LEFT STICK'],
            ['AIM', 'MOUSE               RIGHT STICK'],
            ['FIRE', 'LEFT CLICK / CTRL   RT (CAR: X)'],
            ['MELEE CLAW', 'RIGHT CLICK / SPACE LT'],
            ['GAS / BRAKE', 'W / S               RT / LT'],
            ['HANDBRAKE', 'SPACE               B'],
            ['ENTER/EXIT CAR', 'E (OR F)            A'],
            ['RELOAD', 'R                   X'],
            ['WEAPON', 'Q / TAB / WHEEL/1-8 LB / RB'],
            ['RADIO / HORN', 'T / H               Y / L-STICK'],
            ['PAUSE / MUTE', 'ESC / M             START']
          ];
          let y = 42;
          for (const r of rows) {
            T(r[0], 130, y, '#ffd23e', { face: 'small', align: 'right' });
            T(r[1], 140, y, '#e8e4f4', { face: 'small' });
            y += S.helpPage ? 11 : 13;
          }
          if (!S.helpPage) {
            T('NO MOUSE? FIRE SHOOTS WHERE YOU FACE, WITH A LITTLE AIM ASSIST.', G.W / 2, y + 8, '#3ef0ff', { face: 'small', align: 'center' });
            T('DRIVING + FIRING = DRIVE-BY (AIMS AT THE MOUSE OR STRAIGHT AHEAD).', G.W / 2, y + 17, '#3ef0ff', { face: 'small', align: 'center' });
          }
          T('LEFT / RIGHT: PAGE     ENTER / ESC: BACK', G.W / 2, G.H - 26, '#8a84a0', { face: 'small', align: 'center' });
        };
        if (S.helpFrom === 'pause') draw(); else G.to(G.fgc, draw);
      }
    },

    // ------------------------------------------------------------------ INTRO
    intro: {
      enter() {
        S.art = null;
        LP.Shell.view.style.cursor = 'none';
        S.lines = [
          ['narrator', 'LETHARGY CITY. 2:47 AM.'],
          ['narrator', 'A town where nobody moves fast... except the crime.'],
          ['narrator', 'Meet TWO-TOES. Small-time crook. Big-time napper. Gold chain. Even better shades.'],
          ['twotoes', "Rent's due. Mama Moss is calling. Ugh... fine. I'm up. Mostly."]
        ];
        S.li = 0; S.shown = 0;
        GameAudio.refreshMusic();
      },
      update(dt) {
        World.time += dt;
        const t = LP.States.t, z = City.zones.safehouse;
        const k = Math.min(1, t / 14);
        const e = k * k * (3 - 2 * k);
        World.ccx = LP.lerp(66 * 16, z.x - 20, e); World.ccy = LP.lerp(30 * 16, z.y + 4, e);
        World.camX = Math.round(World.ccx - G.W / 2); World.camY = Math.round(World.ccy - G.H / 2);
        if (advance(dt) || I().pressed('back')) startPlay();
      },
      render(g) {
        World.render(g);
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, G.W, G.H);
        const k = Math.min(1, LP.States.t / 1.5);
        G.g = g;
        if (LP.States.t < 6) { g.globalAlpha = Math.min(1, LP.States.t / 1.2, (6 - LP.States.t)); T('GRAND THEFT SLOTH', G.W / 2, 70, '#ffd23e', { align: 'center', outline: '#2a1040', scale: 3 }); g.globalAlpha = 1; }
        g.globalAlpha = k; dialog(g, S.lines[S.li], S.shown); g.globalAlpha = 1;
        T('ESC: SKIP', G.W - 8, 8, '#8a84a0', { face: 'small', align: 'right' });
      }
    },

    // ------------------------------------------------------------------ PLAY
    play: {
      enter(arg, prev) {
        S.art = null;
        LP.Shell.view.style.cursor = 'none';
        if (prev !== 'pause' && prev !== 'help') LP.Input.clearPresses();
        GameAudio.refreshMusic();
      },
      update(dt) {
        if (I().consume('pause')) { LP.States.go('pause'); return; }
        if (Game.invuln > 0) Game.invuln -= dt;
        World.update(dt);
        HUD.update(dt);
        GameAudio.refreshMusic();
        if (Game.pending > 0) { Game.pending -= dt; if (Game.pending <= 0 && LP.States.is('play')) LP.States.go('result'); }
      },
      render(g) { World.render(g); HUD.draw(g); if (Game.invuln > 0 && Player.ped && Math.floor(Game.invuln * 10) % 2) { /* respawn blink handled by alpha */ } }
    },

    // ------------------------------------------------------------------ BRIEFING
    brief: {
      enter(arg) {
        Game.briefData = arg;
        S.lines = arg.def.brief; S.li = 0; S.shown = 0;
        LP.Input.clearPresses();
        GameAudio.sfx('radio');
      },
      update(dt) {
        World.time += dt;
        HUD.update(dt);
        if (advance(dt) || I().pressed('back')) {
          LP.Input.clearPresses();
          LP.States.go('play');
          Game.briefData.done();
        }
      },
      render(g) {
        World.render(g); HUD.draw(g);
        g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(0, 0, G.W, G.H);
        G.g = g;
        const d = Game.briefData.def, n = Missions.list.indexOf(d) + 1;
        G.rect(0, 40, G.W, 34, 'rgba(10,6,20,0.85)');
        T('MISSION ' + n + ' OF ' + Missions.list.length, G.W / 2, 46, '#ff7ab4', { face: 'small', align: 'center' });
        T(d.title, G.W / 2, 56, '#ffd23e', { align: 'center', outline: '#000', scale: 2 });
        dialog(g, S.lines[S.li], S.shown);
        T('ESC: SKIP', G.W - 8, 8, '#8a84a0', { face: 'small', align: 'right' });
      }
    },

    // ------------------------------------------------------------------ PAUSE
    pause: {
      enter(arg) {
        LP.Shell.view.style.cursor = '';
        GameAudio.silence();
        if (arg === 'keep' && S.pm) return;
        S.pm = Menu([
          { label: 'RESUME', act: () => LP.States.go('play') },
          { label: 'RESTART MISSION', enabled: () => !!Missions.active, act: () => { LP.States.go('play'); Missions.retry(); } },
          vol('music'), vol('sfx'), muteItem, cheatItem,
          { label: () => 'RADIO: ' + GameAudio.stations[GameAudio.station], adjust: () => { GameAudio.nextStation(); } },
          { label: 'HOW TO PLAY', act: () => LP.States.go('help', 'pause') },
          { label: 'QUIT TO TITLE', act: () => LP.States.go('confirmQuit') }
        ]);
      },
      update() {
        if (I().consume('pause') || I().pressed('back')) { GameAudio.sfx('back'); LP.States.go('play'); return; }
        S.pm.update();
      },
      render(g) {
        World.render(g); HUD.draw(g);
        g.fillStyle = 'rgba(4,2,12,0.62)'; g.fillRect(0, 0, G.W, G.H);
        G.g = g;
        G.rect(G.W / 2 - 120, 60, 240, 228, 'rgba(10,6,20,0.92)'); G.frame(G.W / 2 - 120, 60, 240, 228, '#ff4fb4'); G.frame(G.W / 2 - 118, 62, 236, 224, '#3a2050');
        T('PAUSED', G.W / 2, 70, '#ff4fb4', { align: 'center', outline: '#000', scale: 2 });
        S.pm.draw(G.W / 2, 96, 19);
        const m = Missions.active ? 'ON THE JOB: ' + Missions.active.title : 'STORY: ' + Missions.done + ' / ' + Missions.list.length + ' MISSIONS';
        T(m, G.W / 2, 274, '#8a84a0', { face: 'small', align: 'center' });
        if (S.pm.items[S.pm.sel] === cheatItem) T('ALL WEAPONS + UNLIMITED AMMO. NOT INVINCIBLE.', G.W / 2, 296, '#ff7ab4', { face: 'small', align: 'center', outline: '#000' });
      }
    },
    confirmQuit: {
      enter() { S.qm = Menu([{ label: 'KEEP PLAYING', act: () => LP.States.go('pause', 'keep') }, { label: 'QUIT TO TITLE', act: () => { if (Missions.active) Missions.retryAbandon(); GameAudio.silence(); LP.States.go('title', 'menu'); } }]); },
      update() { if (I().pressed('back')) return LP.States.go('pause', 'keep'); S.qm.update(); },
      render(g) {
        World.render(g);
        g.fillStyle = 'rgba(4,2,12,0.7)'; g.fillRect(0, 0, G.W, G.H);
        G.g = g;
        G.rect(G.W / 2 - 130, 120, 260, 92, 'rgba(10,6,20,0.94)'); G.frame(G.W / 2 - 130, 120, 260, 92, '#ff4040');
        T('QUIT TO TITLE?', G.W / 2, 130, '#ffffff', { align: 'center' });
        T('PROGRESS SAVES AFTER EVERY MISSION PASSED.', G.W / 2, 145, '#c8c4d8', { face: 'small', align: 'center' });
        S.qm.draw(G.W / 2, 166, 18);
      }
    },

    // ------------------------------------------------------------------ WASTED / BUSTED
    dead: {
      enter(arg) {
        S.dk = arg.kind; S.wasMission = !!Missions.active;
        GameAudio.sfx(arg.kind === 'busted' ? 'busted' : 'wastedJ');
        Player.locked = true;
        if (arg.kind === 'busted' && Player.ped.inCar) { Player.ped.inCar.throttle = 0; }
        LP.FX.shake(4, 20);
      },
      update(dt) {
        World.update(dt * 0.45);
        if (LP.States.t > 3.6) {
          Player.locked = false;
          respawn(S.dk);
          LP.States.go('play');
          if (S.wasMission && Missions.active) Missions.fail(S.dk === 'busted' ? 'You got BUSTED.' : 'You got WASTED.');
        }
      },
      render(g) {
        World.render(g);
        const k = Math.min(1, LP.States.t / 0.8);
        g.fillStyle = S.dk === 'busted' ? 'rgba(10,20,60,' + 0.45 * k + ')' : 'rgba(60,0,0,' + 0.5 * k + ')';
        g.fillRect(0, 0, G.W, G.H);
        G.g = g;
        const col = S.dk === 'busted' ? (Math.floor(LP.States.t * 6) % 2 ? '#ff3030' : '#3a70ff') : '#ff2020';
        const sc = LP.States.t < 0.3 ? 6 - LP.States.t * 10 : 4;
        T(S.dk === 'busted' ? 'BUSTED' : 'WASTED', G.W / 2, G.H / 2 - 20, col, { align: 'center', outline: '#000', scale: Math.max(4, Math.round(sc)) });
        const sub = S.dk === 'busted' ? LP.pick.call ? ['YOU HAVE THE RIGHT TO REMAIN SLOW', 'ANYTHING YOU SAY WILL BE NAPPED ON'][Math.floor(Player.stats.busts) % 2] : '' : ['SLEEP TIGHT, TWO-TOES', 'THAT LOOKED LIKE IT HURT', 'NAP TIME... FOREVER? NAH.'][Player.stats.deaths % 3];
        if (LP.States.t > 0.8) T(sub, G.W / 2, G.H / 2 + 20, '#ffffff', { face: 'small', align: 'center', outline: '#000' });
      }
    },

    // ------------------------------------------------------------------ MISSION FAILED
    result: {
      enter() {
        LP.Shell.view.style.cursor = '';
        GameAudio.silence();
        S.rm = Menu([
          { label: 'RETRY MISSION', act: () => { LP.States.go('play'); Missions.retry(); } },
          { label: 'CARRY ON', act: () => LP.States.go('play') }
        ]);
      },
      update() { if (I().pressed('back')) return LP.States.go('play'); S.rm.update(); },
      render(g) {
        World.render(g); HUD.draw(g);
        g.fillStyle = 'rgba(30,0,10,0.55)'; g.fillRect(0, 0, G.W, G.H);
        G.g = g;
        G.rect(G.W / 2 - 120, 120, 240, 100, 'rgba(10,6,20,0.92)'); G.frame(G.W / 2 - 120, 120, 240, 100, '#ff4040');
        T('MISSION FAILED', G.W / 2, 130, '#ff4040', { align: 'center', outline: '#000', scale: 2 });
        const def = Missions.list[Missions.idx];
        if (def) T(def.title, G.W / 2, 152, '#ffd23e', { face: 'small', align: 'center' });
        S.rm.draw(G.W / 2, 170, 20);
      }
    },

    // ------------------------------------------------------------------ THE END
    ending: {
      enter() {
        LP.Shell.view.style.cursor = '';
        GameAudio.silence();
        Game.save();
        S.lines = [
          ['narrator', 'With Baron Velvet napping permanently and the HUSTLE tankers scrap, the streets of Lethargy City went quiet.'],
          ['mama', 'You did it, baby. The city is slow again. Beautifully, gloriously SLOW. Rent is forgiven. This month.'],
          ['dj', 'Club Hang Loose is back in business. Smoothies on the house. FOREVER. ...For you. Just you.'],
          ['twotoes', 'Lethargy City. My city. Time for a nap. A big one. Wake me up for the sequel.']
        ];
        S.li = 0; S.shown = 0; S.ep = 0; S.et = 0;
        GameAudio.refreshMusic();
      },
      update(dt) {
        S.et += dt;
        World.time += dt;
        if (S.ep === 0) { if (advance(dt)) { S.ep = 1; S.et = 0; S.art = drawTitleArt; } return; }
        if (S.ep === 1 && S.et > 1 && (I().pressed('confirm') || Ctl.mPress || I().pressed('back'))) { S.ep = 2; S.et = 0; S.art = null; GameAudio.sfx('select'); return; }
        if (S.ep === 2 && S.et > 1 && (I().pressed('confirm') || Ctl.mPress || I().pressed('back'))) { GameAudio.sfx('select'); LP.States.go('title', 'menu'); }
      },
      render(g) {
        G.g = g;
        if (S.ep === 0) {
          World.render(g);
          g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 0, G.W, G.H);
          dialog(g, S.lines[S.li], S.shown);
          return;
        }
        g.fillStyle = '#000'; g.fillRect(0, 0, G.W, G.H);
        if (S.ep === 1) {
          G.to(G.fgc, () => {
            G.rect(G.W / 2 - 110, 250, 220, 50, 'rgba(10,6,20,0.85)');
            T('THE END', G.W / 2, 258, '#ffd23e', { align: 'center', outline: '#000', scale: 2 });
            T('...OR IS IT? (IT IS. GO TAKE A NAP.)', G.W / 2, 282, '#ff7ab4', { face: 'small', align: 'center' });
          });
          return;
        }
        // stats + credits
        const st = Player.stats;
        G.rect(0, 0, G.W, G.H, '#0a0614');
        for (let i = 0; i < G.H; i += 4) G.rect(0, i, G.W, 1, '#120a22');
        T('CAREER OF A CRIMINAL SLOTH', G.W / 2, 24, '#ffd23e', { align: 'center', outline: '#000' });
        const t = Math.floor(st.time), tm = Math.floor(t / 3600) + 'H ' + LP.pad(Math.floor(t / 60) % 60, 2) + 'M ' + LP.pad(t % 60, 2) + 'S';
        const rows = [
          ['MISSIONS PASSED', Missions.done + ' / ' + Missions.list.length], ['MONEY EARNED', fmtMoney(st.earned)], ['CARS STOLEN', st.carsStolen], ['CARS WRECKED', st.wrecked],
          ['PEDESTRIANS FLATTENED', st.peds], ['THREE-TOES + VELVETS', st.gang], ['COPS WASTED', st.cops], ['CHOPPERS DOWNED', st.helis],
          ['HIGHEST HEAT', st.maxHeat + ' BADGES'], ['BULLETS FIRED', st.shots], ['TIMES WASTED / BUSTED', st.deaths + ' / ' + st.busts], ['TIME PLAYED', tm]
        ];
        rows.forEach((r, i) => { T(r[0], G.W / 2 - 8, 50 + i * 15, '#c8c4d8', { face: 'small', align: 'right' }); T(String(r[1]), G.W / 2 + 8, 48 + i * 15, '#ffffff'); });
        T('THANKS FOR PLAYING GRAND THEFT SLOTH', G.W / 2, 240, '#ff7ab4', { align: 'center' });
        T('LUCIDCONFUSION.GG RETRO ARCADE', G.W / 2, 256, '#3ef0ff', { face: 'small', align: 'center' });
        T('YOUR CITY STAYS OPEN: CONTINUE FROM THE TITLE TO KEEP CAUSING CHAOS.', G.W / 2, 270, '#9dff4a', { face: 'small', align: 'center' });
        g.drawImage(Art.portrait('twotoes'), G.W / 2 - 28, 282);
        if (S.et > 1) T('PRESS ENTER', G.W / 2, G.H - 12, Math.floor(S.et * 2) % 2 ? '#ffffff' : '#8a84a0', { face: 'small', align: 'center' });
      }
    }
  });

  // ------------------------------------------------------------------ dialogue (shared by intro, briefs, ending)
  function startPlay() {
    LP.Input.clearPresses();
    LP.States.go('play');
    HUD.tip('MAMA MOSS is calling! Walk into the ringing pink payphone to take the job. WASD / left stick to move.', 8);
  }
  function advance(dt) {
    const line = S.lines[S.li];
    S.shown = Math.min(line[1].length, S.shown + dt * 55);
    if (S.shown >= 2 && (I().pressed('confirm') || I().pressed('enter') || Ctl.mPress || I().pressed('fire'))) {
      if (S.shown < line[1].length) { S.shown = line[1].length; return false; }
      S.li++; S.shown = 0;
      GameAudio.sfx('menu');
      if (S.li >= S.lines.length) { S.li = S.lines.length - 1; S.shown = 999; return true; }
    }
    return false;
  }
  function dialog(g, line, shown) {
    if (!line) return;
    G.g = g;
    const who = line[0], text = line[1];
    const y = G.H - 92, x = 16, w = G.W - 32, h = 80;
    const C = Art.CHAR[who];
    const edge = C ? C.bg[1] : '#e8e4f4';
    G.rect(x, y, w, h, 'rgba(8,6,16,0.92)'); G.frame(x, y, w, h, edge); G.frame(x + 2, y + 2, w - 4, h - 4, '#241a34');
    let tx = x + 12;
    if (C) { g.drawImage(Art.portrait(who), x + 10, y + 12); tx = x + 76; T(C.name, tx, y + 10, edge, { outline: '#000' }); }
    else T('', tx, y + 10, '#fff');
    const lines = G.wrap(text.toUpperCase().slice(0, Math.floor(shown)), w - (tx - x) - 14, 'small');
    lines.forEach((l, i) => T(l, tx, y + (C ? 26 : 14) + i * 9, C ? '#f0ecf8' : '#ffd23e', { face: 'small' }));
    if (shown >= text.length && Math.floor(LP.Loop.time * 3) % 2) T('>', x + w - 14, y + h - 14, '#ff4fb4');
  }
  Missions.retryAbandon = function () { /* quitting mid-mission just ends the session: progress is the last save */ };
  return S;
})();
