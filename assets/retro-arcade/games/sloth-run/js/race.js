/* RACE — the driving game: car physics, traffic, collisions, clock, checkpoints, forks, score,
   the goal sequence, the autopilot (attract demo + test bot) and the HUD.

   Phases:  count (3-2-1) -> drive -> [timeup -> game over] | [goal -> ending]
   Units:   z / speed in world units (one segment = Track.SEG), lateral x in road half-widths (u).
   Arcade rules, not physics: steering is a lateral speed, bends push you outward (more at speed),
   grass slows you to a crawl, scenery spins you out, traffic bumps you back.  */
'use strict';
const Race = (function () {
  const SEG = Track.SEG, MAX = SEG * 62;
  const ACCEL = MAX / 4.2, BRAKE = MAX / 1.45, COAST = MAX / 5.5, OFF_LIMIT = MAX * 0.34, OFF_DECEL = MAX / 1.3;
  const STEER = 2.4, CF = 0.17, PHW = 0.12, CAR_LEN = SEG * 0.5;
  const R = {
    MAX, phase: 'count', t: 0, z: 0, speed: 0, x: 0, vx: 0, camX: 0, steer: 0, throttle: 0, braking: false,
    time: 0, score: 0, stageT: 0, totalT: 0, splits: [], route: [], info: null, leg: 0,
    cars: [], crash: 0, crashDir: 1, offroad: false, drift: 0, driftPts: 0, skid: 0,
    combo: 0, comboT: 0, shaka: 0, face: 0, idleLook: 6, msgs: [], banner: null, choice: 0,
    bg: { a: null, b: null, t: 0 }, off: [0, 0, 0], away: 0, demo: false, auto: false, autoSide: 1,
    lastTick: 0, results: null, nearMisses: 0, crashes: 0
  };

  // ---------------------------------------------------------------- setup
  R.start = function (opts) {
    opts = opts || {};
    Track.reset();
    const first = STAGES[opts.stage || 0];
    R.info = Track.addStage(first, { first: true });
    R.route = [first.id]; R.leg = first.leg;
    R.z = 0; R.speed = 0; R.x = 0; R.vx = 0; R.camX = 0; R.steer = 0;
    R.time = first.leg ? 75 : first.time; R.score = 0; R.stageT = 0; R.totalT = 0; R.splits = [];
    R.phase = 'count'; R.t = 0; R.crash = 0; R.drift = 0; R.driftPts = 0; R.combo = 0; R.comboT = 0;
    R.shaka = 0; R.face = 0; R.msgs = []; R.banner = { stage: first, t: 0 }; R.away = 0; R.results = null;
    R.nearMisses = 0; R.crashes = 0; R.passes = 0;
    R.demo = !!opts.demo; R.auto = !!(opts.demo || opts.auto); R.autoSide = Math.random() < 0.5 ? -1 : 1;
    R.bg = { a: Backgrounds.get(first), b: null, t: 0 }; R.off = [0, 0, 0];
    R.cars = [];
    Traffic.fill();
    LP.FX.clear();
  };
  R.stage = () => STAGES[R.info.id];
  R.pz = () => R.z + Road.PLAYER_Z;               // the player's own z
  R.pct = () => R.speed / MAX;
  R.mph = () => Math.round(R.speed / MAX * 186);

  function msg(text, color, dur, o) { R.msgs.push(Object.assign({ text, color: color || '#ffe14a', t: 0, dur: dur || 2 }, o)); }
  R.msg = msg;
  function addScore(n) { if (!R.demo) R.score += n; }

  // ---------------------------------------------------------------- input (players, pads, or the autopilot)
  function padAxis() {
    try {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const p of pads) if (p && p.connected && p.axes.length) {
        const ax = p.axes[0], rt = p.buttons[7] ? p.buttons[7].value : 0, lt = p.buttons[6] ? p.buttons[6].value : 0;
        return { steer: Math.abs(ax) > 0.15 ? Math.sign(ax) * Math.min(1, (Math.abs(ax) - 0.15) / 0.75) : 0, rt, lt };
      }
    } catch (e) { /* no pads */ }
    return { steer: 0, rt: 0, lt: 0 };
  }
  function readInput() {
    if (R.auto) return Auto.input();
    const I = LP.Input, p = padAxis();
    let steer = (I.held('right') ? 1 : 0) - (I.held('left') ? 1 : 0);
    if (!steer && p.steer) steer = p.steer;
    const accel = Math.max(I.held('accel') ? 1 : 0, p.rt > 0.1 ? p.rt : 0);
    const brake = I.held('brake') || p.lt > 0.3;
    return { steer, accel, brake };
  }

  // ---------------------------------------------------------------- update
  R.update = function (dt) {
    R.t += dt;
    const inp = readInput();
    LP.FX.update();
    for (const m of R.msgs) m.t += dt;
    LP.prune(R.msgs, (m) => m.t > m.dur);
    if (R.banner) { R.banner.t += dt; if (R.banner.t > 3.2) R.banner = null; }
    if (R.bg.b) { R.bg.t += dt / 2.5; if (R.bg.t >= 1) { R.bg.a = R.bg.b; R.bg.b = null; R.bg.t = 0; } }
    R.shaka = Math.max(0, R.shaka - dt); R.face = Math.max(0, R.face - dt);
    R.comboT = Math.max(0, R.comboT - dt); if (!R.comboT) R.combo = 0;

    if (R.phase === 'count') {
      const before = Math.ceil(3 - (R.t - dt - 0.6)), now = Math.ceil(3 - (R.t - 0.6));
      if (R.t >= 0.6 && now !== before && now > 0 && now <= 3) LP.Audio.play('beep');
      if (R.t >= 3.6) { R.phase = 'drive'; R.t = 0; LP.Audio.play('go'); msg('GO!', '#7aff5a', 1.0, { big: 3 }); LP.Audio.startMusic(Screens.song()); }
      R.throttle = inp.accel; R.braking = inp.brake;
      GameAudio.Engine.start();
      GameAudio.Engine.update(0, inp.accel, false, 0, true);
      Traffic.update(dt, true);
      return;
    }

    const driving = R.phase === 'drive';
    if (driving) {
      R.time -= dt; R.stageT += dt; R.totalT += dt;
      const sec = Math.ceil(R.time);
      if (R.time > 0 && R.time < 10 && sec !== R.lastTick) { R.lastTick = sec; LP.Audio.play('tick'); }
      if (R.time <= 0) { R.time = 0; R.phase = 'timeup'; R.t = 0; LP.Audio.stopMusic(); LP.Audio.play('timeup'); msg('TIME UP', '#ff3c5c', 99, { big: 3 }); }
    }
    physics(dt, driving ? inp : { steer: R.phase === 'goal' ? Auto.goalSteer() : 0, accel: R.phase === 'goal' ? 0.6 : 0, brake: false });
    Traffic.update(dt, R.phase === 'goal');
    if (driving) { collisions(); checkpoints(); }
    scoring(dt);

    if (R.phase === 'timeup' && R.speed < 1 && R.t > 2.5) { GameAudio.Engine.stop(); Screens.raceOver(false); }
    if (R.phase === 'goal') {
      if (R.t > 8.5) { GameAudio.Engine.stop(); Screens.raceOver(true); }
    }
    if (R.demo && R.t > 70 && R.phase === 'drive') Screens.demoOver();
  };

  function physics(dt, inp) {
    const seg = Track.find(R.pz()), pct = R.pct();
    R.braking = !!inp.brake && R.speed > 1;
    R.throttle = inp.accel;
    // ---- crash spin-out: no control, slide to a stop, then get put back near the road
    if (R.crash > 0) {
      R.crash -= dt;
      R.speed = Math.max(0, R.speed - MAX * 1.6 * dt);
      const s = Track.surface(seg, R.x), tgt = s.center + LP.clamp(R.x - s.center, -0.7, 0.7);
      R.x += (tgt - R.x) * Math.min(1, dt * 2.5);
      R.vx = 0; R.drift = 0; R.skid = 0;
      R.z += R.speed * dt;
      R.camX += (R.x - R.camX) * Math.min(1, dt * 6); R.camX = LP.clamp(R.camX, R.x - 0.09, R.x + 0.09);
      GameAudio.Engine.update(R.pct(), 0, false, 0.4, false);
      if (Math.random() < 0.6) smoke('#c8c8d0', 1);
      return;
    }
    // ---- drift: brake + hard steer at speed = power slide (more grip, little speed loss)
    const wantDrift = inp.brake && Math.abs(inp.steer) > 0.5 && pct > 0.5 && R.phase === 'drive';
    R.drift = wantDrift ? Math.min(1, R.drift + dt * 4) : Math.max(0, R.drift - dt * 3);
    // ---- speed
    let acc = 0;
    if (inp.accel > 0) acc += ACCEL * inp.accel * (1 - 0.55 * pct * pct);
    else acc -= COAST;
    if (inp.brake) acc -= R.drift > 0.3 ? COAST * 0.9 : BRAKE;
    const surf = Track.surface(seg, R.x);
    R.offroad = !surf.on;
    if (R.offroad && R.speed > OFF_LIMIT) acc = Math.min(acc, -OFF_DECEL);
    R.speed = LP.clamp(R.speed + acc * dt, 0, MAX);
    // ---- steering (a lateral speed) + the bend pushing you outward
    const authority = Math.min(1, 0.25 + pct * 1.1) * (1 + R.drift * 0.45);
    const target = inp.steer * STEER * authority * (R.speed > 1 ? 1 : 0);
    R.vx += (target - R.vx) * Math.min(1, dt * (R.drift > 0.3 ? 5 : 9));
    const push = STEER * pct * pct * seg.curve * CF;
    R.x += (R.vx - push) * dt;
    R.x = LP.clamp(R.x, surf.center - 3.2, surf.center + 3.2);
    R.steer = inp.steer;
    if (R.phase === 'goal') {
      // the camera brakes to a stop while the car cruises on toward the horizon
      R.speed += (MAX * 0.42 - R.speed) * Math.min(1, dt * 1.5);
      R.camSpeed = R.t < 1.2 ? R.speed : Math.max(0, R.camSpeed - MAX * 0.45 * dt);
      R.z += R.camSpeed * dt; R.away += (R.speed - R.camSpeed) * dt;
    } else R.z += R.speed * dt;
    if (R.z + Road.PLAYER_Z >= Track.length() - SEG * 2) { R.z = Track.length() - SEG * 2 - Road.PLAYER_Z; R.speed = 0; }
    // camera follows with a little lag, so the car swings across the screen in bends
    R.camX += (R.x - R.camX) * Math.min(1, dt * 6);
    R.camX = LP.clamp(R.camX, R.x - 0.09, R.x + 0.09);
    // ---- background parallax
    const run = R.speed * dt / SEG;
    R.off[0] += seg.curve * run * 0.0012; R.off[1] += seg.curve * run * 0.0024; R.off[2] += seg.curve * run * 0.0042;
    // ---- feedback
    R.skid = LP.clamp(R.drift * 0.9 + (inp.brake && pct > 0.35 ? 0.5 : 0) + (Math.abs(push) > 1.6 && Math.abs(inp.steer) > 0.6 ? 0.5 : 0), 0, 1) * (R.speed > MAX * 0.2 ? 1 : 0);
    GameAudio.Engine.update(R.pct(), inp.accel, R.offroad && R.speed > 20, R.offroad ? 0 : R.skid, false);
    if (R.offroad && R.speed > MAX * 0.05) {
      if (Math.random() < 0.8) smoke(R.stage().colors.grass[0], 2);
      LP.FX.shake(1, 3);
    }
    if (R.skid > 0.4 && Math.random() < 0.7) smoke('#e8e8f0', 1);
  }

  function smoke(color, n) {
    const sx = carScreenX();
    for (let i = 0; i < n; i++) {
      const side = Math.random() < 0.5 ? -1 : 1;
      LP.FX.spawn({ x: sx + side * LP.rand(36, 50), y: 288, vx: side * LP.rand(0.1, 0.9), vy: LP.rand(0.3, 1.4), g: 0, drag: 0.94, life: LP.randi(14, 26), size: LP.randi(3, 6), color, draw: puff });
    }
  }
  function puff(ctx, p, x, y) {
    const s = Math.round(p.size + p.t * 0.35);
    ctx.globalAlpha = Math.max(0, 0.8 - p.t / p.life * 0.8);
    ctx.fillStyle = p.color; ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s);
    ctx.globalAlpha = 1;
  }
  function sparks(x, y) {
    for (let i = 0; i < 14; i++) LP.FX.spawn({ x, y, vx: LP.rand(-3, 3), vy: LP.rand(-3, 0.5), g: 0.18, drag: 0.96, life: LP.randi(10, 22), size: 2, color: i % 2 ? '#ffe14a' : '#ffffff', draw: G._part });
  }

  // ---------------------------------------------------------------- collisions
  function collisions() {
    const pz = R.pz(), seg = Track.find(pz);
    // scenery (only reachable off the road, or the fork sign in the median)
    for (const s of [seg, Track.segs[seg.i + 1]]) {
      if (!s) continue;
      for (const sp of s.sprites) {
        if (!sp.spr.hit) continue;
        if (Math.abs(sp.x - R.x) < PHW + sp.spr.hit) { hitScenery(sp); return; }
      }
    }
    // traffic
    for (const car of R.cars) {
      const dz = car.z - pz;
      if (dz < -CAR_LEN || dz > CAR_LEN) continue;
      const cx = Traffic.xOf(car);
      if (Math.abs(cx - R.x) < PHW + car.hw) {
        if (R.speed > car.speed) {
          const rel = R.speed - car.speed;
          R.speed = car.speed * (rel > MAX * 0.4 ? 0.6 : 0.88);
          R.z = car.z - CAR_LEN - Road.PLAYER_Z;
          R.vx = (R.x < cx ? -1 : 1) * 1.6; R.x += (R.x < cx ? -1 : 1) * 0.06;
          car.speed = Math.min(MAX * 0.75, car.speed + rel * 0.25); car.lx += (R.x < cx ? 1 : -1) * 0.05;
          LP.Audio.play('bump'); LP.FX.shake(rel > MAX * 0.4 ? 5 : 3, 12);
          sparks(carScreenX() + (cx - R.x) * 300, 250);
          R.combo = 0; R.comboT = 0; R.crashes++;
          if (rel > MAX * 0.4) R.face = 1.2;
        } else {
          // rear-ended at low speed by faster traffic: it squeezes past
          car.speed = Math.max(0, R.speed - SEG); car.lane = Traffic.freeLane(car);
        }
        return;
      }
    }
  }
  function hitScenery(sp) {
    const pct = R.pct();
    if (pct > 0.28) {
      R.crash = 1.6; R.crashDir = sp.x < R.x ? 1 : -1;
      R.speed *= 0.35;
      LP.Audio.play('crash'); LP.FX.shake(7, 22);
      sparks(carScreenX(), 250);
      R.face = 2.6; R.combo = 0; R.crashes++;
      msg(LP.pick(['NO WORRIES', 'STILL COOL', 'TOTALLY MEANT THAT', 'CHILL...', 'OOPS. ANYWAY.']), '#ffffff', 1.6, { y: 150 });
    } else {
      R.speed = 0; LP.Audio.play('bump'); LP.FX.shake(2, 8);
    }
    R.x += (sp.x < R.x ? 1 : -1) * 0.15;
  }

  // ---------------------------------------------------------------- forks, checkpoints, goal
  function checkpoints() {
    const info = R.info, idx = Track.find(R.pz()).i;
    if (!info.final) {
      if (!info.decided && idx >= info.forkStart - 60 && idx < info.decide) {
        if (!info.announced) { info.announced = true; LP.Audio.play('fork'); }
        const lr = R.x < info.base ? -1 : 1;
        if (lr !== R.choice) { R.choice = lr; if (info.announced && idx > info.forkStart) LP.Audio.play('menu'); }
      }
      if (!info.decided && idx >= info.decide) {
        const seg = Track.segs[idx];
        const side = Math.abs(R.x - seg.ca1) < Math.abs(R.x - seg.cb1) ? -1 : 1;
        info.decided = true; info.side = side;
        info.nextInfo = Track.decide(info, side);
        const dropped = side < 0 ? 'B' : 'A';
        for (const car of R.cars) if (car.road === dropped) car.dropped = true;
        R.bg.b = Backgrounds.get(STAGES[info.nextInfo.id]); R.bg.t = 0;      // the sky starts turning now
        LP.Audio.play('choose');
        Traffic.prune();
      }
      if (info.decided && idx >= info.gate) {
        const nx = info.nextInfo, st = STAGES[nx.id];
        R.splits.push({ id: info.id, t: R.stageT });
        R.time += st.time; R.stageT = 0;
        addScore(50000);
        R.info = nx; R.route.push(nx.id); R.leg++;
        LP.Audio.play('checkpoint');
        msg('CHECKPOINT!', '#3cf0ff', 2.2, { big: 2, y: 64 });
        msg('TIME +' + st.time, '#ffe14a', 2.2, { y: 92 });
        R.banner = { stage: st, t: -2.1 };
        R.shaka = 1.4; R.face = 1.4; LP.Audio.play('shaka');
      }
    } else if (idx >= info.goal) {
      R.splits.push({ id: info.id, t: R.stageT });
      R.phase = 'goal'; R.t = 0; R.away = 0;
      const bonus = Math.floor(R.time) * 20000;
      R.results = { timeLeft: R.time, timeBonus: bonus, goal: info.id };
      addScore(bonus);
      LP.Audio.stopMusic(); LP.Audio.play('goal');
      for (const c of R.cars) if (c.seg) { const a = c.seg.cars; a.splice(a.indexOf(c), 1); }
      R.cars.length = 0;
      msg('GOAL!', '#ff4fd0', 99, { big: 3, y: 70 });
      R.shaka = 99; R.face = 0;
    }
  }

  // ---------------------------------------------------------------- score & close calls
  function scoring(dt) {
    if (R.phase !== 'drive') return;
    addScore(Math.round(R.speed / MAX * 1700 * dt * 10) / 10);
    if (R.drift > 0.5 && !R.offroad) R.driftPts += 900 * dt;
    else if (R.driftPts > 0) {
      if (R.driftPts > 300) { const p = Math.round(R.driftPts / 100) * 100; addScore(p); msg('DRIFT +' + p, '#ff9a3c', 1.2, { y: 176 }); }
      R.driftPts = 0;
    }
    // idle cool: now and then the sloth glances back at you
    R.idleLook -= dt;
    if (R.idleLook < 0) { R.face = 0.9; R.idleLook = LP.rand(9, 16); }
  }
  // called by Traffic when the player overtakes a car
  R.passed = function (car, gap) {
    const pct = R.pct();
    R.passes = (R.passes || 0) + 1;
    if (gap < 0.2 && pct > 0.6 && !R.offroad) {
      R.combo = R.comboT > 0 ? R.combo + 1 : 1; R.comboT = 3;
      const pts = 1000 * Math.min(R.combo, 8);
      addScore(pts); R.nearMisses++;
      LP.Audio.play('closecall', { combo: R.combo });
      msg('CLOSE CALL! ' + (R.combo > 1 ? 'x' + R.combo + ' ' : '') + '+' + pts, '#7aff5a', 1.3, { y: 176 });
      R.shaka = 1.0; R.face = 0.8;
    } else {
      addScore(100);
      if (pct > 0.5) LP.Audio.play('pass');
    }
  };

  // ---------------------------------------------------------------- drawing
  function carScreenX() { return Road.W / 2 + (R.x - R.camX) * Road.PX; }
  R.carScreenX = carScreenX;

  R.render = function (g) {
    const st = R.stage();
    const pseg = Track.find(R.pz()), py = pseg.y1 + (pseg.y2 - pseg.y1) * ((R.pz() % SEG) / SEG);
    const v = { z: R.z, x: R.camX, camY: py + Road.CAM_H, fog: st.night ? 3 : 4 };
    const bgShift = LP.clamp(-(py - (R.info.baseY || 0)) * 0.0011, -18, 18);
    Road.background(g, { bgA: R.bg.a, bgB: R.bg.b, bgT: R.bg.t, off: R.off, bgShift });
    g.save(); g.translate(LP.FX.sx, LP.FX.sy);
    Road.draw(g, v);
    if (st.headlights && !R.away) headlights(g);
    const playerN = Math.floor(R.pz() / SEG) - Math.floor(R.z / SEG);
    Road.sprites(g, playerN, R.away > 0 ? null : drawPlayer, null);
    if (R.away > 0 && Road.count) drawAway(g);
    LP.FX.draw(0, 0);
    g.restore();
  };

  // night driving: a soft warm pool of light thrown up the road ahead of the car
  function headlights(g) {
    const sx = carScreenX(), P = Road.P;
    let far = null;
    for (let n = 6; n < 14; n++) if (P[n] && P[n].vis) far = P[n];
    if (!far) return;
    const fx = far.x1 + R.x * far.w1, fw = far.w1 * 0.9, fy = far.y1;
    g.save();
    g.globalCompositeOperation = 'lighter';
    const grad = g.createLinearGradient(0, 262, 0, fy);
    grad.addColorStop(0, 'rgba(255,236,170,0.22)'); grad.addColorStop(1, 'rgba(255,236,170,0)');
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(sx - 46, 262); g.lineTo(sx + 46, 262); g.lineTo(fx + fw, fy); g.lineTo(fx - fw, fy);
    g.closePath(); g.fill();
    g.restore();
  }

  function carFrame() {
    let lean = Math.round(LP.clamp(R.vx / STEER * 2.2 + R.drift * Math.sign(R.steer) * 0.8, -2, 2));
    if (R.crash > 0) lean = [-2, -1, 0, 1, 2, 1, 0, -1][(LP.Loop.frame >> 2) % 8] * R.crashDir;
    const head = R.face > 0 ? 'face' : lean > 0 ? 'right' : lean < 0 ? 'left' : 'back';
    const pose = R.shaka > 0 ? 'shaka' : 'hang';
    const tread = Math.floor(R.z / 60) % 2;
    return Cars.player(lean, R.braking || R.phase === 'count' ? 1 : 0, pose, head, tread);
  }
  function drawPlayer(g) {
    const sx = carScreenX();
    let bounce = 0;
    if (R.speed > MAX * 0.4) bounce = (LP.Loop.frame >> 2) % 2;
    if (R.offroad && R.speed > MAX * 0.05) bounce = LP.randi(0, 2);
    const y = 292;
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillRect(Math.round(sx - 62), y - 4, 124, 6); g.fillRect(Math.round(sx - 56), y + 2, 112, 2);
    const img = carFrame();
    g.drawImage(img, Math.round(sx - Cars.PW / 2), Math.round(y - 92 + bounce));
  }
  // after the goal: the car keeps going while the camera rests
  function drawAway(g) {
    const z = R.pz() + R.away, P = Road.P;
    for (let n = 0; n < Road.count; n++) {
      const p = P[n];
      if (!p.seg || p.seg.i * SEG > z || (p.seg.i + 1) * SEG <= z) continue;
      const t = (z % SEG) / SEG, w = p.w1 + (p.w2 - p.w1) * t, x = p.x1 + (p.x2 - p.x1) * t + R.x * w, y = p.y1 + (p.y2 - p.y1) * t;
      const k = w / Road.PX, img = carFrame();
      if (img.width * k < 2) return;
      g.drawImage(img, Math.round(x - img.width * k / 2), Math.round(y - 92 * k), Math.max(1, Math.round(img.width * k)), Math.max(1, Math.round(img.height * k)));
      return;
    }
  }

  // ---------------------------------------------------------------- HUD (front layer)
  R.hud = function (g) {
    const W = 400, f = LP.Loop.frame;
    G.to(g, () => {
      // time
      const tLow = R.time < 10 && R.phase === 'drive';
      Font.draw(g, 'TIME', 14, 8, '#ffe14a', { outline: '#1a0a2a' });
      const tc = tLow ? ((f >> 3) % 2 ? '#ff3c5c' : '#ffffff') : '#ffe14a';
      const ts = LP.pad(Math.ceil(R.time), 2);
      Font.draw(g, ts, 12, 20, tc, { scale: ts.length > 2 ? 2 : 3, outline: '#1a0a2a', shadow: '#ff4fd0' });
      // score
      Font.draw(g, 'SCORE', W / 2, 8, '#3cf0ff', { align: 'center', outline: '#1a0a2a' });
      Font.draw(g, String(Math.floor(R.score)), W / 2, 20, '#ffffff', { align: 'center', scale: 2, outline: '#1a0a2a', shadow: '#2c64e0' });
      // stage + lap
      Font.draw(g, 'STAGE ' + (R.leg + 1), W - 12, 8, '#ff9ad8', { align: 'right', outline: '#1a0a2a' });
      const lt = R.stageT, lap = Math.floor(lt / 60) + "'" + LP.pad(Math.floor(lt % 60), 2) + '"' + LP.pad(Math.floor((lt % 1) * 100), 2);
      Font.draw(g, 'LAP ' + lap, W - 12, 20, '#ffffff', { align: 'right', outline: '#1a0a2a', face: 'small', scale: 2 });
      // speed + tach
      const mph = R.mph();
      Font.draw(g, String(mph).padStart(3, ' '), W - 52, 266, '#ffffff', { align: 'right', scale: 3, outline: '#1a0a2a', shadow: '#ff4fd0' });
      Font.draw(g, 'MPH', W - 12, 282, '#ffe14a', { align: 'right', outline: '#1a0a2a' });
      const bars = 14, lit = Math.round(R.pct() * bars);
      for (let i = 0; i < bars; i++) {
        const h = 3 + i, x = W - 132 + i * 8, on = i < lit;
        G.rect(x - 1, 258 - h - 1, 7, h + 2, '#1a0a2a');
        G.rect(x, 258 - h, 5, h, on ? (i < 8 ? '#7aff5a' : i < 11 ? '#ffe14a' : '#ff3c5c') : '#3a2a4a');
      }
      courseMap(g);
      if (R.demo) {
        Font.draw(g, 'DEMO', W / 2, 46, '#ff4fd0', { align: 'center', scale: 2, outline: '#1a0a2a' });
        if ((f >> 4) % 2) Font.draw(g, 'PRESS START', W / 2, 140, '#ffffff', { align: 'center', scale: 2, outline: '#1a0a2a', shadow: '#2c64e0' });
      }
      // countdown
      if (R.phase === 'count' && R.t >= 0.6) {
        const n = Math.ceil(3 - (R.t - 0.6));
        if (n > 0 && n <= 3) Font.draw(g, String(n), W / 2, 100, '#ffe14a', { align: 'center', scale: 5, outline: '#1a0a2a', shadow: '#ff4fd0' });
        lights(g, 3 - n);
      } else if (R.phase === 'count') lights(g, -1);
      // fork chooser
      const info = R.info, idx = Track.find(R.pz()).i;
      if (info && !info.final && !info.decided && idx >= info.forkStart - 60) {
        const nx = Route.next(info.id), pulse = (f >> 3) % 2;
        Font.draw(g, 'CHOOSE YOUR ROAD', W / 2, 52, '#ffffff', { align: 'center', outline: '#1a0a2a' });
        const cl = R.choice < 0 ? (pulse ? '#ffe14a' : '#ffffff') : '#8a8aa0', cr = R.choice > 0 ? (pulse ? '#ffe14a' : '#ffffff') : '#8a8aa0';
        Font.draw(g, '< ' + nx[0].short, 14, 68, cl, { outline: '#1a0a2a' });
        Font.draw(g, nx[1].short + ' >', W - 14, 68, cr, { align: 'right', outline: '#1a0a2a' });
      }
      // stage banner
      if (R.banner && R.banner.t > 0) {
        const b = R.banner, k = Math.min(1, b.t * 3, (3.2 - b.t) * 3), y = 112;
        g.globalAlpha = Math.max(0, k);
        G.rect(0, y - 6, W, 34, 'rgba(20,8,40,0.55)');
        Font.draw(g, 'STAGE ' + (b.stage.leg + 1), W / 2, y, '#ff9ad8', { align: 'center', outline: '#1a0a2a' });
        Font.draw(g, b.stage.name, W / 2, y + 12, '#ffffff', { align: 'center', scale: 2, outline: '#1a0a2a', shadow: '#2c64e0' });
        g.globalAlpha = 1;
      }
      // messages
      let stack = 0;
      for (const m of R.msgs) {
        if (m.t < 0) continue;
        const blink = m.dur < 50 && m.t > m.dur - 0.4 && (f >> 2) % 2;
        if (blink) continue;
        const sc = m.big || 1, y = m.y !== undefined ? m.y : 80 + stack * 14;
        Font.draw(g, m.text, W / 2, y, m.color, { align: 'center', scale: sc, outline: '#1a0a2a', shadow: sc > 1 ? '#7a1a8a' : null });
        if (m.y === undefined) stack++;
      }
    });
  };
  function lights(g, lit) {
    const x = 200 - 46;
    G.rect(x - 4, 150, 100, 24, '#14101c'); G.frame(x - 4, 150, 100, 24, '#5a5a6a');
    for (let i = 0; i < 4; i++) {
      const on = i < lit || (lit >= 3 && i === 3) ? true : false;
      const c = i === 3 ? (lit >= 3 ? '#7aff5a' : '#1e3a1e') : (on ? '#ff3c3c' : '#3a1414');
      G.rect(x + 2 + i * 24, 155, 14, 14, c);
    }
  }
  // the pyramid: legs top to bottom, the route so far lit up
  function courseMap(g) {
    const x0 = 46, y0 = 236, dx = 13, dy = 13;
    const pos = (leg, col) => [x0 + (col - leg / 2) * dx * 1.6, y0 + leg * dy];
    G.rect(10, y0 - 10, 74, 62, 'rgba(20,8,40,0.5)');
    for (let leg = 0; leg < ROUTE.length - 1; leg++) for (let c = 0; c <= leg; c++) for (const d of [0, 1]) {
      const a = pos(leg, c), b = pos(leg + 1, c + d);
      G.line(a[0], a[1], b[0], b[1], '#4a3a6a');
    }
    for (let i = 0; i + 1 < R.route.length; i++) {
      const s1 = STAGES[R.route[i]], s2 = STAGES[R.route[i + 1]], a = pos(s1.leg, s1.col), b = pos(s2.leg, s2.col);
      G.line(a[0], a[1], b[0], b[1], '#ffe14a');
    }
    ROUTE.forEach((row, leg) => row.forEach((id, c) => {
      const p = pos(leg, c), on = R.route.includes(id), cur = id === R.info.id;
      G.rect(p[0] - 2, p[1] - 2, 5, 5, cur ? ((LP.Loop.frame >> 3) % 2 ? '#ffffff' : '#ff4fd0') : on ? '#ffe14a' : '#6a5a8a');
    }));
    // progress through the current stage
    const info = R.info, start = info.start * SEG, end = (info.final ? info.goal : info.gate) * SEG;
    const pr = LP.clamp((R.pz() - start) / (end - start), 0, 1);
    G.rect(14, y0 + 44, 66, 4, '#2a1a3a'); G.rect(14, y0 + 44, Math.round(66 * pr), 4, '#3cf0ff');
  }

  return R;
})();

