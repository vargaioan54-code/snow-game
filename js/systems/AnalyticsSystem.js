// ETAPA 19 — Local Analytics buffer (ring 500 events, persist local).
// Real analytics provider (Firebase / GA / Mixpanel / Amplitude) = BLOCKED — flush() e no-op.
// Nu contine PII: doar sessionId + version + platform + event metadata.

const STORAGE_KEY = 'snow-game:analytics-v1';
const MAX_EVENTS = 500;

export const ANALYTICS_EVENTS = Object.freeze({
  APP_OPEN:                       'APP_OPEN',
  SESSION_START:                  'SESSION_START',
  SESSION_END:                    'SESSION_END',
  GAME_START:                     'GAME_START',
  GAME_COMPLETE:                  'GAME_COMPLETE',
  SNOW_CLEARED:                   'SNOW_CLEARED',
  CONTRACT_STARTED:               'CONTRACT_STARTED',
  CONTRACT_COMPLETED:             'CONTRACT_COMPLETED',
  CONTRACT_FAILED:                'CONTRACT_FAILED',
  TOOL_PURCHASED:                 'TOOL_PURCHASED',
  TOOL_UPGRADED:                  'TOOL_UPGRADED',
  VEHICLE_PURCHASED:              'VEHICLE_PURCHASED',
  VEHICLE_UPGRADED:               'VEHICLE_UPGRADED',
  GARAGE_OPENED:                  'GARAGE_OPENED',
  MISSION_STARTED:                'MISSION_STARTED',
  MISSION_COMPLETED:              'MISSION_COMPLETED',
  EVENT_STARTED:                  'EVENT_STARTED',
  EVENT_COMPLETED:                'EVENT_COMPLETED',
  SEASON_STARTED:                 'SEASON_STARTED',
  SEASON_COMPLETED:               'SEASON_COMPLETED',
  IAP_STARTED:                    'IAP_STARTED',
  IAP_COMPLETED:                  'IAP_COMPLETED',
  IAP_FAILED:                     'IAP_FAILED',
  MULTIPLAYER_SESSION_STARTED:    'MULTIPLAYER_SESSION_STARTED',
  MULTIPLAYER_SESSION_COMPLETED:  'MULTIPLAYER_SESSION_COMPLETED',
  PRESTIGE_STARTED:               'PRESTIGE_STARTED',
  PRESTIGE_COMPLETED:             'PRESTIGE_COMPLETED',
  ENDGAME_UNLOCKED:               'ENDGAME_UNLOCKED',
  LEVEL_UP:                       'LEVEL_UP',
  ERROR:                          'ERROR'
});

function _genSessionId() {
  const rnd = Math.random().toString(36).slice(2, 10);
  return `s_${Date.now().toString(36)}_${rnd}`;
}

function _detectPlatform() {
  try {
    const ua = navigator.userAgent || '';
    if (/Android/i.test(ua)) return 'android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    if (/Windows/i.test(ua)) return 'windows';
    if (/Macintosh|Mac OS/i.test(ua)) return 'mac';
    if (/Linux/i.test(ua)) return 'linux';
    return 'unknown';
  } catch { return 'unknown'; }
}

