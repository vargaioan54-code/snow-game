// Etapa 8 — CompanyCreationModal
// Full-screen overlay dark. Arătat la boot dacă !companySystem.isCreated().

import { validateCompanyName, randomCompanyName } from '../config/company.js';

const STYLE = `
#company-create-overlay {
  position: fixed; inset: 0; background: rgba(10,14,22,0.92);
  display: flex; align-items: center; justify-content: center;
  z-index: 100; font: 400 14px system-ui, sans-serif; color: #fff;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}
#company-create-overlay .panel {
  background: linear-gradient(180deg, #1c2434 0%, #131a26 100%);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 18px; padding: 32px 36px; min-width: 360px; max-width: 92vw;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
  text-align: center;
}
#company-create-overlay .icon { font-size: 48px; margin-bottom: 8px; }
#company-create-overlay h2 { margin: 0 0 8px; font-size: 22px; font-weight: 700; letter-spacing: 0.4px; }
#company-create-overlay .sub { color: #8a94aa; font-size: 13px; margin-bottom: 22px; }
#company-create-overlay input.name {
  width: 100%; padding: 14px 16px; font: 600 16px system-ui;
  background: #0f1520; color: #fff; border: 2px solid #2a3244; border-radius: 10px;
  outline: none; box-sizing: border-box; margin-bottom: 6px;
}
#company-create-overlay input.name:focus { border-color: #3fd8ff; }
#company-create-overlay .meta {
  display: flex; justify-content: space-between; font-size: 12px;
  margin-bottom: 20px;
}
#company-create-overlay .meta .count { color: #8a94aa; }
#company-create-overlay .meta .msg.ok { color: #3ea862; }
#company-create-overlay .meta .msg.err { color: #e04040; }
#company-create-overlay .actions { display: flex; gap: 10px; }
#company-create-overlay button.btn {
  flex: 1; padding: 12px 16px; border-radius: 10px; cursor: pointer;
  border: 1px solid rgba(255,255,255,0.2); background: #2a3244; color: #fff;
  font: 600 14px system-ui; transition: filter 0.15s;
}
#company-create-overlay button.btn.primary { background: #3fd8ff; color: #0a0e18; border-color: #3fd8ff; }
#company-create-overlay button.btn.primary:disabled { background: #2a3244; color: #4a5468; border-color: #2a3244; cursor: not-allowed; }
#company-create-overlay button.btn:hover:not(:disabled) { filter: brightness(1.2); }
`;

export function createCompanyCreationModal(companySystem, onComplete) {
  let root = null;
  let input = null;
  let msg = null;
  let count = null;
  let btnCreate = null;

  function injectStyle() {
    if (document.getElementById('company-create-style')) return;
    const s = document.createElement('style');
    s.id = 'company-create-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function reasonToText(reason) {
    switch (reason) {
      case 'too_short': return 'Prea scurt (minim 3 caractere)';
      case 'too_long': return 'Prea lung (maxim 30 caractere)';
      case 'no_letters': return 'Trebuie să conțină cel puțin o literă';
      case 'not_string': return 'Nume invalid';
      case 'already_created': return 'Companie deja fondată';
      default: return 'Nume invalid';
    }
  }

  function updateValidation() {
    const v = validateCompanyName(input.value);
    count.textContent = input.value.length + ' / 30';
    if (v.ok) {
      msg.textContent = '✓ OK';
      msg.className = 'msg ok';
      btnCreate.disabled = false;
    } else {
      msg.textContent = reasonToText(v.reason);
      msg.className = 'msg err';
      btnCreate.disabled = true;
    }
  }

  function build() {
    if (root) return root;
    injectStyle();
    root = document.createElement('div');
    root.id = 'company-create-overlay';
    root.innerHTML = `
      <div class="panel">
        <div class="icon">🏢</div>
        <h2>Fondează compania ta</h2>
        <div class="sub">Alege un nume. Îl poți schimba oricând din meniul companiei.</div>
        <input class="name" type="text" maxlength="30" placeholder="Numele companiei" autocomplete="off" />
        <div class="meta">
          <span class="count">0 / 30</span>
          <span class="msg err">Prea scurt (minim 3 caractere)</span>
        </div>
        <div class="actions">
          <button class="btn" data-a="random">🎲 Aleator</button>
          <button class="btn primary" data-a="create" disabled>CREEAZĂ</button>
        </div>
      </div>
    `;
    document.body.appendChild(root);

    input = root.querySelector('input.name');
    msg = root.querySelector('.msg');
    count = root.querySelector('.count');
    btnCreate = root.querySelector('[data-a="create"]');

    input.addEventListener('input', updateValidation);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !btnCreate.disabled) tryCreate();
    });

    root.querySelector('[data-a="random"]').addEventListener('click', () => {
      input.value = randomCompanyName();
      updateValidation();
      input.focus();
    });

    btnCreate.addEventListener('click', tryCreate);

    // Focus input
    setTimeout(() => input.focus(), 100);
    return root;
  }

  function tryCreate() {
    const r = companySystem.createCompany(input.value);
    if (r.ok) {
      close();
      if (typeof onComplete === 'function') onComplete();
    } else {
      msg.textContent = reasonToText(r.reason);
      msg.className = 'msg err';
    }
  }

  function open() {
    build();
    root.style.display = 'flex';
  }

  function close() {
    if (root) root.style.display = 'none';
  }

  return { open, close };
}
