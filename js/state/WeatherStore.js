// ETAPA 5 — WeatherStore
// Sursa unica de adevar pentru starea meteo curenta.
// Persist separat pe cheia snow-game:weather-v1.

import { WEATHER_BY_ID, pickDuration } from '../config/weather.js';

const DEFAULTS = {
  currentWeatherId: 'clear',
  previousWeatherId: null,
  weatherStartedAt: 0,             // Date.now() la setare
  weatherDurationSec: 120,         // durata planificata a starii curente
  transitionProgress: 1.0,         // 0..1 (1 = tranzitie completa)
  temperature: -2                  // temperatura curenta (interpolata)
};

export function createWeatherStore() {
  const state = { ...DEFAULTS, weatherStartedAt: Date.now() };
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
    if (!WEATHER_BY_ID[clean.currentWeatherId]) clean.currentWeatherId = 'clear';
    if (clean.previousWeatherId && !WEATHER_BY_ID[clean.previousWeatherId]) clean.previousWeatherId = null;
    const s = Number(clean.weatherStartedAt);
    clean.weatherStartedAt = Number.isFinite(s) && s > 0 ? s : Date.now();
    const d = Number(clean.weatherDurationSec);
    clean.weatherDurationSec = Number.isFinite(d) && d > 0 ? Math.min(d, 3600) : 120;
    const t = Number(clean.transitionProgress);
    clean.transitionProgress = Number.isFinite(t) ? Math.max(0, Math.min(1, t)) : 1.0;
    const temp = Number(clean.temperature);
    clean.temperature = Number.isFinite(temp) ? Math.max(-40, Math.min(20, temp)) : -2;
    return clean;
  }

  return {
    get state() { return state; },

    // Timp scurs de la inceput starii curente (ms)
    getElapsedMs() { return Math.max(0, Date.now() - state.weatherStartedAt); },
    getElapsedSec() { return this.getElapsedMs() / 1000; },
    getRemainingSec() {
      return Math.max(0, state.weatherDurationSec - this.getElapsedSec());
    },

    setWeather(id, opts = {}) {
      const w = WEATHER_BY_ID[id];
      if (!w) return false;
      const now = Date.now();
      const dur = opts.durationSec != null ? opts.durationSec : pickDuration(w);
      const prev = state.currentWeatherId;
      state.previousWeatherId = prev !== id ? prev : state.previousWeatherId;
      state.currentWeatherId = id;
      state.weatherStartedAt = now;
      state.weatherDurationSec = dur;
      state.transitionProgress = opts.instant ? 1.0 : 0.0;
      state.temperature = w.temperature;
      notify(['currentWeatherId', 'previousWeatherId', 'weatherStartedAt', 'weatherDurationSec', 'transitionProgress', 'temperature']);
      return true;
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
      Object.assign(state, sanitize({ ...DEFAULTS, weatherStartedAt: Date.now() }));
      notify(Object.keys(state));
    }
  };
}
