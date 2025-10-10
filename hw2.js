/* ================================
   Homework 2 JavaScript
   Functionality intact, all sections visible by default
   ================================ */

// Language frequency data
const LANGUAGE_FREQUENCIES = {
  english: { A:8.17, B:1.49, C:2.78, D:4.25, E:12.70, F:2.23, G:2.02, H:6.09, I:6.97, J:0.15,
             K:0.77, L:4.03, M:2.41, N:6.75, O:7.51, P:1.93, Q:0.10, R:5.99, S:6.33, T:9.06,
             U:2.76, V:0.98, W:2.36, X:0.15, Y:1.97, Z:0.07 },
  italian: { A:11.74, B:0.92, C:4.50, D:3.73, E:11.79, F:0.95, G:1.64, H:1.54, I:11.28, J:0,
             K:0, L:6.51, M:2.51, N:6.88, O:9.83, P:3.05, Q:0.51, R:6.37, S:4.98, T:5.62,
             U:3.01, V:2.10, W:0, X:0, Y:0, Z:0.49 },
  spanish: { A:12.53, B:1.42, C:4.68, D:5.86, E:13.68, F:0.69, G:1.01, H:0.70, I:6.25, J:0.44,
             K:0, L:4.97, M:3.15, N:6.71, O:8.68, P:2.51, Q:0.88, R:6.87, S:7.98, T:4.63,
             U:3.93, V:0.90, W:0, X:0.22, Y:0.90, Z:0.52 },
  french: { A:7.64, B:0.90, C:3.26, D:3.67, E:14.72, F:1.06, G:0.87, H:0.74, I:7.53, J:0.61,
            K:0, L:5.46, M:2.97, N:7.10, O:5.38, P:2.93, Q:1.36, R:6.55, S:7.95, T:7.24,
            U:6.31, V:1.83, W:0, X:0.43, Y:0.13, Z:0.21 },
  german: { A:6.51, B:1.89, C:3.06, D:5.08, E:17.40, F:1.66, G:3.01, H:4.76, I:7.55, J:0.27,
            K:1.21, L:3.44, M:2.53, N:9.78, O:2.51, P:0.79, Q:0.02, R:7.00, S:7.27, T:6.15,
            U:4.35, V:0.67, W:1.89, X:0.03, Y:0.04, Z:1.13 }
};

const SAMPLE_CSV = `Department,Age,LoginFailures,MalwareDetected,SecurityTraining
IT,22,1,No,Yes
IT,25,0,No,Yes
HR,41,2,No,No
HR,38,0,No,Yes
Finance,45,4,Yes,No
IT,29,3,No,Yes
Operations,50,2,Yes,Yes
Operations,33,1,No,Yes
Finance,37,0,No,Yes
IT,27,1,No,Yes
HR,29,0,No,No
Operations,44,5,Yes,No
Finance,31,1,No,Yes
IT,35,0,No,Yes
IT,39,2,No,Yes
HR,26,0,No,Yes
Finance,42,3,Yes,No
Operations,28,0,No,Yes
Finance,36,2,No,Yes
IT,23,1,No,Yes`;

let appState = {
  dataset: { headers: [], rows: [] },
  currentText: '',
  cipherText: '',
  selectedLanguage: 'english'
};

const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

function createEl(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs)) {
    if(k === 'textContent') el.textContent = v;
    else if(k === 'innerHTML') el.innerHTML = v;
    else el.setAttribute(k, v);
  }
  children.forEach(c => typeof c === 'string' ? el.appendChild(document.createTextNode(c)) : el.appendChild(c));
  return el;
}

function showAlert(msg, type='info') {
  const alert = createEl('div', { class: `alert ${type}`, textContent: msg });
  const container = $('.hw-detail');
  if(container) {
    container.prepend(alert);
    setTimeout(() => alert.remove(), 4000);
  }
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if(lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(v => v.trim());
  const rows = lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim());
    const row = {};
    headers.forEach((h,i) => row[h] = vals[i] ?? '');
    return row;
  });
  return { headers, rows };
}

