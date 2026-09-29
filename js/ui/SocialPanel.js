// Etapa 13 — SocialPanel modal cu 7 tab-uri.
// Rulează în mod DEV (mock backend). Warning permanent afișat.

import {
  VISIBILITY,
  REQUEST_DIRECTION,
  PRESENCE_STATUS,
  ACTIVITY_TYPES,
  INVITE_TYPES,
  BACKEND_STATUS,
  validateDisplayName,
  REASON_MESSAGES,
  ACTIVITY_MAX_ENTRIES
} from '../config/social.js';

const STYLE = `
#social-overlay {
  position: fixed; inset: 0; background: rgba(10,14,22,0.85);
  display: none; z-index: 60; font: 400 14px system-ui, sans-serif; color: #fff;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}
#social-overlay.visible { display: flex; align-items: center; justify-content: center; }
#social-overlay .panel {
  background: linear-gradient(180deg, #1c2434 0%, #131a26 100%);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 16px; padding: 0; width: min(920px, 96vw); max-height: 90vh;
  display: grid; grid-template-columns: 200px 1fr;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6); overflow: hidden;
}
#social-overlay .sidebar {
  background: rgba(0,0,0,0.25); padding: 16px 10px; border-right: 1px solid rgba(255,255,255,0.08);
  display: flex; flex-direction: column; gap: 4px;
}
#social-overlay .sidebar h3 {
  margin: 0 0 12px; font-size: 14px; font-weight: 700; letter-spacing: 0.5px;
  color: #8a94aa; text-transform: uppercase; padding: 0 8px;
}
#social-overlay .tab-btn {
  padding: 10px 12px; border: none; background: transparent; color: #ccc;
  text-align: left; cursor: pointer; border-radius: 8px; font: 500 13px system-ui;
  display: flex; align-items: center; gap: 8px; position: relative;
}
#social-overlay .tab-btn:hover { background: rgba(255,255,255,0.05); }
#social-overlay .tab-btn.active { background: #2a3244; color: #fff; }
#social-overlay .tab-btn .badge {
  margin-left: auto; background: #e04040; color: #fff; font-size: 11px;
  padding: 2px 6px; border-radius: 10px; font-weight: 700;
}
#social-overlay .content {
  padding: 18px 22px; overflow-y: auto; max-height: 90vh;
}
#social-overlay .content h2 {
  margin: 0 0 6px; font-size: 18px; font-weight: 700;
}
#social-overlay .dev-warning {
  background: rgba(224,64,64,0.12); border: 1px solid rgba(224,64,64,0.35);
  padding: 8px 10px; border-radius: 8px; font-size: 12px; color: #ffb0b0;
  margin-bottom: 14px;
}
#social-overlay .close-btn {
  position: absolute; top: 10px; right: 14px; background: transparent;
  border: none; color: #8a94aa; font-size: 22px; cursor: pointer;
}
#social-overlay .close-btn:hover { color: #fff; }

#social-overlay .card {
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px; padding: 12px; margin-bottom: 10px;
}
#social-overlay .card-row {
  display: flex; align-items: center; gap: 10px; padding: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
#social-overlay .card-row:last-child { border-bottom: none; }
#social-overlay .avatar {
  width: 42px; height: 42px; border-radius: 50%;
  background: linear-gradient(135deg, #3fd8ff, #6b7de0);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 16px;
}
#social-overlay .presence-dot {
  display: inline-block; width: 8px; height: 8px; border-radius: 50%;
  margin-right: 6px;
}
#social-overlay .presence-dot.online { background: #3ea862; }
#social-overlay .presence-dot.in_game { background: #3fd8ff; }
#social-overlay .presence-dot.away { background: #ffc043; }
#social-overlay .presence-dot.offline { background: #666; }
#social-overlay .presence-dot.unknown { background: #444; }

#social-overlay .btn {
  padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15);
  background: #2a3244; color: #fff; cursor: pointer; font: 600 12px system-ui;
}
#social-overlay .btn:hover { filter: brightness(1.2); }
#social-overlay .btn.primary { background: #3fd8ff; color: #0a0e18; border-color: #3fd8ff; }
#social-overlay .btn.danger { background: #7a2020; border-color: #a03030; }
#social-overlay .btn:disabled { opacity: 0.4; cursor: not-allowed; }
#social-overlay input[type=text] {
  padding: 8px 10px; background: #0f1520; border: 1px solid rgba(255,255,255,0.15);
  border-radius: 6px; color: #fff; font: 400 13px system-ui; width: 100%; box-sizing: border-box;
}
#social-overlay select {
  padding: 6px 8px; background: #0f1520; border: 1px solid rgba(255,255,255,0.15);
  border-radius: 6px; color: #fff;
}
#social-overlay .empty {
  padding: 20px; text-align: center; color: #666; font-style: italic;
}
#social-overlay .blocked-banner {
  background: rgba(255,192,64,0.12); border: 1px solid rgba(255,192,64,0.35);
  padding: 10px 12px; border-radius: 8px; color: #ffd88a; font-size: 12px; margin: 8px 0;
}
#social-overlay .stat-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px; margin-top: 10px;
}
#social-overlay .stat {
  background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px; text-align: center;
}
#social-overlay .stat-label { color: #8a94aa; font-size: 11px; text-transform: uppercase; }
#social-overlay .stat-value { font-size: 18px; font-weight: 700; margin-top: 4px; }
#social-overlay .activity-item {
  padding: 8px 10px; border-left: 3px solid #3fd8ff;
  background: rgba(255,255,255,0.02); margin-bottom: 6px; border-radius: 4px;
  display: flex; align-items: center; gap: 10px;
}
#social-overlay .activity-item .time { color: #666; font-size: 11px; margin-left: auto; }
#social-overlay .sub-tabs { display: flex; gap: 4px; margin-bottom: 10px; }
#social-overlay .sub-tabs button {
  padding: 6px 10px; background: transparent; border: 1px solid rgba(255,255,255,0.15);
  color: #ccc; border-radius: 6px; cursor: pointer;
}
#social-overlay .sub-tabs button.active { background: #2a3244; color: #fff; }

@media (max-width: 900px) {
  #social-overlay .panel { grid-template-columns: 1fr; max-height: 96vh; }
  #social-overlay .sidebar {
    flex-direction: row; overflow-x: auto; padding: 8px; gap: 4px;
    border-right: none; border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  #social-overlay .sidebar h3 { display: none; }
  #social-overlay .tab-btn { flex-shrink: 0; padding: 8px 10px; }
}
`;

