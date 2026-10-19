/* ACTORS — anybody who walks, punches, gets punched, or lies on the floor going "uhhh".
   new Actor(visual, o)   o = { id, x, z, face, team: 'hero'|'enemy'|'neutral', hp, speed, dmg, ai, name, hero }
   Heroes are driven by the player (Game.leader) or by the partner AI; enemies by o.ai or
   Actor.AI.brawler. Scripts can take over with a.walkTo(x, z) / a.pose(anim) / a.face… */
'use strict';
class Actor {
  constructor(vis, o) {
    o = o || {};
    this.vis = vis; this.id = o.id || null; this.name = o.name || (vis.look && vis.look.name) || '';
    this.x = o.x || 0; this.y = o.y || 0; this.z = o.z || 0; this.vy = 0; this.vx = 0; this.vz = 0;
    this.face = o.face || 0; this.faceT = this.face;
    this.r = o.r || 0.36; this.h = o.h || 1.8;
    this.team = o.team || 'neutral'; this.hero = !!o.hero;
    this.hp = this.maxhp = o.hp || 4; this.dmg = o.dmg || 1; this.speed = o.speed || 3.2;
    this.ai = o.ai || null; this.aiData = {};
    this.state = 'free'; this.st = 0; this.cd = 0; this.inv = 0;
    this.mv = [0, 0]; this.running = false; this.onGround = true; this.ground = 0;
    this.scriptAnim = null; this.target = null; this.carry = null; this.punchAlt = false;
    this.koT = 0; this.gone = false; this.stayDown = !!o.stayDown; this.knock = [0, 0];
    this.ignoreCol = false; this.solid = o.solid !== false; this.talkable = o.talk || null;
    this.weight = o.weight || 1; this.bossy = !!o.boss;
    this.place(this.x, this.z, this.face);
  }
  place(x, z, face) {
    this.x = x; this.z = z; if (face !== undefined) { this.face = this.faceT = face; }
    this.y = Stage.cur ? Stage.groundAt(x, z, 0.5) : 0; this.vy = 0; this.ground = this.y;   // spawn on the floor, not on the highest shelf above it
    this.sync();
    return this;
  }
  sync() {
    const r = this.vis.root;
    r.position.set(this.x, this.y, this.z);
    r.rotation.y = this.face;
    this.vis.groundY = this.ground;
  }
  get alive() { return this.state !== 'ko' && !this.gone; }
  distTo(o) { return Math.hypot(o.x - this.x, o.z - this.z); }
  angleTo(o) { return Math.atan2(o.x - this.x, o.z - this.z); }
  lookAt(o) { this.faceT = typeof o === 'number' ? o : this.angleTo(o); }
  // ------------------------------------------------------------------ scripting helpers
  walkTo(x, z, run) { this.target = { x, z, run: !!run }; this.state = 'free'; }
  pose(anim, o) { this.scriptAnim = anim; this.scriptO = o || {}; if (anim) this.vis.setAnim(anim, Object.assign({ restart: true }, o)); }
  arrived() { return !this.target; }
  jump(v) { if (this.onGround) { this.vy = v || 7.2; this.onGround = false; GameAudio.sfx('jump'); } }

