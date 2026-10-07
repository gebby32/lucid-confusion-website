/* PLAYER — Two-Toes himself: walking, aiming, shooting, clawing, stealing cars,
   driving, drive-bys, bailing out, money and the career stats shown at the end. */
'use strict';
const Player = (function () {
  const P = { ped: null, money: 0, shown: 0, stats: null, fireT: 0, meleeT: 0, faceA: 0, hurtT: 0, enterT: 0 };
  const DEF = () => Weapons.DEF;
  const Inv = () => Weapons.Inv;
  P.freshStats = () => ({ carsStolen: 0, peds: 0, cops: 0, gang: 0, wrecked: 0, explosions: 0, helis: 0, maxHeat: 0, missions: 0, deaths: 0, busts: 0, earned: 0, time: 0, shots: 0 });
  P.stats = P.freshStats();

  P.spawn = function (x, y, a) {
    const p = Peds.make('player', 'player', x, y, { a: a || 0 });
    p.hp = 100; p.maxHp = 100; p.faction = 'player';
    P.ped = p; P.fireT = 0; P.meleeT = 0; P.faceA = p.a; P.hurtT = 0;
    Inv().reloadT = 0;
    return p;
  };
  P.addMoney = function (n) { P.money = Math.max(0, P.money + n); if (n > 0) P.stats.earned += n; };

  P.update = function (dt) {
    const p = P.ped;
    if (!p || p.dead) return;
    if (P.locked) { if (p.inCar) { p.inCar.throttle = 0; p.inCar.hand = true; } return; }
    P.stats.time += dt;
    if (P.hurtT > 0) P.hurtT -= dt;
    P.shown += (P.money - P.shown) * Math.min(1, dt * 6);
    if (Math.abs(P.money - P.shown) < 1) P.shown = P.money;
    P.fireT -= dt; P.meleeT -= dt; P.enterT -= dt;
    weaponKeys();
    if (p.burn > 0) { p.burn -= dt; if (Math.random() < 0.5) Fx.fire(p.x, p.y, 0.8); World.damagePed(p, 9 * dt, p.burnBy, 'fire'); }
    if (p.inCar) drive(dt); else onFoot(dt);
  };

  function weaponKeys() {
    const I = LP.Input, V = Inv();
    if (I.pressed('nextw') || Ctl.wheel > 0) V.cycle(1);
    if (I.pressed('prevw') || Ctl.wheel < 0) V.cycle(-1);
    for (let i = 0; i < 8; i++) if (I.pressed('w' + (i + 1))) V.select(Weapons.ORDER[i]);
    V.validate();
  }
  // soft auto-aim for keyboard / pad shooters
  function assist(p, ang) {
    let best = null, bs = 0.45;
    for (const q of World.peds) {
      if (q.dead || q.inCar || !(q.hostile || q.kind === 'cop' || q.kind === 'swat')) continue;
      const d = dist(p.x, p.y, q.x, q.y);
      if (d > 230) continue;
      const da = Math.abs(angDiff(ang, Math.atan2(q.y - p.y, q.x - p.x)));
      if (da < bs && City.los(p.x, p.y, q.x, q.y)) { bs = da; best = q; }
    }
    return best ? Math.atan2(best.y - p.y, best.x - p.x) : ang;
  }
  function shoot(p, aim, driving) {
    const V = Inv(), w = V.cur, D = DEF()[w];
    if (V.reloadT > 0) {
      V.reloadT -= 1 / 60;
      if (V.reloadT <= 0) { V.finishReload(w); GameAudio.sfx('reloaded'); }
      return;
    }
    const held = Ctl.fireHeld(driving);
    if (!driving && (Ctl.meleePressed()) && P.meleeT <= 0) { P.meleeT = 0.35; World.punch(p, null, aim); return; }
    if (!driving && Ctl.reloadPressed() && V.canReload(w)) { V.reloadT = D.reload; GameAudio.sfx('reload'); return; }
    if (!held || P.fireT > 0) return;
    if (driving && w === 'fists') return;
    if (V.ready(w)) {
      Weapons.fire(p, aim, false);
      V.consume(w);
      P.stats.shots++;
      P.fireT = D.rate;
      if (!V.ready(w)) {
        if (V.canReload(w)) { V.reloadT = D.reload; GameAudio.sfx('reload'); }
        else if (V.empty(w)) { V.validate(); }
      }
    } else if (V.canReload(w)) { V.reloadT = D.reload; GameAudio.sfx('reload'); }
    else { GameAudio.sfx('click'); P.fireT = 0.3; V.validate(); }
  }

  function onFoot(dt) {
    const p = P.ped, I = LP.Input;
    if (p.knock > 0) {
      p.knock -= dt; p.tumble = Math.max(0, p.knock);
      p.vx *= Math.pow(0.02, dt); p.vy *= Math.pow(0.02, dt);
      Peds.move(p, dt);
      return;
    }
    p.tumble = 0;
    const [mx, my] = Ctl.moveVec();
    const m = Math.hypot(mx, my);
    p.vx = mx * p.speed; p.vy = my * p.speed;
    p.moving = m > 0.1;
    if (p.moving) { p.anim += dt * (0.6 + m * 0.6); P.faceA = Math.atan2(my, mx); }
    Peds.move(p, dt);
    const sx = p.x - World.camX, sy = p.y - World.camY;
    let aim = Ctl.aim(sx, sy, Ctl.mDown);
    const firing = Ctl.fireHeld(false);
    if (aim === null) { aim = P.faceA; if (firing || Ctl.meleePressed()) aim = assist(p, aim); }
    p.a = aim; p.aimA = aim;
    shoot(p, aim, false);
    if (I.pressed('enter') && P.enterT <= 0) tryEnter();
  }

  function drive(dt) {
    const p = P.ped, c = p.inCar, I = LP.Input;
    if (c.gone) { P.exit(true); return; }
    c.throttle = LP.clamp(Ctl.gas() - Ctl.brake(), -1, 1);
    c.steer = LP.clamp(Ctl.steer(), -1, 1);
    c.hand = Ctl.hand();
    if (c.sink > 0) { c.throttle = 0; }
    p.x = c.x; p.y = c.y; p.a = c.a; p.vx = c.vx; p.vy = c.vy;
    const sx = c.x - World.camX, sy = c.y - World.camY;
    let aim = Ctl.aim(sx, sy, Ctl.mDown);
    if (aim === null) aim = c.a;
    p.aimA = aim;
    shoot(p, aim, true);
    if (I.pressed('horn')) GameAudio.horn(c, true);
    if (I.pressed('radio')) GameAudio.nextStation();
    if (I.pressed('enter') && P.enterT <= 0) P.exit();
  }

  function tryEnter() {
    const p = P.ped;
    let best = null, bd = 26;
    for (const c of World.cars) {
      if (c.gone || c.sink > 0 || c.wreck || c.noEnter) continue;
      if (Math.abs(c.x - p.x) > 40 || Math.abs(c.y - p.y) > 40) continue;
      const cs = Cars.circles(c, []);
      for (let i = 0; i < cs.length; i += 2) { const d = dist(p.x, p.y, cs[i], cs[i + 1]) - c.t.cr; if (d < bd) { bd = d; best = c; } }
    }
    if (best) P.enter(best);
  }
  P.enter = function (c) {
    const p = P.ped;
    if (c.driver && c.driver !== p) {
      const d = c.driver;
      c.driver = null;
      World.eject(c, d, true);
      Police.crime(c.police ? 'carjackCop' : 'carjack', c.x, c.y);
      P.stats.carsStolen++;
      HUD.toast(c.police ? 'STOLE A COP CAR!' : 'CARJACKED!', '#ffd23e');
    } else if (!c.stolen) { P.stats.carsStolen++; if (c.police) Police.crime('carjackCop', c.x, c.y); }
    c.driver = p; p.inCar = c; c.ai = null; c.parked = false; c.stolen = true; c.siren = false;
    p.burn = 0; P.enterT = 0.3;
    Weapons.Inv.reloadT = 0;
    HUD.carName(c.label || c.t.name);
    GameAudio.sfx('door');
    GameAudio.enterCar();
  };
  P.exit = function (forced) {
    const p = P.ped, c = p.inCar;
    if (!c) return;
    const ca = Math.cos(c.a), sa = Math.sin(c.a), hw = c.t.wid / 2 + 6, hl = c.t.len / 2 + 6;
    const spots = [[sa * hw, -ca * hw], [-sa * hw, ca * hw], [-ca * hl, -sa * hl], [ca * hl, sa * hl]];
    let sx = c.x + spots[0][0], sy = c.y + spots[0][1];
    for (const s of spots) {
      const x = c.x + s[0], y = c.y + s[1];
      if (!City.solidPed(Math.floor(x / 16), Math.floor(y / 16))) { sx = x; sy = y; break; }
    }
    p.x = sx; p.y = sy; p.inCar = null;
    c.driver = null; c.throttle = 0; c.hand = false; c.steer = 0;
    P.enterT = 0.3;
    if (c.passenger) World.dropPassenger(c);
    if (c.spd > 90 && !forced) {
      p.knock = 0.7; p.vx = c.vx * 0.55; p.vy = c.vy * 0.55;
      World.damagePed(p, Math.min(20, c.spd * 0.04), null, 'bail');
      GameAudio.sfx('bail');
    } else if (!forced) GameAudio.sfx('door');
    GameAudio.exitCar();
  };
  return P;
})();
