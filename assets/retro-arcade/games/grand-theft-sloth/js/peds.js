/* PEDS — the sloths of Lethargy City (and the player's body).
   Skins + sprites baked at 32 angles x 4 walk frames x 3 poses, plus a knocked-out pose.
   Brains: wander the sidewalks (sometimes jaywalk), flee from chaos, dodge cars,
   chase and shoot (cops, SWAT, gangs), follow the player (allies). */
'use strict';
const Peds = (function () {
  const SK = {
    player: { fur: '#8a6644', face: '#f0e2bc', shirt: '#1ec8bc', dots: '#ff6ab0', shades: true, chain: true },
    cop: { fur: '#7a6048', face: '#e8d8b0', shirt: '#2a4aa8', cap: '#16245e', badge: '#ffd23e' },
    swat: { fur: '#6a5040', face: '#e0d0a8', shirt: '#2e2e38', helmet: '#121218', vest: '#454550' },
    green: { fur: '#7a5a3a', face: '#e8d8b0', shirt: '#3cbf3c', bandana: '#16701c' },
    purple: { fur: '#6a5444', face: '#e8d8b0', shirt: '#6a24a8', fedora: '#140c1c', band: '#c080ff' },
    mama: { fur: '#aa9a8c', face: '#f4ead4', shirt: '#ff7ab4', curlers: '#ffe0f0' },
    baron: { fur: '#5e4a3a', face: '#e8d8b0', shirt: '#5a1a7a', tophat: '#1e0a2a', band: '#ffd23e', chain: true },
    dj: { fur: '#8a6a4a', face: '#f0e0b8', shirt: '#ff8a2e', phones: '#ff4fb4' },
    cruller: { fur: '#7a6048', face: '#e8d8b0', shirt: '#2a4aa8', cap: '#e8e8f0', badge: '#ffd23e' },
    terry: { fur: '#6a4a2a', face: '#e0d0a8', shirt: '#1e7a1e', bandana: '#9dff4a', chain: true }
  };
  const CIV = [
    { shirt: '#e05050' }, { shirt: '#f0d040', fur: '#9a7a5a' }, { shirt: '#5080e0', hat: '#f0f0f0' }, { shirt: '#f4f4f4', fur: '#6a5040' },
    { shirt: '#40b080', hat: '#a05020' }, { shirt: '#e080c0', fur: '#a08a70' }, { shirt: '#8060d0' }, { shirt: '#f08030', hat: '#303030' },
    { shirt: '#30a0c0', fur: '#7a6a5a' }, { shirt: '#c0c0c8', hat: '#e04040' }, { shirt: '#a0d040' }, { shirt: '#404048', fur: '#b09878' }
  ];
  CIV.forEach((c, i) => { SK['civ' + i] = Object.assign({ fur: '#8a6e50', face: '#ecdcb4' }, c); });
  const N_A = 32;

  // ------------------------------------------------------------------ sprites
  function drawPed(g, sk, frame, pose) {
    const sh = City.shade, sw = [0, 1.4, 0, -1.4][frame];
    const fur = sk.fur, furD = sh(fur, -0.32);
    const E = (x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
    const line = (x0, y0, x1, y1, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
    // feet
    E(sw * 1.3 - 0.4, -2.1, 1.5, 1.2, furD); E(-sw * 1.3 - 0.4, 2.1, 1.5, 1.2, furD);
    if (pose === 0) {
      line(-1.2 - sw, -4.5, 2.8 + sw * 0.8, -4.6, 2.1, fur); line(-1.2 + sw, 4.5, 2.8 - sw * 0.8, 4.6, 2.1, fur);
      g.fillStyle = '#efe6d0'; g.fillRect(3 + sw * 0.8, -5.2, 1.2, 1.2); g.fillRect(3 - sw * 0.8, 4.1, 1.2, 1.2);
    } else {
      line(-0.5, -4.4, 5.2, -1.3, 2, fur); line(-0.5, 4.4, 5.2, 1.3, 2, fur);
      g.fillStyle = '#1c1c22';
      if (pose === 1) g.fillRect(4.2, -0.9, 4.4, 1.8);
      else { g.fillRect(2.5, -1, 8.5, 2); g.fillStyle = '#3a3a44'; g.fillRect(2.5, -1, 2.5, 2); }
    }
    // body
    E(0, 0, 3.3, 4.5, sh(sk.shirt, -0.25));
    E(0.2, 0, 3, 4.1, sk.shirt);
    if (sk.dots) { g.fillStyle = sk.dots; g.fillRect(-1.5, -2.6, 1, 1); g.fillRect(0.6, 1.8, 1, 1); g.fillRect(-1.8, 1.2, 1, 1); g.fillRect(0.4, -1.2, 1, 1); }
    if (sk.vest) { g.fillStyle = sk.vest; g.fillRect(-2.2, -3, 3.4, 6); }
    if (sk.badge) { g.fillStyle = sk.badge; g.fillRect(1.2, -2.6, 1, 1); }
    if (sk.chain) { g.strokeStyle = '#ffd23e'; g.lineWidth = 0.9; g.beginPath(); g.arc(1.6, 0, 2.3, -1.1, 1.1); g.stroke(); }
    // head
    E(1, 0, 3.1, 3.1, fur);
    E(2.5, 0, 1.4, 2.3, sk.face);
    g.fillStyle = '#3a2614'; g.fillRect(2.5, -1.9, 1.5, 1); g.fillRect(2.5, 0.9, 1.5, 1);
    if (sk.shades) { g.fillStyle = '#0c0c10'; g.fillRect(2.3, -2.2, 1.8, 4.4); g.fillStyle = '#5a6a90'; g.fillRect(3.5, -1.8, 0.7, 1); }
    if (sk.cap) { E(0.4, 0, 2.6, 2.9, sk.cap); g.fillStyle = sh(sk.cap, -0.3); g.fillRect(2.4, -2.2, 1.4, 4.4); if (sk.badge) { g.fillStyle = sk.badge; g.fillRect(1.6, -0.5, 1, 1); } }
    if (sk.helmet) { E(0.6, 0, 3.1, 3.2, sk.helmet); g.fillStyle = '#4a5a70'; g.fillRect(2.6, -1.8, 1, 3.6); }
    if (sk.bandana) { E(0.3, 0, 2.5, 2.8, sk.bandana); g.fillStyle = sk.bandana; g.fillRect(-2.6, -0.6, 1.4, 1.2); }
    if (sk.fedora) { E(0.4, 0, 3.6, 3.6, sk.fedora); E(0.4, 0, 2.2, 2.2, sh(sk.fedora, 0.15)); g.strokeStyle = sk.band; g.lineWidth = 0.8; g.beginPath(); g.arc(0.4, 0, 2.4, 0, Math.PI * 2); g.stroke(); }
    if (sk.tophat) { E(0.4, 0, 3.4, 3.4, sk.tophat); E(0.4, 0, 2.2, 2.2, sh(sk.tophat, 0.2)); g.strokeStyle = sk.band; g.lineWidth = 0.9; g.beginPath(); g.arc(0.4, 0, 2.3, 0, Math.PI * 2); g.stroke(); }
    if (sk.hat) { E(0.3, 0, 2.6, 2.8, sk.hat); g.fillStyle = sh(sk.hat, -0.25); g.fillRect(2.2, -1.8, 1.6, 3.6); }
    if (sk.curlers) { g.fillStyle = sk.curlers; g.fillRect(-1.6, -1.6, 1.4, 1.2); g.fillRect(-1.6, 0.6, 1.4, 1.2); g.fillRect(0, -2.6, 1.4, 1.2); g.fillRect(0, 1.6, 1.4, 1.2); }
    if (sk.phones) { g.strokeStyle = sk.phones; g.lineWidth = 1; g.beginPath(); g.moveTo(0.4, -3.3); g.lineTo(0.4, 3.3); g.stroke(); g.fillStyle = sk.phones; g.fillRect(-0.4, -4, 2, 1.6); g.fillRect(-0.4, 2.4, 2, 1.6); }
  }
  function drawDead(g, sk) {
    const fur = sk.fur, E = (x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
    g.strokeStyle = fur; g.lineWidth = 2; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-1, -2); g.lineTo(1, -7); g.moveTo(-1, 2); g.lineTo(1.5, 7); g.moveTo(-3, -1); g.lineTo(-6.5, -3); g.moveTo(-3, 1); g.lineTo(-6.5, 3.5); g.stroke();
    E(-0.5, 0, 4.4, 3.3, City.shade(sk.shirt, -0.15));
    E(4, 0, 3, 3, fur); E(5, 0, 1.4, 2.2, sk.face);
    g.fillStyle = '#1a1010'; g.fillRect(4.6, -1.6, 1, 1); g.fillRect(4.6, 0.8, 1, 1);
  }
  const cache = new Map();
  function spr(skin, pose, ai, fr) {
    const key = skin + '|' + pose;
    let s = cache.get(key);
    if (!s) { s = []; cache.set(key, s); }
    const k = ai * 4 + fr;
    if (!s[k]) {
      const sk = SK[skin];
      s[k] = pose === 3 ? G.bake(20, 20, ai / N_A * Math.PI * 2, (g) => drawDead(g, sk)) : G.bake(18, 18, ai / N_A * Math.PI * 2, (g) => drawPed(g, sk, fr, pose));
    }
    return s[k];
  }
  const shadowCache = new Map();
  function shadow() { let s = shadowCache.get(1); if (!s) { s = G.make(10, 6, (g) => G.ellipse(5, 3, 4, 2, 'rgba(0,0,0,0.35)', g)); shadowCache.set(1, s); } return s; }

  // ------------------------------------------------------------------ object
  let nextId = 1;
  const HP = { civ: 22, cop: 45, swat: 85, gang: 40, ally: 120, boss: 500, player: 100 };
  function make(kind, skin, x, y, o) {
    o = o || {};
    const p = {
      id: nextId++, kind, skin: skin || 'civ' + Math.floor(Math.random() * CIV.length), x, y, a: o.a || Math.random() * Math.PI * 2,
      vx: 0, vy: 0, r: 4, hp: o.hp || HP[kind] || 30, maxHp: o.hp || HP[kind] || 30, armor: 0,
      state: o.state || 'wander', t: 0, dir: null, weapon: o.weapon || 'fists', fireCD: Math.random(), anim: 0, moving: false,
      faction: o.faction || (kind === 'cop' || kind === 'swat' ? 'police' : kind), hostile: !!o.hostile, dead: false, deadT: 0, gone: false,
      burn: 0, inCar: null, mission: !!o.mission, speed: o.speed || (kind === 'civ' ? LP.rand(26, 36) : 34), flee: null, dodgeT: 0,
      aimA: 0, aggro: o.aggro || 0, label: o.label || null, home: o.home || null, accuracy: o.accuracy || 0.14, range: o.range || 170, knock: 0, tumble: 0
    };
    if (p.kind === 'player') p.speed = 82;
    return p;
  }

  // ------------------------------------------------------------------ movement + collision
  const tmp = [];
  function move(p, dt) {
    p.x += p.vx * dt; p.y += p.vy * dt;
    const r = p.r, T = City.T;
    for (let pass = 0; pass < 2; pass++) {
      const tx0 = Math.floor((p.x - r) / T), tx1 = Math.floor((p.x + r) / T), ty0 = Math.floor((p.y - r) / T), ty1 = Math.floor((p.y + r) / T);
      for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
        if (!City.solidPed(tx, ty)) continue;
        const qx = Math.max(tx * T, Math.min(p.x, tx * T + T)), qy = Math.max(ty * T, Math.min(p.y, ty * T + T));
        let dx = p.x - qx, dy = p.y - qy;
        const d = Math.hypot(dx, dy);
        if (d < 1e-4) { // inside: nudge out towards the tile edge nearest
          const cx = tx * T + 8, cy = ty * T + 8; dx = p.x - cx; dy = p.y - cy;
          if (Math.abs(dx) > Math.abs(dy)) p.x = dx > 0 ? tx * T + T + r : tx * T - r; else p.y = dy > 0 ? ty * T + T + r : ty * T - r;
          continue;
        }
        if (d < r) { p.x += dx / d * (r - d); p.y += dy / d * (r - d); }
      }
    }
    City.propsNear(p.x, p.y, r + 12, tmp);
    for (const q of tmp) {
      if (!q.solid || q.r <= 0) continue;
      const dx = p.x - q.x, dy = p.y - q.y, d = Math.hypot(dx, dy) || 0.01;
      if (d < r + q.r) { p.x += dx / d * (r + q.r - d); p.y += dy / d * (r + q.r - d); }
    }
  }
  const WANDER = (t) => t === City.TL.WALK || t === City.TL.PLAZA || t === City.TL.GRASS || t === City.TL.SAND || t === City.TL.PIER;
  const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  function okAhead(x, y, d, n) { return WANDER(City.tileAtPx(x + d[0] * n, y + d[1] * n)); }

  function wander(p, dt) {
    p.t -= dt;
    if (!p.dir || p.t <= 0) {
      const opts = DIRS.filter((d) => okAhead(p.x, p.y, d, 12) && !(p.dir && d[0] === -p.dir[0] && d[1] === -p.dir[1]));
      p.dir = opts.length ? opts[Math.floor(Math.random() * opts.length)] : DIRS[Math.floor(Math.random() * 4)];
      p.t = LP.rand(3, 9);
    }
    if (p.state === 'cross') {
      p.crossT -= dt;
      if (p.crossT < 0 || (p.crossT < 3.2 && WANDER(City.tileAtPx(p.x, p.y)))) p.state = 'wander';
    } else if (!okAhead(p.x, p.y, p.dir, 9)) {
      const ahead = City.tileAtPx(p.x + p.dir[0] * 9, p.y + p.dir[1] * 9);
      if (ahead === City.TL.ROAD && Math.random() < 0.12) { p.state = 'cross'; p.crossT = 4; }
      else { p.t = 0; p.vx = p.vy = 0; return; }
    }
    p.vx = p.dir[0] * p.speed; p.vy = p.dir[1] * p.speed;
    p.a = Math.atan2(p.vy, p.vx);
  }
  function flee(p, dt) {
    p.t -= dt;
    if (p.t <= 0) { p.state = 'wander'; p.dir = null; return; }
    let ax = p.x - p.flee.x, ay = p.y - p.flee.y;
    const d = Math.hypot(ax, ay) || 1;
    ax /= d; ay /= d;
    // slide round walls
    if (City.solidPed(Math.floor((p.x + ax * 10) / 16), Math.floor((p.y + ay * 10) / 16))) { const s = p.id % 2 ? 1 : -1; const nx = -ay * s, ny = ax * s; ax = nx; ay = ny; }
    const sp = 72 + (p.id % 5) * 4;
    p.vx = ax * sp; p.vy = ay * sp; p.a = Math.atan2(ay, ax);
  }
  function scare(p, x, y, t) {
    if (p.dead || p.kind === 'player' || p.state === 'chase' || p.kind === 'cop' || p.kind === 'swat' || p.hostile || p.kind === 'ally' || p.kind === 'boss') return;
    p.state = 'flee'; p.flee = { x, y }; p.t = t || LP.rand(3, 6);
  }

  // hunters: cops, SWAT, gang members, bosses. Uses World's flow field when the player isn't in sight
  function hunt(p, dt, tgt, opts) {
    const dx = tgt.x - p.x, dy = tgt.y - p.y, d = Math.hypot(dx, dy) || 1;
    p.losT = (p.losT || 0) - dt;
    if (p.losT <= 0) { p.losT = 0.25; p.sees = City.los(p.x, p.y, tgt.x, tgt.y); }
    const shoots = opts.shoot && p.weapon !== 'fists';
    let mx = 0, my = 0, keep = shoots ? 70 + (p.id % 4) * 15 : 0;
    if (p.sees && d < keep) { mx = -dx / d * 0.5; my = -dy / d * 0.5; }
    else if (p.sees && d < 120) { mx = dx / d; my = dy / d; }
    else {
      const f = World.flowDir(p.x, p.y);
      if (f) { mx = f[0]; my = f[1]; } else { mx = dx / d; my = dy / d; }
    }
    if (shoots && p.sees && d < keep + 40) {      // strafe a bit while shooting
      const s = Math.sin(World.time * 1.3 + p.id) * 0.6;
      mx += -dy / d * s; my += dx / d * s;
    }
    const sp = (p.kind === 'swat' ? 70 : 66) * (opts.slow ? 0.6 : 1);
    const m = Math.hypot(mx, my) || 1;
    p.vx = mx / m * sp; p.vy = my / m * sp;
    if (Math.hypot(mx, my) < 0.05) { p.vx = p.vy = 0; }
    p.a = p.sees ? Math.atan2(dy, dx) : Math.atan2(p.vy, p.vx);
    p.aimA = Math.atan2(dy, dx);
    // fire
    p.fireCD -= dt;
    if (shoots && p.sees && d < p.range && p.fireCD <= 0) {
      const W = Weapons.DEF[p.weapon];
      const lead = tgt.vx !== undefined ? 0.12 : 0;
      const ax = tgt.x + (tgt.vx || 0) * lead, ay = tgt.y + (tgt.vy || 0) * lead;
      Weapons.fire(p, Math.atan2(ay - p.y, ax - p.x) + LP.rand(-p.accuracy, p.accuracy), true);
      p.fireCD = W.npcRate || W.rate * 2.2 + LP.rand(0.1, 0.5);
      if (W.burst && Math.random() < 0.7) p.fireCD = W.rate;
    }
    // melee
    if (!shoots && d < 12 && p.fireCD <= 0 && opts.melee) { p.fireCD = 0.8; World.punch(p, tgt); }
    return d;
  }

  // ------------------------------------------------------------------ drawing
  function draw(g, p, camX, camY, time) {
    const x = p.x - camX, y = p.y - camY;
    if (x < -20 || y < -20 || x > G.W + 20 || y > G.H + 20) return;
    if (p.dead) {
      const s = spr(p.skin, 3, Math.round(p.a / (Math.PI * 2) * N_A) & 31 & ~3, 0);
      if (p.deadT > 18) g.globalAlpha = Math.max(0, 1 - (p.deadT - 18) / 2);
      g.drawImage(s, Math.round(x - 10), Math.round(y - 10));
      g.globalAlpha = 1;
      return;
    }
    g.drawImage(shadow(), Math.round(x - 4), Math.round(y - 1));
    const pose = Weapons.DEF[p.weapon].pose || 0;
    const ai = ((Math.round(p.a / (Math.PI * 2) * N_A) % N_A) + N_A) % N_A;
    const fr = p.moving ? (Math.floor(p.anim * 8) % 4) : 0;
    let s = spr(p.skin, pose, ai, fr);
    if (p.flash > 0) s = G.silhouette(s, '#ffffff');
    g.drawImage(s, Math.round(x - 9), Math.round(y - 9 - (p.tumble > 0 ? Math.sin(p.tumble * 9) * 3 : 0)));
  }

  return { SK, CIV, make, move, wander, flee, scare, hunt, draw, spr, N_A, WANDER };
})();
