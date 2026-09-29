// ETAPA 19 — Version Management
// Versiuni independente: game / content / save / config
// Toate stores existente folosesc v:1 in SaveSystem — pentru referinta.

export const VERSION = Object.freeze({
  gameVersion: '1.0.0',
  contentVersion: '1.0.0',
  saveVersion: 1,
  configVersion: 1,
  buildTimestamp: '2026-09-29T00:00:00.000Z',
  buildNumber: 100
});

export function getVersionString() {
  return `${VERSION.gameVersion} (build ${VERSION.buildNumber})`;
}

export function getFullVersionSnapshot() {
  return {
    game:    VERSION.gameVersion,
    content: VERSION.contentVersion,
    save:    VERSION.saveVersion,
    config:  VERSION.configVersion,
    build:   VERSION.buildNumber,
    ts:      VERSION.buildTimestamp
  };
}
