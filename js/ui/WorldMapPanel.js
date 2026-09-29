// Etapa 4 — World Map Panel. Overlay modal 3-level:
//   Level 0: World (grid regiuni)
//   Level 1: Region (grid locatii)
//   Level 2: Location (list areas cu progres + spawn button + contracte)
// Reactiv: subscribe la worldStore + playerStore + contractStore.

import { CONTRACT_STATUS } from '../config/contractStatus.js';
import { LOCATION_BY_ID } from '../config/locations.js';

const STYLE = `
#world-overlay {
  position: fixed; inset: 0; background: rgba(15,20,32,0.82);
  display: none; align-items: center; justify-content: center;
  z-index: 47; font: 400 14px system-ui, sans-serif; color: #fff;
}
#world-overlay.visible { display: flex; }
#world-overlay .panel {
  background: #1c2434; border: 1px solid rgba(255,255,255,0.18);
  border-radius: 14px; padding: 16px 18px;
  min-width: 320px; max-width: min(94vw, 780px);
  max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;
  box-shadow: 0 10px 40px rgba(0,0,0,0.55);
}
#world-overlay h2 {
  margin: 0 0 10px; font-size: 18px; font-weight: 700;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
#world-overlay .breadcrumb {
  font: 500 12px system-ui; color: #a0a8ba; margin-bottom: 8px;
}
#world-overlay .breadcrumb a { color: #7cb8ff; cursor: pointer; text-decoration: underline; }
#world-overlay .close-x {
  background: transparent; border: none; color: #aab; font: 700 18px system-ui;
  cursor: pointer; padding: 0 6px;
}
#world-overlay .actions-top {
  display: flex; gap: 8px; margin-bottom: 8px;
}
#world-overlay .btn-back {
  padding: 6px 12px; border-radius: 6px; cursor: pointer;
  border: 1px solid rgba(255,255,255,0.18); background: #242c3c; color: #fff;
  font: 600 12px system-ui;
}
#world-overlay .btn-back:hover { filter: brightness(1.2); }
#world-overlay .grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px; overflow-y: auto; padding: 4px 2px;
}
#world-overlay .card {
  background: #242c3c; border: 1px solid rgba(255,255,255,0.10);
  border-radius: 10px; padding: 12px; cursor: pointer;
  transition: background 0.1s, border-color 0.1s;
}
#world-overlay .card:hover { background: #2d374a; }
#world-overlay .card.locked { opacity: 0.55; cursor: not-allowed; }
#world-overlay .card.active { border-color: #ffd870; }
#world-overlay .card.completed { border-color: #7ce07c; }
#world-overlay .card .icon-big { font-size: 32px; margin-bottom: 4px; }
#world-overlay .card .name {
  font: 700 15px system-ui; margin-bottom: 4px;
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
}
#world-overlay .card .desc { color: #cfd6e5; font: 500 12px system-ui; margin-bottom: 8px; }
#world-overlay .card .meta {
  display: flex; flex-wrap: wrap; gap: 6px 12px;
  font: 500 11px system-ui; color: #a0a8ba;
}
#world-overlay .card .diff {
  font: 600 10px system-ui; padding: 2px 6px; border-radius: 4px;
  background: rgba(255,255,255,0.10);
}
#world-overlay .card .diff.easy    { background: rgba(120,220,120,0.20); color: #90eea0; }
#world-overlay .card .diff.medium  { background: rgba(220,180,80,0.20);  color: #ffce70; }
#world-overlay .card .diff.hard    { background: rgba(220,140,60,0.20);  color: #ffb060; }
#world-overlay .card .diff.expert  { background: rgba(220,80,80,0.20);   color: #ff8080; }
#world-overlay .lock-badge { color: #a0a8ba; font: 600 11px system-ui; }
#world-overlay .status-badge {
  font: 600 10px system-ui; padding: 2px 6px; border-radius: 4px;
}
#world-overlay .status-badge.UNLOCKED  { background: rgba(120,180,255,0.20); color: #7cb8ff; }
#world-overlay .status-badge.ACTIVE    { background: rgba(255,216,120,0.20); color: #ffd870; }
#world-overlay .status-badge.COMPLETED { background: rgba(120,220,120,0.20); color: #7ce07c; }
#world-overlay .status-badge.AVAILABLE { background: rgba(255,255,255,0.10); color: #cfd6e5; }
#world-overlay .status-badge.LOCKED    { background: rgba(180,180,190,0.15); color: #a0a8ba; }
#world-overlay .area-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 8px; margin: 4px 0; background: rgba(255,255,255,0.04);
  border-radius: 6px; font: 500 12px system-ui;
}
#world-overlay .area-row .prog-bar {
  width: 80px; height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px;
  overflow: hidden; margin-right: 8px;
}
#world-overlay .area-row .prog-fill {
  height: 100%; background: #7cb8ff; transition: width 0.2s;
}
#world-overlay .actions-bottom {
  display: flex; gap: 10px; margin-top: 12px;
}
#world-overlay .btn {
  flex: 1; padding: 10px 14px; border-radius: 8px; cursor: pointer;
  border: 1px solid rgba(255,255,255,0.2); background: #2a3244; color: #fff;
  font: 600 13px system-ui;
}
#world-overlay .btn.primary { background: #3f7b3f; border-color: #5da05d; }
#world-overlay .btn.warn    { background: #7a4a20; border-color: #a06030; }
#world-overlay .btn:disabled { opacity: 0.4; cursor: not-allowed; }
#world-overlay .btn:hover:not(:disabled) { filter: brightness(1.2); }
#world-overlay .empty { padding: 16px; text-align: center; color: #7c8494; font: 500 12px system-ui; }
`;

