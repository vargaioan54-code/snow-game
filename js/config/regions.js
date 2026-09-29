// Etapa 4 — Regions. World e o singura scena Three.js; regiunile sunt zone
// logice pe aceeasi harta (harta actuala = "Starter Village").

export const REGIONS = [
  {
    id: 'starter',
    name: 'Starter Village',
    description: 'Zona ta de plecare — case mici si alei linistite',
    difficulty: 'easy',
    unlockLevel: 1,
    requiredCompletedContracts: 0,
    theme: 'village',
    icon: '🏘️',
    locations: ['loc_residential', 'loc_village_center', 'loc_small_parking']
  },
  {
    id: 'town',
    name: 'Little Town',
    description: 'Strazi comerciale si parcari',
    difficulty: 'medium',
    unlockLevel: 3,
    requiredCompletedContracts: 3,
    theme: 'town',
    icon: '🏙️',
    locations: ['loc_market', 'loc_school_yard']
  },
  {
    id: 'industrial',
    name: 'Industrial District',
    description: 'Depozite si zone logistice',
    difficulty: 'hard',
    unlockLevel: 6,
    requiredCompletedContracts: 10,
    theme: 'industrial',
    icon: '🏭',
    locations: ['loc_warehouse', 'loc_loading_dock']
  },
  {
    id: 'mountain',
    name: 'Mountain Lodge',
    description: 'Zapada densa si gheata pe alei abrupte',
    difficulty: 'expert',
    unlockLevel: 10,
    requiredCompletedContracts: 20,
    theme: 'mountain',
    icon: '⛰️',
    locations: ['loc_lodge_drive', 'loc_ski_parking']
  }
];

export const REGION_BY_ID = Object.fromEntries(REGIONS.map(r => [r.id, r]));
