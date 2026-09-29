// Etapa 13 — SocialService orchestrare.
// Agregă profile din stores existing (single source of truth).
// Toate mutațiile trec prin backend abstraction (mock sau real).
// BLOCKED: sync real între dispozitive (necesită backend).

import {
  validateDisplayName,
  REASON_MESSAGES,
  REQUEST_DIRECTION,
  FRIEND_STATUS,
  BACKEND_STATUS,
  PRESENCE_STATUS,
  VISIBILITY
} from '../config/social.js';

export function createSocialService({
  backend, socialStore, playerStore, companyStore, vehicleStore,
  entitlementStore, transactionLog, audio, haptics, showBanner
}) {
  // Backend availability
  function _backendAvailable() {
    return backend && (backend.isMock === true || backend.getPlatform?.() === 'real');
  }

  function _msg(reason) {
    return REASON_MESSAGES[reason] || 'Eroare necunoscută';
  }

  function _tx(type, meta = {}) {
    try {
      if (transactionLog && typeof transactionLog.log === 'function') {
        transactionLog.log({ type, currency: 'social', amount: 0, meta });
      }
    } catch (e) { /* silent */ }
  }

  // Agregă profilul propriu din toate stores existing
  function getMyProfile() {
    const p = playerStore.state;
    const c = companyStore?.state;
    const v = vehicleStore?.state;
    const e = entitlementStore?.state;

    return {
      playerId: p.id || 'local',
      name: socialStore.state.profile.displayName || p.name || 'Player',
      avatar: socialStore.state.profile.avatar,
      level: p.level || 1,
      xp: p.xp || 0,
      reputation: p.reputation || 0,
      company: (c && c.companyId) ? {
        id: c.companyId,
        name: c.companyName,
        level: c.level,
        reputation: c.reputation
      } : null,
      publicStats: {
        contractsCompleted: p.stats?.contractsCompleted || 0,
        totalSnowCleared: p.stats?.totalSnowCleared || 0,
        totalCoinsEarned: p.stats?.totalCoinsEarned || 0,
        totalXpEarned: p.stats?.totalXpEarned || 0
      },
      ownedVehiclesCount: (v?.owned || []).length,
      cosmeticsCount: (e?.ownedCosmetics || []).length,
      achievementsUnlocked: 0, // populated by caller if needed
      presence: PRESENCE_STATUS.IN_GAME,
      isLocal: true
    };
  }

  function updateDisplayName(name) {
    const v = validateDisplayName(name);
    if (!v.ok) {
      showBanner?.(_msg(v.reason));
      return { ok: false, reason: v.reason };
    }
    playerStore.set({ name: v.name });
    socialStore.setProfile({ displayName: v.name });
    _tx('SOCIAL_PROFILE_UPDATE', { field: 'displayName', value: v.name });
    showBanner?.('Nume actualizat: ' + v.name);
    return { ok: true, name: v.name };
  }

  function updateVisibility(category, level) {
    if (!Object.values(VISIBILITY).includes(level)) {
      return { ok: false, reason: 'invalid_visibility' };
    }
    const validCats = ['visibility', 'activityVisibility', 'presenceVisibility'];
    if (!validCats.includes(category)) {
      return { ok: false, reason: 'invalid_category' };
    }
    socialStore.setProfile({ [category]: level });
    _tx('SOCIAL_PROFILE_UPDATE', { field: category, value: level });
    return { ok: true };
  }

  function updateAllowFlags(patch) {
    const clean = {};
    if (typeof patch.allowFriendRequests === 'boolean') clean.allowFriendRequests = patch.allowFriendRequests;
    if (typeof patch.allowInvites === 'boolean') clean.allowInvites = patch.allowInvites;
    if (Object.keys(clean).length === 0) return { ok: false, reason: 'nothing_to_update' };
    socialStore.setProfile(clean);
    _tx('SOCIAL_PROFILE_UPDATE', { fields: Object.keys(clean) });
    return { ok: true };
  }

  async function searchPlayers(query) {
    if (!_backendAvailable()) {
      return { ok: false, reason: 'backend_unavailable', message: _msg('backend_unavailable') };
    }
    const q = String(query || '').trim();
    if (!q) return { ok: false, reason: 'empty_query' };
    socialStore.addSearchQuery(q);
    try {
      const res = await backend.searchPlayers(q);
      if (res && res.ok) {
        socialStore.set({ lastSyncedAt: Date.now() });
      }
      return res;
    } catch (e) {
      return { ok: false, reason: 'backend_error', message: String(e.message || e) };
    }
  }

  async function getPlayerProfile(playerId) {
    if (!_backendAvailable()) {
      return { ok: false, reason: 'backend_unavailable', message: _msg('backend_unavailable') };
    }
    if (!playerId) return { ok: false, reason: 'invalid_id' };
    try {
      return await backend.getProfile(playerId);
    } catch (e) {
      return { ok: false, reason: 'backend_error', message: String(e.message || e) };
    }
  }

  async function sendFriendRequest(playerId, name = 'Unknown') {
    if (!_backendAvailable()) {
      showBanner?.(_msg('backend_unavailable'));
      return { ok: false, reason: 'backend_unavailable' };
    }
    // Local validation
    const myId = playerStore.state.id;
    if (playerId === myId) return { ok: false, reason: 'self_request', message: _msg('self_request') };
    if (socialStore.isFriend(playerId)) return { ok: false, reason: 'already_friend', message: _msg('already_friend') };
    if (socialStore.hasPendingRequestTo(playerId)) return { ok: false, reason: 'already_pending', message: _msg('already_pending') };
    if (socialStore.isBlocked(playerId)) return { ok: false, reason: 'blocked_player', message: _msg('blocked_player') };

    try {
      const res = await backend.sendFriendRequest(playerId);
      if (!res || !res.ok) {
        showBanner?.('Eroare la trimiterea cererii');
        return res || { ok: false, reason: 'backend_error' };
      }
      socialStore.addRequest(playerId, name, REQUEST_DIRECTION.SENT);
      _tx('SOCIAL_INVITE_SEND', { playerId, type: 'friend_request' });
      showBanner?.('Cerere trimisă către ' + name);
      audio?.pickupBig?.();
      haptics?.light?.();
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: 'backend_error', message: String(e.message || e) };
    }
  }

  async function acceptFriendRequest(requestId) {
    const req = socialStore.getRequest(requestId);
    if (!req) return { ok: false, reason: 'request_not_found', message: _msg('request_not_found') };
    if (req.direction !== REQUEST_DIRECTION.RECEIVED) return { ok: false, reason: 'not_received' };
    if (!_backendAvailable()) {
      showBanner?.(_msg('backend_unavailable'));
      return { ok: false, reason: 'backend_unavailable' };
    }
    try {
      const res = await backend.acceptFriendRequest(requestId);
      if (!res || !res.ok) return res || { ok: false, reason: 'backend_error' };
      socialStore.addFriend(req.playerId, req.name);
      socialStore.removeRequest(requestId);
      _tx('SOCIAL_FRIEND_ADD', { playerId: req.playerId, name: req.name });
      showBanner?.('Prieten adăugat: ' + req.name);
      audio?.pickupBig?.();
      haptics?.success?.();
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: 'backend_error', message: String(e.message || e) };
    }
  }

  async function declineFriendRequest(requestId) {
    const req = socialStore.getRequest(requestId);
    if (!req) return { ok: false, reason: 'request_not_found' };
    if (!_backendAvailable()) {
      showBanner?.(_msg('backend_unavailable'));
      return { ok: false, reason: 'backend_unavailable' };
    }
    try {
      await backend.declineFriendRequest(requestId);
      socialStore.removeRequest(requestId);
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: 'backend_error' };
    }
  }

  async function cancelFriendRequest(requestId) {
    const req = socialStore.getRequest(requestId);
    if (!req) return { ok: false, reason: 'request_not_found' };
    if (req.direction !== REQUEST_DIRECTION.SENT) return { ok: false, reason: 'not_sent' };
    if (!_backendAvailable()) {
      showBanner?.(_msg('backend_unavailable'));
      return { ok: false, reason: 'backend_unavailable' };
    }
    try {
      await backend.cancelFriendRequest(requestId);
      socialStore.removeRequest(requestId);
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: 'backend_error' };
    }
  }

  async function removeFriend(playerId) {
    if (!socialStore.isFriend(playerId)) return { ok: false, reason: 'friend_not_found', message: _msg('friend_not_found') };
    if (!_backendAvailable()) {
      showBanner?.(_msg('backend_unavailable'));
      return { ok: false, reason: 'backend_unavailable' };
    }
    try {
      await backend.removeFriend(playerId);
      const friend = socialStore.state.friends.find(f => f.playerId === playerId);
      socialStore.removeFriend(playerId);
      _tx('SOCIAL_FRIEND_REMOVE', { playerId, name: friend?.name });
      showBanner?.('Prieten eliminat');
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: 'backend_error' };
    }
  }

  async function blockPlayer(playerId, name = 'Unknown') {
    if (playerId === playerStore.state.id) return { ok: false, reason: 'self_request' };
    if (socialStore.isBlocked(playerId)) return { ok: false, reason: 'already_blocked' };
    if (!_backendAvailable()) {
      // Block e OK local — nu necesită backend absolut
      socialStore.addBlocked(playerId, name);
      // remove friend dacă e prieten
      if (socialStore.isFriend(playerId)) socialStore.removeFriend(playerId);
      _tx('SOCIAL_BLOCK', { playerId, name });
      showBanner?.('Jucător blocat: ' + name);
      return { ok: true, warning: 'Blocare doar local (fără backend)' };
    }
    try {
      await backend.blockPlayer(playerId);
      socialStore.addBlocked(playerId, name);
      if (socialStore.isFriend(playerId)) socialStore.removeFriend(playerId);
      _tx('SOCIAL_BLOCK', { playerId, name });
      showBanner?.('Jucător blocat: ' + name);
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: 'backend_error' };
    }
  }

  async function unblockPlayer(playerId) {
    if (!socialStore.isBlocked(playerId)) return { ok: false, reason: 'not_blocked' };
    if (_backendAvailable()) {
      try { await backend.unblockPlayer(playerId); } catch (e) { /* continue anyway */ }
    }
    socialStore.removeBlocked(playerId);
    _tx('SOCIAL_UNBLOCK', { playerId });
    showBanner?.('Deblocat');
    return { ok: true };
  }

  async function sendInvite(playerId, type, payload = {}) {
    if (!_backendAvailable()) {
      showBanner?.(_msg('backend_unavailable'));
      return { ok: false, reason: 'backend_unavailable' };
    }
    if (socialStore.isBlocked(playerId)) return { ok: false, reason: 'blocked_player' };
    try {
      const res = await backend.sendInvite(playerId, type, payload);
      if (!res || !res.ok) return res || { ok: false, reason: 'backend_error' };
      socialStore.addInvite({
        type,
        toPlayerId: playerId,
        payload,
        direction: REQUEST_DIRECTION.SENT
      });
      _tx('SOCIAL_INVITE_SEND', { playerId, type });
      showBanner?.('Invitație trimisă');
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: 'backend_error' };
    }
  }

  function getReceivedRequests() {
    return socialStore.state.friendRequests.filter(r => r.direction === REQUEST_DIRECTION.RECEIVED);
  }
  function getSentRequests() {
    return socialStore.state.friendRequests.filter(r => r.direction === REQUEST_DIRECTION.SENT);
  }
  function getReceivedInvites() {
    return socialStore.state.invites.filter(i => i.direction === REQUEST_DIRECTION.RECEIVED);
  }
  function getSentInvites() {
    return socialStore.state.invites.filter(i => i.direction === REQUEST_DIRECTION.SENT);
  }

  function markAsRead(category) {
    socialStore.markRead(category);
  }

  function getBackendInfo() {
    return {
      status: socialStore.state.backendStatus,
      platform: backend?.getPlatform?.() || 'none',
      isMock: !!backend?.isMock,
      available: _backendAvailable()
    };
  }

  return {
    getMyProfile,
    updateDisplayName,
    updateVisibility,
    updateAllowFlags,
    searchPlayers,
    getPlayerProfile,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend,
    blockPlayer,
    unblockPlayer,
    sendInvite,
    getReceivedRequests,
    getSentRequests,
    getReceivedInvites,
    getSentInvites,
    markAsRead,
    getBackendInfo
  };
}
