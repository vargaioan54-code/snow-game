// GARAGE_STATS — configuratie unica pentru garajul principal.
// Consumatori: GarageStore, GarageSystem, environment.addGarage, GaragePanel.

export const GARAGE_STATS = Object.freeze({
  id: 'main_garage',
  name: 'Garajul Principal',
  location: 'loc_village_center',
  position: Object.freeze({ x: 8, z: -12 }),  // langa cabin (cabin la 0,-8)
  rotation: 0.1,
  triggerRadius: 5,
  capacity: 4,
  unlockLevel: 1,
  levels: [
    { level: 1, name: 'Garaj de bază',   capacity: 2, upgradeCost: 0 },
    { level: 2, name: 'Garaj extins',    capacity: 3, upgradeCost: 10000 },
    { level: 3, name: 'Garaj mare',      capacity: 4, upgradeCost: 50000 },
    { level: 4, name: 'Garaj premium',   capacity: 6, upgradeCost: 200000 }
  ]
});

export const GARAGE_MAX_LEVEL = GARAGE_STATS.levels.length;

export function garageLevelCapacity(level) {
  const idx = Math.max(0, Math.min(GARAGE_MAX_LEVEL - 1, (level | 0) - 1));
  return GARAGE_STATS.levels[idx].capacity;
}

export function garageUpgradeCostAt(currentLevel) {
  if (currentLevel >= GARAGE_MAX_LEVEL) return null;
  return GARAGE_STATS.levels[currentLevel].upgradeCost;
}
