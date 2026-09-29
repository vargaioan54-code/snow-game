// MissionStore — state pentru daily/weekly/permanent missions + achievements.
// Persist: snow-game:missions-v1

import { PERMANENT_MISSIONS, DAILY_BY_ID, WEEKLY_BY_ID, PERMANENT_BY_ID } from '../config/missions.js';
import { ACHIEVEMENTS, ACHIEVEMENT_BY_ID } from '../config/achievements.js';

const VALID_STATUS = new Set(['IN_PROGRESS', 'COMPLETED', 'CLAIMED', 'EXPIRED']);

function defaults() {
  const permanent = {};
  for (const m of PERMANENT_MISSIONS) {
    permanent[m.id] = { defId: m.id, currentValue: 0, status: 'IN_PROGRESS', completedAt: null, claimedAt: null };
  }
  const achievements = {};
  for (const a of ACHIEVEMENTS) {
    achievements[a.id] = { currentValue: 0, unlocked: false, unlockedAt: null, claimedAt: null };
  }
  return {
    daily: {},
    weekly: {},
    permanent,
    achievements,
    dailyResetAt: null,
    weeklyResetAt: null,
    lastDailyRoll: null,
    lastWeeklyRoll: null,
    totalClaimsCoins: 0,
    totalClaimsXP: 0,
    totalAchievementsUnlocked: 0
  };
}

export function createMissionStore() {
  const state = defaults();
  const anyListeners = new Set();
  const keyListeners = new Map();

  function notify(changedKeys) {
    for (const l of anyListeners) l(state, changedKeys);
    for (const k of changedKeys) {
      const set = keyListeners.get(k);
      if (set) for (const l of set) l(state[k], state);
    }
  }

  function set(patch) {
    const changed = [];
    for (const k in patch) {
      if (state[k] !== patch[k]) {
        state[k] = patch[k];
        changed.push(k);
      }
    }
    if (changed.length) notify(changed);
  }

  function sanitize(data) {
    const clean = { ...defaults(), ...data };
    // daily/weekly: doar cei cu defId valid
    const cleanDaily = {};
    if (clean.daily && typeof clean.daily === 'object') {
      for (const [id, m] of Object.entries(clean.daily)) {
        if (!m || !DAILY_BY_ID[m.defId || id]) continue;
        cleanDaily[id] = {
          defId: m.defId || id,
          currentValue: Math.max(0, Number(m.currentValue) || 0),
          status: VALID_STATUS.has(m.status) ? m.status : 'IN_PROGRESS',
          resetAt: Number(m.resetAt) || null,
          completedAt: Number(m.completedAt) || null,
          claimedAt: Number(m.claimedAt) || null
        };
      }
    }
    clean.daily = cleanDaily;

    const cleanWeekly = {};
    if (clean.weekly && typeof clean.weekly === 'object') {
      for (const [id, m] of Object.entries(clean.weekly)) {
        if (!m || !WEEKLY_BY_ID[m.defId || id]) continue;
        cleanWeekly[id] = {
          defId: m.defId || id,
          currentValue: Math.max(0, Number(m.currentValue) || 0),
          status: VALID_STATUS.has(m.status) ? m.status : 'IN_PROGRESS',
          resetAt: Number(m.resetAt) || null,
          completedAt: Number(m.completedAt) || null,
          claimedAt: Number(m.claimedAt) || null
        };
      }
    }
    clean.weekly = cleanWeekly;

    // permanent — merge cu defaults, drop invalid
    const cleanPerm = {};
    for (const def of PERMANENT_MISSIONS) {
      const saved = clean.permanent?.[def.id];
      cleanPerm[def.id] = saved && typeof saved === 'object'
        ? {
            defId: def.id,
            currentValue: Math.max(0, Number(saved.currentValue) || 0),
            status: VALID_STATUS.has(saved.status) ? saved.status : 'IN_PROGRESS',
            completedAt: Number(saved.completedAt) || null,
            claimedAt: Number(saved.claimedAt) || null
          }
        : { defId: def.id, currentValue: 0, status: 'IN_PROGRESS', completedAt: null, claimedAt: null };
    }
    clean.permanent = cleanPerm;

    // achievements — merge cu defaults
    const cleanAch = {};
    for (const def of ACHIEVEMENTS) {
      const saved = clean.achievements?.[def.id];
      cleanAch[def.id] = saved && typeof saved === 'object'
        ? {
            currentValue: Math.max(0, Number(saved.currentValue) || 0),
            unlocked: !!saved.unlocked,
            unlockedAt: Number(saved.unlockedAt) || null,
            claimedAt: Number(saved.claimedAt) || null
          }
        : { currentValue: 0, unlocked: false, unlockedAt: null, claimedAt: null };
    }
    clean.achievements = cleanAch;

    clean.dailyResetAt = Number(clean.dailyResetAt) || null;
    clean.weeklyResetAt = Number(clean.weeklyResetAt) || null;
    clean.lastDailyRoll = Number(clean.lastDailyRoll) || null;
    clean.lastWeeklyRoll = Number(clean.lastWeeklyRoll) || null;
    clean.totalClaimsCoins = Math.max(0, Number(clean.totalClaimsCoins) || 0);
    clean.totalClaimsXP = Math.max(0, Number(clean.totalClaimsXP) || 0);
    clean.totalAchievementsUnlocked = Math.max(0, Number(clean.totalAchievementsUnlocked) || 0);

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

    // Force notify for nested mutations
    touch(keys = ['daily', 'weekly', 'permanent', 'achievements']) {
      notify(keys);
    },

    getDaily() { return Object.entries(state.daily); },
    getWeekly() { return Object.entries(state.weekly); },
    getPermanent() { return Object.entries(state.permanent); },
    getAchievement(id) { return state.achievements[id]; },
    isMissionCompleted(cat, id) {
      const m = state[cat]?.[id];
      return m && (m.status === 'COMPLETED' || m.status === 'CLAIMED');
    },
    needsDailyReset() {
      return !state.dailyResetAt || Date.now() > state.dailyResetAt;
    },
    needsWeeklyReset() {
      return !state.weeklyResetAt || Date.now() > state.weeklyResetAt;
    },
    countCompletedUnclaimed() {
      let n = 0;
      for (const cat of ['daily', 'weekly', 'permanent']) {
        for (const m of Object.values(state[cat])) {
          if (m.status === 'COMPLETED') n++;
        }
      }
      return n;
    },

    serialize() {
      return JSON.parse(JSON.stringify(state));
    },
    hydrate(data) {
      if (!data || typeof data !== 'object') return false;
      const clean = sanitize(data);
      Object.assign(state, clean);
      notify(Object.keys(state));
      return true;
    },
    reset() {
      Object.assign(state, defaults());
      notify(Object.keys(state));
    }
  };
}
