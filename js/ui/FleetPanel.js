// FleetPanel — modal cu 3 tab-uri: Assignments / Operatiuni Active / Istoric.
// Reactive la employeeStore + fleetStore + vehicleStore + contractStore.

import { EMPLOYEE_ROLE_BY_ID, EMPLOYEE_STATUS } from '../config/employees.js';
import { VEHICLE_BY_ID } from '../config/vehicles.js';
import { ATTACHMENT_BY_ID } from '../config/attachments.js';
import { CONTRACT_STATUS } from '../config/contractStatus.js';
import { OP_STATUS } from '../state/FleetStore.js';
import { SCREENS } from '../state/GameState.js';

const STYLE = `
#fleet-overlay {
  position: fixed; inset: 0; background: rgba(15,20,32,0.78);
  display: none; align-items: flex-start; justify-content: center; z-index: 46;
  font: 400 14px system-ui, sans-serif; color: #fff; padding: env(safe-area-inset-top,20px) 12px 12px;
  overflow-y: auto;
}
#fleet-overlay.visible { display: flex; }
#fleet-overlay .panel {
  background: #1c2434; border: 1px solid rgba(255,255,255,0.14);
  border-radius: 14px; padding: 18px 20px; width: min(960px, 96vw);
  max-height: calc(100vh - 40px); overflow-y: auto;
  box-shadow: 0 12px 44px rgba(0,0,0,0.5);
}
#fleet-overlay h2 { margin: 0 0 14px; font-size: 18px; }
#fleet-overlay .tabs { display: flex; gap: 8px; margin-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,0.1); }
#fleet-overlay .tab { padding: 8px 14px; background: transparent; border: none; color: #aab; cursor: pointer; border-radius: 6px 6px 0 0; font: 600 13px system-ui; }
#fleet-overlay .tab.active { background: #2a3244; color: #fff; }
#fleet-overlay .card {
  background: #232b3d; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
  padding: 12px 14px; margin-bottom: 10px;
}
#fleet-overlay button.btn {
  padding: 6px 12px; border-radius: 6px; cursor: pointer; border: 1px solid rgba(255,255,255,0.15);
  background: #2a3244; color: #fff; font: 600 12px system-ui;
}
#fleet-overlay button.btn:hover:not(:disabled) { filter: brightness(1.15); }
#fleet-overlay button.btn:disabled { opacity: 0.4; cursor: not-allowed; }
#fleet-overlay button.btn.primary { background: #1a5a8f; }
#fleet-overlay button.btn.success { background: #1a5a2e; }
#fleet-overlay button.btn.danger { background: #7a2020; }
#fleet-overlay select {
  padding: 6px 10px; border-radius: 6px; background: #2a3244; color: #fff;
  border: 1px solid rgba(255,255,255,0.15); font: 500 12px system-ui;
}
#fleet-overlay .row-flex { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
#fleet-overlay .close-x { float: right; background: transparent; border: none; color: #fff; font-size: 22px; cursor: pointer; padding: 0 4px; }
#fleet-overlay .badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font: 600 11px system-ui; }
#fleet-overlay .badge.success { background: #1a5a2e; color: #a7e9b2; }
#fleet-overlay .badge.working { background: #6a4a1e; color: #f0d0a8; }
#fleet-overlay .badge.poor { background: #4a2020; color: #e88; }
#fleet-overlay .badge.cancel { background: #4a4a4a; color: #cfcfcf; }
#fleet-overlay .progress { height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; margin: 6px 0; }
#fleet-overlay .progress-fill { height: 100%; background: linear-gradient(90deg,#3ae08a,#1a8a5a); transition: width 300ms; }
#fleet-overlay .empty { color: #8898b8; font-style: italic; padding: 20px; text-align: center; }
`;

