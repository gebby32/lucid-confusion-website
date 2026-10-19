/* ============================================================================
   LUCID PLUMBING — storage, settings, high scores
   Everything is namespaced by config.storage ("<namespace>.<key>" in localStorage)
   and wrapped in try/catch: blocked or broken storage never crashes the game.

   LP.Store.get(key, fallback) / set(key, value) / remove(key)      JSON values
   LP.Settings.get(k) / set(k, v) / reset()
       built-in: sfx 0..10, music 0..10, contrast 1..5, muted
       extra game settings: config.settings = { hard: false, palette: 0, ... }
   LP.Scores  (promise-based so an online leaderboard can replace it later —
       implement the same three methods and assign it to LP.Scores)
       list()                  -> Promise<[{ name, score, date, ...extra }]> best first
       qualifies(score)        -> Promise<bool>
       submit(name, score, extra) -> Promise<rank index, or -1 if it didn't place>
   ============================================================================ */
'use strict';
(function () {
  const Store = {
    ns: 'lp-game',
    init(ns) {
      if (!ns) console.warn('LP.Store: config.storage is missing — every game needs a unique namespace.');
      this.ns = ns || 'lp-game';
    },
    get(key, fallback) {
      try { const raw = window.localStorage.getItem(this.ns + '.' + key); return raw === null ? fallback : JSON.parse(raw); }
      catch (e) { return fallback; }
    },
    set(key, value) {
      try { window.localStorage.setItem(this.ns + '.' + key, JSON.stringify(value)); return true; }
      catch (e) { return false; }
    },
    remove(key) { try { window.localStorage.removeItem(this.ns + '.' + key); } catch (e) { /* ignore */ } }
  };

  const BASE_SETTINGS = { sfx: 8, music: 6, contrast: 3, muted: false };
  const Settings = {
    defaults: null, data: {},
    init(extra) {
      this.defaults = Object.assign({}, BASE_SETTINGS, extra);
      const saved = Store.get('settings', {}) || {};
      this.data = {};
      for (const k in this.defaults) {
        const v = saved[k], d = this.defaults[k];
        // keep a saved value only if it has the default's type (and is a real number)
        this.data[k] = typeof v === typeof d && (typeof v !== 'number' || isFinite(v)) ? v : d;
      }
    },
    get(k) { return this.data[k]; },
    set(k, v) { this.data[k] = v; Store.set('settings', this.data); },
    reset() { this.data = Object.assign({}, this.defaults); Store.set('settings', this.data); }
  };

  const LocalScores = {
    max: 15, nameLength: 3, seed: [],
    init(cfg) {
      cfg = cfg || {};
      this.max = cfg.max || 15;
      this.nameLength = cfg.nameLength || 3;
      this.seed = (cfg.seed || []).map((s) => ({ name: s[0], score: s[1], date: 0 }));
    },
    _read() {
      const saved = Store.get('scores', null);
      const list = Array.isArray(saved) ? saved.filter((e) => e && typeof e.name === 'string' && typeof e.score === 'number') : this.seed.map((e) => Object.assign({}, e));
      list.sort((a, b) => b.score - a.score || (a.date || 0) - (b.date || 0));
      return list.slice(0, this.max);
    },
    cleanName(name) { return String(name || '').toUpperCase().replace(/[^A-Z0-9 .!?-]/g, '').slice(0, this.nameLength).padEnd(this.nameLength, ' '); },
    list() { return Promise.resolve(this._read()); },
    qualifies(score) {
      const l = this._read();
      return Promise.resolve(score > 0 && (l.length < this.max || score > l[l.length - 1].score));
    },
    submit(name, score, extra) {
      const l = this._read();
      const e = Object.assign({}, extra, { name: this.cleanName(name), score: Math.floor(score), date: Date.now() });
      l.push(e);
      l.sort((a, b) => b.score - a.score || (a.date || 0) - (b.date || 0));   // ties: older entry stays ahead
      if (l.length > this.max) l.length = this.max;
      Store.set('scores', l);
      return Promise.resolve(l.indexOf(e));
    },
    clear() { Store.remove('scores'); }
  };

  LP.Store = Store;
  LP.Settings = Settings;
  LP.Scores = LocalScores;
})();
