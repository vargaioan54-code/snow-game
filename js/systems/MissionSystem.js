// MissionSystem — subscribe la EventBus, track progress, auto-unlock achievements,
// claim rewards prin sistemele existente (economy/grantXP/companySystem).

import {
  DAILY_POOL, WEEKLY_POOL, PERMANENT_MISSIONS,
  DAILY_BY_ID, WEEKLY_BY_ID, PERMANENT_BY_ID,
  DAILY_MISSION_COUNT, WEEKLY_MISSION_COUNT,
  DAILY_RESET_HOURS, WEEKLY_RESET_HOURS,
  pickMissions, OBJECTIVE_TYPES
} from '../config/missions.js';
import { ACHIEVEMENTS, ACHIEVEMENT_BY_ID } from '../config/achievements.js';
import { EVENTS } from './EventBus.js';

const HOUR_MS = 3600 * 1000;

export function createMissionSystem(deps) {
  const {
    missionStore, playerStore, companyStore, worldStore, vehicleStore,
    economy, companySystem, transactionLog, audio, haptics, eventBus,
    grantPlayerXP, showBanner
  } = deps;

  // Tracking session (pentru USE_TOOL, USE_VEHICLE — evită dubluri per sesiune)
  const sessionToolsUsed = new Set();
  const sessionVehiclesUsed = new Set();

  function banner(txt) {
    if (typeof showBanner === 'function') showBanner(txt);
  }

  function _rollDaily() {
    const player = playerStore?.state || { level: 1 };
    const company = companyStore?.state || { level: 0 };
    const picked = pickMissions(DAILY_POOL, DAILY_MISSION_COUNT, player, company);
    const now = Date.now();
    const resetAt = now + DAILY_RESET_HOURS * HOUR_MS;
    const daily = {};
    for (const m of picked) {
      daily[m.id] = {
        defId: m.id,
        currentValue: 0,
        status: 'IN_PROGRESS',
        resetAt,
        completedAt: null,
        claimedAt: null
      };
    }
    missionStore.set({
      daily,
      dailyResetAt: resetAt,
      lastDailyRoll: now
    });
    try { transactionLog?.log({ type: 'MISSIONS_DAILY_ROLL', currency: 'none', amount: picked.length, balanceAfter: 0, meta: { count: picked.length } }); } catch {}
    banner('🎯 Misiuni zilnice noi disponibile!');
  }

  function _rollWeekly() {
    const player = playerStore?.state || { level: 1 };
    const company = companyStore?.state || { level: 0 };
    const picked = pickMissions(WEEKLY_POOL, WEEKLY_MISSION_COUNT, player, company);
    const now = Date.now();
    const resetAt = now + WEEKLY_RESET_HOURS * HOUR_MS;
    const weekly = {};
    for (const m of picked) {
      weekly[m.id] = {
        defId: m.id,
        currentValue: 0,
        status: 'IN_PROGRESS',
        resetAt,
        completedAt: null,
        claimedAt: null
      };
    }
    missionStore.set({
      weekly,
      weeklyResetAt: resetAt,
      lastWeeklyRoll: now
    });
    try { transactionLog?.log({ type: 'MISSIONS_WEEKLY_ROLL', currency: 'none', amount: picked.length, balanceAfter: 0, meta: { count: picked.length } }); } catch {}
    banner('📅 Misiuni săptămânale noi!');
  }

  function _ensurePermanent() {
    const state = missionStore.state;
    let changed = false;
    for (const def of PERMANENT_MISSIONS) {
      if (!state.permanent[def.id]) {
        state.permanent[def.id] = { defId: def.id, currentValue: 0, status: 'IN_PROGRESS', completedAt: null, claimedAt: null };
        changed = true;
      }
    }
    if (changed) missionStore.touch(['permanent']);
  }

  function _incrementMission(mission, defObj, amount, setAbsolute = false) {
    if (mission.status !== 'IN_PROGRESS') return false;
    const target = defObj.objective.target;
    const before = mission.currentValue;
    const after = setAbsolute
      ? Math.min(target, Math.max(before, amount))
      : Math.min(target, before + amount);
    if (after === before) return false;
    mission.currentValue = after;
    if (after >= target) {
      mission.status = 'COMPLETED';
      mission.completedAt = Date.now();
      try { audio?.pickupBig?.(); } catch {}
      try { haptics?.success?.(); } catch {}
      banner('✅ Misiune completă: ' + defObj.name || defObj.id);
      return true;
    }
    return false;
  }

  function _checkAchievement(ach, achDef, amount, setAbsolute = false) {
    if (ach.unlocked) return false;
    const target = achDef.objective.target;
    const before = ach.currentValue;
    const after = setAbsolute
      ? Math.min(target, Math.max(before, amount))
      : Math.min(target, before + amount);
    if (after === before) return false;
    ach.currentValue = after;
    if (after >= target) {
      _unlockAchievement(achDef.id);
      return true;
    }
    return false;
  }

  function _unlockAchievement(achId) {
    const ach = missionStore.state.achievements[achId];
    const def = ACHIEVEMENT_BY_ID[achId];
    if (!ach || !def || ach.unlocked) return false;
    ach.unlocked = true;
    ach.unlockedAt = Date.now();
    ach.currentValue = def.objective.target;
    // Auto-grant reward
    _applyReward(def.reward, { source: 'achievement', achId });
    ach.claimedAt = Date.now();
    missionStore.state.totalAchievementsUnlocked = (missionStore.state.totalAchievementsUnlocked || 0) + 1;
    missionStore.touch(['achievements', 'totalAchievementsUnlocked']);
    try { transactionLog?.log({ type: 'ACHIEVEMENT_UNLOCK', currency: 'none', amount: 1, balanceAfter: 0, meta: { achId, name: def.name } }); } catch {}
    try { audio?.starChime?.(3); } catch {}
    try { haptics?.success?.(); } catch {}
    banner('🏆 ' + def.name);
    return true;
  }

  function _applyReward(reward, meta = {}) {
    if (!reward) return;
    if (reward.coins && economy) {
      // Bypass bag cap — reward direct în vault via playerStore
      const before = playerStore.state.vaultCoins;
      playerStore.set({ vaultCoins: before + reward.coins });
      missionStore.state.totalClaimsCoins = (missionStore.state.totalClaimsCoins || 0) + reward.coins;
    }
    if (reward.xp && typeof grantPlayerXP === 'function') {
      grantPlayerXP(reward.xp, { source: meta.source || 'mission' });
      missionStore.state.totalClaimsXP = (missionStore.state.totalClaimsXP || 0) + reward.xp;
    }
    if (reward.reputation && playerStore) {
      playerStore.set({ reputation: (playerStore.state.reputation || 0) + reward.reputation });
    }
    if (reward.companyXP && companySystem) {
      try { companySystem.grantCompanyXP(reward.companyXP, { source: meta.source || 'mission' }); } catch {}
    }
  }

  function _handleEvent(type, payload) {
    const state = missionStore.state;
    let anyChanged = false;

    // Iterate daily/weekly/permanent + achievements
    const missionCats = [
      { cat: 'daily', byId: DAILY_BY_ID },
      { cat: 'weekly', byId: WEEKLY_BY_ID },
      { cat: 'permanent', byId: PERMANENT_BY_ID }
    ];

    for (const { cat, byId } of missionCats) {
      for (const [id, mission] of Object.entries(state[cat])) {
        const def = byId[mission.defId || id];
        if (!def) continue;
        if (mission.status !== 'IN_PROGRESS') continue;
        const objType = def.objective.type;
        const amount = _mapEventToAmount(type, payload, objType, def);
        if (amount === null) continue;
        const isAbsolute = (objType === OBJECTIVE_TYPES.REACH_PLAYER_LEVEL || objType === OBJECTIVE_TYPES.REACH_COMPANY_LEVEL);
        if (_incrementMission(mission, def, amount, isAbsolute)) anyChanged = true;
      }
    }

    for (const ach of Object.values(state.achievements)) {
      if (ach.unlocked) continue;
      const def = ACHIEVEMENT_BY_ID[Object.keys(state.achievements).find(k => state.achievements[k] === ach)];
    }
    // Iterate achievements by id (more reliable)
    for (const [achId, ach] of Object.entries(state.achievements)) {
      if (ach.unlocked) continue;
      const def = ACHIEVEMENT_BY_ID[achId];
      if (!def) continue;
      const objType = def.objective.type;
      const amount = _mapEventToAmount(type, payload, objType, def);
      if (amount === null) continue;
      const isAbsolute = (objType === OBJECTIVE_TYPES.REACH_PLAYER_LEVEL || objType === OBJECTIVE_TYPES.REACH_COMPANY_LEVEL);
      if (_checkAchievement(ach, def, amount, isAbsolute)) anyChanged = true;
    }

    if (anyChanged) missionStore.touch(['daily', 'weekly', 'permanent', 'achievements']);
  }

  function _mapEventToAmount(type, payload, objType, def) {
    switch (type) {
      case EVENTS.SNOW_CLEARED:
        if (objType === OBJECTIVE_TYPES.CLEAR_SNOW) return payload.amount || 0;
        if (objType === OBJECTIVE_TYPES.CLEAR_SNOW_TYPE && def.objective.snowType === payload.snowType) return payload.amount || 0;
        return null;
      case EVENTS.CONTRACT_COMPLETED:
        if (objType === OBJECTIVE_TYPES.COMPLETE_CONTRACT) return 1;
        if (objType === OBJECTIVE_TYPES.COMPLETE_CONTRACT_TIER && def.objective.tier === payload.tier) return 1;
        return null;
      case EVENTS.COINS_EARNED:
        if (objType === OBJECTIVE_TYPES.EARN_COINS) return payload.amount || 0;
        return null;
      case EVENTS.XP_EARNED:
        if (objType === OBJECTIVE_TYPES.EARN_XP) return payload.amount || 0;
        return null;
      case EVENTS.TOOL_USED:
        if (objType === OBJECTIVE_TYPES.USE_TOOL) {
          const toolId = payload.toolId;
          if (!toolId) return 1;
          if (sessionToolsUsed.has(toolId)) return null;
          sessionToolsUsed.add(toolId);
          return 1;
        }
        return null;
      case EVENTS.VEHICLE_USED:
      case EVENTS.VEHICLE_PURCHASED:
        if (objType === OBJECTIVE_TYPES.USE_VEHICLE) {
          const vid = payload.vehicleId;
          if (!vid) return 1;
          if (sessionVehiclesUsed.has(vid)) return null;
          sessionVehiclesUsed.add(vid);
          return 1;
        }
        return null;
      case EVENTS.VEHICLE_UPGRADED:
        if (objType === OBJECTIVE_TYPES.UPGRADE_VEHICLE) return 1;
        return null;
      case EVENTS.TOOL_UPGRADED:
        if (objType === OBJECTIVE_TYPES.UPGRADE_TOOL) return 1;
        return null;
      case EVENTS.FLEET_OP_COMPLETED:
        if (objType === OBJECTIVE_TYPES.COMPLETE_FLEET_OP) return 1;
        return null;
      case EVENTS.REGION_UNLOCKED:
        if (objType === OBJECTIVE_TYPES.UNLOCK_REGION) return 1;
        return null;
      case EVENTS.PLAYER_LEVEL_UP:
        if (objType === OBJECTIVE_TYPES.REACH_PLAYER_LEVEL) return payload.newLevel || 1;
        return null;
      case EVENTS.COMPANY_LEVEL_UP:
        if (objType === OBJECTIVE_TYPES.REACH_COMPANY_LEVEL) return payload.newLevel || 1;
        return null;
      case EVENTS.REPUTATION_EARNED:
        if (objType === OBJECTIVE_TYPES.EARN_REPUTATION) return payload.amount || 0;
        return null;
      case EVENTS.DEPOSIT_MADE:
        if (objType === OBJECTIVE_TYPES.DEPOSIT_COINS) return payload.amount || 0;
        return null;
      case EVENTS.EMPLOYEE_HIRED:
        if (objType === OBJECTIVE_TYPES.HIRE_EMPLOYEE) return 1;
        return null;
      default: return null;
    }
  }

  function initialize() {
    _ensurePermanent();
    if (missionStore.needsDailyReset() || Object.keys(missionStore.state.daily).length === 0) {
      _rollDaily();
    }
    if (missionStore.needsWeeklyReset() || Object.keys(missionStore.state.weekly).length === 0) {
      _rollWeekly();
    }
    // Subscribe to all events
    if (eventBus) {
      for (const type of Object.values(EVENTS)) {
        eventBus.on(type, (payload) => _handleEvent(type, payload));
      }
    }
    // Initial player/company level check (case: player already leveled up before missions initialized)
    if (playerStore?.state?.level) {
      _handleEvent(EVENTS.PLAYER_LEVEL_UP, { newLevel: playerStore.state.level });
    }
    if (companyStore?.state?.level) {
      _handleEvent(EVENTS.COMPANY_LEVEL_UP, { newLevel: companyStore.state.level });
    }
    // Region unlocks: count and simulate
    if (worldStore?.state?.unlockedRegions) {
      const n = worldStore.state.unlockedRegions.length;
      for (let i = 0; i < n; i++) _handleEvent(EVENTS.REGION_UNLOCKED, {});
    }
  }

  function claim(category, missionId) {
    const catMap = missionStore.state[category];
    const byId = category === 'daily' ? DAILY_BY_ID : category === 'weekly' ? WEEKLY_BY_ID : PERMANENT_BY_ID;
    if (!catMap) return { ok: false, reason: 'unknown_category' };
    const mission = catMap[missionId];
    if (!mission) return { ok: false, reason: 'unknown_mission' };
    if (mission.status === 'CLAIMED' || mission.claimedAt) return { ok: false, reason: 'already_claimed' };
    if (mission.status !== 'COMPLETED') return { ok: false, reason: 'not_completed' };
    const def = byId[mission.defId || missionId];
    if (!def) return { ok: false, reason: 'unknown_definition' };

    _applyReward(def.reward, { source: 'mission_' + category, missionId });
    mission.status = 'CLAIMED';
    mission.claimedAt = Date.now();
    missionStore.touch([category]);

    try {
      transactionLog?.log({
        type: 'MISSION_CLAIM',
        currency: 'coins',
        amount: def.reward.coins || 0,
        balanceAfter: playerStore.state.vaultCoins,
        meta: { category, missionId, reward: def.reward }
      });
    } catch {}

    const parts = [];
    if (def.reward.coins) parts.push('+' + def.reward.coins + ' 💰');
    if (def.reward.xp) parts.push('+' + def.reward.xp + ' XP');
    if (def.reward.reputation) parts.push('+' + def.reward.reputation + ' 🏆');
    banner('Recompensă: ' + parts.join(' · '));

    return { ok: true, reward: def.reward };
  }

  function checkTick() {
    if (missionStore.needsDailyReset()) _rollDaily();
    if (missionStore.needsWeeklyReset()) _rollWeekly();
  }

  return {
    initialize,
    claim,
    checkTick,
    // Public API for main.js emit hooks
    handleEvent: _handleEvent,
    // Debug helpers
    _rollDaily,
    _rollWeekly,
    _unlockAchievement,
    _applyReward,
    countCompletedUnclaimed: () => missionStore.countCompletedUnclaimed()
  };
}
