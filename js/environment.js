import * as THREE from 'three';
import { RoundedBoxGeometry } from './lib/RoundedBoxGeometry.js';
import { SNOW_TYPES, SNOW_TYPE_LIST, SNOW_TYPE_INDEX, SNOW_TYPE_BY_ID } from './config/snowTypes.js?v=2';

/* =========================================================
   ENVIRONMENT — camp continuu de zapada + tipuri per vertex.
   Fiecare vertex are: lifeMap (0..1), maxLifeMap (cap regen),
   typeMap (indice in SNOW_TYPE_LIST), clearedMap (flag).
   Culoare vertex = SNOW_TYPES[type].color * depthShade.
   ========================================================= */

const CLEAR = { x0: -1.55, x1: 1.55, z0: -0.6, z1: 15 };

export function buildEnvironment(scene) {
  const rng = mulberry32(7);
  const dynamic = { rings: [] };
  const colliders = [];
  const walls = [];

  scene.add(makePavement());
  addSnowBanks(scene, rng);
  addShovelPile(scene, rng);

  const snowField = makeSnowField(scene);

  addTree(scene, -6.2, -11, 1.25, rng); colliders.push({ x: -6.2, z: -11, r: 0.7, type: 'tree' });
  addTree(scene, 8.2, -9.5, 1.45, rng); colliders.push({ x: 8.2, z: -9.5, r: 0.8, type: 'tree' });
  addTree(scene, -8.5, 8, 1.1, rng); colliders.push({ x: -8.5, z: 8, r: 0.7, type: 'tree' });
  addTree(scene, 10.5, 5, 1.0, rng); colliders.push({ x: 10.5, z: 5, r: 0.65, type: 'tree' });
  addTree(scene, -4, 5.5, 0.9, rng); colliders.push({ x: -4, z: 5.5, r: 0.6, type: 'tree' });

  const BND = 40;
  addFence(scene, -BND, -BND, BND * 2, 0, rng);
  addFence(scene, -BND,  BND, BND * 2, 0, rng);
  addFence(scene, -BND, -BND, BND * 2, Math.PI / 2, rng);
  addFence(scene,  BND, -BND, BND * 2, Math.PI / 2, rng);
  walls.push({ x0: -BND, z0: -BND, x1:  BND, z1: -BND, r: 0.4, type: 'fence' });
  walls.push({ x0: -BND, z0:  BND, x1:  BND, z1:  BND, r: 0.4, type: 'fence' });
  walls.push({ x0: -BND, z0: -BND, x1: -BND, z1:  BND, r: 0.4, type: 'fence' });
  walls.push({ x0:  BND, z0: -BND, x1:  BND, z1:  BND, r: 0.4, type: 'fence' });

  addRock(scene, 2.2, -11.5, 0.55, rng); colliders.push({ x: 2.2, z: -11.5, r: 0.55, type: 'rock' });
  addRock(scene, 2.9, -11.1, 0.35, rng); colliders.push({ x: 2.9, z: -11.1, r: 0.4, type: 'rock' });
  addRock(scene, 9.5, -5.5, 0.5, rng); colliders.push({ x: 9.5, z: -5.5, r: 0.55, type: 'rock' });
  addRock(scene, -4.8, -6.5, 0.45, rng); colliders.push({ x: -4.8, z: -6.5, r: 0.5, type: 'rock' });

  addCabin(scene);
  colliders.push({ x: 0, z: -8, r: 2.2, type: 'cabin' });

  // ETAPA 7 — Garage
  addGarage(scene, 8, -12, 0.1);
  colliders.push({ x: 8, z: -12, r: 3.2, type: 'garage' });

  addSign(scene, 37, -36, 'UPGRADE', 'cart', 0x3fd8ff, dynamic); colliders.push({ x: 37, z: -36, r: 0.6, type: 'upgrade' });
  addSign(scene, 34, -36, 'NEXT TOOL', 'shovel', 0xffc043, dynamic); colliders.push({ x: 34, z: -36, r: 0.6, type: 'tool' });

  return {
    update(t) {
      for (const r of dynamic.rings) {
        const s = 1 + Math.sin(t * 2.2 + r.phase) * 0.045;
        r.inner.scale.set(s, s, 1);
        r.outer.scale.set(s * 1.02, s * 1.02, 1);
        r.outer.material.opacity = 0.28 + Math.sin(t * 2.2 + r.phase) * 0.09;
      }
    },
    meltAt(points, radius = 1.1, dt = 0.016, tool = null, toolUpgrades = null) {
      return snowField.meltAt(points, radius, dt, tool, toolUpgrades);
    },
    regen(dt) { snowField.regen(dt); },
    getMapData() { return snowField.getMapData(); },
    getProgress() { return snowField.getProgress(); },
    getProgressInArea(cx, cz, r) { return snowField.getProgressInArea(cx, cz, r); },
    getSnowTypeAt(x, z) { return snowField.getSnowTypeAt(x, z); },
    spawnSnow(x, z, typeId, r) { return snowField.spawnSnow(x, z, typeId, r); },
    resetArea() { return snowField.resetArea(); },
    getColliders() { return colliders; },
    getWalls() { return walls; }
  };
}

