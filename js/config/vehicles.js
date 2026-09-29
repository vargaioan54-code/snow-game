// Sursa unica de adevar pentru statistici vehicule.
// Consumatori: VehicleShopPanel, VehicleSystem, DebugTools.

export const VEHICLE_CATEGORIES = Object.freeze({
  ATV: 'atv',
  TRUCK: 'truck',
  TRACTOR: 'tractor',
  LOADER: 'loader'
});

export const VEHICLE_STATS = [
  {
    id: 'atv_basic', name: 'Snow ATV', icon: '🛺', category: 'atv',
    description: 'Rapid și agil pentru driveways și zone mici',
    price: 5000, unlockLevel: 2, requiredContracts: 1,
    // Movement
    maxSpeed: 8, acceleration: 6, brakeForce: 10, turnRate: 2.2,
    // Snow clearing
    clearWidth: 1.8, clearPower: 1.4, clearRange: 0.9,
    // Compatibility
    compatibility: { fresh: 1.3, packed: 0.8, deep: 0.5, frozen: 0.3, ice: 0.05, slush: 1.0, black_ice: 0.05, blizzard: 0.7 },
    // Capacity + fuel + durability
    capacity: 500, fuelCapacity: 100, fuelConsumption: 0.4, durability: 100, durabilityWear: 0.02,
    // Compatible attachments
    compatibleAttachments: ['plow_small'],
    // Visual/audio
    color: 0xd84040, engineTone: 200
  },
  {
    id: 'truck_plow', name: 'Snow Plow Truck', icon: '🚚', category: 'truck',
    description: 'Pentru străzi și parcări medii',
    price: 25000, unlockLevel: 5, requiredContracts: 5,
    maxSpeed: 10, acceleration: 3.5, brakeForce: 8, turnRate: 1.4,
    clearWidth: 3.5, clearPower: 2.5, clearRange: 1.3,
    compatibility: { fresh: 1.1, packed: 1.3, deep: 1.0, frozen: 0.6, ice: 0.2, slush: 1.0, black_ice: 0.15, blizzard: 1.0 },
    capacity: 2500, fuelCapacity: 200, fuelConsumption: 0.9, durability: 100, durabilityWear: 0.03,
    compatibleAttachments: ['plow_small', 'plow_medium'],
    color: 0xf4a020, engineTone: 130
  },
  {
    id: 'tractor_utility', name: 'Utility Tractor', icon: '🚜', category: 'tractor',
    description: 'Puternic pentru snow adânc și frozen',
    price: 60000, unlockLevel: 8, requiredContracts: 12,
    maxSpeed: 6, acceleration: 2.5, brakeForce: 7, turnRate: 1.7,
    clearWidth: 3.0, clearPower: 3.5, clearRange: 1.2,
    compatibility: { fresh: 1.0, packed: 1.4, deep: 1.6, frozen: 1.3, ice: 0.5, slush: 0.9, black_ice: 0.3, blizzard: 1.4 },
    capacity: 4000, fuelCapacity: 300, fuelConsumption: 1.4, durability: 120, durabilityWear: 0.025,
    compatibleAttachments: ['plow_medium', 'plow_large', 'bucket_small'],
    color: 0x30a040, engineTone: 100
  },
  {
    id: 'loader_wheel', name: 'Wheel Loader', icon: '🏗️', category: 'loader',
    description: 'Utilaj greu pentru snow piles și zone industriale',
    price: 150000, unlockLevel: 12, requiredContracts: 25,
    maxSpeed: 5, acceleration: 2, brakeForce: 6, turnRate: 1.3,
    clearWidth: 4.5, clearPower: 5.0, clearRange: 1.8,
    compatibility: { fresh: 0.9, packed: 1.5, deep: 2.0, frozen: 1.6, ice: 0.8, slush: 1.0, black_ice: 0.5, blizzard: 1.6 },
    capacity: 8000, fuelCapacity: 500, fuelConsumption: 2.2, durability: 150, durabilityWear: 0.02,
    compatibleAttachments: ['bucket_small', 'bucket_large', 'plow_large'],
    color: 0xeed030, engineTone: 80
  }
];

export const VEHICLE_BY_ID = Object.fromEntries(VEHICLE_STATS.map(v => [v.id, v]));
