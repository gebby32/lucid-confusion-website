/* GAME — the glue: the two heroes as actors, who the player controls, specials
   (Sleavis' SLOTHZILLA freak-out, Sloth-Head's "remote"), property damage, stats,
   projectiles, pickups, saves.
   Game.leader = 'sleavis' | 'slothhead'.  Game.flags = story flags.  Game.stats = the
   numbers in the ending (property damage, Slutt-Heads, deaths, times scored: 0). */
'use strict';
const Game = (function () {
  const Gm = {
    leader: 'sleavis', flags: {}, stats: null, freak: 0, freakT: 0, remoteCD: 0, hitNeutrals: false, actors: {},
    projectiles: [], pickups: [], canSwap: true, combat: false, money: 0, shakeAmt: 0, shakeT: 0
  };
  Gm.freshStats = () => ({ damage: 0, slutt: 0, deaths: 0, kos: 0, beers: 0, lasers: 0, scored: 0, time: 0, punches: 0, pukes: 0 });
  Gm.stats = Gm.freshStats();

  // ------------------------------------------------------------------ hero actors
  Gm.makeHeroActors = function () {
    Gm.actors.sleavis = new Actor(Heroes.sleavis, { id: 'sleavis', name: 'SLEAVIS', team: 'hero', hero: true, hp: 10, speed: 4.4, dmg: 1.2, r: 0.38 });
    Gm.actors.slothhead = new Actor(Heroes.slothhead, { id: 'slothhead', name: 'SLOTH-HEAD', team: 'hero', hero: true, hp: 10, speed: 3.7, dmg: 1.0, r: 0.38 });
    Gm.actors.slothhead.reach = 1.35;
  };
  Gm.heroActors = () => [Gm.actors.sleavis, Gm.actors.slothhead].filter(Boolean);
  Gm.leaderActor = () => Gm.actors[Gm.leader];
  Gm.partnerActor = () => Gm.actors[Gm.leader === 'sleavis' ? 'slothhead' : 'sleavis'];
  Gm.hero = (id) => Gm.actors[id];
  // put the heroes into the current stage. which: 'both' | 'sleavis' | 'slothhead'
  Gm.spawnHeroes = function (p1, p2, which) {
    which = which || 'both';
    for (const a of Gm.heroActors()) {
      a.state = 'free'; a.target = null; a.scriptAnim = null; a.carry = null; a.knock = [0, 0]; a.gone = false; a.hp = Math.max(a.hp, 1);
      a.vis.root.visible = false; a.controlled = false; a.ai = null; a.ignoreCol = false; a.slow = 0; a.sneaking = false; a.pinY = null; a.invincible = false;
      if (Stage.cur.actors.indexOf(a) < 0) Stage.addActor(a);
    }
    if (which !== 'slothhead' && p1) { const a = Gm.actors.sleavis; a.vis.show(true); a.place(p1[0], p1[1], p1[2] || 0); }
    if (which !== 'sleavis' && p2) { const a = Gm.actors.slothhead; a.vis.show(true); a.place(p2[0], p2[1], p2[2] || 0); }
    if (which === 'sleavis') Gm.actors.slothhead.gone = true;
    if (which === 'slothhead') Gm.actors.sleavis.gone = true;
    Gm.solo = which !== 'both' ? which : null;
    if (Gm.solo) Gm.leader = Gm.solo;
    Stage.cam.snap = true;
  };
  Gm.healHeroes = function () { for (const a of Gm.heroActors()) { a.hp = a.maxhp; if (a.state === 'ko') a.revive(a.maxhp); } };

  // ------------------------------------------------------------------ control (called by the action mode)
  Gm.control = function (dt, o) {
    o = o || {};
    const I = LP.Input, L = Gm.leaderActor(), P = Gm.partnerActor();
    if (!L) return;
    if (Gm.freakT > 0) { Gm.freakT -= dt; if (Gm.freakT <= 0) { HUD.toast('SLEAVIS CALMS DOWN. KIND OF.', '#c8a0ff'); R3.quadMat.uniforms.tint.value.set(1, 1, 1); } }
    if (Gm.remoteCD > 0) Gm.remoteCD -= dt;
    if (I.pressed('swap') && !Gm.solo && Gm.canSwap && P && P.alive && P.vis.root.visible) Gm.swap();
    for (const a of Gm.heroActors()) a.controlled = false;
    if (L.alive) {
      L.controlled = true;
      const m = Ctl.move();
      let w = Stage.inputToWorld(m[0], m[1]);
      if (o.lockZ) w[1] = 0;
      L.mv = w; L.sneaking = !!o.sneak;
      if (I.pressed('jump') && o.jump !== false) L.jump();
      if (I.pressed('punch') && o.combat !== false) { if (L.carry) Gm.throwCarry(L); else if (L.attack()) Gm.stats.punches++; }
      if (I.pressed('use')) { if (L.carry) Gm.throwCarry(L); else if (!Gm.useHot(L)) Gm.grab(L); }
      if (I.pressed('special') && o.special !== false) Gm.special(L);
    } else L.mv = [0, 0];
    if (P && !Gm.solo && P.vis.root.visible) Gm.partnerAI(P, L, dt, o);
    // knocked-out heroes get back up if the other one is still standing
    for (const a of Gm.heroActors()) {
      if (a.state === 'ko' && !a.gone) {
        const other = a === L ? P : L;
        if ((Gm.solo || (other && other.alive)) && a.koT > 3) { a.revive(4); HUD.bark(a.id, a.id === 'sleavis' ? LP.pick(['Ow. Heh. My head is all... ringy.', 'I\'m OK! I think I saw my brain.']) : LP.pick(['Uhh... that didn\'t hurt. Dumbass.', 'I meant to do that. Uh huh huh.'])); }
      }
    }
    if (L.state === 'ko' && P && P.alive && !Gm.solo) Gm.swap(true);
  };
  Gm.allDown = () => Gm.heroActors().filter((a) => a.vis.root.visible && !a.gone).every((a) => a.state === 'ko');
  Gm.swap = function (forced) {
    Gm.leader = Gm.leader === 'sleavis' ? 'slothhead' : 'sleavis';
    GameAudio.sfx('swap');
    HUD.swapFlash = 0.6;
    const L = Gm.leaderActor();
    L.target = null;
    if (!forced) HUD.bark(L.id, L.id === 'sleavis' ? LP.pick(['My turn! Heh heh.', 'Outta the way, Slutt-Head.', 'Sleavis is IN, baby.']) : LP.pick(['Watch and learn, dumbass.', 'Step aside. Uh huh huh.', 'Finally. Somebody competent.']));
  };
  Gm.partnerAI = function (P, L, dt, o) {
    P.controlled = false;
    if (P.state !== 'free' || P.target) return;
    // fight if there's something to fight
    let foe = null, fd = 1e9;
    if (o.combat !== false) for (const a of Stage.cur.actors) if (a.team === 'enemy' && a.alive && a.vis.root.visible) { const d = P.distTo(a); if (d < fd && d < 9) { fd = d; foe = a; } }
    if (foe) {
      if (fd > 1.1) { const m = fd; P.mv = [(foe.x - P.x) / m * 0.8, (foe.z - P.z) / m * 0.8]; }
      else { P.mv = [0, 0]; P.lookAt(foe); if (P.cd <= 0 && LP.chance(dt * 2.4)) P.attack(); }
      P.ai = null;
      return;
    }
    const d = P.distTo(L);
    if (d > 14 && L.alive) { P.place(L.x - Math.sin(L.face) * 1.2, L.z - Math.cos(L.face) * 1.2, L.face); return; }
    if (d > 1.9) { const m = d, k = d > 4 ? 1.15 : 0.8; P.mv = [(L.x - P.x) / m * k, (L.z - P.z) / m * k]; }
    else { P.mv = [0, 0]; if (d < 1.9 && LP.chance(dt * 0.4)) P.lookAt(L); }
    if (L.y > P.y + 0.6 && P.onGround && d < 2.4) P.jump();
  };

  // ------------------------------------------------------------------ hotspots + carrying
  Gm.nearHot = function (L) {
    let best = null, bd = 1e9;
    for (const h of Stage.cur.hot) {
      if (h.used || (h.cond && !h.cond())) continue;
      const d = Math.hypot(h.x - L.x, h.z - L.z);
      if (d < h.r && d < bd) { bd = d; best = h; }
    }
    return best;
  };
  Gm.useHot = function (L) {
    const h = Gm.nearHot(L);
    if (!h) return false;
    if (h.who && h.who !== L.id) {
      HUD.bark(L.id, h.whoMsg || (L.id === 'sleavis' ? 'Uh... that\'s a Slutt-Head thing. Heh heh.' : 'That\'s more of a Sleavis-level activity. Uh huh huh.'));
      HUD.toast('PRESS ' + HUD.btn('swap') + ' TO SWITCH TO ' + (h.who === 'sleavis' ? 'SLEAVIS' : 'SLOTH-HEAD'), '#ffe040');
      return true;
    }
    if (h.once) h.used = true;
    L.mv = [0, 0];
    L.lookAt({ x: h.x, z: h.z });
    if (h.act) Story.run(h.act, h, L);
    return true;
  };
  Gm.grab = function (L) {
    let best = null, bd = 1.3;
    for (const p of Stage.cur.props) {
      if (!p.alive || p.kind !== 'throw' || p.held) continue;
      const d = Math.hypot(p.x - L.x, p.z - L.z);
      if (d < bd) { bd = d; best = p; }
    }
    if (!best) return false;
    if (best.heavy && L.id !== 'slothhead') { HUD.bark('sleavis', 'Nnnngh! It\'s too heavy! Hey Slutt-Head, you do it. You got the fat arms.'); return true; }
    best.held = L; L.carry = best;
    GameAudio.sfx('pickup');
    return true;
  };
  Gm.throwCarry = function (L) {
    const p = L.carry; if (!p) return;
    L.carry = null; p.held = null;
    L.vis.setAnim('throw', { restart: true }); L.state = 'attack'; L.st = 0; L.hitDone = true; L.recover = 0.3;
    const pow = L.id === 'slothhead' ? 13 : 10;
    Gm.launch({ x: L.x + Math.sin(L.face) * 0.5, y: L.y + 1.9, z: L.z + Math.cos(L.face) * 0.5, vx: Math.sin(L.face) * pow, vy: 3, vz: Math.cos(L.face) * pow, mesh: p.mesh, prop: p, from: L, dmg: p.dmg || 3, team: 'hero' });
    GameAudio.sfx('throw');
  };

  // ------------------------------------------------------------------ projectiles
  Gm.launch = function (o) { o.t = 0; Gm.projectiles.push(o); if (o.mesh && !o.mesh.parent) Stage.cur.root.add(o.mesh); return o; };
  const MISSILES = {
    bottle: () => { const g = new THREE.Group(); Mk.cyl(g, 0.06, 0.08, 0.32, '#2a7a3a', 0, -0.16, 0); return g; },
    corndog: () => { const g = new THREE.Group(); Mk.cyl(g, 0.1, 0.1, 0.45, 'cornbatter', 0, -0.2, 0); return g; },
    chair: () => { const g = new THREE.Group(); Mk.box(g, 0.5, 0.08, 0.5, 'planks', 0, 0, 0); Mk.box(g, 0.5, 0.5, 0.08, 'planks', 0, 0, -0.22); return g; },
    tomato: () => { const g = new THREE.Group(); Mk.ball(g, 0.12, '#d02020', 0, 0, 0); return g; },
    dart: () => { const g = new THREE.Group(); Mk.box(g, 0.05, 0.05, 0.4, '#e0e0e0', 0, 0, 0); return g; }
  };
  Gm.throwAt = function (from, to, kind) {
    const mesh = (MISSILES[kind] || MISSILES.bottle)();
    const dx = to.x - from.x, dz = to.z - from.z, d = Math.hypot(dx, dz) || 1, t = Math.max(0.5, d / 11);
    Gm.launch({ x: from.x, y: from.y + 1.7, z: from.z, vx: dx / t, vz: dz / t, vy: ((to.y + 1.0) - (from.y + 1.7) + 0.5 * 11 * t * t) / t, mesh, from, dmg: from.missileDmg || 1.5, team: 'enemy', spin: true, kind });
    GameAudio.sfx('throw');
  };
  function updateProjectiles(dt) {
    LP.prune(Gm.projectiles, (p) => {
      p.t += dt; p.vy -= 11 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.mesh) { p.mesh.position.set(p.x, p.y, p.z); if (p.spin || p.prop) { p.mesh.rotation.x += dt * 12; } }
      let hit = false;
      for (const a of Stage.cur.actors) {
        if (!a.alive || a === p.from || !a.vis.root.visible) continue;
        if (p.team === 'hero' ? a.team !== 'enemy' && !(Gm.hitNeutrals && a.team === 'neutral') : a.team !== 'hero') continue;
        if (Math.hypot(a.x - p.x, a.z - p.z) < a.r + 0.35 && p.y > a.y && p.y < a.y + a.h) { a.hurt(p.dmg, p.from, { knock: 6 }); hit = true; break; }
      }
      if (!hit && p.team === 'hero') for (const q of Stage.cur.props) {
        if (!q.alive || q.kind !== 'break' || q === p.prop) continue;
        if (Math.hypot(q.x - p.x, q.z - p.z) < q.r + 0.3 && p.y < q.y + (q.top || 2)) { Stage.breakProp(q, p.from); hit = true; break; }
      }
      const g = Stage.groundAt(p.x, p.z, p.y);
      const wall = Stage.resolve(p.x, p.z, 0.1, p.y - 0.2, 0.3)[2];
      if (hit || p.y <= g + 0.05 || wall || p.t > 4) {
        FX3.burst(new THREE.Vector3(p.x, Math.max(g, p.y), p.z), 8, { colors: p.kind === 'tomato' ? ['#d02020', '#ff6040'] : p.kind === 'corndog' ? ['#c8862a', '#e8d020'] : ['#2a7a3a', '#a0d0a0', '#8a5a2a'], size: 0.08, floor: g });
        GameAudio.sfx(p.kind === 'tomato' ? 'splat' : 'glass');
        if (p.mesh) Stage.cur.root.remove(p.mesh);
        if (p.prop) { p.prop.alive = false; if (p.prop.value) Gm.damage(p.prop.value, new THREE.Vector3(p.x, p.y, p.z)); }
        return true;
      }
      return false;
    });
  }

  // ------------------------------------------------------------------ pickups
  // kind: 'beer' (+freak, heal 1) | 'burrito' (heal 4) | 'cash' | 'sugar' (+freak 35) | custom { onGet }
  Gm.pickup = function (kind, x, z, o) {
    o = o || {};
    const g = new THREE.Group();
    if (kind === 'beer') { Mk.cyl(g, 0.09, 0.09, 0.26, Mat.get(Tex.make('beercan', 16, 16, (c) => { c.fillStyle = '#e8e8f0'; c.fillRect(0, 0, 16, 16); c.fillStyle = '#c02020'; c.fillRect(0, 5, 16, 6); c.fillStyle = '#2040c0'; c.fillRect(0, 0, 16, 3); })), 0, 0, 0); }
    else if (kind === 'burrito') { Mk.cyl(g, 0.12, 0.12, 0.42, '#e8d8a0', 0, 0, 0, { rz: Math.PI / 2 }); }
    else if (kind === 'sugar') { Mk.box(g, 0.28, 0.36, 0.1, Mat.get(Tex.sign('SUGAR\nBOMB', { bg: '#ff40c0', fg: '#fff', font: 'small' })), 0, 0, 0); }
    else if (kind === 'cash') { Mk.box(g, 0.32, 0.04, 0.16, '#3a9a3a', 0, 0.05, 0); }
    else { Mk.box(g, 0.3, 0.3, 0.3, o.color || '#e0c040', 0, 0, 0); }
    g.position.set(x, (o.y || Stage.groundAt(x, z, 10)) + 0.25, z);
    Stage.cur.root.add(g);
    const p = { kind, x, z, mesh: g, o, t: Math.random() * 6 };
    Gm.pickups.push(p);
    return p;
  };
  function updatePickups(dt) {
    LP.prune(Gm.pickups, (p) => {
      p.t += dt;
      p.mesh.rotation.y += dt * 2.5; p.mesh.position.y += Math.sin(p.t * 3) * 0.004;
      for (const h of Gm.heroActors()) {
        if (!h.alive || !h.vis.root.visible) continue;
        if (Math.hypot(h.x - p.x, h.z - p.z) < 0.7 && Math.abs(h.y + 0.3 - p.mesh.position.y) < 1.4) {
          Stage.cur.root.remove(p.mesh);
          const at = new THREE.Vector3(p.x, p.mesh.position.y + 0.5, p.z);
          if (p.kind === 'beer') { h.hp = Math.min(h.maxhp, h.hp + 1); Gm.freakAdd(14); Gm.stats.beers++; HUD.popup(at, 'BEER!', '#ffe040'); GameAudio.sfx('slurp'); if (LP.chance(0.35)) HUD.bark(h.id, h.id === 'sleavis' ? LP.pick(['Beer! Heh heh. Breakfast.', 'It\'s warm. Like pee. Heh heh. COOL.']) : LP.pick(['Uh huh huh. Free beer.', 'This is the best beer I ever found on the ground.'])); }
          else if (p.kind === 'burrito') { h.hp = Math.min(h.maxhp, h.hp + 4); HUD.popup(at, 'MYSTERY BURRITO', '#ffe040'); GameAudio.sfx('eat'); }
          else if (p.kind === 'sugar') { Gm.freakAdd(40); HUD.popup(at, 'SUGAR BOMB!!', '#ff60e0'); GameAudio.sfx('slurp'); }
          else if (p.kind === 'cash') { Gm.money += p.o.amount || 5; HUD.popup(at, '+$' + (p.o.amount || 5), '#60ff60'); GameAudio.sfx('cash'); }
          if (p.o.onGet) p.o.onGet(h, p);
          return true;
        }
      }
      return false;
    });
  }

  // ------------------------------------------------------------------ specials
  Gm.freakAdd = function (n) { if (Gm.freakT > 0) return; Gm.freak = Math.min(100, Gm.freak + n); };
  Gm.special = function (L) {
    if (L.id === 'sleavis') {
      if (Gm.freakT > 0) return;
      if (Gm.freak < 100) { HUD.toast('FREAK METER NOT FULL (' + Math.floor(Gm.freak) + '%) — GET HIT, BREAK STUFF, DRINK', '#c8a0ff'); return; }
      Gm.freak = 0; Gm.freakT = 7.5;
      GameAudio.sfx('freak');
      Gm.flash(0.5);
      HUD.shout(LP.pick(['I AM SLOTHZILLA!! BOW BEFORE MY CLAWS!', 'I NEED SNACKS FOR MY SNACK-HOLE!!', 'ARE YOU THREATENING ME?! I AM THE ALMIGHTY SLOTHZILLA!', 'FEAR ME, FOR I HAVE NO PANTS UNDER THIS!']));
      R3.quadMat.uniforms.tint.value.set(1.15, 0.85, 1.25);
      return;
    }
    // Sloth-Head
    if (!Gm.flags.remote) {
      if (Gm.remoteCD > 0) return;
      Gm.remoteCD = 4;
      L.pose('flex'); setTimeout(() => { if (L.scriptAnim === 'flex') L.pose(null); }, 900);
      HUD.bark('slothhead', LP.pick(['Uh huh huh. Check out these guns.', 'Ladies. Uh huh huh.', 'I\'m like, extremely studly.']));
      for (const a of Stage.cur.actors) if (a.team === 'enemy' && a.alive && a.distTo(L) < 6) { a.aiData.wait = 1.5; HUD.popup(a.vis.headWorld(), 'UGH...', '#c0c0c0'); }
      return;
    }
    if (Gm.remoteCD > 0) { HUD.toast('THE REMOTE IS "WARMING UP" (' + Math.ceil(Gm.remoteCD) + ')', '#ff8080'); return; }
    Gm.remoteCD = 6.5;
    Gm.zap(L);
  };
  // press a random button on the P.A.T.R.I.O.T. uplink and see what explodes
  Gm.zap = function (L, forced) {
    Gm.stats.lasers++;
    let target = null, td = 16;
    for (const a of Stage.cur.actors) if (a.team === 'enemy' && a.alive && a.vis.root.visible) { const d = a.distTo(L); if (d < td) { td = d; target = a; } }
    let x, z;
    const oops = !forced && LP.chance(0.16);
    if (oops) { x = L.x + LP.rand(-1, 1); z = L.z + LP.rand(-1, 1); }
    else if (target) { x = target.x + LP.rand(-0.8, 0.8); z = target.z + LP.rand(-0.8, 0.8); }
    else { x = L.x + Math.sin(L.face) * 6 + LP.rand(-1.5, 1.5); z = L.z + Math.cos(L.face) * 6 + LP.rand(-1.5, 1.5); }
    HUD.bark('slothhead', oops ? 'Uh... wrong button. Uh huh huh. RUN.' : LP.pick(['Channel 69. Uh huh huh.', 'Mute. Uh huh huh.', 'Changing the channel, dumbass.', 'Volume up. WAY up.', 'Let\'s see what\'s on. Uh huh huh.']));
    L.pose('point'); setTimeout(() => { if (L.scriptAnim === 'point') L.pose(null); }, 700);
    GameAudio.sfx('click');
    FX3.laser(x, z, (lx, lz) => {
      for (const a of Stage.cur.actors.slice()) {
        if (!a.alive || !a.vis.root.visible) continue;
        const d = Math.hypot(a.x - lx, a.z - lz);
        if (d < 2.6) a.hurt(a.hero ? 3 : 6, { x: lx, z: lz }, { knock: 10 });
      }
      for (const p of Stage.cur.props) if (p.alive && p.kind === 'break' && Math.hypot(p.x - lx, p.z - lz) < 3) Stage.breakProp(p, L);
      Gm.damage(LP.randi(8000, 45000), new THREE.Vector3(lx, 1, lz));
      if (Gm.onZap) Gm.onZap(lx, lz);
    }, { y: Stage.groundAt(x, z, 10) });
  };

  // ------------------------------------------------------------------ property damage, juice, stats
  Gm.damage = function (amount, at) {
    Gm.stats.damage += amount;
    HUD.damageBump(amount);
    if (at) HUD.popup(at, '-$' + amount.toLocaleString(), '#80ff80', true);
  };
  Gm.shake = function (amt, t) { if (!LP.Settings.get('shake')) return; Gm.shakeAmt = Math.max(Gm.shakeAmt, amt); Gm.shakeT = Math.max(Gm.shakeT, t || 0.3); };
  Gm.flash = function (a) { Gm.flashA = Math.max(Gm.flashA || 0, a); };
  Gm.update = function (dt) {
    updateProjectiles(dt);
    updatePickups(dt);
    if (Gm.shakeT > 0) { Gm.shakeT -= dt; const m = Gm.shakeAmt * Math.min(1, Gm.shakeT * 3); R3.shakeX = LP.rand(-m, m); R3.shakeY = LP.rand(-m, m); } else { R3.shakeX = R3.shakeY = 0; Gm.shakeAmt = 0; }
    Gm.flashA = Math.max(0, (Gm.flashA || 0) - dt * 2.5);
    R3.quadMat.uniforms.flash.value = Gm.flashA;
    Gm.stats.time += dt;
  };
  Gm.clearTransient = function () {
    for (const p of Gm.projectiles) if (p.mesh && p.mesh.parent) p.mesh.parent.remove(p.mesh);
    for (const p of Gm.pickups) if (p.mesh.parent) p.mesh.parent.remove(p.mesh);
    Gm.projectiles.length = 0; Gm.pickups.length = 0; Gm.freakT = 0; Gm.remoteCD = 0; Gm.onZap = null; Gm.hitNeutrals = false;
    R3.quadMat.uniforms.tint.value.set(1, 1, 1);
  };

  // ------------------------------------------------------------------ save / continue
  Gm.hasSave = () => !!LP.Store.get('save', null);
  Gm.save = function (ch, seg) {
    LP.Store.set('save', { v: 1, ch, seg, flags: Gm.flags, stats: Gm.stats, freak: Gm.freak, best: Math.max(ch, (LP.Store.get('save', {}) || {}).best || 0) });
    const reached = LP.Store.get('reached', 0);
    if (ch > reached) LP.Store.set('reached', ch);
  };
  Gm.load = function () {
    const s = LP.Store.get('save', null);
    if (!s) return null;
    Gm.flags = Object.assign({}, s.flags); Gm.stats = Object.assign(Gm.freshStats(), s.stats); Gm.freak = s.freak || 0;
    return s;
  };
  // chapter select / continue safety: the flags every later chapter takes for granted
  Gm.ensureFlags = function (ch) {
    if (ch >= 1) { Gm.flags.remote = true; Gm.flags.convertible = true; }
    if (ch >= 2) Gm.flags.graffiti = true;
    if (ch >= 4) Gm.flags.twoRemotes = true;
    if (ch >= 3 && !Gm.money) Gm.money = 53.17;
  };
  Gm.reset = function () { Gm.flags = {}; Gm.stats = Gm.freshStats(); Gm.freak = 0; Gm.freakT = 0; Gm.leader = 'sleavis'; Gm.money = 0; };
  return Gm;
})();
