// ETAPA FINAL MASTER PASS — QA Debug Menu (v30)
// UI grid modal peste window.__debug (fara game features noi — doar wrap).
// Trigger: ?qa=1 in URL SAU Ctrl+Shift+Q.
// Buton 🔧 in HUD top-left (vizibil doar cu ?qa=1).

export function createQADebugMenu({
  panels = {},
  settingsPanel,
  analyticsPanel,
  showBanner,
  gameState
} = {}) {
  let root = null;
  let panel = null;
  let scrim = null;
  let hudBtn = null;
  let visible = false;
  let opsLog = [];

  const QA_ENABLED = (() => {
    try {
      const u = new URL(window.location.href);
      return u.searchParams.get('qa') === '1';
    } catch { return false; }
  })();

  function _dbg() {
    return (typeof window !== 'undefined' && (window.__debug || window.dbg)) || null;
  }

  function _log(msg) {
    const ts = new Date().toISOString().split('T')[1].slice(0, 8);
    opsLog.push(`[${ts}] ${msg}`);
    if (opsLog.length > 60) opsLog.shift();
    if (typeof showBanner === 'function') { try { showBanner('QA: ' + msg); } catch {} }
    _renderLog();
    console.log('[QA]', msg);
  }

  function _tryOpenPanel(key) {
    try {
      const p = panels[key];
      if (!p) { _log('panel lipsa: ' + key); return; }
      if (typeof p.open === 'function') p.open();
      else if (typeof p.toggle === 'function') p.toggle();
      _log('panel deschis: ' + key);
      close();
    } catch (e) { _log('err ' + key + ': ' + (e && e.message)); }
  }

  const PANELS = [
    { k: 'vehicleShopPanel', l: '🚛 Vehicule', hint: 'V' },
    { k: 'contractPanel',    l: '📋 Contracte', hint: 'C' },
    { k: 'garagePanel',      l: '🔧 Garaj', hint: 'G' },
    { k: 'companyPanel',     l: '🏢 Companie', hint: 'B' },
    { k: 'employeesPanel',   l: '👷 Angajați', hint: 'H' },
    { k: 'fleetPanel',       l: '🚗 Flotă', hint: 'F' },
    { k: 'worldMapPanel',    l: '🗺️ Hartă', hint: 'M' },
    { k: 'missionsPanel',    l: '🎯 Misiuni', hint: 'J' },
    { k: 'eventsPanel',      l: '🎉 Evenimente', hint: 'X' },
    { k: 'storePanel',       l: '💎 Magazin', hint: 'P' },
    { k: 'socialPanel',      l: '👥 Social', hint: 'Y' },
    { k: 'multiplayerPanel', l: '🌐 Multiplayer', hint: 'N' },
    { k: 'prestigePanel',    l: '🏆 Prestige', hint: 'R' }
  ];

  const ACTIONS = {
    Player: [
      { l: '+10k coins',    fn: () => { const d = _dbg(); if (d && d.addCoins) _log('coins=' + d.addCoins(10000)); } },
      { l: '+100 XP',       fn: () => { const d = _dbg(); if (d && d.addXP) _log('xp=' + d.addXP(100)); } },
      { l: '+10 diamonds',  fn: () => { const d = _dbg(); if (d && d.addDiamonds) _log('diam=' + d.addDiamonds(10)); } },
      { l: 'Level up (+1)', fn: () => { const d = _dbg(); if (d && d.addXP) { d.addXP(100000); _log('level up'); } } },
      { l: '+50 reputation', fn: () => { const d = _dbg(); if (d && d.addReputation) _log('rep=' + d.addReputation(50)); } },
      { l: 'Unlock all tools', fn: () => { const d = _dbg(); if (d && d.unlockAll) { d.unlockAll(); _log('tools unlocked'); } } }
    ],
    Contracts: [
      { l: 'Unlock all',    fn: () => { const d = _dbg(); if (d && d.giveAllContracts) { d.giveAllContracts(); _log('contracts unlocked'); } } },
      { l: 'Accept T1',     fn: () => { const d = _dbg(); if (d && d.acceptContract) _log(String(d.acceptContract('house_starter_1'))); } },
      { l: 'Complete active', fn: () => { const d = _dbg(); if (d && d.completeActive) _log(JSON.stringify(d.completeActive())); } },
      { l: 'Fail active',   fn: () => { const d = _dbg(); if (d && d.failActive) _log(JSON.stringify(d.failActive('qa'))); } },
      { l: 'Progress → 50%', fn: () => { const d = _dbg(); if (d && d.setContractProgress) _log(JSON.stringify(d.setContractProgress(0.5))); } },
      { l: 'Skip timer -30s', fn: () => { const d = _dbg(); if (d && d.skipTimer) _log(JSON.stringify(d.skipTimer(30))); } }
    ],
    Vehicles: [
      { l: 'Give sedan',       fn: () => { const d = _dbg(); if (d && d.giveVehicle) _log(String(d.giveVehicle('sedan'))); } },
      { l: 'Unlock all',       fn: () => { const d = _dbg(); if (d && d.unlockAllVehicles) _log(String(d.unlockAllVehicles())); } },
      { l: 'Refill all fuel',  fn: () => { const d = _dbg(); if (d && d.refillAll) _log(String(d.refillAll())); } },
      { l: 'Exit vehicle',     fn: () => { const d = _dbg(); if (d && d.exitVehicle) _log(String(d.exitVehicle())); } }
    ],
    Weather: [
      { l: 'Clear',           fn: () => { const d = _dbg(); if (d && d.setWeather) { d.setWeather('clear'); _log('weather=clear'); } } },
      { l: 'Light snow',      fn: () => { const d = _dbg(); if (d && d.setWeather) { d.setWeather('light_snow'); _log('weather=light_snow'); } } },
      { l: 'Heavy snow',      fn: () => { const d = _dbg(); if (d && d.forceSnow) { d.forceSnow(); _log('weather=heavy_snow'); } } },
      { l: 'Blizzard',        fn: () => { const d = _dbg(); if (d && d.forceBlizzard) { d.forceBlizzard(); _log('weather=blizzard'); } } },
      { l: 'Fog',             fn: () => { const d = _dbg(); if (d && d.forceFog) { d.forceFog(); _log('weather=fog'); } } },
      { l: 'Freezing rain',   fn: () => { const d = _dbg(); if (d && d.setWeather) { d.setWeather('freezing_rain'); _log('weather=freezing_rain'); } } },
      { l: 'Wind',            fn: () => { const d = _dbg(); if (d && d.setWeather) { d.setWeather('wind'); _log('weather=wind'); } } }
    ],
    Time: [
      { l: 'Dawn 06:00',      fn: () => { const d = _dbg(); if (d && d.setTime) _log('time=' + d.setTime(6)); } },
      { l: 'Morning 09:00',   fn: () => { const d = _dbg(); if (d && d.setTime) _log('time=' + d.setTime(9)); } },
      { l: 'Day 12:00',       fn: () => { const d = _dbg(); if (d && d.setTime) _log('time=' + d.setTime(12)); } },
      { l: 'Evening 18:00',   fn: () => { const d = _dbg(); if (d && d.setTime) _log('time=' + d.setTime(18)); } },
      { l: 'Sunset 20:00',    fn: () => { const d = _dbg(); if (d && d.setTime) _log('time=' + d.setTime(20)); } },
      { l: 'Night 23:00',     fn: () => { const d = _dbg(); if (d && d.setTime) _log('time=' + d.setTime(23)); } }
    ],
    Missions: [
      { l: 'Simulate next day', fn: () => { const d = _dbg(); if (d && d.missions && d.missions.simulateNextDay) _log(String(d.missions.simulateNextDay())); } },
      { l: 'Simulate next week', fn: () => { const d = _dbg(); if (d && d.missions && d.missions.simulateNextWeek) _log(String(d.missions.simulateNextWeek())); } },
      { l: 'Unlock all achievements', fn: () => { const d = _dbg(); if (d && d.missions && d.missions.unlockAll) _log(String(d.missions.unlockAll())); } }
    ],
    Prestige: [
      { l: 'Force eligible',  fn: () => { const d = _dbg(); if (d && d.prestige && d.prestige.unlockEndgame) _log(String(d.prestige.unlockEndgame())); } },
      { l: 'Execute (bypass)', fn: () => { const d = _dbg(); if (d && d.prestige && d.prestige.execute) _log(JSON.stringify(d.prestige.execute(true))); } },
      { l: 'Preview',         fn: () => { const d = _dbg(); if (d && d.prestige && d.prestige.preview) _log(JSON.stringify(d.prestige.preview()).slice(0, 120)); } }
    ],
    Save: [
      { l: 'Save now',        fn: () => { const d = _dbg(); if (d && d.save) _log(String(d.save())); } },
      { l: 'Clear + reload',  fn: () => {
          if (!confirm('Clear all progress?')) return;
          const d = _dbg(); if (d && d.resetProgress) { d.resetProgress(); setTimeout(() => location.reload(), 500); }
      } },
      { l: 'Export state',    fn: () => {
          const d = _dbg(); if (!d || !d.exportState) return;
          const json = d.exportState();
          try {
            navigator.clipboard.writeText(json);
            _log('exported → clipboard (' + json.length + ' chars)');
          } catch { _log('export ok — check console'); console.log(json); }
      } },
      { l: 'Import state (prompt)', fn: () => {
          const raw = prompt('Paste state JSON:');
          if (!raw) return;
          const d = _dbg(); if (d && d.importState) _log('import=' + d.importState(raw));
      } }
    ],
    Multiplayer: [
      { l: 'Create session',  fn: async () => { const d = _dbg(); if (d && d.multiplayer && d.multiplayer.create) { const r = await d.multiplayer.create(); _log(JSON.stringify(r).slice(0, 100)); } } },
      { l: 'Add 3 bots',      fn: async () => { const d = _dbg(); if (d && d.multiplayer && d.multiplayer.addBots) { const r = await d.multiplayer.addBots(3); _log('bots: ' + JSON.stringify(r).slice(0, 80)); } } },
      { l: 'Leave session',   fn: async () => { const d = _dbg(); if (d && d.multiplayer && d.multiplayer.leave) { const r = await d.multiplayer.leave(); _log(JSON.stringify(r).slice(0, 80)); } } }
    ],
    Social: [
      { l: 'Mock friend',     fn: () => { const d = _dbg(); if (d && d.social && d.social.mockFriend) _log(JSON.stringify(d.social.mockFriend('QA Bot'))); } },
      { l: 'Mock request',    fn: () => { const d = _dbg(); if (d && d.social && d.social.mockRequest) _log(JSON.stringify(d.social.mockRequest('QA Sender'))); } },
      { l: 'Mock activity',   fn: () => { const d = _dbg(); if (d && d.social && d.social.mockActivity) _log(String(d.social.mockActivity('level_up'))); } }
    ]
  };

  function _build() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'qa-debug-root';
    root.style.cssText = 'position:fixed;inset:0;z-index:9500;display:none;font-family:system-ui,sans-serif;';

    scrim = document.createElement('div');
    scrim.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.55);opacity:0;transition:opacity 200ms;';
    scrim.addEventListener('click', close);

    panel = document.createElement('div');
    panel.style.cssText = [
      'position:absolute','top:50%','left:50%',
      'transform:translate(-50%,-50%) scale(0.95)',
      'transition:transform 180ms ease',
      'width:min(760px,95vw)','max-height:90vh',
      'background:#0d1420','color:#fff',
      'border:1px solid rgba(255,193,67,0.35)','border-radius:14px',
      'box-shadow:0 20px 60px rgba(0,0,0,0.65)',
      'overflow:hidden','display:flex','flex-direction:column'
    ].join(';');

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:linear-gradient(180deg,#1a2436,#0d1420);border-bottom:1px solid rgba(255,193,67,0.25);';
    header.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px">'
      + '<div style="font-size:18px">🔧</div>'
      + '<div style="font-size:15px;font-weight:700;color:#ffc043">QA Debug Menu</div>'
      + '<div style="font-size:11px;color:#9aa3b5">(?qa=1 · Ctrl+Shift+Q)</div>'
      + '</div>'
      + '<button id="qa-close" style="background:transparent;border:none;color:#fff;font-size:22px;cursor:pointer;padding:0 4px;line-height:1">×</button>';
    header.querySelector('#qa-close');

    // Body scroll
    const body = document.createElement('div');
    body.style.cssText = 'padding:12px 16px;overflow-y:auto;flex:1;';

    // Panels section
    const panelsTitle = document.createElement('div');
    panelsTitle.style.cssText = 'font-size:12px;font-weight:700;color:#8cf;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;';
    panelsTitle.textContent = 'Panouri (' + PANELS.length + ' + Settings + Analytics)';
    body.appendChild(panelsTitle);

    const panelsGrid = document.createElement('div');
    panelsGrid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:16px;';
    for (const it of PANELS) {
      const b = _btn(it.l + (it.hint ? ' [' + it.hint + ']' : ''), '#2b3648');
      b.addEventListener('click', () => _tryOpenPanel(it.k));
      panelsGrid.appendChild(b);
    }
    // Settings + Analytics
    const bs = _btn('⚙️ Settings', '#2b3648');
    bs.addEventListener('click', () => { try { settingsPanel && settingsPanel.open && settingsPanel.open(); _log('settings deschis'); close(); } catch (e) { _log('err settings'); } });
    panelsGrid.appendChild(bs);

    const ba = _btn('📊 Analytics [F4]', '#2b3648');
    ba.addEventListener('click', () => { try { analyticsPanel && analyticsPanel.toggle && analyticsPanel.toggle(); _log('analytics toggle'); close(); } catch (e) { _log('err analytics'); } });
    panelsGrid.appendChild(ba);

    body.appendChild(panelsGrid);

    // Action groups
    for (const [group, list] of Object.entries(ACTIONS)) {
      const t = document.createElement('div');
      t.style.cssText = 'font-size:12px;font-weight:700;color:#8cf;text-transform:uppercase;letter-spacing:1px;margin:12px 0 6px;';
      t.textContent = group;
      body.appendChild(t);
      const grid = document.createElement('div');
      grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:6px;';
      for (const a of list) {
        const b = _btn(a.l, '#233247');
        b.addEventListener('click', () => { try { a.fn(); } catch (e) { _log('err: ' + (e && e.message)); } });
        grid.appendChild(b);
      }
      body.appendChild(grid);
    }

    // Screen graph
    const graphTitle = document.createElement('div');
    graphTitle.style.cssText = 'font-size:12px;font-weight:700;color:#8cf;text-transform:uppercase;letter-spacing:1px;margin:14px 0 6px;';
    graphTitle.textContent = 'Screen Graph';
    body.appendChild(graphTitle);
    const graphBox = document.createElement('div');
    graphBox.style.cssText = 'font-family:ui-monospace,monospace;font-size:11px;background:rgba(0,0,0,0.35);padding:8px 10px;border-radius:6px;color:#c5cee0;white-space:pre;overflow-x:auto;';
    graphBox.textContent = _screenGraph();
    body.appendChild(graphBox);

    // Log
    const logTitle = document.createElement('div');
    logTitle.style.cssText = 'font-size:12px;font-weight:700;color:#8cf;text-transform:uppercase;letter-spacing:1px;margin:14px 0 6px;';
    logTitle.textContent = 'Log recent';
    body.appendChild(logTitle);
    const logBox = document.createElement('div');
    logBox.id = 'qa-log-box';
    logBox.style.cssText = 'font-family:ui-monospace,monospace;font-size:11px;background:rgba(0,0,0,0.35);padding:8px 10px;border-radius:6px;color:#8fc9a1;max-height:120px;overflow-y:auto;white-space:pre-wrap;';
    logBox.textContent = '(no ops yet)';
    body.appendChild(logBox);

    root.appendChild(scrim);
    root.appendChild(panel);
    panel.appendChild(header);
    panel.appendChild(body);
    document.body.appendChild(root);

    header.querySelector('#qa-close').addEventListener('click', close);

    return root;
  }

  function _btn(label, bg) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.style.cssText = [
      'padding:8px 6px','font-size:11px','font-weight:600',
      'background:' + (bg || '#1e2836'),
      'color:#fff','border:1px solid rgba(255,255,255,0.08)',
      'border-radius:6px','cursor:pointer','text-align:center',
      'font-family:system-ui,sans-serif','touch-action:manipulation',
      'transition:background 120ms'
    ].join(';');
    b.addEventListener('mouseover', () => { b.style.background = '#3a4a68'; });
    b.addEventListener('mouseout', () => { b.style.background = bg || '#1e2836'; });
    return b;
  }

  function _renderLog() {
    if (!panel) return;
    const box = panel.querySelector('#qa-log-box');
    if (!box) return;
    box.textContent = opsLog.length ? opsLog.slice(-14).join('\n') : '(no ops yet)';
    box.scrollTop = box.scrollHeight;
  }

  function _screenGraph() {
    const lines = [];
    lines.push('QA Menu (Ctrl+Shift+Q)');
    lines.push('├── Panouri:');
    for (const it of PANELS) {
      const p = panels[it.k];
      const ok = p ? 'OK' : 'MISSING';
      lines.push('│    ├── ' + it.l + ' [' + it.hint + '] — ' + ok);
    }
    lines.push('│    ├── Settings — ' + (settingsPanel ? 'OK' : 'MISSING'));
    lines.push('│    └── Analytics — ' + (analyticsPanel ? 'OK' : 'MISSING'));
    lines.push('├── Escape → close top modal / pause');
    lines.push('└── window.__debug — ' + (_dbg() ? 'exposed' : 'STRIPPED (production?)'));
    return lines.join('\n');
  }

  function _createHudButton() {
    if (hudBtn || !QA_ENABLED) return;
    hudBtn = document.createElement('button');
    hudBtn.id = 'qa-hud-btn';
    hudBtn.title = 'QA Debug Menu (Ctrl+Shift+Q)';
    hudBtn.textContent = '🔧';
    hudBtn.style.cssText = [
      'position:fixed','top:8px','left:56px',
      'width:32px','height:32px',
      'border-radius:8px','border:1px solid rgba(255,193,67,0.35)',
      'background:rgba(15,20,32,0.85)','color:#ffc043',
      'font-size:16px','cursor:pointer','z-index:130',
      'font-family:system-ui','padding:0','line-height:1',
      'display:flex','align-items:center','justify-content:center'
    ].join(';');
    hudBtn.addEventListener('click', toggle);
    document.body.appendChild(hudBtn);
  }

  function open() {
    _build();
    root.style.display = 'block';
    void panel.offsetWidth;
    scrim.style.opacity = '1';
    panel.style.transform = 'translate(-50%,-50%) scale(1)';
    visible = true;
  }

  function close() {
    if (!root) return;
    scrim.style.opacity = '0';
    panel.style.transform = 'translate(-50%,-50%) scale(0.95)';
    setTimeout(() => { if (root) root.style.display = 'none'; }, 200);
    visible = false;
  }

  function toggle() { visible ? close() : open(); }
  function isOpen() { return visible; }

  function install() {
    // Ctrl+Shift+Q toggle (indiferent de ?qa=1)
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.ctrlKey && e.shiftKey && (e.key === 'Q' || e.key === 'q')) {
        e.preventDefault();
        toggle();
      }
    });
    if (QA_ENABLED) {
      _createHudButton();
      _log('QA mode active (?qa=1)');
    }
  }

  return { open, close, toggle, isOpen, install, log: _log };
}
