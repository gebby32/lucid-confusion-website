import { navigate, routeBack, startRouter } from './router.js';
import * as THREE from 'three';
import { GLTFLoader } from './assets/vendor/three/loaders/GLTFLoader.js';
import { CabinetScreen, zoomToScreen } from './assets/arcade/screen-controller.js';
import './contact.js';
import { handheldTeaser, showHandhelds, hideHandhelds, isHandheldPlaying, launchHandheld, stopHandheld } from './handheld.js';
import { retroTeaser, showRetroArcade, hideRetroArcade, isRetroPlaying, launchRetro, stopRetro } from './retro-arcade.js';
import { linksTeaser, showLinks, beachState } from './links.js';

// Cabinet models retain their original IDs; public URLs are centralized in routes.js.
const cabinets = [
  { id: 'about-us', name: 'About Us', href: null },
  { id: 'retro-handheld', name: 'Retro Handheld', href: null },
  { id: 'retro-arcade', name: 'Retro Arcade', href: null },
  { id: 'demo-arcade', name: 'Demo Arcade', href: null },
  { id: 'merch-shop', name: 'Merch Shop', href: null },
  { id: 'the-links', name: 'The Links', href: null },
  { id: 'new-stuff', name: 'New Stuff', href: null },
  { id: 'coming-soon', name: 'Coming Soon', href: null },
  { id: 'contact-us', name: 'Contact Us', href: null },
];
// Visual tuning lives here. Original geometry, materials and files are preserved.
const settings = { radius: 2.25, cabinetHeight: 1.8, fov: 36, cameraDistance: 9.6, cameraElevation: 0.29 };
const stage = document.querySelector('#arcade');
const loading = document.querySelector('#loading');
const announcement = document.querySelector('#announcement');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const step = Math.PI * 2 / cabinets.length;
const wrap = n => ((n % cabinets.length) + cabinets.length) % cabinets.length;
let angle = -2 * step, target = angle, active = 2, velocity = 0;
let pointer = null, frame = 0, lastFrame = 0, renderer;
let scene, camera, ring, raycaster;
const models = [];
const screens = new Map();
const returnButton = document.querySelector('#screen-return');
let touchInput = matchMedia('(hover: none)').matches;
let hoverPoint = null, litIndex = null, focusedScreen = null, cancelZoom = null;
let lastMonitorTap = null, zoomTransition = false;
let view = 'carousel', monitorTapTimer = null;
const crtContent = document.querySelector('#crt-content');
const aboutStory = document.querySelector('#about-story');
const contactPanel = document.querySelector('#contact-panel');
const handheldPanel = document.querySelector('#handheld-panel');
const retroPanel = document.querySelector('#retro-panel');
const linksPanel = document.querySelector('#links-panel');
document.querySelector('#links-return').addEventListener('click', () => routeBack('/links'));
// Reading gestures belong to the HTML story; double activation on the frame
// retains the one-level return gesture without interrupting text selection.
let framePress = null;
crtContent.addEventListener('pointerdown', event => {
  framePress = !linksPanel.contains(event.target) && !aboutStory.contains(event.target) && !contactPanel.contains(event.target) && !handheldPanel.contains(event.target) && !retroPanel.contains(event.target) && event.isPrimary && event.button === 0
    ? { x: event.clientX, y: event.clientY } : null;
});
crtContent.addEventListener('pointerup', event => {
  const press = framePress;
  framePress = null;
  if (!press || view !== 'crt' || zoomTransition || linksPanel.contains(event.target) || aboutStory.contains(event.target) || contactPanel.contains(event.target) || handheldPanel.contains(event.target) || retroPanel.contains(event.target)
    || Math.hypot(event.clientX - press.x, event.clientY - press.y) > 7) return;
  const tap = { time: event.timeStamp, x: event.clientX, y: event.clientY, type: event.pointerType };
  if (lastMonitorTap && tap.type === lastMonitorTap.type && tap.time - lastMonitorTap.time < 400
    && Math.hypot(tap.x - lastMonitorTap.x, tap.y - lastMonitorTap.y) < 28) backOneLevel();
  else lastMonitorTap = tap;
});
crtContent.addEventListener('pointercancel', () => { framePress = null; clearMonitorTap(); });

function clearMonitorTap() {
  clearTimeout(monitorTapTimer);
  monitorTapTimer = null;
  lastMonitorTap = null;
}

