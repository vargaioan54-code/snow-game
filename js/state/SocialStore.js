// Etapa 13 — SocialStore reactive + persist snow-game:social-v1
// State: profile (proprii settings), friends, requests, blocked, activity feed, invites
// Toate features "online" sunt BLOCKED sync-real fără backend, dar state local funcțional.

import {
  ACTIVITY_MAX_ENTRIES,
  ACTIVITY_RETENTION_MS,
  SEARCH_HISTORY_MAX,
  BACKEND_STATUS,
  VISIBILITY,
  FRIEND_STATUS,
  REQUEST_DIRECTION,
  INVITE_STATUS
} from '../config/social.js';

const DEFAULT_STATE = () => ({
  profile: {
    displayName: '',
    avatar: null,
    visibility: VISIBILITY.EVERYONE,
    activityVisibility: VISIBILITY.EVERYONE,
    allowFriendRequests: true,
    allowInvites: true,
    presenceVisibility: VISIBILITY.FRIENDS
  },
  friends: [],
  friendRequests: [],
  blockedPlayers: [],
  activityFeed: [],
  invites: [],
  unreadCounts: {
    friendRequests: 0,
    invites: 0,
    activity: 0
  },
  searchHistory: [],
  backendStatus: BACKEND_STATUS.NONE,
  lastSyncedAt: null
});

