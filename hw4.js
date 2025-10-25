/* ================================
   Homework 4: Law of Large Numbers Simulation
   Author: Lorenzo Ciafrelli
   Real-time animation with adjustable speed
   ================================ */

let simState = {
  m: 50,              // number of trajectories
  n: 500,             // trials per trajectory
  p: 0.5,             // probability of success (fair coin)
  speed: 50,          // animation speed
  trajectories: [],   // array of trajectory data
  currentStep: 0,     // current trial number
  isRunning: false,
  isPaused: false,
  animationId: null
};

const $ = sel => document.querySelector(sel);

function log(msg) {
  console.log(`[HW4] ${msg}`);
}

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
  log(`Alert: ${msg}`);
  const alert = createEl('div', { class: `alert ${type}`, textContent: msg });
  const container = $('.hw-detail');
  if(container) {
    container.prepend(alert);
    setTimeout(() => alert.remove(), 4000);
  }
}

// Initialize simulation
function initSimulation() {
  log('Initializing LLN simulation');
  
  const btnStart = $('#btnStartSim');
  const btnPause = $('#btnPauseSim');
  const btnReset = $('#btnResetSim');
  const speedSlider = $('#animSpeed');
  const speedValue = $('#speedValue');
  
  if(btnStart) btnStart.addEventListener('click', startSimulation);
  if(btnPause) btnPause.addEventListener('click', togglePause);
  if(btnReset) btnReset.addEventListener('click', resetSimulation);
  
  if(speedSlider) {
    speedSlider.addEventListener('input', (e) => {
      simState.speed = parseInt(e.target.value);
      if(speedValue) speedValue.textContent = simState.speed;
    });
  }
  
  // Initialize empty charts
  drawMainChart();
  drawHistogram();
  updateStats();
  
  log('Simulation initialized');
}

function startSimulation() {
  log('Starting simulation');
  
  const m = parseInt($('#numTrajectories').value);
  const n = parseInt($('#numTrials').value);
  
  if(m < 1 || m > 200) {
    showAlert('Number of trajectories must be between 1 and 200', 'alert');
    return;
  }
  if(n < 10 || n > 2000) {
    showAlert('Number of trials must be between 10 and 2000', 'alert');
    return;
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
      frequencies: [0] // f(n) at each step
    });
  }
  
  // Update UI
  $('#btnStartSim').disabled = true;
  $('#btnPauseSim').disabled = false;
  $('#numTrajectories').disabled = true;
  $('#numTrials').disabled = true;
  
  showAlert('Simulation started!', 'success');
  
  // Start animation
  animate();
}

function togglePause() {
  simState.isPaused = !simState.isPaused;
  const btnPause = $('#btnPauseSim');
  if(btnPause) {
    btnPause.textContent = simState.isPaused ? '▶ Resume' : '⏸ Pause';
  }
  
  if(!simState.isPaused && simState.isRunning) {
    animate();
  }
}

