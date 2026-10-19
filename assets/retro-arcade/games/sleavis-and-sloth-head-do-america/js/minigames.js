/* MINI-GAMES — short, stupid, and drawn mostly in the pixel layer over a 3D shot the
   segment sets up. MiniGames.start(name, cfg) -> instance; instance.result is set when done
   ('win' | { fail, msg } | any value the script wants, e.g. { score }). */
'use strict';
const MiniGames = (function () {
  const MG = { cur: null, defs: {} };
  const I = () => LP.Input;
  const T = (s, x, y, c, o) => Font.draw(G.g, s, x, y, c, o);
  MG.start = function (name, cfg) {
    const d = MG.defs[name];
    const m = Object.create(d); m.cfg = cfg; m.result = null; m.t = 0; m.name = name;
    MG.cur = m;
    if (m.enter) m.enter(cfg);
    LP.Input.clearPresses();
    return m;
  };
  MG.stop = function () { if (MG.cur && MG.cur.exit) MG.cur.exit(); MG.cur = null; };
  MG.update = function (dt, blocked) { const m = MG.cur; if (!m || m.result !== null || blocked) return; m.t += dt; m.update(dt); };
  MG.draw = function () { if (MG.cur && MG.cur.draw) MG.cur.draw(); };
  const hero = (id) => Game.hero(id);
  function title(text, sub) {
    G.rect(0, 6, G.W, 22, 'rgba(0,0,0,0.7)');
    T(text, G.W / 2, 9, '#ffd23e', { align: 'center', outline: '#3a1000' });
    if (sub) T(sub, G.W / 2, 19, '#c8c4d8', { face: 'small', align: 'center' });
  }
  function instr(text) { const w = Font.width(text, 'small') + 12; G.rect(G.W / 2 - w / 2, G.H - 14, w, 11, 'rgba(0,0,0,0.75)'); T(text, G.W / 2, G.H - 11, '#ffffff', { face: 'small', align: 'center' }); }
  const sub = (s) => s.replace(/\{(\w+)\}/g, (m, a) => HUD.btn(a));

  // ==================================================================== COUCH DIVE
  MG.defs.couch = {
    enter(cfg) {
      this.time = cfg.time || 25; this.money = 0; this.items = []; this.spawnT = 0; this.found = []; this.msg = null; this.msgT = 0; this.goal = cfg.goal || 2.5;
      this.digger = hero(cfg.who || 'sleavis');
      this.digger.pose('mash');
    },
    update(dt) {
      this.time -= dt;
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        this.spawnT = LP.rand(0.35, 0.7);
        const r = Math.random();
        const it = r < 0.22 ? { name: 'QUARTER', v: 0.25, col: '#d0d0d8' } : r < 0.36 ? { name: 'DIME', v: 0.1, col: '#c0c0c8' } : r < 0.46 ? { name: 'PENNY', v: 0.01, col: '#c07040' } : r < 0.5 ? { name: 'A DOLLAR!', v: 1, col: '#50c050' } :
          LP.pick([{ name: 'PETRIFIED NACHO', gross: 'Heh heh. Still crunchy.' }, { name: 'TOENAIL (NOT OURS)', gross: 'Whose is this? ...Heh heh. Keep it.' }, { name: 'A MOUSE (ALIVE)', gross: 'AAAH! It looked at me! Heh heh. Cool.' }, { name: 'USED BAND-AID', gross: 'It\'s still sticky. Heh heh heh.' }, { name: 'TV GUIDE, MAY 1997', gross: 'Ooh! What\'s on? ...Nothing. It\'s old.' }, { name: 'SOMEBODY\'S RETAINER', gross: 'Uh huh huh. That\'s Stewart\'s.' }, { name: 'HALF A HOT DOG', gross: 'Lunch! Heh heh heh.' }, { name: 'A SOCK. CRUNCHY.', gross: 'Why is it crunchy, Slutt-Head?' }]);
        it.x = LP.rand(40, 160); it.y = 300; it.vy = LP.rand(55, 95);
        this.items.push(it);
      }
      for (const it of this.items) it.y -= it.vy * dt;
      LP.prune(this.items, (it) => it.y < 70 || it.got);
      if (I().pressed('jump') || I().pressed('confirm') || I().pressed('punch') || I().pressed('use')) {
        // grab whatever's in the hand zone (y 150..190)
        let best = null; for (const it of this.items) if (it.y > 140 && it.y < 200 && (!best || Math.abs(it.y - 170) < Math.abs(best.y - 170))) best = it;
        GameAudio.sfx('whoosh');
        if (best) {
          best.got = true;
          if (best.v) { this.money += best.v; GameAudio.sfx('coin'); this.found.push(best.name); }
          else { this.msg = best.gross; this.msgT = 2.4; this.time -= 1.5; GameAudio.sfx('splat'); HUD.bark(this.digger.id, best.gross); }
        }
      }
      if (this.msgT > 0) this.msgT -= dt;
      if (this.time <= 0 || this.money >= this.goal + 0.75) {
        this.digger.pose(null);
        this.result = this.money >= this.goal ? { money: Math.round(this.money * 100) / 100 } : { fail: true, msg: 'You found $' + this.money.toFixed(2) + ' and a petrified nacho. Not enough for batteries. Not enough for anything.' };
      }
    },
    draw() {
      title('COUCH DIVE', 'FIND $' + this.goal.toFixed(2) + ' IN THE CUSHIONS. DON\'T THINK ABOUT IT.');
      // the abyss
      HUD.panel(30, 60, 150, 250, '#c08a50', 'rgba(40,24,12,0.92)');
      for (let y = 66; y < 305; y += 9) G.rect(36, y, 138, 1, 'rgba(255,200,120,0.06)');
      G.rect(32, 160, 146, 20, 'rgba(255,230,120,0.18)'); G.frame(32, 160, 146, 20, '#ffe040');
      T('GRAB ZONE', 105, 152, '#ffe040', { face: 'small', align: 'center' });
      for (const it of this.items) {
        if (it.y < 64 || it.y > 304) continue;
        const col = it.v ? it.col : '#a0b060';
        if (it.v) G.disc(it.x, it.y, 5, col); else G.rect(it.x - 5, it.y - 4, 10, 8, col);
        T(it.name, Math.min(170, it.x + 8), it.y - 2, it.v ? '#ffffff' : '#c0d080', { face: 'small', outline: '#000' });
      }
      T('$' + this.money.toFixed(2), G.W - 20, 60, this.money >= this.goal ? '#60ff60' : '#ffffff', { align: 'right', outline: '#000', scale: 2 });
      T('TIME ' + Math.max(0, Math.ceil(this.time)), G.W - 20, 84, this.time < 6 ? '#ff4040' : '#ffffff', { align: 'right', outline: '#000' });
      instr(sub('{jump}: GRAB'));
    }
  };

  // ==================================================================== GAS PUMP: exactly $10.00
  MG.defs.pump = {
    enter(cfg) { this.tries = 3; this.amt = 0; this.rate = 0; this.state = 'ready'; this.best = 99; this.lines = []; this.waitT = 0; hero(cfg.who || 'slothhead').pose('mash'); },
    update(dt) {
      const held = I().held('jump') || I().held('confirm') || I().held('punch') || I().held('gas');
      if (this.state === 'ready' && held) { this.state = 'pumping'; this.amt = 0; this.rate = 0.6; }
      if (this.state === 'pumping') {
        if (held) { this.rate = Math.min(9, this.rate + dt * 5.5); this.amt += this.rate * dt; if (Math.floor(this.amt * 10) !== Math.floor((this.amt - this.rate * dt) * 10)) GameAudio.sfx('pump'); }
        else {
          this.state = 'done'; this.tries--; this.waitT = 1.6;
          const off = Math.abs(this.amt - 10);
          this.best = Math.min(this.best, off);
          GameAudio.sfx(off <= 0.1 ? 'ding' : 'buzzer');
          const who = LP.pick(['sleavis', 'slothhead']);
          if (off <= 0.1) HUD.bark('slothhead', 'Uh huh huh. Ten bucks. I am like, a genius.');
          else if (this.amt < 10) HUD.bark(who, who === 'sleavis' ? 'Heh heh. Little short. That\'s what SHE said.' : 'Uh huh huh. Premature. Uh huh huh.');
          else HUD.bark(who, who === 'sleavis' ? 'Heh heh. Too much. It\'s all over the shoes now.' : 'Uhh... it keeps going. Uh huh huh. It won\'t stop.');
        }
      }
      if (this.state === 'done') { this.waitT -= dt; if (this.waitT <= 0) { if (this.best <= 0.1 || this.tries <= 0) { hero(this.cfg.who || 'slothhead').pose(null); this.result = { exact: this.best <= 0.1, best: this.best }; } else this.state = 'ready'; } }
    },
    draw() {
      title('PUMP EXACTLY $10.00', 'HOLD TO PUMP. LET GO AT TEN. IT SPEEDS UP. LIKE LIFE.');
      HUD.panel(G.W / 2 - 90, 70, 180, 92, '#e04040', 'rgba(20,24,20,0.92)');
      T('$' + this.amt.toFixed(2), G.W / 2, 92, Math.abs(this.amt - 10) <= 0.1 && this.state !== 'pumping' ? '#60ff60' : '#80ff80', { align: 'center', scale: 3 });
      T('GALLONS ' + (this.amt / 1.19).toFixed(3), G.W / 2, 126, '#60a060', { face: 'small', align: 'center' });
      T('TRIES LEFT: ' + this.tries, G.W / 2, 140, '#ffffff', { face: 'small', align: 'center' });
      instr(sub(this.state === 'pumping' ? 'LET GO AT $10.00!' : 'HOLD {jump} TO PUMP'));
    }
  };

  // ==================================================================== PLUNGER
  MG.defs.plunger = {
    enter(cfg) { this.level = 0.25; this.good = 0; this.need = cfg.need || 6; this.n = 0; this.dir = 1; this.speed = 1.1; this.flash = 0; this.lastMsg = 0; this.who = hero(cfg.who || 'sleavis'); this.who.pose('mash'); },
    update(dt) {
      this.n += this.dir * this.speed * dt;
      if (this.n > 1) { this.n = 1; this.dir = -1; } if (this.n < 0) { this.n = 0; this.dir = 1; }
      this.level += dt * (0.035 + this.good * 0.006);
      if (this.flash > 0) this.flash -= dt;
      if (I().pressed('jump') || I().pressed('punch') || I().pressed('confirm')) {
        const ok = Math.abs(this.n - 0.5) < 0.12;
        GameAudio.sfx('plunge');
        this.who.vis.setAnim('mash', { restart: true });
        if (ok) { this.good++; this.level = Math.max(0, this.level - 0.16); this.flash = 0.3; this.speed += 0.18; HUD.popup(this.who.vis.headWorld(), LP.pick(['SHLORP', 'GLORK', 'PLOONK', 'SCHLUCK']), '#80c0ff'); }
        else { this.level += 0.1; GameAudio.sfx('splat'); HUD.popup(this.who.vis.headWorld(), 'SPLOOSH', '#a08030'); if (LP.Loop.time - this.lastMsg > 3) { this.lastMsg = LP.Loop.time; HUD.bark(LP.pick(['sleavis', 'slothhead']), LP.pick(['It\'s on my FACE! Heh heh. It\'s warm!', 'Uh huh huh. You got toilet on you.', 'This is the worst day of my life. Heh heh. Cool.'])); } }
      }
      if (this.good >= this.need) { GameAudio.sfx('flush'); this.who.pose(null); this.result = 'win'; }
      else if (this.level >= 1) { this.who.pose(null); this.result = { fail: true, msg: 'The toilet won. The toilet usually wins. Room 6 is now a pond.' }; }
    },
    draw() {
      title('UNCLOG IT!', 'PLUNGE WHEN THE NEEDLE HITS THE GREEN. DO NOT LOOK DOWN.');
      HUD.panel(20, 60, 60, 220, '#80a0c0', 'rgba(10,14,20,0.9)');
      const h = 200 * LP.clamp(this.level, 0, 1);
      G.rect(26, 274 - h, 48, h, '#8a7a30'); G.rect(26, 274 - h, 48, 2, '#c0b060');
      T('BOWL', 50, 64, '#ffffff', { face: 'small', align: 'center' });
      G.rect(26, 74, 48, 2, '#ff3030');
      // timing gauge
      const gx = 120, gw = 240, gy = 300;
      G.rect(gx, gy, gw, 12, '#2a2a2a'); G.rect(gx + gw * 0.38, gy, gw * 0.24, 12, this.flash > 0 ? '#a0ffa0' : '#30a030');
      G.rect(gx + gw * this.n - 2, gy - 4, 4, 20, '#ffffff');
      T('PLUNGES ' + this.good + ' / ' + this.need, G.W - 20, 60, '#ffffff', { align: 'right', outline: '#000' });
      instr(sub('{jump}: PLUNGE'));
    }
  };

  // ==================================================================== VENDING MACHINE SHAKE
  MG.defs.vending = {
    enter(cfg) { this.n = 0; this.dir = 1; this.shakes = 0; this.over = 0; this.tilt = 0; this.who = hero(cfg.who || 'sleavis'); this.who.pose('mash'); this.mesh = cfg.mesh; },
    update(dt) {
      this.n += this.dir * 1.4 * dt; if (this.n > 1) { this.n = 1; this.dir = -1; } if (this.n < 0) { this.n = 0; this.dir = 1; }
      this.tilt *= Math.pow(0.05, dt);
      if (this.mesh) this.mesh.rotation.z = this.tilt;
      if (I().pressed('jump') || I().pressed('punch')) {
        GameAudio.sfx('thud');
        if (this.n > 0.92) { this.over++; this.tilt = 0.35; HUD.bark('slothhead', LP.pick(['Whoa whoa WHOA. Easy, dumbass!', 'It\'s gonna fall on you! Uh huh huh. Do it again.'])); if (this.over >= 3) { this.result = { fail: true, msg: 'The vending machine fell on Sleavis. He is fine. He is flat, but fine.' }; GameAudio.sfx('crash'); } }
        else if (this.n > 0.62) { this.shakes++; this.tilt = 0.18; HUD.popup(this.who.vis.headWorld(), 'RATTLE', '#ffe040'); if (this.shakes >= 4) { GameAudio.sfx('vend'); this.who.pose(null); this.result = 'win'; } }
        else { this.tilt = 0.05; HUD.popup(this.who.vis.headWorld(), 'tap', '#a0a0a0'); }
      }
    },
    draw() {
      title('SHAKE THE MACHINE', 'HIT IT HARD — BUT NOT TOO HARD. THREE STRIKES AND IT FALLS ON YOU.');
      const gx = 120, gw = 240, gy = 300;
      G.rect(gx, gy, gw, 12, '#2a2a2a'); G.rect(gx + gw * 0.62, gy, gw * 0.3, 12, '#30a030'); G.rect(gx + gw * 0.92, gy, gw * 0.08, 12, '#c02020');
      G.rect(gx + gw * this.n - 2, gy - 4, 4, 20, '#ffffff');
      T('RATTLES ' + this.shakes + '/4   WOBBLES ' + this.over + '/3', G.W / 2, gy - 16, '#ffffff', { face: 'small', align: 'center', outline: '#000' });
      instr(sub('{jump}: SHAKE'));
    }
  };

  // ==================================================================== CHILI CONTEST
  MG.defs.chili = {
    enter(cfg) { this.me = 0; this.foe = 0; this.need = 24; this.heat = 0; this.milk = 3; this.foeRate = cfg.foeRate || 1.7; this.foeName = cfg.foeName || 'EARL'; this.who = hero(cfg.who || 'sleavis'); this.who.pose('eat'); this.burpT = 3; this.foeActor = cfg.foe; },
    update(dt) {
      this.foe += this.foeRate * dt;
      this.heat = Math.max(0, this.heat - dt * 0.05);
      if (I().pressed('jump') || I().pressed('punch') || I().pressed('confirm')) { this.me++; this.heat += 0.055; GameAudio.sfx('eat'); this.who.vis.setAnim('eat', { restart: true }); }
      if (I().pressed('use') && this.milk > 0) { this.milk--; this.heat = Math.max(0, this.heat - 0.5); GameAudio.sfx('slurp'); HUD.bark(this.who.id, this.who.id === 'sleavis' ? 'MILK! Heh heh! It\'s like... cow juice!' : 'Uhh, milk. Uh huh huh. Udders.'); }
      this.burpT -= dt; if (this.burpT <= 0) { this.burpT = LP.rand(3, 6); GameAudio.sfx('burp'); }
      if (this.heat >= 1) { GameAudio.sfx('puke'); Game.stats.pukes++; FX3.burst(this.who.vis.headWorld(), 26, { colors: ['#a0a030', '#c08020', '#806010'], speed: 4, up: 2, size: 0.1 }); this.who.pose(null); this.result = { fail: true, msg: 'You blew chunks all over the Burn Ward Chili Challenge trophy. They\'re keeping it that way.' }; return; }
      if (this.me >= this.need) { this.who.pose('cheer'); this.result = 'win'; }
      else if (this.foe >= this.need) { this.who.pose(null); this.result = { fail: true, msg: this.foeName + ' finished first and then ate YOUR bowl too. He\'s not even sweating.' }; }
    },
    draw() {
      title('BURN WARD CHILI CHALLENGE', 'MASH TO EAT. CHUG MILK BEFORE YOUR FACE MELTS.');
      HUD.panel(16, 60, 150, 70, '#ff6020');
      T(this.who.name, 24, 66, '#ffd23e', { face: 'small' });
      HUD.bar(24, 78, 134, 7, this.me / this.need, '#e0a030');
      T('HEAT', 24, 92, '#ff8080', { face: 'small' });
      HUD.bar(24, 102, 134, 7, this.heat, this.heat > 0.75 ? (Math.floor(this.t * 10) % 2 ? '#ff2020' : '#ffff40') : '#ff6020');
      T('MILK x' + this.milk, 24, 116, '#ffffff', { face: 'small' });
      HUD.panel(G.W - 166, 60, 150, 40, '#a0a0a0');
      T(this.foeName, G.W - 158, 66, '#e0e0e0', { face: 'small' });
      HUD.bar(G.W - 158, 78, 134, 7, this.foe / this.need, '#a08060');
      instr(sub('{jump}: EAT    {use}: CHUG MILK'));
    }
  };

  // ==================================================================== ARCADE: SLOTH INVADERS (bootleg)
  MG.defs.arcade = {
    enter(cfg) {
      this.px = 240; this.shots = []; this.bombs = []; this.score = 0; this.time = cfg.time || 35; this.lives = 3; this.cd = 0; this.dx = 20; this.goal = cfg.goal || 1500;
      this.inv = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) this.inv.push({ x: 120 + c * 32, y: 70 + r * 22, alive: true, kind: r });
      this.ix = 0; this.iy = 0; this.waves = 1;
      hero(cfg.who || 'sleavis').pose('mash');
    },
    update(dt) {
      this.time -= dt;
      const mv = (I().held('right') ? 1 : 0) - (I().held('left') ? 1 : 0) || Ctl.lx;
      this.px = LP.clamp(this.px + mv * 200 * dt, 70, 410);
      if (this.cd > 0) this.cd -= dt;
      if ((I().held('jump') || I().held('punch')) && this.cd <= 0) { this.shots.push({ x: this.px, y: 300 }); this.cd = 0.28; GameAudio.sfx('menu'); }
      for (const s of this.shots) s.y -= 300 * dt;
      LP.prune(this.shots, (s) => s.y < 50 || s.dead);
      this.ix += this.dx * dt;
      const alive = this.inv.filter((i) => i.alive);
      const minx = Math.min(...alive.map((i) => i.x)) + this.ix, maxx = Math.max(...alive.map((i) => i.x)) + this.ix;
      if (maxx > 420 && this.dx > 0 || minx < 60 && this.dx < 0) { this.dx *= -1.08; this.iy += 8; }
      for (const s of this.shots) for (const i of alive) if (!s.dead && Math.abs(s.x - (i.x + this.ix)) < 11 && Math.abs(s.y - (i.y + this.iy)) < 9) { s.dead = true; i.alive = false; this.score += (4 - i.kind) * 50; GameAudio.sfx('hit'); }
      if (alive.length && Math.random() < dt * (1.2 + this.waves * 0.4)) { const s = LP.pick(alive); this.bombs.push({ x: s.x + this.ix, y: s.y + this.iy }); }
      for (const b of this.bombs) b.y += 120 * dt;
      LP.prune(this.bombs, (b) => { if (b.y > 296 && b.y < 312 && Math.abs(b.x - this.px) < 10) { this.lives--; GameAudio.sfx('miss'); HUD.bark('sleavis', LP.pick(['NO! Heh heh. It\'s rigged!', 'This game sucks! Heh heh. Again!'])); return true; } return b.y > 320; });
      if (!this.inv.some((i) => i.alive)) { this.waves++; this.inv.forEach((i) => { i.alive = true; }); this.iy = 0; this.ix = 0; this.dx = 20 + this.waves * 10; }
      if (this.iy > 180) this.lives = 0;
      if (this.lives <= 0 || this.time <= 0) {
        hero(this.cfg.who || 'sleavis').pose(null);
        this.result = this.score >= this.goal ? { score: this.score } : { fail: true, msg: 'GAME OVER. Score: ' + this.score + '. The machine laughed at you. Out loud. It has a speaker.' };
      }
    },
    draw() {
      G.rect(50, 40, 380, 290, '#05040c'); G.frame(50, 40, 380, 290, '#ff40c0'); G.frame(52, 42, 376, 286, '#401040');
      T('SLOTH INVADERS 2000', G.W / 2, 46, '#ff40c0', { align: 'center' });
      T('SCORE ' + this.score + '   GOAL ' + this.goal + '   LIVES ' + this.lives + '   TIME ' + Math.max(0, Math.ceil(this.time)), G.W / 2, 58, '#ffffff', { face: 'small', align: 'center' });
      for (const i of this.inv) if (i.alive) {
        const x = i.x + this.ix, y = i.y + this.iy, f = Math.floor(this.t * 3) % 2;
        // tiny burgers. the invaders are burgers. don't ask.
        G.rect(x - 8, y - 5, 16, 4, '#c08030'); G.rect(x - 8, y - 1, 16, 2, '#40a030'); G.rect(x - 8, y + 1, 16, 3, '#6a3010'); G.rect(x - 8, y + 4, 16, 2, '#c08030');
        G.rect(x - 9 - f, y + 2, 2, 3, '#c08030'); G.rect(x + 7 + f, y + 2, 2, 3, '#c08030');
      }
      for (const s of this.shots) G.rect(s.x - 1, s.y - 4, 2, 6, '#ffff60');
      for (const b of this.bombs) G.rect(b.x - 2, b.y - 2, 4, 5, '#ff4040');
      // the sloth cannon
      G.rect(this.px - 9, 300, 18, 8, '#8a6a4a'); G.rect(this.px - 3, 294, 6, 6, '#8a6a4a'); G.rect(this.px - 6, 303, 3, 2, '#000'); G.rect(this.px + 3, 303, 3, 2, '#000');
      G.rect(50, 312, 380, 1, '#40ff40');
      instr(sub('LEFT/RIGHT: MOVE    {jump}: SHOOT'));
    }
  };

  // ==================================================================== RHYTHM: AIR GUITAR HERO
  // 4 lanes: LEFT DOWN UP RIGHT. Chart = notes on 8th-note grid of the 'boogie' song (120 BPM).
  const LANES = ['left', 'down', 'up', 'right'];
  const LANEC = ['#ff4040', '#40c0ff', '#40ff60', '#ffe040'];
  const ARROW = ['<', 'V', '^', '>'];
  MG.defs.rhythm = {
    enter(cfg) {
      this.bpm = 120; this.spb = 60 / this.bpm;
      const bars = cfg.bars || 24;
      // deterministic chart: follows the riff accents, gets busier
      const r = RNG(cfg.seed || 77);
      this.notes = [];
      for (let b = 2; b < bars; b++) {
        const dens = b < 8 ? 0.35 : b < 16 ? 0.5 : 0.65;
        for (let e = 0; e < 8; e++) {
          const strong = e % 2 === 0;
          if (r() < (strong ? dens + 0.25 : dens * 0.6)) this.notes.push({ t: (b * 8 + e) * this.spb / 2, lane: (e * 3 + b + (r() < 0.4 ? 1 : 0)) % 4, hit: 0 });
        }
      }
      this.len = bars * 4 * this.spb;
      this.crowd = 0.6; this.combo = 0; this.best = 0; this.hits = 0; this.misses = 0; this.judge = null; this.judgeT = 0;
      this.useAudio = !!(LP.Audio.ctx && LP.Audio.ctx.state === 'running');
      GameAudio.music('silence'); GameAudio.silence();
      GameAudio.music('boogie');
      this.t0 = this.useAudio ? LP.Audio.ctx.currentTime + 0.06 : 0;
      this.clock = 0;
      this.players = (cfg.players || ['sleavis', 'slothhead']).map(hero);
      this.players[0] && this.players[0].pose('guitar');
      this.players[1] && this.players[1].pose('headbang');
      this.crowdActors = cfg.crowd || [];
    },
    exit() { GameAudio.music(this.cfg.after || null); },
    now() { return this.useAudio ? LP.Audio.ctx.currentTime - this.t0 : this.clock; },
    update(dt) {
      this.clock += dt;
      const now = this.now();
      if (this.judgeT > 0) this.judgeT -= dt;
      for (let l = 0; l < 4; l++) if (I().pressed(LANES[l])) {
        let best = null, bd = 0.16;
        for (const n of this.notes) if (!n.hit && n.lane === l && Math.abs(n.t - now) < bd) { bd = Math.abs(n.t - now); best = n; }
        if (best) {
          best.hit = 1; this.hits++; this.combo++; this.best = Math.max(this.best, this.combo);
          this.crowd = Math.min(1, this.crowd + 0.035);
          this.judge = bd < 0.06 ? 'SICK!' : bd < 0.11 ? 'RAD' : 'OK'; this.judgeT = 0.4;
          if (this.combo % 10 === 0) { HUD.bark(LP.pick(['sleavis', 'slothhead']), LP.pick(['Heh heh! We RULE!', 'Uh huh huh. Yeah. YEAH.', 'This is the greatest moment of my life! Heh heh!', 'Uh huh huh. Chicks dig it.'])); GameAudio.sfx('cheer'); }
        } else { this.crowd -= 0.03; this.combo = 0; GameAudio.sfx('miss'); this.judge = 'WHIFF'; this.judgeT = 0.4; }
      }
      for (const n of this.notes) if (!n.hit && now - n.t > 0.18) { n.hit = -1; this.misses++; this.combo = 0; this.crowd -= 0.06; this.judge = 'MISS'; this.judgeT = 0.4; if (Math.random() < 0.3) GameAudio.sfx('boo'); }
      this.crowd = LP.clamp(this.crowd, 0, 1);
      for (const a of this.crowdActors) a.pose(this.crowd > 0.5 ? 'cheer' : this.crowd > 0.25 ? 'idle' : 'shrug');
      if (this.crowd <= 0) { this.players.forEach((p) => p && p.pose(null)); this.result = { fail: true, msg: this.cfg.failMsg || 'Booed off stage. Somebody threw a full beer. Sleavis drank it. Still booed.' }; return; }
      if (now >= this.len + 0.5) { this.players.forEach((p) => p && p.pose('cheer')); this.result = { score: this.hits, best: this.best, crowd: this.crowd }; }
    },
    draw() {
      const now = this.now();
      title(this.cfg.title || 'AIR GUITAR HERO', '"SLOTH BUTT BOOGIE" — HIT THE ARROWS ON THE LINE');
      const x0 = G.W - 160, lw = 35, hitY = 300;
      G.rect(x0 - 4, 40, lw * 4 + 8, 290, 'rgba(0,0,0,0.6)');
      for (let l = 0; l < 4; l++) {
        G.rect(x0 + l * lw + lw / 2, 40, 1, 290, 'rgba(255,255,255,0.15)');
        const held = I().held(LANES[l]);
        G.rect(x0 + l * lw + 4, hitY - 6, lw - 8, 12, held ? LANEC[l] : 'rgba(255,255,255,0.15)');
        T(ARROW[l], x0 + l * lw + lw / 2, hitY - 3, held ? '#000' : LANEC[l], { align: 'center' });
      }
      for (const n of this.notes) {
        if (n.hit === 1) continue;
        const y = hitY - (n.t - now) * 170;
        if (y < 40 || y > 330) continue;
        const x = x0 + n.lane * lw + lw / 2;
        G.rect(x - 12, y - 5, 24, 10, n.hit === -1 ? '#404040' : LANEC[n.lane]);
        T(ARROW[n.lane], x, y - 3, '#000', { align: 'center' });
      }
      if (this.judgeT > 0) T(this.judge, x0 + 70, 250, this.judge === 'MISS' || this.judge === 'WHIFF' ? '#ff4040' : '#ffff60', { align: 'center', outline: '#000', scale: 2 });
      if (this.combo > 2) T(this.combo + ' COMBO', x0 + 70, 272, '#ffffff', { align: 'center', outline: '#000' });
      T('CROWD', 20, 60, '#ffffff', { face: 'small', outline: '#000' });
      HUD.bar(20, 70, 90, 8, this.crowd, this.crowd < 0.25 ? '#ff3030' : this.crowd < 0.5 ? '#ffb030' : '#40e040');
      T(this.crowd < 0.25 ? 'BOTTLES INCOMING' : this.crowd > 0.75 ? 'ROCKING' : 'MEH', 20, 84, '#c0c0c0', { face: 'small', outline: '#000' });
      HUD.bar(20, 110, 90, 6, Math.min(1, now / this.len), '#40c0ff', 'SONG');
      instr('ARROWS / D-PAD / WASD: PLAY');
    }
  };

  // ==================================================================== HITCHHIKING
  const DRIVERS = [
    { who: 'GRANNY', want: 'thumb', hint: 'LIKES POLITE YOUNG MEN', look: 'granny' },
    { who: 'HIPPIE', want: 'dance', hint: 'FEELS THE VIBES, MAN', look: 'hippie' },
    { who: 'SOCCER MOM', want: 'thumb', hint: 'WILL CALL THE COPS', look: 'tourist' },
    { who: 'BODYBUILDER', want: 'flex', hint: 'RESPECTS THE GUNS', look: 'biker' },
    { who: 'LONELY TRUCKER', want: 'leg', hint: 'HAS BEEN ON THE ROAD... A WHILE', look: 'trucker' }
  ];
  const POSES = { left: 'thumb', up: 'flex', right: 'dance', down: 'leg' };
  const POSEN = { thumb: 'THUMB', flex: 'FLEX', dance: 'BOOGIE', leg: 'SHOW SOME LEG' };
  MG.defs.hitch = {
    enter(cfg) {
      this.queue = [0, 1, 3, 2, 4].map((i) => DRIVERS[i]); this.ci = 0; this.car = null; this.pose = null; this.wait = 1; this.splashed = 0; this.ok = 0;
      this.stand = hero(cfg.who || 'slothhead'); this.other = hero(this.stand.id === 'sleavis' ? 'slothhead' : 'sleavis');
      this.road = cfg.roadZ || 0; this.rx = cfg.roadX || 3;
    },
    exit() { if (this.car) Stage.cur.root.remove(this.car.m); this.stand.pose(null); },
    spawn() {
      const d = this.queue[this.ci % this.queue.length];
      const m = d.look === 'trucker' ? Props.semi(Stage.cur.root, this.rx, -80, 0, { color: '#c03030', logo: true }) : Props.car(Stage.cur.root, this.rx, -80, 0);
      const drv = Npc.make(d.look); drv.root.position.set(d.look === 'trucker' ? -0.5 : -0.4, d.look === 'trucker' ? 1.3 : 0.25, d.look === 'trucker' ? 4.2 : -0.1); drv.setAnim('drive'); m.add(drv.root);
      this.car = { m, d, z: -80, v: 20, stopping: false, drv };
    },
    update(dt) {
      for (const k in POSES) if (I().pressed(k)) { this.pose = POSES[k]; this.stand.pose(this.pose === 'leg' ? 'thumb' : this.pose === 'dance' ? 'dance' : this.pose === 'flex' ? 'flex' : 'thumb'); if (this.pose === 'leg') { this.stand.vis.setAnim('kick', { restart: true }); } GameAudio.sfx('whoosh'); }
      if (!this.car) { this.wait -= dt; if (this.wait <= 0) this.spawn(); return; }
      const c = this.car;
      c.drv.update(dt);
      if (!c.decided && c.z > -14) {
        c.decided = true;
        const good = this.pose === c.d.want;
        if (good) { c.stopping = true; GameAudio.sfx('horn'); }
        else {
          this.splashed++;
          setTimeout(() => { GameAudio.sfx('splat'); FX3.burst(new THREE.Vector3(this.stand.x, 0.5, this.stand.z), 18, { colors: ['#6a5a3a', '#4a3a2a'], speed: 4, up: 3 }); }, 600);
          HUD.bark(this.other.id, LP.pick(this.other.id === 'sleavis' ? ['Heh heh. They splashed you. You look like a turd.', 'Wrong move, Slutt-Head. Heh heh.'] : ['Uh huh huh. You suck at this.', 'Nice going, dumbass.']));
        }
      }
      if (c.stopping) { c.v = Math.max(0, c.v - dt * 14); }
      c.z += c.v * dt;
      c.m.position.z = c.z;
      if (c.stopping && c.v <= 0) {
        if (c.d.look === 'trucker') { this.result = { splashed: this.splashed }; return; }
        this.ok++;
        HUD.bark('slothhead', LP.pick(['Uh huh huh. It works. Not THIS car though. Next!', 'See? I\'m irresistible. But we\'re waiting for a BIG ride.']));
        c.stopping = false; c.v = 8; c.leaving = true;
      }
      if (c.leaving) c.v = Math.min(22, c.v + dt * 10);
      if (c.z > 60) { Stage.cur.root.remove(c.m); this.car = null; this.ci++; this.wait = 0.8; }
    },
    draw() {
      title('HITCHHIKE TO OKLAHOMA', 'READ THE DRIVER. STRIKE THE RIGHT POSE BEFORE THEY PASS.');
      HUD.panel(14, 50, 160, 80, '#ffe040');
      T('POSES', 22, 56, '#ffe040', { face: 'small' });
      const pz = [['LEFT', 'thumb'], ['UP', 'flex'], ['RIGHT', 'dance'], ['DOWN', 'leg']];
      pz.forEach((p, i) => T(p[0] + ': ' + POSEN[p[1]], 22, 68 + i * 12, this.pose === p[1] ? '#60ff60' : '#ffffff', { face: 'small' }));
      if (this.car) {
        const d = this.car.d;
        const s = Stage.toScreen(new THREE.Vector3(this.rx, 4.5, this.car.z));
        if (s[2]) { const w = Font.width(d.hint, 'small') + 12; G.rect(s[0] - w / 2, s[1] - 16, w, 22, 'rgba(0,0,0,0.8)'); T(d.who, s[0], s[1] - 13, '#ffe040', { face: 'small', align: 'center' }); T(d.hint, s[0], s[1] - 4, '#ffffff', { face: 'small', align: 'center' }); }
      }
      T('SPLASHED: ' + this.splashed, G.W - 16, 56, '#a08060', { face: 'small', align: 'right', outline: '#000' });
      instr('LEFT / UP / RIGHT / DOWN: POSE');
    }
  };

  // ==================================================================== SLOTS
  const SYM = ['SLOTH', 'CHERRY', 'BAR', '7', 'BRA', 'SKULL'];
  const SYMC = ['#c08a50', '#e02040', '#e0e0e0', '#ffe040', '#ff80c0', '#a0a0a0'];
  MG.defs.slots = {
    enter(cfg) { this.tokens = cfg.tokens || 6; this.reels = [0, 0, 0]; this.spin = [false, false, false]; this.stopAt = 0; this.state = 'ready'; this.msg = ''; this.wins = 0; this.jackpot = false; this.rig = cfg.rig || 0; },
    update(dt) {
      const press = I().pressed('jump') || I().pressed('confirm') || I().pressed('punch');
      if (this.state === 'ready' && press) {
        if (this.tokens <= 0) { this.result = { jackpot: false, wins: this.wins }; return; }
        this.tokens--; this.spin = [true, true, true]; this.stopAt = 0; this.state = 'spin'; GameAudio.sfx('coin'); this.msg = ''; return;
      }
      if (this.state === 'spin') {
        for (let i = 0; i < 3; i++) if (this.spin[i]) { this.reels[i] = (this.reels[i] + dt * (9 + i * 2)) % SYM.length; if (Math.random() < dt * 20) GameAudio.sfx('reel'); }
        if (press) {
          const i = this.stopAt;
          // the machine is rigged... in YOUR favour, after a while (Deke wants you here)
          let s = Math.floor(this.reels[i] + 0.5) % SYM.length;
          if (this.tokens < this.rig && i > 0 && this.reels[0] === Math.floor(this.reels[0]) && Math.random() < 0.85) s = Math.round(this.reels[0]) % SYM.length;
          this.reels[i] = s; this.spin[i] = false; this.stopAt++; GameAudio.sfx('stop');
          if (this.stopAt >= 3) {
            const a = this.reels.map((r) => Math.round(r) % SYM.length);
            if (a[0] === a[1] && a[1] === a[2]) {
              if (a[0] === 0) { this.jackpot = true; this.msg = 'JACKPOT!!! THREE SLOTHS!!!'; GameAudio.sfx('jackpot'); this.state = 'end'; this.endT = 2.5; HUD.bark('sleavis', 'Heh heh! HEH HEH! WE\'RE RICH! WE CAN BUY A WOMAN!'); return; }
              this.wins++; this.msg = 'THREE ' + SYM[a[0]] + 'S! +3 TOKENS'; this.tokens += 3; GameAudio.sfx('win');
            } else if (a.filter((x) => x === 4).length >= 2) { this.msg = 'TWO BRAS. HEH HEH. NO PRIZE.'; GameAudio.sfx('buzzer'); }
            else { this.msg = LP.pick(['NOTHING.', 'LOSER.', 'THE HOUSE THANKS YOU.', 'TRY AGAIN, SUCKER.']); GameAudio.sfx('buzzer'); }
            this.state = 'ready';
          }
        }
      }
      if (this.state === 'end') { this.endT -= dt; if (this.endT <= 0) this.result = { jackpot: this.jackpot, wins: this.wins }; }
    },
    draw() {
      title('FONTAINE\'S FREEDOM SLOTS', 'PRESS TO SPIN. PRESS THREE TIMES TO STOP EACH REEL.');
      HUD.panel(G.W / 2 - 120, 80, 240, 130, '#ffe040', 'rgba(40,10,10,0.94)');
      for (let i = 0; i < 3; i++) {
        const x = G.W / 2 - 100 + i * 70;
        G.rect(x, 100, 60, 70, '#f0f0e0');
        const r = this.reels[i], s = Math.floor(r) % SYM.length, f = r - Math.floor(r);
        const draw = (idx, y, a) => { G.g.globalAlpha = a; T(SYM[idx % SYM.length], x + 30, y, SYMC[idx % SYM.length], { align: 'center', outline: '#000' }); G.g.globalAlpha = 1; };
        if (this.spin[i]) { draw(s, 128 - f * 30, 1); draw(s + 1, 158 - f * 30, 0.6); draw((s + SYM.length - 1) % SYM.length, 98 - f * 30 + 30 - 30, 0.4); }
        else draw(Math.round(r) % SYM.length, 128, 1);
        G.frame(x, 100, 60, 70, '#806020');
      }
      G.rect(G.W / 2 - 104, 133, 208, 1, 'rgba(255,0,0,0.6)');
      T('TOKENS: ' + this.tokens, G.W / 2, 182, '#ffffff', { align: 'center' });
      if (this.msg) T(this.msg, G.W / 2, 196, '#ffe040', { face: 'small', align: 'center' });
      instr(sub(this.state === 'spin' ? 'PRESS {jump} TO STOP REEL ' + (this.stopAt + 1) : this.tokens > 0 ? 'PRESS {jump} TO SPIN' : 'OUT OF TOKENS. PRESS {jump}'));
    }
  };

  // ==================================================================== PORTA-POTTY BALANCE
  MG.defs.potty = {
    enter(cfg) { this.a = 0; this.v = 0; this.time = cfg.time || 20; this.push = 0; this.pushT = 1; this.mesh = cfg.mesh; },
    update(dt) {
      this.time -= dt;
      this.pushT -= dt;
      if (this.pushT <= 0) { this.pushT = LP.rand(0.6, 1.6); this.push = LP.rand(0.8, 1.6) * LP.pick([-1, 1]); GameAudio.sfx('thud'); if (Math.random() < 0.3) HUD.bark('slothhead', LP.pick(['HEY! I\'m IN here, dillholes!', 'Stop shaking it! It\'s... sloshing! Uh huh... no. Not funny.', 'Sleavis! Make them STOP!'])); }
      this.push *= Math.pow(0.1, dt);
      const steer = (I().held('right') ? 1 : 0) - (I().held('left') ? 1 : 0) || Ctl.lx;
      this.v += (this.a * 2.2 + this.push - steer * 2.6) * dt;
      this.v *= Math.pow(0.4, dt);
      this.a += this.v * dt;
      if (this.mesh) this.mesh.rotation.z = this.a * 0.5;
      if (Math.abs(this.a) > 1) { GameAudio.sfx('crash'); GameAudio.sfx('splat'); this.result = { fail: true, msg: 'The porta-potty went over. Sloth-Head is now a different color. Forever.' }; return; }
      if (this.time <= 0) this.result = 'win';
    },
    draw() {
      title('DON\'T TIP THE SLOTH-JOHN', 'SLOTH-HEAD IS INSIDE. THE CROWD IS PUSHING. LEAN AGAINST IT.');
      const cx = G.W / 2, y = 300;
      G.rect(cx - 120, y, 240, 10, '#2a2a2a');
      G.rect(cx - 30, y, 60, 10, '#30a030');
      G.rect(cx + this.a * 120 - 2, y - 5, 4, 20, Math.abs(this.a) > 0.7 ? '#ff3030' : '#ffffff');
      T('HOLD ON: ' + Math.max(0, Math.ceil(this.time)), cx, 60, '#ffffff', { align: 'center', outline: '#000', scale: 2 });
      instr('LEFT / RIGHT: LEAN');
    }
  };

  // ==================================================================== FINALE: THE REMOTE
  // cfg = { target: Object3D (the Freedom Blimp), dam: { y }, hits: 3 }
  MG.defs.remote = {
    enter(cfg) {
      this.rx = G.W / 2; this.ry = 120; this.hits = 0; this.need = cfg.hits || 3; this.cracks = 0; this.cd = 0; this.fights = 0; this.wrestle = 0; this.wrestleT = 4; this.shots = [];
      this.drift = [0, 0]; this.t2 = 0;
    },
    update(dt) {
      const tgt = this.cfg.target;
      this.t2 += dt;
      // the blimp wanders
      tgt.position.x = Math.sin(this.t2 * 0.45) * 22 + Math.sin(this.t2 * 1.3) * 6;
      tgt.position.y = 24 + Math.sin(this.t2 * 0.7) * 5;
      tgt.rotation.y = Math.PI / 2 + Math.cos(this.t2 * 0.45) * 0.3;
      // reticle
      const m = Ctl.move();
      this.rx = LP.clamp(this.rx + m[0] * 190 * dt + this.drift[0] * dt, 10, G.W - 10);
      this.ry = LP.clamp(this.ry + m[1] * 190 * dt + this.drift[1] * dt, 30, G.H - 30);
      // the idiots fight over the remote: the reticle goes nuts until you mash
      this.wrestleT -= dt;
      if (this.wrestleT <= 0 && !this.wrestle) { this.wrestle = 1; this.mash = 0; this.drift = [LP.rand(-160, 160), LP.rand(40, 120)]; HUD.bark('sleavis', LP.pick(['GIMME IT! I wanna change it to the boob channel!', 'MY TURN! Heh heh! MY TURN!', 'Let ME press it, Slutt-Head!'])); GameAudio.sfx('scratch'); }
      if (this.wrestle) {
        if (I().pressed('jump') || I().pressed('use')) { this.mash++; GameAudio.sfx('thud'); }
        if (this.mash >= 8) { this.wrestle = 0; this.drift = [0, 0]; this.wrestleT = LP.rand(4, 7); HUD.bark('slothhead', LP.pick(['Let GO, dumbass! Uh huh huh. Mine.', 'Quit it! You\'re gonna break the TV!'])); }
      }
      if (this.cd > 0) this.cd -= dt;
      if (I().pressed('punch') && this.cd <= 0 && !this.wrestle) {
        this.cd = 1.4;
        GameAudio.sfx('click');
        // fire: a beam into the world under the reticle
        const v = new THREE.Vector3(this.rx / G.W * 2 - 1, -(this.ry / G.H * 2 - 1), 0.5).unproject(R3.camera);
        const dir = v.sub(R3.camera.position).normalize();
        const tz = tgt.position.z;
        const k = (tz - R3.camera.position.z) / dir.z;
        const p = R3.camera.position.clone().add(dir.multiplyScalar(k));
        const sx = this.rx, sy = this.ry;
        this.shots.push({ t: 0.9, sx, sy, p });
        FX3.laser(p.x, p.z, null, { y: p.y - 0.5, delay: 0.9, size: 2.2 });
      }
      LP.prune(this.shots, (s) => {
        s.t -= dt;
        if (s.t > 0) return false;
        const sp = Stage.toScreen(tgt.position.clone());
        if (Math.hypot(sp[0] - s.sx, sp[1] - s.sy) < 34) {
          this.hits++; FX3.explode(tgt.position.clone(), 2.2); GameAudio.sfx('bigboom');
          HUD.bark(this.hits === 1 ? 'sleavis' : 'slothhead', LP.pick(['WHOA! Heh heh! We blew up the GOODYEAR!', 'Uh huh huh. Direct hit. On the... whatever that is.', 'This is the best channel EVER!']));
          if (this.cfg.onHit) this.cfg.onHit(this.hits);
        } else if (s.sy > (this.cfg.damY || 250)) {
          this.cracks++; Game.shake(0.4, 0.6); GameAudio.sfx('crash');
          HUD.bark('slothhead', this.cracks >= 2 ? 'Uhh... the dam is like, leaking. A LOT.' : 'Oops. Uh huh huh. That was the dam.');
          if (this.cfg.onCrack) this.cfg.onCrack(this.cracks);
        }
        return true;
      });
      if (this.cracks >= 3) { this.result = { fail: true, msg: 'You blew up the Hoover Damn yourselves. Lost Wages is now Lost Lake. Deke is delighted.' }; return; }
      if (this.hits >= this.need) this.result = 'win';
    },
    draw() {
      title('THE FREEDOM BLIMP', 'AIM THE REMOTE. HIT THE BLIMP 3 TIMES. DO NOT HIT THE DAM.');
      const c = this.wrestle ? (Math.floor(this.t * 12) % 2 ? '#ff4040' : '#ffffff') : this.cd > 0 ? '#806060' : '#ff3030';
      G.ring(this.rx, this.ry, 16, c); G.ring(this.rx, this.ry, 17, c);
      G.rect(this.rx - 24, this.ry, 14, 1, c); G.rect(this.rx + 10, this.ry, 14, 1, c); G.rect(this.rx, this.ry - 24, 1, 14, c); G.rect(this.rx, this.ry + 10, 1, 14, c);
      T('BLIMP HITS ' + this.hits + '/' + this.need, 16, 40, '#ffe040', { outline: '#000' });
      T('DAM CRACKS ' + this.cracks + '/3', G.W - 16, 40, this.cracks ? '#ff4040' : '#c0c0c0', { align: 'right', outline: '#000' });
      if (this.wrestle) T(sub('THEY\'RE FIGHTING OVER IT! MASH {jump}! (' + this.mash + '/8)'), G.W / 2, 60, '#ff80ff', { align: 'center', outline: '#000' });
      instr(sub('MOVE: AIM    {punch}: PRESS A BUTTON    {jump}: WRESTLE'));
    }
  };
  return MG;
})();
