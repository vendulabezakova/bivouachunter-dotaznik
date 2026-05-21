// ─── storage ───────────────────────────────────────
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

// ─── nav ───────────────────────────────────────────
function showView(v) {
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('view-' + v).classList.add('active');
  event.target.classList.add('active');
  if (v === 'dashboard') renderDashboard();
}

// ─── slider labels ─────────────────────────────────
function updateVal(input) {
  input.nextElementSibling.textContent = input.value;
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

// ─── form submit ───────────────────────────────────
document.getElementById('survey-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const fd = new FormData(this);
  const resp = { ts: Date.now() };

  // radio
  ['q1','q2','q8','q9','q10'].forEach(k => { resp[k] = fd.get(k) || ''; });

  // checkboxes
  resp.app_plan  = fd.getAll('app_plan');
  resp.app_teren = fd.getAll('app_teren');

  // sliders
  const params = ['p_pristresek','p_voda','p_orientace','p_vitr','p_pocasi','p_pesina','p_odlehlost','p_teren'];
  params.forEach(k => { resp[k] = parseInt(fd.get(k)) || 3; });

  // open
  resp.q6 = fd.get('q6') || '';
  resp.q7 = fd.get('q7') || '';

  saveResponse(resp);

  this.style.display = 'none';
  document.getElementById('success-msg').style.display = 'block';
});

// ─── dashboard ─────────────────────────────────────
function renderDashboard() {
  const data = loadResponses();
  document.getElementById('resp-count').textContent = data.length + ' ' + plural(data.length, 'odpověď', 'odpovědi', 'odpovědí');

  if (!data.length) {
    document.getElementById('dash-empty').style.display = 'block';
    document.getElementById('dash-content').style.display = 'none';
    return;
  }
  document.getElementById('dash-empty').style.display = 'none';
  document.getElementById('dash-content').style.display = 'block';

  renderStats(data);
  renderCharts(data);
}

function plural(n, a, b, c) {
  if (n === 1) return a;
  if (n >= 2 && n <= 4) return b;
  return c;
}

function pct(count, total) {
  return total ? Math.round(count / total * 100) : 0;
}

function countValues(data, key) {
  const map = {};
  data.forEach(r => {
    const v = r[key];
    if (!v) return;
    if (Array.isArray(v)) v.forEach(x => { map[x] = (map[x]||0)+1; });
    else map[v] = (map[v]||0)+1;
  });
  return map;
}

function renderStats(data) {
  const n = data.length;

  const ios = data.filter(r => r.q8 === 'iPhone (iOS)').length;
  const offline_key = data.filter(r => r.q9 && r.q9.startsWith('Naprosto')).length;
  const wants = data.filter(r => r.q10 === 'Ano, hned').length;
  const freq = data.filter(r => r.q1 && (r.q1.includes('5–10') || r.q1.includes('Víc'))).length;

  const stats = [
    { label: 'CELKEM ODPOVĚDÍ', value: n, sub: 'unikátních respondentů' },
    { label: 'iOS UŽIVATELÉ', value: pct(ios,n) + '%', sub: `${ios} z ${n}` },
    { label: 'OFFLINE PRIORITA', value: pct(offline_key,n) + '%', sub: 'považuje offline za zásadní' },
    { label: 'ZÁJEM O APPKU', value: pct(wants,n) + '%', sub: 'by stáhlo hned' },
  ];

  document.getElementById('stats-grid').innerHTML = stats.map(s => `
    <div class="stat-card">
      <div class="label">${s.label}</div>
      <div class="value">${s.value}</div>
      <div class="sub">${s.sub}</div>
    </div>
  `).join('');
}

