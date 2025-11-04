/* ================================
   Homework 6: Online Algorithms
   Interactive Statistics Calculator
   ================================ */

const $ = sel => document.querySelector(sel);

// Main computation functions
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
    const onlineResults = computeOnline(data);
    const batchResults = computeBatch(data);
    
    // Display results
    displayComparison(onlineResults, batchResults, data);
    
    // Show step-by-step
    displayStepByStep(data);
    
  } catch (err) {
    showAlert('Error: ' + err.message, 'error');
  }
}

function computeOnline(data) {
  let n = 0;
  let mean = 0;
  let M2 = 0;
  let M3 = 0;
  let M4 = 0;
  
  for (let x of data) {
    n++;
    const delta = x - mean;
    mean = mean + delta / n;
    const delta2 = x - mean;
    
    M4 = M4 + delta * delta2 * delta2 * delta2 * (n*n - 3*n + 3) 
         + 6 * delta2 * delta2 * M2 - 4 * delta2 * M3;
    M3 = M3 + delta * delta2 * delta2 * (n - 2) - 3 * delta2 * M2;
    M2 = M2 + delta * delta2;
  }
  
  const variance = n > 1 ? M2 / (n - 1) : 0;
  const stdDev = Math.sqrt(variance);
  const skewness = M2 > 0 ? M3 / Math.pow(M2, 1.5) : 0;
  const kurtosis = M2 > 0 ? M4 / (M2 * M2) - 3 : 0;
  
  return {
    method: 'Online (Welford)',
    n,
    mean,
    variance,
    stdDev,
    M2,
    M3,
    M4,
    skewness,
    kurtosis,
    min: Math.min(...data),
    max: Math.max(...data),
    range: Math.max(...data) - Math.min(...data),
    computationSteps: n
  };
}

function computeBatch(data) {
  const n = data.length;
  
  // Compute mean first
  const sum = data.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  
  // Compute sum of squared deviations
  const sumSquaredDev = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0);
  const variance = n > 1 ? sumSquaredDev / (n - 1) : 0;
  const stdDev = Math.sqrt(variance);
  
  // Third moment
  const M3 = data.reduce((sum, x) => sum + Math.pow(x - mean, 3), 0);
  const skewness = stdDev > 0 ? M3 / (n * Math.pow(stdDev, 3)) : 0;
  
  // Fourth moment
  const M4 = data.reduce((sum, x) => sum + Math.pow(x - mean, 4), 0);
  const kurtosis = stdDev > 0 ? M4 / (n * variance * variance) - 3 : 0;
  
  return {
    method: 'Batch (Traditional)',
    n,
    mean,
    variance,
    stdDev,
    skewness,
    kurtosis,
    min: Math.min(...data),
    max: Math.max(...data),
    range: Math.max(...data) - Math.min(...data),
    computationSteps: 3 // mean, then summed deviations, then moments
  };
}

