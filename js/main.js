import * as THREE from 'three';
import { buildEnvironment } from './environment.js?v=10';
import { buildCharacter } from './character.js?v=6';
import { createSnowfall } from './snowfall.js?v=10';
import { createControls } from './controls.js?v=6';
import { createToolEffects } from './effects.js?v=6';

// === Fundatia Etapa 1 + 2 ===
import { TOOL_STATS, TOOL_BY_ID } from './config/tools.js?v=3';
import { BAG_TIERS } from './config/bagTiers.js?v=1';
import { SHOP_POSITIONS, CABIN_POSITION, SHOP_TRIGGER_R2, CABIN_TRIGGER_R2 } from './config/world.js?v=1';
import { UPGRADE_STATS, UPGRADE_MAX_LEVEL, upgradeCost } from './config/toolUpgrades.js?v=1';
import { createPlayerStore } from './state/PlayerStore.js?v=3';
import { createSettingsStore } from './state/SettingsStore.js?v=25';
import { createGameState, SCREENS } from './state/GameState.js?v=13';
import { createEconomy } from './systems/Economy.js?v=3';
import { createSaveSystem } from './systems/SaveSystem.js?v=3';
import { createTransactionLog } from './systems/TransactionLog.js?v=25';
import { createUnlockSystem } from './systems/UnlockSystem.js?v=13';
import { installDebugTools, isDebugMode } from './systems/DebugTools.js?v=25';
import { createAudioSystem } from './systems/AudioSystem.js?v=28';
import { createHapticsSystem } from './systems/HapticsSystem.js?v=25';
import { createHudBinding } from './ui/HudBinding.js?v=4';
import { createSettingsPanel } from './ui/SettingsPanel.js?v=25';
import { createPauseOverlay } from './ui/PauseOverlay.js?v=1';

// === ETAPA 3 — Contracts ===
import { createContractStore } from './state/ContractStore.js?v=13';
import { createContractSystem } from './systems/ContractSystem.js?v=13';
import { createContractPanel } from './ui/ContractPanel.js?v=2';
import { createContractResults } from './ui/ContractResults.js?v=1';
import { createContractHudCard } from './ui/ContractHudCard.js?v=1';
import { CONTRACT_STATUS } from './config/contractStatus.js?v=1';

// === ETAPA 4 — World / Maps ===
import { REGIONS } from './config/regions.js?v=1';
import { LOCATIONS, LOCATION_BY_ID } from './config/locations.js?v=1';
import { AREAS } from './config/areas.js?v=1';
import { createWorldStore } from './state/WorldStore.js?v=1';
import { createWorldSystem } from './systems/WorldSystem.js?v=13';
import { createWorldMapPanel } from './ui/WorldMapPanel.js?v=1';

// === ETAPA 5 — Weather + Day/Night ===
import { createWeatherStore } from './state/WeatherStore.js?v=10';
import { createTimeStore } from './state/TimeStore.js?v=10';
import { createWeatherSystem } from './systems/WeatherSystem.js?v=10';
import { createTimeSystem } from './systems/TimeSystem.js?v=10';
import { createLightingSystem } from './systems/LightingSystem.js?v=10';
import { createWeatherFxSystem } from './systems/WeatherFxSystem.js?v=10';
import { createWeatherHudCard } from './ui/WeatherHudCard.js?v=10';

// === ETAPA 6 — Vehicles ===
import { VEHICLE_STATS, VEHICLE_BY_ID } from './config/vehicles.js?v=11';
import { ATTACHMENT_STATS, ATTACHMENT_BY_ID } from './config/attachments.js?v=11';
import { createVehicleStore } from './state/VehicleStore.js?v=11';
import { createVehicleSystem } from './systems/VehicleSystem.js?v=11';
import { createVehicleShopPanel } from './ui/VehicleShopPanel.js?v=11';
import { createVehicleHudCard } from './ui/VehicleHudCard.js?v=11';

// === ETAPA 7 — Garage + Equipment ===
import { GARAGE_STATS } from './config/garage.js?v=12';
import { createGarageStore } from './state/GarageStore.js?v=12';

// ========================= ETAPA 8 =========================
import { COMPANY_LEVELS, CONTRACT_TIERS, TIER_BY_ID } from './config/company.js?v=13';
import { createCompanyStore } from './state/CompanyStore.js?v=13';
import { createCompanySystem } from './systems/CompanySystem.js?v=13';
import { createCompanyCreationModal } from './ui/CompanyCreationModal.js?v=13';
import { createCompanyPanel } from './ui/CompanyPanel.js?v=13';
// Etapa 9 — Employees + Fleet
import { createEmployeeStore } from './state/EmployeeStore.js?v=14';
import { createFleetStore } from './state/FleetStore.js?v=14';
import { createEmployeeSystem } from './systems/EmployeeSystem.js?v=14';
import { createFleetSystem } from './systems/FleetSystem.js?v=14';
import { createEmployeesPanel } from './ui/EmployeesPanel.js?v=14';
import { createFleetPanel } from './ui/FleetPanel.js?v=14';

// Etapa 10 — Missions + Achievements
import { createEventBus, EVENTS } from './systems/EventBus.js?v=15';
import { createMissionStore } from './state/MissionStore.js?v=15';
import { createMissionSystem } from './systems/MissionSystem.js?v=15';
import { createMissionsPanel } from './ui/MissionsPanel.js?v=15';
// Etapa 11 — Events + Seasons
import { createEventStore } from './state/EventStore.js?v=16';
import { createEventSystem } from './systems/EventSystem.js?v=16';
import { createEventsPanel } from './ui/EventsPanel.js?v=16';
import { createGarageSystem } from './systems/GarageSystem.js?v=12';
import { createGaragePanel } from './ui/GaragePanel.js?v=12';

// Etapa 12 — Monetization
import { createEntitlementStore } from './state/EntitlementStore.js?v=21';
import { createMockPurchaseBackend } from './systems/MockPurchaseBackend.js?v=21';
import { createBoostSystem } from './systems/BoostSystem.js?v=21';
import { createEntitlementSystem } from './systems/EntitlementSystem.js?v=21';
import { createPurchaseService } from './systems/PurchaseService.js?v=21';
import { createStorePanel } from './ui/StorePanel.js?v=21';

// Etapa 13 — Social
import { createSocialStore } from './state/SocialStore.js?v=22';
import { createMockSocialBackend } from './systems/MockSocialBackend.js?v=22';
import { createSocialService } from './systems/SocialService.js?v=22';
import { createActivityFeedSystem } from './systems/ActivityFeedSystem.js?v=22';
import { createSocialPanel } from './ui/SocialPanel.js?v=22';

// Etapa 14 — Multiplayer / Co-op (mock backend, real sync BLOCKED)
import { createMultiplayerStore } from './state/MultiplayerStore.js?v=23';
import { createMockMultiplayerBackend } from './systems/MockMultiplayerBackend.js?v=23';
import { createMultiplayerService } from './systems/MultiplayerService.js?v=23';
import { createMultiplayerPanel } from './ui/MultiplayerPanel.js?v=23';

// Etapa 15 — Prestige + Endgame
import { createPrestigeStore } from './state/PrestigeStore.js?v=24';
import { createPrestigeSystem } from './systems/PrestigeSystem.js?v=24';
import { createPrestigePanel } from './ui/PrestigePanel.js?v=24';

// Etapa 16 — Polish + Mobile Optimization
import { detectTouchDevice } from './config/quality.js?v=25';
import { createPerformanceMonitor } from './systems/PerformanceMonitor.js?v=25';
import { createQualitySystem } from './systems/QualitySystem.js?v=25';
import { createTouchControlSystem } from './systems/TouchControlSystem.js?v=25';
import { createErrorRecoverySystem } from './systems/ErrorRecoverySystem.js?v=25';
import { createOrientationSystem } from './systems/OrientationSystem.js?v=25';
import { createBatterySaverSystem } from './systems/BatterySaverSystem.js?v=25';
import { createSplashScreen } from './ui/SplashScreen.js?v=25';
import { createLoadingSpinner } from './ui/LoadingSpinner.js?v=25';
import { createPerformanceHud } from './ui/PerformanceHud.js?v=25';
import { createMobileMenuDrawer } from './ui/MobileMenuDrawer.js?v=25';

// === ETAPA 19 — LIVE OPERATIONS ===
import { VERSION, getFullVersionSnapshot, getVersionString } from './config/version.js?v=27';
import { detectEnvironment, getEnvConfig } from './config/environment.js?v=27';
import { CONTENT_MANIFEST, getManifestString } from './config/contentManifest.js?v=27';
import { createLogger } from './systems/Logger.js?v=27';
import { createFeatureFlagsSystem } from './systems/FeatureFlagsSystem.js?v=27';
import { createSaveMigrationSystem } from './systems/SaveMigrationSystem.js?v=27';
import { createAnalyticsSystem, ANALYTICS_EVENTS } from './systems/AnalyticsSystem.js?v=27';
import { createCrashReportingSystem } from './systems/CrashReportingSystem.js?v=27';
import { createEconomyMonitorSystem } from './systems/EconomyMonitorSystem.js?v=27';
import { createConfigRollbackSystem } from './systems/ConfigRollbackSystem.js?v=27';
import { createAnalyticsPanel } from './ui/AnalyticsPanel.js?v=27';

// === MOBILE HARDENING v28 — PWA install + standalone detection ===
import { createStandaloneDetection } from './systems/StandaloneDetection.js?v=28';
import { createInstallPrompt } from './ui/InstallPrompt.js?v=28';

// === FINAL MASTER PASS v30 — QA Debug Menu ===
import { createQADebugMenu } from './ui/QADebugMenu.js?v=30';

// ========================= ETAPA 19 — Environment + Version detect (before splash) =========================
const __ENV_NAME     = detectEnvironment();
const __ENV_CONFIG   = getEnvConfig(__ENV_NAME);
const __VERSION_SNAP = getFullVersionSnapshot();
const __liveOpsLogger = createLogger({ envConfig: __ENV_CONFIG, tag: 'liveops' });
__liveOpsLogger.info('env=' + __ENV_NAME, 'version=' + getVersionString(), getManifestString());

// ========================= ETAPA 16 SPLASH (afisat imediat) =========================
const splashScreen = createSplashScreen();
try { splashScreen.show(); splashScreen.setProgress(5, 'Boot…'); } catch {}
const errorRecoverySystem = createErrorRecoverySystem({ transactionLog: null });
try { errorRecoverySystem.install(); } catch {}

// ========================= DETECT MOBILE + FULLSCREEN =========================
const IS_MOBILE = /Android|iPhone|iPad|iPod|Mobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 900;

if (IS_MOBILE) {
  const enterFs = () => {
    const el = document.documentElement;
    const fn = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen;
    if (fn) fn.call(el).catch(() => {});
    document.removeEventListener('touchend', enterFs);
    document.removeEventListener('click', enterFs);
  };
  document.addEventListener('touchend', enterFs, { once: true });
  document.addEventListener('click', enterFs, { once: true });
}

// ========================= RENDERER + SCENE =========================
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !IS_MOBILE, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, IS_MOBILE ? 1.3 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = !IS_MOBILE;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdfe7f7);
scene.fog = new THREE.Fog(0xdfe7f7, 70, 180);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 200);

