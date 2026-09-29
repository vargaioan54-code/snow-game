// Etapa 14 — MultiplayerService orchestrare.
// Foundation: Session lifecycle (create/join/leave/ready/start/end) + bot mgmt (dev).
// Real player sync = BLOCKED (necesită game server authoritative + WebSocket).

import {
  SESSION_STATUS, LOBBY_PLAYER_STATUS, NETWORK_STATUS,
  MP_BACKEND_STATUS, REASON_MESSAGES, validateSessionCode,
  MIN_PLAYERS_TO_START
} from '../config/multiplayer.js';

export function createMultiplayerService({
  backend, multiplayerStore, playerStore, companyStore,
  socialService, transactionLog, audio, haptics, showBanner, eventBus
}) {

  function _msg(reason) {
    return REASON_MESSAGES[reason] || 'Eroare necunoscută';
  }

  function _tx(type, meta = {}) {
    try {
      if (transactionLog && typeof transactionLog.log === 'function') {
        transactionLog.log({ type, currency: 'session', amount: 0, balanceAfter: 0, meta });
      }
    } catch {}
  }

  function _emit(topic, payload) {
    try {
      if (eventBus && typeof eventBus.emit === 'function') eventBus.emit(topic, payload);
    } catch {}
  }

  // Aggregate own player info din playerStore + companyStore
  function _getOwnPlayerInfo() {
    const p = playerStore.state;
    const c = companyStore?.state || {};
    return {
      playerId: p.id || 'local_' + Date.now(),
      name: p.name || 'Player',
      level: p.level || 1,
      company: c.companyName || null,
      companyLevel: c.level || 0
    };
  }

  function _updateOwnStatusFromSession() {
    const session = multiplayerStore.state.currentSession;
    if (!session) {
      multiplayerStore.set({ ownRole: null, ownStatus: null });
      return;
    }
    const own = session.players.find(p => p.isSelf);
    if (own) {
      multiplayerStore.set({ ownRole: own.role, ownStatus: own.status });
    }
  }

  // Backend event handlers → update store
  function _handleBackendEvent(event) {
    const session = multiplayerStore.state.currentSession;
    if (!session) return;

    if (event.type === 'player_joined') {
      // Bot / another mock player added → refresh full session snapshot
      const backendSession = backend.getCurrentSession?.();
      if (backendSession) {
        multiplayerStore.set({ currentSession: { ...backendSession, players: [...backendSession.players] } });
        if (showBanner && !event.player?.isSelf) {
          showBanner(`✓ ${event.player.name} s-a alăturat`);
        }
        try { audio?.pickupBig?.(); } catch {}
      }
    } else if (event.type === 'player_left') {
      const backendSession = backend.getCurrentSession?.();
      if (backendSession) {
        multiplayerStore.set({ currentSession: { ...backendSession, players: [...backendSession.players] } });
        const gone = session.players.find(p => p.playerId === event.playerId);
        if (showBanner && gone) showBanner(`🚪 ${gone.name} a plecat`);
      }
    } else if (event.type === 'player_status_changed') {
      const backendSession = backend.getCurrentSession?.();
      if (backendSession) {
        multiplayerStore.set({ currentSession: { ...backendSession, players: [...backendSession.players] } });
      }
      // Verifică all ready → banner pt host
      if (multiplayerStore.canStart() && multiplayerStore.isHost()) {
        if (showBanner) showBanner('✅ Toți jucătorii ready — poți începe');
      }
    } else if (event.type === 'session_ended') {
      const s = multiplayerStore.state.currentSession;
      if (s) {
        multiplayerStore.pushHistory({
          id: s.id, code: s.code, endedAt: Date.now(),
          result: event.reason || 'ended', playerCount: s.players.length,
          duration: s.startedAt ? (Date.now() - s.startedAt) : 0
        });
      }
      multiplayerStore.set({
        currentSession: null,
        ownRole: null,
        ownStatus: null,
        networkStatus: NETWORK_STATUS.DISCONNECTED
      });
      _tx('MP_SESSION_END', { reason: event.reason });
      _emit('multiplayer.session.ended', { reason: event.reason });
      if (showBanner) {
        if (event.reason === 'host_left') showBanner('🚪 Host-ul a părăsit — sesiunea s-a terminat');
        else showBanner('🏁 Sesiune terminată');
      }
    } else if (event.type === 'session_started') {
      const backendSession = backend.getCurrentSession?.();
      if (backendSession) {
        multiplayerStore.set({ currentSession: { ...backendSession, players: [...backendSession.players] } });
      }
      _tx('MP_SESSION_START', { sessionId: session.id });
      _emit('multiplayer.session.started', { sessionId: session.id });
      if (showBanner) showBanner('🎮 Sesiunea a început!');
      try { audio?.contractAccept?.(); } catch {}
    }
  }

  // Subscribe la backend events
  let _unsubscribe = null;
  if (backend && typeof backend.onEvent === 'function') {
    _unsubscribe = backend.onEvent(_handleBackendEvent);
  }

  // Backend info
  function getBackendInfo() {
    if (!backend) return { platform: 'none', isMock: false, isReal: false, status: MP_BACKEND_STATUS.NONE };
    return {
      platform: backend.getPlatform?.() || 'unknown',
      isMock: !!backend.isMock,
      isReal: !!backend.isReal,
      status: backend.isMock ? MP_BACKEND_STATUS.MOCK : (backend.isReal ? MP_BACKEND_STATUS.REAL : MP_BACKEND_STATUS.NONE)
    };
  }

  async function createSession(opts = {}) {
    if (multiplayerStore.isInSession()) {
      const msg = _msg('already_in_session');
      if (showBanner) showBanner('❌ ' + msg);
      return { ok: false, reason: 'already_in_session', message: msg };
    }
    if (!backend) {
      const msg = _msg('backend_unavailable');
      if (showBanner) showBanner('❌ ' + msg);
      return { ok: false, reason: 'backend_unavailable', message: msg };
    }

    multiplayerStore.set({ networkStatus: NETWORK_STATUS.CONNECTING, backendStatus: getBackendInfo().status });

    const ownPlayer = _getOwnPlayerInfo();
    let res;
    try {
      res = await backend.createSession(ownPlayer, opts);
    } catch (e) {
      multiplayerStore.set({ networkStatus: NETWORK_STATUS.ERROR, lastError: { code: 'network_error', message: String(e), timestamp: Date.now() } });
      return { ok: false, reason: 'network_error' };
    }

    if (!res.ok) {
      multiplayerStore.set({ networkStatus: NETWORK_STATUS.DISCONNECTED });
      if (showBanner) showBanner('❌ ' + _msg(res.reason));
      return res;
    }

    multiplayerStore.set({
      currentSession: { ...res.session, players: [...res.session.players] },
      networkStatus: NETWORK_STATUS.CONNECTED,
      ownRole: 'host',
      ownStatus: LOBBY_PLAYER_STATUS.WAITING
    });
    multiplayerStore.incStat('totalSessionsPlayed', 1);

    _tx('MP_SESSION_CREATE', { sessionId: res.session.id, code: res.session.code });
    if (showBanner) showBanner(`👑 Sesiune creată — cod: ${res.session.code}`);
    try { audio?.pickupBig?.(); haptics?.medium?.(); } catch {}

    return { ok: true, session: res.session };
  }

  async function joinSession(code) {
    if (multiplayerStore.isInSession()) {
      const msg = _msg('already_in_session');
      if (showBanner) showBanner('❌ ' + msg);
      return { ok: false, reason: 'already_in_session', message: msg };
    }
    if (!backend) return { ok: false, reason: 'backend_unavailable', message: _msg('backend_unavailable') };
    if (!validateSessionCode(code)) {
      if (showBanner) showBanner('❌ ' + _msg('invalid_code'));
      return { ok: false, reason: 'invalid_code', message: _msg('invalid_code') };
    }

    multiplayerStore.set({ networkStatus: NETWORK_STATUS.CONNECTING });

    const ownPlayer = _getOwnPlayerInfo();
    let res;
    try {
      res = await backend.joinSession(code.toUpperCase(), ownPlayer);
    } catch (e) {
      multiplayerStore.set({ networkStatus: NETWORK_STATUS.ERROR, lastError: { code: 'network_error', message: String(e), timestamp: Date.now() } });
      return { ok: false, reason: 'network_error' };
    }

    if (!res.ok) {
      multiplayerStore.set({ networkStatus: NETWORK_STATUS.DISCONNECTED });
      if (showBanner) showBanner('❌ ' + _msg(res.reason));
      return res;
    }

    multiplayerStore.set({
      currentSession: { ...res.session, players: [...res.session.players] },
      networkStatus: NETWORK_STATUS.CONNECTED,
      ownRole: 'player',
      ownStatus: LOBBY_PLAYER_STATUS.WAITING
    });
    multiplayerStore.incStat('totalSessionsPlayed', 1);

    _tx('MP_SESSION_JOIN', { sessionId: res.session.id, code: res.session.code });
    if (showBanner) showBanner(`✓ Alăturat sesiunii ${res.session.code}`);
    try { audio?.pickupBig?.(); haptics?.medium?.(); } catch {}

    return { ok: true, session: res.session };
  }

  async function leaveSession() {
    if (!multiplayerStore.isInSession()) return { ok: false, reason: 'no_session' };
    if (!backend) return { ok: false, reason: 'backend_unavailable' };

    const own = _getOwnPlayerInfo();
    let res;
    try { res = await backend.leaveSession(own.playerId); } catch { res = { ok: true }; }

    const session = multiplayerStore.state.currentSession;
    if (session) {
      multiplayerStore.pushHistory({
        id: session.id, code: session.code, endedAt: Date.now(),
        result: 'left', playerCount: session.players.length,
        duration: session.startedAt ? (Date.now() - session.startedAt) : 0
      });
    }
    multiplayerStore.set({
      currentSession: null,
      ownRole: null,
      ownStatus: null,
      networkStatus: NETWORK_STATUS.DISCONNECTED
    });

    _tx('MP_SESSION_LEAVE', {});
    if (showBanner) showBanner('🚪 Ai părăsit sesiunea');
    return res;
  }

  async function setReady(ready) {
    if (!multiplayerStore.isInSession()) return { ok: false, reason: 'no_session' };
    if (!backend) return { ok: false, reason: 'backend_unavailable' };

    const own = _getOwnPlayerInfo();
    let res;
    try { res = await backend.setReady(own.playerId, !!ready); } catch { return { ok: false, reason: 'network_error' }; }

    if (res.ok) {
      const newStatus = ready ? LOBBY_PLAYER_STATUS.READY : LOBBY_PLAYER_STATUS.WAITING;
      multiplayerStore.set({ ownStatus: newStatus });
      _updateOwnStatusFromSession();
    }
    return res;
  }

  async function startSession() {
    if (!multiplayerStore.isInSession()) return { ok: false, reason: 'no_session' };
    if (!multiplayerStore.isHost()) {
      if (showBanner) showBanner('❌ ' + _msg('not_host'));
      return { ok: false, reason: 'not_host', message: _msg('not_host') };
    }
    if (!multiplayerStore.canStart()) {
      if (showBanner) showBanner('❌ ' + _msg('not_all_ready'));
      return { ok: false, reason: 'not_all_ready', message: _msg('not_all_ready') };
    }

    let res;
    try { res = await backend.startSession(); } catch { return { ok: false, reason: 'network_error' }; }

    if (!res.ok) {
      if (showBanner) showBanner('❌ ' + _msg(res.reason));
    }
    return res;
  }

  async function endSession() {
    if (!multiplayerStore.isInSession()) return { ok: false, reason: 'no_session' };
    if (!backend) return { ok: false };
    let res;
    try { res = await backend.endSession(); } catch { res = { ok: true }; }
    // _handleBackendEvent va procesa 'session_ended' emit
    return res;
  }

  async function addBot() {
    if (!multiplayerStore.isInSession()) return { ok: false, reason: 'no_session' };
    if (!multiplayerStore.isHost()) return { ok: false, reason: 'not_host', message: _msg('not_host') };
    if (!backend?.isMock) {
      if (showBanner) showBanner('❌ Bots doar în mod dezvoltare (mock backend)');
      return { ok: false, reason: 'not_mock_backend' };
    }
    if (multiplayerStore.isFull()) {
      if (showBanner) showBanner('❌ ' + _msg('session_full'));
      return { ok: false, reason: 'session_full' };
    }

    let res;
    try { res = await backend.addBot(); } catch { return { ok: false, reason: 'network_error' }; }

    if (res.ok) {
      _tx('MP_BOT_ADDED', { botId: res.player?.playerId, botName: res.player?.name });
    } else {
      if (showBanner) showBanner('❌ ' + _msg(res.reason));
    }
    return res;
  }

  async function sendInviteToFriend(friendId) {
    if (!multiplayerStore.isInSession()) return { ok: false, reason: 'no_session' };
    const session = multiplayerStore.state.currentSession;
    let res;
    try {
      // Try social invite first (Etapa 13)
      if (socialService && typeof socialService.sendInvite === 'function') {
        try { await socialService.sendInvite(friendId, 'game_invite', { sessionCode: session.code }); } catch {}
      }
      res = await backend.sendInviteToFriend(friendId, session.code);
    } catch { return { ok: false, reason: 'network_error' }; }

    if (res.ok) {
      _tx('MP_INVITE_SEND', { friendId, sessionCode: session.code });
      if (showBanner) showBanner('✉️ Invitație trimisă (mock)');
    }
    return res;
  }

  function subscribe(cb) {
    if (backend && typeof backend.onEvent === 'function') return backend.onEvent(cb);
    return () => {};
  }

  function dispose() {
    if (_unsubscribe) { try { _unsubscribe(); } catch {} }
  }

  return {
    getBackendInfo,
    createSession, joinSession, leaveSession,
    setReady, startSession, endSession,
    addBot, sendInviteToFriend,
    subscribe, dispose,
    _getOwnPlayerInfo
  };
}
