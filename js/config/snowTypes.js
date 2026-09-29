// Sursa unica de adevar pentru tipurile de zapada.
// Consumatori: environment.js (snow field), Economy (reward mult),
// AudioSystem/toolFx (particle color), HudBinding (badge tip curent).

export const SNOW_TYPES = {
  FRESH:     { id: 'fresh',     name: 'Fresh Snow',     hardness: 0.2,  resistance: 0.3,  rewardMult: 1.0, color: [0.98, 0.99, 1.00], particleColor: 0xffffff },
  PACKED:    { id: 'packed',    name: 'Packed Snow',    hardness: 0.5,  resistance: 0.6,  rewardMult: 1.4, color: [0.86, 0.89, 0.94], particleColor: 0xe8ecf5 },
  DEEP:      { id: 'deep',      name: 'Deep Snow',      hardness: 0.3,  resistance: 0.4,  rewardMult: 1.8, color: [0.92, 0.94, 0.99], particleColor: 0xffffff },
  FROZEN:    { id: 'frozen',    name: 'Frozen Snow',    hardness: 0.8,  resistance: 0.85, rewardMult: 2.2, color: [0.75, 0.82, 0.90], particleColor: 0xc8dcef },
  ICE:       { id: 'ice',       name: 'Ice',            hardness: 1.0,  resistance: 0.95, rewardMult: 3.0, color: [0.60, 0.72, 0.84], particleColor: 0xa0c8e8 },
  SLUSH:     { id: 'slush',     name: 'Slush',          hardness: 0.15, resistance: 0.25, rewardMult: 0.7, color: [0.70, 0.75, 0.80], particleColor: 0xa8b0b8 },
  BLACK_ICE: { id: 'black_ice', name: 'Black Ice',      hardness: 1.2,  resistance: 1.0,  rewardMult: 4.0, color: [0.20, 0.28, 0.36], particleColor: 0x606870 },
  BLIZZARD:  { id: 'blizzard',  name: 'Blizzard Snow',  hardness: 0.6,  resistance: 0.7,  rewardMult: 2.0, color: [0.88, 0.92, 1.00], particleColor: 0xffffff }
};

export const SNOW_TYPE_LIST = Object.values(SNOW_TYPES);
export const SNOW_TYPE_BY_ID = Object.fromEntries(SNOW_TYPE_LIST.map(t => [t.id, t]));
// Index intreg -> id (folosit ca payload in typeMap Uint8Array)
export const SNOW_TYPE_INDEX = Object.fromEntries(SNOW_TYPE_LIST.map((t, i) => [t.id, i]));
