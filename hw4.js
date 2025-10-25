/* ================================
   Homework 4: Law of Large Numbers
   ================================ */

let simState = {
  experimentType: 'coin',
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
  const alert = document.createElement('div');
  alert.className = `alert ${type}`;
  alert.textContent = msg;
  const container = document.querySelector('.hw-detail');
  if(container) {
    container.prepend(alert);
    setTimeout(() => alert.remove(), 4000);
  }
}

function setupCanvas(canvas) {
  const container = canvas.parentElement;
  const rect = container.getBoundingClientRect();
  
  // Set display size
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  
  // Set actual size in pixels (for retina displays)
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  
  // Scale context
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  
  return { width: rect.width, height: rect.height };
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
  
  log(`Experiment: ${type}, p=${simState.p.toFixed(3)}`);
}

function initSimulation() {
  log('Initializing simulation');
  
  const btnStart = $('#btnStartSim');
  const btnPause = $('#btnPauseSim');
  const btnReset = $('#btnResetSim');
  const speedSlider = $('#animSpeed');
  const speedValue = $('#speedValue');
  const experimentType = $('#experimentType');
  
  if(!btnStart) {
    log('ERROR: UI elements not found');
    return;
  }
  
  experimentType?.addEventListener('change', () => {
    updateExperimentInfo();
    if(!simState.isRunning) {
      drawMainChart();
      drawHistogram();
    }
  });
  
  updateExperimentInfo();
  
  speedSlider?.addEventListener('input', (e) => {
    simState.speed = parseInt(e.target.value);
    if(speedValue) speedValue.textContent = simState.speed;
  });
  
  btnStart?.addEventListener('click', startSimulation);
  btnPause?.addEventListener('click', togglePause);
  btnReset?.addEventListener('click', resetSimulation);
  
  // Setup canvas sizes
  const mainCanvas = $('#mainChart');
  const histCanvas = $('#histogramChart');
  if(mainCanvas) setupCanvas(mainCanvas);
  if(histCanvas) setupCanvas(histCanvas);
  
  drawMainChart();
  drawHistogram();
  updateStats();
  
  // Resize handler
  window.addEventListener('resize', () => {
    if(mainCanvas) setupCanvas(mainCanvas);
    if(histCanvas) setupCanvas(histCanvas);
    drawMainChart();
    drawHistogram();
  });
  
  log('Initialized');
}

function startSimulation() {
  const m = parseInt($('#numTrajectories').value);
  const n = parseInt($('#numTrials').value);
  
  if(isNaN(m) || m < 1 || m > 200) {
    showAlert('Trajectories: 1-200', 'alert');
    return;
  }
  if(isNaN(n) || n < 10 || n > 2000) {
    showAlert('Trials: 10-2000', 'alert');
    return;
  }
  
  if(simState.intervalId) clearInterval(simState.intervalId);
  
  simState.m = m;
  simState.n = n;
  simState.currentStep = 0;
  simState.isRunning = true;
  simState.isPaused = false;
  
  simState.trajectories = [];
  for(let i = 0; i < m; i++) {
    simState.trajectories.push({ id: i, successes: 0, frequencies: [0] });
  }
  
  $('#btnStartSim').disabled = true;
  $('#btnPauseSim').disabled = false;
  $('#numTrajectories').disabled = true;
  $('#numTrials').disabled = true;
  $('#experimentType').disabled = true;
  
  showAlert('Started!', 'success');
  runSimulationStep();
}

function runSimulationStep() {
  if(!simState.isRunning || simState.isPaused) return;
  
  if(simState.currentStep >= simState.n) {
    completeSimulation();
    return;
  }
  
  simState.currentStep++;
  
  for(let traj of simState.trajectories) {
    if(Math.random() < simState.p) traj.successes++;
    traj.frequencies.push(traj.successes / simState.currentStep);
  }
  
  const updateInterval = Math.max(1, Math.floor(10 / (simState.speed / 50)));
  if(simState.currentStep % updateInterval === 0 || simState.currentStep === simState.n) {
    drawMainChart();
    drawHistogram();
    updateStats();
    updateProgressBar();
  }
  
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
  showAlert('Completed!', 'success');
}

function togglePause() {
  simState.isPaused = !simState.isPaused;
  const btn = $('#btnPauseSim');
  
  if(simState.isPaused) {
    btn.textContent = '▶ Resume';
    if(simState.intervalId) {
      clearTimeout(simState.intervalId);
      simState.intervalId = null;
    }
  } else {
    btn.textContent = '⏸ Pause';
    runSimulationStep();
  }
}

function resetSimulation() {
  if(simState.intervalId) {
    clearTimeout(simState.intervalId);
    simState.intervalId = null;
  }
  
  simState.currentStep = 0;
  simState.isRunning = false;
  simState.isPaused = false;
  simState.trajectories = [];
  
  $('#btnStartSim').disabled = false;
  $('#btnPauseSim').disabled = true;
  $('#btnPauseSim').textContent = '⏸ Pause';
  $('#numTrajectories').disabled = false;
  $('#numTrials').disabled = false;
  $('#experimentType').disabled = false;
  
  const bar = $('#progressBar');
  if(bar) {
    bar.style.width = '0%';
    bar.textContent = '0%';
  }
  
  drawMainChart();
  drawHistogram();
  updateStats();
  showAlert('Reset', 'success');
}

