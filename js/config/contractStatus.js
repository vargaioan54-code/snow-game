// Etapa 3 — enum status contracte (imutabil)
export const CONTRACT_STATUS = Object.freeze({
  AVAILABLE: 'available',
  LOCKED:    'locked',
  ACCEPTED:  'accepted',
  ACTIVE:    'active',
  COMPLETED: 'completed',
  FAILED:    'failed',
  EXPIRED:   'expired',
  CANCELLED: 'cancelled'
});

export const FAIL_REASONS = Object.freeze({
  TIMEOUT:        'timeout',
  ABORTED:        'aborted',
  INVALID_AREA:   'invalid_area'
});

export const ACCEPT_REJECT_REASONS = Object.freeze({
  UNKNOWN:         'unknown',
  NOT_AVAILABLE:   'not_available',
  ACTIVE_EXISTS:   'active_exists',
  LEVEL_LOCKED:    'level_locked',
  TOOL_LOCKED:     'tool_locked',
  INVALID_TARGET:  'invalid_target'
});
