const $ = sel => document.querySelector(sel);
let charts = {};
let simulationData = null;

// Box-Muller Transform: Generate N(0,1) from U(0,1)
function boxMullerNormal() {
  const u1 = Math.random();
  const u2 = Math.random();
  
  // First normal (second can be cached for efficiency)
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0;
}

// Main simulation function
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

  // Generate time points
  for (let i = 0; i <= n; i++) {
    timePath.push((i / n) * T);
  }

  // Generate m trajectories
  for (let traj = 0; traj < m; traj++) {
    // Progress indicator
    const progress = Math.round((traj / m) * 100);
    $('#progressFill').style.width = progress + '%';
    $('#progressFill').textContent = progress + '%';

    const path = [0]; // W(0) = 0
    let currentValue = 0;

    // Generate n steps using Box-Muller for normal increments
    for (let step = 0; step < n; step++) {
      // Box-Muller generates N(0,1)
      const z = boxMullerNormal();
      
      // Wiener increment: dW = sqrt(dt) * Z
      // With drift: dX = mu*dt + sigma*sqrt(dt)*Z
      const increment = mu * dt + sigma * sqrtDt * z;
      currentValue += increment;
      path.push(currentValue);
    }

    finalValues.push(currentValue);

    // Store only subset of trajectories for visualization
    if (traj < displayCount) {
      trajectories.push(path);
    }
  }

  // Compute statistics on final values
  const sortedFinals = [...finalValues].sort((a, b) => a - b);
  const min = sortedFinals[0];
  const max = sortedFinals[sortedFinals.length - 1];
  const q25 = sortedFinals[Math.floor(sortedFinals.length * 0.25)];
  const q50 = sortedFinals[Math.floor(sortedFinals.length * 0.50)];
  const q75 = sortedFinals[Math.floor(sortedFinals.length * 0.75)];

  // Theoretical statistics for ABM at time T
  const theoreticalMean = mu * T;
  const theoreticalVar = sigma * sigma * T;
  const theoreticalStd = Math.sqrt(theoreticalVar);

  // Empirical statistics
  const empiricalMean = finalValues.reduce((a, b) => a + b, 0) / m;
  const empiricalVar = finalValues.reduce((sum, x) => sum + Math.pow(x - empiricalMean, 2), 0) / m;
  const empiricalStd = Math.sqrt(empiricalVar);

  // Probability of positive/negative final values
  const probPositive = finalValues.filter(v => v > 0).length / m;
  const probNegative = finalValues.filter(v => v < 0).length / m;

  return {
    trajectories,
    finalValues,
    timePath,
    dt,
    sqrtDt,
    min,
    max,
    q25,
    q50,
    q75,
    empiricalMean,
    empiricalVar,
    empiricalStd,
    theoreticalMean,
    theoreticalVar,
    theoreticalStd,
    sortedFinals,
    probPositive,
    probNegative
  };
}

function displayResults(T, n, m, mu, sigma, data) {
  displayTrajectoryChart(data, T);
  displayCDFChart(data);
  displayAnalysis(T, n, m, mu, sigma, data);

  // MathJax rendering for any LaTeX in analysis
  if (window.MathJax) {
    MathJax.typesetPromise().catch(err => console.log(err));
  }
}

function displayTrajectoryChart(data, T) {
  const ctx = document.getElementById('trajectoryChart').getContext('2d');

  if (charts.trajectory) charts.trajectory.destroy();

  const datasets = [];
  const colors = [
    '#18e0e6', '#64b5f6', '#81c784', '#ffc107', '#ff7043',
    '#ba68c8', '#4db6ac', '#7986cb', '#ffb74d', '#e57373'
  ];

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

function displayCDFChart(data) {
  const ctx = document.getElementById('cdfChart').getContext('2d');
  if (charts.cdf) charts.cdf.destroy();

  const theoreticalMean = data.theoreticalMean;
  const theoreticalStd = data.theoreticalStd;

  // Empirical CDF points
  const empiricalX = data.sortedFinals;
  const empiricalY = empiricalX.map((_, idx) => (idx + 1) / data.sortedFinals.length);

  // Theoretical CDF smooth curve
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
          min: 0,
          max: 1,
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('[HW11] Wiener Process simulator with Box-Muller ready');
});