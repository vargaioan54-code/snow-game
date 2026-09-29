// HapticsSystem — wrapper peste navigator.vibrate.
// Asculta SettingsStore.haptics — daca false, tacere.
// ETAPA 16 — patterns bogate (reward, warning, success, damage, engine, snow_impact).

export function createHapticsSystem(settingsStore) {
  const supported = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

  function enabled() {
    return supported && settingsStore && settingsStore.state && settingsStore.state.haptics !== false;
  }

  // Pattern-uri pre-alocate (fara alloc runtime)
  const SUCCESS_PATTERN = [10, 40, 20];

  // ETAPA 16 — Patterns named (pre-alocate)
  const PATTERNS = Object.freeze({
    reward:       [50, 30, 50, 30, 100],
    damage:       [80, 40, 80],
    warning:      [200, 100, 200],
    success:      [30, 20, 100],
    failure:      [300, 150, 100],
    engine_start: [40, 20, 40, 20, 60],
    snow_impact:  [15, 10, 15]
  });

  function safeVibrate(patternOrDur) {
    if (!enabled()) return;
    try { navigator.vibrate(patternOrDur); } catch { /* ignore */ }
  }

  return {
    isSupported() { return supported; },
    light()   { safeVibrate(15); },
    medium()  { safeVibrate(30); },
    heavy()   { safeVibrate(60); },
    success() { safeVibrate(SUCCESS_PATTERN); },
    // ETAPA 16 — Named pattern
    pattern(name) {
      const p = PATTERNS[name];
      if (!p) return false;
      safeVibrate(p);
      return true;
    },
    // ETAPA 16 — Custom pattern
    custom(sequence) {
      if (!Array.isArray(sequence)) return false;
      safeVibrate(sequence);
      return true;
    },
    // debug: list all names
    listPatterns() { return Object.keys(PATTERNS); }
  };
}
