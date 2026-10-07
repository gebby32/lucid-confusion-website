/* SOFA KING — the big angry penguin at the top of every stage.
   Drawn procedurally from crisp pixel shapes so he can be properly expressive:
   flippers, beak, brows, pupils, crown, feet and squash are all pose parameters.
   Behaviour: idles obnoxiously (chest pounds, flaps, stares at you, laughs), throws
   barrels and the occasional stupid thing, kicks, stomps (penthouse / when furious),
   gets irritated when the sloth climbs close, laughs when the sloth dies. */
'use strict';
const King = (function () {
  const NAVY = '#24369c', NAVY_DK = '#121c5a', NAVY_HI = '#5a78e8', BELLY = '#f2f2f6', BELLY_SH = '#b8c2dc';
  const BEAK = '#ffc21a', BEAK_HI = '#ffe680', BEAK_LO = '#e8840c', BEAK_DK = '#7a3600', MOUTH = '#5a0010';
  const GOLD = '#ffd21a', GOLD_DK = '#a87000', GEM = '#e8103a', FOOT = '#ff9a10', FOOT_DK = '#b85a00';

  // ------------------------------------------------------------------ drawing
  // pose: { wl, wr (flipper angles, deg: 0 down, 90 out, 170 overhead, <0 across belly),
  //         beak 0..3 (open px), eyes 'angry'|'look'|'closed'|'wide'|'dizzy', px,py (pupil offset),
  //         squash, bob, lean, fl, fr (foot lift px), red 0..1, crown (lift px), hold (sprite) }
  function drawPose(x, y, f, p, t) {
    const g = LP.LCD.ctx;
    p = Object.assign({ wl: 10, wr: 10, beak: 0, eyes: 'angry', px: 0, py: 1, squash: 1, bob: 0, lean: 0, fl: 0, fr: 0, red: 0, crown: 0, hold: null }, p);
    if (f < 0) { [p.wl, p.wr] = [p.wr, p.wl]; [p.fl, p.fr] = [p.fr, p.fl]; }     // poses are authored facing right
    x = Math.round(x); y = Math.round(y + p.bob);
    const by = y - 10, bry = 9.5 * p.squash, brx = 10.5 / Math.sqrt(p.squash);
    const hx = x + f * 1 + p.lean, hy = Math.round(y - 10 - bry - 1 + (1 - p.squash) * 6);
    const navy = p.red > 0.5 ? '#7a2a7a' : p.red > 0 ? '#4a2c8c' : NAVY;

    // feet
    G.ellipse(x - 5, y - 1 - p.fl, 4, 1.6, FOOT_DK, g); G.ellipse(x - 5, y - 2 - p.fl, 3.5, 1.2, FOOT, g);
    G.ellipse(x + 5, y - 1 - p.fr, 4, 1.6, FOOT_DK, g); G.ellipse(x + 5, y - 2 - p.fr, 3.5, 1.2, FOOT, g);
    // body (outline, fill, rim light on the back)
    G.ellipse(x, by, brx + 1, bry + 1, NAVY_DK, g);
    G.ellipse(x, by, brx, bry, navy, g);
    G.ellipse(x - f * 2, by - 2, brx - 3, bry - 2, NAVY_HI, g);
    G.ellipse(x - f * 1, by - 1, brx - 3, bry - 2, navy, g);
    // belly
    G.ellipse(x + f * 2, by + 1, 7.2, bry - 1.5, BELLY_SH, g);
    G.ellipse(x + f * 2, by, 6.6, bry - 2.4, BELLY, g);
    // flippers (behind the hold item, in front of the body)
    flipper(x - 9, by - 4, -1, p.wl, navy);
    flipper(x + 9, by - 4, 1, p.wr, navy);
    // head
    G.ellipse(hx, hy, 8.5, 7.5, NAVY_DK, g);
    G.ellipse(hx, hy, 7.6, 6.6, navy, g);
    G.ellipse(hx - f * 2, hy - 2, 4, 3, NAVY_HI, g);
    G.ellipse(hx - f * 1, hy - 1, 5, 4, navy, g);
    // eyes
    eye(hx, hy - 1, f, p); eye(hx + f * 5, hy - 1, -f, p);
    // beak (a big toothy grin)
    beak(hx + f * 6, hy + 2, f, p.beak);
    // crown
    crown(hx - f * 1, hy - 7 - p.crown, t);
    // held thing, hoisted up on the throwing side
    if (p.hold) g.drawImage(p.hold, Math.round(x + f * 12 - p.hold.width / 2), Math.round(hy + 1 - p.hold.height));
  }

  function flipper(sx, sy, side, deg, navy) {
    const a = deg * Math.PI / 180, dx = side * Math.sin(a), dy = Math.cos(a), L = 9;
    G.stroke(sx, sy, sx + dx * L, sy + dy * L, 2.6, 1.3, NAVY_DK);
    G.stroke(sx, sy, sx + dx * (L - 0.5), sy + dy * (L - 0.5), 1.9, 0.7, navy);
  }

  // inner = direction toward the other eye (brows slope down that way: a scowl)
  function eye(ex, ey, inner, p) {
    if (p.eyes === 'closed') { G.rect(ex - 1, ey + 1, 3, 1, '#000'); G.rect(ex - 2, ey, 1, 1, '#000'); G.rect(ex + 2, ey, 1, 1, '#000'); return; }
    if (p.eyes === 'dizzy') { G.px(ex - 1, ey - 1, '#fff'); G.px(ex + 1, ey + 1, '#fff'); G.px(ex + 1, ey - 1, '#fff'); G.px(ex - 1, ey + 1, '#fff'); G.px(ex, ey, '#fff'); return; }
    const wide = p.eyes === 'wide';
    G.rect(ex - 1, ey - (wide ? 2 : 1), 3, wide ? 4 : 3, '#fff');
    const px = LP.clamp(Math.round(p.px), -1, 1), py = LP.clamp(Math.round(p.py), -1, wide ? 1 : 1);
    G.rect(ex + px, ey + py - (wide ? 1 : 0), 1, wide ? 2 : 1, '#000');
    if (p.eyes === 'look') G.rect(ex - 1 + (px > 0 ? 1 : 0), ey, 2, 2, '#000');
    if (p.eyes === 'angry' || p.eyes === 'look' || p.eyes === 'wide') {
      const o = -inner, up = p.eyes === 'wide' ? 1 : 0;
      G.px(ex + o * 2, ey - 4 - up, '#000'); G.px(ex + o, ey - 3 - up, '#000');
      G.px(ex, ey - 3 - up, '#000'); G.px(ex - o, ey - 2 - up, '#000');
    }
  }

  function beak(bx, by, f, open) {
    const g = LP.LCD.ctx, gap = Math.round(open);
    // mouth interior + teeth
    if (gap > 0) for (let i = 0; i < 6; i++) {
      const x = bx + f * i;
      G.rect(x, by + 1, 1, gap, MOUTH);
      if (i % 2 === 0 && i < 5) G.px(x, by + 1, '#fff');
    }
    for (let i = 0; i <= 7; i++) {                         // upper beak
      const x = bx + f * i, top = by - 3 + Math.floor(i / 2.5);
      G.rect(x, top, 1, by - top + 1, BEAK);
      G.px(x, top, i < 6 ? BEAK_HI : BEAK_DK);
      G.px(x, by, BEAK_DK);
    }
    for (let i = 0; i <= 6; i++) {                         // lower beak
      const x = bx + f * i, top = by + 1 + gap, bot = by + 3 + gap - Math.floor(i / 2.5);
      if (bot >= top) G.rect(x, top, 1, bot - top + 1, BEAK_LO);
      G.px(x, bot, BEAK_DK);
    }
    if (gap === 0) for (let i = 1; i < 6; i += 2) G.px(bx + f * i, by, '#fff');   // smug teeth showing
  }

  function crown(cx, cy, t) {
    const g = LP.LCD.ctx;
    G.rect(cx - 6, cy, 13, 4, GOLD_DK);
    G.rect(cx - 5, cy, 11, 3, GOLD);
    for (const o of [-5, 0, 5]) { G.rect(cx + o - 1, cy - 2, 3, 2, GOLD); G.px(cx + o, cy - 3, GOLD); G.px(cx + o, cy - 4, '#fff'); }
    G.rect(cx - 1, cy + 1, 2, 2, GEM);
    if (Math.floor(t * 3) % 3 === 0) G.px(cx - 1, cy + 1, '#fff');
  }

  // named poses (also shown by tools/sprites.html)
  const POSES = {
    idle: { wl: 12, wr: 12, beak: 0, eyes: 'angry' },
    pound: { wl: -35, wr: 15, beak: 2, eyes: 'angry' },
    hold: { wl: 115, wr: 165, beak: 1, eyes: 'angry' },
    throw: { wl: 70, wr: 95, beak: 3, eyes: 'wide', lean: 2 },
    laugh: { wl: -25, wr: -25, beak: 3, eyes: 'closed', squash: 0.93 },
    stare: { wl: 20, wr: 20, beak: 0, eyes: 'look', px: 0, py: 0 },
    stomp: { wl: 120, wr: 120, beak: 2, eyes: 'wide', fr: 6 },
    flap: { wl: 100, wr: 100, beak: 1, eyes: 'angry' },
    mad: { wl: 60, wr: 60, beak: 2, eyes: 'angry', red: 1 },
    dizzy: { wl: 140, wr: 30, beak: 2, eyes: 'dizzy' }
  };

  // ------------------------------------------------------------------ behaviour
  const ODD = ['toilet', 'microwave', 'chair', 'duck', 'can', 'tv', 'fish', 'fish'];
  const QUIPS = {
    toilet: 'FLUSHED WITH SUCCESS!', microwave: "DING! YOU'RE DONE!", chair: 'TAKE A SEAT!', duck: 'SQUEAK SQUEAK!',
    can: 'TAKE OUT THE TRASH!', tv: 'NOTHING GOOD ON ANYWAY', fish: '...WAIT, THAT WAS LUNCH', tire: 'SPARE ME!',
    toolbox: 'FIX THIS, PLUMBER!'
  };
  const TAUNTS = ['SOFA KING SLOW!', 'HURRY UP, SLOWPOKE!', 'CLIMB FASTER, FURBALL!', 'BARREL TIME!', 'YOU CALL THAT CLIMBING?', 'HAW HAW HAW!'];
  const CLOSE = ['GET BACK DOWN THERE!', 'STAY OFF MY PERCH!', 'NO! NO! NO!', 'BACK OFF, SLOTH!'];
  const LAUGHS = ['HAW HAW HAW!', 'SOFA KING SLOW!', 'NICE TRY, SLOWPOKE!', 'HAW! GRAVITY WINS!', 'TOO SLOW! HAW HAW!'];

  const K = {
    x: 60, y: 52, f: 1, state: 'idle', t: 0, next: 2, act: null, actT: 0, pose: null, say: null, sayT: 0,
    mood: 0, blinkT: 0, stompT: 8, pending: null, irritated: false, hidden: false, vy: 0, vx: 0, item: null, time: 0,
    POSES, drawPose, ODD, QUIPS,

    reset(stage) {
      Object.assign(K, {
        x: stage.king.x, y: stage.king.y, f: stage.king.f || 1, state: 'idle', t: 0, next: 1.8, act: null, actT: 0,
        say: null, sayT: 0, mood: 0, irritated: false, hidden: false, vx: 0, vy: 0, item: null, pending: null,
        stompT: 6 + Math.random() * 3, time: 0, sofa: !!stage.sofa
      });
    },

    talk(text, secs) { K.say = text; K.sayT = secs || 2; },

    setState(s) { K.state = s; K.t = 0; },

    // dt is already scaled by sloth time. d = Game difficulty. hero = Game.hero
    update(dt, d, hero, stage) {
      K.t += dt; K.time += dt;
      if (K.sayT > 0 && (K.sayT -= dt) <= 0) K.say = null;
      K.blinkT -= dt;
      if (K.blinkT < -0.12) K.blinkT = LP.rand(1.5, 4);

      // irritation: the higher the sloth, the angrier the king
      const close = hero && hero.tier >= stage.tiers - 2;
      if (close && !K.irritated) { K.irritated = true; if (!K.say) K.talk(LP.pick(CLOSE), 1.8); LP.Audio.play('grumble'); }
      if (!close) K.irritated = false;
      K.mood = LP.approach(K.mood, K.irritated || d.rage ? 1 : 0, dt * 1.5);
      // a throw or stomp in progress is called off if play stops (sloth died, etc.)
      if (Game.phase !== 'play' && (K.state === 'grab' || K.state === 'hold' || K.state === 'kickset' || K.state === 'stompup')) { K.pending = null; K.setState('idle'); }
      if (K.irritated && Math.random() < dt * 3) Game.steamPuff(K.x - K.f * 2, K.y - 32);

      switch (K.state) {
        case 'idle': return K.idle(dt, d, hero, stage);
        case 'grab': if (K.t > 0.28) K.setState('hold'); return;
        case 'hold': if (K.t > (K.pending.kind === 'wild' ? 0.85 : 0.42)) { K.setState('throw'); K.release(d); } return;
        case 'throw': if (K.t > 0.32) K.setState('idle'); return;
        case 'kickset': if (K.t > 0.3) { K.setState('kick'); K.release(d); } return;
        case 'kick': if (K.t > 0.35) K.setState('idle'); return;
        case 'stompup': if (K.t > 0.65) { K.setState('stomp'); Game.onStomp(); } return;
        case 'stomp': if (K.t > 0.45) K.setState('idle'); return;
        case 'act': if (K.t > K.actT) K.setState('idle'); return;
        case 'laugh': return;
        case 'tantrum': return;
        case 'fly':                                   // penguins can't fly. this one is too angry to know that
          K.vy = Math.max(K.vy - dt * 1.2, -1.6); K.y += K.vy; K.x += Math.sin(K.t * 20) * 0.5;
          if (K.y < -60) K.hidden = true;
          return;
        case 'launched':
          K.vy += 0.12; K.y += K.vy; K.x += K.vx;
          return;
      }
    },

    idle(dt, d, hero, stage) {
      if (Game.phase !== 'play') return;
      K.next -= dt;
      // stomps: the penthouse always, elsewhere only from loop 2 when he's furious
      if (d.stomp) {
        K.stompT -= dt;
        if (K.stompT <= 0) {
          K.stompT = LP.rand(d.stompMin, d.stompMax) * (K.mood > 0.5 ? 0.7 : 1);
          K.setState('stompup'); LP.Audio.play('windup');
          if (!K.say && Math.random() < 0.4) K.talk(LP.pick(['FEEL THE POWER!', 'STOMP TIME!', 'SHAKE IT UP!']), 1.4);
          return;
        }
      }
      if (K.next <= 0 && Hazards.count() < d.maxHazards) {
        K.pending = K.choose(d, stage);
        K.next = d.interval * LP.rand(0.75, 1.25) * (K.mood > 0.5 ? 0.82 : 1);
        if (K.pending.kick) { K.setState('kickset'); return; }
        K.setState('grab'); return;
      }
      // little bits of business between throws
      if (K.t > 1.2 && Math.random() < dt * 0.7) {
        const r = Math.random();
        K.act = r < 0.3 ? 'pound' : r < 0.5 ? 'flap' : r < 0.75 ? 'stare' : 'chuckle';
        K.actT = K.act === 'pound' ? 1.1 : K.act === 'stare' ? 1.3 : 0.8;
        K.setState('act');
        if (K.act === 'chuckle') LP.Audio.play('laughShort');
        if (!K.say && Math.random() < 0.3) K.talk(LP.pick(TAUNTS), 1.8);
      }
    },

    choose(d, stage) {
      let kind = 'barrel';
      if (stage.industrial && Math.random() < 0.38) kind = LP.pick(['toolbox', 'tire', 'tire', 'can']);
      else if (Math.random() < d.odd) kind = LP.pick(ODD);
      else if (Math.random() < d.wild && Game.stageTime > 5) kind = 'wild';
      const kick = kind === 'barrel' && Math.random() < d.kick;
      return { kind, kick };
    },

    release(d) {
      const p = K.pending; if (!p) return;
      K.pending = null;
      if (p.kick) {
        Hazards.spawn(p.kind, K.x + K.f * 13, K.y, K.f, { kicked: true });
        LP.Audio.play('kick');
      } else {
        Hazards.spawn(p.kind, K.x + K.f * 10, K.y - 30, K.f, { thrown: true });
        LP.Audio.play('throw');
        if (QUIPS[p.kind] && (Hazards.ODD.has(p.kind) || Math.random() < 0.3)) K.talk(QUIPS[p.kind], 2.2);
      }
    },

    // the sloth died
    laugh() { K.setState('laugh'); K.pending = null; K.talk(LP.pick(LAUGHS), 2.5); LP.Audio.play('laugh'); },

    // ------------------------------------------------------------------ pose + draw
    currentPose(hero) {
      const t = K.t, T = K.time, s = K.state;
      let p;
      if (s === 'grab') p = { wl: LP.lerp(12, 120, t / 0.28), wr: LP.lerp(12, 120, t / 0.28), beak: 1, lean: -K.f * 2, squash: 0.95 };
      else if (s === 'hold') {
        const shake = K.pending && K.pending.kind === 'wild' ? Math.round(Math.sin(t * 60)) : 0;
        p = Object.assign({}, POSES.hold, { lean: shake, hold: K.heldSprite(), beak: K.pending && K.pending.kind === 'wild' ? 3 : 1 });
      } else if (s === 'throw') p = Object.assign({}, POSES.throw, { lean: K.f * 2 });
      else if (s === 'kickset') p = { wl: 40, wr: 40, beak: 1, eyes: 'angry', fr: 0, squash: 0.95 };
      else if (s === 'kick') p = { wl: 70, wr: 20, beak: 3, eyes: 'wide', fr: t < 0.15 ? 4 : 1, lean: K.f };
      else if (s === 'stompup') p = Object.assign({}, POSES.stomp, { fr: Math.min(7, t * 14), squash: 1.05 });
      else if (s === 'stomp') p = { wl: 140, wr: 140, beak: 3, eyes: 'wide', squash: t < 0.12 ? 0.85 : 1 };
      else if (s === 'laugh') {
        const b = Math.abs(Math.sin(t * 14));
        p = Object.assign({}, POSES.laugh, { bob: -Math.round(b * 2), beak: 2 + Math.round(b), squash: 0.93 + b * 0.05 });
      } else if (s === 'tantrum') {
        const st = Math.floor(t * 8) % 2;
        p = { wl: 130 + st * 20, wr: 150 - st * 20, beak: 3, eyes: 'angry', red: 1, fl: st ? 4 : 0, fr: st ? 0 : 4, crown: st };
      } else if (s === 'fly') {
        const fl = Math.floor(t * 30) % 2;
        p = { wl: fl ? 160 : 70, wr: fl ? 160 : 70, beak: 3, eyes: 'wide', red: 0.6, fl: 2, fr: 2 };
      } else if (s === 'launched') p = Object.assign({}, POSES.dizzy, { wl: 150 + Math.sin(t * 20) * 20, wr: 150 - Math.sin(t * 20) * 20 });
      else if (s === 'act') {
        if (K.act === 'pound') { const ph = Math.floor(t * 7) % 2; p = { wl: ph ? -40 : 30, wr: ph ? 30 : -40, beak: 2, eyes: 'angry' }; if (Math.floor(t * 7) !== K._pp) { K._pp = Math.floor(t * 7); LP.Audio.play('thump'); } }
        else if (K.act === 'flap') { const ph = Math.floor(t * 16) % 2; p = { wl: ph ? 110 : 60, wr: ph ? 110 : 60, beak: 1, eyes: 'angry', bob: -ph }; }
        else if (K.act === 'stare') p = Object.assign({}, POSES.stare);
        else { const b = Math.floor(t * 12) % 2; p = Object.assign({}, POSES.laugh, { bob: -b, beak: 1 + b * 2 }); }
      } else {
        // idle: breathe, glare at the sloth
        const br = Math.sin(K.time * 3);
        p = { wl: 12 + br * 3, wr: 12 + br * 3, beak: 0, eyes: 'angry', squash: 1 + br * 0.02 };
      }
      if (hero && (p.eyes === undefined || p.eyes === 'angry' || p.eyes === 'wide')) {
        p.px = hero.x >= K.x ? 1 : -1;
        p.py = 1;
      }
      if (K.blinkT < 0 && (!p.eyes || p.eyes === 'angry')) p.eyes = 'closed';
      if (K.mood > 0 && !p.red) p.red = K.mood > 0.6 ? 1 : 0.3;
      return p;
    },

    heldSprite() {
      const k = K.pending ? K.pending.kind : 'barrel';
      if (k === 'barrel') return Sprites.barrelUp;
      if (k === 'wild') return Sprites.wildUp;
      if (k === 'tire') return Sprites.tire[0];
      return Sprites.items[k] || Sprites.barrelUp;
    },

    draw(hero) {
      if (K.hidden) return;
      const p = K.currentPose(hero);
      if (K.state === 'launched') {
        // tumbling: draw upside down by drawing into a scratch canvas would cost; flip via transform
        const g = LP.LCD.ctx;
        g.save(); g.translate(Math.round(K.x), Math.round(K.y - 14)); g.scale(1, Math.floor(K.t * 6) % 2 ? -1 : 1); g.translate(-Math.round(K.x), -Math.round(K.y - 14));
        drawPose(K.x, K.y, K.f, p, K.time); g.restore();
      } else drawPose(K.x, K.y, K.f, p, K.time);
      if (K.state === 'stompup' && Math.floor(K.t * 10) % 2 === 0) Font.draw(LP.LCD.ctx, '!', K.x + K.f * 14, K.y - 38, '#ff3030', { shadow: '#600' });
      if (K.say) G.bubble(K.x + K.f * 12, K.y - 33, K.say, K.f);
    }
  };
  return K;
})();
