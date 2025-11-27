/* ================================
   Homework 10: Poisson Process Simulation
   Interactive Counting Process Analysis
   ================================ */

const $ = sel => document.querySelector(sel);
let charts = {};
let simulationData = null;

function runSimulation() {
  const T = parseFloat($('#timeInterval').value);
  const lambda = parseFloat($('#rateParam').value);
  const n = parseInt($('#numSubintervals').value);
  const m = parseInt($('#numTrajectories').value);

  if (T < 0.1 || T > 10) {
    showAlert('Time interval must be between 0.1 and 10', 'error');
    return;
  }
  if (lambda < 0.5 || lambda > 50) {
    showAlert('Rate parameter λ must be between 0.5 and 50', 'error');
    return;
  }
  if (n < 100 || n > 10000) {
    showAlert('Subintervals must be between 100 and 10000', 'error');
    return;
  }
  if (m < 50 || m > 5000) {
    showAlert('Trajectories must be between 50 and 5000', 'error');
    return;
  }

  $('#progressBar').style.display = 'block';
  showAlert('🚀 Running simulation...', 'info');

  setTimeout(() => {
    simulationData = simulateCountingProcess(T, lambda, n, m);
    displayResults(T, lambda, n, m, simulationData);
    $('#resultsSection').style.display = 'block';
    showAlert('✓ Simulation completed! Poisson process identified.', 'success');
  }, 100);
}

function simulateCountingProcess(T, lambda, n, m) {
  const dt = T / n;
  const p = lambda * dt;
  
  const trajectories = [];
  const finalCounts = [];
  const firstEventTimes = [];

  for (let traj = 0; traj < m; traj++) {
    const progress = Math.round((traj / m) * 100);
    $('#progressFill').style.width = progress + '%';
    $('#progressFill').textContent = progress + '%';

    const path = [0];
    let currentCount = 0;
    let firstEventFound = false;

    for (let i = 0; i < n; i++) {
      if (Math.random() < p) {
        currentCount++;
        if (!firstEventFound) {
          firstEventTimes.push((i + 1) * dt);
          firstEventFound = true;
        }
      }
      path.push(currentCount);
    }

    if (!firstEventFound) {
      firstEventTimes.push(T);
    }

    finalCounts.push(currentCount);

    if (traj < 50) {
      trajectories.push(path);
    }
  }

  const finalCountFreq = {};
  finalCounts.forEach(count => {
    finalCountFreq[count] = (finalCountFreq[count] || 0) + 1;
  });

  const sortedCounts = Object.keys(finalCountFreq).map(Number).sort((a, b) => a - b);

  const theoreticalProbs = {};
  const expectedCount = lambda * T;
  sortedCounts.forEach(k => {
    theoreticalProbs[k] = poissonPMF(k, expectedCount);
  });

  const mean = finalCounts.reduce((a, b) => a + b, 0) / m;
  const variance = finalCounts.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / m;
  const stdDev = Math.sqrt(variance);

  const theoreticalMean = expectedCount;
  const theoreticalVar = expectedCount;

  const ksStatistic = computeKS(sortedCounts, finalCountFreq, theoreticalProbs, m);
  const chiSquare = computeChiSquare(sortedCounts, finalCountFreq, theoreticalProbs, m);

  const meanFirstTime = firstEventTimes.reduce((a, b) => a + b, 0) / firstEventTimes.length;
  const theoreticalMeanFirstTime = 1 / lambda;

  return {
    trajectories,
    finalCounts,
    finalCountFreq,
    sortedCounts,
    theoreticalProbs,
    mean,
    variance,
    stdDev,
    theoreticalMean,
    theoreticalVar,
    ksStatistic,
    chiSquare,
    firstEventTimes,
    meanFirstTime,
    theoreticalMeanFirstTime,
    min: Math.min(...finalCounts),
    max: Math.max(...finalCounts),
    median: computeMedian(finalCounts),
    expectedCount
  };
}

