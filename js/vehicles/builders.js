// Vehicle mesh builders — procedural, stil tools.js.
// Fiecare builder returneaza { group, wheels, bladeAnchor, headlights, hood }.

import * as THREE from 'three';
import { RoundedBoxGeometry } from '../lib/RoundedBoxGeometry.js';

const M = {
  metal: (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.35 }),
  matte: (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.1 }),
  glass: () => new THREE.MeshStandardMaterial({ color: 0x2a3644, roughness: 0.25, metalness: 0.3, opacity: 0.85, transparent: true }),
  rubber: () => new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 1.0, metalness: 0 }),
  headlight: () => new THREE.MeshStandardMaterial({ color: 0xfff7c0, emissive: 0xfff2a0, emissiveIntensity: 0.4 })
};

function wheel(radius = 0.32, thickness = 0.22) {
  const w = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, thickness, 14), M.rubber());
  w.rotation.z = Math.PI / 2;
  w.castShadow = true;
  return w;
}

function headlight(color = 0xfff2a0) {
  const light = new THREE.PointLight(color, 0.0, 14, 2); // intensity toggled by system
  light.userData.baseIntensity = 0.6;
  return light;
}

function shadow(m) { m.castShadow = true; m.receiveShadow = true; return m; }

/* ================================= ATV ================================= */

function buildATV(color = 0xd84040) {
  const group = new THREE.Group();
  const wheels = [];

  // Chassis
  const body = shadow(new THREE.Mesh(new RoundedBoxGeometry(1.3, 0.4, 2.0, 3, 0.1), M.metal(color)));
  body.position.y = 0.55;
  group.add(body);

  // Seat
  const seat = shadow(new THREE.Mesh(new RoundedBoxGeometry(0.6, 0.15, 0.5, 2, 0.06), M.matte(0x2c2c2c)));
  seat.position.set(0, 0.85, -0.1);
  group.add(seat);

  // Front handle bar
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8), M.metal(0x8a8a8a));
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, 1.0, 0.55);
  group.add(bar);

  // Wheels: 4 corners
  const wheelPositions = [
    [-0.55, 0.32,  0.75],
    [ 0.55, 0.32,  0.75],
    [-0.55, 0.32, -0.75],
    [ 0.55, 0.32, -0.75]
  ];
  for (const [x, y, z] of wheelPositions) {
    const w = wheel(0.32, 0.2);
    w.position.set(x, y, z);
    group.add(w);
    wheels.push(w);
  }

  // Headlights
  const hl1 = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), M.headlight());
  hl1.position.set(-0.28, 0.75, 1.02);
  const hl2 = hl1.clone();
  hl2.position.set(0.28, 0.75, 1.02);
  group.add(hl1, hl2);

  const hLight1 = headlight();
  hLight1.position.set(-0.28, 0.75, 1.15);
  const hLight2 = headlight();
  hLight2.position.set(0.28, 0.75, 1.15);
  group.add(hLight1, hLight2);

  // Blade anchor (front-center)
  const bladeAnchor = new THREE.Object3D();
  bladeAnchor.position.set(0, 0.35, 1.15);
  group.add(bladeAnchor);

  const hood = body;
  return { group, wheels, bladeAnchor, headlights: [hLight1, hLight2], hood, headlightMeshes: [hl1, hl2] };
}

/* =============================== TRUCK ================================= */

function buildTruck(color = 0xf4a020) {
  const group = new THREE.Group();
  const wheels = [];

  // Cabin
  const cabin = shadow(new THREE.Mesh(new RoundedBoxGeometry(2.0, 1.2, 1.6, 3, 0.15), M.metal(color)));
  cabin.position.set(0, 0.95, 0.7);
  group.add(cabin);

  // Windshield
  const wind = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.55), M.glass());
  wind.position.set(0, 1.35, 1.51);
  wind.rotation.x = -0.15;
  group.add(wind);

  // Cargo box
  const cargo = shadow(new THREE.Mesh(new RoundedBoxGeometry(2.1, 1.4, 2.2, 3, 0.12), M.matte(color * 0.85 & 0xffffff)));
  cargo.position.set(0, 1.0, -0.9);
  group.add(cargo);

  // Wheels (6 for a big truck: 2 front, 4 rear)
  const wheelPositions = [
    [-0.9, 0.42,  1.1], [ 0.9, 0.42,  1.1],
    [-0.9, 0.42, -0.4], [ 0.9, 0.42, -0.4],
    [-0.9, 0.42, -1.5], [ 0.9, 0.42, -1.5]
  ];
  for (const [x, y, z] of wheelPositions) {
    const w = wheel(0.42, 0.28);
    w.position.set(x, y, z);
    group.add(w);
    wheels.push(w);
  }

  // Headlights
  const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.05), M.headlight());
  hl1.position.set(-0.6, 0.75, 1.55);
  const hl2 = hl1.clone();
  hl2.position.set(0.6, 0.75, 1.55);
  group.add(hl1, hl2);

  const hLight1 = headlight();
  hLight1.position.set(-0.6, 0.9, 1.7);
  const hLight2 = headlight();
  hLight2.position.set(0.6, 0.9, 1.7);
  group.add(hLight1, hLight2);

  // Blade anchor
  const bladeAnchor = new THREE.Object3D();
  bladeAnchor.position.set(0, 0.4, 1.65);
  group.add(bladeAnchor);

  return { group, wheels, bladeAnchor, headlights: [hLight1, hLight2], hood: cabin, headlightMeshes: [hl1, hl2] };
}

/* =============================== TRACTOR ================================ */

