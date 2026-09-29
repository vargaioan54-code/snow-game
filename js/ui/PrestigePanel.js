// Etapa 15 — PrestigePanel
// Modal cu 5 tabs: Overview / Prestige Next / Endgame / Istoric / Lifetime.

import { PRESTIGE_MAX, PRESTIGE_RANKS, getPrestigeRank } from '../config/prestige.js';
import { ENDGAME_CONTRACTS, ENDGAME_MILESTONES } from '../config/endgame.js';

const STYLE = `
#prestige-overlay {
  position: fixed; inset: 0; background: rgba(6, 10, 20, 0.92);
  display: none; align-items: stretch; justify-content: center;
  z-index: 100; padding: 20px;
  font: 400 14px system-ui, -apple-system, sans-serif; color: #e8ecf5;
}
#prestige-overlay.open { display: flex; }
#prestige-panel {
  display: flex; width: 100%; max-width: 960px; max-height: 90vh;
  background: linear-gradient(180deg, #0f1520 0%, #1a2338 100%);
  border: 1px solid rgba(255,255,255,0.12); border-radius: 14px;
  overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.6);
}
#prestige-sidebar {
  width: 220px; background: rgba(0,0,0,0.25);
  display: flex; flex-direction: column;
  border-right: 1px solid rgba(255,255,255,0.08);
}
#prestige-sidebar h1 {
  font: 700 15px system-ui; padding: 16px; margin: 0;
  border-bottom: 1px solid rgba(255,255,255,0.08); color: #ffd700;
}
.pr-tab {
  padding: 14px 16px; cursor: pointer; border: none; background: transparent;
  color: #cfd6e6; text-align: left; font: 500 13px system-ui;
  border-left: 3px solid transparent; transition: all 0.15s;
}
.pr-tab:hover { background: rgba(255,255,255,0.04); }
.pr-tab.active { background: rgba(255,215,0,0.08); border-left-color: #ffd700; color: #ffd700; }
.pr-close {
  margin-top: auto; padding: 12px 16px; cursor: pointer;
  background: rgba(224,64,64,0.15); color: #ff7a7a;
  border: none; border-top: 1px solid rgba(255,255,255,0.08);
  font: 600 13px system-ui;
}
.pr-close:hover { background: rgba(224,64,64,0.28); }
#prestige-content {
  flex: 1; padding: 20px 24px; overflow-y: auto;
}
#prestige-content h2 { font: 700 18px system-ui; margin: 0 0 16px 0; }
.pr-card {
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px; padding: 14px; margin-bottom: 12px;
}
.pr-rank-hero {
  text-align: center; padding: 22px 14px;
}
.pr-rank-hero .icon { font-size: 48px; margin-bottom: 8px; display: block; }
.pr-rank-hero .name { font: 800 22px system-ui; margin-bottom: 4px; }
.pr-rank-hero .sub  { font-size: 12px; color: #a4adc0; }
.pr-bonuses-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px;
}
.pr-bonus-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 10px; background: rgba(0,0,0,0.2); border-radius: 6px;
}
.pr-bonus-row .lbl { color: #cfd6e6; font-size: 12px; }
.pr-bonus-row .val { font-weight: 700; color: #7ee081; }
.pr-req-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 10px; margin: 4px 0; border-radius: 6px;
  background: rgba(0,0,0,0.2);
}
.pr-req-row.ok  { color: #7ee081; }
.pr-req-row.bad { color: #ff8383; }
.pr-req-row .status { font-weight: 700; }
.pr-btn {
  display: inline-block; padding: 10px 16px; border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.06);
  color: #fff; font: 600 13px system-ui; cursor: pointer; margin-right: 8px;
}
.pr-btn.primary { background: linear-gradient(180deg, #ffd700 0%, #ffa500 100%); color: #1a1000; border: none; }
.pr-btn.danger  { background: rgba(224,64,64,0.2); border-color: #ff4040; color: #ff8383; }
.pr-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pr-btn:hover:not(:disabled) { filter: brightness(1.15); }

.pr-endg-item {
  padding: 12px; margin: 8px 0; border-radius: 8px;
  background: rgba(255,215,0,0.06); border: 1px solid rgba(255,215,0,0.15);
  cursor: pointer; transition: background 0.15s;
}
.pr-endg-item:hover { background: rgba(255,215,0,0.12); }
.pr-endg-item.locked { opacity: 0.5; cursor: default; background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.08); }
.pr-endg-item.completed { background: rgba(126,224,129,0.08); border-color: rgba(126,224,129,0.25); }
.pr-endg-title { font: 700 14px system-ui; color: #ffd700; display: flex; justify-content: space-between; }
.pr-endg-title .badge { font-size: 10px; padding: 2px 6px; border-radius: 8px; text-transform: uppercase; }
.pr-endg-title .badge.available { background: #ffd700; color: #1a1000; }
.pr-endg-title .badge.locked { background: #4a4a4a; color: #ccc; }
.pr-endg-title .badge.completed { background: #7ee081; color: #0a2a0a; }
.pr-endg-client { font-size: 11px; color: #a4adc0; margin: 4px 0; }
.pr-endg-desc { font-size: 12px; margin: 6px 0; color: #d0d5e0; }
.pr-endg-stats { display: flex; gap: 12px; font-size: 11px; color: #a4adc0; margin-top: 6px; flex-wrap: wrap; }

.pr-history-item {
  padding: 10px; margin: 6px 0; border-radius: 8px;
  background: rgba(0,0,0,0.25); font-size: 12px;
}
.pr-history-item .rank { font-weight: 700; color: #ffd700; }
.pr-history-item .ts { color: #a4adc0; font-size: 11px; margin-left: 8px; }

.pr-lifetime-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
}
.pr-life-stat {
  padding: 10px; border-radius: 8px; background: rgba(0,0,0,0.2);
  display: flex; justify-content: space-between;
}
.pr-life-stat .k { color: #cfd6e6; font-size: 12px; }
.pr-life-stat .v { font-weight: 700; color: #4a9eff; }

.pr-modal-confirm {
  position: fixed; inset: 0; background: rgba(0,0,0,0.85);
  display: none; align-items: center; justify-content: center;
  z-index: 110; padding: 20px;
}
.pr-modal-confirm.open { display: flex; }
.pr-modal-box {
  max-width: 640px; background: #1a2338; border: 2px solid #ff4040;
  border-radius: 14px; padding: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.8);
}
.pr-modal-box h3 { color: #ff8383; margin: 0 0 12px 0; }
.pr-modal-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 12px 0; }
.pr-modal-col h4 { font-size: 12px; margin: 0 0 6px 0; text-transform: uppercase; }
.pr-modal-col.reset h4 { color: #ff8383; }
.pr-modal-col.keep h4  { color: #7ee081; }
.pr-modal-col ul { margin: 0; padding-left: 18px; font-size: 12px; }
.pr-modal-col li { margin: 2px 0; }
.pr-warn { color: #ffb020; font-size: 12px; margin: 10px 0; padding: 8px; background: rgba(255,176,32,0.1); border-radius: 6px; }

#prestige-trigger-btn {
  position: fixed; top: calc(env(safe-area-inset-top) + 12px);
  left: calc(env(safe-area-inset-left) + 470px); z-index: 15;
  background: rgba(28,36,52,0.9); color: #ffd700;
  border: 1px solid rgba(255,215,0,0.35);
  border-radius: 10px; padding: 8px 12px; cursor: pointer;
  font: 600 13px system-ui; min-height: 40px;
}
#prestige-trigger-btn:hover { filter: brightness(1.2); }
#prestige-trigger-btn.ready { animation: prPulse 1.5s ease-in-out infinite; }
@keyframes prPulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(255,215,0,0.6); }
  50%     { box-shadow: 0 0 0 10px rgba(255,215,0,0); }
}
@media (max-width: 900px) {
  #prestige-trigger-btn { left: auto; right: calc(env(safe-area-inset-right) + 12px); top: calc(env(safe-area-inset-top) + 290px); }
  #prestige-panel { flex-direction: column; }
  #prestige-sidebar { width: 100%; flex-direction: row; overflow-x: auto; }
  .pr-tab { flex-shrink: 0; }
  .pr-close { margin-top: 0; }
}
`;

