import * as THREE from 'three';

/* =========================================================
   EFFECTS — particule diferite per unealta:
   shovel  → bucati de zapada impinse in fata + lateral
   pusher  → volum mare de bucati, mai grele
   broom   → praf fin de zapada maturat lateral
   blower  → jet de zapada suflata la distanta
   heat    → abur care se ridica + vapori
   ========================================================= */

const MAX = 220;

function makePool(scene, { size, color, opacity, blending }) {
  const pos = new Float32Array(MAX * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    size, color, transparent: true, opacity,
    depthWrite: false, blending: blending || THREE.NormalBlending, sizeAttenuation: true
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);
  const p = [];
  for (let i = 0; i < MAX; i++) {
    p.push({ x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0, life: 0 });
  }
  return { points, geo, pos, p, next: 0 };
}

export function createToolEffects(scene) {
  // bucati de zapada (albe, cad cu gravitatie)
  const chunks = makePool(scene, { size: 0.14, color: 0xffffff, opacity: 0.95 });
  // praf fin / spray (mai mic)
  const dust = makePool(scene, { size: 0.08, color: 0xf2f7ff, opacity: 0.8 });
  // abur (se ridica, aditiv)
  const steam = makePool(scene, { size: 0.24, color: 0xcfeaff, opacity: 0.4, blending: THREE.AdditiveBlending });

  function spawn(pool, x, y, z, vx, vy, vz, life) {
    const pt = pool.p[pool.next];
    pool.next = (pool.next + 1) % MAX;
    pt.x = x; pt.y = y; pt.z = z;
    pt.vx = vx; pt.vy = vy; pt.vz = vz;
    pt.life = life;
  }

  function stepPool(pool, dt, gravity, drag) {
    for (let i = 0; i < MAX; i++) {
      const pt = pool.p[i];
      if (pt.life <= 0) { pool.pos[i * 3 + 1] = -99; continue; }
      pt.life -= dt;
      pt.vy += gravity * dt;
      pt.vx *= drag; pt.vz *= drag;
      pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.z += pt.vz * dt;
      if (pt.y < 0.02 && gravity < 0) { pt.y = 0.02; pt.vx *= 0.6; pt.vz *= 0.6; pt.vy = 0; }
      pool.pos[i * 3] = pt.x;
      pool.pos[i * 3 + 1] = pt.y;
      pool.pos[i * 3 + 2] = pt.z;
    }
    pool.geo.attributes.position.needsUpdate = true;
  }

  const R = () => Math.random() - 0.5;

  return {
    /**
     * toolId: unealta curenta; pts: puncte world ale lamei;
     * melting: true daca chiar topeste zapada acum;
     * yaw: orientarea playerului; sweepDir: -1..1 pentru matura
     */
    emit(toolId, pts, melting, yaw, sweepDir) {
      if (!melting) return;
      // directia "inainte" a playerului in lume
      const fx = Math.sin(yaw), fz = Math.cos(yaw);
      // lateral
      const lx = Math.cos(yaw), lz = -Math.sin(yaw);

      if (toolId === 'shovel') {
        for (let i = 0; i < 4; i++) {
          const p = pts[(Math.random() * pts.length) | 0];
          spawn(chunks, p.x + R() * 0.25, 0.12 + Math.random() * 0.2, p.z + R() * 0.25,
            fx * 1.6 + R() * 1.6, 1.8 + Math.random() * 1.2, fz * 1.6 + R() * 1.6, 0.8);
        }
        // praf fin pe langa bucati
        const pd = pts[(Math.random() * pts.length) | 0];
        spawn(dust, pd.x + R() * 0.3, 0.1, pd.z + R() * 0.3, fx + R(), 1 + Math.random(), fz + R(), 0.5);
      } else if (toolId === 'pusher') {
        for (let i = 0; i < 7; i++) {
          const p = pts[(Math.random() * pts.length) | 0];
          spawn(chunks, p.x + R() * 0.4, 0.15 + Math.random() * 0.25, p.z + R() * 0.4,
            fx * 1.8 + R() * 2.4, 2.0 + Math.random() * 1.4, fz * 1.8 + R() * 2.4, 0.95);
        }
        for (let i = 0; i < 2; i++) {
          const pd = pts[(Math.random() * pts.length) | 0];
          spawn(dust, pd.x + R() * 0.5, 0.12, pd.z + R() * 0.5, fx * 1.5 + R(), 1.2 + Math.random(), fz * 1.5 + R(), 0.6);
        }
      } else if (toolId === 'broom') {
        const dir = sweepDir >= 0 ? 1 : -1;
        for (let i = 0; i < 6; i++) {
          const p = pts[(Math.random() * pts.length) | 0];
          spawn(dust, p.x + R() * 0.25, 0.06 + Math.random() * 0.1, p.z + R() * 0.25,
            lx * dir * (2.2 + Math.random() * 1.2) + R() * 0.6, 0.9 + Math.random() * 0.7,
            lz * dir * (2.2 + Math.random() * 1.2) + R() * 0.6, 0.6);
        }
        // cateva firicele albe mai mari
        const pc = pts[(Math.random() * pts.length) | 0];
        spawn(chunks, pc.x, 0.08, pc.z, lx * dir * 1.8 + R(), 1 + Math.random() * 0.6, lz * dir * 1.8 + R(), 0.5);
      } else if (toolId === 'blower') {
        for (let i = 0; i < 10; i++) {
          const p = pts[(Math.random() * pts.length) | 0];
          spawn(dust, p.x + R() * 0.4, 0.1 + Math.random() * 0.4, p.z + R() * 0.4,
            fx * (4.5 + Math.random() * 2.5) + R() * 1.4, 1.5 + Math.random() * 1.8,
            fz * (4.5 + Math.random() * 2.5) + R() * 1.4, 0.9);
        }
        // bucati mari aruncate de jet
        for (let i = 0; i < 2; i++) {
          const p2 = pts[(Math.random() * pts.length) | 0];
          spawn(chunks, p2.x, 0.15 + Math.random() * 0.2, p2.z,
            fx * (3.5 + Math.random() * 1.5) + R() * 1.8, 2.4 + Math.random() * 1.2,
            fz * (3.5 + Math.random() * 1.5) + R() * 1.8, 0.8);
        }
      } else if (toolId === 'heat') {
        for (let i = 0; i < 5; i++) {
          const p = pts[(Math.random() * pts.length) | 0];
          spawn(steam, p.x + R() * 0.4, 0.08 + Math.random() * 0.15, p.z + R() * 0.4,
            R() * 0.35, 1.1 + Math.random() * 0.8, R() * 0.35, 1.3);
        }
        // stropi mici de apa topita
        const pw = pts[(Math.random() * pts.length) | 0];
        spawn(dust, pw.x + R() * 0.3, 0.06, pw.z + R() * 0.3, R() * 1.2, 0.8 + Math.random() * 0.5, R() * 1.2, 0.4);
      }
    },
    update(dt) {
      stepPool(chunks, dt, -6.5, 0.96);
      stepPool(dust, dt, -2.2, 0.97);
      stepPool(steam, dt, 0.6, 0.985); // aburul urca
    }
  };
}