  // ------------------------------------------------------------------ combat
  attack() {
    if (this.state !== 'free' || this.cd > 0 || this.carry) return false;
    this.state = 'attack'; this.st = 0; this.hitDone = false; this.punchAlt = !this.punchAlt;
    this.cd = this.hero ? (Game.freakT > 0 && this.id === 'sleavis' ? 0.18 : this.id === 'sleavis' ? 0.3 : 0.38) : 0.25;
    this.vis.setAnim(this.kickNext ? 'kick' : 'punch', { restart: true, alt: this.punchAlt });
    GameAudio.sfx('whoosh');
    return true;
  }
  doHit() {
    const range = this.reach || 1.25, arc = 1.1;
    let any = false;
    const freak = this.hero && this.id === 'sleavis' && Game.freakT > 0;
    const dmg = this.dmg * (freak ? 2.5 : 1);
    for (const o of Stage.cur.actors) {
      if (o === this || !o.alive || o.inv > 0) continue;
      if (!this.hostileTo(o)) continue;
      const d = this.distTo(o);
      if (d > range + o.r * 0.5 || Math.abs(o.y - this.y) > 1.2) continue;
      if (Math.abs(angDiff(this.face, this.angleTo(o))) > arc) continue;
      o.hurt(dmg, this, { knock: freak ? 9 : this.knockPow || 3.5 });
      any = true;
    }
    if (this.hero) {
      for (const p of Stage.cur.props) {
        if (!p.alive || p.kind !== 'break') continue;
        const d = Math.hypot(p.x - this.x, p.z - this.z);
        if (d > range + p.r) continue;
        if (Math.abs(angDiff(this.face, Math.atan2(p.x - this.x, p.z - this.z))) > arc + 0.3) continue;
        p.hp = (p.hp || 1) - (this.id === 'sleavis' ? 2 : 1) * (freak ? 3 : 1);
        any = true;
        if (p.hp <= 0) Stage.breakProp(p, this); else { GameAudio.sfx('thud'); FX3.burst(new THREE.Vector3(p.x, p.y + 0.7, p.z), 3, { colors: p.colors, size: 0.08 }); if (p.onHit) p.onHit(p, this); }
      }
    }
    if (any) { LP.Loop.hitstop(3); if (this.hero) Game.freakAdd(4); }
  }
  hostileTo(o) {
    if (this.team === 'hero') return o.team === 'enemy' || (o.team === 'neutral' && Game.hitNeutrals);
    if (this.team === 'enemy') return o.team === 'hero';
    return false;
  }
  hurt(dmg, from, o) {
    o = o || {};
    if (!this.alive || this.inv > 0 || this.invincible) return;
    this.hp -= dmg;
    const a = from ? Math.atan2(this.x - from.x, this.z - from.z) : this.face + Math.PI;
    const k = o.knock === undefined ? 3.5 : o.knock;
    this.knock = [Math.sin(a) * k / this.weight, Math.cos(a) * k / this.weight];
    if (k > 6) this.vy = 4;
    this.inv = this.hero ? 0.5 : 0.12;
    this.carry = this.dropCarry();
    GameAudio.sfx(dmg >= 2 ? 'bigpunch' : 'punch');
    const hp = this.vis.headWorld ? this.vis.headWorld() : new THREE.Vector3(this.x, this.y + 1.6, this.z);
    FX3.burst(hp, 4, { colors: this.hero ? ['#f0e0a0', '#ffffff'] : ['#f0f0f0', '#e8d060'], size: 0.07, speed: 3, up: 3 });
    HUD.popup(hp, LP.pick(this.hero ? ['OW!', 'OOF', 'HEY!', 'NNGH'] : ['POW', 'WHAM', 'BONK', 'SMACK', 'OOF', 'CRUNCH']), this.hero ? '#ff8080' : '#ffe040');
    if (this.hero) Game.freakAdd(9);
    // poise: a goon that eats three hits in a row stops flinching for a moment and swings back
    if (!this.hero) {
      const now = LP.Loop.time;
      this.combo = now - (this.lastHitT || -9) < 1.3 ? (this.combo || 0) + 1 : 1;
      this.lastHitT = now;
      if (this.combo >= 3 && !(this.armorT > 0)) { this.armorT = 1.1; this.combo = 0; this.cd = 0; HUD.popup(this.vis.headWorld(), 'GRR!', '#ff6040'); }
    }
    if (this.hp <= 0) this.ko(from);
    else if (this.armorT > 0) { this.knock[0] *= 0.25; this.knock[1] *= 0.25; if (this.state !== 'attack') { this.state = 'free'; if (this.ai === Actor.AI.brawler || this.ai === Actor.AI.thrower) { this.windup = 0.22; this.recover = 0.45; this.attack(); } } }
    else { this.state = 'hit'; this.st = 0; this.vis.setAnim('hit', { restart: true }); }
    if (this.onHurt) this.onHurt(dmg, from);
  }
  ko(from) {
    this.hp = 0; this.state = 'ko'; this.st = 0; this.koT = 0; this.target = null;
    this.vis.setAnim('ko', { restart: true });
    GameAudio.sfx(this.hero ? 'heroko' : 'ko');
    if (!this.hero) { Game.stats.kos++; if (this.onKO) this.onKO(from); }
  }
  revive(hp) { this.hp = hp || Math.ceil(this.maxhp / 2); this.state = 'free'; this.st = 0; this.inv = 1.5; this.vis.setAnim('idle'); }
  dropCarry() { if (this.carry) { const p = this.carry; p.held = null; p.x = this.x + Math.sin(this.face) * 0.6; p.z = this.z + Math.cos(this.face) * 0.6; p.y = Stage.groundAt(p.x, p.z, 10); if (p.mesh) { p.mesh.position.set(p.x, p.y, p.z); } } return null; }

