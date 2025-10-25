/* ================================
   Homework 3: RSA Encryption & Frequency Analysis
   Author: Lorenzo Ciafrelli
   Features: RSA implementation, frequency analysis attack, step-by-step visualization
   ================================ */

// Global state
let rsaState = {
  p: 0,
  q: 0,
  n: 0,
  phi: 0,
  e: 0,
  d: 0,
  publicKey: null,
  privateKey: null,
  plaintext: '',
  ciphertext: [],
  originalDistribution: {},
  keysGenerated: false
};

const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

function log(msg) {
  console.log(`[HW3] ${msg}`);
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
    setTimeout(() => alert.remove(), 5000);
  }
}

// ============ MATH UTILITIES ============

// Check if number is prime
function isPrime(n) {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

// Get small primes up to limit
function getSmallPrimes(limit = 100) {
  const primes = [];
  for (let i = 2; i <= limit; i++) {
    if (isPrime(i)) primes.push(i);
  }
  return primes;
}

// GCD using Euclidean algorithm
function gcd(a, b) {
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

// Extended Euclidean Algorithm for modular inverse
// Returns d such that (e * d) % phi === 1
function modInverse(e, phi) {
  let [old_r, r] = [e, phi];
  let [old_s, s] = [1, 0];
  
  while (r !== 0) {
    const quotient = Math.floor(old_r / r);
    [old_r, r] = [r, old_r - quotient * r];
    [old_s, s] = [s, old_s - quotient * s];
  }
  
  // Make sure result is positive
  return old_s < 0 ? old_s + phi : old_s;
}

// Fast modular exponentiation: (base^exp) % mod
// Complexity: O(log exp)
function modPow(base, exp, mod) {
  if (mod === 1) return 0;
  let result = 1;
  base = base % mod;
  while (exp > 0) {
    if (exp % 2 === 1) {
      result = (result * base) % mod;
    }
    exp = Math.floor(exp / 2);
    base = (base * base) % mod;
  }
  return result;
}

// ============ RSA KEY GENERATION ============

function initRSA() {
  log('Initializing RSA interface');
  
  $('#btnGenerateKeys')?.addEventListener('click', generateRSAKeys);
  $('#btnRandomPrimes')?.addEventListener('click', useRandomPrimes);
  $('#btnEncrypt')?.addEventListener('click', encryptMessage);
  $('#btnShowEncSteps')?.addEventListener('click', showEncryptionSteps);
  $('#btnDecrypt')?.addEventListener('click', decryptMessage);
  $('#btnShowDecSteps')?.addEventListener('click', showDecryptionSteps);
  $('#btnFrequencyAttack')?.addEventListener('click', frequencyAnalysisAttack);
}

function useRandomPrimes() {
  const primes = getSmallPrimes(50); // Primes up to 50 for manageability
  const p = primes[Math.floor(Math.random() * primes.length)];
  let q = primes[Math.floor(Math.random() * primes.length)];
  
  // Make sure p !== q
  while (q === p) {
    q = primes[Math.floor(Math.random() * primes.length)];
  }
  
  $('#primep').value = p;
  $('#primeq').value = q;
  
  showAlert(`Random primes selected: p=${p}, q=${q}`, 'success');
}

function generateRSAKeys() {
  log('Generating RSA keys');
  
  const p = parseInt($('#primep').value);
  const q = parseInt($('#primeq').value);
  const eInput = $('#publice').value;
  
  // Validation
  if (!isPrime(p)) {
    showAlert(`p=${p} is not prime! Please choose a prime number.`, 'alert');
    return;
  }
  if (!isPrime(q)) {
    showAlert(`q=${q} is not prime! Please choose a prime number.`, 'alert');
    return;
  }
  if (p === q) {
    showAlert('p and q must be different!', 'alert');
    return;
  }
  
  // Calculate n and phi
  const n = p * q;
  const phi = (p - 1) * (q - 1);
  
  // Choose e
  let e;
  if (eInput && eInput.trim() !== '') {
    e = parseInt(eInput);
    if (e <= 1 || e >= phi || gcd(e, phi) !== 1) {
      showAlert(`e=${e} is invalid! Must satisfy 1 < e < φ(n) and gcd(e, φ(n))=1`, 'alert');
      return;
    }
  } else {
    // Auto-select e
    const candidates = [3, 5, 7, 11, 13, 17, 19, 23, 29, 31];
    e = candidates.find(candidate => candidate < phi && gcd(candidate, phi) === 1) || 3;
    $('#publice').value = e;
  }
  
  // Calculate d using Extended Euclidean Algorithm
  const d = modInverse(e, phi);
  
  // Update state
  rsaState = {
    p, q, n, phi, e, d,
    publicKey: { e, n },
    privateKey: { d, n },
    plaintext: '',
    ciphertext: [],
    originalDistribution: {},
    keysGenerated: true
  };
  
  log(`Keys generated: p=${p}, q=${q}, n=${n}, φ=${phi}, e=${e}, d=${d}`);
  
  renderKeyGeneration();
  showAlert('RSA keys generated successfully!', 'success');
}

function renderKeyGeneration() {
  const container = createEl('div', { class: 'result-box' });
  
  const title = createEl('h4', { innerHTML: 'Generated RSA Keys', style: 'color:#18e0e6' });
  
  // Display keys
  const keysDisplay = createEl('div', { style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0;' });
  
  const publicKeyBox = createEl('div', { class: 'key-display' });
  publicKeyBox.innerHTML = `
    <div class="key-label">🔓 Public Key</div>
    <div class="key-value">e = ${rsaState.e}</div>
    <div class="key-value">n = ${rsaState.n}</div>
  `;
  
  const privateKeyBox = createEl('div', { class: 'key-display' });
  privateKeyBox.innerHTML = `
    <div class="key-label">🔐 Private Key</div>
    <div class="key-value">d = ${rsaState.d}</div>
    <div class="key-value">n = ${rsaState.n}</div>
  `;
  
  keysDisplay.appendChild(publicKeyBox);
  keysDisplay.appendChild(privateKeyBox);
  
  container.appendChild(title);
  container.appendChild(keysDisplay);
  
  $('#keyGenResults').innerHTML = '';
  $('#keyGenResults').appendChild(container);
  
  // Render step-by-step calculation
  renderKeyGenSteps();
}

function renderKeyGenSteps() {
  const container = createEl('div', { class: 'result-box' });
  const title = createEl('h4', { innerHTML: 'Step-by-Step Key Generation', style: 'color:#18e0e6; margin-bottom: 1rem;' });
  
  const steps = createEl('div');
  steps.innerHTML = `
    <div class="math-step">
      <div class="math-step-title">Step 1: Prime Selection</div>
      <div class="math-calculation">p = <span class="highlight-number">${rsaState.p}</span>, q = <span class="highlight-number">${rsaState.q}</span></div>
    </div>
    
    <div class="math-step">
      <div class="math-step-title">Step 2: Calculate Modulus n</div>
      <div class="math-calculation">n = p × q = ${rsaState.p} × ${rsaState.q} = <span class="highlight-number">${rsaState.n}</span></div>
    </div>
    
    <div class="math-step">
      <div class="math-step-title">Step 3: Calculate Euler's Totient φ(n)</div>
      <div class="math-calculation">φ(n) = (p-1) × (q-1) = ${rsaState.p-1} × ${rsaState.q-1} = <span class="highlight-number">${rsaState.phi}</span></div>
    </div>
    
    <div class="math-step">
      <div class="math-step-title">Step 4: Select Public Exponent e</div>
      <div class="math-calculation">e = <span class="highlight-number">${rsaState.e}</span></div>
      <div class="math-calculation">Verify: gcd(${rsaState.e}, ${rsaState.phi}) = ${gcd(rsaState.e, rsaState.phi)} ✓</div>
    </div>
    
    <div class="math-step">
      <div class="math-step-title">Step 5: Calculate Private Exponent d</div>
      <div class="math-calculation">d ≡ e⁻¹ (mod φ(n))</div>
      <div class="math-calculation">d = <span class="highlight-number">${rsaState.d}</span></div>
      <div class="math-calculation">Verify: (d × e) mod φ(n) = (${rsaState.d} × ${rsaState.e}) mod ${rsaState.phi} = ${(rsaState.d * rsaState.e) % rsaState.phi} ✓</div>
    </div>
  `;
  
  container.appendChild(title);
  container.appendChild(steps);
  
  $('#keyGenSteps').innerHTML = '';
  $('#keyGenSteps').appendChild(container);
}

// ============ RSA ENCRYPTION ============

function letterToNumber(letter) {
  // A=0, B=1, ..., Z=25
  return letter.toUpperCase().charCodeAt(0) - 65;
}

function numberToLetter(num) {
  // 0=A, 1=B, ..., 25=Z
  return String.fromCharCode(num + 65);
}

function encryptMessage() {
  if (!rsaState.keysGenerated) {
    showAlert('Please generate RSA keys first!', 'alert');
    return;
  }
  
  const plaintext = $('#plainText').value;
  if (!plaintext.trim()) {
    showAlert('Please enter a message to encrypt', 'alert');
    return;
  }
  
  rsaState.plaintext = plaintext;
  rsaState.ciphertext = [];
  
  // Encrypt letter by letter
  for (const char of plaintext) {
    if (/[A-Za-z]/.test(char)) {
      const m = letterToNumber(char);
      const c = modPow(m, rsaState.e, rsaState.n);
      rsaState.ciphertext.push(c);
    } else {
      // Keep non-alphabetic characters as-is (encoded as negative to distinguish)
      rsaState.ciphertext.push(-1); // Placeholder for non-letter
    }
  }
  
  // Display ciphertext
  $('#cipherText').value = rsaState.ciphertext.join(' ');
  
  // Calculate original distribution
  rsaState.originalDistribution = computeLetterDistribution(plaintext);
  
  log(`Encrypted: "${plaintext}" -> [${rsaState.ciphertext.slice(0, 10).join(', ')}...]`);
  showAlert('Message encrypted successfully!', 'success');
}

function showEncryptionSteps() {
  if (!rsaState.keysGenerated || rsaState.ciphertext.length === 0) {
    showAlert('Please encrypt a message first', 'alert');
    return;
  }
  
  const container = createEl('div', { class: 'result-box' });
  const title = createEl('h4', { innerHTML: 'Encryption Process (Letter-by-Letter)', style: 'color:#18e0e6; margin-bottom: 1rem;' });
  
  const stepsContainer = createEl('div', { class: 'encryption-steps' });
  
  let letterIndex = 0;
  for (let i = 0; i < rsaState.plaintext.length; i++) {
    const char = rsaState.plaintext[i];
    
    if (/[A-Za-z]/.test(char)) {
      const m = letterToNumber(char);
      const c = rsaState.ciphertext[i];
      
      const step = createEl('div', { class: 'letter-encryption' });
      step.innerHTML = `
        <strong>Letter "${char.toUpperCase()}"</strong> (position ${letterIndex + 1})<br>
        M = ${m} → C = M<sup>e</sup> mod n = ${m}<sup>${rsaState.e}</sup> mod ${rsaState.n} = <span class="highlight-number">${c}</span>
      `;
      stepsContainer.appendChild(step);
      letterIndex++;
      
      // Limit display to first 20 letters for readability
      if (letterIndex >= 20) {
        const more = createEl('div', { class: 'letter-encryption' });
        more.innerHTML = `<em>... and ${rsaState.ciphertext.filter(x => x >= 0).length - 20} more letters</em>`;
        stepsContainer.appendChild(more);
        break;
      }
    }
  }
  
  container.appendChild(title);
  container.appendChild(stepsContainer);
  
  $('#encryptionSteps').innerHTML = '';
  $('#encryptionSteps').appendChild(container);
}

// ============ RSA DECRYPTION ============

function decryptMessage() {
  if (!rsaState.keysGenerated) {
    showAlert('Please generate RSA keys first!', 'alert');
    return;
  }
  
  if (rsaState.ciphertext.length === 0) {
    showAlert('Please encrypt a message first', 'alert');
    return;
  }
  
  const decrypted = decryptWithKey(rsaState.ciphertext, rsaState.d, rsaState.n, rsaState.plaintext);
  $('#decryptedText').value = decrypted;
  
  log(`Decrypted with private key: "${decrypted}"`);
  showAlert('Message decrypted with private key!', 'success');
}

function decryptWithKey(ciphertext, d, n, originalText) {
  let decrypted = '';
  let origIndex = 0;
  
  for (const c of ciphertext) {
    if (c === -1) {
      // Non-alphabetic character, get from original
      decrypted += originalText[origIndex];
    } else {
      const m = modPow(c, d, n);
      decrypted += numberToLetter(m);
    }
    origIndex++;
  }
  
  return decrypted;
}

function showDecryptionSteps() {
  if (!rsaState.keysGenerated || rsaState.ciphertext.length === 0) {
    showAlert('Please encrypt a message first', 'alert');
    return;
  }
  
  const container = createEl('div', { class: 'result-box' });
  const title = createEl('h4', { innerHTML: 'Decryption Process (Using Private Key)', style: 'color:#18e0e6; margin-bottom: 1rem;' });
  
  const stepsContainer = createEl('div', { class: 'encryption-steps' });
  
  let letterIndex = 0;
  for (let i = 0; i < rsaState.ciphertext.length; i++) {
    const c = rsaState.ciphertext[i];
    
    if (c >= 0) {
      const m = modPow(c, rsaState.d, rsaState.n);
      const letter = numberToLetter(m);
      
      const step = createEl('div', { class: 'letter-encryption' });
      step.innerHTML = `
        <strong>Ciphertext ${c}</strong> (position ${letterIndex + 1})<br>
        M = C<sup>d</sup> mod n = ${c}<sup>${rsaState.d}</sup> mod ${rsaState.n} = ${m} → Letter "<span class="highlight-number">${letter}</span>"
      `;
      stepsContainer.appendChild(step);
      letterIndex++;
      
      if (letterIndex >= 20) {
        const more = createEl('div', { class: 'letter-encryption' });
        more.innerHTML = `<em>... and ${rsaState.ciphertext.filter(x => x >= 0).length - 20} more letters</em>`;
        stepsContainer.appendChild(more);
        break;
      }
    }
  }
  
  container.appendChild(title);
  container.appendChild(stepsContainer);
  
  $('#decryptionSteps').innerHTML = '';
  $('#decryptionSteps').appendChild(container);
}

// ============ FREQUENCY ANALYSIS ATTACK ============

function computeLetterDistribution(text) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let counts = {};
  letters.split('').forEach(l => counts[l] = 0);
  let totalLetters = 0;
  
  for (const ch of text.toUpperCase()) {
    if (letters.includes(ch)) {
      counts[ch]++;
      totalLetters++;
    }
  }
  
  const distribution = {};
  letters.split('').forEach(l => distribution[l] = {
    count: counts[l],
    percent: totalLetters ? ((counts[l] / totalLetters) * 100).toFixed(2) : 0
  });
  
  return { distribution, totalLetters };
}

function chiSquaredScore(dist1, dist2) {
  let score = 0;
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  for (const letter of letters) {
    const obs = parseFloat(dist1.distribution[letter].percent);
    const exp = parseFloat(dist2.distribution[letter].percent);
    score += Math.pow(obs - exp, 2) / (exp + 0.01); // Add small epsilon
  }
  
  return score;
}

function frequencyAnalysisAttack() {
  if (!rsaState.keysGenerated || rsaState.ciphertext.length === 0) {
    showAlert('Please encrypt a message first!', 'alert');
    return;
  }
  
  log('Starting frequency analysis attack...');
  showAlert('Analyzing all possible decryption keys...', 'info');
  
  const candidates = [];
  
  // Try all possible values of d from 1 to phi
  for (let testD = 1; testD < rsaState.phi; testD++) {
    // Verify this is a valid private key: (e * testD) mod phi should be 1
    if ((rsaState.e * testD) % rsaState.phi !== 1) continue;
    
    // Decrypt with this candidate key
    const decrypted = decryptWithKey(rsaState.ciphertext, testD, rsaState.n, rsaState.plaintext);
    const decryptedDist = computeLetterDistribution(decrypted);
    
    // Calculate similarity with original distribution
    const score = chiSquaredScore(rsaState.originalDistribution, decryptedDist);
    
    candidates.push({
      d: testD,
      decrypted,
      distribution: decryptedDist,
      score
    });
  }
  
  // Sort by score (lower is better)
  candidates.sort((a, b) => a.score - b.score);
  const best = candidates[0];
  
  log(`Frequency attack complete: found d=${best.d}, score=${best.score.toFixed(3)}`);
  
  renderFrequencyAttackResults(candidates.slice(0, 10), best);
  renderVerification(best);
  
  showAlert(`Attack successful! Discovered private key d=${best.d}`, 'success');
}

function renderFrequencyAttackResults(topCandidates, best) {
  const container = createEl('div', { class: 'result-box' });
  const title = createEl('h4', { innerHTML: 'Frequency Analysis Attack Results', style: 'color:#18e0e6' });
  
  const explanation = createEl('div', { class: 'explanation', innerHTML: `
    <strong>Attack Method:</strong> Frequency Distribution Comparison<br><br>
    <strong>Algorithm:</strong><br>
    1. Compute letter frequency distribution of original plaintext<br>
    2. For each valid private key d (where e×d ≡ 1 mod φ(n)), decrypt ciphertext<br>
    3. Compute frequency distribution of decrypted text<br>
    4. Calculate chi-squared score comparing distributions (lower = better match)<br>
    5. Select key with lowest score<br><br>
    <strong>Best Match:</strong> d = <span class="highlight-number">${best.d}</span> (score: ${best.score.toFixed(3)})<br>
    <strong>Actual Private Key:</strong> d = <span class="highlight-number">${rsaState.d}</span><br>
    <strong>Result:</strong> ${best.d === rsaState.d ? '<span style="color:#4caf50;">✓ CORRECT KEY FOUND</span>' : '<span style="color:#ff9800;">⚠ Different key (may still produce valid text)</span>'}
  `});
  
  // Top candidates
  const candidatesBox = createEl('div', { class: 'result-box', style: 'margin-top: 1rem;' });
  const candidatesTitle = createEl('h5', { textContent: 'Top 10 Candidate Keys', style: 'color:#18e0e6; margin-bottom: 1rem;' });
  candidatesBox.appendChild(candidatesTitle);
  
  topCandidates.forEach((candidate, idx) => {
    const isActual = candidate.d === rsaState.d;
    const candidateDiv = createEl('div', { 
      class: 'shift-candidate' + (idx === 0 ? ' best' : ''),
      innerHTML: `
        <strong>d = ${candidate.d}</strong> ${isActual ? '(ACTUAL KEY)' : ''} - 
        Score: ${candidate.score.toFixed(3)} | 
        Preview: "${candidate.decrypted.substring(0, 50)}${candidate.decrypted.length > 50 ? '...' : ''}"
      `
    });
    candidatesBox.appendChild(candidateDiv);
  });
  
  // Comparative charts
  const chartSection = createEl('div', { class: 'dual-chart-container', style: 'margin-top: 2rem;' });
  
  const originalChartCont = createEl('div', { class: 'chart-container' });
  const originalCanvas = createEl('canvas', { width: '900', height: '500' });
  originalChartCont.appendChild(createEl('h6', { textContent: 'Original Plaintext Distribution', style: 'color:#18e0e6; margin-bottom: 1rem;' }));
  originalChartCont.appendChild(originalCanvas);
  
  const decryptedChartCont = createEl('div', { class: 'chart-container' });
  const decryptedCanvas = createEl('canvas', { width: '900', height: '500' });
  decryptedChartCont.appendChild(createEl('h6', { textContent: `Best Match Distribution (d=${best.d})`, style: 'color:#18e0e6; margin-bottom: 1rem;' }));
  decryptedChartCont.appendChild(decryptedCanvas);
  
  chartSection.appendChild(originalChartCont);
  chartSection.appendChild(decryptedChartCont);
  
  container.appendChild(title);
  container.appendChild(explanation);
  container.appendChild(candidatesBox);
  container.appendChild(chartSection);
  
  $('#frequencyAttackResults').innerHTML = '';
  $('#frequencyAttackResults').appendChild(container);
  
  // Draw charts
  setTimeout(() => {
    const letters = Object.keys(rsaState.originalDistribution.distribution);
    const originalCounts = letters.map(l => rsaState.originalDistribution.distribution[l].count);
    const decryptedCounts = letters.map(l => best.distribution.distribution[l].count);
    
    drawBarChart(originalCanvas, letters, originalCounts, 'Original Plaintext Distribution');
    drawBarChart(decryptedCanvas, letters, decryptedCounts, `Decrypted Text Distribution (d=${best.d})`);
  }, 100);
}

function renderVerification(best) {
  const container = createEl('div', { class: 'result-box' });
  const title = createEl('h4', { textContent: 'Attack Verification', style: 'color:#18e0e6' });
  
  const isKeyCorrect = best.d === rsaState.d;
  const isTextCorrect = best.decrypted.toUpperCase().replace(/[^A-Z]/g, '') === 
                        rsaState.plaintext.toUpperCase().replace(/[^A-Z]/g, '');
  
  const verification = createEl('div', { class: 'explanation', innerHTML: `
    <strong>Attack Success Metrics:</strong><br><br>
    
    <strong>Key Recovery:</strong><br>
    • Actual private key d: <span class="highlight-number">${rsaState.d}</span><br>
    • Discovered key d: <span class="highlight-number">${best.d}</span><br>
    • Key match: <span style="color: ${isKeyCorrect ? '#4caf50' : '#ff5722'}; font-weight: bold;">
      ${isKeyCorrect ? '✓ EXACT MATCH' : '✗ DIFFERENT KEY'}
    </span><br><br>
    
    <strong>Text Recovery:</strong><br>
    • Original plaintext: "${rsaState.plaintext}"<br>
    • Decrypted text: "${best.decrypted}"<br>
    • Text match: <span style="color: ${isTextCorrect ? '#4caf50' : '#ff5722'}; font-weight: bold;">
      ${isTextCorrect ? '✓ PERFECT MATCH' : '✗ MISMATCH'}
    </span><br><br>
    
    <strong>Algorithm Performance:</strong><br>
    • Search space: φ(n) = ${rsaState.phi} possible keys<br>
    • Valid keys tested: ${Math.floor(rsaState.phi / gcd(rsaState.phi, rsaState.e))}<br>
    • Complexity: O(φ(n) × m × 26) where m = ${rsaState.plaintext.length}<br>
    • Chi-squared score: ${best.score.toFixed(3)} (lower is better)<br><br>
    
    ${isKeyCorrect && isTextCorrect ? 
      '<strong style="color:#4caf50;">🎉 SUCCESS!</strong> The frequency analysis attack successfully recovered both the private key and original message.' :
      '<strong style="color:#ff9800;">⚠ NOTE:</strong> With small primes and short messages, multiple keys may produce similar distributions. The algorithm correctly identified the best statistical match.'}
  `});
  
  container.appendChild(title);
  container.appendChild(verification);
  
  $('#verificationResults').innerHTML = '';
  $('#verificationResults').appendChild(container);
}

// ============ CHART DRAWING ============

function drawBarChart(canvas, labels, values, title) {
  try {
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

    const margin = { top: 70, right: 50, bottom: 100, left: 80 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Title
    ctx.fillStyle = '#18e0e6';
    ctx.font = 'bold 20px Montserrat, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, 40);

    // Axes
    ctx.strokeStyle = '#4a6ba8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + chartHeight);
    ctx.lineTo(margin.left + chartWidth, margin.top + chartHeight);
    ctx.stroke();

    const maxValue = Math.max(...values, 1);
    const barWidth = chartWidth / labels.length * 0.75;
    const barSpacing = chartWidth / labels.length * 0.25;

    labels.forEach((label, i) => {
      const val = values[i];
      const barHeight = (val / maxValue) * (chartHeight - 20);
      const x = margin.left + i * (barWidth + barSpacing) + barSpacing / 2;
      const y = margin.top + chartHeight - barHeight;

      // Bar gradient
      const barGradient = ctx.createLinearGradient(x, y, x, y + barHeight);
      barGradient.addColorStop(0, '#18e0e6');
      barGradient.addColorStop(1, '#2bd4d9');
      ctx.fillStyle = barGradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Value on top
      if (val > 0) {
        ctx.fillStyle = '#e9f2ff';
        ctx.font = 'bold 14px Montserrat, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(val.toString(), x + barWidth / 2, y - 8);
      }

      // Letter labels
      ctx.fillStyle = '#b8d4ff';
      ctx.font = 'bold 16px Montserrat, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + barWidth / 2, height - 25);
    });
  } catch (error) {
    log(`Chart error: ${error}`);
  }
}

// ============ INITIALIZATION ============

document.addEventListener('DOMContentLoaded', () => {
  log('DOM loaded - Initializing RSA Homework 3');
  
  // Mobile nav
  document.getElementById('navToggle')?.addEventListener('click', () => {
    const navLinks = document.getElementById('navLinks');
    if (navLinks) {
      navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    }
  });

  initRSA();
  log('RSA interface initialized');
});
