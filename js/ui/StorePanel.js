// Etapa 12 — StorePanel
// Overlay modal cu sidebar navigation (6 tab-uri).
// Toate purchase-uri = MOCK backend (dev). Warning clar în UI.

import { PRODUCTS, FEATURED_PRODUCT_IDS, PRODUCT_BY_ID } from '../config/monetization.js';

const STYLE = `
#store-overlay {
  position: fixed; inset: 0; background: rgba(10,14,22,0.86);
  display: none; z-index: 90; font: 400 14px system-ui, sans-serif; color: #fff;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}
#store-overlay.visible { display: flex; align-items: stretch; justify-content: center; }
#store-overlay .panel {
  background: #131a26; border: 1px solid rgba(255,255,255,0.15);
  border-radius: 14px; margin: 24px; flex: 1; max-width: 1100px;
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
}
#store-overlay .header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; background: linear-gradient(180deg, #1c2434 0%, #131a26 100%);
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
#store-overlay .header h2 { margin: 0; font-size: 18px; font-weight: 700; }
#store-overlay .header .close-btn {
  background: none; border: none; color: #fff; font-size: 24px; cursor: pointer;
  width: 32px; height: 32px; border-radius: 6px;
}
#store-overlay .header .close-btn:hover { background: rgba(255,255,255,0.1); }
#store-overlay .dev-warning {
  background: rgba(255, 170, 60, 0.15); color: #ffcc60; padding: 8px 12px;
  font: 500 12px system-ui; text-align: center; border-bottom: 1px solid rgba(255,204,96,0.3);
}
#store-overlay .boosts-header {
  padding: 8px 20px; background: rgba(63, 216, 255, 0.08);
  border-bottom: 1px solid rgba(63,216,255,0.2);
  font: 500 12px system-ui; color: #3fd8ff; min-height: 32px;
}
#store-overlay .body { display: flex; flex: 1; overflow: hidden; }
#store-overlay .sidebar {
  width: 200px; background: #0f1520; padding: 12px 0;
  border-right: 1px solid rgba(255,255,255,0.08);
  overflow-y: auto; flex-shrink: 0;
}
#store-overlay .tab-btn {
  display: block; width: 100%; background: none; border: none; color: #a8b0bc;
  text-align: left; padding: 10px 20px; cursor: pointer; font: 500 14px system-ui;
  border-left: 3px solid transparent;
}
#store-overlay .tab-btn:hover { background: rgba(255,255,255,0.04); color: #fff; }
#store-overlay .tab-btn.active { background: rgba(63,216,255,0.1); color: #3fd8ff; border-left-color: #3fd8ff; }
#store-overlay .content {
  flex: 1; overflow-y: auto; padding: 20px;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px; align-content: start;
}
#store-overlay .product-card {
  background: #1c2434; border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px; padding: 14px; display: flex; flex-direction: column;
  gap: 8px; position: relative; min-height: 220px;
}
#store-overlay .product-card.featured { border-color: #3fd8ff; box-shadow: 0 0 20px rgba(63,216,255,0.15); }
#store-overlay .product-card .badge {
  position: absolute; top: 8px; right: 8px; background: #3fd8ff; color: #0a0e18;
  padding: 3px 8px; border-radius: 4px; font: 700 10px system-ui; letter-spacing: 0.5px;
}
#store-overlay .product-card .badge.mega { background: #ff6040; color: #fff; }
#store-overlay .product-card .badge.season { background: #ffcc60; color: #0a0e18; }
#store-overlay .product-card .icon { font-size: 40px; text-align: center; margin: 4px 0; }
#store-overlay .product-card .name { font: 700 14px system-ui; text-align: center; }
#store-overlay .product-card .description { font: 400 12px system-ui; color: #8a94aa; text-align: center; min-height: 32px; }
#store-overlay .product-card .rewards {
  font: 500 11px system-ui; color: #b8c2d4; padding: 6px 8px;
  background: rgba(255,255,255,0.04); border-radius: 6px; text-align: center;
}
#store-overlay .product-card .price {
  font: 800 16px system-ui; color: #3fd8ff; text-align: center; margin-top: auto;
}
#store-overlay .product-card .buy-btn {
  padding: 10px 12px; background: #3fd8ff; color: #0a0e18; border: none;
  border-radius: 8px; cursor: pointer; font: 700 13px system-ui;
}
#store-overlay .product-card .buy-btn:hover:not(:disabled) { filter: brightness(1.15); }
#store-overlay .product-card .buy-btn:disabled { background: #2a3244; color: #4a5468; cursor: not-allowed; }
#store-overlay .product-card .buy-btn.owned { background: #3ea862; color: #fff; }
#store-overlay .product-card .buy-btn.purchasing { background: #ffcc60; color: #0a0e18; }
#store-overlay .footer {
  padding: 12px 20px; border-top: 1px solid rgba(255,255,255,0.1);
  display: flex; justify-content: space-between; align-items: center; gap: 10px;
  font: 400 12px system-ui; color: #8a94aa;
}
#store-overlay .footer .restore-btn {
  padding: 8px 16px; background: #2a3244; color: #fff; border: 1px solid rgba(255,255,255,0.2);
  border-radius: 6px; cursor: pointer; font: 600 12px system-ui;
}
#store-overlay .footer .restore-btn:hover { filter: brightness(1.2); }

#store-confirm-overlay {
  position: fixed; inset: 0; background: rgba(10,14,22,0.9);
  display: none; z-index: 95; align-items: center; justify-content: center;
  font: 400 14px system-ui, sans-serif; color: #fff;
}
#store-confirm-overlay.visible { display: flex; }
#store-confirm-overlay .panel {
  background: #1c2434; border: 1px solid rgba(255,255,255,0.15);
  border-radius: 14px; padding: 24px 28px; min-width: 320px; max-width: 92vw;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
}
#store-confirm-overlay h3 { margin: 0 0 8px; font-size: 18px; font-weight: 700; }
#store-confirm-overlay .price {
  font: 800 22px system-ui; color: #3fd8ff; text-align: center; margin: 12px 0;
}
#store-confirm-overlay .rewards-list {
  background: rgba(255,255,255,0.04); border-radius: 8px; padding: 10px;
  margin: 12px 0; font: 500 13px system-ui;
}
#store-confirm-overlay .rewards-list div { padding: 3px 0; }
#store-confirm-overlay .dev-note {
  background: rgba(255,170,60,0.15); color: #ffcc60; padding: 8px 10px;
  border-radius: 6px; font: 500 12px system-ui; text-align: center; margin: 12px 0;
}
#store-confirm-overlay .actions { display: flex; gap: 10px; margin-top: 16px; }
#store-confirm-overlay .btn {
  flex: 1; padding: 12px 14px; border-radius: 8px; cursor: pointer;
  border: 1px solid rgba(255,255,255,0.2); background: #2a3244; color: #fff;
  font: 600 14px system-ui;
}
#store-confirm-overlay .btn.primary { background: #3fd8ff; color: #0a0e18; border-color: #3fd8ff; }
#store-confirm-overlay .btn:hover:not(:disabled) { filter: brightness(1.2); }
#store-confirm-overlay .btn:disabled { opacity: 0.5; cursor: not-allowed; }

@media (max-width: 900px) {
  #store-overlay .panel { margin: 12px; }
  #store-overlay .body { flex-direction: column; }
  #store-overlay .sidebar {
    width: 100%; height: auto; display: flex; overflow-x: auto;
    padding: 8px; gap: 4px; border-right: none; border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  #store-overlay .tab-btn { flex-shrink: 0; padding: 8px 12px; border-left: none; border-bottom: 3px solid transparent; }
  #store-overlay .tab-btn.active { border-left: none; border-bottom-color: #3fd8ff; }
  #store-overlay .content { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); padding: 12px; }
}
`;

