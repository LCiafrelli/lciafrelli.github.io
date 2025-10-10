/* ================================
   Homework 2 Interactions (Part A & B)
   Author: Lorenzo Ciafrelli
   ================================ */

/* ---------- Utilities ---------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* Basic CSV parser (handles commas and simple quotes) */
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = splitCSVLine(lines[0]);
  const rows = lines.slice(1).map(line => {
    const values = splitCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i] ?? "");
    return obj;
  });
  return { headers, rows };
}

function splitCSVLine(line) {
  const out = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i+1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      out.push(current); current = '';
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out.map(s => s.trim());
}

/* Create DOM nodes */
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  });
  children.forEach(c => node.appendChild(c));
  return node;
}

/* Download helper */
function downloadBlob(content, filename, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

/* ---------- Part A: Dataset & Distributions ---------- */

const SAMPLE_CSV = `Department,Age,LoginFailures,MalwareDetected
IT,22,1,No
IT,25,0,No
HR,41,2,No
HR,38,0,No
Finance,45,4,Yes
IT,29,3,No
Operations,50,2,Yes
Operations,33,1,No
Finance,37,0,No
IT,27,1,No
HR,29,0,No
Operations,44,5,Yes
Finance,31,1,No
IT,35,0,No
IT,39,2,No
HR,26,0,No
Finance,42,3,Yes
Operations,28,0,No
Finance,36,2,No
IT,23,1,No
`;

let A_data = { headers: [], rows: [] };

function initPartA() {
  const fileInput = $('#csvFile');
  const btnLoadSample = $('#btnLoadSample');
  const btnDownloadSample = $('#btnDownloadSample');
  const btnClearData = $('#btnClearData');
  const btnComputeUni = $('#btnComputeUni');
  const varChecklist = $('#varChecklist');
  const biVarX = $('#biVarX');
  const biVarY = $('#biVarY');
  const btnComputeBi = $('#btnComputeBi');

  if (!fileInput) return; // not on this page

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    A_data = parseCSV(text);
    renderVarChecklist();
    populateBiVars();
  });

  btnLoadSample.addEventListener('click', () => {
    A_data = parseCSV(SAMPLE_CSV);
    renderVarChecklist();
    populateBiVars();
  });

  btnDownloadSample.addEventListener('click', () => {
    downloadBlob(SAMPLE_CSV, 'sample_usersecurity.csv', 'text/csv');
  });

  btnClearData.addEventListener('click', () => {
    A_data = { headers: [], rows: [] };
    varChecklist.innerHTML = 'No data loaded yet.';
    $('#uniOutputs').innerHTML = '';
    $('#biOutput').innerHTML = '';
    biVarX.innerHTML = ''; biVarY.innerHTML = '';
    btnComputeUni.disabled = true;
    btnComputeBi.disabled = true;
  });

  btnComputeUni.addEventListener('click', () => {
    const selected = $$('input[name="uni-var"]:checked').map(x => x.value);
    if (!selected.length || selected.length > 3) {
      alert('Select up to 3 variables.'); return;
    }
    computeAndRenderUnivariate(selected);
  });

  btnComputeBi.addEventListener('click', () => {
    const x = biVarX.value, y = biVarY.value;
    if (!x || !y || x === y) { alert('Choose two different variables.'); return; }
    renderCrosstab(x, y);
  });

  function renderVarChecklist() {
    if (!A_data.headers.length) { varChecklist.innerHTML = 'No data loaded yet.'; return; }
    const frag = document.createDocumentFragment();
    A_data.headers.forEach(h => {
      const id = `chk_${h}`;
      const wrapper = el('label', { class:'block control subtle' }, [
        el('input', { type:'checkbox', id, name:'uni-var', value:h }),
        document.createTextNode(` ${h}`)
      ]);
      frag.appendChild(wrapper);
    });
    varChecklist.innerHTML = '';
    varChecklist.appendChild(frag);
    $('#btnComputeUni').disabled = false;
  }

  function populateBiVars() {
    biVarX.innerHTML = ''; biVarY.innerHTML = '';
    if (!A_data.headers.length) { btnComputeBi.disabled = true; return; }
    const opts = A_data.headers.map(h => `<option value="${h}">${h}</option>`).join('');
    biVarX.innerHTML = `<option value="">-- select --</option>` + opts;
    biVarY.innerHTML = `<option value="">-- select --</option>` + opts;
    btnComputeBi.disabled = false;
  }
}

