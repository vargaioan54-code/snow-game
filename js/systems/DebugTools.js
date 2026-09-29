// Utilitare de debug expuse pe window.__debug DOAR daca:
//   URL are ?debug=1  SAU  localStorage['snow-game:debug'] === '1'.

import { TOOL_STATS, TOOL_BY_ID } from '../config/tools.js';
import { BAG_TIERS } from '../config/bagTiers.js';
import { UPGRADE_STATS } from '../config/toolUpgrades.js';
import { REGIONS, REGION_BY_ID } from '../config/regions.js';
import { LOCATIONS, LOCATION_BY_ID } from '../config/locations.js';
import { AREAS, getAreasByLocation } from '../config/areas.js';

export function isDebugMode() {
  try {
    if (typeof window === 'undefined') return false;
    const url = new URL(window.location.href);
    if (url.searchParams.get('debug') === '1') return true;
    if (localStorage.getItem('snow-game:debug') === '1') return true;
  } catch {}
  return false;
}

export function installDebugTools({ playerStore, economy, saveSystem, transactionLog, environment, character, contractStore, contractSystem, contractsSave, worldStore, worldSystem, worldSave, weatherStore, weatherSystem, weatherSave, timeStore, timeSystem, timeSave, vehicleStore, vehicleSystem, vehicleSave, garageStore, garageSystem, garageSave, garagePanel, companyStore, companySystem, companySave, companyPanel, companyCreationModal, employeeStore, employeeSystem, employeesSave, employeesPanel, fleetStore, fleetSystem, fleetSave, fleetPanel, missionStore, missionSystem, missionSave, missionsPanel, eventBus, eventStore, eventSystem, eventSave, eventsPanel, entitlementStore, entitlementSave, purchaseService, boostSystem, entitlementSystem, storePanel, socialStore, socialService, socialPanel, activityFeedSystem, mockSocialBackend, multiplayerStore, multiplayerService, mockMultiplayerBackend, multiplayerPanel, prestigeStore, prestigeSystem, prestigePanel, prestigeSave, qualitySystem, performanceMonitor, errorRecoverySystem, touchControlSystem, batterySaverSystem, splashScreen, performanceHud, orientationSystem, mobileMenuDrawer }) {
  if (!isDebugMode()) return null;

  const dbg = {
    // Currency
    addCoins(n = 100) {
      const before = playerStore.state.vaultCoins;
      playerStore.set({ vaultCoins: before + n });
      transactionLog.log({ type: 'DEBUG_GRANT', currency: 'coins', amount: n, balanceAfter: playerStore.state.vaultCoins });
      return playerStore.state.vaultCoins;
    },
    addDiamonds(n = 10) {
      playerStore.set({ diamonds: playerStore.state.diamonds + n });
      transactionLog.log({ type: 'DEBUG_GRANT', currency: 'diamonds', amount: n, balanceAfter: playerStore.state.diamonds });
      return playerStore.state.diamonds;
    },
    addXP(n = 100) {
      const before = playerStore.state.xp;
      playerStore.set({ xp: before + n });
      transactionLog.log({ type: 'DEBUG_GRANT', currency: 'xp', amount: n, balanceAfter: playerStore.state.xp });
      return playerStore.state.xp;
    },
    addReputation(n = 10) {
      playerStore.set({ reputation: playerStore.state.reputation + n });
      transactionLog.log({ type: 'DEBUG_GRANT', currency: 'reputation', amount: n, balanceAfter: playerStore.state.reputation });
      return playerStore.state.reputation;
    },

    // Inventory
    unlockTool(id) {
      if (!TOOL_BY_ID[id]) return false;
      if (!playerStore.state.owned.includes(id)) {
        playerStore.set({ owned: [...playerStore.state.owned, id] });
      }
      return true;
    },
    equipTool(id) { return economy.equipTool(id); },
    unlockAll() {
      const ids = TOOL_STATS.map(t => t.id);
      playerStore.set({ owned: [...new Set([...playerStore.state.owned, ...ids])] });
      return playerStore.state.owned;
    },

    // Progression
    setLevel(n) {
      const lvl = Math.max(1, Math.floor(Number(n) || 1));
      playerStore.set({ level: lvl, xp: 0 });
      return playerStore.state.level;
    },

    // Save
    resetProgress() { saveSystem.newGame(); return 'reset ok — reload pentru start curat'; },
    save() { saveSystem.saveNow(); return 'saved'; },
    load() { const s = saveSystem.load(); if (s) playerStore.hydrate(s); return playerStore.state; },

    exportState() { return JSON.stringify(playerStore.serialize(), null, 2); },
    importState(json) {
      try {
        const data = typeof json === 'string' ? JSON.parse(json) : json;
        return playerStore.hydrate(data);
      } catch (e) { console.warn('importState failed', e); return false; }
    },

    // Transactions
    showTransactions() {
      const recent = transactionLog.getRecent(20);
      console.table(recent);
      return recent;
    },

    // === ETAPA 2 EXTENSII ===

    // Vezi tipul zapezii sub player (aproape)
    snowType() {
      if (!environment || !character) return null;
      const p = character.group.position;
      const st = environment.getSnowTypeAt(p.x, p.z);
      return st ? { id: st.id, name: st.name, hardness: st.hardness, rewardMult: st.rewardMult } : null;
    },

    // Reseteaza toata harta la life max (resetArea)
    resetArea() {
      const sf = environment && environment.getMapData ? environment : null;
      if (!sf) return false;
      // apel prin snowField expus indirect: environment nu are direct; caz special: environment expune spawnSnow/resetArea
      if (typeof environment._snowField === 'function') return environment._snowField().resetArea();
      // fallback: cheama prin API-ul get map data + rescriere directa? Complicat. Adaugat mai jos: forcedResetArea:
      return dbg.forceResetArea();
    },

    // Reset direct via manipulare a lifeMap (fallback daca resetArea nu-i expus)
    forceResetArea() {
      if (!environment || !environment.getMapData) return false;
      const md = environment.getMapData();
      const life = md.lifeMap, pos = md.pos, SEG1 = md.SEG + 1;
      // life reset la max life stiut anterior (aproximam cu 1.0 dar ICE_ZONES raman ice)
      // Preferam: sa expunem environment.resetSnow() daca exista
      return 'use environment.spawnSnow / resetSnow API — deocamdata neexpus in environment top-level';
    },

    // Genereaza un patch de un anumit tip (functia e acum expusa in environment top-level)
    spawnSnow(x, z, typeId = 'fresh', r = 3) {
      if (environment && typeof environment.spawnSnow === 'function') {
        return environment.spawnSnow(x, z, typeId, r);
      }
      return null;
    },

    // Reseteaza toata harta la max life (functia acum expusa in environment top-level)
    resetArea() {
      if (environment && typeof environment.resetArea === 'function') {
        environment.resetArea();
        return true;
      }
      return false;
    },

    // Upgrade tool (bypass shop, gratis)
    giveUpgrade(toolId, stat, n = 1) {
      if (!TOOL_BY_ID[toolId]) return false;
      if (!UPGRADE_STATS.includes(stat)) return false;
      for (let i = 0; i < n; i++) {
        if (!playerStore.incUpgrade(toolId, stat)) break;
      }
      return playerStore.state.toolUpgrades[toolId];
    },

    // Jump la un anume bag tier
    setBagCap(lvl) {
      const n = Math.max(0, Math.min(BAG_TIERS.length - 1, Math.floor(lvl)));
      playerStore.set({ bagLevel: n });
      return BAG_TIERS[n].cap;
    },

    // === ETAPA 3 CONTRACT DEBUG ===
    listContracts() {
      if (!contractStore) { console.warn('contractStore lipsa'); return null; }
      const rows = [];
      for (const id in contractStore.state.contracts) {
        const c = contractStore.state.contracts[id];
        rows.push({
          id: c.id, status: c.status, level: c.unlockLevel,
          progress: (c.progress || 0).toFixed(2),
          rating: c.rating || 0,
          rewardCoins: c.baseReward.coins
        });
      }
      console.table(rows);
      return rows;
    },

    acceptContract(id) {
      if (!contractSystem) return null;
      return contractSystem.accept(id);
    },

    startContract(id) {
      if (!contractSystem) return null;
      return contractSystem.start(id);
    },

    completeActive() {
      if (!contractSystem || !contractStore) return null;
      const active = contractStore.getActive();
      if (!active) return { ok: false, reason: 'no_active' };
      // Forteaza progress la target ca sa treaca check-ul
      contractStore.updateContract(active.id, { progress: active.targetPct });
      return contractSystem.complete(active.id);
    },

    failActive(reason = 'debug') {
      if (!contractSystem || !contractStore) return null;
      const active = contractStore.getActive();
      if (!active) return { ok: false, reason: 'no_active' };
      return contractSystem.fail(active.id, reason);
    },

    setContractProgress(pct) {
      if (!contractStore) return null;
      const active = contractStore.getActive();
      if (!active) return { ok: false };
      const p = Math.max(0, Math.min(1, Number(pct) || 0));
      contractStore.updateContract(active.id, { progress: p });
      return { ok: true, progress: p };
    },

    addContract(templateId, overrides) {
      // Nu duplicam — doar resetam contractul existent (id = templateId = runtimeId)
      if (!contractStore) return null;
      const c = contractStore.getContract(templateId);
      if (!c) return { ok: false, reason: 'unknown' };
      contractSystem.reset(templateId);
      if (overrides && typeof overrides === 'object') {
        contractStore.updateContract(templateId, overrides);
      }
      return { ok: true };
    },

    resetContracts() {
      if (!contractStore) return null;
      contractStore.populateFromTemplates();
      return 'contracts reset';
    },

    skipTimer(seconds = 30) {
      if (!contractStore) return null;
      const active = contractStore.getActive();
      if (!active || !active.deadline) return { ok: false };
      contractStore.updateContract(active.id, { deadline: active.deadline - seconds * 1000 });
      return { ok: true, newRemaining: active.deadline - seconds * 1000 - Date.now() };
    },

    giveAllContracts() {
      if (!contractStore) return null;
      for (const id in contractStore.state.contracts) {
        const c = contractStore.state.contracts[id];
        if (c.status === 'locked') {
          contractStore.updateContract(id, { status: 'available' });
        }
      }
      return 'unlocked';
    },

    // === ETAPA 4 — WORLD DEBUG ===
    listRegions() {
      if (!worldStore) return null;
      const rows = REGIONS.map(r => ({
        id: r.id, name: r.name, difficulty: r.difficulty,
        unlockLevel: r.unlockLevel, reqContracts: r.requiredCompletedContracts || 0,
        unlocked: worldStore.isRegionUnlocked(r.id)
      }));
      console.table(rows);
      return rows;
    },
    listLocations(regionId) {
      if (!worldStore) return null;
      const list = regionId ? LOCATIONS.filter(l => l.regionId === regionId) : LOCATIONS;
      const rows = list.map(l => ({
        id: l.id, region: l.regionId, name: l.name,
        unlockLevel: l.unlockLevel, reqContracts: l.requiredCompletedContracts || 0,
        unlocked: worldStore.isLocationUnlocked(l.id),
        spawn: `(${l.spawn.x},${l.spawn.z})`
      }));
      console.table(rows);
      return rows;
    },
    listAreas(locationId) {
      if (!worldStore) return null;
      const list = locationId ? getAreasByLocation(locationId) : AREAS;
      const rows = list.map(a => ({
        id: a.id, location: a.locationId, name: a.name,
        bounds: `(${a.bounds.x},${a.bounds.z},r=${a.bounds.radius})`,
        progress: (worldStore.getAreaProgress(a.id) || 0).toFixed(2),
        completed: worldStore.isAreaCompleted(a.id)
      }));
      console.table(rows);
      return rows;
    },
    unlockRegion(id) {
      if (!worldStore) return null;
      return worldStore.unlockRegion(id);
    },
    unlockLocation(id) {
      if (!worldStore) return null;
      return worldStore.unlockLocation(id);
    },
    unlockAllWorld() {
      if (!worldStore) return null;
      for (const r of REGIONS) worldStore.unlockRegion(r.id);
      for (const l of LOCATIONS) worldStore.unlockLocation(l.id);
      return 'unlocked all';
    },
    teleport(x, z) {
      if (!character || !character.group) return null;
      character.group.position.x = Number(x) || 0;
      character.group.position.z = Number(z) || 0;
      return `teleport to (${x},${z})`;
    },
    teleportTo(locationId) {
      if (!worldSystem) return null;
      return worldSystem.enterLocation(locationId);
    },
    exitLocation() {
      if (!worldSystem) return null;
      return worldSystem.exitLocation();
    },
    resetAreaProgress(areaId) {
      if (!worldStore) return null;
      worldStore.resetAreaProgress(areaId);
      return 'reset';
    },
    resetWorld() {
      if (!worldStore) return null;
      if (worldSave) worldSave.clear();
      worldStore.reset();
      return 'world reset';
    },
    currentLocation() {
      if (!worldStore) return null;
      const id = worldStore.state.currentLocationId;
      return id ? LOCATION_BY_ID[id] : '(free roam)';
    },
    poi() {
      if (!worldSystem) return null;
      const list = worldSystem.getPOIsInMap();
      console.table(list);
      return list;
    },

    // === ETAPA 5 — WEATHER / TIME DEBUG ===
    setWeather(id) {
      if (!weatherSystem) return null;
      return weatherSystem.setWeather(id);
    },
    clearWeather() {
      if (!weatherSystem) return null;
      return weatherSystem.setWeather('clear');
    },
    forceSnow() {
      if (!weatherSystem) return null;
      return weatherSystem.setWeather('heavy_snow');
    },
    forceBlizzard() {
      if (!weatherSystem) return null;
      return weatherSystem.setWeather('blizzard');
    },
    forceFog() {
      if (!weatherSystem) return null;
      return weatherSystem.setWeather('fog');
    },
    setTemperature(n) {
      if (!weatherStore) return null;
      weatherStore.set({ temperature: Number(n) || 0 });
      return weatherStore.state.temperature;
    },
    resetWeather() {
      if (weatherSave) weatherSave.clear();
      if (weatherStore) weatherStore.reset();
      return 'weather reset';
    },
    dumpWeather() { return weatherStore ? weatherStore.serialize() : null; },
    weatherForecast() {
      if (!weatherSystem) return null;
      const f = weatherSystem.getForecast();
      return {
        current: f.current.name,
        elapsedSec: Math.floor(f.timeElapsed),
        remainingSec: Math.floor(f.timeRemaining)
      };
    },
    cycleWeather() {
      if (!weatherSystem) return null;
      const ids = ['clear','light_snow','heavy_snow','wind','blizzard','fog','freezing_rain'];
      let i = 0;
      const iv = setInterval(() => {
        weatherSystem.setWeather(ids[i]);
        console.log('[cycleWeather]', ids[i]);
        i++;
        if (i >= ids.length) clearInterval(iv);
      }, 5000);
      return 'cycling ' + ids.length + ' vremi cate 5s';
    },

    setTime(hour) {
      if (!timeSystem) return null;
      timeSystem.setTime(Number(hour) || 0);
      return timeSystem.getFormattedTime();
    },
    advanceTime(hours) {
      if (!timeSystem) return null;
      timeSystem.advanceHour(Number(hours) || 1);
      return timeSystem.getFormattedTime();
    },
    pauseTime() {
      if (!timeSystem) return null;
      timeSystem.pause();
      return 'time paused';
    },
    resumeTime() {
      if (!timeSystem) return null;
      timeSystem.resume();
      return 'time resumed';
    },
    setTimeScale(n) {
      if (!timeSystem) return null;
      timeSystem.setTimeScale(Number(n) || 60);
      return timeStore.state.timeScale;
    },
    dumpTime() { return timeStore ? timeStore.serialize() : null; },

    // Helpers
    dumpState() { return playerStore.serialize(); },
    dumpContracts() { return contractStore ? contractStore.serialize() : null; },
    dumpWorld() { return worldStore ? worldStore.serialize() : null; },
    tools() { return TOOL_STATS; },

    // ============ ETAPA 6 — Vehicles ============
    giveVehicle(id) {
      if (!vehicleStore) return null;
      const ok = vehicleStore.addOwned(id);
      return ok ? ('owned: ' + id) : ('already owned: ' + id);
    },
    unlockAllVehicles() {
      if (!vehicleStore) return null;
      const { VEHICLE_STATS } = require ? {} : {};
      // Fallback: iterate via config import at file top would need extra import; use vehicleStore approach
      // Import here dynamic-safe: users can chain multiple giveVehicle
      import('../config/vehicles.js').then(({ VEHICLE_STATS }) => {
        for (const v of VEHICLE_STATS) vehicleStore.addOwned(v.id);
        console.log('[dbg] all vehicles owned');
      });
      return 'unlocking...';
    },
    spawnVehicle(id) {
      if (!vehicleSystem) return null;
      return vehicleSystem.spawnVehicle(id);
    },
    teleportVehicle(id, x, z) {
      if (!vehicleSystem) return null;
      const obj = vehicleSystem.getSpawned(id);
      if (!obj) return 'not spawned';
      obj.root.position.set(Number(x) || 0, 0, Number(z) || 0);
      obj.speed = 0;
      return 'teleported';
    },
    enterVehicle(id) {
      if (!vehicleSystem) return null;
      return vehicleSystem.enterVehicle(id);
    },
    exitVehicle() {
      if (!vehicleSystem) return null;
      return vehicleSystem.exitVehicle();
    },
    setFuel(id, n) {
      if (!vehicleStore) return null;
      vehicleStore.updateInstance(id, { fuel: Number(n) || 0 });
      return vehicleStore.getInstance(id);
    },
    setDurability(id, n) {
      if (!vehicleStore) return null;
      vehicleStore.updateInstance(id, { durability: Number(n) || 0 });
      return vehicleStore.getInstance(id);
    },
    refillAll() {
      if (!vehicleStore) return null;
      import('../config/vehicles.js').then(({ VEHICLE_BY_ID }) => {
        for (const id of vehicleStore.state.owned) {
          const config = VEHICLE_BY_ID[id];
          if (!config) continue;
          vehicleStore.updateInstance(id, { fuel: config.fuelCapacity, durability: config.durability, snowLoad: 0 });
        }
        console.log('[dbg] all refilled');
      });
      return 'refilling...';
    },
    equipAttachment(vId, aId) {
      if (!vehicleSystem) return null;
      return vehicleSystem.equipAttachment(vId, aId);
    },
    setVehicleUpgrade(vId, stat, level) {
      if (!vehicleStore) return null;
      const inst = vehicleStore.getInstance(vId);
      if (!inst) return 'no instance';
      const newUp = { ...inst.upgrades, [stat]: Math.max(0, Math.min(5, Number(level) || 0)) };
      vehicleStore.updateInstance(vId, { upgrades: newUp });
      return 'set';
    },
    dumpVehicles() { return vehicleStore ? vehicleStore.serialize() : null; },
    resetVehicles() {
      if (!vehicleStore) return null;
      vehicleSystem && vehicleSystem.despawnAll();
      vehicleStore.reset();
      return 'reset';
    }
  };

  // ====== ETAPA 7 — Garage ======
  dbg.garage = {
    open() {
      if (garagePanel && garagePanel.open) { garagePanel.open(); return 'opened'; }
      if (garageSystem) return garageSystem.openGarage({ force: true });
      return 'no garage system';
    },
    close() {
      if (garagePanel && garagePanel.close) { garagePanel.close(); return 'closed'; }
      if (garageSystem) return garageSystem.closeGarage();
      return null;
    },
    upgrade() {
      if (!garageSystem) return null;
      return garageSystem.upgradeGarage();
    },
    setLevel(n) {
      if (!garageStore) return null;
      const lvl = Math.max(1, Math.min(4, n | 0));
      garageStore.set({ level: lvl });
      return 'level=' + lvl;
    },
    serviceAll() {
      if (!garageSystem) return null;
      return garageSystem.serviceAll();
    },
    status() {
      if (!garageSystem || !vehicleStore) return null;
      const info = garageSystem.getGarageInfo();
      const vehicles = vehicleStore.state.owned.map(id => ({
        id, status: garageSystem.getStatusFor(id),
        fuel: (vehicleStore.getInstance(id) || {}).fuel,
        dur: (vehicleStore.getInstance(id) || {}).durability,
        load: (vehicleStore.getInstance(id) || {}).snowLoad
      }));
      console.table(vehicles);
      return info;
    },
    dump() {
      if (!garageStore) return null;
      return garageStore.serialize();
    },
    reset() {
      if (!garageStore) return null;
      garageStore.reset();
      return 'reset';
    }
  };

  window.__debug = dbg;
  console.log('%c[DEBUG]', 'color: #ffc043; font-weight: bold',
    'window.__debug: addCoins, addDiamonds, addXP, addReputation, unlockTool, equipTool, unlockAll, setLevel, resetProgress, save, load, exportState, importState, showTransactions, snowType, spawnSnow, resetArea, giveUpgrade, setBagCap, ' +
    'listContracts, acceptContract, startContract, completeActive, failActive, setContractProgress, addContract, resetContracts, skipTimer, giveAllContracts, dumpContracts, ' +
    'garage.{open,close,upgrade,setLevel,serviceAll,status,dump,reset}');
  // === Etapa 8 — Company ===
  if (companyStore && companySystem) {
    dbg.company = {
      create(name) { return companySystem.createCompany(name || 'Debug Snow Co'); },
      rename(name) { return companySystem.renameCompany(name); },
      reset() { companyStore.reset(); if (companySave) companySave.clear(); return 'reset'; },
      dump() { console.table({ state: companyStore.state }); return companyStore.state; },
      setLevel(n) { companyStore.set({ level: Math.max(1, Math.min(10, n)) }); return companyStore.state.level; },
      setXP(n) { companyStore.set({ xp: Math.max(0, n) }); return companyStore.state.xp; },
      addXP(n) { return companySystem.grantCompanyXP(n || 100, { src: 'debug' }); },
      addFunds(n) { return companySystem.earnRevenue(n || 1000, { src: 'debug' }); },
      setReputation(n) { if (playerStore) playerStore.set({ reputation: Math.max(0, n) }); return playerStore ? playerStore.state.reputation : null; },
      unlockTier(id) { return companyStore.addTierUnlock(id); },
      unlockAll() {
        ['tier_1','tier_2','tier_3','tier_4','tier_5'].forEach(t => companyStore.addTierUnlock(t));
        return companyStore.state.unlockedTiers;
      },
      setUpgrade(cat, level) { companyStore.setUpgrade(cat, level); return companyStore.state.upgrades[cat]; },
      completeContractSimulation(rating, coins) {
        const fakeContract = {
          id: 'debug_' + Date.now(),
          type: 'house',
          status: 'completed',
          rating: rating || 3,
          finalReward: { coins: coins || 500 },
          baseReward: { coins: coins || 500 },
          massCleared: 100
        };
        return companySystem.applyContractResult(fakeContract);
      },
      open() { if (companyPanel) companyPanel.open(); },
      close() { if (companyPanel) companyPanel.close(); },
      showCreation() { if (companyCreationModal) companyCreationModal.open(); }
    };
  }

  // === Etapa 9 — Employees ===
  if (employeeStore && employeeSystem) {
    dbg.employees = {
      list() { console.table(employeeStore.getAll()); return employeeStore.getAll(); },
      hire(roleId = 'general_worker', name = 'Debug Emp') {
        // Bypass hiring cost + inject direct instance
        const num = employeeStore.state.nextEmployeeNumber || 1;
        const id = 'emp_debug_' + num;
        const inst = employeeStore._defaultInstance({ id, roleId, name });
        employeeStore.addEmployee(inst);
        return id;
      },
      hireCandidate(cid) { return employeeSystem.hire(cid); },
      fire(id) { return employeeSystem.fire(id); },
      fireAll() {
        for (const e of employeeStore.getAll()) {
          if (e.status === 'AVAILABLE') employeeStore.removeEmployee(e.id);
        }
        return employeeStore.count();
      },
      refresh() { return employeeSystem.refreshCandidates(); },
      setLevel(id, n) {
        const e = employeeStore.getById(id);
        if (e) employeeStore.updateEmployee(id, { level: Math.max(1, n | 0) });
        return e?.level;
      },
      addXP(id, n) { return employeeSystem.grantXP(id, n || 100); },
      pay() { return employeeSystem.payWeeklySalaries(); },
      max() { return employeeSystem.getMaxEmployees(); },
      open() { if (employeesPanel) employeesPanel.open(); },
      close() { if (employeesPanel) employeesPanel.close(); },
      reset() { employeeStore.reset(); if (employeesSave) employeesSave.clear(); return 'reset'; }
    };
  }

  // === Etapa 9 — Fleet ===
  if (fleetStore && fleetSystem) {
    dbg.fleet = {
      list() { console.table(Object.values(fleetStore.state.operations)); return fleetStore.state.operations; },
      assign(empId, vehId, atchId) { return fleetSystem.assign(empId, vehId, atchId || null); },
      unassign(empId) { return fleetSystem.unassign(empId); },
      startOp(empId, contractId) { return fleetSystem.createOperation(empId, contractId); },
      completeOp(opId) { return fleetSystem._completeOperation(opId); },
      cancelOp(opId) { return fleetSystem.cancelOperation(opId); },
      stats() { return fleetSystem.getStatistics(); },
      active() { return fleetSystem.getActiveOperations(); },
      open() { if (fleetPanel) fleetPanel.open(); },
      close() { if (fleetPanel) fleetPanel.close(); },
      resumeBoot() { return fleetSystem.resumeOnBoot(); },
      resetAll() {
        fleetStore.reset();
        if (fleetSave) fleetSave.clear();
        return 'reset';
      }
    };
  }

  // ================= ETAPA 10 — MISSIONS =================
  if (missionStore && missionSystem) {
    dbg.missions = {
      list() { return { daily: missionStore.state.daily, weekly: missionStore.state.weekly, permanent: missionStore.state.permanent }; },
      achievements() { return missionStore.state.achievements; },
      progress(cat, id, value) {
        const m = missionStore.state[cat]?.[id];
        if (!m) return 'not_found';
        m.currentValue = Number(value) || 0;
        missionStore.touch([cat]);
        return m;
      },
      complete(cat, id) {
        const m = missionStore.state[cat]?.[id];
        if (!m) return 'not_found';
        const byId = cat === 'daily' ? require : null; // sync fallback
        // Set current to a large value; MissionSystem detects on next event, dar aici marcam direct
        m.status = 'COMPLETED';
        m.completedAt = Date.now();
        missionStore.touch([cat]);
        return 'completed';
      },
      claim(cat, id) { return missionSystem.claim(cat, id); },
      resetDaily() { return missionSystem._rollDaily(); },
      resetWeekly() { return missionSystem._rollWeekly(); },
      simulateNextDay() {
        missionStore.set({ dailyResetAt: Date.now() - 1000 });
        missionSystem.checkTick();
        return 'ok';
      },
      simulateNextWeek() {
        missionStore.set({ weeklyResetAt: Date.now() - 1000 });
        missionSystem.checkTick();
        return 'ok';
      },
      unlockAchievement(id) { return missionSystem._unlockAchievement(id); },
      resetAchievement(id) {
        const a = missionStore.state.achievements[id];
        if (!a) return 'not_found';
        a.currentValue = 0; a.unlocked = false; a.unlockedAt = null; a.claimedAt = null;
        missionStore.touch(['achievements']);
        return 'reset';
      },
      unlockAll() {
        let n = 0;
        for (const id of Object.keys(missionStore.state.achievements)) {
          if (missionSystem._unlockAchievement(id)) n++;
        }
        return 'unlocked ' + n;
      },
      emit(type, payload) {
        if (eventBus && type) eventBus.emit(type, payload || {});
        return 'emitted ' + type;
      },
      open(tab) { if (missionsPanel) missionsPanel.open(tab); },
      close() { if (missionsPanel) missionsPanel.close(); },
      pending() { return missionStore.countCompletedUnclaimed(); },
      resetAll() {
        missionStore.reset();
        if (missionSave) missionSave.clear();
        return 'reset';
      }
    };
  }

  // Etapa 11 — Events + Seasons
  if (eventStore && eventSystem) {
    dbg.events = {
      list() {
        const out = {};
        for (const [id, ev] of Object.entries(eventStore.state.events)) {
          out[id] = { status: ev.status, progress: ev.progress, completed: !!ev.completedAt, claimed: !!ev.claimedAt, expiresAt: ev.expiresAt };
        }
        return out;
      },
      seasons() { return eventStore.state.seasons; },
      progress(eventId, objId, value) {
        const ok = eventSystem.setProgress(eventId, objId, value);
        return ok ? ('set ' + eventId + '.' + objId + '=' + value) : 'invalid';
      },
      completeAll(eventId) {
        return eventSystem.forceCompleteAll(eventId) ? 'completed' : 'invalid';
      },
      claim(eventId) {
        return eventSystem.claimReward(eventId);
      },
      activate(eventId) {
        return eventSystem.forceActivate(eventId) ? 'active' : 'invalid';
      },
      expire(eventId) {
        return eventSystem.forceExpire(eventId) ? 'expired' : 'invalid';
      },
      simulateTime(msOffset) {
        eventSystem.simulateTime(Number(msOffset) || 0);
        return 'simulated -' + msOffset + 'ms';
      },
      simulateNextDay() {
        eventSystem.simulateTime(24 * 3600 * 1000);
        return 'advanced 1 day';
      },
      simulateNextWeek() {
        eventSystem.simulateTime(7 * 24 * 3600 * 1000);
        return 'advanced 1 week';
      },
      resetAll() {
        eventStore.reset();
        if (eventSave) eventSave.clear();
        return 'reset';
      },
      open() { if (eventsPanel) eventsPanel.open(); },
      close() { if (eventsPanel) eventsPanel.close(); },
      installTime() { return new Date(eventStore.state.installTime || 0).toISOString(); }
    };
  }

  // ========== Etapa 12 — Store / Monetization ==========
  if (entitlementStore && purchaseService) {
    dbg.store = {
      open() { if (storePanel) storePanel.open(); },
      close() { if (storePanel) storePanel.close(); },
      list() {
        const products = purchaseService.getProducts();
        console.table(products.map(p => ({
          id: p.id, category: p.category, type: p.type, price: p.priceDisplay,
          owned: p._owned ? '✓' : '',
          count: p._purchaseCount
        })));
        return products.length + ' products';
      },
      entitlements() {
        const s = entitlementStore.state;
        return {
          owned: [...s.owned],
          cosmetics: [...s.ownedCosmetics],
          seasonPasses: s.seasonPasses.map(sp => sp.seasonId),
          activeBoosts: s.activeBoosts.length,
          totalSpent: s.totalSpentUSD,
          totalTx: s.totalTransactions
        };
      },
      async mockBuy(productId) {
        return await purchaseService.purchase(productId);
      },
      grant(productId) {
        return purchaseService.debugGrant(productId);
      },
      grantAll() {
        const results = [];
        for (const p of purchaseService.getProducts()) {
          if (p.type !== 'non_consumable') continue;
          if (p._owned) continue;
          results.push({ id: p.id, res: purchaseService.debugGrant(p.id) });
        }
        return results;
      },
      resetPurchases() {
        entitlementStore.reset();
        if (entitlementSave) entitlementSave.clear();
        return 'reset';
      },
      activateBoost(type, mult, hours) {
        if (!boostSystem) return 'no boostSystem';
        return boostSystem.activate(type, mult, hours, { source: 'debug' });
      },
      clearBoosts() {
        entitlementStore.set({ activeBoosts: [] });
        return 'boosts cleared';
      },
      async restore() {
        return await purchaseService.restorePurchases();
      },
      boosts() {
        return boostSystem ? boostSystem.getActive() : [];
      },
      backend() {
        return purchaseService.getBackendInfo();
      }
    };
  }

  // ========================= dbg.social.* =========================
  if (socialStore && socialService) {
    dbg.social = {
      list() {
        return {
          friends: socialStore.state.friends,
          requests: socialStore.state.friendRequests,
          blocked: socialStore.state.blockedPlayers,
          invites: socialStore.state.invites,
          activityCount: socialStore.state.activityFeed.length,
          unread: socialStore.state.unreadCounts
        };
      },
      dumpProfile() { return socialService.getMyProfile(); },
      feed() { return socialStore.state.activityFeed; },
      mockFriend(name) {
        const pid = 'mock_dbg_' + Date.now();
        socialStore.addFriend(pid, name || 'Test Friend', { level: 5, company: 'Debug Co' });
        return { added: pid };
      },
      mockRequest(name) {
        const pid = 'mock_dbg_' + Date.now();
        const id = socialStore.addRequest(pid, name || 'Test Sender', 'received');
        return { id, playerId: pid };
      },
      mockInvite(type, name) {
        socialStore.addInvite({
          type: type || 'game_invite',
          fromPlayerId: 'mock_dbg_' + Date.now(),
          fromName: name || 'Test Inviter',
          payload: {},
          direction: 'received'
        });
        return true;
      },
      mockActivity(type) {
        if (!activityFeedSystem || typeof activityFeedSystem.addManual !== 'function') return false;
        return activityFeedSystem.addManual(type || 'level_up', { newLevel: 99 });
      },
      clearAll() { socialStore.reset(); return 'social state reset'; },
      setBackend(mode) {
        socialStore.set({ backendStatus: mode });
        return { backendStatus: mode };
      },
      mockOnlineAll() {
        return mockSocialBackend && typeof mockSocialBackend._getMockPlayers === 'function'
          ? mockSocialBackend._getMockPlayers().map(p => ({ ...p, presence: 'online' }))
          : [];
      },
      open(tab) { socialPanel && socialPanel.open(tab); },
      close() { socialPanel && socialPanel.close(); }
    };
  }

  // ========================= dbg.multiplayer.* (Etapa 14) =========================
  if (multiplayerStore && multiplayerService) {
    dbg.multiplayer = {
      list() {
        return {
          session: multiplayerStore.state.currentSession,
          networkStatus: multiplayerStore.state.networkStatus,
          backendStatus: multiplayerStore.state.backendStatus,
          ownRole: multiplayerStore.state.ownRole,
          ownStatus: multiplayerStore.state.ownStatus,
          historyCount: multiplayerStore.state.sessionHistory.length,
          totalPlayed: multiplayerStore.state.totalSessionsPlayed
        };
      },
      async create(opts) { return await multiplayerService.createSession(opts || {}); },
      async join(code) { return await multiplayerService.joinSession(code); },
      async leave() { return await multiplayerService.leaveSession(); },
      async addBot() { return await multiplayerService.addBot(); },
      async addBots(n) {
        const results = [];
        for (let i = 0; i < (n || 3); i++) {
          const r = await multiplayerService.addBot();
          results.push(r);
          if (!r.ok) break;
        }
        return results;
      },
      async ready() { return await multiplayerService.setReady(true); },
      async unready() { return await multiplayerService.setReady(false); },
      async start() { return await multiplayerService.startSession(); },
      async end() { return await multiplayerService.endSession(); },
      reset() {
        multiplayerStore.reset();
        try { window.localStorage.removeItem('snow-game:multiplayer-v1'); } catch {}
        return 'multiplayer state reset';
      },
      dumpBackend() {
        if (!mockMultiplayerBackend) return 'no backend';
        return {
          platform: mockMultiplayerBackend.getPlatform(),
          isMock: mockMultiplayerBackend.isMock,
          currentSession: mockMultiplayerBackend.getCurrentSession?.(),
          availableBots: mockMultiplayerBackend._availableBots?.() || []
        };
      },
      async simulateBotReady(botId) {
        if (!mockMultiplayerBackend) return 'no backend';
        return await mockMultiplayerBackend.setReady(botId, true);
      },
      async simulateBotLeave(botId) {
        if (!mockMultiplayerBackend) return 'no backend';
        return await mockMultiplayerBackend.leaveSession(botId);
      },
      open() { if (multiplayerPanel) multiplayerPanel.open(); },
      close() { if (multiplayerPanel) multiplayerPanel.close(); },
      history() { return multiplayerStore.state.sessionHistory; }
    };
  }


  // ========================= dbg.prestige.* (Etapa 15) =========================
  if (prestigeStore && prestigeSystem) {
    dbg.prestige = {
      list() {
        return {
          currentPrestige: prestigeStore.state.currentPrestige,
          highestPrestige: prestigeStore.state.highestPrestige,
          totalPrestiges: prestigeStore.state.totalPrestiges,
          lastPrestigeAt: prestigeStore.state.lastPrestigeAt,
          extremeContractsCompleted: prestigeStore.state.extremeContractsCompleted,
          endgameContractsAvailable: prestigeStore.state.endgameContractsAvailable,
          milestones: prestigeStore.state.endgameMilestonesCompleted,
          bonuses: prestigeStore.getPermanentBonuses(),
          currentRank: prestigeStore.getCurrentRank(),
          nextRank: prestigeStore.getNextRank(),
          lifetime: prestigeStore.state.lifetime
        };
      },
      history() { return prestigeStore.state.history; },
      setPrestige(n) {
        const v = Math.max(0, Math.min(10, Math.floor(Number(n) || 0)));
        prestigeStore.set({ currentPrestige: v, highestPrestige: Math.max(v, prestigeStore.state.highestPrestige) });
        return 'currentPrestige set to ' + v;
      },
      execute(bypass) {
        return prestigeSystem.executePrestige({ bypassRequirements: !!bypass });
      },
      preview() { return prestigeSystem.getPreview(); },
      requirements() { return prestigeSystem.checkRequirements(); },
      resetProgress() {
        prestigeStore.reset();
        try { window.localStorage.removeItem('snow-game:prestige-v1'); } catch {}
        return 'prestige state reset';
      },
      unlockEndgame() {
        prestigeStore.set({ endgameContractsAvailable: true });
        return 'endgame unlocked';
      },
      completeExtreme(contractId) {
        prestigeSystem.onExtremeContractComplete(contractId || 'endg_airport_emergency');
        return 'extreme completed: ' + (contractId || 'endg_airport_emergency');
      },
      dumpMultipliers() {
        return {
          xp: prestigeSystem.getMultiplier('xp'),
          coin: prestigeSystem.getMultiplier('coin'),
          snow_clear: prestigeSystem.getMultiplier('snow_clear'),
          contract_reward: prestigeSystem.getMultiplier('contract_reward'),
          reputation: prestigeSystem.getMultiplier('reputation'),
          capacity: prestigeSystem.getMultiplier('capacity')
        };
      },
      open() { if (prestigePanel) prestigePanel.open(); },
      close() { if (prestigePanel) prestigePanel.close(); },
      lifetime() { return prestigeStore.state.lifetime; }
    };
  }

  // ========================= dbg.perf.* / dbg.touch.* / dbg.battery.* (Etapa 16) =========================
  if (qualitySystem || performanceMonitor || errorRecoverySystem) {
    dbg.perf = {
      stats() { return performanceMonitor ? performanceMonitor.getStats() : null; },
      setQuality(preset) {
        if (!qualitySystem) return null;
        return qualitySystem.apply(preset, { source: 'manual' });
      },
      autoDetect() { return qualitySystem ? qualitySystem.autoDetect() : null; },
      current() { return qualitySystem ? qualitySystem.getCurrent() : null; },
      simulateLag() {
        // Force degrade callback
        if (qualitySystem) return qualitySystem.onPerformanceDegrade(10, 60);
        return null;
      },
      simulateError(msg) {
        const err = new Error(msg || 'Simulated error from debug tools');
        if (errorRecoverySystem) errorRecoverySystem.show(err, 'debug');
        return 'shown';
      },
      dumpErrors() {
        return errorRecoverySystem ? errorRecoverySystem.getErrors() : [];
      },
      toggleHud() { if (performanceHud) performanceHud.toggle(); return performanceHud ? performanceHud.isVisible() : null; }
    };
  }

  if (touchControlSystem || mobileMenuDrawer) {
    dbg.touch = {
      show() { if (touchControlSystem) touchControlSystem.show(); return 'shown'; },
      hide() { if (touchControlSystem) touchControlSystem.hide(); return 'hidden'; },
      toggle(on) { if (touchControlSystem) touchControlSystem.toggle(on); return touchControlSystem ? touchControlSystem.isVisible() : null; },
      simulate(dx, dy, role) {
        if (!touchControlSystem) return null;
        touchControlSystem._simulate(Number(dx) || 0, Number(dy) || 0, role || 'left');
        return 'emitted';
      },
      openMenu() { if (mobileMenuDrawer) mobileMenuDrawer.open(); return 'opened'; },
      closeMenu() { if (mobileMenuDrawer) mobileMenuDrawer.close(); return 'closed'; }
    };
  }

  if (batterySaverSystem) {
    dbg.battery = {
      status() { return batterySaverSystem.getStatus(); },
      toggleSaver(on) {
        batterySaverSystem.toggle(on);
        return batterySaverSystem.getStatus();
      },
      mock(level, charging) {
        batterySaverSystem._mock(Number(level), !!charging);
        return batterySaverSystem.getStatus();
      }
    };
  }

  if (orientationSystem) {
    dbg.orient = {
      current() { return orientationSystem.getOrientation(); },
      reset() { orientationSystem.reset(); return 'reset'; }
    };
  }

  return dbg;
}