/* =========================================================
   CAMP DE ZAPADA — un singur PlaneGeometry cu displacement.
   ========================================================= */

function makeSnowField(scene) {
  const W = 84, H = 84;
  const SEG = 140;
  const MAX_H = 1.35;
  const geo = new THREE.PlaneGeometry(W, H, SEG, SEG);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position.array;
  const vertCount = geo.attributes.position.count;
  const colors = new Float32Array(vertCount * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const lifeMap = new Float32Array(vertCount);
  const maxLifeMap = new Float32Array(vertCount);
  const typeMap = new Uint8Array(vertCount);       // NEW — indice in SNOW_TYPE_LIST
  const clearedMap = new Uint8Array(vertCount);
  let totalClearable = 0;
  let clearedCount = 0;

  // Zone permanente de gheata (nivel 3) langa cele 2 panouri.
  const ICE_ZONES = [
    { x: 34, z: -36, r: 2.2 },
    { x: 37, z: -36, r: 2.2 }
  ];
  function iceZoneMaxLife(vx, vz) {
    for (const z of ICE_ZONES) {
      const dx = vx - z.x, dz = vz - z.z;
      if (dx * dx + dz * dz < z.r * z.r) return 0.22;
    }
    return 1.0;
  }

  function insideMap(vx, vz) {
    return vx > -40 && vx < 40 && vz > -40 && vz < 40;
  }

  const cellStep = W / SEG;
  const halfW = W / 2, halfH = H / 2;

  // === DISTRIBUTIE TIPURI ZAPADA (deterministica) ===
  // zone circulare cu tipuri specifice; default = FRESH.
  const TYPE_ZONES = [
    // PACKED — 3 zone
    { x: -12, z:  -2, r: 7, type: 'packed' },
    { x:  10, z:  10, r: 6, type: 'packed' },
    { x:  20, z: -14, r: 6, type: 'packed' },
    // DEEP — 2 fasii pe +z
    { x: -18, z:  20, r: 5, type: 'deep' },
    { x:  16, z:  25, r: 5, type: 'deep' },
    { x: -3, z: 30, r: 5, type: 'deep' },
    // FROZEN — mare pe latura -x
    { x: -28, z:  -8, r: 8, type: 'frozen' },
    { x: -32, z:  10, r: 7, type: 'frozen' },
    // SLUSH — 2 baltoace mici
    { x:   6, z:  -4, r: 3, type: 'slush' },
    { x: -14, z: -20, r: 3, type: 'slush' },
    // BLACK ICE — patch mic provocator (langa cabana ~ (5, -8))
    { x:   8, z:  -8, r: 2, type: 'black_ice' }
    // BLIZZARD — nu-l plasam static; se poate genera de weather system in Etapa 5.
    // ICE — se plaseaza doar in ICE_ZONES (langa shopuri).
  ];

  function snowTypeAt(vx, vz) {
    // ICE_ZONES sunt handled ca ice type
    for (const z of ICE_ZONES) {
      const dx = vx - z.x, dz = vz - z.z;
      if (dx * dx + dz * dz < z.r * z.r) return 'ice';
    }
    // Test zone specifice
    for (const z of TYPE_ZONES) {
      const dx = vx - z.x, dz = vz - z.z;
      if (dx * dx + dz * dz < z.r * z.r) return z.type;
    }
    return 'fresh';
  }

  // === COLOR ===
  // Culoarea bazei vine din SNOW_TYPES[type].color.
  // depthShade = 0.65 + 0.35 * life -> umbra falsa in adancituri.
  function setColorByLifeAndType(i, life, typeIdx) {
    const type = SNOW_TYPE_LIST[typeIdx];
    let r, g, b;
    if (life < 0.02) {
      // pavaj expus
      r = 0.12; g = 0.14; b = 0.18;
    } else {
      const c = type.color;
      r = c[0]; g = c[1]; b = c[2];
      // scade luminozitatea usor la life mic (imita zapada compactata la baza)
      const life01 = life;
      // amestec cu culoarea mai inchisa la life mic (nu cu total pavaj)
      const dark = 0.5;
      const t = life01; // 1 = full, 0 = pavaj (dar cazul <0.02 e mai sus)
      r = r * (dark + (1 - dark) * t);
      g = g * (dark + (1 - dark) * t);
      b = b * (dark + (1 - dark) * t);
    }
    const depthShade = 0.65 + 0.35 * life;
    const j = i * 3;
    colors[j]     = r * depthShade;
    colors[j + 1] = g * depthShade;
    colors[j + 2] = b * depthShade;
  }

  // Init
  for (let i = 0; i < vertCount; i++) {
    const vx = pos[i * 3];
    const vz = pos[i * 3 + 2];
    const inStrip = vx >= CLEAR.x0 - 0.3 && vx <= CLEAR.x1 + 0.3
                  && vz >= CLEAR.z0 && vz <= CLEAR.z1;
    const outMap = !insideMap(vx, vz);
    const maxL = (inStrip || outMap) ? 0 : iceZoneMaxLife(vx, vz);
    maxLifeMap[i] = maxL;
    lifeMap[i] = maxL;
    // set type
    const typeId = snowTypeAt(vx, vz);
    typeMap[i] = SNOW_TYPE_INDEX[typeId] || 0;
    pos[i * 3 + 1] = maxL < 0.01 ? 0.001 : maxL * MAX_H;
    setColorByLifeAndType(i, lifeMap[i], typeMap[i]);
    if (maxL > 0.02) totalClearable++;
  }
  geo.attributes.position.needsUpdate = true;
  geo.attributes.color.needsUpdate = true;
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 1.0,
    metalness: 0.0,
    flatShading: false
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  scene.add(mesh);

  // Byte counter reused per melt call (nu re-alocat)
  const _byTypeCounter = { fresh: 0, packed: 0, deep: 0, frozen: 0, ice: 0, slush: 0, black_ice: 0, blizzard: 0 };
  function resetByTypeCounter() {
    _byTypeCounter.fresh = 0;
    _byTypeCounter.packed = 0;
    _byTypeCounter.deep = 0;
    _byTypeCounter.frozen = 0;
    _byTypeCounter.ice = 0;
    _byTypeCounter.slush = 0;
    _byTypeCounter.black_ice = 0;
    _byTypeCounter.blizzard = 0;
  }

  let coinAcc = 0;
  let normalsDirty = false;
  let normalsCooldown = 0;

  // maxLayer implicit (fallback daca tool nu-l are)
  function maxLayerOf(tool) {
    if (!tool) return 3;
    return typeof tool.maxLayer === 'number' ? tool.maxLayer : 3;
  }
  const LAYER_MIN = [0.75, 0.50, 0.25, 0.0];

  function meltAt(points, radius, dt, tool = null, toolUpgrades = null) {
    resetByTypeCounter();
    let touched = 0;
    let rejected = 0; // vertecsi in raza dar tool incompat
    const pts = Array.isArray(points) ? points : [points];
    const maxLayer = maxLayerOf(tool);
    const minLife = LAYER_MIN[Math.min(3, Math.max(0, maxLayer))];
    const r2 = radius * radius;
    let posDirty = false;
    let colDirty = false;

    // Precompute tool upgrade multipliers (constant pe intreg apel)
    const upg = (toolUpgrades && tool) ? (toolUpgrades[tool.id] || null) : null;
    const powerMult = upg ? (1 + (upg.power || 0) * 0.10) : 1;
    const speedMult = upg ? (1 + (upg.speed || 0) * 0.10) : 1;
    const capacityMult = upg ? (1 + (upg.capacity || 0) * 0.10) : 1;
    const toolMult = tool ? tool.mult : 1;
    const compat = tool ? tool.compatibility : null;

    for (const p of pts) {
      const gx0 = Math.max(0, Math.floor((p.x - radius + halfW) / cellStep));
      const gx1 = Math.min(SEG, Math.ceil((p.x + radius + halfW) / cellStep));
      const gz0 = Math.max(0, Math.floor((p.z - radius + halfH) / cellStep));
      const gz1 = Math.min(SEG, Math.ceil((p.z + radius + halfH) / cellStep));

      for (let gz = gz0; gz <= gz1; gz++) {
        const rowBase = gz * (SEG + 1);
        for (let gx = gx0; gx <= gx1; gx++) {
          const i = rowBase + gx;
          const life = lifeMap[i];
          if (life <= minLife) continue;
          const j = i * 3;
          const dx = pos[j] - p.x;
          const dz = pos[j + 2] - p.z;
          if (dx * dx + dz * dz >= r2) continue;

          // determina tip
          const typeIdx = typeMap[i];
          const snowType = SNOW_TYPE_LIST[typeIdx];
          const cVal = compat ? (compat[snowType.id] || 1) : 1;

          // Daca tool COMPLET incompat -> "atins dar respins"
          if (cVal < 0.15) {
            rejected++;
            continue;
          }

          const rate = toolMult * cVal * powerMult * speedMult * 0.16;
          const delta = dt * 4.5 * rate;
          const newLife = Math.max(minLife, life - delta);
          lifeMap[i] = newLife;
          pos[j + 1] = newLife * MAX_H;
          setColorByLifeAndType(i, newLife, typeIdx);
          touched++;
          posDirty = true;
          colDirty = true;

          // Reward calculation (per prag trecut):
          //   coinPer = rewardMult(type) * capacityMult
          const rewardPer = snowType.rewardMult * capacityMult;

          if (life > 0.75 && newLife <= 0.75) { coinAcc += rewardPer; _byTypeCounter[snowType.id]++; }
          if (life > 0.50 && newLife <= 0.50) { coinAcc += rewardPer; _byTypeCounter[snowType.id]++; }
          if (life > 0.25 && newLife <= 0.25) { coinAcc += rewardPer; _byTypeCounter[snowType.id]++; }
          if (life > 0.02 && newLife <= 0.02) {
            coinAcc += rewardPer;
            _byTypeCounter[snowType.id]++;
            if (!clearedMap[i]) { clearedMap[i] = 1; clearedCount++; }
          }
        }
      }
    }

    if (posDirty) { geo.attributes.position.needsUpdate = true; normalsDirty = true; }
    if (colDirty) geo.attributes.color.needsUpdate = true;

    const coins = Math.floor(coinAcc);
    coinAcc -= coins;
    return { coins, touched, rejected, byType: _byTypeCounter };
  }

  function regen(dt) {
    // Nivel 1: zapada NU creste la loc. Doar recalculez normali dupa carve.
    normalsCooldown -= dt;
    if (normalsDirty && normalsCooldown <= 0) {
      geo.computeVertexNormals();
      normalsDirty = false;
      normalsCooldown = 0.10;
    }
  }

  function getMapData() {
    return { lifeMap, W, H, SEG, cellStep, half: 40, cell: cellStep, pos, typeMap };
  }

  function getProgress() {
    return totalClearable > 0 ? clearedCount / totalClearable : 0;
  }

  // Etapa 3 — Progres intr-o zona circulara (folosit de ContractSystem)
  function getProgressInArea(cx, cz, radius) {
    const r2 = radius * radius;
    let total = 0, cleared = 0;
    let massCleared = 0;
    let lifeSum = 0;
    // Bbox limitata la grila
    const gx0 = Math.max(0, Math.floor((cx - radius + halfW) / cellStep));
    const gx1 = Math.min(SEG, Math.ceil((cx + radius + halfW) / cellStep));
    const gz0 = Math.max(0, Math.floor((cz - radius + halfH) / cellStep));
    const gz1 = Math.min(SEG, Math.ceil((cz + radius + halfH) / cellStep));
    for (let gz = gz0; gz <= gz1; gz++) {
      const rowBase = gz * (SEG + 1);
      for (let gx = gx0; gx <= gx1; gx++) {
        const i = rowBase + gx;
        const j = i * 3;
        const dx = pos[j] - cx;
        const dz = pos[j + 2] - cz;
        if (dx * dx + dz * dz >= r2) continue;
        // Doar vertecsi care erau clarabili (maxLife > 0.02 = zapada, nu strip)
        if (maxLifeMap[i] <= 0.02) continue;
        total++;
        lifeSum += lifeMap[i];
        if (clearedMap[i]) cleared++;
        // massCleared: cat s-a topit * rewardMult (~ 'greutate')
        const diff = Math.max(0, maxLifeMap[i] - lifeMap[i]);
        const type = SNOW_TYPE_LIST[typeMap[i]];
        massCleared += diff * (type ? type.rewardMult : 1);
      }
    }
    return {
      total,
      cleared,
      clearedFraction: total > 0 ? cleared / total : 0,
      massCleared,
      avgLife: total > 0 ? lifeSum / total : 0
    };
  }

  // Determina tipul zapezii sub un punct (x, z) — vertexul cel mai apropiat cu life > 0.02
  function getSnowTypeAt(x, z) {
    const gx = Math.round((x + halfW) / cellStep);
    const gz = Math.round((z + halfH) / cellStep);
    if (gx < 0 || gx > SEG || gz < 0 || gz > SEG) return null;
    const i = gz * (SEG + 1) + gx;
    if (lifeMap[i] < 0.05) return null;
    const idx = typeMap[i];
    return SNOW_TYPE_LIST[idx] || null;
  }

  // DEBUG: rescrie o zona la un anumit tip + reseteaza life
  function spawnSnow(x, z, typeId, r = 3) {
    const idx = SNOW_TYPE_INDEX[typeId];
    if (idx === undefined) return 0;
    const r2 = r * r;
    let count = 0;
    for (let i = 0; i < vertCount; i++) {
      const dx = pos[i * 3] - x, dz = pos[i * 3 + 2] - z;
      if (dx * dx + dz * dz < r2) {
        const vx = pos[i * 3], vz = pos[i * 3 + 2];
        if (!insideMap(vx, vz)) continue;
        if (vx >= CLEAR.x0 - 0.3 && vx <= CLEAR.x1 + 0.3 && vz >= CLEAR.z0 && vz <= CLEAR.z1) continue;
        typeMap[i] = idx;
        maxLifeMap[i] = 1.0;
        lifeMap[i] = 1.0;
        pos[i * 3 + 1] = MAX_H;
        setColorByLifeAndType(i, 1.0, idx);
        if (clearedMap[i]) { clearedMap[i] = 0; clearedCount = Math.max(0, clearedCount - 1); }
        count++;
      }
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    normalsDirty = true;
    return count;
  }

  // DEBUG: reseteaza tot lifeMap la maxLifeMap
  function resetArea() {
    for (let i = 0; i < vertCount; i++) {
      lifeMap[i] = maxLifeMap[i];
      pos[i * 3 + 1] = maxLifeMap[i] < 0.01 ? 0.001 : maxLifeMap[i] * MAX_H;
      setColorByLifeAndType(i, lifeMap[i], typeMap[i]);
      if (clearedMap[i]) { clearedMap[i] = 0; }
    }
    clearedCount = 0;
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    normalsDirty = true;
  }

  // ETAPA 5 — Weather accumulation: creste life pe vertecsi random-sampled per apel.
  // NU tot map-ul per frame — max 200 vertecsi per pass (chemat throttled ~200ms).
  // Freezing rain: sansa convertire fresh/packed -> frozen/ice.
  const _accumBudget = 200;
  function accumulate(dt, weatherParams) {
    if (!weatherParams || !weatherParams.accumulationMult || weatherParams.accumulationMult <= 0) return 0;
    const accMult = weatherParams.accumulationMult;
    const hardnessMod = weatherParams.hardnessModifier || 1.0;
    const iceChance = weatherParams.iceGenerationChance || 0;
    const increment = dt * 0.02 * accMult * (1 + (hardnessMod - 1) * 0.5);
    let posDirty = false;
    let colDirty = false;
    let added = 0;
    // Freezing rain: FRESH(0) / PACKED(1) -> FROZEN(3) / ICE(4)
    const FRESH = 0, PACKED = 1, FROZEN = 3, ICE = 4;
    for (let k = 0; k < _accumBudget; k++) {
      const i = (Math.random() * vertCount) | 0;
      if (maxLifeMap[i] <= 0.02) continue; // strip curat sau outside — skip
      if (lifeMap[i] >= maxLifeMap[i]) continue; // deja plin
      // Ice generation (rare, only if freezing_rain)
      if (iceChance > 0 && Math.random() < iceChance * dt) {
        const t = typeMap[i];
        if (t === FRESH || t === PACKED) {
          typeMap[i] = Math.random() < 0.5 ? FROZEN : ICE;
          colDirty = true;
        }
      }
      const cap = maxLifeMap[i];
      const newLife = Math.min(cap, lifeMap[i] + increment);
      if (newLife > lifeMap[i]) {
        lifeMap[i] = newLife;
        pos[i * 3 + 1] = newLife * MAX_H;
        setColorByLifeAndType(i, newLife, typeMap[i]);
        if (clearedMap[i] && newLife > 0.02) {
          clearedMap[i] = 0;
          clearedCount = Math.max(0, clearedCount - 1);
        }
        posDirty = true;
        colDirty = true;
        added++;
      }
    }
    if (posDirty) { geo.attributes.position.needsUpdate = true; normalsDirty = true; }
    if (colDirty) geo.attributes.color.needsUpdate = true;
    return added;
  }

  return { meltAt, regen, accumulate, getMapData, getProgress, getProgressInArea, getSnowTypeAt, spawnSnow, resetArea };
}

/* ---------------- pavaj (terenul de sub zapada) ---------------- */

function makePavement() {
  const tex = pavementTexture();
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(60, 60);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(130, 130),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  return mesh;
}

function pavementTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const rng = mulberry32(42);

  g.fillStyle = '#3a404e';
  g.fillRect(0, 0, 256, 256);

  const shades = ['#6b7485', '#707a8c', '#636d7e', '#767f90', '#686f82'];
  const TW = 128, TH = 64, GAP = 5;
  for (let row = 0; row < 4; row++) {
    const off = (row % 2) * (TW / 2);
    for (let col = -1; col < 3; col++) {
      const x = col * TW + off;
      const y = row * TH;
      const shade = shades[Math.floor(rng() * shades.length)];
      const w = TW - GAP, h = TH - GAP;

      g.fillStyle = shade;
      roundedRect(g, x + GAP / 2, y + GAP / 2, w, h, 7);
      g.fill();

      g.fillStyle = 'rgba(255,255,255,0.07)';
      roundedRect(g, x + GAP / 2, y + GAP / 2, w, 8, 6);
      g.fill();
      g.fillStyle = 'rgba(0,0,0,0.14)';
      roundedRect(g, x + GAP / 2, y + GAP / 2 + h - 8, w, 8, 6);
      g.fill();

      for (let i = 0; i < 26; i++) {
        const px = x + GAP / 2 + rng() * w;
        const py = y + GAP / 2 + rng() * h;
        g.fillStyle = rng() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
        g.fillRect(px, py, 1.6, 1.6);
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function roundedRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/* ---------------- movile de zapada organice ---------------- */

function chunkMaterial() {
  return new THREE.MeshStandardMaterial({ color: 0xf7faff, roughness: 1 });
}

function snowLump(size, rng, mat) {
  const lump = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 1), mat);
  lump.scale.set(1 + rng() * 0.4, 0.55 + rng() * 0.2, 1 + rng() * 0.4);
  lump.rotation.set(rng() * 0.4, rng() * Math.PI, rng() * 0.4);
  lump.castShadow = true;
  return lump;
}

function addSnowBanks(scene, rng) {
  const mat = chunkMaterial();
  const group = new THREE.Group();
  for (let z = CLEAR.z0 + 0.4; z < CLEAR.z1; z += 0.5) {
    for (const side of [-1, 1]) {
      if (rng() < 0.1) continue;
      const lump = snowLump(0.22 + rng() * 0.18, rng, mat);
      lump.position.set(
        side * (1.78 + rng() * 0.3),
        0.75 + rng() * 0.08,
        z + (rng() - 0.5) * 0.3
      );
      group.add(lump);
    }
  }
  scene.add(group);
}

function addShovelPile(scene, rng) {
  const mat = chunkMaterial();
  const group = new THREE.Group();
  for (let i = 0; i < 16; i++) {
    const lump = snowLump(0.16 + rng() * 0.2, rng, mat);
    lump.position.set(
      (rng() - 0.5) * 1.7,
      0.1 + rng() * 0.3,
      -1.15 - rng() * 0.8
    );
    group.add(lump);
  }
  scene.add(group);
}

/* ---------------- brazi cu zapada ---------------- */

function addTree(scene, x, z, scale, rng) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.22, 0.7, 10),
    new THREE.MeshStandardMaterial({ color: 0x7a5236, roughness: 1 })
  );
  trunk.position.y = 0.3;
  trunk.castShadow = true;
  tree.add(trunk);

  const greens = [0x2c8a62, 0x27795a, 0x2f9066];
  const tiers = [
    { r: 1.35, h: 1.5, y: 1.15 },
    { r: 1.05, h: 1.3, y: 2.05 },
    { r: 0.75, h: 1.15, y: 2.95 }
  ];
  tiers.forEach((tier, i) => {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(tier.r, tier.h, 9),
      new THREE.MeshStandardMaterial({ color: greens[i % greens.length], roughness: 1, flatShading: true })
    );
    cone.position.y = tier.y;
    cone.castShadow = true;
    tree.add(cone);

    const snow = new THREE.Mesh(
      new THREE.ConeGeometry(tier.r * 0.82, tier.h * 0.42, 9),
      new THREE.MeshStandardMaterial({ color: 0xf4f7ff, roughness: 1, flatShading: true })
    );
    snow.position.y = tier.y + tier.h * 0.32;
    snow.rotation.y = 0.22;
    snow.castShadow = true;
    tree.add(snow);
  });

  const top = new THREE.Mesh(
    new THREE.ConeGeometry(0.32, 0.5, 9),
    new THREE.MeshStandardMaterial({ color: 0xf4f7ff, roughness: 1, flatShading: true })
  );
  top.position.y = 3.7;
  tree.add(top);

  tree.scale.setScalar(scale);
  tree.position.set(x, 0, z);
  tree.rotation.y = rng() * Math.PI;
  scene.add(tree);
}

