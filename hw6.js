/* ================================
   Homework 6: Online Algorithms
   Interactive Statistics Calculator v2.0
   With Chart.js Visualizations
   ================================ */

const $ = sel => document.querySelector(sel);
let charts = {};

// Main computation function
function computeStatistics() {
  const dataInput = $('#dataInput').value;
  const scaleFactor = parseFloat($('#scaleFactor').value) || 1;
  
  if (!dataInput.trim()) {
    showAlert('Please enter data', 'error');
    return;
  }
  
  try {
    // Parse data
    let data = dataInput
      .replace(/[,;\s]+/g, ',')
      .split(',')
      .map(x => parseFloat(x.trim()))
      .filter(x => !isNaN(x));
    
    if (data.length === 0) {
      showAlert('No valid data found', 'error');
      return;
    }
    
    // Apply scale factor
    data = data.map(x => x * scaleFactor);
    
    // Compute using both methods
    const onlineData = computeOnlineDetailed(data);
    const batchResults = computeBatch(data);
    
    // Display results
    displayMainResults(onlineData, batchResults, data);
    displayStepByStep(onlineData.steps);
    displayCharts(data, onlineData, batchResults);
    
    // Show sections
    $('#mainResults').style.display = 'block';
    $('#stepSection').style.display = 'block';
    $('#stabilitySection').style.display = 'block';
    
    showAlert('Statistics computed successfully!', 'success');
    
  } catch (err) {
    showAlert('Error: ' + err.message, 'error');
    console.error(err);
  }
}

function computeOnlineDetailed(data) {
  let n = 0;
  let mean = 0;
  let M2 = 0;
  let M3 = 0;
  let M4 = 0;
  const steps = [];
  
  for (let x of data) {
    n++;
    const delta = x - mean;
    mean = mean + delta / n;
    const delta2 = x - mean;
    
    // Higher moments
    M4 = M4 + delta * delta2 * delta2 * delta2 * (n*n - 3*n + 3) 
         + 6 * delta2 * delta2 * M2 - 4 * delta2 * M3;
    M3 = M3 + delta * delta2 * delta2 * (n - 2) - 3 * delta2 * M2;
    M2 = M2 + delta * delta2;
    
    // Store step data (only first 20 + last few)
    if (n <= 20 || n > data.length - 3) {
      steps.push({
        n, x, delta, newMean: mean, delta2, M2: M2.toFixed(8),
        variance: (n > 1 ? M2 / (n - 1) : 0).toFixed(10)
      });
    } else if (n === 21) {
      steps.push({ n: '...', x: '...', delta: '...', newMean: '...', delta2: '...', M2: '...', variance: '...' });
    }
  }
  
  const variance = n > 1 ? M2 / (n - 1) : 0;
  const stdDev = Math.sqrt(variance);
  const skewness = M2 > 0 ? M3 / Math.pow(M2, 1.5) : 0;
  const kurtosis = M2 > 0 ? M4 / (M2 * M2) - 3 : 0;
  
  const sorted = [...data].sort((a, b) => a - b);
  const q1 = percentile(sorted, 0.25);
  const q2 = percentile(sorted, 0.50);
  const q3 = percentile(sorted, 0.75);
  
  return {
    n, mean, variance, stdDev, M2, M3, M4, skewness, kurtosis,
    min: sorted[0], max: sorted[sorted.length - 1],
    range: sorted[sorted.length - 1] - sorted[0],
    q1, q2, q3, iqr: q3 - q1,
    steps
  };
}

function computeBatch(data) {
  const n = data.length;
  const sum = data.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  
  const sumSquaredDev = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0);
  const variance = n > 1 ? sumSquaredDev / (n - 1) : 0;
  const stdDev = Math.sqrt(variance);
  
  const M3 = data.reduce((sum, x) => sum + Math.pow(x - mean, 3), 0);
  const skewness = stdDev > 0 ? M3 / (n * Math.pow(stdDev, 3)) : 0;
  
  const M4 = data.reduce((sum, x) => sum + Math.pow(x - mean, 4), 0);
  const kurtosis = stdDev > 0 ? M4 / (n * variance * variance) - 3 : 0;
  
  const sorted = [...data].sort((a, b) => a - b);
  const q1 = percentile(sorted, 0.25);
  const q2 = percentile(sorted, 0.50);
  const q3 = percentile(sorted, 0.75);
  
  return {
    n, mean, variance, stdDev, skewness, kurtosis,
    min: sorted[0], max: sorted[sorted.length - 1],
    range: sorted[sorted.length - 1] - sorted[0],
    q1, q2, q3, iqr: q3 - q1
  };
}

