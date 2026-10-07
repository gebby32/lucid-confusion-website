/* ============================================================================
   LUCID PLUMBING — LCD display
   The game draws into LP.LCD.ctx, a plain Canvas 2D context at the internal game
   resolution (config.lcd.width x height). Draw however you like: the helpers below,
   drawImage, paths... present() then converts the frame for the handheld screen:

     palette mode (config.lcd.palette = [lightest ... darkest]):
       every pixel's brightness picks a palette shade. Draw with LP.LCD.C[i]
       (greys that map exactly to shade i; 0 = lightest). Any colour works — it is
       mapped by luminance.
     colour mode (palette: null): pixels pass through unchanged apart from contrast.

   Then: contrast (settings 1..5, gameplay display only), optional ghosting (LCD
   smear), invert flash (LP.FX.flash), nearest-neighbour upscale to an integer
   multiple, optional pixel-grid gaps. Clear the screen every frame.

   Additions for full-screen (monitor) games:
     L.post = (octx, k) => {...}   optional hook drawn at OUTPUT resolution after each
                                   frame is scaled (k = output pixels per game pixel),
                                   e.g. high-resolution title artwork. null = off.
     config.lcd.scanlines / L.setScanlines(alpha)   CRT scanlines (0 = off, k >= 3 only)
     L.FONT                        the 3x5 glyph table, for games building coloured text
     config.lcd.direct: true       FULL-COLOUR fast path: no per-pixel pass at all (palette,
                                   contrast and ghosting are skipped; the invert flash still
                                   works). The frame canvas stays GPU-backed and is simply
                                   scaled to the screen — for busy full-colour games (Sloth Run).
   ============================================================================ */
