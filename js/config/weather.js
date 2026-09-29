// ETAPA 5 — WEATHER TYPES CONFIG
// Sursa unica de adevar pentru toate profilele meteo.
// Consumat de: WeatherSystem, LightingSystem, WeatherFxSystem, HUD.

export const WEATHER_TYPES = Object.freeze({
  CLEAR: {
    id: 'clear', name: 'Senin', icon: '☀️',
    snowfallRate: 0, windStrength: 0.1, visibility: 1.0,
    temperature: -2, accumulationMult: 0, hardnessModifier: 1.0,
    fogNear: 90, fogFar: 220, fogColor: 0xdfe7f7,
    sunColorMult: [1.0, 1.0, 1.0], sunIntensityMult: 1.0,
    hemiIntensityMult: 1.0,
    audio: 'ambience_calm', durationMin: 90, durationMax: 240,
    difficultyMod: 1.0
  },
  LIGHT_SNOW: {
    id: 'light_snow', name: 'Ninsoare ușoară', icon: '🌨️',
    snowfallRate: 0.3, windStrength: 0.3, visibility: 0.85,
    temperature: -5, accumulationMult: 0.5, hardnessModifier: 0.9,
    fogNear: 70, fogFar: 160, fogColor: 0xd8dfea,
    sunColorMult: [0.92, 0.94, 0.98], sunIntensityMult: 0.75,
    hemiIntensityMult: 0.9,
    audio: 'wind_light', durationMin: 60, durationMax: 180,
    difficultyMod: 1.1
  },
  HEAVY_SNOW: {
    id: 'heavy_snow', name: 'Ninsoare intensă', icon: '❄️',
    snowfallRate: 0.8, windStrength: 0.5, visibility: 0.65,
    temperature: -8, accumulationMult: 1.5, hardnessModifier: 0.85,
    fogNear: 40, fogFar: 110, fogColor: 0xc8cfda,
    sunColorMult: [0.75, 0.80, 0.90], sunIntensityMult: 0.5,
    hemiIntensityMult: 0.7,
    audio: 'wind_medium', durationMin: 60, durationMax: 150,
    difficultyMod: 1.35
  },
  WIND: {
    id: 'wind', name: 'Vânt', icon: '💨',
    snowfallRate: 0.1, windStrength: 1.0, visibility: 0.80,
    temperature: -6, accumulationMult: 0.2, hardnessModifier: 1.05,
    fogNear: 70, fogFar: 170, fogColor: 0xd2d8e0,
    sunColorMult: [0.9, 0.9, 0.95], sunIntensityMult: 0.85,
    hemiIntensityMult: 0.85,
    audio: 'wind_strong', durationMin: 45, durationMax: 120,
    difficultyMod: 1.15
  },
  BLIZZARD: {
    id: 'blizzard', name: 'Viscol', icon: '🌪️',
    snowfallRate: 1.0, windStrength: 1.0, visibility: 0.35,
    temperature: -14, accumulationMult: 2.5, hardnessModifier: 0.7,
    fogNear: 15, fogFar: 60, fogColor: 0xa8b0bc,
    sunColorMult: [0.5, 0.55, 0.65], sunIntensityMult: 0.3,
    hemiIntensityMult: 0.5,
    audio: 'wind_extreme', durationMin: 45, durationMax: 90,
    difficultyMod: 1.6
  },
  FOG: {
    id: 'fog', name: 'Ceață', icon: '🌫️',
    snowfallRate: 0.05, windStrength: 0.05, visibility: 0.45,
    temperature: -3, accumulationMult: 0.1, hardnessModifier: 1.0,
    fogNear: 8, fogFar: 45, fogColor: 0xc0c8d0,
    sunColorMult: [0.85, 0.85, 0.88], sunIntensityMult: 0.55,
    hemiIntensityMult: 0.75,
    audio: 'ambience_muffled', durationMin: 60, durationMax: 180,
    difficultyMod: 1.2
  },
  FREEZING_RAIN: {
    id: 'freezing_rain', name: 'Ploaie înghețată', icon: '🌧️',
    snowfallRate: 0.2, windStrength: 0.4, visibility: 0.7,
    temperature: -1, accumulationMult: 0.3, hardnessModifier: 1.2,
    fogNear: 50, fogFar: 130, fogColor: 0xb8bcc2,
    sunColorMult: [0.7, 0.75, 0.82], sunIntensityMult: 0.5,
    hemiIntensityMult: 0.8,
    audio: 'rain_light', durationMin: 45, durationMax: 120,
    difficultyMod: 1.4,
    iceGenerationChance: 0.15
  }
});

export const WEATHER_LIST = Object.values(WEATHER_TYPES);
export const WEATHER_BY_ID = Object.fromEntries(WEATHER_LIST.map(w => [w.id, w]));

// Distributie ponderata per regiune. Consumat de WeatherSystem.selectNextWeather()
export const REGION_WEATHER = {
  starter:    { clear: 40, light_snow: 30, heavy_snow: 15, wind: 5,  blizzard: 3,  fog: 5, freezing_rain: 2 },
  town:       { clear: 35, light_snow: 25, heavy_snow: 18, wind: 8,  blizzard: 4,  fog: 7, freezing_rain: 3 },
  industrial: { clear: 30, light_snow: 22, heavy_snow: 22, wind: 10, blizzard: 6,  fog: 6, freezing_rain: 4 },
  mountain:   { clear: 15, light_snow: 15, heavy_snow: 25, wind: 15, blizzard: 20, fog: 5, freezing_rain: 5 }
};

// Weighted pick din tabela {id: weight}
export function pickWeightedWeatherId(table) {
  const entries = Object.entries(table).filter(([k]) => WEATHER_BY_ID[k]);
  if (!entries.length) return 'clear';
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [id, w] of entries) {
    r -= w;
    if (r <= 0) return id;
  }
  return entries[0][0];
}

// Random duration in secunde intre [durationMin, durationMax]
export function pickDuration(weather) {
  const min = weather.durationMin || 60;
  const max = weather.durationMax || 180;
  return min + Math.random() * (max - min);
}
