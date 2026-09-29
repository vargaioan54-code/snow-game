// EventSystem — orchestrare Events + Seasons.
// Consumă EventBus (Etapa 10) pentru progress, aplică rewards prin sistemele existente.

import { EVENTS, EVENT_BY_ID, SEASONS, SEASON_BY_ID, EVENT_STATUS, SEASON_STATUS } from '../config/events.js';
import { OBJECTIVE_TYPES } from '../config/missions.js';

export function createEventSystem(deps) {
  const {
    eventStore, playerStore, companyStore, worldStore,
    weatherStore, weatherSystem,
    economy, companySystem, transactionLog,
    audio, haptics, eventBus,
    grantPlayerXP, showBanner
  } = deps;

  let initialized = false;

  function _now() { return Date.now(); }

  function _log(type, meta = {}) {
    if (transactionLog?.log) {
      try { transactionLog.log({ type, currency: null, amount: 0, meta }); } catch {}
    }
  }

  function _banner(msg) {
    if (typeof showBanner === 'function') { try { showBanner(msg); } catch {} }
  }

  function _audio(name) {
    if (audio && typeof audio[name] === 'function') { try { audio[name](); } catch {} }
  }

  function _hap(name) {
    if (haptics && typeof haptics[name] === 'function') { try { haptics[name](); } catch {} }
  }

  function _computeTimestamps(def) {
    const install = eventStore.state.installTime || _now();
    const startsAt = install + (def.startOffsetMs || 0);
    const endsAt = startsAt + (def.durationMs || 0);
    return { startsAt, endsAt };
  }

  function _requirementsMet(def) {
    const req = def.requirements || {};
    if (req.playerLevel && (playerStore?.state?.level || 1) < req.playerLevel) return false;
    if (req.companyLevel && (companyStore?.state?.level || 0) < req.companyLevel) return false;
    if (Array.isArray(req.regions) && req.regions.length > 0) {
      const unlocked = worldStore?.state?.unlockedRegions || [];
      for (const r of req.regions) if (!unlocked.includes(r)) return false;
    }
    return true;
  }

  function _requirementReasons(def) {
    const req = def.requirements || {};
    const missing = [];
    const pLevel = playerStore?.state?.level || 1;
    const cLevel = companyStore?.state?.level || 0;
    if (req.playerLevel && pLevel < req.playerLevel) missing.push(`Nivel Player ${req.playerLevel} (ai ${pLevel})`);
    if (req.companyLevel && cLevel < req.companyLevel) missing.push(`Nivel Companie ${req.companyLevel} (ai ${cLevel})`);
    if (Array.isArray(req.regions) && req.regions.length > 0) {
      const unlocked = worldStore?.state?.unlockedRegions || [];
      for (const r of req.regions) if (!unlocked.includes(r)) missing.push(`Regiune: ${r}`);
    }
    return missing;
  }

  function _allObjectivesComplete(def, ev) {
    for (const obj of def.objectives) {
      if (!ev.objectivesCompleted[obj.id]) return false;
    }
    return true;
  }

  function _recalcEvent(id) {
    const def = EVENT_BY_ID[id];
    const ev = eventStore.state.events[id];
    if (!def || !ev) return;
    if (def.active === false) { ev.status = EVENT_STATUS.DISABLED; return; }
    const { startsAt, endsAt } = _computeTimestamps(def);
    const now = _now();
    const prevStatus = ev.status;

    if (ev.claimedAt) {
      ev.status = EVENT_STATUS.COMPLETED;
      return;
    }

    if (now < startsAt) {
      ev.status = EVENT_STATUS.UPCOMING;
      ev.startedAt = null;
      ev.expiresAt = startsAt;
      return;
    }

    if (now >= endsAt) {
      if (_allObjectivesComplete(def, ev)) {
        ev.status = EVENT_STATUS.COMPLETED;
        if (!ev.completedAt) ev.completedAt = endsAt;
      } else {
        ev.status = EVENT_STATUS.EXPIRED;
        if (prevStatus !== EVENT_STATUS.EXPIRED) {
          _log('EVENT_EXPIRE', { eventId: id });
        }
      }
      return;
    }

    // In window: check requirements
    if (!_requirementsMet(def)) {
      ev.status = EVENT_STATUS.LOCKED;
      ev.expiresAt = endsAt;
      return;
    }

    // ACTIVE
    if (prevStatus !== EVENT_STATUS.ACTIVE) {
      ev.startedAt = ev.startedAt || startsAt;
      ev.expiresAt = endsAt;
      if (prevStatus !== EVENT_STATUS.LOCKED && prevStatus !== EVENT_STATUS.COMPLETED) {
        _log('EVENT_START', { eventId: id });
      }
    }
    ev.status = EVENT_STATUS.ACTIVE;

    // Check completion
    if (_allObjectivesComplete(def, ev) && !ev.completedAt) {
      ev.completedAt = now;
      ev.status = EVENT_STATUS.COMPLETED;
      _log('EVENT_COMPLETE', { eventId: id });
      _banner(`✅ Eveniment finalizat: ${def.name}`);
      _audio('pickupBig');
      _hap('success');
    }

    // Apply weather modifier (single-shot)
    if (ev.status === EVENT_STATUS.ACTIVE && !ev.weatherApplied && def.modifiers?.weatherType && weatherSystem?.setWeather) {
      try { weatherSystem.setWeather(def.modifiers.weatherType); } catch {}
      ev.weatherApplied = true;
    }
  }

  function _recalcSeason(id) {
    const def = SEASON_BY_ID[id];
    const s = eventStore.state.seasons[id];
    if (!def || !s) return;
    if (def.active === false) { s.status = SEASON_STATUS.DISABLED; return; }
    const install = eventStore.state.installTime || _now();
    const startsAt = install + (def.startOffsetMs || 0);
    const endsAt = startsAt + (def.durationMs || 0);
    const now = _now();
    const prev = s.status;

    if (now < startsAt) {
      s.status = SEASON_STATUS.UPCOMING;
      s.startedAt = null;
      s.endsAt = startsAt;
    } else if (now >= endsAt) {
      s.status = SEASON_STATUS.ENDED;
      if (!s.endedAt) s.endedAt = endsAt;
      if (prev !== SEASON_STATUS.ENDED) {
        _log('SEASON_END', { seasonId: id });
        // Auto-claim season reward if >=50% events complete
        _maybeGrantSeasonReward(id);
      }
    } else {
      s.status = SEASON_STATUS.ACTIVE;
      if (!s.startedAt) s.startedAt = startsAt;
      s.endsAt = endsAt;
      if (prev !== SEASON_STATUS.ACTIVE) _log('SEASON_START', { seasonId: id });
    }
  }

  function _recalculateAll() {
    for (const id of Object.keys(eventStore.state.events)) _recalcEvent(id);
    for (const id of Object.keys(eventStore.state.seasons)) _recalcSeason(id);
    eventStore.touch(['events', 'seasons']);
  }

  function _incrementObjective(eventId, objId, amount, absolute = false) {
    const def = EVENT_BY_ID[eventId];
    const ev = eventStore.state.events[eventId];
    if (!def || !ev) return;
    if (ev.status !== EVENT_STATUS.ACTIVE) return;
    const objDef = def.objectives.find(o => o.id === objId);
    if (!objDef) return;
    if (ev.objectivesCompleted[objId]) return;

    const cur = ev.progress[objId] || 0;
    const next = absolute ? Math.max(cur, amount) : (cur + amount);
    const clamped = Math.min(objDef.target, Math.max(0, next));
    ev.progress[objId] = clamped;
    ev.lastUpdatedAt = _now();

    if (clamped >= objDef.target) {
      ev.objectivesCompleted[objId] = true;
    }
  }

  function _handleGameEvent(type, payload = {}) {
    if (!initialized) return;
    let changed = false;
    for (const [id, ev] of Object.entries(eventStore.state.events)) {
      if (ev.status !== EVENT_STATUS.ACTIVE) continue;
      const def = EVENT_BY_ID[id];
      if (!def) continue;
      for (const obj of def.objectives) {
        if (ev.objectivesCompleted[obj.id]) continue;
        const match = _matchObjective(obj, type, payload);
        if (match !== null) {
          _incrementObjective(id, obj.id, match.amount, match.absolute);
          changed = true;
        }
      }
      if (changed && _allObjectivesComplete(def, ev) && !ev.completedAt) {
        ev.completedAt = _now();
        ev.status = EVENT_STATUS.COMPLETED;
        _log('EVENT_COMPLETE', { eventId: id });
        _banner(`✅ Eveniment finalizat: ${def.name}`);
        _audio('pickupBig');
        _hap('success');
      }
    }
    if (changed) eventStore.touch(['events']);
  }

  function _matchObjective(obj, type, payload) {
    const E = eventBus?.EVENTS || (typeof window !== 'undefined' && window.__EVENTS) || {};
    switch (obj.type) {
      case OBJECTIVE_TYPES.CLEAR_SNOW:
        if (type === E.SNOW_CLEARED || type === 'snow.cleared') return { amount: Number(payload.amount) || 0 };
        break;
      case OBJECTIVE_TYPES.CLEAR_SNOW_TYPE:
        if ((type === E.SNOW_CLEARED || type === 'snow.cleared') && payload.snowType === obj.snowType) return { amount: Number(payload.amount) || 0 };
        break;
      case OBJECTIVE_TYPES.COMPLETE_CONTRACT:
        if (type === E.CONTRACT_COMPLETED || type === 'contract.completed') return { amount: 1 };
        break;
      case OBJECTIVE_TYPES.COMPLETE_CONTRACT_TIER:
        if ((type === E.CONTRACT_COMPLETED || type === 'contract.completed') && payload.tier === obj.tier) return { amount: 1 };
        break;
      case OBJECTIVE_TYPES.EARN_COINS:
        if (type === E.COINS_EARNED || type === 'coins.earned') return { amount: Number(payload.amount) || 0 };
        break;
      case OBJECTIVE_TYPES.EARN_XP:
        if (type === E.XP_EARNED || type === 'xp.earned') return { amount: Number(payload.amount) || 0 };
        break;
      case OBJECTIVE_TYPES.USE_TOOL:
        if (type === E.TOOL_USED || type === 'tool.used') return { amount: 1 };
        break;
      case OBJECTIVE_TYPES.USE_VEHICLE:
        if (type === E.VEHICLE_USED || type === 'vehicle.used') return { amount: 1 };
        break;
      case OBJECTIVE_TYPES.UPGRADE_VEHICLE:
        if (type === E.VEHICLE_UPGRADED || type === 'vehicle.upgraded') return { amount: 1 };
        break;
      case OBJECTIVE_TYPES.UPGRADE_TOOL:
        if (type === E.TOOL_UPGRADED || type === 'tool.upgraded') return { amount: 1 };
        break;
      case OBJECTIVE_TYPES.COMPLETE_FLEET_OP:
        if (type === E.FLEET_OP_COMPLETED || type === 'fleet.op.completed') return { amount: 1 };
        break;
      case OBJECTIVE_TYPES.UNLOCK_REGION:
        if (type === E.REGION_UNLOCKED || type === 'region.unlocked') return { amount: 1 };
        break;
      case OBJECTIVE_TYPES.REACH_PLAYER_LEVEL:
        if (type === E.PLAYER_LEVEL_UP || type === 'player.level.up') return { amount: Number(payload.newLevel) || 0, absolute: true };
        break;
      case OBJECTIVE_TYPES.REACH_COMPANY_LEVEL:
        if (type === E.COMPANY_LEVEL_UP || type === 'company.level.up') return { amount: Number(payload.newLevel) || 0, absolute: true };
        break;
      case OBJECTIVE_TYPES.EARN_REPUTATION:
        if (type === E.REPUTATION_EARNED || type === 'reputation.earned') return { amount: Number(payload.amount) || 0 };
        break;
      case OBJECTIVE_TYPES.DEPOSIT_COINS:
        if (type === E.DEPOSIT_MADE || type === 'deposit.made') return { amount: Number(payload.amount) || 0 };
        break;
      case OBJECTIVE_TYPES.HIRE_EMPLOYEE:
        if (type === E.EMPLOYEE_HIRED || type === 'employee.hired') return { amount: 1 };
        break;
    }
    return null;
  }

  function _applyReward(reward, source, meta = {}) {
    if (!reward) return;
    const coins = Math.max(0, Number(reward.coins) || 0);
    const xp = Math.max(0, Number(reward.xp) || 0);
    const rep = Math.max(0, Number(reward.reputation) || 0);
    if (coins > 0 && playerStore?.state) {
      playerStore.set({ vaultCoins: (playerStore.state.vaultCoins || 0) + coins });
    }
    if (xp > 0 && typeof grantPlayerXP === 'function') {
      try { grantPlayerXP(xp, { source, ...meta }); } catch {}
    }
    if (rep > 0 && playerStore?.state) {
      playerStore.set({ reputation: (playerStore.state.reputation || 0) + rep });
    }
    if (reward.companyXP && companySystem?.grantCompanyXP) {
      try { companySystem.grantCompanyXP(reward.companyXP, { source, ...meta }); } catch {}
    }
  }

  function _maybeGrantSeasonReward(seasonId) {
    const def = SEASON_BY_ID[seasonId];
    const s = eventStore.state.seasons[seasonId];
    if (!def || !s || s.rewardClaimedAt) return;
    const progress = getSeasonProgress(seasonId);
    if (progress.totalEvents === 0) return;
    const ratio = progress.completedEvents / progress.totalEvents;
    if (ratio >= 0.5) {
      _applyReward(def.rewards, 'season', { seasonId });
      s.rewardClaimedAt = _now();
      _log('SEASON_CLAIM', { seasonId, ratio });
      _banner(`🏆 Recompensă sezon: ${def.name}!`);
      _audio('pickupBig');
      _hap('success');
      eventStore.touch(['seasons']);
    }
  }

  function claimReward(eventId) {
    const def = EVENT_BY_ID[eventId];
    const ev = eventStore.state.events[eventId];
    if (!def || !ev) return { ok: false, reason: 'unknown' };
    if (ev.claimedAt) return { ok: false, reason: 'already_claimed' };
    if (ev.status !== EVENT_STATUS.COMPLETED) {
      // Allow claim if ACTIVE + all objectives complete
      if (!(ev.status === EVENT_STATUS.ACTIVE && _allObjectivesComplete(def, ev))) {
        return { ok: false, reason: 'not_completed' };
      }
    }

    const baseReward = def.rewards || {};
    const mult = (def.modifiers?.rewardMultiplier) || 1;
    const finalReward = {
      coins: Math.round((baseReward.coins || 0) * mult),
      xp: Math.round((baseReward.xp || 0) * mult),
      reputation: Math.round((baseReward.reputation || 0) * mult)
    };
    _applyReward(finalReward, 'event', { eventId });
    ev.claimedAt = _now();
    ev.status = EVENT_STATUS.COMPLETED;
    // Push to history
    const hist = eventStore.state.history || [];
    if (!hist.includes(eventId)) {
      hist.push(eventId);
      while (hist.length > 30) hist.shift();
    }
    _log('EVENT_CLAIM', { eventId, finalReward });
    _banner(`🎉 +${finalReward.coins} monede · +${finalReward.xp} XP`);
    _audio('pickupBig');
    _hap('success');
    eventStore.touch(['events', 'history']);
    return { ok: true, finalReward };
  }

  function getSeasonProgress(seasonId) {
    const def = SEASON_BY_ID[seasonId];
    if (!def) return { totalEvents: 0, completedEvents: 0, activeEvents: 0 };
    let completed = 0, active = 0;
    for (const eid of def.eventIds) {
      const ev = eventStore.state.events[eid];
      if (!ev) continue;
      if (ev.status === EVENT_STATUS.COMPLETED) completed++;
      else if (ev.status === EVENT_STATUS.ACTIVE) active++;
    }
    return { totalEvents: def.eventIds.length, completedEvents: completed, activeEvents: active };
  }

  function initialize() {
    if (initialized) return;
    // Set installTime dacă nu există
    if (!eventStore.state.installTime) {
      eventStore.set({ installTime: _now() });
    }
    _recalculateAll();
    initialized = true;

    // Subscribe la EventBus
    if (eventBus && typeof eventBus.on === 'function') {
      const EV = eventBus.EVENTS || (typeof window !== 'undefined' && window.__EVENTS) || {};
      const types = [
        EV.SNOW_CLEARED, EV.CONTRACT_COMPLETED, EV.CONTRACT_FAILED,
        EV.COINS_EARNED, EV.XP_EARNED, EV.TOOL_USED, EV.VEHICLE_USED,
        EV.VEHICLE_UPGRADED, EV.TOOL_UPGRADED, EV.FLEET_OP_COMPLETED,
        EV.REGION_UNLOCKED, EV.PLAYER_LEVEL_UP, EV.COMPANY_LEVEL_UP,
        EV.REPUTATION_EARNED, EV.DEPOSIT_MADE, EV.EMPLOYEE_HIRED,
        EV.VEHICLE_PURCHASED
      ].filter(Boolean);
      for (const t of types) {
        eventBus.on(t, (payload) => _handleGameEvent(t, payload));
      }
    }
  }

  function checkTick() {
    _recalculateAll();
  }

  // Debug helpers
  function forceActivate(id) {
    const ev = eventStore.state.events[id];
    if (!ev) return false;
    ev.status = EVENT_STATUS.ACTIVE;
    ev.startedAt = _now();
    const def = EVENT_BY_ID[id];
    if (def) ev.expiresAt = _now() + (def.durationMs || 0);
    eventStore.touch(['events']);
    return true;
  }
  function forceExpire(id) {
    const ev = eventStore.state.events[id];
    if (!ev) return false;
    ev.status = EVENT_STATUS.EXPIRED;
    eventStore.touch(['events']);
    return true;
  }
  function forceCompleteAll(id) {
    const def = EVENT_BY_ID[id];
    const ev = eventStore.state.events[id];
    if (!def || !ev) return false;
    for (const obj of def.objectives) {
      ev.progress[obj.id] = obj.target;
      ev.objectivesCompleted[obj.id] = true;
    }
    ev.completedAt = _now();
    ev.status = EVENT_STATUS.COMPLETED;
    eventStore.touch(['events']);
    return true;
  }
  function setProgress(eventId, objId, value) {
    const ev = eventStore.state.events[eventId];
    const def = EVENT_BY_ID[eventId];
    if (!ev || !def) return false;
    const objDef = def.objectives.find(o => o.id === objId);
    if (!objDef) return false;
    ev.progress[objId] = Math.max(0, Math.min(objDef.target, Number(value) || 0));
    if (ev.progress[objId] >= objDef.target) ev.objectivesCompleted[objId] = true;
    eventStore.touch(['events']);
    return true;
  }
  function simulateTime(msOffset) {
    // Face installTime mai vechi cu msOffset -> pare că a trecut mai mult timp
    const cur = eventStore.state.installTime || _now();
    eventStore.set({ installTime: cur - Number(msOffset) });
    _recalculateAll();
  }

  return {
    initialize,
    checkTick,
    claimReward,
    getSeasonProgress,
    _handleGameEvent,   // exposed for testing
    _recalculateAll,    // exposed for testing
    // Debug
    forceActivate,
    forceExpire,
    forceCompleteAll,
    setProgress,
    simulateTime,
    requirementReasons: _requirementReasons
  };
}
