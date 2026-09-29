// EmployeeStore — reactiv, persist snow-game:employees-v1
// Instantele angajatilor + candidati generati pentru hiring market.

import {
  EMPLOYEE_ROLE_BY_ID,
  EMPLOYEE_STATUS,
  employeeStatsAtLevel
} from '../config/employees.js';

const DEFAULTS = () => ({
  employees: {},                // { [id]: instance }
  nextEmployeeNumber: 1,
  lastSalaryPaidAt: null,       // ms epoch
  availableCandidates: []       // list of Candidate objects
});

function shallowEqual(a, b) { return a === b; }

function defaultInstance(overrides = {}) {
  return {
    id: overrides.id || 'emp_x',
    roleId: overrides.roleId || 'general_worker',
    name: overrides.name || 'Angajat',
    level: 1,
    xp: 0,
    totalXpEarned: 0,
    status: EMPLOYEE_STATUS.AVAILABLE,
    hiredAt: Date.now(),
    completedJobs: 0,
    failedJobs: 0,
    totalEarnings: 0,
    averageRating: 0,
    ratingSum: 0,
    ratingCount: 0,
    assignedVehicleId: null,
    assignedAttachmentId: null,
    assignedContractId: null,
    currentOperationId: null,
    ...overrides
  };
}

const STATUSES = new Set(Object.values(EMPLOYEE_STATUS));
function normalizeStatus(s) { return STATUSES.has(s) ? s : EMPLOYEE_STATUS.AVAILABLE; }

