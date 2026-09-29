// Etapa 8 — CompanySystem
// Orchestreaza creare/level up/upgrades/finances/contract results pt companie.
// NU atinge DOM. Reutilizeaza economy/transactionLog/playerStore.

import {
  COMPANY_LEVELS, COMPANY_MAX_LEVEL, COMPANY_UPGRADES, CONTRACT_TIERS, TIER_BY_ID,
  companyXpForContract, companyFundsForContract, reputationForRating,
  validateCompanyName
} from '../config/company.js';

export function createCompanySystem(deps) {
  const {
    companyStore, playerStore, economy, unlockSystem, worldSystem,
    contractStore, transactionLog, gameState, audio, haptics, showBanner
  } = deps;

  function tx(entry) { if (transactionLog) transactionLog.log(entry); }
  function banner(t) { if (showBanner) showBanner(t); }
  function play(s) {
    if (!audio) return;
    if (s === 'levelUp' && audio.levelUp) audio.levelUp();
    else if (s === 'pickup' && audio.pickupBig) audio.pickupBig();
    else if (s === 'coin' && audio.coin) audio.coin();
    else if (s === 'deposit' && audio.deposit) audio.deposit();
    else if (s === 'error' && audio.error) audio.error();
  }

  // === Creation ===
  function isCreated() { return companyStore.isCreated(); }

  function createCompany(name) {
    if (isCreated()) return { ok: false, reason: 'already_created' };
    const v = validateCompanyName(name);
    if (!v.ok) return { ok: false, reason: v.reason };
    const id = companyStore._uuid();
    companyStore.set({
      companyId: id,
      companyName: v.cleaned,
      foundedAt: Date.now()
    });
    tx({ type: 'COMPANY_CREATED', currency: null, amount: 0, balanceAfter: null, meta: { id, name: v.cleaned } });
    play('pickup');
    if (haptics && haptics.success) haptics.success();
    banner('🏢 Companie fondată: ' + v.cleaned);
    return { ok: true, id };
  }

  function renameCompany(newName) {
    if (!isCreated()) return { ok: false, reason: 'not_created' };
    const v = validateCompanyName(newName);
    if (!v.ok) return { ok: false, reason: v.reason };
    const old = companyStore.state.companyName;
    companyStore.set({ companyName: v.cleaned });
    tx({ type: 'COMPANY_RENAME', currency: null, amount: 0, balanceAfter: null, meta: { old, new: v.cleaned } });
    banner('Companie redenumită: ' + v.cleaned);
    return { ok: true };
  }

  // === XP + Level ===
  function grantCompanyXP(amount, meta = {}) {
    if (!isCreated()) return { levelsGained: 0 };
    if (amount <= 0) return { levelsGained: 0 };

    let curXp = companyStore.state.xp + amount;
    let curLevel = companyStore.state.level;
    let levelsGained = 0;
    const unlocksApplied = [];

    while (curLevel < COMPANY_MAX_LEVEL) {
      const info = COMPANY_LEVELS[curLevel - 1];
      if (!info || info.xpToNext === 0) break;
      if (curXp < info.xpToNext) break;
      curXp -= info.xpToNext;
      curLevel++;
      levelsGained++;
      const newInfo = COMPANY_LEVELS[curLevel - 1];
      if (newInfo && Array.isArray(newInfo.unlocks)) {
        for (const u of newInfo.unlocks) unlocksApplied.push(u);
      }
    }

    companyStore.set({
      xp: curXp,
      level: curLevel,
      totalXpEarned: companyStore.state.totalXpEarned + amount
    });
    tx({ type: 'COMPANY_XP', currency: 'xp', amount, balanceAfter: curXp, meta: { ...meta, level: curLevel } });

    if (levelsGained > 0) {
      // Apply unlocks
      for (const u of unlocksApplied) {
        if (u.startsWith('tier_')) {
          if (companyStore.addTierUnlock(u)) {
            const tier = TIER_BY_ID[u];
            banner('🎯 Tier deblocat: ' + (tier?.name || u));
          }
        } else if (u.startsWith('region_') && worldSystem && worldSystem.checkAndUnlock) {
          // Region unlock — WorldSystem verifica req + adauga
          worldSystem.checkAndUnlock(playerStore.state);
        }
      }
      tx({ type: 'COMPANY_LEVEL_UP', currency: null, amount: 0, balanceAfter: curLevel, meta: { newLevel: curLevel, gained: levelsGained, unlocks: unlocksApplied } });
      play('levelUp');
      if (haptics && haptics.heavy) haptics.heavy();
      banner('🏢 COMPANY LEVEL UP! → Nivel ' + curLevel);
    }

    return { levelsGained, unlocks: unlocksApplied };
  }

  // === Finances ===
  function earnRevenue(amount, meta = {}) {
    if (amount <= 0) return { ok: false, reason: 'zero' };
    if (!isCreated()) return { ok: false, reason: 'not_created' };
    const newFunds = companyStore.state.funds + amount;
    companyStore.set({
      funds: newFunds,
      totalRevenue: companyStore.state.totalRevenue + amount
    });
    tx({ type: 'COMPANY_REVENUE', currency: 'funds', amount, balanceAfter: newFunds, meta });
    return { ok: true, funds: newFunds };
  }

  function spendExpense(amount, meta = {}) {
    if (amount < 0) return { ok: false, reason: 'negative' };
    if (!isCreated()) return { ok: false, reason: 'not_created' };
    if (companyStore.state.funds < amount) return { ok: false, reason: 'insufficient_funds' };
    const newFunds = companyStore.state.funds - amount;
    companyStore.set({
      funds: newFunds,
      totalExpenses: companyStore.state.totalExpenses + amount
    });
    tx({ type: 'COMPANY_EXPENSE', currency: 'funds', amount, balanceAfter: newFunds, meta });
    return { ok: true, funds: newFunds };
  }

  // === Contract integration ===
  function applyContractResult(contract) {
    if (!isCreated()) return { skipped: true, reason: 'no_company' };
    if (!contract) return { skipped: true, reason: 'no_contract' };

    // Only for completed
    const completed = (contract.status === 'completed') || (contract.finalReward && contract.rating !== undefined);

    if (completed) {
      // Stats update
      companyStore.incStat('completedContracts', 1);
      const type = contract.type;
      if (type) companyStore.incContractType(type, 1);

      const rating = contract.rating || 0;
      companyStore.addRating(rating);

      // Streak
      const s = { ...companyStore.state.stats };
      s.currentStreak = (s.currentStreak || 0) + 1;
      if (s.currentStreak > (s.bestStreak || 0)) s.bestStreak = s.currentStreak;
      const coinsFinal = (contract.finalReward && contract.finalReward.coins) || 0;
      if (coinsFinal > (s.bestContractReward || 0)) s.bestContractReward = coinsFinal;
      if (coinsFinal > (s.largestContractCoins || 0)) s.largestContractCoins = coinsFinal;
      if (contract.massCleared) {
        s.totalSnowCleared = (s.totalSnowCleared || 0) + contract.massCleared;
      }
      companyStore.set({ stats: { ...s, contractsByType: { ...s.contractsByType } } });

      // Reputation gain (aplicat pe playerStore.reputation, cu bonus reputation_gain)
      const baseRep = reputationForRating(rating);
      const gainMult = companyStore.getUpgradeEffect('reputation_gain') || 1.0;
      const finalRep = Math.round(baseRep * gainMult);
      if (finalRep > 0) {
        playerStore.set({ reputation: (playerStore.state.reputation || 0) + finalRep });
        tx({ type: 'COMPANY_XP', currency: 'reputation', amount: finalRep, balanceAfter: playerStore.state.reputation, meta: { src: 'contract_bonus', contractId: contract.id, gainMult } });
      }

      // Company XP
      const baseCoins = (contract.baseReward && contract.baseReward.coins) || 0;
      const xp = companyXpForContract(baseCoins, rating);
      if (xp > 0) grantCompanyXP(xp, { src: 'contract', contractId: contract.id, rating });

      // Company Funds (bonus)
      const funds = companyFundsForContract(coinsFinal);
      if (funds > 0) earnRevenue(funds, { src: 'contract', contractId: contract.id });

      return { rating, xp, funds, rep: finalRep };
    }

    // Fail path
    if (contract.status === 'failed' || contract.failReason) {
      companyStore.incStat('failedContracts', 1);
      const s = { ...companyStore.state.stats };
      s.currentStreak = 0;
      companyStore.set({ stats: { ...s, contractsByType: { ...s.contractsByType } } });
      return { failed: true };
    }

    return { skipped: true };
  }

  // === Upgrades ===
  function buyUpgrade(upgradeId) {
    if (!isCreated()) return { ok: false, reason: 'not_created' };
    const cfg = COMPANY_UPGRADES[upgradeId];
    if (!cfg) return { ok: false, reason: 'unknown_upgrade' };
    const curLevel = companyStore.state.upgrades[upgradeId] || 0;
    if (curLevel >= cfg.maxLevel) return { ok: false, reason: 'max_level' };
    const nextLevel = curLevel + 1;
    const cost = cfg.costs[nextLevel];
    if (cost == null || cost < 0) return { ok: false, reason: 'invalid_cost' };
    if (companyStore.state.funds < cost) return { ok: false, reason: 'insufficient_funds' };

    const spent = spendExpense(cost, { src: 'upgrade', upgradeId, newLevel: nextLevel });
    if (!spent.ok) return spent;

    companyStore.setUpgrade(upgradeId, nextLevel);
    tx({ type: 'COMPANY_UPGRADE', currency: 'funds', amount: cost, balanceAfter: companyStore.state.funds, meta: { upgradeId, newLevel: nextLevel } });
    play('pickup');
    if (haptics && haptics.medium) haptics.medium();
    banner('⬆️ ' + cfg.name + ' → Nivel ' + nextLevel);
    return { ok: true, newLevel: nextLevel };
  }

  // === Contract requirements (tier + level + reputation) ===
  function checkContractRequirements(contract, playerState = playerStore.state) {
    const reasons = [];
    if (!contract) return { ok: false, reasons: ['unknown'] };

    if (contract.tier) {
      const tier = TIER_BY_ID[contract.tier];
      if (!tier) reasons.push({ type: 'unknown_tier', tierId: contract.tier });
      else {
        if (companyStore.state.level < tier.requiredLevel) {
          reasons.push({ type: 'company_level', required: tier.requiredLevel, current: companyStore.state.level });
        }
        if ((playerState.reputation || 0) < tier.requiredReputation) {
          reasons.push({ type: 'reputation', required: tier.requiredReputation, current: playerState.reputation || 0 });
        }
        if (!companyStore.isTierUnlocked(tier.id)) {
          reasons.push({ type: 'tier_locked', tierId: tier.id });
        }
      }
    }

    // Contract capacity check
    const capUpgrade = companyStore.getUpgradeEffect('contract_capacity') || 1;
    const active = getActiveAcceptedCount();
    if (active >= capUpgrade) {
      reasons.push({ type: 'company_capacity_reached', capacity: capUpgrade, active });
    }

    return { ok: reasons.length === 0, reasons };
  }

  function getActiveAcceptedCount() {
    if (!contractStore) return 0;
    let count = 0;
    const contracts = contractStore.state.contracts || {};
    for (const id in contracts) {
      const c = contracts[id];
      if (c.status === 'accepted' || c.status === 'active') count++;
    }
    return count;
  }

  function getContractCapacity() {
    return companyStore.getUpgradeEffect('contract_capacity') || 1;
  }

  function getFinancialSummary() {
    return {
      revenue: companyStore.state.totalRevenue,
      expenses: companyStore.state.totalExpenses,
      net: companyStore.state.totalRevenue - companyStore.state.totalExpenses,
      funds: companyStore.state.funds
    };
  }

  function getUnlockedContractTiers(playerState = playerStore.state) {
    return CONTRACT_TIERS.filter(t => {
      if (companyStore.state.level < t.requiredLevel) return false;
      if ((playerState.reputation || 0) < t.requiredReputation) return false;
      return true;
    });
  }

  function isTierUnlocked(tierId) {
    return companyStore.isTierUnlocked(tierId);
  }

  return {
    isCreated, createCompany, renameCompany,
    grantCompanyXP, earnRevenue, spendExpense,
    applyContractResult, buyUpgrade,
    checkContractRequirements, getActiveAcceptedCount, getContractCapacity,
    getFinancialSummary, getUnlockedContractTiers, isTierUnlocked
  };
}
