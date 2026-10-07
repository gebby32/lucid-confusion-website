/* LIGHTS — the late-night look.
   Every frame a light map is built: a dusky ambient colour, then additive glow sprites
   (street lamps, neon spill, headlights, sirens, muzzle flashes, explosions, the
   helicopter spotlight). The map is MULTIPLIED over the ground + street layer, so
   lit areas keep full colour and the rest sinks into blue night. Buildings, neon
   signs, fire and the HUD are drawn afterwards at full brightness. */
'use strict';
const Lights = (function () {
  const L = { canvas: null, ctx: null, ambient: '#8c86b8', cache: new Map(), cones: [], tmp: [] };

  function rgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  L.rgba = rgba;

  L.init = function () { L.canvas = G.canvas(G.W, G.H); L.ctx = L.canvas.getContext('2d'); };

  // soft radial glow sprite (cached by colour / radius / strength)
  L.glow = function (col, r, a) {
    r = Math.max(4, Math.round(r / 4) * 4); a = Math.round(a * 20) / 20;
    const key = col + '|' + r + '|' + a;
    let c = L.cache.get(key);
    if (c) return c;
    c = document.createElement('canvas'); c.width = c.height = r * 2;
    const g = c.getContext('2d'), gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, rgba(col, a)); gr.addColorStop(0.35, rgba(col, a * 0.6)); gr.addColorStop(0.7, rgba(col, a * 0.2)); gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2);
    if (L.cache.size > 600) L.cache.delete(L.cache.keys().next().value);
    L.cache.set(key, c);
    return c;
  };
  // headlight beam pointing along +x from the sprite centre, 32 rotations
  function cone(i) {
    if (L.cones[i]) return L.cones[i];
    const R = 96, c = document.createElement('canvas'); c.width = c.height = R * 2;
    const g = c.getContext('2d');
    g.translate(R, R); g.rotate(i / 32 * Math.PI * 2);
    const gr = g.createRadialGradient(0, 0, 4, 0, 0, R);
    gr.addColorStop(0, 'rgba(255,244,210,0.55)'); gr.addColorStop(0.5, 'rgba(255,240,200,0.25)'); gr.addColorStop(1, 'rgba(255,240,200,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(4, -5); g.lineTo(R, -34); g.lineTo(R, 34); g.lineTo(4, 5); g.closePath(); g.fill();
    return (L.cones[i] = c);
  }

  L.begin = function () {
    const g = L.ctx;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = L.ambient; g.fillRect(0, 0, G.W, G.H);
    g.globalCompositeOperation = 'lighter';
  };
  // screen-space additions
  L.add = function (x, y, r, col, a) {
    if (x < -r || y < -r || x > G.W + r || y > G.H + r) return;
    const s = L.glow(col, r, a === undefined ? 0.8 : a);
    L.ctx.drawImage(s, Math.round(x - s.width / 2), Math.round(y - s.height / 2));
  };
  L.beam = function (x, y, ang) {
    const i = ((Math.round(ang / (Math.PI * 2) * 32) % 32) + 32) % 32, c = cone(i);
    L.ctx.drawImage(c, Math.round(x - c.width / 2), Math.round(y - c.height / 2));
  };
  // static city lights in view
  L.city = function (camX, camY, time) {
    const list = City.lightsIn(camX - 100, camY - 100, camX + G.W + 100, camY + G.H + 100, L.tmp);
    for (const l of list) {
      let a = l.a === undefined ? 0.8 : l.a;
      if (l.neon) a *= 0.85 + 0.15 * Math.sin(time * 3 + l.x);
      L.add(l.x - camX, l.y - camY, l.r, l.col, a);
    }
  };
  L.apply = function (g) {
    g.globalCompositeOperation = 'multiply';
    g.drawImage(L.canvas, 0, 0);
    g.globalCompositeOperation = 'source-over';
  };
  return L;
})();
