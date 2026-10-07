/* ============================================================================
   LUCID PLUMBING — core
   Namespace, tiny helpers, fixed-step loop (pause / hit-stop / manual stepping),
   app states, optional power switch, and LP.boot(config) which wires everything.
   Plumbing owns WIRING. The game owns IDENTITY. Nothing here knows about heroes,
   enemies, attacks or any particular handheld.
   ============================================================================ */
'use strict';
window.LP = window.LP || {};

(function () {
  // ------------------------------------------------------------------ helpers
  LP.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  LP.lerp = (a, b, t) => a + (b - a) * t;
  LP.approach = (v, target, step) => (v < target ? Math.min(v + step, target) : Math.max(v - step, target));
  LP.rand = (lo, hi) => lo + Math.random() * (hi - lo);
  LP.randi = (lo, hi) => Math.floor(lo + Math.random() * (hi - lo + 1));
  LP.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  LP.chance = (p) => Math.random() < p;
  LP.pad = (n, len) => String(Math.max(0, Math.floor(n))).padStart(len, '0');
  // Remove every item for which dead(item) is true, in place.
  LP.prune = (arr, dead) => { let j = 0; for (let i = 0; i < arr.length; i++) if (!dead(arr[i])) arr[j++] = arr[i]; arr.length = j; return arr; };

  // Asset path -> URL. The portable builder fills window.LP_ASSETS with data: URIs;
  // in the modular project this returns the path unchanged. Use it for every runtime image.
  LP.asset = (path) => (window.LP_ASSETS && window.LP_ASSETS[path]) || path;
  LP.loadImage = (path) => { const img = new Image(); img.src = LP.asset(path); return img; };

  // ------------------------------------------------------------------ app states
  // LP.States.add({ title: { enter(arg, prev), update(dt), render(ctx), exit(next) }, ... })
  // Every hook is optional. States.t = seconds spent in the current state.
  const States = {
    list: {}, current: null, prev: null, t: 0,
    add(defs) { Object.assign(this.list, defs); },
    go(name, arg) {
      const next = this.list[name];
      if (!next) throw new Error('LP.States: unknown state "' + name + '"');
      const cur = this.list[this.current];
      if (cur && cur.exit) cur.exit(name);
      this.prev = this.current; this.current = name; this.t = 0;
      if (next.enter) next.enter(arg, this.prev);
    },
    is(name) { return this.current === name; },
    update(dt) { this.t += dt; const s = this.list[this.current]; if (s && s.update) s.update(dt); },
    render(ctx) { const s = this.list[this.current]; if (s && s.render) s.render(ctx); }
  };

  // ------------------------------------------------------------------ loop
  // Fixed-step simulation (default 60 Hz), rendered once per animation frame that stepped.
  // Per step:  FX screen timers -> power button -> [hit-stop? skip] -> update(dt) -> Input.endStep()
  // Input press edges are only cleared after update() actually ran, so taps during hit-stop
  // or between frames are never lost.
  const Loop = {
    dt: 1 / 60, time: 0, frame: 0, hold: 0, paused: false, manual: false,
    _update: null, _render: null, _acc: 0, _last: 0,
    start(update, render) {
      this._update = update; this._render = render;
      this._last = performance.now();
      const frame = (now) => {
        requestAnimationFrame(frame);
        this._acc += Math.min(0.25, (now - this._last) / 1000); this._last = now;
        if (this.manual) { this._acc = 0; return; }       // tests drive Loop.step() themselves
        let n = 0;
        while (this._acc >= this.dt && n < 6) { this.tick(); this._acc -= this.dt; n++; }
        if (n === 6) this._acc = 0;
        if (n) this.draw();
      };
      requestAnimationFrame(frame);
    },
    tick() {
      LP.FX.tickScreen();
      Power.check();
      if (!Power.on || this.paused) { LP.Input.endStep(); return; }
      if (this.hold > 0) { this.hold--; return; }         // hit-stop: presses stay latched
      this._update(this.dt);
      this.time += this.dt; this.frame++;
      LP.Input.endStep();
    },
    draw() {
      LP.Shell.refresh();
      if (!Power.on) return;
      this._render(LP.LCD.ctx);
      LP.LCD.present();
    },
    step(n) { for (let i = 0; i < (n || 1); i++) this.tick(); this.draw(); },
    hitstop(frames) { this.hold = Math.max(this.hold, frames | 0); },
    pause() { this.paused = true; },
    resume() { this.paused = false; },
    // Clean restart: clock, hit-stop, latched presses and effects.
    reset() { this.time = 0; this.frame = 0; this.hold = 0; this.paused = false; LP.Input.clearPresses(); LP.FX.clear(); }
  };

  // ------------------------------------------------------------------ power (optional)
  // config.power = { action: 'power', startOn: true, onState: 'boot', onChange(on) } or null.
  // Off: LCD hidden (the artwork's own glass or shell.screen.offColor shows), music stops,
  // the game is not updated or rendered. On: jumps to onState.
  const Power = {
    enabled: false, on: true, cfg: null,
    init(cfg) {
      this.cfg = cfg || null; this.enabled = !!cfg;
      this.on = !cfg || cfg.startOn !== false;
      LP.Shell.setOff(!this.on);
    },
    check() { if (this.enabled && LP.Input.consume(this.cfg.action || 'power')) this.set(!this.on); },
    set(on) {
      if (!this.enabled || on === this.on) return;
      this.on = on;
      LP.Shell.setOff(!on);
      LP.Input.releaseAll();
      if (on) {
        LP.Audio.resume(); LP.LCD.resetGhost(); Loop.reset();
        States.go(this.cfg.onState || 'boot');
      } else {
        LP.Audio.stopMusic();
      }
      if (this.cfg.onChange) this.cfg.onChange(on);
    },
    toggle() { this.set(!this.on); }
  };

  // ------------------------------------------------------------------ boot
  // Wires every Plumbing module from the game config. Call once from js/main.js
  // (calling again with another config rebuilds the shell — used by tools/smoke-test.html).
  LP.boot = function (cfg) {
    LP.config = cfg;
    LP.Store.init(cfg.storage);
    LP.Settings.init(cfg.settings);
    LP.Scores.init(cfg.scores);
    LP.Shell.init(cfg);
    LP.LCD.init(cfg.lcd, LP.Shell.canvas);
    LP.LCD.setContrast(LP.Settings.get('contrast'));
    LP.Shell.fit();
    LP.Input.init(cfg);
    LP.Audio.init(cfg.audio);
    Loop.dt = 1 / (cfg.fps || 60);
    Power.init(cfg.power);
  };

  LP.States = States;
  LP.Loop = Loop;
  LP.Power = Power;
})();
