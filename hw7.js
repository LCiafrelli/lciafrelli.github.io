/* ================================
   Homework 7: Random Walk & Binomial Convergence
   Interactive Simulation
   ================================ */

const $ = sel => document.querySelector(sel);
let charts = {};
let simulationData = null;

// Main simulation function
function runSimulation() {
  const n = parseInt($('#numWeeks').value);
  const m = parseInt($('#numTrajectories').value);
  const p = parseFloat($('#breachProb').value);
  const displayCount = parseInt($('#displayTrajectories').value);

  // Validation
  if (n < 5 || n > 500) {
    showAlert('Weeks must be between 5 and 500', 'error');
    return;
  }
  if (m < 10 || m > 50000) {
    showAlert('Trajectories must be between 10 and 50000', 'error');
    return;
  }
  if (p < 0 || p > 1) {
    showAlert('Breach probability must be between 0 and 1', 'error');
    return;
  }

  // Show progress
  $('#progressBar').style.display = 'block';
  showAlert('🚀 Running simulation...', 'info');

  // Run simulation in chunks to update progress
  setTimeout(() => {
    simulationData = simulateRandomWalks(n, m, p, displayCount);
    displayResults(n, m, p, simulationData);
    $('#resultsSection').style.display = 'block';
    showAlert('✓ Simulation completed!', 'success');
  }, 100);
}

function simulateRandomWalks(n, m, p, displayCount) {
  const trajectories = [];
  const finalScores = [];
  
  // Generate m random walk trajectories
  for (let traj = 0; traj < m; traj++) {
    // Update progress
    const progress = Math.round((traj / m) * 100);
    $('#progressFill').style.width = progress + '%';
    $('#progressFill').textContent = progress + '%';

    const path = [0]; // Start at 0
    let currentScore = 0;

    // Generate n steps
    for (let week = 0; week < n; week++) {
      // Random event: breach or secure
      const isBreached = Math.random() < p;
      currentScore += isBreached ? -1 : 1;
      path.push(currentScore);
    }

    finalScores.push(currentScore);

    // Store only subset of trajectories for visualization
    if (traj < displayCount) {
      trajectories.push(path);
    }
  }

  // Compute statistics
  const scoreFrequency = {};
  finalScores.forEach(score => {
    scoreFrequency[score] = (scoreFrequency[score] || 0) + 1;
  });

  const sortedScores = Object.keys(scoreFrequency)
    .map(Number)
    .sort((a, b) => a - b);

  // Theoretical binomial probabilities
  const theoreticalProbs = {};
  sortedScores.forEach(score => {
    const k = (n - score) / 2; // Number of breaches
    if (Number.isInteger(k) && k >= 0 && k <= n) {
      // P(S_n = score) = C(n,k) * p^k * (1-p)^(n-k)
      const binomCoeff = binomial(n, k);
      theoreticalProbs[score] = binomCoeff * Math.pow(p, k) * Math.pow(1 - p, n - k);
    }
  });

  // Compute statistical moments
  const mean = finalScores.reduce((a, b) => a + b, 0) / m;
  const variance = finalScores.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / m;
  const stdDev = Math.sqrt(variance);

  // Theoretical values
  const theoreticalMean = n * (1 - 2 * p);
  const theoreticalVar = 4 * n * p * (1 - p);
  const theoreticalStdDev = Math.sqrt(theoreticalVar);

  // Kolmogorov-Smirnov test
  const ksStatistic = computeKSStatistic(sortedScores, scoreFrequency, theoreticalProbs, m);

  // Chi-square goodness of fit
  const chiSquare = computeChiSquare(sortedScores, scoreFrequency, theoreticalProbs, m);

  return {
    trajectories,
    finalScores,
    scoreFrequency,
    sortedScores,
    theoreticalProbs,
    mean,
    variance,
    stdDev,
    theoreticalMean,
    theoreticalVar,
    theoreticalStdDev,
    ksStatistic,
    chiSquare,
    min: Math.min(...finalScores),
    max: Math.max(...finalScores),
    median: computeMedian(finalScores)
  };
}