function updateProgressBar() {
  const bar = $('#progressBar');
  if(bar) {
    const pct = Math.round((simState.currentStep / simState.n) * 100);
    bar.style.width = `${pct}%`;
    bar.textContent = `${pct}%`;
  }
}

function drawMainChart() {
  const canvas = $('#mainChart');
  if(!canvas) return;
  
  const dims = setupCanvas(canvas);
  const ctx = canvas.getContext('2d');
  const { width, height } = dims;
  
  ctx.clearRect(0, 0, width, height);
  
  // Background
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#0a1628');
  grad.addColorStop(1, '#142042');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  
  const m = { top: 70, right: 50, bottom: 80, left: 90 };
  const cw = width - m.left - m.right;
  const ch = height - m.top - m.bottom;
  
  // Title
  ctx.fillStyle = '#18e0e6';
  ctx.font = 'bold 20px Montserrat, Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Trajectories: ${simState.experimentType === 'coin' ? 'Coin Flip' : 'Die Roll (6)'}`, width/2, 30);
  
  ctx.font = '14px Montserrat, Arial';
  ctx.fillStyle = '#b8d4ff';
  ctx.fillText(`p = ${simState.p.toFixed(3)} | m = ${simState.m} | n = ${simState.currentStep}/${simState.n}`, width/2, 55);
  
  // Axes
  ctx.strokeStyle = '#4a6ba8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(m.left, m.top);
  ctx.lineTo(m.left, m.top + ch);
  ctx.lineTo(m.left + cw, m.top + ch);
  ctx.stroke();
  
  // Labels
  ctx.save();
  ctx.fillStyle = '#b8d4ff';
  ctx.font = '16px Montserrat, Arial';
  ctx.textAlign = 'center';
  ctx.translate(30, m.top + ch/2);
  ctx.rotate(-Math.PI/2);
  ctx.fillText('f(n)', 0, 0);
  ctx.restore();
  
  ctx.fillText('Number of Trials (n)', m.left + cw/2, height - 20);
  
  // p line
  ctx.strokeStyle = '#ff5722';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 8]);
  const yp = m.top + ch * (1 - simState.p);
  ctx.beginPath();
  ctx.moveTo(m.left, yp);
  ctx.lineTo(m.left + cw, yp);
  ctx.stroke();
  ctx.setLineDash([]);
  
  ctx.fillStyle = '#ff5722';
  ctx.font = 'bold 14px Montserrat, Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`p = ${simState.p.toFixed(3)}`, m.left + 15, yp - 8);
  
  // Trajectories
  if(simState.trajectories.length > 0 && simState.currentStep > 0) {
    simState.trajectories.forEach(traj => {
      const alpha = Math.min(0.9, 0.3 + 0.6/Math.sqrt(simState.m));
      ctx.strokeStyle = `rgba(24, 224, 230, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      for(let i = 1; i <= simState.currentStep; i++) {
        const x = m.left + (i / simState.n) * cw;
        const y = m.top + ch * (1 - traj.frequencies[i]);
        if(i === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
  }
  
  // Y ticks
  ctx.fillStyle = '#b8d4ff';
  ctx.font = '13px Montserrat, Arial';
  ctx.textAlign = 'right';
  for(let i = 0; i <= 10; i++) {
    const v = i / 10;
    const y = m.top + ch * (1 - v);
    ctx.fillText(v.toFixed(1), m.left - 15, y + 5);
    
    ctx.strokeStyle = '#4a6ba8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(m.left - 8, y);
    ctx.lineTo(m.left, y);
    ctx.stroke();
  }
  
  // X ticks
  ctx.textAlign = 'center';
  for(let i = 0; i <= 5; i++) {
    const v = Math.round((i/5) * simState.n);
    const x = m.left + (i/5) * cw;
    ctx.fillText(v, x, m.top + ch + 30);
    
    ctx.strokeStyle = '#4a6ba8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, m.top + ch);
    ctx.lineTo(x, m.top + ch + 8);
    ctx.stroke();
  }
}

function drawHistogram() {
  const canvas = $('#histogramChart');
  if(!canvas) return;
  
  const dims = setupCanvas(canvas);
  const ctx = canvas.getContext('2d');
  const { width, height } = dims;
  
  ctx.clearRect(0, 0, width, height);
  
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#0a1628');
  grad.addColorStop(1, '#142042');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  
  if(simState.trajectories.length === 0 || simState.currentStep === 0) {
    ctx.fillStyle = '#b8d4ff';
    ctx.font = '16px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Distribution', width/2, height/2 - 15);
    ctx.fillText('(after start)', width/2, height/2 + 15);
    return;
  }
  
  const m = { top: 70, right: 40, bottom: 80, left: 70 };
  const cw = width - m.left - m.right;
  const ch = height - m.top - m.bottom;
  
  ctx.fillStyle = '#18e0e6';
  ctx.font = 'bold 16px Montserrat, Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Distribution', width/2, 30);
  ctx.font = '13px Montserrat, Arial';
  ctx.fillText(`n=${simState.currentStep}`, width/2, 50);
  
  const freqs = simState.trajectories.map(t => t.frequencies[simState.currentStep]);
  const bins = Math.min(15, Math.max(5, Math.floor(simState.m / 4)));
  const min = Math.max(0, Math.min(...freqs) - 0.05);
  const max = Math.min(1, Math.max(...freqs) + 0.05);
  const bw = (max - min) / bins;
  
  const counts = Array(bins).fill(0);
  freqs.forEach(f => {
    const idx = Math.min(bins - 1, Math.max(0, Math.floor((f - min) / bw)));
    counts[idx]++;
  });
  
  const maxCount = Math.max(...counts, 1);
  const bh = ch / bins;
  
  counts.forEach((cnt, i) => {
    const bwPx = (cnt / maxCount) * cw;
    const x = m.left;
    const y = m.top + i * bh;
    
    const barGrad = ctx.createLinearGradient(x, y, x + bwPx, y);
    barGrad.addColorStop(0, '#18e0e6');
    barGrad.addColorStop(1, '#2bd4d9');
    ctx.fillStyle = barGrad;
    ctx.fillRect(x, y, bwPx, bh - 3);
    
    const bs = min + i * bw;
    ctx.fillStyle = '#b8d4ff';
    ctx.font = '11px Montserrat, Arial';
    ctx.textAlign = 'right';
    ctx.fillText(bs.toFixed(2), m.left - 8, y + bh/2 + 4);
  });
  
  ctx.strokeStyle = '#4a6ba8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(m.left, m.top);
  ctx.lineTo(m.left, m.top + ch);
  ctx.lineTo(m.left + cw, m.top + ch);
  ctx.stroke();
  
  ctx.fillStyle = '#b8d4ff';
  ctx.font = '13px Montserrat, Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Count', m.left + cw/2, height - 25);
}

function updateStats() {
  const el = $('#statsDisplay');
  if(!el) return;
  
  if(simState.trajectories.length === 0 || simState.currentStep === 0) {
    el.innerHTML = '<div class="explanation">Stats after start</div>';
    return;
  }
  
  const fs = simState.trajectories.map(t => t.frequencies[simState.currentStep]);
  const mean = fs.reduce((a,b) => a+b, 0) / fs.length;
  const vari = fs.reduce((s,f) => s + Math.pow(f - mean, 2), 0) / fs.length;
  const std = Math.sqrt(vari);
  const errs = fs.map(f => Math.abs(f - simState.p));
  const merr = errs.reduce((a,b) => a+b, 0) / errs.length;
  const tvar = (simState.p * (1 - simState.p)) / simState.currentStep;
  const tstd = Math.sqrt(tvar);
  
  const exp = simState.experimentType === 'coin' ? 'Coin' : 'Die';
  
  el.innerHTML = `
    <div class="stats-display">
      <div class="stat-item"><div class="stat-label">Experiment</div><div class="stat-value">${exp}</div></div>
      <div class="stat-item"><div class="stat-label">n</div><div class="stat-value">${simState.currentStep}</div></div>
      <div class="stat-item"><div class="stat-label">m</div><div class="stat-value">${simState.m}</div></div>
      <div class="stat-item"><div class="stat-label">Mean f(n)</div><div class="stat-value">${mean.toFixed(4)}</div></div>
      <div class="stat-item"><div class="stat-label">True p</div><div class="stat-value">${simState.p.toFixed(3)}</div></div>
      <div class="stat-item"><div class="stat-label">Emp. Std</div><div class="stat-value">${std.toFixed(4)}</div></div>
      <div class="stat-item"><div class="stat-label">Theor. Std</div><div class="stat-value">${tstd.toFixed(4)}</div></div>
      <div class="stat-item"><div class="stat-label">Mean Error</div><div class="stat-value">${merr.toFixed(4)}</div></div>
    </div>
    <div class="explanation">
      <strong>Analysis:</strong><br>
      • f(n) = ${mean.toFixed(4)} → p = ${simState.p.toFixed(3)}<br>
      • Std: ${std.toFixed(4)} vs ${tstd.toFixed(4)}<br>
      • Variance: ${tvar.toFixed(6)}<br>
      • Quality: ${merr < 0.03 ? '✓ Excellent' : merr < 0.08 ? '✓ Good' : '~ Moderate'}
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  log('DOM ready');
  
  document.getElementById('navToggle')?.addEventListener('click', () => {
    const nav = document.getElementById('navLinks');
    if(nav) nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
  });

  setTimeout(initSimulation, 100);
});
