// Vehicle Shop Panel — overlay modal cu tab-uri:
// - Vehicles (buy/select/spawn)
// - Attachments (buy/equip)
// - Upgrade (per stat)
// - Fuel/Repair

import { SCREENS } from '../state/GameState.js';
import { VEHICLE_STATS, VEHICLE_BY_ID } from '../config/vehicles.js';
import { ATTACHMENT_STATS, ATTACHMENT_BY_ID } from '../config/attachments.js';
import { VEHICLE_UPGRADE_STATS, VEHICLE_UPGRADE_MAX_LEVEL, vehicleUpgradeCost } from '../config/vehicleUpgrades.js';

const STYLE = `
#vshop-overlay {
  position: fixed; inset: 0; background: rgba(15,20,32,0.72); z-index: 45;
  display: none; align-items: flex-start; justify-content: center;
  font: 400 14px system-ui, sans-serif; color: #fff; overflow-y: auto;
  padding: env(safe-area-inset-top, 20px) 20px 20px;
}
#vshop-overlay.visible { display: flex; }
#vshop-overlay .panel {
  background: #1c2434; border: 1px solid rgba(255,255,255,0.15); border-radius: 14px;
  padding: 20px 24px; min-width: 320px; max-width: min(920px, 92vw);
  width: 100%; max-height: 88vh; overflow-y: auto;
  box-shadow: 0 12px 40px rgba(0,0,0,0.5);
}
#vshop-overlay h2 { margin: 0 0 12px; font-size: 19px; font-weight: 700; }
#vshop-overlay .tabs { display: flex; gap: 8px; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; flex-wrap: wrap; }
#vshop-overlay .tab { padding: 8px 14px; cursor: pointer; background: rgba(255,255,255,0.06); border: 1px solid transparent; border-radius: 8px; font-weight: 600; font-size: 13px; }
#vshop-overlay .tab.active { background: rgba(63,216,255,0.18); border-color: rgba(63,216,255,0.5); }
#vshop-overlay .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
#vshop-overlay .card { background: #2a3244; border-radius: 10px; padding: 12px; border: 1px solid rgba(255,255,255,0.1); }
#vshop-overlay .card.owned { border-color: rgba(63,216,255,0.5); }
#vshop-overlay .card.active { border-color: #3fd8a0; background: #22403a; }
#vshop-overlay .card.locked { opacity: 0.55; }
#vshop-overlay .card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
#vshop-overlay .card-icon { font-size: 24px; }
#vshop-overlay .card-name { font-weight: 700; font-size: 14px; flex: 1; }
#vshop-overlay .card-badge { font-size: 11px; padding: 3px 6px; border-radius: 4px; background: rgba(255,192,67,0.2); border: 1px solid rgba(255,192,67,0.5); }
#vshop-overlay .card-desc { font-size: 12px; opacity: 0.8; margin: 4px 0 6px; min-height: 30px; }
#vshop-overlay .card-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 8px; font-size: 11px; opacity: 0.75; margin-bottom: 8px; }
#vshop-overlay .card-price { font-weight: 700; color: #ffc043; font-size: 14px; }
#vshop-overlay .card-action { margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap; }
#vshop-overlay button.btn { padding: 8px 12px; border-radius: 6px; cursor: pointer; border: 1px solid rgba(255,255,255,0.2); background: #3a4152; color: #fff; font: 600 12px system-ui; }
#vshop-overlay button.btn:hover { filter: brightness(1.2); }
#vshop-overlay button.btn.primary { background: #3fd8ff; color: #0a1420; }
#vshop-overlay button.btn.success { background: #3fd8a0; color: #0a1420; }
#vshop-overlay button.btn.danger { background: #e83030; }
#vshop-overlay button.btn:disabled { opacity: 0.5; cursor: not-allowed; }
#vshop-overlay .close { position: absolute; top: 16px; right: 20px; cursor: pointer; font-size: 24px; opacity: 0.8; }
#vshop-overlay .upgrade-row, #vshop-overlay .service-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08); gap: 12px; }
#vshop-overlay .status-bar { height: 6px; width: 120px; background: rgba(255,255,255,0.12); border-radius: 3px; overflow: hidden; }
#vshop-overlay .status-fill { height: 100%; background: #3fd8a0; }
#vshop-overlay .empty { padding: 24px; text-align: center; opacity: 0.7; }
`;

