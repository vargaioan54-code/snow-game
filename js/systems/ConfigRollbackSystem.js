// ETAPA 19 — Config Rollback abstraction
// Snapshot config current + feature flags + version pentru "known good".
// La N crash-uri consecutive => trigger rollback (dev-only signal, real deploy = BLOCKED).

const STORAGE_KEY = 'snow-game:configRollback-v1';
const CRASH_THRESHOLD = 3;

export function createConfigRollbackSystem({ featureFlagsSystem, versionSnapshot, logger, crashReporting } = {}) {
  let lastGood = null;
  let consecutiveCrashes = 0;

  function _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      lastGood = JSON.parse(raw);
    } catch {}
  }

  function _save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(lastGood)); } catch {}
  }

  function snapshotGood() {
    const snap = {
      ts: Date.now(),
      version: versionSnapshot || null,
      flags: featureFlagsSystem ? featureFlagsSystem.getAll() : null
    };
    lastGood = snap;
    _save();
    logger && logger.info('config snapshot saved as known-good', snap.ts);
    return snap;
  }

  function getLastGood() { return lastGood; }

  function rollback() {
    if (!lastGood) { logger && logger.warn('no known-good snapshot to rollback to'); return false; }
    if (featureFlagsSystem && lastGood.flags) {
      for (const [k, meta] of Object.entries(lastGood.flags)) {
        if (typeof meta.value === 'boolean') {
          try { featureFlagsSystem.override(k, meta.value); } catch {}
        }
      }
      logger && logger.info('feature flags rolled back to snapshot', lastGood.ts);
    }
    return true;
  }

  function onCrash() {
    consecutiveCrashes++;
    if (consecutiveCrashes >= CRASH_THRESHOLD) {
      logger && logger.warn('crash threshold reached — auto rollback triggered');
      rollback();
      consecutiveCrashes = 0;
    }
  }

  function resetCrashCounter() { consecutiveCrashes = 0; }

  function init() {
    _load();
    // Auto-snapshot at boot dupa ~10s de rulare fara crash-uri
    if (typeof setTimeout !== 'undefined') {
      setTimeout(() => {
        if (consecutiveCrashes === 0 && !lastGood) snapshotGood();
      }, 10000);
    }
  }

  return { init, snapshotGood, getLastGood, rollback, onCrash, resetCrashCounter };
}