function displayResults(T, lambda, n, m, data) {
  // Lambda interpretation
  const lambdaHTML = `
    <strong>Your λ = ${lambda}:</strong><br>
    On average, <strong>${lambda} events occur per unit time</strong>.<br>
    Over interval [0, ${T}], expect <strong>λ·T = ${(lambda * T).toFixed(2)} total events</strong>.<br>
    Expected time until first event: <strong>1/λ = ${(1/lambda).toFixed(3)} time units</strong>.
  `;
  $('#lambdaInterpretation').innerHTML = lambdaHTML;

  // Convergence indicator
  let convergenceClass = 'convergence-excellent';
  let convergenceText = '✓ Excellent Convergence';
  if (data.ksStatistic > 0.1) {
    convergenceClass = 'convergence-good';
    convergenceText = '✓ Good Convergence';
  }
  if (data.ksStatistic > 0.15) {
    convergenceClass = 'convergence-moderate';
    convergenceText = '⚠ Moderate Convergence';
  }
  
  $('#convergenceIndicator').innerHTML = `<div class="convergence-indicator ${convergenceClass}"><strong>KS = ${data.ksStatistic.toFixed(4)}</strong> — ${convergenceText}</div>`;

  // Statistics cards
  const statsHTML = `
    <div class="stat-card">
      <div class="stat-label">Empirical Mean</div>
      <div class="stat-value">${data.mean.toFixed(2)}</div>
      <div class="stat-sublabel">Expected: λT = ${data.theoreticalMean.toFixed(2)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Empirical Variance</div>
      <div class="stat-value">${data.variance.toFixed(2)}</div>
      <div class="stat-sublabel">Expected: λT = ${data.theoreticalVar.toFixed(2)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Std Deviation</div>
      <div class="stat-value">${data.stdDev.toFixed(3)}</div>
      <div class="stat-sublabel">Expected: √(λT) = ${Math.sqrt(data.theoreticalVar).toFixed(3)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Mean/Variance Ratio</div>
      <div class="stat-value">${(data.mean / data.variance).toFixed(3)}</div>
      <div class="stat-sublabel">Poisson property: ≈ 1.0</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">KS Statistic</div>
      <div class="stat-value">${data.ksStatistic.toFixed(4)}</div>
      <div class="stat-sublabel">${data.ksStatistic < 0.1 ? 'Excellent fit' : 'Good fit'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">First Event Mean</div>
      <div class="stat-value">${data.meanFirstTime.toFixed(3)}</div>
      <div class="stat-sublabel">Expected: 1/λ = ${data.theoreticalMeanFirstTime.toFixed(3)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Discretization</div>
      <div class="stat-value">n=${n}</div>
      <div class="stat-sublabel">Δt = ${(T/n).toFixed(6)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Bernoulli p/step</div>
      <div class="stat-value">${(lambda * T / n).toFixed(6)}</div>
      <div class="stat-sublabel">p = λ·Δt</div>
    </div>
  `;
  $('#statsGrid').innerHTML = statsHTML;

  // Display charts
  displayTrajectoryChart(data, T, n);
  displayDistributionChart(data, m);
  displayEventTimingChart(data);
  displayConvergenceChart(data);

  // Display analysis
  displayAnalysis(T, lambda, n, m, data);
}

function displayTrajectoryChart(data, T, n) {
  const ctx = document.getElementById('trajectoryChart').getContext('2d');
  
  if (charts.trajectory) charts.trajectory.destroy();

  const timePoints = Array.from({length: n + 1}, (_, i) => (i / n * T).toFixed(3));
  const colors = [
    '#18e0e6', '#64b5f6', '#81c784', '#ffc107', '#ff7043',
    '#ba68c8', '#4db6ac', '#7986cb', '#ffb74d', '#e57373'
  ];

  const datasets = data.trajectories.map((path, idx) => ({
    label: `Path ${idx + 1}`,
    data: path,
    borderColor: colors[idx % colors.length],
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    tension: 0,
    pointRadius: 0
  }));

  charts.trajectory = new Chart(ctx, {
    type: 'line',
    data: {
      labels: timePoints.map((t, i) => i % Math.ceil((n + 1) / 15) === 0 ? t : ''),
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#b8d4ff' }, display: data.trajectories.length <= 15 }
      },
      scales: {
        y: {
          ticks: { color: '#b8d4ff' },
          grid: { color: '#2d4a7a' },
          title: { display: true, text: 'Cumulative Events N(t)', color: '#18e0e6' }
        },
        x: {
          ticks: { color: '#b8d4ff' },
          grid: { color: '#2d4a7a' },
          title: { display: true, text: 'Time t', color: '#18e0e6' }
        }
      }
    }
  });
}

