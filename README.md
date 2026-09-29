# Snow Game — Winter Work Simulator

3D browser game (Three.js vanilla, no build tool). Snow clearing / winter work simulator with progression: clear snow → earn coins → upgrade tools → contracts → vehicles → company → employees → fleet → prestige → endgame.

## Live
- Production: https://snow-game-five.vercel.app
- QA Debug Menu: https://snow-game-five.vercel.app/?qa=1&debug=1&env=development

## Stack
- Three.js (vendored in `js/lib/`, no build tool)
- ES Modules with manual cache-busting (`?v=30`)
- Python `http.server` for local dev on port 8123
- PWA (manifest + service worker + install prompt)
- Deployed on Vercel

## Structure
```
snow-game/
├── index.html              # Entry point + inline CSS + meta tags PWA
├── manifest.webmanifest    # PWA manifest
├── sw.js                   # Service worker (offline cache)
├── icons/                  # PWA icons (SVG)
├── css/ui.css              # Main stylesheet
├── assets/                 # 3D models + textures
└── js/
    ├── main.js             # Orchestration (~1700 LOC)
    ├── character.js        # Character controller
    ├── controls.js         # Input (keyboard + touch)
    ├── environment.js      # Snow field + world setup
    ├── snowfall.js         # Snow accumulation FX
    ├── effects.js          # Particles + FX
    ├── tools.js            # Tool logic
    ├── config/             # Game config (tools, contracts, vehicles, weather, prestige, etc.)
    ├── state/              # Reactive stores (17 stores with sanitize + hydrate + persist)
    ├── systems/            # ~35 systems (Economy, ContractSystem, VehicleSystem, etc.)
    ├── ui/                 # ~25 UI panels
    ├── vehicles/           # Vehicle definitions
    ├── utils/              # BufferGeometryUtils shim
    └── lib/                # Vendored Three.js + GLTFLoader
```

## Development
```bash
# Start local server
python -m http.server 8123 --directory C:\Users\Ioan Varga\Desktop\snow-game

# Open http://localhost:8123
```

## Debug tools
- URL param `?debug=1` → exposes `window.dbg.*` (Economy, Contract, Vehicle, etc.)
- URL param `?qa=1` → shows QA Debug Menu button
- Keyboard shortcut `Ctrl+Shift+Q` → toggle QA Debug Menu
- Keyboard shortcut `F3` → toggle Performance HUD
- Keyboard shortcut `F4` → toggle Analytics Panel (dev)

## Roadmap (all stages complete)
- ✅ Etape 1-11: Core gameplay (snow, contracts, world, weather, vehicles, garage, company, employees, fleet, missions, events)
- ✅ Etapa 12: Monetization (mock IAP)
- ✅ Etapa 13: Social (mock backend)
- ✅ Etapa 14: Multiplayer (mock backend)
- ✅ Etapa 15: Prestige + Endgame
- ✅ Etapa 16: Polish + Mobile Optimization (quality, touch controls, battery saver, orientation)
- ✅ Etapa 17: QA / Testing
- ✅ Etapa 19: Live Operations (versioning, save migration, feature flags, analytics buffer, crash reporting)
- ✅ Mobile hardening: PWA manifest + service worker + install prompt + safe-area
- ✅ Layout v29: HUD zones + touch mode drawer

## Blocked (require external backend)
- Real IAP (Apple / Google)
- Real Multiplayer sync (WebSocket + game server)
- Real Social auth + friends + leaderboards
- Real analytics send (Firebase / GA4)
- Real crash reporting (Sentry)
- Real remote config
- Push notifications

## License
Personal project — not for redistribution.
