// Etapa 8 — CompanyPanel
// Overlay modal cu sidebar (Dashboard, Profile, Progression, Upgrades, Finances, Statistics, History).
// Trigger: buton HUD 🏢 sau tastă `B`.
// Reactiv la companyStore + playerStore.

import { COMPANY_LEVELS, COMPANY_MAX_LEVEL, COMPANY_UPGRADES, COMPANY_UPGRADE_IDS, CONTRACT_TIERS } from '../config/company.js';

const SCREEN_COMPANY_OPEN = 'company_open';
const SCREEN_PLAYING = 'playing';

const STYLE = `
#company-overlay { position: fixed; inset: 0; background: rgba(15,20,32,0.85); display: none;
  z-index: 40; font: 400 14px system-ui, sans-serif; color: #fff;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}
#company-overlay.visible { display: flex; align-items: center; justify-content: center; }
#company-overlay .panel {
  width: min(96vw, 1000px); height: min(90vh, 720px);
  background: #131a26; border: 1px solid rgba(255,255,255,0.15); border-radius: 14px;
  display: flex; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}
#company-overlay .sidebar {
  width: 220px; background: #0e1420; border-right: 1px solid rgba(255,255,255,0.08);
  display: flex; flex-direction: column; padding: 16px 12px; gap: 6px;
}
#company-overlay .sidebar .header { display: flex; justify-content: space-between; align-items: center; padding: 4px 8px 12px; }
#company-overlay .sidebar .header .name { font-weight: 700; font-size: 13px; letter-spacing: 0.4px; }
#company-overlay .sidebar .header .close { cursor: pointer; color: #8a94aa; padding: 4px 8px; }
#company-overlay .sidebar .header .close:hover { color: #fff; }
#company-overlay .sidebar button.nav {
  display: flex; align-items: center; gap: 10px; text-align: left;
  padding: 10px 12px; border-radius: 8px; cursor: pointer; border: none;
  background: transparent; color: #b8c0d0; font: 500 13px system-ui;
}
#company-overlay .sidebar button.nav:hover { background: rgba(255,255,255,0.05); color: #fff; }
#company-overlay .sidebar button.nav.active { background: #2a3244; color: #fff; }
#company-overlay .content { flex: 1; overflow-y: auto; padding: 24px 28px; }
#company-overlay h2 { margin: 0 0 20px; font-size: 20px; font-weight: 700; }
#company-overlay .card {
  background: #1c2434; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
  padding: 16px; margin-bottom: 16px;
}
#company-overlay .card h3 { margin: 0 0 12px; font-size: 15px; font-weight: 600; color: #8a94aa; letter-spacing: 0.3px; text-transform: uppercase; }
#company-overlay .card .value { font-size: 24px; font-weight: 700; }
#company-overlay .card .sub { font-size: 12px; color: #8a94aa; margin-top: 4px; }
#company-overlay .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
#company-overlay .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
#company-overlay .bar-track { height: 8px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; margin: 8px 0 4px; }
#company-overlay .bar-fill { height: 100%; background: linear-gradient(90deg, #3fd8ff, #2ea8d0); transition: width 0.3s; }
#company-overlay .bar-fill.xp { background: linear-gradient(90deg, #ffc043, #d09030); }
#company-overlay .bar-fill.rep { background: linear-gradient(90deg, #e04040, #a02020); }
#company-overlay .level-item {
  display: flex; align-items: center; padding: 10px 14px; border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.08); margin-bottom: 6px;
}
#company-overlay .level-item.current { background: #2a3244; border-color: #3fd8ff; }
#company-overlay .level-item.passed { opacity: 0.5; }
#company-overlay .level-item .lvl { font-weight: 700; margin-right: 12px; min-width: 40px; }
#company-overlay .level-item .name { flex: 1; }
#company-overlay .level-item .unlocks { font-size: 11px; color: #8a94aa; margin-left: 8px; }
#company-overlay .upgrade-card {
  border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 14px;
  margin-bottom: 10px; background: #1c2434;
}
#company-overlay .upgrade-card .row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
#company-overlay .upgrade-card .name { font-weight: 600; }
#company-overlay .upgrade-card .desc { font-size: 12px; color: #8a94aa; margin-bottom: 8px; }
#company-overlay .upgrade-card .stars { color: #ffc043; letter-spacing: 2px; }
#company-overlay .upgrade-card button {
  padding: 8px 14px; border-radius: 6px; cursor: pointer; border: 1px solid #3ea862;
  background: #3ea862; color: #fff; font: 600 12px system-ui;
}
#company-overlay .upgrade-card button:disabled { background: #2a3244; border-color: #2a3244; color: #4a5468; cursor: not-allowed; }
#company-overlay .upgrade-card button:hover:not(:disabled) { filter: brightness(1.15); }
#company-overlay .tier-badge {
  display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;
  margin-left: 8px;
}
#company-overlay .tx-list { max-height: 480px; overflow-y: auto; }
#company-overlay .tx-item {
  padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.06);
  display: flex; justify-content: space-between; font-size: 12px;
}
#company-overlay .tx-item .type { color: #8a94aa; }
#company-overlay .tx-item .amount { font-weight: 700; }
#company-overlay .tx-item .amount.pos { color: #3ea862; }
#company-overlay .tx-item .amount.neg { color: #e04040; }
@media (max-width: 900px) {
  #company-overlay .panel { flex-direction: column; height: 92vh; }
  #company-overlay .sidebar {
    width: 100%; flex-direction: row; overflow-x: auto; padding: 8px;
    border-right: none; border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  #company-overlay .sidebar .header { display: none; }
  #company-overlay .sidebar button.nav { flex-shrink: 0; padding: 8px 12px; }
  #company-overlay .grid2, #company-overlay .grid3 { grid-template-columns: 1fr; }
}
`;

