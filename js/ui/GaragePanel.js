// GaragePanel — hub management pentru vehicule.
// Layout: header + 3-column (picker | overview | tabs). Compact vertical pe mobile.

import { SCREENS } from '../state/GameState.js';
import { VEHICLE_STATS, VEHICLE_BY_ID } from '../config/vehicles.js';
import { ATTACHMENT_STATS, ATTACHMENT_BY_ID } from '../config/attachments.js';
import { VEHICLE_UPGRADE_STATS, VEHICLE_UPGRADE_MAX_LEVEL, vehicleUpgradeCost, upgradeMultiplier } from '../config/vehicleUpgrades.js';
import { GARAGE_STATS, GARAGE_MAX_LEVEL } from '../config/garage.js';

const STYLE = `
#garage-overlay {
  position: fixed; inset: 0; z-index: 45;
  background: rgba(8, 12, 20, 0.85);
  display: none; align-items: stretch; justify-content: center;
  font: 400 13px/1.3 system-ui, sans-serif; color: #fff;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}
#garage-overlay.visible { display: flex; }
#garage-overlay .modal {
  background: linear-gradient(180deg, #1c2434 0%, #141b28 100%);
  border: 1px solid rgba(255,255,255,0.18); border-radius: 14px;
  margin: 20px; max-width: 1180px; max-height: 92vh; width: 100%;
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
}
#garage-overlay .g-hdr {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.04);
}
#garage-overlay .g-title { font-size: 17px; font-weight: 700; letter-spacing: .3px; }
#garage-overlay .g-title small { font-weight: 400; opacity: 0.7; margin-left: 8px; font-size: 12px; }
#garage-overlay .g-close {
  background: rgba(255,255,255,0.1); border: none; color: #fff;
  width: 34px; height: 34px; border-radius: 8px; cursor: pointer;
  font-size: 18px; font-weight: 700;
}
#garage-overlay .g-close:hover { background: rgba(255,255,255,0.2); }

#garage-overlay .g-body {
  display: grid; grid-template-columns: 240px 1fr 340px;
  gap: 12px; padding: 14px; overflow: hidden; flex: 1;
}
#garage-overlay .g-col { overflow-y: auto; padding-right: 4px; }

/* Picker */
#garage-overlay .picker-item {
  display: flex; align-items: center; gap: 8px; padding: 10px 12px;
  background: rgba(255,255,255,0.05); border: 1px solid transparent;
  border-radius: 8px; margin-bottom: 6px; cursor: pointer;
}
#garage-overlay .picker-item:hover { background: rgba(255,255,255,0.09); }
#garage-overlay .picker-item.active { border-color: #ffc043; background: rgba(255,192,67,0.15); }
#garage-overlay .picker-item .p-icon { font-size: 20px; }
#garage-overlay .picker-item .p-name { flex: 1; font-weight: 600; font-size: 12px; }
#garage-overlay .picker-item .p-status { font-size: 10px; padding: 2px 6px; border-radius: 4px; }
#garage-overlay .p-status.READY { background: #2a5f3f; }
#garage-overlay .p-status.LOW_FUEL { background: #7f5a1e; }
#garage-overlay .p-status.NEEDS_REPAIR { background: #7f3131; }
#garage-overlay .p-status.ACTIVE { background: #1f4a7c; }
#garage-overlay .p-status.FULLY_UPGRADED { background: #5b2e78; }
#garage-overlay .p-status.ATTACHMENT_EQUIPPED { background: #2a5f5f; }
#garage-overlay .p-status.LOCKED { background: #333; opacity: 0.6; }
#garage-overlay .picker-empty {
  padding: 20px; text-align: center; opacity: 0.7;
  background: rgba(255,255,255,0.03); border-radius: 8px;
}
#garage-overlay .picker-empty .btn {
  display: inline-block; margin-top: 12px; padding: 8px 14px;
  background: #3fd8ff; color: #001; border-radius: 6px;
  border: none; cursor: pointer; font-weight: 700; font-size: 12px;
}

/* Overview */
#garage-overlay .overview {
  background: rgba(255,255,255,0.04); border-radius: 10px; padding: 16px;
}
#garage-overlay .ov-hdr {
  display: flex; align-items: center; gap: 12px; margin-bottom: 14px;
  padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);
}
#garage-overlay .ov-icon { font-size: 34px; }
#garage-overlay .ov-name { font-size: 18px; font-weight: 700; }
#garage-overlay .ov-cat { font-size: 11px; opacity: 0.7; text-transform: uppercase; }

#garage-overlay .bar {
  margin-bottom: 12px;
}
#garage-overlay .bar-label {
  display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;
}
#garage-overlay .bar-track {
  background: rgba(0,0,0,0.4); border-radius: 5px; height: 12px; overflow: hidden;
}
#garage-overlay .bar-fill {
  height: 100%; border-radius: 5px; transition: width 0.3s ease;
}
#garage-overlay .bar-fill.fuel { background: linear-gradient(90deg, #f4a020, #f4d020); }
#garage-overlay .bar-fill.fuel.low { background: #d84040; }
#garage-overlay .bar-fill.dur { background: linear-gradient(90deg, #3fd85f, #7fff9f); }
#garage-overlay .bar-fill.dur.low { background: #d84040; }
#garage-overlay .bar-fill.load { background: linear-gradient(90deg, #3fd8ff, #7fddff); }

#garage-overlay .ov-attachment {
  padding: 8px 12px; background: rgba(255,255,255,0.06); border-radius: 6px;
  margin: 10px 0; font-size: 12px;
}
#garage-overlay .ov-status {
  display: inline-block; padding: 4px 10px; border-radius: 6px;
  font-size: 11px; font-weight: 700; margin-top: 6px;
}
#garage-overlay .ov-weather {
  margin-top: 10px; padding: 8px 12px; background: rgba(63, 216, 255, 0.08);
  border-left: 3px solid #3fd8ff; border-radius: 4px;
  font-size: 11px; line-height: 1.4;
}
#garage-overlay .ov-actions {
  display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap;
}
#garage-overlay .ov-actions .btn {
  flex: 1; min-width: 90px; padding: 8px; border: none;
  background: #2a3244; color: #fff; border-radius: 6px; cursor: pointer;
  font-weight: 600; font-size: 12px;
}
#garage-overlay .ov-actions .btn:hover { filter: brightness(1.15); }
#garage-overlay .ov-actions .btn:disabled { opacity: 0.4; cursor: default; }
#garage-overlay .ov-actions .btn.primary { background: #3fd8ff; color: #001; }
#garage-overlay .ov-empty { padding: 30px 20px; text-align: center; opacity: 0.7; }

/* Tabs (right col) */
#garage-overlay .tabs-hdr {
  display: flex; gap: 4px; margin-bottom: 10px;
  background: rgba(0,0,0,0.25); padding: 3px; border-radius: 8px;
}
#garage-overlay .tab-btn {
  flex: 1; padding: 7px 4px; background: transparent; border: none;
  color: #fff; opacity: 0.65; cursor: pointer; font-weight: 600;
  font-size: 11px; border-radius: 6px;
}
#garage-overlay .tab-btn.active { background: rgba(255,255,255,0.12); opacity: 1; }
#garage-overlay .tab-body { padding: 8px 4px; }
#garage-overlay .stat-row {
  display: flex; justify-content: space-between; padding: 6px 8px;
  border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 12px;
}
#garage-overlay .stat-row .k { opacity: 0.75; }
#garage-overlay .stat-row .v { font-weight: 700; }
#garage-overlay .upg-item {
  padding: 10px; background: rgba(255,255,255,0.05); border-radius: 6px;
  margin-bottom: 6px;
}
#garage-overlay .upg-name { font-weight: 700; font-size: 12px; margin-bottom: 4px; }
#garage-overlay .upg-stars {
  color: #ffc043; font-size: 14px; letter-spacing: 2px; margin-bottom: 4px;
}
#garage-overlay .upg-info { font-size: 11px; opacity: 0.85; margin-bottom: 6px; }
#garage-overlay .upg-btn {
  width: 100%; padding: 6px; background: #3fd8ff; color: #001;
  border: none; border-radius: 4px; cursor: pointer; font-weight: 700; font-size: 11px;
}
#garage-overlay .upg-btn:disabled { background: #444; color: #888; cursor: default; }
#garage-overlay .att-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
}
#garage-overlay .att-item {
  padding: 8px; background: rgba(255,255,255,0.05); border-radius: 6px;
  border: 1px solid transparent; cursor: pointer;
}
#garage-overlay .att-item.equipped { border-color: #ffc043; background: rgba(255,192,67,0.12); }
#garage-overlay .att-item.locked { opacity: 0.5; cursor: default; }
#garage-overlay .att-item.incompatible { opacity: 0.5; cursor: default; }
#garage-overlay .att-name { font-weight: 700; font-size: 11px; margin-bottom: 2px; }
#garage-overlay .att-info { font-size: 10px; opacity: 0.7; }
#garage-overlay .maint-block {
  padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px;
  margin-bottom: 10px;
}
#garage-overlay .maint-block h4 { margin: 0 0 8px; font-size: 13px; }
#garage-overlay .maint-btn {
  width: 100%; padding: 8px; background: #3fd8ff; color: #001;
  border: none; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 12px;
  margin-top: 6px;
}
#garage-overlay .maint-btn.warn { background: #f4a020; }
#garage-overlay .maint-btn.danger { background: #d84040; color: #fff; }
#garage-overlay .maint-btn:disabled { opacity: 0.4; cursor: default; }

#garage-overlay .contract-info {
  padding: 10px; margin-bottom: 10px;
  background: rgba(255, 192, 67, 0.12); border-left: 3px solid #ffc043;
  border-radius: 4px; font-size: 11px;
}

#garage-overlay .garage-upg {
  margin-top: 12px; padding: 10px; background: rgba(255,255,255,0.04);
  border-radius: 6px; text-align: center;
}
#garage-overlay .garage-upg .cost { font-weight: 700; color: #ffc043; margin: 4px 0; }

/* Mobile stacked layout */
@media (max-width: 900px), (max-height: 600px) {
  #garage-overlay .g-body {
    grid-template-columns: 1fr; overflow-y: auto;
  }
  #garage-overlay .g-col { max-height: none; overflow-y: visible; padding-right: 0; }
}

/* Trigger button (near garage) */
#garage-hud-trigger {
  position: fixed; left: 50%; bottom: 20%; transform: translateX(-50%);
  z-index: 15; padding: 12px 20px; background: #ffc043; color: #221;
  border: none; border-radius: 22px; font: 700 14px system-ui, sans-serif;
  box-shadow: 0 4px 15px rgba(255, 192, 67, 0.4);
  cursor: pointer; display: none;
}
#garage-hud-trigger.visible { display: block; }
`;

