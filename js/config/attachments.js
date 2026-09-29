// Attachment stats — mount points pe vehicul (plow / bucket / etc.)

export const ATTACHMENT_STATS = [
  { id: 'plow_small',   name: 'Plow Small',   type: 'plow',   width: 1.8, powerMult: 1.0, price: 0,     unlockLevel: 1, capacityBonus: 0 },
  { id: 'plow_medium',  name: 'Plow Medium',  type: 'plow',   width: 3.0, powerMult: 1.2, price: 3000,  unlockLevel: 5, capacityBonus: 0 },
  { id: 'plow_large',   name: 'Plow Large',   type: 'plow',   width: 4.2, powerMult: 1.5, price: 12000, unlockLevel: 8, capacityBonus: 0 },
  { id: 'bucket_small', name: 'Bucket Small', type: 'bucket', width: 2.5, powerMult: 1.3, price: 8000,  unlockLevel: 8, capacityBonus: 500 },
  { id: 'bucket_large', name: 'Bucket Large', type: 'bucket', width: 3.8, powerMult: 1.7, price: 30000, unlockLevel: 12, capacityBonus: 2000 }
];

export const ATTACHMENT_BY_ID = Object.fromEntries(ATTACHMENT_STATS.map(a => [a.id, a]));
