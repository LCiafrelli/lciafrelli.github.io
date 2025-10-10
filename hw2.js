/* ================================
   Enhanced Homework 2 Implementation
   Author: Lorenzo Ciafrelli
   Features: Step-by-step explanations, multi-language support, improved UX
   ================================ */

// Language frequency data (percentages)
const LANGUAGE_FREQUENCIES = {
  english: {
    A:8.17, B:1.49, C:2.78, D:4.25, E:12.70, F:2.23, G:2.02, H:6.09, I:6.97, J:0.15,
    K:0.77, L:4.03, M:2.41, N:6.75, O:7.51, P:1.93, Q:0.10, R:5.99, S:6.33, T:9.06,
    U:2.76, V:0.98, W:2.36, X:0.15, Y:1.97, Z:0.07
  },
  italian: {
    A:11.74, B:0.92, C:4.50, D:3.73, E:11.79, F:0.95, G:1.64, H:1.54, I:11.28, J:0.00,
    K:0.00, L:6.51, M:2.51, N:6.88, O:9.83, P:3.05, Q:0.51, R:6.37, S:4.98, T:5.62,
    U:3.01, V:2.10, W:0.00, X:0.00, Y:0.00, Z:0.49
  },
  spanish: {
    A:12.53, B:1.42, C:4.68, D:5.86, E:13.68, F:0.69, G:1.01, H:0.70, I:6.25, J:0.44,
    K:0.00, L:4.97, M:3.15, N:6.71, O:8.68, P:2.51, Q:0.88, R:6.87, S:7.98, T:4.63,
    U:3.93, V:0.90, W:0.00, X:0.22, Y:0.90, Z:0.52
  },
  french: {
    A:7.64, B:0.90, C:3.26, D:3.67, E:14.72, F:1.06, G:0.87, H:0.74, I:7.53, J:0.61,
    K:0.00, L:5.46, M:2.97, N:7.10, O:5.38, P:2.93, Q:1.36, R:6.55, S:7.95, T:7.24,
    U:6.31, V:1.83, W:0.00, X:0.43, Y:0.13, Z:0.21
  },
  german: {
    A:6.51, B:1.89, C:3.06, D:5.08, E:17.40, F:1.66, G:3.01, H:4.76, I:7.55, J:0.27,
    K:1.21, L:3.44, M:2.53, N:9.78, O:2.51, P:0.79, Q:0.02, R:7.00, S:7.27, T:6.15,
    U:4.35, V:0.67, W:1.89, X:0.03, Y:0.04, Z:1.13
  }
};

// Sample dataset in CSV format
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

// Global application state
let appState = {
  dataset: { headers: [], rows: [] },
  currentText: '',
  cipherText: '',
  analysisResults: {},
  selectedLanguage: 'english'
};

// Helper functions for querying
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Create DOM element helper
function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v]) => {
    if(k === 'textContent') el.textContent = v;
    else if(k === 'innerHTML') el.innerHTML = v;
    else el.setAttribute(k, v);
  });
  children.forEach(c => {
    if(typeof c === 'string') el.appendChild(document.createTextNode(c));
    else el.appendChild(c);
  });
  return el;
}

// Show alerts for feedback to user
function showAlert(message, type='info') {
  const alert = createElement('div', { class: `alert ${type}`, textContent: message });
  const container = $('.hw-detail');
  if(container) {
    container.prepend(alert);
    setTimeout(()=>alert.remove(), 4000);
  }
}

// Parse CSV data into header and row objects
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if(lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h,i) => obj[h] = vals[i] || '');
    return obj;
  });
  return { headers, rows };
}

// Toggle collapsible sections and arrow rotation
function initCollapsibleSections() {
  const headers = document.querySelectorAll('.section-header');
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const section = header.dataset.section;
      const content = document.getElementById(section + '-content');
      const isActive = content.classList.contains('active');

      // Close all open sections
      document.querySelectorAll('.section-content.active').forEach(c => c.classList.remove('active'));
      document.querySelectorAll('.section-header.active').forEach(h => h.classList.remove('active'));

      // Open clicked section if it was closed
      if(!isActive) {
        content.classList.add('active');
        header.classList.add('active');
      }
    });
  });
}

// --- Part A functions ---