const hemi = new THREE.HemisphereLight(0x9fb4d6, 0x3a4152, 0.35);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff4e6, 2.6);
sun.position.set(10, 16, -7);
sun.castShadow = !IS_MOBILE;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -60;
sun.shadow.camera.right = 60;
sun.shadow.camera.top = 60;
sun.shadow.camera.bottom = -60;
sun.shadow.camera.far = 140;
sun.shadow.bias = -0.0004;
scene.add(sun);
scene.add(sun.target);

const fill = new THREE.DirectionalLight(0x6a83aa, 0.2);
fill.position.set(-8, 10, 8);
scene.add(fill);

// ========================= WORLD + CHARACTER =========================
const environment = buildEnvironment(scene);
const character = buildCharacter(scene, environment);
const snowfall = createSnowfall(scene);
const controls = createControls();
const toolFx = createToolEffects(scene);

// ========================= STATE + SISTEME =========================
const playerStore   = createPlayerStore();
const settingsStore = createSettingsStore();
const gameState     = createGameState();
const transactionLog = createTransactionLog();
const unlockSystem   = createUnlockSystem();
const economy = createEconomy(playerStore, { transactionLog, unlockSystem });

// Player save
const saveSystem = createSaveSystem(playerStore, {
  key: 'snow-game:save-v2', version: 2, debounceMs: 500,
  migrations: {
    1: (s) => {
      const upg = s.toolUpgrades || {};
      for (const id of ['shovel','pusher','broom','blower','heat']) {
        if (!upg[id]) upg[id] = { power: 0, speed: 0, capacity: 0 };
      }
      const stats = { ...(s.stats || {}) };
      if (!stats.snowByType) stats.snowByType = { fresh:0,packed:0,deep:0,frozen:0,ice:0,slush:0,black_ice:0,blizzard:0 };
      if (typeof stats.totalToolUpgrades !== 'number') stats.totalToolUpgrades = 0;
      return { ...s, toolUpgrades: upg, stats };
    }
  }
});
const settingsSave = createSaveSystem(settingsStore, {
  key: 'snow-game:settings-v1', version: 1, debounceMs: 300
});

// Contract store + save
const contractStore = createContractStore();
const contractsSave = createSaveSystem(contractStore, {
  key: 'snow-game:contracts-v1', version: 1, debounceMs: 500
});

// World store + save (Etapa 4)
const worldStore = createWorldStore();
const worldSave = createSaveSystem(worldStore, {
  key: 'snow-game:world-v1', version: 1, debounceMs: 500
});

// Weather + Time stores + saves (Etapa 5)
const weatherStore = createWeatherStore();
const weatherSave = createSaveSystem(weatherStore, {
  key: 'snow-game:weather-v1', version: 1, debounceMs: 500
});
const timeStore = createTimeStore();
const timeSave = createSaveSystem(timeStore, {
  key: 'snow-game:time-v1', version: 1, debounceMs: 500
});

// Load
const loadedPlayer = saveSystem.load();
if (loadedPlayer) {
  playerStore.hydrate(loadedPlayer);
  console.log('[save] player state loaded (v2)');
} else {
  console.log('[save] new game');
}
const loadedSettings = settingsSave.load();
if (loadedSettings) settingsStore.hydrate(loadedSettings);
const loadedContracts = contractsSave.load();
if (loadedContracts) {
  contractStore.hydrate(loadedContracts);
  console.log('[save] contracts loaded');
} else {
  contractStore.populateFromTemplates();
  console.log('[save] contracts populated from templates');
}
const loadedWorld = worldSave.load();
if (loadedWorld) {
  worldStore.hydrate(loadedWorld);
  console.log('[save] world loaded');
} else {
  console.log('[save] world defaults');
}

const loadedWeather = weatherSave.load();
if (loadedWeather) {
  weatherStore.hydrate(loadedWeather);
  console.log('[save] weather loaded');
} else {
  console.log('[save] weather defaults');
}
const loadedTime = timeSave.load();
if (loadedTime) {
  timeStore.hydrate(loadedTime);
  console.log('[save] time loaded');
} else {
  console.log('[save] time defaults');
}

saveSystem.attach();
settingsSave.attach();
contractsSave.attach();
worldSave.attach();
weatherSave.attach();
timeSave.attach();

playerStore.incStat('sessionsStarted', 1);

// ========================= AUDIO + HAPTICS =========================
const audio = createAudioSystem(settingsStore);
const haptics = createHapticsSystem(settingsStore);

// ========================= BANNER (mutat aici pentru a fi disponibil in init timpuriu) =========================
let cabinBanner = null;
function showBanner(txt) {
  if (!cabinBanner) {
    cabinBanner = document.createElement('div');
    cabinBanner.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
      'background:rgba(15,20,32,.92);color:#fff;padding:14px 22px;border-radius:14px;' +
      'font:600 15px system-ui;border:1px solid rgba(255,255,255,.15);z-index:10;pointer-events:none';
    document.body.appendChild(cabinBanner);
  }
  cabinBanner.textContent = txt;
  cabinBanner.style.display = 'block';
  clearTimeout(cabinBanner._t);
  cabinBanner._t = setTimeout(() => cabinBanner.style.display = 'none', 1400);
  try { audio.banner(); } catch {}
  try { haptics.medium(); } catch {}
}

// ========================= UI BINDINGS =========================
const hud = createHudBinding(playerStore, worldStore);
const settingsPanel = createSettingsPanel(settingsStore, gameState, saveSystem, playerStore);
const pauseOverlay = createPauseOverlay(gameState, settingsPanel);

// ========================= PROGRESIE XP (definit inainte de contractSystem pt callback) =========================
// NOTA: Etapa 12 boost XP se aplica dinamic — boostSystem exists doar dupa Etapa 12 init.
// Verificare defensive prin closure global (window.__boostSystem la boot Etapa 12).
function grantXP(amount, meta = null) {
  if (amount <= 0) return;
  // Etapa 12 — XP boost multiplier
  try {
    if (typeof window !== 'undefined' && window.__boostSystem) {
      const mult = window.__boostSystem.getMultiplier('xp_boost');
      if (mult > 1) amount = Math.round(amount * mult);
    }
  } catch {}
  // Etapa 15 — Prestige XP multiplier (permanent)
  try {
    if (typeof window !== 'undefined' && window.__prestigeSystem) {
      const pmult = window.__prestigeSystem.getMultiplier('xp');
      if (pmult > 1) amount = Math.round(amount * pmult);
    }
  } catch {}
  const before = playerStore.state.xp;
  let xp = before + amount;
  let level = playerStore.state.level;
  let leveledUp = false;
  while (xp >= 100 * level) {
    xp -= 100 * level;
    level++;
    leveledUp = true;
  }
  if (leveledUp) {
    playerStore.set({ xp, level });
    economy.logLevelUp(level);
    showBanner('LEVEL UP! Level ' + level);
    audio.levelUp();
    haptics.heavy();
    // Etapa 10 event
    try { if (typeof window !== 'undefined' && window.__eventBus) window.__eventBus.emit(window.__EVENTS.PLAYER_LEVEL_UP, { newLevel: level }); } catch {}
  } else {
    playerStore.set({ xp });
  }
  economy.logXP(amount, meta);
  playerStore.incStat('totalXpEarned', amount);
  try { if (typeof window !== 'undefined' && window.__eventBus) window.__eventBus.emit(window.__EVENTS.XP_EARNED, { amount, source: meta?.source || 'melt' }); } catch {}
}

// ========================= WORLD SYSTEM (Etapa 4, inaintea contract system) =========================
const worldSystem = createWorldSystem({
  worldStore, playerStore, contractStore, unlockSystem, character, environment,
  transactionLog, audio, haptics, showBanner: (t) => showBanner(t)
});
// Auto-unlock check la boot (in caz de save v1 fara world state)
worldSystem.checkAndUnlock(playerStore.state);

// ========================= WEATHER + TIME SYSTEMS (Etapa 5) =========================
const timeSystem = createTimeSystem({ timeStore, gameState });
const weatherSystem = createWeatherSystem({
  weatherStore, timeStore, worldStore, gameState, transactionLog, audio
});
weatherSystem.forceInit();
const lightingSystem = createLightingSystem({
  scene, sun, sunTarget: sun.target, hemi, fill, fog: scene.fog,
  timeSystem, weatherSystem, settingsStore
});
const weatherFxSystem = createWeatherFxSystem({
  snowfall, weatherSystem, settingsStore, audio, gameState
});
const weatherHudCard = createWeatherHudCard({ weatherStore, timeStore });

// ========================= ETAPA 6 — VEHICLE STORE (creat inainte de contractSystem
//                                pentru preferredVehicle bonus in computeReward) =========================
const vehicleStore = createVehicleStore();
const vehicleSave = createSaveSystem(vehicleStore, {
  key: 'snow-game:vehicles-v1', version: 1, debounceMs: 500
});
const loadedVehicles = vehicleSave.load();
if (loadedVehicles) {
  vehicleStore.hydrate(loadedVehicles);
  console.log('[save] vehicles loaded');
}
vehicleSave.attach();

// ========================= ETAPA 8 — COMPANY STORE (creat inainte de contractSystem) =========================
const companyStore = createCompanyStore();
const companySave = createSaveSystem(companyStore, {
  key: 'snow-game:company-v1', version: 1, debounceMs: 500
});
const loadedCompany = companySave.load();
if (loadedCompany) {
  companyStore.hydrate(loadedCompany);
  console.log('[save] company loaded');
}
companySave.attach();

// ========================= CONTRACT SYSTEM + UI =========================
const contractSystem = createContractSystem({
  contractStore, playerStore, economy, environment,
  gameState, transactionLog, unlockSystem, audio, haptics,
  grantXP, worldSystem, weatherSystem,
  vehicleStore,   // Etapa 6
  companySystem: null  // wired dupa creare mai jos (Etapa 8)
});
const contractPanel = createContractPanel({
  contractStore, playerStore, contractSystem, gameState, unlockSystem,
  audio, haptics, showBanner: (t) => showBanner(t),
  worldStore, worldSystem
});
const contractResults = createContractResults({
  contractStore, gameState, contractPanel
});
const contractHudCard = createContractHudCard(contractStore);

// ========================= WORLD MAP UI =========================
const worldMapPanel = createWorldMapPanel({
  worldStore, playerStore, contractStore, worldSystem, unlockSystem,
  gameState, showBanner: (t) => showBanner(t), audio, haptics
});

// ========================= ETAPA 6 — VEHICLE SYSTEM + UI =========================
const vehicleSystem = createVehicleSystem({
  vehicleStore, playerStore, economy, environment, weatherSystem,
  timeSystem, gameState, controls, character, scene,
  transactionLog, audio, haptics, showBanner: (t) => showBanner(t)
});

const vehicleShopPanel = createVehicleShopPanel({
  vehicleStore, vehicleSystem, playerStore, economy,
  gameState, showBanner: (t) => showBanner(t)
});
const vehicleHudCard = createVehicleHudCard(vehicleStore, vehicleSystem);

// ========================= ETAPA 7 — GARAGE STORE + SYSTEM + PANEL =========================
const garageStore = createGarageStore();
const garageSave = createSaveSystem(garageStore, {
  key: 'snow-game:garage-v1', version: 1, debounceMs: 500
});
const loadedGarage = garageSave.load();
if (loadedGarage) {
  garageStore.hydrate(loadedGarage);
  console.log('[save] garage loaded');
}
garageSave.attach();

