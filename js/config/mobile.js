// ETAPA 16 — Mobile layout constants.
// Breakpoints, safe-area defaults, joystick geometry, action buttons.

export const MOBILE_LAYOUT = Object.freeze({
  breakpoints: { mobile: 768, tablet: 1024 },
  safeArea: { top: 44, bottom: 34, left: 0, right: 0 },
  hudScale: { mobile: 0.85, tablet: 0.95, desktop: 1.0 },
  buttonSize: { mobile: 56, tablet: 48, desktop: 40 },
  joystick: {
    size: 120,
    deadzone: 0.15,
    maxDistance: 60,
    leftAnchor: { x: 20, y: -20 },
    rightAnchor: { x: -20, y: -20 }
  },
  actionButtons: [
    { id: 'brake',       label: '🛑', color: '#ff4040', y: -20, x: -20 },
    { id: 'boost',       label: '⚡', color: '#ffaa20', y: -20, x: -84 },
    { id: 'enter_exit',  label: '🚪', color: '#4a9eff', y: -84, x: -20 },
    { id: 'tool_action', label: '🔨', color: '#20d0e0', y: -84, x: -84 }
  ]
});

export function getBreakpoint(width = (typeof window !== 'undefined' ? window.innerWidth : 1024)) {
  if (width < MOBILE_LAYOUT.breakpoints.mobile) return 'mobile';
  if (width < MOBILE_LAYOUT.breakpoints.tablet) return 'tablet';
  return 'desktop';
}

export function getHudScale(width) {
  const bp = getBreakpoint(width);
  return MOBILE_LAYOUT.hudScale[bp];
}