export function createEmployeeStore() {
  const state = DEFAULTS();
  const anyListeners = new Set();
  const keyListeners = new Map();

  function notify(changedKeys) {
    for (const l of anyListeners) l(state, changedKeys);
    for (const k of changedKeys) {
      const s = keyListeners.get(k);
      if (s) for (const l of s) l(state[k], state);
    }
  }

  function set(patch) {
    const changed = [];
    for (const k in patch) {
      if (!shallowEqual(state[k], patch[k])) {
        state[k] = patch[k];
        changed.push(k);
      }
    }
    if (changed.length) notify(changed);
  }

  function addEmployee(inst) {
    const newEmployees = { ...state.employees, [inst.id]: inst };
    state.employees = newEmployees;
    state.nextEmployeeNumber = (state.nextEmployeeNumber || 1) + 1;
    notify(['employees', 'nextEmployeeNumber']);
  }

  function removeEmployee(id) {
    if (!state.employees[id]) return false;
    const newEmp = { ...state.employees };
    delete newEmp[id];
    state.employees = newEmp;
    notify(['employees']);
    return true;
  }

  function updateEmployee(id, patch) {
    const cur = state.employees[id];
    if (!cur) return false;
    const merged = { ...cur, ...patch };
    const newEmp = { ...state.employees, [id]: merged };
    state.employees = newEmp;
    notify(['employees']);
    return true;
  }

  function setCandidates(list) {
    state.availableCandidates = Array.isArray(list) ? list.slice() : [];
    notify(['availableCandidates']);
  }

  function removeCandidate(candId) {
    const newList = state.availableCandidates.filter(c => c.candidateId !== candId);
    if (newList.length !== state.availableCandidates.length) {
      state.availableCandidates = newList;
      notify(['availableCandidates']);
      return true;
    }
    return false;
  }

  // === Helpers ===
  function getAll() { return Object.values(state.employees); }
  function getById(id) { return state.employees[id] || null; }
  function getByStatus(status) { return getAll().filter(e => e.status === status); }
  function count() { return Object.keys(state.employees).length; }
  function activeCount() {
    return getAll().filter(e => e.status === EMPLOYEE_STATUS.ASSIGNED || e.status === EMPLOYEE_STATUS.WORKING).length;
  }
  function computeCurrentStats(id) {
    const e = state.employees[id];
    if (!e) return null;
    const role = EMPLOYEE_ROLE_BY_ID[e.roleId];
    if (!role) return null;
    return employeeStatsAtLevel(role, e.level || 1);
  }
  function totalWeeklySalary() {
    let total = 0;
    for (const e of getAll()) {
      const stats = computeCurrentStats(e.id);
      if (stats) total += stats.salary;
    }
    return total;
  }

  // === Serialize / Hydrate ===
  function serialize() {
    return {
      employees: { ...state.employees },
      nextEmployeeNumber: state.nextEmployeeNumber,
      lastSalaryPaidAt: state.lastSalaryPaidAt,
      availableCandidates: state.availableCandidates.slice()
    };
  }

  function sanitize(data) {
    const clean = DEFAULTS();
    if (data && typeof data === 'object') {
      // employees
      if (data.employees && typeof data.employees === 'object') {
        for (const id in data.employees) {
          const raw = data.employees[id];
          if (!raw || typeof raw !== 'object') continue;
          if (typeof raw.roleId !== 'string' || !EMPLOYEE_ROLE_BY_ID[raw.roleId]) continue;
          if (typeof raw.id !== 'string') continue;
          const role = EMPLOYEE_ROLE_BY_ID[raw.roleId];
          const level = Math.max(1, Math.min(role.maxLevel, Number(raw.level) || 1));
          const inst = defaultInstance({
            id: raw.id,
            roleId: raw.roleId,
            name: typeof raw.name === 'string' ? raw.name.slice(0, 60) : 'Angajat',
            level,
            xp: Math.max(0, Number(raw.xp) || 0),
            totalXpEarned: Math.max(0, Number(raw.totalXpEarned) || 0),
            status: normalizeStatus(raw.status),
            hiredAt: Number(raw.hiredAt) > 0 ? Number(raw.hiredAt) : Date.now(),
            completedJobs: Math.max(0, Math.floor(Number(raw.completedJobs) || 0)),
            failedJobs: Math.max(0, Math.floor(Number(raw.failedJobs) || 0)),
            totalEarnings: Math.max(0, Number(raw.totalEarnings) || 0),
            ratingSum: Math.max(0, Number(raw.ratingSum) || 0),
            ratingCount: Math.max(0, Number(raw.ratingCount) || 0),
            averageRating: Math.max(0, Number(raw.averageRating) || 0),
            assignedVehicleId: typeof raw.assignedVehicleId === 'string' ? raw.assignedVehicleId : null,
            assignedAttachmentId: typeof raw.assignedAttachmentId === 'string' ? raw.assignedAttachmentId : null,
            assignedContractId: typeof raw.assignedContractId === 'string' ? raw.assignedContractId : null,
            currentOperationId: typeof raw.currentOperationId === 'string' ? raw.currentOperationId : null
          });
          clean.employees[inst.id] = inst;
        }
      }
      const nen = Number(data.nextEmployeeNumber);
      clean.nextEmployeeNumber = Number.isFinite(nen) && nen > 0 ? Math.floor(nen) : 1;
      const lsp = Number(data.lastSalaryPaidAt);
      clean.lastSalaryPaidAt = Number.isFinite(lsp) && lsp > 0 ? lsp : null;
      if (Array.isArray(data.availableCandidates)) {
        clean.availableCandidates = data.availableCandidates
          .filter(c => c && typeof c === 'object' && typeof c.candidateId === 'string' &&
                        typeof c.roleId === 'string' && EMPLOYEE_ROLE_BY_ID[c.roleId])
          .slice(0, 10);
      }
    }
    return clean;
  }

  function hydrate(data) {
    const clean = sanitize(data);
    Object.assign(state, clean);
    notify(['employees', 'nextEmployeeNumber', 'lastSalaryPaidAt', 'availableCandidates']);
    return true;
  }

  function reset() {
    Object.assign(state, DEFAULTS());
    notify(['employees', 'nextEmployeeNumber', 'lastSalaryPaidAt', 'availableCandidates']);
  }

  return {
    get state() { return state; },
    set,
    on(cb) { anyListeners.add(cb); return () => anyListeners.delete(cb); },
    onKey(key, cb) {
      if (!keyListeners.has(key)) keyListeners.set(key, new Set());
      keyListeners.get(key).add(cb);
      return () => keyListeners.get(key).delete(cb);
    },
    addEmployee, removeEmployee, updateEmployee,
    setCandidates, removeCandidate,
    getAll, getById, getByStatus, count, activeCount,
    computeCurrentStats, totalWeeklySalary,
    serialize, hydrate, reset,
    _defaultInstance: defaultInstance
  };
}