const NAV_ITEMS = [
  { id: 'dashboard',    icon: '📊', label: 'Dashboard' },
  { id: 'profile',      icon: '👤', label: 'Profil' },
  { id: 'progression',  icon: '📈', label: 'Progresie' },
  { id: 'upgrades',     icon: '⬆️', label: 'Upgrades' },
  { id: 'finances',     icon: '💰', label: 'Finanțe' },
  { id: 'statistics',   icon: '📊', label: 'Statistici' },
  { id: 'history',      icon: '📜', label: 'Istoric' }
];

export function createCompanyPanel(deps) {
  const { companyStore, companySystem, playerStore, gameState, transactionLog, showBanner } = deps;
  let root = null;
  let content = null;
  let currentTab = 'dashboard';
  let unsubs = [];

  function injectStyle() {
    if (document.getElementById('company-style')) return;
    const s = document.createElement('style');
    s.id = 'company-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function build() {
    if (root) return root;
    injectStyle();
    root = document.createElement('div');
    root.id = 'company-overlay';
    const navHtml = NAV_ITEMS.map(n =>
      `<button class="nav ${n.id === currentTab ? 'active' : ''}" data-nav="${n.id}">${n.icon} ${n.label}</button>`
    ).join('');
    root.innerHTML = `
      <div class="panel">
        <div class="sidebar">
          <div class="header">
            <span class="name">🏢 COMPANY</span>
            <span class="close" data-a="close">×</span>
          </div>
          ${navHtml}
        </div>
        <div class="content" id="company-content"></div>
      </div>
    `;
    document.body.appendChild(root);
    content = root.querySelector('#company-content');

    root.querySelector('[data-a="close"]').addEventListener('click', close);
    root.addEventListener('click', (e) => { if (e.target === root) close(); });
    root.querySelectorAll('.nav').forEach(b => {
      b.addEventListener('click', () => { currentTab = b.dataset.nav; render(); });
    });

    // Reactive re-render
    unsubs.push(companyStore.on(() => { if (isVisible()) render(); }));
    unsubs.push(playerStore.on((_s, changed) => {
      if (!isVisible()) return;
      if (changed.includes('reputation') || changed.includes('level') || changed.includes('vaultCoins') || changed.includes('bagCoins')) render();
    }));
    return root;
  }

  function isVisible() { return root && root.classList.contains('visible'); }

  function esc(s) { return String(s || '').replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'})[c]); }
  function pct(n) { return Math.round(Math.max(0, Math.min(1, n)) * 100) + '%'; }
  function stars(n) { return '★'.repeat(n) + '☆'.repeat(5 - n); }

  function render() {
    if (!content) return;
    root.querySelectorAll('.nav').forEach(b => b.classList.toggle('active', b.dataset.nav === currentTab));
    switch (currentTab) {
      case 'dashboard': renderDashboard(); break;
      case 'profile': renderProfile(); break;
      case 'progression': renderProgression(); break;
      case 'upgrades': renderUpgrades(); break;
      case 'finances': renderFinances(); break;
      case 'statistics': renderStatistics(); break;
      case 'history': renderHistory(); break;
      default: renderDashboard();
    }
  }

  function renderDashboard() {
    const st = companyStore.state;
    const levelInfo = companyStore.getLevelInfo();
    const nextInfo = companyStore.getNextLevelInfo();
    const progress = companyStore.getProgress01();
    const avg = companyStore.computeAverageRating();
    content.innerHTML = `
      <h2>📊 Dashboard</h2>
      <div class="card">
        <h3>Compania</h3>
        <div class="value">${esc(st.companyName)}</div>
        <div class="sub">${esc(levelInfo.name)} · Nivel ${st.level}</div>
      </div>
      <div class="grid3">
        <div class="card">
          <h3>Level XP</h3>
          <div class="value">${st.xp}</div>
          <div class="bar-track"><div class="bar-fill xp" style="width:${Math.round(progress * 100)}%"></div></div>
          <div class="sub">${nextInfo ? `${st.xp} / ${levelInfo.xpToNext} pt. Nivel ${nextInfo.level}` : 'MAX LEVEL'}</div>
        </div>
        <div class="card">
          <h3>Reputation</h3>
          <div class="value">${playerStore.state.reputation || 0}</div>
          <div class="sub">Cumulat din contracte</div>
        </div>
        <div class="card">
          <h3>Company Funds</h3>
          <div class="value">${st.funds.toLocaleString()}</div>
          <div class="sub">Pentru upgrades</div>
        </div>
      </div>
      <div class="grid3">
        <div class="card">
          <h3>Contracte finalizate</h3>
          <div class="value">${st.stats.completedContracts}</div>
          <div class="sub">Eșuate: ${st.stats.failedContracts}</div>
        </div>
        <div class="card">
          <h3>Rating mediu</h3>
          <div class="value" style="color:#ffc043;letter-spacing:2px;">${stars(Math.round(avg))}</div>
          <div class="sub">${avg.toFixed(2)} / 5.00 · ${st.stats.ratingCount} contracte</div>
        </div>
        <div class="card">
          <h3>Streak</h3>
          <div class="value">${st.stats.currentStreak}</div>
          <div class="sub">Best: ${st.stats.bestStreak}</div>
        </div>
      </div>
      ${nextInfo ? renderNextUnlock(nextInfo) : ''}
    `;
  }

  function renderNextUnlock(nextInfo) {
    const unlocks = nextInfo.unlocks || [];
    if (unlocks.length === 0) return '';
    return `
      <div class="card">
        <h3>Următorul unlock</h3>
        <div style="font-weight:600;margin-bottom:6px;">Nivel ${nextInfo.level}: ${esc(nextInfo.name)}</div>
        <div class="sub">Deblochează: ${unlocks.join(', ')}</div>
      </div>`;
  }

  function renderProfile() {
    const st = companyStore.state;
    const founded = st.foundedAt ? new Date(st.foundedAt).toLocaleDateString('ro-RO') : '—';
    const avg = companyStore.computeAverageRating();
    content.innerHTML = `
      <h2>👤 Profil companie</h2>
      <div class="card">
        <h3>Identitate</h3>
        <div class="value">${esc(st.companyName)}</div>
        <div class="sub">ID: ${esc(st.companyId)}</div>
        <div class="sub">Fondată: ${founded}</div>
        <button class="btn" style="margin-top:14px;padding:8px 14px;background:#2a3244;border:none;color:#fff;border-radius:6px;cursor:pointer;" data-a="rename">✏️ Redenumește</button>
      </div>
      <div class="grid2">
        <div class="card">
          <h3>Contracte</h3>
          <div class="value">${st.stats.completedContracts}</div>
          <div class="sub">Finalizate · ${st.stats.failedContracts} eșuate</div>
        </div>
        <div class="card">
          <h3>Rating mediu</h3>
          <div class="value" style="color:#ffc043;letter-spacing:2px;">${stars(Math.round(avg))}</div>
          <div class="sub">${avg.toFixed(2)} din ${st.stats.ratingCount} rating-uri</div>
        </div>
      </div>
    `;
    const btnRename = content.querySelector('[data-a="rename"]');
    if (btnRename) btnRename.addEventListener('click', () => {
      const newName = prompt('Nume nou (3-30 caractere):', st.companyName);
      if (newName == null) return;
      const r = companySystem.renameCompany(newName);
      if (!r.ok && showBanner) showBanner('Nume invalid');
    });
  }

  function renderProgression() {
    const cur = companyStore.state.level;
    content.innerHTML = `
      <h2>📈 Progresie</h2>
      <div class="card">
        ${COMPANY_LEVELS.map(l => {
          const cls = l.level < cur ? 'passed' : (l.level === cur ? 'current' : '');
          const unlocks = (l.unlocks && l.unlocks.length) ? `<span class="unlocks">→ ${l.unlocks.join(', ')}</span>` : '';
          return `<div class="level-item ${cls}"><span class="lvl">L${l.level}</span><span class="name">${esc(l.name)}</span>${unlocks}</div>`;
        }).join('')}
      </div>
    `;
  }

  function renderUpgrades() {
    const st = companyStore.state;
    let html = `<h2>⬆️ Upgrades</h2><div class="card"><h3>Fonduri disponibile</h3><div class="value">${st.funds.toLocaleString()}</div></div>`;
    for (const id of COMPANY_UPGRADE_IDS) {
      const cfg = COMPANY_UPGRADES[id];
      const cur = st.upgrades[id] || 0;
      const isMax = cur >= cfg.maxLevel;
      const nextCost = isMax ? null : cfg.costs[cur + 1];
      const canAfford = !isMax && nextCost != null && st.funds >= nextCost;
      const starsHtml = '<span class="stars">' + '●'.repeat(cur) + '○'.repeat(cfg.maxLevel - cur) + '</span>';
      const btnLabel = isMax ? 'MAX' : (canAfford ? `UPGRADE (${nextCost.toLocaleString()})` : `Necesar: ${nextCost ? nextCost.toLocaleString() : '—'}`);
      html += `
        <div class="upgrade-card">
          <div class="row">
            <div><span class="name">${esc(cfg.name)}</span> ${starsHtml}</div>
            <button data-buy="${id}" ${!canAfford || isMax ? 'disabled' : ''}>${btnLabel}</button>
          </div>
          <div class="desc">${esc(cfg.description)}</div>
          <div class="sub">Efect actual: ${formatEffect(id, cfg.effect[cur])} · Următor: ${isMax ? '—' : formatEffect(id, cfg.effect[cur + 1])}</div>
        </div>`;
    }
    content.innerHTML = html;
    content.querySelectorAll('[data-buy]').forEach(b => {
      b.addEventListener('click', () => {
        const r = companySystem.buyUpgrade(b.dataset.buy);
        if (!r.ok && showBanner) {
          if (r.reason === 'insufficient_funds') showBanner('Fonduri insuficiente');
          else if (r.reason === 'max_level') showBanner('Nivel maxim atins');
          else showBanner('Upgrade eșuat');
        }
        render();
      });
    });
  }

  function formatEffect(id, val) {
    if (id === 'contract_capacity' || id === 'garage_capacity') return val + '';
    return 'x' + (val || 1).toFixed(2);
  }

  function renderFinances() {
    const st = companyStore.state;
    const summary = companySystem.getFinancialSummary();
    content.innerHTML = `
      <h2>💰 Finanțe</h2>
      <div class="grid3">
        <div class="card">
          <h3>Revenue Total</h3>
          <div class="value" style="color:#3ea862;">+${summary.revenue.toLocaleString()}</div>
        </div>
        <div class="card">
          <h3>Expenses Total</h3>
          <div class="value" style="color:#e04040;">-${summary.expenses.toLocaleString()}</div>
        </div>
        <div class="card">
          <h3>Net</h3>
          <div class="value" style="color:${summary.net >= 0 ? '#3ea862' : '#e04040'};">${summary.net >= 0 ? '+' : ''}${summary.net.toLocaleString()}</div>
        </div>
      </div>
      <div class="card">
        <h3>Balance curent</h3>
        <div class="value">${st.funds.toLocaleString()}</div>
        <div class="sub">40% din reward-uri contract → company funds</div>
      </div>
    `;
  }

  function renderStatistics() {
    const st = companyStore.state;
    const avg = companyStore.computeAverageRating();
    const byType = st.stats.contractsByType;
    content.innerHTML = `
      <h2>📊 Statistici</h2>
      <div class="grid3">
        <div class="card"><h3>Finalizate</h3><div class="value">${st.stats.completedContracts}</div></div>
        <div class="card"><h3>Eșuate</h3><div class="value">${st.stats.failedContracts}</div></div>
        <div class="card"><h3>Rating mediu</h3><div class="value">${avg.toFixed(2)}</div></div>
      </div>
      <div class="grid3">
        <div class="card"><h3>Best reward</h3><div class="value">${st.stats.bestContractReward.toLocaleString()}</div></div>
        <div class="card"><h3>Best streak</h3><div class="value">${st.stats.bestStreak}</div></div>
        <div class="card"><h3>Snow cleared</h3><div class="value">${st.stats.totalSnowCleared.toLocaleString()}</div></div>
      </div>
      <div class="card">
        <h3>Contracte pe tip</h3>
        <div class="grid3">
          <div>🏠 Casă: <b>${byType.house}</b></div>
          <div>🚗 Alee: <b>${byType.driveway}</b></div>
          <div>🅿️ Parcare: <b>${byType.parking}</b></div>
          <div>🏪 Magazin: <b>${byType.shop}</b></div>
          <div>🏭 Depozit: <b>${byType.warehouse}</b></div>
        </div>
      </div>
      <div class="card">
        <h3>Tiere deblocate</h3>
        <div>${CONTRACT_TIERS.map(t => {
          const ok = companyStore.isTierUnlocked(t.id);
          return `<span class="tier-badge" style="background:${ok ? t.color : '#2a3244'};color:${ok ? '#0a0e18' : '#4a5468'};">${t.name}</span>`;
        }).join(' ')}</div>
      </div>
    `;
  }

  function renderHistory() {
    const all = transactionLog ? transactionLog.getAll() : [];
    const companyTx = all.filter(t => t.type && t.type.startsWith('COMPANY_'));
    const recent = companyTx.slice(-30).reverse();
    let html = `<h2>📜 Istoric tranzacții</h2><div class="card"><div class="tx-list">`;
    if (recent.length === 0) html += `<div class="sub" style="padding:20px;text-align:center;">Fără tranzacții încă. Completează un contract!</div>`;
    else {
      for (const t of recent) {
        const time = new Date(t.ts).toLocaleTimeString('ro-RO');
        const cls = t.type === 'COMPANY_EXPENSE' || t.type === 'COMPANY_UPGRADE' ? 'neg' : (t.amount > 0 ? 'pos' : '');
        const sign = t.type === 'COMPANY_EXPENSE' || t.type === 'COMPANY_UPGRADE' ? '-' : (t.amount > 0 ? '+' : '');
        html += `<div class="tx-item"><span class="type">${time} · ${t.type}</span><span class="amount ${cls}">${sign}${t.amount}${t.currency ? ' ' + t.currency : ''}</span></div>`;
      }
    }
    html += `</div></div>`;
    content.innerHTML = html;
  }

  function open() {
    if (!companySystem.isCreated()) {
      if (showBanner) showBanner('Fondează compania mai întâi!');
      return;
    }
    build();
    root.classList.add('visible');
    if (gameState && gameState.setScreen) gameState.setScreen(SCREEN_COMPANY_OPEN);
    render();
  }

  function close() {
    if (root) root.classList.remove('visible');
    if (gameState && gameState.screen === SCREEN_COMPANY_OPEN) gameState.setScreen(SCREEN_PLAYING);
  }

  function toggle() {
    if (root && root.classList.contains('visible')) close();
    else open();
  }

  function destroy() {
    for (const u of unsubs) u();
    unsubs = [];
    if (root && root.parentNode) root.parentNode.removeChild(root);
    root = null;
  }

  return { open, close, toggle, render, destroy };
}
