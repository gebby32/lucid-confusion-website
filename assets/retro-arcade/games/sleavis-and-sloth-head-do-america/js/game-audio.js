/* GAME AUDIO — every riff, honk, fart and "heh heh" is original and synthesized live.
   Plumbing provides the buses, the step sequencer and volume settings; this file owns:
     - a crunchy distorted POWER-CHORD guitar (saws -> waveshaper -> cheap cabinet),
       bass, drums, and deliberately terrible MIDI-ish lead / organ / calliope voices,
     - songs written as bar strings (one token per 16th: 'E2' note, '.' rest, '-' hold,
       'E2*' palm-muted; drums: k kick, s snare, h hat, o open hat, c crash, x k+h, S k+s),
     - the sound effects, and the idiots' voices (synth laughs + babble, or robot TTS).
   GameAudio.music(name) / sfx(name) / voice(who, text) / blip(who) */
'use strict';
const GameAudio = (function () {
  const A = LP.Audio;
  const GA = {};
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const midiOf = (tok) => { const r = /^([A-G])([#b]?)(-?\d)/.exec(tok); if (!r) return null; return 12 * (+r[3] + 1) + NOTE[r[1]] + (r[2] === '#' ? 1 : r[2] === 'b' ? -1 : 0); };
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // ------------------------------------------------------------------ shared nodes
  let N = null;
  function nodes() {
    if (N && N.ctx === A.ctx) return N;
    if (!A.ctx) return null;
    const c = A.ctx;
    const dist = c.createWaveShaper(), curve = new Float32Array(1024), k = 60;
    for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; curve[i] = (1 + k) * x / (1 + k * Math.abs(x)); }
    dist.curve = curve; dist.oversample = '2x';
    const pre = c.createGain(); pre.gain.value = 1.6;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 110;
    const cab = c.createBiquadFilter(); cab.type = 'lowpass'; cab.frequency.value = 3200; cab.Q.value = 0.9;
    const mid = c.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 800; mid.gain.value = -5;
    const post = c.createGain(); post.gain.value = 0.16;
    pre.connect(dist); dist.connect(hp); hp.connect(mid); mid.connect(cab); cab.connect(post); post.connect(A.musicBus);
    const musicIn = c.createGain(); musicIn.connect(A.musicBus);
    N = { ctx: c, gtr: pre, musicIn };
    return N;
  }

  // ------------------------------------------------------------------ instruments
  function gtr(m, t, dur, o) {
    const n = nodes(); if (!n) return;
    const c = A.ctx, g = c.createGain(), lp = c.createBiquadFilter();
    o = o || {};
    lp.type = 'lowpass'; lp.frequency.value = o.mute ? 700 : 5000;
    const vol = o.mute ? 0.5 : 0.42;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.004);
    g.gain.setValueAtTime(vol * (o.mute ? 0.4 : 0.85), t + Math.min(dur, 0.06));
    g.gain.setValueAtTime(vol * (o.mute ? 0.3 : 0.75), t + dur);
    g.gain.exponentialRampToValueAtTime(0.0005, t + dur + (o.mute ? 0.03 : 0.08));
    g.connect(lp); lp.connect(n.gtr);
    const parts = o.single ? [1] : [1, 1.4983, 2];
    for (const r of parts) for (const d of [-7, 7]) {
      const s = c.createOscillator(); s.type = 'sawtooth'; s.frequency.value = hz(m) * r; s.detune.value = d;
      s.connect(g); s.start(t); s.stop(t + dur + 0.12);
    }
  }
  function bass(m, t, dur, o) {
    const n = nodes(); if (!n) return;
    const c = A.ctx, s = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    s.type = (o && o.wave) || 'sawtooth'; s.frequency.value = hz(m);
    f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(260, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.38, t + 0.006); g.gain.setValueAtTime(0.3, t + dur); g.gain.exponentialRampToValueAtTime(0.0005, t + dur + 0.05);
    s.connect(f); f.connect(g); g.connect(n.musicIn); s.start(t); s.stop(t + dur + 0.08);
  }
  // cheap General-MIDI-from-hell lead. tone: 'square' | 'organ' | 'calliope' | 'sax' | 'twang' | 'synth'
  function lead(m, t, dur, tone) {
    const n = nodes(); if (!n) return;
    const c = A.ctx, g = c.createGain();
    g.connect(n.musicIn);
    const f = hz(m);
    const mk = (type, mult, vol, vib) => {
      const s = c.createOscillator();
      if (A.waves[type]) s.setPeriodicWave(A.waves[type]); else s.type = type;
      s.frequency.value = f * mult;
      if (vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = vib; lg.gain.value = f * 0.012; l.connect(lg); lg.connect(s.frequency); l.start(t); l.stop(t + dur + 0.1); }
      const sg = c.createGain(); sg.gain.value = vol; s.connect(sg); sg.connect(g); s.start(t); s.stop(t + dur + 0.1);
    };
    let v = 0.12, rel = 0.05;
    if (tone === 'organ') { mk('sine', 1, 0.5); mk('sine', 2, 0.3); mk('sine', 3, 0.15); mk('sine', 4, 0.1); v = 0.14; }
    else if (tone === 'calliope') { mk('triangle', 1, 0.6, 7); mk('sine', 2, 0.3, 7); v = 0.16; }
    else if (tone === 'sax') { mk('sawtooth', 1, 0.3, 5); mk('square', 1.002, 0.2); v = 0.09; rel = 0.08; }
    else if (tone === 'twang') { mk('p25', 1, 0.5); mk('triangle', 2, 0.2); v = 0.15; rel = 0.12; }
    else if (tone === 'synth') { mk('sawtooth', 1, 0.3); mk('sawtooth', 1.005, 0.3); v = 0.08; }
    else { mk('p25', 1, 0.6, 6); v = 0.1; }
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.01);
    g.gain.setValueAtTime(v * 0.8, t + dur); g.gain.exponentialRampToValueAtTime(0.0005, t + dur + rel);
  }
  function drum(ch, t) {
    const n = nodes(); if (!n) return;
    const bus = { bus: 'music' };
    if (ch === 'k' || ch === 'x' || ch === 'S') { A.tone('sine', 160, 42, t, 0.16, 0.9, bus); A.noise(t, 0.02, 0.25, { filter: 'lowpass', f0: 2000, bus: 'music' }); }
    if (ch === 's' || ch === 'S') { A.noise(t, 0.16, 0.45, { filter: 'bandpass', f0: 1800, q: 0.6, bus: 'music' }); A.tone('triangle', 210, 160, t, 0.08, 0.35, bus); }
    if (ch === 'h' || ch === 'x') A.noise(t, 0.03, 0.16, { filter: 'highpass', f0: 8000, bus: 'music' });
    if (ch === 'o') A.noise(t, 0.18, 0.15, { filter: 'highpass', f0: 7000, bus: 'music' });
    if (ch === 'c') A.noise(t, 1.0, 0.25, { filter: 'highpass', f0: 4500, bus: 'music' });
    if (ch === 'r') A.noise(t, 0.08, 0.1, { filter: 'bandpass', f0: 5000, q: 2, bus: 'music' });   // rimshot / ride-ish
    if (ch === 'b') A.tone('sine', 520, 380, t, 0.08, 0.25, bus);                                   // cowbell. more cowbell? no.
  }

  // ------------------------------------------------------------------ song builder
  function tokens(bar) { const t = bar.trim().split(/\s+/); while (t.length < 16) t.push('.'); return t; }
  function define(name, def) {
    const parts = {};
    let bars = 0;
    for (const k of ['gtr', 'bass', 'drums', 'lead', 'lead2']) if (def[k]) { parts[k] = def[k].map((b) => (k === 'drums' ? b.replace(/\s+/g, '').padEnd(16, '.').split('') : tokens(b))); bars = Math.max(bars, parts[k].length); }
    const len = bars * 16;
    // durations: count following '-' holds
    const durOf = (arr, bi, si) => { let n = 1; for (let i = si + 1; i < 16 && arr[bi][i] === '-'; i++) n++; return n; };
    A.song(name, {
      bpm: def.bpm, stepsPerBeat: 4, length: len,
      step(i, t, sd) {
        const bar = Math.floor(i / 16), s = i % 16;
        const sw = def.swing && s % 2 ? sd * def.swing : 0;
        t += sw;
        for (const k in parts) {
          const P = parts[k], b = bar % P.length, tok = P[b][s];
          if (k === 'drums') { if (tok !== '.') drum(tok, t); continue; }
          if (tok === '.' || tok === '-') continue;
          const mute = tok.endsWith('*');
          const m = midiOf(tok); if (m === null) continue;
          const dur = durOf(P, b, s) * sd * (mute ? 0.5 : 0.92);
          if (k === 'gtr') { if (def.gtrTone) lead(m, t, dur, def.gtrTone); else gtr(m, t, dur, { mute, single: def.single }); }
          else if (k === 'bass') bass(m, t, dur, { wave: def.bassWave });
          else lead(m, t, dur, k === 'lead2' ? (def.lead2Tone || def.leadTone) : def.leadTone);
        }
      }
    });
  }
  GA.define = define;

  // ---- the soundtrack -------------------------------------------------
  // Main theme: "Do America" — garage riff in E, dumb and loud.
  define('title', {
    bpm: 138,
    gtr: ['E2 - - E2* E2* E2* G2 - - A2 - - E2* E2* Bb2 A2', 'E2 - - E2* E2* E2* G2 - - A2 - - C3 - B2 -', 'E2 - - E2* E2* E2* G2 - - A2 - - E2* E2* Bb2 A2', 'D3 - - D3 C3 - - C3 A2 - - A2 G2 - A2 -'],
    bass: ['E1 . E1 E1 . E1 G1 . . A1 . . E1 E1 Bb1 A1', 'E1 . E1 E1 . E1 G1 . . A1 . . C2 . B1 .', 'E1 . E1 E1 . E1 G1 . . A1 . . E1 E1 Bb1 A1', 'D2 . . D2 C2 . . C2 A1 . . A1 G1 . A1 .'],
    drums: ['k.h.s.h.k.k.s.h.', 'k.h.s.h.k.k.s.hs', 'k.h.s.h.k.k.s.h.', 'k.s.k.s.k.s.ssss']
  });
  // Couch-potato stoner groove for wandering the neighborhood
  define('home', {
    bpm: 92, swing: 0.18,
    gtr: ['A2 - - - . . C3* C3* D3 - - - . C3 A2 .', 'A2 - - - . . C3* C3* D3 - - - F3 - E3 -'],
    bass: ['A1 - - - . . C2 C2 D2 - - - . C2 A1 .', 'A1 - - - . . C2 C2 D2 - - - F2 - E2 -'],
    drums: ['k..hs..hk.k.s..h', 'k..hs..hk.k.s.ss']
  });
  // Highway punk: fast, three chords, no future
  define('drive', {
    bpm: 182,
    gtr: ['E2 E2 E2 E2 E2 E2 E2 E2 A2 A2 A2 A2 A2 A2 A2 A2', 'B2 B2 B2 B2 B2 B2 B2 B2 A2 A2 A2 A2 G2 G2 G2 G2', 'E2 E2 E2 E2 E2 E2 E2 E2 A2 A2 A2 A2 A2 A2 A2 A2', 'B2 B2 B2 B2 A2 A2 A2 A2 E2 - - - E2* E2* E2* E2*'],
    bass: ['E1 E1 E1 E1 E1 E1 E1 E1 A1 A1 A1 A1 A1 A1 A1 A1', 'B1 B1 B1 B1 B1 B1 B1 B1 A1 A1 A1 A1 G1 G1 G1 G1', 'E1 E1 E1 E1 E1 E1 E1 E1 A1 A1 A1 A1 A1 A1 A1 A1', 'B1 B1 B1 B1 A1 A1 A1 A1 E1 - - - E1 E1 E1 E1'],
    drums: ['x.sxx.sxx.sxx.sx', 'x.sxx.sxx.sxx.sx', 'x.sxx.sxx.sxx.sx', 'x.sxx.sxc...ssss']
  });
  // Brawl: chuggy garage-metal
  define('brawl', {
    bpm: 150,
    gtr: ['E2* E2* E2* E2* G2 - E2* E2* Bb2 - E2* E2* A2 - G2 -', 'E2* E2* E2* E2* G2 - E2* E2* Bb2 - A2 - D3 - C3 -', 'E2* E2* E2* E2* G2 - E2* E2* Bb2 - E2* E2* A2 - G2 -', 'C3 - - C3 B2 - - B2 Bb2 - - Bb2 A2 A2 G2 G2'],
    bass: ['E1 E1 E1 E1 G1 - E1 E1 Bb1 - E1 E1 A1 - G1 -', 'E1 E1 E1 E1 G1 - E1 E1 Bb1 - A1 - D2 - C2 -', 'E1 E1 E1 E1 G1 - E1 E1 Bb1 - E1 E1 A1 - G1 -', 'C2 - - C2 B1 - - B1 Bb1 - - Bb1 A1 A1 G1 G1'],
    drums: ['kkhkS.hkkkhkS.hs', 'kkhkS.hkkkhkS.hs', 'kkhkS.hkkkhkS.hs', 'S.kkS.kkS.kkssss']
  });
  // Motel: a General MIDI bossa nova from a 1996 hotel demo disc. Sad organ.
  define('motel', {
    bpm: 112, swing: 0.1, gtrTone: 'organ', leadTone: 'sax',
    gtr: ['D3 - - - F3 - - - A3 - - - F3 - - -', 'C3 - - - E3 - - - G3 - - - E3 - - -'],
    bass: ['D2 . . D2 . . A1 . D2 . . D2 . . A1 .', 'C2 . . C2 . . G1 . C2 . . C2 . . G1 .'],
    lead: ['A4 - - - . . G4 F4 E4 - - - D4 - - -', 'G4 - - - . . F4 E4 D4 - - - C4 - - -', 'A4 - G4 - F4 - E4 - F4 - - - . . . .', 'E4 - - - D4 - C4 - D4 - - - - - - -'],
    drums: ['k.r.h.r.k.r.h.r.', 'k.r.h.r.k.rkh.r.']
  });
  // Truck stop: chicken-pickin' square-wave country
  define('truckstop', {
    bpm: 128, gtrTone: 'twang', leadTone: 'twang',
    gtr: ['G3 . B3 . D4 . B3 . G3 . B3 . D4 . B3 .', 'C4 . E4 . G4 . E4 . D4 . F#4 . A4 . F#4 .'],
    bass: ['G1 . . . D2 . . . G1 . . . D2 . . .', 'C2 . . . G1 . . . D2 . . . A1 . . .'],
    lead: ['. . . . . . . . . . G4 A4 B4 - D5 -', 'E5 - D5 B4 A4 - G4 - A4 - - - . . . .'],
    drums: ['k.h.s.h.k.h.s.h.', 'k.h.s.h.k.h.s.hb']
  });
  // Biker bar: dirty shuffle in A
  define('bar', {
    bpm: 104, swing: 0.33,
    gtr: ['A2* A2* C#3* C#3* A2* A2* D3* D3* A2* A2* C#3* C#3* A2* A2* G2 -', 'D3* D3* F#3* F#3* D3* D3* G3* G3* A2* A2* C#3* C#3* E2 - G2 -'],
    bass: ['A1 . C#2 . E2 . F#2 . G2 . F#2 . E2 . C#2 .', 'D2 . F#2 . A2 . B2 . A1 . C#2 . E1 . G1 .'],
    drums: ['k.hhs.hhk.hhs.hh', 'k.hhs.hhk.hhs.ss']
  });
  // Tourist trap: a calliope that has seen things
  define('tourist', {
    bpm: 150, gtrTone: 'calliope', leadTone: 'calliope', bassWave: 'triangle',
    gtr: ['. . E4 G4 . . E4 G4 . . F4 A4 . . F4 A4', '. . D4 G4 . . D4 G4 . . E4 G4 . . E4 G4'],
    bass: ['C2 . . . G1 . . . F1 . . . C2 . . .', 'G1 . . . D2 . . . C2 . . . G1 . . .'],
    lead: ['C5 - E5 - G5 - - - A5 - G5 - F5 - E5 -', 'D5 - - - B4 - - - C5 - - - . . . .', 'C5 - E5 - G5 - - - C6 - B5 - A5 - G5 -', 'F5 - D5 - B4 - G4 - C5 - - - . . . .'],
    drums: ['k...s...k...s...', 'k...s...k.k.s.s.']
  });
  // Area 69: tense military snare + synth bass, sneaky
  define('base', {
    bpm: 96, leadTone: 'synth', bassWave: 'square',
    bass: ['E1 . . E1 . . E1 . F1 . . F1 . . E1 .', 'E1 . . E1 . . E1 . Bb1 . . A1 . . G1 .'],
    lead: ['. . . . . . . . B3 - - - C4 - - -', '. . . . . . . . Bb3 - A3 - G3 - - -'],
    drums: ['k..r.r.rs.r.r.rr', 'k..r.r.rs.r.rsss']
  });
  // Mall: smooth-jazz muzak, aggressively pleasant
  define('mall', {
    bpm: 96, swing: 0.15, gtrTone: 'organ', leadTone: 'sax',
    gtr: ['F3 - - - A3 - - - C4 - - - A3 - - -', 'G3 - - - Bb3 - - - D4 - - - Bb3 - - -'],
    bass: ['F1 . . F1 . . C2 . F1 . . A1 . . C2 .', 'G1 . . G1 . . D2 . G1 . . Bb1 . . D2 .'],
    lead: ['C5 - A4 - F4 - G4 - A4 - - - . . . .', 'D5 - Bb4 - G4 - A4 - Bb4 - - - . . . .', 'C5 - D5 - C5 - A4 - G4 - F4 - G4 - - -', 'F4 - - - - - - - . . . . . . . .'],
    drums: ['k.r.s.r.k.r.s.r.', 'k.r.s.r.k.rks.r.']
  });
  // Slothstock: sludgy grunge
  define('fest', {
    bpm: 118,
    gtr: ['D2 - - - - - F2 - G2 - - - Ab2 - G2 -', 'D2 - - - - - F2 - G2 - - - C3 - Bb2 -'],
    bass: ['D1 - - - - - F1 - G1 - - - Ab1 - G1 -', 'D1 - - - - - F1 - G1 - - - C2 - Bb1 -'],
    drums: ['k.h.s.hkk.h.s.h.', 'k.h.s.hkk.hss.sc']
  });
  // Casino: lounge swing on a cheap keyboard
  define('casino', {
    bpm: 132, swing: 0.3, gtrTone: 'organ', leadTone: 'sax',
    gtr: ['C3 - - - E3 - - - A3 - - - G3 - - -', 'D3 - - - F3 - - - B3 - - - G3 - - -'],
    bass: ['C2 . E2 . G2 . A2 . C2 . E2 . G2 . E2 .', 'D2 . F2 . A2 . B2 . G1 . B1 . D2 . G2 .'],
    lead: ['E5 - D5 - C5 - A4 - G4 - - - . . . .', 'F5 - E5 - D5 - B4 - G4 - - - . . . .', 'E5 - G5 - A5 - G5 - E5 - D5 - C5 - - -', 'D5 - - - B4 - - - C5 - - - . . . .'],
    drums: ['r.rrr.rrr.rrr.rr', 'k.rrS.rrk.rrS.rs']
  });
  // Boss: fast and stupid metal
  define('boss', {
    bpm: 172,
    gtr: ['E2* E2* E2* E2* F2 - E2* E2* E2* E2* G2 - F2 - E2* E2*', 'E2* E2* E2* E2* F2 - E2* E2* Bb2 - A2 - G2 - F2 -'],
    bass: ['E1 E1 E1 E1 F1 - E1 E1 E1 E1 G1 - F1 - E1 E1', 'E1 E1 E1 E1 F1 - E1 E1 Bb1 - A1 - G1 - F1 -'],
    drums: ['kkskkkskkkskkkss', 'kkskkkskkkskssss']
  });
  // Ending: cheesy triumphant arena-rock
  define('ending', {
    bpm: 120, leadTone: 'synth',
    gtr: ['D3 - - - - - - - A2 - - - - - - -', 'B2 - - - - - - - G2 - - - A2 - - -'],
    bass: ['D2 . D2 . D2 . D2 . A1 . A1 . A1 . A1 .', 'B1 . B1 . B1 . B1 . G1 . G1 . A1 . A1 .'],
    lead: ['F#4 - - - A4 - - - E4 - - - C#4 - - -', 'D4 - - - B3 - - - D4 - - - E4 - - -', 'F#4 - G4 - A4 - - - E4 - F#4 - E4 - - -', 'D4 - - - - - - - . . . . . . . .'],
    drums: ['k.h.s.h.k.h.s.h.', 'k.h.s.h.k.kss.sc']
  });
  // the rhythm mini-game song "Sloth Butt Boogie" (chart lives in minigames.js)
  define('boogie', {
    bpm: 120,
    gtr: ['A2 - . A2* A2* . C3 - . A2* A2* . D3 - C3 -', 'A2 - . A2* A2* . C3 - . A2* A2* . E3 - D3 -', 'F2 - - - - - G2 - - - - - A2 - - -', 'F2 - - - G2 - - - A2 - . A2 A2 . . .'],
    bass: ['A1 . . A1 A1 . C2 . . A1 A1 . D2 . C2 .', 'A1 . . A1 A1 . C2 . . A1 A1 . E2 . D2 .', 'F1 . . . . . G1 . . . . . A1 . . .', 'F1 . . . G1 . . . A1 . . A1 A1 . . .'],
    drums: ['k.h.s.h.k.k.s.h.', 'k.h.s.h.k.k.s.hs', 'k.h.s.h.k.h.s.h.', 'k.s.k.s.k.s.c...']
  });
  define('silence', { bpm: 60, drums: ['................'] });

  let cur = null;
  GA.music = function (name) { if (name === cur) return; cur = name; if (!name) { A.stopMusic(); return; } A.startMusic(name); };
  GA.current = () => cur;
  GA.silence = function () { cur = null; A.stopMusic(); };

  // ------------------------------------------------------------------ sound effects
  const S = (name, fn) => A.sound(name, fn);
  S('menu', (t) => A.tone('square', 660, 660, t, 0.04, 0.12));
  S('select', (t) => { A.tone('square', 520, 520, t, 0.05, 0.14); A.tone('square', 780, 780, t + 0.05, 0.08, 0.14); });
  S('back', (t) => A.tone('square', 400, 260, t, 0.08, 0.12));
  S('start', (t) => { [0, 4, 7, 12].forEach((s, i) => A.tone('square', hz(64 + s), null, t + i * 0.06, 0.1, 0.13)); A.noise(t + 0.24, 0.4, 0.2, { filter: 'highpass', f0: 4000 }); });
  S('jump', (t) => A.tone('square', 260, 520, t, 0.12, 0.1));
  S('land', (t) => A.noise(t, 0.07, 0.25, { filter: 'lowpass', f0: 600 }));
  S('whoosh', (t) => A.noise(t, 0.12, 0.2, { filter: 'bandpass', f0: 1200, f1: 3000, q: 1.5 }));
  S('punch', (t) => { A.noise(t, 0.08, 0.6, { filter: 'lowpass', f0: 1500, f1: 300 }); A.tone('sine', 140, 60, t, 0.1, 0.5); });
  S('bigpunch', (t) => { A.noise(t, 0.18, 0.8, { filter: 'lowpass', f0: 2400, f1: 200 }); A.tone('sine', 120, 40, t, 0.2, 0.7); A.tone('square', 90, 50, t, 0.12, 0.2); });
  S('ko', (t) => { A.tone('square', 600, 120, t, 0.4, 0.15); A.tone('triangle', 1200, 300, t + 0.1, 0.3, 0.1); });
  S('heroko', (t) => { [0, 3, 6, 9].forEach((s, i) => A.tone('square', hz(70 - s * 2), null, t + i * 0.12, 0.12, 0.14)); });
  S('smash', (t) => { A.noise(t, 0.35, 0.6, { filter: 'highpass', f0: 2500 }); A.noise(t, 0.15, 0.5, { filter: 'lowpass', f0: 800 }); for (let i = 0; i < 4; i++) A.tone('triangle', LP.rand(2000, 4000), null, t + i * 0.04, 0.05, 0.08); });
  S('glass', (t) => { A.noise(t, 0.25, 0.5, { filter: 'highpass', f0: 4000 }); for (let i = 0; i < 5; i++) A.tone('sine', LP.rand(2500, 5000), null, t + i * 0.03, 0.06, 0.08); });
  S('thud', (t) => { A.tone('sine', 120, 50, t, 0.12, 0.6); A.noise(t, 0.06, 0.3, { filter: 'lowpass', f0: 500 }); });
  S('pickup', (t) => A.tone('square', 300, 600, t, 0.08, 0.12));
  S('throw', (t) => A.noise(t, 0.2, 0.25, { filter: 'bandpass', f0: 800, f1: 2500 }));
  S('splat', (t) => { A.noise(t, 0.2, 0.6, { filter: 'lowpass', f0: 900, f1: 200 }); A.tone('sine', 200, 70, t, 0.15, 0.3); });
  S('slurp', (t) => { for (let i = 0; i < 3; i++) A.noise(t + i * 0.09, 0.08, 0.3, { filter: 'bandpass', f0: 600 + i * 300, q: 4 }); A.tone('sine', 300, 120, t + 0.3, 0.12, 0.2); });
  S('eat', (t) => { for (let i = 0; i < 4; i++) A.noise(t + i * 0.08, 0.05, 0.4, { filter: 'lowpass', f0: 1200 }); });
  S('burp', (t) => { A.tone('sawtooth', 110, 70, t, 0.45, 0.35, { vibrato: 30, depth: 25 }); A.noise(t, 0.4, 0.15, { filter: 'lowpass', f0: 500 }); });
  S('fart', (t) => { A.tone('sawtooth', 90, 60, t, 0.5, 0.35, { vibrato: 25, depth: 30 }); A.noise(t, 0.5, 0.12, { filter: 'lowpass', f0: 300 }); });
  S('puke', (t) => { A.tone('sawtooth', 220, 80, t, 0.6, 0.3, { vibrato: 12, depth: 40 }); A.noise(t + 0.1, 0.7, 0.5, { filter: 'lowpass', f0: 1200, f1: 300 }); });
  S('cash', (t) => { A.tone('square', 1320, null, t, 0.05, 0.1); A.tone('square', 1760, null, t + 0.06, 0.12, 0.1); });
  S('coin', (t) => { A.tone('square', 990, null, t, 0.06, 0.1); A.tone('square', 1320, null, t + 0.06, 0.15, 0.1); });
  S('freak', (t) => { A.tone('sawtooth', 200, 1600, t, 0.5, 0.25, { vibrato: 18, depth: 80 }); A.noise(t, 0.6, 0.3, { filter: 'bandpass', f0: 1500, q: 1 }); GA.laugh('sleavis', t + 0.3, 6); });
  S('click', (t) => { A.tone('square', 1800, null, t, 0.015, 0.15); A.tone('square', 900, null, t + 0.03, 0.015, 0.1); });
  S('lockon', (t) => { for (let i = 0; i < 5; i++) A.tone('square', 1200, null, t + i * 0.14, 0.05, 0.08); });
  S('laser', (t) => { A.tone('sawtooth', 3000, 120, t, 0.6, 0.3); A.tone('square', 1500, 80, t, 0.6, 0.15); });
  S('boom', (t) => { A.noise(t, 0.8, 0.9, { filter: 'lowpass', f0: 1200, f1: 80 }); A.tone('sine', 80, 30, t, 0.6, 0.8); });
  S('bigboom', (t) => { A.noise(t, 1.8, 1, { filter: 'lowpass', f0: 2000, f1: 50 }); A.tone('sine', 70, 20, t, 1.4, 1); A.noise(t + 0.2, 1.4, 0.4, { filter: 'highpass', f0: 2000 }); });
  S('swap', (t) => { A.tone('square', 440, 880, t, 0.06, 0.1); A.tone('square', 880, 440, t + 0.06, 0.06, 0.1); });
  S('objective', (t) => { A.tone('triangle', 784, null, t, 0.08, 0.18); A.tone('triangle', 1046, null, t + 0.08, 0.16, 0.18); });
  S('card', (t) => { gtr(40, t, 0.6); gtr(43, t + 0.25, 0.4); gtr(45, t + 0.5, 0.8); drum('c', t); drum('k', t); });
  S('huh', (t) => A.tone('square', 400, 700, t, 0.15, 0.12));
  S('alert', (t) => { A.tone('square', 880, null, t, 0.1, 0.2); A.tone('square', 1320, null, t + 0.1, 0.25, 0.2); });
  S('crash', (t) => { A.noise(t, 0.6, 0.9, { filter: 'lowpass', f0: 3000, f1: 200 }); A.noise(t, 0.3, 0.5, { filter: 'highpass', f0: 3000 }); A.tone('sine', 90, 40, t, 0.3, 0.6); });
  S('horn', (t) => { A.tone('square', 392, null, t, 0.35, 0.16); A.tone('square', 494, null, t, 0.35, 0.12); });
  S('slide', (t) => A.noise(t, 0.3, 0.3, { filter: 'bandpass', f0: 2000, f1: 600 }));
  S('flush', (t) => { A.noise(t, 1.4, 0.5, { filter: 'bandpass', f0: 600, f1: 2000, q: 0.8 }); A.tone('sine', 300, 80, t + 0.8, 0.6, 0.25, { vibrato: 8, depth: 30 }); });
  S('plunge', (t) => { A.tone('sine', 180, 60, t, 0.15, 0.6); A.noise(t, 0.12, 0.4, { filter: 'lowpass', f0: 700 }); });
  S('reel', (t) => A.tone('square', 1200, null, t, 0.02, 0.07));
  S('stop', (t) => { A.tone('square', 600, null, t, 0.06, 0.15); A.noise(t, 0.05, 0.2, { filter: 'lowpass', f0: 1000 }); });
  S('jackpot', (t) => { for (let i = 0; i < 16; i++) A.tone('square', hz(72 + [0, 4, 7, 12][i % 4]), null, t + i * 0.07, 0.07, 0.12); });
  S('buzzer', (t) => A.tone('sawtooth', 110, 100, t, 0.6, 0.3));
  S('ding', (t) => A.tone('sine', 1760, null, t, 0.5, 0.25));
  S('cheer', (t) => { A.noise(t, 1.6, 0.5, { filter: 'bandpass', f0: 1500, q: 0.4 }); for (let i = 0; i < 6; i++) A.tone('sawtooth', LP.rand(300, 700), LP.rand(400, 900), t + LP.rand(0, 0.8), 0.3, 0.05); });
  S('boo', (t) => { A.tone('sawtooth', 160, 110, t, 1.0, 0.25, { vibrato: 6, depth: 10 }); A.tone('sawtooth', 200, 140, t + 0.1, 0.9, 0.2, { vibrato: 5, depth: 8 }); A.noise(t, 1, 0.2, { filter: 'bandpass', f0: 600 }); });
  S('siren', (t) => { for (let i = 0; i < 4; i++) A.tone('square', i % 2 ? 700 : 950, null, t + i * 0.3, 0.3, 0.1); });
  S('miss', (t) => A.tone('sawtooth', 160, 90, t, 0.15, 0.2));
  S('hit', (t) => A.tone('square', 880, null, t, 0.04, 0.08));
  S('pump', (t) => { A.tone('square', 220, 240, t, 0.03, 0.08); });
  S('vend', (t) => { A.tone('square', 150, 120, t, 0.2, 0.2); A.noise(t + 0.15, 0.2, 0.4, { filter: 'lowpass', f0: 800 }); });
  S('door', (t) => { A.tone('triangle', 200, 150, t, 0.2, 0.2); A.noise(t, 0.1, 0.2, { filter: 'lowpass', f0: 1000 }); });
  S('phone', (t) => { for (let i = 0; i < 6; i++) A.tone('square', i % 2 ? 1200 : 1500, null, t + i * 0.05, 0.05, 0.08); });
  S('record', (t) => { A.noise(t, 0.4, 0.5, { filter: 'bandpass', f0: 2500, f1: 300, q: 3 }); });
  S('fanfare', (t) => { [0, 4, 7, 12, 7, 12].forEach((s, i) => A.tone('square', hz(67 + s), null, t + i * 0.12, i === 5 ? 0.5 : 0.12, 0.15)); gtr(43, t + 0.6, 0.8); drum('c', t + 0.6); });
  S('fail', (t) => { [7, 6, 5, 0].forEach((s, i) => A.tone('square', hz(60 + s), null, t + i * 0.22, i === 3 ? 0.6 : 0.2, 0.15)); });
  S('win', (t) => { [0, 4, 7, 12].forEach((s, i) => A.tone('square', hz(72 + s), null, t + i * 0.09, 0.12, 0.14)); });
  S('static', (t) => A.noise(t, 0.8, 0.25, { filter: 'highpass', f0: 2000 }));
  S('scratch', (t) => A.noise(t, 0.25, 0.4, { filter: 'bandpass', f0: 1500, f1: 400, q: 2 }));
  S('drip', (t) => A.tone('sine', 1400, 600, t, 0.08, 0.15));
  S('honkhonk', (t) => { A.tone('square', 330, null, t, 0.2, 0.15); A.tone('square', 330, null, t + 0.3, 0.2, 0.15); });
  GA.sfx = function (n, o) { A.play(n, o); };

  // ------------------------------------------------------------------ voices
  // Formant-ish babble: a buzzy source through two band-pass "mouth" filters.
  const VOX = {
    sleavis: { f: 300, var: 120, wave: 'sawtooth', f1: 700, f2: 1900, dur: 0.06, vol: 0.22 },
    slothhead: { f: 115, var: 25, wave: 'sawtooth', f1: 550, f2: 1050, dur: 0.09, vol: 0.28 },
    slaria: { f: 200, var: 0, wave: 'triangle', f1: 600, f2: 1600, dur: 0.07, vol: 0.2 },
    narrator: null, sign: null
  };
  function vox(who) {
    if (VOX[who] !== undefined) return VOX[who];
    let h = 0; for (const c of who) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    VOX[who] = { f: 110 + (h % 220), var: 20 + (h % 60), wave: h % 3 ? 'sawtooth' : 'square', f1: 500 + (h % 400), f2: 1300 + (h % 900), dur: 0.07, vol: 0.18 };
    return VOX[who];
  }
  function syllable(v, t, f, dur) {
    const c = A.ctx; if (!c) return;
    const s = c.createOscillator(), b1 = c.createBiquadFilter(), b2 = c.createBiquadFilter(), g = c.createGain();
    s.type = v.wave; s.frequency.setValueAtTime(f, t); s.frequency.linearRampToValueAtTime(f * 0.9, t + dur);
    b1.type = 'bandpass'; b1.frequency.value = v.f1; b1.Q.value = 5;
    b2.type = 'bandpass'; b2.frequency.value = v.f2; b2.Q.value = 6;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v.vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    s.connect(b1); s.connect(b2); b1.connect(g); b2.connect(g); g.connect(A.sfxBus);
    s.start(t); s.stop(t + dur + 0.02);
  }
  GA.blip = function (who) {
    if (LP.Settings.get('voice') !== 1 || !A.ctx || A.ctx.state !== 'running') return;
    const v = vox(who); if (!v) return;
    syllable(v, A.ctx.currentTime + 0.005, v.f + (Math.random() - 0.5) * v.var * 2, v.dur);
  };
  // "heh heh" (Sleavis, high, wheezy) / "uh huh huh" (Sloth-Head, low, smug)
  GA.laugh = function (who, t, n) {
    if (!A.ctx) return;
    t = t || A.ctx.currentTime + 0.01;
    const sl = who === 'sleavis';
    const v = sl ? { wave: 'sawtooth', f1: 800, f2: 2100, vol: 0.3 } : { wave: 'sawtooth', f1: 520, f2: 1000, vol: 0.34 };
    n = n || (sl ? 3 : 3);
    for (let i = 0; i < n; i++) {
      const f = sl ? 330 + i * 15 + Math.random() * 30 : (i === 0 ? 105 : 125) - i * 3;
      syllable(v, t + i * (sl ? 0.13 : 0.17), f, sl ? 0.08 : 0.12);
      A.noise(t + i * (sl ? 0.13 : 0.17), 0.06, sl ? 0.08 : 0.05, { filter: 'bandpass', f0: sl ? 3000 : 1500, q: 1 });
    }
  };
  // a whole line: laughs fire for real; TTS if the player picked robot voices
  GA.voice = function (who, text, bark) {
    const mode = LP.Settings.get('voice');
    if (!mode || !A.ctx) return;
    const low = text.toLowerCase();
    if (who === 'sleavis' && /heh heh/.test(low)) GA.laugh('sleavis', null, /heh heh heh/.test(low) ? 4 : 3);
    if (who === 'slothhead' && /uh huh huh/.test(low)) GA.laugh('slothhead', null, 3);
    if (mode === 2 && window.speechSynthesis && !bark) {
      try {
        speechSynthesis.cancel();
        const clean = text.replace(/heh heh( heh)?/gi, '').replace(/uh huh huh/gi, '').replace(/SLUTT-HEAD/gi, 'Slut Head').replace(/[*]/g, '');
        if (clean.trim().length < 2) return;
        const u = new SpeechSynthesisUtterance(clean);
        const P = { sleavis: [1.9, 1.2], slothhead: [0.2, 0.85], slaria: [0.8, 1.05] }[who] || [0.7 + (vox(who) ? vox(who).f / 330 : 0.5), 1];
        u.pitch = P[0]; u.rate = P[1];
        u.volume = Math.min(1, LP.Settings.get('sfx') / 10);
        speechSynthesis.speak(u);
      } catch (e) { /* no TTS */ }
    }
  };
  GA.voiceStop = function () { try { if (LP.Settings.get('voice') === 2 && window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { /* ok */ } };
  GA.note = function (m, dur, tone) { if (!A.ctx) return; if (tone === 'gtr') gtr(m, A.ctx.currentTime + 0.01, dur); else lead(m, A.ctx.currentTime + 0.01, dur, tone); };
  return GA;
})();
