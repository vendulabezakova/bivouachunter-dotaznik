const STORAGE_KEY = 'bh_survey_responses';

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

document.getElementById('survey-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const fd = new FormData(this);
  const resp = { ts: Date.now() };

  ['q1','q2','q8','q9','q10','q_zk'].forEach(k => { resp[k] = fd.get(k) || ''; });

  resp.app_plan   = fd.getAll('app_plan');
  resp.app_teren  = fd.getAll('app_teren');
  resp.q_kde      = fd.getAll('q_kde');
  resp.q_kde_jine = fd.get('q_kde_jine') || '';

  const params = ['p_pristresek','p_voda','p_orientace','p_vitr','p_pocasi','p_pesina','p_odlehlost','p_teren'];
  params.forEach(k => { resp[k] = parseInt(fd.get(k)) || 3; });

  resp.q6 = fd.get('q6') || '';
  resp.q7 = fd.get('q7') || '';

  saveResponse(resp);

  this.style.display = 'none';
  document.getElementById('success-msg').style.display = 'block';
});
