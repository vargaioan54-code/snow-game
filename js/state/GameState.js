// Starea de nivel superior a jocului (nu persista).
// screen: playing | paused | shop_open | settings_open | loading |
//         level_complete | contracts_open | results_open | world_open

export const SCREENS = Object.freeze({
  PLAYING:        'playing',
  PAUSED:         'paused',
  SHOP_OPEN:      'shop_open',
  SETTINGS_OPEN:  'settings_open',
  LOADING:        'loading',
  LEVEL_COMPLETE: 'level_complete',
  CONTRACTS_OPEN: 'contracts_open',
  RESULTS_OPEN:   'results_open',
  WORLD_OPEN:     'world_open',
  GARAGE_OPEN:    'garage_open',
  COMPANY_OPEN:   'company_open',
  MULTIPLAYER_LOBBY_OPEN: 'multiplayer_lobby_open',
  PRESTIGE_OPEN: 'prestige_open'
});

export function createGameState() {
  const state = { screen: SCREENS.PLAYING, prevScreen: null };
  const anyListeners = new Set();
  const keyListeners = new Map();

  function notify(changedKeys) {
    for (const l of anyListeners) l(state, changedKeys);
    for (const k of changedKeys) {
      const set = keyListeners.get(k);
      if (set) for (const l of set) l(state[k], state);
    }
  }

  return {
    get state() { return state; },
    get screen() { return state.screen; },

    setScreen(next) {
      if (state.screen === next) return;
      state.prevScreen = state.screen;
      state.screen = next;
      notify(['screen']);
    },

    isPlaying() { return state.screen === SCREENS.PLAYING; },
    isPaused()  { return state.screen === SCREENS.PAUSED; },
    isModalOpen() {
      return state.screen === SCREENS.SHOP_OPEN ||
             state.screen === SCREENS.SETTINGS_OPEN ||
             state.screen === SCREENS.CONTRACTS_OPEN ||
             state.screen === SCREENS.RESULTS_OPEN ||
             state.screen === SCREENS.WORLD_OPEN ||
             state.screen === SCREENS.GARAGE_OPEN ||
             state.screen === SCREENS.COMPANY_OPEN ||
             state.screen === SCREENS.MULTIPLAYER_LOBBY_OPEN ||
             state.screen === SCREENS.PRESTIGE_OPEN;
    },

    on(cb) { anyListeners.add(cb); return () => anyListeners.delete(cb); },
    onKey(key, cb) {
      if (!keyListeners.has(key)) keyListeners.set(key, new Set());
      keyListeners.get(key).add(cb);
      return () => keyListeners.get(key).delete(cb);
    }
  };
}