const garageSystem = createGarageSystem({
  garageStore, vehicleStore, vehicleSystem, playerStore, worldStore,
  economy, gameState, transactionLog, audio, haptics, scene,
  showBanner: (t) => showBanner(t)
});

const garagePanel = createGaragePanel({
  garageStore, garageSystem,
  vehicleStore, vehicleSystem,
  playerStore, economy, weatherSystem,
  contractStore, gameState, vehicleShopPanel,
  showBanner: (t) => showBanner(t)
});

// Auto-spawn active vehicle at boot (if owned & has last position)
const _autoSpawnActive = vehicleStore.state.activeVehicleId;
if (_autoSpawnActive && vehicleStore.isOwned(_autoSpawnActive)) {
  setTimeout(() => vehicleSystem.spawnVehicle(_autoSpawnActive), 300);
}

// Headlights toggle at day/night change
if (lightingSystem && typeof lightingSystem.onNightModeChange === 'function') {
  lightingSystem.onNightModeChange((nightMode) => vehicleSystem.updateHeadlights(nightMode));
} else {
  // Fallback: poll phase every 5s
  setInterval(() => {
    const phase = timeSystem && timeSystem.getPhase ? timeSystem.getPhase() : null;
    const isNight = phase && (phase.id === 'night' || phase.id === 'sunset');
    vehicleSystem.updateHeadlights(isNight);
  }, 5000);
}

// Auto-unlock la level up / contract complete
playerStore.onKey('level', () => { worldSystem.checkAndUnlock(playerStore.state); });
playerStore.onKey('stats', () => { worldSystem.checkAndUnlock(playerStore.state); });

// ========================= ETAPA 8 — COMPANY SYSTEM + PANELS =========================
const companySystem = createCompanySystem({
  companyStore, playerStore, economy, unlockSystem, worldSystem,
  contractStore, transactionLog, gameState, audio, haptics,
  showBanner: (t) => showBanner(t)
});
// Wire lazy: ContractSystem primeste companySystem prin setter
if (typeof contractSystem.setCompanySystem === 'function') {
  contractSystem.setCompanySystem(companySystem);
}

const companyPanel = createCompanyPanel({
  companyStore, companySystem, playerStore, gameState, transactionLog,
  showBanner: (t) => showBanner(t)
});

const companyCreationModal = createCompanyCreationModal(companySystem, () => {
  if (contractPanel && typeof contractPanel.render === 'function') try { contractPanel.render(); } catch(e){}
});

// Company creation e OPȚIONALĂ — modal deschis manual din butonul 🏢, nu forțat la boot.
// Player poate juca gameplay-ul de bază fără companie. Când vrea, click 🏢 → modal.
if (!companySystem.isCreated()) {
  setTimeout(() => showBanner('Bine ai venit! Click 🏢 pentru a-ți fonda compania'), 1500);
}

// HUD button 🏢
const _companyBtn = document.createElement('button');
_companyBtn.id = 'company-trigger-btn';
_companyBtn.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top) + 12px);left:calc(env(safe-area-inset-left) + 220px);z-index:15;background:rgba(28,36,52,0.9);color:#fff;border:1px solid rgba(255,255,255,0.15);border-radius:10px;padding:8px 12px;cursor:pointer;font:600 14px system-ui;';
_companyBtn.innerHTML = '🏢 Companie';
// Buton 🏢 mereu vizibil: dacă companie ne-creată → deschide modal creare; altfel → CompanyPanel
_companyBtn.addEventListener('click', () => {
  if (companySystem.isCreated()) companyPanel.toggle();
  else companyCreationModal.open();
});
document.body.appendChild(_companyBtn);

function updateCompanyBtn() {
  _companyBtn.innerHTML = companySystem.isCreated() ? '🏢 Companie' : '🏢 Fondează Companie';
}
companyStore.on(updateCompanyBtn);
updateCompanyBtn();

// Tasta B pentru Business (deschide fie modal creare, fie panel)
window.addEventListener('keydown', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (e.key === 'b' || e.key === 'B') {
    if (companySystem.isCreated()) companyPanel.toggle();
    else companyCreationModal.open();
  }
});

// ========================= ETAPA 9 — EMPLOYEES + FLEET =========================
const employeeStore = createEmployeeStore();
const fleetStore = createFleetStore();
const employeesSave = createSaveSystem(employeeStore, { key: 'snow-game:employees-v1', version: 1 });
const fleetSave = createSaveSystem(fleetStore, { key: 'snow-game:fleet-v1', version: 1 });
const _empData = employeesSave.load();
if (_empData) employeeStore.hydrate(_empData);
const _fleetData = fleetSave.load();
if (_fleetData) fleetStore.hydrate(_fleetData);
employeesSave.attach();
fleetSave.attach();

const employeeSystem = createEmployeeSystem({
  employeeStore, companyStore, companySystem,
  transactionLog, audio, haptics, timeSystem,
  banner: (t) => showBanner(t)
});
const fleetSystem = createFleetSystem({
  fleetStore, employeeStore, employeeSystem, vehicleStore,
  contractStore, contractSystem, companySystem, playerStore,
  environment, weatherSystem, transactionLog, audio, haptics, timeSystem,
  banner: (t) => showBanner(t)
});
// Safety: auto-complete operations expirate din offline
fleetSystem.resumeOnBoot();
// Boot: genereaza candidati daca lista goala
if (companySystem.isCreated() && !employeeStore.state.availableCandidates.length) {
  employeeSystem.refreshCandidates();
}
// Weekly salaries hook via TimeStore dayIndex
timeStore.onKey('dayIndex', (day) => employeeSystem.checkWeeklySalaries(day));

// Panel-uri Etapa 9
const getVehicleNameById = (id) => {
  try {
    // reuse VEHICLE_BY_ID (importat deja via config/vehicles.js in main sub alt name?)
    return id;
  } catch { return id; }
};
const employeesPanel = createEmployeesPanel({
  employeeStore, employeeSystem, companyStore, companySystem,
  gameState, vehicleStore, getVehicleNameById
});
const fleetPanel = createFleetPanel({
  employeeStore, fleetStore, vehicleStore, contractStore,
  fleetSystem, companySystem, gameState
});

// HUD buttons 9 (Employees + Fleet)
const _empBtn = document.createElement('button');
_empBtn.id = 'employees-trigger-btn';
_empBtn.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top) + 12px);left:calc(env(safe-area-inset-left) + 320px);z-index:15;background:rgba(28,36,52,0.9);color:#fff;border:1px solid rgba(255,255,255,0.15);border-radius:10px;padding:8px 12px;cursor:pointer;font:600 14px system-ui;';
_empBtn.innerHTML = '👷 Angajati';
_empBtn.addEventListener('click', () => employeesPanel.toggle());
document.body.appendChild(_empBtn);

const _fleetBtn = document.createElement('button');
_fleetBtn.id = 'fleet-trigger-btn';
_fleetBtn.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top) + 12px);left:calc(env(safe-area-inset-left) + 415px);z-index:15;background:rgba(28,36,52,0.9);color:#fff;border:1px solid rgba(255,255,255,0.15);border-radius:10px;padding:8px 12px;cursor:pointer;font:600 14px system-ui;';
_fleetBtn.innerHTML = '🚛 Fleet';
_fleetBtn.addEventListener('click', () => fleetPanel.toggle());
document.body.appendChild(_fleetBtn);

function updateEtapa9Btns() {
  const created = companySystem.isCreated();
  _empBtn.style.display = created ? 'block' : 'none';
  _fleetBtn.style.display = (created && employeeStore.count() >= 1) ? 'block' : 'none';
}
companyStore.on(updateEtapa9Btns);
employeeStore.on(updateEtapa9Btns);
updateEtapa9Btns();

// Taste H (Employees), F (Fleet)
window.addEventListener('keydown', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (e.key === 'h' || e.key === 'H') { if (companySystem.isCreated()) employeesPanel.toggle(); }
  else if (e.key === 'f' || e.key === 'F') { if (companySystem.isCreated() && employeeStore.count() >= 1) fleetPanel.toggle(); }
});

// ========================= ETAPA 10 — MISSIONS + ACHIEVEMENTS =========================
const eventBus = createEventBus();
const missionStore = createMissionStore();
const missionSave = createSaveSystem(missionStore, { key: 'snow-game:missions-v1', version: 1, debounceMs: 500 });
const _missionData = missionSave.load();
if (_missionData) { missionStore.hydrate(_missionData); console.log('[save] missions loaded'); }
missionSave.attach();

const missionSystem = createMissionSystem({
  missionStore, playerStore, companyStore, worldStore, vehicleStore, employeeStore,
  economy, companySystem, transactionLog, audio, haptics, eventBus,
  grantPlayerXP: grantXP, showBanner: (t) => showBanner(t)
});
missionSystem.initialize();

const missionsPanel = createMissionsPanel({
  missionStore, missionSystem, gameState, showBanner: (t) => showBanner(t)
});

// Tick 30s pentru daily/weekly reset check
setInterval(() => { try { missionSystem.checkTick(); } catch (e) { console.error('[MissionSystem tick]', e); } }, 30000);

// Tasta J — toggle MissionsPanel
window.addEventListener('keydown', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (e.key === 'j' || e.key === 'J') missionsPanel.toggle();
});

// ========================= ETAPA 11 — EVENTS + SEASONS =========================
const eventStore = createEventStore();
const eventSave = createSaveSystem(eventStore, { key: 'snow-game:events-v1', version: 1, debounceMs: 500 });
const _eventData = eventSave.load();
if (_eventData) { eventStore.hydrate(_eventData); console.log('[save] events loaded'); }
eventSave.attach();

const eventSystem = createEventSystem({
  eventStore, playerStore, companyStore, worldStore,
  weatherStore, weatherSystem,
  economy, companySystem, transactionLog,
  audio, haptics, eventBus,
  grantPlayerXP: grantXP, showBanner: (t) => showBanner(t)
});
eventSystem.initialize();

const eventsPanel = createEventsPanel({
  eventStore, eventSystem, gameState, showBanner: (t) => showBanner(t)
});
eventsPanel.ensureHudButton();

// Tick 30s pentru re-eval events/seasons (aceeasi cadenta cu MissionSystem)
setInterval(() => { try { eventSystem.checkTick(); } catch (e) { console.error('[EventSystem tick]', e); } }, 30000);

// Tasta X — toggle EventsPanel
window.addEventListener('keydown', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (e.key === 'x' || e.key === 'X') eventsPanel.toggle();
});

// Throttling pentru TOOL_USED emit
const _lastToolUsedEmit = new Map();
function emitToolUsed(toolId) {
  if (!toolId) return;
  const now = Date.now();
  const last = _lastToolUsedEmit.get(toolId) || 0;
  if (now - last < 3000) return;
  _lastToolUsedEmit.set(toolId, now);
  eventBus.emit(EVENTS.TOOL_USED, { toolId });
}

// Expose eventBus + emitters global pentru sisteme (VehicleSystem, FleetSystem, ContractSystem, CompanySystem)
// pot chema window.__eventBus.emit(...) unde este necesar
window.__eventBus = eventBus;
window.__EVENTS = EVENTS;

