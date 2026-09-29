// Overlay simplu peste canvas cand gameState.screen === 'paused'.

import { SCREENS } from '../state/GameState.js';

const STYLE = `
#pause-overlay {
  position: fixed; inset: 0; background: rgba(15,20,32,0.65);
  display: none; align-items: center; justify-content: center; z-index: 30;
  font: 600 15px system-ui, sans-serif; color: #fff;
}
#pause-overlay.visible { display: flex; }
#pause-overlay .box {
  background: #1c2434; border: 1px solid rgba(255,255,255,0.15);
  border-radius: 14px; padding: 24px 32px; min-width: 220px;
  text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.4);
}
#pause-overlay h2 { margin: 0 0 18px; font-size: 20px; letter-spacing: 0.4px; }
#pause-overlay button {
  display: block; width: 100%; margin: 8px 0;
  padding: 10px 14px; border-radius: 8px; cursor: pointer;
  border: 1px solid rgba(255,255,255,0.2); background: #2a3244; color: #fff;
  font: 600 14px system-ui;
}
#pause-overlay button:hover { filter: brightness(1.2); }
`;

export function createPauseOverlay(gameState, settingsPanel) {
  let root = null;

  function injectStyle() {
    if (document.getElementById('pause-style')) return;
    const s = document.createElement('style');
    s.id = 'pause-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function build() {
    if (root) return root;
    injectStyle();
    root = document.createElement('div');
    root.id = 'pause-overlay';
    root.innerHTML = `
      <div class="box">
        <h2>PAUZA</h2>
        <button data-a="resume">Reia</button>
        <button data-a="settings">Setari</button>
      </div>`;
    document.body.appendChild(root);

    root.querySelector('[data-a="resume"]').addEventListener('click', resume);
    root.querySelector('[data-a="settings"]').addEventListener('click', () => {
      resume();
      if (settingsPanel) settingsPanel.open();
    });
    return root;
  }

  function pause() {
    build();
    root.classList.add('visible');
    gameState.setScreen(SCREENS.PAUSED);
  }
  function resume() {
    if (root) root.classList.remove('visible');
    if (gameState.screen === SCREENS.PAUSED) gameState.setScreen(SCREENS.PLAYING);
  }
  function toggle() {
    if (gameState.isPaused()) resume(); else pause();
  }

  return { pause, resume, toggle };
}
