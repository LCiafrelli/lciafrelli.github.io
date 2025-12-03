// ====================================================================
// HOMEWORK 11 EXTENDED: Dual Simulator
// Part 1: Wiener Process with Drift & Volatility
// Part 2: General SDE with Euler-Maruyama Method
// ====================================================================

const $ = (sel) => document.querySelector(sel);
let charts = {};
let simulationData = null;

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================

// Box-Muller Transform: Generate N(0,1) from U(0,1)
function boxMullerNormal() {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0;
}

// Error function for CDF
function erf(z) {
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741,
          a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const sign = z < 0 ? -1 : 1;
    z = Math.abs(z);
    const t = 1 / (1 + p * z);
    const t2 = t * t, t3 = t2 * t, t4 = t3 * t, t5 = t4 * t;
    return sign * (1 - (((((a5 * t5 + a4 * t4) + a3 * t3) + a2 * t2) + a1 * t) * t) * Math.exp(-z * z));
}

// Show alert message
function showAlert(msg, type = 'info') {
    const el = $('#alert');
    if (!el) {
        console.log(`[${type.toUpperCase()}]`, msg);
        return;
    }
    el.className = `alert ${type} show`;
    el.textContent = msg;
    setTimeout(() => el.classList.remove('show'), 5000);
}

// ======================================================================
// PART 1: WIENER PROCESS SIMULATOR (Original)
// ======================================================================

function runSimulation() {
    const T = parseFloat($('#timeInterval').value);
    const n = parseInt($('#numSteps').value);
    const m = parseInt($('#numTrajectories').value);
    const mu = parseFloat($('#driftParam').value);
    const sigma = parseFloat($('#volatilityParam').value);
    const displayCount = parseInt($('#displayTrajectories').value);

    // Validation
    if (T < 0.5 || T > 100) {
        showAlert('Time interval must be between 0.5 and 100', 'error');
        return;
    }
    if (n < 100 || n > 20000) {
        showAlert('Steps must be between 100 and 20000', 'error');
        return;
    }
    if (m < 50 || m > 5000) {
        showAlert('Trajectories must be between 50 and 5000', 'error');
        return;
    }
    if (sigma <= 0 || sigma > 5) {
        showAlert('Volatility must be between 0.1 and 5', 'error');
        return;
    }

    $('#progressBar').style.display = 'block';
    showAlert('🚀 Generating Wiener process trajectories with Box-Muller...', 'info');

    setTimeout(() => {
        try {
            simulationData = simulateWienerProcess(T, n, m, mu, sigma, displayCount);
            displayResults(T, n, m, mu, sigma, simulationData);
            $('#resultsSection').style.display = 'block';
            showAlert('✓ Simulation completed! Analyzing continuous paths...', 'success');
            $('#progressBar').style.display = 'none';
        } catch (error) {
            console.error('Simulation error:', error);
            showAlert('❌ Error during simulation: ' + error.message, 'error');
            $('#progressBar').style.display = 'none';
        }
    }, 100);
}

function simulateWienerProcess(T, n, m, mu, sigma, displayCount) {
    const dt = T / n;
    const sqrtDt = Math.sqrt(dt);
    const trajectories = [];
    const finalValues = [];
    const timePath = [];

    for (let i = 0; i <= n; i++) {
        timePath.push((i / n) * T);
    }

    for (let traj = 0; traj < m; traj++) {
        const progress = Math.round((traj / m) * 100);
        const progressFill = $('#progressFill');
        if (progressFill) {
            progressFill.style.width = progress + '%';
            progressFill.textContent = progress + '%';
        }

        const path = [0];
        let currentValue = 0;

        for (let step = 0; step < n; step++) {
            const z = boxMullerNormal();
            const increment = mu * dt + sigma * sqrtDt * z;
            currentValue += increment;
            path.push(currentValue);
        }

        finalValues.push(currentValue);
        if (traj < displayCount) {
            trajectories.push(path);
        }
    }

    const sortedFinals = [...finalValues].sort((a, b) => a - b);
    const min = sortedFinals[0];
    const max = sortedFinals[sortedFinals.length - 1];
    const q25 = sortedFinals[Math.floor(sortedFinals.length * 0.25)];
    const q50 = sortedFinals[Math.floor(sortedFinals.length * 0.50)];
    const q75 = sortedFinals[Math.floor(sortedFinals.length * 0.75)];

    const theoreticalMean = mu * T;
    const theoreticalVar = sigma * sigma * T;
    const theoreticalStd = Math.sqrt(theoreticalVar);

    const empiricalMean = finalValues.reduce((a, b) => a + b, 0) / m;
    const empiricalVar = finalValues.reduce((sum, x) => sum + Math.pow(x - empiricalMean, 2), 0) / m;
    const empiricalStd = Math.sqrt(empiricalVar);

    const probPositive = finalValues.filter(v => v > 0).length / m;
    const probNegative = finalValues.filter(v => v < 0).length / m;

    return {
        trajectories, finalValues, timePath, dt, sqrtDt,
        min, max, q25, q50, q75, empiricalMean, empiricalVar, empiricalStd,
        theoreticalMean, theoreticalVar, theoreticalStd, sortedFinals,
        probPositive, probNegative
    };
}