// ========================= ETAPA 12 — MONETIZATION =========================
const entitlementStore = createEntitlementStore();
const entitlementSave = createSaveSystem(entitlementStore, { key: 'snow-game:entitlements-v1', version: 1, debounceMs: 500 });
const _entData = entitlementSave.load();
if (_entData) { entitlementStore.hydrate(_entData); console.log('[save] entitlements loaded'); }
entitlementSave.attach();

const mockBackend = createMockPurchaseBackend({ delay: 500, failRate: 0.05 });
const boostSystem = createBoostSystem({ entitlementStore, transactionLog, audio });
const entitlementSystem = createEntitlementSystem({ entitlementStore, playerStore, vehicleStore });
const purchaseService = createPurchaseService({
  backend: mockBackend, entitlementStore, playerStore, vehicleStore,
  economy, boostSystem, transactionLog,
  audio, haptics, grantPlayerXP: grantXP, showBanner: (t) => showBanner(t)
});

const storePanel = createStorePanel({
  purchaseService, entitlementStore, boostSystem, gameState,
  showBanner: (t) => showBanner(t)
});
storePanel.ensureHudButton();
storePanel.ensureBoostIndicator();

// Expune boostSystem global pentru grantXP + melt handler (evita reordonare inversa)
window.__boostSystem = boostSystem;
window.__purchaseService = purchaseService;

// Tick 30s pentru boost expire
setInterval(() => { try { boostSystem.tick(); } catch (e) { console.error('[BoostSystem tick]', e); } }, 30000);

// Tasta P — toggle StorePanel (P = Purchase / Premium)
window.addEventListener('keydown', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (e.key === 'p' || e.key === 'P') storePanel.toggle();
});

// ========================= ETAPA 13 — SOCIAL =========================
const socialStore = createSocialStore();
const socialSave = createSaveSystem(socialStore, { key: 'snow-game:social-v1', version: 1, debounceMs: 500 });
const _socialData = socialSave.load();
if (_socialData) { socialStore.hydrate(_socialData); console.log('[save] social loaded'); }
socialSave.attach();

// Sync displayName la boot: dacă există name în playerStore dar nu în socialStore.profile, propagă
if (playerStore.state.name && !socialStore.state.profile.displayName) {
  socialStore.setProfile({ displayName: playerStore.state.name });
}
// Set backend status = mock (dev mode)
socialStore.set({ backendStatus: 'mock' });

const mockSocialBackend = createMockSocialBackend({ delay: 300, failRate: 0 });
const socialService = createSocialService({
  backend: mockSocialBackend,
  socialStore, playerStore, companyStore, vehicleStore, entitlementStore,
  transactionLog, audio, haptics,
  showBanner: (t) => showBanner(t)
});

const activityFeedSystem = createActivityFeedSystem({
  socialStore, eventBus, playerStore, companyStore
});
activityFeedSystem.initialize();

const socialPanel = createSocialPanel({
  socialStore, socialService, companySystem, gameState,
  showBanner: (t) => showBanner(t)
});
socialPanel.ensureHudButton();

// Tasta Y — toggle SocialPanel
window.addEventListener('keydown', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (e.key === 'y' || e.key === 'Y') socialPanel.toggle();
});

window.__socialService = socialService;

// ========================= ETAPA 14 — MULTIPLAYER / CO-OP =========================
// FOUNDATION ONLY: MockMultiplayerBackend + Lobby UI + Session state.
// Real 2-4 player sync = BLOCKED (nevoie de WebSocket / Photon / Colyseus / Firebase RTDB).
const multiplayerStore = createMultiplayerStore();
const multiplayerSave = createSaveSystem(multiplayerStore, { key: 'snow-game:multiplayer-v1', version: 1, debounceMs: 500 });
const _mpData = multiplayerSave.load();
if (_mpData) { multiplayerStore.hydrate(_mpData); console.log('[save] multiplayer loaded'); }
multiplayerSave.attach();

const mockMultiplayerBackend = createMockMultiplayerBackend({ maxBots: 3 });
const multiplayerService = createMultiplayerService({
  backend: mockMultiplayerBackend,
  multiplayerStore, playerStore, companyStore,
  socialService, transactionLog, audio, haptics,
  eventBus,
  showBanner: (t) => showBanner(t)
});

const multiplayerPanel = createMultiplayerPanel({
  multiplayerStore, multiplayerService, gameState,
  showBanner: (t) => showBanner(t)
});
multiplayerPanel.ensureHudButton();

// Tasta N — toggle MultiplayerPanel
window.addEventListener('keydown', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (e.key === 'n' || e.key === 'N') multiplayerPanel.toggle();
});

window.__multiplayerService = multiplayerService;

// ========================= ETAPA 15 — PRESTIGE + ENDGAME =========================
const prestigeStore = createPrestigeStore();
const prestigeSave = createSaveSystem(prestigeStore, { key: 'snow-game:prestige-v1', version: 1, debounceMs: 500 });
const _prestigeData = prestigeSave.load();
if (_prestigeData) { prestigeStore.hydrate(_prestigeData); console.log('[save] prestige loaded'); }
prestigeSave.attach();

const prestigeSystem = createPrestigeSystem({
  prestigeStore, playerStore, companyStore, worldStore, contractStore,
  missionStore, multiplayerStore,
  transactionLog, audio, haptics, showBanner: (t) => showBanner(t),
  eventBus
});
// Wire prestigeSystem into contractSystem (contract_reward multiplier + extreme completion hook)
if (typeof contractSystem.setPrestigeSystem === 'function') {
  contractSystem.setPrestigeSystem(prestigeSystem);
}

const prestigePanel = createPrestigePanel({
  prestigeStore, prestigeSystem,
  playerStore, companyStore, contractStore, worldStore,
  gameState, showBanner: (t) => showBanner(t)
});
prestigePanel.ensureHudButton();

// Expose global pentru grantXP + melt handler (multiplicatori)
window.__prestigeSystem = prestigeSystem;

// Endgame unlock check pe player level up
try {
  eventBus.on(EVENTS.PLAYER_LEVEL_UP, () => {
    try { prestigeSystem.checkEndgameUnlock(); } catch (e) { console.warn('[PrestigeSystem] endgame check err', e); }
  });
} catch {}
// Boot-time endgame unlock check (dacă player deja >= 15 din save)
try { prestigeSystem.checkEndgameUnlock(); } catch {}

// Tasta R — toggle PrestigePanel
window.addEventListener('keydown', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (e.key === 'r' || e.key === 'R') prestigePanel.toggle();
});

// ========================= ETAPA 16 — POLISH + MOBILE OPTIMIZATION =========================
try { splashScreen.setProgress(85, 'Polish + mobile…'); } catch {}

// Performance monitor
const performanceMonitor = createPerformanceMonitor({
  targetFps: IS_MOBILE ? 30 : 60,
  onDegrade: (avg, target) => { try { qualitySystem.onPerformanceDegrade(avg, target); } catch {} },
  onImprove: () => {}
});

// Quality system — aplica renderer + scene + sun + fog
const qualitySystem = createQualitySystem({
  settingsStore, renderer, scene, sun, transactionLog,
  showBanner: (t) => showBanner(t)
});
try { qualitySystem.initFromSettings(); } catch (e) { console.warn('[QualitySystem] init err', e); }

// Loading spinner (mic non-blocking)
const loadingSpinner = createLoadingSpinner();

// Touch control system (dual joystick + action buttons)
const touchControlSystem = createTouchControlSystem({
  settingsStore, haptics,
  onMovement: ({ dx, dy }) => { try { if (controls && controls.setTouchAxes) controls.setTouchAxes(dx, dy); } catch {} },
  onCamera: ({ dx, dy }) => {
    try {
      if (controls && controls.camera) {
        const inv = (settingsStore.state && settingsStore.state.invertY) ? -1 : 1;
        controls.camera.yaw   += dx * 0.05;
        controls.camera.pitch = Math.max(0.15, Math.min(1.2, controls.camera.pitch + inv * dy * 0.03));
      }
    } catch {}
  },
  onAction: ({ id, phase }) => {
    if (id === 'enter_exit' && phase === 'down') {
      try {
        if (vehicleStore.state.isPlayerInVehicle) vehicleSystem.exitVehicle();
        else {
          const spawnedIds = vehicleStore.state.owned;
          let closest = null, closestDist = Infinity;
          for (const id of spawnedIds) {
            const obj = vehicleSystem.getSpawned(id); if (!obj) continue;
            const d = vehicleSystem.distanceToPlayer(obj);
            if (d < closestDist) { closest = id; closestDist = d; }
          }
          if (closest) vehicleSystem.enterVehicle(closest);
        }
      } catch {}
    } else if (id === 'tool_action') {
      boostActive = (phase === 'down');
    } else if (id === 'boost') {
      boostActive = (phase === 'down');
    } else if (id === 'brake' && phase === 'down') {
      try { if (controls && controls.setBrake) controls.setBrake(true); } catch {}
    } else if (id === 'brake' && phase === 'up') {
      try { if (controls && controls.setBrake) controls.setBrake(false); } catch {}
    }
  },
  onMenu: () => { try { mobileMenuDrawer.open(); } catch {} }
});
try { touchControlSystem.refreshVisibility(); } catch {}
try { settingsStore.onKey && settingsStore.onKey('touchUi', () => { try { touchControlSystem.refreshVisibility(); applyHasTouchClass(); } catch {} }); } catch {}

// v29 — body.has-touch class pentru CSS layout fix (elimina overlap butoane HUD)
function applyHasTouchClass() {
  try {
    const shouldTouch = touchControlSystem.shouldShow();
    document.body.classList.toggle('has-touch', !!shouldTouch);
  } catch {}
}
applyHasTouchClass();
window.addEventListener('resize', () => { setTimeout(applyHasTouchClass, 150); });
try {
  const mq = window.matchMedia('(pointer: coarse)');
  if (mq && mq.addEventListener) mq.addEventListener('change', applyHasTouchClass);
  else if (mq && mq.addListener) mq.addListener(applyHasTouchClass);
} catch {}

// Orientation system
const orientationSystem = createOrientationSystem({ settingsStore });
try { orientationSystem.install(); } catch {}

// Battery saver system
const batterySaverSystem = createBatterySaverSystem({
  settingsStore, qualitySystem, performanceMonitor, transactionLog,
  showBanner: (t) => showBanner(t),
  snowfall,
  weatherFxSystem
});
try { batterySaverSystem.install(); } catch {}
try { settingsStore.onKey && settingsStore.onKey('batterySaver', (v) => batterySaverSystem.apply(v)); } catch {}
try { settingsStore.onKey && settingsStore.onKey('reducedMotion', (v) => { document.body.classList.toggle('reduced-motion', !!v); }); } catch {}
try { settingsStore.onKey && settingsStore.onKey('fontScale', (v) => { document.documentElement.style.fontSize = (v * 16) + 'px'; }); } catch {}
try {
  if (settingsStore.state.reducedMotion) document.body.classList.add('reduced-motion');
  if (settingsStore.state.fontScale && settingsStore.state.fontScale !== 1) {
    document.documentElement.style.fontSize = (settingsStore.state.fontScale * 16) + 'px';
  }
} catch {}