function fullCRTPose(screen) {
  const pose = screen.focusPose(1);
  const normal = pose.position.clone().sub(pose.target).normalize();
  const probe = new THREE.PerspectiveCamera(camera.fov, camera.aspect, 0.01, 100);
  const positions = screen.display.geometry.attributes.position;
  let distance = 0.25;
  for (let i = 0; i < 100; i++) {
    probe.position.copy(pose.target).addScaledVector(normal, distance);
    probe.lookAt(pose.target); probe.updateMatrixWorld();
    let extent = 0;
    const point = new THREE.Vector3();
    for (let j = 0; j < positions.count; j++) {
      point.fromBufferAttribute(positions, j).applyMatrix4(screen.display.matrixWorld).project(probe);
      extent = Math.max(extent, Math.abs(point.x), Math.abs(point.y));
    }
    if (extent <= 0.94) break;
    distance *= 1.02;
  }
  pose.position.copy(probe.position);
  pose.offsetY = 0;
  return pose;
}

function changeZoomView(next, restoring = false) {
  if (!focusedScreen) return;
  if (!restoring) {
    if (next === 'cabinet') routeBack(cabinetPath());
    else navigate(cabinetPath() + ([1, 2].includes(active) ? '/games' : '/view'));
    return;
  }
  cancelZoom?.();
  clearMonitorTap();
  view = next;
  document.body.classList.toggle('links-open', next === 'crt' && cabinets[active].id === 'the-links');
  zoomTransition = true;
  crtContent.hidden = true;
  returnButton.hidden = true;
  if (aboutStory.contains(document.activeElement)) stage.focus({ preventScroll: true });
  if (linksPanel.contains(document.activeElement)) stage.focus({ preventScroll: true });
  if (contactPanel.contains(document.activeElement)) stage.focus({ preventScroll: true });
  if (handheldPanel.contains(document.activeElement)) stage.focus({ preventScroll: true });
  if (next !== 'crt') hideHandhelds();
  if (retroPanel.contains(document.activeElement)) stage.focus({ preventScroll: true });
  if (next !== 'crt') {
    hideRetroArcade();
    if (cabinets[active].id === 'retro-arcade') showScreenMessage(focusedScreen);
  }
  stage.parentElement.classList.toggle('crt-open', view === 'crt');
  camera.aspect = stage.clientWidth / stage.clientHeight;
  renderer.setSize(stage.clientWidth, stage.clientHeight);
  returnButton.textContent = view === 'crt' ? 'Back to Cabinet' : 'Back to arcade';
  const pose = view === 'crt' ? fullCRTPose(focusedScreen) : zoomPose(focusedScreen);
  const fromZoom = camera.zoom, fromOffset = camera.view?.offsetY || 0;
  const duration = reducedMotion.matches ? 1 : 650, started = performance.now();
  const controls = { enabled: true, target: camera.position.clone().addScaledVector(camera.getWorldDirection(new THREE.Vector3()), 1), update() {
    const t = Math.min(1, (performance.now() - started) / duration), ease = t * t * (3 - 2 * t);
    camera.zoom = THREE.MathUtils.lerp(fromZoom, 1, ease);
    camera.setViewOffset(stage.clientWidth, stage.clientHeight, 0, THREE.MathUtils.lerp(fromOffset, pose.offsetY, ease), stage.clientWidth, stage.clientHeight);
    camera.lookAt(this.target); camera.updateMatrixWorld(); invalidate();
  } };
  cancelZoom = zoomToScreen({ screen: { focusPose: () => pose }, camera, controls, duration, onComplete() {
    zoomTransition = false;
    camera.zoom = 1;
    camera.setViewOffset(stage.clientWidth, stage.clientHeight, 0, pose.offsetY, stage.clientWidth, stage.clientHeight);
    if (view === 'crt') {
      const isAbout = cabinets[active].id === 'about-us';
      const isContact = cabinets[active].id === 'contact-us';
      const isHandheld = cabinets[active].id === 'retro-handheld';
      const isRetro = cabinets[active].id === 'retro-arcade';
      const isLinks = cabinets[active].id === 'the-links';
      returnButton.classList.toggle('game-return', isHandheld || isRetro || isAbout);
      returnButton.replaceChildren();
      if (isHandheld || isRetro || isAbout) {
        const image = document.createElement('img');
        image.src = './assets/arcade/art/back-to-cabinet-transparent.png';
        image.alt = 'Back to Cabinet'; image.width = 216; image.height = 72; image.draggable = false;
        returnButton.append(image);
      } else returnButton.textContent = 'Back to Cabinet';
      returnButton.hidden = isLinks;
      crtContent.classList.toggle('links-view', isLinks);
      linksPanel.hidden = !isLinks;
      crtContent.classList.toggle('about-view', isAbout);
      crtContent.classList.toggle('contact-view', isContact);
      crtContent.classList.toggle('handheld-view', isHandheld);
      document.querySelector('#handheld-frame').hidden = !isHandheld;
      handheldPanel.hidden = !isHandheld;
      crtContent.classList.toggle('retro-view', isRetro);
      document.querySelector('#retro-frame').hidden = !isRetro;
      retroPanel.hidden = !isRetro;
      document.querySelector('#crt-title').hidden = isAbout || isContact || isHandheld || isRetro || isLinks;
      document.querySelector('#crt-placeholder').hidden = isAbout || isContact || isHandheld || isRetro || isLinks;
      document.querySelector('#contact-frame').hidden = !isContact;
      contactPanel.hidden = !isContact;
      document.querySelector('#about-frame').hidden = !isAbout;
      aboutStory.hidden = !isAbout;
      document.querySelector('#crt-title').textContent = cabinets[active].name.toUpperCase();
      crtContent.setAttribute('aria-label', `${cabinets[active].name} interface`);
      crtContent.hidden = false;
      if (isLinks) { showLinks(); announcement.textContent = 'The Links. Explore the signs.'; }
      if (isRetro) { announcement.textContent = 'Retro Arcade. Choose a game.'; }
      if (isHandheld) {
        announcement.textContent = 'Retro Handheld Arcade. Choose a game.';
      }
      if (isAbout) {
        aboutStory.scrollTop = 0;
        aboutStory.focus({ preventScroll: true });
        announcement.textContent = 'About Us. Scroll inside the monitor to read our story.';
      }
      if (isContact) {
        contactPanel.focus({ preventScroll: true });
        announcement.textContent = 'Contact Us. Name, Email, and Message are required.';
      }
    }
    invalidate();
  } });
}

