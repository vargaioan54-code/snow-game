// Sursa unica de adevar pentru starea jucatorului.
// Reactiv: subscribe cu store.on(cb) sau store.onKey('key', cb).
// Modifica DOAR prin store.set({...}) — orice mutatie directa NU declanseaza save/UI.

import { BAG_TIERS } from '../config/bagTiers.js';

// Generator simplu UUID v4 (fara dep externa)
function uuidv4() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// snowByType cumulativ cross-session — chei = SNOW_TYPES id-uri (fresh, packed, ...)
const DEFAULT_SNOW_BY_TYPE = {
  fresh: 0, packed: 0, deep: 0, frozen: 0, ice: 0, slush: 0, black_ice: 0, blizzard: 0
};

const DEFAULT_STATS = {
  totalSnowCleared: 0,
  totalCoinsEarned: 0,
  totalDiamondsEarned: 0,
  totalXpEarned: 0,
  sessionsStarted: 0,
  totalPlayTimeSec: 0,
  jobsCompleted: 0,
  contractsCompleted: 0,
  totalToolUpgrades: 0,
  snowByType: { ...DEFAULT_SNOW_BY_TYPE }
};

// toolUpgrades default = pentru fiecare tool: power/speed/capacity = 0
function defaultToolUpgrades() {
  const t = {};
  for (const id of ['shovel', 'pusher', 'broom', 'blower', 'heat']) {
    t[id] = { power: 0, speed: 0, capacity: 0 };
  }
  return t;
}

const DEFAULTS = {
  // Identity
  id: null,
  name: 'Player',
  createdAt: 0,
  lastPlayedAt: 0,

  // Economy
  bagCoins: 0,
  vaultCoins: 0,
  bagLevel: 0,
  diamonds: 0,
  reputation: 0,

  // Progression
  xp: 0,
  level: 1,

  // Inventory
  owned: ['shovel'],
  currentToolId: 'shovel',
  unlocks: [],
  toolUpgrades: defaultToolUpgrades(),

  // Progress runtime
  progress: 0,

  // Statistics
  stats: { ...DEFAULT_STATS, snowByType: { ...DEFAULT_SNOW_BY_TYPE } }
};