function displayMainResults(online, batch, data) {
  // Online results
  let onlineHTML = '';
  onlineHTML += `<div class="results-item"><div class="results-label">Sample Size</div><div class="results-value">${online.n}</div></div>`;
  onlineHTML += `<div class="results-item"><div class="results-label">Mean</div><div class="results-value">${online.mean.toPrecision(12)}</div></div>`;
  onlineHTML += `<div class="results-item"><div class="results-label">Variance</div><div class="results-value">${online.variance.toPrecision(12)}</div></div>`;
  onlineHTML += `<div class="results-item"><div class="results-label">Std Deviation</div><div class="results-value">${online.stdDev.toPrecision(12)}</div></div>`;
  onlineHTML += `<div class="results-item"><div class="results-label">Skewness</div><div class="results-value">${online.skewness.toPrecision(10)}</div></div>`;
  onlineHTML += `<div class="results-item"><div class="results-label">Kurtosis</div><div class="results-value">${online.kurtosis.toPrecision(10)}</div></div>`;
  onlineHTML += `<div class="results-item" style="border-left-color: #81c784;"><div class="results-label">Min / Max</div><div class="results-value">${online.min.toPrecision(10)} / ${online.max.toPrecision(10)}</div></div>`;
  onlineHTML += `<div class="results-item" style="border-left-color: #81c784;"><div class="results-label">Q1 / Q2 / Q3</div><div class="results-value">${online.q1.toPrecision(8)} / ${online.q2.toPrecision(8)} / ${online.q3.toPrecision(8)}</div></div>`;
  onlineHTML += `<div class="results-item" style="border-left-color: #81c784;"><div class="results-label">IQR</div><div class="results-value">${online.iqr.toPrecision(10)}</div></div>`;
  
  $('#onlineResults').innerHTML = onlineHTML;
  
  // Batch results
  let batchHTML = '';
  batchHTML += `<div class="results-item"><div class="results-label">Sample Size</div><div class="results-value">${batch.n}</div></div>`;
  batchHTML += `<div class="results-item"><div class="results-label">Mean</div><div class="results-value">${batch.mean.toPrecision(12)}</div></div>`;
  batchHTML += `<div class="results-item"><div class="results-label">Variance</div><div class="results-value">${batch.variance.toPrecision(12)}</div></div>`;
  batchHTML += `<div class="results-item"><div class="results-label">Std Deviation</div><div class="results-value">${batch.stdDev.toPrecision(12)}</div></div>`;
  batchHTML += `<div class="results-item"><div class="results-label">Skewness</div><div class="results-value">${batch.skewness.toPrecision(10)}</div></div>`;
  batchHTML += `<div class="results-item"><div class="results-label">Kurtosis</div><div class="results-value">${batch.kurtosis.toPrecision(10)}</div></div>`;
  batchHTML += `<div class="results-item" style="border-left-color: #64b5f6;"><div class="results-label">Min / Max</div><div class="results-value">${batch.min.toPrecision(10)} / ${batch.max.toPrecision(10)}</div></div>`;
  batchHTML += `<div class="results-item" style="border-left-color: #64b5f6;"><div class="results-label">Q1 / Q2 / Q3</div><div class="results-value">${batch.q1.toPrecision(8)} / ${batch.q2.toPrecision(8)} / ${batch.q3.toPrecision(8)}</div></div>`;
  batchHTML += `<div class="results-item" style="border-left-color: #64b5f6;"><div class="results-label">IQR</div><div class="results-value">${batch.iqr.toPrecision(10)}</div></div>`;
  
  $('#batchResults').innerHTML = batchHTML;
  
  // Error analysis
  const meanDiff = Math.abs(online.mean - batch.mean);
  const varDiff = Math.abs(online.variance - batch.variance);
  const stdDiff = Math.abs(online.stdDev - batch.stdDev);
  const meanDiffRel = Math.abs(meanDiff / Math.max(Math.abs(online.mean), 1e-15));
  const varDiffRel = Math.abs(varDiff / Math.max(Math.abs(online.variance), 1e-15));
  
  let errorHTML = '';
  errorHTML += `<div class="results-item"><div class="results-label">Mean Absolute Diff</div><div class="results-value">${meanDiff.toExponential(6)}</div></div>`;
  errorHTML += `<div class="results-item"><div class="results-label">Variance Absolute Diff</div><div class="results-value">${varDiff.toExponential(6)}</div></div>`;
  errorHTML += `<div class="results-item"><div class="results-label">Std Dev Absolute Diff</div><div class="results-value">${stdDiff.toExponential(6)}</div></div>`;
  errorHTML += `<div class="results-item" style="border-left-color: ${meanDiffRel < 1e-12 ? '#81c784' : meanDiffRel < 1e-10 ? '#ffc107' : '#ef5350'};"><div class="results-label">Mean Relative Error</div><div class="results-value">${(meanDiffRel * 100).toFixed(12)}%</div></div>`;
  errorHTML += `<div class="results-item" style="border-left-color: ${varDiffRel < 1e-12 ? '#81c784' : varDiffRel < 1e-10 ? '#ffc107' : '#ef5350'};"><div class="results-label">Variance Relative Error</div><div class="results-value">${(varDiffRel * 100).toFixed(12)}%</div></div>`;
  
  $('#errorAnalysis').innerHTML = errorHTML;
}

