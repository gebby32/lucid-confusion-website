const frame = document.querySelector('#retro-frame');
const panel = document.querySelector('#retro-panel');
const grid = document.querySelector('#retro-grid');
const status = document.querySelector('#retro-status');
const player = document.querySelector('#retro-player');
const viewport = document.querySelector('#retro-game-viewport');
const backImage = document.querySelector('#retro-back img');
const fullscreenStatus = document.querySelector('#retro-fullscreen-status');
let selected = null, selectedLink = null, shown = false, generation = 0;
let catalogPromise, fullscreenOperation = Promise.resolve(), fullscreenPending = false, returning = false;
export const isRetroPlaying = () => selected !== null;

export async function retroTeaser(draw) {
  if (!frame.hasAttribute('src')) frame.src = './assets/retro-arcade/art/frame.png';
  await frame.decode();
  const canvas = document.createElement('canvas');
  canvas.width = frame.naturalWidth; canvas.height = frame.naturalHeight;
  const context = canvas.getContext('2d'), font = getComputedStyle(panel).fontFamily;
  const title = 'RETRO GAMES', prompt = '< CLICK TO VIEW >', total = title.length + prompt.length;
  const start = performance.now(), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function type(now) {
    const count = reduce ? total : Math.min(total, Math.floor((now - start) / 45));
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(frame, 0, 0);
    context.fillStyle = '#39ff6a'; context.textAlign = 'center'; context.shadowColor = '#39ff6a30'; context.shadowBlur = 3;
    context.font = `76px ${font}`; context.fillText(title.slice(0, count), canvas.width / 2, canvas.height * .47);
    context.font = `54px ${font}`; context.fillText(prompt.slice(0, Math.max(0, count - title.length)), canvas.width / 2, canvas.height * .58);
    context.shadowBlur = 0;
    if (draw(canvas) && count < total) requestAnimationFrame(type);
  }
  type(start);
}

async function toggleFullscreen() {
  if (!selected || returning || fullscreenPending) return;
  if (!player.requestFullscreen || !document.fullscreenEnabled) {
    fullscreenStatus.textContent = 'Fullscreen is not supported in this browser.'; return;
  }
  fullscreenPending = true; fullscreenStatus.textContent = '';
  try {
    fullscreenOperation = document.fullscreenElement ? document.exitFullscreen() : player.requestFullscreen();
    await fullscreenOperation;
  } catch { fullscreenStatus.textContent = 'Fullscreen is unavailable. The game remains in window view.'; }
  finally { fullscreenPending = false; if (selected) viewport.querySelector('iframe')?.contentWindow?.focus(); }
}
function fullscreenKey(event) {
  if (!selected || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.key.toLowerCase() !== 'f') return;
  // Approved exception: F is player-two fire/confirm in Slubble Slobble.
  if (selected.id === 'slubble-slobble' || event.target.isContentEditable || event.target.closest?.('input, textarea, select')) return;
  const game = viewport.querySelector('iframe')?.contentWindow;
  if (game?.LP?.States?.current === 'entry') return;
  event.preventDefault(); event.stopImmediatePropagation();
  toggleFullscreen();
}
window.addEventListener('keydown', fullscreenKey, true);
document.addEventListener('fullscreenchange', () => { if (selected) viewport.querySelector('iframe')?.contentWindow?.focus(); });
document.querySelector('#retro-back').addEventListener('click', async () => {
  if (!selected || returning) return;
  returning = true;
  try {
    if (fullscreenPending) await fullscreenOperation.catch(() => {});
    if (document.fullscreenElement) await document.exitFullscreen();
    viewport.replaceChildren(); selected = null; player.hidden = true;
    document.body.classList.remove('retro-playing');
    selectedLink?.focus({ preventScroll: true });
  } catch { fullscreenStatus.textContent = 'Could not exit fullscreen. Please try Back to Arcade again.'; }
  finally { returning = false; }
});

export async function showRetroArcade() {
  if (shown) { if (selected) viewport.querySelector('iframe')?.contentWindow?.focus(); return; }
  shown = true; const current = ++generation;
  status.textContent = 'Loading games…'; status.hidden = false;
  try {
    catalogPromise ||= fetch('./assets/retro-arcade/catalog.json').then(response => {
      if (!response.ok) throw new Error('Catalog unavailable'); return response.json();
    }).catch(error => { catalogPromise = null; throw error; });
    const games = await catalogPromise;
    if (!shown || generation !== current) return;
    grid.replaceChildren(...games.map(game => {
      const item = document.createElement(game.url ? 'a' : 'div');
      const image = document.createElement('img');
      image.src = game.image; image.width = game.width; image.height = game.height;
      image.alt = game.url ? '' : game.title; image.loading = 'lazy'; image.decoding = 'async';
      const label = document.createElement('span'); label.textContent = game.url ? game.title : 'COMING SOON...';
      item.append(image, label);
      if (game.url) {
        item.href = game.url;
        item.addEventListener('click', event => {
          if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
          event.preventDefault(); if (selected) return;
          selected = game; selectedLink = item; fullscreenStatus.textContent = '';
          if (!backImage.hasAttribute('src')) backImage.src = './assets/retro-arcade/art/back.png';
          const iframe = document.createElement('iframe');
          iframe.title = game.title; iframe.allow = 'autoplay; fullscreen; gamepad'; iframe.src = game.url;
          iframe.addEventListener('load', () => {
            if (selected !== game) return;
            const win = iframe.contentWindow;
            win.addEventListener('keydown', fullscreenKey, true);
            // Delegate only Plumbing's fullscreen UI to the containing player,
            // so existing F2/menu/touch fullscreen also keeps Back visible.
            if (win.LP?.Shell) {
              win.LP.Shell.toggleFullscreen = toggleFullscreen;
              win.LP.Shell.isFullscreen = () => !!document.fullscreenElement;
            }
            win.focus();
          });
          player.hidden = false; document.body.classList.add('retro-playing'); viewport.replaceChildren(iframe);
        });
      }
      return item;
    }));
    status.hidden = true; grid.focus({ preventScroll: true });
  } catch { if (shown && generation === current) status.textContent = 'Games could not load. Go back and try again.'; }
}
export function hideRetroArcade() {
  shown = false; generation++; grid.replaceChildren(); status.hidden = true;
}