function initPartA() {
  $('#csvFile')?.addEventListener('change', async e => {
    const f = e.target.files[0];
    if(!f) return;
    try {
      const content = await f.text();
      appState.dataset = parseCSV(content);
      updateDatasetUI(true);
      showAlert('Dataset loaded successfully', 'success');
    } catch {
      showAlert('Error loading file', 'alert');
    }
  });
  $('#btnLoadSample')?.addEventListener('click', () => {
    appState.dataset = parseCSV(SAMPLE_CSV);
    updateDatasetUI(true);
    showAlert('Sample dataset loaded', 'success');
  });
  $('#btnDownloadSample')?.addEventListener('click', () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = createEl('a', { href: url, download: "sample_dataset.csv" });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
  $('#btnClearData')?.addEventListener('click', () => {
    appState.dataset = { headers: [], rows: [] };
    updateDatasetUI(false);
    clearUniResults();
    clearBiResults();
    showAlert('Dataset cleared', 'success');
  });
  
  $('#btnComputeUni')?.addEventListener('click', () => {
    const selected = Array.from($$('input[name="uni-var"]:checked')).map(el => el.value);
    if(selected.length === 0 || selected.length > 3) {
      showAlert('Select 1 to 3 variables', 'alert');
      return;
    }
    computeUnivariate(selected);
  });
  $('#btnComputeBi')?.addEventListener('click', () => {
    const x = $('#biVarX').value;
    const y = $('#biVarY').value;
    if(!x || !y || x === y) {
      showAlert('Select two different variables', 'alert');
      return;
    }
    computeBivariate(x,y);
  });
}

function updateDatasetUI(hasData) {
  const varChecklist = $('#varChecklist');
  const dataStatus = $('#dataStatus');
  const btnUni = $('#btnComputeUni');
  const btnBi = $('#btnComputeBi');
  const biX = $('#biVarX');
  const biY = $('#biVarY');

  if(!hasData) {
    dataStatus.textContent = 'No data loaded';
    varChecklist.textContent = 'Load data to select variables.';
    btnUni.disabled = true;
    btnBi.disabled = true;
    biX.innerHTML = `<option value="">-- Select Variable --</option>`;
    biY.innerHTML = `<option value="">-- Select Variable --</option>`;
    return;
  }

  dataStatus.innerHTML=`
    Dataset loaded:<br>
    • Rows: ${appState.dataset.rows.length}<br>
    • Variables: ${appState.dataset.headers.join(', ')}
  `;
  
  varChecklist.innerHTML = '';
  appState.dataset.headers.forEach(h => {
    varChecklist.appendChild(createEl('label', {}, [
      createEl('input', { type: 'checkbox', name: 'uni-var', value: h }),
      ` ${h}`
    ]));
  });
  
  const optionsHTML = `<option value="">-- Select Variable --</option>` + 
    appState.dataset.headers.map(h => `<option value="${h}">${h}</option>`).join('');
    
  biX.innerHTML = optionsHTML;
  biY.innerHTML = optionsHTML;
  
  btnUni.disabled = false;
  btnBi.disabled = false;
}

function clearUniResults() { $('#uniResults').innerHTML = ''; }
function clearBiResults() { $('#biResults').innerHTML = ''; }

function computeUnivariate(vars) {
  clearUniResults();
  vars.forEach((v,i) => {
    const freq = computeFrequency(v);
    renderUnivariate(v, freq, i+1);
  });
}

function computeFrequency(variable) {
  const vals = appState.dataset.rows.map(r => r[variable] || '(empty)');
  const freqMap = {};
  vals.forEach(v => freqMap[v] = (freqMap[v] || 0) +1);
  return Object.entries(freqMap)
    .map(([val,count])=>({ val, count, percent: ((count/vals.length)*100).toFixed(1) }))
    .sort((a,b) => b.count-a.count);
}

function renderUnivariate(variable, freq, index) {
  const cont = createEl('div', { class: 'result-box' });
  const title = createEl('h4', { innerHTML:`Univariate Distribution #${index}: <span style="color:#18e0e6;">${variable}</span>` });
  const expl = createEl('div', { class: 'explanation', innerHTML:`This distribution shows how frequently each distinct value of <strong>${variable}</strong> appears.` });
  const tableDiv = createEl('div', { class: 'data-table' });
  const table = createEl('table');
  table.innerHTML = `
    <thead>
      <tr><th>Value</th><th>Count</th><th>Percentage</th></tr>
    </thead>
    <tbody>
      ${freq.map(f => `<tr><td>${f.val}</td><td>${f.count}</td><td>${f.percent}%</td></tr>`).join('')}
    </tbody>`;
  tableDiv.appendChild(table);
  
  const chartCont = createEl('div', { class: 'chart-container' });
  const canvas = createEl('canvas', { width:'600', height:'300' });
  chartCont.appendChild(canvas);
  
  cont.append(title, expl, tableDiv, chartCont);
  $('#uniResults').appendChild(cont);
  
  setTimeout(() => drawBarChart(canvas, freq.map(f=>f.val), freq.map(f=>f.count), `${variable} Distribution`), 50);
}

function computeBivariate(varX, varY) {
  clearBiResults();
  const xVals = [...new Set(appState.dataset.rows.map(r=>r[varX]||'(empty)'))];
  const yVals = [...new Set(appState.dataset.rows.map(r=>r[varY]||'(empty)'))];
  const counts = {};
  
  yVals.forEach(y => {
    counts[y] = {};
    xVals.forEach(x => counts[y][x] = 0);
  });

  appState.dataset.rows.forEach(r => {
    const x = r[varX]||'(empty)';
    const y = r[varY]||'(empty)';
    counts[y][x]++;
  });

  const cont = createEl('div', { class: 'result-box' });
  const title = createEl('h4', { innerHTML:`Bivariate Distribution: <span style="color:#18e0e6">${varX}</span> vs <span style="color:#18e0e6">${varY}</span>` });
  const expl = createEl('div', { class: 'explanation', innerHTML: 'Cross-tabulation showing counts for each pair combination.' });

  const tableDiv = createEl('div', { class: 'data-table' });
  const table = createEl('table');
  let thead = `<thead><tr><th>${varY} \\ ${varX}</th>`;
  xVals.forEach(x => thead += `<th>${x}</th>`);
  thead += '<th><strong>Total</strong></th></tr></thead>';

  let tbody = '<tbody>';
  yVals.forEach(y => {
    let rowSum = 0;
    tbody += `<tr><td><strong>${y}</strong></td>`;
    xVals.forEach(x => {
      rowSum += counts[y][x];
      tbody += `<td>${counts[y][x]}</td>`;
    });
    tbody += `<td><strong>${rowSum}</strong></td></tr>`;
  });

  tbody += '<tr><td><strong>Total</strong></td>';
  let grandTotal = 0;
  xVals.forEach(x => {
    const colSum = yVals.reduce((sum,y) => sum + counts[y][x], 0);
    grandTotal += colSum;
    tbody += `<td><strong>${colSum}</strong></td>`;
  });
  tbody += `<td><strong>${grandTotal}</strong></td></tr>`;
  tbody += '</tbody>';
  
  table.innerHTML = thead + tbody;
  tableDiv.appendChild(table);

  cont.append(title, expl, tableDiv);
  $('#biResults').appendChild(cont);
}

function initPartB() {
  $('#btnAnalyzeText')?.addEventListener('click', analyzeTextDistribution);
  $('#btnClearText')?.addEventListener('click', clearTextAnalysis);
  $('#btnEncrypt')?.addEventListener('click', encryptText);
  $('#btnBruteForce')?.addEventListener('click', bruteForceDecrypt);
  $('#btnLanguageDecode')?.addEventListener('click', languageBasedDecrypt);
  $('#languageSelect')?.addEventListener('change', e => appState.selectedLanguage = e.target.value);
}

function analyzeTextDistribution() {
  const text = $('#plainText').value.trim();
  if(!text) {
    showAlert('Please enter text for analysis', 'alert');
    return;
  }
  appState.currentText = text;
  const dist = computeLetterDistribution(text);
  renderTextAnalysis(dist);
  showAlert('Letter distribution analyzed', 'success');
}

function clearTextAnalysis() {
  $('#plainText').value = '';
  $('#cipherText').value = '';
  $('#textAnalysisResults').innerHTML = '';
  $('#decryptionResults').innerHTML = '';
  $('#verificationResults').innerHTML = '';
  appState.currentText = '';
  appState.cipherText = '';
  showAlert('Text cleared', 'success');
}

function computeLetterDistribution(text) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let counts = {};
  letters.split('').forEach(l => counts[l] = 0);
  let totalLetters = 0;
  for(const ch of text.toUpperCase()) {
    if(letters.includes(ch)) {
      counts[ch]++;
      totalLetters++;
    }
  }
  const distribution = {};
  letters.split('').forEach(l => distribution[l] = {
    count: counts[l],
    percent: totalLetters ? ((counts[l]/totalLetters)*100).toFixed(2) : 0
  });
  return { distribution, totalLetters };
}