/* ---------------------------------------------------------------- TRAFFIC */
const Traffic = (function () {
  const SEG = Track.SEG;
  const T = {};
  const laneX = (n, k) => -1 + (2 * k + 1) / n;
  const lanesOf = (seg) => STAGES[seg.stage].lanes || 3;
  T.xOf = (car) => Track.center(car.seg, car.road) + car.lx;
  const tcache = {};
  function img(type, ci, st) {
    const base = Cars.traffic(type, ci);
    if (!st.tint || !st.tint.night) return base;
    const key = type + ci + st.id;
    if (!tcache[key]) { tcache[key] = Px.night(base, st.tint.color, 0.45, 560); tcache[key].foot = base.foot; }
    return tcache[key];
  }
  function setSeg(car) {
    const s = Track.find(car.z);
    if (s !== car.seg) {
      if (car.seg) { const a = car.seg.cars, i = a.indexOf(car); if (i >= 0) a.splice(i, 1); }
      car.seg = s; s.cars.push(car);
    }
  }
  function remove(car) { if (car.seg) { const a = car.seg.cars, i = a.indexOf(car); if (i >= 0) a.splice(i, 1); } car.seg = null; }

  function spawn(z) {
    const seg = Track.find(z);
    if (!seg || seg.i >= Track.segs.length - 4) return null;
    const st = STAGES[seg.stage], tr = st.traffic, n = lanesOf(seg);
    const road = seg.only || (seg.showB ? (Math.random() < 0.5 ? 'A' : 'B') : 'A');
    const lane = LP.randi(0, n - 1);
    // keep spawns apart
    for (const c of Race.cars) if (c.road === road && c.lane === lane && Math.abs(c.z - z) < SEG * 6) return null;
    if (Math.abs(z - Race.pz()) < SEG * 3) return null;
    const type = LP.pick(tr.kinds), ci = LP.randi(0, 9);
    const car = { z, road, lane, lx: laneX(n, lane), type, img: img(type, ci, st), hw: Cars.TYPES[type].solid * 0.5,
      speed: Race.MAX * LP.rand(tr.slow, tr.fast), want: 0, blink: 0, seg: null, ahead: z > Race.pz(), cool: LP.rand(2, 8) };
    car.cruise = car.speed;
    setSeg(car);
    Race.cars.push(car);
    return car;
  }
  T.fill = function () {
    const st = STAGES[Race.info.id], n = st.traffic.n;
    let tries = 0;
    while (Race.cars.length < n && tries++ < 400) spawn(Race.pz() + SEG * LP.rand(20, Road.DRAW));
  };
  T.prune = function () {
    // after a fork is decided: cars on segments that no longer exist, or on the road being dropped
    LP.prune(Race.cars, (c) => {
      const dead = c.z >= Track.length() - SEG * 2 || c.seg.i >= Track.segs.length || Track.segs[c.seg.i] !== c.seg;
      if (dead) remove(c);
      return dead;
    });
  };
  T.freeLane = function (car) {
    const n = lanesOf(car.seg);
    const opts = [car.lane - 1, car.lane + 1].filter((k) => k >= 0 && k < n);
    return opts.length ? LP.pick(opts) : car.lane;
  };
  function blocked(car, lane, range) {
    for (const o of Race.cars) if (o !== car && o.road === car.road && o.lane === lane && o.z > car.z - SEG * 1.5 && o.z < car.z + range) return o;
    return null;
  }

  T.update = function (dt, frozen) {
    const pz = Race.pz(), camZ = Race.z, st = STAGES[Race.info.id];
    for (const car of Race.cars) {
      if (!frozen) {
        // follow / overtake slower traffic in the same lane
        const front = blocked(car, car.lane, SEG * 5);
        if (front && front.z > car.z && front.speed < car.speed) {
          const alt = T.freeLane(car);
          if (alt !== car.lane && !blocked(car, alt, SEG * 5)) { car.blink = alt > car.lane ? 1 : -1; car.lane = alt; }
          else car.speed = Math.max(front.speed, car.speed - Race.MAX * 0.3 * dt);
        } else car.speed += ((car.boost > 0 ? car.cruise * 1.45 : car.cruise) - car.speed) * Math.min(1, dt * 0.6);
        car.boost = Math.max(0, (car.boost || 0) - dt);
        // never let traffic form a wall across every lane in front of the player
        if (car.z > pz && car.z < pz + SEG * 60 && !car.boost) {
          let abreast = 0, front = true;
          for (const o of Race.cars) if (o !== car && o.road === car.road && o.lane !== car.lane && Math.abs(o.z - car.z) < SEG * 3) { abreast++; if (o.z > car.z) front = false; }
          if (abreast >= lanesOf(car.seg) - 1 && front) car.boost = 3;
        }
        // the odd lazy lane change
        car.cool -= dt;
        const nearPlayer = car.z > pz && car.z - pz < SEG * 14;
        if (car.cool < 0 && !nearPlayer) {
          car.cool = LP.rand(4, 10);
          if (Math.random() < 0.5) { const alt = T.freeLane(car); if (!blocked(car, alt, SEG * 6)) { car.blink = alt > car.lane ? 1 : -1; car.lane = alt; } }
        }
        const n = lanesOf(car.seg), tx = laneX(n, Math.min(car.lane, n - 1));
        car.lx = LP.approach(car.lx, tx, dt * 0.9);
        if (Math.abs(car.lx - tx) < 0.01) car.blink = 0;
        car.z += car.speed * dt;
        setSeg(car);
        // overtaken by the player?
        const ahead = car.z > pz;
        if (car.ahead && !ahead && Race.phase === 'drive') {
          const gap = Math.abs(T.xOf(car) - Race.x) - 0.12 - car.hw;
          Race.passed(car, gap);
        }
        car.ahead = ahead;
      }
    }
    // recycle: behind the camera -> respawn far ahead
    LP.prune(Race.cars, (car) => {
      const gone = car.z < camZ - SEG * 3 || car.z > camZ + SEG * (Road.DRAW + 30) || car.z >= Track.length() - SEG * 3 ||
        (car.dropped && (!car.seg.showB || Math.abs(car.seg.ca1 - car.seg.cb1) > 2 * Track.D + 3));
      if (gone) remove(car);
      return gone;
    });
    if (!frozen) {
      let k = 0;
      while (Race.cars.length < st.traffic.n && k++ < 6) spawn(camZ + SEG * LP.rand(Road.DRAW * 0.75, Road.DRAW));
    }
  };
  return T;
})();

