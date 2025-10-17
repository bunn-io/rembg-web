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
import { SessionOptions } from 'rembg-web/sessions/base';

// Enable logging for demo
rembgConfig.enableGeneralLogging(true);
rembgConfig.enablePerformanceLogging(true);

// Get DOM elements
const modelFileInput = document.getElementById(
  'modelFileInput'
) as HTMLInputElement;
const modelUrlInput = document.getElementById(
  'modelUrlInput'
) as HTMLInputElement;
const inputNameInput = document.getElementById(
  'inputNameInput'
) as HTMLInputElement;
const inputSizeInput = document.getElementById(
  'inputSizeInput'
) as HTMLInputElement;
const testImageInput = document.getElementById(
  'testImageInput'
) as HTMLInputElement;
const enableWebNNCB = document.getElementById(
  'enableWebNN'
) as HTMLInputElement;
const enableWebGPUCB = document.getElementById(
  'enableWebGPU'
) as HTMLInputElement;
const webnnDeviceTypeSelect = document.getElementById(
  'webnnDeviceType'
) as HTMLSelectElement;
const webnnPowerPreferenceSelect = document.getElementById(
  'webnnPowerPreference'
) as HTMLSelectElement;
const webgpuPowerPreferenceSelect = document.getElementById(
  'webgpuPowerPreference'
) as HTMLSelectElement;
const enableONNXProfilingCB = document.getElementById(
  'enableONNXProfiling'
) as HTMLInputElement;
const webnnOptions = document.getElementById('webnnOptions') as HTMLDivElement;
const webnnPowerOptions = document.getElementById(
  'webnnPowerOptions'
) as HTMLDivElement;
const webgpuOptions = document.getElementById(
  'webgpuOptions'
) as HTMLDivElement;
const processBtn = document.getElementById('processBtn') as HTMLButtonElement;
const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
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
const progressText = document.getElementById('progressText') as HTMLDivElement;

// State
let currentModelFile: File | null = null;
let currentTestImage: File | null = null;
let currentSession: any = null;

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

    enableWebGPUCB.disabled = !webgpuInfo.available;
    if (!webgpuInfo.available) {
      enableWebGPUCB.checked = false;
      webgpuOptions.style.display = 'none';
    }

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
  clearBtn.disabled = isLoading;
  processBtn.textContent = isLoading ? 'Processing...' : 'Process Image';
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

// Validate input size format
function parseInputSize(sizeStr: string): [number, number] {
  const parts = sizeStr.split(',').map(s => s.trim());
  if (parts.length !== 2) {
    throw new Error(
      'Input size must be in format "width,height" (e.g., "320,320")'
    );
  }
  const width = parseInt(parts[0]);
  const height = parseInt(parts[1]);
  if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
    throw new Error('Input size must contain positive numbers');
  }
  return [width, height];
}

// Get model path (from file or URL)
function getModelPath(): string {
  if (currentModelFile) {
    // Create object URL for uploaded file
    return URL.createObjectURL(currentModelFile);
  } else if (modelUrlInput.value.trim()) {
    return modelUrlInput.value.trim();
  } else {
    throw new Error('Please upload a model file or provide a model URL');
  }
}

// Create custom model configuration
function createCustomConfig() {
  const modelPath = getModelPath();
  const inputName = inputNameInput.value.trim() || 'input.1';
  const inputSize = parseInputSize(inputSizeInput.value);

  return {
    modelPath,
    inputName,
    inputSize,
  };
}

// Create session options
function createSessionOptions(): SessionOptions {
  return {
    preferWebNN: enableWebNNCB.checked,
    bypassModelCache: true,
    bypassSessionCache: true,
    webnnDeviceType: enableWebNNCB.checked
      ? (webnnDeviceTypeSelect.value as 'cpu' | 'gpu' | 'npu')
      : undefined,
    webnnPowerPreference: enableWebNNCB.checked
      ? (webnnPowerPreferenceSelect.value as
          | 'default'
          | 'low-power'
          | 'high-performance')
      : undefined,
    preferWebGPU: enableWebGPUCB.checked,
    webgpuPowerPreference: enableWebGPUCB.checked
      ? (webgpuPowerPreferenceSelect.value as
          | 'default'
          | 'low-power'
          | 'high-performance')
      : undefined,
    onProgress: (info: any) => {
      setLoading(true, `${info.message} (${info.progress}%)`);
    },
  };
}

