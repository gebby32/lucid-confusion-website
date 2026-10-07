/* BACKDROP — black space, twinkling stars, a dim planet or two (the scenery changes
   each wave), and Earth's icy horizon along the bottom of the screen. */
'use strict';
const Backdrop = {
  stars: [], scene: 0,
  COLORS: ['#ffffff', '#ffffff', '#9ae8ff', '#ffd040', '#ff7a7a', '#7a9aff', '#c8c8d8'],
  SCENES: [
    [['ringed', 2, 20], ['moon', 352, 22]],
    [['earth', 344, 116], ['mars', 18, 34]],
    [['moon', 8, 60], ['ringed', 324, 40]],
    [['mars', 350, 30], ['earth', 10, 120]],
    [['ringed', 330, 110], ['moon', 20, 30]]
  ],

  init() {
    const st = [];
    for (let i = 0; i < 110; i++) {
      st.push({
        x: LP.randi(0, 383), y: LP.randi(19, 200), c: LP.pick(Backdrop.COLORS),
        ph: Math.random() * 6.3, sp: LP.rand(0.6, 2.6), big: LP.chance(0.06), dim: LP.chance(0.55)
      });
    }
    Backdrop.stars = st;
  },
  setWave(w) { Backdrop.scene = (w - 1) % Backdrop.SCENES.length; },

  draw(t, opts) {
    const g = LP.LCD.ctx;
    G.rect(0, 0, 384, 216, '#000');
    // planets first, dim, so nothing important ever hides behind them
    if (!opts || opts.planets !== false) {
      g.globalAlpha = 0.55;
      for (const [name, x, y] of Backdrop.SCENES[Backdrop.scene]) g.drawImage(Sprites[name], x, y);
      g.globalAlpha = 1;
    }
    for (const s of Backdrop.stars) {
      const tw = Math.sin(t * s.sp + s.ph);
      if (s.dim && tw < -0.3) continue;
      g.fillStyle = s.dim ? '#5a5a7a' : s.c;
      g.fillRect(s.x, s.y, 1, 1);
      if (s.big && tw > 0.2) { g.fillRect(s.x - 1, s.y, 3, 1); g.fillRect(s.x, s.y - 1, 1, 3); }
    }
    if (!opts || opts.ground !== false) Backdrop.ground(t);
  },

  // Earth's icy horizon: penguin country
  ground(t) {
    G.rect(0, 204, 384, 1, '#58d8ff');
    G.rect(0, 205, 384, 1, '#1a5aa8');
    for (let x = 0; x < 384; x += 16) G.rect(x + ((x / 16) % 3) * 3, 206, 4, 1, '#0a2a5a');
  }
};
