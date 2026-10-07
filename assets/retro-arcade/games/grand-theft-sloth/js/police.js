/* POLICE — HEAT (0-5 badges) and everything it sends after you.
   Crimes add heat (much more when a cop actually saw it). While any unit can see you
   the heat holds; out of sight long enough and it drops a badge at a time.
     1 badge  patrol cars give chase, cops on foot try to cuff you
     2        more cars, cops shoot
     3        aggressive ramming + ROADBLOCKS
     4        SWAT vans + the HELICOPTER (spotlight)
     5        everything, and the helicopter opens fire
   BUSTED when a cop gets hands on you (on foot, or with your car stopped). */
'use strict';
const Police = (function () {
  const P = {
    heat: 0, stars: 0, seenT: 0, lostT: 0, seen: false, spawnT: 0, roadT: 12, bustT: 0, flash: 0,
    min: 0, minT: 0, heli: null, off: false, units: []
  };
  const VALUE = { shots: 0.07, hitPed: 0.3, killPed: 0.45, hitCop: 0.9, killCop: 1.25, carjack: 0.45, carjackCop: 1.2, explosion: 0.55, wreck: 0.4, wreckCop: 1.0, punch: 0.2, punchCop: 0.8, heli: 1.5 };

  P.reset = function () {
    P.heat = 0; P.stars = 0; P.lostT = 0; P.seen = false; P.spawnT = 0; P.roadT = 12; P.bustT = 0; P.min = 0; P.minT = 0; P.heli = null; P.off = false; P.units.length = 0;
  };
  function setHeat(h) {
    const old = P.stars;
    P.heat = LP.clamp(h, 0, 5.99);
    P.stars = Math.floor(P.heat);
    if (P.stars > old) { P.flash = 1.2; GameAudio.sfx('star'); Player.stats.maxHeat = Math.max(Player.stats.maxHeat, P.stars); }
  }
  P.add = (v) => setHeat(P.heat + v);
  // a crime at (x, y): did a cop see it?
  P.crime = function (kind, x, y) {
    if (P.off) return;
    const v = VALUE[kind] || 0.2;
    const w = witnessed(x, y);
    // a lone gunshot nobody official heard barely matters; anything else gets called in
    P.add(w ? v : v * (kind === 'shots' ? 0.15 : 0.4));
    if (w) P.lostT = 0;
  };
  function witnessed(x, y) {
    for (const p of World.peds) if ((p.kind === 'cop' || p.kind === 'swat') && !p.dead && dist2(p.x, p.y, x, y) < 240 * 240 && City.los(p.x, p.y, x, y)) return true;
    for (const c of World.cars) if (c.police && c.driver && !c.wreck && dist2(c.x, c.y, x, y) < 280 * 280 && City.los(c.x, c.y, x, y)) return true;
    if (P.heli && !P.heli.dead && dist2(P.heli.x, P.heli.y, x, y) < 260 * 260) return true;
    return false;
  }
  P.force = function (stars, holdSec) { if (P.heat < stars) setHeat(stars + 0.3); P.min = stars; P.minT = holdSec || 0; P.lostT = 0; };
  P.clear = function () { setHeat(0); P.min = 0; P.minT = 0; P.lostT = 0; P.calmUnits(); };
  P.bribe = function () { setHeat(Math.max(P.min, Math.floor(P.heat) - 1 + 0.5)); P.lostT = 0; if (P.stars === 0) P.calmUnits(); };
  P.calmUnits = function () {
    for (const c of World.cars) if (c.police && c.ai && c.ai.mode === 'pursue') { c.ai = null; Traffic.adopt(c); }
    for (const p of World.peds) if ((p.kind === 'cop' || p.kind === 'swat') && p.state === 'chase') { p.state = 'wander'; p.dir = null; }
  };

  // ------------------------------------------------------------------ per-frame
  P.update = function (dt) {
    if (P.flash > 0) P.flash -= dt;
    if (P.minT > 0) { P.minT -= dt; if (P.minT <= 0) P.min = 0; }
    const pl = Player.ped;
    if (!pl || pl.dead) return;
    // do they see you?
    P.seen = false;
    if (P.stars > 0) {
      P.seenCheck = (P.seenCheck || 0) - dt;
      if (P.seenCheck <= 0) { P.seenCheck = 0.3; P.seenCache = witnessed(pl.x, pl.y); }
      P.seen = P.seenCache;
      if (P.seen) P.lostT = 0;
      else {
        P.lostT += dt;
        const need = 3.5 + P.stars * 1.3;
        if (P.lostT > need && P.heat > P.min) {
          P.lostT = 0;
          setHeat(Math.max(P.min, Math.floor(P.heat) - 1 + 0.4));
          if (P.stars === 0) { P.calmUnits(); HUD.toast('LOST THEM!', '#9dff4a'); GameAudio.sfx('lost'); }
          else HUD.toast('HEAT DOWN', '#3ef0ff');
        }
      }
    }
    if (P.heat < P.min) setHeat(P.min + 0.3);
    if (P.off) return;
    spawnUnits(dt);
    heliUpdate(dt);
    bustCheck(dt);
  };

  function spawnUnits(dt) {
    const pl = Player.ped, s = P.stars;
    // count pursuers
    let cars = 0, swat = 0;
    for (const c of World.cars) if (c.police && c.ai && c.ai.mode === 'pursue' && !c.wreck) { cars++; if (c.type === 'swat') swat++; }
    P.spawnT -= dt;
    const want = [0, 1, 2, 3, 4, 5][s], wantSwat = s >= 5 ? 2 : s >= 4 ? 1 : 0;
    if (s > 0 && P.spawnT <= 0 && cars < want + wantSwat) {
      P.spawnT = s >= 3 ? 1.6 : 2.6;
      const lane = City.randomLane(pl.x, pl.y, 300, 520, World.view(), Math.random);
      if (lane) {
        const type = swat < wantSwat ? 'swat' : 'police';
        // face toward the player along the road
        let from = lane.from, to = lane.to;
        if (dist2(to.x, to.y, pl.x, pl.y) > dist2(from.x, from.y, pl.x, pl.y)) { const t = from; from = to; to = t; }
        const dx = Math.sign(to.x - from.x), dy = Math.sign(to.y - from.y);
        const x = lane.x + dy * lane.off * 2, y = lane.y - dx * lane.off * 2;  // other side = correct lane for new heading
        const c = World.addCar(type, lane.x, lane.y, Math.atan2(dy, dx), { siren: true });
        void x; void y;
        c.driver = World.makeDriver(type === 'swat' ? 'swat' : 'cop');
        c.ai = { mode: 'pursue' };
        c.siren = true;
        c.vx = Math.cos(c.a) * 120; c.vy = Math.sin(c.a) * 120;
      }
    }
    // roadblocks at 3+
    P.roadT -= dt;
    if (s >= 3 && P.roadT <= 0 && pl.inCar && pl.inCar.spd > 120) { P.roadT = 16 + Math.random() * 6; roadblock(); }
  }

  function roadblock() {
    const car = Player.ped.inCar;
    const hx = car.vx / (car.spd || 1), hy = car.vy / (car.spd || 1);
    // the junction ~350 px ahead in the direction of travel
    let best = null, bs = -1;
    for (const n of City.nodes) {
      const dx = n.x - car.x, dy = n.y - car.y, d = Math.hypot(dx, dy);
      if (d < 260 || d > 520) continue;
      const dot = (dx * hx + dy * hy) / d;
      if (dot > 0.85 && dot > bs) { bs = dot; best = n; }
    }
    if (!best) return;
    // block the approach the player will come in on
    const horiz = Math.abs(hx) > Math.abs(hy);
    const back = horiz ? Math.sign(hx) : Math.sign(hy);
    const rw = 34;
    const cx = horiz ? best.x - back * 46 : best.x, cy = horiz ? best.y : best.y - back * 46;
    for (const s of [-1, 1]) {
      const x = horiz ? cx : cx + s * 13, y = horiz ? cy + s * 13 : cy;
      if (City.solidCar(Math.floor(x / 16), Math.floor(y / 16))) continue;
      const c = World.addCar(P.stars >= 4 ? 'swat' : 'police', x, y, horiz ? Math.PI / 2 * s : (s > 0 ? 0 : Math.PI), { siren: true });
      c.siren = true; c.ai = { mode: 'block', t: 40 }; c.block = true;
      const cop = World.addPed('cop', 'cop', x - (horiz ? back * 22 : 0), y - (horiz ? 0 : back * 22), { weapon: P.stars >= 4 ? 'smg' : 'pistol', state: 'chase' });
      cop.home = c;
    }
    void rw;
    HUD.toast('ROADBLOCK AHEAD!', '#ff5050');
  }

  function bustCheck(dt) {
    const pl = Player.ped;
    if (P.stars < 1) { P.bustT = 0; return; }
    let grabbing = false;
    for (const p of World.peds) {
      if ((p.kind !== 'cop' && p.kind !== 'swat') || p.dead || p.inCar) continue;
      if (pl.inCar) { if (pl.inCar.spd < 18 && dist2(p.x, p.y, pl.inCar.x, pl.inCar.y) < (pl.inCar.t.len / 2 + 9) ** 2) grabbing = true; }
      else if (dist2(p.x, p.y, pl.x, pl.y) < 13 * 13 && pl.knock <= 0) grabbing = true;
    }
    if (grabbing) { P.bustT += dt; if (P.bustT > (pl.inCar ? 1.3 : 0.9)) { P.bustT = 0; Game.busted(); } }
    else P.bustT = Math.max(0, P.bustT - dt * 2);
  }

  // ------------------------------------------------------------------ helicopter
  function heliUpdate(dt) {
    const pl = Player.ped;
    if (!P.heli && P.stars >= 4) {
      const a = Math.random() * Math.PI * 2;
      P.heli = { x: pl.x + Math.cos(a) * 420, y: pl.y + Math.sin(a) * 420, vx: 0, vy: 0, a: 0, hp: 220, sx: pl.x, sy: pl.y, fireCD: 3, dead: false, fall: 0, rot: 0, leaving: false };
      HUD.toast('POLICE CHOPPER!', '#ff5050');
    }
    const h = P.heli;
    if (!h) return;
    h.rot += dt * 30;
    if (h.dead) {
      h.fall += dt;
      h.a += dt * 6;
      h.x += h.vx * dt; h.y += h.vy * dt;
      Fx.smoke(h.x, h.y - 30 * (1 - h.fall / 1.6), true); Fx.fire(h.x, h.y - 30 * (1 - h.fall / 1.6), 1.2);
      if (h.fall > 1.6) { Weapons.explode(h.x, h.y, 80, Player.ped, { power: 1.4 }); P.heli = null; }
      return;
    }
    if (P.stars < 3) h.leaving = true;
    let tx, ty;
    if (h.leaving) { tx = h.x + (h.x - pl.x); ty = h.y + (h.y - pl.y); if (dist2(h.x, h.y, pl.x, pl.y) > 700 * 700) { P.heli = null; return; } }
    else { const o = World.time * 0.6; tx = pl.x + Math.cos(o) * 70; ty = pl.y + Math.sin(o) * 50; }
    const dx = tx - h.x, dy = ty - h.y, d = Math.hypot(dx, dy) || 1;
    const sp = Math.min(170, d * 1.5);
    h.vx += (dx / d * sp - h.vx) * Math.min(1, 2 * dt); h.vy += (dy / d * sp - h.vy) * Math.min(1, 2 * dt);
    h.x += h.vx * dt; h.y += h.vy * dt;
    h.a = Math.atan2(pl.y - h.y, pl.x - h.x);
    // spotlight drifts onto you
    h.sx += (pl.x - h.sx) * Math.min(1, 2.2 * dt); h.sy += (pl.y - h.sy) * Math.min(1, 2.2 * dt);
    if (P.stars >= 5 && !h.leaving) {
      h.fireCD -= dt;
      if (h.fireCD <= 0) {
        h.fireCD = h.burst > 0 ? 0.09 : 2.4;
        h.burst = h.burst > 0 ? h.burst - 1 : 8;
        const a = Math.atan2(h.sy - h.y, h.sx - h.x) + LP.rand(-0.15, 0.15);
        Weapons.bullets.push({ x: h.x, y: h.y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, dmg: 7, owner: P.heliPed, team: 'police', life: 0.8 });
        GameAudio.shot('smg', h.x, h.y, true);
      }
    }
  }
  P.heliPed = { kind: 'heli', faction: 'police' };
  P.hitHeli = function (d) {
    const h = P.heli; if (!h || h.dead) return;
    h.hp -= d;
    if (h.hp <= 0) {
      h.dead = true; h.vx *= 0.5; h.vy *= 0.5;
      HUD.toast('CHOPPER DOWN!', '#ffd23e'); Player.addMoney(2500); P.crime('heli', h.x, h.y);
      Player.stats.helis++;
    }
  };
  P.drawHeli = function (g, camX, camY) {
    const h = P.heli; if (!h) return;
    const z = h.dead ? 30 * Math.max(0, 1 - h.fall / 1.6) : 30;
    const x = h.x - camX, y = h.y - camY;
    // shadow on the ground
    g.globalAlpha = 0.35; G.ellipse(x + 10, y + 16, 12, 6, '#000', g); g.globalAlpha = 1;
    const hx = Math.round(x), hy = Math.round(y - z * 0.4);
    g.save(); g.translate(hx, hy); g.rotate(h.a);
    g.fillStyle = '#1a2440'; g.fillRect(-18, -1, 14, 2); g.fillRect(-20, -4, 3, 8);
    G.ellipse(0, 0, 9, 6, '#26345a', g); G.ellipse(3, 0, 5, 4, '#7ab0e0', g); G.ellipse(-2, 0, 4, 3, '#f0f0f4', g);
    g.restore();
    // rotor
    g.strokeStyle = 'rgba(220,220,235,0.55)'; g.lineWidth = 1.5;
    for (let i = 0; i < 2; i++) { const a = h.rot + i * Math.PI / 2; g.beginPath(); g.moveTo(hx - Math.cos(a) * 17, hy - Math.sin(a) * 17); g.lineTo(hx + Math.cos(a) * 17, hy + Math.sin(a) * 17); g.stroke(); }
    const blink = Math.floor(World.time * 4) % 2;
    g.fillStyle = blink ? '#ff3030' : '#3060ff'; g.fillRect(hx - 1, hy - 1, 2, 2);
  };
  P.heliLights = function (camX, camY) {
    const h = P.heli; if (!h || h.dead) return;
    Lights.add(h.sx - camX, h.sy - camY, 44, '#ffffff', 1);
    Lights.add(h.sx - camX, h.sy - camY, 30, '#ffffff', 0.8);
  };
  return P;
})();
