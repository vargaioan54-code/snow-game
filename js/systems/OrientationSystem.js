// ETAPA 16 — Orientation handling: detect portrait vs landscape, overlay on mobile portrait.

import { detectTouchDevice } from '../config/quality.js?v=25';

export function createOrientationSystem({ settingsStore, onChange } = {}) {
  let overlay = null;
  let listeners = new Set();
  let currentOrientation = 'landscape';
  let userDismissed = false;
  let debounceTimer = 0;

  if (typeof onChange === 'function') listeners.add(onChange);

  function _detect() {
    if (typeof window === 'undefined') return 'landscape';
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  }

  function _shouldShowPortraitWarning() {
    if (!detectTouchDevice()) return false;
    if (userDismissed) return false;
    return currentOrientation === 'portrait';
  }

  function _buildOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'orientation-overlay';
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:9500',
      'display:none', 'flex-direction:column',
      'align-items:center', 'justify-content:center',
      'background:rgba(10,14,22,0.94)', 'color:#fff',
      'font-family:sans-serif', 'text-align:center', 'padding:24px'
    ].join(';');
    overlay.innerHTML = ''
      + '<div style="font-size:96px;animation:rot 1.5s ease-in-out infinite alternate;">🔄</div>'
      + '<div style="font-size:22px;font-weight:700;margin-top:24px">Rotește dispozitivul</div>'
      + '<div style="font-size:14px;color:#aab;margin-top:12px;max-width:320px">Pentru cea mai bună experiență, rotește în modul landscape.</div>'
      + '<button id="orient-ignore" style="margin-top:32px;padding:10px 20px;background:transparent;border:1px solid #4a9eff;border-radius:8px;color:#4a9eff;cursor:pointer">Ignoră avertisment</button>';
    const style = document.createElement('style');
    style.textContent = '@keyframes rot { 0% { transform: rotate(-15deg); } 100% { transform: rotate(75deg); } }';
    overlay.appendChild(style);
    document.body.appendChild(overlay);
    overlay.querySelector('#orient-ignore').addEventListener('click', () => {
      userDismissed = true;
      _apply();
    });
    return overlay;
  }

  function _apply() {
    if (_shouldShowPortraitWarning()) {
      _buildOverlay();
      overlay.style.display = 'flex';
    } else {
      if (overlay) overlay.style.display = 'none';
    }
    for (const cb of listeners) { try { cb(currentOrientation); } catch {} }
  }

  function _onChange() {
    const now = _detect();
    if (now !== currentOrientation) {
      currentOrientation = now;
      _apply();
    } else {
      _apply();
    }
  }

  function install() {
    if (typeof window === 'undefined') return;
    currentOrientation = _detect();
    _apply();
    const handler = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(_onChange, 200);
    };
    window.addEventListener('resize', handler, { passive: true });
    if (typeof window.matchMedia === 'function') {
      try {
        const mq = window.matchMedia('(orientation: portrait)');
        if (mq.addEventListener) mq.addEventListener('change', handler);
        else if (mq.addListener) mq.addListener(handler);
      } catch {}
    }
  }

  function on(cb) { if (typeof cb === 'function') listeners.add(cb); return () => listeners.delete(cb); }

  function getOrientation() { return currentOrientation; }
  function reset() { userDismissed = false; _apply(); }

  return { install, on, getOrientation, reset };
}