/* ---------------- gard de lemn ---------------- */

function addFence(scene, x, z, length, rotY, rng) {
  const wood = new THREE.MeshStandardMaterial({ color: 0x8a5f3d, roughness: 1 });
  const woodDark = new THREE.MeshStandardMaterial({ color: 0x74502f, roughness: 1 });
  const snowMat = chunkMaterial();
  const fence = new THREE.Group();

  const step = 1.5;
  const count = Math.floor(length / step);
  for (let i = 0; i <= count; i++) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.95, 10), wood);
    post.position.set(i * step, 0.47, 0);
    post.castShadow = true;
    fence.add(post);

    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), snowMat);
    cap.scale.y = 0.6;
    cap.position.set(i * step, 0.97, 0);
    fence.add(cap);
  }
  for (const y of [0.38, 0.72]) {
    const rail = new THREE.Mesh(new RoundedBoxGeometry(length + 0.3, 0.11, 0.07, 2, 0.03), woodDark);
    rail.position.set(length / 2, y, 0);
    rail.castShadow = true;
    fence.add(rail);
  }
  const railSnow = new THREE.Mesh(new RoundedBoxGeometry(length + 0.3, 0.07, 0.11, 2, 0.03), snowMat);
  railSnow.position.set(length / 2, 0.81, 0);
  fence.add(railSnow);

  fence.position.set(x, 0, z);
  fence.rotation.y = rotY;
  scene.add(fence);
}