function renderTextAnalysis(data) {
  const container = createEl('div', { class:'result-box' });
  const title = createEl('h4', { innerHTML:'Letter Frequency Analysis', style:'color:#18e0e6' });
  const expl = createEl('div', { class:'explanation', innerHTML: `
    Total letters: <strong>${data.totalLetters}</strong><br>
    Total characters: <strong>${appState.currentText.length}</strong><br>
    Frequency of each letter in the text.
  ` });

  const tableDiv = createEl('div', { class:'data-table' });
  const table = createEl('table');
  table.innerHTML = `
    <thead><tr><th>Letter</th><th>Count</th><th>Frequency (%)</th><th>Bar</th></tr></thead>
    <tbody>
      ${Object.entries(data.distribution).map(([l,v])=>`
      <tr><td>${l}</td><td>${v.count}</td><td>${v.percent}</td>
      <td><div style="background:#18e0e6; height:10px; width:${Math.min(v.percent*2,100)}%; border-radius: 2px;"></div></td></tr>`).join('')}
    </tbody>
  `;
  tableDiv.appendChild(table);

  const chartCont = createEl('div', { class:'chart-container' });
  const canvas = createEl('canvas', { id:'text-analysis-chart', width:'600', height:'300' });
  chartCont.appendChild(canvas);

  container.append(title, expl, tableDiv, chartCont);

  $('#textAnalysisResults').innerHTML = '';
  $('#textAnalysisResults').appendChild(container);

  setTimeout(() => drawBarChart(canvas, Object.keys(data.distribution), Object.values(data.distribution).map(d=>d.count), 'Letter Frequency Distribution'), 100);
}

