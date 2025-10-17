import { remove, newSession, getAvailableModels, rembgConfig } from 'rembg-web';

// Enable logging for demo
rembgConfig.enableGeneralLogging(true);
rembgConfig.enablePerformanceLogging(true);

// Get DOM elements
const uploadArea = document.getElementById('uploadArea') as HTMLDivElement;
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const previewSection = document.getElementById(
  'previewSection'
) as HTMLDivElement;
const previewImage = document.getElementById(
  'previewImage'
) as HTMLImageElement;
const processBtn = document.getElementById('processBtn') as HTMLButtonElement;
const progressSection = document.getElementById(
  'progressSection'
) as HTMLDivElement;
const progressText = document.getElementById('progressText') as HTMLDivElement;
const progressBar = document.getElementById('progressBar') as HTMLDivElement;
const modelProgressList = document.getElementById(
  'modelProgressList'
) as HTMLDivElement;
const resultsSection = document.getElementById(
  'resultsSection'
) as HTMLDivElement;
const resultsGrid = document.getElementById('resultsGrid') as HTMLDivElement;
const error = document.getElementById('error') as HTMLDivElement;

// Available models
const availableModels = getAvailableModels();

// Current uploaded file
let currentFile: File | null = null;

// Show/hide sections
function showSection(section: HTMLElement) {
  section.classList.add('active');
}

function hideSection(section: HTMLElement) {
  section.classList.remove('active');
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

// Create model progress item
function createModelProgressItem(modelName: string): HTMLElement {
  const item = document.createElement('div');
  item.className = 'model-progress';
  item.id = `progress-${modelName}`;

  const displayName = modelName
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  item.innerHTML = `
    <span class="model-name">${displayName}</span>
    <span class="model-status pending">Pending</span>
  `;

  return item;
}

// Update model progress status
function updateModelProgress(
  modelName: string,
  status: 'pending' | 'processing' | 'completed' | 'error'
) {
  const item = document.getElementById(`progress-${modelName}`);
  if (item) {
    const statusElement = item.querySelector('.model-status') as HTMLElement;
    statusElement.className = `model-status ${status}`;
    statusElement.textContent =
      status.charAt(0).toUpperCase() + status.slice(1);
  }
}

// Update overall progress
function updateProgress(current: number, total: number, message: string) {
  const percentage = (current / total) * 100;
  progressBar.style.width = `${percentage}%`;
  progressText.textContent = message;
}

// Create result card
function createResultCard(modelName: string, imageUrl: string): HTMLElement {
  const card = document.createElement('div');
  card.className = 'result-card';

  const displayName = modelName
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  card.innerHTML = `
    <h4>${displayName}</h4>
    <img src="${imageUrl}" alt="Result from ${displayName}" />
  `;

  return card;
}

// Handle file selection
function handleFileSelect(file: File) {
  if (!file.type.startsWith('image/')) {
    showError('Please select a valid image file.');
    return;
  }

  currentFile = file;
  hideError();

  // Create preview
  const reader = new FileReader();
  reader.onload = e => {
    previewImage.src = e.target?.result as string;
    showSection(previewSection);
  };
  reader.readAsDataURL(file);

  // Hide other sections
  hideSection(progressSection);
  hideSection(resultsSection);
}

// Handle drag and drop
function handleDragOver(e: DragEvent) {
  e.preventDefault();
  uploadArea.classList.add('dragover');
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  uploadArea.classList.remove('dragover');

  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    handleFileSelect(files[0]);
  }
}

// Process image with all models
async function processWithAllModels() {
  if (!currentFile) {
    showError('No file selected.');
    return;
  }

  try {
    hideError();
    hideSection(previewSection);
    hideSection(resultsSection);
    showSection(progressSection);

    // Initialize progress
    modelProgressList.innerHTML = '';
    availableModels.forEach(modelName => {
      modelProgressList.appendChild(createModelProgressItem(modelName));
    });

    updateProgress(0, availableModels.length, 'Starting processing...');

    const results: { modelName: string; imageUrl: string }[] = [];

    // Process each model sequentially
    for (let i = 0; i < availableModels.length; i++) {
      const modelName = availableModels[i];
      const displayName = modelName
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());

      updateProgress(
        i,
        availableModels.length,
        `Processing with ${displayName} (${i + 1}/${availableModels.length})...`
      );
      updateModelProgress(modelName, 'processing');

      try {
        console.log(`Processing with ${modelName}...`);

        // Create session for this model
        const session = await newSession(modelName);

        // Process the image
        const processedBlob = await remove(currentFile, {
          session: session,
          postProcessMask: true,
        });

        // Create object URL for the result
        const imageUrl = URL.createObjectURL(processedBlob);
        results.push({ modelName, imageUrl });

        // Clean up session
        await session.dispose();

        updateModelProgress(modelName, 'completed');
        console.log(`Completed ${modelName}`);
      } catch (err) {
        console.error(`Error processing with ${modelName}:`, err);
        updateModelProgress(modelName, 'error');
        // Continue with other models even if one fails
      }
    }

    // Display results
    updateProgress(
      availableModels.length,
      availableModels.length,
      'Processing complete!'
    );

    // Clear and populate results grid
    resultsGrid.innerHTML = '';

    // Convert currentFile to data URL for display
    const originalDataUrl = currentFile ? URL.createObjectURL(currentFile) : '';
    resultsGrid.appendChild(createResultCard('Original', originalDataUrl));
    results.forEach(result => {
      const card = createResultCard(result.modelName, result.imageUrl);
      resultsGrid.appendChild(card);
    });

    // Show results section
    showSection(resultsSection);

    console.log('All processing completed!');
  } catch (err) {
    console.error('Error in processing:', err);
    showError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

// Initialize the page
function initialize() {
  console.log('User upload page initialized');
  console.log('Available models:', availableModels);

  // File input change handler
  fileInput.addEventListener('change', e => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      handleFileSelect(target.files[0]);
    }
  });

  // Drag and drop handlers
  uploadArea.addEventListener('dragover', handleDragOver);
  uploadArea.addEventListener('dragleave', handleDragLeave);
  uploadArea.addEventListener('drop', handleDrop);

  // Click to upload
  uploadArea.addEventListener('click', ev => {
    // ev.preventDefault();
    // ev.stopPropagation();
    // fileInput.click();
  });

  // Process button handler
  processBtn.addEventListener('click', processWithAllModels);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);
