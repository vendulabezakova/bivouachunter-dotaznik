const STORAGE_KEY = 'bh_survey_v2';

function loadResponses() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}
function saveResponse(r) {
  const arr = loadResponses();
  arr.push(r);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
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

function updateVal(input) {
  input.nextElementSibling.textContent = input.value;
}

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

document.getElementById('survey-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const fd = new FormData(this);

  const firstInvalid = validateForm(fd);
  if (firstInvalid) {
    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const resp = { ts: Date.now() };

  ['q1','q2','q8','q9','q10','q_zk'].forEach(k => { resp[k] = fd.get(k) || ''; });

  resp.q_trasy          = fd.getAll('q_trasy');
  resp.q_trasy_neistota = fd.get('q_trasy_neistota') || '';

  resp.app_plan       = fd.getAll('app_plan');
  resp.app_plan_jine  = fd.get('app_plan_jine') || '';
  resp.app_teren      = fd.getAll('app_teren');
  resp.app_teren_jine = fd.get('app_teren_jine') || '';
  resp.q_kde          = fd.getAll('q_kde');
  resp.q_kde_jine     = fd.get('q_kde_jine') || '';

  const params = ['p_pristresek','p_voda','p_orientace','p_vitr','p_pocasi','p_pesina','p_odlehlost','p_teren'];
  params.forEach(k => { resp[k] = parseInt(fd.get(k)) || 3; });

  resp.q6 = fd.get('q6') || '';
  resp.q7 = fd.get('q7') || '';

  saveResponse(resp);

  this.style.display = 'none';
  document.getElementById('success-msg').style.display = 'block';
});
