// Panel modal creat dinamic. Deschidere -> gameState.screen = 'settings_open'.
// Scrie in SettingsStore, autosave-ul se ocupa restul.

import { SCREENS } from '../state/GameState.js';

const STYLE = `
#settings-overlay {
  position: fixed; inset: 0; background: rgba(15,20,32,0.7);
  display: flex; align-items: center; justify-content: center; z-index: 40;
  font: 400 14px system-ui, sans-serif; color: #fff;
}
#settings-overlay .panel {
  background: #1c2434; border: 1px solid rgba(255,255,255,0.15);
  border-radius: 14px; padding: 22px 26px; min-width: 300px; max-width: 90vw;
  box-shadow: 0 10px 40px rgba(0,0,0,0.4);
}
#settings-overlay h2 {
  margin: 0 0 16px; font-size: 18px; font-weight: 700; letter-spacing: 0.3px;
}
#settings-overlay .row {
  display: flex; align-items: center; justify-content: space-between;
  margin: 10px 0; gap: 12px;
}
#settings-overlay .row label { flex: 1; }
#settings-overlay .row input[type=range] { width: 140px; }
#settings-overlay .row select {
  background: #2a3244; color: #fff; border: 1px solid rgba(255,255,255,0.2);
  border-radius: 6px; padding: 4px 8px;
}
#settings-overlay .actions {
  display: flex; gap: 10px; margin-top: 20px;
}
#settings-overlay button.btn {
  flex: 1; padding: 10px 14px; border-radius: 8px; cursor: pointer;
  border: 1px solid rgba(255,255,255,0.2); background: #2a3244; color: #fff;
  font: 600 14px system-ui;
}
#settings-overlay button.btn.danger { background: #7a2020; border-color: #a03030; }
#settings-overlay button.btn:hover { filter: brightness(1.2); }
`;

