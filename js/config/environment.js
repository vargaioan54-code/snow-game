// ETAPA 19 — Environment separation (dev / staging / production)
// Detecteaza environment din URL param, hostname, sau default production.

export function detectEnvironment() {
  try {
    if (typeof window === 'undefined') return 'production';
    const params = new URLSearchParams(window.location.search);
    const forced = params.get('env');
    if (forced && ENV_CONFIG[forced]) return forced;
    const host = (window.location.hostname || '').toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host.endsWith('.localhost') || host.endsWith('.test')) return 'development';
    if (host.includes('staging') || host.includes('preprod')) return 'staging';
    return 'production';
  } catch { return 'production'; }
}

export const ENV_CONFIG = Object.freeze({
  development: Object.freeze({
    name: 'development',
    debugTools: true,
    verboseLogging: true,
    autoSaveDebounceMs: 500,
    analyticsEnabled: true,   // dev: buffer local, no send
    crashReportingEnabled: true,
    mockBackendVisible: true,
    devPanelsVisible: true
  }),
  staging: Object.freeze({
    name: 'staging',
    debugTools: true,
    verboseLogging: true,
    autoSaveDebounceMs: 1000,
    analyticsEnabled: true,
    crashReportingEnabled: true,
    mockBackendVisible: true,
    devPanelsVisible: true
  }),
  production: Object.freeze({
    name: 'production',
    debugTools: false,        // STRIP in production
    verboseLogging: false,
    autoSaveDebounceMs: 2000,
    analyticsEnabled: true,
    crashReportingEnabled: true,
    mockBackendVisible: false,
    devPanelsVisible: false
  })
});

export function getEnvConfig(envName) {
  return ENV_CONFIG[envName] || ENV_CONFIG.production;
}
