// Etapa 13 — Social configuration.
// Frozen enums + validare display name + retention pentru activity feed.

export const PRESENCE_STATUS = Object.freeze({
  ONLINE: 'online',
  OFFLINE: 'offline',
  AWAY: 'away',
  IN_GAME: 'in_game',
  UNKNOWN: 'unknown'
});

export const FRIEND_STATUS = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  BLOCKED: 'blocked',
  REMOVED: 'removed'
});

export const REQUEST_DIRECTION = Object.freeze({
  RECEIVED: 'received',
  SENT: 'sent'
});

export const INVITE_TYPES = Object.freeze({
  GAME_INVITE: 'game_invite',
  CONTRACT_INVITE: 'contract_invite',
  COMPANY_INVITE: 'company_invite',
  GROUP_INVITE: 'group_invite'
});

export const INVITE_STATUS = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
});

export const ACTIVITY_TYPES = Object.freeze({
  CONTRACT_COMPLETED: 'contract_completed',
  LEVEL_UP: 'level_up',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  EVENT_COMPLETED: 'event_completed',
  COMPANY_JOINED: 'company_joined',
  COMPANY_LEVEL_UP: 'company_level_up',
  REGION_UNLOCKED: 'region_unlocked',
  VEHICLE_PURCHASED: 'vehicle_purchased',
  MILESTONE: 'milestone'
});

export const VISIBILITY = Object.freeze({
  EVERYONE: 'everyone',
  FRIENDS: 'friends',
  NOBODY: 'nobody'
});

export const BACKEND_STATUS = Object.freeze({
  NONE: 'none',
  MOCK: 'mock',
  REAL: 'real'
});

// Name validation
export const NAME_MIN_LENGTH = 3;
export const NAME_MAX_LENGTH = 20;
export const NAME_ALLOWED_REGEX = /^[a-zA-Z0-9À-ſ ._-]+$/;

export function validateDisplayName(name) {
  if (typeof name !== 'string') return { ok: false, reason: 'not_string' };
  const t = name.trim();
  if (t.length < NAME_MIN_LENGTH) return { ok: false, reason: 'too_short' };
  if (t.length > NAME_MAX_LENGTH) return { ok: false, reason: 'too_long' };
  if (!NAME_ALLOWED_REGEX.test(t)) return { ok: false, reason: 'invalid_chars' };
  return { ok: true, name: t };
}

// Activity feed retention
export const ACTIVITY_MAX_ENTRIES = 100;
export const ACTIVITY_RETENTION_DAYS = 30;
export const ACTIVITY_RETENTION_MS = ACTIVITY_RETENTION_DAYS * 24 * 60 * 60 * 1000;

// Search history cap
export const SEARCH_HISTORY_MAX = 10;

// Reason messages friendly (RO)
export const REASON_MESSAGES = Object.freeze({
  not_string: 'Nume invalid',
  too_short: `Numele trebuie să aibă cel puțin ${NAME_MIN_LENGTH} caractere`,
  too_long: `Numele nu poate depăși ${NAME_MAX_LENGTH} caractere`,
  invalid_chars: 'Numele conține caractere nepermise',
  self_request: 'Nu îți poți trimite cerere ție însuți',
  already_friend: 'Deja sunteți prieteni',
  already_pending: 'Cererea există deja',
  blocked_player: 'Jucătorul este blocat',
  is_blocked_by_target: 'Nu poți contacta acest jucător',
  backend_unavailable: 'Backend indisponibil — funcția necesită conexiune reală',
  invalid_id: 'ID jucător invalid',
  player_not_found: 'Jucătorul nu a fost găsit',
  request_not_found: 'Cererea nu există',
  friend_not_found: 'Prietenul nu există'
});
