// ETAPA 16 — Battery saver: pornire manuala sau auto pe baterie < 20% + not charging.
// Auto-throttle pe hidden tab (visibility). Applica reduceri fps + FX.

export function createBatterySaverSystem({ settingsStore, qualitySystem, performanceMonitor, transactionLog, showBanner, snowfall, weatherFxSystem } = {}) {
  let batteryApi = null;
  let batteryLevel = 1.0;
  let batteryCharging = true;
  let promptedThisSession = false;
  let saverActive = false;
  let hiddenPaused = false;
  let onChangeListeners = new Set();

  function _persistToggle(on) {
    if (!settingsStore) return;
    settingsStore.set({ batterySaver: !!on });
  }

  function _readStoredToggle() {
    if (!settingsStore || !settingsStore.state) return false;
    return !!settingsStore.state.batterySaver;
  }

  function isActive() { return saverActive; }

  function apply(on) {
    saverActive = !!on;
    if (performanceMonitor && typeof performanceMonitor.setTarget === 'function') {
      performanceMonitor.setTarget(saverActive ? 20 : 60);
    }
    if (snowfall && typeof snowfall.setDensity === 'function') {
      try { snowfall.setDensity(saverActive ? 0.15 : 1.0); } catch {}
    }
    if (weatherFxSystem && typeof weatherFxSystem.setIntensity === 'function') {
      try { weatherFxSystem.setIntensity(saverActive ? 0.3 : 1.0); } catch {}
    }
    if (document && document.body) {
      document.body.classList.toggle('battery-saver-active', saverActive);
    }
    _persistToggle(saverActive);
    if (transactionLog && typeof transactionLog.log === 'function') {
      try { transactionLog.log({ type: saverActive ? 'BATTERY_SAVER_ON' : 'BATTERY_SAVER_OFF', meta: { level: batteryLevel, charging: batteryCharging } }); } catch {}
    }
    for (const cb of onChangeListeners) { try { cb(saverActive); } catch {} }
    if (typeof showBanner === 'function') {
      try { showBanner(saverActive ? '🔋 Battery Saver ON' : '🔋 Battery Saver OFF'); } catch {}
    }
  }

  function toggle(on) {
    if (typeof on === 'boolean') apply(on);
    else apply(!saverActive);
  }

  function _onBatteryChange() {
    if (!batteryApi) return;
    batteryLevel = batteryApi.level;
    batteryCharging = batteryApi.charging;
    if (!promptedThisSession && batteryLevel < 0.2 && !batteryCharging && !saverActive) {
      promptedThisSession = true;
      if (typeof showBanner === 'function') {
        try { showBanner('🔋 Baterie sub 20% — activează Battery Saver din Setări'); } catch {}
      }
    }
  }

  async function install() {
    if (typeof navigator === 'undefined') return;
    // Restore setting
    if (_readStoredToggle()) apply(true);
    // Battery API
    if (typeof navigator.getBattery === 'function') {
      try {
        batteryApi = await navigator.getBattery();
        batteryLevel = batteryApi.level;
        batteryCharging = batteryApi.charging;
        batteryApi.addEventListener('levelchange', _onBatteryChange);
        batteryApi.addEventListener('chargingchange', _onBatteryChange);
        _onBatteryChange();
      } catch { /* not supported */ }
    }
    // Visibility auto-throttle
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        const hidden = document.visibilityState === 'hidden';
        if (hidden && !hiddenPaused) {
          hiddenPaused = true;
          if (performanceMonitor && typeof performanceMonitor.setTarget === 'function') {
            performanceMonitor.setTarget(5);
          }
        } else if (!hidden && hiddenPaused) {
          hiddenPaused = false;
          if (performanceMonitor && typeof performanceMonitor.setTarget === 'function') {
            performanceMonitor.setTarget(saverActive ? 20 : 60);
          }
        }
      });
    }
  }

  function on(cb) { if (typeof cb === 'function') onChangeListeners.add(cb); return () => onChangeListeners.delete(cb); }

  function getStatus() {
    return { active: saverActive, level: batteryLevel, charging: batteryCharging, api: !!batteryApi };
  }

  function _mock(level, charging) {
    batteryLevel = Number(level);
    batteryCharging = !!charging;
    _onBatteryChange();
  }

  return { install, apply, toggle, isActive, on, getStatus, _mock };
}
