// MissionsPanel — overlay modal cu 4 tabs (Daily/Weekly/Missions/Achievements).
// Trigger: buton HUD 🎯 sau tastă J.

import { DAILY_BY_ID, WEEKLY_BY_ID, PERMANENT_BY_ID } from '../config/missions.js';
import { ACHIEVEMENTS, ACHIEVEMENT_BY_ID, ACHIEVEMENT_CATEGORIES, ACHIEVEMENTS_BY_CATEGORY } from '../config/achievements.js';

const STYLE = `
#missions-overlay { position:fixed; inset:0; background:rgba(15,20,32,0.85); display:none; z-index:45; font:400 14px system-ui,sans-serif; color:#fff; }
#missions-overlay.visible { display:flex; }
#missions-overlay .panel {
  margin:auto; background:#1c2434; border:1px solid rgba(255,255,255,0.15);
  border-radius:14px; padding:20px 22px; width:min(720px, 94vw); max-height:90vh;
  display:flex; flex-direction:column;
  box-shadow:0 10px 40px rgba(0,0,0,0.5);
}
#missions-overlay header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
#missions-overlay h2 { margin:0; font-size:18px; letter-spacing:0.3px; }
#missions-overlay .close-btn { background:transparent; border:none; color:#fff; font-size:26px; cursor:pointer; padding:0 6px; }
#missions-overlay .tabs { display:flex; gap:6px; border-bottom:1px solid rgba(255,255,255,0.1); margin-bottom:12px; flex-wrap:wrap; }
#missions-overlay .tabs button {
  background:transparent; color:#a0a8b8; border:none; padding:8px 14px;
  cursor:pointer; border-radius:6px 6px 0 0; font:600 13px system-ui;
}
#missions-overlay .tabs button.active { color:#fff; background:rgba(255,255,255,0.08); border-bottom:2px solid #4fc3f7; }
#missions-overlay .content { overflow-y:auto; flex:1; padding-right:4px; min-height:200px; }
#missions-overlay .timer { font-size:12px; color:#a0a8b8; margin-bottom:10px; }
#missions-overlay .mission-card {
  background:#2a3244; border:1px solid rgba(255,255,255,0.08); border-radius:10px;
  padding:12px 14px; margin-bottom:10px; display:flex; flex-direction:column; gap:6px;
}
#missions-overlay .mission-card.completed { border-color:#4a9d4a; background:#243428; }
#missions-overlay .mission-card.claimed { opacity:0.6; }
#missions-overlay .mission-row1 { display:flex; justify-content:space-between; align-items:baseline; }
#missions-overlay .mission-title { font-weight:600; font-size:14px; }
#missions-overlay .mission-reward { color:#ffc043; font-size:12px; }
#missions-overlay .mission-desc { font-size:12px; color:#b8c0d0; }
#missions-overlay .progress-bar { height:8px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden; margin-top:4px; }
#missions-overlay .progress-fill { height:100%; background:linear-gradient(90deg,#4fc3f7,#89d4f5); transition:width 0.3s; }
#missions-overlay .mission-card.completed .progress-fill { background:linear-gradient(90deg,#4ade80,#86efac); }
#missions-overlay .progress-text { font-size:11px; color:#a0a8b8; }
#missions-overlay .mission-actions { display:flex; justify-content:flex-end; gap:8px; }
#missions-overlay .claim-btn {
  background:#4ade80; color:#0a1a0a; border:none; border-radius:6px;
  padding:6px 14px; cursor:pointer; font:600 12px system-ui;
}
#missions-overlay .claim-btn:hover { filter:brightness(1.15); }
#missions-overlay .status-text { font-size:11px; color:#a0a8b8; }
#missions-overlay .status-text.claimed { color:#4ade80; }

#missions-overlay .ach-cats { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px; }
#missions-overlay .ach-cats button {
  background:rgba(255,255,255,0.05); color:#a0a8b8; border:1px solid rgba(255,255,255,0.1);
  border-radius:14px; padding:4px 12px; cursor:pointer; font:600 12px system-ui;
}
#missions-overlay .ach-cats button.active { color:#fff; background:rgba(79,195,247,0.15); border-color:#4fc3f7; }
#missions-overlay .ach-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:10px; }
#missions-overlay .ach-card {
  background:#242c3d; border:1px solid rgba(255,255,255,0.08); border-radius:8px;
  padding:10px 12px; font-size:12px;
}
#missions-overlay .ach-card.unlocked { border-color:#ffc043; background:#2f2a1e; }
#missions-overlay .ach-card.locked { opacity:0.6; }
#missions-overlay .ach-title { font-weight:600; font-size:13px; margin-bottom:2px; }
#missions-overlay .ach-desc { font-size:11px; color:#a0a8b8; margin-bottom:6px; min-height:28px; }
#missions-overlay .ach-reward { font-size:11px; color:#ffc043; }
#missions-overlay .empty-list { color:#a0a8b8; text-align:center; padding:20px; }

@media (max-width: 900px), (max-height: 600px) {
  #missions-overlay .panel { width:98vw; padding:12px; }
  #missions-overlay .ach-grid { grid-template-columns:1fr; }
}
`;