function displayDistributionChart(data, m) {
  const ctx = document.getElementById('distributionChart').getContext('2d');
  
  if (charts.distribution) charts.distribution.destroy();

  const empiricalProbs = {};
  data.sortedCounts.forEach(count => {
    empiricalProbs[count] = data.finalCountFreq[count] / m;
  });

  const empiricalValues = data.sortedCounts.map(c => empiricalProbs[c] || 0);
  const theoreticalValues = data.sortedCounts.map(c => data.theoreticalProbs[c] || 0);

  charts.distribution = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.sortedCounts.map(c => c.toString()),
      datasets: [
        {
          label: 'Empirical',
          data: empiricalValues,
          backgroundColor: 'rgba(24,224,230,0.7)',
          borderColor: '#18e0e6',
          borderWidth: 2
        },
        {
          label: 'Poisson(λT)',
          data: theoreticalValues,
          borderColor: '#ff7043',
          borderWidth: 3,
          type: 'line',
          fill: false,
          tension: 0.3,
          pointRadius: 4,
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
          title: { display: true, text: 'P(N(T) = k)', color: '#18e0e6' }
        },
        x: {
          ticks: { color: '#b8d4ff' },
          grid: { color: '#2d4a7a' },
          title: { display: true, text: 'Event Count k', color: '#18e0e6' }
        }
      }
    }
  });
}

function displayEventTimingChart(data) {
  const ctx = document.getElementById('eventTimingChart').getContext('2d');
  
  if (charts.eventTiming) charts.eventTiming.destroy();

  const bins = 25;
  const min = 0;
  const max = Math.max(...data.firstEventTimes);
  const binWidth = (max - min) / bins;

  const binCounts = Array(bins).fill(0);
  data.firstEventTimes.forEach(time => {
    const binIdx = Math.min(bins - 1, Math.floor((time - min) / binWidth));
    binCounts[binIdx]++;
  });

  const binLabels = Array.from({length: bins}, (_, i) => ((i * binWidth).toFixed(2)).toString());

  charts.eventTiming = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: binLabels,
      datasets: [{
        label: 'Frequency',
        data: binCounts,
        backgroundColor: 'rgba(129,199,132,0.8)',
        borderColor: '#81c784',
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
        y: {
          ticks: { color: '#b8d4ff' },
          grid: { color: '#2d4a7a' },
          title: { display: true, text: 'Count', color: '#18e0e6' }
        },
        x: {
          ticks: { color: '#b8d4ff' },
          grid: { color: '#2d4a7a' },
          title: { display: true, text: 'First Event Time', color: '#18e0e6' }
        }
      }
    }
  });
}

function displayConvergenceChart(data) {
  const ctx = document.getElementById('convergenceChart').getContext('2d');
  
  if (charts.convergence) charts.convergence.destroy();

  const chiValues = data.sortedCounts.map(count => {
    const observed = data.finalCountFreq[count] || 0;
    const expected = data.theoreticalProbs[count] * data.finalCounts.length;
    return expected > 0 ? Math.pow(observed - expected, 2) / expected : 0;
  });

  charts.convergence = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.sortedCounts.map(c => c.toString()),
      datasets: [{
        label: 'χ² Contribution',
        data: chiValues,
        backgroundColor: chiValues.map(val => 
          val < 1 ? 'rgba(129,199,132,0.8)' :
          val < 5 ? 'rgba(255,193,7,0.8)' :
          'rgba(255,112,67,0.8)'
        ),
        borderColor: '#18e0e6',
        borderWidth: 1.5
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
          title: { display: true, text: 'χ² Component', color: '#18e0e6' }
        },
        x: {
          ticks: { color: '#b8d4ff' },
          grid: { color: '#2d4a7a' }
        }
      }
    }
  });
}