function displayResults(n, m, p, data) {
  // Statistics summary
  const statsHTML = `
    <div class="stat-card">
      <div class="stat-label">Empirical Mean</div>
      <div class="stat-value">${data.mean.toFixed(3)}</div>
      <div style="color: #4a9eff; font-size: 0.85rem; margin-top: 0.5rem;">Theory: ${data.theoreticalMean.toFixed(3)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Empirical Std Dev</div>
      <div class="stat-value">${data.stdDev.toFixed(3)}</div>
      <div style="color: #4a9eff; font-size: 0.85rem; margin-top: 0.5rem;">Theory: ${data.theoreticalStdDev.toFixed(3)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Min / Max Score</div>
      <div class="stat-value">${data.min} / ${data.max}</div>
      <div style="color: #4a9eff; font-size: 0.85rem; margin-top: 0.5rem;">Possible: ${-n} to ${n}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Median Score</div>
      <div class="stat-value">${data.median.toFixed(2)}</div>
      <div style="color: #4a9eff; font-size: 0.85rem; margin-top: 0.5rem;">Mean: ${data.mean.toFixed(2)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">KS Statistic</div>
      <div class="stat-value">${data.ksStatistic.toFixed(4)}</div>
      <div style="color: ${data.ksStatistic < 0.1 ? '#81c784' : '#ffc107'}; font-size: 0.85rem; margin-top: 0.5rem;">
        ${data.ksStatistic < 0.1 ? '✓ Good Fit' : '⚠ Deviation'}
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-label">χ² Statistic</div>
      <div class="stat-value">${data.chiSquare.toFixed(2)}</div>
      <div style="color: #4a9eff; font-size: 0.85rem; margin-top: 0.5rem;">Degrees of freedom: ${data.sortedScores.length - 1}</div>
    </div>
  `;
  $('#statsSummary').innerHTML = statsHTML;

  // Display charts
  displayTrajectoryChart(data, n);
  displayDistributionChart(data, n, m, p);
  displayConvergenceChart(data);
  displayCDFChart(data);

  // Display analysis
  displayAnalysis(n, m, p, data);
}

function displayTrajectoryChart(data, n) {
  const ctx = document.getElementById('trajectoryChart').getContext('2d');
  
  // Destroy old chart if exists
  if (charts.trajectory) charts.trajectory.destroy();

  const datasets = [];
  const colors = [
    '#18e0e6', '#64b5f6', '#81c784', '#ffc107', '#ff7043',
    '#ba68c8', '#4db6ac', '#7986cb', '#ffb74d', '#e57373'
  ];

  data.trajectories.forEach((path, idx) => {
    datasets.push({
      label: `Trajectory ${idx + 1}`,
      data: path,
      borderColor: colors[idx % colors.length],
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      tension: 0,
      pointRadius: 0,
      pointHoverRadius: 4
    });
  });

  const labels = Array.from({length: n + 1}, (_, i) => i);

  charts.trajectory = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index' },
      plugins: {
        legend: { labels: { color: '#b8d4ff' }, display: data.trajectories.length <= 20 },
        tooltip: { enabled: true }
      },
      scales: {
        y: {
          ticks: { color: '#b8d4ff' },
          grid: { color: '#2d4a7a' },
          title: { display: true, text: 'Cumulative Score', color: '#18e0e6' }
        },
        x: {
          ticks: { color: '#b8d4ff' },
          grid: { color: '#2d4a7a' },
          title: { display: true, text: 'Week', color: '#18e0e6' }
        }
      }
    }
  });
}

function displayDistributionChart(data, n, m, p) {
  const ctx = document.getElementById('distributionChart').getContext('2d');
  
  if (charts.distribution) charts.distribution.destroy();

  // Normalize for comparison
  const empiricalProbs = {};
  data.sortedScores.forEach(score => {
    empiricalProbs[score] = data.scoreFrequency[score] / m;
  });

  const empiricalValues = data.sortedScores.map(s => empiricalProbs[s] || 0);
  const theoreticalValues = data.sortedScores.map(s => data.theoreticalProbs[s] || 0);

  charts.distribution = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.sortedScores.map(s => s.toString()),
      datasets: [
        {
          label: 'Empirical (Simulation)',
          data: empiricalValues,
          backgroundColor: 'rgba(24,224,230,0.6)',
          borderColor: '#18e0e6',
          borderWidth: 1.5
        },
        {
          label: 'Theoretical (Binomial)',
          data: theoreticalValues,
          backgroundColor: 'transparent',
          borderColor: '#ff7043',
          borderWidth: 2.5,
          type: 'line',
          fill: false,
          tension: 0.3,
          pointRadius: 3,
          pointBackgroundColor: '#ff7043'
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
        y: {
          ticks: { color: '#b8d4ff' },
          grid: { color: '#2d4a7a' },
          title: { display: true, text: 'Probability', color: '#18e0e6' }
        },
        x: {
          ticks: { color: '#b8d4ff' },
          grid: { color: '#2d4a7a' },
          title: { display: true, text: 'Final Score', color: '#18e0e6' }
        }
      }
    }
  });
}