export function createMissionsPanel({ missionStore, missionSystem, gameState, showBanner }) {
  let root = null;
  let currentTab = 'daily';
  let currentAchCat = 'snow';
  let timerInterval = null;
  let hudBadge = null;

  function injectStyle() {
    if (document.getElementById('missions-style')) return;
    const s = document.createElement('style');
    s.id = 'missions-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function ensureHudBadge() {
    if (hudBadge) return;
    const btn = document.createElement('button');
    btn.id = 'missions-hud-badge';
    btn.style.cssText = 'position:fixed;top:calc(60px + env(safe-area-inset-top,0));left:calc(200px + env(safe-area-inset-left,0));z-index:5;background:rgba(15,20,32,0.85);color:#fff;border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:6px 10px;cursor:pointer;font:600 12px system-ui;display:none;';
    btn.title = 'Misiuni (J)';
    btn.textContent = '🎯 0';
    btn.addEventListener('click', () => open('daily'));
    document.body.appendChild(btn);
    hudBadge = btn;
  }

  function updateHudBadge() {
    if (!hudBadge) return;
    const n = missionStore.countCompletedUnclaimed();
    if (n <= 0) {
      hudBadge.style.display = 'none';
    } else {
      hudBadge.style.display = 'inline-block';
      hudBadge.textContent = '🎯 ' + n;
    }
  }

  function build() {
    if (root) return root;
    injectStyle();
    root = document.createElement('div');
    root.id = 'missions-overlay';
    root.innerHTML = `
      <div class="panel">
        <header>
          <h2>🎯 Misiuni</h2>
          <button class="close-btn" data-a="close" aria-label="Închide">×</button>
        </header>
        <div class="tabs">
          <button data-tab="daily">📅 Zilnice</button>
          <button data-tab="weekly">🗓️ Săptămânale</button>
          <button data-tab="permanent">🎖️ Misiuni</button>
          <button data-tab="achievements">🏆 Achievements</button>
        </div>
        <div class="content"></div>
      </div>
    `;
    document.body.appendChild(root);

    // Close
    root.addEventListener('click', (e) => {
      if (e.target === root) close();
    });
    root.querySelector('[data-a="close"]').addEventListener('click', close);
    root.querySelectorAll('[data-tab]').forEach(b => {
      b.addEventListener('click', () => { currentTab = b.dataset.tab; render(); });
    });
    return root;
  }

  function fmtDuration(ms) {
    if (ms <= 0) return 'expirată';
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 24) return Math.floor(h / 24) + 'z ' + (h % 24) + 'h';
    if (h > 0) return h + ':' + String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
    return m + ':' + String(sec).padStart(2,'0');
  }

  function rewardText(reward) {
    const parts = [];
    if (reward.coins) parts.push('💰 ' + reward.coins);
    if (reward.xp) parts.push('⭐ ' + reward.xp);
    if (reward.reputation) parts.push('🏆 ' + reward.reputation);
    return parts.join(' · ');
  }

  function renderMissionCard(mission, def, category, resetAt) {
    const pct = Math.min(100, Math.round(mission.currentValue / def.objective.target * 100));
    const isDone = mission.status === 'COMPLETED';
    const isClaimed = mission.status === 'CLAIMED';
    const cardClass = 'mission-card' + (isDone ? ' completed' : '') + (isClaimed ? ' claimed' : '');
    const actionHtml = isDone
      ? `<button class="claim-btn" data-claim="${category}:${mission.defId || mission.id}">REVENDICĂ</button>`
      : isClaimed
        ? `<span class="status-text claimed">✓ Revendicat</span>`
        : `<span class="status-text">${mission.currentValue.toLocaleString()} / ${def.objective.target.toLocaleString()}</span>`;
    return `
      <div class="${cardClass}">
        <div class="mission-row1">
          <span class="mission-title">${def.name || def.id}</span>
          <span class="mission-reward">${rewardText(def.reward)}</span>
        </div>
        <div class="mission-desc">${def.description || ''}</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="mission-actions">${actionHtml}</div>
      </div>
    `;
  }

  function renderMissionList(category, byId, resetAtKey) {
    const content = root.querySelector('.content');
    const entries = Object.entries(missionStore.state[category]);
    let timerHtml = '';
    if (resetAtKey) {
      const resetAt = missionStore.state[resetAtKey];
      if (resetAt) {
        timerHtml = `<div class="timer">Reset în: <span data-timer="${resetAtKey}">${fmtDuration(resetAt - Date.now())}</span></div>`;
      }
    }
    if (entries.length === 0) {
      content.innerHTML = timerHtml + '<div class="empty-list">Nicio misiune activă.</div>';
      return;
    }
    let html = timerHtml;
    for (const [id, mission] of entries) {
      const def = byId[mission.defId || id];
      if (!def) continue;
      html += renderMissionCard(mission, def, category);
    }
    content.innerHTML = html;
    // Wire claim buttons
    content.querySelectorAll('[data-claim]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [cat, id] = btn.dataset.claim.split(':');
        const r = missionSystem.claim(cat, id);
        if (!r.ok) {
          if (typeof showBanner === 'function') showBanner('Nu se poate revendica: ' + r.reason);
        }
        render();
        updateHudBadge();
      });
    });
  }

  function renderAchievements() {
    const content = root.querySelector('.content');
    const catButtons = ACHIEVEMENT_CATEGORIES.map(cat => {
      const cls = cat === currentAchCat ? 'active' : '';
      return `<button class="${cls}" data-achcat="${cat}">${cat.toUpperCase()}</button>`;
    }).join('');

    const list = ACHIEVEMENTS_BY_CATEGORY[currentAchCat] || [];
    const cards = list.map(def => {
      const ach = missionStore.state.achievements[def.id];
      if (!ach) return '';
      const isUnlocked = ach.unlocked;
      const isHidden = def.hidden && !isUnlocked;
      const cls = 'ach-card' + (isUnlocked ? ' unlocked' : ' locked');
      const name = isHidden ? '???' : def.name;
      const desc = isHidden ? 'Achievement ascuns' : def.description;
      const target = def.objective.target;
      const pct = Math.min(100, Math.round(ach.currentValue / target * 100));
      const status = isUnlocked
        ? '<div class="ach-reward">✓ Deblocat</div>'
        : `<div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
           <div class="progress-text">${ach.currentValue.toLocaleString()} / ${target.toLocaleString()}</div>`;
      return `
        <div class="${cls}">
          <div class="ach-title">🏆 ${name}</div>
          <div class="ach-desc">${desc}</div>
          ${status}
          <div class="ach-reward">${rewardText(def.reward)}</div>
        </div>
      `;
    }).join('');

    content.innerHTML = `
      <div class="ach-cats">${catButtons}</div>
      <div class="ach-grid">${cards || '<div class="empty-list">Nicio achievement în această categorie.</div>'}</div>
    `;
    content.querySelectorAll('[data-achcat]').forEach(b => {
      b.addEventListener('click', () => { currentAchCat = b.dataset.achcat; render(); });
    });
  }

  function render() {
    // Highlight active tab
    root.querySelectorAll('[data-tab]').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === currentTab);
    });
    if (currentTab === 'daily') renderMissionList('daily', DAILY_BY_ID, 'dailyResetAt');
    else if (currentTab === 'weekly') renderMissionList('weekly', WEEKLY_BY_ID, 'weeklyResetAt');
    else if (currentTab === 'permanent') renderMissionList('permanent', PERMANENT_BY_ID, null);
    else if (currentTab === 'achievements') renderAchievements();
  }

  function updateTimers() {
    if (!root || root.style.display === 'none') return;
    const spans = root.querySelectorAll('[data-timer]');
    spans.forEach(s => {
      const key = s.dataset.timer;
      const at = missionStore.state[key];
      if (at) s.textContent = fmtDuration(at - Date.now());
    });
  }

  function open(tab) {
    build();
    if (tab) currentTab = tab;
    root.classList.add('visible');
    render();
    if (gameState?.setScreen) {
      // Nu setăm screen dedicat — nu blochează gameplay; păstrăm PLAYING
    }
    if (!timerInterval) timerInterval = setInterval(updateTimers, 1000);
  }

  function close() {
    if (root) root.classList.remove('visible');
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    updateHudBadge();
  }

  function toggle() {
    if (root && root.classList.contains('visible')) close();
    else open();
  }

  function isVisible() {
    return !!(root && root.classList.contains('visible'));
  }

  // Reactive: re-render when store changes
  missionStore.on(() => {
    if (isVisible()) render();
    updateHudBadge();
  });

  // Init HUD badge lazy
  if (typeof document !== 'undefined') {
    setTimeout(() => { ensureHudBadge(); updateHudBadge(); }, 100);
  }

  return { open, close, toggle, isVisible };
}