function buildTractor(color = 0x30a040) {
  const group = new THREE.Group();
  const wheels = [];

  // Long hood
  const hood = shadow(new THREE.Mesh(new RoundedBoxGeometry(1.2, 0.75, 1.6, 3, 0.1), M.metal(color)));
  hood.position.set(0, 0.9, 0.7);
  group.add(hood);

  // Cabin (tall)
  const cabin = shadow(new THREE.Mesh(new RoundedBoxGeometry(1.4, 1.4, 1.4, 3, 0.1), M.metal(color)));
  cabin.position.set(0, 1.5, -0.4);
  group.add(cabin);

  // Cabin windows (glass all around)
  const glassM = M.glass();
  const glassF = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.9), glassM);
  glassF.position.set(0, 1.75, 0.31); glassF.rotation.x = -0.1;
  group.add(glassF);

  // Big rear wheels
  const rearL = wheel(0.7, 0.35); rearL.position.set(-0.95, 0.7, -0.8); group.add(rearL); wheels.push(rearL);
  const rearR = wheel(0.7, 0.35); rearR.position.set( 0.95, 0.7, -0.8); group.add(rearR); wheels.push(rearR);

  // Small front wheels
  const frontL = wheel(0.4, 0.25); frontL.position.set(-0.8, 0.4, 0.9); group.add(frontL); wheels.push(frontL);
  const frontR = wheel(0.4, 0.25); frontR.position.set( 0.8, 0.4, 0.9); group.add(frontR); wheels.push(frontR);

  // Headlights
  const hl1 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), M.headlight());
  hl1.position.set(-0.5, 1.0, 1.52);
  const hl2 = hl1.clone(); hl2.position.set(0.5, 1.0, 1.52);
  group.add(hl1, hl2);

  const hLight1 = headlight(); hLight1.position.set(-0.5, 1.0, 1.7);
  const hLight2 = headlight(); hLight2.position.set( 0.5, 1.0, 1.7);
  group.add(hLight1, hLight2);

  // Exhaust pipe
  const exh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 8), M.metal(0x2a2a2a));
  exh.position.set(0.55, 1.7, 0.55);
  group.add(exh);

  // Blade anchor (front-low)
  const bladeAnchor = new THREE.Object3D();
  bladeAnchor.position.set(0, 0.4, 1.55);
  group.add(bladeAnchor);

  return { group, wheels, bladeAnchor, headlights: [hLight1, hLight2], hood, headlightMeshes: [hl1, hl2] };
}

/* ============================== WHEEL LOADER ============================ */

function buildLoader(color = 0xeed030) {
  const group = new THREE.Group();
  const wheels = [];

  // Rear chassis
  const rear = shadow(new THREE.Mesh(new RoundedBoxGeometry(1.6, 1.0, 1.6, 3, 0.12), M.metal(color)));
  rear.position.set(0, 0.9, -0.7);
  group.add(rear);

  // Cabin
  const cabin = shadow(new THREE.Mesh(new RoundedBoxGeometry(1.2, 1.0, 1.0, 3, 0.1), M.metal(color)));
  cabin.position.set(0, 1.7, -0.7);
  group.add(cabin);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.7), M.glass());
  glass.position.set(0, 1.85, -0.2); glass.rotation.x = -0.1;
  group.add(glass);

  // Front chassis (articulated)
  const front = shadow(new THREE.Mesh(new RoundedBoxGeometry(1.4, 0.8, 1.0, 3, 0.1), M.metal(color)));
  front.position.set(0, 0.75, 0.6);
  group.add(front);

  // Loader arms (front-up angle)
  const armL = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 1.6), M.metal(color * 0.9 & 0xffffff)));
  armL.position.set(-0.5, 1.15, 1.1);
  armL.rotation.x = -0.35;
  group.add(armL);
  const armR = armL.clone(); armR.position.x = 0.5;
  group.add(armR);

  // Bucket
  const bucket = shadow(new THREE.Mesh(new RoundedBoxGeometry(2.0, 0.6, 0.9, 3, 0.08), M.metal(0xd8a020)));
  bucket.position.set(0, 0.85, 2.05);
  bucket.rotation.x = -0.15;
  group.add(bucket);

  // 4 big wheels
  const wheelPositions = [
    [-0.9, 0.55,  0.4], [ 0.9, 0.55,  0.4],
    [-0.9, 0.55, -1.3], [ 0.9, 0.55, -1.3]
  ];
  for (const [x, y, z] of wheelPositions) {
    const w = wheel(0.55, 0.35);
    w.position.set(x, y, z);
    group.add(w);
    wheels.push(w);
  }

  // Headlights
  const hl1 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), M.headlight());
  hl1.position.set(-0.5, 1.15, 1.02);
  const hl2 = hl1.clone(); hl2.position.set(0.5, 1.15, 1.02);
  group.add(hl1, hl2);

  const hLight1 = headlight(); hLight1.position.set(-0.5, 1.4, 1.1);
  const hLight2 = headlight(); hLight2.position.set( 0.5, 1.4, 1.1);
  group.add(hLight1, hLight2);

  // Blade anchor (bucket location)
  const bladeAnchor = new THREE.Object3D();
  bladeAnchor.position.set(0, 0.4, 2.3);
  group.add(bladeAnchor);

  return { group, wheels, bladeAnchor, headlights: [hLight1, hLight2], hood: front, headlightMeshes: [hl1, hl2] };
}

/* =============================== EXPORT ================================= */

export const VEHICLE_BUILDERS = {
  atv_basic: buildATV,
  truck_plow: buildTruck,
  tractor_utility: buildTractor,
  loader_wheel: buildLoader
};