/* ---------------- pietre ---------------- */

function addRock(scene, x, z, size, rng) {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(size, 0),
    new THREE.MeshStandardMaterial({ color: 0x6f7787, roughness: 1, flatShading: true })
  );
  rock.position.set(x, size * 0.35, z);
  rock.scale.y = 0.7;
  rock.rotation.y = rng() * Math.PI;
  rock.castShadow = true;
  scene.add(rock);

  const cap = new THREE.Mesh(
    new THREE.IcosahedronGeometry(size * 0.62, 1),
    new THREE.MeshStandardMaterial({ color: 0xf4f7ff, roughness: 1 })
  );
  cap.position.set(x, size * 0.78, z);
  cap.scale.y = 0.45;
  cap.rotation.y = rng() * Math.PI;
  scene.add(cap);
}

/* ---------------- cabana ---------------- */

function addCabin(scene) {
  const cabin = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x8a6142, roughness: 1 });
  const wallDark = new THREE.MeshStandardMaterial({ color: 0x77522f, roughness: 1 });
  const snowMat = new THREE.MeshStandardMaterial({ color: 0xf3f6ff, roughness: 1 });

  const body = new THREE.Mesh(new RoundedBoxGeometry(4.6, 2.6, 3.6, 3, 0.12), wallMat);
  body.position.y = 1.3;
  body.castShadow = true;
  cabin.add(body);

  for (let i = 0; i < 4; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 4.66, 10), wallDark);
    log.rotation.z = Math.PI / 2;
    log.position.set(0, 0.45 + i * 0.6, 1.81);
    cabin.add(log);
  }

  for (const side of [-1, 1]) {
    const slab = new THREE.Mesh(new RoundedBoxGeometry(5.2, 0.32, 2.5, 3, 0.1), snowMat);
    slab.position.set(0, 3.15, side * 1.02);
    slab.rotation.x = side * 0.62;
    slab.castShadow = true;
    cabin.add(slab);
  }
  const ridge = new THREE.Mesh(new RoundedBoxGeometry(5.3, 0.3, 0.6, 3, 0.12), snowMat);
  ridge.position.y = 3.72;
  cabin.add(ridge);

  const frame = new THREE.Mesh(new RoundedBoxGeometry(0.12, 1.15, 1.0, 2, 0.04), wallDark);
  frame.position.set(2.32, 1.35, 0.35);
  cabin.add(frame);
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.95, 0.8),
    new THREE.MeshStandardMaterial({ color: 0xffc76b, emissive: 0xffaa33, emissiveIntensity: 1.4 })
  );
  glass.position.set(2.36, 1.35, 0.35);
  cabin.add(glass);
  const winLight = new THREE.PointLight(0xffb75e, 6, 7, 2);
  winLight.position.set(3.1, 1.4, 0.35);
  cabin.add(winLight);

  const door = new THREE.Mesh(new RoundedBoxGeometry(0.12, 1.5, 0.95, 2, 0.05), wallDark);
  door.position.set(2.32, 0.85, -1.0);
  cabin.add(door);

  const rng2 = mulberry32(21);
  for (let i = 0; i < 8; i++) {
    const lump = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3 + rng2() * 0.25, 1), snowMat);
    lump.scale.y = 0.5;
    lump.position.set(-2.2 + rng2() * 4.6, 0.35, 1.9 + rng2() * 0.4);
    cabin.add(lump);
  }

  cabin.position.set(0, 0, -8);
  cabin.rotation.y = 0.12;
  scene.add(cabin);
}