function displayStepByStep(steps) {
  let html = '';
  
  steps.forEach((step, idx) => {
    html += `<tr>
      <td style="color: #18e0e6; font-weight: bold;">${step.n}</td>
      <td><code>${typeof step.x === 'string' ? step.x : step.x.toPrecision(8)}</code></td>
      <td><code>${typeof step.delta === 'string' ? step.delta : step.delta.toPrecision(8)}</code></td>
      <td><code>${typeof step.newMean === 'string' ? step.newMean : step.newMean.toPrecision(10)}</code></td>
      <td><code>${typeof step.delta2 === 'string' ? step.delta2 : step.delta2.toPrecision(8)}</code></td>
      <td><code>${step.M2}</code></td>
      <td style="color: #18e0e6; font-weight: bold;"><code>${step.variance}</code></td>
    </tr>`;
  });
  
  $('#stepTable').innerHTML = html;
}

function displayCharts(data, online, batch) {
  // Destroy old charts
  Object.values(charts).forEach(chart => {
    if (chart) chart.destroy();
  });
  charts = {};
  
  // 1. Data Distribution Histogram
  const bins = Math.ceil(Math.sqrt(data.length));
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binWidth = (max - min) / bins;
  
  const binCounts = Array(bins).fill(0);
  data.forEach(x => {
    const binIdx = Math.min(bins - 1, Math.floor((x - min) / binWidth));
    binCounts[binIdx]++;
  });
  
  const binLabels = [];
  for (let i = 0; i < bins; i++) {
    binLabels.push((min + i * binWidth).toPrecision(5));
  }
  
  const ctx1 = document.getElementById('dataChart').getContext('2d');
  charts.data = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: binLabels,
      datasets: [{
        label: 'Frequency',
        data: binCounts,
        backgroundColor: 'rgba(24,224,230,0.6)',
        borderColor: '#18e0e6',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#b8d4ff' } }
      },
      scales: {
        y: { ticks: { color: '#b8d4ff' }, grid: { color: '#2d4a7a' } },
        x: { ticks: { color: '#b8d4ff' }, grid: { color: '#2d4a7a' } }
      }
    }
  });
  
  // 2. Mean & Std Dev Comparison
  const ctx2 = document.getElementById('comparisonChart').getContext('2d');
  charts.comparison = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: ['Mean', 'Std Dev', 'Variance'],
      datasets: [
        {
          label: 'Online (Welford)',
          data: [online.mean, online.stdDev, online.variance],
          backgroundColor: 'rgba(129,199,132,0.7)',
          borderColor: '#81c784',
          borderWidth: 2
        },
        {
          label: 'Batch',
          data: [batch.mean, batch.stdDev, batch.variance],
          backgroundColor: 'rgba(100,181,246,0.7)',
          borderColor: '#64b5f6',
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#b8d4ff' } }
      },
      scales: {
        y: { ticks: { color: '#b8d4ff' }, grid: { color: '#2d4a7a' } },
        x: { ticks: { color: '#b8d4ff' }, grid: { color: '#2d4a7a' } }
      }
    }
  });
  
  // 3. Mean Convergence (how mean evolves)
  let currentMean = 0;
  const meanEvolution = [];
  data.forEach(x => {
    currentMean = currentMean + (x - currentMean) / (meanEvolution.length + 1);
    meanEvolution.push(currentMean);
  });
  
  const convergenceLabels = [];
  for (let i = 0; i < Math.min(100, meanEvolution.length); i++) {
    convergenceLabels.push(i + 1);
  }
  const convergenceData = meanEvolution.slice(0, 100);
  
  const ctx3 = document.getElementById('convergenceChart').getContext('2d');
  charts.convergence = new Chart(ctx3, {
    type: 'line',
    data: {
      labels: convergenceLabels,
      datasets: [{
        label: 'Running Mean',
        data: convergenceData,
        borderColor: '#18e0e6',
        backgroundColor: 'rgba(24,224,230,0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#b8d4ff' } }
      },
      scales: {
        y: { ticks: { color: '#b8d4ff' }, grid: { color: '#2d4a7a' } },
        x: { ticks: { color: '#b8d4ff' }, grid: { color: '#2d4a7a' } }
      }
    }
  });
  
  // 4. Cumulative M2 Update (variance accumulation)
  let m2Accum = 0;
  let meanAccum = 0;
  const m2Evolution = [];
  data.forEach((x, idx) => {
    const delta = x - meanAccum;
    meanAccum = meanAccum + delta / (idx + 1);
    const delta2 = x - meanAccum;
    m2Accum = m2Accum + delta * delta2;
    m2Evolution.push(m2Accum);
  });
  
  const m2Labels = [];
  for (let i = 0; i < Math.min(100, m2Evolution.length); i++) {
    m2Labels.push(i + 1);
  }
  const m2Data = m2Evolution.slice(0, 100);
  
  const ctx4 = document.getElementById('varianceChart').getContext('2d');
  charts.variance = new Chart(ctx4, {
    type: 'line',
    data: {
      labels: m2Labels,
      datasets: [{
        label: 'M2 (Sum of Squared Deviations)',
        data: m2Data,
        borderColor: '#ffc107',
        backgroundColor: 'rgba(255,193,7,0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#b8d4ff' } }
      },
      scales: {
        y: { ticks: { color: '#b8d4ff' }, grid: { color: '#2d4a7a' } },
        x: { ticks: { color: '#b8d4ff' }, grid: { color: '#2d4a7a' } }
      }
    }
  });
}