function initPartA() {
  const csvUpload = $('#csvFile');
  const btnLoadSample = $('#btnLoadSample');
  const btnDownloadSample = $('#btnDownloadSample');
  const btnClearData = $('#btnClearData');
  const btnComputeUni = $('#btnComputeUni');
  const btnComputeBi = $('#btnComputeBi');

  if(!csvUpload) return;

  csvUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const content = await file.text();
      appState.dataset = parseCSV(content);
      updateDatasetUI(true);
      showAlert('Dataset loaded successfully', 'success');
    } catch {
      showAlert('Error loading the file', 'alert');
    }
  });

  btnLoadSample.addEventListener('click', () => {
    appState.dataset = parseCSV(SAMPLE_CSV);
    updateDatasetUI(true);
    showAlert('Sample dataset loaded', 'success');
  });

  btnDownloadSample.addEventListener('click', () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = createElement('a', { href: url, download: 'sample_dataset.csv' });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  btnClearData.addEventListener('click', () => {
    appState.dataset = { headers: [], rows: [] };
    updateDatasetUI(false);
    clearUniResults();
    clearBiResults();
    showAlert('Dataset cleared', 'success');
  });

  btnComputeUni.addEventListener('click', () => {
    const selectedVars = Array.from($$('input[name="uni-var"]:checked')).map(el => el.value);
    if(selectedVars.length === 0 || selectedVars.length > 3) {
      showAlert('Select 1 to 3 variables for univariate distribution', 'alert');
      return;
    }
    computeUnivariate(selectedVars);
  });

  btnComputeBi.addEventListener('click', () => {
    const varX = $('#biVarX').value;
    const varY = $('#biVarY').value;
    if(!varX || !varY || varX === varY) {
      showAlert('Select two different variables for bivariate distribution', 'alert');
      return;
    }
    computeBivariate(varX, varY);
  });
}

function updateDatasetUI(hasData) {
  const varChecklist = $('#varChecklist');
  const dataStatus = $('#dataStatus');
  const btnComputeUni = $('#btnComputeUni');
  const btnComputeBi = $('#btnComputeBi');
  const biVarX = $('#biVarX');
  const biVarY = $('#biVarY');

  if(!hasData) {
    dataStatus.textContent = 'No dataset loaded.';
    varChecklist.textContent = 'Load data to select variables.';
    btnComputeUni.disabled = true;
    btnComputeBi.disabled = true;
    biVarX.innerHTML = '<option value="">-- Select Variable --</option>';
    biVarY.innerHTML = '<option value="">-- Select Variable --</option>';
    return;
  }

  dataStatus.innerHTML = `
    Dataset loaded:<br>
    • Rows: ${appState.dataset.rows.length}<br>
    • Variables: ${appState.dataset.headers.join(', ')}
  `;

  // Populate checklist for univariate
  varChecklist.innerHTML = '';
  appState.dataset.headers.forEach(h => {
    const label = createElement('label', {}, [
      createElement('input', { type: 'checkbox', name: 'uni-var', value: h }),
      ` ${h}`
    ]);
    varChecklist.appendChild(label);
  });

  // Populate bivariate selects
  let optionsHTML = '<option value="">-- Select Variable --</option>';
  appState.dataset.headers.forEach(h => {
    optionsHTML += `<option value="${h}">${h}</option>`;
  });

  biVarX.innerHTML = optionsHTML;
  biVarY.innerHTML = optionsHTML;
  
  btnComputeUni.disabled = false;
  btnComputeBi.disabled = false;
}

function clearUniResults() {
  $('#uniResults').innerHTML = '';
}

function clearBiResults() {
  $('#biResults').innerHTML = '';
}

function computeUnivariate(vars) {
  clearUniResults();
  vars.forEach((v, i) => {
    const freqs = computeFrequency(v);
    renderUnivariate(v, freqs, i+1);
  });
}

function computeFrequency(variable) {
  const vals = appState.dataset.rows.map(row => row[variable] || '(empty)');
  const freqMap = {};
  vals.forEach(v => freqMap[v] = (freqMap[v] || 0) + 1);
  const arr = Object.entries(freqMap)
    .map(([val, count]) => ({ val, count, percent: ((count/vals.length)*100).toFixed(1) }))
    .sort((a,b) => b.count - a.count);
  return arr;
}