const SCREEN_PLAYING = 'playing';
const SCREEN_WORLD = 'world_open';

export function createWorldMapPanel(deps) {
  const { worldStore, playerStore, contractStore, worldSystem, unlockSystem, gameState, showBanner, audio, haptics } = deps;

  if (!document.getElementById('world-panel-style')) {
    const s = document.createElement('style');
    s.id = 'world-panel-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  const root = document.createElement('div');
  root.id = 'world-overlay';
  root.innerHTML = `
    <div class="panel">
      <h2>
        <span id="world-title">🌍 World</span>
        <button class="close-x" data-a="close">×</button>
      </h2>
      <div class="breadcrumb" id="world-breadcrumb"></div>
      <div class="actions-top" id="world-actions-top"></div>
      <div id="world-body"></div>
    </div>
  `;
  document.body.appendChild(root);

  const titleEl = root.querySelector('#world-title');
  const crumbEl = root.querySelector('#world-breadcrumb');
  const actionsTopEl = root.querySelector('#world-actions-top');
  const bodyEl = root.querySelector('#world-body');

  // navigation state
  let view = 'world';   // 'world' | 'region' | 'location'
  let currentRegionId = null;
  let currentLocationId = null;

  // trigger button top-left, under contracts button
  const trigger = document.createElement('button');
  trigger.id = 'world-trigger';
  trigger.title = 'World Map (M)';
  trigger.style.cssText = 'position:fixed;top:calc(120px + env(safe-area-inset-top));' +
    'right:calc(12px + env(safe-area-inset-right));' +
    'width:44px;height:44px;border-radius:10px;border:1px solid rgba(120,180,255,0.5);' +
    'background:rgba(15,20,32,0.85);color:#7cb8ff;font-size:22px;cursor:pointer;' +
    'z-index:7;display:flex;align-items:center;justify-content:center;' +
    'box-shadow:0 4px 12px rgba(0,0,0,0.35);';
  trigger.textContent = '🌍';
  trigger.addEventListener('click', () => open());
  document.body.appendChild(trigger);

  root.addEventListener('click', (e) => {
    if (e.target === root) close();
    if (e.target.matches('[data-a="close"]')) close();
  });

  function open() {
    view = 'world';
    currentRegionId = null;
    currentLocationId = null;
    render();
    root.classList.add('visible');
    if (gameState) gameState.setScreen(SCREEN_WORLD);
  }
  function close() {
    root.classList.remove('visible');
    if (gameState && gameState.screen === SCREEN_WORLD) gameState.setScreen(SCREEN_PLAYING);
  }
  function toggle() { if (root.classList.contains('visible')) close(); else open(); }

  function goRegion(regionId) {
    view = 'region';
    currentRegionId = regionId;
    currentLocationId = null;
    render();
  }
  function goLocation(locationId) {
    const loc = LOCATION_BY_ID[locationId];
    if (!loc) return;
    view = 'location';
    currentLocationId = locationId;
    currentRegionId = loc.regionId;
    render();
  }
  function back() {
    if (view === 'location') { view = 'region'; currentLocationId = null; render(); }
    else if (view === 'region') { view = 'world'; currentRegionId = null; render(); }
  }

  function render() {
    // Breadcrumb
    let crumb = '<a data-nav="world">🌍 World</a>';
    if (view === 'region' && currentRegionId) {
      const r = worldSystem.getRegions().find(x => x.id === currentRegionId);
      crumb += ' › <a data-nav="region">' + (r ? r.icon + ' ' + r.name : currentRegionId) + '</a>';
    } else if (view === 'location' && currentLocationId) {
      const r = worldSystem.getRegions().find(x => x.id === currentRegionId);
      const l = LOCATION_BY_ID[currentLocationId];
      crumb += ' › <a data-nav="region">' + (r ? r.icon + ' ' + r.name : currentRegionId) + '</a>';
      crumb += ' › ' + (l ? '📍 ' + l.name : currentLocationId);
    }
    crumbEl.innerHTML = crumb;
    crumbEl.querySelectorAll('a[data-nav]').forEach(el => {
      el.addEventListener('click', () => {
        const nav = el.dataset.nav;
        if (nav === 'world') { view = 'world'; currentRegionId = null; currentLocationId = null; render(); }
        else if (nav === 'region') { view = 'region'; currentLocationId = null; render(); }
      });
    });

    // Actions top (back / exit-location)
    actionsTopEl.innerHTML = '';
    if (view !== 'world') {
      const b = document.createElement('button');
      b.className = 'btn-back';
      b.textContent = '← Înapoi';
      b.addEventListener('click', back);
      actionsTopEl.appendChild(b);
    }
    if (worldStore.state.currentLocationId) {
      const e = document.createElement('button');
      e.className = 'btn-back';
      e.style.background = '#5a3a5a';
      e.textContent = '🌍 Ieși din locație';
      e.addEventListener('click', () => {
        worldSystem.exitLocation();
        render();
      });
      actionsTopEl.appendChild(e);
    }

    // Title
    if (view === 'world') titleEl.textContent = '🌍 World';
    else if (view === 'region') {
      const r = worldSystem.getRegions().find(x => x.id === currentRegionId);
      titleEl.textContent = (r ? r.icon + ' ' + r.name : 'Region');
    } else if (view === 'location') {
      const l = LOCATION_BY_ID[currentLocationId];
      titleEl.textContent = '📍 ' + (l ? l.name : 'Location');
    }

    // Body
    bodyEl.innerHTML = '';
    if (view === 'world') renderWorld();
    else if (view === 'region') renderRegion();
    else if (view === 'location') renderLocation();
  }

  function renderWorld() {
    const grid = document.createElement('div');
    grid.className = 'grid';
    const regions = worldSystem.getRegions();
    for (const r of regions) {
      const card = document.createElement('div');
      card.className = 'card';
      const isUnlocked = r.status !== 'LOCKED';
      if (!isUnlocked) card.classList.add('locked');

      const locsCount = r.locations.length;
      const info = unlockSystem.getRegionLockReason(r, playerStore.state);
      let lockText = '';
      if (!isUnlocked && info) {
        if (info.reason === 'level') lockText = `🔒 Level ${info.requiredLevel}`;
        else if (info.reason === 'contracts') lockText = `🔒 ${info.currentContracts}/${info.requiredContracts} contracte`;
      }

      card.innerHTML = `
        <div class="icon-big">${r.icon}</div>
        <div class="name">
          <span>${r.name}</span>
          <span class="status-badge ${r.status}">${r.status}</span>
        </div>
        <div class="desc">${r.description}</div>
        <div class="meta">
          <span class="diff ${r.difficulty}">${r.difficulty.toUpperCase()}</span>
          <span>📍 ${locsCount} locații</span>
          ${lockText ? '<span class="lock-badge">' + lockText + '</span>' : ''}
        </div>
      `;
      if (isUnlocked) {
        card.addEventListener('click', () => goRegion(r.id));
      }
      grid.appendChild(card);
    }
    bodyEl.appendChild(grid);
  }

  function renderRegion() {
    const locations = worldSystem.getLocations(currentRegionId);
    if (locations.length === 0) {
      bodyEl.innerHTML = '<div class="empty">Nicio locație în regiune.</div>';
      return;
    }
    const grid = document.createElement('div');
    grid.className = 'grid';
    for (const l of locations) {
      const card = document.createElement('div');
      card.className = 'card';
      const isUnlocked = l.status !== 'LOCKED';
      if (!isUnlocked) card.classList.add('locked');
      if (l.status === 'ACTIVE') card.classList.add('active');
      if (l.status === 'COMPLETED') card.classList.add('completed');

      const info = unlockSystem.getLocationLockReason(l, playerStore.state);
      let lockText = '';
      if (!isUnlocked && info) {
        if (info.reason === 'level') lockText = `🔒 Level ${info.requiredLevel}`;
        else if (info.reason === 'contracts') lockText = `🔒 ${info.currentContracts}/${info.requiredContracts} contracte`;
      }

      // Contract count available in this location
      let contractsInLoc = 0;
      if (contractStore) {
        for (const id in contractStore.state.contracts) {
          const c = contractStore.state.contracts[id];
          if (c.locationId === l.id && c.status === CONTRACT_STATUS.AVAILABLE) contractsInLoc++;
        }
      }

      const pct = Math.round(l.progress * 100);
      card.innerHTML = `
        <div class="name">
          <span>📍 ${l.name}</span>
          <span class="status-badge ${l.status}">${l.status}</span>
        </div>
        <div class="desc">${l.description}</div>
        <div class="meta">
          <span class="diff ${l.difficulty}">${l.difficulty.toUpperCase()}</span>
          <span>🎯 ${l.areas.length} zone</span>
          <span>📋 ${contractsInLoc} contracte</span>
          <span>📊 ${pct}% clean</span>
          ${lockText ? '<span class="lock-badge">' + lockText + '</span>' : ''}
        </div>
      `;
      if (isUnlocked) {
        card.addEventListener('click', () => goLocation(l.id));
      }
      grid.appendChild(card);
    }
    bodyEl.appendChild(grid);
  }

  function renderLocation() {
    const loc = LOCATION_BY_ID[currentLocationId];
    if (!loc) { bodyEl.innerHTML = '<div class="empty">Locație invalidă.</div>'; return; }
    const areas = worldSystem.getAreas(currentLocationId);
    const isHere = worldStore.state.currentLocationId === currentLocationId;

    const container = document.createElement('div');
    container.style.overflowY = 'auto';

    // Info
    const info = document.createElement('div');
    info.style.cssText = 'padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;margin-bottom:10px;';
    info.innerHTML = `
      <div style="font:500 13px system-ui;color:#cfd6e5;margin-bottom:4px">${loc.description}</div>
      <div style="font:500 11px system-ui;color:#a0a8ba">
        Spawn: (${loc.spawn.x}, ${loc.spawn.z}) · Dificultate: ${loc.difficulty}
      </div>
    `;
    container.appendChild(info);

    // Areas
    const areasTitle = document.createElement('div');
    areasTitle.style.cssText = 'font:700 12px system-ui;text-transform:uppercase;letter-spacing:0.5px;color:#a0a8ba;margin:12px 0 6px';
    areasTitle.textContent = 'Zone de curățat';
    container.appendChild(areasTitle);

    if (areas.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'Nicio zonă definită.';
      container.appendChild(empty);
    } else {
      for (const a of areas) {
        const row = document.createElement('div');
        row.className = 'area-row';
        const pct = Math.round((a.progress || 0) * 100);
        row.innerHTML = `
          <span style="flex:1">${a.completed ? '✓ ' : ''}${a.name}</span>
          <div class="prog-bar"><div class="prog-fill" style="width:${pct}%"></div></div>
          <span style="min-width:38px;text-align:right;color:${a.completed ? '#7ce07c' : '#cfd6e5'}">${pct}%</span>
        `;
        container.appendChild(row);
      }
    }

    // Contracts in this location
    if (contractStore) {
      const cTitle = document.createElement('div');
      cTitle.style.cssText = 'font:700 12px system-ui;text-transform:uppercase;letter-spacing:0.5px;color:#a0a8ba;margin:14px 0 6px';
      cTitle.textContent = 'Contracte în zonă';
      container.appendChild(cTitle);
      const contractsInLoc = [];
      for (const id in contractStore.state.contracts) {
        const c = contractStore.state.contracts[id];
        if (c.locationId === currentLocationId) contractsInLoc.push(c);
      }
      if (contractsInLoc.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = 'Niciun contract legat de această locație.';
        container.appendChild(empty);
      } else {
        for (const c of contractsInLoc) {
          const cr = document.createElement('div');
          cr.className = 'area-row';
          let statusIcon = '';
          if (c.status === CONTRACT_STATUS.AVAILABLE) statusIcon = '📋';
          else if (c.status === CONTRACT_STATUS.ACTIVE) statusIcon = '● ';
          else if (c.status === CONTRACT_STATUS.ACCEPTED) statusIcon = '◉ ';
          else if (c.status === CONTRACT_STATUS.COMPLETED) statusIcon = '✓ ';
          else if (c.status === CONTRACT_STATUS.FAILED) statusIcon = '✗ ';
          cr.innerHTML = `
            <span style="flex:1">${statusIcon} ${c.title}</span>
            <span style="color:#a0a8ba;font:500 11px system-ui">L${c.unlockLevel} · ${c.baseReward.coins}💰</span>
          `;
          container.appendChild(cr);
        }
      }
    }

    // Actions
    const actions = document.createElement('div');
    actions.className = 'actions-bottom';
    if (isHere) {
      const b = document.createElement('button');
      b.className = 'btn';
      b.textContent = '✓ Ești aici';
      b.disabled = true;
      actions.appendChild(b);
    } else {
      const b = document.createElement('button');
      b.className = 'btn primary';
      b.textContent = '🚀 Teleport aici';
      b.addEventListener('click', () => {
        const r = worldSystem.enterLocation(currentLocationId);
        if (r.ok) close();
        else if (showBanner) showBanner('Locație inaccesibilă');
      });
      actions.appendChild(b);
    }
    container.appendChild(actions);

    bodyEl.appendChild(container);
  }

  // Reactiv
  worldStore.on((_s, changed) => {
    if (!root.classList.contains('visible')) return;
    if (changed.some(k => ['currentLocationId','unlockedRegions','unlockedLocations','areaProgress','completedAreas'].includes(k))) {
      render();
    }
  });
  playerStore.on((_s, changed) => {
    if (!root.classList.contains('visible')) return;
    if (changed.some(k => ['level','stats'].includes(k))) render();
  });
  if (contractStore) {
    contractStore.on((_s, changed) => {
      if (!root.classList.contains('visible')) return;
      if (changed.some(k => ['contracts','activeContractId','completed','failed'].includes(k))) render();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.key === 'm' || e.key === 'M') toggle();
  });

  return { open, close, toggle, render };
}
