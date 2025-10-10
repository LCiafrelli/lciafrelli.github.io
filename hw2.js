/* ================================
   Enhanced Homework 2 Implementation
   Author: Lorenzo Ciafrelli
   Features: Step-by-step explanations, multi-language support, improved UX
   ================================ */

// Language frequency data (percentages)
const LANGUAGE_FREQUENCIES = {
  english: {
    A:8.17, B:1.49, C:2.78, D:4.25, E:12.70, F:2.23, G:2.02, H:6.09, I:6.97, J:0.15,
    K:0.77, L:4.03, M:2.41, N:6.75, O:7.51, P:1.93, Q:0.10, R:5.99, S:6.33, T:9.06,
    U:2.76, V:0.98, W:2.36, X:0.15, Y:1.97, Z:0.07
  },
  italian: {
    A:11.74, B:0.92, C:4.50, D:3.73, E:11.79, F:0.95, G:1.64, H:1.54, I:11.28, J:0.00,
    K:0.00, L:6.51, M:2.51, N:6.88, O:9.83, P:3.05, Q:0.51, R:6.37, S:4.98, T:5.62,
    U:3.01, V:2.10, W:0.00, X:0.00, Y:0.00, Z:0.49
  },
  spanish: {
    A:12.53, B:1.42, C:4.68, D:5.86, E:13.68, F:0.69, G:1.01, H:0.70, I:6.25, J:0.44,
    K:0.00, L:4.97, M:3.15, N:6.71, O:8.68, P:2.51, Q:0.88, R:6.87, S:7.98, T:4.63,
    U:3.93, V:0.90, W:0.00, X:0.22, Y:0.90, Z:0.52
  },
  french: {
    A:7.64, B:0.90, C:3.26, D:3.67, E:14.72, F:1.06, G:0.87, H:0.74, I:7.53, J:0.61,
    K:0.00, L:5.46, M:2.97, N:7.10, O:5.38, P:2.93, Q:1.36, R:6.55, S:7.95, T:7.24,
    U:6.31, V:1.83, W:0.00, X:0.43, Y:0.13, Z:0.21
  },
  german: {
    A:6.51, B:1.89, C:3.06, D:5.08, E:17.40, F:1.66, G:3.01, H:4.76, I:7.55, J:0.27,
    K:1.21, L:3.44, M:2.53, N:9.78, O:2.51, P:0.79, Q:0.02, R:7.00, S:7.27, T:6.15,
    U:4.35, V:0.67, W:1.89, X:0.03, Y:0.04, Z:1.13
  }
};

// Sample dataset
const SAMPLE_CSV = `Department,Age,LoginFailures,MalwareDetected,SecurityTraining
IT,22,1,No,Yes
IT,25,0,No,Yes
HR,41,2,No,No
HR,38,0,No,Yes
Finance,45,4,Yes,No
IT,29,3,No,Yes
Operations,50,2,Yes,Yes
Operations,33,1,No,Yes
Finance,37,0,No,Yes
IT,27,1,No,Yes
HR,29,0,No,No
Operations,44,5,Yes,No
Finance,31,1,No,Yes
IT,35,0,No,Yes
IT,39,2,No,Yes
HR,26,0,No,Yes
Finance,42,3,Yes,No
Operations,28,0,No,Yes
Finance,36,2,No,Yes
IT,23,1,No,Yes`;

// Global state
let appState = {
  dataset: { headers: [], rows: [] },
  currentText: '',
  cipherText: '',
  analysisResults: {},
  selectedLanguage: 'english'
};

// Utility functions
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'textContent') element.textContent = value;
    else if (key === 'innerHTML') element.innerHTML = value;
    else element.setAttribute(key, value);
  });
  
  children.forEach(child => {
    if (typeof child === 'string') element.appendChild(document.createTextNode(child));
    else element.appendChild(child);
  });
  
  return element;
}

function showProgress(message) {
  console.log(`Progress: ${message}`);
}

function showAlert(message, type = 'info') {
  const alertDiv = createElement('div', {
    class: `alert ${type}`,
    textContent: message
  });
  
  // Insert at the top of the current section
  const activeSection = $('.section-content.active');
  if (activeSection) {
    activeSection.insertBefore(alertDiv, activeSection.firstChild);
    setTimeout(() => alertDiv.remove(), 5000);
  }
}

// CSV parsing
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return { headers: [], rows: [] };
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj;
  });
  
  return { headers, rows };
}

// Collapsible sections
function initCollapsibleSections() {
  $$('.section-header').forEach(header => {
    header.addEventListener('click', () => {
      const section = header.dataset.section;
      const content = $(`#${section}-content`);
      const chevron = header.querySelector('.chevron');
      
      if (content.classList.contains('active')) {
        content.classList.remove('active');
        header.classList.remove('active');
      } else {
        // Close other sections
        $$('.section-content.active').forEach(sc => sc.classList.remove('active'));
        $$('.section-header.active').forEach(sh => sh.classList.remove('active'));
        
        // Open this section
        content.classList.add('active');
        header.classList.add('active');
      }
    });
  });
}

