import { navigate, routeBack, startRouter } from './router.js';
import * as THREE from 'three';
import { GLTFLoader } from './assets/vendor/three/loaders/GLTFLoader.js';
import { CabinetScreen } from './assets/arcade/screen-controller.js';
import { typePreviewText } from './assets/arcade/preview-text.js';
import { cabinetFraming } from './assets/arcade/cabinet-framing.js';
import './contact.js';
import { handheldTeaser, showHandhelds, hideHandhelds, isHandheldPlaying, launchHandheld, stopHandheld } from './handheld.js';
import { retroTeaser, showRetroArcade, hideRetroArcade, isRetroPlaying, launchRetro, stopRetro } from './retro-arcade.js';
import { linksTeaser, showLinks, beachState } from './links.js';
import { showNewStuff, hideNewStuff } from './new-stuff.js';
import { showDemoArcade, hideDemoArcade } from './demo-arcade.js';

// Cabinet models retain their original IDs; public URLs are centralized in routes.js.
const cabinets = [
  { id: 'about-us', name: 'About Us', href: null },
  { id: 'retro-handheld', name: 'Retro Handheld', href: null },
  { id: 'retro-arcade', name: 'Retro Arcade', href: null },
  { id: 'demo-arcade', name: 'Demo Arcade', href: null, frame: './assets/arcade/art/4 Demo Arcade.png' },
  { id: 'merch-shop', name: 'Merch Shop', href: null, frame: './assets/arcade/art/1 Merch Shop.png' },
  { id: 'the-links', name: 'The Links', href: null },
  { id: 'new-stuff', name: 'New Stuff', href: null, frame: './assets/arcade/art/2 New Stuff.png' },
  { id: 'coming-soon', name: 'Coming Soon', href: null, frame: './assets/arcade/art/3 Coming Soon.png' },
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
let view = 'carousel';
let previewGeneration = 0;
let restingAngle = angle;
let cabinetScale = 1, monitorProgress = 0;
const crtContent = document.querySelector('#crt-content');
const aboutStory = document.querySelector('#about-story');
const contactPanel = document.querySelector('#contact-panel');
const handheldPanel = document.querySelector('#handheld-panel');
const retroPanel = document.querySelector('#retro-panel');
const linksPanel = document.querySelector('#links-panel');
const newStuffPanel = document.querySelector('#new-stuff-panel');
const demoArcadePanel = document.querySelector('#demo-arcade-panel');
document.querySelector('#links-return').addEventListener('click', () => routeBack('/links'));
// Reading gestures belong to the HTML story; double activation on the frame
// retains the carousel return gesture without interrupting text selection.
let framePress = null;
crtContent.addEventListener('pointerdown', event => {
  framePress = !linksPanel.contains(event.target) && !aboutStory.contains(event.target) && !contactPanel.contains(event.target) && !handheldPanel.contains(event.target) && !retroPanel.contains(event.target) && !newStuffPanel.contains(event.target) && !demoArcadePanel.contains(event.target) && event.isPrimary && event.button === 0
    ? { x: event.clientX, y: event.clientY } : null;
});
crtContent.addEventListener('pointerup', event => {
  const press = framePress;
  framePress = null;
  if (!press || view !== 'crt' || zoomTransition || linksPanel.contains(event.target) || aboutStory.contains(event.target) || contactPanel.contains(event.target) || handheldPanel.contains(event.target) || retroPanel.contains(event.target) || newStuffPanel.contains(event.target) || demoArcadePanel.contains(event.target)
    || Math.hypot(event.clientX - press.x, event.clientY - press.y) > 7) return;
  const tap = { time: event.timeStamp, x: event.clientX, y: event.clientY, type: event.pointerType };
  if (lastMonitorTap && tap.type === lastMonitorTap.type && tap.time - lastMonitorTap.time < 400
    && Math.hypot(tap.x - lastMonitorTap.x, tap.y - lastMonitorTap.y) < 28) returnToCarousel();
  else lastMonitorTap = tap;
});
crtContent.addEventListener('pointercancel', () => { framePress = null; clearMonitorTap(); });

function clearMonitorTap() {
  lastMonitorTap = null;
}

function fullCRTPose(screen) {
  const probe = camera.clone();
  setCarouselCamera(probe, stage.parentElement.clientWidth, stage.parentElement.clientHeight);
  const positions = screen.display.geometry.attributes.position;
  const width = stage.clientWidth, height = stage.clientHeight;
  const crtWidth = Math.min(innerWidth * 0.96, innerHeight * 1.12);
  const crtHeight = Math.min(innerWidth * 0.72, innerHeight * 0.84);
  const limitX = 0.94 * Math.min(1, crtWidth / width);
  const limitY = 0.94 * Math.min(1, crtHeight / height);
  probe.aspect = width / height; probe.zoom = 1; probe.clearViewOffset(); probe.updateMatrixWorld();
  const bounds = () => {
    let left = Infinity, right = -Infinity, top = -Infinity, bottom = Infinity;
    const point = new THREE.Vector3();
    for (let j = 0; j < positions.count; j++) {
      point.fromBufferAttribute(positions, j).applyMatrix4(screen.display.matrixWorld).project(probe);
      left = Math.min(left, point.x); right = Math.max(right, point.x);
      bottom = Math.min(bottom, point.y); top = Math.max(top, point.y);
    }
    return { left, right, top, bottom };
  };
  const before = bounds();
  probe.zoom = Math.min(2 * limitX / (before.right - before.left), 2 * limitY / (before.top - before.bottom));
  probe.updateProjectionMatrix();
  const fitted = bounds();
  // Optical zoom: preserve the viewpoint, including the CRT's natural slant.
  // Align the frame through the projection window, never lookAt its surface normal.
  probe.setViewOffset(width, height, (fitted.left + fitted.right) * width / 4,
    -(fitted.top + fitted.bottom) * height / 4, width, height);
  return probe;
}

function setCabinetScale(scale) {
  cabinetScale = scale;
  for (const mount of models) mount.scale.setScalar(scale);
}

function setMonitorProgress(progress) {
  monitorProgress = progress;
  stage.parentElement.style.setProperty('--monitor-progress', progress);
  if (!progress) stage.style.clipPath = '';
  else {
    const width = Math.min(innerWidth * .96, innerHeight * 1.12), height = width * .75;
    stage.style.clipPath = `inset(${progress * (stage.clientHeight - height) / 2}px ${progress * (stage.clientWidth - width) / 2}px)`;
  }
}

function showContent() {
  clearMonitorTap();
  view = 'crt';
  document.body.classList.toggle('links-open', cabinets[active].id === 'the-links');
  const isAbout = cabinets[active].id === 'about-us';
  const isContact = cabinets[active].id === 'contact-us';
  const isHandheld = cabinets[active].id === 'retro-handheld';
  const isRetro = cabinets[active].id === 'retro-arcade';
  const isLinks = cabinets[active].id === 'the-links';
  const isNewStuff = cabinets[active].id === 'new-stuff';
  const isDemo = cabinets[active].id === 'demo-arcade';
  const frame = cabinets[active].frame;
  crtContent.classList.toggle('framed-placeholder', !!frame);
  crtContent.style.backgroundImage = frame ? `url("${frame}")` : '';
  returnButton.classList.toggle('game-return', !isLinks);
  returnButton.replaceChildren();
  if (!isLinks) {
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
  document.querySelector('#crt-title').hidden = isAbout || isContact || isHandheld || isRetro || isLinks || isNewStuff || isDemo;
  document.querySelector('#crt-placeholder').hidden = isAbout || isContact || isHandheld || isRetro || isLinks || isNewStuff || isDemo;
  document.querySelector('#contact-frame').hidden = !isContact;
  contactPanel.hidden = !isContact;
  document.querySelector('#about-frame').hidden = !isAbout;
  aboutStory.hidden = !isAbout;
  document.querySelector('#crt-title').textContent = cabinets[active].name.toUpperCase();
  crtContent.setAttribute('aria-label', `${cabinets[active].name} interface`);
  crtContent.hidden = false;
  if (isDemo) { announcement.textContent = 'Demo Arcade. Play Lucid Logic Circuit Control.'; }
  if (isNewStuff) { showNewStuff(); announcement.textContent = 'New Stuff. Sloths vs Penguins and OmniStash promotional videos. Scroll inside the monitor to watch.'; }
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
  invalidate();
}

function showIntro() {
  clearMonitorTap();
  view = 'intro';
  document.body.classList.remove('links-open');
  crtContent.hidden = true;
  hideHandhelds(); hideRetroArcade();
  returnButton.classList.add('game-return');
  const image = document.createElement('img');
  image.src = './assets/arcade/art/back-to-arcade-transparent.png';
  image.alt = 'Back to Arcade'; image.width = 216; image.height = 72; image.draggable = false;
  returnButton.replaceChildren(image);
  returnButton.hidden = false;
  stage.focus({ preventScroll: true });
  invalidate();
}

function enterContent() {
  if (view === 'intro' && !zoomTransition) navigate(cabinetPath() + ([1, 2].includes(active) ? '/games' : '/view'));
}

function cabinetPath() { return '/' + (active === 5 ? 'links' : cabinets[active].id); }
function returnToCarousel() {
  clearMonitorTap();
  routeBack(view === 'crt' ? cabinetPath() : '/');
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
  if (focusedScreen && !restoring) { returnToCarousel(); return; }
  document.body.classList.remove('links-open');
  if (!focusedScreen) return;
  hideHandhelds();
  hideRetroArcade();
  cancelZoom?.();
  cancelZoom = null;
  focusedScreen.setIdle();
  focusedScreen = null;
  setCabinetScale(1); ring.position.set(0, 0, 0);
  setMonitorProgress(0);
  angle = target = restingAngle; ring.rotation.y = angle;
  updateSelection();
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
returnButton.addEventListener('click', returnToCarousel);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && focusedScreen && !isHandheldPlaying() && !isRetroPlaying() && !newStuffPanel.contains(document.fullscreenElement)) { event.preventDefault(); returnToCarousel(); }
});
async function showScreenMessage(screen) {
  const generation = ++previewGeneration;
  const draw = canvas => {
    if (generation !== previewGeneration || focusedScreen !== screen || view !== 'intro') return false;
    if (screen.source?.image !== canvas) screen.setCanvas(canvas);
    invalidate(); return true;
  };
  if (cabinets[active].id === 'the-links') {
    linksTeaser(draw).catch(error => console.error('Unable to load The Links teaser frame', error));
    announcement.textContent = 'Important Links to Important Things <click to continue>';
    return;
  }
  if (cabinets[active].id === 'retro-arcade') {
    retroTeaser(draw).catch(error => console.error('Unable to load the Retro Arcade frame', error));
    announcement.textContent = 'RETRO ARCADE. <click to continue>';
    return;
  }
  if (cabinets[active].id === 'retro-handheld') {
    handheldTeaser(draw).catch(error => console.error('Unable to load the handheld arcade frame', error));
    announcement.textContent = 'Retro Handheld Games. <click to continue>';
    return;
  }
  if (cabinets[active].id === 'contact-us') {
    showContactTeaser(screen, draw);
    return;
  }
  if (cabinets[active].id === 'about-us') {
    showAboutTeaser(screen, draw);
    return;
  }
  const cabinet = cabinets[active];
  const hasContinuePrompt = cabinet.id === 'new-stuff' || cabinet.id === 'demo-arcade';
  let border;
  if (cabinet.frame) {
    border = new Image();
    border.src = cabinet.frame;
    try { await border.decode(); }
    catch (error) { console.error(`Unable to load the ${cabinet.name} frame`, error); border = null; }
    if (focusedScreen !== screen) return;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 768;
  typePreviewText(canvas, context => {
    context.fillStyle = '#071b1b'; context.fillRect(0, 0, canvas.width, canvas.height);
    if (border) context.drawImage(border, 0, 0, canvas.width, canvas.height);
  }, hasContinuePrompt ? [
    { text: cabinet.name, y: 260, size: 46, maxWidth: 880 },
    { text: '<click to continue>', y: 385, size: 66 },
  ] : [
    { text: cabinet.name.toUpperCase(), y: 260, size: 46, maxWidth: 880 },
    { text: 'Coming soon.', y: 385, size: 66 },
    { text: 'Stay tuned!', y: 458, size: 44 },
  ], draw);
  announcement.textContent = hasContinuePrompt ? `${cabinet.name}. <click to continue>` : `${cabinet.name}. Coming soon. Stay tuned!`;
  invalidate();
}
async function showContactTeaser(screen, draw) {
  const frame = document.querySelector('#contact-frame');
  try {
    await frame.decode();
    if (focusedScreen !== screen) return;
    const canvas = document.createElement('canvas');
    canvas.width = frame.naturalWidth; canvas.height = frame.naturalHeight;
    typePreviewText(canvas, context => context.drawImage(frame, 0, 0), [
      { text: 'WANT TO GET IN TOUCH?', y: 325, size: 68 },
      { text: 'Comments? Concerns? Complaints...', y: 475, size: 60 },
      { text: 'Custom game or software requests?', y: 550, size: 60 },
      { text: 'Hit me up!', y: 625, size: 64 },
      { text: '<click to continue>', y: 790, size: 64 },
    ].map(line => ({ ...line, fitWidth: canvas.width * .86 })), draw);
    if (view === 'intro') announcement.textContent = 'WANT TO GET IN TOUCH? Comments? Concerns? Complaints... Custom game or software requests? Hit me up! <click to continue>';
    invalidate();
  } catch (error) { console.error('Unable to load the Contact Us teaser frame', error); }
}
async function showAboutTeaser(screen, draw) {
  const frame = document.querySelector('#about-frame');
  try {
    await frame.decode();
    if (focusedScreen !== screen) return;
    const canvas = document.createElement('canvas');
    canvas.width = frame.naturalWidth; canvas.height = frame.naturalHeight;
    typePreviewText(canvas, context => context.drawImage(frame, 0, 0), [
      { text: 'A BRIEF, MOSTLY TRUE HISTORY OF', y: 325, size: 64 },
      { text: 'LUCID CONFUSION CREATIONS', y: 403, size: 64 },
      { text: 'Computers. Video games. Europe. Shamans.', y: 535, size: 60 },
      { text: 'Twitch. Questionable decisions. Software.', y: 605, size: 60 },
      { text: '<click to continue>', y: 775, size: 66 },
    ].map(line => ({ ...line, fitWidth: canvas.width * .86 })), draw);
    if (view === 'intro') announcement.textContent = 'A BRIEF, MOSTLY TRUE HISTORY OF LUCID CONFUSION CREATIONS. Computers. Video games. Europe. Shamans. Twitch. Questionable decisions. Software. <click to continue>';
    invalidate();
  } catch (error) {
    console.error('Unable to load the About Us teaser frame', error);
  }
}
function updateSelection() { active = wrap(Math.round(-angle / step)); }
function announceSelection() { stage.setAttribute('aria-label', `${cabinets[active].name} selected. Drag to rotate, use arrow keys to choose, and Enter to open.`); }
function move(direction) {
  if (view !== 'carousel') return;
  closeScreen();
  target = (Math.round(target / step) - direction) * step;
  velocity = 0;
  announcement.textContent = '';
  if (reducedMotion.matches) { angle = target; updateSelection(); announceSelection(); }
  invalidate();
}
function fullStage() {
  // Keep the renderer at one viewport size through both stages. The monitor
  // window is a clip, so entering/leaving content cannot reframe the carousel.
  stage.parentElement.classList.remove('crt-open');
}

function introPose(index) {
  const width = stage.parentElement.clientWidth, height = stage.parentElement.clientHeight;
  const destination = camera.clone();
  setCarouselCamera(destination, width, height);
  destination.updateMatrixWorld();
  const desiredAngle = -index * step;
  const focusAngle = angle + THREE.MathUtils.euclideanModulo(desiredAngle - angle + Math.PI, Math.PI * 2) - Math.PI;
  return { camera: destination, ...cabinetFraming(screens.get(index), ring, destination, focusAngle, width, height) };
}

function animatePose(getPose, duration, complete) {
  cancelZoom?.();
  const from = camera.clone(), fromScale = cabinetScale, fromZ = ring.position.z, fromAngle = angle, fromMonitor = monitorProgress;
  let pose = getPose(), width = stage.clientWidth, height = stage.clientHeight;
  const started = performance.now();
  let animation;
  zoomTransition = true;
  const tick = now => {
    if (width !== stage.clientWidth || height !== stage.clientHeight) {
      width = stage.clientWidth; height = stage.clientHeight;
      pose = getPose();
    }
    // A queued animation frame can carry a timestamp just before this transition
    // started. Negative progress would produce a tiny forward/backward hop.
    const t = reducedMotion.matches ? 1 : THREE.MathUtils.clamp((now - started) / duration, 0, 1);
    const ease = t * t * t * (t * (6 * t - 15) + 10);
    // Navigation never animates eye height, camera travel or pitch. Only a
    // viewport resize can recalibrate this shared resting viewpoint.
    camera.position.copy(pose.camera.position);
    camera.quaternion.copy(pose.camera.quaternion);
    camera.zoom = THREE.MathUtils.lerp(from.zoom, pose.camera.zoom, ease);
    camera.setViewOffset(width, height, width * THREE.MathUtils.lerp(
      (from.view?.offsetX || 0) / (from.view?.fullWidth || width),
      (pose.camera.view?.offsetX || 0) / (pose.camera.view?.fullWidth || width), ease), height * THREE.MathUtils.lerp(
      (from.view?.offsetY || 0) / (from.view?.fullHeight || height),
      (pose.camera.view?.offsetY || 0) / (pose.camera.view?.fullHeight || height), ease), width, height);
    angle = target = THREE.MathUtils.lerp(fromAngle, pose.angle, ease);
    ring.rotation.y = angle;
    setCabinetScale(THREE.MathUtils.lerp(fromScale, pose.scale, ease));
    ring.position.set(0, 0, THREE.MathUtils.lerp(fromZ, pose.z, ease));
    setMonitorProgress(THREE.MathUtils.lerp(fromMonitor, pose.monitor || 0, ease));
    camera.updateMatrixWorld(); ring.updateMatrixWorld(true); invalidate();
    if (t < 1) animation = requestAnimationFrame(tick);
    else { cancelZoom = null; zoomTransition = false; complete(); }
  };
  animation = requestAnimationFrame(tick);
  cancelZoom = () => cancelAnimationFrame(animation);
}

function openCRT(index, next = 'intro') {
  const screen = screens.get(index);
  if (!screen) return;
  if (!focusedScreen) restingAngle = angle;
  active = index;
  if (focusedScreen !== screen) {
    for (const item of screens.values()) item.setIdle();
    screen.setNoise();
  }
  focusedScreen = screen;
  const monitorTransition = next === 'crt' || view === 'crt';
  view = next;
  if (next === 'intro') showScreenMessage(screen);
  clearMonitorTap();
  crtContent.hidden = true;
  document.body.classList.remove('links-open');
  hideHandhelds(); hideRetroArcade();
  fullStage();
  stage.parentElement.classList.add('screen-open');
  let getPose = () => introPose(index);
  if (next === 'crt') {
    getPose = () => {
      return { camera: fullCRTPose(screen), scale: cabinetScale, z: ring.position.z, angle, monitor: 1 };
    };
  }
  returnButton.hidden = true;
  animatePose(getPose, monitorTransition ? 1650 : 2200, () => {
    stage.parentElement.classList.toggle('crt-open', next === 'crt');
    setMonitorProgress(next === 'crt' ? 1 : 0);
    resize();
    if (next === 'intro') showIntro(); else showContent();
  });
}

function leaveCabinet() {
  fullStage();
  crtContent.hidden = true;
  document.body.classList.remove('links-open');
  hideHandhelds(); hideRetroArcade();
  returnButton.hidden = true;
  animatePose(() => {
    const destination = camera.clone();
    setCarouselCamera(destination, stage.clientWidth, stage.clientHeight);
    return { camera: destination, scale: 1, z: 0, angle: restingAngle };
  }, 2200, () => closeScreen(true));
}
stage.addEventListener('keydown', event => {
  if (['ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(event.key)) {
    event.preventDefault();
    if (event.key === 'ArrowLeft') move(-1);
    else if (event.key === 'ArrowRight') move(1);
    else if (view === 'intro') enterContent();
    else if (view === 'carousel' && !pointer && Math.abs(target - angle) < 0.015 && Math.abs(velocity) < 0.01) navigate(cabinetPath());
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
  if (!focusedScreen) updateSelection();
  ring.updateMatrixWorld(true);
  const staticPlaying = updateScreenEffects(now);
  renderer.render(scene, camera);
  if (moving || staticPlaying) invalidate();
}

function hitCabinet(event) {
  const index = pickCabinet({ x: event.clientX, y: event.clientY });
  if (focusedScreen) {
    if (!zoomTransition && view === 'intro' && focusedScreen.hit(raycaster)) enterContent();
    return;
  }
  if (index !== null && !zoomTransition) navigate('/' + (index === 5 ? 'links' : cabinets[index].id));
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
    if (view !== 'carousel') { pointer.x = event.clientX; pointer.time = event.timeStamp; return; }
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
  if (view === 'carousel') target = Math.round((angle + velocity / 7) / step) * step;
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
      if (view === 'intro') {
        const pose = introPose(active);
        camera.copy(pose.camera);
        setCabinetScale(pose.scale); ring.position.set(0, 0, pose.z);
        angle = target = pose.angle; ring.rotation.y = angle; ring.updateMatrixWorld(true);
      } else {
        camera.copy(fullCRTPose(focusedScreen));
      }
    }
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    setMonitorProgress(monitorProgress);
    invalidate();
    return;
  }
  setCarouselCamera(camera, width, height);
  renderer.setPixelRatio(Math.min(devicePixelRatio, width < 700 ? 1.5 : 1.75));
  renderer.setSize(width, height);
  invalidate();
}

function setCarouselCamera(camera, width, height) {
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
  camera.lookAt(0, camera.position.y, 0);
  camera.updateMatrixWorld();
  camera.zoom = original.height / frontBounds().height * 0.9;
  camera.updateProjectionMatrix();
  const offsetY = (original.center - frontBounds().center) * framingHeight / 2 - height * 0.08;
  camera.zoom *= framingHeight / height;
  camera.aspect = width / height;
  camera.setViewOffset(width, height, 0, offsetY, width, height);
  camera.updateProjectionMatrix();
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
    if (route.index !== 3 || route.view !== 'crt') hideDemoArcade();
    if (route.index !== 6 || route.view !== 'crt') await hideNewStuff();
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
    if (route.index === undefined) { if (focusedScreen) { leaveCabinet(); await settled(); } return; }
    if (active !== route.index || !focusedScreen) {
      closeScreen(true);
      target = angle; active = route.index; velocity = 0;
      pointer = null;
      ring.rotation.y = angle; ring.updateMatrixWorld(true);
      openCRT(route.index, 'intro');
      await settled();
    }
    if (stale()) return;
    if (view !== route.view) { openCRT(route.index, route.view); await settled(); }
    if (stale()) return;
    if (route.view === 'crt') {
      if (route.index === 3) showDemoArcade();
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