function displayComparison(online, batch, data) {
  const resultsDiv = $('#results');
  
  let html = '<div class="results-display">';
  html += '<h3 style="color: #18e0e6; margin-bottom: 1.5rem;">📊 Results Comparison</h3>';
  
  // Basic statistics
  html += '<div class="comparison-results">';
  
  // Online results
  html += '<div class="comparison-card">';
  html += '<h4>✓ Online Algorithm (Welford)</h4>';
  html += `<div class="comparison-item"><strong>Sample Size:</strong> ${online.n}</div>`;
  html += `<div class="comparison-item"><strong>Mean:</strong> <code>${online.mean.toPrecision(15)}</code></div>`;
  html += `<div class="comparison-item"><strong>Variance:</strong> <code>${online.variance.toPrecision(15)}</code></div>`;
  html += `<div class="comparison-item"><strong>Std Deviation:</strong> <code>${online.stdDev.toPrecision(15)}</code></div>`;
  html += `<div class="comparison-item"><strong>Skewness:</strong> <code>${online.skewness.toPrecision(10)}</code></div>`;
  html += `<div class="comparison-item"><strong>Kurtosis:</strong> <code>${online.kurtosis.toPrecision(10)}</code></div>`;
  html += `<div class="comparison-item"><strong>Min:</strong> <code>${online.min.toPrecision(10)}</code></div>`;
  html += `<div class="comparison-item"><strong>Max:</strong> <code>${online.max.toPrecision(10)}</code></div>`;
  html += '</div>';
  
  // Batch results
  html += '<div class="comparison-card">';
  html += '<h4>△ Batch Algorithm (Traditional)</h4>';
  html += `<div class="comparison-item"><strong>Sample Size:</strong> ${batch.n}</div>`;
  html += `<div class="comparison-item"><strong>Mean:</strong> <code>${batch.mean.toPrecision(15)}</code></div>`;
  html += `<div class="comparison-item"><strong>Variance:</strong> <code>${batch.variance.toPrecision(15)}</code></div>`;
  html += `<div class="comparison-item"><strong>Std Deviation:</strong> <code>${batch.stdDev.toPrecision(15)}</code></div>`;
  html += `<div class="comparison-item"><strong>Skewness:</strong> <code>${batch.skewness.toPrecision(10)}</code></div>`;
  html += `<div class="comparison-item"><strong>Kurtosis:</strong> <code>${batch.kurtosis.toPrecision(10)}</code></div>`;
  html += `<div class="comparison-item"><strong>Min:</strong> <code>${batch.min.toPrecision(10)}</code></div>`;
  html += `<div class="comparison-item"><strong>Max:</strong> <code>${batch.max.toPrecision(10)}</code></div>`;
  html += '</div>';
  
  // Error analysis
  html += '<div class="comparison-card">';
  html += '<h4>⚠️ Numerical Differences</h4>';
  const meanDiff = Math.abs(online.mean - batch.mean);
  const varDiff = Math.abs(online.variance - batch.variance);
  const stdDiff = Math.abs(online.stdDev - batch.stdDev);
  const skewDiff = Math.abs(online.skewness - batch.skewness);
  const kurtDiff = Math.abs(online.kurtosis - batch.kurtosis);
  
  html += `<div class="comparison-item"><strong>Mean Diff:</strong> <code>${meanDiff.toExponential(6)}</code></div>`;
  html += `<div class="comparison-item"><strong>Variance Diff:</strong> <code>${varDiff.toExponential(6)}</code></div>`;
  html += `<div class="comparison-item"><strong>Std Dev Diff:</strong> <code>${stdDiff.toExponential(6)}</code></div>`;
  html += `<div class="comparison-item"><strong>Skewness Diff:</strong> <code>${skewDiff.toExponential(6)}</code></div>`;
  html += `<div class="comparison-item"><strong>Kurtosis Diff:</strong> <code>${kurtDiff.toExponential(6)}</code></div>`;
  html += '</div>';
  
  html += '</div>';
  
  // Quartiles and percentiles
  html += '<div style="margin-top: 1.5rem; padding: 1rem; background: rgba(15,25,55,0.6); border-radius: 8px; border-left: 3px solid #4a9eff;">';
  html += '<strong style="color: #4a9eff;">📉 Percentiles & Quartiles:</strong><br>';
  
  const sorted = [...data].sort((a, b) => a - b);
  const q1 = percentile(sorted, 0.25);
  const q2 = percentile(sorted, 0.50);
  const q3 = percentile(sorted, 0.75);
  const iqr = q3 - q1;
  const p1 = percentile(sorted, 0.01);
  const p99 = percentile(sorted, 0.99);
  
  html += `<div style="margin-top: 0.5rem; color: #b8d4ff;">`;
  html += `Q1 (25%): <code>${q1.toPrecision(10)}</code> | `;
  html += `Q2 (50%): <code>${q2.toPrecision(10)}</code> | `;
  html += `Q3 (75%): <code>${q3.toPrecision(10)}</code> | `;
  html += `IQR: <code>${iqr.toPrecision(10)}</code><br>`;
  html += `P1: <code>${p1.toPrecision(10)}</code> | `;
  html += `P99: <code>${p99.toPrecision(10)}</code>`;
  html += `</div></div>`;
  
  html += '</div>';
  
  resultsDiv.innerHTML = html;
}

