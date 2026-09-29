import * as THREE from 'three';
import { RoundedBoxGeometry } from './lib/RoundedBoxGeometry.js';

/* =========================================================
   TOOLS — cele 5 unelte de curatat zapada, dupa referinta:
   1. Classic Shovel   — lopata neagra cu accente portocalii
   2. Wide Snow Pusher — lama portocalie foarte lata
   3. Snow Broom       — perie lata cu peri galben-portocalii
   4. Snow Blower      — suflanta rosie cu teava neagra
   5. Heat Ray         — unealta futurista alb/negru cu cyan
   Fiecare intoarce { group, gripTop, gripLow, hold, anim,
   bladePts (puncte locale de topire), radius, beam? }
   ========================================================= */

const M = {
  darkShaft:  () => new THREE.MeshStandardMaterial({ color: 0x23262e, roughness: 0.55, metalness: 0.35 }),
  orange:     () => new THREE.MeshStandardMaterial({ color: 0xf07818, roughness: 0.5, metalness: 0.15 }),
  black:      () => new THREE.MeshStandardMaterial({ color: 0x14161c, roughness: 0.6, metalness: 0.1 }),
  steel:      () => new THREE.MeshStandardMaterial({ color: 0xb9bfc9, roughness: 0.3, metalness: 0.9 }),
  rubber:     () => new THREE.MeshStandardMaterial({ color: 0x1e2128, roughness: 0.7, metalness: 0.05 }),
  red:        () => new THREE.MeshStandardMaterial({ color: 0xd8402c, roughness: 0.45, metalness: 0.2 }),
  white:      () => new THREE.MeshStandardMaterial({ color: 0xe8ecf4, roughness: 0.35, metalness: 0.25 }),
  bristle:    () => new THREE.MeshStandardMaterial({ color: 0xe8a23c, roughness: 0.95 }),
  cyanGlow:   () => new THREE.MeshStandardMaterial({ color: 0x39d8ff, emissive: 0x2ec8ff, emissiveIntensity: 1.6, roughness: 0.4 }),
  orangeGlow: () => new THREE.MeshStandardMaterial({ color: 0xffb050, emissive: 0xff8c2a, emissiveIntensity: 2.2, roughness: 0.4 }),
};

function shadow(mesh) { mesh.castShadow = true; return mesh; }

/* ---------- 1. CLASSIC SHOVEL ---------- */
function buildClassicShovel() {
  const g = new THREE.Group();
  const dark = M.darkShaft(), orange = M.orange(), black = M.black(), rubber = M.rubber();

  const shaft = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, 1.14, 14), dark));
  shaft.position.y = 0.66; g.add(shaft);

  // D-grip portocaliu sus
  const dRing = shadow(new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 10, 22, Math.PI), orange));
  dRing.position.y = 1.24; g.add(dRing);
  const dBar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.17, 10), rubber);
  dBar.rotation.z = Math.PI / 2; dBar.position.y = 1.24; g.add(dBar);

  // inele portocalii pe tija
  for (const y of [0.95, 0.42]) {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.05, 12), orange);
    ring.position.y = y; g.add(ring);
  }
  const midGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.16, 12), rubber);
  midGrip.position.y = 0.8; g.add(midGrip);

  // lama neagra usor curbata, ingusta
  const blade = shadow(new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.62, 24, 1, true, Math.PI, Math.PI * 0.55), black));
  blade.rotation.z = Math.PI / 2;
  blade.position.set(0, 0.19, -0.1);
  blade.material.side = THREE.DoubleSide;
  g.add(blade);

  // margine portocalie jos (banda de uzura)
  const wear = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.035, 0.03), orange));
  wear.position.set(0, 0.018, -0.28); g.add(wear);
  // margini laterale portocalii
  for (const sx of [-0.31, 0.31]) {
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.3, 0.03), orange);
    edge.position.set(sx, 0.16, -0.2); edge.rotation.x = 0.5; g.add(edge);
  }

  const gripTop = new THREE.Object3D(); gripTop.position.set(0, 1.22, 0); g.add(gripTop);
  const gripLow = new THREE.Object3D(); gripLow.position.set(0, 0.8, 0); g.add(gripLow);
  return {
    group: g, gripTop, gripLow,
    hold: { pos: [0.02, 0.03, -0.95], rotX: 0.68 },
    anim: 'push',
    bladePts: [[-0.3, 0.018, -0.28], [0, 0.018, -0.28], [0.3, 0.018, -0.28]],
    radius: 0.85
  };
}

