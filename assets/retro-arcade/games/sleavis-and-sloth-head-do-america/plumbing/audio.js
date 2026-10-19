/* ============================================================================
   LUCID PLUMBING — audio
   Web Audio wiring only. The GAME owns every sound recipe and every song
   (see js/game-audio.js). Routing: sounds -> sfx bus -> master -> compressor -> out
                                    songs  -> music bus -> master
   The context is created on the first key/pointer press (browser rule).

   LP.Audio.sound(name, (t, opts) => { ...A.tone / A.noise starting at time t... })
   LP.Audio.play(name, opts)
   LP.Audio.song(name, { bpm, stepsPerBeat: 4, length: 64, step(i, t, stepDur) { ... bus:'music' ... } })
   LP.Audio.startMusic(name) / stopMusic()
   LP.Audio.applySettings()   after changing sfx / music / muted settings
   LP.Audio.toggleMute(), stopAll(), suspend(), resume()
   ============================================================================ */
'use strict';
(function () {
  const A = {
    ctx: null, master: null, sfxBus: null, musicBus: null, noiseBuf: null, waves: {},
    sounds: {}, songs: {}, active: new Set(), levels: { master: 1, sfx: 0, music: 0 },
    sfxMax: 0.8, musicMax: 0.45,
    song_: null, wantSong: null, _timer: null, _step: 0, _next: 0, _bound: false
  };

  A.init = function (cfg) {
    cfg = cfg || {};
    A.sfxMax = cfg.sfxMax === undefined ? 0.8 : cfg.sfxMax;
    A.musicMax = cfg.musicMax === undefined ? 0.45 : cfg.musicMax;
    A.applySettings();
    if (A._bound) return;
    A._bound = true;
    // iOS only unlocks audio on touchend / click, so keep retrying until running
    const retry = () => {
      A.unlock();
      if (A.ctx && A.ctx.state === 'running') ['touchend', 'pointerup', 'click'].forEach((ev) => window.removeEventListener(ev, retry, true));
    };
    ['touchend', 'pointerup', 'click'].forEach((ev) => window.addEventListener(ev, retry, true));
    document.addEventListener('visibilitychange', () => { if (document.hidden) A.suspend(); else if (LP.Power.on) A.resume(); });
  };

  function pulseWave(ctx, duty) {
    const n = 40, re = new Float32Array(n), im = new Float32Array(n);
    for (let i = 1; i < n; i++) re[i] = 2 * Math.sin(i * Math.PI * duty) / (i * Math.PI);
    return ctx.createPeriodicWave(re, im);
  }

  // Create / resume the context. Safe to call on every input event.
  A.unlock = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended' && LP.Power.on && !document.hidden) A.ctx.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { A.ctx = new AC(); } catch (e) { return; }
    const c = A.ctx;
    A.master = c.createGain();
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.12;
    A.master.connect(comp); comp.connect(c.destination);
    A.sfxBus = c.createGain(); A.sfxBus.connect(A.master);
    A.musicBus = c.createGain(); A.musicBus.connect(A.master);
    A.noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = A.noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    A.waves.p12 = pulseWave(c, 0.125); A.waves.p25 = pulseWave(c, 0.25);
    A.applySettings();
    if (A.wantSong) A.startMusic(A.wantSong);
  };

  // Settings sfx / music (0..10) and muted -> bus gains. The two volumes are independent.
  A.applySettings = function () {
    const S = LP.Settings;
    A.levels.master = S.get('muted') ? 0 : 1;
    A.levels.sfx = Math.pow(LP.clamp(S.get('sfx'), 0, 10) / 10, 1.4) * A.sfxMax;
    A.levels.music = Math.pow(LP.clamp(S.get('music'), 0, 10) / 10, 1.4) * A.musicMax;
    if (!A.ctx) return;
    const now = A.ctx.currentTime;
    A.master.gain.setTargetAtTime(A.levels.master, now, 0.01);
    A.sfxBus.gain.setTargetAtTime(A.levels.sfx, now, 0.01);
    A.musicBus.gain.setTargetAtTime(A.levels.music, now, 0.01);
  };
  A.toggleMute = function () { LP.Settings.set('muted', !LP.Settings.get('muted')); A.applySettings(); return LP.Settings.get('muted'); };

  // ------------------------------------------------------------------ building blocks
  function track(src, t, dur) {
    src.start(t); src.stop(t + dur);
    A.active.add(src);
    src.onended = () => A.active.delete(src);
  }
  // Oscillator note. type: 'square' | 'triangle' | 'sine' | 'sawtooth' | 'p12' | 'p25' (narrow pulses)
  // Slides f0 -> f1 over dur. o = { bus: 'sfx' | 'music', attack, hold, vibrato (Hz), depth (Hz) }
  A.tone = function (type, f0, f1, t, dur, vol, o) {
    const c = A.ctx; if (!c) return;
    o = o || {};
    const s = c.createOscillator(), g = c.createGain();
    if (A.waves[type]) s.setPeriodicWave(A.waves[type]); else s.type = type;
    s.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) s.frequency.exponentialRampToValueAtTime(f1, t + dur);
    if (o.vibrato) {
      const l = c.createOscillator(), lg = c.createGain();
      l.frequency.value = o.vibrato; lg.gain.value = o.depth || 20;
      l.connect(lg); lg.connect(s.frequency); l.start(t); l.stop(t + dur + 0.05);
    }
    const a = o.attack || 0.004;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    if (o.hold) g.gain.setValueAtTime(vol, t + o.hold);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    s.connect(g); g.connect(o.bus === 'music' ? A.musicBus : A.sfxBus);
    track(s, t, dur + 0.03);
  };
  // Filtered noise burst. o = { filter: 'lowpass' | 'highpass' | 'bandpass', f0, f1, q, bus }
  A.noise = function (t, dur, vol, o) {
    const c = A.ctx; if (!c) return;
    o = o || {};
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = A.noiseBuf; s.loop = true;
    f.type = o.filter || 'lowpass'; f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.f0 || 2000, t);
    if (o.f1 && o.f1 !== o.f0) f.frequency.exponentialRampToValueAtTime(o.f1, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    s.connect(f); f.connect(g); g.connect(o.bus === 'music' ? A.musicBus : A.sfxBus);
    track(s, t, dur + 0.02);
  };
  A.midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // ------------------------------------------------------------------ sounds
  A.sound = function (name, fn) { A.sounds[name] = fn; };
  A.play = function (name, opts) {
    if (!A.ctx || A.ctx.state !== 'running' || !A.levels.master) return;
    const f = A.sounds[name];
    if (!f) { console.warn('LP.Audio: no sound "' + name + '"'); return; }
    f(A.ctx.currentTime + 0.005, opts || {});
  };
  // Stop every sound and note currently playing (music keeps its schedule unless stopped too).
  A.stopAll = function () { for (const s of A.active) { try { s.stop(); } catch (e) { /* ok */ } } A.active.clear(); };

  // ------------------------------------------------------------------ music (lookahead step sequencer)
  A.song = function (name, def) { A.songs[name] = def; };
  A.startMusic = function (name) {
    A.wantSong = name;
    if (!A.ctx) return;                                   // starts once audio unlocks
    const s = A.songs[name];
    if (!s) { console.warn('LP.Audio: no song "' + name + '"'); return; }
    if (A.song_ === s && A._timer) return;
    clearInterval(A._timer);
    A.song_ = s; A._step = 0; A._next = A.ctx.currentTime + 0.06;
    A._timer = setInterval(pump, 25);
    pump();
  };
  A.stopMusic = function () {
    A.wantSong = null; A.song_ = null;
    clearInterval(A._timer); A._timer = null;
  };
  function pump() {
    const s = A.song_, c = A.ctx;
    if (!s || !c || c.state !== 'running') return;
    const dur = 60 / s.bpm / (s.stepsPerBeat || 4);
    if (A._next < c.currentTime - 0.2) A._next = c.currentTime + 0.02;   // skip steps missed while throttled
    while (A._next < c.currentTime + 0.12) {
      s.step(A._step, A._next, dur);
      A._next += dur;
      A._step = (A._step + 1) % (s.length || 1e9);
    }
  }

  A.suspend = function () { if (A.ctx && A.ctx.state === 'running') A.ctx.suspend().catch(() => {}); };
  A.resume = function () { if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume().catch(() => {}); };

  LP.Audio = A;
})();