function displayStepByStep(data) {
  const stepDiv = $('#stepByStep');
  
  let html = '<div style="background: rgba(8,15,35,0.9); border-radius: 8px; padding: 1rem; margin: 1rem 0; font-family: monospace; font-size: 0.9rem; max-height: 400px; overflow-y: auto;">';
  
  let n = 0;
  let mean = 0;
  let M2 = 0;
  
  html += '<div style="color: #18e0e6; margin-bottom: 0.5rem;"><strong>Welford\'s Algorithm Step-by-Step:</strong></div>';
  html += '<div style="color: #b8d4ff; margin-bottom: 1rem;">Initialize: mean=0, M2=0</div>';
  
  for (let i = 0; i < Math.min(data.length, 20); i++) {
    const x = data[i];
    n++;
    const delta = x - mean;
    mean = mean + delta / n;
    const delta2 = x - mean;
    M2 = M2 + delta * delta2;
    
    const variance = n > 1 ? M2 / (n - 1) : 0;
    
    html += `<div style="color: #b8d4ff; margin: 0.3rem 0; padding: 0.3rem; background: rgba(24,224,230,0.08); border-left: 2px solid #4a9eff;">`;
    html += `n=${n}: x=${x.toFixed(4)} | δ=${delta.toFixed(6)} | mean=${mean.toFixed(6)} | M2=${M2.toFixed(8)} | var=${variance.toFixed(8)}`;
    html += `</div>`;
  }
  
  if (data.length > 20) {
    html += `<div style="color: #ffc107; margin-top: 1rem;">... (${data.length - 20} more values)</div>`;
  }
  
  html += '</div>';
  stepDiv.innerHTML = html;
}

function generateRandomData() {
  const size = prompt('Number of data points:', '50');
  if (!size) return;
  
  const n = parseInt(size);
  if (n < 1 || n > 10000) {
    showAlert('Enter a number between 1 and 10000', 'error');
    return;
  }
  
  let data = [];
  for (let i = 0; i < n; i++) {
    // Generate from normal-like distribution
    data.push((Math.random() + Math.random() + Math.random() + Math.random() - 2) * 5 + 50);
  }
  
  $('#dataInput').value = data.map(x => x.toFixed(4)).join(', ');
  showAlert(`Generated ${n} random data points`, 'success');
}

