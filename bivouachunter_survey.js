const SUPABASE_URL = 'https://cjkllrncwahcjnpwsbtb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_tbLChJpoydiXQxWczuIk-Q_L8_3cnk-';

function updateVal(input) {
  input.nextElementSibling.textContent = input.value;
}

function copyLink() {
  const url = 'https://vendulabezakova.github.io/bivouachunter-dotaznik/';
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById('btn-copy');
    btn.textContent = 'Odkaz zkopírován!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = 'Zkopírovat odkaz';
      btn.classList.remove('copied');
    }, 2500);
  });
}

// ─── opt highlight ─────────────────────────────────
document.querySelectorAll('.opt input').forEach(inp => {
  inp.addEventListener('change', () => {
    if (inp.type === 'radio') {
      document.querySelectorAll(`[name="${inp.name}"]`).forEach(i => {
        i.closest('.opt').classList.remove('selected');
      });
    }
    if (inp.checked) inp.closest('.opt').classList.add('selected');
    else inp.closest('.opt').classList.remove('selected');
  });
});

// ─── validation ────────────────────────────────────
const REQUIRED = ['q1', 'q_zk', 'q8', 'q9', 'q10'];

REQUIRED.forEach(name => {
  document.querySelectorAll(`[name="${name}"]`).forEach(inp => {
    inp.addEventListener('change', () => inp.closest('.q-block').classList.remove('invalid'));
  });
});

function validateForm(fd) {
  let firstInvalid = null;
  REQUIRED.forEach(name => {
    const block = document.querySelector(`[name="${name}"]`).closest('.q-block');
    if (!fd.get(name)) {
      block.classList.add('invalid');
      if (!firstInvalid) firstInvalid = block;
    } else {
      block.classList.remove('invalid');
    }
  });
  return firstInvalid;
}

// ─── form submit ───────────────────────────────────
document.getElementById('survey-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const fd = new FormData(this);

  const firstInvalid = validateForm(fd);
  if (firstInvalid) {
    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const resp = {};

  ['q1', 'q2', 'q8', 'q9', 'q10', 'q_zk'].forEach(k => { resp[k] = fd.get(k) || null; });

  resp.app_plan         = fd.getAll('app_plan');
  resp.app_plan_jine    = fd.get('app_plan_jine') || null;
  resp.app_teren        = fd.getAll('app_teren');
  resp.app_teren_jine   = fd.get('app_teren_jine') || null;
  resp.q_kde            = fd.getAll('q_kde');
  resp.q_kde_jine       = fd.get('q_kde_jine') || null;
  resp.q_trasy          = fd.getAll('q_trasy');
  resp.q_trasy_neistota = fd.get('q_trasy_neistota') || null;

  const params = ['p_pristresek','p_voda','p_orientace','p_vitr','p_pocasi','p_pesina','p_odlehlost','p_teren'];
  params.forEach(k => { resp[k] = parseInt(fd.get(k)) || 3; });

  resp.q6 = fd.get('q6') || null;
  resp.q7 = fd.get('q7') || null;

  const btn = this.querySelector('.btn-submit');
  btn.textContent = 'Odesílám…';
  btn.disabled = true;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(resp),
    });

    if (!res.ok) throw new Error(res.status);

    this.style.display = 'none';
    document.getElementById('success-msg').style.display = 'block';
  } catch {
    btn.textContent = 'Odeslat odpovědi →';
    btn.disabled = false;
    let errEl = document.getElementById('submit-error');
    if (!errEl) {
      errEl = document.createElement('p');
      errEl.id = 'submit-error';
      errEl.style.cssText = 'color:var(--terracotta);font-size:.85rem;margin-top:.8rem;text-align:center';
      btn.parentNode.appendChild(errEl);
    }
    errEl.textContent = 'Něco se pokazilo, zkus to znovu.';
  }
});
