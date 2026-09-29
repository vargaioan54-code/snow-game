// Ecran de rezultate — apare cand gameState.screen == 'results_open'.
// Afiseaza rating, progres final, timp, reward.

const STYLE = `
#results-overlay {
  position: fixed; inset: 0; background: rgba(15,20,32,0.88);
  display: none; align-items: center; justify-content: center;
  z-index: 50; font: 400 14px system-ui, sans-serif; color: #fff;
}
#results-overlay.visible { display: flex; }
#results-overlay .panel {
  background: linear-gradient(180deg, #1c2434 0%, #232d42 100%);
  border: 2px solid rgba(255,205,80,0.5);
  border-radius: 18px; padding: 22px 28px;
  min-width: 320px; max-width: min(90vw, 480px);
  text-align: center;
  box-shadow: 0 12px 50px rgba(0,0,0,0.6);
  animation: results-in 0.35s ease-out;
}
#results-overlay .panel.failed {
  border-color: rgba(255,120,120,0.5);
}
@keyframes results-in {
  from { transform: scale(0.85) translateY(20px); opacity: 0; }
  to   { transform: scale(1) translateY(0); opacity: 1; }
}
#results-overlay .title { font-size: 22px; font-weight: 800; margin-bottom: 4px; letter-spacing: 0.5px; }
#results-overlay .subtitle { font-size: 13px; color: #cfd6e5; margin-bottom: 16px; }
#results-overlay .stars {
  font-size: 32px; letter-spacing: 4px; color: #ffd870;
  margin: 12px 0 20px; text-shadow: 0 2px 8px rgba(255,205,80,0.4);
}
#results-overlay .stats-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px;
  margin-bottom: 20px; text-align: left;
}
#results-overlay .stat-lbl { color: #a0a8ba; font: 600 11px system-ui; text-transform: uppercase; }
#results-overlay .stat-val { color: #fff; font: 700 15px system-ui; }
#results-overlay .rewards-section {
  background: rgba(255,255,255,0.05); border-radius: 10px;
  padding: 12px; margin-bottom: 18px;
}
#results-overlay .rewards-section h3 {
  margin: 0 0 8px; font: 700 11px system-ui; text-transform: uppercase;
  color: #ffd870; letter-spacing: 0.5px;
}
#results-overlay .reward-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 4px 0; font: 700 15px system-ui;
}
#results-overlay .reward-row.zero { opacity: 0.4; }
#results-overlay .actions {
  display: flex; gap: 10px;
}
#results-overlay .btn {
  flex: 1; padding: 11px 14px; border-radius: 10px; cursor: pointer;
  border: 1px solid rgba(255,255,255,0.2); background: #2a3244; color: #fff;
  font: 700 13px system-ui;
}
#results-overlay .btn.primary { background: #3f7b3f; border-color: #5da05d; }
#results-overlay .btn:hover { filter: brightness(1.2); }
`;

const SCREEN_RESULTS = 'results_open';
const SCREEN_PLAYING = 'playing';

function starString(n) {
  const r = Math.max(0, Math.min(5, n | 0));
  return '⭐'.repeat(r) + '☆'.repeat(5 - r);
}
function fmtTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss < 10 ? '0' : ''}${ss}`;
}

export function createContractResults(deps) {
  const { contractStore, gameState, contractPanel } = deps;

  if (!document.getElementById('results-style')) {
    const s = document.createElement('style');
    s.id = 'results-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  const root = document.createElement('div');
  root.id = 'results-overlay';
  document.body.appendChild(root);

  // Show current results whenever screen becomes results_open
  gameState.onKey('screen', (screen) => {
    if (screen === SCREEN_RESULTS) render();
    else root.classList.remove('visible');
  });

  function render() {
    // Ultimul contract COMPLETED sau FAILED
    const completed = contractStore.state.completed;
    const failed = contractStore.state.failed;
    let contract = null;
    // Preferam contractul care s-a incheiat cel mai recent (dupa completedAt)
    const all = [...completed.map(id => contractStore.state.contracts[id]),
                 ...failed.map(id => contractStore.state.contracts[id])];
    all.sort((a, b) => (b?.completedAt || 0) - (a?.completedAt || 0));
    contract = all[0];

    if (!contract) {
      root.classList.remove('visible');
      return;
    }

    const isSuccess = contract.status === 'completed';
    const rating = contract.rating || 0;
    const reward = contract.finalReward || { coins: 0, xp: 0, reputation: 0 };
    const elapsed = contract.startedAt && contract.completedAt
      ? (contract.completedAt - contract.startedAt) / 1000
      : 0;

    root.innerHTML = `
      <div class="panel ${isSuccess ? '' : 'failed'}">
        <div class="title">${isSuccess ? '🎉 CONTRACT COMPLETAT!' : '❌ CONTRACT ESUAT'}</div>
        <div class="subtitle">${contract.title} — ${contract.client}</div>

        ${isSuccess ? `<div class="stars">${starString(rating)}</div>` : ''}

        <div class="stats-grid">
          <div><div class="stat-lbl">Curatare</div><div class="stat-val">${Math.round((contract.progress || 0) * 100)}%</div></div>
          <div><div class="stat-lbl">Tinta</div><div class="stat-val">${Math.round(contract.targetPct * 100)}%</div></div>
          <div><div class="stat-lbl">Timp</div><div class="stat-val">${fmtTime(elapsed)}</div></div>
          <div><div class="stat-lbl">Limita</div><div class="stat-val">${contract.timeLimit > 0 ? fmtTime(contract.timeLimit) : '—'}</div></div>
          <div><div class="stat-lbl">Masa curatata</div><div class="stat-val">${(contract.massCleared || 0).toFixed(1)} kg</div></div>
          <div><div class="stat-lbl">Erori tool</div><div class="stat-val">${contract.rejectedByCompat || 0}</div></div>
        </div>

        <div class="rewards-section">
          <h3>Recompensa</h3>
          <div class="reward-row ${reward.coins ? '' : 'zero'}"><span>💰 Monede</span><span>+${reward.coins}</span></div>
          <div class="reward-row ${reward.xp ? '' : 'zero'}"><span>⭐ XP</span><span>+${reward.xp}</span></div>
          <div class="reward-row ${reward.reputation ? '' : 'zero'}"><span>📈 Reputatie</span><span>+${reward.reputation}</span></div>
        </div>

        <div class="actions">
          <button class="btn primary" data-a="continue">CONTINUA</button>
          <button class="btn" data-a="contracts">CONTRACTE</button>
        </div>
      </div>
    `;
    root.classList.add('visible');

    root.querySelectorAll('[data-a]').forEach(btn => {
      btn.addEventListener('click', () => {
        const a = btn.dataset.a;
        gameState.setScreen(SCREEN_PLAYING);
        root.classList.remove('visible');
        if (a === 'contracts' && contractPanel && typeof contractPanel.open === 'function') {
          contractPanel.open();
        }
      });
    });
  }

  return { render };
}
