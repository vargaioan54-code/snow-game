// Etapa 12 — EntitlementStore
// Persist snow-game:entitlements-v1
// Track: non-consumable purchases (owned[]), cosmetics, purchases counter, active boosts, season passes.

import { PRODUCT_BY_ID } from '../config/monetization.js';

const DEFAULTS = {
  owned: [],               // productIds non-consumable owned
  ownedCosmetics: [],      // cosmetic IDs (rewards[].id de tip cosmetic)
  purchases: {},           // { [productId]: { count, firstPurchaseAt, lastPurchaseAt, totalSpent } }
  activeBoosts: [],        // { id, boostType, multiplier, startedAt, expiresAt }
  seasonPasses: [],        // { seasonId, purchasedAt, productId }
  totalSpentUSD: 0,
  totalTransactions: 0
};

function shallowArrayEq(a, b) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export function createEntitlementStore() {
  const state = {
    owned: [],
    ownedCosmetics: [],
    purchases: {},
    activeBoosts: [],
    seasonPasses: [],
    totalSpentUSD: 0,
    totalTransactions: 0
  };
  const anyListeners = new Set();
  const keyListeners = new Map();

  function notify(changedKeys) {
    for (const l of anyListeners) l(state, changedKeys);
    for (const k of changedKeys) {
      const s = keyListeners.get(k);
      if (s) for (const l of s) l(state[k], state);
    }
  }

  function set(patch) {
    const changed = [];
    for (const k in patch) {
      const cur = state[k];
      const nxt = patch[k];
      if (Array.isArray(cur) && Array.isArray(nxt)) {
        if (!shallowArrayEq(cur, nxt)) { state[k] = nxt; changed.push(k); }
      } else if (cur !== nxt) {
        state[k] = nxt;
        changed.push(k);
      }
    }
    if (changed.length) notify(changed);
  }

  function sanitize(data) {
    const clean = {
      owned: [],
      ownedCosmetics: [],
      purchases: {},
      activeBoosts: [],
      seasonPasses: [],
      totalSpentUSD: 0,
      totalTransactions: 0
    };
    if (!data || typeof data !== 'object') return clean;

    // owned — doar productIds valide non-consumable
    if (Array.isArray(data.owned)) {
      const seen = new Set();
      for (const id of data.owned) {
        if (typeof id !== 'string') continue;
        const p = PRODUCT_BY_ID[id];
        if (!p) continue;
        if (p.type !== 'non_consumable') continue;
        if (seen.has(id)) continue;
        seen.add(id);
        clean.owned.push(id);
      }
    }

    // Cosmetics — array de string-uri unice
    if (Array.isArray(data.ownedCosmetics)) {
      const seen = new Set();
      for (const id of data.ownedCosmetics) {
        if (typeof id === 'string' && !seen.has(id)) {
          seen.add(id);
          clean.ownedCosmetics.push(id);
        }
      }
    }

    // Purchases counter
    if (data.purchases && typeof data.purchases === 'object') {
      for (const pid in data.purchases) {
        if (!PRODUCT_BY_ID[pid]) continue;
        const src = data.purchases[pid] || {};
        clean.purchases[pid] = {
          count: Math.max(0, Math.floor(Number(src.count) || 0)),
          firstPurchaseAt: Number(src.firstPurchaseAt) || null,
          lastPurchaseAt: Number(src.lastPurchaseAt) || null,
          totalSpent: Math.max(0, Number(src.totalSpent) || 0)
        };
      }
    }

    // Active boosts — drop expired
    const now = Date.now();
    if (Array.isArray(data.activeBoosts)) {
      for (const b of data.activeBoosts) {
        if (!b || typeof b !== 'object') continue;
        if (typeof b.boostType !== 'string') continue;
        const expiresAt = Number(b.expiresAt) || 0;
        if (expiresAt <= now) continue;
        clean.activeBoosts.push({
          id: typeof b.id === 'string' ? b.id : ('boost_' + Math.random().toString(36).slice(2, 9)),
          boostType: b.boostType,
          multiplier: Math.max(1, Number(b.multiplier) || 1),
          startedAt: Number(b.startedAt) || now,
          expiresAt
        });
      }
    }

    // Season passes
    if (Array.isArray(data.seasonPasses)) {
      const seen = new Set();
      for (const sp of data.seasonPasses) {
        if (!sp || typeof sp !== 'object') continue;
        if (typeof sp.seasonId !== 'string') continue;
        if (seen.has(sp.seasonId)) continue;
        seen.add(sp.seasonId);
        clean.seasonPasses.push({
          seasonId: sp.seasonId,
          purchasedAt: Number(sp.purchasedAt) || Date.now(),
          productId: typeof sp.productId === 'string' ? sp.productId : null
        });
      }
    }

    clean.totalSpentUSD = Math.max(0, Number(data.totalSpentUSD) || 0);
    clean.totalTransactions = Math.max(0, Math.floor(Number(data.totalTransactions) || 0));

    return clean;
  }

  return {
    get state() { return state; },

    set,

    // Helpers
    hasEntitlement(productId) {
      return state.owned.includes(productId);
    },
    canPurchase(productId) {
      const p = PRODUCT_BY_ID[productId];
      if (!p) return false;
      if (p.type === 'non_consumable') {
        if (state.owned.includes(productId)) return false;
        if (p.purchaseLimit) {
          const rec = state.purchases[productId];
          if (rec && rec.count >= p.purchaseLimit) return false;
        }
      }
      // Consumables — mereu ok
      return true;
    },
    hasSeasonPass(seasonId) {
      return state.seasonPasses.some(sp => sp.seasonId === seasonId);
    },
    hasCosmetic(cosmeticId) {
      return state.ownedCosmetics.includes(cosmeticId);
    },
    getActiveBoosts() {
      const now = Date.now();
      return state.activeBoosts.filter(b => b.expiresAt > now);
    },
    getBoostMultiplier(boostType) {
      const now = Date.now();
      let max = 1;
      for (const b of state.activeBoosts) {
        if (b.boostType !== boostType) continue;
        if (b.expiresAt <= now) continue;
        if (b.multiplier > max) max = b.multiplier;
      }
      return max;
    },

    // Add helpers (folosite de PurchaseService)
    addOwned(productId) {
      if (state.owned.includes(productId)) return false;
      state.owned = [...state.owned, productId];
      notify(['owned']);
      return true;
    },
    addCosmetic(cosmeticId) {
      if (state.ownedCosmetics.includes(cosmeticId)) return false;
      state.ownedCosmetics = [...state.ownedCosmetics, cosmeticId];
      notify(['ownedCosmetics']);
      return true;
    },
    addSeasonPass(seasonId, productId) {
      if (state.seasonPasses.some(sp => sp.seasonId === seasonId)) return false;
      state.seasonPasses = [...state.seasonPasses, {
        seasonId, productId, purchasedAt: Date.now()
      }];
      notify(['seasonPasses']);
      return true;
    },
    addActiveBoost(boost) {
      // boost = { id, boostType, multiplier, startedAt, expiresAt }
      state.activeBoosts = [...state.activeBoosts, boost];
      notify(['activeBoosts']);
    },
    removeExpiredBoosts() {
      const now = Date.now();
      const before = state.activeBoosts.length;
      state.activeBoosts = state.activeBoosts.filter(b => b.expiresAt > now);
      if (state.activeBoosts.length !== before) notify(['activeBoosts']);
      return before - state.activeBoosts.length;
    },
    recordPurchase(productId, price) {
      const now = Date.now();
      const rec = state.purchases[productId] || { count: 0, firstPurchaseAt: null, lastPurchaseAt: null, totalSpent: 0 };
      const updated = {
        count: rec.count + 1,
        firstPurchaseAt: rec.firstPurchaseAt || now,
        lastPurchaseAt: now,
        totalSpent: rec.totalSpent + price
      };
      state.purchases = { ...state.purchases, [productId]: updated };
      state.totalSpentUSD = state.totalSpentUSD + price;
      state.totalTransactions = state.totalTransactions + 1;
      notify(['purchases', 'totalSpentUSD', 'totalTransactions']);
    },

    on(cb) { anyListeners.add(cb); return () => anyListeners.delete(cb); },
    onKey(key, cb) {
      if (!keyListeners.has(key)) keyListeners.set(key, new Set());
      keyListeners.get(key).add(cb);
      return () => keyListeners.get(key).delete(cb);
    },

    serialize() {
      return {
        owned: [...state.owned],
        ownedCosmetics: [...state.ownedCosmetics],
        purchases: JSON.parse(JSON.stringify(state.purchases)),
        activeBoosts: state.activeBoosts.map(b => ({ ...b })),
        seasonPasses: state.seasonPasses.map(sp => ({ ...sp })),
        totalSpentUSD: state.totalSpentUSD,
        totalTransactions: state.totalTransactions
      };
    },
    hydrate(data) {
      const clean = sanitize(data);
      Object.assign(state, clean);
      state.owned = [...clean.owned];
      state.ownedCosmetics = [...clean.ownedCosmetics];
      state.purchases = { ...clean.purchases };
      state.activeBoosts = [...clean.activeBoosts];
      state.seasonPasses = [...clean.seasonPasses];
      notify(Object.keys(clean));
      return true;
    },
    reset() {
      Object.assign(state, {
        owned: [],
        ownedCosmetics: [],
        purchases: {},
        activeBoosts: [],
        seasonPasses: [],
        totalSpentUSD: 0,
        totalTransactions: 0
      });
      notify(['owned', 'ownedCosmetics', 'purchases', 'activeBoosts', 'seasonPasses', 'totalSpentUSD', 'totalTransactions']);
    }
  };
}
