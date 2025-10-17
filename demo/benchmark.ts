import {
  remove,
  newSession,
  isWebNNAvailable,
  getWebNNInfo,
  logWebNNInfo,
  isWebGPUAvailable,
  getWebGPUInfo,
  logWebGPUInfo,
  canvasTools,
  rembgConfig,
  enableONNXProfiling,
} from 'rembg-web';

// Enable logging for demo
rembgConfig.enableGeneralLogging(true);
rembgConfig.enablePerformanceLogging(true);
import { SessionOptions } from 'rembg-web/sessions/base';

// Get DOM elements
const modelSelect = document.getElementById('modelSelect') as HTMLSelectElement;
const testModeRadios = document.getElementsByName(
  'testMode'
) as NodeListOf<HTMLInputElement>;
const testImageRadios = document.getElementsByName(
  'testImage'
) as NodeListOf<HTMLInputElement>;
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const customImageGroup = document.getElementById(
  'customImageGroup'
) as HTMLDivElement;
const iterationSlider = document.getElementById(
  'iterationSlider'
) as HTMLInputElement;
const iterationValue = document.getElementById(
  'iterationValue'
) as HTMLSpanElement;
const enableWebNNCB = document.getElementById(
  'enableWebNN'
) as HTMLInputElement;
const enableWebGPUCB = document.getElementById(
  'enableWebGPU'
) as HTMLInputElement;
const onnxProfilingCB = document.getElementById(
  'onnxProfiling'
) as HTMLInputElement;
const deviceTypeSelect = document.getElementById(
  'deviceType'
) as HTMLSelectElement;
const powerPreferenceSelect = document.getElementById(
  'powerPreference'
) as HTMLSelectElement;
const gpuPowerPreferenceSelect = document.getElementById(
  'gpuPowerPreference'
) as HTMLSelectElement;
const webnnOptions = document.getElementById('webnnOptions') as HTMLDivElement;
const webnnPowerOptions = document.getElementById(
  'webnnPowerOptions'
) as HTMLDivElement;
const webgpuOptions = document.getElementById(
  'webgpuOptions'
) as HTMLDivElement;
const runBenchmarkBtn = document.getElementById(
  'runBenchmarkBtn'
) as HTMLButtonElement;
const clearResultsBtn = document.getElementById(
  'clearResultsBtn'
) as HTMLButtonElement;
const loading = document.getElementById('loading') as HTMLDivElement;
const error = document.getElementById('error') as HTMLDivElement;
const testImg = document.getElementById('testImg') as HTMLImageElement;
const resultImageBox = document.getElementById(
  'resultImageBox'
) as HTMLDivElement;
const resultImg = document.getElementById('resultImg') as HTMLImageElement;
const results = document.getElementById('results') as HTMLDivElement;
const resultsGrid = document.getElementById('resultsGrid') as HTMLDivElement;
const downloadResultsBtn = document.getElementById(
  'downloadResultsBtn'
) as HTMLButtonElement;
const statusPanel = document.getElementById('statusPanel') as HTMLDivElement;
const webnnStatus = document.getElementById('webnnStatus') as HTMLSpanElement;
const webgpuStatus = document.getElementById('webgpuStatus') as HTMLSpanElement;
const supportedDevices = document.getElementById(
  'supportedDevices'
) as HTMLSpanElement;
const browserInfo = document.getElementById('browserInfo') as HTMLSpanElement;
const progressText = document.getElementById('progressText') as HTMLDivElement;

// Benchmark results storage
let benchmarkResults: {
  model: string;
  testMode: string;
  acceleration: boolean;
  deviceType?: string;
  powerPreference?: string;
  iterations: number;
  initializationTime: number;
  runTimes: number[];
  averageTime: number;
  minTime: number;
  maxTime: number;
  totalTime: number;
  timestamp: string;
} | null = null;

