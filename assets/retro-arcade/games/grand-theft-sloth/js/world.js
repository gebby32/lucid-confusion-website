/* WORLD — runs Lethargy City: who exists, who moves, who gets hurt, and what you see.
   Population (traffic, parked cars, pedestrians, patrol cops, gang corners), every
   entity update, collisions (car/car, car/ped, ped/ped), damage + deaths + wrecks,
   props, the chase flow-field, the camera, and the layered night render. */
'use strict';
const Traffic = {
  // give an existing, driven car a traffic brain from wherever it is
  adopt(c) {
    const e = City.edgeAt(c.x, c.y) || (() => { const n = City.nearestNode(c.x, c.y); return n && n.nb.length ? n.nb[0].e : null; })();
    if (!e) { c.ai = { mode: 'idle' }; return; }
    const hx = Math.cos(c.a), hy = Math.sin(c.a);
    const fwd = (e.b.x - e.a.x) * hx + (e.b.y - e.a.y) * hy >= 0;
    const from = fwd ? e.a : e.b, to = fwd ? e.b : e.a;
    c.ai = { mode: 'traffic', from, to, next: null, lane: 0, off: City.laneOffsets(e)[0], cruise: LP.rand(115, 155), wait: 0 };
    if (c.police) c.siren = false;
  }
};

