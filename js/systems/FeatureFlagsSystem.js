// ETAPA 19 — Feature Flags runtime.
// Prioritati (in ordine): URL param (?flag_NAME=false) > persistent override > default.
// Real remote config = BLOCKED (Firebase Remote Config / LaunchDarkly / etc).

import { FEATURE_FLAGS } from '../config/featureFlags.js?v=27';

const STORAGE_KEY = 'snow-game:featureFlags-v1';

function _parseBool(v) {
  if (v === true || v === false) return v;
  if (v == null) return null;
  const s = String(v).toLowerCase();
  if (s === 'true' || s === '1' || s === 'on'  || s === 'yes') return true;
  if (s === 'false'|| s === '0' || s === 'off' || s === 'no')  return false;
  return null;
}

export function createFeatureFlagsSystem({ envConfig, logger } = {}) {
  const overrides = new Map();
  const urlOverrides = new Map();
  const canOverride = envConfig ? envConfig.debugTools : true;

  function _loadPersistent() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;
      for (const [k, v] of Object.entries(parsed)) {
        if (k in FEATURE_FLAGS && typeof v === 'boolean') overrides.set(k, v);
      }
    } catch (e) { logger && logger.warn('flags persistent load fail', e); }
  }

  function _loadUrl() {
    try {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      for (const [k, raw] of params) {
        if (!k.startsWith('flag_')) continue;
        const name = k.slice(5);
        if (!(name in FEATURE_FLAGS)) continue;
        const b = _parseBool(raw);
        if (b !== null) urlOverrides.set(name, b);
      }
    } catch (e) { logger && logger.warn('flags url load fail', e); }
  }

  function _savePersistent() {
    try {
      const out = {};
      for (const [k, v] of overrides) out[k] = v;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
    } catch (e) { logger && logger.warn('flags persistent save fail', e); }
  }

  function isEnabled(name) {
    if (urlOverrides.has(name)) return urlOverrides.get(name);
    if (overrides.has(name)) return overrides.get(name);
    return FEATURE_FLAGS[name] === true;
  }

  function getAll() {
    const out = {};
    for (const k of Object.keys(FEATURE_FLAGS)) {
      out[k] = {
        value:   isEnabled(k),
        default: FEATURE_FLAGS[k],
        override: overrides.has(k) ? overrides.get(k) : null,
        urlOverride: urlOverrides.has(k) ? urlOverrides.get(k) : null
      };
    }
    return out;
  }

  function override(name, value) {
    if (!canOverride) { logger && logger.warn('flag override refused in production:', name); return false; }
    if (!(name in FEATURE_FLAGS)) { logger && logger.warn('unknown flag:', name); return false; }
    overrides.set(name, !!value);
    _savePersistent();
    logger && logger.info('flag override:', name, '=', !!value);
    return true;
  }

  function resetOverride(name) {
    if (!canOverride) return false;
    overrides.delete(name);
    _savePersistent();
    return true;
  }

  function resetOverrides() {
    if (!canOverride) return false;
    overrides.clear();
    _savePersistent();
    return true;
  }

  function init() { _loadPersistent(); _loadUrl(); }

  return { init, isEnabled, getAll, override, resetOverride, resetOverrides };
}
