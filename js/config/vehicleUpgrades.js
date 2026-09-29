// Upgrade stats pentru vehicule.
// Aplicate ca multiplicator la stats-ul de baza in getEffectiveStats.

export const VEHICLE_UPGRADE_STATS = ['power', 'speed', 'capacity', 'fuel_efficiency', 'durability'];
export const VEHICLE_UPGRADE_MAX_LEVEL = 5;

export function vehicleUpgradeCost(vehiclePrice, currentLevel) {
  return Math.round(vehiclePrice * 0.25 * Math.pow(1.6, currentLevel));
}

export const VEHICLE_UPGRADE_EFFECT = 0.12; // +12% per nivel

export function upgradeMultiplier(level) {
  const lv = Math.max(0, Math.min(VEHICLE_UPGRADE_MAX_LEVEL, level | 0));
  return 1 + lv * VEHICLE_UPGRADE_EFFECT;
}