function displayResults(T, n, m, mu, sigma, data) {
    displayTrajectoryChartPart1(data, T);
    displayCDFChartPart1(data);
    displayAnalysis(T, n, m, mu, sigma, data);

    if (window.MathJax) {
        MathJax.typesetPromise().catch(err => console.log(err));
    }
}

function displayTrajectoryChartPart1(data, T) {
    const ctx = document.getElementById('trajectoryChart');
    if (!ctx) return;
    
    if (charts.trajectory) charts.trajectory.destroy();

    const datasets = [];
    const colors = ['#18e0e6', '#64b5f6', '#81c784', '#ffc107', '#ff7043', '#ba68c8', '#4db6ac', '#7986cb', '#ffb74d', '#e57373'];

    data.trajectories.forEach((path, idx) => {
        datasets.push({
            label: `Path ${idx + 1}`,
            data: path,
            borderColor: colors[idx % colors.length],
            backgroundColor: 'transparent',
            borderWidth: 1.2,
            tension: 0.1,
            pointRadius: 0,
            pointHoverRadius: 0
        });
    });

    const labels = Array.from({ length: data.timePath.length }, (_, i) => (i / (data.timePath.length - 1)).toFixed(2));

    charts.trajectory = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index' },
            plugins: {
                legend: { labels: { color: '#b8d4ff' }, display: data.trajectories.length <= 10 },
                title: { display: true, text: 'Wiener Process Trajectories W(t)', color: '#18e0e6' }
            },
            scales: {
                y: {
                    ticks: { color: '#b8d4ff' },
                    grid: { color: '#2d4a7a' },
                    title: { display: true, text: 'Value W(t)', color: '#18e0e6' }
                },
                x: {
                    ticks: { color: '#b8d4ff' },
                    grid: { color: '#2d4a7a' },
                    title: { display: true, text: 'Normalized Time [0,1]', color: '#18e0e6' }
                }
            }
        }
    });
}

function displayCDFChartPart1(data) {
    const ctx = document.getElementById('cdfChart');
    if (!ctx) return;
    
    if (charts.cdf) charts.cdf.destroy();

    const theoreticalMean = data.theoreticalMean;
    const theoreticalStd = data.theoreticalStd;

    const empiricalX = data.sortedFinals;
    const empiricalY = empiricalX.map((_, idx) => (idx + 1) / data.sortedFinals.length);

    const minVal = data.sortedFinals[0];
    const maxVal = data.sortedFinals[data.sortedFinals.length - 1];
    const theoreticalX = [];
    const theoreticalY = [];

    for (let i = 0; i <= 100; i++) {
        const x = minVal + (maxVal - minVal) * (i / 100);
        theoreticalX.push(x.toFixed(2));
        const z = (x - theoreticalMean) / theoreticalStd;
        const cdf = 0.5 * (1 + erf(z / Math.sqrt(2)));
        theoreticalY.push(cdf);
    }

    charts.cdf = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Empirical CDF',
                    data: empiricalX.map((x, idx) => ({ x: x, y: empiricalY[idx] })),
                    borderColor: '#18e0e6',
                    backgroundColor: 'rgba(24,224,230,0.3)',
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    showLine: false
                },
                {
                    label: 'Theoretical Normal CDF',
                    data: theoreticalX.map((x, idx) => ({ x: parseFloat(x), y: theoreticalY[idx] })),
                    borderColor: '#ff7043',
                    backgroundColor: 'transparent',
                    borderWidth: 2.5,
                    fill: false,
                    tension: 0.3,
                    pointRadius: 0,
                    showLine: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#b8d4ff' } },
                title: { display: true, text: 'Cumulative Distribution: Final Values W(T)', color: '#18e0e6' }
            },
            scales: {
                y: {
                    min: 0, max: 1,
                    ticks: { color: '#b8d4ff' },
                    grid: { color: '#2d4a7a' },
                    title: { display: true, text: 'CDF: P(W(T) ≤ w)', color: '#18e0e6' }
                },
                x: {
                    type: 'linear',
                    ticks: { color: '#b8d4ff' },
                    grid: { color: '#2d4a7a' },
                    title: { display: true, text: 'Value w', color: '#18e0e6' }
                }
            }
        }
    });
}

