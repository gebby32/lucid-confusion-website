// Browser-viewport fullscreen. Keep the iframe in place: moving or rebuilding it
// would discard the running game's document, audio and state.
export function createGameFullscreen({ player, viewport, button, status, handheld = false }) {
  let iframe, expanded = false, escapeHeld = false, savedSize;
  const touchDevice = matchMedia('(any-pointer: coarse)');
  const focusGame = () => iframe?.contentWindow?.focus();
  const screenOnly = () => !handheld || !touchDevice.matches;

  function clearFrameStyle() {
    if (!iframe) return;
    for (const property of ['width', 'height', 'transform', 'clip-path']) iframe.style.removeProperty(property);
  }

  function fit() {
    if (!expanded || !iframe) return;
    if (!screenOnly()) {
      // Touch handhelds retain their complete console and original hit regions.
      clearFrameStyle();
      return;
    }
    const doc = iframe.contentDocument;
    const screen = iframe.contentWindow.LP?.Shell?.screen
      || doc.querySelector('canvas#screen, canvas#lcd, canvas#lp-lcd');
    if (!screen) return;
    // Freeze the original layout and magnify only its live LCD/monitor. No game
    // resize, reparenting, canvas replacement or changes to its input coordinates.
    iframe.style.width = `${savedSize.width}px`;
    iframe.style.height = `${savedSize.height}px`;
    const r = screen.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const scale = Math.min(viewport.clientWidth / r.width, viewport.clientHeight / r.height);
    const x = (viewport.clientWidth - r.width * scale) / 2 - r.x * scale;
    const y = (viewport.clientHeight - r.height * scale) / 2 - r.y * scale;
    iframe.style.clipPath = `inset(${r.y}px ${savedSize.width - r.right}px ${savedSize.height - r.bottom}px ${r.x}px)`;
    iframe.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  }

  function setExpanded(value, focus = true) {
    if (value && !iframe) return;
    if (value && !expanded) savedSize = iframe.getBoundingClientRect();
    expanded = value;
    player.classList.toggle('game-expanded', value);
    button.setAttribute('aria-pressed', String(value));
    button.setAttribute('aria-label', value ? 'Exit Full Screen' : 'Full Screen');
    button.title = value ? 'Exit Full Screen (Escape)' : 'Full Screen';
    status.textContent = value ? 'Full Screen. Press Escape or the Full Screen button to exit.' : '';
    if (value) fit(); else clearFrameStyle();
    if (focus) focusGame();
  }

  function escapeKey(event) {
    if (event.key !== 'Escape' || (!expanded && !escapeHeld)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    escapeHeld = event.type === 'keydown';
    if (expanded) setExpanded(false);
  }
  const releaseEscape = () => { escapeHeld = false; };
  window.addEventListener('keydown', escapeKey, true);
  window.addEventListener('keyup', escapeKey, true);
  window.addEventListener('blur', releaseEscape);
  touchDevice.addEventListener('change', fit);
  new ResizeObserver(fit).observe(viewport);
  // Pointer activation must not blur the iframe: several games auto-pause on
  // blur. Keyboard users can still tab to and activate this ordinary button.
  button.addEventListener('pointerdown', event => event.preventDefault());
  button.addEventListener('click', () => setExpanded(!expanded));
  button.disabled = true;

  return {
    toggle: () => setExpanded(!expanded),
    isExpanded: () => expanded,
    attach(frame) {
      iframe = frame;
      button.disabled = false;
      const win = iframe.contentWindow;
      win.addEventListener('keydown', escapeKey, true);
      win.addEventListener('keyup', escapeKey, true);
      win.addEventListener('blur', releaseEscape);
      win.addEventListener('resize', fit);
    },
    reset() {
      setExpanded(false, false);
      escapeHeld = false;
      if (iframe) {
        const win = iframe.contentWindow;
        win.removeEventListener('keydown', escapeKey, true);
        win.removeEventListener('keyup', escapeKey, true);
        win.removeEventListener('blur', releaseEscape);
        win.removeEventListener('resize', fit);
      }
      iframe = null;
      button.disabled = true;
    },
  };
}
