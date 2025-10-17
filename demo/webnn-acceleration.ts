import {
  remove,
  newSession,
  isWebNNAvailable,
  getWebNNInfo,
  logWebNNInfo,
  isWebGPUAvailable,
  getWebGPUInfo,
  logWebGPUInfo,
  rembgConfig,
  enableONNXProfiling,
} from 'rembg-web';

// Enable logging for demo
rembgConfig.enableGeneralLogging(true);
rembgConfig.enablePerformanceLogging(true);
import { SessionOptions } from 'rembg-web/sessions/base';

// Get DOM elements
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const modelSelect = document.getElementById('modelSelect') as HTMLSelectElement;
const enableWebNNCB = document.getElementById(
  'enableWebNN'
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
const enableWebGPUCB = document.getElementById(
  'enableWebGPU'
) as HTMLInputElement;
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
const processBtn = document.getElementById('processBtn') as HTMLButtonElement;
const benchmarkBtn = document.getElementById(
  'benchmarkBtn'
) as HTMLButtonElement;
const comparisonResults = document.getElementById(
  'comparisonResults'
) as HTMLDivElement;
const comparisonSummary = document.getElementById(
  'comparisonSummary'
) as HTMLDivElement;
const comparisonTable = document.getElementById(
  'comparisonTable'
) as HTMLDivElement;
const loading = document.getElementById('loading') as HTMLDivElement;
const error = document.getElementById('error') as HTMLDivElement;
const originalImg = document.getElementById('originalImg') as HTMLImageElement;
const processedImg = document.getElementById(
  'processedImg'
) as HTMLImageElement;
const statusPanel = document.getElementById('statusPanel') as HTMLDivElement;
const webnnStatus = document.getElementById('webnnStatus') as HTMLSpanElement;
const webgpuStatus = document.getElementById('webgpuStatus') as HTMLSpanElement;
const supportedDevices = document.getElementById(
  'supportedDevices'
) as HTMLSpanElement;
const browserInfo = document.getElementById('browserInfo') as HTMLSpanElement;
const performanceInfo = document.getElementById(
  'performanceInfo'
) as HTMLDivElement;
const executionProvider = document.getElementById(
  'executionProvider'
) as HTMLSpanElement;
const processingTime = document.getElementById(
  'processingTime'
) as HTMLSpanElement;
const modelLoadingTime = document.getElementById(
  'modelLoadingTime'
) as HTMLSpanElement;
const inferenceTime = document.getElementById(
  'inferenceTime'
) as HTMLSpanElement;
const progressText = document.getElementById('progressText') as HTMLDivElement;

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

// Show/hide loading state
function setLoading(isLoading: boolean, message: string = 'Processing...') {
  loading.classList.toggle('active', isLoading);
  processBtn.disabled = isLoading;
  benchmarkBtn.disabled = isLoading;
  processBtn.textContent = isLoading ? 'Processing...' : 'Process Image';
  benchmarkBtn.textContent = isLoading ? 'Processing...' : 'Compare';
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

// Update performance metrics
function updatePerformanceMetrics(metrics: {
  executionProvider?: string;
  processingTime?: number;
  modelLoadingTime?: number;
  inferenceTime?: number;
}) {
  executionProvider.textContent = metrics.executionProvider || '-';
  processingTime.textContent = metrics.processingTime
    ? `${metrics.processingTime}ms`
    : '-';
  modelLoadingTime.textContent = metrics.modelLoadingTime
    ? `${metrics.modelLoadingTime}ms`
    : '-';
  inferenceTime.textContent = metrics.inferenceTime
    ? `${metrics.inferenceTime}ms`
    : '-';
  performanceInfo.style.display = 'block';
}

// Display comparison results
function displayComparisonResults(
  results: Array<{
    name: string;
    time: number;
    success: boolean;
    error?: string;
  }>
) {
  const successfulResults = results.filter(r => r.success);
  const best =
    successfulResults.length > 0
      ? successfulResults.reduce((prev, current) =>
          prev.time < current.time ? prev : current
        )
      : null;

  // Update summary
  if (best) {
    comparisonSummary.textContent = `Best Performance: ${best.name} (${best.time}ms)`;
  } else {
    comparisonSummary.textContent = 'No successful results';
  }

  // Create table
  comparisonTable.innerHTML = `
    <div class="comparison-header">Provider</div>
    <div class="comparison-header">Time</div>
    <div class="comparison-header">Status</div>
  `;

  results.forEach(result => {
    const row = document.createElement('div');
    row.className = 'comparison-row';

    const provider = document.createElement('div');
    provider.className = 'comparison-provider';
    provider.textContent = result.name;

    const time = document.createElement('div');
    time.className = 'comparison-time';
    time.textContent = result.success ? `${result.time}ms` : '-';

    const status = document.createElement('div');
    status.className = `comparison-status ${result.success ? 'success' : 'error'}`;
    status.textContent = result.success ? 'Success' : 'Failed';

    // Highlight best result
    if (result.success && best && result.name === best.name) {
      provider.classList.add('comparison-best');
      time.classList.add('comparison-best');
      status.classList.add('comparison-best');
    }

    row.appendChild(provider);
    row.appendChild(time);
    row.appendChild(status);
    comparisonTable.appendChild(row);
  });

  comparisonResults.style.display = 'block';
}

// Process the image
async function processImage() {
  const file = fileInput.files?.[0];
  if (!file) {
    showError('Please select an image file first.');
    return;
  }

  try {
    setLoading(true, 'Initializing...');
    hideError();

    // Show original image
    const originalUrl = URL.createObjectURL(file);
    originalImg.src = originalUrl;

    const startTime = performance.now();
    let modelLoadingStart = 0;
    let inferenceStart = 0;

    // Create session with WebNN and WebGPU options
    const sessionOptions = {
      preferWebNN: enableWebNNCB.checked,
      webnnDeviceType: deviceTypeSelect.value as 'cpu' | 'gpu' | 'npu',
      webnnPowerPreference: powerPreferenceSelect.value as
        | 'default'
        | 'low-power'
        | 'high-performance',
      preferWebGPU: enableWebGPUCB.checked,
      webgpuPowerPreference: gpuPowerPreferenceSelect.value as
        | 'default'
        | 'low-power'
        | 'high-performance',
      onProgress: (info: any) => {
        setLoading(true, `${info.message} (${info.progress}%)`);

        if (info.step === 'downloading' && info.progress === 30) {
          modelLoadingStart = performance.now();
        } else if (info.step === 'processing' && info.progress === 40) {
          inferenceStart = performance.now();
        }
      },
    };

    const session = await newSession(
      modelSelect.value,
      undefined,
      sessionOptions
    );

    // Process the image
    const processedBlob = await remove(file, {
      session: session,
      postProcessMask: true,
    });

    const endTime = performance.now();
    const totalTime = Math.round(endTime - startTime);
    const modelLoadingTime = modelLoadingStart
      ? Math.round(inferenceStart - modelLoadingStart)
      : 0;
    const inferenceTime = inferenceStart
      ? Math.round(endTime - inferenceStart)
      : 0;

    // Show processed image
    const processedUrl = URL.createObjectURL(processedBlob);
    processedImg.src = processedUrl;

    // Update performance metrics
    const accelerationInfo = [];
    if (enableWebNNCB.checked) accelerationInfo.push('WebNN');
    if (enableWebGPUCB.checked) accelerationInfo.push('WebGPU');
    const accelerationText =
      accelerationInfo.length > 0 ? accelerationInfo.join(' + ') : 'CPU/WebGL';

    updatePerformanceMetrics({
      executionProvider: accelerationText,
      processingTime: totalTime,
      modelLoadingTime: modelLoadingTime,
      inferenceTime: inferenceTime,
    });

    // Clean up original URL
    URL.revokeObjectURL(originalUrl);
  } catch (err) {
    console.error('Error processing image:', err);
    showError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  } finally {
    setLoading(false);
  }
}

// Run benchmark comparing different execution providers
async function runBenchmark() {
  const file = fileInput.files?.[0];
  if (!file) {
    showError('Please select an image file first.');
    return;
  }

  try {
    setLoading(true, 'Running benchmark...');
    hideError();

    const results: Array<{
      name: string;
      time: number;
      success: boolean;
      error?: string;
    }> = [];
    const providers: { name: string; options: SessionOptions }[] = [
      { name: 'CPU Only', options: { executionProviders: ['cpu'] } },
      { name: 'WebGL', options: { executionProviders: ['webgl'] } },
      {
        name: 'WebGPU',
        options: { preferWebGPU: true },
      },
      {
        name: 'WebNN (GPU)',
        options: { preferWebNN: true, webnnDeviceType: 'gpu' },
      },
      {
        name: 'WebNN (CPU)',
        options: { preferWebNN: true, webnnDeviceType: 'cpu' },
      },
    ];

    for (const provider of providers) {
      try {
        setLoading(true, `Benchmarking ${provider.name}...`);

        const startTime = performance.now();
        const session = await newSession(
          modelSelect.value,
          undefined,
          provider.options
        );
        await remove(file, { session: session });
        const endTime = performance.now();

        results.push({
          name: provider.name,
          time: Math.round(endTime - startTime),
          success: true,
        });
      } catch (err) {
        results.push({
          name: provider.name,
          time: 0,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // Display benchmark results
    console.log('Benchmark Results:');
    results.forEach(result => {
      if (result.success) {
        console.log(`${result.name}: ${result.time}ms`);
      } else {
        console.log(`${result.name}: Failed - ${result.error}`);
      }
    });

    // Display results in the comparison section
    displayComparisonResults(results);
  } catch (err) {
    console.error('Error running benchmark:', err);
    showError(
      `Benchmark error: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  } finally {
    setLoading(false);
  }
}

// Initialize the page
function initialize() {
  console.log('WebNN acceleration demo initialized');

  // Add event listeners
  processBtn.addEventListener('click', processImage);
  benchmarkBtn.addEventListener('click', runBenchmark);
  enableWebNNCB.addEventListener('change', toggleWebNNOptions);
  enableWebGPUCB.addEventListener('change', toggleWebGPUOptions);
  onnxProfilingCB.addEventListener('change', e => {
    enableONNXProfiling((e.target as HTMLInputElement).checked);
  });

  fileInput.addEventListener('change', e => {
    if (e.target && (e.target as HTMLInputElement).files?.[0]) {
      hideError();
    }
  });

  // Initialize acceleration status and options
  initializeAccelerationStatus();
  toggleWebNNOptions();
  toggleWebGPUOptions();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);
