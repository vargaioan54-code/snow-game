// ETAPA 19 — Content Manifest
// Snapshot al continutului livrat in build. Nu contine referinte runtime.
// Folosit pentru compare cu remote (viitor) si diagnosticare update.

export const CONTENT_MANIFEST = Object.freeze({
  version:   '1.0.0',
  timestamp: '2026-09-29',
  counts: Object.freeze({
    tools:         6,   // wooden_shovel, snow_shovel, ice_pick, ice_axe, drill, extractor
    vehicles:      5,   // atv_plow, truck_plow, loader_wheel, tractor_utility, snowblower
    attachments:   4,
    regions:       4,
    locations:     10,
    contractTemplates: 10 + 6,  // base + endgame
    missionsDaily:  5,
    missionsWeekly: 3,
    achievements:   20,
    events:         5,
    seasons:        4,
    weatherStates:  7,
    snowTypes:      8,
    companyLevels:  10,
    contractTiers:  5 + 1,     // T1-T5 + endgame
    prestigeRanks:  11         // 0..10
  })
});

export function getManifestString() {
  const c = CONTENT_MANIFEST.counts;
  return `content ${CONTENT_MANIFEST.version} — tools:${c.tools} vehicles:${c.vehicles} regions:${c.regions} contracts:${c.contractTemplates} missions:${c.missionsDaily + c.missionsWeekly} events:${c.events} seasons:${c.seasons} achievements:${c.achievements} prestige:${c.prestigeRanks}`;
}
