// EventBus simplu — publish/subscribe pentru cross-system events.
// Consumatori: MissionSystem (subscribe), toate sistemele existente (emit prin main.js).

export function createEventBus() {
  const listeners = new Map();
  return {
    on(type, handler) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(handler);
      return () => listeners.get(type).delete(handler);
    },
    emit(type, payload = {}) {
      const set = listeners.get(type);
      if (!set) return;
      for (const h of set) {
        try { h(payload); } catch (e) { console.error('[EventBus]', type, e); }
      }
    },
    off(type, handler) {
      listeners.get(type)?.delete(handler);
    },
    clear() { listeners.clear(); }
  };
}

export const EVENTS = Object.freeze({
  SNOW_CLEARED:       'snow.cleared',
  CONTRACT_COMPLETED: 'contract.completed',
  CONTRACT_FAILED:    'contract.failed',
  COINS_EARNED:       'coins.earned',
  XP_EARNED:          'xp.earned',
  TOOL_USED:          'tool.used',
  VEHICLE_USED:       'vehicle.used',
  VEHICLE_UPGRADED:   'vehicle.upgraded',
  TOOL_UPGRADED:      'tool.upgraded',
  FLEET_OP_COMPLETED: 'fleet.op.completed',
  REGION_UNLOCKED:    'region.unlocked',
  PLAYER_LEVEL_UP:    'player.level.up',
  COMPANY_LEVEL_UP:   'company.level.up',
  REPUTATION_EARNED:  'reputation.earned',
  DEPOSIT_MADE:       'deposit.made',
  EMPLOYEE_HIRED:     'employee.hired',
  VEHICLE_PURCHASED:  'vehicle.purchased',
  PRESTIGE_UP:        'prestige.up',
  ENDGAME_UNLOCKED:   'endgame.unlocked',
  EXTREME_CONTRACT_COMPLETED: 'extreme.contract.completed'
});