// Update process button state
function updateProcessButton() {
  const hasModel = currentModelFile || modelUrlInput.value.trim();
  const hasImage = currentTestImage;
  processBtn.disabled = !hasModel || !hasImage;
}

// Handle model file selection
function handleModelFileSelect(file: File) {
  if (!file.name.toLowerCase().endsWith('.onnx')) {
    showError('Please select a valid ONNX model file (.onnx)');
    return;
  }

  currentModelFile = file;
  modelUrlInput.value = ''; // Clear URL input
  hideError();
  updateProcessButton();
  console.log('Model file selected:', file.name);
}

// Handle test image selection
function handleTestImageSelect(file: File) {
  if (!file.type.startsWith('image/')) {
    showError('Please select a valid image file');
    return;
  }

  currentTestImage = file;
  hideError();

  // Create preview
  const reader = new FileReader();
  reader.onload = e => {
    originalImg.src = e.target?.result as string;
    originalImg.style.display = 'block';
  };
  reader.readAsDataURL(file);

  updateProcessButton();
  console.log('Test image selected:', file.name);
}

// Process the image with custom model
async function processImage() {
  try {
    setLoading(true, 'Initializing custom model...');
    hideError();

    // Enable/disable ONNX profiling based on checkbox
    enableONNXProfiling(enableONNXProfilingCB.checked);
    console.log(
      'ONNX Profiling:',
      enableONNXProfilingCB.checked ? 'Enabled' : 'Disabled'
    );

    // Create configuration
    const config = createCustomConfig();
    const options = createSessionOptions();

    console.log('Custom model config:', config);
    console.log('Session options:', options);

    // Create session
    setLoading(true, 'Loading custom model...');
    currentSession = await newSession('u2net_custom', config, options);
    await currentSession.initialize();

    // Process the image
    setLoading(true, 'Processing image...');
    const processedBlob = await remove(currentTestImage!, {
      session: currentSession,
      postProcessMask: true,
    });

    // Display result
    const processedUrl = URL.createObjectURL(processedBlob);
    processedImg.src = processedUrl;
    processedImg.style.display = 'block';

    console.log('Image processing completed successfully!');
  } catch (err) {
    console.error('Error processing image:', err);
    showError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  } finally {
    setLoading(false);
  }
}

// Clear results
function clearResults() {
  // Clean up session
  if (currentSession) {
    currentSession.dispose().catch(console.error);
    currentSession = null;
  }

  // Clear images
  originalImg.src = '';
  originalImg.style.display = 'none';
  processedImg.src = '';
  processedImg.style.display = 'none';

  // Clear file inputs
  modelFileInput.value = '';
  modelUrlInput.value = '';
  testImageInput.value = '';
  currentModelFile = null;
  currentTestImage = null;

  // Reset to defaults
  inputNameInput.value = 'input.1';
  inputSizeInput.value = '320,320';

  hideError();
  updateProcessButton();
  console.log('Results cleared');
}

// Initialize the page
function initialize() {
  console.log('Custom model demo initialized');

  // Add event listeners
  modelFileInput.addEventListener('change', e => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      handleModelFileSelect(target.files[0]);
    }
  });

  modelUrlInput.addEventListener('input', () => {
    if (modelUrlInput.value.trim()) {
      currentModelFile = null; // Clear file selection
      modelFileInput.value = '';
    }
    updateProcessButton();
  });

  testImageInput.addEventListener('change', e => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      handleTestImageSelect(target.files[0]);
    }
  });

  enableWebNNCB.addEventListener('change', toggleWebNNOptions);
  enableWebGPUCB.addEventListener('change', toggleWebGPUOptions);

  processBtn.addEventListener('click', processImage);
  clearBtn.addEventListener('click', clearResults);

  // Initialize acceleration status and options
  initializeAccelerationStatus();
  toggleWebNNOptions();
  toggleWebGPUOptions();
  updateProcessButton();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);