// Quality settings live reload
try { settingsStore.onKey && settingsStore.onKey('quality', (v) => { try { if (v === 'auto') qualitySystem.autoDetect(); else qualitySystem.apply(v, { source: 'manual' }); } catch {} }); } catch {}

// Mobile menu drawer
const mobileMenuDrawer = createMobileMenuDrawer({
  panels: {
    vehicleShopPanel, contractPanel, garagePanel, companyPanel,
    employeesPanel, fleetPanel, worldMapPanel, missionsPanel,
    eventsPanel, storePanel, socialPanel, multiplayerPanel, prestigePanel
  },
  settingsPanel
});

// Performance HUD (debug F3 sau ?perf=1)
const performanceHud = createPerformanceHud({ performanceMonitor, qualitySystem, renderer });
try {
  const url = new URL(window.location.href);
  if (url.searchParams.get('perf') === '1' && isDebugMode()) performanceHud.show();
} catch {}
window.addEventListener('keydown', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (e.key === 'F3') { e.preventDefault(); performanceHud.toggle(); }
});

// Wrap: install error recovery over animate (ErrorRecoverySystem already created up top, wire transactionLog now)
try { errorRecoverySystem.transactionLog = transactionLog; } catch {}
window.__performanceMonitor = performanceMonitor;
window.__qualitySystem = qualitySystem;
window.__errorRecoverySystem = errorRecoverySystem;
window.__touchControlSystem = touchControlSystem;
window.__batterySaverSystem = batterySaverSystem;

// ========================= ETAPA 19 — LIVE OPERATIONS INIT =========================
try { splashScreen.setProgress(92, 'Live Ops…'); } catch {}

// Feature Flags
const featureFlagsSystem = createFeatureFlagsSystem({ envConfig: __ENV_CONFIG, logger: __liveOpsLogger.child('flags') });
try { featureFlagsSystem.init(); } catch (e) { __liveOpsLogger.warn('flags init fail', e); }

// Save Migration Pipeline (registry gol — SaveSystem existent are propriile migrations)
const saveMigrationSystem = createSaveMigrationSystem({ logger: __liveOpsLogger.child('migration') });

// Analytics (buffer local, flush no-op)
const analyticsSystem = createAnalyticsSystem({
  envConfig: __ENV_CONFIG,
  versionSnapshot: __VERSION_SNAP,
  logger: __liveOpsLogger.child('analytics'),
  eventBus
});
try { analyticsSystem.init(); } catch (e) { __liveOpsLogger.warn('analytics init fail', e); }

// Crash Reporting extension (peste ErrorRecoverySystem existent)
const crashReportingSystem = createCrashReportingSystem({
  envConfig: __ENV_CONFIG,
  versionSnapshot: __VERSION_SNAP,
  analytics: analyticsSystem,
  logger: __liveOpsLogger.child('crash'),
  errorRecoverySystem
});
try { crashReportingSystem.install(); } catch (e) { __liveOpsLogger.warn('crash init fail', e); }

// Economy Monitor
const economyMonitorSystem = createEconomyMonitorSystem({
  transactionLog, playerStore, logger: __liveOpsLogger.child('economy')
});

// Config Rollback
const configRollbackSystem = createConfigRollbackSystem({
  featureFlagsSystem, versionSnapshot: __VERSION_SNAP, logger: __liveOpsLogger.child('rollback'), crashReporting: crashReportingSystem
});
try { configRollbackSystem.init(); } catch {}

// Analytics Panel (dev-only)
const analyticsPanel = createAnalyticsPanel({
  analytics: analyticsSystem,
  economyMonitor: economyMonitorSystem,
  crashReporting: crashReportingSystem,
  featureFlagsSystem,
  envConfig: __ENV_CONFIG,
  versionSnapshot: __VERSION_SNAP,
  logger: __liveOpsLogger.child('panel')
});
// HUD button 📊 pentru analytics panel (doar dev/staging)
if (__ENV_CONFIG.devPanelsVisible && featureFlagsSystem.isEnabled('ENABLE_ANALYTICS_PANEL')) {
  try {
    const btn = document.createElement('button');
    btn.id = 'analytics-hud-btn';
    btn.textContent = '📊';
    btn.title = 'Analytics (F4)';
    btn.style.cssText = 'position:fixed;top:8px;left:8px;z-index:120;padding:4px 10px;border-radius:8px;border:1px solid rgba(120,180,255,0.35);background:rgba(15,23,37,0.85);color:#8cf;font-size:16px;cursor:pointer;font-family:sans-serif';
    btn.addEventListener('click', () => analyticsPanel.toggle());
    document.body.appendChild(btn);
  } catch {}
}
window.addEventListener('keydown', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (e.key === 'F4' && __ENV_CONFIG.debugTools) { e.preventDefault(); analyticsPanel.toggle(); }
});

// Feature flag — hide panels dezactivate din HUD
try {
  if (!featureFlagsSystem.isEnabled('ENABLE_SOCIAL_PANEL')) {
    const b = document.querySelector('#social-btn, [data-panel="social"]'); if (b) b.style.display = 'none';
  }
  if (!featureFlagsSystem.isEnabled('ENABLE_MULTIPLAYER_LOBBY')) {
    const b = document.querySelector('#multiplayer-btn, [data-panel="multiplayer"]'); if (b) b.style.display = 'none';
  }
  if (!featureFlagsSystem.isEnabled('ENABLE_STORE_PANEL')) {
    const b = document.querySelector('#store-btn, [data-panel="store"]'); if (b) b.style.display = 'none';
  }
  if (!featureFlagsSystem.isEnabled('ENABLE_PRESTIGE')) {
    const b = document.querySelector('#prestige-btn, [data-panel="prestige"]'); if (b) b.style.display = 'none';
  }
} catch {}

window.__liveOps = {
  env: __ENV_NAME, envConfig: __ENV_CONFIG, version: __VERSION_SNAP, manifest: CONTENT_MANIFEST,
  logger: __liveOpsLogger,
  featureFlags: featureFlagsSystem,
  saveMigration: saveMigrationSystem,
  analytics: analyticsSystem,
  crashes: crashReportingSystem,
  economyMonitor: economyMonitorSystem,
  configRollback: configRollbackSystem,
  analyticsPanel
};

// ========================= MOBILE HARDENING v28 — PWA install + standalone =========================
const standaloneDetection = createStandaloneDetection();
try { standaloneDetection.watch(); } catch {}
const installPrompt = createInstallPrompt({ standalone: standaloneDetection, analytics: analyticsSystem });
try { installPrompt.install(); } catch (e) { __liveOpsLogger.warn('install prompt init fail', e); }
// Lock orientation to landscape on mobile if API is available (best-effort, ignored on iOS Safari)
try {
  if (screen && screen.orientation && typeof screen.orientation.lock === 'function') {
    screen.orientation.lock('landscape').catch(() => {});
  }
} catch {}
window.__mobile = { standalone: standaloneDetection, installPrompt };

// ========================= FINAL MASTER PASS v30 — QA Debug Menu =========================
const qaDebugMenu = createQADebugMenu({
  panels: {
    vehicleShopPanel, contractPanel, garagePanel, companyPanel,
    employeesPanel, fleetPanel, worldMapPanel, missionsPanel,
    eventsPanel, storePanel, socialPanel, multiplayerPanel, prestigePanel
  },
  settingsPanel,
  analyticsPanel,
  showBanner: (t) => showBanner(t),
  gameState
});
try { qaDebugMenu.install(); } catch (e) { console.warn('[qa] install fail', e); }
window.__qaDebugMenu = qaDebugMenu;

// ========================= FINAL MASTER PASS v30 — Escape closes topmost modal =========================
// Before falling back to pauseOverlay.toggle(), try to close any visible panel.
// This makes Escape act as a universal "close" for the panel on top.
(function installEscapeCloseTop() {
  const PANEL_REFS = () => [
    qaDebugMenu,
    // Order roughly by z-index / recency; the FIRST visible one is closed.
    settingsPanel,
    { isVisible: () => (mobileMenuDrawer && mobileMenuDrawer.isOpen && mobileMenuDrawer.isOpen()), close: () => mobileMenuDrawer.close() },
    storePanel, multiplayerPanel, prestigePanel, socialPanel, eventsPanel, missionsPanel,
    fleetPanel, employeesPanel, companyPanel, garagePanel, vehicleShopPanel,
    contractPanel, worldMapPanel, analyticsPanel
  ];
  function _isPanelOpen(p) {
    if (!p) return false;
    try {
      if (typeof p.isOpen === 'function') return p.isOpen();
      if (typeof p.isVisible === 'function') return p.isVisible();
      // Fallback: check DOM class conventions used by panels ('visible' / 'open')
      // (best-effort; most panels expose isOpen/isVisible via API, but not all)
      const dom = document.querySelector('#' + (p._rootId || '')) || null;
      if (dom) return dom.classList.contains('visible') || dom.classList.contains('open');
    } catch {}
    return false;
  }
  function _closePanel(p) {
    try { if (p && typeof p.close === 'function') { p.close(); return true; } } catch {}
    return false;
  }
  // Fallback DOM sweep — close any modal element (checks class OR style.display).
  function _closeVisibleDomModal() {
    const candidates = document.querySelectorAll('[id$="-overlay"], [id$="-modal"], [id$="-panel"]');
    for (const el of candidates) {
      // Skip permanent HUD panels that are not modals (tool-panel, shop-panel, minimap, level, objective, top-right, touch)
      const id = el.id || '';
      if (id === 'tool-panel' || id === 'shop-panel' || id === 'ui' || id === 'level-card' || id === 'objective-card' || id === 'settings-btn') continue;
      const cs = getComputedStyle(el);
      const isVisible = el.classList.contains('visible') || el.classList.contains('open') || (cs.display !== 'none' && el.style.display && el.style.display !== 'none');
      if (isVisible) {
        // Only close true modal-style overlays: fixed position covering >= half viewport
        if (cs.position !== 'fixed') continue;
        const rect = el.getBoundingClientRect();
        if (rect.width < window.innerWidth * 0.3 || rect.height < window.innerHeight * 0.3) continue;
        el.classList.remove('visible');
        el.classList.remove('open');
        el.style.display = 'none';
        return true;
      }
    }
    return false;
  }
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    for (const p of PANEL_REFS()) {
      if (_isPanelOpen(p)) {
        if (_closePanel(p)) { e.stopImmediatePropagation(); return; }
      }
    }
    if (_closeVisibleDomModal()) { e.stopImmediatePropagation(); return; }
    // else — fall through to existing pauseOverlay.toggle() handler installed below
  }, true); // capture phase so we run BEFORE existing pause handler
})();

