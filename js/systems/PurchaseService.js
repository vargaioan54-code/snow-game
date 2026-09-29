// Etapa 12 — PurchaseService
// Orchestreaza flow-ul: validate → backend.processPurchase → grant entitlement + rewards → save.
// Toate reward-urile trec prin sistemele existente (Economy, playerStore, vehicleStore, BoostSystem, grantPlayerXP).
// Zero duplicate ownership.

import { PRODUCTS, PRODUCT_BY_ID } from '../config/monetization.js';

export function createPurchaseService({
  backend, entitlementStore, playerStore, vehicleStore,
  economy, boostSystem, transactionLog,
  audio, haptics, grantPlayerXP, showBanner
}) {
  // In-flight purchases (protejeaza double-click). Map<productId, promise>.
  const inFlight = new Map();
  // Transaction IDs deja procesate (protejeaza duplicate)
  const processedTxIds = new Set();

  function tx(entry) {
    if (transactionLog && typeof transactionLog.log === 'function') transactionLog.log(entry);
  }

  function _banner(msg) { if (typeof showBanner === 'function') { try { showBanner(msg); } catch {} } }

  function getProducts() {
    // Filtreaza non-consumable owned (poti afisa ca DEȚINUT dar tot le returnam pentru UI status)
    return PRODUCTS.map(p => {
      const canPurchase = entitlementStore.canPurchase(p.id);
      const owned = p.type === 'non_consumable' && entitlementStore.hasEntitlement(p.id);
      const rec = entitlementStore.state.purchases[p.id] || null;
      return {
        ...p,
        _canPurchase: canPurchase,
        _owned: owned,
        _purchaseCount: rec ? rec.count : 0
      };
    });
  }

  function getProduct(id) {
    const p = PRODUCT_BY_ID[id];
    if (!p) return null;
    return getProducts().find(x => x.id === id);
  }

  // Purchase async
  async function purchase(productId) {
    const product = PRODUCT_BY_ID[productId];
    if (!product) return { ok: false, reason: 'unknown_product' };

    // Deja in-flight?
    if (inFlight.has(productId)) return { ok: false, reason: 'in_progress' };

    // Non-consumable owned?
    if (product.type === 'non_consumable' && entitlementStore.hasEntitlement(productId)) {
      return { ok: false, reason: 'already_owned' };
    }
    // Purchase limit?
    if (product.purchaseLimit) {
      const rec = entitlementStore.state.purchases[productId];
      if (rec && rec.count >= product.purchaseLimit) {
        return { ok: false, reason: 'limit_reached' };
      }
    }

    // Backend disponibil?
    if (!backend || typeof backend.processPurchase !== 'function') {
      return { ok: false, reason: 'no_backend' };
    }

    const promise = (async () => {
      try {
        const result = await backend.processPurchase(productId, product.price);
        if (!result || !result.ok) {
          _banner('✗ Cumpărare eșuată');
          if (audio && typeof audio.error === 'function') { try { audio.error(); } catch {} }
          return { ok: false, reason: result?.reason || 'backend_failed' };
        }
        // Verifica duplicate transactionId
        if (processedTxIds.has(result.transactionId)) {
          return { ok: false, reason: 'duplicate_transaction' };
        }
        processedTxIds.add(result.transactionId);

        _grantEntitlement(product, result.transactionId, { isRestore: false });
        return { ok: true, transactionId: result.transactionId };
      } catch (err) {
        console.error('[PurchaseService] error:', err);
        _banner('✗ Eroare cumpărare');
        return { ok: false, reason: 'exception', error: String(err) };
      } finally {
        inFlight.delete(productId);
      }
    })();

    inFlight.set(productId, promise);
    return promise;
  }

  function _grantEntitlement(product, transactionId, opts = {}) {
    const isRestore = !!opts.isRestore;

    // Record purchase counter (skip pentru restore consumabile — dar restore doar non_consumable oricum)
    if (!isRestore) {
      entitlementStore.recordPurchase(product.id, product.price);
    }

    // Marcheaza owned dacă non-consumable
    if (product.type === 'non_consumable') {
      entitlementStore.addOwned(product.id);
    }

    // Apply rewards
    const rewardsSummary = [];
    for (const reward of (product.rewards || [])) {
      _applyReward(reward, product);
      rewardsSummary.push(_formatReward(reward));
    }

    tx({
      type: isRestore ? 'IAP_RESTORE' : 'IAP_PURCHASE',
      currency: 'usd',
      amount: -product.price,
      balanceAfter: entitlementStore.state.totalSpentUSD,
      meta: {
        productId: product.id,
        category: product.category,
        transactionId,
        rewards: (product.rewards || []).map(r => ({ type: r.type, ...(r.amount !== undefined ? { amount: r.amount } : {}), ...(r.id ? { id: r.id } : {}) }))
      }
    });

    tx({
      type: 'ENTITLEMENT_GRANT',
      currency: null,
      amount: 0,
      balanceAfter: null,
      meta: { productId: product.id, transactionId }
    });

    _banner('✓ ' + (isRestore ? 'Restaurat: ' : '') + product.name + (rewardsSummary.length ? ' — ' + rewardsSummary.join(', ') : ''));
    if (audio && typeof audio.pickupBig === 'function') { try { audio.pickupBig(); } catch {} }
    if (haptics && typeof haptics.success === 'function') { try { haptics.success(); } catch {} }
  }

  function _applyReward(reward, product) {
    switch (reward.type) {
      case 'coins': {
        const amount = Number(reward.amount) || 0;
        if (amount > 0) {
          const cur = playerStore.state.vaultCoins;
          playerStore.set({ vaultCoins: cur + amount });
        }
        break;
      }
      case 'diamonds': {
        const amount = Number(reward.amount) || 0;
        if (amount > 0) {
          if (typeof economy.addDiamonds === 'function') {
            economy.addDiamonds(amount, { source: 'iap', productId: product.id });
          } else {
            playerStore.set({ diamonds: playerStore.state.diamonds + amount });
          }
          tx({
            type: 'PREMIUM_CURRENCY_GRANT',
            currency: 'diamonds',
            amount,
            balanceAfter: playerStore.state.diamonds,
            meta: { productId: product.id }
          });
        }
        break;
      }
      case 'reputation': {
        const amount = Number(reward.amount) || 0;
        if (amount > 0) {
          if (typeof economy.addReputation === 'function') {
            economy.addReputation(amount, { source: 'iap', productId: product.id });
          } else {
            playerStore.set({ reputation: playerStore.state.reputation + amount });
          }
        }
        break;
      }
      case 'xp': {
        const amount = Number(reward.amount) || 0;
        if (amount > 0 && typeof grantPlayerXP === 'function') {
          grantPlayerXP(amount, { source: 'iap', productId: product.id });
        }
        break;
      }
      case 'tool': {
        const id = reward.id;
        if (typeof id === 'string' && !playerStore.state.owned.includes(id)) {
          playerStore.set({ owned: [...playerStore.state.owned, id] });
        }
        break;
      }
      case 'vehicle': {
        const id = reward.id;
        if (typeof id === 'string' && !vehicleStore.state.owned.includes(id)) {
          vehicleStore.addOwned(id);
        }
        break;
      }
      case 'attachment': {
        const id = reward.id;
        if (typeof id === 'string' && !vehicleStore.state.ownedAttachments.includes(id)) {
          vehicleStore.addAttachmentOwned(id);
        }
        break;
      }
      case 'boost': {
        if (boostSystem && typeof boostSystem.activate === 'function') {
          boostSystem.activate(reward.boostType, reward.multiplier, reward.durationHours, { source: 'iap', productId: product.id });
        }
        break;
      }
      case 'cosmetic': {
        const id = reward.id;
        if (typeof id === 'string') {
          entitlementStore.addCosmetic(id);
        }
        break;
      }
      case 'entitlement': {
        const id = reward.id;
        if (typeof id === 'string') {
          entitlementStore.addOwned(id);
          // Daca produsul are seasonId, marcheaza si season pass
          if (product.seasonId) {
            entitlementStore.addSeasonPass(product.seasonId, product.id);
            tx({
              type: 'SEASON_PASS_PURCHASE',
              currency: null,
              amount: 0,
              balanceAfter: null,
              meta: { seasonId: product.seasonId, productId: product.id }
            });
          }
        }
        break;
      }
      default:
        console.warn('[PurchaseService] unknown reward type:', reward.type);
    }
  }

  function _formatReward(reward) {
    switch (reward.type) {
      case 'coins': return '+' + (reward.amount || 0) + '💰';
      case 'diamonds': return '+' + (reward.amount || 0) + '💎';
      case 'reputation': return '+' + (reward.amount || 0) + '⭐';
      case 'xp': return '+' + (reward.amount || 0) + ' XP';
      case 'tool': return 'Unealtă: ' + reward.id;
      case 'vehicle': return 'Vehicul: ' + reward.id;
      case 'attachment': return 'Atașament: ' + reward.id;
      case 'boost': return 'Boost ×' + reward.multiplier;
      case 'cosmetic': return 'Skin: ' + reward.id;
      case 'entitlement': return 'Deblocat: ' + reward.id;
      default: return reward.type;
    }
  }

  // Restore
  async function restorePurchases() {
    if (!backend || typeof backend.restore !== 'function') {
      return { ok: false, reason: 'no_backend', restored: [] };
    }
    try {
      const receipts = await backend.restore();
      const restored = [];
      for (const r of receipts || []) {
        if (!r || !r.productId) continue;
        const product = PRODUCT_BY_ID[r.productId];
        if (!product) continue;
        if (product.type === 'consumable') continue;
        if (entitlementStore.hasEntitlement(r.productId)) continue;
        if (processedTxIds.has(r.transactionId)) continue;
        if (r.transactionId) processedTxIds.add(r.transactionId);
        _grantEntitlement(product, r.transactionId, { isRestore: true });
        restored.push(r.productId);
      }
      _banner(restored.length ? '✓ Restaurate: ' + restored.length + ' produse' : 'Nimic de restaurat');
      return { ok: true, restored };
    } catch (err) {
      console.error('[PurchaseService] restore error:', err);
      return { ok: false, reason: 'exception', error: String(err), restored: [] };
    }
  }

  // Grant direct — dev/debug helper (bypass backend). Doar in dev.
  function debugGrant(productId) {
    const product = PRODUCT_BY_ID[productId];
    if (!product) return { ok: false, reason: 'unknown_product' };
    if (product.type === 'non_consumable' && entitlementStore.hasEntitlement(productId)) {
      return { ok: false, reason: 'already_owned' };
    }
    _grantEntitlement(product, 'debug_' + Date.now(), { isRestore: false });
    return { ok: true };
  }

  function getBackendInfo() {
    return {
      isMock: !!(backend && backend.isMock),
      platform: backend && typeof backend.getPlatform === 'function' ? backend.getPlatform() : 'unknown'
    };
  }

  return {
    getProducts, getProduct,
    purchase, restorePurchases,
    debugGrant,
    getBackendInfo,
    isInFlight: (id) => inFlight.has(id)
  };
}
