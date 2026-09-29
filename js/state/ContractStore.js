// ContractStore — sursa unica de adevar pentru starea contractelor.
// Persist separat de PlayerStore (cheie: snow-game:contracts-v1).
// Structura:
//   state.activeContractId — id runtime al contractului ACTIVE (sau ACCEPTED); null altfel
//   state.contracts        — { [runtimeId]: Contract }
//   state.completed        — [runtimeId,...]
//   state.failed           — [runtimeId,...]
//
// Un Contract runtime este un template hidratat cu campuri dinamice:
//   templateId, id, status, acceptedAt, startedAt, completedAt, deadline,
//   progress, massCleared, rating, finalReward, rejectedByCompat

import { CONTRACT_STATUS } from '../config/contractStatus.js';
import { CONTRACT_TEMPLATES as BASE_TEMPLATES, CONTRACT_BY_ID } from '../config/contracts.js';
import { ENDGAME_CONTRACTS } from '../config/endgame.js';

const CONTRACT_TEMPLATES = [...BASE_TEMPLATES, ...ENDGAME_CONTRACTS];

const DEFAULTS = {
  activeContractId: null,
  contracts: {},
  completed: [],
  failed: []
};

// Instantiaza un contract runtime din template
export function contractFromTemplate(template, overrides = {}) {
  if (!template) return null;
  return {
    // template snapshot (imutabil in runtime)
    templateId: template.id,
    id: template.id, // runtimeId = templateId (unic; nu instantiez multiplu acelasi template deodata)
    type: template.type,
    title: template.title,
    client: template.client,
    description: template.description || '',
    // Etapa 4 — world refs
    regionId: template.regionId || null,
    locationId: template.locationId || null,
    areaId: template.areaId || null,
    area: { ...template.area },
    snowTypeHint: template.snowTypeHint || 'fresh',
    targetPct: template.targetPct || 0.9,
    requiredMass: template.requiredMass || 50,
    timeLimit: template.timeLimit || 180,
    baseReward: { ...template.baseReward },
    difficulty: template.difficulty || 'easy',
    unlockLevel: template.unlockLevel || 1,
    requiredTool: template.requiredTool || null,
    // Etapa 6 — preferredVehicle pentru bonus reward
    preferredVehicle: template.preferredVehicle || null,
    // Etapa 8 — tier (tier_1..tier_5) pentru company gating
    tier: template.tier || 'tier_1',

    // dinamice
    status: CONTRACT_STATUS.AVAILABLE,
    acceptedAt: 0,
    startedAt: 0,
    completedAt: 0,
    deadline: 0,
    progress: 0,
    massCleared: 0,
    rating: 0,
    finalReward: null,
    rejectedByCompat: 0,

    ...overrides
  };
}

