// Etapa 8 — CompanyStore
// Single source of truth pentru starea companiei.
// Persist separat la cheia snow-game:company-v1.
// Reputation NU-i aici — este în PlayerStore.reputation (alias). Company doar citește/modifică prin PlayerStore.

import { COMPANY_LEVELS, COMPANY_MAX_LEVEL, COMPANY_UPGRADES, COMPANY_UPGRADE_IDS } from '../config/company.js';

function uuidv4() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const DEFAULT_STATS = {
  completedContracts: 0,
  failedContracts: 0,
  cancelledContracts: 0,
  totalSnowCleared: 0,
  averageRating: 0,
  ratingSum: 0,
  ratingCount: 0,
  bestContractReward: 0,
  largestContractCoins: 0,
  currentStreak: 0,
  bestStreak: 0,
  contractsByType: { house: 0, driveway: 0, parking: 0, shop: 0, warehouse: 0 }
};

function defaultUpgrades() {
  const u = {};
  for (const id of COMPANY_UPGRADE_IDS) u[id] = 0;
  return u;
}

const DEFAULTS = {
  companyId: null,
  companyName: '',
  foundedAt: null,
  level: 1,
  xp: 0,
  totalXpEarned: 0,
  funds: 0,
  totalRevenue: 0,
  totalExpenses: 0,
  stats: { ...DEFAULT_STATS, contractsByType: { ...DEFAULT_STATS.contractsByType } },
  upgrades: defaultUpgrades(),
  unlockedTiers: ['tier_1'],
  unlockedContractIds: []
};

