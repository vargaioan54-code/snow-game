// Etapa 3 — modele + template-uri contracte.
// Zonele sunt cercuri (x, z, radius) plasate pe harta ±40, ferite de ICE_ZONES (34,-36)(37,-36)
// si de zona cabana (0,-8, r 2.2). Coordonatele fluieture cu snow zones existente in environment.js.

export const CONTRACT_TYPES = Object.freeze({
  HOUSE:     { id: 'house',     name: 'Casa',     icon: '🏠' },
  DRIVEWAY:  { id: 'driveway',  name: 'Alee',     icon: '🚗' },
  PARKING:   { id: 'parking',   name: 'Parcare',  icon: '🅿️' },
  SHOP:      { id: 'shop',      name: 'Magazin',  icon: '🏪' },
  WAREHOUSE: { id: 'warehouse', name: 'Depozit',  icon: '🏭' }
});

export const CONTRACT_DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'];

/*
  Fiecare template:
  - id: string stabil
  - type: cheie din CONTRACT_TYPES
  - title, client, description
  - area: { x, z, radius } — pe harta ±40
  - snowTypeHint: informativ (playerul vede tipul dominant)
  - targetPct: 0..1 (procent de curatare pt COMPLETE)
  - requiredMass: hint gameplay (indicativ, nu blocheaza)
  - timeLimit: secunde (0 = fara timer)
  - baseReward: {coins, xp, reputation}
  - difficulty: din CONTRACT_DIFFICULTIES
  - unlockLevel: level minim player pt AVAILABLE
  - requiredTool: (optional) id tool obligatoriu
*/
export const CONTRACT_TEMPLATES = [
  // ===== EASY (Level 1) =====
  {
    id: 'c_house_alba',
    type: 'house',
    tier: 'tier_1',
    title: 'Casa familiei Alba',
    client: 'Familia Alba',
    description: 'Aleea si intrarea principala. Zapada proaspata, usor de curatat.',
    regionId: 'starter', locationId: 'loc_residential', areaId: 'area_house_alba',
    area: { x: -6, z: 12, radius: 4 },
    snowTypeHint: 'fresh',
    targetPct: 0.85,
    requiredMass: 35,
    timeLimit: 180,
    baseReward: { coins: 220, xp: 35, reputation: 3 },
    difficulty: 'easy',
    unlockLevel: 1
  },
  {
    id: 'c_driveway_ionescu',
    tier: 'tier_1',
    type: 'driveway',
    title: 'Alee Ionescu',
    client: 'Ionescu Marian',
    description: 'Alee scurta, urgent inainte de plecare. Timp scurt, reward mic dar rapid.',
    regionId: 'starter', locationId: 'loc_residential', areaId: 'area_driveway_carp',
    area: { x: -22, z: 4, radius: 3 },
    snowTypeHint: 'fresh',
    targetPct: 0.90,
    requiredMass: 20,
    timeLimit: 90,
    baseReward: { coins: 140, xp: 20, reputation: 2 },
    difficulty: 'easy',
    unlockLevel: 1
  },

  // ===== MEDIUM (Level 2-3) =====
  {
    id: 'c_house_popescu',
    tier: 'tier_1',
    type: 'house',
    title: 'Vila Popescu',
    client: 'Familia Popescu',
    description: 'Curte mai mare, cu zapada asezata pe alocuri. Necesita un pusher sau broom.',
    regionId: 'starter', locationId: 'loc_small_parking', areaId: 'area_parking_small',
    area: { x: 16, z: 8, radius: 5 },
    snowTypeHint: 'packed',
    targetPct: 0.85,
    requiredMass: 55,
    timeLimit: 210,
    baseReward: { coins: 380, xp: 55, reputation: 4 },
    difficulty: 'medium',
    unlockLevel: 2
  },
  {
    id: 'c_shop_barbat',
    tier: 'tier_2',
    type: 'shop',
    title: 'Magazin Barbat',
    client: 'SC Barbat SRL',
    description: 'Intrare magazin + trotuar. Trafic mare, trebuie sa fii rapid.',
    regionId: 'town', locationId: 'loc_market', areaId: 'area_market_street',
    area: { x: 22, z: -14, radius: 5 },
    snowTypeHint: 'packed',
    targetPct: 0.88,
    requiredMass: 65,
    timeLimit: 240,
    baseReward: { coins: 480, xp: 65, reputation: 5 },
    difficulty: 'medium',
    unlockLevel: 3
  },

  // ===== HARD (Level 4-6) =====
  {
    id: 'c_parking_lidl',
    tier: 'tier_2',
    type: 'parking',
    title: 'Parcare Lidl',
    client: 'Lidl Romania',
    description: 'Parcare medie, zapada compactata dupa noapte. Recomandat Broom sau superior.',
    regionId: 'town', locationId: 'loc_school_yard', areaId: 'area_school_yard',
    area: { x: -22, z: -18, radius: 6 },
    snowTypeHint: 'packed',
    targetPct: 0.90,
    requiredMass: 90,
    timeLimit: 300,
    baseReward: { coins: 720, xp: 100, reputation: 8 },
    difficulty: 'hard',
    unlockLevel: 4,
    preferredVehicle: 'truck_plow'
  },
  {
    id: 'c_house_expert',
    tier: 'tier_2',
    type: 'house',
    title: 'Vila Munte',
    client: 'Family Alpin',
    description: 'Casa la munte cu zapada adanca si portiuni inghetate.',
    regionId: 'mountain', locationId: 'loc_lodge_drive', areaId: 'area_lodge_drive',
    area: { x: -28, z: 12, radius: 5.5 },
    snowTypeHint: 'deep',
    targetPct: 0.92,
    requiredMass: 110,
    timeLimit: 300,
    baseReward: { coins: 900, xp: 130, reputation: 10 },
    difficulty: 'hard',
    unlockLevel: 5
  },
  {
    id: 'c_shop_metro',
    tier: 'tier_3',
    type: 'shop',
    title: 'Metro Cash & Carry',
    client: 'Metro Group',
    description: 'Intrare marfa + intrare clienti. Mix de zapada asezata cu portiuni compacte.',
    regionId: 'industrial', locationId: 'loc_loading_dock', areaId: 'area_dock',
    area: { x: 24, z: 22, radius: 6 },
    snowTypeHint: 'packed',
    targetPct: 0.90,
    requiredMass: 130,
    timeLimit: 360,
    baseReward: { coins: 1200, xp: 160, reputation: 12 },
    difficulty: 'hard',
    unlockLevel: 6,
    preferredVehicle: 'truck_plow'
  },

  // ===== EXPERT (Level 8+) =====
  {
    id: 'c_warehouse_dhl',
    tier: 'tier_3',
    type: 'warehouse',
    title: 'Depozit DHL',
    client: 'DHL Logistics',
    description: 'Rampa incarcare + acces camioane. Zapada inghetata dura, necesita Heat Ray.',
    regionId: 'industrial', locationId: 'loc_warehouse', areaId: 'area_warehouse_ramp',
    area: { x: -32, z: -4, radius: 7 },
    snowTypeHint: 'frozen',
    targetPct: 0.90,
    requiredMass: 180,
    timeLimit: 360,
    baseReward: { coins: 2000, xp: 260, reputation: 20 },
    difficulty: 'expert',
    unlockLevel: 8,
    requiredTool: 'heat',
    preferredVehicle: 'loader_wheel'
  },
  {
    id: 'c_parking_mall',
    tier: 'tier_4',
    type: 'parking',
    title: 'Parcare Mall',
    client: 'City Mall',
    description: 'Parcare mare mixta. Timp strict pt 5 stele.',
    regionId: 'mountain', locationId: 'loc_ski_parking', areaId: 'area_ski_park',
    area: { x: -18, z: 24, radius: 6.5 },
    snowTypeHint: 'deep',
    targetPct: 0.92,
    requiredMass: 200,
    timeLimit: 300,
    baseReward: { coins: 2400, xp: 320, reputation: 22 },
    difficulty: 'expert',
    unlockLevel: 10,
    preferredVehicle: 'tractor_utility'
  }
];

export const CONTRACT_BY_ID = Object.fromEntries(CONTRACT_TEMPLATES.map(c => [c.id, c]));

// Helper — calculeaza multiplier reward pt un rating 0..5
// Rating 0 = 60%, Rating 5 = 110%.
export function ratingMultiplier(rating) {
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  return 0.6 + r * 0.10;
}
