// ETAPA 19 — Analytics Panel (DEV-ONLY, ascuns in production)
// 5 tabs: Event stream, Session stats, Economy snapshot, Crashes, Feature flags.
// Trigger buton HUD 📊 (afisat doar dev/staging).

export function createAnalyticsPanel({ analytics, economyMonitor, crashReporting, featureFlagsSystem, envConfig, versionSnapshot, logger } = {}) {
  let overlay = null;
  let visible = false;
  let currentTab = 'events';

  function _root() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'analytics-panel';
    overlay.style.cssText = [
      'position:fixed','inset:0','z-index:9995',
      'display:none','align-items:center','justify-content:center',
      'background:rgba(0,0,0,0.72)','font-family:sans-serif','color:#fff'
    ].join(';');
    overlay.addEventListener('click', (e) => { if (e.target === overlay) hide(); });
    const card = document.createElement('div');
    card.style.cssText = [
      'background:#0f1725','width:min(920px,94vw)','max-height:88vh',
      'border-radius:14px','border:1px solid rgba(100,140,200,0.28)',
      'display:flex','flex-direction:column','overflow:hidden',
      'box-shadow:0 20px 60px rgba(0,0,0,0.55)'
    ].join(';');
    card.innerHTML = `
      <div style="padding:14px 18px;border-bottom:1px solid rgba(120,140,180,0.18);display:flex;align-items:center;gap:10px">
        <div style="font-size:20px;font-weight:700">📊 Live Ops — Analytics (DEV)</div>
        <div id="ap-envbadge" style="padding:2px 8px;border-radius:6px;background:#233;color:#8cf;font-size:11px;font-weight:600"></div>
        <div style="flex:1"></div>
        <button id="ap-close" style="background:transparent;border:1px solid #556;color:#ccd;padding:6px 12px;border-radius:8px;cursor:pointer">✕ Închide</button>
      </div>
      <div style="display:flex;gap:4px;padding:8px 12px;border-bottom:1px solid rgba(120,140,180,0.14)" id="ap-tabs"></div>
      <div id="ap-content" style="flex:1;overflow:auto;padding:14px 18px;font-size:13px;line-height:1.4"></div>
    `;
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    card.querySelector('#ap-close').addEventListener('click', hide);
    const envBadge = card.querySelector('#ap-envbadge');
    if (envBadge && envConfig) envBadge.textContent = envConfig.name.toUpperCase();
    _buildTabs();
    return overlay;
  }

  function _buildTabs() {
    const tabs = [
      { id: 'events',    label: '📃 Events' },
      { id: 'session',   label: '📈 Session' },
      { id: 'economy',   label: '💰 Economy' },
      { id: 'crashes',   label: '⚠️ Crashes' },
      { id: 'flags',     label: '🚩 Flags' }
    ];
    const bar = overlay.querySelector('#ap-tabs');
    bar.innerHTML = '';
    for (const t of tabs) {
      const b = document.createElement('button');
      b.textContent = t.label;
      b.dataset.tab = t.id;
      b.style.cssText = 'padding:6px 12px;border:none;background:transparent;color:#aab;cursor:pointer;font-size:13px;border-radius:6px';
      if (t.id === currentTab) { b.style.background = '#1a2a44'; b.style.color = '#8cf'; }
      b.addEventListener('click', () => { currentTab = t.id; _renderTabs(); _renderContent(); });
      bar.appendChild(b);
    }
  }

  function _renderTabs() {
    const bar = overlay.querySelector('#ap-tabs');
    for (const b of bar.querySelectorAll('button')) {
      if (b.dataset.tab === currentTab) { b.style.background = '#1a2a44'; b.style.color = '#8cf'; }
      else { b.style.background = 'transparent'; b.style.color = '#aab'; }
    }
  }

  function _esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

  function _renderContent() {
    const c = overlay.querySelector('#ap-content');
    if (currentTab === 'events') {
      const evts = analytics ? analytics.getEvents().slice(-100).reverse() : [];
      if (!evts.length) { c.innerHTML = '<div style="color:#889">Nu sunt evenimente.</div>'; return; }
      c.innerHTML = '<table style="width:100%;font-size:12px;border-collapse:collapse"><thead><tr style="color:#aac"><th style="text-align:left;padding:4px">Time</th><th style="text-align:left;padding:4px">Type</th><th style="text-align:left;padding:4px">Params</th></tr></thead><tbody>'
        + evts.map(e => `<tr style="border-top:1px solid #1e2938"><td style="padding:4px;color:#89a">${new Date(e.ts).toLocaleTimeString()}</td><td style="padding:4px;color:#8cf">${_esc(e.type)}</td><td style="padding:4px;color:#ccd"><code>${_esc(JSON.stringify(e.params || {}))}</code></td></tr>`).join('')
        + '</tbody></table>';
    } else if (currentTab === 'session') {
      const s = analytics ? analytics.getStats() : null;
      if (!s) { c.innerHTML = '<div style="color:#889">Analytics off.</div>'; return; }
      const top = Object.entries(s.typeCounts).sort((a,b)=>b[1]-a[1]).slice(0, 10);
      c.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:12px">
          <div style="background:#152232;padding:10px;border-radius:8px"><div style="color:#89a;font-size:11px">SESSION ID</div><div style="font-family:monospace;color:#8cf">${_esc(s.sessionId)}</div></div>
          <div style="background:#152232;padding:10px;border-radius:8px"><div style="color:#89a;font-size:11px">PLATFORM</div><div style="color:#8cf">${_esc(s.platform)}</div></div>
          <div style="background:#152232;padding:10px;border-radius:8px"><div style="color:#89a;font-size:11px">SESSION UPTIME</div><div style="color:#8cf">${Math.floor(s.sessionUptimeMs / 1000)}s</div></div>
          <div style="background:#152232;padding:10px;border-radius:8px"><div style="color:#89a;font-size:11px">TOTAL EVENTS</div><div style="color:#8cf">${s.totalEvents}</div></div>
        </div>
        <div style="color:#aac;margin-bottom:6px;font-size:12px">TOP EVENT TYPES</div>
        <table style="width:100%;font-size:12px"><tbody>${top.map(([k,v])=>`<tr><td style="padding:3px;color:#ccd">${_esc(k)}</td><td style="padding:3px;text-align:right;color:#8cf">${v}</td></tr>`).join('')}</tbody></table>
      `;
    } else if (currentTab === 'economy') {
      if (!economyMonitor) { c.innerHTML = '<div style="color:#889">EconomyMonitor absent.</div>'; return; }
      const snap = economyMonitor.getSnapshot();
      const anomalies = economyMonitor.getAnomalies();
      const balHtml = Object.entries(snap.balances).map(([k,v]) => `<tr><td style="padding:3px;color:#ccd">${_esc(k)}</td><td style="padding:3px;text-align:right;color:#8cf">${v}</td></tr>`).join('');
      const w24Html = Object.entries(snap.window24h).map(([cur,r]) => `<tr><td style="padding:3px;color:#ccd">${_esc(cur)}</td><td style="padding:3px;text-align:right;color:#8f8">+${r.earned}</td><td style="padding:3px;text-align:right;color:#f88">-${r.spent}</td><td style="padding:3px;text-align:right;color:#89a">${r.count}</td></tr>`).join('') || '<tr><td colspan="4" style="color:#889;padding:3px">-</td></tr>';
      const anHtml = anomalies.length ? anomalies.slice(-10).reverse().map(a => `<div style="padding:6px;background:#2a1616;border-radius:6px;margin-bottom:4px;color:#f88">${_esc(a.kind)} <code style="color:#ccd">${_esc(JSON.stringify(a.meta || {}))}</code></div>`).join('') : '<div style="color:#8a8">Nicio anomalie.</div>';
      c.innerHTML = `
        <div style="color:#aac;margin-bottom:6px;font-size:12px">BALANCES</div>
        <table style="width:100%;font-size:12px;margin-bottom:14px"><tbody>${balHtml}</tbody></table>
        <div style="color:#aac;margin-bottom:6px;font-size:12px">24H WINDOW</div>
        <table style="width:100%;font-size:12px;margin-bottom:14px"><thead><tr style="color:#89a"><th style="text-align:left;padding:3px">Resource</th><th style="text-align:right;padding:3px">Earned</th><th style="text-align:right;padding:3px">Spent</th><th style="text-align:right;padding:3px">Count</th></tr></thead><tbody>${w24Html}</tbody></table>
        <div style="color:#aac;margin-bottom:6px;font-size:12px">ANOMALIES</div>
        ${anHtml}
      `;
    } else if (currentTab === 'crashes') {
      if (!crashReporting) { c.innerHTML = '<div style="color:#889">Crash reporting absent.</div>'; return; }
      const crashes = crashReporting.getCrashes().slice(-20).reverse();
      if (!crashes.length) { c.innerHTML = '<div style="color:#8a8">Zero crashes. 🎉</div>'; return; }
      c.innerHTML = crashes.map(cr => `
        <details style="background:#1a1520;padding:10px;border-radius:8px;margin-bottom:6px;border:1px solid #3a2028">
          <summary style="cursor:pointer;color:#f88;font-weight:600">${_esc(cr.message.slice(0, 120))}</summary>
          <div style="margin-top:8px;font-size:11px;color:#89a">${new Date(cr.ts).toLocaleString()} · ${_esc(cr.source)} · ${_esc(cr.gameVersion || '?')}</div>
          <pre style="background:#0a0f18;padding:8px;border-radius:6px;margin-top:8px;max-height:180px;overflow:auto;font-size:11px;color:#ccd;white-space:pre-wrap">${_esc(cr.stack || '(no stack)')}</pre>
        </details>
      `).join('');
    } else if (currentTab === 'flags') {
      if (!featureFlagsSystem) { c.innerHTML = '<div style="color:#889">Feature flags absent.</div>'; return; }
      const flags = featureFlagsSystem.getAll();
      c.innerHTML = '<table style="width:100%;font-size:12px"><thead><tr style="color:#89a"><th style="text-align:left;padding:4px">Flag</th><th style="padding:4px">Default</th><th style="padding:4px">Value</th><th style="padding:4px">Toggle</th></tr></thead><tbody>'
        + Object.entries(flags).map(([k, m]) => `<tr style="border-top:1px solid #1e2938"><td style="padding:4px;color:#ccd">${_esc(k)}</td><td style="padding:4px;text-align:center;color:#889">${m.default ? 'ON' : 'OFF'}</td><td style="padding:4px;text-align:center;color:${m.value ? '#8f8' : '#f88'}">${m.value ? 'ON' : 'OFF'}</td><td style="padding:4px;text-align:center"><button data-flag="${_esc(k)}" style="padding:3px 10px;border-radius:5px;border:1px solid #556;background:#152232;color:#8cf;cursor:pointer;font-size:11px">Toggle</button></td></tr>`).join('')
        + '</tbody></table>';
      for (const btn of c.querySelectorAll('[data-flag]')) {
        btn.addEventListener('click', () => {
          const name = btn.dataset.flag;
          featureFlagsSystem.override(name, !featureFlagsSystem.isEnabled(name));
          _renderContent();
        });
      }
    }
  }

  function show() {
    _root();
    overlay.style.display = 'flex';
    visible = true;
    _renderContent();
  }

  function hide() {
    if (overlay) overlay.style.display = 'none';
    visible = false;
  }

  function toggle() { visible ? hide() : show(); }

  return { show, hide, toggle, isVisible: () => visible };
}
