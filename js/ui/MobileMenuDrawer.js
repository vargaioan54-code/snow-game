// ETAPA 16 — Mobile menu drawer slide-in dreapta.
// Grid 4 coloane cu iconițe pentru toate panelurile.

export function createMobileMenuDrawer({ panels = {}, settingsPanel } = {}) {
  let root = null;
  let scrim = null;
  let panel = null;
  let visible = false;

  const ITEMS = [
    { id: 'vehicles',    icon: '🚛', label: 'Vehicule',   ref: () => panels.vehicleShopPanel },
    { id: 'contracts',   icon: '📋', label: 'Contracte',  ref: () => panels.contractPanel },
    { id: 'garage',      icon: '🔧', label: 'Garaj',      ref: () => panels.garagePanel },
    { id: 'company',     icon: '🏢', label: 'Companie',   ref: () => panels.companyPanel },
    { id: 'employees',   icon: '👷', label: 'Angajați',   ref: () => panels.employeesPanel },
    { id: 'fleet',       icon: '🚗', label: 'Flotă',      ref: () => panels.fleetPanel },
    { id: 'world',       icon: '🗺️', label: 'Hartă',      ref: () => panels.worldMapPanel },
    { id: 'missions',    icon: '🎯', label: 'Misiuni',    ref: () => panels.missionsPanel },
    { id: 'events',      icon: '🎉', label: 'Evenimente', ref: () => panels.eventsPanel },
    { id: 'store',       icon: '💎', label: 'Magazin',    ref: () => panels.storePanel },
    { id: 'social',      icon: '👥', label: 'Social',     ref: () => panels.socialPanel },
    { id: 'multiplayer', icon: '🌐', label: 'Multiplayer',ref: () => panels.multiplayerPanel },
    { id: 'prestige',    icon: '🏆', label: 'Prestige',   ref: () => panels.prestigePanel },
    { id: 'settings',    icon: '⚙️', label: 'Setări',     ref: () => settingsPanel }
  ];

  function _build() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'mobile-drawer-root';
    root.style.cssText = 'position:fixed;inset:0;z-index:400;display:none;';
    scrim = document.createElement('div');
    scrim.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.4);opacity:0;transition:opacity 200ms';
    scrim.addEventListener('click', close);
    panel = document.createElement('div');
    panel.style.cssText = [
      'position:absolute', 'right:0', 'top:0', 'bottom:0',
      'width:min(320px,80vw)',
      'background:#101725', 'color:#fff',
      'padding:16px 12px',
      'transform:translateX(100%)', 'transition:transform 240ms ease',
      'overflow-y:auto',
      'font-family:sans-serif',
      'box-shadow:-8px 0 30px rgba(0,0,0,0.5)'
    ].join(';');
    panel.innerHTML = ''
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">'
      +   '<div style="font-size:16px;font-weight:700">Meniu</div>'
      +   '<button id="drawer-close" style="background:transparent;border:none;color:#fff;font-size:22px;cursor:pointer">×</button>'
      + '</div>'
      + '<div id="drawer-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px"></div>';
    root.appendChild(scrim);
    root.appendChild(panel);
    document.body.appendChild(root);
    panel.querySelector('#drawer-close').addEventListener('click', close);
    const grid = panel.querySelector('#drawer-grid');
    for (const it of ITEMS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.style.cssText = [
        'display:flex', 'flex-direction:column',
        'align-items:center', 'justify-content:center',
        'gap:4px', 'padding:10px 4px',
        'background:rgba(255,255,255,0.05)',
        'border:1px solid rgba(255,255,255,0.08)',
        'border-radius:10px', 'color:#fff',
        'cursor:pointer', 'min-height:66px',
        'font-family:sans-serif', 'font-size:11px',
        'touch-action:manipulation'
      ].join(';');
      b.innerHTML = '<div style="font-size:22px">' + it.icon + '</div><div>' + it.label + '</div>';
      b.addEventListener('click', () => {
        try {
          const p = it.ref && it.ref();
          if (p && typeof p.open === 'function') p.open();
          else if (p && typeof p.toggle === 'function') p.toggle();
        } catch (e) { /* silent */ }
        close();
      });
      grid.appendChild(b);
    }
    return root;
  }

  function open() {
    _build();
    root.style.display = 'block';
    // force reflow then animate
    void panel.offsetWidth;
    scrim.style.opacity = '1';
    panel.style.transform = 'translateX(0)';
    visible = true;
  }

  function close() {
    if (!root) return;
    scrim.style.opacity = '0';
    panel.style.transform = 'translateX(100%)';
    setTimeout(() => { if (root && !visible) return; if (root) root.style.display = 'none'; }, 260);
    visible = false;
  }

  function toggle() { if (visible) close(); else open(); }
  function isOpen() { return visible; }

  return { open, close, toggle, isOpen };
}
