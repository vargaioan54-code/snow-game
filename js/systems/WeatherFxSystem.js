// ETAPA 5 — WeatherFxSystem
// Leaga WeatherSystem de efecte vizuale (snowfall) + audio ambiental.
// Nu deține state — modifică snowfall si audio.

export function createWeatherFxSystem({ snowfall, weatherSystem, settingsStore, audio, gameState }) {
  let lastAmbientId = null;
  let updateAcc = 0;
  const UPDATE_MS = 100;

  // Wind direction (constant per weather change — random pentru feel natural)
  let windDirX = 1, windDirZ = 0;
  let lastWindWeatherId = null;

  function applyGraphicsMax() {
    if (!snowfall || typeof snowfall.setGraphicsMax !== 'function') return;
    const g = settingsStore && settingsStore.state ? settingsStore.state.graphics : 'high';
    snowfall.setGraphicsMax(g);
  }
  applyGraphicsMax();
  if (settingsStore && typeof settingsStore.onKey === 'function') {
    settingsStore.onKey('graphics', () => applyGraphicsMax());
  }

  function update(realDeltaSec) {
    updateAcc += realDeltaSec * 1000;
    if (updateAcc < UPDATE_MS) return;
    updateAcc = 0;

    const w = weatherSystem.getInterpolatedParams();

    // Snowfall intensity (throttled)
    if (snowfall && typeof snowfall.setIntensity === 'function') {
      // Pause = no new particles emissions; particulele vechi drift natural
      const playing = !gameState || gameState.isPlaying();
      const intensityScale = playing ? 1.0 : 0.0;
      snowfall.setIntensity(w.snowfallRate * intensityScale);
    }

    // Wind direction — reroll doar cand se schimba weather (nu la fiecare frame)
    const curWeatherId = w.id;
    if (curWeatherId !== lastWindWeatherId) {
      const ang = Math.random() * Math.PI * 2;
      windDirX = Math.cos(ang);
      windDirZ = Math.sin(ang);
      lastWindWeatherId = curWeatherId;
    }
    if (snowfall && typeof snowfall.setWind === 'function') {
      const strength = w.windStrength * 2.5; // m/s max
      snowfall.setWind(windDirX * strength, windDirZ * strength);
    }

    // Audio ambient
    if (audio && typeof audio.ambient === 'function') {
      const cur = weatherSystem.getCurrent();
      const wantId = cur.audio || null;
      if (wantId !== lastAmbientId) {
        audio.ambient(wantId, 0.4);
        lastAmbientId = wantId;
      }
    }
  }

  return {
    update,
    getWindDirection() { return { x: windDirX, z: windDirZ }; }
  };
}
