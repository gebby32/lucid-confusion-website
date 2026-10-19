/* ============================================================================
   LUCID PLUMBING — arcade monitor (full-screen games)
   Drop-in alternative to shell.js for FULL-SCREEN arcade games: no handheld
   artwork, the browser viewport IS the arcade monitor. Load monitor.js instead
   of shell.js; it provides the same LP.Shell interface that core / input / lcd
   use (init, fit, canvas, view, toArt, toClient, refresh, setOff).

   config.monitor = {
     background: '#000',     page colour around the picture
     fit: 'pixel',           'pixel' = largest INTEGER scale that fits (crisp, even pixels;
                             falls back to 'fill' when that would use less than minFill
                             of the available size, e.g. 1x in a 600px window)
                             'fill'  = largest scale that fits, nearest-neighbour
     minFill: 0.8
     cursorHide: 2.5         seconds of mouse stillness before the pointer hides (0 = never)
   }
   The picture always keeps the game's pixel aspect ratio and is never smoothed.

   Extras:
     LP.Shell.setFit('pixel' | 'fill')
     LP.Shell.toggleFullscreen() / isFullscreen()   (call from an input handler / update
                                                     shortly after a key press)
     Pointer coordinates (toArt) are GAME PIXELS, so config.controls zones, if a game
     wants on-screen buttons, are written in game pixels.
     ?debug in the URL shows scale / state / held actions.
   ============================================================================ */
'use strict';
(function () {
  const S = {
    cfg: null, stage: null, view: null, screen: null, canvas: null, readout: null,
    fitMode: 'pixel', scale: 1, debug: false, _bound: false, _idle: 0, _cursorT: null
  };

  function el(tag, id, parent) { const e = document.createElement(tag); if (id) e.id = id; if (parent) parent.appendChild(e); return e; }

  S.init = function (cfg) {
    S.cfg = cfg;
    const m = cfg.monitor || {};
    if (S.stage) S.stage.remove();
    S.stage = el('div', 'lp-stage', document.body);
    S.stage.classList.add('lp-monitor');
    S.view = el('div', 'lp-view', S.stage);
    S.screen = S.view;                                     // the whole view is the screen
    S.canvas = el('canvas', 'lp-lcd', S.view);
    S.fitMode = m.fit === 'fill' ? 'fill' : 'pixel';
    document.body.style.background = m.background || '#000';
    S.debug = !!cfg.debug || /[?&]debug\b/.test(location.search);
    if (S.debug) S.readout = document.getElementById('lp-readout') || el('div', 'lp-readout', document.body);

    if (!S._bound) {
      S._bound = true;
      window.addEventListener('resize', S.fit);
      if (window.visualViewport) window.visualViewport.addEventListener('resize', S.fit);
      window.addEventListener('orientationchange', () => setTimeout(S.fit, 200));
      document.addEventListener('fullscreenchange', () => setTimeout(S.fit, 50));
      // hide the mouse pointer while it is still — it's an arcade monitor
      const wake = () => {
        S.stage.classList.remove('lp-nocursor');
        clearTimeout(S._cursorT);
        const t = (S.cfg.monitor && S.cfg.monitor.cursorHide);
        if (t !== 0) S._cursorT = setTimeout(() => S.stage.classList.add('lp-nocursor'), (t || 2.5) * 1000);
      };
      window.addEventListener('pointermove', wake);
      wake();
    }
  };

  S.setFit = function (mode) { S.fitMode = mode === 'fill' ? 'fill' : 'pixel'; S.fit(); };

  // Size the picture: integer device-pixel scale when it fits ('pixel'), else largest fit.
  S.fit = function () {
    if (!S.cfg || !LP.LCD.W) return;
    const W = LP.LCD.W, H = LP.LCD.H, vv = window.visualViewport;
    const vw = vv ? vv.width : window.innerWidth, vh = vv ? vv.height : window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    const kFit = Math.min(vw * dpr / W, vh * dpr / H), kInt = Math.floor(kFit);
    let cssW, cssH, k;
    // integer scaling whenever it still fills most of the screen (e.g. 4x on 1080p)
    if (S.fitMode === 'pixel' && kInt >= 1 && kInt / kFit >= (S.cfg.monitor && S.cfg.monitor.minFill || 0.8)) {
      k = kInt; cssW = W * k / dpr; cssH = H * k / dpr;
    } else {
      const s = Math.min(vw / W, vh / H);
      cssW = W * s; cssH = H * s;
      k = LP.clamp(Math.ceil(s * dpr), 1, 10);
    }
    S.scale = cssW / W;
    // snap the top-left corner to a whole device pixel so integer scaling stays exact
    const left = Math.floor((vw - cssW) / 2 * dpr) / dpr, top = Math.floor((vh - cssH) / 2 * dpr) / dpr;
    Object.assign(S.view.style, { width: cssW + 'px', height: cssH + 'px', left: left + 'px', top: top + 'px' });
    LP.LCD.setScale(k);
  };

  S.setOff = function (off) { S.view.classList.toggle('lp-off', !!off); };

  // Pointer position -> game pixels.
  S.toArt = function (clientX, clientY) {
    const r = S.view.getBoundingClientRect();
    return [(clientX - r.left) / r.width * LP.LCD.W, (clientY - r.top) / r.height * LP.LCD.H];
  };
  S.toClient = function (x, y) {
    const r = S.view.getBoundingClientRect();
    return [r.left + x / LP.LCD.W * r.width, r.top + y / LP.LCD.H * r.height];
  };

  S.isFullscreen = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  S.toggleFullscreen = function () {
    try {
      if (S.isFullscreen()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else {
        const e = document.documentElement, req = e.requestFullscreen || e.webkitRequestFullscreen;
        const p = req && req.call(e, { navigationUI: 'hide' });
        if (p && p.catch) p.catch(() => {});
      }
    } catch (err) { /* fullscreen not available (iframe, old browser) */ }
  };

  // Called by LP.Loop every rendered frame.
  S.refresh = function () {
    if (!S.debug || !S.readout) return;
    S.readout.textContent = 'game ' + LP.LCD.W + 'x' + LP.LCD.H + ' @' + LP.LCD.k + 'x (' + S.fitMode + ')' +
      '   state ' + (LP.States.current || '-') + '\nheld ' + [...LP.Input.heldSet].join(' ');
  };

  LP.Shell = S;
})();