function renderCharts(data) {
  const n = data.length;
  const grid = document.getElementById('charts-grid');
  grid.innerHTML = '';

  // 1. Frekvence túr
  grid.appendChild(barCard('Frekvence túr', countValues(data,'q1'), n, false));

  // 2. iOS vs Android
  grid.appendChild(donutCard('Zařízení', countValues(data,'q8')));

  // 3. Důležitost parametrů
  grid.appendChild(heatCard(data));

  // 4. Appky při plánování
  grid.appendChild(barCard('Appky — plánování', countValues(data,'app_plan'), n, true));

  // 5. Appky v terénu
  grid.appendChild(barCard('Appky — v terénu', countValues(data,'app_teren'), n, true));

  // 6. Offline důležitost
  grid.appendChild(barCard('Offline funkčnost', countValues(data,'q9'), n, false));

  // 7. Zájem o appku
  grid.appendChild(barCard('Zájem o BivouacHunter', countValues(data,'q10'), n, false));

  // 8. Open answers
  grid.appendChild(quotesCard('Co chybí v současných appkách', data.map(r=>r.q6).filter(Boolean)));
  grid.appendChild(quotesCard('Nepříjemné zážitky v terénu', data.map(r=>r.q7).filter(Boolean), true));
}

function barCard(title, map, total, terra) {
  const sorted = Object.entries(map).sort((a,b) => b[1]-a[1]);
  const card = document.createElement('div');
  card.className = 'chart-card';
  card.innerHTML = `<h3>${title}</h3><div class="bar-list">${
    sorted.map(([k,v]) => `
      <div>
        <div class="bar-row">
          <span class="bar-label">${k}</span>
          <span class="bar-pct ${terra?'terra':''}">${pct(v,total)}%</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill ${terra?'terra':''}" style="width:${pct(v,total)}%"></div>
        </div>
      </div>
    `).join('')
  }</div>`;
  return card;
}

const COLORS = ['#2ecc7a','#1a9958','#d4603a','#7ab89a','#b84e2a','#4a8a6a','#e8906a'];

