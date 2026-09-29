// Etapa 12 — BoostSystem
// Wraper peste EntitlementStore.activeBoosts. Gestioneaza activare, expirare, multipliers.

export function createBoostSystem({ entitlementStore, transactionLog, audio }) {

  function tx(entry) {
    if (transactionLog && typeof transactionLog.log === 'function') transactionLog.log(entry);
  }

  function activate(boostType, multiplier, durationHours, meta = null) {
    if (!boostType) return null;
    const mult = Math.max(1, Number(multiplier) || 1);
    const hours = Math.max(0, Number(durationHours) || 0);
    if (hours <= 0) return null;
    const now = Date.now();
    const boost = {
      id: 'boost_' + now + '_' + Math.floor(Math.random() * 100000).toString(36),
      boostType,
      multiplier: mult,
      startedAt: now,
      expiresAt: now + hours * 3600 * 1000
    };
    entitlementStore.addActiveBoost(boost);
    tx({
      type: 'BOOST_ACTIVATE',
      currency: null,
      amount: 0,
      balanceAfter: null,
      meta: { boostType, multiplier: mult, durationHours: hours, source: meta?.source || null }
    });
    if (audio && typeof audio.pickupBig === 'function') { try { audio.pickupBig(); } catch {} }
    return boost;
  }

  function getMultiplier(boostType) {
    return entitlementStore.getBoostMultiplier(boostType);
  }

  function getActive() {
    return entitlementStore.getActiveBoosts();
  }

  function tick() {
    const removed = entitlementStore.removeExpiredBoosts();
    if (removed > 0) {
      tx({
        type: 'BOOST_EXPIRE',
        currency: null,
        amount: 0,
        balanceAfter: null,
        meta: { count: removed }
      });
    }
    return removed;
  }

  function timeRemaining(boost) {
    return Math.max(0, boost.expiresAt - Date.now());
  }

  function formatTimeRemaining(ms) {
    if (ms <= 0) return '0m';
    const sec = Math.floor(ms / 1000);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return h + 'h ' + m + 'm';
    return m + 'm';
  }

  return { activate, getMultiplier, getActive, tick, timeRemaining, formatTimeRemaining };
}
