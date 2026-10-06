import * as THREE from 'three';
import { GLTFLoader } from './assets/vendor/three/loaders/GLTFLoader.js';
import { CabinetScreen, zoomToScreen } from './assets/arcade/screen-controller.js';

// Set href to a real destination when each section is ready. No invented routes.
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

function changeZoomView(next) {
  if (!focusedScreen) return;
  cancelZoom?.();
  clearMonitorTap();
  view = next;
  zoomTransition = true;
  crtContent.hidden = true;
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
      document.querySelector('#crt-title').textContent = cabinets[active].name.toUpperCase();
      crtContent.setAttribute('aria-label', `${cabinets[active].name} interface`);
      crtContent.hidden = false;
    }
    invalidate();
  } });
}

function backOneLevel() {
  clearMonitorTap();
  if (view === 'crt') changeZoomView('cabinet');
  else closeScreen();
}

function zoomPose(screen) {
  const cabinet = new THREE.Box3().setFromObject(screen.root);
  const display = new THREE.Box3().setFromObject(screen.display);
  const pose = screen.focusPose(1);
  // Keep the zoom view level rather than inheriting the CRT's upward tilt.
  const normal = pose.position.clone().sub(pose.target);
  normal.y = 0;
  normal.normalize();
  // View from monitor height so the rear machines sit lower against the floor.
  const framing = new THREE.PerspectiveCamera(camera.fov, camera.aspect, 0.01, 100);
  const corners = [];
  for (const x of [cabinet.min.x, cabinet.max.x]) for (const y of [display.min.y, cabinet.max.y]) for (const z of [cabinet.min.z, cabinet.max.z]) corners.push(new THREE.Vector3(x, y, z));
  let distance = 0.5;
  // Fit the monitor AND the full cabinet top, including its rear corners.
  for (let i = 0; i < 100; i++) {
    framing.position.copy(pose.target).addScaledVector(normal, distance);
    framing.lookAt(pose.target); framing.updateMatrixWorld();
    if (corners.every(point => { const p = point.clone().project(framing); return p.z > -1 && p.z < 1 && Math.abs(p.x) <= 0.92 && Math.abs(p.y) <= 0.9; })) break;
    distance *= 1.05;
  }
  pose.position.copy(framing.position);
  let top = -Infinity;
  screen.root.traverse(object => {
    const positions = object.geometry?.attributes.position;
    if (!positions) return;
    const point = new THREE.Vector3();
    for (let i = 0; i < positions.count; i++) {
      point.fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld).project(framing);
      top = Math.max(top, point.y);
    }
  });
  pose.offsetY = (0.94 - top) * stage.clientHeight / 2;
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
function closeScreen() {
  if (!focusedScreen) return;
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
  if (event.key === 'Escape' && focusedScreen) { event.preventDefault(); backOneLevel(); }
});
function showScreenMessage(screen) {
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
function openCabinet() {
  if (focusedScreen || pointer || Math.abs(target - angle) > 0.015 || Math.abs(velocity) > 0.01) return;
  const screen = screens.get(active);
  if (!screen) return;
  ring.rotation.y = angle;
  ring.updateMatrixWorld(true);
  for (const item of screens.values()) item.setIdle();
  screen.setNoise(); focusedScreen = screen;
  view = 'cabinet';
  lastMonitorTap = null;
  zoomTransition = true;
  stage.parentElement.classList.add('screen-open');
  camera.aspect = stage.clientWidth / stage.clientHeight;
  renderer.setSize(stage.clientWidth, stage.clientHeight);
  const pose = zoomPose(screen);
  returnButton.hidden = false;
  const fromZoom = camera.zoom, fromOffset = camera.view?.offsetY || 0;
  const direction = camera.getWorldDirection(new THREE.Vector3());
  const controls = { enabled: true, target: camera.position.clone().addScaledVector(direction, 5), update() {
    const t = Math.min(1, (performance.now() - started) / duration);
    const ease = t * t * (3 - 2 * t);
    camera.zoom = THREE.MathUtils.lerp(fromZoom, 1, ease);
    camera.setViewOffset(stage.clientWidth, stage.clientHeight, 0, THREE.MathUtils.lerp(fromOffset, pose.offsetY, ease), stage.clientWidth, stage.clientHeight);
    camera.lookAt(this.target); camera.updateMatrixWorld(); invalidate();
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
    if (zoomTransition || index !== active || !focusedScreen.hit(raycaster)) { clearMonitorTap(); return; }
    const tap = { time: event.timeStamp, x: event.clientX, y: event.clientY, type: event.pointerType };
    if (lastMonitorTap && tap.type === lastMonitorTap.type && tap.time - lastMonitorTap.time < 400 && Math.hypot(tap.x - lastMonitorTap.x, tap.y - lastMonitorTap.y) < 28) backOneLevel();
    else {
      clearMonitorTap();
      lastMonitorTap = tap;
      if (view === 'cabinet') monitorTapTimer = setTimeout(() => {
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
  const distance = settings.radius + (previousDistance - settings.radius) * height / previousHeight / 3.2;
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
  const offsetY = (original.center - frontBounds().center) * height / 2;
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
