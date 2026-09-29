// EventsPanel — modal cu 4 tab-uri: Active / Upcoming / Season / Istoric.
// Trigger: buton HUD 🎉 sau tastă X.

import { EVENTS, EVENT_BY_ID, SEASONS, SEASON_BY_ID, EVENT_STATUS, SEASON_STATUS, EVENT_CATEGORIES } from '../config/events.js';

const STYLE = `
#events-overlay {
  position: fixed; inset: 0; background: rgba(15,20,32,0.75);
  display: none; z-index: 45; padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  align-items: center; justify-content: center;
  font: 400 14px system-ui, sans-serif; color: #fff;
}
#events-overlay.visible { display: flex; }
#events-overlay .panel {
  background: #1c2434; border: 1px solid rgba(255,255,255,0.15); border-radius: 14px;
  min-width: 380px; width: min(720px, 96vw); max-height: 90vh; overflow: hidden;
  display: flex; flex-direction: column; box-shadow: 0 12px 44px rgba(0,0,0,0.55);
}
#events-overlay .head {
  display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.08);
}
#events-overlay .head h2 { flex: 1; margin: 0; font-size: 17px; letter-spacing: 0.3px; }
#events-overlay .close { background: none; border: none; color: #fff; font-size: 20px; cursor: pointer; padding: 4px 10px; }
#events-overlay .tabs { display: flex; gap: 4px; padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.08); overflow-x: auto; }
#events-overlay .tab { background: #2a3244; border: 1px solid rgba(255,255,255,0.14); color: #fff; padding: 7px 12px; border-radius: 8px; cursor: pointer; font: 600 12px system-ui; white-space: nowrap; }
#events-overlay .tab.active { background: #3a4358; border-color: #6faaff; }
#events-overlay .body { flex: 1; overflow-y: auto; padding: 14px 18px; }
#events-overlay .empty { padding: 30px 10px; text-align: center; color: rgba(255,255,255,0.55); }
#events-overlay .card {
  background: #232b3d; border: 1px solid rgba(255,255,255,0.10); border-radius: 10px; padding: 12px 14px; margin: 0 0 12px;
}
#events-overlay .card.active { border-color: #4caf50; }
#events-overlay .card.upcoming { border-color: #6faaff; }
#events-overlay .card.locked { opacity: 0.68; }
#events-overlay .card.completed { border-color: #ffc107; }
#events-overlay .card.expired { opacity: 0.5; border-color: #d84040; }
#events-overlay .card h3 { margin: 0 0 4px; font-size: 15px; display: flex; align-items: center; gap: 8px; }
#events-overlay .badge { padding: 2px 8px; border-radius: 6px; font: 700 10px system-ui; text-transform: uppercase; letter-spacing: 0.5px; }
#events-overlay .badge.b-active { background: #4caf50; }
#events-overlay .badge.b-upcoming { background: #6faaff; }
#events-overlay .badge.b-locked { background: #7a7a7a; }
#events-overlay .badge.b-completed { background: #ffc107; color: #1a1a1a; }
#events-overlay .badge.b-expired { background: #d84040; }
#events-overlay .badge.b-disabled { background: #444; }
#events-overlay .desc { color: rgba(255,255,255,0.7); margin: 4px 0 8px; font-size: 12px; line-height: 1.4; }
#events-overlay .countdown { color: #ffc107; font-weight: 600; font-size: 12px; margin: 4px 0; }
#events-overlay .obj-row { display: flex; align-items: center; gap: 8px; margin: 6px 0; font-size: 12px; }
#events-overlay .bar { flex: 1; height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; }
#events-overlay .bar-fill { height: 100%; background: linear-gradient(90deg, #4caf50, #7fd97f); border-radius: 4px; transition: width 0.3s; }
#events-overlay .rewards { display: flex; gap: 10px; margin: 8px 0; flex-wrap: wrap; font-size: 12px; }
#events-overlay .reward-pill { background: rgba(255,193,7,0.12); border: 1px solid rgba(255,193,7,0.3); color: #ffdd66; padding: 3px 8px; border-radius: 6px; }
#events-overlay .actions { display: flex; gap: 8px; margin-top: 8px; }
#events-overlay .btn { background: #3a5aa8; color: #fff; border: none; padding: 8px 14px; border-radius: 7px; cursor: pointer; font: 600 12px system-ui; }
#events-overlay .btn.claim { background: #ffc107; color: #1a1a1a; }
#events-overlay .btn:disabled { opacity: 0.4; cursor: not-allowed; }
#events-overlay .req-list { color: #ff9d5a; font-size: 11px; margin: 4px 0; }
#events-overlay .modifiers { color: #7fd8ff; font-size: 11px; margin: 4px 0; }
#events-overlay .season-card { background: linear-gradient(135deg, #2a3f5a, #1a2b45); border: 2px solid #6faaff; padding: 18px; }
#events-overlay .season-card h3 { font-size: 18px; }
#events-overlay .season-progress { margin: 12px 0; }
#events-overlay .season-events { display: grid; gap: 6px; margin-top: 12px; }
#events-overlay .season-event-row { display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: rgba(0,0,0,0.2); border-radius: 6px; font-size: 12px; }
#events-overlay .season-event-row .status-dot { width: 8px; height: 8px; border-radius: 50%; }
#events-overlay .dot-active { background: #4caf50; }
#events-overlay .dot-upcoming { background: #6faaff; }
#events-overlay .dot-completed { background: #ffc107; }
#events-overlay .dot-locked { background: #7a7a7a; }
#events-overlay .dot-expired { background: #d84040; }
#events-hud-btn {
  position: fixed; top: 380px; left: 12px; z-index: 6;
  width: 44px; height: 44px; border-radius: 50%; background: #3a5aa8;
  border: 2px solid rgba(255,255,255,0.25); color: #fff; cursor: pointer;
  font-size: 20px; display: none; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.45);
}
#events-hud-btn.visible { display: flex; }
#events-hud-btn .badge {
  position: absolute; top: -4px; right: -4px; background: #d84040; color: #fff;
  border-radius: 10px; padding: 1px 6px; font-size: 10px; font-weight: 700; min-width: 16px; text-align: center;
}
@media (max-width: 900px) {
  #events-overlay .panel { width: 98vw; }
  #events-hud-btn { top: 300px; width: 40px; height: 40px; font-size: 18px; }
}
`;

