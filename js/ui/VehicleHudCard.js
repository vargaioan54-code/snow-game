// Vehicle HUD Card — vizibil doar cand jucatorul e in vehicul.
// Bare pentru fuel, durability, snowLoad + speed.

import { VEHICLE_BY_ID } from '../config/vehicles.js';

const STYLE = `
#vehicle-hud {
  position: fixed; top: 12px; left: 50%; transform: translateX(-50%);
  background: rgba(15,20,32,0.85); color: #fff; padding: 10px 16px;
  border-radius: 12px; font: 500 13px system-ui, sans-serif; z-index: 15;
  border: 1px solid rgba(255,255,255,0.15); min-width: 280px;
  display: none; box-shadow: 0 6px 20px rgba(0,0,0,0.4);
}
#vehicle-hud.visible { display: block; }
#vehicle-hud .vh-title { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; font-size: 14px; font-weight: 600; }
#vehicle-hud .vh-title .icon { font-size: 18px; }
#vehicle-hud .vh-row { display: grid; grid-template-columns: 60px 1fr 60px; gap: 6px; align-items: center; margin: 3px 0; font-size: 11px; }
#vehicle-hud .vh-label { opacity: 0.75; }
#vehicle-hud .vh-bar { height: 8px; background: rgba(255,255,255,0.12); border-radius: 4px; overflow: hidden; }
#vehicle-hud .vh-fill { height: 100%; transition: width 0.2s, background 0.3s; }
#vehicle-hud .vh-fill.fuel { background: linear-gradient(90deg,#3fd8a0,#4fd8a0); }
#vehicle-hud .vh-fill.fuel.low { background: linear-gradient(90deg,#e83030,#e88030); }
#vehicle-hud .vh-fill.dur { background: linear-gradient(90deg,#3f90ff,#5faaff); }
#vehicle-hud .vh-fill.dur.low { background: linear-gradient(90deg,#e83030,#e88030); }
#vehicle-hud .vh-fill.load { background: linear-gradient(90deg,#ffc043,#ff8020); }
#vehicle-hud .vh-fill.load.full { background: linear-gradient(90deg,#e83030,#e88030); }
#vehicle-hud .vh-value { text-align: right; opacity: 0.9; font-variant-numeric: tabular-nums; }
`;

export function createVehicleHudCard(vehicleStore, vehicleSystem) {
  if (document.getElementById('vehicle-hud-style')) {
    document.getElementById('vehicle-hud-style').remove();
  }
  const s = document.createElement('style');
  s.id = 'vehicle-hud-style';
  s.textContent = STYLE;
  document.head.appendChild(s);

  const root = document.createElement('div');
  root.id = 'vehicle-hud';
  root.innerHTML = `
    <div class="vh-title"><span class="icon" data-el="icon">🚗</span><span data-el="name">Vehicul</span></div>
    <div class="vh-row">
      <div class="vh-label">⛽ Fuel</div>
      <div class="vh-bar"><div class="vh-fill fuel" data-el="fuel-fill"></div></div>
      <div class="vh-value" data-el="fuel-val">100</div>
    </div>
    <div class="vh-row">
      <div class="vh-label">🔧 Dur</div>
      <div class="vh-bar"><div class="vh-fill dur" data-el="dur-fill"></div></div>
      <div class="vh-value" data-el="dur-val">100</div>
    </div>
    <div class="vh-row">
      <div class="vh-label">📦 Sac</div>
      <div class="vh-bar"><div class="vh-fill load" data-el="load-fill"></div></div>
      <div class="vh-value" data-el="load-val">0</div>
    </div>
    <div class="vh-row">
      <div class="vh-label">🏁 Speed</div>
      <div class="vh-bar"><div class="vh-fill fuel" data-el="speed-fill"></div></div>
      <div class="vh-value" data-el="speed-val">0</div>
    </div>
  `;
  document.body.appendChild(root);

  const el = {
    icon: root.querySelector('[data-el="icon"]'),
    name: root.querySelector('[data-el="name"]'),
    fuelFill: root.querySelector('[data-el="fuel-fill"]'),
    fuelVal: root.querySelector('[data-el="fuel-val"]'),
    durFill: root.querySelector('[data-el="dur-fill"]'),
    durVal: root.querySelector('[data-el="dur-val"]'),
    loadFill: root.querySelector('[data-el="load-fill"]'),
    loadVal: root.querySelector('[data-el="load-val"]'),
    speedFill: root.querySelector('[data-el="speed-fill"]'),
    speedVal: root.querySelector('[data-el="speed-val"]')
  };

  let lastUpdate = 0;

  function render() {
    if (!vehicleStore.state.isPlayerInVehicle || !vehicleStore.state.activeVehicleId) {
      root.classList.remove('visible');
      return;
    }
    root.classList.add('visible');
    const id = vehicleStore.state.activeVehicleId;
    const config = VEHICLE_BY_ID[id];
    const inst = vehicleStore.getInstance(id);
    if (!config || !inst) return;

    el.icon.textContent = config.icon;
    el.name.textContent = config.name;

    const fuelPct = (inst.fuel / config.fuelCapacity) * 100;
    el.fuelFill.style.width = fuelPct + '%';
    el.fuelFill.classList.toggle('low', fuelPct < 20);
    el.fuelVal.textContent = Math.round(inst.fuel) + '/' + config.fuelCapacity;

    const durPct = (inst.durability / config.durability) * 100;
    el.durFill.style.width = durPct + '%';
    el.durFill.classList.toggle('low', durPct < 25);
    el.durVal.textContent = Math.round(inst.durability) + '/' + config.durability;

    const capacity = vehicleSystem ? (vehicleStore.getEffectiveStats(id) || { capacity: config.capacity }).capacity : config.capacity;
    const loadPct = (inst.snowLoad / capacity) * 100;
    el.loadFill.style.width = Math.min(100, loadPct) + '%';
    el.loadFill.classList.toggle('full', loadPct >= 95);
    el.loadVal.textContent = Math.round(inst.snowLoad) + '/' + Math.round(capacity);

    // Speed from spawned obj
    if (vehicleSystem) {
      const obj = vehicleSystem.getSpawned(id);
      if (obj) {
        const speedPct = (Math.abs(obj.speed) / config.maxSpeed) * 100;
        el.speedFill.style.width = Math.min(100, speedPct) + '%';
        el.speedVal.textContent = Math.round(Math.abs(obj.speed) * 3.6) + ' km/h';
      }
    }
  }

  function tick(dt) {
    lastUpdate += dt;
    if (lastUpdate >= 0.2) {
      lastUpdate = 0;
      render();
    }
  }

  // React on state
  vehicleStore.on((_s, changed) => {
    if (changed.some(k => ['isPlayerInVehicle', 'activeVehicleId', 'instances'].includes(k))) {
      render();
    }
  });

  render();
  return { render, tick };
}
