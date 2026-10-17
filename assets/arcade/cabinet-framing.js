import * as THREE from 'three';

const cachedPoints = new WeakMap();

// The carousel is one rigid unit sliding forward on y=0. Lower the cabinet-only
// view gradually as it approaches, so rear contact points advance across the
// static floor instead of rising. The CSS room never uses this camera.
export function cabinetFraming(screen, ring, camera, angle, width, height) {
  let points = cachedPoints.get(screen);
  if (!points) {
    ring.updateMatrixWorld(true);
    const inverse = ring.matrixWorld.clone().invert();
    points = [];
    screen.root.traverse(object => {
      const positions = object.geometry?.attributes.position;
      if (!positions) return;
      const matrix = inverse.clone().multiply(object.matrixWorld);
      for (let i = 0; i < positions.count; i++) {
        points.push(new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(matrix));
      }
    });
    cachedPoints.set(screen, points);
  }
  camera.position.y = .7;
  camera.clearViewOffset();
  camera.updateMatrixWorld();
  const projection = camera.projectionMatrix.clone().multiply(camera.matrixWorldInverse);
  const e = projection.elements, c = Math.cos(angle), s = Math.sin(angle);
  let nearestZ = -Infinity;
  const projected = points.map(p => {
    const x = c * p.x + s * p.z, z = -s * p.x + c * p.z;
    nearestZ = Math.max(nearestZ, z);
    return [e[0] * x + e[4] * p.y + e[8] * z,
      e[1] * x + e[5] * p.y + e[9] * z,
      e[3] * x + e[7] * p.y + e[11] * z];
  });
  function bounds(z) {
    let top = -Infinity, bottom = Infinity, left = Infinity, right = -Infinity;
    for (const p of projected) {
      const w = p[2] + e[11] * z + e[15];
      const x = (p[0] + e[8] * z + e[12]) / w;
      const y = (p[1] + e[9] * z + e[13]) / w;
      top = Math.max(top, y); bottom = Math.min(bottom, y);
      left = Math.min(left, x); right = Math.max(right, x);
    }
    return { top, bottom, left, right };
  }
  const widthLimit = 1 - 2 / width;
  let near = camera.position.z - nearestZ - camera.near * 2, far = 0;
  for (let i = 0; i < 28; i++) {
    const z = (far + near) / 2, b = bounds(z);
    // Fit actual model vertices, not a loose bounding box. Narrow portrait
    // windows can be width-limited; preserving proportions takes precedence.
    if (b.top - b.bottom > 2 || Math.max(-b.left, b.right) > widthLimit) near = z;
    else far = z;
  }
  const b = bounds(far);
  camera.setViewOffset(width, height, 0, -(b.bottom + 1) * height / 2, width, height);
  return { scale: 1, z: far, angle };
}
