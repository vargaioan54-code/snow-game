// Events + Seasons config (Etapa 11)
// Timeline: fiecare event are startOffsetMs (relativ la installTime) + durationMs.
// Weather modifier `weatherType` triggerează single weather setWeather la activare.

import { OBJECTIVE_TYPES } from './missions.js';

export const EVENT_CATEGORIES = ['challenge', 'seasonal', 'competitive', 'story'];

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

export const EVENTS = [
  {
    id: 'evt_first_snow',
    name: 'Prima Ninsoare',
    description: 'Salut, contractor! Fă cunoștință cu iarna curățând primele contracte.',
    category: 'story',
    priority: 10,
    startOffsetMs: 0,
    durationMs: 7 * DAY,
    objectives: [
      { id: 'obj1', type: OBJECTIVE_TYPES.CLEAR_SNOW, target: 5000, description: 'Curăță 5.000 zăpadă' },
      { id: 'obj2', type: OBJECTIVE_TYPES.COMPLETE_CONTRACT, target: 3, description: 'Finalizează 3 contracte' }
    ],
    rewards: { coins: 2000, xp: 800, reputation: 20 },
    requirements: {},
    active: true, repeatable: false
  },
  {
    id: 'evt_heavy_snow_week',
    name: 'Săptămâna Zăpezii Grele',
    description: 'Rezistă zăpezii masive! Bonus reward pe săptămâna asta.',
    category: 'challenge',
    priority: 8,
    startOffsetMs: 12 * HOUR,
    durationMs: 7 * DAY,
    objectives: [
      { id: 'obj1', type: OBJECTIVE_TYPES.CLEAR_SNOW, target: 25000, description: 'Curăță 25.000 zăpadă' },
      { id: 'obj2', type: OBJECTIVE_TYPES.COMPLETE_CONTRACT, target: 10, description: 'Finalizează 10 contracte' }
    ],
    rewards: { coins: 8000, xp: 3000, reputation: 50 },
    requirements: { playerLevel: 3 },
    modifiers: { rewardMultiplier: 1.15, snowfallRate: 1.5 },
    active: true, repeatable: true, seasonId: 'season_winter_2026'
  },
  {
    id: 'evt_blizzard_challenge',
    name: 'Provocarea Viscolului',
    description: 'Numai pentru cei mai curajoși — vreme extremă în munte.',
    category: 'challenge',
    priority: 9,
    startOffsetMs: 1 * DAY,
    durationMs: 3 * DAY,
    objectives: [
      { id: 'obj1', type: OBJECTIVE_TYPES.CLEAR_SNOW, target: 15000, description: 'Curăță 15.000 în munte' },
      { id: 'obj2', type: OBJECTIVE_TYPES.COMPLETE_CONTRACT_TIER, target: 3, tier: 'tier_3', description: 'Finalizează 3 contracte T3' }
    ],
    rewards: { coins: 15000, xp: 5000, reputation: 100 },
    requirements: { regions: ['mountain'], companyLevel: 5 },
    modifiers: { rewardMultiplier: 1.5, weatherType: 'blizzard', snowfallRate: 2.0 },
    active: true, repeatable: false, seasonId: 'season_winter_2026'
  },
  {
    id: 'evt_airport_snow_week',
    name: 'Săptămâna Aeroportului',
    description: 'Aeroporturile au nevoie de tine — contracte industriale mari.',
    category: 'challenge',
    priority: 7,
    startOffsetMs: 3 * DAY,
    durationMs: 7 * DAY,
    objectives: [
      { id: 'obj1', type: OBJECTIVE_TYPES.COMPLETE_FLEET_OP, target: 5, description: 'Finalizează 5 operațiuni fleet' },
      { id: 'obj2', type: OBJECTIVE_TYPES.EARN_COINS, target: 20000, description: 'Câștigă 20.000 monede' }
    ],
    rewards: { coins: 20000, xp: 8000, reputation: 150 },
    requirements: { companyLevel: 6 },
    modifiers: { rewardMultiplier: 1.3 },
    active: true, repeatable: false, seasonId: 'season_winter_2026'
  },
  {
    id: 'evt_christmas_village',
    name: 'Satul de Crăciun',
    description: 'Ajută satul să prindă spiritul Crăciunului!',
    category: 'seasonal',
    priority: 10,
    startOffsetMs: 6 * DAY,
    durationMs: 1 * DAY,
    objectives: [
      { id: 'obj1', type: OBJECTIVE_TYPES.CLEAR_SNOW, target: 8000, description: 'Curăță zăpadă în village center' },
      { id: 'obj2', type: OBJECTIVE_TYPES.COMPLETE_CONTRACT, target: 5, description: 'Finalizează 5 contracte' }
    ],
    rewards: { coins: 5000, xp: 2000, reputation: 30 },
    requirements: {},
    modifiers: { rewardMultiplier: 2.0 },
    active: true, repeatable: false, seasonId: 'season_winter_2026'
  }
];

export const EVENT_BY_ID = Object.fromEntries(EVENTS.map(e => [e.id, e]));

export const SEASONS = [
  {
    id: 'season_winter_2026',
    name: 'Iarna 2026',
    description: 'Prima ta iarnă ca antreprenor snow!',
    theme: 'winter',
    startOffsetMs: 0,
    durationMs: 30 * DAY,
    eventIds: ['evt_heavy_snow_week', 'evt_blizzard_challenge', 'evt_airport_snow_week', 'evt_christmas_village'],
    rewards: { coins: 50000, xp: 20000, reputation: 500 },
    active: true
  }
];

export const SEASON_BY_ID = Object.fromEntries(SEASONS.map(s => [s.id, s]));

// Utility: valid status enums
export const EVENT_STATUS = Object.freeze({
  UPCOMING: 'UPCOMING',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
  LOCKED: 'LOCKED',
  DISABLED: 'DISABLED'
});

export const SEASON_STATUS = Object.freeze({
  UPCOMING: 'UPCOMING',
  ACTIVE: 'ACTIVE',
  ENDED: 'ENDED',
  DISABLED: 'DISABLED'
});
