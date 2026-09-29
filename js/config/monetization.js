// Etapa 12 — Monetization config.
// Definitii statice: tipuri produs, categorii, tipuri reward, tipuri boost, catalog.
// NU contine logica de gameplay.

export const PRODUCT_TYPES = Object.freeze({
  CONSUMABLE: 'consumable',
  NON_CONSUMABLE: 'non_consumable',
  SUBSCRIPTION: 'subscription'  // BLOCKED — necesita backend
});

export const PRODUCT_CATEGORIES = Object.freeze({
  PREMIUM_CURRENCY: 'premium_currency',
  STARTER_PACK: 'starter_pack',
  BUNDLE: 'bundle',
  COSMETIC: 'cosmetic',
  BOOST: 'boost',
  SEASON_PASS: 'season_pass',
  FEATURED: 'featured'
});

export const REWARD_TYPES = Object.freeze({
  COINS: 'coins',
  DIAMONDS: 'diamonds',
  REPUTATION: 'reputation',
  XP: 'xp',
  TOOL: 'tool',
  VEHICLE: 'vehicle',
  ATTACHMENT: 'attachment',
  BOOST: 'boost',
  COSMETIC: 'cosmetic',
  ENTITLEMENT: 'entitlement'
});

export const BOOST_TYPES = Object.freeze({
  XP_BOOST: 'xp_boost',
  COIN_BOOST: 'coin_boost',
  SNOW_CLEAR_BOOST: 'snow_clear_boost',
  FUEL_EFFICIENCY: 'fuel_efficiency',
  CONTRACT_REWARD: 'contract_reward'
});