const World = (function () {
  const W = {
    cars: [], peds: [], time: 0, camX: 0, camY: 0, ccx: 0, ccy: 0, laterQ: [], flowT: 0, popT: 0, gangHate: { green: 0, purple: 0 },
    geysers: [], obstacles: [], active: []
  };
  const view = { x: 0, y: 0, w: G.W, h: G.H };
  W.view = () => { view.x = W.camX; view.y = W.camY; return view; };

  W.init = function () { City.build(); Lights.init(); };

  // a fresh city (new game / continue): parked cars, props repaired, pickups placed
  W.reset = function () {
    W.cars.length = 0; W.peds.length = 0; W.laterQ.length = 0; W.geysers.length = 0;
    Weapons.clear(); Fx.clear(); Weapons.pickups.length = 0;
    W.gangHate.green = W.gangHate.purple = 0;
    for (const p of City.props) { p.dead = false; p.hp = City.PROPS[p.kind].hp; if (p.light) p.light.on = true; }
    for (const s of City.parkSpots) {
      if (!s.full) continue;
      const type = s.police ? 'police' : LP.pick(['sedan', 'sedan', 'compact', 'muscle', 'van', 'pickup', 'taxi', 'sports', 'sedan', 'compact']);
      W.addCar(type, s.x, s.y, s.a, { parked: true });
    }
    placePickups();
    Police.reset();
  };

  W.addCar = function (type, x, y, a, o) { const c = Cars.make(type, x, y, a, o); W.cars.push(c); return c; };
  W.addPed = function (kind, skin, x, y, o) { const p = Peds.make(kind, skin, x, y, o); W.peds.push(p); return p; };
  W.makeDriver = function (kind, skin, o) {
    const sk = skin || (kind === 'cop' ? 'cop' : kind === 'swat' ? 'swat' : kind === 'gang' ? 'green' : null);
    const p = Peds.make(kind, sk, 0, 0, o);
    if (kind === 'cop') p.weapon = 'pistol';
    if (kind === 'swat') p.weapon = 'smg';
    return p;
  };
  W.later = (t, fn) => W.laterQ.push({ t, fn });
  W.nearPlayer = (e, r) => { const p = Player.ped; return p && dist2(p.x, p.y, e.x, e.y) < r * r; };
  W.scare = function (x, y, r) { for (const p of W.peds) if (!p.dead && dist2(p.x, p.y, x, y) < r * r) Peds.scare(p, x, y); };

  // ------------------------------------------------------------------ pickups placed around town
  function placePickups() {
    const T = City.T, Z = City.zones;
    const P = (kind, tx, ty, o) => Weapons.addPickup(kind, tx * T + 8, ty * T + 8, Object.assign({ respawn: 50 }, o));
    // health leaves + armor
    P('health', 31, 61); P('health', 52, 45, { respawn: 40 }); P('health', 101, 95); P('health', 125, 106); P('health', 145, 60); P('health', 18, 131); P('health', 90, 131); P('health', 9, 40);
    P('armor', 60, 56); P('armor', 132, 107); P('armor', 47, 131, { unlock: 3 }); P('armor', 148, 26, { unlock: 6 });
    P('bribe', 22, 44, { respawn: 90 }); P('bribe', 113, 88, { respawn: 90 }); P('bribe', 61, 107, { respawn: 90 }); P('bribe', 153, 120, { respawn: 90 });
    // weapons (normal progression: some only appear later in the story)
    P('weapon', 23, 76, { w: 'pistol' }); P('weapon', 76, 22, { w: 'pistol' }); P('weapon', 139, 57, { w: 'pistol' });
    P('weapon', 47, 22, { w: 'smg', unlock: 3 }); P('weapon', 95, 106, { w: 'smg', unlock: 4 });
    P('weapon', 10, 106, { w: 'shotgun', unlock: 4 }); P('weapon', 113, 60, { w: 'shotgun', unlock: 5 });
    P('weapon', 135, 22, { w: 'rifle', unlock: 7 }); P('weapon', 58, 89, { w: 'rifle', unlock: 7 });
    P('weapon', 165, 52, { w: 'grenade', unlock: 3 }); P('weapon', 23, 22, { w: 'grenade', unlock: 5 });
    P('weapon', 165, 84, { w: 'flamer', unlock: 8 }); P('weapon', 79, 147, { w: 'flamer', unlock: 9 });
    P('weapon', 121, 156, { w: 'rocket', unlock: 8, respawn: 90 });
    void Z;
  }

  // ------------------------------------------------------------------ population
  function populate() {
    const pl = Player.ped, cx = W.ccx, cy = W.ccy;
    // despawn far things
    LP.prune(W.cars, (c) => {
      if (c.mission || c === (pl && pl.inCar)) return false;
      const d2 = dist2(c.x, c.y, cx, cy);
      if (c.gone) return true;
      if (c.wreck && (c.wreckT || 0) > 50 && d2 > 400 * 400) return true;
      if (c.parked && !c.stolen) return false;
      if (d2 > 820 * 820) return true;
      return false;
    });
    LP.prune(W.peds, (p) => {
      if (p.mission) return false;
      if (p.gone) return true;
      if (p.dead && p.deadT > 20) return true;
      return dist2(p.x, p.y, cx, cy) > 640 * 640;
    });
    // traffic
    let traffic = 0, cops = 0;
    for (const c of W.cars) if (c.ai && c.ai.mode === 'traffic' && dist2(c.x, c.y, cx, cy) < 700 * 700) { traffic++; if (c.police) cops++; }
    if (traffic < 17) {
      const lane = City.randomLane(cx, cy, 330, 600, W.view());
      if (lane && !W.cars.some((c) => dist2(c.x, c.y, lane.x, lane.y) < 45 * 45)) {
        const patrol = cops < 2 && Math.random() < 0.15;
        const c = W.addCar(patrol ? 'police' : Cars.trafficType(), lane.x, lane.y, lane.a);
        c.driver = W.makeDriver(patrol ? 'cop' : 'civ');
        c.ai = { mode: 'traffic', from: lane.from, to: lane.to, next: null, lane: City.laneOffsets(lane.e).indexOf(lane.off), off: lane.off, cruise: LP.rand(110, 155), wait: 0 };
        c.vx = Math.cos(lane.a) * 90; c.vy = Math.sin(lane.a) * 90;
      }
    }
    // pedestrians
    let peds = 0;
    for (const p of W.peds) if (!p.dead && !p.mission && dist2(p.x, p.y, cx, cy) < 600 * 600) peds++;
    for (let k = 0; k < 2 && peds < 34; k++) {
      const s = City.randomWalk(cx, cy, 250, 520, W.view());
      if (!s) break;
      const d = City.districtAt(Math.floor(s.x / 16), Math.floor(s.y / 16));
      const r = Math.random();
      if (r < 0.07) W.addPed('cop', 'cop', s.x, s.y, { weapon: 'pistol' });
      else if (r < 0.17 && (d === 'docks' || d === 'neon')) {
        const f = d === 'docks' ? 'green' : 'purple';
        const n = LP.randi(2, 3);
        for (let i = 0; i < n; i++) W.addPed('gang', f, s.x + LP.rand(-10, 10), s.y + LP.rand(-10, 10), { faction: f, weapon: Math.random() < 0.3 ? 'smg' : 'pistol', state: 'idle' });
      } else W.addPed('civ', null, s.x, s.y);
      peds++;
    }
  }
  W.gangHostile = function (f) {
    if (W.gangHate[f] > 0) return true;
    const d = Missions.done;
    if (f === 'green') return d >= 4 && d < 8;
    if (f === 'purple') return d >= 9 && d < 12;
    return false;
  };

  // ------------------------------------------------------------------ flow field toward the player (for anyone chasing on foot)
  const FW = 72, flow = new Int16Array(FW * FW);
  let fox = 0, foy = 0;
  function buildFlow() {
    const p = Player.ped; if (!p) return;
    const ptx = Math.floor(p.x / 16), pty = Math.floor(p.y / 16);
    fox = ptx - (FW >> 1); foy = pty - (FW >> 1);
    flow.fill(-1);
    const q = new Int32Array(FW * FW);
    let h = 0, t = 0;
    const s = (pty - foy) * FW + (ptx - fox);
    flow[s] = 0; q[t++] = s;
    while (h < t) {
      const i = q[h++], x = i % FW, y = (i / FW) | 0, d = flow[i];
      for (let k = 0; k < 4; k++) {
        const nx = x + (k === 0 ? 1 : k === 1 ? -1 : 0), ny = y + (k === 2 ? 1 : k === 3 ? -1 : 0);
        if (nx < 0 || ny < 0 || nx >= FW || ny >= FW) continue;
        const j = ny * FW + nx;
        if (flow[j] >= 0 || City.solidPed(nx + fox, ny + foy)) continue;
        flow[j] = d + 1; q[t++] = j;
      }
    }
  }
  W.flowDir = function (x, y) {
    const tx = Math.floor(x / 16) - fox, ty = Math.floor(y / 16) - foy;
    if (tx < 0 || ty < 0 || tx >= FW || ty >= FW) return null;
    const d0 = flow[ty * FW + tx];
    if (d0 < 0) return null;
    let bx = 0, by = 0, bd = d0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = tx + dx, ny = ty + dy;
      if (nx < 0 || ny < 0 || nx >= FW || ny >= FW) continue;
      const v = flow[ny * FW + nx];
      if (v < 0 || v >= bd) continue;
      if (dx && dy && (flow[ty * FW + nx] < 0 || flow[ny * FW + tx] < 0)) continue;   // no corner cutting
      bd = v; bx = dx; by = dy;
    }
    if (!bx && !by) return null;
    // aim for the centre of the next tile
    const cx = (tx + bx + fox) * 16 + 8, cy = (ty + by + foy) * 16 + 8;
    const vx = cx - x, vy = cy - y, m = Math.hypot(vx, vy) || 1;
    return [vx / m, vy / m];
  };

  // ------------------------------------------------------------------ damage, death, props
  W.damagePed = function (p, dmg, by, how, ang) {
    if (p.dead) return;
    const isPlayer = p === Player.ped;
    if (isPlayer) {
      if (Game.invuln > 0) return;
      const a = Math.min(p.armor, dmg * 0.7); p.armor -= a; dmg -= a;
      p.hp -= dmg; Player.hurtT = 0.25;
      if (dmg > 3) LP.FX.shake(2, 6);
      if (p.hp <= 0) { p.hp = 0; W.kill(p, by, how, ang); }
      return;
    }
    p.hp -= dmg; p.flash = 0.06;
    Fx.debris(p.x, p.y, 3, [City.shade(Peds.SK[p.skin].fur, -0.1), Peds.SK[p.skin].shirt], 70);
    const byPlayer = by && by.kind === 'player';
    if (byPlayer) {
      if (p.kind === 'cop' || p.kind === 'swat') { Police.crime('hitCop', p.x, p.y); p.state = 'chase'; }
      else if (p.kind === 'gang') { W.gangHate[p.faction] = 60; p.hostile = true; }
      else if (p.kind === 'civ' && how !== 'car') Police.crime('hitPed', p.x, p.y);
    }
    if (p.hp <= 0) W.kill(p, by, how, ang);
    else if (p.kind === 'civ') Peds.scare(p, by ? by.x : p.x, by ? by.y : p.y, 5);
  };
  W.kill = function (p, by, how, ang) {
    p.dead = true; p.deadT = 0; p.burn = 0;
    if (ang !== undefined) { p.a = ang; p.vx = Math.cos(ang) * 60; p.vy = Math.sin(ang) * 60; }
    const sk = Peds.SK[p.skin];
    Fx.debris(p.x, p.y, 7, [sk.fur, sk.shirt, '#f0e6d0'], 110);
    City.stamp(p.x, p.y, 8, (g, lx, ly) => { g.globalAlpha = 0.45; G.ellipse(lx + LP.rand(-2, 2), ly + LP.rand(-2, 2), 5, 4, '#3a1414', g); g.globalAlpha = 1; });
    GameAudio.sfx(p === Player.ped ? 'wasted' : 'oof', p.x, p.y);
    if (p === Player.ped) { Game.wasted(how); return; }
    const byPlayer = by && by.kind === 'player';
    if (byPlayer) {
      if (p.kind === 'cop' || p.kind === 'swat') { Player.stats.cops++; Police.crime('killCop', p.x, p.y); }
      else if (p.kind === 'gang') { Player.stats.gang++; W.gangHate[p.faction] = 60; }
      else { Player.stats.peds++; if (how !== 'car') Police.crime('killPed', p.x, p.y); else Police.crime('hitPed', p.x, p.y); }
      const cash = p.kind === 'civ' ? LP.randi(3, 20) : LP.randi(15, 60);
      if (Math.random() < 0.6) Weapons.addPickup('cash', p.x + LP.rand(-4, 4), p.y + LP.rand(-4, 4), { amount: cash, life: 25 });
      if ((p.kind === 'gang' || p.kind === 'cop' || p.kind === 'swat') && p.weapon !== 'fists' && Math.random() < 0.55)
        Weapons.addPickup('weapon', p.x + LP.rand(-5, 5), p.y + LP.rand(-5, 5), { w: p.weapon, amount: Math.ceil(Weapons.DEF[p.weapon].pickup / 3), life: 25 });
    }
    W.scare(p.x, p.y, 120);
    Missions.onKill(p, by);
  };
  W.eject = function (c, d, pulled) {
    const ca = Math.cos(c.a), sa = Math.sin(c.a), hw = c.t.wid / 2 + 6;
    d.x = c.x + sa * hw; d.y = c.y - ca * hw;
    if (City.solidPed(Math.floor(d.x / 16), Math.floor(d.y / 16))) { d.x = c.x - sa * hw; d.y = c.y + ca * hw; }
    d.inCar = null; d.dead = false;
    if (!W.peds.includes(d)) W.peds.push(d);
    if (pulled) { d.knock = 0.6; d.tumble = 0.6; d.vx = sa * 60; d.vy = -ca * 60; }
    if (d.kind === 'cop' || d.kind === 'swat') { d.state = 'chase'; d.home = c; }
    else if (d.kind === 'gang' || d.kind === 'boss') { d.hostile = true; d.state = 'chase'; }
    else if (d.kind === 'civ') { d.state = 'flee'; d.flee = { x: c.x, y: c.y }; d.t = 5; }
    return d;
  };
  W.punch = function (att, target, ang) {
    if (ang === undefined) ang = att.a;
    GameAudio.sfx('swipe', att.x, att.y);
    const isP = att === Player.ped;
    const list = isP ? W.peds : [Player.ped].concat(W.peds);
    for (const q of list) {
      if (!q || q === att || q.dead || q.inCar) continue;
      const d = dist(att.x, att.y, q.x, q.y);
      if (d > 15) continue;
      if (Math.abs(angDiff(ang, Math.atan2(q.y - att.y, q.x - att.x))) > 1.0 && d > 6) continue;
      if (!isP && q.faction === att.faction) continue;
      W.damagePed(q, isP ? 20 : 9, att, 'punch', ang);
      if (!q.dead) { q.knock = 0.35; q.vx = Math.cos(ang) * 70; q.vy = Math.sin(ang) * 70; }
      GameAudio.sfx('punch', q.x, q.y);
      if (isP) Police.crime(q.kind === 'cop' || q.kind === 'swat' ? 'punchCop' : 'punch', q.x, q.y);
      Fx.text(q.x, q.y - 8, LP.pick(['SLAP!', 'WHAP!', 'BONK!', 'THWAP!']), '#ffffff');
      if (!isP) break;
    }
  };
  W.ignite = function (p, by) {
    if (p.dead) return;
    p.burn = p === Player.ped ? 1.6 : 3.5; p.burnBy = by;
    if (p !== Player.ped && p.kind === 'civ') Peds.scare(p, p.x + LP.rand(-5, 5), p.y + LP.rand(-5, 5), 4);
  };
  W.damageCar = function (c, dmg, by, how) {
    if (c.gone) return;
    if (c.wreck) return;
    if (c.armored && how === 'bullet') dmg *= 0.4;
    c.hp -= dmg;
    if (by) c.lastHit = by;
    if (by && by.kind === 'player' && c.police && how !== 'crash') Police.crime('hitCop', c.x, c.y);
    if (c.driver && c.driver !== Player.ped && by && by.kind === 'player') c.angry = true;
    if (c.hp <= 0 && !(c.burn > 0)) { c.burn = how === 'explosion' ? 0.25 + Math.random() * 0.3 : 2.6; }
    if (how === 'explosion' && c.hp < -60) c.burn = Math.min(c.burn, 0.15);
  };
  W.carExplode = function (c) {
    if (c.wreck) return;
    c.wreck = true; c.wreckT = 0; c.burn = 0; c.hp = 0; c.siren = false;
    const big = c.type === 'tanker' ? 100 : c.type === 'bus' || c.type === 'truck' ? 70 : 58;
    const by = c.lastHit;
    if (c.driver === Player.ped) { Weapons.explode(c.x, c.y, big, by, {}); W.damagePed(Player.ped, 999, by, 'explosion'); }
    else {
      if (c.driver) { const d = c.driver; c.driver = null; d.x = c.x; d.y = c.y; W.peds.push(d); W.kill(d, by, 'explosion'); }
      if (c.passenger && c.passenger !== Player.ped) { const d = c.passenger; c.passenger = null; d.x = c.x + 4; d.y = c.y; W.peds.push(d); d.inCar = null; W.kill(d, by, 'explosion'); }
      Weapons.explode(c.x, c.y, big, by, {});
    }
    c.vx *= 0.3; c.vy *= 0.3; c.vx += LP.rand(-30, 30); c.vy += LP.rand(-30, 30); c.w += LP.rand(-3, 3);
    if (c.type === 'tanker') { for (let i = 0; i < 30; i++) Fx.add('glow', { x: c.x, y: c.y, vx: LP.rand(-140, 140), vy: LP.rand(-140, 140), life: LP.rand(0.6, 1.4), size: LP.rand(2, 4), drag: 2, shape: 'disc', cols: ['#ffffff', '#ffe060', '#ff9020', '#ff4fb4'] }); }
    if (by && by.kind === 'player') { Player.stats.wrecked++; Player.stats.explosions++; Police.crime(c.police ? 'wreckCop' : 'wreck', c.x, c.y); }
    Missions.onWreck(c, by);
  };
  W.carCrash = function (a, b, imp, x, y) {
    if (a.crashCD > 0 && (!b || b.crashCD > 0)) return;
    a.crashCD = 0.18; if (b) b.crashCD = 0.18;
    GameAudio.crash(imp, x, y);
    if (imp > 90) { Fx.sparks(x, y, Math.min(10, imp / 25)); Fx.debris(x, y, 2, ['#c8d8f0', a.col], 80); }
    const base = Math.max(0, imp - 55) * 0.13;
    const pa = a.driver === Player.ped, pb = b && b.driver === Player.ped;
    if (b) {
      const ma = a.t.mass, mb = b.t.mass;
      W.damageCar(a, base * mb / ma * (pa ? 0.55 : 1), b.driver || null, 'crash');
      W.damageCar(b, base * ma / mb * (pb ? 0.55 : 1), a.driver || null, 'crash');
      if ((pa && b.police) || (pb && a.police)) Police.crime(imp > 120 ? 'punchCop' : 'punch', x, y);
      if (pa || pb) { LP.FX.shake(Math.min(5, imp / 60), 8); const o = pa ? b : a; if (o.driver && o.driver.kind === 'civ' && o.ai && o.ai.mode === 'traffic' && Math.random() < 0.15 && imp > 80) o.angry = true; }
    } else {
      W.damageCar(a, base * (pa ? 0.5 : 1), null, 'crash');
      if (pa && imp > 120) LP.FX.shake(Math.min(5, imp / 70), 8);
    }
  };
  W.hitProp = function (p, force, by, bullet) {
    if (p.dead) return;
    if (p.explode) {
      p.hp -= force;
      if (p.hp > 0 && force < 140) return;
      p.dead = true;
      W.later(0.08 + Math.random() * 0.12, () => Weapons.explode(p.x, p.y, p.explode, by, { power: p.kind === 'pump' ? 1.3 : 1 }));
      return;
    }
    if (!p.knock) return;
    if (bullet && p.kind !== 'cone' && p.kind !== 'trash') return;
    p.dead = true;
    GameAudio.sfx(p.kind === 'lamp' || p.kind === 'hydrant' ? 'clang' : 'thud', p.x, p.y);
    if (p.light) { p.light.on = false; Fx.sparks(p.x, p.y, 8, '#ffe0a0'); }
    const cols = { lamp: ['#5a5a66', '#9a9aa8'], hydrant: ['#d02828', '#ff6060'], bench: ['#8a5a2a', '#5a3a1a'], trash: ['#6a6a74', '#c0c0b0', '#e04040'], cone: ['#ff8020', '#ffffff'], crate: ['#9a6a3a', '#6a4520'] }[p.kind] || ['#888'];
    Fx.debris(p.x, p.y, 8, cols, 120);
    if (p.kind === 'hydrant') W.geysers.push({ x: p.x, y: p.y, t: 9 });
    if (p.kind === 'lamp') City.stamp(p.x, p.y, 14, (g, lx, ly) => { g.fillStyle = '#4a4a56'; const a = by && by.a !== undefined ? by.a : 0; for (let i = 0; i < 12; i++) g.fillRect(Math.round(lx + Math.cos(a) * i), Math.round(ly + Math.sin(a) * i), 2, 2); });
  };
  W.splash = function (c) { Fx.water(c.x, c.y, 24, 160); GameAudio.sfx('splash', c.x, c.y); };
  W.dropPassenger = function (c) {
    const d = c.passenger; if (!d) return;
    c.passenger = null;
    const ca = Math.cos(c.a), sa = Math.sin(c.a), hw = c.t.wid / 2 + 6;
    d.x = c.x - sa * hw; d.y = c.y + ca * hw; d.inCar = null;
    if (City.solidPed(Math.floor(d.x / 16), Math.floor(d.y / 16))) { d.x = c.x + sa * hw; d.y = c.y - ca * hw; }
    if (!W.peds.includes(d)) W.peds.push(d);
  };

  // ------------------------------------------------------------------ update
  W.update = function (dt) {
    W.time += dt;
    for (let i = W.laterQ.length - 1; i >= 0; i--) { const l = W.laterQ[i]; if ((l.t -= dt) <= 0) { W.laterQ.splice(i, 1); l.fn(); } }
    for (const k in W.gangHate) if (W.gangHate[k] > 0) W.gangHate[k] -= dt;
    Player.update(dt);
    Police.update(dt);
    Missions.update(dt);
    if ((W.popT -= dt) <= 0) { W.popT = 0.35; populate(); }
    if ((W.flowT -= dt) <= 0) { W.flowT = 0.3; buildFlow(); }
    updateCars(dt);
    updatePeds(dt);
    Weapons.update(dt);
    Weapons.updatePickups(dt);
    for (let i = W.geysers.length - 1; i >= 0; i--) { const g = W.geysers[i]; g.t -= dt; Fx.water(g.x, g.y, 2, 200); if (g.t <= 0) W.geysers.splice(i, 1); }
    Fx.update(dt);
    camera(dt);
  };

  function updateCars(dt) {
    const pl = Player.ped, cx = W.ccx, cy = W.ccy;
    const obs = W.obstacles; obs.length = 0;
    const act = W.active; act.length = 0;
    for (const c of W.cars) {
      if (c.gone) continue;
      const far = dist2(c.x, c.y, cx, cy) > 760 * 760;
      if (far && !c.mission) continue;
      act.push(c); obs.push(c);
    }
    for (const p of W.peds) if (!p.dead && !p.inCar && dist2(p.x, p.y, cx, cy) < 600 * 600) obs.push(p);
    if (pl && !pl.inCar && !pl.dead) obs.push(pl);
    for (const c of act) {
      if (c.driver && c.driver !== pl) drive(c, dt, obs);
      else if (!c.driver) { c.throttle = 0; c.steer = 0; c.hand = c.parked && c.spd < 5; }
      const moving = c.spd > 0.5 || Math.abs(c.w) > 0.01 || c.throttle !== 0;
      if (moving || c.driver) Cars.physics(c, dt);
      // damage states
      if (!c.wreck) {
        const hp = c.hp / c.maxHp;
        c.smokeT -= dt;
        if (hp < 0.55 && c.smokeT <= 0) { c.smokeT = hp < 0.25 ? 0.06 : 0.15; Fx.smoke(c.x + Math.cos(c.a) * c.t.len * 0.35, c.y + Math.sin(c.a) * c.t.len * 0.35, hp < 0.25); }
        if (c.burn > 0) {
          c.burn -= dt;
          Fx.fire(c.x + Math.cos(c.a) * c.t.len * 0.3 + LP.rand(-3, 3), c.y + Math.sin(c.a) * c.t.len * 0.3 + LP.rand(-3, 3), 1.3);
          if (Math.random() < 0.5) Fx.smoke(c.x, c.y, true);
          if (c.driver && c.driver !== pl && c.burn < 2.2 && !c.mission) { const d = c.driver; c.driver = null; W.eject(c, d, false); Peds.scare(d, c.x, c.y, 5); }
          if (c.burn <= 0) W.carExplode(c);
        }
      } else {
        c.wreckT += dt;
        if (c.wreckT < 6 && Math.random() < 0.3) Fx.smoke(c.x, c.y, true);
        if (c.wreckT < 3 && Math.random() < 0.4) Fx.fire(c.x + LP.rand(-5, 5), c.y + LP.rand(-5, 5), 1);
      }
      if (c.sink > 0) {
        if (Math.random() < 0.3) Fx.water(c.x + LP.rand(-6, 6), c.y + LP.rand(-6, 6), 1, 60);
        if (c.sink > 1.3) {
          c.gone = true;
          if (c.driver === pl) { W.damagePed(pl, 999, null, 'drown'); }
          else if (c.driver) { c.driver.dead = true; }
          if (c.passenger && c.passenger.kind === 'ally') { c.passenger.dead = true; Missions.onKill(c.passenger, null); }
          Missions.onWreck(c, c.lastHit);
        }
      }
      // skid marks onto the ground
      if (c.skid > 0.45 && c.spd > 40 && !c.wreck && c.sink === 0) {
        const ca = Math.cos(c.a), sa = Math.sin(c.a), hl = c.t.len / 2 - 4, hw = c.t.wid / 2 - 2;
        for (const s of [-1, 1]) {
          const x = c.x - ca * hl - sa * hw * s, y = c.y - sa * hl + ca * hw * s;
          City.stamp(x, y, 2, (g, lx, ly) => { g.fillStyle = 'rgba(16,14,20,0.45)'; g.fillRect(Math.round(lx), Math.round(ly), 2, 2); });
        }
        if (Math.random() < 0.25) Fx.add('top', { x: c.x - ca * hl, y: c.y - sa * hl, vx: LP.rand(-10, 10), vy: LP.rand(-10, 10), life: 0.7, size: 2, grow: 6, shape: 'disc', col: '#c8c4d0', alpha: 0.35, fade: true });
      }
    }
    // car vs car
    for (let i = 0; i < act.length; i++) {
      const A = act[i];
      for (let j = i + 1; j < act.length; j++) {
        const B = act[j];
        if (Math.abs(A.x - B.x) > 48 || Math.abs(A.y - B.y) > 48) continue;
        if (A.sink > 0 || B.sink > 0) continue;
        Cars.collidePair(A, B);
      }
    }
    // car vs ped
    for (const c of act) {
      if (c.sink > 0) continue;
      const cs = Cars.circles(c, tmpC);
      for (const p of obs) {
        if (!p.skin || p.dead || p.inCar) continue;
        if (Math.abs(p.x - c.x) > c.t.len / 2 + 8 || Math.abs(p.y - c.y) > c.t.len / 2 + 8) continue;
        for (let i = 0; i < cs.length; i += 2) {
          const dx = p.x - cs[i], dy = p.y - cs[i + 1], d = Math.hypot(dx, dy) || 0.01, rr = c.t.cr + p.r;
          if (d >= rr) continue;
          const nx = dx / d, ny = dy / d;
          const rel = c.vx * nx + c.vy * ny;
          if (c.spd > 55 && rel > 35 && !(p.knock > 0)) {
            const dmg = c.spd * (p === pl ? 0.18 : 0.6);
            const ang = Math.atan2(c.vy, c.vx);
            p.knock = 0.6; p.tumble = 0.6; p.vx = c.vx * 0.8 + nx * 60; p.vy = c.vy * 0.8 + ny * 60;
            W.damagePed(p, dmg, c.driver || c.lastHit, 'car', ang);
            GameAudio.sfx('splat', p.x, p.y);
            c.vx *= 0.94; c.vy *= 0.94;
            if (c.driver === pl && !p.dead) Fx.text(p.x, p.y - 8, LP.pick(['OOF!', 'BONK!', 'WHUMP!']), '#ffffff');
          } else { p.x += nx * (rr - d); p.y += ny * (rr - d); }
          break;
        }
      }
    }
  }
  const tmpC = [];

  function drive(c, dt, obs) {
    const ai = c.ai, pl = Player.ped;
    if (!ai) { Traffic.adopt(c); return; }
    if (c.sink > 0 || c.wreck) { c.throttle = 0; return; }
    // a civilian you rammed might lose it and chase you
    if (c.angry && ai.mode === 'traffic' && !c.police) { ai.mode = 'angry'; ai.t = 10; }
    switch (ai.mode) {
      case 'traffic':
        Cars.traffic(c, dt, obs);
        if (c.police && Police.stars > 0 && W.nearPlayer(c, 300) && City.los(c.x, c.y, pl.x, pl.y)) { c.ai = { mode: 'pursue' }; c.siren = true; }
        break;
      case 'angry': {
        ai.t -= dt;
        Cars.navigate(c, dt, pl.x, pl.y, { speed: c.t.top * 0.9 });
        if (ai.t <= 0) { c.angry = false; Traffic.adopt(c); }
        break;
      }
      case 'pursue': {
        if (Police.stars <= 0) { Traffic.adopt(c); break; }
        const tgt = pl.inCar || pl;
        const lead = Police.stars >= 3 ? 0.45 : 0.25;
        const gx = tgt.x + (tgt.vx || 0) * lead, gy = tgt.y + (tgt.vy || 0) * lead;
        const onFoot = !pl.inCar;
        const slowTarget = onFoot || pl.inCar.spd < 30;
        const d = Cars.navigate(c, dt, gx, gy, { stopAt: slowTarget ? 40 : 0, speed: c.t.top * (Police.stars >= 3 ? 1.04 : 0.95), directRange: 260 });
        if (slowTarget && d < 80 && c.spd < 40 && !c.unloaded) {
          c.unloaded = true;
          const n = c.type === 'swat' ? 3 : 2;
          for (let i = 0; i < n; i++) {
            const cop = W.addPed(c.type === 'swat' ? 'swat' : 'cop', c.type === 'swat' ? 'swat' : 'cop', c.x + LP.rand(-8, 8), c.y + LP.rand(-8, 8), { weapon: c.type === 'swat' ? 'smg' : 'pistol', state: 'chase' });
            cop.home = c;
            Peds.move(cop, 0);
          }
          c.ai = { mode: 'parkedCop' };
        }
        // patrol car ramming gets mean at 3+
        if (!onFoot && d < 70 && Police.stars >= 3) c.steer = Cars.steerTo(c, tgt.x, tgt.y, 3.2);
        break;
      }
      case 'parkedCop':
        c.throttle = c.spd > 5 ? -1 : 0; c.steer = 0; c.hand = true;
        break;
      case 'block':
        c.throttle = 0; c.hand = true; c.steer = 0;
        ai.t -= dt;
        if (ai.t <= 0 && !W.nearPlayer(c, 500)) c.gone = true;
        break;
      case 'chase': {           // gang / mission attackers
        const tg = ai.target && !ai.target.gone && !ai.target.wreck && !ai.target.dead ? ai.target : (pl.inCar || pl);
        const d = Cars.navigate(c, dt, tg.x + (tg.vx || 0) * 0.3, tg.y + (tg.vy || 0) * 0.3, { speed: c.t.top * (ai.speedMul || 0.95), directRange: 280, stopAt: tg === pl ? 30 : 0 });
        ai.gunT = (ai.gunT || LP.rand(0.5, 1.5)) - dt;
        if (d < 190 && ai.gunT <= 0 && c.driver && City.los(c.x, c.y, tg.x, tg.y)) {
          ai.gunT = ai.burst > 0 ? 0.12 : LP.rand(0.9, 1.6);
          ai.burst = ai.burst > 0 ? ai.burst - 1 : 3;
          Weapons.fire(c.driver, Math.atan2(tg.y - c.y, tg.x - c.x) + LP.rand(-0.12, 0.12), true, ai.gun || 'smg');
        }
        if (ai.unload && d < 70 && c.spd < 40 && !c.unloaded) { c.unloaded = true; ai.unload(c); }
        break;
      }
      case 'path': {           // follow a list of points (escort bus, getaway routes)
        if (!ai.pts.length) { c.throttle = c.spd > 5 ? -1 : 0; c.hand = true; if (ai.done) { const f = ai.done; ai.done = null; f(c); } break; }
        const p0 = ai.pts[0];
        if (dist(c.x, c.y, p0.x, p0.y) < (ai.pts.length === 1 ? 26 : 38)) { ai.pts.shift(); break; }
        Cars.navigate(c, dt, p0.x, p0.y, { direct: true, directRange: 99999, speed: ai.speed || c.t.top * 0.8, near: obs, noHand: true });
        if (ai.patient && Cars.blockedAhead(c, 22, obs) < 12) { ai.waitT = (ai.waitT || 0) + dt; if (ai.waitT > 2.5 && c.hornT <= 0) { c.hornT = 2; GameAudio.horn(c); } }
        else ai.waitT = 0;
        break;
      }
      case 'flee': {
        if (!ai.dest || dist(c.x, c.y, ai.dest.x, ai.dest.y) < 60) {
          if (ai.onArrive && ai.dest) { const f = ai.onArrive; ai.onArrive = null; f(c); if (c.ai !== ai) break; }
          const away = City.nodes.filter((n) => dist(n.x, n.y, pl.x, pl.y) > 700);
          ai.dest = LP.pick(away.length ? away : City.nodes);
        }
        Cars.navigate(c, dt, ai.dest.x, ai.dest.y, { speed: ai.speed || c.t.top, direct: false });
        if (ai.gun && c.driver && W.nearPlayer(c, 160)) {
          ai.gunT = (ai.gunT || 1) - dt;
          if (ai.gunT <= 0 && City.los(c.x, c.y, pl.x, pl.y)) { ai.gunT = LP.rand(0.3, 0.9); Weapons.fire(c.driver, Math.atan2(pl.y - c.y, pl.x - c.x) + LP.rand(-0.15, 0.15), true, ai.gun); }
        }
        break;
      }
      case 'idle':
        c.throttle = c.spd > 5 ? -1 : 0; c.hand = true;
        break;
    }
    if (c.hornT > 0) c.hornT -= dt;
  }

  function updatePeds(dt) {
    const pl = Player.ped;
    for (const p of W.peds) {
      if (p.inCar || p.gone) continue;
      if (p.dead) {
        p.deadT += dt;
        if (p.deadT < 0.6) { p.vx *= Math.pow(0.02, dt); p.vy *= Math.pow(0.02, dt); Peds.move(p, dt); }
        continue;
      }
      if (p.flash > 0) p.flash -= dt;
      if (p.burn > 0) {
        p.burn -= dt;
        if (Math.random() < 0.6) Fx.fire(p.x, p.y, 0.9);
        W.damagePed(p, 14 * dt, p.burnBy, 'fire');
        if (p.dead) continue;
      }
      if (p.knock > 0) {
        p.knock -= dt; p.tumble = Math.max(0, p.knock);
        p.vx *= Math.pow(0.03, dt); p.vy *= Math.pow(0.03, dt);
        Peds.move(p, dt); p.moving = false;
        continue;
      }
      p.tumble = 0;
      if (p.brain) p.brain(p, dt);
      else think(p, dt);
      if (p.burn > 0 && p !== pl && p.kind !== 'boss') { const a = W.time * 5 + p.id; p.vx = Math.cos(a) * 80; p.vy = Math.sin(a * 1.3) * 80; p.a = Math.atan2(p.vy, p.vx); }
      dodge(p, dt);
      Peds.move(p, dt);
      p.moving = Math.abs(p.vx) + Math.abs(p.vy) > 5;
      if (p.moving) p.anim += dt * Math.hypot(p.vx, p.vy) / 50;
    }
    // ped-ped separation (cheap: only near the camera)
    const list = W.obstacles;
    for (let i = 0; i < list.length; i++) {
      const a = list[i]; if (!a.skin) continue;
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j]; if (!b.skin) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) continue;
        const d = Math.hypot(dx, dy) || 0.01;
        if (d < 7) { const push = (7 - d) / 2, nx = dx / d, ny = dy / d; if (a !== pl) { a.x -= nx * push; a.y -= ny * push; } if (b !== pl) { b.x += nx * push; b.y += ny * push; } }
      }
    }
  }
  function dodge(p, dt) {
    if (p.kind === 'player' || p.dodgeT > 0) { if (p.dodgeT > 0) { p.dodgeT -= dt; p.vx = p.dvx; p.vy = p.dvy; } return; }
    if ((p.id + Math.floor(W.time * 10)) % 6) return;
    for (const c of W.active) {
      if (c.spd < 90 || !c.driver) continue;
      const dx = p.x - c.x, dy = p.y - c.y, d = Math.hypot(dx, dy);
      if (d > 60 || d < 8) continue;
      const vx = c.vx / c.spd, vy = c.vy / c.spd;
      const along = dx * vx + dy * vy, lat = -dx * vy + dy * vx;
      if (along > 0 && Math.abs(lat) < 12 && Math.random() < 0.45) {
        const s = lat >= 0 ? 1 : -1;
        p.dodgeT = 0.35; p.dvx = -vy * s * 150; p.dvy = vx * s * 150;
        if (p.kind === 'civ') { p.state = 'flee'; p.flee = { x: c.x, y: c.y }; p.t = 3; }
        return;
      }
    }
  }
  function think(p, dt) {
    const pl = Player.ped;
    switch (p.kind) {
      case 'civ':
        if (p.state === 'flee') Peds.flee(p, dt); else Peds.wander(p, dt);
        break;
      case 'cop': case 'swat': {
        const chase = Police.stars > 0 && (p.state === 'chase' || W.nearPlayer(p, 260));
        if (chase && W.nearPlayer(p, 520)) {
          p.state = 'chase';
          // back to the cruiser if you drove off
          if (pl.inCar && p.home && !p.home.wreck && !p.home.gone && !p.home.driver && dist(p.x, p.y, pl.x, pl.y) > 150) {
            const h = p.home;
            const d = dist(p.x, p.y, h.x, h.y);
            if (d < 18) { h.driver = p; p.inCar = h; p.gone = true; h.ai = { mode: 'pursue' }; h.siren = true; h.unloaded = false; break; }
            const a = Math.atan2(h.y - p.y, h.x - p.x); p.vx = Math.cos(a) * 70; p.vy = Math.sin(a) * 70; p.a = a;
            break;
          }
          const s = Police.stars;
          p.weapon = p.kind === 'swat' ? (s >= 5 ? 'rifle' : 'smg') : (s >= 4 ? 'smg' : s >= 3 && p.id % 3 === 0 ? 'shotgun' : 'pistol');
          const tgt = pl.inCar || pl;
          Peds.hunt(p, dt, tgt, { shoot: s >= 2, melee: false, slow: false });
          if (s === 1) { const d = Math.hypot(tgt.x - p.x, tgt.y - p.y) || 1; p.vx = (tgt.x - p.x) / d * 70; p.vy = (tgt.y - p.y) / d * 70; const f = !p.sees && W.flowDir(p.x, p.y); if (f) { p.vx = f[0] * 70; p.vy = f[1] * 70; } }
        } else {
          if (p.state === 'chase') { p.state = 'wander'; p.dir = null; }
          Peds.wander(p, dt);
        }
        break;
      }
      case 'gang': {
        const hostile = p.hostile || W.gangHostile(p.faction);
        if (hostile && W.nearPlayer(p, p.mission ? 900 : 300)) { p.state = 'chase'; Peds.hunt(p, dt, pl.inCar || pl, { shoot: true, melee: true }); }
        else if (p.state === 'idle') { p.vx = p.vy = 0; p.t -= dt; if (p.t < -6) { p.state = 'wander'; p.t = LP.rand(2, 5); } if (Math.random() < 0.01) p.a += LP.rand(-1, 1); }
        else { Peds.wander(p, dt); if (Math.random() < 0.002) { p.state = 'idle'; p.t = 0; } }
        break;
      }
      case 'boss':
        Peds.hunt(p, dt, pl.inCar || pl, { shoot: true, melee: true });
        break;
      case 'ally': {
        if (p.state === 'captive') { p.vx = p.vy = 0; p.a += dt; break; }
        const tgt = pl.inCar || pl, d = dist(p.x, p.y, tgt.x, tgt.y);
        if (pl.inCar && d < 34 && !pl.inCar.passenger) { pl.inCar.passenger = p; p.inCar = pl.inCar; const i = W.peds.indexOf(p); if (i >= 0) W.peds.splice(i, 1); GameAudio.sfx('door'); break; }
        if (d > 18) {
          const f = W.flowDir(p.x, p.y);
          const vx = f ? f[0] : (tgt.x - p.x) / d, vy = f ? f[1] : (tgt.y - p.y) / d;
          const sp = d > 60 ? 88 : 60;
          p.vx = vx * sp; p.vy = vy * sp; p.a = Math.atan2(vy, vx);
        } else { p.vx = p.vy = 0; p.a = Math.atan2(tgt.y - p.y, tgt.x - p.x); }
        break;
      }
    }
  }

  // ------------------------------------------------------------------ camera
  W.snapCamera = function () {
    const p = Player.ped; if (!p) return;
    W.ccx = p.x; W.ccy = p.y;
    W.camX = Math.round(W.ccx - G.W / 2); W.camY = Math.round(W.ccy - G.H / 2);
  };
  function camera(dt) {
    const p = Player.ped; if (!p) return;
    let tx = p.x, ty = p.y;
    if (p.inCar) {
      const c = p.inCar, k = 0.42;
      let lx = c.vx * k, ly = c.vy * k; const m = Math.hypot(lx, ly);
      if (m > 105) { lx *= 105 / m; ly *= 105 / m; }
      tx += lx; ty += ly * 0.85;
    } else if (Ctl.usingMouse()) {
      tx += LP.clamp((Ctl.mx - G.W / 2) * 0.22, -50, 50); ty += LP.clamp((Ctl.my - G.H / 2) * 0.22, -40, 40);
    }
    const r = Math.min(1, dt * (p.inCar ? 3.2 : 5));
    W.ccx += (tx - W.ccx) * r; W.ccy += (ty - W.ccy) * r;
    W.ccx = LP.clamp(W.ccx, G.W / 2 - 40, City.WPX - G.W / 2 + 40); W.ccy = LP.clamp(W.ccy, G.H / 2 - 40, City.HPX - G.H / 2 + 40);
    W.camX = Math.round(W.ccx - G.W / 2); W.camY = Math.round(W.ccy - G.H / 2);
  }

  // ------------------------------------------------------------------ render
  const propSpr = {};
  function propSprite(p) {
    const k = p.kind + (p.col || '') + (p.a ? 'r' : '');
    if (propSpr[k]) return propSpr[k];
    let c;
    switch (p.kind) {
      case 'lamp': c = G.make(6, 6, (g) => { G.disc(3, 3, 2, '#3a3a46', g); g.fillStyle = '#8a8a98'; g.fillRect(2, 2, 2, 2); }); break;
      case 'hydrant': c = G.make(7, 7, (g) => { G.disc(3, 3, 3, '#a01818', g); G.disc(3, 3, 2, '#e03030', g); g.fillStyle = '#ffd0d0'; g.fillRect(2, 2, 1, 1); }); break;
      case 'barrel': c = G.make(10, 10, (g) => { G.disc(5, 5, 4, '#8a1414', g); G.disc(5, 5, 3, '#d02424', g); G.ring(5, 5, 2, '#901010', g); g.fillStyle = '#ffd23e'; g.fillRect(4, 4, 2, 2); }); break;
      case 'pump': c = G.make(10, 12, (g) => { g.fillStyle = '#c02828'; g.fillRect(1, 1, 8, 10); g.fillStyle = '#e8e8f0'; g.fillRect(2, 2, 6, 3); g.fillStyle = '#202028'; g.fillRect(3, 6, 4, 3); g.fillStyle = '#ffd23e'; g.fillRect(8, 6, 2, 1); }); break;
      case 'dumpster': c = G.bake(18, 18, p.a || 0, (g) => { g.fillStyle = '#1e5a34'; g.fillRect(-7, -4.5, 14, 9); g.fillStyle = '#2e7a48'; g.fillRect(-6, -3.5, 5.5, 7); g.fillRect(0.5, -3.5, 5.5, 7); }); break;
      case 'bench': c = G.bake(12, 12, p.a || 0, (g) => { g.fillStyle = '#5a3a1a'; g.fillRect(-4.5, -2, 9, 4); g.fillStyle = '#9a6a3a'; g.fillRect(-4, -1.5, 8, 1); g.fillRect(-4, 0.5, 8, 1); }); break;
      case 'trash': c = G.make(7, 7, (g) => { G.disc(3, 3, 3, '#5a5a66', g); G.disc(3, 3, 2, '#2a2a30', g); g.fillStyle = '#c0c060'; g.fillRect(3, 2, 1, 1); }); break;
      case 'cone': c = G.make(5, 5, (g) => { G.disc(2, 2, 2, '#ff7a20', g); g.fillStyle = '#ffffff'; g.fillRect(2, 2, 1, 1); }); break;
      case 'crate': c = G.make(11, 11, (g) => { g.fillStyle = '#7a5028'; g.fillRect(0, 0, 11, 11); g.fillStyle = '#a87440'; g.fillRect(1, 1, 9, 9); g.fillStyle = '#6a4420'; for (let i = 1; i < 10; i++) { g.fillRect(i, i, 1, 1); g.fillRect(10 - i, i, 1, 1); } }); break;
      case 'fountain': c = G.make(26, 26, (g) => { G.disc(13, 13, 12, '#9a96a8', g); G.disc(13, 13, 10, '#2a6ab0', g); G.disc(13, 13, 3, '#b8b4c4', g); g.fillStyle = '#9ad0ff'; g.fillRect(8, 9, 3, 1); g.fillRect(15, 17, 3, 1); }); break;
      default: c = G.canvas(1, 1);
    }
    return (propSpr[k] = c);
  }
  const canopySpr = {};
  function canopy(p) {
    const k = p.kind + (p.col || '') + Math.floor(p.seed * 3);
    if (canopySpr[k]) return canopySpr[k];
    let c;
    if (p.kind === 'tree') c = G.make(22, 22, (g) => {
      const v = Math.floor(p.seed * 3), base = ['#2e6a34', '#356e2a', '#2a5e3e'][v];
      G.disc(11, 11, 10, City.shade(base, -0.35), g); G.disc(10, 10, 9, base, g); G.disc(8, 8, 5, City.shade(base, 0.18), g); G.disc(7, 7, 2, City.shade(base, 0.35), g);
    });
    else if (p.kind === 'palm') c = G.make(26, 26, (g) => {
      g.strokeStyle = '#2e7a34'; g.lineWidth = 3; g.lineCap = 'round';
      for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + p.seed; g.beginPath(); g.moveTo(13, 13); g.quadraticCurveTo(13 + Math.cos(a) * 7, 13 + Math.sin(a) * 7 - 2, 13 + Math.cos(a) * 12, 13 + Math.sin(a) * 12); g.stroke(); }
      g.strokeStyle = '#4ea84e'; g.lineWidth = 1;
      for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + p.seed; g.beginPath(); g.moveTo(13, 13); g.lineTo(13 + Math.cos(a) * 10, 13 + Math.sin(a) * 10); g.stroke(); }
      G.disc(13, 13, 2, '#6a4a2a', g);
      const d = g.getImageData(0, 0, 26, 26); for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] < 110 ? 0 : 255; g.putImageData(d, 0, 0);
    });
    else if (p.kind === 'umbrella') c = G.make(16, 16, (g) => {
      G.disc(8, 8, 7, p.col, g);
      g.fillStyle = '#ffffff'; for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4; G.line(8, 8, 8 + Math.cos(a) * 7, 8 + Math.sin(a) * 7, '#ffffff', g); }
      G.disc(8, 8, 1, '#ffffff', g);
    });
    else c = G.canvas(1, 1);
    return (canopySpr[k] = c);
  }
  const tmpProps = [];
  W.render = function (g) {
    const sx = LP.FX.sx, sy = LP.FX.sy;
    const camX = W.camX + sx, camY = W.camY + sy;
    const ccx = W.ccx, ccy = W.ccy;
    City.drawGround(g, camX, camY, G.W, G.H, W.time);
    Fx.draw(g, 'ground', camX, camY);
    // props at ground level
    City.propsNear(camX + G.W / 2, camY + G.H / 2, 330, tmpProps);
    for (const p of tmpProps) {
      if (p.kind === 'tree' || p.kind === 'palm' || p.kind === 'umbrella' || p.kind === 'tower') continue;
      const s = propSprite(p);
      g.drawImage(s, Math.round(p.x - camX - s.width / 2), Math.round(p.y - camY - s.height / 2));
    }
    for (const p of W.peds) if (p.dead) Peds.draw(g, p, camX, camY, W.time);
    for (const c of W.cars) if (c.wreck) Cars.draw(g, c, camX, camY);
    for (const c of W.cars) if (!c.wreck && !c.gone) Cars.draw(g, c, camX, camY);
    for (const p of W.peds) if (!p.dead && !p.inCar) Peds.draw(g, p, camX, camY, W.time);
    const pl = Player.ped;
    if (pl && !pl.inCar && !pl.dead) Peds.draw(g, pl, camX, camY, W.time);
    else if (pl && pl.dead && !pl.inCar) Peds.draw(g, pl, camX, camY, W.time);
    Weapons.draw(g, camX, camY);
    // tree canopies + umbrellas (low height lean)
    for (const p of City.props) {
      if (p.kind !== 'tree' && p.kind !== 'palm' && p.kind !== 'umbrella') continue;
      if (p.x < camX - 30 || p.y < camY - 30 || p.x > camX + G.W + 30 || p.y > camY + G.H + 30) continue;
      const s = canopy(p), z = p.kind === 'umbrella' ? 8 : 22;
      const ox = Math.round((p.x - ccx) * z * City.PK), oy = Math.round((p.y - ccy) * z * City.PK);
      g.globalAlpha = 0.3; g.drawImage(s, Math.round(p.x - camX - s.width / 2 + 3), Math.round(p.y - camY - s.height / 2 + 4)); g.globalAlpha = 1;
      g.drawImage(s, Math.round(p.x - camX - s.width / 2 + ox), Math.round(p.y - camY - s.height / 2 + oy));
    }
    // ---- night
    Lights.begin();
    Lights.city(camX, camY, W.time);
    for (const c of W.cars) { if (c.x < camX - 120 || c.y < camY - 120 || c.x > camX + G.W + 120 || c.y > camY + G.H + 120) continue; Cars.addLights(c, camX, camY, W.time); if (c.burn > 0 || (c.wreck && c.wreckT < 3)) Lights.add(c.x - camX, c.y - camY, 50, '#ff8030', 0.7); }
    for (const p of W.peds) if (p.burn > 0) Lights.add(p.x - camX, p.y - camY, 30, '#ff8030', 0.6);
    Fx.addLights(camX, camY);
    Weapons.addLights(camX, camY);
    Police.heliLights(camX, camY);
    if (pl) Lights.add(pl.x - camX, pl.y - camY, 34, '#ffffff', 0.22);
    Missions.addLights(camX, camY);
    Lights.apply(g);
    // ---- above the night: buildings, then everything that glows
    City.drawBuildings(g, camX, camY, G.W, G.H, ccx + sx, ccy + sy, W.time);
    for (const c of W.cars) Cars.drawEmissive(g, c, camX, camY, W.time);
    for (const p of tmpProps) if (p.kind === 'lamp' && !p.dead) { g.fillStyle = '#fff2c0'; g.fillRect(Math.round(p.x - camX) - 1, Math.round(p.y - camY) - 1, 2, 2); }
    Weapons.drawPickups(g, camX, camY, W.time);
    Missions.drawMarkers(g, camX, camY, W.time);
    Fx.draw(g, 'glow', camX, camY);
    Fx.draw(g, 'top', camX, camY);
    Police.drawHeli(g, camX, camY);
    Fx.drawText(g, camX, camY);
  };
  return W;
})();
