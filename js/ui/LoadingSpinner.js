// ETAPA 16 — LoadingSpinner mic non-blocking.

export function createLoadingSpinner() {
  let root = null;
  let msgEl = null;

  function _build() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'loading-spinner';
    root.style.cssText = [
      'position:fixed', 'bottom:16px', 'left:50%',
      'transform:translateX(-50%)',
      'display:none', 'align-items:center', 'gap:10px',
      'padding:10px 16px', 'z-index:200',
      'background:rgba(20,26,38,0.85)',
      'color:#fff', 'border-radius:20px',
      'font-family:sans-serif', 'font-size:13px',
      'border:1px solid rgba(255,255,255,0.12)',
      'box-shadow:0 4px 14px rgba(0,0,0,0.35)'
    ].join(';');
    const spin = document.createElement('div');
    spin.style.cssText = 'width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,0.2);border-top-color:#4a9eff;animation:sp 0.9s linear infinite';
    const s = document.createElement('style');
    s.textContent = '@keyframes sp { to { transform: rotate(360deg); } }';
    root.appendChild(s);
    root.appendChild(spin);
    msgEl = document.createElement('span');
    msgEl.textContent = 'Loading…';
    root.appendChild(msgEl);
    document.body.appendChild(root);
    return root;
  }

  function show(message) {
    _build();
    if (msgEl) msgEl.textContent = message || 'Loading…';
    root.style.display = 'flex';
  }

  function hide() {
    if (root) root.style.display = 'none';
  }

  return { show, hide };
}