function renderUnivariate(variable, freqs, index) {
  const container = createElement('div', { class: 'result-box' });

  const title = createElement('h4', { innerHTML: `Univariate Distribution #${index}: <span style="color:#18e0e6">${variable}</span>` });
  const explanation = createElement('div', { class: 'explanation', innerHTML: `Frequency and percentage of each distinct value of <strong>${variable}</strong>.` });

  const dataTable = createElement('div', { class: 'data-table' });
  const table = createElement('table');
  table.innerHTML = `
    <thead>
      <tr><th>Value</th><th>Count</th><th>Percentage</th></tr>
    </thead>
    <tbody>
      ${freqs.map(f => `<tr><td>${f.val}</td><td>${f.count}</td><td>${f.percent}%</td></tr>`).join('')}
    </tbody>
  `;
  dataTable.appendChild(table);

  const chartContainer = createElement('div', { class: 'chart-container' });
  const canvas = createElement('canvas', { width: '600', height: '300' });
  chartContainer.appendChild(canvas);

  container.append(title, explanation, dataTable, chartContainer);
  $('#uniResults').appendChild(container);

  setTimeout(() => {
    drawBarChart(canvas, freqs.map(f => f.val), freqs.map(f => f.count), `${variable} Distribution`);
  }, 50);
}

function computeBivariate(varX, varY) {
  clearBiResults();

  const xVals = Array.from(new Set(appState.dataset.rows.map(r => r[varX] || '(empty)')));
  const yVals = Array.from(new Set(appState.dataset.rows.map(r => r[varY] || '(empty)')));
  const counts = {};
  yVals.forEach(y => {
    counts[y] = {};
    xVals.forEach(x => counts[y][x] = 0);
  });
  appState.dataset.rows.forEach(r => {
    const x = r[varX] || '(empty)';
    const y = r[varY] || '(empty)';
    counts[y][x]++;
  });

  const container = createElement('div', { class: 'result-box' });
  const title = createElement('h4', { innerHTML: `Bivariate Distribution: <span style="color:#18e0e6">${varX}</span> vs <span style="color:#18e0e6">${varY}</span>` });
  const explanation = createElement('div', { class: 'explanation', innerHTML: `Cross-tabulation showing counts for each value combination.` });

  const dataTable = createElement('div', { class: 'data-table' });
  const table = createElement('table');
  
  let thead = '<thead><tr><th>'+varY+' \\ '+varX+'</th>';
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
  
  // Total column sums
  tbody += '<tr><td><strong>Total</strong></td>';
  let grandTotal = 0;
  xVals.forEach(x => {
    const colSum = yVals.reduce((acc, y) => acc + counts[y][x], 0);
    grandTotal += colSum;
    tbody += `<td><strong>${colSum}</strong></td>`;
  });
  tbody += `<td><strong>${grandTotal}</strong></td></tr>`;
  tbody += '</tbody>';
  
  table.innerHTML = thead + tbody;
  dataTable.appendChild(table);

  container.append(title, explanation, dataTable);
  $('#biResults').appendChild(container);
}

// --- Part B functions ---

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
    showAlert('Please enter some text for analysis', 'alert');
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
  showAlert('Text inputs cleared', 'success');
}

function computeLetterDistribution(text) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const counts = {};
  letters.split('').forEach(l => counts[l] = 0);
  let total = 0;
  for(const ch of text.toUpperCase()) {
    if(letters.includes(ch)) {
      counts[ch]++;
      total++;
    }
  }
  const distribution = {};
  letters.split('').forEach(l => distribution[l] = {
    count: counts[l],
    percent: total ? ((counts[l]/total)*100).toFixed(2) : 0
  });
  return { distribution, totalLetters: total };
}