  // ------------------------------------------------------------------ per frame
  update(dt) {
    if (this.gone) return;
    this.st += dt; if (this.cd > 0) this.cd -= dt; if (this.inv > 0) this.inv -= dt; if (this.armorT > 0) this.armorT -= dt;
    let mvx = 0, mvz = 0, sp = this.speed;
    if (this.state === 'ko') {
      this.koT += dt;
      if (this.hero) { /* Game decides */ }
      else if (!this.stayDown && this.koT > 3.2) { this.gone = true; this.vis.root.visible = false; return; }
      else if (!this.stayDown && this.koT > 2.2) this.vis.root.visible = Math.floor(this.koT * 12) % 2 === 0;
    } else if (this.state === 'hit') {
      if (this.st > (this.hero ? 0.38 : 0.3)) this.state = 'free';
    } else if (this.state === 'attack') {
      if (!this.hitDone && this.st > (this.windup || 0.1)) { this.hitDone = true; this.doHit(); }
      if (this.st > (this.recover || 0.32)) { this.state = 'free'; this.kickNext = false; }
    } else if (this.state === 'free') {
      if (this.target) {
        const dx = this.target.x - this.x, dz = this.target.z - this.z, d = Math.hypot(dx, dz);
        if (d < 0.15) { this.target = null; }
        else { mvx = dx / d; mvz = dz / d; if (this.target.run) sp *= 1.6; if (d < 0.5) sp *= d / 0.5 + 0.2; }
      } else if (this.controlled) {
        mvx = this.mv[0]; mvz = this.mv[1];
      } else if (this.ai && !this.scriptAnim) {
        this.ai(this, dt);
        mvx = this.mv[0]; mvz = this.mv[1];
      }
    }
    if (this.hero && this.id === 'sleavis' && Game.freakT > 0) sp *= 1.7;
    if (this.carry) sp *= 0.8;
    if (this.slow) sp *= this.slow;
    // AI unstick: walking into furniture for a moment -> sidestep around it
    if (!this.controlled && this.side && this.side.t > 0) {
      this.side.t -= dt;
      const d = this.side.dir, nx2 = -mvz * d * 0.9 + mvx * 0.35, nz2 = mvx * d * 0.9 + mvz * 0.35;
      mvx = nx2; mvz = nz2;
    }
    // velocity
    let vx = mvx * sp, vz = mvz * sp;
    vx += this.knock[0]; vz += this.knock[1];
    this.knock[0] *= Math.pow(0.004, dt); this.knock[1] *= Math.pow(0.004, dt);
    if (Math.abs(this.knock[0]) + Math.abs(this.knock[1]) < 0.05) this.knock = [0, 0];
    let nx = this.x + vx * dt, nz = this.z + vz * dt;
    if (!this.ignoreCol) { const r = Stage.resolve(nx, nz, this.r, this.y, this.h); nx = r[0]; nz = r[1]; }
    // actors push each other a little (no stacking idiots)
    if (this.solid && !this.ignoreCol) for (const o of Stage.cur.actors) {
      if (o === this || !o.solid || o.gone || o.state === 'ko' || Math.abs(o.y - this.y) > 1) continue;
      const dx = nx - o.x, dz = nz - o.z, d = Math.hypot(dx, dz), m = this.r + o.r;
      if (d < m && d > 1e-4) { const p = (m - d) * 0.5; nx += dx / d * p; nz += dz / d * p; }
    }
    const want = Math.hypot(mvx, mvz) * sp * dt, got = Math.hypot(nx - this.x, nz - this.z);
    if (want > 0.004 && got < want * 0.3) this.stuckT = (this.stuckT || 0) + dt; else this.stuckT = Math.max(0, (this.stuckT || 0) - dt * 0.5);
    if (this.stuckT > 0.3 && !this.controlled && !(this.side && this.side.t > 0)) { this.side = { t: 0.8, dir: Math.random() < 0.5 ? -1 : 1 }; this.stuckT = 0; }
    this.x = nx; this.z = nz;
    // gravity / ground
    const g = this.pinY !== undefined && this.pinY !== null ? this.pinY : Stage.groundAt(this.x, this.z, this.y + 0.01, this.r);
    this.ground = g;
    if (this.pinY !== undefined && this.pinY !== null) { this.y = this.pinY; this.vy = 0; this.onGround = true; }
    else if (!this.onGround || this.y > g + 0.01) {
      this.vy -= 22 * dt; this.y += this.vy * dt;
      if (this.y <= g) { if (!this.onGround && this.vy < -3) { GameAudio.sfx('land'); } this.y = g; this.vy = 0; this.onGround = true; }
      else this.onGround = false;
    } else if (this.y < g) { this.y = g; }
    else this.y = g;
    // facing
    const moving = Math.hypot(mvx, mvz) > 0.1;
    if (moving && this.state === 'free') this.faceT = Math.atan2(mvx, mvz);
    this.face += angDiff(this.face, this.faceT) * Math.min(1, dt * 12);
    // animation
    if (this.state === 'free') {
      let a, o = {};
      if (this.scriptAnim) { a = this.scriptAnim; o = this.scriptO || {}; if (moving && !this.scriptHold) { a = (this.target && this.target.run) ? 'run' : 'walk'; } }
      else if (!this.onGround) a = this.vy > 0 ? 'jump' : 'fall';
      else if (this.carry) { a = 'carry'; o = { moving }; }
      else if (moving) { const fast = sp > 4.2 || (this.target && this.target.run); a = this.sneaking ? 'sneak' : fast ? 'run' : 'walk'; o = { speed: Math.min(1.3, sp / 3.6) }; }
      else if (this.hero && this.id === 'sleavis' && Game.freakT > 0) a = 'flail';
      else a = this.idleAnim || 'idle';
      this.vis.setAnim(a, o);
    }
    if (this.carry && this.carry.mesh) { const p = this.carry; p.mesh.position.set(this.x, this.y + 1.95, this.z); p.mesh.rotation.y = this.face; }
    this.sync();
    this.vis.update(dt);
  }
}