function donutCard(title, map) {
  const card = document.createElement('div');
  card.className = 'chart-card';
  const entries = Object.entries(map);
  const total = entries.reduce((s,[,v])=>s+v,0);

  let offset = 0;
  const cx = 60, cy = 60, r = 48, stroke = 22;
  const circ = 2 * Math.PI * r;

  const paths = entries.map(([k,v],i) => {
    const frac = v / total;
    const dash = frac * circ;
    const gap = circ - dash;
    const path = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
      stroke="${COLORS[i]}" stroke-width="${stroke}"
      stroke-dasharray="${dash} ${gap}"
      stroke-dashoffset="${-offset * circ}"
      transform="rotate(-90 ${cx} ${cy})"/>`;
    offset += frac;
    return path;
  }).join('');

  const legend = entries.map(([k,v],i) => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${COLORS[i]}"></div>
      <span style="color:var(--text-dim);font-size:.83rem">${k}</span>
      <span style="margin-left:auto;font-family:var(--mono);font-size:.78rem;color:${COLORS[i]}">${pct(v,total)}%</span>
    </div>
  `).join('');

  card.innerHTML = `<h3>${title}</h3>
    <div class="donut-wrap">
      <svg class="donut-svg" width="120" height="120" viewBox="0 0 120 120">${paths}</svg>
      <div class="donut-legend" style="flex:1">${legend}</div>
    </div>`;
  return card;
}

function heatCard(data) {
  const params = [
    { key: 'p_pristresek', label: 'Přístřešek' },
    { key: 'p_voda',       label: 'Pramen / voda' },
    { key: 'p_orientace',  label: 'Sv. strana' },
    { key: 'p_vitr',       label: 'Vítr' },
    { key: 'p_pocasi',     label: 'Srážky' },
    { key: 'p_pesina',     label: 'Blízkost pěšiny' },
    { key: 'p_odlehlost',  label: 'Odlehlost' },
    { key: 'p_teren',      label: 'Rovný terén' },
  ];

  const avgs = params.map(p => {
    const vals = data.map(r => r[p.key] || 0);
    const avg = vals.reduce((a,b)=>a+b,0) / vals.length;
    return { ...p, avg: Math.round(avg * 10) / 10 };
  }).sort((a,b) => b.avg - a.avg);

  const card = document.createElement('div');
  card.className = 'chart-card';

  const rows = avgs.map(p => {
    const pctVal = p.avg / 5 * 100;
    const hue = 120 * (p.avg / 5);
    const color = `hsl(${80 + hue * 0.4}, 60%, 55%)`;
    return `
      <div class="heat-row">
        <span class="heat-label">${p.label}</span>
        <div class="heat-track">
          <div class="heat-fill" style="width:${pctVal}%;background:${color}"></div>
        </div>
        <span class="heat-score" style="color:${color}">${p.avg}</span>
      </div>
    `;
  }).join('');

  card.innerHTML = `<h3>Důležitost parametrů (průměr 0–5)</h3><div class="heat-grid">${rows}</div>`;
  return card;
}

function quotesCard(title, quotes, terra = false) {
  const card = document.createElement('div');
  card.className = 'chart-card full-width';
  if (!quotes.length) {
    card.innerHTML = `<h3>${title}</h3><p style="color:var(--text-dim);font-size:.85rem">Zatím žádné odpovědi.</p>`;
    return card;
  }
  const items = quotes.slice(0,8).map(q =>
    `<div class="quote-item ${terra?'terra':''}">${q}</div>`
  ).join('');
  card.innerHTML = `<h3>${title}</h3><div class="quotes-list">${items}</div>`;
  return card;
}

// seed demo data for presentation
function seedDemo() {
  if (loadResponses().length > 0) return;
  const demo = [
    { ts: Date.now()-1e6, q1:'5–10× ročně', q2:'Pravidelně, je to záměr', q8:'iPhone (iOS)', q9:'Naprosto zásadní — bez signálu jsem často', q10:'Ano, hned', app_plan:['Mapy.cz','Komoot'], app_teren:['Mapy.cz'], p_pristresek:4, p_voda:5, p_orientace:2, p_vitr:3, p_pocasi:5, p_pesina:4, p_odlehlost:3, p_teren:4, q6:'Mapy.cz neumí filtrovat přístřešky, musím je hledat ručně.', q7:'Přišel jsem k přístřešku ve 20:00, byl obsazený. Musel jsem hledat náhradní místo za tmy.' },
    { ts: Date.now()-2e6, q1:'2–4× ročně', q2:'Občas, když vychází situace', q8:'Android', q9:'Důležitá, ale nějak se vždy domluvím', q10:'Záleží na ceně', app_plan:['AllTrails','Mapy.cz'], app_teren:['AllTrails'], p_pristresek:3, p_voda:4, p_orientace:3, p_vitr:2, p_pocasi:4, p_pesina:3, p_odlehlost:4, p_teren:3, q6:'AllTrails má skvělé trasy, ale nic o místech na spaní.', q7:'Terén byl podmáčený, netušil jsem to dopředu.' },
    { ts: Date.now()-3e6, q1:'Víc než 10× ročně', q2:'Pravidelně, je to záměr', q8:'iPhone (iOS)', q9:'Naprosto zásadní — bez signálu jsem často', q10:'Ano, hned', app_plan:['OsmAnd','Wikiloc'], app_teren:['OsmAnd'], p_pristresek:2, p_voda:5, p_orientace:4, p_vitr:4, p_pocasi:3, p_pesina:2, p_odlehlost:5, p_teren:4, q6:'OsmAnd je super offline ale složitý. Chybí mi filtrování spotů.', q7:'Počasí se otočilo, musel jsem změnit celou trasu. Neměl jsem zálohu B.' },
    { ts: Date.now()-4e6, q1:'5–10× ročně', q2:'Výjimečně, z nouze', q8:'Android', q9:'Nevadí mi — signál většinou mám', q10:'Záleží na ceně', app_plan:['Mapy.cz','Google Maps'], app_teren:['Mapy.cz'], p_pristresek:5, p_voda:3, p_orientace:1, p_vitr:2, p_pocasi:4, p_pesina:4, p_odlehlost:2, p_teren:3, q6:'Chtěl bych vidět přístřešky na mapě s detailem — kapacita, stav.', q7:'' },
    { ts: Date.now()-5e6, q1:'2–4× ročně', q2:'Občas, když vychází situace', q8:'iPhone (iOS)', q9:'Naprosto zásadní — bez signálu jsem často', q10:'Ano, hned', app_plan:['Komoot','Mapy.cz'], app_teren:['Komoot'], p_pristresek:3, p_voda:4, p_orientace:3, p_vitr:3, p_pocasi:5, p_pesina:3, p_odlehlost:3, p_teren:3, q6:'Komoot nefunguje offline spolehlivě.', q7:'Bloudila jsem hodinu protože mapy se nepřepnuly na offline mode.' },
  ];
  demo.forEach(saveResponse);
}

seedDemo();
