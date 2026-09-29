// ETAPA 16 — Splash screen cu progress bar + fade out.
// Auto-timeout la 30s cu buton Reîncarcă.

export function createSplashScreen() {
  let root = null;
  let bar = null;
  let text = null;
  let subText = null;
  let visible = false;
  let progressPct = 0;
  let timeoutId = null;
  let errorState = false;

  function _build() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'splash-screen';
    root.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:10000',
      'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center',
      'background:linear-gradient(180deg,#0a0e16 0%,#1a2130 100%)',
      'color:#fff', 'font-family:sans-serif',
      'transition:opacity 500ms ease',
      'opacity:1'
    ].join(';');
    const inner = document.createElement('div');
    inner.style.cssText = 'text-align:center;padding:24px;max-width:420px;width:80%';
    inner.innerHTML = ''
      + '<div style="font-size:64px;margin-bottom:16px;">❄️</div>'
      + '<div style="font-size:26px;font-weight:700;letter-spacing:1px">SNOW CLEAR</div>'
      + '<div id="splash-sub" style="font-size:13px;color:#6b7a90;margin-top:6px">Winter Work Simulator</div>'
      + '<div style="width:100%;height:6px;background:rgba(255,255,255,0.08);border-radius:3px;margin-top:36px;overflow:hidden">'
      +   '<div id="splash-bar" style="width:0%;height:100%;background:linear-gradient(90deg,#4a9eff,#20d0e0);transition:width 300ms ease"></div>'
      + '</div>'
      + '<div id="splash-text" style="margin-top:14px;font-size:13px;color:#aab">Loading… 0%</div>'
      + '<button id="splash-reload" style="margin-top:22px;display:none;padding:8px 18px;background:#ff6040;border:none;border-radius:8px;color:#fff;cursor:pointer">Reîncarcă</button>';
    root.appendChild(inner);
    document.body.appendChild(root);
    bar = root.querySelector('#splash-bar');
    text = root.querySelector('#splash-text');
    subText = root.querySelector('#splash-sub');
    root.querySelector('#splash-reload').addEventListener('click', () => {
      try { window.location.reload(); } catch {}
    });
    return root;
  }

  function show() {
    _build();
    root.style.display = 'flex';
    root.style.opacity = '1';
    visible = true;
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      if (visible && progressPct >= 100) {
        _showError('Blocat la finalizare — reîncarcă pagina');
      }
    }, 30000);
  }

  function setProgress(pct, message) {
    _build();
    progressPct = Math.max(0, Math.min(100, Number(pct) || 0));
    if (bar) bar.style.width = progressPct + '%';
    if (text) text.textContent = (message || 'Loading…') + ' ' + Math.round(progressPct) + '%';
  }

  function _showError(msg) {
    _build();
    errorState = true;
    if (text) text.innerHTML = '<span style="color:#ff8060">' + (msg || 'Eroare la boot') + '</span>';
    const btn = root.querySelector('#splash-reload');
    if (btn) btn.style.display = 'inline-block';
    if (subText) subText.textContent = 'Eroare';
  }

  function showError(msg) { _showError(msg); show(); }

  function hide() {
    if (!root) return;
    root.style.opacity = '0';
    setTimeout(() => {
      if (root && root.style.opacity === '0') root.style.display = 'none';
    }, 550);
    visible = false;
    if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
  }

  return { show, hide, setProgress, showError, isVisible: () => visible, getProgress: () => progressPct };
}
