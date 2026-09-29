// ETAPA 16 — Quality preset applier.
// Aplica un preset la renderer + scene + snow field. Persista in SettingsStore.
// Manual override (non-'auto') blocheaza auto-degrade.

import { QUALITY_PRESETS, QUALITY_ORDER, detectDeviceTier, isValidPreset, stepDownPreset } from '../config/quality.js?v=25';

export function createQualitySystem({ settingsStore, renderer, scene, sun, transactionLog, showBanner } = {}) {
  let currentPresetId = 'medium';
  let manualOverride = false;      // true daca user a ales explicit
  let autoDegradedFrom = null;     // presetul de dinainte de auto-degrade
  let lastDegradeAt = 0;

  function _readStoredPreset() {
    if (!settingsStore) return 'auto';
    const q = settingsStore.state && settingsStore.state.quality;
    return q || 'auto';
  }

  function _persist(id, isAuto) {
    if (!settingsStore) return;
    settingsStore.set({ quality: isAuto ? 'auto' : id });
  }

  function getCurrent() {
    return { id: currentPresetId, preset: QUALITY_PRESETS[currentPresetId], manualOverride };
  }

  function autoDetect() {
    const detected = detectDeviceTier();
    apply(detected, { source: 'auto' });
    return detected;
  }

  function apply(presetId, opts = {}) {
    if (!isValidPreset(presetId)) return { ok: false, reason: 'invalid_preset' };
    const preset = QUALITY_PRESETS[presetId];
    currentPresetId = presetId;
    manualOverride = opts.source === 'manual';

    // Apply to renderer
    if (renderer) {
      try {
        renderer.setPixelRatio(preset.pixelRatio);
        renderer.shadowMap.enabled = !!preset.shadowsEnabled;
        if (renderer.shadowMap && preset.shadowsEnabled) {
          renderer.shadowMap.needsUpdate = true;
        }
      } catch (e) { /* silent */ }
    }
    // Apply to sun light (shadow map size)
    if (sun && sun.shadow && sun.shadow.map) {
      try {
        if (preset.shadowMapSize && sun.shadow.mapSize.width !== preset.shadowMapSize) {
          sun.shadow.mapSize.set(preset.shadowMapSize, preset.shadowMapSize);
          if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
        }
        sun.castShadow = !!preset.shadowsEnabled;
      } catch {}
    }
    // Apply to scene fog
    if (scene && scene.fog) {
      try {
        scene.fog.near = preset.fogNear;
        scene.fog.far = preset.fogFar;
      } catch {}
    }

    if (transactionLog && typeof transactionLog.log === 'function') {
      try { transactionLog.log({ type: 'QUALITY_CHANGE', meta: { preset: presetId, source: opts.source || 'manual' } }); } catch {}
    }
    _persist(presetId, opts.source === 'auto' && !manualOverride);
    return { ok: true, preset: presetId };
  }

  function initFromSettings() {
    const stored = _readStoredPreset();
    if (stored === 'auto' || !isValidPreset(stored)) {
      autoDetect();
    } else {
      apply(stored, { source: 'manual' });
    }
  }

  // Numit de PerformanceMonitor la degrade continuu.
  function onPerformanceDegrade(avg, target) {
    if (manualOverride) return { ok: false, reason: 'manual_override' };
    const now = Date.now();
    if (now - lastDegradeAt < 15000) return { ok: false, reason: 'cooldown' };
    const next = stepDownPreset(currentPresetId);
    if (next === currentPresetId) return { ok: false, reason: 'already_min' };
    autoDegradedFrom = currentPresetId;
    apply(next, { source: 'auto' });
    lastDegradeAt = now;
    if (transactionLog && typeof transactionLog.log === 'function') {
      try { transactionLog.log({ type: 'PERFORMANCE_DEGRADE', meta: { from: autoDegradedFrom, to: next, avgFps: Math.round(avg), targetFps: target } }); } catch {}
    }
    if (typeof showBanner === 'function') {
      try { showBanner('Grafică redusă auto pentru performanță (' + Math.round(avg) + ' FPS)'); } catch {}
    }
    return { ok: true, to: next };
  }

  function setManualOverride(on) {
    manualOverride = !!on;
  }

  return {
    apply,
    getCurrent,
    autoDetect,
    initFromSettings,
    onPerformanceDegrade,
    setManualOverride,
    presetOrder: QUALITY_ORDER,
    presets: QUALITY_PRESETS
  };
}