function generateExtremeData() {
  const choice = prompt(
    'Choose test case:\n1 = Very large values\n2 = Very small values\n3 = Mixed scales\n4 = Near-zero variance\n5 = Skewed distribution',
    '1'
  );
  
  let data = [];
  
  switch (choice) {
    case '1': // Very large values
      data = [1e10, 1e10 + 1, 1e10 + 2, 1e10 + 3, 1e10 + 4].map(x => x + Math.random());
      break;
    case '2': // Very small values
      data = [1e-10, 1e-10 + 1e-12, 1e-10 + 2e-12, 1e-10 + 3e-12, 1e-10 + 4e-12];
      break;
    case '3': // Mixed scales
      data = [0.001, 10, 0.0002, 1000, 0.003, 100, 0.004];
      break;
    case '4': // Near-zero variance
      data = [100, 100.0001, 100.0002, 100.00015, 100.00025];
      break;
    case '5': // Skewed
      data = [1, 1, 1, 1, 2, 2, 3, 5, 10, 20, 50];
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
  
  showAlert('Generated extreme data test case', 'success');
}

function testNumericalStability() {
  const magnitude = parseFloat($('#magOrder').value);
  const resultsDiv = $('#stabilityResults');
  
  // Generate test data at specific magnitude
  const baseData = [1, 1.1, 1.2, 1.3, 1.4];
  const data = baseData.map(x => x * magnitude);
  
  // Compute with both methods
  const online = computeOnline(data);
  const batch = computeBatch(data);
  
  // True variance (computed on normalized data)
  const normalData = baseData;
  const normalMean = normalData.reduce((a, b) => a + b) / normalData.length;
  const normalVar = normalData.reduce((sum, x) => sum + Math.pow(x - normalMean, 2), 0) / (normalData.length - 1);
  const trueVar = normalVar * magnitude * magnitude;
  
  const onlineVarError = Math.abs(online.variance - trueVar) / trueVar;
  const batchVarError = Math.abs(batch.variance - trueVar) / trueVar;
  
  let html = '<div class="results-display">';
  html += '<h3 style="color: #18e0e6; margin-bottom: 1.5rem;">🧪 Numerical Stability Test Results</h3>';
  
  html += '<div class="comparison-results">';
  
  // Test parameters
  html += '<div class="comparison-card">';
  html += '<h4>Test Configuration</h4>';
  html += `<div class="comparison-item"><strong>Data Magnitude:</strong> 10^${Math.log10(magnitude).toFixed(1)}</div>`;
  html += `<div class="comparison-item"><strong>Data Points:</strong> ${data.map(x => x.toPrecision(8)).join(', ')}</div>`;
  html += `<div class="comparison-item"><strong>True Variance:</strong> <code>${trueVar.toExponential(10)}</code></div>`;
  html += '</div>';
  
  // Online results
  html += '<div class="comparison-card">';
  html += '<h4>Online Algorithm</h4>';
  html += `<div class="comparison-item"><strong>Computed Variance:</strong> <code>${online.variance.toExponential(10)}</code></div>`;
  html += `<div class="comparison-item"><strong>Relative Error:</strong> <code>${onlineVarError.toExponential(6)}</code></div>`;
  html += `<div class="comparison-item"><strong>Error %:</strong> ${(onlineVarError * 100).toFixed(10)}%</div>`;
  html += `<div class="comparison-item" style="color: ${onlineVarError < 1e-12 ? '#81c784' : onlineVarError < 1e-10 ? '#ffc107' : '#ef5350'};"><strong>Status:</strong> ${
    onlineVarError < 1e-12 ? '✓ Excellent' : 
    onlineVarError < 1e-10 ? '⚠ Good' : 
    '✗ Poor'
  }</div>`;
  html += '</div>';
  
  // Batch results
  html += '<div class="comparison-card">';
  html += '<h4>Batch Algorithm</h4>';
  html += `<div class="comparison-item"><strong>Computed Variance:</strong> <code>${batch.variance.toExponential(10)}</code></div>`;
  html += `<div class="comparison-item"><strong>Relative Error:</strong> <code>${batchVarError.toExponential(6)}</code></div>`;
  html += `<div class="comparison-item"><strong>Error %:</strong> ${(batchVarError * 100).toFixed(10)}%</div>`;
  html += `<div class="comparison-item" style="color: ${batchVarError < 1e-12 ? '#81c784' : batchVarError < 1e-10 ? '#ffc107' : '#ef5350'};"><strong>Status:</strong> ${
    batchVarError < 1e-12 ? '✓ Excellent' : 
    batchVarError < 1e-10 ? '⚠ Good' : 
    '✗ Poor'
  }</div>`;
  html += '</div>';
  
  html += '</div>';
  
  // Analysis
  html += '<div style="margin-top: 1.5rem; padding: 1rem; background: rgba(15,25,55,0.6); border-radius: 8px; border-left: 3px solid #4a9eff;">';
  html += '<strong style="color: #4a9eff;">Analysis:</strong><br>';
  html += `<div style="margin-top: 0.5rem; color: #b8d4ff;">`;
  
  if (onlineVarError < batchVarError) {
    html += `✓ Online algorithm is <strong>${(batchVarError / onlineVarError).toFixed(1)}× more accurate</strong> than batch<br>`;
  } else if (batchVarError < onlineVarError) {
    html += `△ Batch algorithm is more accurate (unexpected!)<br>`;
  } else {
    html += `Both methods perform similarly<br>`;
  }
  
  html += `Data magnitude (10^${Math.log10(magnitude).toFixed(1)}) tests the algorithm's ${
    magnitude > 1e6 ? 'overflow resistance' :
    magnitude < 1e-6 ? 'underflow resistance' :
    'general stability'
  }.<br>`;
  
  if (batchVarError > 1e-10 && magnitude > 1e6) {
    html += `⚠️ Batch shows signs of catastrophic cancellation at this magnitude!<br>`;
  }
  if (batchVarError > 1e-10 && magnitude < 1e-6) {
    html += `⚠️ Batch suffers from underflow at this magnitude!<br>`;
  }
  
  html += '</div></div>';
  
  html += '</div>';
  
  resultsDiv.innerHTML = html;
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

function clearResults() {
  $('#results').innerHTML = '';
  $('#stepByStep').innerHTML = '';
  $('#stabilityResults').innerHTML = '';
  showAlert('Results cleared', 'success');
}

function showAlert(msg, type = 'info') {
  const alert = document.createElement('div');
  alert.className = `alert ${type}`;
  alert.textContent = msg;
  const container = document.querySelector('.interactive-tool');
  if (container) {
    container.prepend(alert);
    setTimeout(() => alert.remove(), 3000);
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  console.log('[HW6] Statistics calculator ready');
  
  // Mobile nav
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
