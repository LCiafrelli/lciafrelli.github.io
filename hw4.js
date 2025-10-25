/* ================================
   Homework 4: Law of Large Numbers Simulation
   Author: Lorenzo Ciafrelli
   ================================ */

let simState = {
  experimentType: 'coin',  // 'coin' or 'die'
  m: 50,
  n: 500,
  p: 0.5,
  speed: 50,
  trajectories: [],
  currentStep: 0,
  isRunning: false,
  isPaused: false,
  intervalId: null
};

const $ = sel => document.querySelector(sel);

function log(msg) {
  console.log(`[HW4] ${msg}`);
}

function showAlert(msg, type='info') {
  log(`Alert: ${msg}`);
  const alert = document.createElement('div');
  alert.className = `alert ${type}`;
  alert.textContent = msg;
  const container = document.querySelector('.hw-detail');
  if(container) {
    container.prepend(alert);
    setTimeout(() => alert.remove(), 4000);
  }
}

function updateExperimentInfo() {
  const experimentType = $('#experimentType');
  const experimentInfo = $('#experimentInfo');
  
  if(!experimentType || !experimentInfo) return;
  
  const type = experimentType.value;
  simState.experimentType = type;
  
  if(type === 'coin') {
    simState.p = 0.5;
    experimentInfo.innerHTML = `
      <strong>📊 Current Experiment:</strong> Fair Coin Flip<br>
      <strong>Success Event:</strong> Getting Heads<br>
      <strong>Probability (p):</strong> 0.5 (50%)<br>
      <strong>Variance:</strong> p(1-p)/n = 0.25/n<br>
      <strong>Convergence:</strong> Slowest (maximum variance)
    `;
  } else {
    simState.p = 1/6;
    experimentInfo.innerHTML = `
      <strong>📊 Current Experiment:</strong> Fair Die Roll<br>
      <strong>Success Event:</strong> Rolling a 6<br>
      <strong>Probability (p):</strong> 0.167 (16.7%)<br>
      <strong>Variance:</strong> p(1-p)/n ≈ 0.139/n<br>
      <strong>Convergence:</strong> Faster (lower variance)
    `;
  }
  
  log(`Experiment changed to: ${type}, p=${simState.p.toFixed(3)}`);
}

function initSimulation() {
  log('Initializing LLN simulation');
  
  const btnStart = $('#btnStartSim');
  const btnPause = $('#btnPauseSim');
  const btnReset = $('#btnResetSim');
  const speedSlider = $('#animSpeed');
  const speedValue = $('#speedValue');
  const experimentType = $('#experimentType');
  
  if(!btnStart || !btnPause || !btnReset || !speedSlider || !experimentType) {
    log('ERROR: UI elements not found');
    return;
  }
  
  // Experiment type selector
  experimentType.addEventListener('change', () => {
    updateExperimentInfo();
    if(!simState.isRunning) {
      drawMainChart();
      drawHistogram();
    }
  });
  
  // Initialize experiment info
  updateExperimentInfo();
  
  // Speed slider
  speedSlider.addEventListener('input', (e) => {
    simState.speed = parseInt(e.target.value);
    if(speedValue) speedValue.textContent = simState.speed;
    log(`Speed changed to: ${simState.speed}`);
  });
  
  // Buttons
  btnStart.addEventListener('click', () => {
    log('Start button clicked');
    startSimulation();
  });
  
  btnPause.addEventListener('click', () => {
    log('Pause button clicked');
    togglePause();
  });
  
  btnReset.addEventListener('click', () => {
    log('Reset button clicked');
    resetSimulation();
  });
  
  // Initialize empty charts
  drawMainChart();
  drawHistogram();
  updateStats();
  
  log('Simulation initialized successfully');
}

function startSimulation() {
  const m = parseInt($('#numTrajectories').value);
  const n = parseInt($('#numTrials').value);
  
  log(`Starting simulation: m=${m}, n=${n}, experiment=${simState.experimentType}, p=${simState.p.toFixed(3)}`);
  
  if(isNaN(m) || m < 1 || m > 200) {
    showAlert('Number of trajectories must be between 1 and 200', 'alert');
    return;
  }
  if(isNaN(n) || n < 10 || n > 2000) {
    showAlert('Number of trials must be between 10 and 2000', 'alert');
    return;
  }
  
  // Stop any existing simulation
  if(simState.intervalId) {
    clearInterval(simState.intervalId);
  }
  
  // Update state
  simState.m = m;
  simState.n = n;
  simState.currentStep = 0;
  simState.isRunning = true;
  simState.isPaused = false;
  
  // Initialize trajectories
  simState.trajectories = [];
  for(let i = 0; i < m; i++) {
    simState.trajectories.push({
      id: i,
      successes: 0,
      frequencies: [0]
    });
  }
  
  log(`Initialized ${m} trajectories`);
  
  // Update UI
  $('#btnStartSim').disabled = true;
  $('#btnPauseSim').disabled = false;
  $('#numTrajectories').disabled = true;
  $('#numTrials').disabled = true;
  $('#experimentType').disabled = true;
  
  showAlert(`Simulation started! (${simState.experimentType === 'coin' ? 'Coin Flip' : 'Die Roll'})`, 'success');
  
  // Start animation loop
  runSimulationStep();
}

