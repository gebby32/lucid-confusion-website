const panel = document.querySelector('#links-panel');
const main = document.querySelector('#links-battle');
const beach = document.querySelector('#links-beach');
const status = document.querySelector('#links-status');
let opener;
const notice = document.querySelector('#links-apple-notice');
let noticeTimer;
function dismissNotice() { clearTimeout(noticeTimer); notice.hidden = true; }
function beachState(show, trigger) {
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
panel.querySelectorAll('[data-beach]').forEach(button => button.addEventListener('click', () => beachState(true, button)));
beach.addEventListener('click', () => beachState(false));
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
export function linksTeaser() {
  const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 768;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#000'; ctx.fillRect(0,0,1024,768);
  ctx.fillStyle = '#39ff6a'; ctx.textAlign = 'center'; ctx.shadowColor = '#39ff6a'; ctx.shadowBlur = 7;
  ctx.font = '48px monospace'; ctx.fillText('Important Links to',512,315); ctx.fillText('Important Things',512,380);
  ctx.font = '36px monospace'; ctx.fillText('<click to continue>',512,475);
  return canvas;
}