// Initialize WebNN and WebGPU status
async function initializeAccelerationStatus() {
  try {
    // Initialize WebNN status
    const webnnInfo = await getWebNNInfo();
    webnnStatus.textContent = webnnInfo.available
      ? 'Available'
      : 'Not Available';
    webnnStatus.className = `status-value ${webnnInfo.available ? 'available' : 'unavailable'}`;

    // Initialize WebGPU status
    const webgpuInfo = await getWebGPUInfo();
    webgpuStatus.textContent = webgpuInfo.available
      ? 'Available'
      : 'Not Available';
    webgpuStatus.className = `status-value ${webgpuInfo.available ? 'available' : 'unavailable'}`;

    // Update supported devices display
    const devices = [];
    if (webnnInfo.available) {
      devices.push(`WebNN: ${webnnInfo.supportedDevices.join(', ') || 'None'}`);
    }
    if (webgpuInfo.available) {
      devices.push('WebGPU: Available');
    }
    if (devices.length === 0) {
      devices.push('None');
    }
    supportedDevices.textContent = devices.join(' | ');
    supportedDevices.className = 'status-value';

    browserInfo.textContent = webnnInfo.userAgent
      .split(' ')
      .slice(-2)
      .join(' ');
    browserInfo.className = 'status-value';

    // Enable checkboxes if available
    enableWebNNCB.disabled = !webnnInfo.available;
    if (!webnnInfo.available) {
      enableWebNNCB.checked = false;
      webnnOptions.style.display = 'none';
      webnnPowerOptions.style.display = 'none';
    }

    enableWebGPUCB.disabled = true; // Always disabled since WebGPU doesn't work properly
    enableWebGPUCB.checked = false;
    webgpuOptions.style.display = 'none';

    // Log info to console
    await logWebNNInfo();
    await logWebGPUInfo();
  } catch (err) {
    console.error('Failed to get acceleration info:', err);
    webnnStatus.textContent = 'Error';
    webnnStatus.className = 'status-value unavailable';
    webgpuStatus.textContent = 'Error';
    webgpuStatus.className = 'status-value unavailable';
  }
}

// Show/hide WebNN options
function toggleWebNNOptions() {
  const show = enableWebNNCB.checked && !enableWebNNCB.disabled;
  webnnOptions.style.display = show ? 'block' : 'none';
  webnnPowerOptions.style.display = show ? 'block' : 'none';
}

// Show/hide WebGPU options
function toggleWebGPUOptions() {
  const show = enableWebGPUCB.checked && !enableWebGPUCB.disabled;
  webgpuOptions.style.display = show ? 'block' : 'none';
}

// Show/hide custom image upload
function toggleCustomImageUpload() {
  const isCustom =
    Array.from(testImageRadios).find(radio => radio.checked)?.value ===
    'custom';
  customImageGroup.style.display = isCustom ? 'block' : 'none';
}

// Update iteration slider value display
function updateIterationValue() {
  iterationValue.textContent = iterationSlider.value;
}

// Show/hide loading state
function setLoading(isLoading: boolean, message: string = 'Processing...') {
  loading.classList.toggle('active', isLoading);
  runBenchmarkBtn.disabled = isLoading;
  clearResultsBtn.disabled = isLoading;
  runBenchmarkBtn.textContent = isLoading ? 'Running...' : 'Run Benchmark';
  progressText.textContent = message;
}

// Show error message
function showError(message: string) {
  error.textContent = message;
  error.classList.add('active');
}

// Hide error message
function hideError() {
  error.classList.remove('active');
}

// Get selected test image
async function getTestImage(): Promise<File | HTMLImageElement> {
  const selectedImage = Array.from(testImageRadios).find(
    radio => radio.checked
  )?.value;

  if (selectedImage === 'custom') {
    const file = fileInput.files?.[0];
    if (!file) {
      throw new Error('Please select a custom image file.');
    }
    return file;
  } else {
    // Load pre-existing test image
    const image = new Image();
    image.crossOrigin = 'anonymous';
    return new Promise((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = () =>
        reject(new Error(`Failed to load test image: ${selectedImage}`));
      image.src = `/fixtures/${selectedImage}`;
    });
  }
}