function cabinetPath() { return '/' + (active === 5 ? 'links' : cabinets[active].id); }
function backOneLevel() {
  clearMonitorTap();
  routeBack();
}

function zoomPose(screen) {
  const cabinet = new THREE.Box3().setFromObject(screen.root);
  const pose = screen.focusPose(1);
  const normal = pose.position.clone().sub(pose.target);
  normal.y = 0;
  normal.normalize();
  // Frame the entire cabinet from a lower, almost-level viewpoint. This keeps
  // the rear machines' feet close to the floor rather than lifting their bases.
  cabinet.getCenter(pose.target);
  const framing = new THREE.PerspectiveCamera(camera.fov, camera.aspect, 0.01, 100);
  const cornersOf = box => {
    const points = [];
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) points.push(new THREE.Vector3(x, y, z));
    return points;
  };
  const corners = cornersOf(cabinet);
  const neighbors = [-1, 1].flatMap(offset => {
    const neighbor = screens.get(wrap(active + offset));
    return neighbor ? cornersOf(new THREE.Box3().setFromObject(neighbor.root)) : [];
  });
  const visibleHeight = Math.min(stage.clientHeight, window.innerHeight);
  const top = 1 - 2 * visibleHeight * 0.05 / stage.clientHeight;
  const bottom = 1 - 2 * (visibleHeight - Math.max(48, visibleHeight * 0.05)) / stage.clientHeight;
  // Wide screens can show both neighboring cabinets in full. Portrait keeps
  // the center readable, with the neighbors framing it at the edges.
  const neighborLimit = Math.max(0.92, 1.3 / camera.aspect);
  let distance = 0.5;
  let upper, lower;
  for (let i = 0; i < 160; i++) {
    framing.position.copy(pose.target).addScaledVector(normal, distance);
    framing.position.y = cabinet.min.y + (cabinet.max.y - cabinet.min.y) * 0.40;
    framing.lookAt(pose.target); framing.updateMatrixWorld();
    const projected = corners.map(point => point.clone().project(framing));
    upper = Math.max(...projected.map(point => point.y));
    lower = Math.min(...projected.map(point => point.y));
    if (upper - lower <= top - bottom
      && projected.every(point => point.z > -1 && point.z < 1 && Math.abs(point.x) <= 0.86)
      && neighbors.every(point => Math.abs(point.clone().project(framing).x) <= neighborLimit)) break;
    distance *= 1.025;
  }
  pose.position.copy(framing.position);
  pose.offsetY = (top + bottom - upper - lower) * stage.clientHeight / 4;
  return pose;
}

