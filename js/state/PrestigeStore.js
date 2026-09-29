// Etapa 15 — PrestigeStore
// Single source of truth pentru Prestige + endgame progression.
// Persist separat la snow-game:prestige-v1.

import {
  PRESTIGE_MAX, PRESTIGE_RANKS, getPrestigeRank,
  prestigePermanentBonuses, prestigeRequirements
} from '../config/prestige.js';
import { ENDGAME_MILESTONES, ENDGAME_UNLOCK_PLAYER_LEVEL } from '../config/endgame.js';

const DEFAULT_LIFETIME = {
  totalPrestigesEver: 0,
  totalSnowCleared: 0,
  totalContractsCompleted: 0,
  totalExtremeCompleted: 0,
  totalCoinsEarned: 0,
  totalXpEarned: 0,
  highestPlayerLevel: 1,
  highestCompanyLevel: 1,
  highestReputation: 0
};

const DEFAULTS = {
  currentPrestige: 0,
  highestPrestige: 0,
  totalPrestiges: 0,
  lastPrestigeAt: null,
  history: [],
  extremeContractsCompleted: 0,
  endgameMilestonesCompleted: [],
  endgameContractsAvailable: false,
  lifetime: { ...DEFAULT_LIFETIME }
};

const MILESTONE_IDS = new Set(ENDGAME_MILESTONES.map(m => m.id));

