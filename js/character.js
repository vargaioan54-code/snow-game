import * as THREE from 'three';
import { GLTFLoader } from './lib/GLTFLoader.js';
import { RoundedBoxGeometry } from './lib/RoundedBoxGeometry.js';
import { TOOL_BUILDERS } from './tools.js?v=6';

/* =========================================================
   CHARACTER — om realist (Mixamo Soldier riguit) cu Idle
   cand sta pe loc si Walk cand este miscat. Bratele sunt
   fortate pe manerul uneltei in fiecare cadru. Radacina se
   roteste spre directia de miscare.
   ========================================================= */

const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();
const _v4 = new THREE.Vector3(), _tgt = new THREE.Vector3();
const _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion();
const _X = new THREE.Vector3(1, 0, 0);

function aimBone(bone, child, targetWorld) {
  bone.updateWorldMatrix(true, false);
  child.updateWorldMatrix(false, false);
  const bonePos = _v1.setFromMatrixPosition(bone.matrixWorld);
  const childPos = _v2.setFromMatrixPosition(child.matrixWorld);
  const cur = _v3.subVectors(childPos, bonePos).normalize();
  const des = _v4.subVectors(targetWorld, bonePos).normalize();
  if (cur.lengthSq() < 1e-8 || des.lengthSq() < 1e-8) return;
  _q1.setFromUnitVectors(cur, des);
  bone.getWorldQuaternion(_q2);
  _q2.premultiply(_q1);
  bone.parent.getWorldQuaternion(_q3).invert();
  bone.quaternion.copy(_q3.multiply(_q2));
}

function buildPack() {
  const g = new THREE.Group();
  const cloth = new THREE.MeshStandardMaterial({ color: 0x46506a, roughness: 0.92 });
  const clothLight = new THREE.MeshStandardMaterial({ color: 0x5a6580, roughness: 0.92 });
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x171a21, roughness: 0.85 });
  const zipMat = new THREE.MeshStandardMaterial({ color: 0xdfe4ef, roughness: 0.5, metalness: 0.4 });

  const body = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.5, 0.24, 5, 0.1), cloth);
  body.castShadow = true; g.add(body);

  const lid = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), cloth);
  lid.scale.set(1.05, 0.55, 0.6); lid.position.set(0, 0.26, 0); lid.castShadow = true; g.add(lid);

  const topHandle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.014, 8, 16, Math.PI), strapMat);
  topHandle.position.set(0, 0.33, 0.03); g.add(topHandle);

  const pocket = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.26, 0.09, 4, 0.045), clothLight);
  pocket.position.set(0, -0.08, 0.14); g.add(pocket);

  const zip = new THREE.Mesh(new RoundedBoxGeometry(0.026, 0.24, 0.02, 2, 0.01), zipMat);
  zip.position.set(0, 0.1, 0.135); g.add(zip);
  const puller = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), zipMat);
  puller.position.set(0, -0.03, 0.145); g.add(puller);

  for (const side of [-1, 1]) {
    const buckle = new THREE.Mesh(new RoundedBoxGeometry(0.045, 0.06, 0.03, 2, 0.012), strapMat);
    buckle.position.set(side * 0.2, -0.02, 0.1); g.add(buckle);
    const strap = new THREE.Mesh(new RoundedBoxGeometry(0.02, 0.3, 0.26, 2, 0.008), strapMat);
    strap.position.set(side * 0.205, 0.02, 0); g.add(strap);
  }
  for (const side of [-1, 1]) {
    const strapTop = new THREE.Mesh(new RoundedBoxGeometry(0.07, 0.04, 0.3, 2, 0.015), strapMat);
    strapTop.position.set(side * 0.11, 0.22, -0.17); strapTop.rotation.x = 0.35; g.add(strapTop);
    const strapDown = new THREE.Mesh(new RoundedBoxGeometry(0.065, 0.32, 0.035, 2, 0.015), strapMat);
    strapDown.position.set(side * 0.12, 0.02, -0.3); strapDown.rotation.x = 0.12; g.add(strapDown);
  }

  // MORMAN DE MONEDE deasupra sacului (se umple pe masura ce iei bani)
  const coinsGroup = new THREE.Group();
  coinsGroup.position.set(0, 0.35, 0);
  g.add(coinsGroup);
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf7c74a, roughness: 0.35, metalness: 0.85, emissive: 0x3a2500, emissiveIntensity: 0.3 });
  const goldDark = new THREE.MeshStandardMaterial({ color: 0xd49a2c, roughness: 0.4, metalness: 0.8 });
  const coinGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.014, 14);
  // 12 monede pre-generate, cu pozitii aleatoare, ascunse la start
  const coinModels = [];
  const rng = (() => { let s = 3; return () => (s = (s * 9301 + 49297) % 233280) / 233280; })();
  for (let i = 0; i < 12; i++) {
    const c = new THREE.Mesh(coinGeo, i % 3 === 0 ? goldDark : goldMat);
    const a = rng() * Math.PI * 2, r = rng() * 0.14;
    c.position.set(Math.cos(a) * r, (i * 0.012) % 0.09, Math.sin(a) * r * 0.7);
    c.rotation.set(rng() * 0.4, rng() * Math.PI, rng() * 0.4);
    c.castShadow = true;
    c.visible = false;
    coinsGroup.add(c);
    coinModels.push(c);
  }
  g.userData.setFill = (ratio) => {
    const shown = Math.floor(Math.max(0, Math.min(1, ratio)) * coinModels.length);
    for (let i = 0; i < coinModels.length; i++) coinModels[i].visible = i < shown;
  };
  return g;
}