/* ---------- 2. WIDE SNOW PUSHER ---------- */
function buildWidePusher() {
  const g = new THREE.Group();
  const orange = M.orange(), black = M.black(), steel = M.steel(), rubber = M.rubber();

  // lama portocalie foarte lata, curbata
  const blade = shadow(new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.34, 1.5, 30, 1, true, Math.PI, Math.PI * 0.58), orange));
  blade.rotation.z = Math.PI / 2;
  blade.position.set(0, 0.21, -0.12);
  blade.material.side = THREE.DoubleSide;
  g.add(blade);

  // banda neagra sus, pe toata latimea
  const strip = shadow(new THREE.Mesh(new RoundedBoxGeometry(1.52, 0.11, 0.06, 2, 0.02), black));
  strip.position.set(0, 0.5, 0.09); strip.rotation.x = -0.35; g.add(strip);

  // banda de uzura metalica jos
  const wear = shadow(new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.04, 0.03), steel));
  wear.position.set(0, 0.018, -0.31); g.add(wear);

  // doua brate metalice de sustinere
  for (const sx of [-0.34, 0.34]) {
    const arm = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 1.0, 12), steel));
    arm.position.set(sx * 0.55, 0.82, 0.1);
    arm.rotation.x = 0.22;
    arm.rotation.z = -sx * 0.28;
    g.add(arm);
  }
  // traversa intre brate
  const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.42, 10), steel);
  cross.rotation.z = Math.PI / 2; cross.position.set(0, 0.85, 0.14); g.add(cross);

  // maner superior lat, cauciucat
  const handle = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.56, 14), rubber));
  handle.rotation.z = Math.PI / 2;
  handle.position.set(0, 1.3, 0.24); g.add(handle);
  for (const sx of [-0.26, 0.26]) {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), M.orange());
    cap.position.set(sx, 1.3, 0.24); g.add(cap);
  }

  const gripTop = new THREE.Object3D(); gripTop.position.set(0.17, 1.3, 0.24); g.add(gripTop);
  const gripLow = new THREE.Object3D(); gripLow.position.set(-0.17, 1.3, 0.24); g.add(gripLow);
  return {
    group: g, gripTop, gripLow,
    hold: { pos: [0.0, 0.03, -1.0], rotX: 0.52 },
    anim: 'heavyPush',
    bladePts: [[-0.72, 0.018, -0.31], [-0.36, 0.018, -0.31], [0, 0.018, -0.31], [0.36, 0.018, -0.31], [0.72, 0.018, -0.31]],
    radius: 1.35
  };
}