function generateRandomData() {
  const size = prompt('Number of data points (1-10000):', '100');
  if (!size) return;
  
  const n = parseInt(size);
  if (n < 1 || n > 10000) {
    showAlert('Enter a number between 1 and 10000', 'error');
    return;
  }
  
  let data = [];
  for (let i = 0; i < n; i++) {
    data.push((Math.random() + Math.random() + Math.random() + Math.random() - 2) * 10 + 50);
  }
  
  $('#dataInput').value = data.map(x => x.toFixed(4)).join(', ');
  showAlert(`Generated ${n} random data points from normal-like distribution`, 'success');
}

function generateExtremeData() {
  const choice = prompt(
    'Choose test case:\n1 = Very large values\n2 = Very small values\n3 = Mixed scales\n4 = Near-zero variance\n5 = Highly skewed',
    '1'
  );
  
  let data = [];
  let description = '';
  
  switch (choice) {
    case '1':
      data = [1e10, 1e10 + 1, 1e10 + 2, 1e10 + 3, 1e10 + 4].map(x => x + Math.random());
      description = 'Very large values (tests overflow resistance)';
      break;
    case '2':
      data = [1e-10, 1e-10 + 1e-12, 1e-10 + 2e-12, 1e-10 + 3e-12, 1e-10 + 4e-12];
      description = 'Very small values (tests underflow resistance)';
      break;
    case '3':
      data = [0.001, 10, 0.0002, 1000, 0.003, 100, 0.004, 0.5, 50];
      description = 'Mixed scales (tests scale handling)';
      break;
    case '4':
      data = [100, 100.0001, 100.0002, 100.00015, 100.00025];
      description = 'Near-zero variance (tests precision with small variance)';
      break;
    case '5':
      data = [1, 1, 1, 1, 2, 2, 3, 5, 10, 20, 50, 100];
      description = 'Highly skewed (tests skewness/kurtosis)';
      break;
    default:
      showAlert('Invalid choice', 'error');
      return;
  }
  
  $('#dataInput').value = data.map(x => {
    if (Math.abs(x) > 1e6 || (Math.abs(x) < 1e-6 && x !== 0)) {
      return x.toExponential(10);
    }
    return x.toPrecision(12);
  }).join(', ');
  
  showAlert('Test case: ' + description, 'success');
}