export function createPrestigeStore() {
  const state = {
    ...DEFAULTS,
    history: [],
    endgameMilestonesCompleted: [],
    lifetime: { ...DEFAULT_LIFETIME }
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

    // currentPrestige clamp 0..PRESTIGE_MAX
    let cur = Math.floor(Number(clean.currentPrestige) || 0);
    if (!Number.isFinite(cur) || cur < 0) cur = 0;
    if (cur > PRESTIGE_MAX) cur = PRESTIGE_MAX;
    clean.currentPrestige = cur;

    // highestPrestige >= currentPrestige
    let high = Math.floor(Number(clean.highestPrestige) || 0);
    if (!Number.isFinite(high) || high < 0) high = 0;
    if (high > PRESTIGE_MAX) high = PRESTIGE_MAX;
    if (high < cur) high = cur;
    clean.highestPrestige = high;

    // totalPrestiges >= 0
    let tot = Math.floor(Number(clean.totalPrestiges) || 0);
    if (!Number.isFinite(tot) || tot < 0) tot = 0;
    clean.totalPrestiges = tot;

    // lastPrestigeAt (nullable timestamp)
    if (clean.lastPrestigeAt !== null && clean.lastPrestigeAt !== undefined) {
      const t = Number(clean.lastPrestigeAt);
      clean.lastPrestigeAt = (Number.isFinite(t) && t > 0) ? t : null;
    } else {
      clean.lastPrestigeAt = null;
    }

    // history — array of {prestigeRank, timestamp, resetSnapshot, appliedBonuses}
    clean.history = Array.isArray(clean.history)
      ? clean.history.filter(h => h && typeof h === 'object' && Number.isFinite(h.prestigeRank))
        .map(h => ({
          prestigeRank: Math.max(0, Math.min(PRESTIGE_MAX, Math.floor(h.prestigeRank))),
          timestamp: Number(h.timestamp) || Date.now(),
          resetSnapshot: h.resetSnapshot && typeof h.resetSnapshot === 'object' ? h.resetSnapshot : {},
          appliedBonuses: h.appliedBonuses && typeof h.appliedBonuses === 'object' ? h.appliedBonuses : {}
        }))
      : [];

    // extremeContractsCompleted >= 0
    const ec = Math.floor(Number(clean.extremeContractsCompleted) || 0);
    clean.extremeContractsCompleted = Number.isFinite(ec) && ec >= 0 ? ec : 0;

    // endgameMilestonesCompleted — dedupe & only known milestone ids
    clean.endgameMilestonesCompleted = Array.isArray(clean.endgameMilestonesCompleted)
      ? [...new Set(clean.endgameMilestonesCompleted.filter(id => typeof id === 'string' && MILESTONE_IDS.has(id)))]
      : [];

    clean.endgameContractsAvailable = !!clean.endgameContractsAvailable;

    // lifetime — merge + clamp
    const lif = { ...DEFAULT_LIFETIME, ...(clean.lifetime || {}) };
    for (const k in DEFAULT_LIFETIME) {
      const n = Number(lif[k]);
      lif[k] = (Number.isFinite(n) && n >= 0) ? n : 0;
    }
    if (lif.highestPlayerLevel < 1) lif.highestPlayerLevel = 1;
    if (lif.highestCompanyLevel < 1) lif.highestCompanyLevel = 1;
    clean.lifetime = lif;

    return clean;
  }

  return {
    get state() { return state; },

    // ---- Helpers (read-only computed) ----
    getCurrentRank() {
      return getPrestigeRank(state.currentPrestige);
    },
    getNextRank() {
      if (state.currentPrestige >= PRESTIGE_MAX) return null;
      return getPrestigeRank(state.currentPrestige + 1);
    },
    getPermanentBonuses() {
      return prestigePermanentBonuses(state.currentPrestige);
    },
    getRequirements() {
      if (state.currentPrestige >= PRESTIGE_MAX) return null;
      return prestigeRequirements(state.currentPrestige + 1);
    },
    isEndgameUnlocked() {
      return !!state.endgameContractsAvailable;
    },
    isAtMax() {
      return state.currentPrestige >= PRESTIGE_MAX;
    },

    // ---- Mutators ----
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

    // Bulk lifetime update — merge + clamp
    updateLifetime(patch) {
      if (!patch || typeof patch !== 'object') return;
      const lif = { ...state.lifetime };
      let changed = false;
      for (const k in patch) {
        if (!(k in DEFAULT_LIFETIME)) continue;
        const v = Number(patch[k]);
        if (!Number.isFinite(v)) continue;
        if (k === 'highestPlayerLevel' || k === 'highestCompanyLevel' || k === 'highestReputation') {
          if (v > (lif[k] || 0)) { lif[k] = v; changed = true; }
        } else {
          const newVal = Math.max(0, v);
          if (newVal !== lif[k]) { lif[k] = newVal; changed = true; }
        }
      }
      if (changed) {
        state.lifetime = lif;
        notify(['lifetime']);
      }
    },

    incLifetime(key, delta) {
      if (!(key in DEFAULT_LIFETIME)) return;
      const cur = Number(state.lifetime[key]) || 0;
      const next = { ...state.lifetime, [key]: cur + (Number(delta) || 0) };
      state.lifetime = next;
      notify(['lifetime']);
    },

    // Adaugă entry în istoric (append)
    pushHistory(entry) {
      if (!entry || typeof entry !== 'object') return;
      const clean = {
        prestigeRank: Math.max(0, Math.min(PRESTIGE_MAX, Math.floor(entry.prestigeRank || 0))),
        timestamp: Number(entry.timestamp) || Date.now(),
        resetSnapshot: entry.resetSnapshot && typeof entry.resetSnapshot === 'object' ? entry.resetSnapshot : {},
        appliedBonuses: entry.appliedBonuses && typeof entry.appliedBonuses === 'object' ? entry.appliedBonuses : {}
      };
      state.history = [...state.history, clean];
      notify(['history']);
    },

    // Marchează milestone endgame ca atins (idempotent)
    addMilestone(milestoneId) {
      if (typeof milestoneId !== 'string' || !MILESTONE_IDS.has(milestoneId)) return false;
      if (state.endgameMilestonesCompleted.includes(milestoneId)) return false;
      state.endgameMilestonesCompleted = [...state.endgameMilestonesCompleted, milestoneId];
      notify(['endgameMilestonesCompleted']);
      return true;
    },

    on(cb) { anyListeners.add(cb); return () => anyListeners.delete(cb); },
    onKey(key, cb) {
      if (!keyListeners.has(key)) keyListeners.set(key, new Set());
      keyListeners.get(key).add(cb);
      return () => keyListeners.get(key).delete(cb);
    },

    serialize() {
      return {
        currentPrestige: state.currentPrestige,
        highestPrestige: state.highestPrestige,
        totalPrestiges: state.totalPrestiges,
        lastPrestigeAt: state.lastPrestigeAt,
        history: state.history.map(h => ({
          prestigeRank: h.prestigeRank,
          timestamp: h.timestamp,
          resetSnapshot: { ...h.resetSnapshot },
          appliedBonuses: { ...h.appliedBonuses }
        })),
        extremeContractsCompleted: state.extremeContractsCompleted,
        endgameMilestonesCompleted: [...state.endgameMilestonesCompleted],
        endgameContractsAvailable: state.endgameContractsAvailable,
        lifetime: { ...state.lifetime }
      };
    },
    hydrate(data) {
      if (!data || typeof data !== 'object') return false;
      const clean = sanitize(data);
      Object.assign(state, clean);
      state.history = [...clean.history];
      state.endgameMilestonesCompleted = [...clean.endgameMilestonesCompleted];
      state.lifetime = { ...clean.lifetime };
      notify(Object.keys(state));
      return true;
    },
    reset() {
      Object.assign(state, {
        ...DEFAULTS,
        history: [],
        endgameMilestonesCompleted: [],
        lifetime: { ...DEFAULT_LIFETIME }
      });
      notify(Object.keys(state));
    }
  };
}

export const PRESTIGE_UNLOCK_PLAYER_LEVEL = ENDGAME_UNLOCK_PLAYER_LEVEL;