function encryptText() {
  const text = $('#plainText').value;
  const shift = Math.min(Math.max(parseInt($('#shift').value) || 0, 0), 25);
  if(!text.trim()) {
    showAlert('Enter text to encrypt', 'alert');
    return;
  }
  appState.cipherText = caesarCipher(text, shift);
  $('#cipherText').value = appState.cipherText;
  showAlert(`Encrypted with shift ${shift}`, 'success');
}

function caesarCipher(text, shift) {
  return text.replace(/[A-Za-z]/g, ch => {
    const base = ch <= 'Z' ? 65 : 97;
    return String.fromCharCode(((ch.charCodeAt(0) - base + shift + 26) % 26) + base);
  });
}

function bruteForceDecrypt() {
  const cipher = $('#cipherText').value.trim();
  if(!cipher) {
    showAlert('Encrypt text first', 'alert');
    return;
  }
  const results = [];
  for(let s=0; s<26; s++) {
    const dec = caesarCipher(cipher, 26 - s);
    results.push({ shift: s, preview: dec.slice(0, 100) + (dec.length > 100 ? '...' : '') });
  }
  renderBruteForceResults(results);
  showAlert('Brute force done', 'success');
}

function renderBruteForceResults(results) {
  const container = createEl('div', { class:'result-box' });
  const title = createEl('h4', { innerHTML:'Brute Force Results', style:'color:#18e0e6' });
  const expl = createEl('div', { class:'explanation', textContent:'Try shifts 0-25 to find meaningful text.' });
  const tableDiv = createEl('div', { class:'data-table' });
  const table = createEl('table');
  table.innerHTML = `
    <thead><tr><th>Shift</th><th>Text (first 100 chars)</th></tr></thead>
    <tbody>
      ${results.map(r => 
        `<tr><td><span style="background:#18e0e6;color:#0a1628;padding:2px 8px;border-radius:10px;font-weight:700;">${r.shift}</span></td><td style="font-family: monospace;">${r.preview}</td></tr>`
      ).join('')}
    </tbody>
  `;
  tableDiv.appendChild(table);
  container.append(title, expl, tableDiv);
  $('#decryptionResults').innerHTML = '';
  $('#decryptionResults').appendChild(container);
}

function languageBasedDecrypt() {
  const cipher = $('#cipherText').value.trim();
  if(!cipher) {
    showAlert('Encrypt text first', 'alert');
    return;
  }
  const lang = appState.selectedLanguage || 'english';
  const bestShift = findBestShiftByLanguage(cipher, lang);
  const decrypted = caesarCipher(cipher, 26 - bestShift.shift);
  $('#shift').value = bestShift.shift;
  $('#plainText').value = decrypted;
  renderLanguageResult(bestShift, decrypted);
  renderVerification(appState.currentText, decrypted);
  showAlert(`Detected shift: ${bestShift.shift}`, 'success');
}

