// ETAPA 19 — Economy Monitor
// Agrega TransactionLog pe categorii (earned/spent/purchased/rewarded) per resource.
// Detecteaza anomalii runtime (currency negative, spike suspect, purchase burst).
// Nu inlocuieste TransactionLog — doar il citeste.

const WINDOW_24H_MS = 24 * 60 * 60 * 1000;

const EARN_TYPES     = new Set(['MELT_REWARD', 'CONTRACT_REWARD', 'LEVEL_REWARD', 'DEBUG_GRANT', 'PREMIUM_CURRENCY_GRANT', 'MP_REWARD_GRANT', 'COMPANY_REVENUE']);
const SPEND_TYPES    = new Set(['TOOL_PURCHASE', 'BAG_UPGRADE', 'UPGRADE_PURCHASE', 'VEHICLE_PURCHASE', 'VEHICLE_UPGRADE', 'VEHICLE_REPAIR', 'ATTACHMENT_PURCHASE', 'FUEL_PURCHASE', 'GARAGE_UPGRADE', 'COMPANY_UPGRADE', 'COMPANY_EXPENSE']);
const PURCHASE_TYPES = new Set(['IAP_PURCHASE', 'SEASON_PASS_PURCHASE']);

export function createEconomyMonitorSystem({ transactionLog, playerStore, logger } = {}) {
  if (!transactionLog) throw new Error('EconomyMonitor requires transactionLog');
  const anomalies = [];
  const MAX_ANOMALIES = 50;

  function _addAnomaly(kind, meta) {
    anomalies.push({ ts: Date.now(), kind, meta });
    if (anomalies.length > MAX_ANOMALIES) anomalies.shift();
    logger && logger.warn('anomaly detected:', kind, meta);
  }

  function _walkTx(cutoffTs, agg) {
    const all = transactionLog.getAll();
    for (const tx of all) {
      if (cutoffTs && tx.ts < cutoffTs) continue;
      const cur = tx.currency;
      const amt = Number(tx.amount) || 0;
      if (!cur) continue;
      if (!agg[cur]) agg[cur] = { earned: 0, spent: 0, purchased: 0, count: 0 };
      agg[cur].count++;
      if (EARN_TYPES.has(tx.type))     agg[cur].earned += Math.abs(amt);
      if (SPEND_TYPES.has(tx.type))    agg[cur].spent  += Math.abs(amt);
      if (PURCHASE_TYPES.has(tx.type)) agg[cur].purchased += Math.abs(amt);
    }
  }

  function getSnapshot() {
    const now = Date.now();
    const win24h = {};
    const allTime = {};
    _walkTx(now - WINDOW_24H_MS, win24h);
    _walkTx(null, allTime);
    const balances = {};
    if (playerStore && playerStore.state) {
      balances.bagCoins   = playerStore.state.bagCoins   ?? 0;
      balances.vaultCoins = playerStore.state.vaultCoins ?? 0;
      balances.diamonds   = playerStore.state.diamonds   ?? 0;
      balances.xp         = playerStore.state.xp         ?? 0;
      balances.level      = playerStore.state.level      ?? 1;
      balances.reputation = playerStore.state.reputation ?? 0;
    }
    return { ts: now, balances, window24h: win24h, allTime };
  }

  function getAnomalies() {
    const now = Date.now();
    if (playerStore && playerStore.state) {
      const s = playerStore.state;
      if ((s.bagCoins   ?? 0) < 0) _addAnomaly('NEGATIVE_BAG_COINS',   { bagCoins: s.bagCoins });
      if ((s.vaultCoins ?? 0) < 0) _addAnomaly('NEGATIVE_VAULT_COINS', { vaultCoins: s.vaultCoins });
      if ((s.diamonds   ?? 0) < 0) _addAnomaly('NEGATIVE_DIAMONDS',    { diamonds: s.diamonds });
      if ((s.xp         ?? 0) < 0) _addAnomaly('NEGATIVE_XP',          { xp: s.xp });
    }
    const recentHour = now - 60 * 60 * 1000;
    const recentMin = now - 60 * 1000;
    const all = transactionLog.getAll();
    let coinEarnedHour = 0;
    let purchasesLastMin = 0;
    for (const tx of all) {
      if (tx.ts < recentHour) continue;
      if (tx.currency === 'coins' && EARN_TYPES.has(tx.type)) coinEarnedHour += Math.abs(tx.amount) || 0;
      if (tx.ts >= recentMin && PURCHASE_TYPES.has(tx.type)) purchasesLastMin++;
    }
    if (coinEarnedHour > 1_000_000) _addAnomaly('COIN_SPIKE_HOUR', { total: coinEarnedHour });
    if (purchasesLastMin > 10) _addAnomaly('PURCHASE_BURST_MINUTE', { count: purchasesLastMin });
    return anomalies.slice();
  }

  function dumpLast(n = 20) {
    const all = transactionLog.getAll();
    return all.slice(-n);
  }

  function clearAnomalies() { anomalies.length = 0; }

  return { getSnapshot, getAnomalies, dumpLast, clearAnomalies };
}