function runSimulationStep() {
  if(!simState.isRunning || simState.isPaused) {
    return;
  }
  
  if(simState.currentStep >= simState.n) {
    log('Simulation completed');
    completeSimulation();
    return;
  }
  
  // Perform one step
  simState.currentStep++;
  
  for(let traj of simState.trajectories) {
    const success = Math.random() < simState.p;
    if(success) traj.successes++;
    const freq = traj.successes / simState.currentStep;
    traj.frequencies.push(freq);
  }
  
  // Update visualizations periodically
  const updateInterval = Math.max(1, Math.floor(10 / (simState.speed / 50)));
  if(simState.currentStep % updateInterval === 0 || simState.currentStep === simState.n) {
    drawMainChart();
    drawHistogram();
    updateStats();
    updateProgressBar();
  }
  
  // Schedule next step
  const delay = Math.max(1, 101 - simState.speed);
  simState.intervalId = setTimeout(runSimulationStep, delay);
}

function completeSimulation() {
  simState.isRunning = false;
  if(simState.intervalId) {
    clearTimeout(simState.intervalId);
    simState.intervalId = null;
  }
  
  $('#btnStartSim').disabled = false;
  $('#btnPauseSim').disabled = true;
  $('#numTrajectories').disabled = false;
  $('#numTrials').disabled = false;
  $('#experimentType').disabled = false;
  
  drawMainChart();
  drawHistogram();
  updateStats();
  updateProgressBar();
  
  showAlert('Simulation completed!', 'success');
}

function togglePause() {
  simState.isPaused = !simState.isPaused;
  const btnPause = $('#btnPauseSim');
  
  if(simState.isPaused) {
    btnPause.textContent = '▶ Resume';
    if(simState.intervalId) {
      clearTimeout(simState.intervalId);
      simState.intervalId = null;
    }
    log('Simulation paused');
  } else {
    btnPause.textContent = '⏸ Pause';
    runSimulationStep();
    log('Simulation resumed');
  }
}

function resetSimulation() {
  log('Resetting simulation');
  
  // Stop animation
  if(simState.intervalId) {
    clearTimeout(simState.intervalId);
    simState.intervalId = null;
  }
  
  // Reset state
  simState.currentStep = 0;
  simState.isRunning = false;
  simState.isPaused = false;
  simState.trajectories = [];
  
  // Reset UI
  $('#btnStartSim').disabled = false;
  $('#btnPauseSim').disabled = true;
  $('#btnPauseSim').textContent = '⏸ Pause';
  $('#numTrajectories').disabled = false;
  $('#numTrials').disabled = false;
  $('#experimentType').disabled = false;
  
  const progressBar = $('#progressBar');
  if(progressBar) {
    progressBar.style.width = '0%';
    progressBar.textContent = '0%';
  }
  
  // Clear charts
  drawMainChart();
  drawHistogram();
  updateStats();
  
  showAlert('Simulation reset', 'success');
}

function updateProgressBar() {
  const progressBar = $('#progressBar');
  if(progressBar) {
    const percent = Math.round((simState.currentStep / simState.n) * 100);
    progressBar.style.width = `${percent}%`;
    progressBar.textContent = `${percent}%`;
  }
}

function getExperimentLabel() {
  return simState.experimentType === 'coin' ? 'Coin Flip' : 'Die Roll (6)';
}

