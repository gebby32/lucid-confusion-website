/* ART — character portraits for briefings and radio calls (56x56, drawn in code),
   plus the little sloth-head badge used for wanted stars. */
'use strict';
const Art = (function () {
  const cache = {};
  const CHAR = {
    twotoes: { name: 'TWO-TOES', fur: '#8a6644', bg: ['#1a3a4a', '#22d3c5'], shirt: '#1ec8bc', shades: true, chain: true, smirk: true },
    mama: { name: 'MAMA MOSS', fur: '#a8988a', bg: ['#4a1a3a', '#ff7ab4'], shirt: '#ff7ab4', curlers: true, pearls: true, lips: true },
    dj: { name: 'DJ HAMMOCK', fur: '#8a6a4a', bg: ['#3a2a10', '#ff8a2e'], shirt: '#ff8a2e', phones: true, visor: true },
    cruller: { name: 'LT. CRULLER', fur: '#7a6048', bg: ['#14204a', '#3a6aff'], shirt: '#2a4aa8', cap: '#e8e8f0', stache: true, donut: true },
    baron: { name: 'BARON VELVET', fur: '#5e4a3a', bg: ['#2a0a3a', '#b46bff'], shirt: '#5a1a7a', tophat: true, monocle: true, wired: true, gold: true },
    terry: { name: '3-TOE TERRY', fur: '#6a4a2a', bg: ['#0a2a0a', '#9dff4a'], shirt: '#1e7a1e', bandana: true, scars: true, gold: true, chain: true },
    goon: { name: 'GOON', fur: '#7a5a3a', bg: ['#202020', '#808080'], shirt: '#3cbf3c' },
    dispatch: { name: 'POLICE RADIO', fur: '#7a6048', bg: ['#10183a', '#3060ff'], shirt: '#2a4aa8', cap: '#16245e' }
  };
  function portrait(who) {
    if (cache[who]) return cache[who];
    const o = CHAR[who] || CHAR.goon;
    const c = G.canvas(56, 56), g = c.getContext('2d');
    const E = (x, y, rx, ry, col) => G.ellipse(x, y, rx, ry, col, g);
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const sh = City.shade;
    // background: neon stripes
    R(0, 0, 56, 56, o.bg[0]);
    for (let i = 0; i < 56; i += 6) R(0, i, 56, 2, sh(o.bg[0], 0.08));
    E(28, 30, 26, 24, sh(o.bg[1], -0.55));
    // shoulders
    E(28, 60, 25, 15, sh(o.shirt, -0.25)); E(28, 61, 23, 13, o.shirt);
    if (o.chain) for (let x = 18; x <= 38; x += 2) R(x, 48 + Math.round(Math.pow((x - 28) / 10, 2) * -4) + 4, 2, 2, '#ffd23e');
    if (o.pearls) for (let x = 19; x <= 37; x += 3) E(x, 50 - Math.round(Math.pow((x - 28) / 9, 2) * -3) - 1, 1, 1, '#ffffff');
    // head
    const fur = o.fur, furD = sh(fur, -0.3), mask = '#efe2c0', stripe = '#3a2412';
    E(28, 28, 21, 19, furD); E(28, 27, 20, 18, fur);
    for (let i = 0; i < 26; i++) { const a = i * 2.4, rr = 12 + (i % 5) * 1.6; R(Math.round(28 + Math.cos(a) * rr), Math.round(26 + Math.sin(a) * rr * 0.85), 1, 2, sh(fur, i % 2 ? 0.15 : -0.2)); }
    E(28, 32, 15, 12, mask);
    // the sloth "mask" stripes running from the eyes to the temples
    for (const s of [-1, 1]) { E(28 + s * 10, 28, 6, 3.5, stripe); E(28 + s * 15, 25, 4, 2.5, stripe); E(28 + s * 18, 22, 2, 2, stripe); }
    // eyes
    if (!o.shades && !o.visor) for (const s of [-1, 1]) {
      if (o.wired) { E(28 + s * 10, 28, 3, 3, '#ffffff'); R(28 + s * 10, 28, 1, 1, '#000'); }
      else { E(28 + s * 10, 28, 2, 2, '#0c0806'); R(28 + s * 10 + 1, 27, 1, 1, '#ffffff'); }
    }
    // nose + mouth
    E(28, 35, 4, 2.5, '#24160c'); R(26, 34, 2, 1, '#6a5040');
    const mouthCol = o.lips ? '#e0306a' : '#3a2010';
    for (let x = 22; x <= 34; x++) { const y = 40 - Math.round(Math.pow((x - 28) / 6, 2) * 2) + (o.smirk && x > 29 ? -1 : 0); R(x, y, 1, o.lips ? 2 : 1, mouthCol); }
    if (o.gold) R(30, 39, 2, 2, '#ffd23e');
    if (o.scars) for (let i = 0; i < 3; i++) G.line(16 + i * 3, 18, 22 + i * 3, 30, '#e8a0a0', g);
    if (o.stache) { E(24, 38, 5, 2, '#3a2412'); E(32, 38, 5, 2, '#3a2412'); }
    // accessories
    if (o.shades) {
      R(14, 24, 12, 7, '#0a0a0e'); R(30, 24, 12, 7, '#0a0a0e'); R(26, 26, 4, 2, '#0a0a0e');
      R(15, 25, 4, 1, '#6a7ab0'); R(31, 25, 4, 1, '#6a7ab0'); R(12, 25, 2, 1, '#0a0a0e'); R(42, 25, 2, 1, '#0a0a0e');
    }
    if (o.visor) { R(13, 24, 30, 6, '#3ef0ff'); R(13, 24, 30, 1, '#c8ffff'); R(13, 29, 30, 1, '#1a8a9a'); }
    if (o.phones) { for (let a = Math.PI * 1.05; a < Math.PI * 1.95; a += 0.05) R(Math.round(28 + Math.cos(a) * 22), Math.round(26 + Math.sin(a) * 20), 3, 3, '#ff4fb4'); E(7, 28, 4, 7, '#ff4fb4'); E(49, 28, 4, 7, '#ff4fb4'); E(7, 28, 2, 4, '#20101a'); E(49, 28, 2, 4, '#20101a'); }
    if (o.curlers) for (let i = 0; i < 5; i++) { R(12 + i * 7, 6 + (i % 2) * 2, 6, 5, '#ffb0d8'); R(12 + i * 7, 6 + (i % 2) * 2, 6, 1, '#ffe0f0'); }
    if (o.cap) { R(10, 6, 36, 12, o.cap); R(10, 6, 36, 2, sh(o.cap, 0.3)); R(8, 17, 40, 4, sh(o.cap, -0.5)); E(28, 11, 3, 3, '#ffd23e'); }
    if (o.bandana) { R(9, 8, 38, 9, '#2a9a2a'); for (let i = 0; i < 6; i++) R(11 + i * 6, 10, 2, 2, '#9dff4a'); R(44, 14, 6, 4, '#2a9a2a'); }
    if (o.tophat) { R(15, 0, 26, 12, '#1e0a2a'); R(10, 11, 36, 4, '#1e0a2a'); R(15, 8, 26, 3, '#ffd23e'); R(16, 1, 2, 7, '#3a1a4a'); }
    if (o.monocle) { G.ring(38, 28, 5, '#ffd23e', g); G.line(43, 30, 47, 46, '#ffd23e', g); }
    if (o.donut) { E(46, 48, 8, 6, '#c08040'); E(46, 47, 7, 5, '#ff8ac0'); E(46, 47, 2, 2, '#c08040'); R(42, 45, 1, 1, '#3ef0ff'); R(49, 46, 1, 1, '#ffd23e'); R(45, 50, 1, 1, '#9dff4a'); }
    // frame
    g.fillStyle = o.bg[1]; g.fillRect(0, 0, 56, 1); g.fillRect(0, 55, 56, 1); g.fillRect(0, 0, 1, 56); g.fillRect(55, 0, 1, 56);
    return (cache[who] = c);
  }
  // small sloth-head badge for the wanted meter
  const badges = {};
  function badge(on, col) {
    const k = on + col;
    if (badges[k]) return badges[k];
    const c = G.canvas(11, 11), g = c.getContext('2d');
    if (!on) { G.disc(5, 5, 5, '#2a2a36', g); G.disc(5, 5, 4, '#3e3e4e', g); return (badges[k] = c); }
    G.disc(5, 5, 5, '#101018', g); G.disc(5, 5, 4, col, g);
    G.ellipse(5, 6, 3, 2, '#f0e2bc', g);
    g.fillStyle = '#101018'; g.fillRect(2, 4, 3, 2); g.fillRect(6, 4, 3, 2); g.fillRect(4, 7, 3, 1);
    return (badges[k] = c);
  }
  return { CHAR, portrait, badge };
})();
