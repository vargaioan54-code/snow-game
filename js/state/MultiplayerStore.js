// Etapa 14 — MultiplayerStore reactive + persist snow-game:multiplayer-v1
// SAFETY: currentSession reset la null la boot (nu restore stale session).
// Persistă doar sessionHistory + stats agregate.

import {
  SESSION_STATUS, LOBBY_PLAYER_STATUS, NETWORK_STATUS,
  MP_BACKEND_STATUS, MAX_PLAYERS, MIN_PLAYERS_TO_START,
  SESSION_HISTORY_MAX
} from '../config/multiplayer.js';

const DEFAULT_STATE = () => ({
  currentSession: null,   // { id, code, hostId, hostName, status, players: [], maxPlayers, createdAt, startedAt }
  networkStatus:  NETWORK_STATUS.DISCONNECTED,
  backendStatus:  MP_BACKEND_STATUS.NONE,
  ownRole:        null,   // 'host' | 'player' | null
  ownStatus:      null,   // LOBBY_PLAYER_STATUS | null
  sessionHistory: [],     // [{id, code, endedAt, result, playerCount, duration}]
  totalSessionsPlayed: 0,
  totalCoopContractsCompleted: 0,
  lastError:      null    // { code, message, timestamp }
});

const VALID_STATUS = new Set(Object.values(SESSION_STATUS));
const VALID_PLAYER_STATUS = new Set(Object.values(LOBBY_PLAYER_STATUS));
const VALID_NETWORK_STATUS = new Set(Object.values(NETWORK_STATUS));
const VALID_BACKEND_STATUS = new Set(Object.values(MP_BACKEND_STATUS));

export function createMultiplayerStore() {
  const state = DEFAULT_STATE();
  const anyListeners = new Set();
  const keyListeners = new Map();

  function notify(changedKeys) {
    for (const l of anyListeners) { try { l(state, changedKeys); } catch (e) { console.error('[MPStore listener]', e); } }
    for (const k of changedKeys) {
      const set = keyListeners.get(k);
      if (set) for (const l of set) { try { l(state[k], state); } catch (e) { console.error('[MPStore keyListener]', e); } }
    }
  }

  function set(patch) {
    const changed = [];
    for (const k in patch) {
      if (state[k] !== patch[k]) {
        state[k] = patch[k];
        changed.push(k);
      }
    }
    if (changed.length) notify(changed);
  }

  function pushHistory(entry) {
    const hist = [...state.sessionHistory, entry].slice(-SESSION_HISTORY_MAX);
    set({ sessionHistory: hist });
  }

  function incStat(key, delta = 1) {
    if (!(key in state)) return;
    if (typeof state[key] !== 'number') return;
    set({ [key]: Math.max(0, state[key] + delta) });
  }

  return {
    get state() { return state; },

    // Reactive
    on(cb) { anyListeners.add(cb); return () => anyListeners.delete(cb); },
    onKey(key, cb) {
      if (!keyListeners.has(key)) keyListeners.set(key, new Set());
      keyListeners.get(key).add(cb);
      return () => keyListeners.get(key).delete(cb);
    },

    set,
    pushHistory,
    incStat,

    // Helpers
    isInSession()   { return !!state.currentSession; },
    isHost()        { return state.ownRole === 'host'; },
    getPlayers()    { return state.currentSession?.players || []; },
    getReadyCount() { return (state.currentSession?.players || []).filter(p => p.status === 'ready').length; },
    canStart() {
      const s = state.currentSession;
      if (!s) return false;
      if (s.players.length < MIN_PLAYERS_TO_START) return false;
      return s.players.every(p => p.status === 'ready');
    },
    isFull() {
      const s = state.currentSession;
      if (!s) return false;
      return s.players.length >= (s.maxPlayers || MAX_PLAYERS);
    },

    // Serialize / Hydrate
    serialize() {
      // NU persistă currentSession — session e ephemeral (backend-authoritative în viitor)
      return {
        sessionHistory: [...state.sessionHistory],
        totalSessionsPlayed: state.totalSessionsPlayed,
        totalCoopContractsCompleted: state.totalCoopContractsCompleted
      };
    },

    hydrate(data) {
      if (!data || typeof data !== 'object') return;
      const clean = DEFAULT_STATE();

      // SAFETY: currentSession/ownRole/ownStatus/networkStatus reset la null/disconnected
      // (nu restore stale session — backend/session e ephemeral)

      // sessionHistory
      if (Array.isArray(data.sessionHistory)) {
        clean.sessionHistory = data.sessionHistory
          .filter(e => e && typeof e === 'object' && typeof e.id === 'string')
          .slice(-SESSION_HISTORY_MAX);
      }
      // stats numerics ≥0
      if (typeof data.totalSessionsPlayed === 'number' && data.totalSessionsPlayed >= 0) {
        clean.totalSessionsPlayed = Math.floor(data.totalSessionsPlayed);
      }
      if (typeof data.totalCoopContractsCompleted === 'number' && data.totalCoopContractsCompleted >= 0) {
        clean.totalCoopContractsCompleted = Math.floor(data.totalCoopContractsCompleted);
      }

      Object.assign(state, clean);
      notify(['sessionHistory', 'totalSessionsPlayed', 'totalCoopContractsCompleted', 'currentSession', 'ownRole', 'ownStatus', 'networkStatus']);
    },

    reset() {
      Object.assign(state, DEFAULT_STATE());
      notify(['currentSession', 'networkStatus', 'backendStatus', 'ownRole', 'ownStatus', 'sessionHistory', 'totalSessionsPlayed', 'totalCoopContractsCompleted', 'lastError']);
    }
  };
}
