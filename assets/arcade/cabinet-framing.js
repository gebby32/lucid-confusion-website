import * as THREE from 'three';

const cachedPoints = new WeakMap();

// Keep one viewpoint and one floor for both zoom stages. All cabinets receive
// the same uniform enlargement around their feet; their mounts keep their ring
// positions/angles while the whole carriage translates forward. Scaling the
// ring radius instead would send the rear mounts backward across the floor.
export function cabinetFraming(screen, ring, camera, angle, width, height) {
  let points = cachedPoints.get(screen);
  if (!points) {
    ring.updateMatrixWorld(true);
    const inverse = screen.root.parent.matrixWorld.clone().invert();
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
  const e = projection.elements;
  const mount = screen.root.parent;
  const rotation = new THREE.Matrix4().makeRotationY(angle + mount.rotation.y);
  const anchor = mount.position.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
  const bx = e[0] * anchor.x + e[8] * anchor.z + e[12];
  const by = e[1] * anchor.x + e[9] * anchor.z + e[13];
  const bw = e[3] * anchor.x + e[11] * anchor.z + e[15];
  const projected = points.map(p => {
    const v = p.clone().applyMatrix4(rotation);
    return [e[0] * v.x + e[4] * v.y + e[8] * v.z,
      e[1] * v.x + e[5] * v.y + e[9] * v.z,
      e[3] * v.x + e[7] * v.y + e[11] * v.z];
  });
  function bounds(scale, z) {
    let top = -Infinity, bottom = Infinity, left = Infinity, right = -Infinity;
    for (const p of projected) {
      const w = p[2] * scale + e[11] * z + bw;
      const x = (p[0] * scale + e[8] * z + bx) / w;
      const y = (p[1] * scale + e[9] * z + by) / w;
      top = Math.max(top, y); bottom = Math.min(bottom, y);
      left = Math.min(left, x); right = Math.max(right, x);
    }
    return { top, bottom, left, right };
  }
  const widthLimit = 1 - 2 / width;
  let scale = 1, z = 0, targetHeight = 2;
  for (let fit = 0; fit < 4; fit++) {
    for (let i = 0; i < 16; i++) {
      const b = bounds(scale, z), ds = bounds(scale + .0001, z), dz = bounds(scale, z + .0001);
      const f = b.top + 1 - targetHeight, g = b.bottom + 1;
      if (Math.max(Math.abs(f), Math.abs(g)) < 1e-7) break;
      const a = (ds.top - b.top) / .0001, b1 = (dz.top - b.top) / .0001;
      const c1 = (ds.bottom - b.bottom) / .0001, d = (dz.bottom - b.bottom) / .0001;
      const determinant = a * d - b1 * c1;
      if (Math.abs(determinant) < 1e-9) break;
      scale -= (d * f - b1 * g) / determinant;
      z -= (a * g - c1 * f) / determinant;
    }
    const b = bounds(scale, z), extent = Math.max(-b.left, b.right);
    if (extent <= widthLimit) break;
    targetHeight *= widthLimit / extent;
  }
  return { scale, z, angle };
}