/* ---------- 3. SNOW BROOM ---------- */
function buildSnowBroom() {
  const g = new THREE.Group();
  const orange = M.orange(), black = M.black(), bristle = M.bristle(), rubber = M.rubber();

  // coada lunga: jumatate portocalie sus, neagra jos
  const shaftTop = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.021, 0.62, 12), orange));
  shaftTop.position.y = 1.0; g.add(shaftTop);
  const shaftLow = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.023, 0.64, 12), black));
  shaftLow.position.y = 0.38; g.add(shaftLow);

  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), black);
  knob.position.y = 1.32; g.add(knob);
  const midGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.16, 12), rubber);
  midGrip.position.y = 0.78; g.add(midGrip);

  // capul periei: bara neagra sus + peri galben-portocalii
  const head = new THREE.Group();
  const bar = shadow(new THREE.Mesh(new RoundedBoxGeometry(0.92, 0.09, 0.14, 2, 0.03), black));
  bar.position.y = 0.14; head.add(bar);
  const clamp = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.07, 0.16, 2, 0.02), orange);
  clamp.position.y = 0.2; head.add(clamp);

  // peri — trei randuri de placi cu varfuri
  for (const dz of [-0.045, 0, 0.045]) {
    const brush = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.17, 0.035), bristle));
    brush.position.set(0, 0.015, dz);
    brush.rotation.x = dz * 1.6;
    head.add(brush);
  }
  // striuri verticale in peri (aspect de fire)
  for (let i = -4; i <= 4; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.17, 0.11), M.orange());
    line.position.set(i * 0.1, 0.012, 0);
    head.add(line);
  }
  head.position.set(0, 0, -0.16);
  head.rotation.x = 0.25;
  g.add(head);

  const gripTop = new THREE.Object3D(); gripTop.position.set(0, 1.18, 0); g.add(gripTop);
  const gripLow = new THREE.Object3D(); gripLow.position.set(0, 0.78, 0); g.add(gripLow);
  return {
    group: g, gripTop, gripLow,
    hold: { pos: [0.02, 0.03, -0.92], rotX: 0.62 },
    anim: 'sweep',
    bladePts: [[-0.42, 0.02, -0.2], [-0.14, 0.02, -0.2], [0.14, 0.02, -0.2], [0.42, 0.02, -0.2]],
    radius: 0.95
  };
}

/* ---------- 4. SNOW BLOWER ---------- */
function buildSnowBlower() {
  const g = new THREE.Group();
  const red = M.red(), black = M.black(), steel = M.steel(), rubber = M.rubber();

  // corp rosu compact
  const body = shadow(new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.28, 0.44, 4, 0.08), red));
  g.add(body);

  // motor vizibil (cilindru negru lateral cu fante)
  const motor = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.1, 18), black));
  motor.rotation.z = Math.PI / 2;
  motor.position.set(0.18, 0.02, 0.05); g.add(motor);
  const motorCap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 14), steel);
  motorCap.rotation.z = Math.PI / 2;
  motorCap.position.set(0.245, 0.02, 0.05); g.add(motorCap);
  // fante de aerisire
  for (let i = 0; i < 3; i++) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.014, 0.05), black);
    vent.position.set(0, 0.1 - i * 0.05, 0.2); g.add(vent);
  }

  // maner superior negru
  const handle = shadow(new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.024, 10, 18, Math.PI), rubber));
  handle.position.set(0, 0.2, 0.06); g.add(handle);

  // maner frontal sub teava
  const fGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.14, 10), rubber);
  fGrip.rotation.z = Math.PI / 2;
  fGrip.position.set(0, -0.1, -0.28); g.add(fGrip);

  // teava neagra mare in fata, inclinata spre sol
  const tube = new THREE.Group();
  const pipe = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.62, 18), black));
  pipe.rotation.x = Math.PI / 2;
  pipe.position.z = -0.31;
  tube.add(pipe);
  const nozzle = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.07, 0.14, 18), black));
  nozzle.rotation.x = Math.PI / 2;
  nozzle.position.z = -0.66;
  tube.add(nozzle);
  const nozzleRing = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.014, 8, 20), M.red());
  nozzleRing.position.z = -0.73; tube.add(nozzleRing);
  tube.position.set(0, -0.02, -0.2);
  tube.rotation.x = -0.38; // aplecata spre zapada
  g.add(tube);

  // jet de aer vizibil din teava (con aditiv, pulseaza cand motorul merge)
  const jetMat = new THREE.MeshBasicMaterial({
    color: 0xdff2ff, transparent: true, opacity: 0.22,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
  });
  const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.34, 1.3, 14, 1, true), jetMat);
  jet.rotation.x = Math.PI / 2;
  jet.position.z = -1.45;
  tube.add(jet);
  // al doilea con, mai lung si mai difuz
  const jetFar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.5, 0.9, 14, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.1,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    })
  );
  jetFar.rotation.x = Math.PI / 2;
  jetFar.position.z = -2.4;
  tube.add(jetFar);

  const gripTop = new THREE.Object3D(); gripTop.position.set(0, 0.3, 0.06); g.add(gripTop);
  const gripLow = new THREE.Object3D(); gripLow.position.set(0, -0.1, -0.28); g.add(gripLow);
  return {
    group: g, gripTop, gripLow,
    hold: { pos: [0.02, 0.92, -0.42], rotX: 0.1 },
    anim: 'vibrate',
    // jetul sufla zapada in fata, la distanta de teava
    bladePts: [[0, -0.7, -1.1], [-0.35, -0.75, -1.5], [0.35, -0.75, -1.5], [0, -0.8, -1.9]],
    radius: 1.2,
    jetParts: { jet, jetFar }
  };
}

