// FleetSystem — orchestreaza assignment employee↔vehicle↔attachment↔contract + background operations.
// Reutilizeaza VehicleStore, ContractSystem, CompanySystem. Nu duplica ownership.

import { EMPLOYEE_ROLE_BY_ID, EMPLOYEE_STATUS } from '../config/employees.js';
import { VEHICLE_BY_ID } from '../config/vehicles.js';
import { ATTACHMENT_BY_ID } from '../config/attachments.js';
import { CONTRACT_BY_ID } from '../config/contracts.js';
import { CONTRACT_STATUS } from '../config/contractStatus.js';
import { OP_STATUS, makeOperationId } from '../state/FleetStore.js';

const UPDATE_THROTTLE_MS = 500;

export function createFleetSystem(deps) {
  const {
    fleetStore, employeeStore, employeeSystem, vehicleStore,
    contractStore, contractSystem, companySystem, playerStore,
    environment, weatherSystem, transactionLog, audio, haptics, timeSystem
  } = deps || {};

  function tx(e) { if (transactionLog) transactionLog.log(e); }
  function banner(t) { if (deps && typeof deps.banner === 'function') deps.banner(t); }

  let _lastUpdate = 0;

  // === helpers ===

  function _getEmployee(id) { return employeeStore.getById(id); }
  function _getVehicleConfig(id) { return VEHICLE_BY_ID[id]; }
  function _getAttachmentConfig(id) { return id ? ATTACHMENT_BY_ID[id] : null; }
  function _getContract(id) { return contractStore.state.contracts[id]; }

  function _validateAssignment(employeeId, vehicleId, attachmentId) {
    const emp = _getEmployee(employeeId);
    if (!emp) return { ok: false, reason: 'employee_not_found' };
    if (emp.status !== EMPLOYEE_STATUS.AVAILABLE && emp.status !== EMPLOYEE_STATUS.ASSIGNED) {
      return { ok: false, reason: 'employee_busy', status: emp.status };
    }
    const role = EMPLOYEE_ROLE_BY_ID[emp.roleId];
    if (!role) return { ok: false, reason: 'invalid_role' };

    const vConfig = _getVehicleConfig(vehicleId);
    if (!vConfig) return { ok: false, reason: 'invalid_vehicle' };
    if (!vehicleStore.isOwned(vehicleId)) return { ok: false, reason: 'vehicle_not_owned' };
    const vInst = vehicleStore.getInstance(vehicleId);
    if (vInst?.inUseByFleet) return { ok: false, reason: 'vehicle_in_use_by_fleet' };
    if (vehicleStore.state.isPlayerInVehicle && vehicleStore.state.activeVehicleId === vehicleId) {
      return { ok: false, reason: 'vehicle_in_use_by_player' };
    }
    // Role vehicle-category compat
    if (!role.allowedVehicleCategories.includes(vConfig.category)) {
      return { ok: false, reason: 'employee_incompatible_vehicle', role: role.id, category: vConfig.category };
    }
    // Attachment compat
    if (attachmentId) {
      const aConfig = _getAttachmentConfig(attachmentId);
      if (!aConfig) return { ok: false, reason: 'invalid_attachment' };
      if (!vehicleStore.isAttachmentOwned(attachmentId)) return { ok: false, reason: 'attachment_not_owned' };
      if (!vConfig.compatibleAttachments.includes(attachmentId)) return { ok: false, reason: 'attachment_incompatible_vehicle' };
      if (!role.allowedAttachmentTypes.includes(aConfig.type)) return { ok: false, reason: 'attachment_incompatible_role' };
    }
    return { ok: true };
  }

  function assign(employeeId, vehicleId, attachmentId = null) {
    const chk = _validateAssignment(employeeId, vehicleId, attachmentId);
    if (!chk.ok) return chk;

    employeeStore.updateEmployee(employeeId, {
      status: EMPLOYEE_STATUS.ASSIGNED,
      assignedVehicleId: vehicleId,
      assignedAttachmentId: attachmentId || null,
      assignedContractId: null,
      currentOperationId: null
    });
    return { ok: true };
  }

  function unassign(employeeId) {
    const emp = _getEmployee(employeeId);
    if (!emp) return { ok: false, reason: 'employee_not_found' };
    if (emp.status === EMPLOYEE_STATUS.WORKING) {
      return { ok: false, reason: 'employee_working' };
    }
    employeeStore.updateEmployee(employeeId, {
      status: EMPLOYEE_STATUS.AVAILABLE,
      assignedVehicleId: null,
      assignedAttachmentId: null,
      assignedContractId: null,
      currentOperationId: null
    });
    return { ok: true };
  }

  // === Operation lifecycle ===

  function _projectDuration(role, empStats, vConfig, aConfig, contract) {
    const baseTime = (contract.timeLimit && contract.timeLimit > 0) ? contract.timeLimit : 120;
    const attachMult = aConfig ? (aConfig.powerMult || 1) : 1;
    const speedFactor = (empStats.speed || 1) * ((vConfig.maxSpeed || 8) / 8) * attachMult / 1.5;
    let weatherMod = 1;
    if (weatherSystem && typeof weatherSystem.getVisibility === 'function') {
      weatherMod = 1 + (1 - weatherSystem.getVisibility()) * 0.5;
    }
    const diffMod = (contract.difficultyMod || 1);
    return Math.max(30, Math.round(baseTime / Math.max(0.3, speedFactor) * weatherMod * diffMod));
  }

  function _projectReward(contract) {
    if (contractSystem && typeof contractSystem.computeReward === 'function') {
      return contractSystem.computeReward(contract, 4);
    }
    // Fallback: base reward × 4-star multiplier (~1.0)
    const base = contract.baseReward || { coins: 0, xp: 0, reputation: 0 };
    return { coins: base.coins, xp: base.xp, reputation: base.reputation };
  }

  function createOperation(employeeId, contractId) {
    const emp = _getEmployee(employeeId);
    if (!emp) return { ok: false, reason: 'employee_not_found' };
    if (emp.status !== EMPLOYEE_STATUS.ASSIGNED) {
      return { ok: false, reason: 'employee_not_assigned', status: emp.status };
    }
    if (!emp.assignedVehicleId) return { ok: false, reason: 'no_vehicle_assigned' };
    const vConfig = _getVehicleConfig(emp.assignedVehicleId);
    const vInst = vehicleStore.getInstance(emp.assignedVehicleId);
    if (!vConfig || !vInst) return { ok: false, reason: 'invalid_vehicle' };
    if (vInst.inUseByFleet) return { ok: false, reason: 'vehicle_in_use_by_fleet' };
    if (vInst.fuel < 5) return { ok: false, reason: 'vehicle_no_fuel' };
    if (vInst.durability < 15) return { ok: false, reason: 'vehicle_broken' };

    const contract = _getContract(contractId);
    if (!contract) return { ok: false, reason: 'contract_not_found' };
    if (contract.status !== CONTRACT_STATUS.AVAILABLE) {
      return { ok: false, reason: 'contract_not_available', status: contract.status };
    }
    // Company gate (tier, capacity)
    if (companySystem && companySystem.isCreated()) {
      const chk = companySystem.checkContractRequirements(contract, playerStore.state);
      if (!chk.ok) return { ok: false, reason: 'contract_requirements_unmet', details: chk.reasons };
    }

    const role = EMPLOYEE_ROLE_BY_ID[emp.roleId];
    const stats = employeeStore.computeCurrentStats(employeeId);
    const aConfig = _getAttachmentConfig(emp.assignedAttachmentId);
    const estimatedDurationSec = _projectDuration(role, stats, vConfig, aConfig, contract);
    const expectedReward = _projectReward(contract);

    // Mark vehicle in-use by fleet
    vehicleStore.updateInstance(emp.assignedVehicleId, { inUseByFleet: true });
    // Mark contract accepted (soft-lock)
    contractStore.updateContract(contractId, {
      status: CONTRACT_STATUS.ACCEPTED,
      acceptedAt: Date.now()
    });

    const opId = makeOperationId(fleetStore.state.nextOperationNumber);
    const now = Date.now();
    const op = {
      id: opId,
      status: OP_STATUS.WORKING,
      employeeId,
      vehicleId: emp.assignedVehicleId,
      attachmentId: emp.assignedAttachmentId || null,
      contractId,
      startedAt: now,
      estimatedDurationSec,
      elapsedSec: 0,
      progress: 0,
      expectedReward,
      actualReward: null,
      performance: null,
      rating: null,
      result: null,
      completedAt: null
    };
    fleetStore.addOperation(op);

    employeeStore.updateEmployee(employeeId, {
      status: EMPLOYEE_STATUS.WORKING,
      assignedContractId: contractId,
      currentOperationId: opId
    });

    tx({
      type: 'FLEET_OPERATION_START',
      currency: 'coins',
      amount: expectedReward.coins || 0,
      balanceAfter: 0,
      meta: { opId, employeeId, vehicleId: op.vehicleId, contractId, estimatedDurationSec }
    });
    if (audio && audio.contractAccept) audio.contractAccept();
    if (haptics && haptics.medium) haptics.medium();
    banner('🚛 Misiune pornită: ' + (contract.title || contractId));
    return { ok: true, opId, estimatedDurationSec };
  }

  function _completeOperation(opId) {
    const op = fleetStore.getById(opId);
    if (!op || op.status !== OP_STATUS.WORKING) return;

    const emp = _getEmployee(op.employeeId);
    const vConfig = _getVehicleConfig(op.vehicleId);
    const vInst = vehicleStore.getInstance(op.vehicleId);
    const contract = _getContract(op.contractId);

    const empStats = emp ? employeeStore.computeCurrentStats(op.employeeId) : null;
    const reliability = empStats?.reliability || 0.8;

    // Roll rating
    const roll = Math.random();
    const success = roll < (reliability + 0.15);
    let rating;
    if (success) {
      rating = 3;
      if (Math.random() < 0.55) rating++;
      if (Math.random() < 0.30) rating++;
    } else {
      rating = Math.random() < 0.5 ? 1 : 2;
    }
    rating = Math.max(1, Math.min(5, rating));
    const performance = rating / 5;

    // Actual reward = expected × performance (per stat)
    const exp = op.expectedReward || { coins: 0, xp: 0, reputation: 0 };
    const actualReward = {
      coins: Math.round((exp.coins || 0) * performance),
      xp: Math.round((exp.xp || 0) * performance),
      reputation: Math.round((exp.reputation || 0) * performance)
    };

    // Apply to contract (via ContractSystem.completeFromFleet)
    let contractResult = { ok: false };
    if (contractSystem && typeof contractSystem.completeFromFleet === 'function') {
      contractResult = contractSystem.completeFromFleet(op.contractId, rating, actualReward);
    }

    // Employee XP + stats
    if (emp && employeeSystem) {
      const role = EMPLOYEE_ROLE_BY_ID[emp.roleId];
      const empXpGain = Math.round((actualReward.xp || 20) * 0.5 * (role?.xpMultiplier || 1));
      employeeSystem.grantXP(op.employeeId, empXpGain);

      const newRatingSum = (emp.ratingSum || 0) + rating;
      const newRatingCount = (emp.ratingCount || 0) + 1;
      const patch = {
        status: EMPLOYEE_STATUS.AVAILABLE,
        currentOperationId: null,
        assignedContractId: null,
        completedJobs: (emp.completedJobs || 0) + (rating >= 3 ? 1 : 0),
        failedJobs: (emp.failedJobs || 0) + (rating < 3 ? 1 : 0),
        totalEarnings: (emp.totalEarnings || 0) + actualReward.coins,
        ratingSum: newRatingSum,
        ratingCount: newRatingCount,
        averageRating: newRatingSum / newRatingCount
      };
      // Pastreaza vehicul si attachment assignate pentru convenience
      employeeStore.updateEmployee(op.employeeId, patch);
    }

    // Vehicle wear
    if (vInst && vConfig) {
      const wearDur = 5 + Math.random() * 10;   // 5-15
      const wearFuel = 10 + Math.random() * 15; // 10-25
      const newDur = Math.max(0, (vInst.durability || 100) - wearDur);
      const newFuel = Math.max(0, (vInst.fuel || 100) - wearFuel);
      vehicleStore.updateInstance(op.vehicleId, {
        inUseByFleet: false,
        durability: newDur,
        fuel: newFuel
      });
    }

    // Op finalize
    fleetStore.updateOperation(opId, {
      status: OP_STATUS.COMPLETED,
      elapsedSec: op.estimatedDurationSec,
      progress: 1,
      actualReward,
      performance,
      rating,
      result: rating >= 3 ? 'success' : 'poor',
      completedAt: Date.now()
    });
    fleetStore.archiveOperation(opId);

    tx({
      type: 'FLEET_OPERATION_COMPLETE',
      currency: 'coins',
      amount: actualReward.coins,
      balanceAfter: 0,
      meta: { opId, rating, contractId: op.contractId }
    });
    if (audio && audio.contractComplete) audio.contractComplete();
    if (haptics && haptics.success) haptics.success();
    banner('✔ Misiune finalizată (' + rating + '⭐) — ' + actualReward.coins + ' monede');
  }

  function updateOperations(dt) {
    _lastUpdate += dt * 1000;
    if (_lastUpdate < UPDATE_THROTTLE_MS) return;
    const step = _lastUpdate / 1000;
    _lastUpdate = 0;

    const ops = Object.values(fleetStore.state.operations);
    for (const op of ops) {
      if (op.status !== OP_STATUS.WORKING) continue;
      const newElapsed = (op.elapsedSec || 0) + step;
      const progress = Math.min(1, newElapsed / op.estimatedDurationSec);
      if (progress >= 1) {
        _completeOperation(op.id);
      } else {
        fleetStore.updateOperation(op.id, { elapsedSec: newElapsed, progress });
      }
    }
  }

  function cancelOperation(opId) {
    const op = fleetStore.getById(opId);
    if (!op) return { ok: false, reason: 'not_found' };
    if (op.status !== OP_STATUS.WORKING && op.status !== OP_STATUS.PENDING) {
      return { ok: false, reason: 'not_active' };
    }

    // 50% refund din expected reward.coins → company funds
    const refund = Math.round(((op.expectedReward?.coins) || 0) * 0.5);
    if (refund > 0 && companySystem && typeof companySystem.earnRevenue === 'function') {
      companySystem.earnRevenue(refund, { source: 'fleet_cancel_refund', opId });
    }

    // Unlock resources
    vehicleStore.updateInstance(op.vehicleId, { inUseByFleet: false });
    const emp = _getEmployee(op.employeeId);
    if (emp) {
      employeeStore.updateEmployee(op.employeeId, {
        status: EMPLOYEE_STATUS.ASSIGNED,   // ramane ASSIGNED (vehiculul e inca alocat)
        currentOperationId: null,
        assignedContractId: null
      });
    }
    // Contract → back to AVAILABLE
    if (contractSystem && typeof contractSystem.reset === 'function') {
      contractSystem.reset(op.contractId);
    }

    fleetStore.updateOperation(opId, {
      status: OP_STATUS.CANCELLED,
      completedAt: Date.now(),
      result: 'cancelled'
    });
    fleetStore.archiveOperation(opId);

    tx({
      type: 'FLEET_OPERATION_CANCEL',
      currency: 'coins',
      amount: refund,
      balanceAfter: 0,
      meta: { opId, contractId: op.contractId }
    });
    banner('⚠ Misiune anulată');
    return { ok: true, refund };
  }

  function getActiveOperations() {
    return Object.values(fleetStore.state.operations).filter(o => o.status === OP_STATUS.WORKING);
  }

  function getStatistics() {
    let total = 0, completed = 0, failed = 0, cancelled = 0, ratingSum = 0, ratingCount = 0, totalRevenue = 0;
    for (const op of Object.values(fleetStore.state.operations)) {
      total++;
      if (op.status === OP_STATUS.COMPLETED) completed++;
      else if (op.status === OP_STATUS.FAILED) failed++;
      else if (op.status === OP_STATUS.CANCELLED) cancelled++;
      if (op.rating != null) { ratingSum += op.rating; ratingCount++; }
      totalRevenue += op.actualReward?.coins || 0;
    }
    return {
      total, completed, failed, cancelled,
      avgRating: ratingCount ? (ratingSum / ratingCount) : 0,
      totalRevenue
    };
  }

  // La boot: auto-complete operations care ar fi expirat in timp real (safety)
  function resumeOnBoot() {
    const now = Date.now();
    for (const op of Object.values(fleetStore.state.operations)) {
      if (op.status !== OP_STATUS.WORKING) continue;
      const finishesAt = (op.startedAt || 0) + (op.estimatedDurationSec || 60) * 1000;
      if (now >= finishesAt) {
        _completeOperation(op.id);
      }
    }
  }

  return {
    assign, unassign, createOperation, updateOperations, cancelOperation,
    getActiveOperations, getStatistics, resumeOnBoot,
    _completeOperation
  };
}