function resetSimulation() {
  log('Resetting simulation');
  
  // Stop animation
  if(simState.animationId) {
    cancelAnimationFrame(simState.animationId);
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

function animate() {
  if(!simState.isRunning || simState.isPaused) return;
  
  if(simState.currentStep >= simState.n) {
    // Simulation complete
    simState.isRunning = false;
    $('#btnStartSim').disabled = false;
    $('#btnPauseSim').disabled = true;
    $('#numTrajectories').disabled = false;
    $('#numTrials').disabled = false;
    showAlert('Simulation completed!', 'success');
    return;
  }
  
  // Perform one step for all trajectories
  simState.currentStep++;
  
  for(let traj of simState.trajectories) {
    // Simulate coin flip (Bernoulli trial)
    const success = Math.random() < simState.p;
    if(success) traj.successes++;
    
    // Calculate relative frequency
    const freq = traj.successes / simState.currentStep;
    traj.frequencies.push(freq);
  }
  
  // Update visualizations
  if(simState.currentStep % Math.max(1, Math.floor(5 / (simState.speed / 50))) === 0) {
    drawMainChart();
    drawHistogram();
    updateStats();
    updateProgressBar();
  }
  
  // Schedule next frame based on speed
  const delay = Math.max(1, 101 - simState.speed);
  setTimeout(() => {
    simState.animationId = requestAnimationFrame(animate);
  }, delay);
}

function updateProgressBar() {
  const progressBar = $('#progressBar');
  if(progressBar) {
    const percent = Math.round((simState.currentStep / simState.n) * 100);
    progressBar.style.width = `${percent}%`;
    progressBar.textContent = `${percent}%`;
  }
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
  
  const margin = { top: 60, right: 40, bottom: 60, left: 70 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Title
  ctx.fillStyle = '#18e0e6';
  ctx.font = 'bold 18px Montserrat, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Trajectories of Relative Frequency f(n)', width / 2, 30);
  
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
  ctx.translate(20, margin.top + chartHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Relative Frequency f(n)', 0, 0);
  ctx.restore();
  
  // X-axis label
  ctx.fillStyle = '#b8d4ff';
  ctx.font = '14px Montserrat, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Number of Trials (n)', margin.left + chartWidth / 2, height - 15);
  
  // Draw p=0.5 reference line
  ctx.strokeStyle = '#ff5722';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  const yRef = margin.top + chartHeight * (1 - simState.p);
  ctx.beginPath();
  ctx.moveTo(margin.left, yRef);
  ctx.lineTo(margin.left + chartWidth, yRef);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Label for p=0.5
  ctx.fillStyle = '#ff5722';
  ctx.font = 'bold 12px Montserrat, Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('p = 0.5', margin.left - 10, yRef + 5);
  
  // Draw trajectories
  if(simState.trajectories.length > 0 && simState.currentStep > 0) {
    simState.trajectories.forEach((traj, idx) => {
      // Color with some transparency
      const alpha = Math.min(0.7, 0.3 + (0.4 / simState.m));
      ctx.strokeStyle = `rgba(24, 224, 230, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      
      for(let i = 1; i <= simState.currentStep; i++) {
        const x = margin.left + (i / simState.n) * chartWidth;
        const y = margin.top + chartHeight * (1 - traj.frequencies[i]);
        
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
    
    // Tick marks
    ctx.strokeStyle = '#4a6ba8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left - 5, y);
    ctx.lineTo(margin.left, y);
    ctx.stroke();
  }
  
  // X-axis ticks
  ctx.textAlign = 'center';
  const xTicks = 5;
  for(let i = 0; i <= xTicks; i++) {
    const val = Math.round((i / xTicks) * simState.n);
    const x = margin.left + (i / xTicks) * chartWidth;
    ctx.fillText(val.toString(), x, margin.top + chartHeight + 20);
    
    // Tick marks
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
  
  // Background
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0a1628');
  gradient.addColorStop(1, '#142042');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  if(simState.trajectories.length === 0 || simState.currentStep === 0) {
    ctx.fillStyle = '#b8d4ff';
    ctx.font = '14px Montserrat, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Histogram will', width / 2, height / 2 - 10);
    ctx.fillText('appear here', width / 2, height / 2 + 10);
    return;
  }
  
  const margin = { top: 60, right: 30, bottom: 60, left: 50 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // Title
  ctx.fillStyle = '#18e0e6';
  ctx.font = 'bold 14px Montserrat, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Distribution at n=${simState.currentStep}`, width / 2, 30);
  
  // Collect current frequencies
  const frequencies = simState.trajectories.map(t => t.frequencies[simState.currentStep]);
  
  // Create histogram bins
  const numBins = Math.min(20, Math.max(5, Math.floor(simState.m / 5)));
  const minVal = Math.min(...frequencies);
  const maxVal = Math.max(...frequencies);
  const binWidth = (maxVal - minVal) / numBins || 0.1;
  
  const bins = Array(numBins).fill(0);
  frequencies.forEach(f => {
    const binIndex = Math.min(numBins - 1, Math.floor((f - minVal) / binWidth));
    bins[binIndex]++;
  });
  
  const maxBinCount = Math.max(...bins, 1);
  
  // Draw histogram (horizontal bars)
  const barHeight = chartHeight / numBins;
  
  bins.forEach((count, i) => {
    const barWidth = (count / maxBinCount) * chartWidth;
    const x = margin.left;
    const y = margin.top + i * barHeight;
    
    // Bar
    const barGradient = ctx.createLinearGradient(x, y, x + barWidth, y);
    barGradient.addColorStop(0, '#18e0e6');
    barGradient.addColorStop(1, '#2bd4d9');
    ctx.fillStyle = barGradient;
    ctx.fillRect(x, y, barWidth, barHeight - 2);
    
    // Bin label (frequency range)
    const binStart = minVal + i * binWidth;
    const binEnd = binStart + binWidth;
    ctx.fillStyle = '#b8d4ff';
    ctx.font = '9px Montserrat, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${binStart.toFixed(2)}`, margin.left - 5, y + barHeight / 2 + 3);
  }
  
  // Axes
  ctx.strokeStyle = '#4a6ba8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, margin.top + chartHeight);
  ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
  ctx.stroke();
  
  // X-axis label
  ctx.fillStyle = '#b8d4ff';
  ctx.font = '12px Montserrat, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Count', margin.left + chartWidth / 2, height - 15);
}

function updateStats() {
  const statsDisplay = $('#statsDisplay');
  if(!statsDisplay) return;
  
  if(simState.trajectories.length === 0 || simState.currentStep === 0) {
    statsDisplay.innerHTML = '<div class="explanation">Statistics will appear after simulation starts</div>';
    return;
  }
  
  // Calculate statistics
  const currentFreqs = simState.trajectories.map(t => t.frequencies[simState.currentStep]);
  const mean = currentFreqs.reduce((a, b) => a + b, 0) / currentFreqs.length;
  
  const variance = currentFreqs.reduce((sum, f) => sum + Math.pow(f - mean, 2), 0) / currentFreqs.length;
  const stdDev = Math.sqrt(variance);
  
  const errors = currentFreqs.map(f => Math.abs(f - simState.p));
  const meanError = errors.reduce((a, b) => a + b, 0) / errors.length;
  
  const theoreticalVar = (simState.p * (1 - simState.p)) / simState.currentStep;
  const theoreticalStdDev = Math.sqrt(theoreticalVar);
  
  // Render stats
  const statsContainer = createEl('div', { class: 'stats-display' });
  
  const stats = [
    { label: 'Current n', value: simState.currentStep },
    { label: 'Trajectories (m)', value: simState.m },
    { label: 'Mean f(n)', value: mean.toFixed(4) },
    { label: 'True p', value: simState.p.toFixed(2) },
    { label: 'Empirical Std Dev', value: stdDev.toFixed(4) },
    { label: 'Theoretical Std Dev', value: theoreticalStdDev.toFixed(4) },
    { label: 'Mean |Error|', value: meanError.toFixed(4) },
    { label: 'Convergence', value: (meanError < 0.05 ? '✓ Good' : meanError < 0.1 ? '~ Fair' : '✗ Poor') }
  ];
  
  stats.forEach(stat => {
    const item = createEl('div', { class: 'stat-item' });
    item.appendChild(createEl('div', { class: 'stat-label', textContent: stat.label }));
    item.appendChild(createEl('div', { class: 'stat-value', textContent: stat.value }));
    statsContainer.appendChild(item);
  });
  
  statsDisplay.innerHTML = '';
  statsDisplay.appendChild(statsContainer);
  
  // Add explanation
  const explanation = createEl('div', { class: 'explanation', innerHTML: `
    <strong>Interpretation:</strong><br>
    • Mean f(n) = ${mean.toFixed(4)} is approaching p = ${simState.p} ✓<br>
    • Empirical Std Dev = ${stdDev.toFixed(4)} vs Theoretical = ${theoreticalStdDev.toFixed(4)}<br>
    • As n increases, variance decreases as p(1-p)/n = ${theoreticalVar.toFixed(6)}<br>
    • Mean error = ${meanError.toFixed(4)} shows ${meanError < 0.05 ? 'excellent' : meanError < 0.1 ? 'good' : 'moderate'} convergence
  `});
  
  statsDisplay.appendChild(explanation);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  log('DOM loaded - Initializing LLN simulation');
  
  // Mobile nav
  document.getElementById('navToggle')?.addEventListener('click', () => {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) {
      navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    }
  });

  initSimulation();
  log('LLN simulation initialized');
});