/* ---------- 5. HEAT RAY ---------- */
function buildHeatRay() {
  const g = new THREE.Group();
  const white = M.white(), black = M.black(), steel = M.steel(), cyan = M.cyanGlow(), oGlow = M.orangeGlow();

  // corp alb alungit
  const body = shadow(new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.2, 0.6, 4, 0.07), white));
  body.position.z = -0.1; g.add(body);
  // sectiune neagra la mijloc
  const mid = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.22, 0.14, 3, 0.05), black);
  mid.position.z = -0.1; g.add(mid);

  // tuburi luminoase cyan pe laterale
  for (const sx of [-0.11, 0.11]) {
    const tubeGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.44, 10), cyan);
    tubeGlow.rotation.x = Math.PI / 2;
    tubeGlow.position.set(sx, 0.04, -0.12);
    g.add(tubeGlow);
  }
  // inel metalic frontal
  const collar = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.1, 18), steel));
  collar.rotation.x = Math.PI / 2;
  collar.position.z = -0.44; g.add(collar);
  // emitator frontal cu lumina portocalie
  const emitter = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.05, 18), oGlow);
  emitter.rotation.x = Math.PI / 2;
  emitter.position.z = -0.5; g.add(emitter);
  const emitterRing = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.016, 8, 20), cyan);
  emitterRing.position.z = -0.48; g.add(emitterRing);

  // maner spate + maner sub corp
  const rearGrip = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.16, 12), black));
  rearGrip.position.set(0, -0.14, 0.16);
  rearGrip.rotation.x = 0.35;
  g.add(rearGrip);
  const underGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.14, 10), black);
  underGrip.rotation.z = Math.PI / 2;
  underGrip.position.set(0, -0.14, -0.22); g.add(underGrip);

  // fascicul stabil spre sol (aditiv, mereu vizibil cand e echipat)
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x6ae4ff, transparent: true, opacity: 0.4,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.16, 1.6, 12, 1, true), beamMat);
  beam.rotation.x = Math.PI / 2 - 0.62; // spre sol
  beam.position.set(0, -0.45, -1.15);
  g.add(beam);
  // halou exterior difuz al fasciculului
  const beamOuter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.3, 1.6, 12, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x39d8ff, transparent: true, opacity: 0.14,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    })
  );
  beamOuter.rotation.copy(beam.rotation);
  beamOuter.position.copy(beam.position);
  g.add(beamOuter);
  // punct cald portocaliu la impact
  const hot = new THREE.Mesh(
    new THREE.CircleGeometry(0.3, 20),
    new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  hot.rotation.x = -Math.PI / 2;
  hot.position.set(0, -0.86, -1.75);
  g.add(hot);

  const gripTop = new THREE.Object3D(); gripTop.position.set(0, -0.1, 0.16); g.add(gripTop);
  const gripLow = new THREE.Object3D(); gripLow.position.set(0, -0.14, -0.22); g.add(gripLow);
  return {
    group: g, gripTop, gripLow,
    hold: { pos: [0.05, 0.98, -0.4], rotX: 0.3 },
    anim: 'beam',
    bladePts: [[0, -0.86, -1.45], [0, -0.86, -1.75], [-0.25, -0.86, -1.75], [0.25, -0.86, -1.75], [0, -0.86, -2.05]],
    radius: 1.0,
    beamParts: { beam, beamOuter, hot }
  };
}

export const TOOL_BUILDERS = {
  shovel: buildClassicShovel,
  pusher: buildWidePusher,
  broom:  buildSnowBroom,
  blower: buildSnowBlower,
  heat:   buildHeatRay
};
