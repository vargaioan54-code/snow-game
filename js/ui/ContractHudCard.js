// Card mic in HUD (stanga sus, sub level-card) — activeContract cu progress + timer.
// Reactiv la ContractStore. Dispare cand nu exista contract activ.

import { CONTRACT_STATUS } from '../config/contractStatus.js';

const STYLE = `
#contract-hud {
  position: fixed;
  top: calc(70px + env(safe-area-inset-top));
  left: calc(12px + env(safe-area-inset-left));
  min-width: 200px; max-width: 260px;
  background: rgba(15,20,32,0.75);
  border: 1px solid rgba(255,205,80,0.5);
  border-radius: 10px;
  padding: 8px 10px;
  color: #fff;
  font: 600 12px system-ui, sans-serif;
  z-index: 6;
  display: none;
  box-shadow: 0 4px 14px rgba(0,0,0,0.35);
}
#contract-hud.visible { display: block; }
#contract-hud .ch-title {
  font-size: 12px; color: #ffd870;
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 4px;
}
#contract-hud .ch-title .ch-icon { font-size: 14px; }
#contract-hud .ch-bar-track {
  height: 6px; background: rgba(255,255,255,0.10);
  border-radius: 3px; overflow: hidden;
  margin: 4px 0 3px;
}
#contract-hud .ch-bar-fill {
  height: 100%; background: #7ce07c;
  transition: width 0.15s ease-out;
}
#contract-hud .ch-row {
  display: flex; justify-content: space-between;
  font: 500 11px system-ui; color: #cfd6e5;
}
#contract-hud .ch-timer {
  color: #7cb8ff; font-family: monospace; font-weight: 700;
}
#contract-hud .ch-timer.urgent { color: #ff8080; }
`;

function fmtTime(ms) {
  if (ms <= 0) return '0:00';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss < 10 ? '0' : ''}${ss}`;
}

export function createContractHudCard(contractStore) {
  // inject style once
  if (!document.getElementById('contract-hud-style')) {
    const s = document.createElement('style');
    s.id = 'contract-hud-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  const root = document.createElement('div');
  root.id = 'contract-hud';
  root.innerHTML = `
    <div class="ch-title"><span class="ch-icon">📋</span><span class="ch-name">—</span></div>
    <div class="ch-bar-track"><div class="ch-bar-fill" style="width:0%"></div></div>
    <div class="ch-row">
      <span class="ch-pct">0%</span>
      <span class="ch-timer">--:--</span>
    </div>
  `;
  document.body.appendChild(root);

  const el = {
    root,
    icon: root.querySelector('.ch-icon'),
    name: root.querySelector('.ch-name'),
    fill: root.querySelector('.ch-bar-fill'),
    pct: root.querySelector('.ch-pct'),
    timer: root.querySelector('.ch-timer')
  };

  function render() {
    const active = contractStore.getActive();
    if (!active || (active.status !== CONTRACT_STATUS.ACTIVE && active.status !== CONTRACT_STATUS.ACCEPTED)) {
      root.classList.remove('visible');
      return;
    }
    root.classList.add('visible');
    el.name.textContent = active.title;
    const pct = Math.round((active.progress || 0) * 100);
    el.fill.style.width = pct + '%';
    el.pct.textContent = pct + '% / ' + Math.round(active.targetPct * 100) + '%';
    if (active.status === CONTRACT_STATUS.ACCEPTED) {
      el.timer.textContent = 'ACCEPTAT';
      el.timer.classList.remove('urgent');
    } else if (active.deadline > 0) {
      const remainMs = active.deadline - Date.now();
      el.timer.textContent = fmtTime(remainMs);
      if (remainMs < 15000) el.timer.classList.add('urgent');
      else el.timer.classList.remove('urgent');
    } else {
      el.timer.textContent = '—:—';
      el.timer.classList.remove('urgent');
    }
  }

  // Update la orice change in contracts / activeContractId
  contractStore.on((_s, changed) => {
    if (changed.includes('contracts') || changed.includes('activeContractId')) render();
  });

  // Update timer live: 1Hz suficient pt display
  const timerInterval = setInterval(render, 500);

  render();
  return {
    render,
    dispose() { clearInterval(timerInterval); root.remove(); }
  };
}