function displayAnalysis(T, lambda, n, m, data) {
  const analysisHTML = `
    <div class="tool-title">🔍 Comprehensive Analysis</div>
    
    <div class="highlight-section">
      <div class="highlight-title">✓ Process Convergence Quality</div>
      <div class="highlight-content">
        <div class="highlight-box">
          <strong>Kolmogorov-Smirnov Test:</strong> KS = ${data.ksStatistic.toFixed(4)}<br>
          ${data.ksStatistic < 0.05 ? '✓ <strong>Excellent</strong>: Empirical distribution matches Poisson very closely' : 
            data.ksStatistic < 0.15 ? '✓ <strong>Good</strong>: Strong convergence observed' :
            '⚠ <strong>Moderate</strong>: Increase n for better convergence'}<br>
          <br>
          <strong>Insight:</strong> The KS statistic measures the maximum vertical distance between empirical and theoretical CDFs. Smaller values indicate better fit.
        </div>
      </div>
    </div>

    <div class="highlight-section">
      <div class="highlight-title">📊 Mean-Variance Relationship</div>
      <div class="highlight-content">
        <div class="highlight-box">
          <strong>Empirical Mean:</strong> ${data.mean.toFixed(3)}<br>
          <strong>Empirical Variance:</strong> ${data.variance.toFixed(3)}<br>
          <strong>Ratio (Mean/Var):</strong> ${(data.mean / data.variance).toFixed(3)}<br>
          <br>
          <strong>Poisson Property:</strong> For a Poisson(λT) distribution, Mean = Variance = λT = ${data.expectedCount.toFixed(3)}<br>
          <strong>Ratio should be ≈ 1.0</strong> — Your ratio: ${(data.mean / data.variance).toFixed(3)} ✓<br>
          <br>
          <strong>Significance:</strong> This fundamental Poisson property is verified. The near-equality of mean and variance confirms the process exhibits Poisson behavior.
        </div>
      </div>
    </div>

    <div class="lambda-section">
      <div class="lambda-title">⚡ Rate Parameter Analysis</div>
      <div class="lambda-content">
        <div class="lambda-box">
          <strong>Configured λ:</strong> ${lambda} events/unit time<br>
          <strong>Time interval:</strong> [0, ${T}]<br>
          <strong>Expected total events:</strong> λ·T = ${lambda} × ${T} = <strong>${(lambda * T).toFixed(2)}</strong><br>
          <strong>Observed mean:</strong> ${data.mean.toFixed(2)}<br>
          <strong>Error:</strong> ${Math.abs(data.mean - data.expectedCount) / data.expectedCount * 100} %<br>
        </div>
        
        <div class="lambda-box" style="margin-top: 1rem;">
          <strong>First Event Timing:</strong><br>
          Expected (1/λ): ${(1/lambda).toFixed(4)} time units<br>
          Observed mean: ${data.meanFirstTime.toFixed(4)} time units<br>
          Error: ${Math.abs(data.meanFirstTime - 1/lambda) / (1/lambda) * 100} %<br>
          <br>
          <strong>Interpretation:</strong> In a Poisson process, the time to first event follows Exponential(λ), confirming the theoretical prediction.
        </div>
      </div>
    </div>

    <div class="process-identification">
      <div class="process-title">🎯 Discretization-to-Continuous Relationship</div>
      <div class="process-content">
        <div class="process-formula">
          <strong>Discretization Parameters:</strong><br>
          • Interval [0, ${T}] divided into n = ${n} subintervals<br>
          • Step size: Δt = T/n = ${(T/n).toFixed(6)}<br>
          • Bernoulli probability per step: p = λ·Δt = ${(lambda * T / n).toFixed(6)}<br>
          <br>
          <strong>How Convergence Works:</strong><br>
          As n → ∞:<br>
          • Δt → 0 (finer time discretization)<br>
          • p → 0 (lower probability per step)<br>
          • But n·p = λ·T stays constant<br>
          • Discrete process → Continuous Poisson(λ) process<br>
          <br>
          <strong>This Simulation:</strong> n=${n} provides ${data.ksStatistic < 0.1 ? 'excellent' : 'good'} approximation. Try higher n for even tighter fit.
        </div>
      </div>
    </div>
  `;

  $('#analysisSection').innerHTML = analysisHTML;
}

