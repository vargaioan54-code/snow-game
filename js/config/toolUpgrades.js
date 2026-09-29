// Configurare upgrade-uri pentru unelte.
// power   -> creste rata topirii (10% per nivel)
// speed   -> creste rata topirii (10% per nivel, cumulativ cu power)
// capacity-> creste reward per vertex (10% per nivel)

export const UPGRADE_STATS = ['power', 'speed', 'capacity'];
export const UPGRADE_MAX_LEVEL = 5;
export const UPGRADE_EFFECT = 0.10;  // 10% per nivel

// Cost creste exponential: baza = 40% din pretul uneltei.
// Shovel are pret 0 => cost minim absolut pentru upgrade shovel = 50 * 1.7^level.
export function upgradeCost(toolPrice, currentLevel) {
  const base = Math.max(50, toolPrice * 0.4);
  return Math.round(base * Math.pow(1.7, currentLevel));
}

// Helper: multiplierul efectiv la un stat dat un obiect toolUpgrades[toolId]
export function statMultiplier(toolUpgrades, toolId, statName) {
  const t = toolUpgrades && toolUpgrades[toolId];
  if (!t) return 1;
  const lvl = t[statName] || 0;
  return 1 + lvl * UPGRADE_EFFECT;
}