// ========================= DEBUG =========================
// ETAPA 19 — Strip debug tools in production (envConfig.debugTools=false)
if (__ENV_CONFIG.debugTools) {
installDebugTools({
  playerStore, economy, saveSystem, transactionLog,
  environment, character,
  contractStore, contractSystem, contractsSave,
  worldStore, worldSystem, worldSave,
  weatherStore, weatherSystem, weatherSave,
  timeStore, timeSystem, timeSave,
  vehicleStore, vehicleSystem, vehicleSave,
  garageStore, garageSystem, garageSave, garagePanel,
  // Etapa 8
  companyStore, companySystem, companySave, companyPanel, companyCreationModal,
  // Etapa 9
  employeeStore, employeeSystem, employeesSave, employeesPanel,
  fleetStore, fleetSystem, fleetSave, fleetPanel,
  // Etapa 10
  missionStore, missionSystem, missionSave, missionsPanel, eventBus,
  // Etapa 11
  eventStore, eventSystem, eventSave, eventsPanel,
  // Etapa 12
  entitlementStore, entitlementSave, purchaseService, boostSystem, entitlementSystem, storePanel,
  // Etapa 13
  socialStore, socialService, socialPanel, activityFeedSystem, mockSocialBackend,
  // Etapa 14
  multiplayerStore, multiplayerService, mockMultiplayerBackend, multiplayerPanel,
  // Etapa 15
  prestigeStore, prestigeSystem, prestigePanel, prestigeSave,
  // Etapa 16
  qualitySystem, performanceMonitor, errorRecoverySystem,
  touchControlSystem, batterySaverSystem,
  splashScreen, performanceHud, orientationSystem, mobileMenuDrawer
});

// ETAPA 19 — augment window.dbg with live ops helpers (dev only)
try {
  window.dbg = window.dbg || {};
  window.dbg.env       = () => ({ env: __ENV_NAME, config: __ENV_CONFIG, version: __VERSION_SNAP });
  window.dbg.version   = () => __VERSION_SNAP;
  window.dbg.manifest  = () => CONTENT_MANIFEST;
  window.dbg.flags = {
    list:  () => featureFlagsSystem.getAll(),
    set:   (n, v) => featureFlagsSystem.override(n, v),
    reset: (n) => n ? featureFlagsSystem.resetOverride(n) : featureFlagsSystem.resetOverrides(),
    isOn:  (n) => featureFlagsSystem.isEnabled(n)
  };
  window.dbg.migration = {
    list:          () => saveMigrationSystem.listRegistered(),
    backups:       (k) => saveMigrationSystem.getBackups(k),
    restore:       (k, v) => saveMigrationSystem.restoreBackup(k, v),
    simulate:      (k, payload) => saveMigrationSystem.simulate(k, payload),
    clearBackups:  () => saveMigrationSystem.clearAllBackups()
  };
  window.dbg.analytics = {
    stats:  () => analyticsSystem.getStats(),
    events: (filter) => analyticsSystem.getEvents(filter),
    track:  (n, p) => analyticsSystem.track(n, p),
    flush:  () => analyticsSystem.flush(),
    clear:  () => analyticsSystem.clear(),
    panel:  () => analyticsPanel.toggle()
  };
  window.dbg.crashes = {
    list:   () => crashReportingSystem.getCrashes(),
    dump:   (id) => crashReportingSystem.getCrashById(id),
    clear:  () => crashReportingSystem.clearCrashes(),
    report: (msg, source) => crashReportingSystem.report(new Error(msg || 'test crash'), source || 'debug')
  };
  window.dbg.economy = window.dbg.economy || {};
  window.dbg.economy.snapshot   = () => economyMonitorSystem.getSnapshot();
  window.dbg.economy.anomalies  = () => economyMonitorSystem.getAnomalies();
  window.dbg.economy.dumpLast   = (n) => economyMonitorSystem.dumpLast(n);
  window.dbg.rollback = {
    snapshot: () => configRollbackSystem.snapshotGood(),
    last:     () => configRollbackSystem.getLastGood(),
    apply:    () => configRollbackSystem.rollback()
  };
} catch (e) { __liveOpsLogger.warn('dbg augment fail', e); }

} else {
  console.info('[env] Debug tools stripped in production build');
  // Nu expunem window.dbg deloc in production
}

// ========================= SYNC PERSONAJ <- STORE =========================
playerStore.onKey('currentToolId', (id) => character.setTool(id));
character.setTool(playerStore.state.currentToolId);

function syncBagVisual() {
  character.setBagFill(playerStore.bagCap > 0 ? playerStore.state.bagCoins / playerStore.bagCap : 0);
}
playerStore.onKey('bagCoins', syncBagVisual);
playerStore.onKey('bagLevel', syncBagVisual);
syncBagVisual();

let currentTool = TOOL_BY_ID[playerStore.state.currentToolId];
playerStore.onKey('currentToolId', (id) => { currentTool = TOOL_BY_ID[id]; });

// ========================= SHOP UI =========================
const shopPanel = document.getElementById('shop-panel');
const shopList = document.getElementById('shop-list');
let shopOpen = false;
let upgradeOpen = false;
let toolShopTab = 'buy';

function renderToolShop() {
  shopList.innerHTML = '';
  const tabs = document.createElement('div');
  tabs.style.cssText = 'display:flex;gap:6px;margin-bottom:8px;';
  const btnBuy = document.createElement('button');
  btnBuy.textContent = 'Cumpără';
  btnBuy.style.cssText = 'flex:1;padding:6px 10px;border-radius:6px;cursor:pointer;border:1px solid rgba(255,255,255,.2);' +
    'background:' + (toolShopTab === 'buy' ? '#3a4a68' : '#242c3c') + ';color:#fff;font:600 12px system-ui;';
  btnBuy.addEventListener('click', () => { toolShopTab = 'buy'; renderToolShop(); });
  const btnUpg = document.createElement('button');
  btnUpg.textContent = 'Upgrade';
  btnUpg.style.cssText = 'flex:1;padding:6px 10px;border-radius:6px;cursor:pointer;border:1px solid rgba(255,255,255,.2);' +
    'background:' + (toolShopTab === 'upgrade' ? '#3a4a68' : '#242c3c') + ';color:#fff;font:600 12px system-ui;';
  btnUpg.addEventListener('click', () => { toolShopTab = 'upgrade'; renderToolShop(); });
  tabs.appendChild(btnBuy);
  tabs.appendChild(btnUpg);
  shopList.appendChild(tabs);
  if (toolShopTab === 'buy') renderBuyList(); else renderUpgradeList();
}

function renderBuyList() {
  for (const t of TOOL_STATS) {
    const isOwned = playerStore.state.owned.includes(t.id);
    const isEquipped = playerStore.state.currentToolId === t.id;
    const canAfford = playerStore.totalCoins >= t.price;
    const isLocked = !unlockSystem.isToolUnlocked(t.id, playerStore.state);
    const item = document.createElement('div');
    item.className = 'shop-item';
    if (isEquipped) item.classList.add('equipped');
    else if (isLocked) item.classList.add('locked');
    else if (!isOwned && !canAfford) item.classList.add('locked');
    else if (!isOwned) item.classList.add('affordable');
    let right;
    if (isEquipped) right = '<div class="shop-status eq">ECHIPAT</div>';
    else if (isLocked) right = '<div class="shop-status">Level ' + t.unlockLevel + '</div>';
    else if (isOwned) right = '<div class="shop-status">Click pt echip</div>';
    else right = '<div class="shop-price"><span class="coin mini"></span>' + t.price + '</div>';
    item.innerHTML =
      '<div class="shop-icon">' + t.icon + '</div>' +
      '<div class="shop-info"><div class="shop-name">' + t.name + '</div>' +
      '<div class="shop-desc">' + t.desc + '</div></div>' + right;
    item.addEventListener('click', () => {
      const r = economy.buyTool(t.id);
      if (!r.ok) {
        if (r.reason === 'locked') { showBanner('Necesita Level ' + r.requiredLevel); audio.error(); haptics.heavy(); }
        else if (r.reason === 'poor') { showBanner('Nu ai destule monede'); audio.error(); haptics.heavy(); }
      } else if (r.purchased) {
        audio.pickupBig(); haptics.medium();
      }
      renderToolShop();
    });
    shopList.appendChild(item);
  }
}

function renderUpgradeList() {
  const owned = playerStore.state.owned;
  const toolsOwned = TOOL_STATS.filter(t => owned.includes(t.id));
  if (toolsOwned.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'padding:8px;color:#aab;font:400 12px system-ui;text-align:center;';
    empty.textContent = 'Cumpără o unealtă întâi';
    shopList.appendChild(empty);
    return;
  }
  for (const t of toolsOwned) {
    const upg = playerStore.state.toolUpgrades[t.id] || { power:0, speed:0, capacity:0 };
    const group = document.createElement('div');
    group.className = 'shop-item';
    group.style.flexDirection = 'column';
    group.style.alignItems = 'stretch';
    const head = document.createElement('div');
    head.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:6px;';
    head.innerHTML = '<div class="shop-icon">' + t.icon + '</div>' +
                     '<div class="shop-info"><div class="shop-name">' + t.name + '</div></div>';
    group.appendChild(head);
    for (const stat of UPGRADE_STATS) {
      const lvl = upg[stat] || 0;
      const maxed = lvl >= UPGRADE_MAX_LEVEL;
      const cost = maxed ? 0 : upgradeCost(t.price, lvl);
      const canAfford = playerStore.totalCoins >= cost;
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;' +
        'padding:5px 8px;margin:3px 0;background:rgba(255,255,255,.05);border-radius:6px;' +
        'cursor:' + (maxed || !canAfford ? 'default' : 'pointer') + ';' +
        'opacity:' + (maxed || !canAfford ? '0.5' : '1');
      const label = statLabel(stat);
      const bars = '█'.repeat(lvl) + '░'.repeat(UPGRADE_MAX_LEVEL - lvl);
      row.innerHTML = '<span style="color:#cdd6e5;font:600 12px system-ui;flex:1">' + label + '</span>' +
                      '<span style="color:#7cb8ff;font:600 11px monospace;letter-spacing:2px">' + bars + '</span>' +
                      (maxed
                        ? '<span style="color:#7d8;font:600 11px system-ui;min-width:60px;text-align:right">MAX</span>'
                        : '<span style="color:#ffc043;font:600 12px system-ui;min-width:60px;text-align:right"><span class="coin mini"></span>' + cost + '</span>');
      if (!maxed) {
        row.addEventListener('click', () => {
          const r = economy.buyToolUpgrade(t.id, stat);
          if (!r.ok) {
            if (r.reason === 'poor') { showBanner('Nu ai destule monede'); audio.error(); haptics.heavy(); }
            else if (r.reason === 'max') { showBanner('Upgrade la max'); }
          } else {
            audio.pickupBig(); haptics.medium();
          }
          renderToolShop();
        });
      }
      group.appendChild(row);
    }
    shopList.appendChild(group);
  }
}

function statLabel(s) {
  if (s === 'power') return 'Power';
  if (s === 'speed') return 'Speed';
  if (s === 'capacity') return 'Reward';
  return s;
}

