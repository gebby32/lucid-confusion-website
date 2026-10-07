/* GAME AUDIO — every note and noise is original and generated live (Web Audio).
   Plumbing gives the buses, step sequencer and volume settings; this file owns the
   instruments, the songs, the radio, and the sound of a city falling apart.

   Songs   title    "Grand Theft Sloth"   boom-bap funk in A minor, 92 BPM
           street   "3 AM Stroll"         lo-fi, on foot between jobs
           mission  "Two-Toes Means Business"  tense minor groove, on-foot missions
           chase    "Hot Pursuit"         breakbeat siren-chaser, 3+ badges
           radio0   KSLO 88.1 SLOW JAMZ   smooth funk
           radio1   NEON 104              synthwave electro
           radio2   RADIO TRES DEDOS      tropical dembow
           ending   "Nap Time"            the ending
   Continuous: the player's engine + tyre squeal, police sirens, the chopper. */
'use strict';
const GameAudio = (function () {
  const A = LP.Audio;
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const midiOf = (tok) => { const r = /^([A-G])([#b]?)(-?\d)$/.exec(tok); if (!r) return null; return 12 * (+r[3] + 1) + NOTE[r[1]] + (r[2] === '#' ? 1 : r[2] === 'b' ? -1 : 0); };
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  let GR = null;
  function graph() {
    if (GR && GR.ctx === A.ctx) return GR;
    if (!A.ctx) return null;
    const c = A.ctx;
    const musicIn = c.createGain(); musicIn.connect(A.musicBus);
    const delay = c.createDelay(1.0), fb = c.createGain(), wet = c.createGain(), lp = c.createBiquadFilter();
    delay.delayTime.value = 0.32; fb.gain.value = 0.28; wet.gain.value = 0.18; lp.type = 'lowpass'; lp.frequency.value = 2400;
    musicIn.connect(delay); delay.connect(lp); lp.connect(fb); fb.connect(delay); lp.connect(wet); wet.connect(A.musicBus);
    // the radio filter: a band-limited "car speaker" for stations
    GR = { ctx: c, musicIn, delay };
    return GR;
  }
  function voice(type, f, t, dur, vol, o) {
    const g0 = graph(); if (!g0) return;
    const c = A.ctx; o = o || {};
    const out = o.bus === 'sfx' ? (o.dest || A.sfxBus) : g0.musicIn;
    const amp = c.createGain(), filt = c.createBiquadFilter();
    filt.type = o.ftype || 'lowpass'; filt.Q.value = o.q || 1;
    const cut = o.cutoff || 3000, env = o.env || 0;
    filt.frequency.setValueAtTime(cut + env, t);
    if (env) filt.frequency.exponentialRampToValueAtTime(Math.max(60, cut), t + (o.decay || 0.15));
    const a = o.attack || 0.005, rel = o.release || 0.06, sus = o.sustain === undefined ? 1 : o.sustain;
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.linearRampToValueAtTime(vol, t + a);
    if (sus < 1) amp.gain.exponentialRampToValueAtTime(Math.max(0.0005, vol * sus), t + a + (o.decay || 0.15));
    amp.gain.setValueAtTime(Math.max(0.0005, vol * sus), t + Math.max(a, dur));
    amp.gain.exponentialRampToValueAtTime(0.0005, t + dur + rel);
    filt.connect(amp); amp.connect(out);
    const dets = o.detune ? [-o.detune, o.detune] : [0];
    for (const d of dets) {
      const s = c.createOscillator();
      if (A.waves[type]) s.setPeriodicWave(A.waves[type]); else s.type = type;
      s.frequency.setValueAtTime(f, t);
      if (o.slide) s.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + (o.slideT || dur));
      s.detune.value = d;
      if (o.vib) {
        const l = c.createOscillator(), lg = c.createGain();
        l.frequency.value = o.vib; lg.gain.value = f * (o.vibDepth || 0.012);
        l.connect(lg); lg.connect(s.frequency); l.start(t); l.stop(t + dur + rel + 0.05);
      }
      s.connect(filt); s.start(t); s.stop(t + dur + rel + 0.05);
    }
  }
  function noiseHit(t, dur, vol, o) {
    const g0 = graph(); if (!g0) return;
    const c = A.ctx; o = o || {};
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = A.noiseBuf; s.loop = true; s.playbackRate.value = o.rate || 1;
    s.loopStart = Math.random() * 0.5;
    f.type = o.filter || 'highpass'; f.frequency.setValueAtTime(o.f0 || 6000, t); f.Q.value = o.q || 0.7;
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + dur);
    g.gain.setValueAtTime(vol, t);
    if (o.gate) { g.gain.setValueAtTime(vol * 0.7, t + dur * 0.8); g.gain.linearRampToValueAtTime(0.0005, t + dur); }
    else g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    s.connect(f); f.connect(g); g.connect(o.bus === 'sfx' ? (o.dest || A.sfxBus) : g0.musicIn);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }

  // ---------------------------------------------------------------- drums
  function drum(d, t, v) {
    switch (d) {
      case 'k': voice('sine', 140, t, 0.16, 0.95 * v, { slide: 40, release: 0.05 }); noiseHit(t, 0.012, 0.2 * v, { f0: 2500 }); break;
      case 'K': voice('sine', 110, t, 0.3, 1.0 * v, { slide: 32, release: 0.1 }); voice('square', 55, t, 0.12, 0.12 * v, { cutoff: 300 }); break;     // 808-ish boom
      case 's': noiseHit(t, 0.18, 0.4 * v, { filter: 'bandpass', f0: 1700, q: 0.6, gate: true }); voice('triangle', 200, t, 0.07, 0.3 * v, { slide: 140 }); break;
      case 'c': for (let i = 0; i < 3; i++) noiseHit(t + i * 0.012, 0.09, 0.26 * v, { filter: 'bandpass', f0: 1300, q: 1.2 }); break;
      case 'r': noiseHit(t, 0.05, 0.2 * v, { filter: 'bandpass', f0: 2500, q: 1.5 }); voice('triangle', 1600, t, 0.02, 0.1 * v); break;           // rim
      case 'h': noiseHit(t, 0.03, 0.11 * v, { f0: 8000 }); break;
      case 'o': noiseHit(t, 0.16, 0.09 * v, { f0: 7000 }); break;
      case 'p': voice('sine', 520, t, 0.08, 0.25 * v, { slide: 380 }); break;          // conga-ish
      case 'P': voice('sine', 360, t, 0.1, 0.25 * v, { slide: 260 }); break;
      case 'x': noiseHit(t, 0.9, 0.14 * v, { f0: 5000, f1: 3000 }); break;
    }
  }
  const DR = {
    boom: { k: 'x.........x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.xx', o: '' },
    boomF: { k: 'x.........x..x..', s: '....x.......x.xx', h: 'x.x.x.x.x.x.....', c: '' },
    lofi: { k: 'x......x..x.....', r: '....x.......x...', h: '..x...x...x...x.' },
    tense: { k: 'x..x..x...x..x..', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx' },
    tenseF: { k: 'x..x..x...x..x..', s: '....x.......x.xx', h: 'xxxxxxxxxxxx....' },
    dnb: { k: 'x.........x.....', s: '....x..x.x..x...', h: 'x.xxx.xxx.xxx.xx', o: '..............x.' },
    dnbF: { k: 'x.......x.x.....', s: '....x.x.x.xxxxxx', h: 'x.x.x.x.........' },
    funk: { k: 'x..x......x.....', s: '....x..x....x...', h: 'xxxxxxxxxxxxxxxx' },
    funkF: { k: 'x..x......x.....', s: '....x..x..x.xxxx', h: 'xxxxxxxxxx......' },
    wave: { k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.', c: '............x...' },
    waveF: { k: 'x...x...x...x...', s: '....x.......xxxx', h: '..x...x...x.....' },
    dem: { K: 'x...x...x...x...', r: '...x..x....x..x.', h: 'x.x.x.x.x.x.x.x.', p: '......x.......x.', P: '..x.......x.....' },
    demF: { K: 'x...x...x...x...', r: '...x..x.x.x.xxxx', h: 'x.x.x.x.x.x.....' },
    calm: { k: 'x.........x.....', s: '....x.......x...', h: '..x...x...x...x.' },
    none: {}
  };
  const QUAL = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], m9: [0, 3, 7, 10, 14], sus4: [0, 5, 7], dim: [0, 3, 6] };
  function chord(sym) {
    const r = /^([A-G])([#b]?)(.*)$/.exec(sym);
    return { root: NOTE[r[1]] + (r[2] === '#' ? 1 : r[2] === 'b' ? -1 : 0), iv: QUAL[r[3]] || QUAL[''] };
  }
  const BASS = {
    funk: 'R . . R O . R . . R . 5 . O 7 .',
    boom: 'R - - . . . R . . . 5 - . 7 . .',
    lofi: 'R - - - - - . . 5 - - - . . . .',
    pump: 'R . R . R . R . R . R . R . R .',
    octave: 'R . O . R . O . R . O . R . O .',
    roll: 'R R . R R . R . R R . R O . 5 .',
    dem: 'R - - R - - . . R - - R - - 5 .',
    calm: 'R - - - - - - - 5 - - - - - - .'
  };
  function compile(name, def) {
    const steps = [];
    def.bars.forEach((bar) => {
      const [ch, lead, dr] = bar;
      const halves = ch.split('/').map(chord);
      const toks = lead.trim().split(/\s+/);
      const bt = BASS[def.bass].split(/\s+/);
      for (let i = 0; i < 16; i++) {
        const C = halves.length > 1 && i >= 8 ? halves[1] : halves[0];
        const st = { chord: C, first: i === 0 || (halves.length > 1 && i === 8), padLen: halves.length > 1 ? 8 : 16, drums: [] };
        const n = midiOf(toks[i]);
        if (n !== null) { let len = 1; while (toks[i + len] === '-') len++; st.lead = { n, len }; }
        const b = bt[i];
        if (b !== '.' && b !== '-') {
          let len = 1; while (bt[i + len] === '-') len++;
          const base = (def.bassOct || 36) + C.root;
          st.bass = { n: b === 'O' ? base + 12 : b === '5' ? base + 7 : b === '7' ? base + (C.iv[3] || 10) : base, len };
        }
        const D = DR[dr || def.drums] || {};
        for (const k in D) if (D[k][i] === 'x') st.drums.push(k);
        steps.push(st);
      }
    });
    const v = def.vol || 1;
    A.song(name, {
      bpm: def.bpm, stepsPerBeat: 4, length: steps.length,
      step(i, t, dur) {
        const s = steps[i];
        if (def.swing && i % 2 === 1) t += dur * def.swing;
        if (s.lead && !def.noLead) {
          const f = hz(s.lead.n), Ld = s.lead.len * dur;
          voice(def.leadType || 'square', f, t, Ld * 0.9, 0.1 * v * (def.leadVol || 1), { cutoff: def.leadCut || 2400, env: 1600, decay: 0.2, detune: def.leadDet === undefined ? 7 : def.leadDet, vib: Ld > 0.3 ? 5.5 : 0, sustain: 0.7, release: 0.08 });
          if (def.leadOct) voice('p25', f * 2, t, Ld * 0.85, 0.028 * v, { cutoff: 4000, sustain: 0.6 });
        }
        if (s.bass) voice(def.bassType || 'sawtooth', hz(s.bass.n), t, s.bass.len * dur * 0.85, 0.22 * v * (def.bassVol || 1), { cutoff: def.bassCut || 300, env: 900, decay: 0.12, q: 4, sustain: 0.6, release: 0.04 });
        if (s.first && def.pad) {
          const barDur = s.padLen * dur;
          for (const iv of s.chord.iv.slice(0, 4)) {
            const m = 60 + ((s.chord.root + iv) % 12) - (((s.chord.root + iv) % 12) > 7 ? 12 : 0);
            voice(def.padType || 'sawtooth', hz(m), t, barDur * 0.95, 0.03 * v * (def.padVol || 1), { cutoff: def.padCut || 1100, detune: 12, attack: 0.08, release: 0.3 });
          }
        }
        if (def.stabs && def.stabs.includes(i % 16)) {
          for (const iv of s.chord.iv.slice(0, 3)) voice(def.stabType || 'square', hz(60 + ((s.chord.root + iv) % 12)), t, dur * 0.8, 0.024 * v, { cutoff: 1900, release: 0.03 });
        }
        if (def.keys && (i % 16 === 0 || i % 16 === 3 || i % 16 === 10)) {
          for (const iv of s.chord.iv.slice(0, 4)) voice('triangle', hz(60 + ((s.chord.root + iv) % 12)), t, dur * 2.5, 0.03 * v, { cutoff: 2400, release: 0.2, sustain: 0.4, decay: 0.3 });
        }
        if (def.arp) {
          const iv = s.chord.iv, k = i % 4 === 3 ? 12 : iv[i % iv.length];
          voice('p12', hz(72 + s.chord.root % 12 + k), t, dur * 0.6, 0.024 * v, { cutoff: 3500 });
        }
        if (def.siren && i % 32 === 0) { voice('triangle', 880, t, dur * 7, 0.025 * v, { slide: 660, slideT: dur * 7 }); voice('triangle', 660, t + dur * 8, dur * 7, 0.025 * v, { slide: 880, slideT: dur * 7 }); }
        for (const d of s.drums) drum(d, t, v * (def.drumVol || 1));
      }
    });
  }

  // ---------------------------------------------------------------- THE SONGS (all original)
  compile('title', {
    bpm: 92, bass: 'boom', bassType: 'square', bassCut: 380, pad: true, padCut: 900, drums: 'boom', leadType: 'sawtooth', leadCut: 1800, swing: 0.12, stabs: [6, 14], keys: true,
    bars: [
      ['Am7', 'A4 - - . C5 - E5 . G5 - - - E5 - D5 -'],
      ['Dm7', 'C5 - - - A4 - - - . . D5 . F5 . A5 .'],
      ['Fmaj7', 'G5 - - . F5 - E5 . F5 - - - E5 - C5 -'],
      ['E7', 'B4 - - - - - - - G#4 . B4 . D5 . E5 .', 'boomF'],
      ['Am7', 'A5 - - . G5 - E5 . G5 - - - A5 - C6 -'],
      ['Dm7', 'A5 - - - F5 - - - D5 . F5 . A5 . C6 .'],
      ['Fmaj7', 'C6 - - . B5 - A5 . G5 - - - F5 - E5 -'],
      ['E7', 'E5 - - - - - - - . . . . E4 . . .', 'boomF']
    ]
  });
  compile('street', {
    bpm: 82, bass: 'lofi', bassType: 'triangle', bassCut: 500, bassVol: 1.4, pad: true, padType: 'triangle', padCut: 1400, padVol: 1.4, drums: 'lofi', leadType: 'triangle', leadCut: 1600, leadDet: 0, swing: 0.16, vol: 0.75, keys: true,
    bars: [
      ['Dm9', 'F5 - - - E5 - - - . . . . . . . .'],
      ['G7', '. . . . D5 - - - B4 - - - . . . .'],
      ['Cmaj7', 'E5 - - - - - G5 - - - . . . . . .'],
      ['Am7', '. . . . . . C5 - - - E5 - D5 - - -'],
      ['Dm9', 'A5 - - - G5 - - - F5 - - - . . . .'],
      ['G7', '. . . . F5 - - - D5 - - - B4 - . .'],
      ['Cmaj7', 'C5 - - - - - - - . . . . . . . .'],
      ['Am7', '. . . . . . . . E5 - - - . . . .']
    ]
  });
  compile('mission', {
    bpm: 112, bass: 'roll', bassCut: 420, pad: true, padCut: 800, drums: 'tense', leadType: 'p25', leadCut: 2600, stabs: [3, 11], vol: 0.95,
    bars: [
      ['Em', 'E5 - . E5 . G5 - - F#5 - E5 - . . . .'],
      ['Em', '. . . . B4 - . B4 . D5 - - E5 - . .'],
      ['C', 'G5 - . G5 . A5 - - G5 - E5 - . . . .'],
      ['B7', 'F#5 - - - - - D#5 - - - B4 - - - . .', 'tenseF'],
      ['Em', 'E5 - . E5 . G5 - - B5 - A5 - G5 - . .'],
      ['Am', 'A5 - . A5 . C6 - - B5 - A5 - . . . .'],
      ['C', 'G5 - - - E5 - - - C5 - D5 - E5 - . .'],
      ['B7', 'D#5 - - - F#5 - - - B5 - - - - - . .', 'tenseF']
    ]
  });
  compile('chase', {
    bpm: 150, bass: 'octave', bassCut: 520, pad: true, padCut: 900, drums: 'dnb', leadType: 'sawtooth', leadCut: 2800, arp: true, siren: true, leadOct: true,
    bars: [
      ['Dm', 'D5 - D5 - F5 - A5 - G5 - F5 - E5 - D5 -'],
      ['Bb', 'D5 - - - - - F5 - - - Bb5 - - - A5 -'],
      ['C', 'G5 - - - E5 - - - C5 - E5 - G5 - C6 -'],
      ['A7', 'A5 - - - - - - - C#5 - E5 - G5 - A5 -', 'dnbF'],
      ['Dm', 'F5 - D5 - F5 - A5 - D6 - - - C6 - A5 -'],
      ['Bb', 'Bb5 - - - A5 - - - F5 - - - D5 - - -'],
      ['Gm', 'G5 - - - Bb5 - - - D6 - - - C6 - Bb5 -'],
      ['A7', 'A5 - - - - - - - E5 - G5 - A5 - C#6 -', 'dnbF']
    ]
  });
  compile('radio0', {        // KSLO 88.1 SLOW JAMZ
    bpm: 98, bass: 'funk', bassCut: 360, pad: true, padCut: 1000, drums: 'funk', leadType: 'p25', stabs: [6, 14], keys: true, swing: 0.08,
    bars: [
      ['Gm7', 'D5 - - C5 - - Bb4 - G4 - - - - - F4 -'],
      ['C7', 'G4 - - - Bb4 - - D5 - - C5 - Bb4 - - -'],
      ['Fmaj7', 'A4 - - - - - C5 - E5 - - - D5 - C5 -'],
      ['Dm7', 'A4 - - - - - - - . . F5 . E5 . D5 .', 'funkF'],
      ['Gm7', 'Bb5 - - A5 - - G5 - D5 - - - - - Bb4 -'],
      ['C7', 'C5 - - - E5 - - G5 - - Bb5 - A5 - G5 -'],
      ['Fmaj7', 'A5 - - - - - G5 - F5 - - - E5 - C5 -'],
      ['D7', 'F#5 - - - - - - - A5 . C6 . D6 . . .', 'funkF']
    ]
  });
  compile('radio1', {        // NEON 104
    bpm: 124, bass: 'octave', pad: true, arp: true, drums: 'wave', leadCut: 3000,
    bars: [
      ['Fm', 'F4 . . F4 Ab4 . C5 . F5 - - - Eb5 - C5 -'],
      ['Db', 'Db5 - - - - - C5 - Ab4 - - - F4 - Ab4 -'],
      ['Ab', 'Eb5 - - - - - C5 - Eb5 - - - Ab5 - G5 -'],
      ['Eb', 'G5 - - - - - - - Eb5 . F5 . G5 . Bb5 .', 'waveF'],
      ['Fm', 'C6 - - - - - Bb5 - Ab5 - - - G5 - F5 -'],
      ['Db', 'F5 - - - - - Eb5 - Db5 - - - C5 - Db5 -'],
      ['Eb', 'Eb5 - - - - - Db5 - Bb4 - - - G4 - Bb4 -'],
      ['C', 'C5 - - - - - - - E5 - - - G5 - - -', 'waveF']
    ]
  });
  compile('radio2', {        // RADIO TRES DEDOS
    bpm: 96, bass: 'dem', bassType: 'square', bassCut: 420, pad: true, padType: 'triangle', padCut: 1600, drums: 'dem', leadType: 'triangle', leadCut: 3000, leadDet: 0, stabs: [3, 6, 11, 14], stabType: 'triangle',
    bars: [
      ['Am', 'E5 - E5 . C5 . E5 - G5 - - . E5 - - .'],
      ['F', 'F5 - F5 . C5 . F5 - A5 - - . G5 - - .'],
      ['C', 'G5 - G5 . E5 . G5 - C6 - - . B5 - A5 .'],
      ['G', 'B5 - - - - - G5 - D5 - - - . . . .', 'demF'],
      ['Am', 'A5 - - . G5 . E5 - C5 - - . D5 - E5 .'],
      ['F', 'A5 - - . G5 . F5 - C5 - - . D5 - F5 .'],
      ['C', 'E5 - - . G5 . C6 - B5 - - . G5 - E5 .'],
      ['E7', 'G#5 - - - - - E5 - B4 - - - . . . .', 'demF']
    ]
  });
  compile('ending', {
    bpm: 88, bass: 'calm', pad: true, padCut: 1200, arp: true, drums: 'calm', leadType: 'p25', keys: true,
    bars: [
      ['Fmaj7', 'A5 - - - - - G5 - E5 - - - C5 - - -'],
      ['G', 'D5 - - - - - - - . . B4 . D5 . G5 .'],
      ['Em7', 'G5 - - - - - E5 - B4 - - - D5 - - -'],
      ['Am', 'C5 - - - - - - - . . A4 . C5 . E5 .'],
      ['Dm7', 'F5 - - - - - E5 - D5 - - - A5 - - -'],
      ['G', 'G5 - - - - - F5 - D5 - - - B4 - - -'],
      ['Cmaj7', 'E5 - - - - - - - G5 - - - B5 - - -'],
      ['C', 'C6 - - - - - - - - - - - . . . .']
    ]
  });
  A.song('quiet', { bpm: 60, length: 16, step() {} });

  // ---------------------------------------------------------------- sound effects
  const S = (name, fn) => A.sound(name, (t, o) => { if (graph()) fn(t, o || {}); });
  const blip = (f, t, d, v, type) => voice(type || 'square', f, t, d, v, { bus: 'sfx', cutoff: 5000, release: 0.03 });
  const SX = (o) => Object.assign({ bus: 'sfx' }, o);
  S('menu', (t) => blip(1320, t, 0.04, 0.1));
  S('select', (t) => { blip(880, t, 0.05, 0.12); blip(1760, t + 0.06, 0.09, 0.12); });
  S('back', (t) => { blip(990, t, 0.05, 0.1); blip(660, t + 0.06, 0.07, 0.1); });
  S('start', (t) => { voice('sawtooth', 110, t, 0.6, 0.2, SX({ slide: 880, cutoff: 600, env: 3000, decay: 0.5 })); [440, 554, 659, 880].forEach((f, i) => blip(f, t + 0.35 + i * 0.07, 0.25, 0.1)); });
  S('pistol', (t, o) => { const v = o.v || 1; noiseHit(t, 0.14, 0.55 * v, SX({ filter: 'lowpass', f0: 4000, f1: 300 })); voice('square', 180, t, 0.07, 0.25 * v, SX({ slide: 60, cutoff: 1500 })); });
  S('smg', (t, o) => { const v = o.v || 1; noiseHit(t, 0.07, 0.42 * v, SX({ filter: 'lowpass', f0: 5000, f1: 500 })); voice('square', 220, t, 0.04, 0.16 * v, SX({ slide: 90, cutoff: 1800 })); });
  S('rifle', (t, o) => { const v = o.v || 1; noiseHit(t, 0.11, 0.55 * v, SX({ filter: 'lowpass', f0: 6000, f1: 400 })); voice('sawtooth', 150, t, 0.06, 0.22 * v, SX({ slide: 50, cutoff: 1200 })); });
  S('shotgun', (t, o) => { const v = o.v || 1; noiseHit(t, 0.32, 0.8 * v, SX({ filter: 'lowpass', f0: 3000, f1: 150 })); voice('square', 90, t, 0.14, 0.32 * v, SX({ slide: 35, cutoff: 800 })); noiseHit(t + 0.32, 0.05, 0.12 * v, SX({ filter: 'bandpass', f0: 2500 })); noiseHit(t + 0.42, 0.05, 0.12 * v, SX({ filter: 'bandpass', f0: 2000 })); });
  S('rocket', (t) => { noiseHit(t, 0.7, 0.5, SX({ filter: 'bandpass', f0: 400, f1: 2500, q: 0.8 })); voice('sawtooth', 70, t, 0.3, 0.2, SX({ slide: 160, cutoff: 900 })); });
  S('throw', (t) => { noiseHit(t, 0.18, 0.2, SX({ filter: 'bandpass', f0: 800, f1: 2400, q: 1 })); });
  S('flame', (t, o) => noiseHit(t, 0.09, 0.26 * (o.v || 1), SX({ filter: 'bandpass', f0: 700, q: 0.5, rate: 0.6 })));
  S('boom', (t, o) => {
    const v = o.v || 1;
    noiseHit(t, 1.4, 0.9 * v, SX({ filter: 'lowpass', f0: 2200, f1: 60 }));
    voice('sine', 90, t, 0.7, 0.8 * v, SX({ slide: 28 }));
    voice('square', 60, t, 0.3, 0.2 * v, SX({ slide: 30, cutoff: 400 }));
    noiseHit(t + 0.05, 0.8, 0.25 * v, SX({ filter: 'bandpass', f0: 600, f1: 150 }));
  });
  S('crash', (t, o) => {
    const v = o.v || 1;
    noiseHit(t, 0.35 + v * 0.3, 0.6 * v, SX({ filter: 'lowpass', f0: 2600, f1: 140 }));
    voice('square', 120, t, 0.12, 0.2 * v, SX({ slide: 45, cutoff: 700 }));
    if (v > 0.6) [700, 1150, 1750].forEach((f, i) => voice('triangle', f, t + 0.02 + i * 0.04, 0.22, 0.06 * v, SX({ slide: f * 0.88 })));
  });
  S('ping', (t, o) => voice('triangle', 1800 + Math.random() * 800, t, 0.06, 0.08 * (o.v || 1), SX({ slide: 1400 })));
  S('switch', (t) => { blip(600, t, 0.03, 0.08, 'p25'); blip(900, t + 0.04, 0.03, 0.08, 'p25'); });
  S('reload', (t) => { noiseHit(t, 0.05, 0.2, SX({ filter: 'bandpass', f0: 1500 })); noiseHit(t + 0.15, 0.05, 0.2, SX({ filter: 'bandpass', f0: 2200 })); });
  S('reloaded', (t) => { noiseHit(t, 0.04, 0.25, SX({ filter: 'bandpass', f0: 3000 })); blip(1200, t + 0.03, 0.03, 0.06); });
  S('click', (t) => noiseHit(t, 0.03, 0.2, SX({ filter: 'bandpass', f0: 3500 })));
  S('pickup', (t) => { [72, 76, 79, 84].forEach((m, i) => blip(hz(m), t + i * 0.05, 0.07, 0.1, 'p25')); });
  S('health', (t) => { [67, 72, 76, 79].forEach((m, i) => blip(hz(m), t + i * 0.06, 0.1, 0.1, 'triangle')); });
  S('armor', (t) => { [60, 67, 72].forEach((m, i) => blip(hz(m), t + i * 0.06, 0.1, 0.12, 'square')); });
  S('bribe', (t) => { [84, 79, 76, 72].forEach((m, i) => blip(hz(m), t + i * 0.05, 0.08, 0.1, 'p25')); });
  S('cash', (t) => { blip(1568, t, 0.05, 0.1, 'square'); blip(2093, t + 0.06, 0.12, 0.1, 'square'); });
  S('star', (t) => { blip(988, t, 0.08, 0.12, 'square'); blip(740, t + 0.1, 0.12, 0.12, 'square'); });
  S('lost', (t) => { [79, 76, 79, 84].forEach((m, i) => blip(hz(m), t + i * 0.08, 0.1, 0.1, 'p25')); });
  S('oof', (t, o) => { const v = o.v || 1, f = 200 + Math.random() * 140; voice('square', f, t, 0.16, 0.14 * v, SX({ slide: f * 0.55, cutoff: 1200, vib: 30, vibDepth: 0.05 })); noiseHit(t, 0.08, 0.2 * v, SX({ filter: 'lowpass', f0: 1200 })); });
  S('wasted', (t) => { voice('square', 300, t, 0.6, 0.18, SX({ slide: 70, cutoff: 1400, vib: 8, vibDepth: 0.04 })); });
  S('splat', (t, o) => { noiseHit(t, 0.12, 0.45 * (o.v || 1), SX({ filter: 'lowpass', f0: 900, f1: 200 })); voice('sine', 160, t, 0.1, 0.3 * (o.v || 1), SX({ slide: 60 })); });
  S('swipe', (t, o) => noiseHit(t, 0.1, 0.16 * (o.v || 1), SX({ filter: 'bandpass', f0: 1200, f1: 3500, q: 1.2 })));
  S('punch', (t, o) => { noiseHit(t, 0.08, 0.4 * (o.v || 1), SX({ filter: 'lowpass', f0: 1500, f1: 300 })); voice('sine', 130, t, 0.08, 0.3 * (o.v || 1), SX({ slide: 70 })); });
  S('clang', (t, o) => { [523, 783, 1245].forEach((f, i) => voice('triangle', f, t + i * 0.01, 0.4, 0.07 * (o.v || 1), SX({ slide: f * 0.97 }))); noiseHit(t, 0.1, 0.2 * (o.v || 1), SX({ filter: 'bandpass', f0: 2000 })); });
  S('thud', (t, o) => noiseHit(t, 0.15, 0.3 * (o.v || 1), SX({ filter: 'lowpass', f0: 700, f1: 150 })));
  S('splash', (t, o) => { noiseHit(t, 0.9, 0.5 * (o.v || 1), SX({ filter: 'bandpass', f0: 1200, f1: 400, q: 0.6 })); voice('sine', 300, t, 0.3, 0.15 * (o.v || 1), SX({ slide: 120 })); });
  S('door', (t) => { noiseHit(t, 0.05, 0.25, SX({ filter: 'bandpass', f0: 900 })); voice('square', 110, t + 0.03, 0.06, 0.15, SX({ cutoff: 500 })); });
  S('bail', (t) => { noiseHit(t, 0.4, 0.4, SX({ filter: 'lowpass', f0: 1200, f1: 200 })); });
  S('radio', (t) => { noiseHit(t, 0.12, 0.18, SX({ filter: 'bandpass', f0: 2500, q: 0.5 })); blip(1400, t + 0.1, 0.04, 0.06); blip(1800, t + 0.15, 0.04, 0.06); });
  S('ring', (t, o) => { const v = o.v || 1; for (let i = 0; i < 2; i++) for (let j = 0; j < 8; j++) { const tt = t + i * 0.42 + j * 0.045; voice('square', 1320, tt, 0.035, 0.05 * v, SX({ cutoff: 3000 })); voice('square', 1660, tt + 0.02, 0.03, 0.04 * v, SX({ cutoff: 3000 })); } });
  S('mstart', (t) => { [57, 60, 64, 69].forEach((m, i) => voice('sawtooth', hz(m), t + i * 0.08, 0.2, 0.08, SX({ cutoff: 2000 }))); });
  S('passed', (t) => {
    [60, 64, 67, 72, 76, 79, 84].forEach((m, i) => voice('square', hz(m), t + i * 0.07, 0.15, 0.1, SX({ cutoff: 4000 })));
    [60, 64, 67, 72].forEach((m) => voice('sawtooth', hz(m), t + 0.55, 1.3, 0.05, SX({ cutoff: 2200, detune: 10, release: 0.6 })));
    drum('x', t + 0.55, 0.7);
  });
  S('failed', (t) => { [64, 63, 62].forEach((m, i) => voice('square', hz(m), t + i * 0.3, 0.26, 0.11, SX({ cutoff: 1600, vib: 5 }))); voice('square', hz(61), t + 0.9, 0.9, 0.11, SX({ cutoff: 1400, vib: 4, slide: hz(54) })); });
  S('wastedJ', (t) => { [57, 56, 55, 54].forEach((m, i) => voice('sawtooth', hz(m), t + i * 0.35, 0.3, 0.1, SX({ cutoff: 1200, vib: 5 }))); voice('sine', 80, t + 1.4, 1.5, 0.3, SX({ slide: 40 })); });
  S('busted', (t) => { for (let i = 0; i < 4; i++) { voice('square', 960, t + i * 0.3, 0.14, 0.09, SX({ cutoff: 2500 })); voice('square', 720, t + i * 0.3 + 0.15, 0.14, 0.09, SX({ cutoff: 2500 })); } voice('sawtooth', 220, t + 1.25, 0.8, 0.12, SX({ slide: 110, cutoff: 900 })); });
  S('spray', (t) => { noiseHit(t, 1.5, 0.3, SX({ filter: 'highpass', f0: 3000 })); noiseHit(t + 1.5, 0.4, 0.2, SX({ filter: 'highpass', f0: 4000 })); blip(1568, t + 1.9, 0.08, 0.1); blip(2093, t + 2.0, 0.15, 0.1); });
  S('horn', (t, o) => { const v = o.v || 1, f = o.f || 330; voice('sawtooth', f, t, 0.35, 0.09 * v, SX({ cutoff: 1400 })); voice('sawtooth', f * 1.26, t, 0.35, 0.07 * v, SX({ cutoff: 1400 })); });
  S('honk2', (t, o) => { const v = o.v || 1; for (let i = 0; i < 2; i++) { voice('sawtooth', 300, t + i * 0.22, 0.15, 0.08 * v, SX({ cutoff: 1300 })); voice('sawtooth', 378, t + i * 0.22, 0.15, 0.06 * v, SX({ cutoff: 1300 })); } });

  // positional: volume from distance to the camera centre
  function vol(x, y) {
    if (x === undefined) return 1;
    const d = dist(x, y, World.ccx, World.ccy);
    return d > 520 ? 0 : Math.pow(1 - d / 520, 1.4);
  }
  let shotGate = 0;
  const GA = {
    sfx(name, x, y) { const v = vol(x, y); if (v > 0.03) A.play(name, { v }); },
    shot(w, x, y, npc) {
      const v = vol(x, y) * (npc ? 0.7 : 1);
      if (v < 0.03) return;
      const now = A.ctx ? A.ctx.currentTime : 0;
      if (w === 'flame') { if (now - shotGate > 0.08) { shotGate = now; A.play('flame', { v }); } return; }
      const map = { pistol: 'pistol', smg: 'smg', rifle: 'rifle', shotgun: 'shotgun', rocket: 'rocket', grenade: 'throw' };
      A.play(map[w] || 'pistol', { v });
    },
    boom(x, y, r) { const v = Math.max(vol(x, y), 0.15) * Math.min(1.2, r / 50); A.play('boom', { v }); },
    crash(imp, x, y) { const v = vol(x, y) * Math.min(1, imp / 260); if (v > 0.05) A.play('crash', { v }); },
    horn(c, player) { const v = vol(c.x, c.y); if (v > 0.05) A.play(player ? 'horn' : 'honk2', { v, f: c.type === 'bus' || c.type === 'truck' || c.type === 'tanker' ? 200 : 330 }); if (player) World.scare(c.x + Math.cos(c.a) * 40, c.y + Math.sin(c.a) * 40, 60); },
    station: 0,
    stations: ['KSLO 88.1 SLOW JAMZ', 'NEON 104', 'RADIO TRES DEDOS', 'RADIO OFF'],
    nextStation() { GA.station = (GA.station + 1) % 4; LP.Settings.set('station', GA.station); HUD.sub(GA.stations[GA.station]); A.play('radio'); GA.refreshMusic(); },
    enterCar() { HUD.sub(GA.stations[GA.station]); GA.refreshMusic(); },
    exitCar() { GA.refreshMusic(); }
  };
  GA.station = LP.Settings.get('station') || 0;

  // ---------------------------------------------------------------- music selection
  let current = null;
  GA.want = function () {
    const st = LP.States.current;
    if (st === 'title' || st === 'options' || st === 'help' || st === 'credits') return 'title';
    if (st === 'ending') return 'ending';
    if (st === 'intro') return 'street';
    const pl = Player.ped;
    if (!pl) return 'street';
    if (Police.stars >= 3) return 'chase';
    if (pl.inCar) return GA.station === 3 ? 'quiet' : 'radio' + GA.station;
    if (Missions.active) return 'mission';
    return 'street';
  };
  GA.refreshMusic = function () {
    const w = GA.want();
    if (w !== current) { current = w; A.startMusic(w); }
  };
  GA.stopMusic = function () { current = null; A.stopMusic(); };

  // ---------------------------------------------------------------- continuous: engine, sirens, chopper
  let N = null;
  function build() {
    const g0 = graph(); if (!g0) return null;
    const c = A.ctx, n = { ctx: c };
    const mkNoise = (type, f, q) => { const s = c.createBufferSource(); s.buffer = A.noiseBuf; s.loop = true; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const gg = c.createGain(); gg.gain.value = 0; s.connect(fl); fl.connect(gg); gg.connect(A.sfxBus); s.start(); return { s, fl, gg }; };
    // engine
    n.eg = c.createGain(); n.eg.gain.value = 0; n.eg.connect(A.sfxBus);
    n.o1 = c.createOscillator(); n.o1.type = 'sawtooth'; n.o2 = c.createOscillator(); n.o2.type = 'square';
    n.ef = c.createBiquadFilter(); n.ef.type = 'lowpass'; n.ef.Q.value = 2;
    const g2 = c.createGain(); g2.gain.value = 0.4;
    n.o1.connect(n.ef); n.o2.connect(g2); g2.connect(n.ef); n.ef.connect(n.eg);
    n.screech = mkNoise('bandpass', 2400, 8);
    n.slfo = c.createOscillator(); n.slfo.frequency.value = 11; const sl = c.createGain(); sl.gain.value = 350; n.slfo.connect(sl); sl.connect(n.screech.fl.frequency);
    // siren: a wailing two-tone
    n.sg = c.createGain(); n.sg.gain.value = 0; n.sg.connect(A.sfxBus);
    n.so = c.createOscillator(); n.so.type = 'triangle'; n.so.frequency.value = 760;
    const sf = c.createBiquadFilter(); sf.type = 'lowpass'; sf.frequency.value = 2400;
    n.wail = c.createOscillator(); n.wail.type = 'sine'; n.wail.frequency.value = 0.55; const wg = c.createGain(); wg.gain.value = 230;
    n.wail.connect(wg); wg.connect(n.so.frequency);
    n.so.connect(sf); sf.connect(n.sg);
    // chopper
    n.heli = mkNoise('lowpass', 500, 1);
    n.hl = c.createOscillator(); n.hl.frequency.value = 13; n.hlg = c.createGain(); n.hlg.gain.value = 0;
    n.hl.connect(n.hlg); n.hlg.connect(n.heli.gg.gain);
    [n.o1, n.o2, n.slfo, n.so, n.wail, n.hl].forEach((o) => o.start());
    return n;
  }
  GA.update = function (dt, playing) {
    if (!A.ctx || A.ctx.state !== 'running') return;
    if (!N || N.ctx !== A.ctx) N = build();
    if (!N) return;
    const t = A.ctx.currentTime;
    const pl = Player.ped;
    const car = playing && pl && !pl.dead ? pl.inCar : null;
    if (car && !car.wreck && car.sink === 0) {
      const pct = Math.min(1, Math.abs(car.fwd || 0) / car.t.top);
      const gears = [0, 0.25, 0.5, 0.75, 1.01];
      let gi = 0; while (gi < gears.length - 2 && pct > gears[gi + 1]) gi++;
      const rpm = 0.3 + 0.7 * (pct - gears[gi]) / (gears[gi + 1] - gears[gi]);
      const heavy = car.t.mass > 1.8 ? 0.7 : car.type === 'sports' ? 1.25 : 1;
      const f = (38 + rpm * 95 + gi * 8) * heavy;
      N.o1.frequency.setTargetAtTime(f, t, 0.03); N.o2.frequency.setTargetAtTime(f * 0.5, t, 0.03);
      N.ef.frequency.setTargetAtTime(240 + rpm * 900 + Math.max(0, car.throttle) * 600, t, 0.05);
      N.eg.gain.setTargetAtTime(0.05 + Math.abs(car.throttle) * 0.04, t, 0.06);
      N.screech.gg.gain.setTargetAtTime(car.skid > 0.4 ? (car.skid - 0.3) * 0.16 : 0, t, 0.04);
    } else { N.eg.gain.setTargetAtTime(0, t, 0.08); N.screech.gg.gain.setTargetAtTime(0, t, 0.05); }
    // nearest siren
    let sd = 1e9;
    if (playing) for (const c of World.cars) if (c.siren && !c.wreck) { const d = dist(c.x, c.y, World.ccx, World.ccy); if (d < sd) sd = d; }
    const sv = sd < 600 ? Math.pow(1 - sd / 600, 1.5) * 0.05 : 0;
    N.sg.gain.setTargetAtTime(sv, t, 0.1);
    const h = playing ? Police.heli : null;
    const hv = h ? Math.max(0, 1 - dist(h.x, h.y, World.ccx, World.ccy) / 600) * 0.22 : 0;
    N.heli.gg.gain.setTargetAtTime(hv * 0.5, t, 0.1); N.hlg.gain.setTargetAtTime(hv * 0.5, t, 0.1);
  };
  GA.silence = function () { if (N && A.ctx) { const t = A.ctx.currentTime; N.eg.gain.setTargetAtTime(0, t, 0.05); N.screech.gg.gain.setTargetAtTime(0, t, 0.05); N.sg.gain.setTargetAtTime(0, t, 0.05); N.heli.gg.gain.setTargetAtTime(0, t, 0.05); N.hlg.gain.setTargetAtTime(0, t, 0.05); } };
  return GA;
})();