export function createSettingsPanel(settingsStore, gameState, saveSystem, playerStore) {
  let root = null;

  function injectStyle() {
    if (document.getElementById('settings-style')) return;
    const s = document.createElement('style');
    s.id = 'settings-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function build() {
    if (root) return root;
    injectStyle();
    root = document.createElement('div');
    root.id = 'settings-overlay';
    root.style.display = 'none';
    const st = settingsStore.state;
    const num = (n, fb=0) => (Number.isFinite(+n) ? +n : fb).toFixed(2);
    root.innerHTML = `
      <div class="panel" style="max-height:82vh;overflow-y:auto">
        <h2>Setări</h2>

        <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#8fa;margin-top:6px">Grafică</div>
        <div class="row"><label>Calitate (Etapa 16)</label>
          <select data-k="quality">
            <option value="auto" ${st.quality==='auto'?'selected':''}>Auto</option>
            <option value="low" ${st.quality==='low'?'selected':''}>Redus</option>
            <option value="medium" ${st.quality==='medium'?'selected':''}>Mediu</option>
            <option value="high" ${st.quality==='high'?'selected':''}>Înalt</option>
            <option value="ultra" ${st.quality==='ultra'?'selected':''}>Ultra</option>
          </select>
        </div>
        <div class="row"><label>Grafică (legacy)</label>
          <select data-k="graphics">
            <option value="high" ${st.graphics==='high'?'selected':''}>Înalt</option>
            <option value="medium" ${st.graphics==='medium'?'selected':''}>Mediu</option>
            <option value="low" ${st.graphics==='low'?'selected':''}>Scăzut</option>
          </select>
        </div>

        <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#8fa;margin-top:14px">Sunet</div>
        <div class="row"><label>Mute total</label><input type="checkbox" data-k="mute" ${st.mute?'checked':''}></div>
        <div class="row"><label>Master <span data-out="volumeMaster">${num(st.volumeMaster,0.7)}</span></label>
          <input type="range" data-k="volumeMaster" min="0" max="1" step="0.05" value="${st.volumeMaster}">
        </div>
        <div class="row"><label>Muzică <span data-out="volumeMusic">${num(st.volumeMusic,0.5)}</span></label>
          <input type="range" data-k="volumeMusic" min="0" max="1" step="0.05" value="${st.volumeMusic}">
        </div>
        <div class="row"><label>SFX <span data-out="volumeSfx">${num(st.volumeSfx,0.9)}</span></label>
          <input type="range" data-k="volumeSfx" min="0" max="1" step="0.05" value="${st.volumeSfx}">
        </div>
        <div class="row"><label>UI <span data-out="volumeUi">${num(st.volumeUi,0.8)}</span></label>
          <input type="range" data-k="volumeUi" min="0" max="1" step="0.05" value="${st.volumeUi}">
        </div>
        <div class="row"><label>Sunet (on/off legacy)</label><input type="checkbox" data-k="sound" ${st.sound?'checked':''}></div>
        <div class="row"><label>Muzică (on/off legacy)</label><input type="checkbox" data-k="music" ${st.music?'checked':''}></div>

        <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#8fa;margin-top:14px">Controale</div>
        <div class="row"><label>Touch UI</label>
          <select data-k="touchUi">
            <option value="auto" ${st.touchUi==='auto'?'selected':''}>Auto</option>
            <option value="on" ${st.touchUi==='on'?'selected':''}>Pornit</option>
            <option value="off" ${st.touchUi==='off'?'selected':''}>Oprit</option>
          </select>
        </div>
        <div class="row"><label>Sensibilitate joystick <span data-out="joystickSensitivity">${num(st.joystickSensitivity,1)}</span></label>
          <input type="range" data-k="joystickSensitivity" min="0.3" max="2.5" step="0.05" value="${st.joystickSensitivity}">
        </div>
        <div class="row"><label>Invert Y cameră</label><input type="checkbox" data-k="invertY" ${st.invertY?'checked':''}></div>
        <div class="row"><label>Vibrații (mobil)</label><input type="checkbox" data-k="haptics" ${st.haptics?'checked':''}></div>
        <div class="row"><label>Sensibilitate cameră (legacy) <span data-out="sensitivity">${num(st.sensitivity,1)}</span></label>
          <input type="range" data-k="sensitivity" min="0.3" max="2.0" step="0.05" value="${st.sensitivity}">
        </div>

        <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#8fa;margin-top:14px">Baterie</div>
        <div class="row"><label>Battery Saver</label><input type="checkbox" data-k="batterySaver" ${st.batterySaver?'checked':''}></div>

        <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#8fa;margin-top:14px">Accesibilitate</div>
        <div class="row"><label>Font scale <span data-out="fontScale">${num(st.fontScale,1)}</span></label>
          <input type="range" data-k="fontScale" min="0.8" max="1.5" step="0.05" value="${st.fontScale}">
        </div>
        <div class="row"><label>Reduced motion</label><input type="checkbox" data-k="reducedMotion" ${st.reducedMotion?'checked':''}></div>

        <div class="actions">
          <button class="btn" data-a="close">Închide</button>
          <button class="btn" data-a="resetSettings">Reset setări</button>
          <button class="btn danger" data-a="reset">RESET PROGRES</button>
        </div>
      </div>`;
    document.body.appendChild(root);

    // Handlers
    root.addEventListener('click', (e) => {
      if (e.target === root) close(); // click pe overlay -> close
    });

    root.querySelectorAll('[data-k]').forEach(inp => {
      inp.addEventListener('change', () => {
        const k = inp.dataset.k;
        let v;
        if (inp.type === 'checkbox') v = inp.checked;
        else if (inp.type === 'range') v = parseFloat(inp.value);
        else v = inp.value;
        settingsStore.set({ [k]: v });
      });
      if (inp.type === 'range') {
        inp.addEventListener('input', () => {
          const out = root.querySelector('[data-out="'+inp.dataset.k+'"]');
          if (out) out.textContent = parseFloat(inp.value).toFixed(2);
        });
      }
    });

    root.querySelector('[data-a="close"]').addEventListener('click', close);
    root.querySelector('[data-a="reset"]').addEventListener('click', () => {
      if (!confirm('Sigur vrei sa resetezi TOT progresul? (monede, unelte, level, XP)')) return;
      if (saveSystem && typeof saveSystem.newGame === 'function') saveSystem.newGame();
      // dupa reset, reload pentru un start curat
      location.reload();
    });
    const resetSettingsBtn = root.querySelector('[data-a="resetSettings"]');
    if (resetSettingsBtn) resetSettingsBtn.addEventListener('click', () => {
      if (!confirm('Reset toate setările la valori implicite?')) return;
      if (typeof settingsStore.reset === 'function') settingsStore.reset();
      refresh();
    });
    return root;
  }

  function refresh() {
    if (!root) return;
    const st = settingsStore.state;
    root.querySelectorAll('[data-k]').forEach(inp => {
      const k = inp.dataset.k;
      if (inp.type === 'checkbox') inp.checked = !!st[k];
      else if (inp.type === 'range') {
        inp.value = st[k];
        const out = root.querySelector('[data-out="'+k+'"]');
        if (out) out.textContent = parseFloat(st[k]).toFixed(2);
      } else inp.value = st[k];
    });
  }

  function open() {
    build();
    refresh();
    root.style.display = 'flex';
    gameState.setScreen(SCREENS.SETTINGS_OPEN);
  }

  function close() {
    if (root) root.style.display = 'none';
    if (gameState.screen === SCREENS.SETTINGS_OPEN) gameState.setScreen(SCREENS.PLAYING);
  }

  function toggle() {
    if (root && root.style.display !== 'none') close(); else open();
  }

  return { open, close, toggle };
}
