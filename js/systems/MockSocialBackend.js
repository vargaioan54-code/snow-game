// Etapa 13 — MockSocialBackend (dev-only).
// Marchează clar toate răspunsurile ca MOCK. Nu folosi în production.
// Simulează delay pentru UX realistic + failuri opționale.

import { PRESENCE_STATUS } from '../config/social.js';

const MOCK_PLAYERS = [
  { playerId: 'mock_alex_001',   name: 'Alex Popescu',       level: 12, company: 'Ice Corp',       reputation: 340, presence: PRESENCE_STATUS.ONLINE,   achievements: 8, contractsCompleted: 45 },
  { playerId: 'mock_ioana_002',  name: 'Ioana Marin',        level: 8,  company: 'Snow Masters',   reputation: 180, presence: PRESENCE_STATUS.IN_GAME,  achievements: 5, contractsCompleted: 22 },
  { playerId: 'mock_dan_003',    name: 'Dan Radu',           level: 15, company: 'Winter Kings',   reputation: 520, presence: PRESENCE_STATUS.AWAY,     achievements: 11, contractsCompleted: 78 },
  { playerId: 'mock_maria_004',  name: 'Maria Stan',         level: 5,  company: null,             reputation: 45,  presence: PRESENCE_STATUS.OFFLINE,  achievements: 2, contractsCompleted: 8 },
  { playerId: 'mock_vlad_005',   name: 'Vlad Nistor',        level: 20, company: 'Elite Snow',     reputation: 890, presence: PRESENCE_STATUS.IN_GAME,  achievements: 15, contractsCompleted: 156 },
  { playerId: 'mock_elena_006',  name: 'Elena Constantin',   level: 3,  company: null,             reputation: 20,  presence: PRESENCE_STATUS.OFFLINE,  achievements: 1, contractsCompleted: 3 },
  { playerId: 'mock_horia_007',  name: 'Horia Dumitru',      level: 18, company: 'Mountain Pros',  reputation: 700, presence: PRESENCE_STATUS.ONLINE,   achievements: 13, contractsCompleted: 110 },
  { playerId: 'mock_cris_008',   name: 'Cristian Ionescu',   level: 9,  company: 'Snow Masters',   reputation: 220, presence: PRESENCE_STATUS.OFFLINE,  achievements: 6, contractsCompleted: 32 }
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

export function createMockSocialBackend({ delay = 300, failRate = 0 } = {}) {
  async function maybeDelay() {
    if (delay > 0) await sleep(delay);
    if (failRate > 0 && Math.random() < failRate) {
      throw new Error('mock_random_fail');
    }
  }

  return {
    isMock: true,
    getPlatform: () => 'mock',

    async searchPlayers(query) {
      await maybeDelay();
      const q = String(query || '').toLowerCase().trim();
      if (!q) return { ok: true, results: [], mock: true };
      const results = MOCK_PLAYERS.filter(p =>
        p.name.toLowerCase().includes(q) || p.playerId.toLowerCase().includes(q)
      ).map(p => ({ ...p, mock: true }));
      return { ok: true, results, mock: true };
    },

    async getProfile(playerId) {
      await maybeDelay();
      const p = MOCK_PLAYERS.find(x => x.playerId === playerId);
      if (!p) return { ok: false, reason: 'player_not_found', mock: true };
      return { ok: true, profile: { ...p, mock: true }, mock: true };
    },

    async sendFriendRequest(playerId) {
      await maybeDelay();
      const p = MOCK_PLAYERS.find(x => x.playerId === playerId);
      if (!p) return { ok: false, reason: 'player_not_found', mock: true };
      return { ok: true, requestId: 'mock_req_' + Date.now(), mock: true };
    },

    async acceptFriendRequest(requestId) {
      await maybeDelay();
      return { ok: true, mock: true };
    },

    async declineFriendRequest(requestId) {
      await maybeDelay();
      return { ok: true, mock: true };
    },

    async cancelFriendRequest(requestId) {
      await maybeDelay();
      return { ok: true, mock: true };
    },

    async removeFriend(playerId) {
      await maybeDelay();
      return { ok: true, mock: true };
    },

    async blockPlayer(playerId) {
      await maybeDelay();
      return { ok: true, mock: true };
    },

    async unblockPlayer(playerId) {
      await maybeDelay();
      return { ok: true, mock: true };
    },

    async getPresence(playerId) {
      await maybeDelay();
      const p = MOCK_PLAYERS.find(x => x.playerId === playerId);
      if (!p) return { ok: false, reason: 'player_not_found', mock: true };
      return { ok: true, presence: p.presence, lastSeenAt: Date.now() - Math.floor(Math.random() * 3600000), mock: true };
    },

    async sendInvite(playerId, type, payload = {}) {
      await maybeDelay();
      return { ok: true, inviteId: 'mock_inv_' + Date.now(), mock: true };
    },

    async getFriends() {
      await maybeDelay();
      // Dev tool: returnează empty; adaugă manual via dbg
      return { ok: true, friends: [], mock: true };
    },

    // Dev helper — returnează un mock player pentru dbg tool
    _getMockPlayers() {
      return [...MOCK_PLAYERS];
    },
    _findMockPlayer(nameOrId) {
      const q = String(nameOrId || '').toLowerCase();
      return MOCK_PLAYERS.find(p =>
        p.playerId.toLowerCase() === q ||
        p.name.toLowerCase() === q ||
        p.name.toLowerCase().startsWith(q)
      ) || null;
    }
  };
}
