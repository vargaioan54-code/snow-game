// ETAPA 16 — Performance HUD (debug only, F3 toggle sau ?perf=1).

export function createPerformanceHud({ performanceMonitor, qualitySystem, renderer } = {}) {
  let root = null;
  let visible = false;
  let intervalId = 0;

  function _build() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'perf-hud';
    root.style.cssText = [
      'position:fixed', 'top:6px', 'right:6px',
      'z-index:9200', 'display:none',
      'background:rgba(0,0,0,0.72)', 'color:#7fff7f',
      'font-family:monospace', 'font-size:11px',
      'padding:6px 8px', 'border-radius:6px',
      'line-height:1.3', 'pointer-events:none',
      'min-width:160px'
    ].join(';');
    document.body.appendChild(root);
    return root;
  }

  function _update() {
    if (!visible || !root) return;
    const stats = performanceMonitor ? performanceMonitor.getStats() : { avg: 0, last: 0, targetFps: 0 };
    const info = renderer && renderer.info ? renderer.info : null;
    const qual = qualitySystem ? qualitySystem.getCurrent() : null;
    const mem = (performance && performance.memory) ? performance.memory : null;
    const parts = [
      'FPS: ' + Math.round(stats.last) + ' (avg ' + Math.round(stats.avg) + '/' + stats.targetFps + ')',
      'Preset: ' + (qual ? qual.id : '?') + (qual && qual.manualOverride ? '*' : ''),
      'Viewport: ' + window.innerWidth + 'x' + window.innerHeight
    ];
    if (info && info.render) {
      parts.push('Calls: ' + info.render.calls);
      parts.push('Tris: ' + info.render.triangles);
    }
    if (mem) {
      const mb = (mem.usedJSHeapSize / 1024 / 1024).toFixed(1);
      parts.push('Heap: ' + mb + ' MB');
    }
    root.textContent = parts.join('\n');
    root.style.whiteSpace = 'pre';
  }

  function show() {
    _build();
    root.style.display = 'block';
    visible = true;
    if (!intervalId) intervalId = setInterval(_update, 500);
  }

  function hide() {
    if (root) root.style.display = 'none';
    visible = false;
    if (intervalId) { clearInterval(intervalId); intervalId = 0; }
  }

  function toggle() { if (visible) hide(); else show(); }

  return { show, hide, toggle, isVisible: () => visible };
}