/* ---------------- panouri ---------------- */

function signTexture(title, icon) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 200;
  const g = c.getContext('2d');
  g.fillStyle = '#171a22';
  g.fillRect(0, 0, 256, 200);
  g.fillStyle = '#ffffff';
  g.textAlign = 'center';
  g.font = '800 40px "Segoe UI", Arial, sans-serif';
  g.fillText(title, 128, 62);

  g.strokeStyle = '#ffffff';
  g.fillStyle = '#ffffff';
  g.lineWidth = 9;
  g.lineJoin = g.lineCap = 'round';
  if (icon === 'cart') {
    g.beginPath();
    g.moveTo(70, 100); g.lineTo(96, 100); g.lineTo(112, 152); g.lineTo(178, 152); g.lineTo(192, 108);
    g.stroke();
    g.lineWidth = 6;
    g.beginPath(); g.moveTo(130, 112); g.lineTo(134, 148); g.stroke();
    g.beginPath(); g.moveTo(158, 112); g.lineTo(160, 148); g.stroke();
    g.beginPath(); g.moveTo(104, 108); g.lineTo(196, 108); g.stroke();
    g.beginPath(); g.arc(124, 172, 9, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(172, 172, 9, 0, Math.PI * 2); g.fill();
  } else {
    g.lineWidth = 10;
    g.beginPath(); g.moveTo(128, 92); g.lineTo(128, 138); g.stroke();
    g.beginPath(); g.moveTo(112, 88); g.lineTo(144, 88); g.stroke();
    g.beginPath();
    g.moveTo(106, 140); g.lineTo(150, 140); g.lineTo(144, 172);
    g.quadraticCurveTo(128, 184, 112, 172); g.closePath();
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function addSign(scene, x, z, title, icon, ringColor, dynamic) {
  const sign = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: 0x171a22, roughness: 0.85 });

  for (const side of [-0.75, 0.75]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 1.0, 10), dark);
    leg.position.set(side, 0.5, 0);
    leg.castShadow = true;
    sign.add(leg);
  }

  const board = new THREE.Mesh(new RoundedBoxGeometry(2.3, 1.75, 0.16, 3, 0.06), dark);
  board.position.y = 1.75;
  board.castShadow = true;
  sign.add(board);

  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(2.1, 1.58),
    new THREE.MeshBasicMaterial({ map: signTexture(title, icon) })
  );
  face.position.set(0, 1.75, 0.085);
  sign.add(face);

  const cap = new THREE.Mesh(
    new RoundedBoxGeometry(2.45, 0.18, 0.3, 3, 0.07),
    new THREE.MeshStandardMaterial({ color: 0xf3f6ff, roughness: 1 })
  );
  cap.position.y = 2.7;
  sign.add(cap);

  const inner = new THREE.Mesh(
    new THREE.RingGeometry(1.5, 1.78, 48),
    new THREE.MeshBasicMaterial({ color: ringColor, transparent: true, opacity: 1.0, side: THREE.DoubleSide })
  );
  inner.rotation.x = -Math.PI / 2;
  inner.position.y = 0.05;
  sign.add(inner);

  const outer = new THREE.Mesh(
    new THREE.RingGeometry(1.78, 2.35, 48),
    new THREE.MeshBasicMaterial({ color: ringColor, transparent: true, opacity: 0.32, side: THREE.DoubleSide })
  );
  outer.rotation.x = -Math.PI / 2;
  outer.position.y = 0.05;
  sign.add(outer);

  dynamic.rings.push({ inner, outer, phase: x * 1.7 });

  sign.scale.setScalar(1.15);
  sign.position.set(x, 0, z);
  scene.add(sign);
}

