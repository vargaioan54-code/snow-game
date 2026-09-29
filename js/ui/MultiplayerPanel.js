// Etapa 14 — MultiplayerPanel UI
// 3-stage flow: Menu → Lobby → Active
// Dev warning permanent: bots doar în lobby, real sync BLOCKED

import { MAX_PLAYERS, MIN_PLAYERS_TO_START, validateSessionCode } from '../config/multiplayer.js';

const STYLE = `
#mp-overlay {
  position: fixed; inset: 0; background: rgba(10,14,22,0.90);
  display: none; align-items: center; justify-content: center;
  z-index: 90; font: 400 14px system-ui, sans-serif; color: #fff;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}
#mp-overlay.visible { display: flex; }
#mp-overlay .panel {
  background: linear-gradient(180deg, #1c2434 0%, #131a26 100%);
  border: 1px solid rgba(255,255,255,0.15); border-radius: 16px;
  padding: 20px 22px; min-width: 320px; max-width: min(92vw, 720px);
  max-height: 90vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
}
#mp-overlay .hdr { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
#mp-overlay .hdr h2 { margin: 0; font-size: 18px; font-weight: 700; letter-spacing: 0.3px; }
#mp-overlay .close { background: transparent; border: 0; color: #8a94aa; font-size: 22px; cursor: pointer; padding: 4px 8px; }
#mp-overlay .close:hover { color: #fff; }
#mp-overlay .warn {
  background: rgba(255,193,7,0.12); border: 1px solid rgba(255,193,7,0.3);
  color: #ffd54f; padding: 8px 12px; border-radius: 8px; font-size: 12px; margin-bottom: 14px;
}
#mp-overlay .card {
  background: #2a3244; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
  padding: 14px; margin-bottom: 10px; cursor: pointer; transition: filter 0.15s, transform 0.1s;
}
#mp-overlay .card:hover:not(.disabled) { filter: brightness(1.15); }
#mp-overlay .card.disabled { opacity: 0.5; cursor: not-allowed; }
#mp-overlay .card .title { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
#mp-overlay .card .desc { font-size: 12px; color: #a4adc0; }
#mp-overlay .row { display: flex; gap: 10px; align-items: center; margin-bottom: 8px; }
#mp-overlay .row label { flex: 1; font-size: 13px; }
#mp-overlay input.code {
  padding: 10px 12px; font: 700 16px monospace; letter-spacing: 3px;
  background: #0f1520; color: #fff; border: 2px solid #2a3244; border-radius: 8px;
  outline: none; width: 100%; box-sizing: border-box; text-transform: uppercase; text-align: center;
}
#mp-overlay input.code:focus { border-color: #3fd8ff; }
#mp-overlay .btn {
  padding: 10px 14px; border-radius: 8px; cursor: pointer; border: 1px solid rgba(255,255,255,0.2);
  background: #2a3244; color: #fff; font: 600 13px system-ui; transition: filter 0.15s;
}
#mp-overlay .btn:hover:not(:disabled) { filter: brightness(1.2); }
#mp-overlay .btn:disabled { opacity: 0.5; cursor: not-allowed; }
#mp-overlay .btn.primary { background: #3fd8ff; color: #0a0e18; border-color: #3fd8ff; }
#mp-overlay .btn.success { background: #3ea862; color: #fff; border-color: #3ea862; }
#mp-overlay .btn.danger { background: #7a2020; border-color: #a03030; }
#mp-overlay .actions { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
#mp-overlay .slot-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 12px 0; }
@media (max-width: 500px) { #mp-overlay .slot-grid { grid-template-columns: 1fr; } }
#mp-overlay .slot {
  background: #2a3244; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
  padding: 12px; min-height: 82px; display: flex; flex-direction: column; justify-content: center;
}
#mp-overlay .slot.empty { border-style: dashed; border-color: rgba(255,255,255,0.15); align-items: center; color: #6a7488; }
#mp-overlay .slot.host { border-color: #ffc043; }
#mp-overlay .slot.self { border-color: #3fd8ff; }
#mp-overlay .slot .pname { font-weight: 700; font-size: 14px; }
#mp-overlay .slot .pmeta { font-size: 11px; color: #a4adc0; margin-top: 2px; }
#mp-overlay .slot .pstatus {
  display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700;
  text-transform: uppercase; margin-top: 6px; align-self: flex-start;
}
#mp-overlay .pstatus.ready { background: #3ea862; }
#mp-overlay .pstatus.waiting { background: #d69a2d; }
#mp-overlay .pstatus.disconnected { background: #7a2020; }
#mp-overlay .info-line { font-size: 12px; color: #8a94aa; margin: 8px 0; }
#mp-overlay .code-display {
  font: 700 24px monospace; letter-spacing: 6px; background: #0f1520;
  padding: 12px; border-radius: 8px; text-align: center; margin: 10px 0;
}
#mp-trigger-btn {
  position: fixed; top: calc(env(safe-area-inset-top) + 12px);
  left: calc(env(safe-area-inset-left) + 340px); z-index: 15;
  background: rgba(28,36,52,0.9); color: #fff; border: 1px solid rgba(255,255,255,0.15);
  border-radius: 10px; padding: 8px 12px; cursor: pointer; font: 600 13px system-ui;
  min-height: 40px;
}
#mp-trigger-btn:hover { filter: brightness(1.2); }
#mp-trigger-btn .badge {
  background: #3fd8ff; color: #0a0e18; border-radius: 10px; padding: 1px 6px;
  font-size: 11px; margin-left: 4px;
}
@media (max-width: 900px) {
  #mp-trigger-btn { left: auto; right: calc(env(safe-area-inset-right) + 12px); top: calc(env(safe-area-inset-top) + 240px); }
}
`;

