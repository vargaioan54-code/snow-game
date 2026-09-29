// ETAPA 19 — Structured logger cu niveluri filtrate pe environment.
// Nu inlocuim console.log global — folosit doar in sistemele Etapa 19 noi.

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, off: 100 };

export function createLogger({ envConfig, tag = 'app', minLevel } = {}) {
  const verbose = envConfig && envConfig.verboseLogging;
  const cfgMin = minLevel ? LEVELS[minLevel] : (verbose ? LEVELS.debug : LEVELS.warn);

  function _emit(level, args) {
    if (LEVELS[level] < cfgMin) return;
    const fn = console[level] || console.log;
    try { fn.call(console, `[${tag}]`, ...args); } catch {}
  }

  return {
    debug: (...a) => _emit('debug', a),
    info:  (...a) => _emit('info', a),
    warn:  (...a) => _emit('warn', a),
    error: (...a) => _emit('error', a),
    child: (subTag) => createLogger({ envConfig, tag: `${tag}:${subTag}`, minLevel })
  };
}

export const LOG_LEVELS = Object.freeze(LEVELS);