export function createVehicleShopPanel(deps) {
  const { vehicleStore, vehicleSystem, playerStore, economy, gameState, showBanner } = deps;
  const banner = (t) => (showBanner ? showBanner(t) : console.log('[banner]', t));

  if (document.getElementById('vshop-style')) document.getElementById('vshop-style').remove();
  const s = document.createElement('style');
  s.id = 'vshop-style';
  s.textContent = STYLE;
  document.head.appendChild(s);

  const root = document.createElement('div');
  root.id = 'vshop-overlay';
  root.innerHTML = `
    <div class="panel" style="position:relative">
      <div class="close" data-close>×</div>
      <h2>🚗 Vehicule și utilaje</h2>
      <div class="tabs">
        <div class="tab active" data-tab="vehicles">Vehicule</div>
        <div class="tab" data-tab="attachments">Atașamente</div>
        <div class="tab" data-tab="upgrades">Upgrade</div>
        <div class="tab" data-tab="service">Fuel / Repair</div>
      </div>
      <div class="content" data-content></div>
    </div>
  `;
  document.body.appendChild(root);

  let currentTab = 'vehicles';
  const contentEl = root.querySelector('[data-content]');

  root.querySelector('[data-close]').addEventListener('click', close);
  root.addEventListener('click', (e) => { if (e.target === root) close(); });
  root.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => {
      currentTab = t.dataset.tab;
      root.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === t));
      render();
    });
  });

  // Trigger button top-right, under world button
  const trigger = document.createElement('button');
  trigger.id = 'vehicle-trigger';
  trigger.title = 'Vehicule (V)';
  trigger.style.cssText = 'position:fixed;top:calc(170px + env(safe-area-inset-top));' +
    'right:calc(12px + env(safe-area-inset-right));' +
    'width:44px;height:44px;border-radius:10px;border:1px solid rgba(255,180,50,0.5);' +
    'background:rgba(15,20,32,0.85);color:#ffc043;font-size:22px;cursor:pointer;' +
    'z-index:7;display:flex;align-items:center;justify-content:center;' +
    'box-shadow:0 4px 12px rgba(0,0,0,0.35);';
  trigger.textContent = '🚗';
  trigger.addEventListener('click', () => open());
  document.body.appendChild(trigger);

  function open() {
    render();
    root.classList.add('visible');
    if (gameState && gameState.setScreen) gameState.setScreen(SCREENS.SHOP_OPEN);
  }
  function close() {
    root.classList.remove('visible');
    if (gameState && gameState.screen === SCREENS.SHOP_OPEN) gameState.setScreen(SCREENS.PLAYING);
  }
  function toggle() { if (root.classList.contains('visible')) close(); else open(); }

  /* ============== RENDER TABS ============== */

  function render() {
    if (currentTab === 'vehicles')    contentEl.innerHTML = renderVehicles();
    else if (currentTab === 'attachments') contentEl.innerHTML = renderAttachments();
    else if (currentTab === 'upgrades')     contentEl.innerHTML = renderUpgrades();
    else if (currentTab === 'service')      contentEl.innerHTML = renderService();
    wireContent();
  }

  function renderVehicles() {
    const ps = playerStore.state;
    let html = '<div class="grid">';
    for (const v of VEHICLE_STATS) {
      const owned = vehicleStore.isOwned(v.id);
      const active = vehicleStore.state.activeVehicleId === v.id;
      const unlock = vehicleSystem.getVehicleLockReason(v.id, ps);
      const locked = !!unlock && !owned;
      const canAfford = playerStore.totalCoins >= v.price;
      const classes = ['card'];
      if (locked) classes.push('locked');
      if (owned && !active) classes.push('owned');
      if (active) classes.push('active');
      let status = 'BUY';
      if (locked) {
        if (unlock.reason === 'level') status = '🔒 Level ' + unlock.requiredLevel;
        else if (unlock.reason === 'contracts') status = '🔒 ' + unlock.current + '/' + unlock.required + ' contracte';
        else status = '🔒 Blocat';
      } else if (active) status = 'ACTIV';
      else if (owned) status = 'DEȚINUT';
      const actions = [];
      if (!owned && !locked) actions.push(`<button class="btn primary" data-buy="${v.id}" ${canAfford ? '' : 'disabled'}>Cumpără · ${v.price}</button>`);
      if (owned && !active) actions.push(`<button class="btn success" data-select="${v.id}">Selectează</button>`);
      if (owned) actions.push(`<button class="btn" data-spawn="${v.id}">Spawn</button>`);
      html += `
        <div class="${classes.join(' ')}">
          <div class="card-header">
            <div class="card-icon">${v.icon}</div>
            <div class="card-name">${v.name}</div>
            <div class="card-badge">${v.category.toUpperCase()}</div>
          </div>
          <div class="card-desc">${v.description}</div>
          <div class="card-stats">
            <div>🏁 Speed: ${v.maxSpeed}</div>
            <div>💪 Power: ${v.clearPower}</div>
            <div>📦 Cap: ${v.capacity}</div>
            <div>⛽ Fuel: ${v.fuelCapacity}</div>
            <div>📏 Width: ${v.clearWidth}m</div>
            <div>🔧 Dur: ${v.durability}</div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
            <span class="card-price">${owned ? status : ('💰 ' + v.price)}</span>
            <span style="font-size:11px;opacity:0.7">${locked ? status : ''}</span>
          </div>
          <div class="card-action">${actions.join('')}</div>
        </div>`;
    }
    html += '</div>';
    return html;
  }

  function renderAttachments() {
    const ps = playerStore.state;
    let html = '<div class="grid">';
    for (const a of ATTACHMENT_STATS) {
      const owned = vehicleStore.isAttachmentOwned(a.id);
      const canAfford = playerStore.totalCoins >= a.price;
      const locked = ps.level < (a.unlockLevel || 1);
      const classes = ['card'];
      if (owned) classes.push('owned');
      if (locked && !owned) classes.push('locked');
      // Which vehicles are compatible?
      const compatible = VEHICLE_STATS
        .filter(v => v.compatibleAttachments.includes(a.id))
        .map(v => v.icon + ' ' + v.name).join(', ');
      const actions = [];
      if (!owned && !locked) actions.push(`<button class="btn primary" data-buy-att="${a.id}" ${canAfford ? '' : 'disabled'}>Cumpără · ${a.price}</button>`);
      // Equip on active vehicle
      const active = vehicleStore.state.activeVehicleId;
      if (owned && active) {
        const activeConfig = VEHICLE_BY_ID[active];
        if (activeConfig && activeConfig.compatibleAttachments.includes(a.id)) {
          const inst = vehicleStore.getInstance(active);
          const equipped = inst && inst.equippedAttachmentId === a.id;
          if (!equipped) actions.push(`<button class="btn success" data-equip-att="${a.id}">Echipează pe ${activeConfig.icon}</button>`);
          else actions.push(`<button class="btn" data-unequip>${'✓ Echipat'}</button>`);
        }
      }
      html += `
        <div class="${classes.join(' ')}">
          <div class="card-header">
            <div class="card-icon">${a.type === 'plow' ? '🔺' : '🪣'}</div>
            <div class="card-name">${a.name}</div>
            <div class="card-badge">${a.type.toUpperCase()}</div>
          </div>
          <div class="card-desc">${compatible}</div>
          <div class="card-stats">
            <div>📏 Width: ${a.width}m</div>
            <div>💪 Power×${a.powerMult}</div>
            ${a.capacityBonus ? '<div>📦 +'+a.capacityBonus+'</div>' : ''}
            <div>🔓 Level ${a.unlockLevel}</div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
            <span class="card-price">${owned ? '✓ Deținut' : '💰 ' + a.price}</span>
            <span style="font-size:11px;opacity:0.7">${locked && !owned ? '🔒 L' + a.unlockLevel : ''}</span>
          </div>
          <div class="card-action">${actions.join('')}</div>
        </div>`;
    }
    html += '</div>';
    return html;
  }

  function renderUpgrades() {
    const active = vehicleStore.state.activeVehicleId;
    if (!active) return '<div class="empty">Selectează un vehicul întâi (tab Vehicule).</div>';
    const config = VEHICLE_BY_ID[active];
    const inst = vehicleStore.getInstance(active);
    if (!config || !inst) return '<div class="empty">Vehicul invalid.</div>';
    let html = `<h3 style="margin:0 0 12px">${config.icon} ${config.name} — Upgrade</h3>`;
    for (const stat of VEHICLE_UPGRADE_STATS) {
      const currLevel = inst.upgrades[stat] || 0;
      const maxed = currLevel >= VEHICLE_UPGRADE_MAX_LEVEL;
      const cost = maxed ? 0 : vehicleUpgradeCost(config.price, currLevel);
      const canAfford = playerStore.totalCoins >= cost;
      const dots = '●'.repeat(currLevel) + '○'.repeat(VEHICLE_UPGRADE_MAX_LEVEL - currLevel);
      html += `
        <div class="upgrade-row">
          <div style="flex:1">
            <div style="font-weight:600;text-transform:capitalize">${stat.replace(/_/g,' ')}</div>
            <div style="font-size:11px;opacity:0.6">${dots}</div>
          </div>
          ${maxed
            ? '<div style="color:#3fd8a0">MAX</div>'
            : `<button class="btn primary" data-upgrade="${stat}" ${canAfford ? '' : 'disabled'}>+ ${cost} 💰</button>`}
        </div>`;
    }
    return html;
  }

  function renderService() {
    const active = vehicleStore.state.activeVehicleId;
    if (!active) return '<div class="empty">Selectează un vehicul întâi.</div>';
    const config = VEHICLE_BY_ID[active];
    const inst = vehicleStore.getInstance(active);
    if (!config || !inst) return '<div class="empty">Vehicul invalid.</div>';
    const fuelNeeded = config.fuelCapacity - inst.fuel;
    const fuelCost = Math.max(1, Math.round(fuelNeeded * 5));
    const durNeeded = config.durability - inst.durability;
    const durCost = Math.max(1, Math.round(durNeeded * 15));
    let html = `<h3 style="margin:0 0 12px">${config.icon} ${config.name} — Service</h3>`;
    html += `
      <div class="service-row">
        <div>
          <div style="font-weight:600">⛽ Combustibil</div>
          <div style="font-size:11px;opacity:0.75">${Math.round(inst.fuel)} / ${config.fuelCapacity}</div>
          <div class="status-bar" style="margin-top:4px"><div class="status-fill" style="width:${(inst.fuel/config.fuelCapacity)*100}%"></div></div>
        </div>
        ${fuelNeeded > 0
          ? `<button class="btn primary" data-refuel ${playerStore.totalCoins >= fuelCost ? '' : 'disabled'}>Umple · ${fuelCost} 💰</button>`
          : '<div style="color:#3fd8a0">FULL</div>'}
      </div>
      <div class="service-row">
        <div>
          <div style="font-weight:600">🔧 Durabilitate</div>
          <div style="font-size:11px;opacity:0.75">${Math.round(inst.durability)} / ${config.durability}</div>
          <div class="status-bar" style="margin-top:4px"><div class="status-fill" style="width:${(inst.durability/config.durability)*100}%"></div></div>
        </div>
        ${durNeeded > 0
          ? `<button class="btn primary" data-repair ${playerStore.totalCoins >= durCost ? '' : 'disabled'}>Repară · ${durCost} 💰</button>`
          : '<div style="color:#3fd8a0">100%</div>'}
      </div>`;
    return html;
  }

  /* ============== WIRE INTERACTIONS ============== */

  function wireContent() {
    contentEl.querySelectorAll('[data-buy]').forEach(b => b.addEventListener('click', () => {
      const r = vehicleSystem.buyVehicle(b.dataset.buy);
      if (!r.ok) {
        if (r.reason === 'poor') banner('Nu ai destule monede');
        else if (r.reason === 'level') banner('Necesită Level ' + r.requiredLevel);
        else if (r.reason === 'contracts') banner('Necesită ' + r.required + ' contracte');
      }
      render();
    }));
    contentEl.querySelectorAll('[data-select]').forEach(b => b.addEventListener('click', () => {
      vehicleStore.set({ activeVehicleId: b.dataset.select });
      render();
    }));
    contentEl.querySelectorAll('[data-spawn]').forEach(b => b.addEventListener('click', () => {
      const r = vehicleSystem.spawnVehicle(b.dataset.spawn);
      if (r.ok) banner('Vehicul plasat lângă cabină');
      else banner('Eroare spawn: ' + r.reason);
    }));
    contentEl.querySelectorAll('[data-buy-att]').forEach(b => b.addEventListener('click', () => {
      const r = vehicleSystem.buyAttachment(b.dataset.buyAtt);
      if (!r.ok) {
        if (r.reason === 'poor') banner('Nu ai destule monede');
        else if (r.reason === 'level') banner('Necesită Level ' + r.requiredLevel);
      }
      render();
    }));
    contentEl.querySelectorAll('[data-equip-att]').forEach(b => b.addEventListener('click', () => {
      const active = vehicleStore.state.activeVehicleId;
      if (!active) { banner('Selectează un vehicul întâi'); return; }
      const r = vehicleSystem.equipAttachment(active, b.dataset.equipAtt);
      if (!r.ok) banner('Nu se poate echipa: ' + r.reason);
      render();
    }));
    contentEl.querySelectorAll('[data-unequip]').forEach(b => b.addEventListener('click', () => {
      const active = vehicleStore.state.activeVehicleId;
      if (active) vehicleSystem.equipAttachment(active, null);
      render();
    }));
    contentEl.querySelectorAll('[data-upgrade]').forEach(b => b.addEventListener('click', () => {
      const active = vehicleStore.state.activeVehicleId;
      if (!active) return;
      const r = vehicleSystem.buyUpgrade(active, b.dataset.upgrade);
      if (!r.ok) {
        if (r.reason === 'poor') banner('Nu ai destule monede');
        else if (r.reason === 'max') banner('Nivel maxim atins');
      }
      render();
    }));
    const refuelBtn = contentEl.querySelector('[data-refuel]');
    if (refuelBtn) refuelBtn.addEventListener('click', () => {
      const active = vehicleStore.state.activeVehicleId;
      if (!active) return;
      const r = vehicleSystem.refuel(active);
      if (!r.ok && r.reason === 'poor') banner('Nu ai destule monede');
      render();
    });
    const repairBtn = contentEl.querySelector('[data-repair]');
    if (repairBtn) repairBtn.addEventListener('click', () => {
      const active = vehicleStore.state.activeVehicleId;
      if (!active) return;
      const r = vehicleSystem.repair(active);
      if (!r.ok && r.reason === 'poor') banner('Nu ai destule monede');
      render();
    });
  }

  // React on changes
  playerStore.on((_s, changed) => {
    if (!root.classList.contains('visible')) return;
    if (changed.some(k => ['bagCoins', 'vaultCoins', 'level', 'stats'].includes(k))) render();
  });
  vehicleStore.on((_s, changed) => {
    if (!root.classList.contains('visible')) return;
    if (changed.some(k => ['owned', 'ownedAttachments', 'activeVehicleId', 'instances'].includes(k))) render();
  });

  return { open, close, toggle };
}
