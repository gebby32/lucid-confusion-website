/* HUD — everything drawn over the city while you play.
   Health + armor, weapon + ammo (INF with the cheat), money, wanted badges, radar,
   mission objective + timer + target health, the objective arrow, crosshair,
   toasts, district / car / radio names, big banners, radio calls and hints. */
'use strict';
const HUD = (function () {
  const H = { toasts: [], banner: null, say: null, sayQ: [], tipT: 0, tipText: '', carT: 0, carText: '', distT: 0, distText: '', lastDist: '', subT: 0, subText: '' };
  H.reset = function () { H.toasts.length = 0; H.banner = null; H.say = null; H.sayQ.length = 0; H.tipT = 0; H.carT = 0; H.distT = 0; H.lastDist = ''; H.subT = 0; };
  H.toast = function (text, col) { H.toasts.push({ text, col: col || '#fff', t: 2.2 }); if (H.toasts.length > 3) H.toasts.shift(); };
  H.carName = function (name) { H.carText = name; H.carT = 2.6; };
  H.sub = function (text) { H.subText = text; H.subT = 2.6; };
  H.showBanner = function (text, sub, col, dur) { H.banner = { text, sub: sub || '', col: col || '#ffd23e', t: dur || 3, life: dur || 3 }; };
  H.radio = function (who, text, dur) { H.sayQ.push({ who, text, t: dur || Math.max(3.2, text.length * 0.065) }); };
  H.tip = function (text, dur) { H.tipText = text; H.tipT = dur || 6; };

  H.update = function (dt) {
    for (const t of H.toasts) t.t -= dt;
    LP.prune(H.toasts, (t) => t.t <= 0);
    if (H.banner && (H.banner.t -= dt) <= 0) H.banner = null;
    if (H.say) { H.say.t -= dt; H.say.shown = Math.min(H.say.text.length, (H.say.shown || 0) + dt * 60); if (H.say.t <= 0) H.say = null; }
    if (!H.say && H.sayQ.length) { H.say = H.sayQ.shift(); GameAudio.sfx('radio'); }
    if (H.tipT > 0) H.tipT -= dt;
    if (H.carT > 0) H.carT -= dt;
    if (H.subT > 0) H.subT -= dt;
    if (H.distT > 0) H.distT -= dt;
    const p = Player.ped;
    if (p) { const d = City.districtName(p.x, p.y); if (d !== H.lastDist) { if (H.lastDist) { H.distText = d; H.distT = 2.8; } H.lastDist = d; } }
  };

  const T = (str, x, y, col, o) => Font.draw(G.g, str, x, y, col, o);
  function bar(x, y, w, h, v, col, back) {
    G.rect(x - 1, y - 1, w + 2, h + 2, '#000');
    G.rect(x, y, w, h, back || '#2a1a24');
    G.rect(x, y, Math.round(w * LP.clamp(v, 0, 1)), h, col);
    G.rect(x, y, Math.round(w * LP.clamp(v, 0, 1)), 1, City.shade(col, 0.4));
  }

  H.draw = function (g) {
    G.g = g;
    const p = Player.ped;
    if (!p) return;
    const time = World.time;
    // ---------------- top-left: health / armor
    const hurt = Player.hurtT > 0 && Math.floor(time * 20) % 2;
    G.ellipse(12, 12, 5, 5, '#000');
    G.rect(8, 9, 3, 3, '#ff3a5a'); G.rect(12, 9, 3, 3, '#ff3a5a'); G.rect(8, 11, 7, 3, '#ff3a5a'); G.rect(9, 14, 5, 1, '#ff3a5a'); G.rect(10, 15, 3, 1, '#ff3a5a');
    bar(19, 9, 70, 6, p.hp / p.maxHp, hurt ? '#ffffff' : (p.hp < 30 && Math.floor(time * 4) % 2 ? '#ff9090' : '#ff3a5a'));
    if (p.armor > 0) { G.rect(9, 19, 6, 6, '#2a5ab0'); G.rect(9, 19, 6, 2, '#6a9ae0'); bar(19, 20, 70, 4, p.armor / 100, '#4a8aff'); }
    // ---------------- bottom-left: weapon
    const V = Weapons.Inv, w = V.cur, D = Weapons.DEF[w];
    G.rect(6, G.H - 32, 108, 26, 'rgba(8,6,16,0.72)');
    G.frame(6, G.H - 32, 108, 26, '#3a3550');
    const ic = Weapons.icon(w);
    g.drawImage(ic, 0, 0, 22, 12, 9, G.H - 29, 44, 24);
    T(D.name, 57, G.H - 28, '#e8e4f4', { face: 'small' });
    let ammo = '';
    if (w === 'fists') ammo = '';
    else if (V.cheat) ammo = 'INF';
    else if (D.clip) ammo = (V.clip[w] || 0) + '/' + (V.ammo[w] || 0);
    else ammo = String(V.ammo[w] || 0);
    if (ammo) T(ammo, 57, G.H - 19, V.cheat ? '#ff4fb4' : '#ffd23e');
    if (V.reloadT > 0) T('RELOAD', 57, G.H - 9, Math.floor(time * 8) % 2 ? '#ff7a7a' : '#ffffff', { face: 'small' });
    if (V.cheat) T('CHEAT', 88, G.H - 9, '#ff4fb4', { face: 'small' });
    // ---------------- top-right: radar, badges, money
    radar(g, G.W - 44, 44, 36);
    const bx = G.W - 84;
    for (let i = 0; i < 5; i++) {
      const on = i < Police.stars;
      const flash = on && !Police.seen && Police.lostT > 0 && Math.floor(time * 5) % 2;
      const col = Police.flash > 0 && Math.floor(time * 12) % 2 ? '#ffffff' : (Police.seen ? (Math.floor(time * 6 + i) % 2 ? '#ff3030' : '#3060ff') : '#ffd23e');
      g.drawImage(Art.badge(on && !flash, col), bx + i * 12 - 2, 86);
    }
    const money = fmtMoney(Player.shown);
    T(money, G.W - 6, 101, '#9dff4a', { align: 'right', outline: '#0a1a08' });
    // ---------------- objective (top centre)
    const M = Missions;
    if (M.obj && M.obj.text) {
      const txt = M.obj.text.toUpperCase();
      const wdt = Font.width(txt, 'small') + 12;
      G.rect((G.W - wdt) / 2, 6, wdt, 11, 'rgba(8,6,16,0.75)');
      T(txt, G.W / 2, 9, '#ffd23e', { face: 'small', align: 'center' });
      let y = 20;
      if (M.timer !== null && M.timer !== undefined) {
        const s = Math.max(0, Math.ceil(M.timer)), str = Math.floor(s / 60) + ':' + LP.pad(s % 60, 2);
        T(str, G.W / 2, y, s <= 10 && Math.floor(time * 4) % 2 ? '#ff4040' : '#ffffff', { align: 'center', outline: '#000' }); y += 11;
      }
      if (M.health && !M.health.gone) {
        const e = M.health, v = e.maxHp ? e.hp / e.maxHp : 0;
        T(M.healthLabel || 'HEALTH', G.W / 2 - 42, y + 1, '#e8e4f4', { face: 'small', align: 'right' });
        bar(G.W / 2 - 38, y + 1, 80, 4, v, v < 0.3 ? '#ff4040' : '#9dff4a');
      }
    } else if (!M.active && M.next()) {
      const mk = M.next();
      const txt = (mk.giverName + ' IS CALLING. ANSWER THE PHONE').toUpperCase();
      if (Math.floor(time * 1.5) % 2) {
        const wdt = Font.width(txt, 'small') + 12;
        G.rect((G.W - wdt) / 2, 6, wdt, 11, 'rgba(8,6,16,0.6)');
        T(txt, G.W / 2, 9, '#ff7ab4', { face: 'small', align: 'center' });
      }
    }
    // ---------------- objective arrow
    const tgt = M.target();
    if (tgt) arrow(g, tgt, time);
    // ---------------- crosshair
    if (Ctl.usingMouse() && LP.States.is('play')) {
      const x = Math.round(Ctl.mx), y = Math.round(Ctl.my);
      g.fillStyle = '#000'; g.fillRect(x - 5, y - 1, 4, 3); g.fillRect(x + 2, y - 1, 4, 3); g.fillRect(x - 1, y - 5, 3, 4); g.fillRect(x - 1, y + 2, 3, 4);
      g.fillStyle = V.reloadT > 0 ? '#ff7a7a' : '#ffffff'; g.fillRect(x - 4, y, 3, 1); g.fillRect(x + 2, y, 3, 1); g.fillRect(x, y - 4, 1, 3); g.fillRect(x, y + 2, 1, 3);
    }
    // ---------------- warnings
    if (p.inCar && p.inCar.burn > 0 && Math.floor(time * 6) % 2) T('GET OUT!', G.W / 2, G.H / 2 - 50, '#ff4040', { align: 'center', outline: '#000', scale: 2 });
    if (Police.bustT > 0.15) T('!', p.x - World.camX, p.y - World.camY - 22, Math.floor(time * 10) % 2 ? '#ff3030' : '#3060ff', { align: 'center', outline: '#000', scale: 2 });
    // ---------------- district / car / radio
    if (H.distT > 0) {
      const a = Math.min(1, H.distT, (2.8 - H.distT) * 3);
      g.globalAlpha = a;
      T(H.distText, G.W - 8, G.H - 34, '#ffffff', { align: 'right', outline: '#2a1040', scale: 2 });
      g.globalAlpha = 1;
    }
    if (H.carT > 0) T(H.carText, G.W - 8, G.H - 16, '#3ef0ff', { align: 'right', outline: '#000' });
    if (H.subT > 0) T(H.subText, G.W - 8, G.H - 26, '#ff7ab4', { face: 'small', align: 'right', outline: '#000' });
    // ---------------- toasts
    let ty = 120;
    for (const t of H.toasts) { if (t.t < 0.4 && Math.floor(t.t * 20) % 2) { ty += 12; continue; } T(t.text, G.W / 2, ty, t.col, { align: 'center', outline: '#000' }); ty += 12; }
    // ---------------- tips
    if (H.tipT > 0) {
      const lines = G.wrap(H.tipText.toUpperCase(), 300, 'small');
      const h = lines.length * 7 + 8, y = G.H - 44 - h;
      G.rect(G.W / 2 - 156, y, 312, h, 'rgba(8,6,16,0.8)'); G.frame(G.W / 2 - 156, y, 312, h, '#3ef0ff');
      lines.forEach((l, i) => T(l, G.W / 2, y + 5 + i * 7, '#c8f8ff', { face: 'small', align: 'center' }));
    }
    // ---------------- radio call
    if (H.say) {
      const s = H.say, x = 8, y = 116;
      G.rect(x, y, 196, 44, 'rgba(8,6,16,0.85)'); G.frame(x, y, 196, 44, Art.CHAR[s.who] ? Art.CHAR[s.who].bg[1] : '#888');
      g.drawImage(Art.portrait(s.who), 0, 0, 56, 56, x + 3, y + 3, 38, 38);
      T((Art.CHAR[s.who] || {}).name || '', x + 45, y + 4, Art.CHAR[s.who] ? Art.CHAR[s.who].bg[1] : '#fff', { face: 'small' });
      const lines = G.wrap(s.text.toUpperCase().slice(0, Math.floor(s.shown || 0)), 146, 'small');
      lines.slice(0, 5).forEach((l, i) => T(l, x + 45, y + 12 + i * 6, '#e8e4f4', { face: 'small' }));
    }
    // ---------------- banners
    if (H.banner) {
      const b = H.banner, k = Math.min(1, (b.life - b.t) * 4);
      const sc = 3;
      g.globalAlpha = Math.min(1, b.t * 2);
      const y = G.H / 2 - 40;
      G.rect(0, y - 8, G.W, 46, 'rgba(0,0,0,' + (0.55 * k) + ')');
      T(b.text, G.W / 2, y, b.col, { align: 'center', outline: '#000', scale: sc });
      if (b.sub) T(b.sub, G.W / 2, y + 27, '#ffffff', { align: 'center', outline: '#000' });
      g.globalAlpha = 1;
    }
  };

  function radar(g, cx, cy, R) {
    const p = Player.ped, tileSize = City.T;
    const px = p.x / tileSize, py = p.y / tileSize;
    g.save();
    g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.closePath();
    g.fillStyle = '#0a0a14'; g.fill();
    g.clip();
    g.globalAlpha = 0.92;
    g.drawImage(City.radar, Math.round(cx - px), Math.round(cy - py));
    g.globalAlpha = 1;
    const blip = (wx, wy, col, size, clampEdge) => {
      let dx = wx / tileSize - px, dy = wy / tileSize - py;
      const d = Math.hypot(dx, dy);
      if (d > R - 3) { if (!clampEdge) return; dx *= (R - 3) / d; dy *= (R - 3) / d; }
      g.fillStyle = '#000'; g.fillRect(Math.round(cx + dx) - (size >> 1) - 1, Math.round(cy + dy) - (size >> 1) - 1, size + 2, size + 2);
      g.fillStyle = col; g.fillRect(Math.round(cx + dx) - (size >> 1), Math.round(cy + dy) - (size >> 1), size, size);
    };
    // police
    const fl = Math.floor(World.time * 6) % 2;
    for (const c of World.cars) if (c.police && c.siren && !c.wreck) blip(c.x, c.y, fl ? '#ff3030' : '#3060ff', 2);
    if (Police.heli) blip(Police.heli.x, Police.heli.y, '#ffffff', 3);
    // spray shops + safehouse
    for (const z of ['spray1', 'spray2']) { const Z = City.zones[z]; blip(Z.x, Z.y, '#3ef0ff', 3); }
    blip(City.zones.safehouse.x, City.zones.safehouse.y, '#9dff4a', 3);
    // mission stuff
    for (const b of Missions.blips()) blip(b.x, b.y, b.col, b.size || 3, true);
    g.restore();
    G.ring(cx, cy, R, '#5a5070', g); G.ring(cx, cy, R + 1, '#1a1428', g);
    // the player arrow
    const a = p.inCar ? p.inCar.a : p.a;
    g.fillStyle = '#ffffff';
    g.save(); g.translate(cx, cy); g.rotate(a);
    g.beginPath(); g.moveTo(4, 0); g.lineTo(-3, -3); g.lineTo(-1, 0); g.lineTo(-3, 3); g.closePath(); g.fill();
    g.restore();
    // north
    T('N', cx, cy - R - 1, '#8a84a0', { face: 'small', align: 'center' });
  }

  function arrow(g, tgt, time) {
    const sx = tgt.x - World.camX, sy = tgt.y - World.camY;
    const on = sx > 12 && sy > 12 && sx < G.W - 12 && sy < G.H - 12;
    if (on) {
      const bob = Math.round(Math.sin(time * 6) * 3);
      const x = Math.round(sx), y = Math.round(sy - 20 + bob);
      g.fillStyle = '#000'; g.beginPath(); g.moveTo(x - 6, y - 5); g.lineTo(x + 6, y - 5); g.lineTo(x, y + 3); g.closePath(); g.fill();
      g.fillStyle = '#ffd23e'; g.beginPath(); g.moveTo(x - 4, y - 4); g.lineTo(x + 4, y - 4); g.lineTo(x, y + 1); g.closePath(); g.fill();
      return;
    }
    const p = Player.ped;
    const px = p.x - World.camX, py = p.y - World.camY;
    const a = Math.atan2(sy - py, sx - px);
    const r = 36 + Math.sin(time * 6) * 2;
    const x = px + Math.cos(a) * r, y = py + Math.sin(a) * r;
    g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(a);
    g.fillStyle = '#000'; g.beginPath(); g.moveTo(9, 0); g.lineTo(-5, -7); g.lineTo(-2, 0); g.lineTo(-5, 7); g.closePath(); g.fill();
    g.fillStyle = '#ffd23e'; g.beginPath(); g.moveTo(7, 0); g.lineTo(-4, -5); g.lineTo(-1, 0); g.lineTo(-4, 5); g.closePath(); g.fill();
    g.restore();
  }
  return H;
})();