function renderBagUpgrade() {
  shopList.innerHTML = '';
  const title = document.createElement('div');
  title.className = 'shop-name';
  title.style.margin = '0 0 8px';
  title.textContent = 'Upgrade sac';
  shopList.appendChild(title);
  for (let lv = 0; lv < BAG_TIERS.length; lv++) {
    const tier = BAG_TIERS[lv];
    const isCurrent = lv === playerStore.state.bagLevel;
    const isPast = lv < playerStore.state.bagLevel;
    const isNext = lv === playerStore.state.bagLevel + 1;
    const canAfford = playerStore.totalCoins >= tier.price;
    const item = document.createElement('div');
    item.className = 'shop-item';
    if (isCurrent) item.classList.add('equipped');
    else if (isNext && !canAfford) item.classList.add('locked');
    else if (isNext) item.classList.add('affordable');
    else if (!isPast) item.classList.add('locked');
    let right;
    if (isCurrent) right = '<div class="shop-status eq">ACTIV</div>';
    else if (isPast) right = '<div class="shop-status">✓</div>';
    else right = '<div class="shop-price"><span class="coin mini"></span>' + tier.price + '</div>';
    item.innerHTML =
      '<div class="shop-icon">🎒</div>' +
      '<div class="shop-info"><div class="shop-name">Sac Nv ' + (lv + 1) + '</div>' +
      '<div class="shop-desc">Capacitate: ' + tier.cap + ' monede</div></div>' + right;
    item.addEventListener('click', () => {
      if (!isNext) return;
      const r = economy.buyBagUpgrade();
      if (!r.ok && r.reason === 'poor') { showBanner('Nu ai destule monede'); audio.error(); haptics.heavy(); }
      else if (r.ok) { audio.pickupBig(); haptics.medium(); }
      renderBagUpgrade();
    });
    shopList.appendChild(item);
  }
}

playerStore.on((_s, changed) => {
  if (!shopPanel || shopPanel.style.display === 'none') return;
  if (changed.some(k => ['bagCoins','vaultCoins','owned','currentToolId','bagLevel','level','toolUpgrades'].includes(k))) {
    if (shopOpen) renderToolShop();
    else if (upgradeOpen) renderBagUpgrade();
  }
});

// (BANNER mutat mai sus in fisier, dupa audio+haptics init, pentru a fi disponibil in MissionSystem.initialize)

// ========================= PROXIMITATE SHOP / CABANA =========================
let lastCabinDrop = 0;
let lastIncompatBanner = 0;

function nearPos(px, pz, pos, r2) {
  const dx = px - pos.x, dz = pz - pos.z;
  return dx * dx + dz * dz < r2;
}

function updateShopVisibility(px, pz, tSec) {
  const nearTool  = nearPos(px, pz, SHOP_POSITIONS.tool,    SHOP_TRIGGER_R2);
  const nearUpg   = nearPos(px, pz, SHOP_POSITIONS.upgrade, SHOP_TRIGGER_R2);
  const nearCabin = nearPos(px, pz, CABIN_POSITION,         CABIN_TRIGGER_R2);
  if (nearTool && !shopOpen) { shopOpen = true; renderToolShop(); shopPanel.style.display = 'block'; }
  else if (!nearTool && shopOpen && !upgradeOpen) { shopOpen = false; shopPanel.style.display = 'none'; }
  if (nearUpg && !upgradeOpen) { upgradeOpen = true; renderBagUpgrade(); shopPanel.style.display = 'block'; }
  else if (!nearUpg && upgradeOpen && !shopOpen) { upgradeOpen = false; shopPanel.style.display = 'none'; }
  if (nearCabin && playerStore.state.bagCoins > 0 && tSec - lastCabinDrop > 0.5) {
    const dep = economy.depositToVault();
    if (dep > 0) { try { eventBus.emit(EVENTS.DEPOSIT_MADE, { amount: dep, source: 'cabin' }); } catch {} }
    if (dep > 0) { showBanner('+' + dep + ' depozitate in cabana'); audio.deposit(); haptics.success(); }
    lastCabinDrop = tSec;
  }
}

// ========================= OBIECTIV NIVEL (map clear) =========================
let levelDone = false;
function updateObjective() {
  const p = environment.getProgress ? environment.getProgress() : 0;
  playerStore.set({ progress: p });
  if (!levelDone && p >= 0.999) {
    levelDone = true;
    playerStore.incStat('jobsCompleted', 1);
    gameState.setScreen(SCREENS.LEVEL_COMPLETE);
    showBanner('NIVEL 1 COMPLET!');
    audio.levelUp();
    setTimeout(() => { if (gameState.screen === SCREENS.LEVEL_COMPLETE) gameState.setScreen(SCREENS.PLAYING); }, 2000);
  }
}

// ========================= MINIMAP =========================
const mmCanvas = document.getElementById('minimap');
const mmCtx = mmCanvas.getContext('2d');
const MM_W = mmCanvas.width;
const MM_H = mmCanvas.height;
const mapData = environment.getMapData();
let mmTimer = 0;

function drawMinimap(playerX, playerZ, playerYaw) {
  const scale = MM_W / (mapData.half * 2 + mapData.cell);
  const cx = MM_W / 2;
  const cz = MM_H / 2;
  mmCtx.fillStyle = '#1c2434';
  mmCtx.fillRect(0, 0, MM_W, MM_H);
  mmCtx.fillStyle = '#3a4152';
  const stripX0 = cx + (-1.55) * scale;
  const stripX1 = cx + ( 1.55) * scale;
  const stripZ0 = cz + (-0.6) * scale;
  const stripZ1 = cz + (15  ) * scale;
  mmCtx.fillRect(stripX0, stripZ0, stripX1 - stripX0, stripZ1 - stripZ0);

  const sstep = 4;
  const cellSize = mapData.cellStep * sstep;
  const lm = mapData.lifeMap;
  const vp = mapData.pos;
  const SEG1 = mapData.SEG + 1;
  for (let gz = 0; gz <= mapData.SEG; gz += sstep) {
    const rowBase = gz * SEG1;
    for (let gx = 0; gx <= mapData.SEG; gx += sstep) {
      const i = rowBase + gx;
      const life = lm[i];
      if (life < 0.05) continue;
      const j = i * 3;
      const worldX = vp[j];
      const worldZ = vp[j + 2];
      const alpha = 0.25 + life * 0.7;
      mmCtx.fillStyle = `rgba(240, 245, 255, ${alpha})`;
      const px = cx + worldX * scale - (cellSize * scale) / 2;
      const pz = cz + worldZ * scale - (cellSize * scale) / 2;
      mmCtx.fillRect(px, pz, cellSize * scale, cellSize * scale);
    }
  }

  mmCtx.strokeStyle = 'rgba(255,255,255,0.15)';
  mmCtx.lineWidth = 1;
  mmCtx.strokeRect(0.5, 0.5, MM_W - 1, MM_H - 1);

  const walls = environment.getWalls();
  mmCtx.strokeStyle = '#b39568';
  mmCtx.lineWidth = 2;
  for (const w of walls) {
    mmCtx.beginPath();
    mmCtx.moveTo(cx + w.x0 * scale, cz + w.z0 * scale);
    mmCtx.lineTo(cx + w.x1 * scale, cz + w.z1 * scale);
    mmCtx.stroke();
  }

  const colls = environment.getColliders();
  for (const c of colls) {
    const mx = cx + c.x * scale;
    const mz = cz + c.z * scale;
    let color = '#ffffff', size = 4, label = '';
    if (c.type === 'tree') { color = '#3ea862'; size = 5; label = '🌲'; }
    else if (c.type === 'rock') { color = '#8a8f9a'; size = 4; }
    else if (c.type === 'cabin') { color = '#a97240'; size = 10; label = '🏠'; }
    else if (c.type === 'upgrade') { color = '#3fd8ff'; size = 6; label = '▲'; }
    else if (c.type === 'tool') { color = '#ffc043'; size = 6; label = '◆'; }
    mmCtx.fillStyle = color;
    if (label) {
      mmCtx.font = 'bold ' + (size + 6) + 'px sans-serif';
      mmCtx.textAlign = 'center';
      mmCtx.textBaseline = 'middle';
      mmCtx.fillText(label, mx, mz);
    } else {
      mmCtx.beginPath();
      mmCtx.arc(mx, mz, size, 0, Math.PI * 2);
      mmCtx.fill();
    }
  }

  // Etapa 4 — highlight zona locatiei curente (cerc alb subtire)
  const curLoc = worldStore.getCurrentLocation();
  if (curLoc && curLoc.cameraFocus) {
    const mx = cx + curLoc.cameraFocus.x * scale;
    const mz = cz + curLoc.cameraFocus.z * scale;
    mmCtx.strokeStyle = 'rgba(255,255,255,0.28)';
    mmCtx.setLineDash([3, 3]);
    mmCtx.lineWidth = 1;
    mmCtx.beginPath();
    mmCtx.arc(mx, mz, 18, 0, Math.PI * 2);
    mmCtx.stroke();
    mmCtx.setLineDash([]);
  }

  // Etapa 4 — POI-uri din locatiile deblocate (mici puncte)
  const pois = worldSystem.getPOIsInMap();
  for (const p of pois) {
    if (p.type === 'shop_tool' || p.type === 'shop_upgrade' || p.type === 'cabin') continue; // deja pe collision list
    const mx = cx + p.x * scale;
    const mz = cz + p.z * scale;
    if (p.type === 'contract_zone') {
      mmCtx.fillStyle = 'rgba(120,180,255,0.55)';
      mmCtx.beginPath();
      mmCtx.arc(mx, mz, 3, 0, Math.PI * 2);
      mmCtx.fill();
    }
  }

  // Zona contractului activ — cerc auriu pulsatoriu
  const activeContract = contractStore.getActive();
  if (activeContract && activeContract.status === CONTRACT_STATUS.ACTIVE) {
    const a = activeContract.area;
    const mx = cx + a.x * scale;
    const mz = cz + a.z * scale;
    const r = a.radius * scale;
    const pulse = 0.7 + 0.3 * Math.sin(performance.now() * 0.005);
    mmCtx.strokeStyle = `rgba(255, 216, 112, ${pulse})`;
    mmCtx.lineWidth = 2;
    mmCtx.beginPath();
    mmCtx.arc(mx, mz, r, 0, Math.PI * 2);
    mmCtx.stroke();
    mmCtx.fillStyle = '#ffd870';
    mmCtx.font = 'bold 12px sans-serif';
    mmCtx.textAlign = 'center';
    mmCtx.textBaseline = 'middle';
    mmCtx.fillText('📋', mx, mz);
  }

  // Etapa 6 — vehicle markers on minimap
  if (typeof vehicleSystem !== 'undefined') {
    for (const vId of vehicleStore.state.owned) {
      const obj = vehicleSystem.getSpawned(vId);
      if (!obj) continue;
      const vmx = cx + obj.root.position.x * scale;
      const vmz = cz + obj.root.position.z * scale;
      const active = vehicleStore.state.activeVehicleId === vId;
      mmCtx.save();
      mmCtx.translate(vmx, vmz);
      mmCtx.rotate(obj.root.rotation.y);
      mmCtx.fillStyle = active ? '#3fd8a0' : '#e8b040';
      mmCtx.fillRect(-3, -5, 6, 10);
      mmCtx.restore();
    }
  }

  const ppx = cx + playerX * scale;
  const ppz = cz + playerZ * scale;
  mmCtx.save();
  mmCtx.translate(ppx, ppz);
  mmCtx.rotate(playerYaw);
  mmCtx.fillStyle = '#3fd8ff';
  mmCtx.beginPath();
  mmCtx.moveTo(0, -7);
  mmCtx.lineTo(-5, 5);
  mmCtx.lineTo(5, 5);
  mmCtx.closePath();
  mmCtx.fill();
  mmCtx.restore();
}

// ========================= CAMERA ORBIT =========================
const CAM_RADIUS = 11.7;
const CAM_LOOK_UP = 0.9;
const _desired = new THREE.Vector3();
const _look = new THREE.Vector3();

