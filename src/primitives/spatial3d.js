/**
 * @file src/primitives/spatial3d.js
 * @description Deterministic 3D Wireframe / Point-Cloud / Polyhedron Projection Primitives
 * (Works natively on any 2D Canvas WITH ZERO WebGL requirement, plus optional Three.js offscreen bridge).
 *
 * Why a built-in deterministic 3D software projector too?
 * Headless Linux servers / CI / Docker containers often run without GPU drivers, causing WebGL
 * to slow down or fail. This module renders crisp 60fps 3D perspective geometry, orbital rings,
 * neural network topologies, and rotating Torus/Icosahedron hero marks anywhere!
 */

import { interpolate } from '../core/easing.js';
import { hexToRgba } from './charts.js';

/**
 * Project a 3D point [x, y, z] onto 2D canvas coordinates with perspective focal length.
 */
export function project3D([x, y, z], {
  cx,
  cy,
  fov = 720,
  cameraZ = 4.2,
  rotX = 0,
  rotY = 0,
  rotZ = 0,
}) {
  // Rotate around X
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  let y1 = y * cosX - z * sinX;
  let z1 = y * sinX + z * cosX;
  let x1 = x;

  // Rotate around Y
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  let x2 = x1 * cosY + z1 * sinY;
  let z2 = -x1 * sinY + z1 * cosY;
  let y2 = y1;

  // Rotate around Z
  const cosZ = Math.cos(rotZ);
  const sinZ = Math.sin(rotZ);
  let x3 = x2 * cosZ - y2 * sinZ;
  let y3 = x2 * sinZ + y2 * cosZ;
  let z3 = z2;

  const depth = Math.max(0.4, cameraZ - z3);
  const scale = fov / depth;
  return {
    x: cx + x3 * scale,
    y: cy + y3 * scale,
    z: z3,
    scale,
  };
}

/**
 * Hero 3D Geodesic / Icosahedron Spatial Core with Depth-Sorted Glowing Nodes & Orbital Rings.
 * Ideal for AI / Tech / Science / Crypto / Deep-Dive YouTube intros & explainers.
 */
export function drawSpatial3DCore(ctx, frame, {
  cx,
  cy,
  radius = 1.45,
  fov = 680,
  accentColor = '#38BDF8',
  secondaryColor = '#818CF8',
  enterFrames = 28,
} = {}) {
  const enterScale = interpolate(frame, [0, enterFrames], [1.65, 1], { easing: 'softLand' });
  const enterAlpha = interpolate(frame, [0, 14], [0, 1], { easing: 'easeOutCubic' });

  const phi = (1 + Math.sqrt(5)) / 2;
  const rawVerts = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1],
  ].map(([vx, vy, vz]) => {
    const len = Math.hypot(vx, vy, vz);
    const r = radius * enterScale;
    return [(vx / len) * r, (vy / len) * r, (vz / len) * r];
  });

  // Edges of icosahedron (vertices within distance ~1.1 * radius)
  const edges = [];
  for (let i = 0; i < rawVerts.length; i++) {
    for (let j = i + 1; j < rawVerts.length; j++) {
      const d = Math.hypot(
        rawVerts[i][0] - rawVerts[j][0],
        rawVerts[i][1] - rawVerts[j][1],
        rawVerts[i][2] - rawVerts[j][2]
      );
      if (d < radius * enterScale * 1.15) {
        edges.push([i, j]);
      }
    }
  }

  const rotX = frame * 0.014 + 0.35;
  const rotY = frame * 0.022;
  const rotZ = frame * 0.008;

  const projected = rawVerts.map((v) => project3D(v, { cx, cy, fov, rotX, rotY, rotZ }));

  ctx.save();
  ctx.globalAlpha = enterAlpha;

  // Draw outer orbital ring in 3D
  const ringSegments = 64;
  ctx.beginPath();
  for (let i = 0; i <= ringSegments; i++) {
    const theta = (i / ringSegments) * Math.PI * 2;
    const rx = Math.cos(theta) * radius * 1.48 * enterScale;
    const rz = Math.sin(theta) * radius * 1.48 * enterScale;
    const p = project3D([rx, 0, rz], {
      cx,
      cy,
      fov,
      rotX: rotX * 0.6 + 0.7,
      rotY: -rotY * 0.8,
      rotZ: 0.25,
    });
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.strokeStyle = hexToRgba(secondaryColor, 0.38);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Sort edges back-to-front by average Z
  const sortedEdges = edges
    .map(([a, b]) => ({
      a: projected[a],
      b: projected[b],
      avgZ: (projected[a].z + projected[b].z) / 2,
    }))
    .sort((e1, e2) => e1.avgZ - e2.avgZ);

  for (const edge of sortedEdges) {
    const depthAlpha = interpolate(edge.avgZ, [-radius, radius], [0.18, 0.92]);
    ctx.strokeStyle = hexToRgba(accentColor, depthAlpha);
    ctx.lineWidth = interpolate(edge.avgZ, [-radius, radius], [1.2, 3.2]);
    ctx.beginPath();
    ctx.moveTo(edge.a.x, edge.a.y);
    ctx.lineTo(edge.b.x, edge.b.y);
    ctx.stroke();
  }

  // Draw depth-sorted vertices
  const sortedVerts = [...projected].sort((a, b) => a.z - b.z);
  for (const p of sortedVerts) {
    const depthFactor = interpolate(p.z, [-radius, radius], [0.4, 1]);
    const nodeR = 3.5 + depthFactor * 5;
    ctx.fillStyle = hexToRgba(accentColor, depthFactor);
    ctx.beginPath();
    ctx.arc(p.x, p.y, nodeR, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
