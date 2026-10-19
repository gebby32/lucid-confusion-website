/* STORY — the director. Chapters are lists of SEGMENTS; a segment is a generator
   function(S) that yields "tasks" (dialogue, waits, gameplay modes...). Each segment
   sets up its own scene, so a failed segment simply restarts (and CONTINUE resumes at
   the last segment reached).
     yield* S.say('sleavis', 'Heh heh. Hey Slutt-Head.')
     const i = yield* S.choose('slothhead', ['Option A', 'Option B'])
     const r = yield* S.play('action', { ... })     // 'fail' never returns: it throws -> retry screen
   Hotspot scripts run as interrupts on top of the current segment (Story.run). */
'use strict';
class Fail { constructor(msg) { this.msg = msg; } }
const Story = (function () {
  const S = { main: null, intr: [], ch: 0, seg: 0, fadeA: 0, fadeTo: 0, fadeSpeed: 2, active: false, chapters: [], skip: false };
  const isGen = (f) => f && f.constructor && f.constructor.name === 'GeneratorFunction';

  function runner(it) { return { it, task: null, done: false, value: undefined }; }
  function step(r, dt) {
    let guard = 0;
    while (!r.done && guard++ < 64) {
      if (r.task) {
        if (!r.task.update(dt)) return;
        r.value = r.task.value; r.task = null; dt = 0;
      }
      let res;
      try { res = r.it.next(r.value); }
      catch (e) {
        r.done = true;
        if (e instanceof Fail) { S.failed(e.msg); return; }
        console.error(e); throw e;
      }
      r.value = undefined;
      if (res.done) { r.done = true; r.result = res.value; return; }
      r.task = res.value || null;
      if (!r.task) return;                       // bare `yield` = wait one frame
    }
  }
  S.blocking = function () {
    if (S.intr.length) { const t = S.intr[S.intr.length - 1].task; return !t || t.block !== false; }
    return !!(S.main && S.main.task && S.main.task.block);
  };
  // run a hotspot / event script on top of whatever is going on
  S.run = function (fn, ...args) {
    if (!fn) return;
    if (!isGen(fn)) { fn(S, ...args); return; }
    S.intr.push(runner(fn(S, ...args)));
  };
  S.update = function (dt) {
    if (S.fadeA !== S.fadeTo) S.fadeA = LP.approach(S.fadeA, S.fadeTo, dt * S.fadeSpeed);
    if (S.intr.length) {
      const r = S.intr[S.intr.length - 1];
      step(r, dt);
      if (r.done) S.intr.pop();
      // non-blocking interrupts let the main script keep ticking
      if (S.intr.length && S.intr[S.intr.length - 1].task && S.intr[S.intr.length - 1].task.block !== false) return;
    }
    if (!S.main) return;
    step(S.main, dt);
    if (S.main && S.main.done && !S.failing) S.nextSegment();
  };

  // ------------------------------------------------------------------ chapters / segments
  S.start = function (ch, seg) {
    S.ch = ch; S.seg = seg || 0; S.active = true;
    S.beginSegment();
  };
  S.beginSegment = function () {
    const chap = S.chapters[S.ch];
    const key = S.ch + ':' + S.seg;
    S.tries = S.lastKey === key ? (S.tries || 0) + 1 : 0;
    S.lastKey = key;
    S.intr = []; S.failing = false;
    Game.ensureFlags(S.ch);
    Modes.stop();
    Game.clearTransient();
    HUD.reset();
    MiniGames.stop();
    Game.save(S.ch, S.seg);
    S.main = runner(chap.segs[S.seg](S));
  };
  S.nextSegment = function () {
    S.seg++;
    if (S.seg >= S.chapters[S.ch].segs.length) {
      S.ch++; S.seg = 0;
      if (S.ch >= S.chapters.length) { S.main = null; S.active = false; LP.States.go('ending'); return; }
    }
    S.beginSegment();
  };
  S.failed = function (msg) {
    Game.stats.deaths++;
    S.failing = true;
    S.intr = [];
    LP.States.go('fail', { msg });
  };
  S.retry = function () { S.beginSegment(); };

  // ------------------------------------------------------------------ the script API
  const sub = (t) => String(t).replace(/\{(\w+)\}/g, (m, a) => HUD.btn(a));
  // one line of dialogue (typewriter, voice blips, paginates long text)
  S.say = function* (who, text, o) {
    o = o || {};
    text = sub(text);
    if (who === 'sleavis' && /SLUTT-HEAD/i.test(text)) Game.stats.slutt++;
    // paginate: 3 rows of the big face
    const hasPortrait = true;
    const width = G.W - 20 - (hasPortrait ? 90 : 10) - 14;
    const rows = G.wrap(text.toUpperCase(), width, 'big');
    const pages = [];
    for (let i = 0; i < rows.length; i += 6) pages.push(rows.slice(i, i + 6).join(' '));
    const anim = o.anim === undefined ? 'talk' : o.anim;
    const speaker = S.actor(who);
    const prevAnim = speaker ? speaker.scriptAnim : null;
    if (speaker && anim && speaker.state === 'free' && !speaker.target && !speaker.scriptAnim) speaker.pose(anim);
    for (const page of pages) {
      const d = { who, text: page, shown: 0 };
      HUD.dialog = d;
      GameAudio.voice(who, page);
      let t = 0;
      yield { block: true, update(dt) {
        t += dt;
        const was = Math.floor(d.shown);
        d.shown = Math.min(page.length, d.shown + dt * (o.speed || 48));
        if (Math.floor(d.shown) !== was && Math.floor(d.shown) % 3 === 0 && page[Math.floor(d.shown)] !== ' ') GameAudio.blip(who);
        if (S.skip && t > 0.05) return true;
        if (o.auto && d.shown >= page.length && t > page.length / 48 + o.auto) return true;
        if (t > 0.12 && Ctl.advance()) {
          if (d.shown < page.length) { d.shown = page.length; return false; }
          return true;
        }
        return false;
      } };
    }
    HUD.dialog = null;
    GameAudio.voiceStop();
    if (speaker && anim && speaker.scriptAnim === anim) speaker.pose(prevAnim);
    LP.Input.clearPresses();
  };
  // [['sleavis', '...'], ['slothhead', '...'], 0.5 (wait), fn (call)]
  S.lines = function* (list) {
    for (const l of list) {
      if (typeof l === 'number') yield* S.wait(l);
      else if (typeof l === 'function') { const r = l(); if (r && r.next) yield* r; }
      else yield* S.say(l[0], l[1], l[2]);
    }
  };
  S.choose = function* (who, options) {
    const d = { who, choices: options.map((o) => sub(typeof o === 'string' ? o : o.text)), sel: 0 };
    HUD.dialog = d;
    LP.Input.clearPresses();
    let t = 0;
    yield { block: true, update(dt) {
      t += dt;
      const I = LP.Input;
      if (I.pressed('down')) { d.sel = (d.sel + 1) % d.choices.length; GameAudio.sfx('menu'); }
      if (I.pressed('up')) { d.sel = (d.sel - 1 + d.choices.length) % d.choices.length; GameAudio.sfx('menu'); }
      if (t > 0.2 && (I.pressed('confirm') || I.pressed('use'))) { GameAudio.sfx('select'); this.value = d.sel; return true; }
      return false;
    } };
    HUD.dialog = null;
    LP.Input.clearPresses();
    const i = d.sel, opt = options[i];
    if (typeof opt === 'object' && opt.say !== false) yield* S.say(opt.who || who, opt.say || opt.text);
    return i;
  };
  S.wait = function* (sec, o) { let t = 0; yield { block: !(o && o.free), update(dt) { t += dt; return t >= sec || (S.skip && !(o && o.free)); } }; };
  S.until = function* (fn, o) { yield { block: !!(o && o.block), update() { return !!fn(); } }; };
  S.actor = function (id) {
    if (id === 'sleavis' || id === 'slothhead') return Game.hero(id);
    return Stage.cur ? Stage.find(id) : null;
  };
  S.walk = function* (id, x, z, o) {
    const a = typeof id === 'string' ? S.actor(id) : id; if (!a) return;
    a.walkTo(x, z, o && o.run);
    let t = 0;
    yield { block: !(o && o.free), update(dt) { t += dt; if (t > (o && o.timeout || 8)) { a.target = null; a.place(x, z); } return !a.target; } };
    if (o && o.face !== undefined) a.lookAt(o.face);
  };
  S.walkAll = function* (list) { // [[id, x, z, run], ...]
    const as = list.map((l) => { const a = S.actor(l[0]); if (a) a.walkTo(l[1], l[2], l[3]); return a; });
    let t = 0;
    yield { block: true, update(dt) { t += dt; if (t > 8) { as.forEach((a, i) => { if (a && a.target) { a.target = null; a.place(list[i][1], list[i][2]); } }); } return as.every((a) => !a || !a.target); } };
  };
  S.spawn = function (look, x, z, face, o) {
    o = o || {};
    const a = new Actor(Npc.make(look), Object.assign({ id: o.id || (typeof look === 'string' ? look : null), x, z, face: face || 0 }, o));
    Stage.addActor(a);
    if (o.ai === undefined) a.ai = Actor.AI.idle;
    return a;
  };
  // sit an actor somewhere (couch, booth, toilet...) — no collision, fixed height
  S.sit = function (id, x, z, face, y, anim) { const a = typeof id === 'string' ? S.actor(id) : id; if (!a) return; a.ignoreCol = true; a.pinY = y || 0; a.target = null; a.place(x, z, face); a.y = a.pinY; a.pose(anim || 'couch'); a.sync(); };
  S.stand = function (id, x, z) { const a = typeof id === 'string' ? S.actor(id) : id; if (!a) return; a.pinY = null; a.ignoreCol = false; a.pose(null); if (x !== undefined) a.place(x, z); };
  S.anim = function (id, anim, o) { const a = S.actor(id); if (a) a.pose(anim, o); };
  S.face = function (id, t) { const a = S.actor(id), b = typeof t === 'string' ? S.actor(t) : null; if (!a) return; if (b) a.lookAt(b); else if (typeof t === 'number') a.lookAt(t); else if (t) a.lookAt(t); a.face = a.faceT; };
  S.shot = function (pos, look, dur) { Stage.shot(pos, look, dur); };
  S.free = function () { Stage.release(); };
  S.objective = function (t) { HUD.setObjective(t); };
  S.trigger = (t) => Stage.trigger(t);
  S.hot = (h) => Stage.hot(h);
  S.bark = function (who, t) { HUD.bark(who, sub(t)); };
  S.toast = function (t, c) { HUD.toast(sub(t), c); };
  S.sfx = (n) => GameAudio.sfx(n);
  S.music = (n) => GameAudio.music(n);
  S.flag = function (k, v) { if (v !== undefined) Game.flags[k] = v; return Game.flags[k]; };
  S.fail = function (msg) { throw new Fail(msg); };
  S.fade = function* (to, sec) { S.fadeTo = to; S.fadeSpeed = 1 / (sec || 0.5); yield { block: true, update() { return S.fadeA === S.fadeTo; } }; };
  S.card = function* (num, title, sub2) {
    HUD.showCard(title, sub2, num);
    GameAudio.sfx('card');
    let t = 0;
    yield { block: true, update(dt) { t += dt; if (t > 0.8 && Ctl.advance() && HUD.card) { HUD.card.t = Math.max(HUD.card.t, 3.6); } return !HUD.card || t > 4.2; } };
  };
  // build a new place behind a black fade, with a loading tip
  S.load = function* (builder, arg, o) {
    o = o || {};
    if (S.fadeA < 1) yield* S.fade(1, 0.35);
    HUD.dialog = null; HUD.objective = '';
    Loading.tip();
    yield* S.wait(0.05);
    Modes.stop();
    Game.clearTransient();
    const info = Stage.load(builder, arg);
    yield* S.wait(0.15);
    if (!o.stayBlack) yield* S.fade(0, 0.45);
    return info;
  };
  // run a gameplay mode until it's done. 'fail' (or a fail message) throws to the retry screen.
  S.play = function* (name, cfg) {
    const m = Modes.start(name, cfg || {});
    let res = null;
    yield { block: false, update(dt) { res = m.result; return res !== null && res !== undefined; } };
    Modes.stop();
    if (res === 'fail' || (res && res.fail)) S.fail((res && res.msg) || (cfg && cfg.failMsg) || 'You failed. Shocking.');
    return res;
  };
  S.minigame = function* (name, cfg) {
    const m = MiniGames.start(name, cfg || {});
    let res = null;
    yield { block: false, update() { res = m.result; return res !== null && res !== undefined; } };
    MiniGames.stop();
    if (cfg && cfg.soft) return res;
    if (res === 'fail' || (res && res.fail)) S.fail((res && res.msg) || (cfg && cfg.failMsg) || 'Mini-game over. You\'re a mini-loser.');
    return res;
  };
  // set a non-blocking gameplay mode in the background (exploring while a script waits on flags)
  S.mode = function (name, cfg) { return Modes.start(name, cfg || {}); };
  return S;
})();