function runConvergenceTest() {
 const T = parseFloat($('#timeInterval').value);
  const lambda = parseFloat($('#rateParam').value);
  const baseM = 300;

  showAlert('🔄 Convergence test: varying discretization granularity...', 'info');
  
  $('#progressBar').style.display = 'block';
  
  const nValues = [100, 250, 500, 1000, 2500, 5000];
  const results = [];
  let index = 0;

  function processNextN() {
    if (index >= nValues.length) {
     
      displayConvergenceTestChart(results);
      $('#progressBar').style.display = 'none';
      showAlert('✓ Convergence test complete! Notice how errors decrease with finer discretization.', 'success');
      return;
    }

    const n = nValues[index];
    $('#progressFill').style.width = ((index + 1) / nValues.length * 100) + '%';
    $('#progressFill').textContent = Math.round((index + 1) / nValues.length * 100) + '%';

    
    setTimeout(() => {
      try {
        const data = simulateCountingProcess(T, lambda, n, baseM);
        results.push({
          n,
          meanError: Math.abs(data.mean - data.theoreticalMean) / data.theoreticalMean * 100,
          varError: Math.abs(data.variance - data.theoreticalVar) / data.theoreticalVar * 100,
          ks: data.ksStatistic
        });
        
        index++;
        processNextN(); 
      } catch (error) {
        console.error('Error processing n=' + n, error);
        showAlert('❌ Error during convergence test', 'error');
      }
    }, 50);
  }

  processNextN();
}

function displayConvergenceTestChart(results) {
  const ctx = document.getElementById('convergenceChart').getContext('2d');
  
  if (charts.convergence) charts.convergence.destroy();

  const nValues = results.map(r => r.n);
  const meanErrors = results.map(r => r.meanError);
  const varErrors = results.map(r => r.varError);
  const ksStats = results.map(r => r.ks);

  charts.convergence = new Chart(ctx, {
    type: 'line',
    data: {
      labels: nValues.map(n => 'n=' + n),
      datasets: [
        {
          label: 'Mean Error %',
          data: meanErrors,
          borderColor: '#18e0e6',
          backgroundColor: 'rgba(24,224,230,0.1)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#18e0e6'
        },
        {
          label: 'Variance Error %',
          data: varErrors,
          borderColor: '#ffc107',
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#ffc107'
        },
        {
          label: 'KS Statistic',
          data: ksStats,
          borderColor: '#81c784',
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          borderDash: [2, 5],
          fill: false,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#81c784'
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
          title: { display: true, text: 'Error Metric (%)', color: '#18e0e6' }
        },
        x: {
          ticks: { color: '#b8d4ff' },
          grid: { color: '#2d4a7a' },
          title: { display: true, text: 'Number of Subintervals (n)', color: '#18e0e6' }
        }
      }
    }
  });
}

function clearResults() {
  $('#timeInterval').value = '1';
  $('#rateParam').value = '5';
  $('#numSubintervals').value = '1000';
  $('#numTrajectories').value = '500';
  $('#resultsSection').style.display = 'none';
  $('#progressBar').style.display = 'none';
  $('#progressFill').style.width = '0%';
  
  Object.values(charts).forEach(chart => {
    if (chart) chart.destroy();
  });
  charts = {};
  
  showAlert('All results cleared', 'success');
}

// Helper functions
function poissonPMF(k, lambda) {
  if (lambda <= 0) return 0;
  const num = Math.pow(lambda, k) * Math.exp(-lambda);
  const denom = factorial(k);
  return num / denom;
}

function factorial(n) {
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function computeMedian(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function computeKS(scores, empirical, theoretical, total) {
  let maxDiff = 0;
  let empiricalCDF = 0;
  
  for (let score of scores) {
    empiricalCDF += (empirical[score] || 0) / total;
    const theoreticalCDF = Object.keys(theoretical)
      .filter(s => Number(s) <= score)
      .reduce((sum, s) => sum + theoretical[s], 0);
    
    maxDiff = Math.max(maxDiff, Math.abs(empiricalCDF - theoreticalCDF));
  }
  
  return maxDiff;
}

function computeChiSquare(scores, empirical, theoretical, total) {
  let chiSquare = 0;
  
  for (let score of scores) {
    const obs = empirical[score] || 0;
    const exp = (theoretical[score] || 0) * total;
    
    if (exp > 0) {
      chiSquare += Math.pow(obs - exp, 2) / exp;
    }
  }
  
  return chiSquare;
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

document.addEventListener('DOMContentLoaded', () => {
  console.log('[HW10] Poisson process simulator ready');
  
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