const TABS = [
  { id: 'profile', label: '📇 Profil', unreadKey: null },
  { id: 'friends', label: '👥 Prieteni', unreadKey: null },
  { id: 'requests', label: '📨 Cereri', unreadKey: 'friendRequests' },
  { id: 'search', label: '🔎 Căutare', unreadKey: null },
  { id: 'activity', label: '📊 Activitate', unreadKey: 'activity' },
  { id: 'invites', label: '📬 Invitații', unreadKey: 'invites' },
  { id: 'company', label: '🏢 Companie', unreadKey: null }
];

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'acum';
  if (s < 3600) return Math.floor(s / 60) + ' min';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  return Math.floor(s / 86400) + ' zile';
}

function initial(name) {
  return String(name || '?').trim().charAt(0).toUpperCase();
}

function activityText(a) {
  const p = a.payload || {};
  switch (a.type) {
    case ACTIVITY_TYPES.CONTRACT_COMPLETED:
      return `📋 Contract finalizat${p.rating ? ' (' + '⭐'.repeat(Math.min(5, p.rating)) + ')' : ''}`;
    case ACTIVITY_TYPES.LEVEL_UP:
      return `⭐ Nivel ${p.newLevel} atins`;
    case ACTIVITY_TYPES.COMPANY_LEVEL_UP:
      return `🏢 Companie promovată la nivel ${p.newLevel}`;
    case ACTIVITY_TYPES.REGION_UNLOCKED:
      return `🌍 Regiune deblocată: ${p.regionId}`;
    case ACTIVITY_TYPES.VEHICLE_PURCHASED:
      return `🚛 Vehicul cumpărat: ${p.vehicleId}`;
    case ACTIVITY_TYPES.ACHIEVEMENT_UNLOCKED:
      return `🏆 Realizare: ${p.name || p.id || ''}`;
    case ACTIVITY_TYPES.EVENT_COMPLETED:
      return `🎉 Eveniment finalizat: ${p.name || p.id || ''}`;
    case ACTIVITY_TYPES.COMPANY_JOINED:
      return `👥 Alăturat companiei ${p.company || ''}`;
    case ACTIVITY_TYPES.MILESTONE:
      return `🎯 ${p.label || 'Milestone'}`;
    default:
      return a.type;
  }
}

