// PlayerStore -> DOM. Nu contine logica de gameplay.
// Adaugat snow-type badge dinamic + melt rate indicator + location badge (Etapa 4).

import { LOCATION_BY_ID } from '../config/locations.js';
import { REGION_BY_ID } from '../config/regions.js';

export function createHudBinding(store, worldStore = null) {
  const el = {
    coins:        document.getElementById('ui-coins'),
    diamonds:     document.getElementById('ui-diamonds'),
    reputation:   document.getElementById('ui-reputation'),
    level:        document.getElementById('ui-level'),
    xpFill:       document.getElementById('ui-xp-fill'),
    xpLabel:      document.getElementById('ui-xp-label'),
    progressFill: document.getElementById('ui-progress-fill'),
    progressPct:  document.getElementById('ui-progress-pct'),
    objective:    document.querySelector('#objective-card .objective-text')
  };

  // === Snow Type Badge (creat dinamic sub obiectiv) ===
  let snowBadge = null;
  function ensureSnowBadge() {
    if (snowBadge) return snowBadge;
    const obj = document.getElementById('objective-card');
    if (!obj) return null;
    snowBadge = document.createElement('div');
    snowBadge.id = 'ui-snow-badge';
    snowBadge.style.cssText = 'margin-top:8px;padding:4px 10px;border-radius:8px;' +
      'background:rgba(15,20,32,.55);color:#fff;font:600 12px system-ui;' +
      'display:none;letter-spacing:.3px;';
    obj.appendChild(snowBadge);
    return snowBadge;
  }

  function setSnowType(snowType) {
    const badge = ensureSnowBadge();
    if (!badge) return;
    if (!snowType) { badge.style.display = 'none'; return; }
    const c = snowType.color;
    const bg = `rgba(${Math.floor(c[0]*255)},${Math.floor(c[1]*255)},${Math.floor(c[2]*255)},.55)`;
    badge.style.background = bg;
    badge.style.color = (c[0]+c[1]+c[2] > 1.8) ? '#111' : '#fff';
    badge.textContent = snowType.name + ' · ×' + snowType.rewardMult.toFixed(1);
    badge.style.display = 'inline-block';
  }

  // === Melt rate indicator (opt, sub badge) ===
  let rateBadge = null;
  function ensureRateBadge() {
    if (rateBadge) return rateBadge;
    const obj = document.getElementById('objective-card');
    if (!obj) return null;
    rateBadge = document.createElement('div');
    rateBadge.id = 'ui-rate-badge';
    rateBadge.style.cssText = 'margin-top:4px;font:500 11px system-ui;color:#cfd6e5;display:none;';
    obj.appendChild(rateBadge);
    return rateBadge;
  }
  let _rateSmoothed = 0;
  function setMeltRate(coinsPerSec) {
    const bd = ensureRateBadge();
    if (!bd) return;
    _rateSmoothed = _rateSmoothed * 0.7 + coinsPerSec * 0.3;
    if (_rateSmoothed < 0.2) { bd.style.display = 'none'; return; }
    bd.style.display = 'block';
    bd.textContent = _rateSmoothed.toFixed(1) + ' mon/s';
  }

  function xpNeededFor(level) { return 100 * level; }

  function renderCoins() {
    if (!el.coins) return;
    const { bagCoins, vaultCoins } = store.state;
    const cap = store.bagCap;
    el.coins.textContent = `${bagCoins}/${cap}` + (vaultCoins > 0 ? ` (+${vaultCoins})` : '');
  }
  function renderDiamonds() {
    if (el.diamonds) el.diamonds.textContent = String(store.state.diamonds);
  }
  function renderReputation() {
    if (el.reputation) el.reputation.textContent = String(store.state.reputation || 0);
  }
  function renderLevel() {
    if (el.level) el.level.textContent = `Level ${store.state.level}`;
  }
  function renderXP() {
    const need = xpNeededFor(store.state.level);
    const pct = Math.min(100, Math.round((store.state.xp / need) * 100));
    if (el.xpFill) el.xpFill.style.width = pct + '%';
    if (el.xpLabel) el.xpLabel.textContent = `${store.state.xp} / ${need}`;
  }
  function renderProgress() {
    const pct = Math.min(100, Math.round(store.state.progress * 100));
    if (el.progressFill) el.progressFill.style.width = pct + '%';
    if (el.progressPct) el.progressPct.textContent = pct + '%';
  }
  function renderObjective() {
    if (el.objective) el.objective.textContent = 'Curata toata harta';
  }

  function renderAll() {
    renderCoins(); renderDiamonds(); renderReputation();
    renderLevel(); renderXP(); renderProgress(); renderObjective();
  }

  store.on((_state, changed) => {
    if (changed.includes('bagCoins') || changed.includes('vaultCoins') || changed.includes('bagLevel')) renderCoins();
    if (changed.includes('diamonds')) renderDiamonds();
    if (changed.includes('reputation')) renderReputation();
    if (changed.includes('level')) { renderLevel(); renderXP(); }
    if (changed.includes('xp')) renderXP();
    if (changed.includes('progress')) renderProgress();
  });

  renderAll();
  // === Location badge (Etapa 4) ===
  let locBadge = null;
  function ensureLocBadge() {
    if (locBadge) return locBadge;
    const lvl = document.getElementById('level-card');
    if (!lvl) return null;
    locBadge = document.createElement('div');
    locBadge.id = 'ui-location-badge';
    locBadge.style.cssText = 'margin-top:6px;padding:4px 10px;border-radius:8px;' +
      'background:rgba(15,20,32,.55);color:#7cb8ff;font:600 11px system-ui;' +
      'letter-spacing:.3px;display:inline-block;cursor:pointer;';
    lvl.appendChild(locBadge);
    return locBadge;
  }
  function renderLocation() {
    const b = ensureLocBadge();
    if (!b || !worldStore) return;
    const locId = worldStore.state.currentLocationId;
    if (locId) {
      const l = LOCATION_BY_ID[locId];
      b.textContent = l ? '📍 ' + l.name : '📍 ' + locId;
      b.style.color = '#7cb8ff';
    } else {
      const r = REGION_BY_ID[worldStore.state.currentRegionId] || REGION_BY_ID.starter;
      b.textContent = '🌍 Free Roam · ' + (r ? r.name : 'Starter');
      b.style.color = '#a0a8ba';
    }
  }

  if (worldStore) {
    worldStore.on((_s, changed) => {
      if (changed.includes('currentLocationId') || changed.includes('currentRegionId')) renderLocation();
    });
    renderLocation();
  }

  return { renderAll, setSnowType, setMeltRate, renderLocation };
}