function uid(prefix = 'act') {
  return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

export function createSocialStore() {
  let state = DEFAULT_STATE();
  const anyListeners = new Set();
  const keyListeners = new Map();

  function notify(changed) {
    for (const l of anyListeners) { try { l(state, changed); } catch(e){ console.error('[SocialStore listener]', e); } }
    for (const k of changed) {
      const set = keyListeners.get(k);
      if (set) for (const l of set) { try { l(state[k], state); } catch(e){ console.error('[SocialStore key listener]', e); } }
    }
  }

  return {
    get state() { return state; },

    on(cb) { anyListeners.add(cb); return () => anyListeners.delete(cb); },
    onKey(key, cb) {
      if (!keyListeners.has(key)) keyListeners.set(key, new Set());
      keyListeners.get(key).add(cb);
      return () => keyListeners.get(key).delete(cb);
    },

    set(patch) {
      const changed = [];
      for (const k in patch) {
        state[k] = patch[k];
        changed.push(k);
      }
      if (changed.length) notify(changed);
    },

    setProfile(patch) {
      state.profile = { ...state.profile, ...patch };
      notify(['profile']);
    },

    // Friends
    addFriend(playerId, name, meta = {}) {
      if (state.friends.some(f => f.playerId === playerId)) return false;
      state.friends.push({
        playerId,
        name,
        level: meta.level || 1,
        company: meta.company || null,
        addedAt: Date.now(),
        lastSeenAt: meta.lastSeenAt || null
      });
      notify(['friends']);
      return true;
    },
    removeFriend(playerId) {
      const idx = state.friends.findIndex(f => f.playerId === playerId);
      if (idx < 0) return false;
      state.friends.splice(idx, 1);
      notify(['friends']);
      return true;
    },
    isFriend(playerId) {
      return state.friends.some(f => f.playerId === playerId);
    },

    // Requests
    addRequest(playerId, name, direction) {
      const id = uid('req');
      state.friendRequests.push({
        id, playerId, name, direction,
        status: FRIEND_STATUS.PENDING,
        createdAt: Date.now()
      });
      if (direction === REQUEST_DIRECTION.RECEIVED) {
        state.unreadCounts.friendRequests++;
      }
      notify(['friendRequests', 'unreadCounts']);
      return id;
    },
    getRequest(requestId) {
      return state.friendRequests.find(r => r.id === requestId) || null;
    },
    removeRequest(requestId) {
      const idx = state.friendRequests.findIndex(r => r.id === requestId);
      if (idx < 0) return false;
      state.friendRequests.splice(idx, 1);
      notify(['friendRequests']);
      return true;
    },
    updateRequestStatus(requestId, status) {
      const r = state.friendRequests.find(x => x.id === requestId);
      if (!r) return false;
      r.status = status;
      notify(['friendRequests']);
      return true;
    },
    hasPendingRequestTo(playerId) {
      return state.friendRequests.some(r =>
        r.playerId === playerId &&
        r.direction === REQUEST_DIRECTION.SENT &&
        r.status === FRIEND_STATUS.PENDING);
    },
    hasPendingRequestFrom(playerId) {
      return state.friendRequests.some(r =>
        r.playerId === playerId &&
        r.direction === REQUEST_DIRECTION.RECEIVED &&
        r.status === FRIEND_STATUS.PENDING);
    },

    // Blocked
    isBlocked(playerId) {
      return state.blockedPlayers.some(b => b.playerId === playerId);
    },
    addBlocked(playerId, name) {
      if (state.blockedPlayers.some(b => b.playerId === playerId)) return false;
      state.blockedPlayers.push({ playerId, name, blockedAt: Date.now() });
      notify(['blockedPlayers']);
      return true;
    },
    removeBlocked(playerId) {
      const idx = state.blockedPlayers.findIndex(b => b.playerId === playerId);
      if (idx < 0) return false;
      state.blockedPlayers.splice(idx, 1);
      notify(['blockedPlayers']);
      return true;
    },

    // Activity feed
    addActivity(type, payload = {}, visibility = VISIBILITY.EVERYONE) {
      const entry = {
        id: uid('act'),
        type,
        payload,
        visibility,
        timestamp: Date.now()
      };
      state.activityFeed.unshift(entry);
      // Auto-prune: 100 entries max
      if (state.activityFeed.length > ACTIVITY_MAX_ENTRIES) {
        state.activityFeed = state.activityFeed.slice(0, ACTIVITY_MAX_ENTRIES);
      }
      state.unreadCounts.activity++;
      notify(['activityFeed', 'unreadCounts']);
      return entry.id;
    },
    pruneOldActivities() {
      const now = Date.now();
      const before = state.activityFeed.length;
      state.activityFeed = state.activityFeed.filter(a => (now - (a.timestamp || 0)) < ACTIVITY_RETENTION_MS);
      if (state.activityFeed.length !== before) notify(['activityFeed']);
    },

    // Invites
    addInvite(inv) {
      state.invites.push({
        id: uid('inv'),
        status: INVITE_STATUS.PENDING,
        createdAt: Date.now(),
        ...inv
      });
      if (inv.direction === REQUEST_DIRECTION.RECEIVED) {
        state.unreadCounts.invites++;
      }
      notify(['invites', 'unreadCounts']);
    },
    updateInviteStatus(inviteId, status) {
      const inv = state.invites.find(i => i.id === inviteId);
      if (!inv) return false;
      inv.status = status;
      notify(['invites']);
      return true;
    },
    removeInvite(inviteId) {
      const idx = state.invites.findIndex(i => i.id === inviteId);
      if (idx < 0) return false;
      state.invites.splice(idx, 1);
      notify(['invites']);
      return true;
    },

    // Notifications
    markRead(category) {
      if (category in state.unreadCounts) {
        state.unreadCounts[category] = 0;
        notify(['unreadCounts']);
      }
    },
    unreadTotal() {
      return state.unreadCounts.friendRequests + state.unreadCounts.invites + state.unreadCounts.activity;
    },

    // Search history
    addSearchQuery(query) {
      const q = String(query || '').trim();
      if (!q) return;
      state.searchHistory = state.searchHistory.filter(x => x !== q);
      state.searchHistory.unshift(q);
      if (state.searchHistory.length > SEARCH_HISTORY_MAX) {
        state.searchHistory = state.searchHistory.slice(0, SEARCH_HISTORY_MAX);
      }
      notify(['searchHistory']);
    },

    // Serialize / Hydrate
    serialize() {
      return JSON.parse(JSON.stringify(state));
    },
    hydrate(data) {
      if (!data || typeof data !== 'object') return;
      const clean = DEFAULT_STATE();

      // profile
      if (data.profile && typeof data.profile === 'object') {
        clean.profile = { ...clean.profile, ...data.profile };
        if (typeof clean.profile.displayName !== 'string') clean.profile.displayName = '';
        for (const k of ['visibility', 'activityVisibility', 'presenceVisibility']) {
          if (!Object.values(VISIBILITY).includes(clean.profile[k])) clean.profile[k] = VISIBILITY.EVERYONE;
        }
      }

      // friends
      if (Array.isArray(data.friends)) {
        const seen = new Set();
        clean.friends = data.friends.filter(f => {
          if (!f || typeof f.playerId !== 'string' || !f.playerId) return false;
          if (seen.has(f.playerId)) return false;
          seen.add(f.playerId);
          return true;
        }).map(f => ({
          playerId: f.playerId,
          name: String(f.name || 'Unknown'),
          level: Math.max(0, Number(f.level) || 1),
          company: f.company ? String(f.company) : null,
          addedAt: Number(f.addedAt) || Date.now(),
          lastSeenAt: f.lastSeenAt ? Number(f.lastSeenAt) : null
        }));
      }

      // requests
      if (Array.isArray(data.friendRequests)) {
        const seen = new Set();
        clean.friendRequests = data.friendRequests.filter(r => {
          if (!r || typeof r.id !== 'string' || !r.playerId) return false;
          if (seen.has(r.id)) return false;
          seen.add(r.id);
          return Object.values(FRIEND_STATUS).includes(r.status);
        });
      }

      // blocked
      if (Array.isArray(data.blockedPlayers)) {
        const seen = new Set();
        clean.blockedPlayers = data.blockedPlayers.filter(b => {
          if (!b || typeof b.playerId !== 'string') return false;
          if (seen.has(b.playerId)) return false;
          seen.add(b.playerId);
          return true;
        });
      }

      // activity feed — drop expired + clamp
      if (Array.isArray(data.activityFeed)) {
        const now = Date.now();
        clean.activityFeed = data.activityFeed
          .filter(a => a && typeof a.type === 'string' && a.timestamp && (now - a.timestamp < ACTIVITY_RETENTION_MS))
          .slice(0, ACTIVITY_MAX_ENTRIES);
      }

      // invites
      if (Array.isArray(data.invites)) {
        clean.invites = data.invites.filter(i => i && typeof i.id === 'string' && i.type);
      }

      // unread counts
      if (data.unreadCounts && typeof data.unreadCounts === 'object') {
        for (const k of ['friendRequests', 'invites', 'activity']) {
          const n = Number(data.unreadCounts[k]);
          clean.unreadCounts[k] = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
        }
      }

      // search history
      if (Array.isArray(data.searchHistory)) {
        clean.searchHistory = data.searchHistory
          .filter(q => typeof q === 'string' && q.trim())
          .slice(0, SEARCH_HISTORY_MAX);
      }

      // backend
      if (Object.values(BACKEND_STATUS).includes(data.backendStatus)) {
        clean.backendStatus = data.backendStatus;
      }

      if (typeof data.lastSyncedAt === 'number' && data.lastSyncedAt > 0) {
        clean.lastSyncedAt = data.lastSyncedAt;
      }

      state = clean;
      notify(Object.keys(state));
    },

    reset() {
      state = DEFAULT_STATE();
      notify(Object.keys(state));
    }
  };
}