function pickCabinet(point) {
  if (!renderer || !point) return null;
  const bounds = stage.getBoundingClientRect();
  raycaster.setFromCamera(new THREE.Vector2((point.x - bounds.left) / bounds.width * 2 - 1, -(point.y - bounds.top) / bounds.height * 2 + 1), camera);
  const hit = raycaster.intersectObjects(models, true).find(hit => !hit.object.userData.groundShadow);
  let object = hit?.object;
  while (object && object.userData.cabinetIndex === undefined) object = object.parent;
  return object ? object.userData.cabinetIndex : null;
}
function updateScreenEffects(now) {
  if (!focusedScreen) {
    const wanted = touchInput ? active : (pointer ? null : pickCabinet(hoverPoint));
    if (wanted !== litIndex) {
      if (litIndex !== null) screens.get(litIndex)?.setIdle();
      litIndex = screens.has(wanted) ? wanted : null;
      if (litIndex !== null) {
        screens.get(litIndex).setNoise();
      }
    }
  }
  for (const screen of screens.values()) screen.update(now / 1000);
  return [...screens.values()].some(screen => screen.mode === 'noise');
}
function closeScreen(restoring = false) {
  if (focusedScreen && !restoring) { routeBack('/'); return; }
  document.body.classList.remove('links-open');
  if (!focusedScreen) return;
  hideHandhelds();
  hideRetroArcade();
  cancelZoom?.();
  cancelZoom = null;
  focusedScreen.setIdle();
  focusedScreen = null;
  zoomTransition = false;
  clearMonitorTap();
  view = 'carousel';
  crtContent.hidden = true;
  stage.parentElement.classList.remove('crt-open');
  returnButton.textContent = 'Back to arcade';
  stage.parentElement.classList.remove('screen-open');
  litIndex = null;
  hoverPoint = null;
  announcement.textContent = '';
  returnButton.hidden = true;
  resize();
  stage.focus({ preventScroll: true });
}
returnButton.addEventListener('click', backOneLevel);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && focusedScreen && !isHandheldPlaying() && !isRetroPlaying()) { event.preventDefault(); backOneLevel(); }
});
function showScreenMessage(screen) {
  if (cabinets[active].id === 'the-links') {
    screen.setCanvas(linksTeaser());
    announcement.textContent = 'Important Links to Important Things <click to continue>';
    return;
  }
  if (cabinets[active].id === 'retro-arcade') {
    retroTeaser(canvas => {
      if (focusedScreen !== screen || view !== 'cabinet') return false;
      if (screen.source?.image !== canvas) screen.setCanvas(canvas);
      invalidate(); return true;
    }).catch(error => console.error('Unable to load the Retro Arcade frame', error));
    announcement.textContent = 'RETRO GAMES. CLICK TO VIEW.';
    return;
  }
  if (cabinets[active].id === 'retro-handheld') {
    handheldTeaser().then(canvas => {
      if (focusedScreen !== screen) return;
      screen.setCanvas(canvas);
      if (view === 'cabinet') announcement.textContent = 'RETRO GAMES. CLICK TO VIEW.';
      invalidate();
    }).catch(error => console.error('Unable to load the handheld arcade frame', error));
    return;
  }
  if (cabinets[active].id === 'contact-us') {
    showContactTeaser(screen);
    return;
  }
  if (cabinets[active].id === 'about-us') {
    showAboutTeaser(screen);
    return;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 768;
  const context = canvas.getContext('2d');
  context.fillStyle = '#071b1b'; context.fillRect(0, 0, 1024, 768);
  context.textAlign = 'center'; context.fillStyle = '#8dffca';
  context.font = 'bold 46px Arial'; context.fillText(cabinets[active].name.toUpperCase(), 512, 260, 880);
  context.shadowColor = '#4bd8b7'; context.shadowBlur = 12;
  context.font = 'bold 66px Arial'; context.fillText('Coming soon.', 512, 385);
  context.font = '44px Arial'; context.fillText('Stay tuned!', 512, 458);
  screen.setCanvas(canvas);
  announcement.textContent = `${cabinets[active].name}. Coming soon. Stay tuned!`;
}
async function showContactTeaser(screen) {
  const frame = document.querySelector('#contact-frame');
  try {
    await frame.decode();
    if (focusedScreen !== screen) return;
    const canvas = document.createElement('canvas');
    canvas.width = frame.naturalWidth; canvas.height = frame.naturalHeight;
    const context = canvas.getContext('2d');
    context.drawImage(frame, 0, 0);
    context.textAlign = 'center'; context.fillStyle = '#39FF6A';
    context.shadowColor = '#39ff6a30'; context.shadowBlur = 3;
    const font = getComputedStyle(contactPanel).fontFamily;
    const line = (text, y, size) => {
      context.font = `${size}px ${font}`;
      while (context.measureText(text).width > canvas.width * 0.86) context.font = `${--size}px ${font}`;
      context.fillText(text, canvas.width / 2, y);
    };
    line('WANT TO GET IN TOUCH?', 325, 68);
    line('Comments? Concerns? Complaints...', 475, 60);
    line('Custom game or software requests?', 550, 60);
    line('Hit me up!', 625, 64);
    line('CLICK THE SCREEN TO CONTINUE', 790, 64);
    screen.setCanvas(canvas);
    if (view === 'cabinet') announcement.textContent = 'WANT TO GET IN TOUCH? Comments? Concerns? Complaints... Custom game or software requests? Hit me up! CLICK THE SCREEN TO CONTINUE';
    invalidate();
  } catch (error) { console.error('Unable to load the Contact Us teaser frame', error); }
}
async function showAboutTeaser(screen) {
  const frame = document.querySelector('#about-frame');
  try {
    await frame.decode();
    if (focusedScreen !== screen) return;
    const canvas = document.createElement('canvas');
    canvas.width = frame.naturalWidth; canvas.height = frame.naturalHeight;
    const context = canvas.getContext('2d');
    context.drawImage(frame, 0, 0);
    context.textAlign = 'center';
    context.fillStyle = '#39FF6A';
    context.shadowColor = '#39ff6a30'; context.shadowBlur = 3;
    const font = getComputedStyle(aboutStory).fontFamily;
    const center = canvas.width / 2;
    const line = (text, y, size) => {
      context.font = `${size}px ${font}`;
      while (context.measureText(text).width > canvas.width * 0.86) context.font = `${--size}px ${font}`;
      context.fillText(text, center, y);
    };
    line('A BRIEF, MOSTLY TRUE HISTORY OF', 325, 64);
    line('LUCID CONFUSION CREATIONS', 403, 64);
    line('Computers. Video games. Europe. Shamans.', 535, 60);
    line('Twitch. Questionable decisions. Software.', 605, 60);
    line('CLICK THE SCREEN TO READ', 775, 66);
    screen.setCanvas(canvas);
    if (view === 'cabinet') announcement.textContent = 'A BRIEF, MOSTLY TRUE HISTORY OF LUCID CONFUSION CREATIONS. Computers. Video games. Europe. Shamans. Twitch. Questionable decisions. Software. CLICK THE SCREEN TO READ';
    invalidate();
  } catch (error) {
    console.error('Unable to load the About Us teaser frame', error);
  }
}
function updateSelection() { active = wrap(Math.round(-angle / step)); }
function announceSelection() { stage.setAttribute('aria-label', `${cabinets[active].name} selected. Drag to rotate, use arrow keys to choose, and Enter to open.`); }
function select(index) {
  const delta = THREE.MathUtils.euclideanModulo(-index * step - angle + Math.PI, 2 * Math.PI) - Math.PI;
  target = angle + delta;
  velocity = 0;
  announcement.textContent = '';
  if (reducedMotion.matches) { angle = target; updateSelection(); announceSelection(); }
  invalidate();
}
function move(direction) {
  if (view === 'crt') return;
  closeScreen();
  target = (Math.round(target / step) - direction) * step;
  velocity = 0;
  announcement.textContent = '';
  if (reducedMotion.matches) { angle = target; updateSelection(); announceSelection(); }
  invalidate();
}
function openCabinet(restoring = false) {
  if (focusedScreen || pointer || Math.abs(target - angle) > 0.015 || Math.abs(velocity) > 0.01) return;
  const screen = screens.get(active);
  if (!screen) return;
  if (!restoring) { navigate(cabinetPath()); return; }
  ring.rotation.y = angle;
  ring.updateMatrixWorld(true);
  for (const item of screens.values()) item.setIdle();
  screen.setNoise(); focusedScreen = screen;
  view = 'cabinet';
  lastMonitorTap = null;
  zoomTransition = true;
  const fromQuaternion = camera.quaternion.clone();
  stage.parentElement.classList.add('screen-open');
  camera.aspect = stage.clientWidth / stage.clientHeight;
  renderer.setSize(stage.clientWidth, stage.clientHeight);
  const pose = zoomPose(screen);
  returnButton.hidden = true;
  const fromZoom = camera.zoom, fromOffset = camera.view?.offsetY || 0;
  const destination = camera.clone();
  destination.position.copy(pose.position); destination.lookAt(pose.target);
  const direction = camera.getWorldDirection(new THREE.Vector3());
  const controls = { enabled: true, target: camera.position.clone().addScaledVector(direction, 5), update() {
    const t = Math.min(1, (performance.now() - started) / duration);
    const ease = t * t * (3 - 2 * t);
    camera.zoom = THREE.MathUtils.lerp(fromZoom, 1, ease);
    camera.setViewOffset(stage.clientWidth, stage.clientHeight, 0, THREE.MathUtils.lerp(fromOffset, pose.offsetY, ease), stage.clientWidth, stage.clientHeight);
    camera.quaternion.slerpQuaternions(fromQuaternion, destination.quaternion, ease);
    camera.updateMatrixWorld(); invalidate();
  } };
  const duration = reducedMotion.matches ? 1 : 700, started = performance.now();
  cancelZoom = zoomToScreen({ screen: { focusPose: () => pose }, camera, controls, duration, onComplete() {
    zoomTransition = false;
    camera.zoom = 1;
    camera.setViewOffset(stage.clientWidth, stage.clientHeight, 0, pose.offsetY, stage.clientWidth, stage.clientHeight);
    if (cabinets[active].href) location.assign(cabinets[active].href);
    else showScreenMessage(screen);
    invalidate();
  } });
}
stage.addEventListener('keydown', event => {
  if (['ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(event.key)) {
    event.preventDefault();
    if (event.key === 'ArrowLeft') move(-1);
    else if (event.key === 'ArrowRight') move(1);
    else if (view === 'cabinet' && !zoomTransition) changeZoomView('crt');
    else openCabinet();
  }
});
updateSelection();

function invalidate() { if (renderer && !frame && !document.hidden) frame = requestAnimationFrame(render); }
function render(now) {
  frame = 0;
  const dt = Math.min((now - lastFrame) / 1000 || 1 / 60, 0.05);
  lastFrame = now;
  let moving = false;
  if (!pointer && !focusedScreen) {
    if (Math.abs(velocity) > 0.045 && !reducedMotion.matches) {
      angle += velocity * dt;
      velocity *= Math.exp(-7 * dt);
      target = Math.round((angle + velocity / 7) / step) * step;
      moving = true;
    } else {
      velocity = 0;
      if (Math.abs(target - angle) > 0.0001) {
        angle = reducedMotion.matches ? target : THREE.MathUtils.lerp(angle, target, 1 - Math.exp(-12 * dt));
        moving = true;
      } else if (angle !== target) {
        angle = target;
        // Keep arithmetic precise after arbitrarily many revolutions.
        angle = THREE.MathUtils.euclideanModulo(angle + Math.PI, Math.PI * 2) - Math.PI;
        target = angle;
        if (!announcement.textContent) announceSelection();
      }
    }
  }
  ring.rotation.y = angle;
  updateSelection();
  ring.updateMatrixWorld(true);
  const staticPlaying = updateScreenEffects(now);
  renderer.render(scene, camera);
  if (moving || staticPlaying) invalidate();
}

function hitCabinet(event) {
  const index = pickCabinet({ x: event.clientX, y: event.clientY });
  if (focusedScreen) {
    if (zoomTransition || index !== active || (view !== 'cabinet' && !focusedScreen.hit(raycaster))) { clearMonitorTap(); return; }
    const monitorHit = focusedScreen.hit(raycaster);
    const tap = { time: event.timeStamp, x: event.clientX, y: event.clientY, type: event.pointerType };
    if (lastMonitorTap && tap.type === lastMonitorTap.type && tap.time - lastMonitorTap.time < 400 && Math.hypot(tap.x - lastMonitorTap.x, tap.y - lastMonitorTap.y) < 28) backOneLevel();
    else {
      clearMonitorTap();
      lastMonitorTap = tap;
      if (view === 'cabinet' && monitorHit) monitorTapTimer = setTimeout(() => {
        clearMonitorTap();
        if (view === 'cabinet' && !zoomTransition) changeZoomView('crt');
      }, 400);
    }
    return;
  }
  if (index === null) return;
  if (index === active) { if (screens.get(index)?.hit(raycaster)) openCabinet(); }
  else select(index);
}
stage.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0 || pointer) return;
  touchInput = event.pointerType === 'touch' || event.pointerType === 'pen';
  pointer = { id: event.pointerId, startX: event.clientX, startY: event.clientY, x: event.clientX, time: event.timeStamp, dragged: false };
  velocity = 0;
  target = angle;
  stage.setPointerCapture(event.pointerId);
});
stage.addEventListener('pointermove', event => {
  if (event.pointerType === 'mouse') { touchInput = false; hoverPoint = { x: event.clientX, y: event.clientY }; invalidate(); }
  if (!pointer || pointer.id !== event.pointerId) return;
  const dx = event.clientX - pointer.x;
  const dt = Math.max(8, event.timeStamp - pointer.time) / 1000;
  if (Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) > 7) pointer.dragged = true;
  if (pointer.dragged) {
    clearMonitorTap();
    if (view === 'crt') { pointer.x = event.clientX; pointer.time = event.timeStamp; return; }
    closeScreen();
    const delta = dx * (Math.PI * 2 / Math.max(600, stage.clientWidth));
    angle += delta;
    velocity = THREE.MathUtils.clamp(delta / dt, -5, 5);
    stage.classList.add('dragging');
    announcement.textContent = '';
    invalidate();
  }
  pointer.x = event.clientX;
  pointer.time = event.timeStamp;
});
stage.addEventListener('pointerleave', () => { hoverPoint = null; invalidate(); });
function release(event, cancelled = false) {
  if (!pointer || pointer.id !== event.pointerId) return;
  const previous = pointer;
  pointer = null;
  stage.classList.remove('dragging');
  if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
  if (cancelled || reducedMotion.matches || event.timeStamp - previous.time > 100) velocity = 0;
  target = Math.round((angle + velocity / 7) / step) * step;
  if (!cancelled && !previous.dragged) { velocity = 0; hitCabinet(event); }
  invalidate();
}
stage.addEventListener('pointerup', event => release(event));
stage.addEventListener('pointercancel', event => release(event, true));
stage.addEventListener('lostpointercapture', event => release(event, true));

