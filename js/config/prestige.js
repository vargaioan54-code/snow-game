// Etapa 15 — Prestige config: ranks, requirements, permanent bonuses, reset rules.
// Ranks 0..10 cumulative. Fiecare Prestige applies permanent multipliers.

export const PRESTIGE_RANKS = [
  { rank: 0,  name: 'Novice',        icon: '❄️', color: '#a0a0a0' },
  { rank: 1,  name: 'Professional',  icon: '🌨️', color: '#4a9eff' },
  { rank: 2,  name: 'Expert',        icon: '⛄',  color: '#20d0e0' },
  { rank: 3,  name: 'Master',        icon: '❄',  color: '#00ffaa' },
  { rank: 4,  name: 'Elite',         icon: '🏔️', color: '#ffaa20' },
  { rank: 5,  name: 'Arctic Master', icon: '🥇', color: '#ff8c00' },
  { rank: 6,  name: 'Snow Legend',   icon: '🏆', color: '#ff4040' },
  { rank: 7,  name: 'Winter God',    icon: '👑', color: '#e020ff' },
  { rank: 8,  name: 'Ice Emperor',   icon: '💎', color: '#ff00e0' },
  { rank: 9,  name: 'Blizzard Lord', icon: '⚡', color: '#ffff00' },
  { rank: 10, name: 'Mythic',        icon: '🌌', color: '#ffffff' }
];
export const PRESTIGE_MAX = 10;

// Cerințe pentru fiecare Prestige level target (targetRank >= 1)
export function prestigeRequirements(targetRank) {
  const t = Math.max(1, Math.min(PRESTIGE_MAX, Math.floor(targetRank)));
  const base = {
    playerLevel: 20,
    companyLevel: 5,
    reputation: 200,
    contractsCompleted: 30,
    unlockedRegions: 2,
    extremeContractsCompleted: 3
  };
  const mult = 1 + (t - 1) * 0.3;  // +30% per Prestige rank
  return {
    playerLevel: Math.round(base.playerLevel * mult),
    companyLevel: Math.min(10, Math.round(base.companyLevel + (t - 1) * 0.5)),
    reputation: Math.round(base.reputation * mult),
    contractsCompleted: Math.round(base.contractsCompleted * mult),
    unlockedRegions: Math.min(4, base.unlockedRegions + Math.floor((t - 1) / 3)),
    extremeContractsCompleted: Math.round(base.extremeContractsCompleted * mult)
  };
}

// Permanent bonuses după fiecare Prestige (cumulative)
export function prestigePermanentBonuses(currentPrestige) {
  const p = Math.max(0, Math.min(PRESTIGE_MAX, Math.floor(currentPrestige || 0)));
  return {
    xpMultiplier:             1.0 + p * 0.05,   // +5% XP per Prestige
    coinMultiplier:           1.0 + p * 0.05,   // +5% Coins
    snowClearMultiplier:      1.0 + p * 0.05,   // +5% snow clear rate
    contractRewardMultiplier: 1.0 + p * 0.03,   // +3% contract rewards
    capacityBonus:            p * 100,          // +100 bag cap per Prestige
    reputationMultiplier:     1.0 + p * 0.05
  };
}

// Reset rules — declarative (folosit pentru UI preview + docs)
export const RESET_RULES = {
  RESET: [
    'playerStore.level → 1',
    'playerStore.xp → 0',
    'playerStore.bagCoins → 0',
    'companyStore.level → 1',
    'companyStore.xp → 0',
    'companyStore.funds → 100 (starting)',
    'companyStore.unlockedTiers → [tier_1]',
    'MissionStore.daily/weekly → cleared (re-roll la boot)'
  ],
  KEEP: [
    'playerStore.id, name, createdAt',
    'playerStore.vaultCoins × 0.10 retention (păstrează 10%)',
    'playerStore.diamonds (păstrat)',
    'playerStore.reputation × 0.20 (păstrează 20%)',
    'playerStore.owned tools (păstrate)',
    'playerStore.stats (lifetime — cumulative)',
    'VehicleStore (păstrat integral)',
    'GarageStore (păstrat)',
    'EntitlementStore (păstrat — cumpărăturile persistă)',
    'CompanyStore.companyId + name + foundedAt + stats',
    'WorldStore.unlockedRegions/Locations (păstrate)',
    'SocialStore (păstrat)',
    'EventStore (păstrat)',
    'MissionStore.achievements (unlocked persistă)',
    'PrestigeStore (păstrat toată istoria)',
    'Permanent bonuses (cumulative)'
  ]
};

// Retention rates
export const VAULT_COIN_RETENTION = 0.10;
export const REPUTATION_RETENTION = 0.20;

// Helper — dictionary rank access
export const PRESTIGE_RANK_BY_ID = Object.fromEntries(PRESTIGE_RANKS.map(r => [r.rank, r]));

export function getPrestigeRank(rank) {
  return PRESTIGE_RANK_BY_ID[Math.max(0, Math.min(PRESTIGE_MAX, Math.floor(rank || 0)))] || PRESTIGE_RANKS[0];
}