const TABS = [
  { id: 'featured', name: '⭐ Featured', filter: (p) => FEATURED_PRODUCT_IDS.includes(p.id) },
  { id: 'premium_currency', name: '💎 Diamante', filter: (p) => p.category === 'premium_currency' },
  { id: 'bundle', name: '🎁 Bundles', filter: (p) => p.category === 'bundle' },
  { id: 'cosmetic', name: '🎨 Cosmetics', filter: (p) => p.category === 'cosmetic' },
  { id: 'boost', name: '⚡ Boosts', filter: (p) => p.category === 'boost' },
  { id: 'season_pass', name: '🎫 Season Pass', filter: (p) => p.category === 'season_pass' }
];

export function createStorePanel({ purchaseService, entitlementStore, boostSystem, gameState, showBanner }) {
  let root = null;
  let confirmRoot = null;
  let currentTab = 'featured';
  let boostsTimer = null;

  function injectStyle() {
    if (document.getElementById('store-panel-style')) return;
    const s = document.createElement('style');
    s.id = 'store-panel-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function build() {
    if (root) return;
    injectStyle();
    root = document.createElement('div');
    root.id = 'store-overlay';
    root.innerHTML = `
      <div class="panel">
        <div class="header">
          <h2>🛍️ Magazin</h2>
          <button class="close-btn" data-act="close" aria-label="Închide">×</button>
        </div>
        <div class="dev-warning">🧪 MOD DEZVOLTARE — cumpărările sunt simulate (mock backend). Real IAP este BLOCKED (necesită App Store / Google Play configuration + backend receipt validation).</div>
        <div class="boosts-header" data-role="boosts-header">Fără boost-uri active</div>
        <div class="body">
          <div class="sidebar" data-role="sidebar"></div>
          <div class="content" data-role="content"></div>
        </div>
        <div class="footer">
          <div>Backend: <strong data-role="backend-info">mock</strong> · Total spent: <strong data-role="total-spent">$0.00</strong></div>
          <button class="restore-btn" data-act="restore">Restaurează cumpărările</button>
        </div>
      </div>
    `;
    document.body.appendChild(root);

    root.addEventListener('click', (e) => {
      if (e.target === root) close();
      const act = e.target.getAttribute && e.target.getAttribute('data-act');
      if (act === 'close') close();
      if (act === 'restore') handleRestore();
    });

    renderSidebar();
    renderContent();
    renderBoostsHeader();
    renderFooter();

    // Subscribe la modificari
    entitlementStore.on(() => {
      if (root && root.classList.contains('visible')) {
        renderContent();
        renderBoostsHeader();
        renderFooter();
      }
    });
  }

  function renderSidebar() {
    const sidebar = root.querySelector('[data-role="sidebar"]');
    sidebar.innerHTML = TABS.map(t =>
      `<button class="tab-btn ${t.id === currentTab ? 'active' : ''}" data-tab="${t.id}">${t.name}</button>`
    ).join('');
    sidebar.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentTab = btn.getAttribute('data-tab');
        renderSidebar();
        renderContent();
      });
    });
  }

  function renderContent() {
    if (!root) return;
    const content = root.querySelector('[data-role="content"]');
    const tab = TABS.find(t => t.id === currentTab);
    if (!tab) { content.innerHTML = '<div>Tab necunoscut</div>'; return; }
    const products = purchaseService.getProducts().filter(tab.filter);
    if (products.length === 0) {
      content.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:#8a94aa; padding:40px;">Nu există produse în această categorie</div>';
      return;
    }
    content.innerHTML = products.map(p => renderProductCard(p, tab.id === 'featured')).join('');
    content.querySelectorAll('.product-card .buy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pid = btn.getAttribute('data-pid');
        if (btn.disabled) return;
        openConfirm(pid);
      });
    });
  }

  function renderProductCard(product, featured = false) {
    const owned = product._owned;
    const inFlight = purchaseService.isInFlight(product.id);
    const canBuy = product._canPurchase && !inFlight;

    let btnText, btnClass = '', btnDisabled = '';
    if (inFlight) {
      btnText = '⏳ Se procesează...';
      btnClass = 'purchasing';
      btnDisabled = 'disabled';
    } else if (owned) {
      btnText = '✓ DEȚINUT';
      btnClass = 'owned';
      btnDisabled = 'disabled';
    } else if (!canBuy) {
      btnText = 'LIMIT ATINS';
      btnDisabled = 'disabled';
    } else {
      btnText = 'CUMPĂRĂ';
    }

    const rewardsHtml = (product.rewards || []).map(r => formatReward(r)).join(' · ');
    const badge = product.badge ? `<div class="badge ${product.badge === 'MEGA' ? 'mega' : (product.badge === 'SEASON' ? 'season' : '')}">${product.badge}</div>` : '';

    return `
      <div class="product-card ${featured ? 'featured' : ''}">
        ${badge}
        <div class="icon">${product.icon || '📦'}</div>
        <div class="name">${escapeHtml(product.name)}</div>
        <div class="description">${escapeHtml(product.description || '')}</div>
        <div class="rewards">${rewardsHtml}</div>
        <div class="price">${product.priceDisplay}</div>
        <button class="buy-btn ${btnClass}" data-pid="${product.id}" ${btnDisabled}>${btnText}</button>
      </div>
    `;
  }

  function formatReward(r) {
    switch (r.type) {
      case 'coins': return '+' + r.amount + '💰';
      case 'diamonds': return '+' + r.amount + '💎';
      case 'reputation': return '+' + r.amount + '⭐';
      case 'xp': return '+' + r.amount + ' XP';
      case 'tool': return '🔧 ' + r.id;
      case 'vehicle': return '🚗 ' + r.id;
      case 'attachment': return '🛠️ ' + r.id;
      case 'boost': return '⚡ ×' + r.multiplier + ' ' + r.durationHours + 'h';
      case 'cosmetic': return '🎨 ' + r.id;
      case 'entitlement': return '🎫 ' + r.id;
      default: return r.type;
    }
  }

  function renderBoostsHeader() {
    if (!root) return;
    const header = root.querySelector('[data-role="boosts-header"]');
    const active = boostSystem ? boostSystem.getActive() : [];
    if (!active || active.length === 0) {
      header.textContent = 'Fără boost-uri active';
      return;
    }
    header.textContent = '⚡ Boost-uri active: ' + active.map(b => {
      const ms = b.expiresAt - Date.now();
      const remaining = boostSystem.formatTimeRemaining(ms);
      return b.boostType.replace('_boost', '').replace('_', ' ') + ' ×' + b.multiplier + ' (' + remaining + ')';
    }).join(' · ');
  }

  function renderFooter() {
    if (!root) return;
    const info = purchaseService.getBackendInfo();
    const backendEl = root.querySelector('[data-role="backend-info"]');
    if (backendEl) backendEl.textContent = info.isMock ? 'mock (dev)' : info.platform;
    const totalEl = root.querySelector('[data-role="total-spent"]');
    if (totalEl) totalEl.textContent = '$' + entitlementStore.state.totalSpentUSD.toFixed(2);
  }

  function openConfirm(productId) {
    const product = PRODUCT_BY_ID[productId];
    if (!product) return;

    if (!confirmRoot) {
      confirmRoot = document.createElement('div');
      confirmRoot.id = 'store-confirm-overlay';
      document.body.appendChild(confirmRoot);
    }

    const rewardsHtml = (product.rewards || []).map(r => '<div>' + escapeHtml(formatReward(r)) + '</div>').join('');
    confirmRoot.innerHTML = `
      <div class="panel">
        <h3>${escapeHtml(product.name)}</h3>
        <div style="color:#8a94aa; font-size:13px;">${escapeHtml(product.description || '')}</div>
        <div class="price">${product.priceDisplay}</div>
        <div class="rewards-list">
          <div style="font-weight:700; margin-bottom:6px;">Vei primi:</div>
          ${rewardsHtml}
        </div>
        <div class="dev-note">🧪 MOD DEZVOLTARE — cumpărare simulată. Fără plată reală.</div>
        <div class="actions">
          <button class="btn" data-act="cancel">Anulează</button>
          <button class="btn primary" data-act="confirm">Confirmă cumpărarea</button>
        </div>
      </div>
    `;
    confirmRoot.classList.add('visible');

    const cancelBtn = confirmRoot.querySelector('[data-act="cancel"]');
    const confirmBtn = confirmRoot.querySelector('[data-act="confirm"]');
    cancelBtn.addEventListener('click', closeConfirm);
    confirmRoot.addEventListener('click', (e) => { if (e.target === confirmRoot) closeConfirm(); });

    confirmBtn.addEventListener('click', async () => {
      confirmBtn.disabled = true;
      cancelBtn.disabled = true;
      confirmBtn.textContent = '⏳ Se procesează...';
      const result = await purchaseService.purchase(productId);
      closeConfirm();
      if (!result.ok) {
        // Reasons friendly text
        const reasons = {
          in_progress: 'Cumpărare în curs',
          already_owned: 'Ai deja acest produs',
          limit_reached: 'Ai atins limita de cumpărare',
          no_backend: 'Backend indisponibil',
          duplicate_transaction: 'Tranzacție duplicată',
          mock_random_fail: 'Cumpărare eșuată (mock random)',
          backend_failed: 'Backend a returnat eroare',
          exception: 'Excepție internă'
        };
        if (typeof showBanner === 'function') showBanner('✗ ' + (reasons[result.reason] || result.reason));
      }
      renderContent();
    });
  }

  function closeConfirm() {
    if (confirmRoot) confirmRoot.classList.remove('visible');
  }

  async function handleRestore() {
    if (typeof showBanner === 'function') showBanner('⏳ Restaurare...');
    const result = await purchaseService.restorePurchases();
    if (!result.ok && typeof showBanner === 'function') {
      showBanner('✗ Restaurare eșuată: ' + (result.reason || 'necunoscut'));
    }
    renderContent();
    renderFooter();
  }

  function open() {
    build();
    root.classList.add('visible');
    if (gameState && typeof gameState.setScreen === 'function') {
      try { gameState.setScreen('store_open'); } catch {}
    }
    renderContent();
    renderBoostsHeader();
    renderFooter();
    // Timer 1s pentru countdown boost-uri
    if (boostsTimer) clearInterval(boostsTimer);
    boostsTimer = setInterval(() => { if (root && root.classList.contains('visible')) renderBoostsHeader(); }, 1000);
  }

  function close() {
    if (root) root.classList.remove('visible');
    if (boostsTimer) { clearInterval(boostsTimer); boostsTimer = null; }
    if (gameState && typeof gameState.setScreen === 'function') {
      try { gameState.setScreen('playing'); } catch {}
    }
  }

  function toggle() {
    if (root && root.classList.contains('visible')) close();
    else open();
  }

  // HUD button
  function ensureHudButton() {
    if (document.getElementById('store-trigger-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'store-trigger-btn';
    btn.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top) + 12px);left:calc(env(safe-area-inset-left) + 340px);z-index:15;background:rgba(28,36,52,0.9);color:#fff;border:1px solid rgba(255,255,255,0.15);border-radius:10px;padding:8px 12px;cursor:pointer;font:600 14px system-ui;';
    btn.innerHTML = '🛍️ Magazin';
    btn.addEventListener('click', toggle);
    document.body.appendChild(btn);
  }

  // Mini boost indicator sub coin card
  let boostIndicator = null;
  let boostIndicatorTimer = null;
  function ensureBoostIndicator() {
    if (boostIndicator) return;
    boostIndicator = document.createElement('div');
    boostIndicator.id = 'boost-indicator';
    boostIndicator.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top) + 62px);right:calc(env(safe-area-inset-right) + 12px);z-index:15;background:rgba(63,216,255,0.15);color:#3fd8ff;border:1px solid rgba(63,216,255,0.4);border-radius:8px;padding:4px 10px;cursor:pointer;font:600 12px system-ui;display:none;';
    boostIndicator.addEventListener('click', () => { currentTab = 'boost'; open(); });
    document.body.appendChild(boostIndicator);

    // Update la fiecare 1s
    boostIndicatorTimer = setInterval(updateBoostIndicator, 1000);
    updateBoostIndicator();

    // Update reactive
    if (entitlementStore && typeof entitlementStore.on === 'function') {
      entitlementStore.on(updateBoostIndicator);
    }
  }
  function updateBoostIndicator() {
    if (!boostIndicator) return;
    const active = boostSystem ? boostSystem.getActive() : [];
    if (active.length === 0) {
      boostIndicator.style.display = 'none';
      return;
    }
    // Show max multiplier
    const maxMult = Math.max(...active.map(b => b.multiplier));
    boostIndicator.style.display = 'block';
    boostIndicator.textContent = '⚡ ×' + maxMult + ' (' + active.length + ')';
  }

  return { open, close, toggle, ensureHudButton, ensureBoostIndicator };
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