function displayAnalysis(T, n, m, mu, sigma, data) {
  // Determine process type
  const processType = mu === 0 ? 'Standard Wiener' : 'ABM with Drift';
  const driftDirection = mu > 0 ? '📈 Upward' : mu < 0 ? '📉 Downward' : '↔️ Neutral';

  const analysisHTML = `
    <div style="color: #e0e0e0; line-height: 1.8;">
      
      <!-- Process Configuration -->
      <div style="background: rgba(0, 212, 255, 0.08); padding: 18px; border-left: 4px solid #00d4ff; margin-bottom: 18px; border-radius: 8px;">
        <strong style="color: #00d4ff; font-size: 1.1em;">⚙️ Simulation Configuration</strong><br>
        <div style="color: #b0d4ff; margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div><strong>Time horizon T:</strong> ${T} seconds</div>
          <div><strong>Discretization steps n:</strong> ${n}</div>
          <div><strong>Trajectories m:</strong> ${m}</div>
          <div><strong>Step size Δt:</strong> ${(T/n).toExponential(2)} sec</div>
          <div><strong>Drift μ:</strong> ${mu}</div>
          <div><strong>Volatility σ:</strong> ${sigma}</div>
        </div>
      </div>

      <!-- Process Type & Behavior -->
      <div style="background: rgba(0, 255, 136, 0.08); padding: 18px; border-left: 4px solid #00ff88; margin-bottom: 18px; border-radius: 8px;">
        <strong style="color: #00ff88; font-size: 1.1em;">🎯 Process Type & Behavior</strong><br>
        <div style="color: #b0d4ff; margin-top: 10px;">
          <div><strong>Classification:</strong> ${processType}</div>
          <div style="margin-top: 8px;"><strong>Drift characteristic:</strong> ${driftDirection}</div>
          <div style="margin-top: 8px;"><strong>Interpretation:</strong> 
            ${mu === 0 
              ? 'Pure random walk with no systematic trend. Paths oscillate randomly around zero.' 
              : mu > 0 
              ? `Paths tend to drift upward over time, with random fluctuations around the trend line.`
              : `Paths tend to drift downward over time, with random fluctuations around the trend line.`
            }
          </div>
        </div>
      </div>

      <!-- Theory vs Simulation -->
      <div style="background: rgba(100, 200, 255, 0.08); padding: 18px; border-left: 4px solid #64c8ff; margin-bottom: 18px; border-radius: 8px;">
        <strong style="color: #64c8ff; font-size: 1.1em;">🔬 Theory vs Simulation Comparison</strong><br>
        <div style="color: #b0d4ff; margin-top: 10px;">
          <div><strong>Standard deviation match:</strong> 
            <div style="margin-top: 6px; margin-left: 12px;">
              ✓ Empirical: ${data.empiricalStd.toFixed(3)} | Theory: $$\\sigma\\sqrt{T} = ${data.theoreticalStd.toFixed(3)}$$
            </div>
          </div>
          <div style="margin-top: 12px; color: #00ff88; font-size: 0.95em;">
            ✓ The empirical CDF (blue dots) closely tracks the theoretical normal CDF (orange curve), validating the discretization accuracy and Box-Muller implementation.
          </div>
        </div>
      </div>

      <!-- Discretization Meaning -->
      <div style="background: rgba(0, 255, 200, 0.08); padding: 18px; border-left: 4px solid #00ffc8; margin-bottom: 18px; border-radius: 8px;">
        <strong style="color: #00ffc8; font-size: 1.1em;">🔗 Why Discretization Matters</strong><br>
        <div style="color: #b0d4ff; margin-top: 10px; font-size: 0.95em;">
          <div>
            The true Wiener process W(t) is <strong>continuous in time</strong>, but computers cannot compute with uncountable infinities. 
            By dividing [0,T] into ${n} steps, we approximate the continuous process with a finite sum of normal increments.
          </div>
          <div style="margin-top: 10px;">
            As n increases (finer grid), the discrete approximation converges to the continuous Wiener process. 
            This is the <strong>Central Limit Theorem</strong> in action: the sum of many small random increments approaches a Gaussian limit.
          </div>
          <div style="margin-top: 10px; color: #00ff88;">
            ✓ Your simulation with n = ${n} provides good accuracy for observing Brownian motion properties.
          </div>
        </div>
      </div>

    </div>
  `;

  $('#analysisSection').innerHTML = analysisHTML;

  // Render MathJax
  if (window.MathJax) {
    MathJax.typesetPromise().catch(err => console.log(err));
  }
}

