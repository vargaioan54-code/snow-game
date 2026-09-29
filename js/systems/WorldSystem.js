// WorldSystem — orchestreaza Regions/Locations/Areas peste WorldStore.
// Interactioneaza cu character (teleport la spawn), environment (progres per area),
// unlockSystem (verificare cerinte), transactionLog (log unlocks).

import { REGIONS, REGION_BY_ID } from '../config/regions.js';
import { LOCATIONS, LOCATION_BY_ID, getLocationsByRegion } from '../config/locations.js';
import { AREAS, AREA_BY_ID, getAreasByLocation } from '../config/areas.js';

export function createWorldSystem(deps) {
  const {
    worldStore, playerStore, contractStore, unlockSystem, character,
    transactionLog, audio, haptics, showBanner
  } = deps;

  let _lastProgressTick = 0;
  const PROGRESS_THROTTLE_MS = 500;

  // === Status helpers ===

  function statusForRegion(regionId, ps = playerStore.state) {
    if (worldStore.isRegionUnlocked(regionId)) return 'UNLOCKED';
    if (unlockSystem.isRegionUnlocked(REGION_BY_ID[regionId], ps)) return 'AVAILABLE'; // poate fi auto-deblocat
    return 'LOCKED';
  }
  function statusForLocation(locationId, ps = playerStore.state) {
    const loc = LOCATION_BY_ID[locationId];
    if (!loc) return 'LOCKED';
    if (worldStore.isLocationUnlocked(locationId)) {
      if (worldStore.state.currentLocationId === locationId) return 'ACTIVE';
      // toate area-urile complete?
      const areas = getAreasByLocation(locationId);
      if (areas.length > 0 && areas.every(a => worldStore.isAreaCompleted(a.id))) return 'COMPLETED';
      return 'UNLOCKED';
    }
    if (unlockSystem.isLocationUnlocked(loc, ps)) return 'AVAILABLE';
    return 'LOCKED';
  }

  function getRegions() {
    const ps = playerStore.state;
    return REGIONS.map(r => ({ ...r, status: statusForRegion(r.id, ps) }));
  }
  function getLocations(regionId) {
    const ps = playerStore.state;
    return getLocationsByRegion(regionId).map(l => ({
      ...l,
      status: statusForLocation(l.id, ps),
      progress: computeLocationProgress(l.id)
    }));
  }
  function getAreas(locationId) {
    return getAreasByLocation(locationId).map(a => ({
      ...a,
      progress: worldStore.getAreaProgress(a.id),
      completed: worldStore.isAreaCompleted(a.id)
    }));
  }
  function computeLocationProgress(locationId) {
    const areas = getAreasByLocation(locationId);
    if (areas.length === 0) return 0;
    let sum = 0;
    for (const a of areas) sum += worldStore.getAreaProgress(a.id);
    return sum / areas.length;
  }

  // === Enter / exit ===

  function enterLocation(locationId) {
    const loc = LOCATION_BY_ID[locationId];
    if (!loc) return { ok: false, reason: 'unknown' };
    if (!worldStore.isLocationUnlocked(locationId)) {
      // Verifica daca poate fi auto-deblocat
      if (unlockSystem.isLocationUnlocked(loc, playerStore.state)) {
        worldStore.unlockLocation(locationId);
      } else {
        const info = unlockSystem.getLocationLockReason(loc, playerStore.state);
        return { ok: false, reason: 'locked', requiredLevel: info?.requiredLevel };
      }
    }
    // Teleport character
    if (character && character.group && loc.spawn) {
      character.group.position.x = loc.spawn.x;
      character.group.position.z = loc.spawn.z;
    }
    worldStore.setCurrentLocation(locationId);
    if (audio && audio.pickupBig) audio.pickupBig();
    if (haptics && haptics.medium) haptics.medium();
    if (showBanner) showBanner('📍 ' + loc.name);
    return { ok: true };
  }

  function exitLocation() {
    if (worldStore.state.currentLocationId === null) return { ok: true };
    worldStore.setCurrentLocation(null);
    if (showBanner) showBanner('🌍 Free Roam');
    return { ok: true };
  }

  // === Auto-unlock check (chemat la level up / contract complete) ===

  function checkAndUnlock(ps = playerStore.state) {
    const newlyUnlocked = { regions: [], locations: [] };
    for (const r of REGIONS) {
      if (!worldStore.isRegionUnlocked(r.id) && unlockSystem.isRegionUnlocked(r, ps)) {
        worldStore.unlockRegion(r.id);
        newlyUnlocked.regions.push(r);
        if (transactionLog) transactionLog.log({
          type: 'REGION_UNLOCK', currency: null, amount: 0,
          balanceAfter: null, meta: { regionId: r.id }
        });
      }
    }
    for (const l of LOCATIONS) {
      if (!worldStore.isLocationUnlocked(l.id) && unlockSystem.isLocationUnlocked(l, ps)) {
        worldStore.unlockLocation(l.id);
        newlyUnlocked.locations.push(l);
        if (transactionLog) transactionLog.log({
          type: 'LOCATION_UNLOCK', currency: null, amount: 0,
          balanceAfter: null, meta: { locationId: l.id }
        });
      }
    }
    // UI feedback pentru fiecare deblocare
    for (const r of newlyUnlocked.regions) {
      if (showBanner) showBanner('🌍 Regiune deblocata: ' + r.name + '!');
      if (audio && audio.levelUp) audio.levelUp();
      if (haptics && haptics.heavy) haptics.heavy();
    }
    for (const l of newlyUnlocked.locations) {
      if (showBanner) showBanner('📍 Locatie deblocata: ' + l.name + '!');
      if (audio && audio.pickupBig) audio.pickupBig();
      if (haptics && haptics.medium) haptics.medium();
    }
    return newlyUnlocked;
  }

  // === Area progress tracking (chemat din game loop, throttled) ===

  function updateAreaProgress(dt) {
    _lastProgressTick += dt * 1000;
    if (_lastProgressTick < PROGRESS_THROTTLE_MS) return;
    _lastProgressTick = 0;

    // Actualizeaza toate areas din locatia curenta (daca exista)
    // Daca nu, itereaza doar area-urile din locatiile deblocate (mai putin costisitor)
    const env = deps.environment;
    if (!env || typeof env.getProgressInArea !== 'function') return;

    const currentLocId = worldStore.state.currentLocationId;
    let targets;
    if (currentLocId) {
      targets = getAreasByLocation(currentLocId);
    } else {
      // Free roam: actualizeaza area-urile din locatiile deblocate care nu-s deja completate
      targets = AREAS.filter(a =>
        worldStore.isLocationUnlocked(a.locationId) && !worldStore.isAreaCompleted(a.id)
      );
    }

    for (const a of targets) {
      const info = env.getProgressInArea(a.bounds.x, a.bounds.z, a.bounds.radius);
      if (info && typeof info.clearedFraction === 'number') {
        worldStore.setAreaProgress(a.id, info.clearedFraction);
      }
    }
  }

  function checkAreaComplete(areaId) {
    const p = worldStore.getAreaProgress(areaId);
    if (p >= 0.98 && !worldStore.isAreaCompleted(areaId)) {
      // Already handled by setAreaProgress side-effect, dar apel explicit sigur
      worldStore.setAreaProgress(areaId, p);
      return true;
    }
    return false;
  }

  function getPOIsInMap() {
    // POI-urile din TOATE locatiile deblocate — pentru minimap
    const out = [];
    for (const l of LOCATIONS) {
      if (!worldStore.isLocationUnlocked(l.id)) continue;
      if (!Array.isArray(l.poi)) continue;
      for (const p of l.poi) {
        out.push({ ...p, locationId: l.id });
      }
    }
    return out;
  }

  // === Etapa 8 — explicit region unlock (fara verificare cerinte) ===
  // Folosit de CompanySystem la level up (region_town, region_industrial etc.)
  function unlockRegion(regionId) {
    const r = REGION_BY_ID[regionId];
    if (!r) return { ok: false, reason: 'unknown' };
    if (worldStore.isRegionUnlocked(regionId)) return { ok: true, alreadyUnlocked: true };
    worldStore.unlockRegion(regionId);
    if (transactionLog) transactionLog.log({
      type: 'REGION_UNLOCK', currency: null, amount: 0, balanceAfter: null,
      meta: { regionId, src: 'explicit' }
    });
    if (showBanner) showBanner('🌍 Regiune deblocata: ' + r.name + '!');
    if (audio && audio.levelUp) audio.levelUp();
    if (haptics && haptics.heavy) haptics.heavy();
    return { ok: true };
  }

  return {
    getRegions, getLocations, getAreas, computeLocationProgress,
    enterLocation, exitLocation, checkAndUnlock, unlockRegion,
    updateAreaProgress, checkAreaComplete, getPOIsInMap,
    statusForRegion, statusForLocation
  };
}