export function createMultiplayerPanel({ multiplayerStore, multiplayerService, gameState, showBanner }) {
  let root = null;

  function injectStyle() {
    if (document.getElementById('mp-style')) return;
    const s = document.createElement('style');
    s.id = 'mp-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function build() {
    if (root) return root;
    injectStyle();
    root = document.createElement('div');
    root.id = 'mp-overlay';
    root.innerHTML = `<div class="panel"></div>`;
    document.body.appendChild(root);
    root.addEventListener('click', (e) => { if (e.target === root) close(); });
    return root;
  }

  function render() {
    if (!root) return;
    const panel = root.querySelector('.panel');
    const inSession = multiplayerStore.isInSession();
    const session = multiplayerStore.state.currentSession;
    const isHost = multiplayerStore.isHost();
    const canStart = multiplayerStore.canStart();

    let html = '';
    if (!inSession) html = renderMenu();
    else if (session.status === 'active') html = renderActive(session);
    else html = renderLobby(session, isHost, canStart);

    panel.innerHTML = html;
    wireEvents(panel);
  }

  function renderMenu() {
    const history = multiplayerStore.state.sessionHistory || [];
    const total = multiplayerStore.state.totalSessionsPlayed || 0;
    return `
      <div class="hdr">
        <h2>👨‍👩‍👧‍👦 Multiplayer / Co-op</h2>
        <button class="close" data-a="close">×</button>
      </div>
      <div class="warn">🧪 Modul dezvoltare — bots simulați local. Real multiplayer (2-4 dispozitive reale) = BLOCKED, necesită backend (WebSocket / Photon / Colyseus / Firebase).</div>
      <div class="card" data-a="create">
        <div class="title">👑 Creează Sesiune</div>
        <div class="desc">Devine host și adaugă bots (dev) sau invită prieteni (mock).</div>
      </div>
      <div class="card" data-a="join-toggle">
        <div class="title">🔑 Alătură-te cu Cod</div>
        <div class="desc">Introdu codul unei sesiuni active (mock: doar sesiuni create local).</div>
      </div>
      <div id="join-form" style="display:none; margin: 10px 0;">
        <input class="code" type="text" placeholder="XXXXXX" maxlength="6" id="join-code-input">
        <div style="height:8px"></div>
        <div class="actions">
          <button class="btn primary" data-a="join">Alătură-te</button>
          <button class="btn" data-a="join-cancel">Anulează</button>
        </div>
      </div>
      <div class="info-line">Sesiuni totale jucate: ${total} · Istoric: ${history.length}</div>
      <div class="info-line" style="opacity:0.7">Tip: apasă <b>N</b> pentru a deschide/închide acest panel.</div>
    `;
  }

  function renderLobby(session, isHost, canStart) {
    const slots = [];
    for (let i = 0; i < session.maxPlayers; i++) {
      const p = session.players[i];
      slots.push(renderSlot(p, i, isHost));
    }
    const ownStatus = multiplayerStore.state.ownStatus;
    const isReady = ownStatus === 'ready';

    return `
      <div class="hdr">
        <h2>🎮 Lobby ${isHost ? '(Host)' : ''}</h2>
        <button class="close" data-a="close">×</button>
      </div>
      <div class="warn">🧪 Modul dezvoltare — real gameplay sync = BLOCKED. Bots simulați doar în lobby, NU în-game.</div>
      <div class="info-line">Sesiune · Host: <b>${escapeHtml(session.hostName)}</b></div>
      <div class="code-display">${session.code}</div>
      <div class="info-line">👥 ${session.players.length}/${session.maxPlayers} jucători · ${multiplayerStore.getReadyCount()} ready</div>
      <div class="slot-grid">${slots.join('')}</div>
      <div class="actions">
        <button class="btn ${isReady ? 'danger' : 'success'}" data-a="toggle-ready">
          ${isReady ? '✗ Not Ready' : '✓ Ready'}
        </button>
        ${isHost ? `<button class="btn primary" data-a="start" ${canStart ? '' : 'disabled'}>▶ ÎNCEPE SESIUNE</button>` : ''}
        ${isHost && !multiplayerStore.isFull() ? `<button class="btn" data-a="add-bot">🤖 Add Bot</button>` : ''}
        <button class="btn danger" data-a="leave">🚪 Părăsește</button>
      </div>
    `;
  }

  function renderSlot(p, idx, isHost) {
    if (!p) {
      return `<div class="slot empty">➕ Slot ${idx + 1} liber</div>`;
    }
    const classes = ['slot'];
    if (p.role === 'host') classes.push('host');
    if (p.isSelf) classes.push('self');
    const badge = p.role === 'host' ? '👑 ' : (p.isBot ? '🤖 ' : '');
    const statusCls = p.status || 'waiting';
    const statusText = { ready: '✓ Ready', waiting: '⏳ Waiting', disconnected: '🔴 Off' }[statusCls] || statusCls;
    return `
      <div class="${classes.join(' ')}">
        <div class="pname">${badge}${escapeHtml(p.name)}${p.isSelf ? ' (Tu)' : ''}</div>
        <div class="pmeta">Level ${p.level || 1}${p.company ? ' · ' + escapeHtml(p.company) : ''}</div>
        <span class="pstatus ${statusCls}">${statusText}</span>
      </div>
    `;
  }

  function renderActive(session) {
    return `
      <div class="hdr">
        <h2>🎮 Sesiune Activă</h2>
        <button class="close" data-a="close">×</button>
      </div>
      <div class="warn">🧪 Real gameplay sync = BLOCKED. Bots există doar în lobby (nu în-game).</div>
      <div class="code-display">${session.code}</div>
      <div class="info-line">👥 ${session.players.length} jucători · Host: ${escapeHtml(session.hostName)}</div>
      <div class="info-line">⏱️ Pornită acum ${formatDuration(Date.now() - (session.startedAt || Date.now()))}</div>
      <div class="actions">
        <button class="btn danger" data-a="leave">🚪 Părăsește sesiunea</button>
      </div>
    `;
  }

  function wireEvents(panel) {
    panel.querySelectorAll('[data-a]').forEach(el => {
      el.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = el.dataset.a;
        try {
          if (action === 'close') close();
          else if (action === 'create') await multiplayerService.createSession();
          else if (action === 'join-toggle') {
            const f = panel.querySelector('#join-form');
            if (f) f.style.display = f.style.display === 'none' ? 'block' : 'none';
          }
          else if (action === 'join-cancel') {
            const f = panel.querySelector('#join-form');
            if (f) f.style.display = 'none';
          }
          else if (action === 'join') {
            const input = panel.querySelector('#join-code-input');
            const code = input ? input.value.trim().toUpperCase() : '';
            if (!validateSessionCode(code)) {
              if (showBanner) showBanner('❌ Cod invalid (6 caractere)');
              return;
            }
            await multiplayerService.joinSession(code);
          }
          else if (action === 'toggle-ready') {
            const isReady = multiplayerStore.state.ownStatus === 'ready';
            await multiplayerService.setReady(!isReady);
          }
          else if (action === 'start') await multiplayerService.startSession();
          else if (action === 'add-bot') await multiplayerService.addBot();
          else if (action === 'leave') {
            if (confirm('Sigur vrei să părăsești sesiunea?')) await multiplayerService.leaveSession();
          }
        } catch (err) {
          console.error('[MPPanel action]', action, err);
        }
      });
    });
  }

  function open() {
    build();
    root.classList.add('visible');
    render();
  }

  function close() {
    if (root) root.classList.remove('visible');
  }

  function toggle() {
    if (!root || !root.classList.contains('visible')) open();
    else close();
  }

  function isVisible() { return !!(root && root.classList.contains('visible')); }

  // Reactive: re-render when store changes
  multiplayerStore.on(() => { if (isVisible()) render(); });

  // HUD trigger button
  function ensureHudButton() {
    if (document.getElementById('mp-trigger-btn')) return;
    injectStyle();
    const btn = document.createElement('button');
    btn.id = 'mp-trigger-btn';
    btn.innerHTML = '👨‍👩‍👧‍👦 <span id="mp-btn-label">MP</span>';
    btn.addEventListener('click', () => toggle());
    document.body.appendChild(btn);
    // Update label reactive
    function updateLabel() {
      const label = document.getElementById('mp-btn-label');
      if (!label) return;
      const s = multiplayerStore.state.currentSession;
      if (s) label.textContent = `${s.players.length}/${s.maxPlayers}`;
      else label.textContent = 'MP';
    }
    multiplayerStore.on(updateLabel);
    updateLabel();
  }

  return { open, close, toggle, render, isVisible, ensureHudButton };
}

// Helpers
function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm ' + (s % 60) + 's';
  const h = Math.floor(m / 60);
  return h + 'h ' + (m % 60) + 'm';
}
