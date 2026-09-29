// ETAPA 5 — WeatherSystem
// Orchestreaza schimbarea si tranzitia meteo.
// Nu atinge DOM. Nu deține state — modifică WeatherStore.

import { WEATHER_BY_ID, WEATHER_LIST, REGION_WEATHER, pickWeightedWeatherId, pickDuration } from '../config/weather.js';

const TRANSITION_SEC = 8; // durata tranzitiei intre 2 vremi

function lerp(a, b, t) { return a + (b - a) * t; }
function lerpHex(h1, h2, t) {
  const r1 = (h1 >> 16) & 0xff, g1 = (h1 >> 8) & 0xff, b1 = h1 & 0xff;
  const r2 = (h2 >> 16) & 0xff, g2 = (h2 >> 8) & 0xff, b2 = h2 & 0xff;
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return (r << 16) | (g << 8) | b;
}

export function createWeatherSystem({ weatherStore, timeStore, worldStore, gameState, transactionLog, audio }) {

  function getCurrent() {
    return WEATHER_BY_ID[weatherStore.state.currentWeatherId] || WEATHER_BY_ID.clear;
  }

  function getPrevious() {
    const id = weatherStore.state.previousWeatherId;
    return id ? (WEATHER_BY_ID[id] || null) : null;
  }

  function getRegionTable() {
    const rid = (worldStore && worldStore.state && worldStore.state.currentRegionId) || 'starter';
    return REGION_WEATHER[rid] || REGION_WEATHER.starter;
  }

  function selectNextWeather() {
    const table = getRegionTable();
    // evita repetarea imediata a aceleiasi vremi (halveaza greutatea)
    const currentId = weatherStore.state.currentWeatherId;
    const adjusted = { ...table };
    if (adjusted[currentId] != null) adjusted[currentId] = Math.max(1, Math.floor(adjusted[currentId] / 2));
    return pickWeightedWeatherId(adjusted);
  }

  function setWeather(id, opts = {}) {
    const w = WEATHER_BY_ID[id];
    if (!w) return false;
    const prev = weatherStore.state.currentWeatherId;
    const ok = weatherStore.setWeather(id, opts);
    if (ok && transactionLog && prev !== id) {
      transactionLog.log({
        type: 'WEATHER_CHANGE',
        currency: null,
        amount: 0,
        balanceAfter: null,
        meta: {
          from: prev,
          to: id,
          region: (worldStore && worldStore.state) ? worldStore.state.currentRegionId : null,
          durationSec: weatherStore.state.weatherDurationSec
        }
      });
    }
    return ok;
  }

  function update(realDeltaSec) {
    if (gameState && !gameState.isPlaying()) return;
    // Advance transition progress
    if (weatherStore.state.transitionProgress < 1.0) {
      const step = realDeltaSec / TRANSITION_SEC;
      const next = Math.min(1.0, weatherStore.state.transitionProgress + step);
      weatherStore.set({ transitionProgress: next });
    }
    // Check duration -> select next weather
    const elapsedSec = weatherStore.getElapsedSec();
    if (elapsedSec >= weatherStore.state.weatherDurationSec) {
      const nextId = selectNextWeather();
      setWeather(nextId);
    }
    // Update temperature (smooth toward target)
    const w = getCurrent();
    const targetTemp = w.temperature;
    const curTemp = weatherStore.state.temperature;
    if (Math.abs(targetTemp - curTemp) > 0.01) {
      const newTemp = curTemp + (targetTemp - curTemp) * Math.min(1, realDeltaSec * 0.5);
      weatherStore.set({ temperature: newTemp });
    }
  }

  // Interpolare params intre prev si current pe transitionProgress
  function getInterpolatedParams() {
    const cur = getCurrent();
    const prev = getPrevious();
    const t = weatherStore.state.transitionProgress;
    if (!prev || t >= 1.0) {
      return { ...cur, _blend: 1.0 };
    }
    return {
      id: cur.id,
      name: cur.name,
      icon: cur.icon,
      snowfallRate: lerp(prev.snowfallRate, cur.snowfallRate, t),
      windStrength: lerp(prev.windStrength, cur.windStrength, t),
      visibility:   lerp(prev.visibility, cur.visibility, t),
      temperature:  lerp(prev.temperature, cur.temperature, t),
      accumulationMult: lerp(prev.accumulationMult, cur.accumulationMult, t),
      hardnessModifier: lerp(prev.hardnessModifier, cur.hardnessModifier, t),
      fogNear:      lerp(prev.fogNear, cur.fogNear, t),
      fogFar:       lerp(prev.fogFar, cur.fogFar, t),
      fogColor:     lerpHex(prev.fogColor, cur.fogColor, t),
      sunColorMult: [
        lerp(prev.sunColorMult[0], cur.sunColorMult[0], t),
        lerp(prev.sunColorMult[1], cur.sunColorMult[1], t),
        lerp(prev.sunColorMult[2], cur.sunColorMult[2], t)
      ],
      sunIntensityMult:  lerp(prev.sunIntensityMult, cur.sunIntensityMult, t),
      hemiIntensityMult: lerp(prev.hemiIntensityMult, cur.hemiIntensityMult, t),
      difficultyMod: lerp(prev.difficultyMod || 1, cur.difficultyMod || 1, t),
      iceGenerationChance: lerp(prev.iceGenerationChance || 0, cur.iceGenerationChance || 0, t),
      _blend: t
    };
  }

  function getVisibility() {
    return getInterpolatedParams().visibility;
  }

  function getDifficultyMod() {
    return getInterpolatedParams().difficultyMod || 1;
  }

  function getForecast() {
    const cur = getCurrent();
    const elapsed = weatherStore.getElapsedSec();
    const remaining = weatherStore.getRemainingSec();
    return {
      current: cur,
      timeElapsed: elapsed,
      timeRemaining: remaining,
      // Nu ghicim nextWeather; e random weighted, deci nu-l afisam ca "confirmat"
      nextWeather: null
    };
  }

  function forceInit() {
    // La boot, daca weatherStore e in stare default, alege o vreme random pentru regiunea curenta
    if (!weatherStore.state.previousWeatherId && weatherStore.state.currentWeatherId === 'clear' && weatherStore.state.transitionProgress === 1.0) {
      // Setam durata deja aleasa pentru starea curenta (asa evitam un skip imediat)
      const w = WEATHER_BY_ID.clear;
      weatherStore.set({ weatherDurationSec: pickDuration(w), weatherStartedAt: Date.now() });
    }
  }

  return {
    getCurrent, getPrevious,
    setWeather, selectNextWeather,
    update, getInterpolatedParams,
    getVisibility, getDifficultyMod, getForecast,
    forceInit, TRANSITION_SEC
  };
}
