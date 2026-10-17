import { navigate, routeBack } from './router.js';
import { typePreviewText } from './assets/arcade/preview-text.js';
const panel = document.querySelector('#links-panel');
const main = document.querySelector('#links-battle');
const beach = document.querySelector('#links-beach');
const status = document.querySelector('#links-status');
let opener;
const notice = document.querySelector('#links-apple-notice');
let noticeTimer;
function dismissNotice() { clearTimeout(noticeTimer); notice.hidden = true; }
export function beachState(show, trigger = panel.querySelector("[data-beach]")) {
  dismissNotice();
  if (show) {
    opener = trigger;
    const image = beach.querySelector('img');
    if (!image.hasAttribute('src')) image.src = image.dataset.src;
  }
  main.hidden = show; beach.hidden = !show;
  status.textContent = show ? 'Beach break. Activate the beach image to return to the links.' : '';
  if (show) { beach.focus({preventScroll:true}); beach.scrollIntoView({block:'center',behavior:'instant'}); }
  else opener?.focus({preventScroll:true});
}
panel.querySelectorAll('[data-beach]').forEach(button => button.addEventListener('click', () => navigate('/links/beach')));
beach.addEventListener('click', () => routeBack());
panel.querySelector('.links-apple').addEventListener('click', () => {
  dismissNotice(); notice.hidden = false; noticeTimer = setTimeout(dismissNotice, 4500);
});
panel.addEventListener('click', event => { if (!event.target.closest('.links-apple')) dismissNotice(); });
// Anchors retain native Enter/new-tab semantics; Space also activates a focused sign.
panel.addEventListener('keydown', event => {
  if (event.code === 'Space' && event.target.matches('a[href]') && !event.repeat) {
    event.preventDefault(); event.target.click();
  }
});
export function showLinks() {
  dismissNotice();
  main.hidden = false; beach.hidden = true; status.textContent = ''; opener = null;
  panel.querySelectorAll('img[data-src]:not(#links-beach img)').forEach(image => {
    if (!image.hasAttribute('src')) image.src = image.dataset.src;
  });
  document.querySelector('#crt-content').scrollTop = 0;
  panel.querySelector('.links-google').focus({preventScroll:true});
}
export async function linksTeaser(draw) {
  const frame = document.querySelector('#links-frame');
  if (!frame.hasAttribute('src')) frame.src = frame.dataset.src;
  await frame.decode();
  const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 768;
  typePreviewText(canvas, ctx => {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
  }, [
    { text: 'Important Links to', y: 315, size: 48 },
    { text: 'Important Things', y: 380, size: 48 },
    { text: '<click to continue>', y: 475, size: 36 },
  ], draw);
}
