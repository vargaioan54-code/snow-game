// EmployeeSystem — orchestreaza hiring, firing, XP, level up, salariile.
// Toate mutatiile trec prin EmployeeStore.

import {
  EMPLOYEE_ROLES,
  EMPLOYEE_ROLE_BY_ID,
  EMPLOYEE_ROLE_LIST,
  EMPLOYEE_STATUS,
  employeeXpForLevel,
  employeeStatsAtLevel,
  randomEmployeeName,
  pickRandomRoleId,
  makeEmployeeId,
  makeCandidateId
} from '../config/employees.js';

const CANDIDATE_COUNT = 5;
const SALARY_INTERVAL_DAYS = 7;

// Max employees pe baza companyStore.upgrades.contract_capacity level
function maxEmployeesForCapacity(capacityLevel) {
  if (!capacityLevel || capacityLevel <= 0) return 1;
  if (capacityLevel === 1) return 2;
  if (capacityLevel === 2) return 4;
  return 6;
}

export function createEmployeeSystem(deps) {
  const {
    employeeStore, companyStore, companySystem,
    transactionLog, audio, haptics, timeSystem
  } = deps || {};

  function tx(entry) { if (transactionLog) transactionLog.log(entry); }
  function banner(txt) {
    if (deps && typeof deps.banner === 'function') deps.banner(txt);
  }

  function refreshCandidates() {
    const list = [];
    for (let i = 0; i < CANDIDATE_COUNT; i++) {
      const roleId = pickRandomRoleId();
      const role = EMPLOYEE_ROLE_BY_ID[roleId];
      list.push({
        candidateId: makeCandidateId(),
        roleId,
        name: randomEmployeeName(),
        level: 1,
        hiringCost: role.hiringCost,
        baseSalary: role.baseSalary,
        icon: role.icon
      });
    }
    employeeStore.setCandidates(list);
    return list;
  }

  function getMaxEmployees() {
    if (!companyStore) return 1;
    const capLevel = companyStore.state?.upgrades?.contract_capacity || 0;
    return maxEmployeesForCapacity(capLevel);
  }

  function count() { return employeeStore.count(); }

  function hire(candidateId) {
    const candidate = employeeStore.state.availableCandidates.find(c => c.candidateId === candidateId);
    if (!candidate) return { ok: false, reason: 'candidate_not_found' };
    const role = EMPLOYEE_ROLE_BY_ID[candidate.roleId];
    if (!role) return { ok: false, reason: 'invalid_role' };
    if (employeeStore.count() >= getMaxEmployees()) {
      return { ok: false, reason: 'max_employees', max: getMaxEmployees() };
    }
    // Cost din companyFunds
    if (!companySystem || !companySystem.isCreated()) return { ok: false, reason: 'no_company' };
    const spent = companySystem.spendExpense(candidate.hiringCost, { source: 'employee_hire', roleId: candidate.roleId, name: candidate.name });
    if (!spent || !spent.ok) {
      return { ok: false, reason: 'insufficient_funds', cost: candidate.hiringCost };
    }

    // Create instance
    const num = employeeStore.state.nextEmployeeNumber || 1;
    const id = makeEmployeeId(num);
    const now = Date.now();
    const instance = employeeStore._defaultInstance({
      id,
      roleId: candidate.roleId,
      name: candidate.name,
      hiredAt: now
    });
    employeeStore.addEmployee(instance);
    employeeStore.removeCandidate(candidateId);

    tx({
      type: 'EMPLOYEE_HIRE',
      currency: 'coins',
      amount: candidate.hiringCost,
      balanceAfter: companyStore.state.funds,
      meta: { employeeId: id, roleId: candidate.roleId, name: candidate.name }
    });

    if (audio && audio.pickupBig) audio.pickupBig();
    if (haptics && haptics.success) haptics.success();
    banner('👷 Angajat: ' + candidate.name);
    return { ok: true, employeeId: id };
  }

  function fire(employeeId) {
    const emp = employeeStore.getById(employeeId);
    if (!emp) return { ok: false, reason: 'not_found' };
    if (emp.status !== EMPLOYEE_STATUS.AVAILABLE) {
      return { ok: false, reason: 'not_available', status: emp.status };
    }
    employeeStore.removeEmployee(employeeId);
    tx({
      type: 'EMPLOYEE_FIRE',
      currency: 'none',
      amount: 0,
      balanceAfter: 0,
      meta: { employeeId, roleId: emp.roleId, name: emp.name }
    });
    if (audio && audio.error) audio.error();
    banner('👋 Concediat: ' + emp.name);
    return { ok: true };
  }

  function grantXP(employeeId, amount) {
    const emp = employeeStore.getById(employeeId);
    if (!emp || amount <= 0) return { ok: false };
    const role = EMPLOYEE_ROLE_BY_ID[emp.roleId];
    if (!role) return { ok: false, reason: 'invalid_role' };

    let xp = (emp.xp || 0) + amount;
    let level = emp.level || 1;
    const totalXpEarned = (emp.totalXpEarned || 0) + amount;
    let leveledUp = 0;
    while (level < role.maxLevel && xp >= employeeXpForLevel(level + 1)) {
      xp -= employeeXpForLevel(level + 1);
      level++;
      leveledUp++;
    }
    employeeStore.updateEmployee(employeeId, { xp, level, totalXpEarned });

    tx({
      type: 'EMPLOYEE_LEVEL_UP',
      currency: 'xp',
      amount,
      balanceAfter: xp,
      meta: { employeeId, level, leveledUp }
    });

    if (leveledUp > 0) {
      banner('⭐ ' + emp.name + ' — Level ' + level + '!');
      if (audio && audio.levelUp) audio.levelUp();
      if (haptics && haptics.success) haptics.success();
    }
    return { ok: true, level, xp, leveledUp };
  }

  function updateStatus(employeeId, status) {
    const emp = employeeStore.getById(employeeId);
    if (!emp) return { ok: false };
    if (!Object.values(EMPLOYEE_STATUS).includes(status)) return { ok: false, reason: 'invalid_status' };
    employeeStore.updateEmployee(employeeId, { status });
    return { ok: true };
  }

  function payWeeklySalaries() {
    const total = employeeStore.totalWeeklySalary();
    if (total <= 0) return { ok: true, paid: 0 };
    if (!companySystem || !companySystem.isCreated()) return { ok: false, reason: 'no_company' };
    const spent = companySystem.spendExpense(total, { source: 'weekly_salaries', count: employeeStore.count() });
    if (!spent || !spent.ok) {
      banner('⚠ Fonduri insuficiente pentru salarii (' + total + ')');
      return { ok: false, reason: 'insufficient_funds', total };
    }
    employeeStore.set({ lastSalaryPaidAt: Date.now() });
    tx({
      type: 'EMPLOYEE_SALARY',
      currency: 'coins',
      amount: total,
      balanceAfter: companyStore.state.funds,
      meta: { count: employeeStore.count(), day: (timeSystem?.getCurrentDay?.() || 0) }
    });
    banner('💰 Salarii plătite: ' + total);
    return { ok: true, paid: total };
  }

  // dayIndex-based tick: paying weekly from time system
  let lastCheckedDay = null;
  function checkWeeklySalaries(currentDay) {
    if (typeof currentDay !== 'number') return;
    if (lastCheckedDay === null) { lastCheckedDay = currentDay; return; }
    if (currentDay - lastCheckedDay >= SALARY_INTERVAL_DAYS) {
      payWeeklySalaries();
      lastCheckedDay = currentDay;
    }
  }

  return {
    refreshCandidates, hire, fire, grantXP, updateStatus,
    payWeeklySalaries, checkWeeklySalaries,
    getMaxEmployees, count,
    getStats(id) { return employeeStore.computeCurrentStats(id); }
  };
}
