// GarageStore — persist snow-game:garage-v1
// Doar level + unlocked + stats de vizita. Vehiculele stau in VehicleStore.

import { GARAGE_STATS, GARAGE_MAX_LEVEL, garageLevelCapacity, garageUpgradeCostAt } from '../config/garage.js';

const DEFAULTS = {
  level: 1,
  unlocked: true,       // in Etapa 7 mereu true
  totalVisits: 0,
  lastVisitAt: null
};

function shallowEqual(a, b) {
  if (a === b) return true;
  return false;
}

export function createGarageStore() {
  const state = { ...DEFAULTS };
  const anyListeners = new Set();
  const keyListeners = new Map();

  function notify(changedKeys) {
    for (const l of anyListeners) l(state, changedKeys);
    for (const k of changedKeys) {
      const s = keyListeners.get(k);
      if (s) for (const l of s) l(state[k], state);
    }
  }

  function set(patch) {
    const changed = [];
    for (const k in patch) {
      if (!shallowEqual(state[k], patch[k])) {
        state[k] = patch[k];
        changed.push(k);
      }
    }
    if (changed.length) notify(changed);
  }

  function sanitize(data) {
    const clean = { ...DEFAULTS };
    if (data && typeof data === 'object') {
      const lvl = Number(data.level);
      clean.level = Number.isFinite(lvl) && lvl >= 1 && lvl <= GARAGE_MAX_LEVEL ? Math.floor(lvl) : 1;
      clean.unlocked = data.unlocked === false ? false : true;
      const tv = Number(data.totalVisits);
      clean.totalVisits = Number.isFinite(tv) && tv >= 0 ? Math.floor(tv) : 0;
      const lva = Number(data.lastVisitAt);
      clean.lastVisitAt = Number.isFinite(lva) && lva > 0 ? lva : null;
    }
    return clean;
  }

  return {
    get state() { return state; },
    set,
    on(cb) { anyListeners.add(cb); return () => anyListeners.delete(cb); },
    onKey(key, cb) {
      if (!keyListeners.has(key)) keyListeners.set(key, new Set());
      keyListeners.get(key).add(cb);
      return () => keyListeners.get(key).delete(cb);
    },

    getCurrentCapacity() { return garageLevelCapacity(state.level); },
    getNextUpgradeCost() { return garageUpgradeCostAt(state.level); },
    isMaxLevel() { return state.level >= GARAGE_MAX_LEVEL; },

    serialize() {
      return { ...state };
    },
    hydrate(data) {
      const clean = sanitize(data);
      Object.assign(state, clean);
      notify(Object.keys(clean));
      return true;
    },
    reset() {
      Object.assign(state, { ...DEFAULTS });
      notify(Object.keys(DEFAULTS));
    }
  };
}