function resize() {
  const width = stage.clientWidth, height = stage.clientHeight;
  camera.aspect = width / height;
  if (focusedScreen) {
    if (!zoomTransition) {
      const pose = view === 'crt' ? fullCRTPose(focusedScreen) : zoomPose(focusedScreen);
      camera.position.copy(pose.position); camera.lookAt(pose.target);
      camera.setViewOffset(width, height, 0, pose.offsetY, width, height);
    }
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    invalidate();
    return;
  }
  // Dolly in for roughly 3x the previous projected cabinet size, retaining the ring spacing.
  const previousHeight = stage.parentElement.clientHeight * (width <= 600 ? 0.45 : 0.59);
  const previousAspect = width / previousHeight;
  const previousDistance = Math.max(settings.cameraDistance, 3.35 / (Math.tan(THREE.MathUtils.degToRad(settings.fov / 2)) * previousAspect) + settings.radius);
  // A fixed, full-room canvas avoids a layout jump when focus starts and draws
  // behind the footer. Keep the original carousel's 20%-to-96% framing inside it.
  const framingHeight = height * 0.76;
  camera.aspect = width / framingHeight;
  const distance = settings.radius + (previousDistance - settings.radius) * framingHeight / previousHeight / 3.2;
  camera.position.set(0, 0.6 + distance * settings.cameraElevation, distance);
  camera.lookAt(0, 0.2, 0);
  camera.zoom = 1;
  camera.clearViewOffset();
  camera.updateMatrixWorld();
  // Preserve the front cabinet's projected height and placement while lowering
  // the viewing angle. Ring radius, model scale and ground positions stay intact.
  const frontBounds = () => {
    const ys = [];
    for (const x of [-0.434, 0.434]) for (const y of [0, settings.cabinetHeight]) for (const z of [-0.438, 0.438]) {
      ys.push(new THREE.Vector3(x, y, settings.radius + z).project(camera).y);
    }
    return { height: Math.max(...ys) - Math.min(...ys), center: (Math.max(...ys) + Math.min(...ys)) / 2 };
  };
  const original = frontBounds();
  camera.position.y = 0.6 + distance * 0.12;
  camera.lookAt(0, 0.2, 0);
  camera.updateMatrixWorld();
  camera.zoom = original.height / frontBounds().height * 0.9;
  camera.updateProjectionMatrix();
  const offsetY = (original.center - frontBounds().center) * framingHeight / 2 - height * 0.08;
  camera.zoom *= framingHeight / height;
  camera.aspect = width / height;
  camera.setViewOffset(width, height, 0, offsetY, width, height);
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, width < 700 ? 1.5 : 1.75));
  renderer.setSize(width, height);
  invalidate();
}