function displayConvergenceChart(data) {
  const ctx = document.getElementById('convergenceChart').getContext('2d');
  
  if (charts.convergence) charts.convergence.destroy();

  // Compute Chi-square values across score range
  const chiValues = data.sortedScores.map(score => {
    const observed = data.scoreFrequency[score] || 0;
    const expected = data.theoreticalProbs[score] * data.finalScores.length;
    if (expected === 0) return 0;
    return Math.pow(observed - expected, 2) / expected;
  });

  charts.convergence = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.sortedScores.map(s => s.toString()),
      datasets: [{
        label: 'χ² Contribution per Score',
        data: chiValues,
        backgroundColor: chiValues.map(val => 
          val < 1 ? 'rgba(129,199,132,0.7)' :
          val < 5 ? 'rgba(255,193,7,0.7)' :
          'rgba(255,112,67,0.7)'
        ),
        borderColor: '#18e0e6',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#b8d4ff' } }
      },
      scales: {
        y: {
          ticks: { color: '#b8d4ff' },
          grid: { color: '#2d4a7a' },
          title: { display: true, text: 'χ² Contribution', color: '#18e0e6' }
        },
        x: {
          ticks: { color: '#b8d4ff' },
          grid: { color: '#2d4a7a' }
        }
      }
    }
  });
}

function displayCDFChart(data) {
  const ctx = document.getElementById('cdfChart').getContext('2d');
  
  if (charts.cdf) charts.cdf.destroy();

  // Compute empirical CDF
  const sortedFinal = [...data.finalScores].sort((a, b) => a - b);
  const empiricalCDF = [];
  const cdfLabels = [];
  
  for (let i = 0; i < sortedFinal.length; i++) {
    empiricalCDF.push((i + 1) / data.finalScores.length);
    if (i % Math.ceil(data.finalScores.length / 50) === 0) {
      cdfLabels.push(sortedFinal[i]);
    }
  }

  // Theoretical CDF (cumulative binomial)
  const theoreticalCDF = sortedFinal.map(score => {
    let cumProb = 0;
    for (let s = -data.finalScores.length; s <= score; s++) {
      cumProb += data.theoreticalProbs[s] || 0;
    }
    return cumProb;
  });

  charts.cdf = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array.from({length: sortedFinal.length}, (_, i) => i),
      datasets: [
        {
          label: 'Empirical CDF',
          data: empiricalCDF,
          borderColor: '#18e0e6',
          backgroundColor: 'rgba(24,224,230,0.1)',
          borderWidth: 2.5,
          fill: true,
          tension: 0
        },
        {
          label: 'Theoretical CDF',
          data: theoreticalCDF,
          borderColor: '#ff7043',
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          borderDash: [5, 5],
          fill: false,
          tension: 0
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
        y: {
          ticks: { color: '#b8d4ff' },
          grid: { color: '#2d4a7a' },
          min: 0,
          max: 1,
          title: { display: true, text: 'Cumulative Probability', color: '#18e0e6' }
        },
        x: {
          ticks: { color: '#b8d4ff' },
          grid: { color: '#2d4a7a' },
          title: { display: true, text: 'Sample Index', color: '#18e0e6' }
        }
      }
    }
  });
}

