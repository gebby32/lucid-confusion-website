/* ITEMS — the ridiculous collectibles popped enemies turn into (food, treasure) and the
   temporary power-ups. Items fall, land, wait ~9 s (blinking at the end) and are grabbed
   on touch. Power-ups are bubble capsules with a letter, like a proper cartridge. */
'use strict';
const POWERS = {
  rapid: { name: 'RAPID BUBBLE', glyph: 'R', color: '#f83800', time: 14 },
  long: { name: 'LONG SHOT', glyph: 'L', color: '#3cbcfc', time: 14 },
  giant: { name: 'GIANT BUBBLE', glyph: 'G', color: '#d800cc', time: 14 },
  triple: { name: 'TRIPLE BUBBLE', glyph: '3', color: '#00a800', time: 14 },
  speed: { name: 'SPEED SLOTH', glyph: 'S', color: '#f8b800', time: 10 },
  jump: { name: 'SUPER JUMP', glyph: 'J', color: '#58f898', time: 14 },
  shield: { name: 'BUBBLE SHIELD', glyph: '+', color: '#a4e4fc', time: 40 },
  vacuum: { name: 'VACUUM', glyph: 'V', color: '#9878f8', time: 16 },
  freeze: { name: 'FREEZE', glyph: 'F', color: '#fcfcfc', time: 6 },
  rainbow: { name: 'RAINBOW BUBBLE', glyph: '*', color: '#f878f8', time: 12 }
};
const POWER_ODDS = [['rapid', 14], ['long', 12], ['giant', 10], ['triple', 10], ['speed', 10], ['jump', 10], ['shield', 10], ['vacuum', 8], ['freeze', 8], ['rainbow', 4]];

const Items = (function () {
  const icons = {};
  const It = {
    list: [],
    reset() { It.list.length = 0; },

    icon(id) {
      if (icons[id]) return icons[id];
      const p = POWERS[id];
      return (icons[id] = G.make(11, 11, (g) => {
        G.ellipse(5, 5, 5, 5, '#000', g); G.ellipse(5, 5, 4, 4, p.color, g); G.ellipse(5, 5, 3, 3, '#000', g);
        g.fillStyle = '#fcfcfc'; g.fillRect(2, 2, 2, 1); g.fillRect(2, 3, 1, 1);
        Font.draw(g, p.glyph, 4, 3, id === 'freeze' ? '#3cbcfc' : '#fcfcfc', { face: 'small' });
      }));
    },

    // food chosen by world progress + how many enemies died in the same pop chain
    dropFood(x, y, bonus) {
      const world = LevelInfo.world(World.n);
      const base = Math.min(3, Math.floor(world / 2.6));
      const top = Math.min(4, base + (bonus || 0));
      const pool = Sprites.FOOD.filter((f) => f[2] >= Math.max(0, base - 1) && f[2] <= top);
      // rarer items: weight falls off with tier
      let tot = 0; const wts = pool.map((f) => { const w = 1 / (1 + f[2] * 0.8 + (f[1] > 9000 ? 3 : 0)); tot += w; return w; });
      let r = Math.random() * tot, pick = pool[0];
      for (let i = 0; i < pool.length; i++) { r -= wts[i]; if (r <= 0) { pick = pool[i]; break; } }
      It.spawn(x, y, { kind: 'food', name: pick[0], pts: pick[1], rare: pick[2] >= 3 });
    },
    dropPower(x, y, id) {
      if (!id) {
        let tot = 0; for (const o of POWER_ODDS) tot += o[1];
        let r = Math.random() * tot; id = POWER_ODDS[0][0];
        for (const o of POWER_ODDS) { r -= o[1]; if (r <= 0) { id = o[0]; break; } }
      }
      It.spawn(x, y, { kind: 'power', id });
    },
    spawn(x, y, o) {
      const it = Object.assign({ x: LP.clamp(x, 22, 234), y: Math.min(y, 183), w: 10, h: 10, vx: LP.rand(-0.6, 0.6), vy: -1.6, t: 0, life: 9 * 60, onGround: false }, o);
      It.list.push(it);
      if (It.list.length > 40) It.list.shift();
      return it;
    },

    update() {
      for (const it of It.list) {
        it.t++;
        // vacuum power-up pulls nearby goodies in
        const v = Players.vacuumNear(it);
        if (v) { it.x += (v.x - it.x) * 0.08; it.y += (v.y - 6 - it.y) * 0.08; it.vy = 0; it.onGround = false; continue; }
        it.vy = Math.min(2.4, it.vy + 0.14);
        if (it.onGround) it.vx *= 0.8;
        World.move(it);
        if (it.y > World.BOT) it.y = World.BOT;
      }
      LP.prune(It.list, (it) => it.t > it.life || it.taken);
    },
    collect(it, p) {
      if (it.taken) return;
      it.taken = true;
      if (it.kind === 'food') {
        Game.addScore(p, it.pts, it.x, it.y - 10, it.rare ? '#f8b800' : '#fcfcfc');
        LP.Audio.play(it.rare ? 'treasure' : 'pickup');
        G.burst(it.x, it.y - 4, it.rare ? 10 : 5, it.rare ? '#f8b800' : '#fcfcfc', { speed: 1.2, life: 18 });
      } else {
        Players.givePower(p, it.id);
        Game.addScore(p, 500, it.x, it.y - 10, POWERS[it.id].color);
        Game.banner(POWERS[it.id].name + '!', POWERS[it.id].color, 70, it.y < 60 ? 150 : 40);
        LP.Audio.play('powerup');
        G.burst(it.x, it.y - 4, 10, POWERS[it.id].color, { speed: 1.5, life: 20 });
      }
    },

    draw() {
      for (const it of It.list) {
        if (it.t > it.life - 120 && (it.t >> 2) % 2) continue;
        const bob = it.onGround ? 0 : 0;
        if (it.kind === 'food') {
          const img = Sprites.item(it.name);
          G.draw(img, it.x - (img.width >> 1), it.y - img.height + bob);
          if (it.rare && (it.t >> 3) % 2) G.px(it.x + 4, it.y - img.height - 1, '#fcfcfc');
        } else {
          const img = It.icon(it.id), up = Math.round(Math.sin(it.t * 0.12));
          G.draw(img, it.x - 5, it.y - 11 + up);
        }
      }
    }
  };
  return It;
})();