export function createContractStore() {
  const state = {
    activeContractId: null,
    contracts: {},
    completed: [],
    failed: []
  };

  const anyListeners = new Set();
  const keyListeners = new Map();

  function notify(changedKeys) {
    for (const l of anyListeners) l(state, changedKeys);
    for (const k of changedKeys) {
      const set = keyListeners.get(k);
      if (set) for (const l of set) l(state[k], state);
    }
  }

  // Populeaza state.contracts din templates daca gol
  function populateFromTemplates() {
    const map = {};
    for (const tpl of CONTRACT_TEMPLATES) {
      map[tpl.id] = contractFromTemplate(tpl);
    }
    state.contracts = map;
    state.activeContractId = null;
    state.completed = [];
    state.failed = [];
    notify(['contracts', 'activeContractId', 'completed', 'failed']);
  }

  function sanitize(data) {
    const clean = { ...DEFAULTS, ...data };
    // contracts: obiect { id: contract }
    if (!clean.contracts || typeof clean.contracts !== 'object') clean.contracts = {};
    // Merge cu templates — pentru id-uri care nu mai exista sau templates noi
    const merged = {};
    for (const tpl of CONTRACT_TEMPLATES) {
      const existing = clean.contracts[tpl.id];
      if (existing && typeof existing === 'object') {
        // preserva runtime data
        merged[tpl.id] = { ...contractFromTemplate(tpl), ...existing, id: tpl.id, templateId: tpl.id };
        // valideaza status
        const validStatuses = Object.values(CONTRACT_STATUS);
        if (!validStatuses.includes(merged[tpl.id].status)) {
          merged[tpl.id].status = CONTRACT_STATUS.AVAILABLE;
        }
        // numerice pozitive
        merged[tpl.id].progress = Math.max(0, Math.min(1, Number(merged[tpl.id].progress) || 0));
        merged[tpl.id].massCleared = Math.max(0, Number(merged[tpl.id].massCleared) || 0);
        merged[tpl.id].rating = Math.max(0, Math.min(5, Number(merged[tpl.id].rating) || 0));
        merged[tpl.id].rejectedByCompat = Math.max(0, Number(merged[tpl.id].rejectedByCompat) || 0);
      } else {
        merged[tpl.id] = contractFromTemplate(tpl);
      }
    }
    clean.contracts = merged;

    // completed/failed: array de string
    clean.completed = Array.isArray(clean.completed)
      ? clean.completed.filter(x => typeof x === 'string' && merged[x])
      : [];
    clean.failed = Array.isArray(clean.failed)
      ? clean.failed.filter(x => typeof x === 'string' && merged[x])
      : [];

    // activeContractId trebuie sa existe si sa aiba status ACCEPTED sau ACTIVE
    if (clean.activeContractId) {
      const c = merged[clean.activeContractId];
      if (!c || (c.status !== CONTRACT_STATUS.ACCEPTED && c.status !== CONTRACT_STATUS.ACTIVE)) {
        clean.activeContractId = null;
      } else {
        // Restore deadline din startedAt+timeLimit daca era ACTIVE
        if (c.status === CONTRACT_STATUS.ACTIVE && c.startedAt > 0 && c.timeLimit > 0) {
          c.deadline = c.startedAt + c.timeLimit * 1000;
        }
      }
    }

    return clean;
  }

  return {
    get state() { return state; },

    set(patch) {
      const changed = [];
      for (const k in patch) {
        if (state[k] !== patch[k]) {
          state[k] = patch[k];
          changed.push(k);
        }
      }
      if (changed.length) notify(changed);
    },

    // Actualizeaza campuri intr-un contract si notifica 'contracts'
    updateContract(id, patch) {
      const c = state.contracts[id];
      if (!c) return false;
      const updated = { ...c, ...patch };
      state.contracts = { ...state.contracts, [id]: updated };
      notify(['contracts']);
      return true;
    },

    setActive(id) {
      state.activeContractId = id;
      notify(['activeContractId']);
    },

    addToCompleted(id) {
      if (!state.completed.includes(id)) {
        state.completed = [...state.completed, id];
        notify(['completed']);
      }
    },

    addToFailed(id) {
      if (!state.failed.includes(id)) {
        state.failed = [...state.failed, id];
        notify(['failed']);
      }
    },

    // Helpers
    getActive() {
      return state.activeContractId ? state.contracts[state.activeContractId] : null;
    },
    getContract(id) {
      return state.contracts[id] || null;
    },
    // Returneaza lista de contracte cu status specific (sau toate)
    listByStatus(status) {
      const out = [];
      for (const id in state.contracts) {
        const c = state.contracts[id];
        if (!status || c.status === status) out.push(c);
      }
      return out;
    },
    // Contracte disponibile pentru player (dupa unlockLevel + tool required)
    getAvailable(playerState) {
      const level = playerState.level || 1;
      const owned = playerState.owned || [];
      return this.listByStatus(CONTRACT_STATUS.AVAILABLE).filter(c => {
        if (c.unlockLevel > level) return false;
        if (c.requiredTool && !owned.includes(c.requiredTool)) return false;
        return true;
      });
    },
    // Contracte blocate (level insuficient)
    getLocked(playerState) {
      const level = playerState.level || 1;
      const owned = playerState.owned || [];
      const out = [];
      for (const id in state.contracts) {
        const c = state.contracts[id];
        if (c.status !== CONTRACT_STATUS.AVAILABLE) continue;
        if (c.unlockLevel > level) { out.push(c); continue; }
        if (c.requiredTool && !owned.includes(c.requiredTool)) { out.push(c); continue; }
      }
      return out;
    },

    on(cb) { anyListeners.add(cb); return () => anyListeners.delete(cb); },
    onKey(key, cb) {
      if (!keyListeners.has(key)) keyListeners.set(key, new Set());
      keyListeners.get(key).add(cb);
      return () => keyListeners.get(key).delete(cb);
    },

    serialize() {
      return {
        activeContractId: state.activeContractId,
        contracts: JSON.parse(JSON.stringify(state.contracts)),
        completed: [...state.completed],
        failed: [...state.failed]
      };
    },

    hydrate(data) {
      if (!data || typeof data !== 'object') return false;
      const clean = sanitize(data);
      state.activeContractId = clean.activeContractId;
      state.contracts = clean.contracts;
      state.completed = clean.completed;
      state.failed = clean.failed;
      notify(['activeContractId', 'contracts', 'completed', 'failed']);
      return true;
    },

    reset() {
      populateFromTemplates();
    },

    populateFromTemplates,

    isEmpty() {
      return Object.keys(state.contracts).length === 0;
    }
  };
}
