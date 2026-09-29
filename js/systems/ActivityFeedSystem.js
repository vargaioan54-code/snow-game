// Etapa 13 — ActivityFeedSystem
// Subscribe la EventBus events -> populează activityFeed local în SocialStore.
// Rulează REAL (nu necesită backend) — istoric persistat local.

import { ACTIVITY_TYPES, VISIBILITY } from '../config/social.js';

export function createActivityFeedSystem({ socialStore, eventBus, playerStore, companyStore }) {
  if (!eventBus) {
    console.warn('[ActivityFeedSystem] no eventBus provided — feed disabled');
    return { initialize: () => {}, dispose: () => {} };
  }

  const unsubscribes = [];
  let initialized = false;

  function _visibility() {
    return socialStore.state.profile.activityVisibility || VISIBILITY.EVERYONE;
  }

  function _shouldSuppress() {
    return _visibility() === VISIBILITY.NOBODY;
  }

  function initialize() {
    if (initialized) return;
    initialized = true;

    // Prune expired la boot
    socialStore.pruneOldActivities();

    // CONTRACT_COMPLETED
    unsubscribes.push(eventBus.on('contract.completed', (payload = {}) => {
      if (_shouldSuppress()) return;
      socialStore.addActivity(ACTIVITY_TYPES.CONTRACT_COMPLETED, {
        contractId: payload.contractId,
        rating: payload.rating,
        tier: payload.tier
      }, _visibility());
    }));

    // PLAYER_LEVEL_UP
    unsubscribes.push(eventBus.on('player.level.up', (payload = {}) => {
      if (_shouldSuppress()) return;
      socialStore.addActivity(ACTIVITY_TYPES.LEVEL_UP, {
        newLevel: payload.newLevel
      }, _visibility());
    }));

    // COMPANY_LEVEL_UP
    unsubscribes.push(eventBus.on('company.level.up', (payload = {}) => {
      if (_shouldSuppress()) return;
      socialStore.addActivity(ACTIVITY_TYPES.COMPANY_LEVEL_UP, {
        newLevel: payload.newLevel
      }, _visibility());
    }));

    // REGION_UNLOCKED
    unsubscribes.push(eventBus.on('region.unlocked', (payload = {}) => {
      if (_shouldSuppress()) return;
      socialStore.addActivity(ACTIVITY_TYPES.REGION_UNLOCKED, {
        regionId: payload.regionId
      }, _visibility());
    }));

    // VEHICLE_PURCHASED
    unsubscribes.push(eventBus.on('vehicle.purchased', (payload = {}) => {
      if (_shouldSuppress()) return;
      socialStore.addActivity(ACTIVITY_TYPES.VEHICLE_PURCHASED, {
        vehicleId: payload.vehicleId
      }, _visibility());
    }));
  }

  function dispose() {
    for (const u of unsubscribes) { try { u(); } catch {} }
    unsubscribes.length = 0;
    initialized = false;
  }

  function addManual(type, payload = {}) {
    if (!Object.values(ACTIVITY_TYPES).includes(type)) return false;
    socialStore.addActivity(type, payload, _visibility());
    return true;
  }

  return { initialize, dispose, addManual };
}
