// Etapa 4 — Locations. Fiecare Location = spawn point + camera focus + list de zone (areas)
// + POI-uri (contract zones, cabin, shop, etc.). Coordonate pe harta ±40.

export const LOCATIONS = [
  // ===== STARTER REGION =====
  {
    id: 'loc_residential',
    regionId: 'starter',
    name: 'Residential Area',
    description: 'Zona de case si driveways',
    difficulty: 'easy',
    unlockLevel: 1,
    requiredCompletedContracts: 0,
    spawn: { x: -12, z: 8 },
    cameraFocus: { x: -12, z: 12 },
    areas: ['area_house_alba', 'area_house_bra', 'area_driveway_carp'],
    poi: [
      { type: 'contract_zone', x: -6, z: 12, label: 'Casa Alba' },
      { type: 'contract_zone', x: -22, z: 4, label: 'Alee Ionescu' }
    ]
  },
  {
    id: 'loc_village_center',
    regionId: 'starter',
    name: 'Village Center',
    description: 'Centrul satului cu magazin si piateta',
    difficulty: 'easy',
    unlockLevel: 1,
    requiredCompletedContracts: 0,
    spawn: { x: 0, z: -4 },
    cameraFocus: { x: 0, z: 0 },
    areas: ['area_shop_entrance', 'area_market_square'],
    poi: [
      { type: 'shop_tool',    x: 34, z: -36, label: 'Shop Unelte' },
      { type: 'shop_upgrade', x: 37, z: -36, label: 'Upgrade Sac' },
      { type: 'cabin',        x: 0,  z: -8,  label: 'Cabana' },
      { type: 'garage',       x: 8,  z: -12, label: 'Garaj' }
    ]
  },
  {
    id: 'loc_small_parking',
    regionId: 'starter',
    name: 'Small Parking',
    description: 'Parcare mica langa magazin',
    difficulty: 'medium',
    unlockLevel: 2,
    requiredCompletedContracts: 1,
    spawn: { x: 16, z: 4 },
    cameraFocus: { x: 16, z: 8 },
    areas: ['area_parking_small'],
    poi: [
      { type: 'contract_zone', x: 16, z: 8, label: 'Vila Popescu' }
    ]
  },

  // ===== TOWN REGION (LOCKED default) =====
  {
    id: 'loc_market',
    regionId: 'town',
    name: 'Market Street',
    description: 'Zona de piata cu magazine',
    difficulty: 'medium',
    unlockLevel: 3,
    requiredCompletedContracts: 3,
    spawn: { x: 22, z: -12 },
    cameraFocus: { x: 22, z: -14 },
    areas: ['area_market_street'],
    poi: [
      { type: 'contract_zone', x: 22, z: -14, label: 'Magazin Barbat' }
    ]
  },
  {
    id: 'loc_school_yard',
    regionId: 'town',
    name: 'School Yard',
    description: 'Curtea scolii',
    difficulty: 'medium',
    unlockLevel: 4,
    requiredCompletedContracts: 4,
    spawn: { x: -22, z: -16 },
    cameraFocus: { x: -22, z: -18 },
    areas: ['area_school_yard'],
    poi: [
      { type: 'contract_zone', x: -22, z: -18, label: 'Parcare Lidl' }
    ]
  },

  // ===== INDUSTRIAL (LOCKED) =====
  {
    id: 'loc_warehouse',
    regionId: 'industrial',
    name: 'Warehouse Ramp',
    description: 'Rampa depozit',
    difficulty: 'hard',
    unlockLevel: 6,
    requiredCompletedContracts: 10,
    spawn: { x: -30, z: -2 },
    cameraFocus: { x: -32, z: -4 },
    areas: ['area_warehouse_ramp'],
    poi: [
      { type: 'contract_zone', x: -32, z: -4, label: 'Depozit DHL' }
    ]
  },
  {
    id: 'loc_loading_dock',
    regionId: 'industrial',
    name: 'Loading Dock',
    description: 'Zona incarcare marfa',
    difficulty: 'hard',
    unlockLevel: 7,
    requiredCompletedContracts: 12,
    spawn: { x: 24, z: 20 },
    cameraFocus: { x: 24, z: 22 },
    areas: ['area_dock'],
    poi: [
      { type: 'contract_zone', x: 24, z: 22, label: 'Metro Cash & Carry' }
    ]
  },

  // ===== MOUNTAIN (LOCKED) =====
  {
    id: 'loc_lodge_drive',
    regionId: 'mountain',
    name: 'Lodge Driveway',
    description: 'Alee spre cabana la munte',
    difficulty: 'expert',
    unlockLevel: 10,
    requiredCompletedContracts: 20,
    spawn: { x: -26, z: 10 },
    cameraFocus: { x: -28, z: 12 },
    areas: ['area_lodge_drive'],
    poi: [
      { type: 'contract_zone', x: -28, z: 12, label: 'Vila Munte' }
    ]
  },
  {
    id: 'loc_ski_parking',
    regionId: 'mountain',
    name: 'Ski Parking',
    description: 'Parcare pentru schiori',
    difficulty: 'expert',
    unlockLevel: 11,
    requiredCompletedContracts: 22,
    spawn: { x: -16, z: 22 },
    cameraFocus: { x: -18, z: 24 },
    areas: ['area_ski_park'],
    poi: [
      { type: 'contract_zone', x: -18, z: 24, label: 'Parcare Mall' }
    ]
  }
];

export const LOCATION_BY_ID = Object.fromEntries(LOCATIONS.map(l => [l.id, l]));

// Helper — locatii per regiune
export function getLocationsByRegion(regionId) {
  return LOCATIONS.filter(l => l.regionId === regionId);
}