async function initialize() {
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'default' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  stage.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(settings.fov, 1, 0.1, 100);
  raycaster = new THREE.Raycaster();
  ring = new THREE.Group();
  scene.add(ring);
  scene.add(new THREE.HemisphereLight(0xe4d7ff, 0x322139, 2.4));
  const key = new THREE.DirectionalLight(0xffecfa, 3.2);
  key.position.set(-3, 6, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xae59ff, 2);
  rim.position.set(4, 3, -4);
  scene.add(rim);
  // Soft contact shadows are separate ground meshes, never baked into the models.
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 64;
  const context = shadowCanvas.getContext('2d');
  const gradient = context.createRadialGradient(32, 32, 6, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(0,0,0,.65)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  const shadowMaterial = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false });
  resize();
  new ResizeObserver(resize).observe(stage);
  document.addEventListener('visibilitychange', invalidate);
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    loading.hidden = false;
    loading.textContent = '3D display paused. Reload this page to reopen the arcade.';
  });
  const loader = new GLTFLoader();
  let loaded = 0;
  const failed = [];
  // The initial front machine first, its neighbors next; sequential loads cap memory spikes.
  for (const index of [2, 1, 3, 0, 4, 8, 5, 7, 6]) {
    const cabinet = cabinets[index];
    try {
      const gltf = await loader.loadAsync(`./assets/arcade/models/${cabinet.id}.glb`);
      const model = gltf.scene;
      model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const scale = settings.cabinetHeight / size.y;
      model.scale.multiplyScalar(scale);
      model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
      const mount = new THREE.Group();
      mount.name = cabinet.id;
      mount.userData.cabinetIndex = index;
      mount.userData.originalBounds = { min: box.min.toArray(), max: box.max.toArray() };
      mount.userData.scale = scale;
      mount.position.set(Math.sin(index * step) * settings.radius, 0, Math.cos(index * step) * settings.radius);
      mount.rotation.y = index * step;
      mount.add(model);
      screens.set(index, new CabinetScreen(model));
      ring.add(mount);
      models.push(mount);
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(size.x * scale * 1.8, size.z * scale * 1.65), shadowMaterial);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.003;
      shadow.userData.groundShadow = true;
      mount.add(shadow);
      loaded++;
      document.querySelector('#load-count').textContent = `${loaded} / 9`;
      invalidate();
    } catch (error) {
      failed.push(cabinet.name);
      console.error(`Unable to load ${cabinet.id}`, error);
    }
  }
  if (failed.length) loading.textContent = `Could not load ${failed.join(', ')}. Reload to retry.`;
  else loading.hidden = true;
  await startRouter(async (route, stale) => {
    const settled = async () => {
      while (zoomTransition) await new Promise(resolve => setTimeout(resolve, 16));
    };
    await settled();
    if (stale()) return;
    if (!route.game || route.index !== active) {
      await stopHandheld();
      await stopRetro();
    }
    if (stale()) return;
    if (route.index === undefined) { closeScreen(true); return; }
    if (active !== route.index || !focusedScreen) {
      closeScreen(true);
      angle = target = -route.index * step; active = route.index; velocity = 0;
      pointer = null;
      ring.rotation.y = angle; ring.updateMatrixWorld(true);
      openCabinet(true);
      await settled();
    }
    if (stale()) return;
    if (view !== route.view) { changeZoomView(route.view, true); await settled(); }
    if (stale()) return;
    if (route.view === 'crt') {
      if (route.index === 1) { await showHandhelds(); if (!stale() && route.game) await launchHandheld(route.game); }
      if (route.index === 2) { await showRetroArcade(); if (!stale() && route.game) await launchRetro(route.game); }
      if (route.index === 5) beachState(!!route.beach);
    }
  });
  // Read-only diagnostics for local verification, enabled only with ?debug=1.
  if (new URLSearchParams(location.search).has('debug')) {
    window.arcadeDebug = { scene, camera, ring, renderer, models, settings, screens, get state() { return { angle, target, active, loaded, failed, velocity, dragging: !!pointer, focused: !!focusedScreen, view, zoomTransition, litIndex }; } };
  }
}
initialize().catch(error => {
  console.error('Arcade initialization failed', error);
  loading.hidden = false;
  loading.textContent = 'The 3D arcade could not start. Enable WebGL and reload. Cabinet controls and legal links remain available.';
});
