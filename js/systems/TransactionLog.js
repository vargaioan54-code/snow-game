// Log in-memory al tranzactiilor (economy + XP + rewards).
// Ring buffer capat la 100. Nu persista.
// Consumatori: DebugTools (afisare console.table), analytics viitoare.

export const TX_TYPES = Object.freeze({
  MELT_REWARD:         'MELT_REWARD',
  DEPOSIT:             'DEPOSIT',
  TOOL_PURCHASE:       'TOOL_PURCHASE',
  BAG_UPGRADE:         'BAG_UPGRADE',
  UPGRADE_PURCHASE:    'UPGRADE_PURCHASE',
  XP_GAIN:             'XP_GAIN',
  LEVEL_REWARD:        'LEVEL_REWARD',
  DEBUG_GRANT:         'DEBUG_GRANT',
  CONTRACT_REWARD:     'CONTRACT_REWARD',
  CONTRACT_XP:         'CONTRACT_XP',
  CONTRACT_REPUTATION: 'CONTRACT_REPUTATION',
  REGION_UNLOCK:       'REGION_UNLOCK',
  LOCATION_UNLOCK:     'LOCATION_UNLOCK',
  WEATHER_CHANGE:      'WEATHER_CHANGE',
  VEHICLE_PURCHASE:    'VEHICLE_PURCHASE',
  VEHICLE_UPGRADE:     'VEHICLE_UPGRADE',
  VEHICLE_REPAIR:      'VEHICLE_REPAIR',
  VEHICLE_ENTER:       'VEHICLE_ENTER',
  VEHICLE_DEPOSIT:     'VEHICLE_DEPOSIT',
  ATTACHMENT_PURCHASE: 'ATTACHMENT_PURCHASE',
  FUEL_PURCHASE:       'FUEL_PURCHASE',
  GARAGE_UPGRADE:      'GARAGE_UPGRADE',
  SERVICE_COMPLETE:    'SERVICE_COMPLETE',
  COMPANY_CREATED:     'COMPANY_CREATED',
  COMPANY_RENAME:      'COMPANY_RENAME',
  COMPANY_XP:          'COMPANY_XP',
  COMPANY_LEVEL_UP:    'COMPANY_LEVEL_UP',
  COMPANY_REVENUE:     'COMPANY_REVENUE',
  COMPANY_EXPENSE:     'COMPANY_EXPENSE',
  COMPANY_UPGRADE:     'COMPANY_UPGRADE',
  // Etapa 9 — Employees + Fleet
  EMPLOYEE_HIRE:            'EMPLOYEE_HIRE',
  EMPLOYEE_FIRE:            'EMPLOYEE_FIRE',
  EMPLOYEE_SALARY:          'EMPLOYEE_SALARY',
  EMPLOYEE_LEVEL_UP:        'EMPLOYEE_LEVEL_UP',
  FLEET_OPERATION_START:    'FLEET_OPERATION_START',
  FLEET_OPERATION_COMPLETE: 'FLEET_OPERATION_COMPLETE',
  FLEET_OPERATION_CANCEL:   'FLEET_OPERATION_CANCEL',
  FLEET_OPERATION_FAIL:     'FLEET_OPERATION_FAIL',
  // Etapa 10 — Missions + Achievements
  MISSION_CLAIM:            'MISSION_CLAIM',
  ACHIEVEMENT_UNLOCK:       'ACHIEVEMENT_UNLOCK',
  MISSIONS_DAILY_ROLL:      'MISSIONS_DAILY_ROLL',
  MISSIONS_WEEKLY_ROLL:     'MISSIONS_WEEKLY_ROLL',
  // Etapa 11 — Events + Seasons
  EVENT_START:              'EVENT_START',
  EVENT_COMPLETE:           'EVENT_COMPLETE',
  EVENT_CLAIM:              'EVENT_CLAIM',
  EVENT_EXPIRE:             'EVENT_EXPIRE',
  SEASON_START:             'SEASON_START',
  SEASON_END:               'SEASON_END',
  SEASON_CLAIM:             'SEASON_CLAIM',
  // Etapa 12 — Monetization
  IAP_PURCHASE:             'IAP_PURCHASE',
  IAP_RESTORE:              'IAP_RESTORE',
  IAP_REFUND:               'IAP_REFUND',
  BOOST_ACTIVATE:           'BOOST_ACTIVATE',
  BOOST_EXPIRE:             'BOOST_EXPIRE',
  ENTITLEMENT_GRANT:        'ENTITLEMENT_GRANT',
  SEASON_PASS_PURCHASE:     'SEASON_PASS_PURCHASE',
  PREMIUM_CURRENCY_GRANT:   'PREMIUM_CURRENCY_GRANT',
  // Etapa 13 — Social
  SOCIAL_FRIEND_ADD:        'SOCIAL_FRIEND_ADD',
  SOCIAL_FRIEND_REMOVE:     'SOCIAL_FRIEND_REMOVE',
  SOCIAL_BLOCK:             'SOCIAL_BLOCK',
  SOCIAL_UNBLOCK:           'SOCIAL_UNBLOCK',
  SOCIAL_INVITE_SEND:       'SOCIAL_INVITE_SEND',
  SOCIAL_PROFILE_UPDATE:    'SOCIAL_PROFILE_UPDATE',
  // Etapa 14 — Multiplayer / Co-op (mock backend, real sync BLOCKED)
  MP_SESSION_CREATE:        'MP_SESSION_CREATE',
  MP_SESSION_JOIN:          'MP_SESSION_JOIN',
  MP_SESSION_LEAVE:         'MP_SESSION_LEAVE',
  MP_SESSION_START:         'MP_SESSION_START',
  MP_SESSION_END:           'MP_SESSION_END',
  MP_INVITE_SEND:           'MP_INVITE_SEND',
  MP_BOT_ADDED:             'MP_BOT_ADDED',
  MP_REWARD_GRANT:          'MP_REWARD_GRANT',
  // Etapa 15 — Prestige + Endgame
  PRESTIGE_EXECUTE:         'PRESTIGE_EXECUTE',
  PRESTIGE_BONUS_APPLY:     'PRESTIGE_BONUS_APPLY',
  PRESTIGE_MILESTONE:       'PRESTIGE_MILESTONE',
  ENDGAME_CONTRACT_COMPLETE:'ENDGAME_CONTRACT_COMPLETE',
  ENDGAME_UNLOCK:           'ENDGAME_UNLOCK',
  // Etapa 16 — Polish + Mobile Optimization
  QUALITY_CHANGE:           'QUALITY_CHANGE',
  PERFORMANCE_DEGRADE:      'PERFORMANCE_DEGRADE',
  ERROR_RECOVERED:          'ERROR_RECOVERED',
  BATTERY_SAVER_ON:         'BATTERY_SAVER_ON',
  BATTERY_SAVER_OFF:        'BATTERY_SAVER_OFF'
});

const MAX = 100;

export function createTransactionLog() {
  const transactions = [];
  let counter = 0;

  function log(entry) {
    if (!entry || typeof entry !== 'object') return;
    const rec = {
      id: ++counter,
      ts: Date.now(),
      type: entry.type || 'UNKNOWN',
      currency: entry.currency || null,     // 'coins' | 'diamonds' | 'xp' | 'reputation' | null
      amount: Number(entry.amount) || 0,
      balanceAfter: entry.balanceAfter,     // poate fi obiect {bag, vault} sau numar
      meta: entry.meta || null
    };
    transactions.push(rec);
    if (transactions.length > MAX) transactions.shift();
  }

  function getRecent(n = 20) {
    const k = Math.max(0, Math.min(n, transactions.length));
    return transactions.slice(-k);
  }

  function getAll() { return [...transactions]; }

  function clear() { transactions.length = 0; counter = 0; }

  return { log, getRecent, getAll, clear, TX_TYPES };
}
