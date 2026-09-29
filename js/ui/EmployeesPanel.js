// EmployeesPanel — modal cu 3 tab-uri: Angajati / Piata Muncii / Salarii.
// Reactive la employeeStore + companyStore. Zero DOM writes din game loop.

import { EMPLOYEE_ROLE_BY_ID, EMPLOYEE_STATUS, employeeStatsAtLevel, employeeXpForLevel } from '../config/employees.js';
import { SCREENS } from '../state/GameState.js';

const STYLE = `
#employees-overlay {
  position: fixed; inset: 0; background: rgba(15,20,32,0.78);
  display: none; align-items: flex-start; justify-content: center; z-index: 45;
  font: 400 14px system-ui, sans-serif; color: #fff; padding: env(safe-area-inset-top,20px) 12px 12px;
  overflow-y: auto;
}
#employees-overlay.visible { display: flex; }
#employees-overlay .panel {
  background: #1c2434; border: 1px solid rgba(255,255,255,0.14);
  border-radius: 14px; padding: 18px 20px; width: min(880px, 96vw);
  max-height: calc(100vh - 40px); overflow-y: auto;
  box-shadow: 0 12px 44px rgba(0,0,0,0.5);
}
#employees-overlay h2 { margin: 0 0 14px; font-size: 18px; }
#employees-overlay .tabs { display: flex; gap: 8px; margin-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.1); }
#employees-overlay .tab { padding: 8px 14px; background: transparent; border: none; color: #aab; cursor: pointer; border-radius: 6px 6px 0 0; font: 600 13px system-ui; }
#employees-overlay .tab.active { background: #2a3244; color: #fff; }
#employees-overlay .card {
  background: #232b3d; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
  padding: 12px 14px; margin-bottom: 10px;
}
#employees-overlay .row-flex { display: flex; align-items: center; gap: 12px; }
#employees-overlay .badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font: 600 11px system-ui; margin-left: 4px; }
#employees-overlay .badge.avail { background: #1a5a2e; color: #a7e9b2; }
#employees-overlay .badge.assigned { background: #1e3f6a; color: #a8c7f0; }
#employees-overlay .badge.working { background: #6a4a1e; color: #f0d0a8; }
#employees-overlay .badge.resting { background: #4a4a4a; color: #cfcfcf; }
#employees-overlay button.btn {
  padding: 8px 14px; border-radius: 6px; cursor: pointer; border: 1px solid rgba(255,255,255,0.15);
  background: #2a3244; color: #fff; font: 600 13px system-ui;
}
#employees-overlay button.btn:hover:not(:disabled) { filter: brightness(1.15); }
#employees-overlay button.btn:disabled { opacity: 0.4; cursor: not-allowed; }
#employees-overlay button.btn.hire { background: #1a5a2e; }
#employees-overlay button.btn.danger { background: #7a2020; }
#employees-overlay .close-x { float: right; background: transparent; border: none; color: #fff; font-size: 22px; cursor: pointer; padding: 0 4px; line-height: 1; }
#employees-overlay .stats-mini { display: flex; gap: 12px; font: 500 12px system-ui; color: #ccc; margin-top: 6px; }
#employees-overlay .stats-mini span { padding: 2px 6px; background: rgba(255,255,255,0.05); border-radius: 4px; }
#employees-overlay .xp-bar { height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; margin: 6px 0; }
#employees-overlay .xp-fill { height: 100%; background: linear-gradient(90deg,#5ec8ff,#3a9ee0); }
#employees-overlay .empty { color: #8898b8; font-style: italic; padding: 20px; text-align: center; }
`;

function statusBadge(status) {
  const map = { AVAILABLE: 'avail', ASSIGNED: 'assigned', WORKING: 'working', RESTING: 'resting' };
  const label = { AVAILABLE: 'Disponibil', ASSIGNED: 'Alocat', WORKING: 'Lucreaza', RESTING: 'Odihna' };
  return `<span class="badge ${map[status] || 'resting'}">${label[status] || status}</span>`;
}