export function createGaragePanel(deps) {
  const {
    garageStore, garageSystem,
    vehicleStore, vehicleSystem,
    playerStore, economy, weatherSystem,
    contractStore, gameState, vehicleShopPanel,
    showBanner
  } = deps;

  const banner = (t) => (showBanner ? showBanner(t) : console.log('[banner]', t));

  let root = null;
  let currentTab = 'details';
  let contextVehicleId = null; // vehiculul selectat in picker (poate diferi de active)

  function injectStyle() {
    if (document.getElementById('garage-style')) return;
    const s = document.createElement('style');
    s.id = 'garage-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function ensureRoot() {
    if (root) return root;
    injectStyle();
    root = document.createElement('div');
    root.id = 'garage-overlay';
    root.addEventListener('click', (e) => {
      if (e.target === root) close();
    });
    document.body.appendChild(root);
    return root;
  }

  function ensureHudTrigger() {
    let btn = document.getElementById('garage-hud-trigger');
    if (btn) return btn;
    injectStyle();
    btn = document.createElement('button');
    btn.id = 'garage-hud-trigger';
    btn.textContent = '🏭 Intră în Garaj';
    btn.addEventListener('click', open);
    document.body.appendChild(btn);
    return btn;
  }

  function setHudTriggerVisible(visible) {
    const btn = ensureHudTrigger();
    btn.classList.toggle('visible', !!visible);
  }

  function open() {
    ensureRoot();
    contextVehicleId = vehicleStore.state.activeVehicleId || (vehicleStore.state.owned[0] || null);
    currentTab = 'details';
    garageSystem.openGarage({ force: true });
    render();
    root.classList.add('visible');
    setHudTriggerVisible(false);
  }

  function close() {
    if (root) root.classList.remove('visible');
    garageSystem.closeGarage();
  }

  function toggle() {
    if (root && root.classList.contains('visible')) close(); else open();
  }

  function selectVehicle(id) {
    if (!vehicleStore.isOwned(id)) return;
    contextVehicleId = id;
    vehicleStore.set({ activeVehicleId: id });
    // Verifica attachment compat (auto-unequip daca nu-i compat)
    const inst = vehicleStore.getInstance(id);
    const config = VEHICLE_BY_ID[id];
    if (inst && inst.equippedAttachmentId && !config.compatibleAttachments.includes(inst.equippedAttachmentId)) {
      vehicleStore.updateInstance(id, { equippedAttachmentId: null });
      banner('Atașament incompatibil dezechipat automat');
    }
    // Spawn if not yet
    if (!vehicleSystem.getSpawned(id)) {
      vehicleSystem.spawnVehicle(id);
    }
    render();
  }

  function renderPicker() {
    const owned = vehicleStore.state.owned;
    if (!owned.length) {
      return `
        <div class="picker-empty">
          <div>Nu deții niciun vehicul.</div>
          <button class="btn" data-a="open-shop">🚗 SHOP</button>
        </div>`;
    }
    return owned.map(id => {
      const config = VEHICLE_BY_ID[id];
      if (!config) return '';
      const status = garageSystem.getStatusFor(id);
      const active = id === contextVehicleId ? 'active' : '';
      return `
        <div class="picker-item ${active}" data-vid="${id}">
          <span class="p-icon">${config.icon || '🚗'}</span>
          <span class="p-name">${config.name}</span>
          <span class="p-status ${status}">${_statusLabel(status)}</span>
        </div>`;
    }).join('');
  }

  function _statusLabel(s) {
    switch (s) {
      case 'READY': return 'OK';
      case 'LOW_FUEL': return '⛽!';
      case 'NEEDS_REPAIR': return '🔧!';
      case 'ACTIVE': return 'ACTIV';
      case 'FULLY_UPGRADED': return 'MAX';
      case 'ATTACHMENT_EQUIPPED': return 'EQP';
      case 'LOCKED': return 'LOCKED';
      default: return s;
    }
  }

  function renderOverview() {
    if (!contextVehicleId || !vehicleStore.isOwned(contextVehicleId)) {
      return `<div class="ov-empty">Selectează un vehicul din stânga.</div>`;
    }
    const config = VEHICLE_BY_ID[contextVehicleId];
    const inst = vehicleStore.getInstance(contextVehicleId);
    if (!config || !inst) return `<div class="ov-empty">Vehicul invalid.</div>`;
    const eff = vehicleStore.getEffectiveStats(contextVehicleId, null);
    const attId = inst.equippedAttachmentId;
    const att = attId ? ATTACHMENT_BY_ID[attId] : null;
    const status = garageSystem.getStatusFor(contextVehicleId);
    const fuelPct = (inst.fuel / config.fuelCapacity) * 100;
    const durPct = (inst.durability / config.durability) * 100;
    const loadPct = (inst.snowLoad / (eff.capacity || 1)) * 100;
    const fuelLow = fuelPct < 20 ? 'low' : '';
    const durLow = durPct < 30 ? 'low' : '';

    // Weather effect indicator
    let weatherHtml = '';
    if (weatherSystem) {
      const wp = weatherSystem.getInterpolatedParams();
      const fuelMult = 1 + ((1 - (wp.visibility || 1)) * 0.5);
      const durMult = wp.hardnessModifier || 1;
      if (fuelMult > 1.05 || durMult > 1.05) {
        weatherHtml = `<div class="ov-weather">Weather curent: Fuel ×${fuelMult.toFixed(2)} · Uzură ×${durMult.toFixed(2)}</div>`;
      }
    }

    // Contract preferat?
    let contractHtml = '';
    if (contractStore) {
      const active = contractStore.getActive && contractStore.getActive();
      if (active && active.preferredVehicle) {
        const isPref = active.preferredVehicle === contextVehicleId;
        contractHtml = `<div class="contract-info">
          Contract activ: <b>${active.title || active.templateId}</b>
          ${isPref ? '<br>⭐ <b>Vehicul recomandat!</b> Bonus +30% la reward.' : `<br>Recomandat: <i>${active.preferredVehicle}</i>`}
        </div>`;
      }
    }

    const canRefuel = garageSystem.canAffordRefuel(contextVehicleId);
    const canRepair = garageSystem.canAffordRepair(contextVehicleId);
    const isFullFuel = inst.fuel >= config.fuelCapacity;
    const isFullDur = inst.durability >= config.durability;

    return `
      ${contractHtml}
      <div class="ov-hdr">
        <span class="ov-icon">${config.icon || '🚗'}</span>
        <div>
          <div class="ov-name">${config.name}</div>
          <div class="ov-cat">${config.category}</div>
        </div>
      </div>
      <div class="bar">
        <div class="bar-label"><span>⛽ Combustibil</span><span>${Math.round(inst.fuel)}/${config.fuelCapacity}</span></div>
        <div class="bar-track"><div class="bar-fill fuel ${fuelLow}" style="width:${fuelPct}%"></div></div>
      </div>
      <div class="bar">
        <div class="bar-label"><span>🔧 Durabilitate</span><span>${Math.round(inst.durability)}/${config.durability}</span></div>
        <div class="bar-track"><div class="bar-fill dur ${durLow}" style="width:${durPct}%"></div></div>
      </div>
      <div class="bar">
        <div class="bar-label"><span>❄️ Încărcătură</span><span>${Math.round(inst.snowLoad)}/${Math.round(eff.capacity)}</span></div>
        <div class="bar-track"><div class="bar-fill load" style="width:${loadPct}%"></div></div>
      </div>
      <div class="ov-attachment">
        Atașament: <b>${att ? att.name : 'Fără atașament'}</b>
      </div>
      <div>Status: <span class="ov-status p-status ${status}">${_statusLabel(status)}</span></div>
      ${weatherHtml}
      <div class="ov-actions">
        <button class="btn" data-a="refuel" ${(!canRefuel || isFullFuel) ? 'disabled' : ''}>
          ⛽ Refuel (${isFullFuel ? 'plin' : garageSystem.refuelCost(contextVehicleId) + '💰'})
        </button>
        <button class="btn" data-a="repair" ${(!canRepair || isFullDur) ? 'disabled' : ''}>
          🔧 Reparație (${isFullDur ? 'perfect' : garageSystem.repairCost(contextVehicleId) + '💰'})
        </button>
        <button class="btn primary" data-a="test-drive">Test drive</button>
      </div>`;
  }

  function renderTabs() {
    return `
      <div class="tabs-hdr">
        <button class="tab-btn ${currentTab==='details'?'active':''}" data-tab="details">Detalii</button>
        <button class="tab-btn ${currentTab==='upgrades'?'active':''}" data-tab="upgrades">Upgrade</button>
        <button class="tab-btn ${currentTab==='attachments'?'active':''}" data-tab="attachments">Atașament</button>
        <button class="tab-btn ${currentTab==='maintenance'?'active':''}" data-tab="maintenance">Service</button>
      </div>
      <div class="tab-body">${_renderTabBody()}</div>
      ${_renderGarageUpgrade()}
    `;
  }

  function _renderTabBody() {
    switch (currentTab) {
      case 'details': return _renderDetailsTab();
      case 'upgrades': return _renderUpgradesTab();
      case 'attachments': return _renderAttachmentsTab();
      case 'maintenance': return _renderMaintenanceTab();
      default: return '';
    }
  }

  function _renderDetailsTab() {
    if (!contextVehicleId) return '<div class="ov-empty">-</div>';
    const config = VEHICLE_BY_ID[contextVehicleId];
    const inst = vehicleStore.getInstance(contextVehicleId);
    const eff = vehicleStore.getEffectiveStats(contextVehicleId, null);
    if (!config || !eff) return '';
    const row = (k, base, final, unit = '') => {
      const same = Math.abs(base - final) < 0.01;
      const dv = same ? `${base.toFixed(1)}${unit}` : `${base.toFixed(1)} → <b>${final.toFixed(1)}${unit}</b>`;
      return `<div class="stat-row"><span class="k">${k}</span><span class="v">${dv}</span></div>`;
    };
    return `
      ${row('Viteza max', config.maxSpeed, eff.maxSpeed, ' m/s')}
      ${row('Accelerație', config.acceleration, eff.acceleration)}
      ${row('Frânare', config.brakeForce, eff.brakeForce)}
      ${row('Rotire', config.turnRate, eff.turnRate)}
      ${row('Curățare putere', config.clearPower, eff.clearPower)}
      ${row('Curățare lățime', config.clearWidth, eff.clearWidth, 'm')}
      ${row('Capacitate', config.capacity, eff.capacity)}
      ${row('Consum combustibil', config.fuelConsumption, eff.fuelConsumption)}
      ${row('Uzură', config.durabilityWear, eff.durabilityWear)}
      <div class="stat-row"><span class="k">Categorie</span><span class="v">${config.category}</span></div>
    `;
  }

  function _renderUpgradesTab() {
    if (!contextVehicleId) return '<div class="ov-empty">-</div>';
    const config = VEHICLE_BY_ID[contextVehicleId];
    const inst = vehicleStore.getInstance(contextVehicleId);
    if (!config || !inst) return '';
    return VEHICLE_UPGRADE_STATS.map(stat => {
      const curr = inst.upgrades[stat] || 0;
      const isMax = curr >= VEHICLE_UPGRADE_MAX_LEVEL;
      const cost = vehicleUpgradeCost(config.price, curr);
      const stars = '★'.repeat(curr) + '☆'.repeat(VEHICLE_UPGRADE_MAX_LEVEL - curr);
      const currMult = upgradeMultiplier(curr);
      const nextMult = upgradeMultiplier(curr + 1);
      const canAfford = playerStore.totalCoins >= cost;
      return `
        <div class="upg-item">
          <div class="upg-name">${_upgradeLabel(stat)}</div>
          <div class="upg-stars">${stars}</div>
          <div class="upg-info">
            ${isMax
              ? `Nivel maxim atins`
              : `Nivel ${curr}/${VEHICLE_UPGRADE_MAX_LEVEL} · ×${currMult.toFixed(2)} → <b>×${nextMult.toFixed(2)}</b><br>Cost: <b>${cost}💰</b>`
            }
          </div>
          <button class="upg-btn" data-upg="${stat}" ${(isMax || !canAfford) ? 'disabled' : ''}>
            ${isMax ? 'MAX' : (canAfford ? 'UPGRADE' : 'Fonduri insuficiente')}
          </button>
        </div>`;
    }).join('');
  }

  function _upgradeLabel(stat) {
    switch (stat) {
      case 'power': return '⚡ Putere Motor';
      case 'speed': return '💨 Viteză Max';
      case 'capacity': return '📦 Capacitate';
      case 'fuel_efficiency': return '⛽ Eficiență Combustibil';
      case 'durability': return '🔧 Durabilitate';
      default: return stat;
    }
  }

  function _renderAttachmentsTab() {
    if (!contextVehicleId) return '<div class="ov-empty">-</div>';
    const config = VEHICLE_BY_ID[contextVehicleId];
    const inst = vehicleStore.getInstance(contextVehicleId);
    const equipped = inst && inst.equippedAttachmentId;
    return `<div class="att-grid">
      ${ATTACHMENT_STATS.map(a => {
        const owned = vehicleStore.isAttachmentOwned(a.id);
        const compat = config.compatibleAttachments.includes(a.id);
        const isEquipped = equipped === a.id;
        let cls = 'att-item';
        let action = '';
        if (isEquipped) { cls += ' equipped'; action = 'unequip'; }
        else if (!owned) { cls += ' locked'; action = 'buy'; }
        else if (!compat) { cls += ' incompatible'; action = 'none'; }
        else { action = 'equip'; }
        const info = isEquipped ? 'ECHIPAT' :
                     !owned ? `Nu deții (${a.price}💰)` :
                     !compat ? `Necesită: ${a.compatibleWith || 'alt vehicul'}` :
                     'CLICK pt echip';
        return `
          <div class="${cls}" data-att="${a.id}" data-att-action="${action}">
            <div class="att-name">${a.name}</div>
            <div class="att-info">L${a.width}m · P${a.powerMult.toFixed(1)}${a.capacityBonus ? ' · +' + a.capacityBonus + ' cap' : ''}</div>
            <div class="att-info">${info}</div>
          </div>`;
      }).join('')}
    </div>`;
  }

  function _renderMaintenanceTab() {
    if (!contextVehicleId) return '<div class="ov-empty">Selectează un vehicul</div>';
    const totalRefuel = vehicleStore.state.owned.reduce((sum, id) => sum + garageSystem.refuelCost(id), 0);
    const totalRepair = vehicleStore.state.owned.reduce((sum, id) => sum + garageSystem.repairCost(id), 0);
    const totalCost = totalRefuel + totalRepair;
    return `
      <div class="maint-block">
        <h4>⛽ Realimentare rapidă</h4>
        <div style="font-size:11px;opacity:0.85">Umple complet rezervorul vehiculului curent.</div>
        <button class="maint-btn" data-a="refuel-current">Refuel (${garageSystem.refuelCost(contextVehicleId)}💰)</button>
      </div>
      <div class="maint-block">
        <h4>🔧 Reparație rapidă</h4>
        <div style="font-size:11px;opacity:0.85">Repară complet durabilitatea vehiculului curent.</div>
        <button class="maint-btn warn" data-a="repair-current">Reparație (${garageSystem.repairCost(contextVehicleId)}💰)</button>
      </div>
      <div class="maint-block">
        <h4>💼 Service complet</h4>
        <div style="font-size:11px;opacity:0.85">Refuel + reparație pentru <b>toate</b> vehiculele deținute.</div>
        <button class="maint-btn" data-a="service-all" ${totalCost <= 0 ? 'disabled' : ''}>
          Service TOATE (${totalCost}💰)
        </button>
      </div>`;
  }

  function _renderGarageUpgrade() {
    const info = garageSystem.getGarageInfo();
    if (info.level >= info.maxLevel) {
      return `<div class="garage-upg"><b>Garaj: Nivel MAX</b></div>`;
    }
    const cost = info.nextCost;
    const canAfford = playerStore.totalCoins >= cost;
    const nextCap = GARAGE_STATS.levels[info.level].capacity;
    return `
      <div class="garage-upg">
        <div><b>Garaj Nivel ${info.level}/${info.maxLevel}</b> · Capacitate ${info.capacity}</div>
        <div class="cost">Upgrade → Nivel ${info.level + 1}: ${cost}💰 (cap ${nextCap})</div>
        <button class="maint-btn" data-a="garage-upgrade" ${!canAfford ? 'disabled' : ''}>
          ${canAfford ? 'UPGRADE GARAJ' : 'Fonduri insuficiente'}
        </button>
      </div>`;
  }

  function render() {
    if (!root) ensureRoot();
    const info = garageSystem.getGarageInfo();
    const cap = info.capacity;
    const ownedCount = vehicleStore.state.owned.length;
    root.innerHTML = `
      <div class="modal">
        <div class="g-hdr">
          <div class="g-title">🏭 ${GARAGE_STATS.name} <small>Nivel ${info.level} · ${Math.min(ownedCount, cap)}/${cap} sloturi</small></div>
          <button class="g-close" data-a="close">✕</button>
        </div>
        <div class="g-body">
          <div class="g-col picker">${renderPicker()}</div>
          <div class="g-col overview">${renderOverview()}</div>
          <div class="g-col tabs">${renderTabs()}</div>
        </div>
      </div>`;
    _attachHandlers();
  }

  function _attachHandlers() {
    root.querySelector('.g-close').addEventListener('click', close);
    // Picker
    root.querySelectorAll('.picker-item[data-vid]').forEach(el => {
      el.addEventListener('click', () => selectVehicle(el.dataset.vid));
    });
    // Empty state -> open shop
    const openShop = root.querySelector('[data-a="open-shop"]');
    if (openShop) openShop.addEventListener('click', () => {
      close();
      if (vehicleShopPanel && vehicleShopPanel.open) vehicleShopPanel.open();
    });
    // Tabs
    root.querySelectorAll('.tab-btn').forEach(b => {
      b.addEventListener('click', () => {
        currentTab = b.dataset.tab;
        render();
      });
    });
    // Overview actions
    root.querySelectorAll('.ov-actions .btn').forEach(b => {
      b.addEventListener('click', () => _handleAction(b.dataset.a));
    });
    // Upgrade buttons
    root.querySelectorAll('.upg-btn[data-upg]').forEach(b => {
      b.addEventListener('click', () => _doUpgrade(b.dataset.upg));
    });
    // Attachment items
    root.querySelectorAll('.att-item[data-att]').forEach(el => {
      el.addEventListener('click', () => _handleAttachment(el.dataset.att, el.dataset.attAction));
    });
    // Maintenance buttons
    root.querySelectorAll('.maint-btn[data-a]').forEach(b => {
      b.addEventListener('click', () => _handleAction(b.dataset.a));
    });
  }

  function _handleAction(action) {
    if (!contextVehicleId && action !== 'garage-upgrade' && action !== 'service-all') return;
    switch (action) {
      case 'refuel':
      case 'refuel-current': {
        const r = vehicleSystem.refuel(contextVehicleId);
        if (!r.ok) banner(r.reason === 'poor' ? 'Fonduri insuficiente' : 'Eroare refuel');
        render();
        break;
      }
      case 'repair':
      case 'repair-current': {
        const r = vehicleSystem.repair(contextVehicleId);
        if (!r.ok) banner(r.reason === 'poor' ? 'Fonduri insuficiente' : 'Eroare reparație');
        render();
        break;
      }
      case 'test-drive': {
        close();
        // Ensure spawned then try enter
        if (!vehicleSystem.getSpawned(contextVehicleId)) vehicleSystem.spawnVehicle(contextVehicleId);
        setTimeout(() => {
          const res = vehicleSystem.enterVehicle(contextVehicleId);
          if (!res.ok && res.reason === 'too_far') {
            banner('Apropie-te de vehicul pentru test drive');
          }
        }, 200);
        break;
      }
      case 'service-all': {
        garageSystem.serviceAll();
        render();
        break;
      }
      case 'garage-upgrade': {
        const r = garageSystem.upgradeGarage();
        if (!r.ok) banner(r.reason === 'poor' ? 'Fonduri insuficiente' : 'Nivel maxim');
        render();
        break;
      }
    }
  }

  function _doUpgrade(stat) {
    if (!contextVehicleId) return;
    const r = vehicleSystem.buyUpgrade(contextVehicleId, stat);
    if (!r.ok) banner(r.reason === 'poor' ? 'Fonduri insuficiente' : (r.reason === 'max' ? 'Nivel maxim' : 'Eroare upgrade'));
    render();
  }

  function _handleAttachment(attId, action) {
    if (!contextVehicleId) return;
    if (action === 'equip') {
      const r = vehicleSystem.equipAttachment(contextVehicleId, attId);
      if (!r.ok) banner('Nu se poate echipa (' + r.reason + ')');
      render();
    } else if (action === 'unequip') {
      vehicleSystem.equipAttachment(contextVehicleId, null);
      render();
    } else if (action === 'buy') {
      close();
      if (vehicleShopPanel && vehicleShopPanel.open) vehicleShopPanel.open();
    }
    // 'none' or incompatible = do nothing
  }

  // Reactive re-render on any relevant change while open
  if (vehicleStore && vehicleStore.on) {
    vehicleStore.on((_s, changed) => {
      if (!root || !root.classList.contains('visible')) return;
      if (changed.some(k => ['owned', 'activeVehicleId', 'instances', 'ownedAttachments'].includes(k))) {
        render();
      }
    });
  }
  if (playerStore && playerStore.on) {
    playerStore.on((_s, changed) => {
      if (!root || !root.classList.contains('visible')) return;
      if (changed.some(k => ['bagCoins', 'vaultCoins'].includes(k))) {
        render();
      }
    });
  }
  if (garageStore && garageStore.on) {
    garageStore.on((_s, changed) => {
      if (!root || !root.classList.contains('visible')) return;
      if (changed.includes('level')) render();
    });
  }

  return { open, close, toggle, render, setHudTriggerVisible, isOpen: () => !!(root && root.classList.contains('visible')) };
}
