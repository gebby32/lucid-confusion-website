import * as THREE from 'three';

const cachedPoints = new WeakMap();

// Fit the entire group by uniform scale and floor-plane translation. The room
// camera, vertical position, cabinet proportions and contact plane stay fixed.
export function cabinetFraming(screen, ring, camera, angle, width, height, visibleHeight) {
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
  camera.updateMatrixWorld();
  const projection = camera.projectionMatrix.clone().multiply(camera.matrixWorldInverse);
  const e = projection.elements, c = Math.cos(angle), s = Math.sin(angle);
  const projected = points.map(p => {
    const x = c * p.x + s * p.z, z = -s * p.x + c * p.z;
    return [e[0] * x + e[4] * p.y + e[8] * z,
      e[1] * x + e[5] * p.y + e[9] * z,
      e[3] * x + e[7] * p.y + e[11] * z];
  });
  function bounds(scale, z) {
    let top = -Infinity, bottom = Infinity, left = Infinity, right = -Infinity;
    for (const p of projected) {
      const w = p[2] * scale + e[11] * z + e[15];
      const x = (p[0] * scale + e[8] * z + e[12]) / w;
      const y = (p[1] * scale + e[9] * z + e[13]) / w;
      top = Math.max(top, y); bottom = Math.min(bottom, y);
      left = Math.min(left, x); right = Math.max(right, x);
    }
    return { top, bottom, left, right };
  }
  const bottom = 1 - 2 * Math.min(height, visibleHeight) / height;
  const widthLimit = 1 - 2 / width;
  let targetHeight = 1 - bottom, scale = 1, z = 0;
  for (let fit = 0; fit < 4; fit++) {
    for (let i = 0; i < 16; i++) {
      const b = bounds(scale, z), ds = bounds(scale + .0001, z), dz = bounds(scale, z + .0001);
      const f = b.top - bottom - targetHeight, g = b.bottom - bottom;
      if (Math.max(Math.abs(f), Math.abs(g)) < 1e-7) break;
      const a = (ds.top - b.top) / .0001, b1 = (dz.top - b.top) / .0001;
      const c1 = (ds.bottom - b.bottom) / .0001, d = (dz.bottom - b.bottom) / .0001;
      const det = a * d - b1 * c1;
      if (Math.abs(det) < 1e-9) break;
      scale = THREE.MathUtils.clamp(scale - (d * f - b1 * g) / det, .1, 10);
      z -= (a * g - c1 * f) / det;
    }
    const b = bounds(scale, z), extent = Math.max(Math.abs(b.left), Math.abs(b.right));
    if (extent <= widthLimit) break;
    // Very narrow screens may constrain width first; never stretch or crop.
    targetHeight *= widthLimit / extent;
  }
  return { scale, z, angle };
}
