/* CONTROLE
   - Joystick analogic stanga jos (touch/mouse), dead zone 20%, 360°.
   - WASD (+ sageti) pe tastatura.
   - Rotire camera: right-mouse-drag pe PC, touch pe jumatatea dreapta pe mobil.
   Iesire:
     input.x, input.z   -> spatiul de intrare (fata/dreapta la cameră)
     input.magnitude    -> 0..1 (dupa dead zone)
     camera.yaw, pitch  -> unghiuri orbit ale camerei
*/

export function createControls() {
  const input = { x: 0, z: 0, magnitude: 0 };
  const camera = { yaw: 0, pitch: 0.86, dragging: false }; // yaw = 0 => camera in +Z fata de player

  const keys = { w: 0, a: 0, s: 0, d: 0 };
  const stick = { active: false, cx: 0, cy: 0, dx: 0, dy: 0, pid: -1 };
  const look = { active: false, px: 0, py: 0, pid: -1 };

  const joyEl = document.getElementById('joystick');
  const knobEl = document.getElementById('joy-knob');
  const canvas = document.getElementById('game');

  const joyRect = () => joyEl.getBoundingClientRect();
  const R = () => joyRect().width * 0.5;

  function drawKnob() {
    const r = R();
    const d = Math.hypot(stick.dx, stick.dy);
    const capped = d > r ? r : d;
    const kx = d > 0 ? (stick.dx / d) * capped : 0;
    const ky = d > 0 ? (stick.dy / d) * capped : 0;
    knobEl.style.transform = `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`;
  }
  function resetKnob() {
    stick.dx = 0; stick.dy = 0;
    knobEl.style.transform = 'translate(-50%, -50%)';
  }

  /* -------- JOYSTICK -------- */
  joyEl.style.touchAction = 'none';
  joyEl.addEventListener('pointerdown', (e) => {
    stick.active = true; stick.pid = e.pointerId;
    const rect = joyRect();
    stick.cx = rect.left + rect.width * 0.5;
    stick.cy = rect.top + rect.height * 0.5;
    stick.dx = e.clientX - stick.cx;
    stick.dy = e.clientY - stick.cy;
    joyEl.setPointerCapture(e.pointerId);
    drawKnob();
    e.preventDefault();
    e.stopPropagation();
  });
  joyEl.addEventListener('pointermove', (e) => {
    if (!stick.active || e.pointerId !== stick.pid) return;
    stick.dx = e.clientX - stick.cx;
    stick.dy = e.clientY - stick.cy;
    drawKnob();
  });
  const endStick = (e) => {
    if (stick.pid !== -1 && e.pointerId !== stick.pid) return;
    stick.active = false; stick.pid = -1;
    resetKnob();
  };
  joyEl.addEventListener('pointerup', endStick);
  joyEl.addEventListener('pointercancel', endStick);
  joyEl.addEventListener('lostpointercapture', endStick);

  /* -------- CAMERA LOOK -------- */
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', (e) => {
    const isMouseRight = e.pointerType === 'mouse' && e.button === 2;
    const touchOnRight = e.pointerType === 'touch' && e.clientX > window.innerWidth * 0.55;
    if (!isMouseRight && !touchOnRight) return;
    look.active = true; look.pid = e.pointerId;
    look.px = e.clientX; look.py = e.clientY;
    camera.dragging = true;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!look.active || e.pointerId !== look.pid) return;
    const dx = e.clientX - look.px;
    const dy = e.clientY - look.py;
    look.px = e.clientX; look.py = e.clientY;
    camera.yaw -= dx * 0.005;
    camera.pitch = Math.max(0.35, Math.min(1.25, camera.pitch - dy * 0.003));
  });
  const endLook = (e) => {
    if (look.pid !== -1 && e.pointerId !== look.pid) return;
    look.active = false; look.pid = -1;
    camera.dragging = false;
  };
  canvas.addEventListener('pointerup', endLook);
  canvas.addEventListener('pointercancel', endLook);
  canvas.addEventListener('lostpointercapture', endLook);

  /* -------- TASTATURA -------- */
  const kmap = (k) => {
    if (k === 'w' || k === 'arrowup') return 'w';
    if (k === 's' || k === 'arrowdown') return 's';
    if (k === 'a' || k === 'arrowleft') return 'a';
    if (k === 'd' || k === 'arrowright') return 'd';
    return null;
  };
  window.addEventListener('keydown', (e) => { const k = kmap(e.key.toLowerCase()); if (k) keys[k] = 1; });
  window.addEventListener('keyup',   (e) => { const k = kmap(e.key.toLowerCase()); if (k) keys[k] = 0; });

  // Etapa 17 QA fix: touch axes/brake API for TouchControlSystem (Etapa 16)
  const touch = { active: false, x: 0, z: 0, brake: false };
  function setTouchAxes(dx, dy) {
    const m = Math.hypot(dx, dy);
    if (m < 0.001) { touch.active = false; touch.x = 0; touch.z = 0; return; }
    touch.active = true;
    touch.x = Math.max(-1, Math.min(1, dx));
    touch.z = Math.max(-1, Math.min(1, -dy));
  }
  function setBrake(on) { touch.brake = !!on; }

  return {
    input, camera, setTouchAxes, setBrake,
    update() {
      let x = 0, z = 0, mag = 0;

      if (stick.active) {
        const r = R();
        const d = Math.hypot(stick.dx, stick.dy);
        const raw = Math.min(d, r) / r;
        if (raw > 0.2) {
          const m = (raw - 0.2) / 0.8; // remap
          const nx = stick.dx / d;
          const ny = stick.dy / d;
          x = nx * m;
          z = -ny * m; // sus pe joystick = inainte
          mag = m;
        }
      } else if (touch.active) {
        x = touch.x; z = touch.z;
        mag = Math.min(1, Math.hypot(x, z));
      } else {
        x = (keys.d - keys.a);
        z = (keys.w - keys.s);
        const m = Math.hypot(x, z);
        if (m > 0) {
          x /= m; z /= m;      // normalize (nu mai repede pe diagonala)
          mag = 1;             // WASD e digital
        }
      }

      if (touch.brake) mag = 0;
      input.x = touch.brake ? 0 : x;
      input.z = touch.brake ? 0 : z;
      input.magnitude = mag;
    }
  };
}