function renderTextAnalysis(data) {
  const container = createElement('div', { class:'result-box' });
  const title = createElement('h4', { innerHTML:'Letter Frequency Analysis', style:'color:#18e0e6' });
  const explanation = createElement('div', { class:'explanation', innerHTML: `
    Total letters: <strong>${data.totalLetters}</strong><br>
    Total characters: <strong>${appState.currentText.length}</strong><br>
    Frequency of each letter in input text.
  ` });

  const tableDiv = createElement('div', { class:'data-table' });
  const table = createElement('table');
  table.innerHTML = `
    <thead><tr><th>Letter</th><th>Count</th><th>Frequency (%)</th><th>Bar</th></tr></thead>
    <tbody>
      ${Object.entries(data.distribution).map(([l, v]) => `
        <tr>
          <td>${l}</td><td>${v.count}</td><td>${v.percent}</td>
          <td><div style="background:#18e0e6; height:10px; width:${Math.min(v.percent*2,100)}%; border-radius:2px;"></div></td>
        </tr>`).join('')}
    </tbody>
  `;
  tableDiv.appendChild(table);

  const chartDiv = createElement('div', { class:'chart-container' });
  const canvas = createElement('canvas', { id:'text-analysis-chart', width:'600', height:'300' });
  chartDiv.appendChild(canvas);

  container.append(title, explanation, tableDiv, chartDiv);
  $('#textAnalysisResults').innerHTML = '';
  $('#textAnalysisResults').appendChild(container);

  setTimeout(() => {
    drawBarChart(canvas,
      Object.keys(data.distribution),
      Object.values(data.distribution).map(d => d.count),
      'Letter Frequency Distribution');
  }, 100);
}

function encryptText() {
  const text = $('#plainText').value;
  const shift = Math.min(Math.max(parseInt($('#shift').value) || 0, 0), 25);
  if(!text.trim()) {
    showAlert('Please enter text to encrypt', 'alert');
    return;
  }
  appState.cipherText = caesarCipher(text, shift);
  $('#cipherText').value = appState.cipherText;
  showAlert(`Text encrypted with shift ${shift}`, 'success');
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
    showAlert('Please encrypt text first', 'alert');
    return;
  }
  const results = [];
  for(let s=0; s<26; s++) {
    const decrypted = caesarCipher(cipher, 26 - s);
    results.push({shift:s, preview: decrypted.slice(0, 100)+(decrypted.length>100?'...':'')});
  }
  renderBruteForceResults(results);
  showAlert('Brute force complete', 'success');
}

function renderBruteForceResults(results) {
  const container = createElement('div', { class:'result-box' });
  const title = createElement('h4', { innerHTML:'Brute Force Decryption Results', style:'color:#18e0e6' });
  const explanation = createElement('div', { class:'explanation', textContent:'Try all shifts (0-25) to find meaningful decryption.'});
  const tableDiv = createElement('div', { class:'data-table' });
  const table = createElement('table');
  table.innerHTML=`
    <thead><tr><th>Shift</th><th>Decrypted Text</th></tr></thead>
    <tbody>
      ${results.map(r => `<tr><td><span style="background:#18e0e6;color:#0a1628;padding:2px 8px;border-radius:10px;font-weight:700;">${r.shift}</span></td><td style="font-family: monospace;">${r.preview}</td></tr>`).join('')}
    </tbody>
  `;
  tableDiv.appendChild(table);
  container.append(title, explanation, tableDiv);
  $('#decryptionResults').innerHTML = '';
  $('#decryptionResults').appendChild(container);
}

function languageBasedDecrypt() {
  const cipher = $('#cipherText').value.trim();
  if(!cipher) {
    showAlert('Please encrypt text first', 'alert');
    return;
  }
  const lang = appState.selectedLanguage || 'english';
  const bestShift = findBestShiftByLanguage(cipher, lang);
  const decrypted = caesarCipher(cipher, 26 - bestShift.shift);
  $('#shift').value = bestShift.shift;
  $('#plainText').value = decrypted;
  renderLanguageResult(bestShift, decrypted);
  renderVerification(appState.currentText, decrypted);
  showAlert(`Language-based decryption shift detected: ${bestShift.shift}`, 'success');
}

function findBestShiftByLanguage(cipherText, language) {
  const expectedFreq = LANGUAGE_FREQUENCIES[language];
  const cipherDist = computeLetterDistribution(cipherText);
  let bestShift = { shift: 0, score: Infinity };

  for(let shift=0; shift<26; shift++) {
    let chiSquared = 0;
    for(const letter in expectedFreq) {
      const shiftedIndex = (letter.charCodeAt(0) - 65 - shift + 26) % 26;
      const shiftedLetter = String.fromCharCode(65 + shiftedIndex);
      const observed = parseFloat(cipherDist.distribution[shiftedLetter].percent);
      const expected = expectedFreq[letter];
      chiSquared += Math.pow(observed - expected, 2) / (expected + 0.01);
    }
    if(chiSquared < bestShift.score) bestShift = { shift, score: chiSquared };
  }
  return bestShift;
}

