// Autosave debounced la localStorage. Schema versionata cu migrari.
// Nu contine logica de gameplay.
// v1 -> v2: adaugat toolUpgrades + stats.snowByType + stats.totalToolUpgrades.

const DEFAULT_OPTS = {
  key: 'snow-game:save-v1',
  debounceMs: 500,
  version: 1,
  migrations: null  // { fromVer: (state) => newState }
};

export function createSaveSystem(store, opts = {}) {
  const cfg = { ...DEFAULT_OPTS, ...opts };
  let timer = null;
  let attached = false;

  function saveNow() {
    try {
      const payload = {
        v: cfg.version,
        savedAt: Date.now(),
        state: store.serialize()
      };
      localStorage.setItem(cfg.key, JSON.stringify(payload));
    } catch (e) {
      console.warn('[SaveSystem]', cfg.key, 'save failed:', e);
    }
  }

  function scheduleSave() {
    clearTimeout(timer);
    timer = setTimeout(saveNow, cfg.debounceMs);
  }

  function load() {
    try {
      const raw = localStorage.getItem(cfg.key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !parsed.state) {
        console.warn('[SaveSystem]', cfg.key, 'malformed payload — fallback to new game');
        return null;
      }
      let state = parsed.state;
      let ver = Number(parsed.v) || 0;

      // Aplica migrari
      if (cfg.migrations && ver < cfg.version) {
        while (ver < cfg.version) {
          const migrator = cfg.migrations[ver];
          if (typeof migrator !== 'function') {
            console.warn('[SaveSystem] no migrator from v' + ver + ' — fallback to new game');
            return null;
          }
          try { state = migrator(state); } catch (e) {
            console.warn('[SaveSystem] migration from v' + ver + ' failed:', e);
            return null;
          }
          ver++;
        }
      } else if (ver !== cfg.version) {
        console.warn('[SaveSystem]', cfg.key, 'unknown version', ver, '— fallback to new game');
        return null;
      }

      return state;
    } catch (e) {
      console.warn('[SaveSystem]', cfg.key, 'load failed:', e, '— fallback to new game');
      return null;
    }
  }

  function attach() {
    if (attached) return;
    attached = true;
    store.on(() => scheduleSave());
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => { clearTimeout(timer); saveNow(); });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') { clearTimeout(timer); saveNow(); }
      });
    }
  }

  function clear() {
    try { localStorage.removeItem(cfg.key); } catch {}
  }

  function newGame() {
    clear();
    if (typeof store.reset === 'function') store.reset();
  }

  return { saveNow, scheduleSave, load, attach, clear, newGame, key: cfg.key };
}
