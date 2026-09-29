// Etapa 14 — MockMultiplayerBackend (DEV-ONLY)
// Simulează 2-4 player session cu bots local. NU real multiplayer.
// Real backend (WebSocket / Photon / Colyseus / Firebase RTDB) = BLOCKED.

import {
  generateSessionId, generateSessionCode,
  SESSION_STATUS, LOBBY_PLAYER_STATUS, PLAYER_ROLE, MAX_PLAYERS
} from '../config/multiplayer.js';

const BOT_PROFILES = [
  { id: 'bot_alex',    name: 'Alex (Bot)',    level: 12, company: 'Ice Corp' },
  { id: 'bot_ioana',   name: 'Ioana (Bot)',   level: 8,  company: 'Snow Masters' },
  { id: 'bot_dan',     name: 'Dan (Bot)',     level: 15, company: 'Winter Kings' },
  { id: 'bot_maria',   name: 'Maria (Bot)',   level: 5,  company: null },
  { id: 'bot_vlad',    name: 'Vlad (Bot)',    level: 20, company: 'Elite Snow' },
  { id: 'bot_elena',   name: 'Elena (Bot)',   level: 3,  company: null },
  { id: 'bot_horia',   name: 'Horia (Bot)',   level: 18, company: 'Mountain Pros' }
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export function createMockMultiplayerBackend({ maxBots = 3 } = {}) {
  let currentSession = null;
  const listeners = new Set();

  function emit(event) {
    for (const cb of listeners) {
      try { cb(event); } catch (e) { console.error('[MockMPBackend listener]', e); }
    }
  }

  return {
    isMock: true,
    isReal: false,
    getPlatform: () => 'mock',

    onEvent(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },

    async createSession(ownPlayer, opts = {}) {
      await sleep(300);
      if (currentSession) return { ok: false, reason: 'already_in_session' };
      const id = generateSessionId();
      const code = generateSessionCode();
      currentSession = {
        id, code,
        hostId: ownPlayer.playerId,
        hostName: ownPlayer.name,
        status: SESSION_STATUS.WAITING,
        players: [{
          ...ownPlayer,
          role: PLAYER_ROLE.HOST,
          status: LOBBY_PLAYER_STATUS.WAITING,
          joinedAt: Date.now(),
          isSelf: true,
          isBot: false
        }],
        maxPlayers: Math.min(opts.maxPlayers || MAX_PLAYERS, MAX_PLAYERS),
        createdAt: Date.now(),
        startedAt: null
      };
      return { ok: true, session: currentSession };
    },

    async joinSession(sessionCode, ownPlayer) {
      await sleep(400);
      const codeUpper = typeof sessionCode === 'string' ? sessionCode.trim().toUpperCase() : '';
      if (!currentSession || currentSession.code !== codeUpper) {
        return { ok: false, reason: 'session_not_found' };
      }
      if (currentSession.players.length >= currentSession.maxPlayers) {
        return { ok: false, reason: 'session_full' };
      }
      if (currentSession.players.some(p => p.playerId === ownPlayer.playerId)) {
        return { ok: false, reason: 'already_in_session' };
      }
      const player = {
        ...ownPlayer,
        role: PLAYER_ROLE.PLAYER,
        status: LOBBY_PLAYER_STATUS.WAITING,
        joinedAt: Date.now(),
        isSelf: true,
        isBot: false
      };
      currentSession.players.push(player);
      emit({ type: 'player_joined', player });
      return { ok: true, session: currentSession };
    },

    async addBot() {
      await sleep(500);
      if (!currentSession) return { ok: false, reason: 'no_session' };
      if (currentSession.players.length >= currentSession.maxPlayers) return { ok: false, reason: 'session_full' };
      const availableBots = BOT_PROFILES.filter(b => !currentSession.players.some(p => p.playerId === b.id));
      if (availableBots.length === 0) return { ok: false, reason: 'no_bots_available' };
      const bot = availableBots[0];
      const player = {
        playerId: bot.id,
        name: bot.name,
        level: bot.level,
        company: bot.company,
        role: PLAYER_ROLE.PLAYER,
        status: LOBBY_PLAYER_STATUS.WAITING,
        joinedAt: Date.now(),
        isSelf: false,
        isBot: true
      };
      currentSession.players.push(player);
      emit({ type: 'player_joined', player });
      // Bot auto-ready după 1-3s
      setTimeout(() => {
        if (currentSession && currentSession.players.some(p => p.playerId === bot.id && p.status === LOBBY_PLAYER_STATUS.WAITING)) {
          const bp = currentSession.players.find(p => p.playerId === bot.id);
          if (bp) {
            bp.status = LOBBY_PLAYER_STATUS.READY;
            emit({ type: 'player_status_changed', playerId: bot.id, status: LOBBY_PLAYER_STATUS.READY });
          }
        }
      }, 1000 + Math.random() * 2000);
      return { ok: true, player };
    },

    async setReady(playerId, ready) {
      await sleep(100);
      if (!currentSession) return { ok: false, reason: 'no_session' };
      const p = currentSession.players.find(pl => pl.playerId === playerId);
      if (!p) return { ok: false, reason: 'player_not_found' };
      p.status = ready ? LOBBY_PLAYER_STATUS.READY : LOBBY_PLAYER_STATUS.WAITING;
      emit({ type: 'player_status_changed', playerId, status: p.status });
      return { ok: true };
    },

    async leaveSession(playerId) {
      await sleep(200);
      if (!currentSession) return { ok: true };
      const idx = currentSession.players.findIndex(p => p.playerId === playerId);
      if (idx >= 0) currentSession.players.splice(idx, 1);
      // Dacă host pleacă → session ended
      if (currentSession.hostId === playerId) {
        currentSession.status = SESSION_STATUS.ENDED;
        emit({ type: 'session_ended', reason: 'host_left' });
        currentSession = null;
      } else {
        emit({ type: 'player_left', playerId });
      }
      return { ok: true };
    },

    async startSession() {
      await sleep(500);
      if (!currentSession) return { ok: false, reason: 'no_session' };
      const allReady = currentSession.players.every(p => p.status === LOBBY_PLAYER_STATUS.READY);
      if (!allReady) return { ok: false, reason: 'not_all_ready' };
      currentSession.status = SESSION_STATUS.ACTIVE;
      currentSession.startedAt = Date.now();
      emit({ type: 'session_started', session: currentSession });
      return { ok: true, session: currentSession };
    },

    async endSession() {
      if (!currentSession) return { ok: true };
      const finished = currentSession;
      currentSession.status = SESSION_STATUS.ENDED;
      emit({ type: 'session_ended', reason: 'ended_normally' });
      currentSession = null;
      return { ok: true, session: finished };
    },

    async sendInviteToFriend(friendId, sessionCode) {
      await sleep(300);
      // Mock: doar log — nu poate trimite real invite
      console.log('[MockMP] Invite sent to', friendId, 'for session', sessionCode);
      return { ok: true };
    },

    // Dev helpers
    getCurrentSession() { return currentSession; },
    _forceEnd() { currentSession = null; },
    _availableBots() {
      if (!currentSession) return BOT_PROFILES;
      return BOT_PROFILES.filter(b => !currentSession.players.some(p => p.playerId === b.id));
    }
  };
}
