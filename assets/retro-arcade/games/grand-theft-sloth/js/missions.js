/* MISSIONS — the story of Two-Toes, in twelve jobs.
   ACT I   MAMA MOSS (Pawn Row)       1 Hot Wheels, Cold Feet   2 Repo Rodeo        3 Special Delivery
   ACT II  DJ HAMMOCK (Neon Mile)     4 Bouncer Duty            5 Limo-nade          6 Tour Bus Terror
   ACT III LT. CRULLER (Precinct 27)  7 Dirty Laundry           8 Terry's Last Nap   9 The Donut Hole
   ACT IV  BARON VELVET               10 Mom-napped             11 Sugar Rush        12 Slow Down
   Walk into the ringing payphone to get a briefing. One job at a time; progress saves
   after every pass. Each mission: start(M), update(M, dt), and optional hooks. */
'use strict';
const Missions = (function () {
  const T = 16;
  const MS = { done: 0, active: null, idx: -1, M: null, obj: null, timer: null, health: null, healthLabel: '', snap: null, ringT: 0, cool: 0, list: [] };
  const Z = (n) => City.zones[n];
  const tile = (tx, ty) => ({ x: tx * T, y: ty * T });

  // ------------------------------------------------------------------ helpers
  function walkSpots(cx, cy, n, r0, r1, rect) {
    const out = [];
    for (let i = 0; i < n * 40 && out.length < n; i++) {
      let x, y;
      if (rect) { x = LP.rand(rect[0], rect[2]) * T; y = LP.rand(rect[1], rect[3]) * T; }
      else { const a = Math.random() * Math.PI * 2, r = LP.rand(r0, r1); x = cx + Math.cos(a) * r; y = cy + Math.sin(a) * r; }
      const t = City.tileAtPx(x, y);
      if (t === City.TL.BLD || t === City.TL.WATER) continue;
      if (City.solidPed(Math.floor((x + 4) / T), Math.floor(y / T)) || City.solidPed(Math.floor((x - 4) / T), Math.floor(y / T))) continue;
      if (out.some((o) => dist(o.x, o.y, x, y) < 12)) continue;
      out.push({ x, y });
    }
    while (out.length < n) out.push({ x: cx + LP.rand(-8, 8), y: cy + LP.rand(-8, 8) });
    return out;
  }
  function clearAt(x, y, r) {
    for (const c of World.cars) if (!c.mission && c !== Player.ped.inCar && dist(c.x, c.y, x, y) < r) c.gone = true;
  }
  function spotIn(d, k) {
    const l = City.parkSpots.filter((s) => !s.police && City.districtAt(Math.floor(s.x / T), Math.floor(s.y / T)) === d && dist(s.x, s.y, Z('mama').x, Z('mama').y) > 200);
    return l.length ? l[Math.min(l.length - 1, k)] : City.parkSpots[k * 7 % City.parkSpots.length];
  }
  // chain road routes between waypoints, then shift every point into the right-hand lane
  function routePts(wps, off) {
    let nodes = [];
    for (let i = 0; i + 1 < wps.length; i++) {
      const r = City.route(City.nearestNode(wps[i].x, wps[i].y), City.nearestNode(wps[i + 1].x, wps[i + 1].y)) || [];
      for (const n of r) if (!nodes.length || nodes[nodes.length - 1] !== n) nodes.push(n);
    }
    const pts = nodes.map((n) => ({ x: n.x, y: n.y }));
    off = off || 8;
    return pts.map((p, i) => {
      const a = pts[i - 1], b = pts[i + 1];
      const din = a ? norm(p.x - a.x, p.y - a.y) : null, dout = b ? norm(b.x - p.x, b.y - p.y) : null;
      let rx = 0, ry = 0;
      if (din) { rx += -din[1]; ry += din[0]; }
      if (dout && !(din && din[0] === dout[0] && din[1] === dout[1])) { rx += -dout[1]; ry += dout[0]; }
      if (!din && dout) { rx = -dout[1]; ry = dout[0]; }
      return { x: p.x + rx * off, y: p.y + ry * off };
    });
  }
  const norm = (x, y) => { const m = Math.hypot(x, y) || 1; return [Math.round(x / m), Math.round(y / m)]; };
  function goon(M, f, x, y, weapon, o) {
    return M.ped('gang', f, x, y, Object.assign({ faction: f, hostile: true, weapon: weapon || 'pistol', state: 'chase', accuracy: 0.17, range: 180, hp: 40 }, o));
  }
  // a car full of goons that chases and unloads next to you
  function goonCar(M, f, x, y, a, o) {
    o = o || {};
    const c = M.car(o.type || (f === 'green' ? 'muscle' : 'sedan'), x, y, a, { col: f === 'green' ? '#2a8a2a' : '#5a1a8a', faction: f });
    c.driver = World.makeDriver('gang', f, { faction: f, hostile: true, weapon: 'smg' });
    c.ai = { mode: 'chase', target: o.target || null, gun: o.gun || 'smg', speedMul: o.speedMul || 0.95, unload: o.unload === false ? null : (car) => {
      const n = o.crew || 2;
      for (let i = 0; i < n; i++) { const g = goon(M, f, car.x + LP.rand(-10, 10), car.y + LP.rand(-10, 10), LP.pick(['pistol', 'smg', 'shotgun'])); (M.v.goons || (M.v.goons = [])).push(g); }
      if (car.driver) { const d = car.driver; car.driver = null; World.eject(car, d, false); d.mission = true; M.ents.push(d); (M.v.goons || (M.v.goons = [])).push(d); }
    } };
    c.vx = Math.cos(a) * 120; c.vy = Math.sin(a) * 120;
    return c;
  }
  const alive = (l) => (l || []).filter((p) => !p.dead && !p.gone);

  function ctx(def) {
    const M = { def, t: 0, phase: 0, ents: [], kills: 0, v: {} };
    M.obj = (text, target) => { MS.obj = { text, target: target || null }; };
    M.car = (type, x, y, a, o) => { const c = World.addCar(type, x, y, a, Object.assign({ mission: true }, o)); M.ents.push(c); return c; };
    M.ped = (kind, skin, x, y, o) => { const p = World.addPed(kind, skin, x, y, Object.assign({ mission: true }, o)); M.ents.push(p); return p; };
    M.say = (who, text, dur) => HUD.radio(who, text, dur);
    M.near = (e, z, r) => !!e && dist(e.x, e.y, z.x, z.y) < (r || z.r);
    M.inCar = (c) => Player.ped.inCar === c;
    M.timer = (s) => { MS.timer = s; };
    M.pass = () => MS.pass();
    M.fail = (why) => MS.fail(why);
    M.health = (e, label) => { MS.health = e; MS.healthLabel = label; };
    M.gone = (c) => !c || c.gone || c.wreck;
    return M;
  }

  // ------------------------------------------------------------------ THE STORY
  const L = MS.list;

  // 1 ----------------------------------------------------------------
  L.push({
    title: 'HOT WHEELS, COLD FEET', giver: 'mama', marker: 'mama', reward: 1000,
    brief: [
      ['mama', 'TWO-TOES, BABY! Your rent is three weeks late. Or three months. Time is a construct, sweetie.'],
      ['mama', 'Some tourist parked a brand new SLOTH GT at the HOTEL SIESTA on Palm Strip.'],
      ['mama', "Bring it to my chop shop, TOE-TAL AUTO, and we'll call it even. Try not to scratch it... much."],
      ['twotoes', "Steal a car. Sure. I'll get right on that... right after this nap."],
      ['mama', 'NOW, Two-Toes!']
    ],
    start(M) {
      const z = Z('gtspot');
      clearAt(z.x, z.y, 22);
      M.v.gt = M.car('sports', z.x, z.y, -Math.PI / 2, { col: '#e02828', parked: true, label: 'SLOTH GT' });
      M.obj('Steal the SLOTH GT at the Hotel Siesta', M.v.gt);
      HUD.tip('Walk up to a car and press E (gamepad A) to get in. Grab one off the street to get there faster!', 7);
    },
    update(M) {
      const gt = M.v.gt;
      if (M.gone(gt)) return M.fail('The SLOTH GT is scrap!');
      if (M.phase === 0 && M.inCar(gt)) { M.phase = 1; M.say('mama', "Ooh, it's SHINY. Now bring it to TOE-TAL AUTO in Pawn Row."); HUD.tip('W / RT = gas, S / LT = brake + reverse, SPACE / B = handbrake. Follow the yellow arrow.', 7); }
      if (M.phase >= 1) {
        if (M.inCar(gt)) {
          M.obj('Deliver the SLOTH GT to TOE-TAL AUTO', Z('chop'));
          if (M.near(gt, Z('chop')) && gt.spd < 70) M.pass();
        } else M.obj('Get back in the SLOTH GT', gt);
      }
    },
    passed(M) { const gt = M.v.gt; if (M.inCar(gt)) Player.exit(true); gt.noEnter = true; World.later(1.2, () => { gt.gone = true; }); }
  });

  // 2 ----------------------------------------------------------------
  L.push({
    title: 'REPO RODEO', giver: 'mama', marker: 'mama', reward: 1500,
    brief: [
      ['mama', "Three deadbeats owe me money. I don't want the money anymore, baby. I want their cars WRECKED."],
      ['mama', "Take Grandpa Moss's old pistol. He won't miss it. He's been napping since 1987."],
      ['twotoes', 'Is he... okay?'],
      ['mama', "He's FINE. Go!"]
    ],
    start(M) {
      Weapons.Inv.give('pistol', 72); Weapons.Inv.select('pistol');
      HUD.tip('Aim with the mouse (or right stick). Click / Ctrl / RT to shoot. Shot-up cars catch fire... then BOOM. Keep your distance!', 8);
      const spots = [spotIn('neon', 2), spotIn('pawn', 5), spotIn('beach', 3)];
      const types = ['muscle', 'van', 'pickup'];
      M.v.t = spots.map((s, i) => { clearAt(s.x, s.y, 20); return M.car(types[i], s.x, s.y, s.a, { parked: true, label: 'DEADBEAT ' + (i + 1), hpMul: 0.6, col: ['#c8a020', '#7a5a8a', '#3a7aa0'][i] }); });
      const s3 = spots[2];
      M.v.owner = M.ped('civ', 'civ7', s3.x + 18, s3.y + 4, { state: 'idle' });
      M.v.owner.brain = (p) => { p.vx = p.vy = 0; };
      M.v.n = 0;
    },
    update(M) {
      const left = M.v.t.filter((c) => !M.gone(c));
      M.v.n = 3 - left.length;
      if (!left.length) return M.pass();
      const pl = Player.ped;
      left.sort((a, b) => dist2(a.x, a.y, pl.x, pl.y) - dist2(b.x, b.y, pl.x, pl.y));
      M.obj('Wreck the deadbeats\' cars (' + M.v.n + '/3)', left[0]);
      // the third deadbeat sees you coming and bolts
      const c3 = M.v.t[2], o = M.v.owner;
      if (!M.v.fled && !M.gone(c3) && o && !o.dead && dist(pl.x, pl.y, c3.x, c3.y) < 150) {
        M.v.fled = true;
        o.brain = (p, dt) => {
          const d = dist(p.x, p.y, c3.x, c3.y);
          if (d < 14 && !c3.driver && !M.gone(c3)) { c3.driver = p; p.inCar = c3; p.gone = true; c3.parked = false; c3.ai = { mode: 'flee', speed: 200 }; M.say('mama', "He's running! Chase that deadbeat down!"); return; }
          const a = Math.atan2(c3.y - p.y, c3.x - p.x); p.vx = Math.cos(a) * 85; p.vy = Math.sin(a) * 85; p.a = a;
        };
        Fx.text(o.x, o.y - 10, 'UH OH!', '#ffffff');
      }
    },
    onWreck(M, c) { if (M.v.t.includes(c)) HUD.toast('REPO\'D!', '#9dff4a'); }
  });

  // 3 ----------------------------------------------------------------
  L.push({
    title: 'SPECIAL DELIVERY', giver: 'mama', marker: 'mama', reward: 2500,
    brief: [
      ['mama', 'This van is full of totally legal toasters. They are not stolen. Stop looking at me like that.'],
      ['mama', 'Drive it to the CECROPIA IMPORTS warehouse at the docks.'],
      ['mama', 'And baby... if anybody follows you, LOSE THEM first. The buyer is shy.']
    ],
    start(M) {
      const p = tile(34, 69);
      clearAt(p.x, p.y, 34);
      M.v.van = M.car('van', p.x, p.y, 0, { col: '#d8d0b0', label: 'TOASTER VAN', parked: true });
      M.obj('Get in the toaster van', M.v.van);
    },
    update(M) {
      const van = M.v.van;
      if (M.gone(van)) return M.fail('The toasters are toast!');
      if (M.phase === 0) {
        if (M.inCar(van)) {
          M.phase = 1; Police.force(2, 6);
          M.say('mama', 'Uh-oh. Somebody snitched! Shake those cops, baby!');
          HUD.tip('Lose the cops: get out of their sight until the badges drop, or get a fresh coat at SLOW-N-SPRAY ($250, cyan on the radar).', 9);
        }
        return;
      }
      if (!M.inCar(van)) return M.obj('Get back in the van', van);
      if (Police.stars > 0) return M.obj('Lose the cops (' + Police.stars + ' badge' + (Police.stars > 1 ? 's' : '') + ')', null);
      M.obj('Deliver the van to CECROPIA IMPORTS at the docks', Z('dockdrop'));
      if (M.near(van, Z('dockdrop')) && van.spd < 70) M.pass();
    },
    passed(M) { const v = M.v.van; if (M.inCar(v)) Player.exit(true); v.noEnter = true; World.later(1.5, () => { v.gone = true; }); }
  });

  // 4 ----------------------------------------------------------------
  L.push({
    title: 'BOUNCER DUTY', giver: 'dj', marker: 'club', reward: 2000,
    brief: [
      ['dj', "Yo yo yo! Mama Moss says you're the slowest fast-thinker in Lethargy City. I respect that."],
      ['dj', "Problem: THREE-TOE TERRY's crew is shaking down my club. Scaring my dancers. Spilling my smoothies."],
      ['dj', 'Here, take this SMG. Show those Three-Toes the exit.'],
      ['twotoes', 'Club Hang Loose. Smoothies. Violence. I am... mildly interested.']
    ],
    start(M) {
      Weapons.Inv.give('smg', 128); Weapons.Inv.select('smg');
      const z = Z('club');
      M.v.goons = walkSpots(z.x, z.y - 40, 6, 40, 110).map((s, i) => goon(M, 'green', s.x, s.y, i % 3 === 0 ? 'smg' : 'pistol'));
      M.say('dj', 'There they are! Green bandanas! Hold down fire for full auto!');
    },
    update(M) {
      const live = alive(M.v.goons);
      if (!M.v.wave2 && M.kills >= 4) {
        M.v.wave2 = true;
        const pl = Player.ped, lane = City.randomLane(pl.x, pl.y, 260, 420, World.view());
        if (lane) M.v.car = goonCar(M, 'green', lane.x, lane.y, lane.a, { crew: 3 });
        M.say('dj', 'More Three-Toes rolling up! Green car! GREEN CAR!');
      }
      const carPending = M.v.car && !M.v.car.unloaded && !M.gone(M.v.car);
      if (M.v.wave2 && !live.length && !carPending) return M.pass();
      const pl = Player.ped;
      let t = carPending ? M.v.car : null;
      if (live.length) { live.sort((a, b) => dist2(a.x, a.y, pl.x, pl.y) - dist2(b.x, b.y, pl.x, pl.y)); t = live[0]; }
      M.obj('Clear the Three-Toes out of Club Hang Loose' + (live.length ? ' (' + live.length + ' left)' : ''), t);
    }
  });

  // 5 ----------------------------------------------------------------
  L.push({
    title: 'LIMO-NADE', giver: 'dj', marker: 'club', reward: 3000,
    brief: [
      ['dj', 'Terry himself is cruising Neon Blvd in his ARMORED LIMO, honking at my sign. HONKING.'],
      ['dj', "Take my 'Bass Cannon'. It's a shotgun. Wreck that limo before it gets back to the docks."],
      ['twotoes', 'I hate honking. Honking is the opposite of napping.']
    ],
    start(M) {
      Weapons.Inv.give('shotgun', 30); Weapons.Inv.select('shotgun');
      const pts = routePts([tile(25, 42), tile(7, 42), tile(7, 92), tile(156, 92)], 8);
      pts.push(tile(156, 78), Z('terry'));
      const a = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
      clearAt(pts[0].x, pts[0].y, 50);
      const limo = M.v.limo = M.car('limo', pts[0].x, pts[0].y, a, { col: '#1e3a1e', label: "TERRY'S LIMO", hpMul: 1.5, faction: 'green' });
      limo.driver = World.makeDriver('gang', 'green', { faction: 'green' });
      limo.ai = { mode: 'path', pts: pts.slice(1), speed: 150 };
      M.v.esc = [];
      for (let i = 1; i <= 2; i++) {
        const c = goonCar(M, 'green', pts[0].x - Math.cos(a) * 40 * i, pts[0].y - Math.sin(a) * 40 * i, a, { gun: 'pistol', unload: false, speedMul: 0.9 });
        M.v.esc.push(c);
      }
      M.health(limo, 'LIMO');
    },
    update(M) {
      const limo = M.v.limo;
      if (M.gone(limo)) return M.pass();
      M.obj("Wreck Terry's limo before it reaches the docks", limo);
      if (!limo.ai.pts.length && M.near(limo, Z('terry'), 70)) return M.fail('Terry made it home.');
      if (!M.v.taunt && dist(limo.x, limo.y, Player.ped.x, Player.ped.y) < 160) { M.v.taunt = true; M.say('terry', "Ha! This limo's ARMORED, slowpoke! Get him, boys!"); }
    },
    passed(M) { M.say('dj', 'BOOM! Terry bailed out the sunroof and ran off, but that limo is TOAST. Ha!'); }
  });

  // 6 ----------------------------------------------------------------
  L.push({
    title: 'TOUR BUS TERROR', giver: 'dj', marker: 'club', reward: 4000,
    brief: [
      ['dj', "Tonight's the big show at the BEACH STAGE. My PARTY BUS has to make it there in one piece."],
      ['dj', "Terry's mad about his limo. Real mad. He's gonna try to ram us off the road."],
      ['dj', 'You follow the bus. Anything green comes near it... make it not green.'],
      ['twotoes', "Babysitting a bus. Living the dream."]
    ],
    start(M) {
      const start = { x: 49 * T, y: 42.5 * T };
      clearAt(start.x, start.y, 60);
      const pts = routePts([tile(50, 42), tile(98, 42), tile(98, 128), tile(79, 128)], 8);
      pts.push({ x: 80 * T, y: 133 * T }, Z('stage'));
      const bus = M.v.bus = M.car('bus', start.x, start.y, 0, { label: 'PARTY BUS' });
      bus.driver = World.makeDriver('ally', 'dj');
      bus.ai = { mode: 'path', pts, speed: 105, patient: true, done: () => { M.v.arrived = true; } };
      bus.noEnter = true;
      M.health(bus, 'PARTY BUS');
      M.v.next = 6; M.v.cars = [];
    },
    update(M, dt) {
      const bus = M.v.bus;
      if (M.gone(bus)) return M.fail('The Party Bus got wrecked!');
      if (M.v.arrived || (bus.ai.pts && !bus.ai.pts.length)) return M.pass();
      M.obj('Protect the Party Bus', bus);
      M.v.next -= dt;
      const live = M.v.cars.filter((c) => !M.gone(c));
      if (M.v.next <= 0 && live.length < 3) {
        M.v.next = LP.rand(7, 10);
        const lane = City.randomLane(bus.x, bus.y, 280, 460, World.view());
        if (lane) { M.v.cars.push(goonCar(M, 'green', lane.x, lane.y, lane.a, { target: bus, gun: 'pistol', unload: false, speedMul: 1.05 })); if (!M.v.warned) { M.v.warned = true; M.say('dj', 'Three-Toes incoming! Keep them off my bus!'); } }
      }
    },
    passed(M) { M.say('dj', 'WE MADE IT! Lethargy City, are you ready to... relax?!'); }
  });

  // 7 ----------------------------------------------------------------
  L.push({
    title: 'DIRTY LAUNDRY', giver: 'cruller', marker: 'park', reward: 5000,
    brief: [
      ['cruller', "Two-Toes. Lieutenant Cruller, Precinct 27. Don't run. I'm off duty. Mostly."],
      ['cruller', "I've got a file on you thicker than a jelly donut. Car theft. Toaster smuggling. Limo-related property damage."],
      ['cruller', 'But I am a reasonable sloth. Terry is closing a deal with some VELVET suits on the Rustwater piers.'],
      ['cruller', 'Crash the deal. Grab the briefcase. Bring it to me here. Your file goes in the shredder.'],
      ['twotoes', 'And if I say no?'],
      ['cruller', 'Then I eat this donut. Slowly. In front of you. In your cell.']
    ],
    start(M) {
      const c = tile(161, 67.5);
      M.v.deal = c;
      M.v.goons = [];
      walkSpots(c.x, c.y, 8, 10, 60, [158, 64, 166, 71]).forEach((s, i) => {
        const f = i < 5 ? 'green' : 'purple';
        const g = goon(M, f, s.x, s.y, LP.pick(['pistol', 'smg', 'shotgun']), { hostile: false, state: 'idle' });
        M.v.goons.push(g);
      });
      M.v.case = Weapons.addPickup('item', c.x + 8, c.y, { onGet: () => { M.v.got = true; } });
      M.v.c1 = M.car('muscle', 156 * T, 64 * T, Math.PI / 2, { col: '#2a8a2a', parked: true });
      M.v.c2 = M.car('limo', 155.5 * T, 72 * T, Math.PI / 2, { col: '#3a1a5a', parked: true });
      // Cruller waits in the park
      const z = Z('park');
      M.v.cruller = M.ped('ally', 'cruller', z.x, z.y + 14, { hp: 999 });
      M.v.cruller.brain = (p) => { p.vx = p.vy = 0; const pl = Player.ped; p.a = Math.atan2(pl.y - p.y, pl.x - p.x); };
    },
    update(M) {
      const pl = Player.ped;
      if (!M.v.hot && (dist(pl.x, pl.y, M.v.deal.x, M.v.deal.y) < 200 || M.kills > 0)) {
        M.v.hot = true;
        for (const g of M.v.goons) { g.hostile = true; g.state = 'chase'; }
        M.say('terry', 'COPS?! No... worse. TWO-TOES! Light him up!');
      }
      if (!M.v.got) {
        M.obj(M.v.hot ? 'Grab the briefcase' : 'Crash the deal on the Rustwater piers', M.v.hot ? M.v.case : M.v.deal);
        return;
      }
      if (!M.v.forced) {
        M.v.forced = true; Police.force(3, 6);
        M.say('cruller', "Oh, did I mention my boys are watching that pier? Don't let 'em catch you. Heh.");
      }
      M.obj('Bring the briefcase to Cruller at Snooze Park', M.v.cruller);
      const veh = pl.inCar;
      if (M.near(pl, M.v.cruller, 34) && (!veh || veh.spd < 60)) M.pass();
    },
    passed(M) {
      Police.clear();
      Weapons.Inv.give('rifle', 90);
      M.say('cruller', "Pleasure doing business. I called off the dogs. Here, have an ASSAULT RIFLE. It 'fell off a truck'.");
      M.v.case.active = false; M.v.cruller.gone = true;
    }
  });

  // 8 ----------------------------------------------------------------
  L.push({
    title: "TERRY'S LAST NAP", giver: 'cruller', marker: 'park', reward: 6000,
    brief: [
      ['cruller', 'Nice work. Now Terry thinks the cops are onto him. Which we are. Specifically: you.'],
      ['cruller', "He's holed up in his compound at the docks. Put him to sleep. Permanently. Professionally speaking."],
      ['cruller', 'Rumor says he keeps a ROCKET LAUNCHER in a crate back there. Finders keepers.'],
      ['twotoes', "Terry. Rockets. Compound. ...I'm gonna need a bigger nap after this."]
    ],
    start(M) {
      const z = Z('terry');
      M.v.goons = walkSpots(z.x, z.y, 10, 0, 0, [140, 72.5, 151.5, 87.5]).map((s, i) => goon(M, 'green', s.x, s.y, ['pistol', 'smg', 'shotgun'][i % 3], { hostile: true, state: 'idle', range: 160 }));
      for (const g of M.v.goons) g.hostile = false;
      const t = M.v.terry = M.ped('boss', 'terry', 146 * T, 73.5 * T, { hp: 240, weapon: 'smg', faction: 'green', accuracy: 0.12, range: 200 });
      t.brain = null;
      M.v.car = M.car('muscle', 144 * T, 86 * T, 0, { col: '#1e6a1e', label: "TERRY'S RIDE", parked: true, faction: 'green' });
      const rc = Z('rocketcache');
      M.v.rocket = Weapons.addPickup('weapon', rc.x, rc.y, { w: 'rocket', amount: 8 });
      M.health(t, 'TERRY');
    },
    update(M) {
      const t = M.v.terry, pl = Player.ped;
      if (!M.v.hot && dist(pl.x, pl.y, t.x, t.y) < 260) { M.v.hot = true; for (const g of M.v.goons) { g.hostile = true; g.state = 'chase'; } M.say('terry', 'YOU! You blew up my LIMO! Get him!'); }
      if (t.dead) return M.pass();
      const car = M.v.car;
      if (!M.v.run && !t.inCar && (t.hp < t.maxHp * 0.6 || dist(pl.x, pl.y, t.x, t.y) < 70) && !M.gone(car)) {
        M.v.run = true;
        M.say('terry', "Nope! Nope nope nope! I'm OUTTA here!");
        t.brain = (p) => {
          if (M.gone(car)) { p.brain = null; return; }
          const d = dist(p.x, p.y, car.x, car.y);
          if (d < 16) { car.driver = p; p.inCar = car; const i = World.peds.indexOf(p); if (i >= 0) World.peds.splice(i, 1); car.parked = false; car.ai = { mode: 'flee', speed: 250, gun: 'smg' }; return; }
          const f = World.flowDir(p.x, p.y);
          const a = Math.atan2(car.y - p.y, car.x - p.x); p.vx = Math.cos(a) * 80; p.vy = Math.sin(a) * 80; p.a = a; void f;
        };
      }
      if (t.inCar) {
        M.obj("Terry's making a run for it! Wreck his ride!", t.inCar);
        M.health(t.inCar, "TERRY'S RIDE");
      } else { M.obj('Take out Three-Toe Terry', t); M.health(t, 'TERRY'); }
    },
    onWreck(M, c) { if (c === M.v.car && M.v.terry.inCar === c) { M.v.terry.dead = true; } },
    passed(M) { M.say('cruller', "Terry's taking the big nap. Good. The docks are quiet. I LIKE quiet."); }
  });

  // 9 ----------------------------------------------------------------
  L.push({
    title: 'THE DONUT HOLE', giver: 'cruller', marker: 'park', reward: 7000,
    brief: [
      ['cruller', 'The Three-Toes are finished. You did good, kid.'],
      ['cruller', "Meet me at the big parking lot in Pawn Row. I've got your cut. Cash. Lots of it. Probably."],
      ['twotoes', 'Why do I feel like this is a trap?'],
      ['cruller', "Trust me. I'm a cop."]
    ],
    start(M) {
      const z = Z('garage');
      clearAt(z.x, z.y, 40);
      M.v.cr = M.ped('ally', 'cruller', z.x, z.y, { hp: 999 });
      M.v.cr.brain = (p) => { p.vx = p.vy = 0; const pl = Player.ped; p.a = Math.atan2(pl.y - p.y, pl.x - p.x); };
      M.v.car = M.car('police', z.x + 26, z.y, Math.PI / 2, { label: "CRULLER'S CRUISER", hpMul: 6, parked: true });
      M.v.car.noEnter = true;
      M.v.goons = [];
    },
    update(M, dt) {
      const pl = Player.ped, cr = M.v.cr;
      if (M.phase === 0) {
        M.obj('Meet Cruller at the Pawn Row parking lot', cr);
        if (dist(pl.x, pl.y, cr.x, cr.y) < 80) {
          M.phase = 1;
          M.say('cruller', 'Nothing personal, Two-Toes. Baron Velvet pays better. GET HIM, BOYS!');
          Police.force(3, 50);
          const z = Z('garage');
          M.v.goons = walkSpots(z.x, z.y, 6, 60, 120).map((s) => goon(M, 'purple', s.x, s.y, LP.pick(['smg', 'pistol', 'shotgun'])));
          const car = M.v.car;
          cr.brain = (p) => {
            const d = dist(p.x, p.y, car.x, car.y);
            if (d < 16) { car.driver = p; p.inCar = car; const i = World.peds.indexOf(p); if (i >= 0) World.peds.splice(i, 1); car.parked = false; car.siren = true; car.ai = { mode: 'flee', speed: 280, onArrive: (c) => { c.gone = true; } }; return; }
            const a = Math.atan2(car.y - p.y, car.x - p.x); p.vx = Math.cos(a) * 80; p.vy = Math.sin(a) * 80; p.a = a;
          };
          M.timer(45); M.v.reinf = 8;
        }
        return;
      }
      if (M.phase === 1) {
        M.obj('Survive the ambush!', null);
        M.v.reinf -= dt;
        if (M.v.reinf <= 0 && alive(M.v.goons).length < 6) {
          M.v.reinf = 9;
          const lane = City.randomLane(pl.x, pl.y, 250, 400, World.view());
          if (lane) goonCar(M, 'purple', lane.x, lane.y, lane.a, { crew: 2 });
        }
        return;
      }
      M.obj('Lose the cops', null);
      if (Police.stars === 0) M.pass();
    },
    timeout(M) {
      M.phase = 2; MS.timer = null; Police.min = 0; Police.minT = 0;
      M.say('mama', "Baby, I heard sirens on the scanner! Lose those cops and get somewhere safe!");
    },
    passed(M) { M.say('dj', "Cruller sold you out to BARON VELVET? The guy who owns the Velvet Nap? That's... bad. That's real bad."); }
  });

  // 10 ---------------------------------------------------------------
  L.push({
    title: 'MOM-NAPPED', giver: 'baron', marker: 'mama', reward: 8000,
    brief: [
      ['baron', 'Ahh, Two-Toes. BARON VELVET. Charmed. Truly. You have been very... disruptive.'],
      ['baron', 'Your darling Mama Moss is enjoying my hospitality at the HUSTLE warehouse. I gave her an energy drink.'],
      ['baron', "She hasn't blinked in six hours. Come and get her... if you're FAST enough."],
      ['baron', "Ha! You're not. Nobody in this sleepy town is. That's what I'm going to fix."],
      ['twotoes', '...Okay. NOW I am awake.']
    ],
    start(M) {
      const z = Z('velvetwh');
      M.v.goons = walkSpots(z.x, z.y, 10, 0, 0, [102, 73.5, 112, 88]).map((s, i) => goon(M, 'purple', s.x, s.y, ['smg', 'pistol', 'shotgun'][i % 3], { hostile: true, state: 'idle', range: 170 }));
      for (const g of M.v.goons) g.hostile = false;
      const c = Z('mamacell');
      M.v.mama = M.ped('ally', 'mama', c.x, c.y, { hp: 160, state: 'captive' });
      Player.ped.armor = Math.max(Player.ped.armor, 60);
      HUD.toast('+ARMOR (MAMA\'S SPARE VEST)', '#6ab0ff');
      M.v.chasers = 0;
    },
    update(M, dt) {
      const mama = M.v.mama, pl = Player.ped;
      if (mama.dead) return M.fail('Mama Moss is down!');
      if (!M.v.hot && dist(pl.x, pl.y, mama.x, mama.y) < 280) { M.v.hot = true; for (const g of M.v.goons) { g.hostile = true; g.state = 'chase'; } M.say('baron', 'Guests! Show our visitor the FAST lane, boys!'); }
      if (M.phase === 0) {
        M.obj('Rescue Mama Moss from the HUSTLE warehouse', mama);
        if (!pl.inCar && dist(pl.x, pl.y, mama.x, mama.y) < 20) {
          M.phase = 1; mama.state = 'follow';
          M.say('mama', "TWO-TOES! I'm so wired I can HEAR COLORS! Get me outta here, baby!");
          HUD.tip('Mama follows you. Get in a car near her and she hops in.', 6);
        }
        return;
      }
      const car = pl.inCar;
      if (car && car.passenger === mama) {
        M.obj("Drive Mama to safety at Mama Moss Pawn", Z('safehouse'));
        M.health(car, 'YOUR RIDE');
        if (!M.v.chase) { M.v.chase = true; M.v.next = 2; }
        if (M.near(car, Z('safehouse'), 26) && car.spd < 70) return M.pass();
      } else {
        MS.health = null;
        M.obj(mama.inCar ? 'Get back in the car' : 'Get Mama into a car', mama.inCar || mama);
      }
      if (M.v.chase && M.v.chasers < 4) {
        M.v.next -= dt;
        if (M.v.next <= 0) {
          M.v.next = 9;
          const lane = City.randomLane(pl.x, pl.y, 260, 420, World.view());
          if (lane) { goonCar(M, 'purple', lane.x, lane.y, lane.a, { crew: 2, gun: 'smg' }); M.v.chasers++; }
        }
      }
    },
    passed(M) {
      const m = M.v.mama;
      if (m.inCar) { m.inCar.passenger = null; m.inCar = null; }
      m.gone = true;
      M.say('mama', "Home sweet pawn shop. That Baron is gonna PAY, baby. Come see me when you're ready.");
    }
  });

  // 11 ---------------------------------------------------------------
  L.push({
    title: 'SUGAR RUSH', giver: 'mama', marker: 'mama', reward: 10000,
    brief: [
      ['mama', 'That Baron wants to flood the city with HUSTLE energy drink. Nobody will ever nap again. NOBODY, Two-Toes.'],
      ['mama', 'Five HUSTLE tankers are rolling out right now. Blow them up. All of them.'],
      ['mama', "Grandpa's ROCKET LAUNCHER is in the closet. Don't ask why. Take it."],
      ['twotoes', 'We had a rocket launcher... in the closet... this whole time?'],
      ['mama', "It's a BIG closet."]
    ],
    start(M) {
      Weapons.Inv.give('rocket', 10); Weapons.Inv.give('grenade', 6); Weapons.Inv.select('rocket');
      M.timer(270);
      const anchors = [tile(20, 15), tile(140, 15), tile(20, 100), tile(140, 112), tile(60, 128)];
      M.v.tk = anchors.map((a) => {
        const lane = City.randomLane(a.x, a.y, 0, 400, World.view()) || City.randomLane(a.x, a.y, 0, 900, null);
        const c = M.car('tanker', lane.x, lane.y, lane.a, { label: 'HUSTLE TANKER', faction: 'purple' });
        c.driver = World.makeDriver('gang', 'purple', { faction: 'purple' });
        c.ai = { mode: 'traffic', from: lane.from, to: lane.to, next: null, lane: 0, off: lane.off, cruise: 120, wait: 0 };
        return c;
      });
      M.v.dn = 0;
    },
    update(M) {
      const live = M.v.tk.filter((c) => !M.gone(c));
      if (!live.length) return M.pass();
      const pl = Player.ped;
      live.sort((a, b) => dist2(a.x, a.y, pl.x, pl.y) - dist2(b.x, b.y, pl.x, pl.y));
      M.obj('Destroy the HUSTLE tankers (' + live.length + ' left)', live[0]);
      for (const c of live) {
        if (!c.escort && dist(c.x, c.y, pl.x, pl.y) < 320) {
          c.escort = true;
          if (c.ai.mode === 'traffic') c.ai = { mode: 'flee', speed: 190 };
          const lane = City.randomLane(c.x, c.y, 120, 300, World.view());
          if (lane) goonCar(M, 'purple', lane.x, lane.y, lane.a, { gun: 'smg', unload: false });
        }
      }
    },
    onWreck(M, c) { if (M.v.tk.includes(c)) { const n = M.v.tk.filter((t) => !M.gone(t)).length; HUD.toast(n ? 'TANKER DOWN! ' + n + ' TO GO' : 'ALL TANKERS DOWN!', '#ff7a2e'); } }
  });

  // 12 ---------------------------------------------------------------
  L.push({
    title: 'SLOW DOWN', giver: 'dj', marker: 'club', reward: 25000, final: true,
    brief: [
      ['dj', "Two-Toes! Word is BARON VELVET is skipping town tonight. Cruller's riding with him."],
      ['mama', 'He kidnapped me, baby. He made me DRINK something. I alphabetized my spice rack at 4 AM.'],
      ['dj', "They're at the VELVET NAP right now. Time to end this. Slowly. Stylishly."],
      ['twotoes', "Let's go ruin a rich guy's night."]
    ],
    start(M) {
      const z = Z('velvet');
      M.v.goons = walkSpots(z.x, z.y, 8, 0, 0, [82, 36, 94, 40]).map((s, i) => goon(M, 'purple', s.x, s.y, ['smg', 'shotgun', 'rifle', 'pistol'][i % 4], { hostile: true, state: 'chase', hp: 50 }));
      M.v.cr = M.ped('boss', 'cruller', z.x, z.y - 22, { hp: 230, weapon: 'shotgun', faction: 'purple', range: 150 });
      clearAt(88 * T, 41.5 * T, 60);
      M.v.limo = M.car('limo', 88 * T, 41.5 * T, Math.PI, { col: '#c8a028', label: "BARON'S LIMO", hpMul: 2.4, armored: true, faction: 'purple', parked: true });
      M.v.limo.noEnter = true;
      M.health(M.v.cr, 'CRULLER');
    },
    update(M) {
      const pl = Player.ped;
      if (M.phase === 0) {
        M.obj('Storm the VELVET NAP. Take down Cruller!', M.v.cr);
        if (M.v.cr.dead) {
          M.phase = 1;
          M.say('cruller', 'Should have... stayed... on donut duty...');
          const z = Z('velvet');
          const b = M.v.baron = M.ped('boss', 'baron', z.x, z.y - 20, { hp: 200, weapon: 'rifle', faction: 'purple' });
          const limo = M.v.limo;
          b.brain = (p) => {
            if (M.gone(limo)) { p.brain = null; return; }
            const d = dist(p.x, p.y, limo.x, limo.y);
            if (d < 18) {
              limo.driver = p; p.inCar = limo; const i = World.peds.indexOf(p); if (i >= 0) World.peds.splice(i, 1);
              limo.parked = false; limo.ai = { mode: 'flee', speed: 230, gun: 'rifle' };
              Police.force(4, 999);
              M.say('baron', "You'll never catch me! I've had SIX energy drinks! I can see TOMORROW!");
              return;
            }
            const a = Math.atan2(limo.y - p.y, limo.x - p.x); p.vx = Math.cos(a) * 110; p.vy = Math.sin(a) * 110; p.a = a;
          };
          M.health(M.v.limo, "BARON'S LIMO");
        }
        return;
      }
      if (M.phase === 1) {
        const limo = M.v.limo, b = M.v.baron;
        M.obj(b.inCar ? "Stop Baron Velvet's limo!" : 'Baron Velvet is running for his limo!', b.inCar ? limo : b);
        if (b.dead && !b.inCar) return toPhase3(M);
        // the limo is finished: the Baron crawls out, furious
        if (b.inCar === limo && (limo.burn > 0 || limo.hp <= 0 || limo.sink > 0)) {
          limo.driver = null; b.inCar = null; World.eject(limo, b, true);
          b.kind = 'boss'; b.brain = null; b.hp = 220; b.maxHp = 220; b.speed = 90;
          M.phase = 2;
          M.say('baron', 'MY LIMO! You... you SLOW, LAZY, NAPPING... I will END you myself!');
          M.health(b, 'BARON VELVET');
        }
        return;
      }
      if (M.phase === 2) {
        M.obj('Finish Baron Velvet!', M.v.baron);
        if (M.v.baron.dead) toPhase3(M);
        return;
      }
      MS.health = null;
      if (Police.stars > 0) M.obj('Lose the cops (' + Police.stars + ' badges)', null);
      else M.obj("Get home to Mama Moss Pawn", Z('safehouse'));
      if (Police.stars === 0 && M.near(pl, Z('safehouse'), 30) && (!pl.inCar || pl.inCar.spd < 80)) M.pass();
    },
    onWreck(M, c) {
      if (c === M.v.limo && M.v.baron && M.v.baron.inCar === c) {
        // exploded with him inside before he could crawl out
        M.v.baron.dead = true; M.v.baron.inCar = null;
      }
    }
  });
  function toPhase3(M) {
    M.phase = 3; Police.min = 0; Police.minT = 0;
    M.say('baron', 'Nooo... so... sleepy... finally...');
    W_later(3.5, () => M.say('mama', "That's my boy! Now lose those cops and come HOME, baby."));
  }
  const W_later = (t, f) => World.later(t, f);

  // ------------------------------------------------------------------ runner
  MS.next = function () {
    if (MS.done >= L.length) return null;
    const d = L[MS.done];
    if (!d.giverName) d.giverName = d.giver === 'baron' ? 'AN UNKNOWN CALLER' : Art.CHAR[d.giver].name;
    return d;
  };
  MS.reset = function (done) { MS.done = done || 0; MS.active = null; MS.M = null; MS.obj = null; MS.timer = null; MS.health = null; MS.cool = 1; };

  MS.update = function (dt) {
    if (MS.cool > 0) MS.cool -= dt;
    const pl = Player.ped;
    if (!MS.active) {
      MS.obj = null; MS.timer = null; MS.health = null;
      const d = MS.next();
      if (!d || !pl || pl.dead) return;
      const z = Z(d.marker);
      const dd = dist(pl.x, pl.y, z.x, z.y);
      MS.ringT -= dt;
      if (dd < 260 && MS.ringT <= 0) { MS.ringT = 2.2; GameAudio.sfx('ring', z.x, z.y); }
      if (MS.cool <= 0 && dd < (pl.inCar ? 22 : 14) && (!pl.inCar || pl.inCar.spd < 40)) MS.begin(MS.done, true);
      return;
    }
    const M = MS.M;
    M.t += dt;
    if (MS.timer !== null) {
      MS.timer -= dt;
      if (MS.timer <= 0) { MS.timer = null; if (MS.active.timeout) MS.active.timeout(M); else return MS.fail('Out of time!'); }
    }
    if (MS.active) MS.active.update(M, dt);
  };

  // brief = true: show the dialogue first (Game takes over the screen)
  MS.begin = function (i, brief) {
    const def = L[i];
    MS.idx = i;
    const pl = Player.ped;
    MS.snap = { hp: pl.hp, armor: pl.armor, inv: Weapons.Inv.save(), money: Player.money };
    if (brief) { Game.brief(def, () => MS.launch()); return; }
    MS.launch();
  };
  MS.launch = function () {
    const def = L[MS.idx];
    MS.active = def; MS.M = ctx(def); MS.obj = null; MS.timer = null; MS.health = null;
    def.start(MS.M);
    HUD.showBanner(def.title, 'MISSION ' + (MS.idx + 1) + ' OF ' + L.length, '#ff7ab4', 2.6);
    GameAudio.sfx('mstart');
    GameAudio.refreshMusic();
  };
  function release(remove) {
    const M = MS.M; if (!M) return;
    for (const e of M.ents) {
      if (remove) {
        if (e === Player.ped.inCar) Player.exit(true);
        if (e.passenger && e.passenger !== Player.ped) e.passenger = null;
        e.gone = true;
        if (e.inCar) { const c = e.inCar; if (c.driver === e) c.driver = null; }
      } else e.mission = false;
    }
    for (const p of Weapons.pickups) if (p.kind === 'item') p.active = false;
    LP.prune(Weapons.pickups, (p) => p.kind === 'item');
  }
  MS.pass = function () {
    const def = MS.active, M = MS.M;
    if (!def) return;
    if (def.passed) def.passed(M);
    release(false);
    MS.active = null; MS.obj = null; MS.timer = null; MS.health = null; MS.cool = 3;
    MS.done = Math.max(MS.done, MS.idx + 1);
    Player.addMoney(def.reward);
    Player.stats.missions++;
    HUD.showBanner('MISSION PASSED!', fmtMoney(def.reward), '#9dff4a', 3.5);
    GameAudio.sfx('passed');
    GameAudio.refreshMusic();
    Game.save();
    if (def.final) World.later(4, () => Game.ending());
  };
  MS.fail = function (why) {
    if (!MS.active) return;
    release(true);
    MS.active = null; MS.obj = null; MS.timer = null; MS.health = null; MS.cool = 3;
    Police.min = 0; Police.minT = 0;
    HUD.showBanner('MISSION FAILED', why || '', '#ff4040', 3.5);
    GameAudio.sfx('failed');
    GameAudio.refreshMusic();
    Game.failed();
  };
  // restart the current (or last failed) mission from its payphone, as you were when you took it
  MS.retry = function () {
    if (MS.active) { release(true); MS.active = null; }
    const def = L[MS.idx]; if (!def) return;
    const s = MS.snap, z = Z(def.marker);
    Police.clear();
    if (Player.ped && Player.ped.inCar) Player.exit(true);
    Player.spawn(z.x, z.y + 6, Math.PI / 2);
    if (s) { Player.ped.hp = Math.max(30, s.hp); Player.ped.armor = s.armor; Weapons.Inv.load(s.inv); Player.money = s.money; Player.shown = s.money; }
    World.snapCamera();
    MS.launch();
  };
  MS.onKill = function (p, by) {
    if (!MS.active) return;
    if (p.mission) MS.M.kills++;
    if (p.kind === 'ally' && p.mission && MS.active) { /* the mission's own update notices */ }
  };
  MS.onWreck = function (c, by) { if (MS.active && MS.active.onWreck) MS.active.onWreck(MS.M, c, by); };

  // where the yellow arrow points
  const tmpT = { x: 0, y: 0 };
  MS.target = function () {
    if (MS.active) {
      const t = MS.obj && MS.obj.target;
      if (!t) return null;
      const e = t.inCar || t;
      if (e.gone || (e.dead && !e.inCar)) return null;
      tmpT.x = e.x; tmpT.y = e.y; return tmpT;
    }
    const d = MS.next();
    if (!d) return null;
    const z = Z(d.marker); tmpT.x = z.x; tmpT.y = z.y; return tmpT;
  };
  MS.blips = function () {
    const out = [];
    const t = MS.target();
    if (t) out.push({ x: t.x, y: t.y, col: MS.active ? '#ffd23e' : '#ff7ab4', size: 4 });
    if (MS.active && MS.M) {
      for (const e of MS.M.ents) if (e.hostile && !e.dead && !e.gone && !e.inCar) out.push({ x: e.x, y: e.y, col: '#ff4040', size: 2 });
    }
    return out;
  };
  MS.drawMarkers = function (g, camX, camY, time) {
    const draw = (x, y, r, col, phone) => {
      const sx = x - camX, sy = y - camY;
      if (sx < -60 || sy < -60 || sx > G.W + 60 || sy > G.H + 60) return;
      const pr = r + Math.sin(time * 5) * 2;
      g.globalCompositeOperation = 'lighter';
      g.drawImage(Lights.glow(col, r + 10, 0.45), Math.round(sx - r - 10), Math.round(sy - r - 10));
      g.globalCompositeOperation = 'source-over';
      G.ring(sx, sy, pr, col, g); G.ring(sx, sy, pr - 2, City.shade(col, -0.3), g);
      if (phone) {
        const bob = Math.round(Math.sin(time * 4) * 2);
        g.fillStyle = '#101018'; g.fillRect(Math.round(sx - 5), Math.round(sy - 14 + bob), 10, 12);
        g.fillStyle = col; g.fillRect(Math.round(sx - 4), Math.round(sy - 13 + bob), 8, 10);
        g.fillStyle = '#101018'; g.fillRect(Math.round(sx - 3), Math.round(sy - 11 + bob), 6, 2); g.fillRect(Math.round(sx - 3), Math.round(sy - 7 + bob), 2, 2); g.fillRect(Math.round(sx + 1), Math.round(sy - 7 + bob), 2, 2);
        if (Math.floor(time * 3) % 2) Font.draw(g, 'RING!', sx, sy - 24 + bob, '#ffffff', { face: 'small', align: 'center', outline: '#000' });
      }
    };
    if (!MS.active) { const d = MS.next(); if (d) { const z = Z(d.marker); draw(z.x, z.y, 12, '#ff4fb4', true); } }
    else if (MS.obj && MS.obj.target && MS.obj.target.r && !MS.obj.target.kind) { const z = MS.obj.target; draw(z.x, z.y, Math.min(z.r, 30), '#ffd23e', false); }
    // the two respray shops always glow
    for (const n of ['spray1', 'spray2']) { const z = Z(n); if (Police.stars > 0) draw(z.x, z.y, 14, '#3ef0ff', false); }
  };
  MS.addLights = function (camX, camY) {
    if (!MS.active) { const d = MS.next(); if (d) { const z = Z(d.marker); Lights.add(z.x - camX, z.y - camY, 50, '#ff4fb4', 0.8); } }
    else if (MS.obj && MS.obj.target && MS.obj.target.r && !MS.obj.target.kind) { const z = MS.obj.target; Lights.add(z.x - camX, z.y - camY, 60, '#ffd23e', 0.7); }
  };
  return MS;
})();
