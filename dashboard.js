const SUPABASE_URL = 'https://cjkllrncwahcjnpwsbtb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_tbLChJpoydiXQxWczuIk-Q_L8_3cnk-';

async function loadResponses() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/responses?select=*&order=created_at.asc`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
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

async function renderDashboard() {
  document.getElementById('dash-empty').style.display = 'none';
  document.getElementById('dash-content').style.display = 'none';
  document.getElementById('resp-count').textContent = 'Načítám…';

  const data = await loadResponses();
  const n = data.length;

  document.getElementById('resp-count').textContent = n + ' ' + plural(n, 'odpověď', 'odpovědi', 'odpovědí');

  if (!n) {
    document.getElementById('dash-empty').style.display = 'block';
    return;
  }

  document.getElementById('dash-content').style.display = 'block';
  renderStats(data);
  renderCharts(data);
}

function renderStats(data) {
  const n = data.length;
  const ios = data.filter(r => r.q8 === 'iPhone (iOS)').length;
  const offline_key = data.filter(r => r.q9 && r.q9.startsWith('Naprosto')).length;
  const wants = data.filter(r => r.q10 === 'Ano, hned').length;

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

  grid.appendChild(barCard('Frekvence túr', countValues(data,'q1'), n, false));
  grid.appendChild(barCard('Úroveň zkušeností', countValues(data,'q_zk'), n, false));
  grid.appendChild(barCard('Kde bivakují', countValues(data,'q_kde'), n, true));
  grid.appendChild(barCard('Absolvované trasy', countValues(data,'q_trasy'), n, true));
  grid.appendChild(donutCard('Zařízení', countValues(data,'q8')));
  grid.appendChild(heatCard(data));
  grid.appendChild(barCard('Appky — plánování', countValues(data,'app_plan'), n, true));
  grid.appendChild(barCard('Appky — v terénu', countValues(data,'app_teren'), n, true));
  grid.appendChild(barCard('Offline funkčnost', countValues(data,'q9'), n, false));
  grid.appendChild(barCard('Zájem o BivouacHunter', countValues(data,'q10'), n, false));
  grid.appendChild(quotesCard('Co chybí v současných appkách', data.map(r=>r.q6).filter(Boolean)));
  grid.appendChild(quotesCard('Nepříjemné zážitky v terénu', data.map(r=>r.q7).filter(Boolean), true));
  grid.appendChild(quotesCard('Nejisté místo na trase', data.map(r=>r.q_trasy_neistota).filter(Boolean), true));
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

renderDashboard();
