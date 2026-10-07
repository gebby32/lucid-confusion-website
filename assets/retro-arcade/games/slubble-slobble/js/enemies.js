/* ENEMIES — an original roster of NES-style pests. Each species = a sprite + one movement
   class + optional extras:
     walker   walks platforms, turns at walls, sometimes hops up toward a sloth
     hopper   hops constantly           bouncer  ricochets diagonally, ignores platforms
     flyer    sine-wave flight          chaser   heads for the nearest sloth, jumps / drops
     charger  winds up and charges      dropper  cruises up high dropping eggs
     climber  walker that uses ladders  dangler  spider on a thread
     teleporter  fades out and reappears elsewhere   swimmer  fish (flops on land)
   extras: shoot (projectile kind), armor (needs two bubbles: first one knocks the armour off),
   fast (quick and weak), playDead (possum: bubbles bounce off while it fakes it)
   When a trapped enemy breaks free it is ANGRY: red-tinted and much faster. */
'use strict';
const SPECIES = {
  penguin: { move: 'walker', speed: 0.55, w: 12, h: 14, hop: 0.006, mood: 'angry' },
  raccoon: { move: 'walker', speed: 0.6, w: 12, h: 14, hop: 0.012 },
  frog: { move: 'hopper', speed: 0.65, w: 14, h: 11, hopV: 3.5, wait: [35, 80] },
  rat: { move: 'walker', speed: 1.1, w: 12, h: 9, fast: true, hop: 0.004, mood: 'panic' },
  bat: { move: 'flyer', speed: 0.7, w: 12, h: 8 },
  crab: { move: 'walker', speed: 0.5, w: 14, h: 11, hop: 0.008, mood: 'angry' },
  turtle: { move: 'walker', speed: 0.38, w: 14, h: 11, armor: 'turtleBare' },
  rabbit: { move: 'hopper', speed: 0.85, w: 10, h: 14, hopV: 4.3, wait: [25, 60] },
  squirrel: { move: 'climber', speed: 0.75, w: 12, h: 13, hop: 0.02 },
  possum: { move: 'walker', speed: 0.55, w: 14, h: 9, playDead: true, mood: 'confused' },
  goat: { move: 'charger', speed: 0.55, w: 13, h: 13 },
  chicken: { move: 'dropper', speed: 0.6, w: 12, h: 13, shoot: 'egg', mood: 'panic' },
  pig: { move: 'walker', speed: 0.42, w: 14, h: 12, armor: 'pigBare' },
  cat: { move: 'chaser', speed: 0.72, w: 13, h: 13, mood: 'angry' },
  fish: { move: 'swimmer', speed: 0.8, w: 14, h: 9 },
  octopus: { move: 'floater', speed: 0.4, w: 13, h: 12, shoot: 'ink' },
  snake: { move: 'walker', speed: 0.95, w: 14, h: 11, fast: true },
  spider: { move: 'dangler', speed: 0.6, w: 13, h: 8, mood: 'panic' },
  beetle: { move: 'walker', speed: 0.7, w: 14, h: 10, hop: 0.02 },
  ghost: { move: 'teleporter', speed: 0.45, w: 13, h: 13, float: true, mood: 'confused' },
  skeleton: { move: 'walker', speed: 0.5, w: 10, h: 16, shoot: 'bone' },
  imp: { move: 'teleporter', speed: 0.6, w: 12, h: 13, shoot: 'fireball', mood: 'angry' },
  blob: { move: 'bouncer', speed: 0.75, w: 13, h: 11, mood: 'dizzy' },
  slime: { move: 'hopper', speed: 0.55, w: 13, h: 11, hopV: 3.1, wait: [30, 60] },
  mushroom: { move: 'walker', speed: 0.42, w: 14, h: 12, shoot: 'spore' },
  eyeball: { move: 'chaser', speed: 0.68, w: 12, h: 12, hop: 0.012, mood: 'panic' },
  teeth: { move: 'walker', speed: 1.25, w: 14, h: 12, fast: true, rewind: true },
  robot: { move: 'walker', speed: 0.52, w: 12, h: 16, shoot: 'laser' },
  trashcan: { move: 'walker', speed: 0.48, w: 12, h: 13, armor: 'trashcanBare' },
  boot: { move: 'hopper', speed: 0.8, w: 14, h: 12, hopV: 3.9, wait: [20, 50], mood: 'angry' },
  apple: { move: 'bouncer', speed: 0.95, w: 13, h: 13, mood: 'angry' },
  sandwich: { move: 'flyer', speed: 0.85, w: 14, h: 11 },
  skull: { move: 'bouncer', speed: 1.25, w: 12, h: 12, fast: true, mood: 'dizzy' },
  mutant: { move: 'chaser', speed: 0.78, w: 13, h: 14, hop: 0.025 },
  duckling: { move: 'walker', speed: 0.7, w: 10, h: 11, hop: 0.01 },
  fly: { move: 'flyer', speed: 0.9, w: 9, h: 8, mood: 'panic' },
  landlord: { move: 'landlord', speed: 0.45, w: 12, h: 14, noTrap: true }
};

