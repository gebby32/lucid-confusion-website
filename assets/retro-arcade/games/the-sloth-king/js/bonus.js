/* BONUS — "GRUB GRAB WITH TOOTS": a 30-second catching game reached from Toots' hidden nests.
   Toots flies back and forth dropping treats; Slothba runs (and jumps) to catch them.
   Golden leaves, juicy grubs and mangos are good; rocks stun you for a moment.
   20 catches earn an extra life, 35 earn two. Then it's back to the act. */
'use strict';
const Bonus = (function () {
  const B = { t: 0, x: 160, vx: 0, y: 200, vy: 0, facing: 1, items: [], caught: 0, missed: 0, stun: 0, tootsX: 160, tootsV: 1.4, done: 0, dist: 0, streak: 0 };
  const FLOOR = 204, DUR = 30 * 60;
  function drop() {
    const r = Math.random(), bad = r < 0.18 + Math.min(0.12, B.t / DUR * 0.12);
    const kind = bad ? 'rock' : r < 0.55 ? 'leaf' : r < 0.85 ? 'grub' : 'mango';
    B.items.push({ kind, x: B.tootsX, y: 44, vy: 0.4, vx: (Math.random() - 0.5) * 0.6, t: 0 });
  }
  const grub = Art.build(14, 10, 7, 5, (g) => { for (let k = 0; k < 4; k++) Art.ell(g, 3 + k * 2.6, 5, 2.2, 2.6 - k * 0.2, 0, k % 2 ? '#f0e0b0' : '#e8c890'); Art.px(g, 11, 4, '#3a2010'); });
  const rock = Art.build(12, 12, 6, 6, (g) => { Art.blob(g, 6, 6, 4.6, 4, 0, ['#4a4a50', '#7a7a84', '#a8a8b0']); });
  LP.States.add({
    bonus: {
      enter() {
        Object.assign(B, { t: 0, x: 160, vx: 0, y: FLOOR, vy: 0, items: [], caught: 0, missed: 0, stun: 0, tootsX: 160, done: 0, streak: 0 });
        LP.Audio.startMusic('bonus'); LP.Input.clearPresses();
      },
      update() {
        B.t++;
        const I = LP.Input;
        if (B.done) { B.done++; if (B.done > 200 || (B.done > 60 && (I.consume('confirm') || I.consume('jump')))) finish(); return; }
        if (B.t < 120) { if (B.t === 1) Sfx('select'); return; }
        const F = Player.F;
        const dir = B.stun > 0 ? 0 : (I.held('right') ? 1 : 0) - (I.held('left') ? 1 : 0);
        if (B.stun > 0) B.stun--;
        if (dir) { B.facing = dir; B.vx = LP.approach(B.vx, dir * F.run * 1.15, 0.3); } else B.vx = LP.approach(B.vx, 0, 0.3);
        B.x = LP.clamp(B.x + B.vx, 14, 306); B.dist += Math.abs(B.vx);
        if (B.y >= FLOOR && I.recent('jump', 5) && B.stun === 0) { B.vy = -5.6; I.consume('jump'); Sfx('jump'); }
        B.vy += I.held('jump') && B.vy < 0 ? 0.26 : 0.42; B.y += B.vy; if (B.y >= FLOOR) { B.y = FLOOR; B.vy = 0; }
        B.tootsX += B.tootsV; if (B.tootsX < 30 || B.tootsX > 290) B.tootsV = -B.tootsV;
        if (B.t % 600 === 0) B.tootsV *= 1.15;
        const every = Math.max(22, 46 - Math.floor(B.t / 120));
        if (B.t % every === 0 && B.t < DUR) drop();
        const h = Player.F.h;
        for (const it of B.items) {
          it.t++; it.vy = Math.min(it.vy + 0.07, 3.2); it.y += it.vy; it.x += it.vx;
          if (Math.abs(it.x - B.x) < 13 && it.y > B.y - h - 4 && it.y < B.y + 2) {
            it.dead = true;
            if (it.kind === 'rock') { B.stun = 50; B.streak = 0; Sfx('hurt'); LP.FX.shake(2, 8); }
            else { B.caught++; B.streak++; Sfx('catch'); G.burst(it.x, it.y, 5, '#fff6a0', { speed: 1.2, life: 14, g: 0 }); }
          } else if (it.y > FLOOR + 6) { it.dead = true; if (it.kind !== 'rock') { B.missed++; B.streak = 0; } }
        }
        LP.prune(B.items, (i) => i.dead);
        LP.FX.update();
        if (B.t >= DUR + 120 && B.items.length === 0) { B.done = 1; LP.Audio.startMusic('clear'); reward(); }
      },
      render(g) {
        Themes.drawBackground(g, 'jungle', B.t * 0.1, 0, 0, B.t / 60);
        g.fillStyle = '#3e2a18'; g.fillRect(0, FLOOR, 320, 40); g.fillStyle = '#4aa83a'; g.fillRect(0, FLOOR, 320, 3);
        for (let x = 0; x < 320; x += 9) Props.DECOR.fern(g, x - 4, FLOOR + 1);
        // Toots overhead
        Art.draw(g, CharArt.get('toots', 'fly', B.t >> 3), B.tootsX, 50, B.tootsV < 0);
        for (const it of B.items) {
          if (it.kind === 'leaf') Art.draw(g, Ents.itemFrame('leaf', (it.t >> 3) & 3), it.x, it.y);
          else if (it.kind === 'mango') Art.draw(g, Ents.itemFrame('mango', 0), it.x, it.y);
          else Art.draw(g, it.kind === 'grub' ? grub : rock, it.x, it.y);
        }
        const look = Player.F.look;
        const anim = B.stun > 0 ? 'hurt' : B.y < FLOOR ? 'jump' : Math.abs(B.vx) > 0.3 ? 'run' : 'idle';
        Art.draw(g, SlothArt.get(look, anim, anim === 'run' ? Math.floor(B.dist / 5.2) : B.t >> 4), B.x, B.y, B.facing < 0);
        LP.FX.draw(0, 0);
        const left = Math.max(0, Math.ceil((DUR + 120 - B.t) / 60) - 2);
        Font.draw(g, 'GRUB GRAB', 160, 6, '#ffe060', { align: 'center', outline: '#2a1000' });
        Font.draw(g, 'CAUGHT ' + B.caught, 10, 22, '#ffffff', { outline: '#2a1000' });
        Font.draw(g, 'TIME ' + Math.min(30, left), 310, 22, '#ffffff', { align: 'right', outline: '#2a1000' });
        if (B.t < 120) {
          S_panel(g, 50, 84, 220, 64);
          Font.draw(g, 'CATCH THE TREATS!', 160, 94, '#ffe060', { align: 'center' });
          Font.draw(g, 'DODGE THE ROCKS', 160, 110, '#ffffff', { align: 'center' });
          Font.draw(g, '20 = 1UP   35 = 2UP', 160, 128, '#7aff9a', { align: 'center', face: 'small' });
        }
        if (B.done) {
          S_panel(g, 60, 80, 200, 70);
          Font.draw(g, 'CAUGHT ' + B.caught, 160, 92, '#ffffff', { align: 'center' });
          Font.draw(g, B.lives ? '+' + B.lives + ' LIFE' + (B.lives > 1 ? 'S' : '') : 'NICE TRY!', 160, 110, '#7aff9a', { align: 'center' });
          Font.draw(g, '+' + B.caught * 100, 160, 128, '#ffe060', { align: 'center' });
        }
      }
    }
  });
  function S_panel(g, x, y, w, h) { Screens.panel(g, x, y, w, h); }
  function reward() {
    B.lives = B.caught >= 35 ? 2 : B.caught >= 20 ? 1 : 0;
    Game.run.lives += B.lives;
    Game.addScore(B.caught * 100);
  }
  function finish() { LP.FX.clear(); Game.resumeFromBonus(); LP.States.go('play'); }
  return B;
})();