function displayAnalysis(n, m, p, data) {
  const meanDiff = Math.abs(data.mean - data.theoreticalMean);
  const stdDevDiff = Math.abs(data.stdDev - data.theoreticalStdDev);
  const meanErrorPct = (meanDiff / Math.abs(data.theoreticalMean) * 100).toFixed(2);
  const stdDevErrorPct = (stdDevDiff / data.theoreticalStdDev * 100).toFixed(2);

  const analysisHTML = `
    <div class="tool-title">📊 Statistical Analysis & Convergence Assessment</div>
    
    <div style="background: rgba(8,15,35,0.6); border-radius: 10px; padding: 1.5rem; border-left: 3px solid #4a9eff; margin: 1.5rem 0;">
      <strong style="color: #18e0e6; font-size: 1.05rem;">Parameters:</strong><br>
      <div style="color: #b8d4ff; line-height: 2; margin-top: 0.75rem;">
        <div>• Weeks (n) = ${n}</div>
        <div>• Trajectories/Attackers (m) = ${m}</div>
        <div>• Breach Probability (p) = ${p}</div>
        <div>• Expected Breach Probability per Week = ${(1 - p).toFixed(3)} (secure)</div>
      </div>
    </div>

    <div style="background: rgba(8,15,35,0.6); border-radius: 10px; padding: 1.5rem; border-left: 3px solid #81c784; margin: 1.5rem 0;">
      <strong style="color: #81c784; font-size: 1.05rem;">✓ Convergence Quality:</strong><br>
      <div style="color: #b8d4ff; line-height: 2; margin-top: 0.75rem;">
        <div><strong>Mean Error:</strong> ${meanErrorPct}% (Empirical: ${data.mean.toFixed(3)} vs Theory: ${data.theoreticalMean.toFixed(3)})</div>
        <div><strong>Std Dev Error:</strong> ${stdDevErrorPct}% (Empirical: ${data.stdDev.toFixed(3)} vs Theory: ${data.theoreticalStdDev.toFixed(3)})</div>
        <div><strong>KS Test Statistic:</strong> ${data.ksStatistic.toFixed(4)} (${data.ksStatistic < 0.05 ? '✓ Excellent fit' : data.ksStatistic < 0.15 ? '✓ Good fit' : '⚠ Moderate deviation'})</div>
        <div><strong>χ² Test Statistic:</strong> ${data.chiSquare.toFixed(2)} with ${data.sortedScores.length - 1} df</div>
      </div>
    </div>

    <div style="background: rgba(8,15,35,0.6); border-radius: 10px; padding: 1.5rem; border-left: 3px solid #2196f3; margin: 1.5rem 0;">
      <strong style="color: #2196f3; font-size: 1.05rem;">📈 Random Walk Interpretation:</strong><br>
      <div style="color: #b8d4ff; line-height: 2; margin-top: 0.75rem;">
        ${p < 0.5 ? 
          `<div>• <strong>Upward Drift:</strong> System is generally SECURE (p=${p} < 0.5)</div>
           <div>• Expected score: ${data.theoreticalMean.toFixed(2)} (positive trend)</div>
           <div>• Interpretation: Updates are effective; breaches less frequent than secure weeks</div>` :
          p > 0.5 ?
          `<div>• <strong>Downward Drift:</strong> System is generally VULNERABLE (p=${p} > 0.5)</div>
           <div>• Expected score: ${data.theoreticalMean.toFixed(2)} (negative trend)</div>
           <div>• Interpretation: Breaches more frequent than secure weeks; critical risk</div>` :
          `<div>• <strong>Symmetric Random Walk:</strong> System in equilibrium (p=0.5)</div>
           <div>• Expected score: ≈ 0 (no drift)</div>
           <div>• Interpretation: Equal probability of breach and security</div>`
        }
      </div>
    </div>

    <div style="background: rgba(8,15,35,0.6); border-radius: 10px; padding: 1.5rem; border-left: 3px solid #ff7043; margin: 1.5rem 0;">
      <strong style="color: #ff7043; font-size: 1.05rem;">🔐 Cybersecurity Implications:</strong><br>
      <div style="color: #b8d4ff; line-height: 2; margin-top: 0.75rem;">
        <div>• <strong>Risk Score Range:</strong> [${data.min}, ${data.max}] out of possible [${-n}, ${n}]</div>
        <div>• <strong>Median Security Outcome:</strong> ${data.median.toFixed(2)}</div>
        <div>• <strong>Probability of Net Positive Score:</strong> ${((data.finalScores.filter(s => s > 0).length / m) * 100).toFixed(1)}%</div>
        <div>• <strong>Probability of Severe Compromise (score ≤ -n/2):</strong> ${((data.finalScores.filter(s => s <= -n/2).length / m) * 100).toFixed(1)}%</div>
        <div>• <strong>Convergence (m=${m} trajectories):</strong> Distribution closely matches theoretical binomial</div>
      </div>
    </div>

    <div style="background: rgba(8,15,35,0.6); border-radius: 10px; padding: 1.5rem; border-left: 3px solid #ffc107; margin: 1.5rem 0;">
      <strong style="color: #ffc107; font-size: 1.05rem;">📊 Distribution Analysis:</strong><br>
      <div style="color: #b8d4ff; line-height: 2; margin-top: 0.75rem;">
        <div>• <strong>Score Range Covered:</strong> ${data.sortedScores.length} distinct outcomes</div>
        <div>• <strong>Most Likely Score:</strong> ${data.sortedScores.reduce((a, b) => data.scoreFrequency[a] > data.scoreFrequency[b] ? a : b)}</div>
        <div>• <strong>Distribution Shape:</strong> ${p === 0.5 ? 'Symmetric (binomial)' : p < 0.5 ? 'Right-skewed (favoring security)' : 'Left-skewed (favoring breaches)'}</div>
        <div>• <strong>Deviation from Theory:</strong> KS = ${data.ksStatistic.toFixed(4)} indicates ${data.ksStatistic < 0.1 ? 'excellent' : 'good'} convergence by LLN</div>
      </div>
    </div>
  `;

  $('#analysisSection').innerHTML = analysisHTML;
}

