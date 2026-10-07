/* WEAPONS — eight ways to ruin someone's nap.
   Definitions, the player's inventory (with the pause-menu CHEAT CODE: every weapon +
   unlimited ammo, nothing else), firing for peds and drive-bys, bullets / rockets /
   grenades / flames, explosions (with chain reactions), and pickups. */
'use strict';
const Weapons = (function () {
  const DEF = {
    fists: { name: 'CLAWS', pose: 0, melee: true, rate: 0.36, dmg: 20, slot: 1 },
    pistol: { name: 'PISTOL', pose: 1, rate: 0.2, dmg: 24, speed: 720, spread: 0.035, clip: 12, reload: 0.9, pickup: 36, slot: 2, range: 320, npcRate: 0.9 },
    smg: { name: 'SMG', pose: 1, rate: 0.075, dmg: 14, speed: 760, spread: 0.1, clip: 32, reload: 1.3, pickup: 96, auto: true, slot: 3, burst: true, npcRate: 0.6 },
    shotgun: { name: 'SHOTGUN', pose: 2, rate: 0.72, dmg: 16, pellets: 7, speed: 620, spread: 0.28, clip: 6, reload: 1.4, pickup: 18, slot: 4, range: 200, npcRate: 1.4 },
    rifle: { name: 'ASSAULT RIFLE', pose: 2, rate: 0.1, dmg: 26, speed: 920, spread: 0.035, clip: 30, reload: 1.6, pickup: 90, auto: true, slot: 5, burst: true, npcRate: 0.7 },
    flamer: { name: 'FLAMETHROWER', pose: 2, rate: 0.035, flame: true, clip: 150, reload: 1.8, pickup: 300, auto: true, slot: 6 },
    grenade: { name: 'GRENADES', pose: 0, rate: 0.6, thrown: true, clip: 0, pickup: 8, slot: 7 },
    rocket: { name: 'ROCKET LAUNCHER', pose: 2, rate: 0.95, rocket: true, clip: 1, reload: 1.0, pickup: 6, slot: 8 }
  };
  const ORDER = ['fists', 'pistol', 'smg', 'shotgun', 'rifle', 'flamer', 'grenade', 'rocket'];

  // ------------------------------------------------------------------ inventory (the player)
  const Inv = {
    owned: { fists: true }, clip: {}, ammo: {}, cur: 'fists', reloadT: 0,
    get cheat() { return !!LP.Settings.get('cheat'); },
    reset() { this.owned = { fists: true }; this.clip = {}; this.ammo = {}; this.cur = 'fists'; this.reloadT = 0; },
    has(w) { return w === 'fists' || this.cheat || !!this.owned[w]; },
    // rounds you could fire right now without reloading
    ready(w) {
      if (w === 'fists' || this.cheat) return true;
      const D = DEF[w];
      return D.clip ? (this.clip[w] || 0) > 0 : (this.ammo[w] || 0) > 0;
    },
    empty(w) { if (w === 'fists' || this.cheat) return false; return !this.owned[w] || ((this.clip[w] || 0) + (this.ammo[w] || 0)) <= 0; },
    consume(w) {
      if (w === 'fists' || this.cheat) return;
      const D = DEF[w];
      if (D.clip) this.clip[w] = Math.max(0, (this.clip[w] || 0) - 1); else this.ammo[w] = Math.max(0, (this.ammo[w] || 0) - 1);
    },
    canReload(w) { const D = DEF[w]; return !this.cheat && !!D.clip && (this.clip[w] || 0) < D.clip && (this.ammo[w] || 0) > 0; },
    finishReload(w) {
      const D = DEF[w]; if (!D.clip) return;
      const take = Math.min(D.clip - (this.clip[w] || 0), this.ammo[w] || 0);
      this.clip[w] = (this.clip[w] || 0) + take; this.ammo[w] -= take;
    },
    give(w, n) {
      if (w === 'fists') return;
      const first = !this.owned[w];
      this.owned[w] = true;
      const D = DEF[w];
      this.ammo[w] = Math.min(9999, (this.ammo[w] || 0) + (n === undefined ? D.pickup : n));
      if (D.clip && !(this.clip[w] > 0)) this.finishReload(w);
      return first;
    },
    list() { return ORDER.filter((w) => this.has(w) && !this.empty(w)); },
    cycle(dir) {
      const l = this.list();
      if (!l.length) { this.cur = 'fists'; return; }
      let i = l.indexOf(this.cur);
      i = ((i < 0 ? 0 : i + dir) % l.length + l.length) % l.length;
      this.select(l[i]);
    },
    select(w) { if (this.has(w) && !this.empty(w) && w !== this.cur) { this.cur = w; this.reloadT = 0; GameAudio.sfx('switch'); } },
    // after the cheat is switched off, or ammo runs dry, fall back to something you really have
    validate() { if (!this.has(this.cur) || this.empty(this.cur)) { this.cur = 'fists'; const l = this.list(); for (let i = l.length - 1; i >= 0; i--) if (DEF[l[i]].slot < 7 || this.cheat) { this.cur = l[i]; break; } this.reloadT = 0; } },
    save() { return { owned: Object.assign({}, this.owned), clip: Object.assign({}, this.clip), ammo: Object.assign({}, this.ammo), cur: this.cur }; },
    load(s) { this.reset(); if (!s) return; Object.assign(this.owned, s.owned || {}); Object.assign(this.clip, s.clip || {}); Object.assign(this.ammo, s.ammo || {}); this.cur = s.cur || 'fists'; this.validate(); }
  };

  // ------------------------------------------------------------------ projectiles
  const bullets = [], rockets = [], grenades = [], flames = [];

  // shooter: a ped (player or NPC). If the ped is driving, shots come from the car.
  function fire(sh, ang, npc, wOverride) {
    const w = wOverride || (sh.kind === 'player' ? Inv.cur : sh.weapon);
    const D = DEF[w];
    const car = sh.inCar;
    let ox, oy;
    if (car) {
      const ca = Math.cos(car.a), sa = Math.sin(car.a);
      // muzzle out of the window nearest the aim
      const side = Math.sin(ang - car.a) >= 0 ? 1 : -1;
      const fwd = Math.cos(ang - car.a) > 0.7;
      ox = car.x + ca * (fwd ? car.t.len / 2 + 3 : 2) - sa * (fwd ? 0 : side * (car.t.wid / 2 + 3));
      oy = car.y + sa * (fwd ? car.t.len / 2 + 3 : 2) + ca * (fwd ? 0 : side * (car.t.wid / 2 + 3));
    } else { ox = sh.x + Math.cos(ang) * 8; oy = sh.y + Math.sin(ang) * 8; }
    if (D.melee) { World.punch(sh, null, ang); return; }
    const team = sh.faction;
    if (D.pellets) {
      for (let i = 0; i < D.pellets; i++) {
        const a = ang + LP.rand(-D.spread, D.spread) / 2, s = D.speed * LP.rand(0.85, 1.1);
        bullets.push({ x: ox, y: oy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, dmg: D.dmg, owner: sh, car, team, life: 0.32, pellet: true });
      }
    } else if (D.rocket) {
      rockets.push({ x: ox, y: oy, vx: Math.cos(ang) * 340, vy: Math.sin(ang) * 340, a: ang, owner: sh, car, life: 2.2 });
    } else if (D.thrown) {
      const s = car ? 90 : 210;
      grenades.push({ x: ox, y: oy, z: 6, vz: 70, vx: Math.cos(ang) * s + (car ? car.vx : 0), vy: Math.sin(ang) * s + (car ? car.vy : 0), owner: sh, fuse: 1.6 });
    } else if (D.flame) {
      for (let i = 0; i < 2; i++) {
        const a = ang + LP.rand(-0.12, 0.12), s = LP.rand(170, 230);
        flames.push({ x: ox, y: oy, vx: Math.cos(a) * s + (car ? car.vx : 0), vy: Math.sin(a) * s + (car ? car.vy : 0), t: 0, life: LP.rand(0.32, 0.45), owner: sh, car });
      }
    } else {
      const sp = npc ? D.spread * 0.6 : D.spread;
      const a = ang + LP.rand(-sp, sp), s = D.speed;
      bullets.push({ x: ox, y: oy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, dmg: npc ? Math.round(D.dmg * 0.55) : D.dmg, owner: sh, car, team, life: (D.range || 420) / s + 0.1 });
    }
    if (!D.flame && !D.thrown) {
      Fx.light(ox, oy, D.rocket ? 60 : 40, '#ffd070', 0.07, 0.9);
      Fx.add('glow', { x: ox + Math.cos(ang) * 2, y: oy + Math.sin(ang) * 2, life: 0.05, size: D.pellets || D.rocket ? 4 : 3, shape: 'disc', col: '#fff4b0' });
      if (D.clip && !D.rocket) Fx.add('ground', { x: ox, y: oy, vx: Math.cos(ang + 1.6) * 50, vy: Math.sin(ang + 1.6) * 50, z: 3, vz: 50, life: 1.2, size: 1, drag: 3, col: '#e8c050' });
    }
    GameAudio.shot(w, ox, oy, npc);
    if (sh.kind === 'player') { Police.crime('shots', ox, oy); World.scare(ox, oy, 170); }
    else if (!npc || Math.random() < 0.3) World.scare(ox, oy, 120);
  }

  const near = [];
  function update(dt) {
    // bullets: stepped so fast rounds never skip through thin things
    LP.prune(bullets, (b) => {
      b.life -= dt;
      if (b.life <= 0) return true;
      const sp = Math.hypot(b.vx, b.vy), steps = Math.max(1, Math.ceil(sp * dt / 5));
      for (let i = 0; i < steps; i++) {
        b.x += b.vx * dt / steps; b.y += b.vy * dt / steps;
        if (City.solidCar(Math.floor(b.x / 16), Math.floor(b.y / 16))) { Fx.sparks(b.x - b.vx * 0.004, b.y - b.vy * 0.004, 3); return true; }
        if (hitThings(b, b.dmg, 'bullet')) return true;
      }
      return false;
    });
    LP.prune(rockets, (r) => {
      r.life -= dt;
      const steps = 4;
      for (let i = 0; i < steps; i++) {
        r.x += r.vx * dt / steps; r.y += r.vy * dt / steps;
        if (r.life <= 0 || City.solidCar(Math.floor(r.x / 16), Math.floor(r.y / 16)) || hitThings(r, 0, 'rocket')) { explode(r.x - r.vx * 0.01, r.y - r.vy * 0.01, 54, r.owner, { power: 1.2 }); return true; }
      }
      if (Math.random() < 0.9) Fx.add('top', { x: r.x - r.vx * 0.03, y: r.y - r.vy * 0.03, vx: LP.rand(-8, 8), vy: LP.rand(-8, 8), life: 0.8, size: 2, grow: 5, shape: 'disc', col: '#a8a4b0', alpha: 0.6, fade: true });
      Fx.fire(r.x - r.vx * 0.02, r.y - r.vy * 0.02, 0.6);
      return false;
    });
    LP.prune(grenades, (gr) => {
      gr.fuse -= dt;
      gr.vz -= 260 * dt; gr.z += gr.vz * dt;
      if (gr.z <= 0) { gr.z = 0; gr.vz = Math.abs(gr.vz) > 30 ? -gr.vz * 0.4 : 0; gr.vx *= gr.vz ? 0.7 : Math.pow(0.05, dt); gr.vy *= gr.vz ? 0.7 : Math.pow(0.05, dt); }
      const nx = gr.x + gr.vx * dt, ny = gr.y + gr.vy * dt;
      if (City.solidCar(Math.floor(nx / 16), Math.floor(gr.y / 16))) gr.vx = -gr.vx * 0.5; else gr.x = nx;
      if (City.solidCar(Math.floor(gr.x / 16), Math.floor(ny / 16))) gr.vy = -gr.vy * 0.5; else gr.y = ny;
      if (gr.fuse <= 0) { explode(gr.x, gr.y, 48, gr.owner, {}); return true; }
      return false;
    });
    LP.prune(flames, (f) => {
      f.t += dt;
      if (f.t >= f.life) return true;
      f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= Math.pow(0.3, dt); f.vy *= Math.pow(0.3, dt);
      if (City.solidCar(Math.floor(f.x / 16), Math.floor(f.y / 16))) return true;
      if (Math.random() < 0.5) Fx.fire(f.x, f.y, 0.8 + f.t * 2);
      hitThings(f, 0, 'flame');
      return false;
    });
  }

  // test a projectile against cars, peds, props and the helicopter. true = consumed
  function hitThings(b, dmg, kind) {
    const owner = b.owner;
    for (const c of World.cars) {
      if (c === b.car || c.gone || c.sink > 0) continue;
      if (Math.abs(c.x - b.x) > c.t.len / 2 + 6 || Math.abs(c.y - b.y) > c.t.len / 2 + 6) continue;
      const cs = Cars.circles(c, near);
      for (let i = 0; i < cs.length; i += 2) {
        if (dist2(cs[i], cs[i + 1], b.x, b.y) > c.t.cr * c.t.cr) continue;
        if (kind === 'flame') { if (Math.random() < 0.3) World.damageCar(c, 1.2, owner, 'fire'); return false; }
        if (kind === 'bullet') { World.damageCar(c, dmg * 0.35, owner, 'bullet'); Fx.sparks(b.x, b.y, 2, '#fff0c0'); GameAudio.sfx('ping', b.x, b.y); }
        return true;
      }
    }
    for (const p of World.peds) {
      if (p === owner || p.dead || p.inCar || p.gone) continue;
      if (kind === 'bullet' && owner && owner.kind !== 'player' && p.faction === owner.faction && p.kind !== 'player') continue;
      const r = kind === 'flame' ? 7 : 5;
      if (Math.abs(p.x - b.x) > r || Math.abs(p.y - b.y) > r) continue;
      if (kind === 'flame') { if (!(p.burn > 0)) World.ignite(p, owner); continue; }
      if (kind === 'bullet') { World.damagePed(p, dmg, owner, b.pellet ? 'shotgun' : 'bullet', Math.atan2(b.vy, b.vx)); }
      return true;
    }
    const pl = Player.ped;
    if (pl && owner !== pl && !pl.dead && !pl.inCar && Math.abs(pl.x - b.x) < 5 && Math.abs(pl.y - b.y) < 5) {
      if (kind === 'flame') { World.ignite(pl, owner); return false; }
      if (kind === 'bullet') World.damagePed(pl, dmg, owner, 'bullet', Math.atan2(b.vy, b.vx));
      return true;
    }
    const h = Police.heli;
    if (h && !h.dead && owner && owner.kind === 'player' && kind !== 'flame' && dist2(h.x, h.y, b.x, b.y) < 196) {
      if (kind === 'bullet') { Police.hitHeli(dmg * 0.5); Fx.sparks(b.x, b.y, 2); }
      return true;
    }
    City.propsNear(b.x, b.y, 8, near);
    for (const p of near) {
      if (!p.solid || p.r <= 0) continue;
      if (dist2(p.x, p.y, b.x, b.y) > (p.r + 1) * (p.r + 1)) continue;
      if (kind === 'flame') { if (p.explode && Math.random() < 0.1) World.hitProp(p, 999, owner); return false; }
      World.hitProp(p, kind === 'rocket' ? 999 : dmg, owner, true);
      Fx.sparks(b.x, b.y, 2);
      return true;
    }
    return false;
  }

  // ------------------------------------------------------------------ explosions
  function explode(x, y, r, owner, o) {
    o = o || {};
    Fx.explosion(x, y, r);
    LP.FX.shake(Math.min(9, r / 7), 22);
    GameAudio.boom(x, y, r);
    City.stamp(x, y, r, (g, lx, ly) => {
      g.globalAlpha = 0.5; G.ellipse(lx, ly, r * 0.55, r * 0.5, '#141016', g);
      g.globalAlpha = 0.4; G.ellipse(lx, ly, r * 0.35, r * 0.32, '#0a080c', g);
      g.globalAlpha = 1;
    });
    World.scare(x, y, 260);
    if (owner && owner.kind === 'player') Police.crime('explosion', x, y);
    const power = o.power || 1;
    for (const p of World.peds.concat([Player.ped])) {
      if (!p || p.dead || p.inCar) continue;
      const d = dist(x, y, p.x, p.y);
      if (d > r * 1.15) continue;
      const k = 1 - d / (r * 1.15);
      const dmg = (25 + 150 * k) * power * (p === Player.ped ? 0.6 : 1);
      const a = Math.atan2(p.y - y, p.x - x);
      World.damagePed(p, dmg, owner, 'explosion', a);
      p.vx += Math.cos(a) * 160 * k; p.vy += Math.sin(a) * 160 * k;
    }
    for (const c of World.cars) {
      if (c.gone || c.sink > 0) continue;
      const d = dist(x, y, c.x, c.y), R = r + c.t.len / 2;
      if (d > R) continue;
      const k = 1 - d / R, a = Math.atan2(c.y - y, c.x - x);
      World.damageCar(c, (40 + 120 * k) * power * (c.armored ? 0.5 : 1), owner, 'explosion');
      c.vx += Math.cos(a) * 280 * k / c.t.mass; c.vy += Math.sin(a) * 280 * k / c.t.mass; c.w += LP.rand(-6, 6) * k / c.t.mass;
    }
    City.propsNear(x, y, r, near);
    for (const p of near.slice()) if (dist(x, y, p.x, p.y) < r + p.r) World.hitProp(p, 999, owner);
    const h = Police.heli;
    if (h && !h.dead && dist(x, y, h.x, h.y) < r + 12 && owner && owner.kind === 'player') Police.hitHeli(140 * power);
  }

  // ------------------------------------------------------------------ pickups
  const pickups = [];
  function addPickup(kind, x, y, o) {
    const p = Object.assign({ kind, x, y, active: true, t: 0, respawn: 0, amount: 0, w: null, unlock: 0, bob: Math.random() * 6 }, o);
    pickups.push(p);
    return p;
  }
  function updatePickups(dt) {
    const pl = Player.ped;
    LP.prune(pickups, (p) => {
      if (p.life !== undefined && (p.life -= dt) <= 0) return true;
      if (!p.active) { if ((p.t -= dt) <= 0) p.active = true; return false; }
      if (p.unlock > Missions.done) return false;
      if (!pl || pl.dead) return false;
      const r = pl.inCar ? 16 : 10;
      if (Math.abs(pl.x - p.x) > r || Math.abs(pl.y - p.y) > r) return false;
      if (!collect(p)) return false;
      if (p.respawn) { p.active = false; p.t = p.respawn; return false; }
      return true;
    });
  }
  function collect(p) {
    const pl = Player.ped;
    switch (p.kind) {
      case 'weapon': {
        if (Inv.cheat && Inv.owned[p.w] && (Inv.ammo[p.w] || 0) > 600) return false;
        const first = Inv.give(p.w, p.amount || DEF[p.w].pickup);
        Fx.text(p.x, p.y - 8, (first ? '' : '+') + DEF[p.w].name, '#9dff4a');
        if (first && !pl.inCar) Inv.select(p.w);
        GameAudio.sfx('pickup');
        break;
      }
      case 'health':
        if (pl.hp >= pl.maxHp) return false;
        pl.hp = Math.min(pl.maxHp, pl.hp + (p.amount || 40)); Fx.text(p.x, p.y - 8, '+HEALTH', '#ff6a8a'); GameAudio.sfx('health'); break;
      case 'armor':
        if (pl.armor >= 100) return false;
        pl.armor = Math.min(100, pl.armor + (p.amount || 50)); Fx.text(p.x, p.y - 8, '+ARMOR', '#6ab0ff'); GameAudio.sfx('armor'); break;
      case 'bribe':
        if (Police.stars <= 0) return false;
        Police.bribe(); Fx.text(p.x, p.y - 8, 'BRIBE! -1 STAR', '#3ef0ff'); GameAudio.sfx('bribe'); break;
      case 'cash':
        Player.addMoney(p.amount); Fx.text(p.x, p.y - 8, fmtMoney(p.amount), '#9dff4a'); GameAudio.sfx('cash'); break;
      case 'item':
        if (p.onGet) p.onGet(p); GameAudio.sfx('pickup'); break;
    }
    return true;
  }
  function drawPickups(g, camX, camY, time) {
    for (const p of pickups) {
      if (!p.active || p.unlock > Missions.done) continue;
      const x = p.x - camX, y = p.y - camY + Math.sin(time * 4 + p.bob) * 1.5 - 2;
      if (x < -20 || y < -20 || x > G.W + 20 || y > G.H + 20) continue;
      const col = { weapon: '#9dff4a', health: '#ff6a8a', armor: '#6ab0ff', bribe: '#3ef0ff', cash: '#9dff4a', item: '#ffd23e' }[p.kind];
      g.globalCompositeOperation = 'lighter';
      g.drawImage(Lights.glow(col, 14, 0.5), Math.round(x - 14), Math.round(p.y - camY - 14));
      g.globalCompositeOperation = 'source-over';
      const ic = p.kind === 'weapon' ? icon(p.w) : icon(p.kind);
      g.drawImage(ic, Math.round(x - ic.width / 2), Math.round(y - ic.height / 2));
    }
  }

  // ------------------------------------------------------------------ icons (HUD + pickups)
  const icons = {};
  function icon(k) {
    if (icons[k]) return icons[k];
    const c = G.canvas(22, 12), g = c.getContext('2d');
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const D = '#1c1c24', M = '#5a5a68', L = '#9a9aac', WD = '#8a5a2a';
    switch (k) {
      case 'fists':
        G.ellipse(9, 7, 6, 4, '#8a6644', g); G.ellipse(9, 7, 3, 2, '#a88464', g);
        for (let i = 0; i < 3; i++) { R(14, 3 + i * 3, 4, 1, '#f0e6d0'); R(18, 4 + i * 3, 2, 1, '#f0e6d0'); }
        break;
      case 'pistol': R(5, 3, 11, 3, M); R(5, 3, 11, 1, L); R(6, 6, 3, 5, D); R(9, 6, 2, 2, D); R(15, 3, 1, 1, D); break;
      case 'smg': R(3, 3, 15, 4, M); R(3, 3, 15, 1, L); R(9, 7, 2, 4, D); R(5, 7, 3, 3, D); R(18, 4, 3, 1, D); R(1, 4, 2, 2, D); break;
      case 'shotgun': R(1, 4, 7, 4, WD); R(1, 7, 4, 2, WD); R(8, 4, 13, 2, M); R(8, 4, 13, 1, L); R(10, 6, 7, 2, '#6a4020'); break;
      case 'rifle': R(1, 4, 5, 4, D); R(6, 3, 10, 4, M); R(6, 3, 10, 1, L); R(16, 4, 5, 1, D); R(10, 7, 2, 4, D); R(12, 7, 2, 3, D); R(8, 2, 3, 1, D); break;
      case 'flamer': R(1, 2, 6, 8, '#c82828'); R(1, 2, 6, 1, '#ff7070'); R(7, 5, 10, 2, M); R(17, 4, 3, 4, D); R(20, 5, 2, 2, '#ff9020'); break;
      case 'grenade': G.ellipse(11, 7, 4, 4, '#3a6a2a', g); R(9, 5, 4, 1, '#5a9a3a'); R(10, 1, 3, 2, M); R(13, 1, 3, 1, L); break;
      case 'rocket': R(2, 4, 16, 4, '#4a5a2a'); R(2, 4, 16, 1, '#7a8a4a'); R(18, 4, 3, 4, '#c82828'); R(7, 8, 2, 3, D); R(0, 3, 2, 6, D); break;
      case 'health':
        G.ellipse(11, 6, 7, 4, '#2e9a3e', g); R(5, 6, 13, 1, '#1a6a2a'); G.ellipse(9, 4, 2, 1, '#6ae07a', g);
        R(14, 1, 4, 3, '#ff4a6a'); R(13, 2, 6, 1, '#ff4a6a'); R(15, 0, 2, 5, '#ff4a6a');
        break;
      case 'armor': R(6, 1, 10, 10, '#2a5ab0'); R(6, 1, 10, 2, '#6a9ae0'); R(9, 1, 4, 3, '#13306a'); R(7, 9, 8, 1, '#13306a'); break;
      case 'bribe':
        for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; R(Math.round(11 + Math.cos(a) * 4) - 1, Math.round(6 + Math.sin(a) * 4) - 1, 2, 2, '#ffd23e'); }
        G.disc(11, 6, 3, '#ffd23e', g); G.line(5, 11, 17, 1, '#ff3030', g); G.line(5, 10, 17, 0, '#ff3030', g);
        break;
      case 'cash': R(4, 3, 14, 7, '#2e8a3e'); R(5, 4, 12, 5, '#4ab05a'); R(9, 5, 4, 3, '#1e6a2e'); break;
      case 'item': R(4, 3, 14, 8, '#6a4020'); R(4, 3, 14, 2, '#9a6a3a'); R(9, 1, 4, 2, '#3a2010'); R(10, 6, 2, 2, '#ffd23e'); break;
    }
    return (icons[k] = c);
  }

  function draw(g, camX, camY) {
    for (const b of bullets) {
      const x = b.x - camX, y = b.y - camY;
      G.line(x, y, x - b.vx * 0.012, y - b.vy * 0.012, b.pellet ? '#ffd890' : '#fff2b0', g);
    }
    for (const r of rockets) {
      const x = r.x - camX, y = r.y - camY;
      g.fillStyle = '#d8d8e0'; g.fillRect(Math.round(x - 1), Math.round(y - 1), 3, 3);
      g.fillStyle = '#ff4030'; g.fillRect(Math.round(x + Math.cos(r.a) * 2), Math.round(y + Math.sin(r.a) * 2), 1, 1);
    }
    for (const gr of grenades) {
      const x = gr.x - camX, y = gr.y - camY;
      g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(Math.round(x - 1), Math.round(y), 3, 2);
      G.disc(x, y - gr.z * 0.5, 1.5, gr.fuse < 0.4 && Math.floor(gr.fuse * 20) % 2 ? '#ff4040' : '#4a8a3a', g);
    }
  }
  function addLights(camX, camY) {
    for (const r of rockets) Lights.add(r.x - camX, r.y - camY, 30, '#ff9040', 0.7);
    if (flames.length) for (let i = 0; i < flames.length; i += 4) Lights.add(flames[i].x - camX, flames[i].y - camY, 34, '#ff8020', 0.5);
    for (const gr of grenades) if (gr.fuse < 0.4) Lights.add(gr.x - camX, gr.y - camY, 20, '#ff3030', 0.5);
  }
  function clear() { bullets.length = 0; rockets.length = 0; grenades.length = 0; flames.length = 0; }

  return { DEF, ORDER, Inv, fire, update, explode, pickups, addPickup, updatePickups, drawPickups, icon, draw, addLights, clear, bullets, flames };
})();
