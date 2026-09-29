// WorldStore — sursa unica de adevar pentru starea lumii (regions/locations/areas).
// Persist separat de PlayerStore + ContractStore (cheie: snow-game:world-v1).
//
// Structura:
//   currentRegionId       — regiunea "acasa" (default 'starter'). Nu limiteaza gameplay, doar UI/context.
//   currentLocationId     — locatia curenta (null = free roam pe toata harta).
//   unlockedRegions[]     — id-uri regiuni deblocate (persist).
//   unlockedLocations[]   — id-uri locatii deblocate (persist).
//   completedAreas[]      — area IDs finalizate (clearedFraction >= 0.98).
//   areaProgress { [id]: 0..1 } — progres per zona (calculat live, persist pt UI offline).
//   visitCount { [locId]: number } — de cate ori a intrat playerul intr-o locatie.

import { REGIONS, REGION_BY_ID } from '../config/regions.js';
import { LOCATIONS, LOCATION_BY_ID } from '../config/locations.js';

const DEFAULTS = {
  currentRegionId: 'starter',
  currentLocationId: null,
  unlockedRegions: ['starter'],
  unlockedLocations: ['loc_residential', 'loc_village_center'],
  completedAreas: [],
  areaProgress: {},
  visitCount: {}
};

export function createWorldStore() {
  const state = {
    currentRegionId: DEFAULTS.currentRegionId,
    currentLocationId: DEFAULTS.currentLocationId,
    unlockedRegions: [...DEFAULTS.unlockedRegions],
    unlockedLocations: [...DEFAULTS.unlockedLocations],
    completedAreas: [],
    areaProgress: {},
    visitCount: {}
  };

  const anyListeners = new Set();
  const keyListeners = new Map();

  function notify(changedKeys) {
    for (const l of anyListeners) l(state, changedKeys);
    for (const k of changedKeys) {
      const s = keyListeners.get(k);
      if (s) for (const l of s) l(state[k], state);
    }
  }

  function shallowEqual(a, b) {
    if (a === b) return true;
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
      return true;
    }
    return false;
  }

  function sanitize(data) {
    const clean = { ...DEFAULTS, ...data };
    clean.unlockedRegions = Array.isArray(clean.unlockedRegions)
      ? [...new Set(clean.unlockedRegions.filter(id => REGION_BY_ID[id]))]
      : [...DEFAULTS.unlockedRegions];
    if (!clean.unlockedRegions.includes('starter')) clean.unlockedRegions.unshift('starter');

    clean.unlockedLocations = Array.isArray(clean.unlockedLocations)
      ? [...new Set(clean.unlockedLocations.filter(id => LOCATION_BY_ID[id]))]
      : [...DEFAULTS.unlockedLocations];
    // Starter core locations obligatoriu
    for (const id of DEFAULTS.unlockedLocations) {
      if (!clean.unlockedLocations.includes(id)) clean.unlockedLocations.push(id);
    }

    clean.completedAreas = Array.isArray(clean.completedAreas)
      ? [...new Set(clean.completedAreas.filter(x => typeof x === 'string'))]
      : [];

    if (typeof clean.currentRegionId !== 'string' || !REGION_BY_ID[clean.currentRegionId]) {
      clean.currentRegionId = 'starter';
    }
    if (clean.currentLocationId && (!LOCATION_BY_ID[clean.currentLocationId]
        || !clean.unlockedLocations.includes(clean.currentLocationId))) {
      clean.currentLocationId = null;
    }

    if (!clean.areaProgress || typeof clean.areaProgress !== 'object') clean.areaProgress = {};
    for (const k of Object.keys(clean.areaProgress)) {
      const n = Number(clean.areaProgress[k]);
      clean.areaProgress[k] = Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
    }

    if (!clean.visitCount || typeof clean.visitCount !== 'object') clean.visitCount = {};
    for (const k of Object.keys(clean.visitCount)) {
      const n = Number(clean.visitCount[k]);
      clean.visitCount[k] = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
    }

    return clean;
  }

  return {
    get state() { return state; },

    set(patch) {
      const changed = [];
      for (const k in patch) {
        if (!shallowEqual(state[k], patch[k])) {
          state[k] = patch[k];
          changed.push(k);
        }
      }
      if (changed.length) notify(changed);
    },

    // === Unlock helpers ===
    unlockRegion(id) {
      if (!REGION_BY_ID[id]) return false;
      if (state.unlockedRegions.includes(id)) return false;
      state.unlockedRegions = [...state.unlockedRegions, id];
      notify(['unlockedRegions']);
      return true;
    },
    unlockLocation(id) {
      if (!LOCATION_BY_ID[id]) return false;
      if (state.unlockedLocations.includes(id)) return false;
      state.unlockedLocations = [...state.unlockedLocations, id];
      notify(['unlockedLocations']);
      return true;
    },

    // === Location context ===
    setCurrentLocation(id) {
      if (id === null || id === undefined) {
        if (state.currentLocationId !== null) {
          state.currentLocationId = null;
          notify(['currentLocationId']);
        }
        return true;
      }
      if (!LOCATION_BY_ID[id]) return false;
      state.currentLocationId = id;
      state.currentRegionId = LOCATION_BY_ID[id].regionId;
      state.visitCount = { ...state.visitCount, [id]: (state.visitCount[id] || 0) + 1 };
      notify(['currentLocationId', 'currentRegionId', 'visitCount']);
      return true;
    },

    // === Area progress ===
    setAreaProgress(areaId, pct) {
      const p = Math.max(0, Math.min(1, Number(pct) || 0));
      if (state.areaProgress[areaId] === p) return;
      state.areaProgress = { ...state.areaProgress, [areaId]: p };
      notify(['areaProgress']);
      // Auto-mark completed
      if (p >= 0.98 && !state.completedAreas.includes(areaId)) {
        state.completedAreas = [...state.completedAreas, areaId];
        notify(['completedAreas']);
      }
    },
    resetAreaProgress(areaId) {
      if (areaId) {
        state.areaProgress = { ...state.areaProgress, [areaId]: 0 };
        state.completedAreas = state.completedAreas.filter(id => id !== areaId);
        notify(['areaProgress', 'completedAreas']);
      } else {
        state.areaProgress = {};
        state.completedAreas = [];
        notify(['areaProgress', 'completedAreas']);
      }
    },

    // === Helpers ===
    getCurrentRegion() {
      return REGION_BY_ID[state.currentRegionId] || REGION_BY_ID.starter;
    },
    getCurrentLocation() {
      return state.currentLocationId ? LOCATION_BY_ID[state.currentLocationId] : null;
    },
    isRegionUnlocked(id) { return state.unlockedRegions.includes(id); },
    isLocationUnlocked(id) { return state.unlockedLocations.includes(id); },
    isAreaCompleted(id) { return state.completedAreas.includes(id); },
    getAreaProgress(id) { return state.areaProgress[id] || 0; },

    on(cb) { anyListeners.add(cb); return () => anyListeners.delete(cb); },
    onKey(key, cb) {
      if (!keyListeners.has(key)) keyListeners.set(key, new Set());
      keyListeners.get(key).add(cb);
      return () => keyListeners.get(key).delete(cb);
    },

    serialize() {
      return {
        currentRegionId: state.currentRegionId,
        currentLocationId: state.currentLocationId,
        unlockedRegions: [...state.unlockedRegions],
        unlockedLocations: [...state.unlockedLocations],
        completedAreas: [...state.completedAreas],
        areaProgress: { ...state.areaProgress },
        visitCount: { ...state.visitCount }
      };
    },

    hydrate(data) {
      if (!data || typeof data !== 'object') return false;
      const clean = sanitize(data);
      state.currentRegionId = clean.currentRegionId;
      state.currentLocationId = clean.currentLocationId;
      state.unlockedRegions = clean.unlockedRegions;
      state.unlockedLocations = clean.unlockedLocations;
      state.completedAreas = clean.completedAreas;
      state.areaProgress = clean.areaProgress;
      state.visitCount = clean.visitCount;
      notify(['currentRegionId','currentLocationId','unlockedRegions','unlockedLocations',
              'completedAreas','areaProgress','visitCount']);
      return true;
    },

    reset() {
      state.currentRegionId = DEFAULTS.currentRegionId;
      state.currentLocationId = DEFAULTS.currentLocationId;
      state.unlockedRegions = [...DEFAULTS.unlockedRegions];
      state.unlockedLocations = [...DEFAULTS.unlockedLocations];
      state.completedAreas = [];
      state.areaProgress = {};
      state.visitCount = {};
      notify(['currentRegionId','currentLocationId','unlockedRegions','unlockedLocations',
              'completedAreas','areaProgress','visitCount']);
    }
  };
}