function formatCountdown(ms) {
  if (ms <= 0) return '0s';
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (days > 0) return `${days}z ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function statusBadgeClass(status) {
  return {
    ACTIVE: 'b-active', UPCOMING: 'b-upcoming', LOCKED: 'b-locked',
    COMPLETED: 'b-completed', EXPIRED: 'b-expired', DISABLED: 'b-disabled'
  }[status] || 'b-upcoming';
}
function statusLabel(status) {
  return {
    ACTIVE: 'Activ', UPCOMING: 'În curând', LOCKED: 'Blocat',
    COMPLETED: 'Finalizat', EXPIRED: 'Expirat', DISABLED: 'Dezactivat'
  }[status] || status;
}
function statusDotClass(status) {
  return {
    ACTIVE: 'dot-active', UPCOMING: 'dot-upcoming', LOCKED: 'dot-locked',
    COMPLETED: 'dot-completed', EXPIRED: 'dot-expired', DISABLED: 'dot-locked'
  }[status] || 'dot-upcoming';
}

export function createEventsPanel({ eventStore, eventSystem, gameState, showBanner }) {
  let root = null;
  let hudBtn = null;
  let currentTab = 'active';
  let countdownTimer = null;
  let unsubStore = null;

  function injectStyle() {
    if (document.getElementById('events-style')) return;
    const s = document.createElement('style');
    s.id = 'events-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function ensureHudButton() {
    if (hudBtn) return;
    injectStyle();
    hudBtn = document.createElement('button');
    hudBtn.id = 'events-hud-btn';
    hudBtn.title = 'Evenimente (X)';
    hudBtn.innerHTML = '🎉<span class="badge" style="display:none">0</span>';
    hudBtn.addEventListener('click', () => open('active'));
    document.body.appendChild(hudBtn);
    _refreshHudBadge();
    // Subscribe la store pentru update badge
    if (eventStore && typeof eventStore.on === 'function') {
      unsubStore = eventStore.on(() => _refreshHudBadge());
    }
  }

  function _refreshHudBadge() {
    if (!hudBtn) return;
    const activeCount = eventStore.countActive();
    const claimable = eventStore.countClaimable();
    const total = activeCount + claimable;
    const badge = hudBtn.querySelector('.badge');
    if (total > 0) {
      hudBtn.classList.add('visible');
      badge.textContent = String(total);
      badge.style.display = 'inline-block';
      badge.style.background = claimable > 0 ? '#ffc107' : '#d84040';
      badge.style.color = claimable > 0 ? '#1a1a1a' : '#fff';
    } else {
      // Ascunde HUD dacă nu-i nimic — dar arată totuși dacă vreun event UPCOMING important e aproape
      hudBtn.classList.remove('visible');
    }
  }

  function build() {
    if (root) return root;
    injectStyle();
    root = document.createElement('div');
    root.id = 'events-overlay';
    root.innerHTML = `
      <div class="panel">
        <div class="head">
          <h2>🎉 Evenimente</h2>
          <button class="close" data-a="close">✕</button>
        </div>
        <div class="tabs">
          <button class="tab" data-tab="active">Active</button>
          <button class="tab" data-tab="upcoming">În curând</button>
          <button class="tab" data-tab="season">Sezon</button>
          <button class="tab" data-tab="history">Istoric</button>
        </div>
        <div class="body" id="events-body"></div>
      </div>
    `;
    document.body.appendChild(root);

    root.addEventListener('click', (e) => {
      if (e.target === root) close();
    });
    root.querySelector('[data-a="close"]').addEventListener('click', close);
    root.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => switchTab(t.dataset.tab));
    });
    return root;
  }

  function switchTab(tab) {
    currentTab = tab;
    if (!root) return;
    root.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    render();
  }

  function _renderEventCard(id, ev) {
    const def = EVENT_BY_ID[id];
    if (!def) return '';
    const status = ev.status;
    const cardClass = 'card ' + status.toLowerCase();
    const badgeCls = statusBadgeClass(status);
    let countdownHtml = '';
    if (status === EVENT_STATUS.ACTIVE && ev.expiresAt) {
      const ms = ev.expiresAt - Date.now();
      countdownHtml = `<div class="countdown" data-countdown-until="${ev.expiresAt}">⏰ ${formatCountdown(ms)} rămase</div>`;
    } else if (status === EVENT_STATUS.UPCOMING && ev.expiresAt) {
      const ms = ev.expiresAt - Date.now();
      countdownHtml = `<div class="countdown" data-countdown-until="${ev.expiresAt}">⏳ Începe în ${formatCountdown(ms)}</div>`;
    }
    const objRows = def.objectives.map(obj => {
      const cur = ev.progress[obj.id] || 0;
      const done = ev.objectivesCompleted[obj.id];
      const pct = Math.min(100, Math.round((cur / obj.target) * 100));
      return `
        <div class="obj-row">
          <span>${done ? '✓' : '○'}</span>
          <span style="flex:2">${obj.description}</span>
          <div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div>
          <span style="min-width:80px;text-align:right;font-family:monospace">${cur}/${obj.target}</span>
        </div>`;
    }).join('');
    const rewardPills = [];
    const mult = def.modifiers?.rewardMultiplier || 1;
    if (def.rewards?.coins) rewardPills.push(`💰 ${Math.round(def.rewards.coins * mult)}`);
    if (def.rewards?.xp) rewardPills.push(`⭐ ${Math.round(def.rewards.xp * mult)} XP`);
    if (def.rewards?.reputation) rewardPills.push(`🏆 ${Math.round(def.rewards.reputation * mult)} Rep`);
    let reqHtml = '';
    if (status === EVENT_STATUS.LOCKED) {
      const missing = eventSystem?.requirementReasons?.(def) || [];
      if (missing.length) reqHtml = `<div class="req-list">🔒 ${missing.join(' · ')}</div>`;
    }
    let modHtml = '';
    if (def.modifiers) {
      const mods = [];
      if (def.modifiers.rewardMultiplier) mods.push(`🎁 Reward ×${def.modifiers.rewardMultiplier}`);
      if (def.modifiers.snowfallRate) mods.push(`❄️ Ninsoare ×${def.modifiers.snowfallRate}`);
      if (def.modifiers.weatherType) mods.push(`🌪️ Vreme: ${def.modifiers.weatherType}`);
      if (mods.length) modHtml = `<div class="modifiers">${mods.join(' · ')}</div>`;
    }
    let actionsHtml = '';
    const canClaim = (status === EVENT_STATUS.COMPLETED && !ev.claimedAt);
    if (canClaim) {
      actionsHtml = `<div class="actions"><button class="btn claim" data-claim="${id}">🎁 REVENDICĂ</button></div>`;
    } else if (ev.claimedAt) {
      actionsHtml = `<div class="actions"><button class="btn" disabled>✓ Revendicat</button></div>`;
    }
    return `
      <div class="${cardClass}">
        <h3>${def.name} <span class="badge ${badgeCls}">${statusLabel(status)}</span></h3>
        <div class="desc">${def.description}</div>
        ${countdownHtml}
        ${modHtml}
        ${reqHtml}
        <div>${objRows}</div>
        <div class="rewards">${rewardPills.map(p => `<span class="reward-pill">${p}</span>`).join('')}</div>
        ${actionsHtml}
      </div>
    `;
  }

  function _renderActiveTab() {
    const items = eventStore.getActive();
    // Include also COMPLETED unclaimed for easy claim
    const completed = eventStore.getCompleted().filter(([, ev]) => !ev.claimedAt);
    const all = [...completed, ...items];
    if (all.length === 0) return '<div class="empty">Niciun eveniment activ momentan. Verifică „În curând".</div>';
    return all.map(([id, ev]) => _renderEventCard(id, ev)).join('');
  }

  function _renderUpcomingTab() {
    const items = eventStore.getUpcoming();
    const locked = eventStore.getLocked();
    const all = [...items, ...locked].sort((a, b) => {
      const eaA = a[1].expiresAt || Infinity;
      const eaB = b[1].expiresAt || Infinity;
      return eaA - eaB;
    });
    if (all.length === 0) return '<div class="empty">Nu există evenimente viitoare programate.</div>';
    return all.map(([id, ev]) => _renderEventCard(id, ev)).join('');
  }

  function _renderSeasonTab() {
    const activeSeasons = SEASONS.filter(s => {
      const st = eventStore.getSeasonState(s.id);
      return st && st.status === SEASON_STATUS.ACTIVE;
    });
    if (activeSeasons.length === 0) {
      // Show upcoming ended too
      const other = SEASONS.filter(s => {
        const st = eventStore.getSeasonState(s.id);
        return st && (st.status === SEASON_STATUS.UPCOMING || st.status === SEASON_STATUS.ENDED);
      });
      if (other.length === 0) return '<div class="empty">Niciun sezon configurat.</div>';
      return other.map(s => _renderSeasonCard(s)).join('');
    }
    return activeSeasons.map(s => _renderSeasonCard(s)).join('');
  }

  function _renderSeasonCard(seasonDef) {
    const st = eventStore.getSeasonState(seasonDef.id);
    const progress = eventSystem.getSeasonProgress(seasonDef.id);
    const pct = progress.totalEvents > 0 ? Math.round((progress.completedEvents / progress.totalEvents) * 100) : 0;
    const countdown = st.endsAt ? formatCountdown(st.endsAt - Date.now()) : '—';
    const eventsHtml = seasonDef.eventIds.map(eid => {
      const ev = eventStore.getEvent(eid);
      const def = EVENT_BY_ID[eid];
      if (!ev || !def) return '';
      return `<div class="season-event-row">
        <span class="status-dot ${statusDotClass(ev.status)}"></span>
        <span style="flex:1">${def.name}</span>
        <span style="opacity:0.7">${statusLabel(ev.status)}</span>
      </div>`;
    }).join('');
    const rewards = seasonDef.rewards || {};
    const rewardPills = [];
    if (rewards.coins) rewardPills.push(`💰 ${rewards.coins}`);
    if (rewards.xp) rewardPills.push(`⭐ ${rewards.xp} XP`);
    if (rewards.reputation) rewardPills.push(`🏆 ${rewards.reputation} Rep`);
    return `
      <div class="card season-card">
        <h3>❄️ ${seasonDef.name} <span class="badge ${statusBadgeClass(st.status)}">${statusLabel(st.status)}</span></h3>
        <div class="desc">${seasonDef.description}</div>
        <div class="countdown" data-countdown-until="${st.endsAt || 0}">⏰ ${countdown} rămase</div>
        <div class="season-progress">
          <div class="obj-row">
            <span>Progres:</span>
            <div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div>
            <span style="min-width:80px;text-align:right;font-family:monospace">${progress.completedEvents}/${progress.totalEvents}</span>
          </div>
        </div>
        <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:8px">La ≥50% finalizate: recompensă auto:</div>
        <div class="rewards">${rewardPills.map(p => `<span class="reward-pill">${p}</span>`).join('')}</div>
        <div class="season-events">${eventsHtml}</div>
      </div>
    `;
  }

  function _renderHistoryTab() {
    const hist = eventStore.state.history || [];
    const expired = eventStore.getExpired();
    const completed = eventStore.getCompleted().filter(([, ev]) => ev.claimedAt);
    const all = [...completed, ...expired];
    if (all.length === 0) return '<div class="empty">Niciun eveniment finalizat sau expirat încă.</div>';
    return all.map(([id, ev]) => {
      const def = EVENT_BY_ID[id];
      if (!def) return '';
      const badgeCls = statusBadgeClass(ev.status);
      const date = ev.claimedAt || ev.completedAt || ev.expiresAt;
      const dateStr = date ? new Date(date).toLocaleDateString('ro') + ' ' + new Date(date).toLocaleTimeString('ro', { hour: '2-digit', minute: '2-digit' }) : '—';
      return `
        <div class="card ${ev.status.toLowerCase()}">
          <h3>${def.name} <span class="badge ${badgeCls}">${statusLabel(ev.status)}</span></h3>
          <div class="desc">${def.description}</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.55);margin-top:6px">${ev.claimedAt ? 'Revendicat: ' : ev.status === 'EXPIRED' ? 'Expirat: ' : 'Finalizat: '}${dateStr}</div>
        </div>`;
    }).join('');
  }

  function render() {
    if (!root) return;
    const body = root.querySelector('#events-body');
    if (currentTab === 'active') body.innerHTML = _renderActiveTab();
    else if (currentTab === 'upcoming') body.innerHTML = _renderUpcomingTab();
    else if (currentTab === 'season') body.innerHTML = _renderSeasonTab();
    else if (currentTab === 'history') body.innerHTML = _renderHistoryTab();
    // Wire claim buttons
    body.querySelectorAll('[data-claim]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-claim');
        const r = eventSystem.claimReward(id);
        if (!r.ok) {
          if (typeof showBanner === 'function') showBanner('Nu se poate revendica: ' + (r.reason || 'eroare'));
        }
        render();
      });
    });
  }

  function _startCountdown() {
    if (countdownTimer) return;
    countdownTimer = setInterval(() => {
      if (!root || !root.classList.contains('visible')) return;
      root.querySelectorAll('[data-countdown-until]').forEach(el => {
        const t = Number(el.getAttribute('data-countdown-until')) || 0;
        const ms = t - Date.now();
        // Update just the text after emoji
        const currentText = el.textContent;
        const emoji = currentText.match(/^\S+/)?.[0] || '⏰';
        const rest = currentText.includes('Începe în') ? 'Începe în ' : '';
        const suffix = currentText.includes('rămase') ? ' rămase' : '';
        el.textContent = `${emoji} ${rest}${formatCountdown(ms)}${suffix}`;
      });
    }, 1000);
  }
  function _stopCountdown() {
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
  }

  function open(tab) {
    build();
    ensureHudButton();
    if (tab) switchTab(tab); else switchTab(currentTab);
    root.classList.add('visible');
    if (gameState?.setScreen) {
      try { gameState.setScreen('event_open'); } catch {}
    }
    _startCountdown();
    render();
  }

  function close() {
    if (!root) return;
    root.classList.remove('visible');
    _stopCountdown();
    if (gameState?.setScreen) {
      try { gameState.setScreen('playing'); } catch {}
    }
  }

  function toggle() {
    if (root && root.classList.contains('visible')) close(); else open();
  }

  return {
    open, close, toggle, render,
    ensureHudButton,
    isVisible: () => !!(root && root.classList.contains('visible'))
  };
}
