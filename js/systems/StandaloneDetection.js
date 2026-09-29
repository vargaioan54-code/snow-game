// Standalone / PWA install-state detection.
// - matchMedia('(display-mode: standalone)') → PWA installed and launched from home screen.
// - navigator.standalone (iOS Safari) → true when added to Home Screen.

export function createStandaloneDetection() {
  const supported = typeof window !== 'undefined';

  function isStandalone() {
    if (!supported) return false;
    try {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
      if (window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches) return true;
    } catch {}
    if (typeof window.navigator !== 'undefined' && window.navigator.standalone === true) return true;
    return false;
  }

  function isIOS() {
    if (!supported) return false;
    const ua = navigator.userAgent || '';
    const iOSPattern = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    return iOSPattern || iPadOS;
  }

  function isAndroid() {
    if (!supported) return false;
    return /Android/i.test(navigator.userAgent || '');
  }

  function isSafari() {
    if (!supported) return false;
    const ua = navigator.userAgent || '';
    return /Safari/.test(ua) && !/Chrome|CriOS|EdgiOS|FxiOS/.test(ua);
  }

  function applyStandaloneClass() {
    if (!supported || !document.body) return;
    document.body.classList.toggle('is-standalone', isStandalone());
    document.body.classList.toggle('is-ios', isIOS());
    document.body.classList.toggle('is-android', isAndroid());
  }

  function watch() {
    if (!supported) return () => {};
    let mql = null;
    try { mql = window.matchMedia('(display-mode: standalone)'); } catch {}
    const onChange = () => applyStandaloneClass();
    if (mql) {
      if (mql.addEventListener) mql.addEventListener('change', onChange);
      else if (mql.addListener) mql.addListener(onChange);
    }
    applyStandaloneClass();
    return () => {
      if (!mql) return;
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else if (mql.removeListener) mql.removeListener(onChange);
    };
  }

  return { isStandalone, isIOS, isAndroid, isSafari, applyStandaloneClass, watch };
}
