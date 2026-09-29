// Store separat pentru setari (persistat separat de PlayerStore).
// Aceleasi API: set / on / onKey / serialize / hydrate.
// ETAPA 16 — chei noi: quality, touchUi, joystickSensitivity, invertY, batterySaver,
//   volumeMaster/Music/Sfx/Ui, mute, fontScale, reducedMotion.

const IS_MOBILE = typeof navigator !== 'undefined' &&
  (/Android|iPhone|iPad|iPod|Mobile|Opera Mini/i.test(navigator.userAgent) ||
   (typeof window !== 'undefined' && window.innerWidth < 900));

const DEFAULTS = {
  sound: true,
  music: true,
  haptics: true,
  graphics: IS_MOBILE ? 'medium' : 'high',   // Etapa 1 legacy (păstrat pentru back-compat)
  sensitivity: 1.0,
  language: 'ro',
  // Etapa 16 — grafica noua (auto/low/medium/high/ultra)
  quality: 'auto',
  // Etapa 16 — touch UI
  touchUi: 'auto',
  joystickSensitivity: 1.0,
  invertY: false,
  // Etapa 16 — battery
  batterySaver: false,
  // Etapa 16 — audio categorii
  volumeMaster: 0.7,
  volumeMusic: 0.5,
  volumeSfx: 0.9,
  volumeUi: 0.8,
  mute: false,
  // Etapa 16 — accesibilitate
  fontScale: 1.0,
  reducedMotion: false
};

const VALID_GRAPHICS = new Set(['high','medium','low']);
const VALID_QUALITY = new Set(['auto','low','medium','high','ultra']);
const VALID_TOUCH = new Set(['auto','on','off']);

export function createSettingsStore() {
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

  function clampNum(n, min, max, def) {
    const v = Number(n);
    if (!Number.isFinite(v)) return def;
    return Math.max(min, Math.min(max, v));
  }

  function sanitize(data) {
    const clean = { ...DEFAULTS, ...(data || {}) };
    clean.sound = !!clean.sound;
    clean.music = !!clean.music;
    clean.haptics = !!clean.haptics;
    if (!VALID_GRAPHICS.has(clean.graphics)) clean.graphics = DEFAULTS.graphics;
    clean.sensitivity = clampNum(clean.sensitivity, 0.3, 2.0, 1.0);
    if (typeof clean.language !== 'string') clean.language = 'ro';
    // Etapa 16
    if (!VALID_QUALITY.has(clean.quality)) clean.quality = 'auto';
    if (!VALID_TOUCH.has(clean.touchUi)) clean.touchUi = 'auto';
    clean.joystickSensitivity = clampNum(clean.joystickSensitivity, 0.3, 2.5, 1.0);
    clean.invertY = !!clean.invertY;
    clean.batterySaver = !!clean.batterySaver;
    clean.volumeMaster = clampNum(clean.volumeMaster, 0, 1, 0.7);
    clean.volumeMusic  = clampNum(clean.volumeMusic,  0, 1, 0.5);
    clean.volumeSfx    = clampNum(clean.volumeSfx,    0, 1, 0.9);
    clean.volumeUi     = clampNum(clean.volumeUi,     0, 1, 0.8);
    clean.mute = !!clean.mute;
    clean.fontScale = clampNum(clean.fontScale, 0.8, 1.5, 1.0);
    clean.reducedMotion = !!clean.reducedMotion;
    return clean;
  }

  return {
    get state() { return state; },

    set(patch) {
      const clean = sanitize({ ...state, ...patch });
      const changed = [];
      for (const k in patch) {
        if (state[k] !== clean[k]) {
          state[k] = clean[k];
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