function drawMainChart() {
  const canvas = $('#mainChart');
  if(!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  ctx.clearRect(0, 0, width, height);
  
  // Background
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0a1628');
  gradient.addColorStop(1, '#142042');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  const margin = { top: 70, right: 40, bottom: 70, left: 80 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Title
  ctx.fillStyle = '#18e0e6';
  ctx.font = 'bold 18px Montserrat, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Trajectories: ${getExperimentLabel()}`, width / 2, 30);
  
  ctx.font = '12px Montserrat, Arial, sans-serif';
  ctx.fillStyle = '#b8d4ff';
  ctx.fillText(`p = ${simState.p.toFixed(3)} | m = ${simState.m} | n = ${simState.currentStep}/${simState.n}`, width / 2, 50);
  
  // Axes
  ctx.strokeStyle = '#4a6ba8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, margin.top + chartHeight);
  ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
  ctx.stroke();
  
  // Y-axis label
  ctx.save();
  ctx.fillStyle = '#b8d4ff';
  ctx.font = '14px Montserrat, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.translate(25, margin.top + chartHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Relative Frequency f(n)', 0, 0);
  ctx.restore();
  
  // X-axis label
  ctx.fillStyle = '#b8d4ff';
  ctx.font = '14px Montserrat, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Number of Trials (n)', margin.left + chartWidth / 2, height - 20);
  
  // Draw p reference line
  ctx.strokeStyle = '#ff5722';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  const yRef = margin.top + chartHeight * (1 - simState.p);
  ctx.beginPath();
  ctx.moveTo(margin.left, yRef);
  ctx.lineTo(margin.left + chartWidth, yRef);
  ctx.stroke();
  ctx.setLineDash([]);
  
  ctx.fillStyle = '#ff5722';
  ctx.font = 'bold 12px Montserrat, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`p = ${simState.p.toFixed(3)}`, margin.left + 10, yRef - 5);
  
  // Draw trajectories
  if(simState.trajectories.length > 0 && simState.currentStep > 0) {
    const maxN = simState.n;
    
    simState.trajectories.forEach((traj) => {
      const alpha = Math.min(0.8, 0.3 + (0.5 / Math.sqrt(simState.m)));
      ctx.strokeStyle = `rgba(24, 224, 230, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      
      for(let i = 1; i <= simState.currentStep; i++) {
        const x = margin.left + (i / maxN) * chartWidth;
        const freq = traj.frequencies[i];
        const y = margin.top + chartHeight * (1 - freq);
        
        if(i === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      
      ctx.stroke();
    });
  }
  
  // Y-axis ticks
  ctx.fillStyle = '#b8d4ff';
  ctx.font = '11px Montserrat, Arial, sans-serif';
  ctx.textAlign = 'right';
  for(let i = 0; i <= 10; i++) {
    const val = i / 10;
    const y = margin.top + chartHeight * (1 - val);
    ctx.fillText(val.toFixed(1), margin.left - 10, y + 4);
    
    ctx.strokeStyle = '#4a6ba8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left - 5, y);
    ctx.lineTo(margin.left, y);
    ctx.stroke();
  }
  
  // X-axis ticks
  ctx.textAlign = 'center';
  for(let i = 0; i <= 5; i++) {
    const val = Math.round((i / 5) * simState.n);
    const x = margin.left + (i / 5) * chartWidth;
    ctx.fillText(val.toString(), x, margin.top + chartHeight + 25);
    
    ctx.strokeStyle = '#4a6ba8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, margin.top + chartHeight);
    ctx.lineTo(x, margin.top + chartHeight + 5);
    ctx.stroke();
  }
}

function drawHistogram() {
  const canvas = $('#histogramChart');
  if(!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  ctx.clearRect(0, 0, width, height);
  
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0a1628');
  gradient.addColorStop(1, '#142042');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  if(simState.trajectories.length === 0 || simState.currentStep === 0) {
    ctx.fillStyle = '#b8d4ff';
    ctx.font = '14px Montserrat, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Distribution', width / 2, height / 2 - 10);
    ctx.fillText('(after start)', width / 2, height / 2 + 10);
    return;
  }
  
  const margin = { top: 60, right: 30, bottom: 60, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  ctx.fillStyle = '#18e0e6';
  ctx.font = 'bold 13px Montserrat, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Distribution`, width / 2, 25);
  ctx.font = '11px Montserrat, Arial, sans-serif';
  ctx.fillText(`n=${simState.currentStep}`, width / 2, 40);
  
  const frequencies = simState.trajectories.map(t => t.frequencies[simState.currentStep]);
  const numBins = Math.min(15, Math.max(5, Math.floor(simState.m / 4)));
  const minVal = Math.max(0, Math.min(...frequencies) - 0.05);
  const maxVal = Math.min(1, Math.max(...frequencies) + 0.05);
  const binWidth = (maxVal - minVal) / numBins;
  
  const bins = Array(numBins).fill(0);
  frequencies.forEach(f => {
    const binIndex = Math.min(numBins - 1, Math.max(0, Math.floor((f - minVal) / binWidth)));
    bins[binIndex]++;
  });
  
  const maxBinCount = Math.max(...bins, 1);
  const barHeight = chartHeight / numBins;
  
  bins.forEach((count, i) => {
    const barWidthPx = (count / maxBinCount) * chartWidth;
    const x = margin.left;
    const y = margin.top + i * barHeight;
    
    const barGradient = ctx.createLinearGradient(x, y, x + barWidthPx, y);
    barGradient.addColorStop(0, '#18e0e6');
    barGradient.addColorStop(1, '#2bd4d9');
    ctx.fillStyle = barGradient;
    ctx.fillRect(x, y, barWidthPx, barHeight - 2);
    
    const binStart = minVal + i * binWidth;
    ctx.fillStyle = '#b8d4ff';
    ctx.font = '9px Montserrat, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(binStart.toFixed(2), margin.left - 5, y + barHeight / 2 + 3);
  });
  
  ctx.strokeStyle = '#4a6ba8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, margin.top + chartHeight);
  ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
  ctx.stroke();
  
  ctx.fillStyle = '#b8d4ff';
  ctx.font = '11px Montserrat, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Count', margin.left + chartWidth / 2, height - 20);
}

function updateStats() {
  const statsDisplay = $('#statsDisplay');
  if(!statsDisplay) return;
  
  if(simState.trajectories.length === 0 || simState.currentStep === 0) {
    statsDisplay.innerHTML = '<div class="explanation">Statistics will appear after simulation starts</div>';
    return;
  }
  
  const currentFreqs = simState.trajectories.map(t => t.frequencies[simState.currentStep]);
  const mean = currentFreqs.reduce((a, b) => a + b, 0) / currentFreqs.length;
  const variance = currentFreqs.reduce((sum, f) => sum + Math.pow(f - mean, 2), 0) / currentFreqs.length;
  const stdDev = Math.sqrt(variance);
  const errors = currentFreqs.map(f => Math.abs(f - simState.p));
  const meanError = errors.reduce((a, b) => a + b, 0) / errors.length;
  const theoreticalVar = (simState.p * (1 - simState.p)) / simState.currentStep;
  const theoreticalStdDev = Math.sqrt(theoreticalVar);
  
  const experimentName = simState.experimentType === 'coin' ? 'Coin' : 'Die';
  
  const html = `
    <div class="stats-display">
      <div class="stat-item"><div class="stat-label">Experiment</div><div class="stat-value">${experimentName}</div></div>
      <div class="stat-item"><div class="stat-label">Current n</div><div class="stat-value">${simState.currentStep}</div></div>
      <div class="stat-item"><div class="stat-label">Trajectories (m)</div><div class="stat-value">${simState.m}</div></div>
      <div class="stat-item"><div class="stat-label">Mean f(n)</div><div class="stat-value">${mean.toFixed(4)}</div></div>
      <div class="stat-item"><div class="stat-label">True p</div><div class="stat-value">${simState.p.toFixed(3)}</div></div>
      <div class="stat-item"><div class="stat-label">Empirical Std</div><div class="stat-value">${stdDev.toFixed(4)}</div></div>
      <div class="stat-item"><div class="stat-label">Theoretical Std</div><div class="stat-value">${theoreticalStdDev.toFixed(4)}</div></div>
      <div class="stat-item"><div class="stat-label">Mean |Error|</div><div class="stat-value">${meanError.toFixed(4)}</div></div>
    </div>
    <div class="explanation">
      <strong>Convergence Analysis:</strong><br>
      • Mean f(n) = ${mean.toFixed(4)} ${Math.abs(mean - simState.p) < 0.05 ? '≈' : '→'} p = ${simState.p.toFixed(3)}<br>
      • Empirical Std Dev: ${stdDev.toFixed(4)} vs Theoretical: ${theoreticalStdDev.toFixed(4)}<br>
      • Variance = p(1-p)/n = ${theoreticalVar.toFixed(6)}<br>
      • Mean absolute error: ${meanError.toFixed(4)}<br>
      • Quality: ${meanError < 0.03 ? '✓ Excellent' : meanError < 0.08 ? '✓ Good' : '~ Moderate'}
    </div>
  `;
  
  statsDisplay.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', () => {
  log('DOM loaded - Initializing simulation');
  
  // Mobile nav
  const navToggle = document.getElementById('navToggle');
  if(navToggle) {
    navToggle.addEventListener('click', () => {
      const navLinks = document.getElementById('navLinks');
      if (navLinks) {
        navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
      }
    });
  }

  // Small delay to ensure DOM is fully ready
  setTimeout(() => {
    initSimulation();
    log('Simulation ready');
  }, 100);
});
