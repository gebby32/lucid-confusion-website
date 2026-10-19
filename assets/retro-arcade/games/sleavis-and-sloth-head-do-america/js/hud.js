/* HUD — everything drawn in the 480x360 pixel layer over the 3D picture:
   dialogue box (with a live 3D close-up of whoever is talking), barks, toasts,
   world popups, the hero bars, the PROPERTY DAMAGE counter, prompts, objectives,
   chapter cards and the shared meter widgets the mini-games use. */
'use strict';
const HUD = (function () {
  const H = { toasts: [], pops: [], barks: [], shoutT: 0, shoutText: '', objective: '', objT: 0, dmgShown: 0, dmgFlash: 0, swapFlash: 0, card: null, dialog: null, hidden: false, prompt: null };
  const T = (s, x, y, c, o) => Font.draw(G.g, s, x, y, c, o);
  const WHO = {
    sleavis: { name: 'SLEAVIS', col: '#ffd23e', bg: '#3a2a10' },
    slothhead: { name: 'SLOTH-HEAD', col: '#ff9a4e', bg: '#3a2010' },
    slaria: { name: 'SLARIA', col: '#a8e070', bg: '#1a2a12' },
    narrator: { name: '', col: '#e8e4f4' },
    sign: { name: '', col: '#e8e4f4' },
    radio: { name: 'RADIO', col: '#60e0ff' },
    tv: { name: 'TV', col: '#60e0ff' },
    phone: { name: 'PHONE', col: '#60e0ff' }
  };
  const NPCCOL = { tammy: '#ff7070', lyle: '#ff5050', dwayne: '#c08040', doug: '#e0d8a0', earl: '#e8e8e8', wade: '#c0d0ff', strunk: '#a0a0c0', pip: '#c0c0ff', chuck: '#ff5050', deke: '#ffe8b0', bigmama: '#a0a0ff', cornelius: '#ffb040', gaspy: '#ff4040' };
  H.who = function (id) {
    if (WHO[id]) return WHO[id];
    const a = Stage.cur && Stage.find(id);
    const nm = (a && a.name) || (Npc.LOOKS[id] && Npc.LOOKS[id].name) || id.toUpperCase();
    return { name: nm, col: NPCCOL[id] || '#e0e0ff', bg: '#141428' };
  };
  // button names for the current input device
  const KEY = { jump: 'SPACE', confirm: 'ENTER', use: 'E', punch: 'J', swap: 'Q', special: 'SHIFT', pause: 'ESC', up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', gas: 'W', brake: 'S' };
  const PAD = { jump: 'A', confirm: 'A', use: 'B', punch: 'X', swap: 'Y', special: 'LB', pause: 'START', up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', gas: 'RT', brake: 'LT' };
  H.btn = (a) => (LP.Input.source === 'pad' ? PAD : KEY)[a] || a.toUpperCase();

  H.reset = function () { H.toasts = []; H.pops = []; H.barks = []; H.shoutT = 0; H.objective = ''; H.card = null; H.dialog = null; H.dmgShown = Game.stats.damage; R3.portrait = null; };
  H.toast = function (text, col) { H.toasts.push({ text: String(text).toUpperCase(), col: col || '#fff', t: 0 }); if (H.toasts.length > 4) H.toasts.shift(); };
  H.popup = function (pos, text, col, small) { H.pops.push({ pos: pos.clone(), text, col: col || '#fff', t: 0, small }); if (H.pops.length > 24) H.pops.shift(); };
  H.bark = function (who, text, dur) {
    if (who === 'sleavis' && /SLUTT-HEAD/i.test(text)) Game.stats.slutt++;
    H.barks.push({ who, text, t: 0, dur: dur || Math.max(2.4, text.length * 0.06) });
    if (H.barks.length > 2) H.barks.shift();
    GameAudio.voice(who, text, true);
  };
  H.shout = function (text) { H.shoutText = text; H.shoutT = 2.4; };
  H.setObjective = function (text) { if (text !== H.objective) { H.objective = text || ''; H.objT = 0; if (text) GameAudio.sfx('objective'); } };
  H.damageBump = function () { H.dmgFlash = 0.4; };
  H.showCard = function (title, sub, num) { H.card = { title, sub, num, t: 0 }; };

  H.update = function (dt) {
    for (const t of H.toasts) t.t += dt;
    LP.prune(H.toasts, (t) => t.t > 3.2);
    for (const p of H.pops) p.t += dt;
    LP.prune(H.pops, (p) => p.t > 1.1);
    for (const b of H.barks) b.t += dt;
    LP.prune(H.barks, (b) => b.t > b.dur);
    if (H.shoutT > 0) H.shoutT -= dt;
    H.objT += dt;
    const target = Game.stats.damage;
    if (H.dmgShown < target) H.dmgShown = Math.min(target, H.dmgShown + Math.max(13, (target - H.dmgShown) * dt * 4));
    if (H.dmgShown > target) H.dmgShown = target;
    if (H.dmgFlash > 0) H.dmgFlash -= dt;
    if (H.swapFlash > 0) H.swapFlash -= dt;
    if (H.card) H.card.t += dt;
  };

  // ------------------------------------------------------------------ pieces
  H.bar = function (x, y, w, h, f, col, label, back) {
    G.rect(x - 1, y - 1, w + 2, h + 2, '#000');
    G.rect(x, y, w, h, back || '#3a2a3a');
    G.rect(x, y, Math.round(w * LP.clamp(f, 0, 1)), h, col);
    G.rect(x, y, Math.round(w * LP.clamp(f, 0, 1)), 1, 'rgba(255,255,255,0.35)');
    if (label) T(label, x, y - 7, '#fff', { face: 'small', outline: '#000' });
  };
  H.panel = function (x, y, w, h, edge, fill) {
    G.rect(x, y, w, h, fill || 'rgba(8,6,16,0.9)');
    G.frame(x, y, w, h, edge || '#e8e4f4');
    G.frame(x + 2, y + 2, w - 4, h - 4, 'rgba(255,255,255,0.12)');
  };

  function heroPanel(a, x, y, on) {
    const w = H.who(a.id);
    const alpha = on ? 1 : 0.6;
    G.g.globalAlpha = alpha;
    G.rect(x, y, 112, 22, 'rgba(8,6,16,0.75)');
    G.frame(x, y, 112, 22, on ? w.col : '#4a4060');
    T(w.name, x + 4, y + 3, w.col, { face: 'small', outline: '#000' });
    if (on) T('<', x + 104, y + 3, w.col, { face: 'small' });
    H.bar(x + 4, y + 12, 104, 5, a.hp / a.maxhp, a.hp / a.maxhp < 0.3 ? '#ff3030' : '#50e050');
    if (a.state === 'ko') T('KO!', x + 84, y + 3, '#ff4040', { face: 'small', outline: '#000' });
    G.g.globalAlpha = 1;
  }

  H.drawGameHUD = function (o) {
    o = o || {};
    const L = Game.leaderActor();
    if (!o.noHeroes && L) {
      let x = 6;
      for (const id of ['sleavis', 'slothhead']) {
        const a = Game.hero(id);
        if (!a || a.gone || !a.vis.root.visible) continue;
        heroPanel(a, x, 6, Game.leader === id);
        x += 118;
      }
      // specials
      const sx = 6, sy = 32;
      if (Game.hero('sleavis') && !Game.hero('sleavis').gone && Game.hero('sleavis').vis.root.visible) {
        const f = Game.freakT > 0 ? Game.freakT / 7.5 : Game.freak / 100;
        const full = Game.freak >= 100 || Game.freakT > 0;
        H.bar(sx + 50, sy + 1, 62, 4, f, Game.freakT > 0 ? (Math.floor(LP.Loop.time * 10) % 2 ? '#ff40ff' : '#ffffff') : full ? '#ff40ff' : '#a060ff');
        T(full && Game.freakT <= 0 ? 'FREAK! ' + H.btn('special') : 'FREAK', sx, sy, full ? '#ff80ff' : '#c8a0ff', { face: 'small', outline: '#000' });
      }
      if (Game.flags.remote && Game.hero('slothhead') && !Game.hero('slothhead').gone && Game.hero('slothhead').vis.root.visible) {
        const r = Game.remoteCD > 0 ? 1 - Game.remoteCD / 6.5 : 1;
        H.bar(sx + 168, sy + 1, 62, 4, r, r >= 1 ? '#ff3030' : '#803030');
        T(r >= 1 ? 'REMOTE ' + H.btn('special') : 'REMOTE', sx + 118, sy, r >= 1 ? '#ff6060' : '#a06060', { face: 'small', outline: '#000' });
      }
    }
    // property damage
    if (!o.noDamage) {
      const s = 'PROPERTY DAMAGE';
      T(s, G.W - 6, 6, '#80ff80', { face: 'small', align: 'right', outline: '#000' });
      const v = fmtMoney(H.dmgShown);
      T(v, G.W - 6, 14, H.dmgFlash > 0 ? '#ffffff' : '#60ff60', { align: 'right', outline: '#103010' });
    }
    // objective
    if (H.objective && !H.dialog) {
      const a = H.objT < 0.3 ? H.objT / 0.3 : 1;
      G.g.globalAlpha = a;
      const w = Font.width(H.objective, 'small') + 16;
      G.rect(G.W / 2 - w / 2, 42 + (o.objY || 0), w, 11, 'rgba(0,0,0,0.6)');
      T(H.objective, G.W / 2, 45 + (o.objY || 0), H.objT < 3 && Math.floor(H.objT * 4) % 2 ? '#ffffff' : '#ffe040', { face: 'small', align: 'center' });
      G.g.globalAlpha = 1;
    }
  };

  H.drawPrompt = function () {
    const L = Game.leaderActor();
    if (!L || !L.alive || H.dialog || Story.blocking()) return;
    const h = Game.nearHot(L);
    let text = null, col = '#ffffff';
    if (h) { text = H.btn('use') + ': ' + (typeof h.label === 'function' ? h.label() : h.label); if (h.who && h.who !== L.id) { col = '#a0a0a0'; text += ' (' + (h.who === 'sleavis' ? 'SLEAVIS' : 'SLOTH-HEAD') + ')'; } }
    else if (!L.carry) {
      for (const p of Stage.cur.props) if (p.alive && p.kind === 'throw' && !p.held && Math.hypot(p.x - L.x, p.z - L.z) < 1.3) { text = H.btn('use') + ': PICK UP ' + (p.label || 'THING'); break; }
    } else text = H.btn('punch') + ' / ' + H.btn('use') + ': THROW ' + (L.carry.label || 'IT');
    if (!text) return;
    const pos = L.vis.headWorld ? L.vis.headWorld() : new THREE.Vector3(L.x, L.y + 2, L.z);
    pos.y += 0.35;
    const s = Stage.toScreen(pos);
    const w = Font.width(text, 'small') + 10;
    const x = LP.clamp(s[0], w / 2 + 4, G.W - w / 2 - 4), y = LP.clamp(s[1] - 14, 40, G.H - 120);
    G.rect(x - w / 2, y - 2, w, 11, 'rgba(0,0,0,0.75)'); G.frame(x - w / 2, y - 2, w, 11, col === '#ffffff' ? '#ffe040' : '#606060');
    T(text, x, y + 1, col, { face: 'small', align: 'center' });
  };

  function drawPops() {
    for (const p of H.pops) {
      const v = p.pos.clone(); v.y += p.t * 0.8;
      const s = Stage.toScreen(v);
      if (!s[2]) continue;
      if (p.t > 0.8 && Math.floor(p.t * 20) % 2) continue;
      T(p.text, s[0], s[1], p.col, { face: p.small ? 'small' : 'big', align: 'center', outline: '#000' });
    }
  }
  function drawToasts() {
    let y = 58;
    for (const t of H.toasts) {
      const a = t.t < 0.2 ? t.t / 0.2 : t.t > 2.7 ? (3.2 - t.t) / 0.5 : 1;
      G.g.globalAlpha = Math.max(0, a);
      const w = Font.width(t.text, 'small') + 12;
      G.rect(G.W / 2 - w / 2, y - 2, w, 10, 'rgba(0,0,0,0.7)');
      T(t.text, G.W / 2, y, t.col, { face: 'small', align: 'center' });
      y += 12;
    }
    G.g.globalAlpha = 1;
  }
  function drawBarks() {
    let y = H.dialog ? G.H - 120 : G.H - 34;
    for (let i = H.barks.length - 1; i >= 0; i--) {
      const b = H.barks[i], w = H.who(b.who);
      const a = b.t < 0.15 ? b.t / 0.15 : b.t > b.dur - 0.4 ? (b.dur - b.t) / 0.4 : 1;
      G.g.globalAlpha = Math.max(0, a);
      const lines = G.wrap(b.text.toUpperCase(), 380, 'small');
      const name = w.name ? w.name + ': ' : '';
      const h = lines.length * 8 + 4;
      y -= h;
      const tw = Math.max(...lines.map((l) => Font.width(l, 'small'))) + Font.width(name, 'small') + 12;
      G.rect(G.W / 2 - tw / 2, y - 2, tw, h, 'rgba(0,0,0,0.72)');
      T(name, G.W / 2 - tw / 2 + 6, y + 1, w.col, { face: 'small' });
      lines.forEach((l, j) => T(l, G.W / 2 - tw / 2 + 6 + Font.width(name, 'small'), y + 1 + j * 8, '#f0f0f0', { face: 'small' }));
      y -= 4;
    }
    G.g.globalAlpha = 1;
  }
  function drawShout() {
    if (H.shoutT <= 0) return;
    const lines = G.wrap(H.shoutText, 210, 'big');
    lines.forEach((l, i) => {
      const jx = LP.rand(-2, 2), jy = LP.rand(-2, 2);
      T(l, G.W / 2 + jx, 112 + i * 20 + jy, Math.floor(LP.Loop.time * 12) % 2 ? '#ff40ff' : '#ffffff', { align: 'center', outline: '#300030', scale: 2 });
    });
  }
  function drawCard() {
    const c = H.card; if (!c) return;
    const t = c.t;
    if (t > 4.2) { H.card = null; return; }
    const a = t < 0.4 ? t / 0.4 : t > 3.6 ? (4.2 - t) / 0.6 : 1;
    G.g.globalAlpha = a;
    G.rect(0, 120, G.W, 96, 'rgba(0,0,0,0.78)');
    G.rect(0, 122, G.W, 2, '#ffd23e'); G.rect(0, 212, G.W, 2, '#ffd23e');
    if (c.num) T(c.num, G.W / 2, 132, '#ff7a4a', { align: 'center', outline: '#000' });
    T(c.title, G.W / 2, 150, '#ffd23e', { align: 'center', outline: '#3a1000', scale: 3 });
    if (c.sub) T(c.sub, G.W / 2, 186, '#e8e4f4', { face: 'small', align: 'center', outline: '#000' });
    G.g.globalAlpha = 1;
  }

  // ------------------------------------------------------------------ dialogue box
  // H.dialog = { who, text, shown, choices: [..], sel, page }
  function drawDialog() {
    const d = H.dialog;
    R3.portrait = null;
    if (!d) return;
    const w = H.who(d.who);
    const bx = 10, by = G.H - 98, bw = G.W - 20, bh = 90;
    const isHero = d.who === 'sleavis' || d.who === 'slothhead';
    const speaker = isHero ? Heroes[d.who] : (Stage.cur && Stage.find(d.who) ? Stage.find(d.who).vis : null);
    H.panel(bx, by, bw, bh, w.col);
    let tx = bx + 10;
    if (speaker && speaker.root.visible && d.who !== 'narrator') {
      G.g.clearRect(bx + 9, by + 9, 72, 72);
      G.frame(bx + 8, by + 8, 74, 74, w.col);
      R3.portrait = { hero: speaker, x: bx + 9, y: by + 9, w: 72, h: 72, bg: w.bg || '#141428', side: d.who === 'sleavis' ? 0.25 : -0.25 };
      tx = bx + 90;
    }
    if (w.name) T(w.name, tx, by + 8, w.col, { outline: '#000' });
    const ty = by + (w.name ? 22 : 12);
    if (d.choices) {
      d.choices.forEach((c, i) => {
        const on = i === d.sel;
        const lines = G.wrap(c, bw - (tx - bx) - 24, 'small');
        if (on) G.rect(tx - 2, ty + i * 14 - 2, bw - (tx - bx) - 8, 11, 'rgba(255,210,62,0.18)');
        T((on ? '> ' : '  ') + lines[0], tx, ty + i * 14, on ? '#ffe040' : '#c8c4d8', { face: 'small' });
      });
      return;
    }
    const face = 'big';
    const lines = G.wrap(d.text.toUpperCase(), bw - (tx - bx) - 14, face);
    const shown = Math.floor(d.shown);
    let n = 0;
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const vis = l.slice(0, Math.max(0, shown - n));
      n += l.length + 1;
      if (vis) T(vis, tx, ty + i * 11, d.who === 'narrator' ? '#ffe8a0' : '#f4f0fc');
    }
    if (d.shown >= d.text.length && Math.floor(LP.Loop.time * 3) % 2) T('>', bx + bw - 16, by + bh - 14, w.col);
  }

  H.draw = function (o) {
    if (H.hidden) return;
    o = o || {};
    if (!o.noGame) H.drawGameHUD(o);
    drawPops();
    if (!o.noGame) H.drawPrompt();
    drawToasts();
    drawBarks();
    drawShout();
    drawDialog();
    drawCard();
  };
  return H;
})();
