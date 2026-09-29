// AudioSystem — sunete procedurale simple via Web Audio API.
// Zero fisiere audio; oscillator + gain envelope pentru fiecare eveniment.
// Asculta SettingsStore.sound — daca false, tacere.

export function createAudioSystem(settingsStore) {
  let ctx = null;
  let master = null;
  let sfxBus = null, musicBus = null, uiBus = null;
  let unlocked = false;
  let duckingActive = false;
  let duckTimer = 0;

  function _readVol(key, fallback) {
    if (!settingsStore || !settingsStore.state) return fallback;
    const v = settingsStore.state[key];
    return (typeof v === 'number' && Number.isFinite(v)) ? v : fallback;
  }

  function _isMuted() {
    return !!(settingsStore && settingsStore.state && settingsStore.state.mute);
  }

  function ensureCtx() {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = _isMuted() ? 0 : _readVol('volumeMaster', 0.7) * 0.5;
      master.connect(ctx.destination);
      // Sub-buses (Etapa 16)
      sfxBus = ctx.createGain(); sfxBus.gain.value = _readVol('volumeSfx', 0.9); sfxBus.connect(master);
      musicBus = ctx.createGain(); musicBus.gain.value = _readVol('volumeMusic', 0.5); musicBus.connect(master);
      uiBus = ctx.createGain(); uiBus.gain.value = _readVol('volumeUi', 0.8); uiBus.connect(master);
      // React to settings changes
      if (settingsStore && typeof settingsStore.on === 'function') {
        settingsStore.on(() => {
          try {
            if (master) master.gain.value = _isMuted() ? 0 : _readVol('volumeMaster', 0.7) * 0.5;
            if (sfxBus) sfxBus.gain.value = _readVol('volumeSfx', 0.9);
            if (musicBus) musicBus.gain.value = _readVol('volumeMusic', 0.5);
            if (uiBus) uiBus.gain.value = _readVol('volumeUi', 0.8);
          } catch {}
        });
      }
      // audio unlock on first user gesture
      const unlock = () => {
        if (ctx.state === 'suspended') ctx.resume();
        unlocked = true;
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      };
      if (ctx.state === 'suspended') {
        window.addEventListener('pointerdown', unlock, { once: true });
        window.addEventListener('keydown', unlock, { once: true });
      } else {
        unlocked = true;
      }
    } catch (e) {
      console.warn('[Audio] init failed', e);
      return null;
    }
    return ctx;
  }

  function soundOn() {
    return settingsStore && settingsStore.state && settingsStore.state.sound !== false;
  }

  // Envelope helper: gain envelope 0 -> peak -> 0 over dur seconds
  function envelope(gainNode, dur, peak = 1.0) {
    const now = ctx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(peak, now + Math.min(0.01, dur * 0.1));
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + dur);
  }

  function play(fn) {
    if (!soundOn()) return;
    const c = ensureCtx();
    if (!c || !unlocked) return;
    try { fn(); } catch (e) { /* silent */ }
  }

  // ETAPA 28 fix (TDZ): _ambient state must be declared before `return {}` since
  // several returned methods reference it before the original declaration site (~L487).
  const _ambient = {
    currentId: null,
    source: null,
    filter: null,
    gain: null,
    pendingId: null,
    pendingVolume: 0.35
  };

  return {
    footstep() {
      play(() => {
        const dur = 0.05;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 150;
        osc.connect(g); g.connect(master);
        envelope(g, dur, 0.15);
        osc.start(); osc.stop(ctx.currentTime + dur);
      });
    },

    toolActive(toolId) {
      // Un tone scurt caracteristic per unealta.
      play(() => {
        const dur = 0.06;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        let freq = 200, type = 'triangle';
        if (toolId === 'shovel')  { freq = 180; type = 'triangle'; }
        else if (toolId === 'pusher') { freq = 220; type = 'sawtooth'; }
        else if (toolId === 'broom')  { freq = 320; type = 'sine'; }
        else if (toolId === 'blower') { freq = 400; type = 'sawtooth'; }
        else if (toolId === 'heat')   { freq = 600; type = 'square'; }
        osc.type = type; osc.frequency.value = freq;
        osc.connect(g); g.connect(master);
        envelope(g, dur, 0.10);
        osc.start(); osc.stop(ctx.currentTime + dur);
      });
    },

    coin() {
      play(() => {
        const dur = 0.08;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + dur);
        osc.connect(g); g.connect(master);
        envelope(g, dur, 0.22);
        osc.start(); osc.stop(ctx.currentTime + dur);
      });
    },

    deposit() {
      play(() => {
        const dur = 0.22;
        // Chord: 300 + 400 + 500
        for (const f of [300, 400, 500]) {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine'; osc.frequency.value = f;
          osc.connect(g); g.connect(master);
          envelope(g, dur, 0.18);
          osc.start(); osc.stop(ctx.currentTime + dur);
        }
      });
    },

    levelUp() {
      play(() => {
        const notes = [400, 500, 600, 800];
        notes.forEach((f, i) => {
          const start = ctx.currentTime + i * 0.09;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'triangle'; osc.frequency.value = f;
          osc.connect(g); g.connect(master);
          const dur = 0.1;
          g.gain.setValueAtTime(0, start);
          g.gain.linearRampToValueAtTime(0.3, start + 0.01);
          g.gain.exponentialRampToValueAtTime(0.001, start + dur);
          osc.start(start); osc.stop(start + dur);
        });
      });
    },

    banner() {
      play(() => {
        const dur = 0.15;
        const bufferSize = Math.floor(ctx.sampleRate * dur);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 500;
        filter.Q.value = 4;
        const g = ctx.createGain();
        src.connect(filter); filter.connect(g); g.connect(master);
        envelope(g, dur, 0.25);
        src.start(); src.stop(ctx.currentTime + dur);
      });
    },

    pickupBig() {
      play(() => {
        // arpeggio sus, apoi accord jos
        const notes = [500, 700, 900];
        notes.forEach((f, i) => {
          const start = ctx.currentTime + i * 0.05;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'triangle'; osc.frequency.value = f;
          osc.connect(g); g.connect(master);
          const dur = 0.12;
          g.gain.setValueAtTime(0, start);
          g.gain.linearRampToValueAtTime(0.28, start + 0.01);
          g.gain.exponentialRampToValueAtTime(0.001, start + dur);
          osc.start(start); osc.stop(start + dur);
        });
      });
    },

    error() {
      play(() => {
        const dur = 0.18;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + dur);
        osc.connect(g); g.connect(master);
        envelope(g, dur, 0.22);
        osc.start(); osc.stop(ctx.currentTime + dur);
      });
    },

    // Etapa 3 — accept contract: 2 note ascendente scurte
    contractAccept() {
      play(() => {
        const notes = [520, 700];
        notes.forEach((f, i) => {
          const start = ctx.currentTime + i * 0.08;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'triangle'; osc.frequency.value = f;
          osc.connect(g); g.connect(master);
          const dur = 0.11;
          g.gain.setValueAtTime(0, start);
          g.gain.linearRampToValueAtTime(0.24, start + 0.015);
          g.gain.exponentialRampToValueAtTime(0.001, start + dur);
          osc.start(start); osc.stop(start + dur);
        });
      });
    },

    // Etapa 3 — contract complet: fanfare 5 note major
    contractComplete() {
      play(() => {
        const notes = [523, 659, 784, 1046, 1319]; // C-E-G-C-E (major)
        notes.forEach((f, i) => {
          const start = ctx.currentTime + i * 0.11;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'triangle'; osc.frequency.value = f;
          osc.connect(g); g.connect(master);
          const dur = 0.20;
          g.gain.setValueAtTime(0, start);
          g.gain.linearRampToValueAtTime(0.32, start + 0.015);
          g.gain.exponentialRampToValueAtTime(0.001, start + dur);
          osc.start(start); osc.stop(start + dur);
        });
      });
    },

    // Etapa 3 — contract esuat: buzz descendent
    contractFail() {
      play(() => {
        const dur = 0.55;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + dur);
        osc.connect(g); g.connect(master);
        envelope(g, dur, 0.25);
        osc.start(); osc.stop(ctx.currentTime + dur);
      });
    },

    // Etapa 3 — chime pt fiecare stea acordata (i = 0..4)
    starChime(i = 0) {
      play(() => {
        const baseFreqs = [1000, 1200, 1500, 1800, 2200];
        const f = baseFreqs[Math.min(4, Math.max(0, i))];
        const dur = 0.24;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        osc.connect(g); g.connect(master);
        envelope(g, dur, 0.22);
        osc.start(); osc.stop(ctx.currentTime + dur);
      });
    },

    // Volum master 0..1
    setVolume(v) {
      const c = ensureCtx();
      if (!c || !master) return;
      master.gain.value = Math.max(0, Math.min(1, v));
    },

    // ETAPA 16 — Duck music -30% pentru 3s (auto ramp back)
    duckMusic(durationSec = 3, factor = 0.7) {
      const c = ensureCtx(); if (!c || !musicBus) return;
      const now = c.currentTime;
      const original = _readVol('volumeMusic', 0.5);
      try {
        musicBus.gain.cancelScheduledValues(now);
        musicBus.gain.setValueAtTime(musicBus.gain.value, now);
        musicBus.gain.linearRampToValueAtTime(original * factor, now + 0.15);
        musicBus.gain.linearRampToValueAtTime(original, now + durationSec);
      } catch {}
    },

    // ETAPA 16 — Mute toggle (respectat prin _isMuted() la ensureCtx + setari)
    setMute(on) {
      if (!settingsStore) return;
      settingsStore.set({ mute: !!on });
    },
    isMuted() { return _isMuted(); },

    // ETAPA 5 — Ambient loop procedural (weather background sound).
    // Cross-fade cand se schimba id-ul. null = tacere.
    ambient(id, targetVolume = 0.35) {
      // Poate fi apelat inainte de unlock; salveaza si retry la unlock via play() wrapper
      const c = ensureCtx();
      if (!c) return;
      if (_ambient.currentId === id) return;
      // Stop cel curent (fade out)
      _stopCurrentAmbient(c);
      _ambient.currentId = id;
      if (!id || !soundOn()) return;
      // Doar dupa unlock
      if (!unlocked) {
        // salveaza intentia — reluam la primul call `play()`
        _ambient.pendingId = id;
        _ambient.pendingVolume = targetVolume;
        return;
      }
      _startAmbient(c, id, targetVolume);
    },

    // ===== Etapa 6: Vehicle audio =====
    engineStart(vehicleId, tone = 130) {
      _engineStart(vehicleId, tone);
    },
    engineIdle(vehicleId, volume = 0.15) {
      _engineSetVolume(vehicleId, volume);
    },
    engineDriving(vehicleId, throttle, speedFraction) {
      _engineSetDriving(vehicleId, throttle, speedFraction);
    },
    engineStop(vehicleId) {
      _engineStop(vehicleId);
    },
    plowScrape(active) {
      if (!active) return;
      play(() => {
        const dur = 0.15;
        const buf = _makeNoiseBuffer(ctx, dur);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass'; filter.frequency.value = 500;
        const g = ctx.createGain();
        src.connect(filter); filter.connect(g); g.connect(master);
        envelope(g, dur, 0.06);
        src.start(); src.stop(ctx.currentTime + dur);
      });
    },
    enterVehicle() {
      play(() => {
        const dur = 0.08;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'square'; osc.frequency.value = 180;
        osc.connect(g); g.connect(master);
        envelope(g, dur, 0.12);
        osc.start(); osc.stop(ctx.currentTime + dur);
      });
    },
    exitVehicle() {
      play(() => {
        const dur = 0.06;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'square'; osc.frequency.value = 140;
        osc.connect(g); g.connect(master);
        envelope(g, dur, 0.10);
        osc.start(); osc.stop(ctx.currentTime + dur);
      });
    },

    // ===== Etapa 7: Garage sounds =====
    garageDoor(opening = true) {
      play(() => {
        const dur = 0.5;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sawtooth';
        // sweep 80->40 (close) or 40->80 (open)
        const t0 = ctx.currentTime;
        if (opening) {
          osc.frequency.setValueAtTime(40, t0);
          osc.frequency.exponentialRampToValueAtTime(80, t0 + dur);
        } else {
          osc.frequency.setValueAtTime(80, t0);
          osc.frequency.exponentialRampToValueAtTime(40, t0 + dur);
        }
        osc.connect(g); g.connect(master);
        g.gain.setValueAtTime(0.0, t0);
        g.gain.linearRampToValueAtTime(0.14, t0 + 0.05);
        g.gain.linearRampToValueAtTime(0.0, t0 + dur);
        osc.start(); osc.stop(t0 + dur);
      });
    },
    serviceComplete() {
      play(() => {
        const dur = 0.32;
        const t0 = ctx.currentTime;
        // Chord: 440 + 660 + 880
        [440, 660, 880].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine'; osc.frequency.value = freq;
          osc.connect(g); g.connect(master);
          const start = t0 + i * 0.05;
          g.gain.setValueAtTime(0, start);
          g.gain.linearRampToValueAtTime(0.12, start + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, start + 0.30);
          osc.start(start); osc.stop(start + 0.32);
        });
      });
    }
  };

  // ===== Engine helpers (Etapa 6) =====
  const _engines = new Map(); // vehicleId -> { osc, gain, baseTone }

  function _engineStart(id, tone) {
    if (!ctx || !soundOn()) return;
    if (!unlocked) return;
    _engineStop(id);
    try {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = tone * 0.8;
      osc.connect(g); g.connect(master);
      g.gain.value = 0;
      const now = ctx.currentTime;
      g.gain.linearRampToValueAtTime(0.05, now + 0.5);
      osc.frequency.linearRampToValueAtTime(tone, now + 0.5);
      osc.start();
      _engines.set(id, { osc, gain: g, baseTone: tone });
    } catch (e) { /* silent */ }
  }

  function _engineSetVolume(id, v) {
    const e = _engines.get(id);
    if (!e) return;
    try { e.gain.gain.setTargetAtTime(v, ctx.currentTime, 0.05); } catch {}
  }

  function _engineSetDriving(id, throttle, speedFraction) {
    const e = _engines.get(id);
    if (!e) return;
    try {
      const t = Math.max(0, Math.abs(throttle || 0));
      const s = Math.max(0, Math.min(1, speedFraction || 0));
      const targetVol = 0.04 + t * 0.06;
      const targetFreq = e.baseTone * (1 + s * 0.6 + t * 0.2);
      e.gain.gain.setTargetAtTime(targetVol, ctx.currentTime, 0.1);
      e.osc.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.1);
    } catch {}
  }

  function _engineStop(id) {
    const e = _engines.get(id);
    if (!e) return;
    try {
      const now = ctx.currentTime;
      e.gain.gain.cancelScheduledValues(now);
      e.gain.gain.setValueAtTime(e.gain.gain.value, now);
      e.gain.gain.linearRampToValueAtTime(0.0001, now + 0.4);
      const osc = e.osc;
      setTimeout(() => { try { osc.stop(); } catch {} }, 500);
    } catch {}
    _engines.delete(id);
  }

  // ===== Ambient helpers (Etapa 5) =====
  // _ambient state hoisted above `return {}` — see fix above.

  function _makeNoiseBuffer(c, dur = 2.0) {
    const size = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, size, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  function _profileForAmbient(id) {
    switch (id) {
      case 'wind_light':    return { filterFreq: 400,  Q: 1.5, vol: 0.10 };
      case 'wind_medium':   return { filterFreq: 300,  Q: 1.8, vol: 0.18 };
      case 'wind_strong':   return { filterFreq: 250,  Q: 2.2, vol: 0.28 };
      case 'wind_extreme':  return { filterFreq: 180,  Q: 2.5, vol: 0.42 };
      case 'ambience_muffled': return { filterFreq: 220, Q: 1.0, vol: 0.08 };
      case 'ambience_calm': return { filterFreq: 800,  Q: 0.7, vol: 0.03 };
      case 'rain_light':    return { filterFreq: 1200, Q: 3.0, vol: 0.15 };
      default: return null;
    }
  }

  function _startAmbient(c, id, targetVolume) {
    const profile = _profileForAmbient(id);
    if (!profile) return;
    try {
      const buf = _makeNoiseBuffer(c, 2.5);
      const src = c.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const filter = c.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = profile.filterFreq;
      filter.Q.value = profile.Q;
      const g = c.createGain();
      g.gain.value = 0;
      src.connect(filter); filter.connect(g); g.connect(master);
      src.start();
      // Fade in
      const now = c.currentTime;
      const finalVol = profile.vol * (targetVolume || 1);
      g.gain.linearRampToValueAtTime(finalVol, now + 1.2);
      _ambient.source = src;
      _ambient.filter = filter;
      _ambient.gain = g;
    } catch (e) { /* silent */ }
  }

  function _stopCurrentAmbient(c) {
    if (!_ambient.source || !_ambient.gain) return;
    try {
      const now = c.currentTime;
      _ambient.gain.gain.cancelScheduledValues(now);
      _ambient.gain.gain.setValueAtTime(_ambient.gain.gain.value, now);
      _ambient.gain.gain.linearRampToValueAtTime(0.0001, now + 0.8);
      const src = _ambient.source;
      setTimeout(() => { try { src.stop(); } catch {} }, 900);
    } catch {}
    _ambient.source = null;
    _ambient.filter = null;
    _ambient.gain = null;
  }
}
