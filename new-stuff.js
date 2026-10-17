const panel = document.querySelector('#new-stuff-panel');
const videos = [...panel.querySelectorAll('video')];

for (const video of videos) {
  video.addEventListener('play', () => {
    if (panel.hidden || document.querySelector('#crt-content').hidden) { video.pause(); return; }
    for (const other of videos) if (other !== video) other.pause();
  });
}

export function showNewStuff() {
  panel.hidden = false;
  panel.scrollTop = 0;
  for (const video of videos) if (!video.hasAttribute('src')) video.src = video.dataset.src;
  panel.focus({ preventScroll: true });
}

function stopVideos() {
  for (const video of videos) {
    video.pause();
    if (video.readyState) video.currentTime = 0;
  }
}

export async function hideNewStuff() {
  stopVideos();
  panel.hidden = true;
  if (panel.contains(document.fullscreenElement)) await document.exitFullscreen().catch(() => {});
}

window.addEventListener('pagehide', stopVideos);
