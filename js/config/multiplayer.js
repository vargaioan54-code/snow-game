// Etapa 14 — Multiplayer / Co-op config
// BLOCKED: real backend (WebSocket / game server / auth) — foundation only.
// Real 2-4 player sync = BLOCKED. Mock backend cu bots dev-only.

export const SESSION_STATUS = Object.freeze({
  CREATING:  'creating',
  WAITING:   'waiting',
  STARTING:  'starting',
  ACTIVE:    'active',
  ENDING:    'ending',
  ENDED:     'ended',
  CANCELLED: 'cancelled',
  FAILED:    'failed'
});

export const PLAYER_ROLE = Object.freeze({
  HOST:   'host',
  PLAYER: 'player'
});

export const LOBBY_PLAYER_STATUS = Object.freeze({
  CONNECTING:   'connecting',
  WAITING:      'waiting',
  READY:        'ready',
  STARTING:     'starting',
  DISCONNECTED: 'disconnected'
});

export const NETWORK_STATUS = Object.freeze({
  DISCONNECTED: 'disconnected',
  CONNECTING:   'connecting',
  CONNECTED:    'connected',
  RECONNECTING: 'reconnecting',
  ERROR:        'error'
});

export const MP_BACKEND_STATUS = Object.freeze({
  NONE: 'none',
  MOCK: 'mock',
  REAL: 'real'
});

export const INVITE_TYPES = Object.freeze({
  DIRECT:      'direct',
  FROM_FRIEND: 'from_friend',
  PUBLIC:      'public'
});

// Session limits
export const MAX_PLAYERS = 4;
export const MIN_PLAYERS_TO_START = 1;
export const SESSION_TIMEOUT_MS = 60 * 60 * 1000;  // 1h idle
export const LOBBY_TIMEOUT_MS = 15 * 60 * 1000;    // 15 min in lobby

// Reason messages RO
export const REASON_MESSAGES = Object.freeze({
  session_not_found:       'Sesiune inexistentă sau cod invalid',
  session_full:            'Sesiunea este plină (max 4 jucători)',
  no_session:              'Nu ești într-o sesiune',
  not_all_ready:           'Nu toți jucătorii sunt gata',
  not_host:                'Doar host-ul poate face asta',
  already_in_session:      'Ai deja o sesiune activă',
  no_bots_available:       'Toți boții sunt deja adăugați',
  backend_unavailable:     'Backend indisponibil',
  invalid_code:            'Cod invalid (necesită 6 caractere)',
  self_invite:             'Nu poți invita pe tine însuți',
  network_error:           'Eroare de rețea',
  session_ended:           'Sesiunea s-a terminat',
  host_left:               'Host-ul a părăsit sesiunea',
  timeout:                 'Timp expirat'
});

// Session ID generation (mock — real backend would issue)
export function generateSessionId() {
  return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

export function generateSessionCode() {
  // 6-char human-friendly code pentru „Join by code"
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function validateSessionCode(code) {
  if (typeof code !== 'string') return false;
  const t = code.trim().toUpperCase();
  return /^[A-Z0-9]{6}$/.test(t);
}

// History retention
export const SESSION_HISTORY_MAX = 10;