const Enemies = (function () {
  // quarter-turned copies of enemy frames (spinning corpses, a possum playing dead), cached
  const turnCache = {};
  function turned(name, flip, q, mode) {
    const k = name + flip + q + mode;
    if (turnCache[k]) return turnCache[k];
    const img = Sprites.enemy(name, 0, flip, mode);
    return (turnCache[k] = q === 0 ? img : q === 2 ? G.flipV(G.mirror(img)) : G.rotate(img, q));
  }
  const E = {
    list: [], shots: [], corpses: [],
    reset() { E.list.length = 0; E.shots.length = 0; E.corpses.length = 0; },
    alive() { let n = 0; for (const e of E.list) if (e.state !== 'dead' && !e.sp.noTrap) n++; return n + E.corpses.length; },

    spawn(name, x, y, o) {
      const sp = SPECIES[name];
      const e = Object.assign({
        name, sp, x, y, w: sp.w, h: sp.h, vx: 0, vy: 0, dir: x < 128 ? 1 : -1, onGround: false,
        state: 'live', t: LP.randi(0, 60), angry: false, armor: !!sp.armor, cool: LP.randi(90, 200), wait: LP.randi(20, 60),
        fade: 0, tpT: LP.randi(160, 300), drop: 0, charge: 0, dead: false, base: y, appear: 70
      }, o);
      if (sp.move === 'dangler') { e.anchor = World.TOP + 9; e.len = Math.max(10, y - e.anchor); e.target = e.len; }
      if (sp.move === 'dropper') e.base = LP.clamp(y, 30, 60);
      if (sp.move === 'flyer' || sp.move === 'floater') e.base = y - 6;
      E.list.push(e);
      return e;
    },

    nearest(e) {
      let best = null, bd = 1e9;
      for (const p of Players.list) {
        if (!Players.active(p)) continue;
        const d = Math.abs(p.x - e.x) + Math.abs(p.y - e.y) * 1.4;
        if (d < bd) { bd = d; best = p; }
      }
      return best;
    },
    speedOf(e) {
      let s = e.sp.speed * LevelInfo.speed(World.n);
      if (e.angry) s *= 1.55;
      if (Game.hurry) s *= 1.25;
      if (Game.freeze > 0) s *= 0.25;
      return s;
    },

    update() {
      for (const e of E.list) {
        if (e.state !== 'live') continue;
        e.t++;
        if (e.appear > 0) { e.appear--; continue; }       // blinking in, harmless
        const s = E.speedOf(e);
        const m = e.sp.move;
        E.MOVES[m](e, s);
        if (e.sp.shoot && Game.freeze <= 0) E.tryShoot(e);
        if (e.y > World.BOT + 40) e.y = World.TOP;
      }
      // safety net: a 'trapped' enemy must be inside a live bubble
      if (LP.Loop.frame % 30 === 0) for (const e of E.list) if (e.state === 'trapped' && !Bubbles.list.some((b) => !b.dead && b.trapped.includes(e))) E.release(e, e.x, e.y - e.h / 2);
      LP.prune(E.list, (e) => e.state === 'dead');
      E.updateShots();
      E.updateCorpses();
    },

    // ---------------------------------------------------------------- movement classes
    MOVES: {
      walker(e, s) {
        if (e.sp.rewind && (e.t % 300) > 250) { e.vx = 0; E.gravity(e); World.move(e); return; }   // wind-up teeth rewind
        if (e.sp.playDead && (e.t % 420) > 330) { e.dead_ = true; e.vx = 0; E.gravity(e); World.move(e); return; }
        e.dead_ = false;
        e.vx = e.dir * s;
        E.gravity(e);
        World.move(e);
        if (e.hitWall) e.dir = -e.hitWall;
        if (e.onGround) {
          if (E.ledgeAhead(e) && Math.random() < 0.7) e.dir = -e.dir;
          const p = E.nearest(e);
          if (p && p.y < e.y - 16 && Math.abs(p.x - e.x) < 70 && Math.random() < (e.sp.hop || 0.006) * (e.angry ? 3 : 1.5)) e.vy = -3.75;
          else if (p && p.y > e.y + 16 && Math.random() < 0.004 && e.ground !== TILE.SOLID) e.drop = 14;
          if (Math.random() < 0.002) e.dir = -e.dir;
        }
      },
      hopper(e, s) {
        E.gravity(e);
        if (e.onGround) {
          e.vx *= 0.7;
          if (--e.wait <= 0) {
            const p = E.nearest(e);
            if (p && Math.random() < 0.55) e.dir = p.x < e.x ? -1 : 1;
            e.vy = -(e.sp.hopV || 3.5) * (p && p.y < e.y - 20 ? 1.1 : 1);
            e.vx = e.dir * s * 1.6;
            const w = e.sp.wait || [30, 70];
            e.wait = LP.randi(w[0], w[1]) / (e.angry ? 1.8 : 1);
            if (World.n > 1 && Math.random() < 0.3) LP.Audio.play('hop');
          }
        }
        World.move(e);
        if (e.hitWall) { e.dir = -e.hitWall; e.vx = e.dir * Math.abs(e.vx); }
      },
      bouncer(e, s) {
        if (!e.bvx) { e.bvx = e.dir * s; e.bvy = (Math.random() < 0.5 ? -1 : 1) * s * 0.8; }
        const sx = Math.sign(e.bvx) * s, sy = Math.sign(e.bvy) * s * 0.8;
        e.x += sx; e.y += sy;
        const TOPY = World.TOP + 8, BOTY = World.BOT - 8;
        if (e.x < 16 + e.w / 2 || World.at(e.x - e.w / 2, e.y - e.h / 2) === TILE.SOLID) { e.bvx = 1; e.x += 1; }
        if (e.x > 240 - e.w / 2 || World.at(e.x + e.w / 2, e.y - e.h / 2) === TILE.SOLID) { e.bvx = -1; e.x -= 1; }
        if (e.y - e.h < TOPY) { e.bvy = 1; e.y = TOPY + e.h; }
        if (e.y > BOTY || World.at(e.x, e.y + 1) === TILE.SOLID && e.bvy > 0) { e.bvy = -1; e.y -= 1; if (e.y > BOTY) e.y = BOTY; }
        e.dir = Math.sign(e.bvx);
      },
      flyer(e, s) {
        e.x += e.dir * s;
        if (e.x < 22 || e.x > 234 || World.at(e.x + e.dir * e.w / 2, e.y - e.h / 2) === TILE.SOLID) e.dir = -e.dir;
        const p = E.nearest(e);
        if (p && e.t % 120 === 0) e.base = LP.clamp(p.y - 10 + LP.rand(-20, 20), World.TOP + 20, World.BOT - 10);
        e.base = LP.clamp(e.base, World.TOP + 20, World.BOT - 10);
        const ty = e.base + Math.sin(e.t * 0.06) * 12;
        e.y += LP.clamp(ty - e.y, -s, s);
      },
      floater(e, s) {
        const p = E.nearest(e);
        if (p && e.t % 90 === 0) { e.base = LP.clamp(p.y - 8 + LP.rand(-24, 24), World.TOP + 24, World.BOT - 10); e.dir = p.x < e.x ? -1 : 1; }
        e.x += e.dir * s * 0.6;
        if (e.x < 24 || e.x > 232) e.dir = -e.dir;
        e.y += LP.clamp(e.base + Math.sin(e.t * 0.05) * 6 - e.y, -s, s);
      },
      chaser(e, s) {
        const p = E.nearest(e);
        if (p && e.onGround && e.t % 20 === 0 && Math.abs(p.x - e.x) > 6) e.dir = p.x < e.x ? -1 : 1;
        e.vx = e.dir * s * (p && Math.abs(p.x - e.x) < 40 ? 1.25 : 1);
        E.gravity(e);
        World.move(e);
        if (e.hitWall) { e.dir = -e.hitWall; e.vy = e.onGround ? -3.5 : e.vy; }
        if (e.onGround && p) {
          if (p.y < e.y - 14 && Math.random() < 0.02 + (e.sp.hop || 0)) e.vy = -3.85;
          else if (p.y > e.y + 14 && Math.random() < 0.01 && e.ground !== TILE.SOLID) e.drop = 14;
        }
      },
      charger(e, s) {
        const p = E.nearest(e);
        if (e.charge > 0) {               // charging!
          e.charge--;
          e.vx = e.dir * Math.max(2.2, s * 3.6);
          E.gravity(e); World.move(e);
          if (e.hitWall || e.charge === 0) { e.charge = 0; e.cool = 80; if (e.hitWall) { e.dir = -e.hitWall; LP.FX.shake(1, 6); LP.Audio.play('bonk'); } }
          return;
        }
        if (e.wind > 0) { e.wind--; e.vx = 0; e.x += (e.t % 4 < 2 ? 0.5 : -0.5); E.gravity(e); World.move(e); if (!e.wind) e.charge = 70; return; }
        E.MOVES.walker(e, s);
        if (--e.cool <= 0 && p && e.onGround && Math.abs(p.y - e.y) < 10 && Math.abs(p.x - e.x) < 140 && Math.sign(p.x - e.x) === e.dir) { e.wind = 28; LP.Audio.play('snort'); }
      },
      dropper(e, s) {
        e.x += e.dir * s;
        if (e.x < 22 || e.x > 234) e.dir = -e.dir;
        e.y += (e.base + Math.sin(e.t * 0.05) * 5 - e.y) * 0.05;
      },
      climber(e, s) {
        const onLadder = World.ladderAt(e.x, e.y - 4) || World.ladderAt(e.x, e.y + 4);
        if (e.climb) {
          e.vx = 0; e.y += e.climb * s; e.x += ((Math.floor(e.x / 8) * 8 + 4) - e.x) * 0.3;
          const still = World.ladderAt(e.x, e.y - 2) || World.ladderAt(e.x, e.y + 2);
          if (!still || (e.t % 200) === 0) { e.climb = 0; e.vy = e.climb < 0 ? -2 : 0; }
          return;
        }
        if (onLadder && Math.random() < 0.03) { e.climb = Math.random() < 0.6 ? -1 : 1; return; }
        E.MOVES.walker(e, s);
      },
      dangler(e, s) {
        const p = E.nearest(e);
        if (e.t % 100 === 0) e.target = p && Math.abs(p.x - e.x) < 50 ? LP.clamp(p.y - 8 - e.anchor, 10, 150) : LP.rand(20, 150);
        e.len += LP.clamp(e.target - e.len, -s * 1.2, s * 1.2);
        e.y = e.anchor + e.len + e.h;
        if (e.t % 260 === 0) { e.x = LP.clamp(e.x + LP.rand(-50, 50), 26, 230); }
      },
      teleporter(e, s) {
        if (e.fade !== 0) {
          e.fade += e.fade > 0 ? 1 : -1;
          if (e.fade === 30) { const p = E.nearest(e), spot = World.randomSpot(p ? p.x : 128, p ? p.y : 100, 60); e.x = spot.x; e.y = spot.y; e.fade = -30; LP.Audio.play('warp'); }
          if (e.fade === -1) e.fade = 0;
          return;
        }
        if (--e.tpT <= 0) { e.fade = 1; e.tpT = LP.randi(180, 320); return; }
        if (e.sp.float) { E.MOVES.flyer(e, s); return; }
        E.MOVES.walker(e, s);
      },
      swimmer(e, s) {
        if (e.y - 4 > World.waterY) {
          e.x += e.dir * s;
          if (e.x < 22 || e.x > 234 || World.at(e.x + e.dir * 8, e.y - 4) === TILE.SOLID) e.dir = -e.dir;
          const p = E.nearest(e);
          const ty = p && p.y > World.waterY ? p.y - 6 : World.waterY + 20 + Math.sin(e.t * 0.04) * 10;
          e.y += LP.clamp(ty - e.y, -s * 0.6, s * 0.6);
          e.y = Math.max(e.y, World.waterY + e.h + 2);
          return;
        }
        E.MOVES.hopper(e, s * 0.7);       // a fish out of water flops about
      },
      landlord(e, s) {
        const p = E.nearest(e);
        if (!p) return;
        const sp = 0.35 + Math.min(1.2, e.t / 1800);
        const dx = p.x - e.x, dy = (p.y - 8) - (e.y - 7), d = Math.hypot(dx, dy) || 1;
        e.x += dx / d * sp; e.y += dy / d * sp;
        e.dir = dx < 0 ? -1 : 1;
      }
    },
    gravity(e) {
      const g = 0.16 * World.grav;
      if (e.y - e.h / 2 > World.waterY) { e.vy = Math.min(e.vy + g * 0.4, 1); }
      else e.vy = Math.min(e.vy + g, 3.2);
    },
    ledgeAhead(e) {
      const fx = e.x + e.dir * (e.w / 2 + 2);
      const t = World.at(fx, e.y + 2);
      return !World.standable(t) && World.at(fx, e.y + 10) === 0 && World.at(fx, e.y + 18) === 0;
    },

    // ---------------------------------------------------------------- trapping
    trapBy(e, b) {
      if (e.state !== 'live' || e.appear > 0) return false;
      if (e.dead_) return 'armor';                    // possum faking it: the bubble bounces off
      if (e.armor && !b.giant && !b.rainbow) {
        e.armor = false;
        e.name = e.sp.armor;
        LP.Audio.play('clank');
        G.burst(e.x, e.y - e.h / 2, 8, '#bcbcbc', { speed: 1.8 });
        Game.addScore(Players.list[b.owner], 100, e.x, e.y - e.h - 4);
        e.vy = -2; e.angry = false;
        return 'armor';
      }
      e.state = 'trapped';
      e.armor = false;
      if (e.sp.armor) e.name = e.sp.armor;
      Game.onTrap(e, b);
      return 'trapped';
    },
    release(e, x, y) {
      e.state = 'live';
      e.x = x; e.y = y + e.h / 2; e.vy = -2.4; e.vx = 0;
      e.angry = true; e.appear = 0; e.fade = 0;
      if (e.sp.move === 'dangler') { e.anchor = World.TOP + 9; e.len = Math.max(8, e.y - e.h - e.anchor); e.target = e.len; }
      if (e.sp.move === 'dropper' || e.sp.move === 'flyer' || e.sp.move === 'floater') e.base = e.y;
      Game.popup(x, y - 14, 'GRR!', '#f83800');
    },
    // popped: the enemy flies out spinning and turns into food where it lands
    kill(e, x, y, dir, bonus, launched) {
      e.state = 'dead';
      E.corpses.push({ name: e.name, x, y, vx: dir * LP.rand(1.0, 2.2) * (launched ? 2.2 : 1), vy: launched ? -1.2 : -LP.rand(2.8, 3.8), t: 0, bonus, w: 8, h: 8, dir, launched, owner: e.owner });
    },
    updateCorpses() {
      for (const c of E.corpses) {
        c.t++;
        c.vy = Math.min(c.vy + 0.13, 3);
        if (c.t < 20) { c.x += c.vx; c.y += c.vy; if (c.x < 20 || c.x > 236) { c.vx = -c.vx; c.x = LP.clamp(c.x, 20, 236); } continue; }
        const was = c.vy;
        World.move(c);
        if (c.hitWall) c.vx = -c.vx * 0.8;
        if (c.y > World.BOT) { c.y = World.BOT; c.onGround = true; }
        if (c.onGround || c.t > 300) {
          c.done = true;
          if (Math.random() < Game.powerChance()) Items.dropPower(c.x, c.y);
          else Items.dropFood(c.x, c.y, c.bonus);
          LP.Audio.play('thud', { v: was });
        }
      }
      LP.prune(E.corpses, (c) => c.done);
    },

    // ---------------------------------------------------------------- projectiles
    tryShoot(e) {
      if (--e.cool > 0 || e.fade || e.appear > 0) return;
      const p = E.nearest(e);
      const k = e.sp.shoot;
      e.cool = LP.randi(150, 260) / (e.angry ? 1.6 : 1) / (0.8 + LevelInfo.speed(World.n) * 0.3);
      if (!p) return;
      const dx = p.x - e.x, dy = (p.y - 8) - (e.y - e.h / 2), d = Math.hypot(dx, dy) || 1;
      const ex = e.x, ey = e.y - e.h / 2;
      if (k === 'egg') { if (Math.abs(dx) > 40) { e.cool = 30; return; } E.shot('egg', ex, e.y, 0, 0.5, 0.12); }
      else if (k === 'spore') { E.shot('spore', ex, e.y - e.h, LP.rand(-0.4, 0.4), -1.2, 0.03); E.shot('spore', ex, e.y - e.h, LP.rand(-0.6, 0.6), -1.6, 0.03); }
      else if (k === 'bone') { if (Math.abs(dy) > 40) { e.cool = 40; return; } e.dir = dx < 0 ? -1 : 1; E.shot('bone', ex, ey - 4, e.dir * 1.6, -2.6, 0.1); }
      else if (k === 'laser') { if (Math.abs(dy) > 10 || Math.sign(dx) !== e.dir) { e.cool = 20; return; } E.shot('laser', ex + e.dir * 6, ey - 2, e.dir * 2.2, 0, 0); }
      else if (k === 'fireball') { E.shot('fireball', ex, ey, dx / d * 1.2, dy / d * 1.2, 0); }
      else if (k === 'ink') { E.shot('ink', ex, ey, dx / d * 1.0, dy / d * 1.0, 0); }
      LP.Audio.play('shoot', { k });
    },
    shot(kind, x, y, vx, vy, g, o) {
      const s = Object.assign({ kind, x, y, vx, vy, g, t: 0, r: 3 }, o);
      E.shots.push(s);
      return s;
    },
    updateShots() {
      for (const s of E.shots) {
        s.t++;
        if (Game.freeze > 0 && !s.friendly) { s.x += s.vx * 0.25; s.y += s.vy * 0.25; continue; }
        s.vy += s.g; s.x += s.vx; s.y += s.vy;
        const t = World.at(s.x, s.y);
        if (s.kind === 'egg' && World.standable(t) && s.vy > 0) { s.dead = true; G.burst(s.x, s.y - 2, 6, '#fcfcfc', { speed: 1 }); G.burst(s.x, s.y - 2, 3, '#f8b800', { speed: 0.8 }); LP.Audio.play('splat'); }
        if (t === TILE.SOLID || s.x < 10 || s.x > 246 || s.y > World.BOT + 4 || s.y < World.TOP || s.t > 600) s.dead = true;
      }
      LP.prune(E.shots, (s) => s.dead);
    },
    // a flying bubble catches enemy projectiles (both vanish, a few points)
    projectileHit(b) {
      for (const s of E.shots) {
        if (s.dead || s.friendly) continue;
        if (Math.hypot(s.x - b.x, s.y - b.y) < b.r + s.r) { s.dead = true; Game.addScore(Players.list[b.owner], 50, s.x, s.y - 6); G.burst(s.x, s.y, 4, '#fcfcfc', { speed: 1 }); LP.Audio.play('pip'); }
      }
    },

    // ---------------------------------------------------------------- drawing
    draw() {
      const g = G.g;
      for (const e of E.list) {
        if (e.state !== 'live') continue;
        if (e.appear > 0 && (LP.Loop.frame >> 2) % 2) continue;
        if (e.fade && (Math.abs(e.fade) > 10 ? (e.t >> 1) % 2 : (e.t >> 2) % 2)) continue;
        if (e.sp.move === 'dangler') { G.line(e.x, e.anchor, e.x, e.y - e.h, '#bcbcbc', g); }
        const frame = e.sp.move === 'hopper' ? (e.onGround ? 0 : 1) : e.sp.move === 'bouncer' ? (e.t >> 4) & 1 : (e.t >> (e.sp.fast ? 2 : 3)) & 1;
        const mode = Game.freeze > 0 ? 'frozen' : e.angry || (e.charge > 0 || e.wind > 0) ? 'angry' : '';
        let img = Sprites.enemy(e.name, frame, e.dir < 0, mode);
        if (e.dead_) img = turned(e.name, e.dir < 0, 2, '');
        const shake = e.wind > 0 ? (e.t & 1) : 0;
        g.drawImage(img, Math.round(e.x - img.width / 2 + shake), Math.round(e.y - img.height));
        if (e.sp.noTrap && (e.t >> 4) % 2) G.textC('$$$', e.x, e.y - e.h - 8, '#58f898', { face: 'small' });
      }
      for (const c of E.corpses) {
        const rimg = turned(c.name, c.dir < 0, (c.t >> 2) % 4, (c.t >> 2) % 2 ? 'white' : '');
        g.drawImage(rimg, Math.round(c.x - rimg.width / 2), Math.round(c.y - rimg.height / 2 - 4));
      }
      for (const s of E.shots) {
        const icon = { egg: 'egg', bone: 'bone', laser: 'laser', fireball: 'fireball', ink: 'ink', spore: 'spore', can: 'can', acorn: 'acorn' }[s.kind];
        if (icon) G.drawC(Sprites.icon(icon), s.x, s.y);
        else if (s.draw) s.draw(g, s);
        else G.disc(s.x, s.y, s.r, '#f83800', g);
      }
    }
  };
  return E;
})();
