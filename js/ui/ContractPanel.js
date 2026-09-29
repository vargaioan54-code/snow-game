// Panel modal cu 3 tab-uri (Disponibile / Active / Istoric).
// Reactiv la ContractStore + PlayerStore. Zero DOM writes in game loop.

import { CONTRACT_STATUS } from '../config/contractStatus.js';
import { CONTRACT_TYPES } from '../config/contracts.js';

const STYLE = `
#contract-overlay {
  position: fixed; inset: 0; background: rgba(15,20,32,0.78);
  display: none; align-items: center; justify-content: center;
  z-index: 45; font: 400 14px system-ui, sans-serif; color: #fff;
}
#contract-overlay.visible { display: flex; }
#contract-overlay .panel {
  background: #1c2434; border: 1px solid rgba(255,255,255,0.15);
  border-radius: 14px; padding: 16px 18px;
  min-width: 320px; max-width: min(92vw, 720px);
  max-height: 88vh; overflow: hidden; display: flex; flex-direction: column;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
}
#contract-overlay h2 {
  margin: 0 0 12px; font-size: 18px; font-weight: 700;
  display: flex; align-items: center; justify-content: space-between;
}
#contract-overlay .close-x {
  background: transparent; border: none; color: #aab; font: 700 18px system-ui;
  cursor: pointer; padding: 0 6px;
}
#contract-overlay .tabs {
  display: flex; gap: 6px; margin-bottom: 10px;
}
#contract-overlay .tab-btn {
  flex: 1; padding: 8px 10px; border-radius: 8px; cursor: pointer;
  border: 1px solid rgba(255,255,255,0.15); background: #242c3c; color: #fff;
  font: 600 12px system-ui;
}
#contract-overlay .tab-btn.active { background: #3a4a68; }
#contract-overlay .list {
  overflow-y: auto; flex: 1; padding-right: 2px;
}
#contract-overlay .card {
  background: #242c3c; border: 1px solid rgba(255,255,255,0.10);
  border-radius: 10px; padding: 10px 12px; margin-bottom: 8px;
  cursor: pointer; transition: background 0.1s;
}
#contract-overlay .card:hover { background: #2d374a; }
#contract-overlay .card.locked { opacity: 0.55; cursor: not-allowed; }
#contract-overlay .card.active { border-color: #ffd870; }
#contract-overlay .card.done { border-color: #7ce07c; }
#contract-overlay .card.failed { border-color: #ff8080; opacity: 0.7; }
#contract-overlay .card .row1 {
  display: flex; align-items: center; gap: 8px; margin-bottom: 4px;
}
#contract-overlay .card .icon { font-size: 20px; }
#contract-overlay .card .title { flex: 1; font: 700 13px system-ui; }
#contract-overlay .card .diff {
  font: 600 10px system-ui; padding: 2px 6px; border-radius: 4px;
  background: rgba(255,255,255,0.10);
}
#contract-overlay .card .diff.easy    { background: rgba(120,220,120,0.20); color: #90eea0; }
#contract-overlay .card .diff.medium  { background: rgba(220,180,80,0.20);  color: #ffce70; }
#contract-overlay .card .diff.hard    { background: rgba(220,140,60,0.20);  color: #ffb060; }
#contract-overlay .card .diff.expert  { background: rgba(220,80,80,0.20);   color: #ff8080; }
#contract-overlay .card .meta {
  display: flex; flex-wrap: wrap; gap: 10px;
  font: 500 11px system-ui; color: #cfd6e5;
}
#contract-overlay .card .stars { color: #ffd870; letter-spacing: 1px; }
#contract-overlay .empty {
  padding: 16px; text-align: center; color: #7c8494; font: 500 12px system-ui;
}

#contract-detail-overlay {
  position: fixed; inset: 0; background: rgba(15,20,32,0.82);
  display: none; align-items: center; justify-content: center;
  z-index: 46; font: 400 14px system-ui, sans-serif; color: #fff;
}
#contract-detail-overlay.visible { display: flex; }
#contract-detail-overlay .panel {
  background: #1c2434; border: 1px solid rgba(255,205,80,0.4);
  border-radius: 14px; padding: 18px 22px;
  min-width: 320px; max-width: min(88vw, 520px);
  max-height: 86vh; overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
}
#contract-detail-overlay h2 { margin: 0 0 8px; font-size: 20px; }
#contract-detail-overlay .client { color: #cfd6e5; font: 500 12px system-ui; margin-bottom: 8px; }
#contract-detail-overlay .desc { color: #dfe4ed; font: 400 13px system-ui; margin: 8px 0 14px; }
#contract-detail-overlay .section { margin: 10px 0; }
#contract-detail-overlay .section h3 {
  margin: 0 0 6px; font: 700 12px system-ui; text-transform: uppercase;
  letter-spacing: 0.5px; color: #a0a8ba;
}
#contract-detail-overlay .rows { display: flex; flex-wrap: wrap; gap: 10px 16px; }
#contract-detail-overlay .rows .item {
  font: 600 13px system-ui; color: #fff;
}
#contract-detail-overlay .rows .item .lbl { color: #a0a8ba; font-weight: 500; margin-right: 4px; }
#contract-detail-overlay .actions {
  display: flex; gap: 10px; margin-top: 18px;
}
#contract-detail-overlay .btn {
  flex: 1; padding: 10px 14px; border-radius: 8px; cursor: pointer;
  border: 1px solid rgba(255,255,255,0.2); background: #2a3244; color: #fff;
  font: 600 13px system-ui;
}
#contract-detail-overlay .btn.primary { background: #3f7b3f; border-color: #5da05d; }
#contract-detail-overlay .btn.warn    { background: #7a4a20; border-color: #a06030; }
#contract-detail-overlay .btn.danger  { background: #7a2020; border-color: #a03030; }
#contract-detail-overlay .btn:disabled { opacity: 0.4; cursor: not-allowed; }
#contract-detail-overlay .btn:hover:not(:disabled) { filter: brightness(1.2); }
`;