// Catalog produse
export const PRODUCTS = [
  // === Premium currency (consumable) ===
  { id: 'diamonds_100',  category:'premium_currency', type:'consumable', name:'100 Diamante',  description:'Pachet mic de diamante', price:0.99,  priceDisplay:'$0.99',  icon:'💎', rewards:[{type:'diamonds', amount:100}] },
  { id: 'diamonds_500',  category:'premium_currency', type:'consumable', name:'500 Diamante',  description:'Popular! +10% bonus (550)', price:4.99,  priceDisplay:'$4.99',  icon:'💎', rewards:[{type:'diamonds', amount:550}], badge:'POPULAR' },
  { id: 'diamonds_1200', category:'premium_currency', type:'consumable', name:'1.200 Diamante', description:'Cel mai bun raport! +20% bonus (1440)', price:9.99, priceDisplay:'$9.99', icon:'💎', rewards:[{type:'diamonds', amount:1440}], badge:'BEST VALUE' },
  { id: 'diamonds_3000', category:'premium_currency', type:'consumable', name:'3.000 Diamante', description:'Mega pack! +30% bonus (3900)', price:24.99, priceDisplay:'$24.99', icon:'💎', rewards:[{type:'diamonds', amount:3900}] },

  // === Starter Pack (non_consumable — o singura data) ===
  { id: 'starter_pack_01', category:'starter_pack', type:'non_consumable', name:'Pachet Starter', description:'Pornire rapidă: coins + diamante + unealta premium + XP boost 24h', price:2.99, priceDisplay:'$2.99', purchaseLimit:1, icon:'🎁',
    rewards:[
      { type:'coins', amount:5000 },
      { type:'diamonds', amount:200 },
      { type:'tool', id:'pusher' },
      { type:'boost', boostType:'xp_boost', multiplier:1.5, durationHours:24 }
    ], badge:'NEW PLAYER'
  },

  // === Bundles ===
  { id: 'bundle_snow_worker', category:'bundle', type:'non_consumable', name:'Snow Worker Bundle', description:'Broom + Blower + 2.000 monede', price:4.99, priceDisplay:'$4.99', purchaseLimit:1, icon:'🧹',
    rewards:[
      { type:'tool', id:'broom' },
      { type:'tool', id:'blower' },
      { type:'coins', amount:2000 }
    ]
  },
  { id: 'bundle_vehicle_starter', category:'bundle', type:'non_consumable', name:'Vehicle Starter Bundle', description:'ATV + Snow Plow attachment', price:9.99, priceDisplay:'$9.99', purchaseLimit:1, icon:'🛻',
    rewards:[
      { type:'vehicle', id:'atv_basic' },
      { type:'attachment', id:'plow_small' }
    ]
  },
  { id: 'bundle_winter_mega', category:'bundle', type:'non_consumable', name:'Winter Mega Bundle', description:'Toate uneltele + Snow Plow Truck + 1.000 diamante', price:29.99, priceDisplay:'$29.99', purchaseLimit:1, icon:'❄️',
    rewards:[
      { type:'tool', id:'shovel' }, { type:'tool', id:'pusher' }, { type:'tool', id:'broom' }, { type:'tool', id:'blower' }, { type:'tool', id:'heat' },
      { type:'vehicle', id:'truck_plow' },
      { type:'diamonds', amount:1000 }
    ], badge:'MEGA'
  },

  // === Cosmetics (foundation — nu 3D swap) ===
  { id: 'cosmetic_red_jacket', category:'cosmetic', type:'non_consumable', name:'Jacheta Roșie', description:'Character skin — jachetă roșie festivă', price:1.99, priceDisplay:'$1.99', purchaseLimit:1, icon:'🧥',
    rewards:[{ type:'cosmetic', id:'char_jacket_red' }]
  },
  { id: 'cosmetic_gold_truck', category:'cosmetic', type:'non_consumable', name:'Skin Truck Auriu', description:'Vehicle skin — truck auriu', price:2.99, priceDisplay:'$2.99', purchaseLimit:1, icon:'🚚',
    rewards:[{ type:'cosmetic', id:'vehicle_truck_gold' }]
  },

  // === Boosts (consumable — se pot cumpăra repetat) ===
  { id: 'boost_xp_24h', category:'boost', type:'consumable', name:'XP Boost 24h', description:'+50% XP timp de 24 ore', price:1.99, priceDisplay:'$1.99', icon:'⭐',
    rewards:[{ type:'boost', boostType:'xp_boost', multiplier:1.5, durationHours:24 }]
  },
  { id: 'boost_coins_24h', category:'boost', type:'consumable', name:'Coin Boost 24h', description:'+50% monede timp de 24 ore', price:1.99, priceDisplay:'$1.99', icon:'💰',
    rewards:[{ type:'boost', boostType:'coin_boost', multiplier:1.5, durationHours:24 }]
  },
  { id: 'boost_mega_pack', category:'boost', type:'consumable', name:'Mega Boost Pack', description:'XP +100%, Coins +100%, Snow +50% pentru 12h', price:4.99, priceDisplay:'$4.99', icon:'⚡',
    rewards:[
      { type:'boost', boostType:'xp_boost', multiplier:2.0, durationHours:12 },
      { type:'boost', boostType:'coin_boost', multiplier:2.0, durationHours:12 },
      { type:'boost', boostType:'snow_clear_boost', multiplier:1.5, durationHours:12 }
    ]
  },

  // === Season Pass ===
  { id: 'season_pass_winter_2026', category:'season_pass', type:'non_consumable', name:'Season Pass — Iarna 2026', description:'Deblochează Premium Track cu 20+ rewards exclusive + 500 diamante', price:9.99, priceDisplay:'$9.99', purchaseLimit:1, seasonId:'season_winter_2026', icon:'🎫',
    rewards:[{ type:'entitlement', id:'season_pass_winter_2026' }, { type:'diamonds', amount:500 }],
    badge:'SEASON'
  }
];

export const PRODUCT_BY_ID = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));

export function getProductsByCategory(cat) {
  return PRODUCTS.filter(p => p.category === cat);
}

// Featured = curated selection pentru tab-ul Featured
export const FEATURED_PRODUCT_IDS = ['starter_pack_01', 'season_pass_winter_2026', 'bundle_winter_mega'];