// Part A: Dataset Analysis
function initPartA() {
  const csvFile = $('#csvFile');
  const btnLoadSample = $('#btnLoadSample');
  const btnDownloadSample = $('#btnDownloadSample');
  const btnClearData = $('#btnClearData');
  const btnComputeUni = $('#btnComputeUni');
  const btnComputeBi = $('#btnComputeBi');
  
  if (!csvFile) return;
  
  csvFile.addEventListener('change', handleFileUpload);
  btnLoadSample.addEventListener('click', loadSampleData);
  btnDownloadSample.addEventListener('click', downloadSample);
  btnClearData.addEventListener('click', clearData);
  btnComputeUni.addEventListener('click', computeUnivariate);
  btnComputeBi.addEventListener('click', computeBivariate);
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  showProgress('Loading CSV file...');
  
  try {
    const text = await file.text();
    appState.dataset = parseCSV(text);
    updateDataStatus();
    showAlert('Dataset loaded successfully!', 'success');
  } catch (error) {
    showAlert('Error loading file: ' + error.message, 'alert');
  }
}

function loadSampleData() {
  showProgress('Loading sample dataset...');
  appState.dataset = parseCSV(SAMPLE_CSV);
  updateDataStatus();
  showAlert('Sample dataset loaded successfully!', 'success');
}

function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = createElement('a', { href: url, download: 'sample_dataset.csv' });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function clearData() {
  appState.dataset = { headers: [], rows: [] };
  updateDataStatus();
  $('#uniResults').innerHTML = '';
  $('#biResults').innerHTML = '';
  showAlert('Data cleared', 'success');
}

function updateDataStatus() {
  const statusDiv = $('#dataStatus');
  const varChecklist = $('#varChecklist');
  const biVarX = $('#biVarX');
  const biVarY = $('#biVarY');
  
  if (appState.dataset.rows.length === 0) {
    statusDiv.innerHTML = 'No data loaded';
    varChecklist.innerHTML = 'Load data first';
    $('#btnComputeUni').disabled = true;
    $('#btnComputeBi').disabled = true;
    return;
  }
  
  statusDiv.innerHTML = `
    <strong>Dataset loaded:</strong><br>
    • Rows: ${appState.dataset.rows.length}<br>
    • Variables: ${appState.dataset.headers.length}<br>
    • Variables: ${appState.dataset.headers.join(', ')}
  `;
  
  // Update variable checklist
  varChecklist.innerHTML = '';
  appState.dataset.headers.forEach(header => {
    const label = createElement('label', { class: 'block' }, [
      createElement('input', { type: 'checkbox', name: 'uni-var', value: header }),
      ` ${header}`
    ]);
    varChecklist.appendChild(label);
  });
  
  // Update bivariate selects
  const options = appState.dataset.headers.map(h => 
    createElement('option', { value: h, textContent: h })
  );
  
  biVarX.innerHTML = '<option value="">-- Select Variable --</option>';
  biVarY.innerHTML = '<option value="">-- Select Variable --</option>';
  
  options.forEach(opt => {
    biVarX.appendChild(opt.cloneNode(true));
    biVarY.appendChild(opt.cloneNode(true));
  });
  
  $('#btnComputeUni').disabled = false;
  $('#btnComputeBi').disabled = false;
}

function computeUnivariate() {
  const selectedVars = Array.from($$('input[name="uni-var"]:checked')).map(input => input.value);
  
  if (selectedVars.length === 0 || selectedVars.length > 3) {
    showAlert('Please select 1-3 variables', 'alert');
    return;
  }
  
  showProgress(`Computing univariate distributions for: ${selectedVars.join(', ')}`);
  
  const resultsDiv = $('#uniResults');
  resultsDiv.innerHTML = '';
  
  selectedVars.forEach((variable, index) => {
    const frequencies = computeFrequency(variable);
    renderUnivariateResult(variable, frequencies, index + 1);
  });
  
  showAlert('Univariate analysis completed!', 'success');
}

function computeFrequency(variable) {
  const values = appState.dataset.rows.map(row => row[variable] || '(empty)');
  const frequency = {};
  
  values.forEach(value => {
    frequency[value] = (frequency[value] || 0) + 1;
  });
  
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({
      value,
      count,
      percentage: ((count / values.length) * 100).toFixed(1)
    }));
}

function renderUnivariateResult(variable, frequencies, index) {
  const container = createElement('div', { class: 'result-box' });
  
  const title = createElement('h4', {
    innerHTML: `Distribution ${index}: <span style="color: #18e0e6">${variable}</span>`
  });
  
  const explanation = createElement('div', {
    class: 'explanation',
    innerHTML: `This shows how frequently each value of "<strong>${variable}</strong>" appears in the dataset. The most common value is "<strong>${frequencies[0].value}</strong>" appearing ${frequencies[0].count} times (${frequencies[0].percentage}%).`
  });
  
  const visualization = createElement('div', { class: 'visualization-container' });
  
  // Data table
  const tableContainer = createElement('div', { class: 'data-table' });
  const table = createElement('table');
  const
