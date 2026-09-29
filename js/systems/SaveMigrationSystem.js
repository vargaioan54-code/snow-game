// ETAPA 19 — Save Migration Pipeline
// Ofera infrastructura pentru migrari future intre versiuni de save.
// SaveSystem existent are propriile migrations pentru snow-game:save-v1 (v1->v2).
// Acest modul e un registry general pentru toate stores + backup + rollback.

const BACKUP_PREFIX = 'snow-game:backup:';
const MAX_BACKUPS_PER_STORE = 3;

export function createSaveMigrationSystem({ logger } = {}) {
  // registry: Map<storeKey, { current: N, chain: [{from, to, fn}] }>
  const registry = new Map();

  function registerMigration(storeKey, fromVersion, toVersion, migrateFn) {
    if (!storeKey || typeof fromVersion !== 'number' || typeof toVersion !== 'number' || typeof migrateFn !== 'function') {
      logger && logger.warn('registerMigration: invalid args', storeKey, fromVersion, toVersion);
      return false;
    }
    if (!registry.has(storeKey)) registry.set(storeKey, { current: toVersion, chain: [] });
    const entry = registry.get(storeKey);
    entry.chain.push({ from: fromVersion, to: toVersion, fn: migrateFn });
    if (toVersion > entry.current) entry.current = toVersion;
    logger && logger.debug('migration registered', storeKey, `v${fromVersion}->v${toVersion}`);
    return true;
  }

  function _backupKey(storeKey, version) {
    return `${BACKUP_PREFIX}${storeKey}:v${version}`;
  }

  function backup(storeKey, version, data) {
    try {
      const key = _backupKey(storeKey, version);
      const payload = { ts: Date.now(), storeKey, version, data };
      localStorage.setItem(key, JSON.stringify(payload));
      _pruneOldBackups(storeKey);
      return true;
    } catch (e) { logger && logger.warn('backup failed', storeKey, e); return false; }
  }

  function _pruneOldBackups(storeKey) {
    try {
      const prefix = `${BACKUP_PREFIX}${storeKey}:v`;
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) keys.push(k);
      }
      if (keys.length <= MAX_BACKUPS_PER_STORE) return;
      keys.sort();
      const toDelete = keys.slice(0, keys.length - MAX_BACKUPS_PER_STORE);
      for (const k of toDelete) localStorage.removeItem(k);
    } catch {}
  }

  function getBackups(storeKey) {
    const out = [];
    try {
      const prefix = `${BACKUP_PREFIX}${storeKey}:v`;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith(prefix)) continue;
        try {
          const raw = localStorage.getItem(k);
          const parsed = JSON.parse(raw);
          out.push({ key: k, ...parsed });
        } catch {}
      }
    } catch {}
    return out.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }

  function restoreBackup(storeKey, version) {
    try {
      const key = _backupKey(storeKey, version);
      const raw = localStorage.getItem(key);
      if (!raw) { logger && logger.warn('no backup for', storeKey, 'v' + version); return null; }
      const parsed = JSON.parse(raw);
      return parsed && parsed.data ? parsed.data : null;
    } catch (e) { logger && logger.warn('restore failed', e); return null; }
  }

  function migrate(storeKey, payload) {
    if (!payload || typeof payload !== 'object') return null;
    const entry = registry.get(storeKey);
    if (!entry) return payload;
    let ver = Number(payload.v) || 0;
    if (ver === entry.current) return payload;
    if (ver > entry.current) {
      logger && logger.warn('save from newer version', storeKey, ver, '>', entry.current);
      return payload;
    }
    backup(storeKey, ver, payload);
    let state = payload.state;
    while (ver < entry.current) {
      const step = entry.chain.find(s => s.from === ver);
      if (!step) { logger && logger.warn('no migration step from v' + ver, 'for', storeKey); return null; }
      try {
        state = step.fn(state);
        ver = step.to;
      } catch (e) {
        logger && logger.error('migration failed', storeKey, `v${step.from}->v${step.to}`, e);
        const restored = restoreBackup(storeKey, Number(payload.v) || 0);
        return restored;
      }
    }
    return { v: entry.current, savedAt: Date.now(), state };
  }

  function listRegistered() {
    const out = [];
    for (const [k, v] of registry) {
      out.push({ storeKey: k, current: v.current, steps: v.chain.map(s => `v${s.from}->v${s.to}`) });
    }
    return out;
  }

  function simulate(storeKey, oldPayload) {
    return migrate(storeKey, oldPayload);
  }

  function clearAllBackups() {
    try {
      const toDelete = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(BACKUP_PREFIX)) toDelete.push(k);
      }
      for (const k of toDelete) localStorage.removeItem(k);
      return toDelete.length;
    } catch { return 0; }
  }

  return { registerMigration, migrate, backup, getBackups, restoreBackup, simulate, listRegistered, clearAllBackups };
}
