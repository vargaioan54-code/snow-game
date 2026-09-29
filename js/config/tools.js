// Sursa unica de adevar pentru statistici unelte + compatibility per snow type.
// Consumatori: main.js (loop melt), Economy.js (buy), UnlockSystem, shop UI, environment.js (rate calc).

// compatibility[snowTypeId] in [0.05..1.5]:
//   < 0.15 = unealta ineficienta (aproape zero topire)
//   0.15..0.5 = slaba
//   0.5..1.0 = OK
//   > 1.0 = specialitate

export const TOOL_STATS = [
  {
    id: 'shovel', name: 'Classic Shovel', icon: '🪣',
    desc: '60 mon/min · doar stratul de sus',
    price: 0, mult: 1.0, maxLayer: 0, unlockLevel: 1,
    compatibility: {
      fresh: 1.2, packed: 0.8, deep: 0.5, frozen: 0.25, ice: 0.05, slush: 0.9, black_ice: 0.05, blizzard: 0.55
    }
  },
  {
    id: 'pusher', name: 'Wide Snow Pusher', icon: '🧲',
    desc: '150 mon/min · bandă foarte lată',
    price: 180, mult: 2.5, maxLayer: 1, unlockLevel: 2,
    compatibility: {
      fresh: 1.0, packed: 1.1, deep: 1.3, frozen: 0.4, ice: 0.1, slush: 0.7, black_ice: 0.1, blizzard: 0.9
    }
  },
  {
    id: 'broom', name: 'Snow Broom', icon: '🧹',
    desc: '280 mon/min · mătură toate straturile',
    price: 900, mult: 4.6, maxLayer: 2, unlockLevel: 4,
    compatibility: {
      fresh: 1.3, packed: 0.9, deep: 0.6, frozen: 0.3, ice: 0.1, slush: 1.0, black_ice: 0.1, blizzard: 0.85
    }
  },
  {
    id: 'blower', name: 'Snow Blower', icon: '💨',
    desc: '500 mon/min · suflă la distanță',
    price: 3500, mult: 8.3, maxLayer: 2, unlockLevel: 7,
    compatibility: {
      fresh: 1.1, packed: 1.0, deep: 1.15, frozen: 0.65, ice: 0.2, slush: 0.9, black_ice: 0.15, blizzard: 1.05
    }
  },
  {
    id: 'heat', name: 'Heat Ray', icon: '🔆',
    desc: '900 mon/min · topește instant, sparge și gheața',
    price: 12000, mult: 15.0, maxLayer: 3, unlockLevel: 12,
    compatibility: {
      fresh: 0.6, packed: 0.9, deep: 0.7, frozen: 1.3, ice: 1.5, slush: 1.1, black_ice: 1.5, blizzard: 1.0
    }
  }
];

export const TOOL_BY_ID = Object.fromEntries(TOOL_STATS.map(t => [t.id, t]));

// Helper: calcul rate final pentru un vertex de tip snowTypeId
export function computeMeltRate(tool, snowTypeId, toolUpgrades) {
  const compat = tool.compatibility && tool.compatibility[snowTypeId];
  const c = (typeof compat === 'number') ? compat : 1;
  const t = toolUpgrades && toolUpgrades[tool.id];
  const powerMult = 1 + (t && t.power || 0) * 0.10;
  const speedMult = 1 + (t && t.speed || 0) * 0.10;
  return tool.mult * c * powerMult * speedMult;
}