function statusBadgeOp(status) {
  if (status === 'COMPLETED') return `<span class="badge success">✔ Complet</span>`;
  if (status === 'WORKING') return `<span class="badge working">⏳ În lucru</span>`;
  if (status === 'FAILED') return `<span class="badge poor">✗ Eșec</span>`;
  if (status === 'CANCELLED') return `<span class="badge cancel">⌀ Anulat</span>`;
  return `<span class="badge">${status}</span>`;
}

function starsHtml(n) {
  const k = Math.max(0, Math.min(5, n | 0));
  return '⭐'.repeat(k) + '☆'.repeat(5 - k);
}

function formatMs(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  const rem = s - m * 60;
  return `${m}:${rem.toString().padStart(2, '0')}`;
}

export function createFleetPanel(deps) {
  const {
    employeeStore, fleetStore, vehicleStore, contractStore,
    fleetSystem, companySystem, gameState
  } = deps || {};

  let root = null;
  let activeTab = 'assignments';
  let liveTimer = null;

  function injectStyle() {
    if (document.getElementById('fleet-panel-style')) return;
    const s = document.createElement('style');
    s.id = 'fleet-panel-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function build() {
    if (root) return root;
    injectStyle();
    root = document.createElement('div');
    root.id = 'fleet-overlay';
    document.body.appendChild(root);
    root.addEventListener('click', (e) => { if (e.target === root) close(); });
    render();
    const u1 = employeeStore.on(() => { if (isVisible()) render(); });
    const u2 = fleetStore.on(() => { if (isVisible()) render(); });
    const u3 = vehicleStore.on(() => { if (isVisible()) render(); });
    root._unsubs = [u1, u2, u3];
    return root;
  }

  function isVisible() { return root && root.classList.contains('visible'); }

  function _compatVehiclesForEmployee(emp) {
    const role = EMPLOYEE_ROLE_BY_ID[emp.roleId];
    if (!role) return [];
    return vehicleStore.state.owned.filter(vId => {
      const v = VEHICLE_BY_ID[vId];
      return v && role.allowedVehicleCategories.includes(v.category);
    });
  }

  function _compatAttachmentsForVehicleAndEmployee(vehicleId, emp) {
    const v = VEHICLE_BY_ID[vehicleId];
    const role = EMPLOYEE_ROLE_BY_ID[emp.roleId];
    if (!v || !role) return [];
    return vehicleStore.state.ownedAttachments.filter(aId => {
      const a = ATTACHMENT_BY_ID[aId];
      return a && v.compatibleAttachments.includes(aId) && role.allowedAttachmentTypes.includes(a.type);
    });
  }

  function _availableContracts() {
    return Object.values(contractStore.state.contracts).filter(c => c.status === CONTRACT_STATUS.AVAILABLE);
  }

  function renderAssignments() {
    const employees = employeeStore.getAll();
    if (!employees.length) return `<div class="empty">Nu ai angajați. Deschide panoul <b>Angajați</b> (H) pentru a angaja.</div>`;

    return employees.map(emp => {
      const role = EMPLOYEE_ROLE_BY_ID[emp.roleId];
      if (!role) return '';
      const compatVehicles = _compatVehiclesForEmployee(emp);
      const compatAtts = emp.assignedVehicleId ? _compatAttachmentsForVehicleAndEmployee(emp.assignedVehicleId, emp) : [];
      const contracts = _availableContracts();
      const isBusy = emp.status === EMPLOYEE_STATUS.WORKING;
      const isAssigned = emp.status === EMPLOYEE_STATUS.ASSIGNED;

      let assignSection = '';
      if (isBusy) {
        assignSection = `<div style="color:#f0d0a8">🚧 În misiune</div>`;
      } else {
        assignSection = `
          <div class="row-flex">
            <label style="min-width:80px">Vehicul:</label>
            <select data-action="assign-vehicle" data-emp="${emp.id}">
              <option value="">— alege —</option>
              ${compatVehicles.map(vId => {
                const v = VEHICLE_BY_ID[vId];
                const sel = emp.assignedVehicleId === vId ? 'selected' : '';
                return `<option value="${vId}" ${sel}>${v.name}</option>`;
              }).join('')}
            </select>
            ${emp.assignedVehicleId ? `
              <label style="min-width:80px">Atașament:</label>
              <select data-action="assign-attachment" data-emp="${emp.id}">
                <option value="">— fără —</option>
                ${compatAtts.map(aId => {
                  const a = ATTACHMENT_BY_ID[aId];
                  const sel = emp.assignedAttachmentId === aId ? 'selected' : '';
                  return `<option value="${aId}" ${sel}>${a.name}</option>`;
                }).join('')}
              </select>
              <button class="btn danger" data-action="unassign" data-emp="${emp.id}">Dezasignează</button>
            ` : ''}
          </div>
        `;
      }

      let missionSection = '';
      if (isAssigned && contracts.length) {
        missionSection = `
          <div class="row-flex" style="margin-top:10px">
            <label style="min-width:80px">Contract:</label>
            <select data-role="contract-select" data-emp="${emp.id}">
              <option value="">— alege contract —</option>
              ${contracts.map(c => `<option value="${c.id}">${c.title || c.id} (${c.baseReward?.coins || 0}$)</option>`).join('')}
            </select>
            <button class="btn success" data-action="start-mission" data-emp="${emp.id}">🚀 ÎNCEPE MISIUNE</button>
          </div>
        `;
      } else if (isAssigned) {
        missionSection = `<div style="color:#aab; margin-top:10px">Nu sunt contracte disponibile.</div>`;
      }

      return `
        <div class="card">
          <div class="row-flex">
            <div style="font-size:24px">${role.icon}</div>
            <div style="flex:1">
              <div><b>${emp.name}</b> · Level ${emp.level} · ${role.name}</div>
              <div style="font-size:12px;color:#aab">Status: ${emp.status}</div>
            </div>
          </div>
          <div style="margin-top:10px">${assignSection}</div>
          ${missionSection}
        </div>
      `;
    }).join('');
  }

  function renderActive() {
    const ops = fleetSystem.getActiveOperations();
    if (!ops.length) return `<div class="empty">Nu sunt misiuni active.</div>`;

    return ops.map(op => {
      const emp = employeeStore.getById(op.employeeId);
      const vConfig = VEHICLE_BY_ID[op.vehicleId];
      const contract = contractStore.state.contracts[op.contractId];
      const remainingMs = Math.max(0, (op.estimatedDurationSec - op.elapsedSec) * 1000);
      const pct = (op.progress * 100).toFixed(1);
      return `
        <div class="card">
          <div class="row-flex">
            <div style="flex:1">
              <div><b>${contract?.title || op.contractId}</b></div>
              <div style="font-size:12px;color:#aab">${emp?.name || '?'} · ${vConfig?.name || '?'}</div>
            </div>
            <button class="btn danger" data-action="cancel-op" data-op="${op.id}">Anulează</button>
          </div>
          <div class="progress"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div style="font-size:12px;color:#aab">
            ${pct}% · rămas ${formatMs(remainingMs)} · reward: ${op.expectedReward?.coins || 0}$
          </div>
        </div>
      `;
    }).join('');
  }

  function renderHistory() {
    const ids = fleetStore.state.completedOperationIds;
    if (!ids.length) return `<div class="empty">Nu există istoric.</div>`;

    return ids.map(id => {
      const op = fleetStore.getById(id);
      if (!op) return '';
      const emp = employeeStore.getById(op.employeeId);
      const vConfig = VEHICLE_BY_ID[op.vehicleId];
      const contract = contractStore.state.contracts[op.contractId];
      return `
        <div class="card">
          <div class="row-flex">
            <div style="flex:1">
              <div><b>${contract?.title || op.contractId}</b> ${statusBadgeOp(op.status)}</div>
              <div style="font-size:12px;color:#aab">${emp?.name || '?'} · ${vConfig?.name || '?'}</div>
              ${op.rating != null ? `<div>${starsHtml(op.rating)}</div>` : ''}
            </div>
            <div style="text-align:right">
              <div style="color:#a7e9b2; font-weight:600">${op.actualReward?.coins || 0}$</div>
              <div style="font-size:11px;color:#aab">${formatMs(op.estimatedDurationSec * 1000)}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderTabContent() {
    if (activeTab === 'assignments') return renderAssignments();
    if (activeTab === 'active') return renderActive();
    if (activeTab === 'history') return renderHistory();
    return '';
  }

  function render() {
    if (!root) return;
    const stats = fleetSystem.getStatistics();
    root.innerHTML = `
      <div class="panel">
        <button class="close-x" data-action="close">×</button>
        <h2>🚛 Fleet Management · ${stats.completed}/${stats.total} misiuni</h2>
        <div class="tabs">
          <button class="tab ${activeTab === 'assignments' ? 'active' : ''}" data-tab="assignments">Assignments</button>
          <button class="tab ${activeTab === 'active' ? 'active' : ''}" data-tab="active">Operațiuni Active (${fleetSystem.getActiveOperations().length})</button>
          <button class="tab ${activeTab === 'history' ? 'active' : ''}" data-tab="history">Istoric (${fleetStore.state.completedOperationIds.length})</button>
        </div>
        <div class="tab-content">${renderTabContent()}</div>
      </div>
    `;
    root.querySelectorAll('.tab').forEach(b => {
      b.addEventListener('click', () => { activeTab = b.dataset.tab; render(); });
    });
    root.querySelectorAll('[data-action]').forEach(el => {
      el.addEventListener('click', (e) => e.stopPropagation());
    });
    // change handlers pt select-uri (assign vehicle / attachment)
    root.querySelectorAll('select[data-action]').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const action = sel.dataset.action;
        const empId = sel.dataset.emp;
        const emp = employeeStore.getById(empId);
        if (!emp) return;
        if (action === 'assign-vehicle') {
          if (sel.value) fleetSystem.assign(empId, sel.value, null);
          else fleetSystem.unassign(empId);
        } else if (action === 'assign-attachment') {
          if (!emp.assignedVehicleId) return;
          fleetSystem.assign(empId, emp.assignedVehicleId, sel.value || null);
        }
      });
    });
    root.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const a = btn.dataset.action;
        const empId = btn.dataset.emp;
        const opId = btn.dataset.op;
        if (a === 'close') close();
        else if (a === 'unassign') fleetSystem.unassign(empId);
        else if (a === 'cancel-op') fleetSystem.cancelOperation(opId);
        else if (a === 'start-mission') {
          const sel = root.querySelector(`select[data-role="contract-select"][data-emp="${empId}"]`);
          const cid = sel ? sel.value : null;
          if (!cid) { alert('Alege un contract'); return; }
          const r = fleetSystem.createOperation(empId, cid);
          if (!r.ok) alert('Nu se poate porni: ' + r.reason);
        }
      });
    });
  }

  function open() {
    if (!companySystem || !companySystem.isCreated()) { alert('Creează o companie mai întâi.'); return; }
    if (employeeStore.count() === 0) { alert('Angajează minim un angajat (tastă H).'); return; }
    build();
    render();
    root.classList.add('visible');
    if (gameState && gameState.setScreen) gameState.setScreen(SCREENS.SETTINGS_OPEN);
    // Live tick pt progress bars (500ms)
    if (liveTimer) clearInterval(liveTimer);
    liveTimer = setInterval(() => { if (isVisible() && activeTab === 'active') render(); }, 500);
  }

  function close() {
    if (root) root.classList.remove('visible');
    if (gameState && gameState.setScreen) gameState.setScreen(SCREENS.PLAYING);
    if (liveTimer) { clearInterval(liveTimer); liveTimer = null; }
  }

  function toggle() { if (isVisible()) close(); else open(); }

  return { open, close, toggle, isVisible };
}