const TABS = [
  { id: 'overview',   label: '🏆 Overview' },
  { id: 'next',       label: '⬆️ Prestige Next' },
  { id: 'endgame',    label: '🌪️ Endgame' },
  { id: 'history',    label: '📜 Istoric' },
  { id: 'lifetime',   label: '📊 Lifetime' }
];

export function createPrestigePanel({
  prestigeStore, prestigeSystem,
  playerStore, companyStore, contractStore, worldStore,
  gameState, showBanner
}) {
  let root = null;
  let confirmModal = null;
  let currentTab = 'overview';
  let isOpen = false;

  function injectStyle() {
    if (document.getElementById('prestige-style')) return;
    const s = document.createElement('style');
    s.id = 'prestige-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function fmtNum(n) {
    if (typeof n !== 'number') return '0';
    if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
    if (n >= 1000)    return (n/1000).toFixed(1) + 'k';
    return String(Math.round(n));
  }

  function fmtMult(m) {
    return '×' + (Number(m) || 1).toFixed(2);
  }

  function fmtDate(ts) {
    if (!ts) return '—';
    try { return new Date(ts).toLocaleString('ro-RO'); } catch { return '—'; }
  }

  function renderOverview() {
    const rank = prestigeStore.getCurrentRank();
    const bonuses = prestigeStore.getPermanentBonuses();
    const nextR = prestigeStore.getNextRank();
    return `
      <h2>🏆 Overview</h2>
      <div class="pr-card pr-rank-hero" style="border-color:${rank.color}">
        <span class="icon">${rank.icon}</span>
        <div class="name" style="color:${rank.color}">${rank.name}</div>
        <div class="sub">Rank ${rank.rank} / ${PRESTIGE_MAX}</div>
      </div>
      <div class="pr-card">
        <div style="display:flex;justify-content:space-between;">
          <div>
            <div style="font-size:11px;color:#a4adc0;">Highest Rank</div>
            <div style="font-weight:700;">${prestigeStore.state.highestPrestige}</div>
          </div>
          <div>
            <div style="font-size:11px;color:#a4adc0;">Total Prestiges</div>
            <div style="font-weight:700;">${prestigeStore.state.totalPrestiges}</div>
          </div>
          <div>
            <div style="font-size:11px;color:#a4adc0;">Ultimul Prestige</div>
            <div style="font-weight:700;">${fmtDate(prestigeStore.state.lastPrestigeAt)}</div>
          </div>
        </div>
      </div>
      <div class="pr-card">
        <h4 style="margin:0 0 8px 0;font-size:13px;color:#ffd700;">Permanent Bonuses</h4>
        <div class="pr-bonuses-grid">
          <div class="pr-bonus-row"><span class="lbl">⚡ XP</span><span class="val">${fmtMult(bonuses.xpMultiplier)}</span></div>
          <div class="pr-bonus-row"><span class="lbl">🪙 Coins</span><span class="val">${fmtMult(bonuses.coinMultiplier)}</span></div>
          <div class="pr-bonus-row"><span class="lbl">❄️ Snow Clear</span><span class="val">${fmtMult(bonuses.snowClearMultiplier)}</span></div>
          <div class="pr-bonus-row"><span class="lbl">📜 Contract Reward</span><span class="val">${fmtMult(bonuses.contractRewardMultiplier)}</span></div>
          <div class="pr-bonus-row"><span class="lbl">⭐ Reputation</span><span class="val">${fmtMult(bonuses.reputationMultiplier)}</span></div>
          <div class="pr-bonus-row"><span class="lbl">🎒 Bag Capacity</span><span class="val">+${bonuses.capacityBonus}</span></div>
        </div>
      </div>
      ${nextR ? `<button class="pr-btn primary" id="pr-show-preview">Arată Reset Preview</button>` : `<div class="pr-card" style="text-align:center;color:#ffd700;">✨ Ai atins Mythic — rank maxim!</div>`}
    `;
  }

  function renderNext() {
    if (prestigeStore.isAtMax()) {
      return `<h2>⬆️ Prestige Next</h2><div class="pr-card" style="text-align:center;color:#ffd700;">Ai atins Mythic — nu mai poți face Prestige.</div>`;
    }
    const chk = prestigeSystem.checkRequirements();
    const req = chk.req || prestigeStore.getRequirements();
    const nextR = prestigeStore.getNextRank();
    const bonusesAfter = { xpMultiplier: 1 + nextR.rank * 0.05, coinMultiplier: 1 + nextR.rank * 0.05, snowClearMultiplier: 1 + nextR.rank * 0.05, contractRewardMultiplier: 1 + nextR.rank * 0.03, reputationMultiplier: 1 + nextR.rank * 0.05, capacityBonus: nextR.rank * 100 };

    const pLvl = playerStore?.state?.level || 1;
    const cLvl = companyStore?.state?.level || 0;
    const rep  = playerStore?.state?.reputation || 0;
    const ccp  = Array.isArray(contractStore?.state?.completed) ? contractStore.state.completed.length : 0;
    const rgn  = Array.isArray(worldStore?.state?.unlockedRegions) ? worldStore.state.unlockedRegions.length : 0;
    const extreme = prestigeStore.state.extremeContractsCompleted || 0;

    function row(label, cur, need) {
      const ok = cur >= need;
      return `<div class="pr-req-row ${ok?'ok':'bad'}"><span>${label}</span><span class="status">${ok?'✓':'✗'} ${cur}/${need}</span></div>`;
    }

    const blockers = chk.missing.filter(m => m.key === 'multiplayer' || m.key === 'activeContract');
    const canExecute = chk.ok;

    return `
      <h2>⬆️ Prestige Next</h2>
      <div class="pr-card pr-rank-hero" style="border-color:${nextR.color}">
        <span class="icon">${nextR.icon}</span>
        <div class="name" style="color:${nextR.color}">${nextR.name}</div>
        <div class="sub">Rank ${nextR.rank}</div>
      </div>
      <div class="pr-card">
        <h4 style="margin:0 0 8px 0;font-size:13px;">Cerințe</h4>
        ${row('Player Level', pLvl, req.playerLevel)}
        ${row('Company Level', cLvl, req.companyLevel)}
        ${row('Reputation', rep, req.reputation)}
        ${row('Contracte complete', ccp, req.contractsCompleted)}
        ${row('Regiuni deblocate', rgn, req.unlockedRegions)}
        ${row('Contracte extreme', extreme, req.extremeContractsCompleted)}
        ${blockers.length ? `<div class="pr-warn">⚠️ ${blockers.map(b => b.label).join(' · ')}</div>` : ''}
      </div>
      <div class="pr-card">
        <h4 style="margin:0 0 8px 0;font-size:13px;color:#7ee081;">Bonuses după Prestige</h4>
        <div class="pr-bonuses-grid">
          <div class="pr-bonus-row"><span class="lbl">⚡ XP</span><span class="val">${fmtMult(bonusesAfter.xpMultiplier)}</span></div>
          <div class="pr-bonus-row"><span class="lbl">🪙 Coins</span><span class="val">${fmtMult(bonusesAfter.coinMultiplier)}</span></div>
          <div class="pr-bonus-row"><span class="lbl">❄️ Snow Clear</span><span class="val">${fmtMult(bonusesAfter.snowClearMultiplier)}</span></div>
          <div class="pr-bonus-row"><span class="lbl">📜 Contract Reward</span><span class="val">${fmtMult(bonusesAfter.contractRewardMultiplier)}</span></div>
          <div class="pr-bonus-row"><span class="lbl">⭐ Reputation</span><span class="val">${fmtMult(bonusesAfter.reputationMultiplier)}</span></div>
          <div class="pr-bonus-row"><span class="lbl">🎒 Bag Capacity</span><span class="val">+${bonusesAfter.capacityBonus}</span></div>
        </div>
      </div>
      <button class="pr-btn primary" id="pr-show-preview" ${canExecute?'':'disabled'}>Arată Reset Preview</button>
      ${!canExecute ? `<div class="pr-warn" style="margin-top:8px;">Îndeplinește toate cerințele pentru a putea face Prestige.</div>` : ''}
    `;
  }

  function renderEndgame() {
    const unlocked = prestigeStore.isEndgameUnlocked();
    const completed = new Set(contractStore?.state?.completed || []);
    const pLvl = playerStore?.state?.level || 1;

    const items = ENDGAME_CONTRACTS.map(c => {
      const isCompleted = completed.has(c.id);
      const isLocked = !unlocked || pLvl < c.unlockLevel;
      const cls = isLocked ? 'locked' : (isCompleted ? 'completed' : '');
      const badgeCls = isLocked ? 'locked' : (isCompleted ? 'completed' : 'available');
      const badgeText = isLocked ? `Nivel ${c.unlockLevel}` : (isCompleted ? 'COMPLET' : 'DISPONIBIL');
      return `
        <div class="pr-endg-item ${cls}">
          <div class="pr-endg-title">
            <span>${c.title}</span>
            <span class="badge ${badgeCls}">${badgeText}</span>
          </div>
          <div class="pr-endg-client">${c.client}</div>
          <div class="pr-endg-desc">${c.description}</div>
          <div class="pr-endg-stats">
            <span>🪙 ${fmtNum(c.baseReward.coins)}</span>
            <span>⚡ ${fmtNum(c.baseReward.xp)} XP</span>
            <span>⭐ ${c.baseReward.reputation}</span>
            <span>⏱️ ${Math.round(c.timeLimit/60)}m</span>
            <span>❄️ ${c.snowTypeHint}</span>
            ${c.extremeWeather ? `<span>🌨️ ${c.extremeWeather}</span>` : ''}
            ${c.preferredVehicle ? `<span>🚜 ${c.preferredVehicle}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    const done = prestigeStore.state.extremeContractsCompleted || 0;
    const milestones = ENDGAME_MILESTONES.map(m => {
      const hit = prestigeStore.state.endgameMilestonesCompleted.includes(m.id);
      return `<div class="pr-req-row ${hit?'ok':'bad'}"><span>${m.name}</span><span class="status">${hit?'✓':`${done}/${m.target}`}</span></div>`;
    }).join('');

    return `
      <h2>🌪️ Endgame Contracts</h2>
      ${!unlocked ? `<div class="pr-warn">🔒 Endgame se deblochează la Player Level ${15}. Nivelul tău: ${pLvl}</div>` : ''}
      <div class="pr-card">
        <h4 style="margin:0 0 8px 0;font-size:13px;color:#ffd700;">Milestones</h4>
        ${milestones}
      </div>
      <div class="pr-card" style="background:rgba(255,215,0,0.03);border-color:rgba(255,215,0,0.2);">
        <div style="font-size:11px;color:#a4adc0;margin-bottom:6px;">🌐 Multiplayer coop endgame leaderboard: <span style="color:#ff8383;">BLOCKED</span> (fără backend)</div>
        <div style="font-size:11px;color:#a4adc0;">🔄 Cross-device Prestige sync: <span style="color:#ff8383;">BLOCKED</span> (fără backend)</div>
      </div>
      ${items}
    `;
  }

  function renderHistory() {
    const hist = prestigeStore.state.history || [];
    if (!hist.length) return `<h2>📜 Istoric Prestige</h2><div class="pr-card" style="text-align:center;color:#a4adc0;">Niciun Prestige încă.</div>`;
    const items = hist.map(h => {
      const r = getPrestigeRank(h.prestigeRank);
      const s = h.resetSnapshot || {};
      return `
        <div class="pr-history-item">
          <div><span class="rank">${r.icon} ${r.name} (Rank ${h.prestigeRank})</span><span class="ts">${fmtDate(h.timestamp)}</span></div>
          <div style="margin-top:6px;color:#cfd6e6;font-size:11px;">
            Before: Lv ${s.playerLevel||1} / XP ${fmtNum(s.playerXp||0)} / Vault ${fmtNum(s.vaultCoinsBefore||0)} / Rep ${fmtNum(s.reputationBefore||0)} / Company Lv ${s.companyLevelBefore||1}
          </div>
        </div>
      `;
    }).reverse().join('');
    return `<h2>📜 Istoric Prestige</h2>${items}`;
  }

  function renderLifetime() {
    const lif = prestigeStore.state.lifetime || {};
    const pStats = playerStore?.state?.stats || {};
    const cStats = companyStore?.state?.stats || {};
    // Lifetime aggregate: max(lifetime, current stats) — reflecting cross-prestige accumulation
    const totalSnow = Math.max(lif.totalSnowCleared || 0, pStats.totalSnowCleared || 0);
    const totalContracts = Math.max(lif.totalContractsCompleted || 0, pStats.contractsCompleted || 0);
    const totalCoins = Math.max(lif.totalCoinsEarned || 0, pStats.totalCoinsEarned || 0);
    const totalXp = Math.max(lif.totalXpEarned || 0, pStats.totalXpEarned || 0);

    const stats = [
      ['🏆 Total Prestiges Ever', lif.totalPrestigesEver || 0],
      ['❄️ Total Snow Cleared',    fmtNum(totalSnow)],
      ['📜 Total Contracte',       totalContracts],
      ['🌪️ Extreme Complete',      lif.totalExtremeCompleted || 0],
      ['🪙 Total Coins Earned',    fmtNum(totalCoins)],
      ['⚡ Total XP Earned',       fmtNum(totalXp)],
      ['👤 Highest Player Level',  lif.highestPlayerLevel || 1],
      ['🏢 Highest Company Level', lif.highestCompanyLevel || 1],
      ['⭐ Highest Reputation',    fmtNum(lif.highestReputation || 0)]
    ];
    const rows = stats.map(([k,v]) => `<div class="pr-life-stat"><span class="k">${k}</span><span class="v">${v}</span></div>`).join('');
    return `<h2>📊 Lifetime Stats</h2><div class="pr-card"><div class="pr-lifetime-grid">${rows}</div></div>`;
  }

  function renderContent() {
    switch (currentTab) {
      case 'next':     return renderNext();
      case 'endgame':  return renderEndgame();
      case 'history':  return renderHistory();
      case 'lifetime': return renderLifetime();
      default:         return renderOverview();
    }
  }

  function render() {
    if (!root) return;
    const contentEl = root.querySelector('#prestige-content');
    if (contentEl) contentEl.innerHTML = renderContent();
    root.querySelectorAll('.pr-tab').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === currentTab);
    });
    wireContent();
  }

  function wireContent() {
    const btn = root.querySelector('#pr-show-preview');
    if (btn) btn.onclick = openConfirm;
  }

  function ensureConfirmModal() {
    if (confirmModal) return confirmModal;
    confirmModal = document.createElement('div');
    confirmModal.className = 'pr-modal-confirm';
    confirmModal.id = 'prestige-confirm';
    document.body.appendChild(confirmModal);
    return confirmModal;
  }

  function openConfirm() {
    const preview = prestigeSystem.getPreview();
    if (!preview) return;
    const chk = prestigeSystem.checkRequirements();
    const modal = ensureConfirmModal();
    modal.innerHTML = `
      <div class="pr-modal-box">
        <h3>⚠️ Reset Preview — Rank ${preview.nextRank}</h3>
        <div class="pr-warn">Aceasta este o acțiune ireversibilă. Confirmă doar dacă ești sigur.</div>
        <div class="pr-modal-cols">
          <div class="pr-modal-col reset">
            <h4>Se resetează</h4>
            <ul>
              <li>Player Level ${preview.resetData.playerLevel} → 1</li>
              <li>Player XP ${fmtNum(preview.resetData.playerXp)} → 0</li>
              <li>Bag Coins ${fmtNum(preview.resetData.bagCoins)} → 0</li>
              <li>Vault ${fmtNum(preview.resetData.vaultCoins)} → ${fmtNum(preview.keepData.vaultCoinsAfter)}</li>
              <li>Reputation ${fmtNum(preview.resetData.reputation)} → ${fmtNum(preview.keepData.reputationAfter)}</li>
              <li>Company Level ${preview.resetData.companyLevel} → 1</li>
              <li>Company XP → 0 / Funds → 100</li>
              <li>Missions daily/weekly (achievements păstrate)</li>
            </ul>
          </div>
          <div class="pr-modal-col keep">
            <h4>Se păstrează</h4>
            <ul>
              <li>Diamonds: ${fmtNum(preview.keepData.diamonds)}</li>
              <li>Owned tools: ${preview.keepData.ownedTools.length}</li>
              <li>Vehicule + Garage</li>
              <li>Entitlements (cumpărături)</li>
              <li>Company: ${preview.keepData.companyName || 'N/A'} + stats</li>
              <li>Regiuni + Locații deblocate</li>
              <li>Achievements + Social + Events</li>
              <li>Permanent bonuses (cumulate)</li>
              <li>Prestige history</li>
            </ul>
          </div>
        </div>
        <div style="margin-top:14px;text-align:right;">
          <button class="pr-btn" id="pr-cancel">Anulează</button>
          <button class="pr-btn danger" id="pr-confirm" ${chk.ok?'':'disabled'}>FINAL: Prestige NOW</button>
        </div>
      </div>
    `;
    modal.classList.add('open');
    modal.querySelector('#pr-cancel').onclick = closeConfirm;
    modal.querySelector('#pr-confirm').onclick = doPrestige;
  }

  function closeConfirm() {
    if (confirmModal) confirmModal.classList.remove('open');
  }

  function doPrestige() {
    const result = prestigeSystem.executePrestige();
    if (result.ok) {
      closeConfirm();
      render();
      try { showBanner?.(`🏆 Prestige Rank ${result.newRank}!`); } catch {}
    } else {
      const btn = confirmModal.querySelector('#pr-confirm');
      if (btn) btn.textContent = 'EȘUAT: ' + (result.reason || 'necunoscut');
    }
  }

  function ensureRoot() {
    if (root) return root;
    injectStyle();
    root = document.createElement('div');
    root.id = 'prestige-overlay';
    root.innerHTML = `
      <div id="prestige-panel">
        <div id="prestige-sidebar">
          <h1>🏆 PRESTIGE</h1>
          ${TABS.map(t => `<button class="pr-tab" data-tab="${t.id}">${t.label}</button>`).join('')}
          <button class="pr-close" id="pr-close-btn">Închide</button>
        </div>
        <div id="prestige-content"></div>
      </div>
    `;
    document.body.appendChild(root);
    root.querySelectorAll('.pr-tab').forEach(el => {
      el.onclick = () => { currentTab = el.dataset.tab; render(); };
    });
    root.querySelector('#pr-close-btn').onclick = close;
    root.onclick = (e) => { if (e.target === root) close(); };

    // Reactive re-render on prestige state changes
    prestigeStore.on(() => { if (isOpen) render(); });

    return root;
  }

  function open() {
    ensureRoot();
    isOpen = true;
    root.classList.add('open');
    if (gameState) gameState.setScreen('prestige_open');
    render();
  }

  function close() {
    isOpen = false;
    if (root) root.classList.remove('open');
    closeConfirm();
    if (gameState) gameState.setScreen('playing');
    updateHudButton();
  }

  function toggle() { isOpen ? close() : open(); }

  function ensureHudButton() {
    if (document.getElementById('prestige-trigger-btn')) return;
    injectStyle();
    const btn = document.createElement('button');
    btn.id = 'prestige-trigger-btn';
    document.body.appendChild(btn);
    btn.onclick = toggle;
    updateHudButton();
    // Update button label reactively on rank change
    prestigeStore.on(() => updateHudButton());
    if (playerStore) playerStore.onKey('level', () => updateHudButton());
  }

  function updateHudButton() {
    const btn = document.getElementById('prestige-trigger-btn');
    if (!btn) return;
    const r = prestigeStore.getCurrentRank();
    const chk = prestigeSystem.checkRequirements();
    const ready = chk.ok && !prestigeStore.isAtMax();
    btn.innerHTML = `${r.icon} ${r.name}${ready?' <span style="color:#7ee081;">✨</span>':''}`;
    btn.style.color = r.color;
    btn.classList.toggle('ready', ready);
  }

  return { open, close, toggle, render, isVisible: () => isOpen, ensureHudButton };
}
