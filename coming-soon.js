const panel = document.querySelector('#coming-soon-panel');
const video = panel.querySelector('video');

video.addEventListener('play', () => {
  if (panel.hidden || document.querySelector('#crt-content').hidden) video.pause();
});

export function showComingSoon() {
  panel.hidden = false;
  if (!video.hasAttribute('src')) video.src = video.dataset.src;
  panel.focus({ preventScroll: true });
}

function stopVideo() {
  video.pause();
  if (video.readyState) video.currentTime = 0;
}

export async function hideComingSoon() {
  stopVideo();
  panel.hidden = true;
  if (panel.contains(document.fullscreenElement)) await document.exitFullscreen().catch(() => {});
}

window.addEventListener('pagehide', stopVideo);
