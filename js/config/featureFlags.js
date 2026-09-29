// ETAPA 19 — Feature Flags
// Default flags per feature. Override via URL param (?flag_NAME=false) sau persistent.
// Real remote config = BLOCKED (necesita backend).

export const FEATURE_FLAGS = Object.freeze({
  ENABLE_MULTIPLAYER_LOBBY:    true,
  ENABLE_SOCIAL_PANEL:         true,
  ENABLE_STORE_PANEL:          true,
  ENABLE_PRESTIGE:             true,
  ENABLE_ENDGAME_CONTRACTS:    true,
  ENABLE_EXPERIMENTAL_WEATHER: false,
  ENABLE_TOUCH_UI_AUTO:        true,
  ENABLE_BATTERY_SAVER:        true,
  ENABLE_ANALYTICS:            true,
  ENABLE_CRASH_REPORTING:      true,
  ENABLE_ANALYTICS_PANEL:      true,  // dev-only panel
  ENABLE_SEASONS:              true,
  ENABLE_ACHIEVEMENTS:         true,
  ENABLE_MISSIONS:             true
});

export function listFlagNames() {
  return Object.keys(FEATURE_FLAGS);
}