export function createEmployeesPanel(deps) {
  const {
    employeeStore, employeeSystem, companyStore, companySystem,
    gameState, vehicleStore
  } = deps || {};

  let root = null;
  let activeTab = 'employees'; // 'employees' | 'market' | 'salaries'

  function injectStyle() {
    if (document.getElementById('employees-panel-style')) return;
    const s = document.createElement('style');
    s.id = 'employees-panel-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function build() {
    if (root) return root;
    injectStyle();
    root = document.createElement('div');
    root.id = 'employees-overlay';
    document.body.appendChild(root);
    root.addEventListener('click', (e) => { if (e.target === root) close(); });
    render();
    // Subscribe reactive
    const unsub1 = employeeStore.on(() => { if (isVisible()) render(); });
    const unsub2 = companyStore.on(() => { if (isVisible()) render(); });
    root._unsubs = [unsub1, unsub2];
    return root;
  }

  function isVisible() { return root && root.classList.contains('visible'); }

  function renderCard(emp, role) {
    const stats = employeeSystem.getStats(emp.id) || {};
    const vehicleName = emp.assignedVehicleId
      ? (vehicleStore ? (deps.getVehicleNameById?.(emp.assignedVehicleId) || emp.assignedVehicleId) : emp.assignedVehicleId)
      : '';
    return `
      <div class="card">
        <div class="row-flex">
          <div style="font-size: 28px;">${role.icon}</div>
          <div style="flex:1">
            <div><b>${emp.name}</b> ${statusBadge(emp.status)}</div>
            <div style="font-size:12px;color:#aab">${role.name} · Level ${emp.level}</div>
            ${vehicleName ? `<div style="font-size:12px;color:#a8c7f0">🚗 ${vehicleName}</div>` : ''}
          </div>
          <div>
            <button class="btn danger" data-action="fire" data-id="${emp.id}" ${emp.status !== 'AVAILABLE' ? 'disabled' : ''}>Concediază</button>
          </div>
        </div>
        <div class="stats-mini">
          <span>Speed: ${stats.speed?.toFixed(2) || '?'}</span>
          <span>Efic: ${stats.efficiency?.toFixed(2) || '?'}</span>
          <span>Rel: ${(stats.reliability * 100 || 0).toFixed(0)}%</span>
          <span>Salariu: ${stats.salary}$/săpt</span>
        </div>
        <div class="xp-bar"><div class="xp-fill" style="width:${Math.min(100, (emp.xp / employeeXpForLevel(emp.level + 1)) * 100).toFixed(1)}%"></div></div>
        <div style="font-size:11px;color:#aab">XP: ${emp.xp} / ${employeeXpForLevel(emp.level + 1)} · Jobs: ${emp.completedJobs} · ⭐ ${emp.averageRating?.toFixed(1) || '0'}</div>
      </div>
    `;
  }

  function renderCandidateCard(cand) {
    const role = EMPLOYEE_ROLE_BY_ID[cand.roleId];
    const canAfford = (companyStore.state.funds || 0) >= cand.hiringCost;
    return `
      <div class="card">
        <div class="row-flex">
          <div style="font-size: 28px;">${cand.icon}</div>
          <div style="flex:1">
            <div><b>${cand.name}</b></div>
            <div style="font-size:12px;color:#aab">${role.name} · ${role.specialization}</div>
            <div class="stats-mini">
              <span>Speed: ${role.baseSpeed}</span>
              <span>Efic: ${role.baseEfficiency}</span>
              <span>Rel: ${(role.baseReliability * 100).toFixed(0)}%</span>
              <span>Salariu: ${cand.baseSalary}$/săpt</span>
            </div>
          </div>
          <div style="text-align:right">
            <div style="font:600 14px system-ui; color:${canAfford ? '#a7e9b2' : '#e88'};">${cand.hiringCost}$</div>
            <button class="btn hire" data-action="hire" data-id="${cand.candidateId}" ${!canAfford ? 'disabled' : ''}>Angajează</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderTabContent() {
    if (activeTab === 'employees') {
      const list = employeeStore.getAll();
      if (list.length === 0) {
        return `<div class="empty">Nu ai angajați. Mergi la <b>Piața Muncii</b>.</div>`;
      }
      return list.map(e => {
        const role = EMPLOYEE_ROLE_BY_ID[e.roleId];
        return role ? renderCard(e, role) : '';
      }).join('');
    }
    if (activeTab === 'market') {
      const cands = employeeStore.state.availableCandidates;
      let html = cands.map(renderCandidateCard).join('');
      html += `<div style="text-align:center; margin-top:10px"><button class="btn" data-action="refresh">🔄 Refresh candidați</button></div>`;
      if (!cands.length) html = `<div class="empty">Nu sunt candidați. Apasă Refresh.</div>` + html;
      return html;
    }
    if (activeTab === 'salaries') {
      const total = employeeStore.totalWeeklySalary();
      const count = employeeStore.count();
      const funds = companyStore.state.funds || 0;
      const canPay = funds >= total;
      return `
        <div class="card">
          <div style="font-size:16px"><b>Salarii Săptămânale</b></div>
          <div style="margin: 8px 0">Angajați activi: <b>${count}</b></div>
          <div style="margin: 8px 0">Total săptămânal: <b>${total}$</b></div>
          <div style="margin: 8px 0">Fonduri companie: <b>${funds}$</b></div>
          <div style="margin-top:12px">
            <button class="btn" data-action="pay" ${!canPay || total === 0 ? 'disabled' : ''}>💰 Plătește Acum (${total}$)</button>
          </div>
          <div style="margin-top:10px; font-size:12px; color:#aab">
            Salariile se plătesc automat la fiecare 7 zile in-game.
          </div>
        </div>
      `;
    }
    return '';
  }

  function render() {
    if (!root) return;
    root.innerHTML = `
      <div class="panel">
        <button class="close-x" data-action="close">×</button>
        <h2>👷 Angajați</h2>
        <div class="tabs">
          <button class="tab ${activeTab === 'employees' ? 'active' : ''}" data-tab="employees">Angajați (${employeeStore.count()})</button>
          <button class="tab ${activeTab === 'market' ? 'active' : ''}" data-tab="market">Piața Muncii</button>
          <button class="tab ${activeTab === 'salaries' ? 'active' : ''}" data-tab="salaries">Salarii</button>
        </div>
        <div class="tab-content">${renderTabContent()}</div>
      </div>
    `;
    // Event delegation
    root.querySelectorAll('.tab').forEach(b => {
      b.addEventListener('click', () => { activeTab = b.dataset.tab; render(); });
    });
    root.querySelectorAll('[data-action]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const a = el.dataset.action;
        const id = el.dataset.id;
        if (a === 'close') close();
        else if (a === 'hire') employeeSystem.hire(id);
        else if (a === 'fire') employeeSystem.fire(id);
        else if (a === 'refresh') employeeSystem.refreshCandidates();
        else if (a === 'pay') employeeSystem.payWeeklySalaries();
      });
    });
  }

  function open() {
    if (!companySystem || !companySystem.isCreated()) {
      alert('Trebuie să creezi o companie mai întâi.');
      return;
    }
    build();
    // Refresh candidates dacă lista e goala
    if (!employeeStore.state.availableCandidates.length) {
      employeeSystem.refreshCandidates();
    }
    render();
    root.classList.add('visible');
    if (gameState && gameState.setScreen) gameState.setScreen(SCREENS.SETTINGS_OPEN);
  }

  function close() {
    if (root) root.classList.remove('visible');
    if (gameState && gameState.setScreen) gameState.setScreen(SCREENS.PLAYING);
  }

  function toggle() { if (isVisible()) close(); else open(); }

  return { open, close, toggle, isVisible };
}
