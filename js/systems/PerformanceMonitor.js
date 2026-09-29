// ETAPA 16 — Performance monitor: rolling FPS window + degrade/improve callbacks.
// Zero DOM writes. Consumatorii citesc getStats() manual.

export function createPerformanceMonitor({ targetFps = 60, onDegrade, onImprove } = {}) {
  const SAMPLE_SIZE = 60;
  const samples = [];
  let lastTs = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  let degradeCandidateSince = null;
  let improveCandidateSince = null;
  let currentTarget = targetFps;
  let paused = false;

  function tick() {
    if (paused) return { fps: 0, avg: 0 };
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const dt = now - lastTs; lastTs = now;
    if (dt <= 0) return { fps: 0, avg: computeAvg() };
    const fps = 1000 / dt;
    samples.push(fps);
    if (samples.length > SAMPLE_SIZE) samples.shift();
    const avg = computeAvg();

    if (samples.length >= SAMPLE_SIZE) {
      // Degrade candidate: sub 75% target pentru 5s continuu
      if (avg < currentTarget * 0.75) {
        if (degradeCandidateSince === null) degradeCandidateSince = now;
        else if (now - degradeCandidateSince > 5000) {
          try { if (typeof onDegrade === 'function') onDegrade(avg, currentTarget); } catch {}
          degradeCandidateSince = null;
        }
      } else {
        degradeCandidateSince = null;
      }
      // Improve candidate: peste 95% target pentru 10s continuu
      if (avg > currentTarget * 0.95) {
        if (improveCandidateSince === null) improveCandidateSince = now;
        else if (now - improveCandidateSince > 10000) {
          try { if (typeof onImprove === 'function') onImprove(avg, currentTarget); } catch {}
          improveCandidateSince = null;
        }
      } else {
        improveCandidateSince = null;
      }
    }
    return { fps, avg };
  }

  function computeAvg() {
    if (samples.length === 0) return 0;
    let s = 0;
    for (let i = 0; i < samples.length; i++) s += samples[i];
    return s / samples.length;
  }

  function getStats() {
    return {
      avg: computeAvg(),
      last: samples.length ? samples[samples.length - 1] : 0,
      samples: samples.length,
      targetFps: currentTarget
    };
  }

  function setTarget(fps) {
    currentTarget = Math.max(15, Math.min(120, Number(fps) || 60));
    degradeCandidateSince = null;
    improveCandidateSince = null;
  }

  function reset() {
    samples.length = 0;
    degradeCandidateSince = null;
    improveCandidateSince = null;
    lastTs = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  }

  function pause() { paused = true; }
  function resume() { paused = false; reset(); }

  return { tick, getStats, setTarget, reset, pause, resume };
}