// ========================= HANDLERS BUTOANE UI =========================
const settingsBtn = document.getElementById('settings-btn');
if (settingsBtn) settingsBtn.addEventListener('click', () => settingsPanel.open());

let boostActive = false;
const useBtn = document.getElementById('use-btn');
if (useBtn) {
  const on = () => { boostActive = true; };
  const off = () => { boostActive = false; };
  useBtn.addEventListener('pointerdown', on);
  useBtn.addEventListener('pointerup', off);
  useBtn.addEventListener('pointercancel', off);
  useBtn.addEventListener('pointerleave', off);
}

window.addEventListener('keydown', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
  if (e.key === 'Escape') pauseOverlay.toggle();
  // Etapa 7 — garage shortcut
  else if (e.key === 'g' || e.key === 'G') garagePanel.toggle();
  // Etapa 6 — vehicle shortcuts
  else if (e.key === 'v' || e.key === 'V') vehicleShopPanel.toggle();
  else if (e.key === 'e' || e.key === 'E') {
    // Enter/exit vehicle
    if (vehicleStore.state.isPlayerInVehicle) {
      vehicleSystem.exitVehicle();
    } else {
      // Find nearest spawned owned vehicle
      const spawnedIds = vehicleStore.state.owned;
      let closest = null; let closestDist = Infinity;
      for (const id of spawnedIds) {
        const obj = vehicleSystem.getSpawned(id);
        if (!obj) continue;
        const d = vehicleSystem.distanceToPlayer(obj);
        if (d < closestDist) { closest = id; closestDist = d; }
      }
      if (closest) vehicleSystem.enterVehicle(closest);
      else showBanner('Nu ai vehicule spawnate. Deschide V pentru shop.');
    }
  }
});

// ========================= ETAPA 6 — Headlights =========================
// (Auto-spawn a fost declarat mai sus la linia ~398 — evitare duplicare)

// Headlights toggle per phase (poll 3s)
let _lastNightMode = null;
setInterval(() => {
  const phase = timeSystem && timeSystem.getPhase ? timeSystem.getPhase() : null;
  const wp = weatherSystem ? weatherSystem.getInterpolatedParams() : { visibility: 1 };
  const isNight = (phase && (phase.id === 'night' || phase.id === 'sunset')) || (wp.visibility < 0.5);
  if (isNight !== _lastNightMode) {
    vehicleSystem.updateHeadlights(isNight);
    _lastNightMode = isNight;
  }
}, 3000);
// initial
setTimeout(() => vehicleSystem.updateHeadlights(false), 100);

gameState.onKey('screen', (screen) => {
  if (isDebugMode()) console.log('[gameState] screen ->', screen);
});

// ========================= GAME LOOP =========================
const clock = new THREE.Clock();
let lastCoinAudio = 0;
let lastToolActiveAudio = 0;
let meltCoinsWindowStart = 0;
let meltCoinsInWindow = 0;
let accumThrottle = 0;   // Etapa 5 — snow accumulation throttle (200ms)

function isInArea(x, z, area) {
  const dx = x - area.x, dz = z - area.z;
  return dx * dx + dz * dz < area.radius * area.radius;
}

let _animErrorCount = 0;
function animate() {
  requestAnimationFrame(animate);
  try {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  const isPlaying = gameState.isPlaying() || gameState.screen === SCREENS.LEVEL_COMPLETE;

  controls.update();

  // ETAPA 5 — Time + Weather + Lighting + Fx (rulate mereu, dar respecta isPlaying intern)
  timeSystem.update(dt);
  weatherSystem.update(dt);
  lightingSystem.update(dt, character.group.position);
  weatherFxSystem.update(dt);

  // ETAPA 6 — Vehicle update (fizica + snow clearing) — doar cand isPlaying
  if (isPlaying) {
    vehicleSystem.update(dt);
  }
  vehicleHudCard.tick(dt);

  if (isPlaying) {
    environment.update(t);
    character.update(dt, t, controls.input, controls.camera.yaw);
    snowfall.update(dt, t);

    // Snow accumulation throttled 200ms
    accumThrottle += dt * 1000;
    if (accumThrottle >= 200) {
      const wParams = weatherSystem.getInterpolatedParams();
      if (wParams.accumulationMult > 0 && typeof environment.accumulate === 'function') {
        environment.accumulate(accumThrottle / 1000, wParams);
      }
      accumThrottle = 0;
    }

    const bladePts = character.getBladePoints();
    const upg = playerStore.state.toolUpgrades;
    const boostMult = boostActive ? 2 : 1;
    // Etapa 5 — weather hardness modifier: 1.0 default, ex: heavy_snow=0.85 (topeste mai usor)
    const weatherParams = weatherSystem.getInterpolatedParams();
    const weatherMult = 1 / (weatherParams.hardnessModifier || 1);
    // Etapa 12 — snow_clear_boost (accelereaza rate melt)
    let snowClearBoost = 1;
    try { if (window.__boostSystem) snowClearBoost = window.__boostSystem.getMultiplier('snow_clear_boost') || 1; } catch {}
    // Etapa 15 — Prestige snow clear multiplier (permanent)
    let prestigeSnowMult = 1;
    try { if (window.__prestigeSystem) prestigeSnowMult = window.__prestigeSystem.getMultiplier('snow_clear') || 1; } catch {}
    const melt = environment.meltAt(bladePts, character.getToolRadius(), dt * boostMult * weatherMult * snowClearBoost * prestigeSnowMult, currentTool, upg);

    if (melt.coins > 0) {
      // Etapa 12 — coin boost multiplier
      let coinBoost = 1;
      try { if (window.__boostSystem) coinBoost = window.__boostSystem.getMultiplier('coin_boost') || 1; } catch {}
      // Etapa 15 — Prestige coin multiplier (permanent)
      let prestigeCoinMult = 1;
      try { if (window.__prestigeSystem) prestigeCoinMult = window.__prestigeSystem.getMultiplier('coin') || 1; } catch {}
      const totalCoinMult = coinBoost * prestigeCoinMult;
      const grantAmount = totalCoinMult > 1 ? Math.round(melt.coins * totalCoinMult) : melt.coins;
      const added = economy.earnCoins(grantAmount);
      // Etapa 10 — event emit
      try { eventBus.emit(EVENTS.SNOW_CLEARED, { amount: melt.coins, source: 'manual' }); } catch {}
      if (added > 0) {
        try { eventBus.emit(EVENTS.COINS_EARNED, { amount: added, source: 'melt' }); } catch {}
        emitToolUsed(currentTool.id);
        grantXP(added);
        playerStore.incStat('totalCoinsEarned', added);
        playerStore.incStat('totalSnowCleared', melt.coins);
        if (t - lastCoinAudio > 0.25) {
          audio.coin();
          haptics.light();
          lastCoinAudio = t;
        }
        for (const typeId in melt.byType) {
          const n = melt.byType[typeId];
          if (n > 0) playerStore.incSnowByType(typeId, n);
        }
      }
      if (playerStore.state.bagCoins >= playerStore.bagCap) showBanner('Sacul e plin — mergi la cabana');
      if (t - meltCoinsWindowStart > 2) {
        meltCoinsWindowStart = t;
        meltCoinsInWindow = 0;
      }
      meltCoinsInWindow += added;
    }

    if (melt.touched > 0 && t - lastToolActiveAudio > 0.28) {
      audio.toolActive(currentTool.id);
      lastToolActiveAudio = t;
    }

    if (melt.rejected > 0 && melt.touched === 0 && melt.coins === 0) {
      if (t - lastIncompatBanner > 5) {
        showBanner('Ai nevoie de o unealtă mai puternică');
        audio.error();
        haptics.heavy();
        lastIncompatBanner = t;
      }
      // Raporteaza la contract activ
      contractSystem.reportRejection(1);
    }

    toolFx.emit(currentTool.id, bladePts, melt.touched > 0, character.group.rotation.y, character.getSweepDir());
    toolFx.update(dt);
    environment.regen(dt);

    updateShopVisibility(character.group.position.x, character.group.position.z, t);

    playerStore.incStat('totalPlayTimeSec', dt);

    const st = environment.getSnowTypeAt(character.group.position.x, character.group.position.z);
    hud.setSnowType(st);
    const rate = (t - meltCoinsWindowStart > 0.01) ? meltCoinsInWindow / (t - meltCoinsWindowStart) : 0;
    hud.setMeltRate(rate);

    // Contract update — verifica timer + progress + completion
    contractSystem.updateProgress(dt);

    // World update — progres per area (throttled 500ms)
    worldSystem.updateAreaProgress(dt);

    // Etapa 9 — Fleet operations tick (throttled 500ms intern)
    fleetSystem.updateOperations(dt);
  }

  mmTimer += dt;
  if (mmTimer > 0.1) {
    mmTimer = 0;
    drawMinimap(character.group.position.x, character.group.position.z, character.group.rotation.y);
    if (isPlaying) updateObjective();
    // Etapa 7 — garage proximity trigger button (throttle 100ms)
    if (garageSystem && garagePanel) {
      const near = garageSystem.isPlayerNearGarage(character.group.position);
      garagePanel.setHudTriggerVisible(near && isPlaying && !garagePanel.isOpen());
    }
  }

  const yaw = controls.camera.yaw;
  const pitch = controls.camera.pitch;
  // Etapa 6 — camera vehicle mode override
  const inVehicle = vehicleStore.state.isPlayerInVehicle;
  const activeVehObj = inVehicle ? vehicleSystem.getSpawnedActive() : null;
  let followX, followY, followZ;
  let camRadius = CAM_RADIUS;
  if (activeVehObj) {
    followX = activeVehObj.root.position.x;
    followY = activeVehObj.root.position.y;
    followZ = activeVehObj.root.position.z;
    camRadius = CAM_RADIUS * 1.5;
  } else {
    const cp0 = character.group.position;
    followX = cp0.x; followY = cp0.y; followZ = cp0.z;
  }
  const horiz = camRadius * Math.cos(pitch);
  const vert  = camRadius * Math.sin(pitch);
  _desired.set(followX + Math.sin(yaw) * horiz, followY + vert, followZ + Math.cos(yaw) * horiz);
  camera.position.lerp(_desired, Math.min(1, 8 * dt));
  const lookUp = activeVehObj ? 1.5 : CAM_LOOK_UP;
  _look.set(followX, followY + lookUp, followZ);
  camera.lookAt(_look);

  // Sun position controlled by LightingSystem (Etapa 5) — nu suprascriem aici

  renderer.render(scene, camera);
  // ETAPA 16 — performance monitor tick (o data per frame)
  try { if (typeof performanceMonitor !== 'undefined' && performanceMonitor) performanceMonitor.tick(); } catch {}
  } catch (err) {
    if (_animErrorCount < 5) {
      console.error('[animate loop error]', err);
      _animErrorCount++;
    }
    // ETAPA 16 — escalate at 3 errors within short window to ErrorRecoverySystem overlay
    if (_animErrorCount === 3) {
      try { if (typeof errorRecoverySystem !== 'undefined' && errorRecoverySystem) errorRecoverySystem.show(err, 'animate', () => { _animErrorCount = 0; }); } catch {}
    }
  }
}
// ETAPA 16 — finish splash then start
try {
  splashScreen.setProgress(100, 'Gata!');
  setTimeout(() => { try { splashScreen.hide(); } catch {} }, 250);
} catch {}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
