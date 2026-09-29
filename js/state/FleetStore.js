// FleetStore — reactiv, persist snow-game:fleet-v1
// Fleet Operations = background missions (employee + vehicle + attachment + contract).

export const OP_STATUS = Object.freeze({
  PENDING:   'PENDING',
  WORKING:   'WORKING',
  COMPLETED: 'COMPLETED',
  FAILED:    'FAILED',
  CANCELLED: 'CANCELLED'
});

const DEFAULTS = () => ({
  operations: {},                 // { [opId]: FleetOperation }
  completedOperationIds: [],      // history (max 30)
  totalOperationsStarted: 0,
  totalOperationsCompleted: 0,
  totalOperationsFailed: 0,
  totalOperationsCancelled: 0,
  nextOperationNumber: 1
});

const OP_STATUSES = new Set(Object.values(OP_STATUS));
function normalizeStatus(s) { return OP_STATUSES.has(s) ? s : OP_STATUS.PENDING; }

function shallowEqual(a, b) { return a === b; }

export function createFleetStore() {
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

  function addOperation(op) {
    const newOps = { ...state.operations, [op.id]: op };
    state.operations = newOps;
    state.totalOperationsStarted++;
    state.nextOperationNumber = (state.nextOperationNumber || 1) + 1;
    notify(['operations', 'totalOperationsStarted', 'nextOperationNumber']);
  }

  function updateOperation(id, patch) {
    const cur = state.operations[id];
    if (!cur) return false;
    const merged = { ...cur, ...patch };
    const newOps = { ...state.operations, [id]: merged };
    state.operations = newOps;
    notify(['operations']);
    return true;
  }

  function archiveOperation(id) {
    if (!state.operations[id]) return false;
    const op = state.operations[id];
    const newHistory = [id, ...state.completedOperationIds.filter(x => x !== id)].slice(0, 30);
    const newOps = { ...state.operations };
    // păstrăm operation-ul in .operations pentru history lookup (nu-l stergem)
    // dar il marchez arhivat
    state.completedOperationIds = newHistory;
    if (op.status === OP_STATUS.COMPLETED) state.totalOperationsCompleted++;
    else if (op.status === OP_STATUS.FAILED) state.totalOperationsFailed++;
    else if (op.status === OP_STATUS.CANCELLED) state.totalOperationsCancelled++;
    notify(['completedOperationIds', 'totalOperationsCompleted', 'totalOperationsFailed', 'totalOperationsCancelled']);
    return true;
  }

  function getActive() {
    return Object.values(state.operations).filter(op => op.status === OP_STATUS.WORKING || op.status === OP_STATUS.PENDING);
  }
  function getHistory() {
    return state.completedOperationIds.map(id => state.operations[id]).filter(Boolean);
  }
  function getById(id) { return state.operations[id] || null; }

  function serialize() {
    return {
      operations: { ...state.operations },
      completedOperationIds: state.completedOperationIds.slice(),
      totalOperationsStarted: state.totalOperationsStarted,
      totalOperationsCompleted: state.totalOperationsCompleted,
      totalOperationsFailed: state.totalOperationsFailed,
      totalOperationsCancelled: state.totalOperationsCancelled,
      nextOperationNumber: state.nextOperationNumber
    };
  }

  function sanitize(data) {
    const clean = DEFAULTS();
    if (data && typeof data === 'object') {
      if (data.operations && typeof data.operations === 'object') {
        for (const id in data.operations) {
          const raw = data.operations[id];
          if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string') continue;
          const op = {
            id: raw.id,
            status: normalizeStatus(raw.status),
            employeeId: typeof raw.employeeId === 'string' ? raw.employeeId : null,
            vehicleId: typeof raw.vehicleId === 'string' ? raw.vehicleId : null,
            attachmentId: typeof raw.attachmentId === 'string' ? raw.attachmentId : null,
            contractId: typeof raw.contractId === 'string' ? raw.contractId : null,
            startedAt: Number(raw.startedAt) > 0 ? Number(raw.startedAt) : 0,
            estimatedDurationSec: Math.max(1, Number(raw.estimatedDurationSec) || 60),
            elapsedSec: Math.max(0, Number(raw.elapsedSec) || 0),
            progress: Math.max(0, Math.min(1, Number(raw.progress) || 0)),
            expectedReward: (raw.expectedReward && typeof raw.expectedReward === 'object') ? raw.expectedReward : null,
            actualReward: (raw.actualReward && typeof raw.actualReward === 'object') ? raw.actualReward : null,
            performance: raw.performance == null ? null : Math.max(0, Math.min(1, Number(raw.performance) || 0)),
            rating: raw.rating == null ? null : Math.max(0, Math.min(5, Math.floor(Number(raw.rating) || 0))),
            result: typeof raw.result === 'string' ? raw.result : null,
            completedAt: Number(raw.completedAt) > 0 ? Number(raw.completedAt) : null
          };
          clean.operations[op.id] = op;
        }
      }
      if (Array.isArray(data.completedOperationIds)) {
        clean.completedOperationIds = data.completedOperationIds
          .filter(x => typeof x === 'string' && clean.operations[x])
          .slice(0, 30);
      }
      clean.totalOperationsStarted = Math.max(0, Math.floor(Number(data.totalOperationsStarted) || 0));
      clean.totalOperationsCompleted = Math.max(0, Math.floor(Number(data.totalOperationsCompleted) || 0));
      clean.totalOperationsFailed = Math.max(0, Math.floor(Number(data.totalOperationsFailed) || 0));
      clean.totalOperationsCancelled = Math.max(0, Math.floor(Number(data.totalOperationsCancelled) || 0));
      const nen = Number(data.nextOperationNumber);
      clean.nextOperationNumber = Number.isFinite(nen) && nen > 0 ? Math.floor(nen) : 1;
    }
    return clean;
  }

  function hydrate(data) {
    const clean = sanitize(data);
    Object.assign(state, clean);
    notify(['operations', 'completedOperationIds', 'totalOperationsStarted', 'totalOperationsCompleted', 'totalOperationsFailed', 'totalOperationsCancelled', 'nextOperationNumber']);
    return true;
  }

  function reset() {
    Object.assign(state, DEFAULTS());
    notify(['operations', 'completedOperationIds', 'totalOperationsStarted', 'totalOperationsCompleted', 'totalOperationsFailed', 'totalOperationsCancelled', 'nextOperationNumber']);
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
    addOperation, updateOperation, archiveOperation,
    getActive, getHistory, getById,
    serialize, hydrate, reset,
    OP_STATUS
  };
}

export function makeOperationId(n) {
  return 'op_' + String(n).padStart(4, '0') + '_' + Math.random().toString(36).slice(2, 6);
}
