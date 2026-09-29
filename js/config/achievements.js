// Config Achievements — persistente, single unlock, auto-reward

export const ACHIEVEMENT_CATEGORIES = ['snow', 'contracts', 'vehicles', 'fleet', 'company', 'progression'];

export const ACHIEVEMENTS = [
  // Snow (5)
  { id: 'ach_snow_100',   category: 'snow', name: 'Începător',     description: 'Curăță 100 unități',        objective: { type: 'clear_snow', target: 100 },     reward: { coins: 50, xp: 25 } },
  { id: 'ach_snow_10k',   category: 'snow', name: 'Muncitor',      description: 'Curăță 10.000 unități',     objective: { type: 'clear_snow', target: 10000 },   reward: { coins: 500, xp: 200 } },
  { id: 'ach_snow_100k',  category: 'snow', name: 'Expert Zăpadă', description: 'Curăță 100.000 unități',    objective: { type: 'clear_snow', target: 100000 },  reward: { coins: 5000, xp: 2000, reputation: 50 } },
  { id: 'ach_snow_500k',  category: 'snow', name: 'Maestru Snow',  description: 'Curăță 500.000',            objective: { type: 'clear_snow', target: 500000 },  reward: { coins: 20000, xp: 8000, reputation: 200 } },
  { id: 'ach_snow_1m',    category: 'snow', name: 'Legendă Snow',  description: 'Curăță 1.000.000',          objective: { type: 'clear_snow', target: 1000000 }, reward: { coins: 100000, xp: 30000, reputation: 1000 }, hidden: true },

  // Contracts (5)
  { id: 'ach_contract_1',   category: 'contracts', name: 'Primul Job',    description: 'Completează primul contract',   objective: { type: 'complete_contract', target: 1 },   reward: { coins: 100, xp: 50 } },
  { id: 'ach_contract_10',  category: 'contracts', name: '10 Contracte',  description: 'Completează 10 contracte',      objective: { type: 'complete_contract', target: 10 },  reward: { coins: 1000, xp: 500 } },
  { id: 'ach_contract_50',  category: 'contracts', name: '50 Contracte',  description: 'Completează 50 contracte',      objective: { type: 'complete_contract', target: 50 },  reward: { coins: 5000, xp: 2500 } },
  { id: 'ach_contract_100', category: 'contracts', name: 'Sută Rotundă',  description: 'Completează 100 contracte',     objective: { type: 'complete_contract', target: 100 }, reward: { coins: 15000, xp: 8000, reputation: 100 } },
  { id: 'ach_contract_500', category: 'contracts', name: 'Profesionist',  description: 'Completează 500 contracte',     objective: { type: 'complete_contract', target: 500 }, reward: { coins: 100000, xp: 50000, reputation: 1000 } },

  // Vehicles (3)
  { id: 'ach_first_vehicle',        category: 'vehicles', name: 'Primul Vehicul', description: 'Cumpără primul vehicul',              objective: { type: 'use_vehicle', target: 1 },      reward: { coins: 500, xp: 250 } },
  { id: 'ach_all_vehicle_types',    category: 'vehicles', name: 'Colecționar',    description: 'Deține toate 4 tipuri vehicule',      objective: { type: 'use_vehicle', target: 4 },      reward: { coins: 10000, xp: 5000, reputation: 100 } },
  { id: 'ach_vehicle_upgrade_max',  category: 'vehicles', name: 'Utilaj Optim',   description: 'Cumpără 15 upgrade-uri de vehicule',  objective: { type: 'upgrade_vehicle', target: 15 }, reward: { coins: 5000, xp: 2500 } },

  // Fleet (3)
  { id: 'ach_first_hire',      category: 'fleet', name: 'Prima Angajare', description: 'Angajează primul muncitor',               objective: { type: 'hire_employee', target: 1 },        reward: { coins: 500, xp: 200, reputation: 5 } },
  { id: 'ach_10_fleet_ops',    category: 'fleet', name: 'Fleet Operativ', description: '10 operațiuni fleet finalizate',          objective: { type: 'complete_fleet_op', target: 10 },   reward: { coins: 2500, xp: 1200, reputation: 25 } },
  { id: 'ach_50_fleet_ops',    category: 'fleet', name: 'Fleet Master',   description: '50 operațiuni fleet',                     objective: { type: 'complete_fleet_op', target: 50 },   reward: { coins: 15000, xp: 7500, reputation: 150 } },

  // Company (3)
  { id: 'ach_company_level_5',  category: 'company', name: 'Companie în Creștere', description: 'Ajunge la Company Level 5',        objective: { type: 'reach_company_level', target: 5 },  reward: { coins: 5000, xp: 2500, reputation: 50 } },
  { id: 'ach_company_level_10', category: 'company', name: 'Company Empire',       description: 'Ajunge la Company Level 10 (max)', objective: { type: 'reach_company_level', target: 10 }, reward: { coins: 100000, xp: 50000, reputation: 500 }, hidden: true },
  { id: 'ach_all_regions',      category: 'company', name: 'Explorator',           description: 'Deblochează toate regiunile',      objective: { type: 'unlock_region', target: 4 },        reward: { coins: 20000, xp: 10000, reputation: 200 } },

  // Progression (2)
  { id: 'ach_player_level_5',  category: 'progression', name: 'Începător Serios', description: 'Ajunge la Player Level 5',  objective: { type: 'reach_player_level', target: 5 },  reward: { coins: 1000, xp: 500 } },
  { id: 'ach_player_level_20', category: 'progression', name: 'Veteran',          description: 'Ajunge la Player Level 20', objective: { type: 'reach_player_level', target: 20 }, reward: { coins: 10000, xp: 5000, reputation: 100 } }
];

export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]));
export const ACHIEVEMENTS_BY_CATEGORY = ACHIEVEMENT_CATEGORIES.reduce((acc, cat) => {
  acc[cat] = ACHIEVEMENTS.filter(a => a.category === cat);
  return acc;
}, {});
