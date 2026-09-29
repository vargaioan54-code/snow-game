// Vehicle state (separat, persist snow-game:vehicles-v1)
// - owned[]: id-uri vehicule detinute
// - activeVehicleId: id-ul selectat curent (poate fi null)
// - isPlayerInVehicle: bool
// - ownedAttachments[]
// - instances{}: per-vehicle state cross-session (fuel, durability, snowLoad, upgrades, attachment, lastPos)

import { VEHICLE_BY_ID, VEHICLE_STATS } from '../config/vehicles.js';
import { ATTACHMENT_BY_ID } from '../config/attachments.js';
import { VEHICLE_UPGRADE_STATS, VEHICLE_UPGRADE_MAX_LEVEL, upgradeMultiplier } from '../config/vehicleUpgrades.js';

const DEFAULT_INSTANCE = () => ({
  level: 1,
  upgrades: { power: 0, speed: 0, capacity: 0, fuel_efficiency: 0, durability: 0 },
  fuel: 100,
  durability: 100,
  snowLoad: 0,
  equippedAttachmentId: null,
  lastPosition: null,
  lastRotation: 0,
  // Etapa 9 — blocheaza enterVehicle player cand true
  inUseByFleet: false
});

const DEFAULTS = {
  owned: [],
  activeVehicleId: null,
  isPlayerInVehicle: false,
  ownedAttachments: [],
  instances: {}
};

function shallowEqual(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }
  return false;
}