export function createSocialPanel({ socialStore, socialService, companySystem, gameState, showBanner }) {
  let root = null;
  let activeTab = 'profile';
  let activeSubtab = 'received';
  let searchQuery = '';
  let searchResults = [];
  let searchLoading = false;
  let isVisible = false;

  function injectStyle() {
    if (document.getElementById('social-style')) return;
    const s = document.createElement('style');
    s.id = 'social-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function build() {
    if (root) return root;
    injectStyle();
    root = document.createElement('div');
    root.id = 'social-overlay';
    document.body.appendChild(root);
    root.addEventListener('click', (e) => {
      if (e.target === root) close();
    });
    return root;
  }

  function renderSidebar() {
    const unread = socialStore.state.unreadCounts;
    return `
      <div class="sidebar">
        <h3>Social</h3>
        ${TABS.map(t => {
          const count = t.unreadKey ? (unread[t.unreadKey] || 0) : 0;
          return `<button class="tab-btn ${activeTab === t.id ? 'active' : ''}" data-tab="${t.id}">
            <span>${t.label}</span>${count > 0 ? `<span class="badge">${count}</span>` : ''}
          </button>`;
        }).join('')}
      </div>
    `;
  }

  function renderProfile() {
    const p = socialService.getMyProfile();
    const prof = socialStore.state.profile;
    return `
      <h2>Profilul Meu</h2>
      <div class="card">
        <div style="display:flex; align-items:center; gap:14px;">
          <div class="avatar" style="width:60px; height:60px; font-size:22px;">${initial(p.name)}</div>
          <div style="flex:1;">
            <div style="font-size:18px; font-weight:700;">${p.name}</div>
            <div style="color:#8a94aa; font-size:12px;">ID: ${p.playerId}</div>
            <div style="color:#8a94aa; font-size:12px;">Nivel ${p.level} · ⭐ ${p.reputation} reputație</div>
          </div>
          <button class="btn" data-action="edit-name">✏️ Editează nume</button>
        </div>
      </div>

      ${p.company ? `
        <div class="card">
          <div style="font-weight:700;">🏢 ${p.company.name}</div>
          <div style="color:#8a94aa; font-size:12px;">Nivel ${p.company.level} · ${p.company.reputation} reputație companie</div>
        </div>
      ` : `<div class="card empty">Nu ai companie fondată</div>`}

      <div class="stat-grid">
        <div class="stat"><div class="stat-label">Contracte</div><div class="stat-value">${p.publicStats.contractsCompleted}</div></div>
        <div class="stat"><div class="stat-label">Zăpadă</div><div class="stat-value">${p.publicStats.totalSnowCleared}</div></div>
        <div class="stat"><div class="stat-label">Vehicule</div><div class="stat-value">${p.ownedVehiclesCount}</div></div>
        <div class="stat"><div class="stat-label">Cosmetice</div><div class="stat-value">${p.cosmeticsCount}</div></div>
      </div>

      <div class="card" style="margin-top:16px;">
        <div style="font-weight:700; margin-bottom:8px;">Setări Privacy</div>
        <div class="card-row">
          <div style="flex:1;">Vizibilitate profil</div>
          <select data-setting="visibility">
            <option value="everyone" ${prof.visibility === 'everyone' ? 'selected' : ''}>Toți</option>
            <option value="friends" ${prof.visibility === 'friends' ? 'selected' : ''}>Prieteni</option>
            <option value="nobody" ${prof.visibility === 'nobody' ? 'selected' : ''}>Nimeni</option>
          </select>
        </div>
        <div class="card-row">
          <div style="flex:1;">Vizibilitate activitate</div>
          <select data-setting="activityVisibility">
            <option value="everyone" ${prof.activityVisibility === 'everyone' ? 'selected' : ''}>Toți</option>
            <option value="friends" ${prof.activityVisibility === 'friends' ? 'selected' : ''}>Prieteni</option>
            <option value="nobody" ${prof.activityVisibility === 'nobody' ? 'selected' : ''}>Nimeni</option>
          </select>
        </div>
        <div class="card-row">
          <div style="flex:1;">Acceptă cereri de prietenie</div>
          <input type="checkbox" data-flag="allowFriendRequests" ${prof.allowFriendRequests ? 'checked' : ''}>
        </div>
        <div class="card-row">
          <div style="flex:1;">Acceptă invitații</div>
          <input type="checkbox" data-flag="allowInvites" ${prof.allowInvites ? 'checked' : ''}>
        </div>
      </div>
    `;
  }

  function renderFriends() {
    const friends = socialStore.state.friends;
    const backendInfo = socialService.getBackendInfo();
    return `
      <h2>Prieteni (${friends.length})</h2>
      ${!backendInfo.available ? `<div class="blocked-banner">🚫 Sincronizarea prietenilor între dispozitive este BLOCKED — necesită backend.</div>` : ''}
      ${friends.length === 0 ? `<div class="empty">Nu ai prieteni încă. Folosește Căutare pentru a găsi jucători.</div>` :
        friends.map(f => `
          <div class="card">
            <div class="card-row">
              <div class="avatar">${initial(f.name)}</div>
              <div style="flex:1;">
                <div style="font-weight:700;">${f.name}</div>
                <div style="color:#8a94aa; font-size:11px;">Nivel ${f.level}${f.company ? ' · ' + f.company : ''}</div>
              </div>
              <button class="btn danger" data-action="remove-friend" data-id="${f.playerId}">Elimină</button>
              <button class="btn" data-action="block-player" data-id="${f.playerId}" data-name="${f.name}">Blochează</button>
            </div>
          </div>
        `).join('')
      }
      ${socialStore.state.blockedPlayers.length > 0 ? `
        <h2 style="margin-top:20px;">Blocați (${socialStore.state.blockedPlayers.length})</h2>
        ${socialStore.state.blockedPlayers.map(b => `
          <div class="card">
            <div class="card-row">
              <div class="avatar" style="background:#3a3a3a;">${initial(b.name)}</div>
              <div style="flex:1;">
                <div style="font-weight:700;">${b.name}</div>
                <div style="color:#8a94aa; font-size:11px;">Blocat ${timeAgo(b.blockedAt)}</div>
              </div>
              <button class="btn" data-action="unblock" data-id="${b.playerId}">Deblochează</button>
            </div>
          </div>
        `).join('')}
      ` : ''}
    `;
  }

  function renderRequests() {
    const received = socialService.getReceivedRequests();
    const sent = socialService.getSentRequests();
    const list = activeSubtab === 'received' ? received : sent;
    // Mark received as read on view
    if (activeSubtab === 'received' && received.length > 0) {
      setTimeout(() => socialService.markAsRead('friendRequests'), 100);
    }
    return `
      <h2>Cereri Prietenie</h2>
      <div class="sub-tabs">
        <button class="${activeSubtab === 'received' ? 'active' : ''}" data-subtab="received">Primite (${received.length})</button>
        <button class="${activeSubtab === 'sent' ? 'active' : ''}" data-subtab="sent">Trimise (${sent.length})</button>
      </div>
      ${list.length === 0 ? `<div class="empty">Nici o cerere ${activeSubtab === 'received' ? 'primită' : 'trimisă'}.</div>` :
        list.map(r => `
          <div class="card">
            <div class="card-row">
              <div class="avatar">${initial(r.name)}</div>
              <div style="flex:1;">
                <div style="font-weight:700;">${r.name}</div>
                <div style="color:#8a94aa; font-size:11px;">${timeAgo(r.createdAt)}</div>
              </div>
              ${activeSubtab === 'received' ? `
                <button class="btn primary" data-action="accept-request" data-id="${r.id}">Acceptă</button>
                <button class="btn" data-action="decline-request" data-id="${r.id}">Refuză</button>
              ` : `
                <button class="btn" data-action="cancel-request" data-id="${r.id}">Anulează</button>
              `}
            </div>
          </div>
        `).join('')
      }
    `;
  }

  function renderSearch() {
    const backendInfo = socialService.getBackendInfo();
    const history = socialStore.state.searchHistory;
    return `
      <h2>Căutare Jucători</h2>
      ${!backendInfo.available ? `<div class="blocked-banner">🚫 Căutarea globală necesită backend. Doar mock local disponibil în dev mode.</div>` : ''}
      <div style="display:flex; gap:8px; margin-bottom:12px;">
        <input type="text" id="social-search-input" placeholder="Nume sau ID jucător..." value="${searchQuery}">
        <button class="btn primary" data-action="do-search">Caută</button>
      </div>
      ${history.length > 0 ? `
        <div style="color:#8a94aa; font-size:11px; margin-bottom:8px;">Recente:
          ${history.slice(0, 5).map(q => `<button class="btn" style="margin-right:4px;" data-action="search-history" data-q="${q}">${q}</button>`).join('')}
        </div>
      ` : ''}
      ${searchLoading ? '<div class="empty">🔎 Se caută...</div>' :
        (searchResults.length === 0 ? '<div class="empty">Nici un rezultat. Încearcă alt nume.</div>' :
          searchResults.map(p => {
            const isFriend = socialStore.isFriend(p.playerId);
            const hasPending = socialStore.hasPendingRequestTo(p.playerId);
            const isBlocked = socialStore.isBlocked(p.playerId);
            let action;
            if (isBlocked) action = `<button class="btn" data-action="unblock" data-id="${p.playerId}">Deblochează</button>`;
            else if (isFriend) action = `<span style="color:#3ea862;">✓ Prieten</span>`;
            else if (hasPending) action = `<span style="color:#ffc043;">⏳ Cerere pendinte</span>`;
            else action = `<button class="btn primary" data-action="send-request" data-id="${p.playerId}" data-name="${p.name}">➕ Adaugă</button>`;
            return `
              <div class="card">
                <div class="card-row">
                  <div class="avatar">${initial(p.name)}</div>
                  <div style="flex:1;">
                    <div style="font-weight:700;">${p.name} <span style="color:#ffc043; font-size:10px;">🧪MOCK</span></div>
                    <div style="color:#8a94aa; font-size:11px;">
                      <span class="presence-dot ${p.presence || 'unknown'}"></span>
                      Nivel ${p.level}${p.company ? ' · ' + p.company : ''} · ${p.reputation} rep
                    </div>
                  </div>
                  ${action}
                </div>
              </div>
            `;
          }).join('')
        )
      }
    `;
  }

  function renderActivity() {
    const feed = socialStore.state.activityFeed;
    // Mark as read pe view
    if (socialStore.state.unreadCounts.activity > 0) {
      setTimeout(() => socialService.markAsRead('activity'), 100);
    }
    return `
      <h2>Fluxul de Activitate (${feed.length}/${ACTIVITY_MAX_ENTRIES})</h2>
      <div style="color:#8a94aa; font-size:11px; margin-bottom:12px;">
        Activitățile tale locale generate din evenimente reale.
      </div>
      ${feed.length === 0 ? '<div class="empty">Nici o activitate încă. Joacă pentru a vedea milestone-urile aici.</div>' :
        feed.map(a => `
          <div class="activity-item">
            <div>${activityText(a)}</div>
            <div class="time">${timeAgo(a.timestamp)}</div>
          </div>
        `).join('')
      }
    `;
  }

  function renderInvites() {
    const received = socialService.getReceivedInvites();
    const sent = socialService.getSentInvites();
    const list = activeSubtab === 'received' ? received : sent;
    const backendInfo = socialService.getBackendInfo();
    if (activeSubtab === 'received' && received.length > 0) {
      setTimeout(() => socialService.markAsRead('invites'), 100);
    }
    return `
      <h2>Invitații</h2>
      ${!backendInfo.available ? `<div class="blocked-banner">🚫 Sincronizarea invitațiilor între dispozitive este BLOCKED — necesită backend.</div>` : ''}
      <div class="sub-tabs">
        <button class="${activeSubtab === 'received' ? 'active' : ''}" data-subtab="received">Primite (${received.length})</button>
        <button class="${activeSubtab === 'sent' ? 'active' : ''}" data-subtab="sent">Trimise (${sent.length})</button>
      </div>
      ${list.length === 0 ? `<div class="empty">Nici o invitație ${activeSubtab === 'received' ? 'primită' : 'trimisă'}.</div>` :
        list.map(i => `
          <div class="card">
            <div class="card-row">
              <div class="avatar">${initial(i.fromName || i.toPlayerId || '?')}</div>
              <div style="flex:1;">
                <div style="font-weight:700;">${i.type.replace(/_/g, ' ')}</div>
                <div style="color:#8a94aa; font-size:11px;">${i.fromName || i.toPlayerId} · ${timeAgo(i.createdAt)}</div>
              </div>
              <span style="color:${i.status === 'pending' ? '#ffc043' : '#8a94aa'};">${i.status}</span>
            </div>
          </div>
        `).join('')
      }
    `;
  }

  function renderCompany() {
    const isCreated = companySystem?.isCreated?.() || false;
    if (!isCreated) {
      return `
        <h2>Companie Socială</h2>
        <div class="card empty">
          Trebuie să fondezi o companie pentru a folosi acest tab.
          <br><br>
          <button class="btn primary" data-action="close-panel">Închide</button>
        </div>
      `;
    }
    const c = companySystem.companyStore?.state || {};
    return `
      <h2>${c.companyName || 'Companie'}</h2>
      <div class="blocked-banner">🚫 Membri multi-player și invitații între dispozitive BLOCKED — necesită backend.</div>
      <div class="card">
        <div style="font-weight:700; font-size:16px;">🏢 ${c.companyName}</div>
        <div style="color:#8a94aa; font-size:12px;">Nivel ${c.level || 1} · ${c.reputation || 0} reputație</div>
        <div style="color:#8a94aa; font-size:11px; margin-top:4px;">Fondată ${c.foundedAt ? timeAgo(c.foundedAt) : 'necunoscut'} în urmă</div>
      </div>
      <div class="card">
        <div style="font-weight:700; margin-bottom:8px;">Membri (1 — doar tu)</div>
        <div class="card-row">
          <div class="avatar">${initial(playerName())}</div>
          <div style="flex:1;">
            <div style="font-weight:700;">${playerName()}</div>
            <div style="color:#8a94aa; font-size:11px;">Fondator</div>
          </div>
        </div>
      </div>
    `;
  }

  function playerName() {
    return socialService.getMyProfile().name;
  }

  function renderContent() {
    switch (activeTab) {
      case 'profile': return renderProfile();
      case 'friends': return renderFriends();
      case 'requests': return renderRequests();
      case 'search': return renderSearch();
      case 'activity': return renderActivity();
      case 'invites': return renderInvites();
      case 'company': return renderCompany();
      default: return '';
    }
  }

  function render() {
    if (!root) return;
    const backendInfo = socialService.getBackendInfo();
    const warnText = backendInfo.available
      ? `🧪 MOCK BACKEND (dev only) — cererile/căutările merg local. Multiplayer real BLOCKED fără backend.`
      : `🚫 Fără backend — majoritatea features social BLOCKED. Doar profil local + activitate feed funcționează REAL.`;
    root.innerHTML = `
      <div class="panel">
        ${renderSidebar()}
        <div class="content">
          <button class="close-btn" data-action="close-panel">×</button>
          <div class="dev-warning">${warnText}</div>
          ${renderContent()}
        </div>
      </div>
    `;
    _attachHandlers();
  }

  function _attachHandlers() {
    // Tab switching
    root.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        activeSubtab = 'received';
        render();
      });
    });

    // Sub-tabs (requests, invites)
    root.querySelectorAll('[data-subtab]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeSubtab = btn.dataset.subtab;
        render();
      });
    });

    // Actions
    root.querySelectorAll('[data-action]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const a = el.dataset.action;
        const id = el.dataset.id;
        const name = el.dataset.name;

        if (a === 'close-panel') close();
        else if (a === 'edit-name') {
          const cur = socialService.getMyProfile().name;
          const nn = prompt('Nume nou (3-20 caractere):', cur);
          if (nn !== null) {
            const r = socialService.updateDisplayName(nn);
            if (r.ok) render();
          }
        }
        else if (a === 'do-search') {
          const input = root.querySelector('#social-search-input');
          if (input) {
            searchQuery = input.value.trim();
            _doSearch(searchQuery);
          }
        }
        else if (a === 'search-history') {
          searchQuery = el.dataset.q;
          _doSearch(searchQuery);
        }
        else if (a === 'send-request') {
          socialService.sendFriendRequest(id, name).then(() => render());
        }
        else if (a === 'accept-request') {
          socialService.acceptFriendRequest(id).then(() => render());
        }
        else if (a === 'decline-request') {
          socialService.declineFriendRequest(id).then(() => render());
        }
        else if (a === 'cancel-request') {
          socialService.cancelFriendRequest(id).then(() => render());
        }
        else if (a === 'remove-friend') {
          if (confirm('Sigur elimini acest prieten?')) {
            socialService.removeFriend(id).then(() => render());
          }
        }
        else if (a === 'block-player') {
          if (confirm('Sigur blochezi ' + name + '?')) {
            socialService.blockPlayer(id, name).then(() => render());
          }
        }
        else if (a === 'unblock') {
          socialService.unblockPlayer(id).then(() => render());
        }
      });
    });

    // Enter la search input
    const searchInput = root.querySelector('#social-search-input');
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          searchQuery = searchInput.value.trim();
          _doSearch(searchQuery);
        }
      });
    }

    // Profile settings
    root.querySelectorAll('[data-setting]').forEach(sel => {
      sel.addEventListener('change', () => {
        socialService.updateVisibility(sel.dataset.setting, sel.value);
      });
    });
    root.querySelectorAll('[data-flag]').forEach(chk => {
      chk.addEventListener('change', () => {
        socialService.updateAllowFlags({ [chk.dataset.flag]: chk.checked });
      });
    });
  }

  async function _doSearch(q) {
    if (!q) return;
    searchLoading = true;
    searchResults = [];
    render();
    try {
      const res = await socialService.searchPlayers(q);
      if (res && res.ok && Array.isArray(res.results)) {
        searchResults = res.results;
      } else if (res && !res.ok) {
        showBanner?.(res.message || 'Căutare eșuată');
      }
    } catch (e) {
      showBanner?.('Eroare căutare');
    } finally {
      searchLoading = false;
      render();
    }
  }

  function open(tab) {
    if (!root) build();
    if (tab && TABS.some(t => t.id === tab)) activeTab = tab;
    render();
    root.classList.add('visible');
    isVisible = true;
    // subscribe reactive updates
    _reactiveSubscribe();
  }

  function close() {
    if (root) root.classList.remove('visible');
    isVisible = false;
    _reactiveUnsubscribe();
  }

  function toggle() {
    if (isVisible) close(); else open();
  }

  let _unsub = null;
  function _reactiveSubscribe() {
    _reactiveUnsubscribe();
    _unsub = socialStore.on(() => {
      if (isVisible) render();
    });
  }
  function _reactiveUnsubscribe() {
    if (_unsub) { _unsub(); _unsub = null; }
  }

  function ensureHudButton() {
    if (document.getElementById('social-trigger-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'social-trigger-btn';
    btn.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top) + 12px);left:calc(env(safe-area-inset-left) + 620px);z-index:15;background:rgba(28,36,52,0.9);color:#fff;border:1px solid rgba(255,255,255,0.15);border-radius:10px;padding:8px 12px;cursor:pointer;font:600 14px system-ui;';
    btn.innerHTML = '👥 Social';
    btn.addEventListener('click', () => open());
    document.body.appendChild(btn);

    // update badge reactiv
    function updateBadge() {
      const total = socialStore.unreadTotal();
      btn.innerHTML = total > 0 ? `👥 Social <span style="background:#e04040;color:#fff;font-size:10px;padding:1px 5px;border-radius:8px;margin-left:2px;">${total}</span>` : '👥 Social';
    }
    socialStore.on(updateBadge);
    updateBadge();
  }

  return { open, close, toggle, ensureHudButton, isVisible: () => isVisible };
}
