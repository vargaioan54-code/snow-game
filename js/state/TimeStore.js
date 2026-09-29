// ETAPA 5 — TimeStore
// Sursa unica de adevar pentru timpul lumii (day/night).
// Persist separat pe cheia snow-game:time-v1.

import { phaseForHour } from '../config/timeOfDay.js';

const DEFAULTS = {
  hour: 8.0,          // 0..24 (float pentru interpolare fluida)
  dayIndex: 1,
  timeScale: 60,      // 1 sec real = 60 sec in-game -> 24 min real = 24h in-game
  paused: false
};

function fmt2(n) { const s = String(Math.floor(n)); return s.length < 2 ? '0' + s : s; }

export function createTimeStore() {
  const state = { ...DEFAULTS };
  const anyListeners = new Set();
  const keyListeners = new Map();

  function notify(changedKeys) {
    for (const l of anyListeners) l(state, changedKeys);
    for (const k of changedKeys) {
      const set = keyListeners.get(k);
      if (set) for (const l of set) l(state[k], state);
    }
  }

  function sanitize(data) {
    const clean = { ...DEFAULTS, ...(data || {}) };
    const h = Number(clean.hour);
    clean.hour = Number.isFinite(h) ? ((h % 24) + 24) % 24 : 8.0;
    const d = Number(clean.dayIndex);
    clean.dayIndex = Number.isFinite(d) && d >= 1 ? Math.floor(d) : 1;
    const ts = Number(clean.timeScale);
    clean.timeScale = Number.isFinite(ts) && ts > 0 ? Math.max(0.1, Math.min(1000, ts)) : 60;
    clean.paused = !!clean.paused;
    return clean;
  }

  return {
    get state() { return state; },

    getMinuteInHour() {
      const frac = state.hour - Math.floor(state.hour);
      return frac * 60;
    },

    getPhase() { return phaseForHour(state.hour); },

    getFormattedTime() {
      const h = Math.floor(state.hour);
      const m = Math.floor(this.getMinuteInHour());
      return fmt2(h) + ':' + fmt2(m);
    },

    // Sun angle 0..2π (0 = midnight, PI = noon)
    getSunAngle() {
      return (state.hour / 24) * Math.PI * 2;
    },

    setTime(hour) {
      const h = ((Number(hour) % 24) + 24) % 24;
      state.hour = h;
      notify(['hour']);
    },

    advanceHour(n) {
      const before = state.hour;
      let h = before + n;
      let daysAdded = 0;
      while (h >= 24) { h -= 24; daysAdded++; }
      while (h < 0)   { h += 24; daysAdded--; }
      state.hour = h;
      if (daysAdded !== 0) state.dayIndex = Math.max(1, state.dayIndex + daysAdded);
      notify(daysAdded ? ['hour', 'dayIndex'] : ['hour']);
    },

    setTimeScale(scale) {
      const s = Math.max(0.1, Math.min(1000, Number(scale) || 60));
      state.timeScale = s;
      notify(['timeScale']);
    },

    setPaused(p) {
      const v = !!p;
      if (state.paused === v) return;
      state.paused = v;
      notify(['paused']);
    },

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

    on(cb) { anyListeners.add(cb); return () => anyListeners.delete(cb); },
    onKey(key, cb) {
      if (!keyListeners.has(key)) keyListeners.set(key, new Set());
      keyListeners.get(key).add(cb);
      return () => keyListeners.get(key).delete(cb);
    },

    serialize() { return { ...state }; },

    hydrate(data) {
      if (!data || typeof data !== 'object') return false;
      const clean = sanitize(data);
      Object.assign(state, clean);
      notify(Object.keys(state));
      return true;
    },

    reset() {
      Object.assign(state, sanitize({}));
      notify(Object.keys(state));
    }
  };
}