function renderLanguageResult(analysis, decryptedText) {
  const container = createElement('div', { class: 'result-box' });
  const title = createElement('h4', { innerHTML: `Language Analysis (${appState.selectedLanguage})`, style: 'color:#18e0e6' });
  const explanation = createElement('div', { class: 'explanation', innerHTML: `
    Best shift: <strong>${analysis.shift}</strong><br>
    Chi-squared score: ${analysis.score.toFixed(3)}<br>
    This compares decrypted letter frequency with the language's expected frequencies.
  `});
  const decryptedBox = createElement('div', {
    class: 'result-box',
    style: 'margin-top:1rem; background: rgba(24,224,230,0.05); padding: 1rem; border-radius: 6px; font-family: monospace;'
  });
  decryptedBox.textContent = decryptedText;
  container.append(title, explanation, decryptedBox);
  $('#decryptionResults').appendChild(container);
}

function renderVerification(original, decrypted) {
  if(!original || !decrypted) return;
  const container = createElement('div', { class: 'result-box' });
  const title = createElement('h4', { textContent: 'Verification & Comparison', style: 'color:#18e0e6' });
  const isMatch = original.toLowerCase().replace(/[^a-z]/g, '') === decrypted.toLowerCase().replace(/[^a-z]/g, '');
  const explanation = createElement('div', {
    class: 'explanation',
    innerHTML: `
      Original length: ${original.length}<br>
      Decrypted length: ${decrypted.length}<br>
      Match: <strong style="color:${isMatch ? '#4caf50' : '#ff5722'}">${isMatch ? '✓ Perfect' : '✗ Mismatch'}</strong><br><br>
      ${isMatch ? 'The decrypted text matches the original!' : 'Texts differ, check shift or language selection.'}
    `
  });
  container.append(title, explanation);
  $('#verificationResults').innerHTML = '';
  $('#verificationResults').appendChild(container);
}

// Updated bar chart drawing
function drawBarChart(canvas, labels, values, title) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0a1628');
  gradient.addColorStop(1, '#142042');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const margin = { top: 50, right: 30, bottom: 80, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Title
  ctx.fillStyle = '#18e0e6';
  ctx.font = 'bold 16px Montserrat';
  ctx.textAlign = 'center';
  ctx.fillText(title, width / 2, 25);

  // Axes
  ctx.strokeStyle = '#4a6ba8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, margin.top + chartHeight);
  ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
  ctx.stroke();

  const maxValue = Math.max(...values, 1);
  const barWidth = chartWidth / labels.length * 0.8;
  const barSpacing = chartWidth / labels.length * 0.2;

  labels.forEach((label, idx) => {
    const val = values[idx];
    const barHeight = (val / maxValue) * chartHeight;
    const x = margin.left + idx * (barWidth + barSpacing) + barSpacing / 2;
    const y = margin.top + chartHeight - barHeight;

    // Bar color gradient
    const barGradient = ctx.createLinearGradient(x, y, x, y + barHeight);
    barGradient.addColorStop(0, '#18e0e6');
    barGradient.addColorStop(1, '#2bd4d9');
    ctx.fillStyle = barGradient;
    ctx.fillRect(x, y, barWidth, barHeight);

    // Bar value text
    if (val > 0) {
      ctx.fillStyle = '#e9f2ff';
      ctx.font = '12px Montserrat';
      ctx.textAlign = 'center';
      ctx.fillText(val.toString(), x + barWidth / 2, y - 5);
    }

    // Label text
    ctx.fillStyle = '#b8d4ff';
    ctx.font = '11px Montserrat';
    ctx.textAlign = 'center';
    const displayLabel = label.length > 10 ? label.slice(0, 10) + '…' : label;
    ctx.fillText(displayLabel, x + barWidth / 2, height - 15);
  });
}

// Initialize everything after DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle (reuse or define in your script.js)
  document.getElementById('navToggle')?.addEventListener('click', () => {
    const navLinks = document.getElementById('navLinks');
    navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
  });

  initCollapsibleSections();
  initPartA();
  initPartB();

  // Open first section on load
  const firstSection = document.querySelector('.section-header');
  if(firstSection) firstSection.click();
});
