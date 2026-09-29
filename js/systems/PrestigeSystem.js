// Etapa 15 — PrestigeSystem
// Orchestrează cerințe, reset, permanent bonuses, endgame progression.
// Single source of truth pentru multiplicatori (getMultiplier).

import {
  PRESTIGE_MAX,
  VAULT_COIN_RETENTION,
  REPUTATION_RETENTION,
  prestigePermanentBonuses,
  prestigeRequirements
} from '../config/prestige.js';
import { ENDGAME_MILESTONES, ENDGAME_UNLOCK_PLAYER_LEVEL } from '../config/endgame.js';

export function createPrestigeSystem(deps = {}) {
  const {
    prestigeStore,
    playerStore,
    companyStore,
    worldStore,
    contractStore,
    missionStore,
    multiplayerStore,
    transactionLog,
    audio,
    haptics,
    showBanner,
    eventBus
  } = deps;

  let inProgress = false;

  function tx(entry) {
    try { transactionLog?.log(entry); } catch (e) { console.warn('[PrestigeSystem] tx err', e); }
  }

  function banner(text) {
    try { showBanner?.(text); } catch {}
  }

  // ---- Requirements check ----
  function checkRequirements() {
    if (!prestigeStore) return { ok: false, missing: [{ key: 'system', label: 'PrestigeStore lipsă' }] };
    if (prestigeStore.state.currentPrestige >= PRESTIGE_MAX) {
      return { ok: false, atMax: true, missing: [{ key: 'max', label: 'Rank maxim atins (Mythic)' }] };
    }

    const req = prestigeRequirements(prestigeStore.state.currentPrestige + 1);
    const missing = [];

    const pLvl = playerStore?.state?.level || 1;
    if (pLvl < req.playerLevel) {
      missing.push({ key: 'playerLevel', current: pLvl, required: req.playerLevel, label: `Player Level ${pLvl}/${req.playerLevel}` });
    }

    const cLvl = companyStore?.state?.level || 0;
    if (cLvl < req.companyLevel) {
      missing.push({ key: 'companyLevel', current: cLvl, required: req.companyLevel, label: `Company Level ${cLvl}/${req.companyLevel}` });
    }

    const rep = playerStore?.state?.reputation || 0;
    if (rep < req.reputation) {
      missing.push({ key: 'reputation', current: rep, required: req.reputation, label: `Reputation ${rep}/${req.reputation}` });
    }

    const contractsCompleted = Array.isArray(contractStore?.state?.completed) ? contractStore.state.completed.length : 0;
    if (contractsCompleted < req.contractsCompleted) {
      missing.push({ key: 'contractsCompleted', current: contractsCompleted, required: req.contractsCompleted, label: `Contracte ${contractsCompleted}/${req.contractsCompleted}` });
    }

    const regionsUnlocked = Array.isArray(worldStore?.state?.unlockedRegions) ? worldStore.state.unlockedRegions.length : 0;
    if (regionsUnlocked < req.unlockedRegions) {
      missing.push({ key: 'unlockedRegions', current: regionsUnlocked, required: req.unlockedRegions, label: `Regiuni ${regionsUnlocked}/${req.unlockedRegions}` });
    }

    const extremeCompleted = prestigeStore.state.extremeContractsCompleted || 0;
    if (extremeCompleted < req.extremeContractsCompleted) {
      missing.push({ key: 'extremeContractsCompleted', current: extremeCompleted, required: req.extremeContractsCompleted, label: `Contracte extreme ${extremeCompleted}/${req.extremeContractsCompleted}` });
    }

    // Multiplayer session activ → blocked
    if (multiplayerStore?.state?.currentSession) {
      missing.push({ key: 'multiplayer', label: 'Închide sesiunea multiplayer' });
    }

    // Contract activ → blocked
    if (contractStore?.state?.activeContractId) {
      missing.push({ key: 'activeContract', label: 'Termină contractul activ' });
    }

    return { ok: missing.length === 0, missing, req };
  }

  // ---- Preview reset ----
  function getPreview() {
    if (!prestigeStore || prestigeStore.state.currentPrestige >= PRESTIGE_MAX) return null;
    const nextRank = prestigeStore.state.currentPrestige + 1;

    const pState = playerStore?.state || {};
    const cState = companyStore?.state || {};

    const vaultBefore = pState.vaultCoins || 0;
    const vaultAfter = Math.round(vaultBefore * VAULT_COIN_RETENTION);
    const repBefore = pState.reputation || 0;
    const repAfter = Math.round(repBefore * REPUTATION_RETENTION);

    return {
      resetData: {
        playerLevel: pState.level || 1,
        playerXp: pState.xp || 0,
        bagCoins: pState.bagCoins || 0,
        vaultCoins: vaultBefore,
        reputation: repBefore,
        companyLevel: cState.level || 1,
        companyXp: cState.xp || 0,
        companyFunds: cState.funds || 0,
        companyUnlockedTiers: [...(cState.unlockedTiers || [])]
      },
      keepData: {
        vaultCoinsAfter: vaultAfter,
        reputationAfter: repAfter,
        diamonds: pState.diamonds || 0,
        ownedTools: [...(pState.owned || [])],
        toolUpgrades: JSON.parse(JSON.stringify(pState.toolUpgrades || {})),
        vaultRetention: VAULT_COIN_RETENTION,
        reputationRetention: REPUTATION_RETENTION,
        companyName: cState.companyName || '',
        companyId: cState.companyId || null,
        companyStats: cState.stats ? { ...cState.stats } : null
      },
      permanentBonusesGain: {
        before: prestigePermanentBonuses(prestigeStore.state.currentPrestige),
        after: prestigePermanentBonuses(nextRank)
      },
      nextRank
    };
  }

  // ---- Execute Prestige ----
  function executePrestige(opts = {}) {
    const bypassReq = !!opts.bypassRequirements;

    if (inProgress) return { ok: false, reason: 'in_progress' };
    if (!prestigeStore) return { ok: false, reason: 'no_store' };
    if (prestigeStore.state.currentPrestige >= PRESTIGE_MAX) {
      return { ok: false, reason: 'at_max' };
    }

    if (!bypassReq) {
      const chk = checkRequirements();
      if (!chk.ok) {
        return { ok: false, reason: 'requirements_not_met', missing: chk.missing };
      }
    }

    inProgress = true;

    try {
      // Snapshot BEFORE reset
      const pState = playerStore?.state || {};
      const cState = companyStore?.state || {};
      const snapshot = {
        playerLevel: pState.level || 1,
        playerXp: pState.xp || 0,
        vaultCoinsBefore: pState.vaultCoins || 0,
        reputationBefore: pState.reputation || 0,
        companyLevelBefore: cState.level || 1,
        companyXpBefore: cState.xp || 0,
        companyFundsBefore: cState.funds || 0
      };

      const nextRank = prestigeStore.state.currentPrestige + 1;

      // Update lifetime stats (aggregate before reset)
      const lif = {
        totalPrestigesEver: (prestigeStore.state.lifetime?.totalPrestigesEver || 0) + 1
      };
      if ((pState.level || 1) > (prestigeStore.state.lifetime?.highestPlayerLevel || 1)) {
        lif.highestPlayerLevel = pState.level || 1;
      }
      if ((cState.level || 1) > (prestigeStore.state.lifetime?.highestCompanyLevel || 1)) {
        lif.highestCompanyLevel = cState.level || 1;
      }
      if ((pState.reputation || 0) > (prestigeStore.state.lifetime?.highestReputation || 0)) {
        lif.highestReputation = pState.reputation || 0;
      }
      prestigeStore.updateLifetime(lif);

      // Apply RESET on playerStore
      if (playerStore) {
        const newVault = Math.round((pState.vaultCoins || 0) * VAULT_COIN_RETENTION);
        const newRep = Math.round((pState.reputation || 0) * REPUTATION_RETENTION);
        playerStore.set({
          level: 1,
          xp: 0,
          bagCoins: 0,
          vaultCoins: newVault,
          reputation: newRep
          // diamonds, owned, toolUpgrades, stats — PĂSTRATE (nu apar în patch)
        });
      }

      // Apply RESET on companyStore
      if (companyStore) {
        companyStore.set({
          level: 1,
          xp: 0,
          funds: 100,
          unlockedTiers: ['tier_1']
          // companyId, companyName, foundedAt, stats — PĂSTRATE
        });
      }

      // Reset MissionStore daily/weekly (păstrează achievements)
      if (missionStore) {
        try {
          missionStore.set({ daily: {}, weekly: {}, dailyResetAt: null, weeklyResetAt: null });
        } catch (e) { console.warn('[Prestige] missionStore reset err', e); }
      }

      // Update PrestigeStore itself
      const newHigh = Math.max(nextRank, prestigeStore.state.highestPrestige || 0);
      const appliedBonuses = prestigePermanentBonuses(nextRank);
      prestigeStore.set({
        currentPrestige: nextRank,
        highestPrestige: newHigh,
        totalPrestiges: (prestigeStore.state.totalPrestiges || 0) + 1,
        lastPrestigeAt: Date.now()
      });
      prestigeStore.pushHistory({
        prestigeRank: nextRank,
        timestamp: Date.now(),
        resetSnapshot: snapshot,
        appliedBonuses
      });

      // Transaction log
      tx({
        type: 'PRESTIGE_EXECUTE',
        currency: null,
        amount: nextRank,
        balanceAfter: null,
        meta: { newRank: nextRank, snapshot }
      });
      tx({
        type: 'PRESTIGE_BONUS_APPLY',
        currency: null,
        amount: nextRank,
        balanceAfter: null,
        meta: { bonuses: appliedBonuses }
      });

      // Audio + haptics + banner
      try { audio?.levelUp?.(); } catch {}
      try { haptics?.heavy?.(); } catch {}
      banner(`🏆 PRESTIGE! Rank ${nextRank} — Bonuses aplicate`);

      // Event emit
      try { eventBus?.emit?.('prestige.up', { newRank: nextRank, bonuses: appliedBonuses }); } catch {}

      // Endgame unlock check după reset
      checkEndgameUnlock();

      return { ok: true, newRank: nextRank, bonuses: appliedBonuses, snapshot };
    } catch (e) {
      console.error('[PrestigeSystem] executePrestige error', e);
      return { ok: false, reason: 'exception', error: String(e) };
    } finally {
      inProgress = false;
    }
  }

  // ---- Multipliers (single source of truth pentru bonuses) ----
  function getMultiplier(type) {
    if (!prestigeStore) return 1;
    const b = prestigePermanentBonuses(prestigeStore.state.currentPrestige);
    switch (type) {
      case 'xp':              return b.xpMultiplier;
      case 'coin':            return b.coinMultiplier;
      case 'snow_clear':      return b.snowClearMultiplier;
      case 'contract_reward': return b.contractRewardMultiplier;
      case 'reputation':      return b.reputationMultiplier;
      case 'capacity':        return b.capacityBonus; // additive, nu multiplicativ
      default:                return 1;
    }
  }

  // ---- Endgame ----
  function checkEndgameUnlock() {
    if (!prestigeStore) return false;
    const pLvl = playerStore?.state?.level || 1;
    if (pLvl >= ENDGAME_UNLOCK_PLAYER_LEVEL && !prestigeStore.state.endgameContractsAvailable) {
      prestigeStore.set({ endgameContractsAvailable: true });
      tx({
        type: 'ENDGAME_UNLOCK',
        currency: null,
        amount: pLvl,
        balanceAfter: null,
        meta: { atLevel: pLvl }
      });
      banner('🌪️ Endgame Contracts Unlocked!');
      try { eventBus?.emit?.('endgame.unlocked', { atLevel: pLvl }); } catch {}
      return true;
    }
    return false;
  }

  function onExtremeContractComplete(contractId) {
    if (!prestigeStore) return;
    const cur = prestigeStore.state.extremeContractsCompleted || 0;
    prestigeStore.set({ extremeContractsCompleted: cur + 1 });
    prestigeStore.incLifetime('totalExtremeCompleted', 1);

    tx({
      type: 'ENDGAME_CONTRACT_COMPLETE',
      currency: null,
      amount: 1,
      balanceAfter: cur + 1,
      meta: { contractId }
    });

    try { eventBus?.emit?.('extreme.contract.completed', { contractId, totalCompleted: cur + 1 }); } catch {}

    // Milestone check
    const total = cur + 1;
    for (const ms of ENDGAME_MILESTONES) {
      if (total >= ms.target && !prestigeStore.state.endgameMilestonesCompleted.includes(ms.id)) {
        const added = prestigeStore.addMilestone(ms.id);
        if (added) {
          tx({
            type: 'PRESTIGE_MILESTONE',
            currency: null,
            amount: ms.target,
            balanceAfter: null,
            meta: { milestoneId: ms.id, name: ms.name }
          });
          banner(`🏅 Milestone: ${ms.name}`);
        }
      }
    }
  }

  return {
    checkRequirements,
    getPreview,
    executePrestige,
    getMultiplier,
    checkEndgameUnlock,
    onExtremeContractComplete,
    isInProgress: () => inProgress
  };
}
