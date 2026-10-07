/* SCENES — the story between acts, told in short 16-bit cutscenes: a painted stage,
   a few actors, and a typed dialogue box. Confirm / jump advances, Start skips the scene.
   Scenes.play(id, done) runs one; each shot is
     { theme, stage, actors: [{ who, anim, x, y, flip, to: [x, y], speed }], lines: [[name, text]],
       caption, fx, music, fade }
   who: a sloth look ('cub', 'adult', 'king', 'queen', 'luna', 'baby') or a CharArt name. */
'use strict';
const Scenes = (function () {
  const SL = new Set(['cub', 'adult', 'king', 'queen', 'luna', 'baby']);

  // ------------------------------------------------------------------ stages (foregrounds)
  function drawStage(g, kind, theme, t) {
    const R = Themes.T[theme].terrain.ramp, cap = Themes.T[theme].terrain.cap;
    const ground = (y, c0, c1) => { g.fillStyle = c0; g.fillRect(0, y, 320, 300 - y); g.fillStyle = c1; g.fillRect(0, y, 320, 3); };
    switch (kind) {
      case 'rock': {   // the jutting tongue of Slow Rock with the crowd below
        crowd(g, t, theme);
        Px.poly(g, [[-10, 240], [-10, 150], [40, 140], [150, 132], [210, 128], [232, 133], [190, 146], [150, 170], [140, 240]], R[1]);
        Px.poly(g, [[-10, 152], [40, 142], [150, 134], [210, 130], [228, 134], [200, 138], [150, 140], [40, 150], [-10, 160]], R[3]);
        for (let k = 0; k < 6; k++) Px.rect(g, 20 + k * 18, 160 + k * 9, 30, 2, R[0]);
        if (cap) for (let x = 0; x < 200; x += 3) Px.rect(g, x, 136 - x * 0.04, 3, 2, cap[0]);
        break;
      }
      case 'plain': ground(196, R[2], cap ? cap[0] : R[4]); for (let x = 0; x < 320; x += 7) Px.rect(g, x, 199 + (x % 3), 4, 1, R[1]); break;
      case 'gorge': ground(200, R[1], R[3]); Px.poly(g, [[0, 240], [0, 60], [40, 70], [60, 240]], R[0]); Px.poly(g, [[320, 240], [320, 50], [270, 66], [250, 240]], R[0]); break;
      case 'tree': {   // a dead tree above the dusty gorge
        ground(206, R[1], R[3]);
        Px.stroke(g, [[250, 210], [246, 150], [236, 100]], [6, 3], '#3a2418');
        Px.stroke(g, [[244, 140], [200, 118]], 2.6, '#3a2418');
        Px.stroke(g, [[240, 112], [270, 96]], 2, '#3a2418');
        break;
      }
      case 'jungle': ground(200, '#3e2a18', '#4aa83a'); for (let k = 0; k < 9; k++) Px.ellipse(g, k * 40 + 10, 200, 26, 12, k % 2 ? '#1e5a24' : '#2a6a2a'); break;
      case 'night': ground(200, '#1c2038', '#3a8a7a'); for (let k = 0; k < 9; k++) Px.ellipse(g, k * 40 + 10, 202, 26, 10, '#0e1430'); break;
      case 'thorn': ground(198, R[1], cap[0]); for (let k = 0; k < 6; k++) Props.DECOR.thornbush(g, k * 56 + 10, 200); break;
      case 'summit': {
        Px.poly(g, [[-10, 240], [-10, 150], [120, 140], [250, 136], [300, 142], [330, 160], [330, 240]], R[1]);
        Px.rect(g, -10, 146, 340, 3, R[3]);
        break;
      }
      case 'none': break;
    }
  }
  // the animals gathered below Slow Rock (silhouettes, warm-tinted)
  function crowd(g, t, theme) {
    const c = theme === 'final' ? ['#1a0e0e', '#2a1414'] : ['#3a2030', '#4a2838'];
    for (let k = 0; k < 7; k++) {
      const x = 160 + k * 26, y = 222 + (k % 2) * 6, b = Math.sin(t / 20 + k) > 0.6 ? 1 : 0;
      if (k % 3 === 0) { Px.ellipse(g, x, y - 8, 14, 10, c[0]); Px.ellipse(g, x + 12, y - 14, 7, 7, c[0]); Px.stroke(g, [[x + 16, y - 10], [x + 18, y + 2]], 1.2, c[0]); }   // elephant
      else if (k % 3 === 1) { Px.ellipse(g, x, y - 10, 9, 6, c[1]); Px.stroke(g, [[x + 6, y - 12], [x + 10, y - 38 - b]], 1.4, c[1]); Px.ellipse(g, x + 11, y - 40 - b, 3, 2, c[1]); }   // giraffe
      else { Px.ellipse(g, x, y - 6, 9, 5, c[0]); Px.ellipse(g, x + 9, y - 11 - b, 3, 3, c[0]); }   // zebra
    }
    Px.rect(g, 140, 226, 200, 20, c[1]);
  }
  // sun rays fanning from a point
  function rays(g, x, y, t, col) {
    g.save(); g.globalAlpha = 0.18;
    for (let k = 0; k < 9; k++) {
      const a = -Math.PI + k * 0.38 + Math.sin(t / 80) * 0.05;
      Px.poly(g, [[x, y], [x + Math.cos(a - 0.08) * 400, y + Math.sin(a - 0.08) * 400], [x + Math.cos(a + 0.08) * 400, y + Math.sin(a + 0.08) * 400]], col);
    }
    g.restore();
  }
  // the old king's face drawn in the stars
  let starFace = null;
  function starKing(g, t) {
    if (!starFace) {
      // sample the king's head (mane, crown, face) pixel by pixel
      const f = SlothArt.get('king', 'idle', 0), F = SlothArt.FORMS.adult, k = F.k * 1.12;
      const hx = Math.round(f.ax + 1 * k), hy = Math.round(f.ay - 23 * k), R = 18;
      const d = f.c.getContext('2d').getImageData(hx - R, hy - R, R * 2, R * 2).data;
      starFace = [];
      for (let y = 0; y < R * 2; y++) for (let x = 0; x < R * 2; x++) {
        const i = (y * R * 2 + x) * 4;
        if (d[i + 3]) starFace.push([x - R, y - R, (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) / 255]);
      }
    }
    const k = Math.min(1, t / 150);
    for (const [x, y, l] of starFace) {
      const tw = 0.65 + 0.35 * Math.sin(t / 9 + x * 1.7 + y * 2.3);
      const a = k * tw * (0.25 + l * 0.75);
      if (a < 0.08) continue;
      g.globalAlpha = a;
      g.fillStyle = l > 0.6 ? '#ffffff' : l > 0.35 ? '#d0dcff' : '#7a8ad0';
      g.fillRect(150 + x * 3, 64 + y * 3, 2, 2);
    }
    g.globalAlpha = 1;
  }

  // ------------------------------------------------------------------ the script
  const S = {
    intro: [
      { theme: 'savanna', stage: 'plain', music: 'title', caption: 'LONG AGO, IN THE GOLDEN SAVANNA...', fx: 'rays',
        actors: [{ who: 'king', anim: 'idle', x: 130, y: 198 }, { who: 'queen', anim: 'idle', x: 175, y: 198, flip: true }],
        lines: [['', 'THE SLOTHS OF SLOW ROCK RULED THE LAND WITH PATIENCE AND KINDNESS.'], ['', 'KING BRAMBLE AND QUEEN WILLOW HAD WAITED A LONG, LONG TIME FOR THIS MORNING...']] },
      { theme: 'savanna', stage: 'rock', fx: 'rays', actors: [{ who: 'mobo', anim: 'lift', x: 196, y: 132 }, { who: 'baby', anim: 'win', x: 197, y: 92, bob: true }, { who: 'king', anim: 'idle', x: 120, y: 140 }],
        lines: [['MOBO', 'BEHOLD! PRINCE SLOTHBA, FUTURE KING OF SLOW ROCK!']] },
      { theme: 'thorn', stage: 'plain', actors: [{ who: 'malgrim', anim: 'idle', x: 160, y: 200 }],
        lines: [['MALGRIM', 'A PRINCE... HOW TIRESOME. THE THRONE SHOULD HAVE BEEN MINE.'], ['MALGRIM', 'NO MATTER. LITTLE PRINCES HAVE SUCH... ACCIDENTS.']] },
      { theme: 'savanna', stage: 'plain', caption: 'SOME SEASONS LATER...', actors: [{ who: 'king', anim: 'idle', x: 130, y: 198 }, { who: 'cub', anim: 'idle', x: 190, y: 198, flip: true }],
        lines: [['KING BRAMBLE', 'A KING MOVES SLOWLY, SON. BUT HE NEVER STOPS.'], ['SLOTHBA', "I'M GONNA BE THE FASTEST KING EVER!"], ['KING BRAMBLE', 'HA! THEN GO ON - RUN DOWN SLOW ROCK AND SEE OUR KINGDOM.']] }
    ],
    after1: [
      { theme: 'savanna', stage: 'plain', music: 'story', actors: [{ who: 'cub', anim: 'idle', x: 120, y: 198 }, { who: 'malgrim', anim: 'idle', x: 220, y: 198, flip: true }],
        lines: [['MALGRIM', 'WELL DONE, NEPHEW... I MEAN, YOUR HIGHNESS.'], ['MALGRIM', 'BEYOND THE NORTH RIDGE LIE THE BONE BARRENS. ONLY THE BRAVEST CUBS GO THERE.'], ['SLOTHBA', "I'M NOT SCARED OF ANYTHING!"], ['MALGRIM', 'OF COURSE NOT. OFF YOU GO, THEN...']] }
    ],
    after2: [
      { theme: 'bones', stage: 'plain', music: 'title', fx: 'shake', actors: [{ who: 'king', anim: 'roar', x: 110, y: 198 }, { who: 'cub', anim: 'idle', x: 160, y: 198 }, { who: 'hyena', anim: 'run', x: 260, y: 198, to: [380, 198], speed: 3 }],
        lines: [['KING BRAMBLE', 'ROOOAAARRR!!'], ['KING BRAMBLE', 'BEING BRAVE DOES NOT MEAN LOOKING FOR TROUBLE, SLOTHBA.'], ['SLOTHBA', 'SORRY, DAD...'], ['KING BRAMBLE', 'COME HERE, LITTLE ONE. LET US GO HOME.']] }
    ],
    before3: [
      { theme: 'canyon', stage: 'gorge', music: 'story', actors: [{ who: 'cub', anim: 'sit', x: 150, y: 200 }, { who: 'malgrim', anim: 'walk', x: 200, y: 200, to: [360, 200], speed: 1 }],
        lines: [['MALGRIM', 'WAIT HERE IN THE GORGE, LITTLE PRINCE. YOUR FATHER HAS A SURPRISE FOR YOU.'], ['SLOTHBA', 'A SURPRISE? WHAT IS IT?'], ['MALGRIM', "OH... IT'S TO DIE FOR."], ['', '...RUMBLE... RUMBLE...']] }
    ],
    after3: [
      { theme: 'canyon', stage: 'tree', music: 'sad', fx: 'dust', actors: [{ who: 'cub', anim: 'hang', x: 212, y: 152 }, { who: 'king', anim: 'win', x: 160, y: 206 }],
        lines: [['KING BRAMBLE', 'HOLD ON, SON!'], ['', 'THE KING LIFTED HIS SON TO SAFETY... AND THEN THE DUST SWALLOWED HIM.']] },
      { theme: 'canyon', stage: 'gorge', fx: 'dust', caption: 'THE KING WAS LOST IN THE STAMPEDE.', actors: [{ who: 'cub', anim: 'sit', x: 120, y: 200 }, { who: 'malgrim', anim: 'idle', x: 210, y: 200, flip: true }],
        lines: [['MALGRIM', 'WHAT HAVE YOU DONE, BOY? THIS IS ALL YOUR FAULT.'], ['MALGRIM', 'RUN AWAY, SLOTHBA. RUN AWAY... AND NEVER RETURN!']] }
    ],
    after4: [
      { theme: 'thorn', stage: 'thorn', music: 'story', actors: [{ who: 'cub', anim: 'dead', x: 160, y: 200 }, { who: 'vulture', anim: 'fly', x: 120, y: 80, circle: true }],
        lines: [['', 'THE PRINCE WANDERED UNTIL HIS LEGS GAVE OUT.']] },
      { theme: 'jungle', stage: 'jungle', actors: [{ who: 'cub', anim: 'sit', x: 150, y: 200 }, { who: 'dozer', anim: 'stand', x: 210, y: 200, flip: true }, { who: 'toots', anim: 'fly', x: 100, y: 120, bob: true }],
        lines: [['TOOTS', 'HEY, DOZER! THIS ONE IS STILL BREATHING!'], ['DOZER', 'EASY, LITTLE FELLA. NO HURRY, NO WORRY.'], ['TOOTS', "WELCOME TO HUSHWOOD, KID! WHERE NOBODY RUNS FROM ANYTHING... EXCEPT BRUNO."]] }
    ],
    after5: [
      { theme: 'jungle', stage: 'jungle', music: 'montage', actors: [{ who: 'cub', anim: 'win', x: 160, y: 200 }, { who: 'dozer', anim: 'stand', x: 210, y: 200, flip: true }, { who: 'toots', anim: 'fly', x: 100, y: 110, bob: true }],
        lines: [['TOOTS', "BRUNO WON'T BOTHER ANYONE NOW! THE KID IS ONE OF US!"], ['DOZER', 'COME ON - THUNDER FALLS IS THE BEST SPOT TO HANG OUT. LITERALLY.']] }
    ],
    after6: [
      { theme: 'falls', stage: 'jungle', music: 'montage', caption: 'SEASONS PASSED...', actors: [{ who: 'cub', anim: 'run', x: 80, y: 200, to: [180, 200], speed: 0.6 }], lines: [['', 'THE LITTLE PRINCE GREW SLOWLY...']] },
      { theme: 'falls', stage: 'jungle', actors: [{ who: 'adult', anim: 'run', x: 140, y: 200, to: [260, 200], speed: 0.7 }], lines: [['', '...AND STRONG.']] },
      { theme: 'night', stage: 'night', caption: 'SLOTHBA', actors: [{ who: 'adult', anim: 'roar', x: 160, y: 200 }], fx: 'shake', lines: [['', 'BUT FAR AWAY, SLOW ROCK WAS FALLING INTO DARKNESS.']] }
    ],
    after7: [
      { theme: 'night', stage: 'night', music: 'story', actors: [{ who: 'adult', anim: 'idle', x: 130, y: 200 }, { who: 'luna', anim: 'run', x: 300, y: 200, to: [190, 200], speed: 1.4, flip: true }],
        lines: [['LUNA', 'SLOTHBA?! IT REALLY IS YOU! WE ALL THOUGHT YOU WERE GONE!'], ['LUNA', 'MALGRIM LET THE HYENAS TAKE THE KINGDOM. THE SAVANNA IS BURNING. YOU HAVE TO COME HOME!'], ['SLOTHBA', "I CAN'T, LUNA. AFTER WHAT HAPPENED... IT'S BETTER IF I STAY HERE."]] },
      { theme: 'night', stage: 'night', fx: 'starking', actors: [{ who: 'adult', anim: 'lookup', x: 140, y: 200 }, { who: 'mobo', anim: 'stand', x: 210, y: 200, flip: true }],
        lines: [['MOBO', 'YOUR FATHER STILL WALKS WITH YOU, BOY. LOOK UP.'], ['KING BRAMBLE', 'A KING MOVES SLOWLY, MY SON... BUT HE NEVER STOPS.'], ['KING BRAMBLE', 'GO HOME.'], ['SLOTHBA', "I'M COMING HOME, FATHER."]] }
    ],
    after8: [
      { theme: 'cave', stage: 'plain', music: 'story', actors: [{ who: 'adult', anim: 'idle', x: 130, y: 196 }, { who: 'mobo', anim: 'talk', x: 200, y: 196, flip: true }],
        lines: [['MOBO', 'HA! THE QUEEN OF THE DEEP IS NO MORE.'], ['MOBO', 'BEYOND THESE CAVES LIE THE CINDER WASTES. SLOW ROCK STANDS JUST PAST THEM.']] }
    ],
    after9: [
      { theme: 'volcano', stage: 'plain', music: 'story', actors: [{ who: 'adult', anim: 'idle', x: 120, y: 196 }, { who: 'gnash', anim: 'hurt', x: 220, y: 196, flip: true }],
        lines: [['GNASH', 'GRR... MALGRIM WILL... FINISH YOU... UP ON THE ROCK...'], ['SLOTHBA', 'THEN I WILL MEET HIM THERE.']] }
    ],
    before10: [
      { theme: 'final', stage: 'summit', music: 'final', fx: 'fire', actors: [{ who: 'malgrim', anim: 'roar', x: 200, y: 140, flip: true }, { who: 'adult', anim: 'idle', x: 90, y: 146 }],
        lines: [['MALGRIM', 'WELL, WELL. THE LITTLE PRINCE CRAWLS HOME.'], ['SLOTHBA', 'STEP DOWN, MALGRIM. THIS IS MY HOME.'], ['MALGRIM', 'COME AND TAKE IT... IF YOU CAN CLIMB THAT FAR.']] }
    ],
    ending: [
      { theme: 'final', stage: 'summit', music: 'ending', fx: 'rain', actors: [{ who: 'adult', anim: 'roar', x: 190, y: 140 }],
        lines: [['', 'THE RAIN CAME AT LAST, AND THE FIRES OF SLOW ROCK WENT OUT.'], ['', 'SLOTHBA CLIMBED TO THE TIP OF THE ROCK... AND ROARED.']] },
      { theme: 'savanna', stage: 'plain', fx: 'rays', actors: [{ who: 'adult', anim: 'win', x: 120, y: 198 }, { who: 'luna', anim: 'idle', x: 160, y: 198 }, { who: 'toots', anim: 'fly', x: 230, y: 110, bob: true }, { who: 'dozer', anim: 'stand', x: 220, y: 198, flip: true }],
        lines: [['', 'THE ANIMALS RETURNED. THE SAVANNA GREW GREEN AGAIN.'], ['DOZER', 'NO HURRY, NO WORRY... YOUR MAJESTY!']] },
      { theme: 'savanna', stage: 'rock', fx: 'rays', actors: [{ who: 'mobo', anim: 'lift', x: 196, y: 132 }, { who: 'baby', anim: 'win', x: 197, y: 92, bob: true }, { who: 'adult', anim: 'idle', x: 110, y: 140 }, { who: 'luna', anim: 'idle', x: 80, y: 142 }],
        lines: [['MOBO', 'BEHOLD! THE CHILD OF KING SLOTHBA AND QUEEN LUNA!'], ['', 'AND SO THE CIRCLE TURNS - SLOWLY, AS ALL GOOD THINGS DO.']] }
    ],
    gems: [
      { theme: 'night', stage: 'summit', music: 'ending', fx: 'gems', actors: [{ who: 'adult', anim: 'win', x: 160, y: 146 }],
        lines: [['', 'ALL TEN ROYAL GEMS SHINE AGAIN ON THE CROWN OF SLOW ROCK.'], ['', 'A TRUE SLOTH KING MISSES NOTHING - HE SIMPLY TAKES HIS TIME. CONGRATULATIONS!']] }
    ]
  };

  // ------------------------------------------------------------------ player
  const P = { cur: null, shot: 0, line: 0, chars: 0, t: 0, done: null, actors: [], fade: 1, id: '' };
  function startShot() {
    const sh = P.cur[P.shot];
    P.line = 0; P.chars = 0; P.t = 0;
    P.actors = (sh.actors || []).map((a) => Object.assign({ cx: a.x, cy: a.y }, a));
    if (sh.music) LP.Audio.startMusic(sh.music);
    if (sh.fx === 'shake') LP.FX.shake(3, 40);
  }
  function play(id, done) {
    P.cur = S[id]; P.id = id; P.shot = 0; P.done = done; P.fade = 1;
    if (!P.cur) { done(); return; }
    startShot();
    LP.States.go('scene');
  }
  function finish() { const d = P.done; P.done = null; LP.Input.clearPresses(); if (d) d(); }

  function update() {
    const sh = P.cur[P.shot], I = LP.Input;
    P.t++;
    P.fade = Math.max(0, P.fade - 0.06);
    for (const a of P.actors) if (a.to) {
      const dx = a.to[0] - a.cx, dy = a.to[1] - a.cy, d = Math.hypot(dx, dy), sp = a.speed || 1;
      if (d > sp) { a.cx += dx / d * sp; a.cy += dy / d * sp; a.moving = true; } else { a.cx = a.to[0]; a.cy = a.to[1]; a.moving = false; }
    }
    if (I.consume('start')) { I.clearPresses(); finish(); return; }
    const line = sh.lines[P.line] || ['', ''];
    if (P.chars < line[1].length) { P.chars = Math.min(line[1].length, P.chars + 0.75); if (Math.floor(P.chars) % 3 === 0 && line[1][Math.floor(P.chars)] !== ' ') Sfx('text'); }
    if (I.consume('confirm') || I.consume('jump') || I.consume('attack')) {
      if (P.chars < line[1].length) P.chars = line[1].length;
      else if (P.line < sh.lines.length - 1) { P.line++; P.chars = 0; Sfx('move'); }
      else if (P.shot < P.cur.length - 1) { P.shot++; P.fade = 1; startShot(); }
      else finish();
    }
  }
  function render(g) {
    const sh = P.cur[P.shot], t = P.t;
    Themes.drawBackground(g, sh.theme, t * 0.2, 0, 0, t / 60);
    if (sh.fx === 'rays') rays(g, 240, 160, t, '#fff4c0');
    if (sh.fx === 'starking') starKing(g, t);
    const OY = { plain: -32, gorge: -32, tree: -32, jungle: -32, night: -32, thorn: -32 }[sh.stage] || 0;
    g.save(); g.translate(0, OY);
    drawStage(g, sh.stage, sh.theme, t);
    for (const a of P.actors) {
      const sloth = SL.has(a.who);
      let anim = a.anim;
      if (a.moving && (anim === 'idle' || anim === 'walk' || anim === 'run')) anim = sloth ? 'run' : a.who === 'malgrim' ? 'walk' : 'run';
      let x = a.cx, y = a.cy;
      if (a.bob) y += Math.round(Math.sin(t / 12) * 2);
      if (a.circle) { x += Math.cos(t / 40) * 60; y += Math.sin(t / 40) * 14; }
      const fr = sloth ? SlothArt.get(a.who, anim, t >> 3) : CharArt.get(a.who, anim, t >> 3);
      Art.draw(g, fr, x + LP.FX.sx, y + LP.FX.sy, !!a.flip);
    }
    g.restore();
    if (sh.fx === 'dust') { for (let k = 0; k < 40; k++) { g.fillStyle = 'rgba(220,170,110,0.35)'; g.fillRect((k * 53 + t * 3) % 340 - 10, 120 + (k * 29) % 110, 14, 6); } }
    if (sh.fx === 'fire') { for (let x = 0; x < 320; x += 3) { const h = 18 + Math.sin(x * 0.2 + t * 0.2) * 8 + Math.sin(x * 0.05 - t * 0.1) * 10; g.fillStyle = x % 2 ? '#c8300a' : '#ff7a1a'; g.fillRect(x, 240 - h, 3, h); } }
    if (sh.fx === 'rain') { for (let i = 0; i < 70; i++) { const x = ((i * 97) % 360 - t * 2 + 720) % 360 - 20, y = ((i * 61) % 260 + t * 7) % 260 - 10; g.fillStyle = 'rgba(170,200,255,0.7)'; g.fillRect(Math.round(x), Math.round(y), 1, 5); } }
    if (sh.fx === 'gems') for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 + t / 90; Art.draw(g, Ents.itemFrame('gem', (t >> 4) & 1), 160 + Math.cos(a) * 60, 70 + Math.sin(a) * 26); }
    if (sh.caption && P.line === 0) Font.draw(g, sh.caption, 160, 20, '#ffe8a0', { align: 'center', shadow: '#2a1000' });
    // dialogue box
    const line = sh.lines[P.line] || ['', ''];
    const by = 178;
    g.fillStyle = 'rgba(12,6,4,0.88)'; g.fillRect(4, by, 312, 58);
    g.fillStyle = '#c8901a'; g.fillRect(4, by, 312, 1); g.fillRect(4, by + 57, 312, 1); g.fillRect(4, by, 1, 58); g.fillRect(315, by, 1, 58);
    let ty = by + 6;
    if (line[0]) { Font.draw(g, line[0], 12, ty, '#ffd060', { outline: '#000' }); ty += 12; }
    const shown = line[1].slice(0, Math.floor(P.chars));
    Hud.wrap(shown, 37).slice(0, 4).forEach((l, i) => Font.draw(g, l, 12, ty + i * 10, '#fff4e0', { outline: '#000' }));
    if (P.chars >= line[1].length && (t >> 4) % 2) Font.draw(g, '>', 304, by + 46, '#ffd060');
    Font.draw(g, 'START: SKIP', 316, 4, 'rgba(255,255,255,0.5)', { face: 'small', align: 'right' });
    if (P.fade > 0) { g.fillStyle = 'rgba(0,0,0,' + P.fade.toFixed(3) + ')'; g.fillRect(0, 0, 320, 240); }
  }

  LP.States.add({ scene: { update, render } });
  // test helper: jump straight to a shot of a scene
  function jump(id, shot) { play(id, () => LP.States.go('title')); P.shot = Math.min(shot, P.cur.length - 1); P.fade = 0; startShot(); P.chars = 999; }
  return { play, jump, S };
})();
