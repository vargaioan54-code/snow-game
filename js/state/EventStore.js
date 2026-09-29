// EventStore — state pentru events + seasons.
// Persist: snow-game:events-v1

import { EVENTS, EVENT_BY_ID, SEASONS, SEASON_BY_ID, EVENT_STATUS, SEASON_STATUS } from '../config/events.js';

const VALID_EVENT_STATUS = new Set(Object.values(EVENT_STATUS));
const VALID_SEASON_STATUS = new Set(Object.values(SEASON_STATUS));
const MAX_HISTORY = 30;

function makeEventDefault() {
  return {
    status: EVENT_STATUS.UPCOMING,
    progress: {},
    objectivesCompleted: {},
    startedAt: null,
    expiresAt: null,
    completedAt: null,
    claimedAt: null,
    lastUpdatedAt: null,
    weatherApplied: false // marker single-shot pentru weather modifier
  };
}

function makeSeasonDefault() {
  return {
    status: SEASON_STATUS.UPCOMING,
    startedAt: null,
    endsAt: null,
    endedAt: null,
    rewardClaimedAt: null
  };
}

function defaults() {
  const events = {};
  for (const e of EVENTS) events[e.id] = makeEventDefault();
  const seasons = {};
  for (const s of SEASONS) seasons[s.id] = makeSeasonDefault();
  return {
    events,
    seasons,
    installTime: null,
    history: []
  };
}

export function createEventStore() {
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

  function touch(keys = ['events', 'seasons']) {
    notify(keys);
  }

  function sanitize(data) {
    const clean = { ...defaults(), ...data };

    // Events: merge cu defaults, drop invalid IDs
    const cleanEvents = {};
    for (const def of EVENTS) {
      const saved = clean.events?.[def.id];
      if (saved && typeof saved === 'object') {
        const validObjIds = new Set(def.objectives.map(o => o.id));
        const cleanProgress = {};
        const cleanCompleted = {};
        if (saved.progress && typeof saved.progress === 'object') {
          for (const [oid, v] of Object.entries(saved.progress)) {
            if (validObjIds.has(oid)) cleanProgress[oid] = Math.max(0, Number(v) || 0);
          }
        }
        if (saved.objectivesCompleted && typeof saved.objectivesCompleted === 'object') {
          for (const [oid, v] of Object.entries(saved.objectivesCompleted)) {
            if (validObjIds.has(oid)) cleanCompleted[oid] = !!v;
          }
        }
        cleanEvents[def.id] = {
          status: VALID_EVENT_STATUS.has(saved.status) ? saved.status : EVENT_STATUS.UPCOMING,
          progress: cleanProgress,
          objectivesCompleted: cleanCompleted,
          startedAt: Number(saved.startedAt) || null,
          expiresAt: Number(saved.expiresAt) || null,
          completedAt: Number(saved.completedAt) || null,
          claimedAt: Number(saved.claimedAt) || null,
          lastUpdatedAt: Number(saved.lastUpdatedAt) || null,
          weatherApplied: !!saved.weatherApplied
        };
      } else {
        cleanEvents[def.id] = makeEventDefault();
      }
    }
    clean.events = cleanEvents;

    // Seasons: merge cu defaults
    const cleanSeasons = {};
    for (const def of SEASONS) {
      const saved = clean.seasons?.[def.id];
      cleanSeasons[def.id] = saved && typeof saved === 'object'
        ? {
            status: VALID_SEASON_STATUS.has(saved.status) ? saved.status : SEASON_STATUS.UPCOMING,
            startedAt: Number(saved.startedAt) || null,
            endsAt: Number(saved.endsAt) || null,
            endedAt: Number(saved.endedAt) || null,
            rewardClaimedAt: Number(saved.rewardClaimedAt) || null
          }
        : makeSeasonDefault();
    }
    clean.seasons = cleanSeasons;

    // installTime: numeric or null
    const it = Number(clean.installTime);
    clean.installTime = (Number.isFinite(it) && it > 0) ? it : null;

    // History: array of eventIds (valid only)
    clean.history = Array.isArray(clean.history)
      ? clean.history.filter(id => typeof id === 'string' && EVENT_BY_ID[id]).slice(-MAX_HISTORY)
      : [];

    return clean;
  }

  return {
    get state() { return state; },
    set,
    touch,

    on(cb) { anyListeners.add(cb); return () => anyListeners.delete(cb); },
    onKey(key, cb) {
      if (!keyListeners.has(key)) keyListeners.set(key, new Set());
      keyListeners.get(key).add(cb);
      return () => keyListeners.get(key).delete(cb);
    },

    getEvent(id) { return state.events[id]; },
    getSeasonState(id) { return state.seasons[id]; },
    getActive() {
      const out = [];
      for (const [id, ev] of Object.entries(state.events)) {
        if (ev.status === EVENT_STATUS.ACTIVE) out.push([id, ev]);
      }
      return out;
    },
    getUpcoming() {
      const out = [];
      for (const [id, ev] of Object.entries(state.events)) {
        if (ev.status === EVENT_STATUS.UPCOMING) out.push([id, ev]);
      }
      return out;
    },
    getExpired() {
      const out = [];
      for (const [id, ev] of Object.entries(state.events)) {
        if (ev.status === EVENT_STATUS.EXPIRED) out.push([id, ev]);
      }
      return out;
    },
    getCompleted() {
      const out = [];
      for (const [id, ev] of Object.entries(state.events)) {
        if (ev.status === EVENT_STATUS.COMPLETED) out.push([id, ev]);
      }
      return out;
    },
    getLocked() {
      const out = [];
      for (const [id, ev] of Object.entries(state.events)) {
        if (ev.status === EVENT_STATUS.LOCKED) out.push([id, ev]);
      }
      return out;
    },
    isEventClaimed(id) {
      return !!state.events[id]?.claimedAt;
    },
    countClaimable() {
      let n = 0;
      for (const ev of Object.values(state.events)) {
        if (ev.status === EVENT_STATUS.COMPLETED && !ev.claimedAt) n++;
      }
      return n;
    },
    countActive() {
      let n = 0;
      for (const ev of Object.values(state.events)) {
        if (ev.status === EVENT_STATUS.ACTIVE) n++;
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
