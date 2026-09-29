// GarageSystem — orchestrare: proximity, open/close, upgrade level,
// configuratii active, status per vehicul. Nu detine state.

import { GARAGE_STATS, GARAGE_MAX_LEVEL, garageUpgradeCostAt } from '../config/garage.js';
import { VEHICLE_BY_ID } from '../config/vehicles.js';
import { ATTACHMENT_BY_ID } from '../config/attachments.js';
import { VEHICLE_UPGRADE_STATS, VEHICLE_UPGRADE_MAX_LEVEL } from '../config/vehicleUpgrades.js';
import { SCREENS } from '../state/GameState.js';

export function createGarageSystem(deps) {
  const {
    garageStore, vehicleStore, vehicleSystem, playerStore, worldStore,
    economy, gameState, transactionLog, audio, haptics, scene,
    showBanner
  } = deps;

  const banner = (t) => (showBanner ? showBanner(t) : console.log('[banner]', t));

  function isPlayerNearGarage(playerPos) {
    if (!playerPos) return false;
    const dx = playerPos.x - GARAGE_STATS.position.x;
    const dz = playerPos.z - GARAGE_STATS.position.z;
    return (dx * dx + dz * dz) < (GARAGE_STATS.triggerRadius * GARAGE_STATS.triggerRadius);
  }

  function openGarage(opts = {}) {
    if (!garageStore.state.unlocked) return { ok: false, reason: 'locked' };
    // If not debug, require proximity
    if (!opts.force) {
      const pos = opts.playerPos;
      if (pos && !isPlayerNearGarage(pos)) {
        // permite oricum din HUD button — proximity e doar hint pentru "Enter" contextual
      }
    }
    garageStore.set({
      totalVisits: (garageStore.state.totalVisits || 0) + 1,
      lastVisitAt: Date.now()
    });
    if (gameState) gameState.setScreen(SCREENS.GARAGE_OPEN);
    if (audio && audio.garageDoor) audio.garageDoor(true);
    if (haptics && haptics.light) haptics.light();
    return { ok: true };
  }

  function closeGarage() {
    if (gameState) gameState.setScreen(SCREENS.PLAYING);
    if (audio && audio.garageDoor) audio.garageDoor(false);
    return { ok: true };
  }

  function getActiveConfiguration() {
    const active = vehicleStore.getActive();
    if (!active) return null;
    const inst = active.instance;
    const attId = inst && inst.equippedAttachmentId;
    const attachment = attId ? ATTACHMENT_BY_ID[attId] : null;
    // Weather-aware final stats
    const finalStats = vehicleStore.getEffectiveStats(active.id, null);
    return { vehicle: active.config, instance: inst, attachment, finalStats };
  }

  function getStatusFor(vehicleId) {
    if (!vehicleStore.isOwned(vehicleId)) return 'LOCKED';
    const config = VEHICLE_BY_ID[vehicleId];
    const inst = vehicleStore.getInstance(vehicleId);
    if (!inst || !config) return 'LOCKED';
    if (vehicleStore.state.activeVehicleId === vehicleId && vehicleStore.state.isPlayerInVehicle) return 'ACTIVE';
    const fuelPct = inst.fuel / config.fuelCapacity;
    const durPct = inst.durability / config.durability;
    if (durPct < 0.3) return 'NEEDS_REPAIR';
    if (fuelPct < 0.2) return 'LOW_FUEL';
    // Fully upgraded?
    let fullyUpg = true;
    for (const stat of VEHICLE_UPGRADE_STATS) {
      if ((inst.upgrades[stat] || 0) < VEHICLE_UPGRADE_MAX_LEVEL) { fullyUpg = false; break; }
    }
    if (fullyUpg) return 'FULLY_UPGRADED';
    if (inst.equippedAttachmentId) return 'ATTACHMENT_EQUIPPED';
    return 'READY';
  }

  function upgradeGarage() {
    if (garageStore.state.level >= GARAGE_MAX_LEVEL) return { ok: false, reason: 'max' };
    const cost = garageUpgradeCostAt(garageStore.state.level);
    if (cost == null) return { ok: false, reason: 'max' };
    if (!economy.spend(cost)) return { ok: false, reason: 'poor', cost };
    const newLevel = garageStore.state.level + 1;
    garageStore.set({ level: newLevel });
    if (transactionLog) transactionLog.log({
      type: 'GARAGE_UPGRADE', currency: 'coins',
      amount: -cost, balanceAfter: playerStore.totalCoins,
      meta: { newLevel }
    });
    if (audio && audio.serviceComplete) audio.serviceComplete();
    if (haptics && haptics.success) haptics.success();
    banner('Garaj upgradat: Nivel ' + newLevel);
    return { ok: true, newLevel, cost };
  }

  function canAffordRefuel(vehicleId) {
    const config = VEHICLE_BY_ID[vehicleId];
    const inst = vehicleStore.getInstance(vehicleId);
    if (!config || !inst) return false;
    const needed = config.fuelCapacity - inst.fuel;
    if (needed <= 0) return false;
    const cost = Math.max(1, Math.round(needed * 5));
    return playerStore.totalCoins >= cost;
  }

  function canAffordRepair(vehicleId) {
    const config = VEHICLE_BY_ID[vehicleId];
    const inst = vehicleStore.getInstance(vehicleId);
    if (!config || !inst) return false;
    const needed = config.durability - inst.durability;
    if (needed <= 0) return false;
    const cost = Math.max(1, Math.round(needed * 15));
    return playerStore.totalCoins >= cost;
  }

  function refuelCost(vehicleId) {
    const config = VEHICLE_BY_ID[vehicleId];
    const inst = vehicleStore.getInstance(vehicleId);
    if (!config || !inst) return 0;
    const needed = config.fuelCapacity - inst.fuel;
    if (needed <= 0) return 0;
    return Math.max(1, Math.round(needed * 5));
  }

  function repairCost(vehicleId) {
    const config = VEHICLE_BY_ID[vehicleId];
    const inst = vehicleStore.getInstance(vehicleId);
    if (!config || !inst) return 0;
    const needed = config.durability - inst.durability;
    if (needed <= 0) return 0;
    return Math.max(1, Math.round(needed * 15));
  }

  function serviceAll() {
    // Delega la refuel+repair per vehicul — fiecare face propriul spend()
    let totalCost = 0;
    for (const vId of vehicleStore.state.owned) {
      totalCost += refuelCost(vId) + repairCost(vId);
    }
    if (totalCost <= 0) {
      banner('Toate vehiculele sunt in stare buna');
      return { ok: true, nothingToDo: true };
    }
    if (playerStore.totalCoins < totalCost) {
      return { ok: false, reason: 'poor', cost: totalCost };
    }
    let refueled = 0, repaired = 0, spent = 0;
    for (const vId of vehicleStore.state.owned) {
      const rf = vehicleSystem.refuel(vId, null);
      if (rf && rf.ok && !rf.alreadyFull) { refueled++; spent += rf.cost || 0; }
      const rp = vehicleSystem.repair(vId, null);
      if (rp && rp.ok && !rp.alreadyFull) { repaired++; spent += rp.cost || 0; }
    }
    if (audio && audio.serviceComplete) audio.serviceComplete();
    if (haptics && haptics.success) haptics.success();
    banner('🔧 Service complet: ' + refueled + ' realim., ' + repaired + ' reparatii (-' + spent + ')');
    return { ok: true, refueled, repaired, cost: spent };
  }

  return {
    isPlayerNearGarage,
    openGarage,
    closeGarage,
    getActiveConfiguration,
    getStatusFor,
    upgradeGarage,
    canAffordRefuel,
    canAffordRepair,
    refuelCost,
    repairCost,
    serviceAll,
    getGarageInfo() {
      return {
        level: garageStore.state.level,
        capacity: garageStore.getCurrentCapacity(),
        maxLevel: GARAGE_MAX_LEVEL,
        nextCost: garageStore.getNextUpgradeCost(),
        position: GARAGE_STATS.position,
        triggerRadius: GARAGE_STATS.triggerRadius,
        totalVisits: garageStore.state.totalVisits
      };
    }
  };
}