function testNumericalStability() {
  const magnitude = parseFloat($('#magOrder').value);
  
  const baseData = [1, 1.1, 1.2, 1.3, 1.4];
  const data = baseData.map(x => x * magnitude);
  
  const online = computeOnlineDetailed(data);
  const batch = computeBatch(data);
  
  const normalData = baseData;
  const normalMean = normalData.reduce((a, b) => a + b) / normalData.length;
  const normalVar = normalData.reduce((sum, x) => sum + Math.pow(x - normalMean, 2), 0) / (normalData.length - 1);
  const trueVar = normalVar * magnitude * magnitude;
  
  const onlineVarError = Math.abs(online.variance - trueVar) / trueVar;
  const batchVarError = Math.abs(batch.variance - trueVar) / trueVar;
  
  let html = '';
  html += '<div class="results-grid">';
  
  // Test config
  html += '<div class="results-card">';
  html += '<h4>⚙️ Test Configuration</h4>';
  html += `<div class="results-item"><div class="results-label">Data Magnitude</div><div class="results-value">10^${Math.log10(magnitude).toFixed(1)}</div></div>`;
  html += `<div class="results-item"><div class="results-label">True Variance</div><div class="results-value">${trueVar.toExponential(10)}</div></div>`;
  html += `<div class="results-item"><div class="results-label">Test Data</div><div class="results-value" style="font-size: 0.9rem;">${data.map(x => x.toPrecision(8)).join(', ')}</div></div>`;
  html += '</div>';
  
  // Online results
  html += '<div class="results-card">';
  html += '<h4 style="color: #81c784;">✓ Online (Welford)</h4>';
  html += `<div class="results-item"><div class="results-label">Computed Variance</div><div class="results-value">${online.variance.toExponential(10)}</div></div>`;
  html += `<div class="results-item"><div class="results-label">Relative Error</div><div class="results-value">${onlineVarError.toExponential(6)}</div></div>`;
  html += `<div class="results-item"><div class="results-label">Error %</div><div class="results-value">${(onlineVarError * 100).toFixed(12)}%</div></div>`;
  html += `<div class="results-item" style="border-left-color: #81c784;"><div class="results-label">Status</div><div class="results-value" style="color: #81c784;">✓ ${
    onlineVarError < 1e-12 ? 'Excellent' : 
    onlineVarError < 1e-10 ? 'Good' : 
    '⚠ Acceptable'
  }</div></div>`;
  html += '</div>';
  
  // Batch results
  html += '<div class="results-card">';
  html += '<h4 style="color: #64b5f6;">△ Batch (Traditional)</h4>';
  html += `<div class="results-item"><div class="results-label">Computed Variance</div><div class="results-value">${batch.variance.toExponential(10)}</div></div>`;
  html += `<div class="results-item"><div class="results-label">Relative Error</div><div class="results-value">${batchVarError.toExponential(6)}</div></div>`;
  html += `<div class="results-item"><div class="results-label">Error %</div><div class="results-value">${(batchVarError * 100).toFixed(12)}%</div></div>`;
  html += `<div class="results-item" style="border-left-color: ${batchVarError < 1e-10 ? '#81c784' : '#ef5350'};"><div class="results-label">Status</div><div class="results-value" style="color: ${batchVarError < 1e-10 ? '#81c784' : '#ef5350'};">${
    batchVarError < 1e-12 ? '✓ Excellent' : 
    batchVarError < 1e-10 ? '✓ Good' : 
    '✗ Poor (Catastrophic Cancellation)'
  }</div></div>`;
  html += '</div>';
  
  html += '</div>';
  
  // Analysis
  html += '<div style="margin-top: 2rem; padding: 1.5rem; background: rgba(15,25,55,0.6); border-radius: 8px; border-left: 3px solid #4a9eff;">';
  html += '<strong style="color: #4a9eff; font-size: 1.05rem;">📊 Analysis & Interpretation:</strong><br><br>';
  html += `<div style="color: #b8d4ff; line-height: 2;">`;
  
  const ratio = batchVarError > 0 ? (onlineVarError / batchVarError) : 1;
  if (ratio < 1) {
    html += `✓ Online is <strong>${(1/ratio).toFixed(1)}× more accurate</strong> than batch<br>`;
  } else {
    html += `△ Batch is more accurate (unlikely edge case)<br>`;
  }
  
  html += `Data magnitude: 10^${Math.log10(magnitude).toFixed(1)} - `;
  if (magnitude > 1e9) {
    html += `very large (tests overflow, batch may fail)<br>`;
  } else if (magnitude > 1e6) {
    html += `large (batch may show reduced precision)<br>`;
  } else if (magnitude < 1e-6) {
    html += `very small (tests underflow)<br>`;
  } else {
    html += `moderate (typical case)<br>`;
  }
  
  if (batchVarError > 1e-10) {
    html += `<br>⚠️ <strong>CATASTROPHIC CANCELLATION DETECTED</strong> in batch algorithm!<br>`;
    html += `The batch formula computes Σx² - (Σx)²/n, causing loss of significant digits.`;
  } else if (batchVarError > 1e-12) {
    html += `<br>⚠️ Batch algorithm shows reduced precision at this magnitude.`;
  } else {
    html += `<br>✓ Both algorithms perform well at this magnitude.`;
  }
  
  html += `</div></div>`;
  
  $('#stabilityResults').innerHTML = html;
}

function percentile(sortedData, p) {
  if (sortedData.length === 0) return 0;
  const index = p * (sortedData.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;
  
  if (lower === upper) return sortedData[lower];
  return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
}

function clearAllResults() {
  $('#dataInput').value = '';
  $('#scaleFactor').value = '1';
  $('#mainResults').style.display = 'none';
  $('#stepSection').style.display = 'none';
  $('#stabilitySection').style.display = 'none';
  
  Object.values(charts).forEach(chart => {
    if (chart) chart.destroy();
  });
  charts = {};
  
  showAlert('All results cleared', 'success');
}

function showAlert(msg, type = 'info') {
  const alert = document.createElement('div');
  alert.className = `alert ${type}`;
  alert.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 1000; max-width: 500px;';
  alert.textContent = msg;
  document.body.appendChild(alert);
  
  setTimeout(() => {
    alert.style.opacity = '0';
    alert.style.transition = 'opacity 0.3s ease';
    setTimeout(() => alert.remove(), 300);
  }, 3000);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  console.log('[HW6] Statistics calculator ready');
  
  const navToggle = document.getElementById('navToggle');
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const navLinks = document.getElementById('navLinks');
      if (navLinks) {
        navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
      }
    });
  }
});
