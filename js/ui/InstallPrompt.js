// PWA Install Prompt — Android (beforeinstallprompt) + iOS fallback (share menu instructions).
// Requires createStandaloneDetection from systems/StandaloneDetection.js

export function createInstallPrompt({ standalone, analytics } = {}) {
  const supported = typeof document !== 'undefined';
  let deferredPrompt = null;
  let installBtn = null;
  let iosBanner = null;
  let dismissed = false;

  const DISMISS_KEY = 'snow-game:install-dismissed-v1';
  try { dismissed = localStorage.getItem(DISMISS_KEY) === '1'; } catch {}

  function _track(event, params) {
    try { analytics && analytics.track && analytics.track(event, params || {}); } catch {}
  }

  function _isStandalone() {
    if (!standalone) return false;
    try { return standalone.isStandalone(); } catch { return false; }
  }

  function _buildAndroidButton() {
    if (installBtn || !supported) return;
    installBtn = document.createElement('button');
    installBtn.type = 'button';
    installBtn.textContent = '📱 Instalează aplicația';
    installBtn.setAttribute('data-install-prompt', '1');
    installBtn.style.cssText = [
      'position:fixed',
      'bottom:calc(16px + env(safe-area-inset-bottom, 0px))',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:200',
      'padding:12px 18px',
      'border-radius:24px',
      'border:1px solid rgba(255,255,255,0.25)',
      'background:linear-gradient(135deg,#2a6dc0,#7ac0ff)',
      'color:#fff',
      'font-size:15px',
      'font-weight:600',
      'box-shadow:0 6px 18px rgba(0,0,0,0.4)',
      'cursor:pointer',
      'pointer-events:auto'
    ].join(';');
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      try {
        installBtn.disabled = true;
        _track('pwa_install_prompt_shown');
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        _track('pwa_install_prompt_choice', { outcome: choice && choice.outcome });
        deferredPrompt = null;
        _hide();
      } catch (err) {
        console.warn('[install] prompt failed', err);
        installBtn.disabled = false;
      }
    });
    document.body.appendChild(installBtn);
  }

  function _buildIosBanner() {
    if (iosBanner || !supported) return;
    iosBanner = document.createElement('div');
    iosBanner.setAttribute('data-install-ios', '1');
    iosBanner.style.cssText = [
      'position:fixed',
      'left:12px', 'right:12px',
      'bottom:calc(12px + env(safe-area-inset-bottom, 0px))',
      'z-index:200',
      'padding:12px 14px',
      'border-radius:14px',
      'background:rgba(20,26,38,0.94)',
      'color:#fff',
      'font-size:13px',
      'line-height:1.4',
      'border:1px solid rgba(255,255,255,0.15)',
      'box-shadow:0 8px 24px rgba(0,0,0,0.5)',
      'display:flex',
      'gap:10px',
      'align-items:center',
      'pointer-events:auto'
    ].join(';');
    iosBanner.innerHTML = [
      '<div style="flex:1">',
      '  <div style="font-weight:600;margin-bottom:2px">Instalează pe iPhone</div>',
      '  <div style="opacity:0.85">Apasă <span aria-label="Share">⬆️</span> apoi <b>Add to Home Screen</b></div>',
      '</div>',
      '<button type="button" data-install-close ',
      '  style="background:transparent;border:0;color:#fff;font-size:22px;cursor:pointer;padding:4px 8px">×</button>'
    ].join('');
    iosBanner.querySelector('[data-install-close]').addEventListener('click', () => {
      dismissed = true;
      try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
      _track('pwa_install_ios_dismissed');
      _hide();
    });
    document.body.appendChild(iosBanner);
  }

  function _show(mode) {
    if (dismissed || _isStandalone()) return;
    if (mode === 'android') _buildAndroidButton();
    else if (mode === 'ios') _buildIosBanner();
  }

  function _hide() {
    if (installBtn && installBtn.parentNode) installBtn.parentNode.removeChild(installBtn);
    if (iosBanner && iosBanner.parentNode) iosBanner.parentNode.removeChild(iosBanner);
    installBtn = null; iosBanner = null;
  }

  function install() {
    if (!supported) return;
    // Already installed → nothing to do
    if (_isStandalone()) return;

    // Chromium/Android path
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredPrompt = event;
      _show('android');
      _track('pwa_install_available', { mode: 'android' });
    });

    window.addEventListener('appinstalled', () => {
      _track('pwa_installed');
      dismissed = true;
      _hide();
    });

    // iOS Safari path (no beforeinstallprompt) — show helper after short delay
    if (standalone && standalone.isIOS() && standalone.isSafari() && !_isStandalone()) {
      setTimeout(() => _show('ios'), 4000);
    }
  }

  function dismiss() {
    dismissed = true;
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
    _hide();
  }

  return { install, dismiss, _hide };
}
