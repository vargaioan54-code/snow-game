// ETAPA 16 — Error recovery: buffer erori + overlay „Eroare recuperabilă".
// Nu spamma banner-uri (dedupe pe error message + cooldown).

export function createErrorRecoverySystem({ transactionLog } = {}) {
  const MAX_ERRORS = 10;
  const errors = [];  // {ts, message, stack, source}
  const seen = new Map(); // message -> lastShownAt
  let overlay = null;
  let overlayVisible = false;
  let selfErrorCount = 0;
  const SELF_ERROR_LIMIT = 3;
  let resumeCallback = null;

  function _dedupOk(message) {
    const now = Date.now();
    const last = seen.get(message);
    if (last && now - last < 5000) return false;
    seen.set(message, now);
    return true;
  }

  function log(err, source = 'unknown') {
    try {
      const message = (err && err.message) ? String(err.message) : String(err);
      const stack = (err && err.stack) ? String(err.stack) : '';
      errors.push({ ts: Date.now(), message, stack, source });
      if (errors.length > MAX_ERRORS) errors.shift();
      if (transactionLog && typeof transactionLog.log === 'function') {
        try { transactionLog.log({ type: 'ERROR_RECOVERED', meta: { message: message.slice(0, 200), source } }); } catch {}
      }
      return message;
    } catch { return String(err); }
  }

  function _buildOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'error-recovery-overlay';
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:9999',
      'display:none', 'align-items:center', 'justify-content:center',
      'background:rgba(0,0,0,0.72)',
      'font-family:sans-serif'
    ].join(';');
    const card = document.createElement('div');
    card.style.cssText = [
      'background:#1a2130', 'color:#fff',
      'border-radius:12px', 'padding:20px 24px',
      'max-width:520px', 'width:90%',
      'border:1px solid rgba(255,120,80,0.45)',
      'box-shadow:0 12px 40px rgba(0,0,0,0.5)'
    ].join(';');
    card.innerHTML = ''
      + '<div style="font-size:20px;font-weight:700;margin-bottom:10px;color:#ff9060;">⚠️ Eroare recuperabilă</div>'
      + '<div id="err-msg" style="margin-bottom:14px;line-height:1.4;color:#ddd;font-size:14px"></div>'
      + '<details id="err-details" style="margin-bottom:14px;color:#aaa;font-size:12px"><summary style="cursor:pointer">Detalii tehnice</summary><pre id="err-stack" style="white-space:pre-wrap;max-height:180px;overflow:auto;background:#0a0f18;padding:8px;border-radius:6px;margin-top:8px"></pre></details>'
      + '<div style="display:flex;gap:8px;justify-content:flex-end">'
      +   '<button id="err-continue" style="padding:8px 14px;border-radius:8px;border:1px solid #4a9eff;background:transparent;color:#4a9eff;cursor:pointer">Continuă</button>'
      +   '<button id="err-reload" style="padding:8px 14px;border-radius:8px;border:none;background:#ff6040;color:#fff;cursor:pointer">Reîncarcă</button>'
      + '</div>';
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    overlay.querySelector('#err-continue').addEventListener('click', () => {
      hide();
      try { if (typeof resumeCallback === 'function') resumeCallback(); } catch {}
    });
    overlay.querySelector('#err-reload').addEventListener('click', () => {
      try { window.location.reload(); } catch {}
    });
    return overlay;
  }

  function show(err, source, resume) {
    try {
      const message = log(err, source);
      if (!_dedupOk(message)) return;
      resumeCallback = resume || null;
      _buildOverlay();
      const msgEl = overlay.querySelector('#err-msg');
      const stackEl = overlay.querySelector('#err-stack');
      if (msgEl) msgEl.textContent = message;
      if (stackEl) stackEl.textContent = (err && err.stack) || '(no stack)';
      overlay.style.display = 'flex';
      overlayVisible = true;
    } catch (selfErr) {
      selfErrorCount++;
      if (selfErrorCount >= SELF_ERROR_LIMIT) {
        try { window.location.reload(); } catch {}
      }
    }
  }

  function hide() {
    if (overlay) overlay.style.display = 'none';
    overlayVisible = false;
  }

  function wrap(fn, source = 'wrapped') {
    return function(...args) {
      try { return fn.apply(this, args); }
      catch (err) { show(err, source); return null; }
    };
  }

  function install() {
    if (typeof window === 'undefined') return;
    window.addEventListener('error', (ev) => {
      log(ev.error || ev.message, 'window.error');
    });
    window.addEventListener('unhandledrejection', (ev) => {
      log(ev.reason || 'unhandled promise', 'unhandledrejection');
    });
  }

  return {
    log,
    show,
    hide,
    wrap,
    install,
    getErrors: () => errors.slice(),
    isVisible: () => overlayVisible
  };
}
