// Employee configuration (static data). Consumed by EmployeeStore + System + UI.

export const EMPLOYEE_ROLES = {
  SNOW_OPERATOR: {
    id: 'snow_operator', name: 'Operator Snow Removal', icon: '👷',
    description: 'Specializat in snow removal general (shovel, blower)',
    baseSpeed: 1.0, baseEfficiency: 1.05, baseReliability: 0.95,
    hiringCost: 500, baseSalary: 100, maxLevel: 10,
    allowedVehicleCategories: ['atv', 'truck'],
    allowedAttachmentTypes: ['plow'],
    xpMultiplier: 1.0,
    specialization: 'Fresh Snow, Light Packed'
  },
  DRIVER: {
    id: 'driver', name: 'Sofer', icon: '🚗',
    description: 'Specializat in conducere truck si tractor',
    baseSpeed: 1.15, baseEfficiency: 1.0, baseReliability: 0.90,
    hiringCost: 800, baseSalary: 150, maxLevel: 10,
    allowedVehicleCategories: ['truck', 'tractor'],
    allowedAttachmentTypes: ['plow', 'bucket'],
    xpMultiplier: 1.1,
    specialization: 'Deep Snow, Packed Areas'
  },
  HEAVY_OPERATOR: {
    id: 'heavy_operator', name: 'Operator Utilaje Grele', icon: '🏗️',
    description: 'Specializat in wheel loader si utilaje grele',
    baseSpeed: 0.9, baseEfficiency: 1.25, baseReliability: 0.85,
    hiringCost: 2000, baseSalary: 400, maxLevel: 10,
    allowedVehicleCategories: ['loader', 'tractor'],
    allowedAttachmentTypes: ['bucket', 'plow'],
    xpMultiplier: 0.9,
    specialization: 'Ice, Frozen, Industrial'
  },
  GENERAL_WORKER: {
    id: 'general_worker', name: 'Muncitor General', icon: '👤',
    description: 'Poate lucra cu echipamente de baza',
    baseSpeed: 0.85, baseEfficiency: 0.9, baseReliability: 0.98,
    hiringCost: 250, baseSalary: 50, maxLevel: 10,
    allowedVehicleCategories: ['atv'],
    allowedAttachmentTypes: ['plow'],
    xpMultiplier: 1.0,
    specialization: 'Fresh Snow, Slush'
  }
};

export const EMPLOYEE_ROLE_LIST = Object.values(EMPLOYEE_ROLES);
export const EMPLOYEE_ROLE_BY_ID = Object.fromEntries(EMPLOYEE_ROLE_LIST.map(r => [r.id, r]));

export const EMPLOYEE_STATUS = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  ASSIGNED:  'ASSIGNED',
  WORKING:   'WORKING',
  RESTING:   'RESTING'
});

// XP thresholds curve (level 1..maxLevel)
export function employeeXpForLevel(level) {
  if (level < 1) return 0;
  return Math.round(100 * Math.pow(1.35, level - 1));
}

// Stats scaled per level. +8% per level for speed/efficiency, +1% per level for reliability (cap 1.0),
// +15% per level for salary.
export function employeeStatsAtLevel(role, level) {
  const l = Math.max(1, level | 0);
  const mult = 1 + (l - 1) * 0.08;
  return {
    speed: role.baseSpeed * mult,
    efficiency: role.baseEfficiency * mult,
    reliability: Math.min(1.0, role.baseReliability + (l - 1) * 0.01),
    salary: Math.round(role.baseSalary * (1 + (l - 1) * 0.15))
  };
}

const FIRST_NAMES = [
  'Alex','Andrei','Bogdan','Cristian','Dan','Emil','Florin','George','Horia','Ionut',
  'Marius','Radu','Sorin','Vlad','Ana','Elena','Mihaela','Ioana'
];
const LAST_NAMES = [
  'Popescu','Ionescu','Popa','Radu','Dumitru','Stan','Stoica','Nistor','Constantin','Marin'
];
export function randomEmployeeName() {
  return FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)] + ' ' +
         LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
}

// Alege un rol random weighted (mai multe general_worker/snow_operator, mai putini heavy)
export function pickRandomRoleId() {
  const weights = [
    ['general_worker', 40],
    ['snow_operator',  35],
    ['driver',         18],
    ['heavy_operator',  7]
  ];
  const total = weights.reduce((s, w) => s + w[1], 0);
  let r = Math.random() * total;
  for (const [id, w] of weights) { r -= w; if (r <= 0) return id; }
  return 'general_worker';
}

// UUID scurt
export function makeEmployeeId(n) {
  return 'emp_' + String(n).padStart(4, '0') + '_' + Math.random().toString(36).slice(2, 6);
}
export function makeCandidateId() {
  return 'cand_' + Math.random().toString(36).slice(2, 10);
}
