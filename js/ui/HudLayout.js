// HudLayout v31 — mockup-based clean HUD (top-left cards, top-right pills, bottom bar, use btn)

export function createHudLayout({
  playerStore, contractStore, worldStore,
  settingsPanel, contractPanel, worldMapPanel, garagePanel, companyPanel,
  mobileMenuDrawer, audio, haptics
}) {

  document.body.classList.add('hud-mockup-active');

  const root = document.createElement('div');
  root.id = 'hud-mockup';
  root.innerHTML = `
    <div class="hud-topleft">
      <div class="hud-level-card">
        <div class="title">Level <span id="hud-level">1</span></div>
        <div class="xp-bar"><div class="xp-fill" id="hud-xp-fill" style="width:0%"></div></div>
        <div class="xp-text"><span id="hud-xp-cur">0</span> / <span id="hud-xp-max">100</span></div>
        <div class="subtitle">🌍 <span id="hud-location">Free Roam · Starter Village</span></div>
      </div>
      <div class="hud-job-card">
        <div class="icon">❄</div>
        <div class="body">
          <div class="job-title" id="hud-job-title">Curata toata harta</div>
          <div class="job-progress"><div class="job-fill" id="hud-job-fill" style="width:0%"></div></div>
          <div class="job-meta"><span id="hud-job-rate">0.6 mon/s</span><span id="hud-job-pct">0%</span></div>
        </div>
      </div>
    </div>

    <div class="hud-topright">
      <div class="hud-pill coins" title="Coins">
        <span class="icon">🪙</span>
        <span id="hud-coins">0</span>/<span id="hud-coins-max">1000</span>
      </div>
      <div class="hud-pill diamonds" title="Diamonds">
        <span class="icon">💎</span>
        <span id="hud-diamonds">0</span>
      </div>
      <button class="hud-icon-btn" id="hud-settings-btn" title="Settings">⚙</button>
    </div>

    <div class="hud-bottombar">
      <button class="bb-btn" id="bb-map" title="Map">🗺</button>
      <button class="bb-btn" id="bb-contracts" title="Contracts">📋</button>
      <button class="bb-btn" id="bb-garage" title="Garage">🚛</button>
      <button class="bb-btn" id="bb-company" title="Company">🏢</button>
      <button class="bb-btn" id="bb-menu" title="Menu">☰</button>
    </div>

    <button class="hud-use-btn" id="hud-use-btn" title="Use / Sprint">
      <span class="icon">🏃</span>
      <span class="label">Use</span>
    </button>
  `;
  document.body.appendChild(root);

  function tap(el, fn) {
    if (!el) return;
    el.addEventListener('click', () => {
      try { haptics?.pattern?.('success') || haptics?.light?.(); } catch (_) {}
      try { audio?.tick?.(); } catch (_) {}
      fn();
    });
  }

  tap(root.querySelector('#bb-map'), () => worldMapPanel?.toggle?.());
  tap(root.querySelector('#bb-contracts'), () => contractPanel?.toggle?.());
  tap(root.querySelector('#bb-garage'), () => garagePanel?.toggle?.());
  tap(root.querySelector('#bb-company'), () => companyPanel?.toggle?.());
  tap(root.querySelector('#bb-menu'), () => mobileMenuDrawer?.toggle?.() || mobileMenuDrawer?.open?.());
  tap(root.querySelector('#hud-settings-btn'), () => settingsPanel?.toggle?.() || settingsPanel?.open?.());

  const useBtn = root.querySelector('#hud-use-btn');
  useBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try { haptics?.pattern?.('success'); } catch (_) {}
    window.dispatchEvent(new CustomEvent('hud:use:down'));
  });
  useBtn.addEventListener('pointerup', (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('hud:use:up'));
  });
  useBtn.addEventListener('pointercancel', () => {
    window.dispatchEvent(new CustomEvent('hud:use:up'));
  });

  const $level = root.querySelector('#hud-level');
  const $xpFill = root.querySelector('#hud-xp-fill');
  const $xpCur = root.querySelector('#hud-xp-cur');
  const $xpMax = root.querySelector('#hud-xp-max');
  const $coins = root.querySelector('#hud-coins');
  const $coinsMax = root.querySelector('#hud-coins-max');
  const $diamonds = root.querySelector('#hud-diamonds');
  const $location = root.querySelector('#hud-location');
  const $jobFill = root.querySelector('#hud-job-fill');
  const $jobPct = root.querySelector('#hud-job-pct');
  const $jobRate = root.querySelector('#hud-job-rate');
  const $jobTitle = root.querySelector('#hud-job-title');

  function xpForLevel(level) {
    return 100 * Math.pow(1.5, Math.max(0, level - 1));
  }

  function refresh() {
    const p = playerStore?.state || {};
    const level = p.level || 1;
    const xp = p.xp || 0;
    const xpMax = xpForLevel(level);
    $level.textContent = level;
    $xpCur.textContent = Math.floor(xp);
    $xpMax.textContent = Math.floor(xpMax);
    $xpFill.style.width = Math.min(100, (xp / xpMax) * 100) + '%';

    $coins.textContent = Math.floor(p.bagCoins || 0);
    const bagCap = (p.bagCap || 1000);
    $coinsMax.textContent = Math.floor(bagCap);
    $diamonds.textContent = Math.floor(p.diamonds || 0);

    try {
      const w = worldStore?.state || {};
      const region = w.currentRegion || 'starter_village';
      const label = String(region).replace(/_/g, ' ').replace(/\b\w/g, s => s.toUpperCase());
      $location.textContent = `Free Roam · ${label}`;
    } catch (_) {}

    try {
      const active = contractStore?.state?.activeId ? contractStore?.state?.contracts?.find(c => c.id === contractStore.state.activeId) : null;
      if (active) {
        $jobTitle.textContent = active.title || 'Contract activ';
        const pct = Math.min(100, Math.max(0, (active.progress || 0) * 100));
        $jobFill.style.width = pct + '%';
        $jobPct.textContent = Math.floor(pct) + '%';
        $jobRate.textContent = ((active.rewardCoins || 0) / Math.max(1, active.timeLimit || 60)).toFixed(1) + ' mon/s';
      } else {
        $jobTitle.textContent = 'Curata toata harta';
        const stats = p.stats || {};
        const cleared = stats.totalSnowCleared || 0;
        const target = 100000;
        const pct = Math.min(100, (cleared / target) * 100);
        $jobFill.style.width = pct + '%';
        $jobPct.textContent = Math.floor(pct) + '%';
        $jobRate.textContent = '0.6 mon/s';
      }
    } catch (_) {}
  }

  refresh();
  const unsubs = [];
  try {
    unsubs.push(playerStore?.on?.(refresh));
    unsubs.push(contractStore?.on?.(refresh));
    unsubs.push(worldStore?.on?.(refresh));
  } catch (_) {}

  setInterval(refresh, 500);

  return {
    refresh,
    destroy() {
      unsubs.forEach(u => { try { u?.(); } catch (_) {} });
      root.remove();
      document.body.classList.remove('hud-mockup-active');
    }
  };
}
