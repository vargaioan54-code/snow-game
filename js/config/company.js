// Etapa 8 — Company config: nivele, tiere contracte, upgrades.

export const COMPANY_LEVELS = [
  { level: 1,  name: 'Small Snow Service',          xpToNext: 100,   unlocks: [] },
  { level: 2,  name: 'Local Snow Service',          xpToNext: 300,   unlocks: ['tier_2'] },
  { level: 3,  name: 'Professional Snow Company',   xpToNext: 700,   unlocks: ['region_town'] },
  { level: 4,  name: 'Regional Snow Company',       xpToNext: 1500,  unlocks: ['tier_3'] },
  { level: 5,  name: 'Major Snow Contractor',       xpToNext: 3000,  unlocks: ['region_industrial'] },
  { level: 6,  name: 'Large Snow Operations',       xpToNext: 6000,  unlocks: ['tier_4'] },
  { level: 7,  name: 'Elite Snow Corp',             xpToNext: 12000, unlocks: ['region_mountain'] },
  { level: 8,  name: 'National Snow Enterprise',    xpToNext: 25000, unlocks: ['tier_5'] },
  { level: 9,  name: 'Continental Snow Group',      xpToNext: 50000, unlocks: [] },
  { level: 10, name: 'Global Snow Empire',          xpToNext: 0,     unlocks: [] }
];
export const COMPANY_MAX_LEVEL = 10;

export const CONTRACT_TIERS = [
  { id: 'tier_1', name: 'Residențial',       requiredLevel: 1, requiredReputation: 0,   color: '#3ea862' },
  { id: 'tier_2', name: 'Comercial',         requiredLevel: 2, requiredReputation: 20,  color: '#3fd8ff' },
  { id: 'tier_3', name: 'Industrial',        requiredLevel: 4, requiredReputation: 80,  color: '#ffc043' },
  { id: 'tier_4', name: 'Comercial Mare',    requiredLevel: 6, requiredReputation: 200, color: '#e04040' },
  { id: 'tier_5', name: 'Infrastructură',    requiredLevel: 8, requiredReputation: 500, color: '#c8a840' }
];
export const TIER_BY_ID = Object.fromEntries(CONTRACT_TIERS.map(t => [t.id, t]));

export const COMPANY_UPGRADES = {
  contract_capacity: {
    id: 'contract_capacity',
    name: 'Capacitate contracte',
    description: 'Numărul de contracte active simultan',
    maxLevel: 3,
    effect: [1, 2, 3],
    costs: [null, 500, 2000, 8000]
  },
  reward_modifier: {
    id: 'reward_modifier',
    name: 'Reward multiplier',
    description: 'Bonus pe recompense contracte',
    maxLevel: 3,
    effect: [1.0, 1.05, 1.10, 1.20],
    costs: [null, 800, 3000, 12000]
  },
  reputation_gain: {
    id: 'reputation_gain',
    name: 'Reputation gain',
    description: 'Bonus la reputația din contracte',
    maxLevel: 3,
    effect: [1.0, 1.15, 1.30, 1.50],
    costs: [null, 600, 2500, 10000]
  },
  clearing_efficiency: {
    id: 'clearing_efficiency',
    name: 'Efficiency snow clearing',
    description: 'Bonus la puterea de curățare',
    maxLevel: 3,
    effect: [1.0, 1.05, 1.10, 1.20],
    costs: [null, 1000, 4000, 15000]
  },
  garage_capacity: {
    id: 'garage_capacity',
    name: 'Company Garage Capacity',
    description: 'Sloturi extra vehicule',
    maxLevel: 3,
    effect: [0, 1, 2, 3],
    costs: [null, 5000, 20000, 50000]
  }
};
export const COMPANY_UPGRADE_IDS = Object.keys(COMPANY_UPGRADES);

// XP from a contract completion (base coins & rating)
export function companyXpForContract(baseCoins, rating) {
  const r = Math.max(0, Math.min(5, rating || 0));
  return Math.round((baseCoins || 0) * 0.15 * (0.6 + r * 0.1));
}

// 40% din reward-ul final in coins → company funds bonus (peste coins la vault)
export function companyFundsForContract(finalCoins) {
  return Math.max(0, Math.round((finalCoins || 0) * 0.40));
}

// Rating (0..5) → reputation gain de bază
export function reputationForRating(rating) {
  const table = [0, 1, 2, 4, 7, 12];
  const r = Math.max(0, Math.min(5, Math.floor(rating || 0)));
  return table[r] || 0;
}

// Validare nume: minim 3, maxim 30, nu doar spațiu, nu doar emoji
export function validateCompanyName(name) {
  if (typeof name !== 'string') return { ok: false, reason: 'not_string' };
  const trimmed = name.trim();
  if (trimmed.length < 3) return { ok: false, reason: 'too_short' };
  if (trimmed.length > 30) return { ok: false, reason: 'too_long' };
  // trebuie să conțină cel puțin o literă alfa
  if (!/[a-zA-ZăâîșțĂÂÎȘȚ]/.test(trimmed)) return { ok: false, reason: 'no_letters' };
  return { ok: true, cleaned: trimmed };
}

// Nume aleator: Adjective + Snow + Suffix
const ADJECTIVES = ['Arctic', 'Winter', 'Frost', 'Alpine', 'Nordic', 'Ice', 'Blizzard', 'Silver', 'Crystal', 'Polar'];
const SUFFIXES = ['Services', 'Solutions', 'Operations', 'Group', 'Corp', 'Company'];
export function randomCompanyName() {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const s = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  return `${a} Snow ${s}`;
}
