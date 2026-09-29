// Toate mutatiile monetare trec strict prin acest sistem.
// Nu atinge DOM. Nu contine logica de UI.
// Fiecare mutatie logeaza in TransactionLog (daca e furnizat).

import { BAG_TIERS } from '../config/bagTiers.js';
import { TOOL_BY_ID } from '../config/tools.js';
import { UPGRADE_STATS, UPGRADE_MAX_LEVEL, upgradeCost } from '../config/toolUpgrades.js';

export function createEconomy(store, opts = {}) {
  const txLog = opts.transactionLog || null;
  const unlockSystem = opts.unlockSystem || null;

  function tx(entry) { if (txLog) txLog.log(entry); }

  function earnCoins(amount, meta = null) {
    if (amount <= 0) return 0;
    const space = store.bagCap - store.state.bagCoins;
    if (space <= 0) return 0;
    const added = Math.min(space, amount);
    store.set({ bagCoins: store.state.bagCoins + added });
    tx({
      type: 'MELT_REWARD',
      currency: 'coins',
      amount: added,
      balanceAfter: { bag: store.state.bagCoins, vault: store.state.vaultCoins },
      meta
    });
    return added;
  }

  function depositToVault() {
    const bag = store.state.bagCoins;
    if (bag <= 0) return 0;
    store.set({
      vaultCoins: store.state.vaultCoins + bag,
      bagCoins: 0
    });
    tx({
      type: 'DEPOSIT',
      currency: 'coins',
      amount: bag,
      balanceAfter: { bag: 0, vault: store.state.vaultCoins }
    });
    return bag;
  }

  function spend(cost) {
    if (cost < 0) return false;
    if (store.totalCoins < cost) return false;
    let need = cost;
    const fromVault = Math.min(store.state.vaultCoins, need);
    need -= fromVault;
    const newVault = store.state.vaultCoins - fromVault;
    const newBag   = store.state.bagCoins - need;
    store.set({ vaultCoins: newVault, bagCoins: newBag });
    return true;
  }

  function addDiamonds(amount, meta = null) {
    if (amount <= 0) return 0;
    store.set({ diamonds: store.state.diamonds + amount });
    tx({
      type: 'LEVEL_REWARD',
      currency: 'diamonds',
      amount,
      balanceAfter: store.state.diamonds,
      meta
    });
    return amount;
  }

  function spendDiamonds(amount) {
    if (amount < 0) return false;
    if (store.state.diamonds < amount) return false;
    store.set({ diamonds: store.state.diamonds - amount });
    return true;
  }

  function addReputation(amount, meta = null) {
    if (amount <= 0) return 0;
    store.set({ reputation: store.state.reputation + amount });
    tx({
      type: 'LEVEL_REWARD',
      currency: 'reputation',
      amount,
      balanceAfter: store.state.reputation,
      meta
    });
    return amount;
  }

  function buyTool(id) {
    const tool = TOOL_BY_ID[id];
    if (!tool) return { ok: false, reason: 'unknown' };

    if (unlockSystem && !unlockSystem.isUnlocked(id, store.state)) {
      return { ok: false, reason: 'locked', requiredLevel: tool.unlockLevel };
    }

    if (store.state.owned.includes(id)) {
      if (store.state.currentToolId !== id) store.set({ currentToolId: id });
      return { ok: true, equipped: true };
    }

    if (!spend(tool.price)) return { ok: false, reason: 'poor' };

    store.set({
      owned: [...store.state.owned, id],
      currentToolId: id
    });
    tx({
      type: 'TOOL_PURCHASE',
      currency: 'coins',
      amount: -tool.price,
      balanceAfter: { bag: store.state.bagCoins, vault: store.state.vaultCoins },
      meta: { toolId: id }
    });
    return { ok: true, purchased: true };
  }

  function equipTool(id) {
    if (!store.state.owned.includes(id)) return false;
    if (store.state.currentToolId === id) return true;
    store.set({ currentToolId: id });
    return true;
  }

  function buyBagUpgrade() {
    const nextLevel = store.state.bagLevel + 1;
    if (nextLevel >= BAG_TIERS.length) return { ok: false, reason: 'max' };
    const tier = BAG_TIERS[nextLevel];
    if (!spend(tier.price)) return { ok: false, reason: 'poor' };
    store.set({ bagLevel: nextLevel });
    tx({
      type: 'BAG_UPGRADE',
      currency: 'coins',
      amount: -tier.price,
      balanceAfter: { bag: store.state.bagCoins, vault: store.state.vaultCoins },
      meta: { newLevel: nextLevel, newCap: tier.cap }
    });
    return { ok: true };
  }

  // === TOOL UPGRADES ===
  function buyToolUpgrade(toolId, statName) {
    const tool = TOOL_BY_ID[toolId];
    if (!tool) return { ok: false, reason: 'unknown_tool' };
    if (!UPGRADE_STATS.includes(statName)) return { ok: false, reason: 'unknown_stat' };
    if (!store.state.owned.includes(toolId)) return { ok: false, reason: 'not_owned' };
    const currentUpgrades = store.state.toolUpgrades[toolId] || { power: 0, speed: 0, capacity: 0 };
    const currentLevel = currentUpgrades[statName] || 0;
    if (currentLevel >= UPGRADE_MAX_LEVEL) return { ok: false, reason: 'max' };
    const cost = upgradeCost(tool.price, currentLevel);
    if (!spend(cost)) return { ok: false, reason: 'poor', requiredCoins: cost };
    store.incUpgrade(toolId, statName);
    tx({
      type: 'UPGRADE_PURCHASE',
      currency: 'coins',
      amount: -cost,
      balanceAfter: { bag: store.state.bagCoins, vault: store.state.vaultCoins },
      meta: { toolId, stat: statName, newLevel: currentLevel + 1 }
    });
    if (typeof store.incStat === 'function') store.incStat('totalToolUpgrades', 1);
    return { ok: true, newLevel: currentLevel + 1, cost };
  }

  function logXP(amount, meta = null) {
    if (amount <= 0) return;
    tx({
      type: 'XP_GAIN',
      currency: 'xp',
      amount,
      balanceAfter: store.state.xp,
      meta
    });
  }

  function logLevelUp(newLevel) {
    tx({
      type: 'LEVEL_REWARD',
      currency: 'xp',
      amount: 0,
      balanceAfter: newLevel,
      meta: { newLevel }
    });
  }

  return {
    earnCoins, depositToVault, spend,
    addDiamonds, spendDiamonds, addReputation,
    buyTool, equipTool, buyBagUpgrade, buyToolUpgrade,
    logXP, logLevelUp
  };
}