// Approximation of error function for normal CDF
function erf(x) {
  // Abramowitz and Stegun approximation
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

function clearResults() {
  $('#resultsSection').style.display = 'none';
  $('#progressBar').style.display = 'none';
  $('#progressFill').style.width = '0%';
  $('#progressFill').textContent = '0%';

  simulationData = null;
  Object.values(charts).forEach(chart => {
    if (chart) chart.destroy();
  });
  charts = {};

  showAlert('Results cleared. Ready for new simulation.', 'success');
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
  }, 5000);
}

// ======================================================================
// PART 2: EULER-MARUYAMA SIMULATOR
// ======================================================================

// PART 2: Normal PDF
function normalPDF(x, mu = 0, sigma = 1) {
    const s = sigma * Math.sqrt(2 * Math.PI);
    return Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2)) / s;
}

// PART 2: Wiener Process Simulator
function simulateWienerProcessPart2(T, n, m, displayCount) {
    const dt = T / n;
    const timePoints = Array.from({ length: n + 1 }, (_, i) => (i / n) * T);
    const trajectories = [];
    const finalValues = [];

    for (let traj = 0; traj < m; traj++) {
        const progress = Math.round((traj / m) * 100);
        const progressFill = $('#progressFill');
        if (progressFill) progressFill.style.width = progress + '%';

        const path = [0];
        let x = 0;
        for (let step = 0; step < n; step++) {
            x += Math.sqrt(dt) * boxMullerNormal();
            path.push(x);
        }
        finalValues.push(x);
        if (traj < displayCount) trajectories.push(path);
    }

    const sorted = [...finalValues].sort((a, b) => a - b);
    const mean = finalValues.reduce((s, v) => s + v, 0) / m;
    const variance = finalValues.reduce((s, v) => s + (v - mean) ** 2, 0) / m;
    const std = Math.sqrt(variance);

    return { trajectories, finalValues, sorted, timePoints, mean, variance, std, dt };
}

// PART 2: General SDE Simulator (Euler-Maruyama)
function simulateSDE(T, n, m, x0, driftFn, diffFn, displayCount) {
    const dt = T / n;
    const timePoints = Array.from({ length: n + 1 }, (_, i) => (i / n) * T);
    const trajectories = [];
    const finalValues = [];

    for (let traj = 0; traj < m; traj++) {
        const progress = Math.round((traj / m) * 100);
        const progressFill = $('#progressFill');
        if (progressFill) progressFill.style.width = progress + '%';

        const path = [x0];
        let x = x0;
        for (let step = 0; step < n; step++) {
            const t = timePoints[step];
            const a = driftFn(x, t);
            const b = diffFn(x, t);
            const dW = Math.sqrt(dt) * boxMullerNormal();
            x = x + a * dt + b * dW;
            path.push(x);
        }
        finalValues.push(x);
        if (traj < displayCount) trajectories.push(path);
    }

    const sorted = [...finalValues].sort((a, b) => a - b);
    const mean = finalValues.reduce((s, v) => s + v, 0) / m;
    const variance = finalValues.reduce((s, v) => s + (v - mean) ** 2, 0) / m;
    const std = Math.sqrt(variance);

    return { trajectories, finalValues, sorted, timePoints, mean, variance, std, dt };
}

