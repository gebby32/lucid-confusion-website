/* GAME AUDIO — every sound recipe, all original, all synthesised: pulse waves, a
   triangle bass and filtered noise, the way a 1979 sound board would do it.

   THE MARCH: every formation step plays the next note of a lopsided, limping
   four-beat pattern (low - lower - up - rest... "the sloth plod"). Steps speed up as
   sloths die, so the plod becomes a gallop becomes a panic. It climbs in pitch as the
   formation gets lower, and picks up a nervous high tick when only a few are left.

   A.tone(type, f0, f1, t, dur, vol, { bus, attack, hold, vibrato, depth })
   A.noise(t, dur, vol, { filter, f0, f1, q, bus }) */
'use strict';
const GameAudio = (function () {
  const A = LP.Audio, m = A.midi;
  const seq = (notes, t, type, vol, gap, o) => notes.forEach((n, i) => { if (n) A.tone(type, n, n, t + i * gap, gap * 0.95, vol, o); });
  const now = () => (A.ctx ? A.ctx.currentTime : 0);
  let lastMarch = 0, marchIdx = 0, lastCrunch = 0, lastEnemy = 0;

  // ------------------------------------------------------------------ interface
  A.sound('menu', (t) => A.tone('p25', 1320, 1320, t, 0.04, 0.09));
  A.sound('select', (t) => { A.tone('p25', 990, 990, t, 0.05, 0.11); A.tone('p25', 1480, 1480, t + 0.05, 0.08, 0.11); });
  A.sound('coin', (t) => { A.tone('square', 1568, 1568, t, 0.06, 0.1); A.tone('square', 2093, 2093, t + 0.06, 0.22, 0.1); });
  A.sound('pause', (t) => { A.tone('p25', 880, 880, t, 0.06, 0.11); A.tone('p25', 440, 440, t + 0.07, 0.1, 0.11); });
  A.sound('tick', (t) => A.tone('p25', 2200, 2200, t, 0.025, 0.06));
  A.sound('type', (t) => A.tone('p12', 1760 + Math.random() * 200, 1700, t, 0.02, 0.05));

  // ------------------------------------------------------------------ the penguin
  A.sound('laser', (t) => { A.tone('square', 1900, 240, t, 0.17, 0.08); A.tone('p12', 3400, 800, t, 0.09, 0.035); });
  A.sound('laserDouble', (t) => { A.tone('square', 1700, 220, t, 0.17, 0.07); A.tone('square', 2300, 300, t + 0.01, 0.15, 0.05); });
  A.sound('laserRapid', (t) => A.tone('square', 2400, 500, t, 0.09, 0.07));
  A.sound('laserPierce', (t) => { A.tone('p25', 2600, 180, t, 0.24, 0.08, { vibrato: 40, depth: 300 }); });
  A.sound('playerDie', (t) => {
    A.noise(t, 1.3, 0.55, { f0: 3200, f1: 70 });
    A.tone('square', 420, 40, t, 1.1, 0.14, { vibrato: 11, depth: 40 });
    A.tone('p25', 900, 80, t + 0.05, 0.6, 0.05);
  });
  A.sound('respawn', (t) => seq([m(72), m(79), m(84)], t, 'p25', 0.07, 0.06));

  // ------------------------------------------------------------------ the sloths
  A.sound('ezap', (t) => A.tone('sawtooth', 760, 170, t, 0.13, 0.03));
  A.sound('edrop', (t) => A.tone('triangle', 620, 140, t, 0.14, 0.09));
  A.sound('eneedle', (t) => A.tone('p12', 2600, 1300, t, 0.08, 0.03));
  A.sound('ecomedy', (t) => A.tone('sine', 700, 1500, t, 0.3, 0.06, { vibrato: 14, depth: 90 }));
  A.sound('slothHit', (t) => { A.noise(t, 0.2, 0.42, { f0: 3500, f1: 260 }); A.tone('square', 520, 70, t, 0.16, 0.11); });
  A.sound('cmdHit', (t) => { A.noise(t, 0.28, 0.5, { f0: 3000, f1: 160 }); A.tone('square', 900, 90, t, 0.24, 0.12); A.tone('p25', 1760, 2637, t + 0.05, 0.12, 0.06); });
  A.sound('dive', (t) => A.tone('p25', 1500, 300, t, 0.6, 0.06, { vibrato: 9, depth: 60 }));
  A.sound('wake', (t) => A.tone('square', 300, 1200, t, 0.12, 0.06));
  A.sound('crunch', (t) => A.noise(t, 0.06, 0.14, { filter: 'bandpass', f0: 2400, f1: 900, q: 1.6 }));
  A.sound('clash', (t) => { A.tone('p12', 3000, 2000, t, 0.06, 0.06); A.noise(t, 0.05, 0.12, { filter: 'highpass', f0: 3000 }); });
  A.sound('comedyHit', (t) => { A.tone('sine', 300, 900, t, 0.12, 0.2); A.noise(t, 0.08, 0.2, { filter: 'bandpass', f0: 1200, q: 2 }); });
  A.sound('landed', (t) => {
    for (let i = 0; i < 6; i++) A.tone('square', i % 2 ? 233 : 196, 0, t + i * 0.2, 0.18, 0.1);
    A.noise(t, 1.2, 0.3, { f0: 600, f1: 60 });
  });

  // ------------------------------------------------------------------ THE MARCH ("the sloth plod")
  // per-step notes (semitones above the base); null = a rest, which gives the limp
  const PLOD = [0, -2, 5, null];
  A.sound('plod', (t, o) => {
    const f = m(o.note), d = o.dur, frz = o.freeze;
    A.tone('triangle', f * 1.5, f, t, d, frz ? 0.36 : 0.5, { hold: d * 0.3 });
    A.tone('square', f * 2, f * 1.9, t, d * 0.6, frz ? 0.03 : 0.05);
    A.noise(t, 0.025, 0.06, { filter: 'bandpass', f0: 900, q: 1.5 });
    if (o.nervous) A.tone('p25', f * 8, f * 8, t, 0.03, 0.035);
  });

  // ------------------------------------------------------------------ THE SLOTHERSHIP
  A.sound('shipLoop', (t) => { A.tone('sine', 360, 520, t, 0.34, 0.1, { vibrato: 6, depth: 25 }); A.tone('p12', 720, 1040, t, 0.3, 0.012); });
  A.sound('shipLoopFast', (t) => { A.tone('sine', 900, 1400, t, 0.13, 0.11); A.tone('square', 1800, 2800, t, 0.12, 0.02); });
  A.sound('shipHit', (t) => {
    A.noise(t, 0.5, 0.45, { f0: 3000, f1: 120 });
    seq([m(84), m(80), m(77), m(72), m(68), m(65)], t + 0.05, 'p25', 0.08, 0.05);
  });
  A.sound('lucky', (t) => seq([m(84), m(88), m(91), m(96), m(91), m(96)], t, 'p25', 0.08, 0.06));

  // ------------------------------------------------------------------ pickups + powers
  A.sound('pickup', (t) => seq([m(79), m(83), m(86), m(91)], t, 'p25', 0.09, 0.045));
  A.sound('powerUp', (t) => A.tone('square', 300, 1800, t, 0.3, 0.07));
  A.sound('powerDown', (t) => A.tone('square', 1200, 200, t, 0.3, 0.05));
  A.sound('shieldUp', (t) => A.tone('sine', 400, 1600, t, 0.4, 0.12, { vibrato: 20, depth: 80 }));
  A.sound('shieldHit', (t) => { A.tone('sine', 1600, 300, t, 0.35, 0.18, { vibrato: 30, depth: 120 }); A.noise(t, 0.2, 0.2, { filter: 'highpass', f0: 2000 }); });
  A.sound('freeze', (t) => {
    A.tone('square', 1400, 90, t, 1.2, 0.06, { vibrato: 5, depth: 30 });         // the long yawn
    seq([m(96), m(91), m(88), m(84)], t, 'p12', 0.04, 0.08);
  });
  A.sound('unfreeze', (t) => A.tone('square', 120, 1100, t, 0.35, 0.06));

  // ------------------------------------------------------------------ the boss
  A.sound('bossWarning', (t) => {
    for (let i = 0; i < 8; i++) { A.tone('square', i % 2 ? 622 : 466, 0, t + i * 0.22, 0.2, 0.08); A.tone('p12', i % 2 ? 1244 : 932, 0, t + i * 0.22, 0.2, 0.025); }
  });
  A.sound('bossHull', (t) => A.tone('p12', 1300, 900, t, 0.04, 0.05));
  A.sound('bossShield', (t) => A.tone('sine', 2200, 1400, t, 0.08, 0.08));
  A.sound('podDown', (t) => { A.noise(t, 0.45, 0.5, { f0: 2500, f1: 90 }); A.tone('square', 400, 50, t, 0.4, 0.14); });
  A.sound('shieldDown', (t) => { A.tone('sine', 1800, 120, t, 0.9, 0.16, { vibrato: 18, depth: 160 }); A.noise(t, 0.6, 0.2, { filter: 'bandpass', f0: 3000, f1: 300 }); });
  A.sound('bossBoom', (t) => { A.noise(t, 0.16, 0.35, { f0: 1800 + Math.random() * 1500, f1: 120 }); });
  A.sound('bossDie', (t) => {
    A.noise(t, 1.8, 0.9, { f0: 4000, f1: 40 });
    A.tone('sine', 140, 28, t, 1.4, 0.7);
    A.tone('square', 300, 40, t, 1.0, 0.14, { vibrato: 8, depth: 30 });
  });

  // ------------------------------------------------------------------ jingles
  A.sound('titleJingle', (t) => {
    seq([m(64), m(67), m(71), m(76), 0, m(74), m(71), m(72), m(76), m(79)], t, 'p25', 0.1, 0.09);
    seq([m(40), 0, m(47), 0, m(45), 0, m(43), 0, m(40), 0], t, 'triangle', 0.32, 0.09);
  });
  A.sound('waveStart', (t) => {
    seq([m(67), m(72), m(76), m(79), m(84)], t, 'p25', 0.09, 0.07);
    seq([m(43), 0, m(48), 0, m(55)], t, 'triangle', 0.3, 0.07);
  });
  A.sound('special', (t) => {
    seq([m(72), m(78), m(72), m(78), m(84), m(90)], t, 'p25', 0.09, 0.08, { vibrato: 8, depth: 10 });
    seq([m(42), 0, m(42), 0, m(48), 0], t, 'triangle', 0.3, 0.08);
  });
  A.sound('waveClear', (t) => {
    seq([m(72), m(76), m(79), m(84), 0, m(83), m(84)], t, 'p25', 0.1, 0.08);
    A.tone('p25', m(88), m(88), t + 0.56, 0.5, 0.09, { vibrato: 7, depth: 12 });
    seq([m(48), m(52), m(55), m(60), 0, m(55), m(48)], t, 'triangle', 0.3, 0.08);
  });
  A.sound('extraLife', (t) => seq([m(72), m(76), m(79), m(84), m(88), m(91), m(96), m(100)], t, 'p25', 0.1, 0.05));
  A.sound('gameOver', (t) => {
    seq([m(67), m(66), m(64), m(60), m(59), m(55)], t, 'p25', 0.09, 0.3);
    seq([m(43), m(42), m(40), m(36), m(35), m(31)], t, 'triangle', 0.3, 0.3);
  });
  A.sound('tallyTick', (t) => A.tone('p25', 1760, 1760, t, 0.03, 0.06));
  A.sound('tallyDone', (t) => { A.tone('p25', 1568, 1568, t, 0.05, 0.08); A.tone('p25', 2093, 2093, t + 0.05, 0.12, 0.08); });

  // ------------------------------------------------------------------ music bus: arcade ambience + boss
  // the cabinet hum: a slow, distant, mostly-silent space ambience under the march
  const AMB = [76, 0, 0, 0, 0, 0, 83, 0, 0, 0, 0, 0, 0, 0, 79, 0, 0, 0, 0, 0, 0, 0, 0, 0, 74, 0, 0, 0, 0, 0, 86, 0];
  A.song('ambience', {
    bpm: 66, stepsPerBeat: 2, length: 32,
    step(i, t, dur) {
      if (AMB[i]) A.tone('sine', m(AMB[i]), m(AMB[i]) * 0.998, t, dur * 5, 0.05, { bus: 'music', attack: 0.3, vibrato: 4, depth: 3 });
      if (i % 16 === 0) A.noise(t, dur * 14, 0.035, { filter: 'bandpass', f0: 300, f1: 140, q: 0.7, bus: 'music' });
      if (i % 8 === 0) A.tone('triangle', m(28), m(28), t, dur * 7, 0.07, { bus: 'music', attack: 0.5 });
    }
  });
  const BOSS_BASS = [40, 40, 52, 40, 40, 51, 40, 50, 38, 38, 50, 38, 39, 39, 51, 47];
  const BOSS_LEAD = { 0: 76, 3: 75, 6: 71, 8: 74, 11: 72, 14: 71, 16: 76, 19: 79, 22: 78, 24: 75, 27: 71, 30: 75 };
  A.song('boss', {
    bpm: 148, stepsPerBeat: 4, length: 32,
    step(i, t, dur) {
      const mb = { bus: 'music' };
      if (i % 2 === 0) A.tone('triangle', m(BOSS_BASS[(i >> 1) % 16]), 0, t, dur * 1.8, 0.4, mb);
      if (BOSS_LEAD[i]) A.tone('p25', m(BOSS_LEAD[i]), 0, t, dur * 2.6, 0.06, { bus: 'music', hold: dur * 1.5 });
      if (i % 8 === 0) A.tone('sine', 150, 45, t, 0.1, 0.35, mb);
      if (i % 8 === 4) A.noise(t, 0.07, 0.1, { filter: 'highpass', f0: 2500, bus: 'music' });
      if (i % 2 === 1) A.noise(t, 0.02, 0.035, { filter: 'highpass', f0: 7000, bus: 'music' });
    }
  });

  // demo mode plays quieter, like a cabinet's attract volume
  let atten = 1;
  function setAtten(k) {
    atten = k;
    if (A.ctx) A.sfxBus.gain.setTargetAtTime(A.levels.sfx * k, A.ctx.currentTime, 0.02);
  }
  const _apply = A.applySettings;
  A.applySettings = function () { _apply(); if (A.ctx && atten !== 1) A.sfxBus.gain.setTargetAtTime(A.levels.sfx * atten, A.ctx.currentTime, 0.01); };

  return {
    march(F) {
      const step = PLOD[marchIdx++ % PLOD.length];
      if (step === null) return;
      const t = now();
      if (t - lastMarch < 0.06) return;                     // even a panicking sloth has limits
      lastMarch = t;
      const depth = LP.clamp(Math.floor((F.fy + 60 - Formation.BASE_Y) / 12), 0, 7);
      const freeze = F.freezeT > 0;
      const iv = F.interval();
      A.play('plod', {
        note: (freeze ? 31 : 38) + step + depth,
        dur: LP.clamp(iv / 60 * 0.9, 0.05, 0.16),
        freeze, nervous: !freeze && (F.alive <= 5 || F.alive <= F.N * 0.12)
      });
    },
    resetMarch() { marchIdx = 0; },
    playerShot(power) { A.play(power === 'double' ? 'laserDouble' : power === 'rapid' ? 'laserRapid' : power === 'pierce' ? 'laserPierce' : 'laser'); },
    enemyShot(kind) {
      const t = now();
      if (t - lastEnemy < 0.05) return;
      lastEnemy = t;
      const K = Bullets.KINDS[kind];
      A.play(K.comedy ? 'ecomedy' : kind === 'drop' || kind === 'orb' ? 'edrop' : kind === 'needle' ? 'eneedle' : 'ezap');
    },
    crunch() { const t = now(); if (t - lastCrunch > 0.04) { lastCrunch = t; A.play('crunch'); } },
    shipLoop(fast) { A.play(fast ? 'shipLoopFast' : 'shipLoop'); },
    dive() { A.play('dive'); },
    freeze() { A.play('freeze'); },
    powerUp() { A.play('powerUp'); },
    powerDown() { A.play('powerDown'); },
    shieldUp() { A.play('shieldUp'); },
    bossBoom() { A.play('bossBoom'); },
    bossDie() { A.play('bossDie'); },
    ambience() { A.startMusic('ambience'); },
    bossMusic() { A.startMusic('boss'); },
    attenuate(k) { setAtten(k); }
  };
})();
