// ETAPA 5 — TIME OF DAY CONFIG
// Faze ale zilei + profile de lighting per faza.
// Consumat de: TimeSystem, LightingSystem, HUD (WeatherHudCard).

export const TIME_PHASES = Object.freeze({
  DAWN:    { id: 'dawn',    name: 'Zori',      startHour: 5,  endHour: 7,  icon: '🌅' },
  MORNING: { id: 'morning', name: 'Dimineață', startHour: 7,  endHour: 11, icon: '🌤️' },
  DAY:     { id: 'day',     name: 'Zi',        startHour: 11, endHour: 17, icon: '☀️' },
  EVENING: { id: 'evening', name: 'Seară',     startHour: 17, endHour: 20, icon: '🌇' },
  SUNSET:  { id: 'sunset',  name: 'Apus',      startHour: 20, endHour: 22, icon: '🌆' },
  NIGHT:   { id: 'night',   name: 'Noapte',    startHour: 22, endHour: 5,  icon: '🌙' }
});

export const PHASE_LIST = Object.values(TIME_PHASES);
export const PHASE_BY_ID = Object.fromEntries(PHASE_LIST.map(p => [p.id, p]));

// Returneaza faza pentru o ora (float 0..24)
export function phaseForHour(hour) {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 5  && h < 7)  return TIME_PHASES.DAWN;
  if (h >= 7  && h < 11) return TIME_PHASES.MORNING;
  if (h >= 11 && h < 17) return TIME_PHASES.DAY;
  if (h >= 17 && h < 20) return TIME_PHASES.EVENING;
  if (h >= 20 && h < 22) return TIME_PHASES.SUNSET;
  return TIME_PHASES.NIGHT;
}

// Returneaza urmatoarea faza (in ordine ciclica)
export function nextPhaseAfter(phase) {
  const order = ['dawn','morning','day','evening','sunset','night'];
  const i = order.indexOf(phase.id);
  return TIME_PHASES[order[(i + 1) % order.length].toUpperCase()];
}

// Progres in cadrul fazei curente (0..1)
export function phaseProgress(hour) {
  const h = ((hour % 24) + 24) % 24;
  const phase = phaseForHour(h);
  let start = phase.startHour;
  let end = phase.endHour;
  // Night wraps 22 -> 5
  if (phase.id === 'night') {
    if (h >= 22) return (h - 22) / (24 - 22 + 5);
    return (24 - 22 + h) / (24 - 22 + 5);
  }
  return (h - start) / (end - start);
}

// Profile lighting per faza — Sun position + colors + intensities
export const PHASE_LIGHTING = {
  dawn:    { sunHeight: 0.15, sunAzimuth: 0.15, sunColor: [1.0, 0.85, 0.75], sunIntensity: 1.4, hemiSky: 0xc8a4a0, hemiGround: 0x5a4a45, hemiIntensity: 0.45, ambient: 0.65, nightLights: false },
  morning: { sunHeight: 0.55, sunAzimuth: 0.30, sunColor: [1.0, 0.98, 0.94], sunIntensity: 2.6, hemiSky: 0xa8c0dc, hemiGround: 0x3a4152, hemiIntensity: 0.42, ambient: 1.0,  nightLights: false },
  day:     { sunHeight: 0.95, sunAzimuth: 0.50, sunColor: [1.0, 1.0, 1.0],   sunIntensity: 3.0, hemiSky: 0x9fb4d6, hemiGround: 0x3a4152, hemiIntensity: 0.4,  ambient: 1.1,  nightLights: false },
  evening: { sunHeight: 0.45, sunAzimuth: 0.70, sunColor: [1.0, 0.82, 0.68], sunIntensity: 2.2, hemiSky: 0xd0a888, hemiGround: 0x4a3f38, hemiIntensity: 0.42, ambient: 0.85, nightLights: false },
  sunset:  { sunHeight: 0.15, sunAzimuth: 0.82, sunColor: [1.0, 0.55, 0.40], sunIntensity: 1.3, hemiSky: 0xa8788c, hemiGround: 0x40303a, hemiIntensity: 0.4,  ambient: 0.55, nightLights: true },
  night:   { sunHeight: -0.2, sunAzimuth: 0.90, sunColor: [0.55, 0.65, 0.90], sunIntensity: 0.35, hemiSky: 0x1a2438, hemiGround: 0x0a0e18, hemiIntensity: 0.28, ambient: 0.25, nightLights: true }
};

export function lightingForPhase(phaseId) {
  return PHASE_LIGHTING[phaseId] || PHASE_LIGHTING.day;
}

// Interpolare intre 2 profile lighting (t = 0..1)
export function lerpLighting(a, b, t) {
  const clamp = Math.max(0, Math.min(1, t));
  const lerp = (x, y) => x + (y - x) * clamp;
  return {
    sunHeight: lerp(a.sunHeight, b.sunHeight),
    sunAzimuth: lerp(a.sunAzimuth, b.sunAzimuth),
    sunColor: [
      lerp(a.sunColor[0], b.sunColor[0]),
      lerp(a.sunColor[1], b.sunColor[1]),
      lerp(a.sunColor[2], b.sunColor[2])
    ],
    sunIntensity: lerp(a.sunIntensity, b.sunIntensity),
    hemiSky: lerpHex(a.hemiSky, b.hemiSky, clamp),
    hemiGround: lerpHex(a.hemiGround, b.hemiGround, clamp),
    hemiIntensity: lerp(a.hemiIntensity, b.hemiIntensity),
    ambient: lerp(a.ambient, b.ambient),
    nightLights: clamp > 0.5 ? b.nightLights : a.nightLights
  };
}

function lerpHex(h1, h2, t) {
  const r1 = (h1 >> 16) & 0xff, g1 = (h1 >> 8) & 0xff, b1 = h1 & 0xff;
  const r2 = (h2 >> 16) & 0xff, g2 = (h2 >> 8) & 0xff, b2 = h2 & 0xff;
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return (r << 16) | (g << 8) | b;
}

export { lerpHex };