export function buildCharacter(scene, environment) {
  const root = new THREE.Group();
  root.position.set(0, 0, 0.4);
  root.rotation.y = Math.PI; // fata spre -Z
  scene.add(root);

  // CharacterVisual: singurul offset de 180° - toate elementele vizuale sub el
  const visual = new THREE.Group();
  visual.rotation.y = Math.PI;
  root.add(visual);

  // unealta curenta (se schimba din shop)
  let tool = null;
  function equipTool(id) {
    if (tool) visual.remove(tool.group);
    const builder = TOOL_BUILDERS[id] || TOOL_BUILDERS.shovel;
    tool = builder();
    tool.id = id;
    tool.group.position.set(tool.hold.pos[0], tool.hold.pos[1], tool.hold.pos[2]);
    tool.group.rotation.x = tool.hold.rotX;
    visual.add(tool.group);
  }
  equipTool('shovel');

  const pack = buildPack();
  visual.add(pack);

  let model = null;
  let mixer = null;
  let idleAction = null, walkAction = null;
  const B = {};
  let fingers = [];

  new GLTFLoader().load('./assets/Soldier.glb', (gltf) => {
    model = gltf.scene;
    model.scale.setScalar(1.05);
    model.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.frustumCulled = false;
        if (o.material) o.material.roughness = Math.min(1, (o.material.roughness ?? 0.8) + 0.1);
      }
    });
    visual.add(model); // sub CharacterVisual, mosteneste offset-ul 180°

    mixer = new THREE.AnimationMixer(model);
    const idleClip = THREE.AnimationClip.findByName(gltf.animations, 'Idle');
    const walkClip = THREE.AnimationClip.findByName(gltf.animations, 'Walk');
    idleAction = mixer.clipAction(idleClip);
    walkAction = mixer.clipAction(walkClip);
    idleAction.play();
    walkAction.play();
    idleAction.setEffectiveWeight(1);
    walkAction.setEffectiveWeight(0);
    walkAction.timeScale = 1.0;

    for (const n of ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head',
      'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand',
      'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand']) {
      B[n] = model.getObjectByName('mixamorig' + n);
    }
    fingers = [];
    model.traverse((o) => {
      if (o.isBone && /mixamorig(Left|Right)Hand(Thumb|Index|Middle|Ring|Pinky)[123]$/.test(o.name)) {
        fingers.push({ bone: o, curl: /Thumb/.test(o.name) ? 0.22 : 0.5 });
      }
    });
  });

  const MOVE_SPEED = 3.8;
  const TURN_RATE = 28.0;
  const ACCEL = 10.0;
  const vel = { x: 0, z: 0 };
  const qLean = new THREE.Quaternion();
  const elbowR = new THREE.Vector3(), elbowL = new THREE.Vector3();

  function shortestAngleDiff(a, b) {
    let d = b - a;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return d;
  }

  const _bladePts = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  let sweepPhase = 0;
  return {
    group: root,
    setTool(id) { equipTool(id); },
    setBagFill(ratio) { if (pack.userData.setFill) pack.userData.setFill(ratio); },
    getToolId() { return tool.id; },
    getToolRadius() { return tool.radius; },
    getSweepDir() { return Math.cos(sweepPhase); },
    getBladePoints() {
      // punctele de actiune ale uneltei curente, transformate in lume
      tool.group.updateWorldMatrix(true, false);
      const src = tool.bladePts;
      const n = Math.min(src.length, _bladePts.length);
      for (let i = 0; i < n; i++) {
        _bladePts[i].set(src[i][0], src[i][1], src[i][2]).applyMatrix4(tool.group.matrixWorld);
      }
      if (!this._ptsOut || this._ptsOut.length !== n) this._ptsOut = _bladePts.slice(0, n);
      return this._ptsOut;
    },
    update(dt, t, input, camYaw) {
      const ix = input ? input.x : 0;
      const iz = input ? input.z : 0;
      const yaw = camYaw ?? 0;

      // input in spatiul lumii, folosind axele camerei proiectate pe sol
      // cameraForward (ground) = (-sin yaw, 0, -cos yaw)
      // cameraRight   (ground) = ( cos yaw, 0, -sin yaw)
      const cfX = -Math.sin(yaw), cfZ = -Math.cos(yaw);
      const crX =  Math.cos(yaw), crZ = -Math.sin(yaw);
      const wx = cfX * iz + crX * ix;
      const wz = cfZ * iz + crZ * ix;

      // viteza-tinta cu accelerație lină
      const tvx = wx * MOVE_SPEED;
      const tvz = wz * MOVE_SPEED;
      const k = Math.min(1, ACCEL * dt);
      vel.x += (tvx - vel.x) * k;
      vel.z += (tvz - vel.z) * k;

      // pozitie in lume, limitata la harta
      // pozitia se actualizeaza liber; gardul (walls) rezolva coliziunea reala
      root.position.x += vel.x * dt;
      root.position.z += vel.z * dt;

      // coliziune cu obstacole: cercuri + segmente (garduri)
      const PLAYER_R = 0.35;
      if (environment && environment.getColliders) {
        for (const c of environment.getColliders()) {
          const dx = root.position.x - c.x;
          const dz = root.position.z - c.z;
          const rr = c.r + PLAYER_R;
          const d2 = dx * dx + dz * dz;
          if (d2 < rr * rr && d2 > 1e-6) {
            const d = Math.sqrt(d2);
            const push = (rr - d) / d;
            root.position.x += dx * push;
            root.position.z += dz * push;
            vel.x = 0; vel.z = 0;
          }
        }
      }
      if (environment && environment.getWalls) {
        for (const w of environment.getWalls()) {
          // distanta punct la segment
          const ex = w.x1 - w.x0, ez = w.z1 - w.z0;
          const len2 = ex * ex + ez * ez;
          const t2 = Math.max(0, Math.min(1, ((root.position.x - w.x0) * ex + (root.position.z - w.z0) * ez) / len2));
          const px = w.x0 + ex * t2, pz = w.z0 + ez * t2;
          const dx = root.position.x - px, dz = root.position.z - pz;
          const rr = w.r + PLAYER_R;
          const d2 = dx * dx + dz * dz;
          if (d2 < rr * rr && d2 > 1e-6) {
            const d = Math.sqrt(d2);
            const push = (rr - d) / d;
            root.position.x += dx * push;
            root.position.z += dz * push;
            vel.x = 0; vel.z = 0;
          }
        }
      }

      // rotatie personaj: se roteste fluid spre directia de mers (input WASD + camera)
      const iMag = Math.hypot(wx, wz);
      if (iMag > 0.05) {
        const targetYaw = Math.atan2(wx, wz);
        const diff = shortestAngleDiff(root.rotation.y, targetYaw);
        root.rotation.y += diff * Math.min(1, TURN_RATE * dt);
      }
      const vMag = Math.hypot(vel.x, vel.z);

      // blend Idle <-> Walk in functie de viteza
      const speed = Math.min(1, vMag / MOVE_SPEED);
      if (idleAction && walkAction) {
        idleAction.setEffectiveWeight(1 - speed);
        walkAction.setEffectiveWeight(speed);
        walkAction.timeScale = 0.9 + speed * 0.35;
      }

      if (mixer) mixer.update(dt);
      if (!B.Spine) {
        pack.position.set(0, 1.06, 0.32);
        return;
      }

      // animatie proprie per unealta
      const hp = tool.hold.pos, hr = tool.hold.rotX;
      let push = 0;
      let staticLean = 0.16 * (1 - speed);
      if (tool.anim === 'push') {
        // lopata clasica: impingere inainte
        push = staticLean > 0.01 ? Math.sin(t * 2.2) : 0;
        tool.group.position.set(hp[0], hp[1], hp[2] + push * 0.14);
        tool.group.rotation.set(hr + push * 0.045, 0, 0);
      } else if (tool.anim === 'heavyPush') {
        // pusher lat: impingere grea, mai lenta si mai ampla
        staticLean = 0.2 * (1 - speed);
        push = staticLean > 0.01 ? Math.sin(t * 1.5) : 0;
        tool.group.position.set(hp[0], hp[1], hp[2] + push * 0.2);
        tool.group.rotation.set(hr + push * 0.05, 0, 0);
      } else if (tool.anim === 'sweep') {
        // matura: maturat stanga-dreapta
        sweepPhase = t * 3.4;
        const sw = Math.sin(sweepPhase);
        tool.group.position.set(hp[0] + sw * 0.3, hp[1], hp[2]);
        tool.group.rotation.set(hr, sw * 0.18, -sw * 0.12);
        push = sw * 0.3;
        staticLean = 0.1 * (1 - speed);
      } else if (tool.anim === 'vibrate') {
        // suflanta: tinuta in fata + vibratie discreta de motor
        tool.group.position.set(
          hp[0] + Math.sin(t * 43) * 0.006,
          hp[1] + Math.sin(t * 51) * 0.005,
          hp[2] + Math.sin(t * 47) * 0.005
        );
        tool.group.rotation.set(hr + Math.sin(t * 39) * 0.008, 0, 0);
        staticLean = 0.07 * (1 - speed);
        if (tool.jetParts) {
          // jetul de aer tremura si pulseaza ca la un motor real
          tool.jetParts.jet.material.opacity = 0.18 + Math.abs(Math.sin(t * 21)) * 0.12;
          tool.jetParts.jetFar.material.opacity = 0.06 + Math.abs(Math.sin(t * 17)) * 0.08;
          const js = 0.95 + Math.sin(t * 27) * 0.08;
          tool.jetParts.jet.scale.set(js, 1, js);
        }
      } else if (tool.anim === 'beam') {
        // heat ray: tintire stabila, doar o respiratie usoara
        tool.group.position.set(hp[0], hp[1] + Math.sin(t * 1.1) * 0.012, hp[2]);
        tool.group.rotation.set(hr, 0, 0);
        staticLean = 0.06 * (1 - speed);
        if (tool.beamParts) {
          const pulse = 0.4 + Math.sin(t * 6) * 0.08;
          tool.beamParts.beam.material.opacity = pulse;
          tool.beamParts.beamOuter.material.opacity = 0.1 + Math.sin(t * 6) * 0.05;
          tool.beamParts.hot.material.opacity = 0.5 + Math.sin(t * 8) * 0.12;
          const hs = 1 + Math.sin(t * 8) * 0.12;
          tool.beamParts.hot.scale.set(hs, hs, 1);
        }
      }

      const lean = staticLean + push * 0.05;
      qLean.setFromAxisAngle(_X, lean * 0.5);
      B.Spine.quaternion.multiply(qLean);
      qLean.setFromAxisAngle(_X, lean * 0.35);
      B.Spine1.quaternion.multiply(qLean);
      B.Spine2.quaternion.multiply(qLean);
      qLean.setFromAxisAngle(_X, -lean * 0.55);
      B.Head.quaternion.multiply(qLean);

      root.updateWorldMatrix(true, true);

      tool.gripTop.getWorldPosition(_tgt); const gT = _tgt.clone();
      tool.gripLow.getWorldPosition(_tgt); const gL = _tgt.clone();

      elbowR.copy(gT).add(_v4.set(0.3, -0.12, 0.28));
      aimBone(B.RightArm, B.RightForeArm, elbowR);
      aimBone(B.RightForeArm, B.RightHand, gT);
      elbowL.copy(gL).add(_v4.set(-0.3, -0.12, 0.28));
      aimBone(B.LeftArm, B.LeftForeArm, elbowL);
      aimBone(B.LeftForeArm, B.LeftHand, gL);

      for (const f of fingers) {
        qLean.setFromAxisAngle(_X, f.curl);
        f.bone.quaternion.multiply(qLean);
      }

      const packLean = lean * 1.15;
      pack.rotation.x = packLean;
      pack.position.set(
        0,
        1.06 - packLean * 0.12 + Math.sin(t * 4.4) * 0.008 * (1 - speed),
        0.32 - packLean * 0.3
      );
      pack.rotation.z = Math.sin(t * 2.2) * 0.02 * (1 - speed);
    }
  };
}
