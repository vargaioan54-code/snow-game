import * as THREE from 'three';

/* =========================================================
   SNOWFALL — fulgi de zapada care cad permanent.
   Extins Etapa 5:
     - setIntensity(0..1) module particle count activ (0..MAX)
     - setWind(dx, dz) muta particulele lateral (mps)
     - setGraphicsMax(mode) — 'low'|'medium'|'high' hard-caps MAX
   ========================================================= */

const HARD_MAX = 700;
const AREA = { x: 24, yTop: 18, z: 24 };

function flakeSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 15);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.6, 'rgba(255,255,255,0.85)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function graphicsMax(mode) {
  if (mode === 'low')    return 200;
  if (mode === 'medium') return 500;
  return HARD_MAX;
}

export function createSnowfall(scene) {
  const positions = new Float32Array(HARD_MAX * 3);
  const speeds = new Float32Array(HARD_MAX);
  const phases = new Float32Array(HARD_MAX);

  for (let i = 0; i < HARD_MAX; i++) {
    positions[i * 3] = (Math.random() - 0.5) * AREA.x * 2;
    positions[i * 3 + 1] = Math.random() * AREA.yTop;
    positions[i * 3 + 2] = (Math.random() - 0.5) * AREA.z * 2;
    speeds[i] = 1.0 + Math.random() * 1.2;
    phases[i] = Math.random() * Math.PI * 2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setDrawRange(0, HARD_MAX);

  const mat = new THREE.PointsMaterial({
    size: 0.16,
    map: flakeSprite(),
    transparent: true,
    opacity: 0.9,
    depthWrite: false
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // State
  let intensity = 1.0;
  let maxParticles = HARD_MAX;
  let activeCount = HARD_MAX;
  let windX = 0, windZ = 0;

  function recomputeActive() {
    activeCount = Math.max(0, Math.min(maxParticles, Math.floor(HARD_MAX * intensity)));
    geo.setDrawRange(0, activeCount);
    points.visible = activeCount > 0;
  }

  return {
    // Etapa 5 API
    setIntensity(t) {
      intensity = Math.max(0, Math.min(1, Number(t) || 0));
      recomputeActive();
    },
    setWind(dx, dz) {
      windX = Number(dx) || 0;
      windZ = Number(dz) || 0;
    },
    setGraphicsMax(mode) {
      maxParticles = graphicsMax(mode);
      recomputeActive();
    },
    getIntensity() { return intensity; },
    getActiveCount() { return activeCount; },

    update(dt, t) {
      if (activeCount === 0) return;
      const pos = geo.attributes.position.array;
      for (let i = 0; i < activeCount; i++) {
        pos[i * 3 + 1] -= speeds[i] * dt;
        pos[i * 3] += Math.sin(t * 0.8 + phases[i]) * dt * 0.35 + windX * dt;
        pos[i * 3 + 2] += windZ * dt;
        if (pos[i * 3 + 1] < 0.1) {
          pos[i * 3 + 1] = AREA.yTop;
          pos[i * 3] = (Math.random() - 0.5) * AREA.x * 2;
          pos[i * 3 + 2] = (Math.random() - 0.5) * AREA.z * 2;
        }
      }
      geo.attributes.position.needsUpdate = true;
    }
  };
}
