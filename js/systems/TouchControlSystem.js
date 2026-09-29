// ETAPA 16 — Touch controls: dual virtual joystick + butoane action.
// Multi-touch cu identifier tracking. Emit evenimente pentru controls/vehicle.

import { MOBILE_LAYOUT } from '../config/mobile.js?v=25';
import { detectTouchDevice } from '../config/quality.js?v=25';

export function createTouchControlSystem({ settingsStore, haptics, onMovement, onCamera, onAction, onMenu } = {}) {
  const listeners = { movement: new Set(), camera: new Set(), action: new Set(), menu: new Set() };
  if (typeof onMovement === 'function') listeners.movement.add(onMovement);
  if (typeof onCamera === 'function') listeners.camera.add(onCamera);
  if (typeof onAction === 'function') listeners.action.add(onAction);
  if (typeof onMenu === 'function') listeners.menu.add(onMenu);

  const supported = typeof document !== 'undefined';
  let visible = false;
  let root = null;
  let leftPad = null, leftKnob = null, rightPad = null, rightKnob = null;
  let btnLayer = null;
  const buttons = new Map(); // id -> { el, active }
  const touches = new Map(); // touchId -> { role, startX, startY, x, y }

  function shouldShow() {
    if (!supported) return false;
    if (!settingsStore || !settingsStore.state) return detectTouchDevice();
    const mode = settingsStore.state.touchUi || 'auto';
    if (mode === 'off') return false;
    if (mode === 'on') return true;
    return detectTouchDevice();
  }

  function on(evt, cb) {
    const s = listeners[evt];
    if (!s || typeof cb !== 'function') return () => {};
    s.add(cb);
    return () => s.delete(cb);
  }

  function _emit(evt, payload) {
    const s = listeners[evt]; if (!s) return;
    for (const cb of s) { try { cb(payload); } catch {} }
  }

  function _buildDom() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'touch-ui';
    root.setAttribute('data-touch-ui', '1');
    root.style.cssText = [
      'position:fixed', 'inset:0', 'pointer-events:none',
      'z-index:150', 'display:none',
      'user-select:none', '-webkit-user-select:none',
      'touch-action:none'
    ].join(';');

    // Left joystick (movement)
    const sz = MOBILE_LAYOUT.joystick.size;
    const la = MOBILE_LAYOUT.joystick.leftAnchor;
    leftPad = document.createElement('div');
    leftPad.className = 'touch-joystick left';
    leftPad.style.cssText = [
      'position:absolute',
      'left:' + la.x + 'px',
      'bottom:' + Math.abs(la.y) + 'px',
      'width:' + sz + 'px', 'height:' + sz + 'px',
      'border-radius:50%',
      'background:rgba(30,40,60,0.35)',
      'border:2px solid rgba(255,255,255,0.25)',
      'pointer-events:auto',
      'touch-action:none'
    ].join(';');
    leftKnob = document.createElement('div');
    leftKnob.style.cssText = [
      'position:absolute',
      'left:50%', 'top:50%',
      'transform:translate(-50%,-50%)',
      'width:' + Math.round(sz * 0.42) + 'px', 'height:' + Math.round(sz * 0.42) + 'px',
      'border-radius:50%',
      'background:rgba(74,158,255,0.85)',
      'box-shadow:0 2px 6px rgba(0,0,0,0.35)',
      'pointer-events:none'
    ].join(';');
    leftPad.appendChild(leftKnob);

    // Right joystick (camera)
    const ra = MOBILE_LAYOUT.joystick.rightAnchor;
    rightPad = document.createElement('div');
    rightPad.className = 'touch-joystick right';
    rightPad.style.cssText = [
      'position:absolute',
      'right:' + Math.abs(ra.x) + 'px',
      'bottom:' + Math.abs(ra.y) + 'px',
      'width:' + sz + 'px', 'height:' + sz + 'px',
      'border-radius:50%',
      'background:rgba(30,40,60,0.35)',
      'border:2px solid rgba(255,255,255,0.25)',
      'pointer-events:auto',
      'touch-action:none'
    ].join(';');
    rightKnob = document.createElement('div');
    rightKnob.style.cssText = [
      'position:absolute',
      'left:50%', 'top:50%',
      'transform:translate(-50%,-50%)',
      'width:' + Math.round(sz * 0.42) + 'px', 'height:' + Math.round(sz * 0.42) + 'px',
      'border-radius:50%',
      'background:rgba(160,120,255,0.85)',
      'box-shadow:0 2px 6px rgba(0,0,0,0.35)',
      'pointer-events:none'
    ].join(';');
    rightPad.appendChild(rightKnob);

    // Action buttons layer (bottom-right, above right joystick)
    btnLayer = document.createElement('div');
    btnLayer.style.cssText = 'position:absolute;right:0;top:0;bottom:0;width:200px;pointer-events:none;';
    for (const btn of MOBILE_LAYOUT.actionButtons) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = btn.label;
      b.setAttribute('data-action', btn.id);
      b.style.cssText = [
        'position:absolute',
        'right:' + Math.abs(btn.x) + 'px',
        'top:' + (btn.y > 0 ? btn.y + 'px' : 'auto'),
        (btn.y < 0 ? 'bottom:' + Math.abs(btn.y) + 'px' : ''),
        'width:56px', 'height:56px',
        'border-radius:50%',
        'border:2px solid rgba(255,255,255,0.3)',
        'background:' + btn.color,
        'color:#fff',
        'font-size:24px',
        'pointer-events:auto',
        'touch-action:none',
        'cursor:pointer'
      ].join(';');
      const onDown = (ev) => {
        ev.preventDefault();
        buttons.get(btn.id).active = true;
        b.style.transform = 'scale(0.92)';
        try { haptics && haptics.light && haptics.light(); } catch {}
        _emit('action', { id: btn.id, phase: 'down' });
      };
      const onUp = (ev) => {
        ev.preventDefault();
        buttons.get(btn.id).active = false;
        b.style.transform = '';
        _emit('action', { id: btn.id, phase: 'up' });
      };
      b.addEventListener('touchstart', onDown, { passive: false });
      b.addEventListener('touchend', onUp, { passive: false });
      b.addEventListener('touchcancel', onUp, { passive: false });
      b.addEventListener('pointerdown', onDown);
      b.addEventListener('pointerup', onUp);
      b.addEventListener('pointercancel', onUp);
      b.addEventListener('pointerleave', onUp);
      btnLayer.appendChild(b);
      buttons.set(btn.id, { el: b, active: false });
    }

    // Menu button (top-right)
    const menuBtn = document.createElement('button');
    menuBtn.type = 'button';
    menuBtn.textContent = '☰';
    menuBtn.setAttribute('aria-label', 'Meniu');
    menuBtn.style.cssText = [
      'position:absolute', 'top:12px', 'right:12px',
      'width:44px', 'height:44px', 'border-radius:10px',
      'border:1px solid rgba(255,255,255,0.25)',
      'background:rgba(20,26,38,0.7)',
      'color:#fff', 'font-size:22px',
      'pointer-events:auto',
      'touch-action:manipulation',
      'cursor:pointer'
    ].join(';');
    menuBtn.addEventListener('click', (ev) => {
      ev.preventDefault();
      _emit('menu', { phase: 'open' });
      try { haptics && haptics.medium && haptics.medium(); } catch {}
    });
    btnLayer.appendChild(menuBtn);

    root.appendChild(leftPad);
    root.appendChild(rightPad);
    root.appendChild(btnLayer);
    document.body.appendChild(root);

    _bindPadEvents(leftPad, 'left');
    _bindPadEvents(rightPad, 'right');
    return root;
  }

  function _bindPadEvents(pad, role) {
    pad.addEventListener('touchstart', (ev) => {
      ev.preventDefault();
      const rect = pad.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // Prima atingere care nu are asignare
      for (const t of ev.changedTouches) {
        if (touches.size >= 4) break;
        if (!touches.has(t.identifier)) {
          touches.set(t.identifier, { role, cx, cy, x: t.clientX, y: t.clientY });
          _updatePad(role);
          try { haptics && haptics.light && haptics.light(); } catch {}
          break;
        }
      }
    }, { passive: false });

    pad.addEventListener('touchmove', (ev) => {
      ev.preventDefault();
      for (const t of ev.changedTouches) {
        const rec = touches.get(t.identifier);
        if (!rec || rec.role !== role) continue;
        rec.x = t.clientX; rec.y = t.clientY;
      }
      _updatePad(role);
    }, { passive: false });

    const endHandler = (ev) => {
      ev.preventDefault();
      for (const t of ev.changedTouches) {
        const rec = touches.get(t.identifier);
        if (!rec || rec.role !== role) continue;
        touches.delete(t.identifier);
      }
      _updatePad(role);
    };
    pad.addEventListener('touchend', endHandler, { passive: false });
    pad.addEventListener('touchcancel', endHandler, { passive: false });
  }

  function _updatePad(role) {
    const maxD = MOBILE_LAYOUT.joystick.maxDistance;
    const dz = MOBILE_LAYOUT.joystick.deadzone;
    // Cauta prima atingere activa pentru rolul acesta
    let active = null;
    for (const rec of touches.values()) {
      if (rec.role === role) { active = rec; break; }
    }
    let dx = 0, dy = 0;
    if (active) {
      const rx = active.x - active.cx;
      const ry = active.y - active.cy;
      const dist = Math.min(maxD, Math.sqrt(rx * rx + ry * ry));
      const ang = Math.atan2(ry, rx);
      const clampedX = Math.cos(ang) * dist;
      const clampedY = Math.sin(ang) * dist;
      dx = clampedX / maxD;
      dy = clampedY / maxD;
      // Deadzone
      const mag = Math.sqrt(dx * dx + dy * dy);
      if (mag < dz) { dx = 0; dy = 0; }
    }
    if (role === 'left') {
      if (leftKnob) {
        leftKnob.style.transform = 'translate(calc(-50% + ' + (dx * maxD) + 'px), calc(-50% + ' + (dy * maxD) + 'px))';
      }
      _emit('movement', { dx, dy });
    } else {
      if (rightKnob) {
        rightKnob.style.transform = 'translate(calc(-50% + ' + (dx * maxD) + 'px), calc(-50% + ' + (dy * maxD) + 'px))';
      }
      const sens = (settingsStore && settingsStore.state && settingsStore.state.joystickSensitivity) || 1.0;
      _emit('camera', { dx: dx * sens, dy: dy * sens });
    }
  }

  function show() {
    if (!supported) return;
    _buildDom();
    root.style.display = 'block';
    visible = true;
  }

  function hide() {
    if (root) root.style.display = 'none';
    visible = false;
    // clear touches
    touches.clear();
  }

  function toggle(on) {
    if (typeof on === 'boolean') { on ? show() : hide(); return; }
    if (visible) hide(); else show();
  }

  function isVisible() { return visible; }

  function refreshVisibility() {
    if (shouldShow()) show(); else hide();
  }

  function isButtonActive(id) {
    const b = buttons.get(id);
    return !!(b && b.active);
  }

  function destroy() {
    if (root && root.parentNode) root.parentNode.removeChild(root);
    root = null; leftPad = null; rightPad = null; btnLayer = null;
    touches.clear();
    buttons.clear();
    visible = false;
  }

  return {
    on,
    show, hide, toggle, isVisible,
    refreshVisibility, shouldShow,
    isButtonActive,
    destroy,
    _simulate(dx, dy, role = 'left') {
      // debug hook
      _emit('movement', { dx, dy });
      if (role === 'right') _emit('camera', { dx, dy });
    }
  };
}
