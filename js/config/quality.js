// ETAPA 16 — Quality presets + device detection.
// Consumat de QualitySystem. Zero side-effects la import.

export const QUALITY_PRESETS = Object.freeze({
  low: {
    id: 'low', name: 'Redus', targetFps: 30,
    snowResolution: 71,
    shadowsEnabled: false,
    shadowMapSize: 512,
    pixelRatio: 1.0,
    weatherFxDensity: 0.3,
    particleLimit: 20,
    renderDistance: 40,
    fogNear: 30, fogFar: 90,
    lodEnabled: true,
    postProcessing: false,
    antialias: false
  },
  medium: {
    id: 'medium', name: 'Mediu', targetFps: 45,
    snowResolution: 101,
    shadowsEnabled: true,
    shadowMapSize: 1024,
    pixelRatio: 1.0,
    weatherFxDensity: 0.6,
    particleLimit: 100,
    renderDistance: 70,
    fogNear: 50, fogFar: 130,
    lodEnabled: true,
    postProcessing: false,
    antialias: false
  },
  high: {
    id: 'high', name: 'Înalt', targetFps: 60,
    snowResolution: 141,
    shadowsEnabled: true,
    shadowMapSize: 2048,
    pixelRatio: 1.0,
    weatherFxDensity: 1.0,
    particleLimit: 300,
    renderDistance: 100,
    fogNear: 70, fogFar: 180,
    lodEnabled: true,
    postProcessing: false,
    antialias: true
  },
  ultra: {
    id: 'ultra', name: 'Ultra', targetFps: 60,
    snowResolution: 181,
    shadowsEnabled: true,
    shadowMapSize: 4096,
    pixelRatio: (typeof window !== 'undefined' && window.devicePixelRatio) ? Math.min(2, window.devicePixelRatio) : 1,
    weatherFxDensity: 1.5,
    particleLimit: 500,
    renderDistance: 150,
    fogNear: 90, fogFar: 220,
    lodEnabled: false,
    postProcessing: true,
    antialias: true
  }
});

export const QUALITY_ORDER = ['low', 'medium', 'high', 'ultra'];

export function detectDeviceTier() {
  if (typeof navigator === 'undefined') return 'medium';
  const ua = navigator.userAgent || '';
  const isMobile = /Android|iPhone|iPad|iPod|Mobile|Opera Mini/i.test(ua);
  const cores = Number(navigator.hardwareConcurrency) || 2;
  const memory = Number(navigator.deviceMemory) || 2;

  if (isMobile && (cores < 4 || memory < 3)) return 'low';
  if (isMobile) return 'medium';
  if (cores >= 8 && memory >= 8) return 'ultra';
  if (cores >= 4) return 'high';
  return 'medium';
}

export function detectTouchDevice() {
  if (typeof window === 'undefined') return false;
  return ('ontouchstart' in window) || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
}

export function isValidPreset(id) {
  return QUALITY_ORDER.includes(id);
}

export function stepDownPreset(id) {
  const i = QUALITY_ORDER.indexOf(id);
  if (i <= 0) return QUALITY_ORDER[0];
  return QUALITY_ORDER[i - 1];
}

export function stepUpPreset(id) {
  const i = QUALITY_ORDER.indexOf(id);
  if (i < 0 || i >= QUALITY_ORDER.length - 1) return QUALITY_ORDER[QUALITY_ORDER.length - 1];
  return QUALITY_ORDER[i + 1];
}