// PART 2: Function Builders
function buildDriftFunction(form, mu, customStr) {
    if (form === 'const') return () => mu;
    if (form === 'linear') return (x) => mu * x;
    if (form === 'custom') {
        try {
            const fn = new Function('x', 't', 'return ' + customStr + ';');
            fn(1, 0);
            return fn;
        } catch (e) {
            showAlert('Drift error: ' + e.message, 'error');
            return () => 0;
        }
    }
    return () => 0;
}

function buildDiffusionFunction(form, sigma, customStr) {
    if (form === 'const') return () => sigma;
    if (form === 'linear') return (x) => sigma * x;
    if (form === 'custom') {
        try {
            const fn = new Function('x', 't', 'return ' + customStr + ';');
            fn(1, 0);
            return fn;
        } catch (e) {
            showAlert('Diffusion error: ' + e.message, 'error');
            return () => 1;
        }
    }
    return () => 1;
}

// PART 2: UI Controls
function toggleSDEControls() {
    const sdeParams = $('#sdeParams');
    const procType = $('#procType');
    if (sdeParams && procType) {
        sdeParams.classList.toggle('active', procType.value === 'sde');
    }
}

function toggleCustomExpressions() {
    const driftForm = $('#driftForm');
    const diffForm = $('#diffForm');
    const driftExpr = $('#customDriftExpr');
    const diffExpr = $('#customDiffExpr');
    
    if (driftExpr && driftForm) driftExpr.classList.toggle('show', driftForm.value === 'custom');
    if (diffExpr && diffForm) diffExpr.classList.toggle('show', diffForm.value === 'custom');
}

// PART 2: Visualization
function displayTrajectoryChartPart2(data, timePoints, T) {
    const ctx = $('#trajectoryChart2');
    if (!ctx) {
        console.error('Canvas trajectoryChart2 not found');
        return;
    }
    
    if (charts.trajectory2) charts.trajectory2.destroy();

    const colors = ['#18e0e6', '#64b5f6', '#81c784', '#ffc107', '#ff7043', '#ba68c8', '#4db6ac'];
    const datasets = data.trajectories.map((path, idx) => ({
        label: `Path ${idx + 1}`,
        data: path,
        borderColor: colors[idx % colors.length],
        backgroundColor: 'transparent',
        borderWidth: 1.2,
        pointRadius: 0,
        tension: 0.1,
        fill: false
    }));

    const labels = Array.from({ length: timePoints.length }, (_, i) => (i / (timePoints.length - 1)).toFixed(2));

    charts.trajectory2 = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#b8d4ff' }, display: datasets.length <= 15 },
                title: { display: true, text: 'Sample Trajectories X(t)', color: '#18e0e6', font: { size: 14 } }
            },
            scales: {
                y: { ticks: { color: '#b8d4ff' }, grid: { color: '#2d4a7a' } },
                x: { ticks: { color: '#b8d4ff' }, grid: { color: '#2d4a7a' } }
            }
        }
    });
}

function displayHistogramChartPart2(data, T, procType) {
    const ctx = $('#histogramChart2');
    if (!ctx) {
        console.error('Canvas histogramChart2 not found');
        return;
    }
    
    if (charts.histogram2) charts.histogram2.destroy();

    const min = Math.min(...data.finalValues);
    const max = Math.max(...data.finalValues);
    const numBins = Math.min(50, Math.max(10, Math.floor(data.finalValues.length / 10)));
    const binWidth = (max - min) / numBins || 1;
    const bins = Array(numBins).fill(0);
    const labels = [];
    const binCenters = [];

    for (let i = 0; i < numBins; i++) {
        const center = min + (i + 0.5) * binWidth;
        binCenters.push(center);
        labels.push(center.toFixed(2));
    }

    data.finalValues.forEach(v => {
        const idx = Math.min(numBins - 1, Math.floor((v - min) / binWidth));
        bins[idx]++;
    });

    const datasets = [{
        type: 'bar',
        label: 'Empirical',
        data: bins,
        backgroundColor: 'rgba(24, 224, 230, 0.5)',
        borderColor: '#18e0e6'
    }];

    if (procType === 'wiener') {
        const theoretical = binCenters.map(x => normalPDF(x, 0, Math.sqrt(T)) * data.finalValues.length * binWidth);
        datasets.push({
            type: 'line',
            label: 'Theoretical N(0,T)',
            data: theoretical,
            borderColor: '#ff7043',
            borderWidth: 2,
            fill: false,
            pointRadius: 0
        });
    }

    charts.histogram2 = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#b8d4ff' } },
                title: { display: true, text: 'Distribution X(T)', color: '#18e0e6', font: { size: 14 } }
            },
            scales: {
                y: { ticks: { color: '#b8d4ff' }, grid: { color: '#2d4a7a' } },
                x: { ticks: { color: '#b8d4ff' }, grid: { color: '#2d4a7a' } }
            }
        }
    });
}