/* ---------------------------------------------------------------- AUTOPILOT (attract demo / test bot) */
const Auto = (function () {
  const SEG = Track.SEG;
  const A = {};
  A.goalSteer = function () {
    const seg = Track.find(Race.pz()), c = Track.surface(seg, Race.x).center;
    return LP.clamp((c - Race.x) * 2, -1, 1);
  };
  A.input = function () {
    const pz = Race.pz(), seg = Track.find(pz), pct = Race.pct(), info = Race.info;
    // which road: at a fork, the bot's chosen side; else the nearest road
    let road = Track.surface(seg, Race.x).road;
    if (!info.final && !info.decided && seg.i >= info.forkStart - 10) road = Race.autoSide < 0 ? 'A' : 'B';
    const look = Track.segs[Math.min(Track.segs.length - 1, seg.i + 4)];
    const c = Track.center(look, road), n = STAGES[seg.stage].lanes || 3;
    // pick the lane with the most room ahead (sticky: only switch for a real gain)
    const rooms = [];
    for (let k = 0; k < n; k++) {
      const lx = c - 1 + (2 * k + 1) / n;
      let room = SEG * 45, lim = null;
      for (const car of Race.cars) {
        if (car.dropped || car.z < pz - SEG * 0.7 || car.z > pz + SEG * 45) continue;
        if (Math.abs(Traffic.xOf(car) - lx) < 0.32 + car.hw && car.z - pz < room) { room = car.z - pz; lim = car; }
      }
      rooms.push({ k, lx, room, car: lim });
    }
    if (A.lane === undefined || A.lane >= n || A.road !== road) { A.lane = Math.floor(n / 2); A.road = road; }
    let best = rooms[A.lane];
    const following = best.room < SEG * 14;
    for (const r of rooms) {
      // moving across lanes: nothing may be right beside us in the lanes we cross
      const lo = Math.min(r.k, A.lane), hi = Math.max(r.k, A.lane);
      let pathOk = true;
      for (let k = lo; k <= hi; k++) {
        if (k === A.lane) continue;
        const lx = rooms[k].lx;
        for (const car of Race.cars) if (!car.dropped && car.z > pz - SEG * 1.2 && car.z < pz + SEG * 2.2 && Math.abs(Traffic.xOf(car) - lx) < 0.3 + car.hw) pathOk = false;
      }
      if (pathOk && r.room > best.room + SEG * (following ? 2 : 6)) best = r;
    }
    A.lane = best.k;
    const err = best.lx - Race.x;
    const ff = pct * pct * seg.curve * 0.17 / Math.max(0.3, Math.min(1, 0.25 + pct * 1.1));
    const steer = LP.clamp(err * 3.2 + ff, -1, 1);
    let maxCurve = 0;
    for (let i = 0; i < 25; i++) { const s = Track.segs[seg.i + i]; if (s) maxCurve = Math.max(maxCurve, Math.abs(s.curve)); }
    let accel = 1, brake = false;
    if (maxCurve > 5.2 && pct > 0.9) accel = 0;
    // follow the car limiting our lane: brake if we can't stop in the room left
    if (best.car && Race.speed > best.car.speed) {
      const v = Race.speed, vf = best.car.speed, stop = (v * v - vf * vf) / (2 * Race.MAX / 1.45);
      const room = best.room - SEG * 1.2;
      if (room < stop * 1.2) { accel = 0; brake = true; } else if (room < stop * 2 + SEG * 2) accel = 0;
    }
    if (Race.offroad && pct > 0.3) accel = 0.3;
    return { steer, accel, brake };
  };
  return A;
})();
