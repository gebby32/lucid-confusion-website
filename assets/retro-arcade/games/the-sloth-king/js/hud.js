/* HUD — health paws, roar meter, lives, leaves, score, boss bar, hint stones, banners,
   the act title card and the act-clear tally. Plus AMBIENT: stateless weather particles
   per theme (pollen, dust, falling leaves, fireflies, drips, embers, rain). */
'use strict';
const Hud = (function () {
  const icons = {};
  function headIcon(look) {
    if (icons[look]) return icons[look];
    const f = SlothArt.get(look, 'idle', 0), F = SlothArt.FORMS[SlothArt.LOOKS[look].form];
    const hx = f.ax + 1 * F.k, hy = f.ay - 23 * F.k, s = look === 'cub' ? 20 : 26;
    const c = Px.canvas(s, s);
    c.getContext('2d').drawImage(f.c, Math.round(hx - s / 2), Math.round(hy - s / 2 - 1), s, s, 0, 0, s, s);
    return (icons[look] = c);
  }
  const paw = (full) => Art.cache('paw' + full, () => Art.build(11, 10, 0, 0, (g) => {
    const c = full ? ['#c8501a', '#ff9a3a', '#ffd080'] : ['#2a1a14', '#4a3428', '#5a4434'];
    Art.blob(g, 5.5, 6.5, 3.2, 2.6, 0, c);
    for (const [x, y] of [[2, 3], [4.5, 1.6], [7, 1.6], [9.2, 3]]) Art.ell(g, x, y, 1.1, 1.2, 0, c[1]);
  }));
  const leafIcon = () => Ents.itemFrame('leaf', 0);

  function text(g, s, x, y, color, o) { return Font.draw(g, s, x, y, color, Object.assign({ outline: '#100804' }, o)); }

  const H = {};
  H.draw = function (g) {
    const P = Player, R = Game.run;
    if (!R) return;
    // portrait + paws
    const icon = headIcon(P.F.look);
    g.drawImage(icon, 4, P.form === 'cub' ? 2 : 0);
    const px0 = P.form === 'cub' ? 25 : 31;
    for (let i = 0; i < P.maxHp; i++) {
      const f = paw(i < P.hp ? 1 : 0);
      const low = P.hp === 1 && i === 0 && (LP.Loop.frame >> 3) % 2;
      if (!low) g.drawImage(f.c, px0 + i * 11, 4);
    }
    // roar meter
    const rw = 46, rx = px0, ry = 16;
    g.fillStyle = '#100804'; g.fillRect(rx - 1, ry - 1, rw + 2, 6);
    g.fillStyle = '#2a2440'; g.fillRect(rx, ry, rw, 4);
    const full = P.roar >= 1;
    g.fillStyle = full ? ((LP.Loop.frame >> 3) % 2 ? '#ffffff' : '#7ad8ff') : '#3a8ad8';
    g.fillRect(rx, ry, Math.round(rw * P.roar), 4);
    g.fillStyle = full ? '#d0f4ff' : '#7ab8f0'; g.fillRect(rx, ry, Math.round(rw * P.roar), 1);
    text(g, 'ROAR', rx + rw + 4, ry - 1, full ? '#a8e8ff' : '#6a8aa8', { face: 'small' });
    // score
    text(g, LP.pad(R.score, 7), 160, 4, '#fff4d0', { face: 'small', align: 'center' });
    // lives + leaves
    g.drawImage(headIcon('cub'), 256, 0, 20, 20);
    text(g, 'X' + Math.max(0, R.lives), 276, 7, '#ffffff', { face: 'small' });
    Art.draw(g, leafIcon(), 296, 22 - 13);
    text(g, LP.pad(R.leaves, 2), 304, 7, '#ffe060', { face: 'small' });
    // boss bar
    const B = Game.boss;
    if (B && B.active && !B.done) {
      const bw = 120, bx = 100, by = 226;
      text(g, B.name, 160, by - 9, '#ffb0a0', { face: 'small', align: 'center' });
      g.fillStyle = '#100804'; g.fillRect(bx - 1, by - 1, bw + 2, 7);
      g.fillStyle = '#3a1010'; g.fillRect(bx, by, bw, 5);
      const k = Math.max(0, B.hp / B.maxHp);
      g.fillStyle = '#e03030'; g.fillRect(bx, by, Math.round(bw * k), 5);
      g.fillStyle = '#ff8a7a'; g.fillRect(bx, by, Math.round(bw * k), 1);
    }
    // hint stone text
    if (Game.hintT > 0 && Game.hint) {
      Game.hintT--;
      const lines = wrap(Game.hint, 36);
      const h = lines.length * 10 + 8, y = 232 - h;
      g.fillStyle = 'rgba(16,8,4,0.86)'; g.fillRect(8, y, 304, h);
      g.fillStyle = '#c8a050'; g.fillRect(8, y, 304, 1); g.fillRect(8, y + h - 1, 304, 1);
      lines.forEach((l, i) => text(g, l, 160, y + 5 + i * 10, '#fff4d0', { align: 'center' }));
    }
    if (Game.bannerT > 0 && Game.banner) {
      const a = Game.bannerT > 100 ? (120 - Game.bannerT) / 20 : 1;
      if (a > 0.3 || Game.bannerT % 4 < 2) text(g, Game.banner, 160, 96, '#ffe060', { align: 'center', shadow: '#5a2a00' });
    }
  };
  function wrap(s, n) {
    const out = []; let cur = '';
    for (const w of String(s).split(' ')) { if ((cur + ' ' + w).trim().length > n) { out.push(cur.trim()); cur = w; } else cur += ' ' + w; }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  H.wrap = wrap;

  H.card = function (g, lvl, t) {
    const a = Math.min(1, t / 12), out = Game.phase === 'play' ? 1 - t / 20 : t > 100 ? Math.max(0, (120 - t) / 20) : 1;
    const k = Math.min(a, out);
    if (k <= 0) return;
    const y = 84, h = 72;
    g.fillStyle = 'rgba(10,4,2,' + (0.82 * k).toFixed(3) + ')'; g.fillRect(0, y, 320, h);
    g.fillStyle = '#c8901a'; g.fillRect(0, y, Math.round(320 * k), 2); g.fillRect(320 - Math.round(320 * k), y + h - 2, Math.round(320 * k), 2);
    if (k < 0.6) return;
    text(g, 'ACT ' + lvl.act, 160, y + 12, '#ffd060', { align: 'center' });
    text(g, lvl.name, 160, y + 28, '#ffffff', { align: 'center', scale: 2, shadow: '#7a3a00' });
    text(g, lvl.sub || '', 160, y + 52, '#e8c890', { face: 'small', align: 'center' });
  };

  H.clear = function (g) {
    const T = Game.tally, t = Game.phaseT;
    if (t > 20) text(g, 'ACT CLEAR!', 160, 46, (t >> 3) % 2 ? '#ffe060' : '#ffffff', { align: 'center', scale: 2, shadow: '#7a3a00' });
    if (!T) return;
    g.fillStyle = 'rgba(10,4,2,0.8)'; g.fillRect(56, 76, 208, 96);
    g.fillStyle = '#c8901a'; g.fillRect(56, 76, 208, 1); g.fillRect(56, 171, 208, 1);
    T.rows.slice(0, T.shown).forEach((r, i) => {
      text(g, r[0], 66, 86 + i * 14, '#fff4d0', { face: 'small' });
      text(g, String(r[1]), 254, 86 + i * 14, r[1] ? '#ffe060' : '#8a7a6a', { face: 'small', align: 'right' });
    });
    if (T.shown >= T.rows.length) {
      text(g, 'BONUS', 66, 152, '#ffffff');
      text(g, String(T.total), 254, 152, '#7aff9a', { align: 'right' });
    }
  };
  H.headIcon = headIcon;
  H.paw = paw;
  return H;
})();

const Ambient = (function () {
  const hash = (i, k) => Themes.hash(i * 13 + k, k * 7 + 3);
  function draw(g, theme, cx, cy, frame) {
    const kind = Game.rain ? 'rain' : Themes.T[theme].ambient, t = frame;
    const wrap = (v, m) => ((v % m) + m) % m;
    switch (kind) {
      case 'pollen': case 'dust': {
        const n = kind === 'dust' ? 36 : 22;
        for (let i = 0; i < n; i++) {
          const sp = 0.2 + hash(i, 1) * 0.5, x = wrap(hash(i, 2) * 700 - cx * sp + t * (kind === 'dust' ? 0.8 : 0.15) * sp * 2, 340) - 10;
          const y = wrap(hash(i, 3) * 600 - cy * sp + Math.sin(t / 60 + i) * 6, 260) - 10;
          g.fillStyle = kind === 'dust' ? (i % 3 ? '#f0c890' : '#ffe8c0') : (i % 2 ? '#fff6c0' : '#ffe080');
          g.fillRect(Math.round(x), Math.round(y), 1, 1);
        }
        break;
      }
      case 'leaves': {
        for (let i = 0; i < 12; i++) {
          const sp = 0.4 + hash(i, 1) * 0.4, x = wrap(hash(i, 2) * 700 - cx * sp + Math.sin(t / 40 + i) * 12, 340) - 10;
          const y = wrap(hash(i, 3) * 600 - cy * sp + t * 0.35 * sp * 2, 260) - 10;
          g.fillStyle = i % 2 ? '#5ab83a' : '#8ae04a';
          const w = Math.abs(Math.sin(t / 15 + i)) > 0.5 ? 2 : 1;
          g.fillRect(Math.round(x), Math.round(y), w, 3 - w);
        }
        break;
      }
      case 'fireflies': {
        for (let i = 0; i < 18; i++) {
          const sp = 0.5 + hash(i, 1) * 0.5, x = wrap(hash(i, 2) * 700 - cx * sp + Math.sin(t / 70 + i * 2) * 20, 340) - 10;
          const y = wrap(hash(i, 3) * 600 - cy * sp + Math.cos(t / 55 + i) * 14, 260) - 10;
          const on = Math.sin(t / 25 + i * 1.7) > 0.2;
          if (!on) continue;
          g.fillStyle = 'rgba(220,255,120,0.35)'; g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 4, 4);
          g.fillStyle = '#f0ffa0'; g.fillRect(Math.round(x), Math.round(y), 2, 2);
        }
        break;
      }
      case 'embers': {
        for (let i = 0; i < 26; i++) {
          const sp = 0.4 + hash(i, 1) * 0.6, x = wrap(hash(i, 2) * 700 - cx * sp + Math.sin(t / 30 + i) * 8, 340) - 10;
          const y = wrap(hash(i, 3) * 600 - cy * sp - t * (0.5 + hash(i, 4)) , 260) - 10;
          g.fillStyle = i % 3 === 0 ? '#ffe080' : i % 3 === 1 ? '#ff8a2a' : '#ff5a10';
          g.fillRect(Math.round(x), Math.round(y), 1, i % 4 === 0 ? 2 : 1);
        }
        break;
      }
      case 'mist': {
        for (let i = 0; i < 6; i++) {
          const x = wrap(hash(i, 2) * 900 - cx * 0.6 + t * 0.2, 500) - 120, y = 150 + hash(i, 3) * 80 + Math.sin(t / 90 + i) * 6;
          g.fillStyle = 'rgba(150,190,160,0.08)'; g.fillRect(Math.round(x), Math.round(y), 140, 10); g.fillRect(Math.round(x) + 20, Math.round(y) - 4, 90, 4);
        }
        break;
      }
      case 'spray': case 'drips': {
        const n = kind === 'spray' ? 16 : 8;
        for (let i = 0; i < n; i++) {
          const x = wrap(hash(i, 2) * 700 - cx * 0.9, 340) - 10, y = wrap(hash(i, 3) * 600 - cy * 0.9 + t * (kind === 'spray' ? 1.5 : 3), 260) - 10;
          g.fillStyle = kind === 'spray' ? '#e8f8ff' : '#8a7ac8'; g.fillRect(Math.round(x), Math.round(y), 1, kind === 'spray' ? 1 : 3);
        }
        break;
      }
      case 'rain': {
        for (let i = 0; i < 70; i++) {
          const x = wrap(hash(i, 2) * 700 - cx * 1.0 - t * 2, 360) - 20, y = wrap(hash(i, 3) * 600 - cy + t * 7, 260) - 10;
          g.fillStyle = i % 3 ? 'rgba(170,200,255,0.7)' : '#d8e8ff';
          g.fillRect(Math.round(x), Math.round(y), 1, 5); g.fillRect(Math.round(x) - 1, Math.round(y) + 4, 1, 3);
        }
        break;
      }
    }
  }
  return { draw };
})();