const SCREEN_CONTRACTS = 'contracts_open';
const SCREEN_PLAYING = 'playing';

function starString(n) {
  const r = Math.max(0, Math.min(5, n | 0));
  return '⭐'.repeat(r) + '☆'.repeat(5 - r);
}
function fmtTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss < 10 ? '0' : ''}${ss}`;
}

export function createContractPanel(deps) {
  const { contractStore, playerStore, contractSystem, gameState, unlockSystem, audio, haptics, showBanner } = deps;

  if (!document.getElementById('contract-panel-style')) {
    const s = document.createElement('style');
    s.id = 'contract-panel-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  const root = document.createElement('div');
  root.id = 'contract-overlay';
  root.innerHTML = `
    <div class="panel">
      <h2>
        <span>📋 Contracte</span>
        <button class="close-x" data-a="close">×</button>
      </h2>
      <div class="tabs">
        <button class="tab-btn active" data-tab="available">Disponibile</button>
        <button class="tab-btn" data-tab="active">Active</button>
        <button class="tab-btn" data-tab="history">Istoric</button>
      </div>
      <div class="list" id="contract-list"></div>
    </div>
  `;
  document.body.appendChild(root);

  const detailRoot = document.createElement('div');
  detailRoot.id = 'contract-detail-overlay';
  document.body.appendChild(detailRoot);

  const listEl = root.querySelector('#contract-list');
  const tabBtns = root.querySelectorAll('.tab-btn');
  let currentTab = 'available';

  const trigger = document.createElement('button');
  trigger.id = 'contracts-trigger';
  trigger.title = 'Contracte (C)';
  trigger.style.cssText = 'position:fixed;top:calc(70px + env(safe-area-inset-top));' +
    'right:calc(12px + env(safe-area-inset-right));' +
    'width:44px;height:44px;border-radius:10px;border:1px solid rgba(255,205,80,0.5);' +
    'background:rgba(15,20,32,0.85);color:#ffd870;font-size:22px;cursor:pointer;' +
    'z-index:7;display:flex;align-items:center;justify-content:center;' +
    'box-shadow:0 4px 12px rgba(0,0,0,0.35);';
  trigger.textContent = '📋';
  trigger.addEventListener('click', () => open());
  document.body.appendChild(trigger);

  root.addEventListener('click', (e) => {
    if (e.target === root) close();
    if (e.target.matches('[data-a="close"]')) close();
    if (e.target.matches('.tab-btn')) {
      currentTab = e.target.dataset.tab;
      tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === currentTab));
      renderList();
    }
  });

  detailRoot.addEventListener('click', (e) => {
    if (e.target === detailRoot) closeDetail();
  });

  function open() {
    render();
    root.classList.add('visible');
    if (gameState) gameState.setScreen(SCREEN_CONTRACTS);
  }
  function close() {
    root.classList.remove('visible');
    detailRoot.classList.remove('visible');
    if (gameState && gameState.screen === SCREEN_CONTRACTS) gameState.setScreen(SCREEN_PLAYING);
  }
  function closeDetail() { detailRoot.classList.remove('visible'); }
  function toggle() { if (root.classList.contains('visible')) close(); else open(); }
  function render() { renderList(); }

  function renderList() {
    listEl.innerHTML = '';
    let items = [];
    if (currentTab === 'available') {
      const av = contractStore.getAvailable(playerStore.state);
      const locked = contractStore.getLocked(playerStore.state);
      items = [...av, ...locked];
      if (items.length === 0) {
        listEl.innerHTML = '<div class="empty">Niciun contract disponibil momentan.</div>';
        return;
      }
      items.sort((a, b) => a.unlockLevel - b.unlockLevel);
    } else if (currentTab === 'active') {
      items = [
        ...contractStore.listByStatus(CONTRACT_STATUS.ACCEPTED),
        ...contractStore.listByStatus(CONTRACT_STATUS.ACTIVE)
      ];
      if (items.length === 0) {
        listEl.innerHTML = '<div class="empty">Niciun contract activ. Accepta unul din tab-ul „Disponibile".</div>';
        return;
      }
    } else if (currentTab === 'history') {
      items = [
        ...contractStore.listByStatus(CONTRACT_STATUS.COMPLETED),
        ...contractStore.listByStatus(CONTRACT_STATUS.FAILED)
      ];
      if (items.length === 0) {
        listEl.innerHTML = '<div class="empty">Fara istoric momentan.</div>';
        return;
      }
      items.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
    }

    for (const c of items) {
      const type = CONTRACT_TYPES[Object.keys(CONTRACT_TYPES).find(k => CONTRACT_TYPES[k].id === c.type)] || {};
      const isLocked = !unlockSystem.isContractUnlocked(c, playerStore.state);
      const card = document.createElement('div');
      card.className = 'card';
      if (c.status === CONTRACT_STATUS.COMPLETED) card.classList.add('done');
      else if (c.status === CONTRACT_STATUS.FAILED) card.classList.add('failed');
      else if (c.status === CONTRACT_STATUS.ACTIVE || c.status === CONTRACT_STATUS.ACCEPTED) card.classList.add('active');
      else if (isLocked) card.classList.add('locked');

      let statusBadge = '';
      if (c.status === CONTRACT_STATUS.COMPLETED) statusBadge = '<span style="color:#7ce07c">✓ COMPLET</span>';
      else if (c.status === CONTRACT_STATUS.FAILED) statusBadge = '<span style="color:#ff8080">✗ ESUAT</span>';
      else if (c.status === CONTRACT_STATUS.ACTIVE) statusBadge = '<span style="color:#ffd870">● ACTIV</span>';
      else if (c.status === CONTRACT_STATUS.ACCEPTED) statusBadge = '<span style="color:#7cb8ff">◉ ACCEPTAT</span>';
      else if (isLocked) statusBadge = '<span style="color:#a0a8ba">🔒 Level ' + c.unlockLevel + '</span>';

      const stars = c.rating > 0 ? `<span class="stars">${starString(c.rating)}</span>` : '';
      const timeInfo = c.timeLimit > 0 ? fmtTime(c.timeLimit) : '—';

      card.innerHTML = `
        <div class="row1">
          <span class="icon">${type.icon || '📋'}</span>
          <span class="title">${c.title}</span>
          <span class="diff ${c.difficulty}">${c.difficulty.toUpperCase()}</span>
        </div>
        <div class="meta">
          <span>👤 ${c.client}</span>
          <span>🎯 ${Math.round(c.targetPct * 100)}%</span>
          <span>⏱ ${timeInfo}</span>
          <span>💰 ${c.baseReward.coins}</span>
          <span>⭐ ${c.baseReward.xp} XP</span>
          <span>📈 ${c.baseReward.reputation} rep</span>
          <span>${statusBadge}</span>
          ${stars}
        </div>
      `;
      card.addEventListener('click', () => openDetail(c));
      listEl.appendChild(card);
    }
  }

  function openDetail(c) {
    const type = CONTRACT_TYPES[Object.keys(CONTRACT_TYPES).find(k => CONTRACT_TYPES[k].id === c.type)] || {};
    const isLocked = !unlockSystem.isContractUnlocked(c, playerStore.state);
    const lockInfo = unlockSystem.getContractLockReason(c, playerStore.state);
    const hasActive = contractStore.state.activeContractId && contractStore.state.activeContractId !== c.id;

    let actionButtons = '';
    if (c.status === CONTRACT_STATUS.AVAILABLE && !isLocked && !hasActive) {
      actionButtons = '<button class="btn primary" data-a="accept">ACCEPTA</button>';
    } else if (c.status === CONTRACT_STATUS.AVAILABLE && isLocked) {
      const msg = lockInfo && lockInfo.reason === 'tool'
        ? `Necesita: ${lockInfo.requiredTool}`
        : `Necesita Level ${lockInfo ? lockInfo.requiredLevel : c.unlockLevel}`;
      actionButtons = `<button class="btn" disabled>🔒 ${msg}</button>`;
    } else if (c.status === CONTRACT_STATUS.AVAILABLE && hasActive) {
      actionButtons = '<button class="btn" disabled>Ai deja un contract activ</button>';
    } else if (c.status === CONTRACT_STATUS.ACCEPTED) {
      actionButtons = `
        <button class="btn primary" data-a="start">START JOB</button>
        <button class="btn warn" data-a="cancel">ANULEAZA</button>
      `;
    } else if (c.status === CONTRACT_STATUS.ACTIVE) {
      actionButtons = `
        <button class="btn primary" data-a="return">CONTINUA JOB</button>
        <button class="btn danger" data-a="abandon">ABANDONEAZA</button>
      `;
    } else if (c.status === CONTRACT_STATUS.COMPLETED) {
      actionButtons = `<button class="btn" data-a="retry">RESET (retry)</button>`;
    } else if (c.status === CONTRACT_STATUS.FAILED) {
      actionButtons = `<button class="btn primary" data-a="retry">INCEARCA DIN NOU</button>`;
    }

    const requiredToolText = c.requiredTool
      ? `<div class="rows"><div class="item"><span class="lbl">Unealta necesara:</span>${c.requiredTool}</div></div>`
      : '';
    const stars = c.rating > 0 ? `<div style="font-size:24px;color:#ffd870;letter-spacing:2px">${starString(c.rating)}</div>` : '';

    detailRoot.innerHTML = `
      <div class="panel">
        <h2>${type.icon || '📋'} ${c.title}</h2>
        <div class="client">👤 ${c.client}</div>
        ${stars}
        <div class="desc">${c.description || ''}</div>

        <div class="section">
          <h3>Zona</h3>
          <div class="rows">
            <div class="item"><span class="lbl">Locatie:</span>(${c.area.x}, ${c.area.z})</div>
            <div class="item"><span class="lbl">Raza:</span>${c.area.radius} m</div>
            <div class="item"><span class="lbl">Tip zapada:</span>${c.snowTypeHint}</div>
          </div>
        </div>

        <div class="section">
          <h3>Obiectiv</h3>
          <div class="rows">
            <div class="item"><span class="lbl">Curata:</span>${Math.round(c.targetPct * 100)}% din zona</div>
            <div class="item"><span class="lbl">Dificultate:</span>${c.difficulty}</div>
          </div>
          ${requiredToolText}
        </div>

        <div class="section">
          <h3>Timp</h3>
          <div class="rows">
            <div class="item"><span class="lbl">Timp limita:</span>${c.timeLimit > 0 ? fmtTime(c.timeLimit) : 'fara timer'}</div>
          </div>
        </div>

        <div class="section">
          <h3>Recompensa</h3>
          <div class="rows">
            <div class="item"><span class="lbl">Monede:</span>${c.baseReward.coins}</div>
            <div class="item"><span class="lbl">XP:</span>${c.baseReward.xp}</div>
            <div class="item"><span class="lbl">Reputatie:</span>${c.baseReward.reputation}</div>
          </div>
        </div>

        <div class="actions">
          ${actionButtons}
          <button class="btn" data-a="close-detail">Inchide</button>
        </div>
      </div>
    `;
    detailRoot.classList.add('visible');

    detailRoot.querySelectorAll('[data-a]').forEach(btn => {
      btn.addEventListener('click', () => {
        const a = btn.dataset.a;
        if (a === 'close-detail') { closeDetail(); return; }
        if (a === 'accept') {
          const r = contractSystem.accept(c.id);
          if (!r.ok) {
            let msg = 'Nu se poate accepta';
            if (r.reason === 'active_exists') msg = 'Ai deja un contract activ';
            else if (r.reason === 'level_locked') msg = 'Necesita Level ' + r.requiredLevel;
            else if (r.reason === 'tool_locked') msg = 'Necesita unealta: ' + r.requiredTool;
            else if (r.reason === 'tier_locked') msg = 'Tier blocat - Company Level ' + (r.requiredLevel || '?');
            else if (r.reason === 'company_capacity_reached') msg = 'Capacitate contracte atinsa (' + r.capacity + ')';
            if (showBanner) showBanner(msg);
            if (audio) audio.error();
            if (haptics) haptics.heavy();
          } else {
            if (showBanner) showBanner('Contract acceptat! Apasa START JOB.');
            closeDetail(); render();
          }
        } else if (a === 'start') {
          const r = contractSystem.start(c.id);
          if (r.ok) { closeDetail(); close(); }
        } else if (a === 'cancel') {
          contractSystem.cancel(c.id);
          closeDetail(); render();
        } else if (a === 'return') {
          closeDetail(); close();
        } else if (a === 'abandon') {
          if (confirm('Sigur abandonezi contractul? Progresul se pierde.')) {
            contractSystem.fail(c.id, 'aborted');
            closeDetail(); render();
          }
        } else if (a === 'retry') {
          contractSystem.reset(c.id);
          closeDetail(); render();
        }
      });
    });
  }

  contractStore.on((_s, changed) => {
    if (!root.classList.contains('visible')) return;
    if (changed.includes('contracts') || changed.includes('activeContractId') ||
        changed.includes('completed') || changed.includes('failed')) {
      renderList();
    }
  });
  playerStore.on((_s, changed) => {
    if (!root.classList.contains('visible')) return;
    if (changed.includes('level') || changed.includes('owned')) renderList();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'c' || e.key === 'C') {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      toggle();
    }
  });

  return { open, close, toggle, render };
}
