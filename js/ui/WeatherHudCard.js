// ETAPA 5 — WeatherHudCard
// Card mic top-right (deasupra minimap) cu vremea + timpul + faza.
// Update reactiv la WeatherStore + TimeStore, throttled 500ms.

import { phaseForHour } from '../config/timeOfDay.js';
import { WEATHER_BY_ID } from '../config/weather.js';

const STYLE = `
#weather-hud {
  position: fixed;
  right: 12px;
  top: 12px;
  z-index: 6;
  display: flex; flex-direction: column; align-items: flex-end;
  padding: 8px 12px;
  background: rgba(15, 20, 32, 0.72);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.10);
  border-radius: 10px;
  font: 600 12px system-ui, sans-serif;
  min-width: 130px;
  pointer-events: none;
  backdrop-filter: blur(4px);
}
#weather-hud .row1 { display: flex; align-items: center; gap: 6px; font-size: 13px; }
#weather-hud .row2 { color: #aec6dc; font-size: 11px; margin-top: 2px; }
#weather-hud .row3 { color: #ccc; font-size: 10px; margin-top: 2px; }
@media (max-width: 900px) {
  #weather-hud { right: 8px; top: 8px; padding: 6px 8px; font-size: 11px; min-width: 110px; }
}
@media (max-height: 500px) and (pointer:coarse) {
  #weather-hud { padding: 4px 6px; font-size: 10px; min-width: 96px; }
}
`;

export function createWeatherHudCard({ weatherStore, timeStore }) {
  // Inject style
  if (!document.getElementById('weather-hud-style')) {
    const s = document.createElement('style');
    s.id = 'weather-hud-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  const root = document.createElement('div');
  root.id = 'weather-hud';
  root.innerHTML = `
    <div class="row1"><span data-k="icon">☀️</span><span data-k="name">Senin</span></div>
    <div class="row2"><span data-k="temp">-2°C</span> · <span data-k="time">08:00</span></div>
    <div class="row3"><span data-k="phase">🌤️ Dimineață</span> · <span data-k="day">Ziua 1</span></div>
  `;
  document.body.appendChild(root);

  const iconEl = root.querySelector('[data-k="icon"]');
  const nameEl = root.querySelector('[data-k="name"]');
  const tempEl = root.querySelector('[data-k="temp"]');
  const timeEl = root.querySelector('[data-k="time"]');
  const phaseEl = root.querySelector('[data-k="phase"]');
  const dayEl = root.querySelector('[data-k="day"]');

  let lastRender = 0;
  const THROTTLE_MS = 500;
  let scheduled = false;

  function fmt2(n) { return (n < 10 ? '0' : '') + Math.floor(n); }

  function render() {
    scheduled = false;
    lastRender = performance.now();
    const w = WEATHER_BY_ID[weatherStore.state.currentWeatherId] || WEATHER_BY_ID.clear;
    iconEl.textContent = w.icon;
    nameEl.textContent = w.name;
    const temp = Math.round(weatherStore.state.temperature);
    tempEl.textContent = (temp > 0 ? '+' : '') + temp + '°C';
    const h = timeStore.state.hour;
    const hh = Math.floor(h);
    const mm = Math.floor((h - hh) * 60);
    timeEl.textContent = fmt2(hh) + ':' + fmt2(mm);
    const phase = phaseForHour(h);
    phaseEl.textContent = phase.icon + ' ' + phase.name;
    dayEl.textContent = 'Ziua ' + timeStore.state.dayIndex;
  }

  function scheduleRender() {
    if (scheduled) return;
    const dt = performance.now() - lastRender;
    if (dt >= THROTTLE_MS) { render(); return; }
    scheduled = true;
    setTimeout(() => { scheduled = false; render(); }, THROTTLE_MS - dt);
  }

  weatherStore.on(() => scheduleRender());
  timeStore.on(() => scheduleRender());

  render();

  return {
    show() { root.style.display = 'flex'; },
    hide() { root.style.display = 'none'; },
    render
  };
}