function computeFrequency(values) {
  const freq = new Map();
  values.forEach(v => {
    const key = (v ?? '').toString();
    freq.set(key, (freq.get(key) || 0) + 1);
  });
  return Array.from(freq.entries()).sort((a,b) => b[1]-a[1]); // desc
}

function computeAndRenderUnivariate(vars) {
  const mount = $('#uniOutputs');
  mount.innerHTML = '';
  vars.forEach(v => {
    const values = A_data.rows.map(r => r[v]);
    const dist = computeFrequency(values);

    const card = el('div', { class:'card-lite' });
    const title = el('h3', { text: `Univariate Distribution — ${v}` });
    const tableWrap = el('div', { class:'table-wrap' });
    const table = el('table');
    const thead = el('thead');
    thead.innerHTML = `<tr><th>Value</th><th>Count</th><th>Relative</th></tr>`;
    const tbody = el('tbody');
    const total = values.length || 1;
    dist.forEach(([val, count]) => {
      const tr = el('tr');
      tr.innerHTML = `<td class="mono">${val === '' ? '(blank)' : val}</td><td>${count}</td><td>${(count/total*100).toFixed(1)}%</td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(thead); table.appendChild(tbody);
    tableWrap.appendChild(table);

    const canvas = el('canvas', { width:'800', height:'260' });
    card.appendChild(title);
    card.appendChild(tableWrap);
    card.appendChild(canvas);
    mount.appendChild(card);

    drawBarChart(canvas, dist.map(d => d[0]), dist.map(d => d[1]), `${v} — Frequency`);
  });
}

function renderCrosstab(xVar, yVar) {
  const mount = $('#biOutput');
  mount.innerHTML = '';
  const rows = A_data.rows;
  if (!rows.length) { mount.textContent = 'No data loaded.'; return; }

  // Unique values
  const xVals = Array.from(new Set(rows.map(r => r[xVar] ?? '')));
  const yVals = Array.from(new Set(rows.map(r => r[yVar] ?? '')));

  // Matrix
  const mat = yVals.map(() => xVals.map(() => 0));
  rows.forEach(r => {
    const xi = xVals.indexOf(r[xVar] ?? '');
    const yi = yVals.indexOf(r[yVar] ?? '');
    if (xi >= 0 && yi >= 0) mat[yi][xi]++;
  });

  // Render table
  const table = el('table');
  const thead = el('thead');
  const headRow = el('tr');
  headRow.appendChild(el('th', { text: `${yVar} \\ ${xVar}` }));
  xVals.forEach(x => headRow.appendChild(el('th', { text: x.toString() })));
  thead.appendChild(headRow);

  const tbody = el('tbody');
  mat.forEach((row, yi) => {
    const tr = el('tr');
    tr.appendChild(el('td', { text: yVals[yi].toString(), class:'mono' }));
    row.forEach(v => tr.appendChild(el('td', { text: v.toString() })));
    tbody.appendChild(tr);
  });

  table.appendChild(thead); table.appendChild(tbody);
  mount.appendChild(table);
}

/* Simple bar chart (no external libs) */
function drawBarChart(canvas, labels, values, title = '') {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  // Background
  ctx.fillStyle = '#0e1731'; ctx.fillRect(0,0,W,H);
  // Title
  ctx.fillStyle = '#9fe6ff'; ctx.font = '16px Montserrat';
  ctx.fillText(title, 12, 22);

  const left = 50, right = 10, top = 30, bottom = 40;
  const chartW = W - left - right;
  const chartH = H - top - bottom;

  const maxV = Math.max(1, ...values);
  const n = values.length || 1;
  const barW = chartW / n * 0.7;
  const gap = chartW / n * 0.3;

  // Axes
  ctx.strokeStyle = '#4060a8';
  ctx.beginPath();
  ctx.moveTo(left, top); ctx.lineTo(left, H - bottom); ctx.lineTo(W - right, H - bottom);
  ctx.stroke();

  // Bars
  for (let i = 0; i < n; i++) {
    const x = left + i*(barW+gap) + gap/2;
    const h = (values[i] / maxV) * (chartH - 4);
    const y = H - bottom - h;
    ctx.fillStyle = '#18e0e6';
    ctx.fillRect(x, y, barW, h);

    // Labels
    ctx.fillStyle = '#cfe6ff';
    ctx.font = '12px Montserrat';
    const lbl = (labels[i] ?? '').toString();
    ctx.save();
    // trim long labels
    const lblTrim = lbl.length > 10 ? lbl.slice(0,10) + '…' : lbl;
    ctx.translate(x + barW/2, H - bottom + 14);
    ctx.rotate(-Math.PI/6);
    ctx.textAlign = 'center';
    ctx.fillText(lblTrim, 0, 0);
    ctx.restore();

    // value text
    ctx.fillStyle = '#a7f7ff';
    ctx.fillText(values[i].toString(), x + barW/2 - 8, y - 6);
  }
}

/* ---------- Part B: Text analysis & Caesar ---------- */

const ENGLISH_FREQ = {
  A:8.17, B:1.49, C:2.78, D:4.25, E:12.70, F:2.23, G:2.02, H:6.09, I:6.97, J:0.15,
  K:0.77, L:4.03, M:2.41, N:6.75, O:7.51, P:1.93, Q:0.10, R:5.99, S:6.33, T:9.06,
  U:2.76, V:0.98, W:2.36, X:0.15, Y:1.97, Z:0.07
};

function initPartB() {
  const btnLetterDist = $('#btnLetterDist');
  const btnShowDistChart = $('#btnShowDistChart');
  const btnEncrypt = $('#btnEncrypt');
  const btnDecryptKnown = $('#btnDecryptKnown');
  const btnBruteForce = $('#btnBruteForce');
  const btnLanguageDecode = $('#btnLanguageDecode');

  if (!btnLetterDist) return; // not on this page

  btnLetterDist.addEventListener('click', () => {
    const text = ($('#plainText').value || '').toUpperCase();
    const dist = letterDistribution(text);
    renderLetterTable(dist);
  });

  btnShowDistChart.addEventListener('click', () => {
    const text = ($('#plainText').value || '').toUpperCase();
    const dist = letterDistribution(text);
    const labels = Object.keys(dist);
    const values = labels.map(k => dist[k]);
    drawBarChart($('#letterChart'), labels, values, 'Letter Frequency');
  });

  btnEncrypt.addEventListener('click', () => {
    const text = ($('#plainText').value || '');
    const sh = ((+$('#shift').value)|0) % 26;
    $('#cipherText').value = caesar(text, sh);
  });

  btnDecryptKnown.addEventListener('click', () => {
    const cipher = ($('#cipherText').value || '');
    const sh = ((+$('#shift').value)|0) % 26;
    $('#plainText').value = caesar(cipher, (26 - sh) % 26);
  });

  btnBruteForce.addEventListener('click', () => {
    const cipher = ($('#cipherText').value || '');
    const results = [];
    for (let s = 0; s < 26; s++) {
      results.push({ shift: s, text: caesar(cipher, (26 - s) % 26) });
    }
    renderBruteforce(results);
  });

  btnLanguageDecode.addEventListener('click', () => {
    const cipher = ($('#cipherText').value || '').toUpperCase();
    const best = bestShiftByLanguage(cipher);
    $('#shift').value = best.shift;
    $('#plainText').value = caesar(cipher, (26 - best.shift) % 26);
    renderLanguageScore(best);
  });
}

function letterDistribution(text) {
  const counts = {};
  for (let i = 0; i < 26; i++) counts[String.fromCharCode(65+i)] = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= 65 && code <= 90) counts[ch] += 1; // A-Z
  }
  return counts;
}

function renderLetterTable(dist) {
  const wrap = $('#letterTableWrap');
  const total = Object.values(dist).reduce((a,b) => a+b, 0) || 1;
  const table = el('table');
  const thead = el('thead'); thead.innerHTML = '<tr><th>Letter</th><th>Count</th><th>Relative</th></tr>';
  const tbody = el('tbody');
  Object.keys(dist).forEach(k => {
    const c = dist[k];
    const tr = el('tr');
    tr.innerHTML = `<td class="mono">${k}</td><td>${c}</td><td>${(c/total*100).toFixed(2)}%</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(thead); table.appendChild(tbody);
  wrap.innerHTML = ''; wrap.appendChild(table);
}

function caesar(text, shift) {
  const a = 'a'.charCodeAt(0), z = 'z'.charCodeAt(0);
  const A = 'A'.charCodeAt(0), Z = 'Z'.charCodeAt(0);
  let out = '';
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    if (c >= A && c <= Z) {
      out += String.fromCharCode(((c - A + shift + 26) % 26) + A);
    } else if (c >= a && c <= z) {
      out += String.fromCharCode(((c - a + shift + 26) % 26) + a);
    } else {
      out += ch;
    }
  }
  return out;
}

function renderBruteforce(results) {
  const wrap = $('#bfResults');
  const table = el('table');
  const thead = el('thead');
  thead.innerHTML = '<tr><th>Shift</th><th>Decrypted Text (first 120 chars)</th></tr>';
  const tbody = el('tbody');
  results.forEach(r => {
    const tr = el('tr');
    const preview = r.text.length > 120 ? r.text.slice(0,120) + '…' : r.text;
    tr.innerHTML = `<td><span class="badge">${r.shift}</span></td><td class="mono">${preview}</td>`;
    tbody.appendChild(tr);
  });
  table.appendChild(thead); table.appendChild(tbody);
  wrap.innerHTML = ''; wrap.appendChild(table);
}

function bestShiftByLanguage(cipherUpper) {
  // Observed distribution
  const obs = letterDistribution(cipherUpper);
  const total = Object.values(obs).reduce((a,b) => a+b, 0) || 1;

  // Normalize English freq to proportions
  const english = {};
  Object.keys(ENGLISH_FREQ).forEach(k => english[k] = ENGLISH_FREQ[k] / 100);

  let best = { shift: 0, score: Infinity };

  for (let s = 0; s < 26; s++) {
    // Rotate expected distribution by shift s and compute chi-squared
    let chi = 0;
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65+i); // A..Z (cipher letters)
      const shiftedIndex = (i - s + 26) % 26; // map cipher -> plain index
      const plainLetter = String.fromCharCode(65 + shiftedIndex);

      const observed = obs[letter] / total;
      const expected = english[plainLetter];
      // Chi-squared component: (o-e)^2 / (e + epsilon)
      const eps = 1e-12;
      chi += ((observed - expected) ** 2) / (expected + eps);
    }
    if (chi < best.score) best = { shift: s, score: chi };
  }

  return best;
}

function renderLanguageScore(best) {
  const wrap = $('#bfResults');
  const card = el('div', { class:'card-lite' });
  const p = el('p', { class:'subtle', text: `Language-based best shift: ${best.shift} (lower chi-squared = better fit)` });
  card.appendChild(p);
  wrap.prepend(card);
}

/* ---------- Init on DOM ready ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle (reuses your script.js behavior if present)
  document.getElementById('navToggle')?.addEventListener('click', function() {
    const navLinks = document.getElementById('navLinks');
    navLinks.style.display = (navLinks.style.display === 'flex' ? 'none' : 'flex');
  });

  initPartA();
  initPartB();
});
