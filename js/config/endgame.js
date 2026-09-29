// Etapa 15 — Endgame contracts config. Extindere pe tier_endgame (peste CONTRACT_TIERS din Etapa 8).

export const ENDGAME_TIER = {
  id: 'tier_endgame',
  name: 'Endgame',
  requiredLevel: 15,
  requiredReputation: 1000,
  color: '#ffd700'
};

// Extreme contracts (endgame) — 6 templates
export const ENDGAME_CONTRACTS = [
  {
    id: 'endg_airport_emergency', type: 'warehouse', title: 'Urgență Aeroport', client: 'Aeroport Otopeni',
    description: 'Blizzard peste noapte — pistele trebuie curățate în 5 min sau se închide aeroportul!',
    area: { x: 30, z: 30, radius: 8 }, tier: 'tier_endgame',
    snowTypeHint: 'blizzard', targetPct: 0.98, requiredMass: 200, timeLimit: 300,
    baseReward: { coins: 25000, xp: 8000, reputation: 300 }, difficulty: 'expert', unlockLevel: 15,
    preferredVehicle: 'loader_wheel', extremeWeather: 'blizzard'
  },
  {
    id: 'endg_mountain_rescue', type: 'shop', title: 'Salvare Munte', client: 'Cabana Peak',
    description: 'Salvatorii au nevoie de drum liber prin zăpadă adâncă și gheață — VIS ÎNTREG!',
    area: { x: -32, z: -30, radius: 7 }, tier: 'tier_endgame',
    snowTypeHint: 'deep', targetPct: 0.95, requiredMass: 180, timeLimit: 400,
    baseReward: { coins: 20000, xp: 7000, reputation: 250 }, difficulty: 'expert', unlockLevel: 15,
    preferredVehicle: 'tractor_utility', extremeWeather: 'heavy_snow'
  },
  {
    id: 'endg_frozen_highway', type: 'parking', title: 'Autostrada Înghețată', client: 'CNAIR',
    description: '50 km de gheață neagră — atenție la fiecare mișcare, dar reward-ul e uriaș!',
    area: { x: 33, z: -10, radius: 9 }, tier: 'tier_endgame',
    snowTypeHint: 'black_ice', targetPct: 0.90, requiredMass: 300, timeLimit: 480,
    baseReward: { coins: 30000, xp: 10000, reputation: 400 }, difficulty: 'expert', unlockLevel: 18,
    preferredVehicle: 'loader_wheel', extremeWeather: 'freezing_rain'
  },
  {
    id: 'endg_arctic_facility', type: 'warehouse', title: 'Facilitate Arctică', client: 'Research Station',
    description: '-40°C, whiteout complet — echipe de cercetare așteaptă intervenția ta.',
    area: { x: -35, z: 25, radius: 8 }, tier: 'tier_endgame',
    snowTypeHint: 'frozen', targetPct: 0.95, requiredMass: 250, timeLimit: 420,
    baseReward: { coins: 28000, xp: 9000, reputation: 350 }, difficulty: 'expert', unlockLevel: 20,
    preferredVehicle: 'tractor_utility', extremeWeather: 'blizzard'
  },
  {
    id: 'endg_city_emergency', type: 'parking', title: 'Oraș în Urgență', client: 'Primăria Municipală',
    description: 'Furtună istorică — 5 zone principale, timp minim!',
    area: { x: 0, z: 30, radius: 10 }, tier: 'tier_endgame',
    snowTypeHint: 'packed', targetPct: 0.85, requiredMass: 400, timeLimit: 600,
    baseReward: { coins: 40000, xp: 15000, reputation: 500 }, difficulty: 'expert', unlockLevel: 22,
    preferredVehicle: 'truck_plow', extremeWeather: 'heavy_snow'
  },
  {
    id: 'endg_mega_warehouse', type: 'warehouse', title: 'Depozit Mega', client: 'Amazon RO',
    description: '20.000m² de acoperit — folosește flota completă!',
    area: { x: 25, z: 25, radius: 12 }, tier: 'tier_endgame',
    snowTypeHint: 'packed', targetPct: 0.98, requiredMass: 500, timeLimit: 720,
    baseReward: { coins: 50000, xp: 20000, reputation: 700 }, difficulty: 'expert', unlockLevel: 25,
    preferredVehicle: 'loader_wheel', extremeWeather: null
  }
];

export const ENDGAME_CONTRACT_BY_ID = Object.fromEntries(ENDGAME_CONTRACTS.map(c => [c.id, c]));
export const ENDGAME_CONTRACT_IDS = ENDGAME_CONTRACTS.map(c => c.id);

// Milestone tracking pentru Prestige
export const ENDGAME_MILESTONES = [
  { id: 'complete_first_extreme', name: 'Prima misiune extremă', target: 1 },
  { id: 'complete_5_extreme',     name: '5 misiuni extreme',      target: 5 },
  { id: 'complete_15_extreme',    name: '15 misiuni extreme',     target: 15 },
  { id: 'complete_50_extreme',    name: '50 misiuni extreme',     target: 50 }
];

// Nivel player la care se dezvăluie endgame în UI (mai mic decât unlockLevel al primului contract)
export const ENDGAME_UNLOCK_PLAYER_LEVEL = 15;
