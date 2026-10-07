/* PROPS — the drawn pieces of a level that are not terrain: one-way branches and ledges,
   hanging vines and ribs, climbing vines, thorns, decorations, big background trees,
   breakable blocks, and the animated liquids and waterfalls.
   Static props are baked into the level canvas once (world.js); animated ones are drawn
   every frame. Everything is themed by name (see themes.js). */
'use strict';
const Props = (function () {
  const { ellipse, rect, px, poly, stroke, rng, shade, mix } = Px;
  const hash = (x, y) => Themes.hash(x, y);

  // ------------------------------------------------------------------ one-way platforms (n tiles long, at tile top y)
  function platform(g, style, x, y, n, theme) {
    const w = n * 16;
    const T = Themes.T[theme].terrain;
    switch (style) {
      case 'bone': {
        rect(g, x + 2, y + 2, w - 4, 5, '#d8d2bc'); rect(g, x + 2, y + 2, w - 4, 1, '#fffcec'); rect(g, x + 2, y + 6, w - 4, 1, '#9a947e');
        for (const ex of [x + 2, x + w - 3]) { ellipse(g, ex, y + 3, 3, 3, '#e8e2cc'); ellipse(g, ex, y + 7, 3, 2.4, '#c8c2ac'); }
        for (let k = 8; k < w - 6; k += 13) rect(g, x + k, y + 3, 1, 3, '#b0aa94');
        rect(g, x + 1, y + 1, w - 2, 1, '#2a2a20'); rect(g, x + 1, y + 8, w - 2, 1, '#2a2a20');
        break;
      }
      case 'ledge': case 'basalt': {
        const R = T.ramp;
        poly(g, [[x, y], [x + w, y], [x + w - 3, y + 8], [x + w * 0.6, y + 11], [x + w * 0.3, y + 10], [x + 3, y + 8]], R[0]);
        rect(g, x + 1, y + 1, w - 2, 5, R[2]); rect(g, x + 1, y + 1, w - 2, 1, R[4]); rect(g, x + 3, y + 6, w - 6, 2, R[1]);
        for (let k = 0; k < w; k += 7) px(g, x + k + 2, y + 3, R[3]);
        if (style === 'basalt') for (let k = 4; k < w - 4; k += 9) rect(g, x + k, y + 7, 3, 1, '#ff6a1a');
        break;
      }
      case 'log': case 'branch': case 'branchburnt': {
        const burnt = style === 'branchburnt';
        const bark = burnt ? ['#1a0e0a', '#2e1a12', '#4a2a1a', '#ff6a1a'] : style === 'log' ? ['#2a1a0e', '#5a3a1c', '#7e5428', '#a87a40'] : ['#2a160a', '#5e3818', '#86542a', '#b07a40'];
        rect(g, x, y + 1, w, 7, bark[0]);
        rect(g, x + 1, y + 2, w - 2, 5, bark[1]);
        rect(g, x + 1, y + 2, w - 2, 2, bark[2]);
        rect(g, x + 2, y + 2, w - 4, 1, bark[3]);
        for (let k = 3; k < w - 3; k += 6 + (k % 5)) { px(g, x + k, y + 4, bark[0]); px(g, x + k + 1, y + 5, bark[0]); }
        ellipse(g, x + 1, y + 4.5, 2, 3.4, bark[2]); px(g, x + 1, y + 4, bark[0]);
        ellipse(g, x + w - 1, y + 4.5, 2, 3.4, bark[2]); px(g, x + w - 1, y + 4, bark[0]);
        if (!burnt) {
          const lc = style === 'log' ? ['#2a6a2a', '#4a9a3a'] : theme === 'night' ? ['#1a3a4a', '#2a5a6a'] : ['#3a6a1a', '#6aa030'];
          for (let k = 0; k < n; k++) if (hash(x + k, y) < 0.5) { ellipse(g, x + k * 16 + 8, y + 1, 4, 2, lc[0]); ellipse(g, x + k * 16 + 7, y, 2.4, 1.2, lc[1]); }
          if (style === 'log') for (let k = 0; k < w; k += 5) if (hash(k, y) < 0.4) px(g, x + k, y + 8, '#3a8a3a');
        } else for (let k = 0; k < w; k += 5) if (hash(k, y) < 0.3) px(g, x + k, y + 2, '#ffb040');
        break;
      }
      default: rect(g, x, y, w, 6, '#888');
    }
  }

  // ------------------------------------------------------------------ hang bars (grab from below), n tiles
  function hang(g, style, x, y, n, theme) {
    const w = n * 16, by = y + 2;
    if (style === 'rib') {
      rect(g, x, by, w, 4, '#2a2a20'); rect(g, x, by + 1, w, 2, '#d8d2bc'); rect(g, x, by + 1, w, 1, '#fffcec');
      for (let k = 6; k < w; k += 16) { rect(g, x + k, by - 1, 2, 6, '#2a2a20'); rect(g, x + k, by, 2, 4, '#e8e2cc'); }
      return;
    }
    if (style === 'chain') {
      for (let k = 0; k < w; k += 6) { rect(g, x + k, by, 5, 4, '#1a1a1e'); rect(g, x + k + 1, by + 1, 3, 2, k % 12 ? '#6a6a74' : '#8a8a96'); }
      return;
    }
    const c = style === 'root' ? ['#2a160a', '#5a3818', '#7a5028'] : theme === 'night' ? ['#0a1a20', '#1e4a52', '#2e6a6e'] : theme === 'final' ? ['#140a06', '#3a2414', '#5a3a1e'] : ['#0e2a0e', '#2a6a22', '#4a9a32'];
    for (let k = 0; k < w; k++) {
      const sag = Math.sin(k / w * Math.PI) * 1.5, yy = by + sag;
      rect(g, x + k, yy, 1, 4, c[0]);
      rect(g, x + k, yy + 1, 1, 2, (k >> 1) % 3 === 0 ? c[2] : c[1]);
    }
    if (style !== 'root') for (let k = 4; k < w; k += 9) if (hash(x + k, y) < 0.7) { const yy = by + 3 + Math.sin(k / w * Math.PI) * 1.5; ellipse(g, x + k, yy + 2, 2, 1.4, c[1]); px(g, x + k, yy + 4, c[2]); }
  }

  // ------------------------------------------------------------------ climbable column, n tiles tall
  function climb(g, style, x, y, n, theme) {
    const h = n * 16, cx = x + 8;
    if (style === 'rib') {
      rect(g, cx - 5, y, 2, h, '#2a2a20'); rect(g, cx + 4, y, 2, h, '#2a2a20');
      rect(g, cx - 4, y, 1, h, '#e8e2cc'); rect(g, cx + 4, y, 1, h, '#c8c2ac');
      for (let k = 4; k < h; k += 8) { rect(g, cx - 4, y + k, 8, 2, '#2a2a20'); rect(g, cx - 4, y + k, 8, 1, '#f0ead4'); }
      return;
    }
    if (style === 'chain') {
      for (let k = 0; k < h; k += 6) { rect(g, cx - 2, y + k, 4, 5, '#1a1a1e'); rect(g, cx - 1, y + k + 1, 2, 3, k % 12 ? '#6a6a74' : '#8a8a96'); }
      return;
    }
    const c = style === 'root' ? ['#2a160a', '#5a3818', '#7a5028'] : theme === 'night' ? ['#0a1a20', '#1e4a52', '#3a8a8a'] : theme === 'final' ? ['#140a06', '#3a2414', '#5a3a1e'] : ['#0e2a0e', '#2a6a22', '#5aa83a'];
    for (let k = 0; k < h; k++) {
      const wob = Math.round(Math.sin((y + k) / 7) * 1.5);
      rect(g, cx - 2 + wob, y + k, 4, 1, c[0]); rect(g, cx - 1 + wob, y + k, 2, 1, (k >> 2) % 2 ? c[1] : c[2]);
      const wob2 = Math.round(Math.sin((y + k) / 5 + 2) * 2.5);
      if (style !== 'root') px(g, cx + wob2, y + k, c[1]);
    }
    if (style !== 'root') for (let k = 3; k < h; k += 7) { const s = (k / 7) % 2 ? 1 : -1; ellipse(g, cx + s * 4, y + k, 2.6, 1.6, c[1]); px(g, cx + s * 5, y + k - 1, c[2]); }
  }

  // ------------------------------------------------------------------ hazards: thorns / bone spikes / crystals / embers, n tiles at tile row y
  function spikes(g, style, x, y, n) {
    const w = n * 16, base = y + 16;
    if (style === 'thorns') {
      for (let k = 0; k < w; k += 5) ellipse(g, x + k + 2, base - 4, 4, 4, k % 2 ? '#3a2410' : '#4e3018');
      for (let k = 1; k < w; k += 3) {
        const hh = 7 + hash(x + k, y) * 6;
        stroke(g, [[x + k, base - 2], [x + k + (hash(k, y) - 0.5) * 6, base - hh]], 0.5, '#5a3a1a');
        px(g, x + k + (hash(k, y) - 0.5) * 6, base - hh, '#e8d0a0');
      }
      return;
    }
    if (style === 'bones') {
      for (let k = 0; k < w; k += 4) { poly(g, [[x + k, base], [x + k + 2, base - 9 - (k % 8 ? 0 : 3)], [x + k + 4, base]], '#e8e2cc'); rect(g, x + k + 2, base - 7, 1, 6, '#9a947e'); }
      rect(g, x, base - 2, w, 2, '#5a5648');
      return;
    }
    if (style === 'crystals') {
      for (let k = 0; k < w; k += 5) { const c = hash(k, y) < 0.5 ? ['#2a8a9a', '#5ae0f0', '#d0ffff'] : ['#8a2a9a', '#e05af0', '#ffd0ff']; poly(g, [[x + k, base], [x + k + 2.5, base - 10 - hash(x + k, 2) * 4], [x + k + 5, base]], c[1]); rect(g, x + k + 2, base - 8, 1, 6, c[2]); rect(g, x + k + 3, base - 6, 1, 5, c[0]); }
      return;
    }
    // embers: a bed of glowing coals (the flicker is drawn live)
    for (let k = 0; k < w; k += 4) ellipse(g, x + k + 2, base - 3, 3, 3, hash(k, y) < 0.5 ? '#3a0e06' : '#5a1a0a');
    for (let k = 0; k < w; k += 3) px(g, x + k, base - 4, '#c83a0a');
  }

  // ------------------------------------------------------------------ small decorations on surfaces (x = tile left, y = surface)
  const DECOR = {
    tuft(g, x, y, s) { for (let k = 0; k < 5; k++) stroke(g, [[x + 4 + k * 2, y], [x + 3 + k * 2.4 + (k - 2), y - 4 - (k % 2) * 3]], 0.5, k % 2 ? '#c8a838' : '#8a7a28'); },
    tuftdry(g, x, y) { for (let k = 0; k < 4; k++) stroke(g, [[x + 4 + k * 2, y], [x + 4 + k * 3 - 3, y - 3 - (k % 2) * 3]], 0.5, k % 2 ? '#c8945a' : '#8a6038'); },
    tuftburnt(g, x, y) { for (let k = 0; k < 4; k++) stroke(g, [[x + 4 + k * 2, y], [x + 4 + k * 3 - 3, y - 3 - (k % 2) * 2]], 0.5, k % 2 ? '#3a2414' : '#1a0e08'); px(g, x + 6, y - 4, '#ff8a2a'); },
    rock(g, x, y, s, th) { const R = Themes.T[th].terrain.ramp; ellipse(g, x + 8, y - 2, 5, 3, R[0]); ellipse(g, x + 7, y - 3, 4, 2, R[2]); px(g, x + 6, y - 4, R[4]); },
    ashrock(g, x, y) { ellipse(g, x + 8, y - 2, 5, 3, '#0a0606'); ellipse(g, x + 7, y - 3, 4, 2, '#2a2220'); px(g, x + 6, y - 4, '#5a4a44'); },
    glowrock(g, x, y) { ellipse(g, x + 8, y - 2, 4, 3, '#1a0806'); px(g, x + 7, y - 3, '#ff6a1a'); px(g, x + 9, y - 2, '#ffb040'); },
    flower(g, x, y) { const c = hash(x, y) < 0.5 ? '#ff5a6a' : '#ffd040'; stroke(g, [[x + 8, y], [x + 8, y - 6]], 0.5, '#3a7a2a'); ellipse(g, x + 8, y - 7, 2, 2, c); px(g, x + 8, y - 7, '#fff6c0'); px(g, x + 6, y - 3, '#4a9a3a'); },
    termite(g, x, y) { poly(g, [[x + 2, y], [x + 6, y - 16], [x + 9, y - 22], [x + 11, y - 14], [x + 14, y]], '#8a4a28'); poly(g, [[x + 6, y - 16], [x + 9, y - 22], [x + 9, y]], '#a8603a'); px(g, x + 8, y - 8, '#4a2414'); },
    bone(g, x, y) { rect(g, x + 4, y - 2, 8, 2, '#e8e2cc'); ellipse(g, x + 4, y - 2, 1.6, 1.6, '#f4f0dc'); ellipse(g, x + 12, y - 2, 1.6, 1.6, '#f4f0dc'); px(g, x + 6, y - 1, '#9a947e'); },
    skullsmall(g, x, y) { ellipse(g, x + 8, y - 4, 5, 4, '#e8e2cc'); rect(g, x + 5, y - 2, 6, 2, '#d8d2bc'); px(g, x + 6, y - 4, '#2a2a20'); px(g, x + 10, y - 4, '#2a2a20'); px(g, x + 7, y - 1, '#2a2a20'); px(g, x + 9, y - 1, '#2a2a20'); },
    aloe(g, x, y) { for (let k = -2; k <= 2; k++) poly(g, [[x + 7 + k, y], [x + 8 + k * 3, y - 9 + Math.abs(k) * 2], [x + 9 + k, y]], k % 2 ? '#4a7a5a' : '#6a9a6a'); },
    thornbush(g, x, y) { ellipse(g, x + 8, y - 4, 7, 4, '#3a2018'); for (let k = 0; k < 8; k++) { const a = Math.PI + k / 7 * Math.PI; px(g, x + 8 + Math.cos(a) * 9, y - 4 + Math.sin(a) * 6, '#d8b890'); } },
    fern(g, x, y) { for (let k = -2; k <= 2; k++) stroke(g, [[x + 8, y], [x + 8 + k * 3, y - 6 + Math.abs(k)], [x + 8 + k * 5, y - 4 + Math.abs(k) * 2]], 0.6, k % 2 ? '#2a7a2a' : '#4aa83a'); },
    fernblue(g, x, y) { for (let k = -2; k <= 2; k++) stroke(g, [[x + 8, y], [x + 8 + k * 3, y - 6 + Math.abs(k)], [x + 8 + k * 5, y - 4 + Math.abs(k) * 2]], 0.6, k % 2 ? '#1a3a5a' : '#2a5a7a'); },
    mushroom(g, x, y) { rect(g, x + 7, y - 4, 2, 4, '#f0e8d0'); ellipse(g, x + 8, y - 5, 4, 2.4, '#d83a2a'); px(g, x + 6, y - 6, '#ffffff'); px(g, x + 9, y - 5, '#ffffff'); },
    glowshroom(g, x, y) { rect(g, x + 7, y - 4, 2, 4, '#a8c8d8'); ellipse(g, x + 8, y - 5, 4, 2.4, '#3ae0c8'); px(g, x + 6, y - 6, '#d0fff0'); ellipse(g, x + 12, y - 2, 2, 1.4, '#3ab0e0'); },
    reed(g, x, y) { for (let k = 0; k < 4; k++) stroke(g, [[x + 4 + k * 3, y], [x + 4 + k * 3 + (k - 1.5), y - 10 - (k % 2) * 4]], 0.5, '#4a7a3a'); ellipse(g, x + 8, y - 13, 1, 2.4, '#6a4a2a'); },
    stalag(g, x, y, s, th) { const R = Themes.T[th].terrain.ramp; poly(g, [[x + 4, y], [x + 8, y - 12], [x + 12, y]], R[1]); poly(g, [[x + 6, y], [x + 8, y - 12], [x + 8, y]], R[3]); },
    crystal(g, x, y) { const c = hash(x, y) < 0.5 ? ['#2a8a9a', '#5ae0f0', '#d0ffff'] : ['#8a2a9a', '#e05af0', '#ffd0ff']; poly(g, [[x + 5, y], [x + 8, y - 11], [x + 11, y]], c[1]); poly(g, [[x + 8, y], [x + 8, y - 11], [x + 11, y]], c[0]); px(g, x + 7, y - 6, c[2]); },
    stump(g, x, y) { rect(g, x + 4, y - 7, 8, 7, '#140a06'); rect(g, x + 5, y - 7, 6, 1, '#3a2414'); px(g, x + 6, y - 5, '#ff6a1a'); },
    flame(g, x, y) { poly(g, [[x + 4, y], [x + 7, y - 9], [x + 9, y - 4], [x + 11, y - 11], [x + 13, y]], '#c83a0a'); poly(g, [[x + 6, y], [x + 8, y - 6], [x + 11, y]], '#ffb03a'); }
  };
  // big background trees standing on a surface (x = centre, y = surface)
  function tree(g, kind, x, y, s) {
    const H = Themes.helpers;
    switch (kind) {
      case 'acacia': H.acacia(g, x, y, 2.2 * s, '#3a1e10', '#4a6a1e', '#6a8a2a'); break;
      case 'deadtree': H.deadTree(g, x, y, 2.2 * s, '#2a2020'); break;
      case 'jungle': H.jungleTree(g, x, y, 1.1 * s, '#3a2a14', ['#1e5a24', '#2a6a2a', '#348a34']); break;
      case 'nighttree': H.jungleTree(g, x, y, 1.1 * s, '#141a2a', ['#16243a', '#1c2e48', '#243a58']); break;
      case 'charred': H.deadTree(g, x, y, 2.2 * s, '#120808'); break;
    }
  }

  // ------------------------------------------------------------------ animated: breakable blocks
  function breakable(g, style, x, y, theme, crack) {
    const R = Themes.T[theme].terrain.ramp;
    const c = style === 'bonewall' ? ['#5a5648', '#a8a28c', '#d8d2bc', '#f4f0dc'] : style === 'log' ? ['#2a160a', '#5e3818', '#86542a', '#b07a40'] : style === 'crystalrock' ? ['#2a1a4a', '#4a3a8a', '#6a5ac0', '#c0b8ff'] : [R[0], R[2], R[3], R[4]];
    rect(g, x, y, 16, 16, c[0]); rect(g, x + 1, y + 1, 14, 14, c[1]); rect(g, x + 1, y + 1, 14, 3, c[2]); rect(g, x + 1, y + 1, 3, 14, c[2]); px(g, x + 2, y + 2, c[3]);
    if (style === 'log') { rect(g, x + 1, y + 7, 14, 1, c[0]); ellipse(g, x + 8, y + 4, 2, 1, c[0]); }
    const cr = c[0];
    rect(g, x + 7, y + 3, 1, 4, cr); rect(g, x + 8, y + 7, 1, 3, cr); rect(g, x + 6, y + 9, 3, 1, cr); rect(g, x + 4, y + 11, 2, 1, cr); rect(g, x + 10, y + 10, 2, 1, cr);
    if (crack) { rect(g, x + 3, y + 5, 3, 1, cr); rect(g, x + 11, y + 4, 1, 4, cr); rect(g, x + 9, y + 12, 4, 1, cr); }
  }

  // ------------------------------------------------------------------ animated: liquids. x0..x1 world px, surface y, bottom y; cam offsets applied by caller
  const LIQ = {
    water: { top: '#e8f8ff', surf: ['#78c8f0', '#4aa0e0'], body: ['#2a70c0', '#2060b0', '#1a4a90'], hl: '#a8e0ff' },
    tar: { top: '#6a7a5a', surf: ['#3a4a32', '#2a3824'], body: ['#1e2a1a', '#1a2416', '#141c12'], hl: '#5a6a4a' },
    lava: { top: '#fff0a0', surf: ['#ffb030', '#ff7a10'], body: ['#e04a0a', '#c8380a', '#a02808'], hl: '#ffe060' }
  };
  function liquid(g, kind, sx, sy, w, h, t, worldX) {
    const L = LIQ[kind] || LIQ.water;
    // body bands that shimmer
    rect(g, sx, sy + 4, w, h - 4, L.body[0]);
    for (let y = 8; y < h; y += 6) {
      const band = ((y / 6) | 0) % 3;
      rect(g, sx, sy + y, w, 3, L.body[band]);
    }
    for (let x = 0; x < w; x += 2) {
      const wx = worldX + x, ph = Math.sin(wx * 0.12 + t * 3) + Math.sin(wx * 0.05 - t * 2);
      const top = Math.round(ph * 1.2);
      rect(g, sx + x, sy + 1 + top, 2, 3 - top, L.surf[0]);
      if (ph > 1.2) rect(g, sx + x, sy + top, 2, 1, L.top);
      if (((wx + Math.floor(t * 20)) % 23) === 0) rect(g, sx + x, sy + 6 + ((wx * 7) % 20), 4, 1, L.hl);
    }
    if (kind === 'lava') for (let x = 0; x < w; x += 9) { const wx = worldX + x; if (Math.sin(wx * 1.7 + t * 4) > 0.95) ellipse(g, sx + x, sy, 2, 2, L.top); }
  }
  function waterfall(g, sx, sy, h, t, worldX) {
    const cols = ['#c8ecff', '#ffffff', '#88c8f0', '#a8dcff', '#e8f8ff'];
    for (let x = 0; x < 16; x++) {
      const c = cols[(x * 3 + ((t * 30 + x * 7 + worldX) | 0) ) % cols.length];
      rect(g, sx + x, sy, 1, h, x % 5 === 0 ? '#78b8e8' : c);
    }
    for (let k = 0; k < 6; k++) { const yy = ((t * 120 + k * 37 + worldX * 3) % h); rect(g, sx + (k * 5 + worldX) % 14, sy + yy, 2, 6, '#ffffff'); }
  }

  return { platform, hang, climb, spikes, DECOR, tree, breakable, liquid, waterfall, LIQ };
})();
