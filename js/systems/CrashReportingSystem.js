// ETAPA 19 — Crash Reporting extension.
// Persist crashes local (ring 20). Real crash provider (Sentry / Rollbar / Crashlytics) = BLOCKED.
// Extindere peste ErrorRecoverySystem existent (Etapa 16) — nu duplica overlay-ul.

const STORAGE_KEY = 'snow-game:crashes-v1';
const MAX_CRASHES = 20;

function _genId() {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createCrashReportingSystem({ envConfig, versionSnapshot, analytics, logger, errorRecoverySystem } = {}) {
  const enabled = envConfig ? envConfig.crashReportingEnabled : true;
  const crashes = [];

  function _persist() {
    try {
      const payload = { savedAt: Date.now(), crashes: crashes.slice(-MAX_CRASHES) };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {}
  }

  function _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.crashes)) {
        for (const c of parsed.crashes) if (c && c.id) crashes.push(c);
        while (crashes.length > MAX_CRASHES) crashes.shift();
      }
    } catch {}
  }

  function _screenInfo() {
    try {
      return { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio || 1 };
    } catch { return null; }
  }

  function report(err, source = 'unknown', extra = {}) {
    if (!enabled) return null;
    try {
      const message = (err && err.message) ? String(err.message) : String(err);
      const stack = (err && err.stack) ? String(err.stack).slice(0, 4000) : '';
      const record = {
        id: _genId(),
        ts: Date.now(),
        message: message.slice(0, 500),
        stack,
        source,
        gameVersion: versionSnapshot ? versionSnapshot.game : null,
        environment: envConfig ? envConfig.name : null,
        userAgent: (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent.slice(0, 200) : null,
        screen: _screenInfo(),
        sessionId: analytics ? analytics.sessionId : null,
        extra: extra || null
      };
      crashes.push(record);
      if (crashes.length > MAX_CRASHES) crashes.shift();
      _persist();
      if (analytics) { try { analytics.track('ERROR', { source, message: message.slice(0, 100) }); } catch {} }
      // BLOCKED: real crash provider (Sentry/Rollbar) — no send
      logger && logger.warn('crash recorded', record.id, source, message);
      return record.id;
    } catch (e) {
      logger && logger.error('crash reporter itself failed', e);
      return null;
    }
  }

  function install() {
    if (!enabled) return;
    _load();
    if (typeof window === 'undefined') return;
    window.addEventListener('error', (ev) => {
      report(ev.error || ev.message, 'window.error');
    });
    window.addEventListener('unhandledrejection', (ev) => {
      report(ev.reason || 'unhandled promise', 'unhandledrejection');
    });
    // Hook peste ErrorRecoverySystem existent: wrap show pentru a raporta si aici
    if (errorRecoverySystem && typeof errorRecoverySystem.show === 'function') {
      const origShow = errorRecoverySystem.show.bind(errorRecoverySystem);
      errorRecoverySystem.show = function(err, source, resume) {
        try { report(err, source || 'error_recovery'); } catch {}
        return origShow(err, source, resume);
      };
    }
  }

  function getCrashes() { return crashes.slice(); }
  function getCrashById(id) { return crashes.find(c => c.id === id) || null; }
  function clearCrashes() { crashes.length = 0; try { localStorage.removeItem(STORAGE_KEY); } catch {} }

  return { install, report, getCrashes, getCrashById, clearCrashes, enabled };
}