export function createAnalyticsSystem({ envConfig, versionSnapshot, logger, eventBus } = {}) {
  const enabled = envConfig ? envConfig.analyticsEnabled : true;
  const sessionId = _genSessionId();
  const platform = _detectPlatform();
  const sessionStart = Date.now();
  const events = [];
  const typeCounts = {};

  function _persist() {
    if (!enabled) return;
    try {
      const payload = { sessionId, savedAt: Date.now(), events: events.slice(-MAX_EVENTS) };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {}
  }

  function _load() {
    if (!enabled) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.events)) {
        // Load doar pentru history/debug — nu retrimitem
        for (const ev of parsed.events) {
          if (ev && ev.type) {
            events.push(ev);
            typeCounts[ev.type] = (typeCounts[ev.type] || 0) + 1;
          }
        }
        while (events.length > MAX_EVENTS) events.shift();
      }
    } catch {}
  }

  function track(eventName, params = {}) {
    if (!enabled) return;
    if (!eventName || typeof eventName !== 'string') return;
    const safeParams = {};
    try {
      for (const [k, v] of Object.entries(params || {})) {
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') safeParams[k] = v;
      }
    } catch {}
    const record = {
      ts: Date.now(),
      type: eventName,
      sessionId,
      platform,
      gameVersion: versionSnapshot ? versionSnapshot.game : null,
      params: safeParams
    };
    events.push(record);
    if (events.length > MAX_EVENTS) events.shift();
    typeCounts[eventName] = (typeCounts[eventName] || 0) + 1;
    _persist();
  }

  function flush() {
    // BLOCKED — real analytics provider necesita backend HTTP endpoint.
    logger && logger.debug('analytics.flush() called — no-op (no backend)');
    return { sent: 0, buffered: events.length };
  }

  function getEvents(filter) {
    if (!filter) return events.slice();
    if (typeof filter === 'string') return events.filter(e => e.type === filter);
    if (typeof filter === 'function') return events.filter(filter);
    return events.slice();
  }

  function getStats() {
    const uptime = Date.now() - sessionStart;
    return {
      sessionId,
      platform,
      enabled,
      sessionUptimeMs: uptime,
      totalEvents: events.length,
      typeCounts: { ...typeCounts }
    };
  }

  function _wireEventBus() {
    if (!eventBus || !enabled) return;
    try {
      eventBus.on('snow.cleared',       (p) => track(ANALYTICS_EVENTS.SNOW_CLEARED, { amount: p.amount }));
      eventBus.on('contract.completed', (p) => track(ANALYTICS_EVENTS.CONTRACT_COMPLETED, { id: p.id, tier: p.tier, coins: p.coins }));
      eventBus.on('contract.failed',    (p) => track(ANALYTICS_EVENTS.CONTRACT_FAILED, { id: p.id, reason: p.reason }));
      eventBus.on('vehicle.purchased',  (p) => track(ANALYTICS_EVENTS.VEHICLE_PURCHASED, { id: p.id }));
      eventBus.on('tool.upgraded',      (p) => track(ANALYTICS_EVENTS.TOOL_UPGRADED, { id: p.id, level: p.level }));
      eventBus.on('vehicle.upgraded',   (p) => track(ANALYTICS_EVENTS.VEHICLE_UPGRADED, { id: p.id }));
      eventBus.on('player.level.up',    (p) => track(ANALYTICS_EVENTS.LEVEL_UP, { level: p.level, entity: 'player' }));
      eventBus.on('company.level.up',   (p) => track(ANALYTICS_EVENTS.LEVEL_UP, { level: p.level, entity: 'company' }));
      eventBus.on('region.unlocked',    (p) => track('REGION_UNLOCKED', { id: p.id }));
      eventBus.on('prestige.up',        (p) => track(ANALYTICS_EVENTS.PRESTIGE_COMPLETED, { newRank: p.newRank }));
      eventBus.on('endgame.unlocked',   ()  => track(ANALYTICS_EVENTS.ENDGAME_UNLOCKED));
      eventBus.on('extreme.contract.completed', (p) => track('EXTREME_CONTRACT_COMPLETED', { id: p.id }));
    } catch (e) { logger && logger.warn('analytics eventbus wire fail', e); }
  }

  function init() {
    _load();
    _wireEventBus();
    track(ANALYTICS_EVENTS.APP_OPEN, { platform });
    track(ANALYTICS_EVENTS.SESSION_START, {});
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        const dur = Date.now() - sessionStart;
        track(ANALYTICS_EVENTS.SESSION_END, { durationMs: dur });
      });
    }
  }

  function clear() { events.length = 0; try { localStorage.removeItem(STORAGE_KEY); } catch {} }

  return { init, track, flush, getEvents, getStats, clear, sessionId, platform };
}
