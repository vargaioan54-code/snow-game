// Config Missions — permanent + daily + weekly pools

export const OBJECTIVE_TYPES = Object.freeze({
  CLEAR_SNOW: 'clear_snow',
  CLEAR_SNOW_TYPE: 'clear_snow_type',
  COMPLETE_CONTRACT: 'complete_contract',
  COMPLETE_CONTRACT_TIER: 'complete_contract_tier',
  EARN_COINS: 'earn_coins',
  EARN_XP: 'earn_xp',
  USE_TOOL: 'use_tool',
  USE_VEHICLE: 'use_vehicle',
  UPGRADE_VEHICLE: 'upgrade_vehicle',
  UPGRADE_TOOL: 'upgrade_tool',
  COMPLETE_FLEET_OP: 'complete_fleet_op',
  UNLOCK_REGION: 'unlock_region',
  REACH_PLAYER_LEVEL: 'reach_player_level',
  REACH_COMPANY_LEVEL: 'reach_company_level',
  EARN_REPUTATION: 'earn_reputation',
  DEPOSIT_COINS: 'deposit_coins',
  HIRE_EMPLOYEE: 'hire_employee'
});

export const PERMANENT_MISSIONS = [
  { id: 'perm_first_snow',     name: 'Prima Zăpadă',           description: 'Curăță prima unitate de zăpadă',        objective: { type: 'clear_snow', target: 1 },                 reward: { coins: 50, xp: 20 } },
  { id: 'perm_first_contract', name: 'Primul Contract',        description: 'Completează primul contract',            objective: { type: 'complete_contract', target: 1 },          reward: { coins: 200, xp: 100 } },
  { id: 'perm_first_vehicle',  name: 'Primul Vehicul',         description: 'Cumpără și folosește primul vehicul',    objective: { type: 'use_vehicle', target: 1 },                reward: { coins: 500, xp: 200 } },
  { id: 'perm_10k_snow',       name: '10.000 Zăpadă',          description: 'Curăță 10.000 unități de zăpadă',        objective: { type: 'clear_snow', target: 10000 },             reward: { coins: 1000, xp: 500 } },
  { id: 'perm_first_fleet',    name: 'Prima Operațiune Fleet', description: 'Finalizează prima operațiune fleet',     objective: { type: 'complete_fleet_op', target: 1 },          reward: { coins: 500, xp: 300, reputation: 10 }, requirements: { companyLevel: 1 } }
];

export const DAILY_POOL = [
  { id: 'daily_clear_1k',      category: 'snow',      objective: { type: 'clear_snow', target: 1000 },        reward: { coins: 150, xp: 60 },  weight: 10 },
  { id: 'daily_clear_3k',      category: 'snow',      objective: { type: 'clear_snow', target: 3000 },        reward: { coins: 400, xp: 150 }, weight: 6 },
  { id: 'daily_2_contracts',   category: 'contracts', objective: { type: 'complete_contract', target: 2 },    reward: { coins: 600, xp: 200 }, weight: 8 },
  { id: 'daily_earn_500',      category: 'economy',   objective: { type: 'earn_coins', target: 500 },         reward: { coins: 250, xp: 100 }, weight: 7 },
  { id: 'daily_earn_2k',       category: 'economy',   objective: { type: 'earn_coins', target: 2000 },        reward: { coins: 800, xp: 300 }, weight: 4 },
  { id: 'daily_deposit_1k',    category: 'economy',   objective: { type: 'deposit_coins', target: 1000 },     reward: { coins: 200, xp: 80 },  weight: 6 },
  { id: 'daily_fleet_op',      category: 'fleet',     objective: { type: 'complete_fleet_op', target: 1 },    reward: { coins: 400, xp: 180, reputation: 5 }, weight: 5, requirements: { companyLevel: 1 } },
  { id: 'daily_use_vehicle',   category: 'vehicles',  objective: { type: 'use_vehicle', target: 1 },          reward: { coins: 150, xp: 60 },  weight: 9 },
  { id: 'daily_use_tool',      category: 'tools',     objective: { type: 'use_tool', target: 1 },             reward: { coins: 100, xp: 40 },  weight: 10 },
  { id: 'daily_reputation',    category: 'company',   objective: { type: 'earn_reputation', target: 10 },     reward: { coins: 300, xp: 120 }, weight: 5, requirements: { companyLevel: 1 } }
];

export const WEEKLY_POOL = [
  { id: 'weekly_15_contracts',    objective: { type: 'complete_contract', target: 15 },    reward: { coins: 3000, xp: 1500, reputation: 50 },   weight: 5 },
  { id: 'weekly_50k_snow',        objective: { type: 'clear_snow', target: 50000 },        reward: { coins: 5000, xp: 2500 },                   weight: 5 },
  { id: 'weekly_25k_earn',        objective: { type: 'earn_coins', target: 25000 },        reward: { coins: 2500, xp: 1200 },                   weight: 6 },
  { id: 'weekly_10_fleet',        objective: { type: 'complete_fleet_op', target: 10 },    reward: { coins: 5000, xp: 2000, reputation: 100 },  weight: 3, requirements: { companyLevel: 2 } },
  { id: 'weekly_20k_snow',        objective: { type: 'clear_snow', target: 20000 },        reward: { coins: 2000, xp: 1000 },                   weight: 5 }
];

export const DAILY_MISSION_COUNT = 3;
export const WEEKLY_MISSION_COUNT = 2;
export const DAILY_RESET_HOURS = 24;
export const WEEKLY_RESET_HOURS = 168;

// Weighted random selection filtered by requirements
export function pickMissions(pool, count, playerState, companyState) {
  const available = pool.filter(m => {
    if (!m.requirements) return true;
    if (m.requirements.playerLevel && (playerState?.level || 1) < m.requirements.playerLevel) return false;
    if (m.requirements.companyLevel && (companyState?.level || 0) < m.requirements.companyLevel) return false;
    return true;
  });
  const picked = [];
  const remaining = [...available];
  for (let i = 0; i < count && remaining.length > 0; i++) {
    const totalWeight = remaining.reduce((s, m) => s + (m.weight || 1), 0);
    let r = Math.random() * totalWeight;
    let idx = 0;
    for (let j = 0; j < remaining.length; j++) {
      r -= (remaining[j].weight || 1);
      if (r <= 0) { idx = j; break; }
    }
    picked.push(remaining[idx]);
    remaining.splice(idx, 1);
  }
  return picked;
}

export const DAILY_BY_ID = Object.fromEntries(DAILY_POOL.map(m => [m.id, m]));
export const WEEKLY_BY_ID = Object.fromEntries(WEEKLY_POOL.map(m => [m.id, m]));
export const PERMANENT_BY_ID = Object.fromEntries(PERMANENT_MISSIONS.map(m => [m.id, m]));
