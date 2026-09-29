// ETAPA 5 — LightingSystem
// Modifica luminile Three.js EXISTENTE (sun, hemi, fill, fog) — NU creeaza altele noi.
// Blend fluid intre faze + weather.

import * as THREE from 'three';
import { PHASE_LIGHTING, phaseForHour, phaseProgress, lightingForPhase, lerpLighting, lerpHex } from '../config/timeOfDay.js';

export function createLightingSystem({ scene, sun, sunTarget, hemi, fill, fog, timeSystem, weatherSystem, settingsStore }) {
  // Cache colors reused pentru a evita alocari
  const _c1 = new THREE.Color();
  const _c2 = new THREE.Color();
  const _c3 = new THREE.Color();

  // Smoothing state pentru anti-flicker
  const smooth = {
    sunR: sun.color.r, sunG: sun.color.g, sunB: sun.color.b, sunI: sun.intensity,
    hemiR: hemi.color.r, hemiG: hemi.color.g, hemiB: hemi.color.b,
    hemiGR: hemi.groundColor.r, hemiGG: hemi.groundColor.g, hemiGB: hemi.groundColor.b,
    hemiI: hemi.intensity,
    fogNear: fog.near, fogFar: fog.far,
    fogR: fog.color.r, fogG: fog.color.g, fogB: fog.color.b,
    sunX: sun.position.x, sunY: sun.position.y, sunZ: sun.position.z
  };

  function updateSunPosition(cp, lightingProfile) {
    // Sun position: orbit around player, azimuth = 0..1 (0 = east, 0.5 = south, 1 = west)
    const az = lightingProfile.sunAzimuth * Math.PI - Math.PI / 2;
    const height = lightingProfile.sunHeight; // -0.3..1
    // Simple: place sun on hemisphere
    const dist = 30;
    const y = height * dist;
    const horiz = Math.cos(Math.asin(Math.max(-0.9, Math.min(0.9, height)))) * dist;
    const x = cp.x + Math.cos(az) * horiz;
    const z = cp.z + Math.sin(az) * horiz;
    return { x, y: Math.max(2, y + 8), z };
  }

  function update(realDeltaSec, playerPos) {
    // Faza curenta + progres
    const hour = timeSystem.getHour();
    const phase = timeSystem.getPhase();
    const t = timeSystem.getPhaseProgress();
    const nextPhaseId = _nextPhaseId(phase.id);
    const phaseA = lightingForPhase(phase.id);
    const phaseB = lightingForPhase(nextPhaseId);
    // Blend factor accentuat catre sfarsitul fazei (smooth in ultima 30% din faza)
    const blend = _blendCurve(t);
    const phaseLighting = lerpLighting(phaseA, phaseB, blend);

    // Weather params
    const w = weatherSystem.getInterpolatedParams();

    // Final colors + intensities
    const finalSunR = phaseLighting.sunColor[0] * w.sunColorMult[0];
    const finalSunG = phaseLighting.sunColor[1] * w.sunColorMult[1];
    const finalSunB = phaseLighting.sunColor[2] * w.sunColorMult[2];
    const finalSunI = phaseLighting.sunIntensity * w.sunIntensityMult;

    const finalHemiI = phaseLighting.hemiIntensity * w.hemiIntensityMult;

    // Fog params — combine phase.ambient (day = mai clar, night = mai dense)
    const ambient = phaseLighting.ambient;
    const finalFogNear = w.fogNear * (0.4 + 0.6 * ambient);
    const finalFogFar  = w.fogFar  * (0.5 + 0.5 * ambient);
    // Fog color = mix intre weather + phase hemiSky (sensation ambient)
    const fogMixed = lerpHex(w.fogColor, phaseLighting.hemiSky, 0.35);

    // Smoothing factor
    const k = Math.min(1, realDeltaSec * 3);

    // Apply cu smoothing
    smooth.sunR += (finalSunR - smooth.sunR) * k;
    smooth.sunG += (finalSunG - smooth.sunG) * k;
    smooth.sunB += (finalSunB - smooth.sunB) * k;
    smooth.sunI += (finalSunI - smooth.sunI) * k;
    sun.color.setRGB(smooth.sunR, smooth.sunG, smooth.sunB);
    sun.intensity = smooth.sunI;

    // Hemi
    _c1.setHex(phaseLighting.hemiSky);
    _c2.setHex(phaseLighting.hemiGround);
    smooth.hemiR += (_c1.r - smooth.hemiR) * k;
    smooth.hemiG += (_c1.g - smooth.hemiG) * k;
    smooth.hemiB += (_c1.b - smooth.hemiB) * k;
    smooth.hemiGR += (_c2.r - smooth.hemiGR) * k;
    smooth.hemiGG += (_c2.g - smooth.hemiGG) * k;
    smooth.hemiGB += (_c2.b - smooth.hemiGB) * k;
    smooth.hemiI  += (finalHemiI - smooth.hemiI) * k;
    hemi.color.setRGB(smooth.hemiR, smooth.hemiG, smooth.hemiB);
    hemi.groundColor.setRGB(smooth.hemiGR, smooth.hemiGG, smooth.hemiGB);
    hemi.intensity = smooth.hemiI;

    // Fog
    smooth.fogNear += (finalFogNear - smooth.fogNear) * k;
    smooth.fogFar  += (finalFogFar - smooth.fogFar) * k;
    fog.near = smooth.fogNear;
    fog.far = smooth.fogFar;
    _c3.setHex(fogMixed);
    smooth.fogR += (_c3.r - smooth.fogR) * k;
    smooth.fogG += (_c3.g - smooth.fogG) * k;
    smooth.fogB += (_c3.b - smooth.fogB) * k;
    fog.color.setRGB(smooth.fogR, smooth.fogG, smooth.fogB);
    // scene.background follows fog color for cohesive look
    if (scene.background && scene.background.isColor) {
      scene.background.setRGB(smooth.fogR, smooth.fogG, smooth.fogB);
    }

    // Sun position (follow player)
    if (playerPos) {
      const p = updateSunPosition(playerPos, phaseLighting);
      smooth.sunX += (p.x - smooth.sunX) * k;
      smooth.sunY += (p.y - smooth.sunY) * k;
      smooth.sunZ += (p.z - smooth.sunZ) * k;
      sun.position.set(smooth.sunX, smooth.sunY, smooth.sunZ);
      if (sunTarget) {
        sunTarget.position.copy(playerPos);
      }
    }

    // Fill light — subtle boost la night pentru readability
    if (fill) {
      const nightBoost = phaseLighting.ambient < 0.5 ? 1.5 : 1.0;
      fill.intensity = 0.2 * nightBoost;
    }
  }

  function _nextPhaseId(id) {
    const order = ['dawn','morning','day','evening','sunset','night'];
    const i = order.indexOf(id);
    return order[(i + 1) % order.length];
  }

  function _blendCurve(t) {
    // Blend accentuat in ultima 30% din faza
    if (t < 0.7) return 0;
    return (t - 0.7) / 0.3;
  }

  // Callback pentru building/street lights — activat via nightLights flag
  const lightListeners = new Set();
  function onNightModeChange(cb) { lightListeners.add(cb); return () => lightListeners.delete(cb); }

  let lastNightMode = null;
  function checkNightMode() {
    const phase = timeSystem.getPhase();
    const lp = lightingForPhase(phase.id);
    const nightMode = !!lp.nightLights;
    if (nightMode !== lastNightMode) {
      lastNightMode = nightMode;
      for (const cb of lightListeners) cb(nightMode);
    }
  }

  return {
    update(realDeltaSec, playerPos) {
      update(realDeltaSec, playerPos);
      checkNightMode();
    },
    onNightModeChange,
    isNightMode() { return lastNightMode === true; }
  };
}