'use strict';
(function () {
  const CONTRAST = [0.62, 0.78, 0.9, 1.0, 1.12];            // contrast levels 1..5
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  // 3x5 pixel font: 5 rows, each digit is a 3-bit row mask (4 = left pixel)
  const FONT = {
    A: '25755', B: '65656', C: '34443', D: '65556', E: '74647', F: '74644', G: '34553', H: '55755', I: '72227',
    J: '11152', K: '55655', L: '44447', M: '57755', N: '65555', O: '25552', P: '65644', Q: '25563', R: '65655',
    S: '34216', T: '72222', U: '55557', V: '55552', W: '55775', X: '55255', Y: '55222', Z: '71247',
    0: '75557', 1: '26227', 2: '61247', 3: '61216', 4: '55711', 5: '74616', 6: '34757', 7: '71222', 8: '75757', 9: '75716',
    '!': '22202', '?': '61202', '.': '00002', ',': '00012', ':': '02020', '-': '00700', '+': '02720', '/': '11244',
    "'": '22000', '<': '12421', '>': '42124', '(': '12221', ')': '42224', '=': '07070', '*': '52725', '#': '57575',
    '%': '51245', '_': '00007', ' ': '00000'
  };
  const OUT8 = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]];

  const L = {
    W: 240, H: 144, k: 1, N: 4, C: [], palette: null, contrast: 3, ghost: 0, invert: 0,
    ctx: null, buf: null, out: null, octx: null, show: null, sctx: null, img: null, prev: null, prevOk: false,
    gridColor: null, gridImg: null, _pat: {}, post: null, scan: 0, scanImg: null, FONT
  };

  function rgb(hex) { const n = parseInt(hex.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  L.makeCanvas = function (w, h) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').imageSmoothingEnabled = false;
    return c;
  };

  L.init = function (cfg, outCanvas) {
    cfg = cfg || {};
    L.W = cfg.width || 240; L.H = cfg.height || 144;
    L.buf = document.createElement('canvas'); L.buf.width = L.W; L.buf.height = L.H;
    L.direct = !!cfg.direct && !cfg.palette;
    L.ctx = L.buf.getContext('2d', L.direct ? {} : { willReadFrequently: true });
    L.ctx.imageSmoothingEnabled = false;
    L.show = L.makeCanvas(L.W, L.H); L.sctx = L.show.getContext('2d');
    L.img = L.sctx.createImageData(L.W, L.H);
    L.prev = new Float32Array(L.W * L.H * 3); L.prevOk = false;
    L.out = outCanvas; L.octx = outCanvas.getContext('2d', { alpha: false });
    L.ghost = cfg.ghost || 0; L.gridColor = cfg.grid || null; L.k = 0; L._pat = {};
    L.scan = cfg.scanlines || 0; L.scanImg = null;
    L.setPalette(cfg.palette || null);
  };

  // palette: array of '#rrggbb' from lightest to darkest, or null for colour mode
  L.setPalette = function (p) {
    L.palette = p ? p.map(rgb) : null;
    L.N = p ? p.length : 4;
    L.C = [];
    for (let i = 0; i < L.N; i++) { const v = Math.round(255 * (1 - i / (L.N - 1))); L.C.push('rgb(' + v + ',' + v + ',' + v + ')'); }
    L._pat = {};
    buildLut();
  };
  L.setContrast = function (level) { L.contrast = LP.clamp(Math.round(level) || 3, 1, 5); buildLut(); };
  L.resetGhost = function () { L.prevOk = false; };

  function buildLut() {
    const k = CONTRAST[L.contrast - 1];
    if (L.palette) {
      const a = L.palette[0], b = L.palette[L.palette.length - 1], mid = [0, 1, 2].map((i) => (a[i] + b[i]) / 2);
      L.lut = L.palette.map((c) => c.map((v, i) => LP.clamp(Math.round(mid[i] + (v - mid[i]) * k), 0, 255)));
    } else {
      L.lutD = new Uint8Array(256);
      for (let v = 0; v < 256; v++) L.lutD[v] = LP.clamp(Math.round(128 + (v - 128) * k), 0, 255);
    }
  }

  // Called by LP.Shell.fit(): the visible canvas becomes (W*k) x (H*k).
  L.setScale = function (k) {
    if (!L.out || k === L.k) return;
    L.k = k; L.out.width = L.W * k; L.out.height = L.H * k;
    L.gridImg = null;
    if (L.gridColor && k >= 3) {
      L.gridImg = L.makeCanvas(L.W * k, L.H * k);
      const g = L.gridImg.getContext('2d');
      g.fillStyle = L.gridColor;
      for (let x = 1; x < L.W; x++) g.fillRect(x * k, 0, 1, L.H * k);
      for (let y = 1; y < L.H; y++) g.fillRect(0, y * k, L.W * k, 1);
    }
    buildScan();
  };

  // CRT scanlines: a dark band along the bottom of every game pixel row.
  function buildScan() {
    L.scanImg = null;
    if (!L.scan || L.k < 3 || !L.out) return;
    L.scanImg = L.makeCanvas(L.W * L.k, L.H * L.k);
    const g = L.scanImg.getContext('2d'), band = Math.max(1, Math.floor(L.k / 3));
    g.fillStyle = 'rgba(0,0,0,' + L.scan + ')';
    for (let y = 0; y < L.H; y++) g.fillRect(0, y * L.k + L.k - band, L.W * L.k, band);
  }
  L.setScanlines = function (alpha) { L.scan = alpha || 0; buildScan(); };

  // Convert the frame and show it. Called by LP.Loop after render().
  L.present = function () {
    if (L.direct) return presentDirect();
    const n = L.W * L.H, src = L.ctx.getImageData(0, 0, L.W, L.H).data, out = L.img.data, prev = L.prev;
    const inv = L.invert > 0, pal = L.palette ? L.lut : null, D = L.lutD, N1 = L.N - 1;
    const keep = L.prevOk ? L.ghost : 0, fresh = 1 - keep;
    for (let i = 0, p = 0, q = 0; i < n; i++, p += 4, q += 3) {
      let r, g, b;
      if (pal) {
        const lum = (src[p] * 77 + src[p + 1] * 150 + src[p + 2] * 29) >> 8;
        let idx = Math.round((255 - lum) * N1 / 255);
        if (inv) idx = N1 - idx;
        const c = pal[idx]; r = c[0]; g = c[1]; b = c[2];
      } else if (inv) { r = D[255 - src[p]]; g = D[255 - src[p + 1]]; b = D[255 - src[p + 2]]; }
      else { r = D[src[p]]; g = D[src[p + 1]]; b = D[src[p + 2]]; }
      if (keep) { r = prev[q] * keep + r * fresh; g = prev[q + 1] * keep + g * fresh; b = prev[q + 2] * keep + b * fresh; }
      prev[q] = r; prev[q + 1] = g; prev[q + 2] = b;
      out[p] = r; out[p + 1] = g; out[p + 2] = b; out[p + 3] = 255;
    }
    L.prevOk = true;
    L.sctx.putImageData(L.img, 0, 0);
    L.octx.imageSmoothingEnabled = false;
    L.octx.drawImage(L.show, 0, 0, L.W * L.k, L.H * L.k);
    if (L.post) { L.octx.save(); L.post(L.octx, L.k); L.octx.restore(); L.octx.imageSmoothingEnabled = false; }
    if (L.gridImg) L.octx.drawImage(L.gridImg, 0, 0);
    if (L.scanImg) L.octx.drawImage(L.scanImg, 0, 0);
  };

  function presentDirect() {
    const o = L.octx, W = L.W * L.k, H = L.H * L.k;
    o.imageSmoothingEnabled = false;
    o.drawImage(L.buf, 0, 0, W, H);
    if (L.invert > 0) { o.save(); o.globalCompositeOperation = 'difference'; o.fillStyle = '#fff'; o.fillRect(0, 0, W, H); o.restore(); }
    if (L.post) { o.save(); L.post(o, L.k); o.restore(); o.imageSmoothingEnabled = false; }
    if (L.gridImg) o.drawImage(L.gridImg, 0, 0);
    if (L.scanImg) o.drawImage(L.scanImg, 0, 0);
  }

  // ------------------------------------------------------------------ drawing helpers
  // s = shade index (0 = lightest). All coordinates snap to whole pixels.
  L.clear = (s) => L.rect(0, 0, L.W, L.H, s || 0);
  L.rect = function (x, y, w, h, s) { L.ctx.fillStyle = L.C[s]; L.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  L.px = function (x, y, s) { L.ctx.fillStyle = L.C[s]; L.ctx.fillRect(Math.round(x), Math.round(y), 1, 1); };
  L.frame = function (x, y, w, h, s) { L.rect(x, y, w, 1, s); L.rect(x, y + h - 1, w, 1, s); L.rect(x, y, 1, h, s); L.rect(x + w - 1, y, 1, h, s); };
  L.line = function (x0, y0, x1, y1, s) {
    L.ctx.fillStyle = L.C[s];
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (let n = 0; n < 2000; n++) {
      L.ctx.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  };
  L.disc = function (cx, cy, r, s) {
    L.ctx.fillStyle = L.C[s]; cx = Math.round(cx); cy = Math.round(cy); r = Math.round(r);
    for (let y = -r; y <= r; y++) { const hw = Math.floor(Math.sqrt(r * r - y * y + r * 0.6)); L.ctx.fillRect(cx - hw, cy + y, hw * 2 + 1, 1); }
  };
  // Ordered (Bayer 4x4) dither: paint `level` of 16 pixels with shade s, leave the rest untouched.
  // ox/oy anchor the pattern (pass camera offsets so the dither scrolls with the world).
  L.dither = function (x, y, w, h, s, level, ox, oy) {
    level = LP.clamp(Math.round(level), 0, 16);
    if (level === 0) return;
    if (level === 16) return L.rect(x, y, w, h, s);
    const key = s + '_' + level;
    let pat = L._pat[key];
    if (!pat) {
      const c = L.makeCanvas(4, 4), g = c.getContext('2d');
      g.fillStyle = L.C[s];
      for (let i = 0; i < 16; i++) if (BAYER[i] < level) g.fillRect(i & 3, i >> 2, 1, 1);
      pat = L._pat[key] = L.ctx.createPattern(c, 'repeat');
    }
    if (pat.setTransform) pat.setTransform(new DOMMatrix([1, 0, 0, 1, -Math.round(ox || 0), -Math.round(oy || 0)]));
    L.ctx.fillStyle = pat;
    L.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  L.bayer = (x, y) => BAYER[((y & 3) << 2) | (x & 3)];   // 0..15, for custom per-pixel dithering
  // Draw an image / canvas at whole pixels; flip = true mirrors horizontally around its own width.
  L.sprite = function (img, x, y, flip) {
    x = Math.round(x); y = Math.round(y);
    if (!flip) return L.ctx.drawImage(img, x, y);
    L.ctx.save(); L.ctx.translate(x + img.width, y); L.ctx.scale(-1, 1); L.ctx.drawImage(img, 0, 0); L.ctx.restore();
  };

  // 3x5 pixel text. o = { scale: 1, align: 'left' | 'center' | 'right', outline: shade }
  function glyphs(str, x, y, s, sc) {
    L.ctx.fillStyle = L.C[s];
    for (const ch of str) {
      const g = FONT[ch];
      if (g) for (let r = 0; r < 5; r++) { const bits = +g[r]; for (let c = 0; c < 3; c++) if (bits & (4 >> c)) L.ctx.fillRect(x + c * sc, y + r * sc, sc, sc); }
      x += 4 * sc;
    }
  }
  L.textWidth = (str, scale) => { const sc = scale || 1; return String(str).length * 4 * sc - sc; };
  L.text = function (str, x, y, s, o) {
    o = o || {};
    str = String(str).toUpperCase();
    const sc = o.scale || 1;
    x = Math.round(x); y = Math.round(y);
    if (o.align === 'center') x = Math.round(x - L.textWidth(str, sc) / 2);
    else if (o.align === 'right') x -= L.textWidth(str, sc);
    if (o.outline !== undefined) for (const d of OUT8) glyphs(str, x + d[0], y + d[1], o.outline, sc);
    glyphs(str, x, y, s, sc);
  };

  LP.LCD = L;
})();