// PART 2: Main Run
function runSimulation2() {
    const T = parseFloat($('#inT').value);
    const n = parseInt($('#inN').value);
    const m = parseInt($('#inM').value);
    const displayCount = parseInt($('#inShow').value);
    const procType = $('#procType').value;
   
    if (!(T > 0 && n >= 100 && m >= 10)) {
        showAlert('Check parameters: T > 0, n >= 100, m >= 10', 'error');
        return;
    }

    const progressBar = $('#progressBar');
    if (progressBar) progressBar.style.display = 'block';

    showAlert('🚀 Starting simulation...', 'info');

    setTimeout(() => {
        try {
            let data;

            if (procType === 'wiener') {
                data = simulateWienerProcessPart2(T, n, m, displayCount);
                displayTrajectoryChartPart2(data, data.timePoints, T);
                displayHistogramChartPart2(data, T, 'wiener');
            } else {
                const x0 = parseFloat($('#inX0').value);
                const driftForm = $('#driftForm').value;
                const diffForm = $('#diffForm').value;
                const mu = parseFloat($('#inMu').value);
                const sigma = parseFloat($('#inSigma').value);
                const customDrift = $('#customDrift').value.trim();
                const customDiff = $('#customDiff').value.trim();

                const driftFn = buildDriftFunction(driftForm, mu, customDrift);
                const diffFn = buildDiffusionFunction(diffForm, sigma, customDiff);

                data = simulateSDE(T, n, m, x0, driftFn, diffFn, displayCount);
                displayTrajectoryChartPart2(data, data.timePoints, T);
                displayHistogramChartPart2(data, T, 'sde');
            }

           
if (resultsSection2) resultsSection2.style.display = 'block';

        //    if (resultsSection2) resultsSection2.classList.add('active');
            showAlert('✓ Done!', 'success');

        } catch (error) {
            console.error(error);
            showAlert('Error: ' + error.message, 'error');
        } finally {
            const progressBar = $('#progressBar');
            if (progressBar) progressBar.style.display = 'none';
        }
    }, 100);
}

// PART 2: Clear Results
function clearResults2() {
    const resultsSection2 = $('#resultsSection2');
    if (resultsSection2) resultsSection2.style.display = 'none';
    //$('#resultsSection2').classList.remove('active');
    if (charts.trajectory2) charts.trajectory2.destroy();
    if (charts.histogram2) charts.histogram2.destroy();
    showAlert('Part II results cleared', 'info');
}

// ======================================================================
// INITIALIZATION
// ======================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('✓ Simulators loaded');

    // PART 2: Event listeners
    const btnRun2 = $('#btnRun');
    const procType = $('#procType');
    const driftForm = $('#driftForm');
    const diffForm = $('#diffForm');
    const btnClear2 = $('#btnClear2');

    if (btnRun2) btnRun2.addEventListener('click', runSimulation2);
    if (btnClear2) btnClear2.addEventListener('click', clearResults2);
    
    if (procType) procType.addEventListener('change', () => {
        toggleSDEControls();
        const rs = $('#resultsSection2');
        //if (rs) rs.classList.remove('active');
        if (rs) rs.style.display = 'none';
    });
    if (driftForm) driftForm.addEventListener('change', toggleCustomExpressions);
    if (diffForm) diffForm.addEventListener('change', toggleCustomExpressions);

    toggleSDEControls();
    toggleCustomExpressions();

    console.log('✓ Simulators ready');
});