function findBestShiftByLanguage(cipherText, language) {
  const expectedFreq = LANGUAGE_FREQUENCIES[language];
  const cipherDist = computeLetterDistribution(cipherText);
  let best = { shift: 0, score: Infinity };

  for(let s=0; s<26; s++) {
    let chi2 = 0;
    Object.keys(expectedFreq).forEach(letter => {
      const shiftedIdx = (letter.charCodeAt(0) - 65 - s + 26) % 26;
      const shiftedLetter = String.fromCharCode(65 + shiftedIdx);
      const observed = parseFloat(cipherDist.distribution[shiftedLetter].percent);
      const expected = expectedFreq[letter];
      chi2 += Math.pow(observed - expected, 2) / (expected + 0.01);
    });
    if(chi2<best.score) best = {shift: s, score: chi2};
  }
  return best;
}

function renderLanguageResult(analysis, decrypted) {
  const cont = createEl('div', { class:'result-box' });
  const title = createEl('h4', { innerHTML: `Language Analysis (${appState.selectedLanguage})`, style:'color:#18e0e6' });
  const expl = createEl('div', { class:'explanation', innerHTML: `
    Best shift: <strong>${analysis.shift}</strong><br>
    Chi2 score: ${analysis.score.toFixed(3)}<br>
    Comparison with language letter frequency.
  `});
  const decryptedBox = createEl('div', {
    class: 'result-box',
    style: 'margin-top:1rem; background: rgba(24,224,230,0.05); padding: 1rem;border-radius:6px; font-family: monospace;'
  });
  decryptedBox.textContent = decrypted;
  cont.append(title, expl, decryptedBox);
  $('#decryptionResults').appendChild(cont);
}

function renderVerification(original, decrypted) {
  if(!original || !decrypted) return;
  const cont = createEl('div', { class:'result-box' });
  const title = createEl('h4', { textContent: 'Verification & Comparison', style:'color:#18e0e6' });
  const isMatch = original.toLowerCase().replace(/[^a-z]/g,'') === decrypted.toLowerCase().replace(/[^a-z]/g,'');
  const expl = createEl('div', {
    class:'explanation',
    innerHTML: `
      Original length: ${original.length}<br>
      Decrypted length: ${decrypted.length}<br>
      Match: <strong style="color: ${isMatch ? '#4caf50' : '#ff5722'};">${isMatch ? '✓ Perfect' : '✗ Mismatch'}</strong><br>
      ${isMatch ? 'Decryption matches original!' : 'Mismatch, check settings.'}
    `
  });
  cont.append(title, expl);
  $('#verificationResults').innerHTML = '';
  $('#verificationResults').appendChild(cont);
}

function drawBarChart(canvas, labels, values, title) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0,0,width,height);

  const gradient = ctx.createLinearGradient(0,0,0,height);
  gradient.addColorStop(0,'#0a1628');
  gradient.addColorStop(1,'#142042');
  ctx.fillStyle = gradient;
  ctx.fillRect(0,0,width,height);

  const margin = { top: 50, right: 30, bottom: 80, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  ctx.fillStyle = '#18e0e6';
  ctx.font = 'bold 16px Montserrat';
  ctx.textAlign = 'center';
  ctx.fillText(title, width/2, 25);

  ctx.strokeStyle = '#4a6ba8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, margin.top + chartHeight);
  ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
  ctx.stroke();

  const maxValue = Math.max(...values,1);
  const barWidth = chartWidth / labels.length * 0.8;
  const barSpacing = chartWidth / labels.length * 0.2;

  labels.forEach((label,i) => {
    const val = values[i];
    const barHeight = (val / maxValue) * chartHeight;
    const x = margin.left + i * (barWidth + barSpacing) + barSpacing / 2;
    const y = margin.top + chartHeight - barHeight;

    const barGradient = ctx.createLinearGradient(x,y,x,y + barHeight);
    barGradient.addColorStop(0,'#18e0e6');
    barGradient.addColorStop(1,'#2bd4d9');
    ctx.fillStyle = barGradient;
    ctx.fillRect(x,y,barWidth,barHeight);

    if(val > 0) {
      ctx.fillStyle = '#e9f2ff';
      ctx.font = '12px Montserrat';
      ctx.textAlign = 'center';
      ctx.fillText(val.toString(), x + barWidth/2, y - 5);
    }

    ctx.fillStyle = '#b8d4ff';
    ctx.font = '11px Montserrat';
    ctx.textAlign = 'center';
    const disp = label.length>10 ? label.slice(0,10)+'…' : label;
    ctx.fillText(disp, x + barWidth/2, height - 15);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('navToggle')?.addEventListener('click', () => {
    const navLinks = document.getElementById('navLinks');
    navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
  });

  initPartA();
  initPartB();
});