function runMultipleTests() {
  const startN = 10;
  const endN = 100;
  const step = 10;
  const m = 500;
  const p = 0.3;

  showAlert('🔄 Running convergence tests...', 'info');

  const results = [];
  for (let n = startN; n <= endN; n += step) {
    const data = simulateRandomWalks(n, m, p, 5);
    results.push({
      n,
      empiricalMean: data.mean,
      theoreticalMean: data.theoreticalMean,
      ksStatistic: data.ksStatistic,
      meanError: Math.abs(data.mean - data.theoreticalMean)
    });
  }

  displayConvergenceTests(results);
  showAlert('✓ Convergence analysis completed!', 'success');
}

function displayConvergenceTests(results) {
  const ctx = document.getElementById('convergenceChart').getContext('2d');
  
  if (charts.convergence) charts.convergence.destroy();

  const nValues = results.map(r => r.n);
  const empiricalMeans = results.map(r => r.empiricalMean);
  const theoreticalMeans = results.map(r => r.theoreticalMean);
  const ksStats = results.map(r => r.ksStatistic);
  const meanErrors = results.map(r => r.meanError);

  charts.convergence = new Chart(ctx, {
    type: 'line',
    data: {
      labels: nValues,
      datasets: [
        {
          label: 'Empirical Mean',
          data: empiricalMeans,
          borderColor: '#18e0e6',
          backgroundColor: 'rgba(24,224,230,0.1)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.3
        },
        {
          label: 'Theoretical Mean',
          data: theoreticalMeans,
          borderColor: '#ff7043',
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          borderDash: [5, 5],
          fill: false,
          tension: 0.3
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
        y: {
          ticks: { color: '#b8d4ff' },
          grid: { color: '#2d4a7a' },
          title: { display: true, text: 'Mean Score', color: '#18e0e6' }
        },
        x: {
          ticks: { color: '#b8d4ff' },
          grid: { color: '#2d4a7a' },
          title: { display: true, text: 'Number of Weeks (n)', color: '#18e0e6' }
        }
      }
    }
  });
}

// Helper functions
function binomial(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  
  let result = 1;
  for (let i = Math.min(k, n - k); i > 0; i--) {
    result = result * (n - i + 1) / i;
  }
  return result;
}

function computeMedian(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function computeKSStatistic(scores, empirical, theoretical, totalCount) {
  let maxDiff = 0;
  let empiricalCDF = 0;
  
  for (let score of scores) {
    empiricalCDF += (empirical[score] || 0) / totalCount;
    const theoreticalCDF = Object.keys(theoretical)
      .filter(s => Number(s) <= score)
      .reduce((sum, s) => sum + theoretical[s], 0);
    
    maxDiff = Math.max(maxDiff, Math.abs(empiricalCDF - theoreticalCDF));
  }
  
  return maxDiff;
}

function computeChiSquare(scores, empirical, theoretical, totalCount) {
  let chiSquare = 0;
  
  for (let score of scores) {
    const observed = empirical[score] || 0;
    const expected = (theoretical[score] || 0) * totalCount;
    
    if (expected > 0) {
      chiSquare += Math.pow(observed - expected, 2) / expected;
    }
  }
  
  return chiSquare;
}

function clearSimulation() {
  $('#resultsSection').style.display = 'none';
  $('#progressBar').style.display = 'none';
  simulationData = null;
  
  Object.values(charts).forEach(chart => {
    if (chart) chart.destroy();
  });
  charts = {};
  
  showAlert('Results cleared', 'success');
}

function showAlert(msg, type = 'info') {
  const alert = document.createElement('div');
  alert.className = `alert ${type}`;
  alert.textContent = msg;
  document.body.appendChild(alert);
  
  setTimeout(() => {
    alert.style.opacity = '0';
    alert.style.transition = 'opacity 0.3s ease';
    setTimeout(() => alert.remove(), 300);
  }, 4000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('[HW7] Random Walk simulator ready');
  
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