/* ---------------- ETAPA 7 — Garage ---------------- */

function addGarage(scene, x, z, rot = 0) {
  const garage = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xa04030, roughness: 0.85 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x181c24, roughness: 0.7 });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x606870, roughness: 0.6, metalness: 0.35 });
  const snowMat = new THREE.MeshStandardMaterial({ color: 0xf3f6ff, roughness: 1 });
  const emissiveMat = new THREE.MeshStandardMaterial({ color: 0xfff0a0, emissive: 0xf0c060, emissiveIntensity: 0.55 });

  // Body 7x3.5x5 (W x H x D)
  const body = new THREE.Mesh(new RoundedBoxGeometry(7, 3.5, 5, 3, 0.15), bodyMat);
  body.position.y = 1.75;
  body.castShadow = true;
  body.receiveShadow = true;
  garage.add(body);

  // Roof (2-slope) - simple triangular slab
  for (const side of [-1, 1]) {
    const slab = new THREE.Mesh(new RoundedBoxGeometry(7.5, 0.35, 3.0, 3, 0.1), snowMat);
    slab.position.set(0, 3.85, side * 1.35);
    slab.rotation.x = side * 0.55;
    slab.castShadow = true;
    garage.add(slab);
  }
  const ridge = new THREE.Mesh(new RoundedBoxGeometry(7.6, 0.32, 0.7, 3, 0.12), snowMat);
  ridge.position.y = 4.55;
  garage.add(ridge);

  // Overhead door front (facing +x)
  const door = new THREE.Mesh(new RoundedBoxGeometry(0.15, 2.7, 4.0, 2, 0.05), doorMat);
  door.position.set(3.45, 1.4, 0);
  garage.add(door);
  // Door tracks (horizontal lines for detail)
  for (let i = 0; i < 5; i++) {
    const track = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 3.9), trimMat);
    track.position.set(3.53, 0.4 + i * 0.55, 0);
    garage.add(track);
  }

  // Sign 'GARAJ' above door
  const signBoard = new THREE.Mesh(new RoundedBoxGeometry(2.4, 0.55, 0.1, 3, 0.06), trimMat);
  signBoard.position.set(3.45, 3.35, 0);
  garage.add(signBoard);
  // Emissive glyph strip
  const glyph = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.35), emissiveMat);
  glyph.position.set(3.51, 3.35, 0);
  glyph.rotation.y = -Math.PI / 2;
  garage.add(glyph);

  // Trim / frame around door
  for (const side of [-1, 1]) {
    const frame = new THREE.Mesh(new RoundedBoxGeometry(0.18, 3.0, 0.2, 2, 0.06), trimMat);
    frame.position.set(3.5, 1.5, side * 2.05);
    garage.add(frame);
  }
  const lintel = new THREE.Mesh(new RoundedBoxGeometry(0.18, 0.2, 4.3, 2, 0.06), trimMat);
  lintel.position.set(3.5, 3.0, 0);
  garage.add(lintel);

  // Interior warm light (visible when night)
  const interiorLight = new THREE.PointLight(0xfff0b0, 3, 12, 2);
  interiorLight.position.set(0, 2.5, 0);
  garage.add(interiorLight);
  interiorLight.userData.baseIntensity = 3;
  interiorLight.userData.type = 'garage_interior';

  // Small snow accumulation on roof edges
  const rng = mulberry32(77);
  for (let i = 0; i < 8; i++) {
    const lump = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28 + rng() * 0.2, 1), snowMat);
    lump.scale.y = 0.5;
    const side = i % 2 === 0 ? 1 : -1;
    lump.position.set(-3 + rng() * 6, 3.55, side * (1.8 + rng() * 0.3));
    garage.add(lump);
  }

  garage.position.set(x, 0, z);
  garage.rotation.y = rot;
  scene.add(garage);

  return garage;
}

/* ---------------- util ---------------- */

function mulberry32(a) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
