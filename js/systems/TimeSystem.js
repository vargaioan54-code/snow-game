// ETAPA 5 — TimeSystem
// Avanseaza timpul zilei doar cand jocul e in playing state.
// Nu deține state — modifică TimeStore.

import { phaseForHour, phaseProgress } from '../config/timeOfDay.js';

export function createTimeSystem({ timeStore, gameState }) {
  return {
    // realDeltaSec = dt REAL (secunde) — chemat din main.js game loop
    update(realDeltaSec) {
      if (timeStore.state.paused) return;
      if (gameState && !gameState.isPlaying()) return;
      // in-game seconds per real second = timeScale
      const inGameSec = realDeltaSec * timeStore.state.timeScale;
      const hoursDelta = inGameSec / 3600;
      timeStore.advanceHour(hoursDelta);
    },

    setTime(hour) { timeStore.setTime(hour); },
    setTimeScale(scale) { timeStore.setTimeScale(scale); },
    advanceHour(n) { timeStore.advanceHour(n); },
    pause() { timeStore.setPaused(true); },
    resume() { timeStore.setPaused(false); },

    getPhase() { return phaseForHour(timeStore.state.hour); },
    getPhaseProgress() { return phaseProgress(timeStore.state.hour); },
    getSunAngle() { return (timeStore.state.hour / 24) * Math.PI * 2; },
    getHour() { return timeStore.state.hour; },
    getDayIndex() { return timeStore.state.dayIndex; },
    getFormattedTime() {
      const h = timeStore.state.hour;
      const hh = Math.floor(h);
      const mm = Math.floor((h - hh) * 60);
      const p2 = (x) => (x < 10 ? '0' : '') + x;
      return p2(hh) + ':' + p2(mm);
    }
  };
}