export function createVehicleStore() {
  const state = {
    owned: [],
    activeVehicleId: null,
    isPlayerInVehicle: false,
    ownedAttachments: [],
    instances: {}
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

  function ensureInstance(vehicleId) {
    if (!state.instances[vehicleId]) {
      const config = VEHICLE_BY_ID[vehicleId];
      const inst = DEFAULT_INSTANCE();
      if (config) {
        inst.fuel = config.fuelCapacity;
        inst.durability = config.durability;
      }
      const newInstances = { ...state.instances, [vehicleId]: inst };
      state.instances = newInstances;
      notify(['instances']);
    }
    return state.instances[vehicleId];
  }

  function updateInstance(vehicleId, patch) {
    const inst = state.instances[vehicleId];
    if (!inst) return;
    const merged = { ...inst, ...patch };
    const newInstances = { ...state.instances, [vehicleId]: merged };
    state.instances = newInstances;
    notify(['instances']);
  }

  function sanitize(data) {
    const clean = { ...DEFAULTS };
    if (data && typeof data === 'object') {
      // owned
      clean.owned = Array.isArray(data.owned)
        ? [...new Set(data.owned.filter(id => typeof id === 'string' && VEHICLE_BY_ID[id]))]
        : [];
      // ownedAttachments
      clean.ownedAttachments = Array.isArray(data.ownedAttachments)
        ? [...new Set(data.ownedAttachments.filter(id => typeof id === 'string' && ATTACHMENT_BY_ID[id]))]
        : [];
      // activeVehicleId
      clean.activeVehicleId = (typeof data.activeVehicleId === 'string' && clean.owned.includes(data.activeVehicleId))
        ? data.activeVehicleId : null;
      // isPlayerInVehicle: reset at boot (safety, evita loading in vehicul care nu-i spawned)
      clean.isPlayerInVehicle = false;
      // instances
      clean.instances = {};
      if (data.instances && typeof data.instances === 'object') {
        for (const vId in data.instances) {
          if (!VEHICLE_BY_ID[vId]) continue;
          const config = VEHICLE_BY_ID[vId];
          const src = data.instances[vId] || {};
          const inst = DEFAULT_INSTANCE();
          inst.fuel = config.fuelCapacity;
          inst.durability = config.durability;

          if (typeof src.fuel === 'number' && isFinite(src.fuel)) {
            inst.fuel = Math.max(0, Math.min(config.fuelCapacity, src.fuel));
          }
          if (typeof src.durability === 'number' && isFinite(src.durability)) {
            inst.durability = Math.max(0, Math.min(config.durability, src.durability));
          }
          if (typeof src.snowLoad === 'number' && isFinite(src.snowLoad)) {
            inst.snowLoad = Math.max(0, Math.min(config.capacity * 3, src.snowLoad));
          }
          if (typeof src.level === 'number' && src.level >= 1) inst.level = Math.floor(src.level);
          if (src.upgrades && typeof src.upgrades === 'object') {
            for (const stat of VEHICLE_UPGRADE_STATS) {
              const v = Number(src.upgrades[stat]);
              inst.upgrades[stat] = Number.isFinite(v) ? Math.max(0, Math.min(VEHICLE_UPGRADE_MAX_LEVEL, v | 0)) : 0;
            }
          }
          // Attachment: verify compat
          if (typeof src.equippedAttachmentId === 'string' && ATTACHMENT_BY_ID[src.equippedAttachmentId]
              && config.compatibleAttachments.includes(src.equippedAttachmentId)
              && clean.ownedAttachments.includes(src.equippedAttachmentId)) {
            inst.equippedAttachmentId = src.equippedAttachmentId;
          }
          // Position
          if (src.lastPosition && typeof src.lastPosition === 'object'
              && typeof src.lastPosition.x === 'number' && typeof src.lastPosition.z === 'number') {
            inst.lastPosition = { x: src.lastPosition.x, y: src.lastPosition.y || 0, z: src.lastPosition.z };
          }
          if (typeof src.lastRotation === 'number' && isFinite(src.lastRotation)) {
            inst.lastRotation = src.lastRotation;
          }
          // Etapa 9 — inUseByFleet: reset la boot pentru safety (nu persist ca true)
          inst.inUseByFleet = false;
          clean.instances[vId] = inst;
        }
      }
      // Auto-create instance for each owned vehicle if missing
      for (const vId of clean.owned) {
        if (!clean.instances[vId]) {
          const config = VEHICLE_BY_ID[vId];
          const inst = DEFAULT_INSTANCE();
          inst.fuel = config.fuelCapacity;
          inst.durability = config.durability;
          clean.instances[vId] = inst;
        }
      }
    }
    return clean;
  }

  return {
    get state() { return state; },

    set,

    // Helpers
    isOwned(id) { return state.owned.includes(id); },
    isAttachmentOwned(id) { return state.ownedAttachments.includes(id); },
    getActive() {
      if (!state.activeVehicleId) return null;
      return {
        id: state.activeVehicleId,
        config: VEHICLE_BY_ID[state.activeVehicleId],
        instance: state.instances[state.activeVehicleId]
      };
    },
    getInstance(id) { return state.instances[id] || null; },
    ensureInstance,
    updateInstance,

    addOwned(id) {
      if (state.owned.includes(id)) return false;
      state.owned = [...state.owned, id];
      ensureInstance(id);
      notify(['owned']);
      return true;
    },
    addAttachmentOwned(id) {
      if (state.ownedAttachments.includes(id)) return false;
      state.ownedAttachments = [...state.ownedAttachments, id];
      notify(['ownedAttachments']);
      return true;
    },

    getEffectiveStats(vehicleId, weatherParams = null) {
      const config = VEHICLE_BY_ID[vehicleId];
      if (!config) return null;
      const inst = state.instances[vehicleId] || DEFAULT_INSTANCE();
      const upg = inst.upgrades;
      const powerMult = upgradeMultiplier(upg.power);
      const speedMult = upgradeMultiplier(upg.speed);
      const capacityMult = upgradeMultiplier(upg.capacity);
      const fuelEffMult = upgradeMultiplier(upg.fuel_efficiency);
      const durMult = upgradeMultiplier(upg.durability);

      const weatherStrict = weatherParams ? (1 - (weatherParams.visibility || 1)) : 0;
      const weatherHard = weatherParams ? (weatherParams.hardnessModifier || 1) : 1;

      let capacity = config.capacity * capacityMult;
      // Bonus from bucket attachment
      if (inst.equippedAttachmentId) {
        const att = ATTACHMENT_BY_ID[inst.equippedAttachmentId];
        if (att && att.capacityBonus) capacity += att.capacityBonus;
      }

      return {
        maxSpeed: config.maxSpeed * speedMult,
        acceleration: config.acceleration * speedMult,
        brakeForce: config.brakeForce,
        turnRate: config.turnRate,
        clearWidth: config.clearWidth,
        clearPower: config.clearPower * powerMult,
        clearRange: config.clearRange,
        capacity,
        fuelCapacity: config.fuelCapacity,
        fuelConsumption: config.fuelConsumption * (1 + weatherStrict * 0.5) / fuelEffMult,
        durability: config.durability * durMult,
        durabilityWear: config.durabilityWear * weatherHard / durMult
      };
    },

    on(cb) { anyListeners.add(cb); return () => anyListeners.delete(cb); },
    onKey(key, cb) {
      if (!keyListeners.has(key)) keyListeners.set(key, new Set());
      keyListeners.get(key).add(cb);
      return () => keyListeners.get(key).delete(cb);
    },

    serialize() {
      return {
        owned: [...state.owned],
        activeVehicleId: state.activeVehicleId,
        isPlayerInVehicle: false, // never persist as true (safety)
        ownedAttachments: [...state.ownedAttachments],
        instances: JSON.parse(JSON.stringify(state.instances))
      };
    },
    hydrate(data) {
      const clean = sanitize(data);
      Object.assign(state, clean);
      notify(Object.keys(clean));
      return true;
    },
    reset() {
      state.owned = [];
      state.activeVehicleId = null;
      state.isPlayerInVehicle = false;
      state.ownedAttachments = [];
      state.instances = {};
      notify(['owned', 'activeVehicleId', 'isPlayerInVehicle', 'ownedAttachments', 'instances']);
    }
  };
}