export function createCompanyStore() {
  const state = {
    ...DEFAULTS,
    stats: { ...DEFAULTS.stats, contractsByType: { ...DEFAULTS.stats.contractsByType } },
    upgrades: defaultUpgrades(),
    unlockedTiers: [...DEFAULTS.unlockedTiers],
    unlockedContractIds: []
  };

  const anyListeners = new Set();
  const keyListeners = new Map();

  function notify(changed) {
    for (const l of anyListeners) l(state, changed);
    for (const k of changed) {
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
    return false;
  }

  function sanitize(data) {
    const clean = { ...DEFAULTS, ...data };
    clean.stats = { ...DEFAULT_STATS, ...(clean.stats || {}) };
    clean.stats.contractsByType = { ...DEFAULT_STATS.contractsByType, ...((clean.stats && clean.stats.contractsByType) || {}) };

    // Identity
    if (typeof clean.companyName !== 'string') clean.companyName = '';
    clean.companyName = clean.companyName.slice(0, 30);
    if (clean.companyId && typeof clean.companyId !== 'string') clean.companyId = null;
    if (clean.foundedAt !== null) {
      const f = Number(clean.foundedAt);
      clean.foundedAt = (Number.isFinite(f) && f > 0) ? f : null;
    }

    // Level & XP
    let lvl = Math.floor(Number(clean.level) || 1);
    if (lvl < 1) lvl = 1;
    if (lvl > COMPANY_MAX_LEVEL) lvl = COMPANY_MAX_LEVEL;
    clean.level = lvl;

    ['xp', 'totalXpEarned', 'funds', 'totalRevenue', 'totalExpenses'].forEach(k => {
      const n = Number(clean[k]);
      clean[k] = (Number.isFinite(n) && n >= 0) ? n : 0;
    });

    // Stats clamp
    for (const k in DEFAULT_STATS) {
      if (k === 'contractsByType') continue;
      const n = Number(clean.stats[k]);
      clean.stats[k] = (Number.isFinite(n) && n >= 0) ? n : 0;
    }
    for (const t in DEFAULT_STATS.contractsByType) {
      const n = Number(clean.stats.contractsByType[t]);
      clean.stats.contractsByType[t] = (Number.isFinite(n) && n >= 0) ? Math.floor(n) : 0;
    }

    // Upgrades
    const ups = defaultUpgrades();
    if (clean.upgrades && typeof clean.upgrades === 'object') {
      for (const id of COMPANY_UPGRADE_IDS) {
        const raw = Number(clean.upgrades[id]);
        const max = COMPANY_UPGRADES[id].maxLevel;
        if (Number.isFinite(raw) && raw >= 0 && raw <= max) ups[id] = Math.floor(raw);
      }
    }
    clean.upgrades = ups;

    // Unlocks
    clean.unlockedTiers = Array.isArray(clean.unlockedTiers)
      ? [...new Set(clean.unlockedTiers.filter(x => typeof x === 'string'))]
      : ['tier_1'];
    if (!clean.unlockedTiers.includes('tier_1')) clean.unlockedTiers.unshift('tier_1');

    clean.unlockedContractIds = Array.isArray(clean.unlockedContractIds)
      ? [...new Set(clean.unlockedContractIds.filter(x => typeof x === 'string'))]
      : [];

    // Consistency
    if (clean.ratingCount > 0) {
      clean.stats.averageRating = clean.stats.ratingSum / clean.stats.ratingCount;
    }

    return clean;
  }

  return {
    get state() { return state; },

    isCreated() {
      return !!state.companyName && !!state.companyId;
    },

    getLevelInfo() {
      return COMPANY_LEVELS[state.level - 1] || COMPANY_LEVELS[0];
    },
    getNextLevelInfo() {
      if (state.level >= COMPANY_MAX_LEVEL) return null;
      return COMPANY_LEVELS[state.level] || null;
    },
    getProgress01() {
      const info = COMPANY_LEVELS[state.level - 1];
      if (!info || info.xpToNext === 0) return 1;
      return Math.max(0, Math.min(1, state.xp / info.xpToNext));
    },
    getUpgradeEffect(upgradeId) {
      const cfg = COMPANY_UPGRADES[upgradeId];
      if (!cfg) return null;
      const lvl = state.upgrades[upgradeId] || 0;
      return cfg.effect[lvl];
    },
    isTierUnlocked(tierId) {
      return state.unlockedTiers.includes(tierId);
    },
    computeAverageRating() {
      if (state.stats.ratingCount === 0) return 0;
      return state.stats.ratingSum / state.stats.ratingCount;
    },

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

    incStat(key, delta) {
      if (!(key in DEFAULT_STATS)) return;
      const nv = { ...state.stats, [key]: (state.stats[key] || 0) + delta };
      state.stats = nv;
      notify(['stats']);
    },
    incContractType(type, delta = 1) {
      const bt = { ...state.stats.contractsByType };
      if (!(type in bt)) return;
      bt[type] = (bt[type] || 0) + delta;
      state.stats = { ...state.stats, contractsByType: bt };
      notify(['stats']);
    },
    addRating(rating) {
      const s = { ...state.stats };
      s.ratingSum = (s.ratingSum || 0) + rating;
      s.ratingCount = (s.ratingCount || 0) + 1;
      s.averageRating = s.ratingSum / s.ratingCount;
      state.stats = s;
      notify(['stats']);
    },
    setUpgrade(id, level) {
      if (!COMPANY_UPGRADES[id]) return;
      const max = COMPANY_UPGRADES[id].maxLevel;
      const l = Math.max(0, Math.min(max, Math.floor(level)));
      const nv = { ...state.upgrades, [id]: l };
      state.upgrades = nv;
      notify(['upgrades']);
    },
    addTierUnlock(tierId) {
      if (state.unlockedTiers.includes(tierId)) return false;
      state.unlockedTiers = [...state.unlockedTiers, tierId];
      notify(['unlockedTiers']);
      return true;
    },

    on(cb) { anyListeners.add(cb); return () => anyListeners.delete(cb); },
    onKey(k, cb) {
      if (!keyListeners.has(k)) keyListeners.set(k, new Set());
      keyListeners.get(k).add(cb);
      return () => keyListeners.get(k).delete(cb);
    },

    serialize() {
      return {
        companyId: state.companyId,
        companyName: state.companyName,
        foundedAt: state.foundedAt,
        level: state.level,
        xp: state.xp,
        totalXpEarned: state.totalXpEarned,
        funds: state.funds,
        totalRevenue: state.totalRevenue,
        totalExpenses: state.totalExpenses,
        stats: {
          ...state.stats,
          contractsByType: { ...state.stats.contractsByType }
        },
        upgrades: { ...state.upgrades },
        unlockedTiers: [...state.unlockedTiers],
        unlockedContractIds: [...state.unlockedContractIds]
      };
    },
    hydrate(data) {
      if (!data || typeof data !== 'object') return false;
      const clean = sanitize(data);
      Object.assign(state, clean);
      notify(Object.keys(state));
      return true;
    },
    reset() {
      const fresh = {
        ...DEFAULTS,
        stats: { ...DEFAULTS.stats, contractsByType: { ...DEFAULTS.stats.contractsByType } },
        upgrades: defaultUpgrades(),
        unlockedTiers: [...DEFAULTS.unlockedTiers],
        unlockedContractIds: []
      };
      Object.assign(state, fresh);
      notify(Object.keys(state));
    },

    _uuid: uuidv4  // exposed pentru CompanySystem.createCompany
  };
}
