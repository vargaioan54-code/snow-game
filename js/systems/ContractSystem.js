// ContractSystem — orchestreaza fluxul contractelor:
//   accept -> start -> updateProgress -> complete/fail -> reward
// Toate mutatiile trec prin ContractStore. Nu atinge DOM.

import { CONTRACT_STATUS, ACCEPT_REJECT_REASONS, FAIL_REASONS } from '../config/contractStatus.js';
import { ratingMultiplier } from '../config/contracts.js';
import { LOCATION_BY_ID } from '../config/locations.js';

// Screens noi (evitam import ciclic: keeping strings sync cu GameState.SCREENS)
const SCREEN_PLAYING = 'playing';
const SCREEN_RESULTS = 'results_open';

export function createContractSystem(deps) {
  const {
    contractStore, playerStore, economy, environment,
    gameState, transactionLog, unlockSystem, audio, haptics,
    worldSystem,   // Etapa 4 — optional
    weatherSystem, // Etapa 5 — optional
    vehicleStore   // Etapa 6 — optional (pentru preferredVehicle bonus)
  } = deps;

  // Etapa 8 — companySystem poate fi injectat lazy prin setCompanySystem()
  let companySystem = deps.companySystem || null;
  function setCompanySystem(cs) { companySystem = cs; }

  // Etapa 15 — prestigeSystem injectat lazy (pentru contract_reward multiplier + extreme completion hook)
  let prestigeSystem = deps.prestigeSystem || null;
  function setPrestigeSystem(ps) { prestigeSystem = ps; }

  let updateThrottleMs = 200; // 5Hz
  let _lastUpdate = 0;

  function tx(entry) { if (transactionLog) transactionLog.log(entry); }

  // === CHECKS ===

  function _hasActive() {
    const id = contractStore.state.activeContractId;
    if (!id) return false;
    const c = contractStore.state.contracts[id];
    if (!c) return false;
    return c.status === CONTRACT_STATUS.ACCEPTED || c.status === CONTRACT_STATUS.ACTIVE;
  }

  // === API ===

  function accept(id) {
    const c = contractStore.state.contracts[id];
    if (!c) return { ok: false, reason: ACCEPT_REJECT_REASONS.UNKNOWN };
    if (c.status !== CONTRACT_STATUS.AVAILABLE) {
      return { ok: false, reason: ACCEPT_REJECT_REASONS.NOT_AVAILABLE };
    }
    if (_hasActive()) return { ok: false, reason: ACCEPT_REJECT_REASONS.ACTIVE_EXISTS };
    // Level unlock check
    const lvl = playerStore.state.level || 1;
    if (c.unlockLevel > lvl) {
      return { ok: false, reason: ACCEPT_REJECT_REASONS.LEVEL_LOCKED, requiredLevel: c.unlockLevel };
    }
    // Tool required check
    if (c.requiredTool && !playerStore.state.owned.includes(c.requiredTool)) {
      return { ok: false, reason: ACCEPT_REJECT_REASONS.TOOL_LOCKED, requiredTool: c.requiredTool };
    }
    // Etapa 8 — Company checks (tier + capacity)
    if (companySystem && companySystem.isCreated()) {
      const chk = companySystem.checkContractRequirements(c, playerStore.state);
      if (!chk.ok) {
        const first = chk.reasons[0];
        if (first?.type === 'company_level' || first?.type === 'reputation' || first?.type === 'tier_locked') {
          return { ok: false, reason: 'tier_locked', tier: c.tier, requiredLevel: first.required, requiredReputation: first.type === 'reputation' ? first.required : undefined, details: chk.reasons };
        }
        if (first?.type === 'company_capacity_reached') {
          return { ok: false, reason: 'company_capacity_reached', capacity: first.capacity };
        }
      }
    }

    // Etapa 4 — Location unlock check
    if (worldSystem && c.locationId) {
      const loc = LOCATION_BY_ID[c.locationId];
      if (loc) {
        const st = worldSystem.statusForLocation(c.locationId, playerStore.state);
        if (st === 'LOCKED') {
          const info = unlockSystem.getLocationLockReason
            ? unlockSystem.getLocationLockReason(loc, playerStore.state)
            : null;
          return { ok: false, reason: 'location_locked', requiredLevel: info?.requiredLevel };
        }
      }
    }

    // Etapa 5 — snapshot weather la acceptare (pt statistici)
    const weatherAtAccept = (weatherSystem && weatherSystem.getCurrent)
      ? weatherSystem.getCurrent().id
      : null;

    contractStore.updateContract(id, {
      status: CONTRACT_STATUS.ACCEPTED,
      acceptedAt: Date.now(),
      progress: 0,
      massCleared: 0,
      rejectedByCompat: 0,
      weatherAtAccept
    });
    contractStore.setActive(id);
    if (audio && typeof audio.contractAccept === 'function') audio.contractAccept();
    if (haptics && typeof haptics.medium === 'function') haptics.medium();
    return { ok: true, id };
  }

  function start(id) {
    const c = contractStore.state.contracts[id];
    if (!c) return { ok: false, reason: ACCEPT_REJECT_REASONS.UNKNOWN };
    if (c.status !== CONTRACT_STATUS.ACCEPTED) {
      return { ok: false, reason: ACCEPT_REJECT_REASONS.NOT_AVAILABLE };
    }
    const now = Date.now();
    contractStore.updateContract(id, {
      status: CONTRACT_STATUS.ACTIVE,
      startedAt: now,
      deadline: c.timeLimit > 0 ? now + c.timeLimit * 1000 : 0
    });
    contractStore.setActive(id);
    // Etapa 4 — Auto-enter location at contract start (teleport character to spawn)
    if (worldSystem && c.locationId) {
      worldSystem.enterLocation(c.locationId);
    }
    if (gameState) gameState.setScreen(SCREEN_PLAYING);
    return { ok: true };
  }

  function cancel(id) {
    const c = contractStore.state.contracts[id];
    if (!c) return { ok: false, reason: ACCEPT_REJECT_REASONS.UNKNOWN };
    if (c.status !== CONTRACT_STATUS.ACCEPTED) {
      return { ok: false, reason: 'not_cancellable' };
    }
    contractStore.updateContract(id, {
      status: CONTRACT_STATUS.AVAILABLE,
      acceptedAt: 0
    });
    if (contractStore.state.activeContractId === id) contractStore.setActive(null);
    return { ok: true };
  }

  // Player reporteaza incercare cu tool incompat (din main.js melt.rejected > 0)
  function reportRejection(count = 1) {
    const active = contractStore.getActive();
    if (!active || active.status !== CONTRACT_STATUS.ACTIVE) return;
    contractStore.updateContract(active.id, {
      rejectedByCompat: (active.rejectedByCompat || 0) + count
    });
  }

  // Throttle-based update: chemat frecvent din game loop, dar actualizeaza only ~5Hz
  function updateProgress(dt) {
    const active = contractStore.getActive();
    if (!active || active.status !== CONTRACT_STATUS.ACTIVE) return;

    _lastUpdate += dt * 1000;
    if (_lastUpdate < updateThrottleMs) return;
    _lastUpdate = 0;

    // Timer check
    if (active.deadline > 0 && Date.now() >= active.deadline) {
      fail(active.id, FAIL_REASONS.TIMEOUT);
      return;
    }

    // Progress din environment
    if (environment && typeof environment.getProgressInArea === 'function') {
      const info = environment.getProgressInArea(active.area.x, active.area.z, active.area.radius);
      const patch = {
        progress: info.clearedFraction,
        massCleared: info.massCleared
      };
      contractStore.updateContract(active.id, patch);

      // Completion check
      if (info.clearedFraction >= active.targetPct) {
        complete(active.id);
      }
    }
  }

  function computeRating(c) {
    let stars = 0;
    if (c.progress >= c.targetPct) stars++;
    // +1 daca aproape 100%
    if (c.progress > 0.98) stars++;
    // +1 daca a folosit tool-ul corect (0 rejections)
    if ((c.rejectedByCompat || 0) === 0) stars++;
    // +1 daca s-a incheiat in <50% timp
    if (c.timeLimit > 0 && c.startedAt > 0 && c.completedAt > 0) {
      const elapsed = (c.completedAt - c.startedAt) / 1000;
      if (elapsed < c.timeLimit * 0.5) stars++;
    } else if (c.timeLimit === 0) {
      // fara timer -> presupunem +1 bonus
      stars++;
    }
    // +1 eficienta: massCleared / timp >= threshold (ex: >=0.6 * requiredMass / timeLimit)
    if (c.timeLimit > 0 && c.startedAt > 0 && c.completedAt > 0) {
      const elapsed = Math.max(1, (c.completedAt - c.startedAt) / 1000);
      const efficiency = c.massCleared / elapsed; // mass/sec
      const threshold = (c.requiredMass / c.timeLimit) * 0.8;
      if (efficiency >= threshold) stars++;
    }
    return Math.max(0, Math.min(5, stars));
  }

  function computeReward(c, rating) {
    const mult = ratingMultiplier(rating);
    // Etapa 5 — weather difficulty bonus la reward final
    let weatherMult = 1.0;
    if (weatherSystem && typeof weatherSystem.getDifficultyMod === 'function') {
      weatherMult = weatherSystem.getDifficultyMod() || 1.0;
    }
    // Etapa 6 — preferredVehicle bonus
    let vehicleMult = 1.0;
    if (vehicleStore && c.preferredVehicle) {
      const active = vehicleStore.state.activeVehicleId;
      const inVehicle = vehicleStore.state.isPlayerInVehicle;
      if (inVehicle && active === c.preferredVehicle) vehicleMult = 1.3;
    }
    // Etapa 15 — Prestige contract_reward + reputation multipliers
    let prestigeMult = 1.0;
    let prestigeRepMult = 1.0;
    if (prestigeSystem && typeof prestigeSystem.getMultiplier === 'function') {
      prestigeMult = prestigeSystem.getMultiplier('contract_reward') || 1.0;
      prestigeRepMult = prestigeSystem.getMultiplier('reputation') || 1.0;
    }
    return {
      coins:      Math.round((c.baseReward.coins || 0) * mult * weatherMult * vehicleMult * prestigeMult),
      xp:         Math.round((c.baseReward.xp || 0) * mult * weatherMult * vehicleMult * prestigeMult),
      reputation: Math.round((c.baseReward.reputation || 0) * mult * weatherMult * vehicleMult * prestigeRepMult),
      _weatherMult: weatherMult,
      _vehicleMult: vehicleMult,
      _prestigeMult: prestigeMult,
      _prestigeRepMult: prestigeRepMult
    };
  }

  function complete(id) {
    const c = contractStore.state.contracts[id];
    if (!c) return { ok: false, reason: ACCEPT_REJECT_REASONS.UNKNOWN };
    // Protectie dubla revendicare
    if (c.status === CONTRACT_STATUS.COMPLETED) return { ok: false, reason: 'already_completed' };
    if (c.status !== CONTRACT_STATUS.ACTIVE) return { ok: false, reason: 'not_active' };

    const now = Date.now();
    const patchStart = { status: CONTRACT_STATUS.COMPLETED, completedAt: now };
    contractStore.updateContract(id, patchStart);

    // Reload updated ref
    const finalC = contractStore.state.contracts[id];
    const rating = computeRating(finalC);
    const reward = computeReward(finalC, rating);

    // Aplica reward-uri prin sistemele existente
    // Coins: direct in vault (nu prin earnCoins care e limitat de bag)
    if (reward.coins > 0) {
      const before = playerStore.state.vaultCoins;
      playerStore.set({ vaultCoins: before + reward.coins });
      tx({
        type: 'CONTRACT_REWARD',
        currency: 'coins',
        amount: reward.coins,
        balanceAfter: { bag: playerStore.state.bagCoins, vault: playerStore.state.vaultCoins },
        meta: { contractId: id, rating }
      });
    }
    // Reputation
    if (reward.reputation > 0) {
      playerStore.set({ reputation: playerStore.state.reputation + reward.reputation });
      tx({
        type: 'CONTRACT_REPUTATION',
        currency: 'reputation',
        amount: reward.reputation,
        balanceAfter: playerStore.state.reputation,
        meta: { contractId: id, rating }
      });
    }
    // XP — level up handled extern (main.js:grantXP); dar tx-ul il logam aici
    if (reward.xp > 0) {
      // notify main.js via callback daca disponibil (via deps.grantXP)
      if (typeof deps.grantXP === 'function') {
        deps.grantXP(reward.xp, { source: 'contract', contractId: id });
      } else {
        playerStore.set({ xp: playerStore.state.xp + reward.xp });
      }
      tx({
        type: 'CONTRACT_XP',
        currency: 'xp',
        amount: reward.xp,
        balanceAfter: playerStore.state.xp,
        meta: { contractId: id, rating }
      });
    }

    // Save final state + rating + reward pe contract
    contractStore.updateContract(id, {
      rating,
      finalReward: reward
    });
    contractStore.addToCompleted(id);
    contractStore.setActive(null);

    // Statistici
    if (typeof playerStore.incStat === 'function') {
      playerStore.incStat('contractsCompleted', 1);
    }

    // Etapa 4 — marcheaza area completa + auto-unlock check
    if (worldSystem) {
      if (finalC.areaId) worldSystem.checkAreaComplete(finalC.areaId);
      worldSystem.checkAndUnlock(playerStore.state);
    }

    // Etapa 8 — Company XP + funds + reputation bonus + stats
    if (companySystem && companySystem.isCreated()) {
      try { companySystem.applyContractResult(finalC); } catch (e) { console.warn('[CompanySystem] applyContractResult err', e); }
    }

    // Etapa 15 — Prestige: track extreme contract completion (tier_endgame)
    if (prestigeSystem && finalC.tier === 'tier_endgame' && typeof prestigeSystem.onExtremeContractComplete === 'function') {
      try { prestigeSystem.onExtremeContractComplete(finalC.id); } catch (e) { console.warn('[PrestigeSystem] onExtremeContractComplete err', e); }
    }

    // Audio + haptics
    if (audio && typeof audio.contractComplete === 'function') audio.contractComplete();
    if (audio && typeof audio.starChime === 'function') {
      for (let i = 0; i < rating; i++) {
        setTimeout(() => audio.starChime(i), 300 + i * 180);
      }
    }
    if (haptics && typeof haptics.success === 'function') haptics.success();

    // Trigger screen
    if (gameState) gameState.setScreen(SCREEN_RESULTS);

    return { ok: true, rating, reward };
  }

  function fail(id, reason = FAIL_REASONS.ABORTED) {
    const c = contractStore.state.contracts[id];
    if (!c) return { ok: false, reason: ACCEPT_REJECT_REASONS.UNKNOWN };
    if (c.status === CONTRACT_STATUS.FAILED) return { ok: false, reason: 'already_failed' };
    if (c.status !== CONTRACT_STATUS.ACTIVE) return { ok: false, reason: 'not_active' };

    contractStore.updateContract(id, {
      status: CONTRACT_STATUS.FAILED,
      completedAt: Date.now(),
      finalReward: { coins: 0, xp: 0, reputation: 0 },
      failReason: reason
    });
    contractStore.addToFailed(id);
    contractStore.setActive(null);

    // Etapa 8 — mark fail in company stats
    if (companySystem && companySystem.isCreated()) {
      try {
        const failedC = contractStore.state.contracts[id];
        companySystem.applyContractResult(failedC);
      } catch (e) { /* silent */ }
    }

    if (audio && typeof audio.contractFail === 'function') audio.contractFail();
    if (haptics && typeof haptics.heavy === 'function') haptics.heavy();

    if (gameState) gameState.setScreen(SCREEN_RESULTS);

    return { ok: true, reason };
  }

  // Etapa 9 — complete un contract prin fleet operation (fara area check, cu reward pre-calculat)
  function completeFromFleet(contractId, rating, actualReward) {
    const c = contractStore.state.contracts[contractId];
    if (!c) return { ok: false, reason: ACCEPT_REJECT_REASONS.UNKNOWN };
    if (c.status === CONTRACT_STATUS.COMPLETED) return { ok: false, reason: 'already_completed' };

    const now = Date.now();
    const safeReward = {
      coins: Math.max(0, Math.round(actualReward?.coins || 0)),
      xp: Math.max(0, Math.round(actualReward?.xp || 0)),
      reputation: Math.max(0, Math.round(actualReward?.reputation || 0))
    };
    const safeRating = Math.max(0, Math.min(5, Math.round(rating || 0)));

    contractStore.updateContract(contractId, {
      status: CONTRACT_STATUS.COMPLETED,
      completedAt: now,
      rating: safeRating,
      finalReward: safeReward
    });

    // Apply rewards direct la player (vault + reputation)
    if (safeReward.coins > 0) {
      const beforeVault = playerStore.state.vaultCoins;
      playerStore.set({ vaultCoins: beforeVault + safeReward.coins });
      tx({ type: 'CONTRACT_REWARD', currency: 'coins', amount: safeReward.coins,
           balanceAfter: { bag: playerStore.state.bagCoins, vault: playerStore.state.vaultCoins },
           meta: { contractId, rating: safeRating, source: 'fleet' } });
    }
    if (safeReward.reputation > 0) {
      playerStore.set({ reputation: playerStore.state.reputation + safeReward.reputation });
      tx({ type: 'CONTRACT_REPUTATION', currency: 'reputation', amount: safeReward.reputation,
           balanceAfter: playerStore.state.reputation, meta: { contractId, source: 'fleet' } });
    }
    if (safeReward.xp > 0) {
      if (typeof deps.grantXP === 'function') {
        deps.grantXP(safeReward.xp, { source: 'fleet', contractId });
      } else {
        playerStore.set({ xp: playerStore.state.xp + safeReward.xp });
      }
      tx({ type: 'CONTRACT_XP', currency: 'xp', amount: safeReward.xp,
           balanceAfter: playerStore.state.xp, meta: { contractId, source: 'fleet' } });
    }

    // Contract state final
    contractStore.addToCompleted(contractId);

    // Player + Company stats
    if (typeof playerStore.incStat === 'function') {
      playerStore.incStat('contractsCompleted', 1);
    }
    if (companySystem && companySystem.isCreated()) {
      try { companySystem.applyContractResult(contractStore.state.contracts[contractId]); }
      catch (e) { console.warn('[CompanySystem] applyContractResult(fleet) err', e); }
    }

    return { ok: true, rating: safeRating, reward: safeReward };
  }

  // Reset un contract completat/esuat inapoi la AVAILABLE (pt retry)
  function reset(id) {
    const c = contractStore.state.contracts[id];
    if (!c) return { ok: false };
    contractStore.updateContract(id, {
      status: CONTRACT_STATUS.AVAILABLE,
      acceptedAt: 0, startedAt: 0, completedAt: 0, deadline: 0,
      progress: 0, massCleared: 0, rating: 0, finalReward: null,
      rejectedByCompat: 0
    });
    return { ok: true };
  }

  return {
    accept, start, cancel, updateProgress, complete, fail, completeFromFleet, setPrestigeSystem,
    computeRating, computeReward, reportRejection, reset,
    setCompanySystem
  };
}
