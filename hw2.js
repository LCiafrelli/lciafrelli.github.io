/* ================================
   Enhanced Homework 2 Implementation
   Distribution-based Caesar Cipher Analysis
   ================================ */

const LANGUAGE_FREQUENCIES = {
  english: { A:8.17, B:1.49, C:2.78, D:4.25, E:12.70, F:2.23, G:2.02, H:6.09, I:6.97, J:0.15,
             K:0.77, L:4.03, M:2.41, N:6.75, O:7.51, P:1.93, Q:0.10, R:5.99, S:6.33, T:9.06,
             U:2.76, V:0.98, W:2.36, X:0.15, Y:1.97, Z:0.07 },
  italian: { A:11.74, B:0.92, C:4.50, D:3.73, E:11.79, F:0.95, G:1.64, H:1.54, I:11.28, J:0,
             K:0, L:6.51, M:2.51, N:6.88, O:9.83, P:3.05, Q:0.51, R:6.37, S:4.98, T:5.62,
             U:3.01, V:2.10, W:0, X:0, Y:0, Z:0.49 }
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
  originalText: '',
  cipherText: '',
  actualShift: 0,
  originalDistribution: {},
  cipherDistribution: {}
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
    setTimeout(() => alert.remove(), 5000);
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

// Part A functions (unchanged from previous version)
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
    varChecklist.appendChild(createEl('label', { style: 'display: block; margin: 0.5rem 0;' }, [
      createEl('input', { type: 'checkbox', name: 'uni-var', value: h, style: 'margin-right: 0.5rem;' }),
      h
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
  showAlert('Univariate distributions computed', 'success');
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
  const expl = createEl('div', { class: 'explanation', innerHTML:`This distribution shows how frequently each distinct value of <strong>${variable}</strong> appears in the dataset.` });
  
  const visualization = createEl('div', { class: 'visualization-container' });
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
  const canvas = createEl('canvas', { width:'800', height:'400' });
  chartCont.appendChild(canvas);
  
  visualization.appendChild(tableDiv);
  visualization.appendChild(chartCont);
  
  cont.append(title, expl, visualization);
  $('#uniResults').appendChild(cont);
  
  setTimeout(() => drawBarChart(canvas, freq.map(f=>f.val), freq.map(f=>f.count), `${variable} Distribution`), 100);
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
  const expl = createEl('div', { class: 'explanation', innerHTML: 'Cross-tabulation showing the joint frequency of value combinations from both variables.' });

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
  showAlert('Bivariate distribution computed', 'success');
}

// Part B - Enhanced with distribution comparison
function initPartB() {
  $('#btnAnalyzeText')?.addEventListener('click', analyzeTextDistribution);
  $('#btnClearText')?.addEventListener('click', clearTextAnalysis);
  $('#btnEncrypt')?.addEventListener('click', encryptText);
  $('#btnRandomShift')?.addEventListener('click', randomShiftAndEncrypt);
  $('#btnDistributionDecode')?.addEventListener('click', distributionBasedDecrypt);
  $('#btnBruteForce')?.addEventListener('click', bruteForceDecrypt);
}

function analyzeTextDistribution() {
  const text = $('#plainText').value.trim();
  if(!text) {
    showAlert('Please enter text for analysis', 'alert');
    return;
  }
  appState.originalText = text;
  appState.originalDistribution = computeLetterDistribution(text);
  renderTextAnalysis(appState.originalDistribution);
  showAlert('Letter distribution analyzed', 'success');
}

function clearTextAnalysis() {
  $('#plainText').value = '';
  $('#cipherText').value = '';
  $('#textAnalysisResults').innerHTML = '';
  $('#distributionAnalysisResults').innerHTML = '';
  $('#decryptionResults').innerHTML = '';
  $('#verificationResults').innerHTML = '';
  appState.originalText = '';
  appState.cipherText = '';
  appState.originalDistribution = {};
  appState.cipherDistribution = {};
  showAlert('Analysis cleared', 'success');
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
  const title = createEl('h4', { innerHTML:'Original Text - Letter Frequency Analysis', style:'color:#18e0e6' });
  const expl = createEl('div', { class:'explanation', innerHTML: `
    <strong>Text Statistics:</strong><br>
    • Total letters: ${data.totalLetters}<br>
    • Total characters: ${appState.originalText.length}<br>
    • This distribution will serve as baseline for comparison with encrypted text.
  ` });

  const visualization = createEl('div', { class:'visualization-container' });
  const tableDiv = createEl('div', { class:'data-table' });
  const table = createEl('table');
  table.innerHTML = `
    <thead><tr><th>Letter</th><th>Count</th><th>Frequency (%)</th><th>Visual Bar</th></tr></thead>
    <tbody>
      ${Object.entries(data.distribution).map(([l,v])=>`
      <tr><td><strong>${l}</strong></td><td>${v.count}</td><td>${v.percent}</td>
      <td><div style="background:#18e0e6; height:12px; width:${Math.min(parseFloat(v.percent)*3,100)}%; border-radius: 2px;"></div></td></tr>`).join('')}
    </tbody>
  `;
  tableDiv.appendChild(table);

  const chartCont = createEl('div', { class:'chart-container' });
  const canvas = createEl('canvas', { id:'original-text-chart', width:'800', height:'400' });
  chartCont.appendChild(canvas);
  
  visualization.appendChild(tableDiv);
  visualization.appendChild(chartCont);
  container.append(title, expl, visualization);

  $('#textAnalysisResults').innerHTML = '';
  $('#textAnalysisResults').appendChild(container);

  setTimeout(() => {
    drawBarChart(canvas, Object.keys(data.distribution), Object.values(data.distribution).map(d=>d.count), 'Original Text - Letter Frequency');
  }, 100);
}

function encryptText() {
  const text = $('#plainText').value;
  const shift = Math.min(Math.max(parseInt($('#shift').value) || 0, 0), 25);
  if(!text.trim()) {
    showAlert('Enter text to encrypt', 'alert');
    return;
  }
  appState.actualShift = shift;
  appState.cipherText = caesarCipher(text, shift);
  appState.cipherDistribution = computeLetterDistribution(appState.cipherText);
  $('#cipherText').value = appState.cipherText;
  showAlert(`Text encrypted with shift ${shift}`, 'success');
}

function randomShiftAndEncrypt() {
  const text = $('#plainText').value;
  if(!text.trim()) {
    showAlert('Enter text to encrypt', 'alert');
    return;
  }
  const randomShift = Math.floor(Math.random() * 26);
  $('#shift').value = randomShift;
  appState.actualShift = randomShift;
  appState.cipherText = caesarCipher(text, randomShift);
  appState.cipherDistribution = computeLetterDistribution(appState.cipherText);
  $('#cipherText').value = appState.cipherText;
  showAlert(`Text encrypted with random shift ${randomShift}`, 'success');
}

function caesarCipher(text, shift) {
  return text.replace(/[A-Za-z]/g, ch => {
    const base = ch <= 'Z' ? 65 : 97;
    return String.fromCharCode(((ch.charCodeAt(0) - base + shift + 26) % 26) + base);
  });
}

function distributionBasedDecrypt() {
  if(!appState.originalText || !appState.cipherText) {
    showAlert('Please analyze text and encrypt it first', 'alert');
    return;
  }
  
  // Compare distributions for all possible shifts
  const candidates = [];
  
  for(let testShift = 0; testShift < 26; testShift++) {
    const decryptedText = caesarCipher(appState.cipherText, 26 - testShift);
    const decryptedDist = computeLetterDistribution(decryptedText);
    
    // Calculate similarity score with original distribution
    let similarityScore = 0;
    let totalDifference = 0;
    
    Object.keys(appState.originalDistribution.distribution).forEach(letter => {
      const originalPercent = parseFloat(appState.originalDistribution.distribution[letter].percent);
      const decryptedPercent = parseFloat(decryptedDist.distribution[letter].percent);
      const diff = Math.abs(originalPercent - decryptedPercent);
      totalDifference += diff;
      // Similarity is inverse of difference
      similarityScore += Math.max(0, 15 - diff); // Max 15 points per letter match
    });
    
    candidates.push({
      shift: testShift,
      similarityScore: similarityScore,
      totalDifference: totalDifference.toFixed(2),
      decryptedText: decryptedText,
      distribution: decryptedDist
    });
  }
  
  // Sort by similarity score (higher is better)
  candidates.sort((a,b) => b.similarityScore - a.similarityScore);
  const bestCandidate = candidates[0];
  
  // Update fields with best result
  $('#shift').value = bestCandidate.shift;
  $('#plainText').value = bestCandidate.decryptedText;
  
  renderDistributionAnalysis(candidates, bestCandidate);
  renderVerification(appState.originalText, bestCandidate.decryptedText, bestCandidate.shift);
  
  showAlert(`Distribution analysis complete! Detected shift: ${bestCandidate.shift}`, 'success');
}

function renderDistributionAnalysis(candidates, best) {
  const container = createEl('div', { class: 'result-box' });
  const title = createEl('h4', { innerHTML: 'Distribution-Based Decryption Analysis', style: 'color:#18e0e6' });
  
  const explanation = createEl('div', { class: 'explanation', innerHTML: `
    <strong>Analysis Method:</strong><br>
    1. For each possible shift (0-25), decrypt the cipher text<br>
    2. Calculate letter frequency distribution of decrypted text<br>
    3. Compare this distribution with the original text distribution<br>
    4. Calculate similarity score (higher = better match)<br>
    5. The shift with highest similarity is the correct one<br><br>
    <strong>Best Match Found:</strong> Shift ${best.shift} with similarity score ${best.similarityScore.toFixed(1)}
  `});
  
  // Summary of top candidates
  const summary = createEl('div', { class: 'analysis-summary' });
  const summaryTitle = createEl('h5', { textContent: 'Top 5 Shift Candidates', style: 'color:#18e0e6; margin-bottom: 1rem;' });
  summary.appendChild(summaryTitle);
  
  candidates.slice(0, 5).forEach((candidate, index) => {
    const candidateDiv = createEl('div', { 
      class: `shift-candidate ${index === 0 ? 'best' : ''}`,
      innerHTML: `
        <strong>Shift ${candidate.shift}</strong> - Similarity: ${candidate.similarityScore.toFixed(1)} | 
        Difference: ${candidate.totalDifference}% | 
        Preview: "${candidate.decryptedText.substring(0, 50)}${candidate.decryptedText.length > 50 ? '...' : ''}"
      `
    });
    summary.appendChild(candidateDiv);
  });
  
  // Comparative charts
  const chartSection = createEl('div', { class: 'dual-chart-container' });
  
  const originalChartCont = createEl('div', { class: 'chart-container' });
  const originalCanvas = createEl('canvas', { width:'800', height:'400' });
  originalChartCont.appendChild(createEl('h6', { textContent: 'Original Text Distribution', style: 'color:#18e0e6; margin-bottom: 1rem;' }));
  originalChartCont.appendChild(originalCanvas);
  
  const decryptedChartCont = createEl('div', { class: 'chart-container' });
  const decryptedCanvas = createEl('canvas', { width:'800', height:'400' });
  decryptedChartCont.appendChild(createEl('h6', { textContent: `Best Match Distribution (Shift ${best.shift})`, style: 'color:#18e0e6; margin-bottom: 1rem;' }));
  decryptedChartCont.appendChild(decryptedCanvas);
  
  chartSection.appendChild(originalChartCont);
  chartSection.appendChild(decryptedChartCont);
  
  container.append(title, explanation, summary, chartSection);
  
  $('#distributionAnalysisResults').innerHTML = '';
  $('#distributionAnalysisResults').appendChild(container);
  
  // Draw comparison charts
  setTimeout(() => {
    const letters = Object.keys(appState.originalDistribution.distribution);
    const originalCounts = letters.map(l => appState.originalDistribution.distribution[l].count);
    const decryptedCounts = letters.map(l => best.distribution.distribution[l].count);
    
    drawBarChart(originalCanvas, letters, originalCounts, 'Original Text Distribution');
    drawBarChart(decryptedCanvas, letters, decryptedCounts, `Decrypted Text Distribution (Shift ${best.shift})`);
  }, 100);
}

function renderVerification(original, decrypted, detectedShift) {
  if(!original || !decrypted) return;
  
  const container = createEl('div', { class: 'result-box' });
  const title = createEl('h4', { textContent: 'Verification Results', style: 'color:#18e0e6' });
  
  const isTextMatch = original.toLowerCase().replace(/[^a-z]/g,'') === decrypted.toLowerCase().replace(/[^a-z]/g,'');
  const isShiftCorrect = detectedShift === appState.actualShift;
  
  const verification = createEl('div', { class: 'explanation', innerHTML: `
    <strong>Decryption Verification:</strong><br><br>
    <strong>Shift Analysis:</strong><br>
    • Actual shift used: ${appState.actualShift}<br>
    • Detected shift: ${detectedShift}<br>
    • Shift detection: <span style="color: ${isShiftCorrect ? '#4caf50' : '#ff5722'}; font-weight: bold;">
      ${isShiftCorrect ? '✓ CORRECT' : '✗ INCORRECT'}
    </span><br><br>
    
    <strong>Text Comparison:</strong><br>
    • Original length: ${original.length} characters<br>
    • Decrypted length: ${decrypted.length} characters<br>
    • Text match: <span style="color: ${isTextMatch ? '#4caf50' : '#ff5722'}; font-weight: bold;">
      ${isTextMatch ? '✓ PERFECT MATCH' : '✗ MISMATCH'}
    </span><br><br>
    
    <strong>Analysis Success:</strong><br>
    ${(isTextMatch && isShiftCorrect) ? 
      'The distribution-based analysis successfully recovered both the correct shift and original text!' :
      'The analysis shows differences. This could be due to text length, character distribution, or algorithm limitations.'
    }
  `});
  
  // Show text comparison if there are differences
  if(!isTextMatch || !isShiftCorrect) {
    const textComparison = createEl('div', { class: 'comparison-grid' });
    
    const originalBox = createEl('div', { class: 'result-box' });
    originalBox.appendChild(createEl('h6', { textContent: 'Original Text', style: 'color:#4a9eff; margin-bottom: 0.5rem;' }));
    originalBox.appendChild(createEl('p', { textContent: original, style: 'font-family: monospace; font-size: 0.9rem; line-height: 1.4;' }));
    
    const decryptedBox = createEl('div', { class: 'result-box' });
    decryptedBox.appendChild(createEl('h6', { textContent: 'Decrypted Text', style: 'color:#4a9eff; margin-bottom: 0.5rem;' }));
    decryptedBox.appendChild(createEl('p', { textContent: decrypted, style: 'font-family: monospace; font-size: 0.9rem; line-height: 1.4;' }));
    
    const analysisBox = createEl('div', { class: 'result-box' });
    analysisBox.appendChild(createEl('h6', { textContent: 'Why Differences Occur', style: 'color:#4a9eff; margin-bottom: 0.5rem;' }));
    analysisBox.appendChild(createEl('p', { 
      innerHTML: `• Short texts may not have representative letter distributions<br>
                  • Punctuation and spaces affect frequency analysis<br>
                  • Some letters may not appear in small text samples<br>
                  • Multiple shifts might produce similar distribution patterns`,
      style: 'font-size: 0.9rem; line-height: 1.4;'
    }));
    
    textComparison.appendChild(originalBox);
    textComparison.appendChild(decryptedBox);
    textComparison.appendChild(analysisBox);
    
    verification.appendChild(textComparison);
  }
  
  container.append(title, verification);
  
  $('#verificationResults').innerHTML = '';
  $('#verificationResults').appendChild(container);
}

function bruteForceDecrypt() {
  const cipher = $('#cipherText').value.trim();
  if(!cipher) {
    showAlert('Please encrypt text first', 'alert');
    return;
  }
  const results = [];
  for(let s=0; s<26; s++) {
    const dec = caesarCipher(cipher, 26 - s);
    results.push({ shift: s, preview: dec.slice(0, 80) + (dec.length > 80 ? '...' : '') });
  }
  renderBruteForceResults(results);
  showAlert('Brute force analysis complete', 'success');
}

function renderBruteForceResults(results) {
  const container = createEl('div', { class:'result-box' });
  const title = createEl('h4', { innerHTML:'Brute Force Analysis - All Possible Shifts', style:'color:#18e0e6' });
  const expl = createEl('div', { class:'explanation', textContent:'All 26 possible decryptions. Look for meaningful text to identify the correct shift.' });
  const tableDiv = createEl('div', { class:'data-table' });
  const table = createEl('table');
  table.innerHTML = `
    <thead><tr><th>Shift</th><th>Decrypted Text (first 80 chars)</th></tr></thead>
    <tbody>
      ${results.map(r => 
        `<tr><td><span style="background:${r.shift === appState.actualShift ? '#18e0e6' : '#4a6ba8'};color:#0a1628;padding:4px 10px;border-radius:12px;font-weight:700;">${r.shift}</span></td><td style="font-family: monospace; font-size: 0.85rem;">${r.preview}</td></tr>`
      ).join('')}
    </tbody>
  `;
  tableDiv.appendChild(table);
  container.append(title, expl, tableDiv);
  $('#decryptionResults').innerHTML = '';
  $('#decryptionResults').appendChild(container);
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

  const margin = { top: 60, right: 40, bottom: 100, left: 70 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Title
  ctx.fillStyle = '#18e0e6';
  ctx.font = 'bold 18px Montserrat';
  ctx.textAlign = 'center';
  ctx.fillText(title, width/2, 35);

  // Axes
  ctx.strokeStyle = '#4a6ba8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, margin.top + chartHeight);
  ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
  ctx.stroke();

  const maxValue = Math.max(...values,1);
  const barWidth = chartWidth / labels.length * 0.75;
  const barSpacing = chartWidth / labels.length * 0.25;

  labels.forEach((label,i) => {
    const val = values[i];
    const barHeight = (val / maxValue) * (chartHeight - 20);
    const x = margin.left + i * (barWidth + barSpacing) + barSpacing / 2;
    const y = margin.top + chartHeight - barHeight;

    // Bar gradient
    const barGradient = ctx.createLinearGradient(x,y,x,y + barHeight);
    barGradient.addColorStop(0,'#18e0e6');
    barGradient.addColorStop(1,'#2bd4d9');
    ctx.fillStyle = barGradient;
    ctx.fillRect(x,y,barWidth,barHeight);

    // Value on top of bar
    if(val > 0) {
      ctx.fillStyle = '#e9f2ff';
      ctx.font = 'bold 13px Montserrat';
      ctx.textAlign = 'center';
      ctx.fillText(val.toString(), x + barWidth/2, y - 8);
    }

    // Letter labels
    ctx.fillStyle = '#b8d4ff';
    ctx.font = 'bold 14px Montserrat';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + barWidth/2, height - 20);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle
  document.getElementById('navToggle')?.addEventListener('click', () => {
    const navLinks = document.getElementById('navLinks');
    navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
  });

  initPartA();
  initPartB();
});
