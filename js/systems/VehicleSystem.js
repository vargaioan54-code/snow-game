// VehicleSystem — orchestreaza cumparare, spawn, enter/exit, driving, clearing snow,
// deposit auto la cabina, fuel/durability, headlights zi/noapte.

import * as THREE from 'three';
import { VEHICLE_BY_ID, VEHICLE_STATS } from '../config/vehicles.js';
import { ATTACHMENT_BY_ID, ATTACHMENT_STATS } from '../config/attachments.js';
import { VEHICLE_UPGRADE_STATS, VEHICLE_UPGRADE_MAX_LEVEL, vehicleUpgradeCost, upgradeMultiplier } from '../config/vehicleUpgrades.js';
import { CABIN_POSITION } from '../config/world.js';
import { VEHICLE_BUILDERS } from '../vehicles/builders.js';
import { buildAttachment } from '../vehicles/attachments.js';

const ENTER_MAX_DIST = 3.0;
const DEPOSIT_RADIUS = 3.5; // near cabin
const DEPOSIT_COOLDOWN = 0.5;
const CLEAR_TICK = 0.05; // sec — throttle clearing checks

export function createVehicleSystem(deps) {
  const {
    vehicleStore, playerStore, economy, environment, weatherSystem,
    timeSystem, gameState, controls, character, scene, transactionLog,
    audio, haptics, showBanner
  } = deps;

  // Spawned meshes in scene: id -> { objects, root, wheels, bladeAnchor, headlights, attachmentMesh, speed, physicsState }
  const spawned = new Map();
  let lastDepositTime = -999;
  let clearTickAcc = 0;
  let saveScheduler = null;
  const banner = (t) => (showBanner ? showBanner(t) : console.log('[banner]', t));

  function scheduleSave() {
    // rely on autosave in caller
  }

  /* ============== SPAWN / DESPAWN ============== */

  function spawnVehicle(id, position = null, rotation = null) {
    if (!vehicleStore.isOwned(id)) return { ok: false, reason: 'not_owned' };
    if (spawned.has(id)) return { ok: true, already: true, obj: spawned.get(id) };

    const config = VEHICLE_BY_ID[id];
    if (!config) return { ok: false, reason: 'unknown' };

    const builder = VEHICLE_BUILDERS[id];
    if (!builder) return { ok: false, reason: 'no_builder' };

    const built = builder(config.color);
    const inst = vehicleStore.ensureInstance(id);

    // Position: last saved pos, provided, or default (near cabin)
    let spawnPos = position;
    if (!spawnPos) {
      if (inst.lastPosition) spawnPos = inst.lastPosition;
      else spawnPos = { x: CABIN_POSITION.x + 5, y: 0, z: CABIN_POSITION.z + 3 };
    }
    built.group.position.set(spawnPos.x, spawnPos.y || 0, spawnPos.z);
    let spawnRot = rotation != null ? rotation : (inst.lastRotation || 0);
    built.group.rotation.y = spawnRot;

    scene.add(built.group);

    // Attach existing equipped attachment
    let attachmentMesh = null;
    if (inst.equippedAttachmentId) {
      attachmentMesh = buildAttachment(inst.equippedAttachmentId);
      if (attachmentMesh) built.bladeAnchor.add(attachmentMesh);
    }

    const obj = {
      id,
      config,
      root: built.group,
      wheels: built.wheels,
      bladeAnchor: built.bladeAnchor,
      headlights: built.headlights,
      headlightMeshes: built.headlightMeshes,
      hood: built.hood,
      attachmentMesh,
      speed: 0,          // forward speed (m/s)
      angularVel: 0,     // yaw angular velocity
      lastPos: new THREE.Vector3()
    };
    obj.lastPos.copy(built.group.position);

    spawned.set(id, obj);
    return { ok: true, obj };
  }

  function despawn(id) {
    const obj = spawned.get(id);
    if (!obj) return false;
    // Save last pos/rot
    vehicleStore.updateInstance(id, {
      lastPosition: { x: obj.root.position.x, y: obj.root.position.y, z: obj.root.position.z },
      lastRotation: obj.root.rotation.y
    });
    scene.remove(obj.root);
    obj.root.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
        else o.material.dispose();
      }
    });
    spawned.delete(id);
    return true;
  }

  function despawnAll() {
    for (const id of Array.from(spawned.keys())) despawn(id);
  }

  function getSpawned(id) { return spawned.get(id) || null; }
  function getSpawnedActive() {
    const a = vehicleStore.state.activeVehicleId;
    return a ? spawned.get(a) : null;
  }

  /* ============== ENTER / EXIT ============== */

  function distanceToPlayer(vObj) {
    const p = character.group.position;
    const v = vObj.root.position;
    const dx = p.x - v.x, dz = p.z - v.z;
    return Math.hypot(dx, dz);
  }

  function enterVehicle(id) {
    if (!vehicleStore.isOwned(id)) return { ok: false, reason: 'not_owned' };
    const obj = spawned.get(id);
    if (!obj) return { ok: false, reason: 'not_spawned' };
    const dist = distanceToPlayer(obj);
    if (dist > ENTER_MAX_DIST) {
      banner('Apropie-te de vehicul (' + dist.toFixed(1) + 'm)');
      return { ok: false, reason: 'too_far', distance: dist };
    }
    if (vehicleStore.state.isPlayerInVehicle) {
      return { ok: false, reason: 'already_in_vehicle' };
    }
    // Etapa 9 — vehicul in operatiune fleet nu poate fi condus de player
    const inst = vehicleStore.getInstance(id);
    if (inst && inst.inUseByFleet) {
      banner('🚧 Vehicul in misiune de flota');
      return { ok: false, reason: 'in_use_by_fleet' };
    }

    vehicleStore.set({
      activeVehicleId: id,
      isPlayerInVehicle: true
    });
    character.group.visible = false;

    if (audio && audio.engineStart) audio.engineStart(id, obj.config.engineTone);
    if (haptics && haptics.medium) haptics.medium();
    banner('🚗 Ai intrat în ' + obj.config.name);
    if (transactionLog) transactionLog.log({ type: 'VEHICLE_ENTER', currency: 'none', amount: 0, balanceAfter: 0, meta: { vehicleId: id } });
    return { ok: true };
  }

  function exitVehicle() {
    if (!vehicleStore.state.isPlayerInVehicle) return { ok: false, reason: 'not_in_vehicle' };
    const id = vehicleStore.state.activeVehicleId;
    const obj = id ? spawned.get(id) : null;

    if (obj) {
      // Save last pos/rot
      vehicleStore.updateInstance(id, {
        lastPosition: { x: obj.root.position.x, y: obj.root.position.y, z: obj.root.position.z },
        lastRotation: obj.root.rotation.y
      });
      // Place character next to vehicle (lateral)
      const yaw = obj.root.rotation.y;
      const offX = Math.cos(yaw) * 1.5;
      const offZ = -Math.sin(yaw) * 1.5;
      character.group.position.set(
        obj.root.position.x + offX,
        0,
        obj.root.position.z + offZ
      );
      obj.speed = 0;
      obj.angularVel = 0;
    }

    vehicleStore.set({ isPlayerInVehicle: false });
    character.group.visible = true;

    if (audio && audio.engineStop) audio.engineStop(id);
    banner('🚶 Ai coborât din vehicul');
    return { ok: true };
  }

  /* ============== ECONOMY: BUY / UPGRADE / REFUEL / REPAIR ============== */

  function isVehicleUnlocked(vehicleId, ps) {
    const config = VEHICLE_BY_ID[vehicleId];
    if (!config) return false;
    if (ps.level < (config.unlockLevel || 1)) return false;
    const done = (ps.stats && ps.stats.contractsCompleted) || 0;
    if ((config.requiredContracts || 0) > done) return false;
    return true;
  }

  function getVehicleLockReason(vehicleId, ps) {
    const config = VEHICLE_BY_ID[vehicleId];
    if (!config) return { reason: 'unknown' };
    if (ps.level < (config.unlockLevel || 1)) {
      return { reason: 'level', requiredLevel: config.unlockLevel };
    }
    const done = (ps.stats && ps.stats.contractsCompleted) || 0;
    if ((config.requiredContracts || 0) > done) {
      return { reason: 'contracts', required: config.requiredContracts, current: done };
    }
    return null;
  }

  function buyVehicle(id) {
    const config = VEHICLE_BY_ID[id];
    if (!config) return { ok: false, reason: 'unknown' };
    if (vehicleStore.isOwned(id)) {
      // Already owned — treat as select
      vehicleStore.set({ activeVehicleId: id });
      return { ok: true, alreadyOwned: true };
    }
    // Unlock check
    const lock = getVehicleLockReason(id, playerStore.state);
    if (lock) return { ok: false, ...lock };
    // Currency check + spend
    if (!economy.spend(config.price)) return { ok: false, reason: 'poor' };
    vehicleStore.addOwned(id);
    vehicleStore.set({ activeVehicleId: id });
    // Auto-grant plow_small if this is an ATV owner and doesn't have it
    if (id === 'atv_basic' && !vehicleStore.isAttachmentOwned('plow_small')) {
      vehicleStore.addAttachmentOwned('plow_small');
      vehicleStore.updateInstance('atv_basic', { equippedAttachmentId: 'plow_small' });
    }
    if (transactionLog) transactionLog.log({ type: 'VEHICLE_PURCHASE', currency: 'coins', amount: -config.price, balanceAfter: playerStore.totalCoins, meta: { vehicleId: id } });
    if (audio && audio.pickupBig) audio.pickupBig();
    if (haptics && haptics.success) haptics.success();
    banner('Ai cumpărat: ' + config.name);
    return { ok: true, purchased: true };
  }

  function buyAttachment(id) {
    const att = ATTACHMENT_BY_ID[id];
    if (!att) return { ok: false, reason: 'unknown' };
    if (vehicleStore.isAttachmentOwned(id)) return { ok: true, alreadyOwned: true };
    if (playerStore.state.level < (att.unlockLevel || 1)) {
      return { ok: false, reason: 'level', requiredLevel: att.unlockLevel };
    }
    if (att.price > 0 && !economy.spend(att.price)) return { ok: false, reason: 'poor' };
    vehicleStore.addAttachmentOwned(id);
    if (transactionLog) transactionLog.log({ type: 'ATTACHMENT_PURCHASE', currency: 'coins', amount: -att.price, balanceAfter: playerStore.totalCoins, meta: { attachmentId: id } });
    if (audio && audio.pickupBig) audio.pickupBig();
    banner('Ai cumpărat: ' + att.name);
    return { ok: true, purchased: true };
  }

  function equipAttachment(vehicleId, attachmentId) {
    const config = VEHICLE_BY_ID[vehicleId];
    if (!config) return { ok: false, reason: 'unknown_vehicle' };
    if (!vehicleStore.isOwned(vehicleId)) return { ok: false, reason: 'not_owned' };
    if (!attachmentId) {
      // Unequip
      vehicleStore.updateInstance(vehicleId, { equippedAttachmentId: null });
      const obj = spawned.get(vehicleId);
      if (obj && obj.attachmentMesh) {
        obj.bladeAnchor.remove(obj.attachmentMesh);
        obj.attachmentMesh = null;
      }
      return { ok: true, unequipped: true };
    }
    const att = ATTACHMENT_BY_ID[attachmentId];
    if (!att) return { ok: false, reason: 'unknown_attachment' };
    if (!vehicleStore.isAttachmentOwned(attachmentId)) return { ok: false, reason: 'attachment_not_owned' };
    if (!config.compatibleAttachments.includes(attachmentId)) return { ok: false, reason: 'incompatible' };

    vehicleStore.updateInstance(vehicleId, { equippedAttachmentId: attachmentId });
    const obj = spawned.get(vehicleId);
    if (obj) {
      if (obj.attachmentMesh) obj.bladeAnchor.remove(obj.attachmentMesh);
      obj.attachmentMesh = buildAttachment(attachmentId);
      if (obj.attachmentMesh) obj.bladeAnchor.add(obj.attachmentMesh);
    }
    banner('Atașament: ' + att.name);
    return { ok: true, equipped: attachmentId };
  }

  function buyUpgrade(vehicleId, stat) {
    if (!VEHICLE_UPGRADE_STATS.includes(stat)) return { ok: false, reason: 'invalid_stat' };
    if (!vehicleStore.isOwned(vehicleId)) return { ok: false, reason: 'not_owned' };
    const config = VEHICLE_BY_ID[vehicleId];
    const inst = vehicleStore.ensureInstance(vehicleId);
    const currLevel = inst.upgrades[stat] || 0;
    if (currLevel >= VEHICLE_UPGRADE_MAX_LEVEL) return { ok: false, reason: 'max' };
    const cost = vehicleUpgradeCost(config.price, currLevel);
    if (!economy.spend(cost)) return { ok: false, reason: 'poor' };
    const newUpgrades = { ...inst.upgrades, [stat]: currLevel + 1 };
    vehicleStore.updateInstance(vehicleId, { upgrades: newUpgrades });
    if (transactionLog) transactionLog.log({ type: 'VEHICLE_UPGRADE', currency: 'coins', amount: -cost, balanceAfter: playerStore.totalCoins, meta: { vehicleId, stat, newLevel: currLevel + 1 } });
    banner('Upgrade: ' + stat + ' Lv' + (currLevel + 1));
    return { ok: true, newLevel: currLevel + 1 };
  }

  function refuel(vehicleId, amount = null) {
    const config = VEHICLE_BY_ID[vehicleId];
    if (!config) return { ok: false, reason: 'unknown' };
    if (!vehicleStore.isOwned(vehicleId)) return { ok: false, reason: 'not_owned' };
    const inst = vehicleStore.ensureInstance(vehicleId);
    const needed = amount != null ? amount : (config.fuelCapacity - inst.fuel);
    if (needed <= 0) return { ok: true, alreadyFull: true };
    const cost = Math.max(1, Math.round(needed * 5)); // 5 coins per unit fuel
    if (!economy.spend(cost)) return { ok: false, reason: 'poor', cost };
    const newFuel = Math.min(config.fuelCapacity, inst.fuel + needed);
    vehicleStore.updateInstance(vehicleId, { fuel: newFuel });
    if (transactionLog) transactionLog.log({ type: 'FUEL_PURCHASE', currency: 'coins', amount: -cost, balanceAfter: playerStore.totalCoins, meta: { vehicleId, amount: needed } });
    banner('⛽ Combustibil: ' + Math.round(newFuel) + '/' + config.fuelCapacity);
    return { ok: true, cost, newFuel };
  }

  function repair(vehicleId, amount = null) {
    const config = VEHICLE_BY_ID[vehicleId];
    if (!config) return { ok: false, reason: 'unknown' };
    if (!vehicleStore.isOwned(vehicleId)) return { ok: false, reason: 'not_owned' };
    const inst = vehicleStore.ensureInstance(vehicleId);
    const needed = amount != null ? amount : (config.durability - inst.durability);
    if (needed <= 0) return { ok: true, alreadyFull: true };
    const cost = Math.max(1, Math.round(needed * 15)); // 15 coins per unit durability
    if (!economy.spend(cost)) return { ok: false, reason: 'poor', cost };
    const newDur = Math.min(config.durability, inst.durability + needed);
    vehicleStore.updateInstance(vehicleId, { durability: newDur });
    if (transactionLog) transactionLog.log({ type: 'VEHICLE_REPAIR', currency: 'coins', amount: -cost, balanceAfter: playerStore.totalCoins, meta: { vehicleId, amount: needed } });
    banner('🔧 Reparat: ' + Math.round(newDur) + '/' + config.durability);
    return { ok: true, cost, newDur };
  }

  /* ============== UPDATE (game loop) ============== */

  function update(dt) {
    if (!vehicleStore.state.isPlayerInVehicle) return;
    if (!gameState || !gameState.isPlaying || gameState.isPlaying()) {
      _updateActiveVehicle(dt);
    }
  }

  const _tmpForward = new THREE.Vector3();
  const _bladePts = [];
  const _fakeToolCache = {};

  function _updateActiveVehicle(dt) {
    const id = vehicleStore.state.activeVehicleId;
    if (!id) return;
    const obj = spawned.get(id);
    if (!obj) {
      // Vehicle marked active but not spawned — exit safety
      vehicleStore.set({ isPlayerInVehicle: false });
      character.group.visible = true;
      return;
    }

    const config = obj.config;
    const inst = vehicleStore.getInstance(id) || vehicleStore.ensureInstance(id);
    const weatherParams = weatherSystem ? weatherSystem.getInterpolatedParams() : { visibility: 1, hardnessModifier: 1 };
    const effective = vehicleStore.getEffectiveStats(id, weatherParams);

    // Fuel/durability efficiency multiplier
    const fuelOk = inst.fuel > 0.5;
    const durMult = inst.durability > 20 ? 1.0 : 0.3;
    const overallMult = fuelOk ? durMult : 0;

    // === Input mapping ===
    const input = controls.input || { x: 0, z: 0, magnitude: 0 };
    // z > 0 = forward, z < 0 = reverse
    const throttle = input.z;
    // x > 0 = right steering (turn right), x < 0 = left
    const steer = input.x;

    // === Speed/accel ===
    const targetSpeed = throttle * effective.maxSpeed * overallMult;
    const accelRate = effective.acceleration;
    if (Math.abs(targetSpeed) > Math.abs(obj.speed)) {
      // accelerating
      const delta = accelRate * dt * Math.sign(targetSpeed - obj.speed);
      obj.speed += delta;
      if ((delta > 0 && obj.speed > targetSpeed) || (delta < 0 && obj.speed < targetSpeed)) obj.speed = targetSpeed;
    } else {
      // braking / coasting
      const brake = effective.brakeForce * dt;
      if (Math.abs(obj.speed) < brake) obj.speed = 0;
      else obj.speed -= brake * Math.sign(obj.speed - targetSpeed);
      // clamp coasting speed to targetSpeed
      if (targetSpeed === 0 && Math.abs(obj.speed) < 0.05) obj.speed = 0;
    }

    // === Steering — only effective when moving ===
    const speedFactor = Math.min(1, Math.abs(obj.speed) / effective.maxSpeed);
    const turnAmount = steer * effective.turnRate * dt * speedFactor;
    // Reverse steering flip
    const finalTurn = obj.speed < 0 ? -turnAmount : turnAmount;
    obj.root.rotation.y += finalTurn;

    // === Position update ===
    const yaw = obj.root.rotation.y;
    _tmpForward.set(Math.sin(yaw), 0, Math.cos(yaw));
    const dx = _tmpForward.x * obj.speed * dt;
    const dz = _tmpForward.z * obj.speed * dt;
    const newX = obj.root.position.x + dx;
    const newZ = obj.root.position.z + dz;

    // Map bounds (±38, leaving margin for fence at ±40)
    const BOUND = 38;
    const clampedX = Math.max(-BOUND, Math.min(BOUND, newX));
    const clampedZ = Math.max(-BOUND, Math.min(BOUND, newZ));
    if (clampedX !== newX || clampedZ !== newZ) {
      obj.speed *= 0.3; // slow down when hitting boundary
    }

    // Basic collider check (circle vs circle)
    let pushedX = clampedX, pushedZ = clampedZ;
    if (environment && environment.getColliders) {
      const VEHICLE_R = 1.2;
      const colls = environment.getColliders();
      for (const c of colls) {
        const cdx = pushedX - c.x;
        const cdz = pushedZ - c.z;
        const rr = c.r + VEHICLE_R;
        const d2 = cdx * cdx + cdz * cdz;
        if (d2 < rr * rr && d2 > 1e-6) {
          const d = Math.sqrt(d2);
          const push = (rr - d) / d;
          pushedX += cdx * push;
          pushedZ += cdz * push;
          obj.speed *= 0.4;
        }
      }
    }

    obj.root.position.x = pushedX;
    obj.root.position.z = pushedZ;

    // Wheel visual rotation
    const wheelRot = (obj.speed * dt) / 0.35;
    for (const w of obj.wheels) w.rotation.x += wheelRot;

    // === Fuel/durability drain ===
    const speedRatio = Math.abs(obj.speed) / Math.max(1, effective.maxSpeed);
    const fuelUse = effective.fuelConsumption * dt * (0.3 + speedRatio * 0.7);
    const durUse = effective.durabilityWear * dt * (0.2 + speedRatio * 0.8);

    let newFuel = Math.max(0, inst.fuel - fuelUse);
    let newDur = Math.max(0, inst.durability - durUse);

    // === Snow clearing ===
    let newSnowLoad = inst.snowLoad;
    if (obj.attachmentMesh && Math.abs(obj.speed) > 0.5 && overallMult > 0) {
      clearTickAcc += dt;
      if (clearTickAcc >= CLEAR_TICK) {
        const dtClear = clearTickAcc;
        clearTickAcc = 0;
        // Compute blade points in world space
        const attId = inst.equippedAttachmentId;
        const att = attId ? ATTACHMENT_BY_ID[attId] : null;
        const width = att ? att.width : effective.clearWidth;
        const attPowerMult = att ? att.powerMult : 1.0;
        const NUM_PTS = 7;
        _bladePts.length = 0;
        // Blade world position
        const bladeWorld = new THREE.Vector3();
        obj.bladeAnchor.getWorldPosition(bladeWorld);
        // Perpendicular vector (right side of vehicle)
        const rightX = Math.cos(yaw);
        const rightZ = -Math.sin(yaw);
        for (let i = 0; i < NUM_PTS; i++) {
          const t = (i / (NUM_PTS - 1)) - 0.5; // -0.5..0.5
          _bladePts.push({
            x: bladeWorld.x + rightX * t * width,
            y: 0.1,
            z: bladeWorld.z + rightZ * t * width
          });
        }
        // Synthesize tool
        _fakeToolCache.id = 'vehicle_' + id;
        _fakeToolCache.mult = effective.clearPower * attPowerMult * overallMult;
        _fakeToolCache.maxLayer = 3;
        _fakeToolCache.compatibility = config.compatibility;
        // Empty upgrades (already baked into effective.clearPower via power mult)
        const meltRes = environment.meltAt(_bladePts, effective.clearRange, dtClear, _fakeToolCache, {});
        if (meltRes && meltRes.coins > 0) {
          const gained = meltRes.coins * attPowerMult;
          const remaining = Math.max(0, effective.capacity - newSnowLoad);
          const added = Math.min(remaining, gained);
          newSnowLoad += added;
          if (newSnowLoad >= effective.capacity) {
            // Debounce banner
            if (!obj._lastFullBanner || performance.now() - obj._lastFullBanner > 3000) {
              banner('Capacitate plină — dute la cabană!');
              obj._lastFullBanner = performance.now();
            }
          }
          if (audio && audio.plowScrape) audio.plowScrape(true);
        }
      }
    }

    // === Auto-deposit near cabin ===
    const dxCab = obj.root.position.x - CABIN_POSITION.x;
    const dzCab = obj.root.position.z - CABIN_POSITION.z;
    const distCab = Math.hypot(dxCab, dzCab);
    if (distCab < DEPOSIT_RADIUS && newSnowLoad > 0) {
      const now = performance.now() / 1000;
      if (now - lastDepositTime > DEPOSIT_COOLDOWN) {
        const dep = Math.round(newSnowLoad * 1.1); // vehicle bonus 10%
        playerStore.set({ vaultCoins: playerStore.state.vaultCoins + dep });
        if (transactionLog) transactionLog.log({ type: 'VEHICLE_DEPOSIT', currency: 'coins', amount: dep, balanceAfter: playerStore.state.vaultCoins, meta: { vehicleId: id } });
        newSnowLoad = 0;
        lastDepositTime = now;
        if (audio && audio.deposit) audio.deposit();
        if (haptics && haptics.success) haptics.success();
        banner('+' + dep + ' depuse (vehicul)');
      }
    }

    // === Warnings ===
    if (newFuel === 0 && inst.fuel > 0) banner('⛽ Fără combustibil!');
    if (newDur < 20 && inst.durability >= 20) banner('⚠ Durabilitate critică!');

    // Persist changes
    vehicleStore.updateInstance(id, {
      fuel: newFuel,
      durability: newDur,
      snowLoad: newSnowLoad,
      lastPosition: { x: obj.root.position.x, y: 0, z: obj.root.position.z },
      lastRotation: obj.root.rotation.y
    });
  }

  /* ============== HEADLIGHT DAY/NIGHT TOGGLE ============== */

  function updateHeadlights(nightMode) {
    for (const obj of spawned.values()) {
      const emmissive = nightMode ? 0.9 : 0.15;
      for (const light of obj.headlights) {
        light.intensity = nightMode ? (light.userData.baseIntensity || 0.6) : 0;
      }
      if (obj.headlightMeshes) {
        for (const m of obj.headlightMeshes) {
          if (m.material) m.material.emissiveIntensity = emmissive;
        }
      }
    }
  }

  return {
    // Spawn
    spawnVehicle,
    despawn,
    despawnAll,
    getSpawned,
    getSpawnedActive,
    // Enter/exit
    enterVehicle,
    exitVehicle,
    distanceToPlayer,
    // Shop
    isVehicleUnlocked,
    getVehicleLockReason,
    buyVehicle,
    buyAttachment,
    equipAttachment,
    buyUpgrade,
    refuel,
    repair,
    // Loop
    update,
    updateHeadlights,
    // Consts
    ENTER_MAX_DIST
  };
}
