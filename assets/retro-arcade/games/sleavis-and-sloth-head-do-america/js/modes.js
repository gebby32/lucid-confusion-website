/* MODES — the ways you play.
     action  explore / brawl / sneak with both idiots (camera 'follow' or 'side').
             cfg = { camera, yaw, dist, height, side, camX: [min,max], combat, jump, special, sneak,
                     goal() -> true|'win'|{..}, guards: [actor..], failMsg, timer, onUpdate(dt) }
     drive   the van (or worse) on an endless crummy highway.  see Drive below.
     runner  being chased down a corridor of garbage.         see Runner below.
   Modes.start(name, cfg) -> mode (mode.result is set when it ends). */
'use strict';
const Modes = (function () {
  const M = { cur: null, defs: {} };
  M.start = function (name, cfg) {
    if (M.cur && M.cur.exit) M.cur.exit();
    const d = M.defs[name];
    const m = Object.create(d); m.cfg = cfg; m.result = null; m.t = 0; m.name = name;
    M.cur = m;
    if (m.enter) m.enter(cfg);
    return m;
  };
  M.stop = function () { if (M.cur && M.cur.exit) M.cur.exit(); M.cur = null; for (const a of Game.heroActors()) { a.controlled = false; a.mv = [0, 0]; } };
  M.update = function (dt, blocked) { if (M.cur) { M.cur.t += dt; M.cur.update(dt, blocked); } };
  M.camera = function (dt) {
    if (M.cur && M.cur.camera) return M.cur.camera(dt);
    const L = Game.leaderActor();
    if (L && L.vis.root.visible) { M.camY = M.camY === undefined || Stage.cam.snap ? L.ground : LP.lerp(M.camY, L.ground, Math.min(1, dt * 4)); }
    Stage.updateCamera(dt, L && L.vis.root.visible ? new THREE.Vector3(L.x, M.camY || 0, L.z) : null);
  };
  M.draw = function () { if (M.cur && M.cur.draw) M.cur.draw(); else HUD.draw({ noGame: !M.cur }); };
  M.enemiesLeft = () => Stage.cur.actors.filter((a) => a.team === 'enemy' && a.alive).length;

  // ==================================================================== ACTION
  M.defs.action = {
    enter(cfg) {
      const C = Stage.cam;
      C.mode = cfg.camera || 'follow';
      if (cfg.yaw !== undefined) C.yaw = cfg.yaw;
      if (cfg.dist) C.dist = cfg.dist;
      if (cfg.height) C.height = cfg.height;
      if (cfg.side) Object.assign(C.side, cfg.side);
      C.xMin = cfg.camX ? cfg.camX[0] : -1e9; C.xMax = cfg.camX ? cfg.camX[1] : 1e9;
      Stage.release();
      this.timer = cfg.timer || 0;
      this.guards = cfg.guards || [];
      this.alert = 0;
      for (const g of this.guards) M.guardSetup(g);
      Game.combat = cfg.combat !== false;
    },
    exit() { for (const g of this.guards || []) if (g.cone) Stage.cur.root.remove(g.cone); },
    update(dt, blocked) {
      const cfg = this.cfg;
      if (!blocked) Game.control(dt, cfg);
      else for (const a of Game.heroActors()) { a.controlled = false; a.mv = [0, 0]; }
      if (this.result) return;
      // triggers
      const L = Game.leaderActor();
      if (!blocked && L) for (const t of Stage.cur.trig) {
        if (t.done || (t.cond && !t.cond())) continue;
        if (Math.hypot(L.x - t.x, L.z - t.z) < t.r) { if (t.once !== false) t.done = true; Story.run(t.act, t, L); }
      }
      if (cfg.onUpdate) cfg.onUpdate(dt, this);
      if (this.guards.length && !blocked) this.updateGuards(dt);
      if (this.timer > 0 && !blocked) { this.timer -= dt; if (this.timer <= 0) { this.result = { fail: true, msg: cfg.timeoutMsg || 'Time\'s up, dumbass.' }; return; } }
      if (Game.allDown()) { this.result = { fail: true, msg: cfg.failMsg || LP.pick(DEATH.ko) }; return; }
      if (cfg.goal && !blocked) { const g = cfg.goal(this); if (g) this.result = g === true ? 'win' : g; }
    },
    updateGuards(dt) {
      let worst = 0;
      for (const g of this.guards) {
        if (!g.alive) { if (g.cone) g.cone.visible = false; continue; }
        M.guardPatrol(g, dt);
        let see = 0;
        for (const h of Game.heroActors()) {
          if (!h.vis.root.visible || h.gone || !h.alive) continue;
          const d = g.distTo(h);
          if (d > g.range) continue;
          const a = Math.abs(angDiff(g.face, g.angleTo(h)));
          if (a > g.fov / 2) continue;
          if (M.hidden(h)) continue;
          if (Stage.blocked(g.x, g.z, h.x, h.z, 1.2)) continue;
          see = Math.max(see, 1.6 * (1 - d / g.range) + 0.6);
        }
        g.sus = LP.clamp((g.sus || 0) + (see ? see * dt * 1.5 : -dt * 0.4), 0, 1.05);
        if (see && g.sus > 0.35 && !g.saidHuh) { g.saidHuh = true; HUD.popup(g.vis.headWorld(), '?', '#ffe040'); GameAudio.sfx('huh'); }
        if (!see && g.sus < 0.1) g.saidHuh = false;
        if (g.cone) {
          g.cone.position.set(g.x, g.y + 0.05, g.z); g.cone.rotation.y = g.face;
          g.cone.material.color.set(g.sus > 0.6 ? '#ff2020' : g.sus > 0.25 ? '#ff9020' : '#ffe060');
        }
        worst = Math.max(worst, g.sus);
        if (g.sus >= 1) {
          HUD.popup(g.vis.headWorld(), '!', '#ff2020');
          GameAudio.sfx('alert');
          this.result = { fail: true, msg: this.cfg.bustedMsg || LP.pick(DEATH.busted) };
          return;
        }
      }
      this.alert = worst;
      // Sleavis cannot keep his mouth shut
      const s = Game.hero('sleavis');
      if (s && s.vis.root.visible && !s.gone && LP.chance(dt / 9)) {
        HUD.bark('sleavis', LP.pick(['Heh heh. This is like a spy movie. Heh heh. Bond. JAMES Bond.', 'Shhh. Heh heh. SHHHHH.', 'I gotta pee. Heh heh.', '*fart* ...Heh heh. That was a quiet one.', 'Heh heh. Sneaky sneaky.']));
        for (const g of this.guards) if (g.alive && g.distTo(s) < 6) { g.sus = Math.min(0.9, (g.sus || 0) + 0.25); g.lookTimer = 1.5; g.faceT = g.angleTo(s); }
      }
    },
    draw() {
      HUD.draw();
      if (this.timer > 0) {
        const t = Math.ceil(this.timer);
        Font.draw(G.g, 'TIME ' + Math.floor(t / 60) + ':' + LP.pad(t % 60, 2), G.W / 2, 40, t < 10 && Math.floor(this.timer * 4) % 2 ? '#ff4040' : '#ffffff', { align: 'center', outline: '#000' });
      }
      if (this.guards && this.guards.length) {
        HUD.bar(G.W - 106, 30, 100, 5, this.alert, this.alert > 0.6 ? '#ff3030' : '#ffb030', 'SUSPICION');
      }
    }
  };

  // ---- stealth helpers
  M.guardSetup = function (g) {
    g.range = g.range || 7; g.fov = g.fov || 1.3; g.sus = 0;
    const n = 10, pts = [0, 0];
    const shape = new THREE.Shape(); shape.moveTo(0, 0);
    for (let i = 0; i <= n; i++) { const a = -g.fov / 2 + g.fov * i / n; shape.lineTo(Math.sin(a) * g.range, Math.cos(a) * g.range); }
    shape.lineTo(0, 0);
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(Math.PI / 2);
    geo.scale(1, 1, -1);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#ffe060', transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide }));
    m.renderOrder = 2;
    g.cone = m;
    Stage.cur.root.add(m);
    g.ai = () => {};          // movement comes from guardPatrol (mv), so keep a no-op brain
  };
  M.guardPatrol = function (g, dt) {
    if (!g.path || g.state !== 'free') return;
    const d = g.aiData;
    if (g.lookTimer > 0) { g.lookTimer -= dt; g.mv = [0, 0]; return; }
    if (d.i === undefined) { d.i = 0; d.pause = 0; }
    if (d.pause > 0) { d.pause -= dt; g.mv = [0, 0]; if (d.pause < 1 && g.lookAround) g.faceT = g.face + Math.sin(d.pause * 5) * 0.03; return; }
    const p = g.path[d.i];
    const dx = p[0] - g.x, dz = p[1] - g.z, dd = Math.hypot(dx, dz);
    if (dd < 0.3) { d.i = (d.i + 1) % g.path.length; d.pause = p[2] || 1.2; if (p[3] !== undefined) g.faceT = p[3]; g.mv = [0, 0]; return; }
    g.mv = [dx / dd * 0.55, dz / dd * 0.55];
  };
  // hiding spots: Stage.cur.hides = [{x, z, r}] — standing still inside one = invisible
  M.hidden = function (h) {
    for (const s of Stage.cur.hides || []) if (Math.hypot(h.x - s.x, h.z - s.z) < s.r && Math.hypot(h.mv[0], h.mv[1]) < 0.2) return true;
    // the tag-along idiot counts as hidden when he's huddled right next to a hidden leader
    const L = Game.leaderActor();
    if (L && h !== L && L.distTo(h) < 2.6 && M.hidden(L)) return true;
    return false;
  };

  // ==================================================================== shared: endless track
  function trackGround(o) {
    const g = new THREE.Group();
    Mk.plane(g, o.groundW || 400, 600, o.ground || 'sand', 0, -0.08, 0, { tile: 4 });
    if (o.road) {
      const t = Tex.make('road4', 64, 32, (c) => {
        Tex.noise(c, 64, 32, '#3a393e', 0.3, 31);
        c.fillStyle = '#e8c33a'; c.fillRect(31, 0, 1, 32); c.fillRect(33, 0, 1, 32);
        c.fillStyle = '#e8e8e8'; c.fillRect(16, 0, 1, 16); c.fillRect(48, 0, 1, 16); c.fillRect(1, 0, 1, 32); c.fillRect(62, 0, 1, 32);
        c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(20, 8, 6, 3); c.fillRect(40, 22, 4, 2);
      });
      const m = Mk.plane(g, o.roadW || 13, 600, Mat.get(t), 0, 0.02, 0, { tile: 13 });
      // re-tile: one texture across, repeat every 6 m along
      const uv = m.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) > 0.5 ? 1 : 0, uv.getY(i) > 0.5 ? 100 : 0);
    }
    if (o.floor) Mk.plane(g, o.floorW || 8, 600, o.floor, 0, 0.02, 0, { tile: o.floorTile || 2 });
    return g;
  }

  // ==================================================================== DRIVE
  // cfg = { length (m), vehicle: 'van'|'semi', theme: 'suburb'|'interstate'|'desert'|'night',
  //         traffic (0..1), chaser: null|'goons'|'cops', cops, hp, timeLimit, events: [{at, fn}],
  //         billboards: [...text], pickups, destination, driver: 'slothhead'|'sleavis' }
  M.defs.drive = {
    enter(cfg) {
      const root = Stage.cur.root;
      this.z = 0; this.x = 2.6; this.speed = 12; this.max = cfg.max || 34; this.steerV = 0; this.hp = cfg.hp || 6; this.maxhp = this.hp;
      this.cars = []; this.decor = []; this.obs = []; this.nextChunk = 0; this.inv = 0; this.events = (cfg.events || []).slice().sort((a, b) => a.at - b.at);
      this.ground = trackGround({ road: true, ground: cfg.ground || (cfg.theme === 'suburb' ? 'grass' : cfg.theme === 'interstate' ? 'deadgrass' : 'sand') });
      root.add(this.ground);
      this.veh = cfg.vehicle === 'semi' ? Props.semi(root, 0, 0, Math.PI, { bobtail: true }) : Props.van(root, 0, 0, Math.PI, { roof: !Game.flags.convertible, graffiti: Game.flags.graffiti });
      this.veh.rotation.y = Math.PI;
      // the idiots ride inside, crisp as ever
      const drv = cfg.driver || 'slothhead';
      this.seats = cfg.vehicle === 'semi' ? [[0.55, 0.95, 4.1], [-0.55, 0.95, 4.1]] : [[0.5, 0.62, 0.45], [-0.5, 0.62, 0.45]];
      for (const h of Game.heroActors()) { h.vis.show(true); h.gone = true; }
      this.driver = Game.hero(drv); this.passenger = Game.hero(drv === 'sleavis' ? 'slothhead' : 'sleavis');
      this.chaser = null; this.chaserGap = 30;
      if (cfg.chaser) { this.chaser = cfg.chaser === 'cops' ? Props.copcar(root, 0, 0, Math.PI) : Props.pickup(root, 0, 0, Math.PI, { color: '#5a7a3a' }); this.chaserX = 2; this.chaserHits = 0; }
      this.dist = 0; this.zapCD = 0; this.honkT = 0; this.ticker = null; this.tickT = 0; this.crashes = 0;
      this.timeLeft = cfg.timeLimit || 0;
      Stage.cam.mode = 'drive';
      this.camPos = new THREE.Vector3(2.6, 3.6, 8); this.camLook = new THREE.Vector3(2.6, 1.2, -8);
      this.radio(cfg.radio ? cfg.radio[0] : null);
      for (let i = 0; i < 6; i++) this.chunk();
    },
    exit() {
      for (const h of Game.heroActors()) { h.gone = false; h.vis.model.rotation.set(0, 0, 0); }
      Stage.cur.root.remove(this.ground); Stage.cur.root.remove(this.veh);
      for (const c of this.cars) Stage.cur.root.remove(c.m);
      for (const d of this.decor) Stage.cur.root.remove(d);
      for (const o of this.obs) Stage.cur.root.remove(o.m);
      if (this.chaser) Stage.cur.root.remove(this.chaser);
    },
    radio(text) { if (text) { this.ticker = text; this.tickT = 0; } },
    chunk() { Props.col = false; try { this.chunk2(); } finally { Props.col = true; } },
    chunk2() {
      const cfg = this.cfg, z0 = this.nextChunk, root = Stage.cur.root, th = cfg.theme || 'desert';
      this.nextChunk -= 30;
      for (const side of [-1, 1]) {
        const x = side * LP.rand(9, 16), z = z0 - LP.rand(0, 30);
        let m;
        const r = Math.random();
        if (th === 'suburb') m = r < 0.4 ? Props.house(root, side * LP.rand(14, 18), z, side > 0 ? -Math.PI / 2 : Math.PI / 2, { color: LP.pick(['#c8b890', '#a8b8c8', '#d8c0c8', '#b8c8a0']) }) : r < 0.7 ? Props.tree(root, x, z) : Props.pole(root, side * 7.6, z);
        else if (th === 'interstate') m = r < 0.35 ? Props.tree(root, x, z, { dead: true }) : r < 0.55 ? Props.pole(root, side * 7.6, z) : r < 0.7 ? Props.farm(root, side * LP.rand(20, 30), z) : Props.cactus(root, x, z);
        else m = r < 0.55 ? Props.cactus(root, x, z) : r < 0.75 ? Props.mesa(root, side * LP.rand(30, 60), z - 40) : Props.pole(root, side * 7.6, z);
        if (m) this.decor.push(m);
      }
      // mailboxes / cones on the shoulder (smashable, worth money)
      if (Math.random() < 0.7) { const side = LP.pick([-1, 1]); const mb = Props.mailbox(root, side * 7.4, z0 - LP.rand(0, 30)); this.obs.push({ m: mb, x: mb.position.x, z: mb.position.z, w: 0.5, kind: 'mailbox', value: 150 }); }
      if (cfg.billboards && Math.random() < 0.45) {
        const side = LP.pick([-1, 1]);
        const b = Props.billboard(root, side * 12, z0 - 15, LP.pick(cfg.billboards), side > 0 ? -0.35 : 0.35);
        this.decor.push(b);
      }
      // road obstacles + pickups
      const n = LP.randi(0, 2);
      for (let i = 0; i < n; i++) {
        const lane = LP.pick([-4.5, -1.5, 1.5, 4.5]), z = z0 - LP.rand(0, 30);
        const k = Math.random();
        if (k < 0.35 && cfg.pickups !== false) { const g = Props.can(root, lane, z); this.obs.push({ m: g, x: lane, z, w: 0.6, kind: 'beer' }); }
        else if (k < 0.55) { const g = Props.cone(root, lane, z); this.obs.push({ m: g, x: lane, z, w: 0.6, kind: 'cone', value: 40 }); }
        else if (k < 0.7 && th !== 'suburb') { const g = Props.armadillo(root, lane, z); this.obs.push({ m: g, x: lane, z, w: 0.7, kind: 'dillo', value: 0 }); }
        else if (k < 0.8 && th === 'desert') { const g = Props.tumbleweed(root, lane, z); this.obs.push({ m: g, x: lane, z, w: 0.8, kind: 'tumble', vx: LP.rand(1, 3) * LP.pick([-1, 1]) }); }
      }
      // traffic
      const dens = cfg.traffic === undefined ? 0.5 : cfg.traffic;
      if (Math.random() < dens) this.spawnCar(z0 - 15, Math.random() < 0.45);
      if (Math.random() < dens * 0.5) this.spawnCar(z0 - 5, Math.random() < 0.5);
    },
    spawnCar(z, oncoming) {
      const lane = oncoming ? LP.pick([-1.5, -4.5]) : LP.pick([1.5, 4.5]);
      const kind = Math.random();
      const root = Stage.cur.root;
      const m = kind < 0.12 ? Props.semi(root, lane, z, oncoming ? 0 : Math.PI) : kind < 0.3 ? Props.pickup(root, lane, z, oncoming ? 0 : Math.PI) : kind < 0.38 && this.cfg.theme !== 'suburb' ? Props.rv(root, lane, z, oncoming ? 0 : Math.PI) : Props.car(root, lane, z, oncoming ? 0 : Math.PI);
      const len = kind < 0.12 ? 11 : kind < 0.38 ? 6.5 : 4.4;
      this.cars.push({ m, x: lane, z, v: oncoming ? -LP.rand(14, 22) : LP.rand(9, 17), len, w: kind < 0.12 ? 2.6 : 2, oncoming, hit: false, spin: 0, vy: 0, y: 0, vx: 0 });
    },
    update(dt, blocked) {
      const cfg = this.cfg;
      if (this.result) return;
      // input
      const st = blocked ? 0 : Ctl.steer();
      let gas = blocked ? 0.5 : Ctl.gas(), br = blocked ? 0 : Ctl.brake();
      if (!blocked && cfg.autoGas !== false && gas < 0.05 && br < 0.05) gas = 0.55;
      this.speed += (gas * 16 - br * 26 - 2) * dt;
      const offroad = Math.abs(this.x) > 6.4;
      const max = this.max * (offroad ? 0.55 : 1);
      if (this.speed > max) this.speed = LP.approach(this.speed, max, dt * 20);
      this.speed = LP.clamp(this.speed, 0, this.max + 5);
      this.steerV = LP.lerp(this.steerV, st * (5 + this.speed * 0.12), Math.min(1, dt * 6));
      this.x = LP.clamp(this.x + this.steerV * dt, -8.5, 8.5);
      this.z -= this.speed * dt;
      this.dist += this.speed * dt;
      if (this.inv > 0) this.inv -= dt;
      if (offroad && this.speed > 8 && Math.random() < dt * 8) FX3.burst(new THREE.Vector3(this.x, 0.2, this.z + 2), 2, { colors: ['#c8a070', '#a08050'], size: 0.1, up: 2 });
      // vehicle pose
      const v = this.veh;
      v.position.set(this.x, offroad ? Math.abs(Math.sin(this.dist)) * 0.08 : 0, this.z);
      v.rotation.y = Math.PI - this.steerV * 0.04;
      v.rotation.z = -this.steerV * 0.01;
      // heroes in their seats
      const seat = (h, i) => {
        const s = this.seats[i];
        const c = Math.cos(v.rotation.y), sn = Math.sin(v.rotation.y);
        h.vis.root.position.set(v.position.x + s[0] * c + s[2] * sn, v.position.y + s[1], v.position.z - s[0] * sn + s[2] * c);
        h.vis.root.rotation.y = v.rotation.y;
      };
      seat(this.driver, 0); seat(this.passenger, 1);
      this.driver.vis.setAnim('drive', { steer: -this.steerV / 6 });
      this.passenger.vis.setAnim(this.passengerAnim || (this.speed > 25 ? 'headbang' : 'sit'), { speed: 1.2 });
      for (const h of Game.heroActors()) { h.vis.blob.visible = false; h.vis.update(dt); }
      // world streaming
      while (this.nextChunk > this.z - 190) this.chunk();
      this.ground.position.z = Math.round(this.z / 6) * 6;
      const behind = this.z + 25;
      LP.prune(this.decor, (d) => { if (d.position.z > behind) { Stage.cur.root.remove(d); return true; } return false; });
      // obstacles
      const V = { x: this.x, z: this.z, w: 2.2, l: 4.6 };
      LP.prune(this.obs, (o) => {
        if (o.vx) { o.x += o.vx * dt; o.m.position.x = o.x; o.m.rotation.z += o.vx * dt; if (Math.abs(o.x) > 10) o.vx *= -1; }
        if (o.z > behind) { Stage.cur.root.remove(o.m); return true; }
        if (Math.abs(o.x - V.x) < (o.w + V.w) / 2 && Math.abs(o.z - V.z) < V.l / 2) {
          Stage.cur.root.remove(o.m);
          const at = new THREE.Vector3(o.x, 1, o.z);
          if (o.kind === 'beer') { Game.stats.beers++; Game.freakAdd(10); HUD.popup(at, 'BEER!', '#ffe040'); GameAudio.sfx('slurp'); if (LP.chance(0.3)) HUD.bark('sleavis', LP.pick(['Heh heh. Road beer.', 'Free beer! It was in the ROAD! Heh heh.', 'Pull over, I gotta drink this.'])); }
          else if (o.kind === 'dillo') { FX3.burst(at, 8, { colors: ['#8a8a7a', '#c03030'], size: 0.12 }); GameAudio.sfx('splat'); HUD.popup(at, 'ARMADILLO!', '#ff8080'); if (LP.chance(0.5)) HUD.bark('sleavis', LP.pick(['Whoa! Did you see that? It went POP! Heh heh.', 'Heh heh. Roadkill. Lunch.', 'That one was already dead, Slutt-Head. Heh heh. Now it\'s MORE dead.'])); }
          else if (o.kind === 'tumble') { FX3.burst(at, 10, { colors: ['#a08050', '#806040'], size: 0.1 }); GameAudio.sfx('thud'); }
          else { FX3.burst(at, 8, { colors: o.kind === 'cone' ? ['#ff7020', '#ffffff'] : ['#8a8a8a', '#3050a0'], size: 0.12, speed: 6 }); GameAudio.sfx('smash'); if (o.value) Game.damage(o.value, at); }
          return true;
        }
        return false;
      });
      // traffic
      LP.prune(this.cars, (c) => {
        if (c.hit) { c.vy -= 20 * dt; c.y = Math.max(0, c.y + c.vy * dt); c.x += c.vx * dt; c.spin += dt * 6; c.m.rotation.y += dt * 6; c.m.rotation.z = Math.min(1.2, c.spin * 0.3); }
        c.z -= c.v * dt;
        c.m.position.set(c.x, c.y, c.z);
        if (c.z > behind + 10 || c.z < this.z - 260) { Stage.cur.root.remove(c.m); return true; }
        if (!c.hit && Math.abs(c.x - V.x) < (c.w + V.w) / 2 && Math.abs(c.z - V.z) < (c.len + V.l) / 2) this.crash(c);
        // honk = they swerve
        if (this.honkT > 0 && !c.hit && !c.oncoming && c.z < this.z && c.z > this.z - 30 && Math.abs(c.x - this.x) < 2) c.x += (c.x > 3 ? 1 : -1) * dt * 2.5;
        return false;
      });
      // honk
      if (this.honkT > 0) this.honkT -= dt;
      if (!blocked && LP.Input.pressed('punch')) { this.honkT = 0.6; GameAudio.sfx('horn'); if (LP.chance(0.4)) HUD.bark(this.passenger.id, this.passenger.id === 'sleavis' ? LP.pick(['Heh heh. HONK. Heh heh.', 'MOVE IT, DILLHOLE!']) : LP.pick(['Uh huh huh. Honk.', 'Get outta the way, buttmunch.'])); }
      // remote: zap the nearest car ahead
      if (this.zapCD > 0) this.zapCD -= dt;
      if (!blocked && LP.Input.pressed('special') && Game.flags.remote) {
        if (this.zapCD > 0) HUD.toast('REMOTE WARMING UP', '#ff8080');
        else {
          let best = null; for (const c of this.cars) if (!c.hit && c.z < this.z - 8 && c.z > this.z - 70 && (!best || c.z > best.z)) best = c;
          this.zapCD = 5;
          Game.stats.lasers++;
          const tx = best ? best.x : this.x + LP.rand(-3, 3), tz = best ? best.z - best.v * 1.1 : this.z - 40;
          GameAudio.sfx('click');
          HUD.bark('slothhead', LP.pick(['Channel up. Uh huh huh.', 'Let\'s see what this one does.', 'Changing lanes. Uh huh huh.']));
          FX3.laser(tx, tz, (lx, lz) => { for (const c of this.cars) if (!c.hit && Math.hypot(c.x - lx, c.z - lz) < 5) { c.hit = true; c.vy = 9; c.vx = LP.rand(-4, 4); c.v *= 0.3; Game.damage(LP.randi(9000, 25000), new THREE.Vector3(c.x, 2, c.z)); } }, { delay: 0.6 });
        }
      }
      // chaser
      if (this.chaser) this.updateChaser(dt);
      // events / radio
      while (this.events.length && this.dist >= this.events[0].at) { const e = this.events.shift(); if (e.radio) this.radio(e.radio); if (e.bark) HUD.bark(e.bark[0], e.bark[1]); if (e.fn) e.fn(this); }
      if (this.ticker) this.tickT += dt;
      if (this.timeLeft > 0 && !blocked) { this.timeLeft -= dt; if (this.timeLeft <= 0) { this.result = { fail: true, msg: cfg.timeoutMsg || 'Too slow. You drive like a sloth. Which is fair.' }; return; } }
      if (this.hp <= 0) { this.result = { fail: true, msg: cfg.wreckMsg || LP.pick(DEATH.wreck) }; return; }
      if (this.dist >= cfg.length) this.result = 'win';
    },
    crash(c) {
      c.hit = true; c.vy = 7; c.vx = (c.x - this.x) * 3 || LP.rand(-4, 4); c.v *= 0.2;
      const at = new THREE.Vector3(c.x, 1.2, c.z);
      FX3.burst(at, 14, { colors: ['#c0c0c0', '#303030', '#ff4020'], speed: 7, size: 0.15 });
      Game.damage(LP.randi(1800, 6500), at);
      Game.shake(0.3, 0.4);
      GameAudio.sfx('crash');
      if (this.inv <= 0) { this.hp--; this.inv = 1.2; this.crashes++; this.speed *= 0.45; this.steerV *= -0.5; }
      HUD.bark(this.passenger.id, this.passenger.id === 'sleavis' ? LP.pick(['WHOA! Heh heh! DO IT AGAIN!', 'Nice driving, SLUTT-HEAD!', 'Heh heh. They were in OUR lane. Kind of.']) : LP.pick(['Uh huh huh. Cool.', 'Watch the road, dumbass!', 'Uhh... that was his fault.']));
    },
    updateChaser(dt) {
      const c = this.chaser, cfg = this.cfg;
      // the gap closes when you're slow, opens when you're fast
      const want = cfg.chaserSpeed || 28;
      this.chaserGap += (this.speed - want) * dt * 0.9;
      this.chaserGap = LP.clamp(this.chaserGap, 2.2, 60);
      this.chaserX = LP.lerp(this.chaserX, this.x, dt * 1.2);
      c.position.set(this.chaserX, 0, this.z + 4.6 + this.chaserGap);
      c.rotation.y = Math.PI + (this.x - this.chaserX) * 0.05;
      if (cfg.chaser === 'cops' && c.userData.lights) { const on = Math.floor(this.dist * 0.5) % 2; c.userData.lights[0].material.color.set(on ? '#ff2020' : '#401010'); c.userData.lights[1].material.color.set(on ? '#202060' : '#3040ff'); }
      if (this.chaserGap <= 2.3 && this.inv <= 0) {
        this.hp--; this.inv = 1.5; this.speed += 6; this.chaserGap = 9; GameAudio.sfx('crash'); Game.shake(0.3, 0.4);
        HUD.bark(this.passenger.id, LP.pick(cfg.chaser === 'cops' ? ['Heh heh. The cops wanna race!', 'Uhh, they\'re ramming us. That\'s like, illegal.'] : ['It\'s those guys! Heh heh. They want their remote back!', 'Uhh, I think they\'re mad.']));
      }
      if (cfg.escapeGap && this.chaserGap >= cfg.escapeGap) { this.result = 'win'; }
    },
    camera(dt) {
      const cam = R3.camera;
      const far = this.cfg.vehicle === 'semi' ? 1.25 : 1;
      const tp = new THREE.Vector3(this.x * 0.8 + 0.6, (2.7 + this.speed * 0.015) * far, this.z + (5.4 + this.speed * 0.04) * far + (this.cfg.vehicle === 'semi' ? -2.5 : 0));
      const tl = new THREE.Vector3(this.x * 0.9, 1.25, this.z - 9);
      const k = 1 - Math.exp(-6 * dt);
      this.camPos.lerp(tp, k); this.camLook.lerp(tl, k);
      cam.fov = 60 + this.speed * 0.25;
      cam.position.copy(this.camPos); cam.lookAt(this.camLook);
      if (Stage.cam.fixed) Stage.updateCamera(dt);
    },
    draw() {
      HUD.draw({ noHeroes: true, noGame: false });
      const g = G.g;
      // van health
      Font.draw(g, this.cfg.vehicle === 'semi' ? 'EARL\'S TRUCK' : 'THE VAN', 6, 8, '#ffe040', { face: 'small', outline: '#000' });
      HUD.bar(6, 17, 90, 6, this.hp / this.maxhp, this.hp <= 2 ? '#ff3030' : '#50e050');
      // speedo
      const mph = Math.round(this.speed * 2.237);
      Font.draw(g, mph + ' MPH', 6, G.H - 20, mph > 70 ? '#ff6060' : '#ffffff', { outline: '#000', scale: 2 });
      // progress
      const f = Math.min(1, this.dist / this.cfg.length);
      const lbl = this.cfg.destination || 'DESTINATION';
      Font.draw(g, lbl, G.W - 6, G.H - 30, '#ffe040', { face: 'small', align: 'right', outline: '#000' });
      HUD.bar(G.W - 136, G.H - 20, 130, 6, f, '#40c0ff');
      if (this.chaser) { Font.draw(g, 'GAP ' + Math.round(this.chaserGap) + 'M', G.W / 2, G.H - 20, this.chaserGap < 8 ? '#ff4040' : '#ffffff', { face: 'small', align: 'center', outline: '#000' }); }
      if (this.timeLeft > 0) Font.draw(g, 'TIME ' + Math.ceil(this.timeLeft), G.W / 2, 40, this.timeLeft < 10 ? '#ff4040' : '#fff', { align: 'center', outline: '#000' });
      // radio ticker
      if (this.ticker && this.tickT < 9) {
        const s = '~ ' + this.ticker + ' ~';
        const w = Font.width(s, 'small');
        const x = G.W - ((this.tickT * 60) % (G.W + w));
        G.rect(0, 50, G.W, 10, 'rgba(0,0,0,0.6)');
        Font.draw(g, s, x, 52, '#60e0ff', { face: 'small' });
      }
      Font.draw(g, HUD.btn('punch') + ': HONK' + (Game.flags.remote ? '   ' + HUD.btn('special') + ': REMOTE' : ''), G.W / 2, G.H - 8, '#a0a0b0', { face: 'small', align: 'center', outline: '#000' });
    }
  };

  // ==================================================================== RUNNER
  // cfg = { length, speed, theme: 'base'|'mall'|'fest'|'casino', pursuers: [look...], stumbles: 3,
  //         obstacles: [...kinds], destination, events }
  M.defs.runner = {
    enter(cfg) {
      const root = Stage.cur.root;
      this.z = 0; this.lane = 0; this.x = 0; this.speed = cfg.speed || 8.5; this.dist = 0; this.stumbles = 0; this.slowT = 0; this.inv = 0;
      this.y = 0; this.vy = 0; this.slide = 0; this.obs = []; this.decor = []; this.nextChunk = -20; this.events = (cfg.events || []).slice();
      const th = cfg.theme || 'base';
      const ground = { base: 'asphalt', mall: 'checker', fest: 'mud', casino: 'redcarpet', dam: 'concrete' }[th] || 'asphalt';
      this.ground = trackGround({ ground: th === 'fest' ? 'grass' : th === 'mall' ? 'linoleum' : th === 'dam' ? 'concrete' : 'sand', floor: ground, floorW: 8 });
      root.add(this.ground);
      for (const h of Game.heroActors()) { h.vis.show(true); h.gone = true; h.vis.blob.visible = true; }
      this.L = Game.leaderActor(); this.P = Game.partnerActor();
      this.pursuers = (cfg.pursuers || ['cop', 'cop']).map((look, i) => { const v = Npc.make(look); root.add(v.root); return { v, x: (i - (cfg.pursuers.length - 1) / 2) * 1.5, gapOff: LP.rand(0, 1.5) }; });
      this.gap = 6;
      this.camPos = new THREE.Vector3(0, 4, 8); this.camLook = new THREE.Vector3(0, 1, -6);
      for (let i = 0; i < 5; i++) this.chunk();
    },
    exit() {
      for (const h of Game.heroActors()) { h.gone = false; }
      const root = Stage.cur.root;
      root.remove(this.ground);
      for (const o of this.obs) root.remove(o.m);
      for (const d of this.decor) root.remove(d);
      for (const p of this.pursuers) root.remove(p.v.root);
    },
    chunk() { Props.col = false; try { this.chunk2(); } finally { Props.col = true; } },
    chunk2() {
      const cfg = this.cfg, z0 = this.nextChunk, root = Stage.cur.root, th = cfg.theme || 'base';
      this.nextChunk -= 24;
      // side scenery
      for (const side of [-1, 1]) for (let i = 0; i < 2; i++) {
        const z = z0 - i * 12 - LP.rand(0, 6);
        this.decor.push(Props.runnerSide(root, th, side * LP.rand(5.5, 7.5), z, side));
      }
      // obstacles: one row every ~12 m, leaving at least one lane open
      for (let r = 0; r < 2; r++) {
        if (this.dist < 10 && r === 0) continue;
        const z = z0 - 6 - r * 12;
        const lanes = [-2, 0, 2].sort(() => Math.random() - 0.5);
        const n = LP.randi(1, 2);
        for (let i = 0; i < n; i++) {
          const kind = LP.pick(cfg.obstacles || ['low', 'wall', 'high']);
          const m = Props.runnerObstacle(root, th, kind, lanes[i], z);
          this.obs.push({ m, x: lanes[i], z, kind });
        }
        if (Math.random() < 0.6) { const l = lanes[2]; const m = Props.can(root, l, z - 5); this.obs.push({ m, x: l, z: z - 5, kind: 'beer' }); }
      }
    },
    update(dt, blocked) {
      if (this.result) return;
      const I = LP.Input;
      if (!blocked) {
        if (I.pressed('left') || (Ctl.lx < -0.6 && !this.stickHeld)) { this.lane = Math.max(-2, this.lane - 2); this.stickHeld = true; GameAudio.sfx('whoosh'); }
        if (I.pressed('right') || (Ctl.lx > 0.6 && !this.stickHeld)) { this.lane = Math.min(2, this.lane + 2); this.stickHeld = true; GameAudio.sfx('whoosh'); }
        if (Math.abs(Ctl.lx) < 0.3) this.stickHeld = false;
        if ((I.pressed('jump') || I.pressed('up')) && this.y <= 0.001 && this.slide <= 0) { this.vy = 7.5; GameAudio.sfx('jump'); }
        if ((I.pressed('down') || I.pressed('punch')) && this.y <= 0.001) { this.slide = 0.7; GameAudio.sfx('slide'); }
      }
      const sp = this.speed * (this.slowT > 0 ? 0.55 : 1) * (blocked ? 0.6 : 1);
      if (this.slowT > 0) this.slowT -= dt;
      if (this.inv > 0) this.inv -= dt;
      if (this.slide > 0) this.slide -= dt;
      this.z -= sp * dt; this.dist += sp * dt;
      this.x = LP.approach(this.x, this.lane, dt * 9);
      this.vy -= 22 * dt; this.y = Math.max(0, this.y + this.vy * dt); if (this.y === 0) this.vy = Math.max(0, this.vy);
      // heroes
      const L = this.L, P = this.P;
      L.vis.root.position.set(this.x, this.y, this.z); L.vis.root.rotation.y = Math.PI;
      L.vis.setAnim(this.slide > 0 ? 'crouch' : this.y > 0.05 ? 'jump' : this.slowT > 0 ? 'hit' : 'run', { speed: 1.2 });
      const px = this.x === 0 ? 1.1 : -Math.sign(this.x) * 1.1;
      P.vis.root.position.set(this.x + px, Math.max(0, Math.sin(this.dist * 0.4) * 0) + (this.pJump || 0), this.z + 1.6);
      P.vis.root.rotation.y = Math.PI;
      P.vis.setAnim('run', { speed: 1.2 });
      for (const h of [L, P]) { h.vis.groundY = 0; h.vis.update(dt); }
      // pursuers: the gap closes on stumbles, slowly re-opens otherwise
      this.gap = LP.clamp(this.gap + (this.slowT > 0 ? -2.2 : 0.25) * dt, 1.4, 6.5);
      for (const p of this.pursuers) {
        p.v.root.position.set(p.x * 0.8 + this.x * 0.4, 0, this.z + 1.6 + this.gap + p.gapOff);
        p.v.root.rotation.y = Math.PI;
        p.v.setAnim('run', { speed: 1.3 }); p.v.update(dt);
      }
      // streaming
      while (this.nextChunk > this.z - 110) this.chunk();
      this.ground.position.z = Math.round(this.z / 4) * 4;
      const behind = this.z + 18;
      LP.prune(this.decor, (d) => { if (d.position.z > behind) { Stage.cur.root.remove(d); return true; } return false; });
      LP.prune(this.obs, (o) => {
        if (o.z > behind) { Stage.cur.root.remove(o.m); return true; }
        if (o.done || Math.abs(o.z - this.z) > 0.6 || Math.abs(o.x - this.x) > 0.9) return false;
        if (o.kind === 'beer') { Stage.cur.root.remove(o.m); Game.stats.beers++; HUD.popup(new THREE.Vector3(o.x, 1.5, o.z), 'BEER!', '#ffe040'); GameAudio.sfx('slurp'); return true; }
        const ok = (o.kind === 'low' && this.y > 0.55) || (o.kind === 'high' && this.slide > 0);
        if (ok) { o.done = true; return false; }
        o.done = true;
        if (this.inv > 0) return false;
        this.stumbles++; this.slowT = 0.9; this.inv = 1.2;
        Game.shake(0.2, 0.3); GameAudio.sfx('bigpunch');
        FX3.burst(new THREE.Vector3(o.x, 0.8, o.z), 10, { colors: ['#c0c0c0', '#ffe040', '#a03030'], speed: 5 });
        if (o.m.userData.value) Game.damage(o.m.userData.value, new THREE.Vector3(o.x, 1, o.z));
        HUD.bark(L.id, L.id === 'sleavis' ? LP.pick(['OW! My everything!', 'Heh heh... ow.', 'Who put that THERE?!']) : LP.pick(['Uhh... OW.', 'That was like, totally on purpose.', 'Dammit!']));
        if (this.stumbles >= (this.cfg.stumbles || 3)) this.result = { fail: true, msg: this.cfg.caughtMsg || LP.pick(DEATH.caught) };
        return false;
      });
      while (this.events.length && this.dist >= this.events[0].at) { const e = this.events.shift(); if (e.bark) HUD.bark(e.bark[0], e.bark[1]); if (e.fn) e.fn(this); }
      if (this.dist >= this.cfg.length) this.result = 'win';
    },
    camera(dt) {
      const tp = new THREE.Vector3(this.x * 0.5, 4.6, this.z + 10.5), tl = new THREE.Vector3(this.x * 0.6, 1.0, this.z - 5);
      if (this.cfg.facing) { tp.set(this.x * 0.5, 2.4, this.z - 5.5); tl.set(this.x * 0.3, 1.2, this.z + 3); }
      const k = 1 - Math.exp(-8 * dt);
      this.camPos.lerp(tp, k); this.camLook.lerp(tl, k);
      R3.camera.fov = 62; R3.camera.position.copy(this.camPos); R3.camera.lookAt(this.camLook);
    },
    draw() {
      HUD.draw({ noHeroes: true });
      const g = G.g;
      const f = Math.min(1, this.dist / this.cfg.length);
      Font.draw(g, this.cfg.destination || 'ESCAPE', G.W - 6, G.H - 30, '#ffe040', { face: 'small', align: 'right', outline: '#000' });
      HUD.bar(G.W - 136, G.H - 20, 130, 6, f, '#40c0ff');
      Font.draw(g, 'STUMBLES', 6, G.H - 30, '#ff8080', { face: 'small', outline: '#000' });
      for (let i = 0; i < (this.cfg.stumbles || 3); i++) G.rect(6 + i * 12, G.H - 20, 9, 9, i < this.stumbles ? '#ff3030' : '#3a2020');
      Font.draw(g, HUD.btn('left') + '/' + HUD.btn('right') + ': LANE   ' + HUD.btn('jump') + ': JUMP   ' + HUD.btn('down') + ': SLIDE', G.W / 2, G.H - 8, '#a0a0b0', { face: 'small', align: 'center', outline: '#000' });
    }
  };
  return M;
})();

// Death / fail messages. Mean, on purpose.
const DEATH = {
  ko: ['Both idiots are unconscious. Somewhere, a doctor is about to be very confused.', 'K.O. You got beat up by people who peaked in 1983.', 'You lost. On the plus side, the floor was comfy.', 'Your dignity has left the building. It was never really in it.'],
  busted: ['BUSTED. Sneaking requires you to stop narrating your own farts.', 'Spotted. Two grown men in sloth suits are, it turns out, conspicuous.', 'Caught! The guard said, quote, "What the hell are you supposed to be?"'],
  wreck: ['The van exploded. It was mostly held together by stickers anyway.', 'WRECKED. Your insurance company just laughed out loud.', 'Totaled. On the bright side, the radio still works.'],
  caught: ['CAUGHT. You were outrun by people who get winded opening ketchup.', 'Tackled. Your face has met the floor. They are now acquainted.', 'Grabbed by the tail. The SLOTH tail. Dignity: zero.']
};