export function createPlayerStore() {
  const state = {
    ...DEFAULTS,
    owned: [...DEFAULTS.owned],
    unlocks: [...DEFAULTS.unlocks],
    toolUpgrades: defaultToolUpgrades(),
    stats: { ...DEFAULT_STATS, snowByType: { ...DEFAULT_SNOW_BY_TYPE } },
    id: uuidv4(),
    createdAt: Date.now(),
    lastPlayedAt: Date.now()
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

  function shallowEqual(a, b) {
    if (a === b) return true;
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
      return true;
    }
    if (a && b && typeof a === 'object' && typeof b === 'object') {
      const ka = Object.keys(a), kb = Object.keys(b);
      if (ka.length !== kb.length) return false;
      for (const k of ka) if (a[k] !== b[k]) return false;
      return true;
    }
    return false;
  }

  // Sanitizeaza + valideaza date la hydrate (fallback controlat pt corupte/partiale)
  function sanitize(data) {
    const clean = { ...DEFAULTS, ...data };

    if (!clean.id || typeof clean.id !== 'string') clean.id = uuidv4();
    if (typeof clean.name !== 'string' || !clean.name.trim()) clean.name = 'Player';
    if (typeof clean.createdAt !== 'number' || clean.createdAt <= 0) clean.createdAt = Date.now();
    clean.lastPlayedAt = Date.now();

    ['bagCoins','vaultCoins','diamonds','reputation','xp','progress'].forEach(k => {
      const n = Number(clean[k]);
      clean[k] = Number.isFinite(n) && n >= 0 ? n : 0;
    });

    const lvl = Number(clean.level);
    clean.level = Number.isFinite(lvl) && lvl >= 1 ? Math.floor(lvl) : 1;

    const bl = Number(clean.bagLevel);
    clean.bagLevel = Number.isFinite(bl) && bl >= 0 && bl < BAG_TIERS.length ? Math.floor(bl) : 0;

    clean.owned = Array.isArray(clean.owned) ? [...new Set(clean.owned.filter(x => typeof x === 'string'))] : [];
    if (!clean.owned.includes('shovel')) clean.owned.unshift('shovel');

    if (typeof clean.currentToolId !== 'string' || !clean.owned.includes(clean.currentToolId)) {
      clean.currentToolId = 'shovel';
    }

    clean.unlocks = Array.isArray(clean.unlocks) ? [...new Set(clean.unlocks.filter(x => typeof x === 'string'))] : [];

    // toolUpgrades merge cu default; clamp 0..5 per stat
    const upgFallback = defaultToolUpgrades();
    const upgSrc = (clean.toolUpgrades && typeof clean.toolUpgrades === 'object') ? clean.toolUpgrades : {};
    const upgClean = {};
    for (const toolId in upgFallback) {
      const src = upgSrc[toolId] || {};
      upgClean[toolId] = {
        power: Math.max(0, Math.min(5, Math.floor(Number(src.power) || 0))),
        speed: Math.max(0, Math.min(5, Math.floor(Number(src.speed) || 0))),
        capacity: Math.max(0, Math.min(5, Math.floor(Number(src.capacity) || 0)))
      };
    }
    clean.toolUpgrades = upgClean;

    // Stats — merge cu defaults, clamp la >= 0
    const statsIncoming = clean.stats || {};
    const cleanStats = { ...DEFAULT_STATS, ...statsIncoming };
    // snowByType merge separat (nested)
    cleanStats.snowByType = { ...DEFAULT_SNOW_BY_TYPE, ...(statsIncoming.snowByType || {}) };
    for (const k in DEFAULT_STATS) {
      if (k === 'snowByType') continue;
      const n = Number(cleanStats[k]);
      cleanStats[k] = Number.isFinite(n) && n >= 0 ? n : 0;
    }
    for (const t in DEFAULT_SNOW_BY_TYPE) {
      const n = Number(cleanStats.snowByType[t]);
      cleanStats.snowByType[t] = Number.isFinite(n) && n >= 0 ? n : 0;
    }
    clean.stats = cleanStats;

    return clean;
  }

  return {
    get state() { return state; },
    get bagCap() { return BAG_TIERS[state.bagLevel].cap; },
    get totalCoins() { return state.bagCoins + state.vaultCoins; },

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

    // Merge partial in `stats` (evita rescrierea intregului obiect din exterior)
    incStat(key, delta) {
      if (!(key in DEFAULT_STATS)) return;
      if (key === 'snowByType') return; // folositi incSnowByType
      const newStats = { ...state.stats, [key]: (state.stats[key] || 0) + delta };
      state.stats = newStats;
      notify(['stats']);
    },

    // Incrementeaza contorul snowByType[typeId]
    incSnowByType(typeId, delta) {
      if (!(typeId in DEFAULT_SNOW_BY_TYPE)) return;
      const cur = (state.stats.snowByType && state.stats.snowByType[typeId]) || 0;
      const newSbt = { ...state.stats.snowByType, [typeId]: cur + delta };
      state.stats = { ...state.stats, snowByType: newSbt };
      notify(['stats']);
    },

    // Adauga 1 nivel la un upgrade (nu verifica pretul — Economy face asta)
    incUpgrade(toolId, statName) {
      const cur = state.toolUpgrades[toolId];
      if (!cur) return false;
      if (cur[statName] === undefined) return false;
      if (cur[statName] >= 5) return false;
      const newTool = { ...cur, [statName]: cur[statName] + 1 };
      const newUpg = { ...state.toolUpgrades, [toolId]: newTool };
      state.toolUpgrades = newUpg;
      notify(['toolUpgrades']);
      return true;
    },

    on(cb) { anyListeners.add(cb); return () => anyListeners.delete(cb); },
    onKey(key, cb) {
      if (!keyListeners.has(key)) keyListeners.set(key, new Set());
      keyListeners.get(key).add(cb);
      return () => keyListeners.get(key).delete(cb);
    },

    serialize() {
      state.lastPlayedAt = Date.now();
      return {
        ...state,
        owned: [...state.owned],
        unlocks: [...state.unlocks],
        toolUpgrades: JSON.parse(JSON.stringify(state.toolUpgrades)),
        stats: {
          ...state.stats,
          snowByType: { ...state.stats.snowByType }
        }
      };
    },

    hydrate(data) {
      if (!data || typeof data !== 'object') return false;
      const clean = sanitize(data);
      Object.assign(state, clean);
      state.owned = [...clean.owned];
      state.unlocks = [...clean.unlocks];
      state.toolUpgrades = JSON.parse(JSON.stringify(clean.toolUpgrades));
      state.stats = { ...clean.stats, snowByType: { ...clean.stats.snowByType } };
      notify(Object.keys(state));
      return true;
    },

    reset() {
      const fresh = {
        ...DEFAULTS,
        owned: [...DEFAULTS.owned],
        unlocks: [...DEFAULTS.unlocks],
        toolUpgrades: defaultToolUpgrades(),
        stats: { ...DEFAULT_STATS, snowByType: { ...DEFAULT_SNOW_BY_TYPE } },
        id: uuidv4(),
        createdAt: Date.now(),
        lastPlayedAt: Date.now()
      };
      Object.assign(state, fresh);
      state.owned = [...fresh.owned];
      state.unlocks = [...fresh.unlocks];
      state.toolUpgrades = JSON.parse(JSON.stringify(fresh.toolUpgrades));
      state.stats = { ...fresh.stats, snowByType: { ...fresh.stats.snowByType } };
      notify(Object.keys(state));
    }
  };
}