// ------------------------------------------------------------------ stock AI
Actor.AI = {
  // stand around; face the nearest hero when close
  idle(a) {
    a.mv = [0, 0];
    const h = Game.leaderActor && Game.leaderActor();
    if (h && a.distTo(h) < 3.5) a.lookAt(h);
  },
  // wander inside a radius of home
  wander(a, dt) {
    const d = a.aiData;
    if (!d.home) { d.home = [a.x, a.z]; d.t = 0; d.go = null; }
    d.t -= dt;
    if (d.t <= 0) { d.t = LP.rand(1.5, 4); d.go = LP.chance(0.6) ? [d.home[0] + LP.rand(-3, 3), d.home[1] + LP.rand(-3, 3)] : null; }
    if (d.go) { const dx = d.go[0] - a.x, dz = d.go[1] - a.z, dd = Math.hypot(dx, dz); if (dd < 0.3) d.go = null; else { a.mv = [dx / dd * 0.5, dz / dd * 0.5]; return; } }
    a.mv = [0, 0];
  },
  // classic beat-'em-up goon: close in, circle a bit, wind up, swing
  brawler(a, dt) {
    const d = a.aiData;
    const heroes = Game.heroActors().filter((h) => h.alive && h.vis.root.visible);
    a.mv = [0, 0];
    if (!heroes.length) return;
    if (!d.foe || !d.foe.alive || LP.chance(dt * 0.3)) d.foe = heroes.reduce((b, h) => (a.distTo(h) < a.distTo(b) ? h : b), heroes[0]);
    const f = d.foe, dist = a.distTo(f);
    d.wait = (d.wait || 0) - dt;
    if (d.wait > 0) { a.lookAt(f); return; }
    const ring = a.ring || 1.05;
    if (dist > ring) {
      let dx = f.x - a.x, dz = f.z - a.z;
      // side-scroller: line up on the same depth before closing in
      if (Stage.cam.mode === 'side' && Math.abs(dz) > 0.3 && Math.abs(dx) < 3) { dx *= 0.3; }
      const m = Math.hypot(dx, dz) || 1;
      a.mv = [dx / m * (a.aggro || 0.85), dz / m * (a.aggro || 0.85)];
    } else {
      a.lookAt(f);
      if (a.cd <= 0 && LP.chance(dt * (a.aggression || 2.3))) {
        a.windup = a.windupT || 0.3; a.recover = a.windup + 0.25;
        a.attack(); a.cd = LP.rand(0.8, 1.6) / (a.aggression || 2.3) * 2;
        if (LP.chance(0.2)) d.wait = LP.rand(0.3, 0.9);
      }
    }
  },
  // throw stuff from range (bottles, corn dogs, chairs)
  thrower(a, dt) {
    const d = a.aiData;
    const heroes = Game.heroActors().filter((h) => h.alive);
    a.mv = [0, 0];
    if (!heroes.length) return;
    const f = heroes[0].distTo(a) < (heroes[1] ? heroes[1].distTo(a) : 99) ? heroes[0] : heroes[1] || heroes[0];
    a.lookAt(f);
    const dist = a.distTo(f);
    if (dist < 2) return Actor.AI.brawler(a, dt);
    if (dist > 9) { const m = dist; a.mv = [(f.x - a.x) / m * 0.7, (f.z - a.z) / m * 0.7]; return; }
    d.t = (d.t || LP.rand(1, 2)) - dt;
    if (d.t <= 0) { d.t = LP.rand(1.6, 2.8); Game.throwAt(a, f, a.missile || 'bottle'); a.vis.setAnim('throw', { restart: true }); a.state = 'attack'; a.st = 0; a.hitDone = true; a.recover = 0.4; }
  }
};
