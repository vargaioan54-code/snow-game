// Verifica daca un item este deblocat.
// Extensii: unelte (Etapa 1), contracte (Etapa 3), regions/locations (Etapa 4).

import { TOOL_BY_ID } from '../config/tools.js';

export function createUnlockSystem() {
  function isToolUnlocked(id, playerState) {
    const t = TOOL_BY_ID[id];
    if (!t) return false;
    const req = t.unlockLevel || 1;
    return (playerState.level || 1) >= req;
  }

  function isUnlocked(id, playerState) {
    if (TOOL_BY_ID[id]) return isToolUnlocked(id, playerState);
    return Array.isArray(playerState.unlocks) && playerState.unlocks.includes(id);
  }

  function getLockReason(id, playerState) {
    const t = TOOL_BY_ID[id];
    if (t) {
      const req = t.unlockLevel || 1;
      if (playerState.level < req) return { reason: 'level', requiredLevel: req };
    }
    return null;
  }

  // === Etapa 3 — Contracts ===
  function isContractUnlocked(contract, playerState) {
    if (!contract) return false;
    const level = playerState.level || 1;
    const owned = playerState.owned || [];
    if ((contract.unlockLevel || 1) > level) return false;
    if (contract.requiredTool && !owned.includes(contract.requiredTool)) return false;
    return true;
  }

  function getContractLockReason(contract, playerState) {
    if (!contract) return null;
    const level = playerState.level || 1;
    const owned = playerState.owned || [];
    if ((contract.unlockLevel || 1) > level) {
      return { reason: 'level', requiredLevel: contract.unlockLevel };
    }
    if (contract.requiredTool && !owned.includes(contract.requiredTool)) {
      return { reason: 'tool', requiredTool: contract.requiredTool };
    }
    return null;
  }

  // === Etapa 4 — Regions & Locations ===
  function _statsContractsCompleted(playerState) {
    return (playerState.stats && playerState.stats.contractsCompleted) || 0;
  }

  function isRegionUnlocked(region, playerState) {
    if (!region) return false;
    const level = playerState.level || 1;
    if ((region.unlockLevel || 1) > level) return false;
    const req = region.requiredCompletedContracts || 0;
    if (req > _statsContractsCompleted(playerState)) return false;
    return true;
  }
  function getRegionLockReason(region, playerState) {
    if (!region) return null;
    const level = playerState.level || 1;
    if ((region.unlockLevel || 1) > level) {
      return { reason: 'level', requiredLevel: region.unlockLevel };
    }
    const req = region.requiredCompletedContracts || 0;
    const cur = _statsContractsCompleted(playerState);
    if (req > cur) {
      return { reason: 'contracts', requiredContracts: req, currentContracts: cur };
    }
    return null;
  }

  function isLocationUnlocked(location, playerState) {
    if (!location) return false;
    const level = playerState.level || 1;
    if ((location.unlockLevel || 1) > level) return false;
    const req = location.requiredCompletedContracts || 0;
    if (req > _statsContractsCompleted(playerState)) return false;
    return true;
  }
  function getLocationLockReason(location, playerState) {
    if (!location) return null;
    const level = playerState.level || 1;
    if ((location.unlockLevel || 1) > level) {
      return { reason: 'level', requiredLevel: location.unlockLevel };
    }
    const req = location.requiredCompletedContracts || 0;
    const cur = _statsContractsCompleted(playerState);
    if (req > cur) {
      return { reason: 'contracts', requiredContracts: req, currentContracts: cur };
    }
    return null;
  }

  // === Etapa 8 — Company / Business ===
  function isCompanyLevelSufficient(requiredLevel, companyState) {
    const cur = (companyState && companyState.level) || 1;
    return cur >= (requiredLevel || 1);
  }

  function isTierUnlocked(tierId, companyState, playerState) {
    if (!companyState) return tierId === 'tier_1';
    if (Array.isArray(companyState.unlockedTiers) && companyState.unlockedTiers.includes(tierId)) return true;
    return false;
  }

  function getTierLockReason(tier, companyState, playerState) {
    if (!tier) return { reason: 'unknown' };
    const cLvl = (companyState && companyState.level) || 1;
    const rep = (playerState && playerState.reputation) || 0;
    if (cLvl < (tier.requiredLevel || 1)) {
      return { reason: 'company_level', required: tier.requiredLevel, current: cLvl };
    }
    if (rep < (tier.requiredReputation || 0)) {
      return { reason: 'reputation', required: tier.requiredReputation, current: rep };
    }
    return null;
  }

  return {
    isUnlocked, isToolUnlocked, getLockReason,
    isContractUnlocked, getContractLockReason,
    isRegionUnlocked, getRegionLockReason,
    isLocationUnlocked, getLocationLockReason,
    isCompanyLevelSufficient, isTierUnlocked, getTierLockReason
  };
}