// Update test image preview
async function updateTestImagePreview() {
  try {
    const image = await getTestImage();

    if (image instanceof File) {
      const url = URL.createObjectURL(image);
      testImg.src = url;
    } else {
      testImg.src = image.src;
    }
  } catch (err) {
    console.error('Failed to update test image preview:', err);
  }
}

// Run the benchmark
async function runBenchmark() {
  try {
    setLoading(true, 'Preparing benchmark...');
    hideError();

    // Get configuration
    const modelName = modelSelect.value;
    const testMode =
      Array.from(testModeRadios).find(radio => radio.checked)?.value ||
      'predict';
    const iterations = parseInt(iterationSlider.value);
    const acceleration = enableWebNNCB.checked;
    const deviceType = deviceTypeSelect.value as 'cpu' | 'gpu' | 'npu';
    const powerPreference = powerPreferenceSelect.value as
      | 'default'
      | 'low-power'
      | 'high-performance';

    // Get test image
    setLoading(true, 'Loading test image...');
    const testImage = await getTestImage();

    // Create session options
    const sessionOptions: SessionOptions = {
      preferWebNN: enableWebNNCB.checked,
      webnnDeviceType: enableWebNNCB.checked ? deviceType : undefined,
      webnnPowerPreference: enableWebNNCB.checked ? powerPreference : undefined,
      preferWebGPU: enableWebGPUCB.checked,
      webgpuPowerPreference: enableWebGPUCB.checked
        ? (gpuPowerPreferenceSelect.value as
            | 'default'
            | 'low-power'
            | 'high-performance')
        : undefined,
      onProgress: (info: any) => {
        setLoading(true, `${info.message} (${info.progress}%)`);
      },
    };

    console.log('sessionOptions', sessionOptions);
    // Initialize session and measure initialization time
    setLoading(true, 'Initializing model...');
    const initStart = performance.now();
    const session = await newSession(modelName, undefined, sessionOptions);
    await session.initialize();
    const initTime = performance.now() - initStart;

    // Prepare image for prediction
    let imageCanvas: HTMLCanvasElement;
    if (testImage instanceof File) {
      const image = await canvasTools.fileToImage(testImage);
      imageCanvas = canvasTools.imageToCanvas(image);
    } else {
      imageCanvas = canvasTools.imageToCanvas(testImage);
    }

    // Run benchmark iterations
    const runTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      setLoading(true, `Running iteration ${i + 1}/${iterations}...`);

      const start = performance.now();

      if (testMode === 'predict') {
        // Test only prediction
        await session.predict(imageCanvas);
      } else {
        await remove(imageCanvas, { session });
      }

      const end = performance.now();
      runTimes.push(end - start);
    }

    // Calculate statistics
    const averageTime =
      runTimes.reduce((sum, time) => sum + time, 0) / runTimes.length;
    const minTime = Math.min(...runTimes);
    const maxTime = Math.max(...runTimes);
    const totalTime = runTimes.reduce((sum, time) => sum + time, 0);

    // Store results
    benchmarkResults = {
      model: modelName,
      testMode,
      acceleration,
      deviceType: acceleration ? deviceType : undefined,
      powerPreference: acceleration ? powerPreference : undefined,
      iterations,
      initializationTime: initTime,
      runTimes,
      averageTime,
      minTime,
      maxTime,
      totalTime,
      timestamp: new Date().toISOString(),
    };

    // Display results
    displayResults();

    // Show result preview for full remove mode
    if (testMode === 'remove') {
      setLoading(true, 'Generating result preview...');

      const resultBlob = await remove(testImage, { session });
      const resultUrl = URL.createObjectURL(resultBlob);
      resultImg.src = resultUrl;
      resultImageBox.style.display = 'block';
    } else {
      resultImageBox.style.display = 'none';
    }

    console.log('Benchmark completed:', benchmarkResults);
  } catch (err) {
    console.error('Benchmark failed:', err);
    showError(
      `Benchmark failed: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  } finally {
    setLoading(false);
  }
}

// Display benchmark results
function displayResults() {
  if (!benchmarkResults) return;

  const {
    model,
    testMode,
    acceleration,
    deviceType,
    powerPreference,
    iterations,
    initializationTime,
    averageTime,
    minTime,
    maxTime,
    totalTime,
  } = benchmarkResults;

  // Create results grid
  resultsGrid.innerHTML = `
    <div class="result-metric">
      <div class="label">Model</div>
      <div class="value">${model}</div>
    </div>
    <div class="result-metric">
      <div class="label">Test Mode</div>
      <div class="value">${testMode === 'predict' ? 'Predict Only' : 'Full Remove'}</div>
    </div>
    <div class="result-metric">
      <div class="label">Acceleration</div>
      <div class="value">${acceleration ? 'WebNN' : 'Standard'}</div>
    </div>
    ${
      acceleration
        ? `
    <div class="result-metric">
      <div class="label">Device Type</div>
      <div class="value">${deviceType?.toUpperCase()}</div>
    </div>
    <div class="result-metric">
      <div class="label">Power Preference</div>
      <div class="value">${powerPreference}</div>
    </div>
    `
        : ''
    }
    <div class="result-metric">
      <div class="label">Iterations</div>
      <div class="value">${iterations}</div>
    </div>
    <div class="result-metric">
      <div class="label">Initialization Time</div>
      <div class="value">${initializationTime.toFixed(2)}ms</div>
    </div>
    <div class="result-metric">
      <div class="label">Average Runtime</div>
      <div class="value">${averageTime.toFixed(2)}ms</div>
    </div>
    <div class="result-metric">
      <div class="label">Min Time</div>
      <div class="value">${minTime.toFixed(2)}ms</div>
    </div>
    <div class="result-metric">
      <div class="label">Max Time</div>
      <div class="value">${maxTime.toFixed(2)}ms</div>
    </div>
    <div class="result-metric">
      <div class="label">Total Time</div>
      <div class="value">${totalTime.toFixed(2)}ms</div>
    </div>
  `;

  results.classList.add('active');
}

// Clear results
function clearResults() {
  benchmarkResults = null;
  results.classList.remove('active');
  resultImageBox.style.display = 'none';
  resultsGrid.innerHTML = '';
}

// Download results as JSON
function downloadResults() {
  if (!benchmarkResults) return;

  const dataStr = JSON.stringify(benchmarkResults, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `benchmark-results-${benchmarkResults.model}-${benchmarkResults.timestamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Initialize the page
function initialize() {
  console.log('Benchmark demo initialized');

  // Add event listeners
  runBenchmarkBtn.addEventListener('click', runBenchmark);
  clearResultsBtn.addEventListener('click', clearResults);
  downloadResultsBtn.addEventListener('click', downloadResults);
  enableWebNNCB.addEventListener('change', toggleWebNNOptions);
  enableWebGPUCB.addEventListener('change', toggleWebGPUOptions);
  onnxProfilingCB.addEventListener('change', e => {
    enableONNXProfiling((e.target as HTMLInputElement).checked);
  });
  iterationSlider.addEventListener('input', updateIterationValue);

  // Test image selection
  testImageRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      toggleCustomImageUpload();
      updateTestImagePreview();
    });
  });

  // File input change
  fileInput.addEventListener('change', () => {
    updateTestImagePreview();
  });

  // Initialize acceleration status and options
  initializeAccelerationStatus();
  toggleWebNNOptions();
  toggleWebGPUOptions();
  toggleCustomImageUpload();
  updateIterationValue();
  updateTestImagePreview();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);
