import {
  remove,
  newSession,
  getAvailableModels,
  U2NetClothSegSession,
  canvasTools,
  rembgConfig,
} from 'rembg-web';

// Enable logging for demo
rembgConfig.enableGeneralLogging(true);
rembgConfig.enablePerformanceLogging(true);
import JSZip from 'jszip';

// Get DOM elements
const runAllTestsBtn = document.getElementById(
  'runAllTestsBtn'
) as HTMLButtonElement;
const downloadBtn = document.getElementById('downloadBtn') as HTMLButtonElement;
const loading = document.getElementById('loading') as HTMLDivElement;
const progressText = document.getElementById('progressText') as HTMLDivElement;
const progressBar = document.getElementById('progressBar') as HTMLDivElement;
const modelsProgress = document.getElementById(
  'modelsProgress'
) as HTMLDivElement;
const error = document.getElementById('error') as HTMLDivElement;
const results = document.getElementById('results') as HTMLDivElement;
const resultsContainer = document.getElementById(
  'resultsContainer'
) as HTMLDivElement;

// Test images configuration
const testImages = [
  { name: 'anime-girl-1', displayName: 'Anime Girl' },
  { name: 'car-1', displayName: 'Car' },
  { name: 'cloth-1', displayName: 'Cloth' },
  { name: 'plants-1', displayName: 'Plants' },
];

// Results storage
const resultsData = new Map<
  string,
  Map<string, { original: Blob; calculated: Blob; expected: Blob }>
>();

// Show/hide loading state
function setLoading(isLoading: boolean, message: string = 'Processing...') {
  loading.classList.toggle('active', isLoading);
  runAllTestsBtn.disabled = isLoading;
  runAllTestsBtn.textContent = isLoading ? 'Processing...' : 'Run All Tests';
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

// Show results
function showResults() {
  results.classList.add('active');
}

// Hide results
function hideResults() {
  results.classList.remove('active');
}

// Update progress bar
function updateProgress(current: number, total: number) {
  const percentage = (current / total) * 100;
  progressBar.style.width = `${percentage}%`;
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

// Process test image with cloth category (special handling for u2net_cloth_seg)
async function processTestImageWithClothCategory(
  testImage: (typeof testImages)[0],
  modelName: string,
  session: U2NetClothSegSession
): Promise<Blob> {
  session.setClothCategory('all');

  // Fetch the test image
  const response = await fetch(`/fixtures/${testImage.name}.jpg`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${testImage.name}: ${response.statusText}`
    );
  }

  const imageBlob = await response.blob();
  const image = await canvasTools.fileToImage(imageBlob);
  const canvas = canvasTools.imageToCanvas(image);
  const masks = await session.predict(canvas);
  const canvases: HTMLCanvasElement[] = [];

  for (let mask of masks) {
    mask = canvasTools.postProcessMask(mask);
    const image = await canvasTools.fileToImage(imageBlob);
    const canvas = canvasTools.imageToCanvas(image);
    canvases.push(canvasTools.naiveCutout(canvas, mask));
  }

  // Merge canvases vertically into one
  if (canvases.length === 0) throw new Error('No cutouts to merge');

  // Assuming all canvases are the same width/height
  const width = canvases[0].width;
  const height = canvases[0].height;
  const mergedCanvas = document.createElement('canvas');
  mergedCanvas.width = width;
  mergedCanvas.height = height * canvases.length;
  const ctx = mergedCanvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get merged canvas context');

  for (let i = 0; i < canvases.length; i++) {
    ctx.drawImage(canvases[i], 0, i * height, width, height);
  }

  // Convert merged canvas to Blob (PNG)
  return await new Promise<Blob>((resolve, reject) => {
    mergedCanvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to convert merged canvas to Blob'));
    }, 'image/png');
  });
}

// Process a single test image
async function processTestImage(
  testImage: (typeof testImages)[0],
  modelName: string,
  session: any
): Promise<Blob> {
  try {
    if (modelName === 'u2net_cloth_seg') {
      return await processTestImageWithClothCategory(
        testImage,
        modelName,
        session
      );
    }

    // Fetch the test image
    const response = await fetch(`/fixtures/${testImage.name}.jpg`);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${testImage.name}: ${response.statusText}`
      );
    }

    const imageBlob = await response.blob();

    // Process with the selected model
    const processedBlob = await remove(imageBlob, {
      session: session,
      postProcessMask: true,
    });

    return processedBlob;
  } catch (err) {
    console.error(`Error processing ${testImage.name}:`, err);
    throw new Error(
      `Failed to process ${testImage.name}: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
}

// Fetch expected result image
async function fetchExpectedResult(
  testImage: (typeof testImages)[0],
  modelName: string
): Promise<Blob> {
  const response = await fetch(
    `/source-results/${testImage.name}.${modelName}.png`
  );
  if (!response.ok) {
    throw new Error(
      `Failed to fetch expected result for ${testImage.name}.${modelName}: ${response.statusText}`
    );
  }
  return response.blob();
}

// Create test row HTML
function createTestRow(
  testImage: (typeof testImages)[0],
  modelName: string,
  calculatedUrl: string
): string {
  const imageName = testImage.name;
  const displayName = testImage.displayName;

  return `
    <div class="test-row">
      <div class="test-image-name">${displayName}</div>
      <div class="image-comparison">
        <div class="image-box original">
          <h4>Original</h4>
          <img src="/fixtures/${imageName}.jpg" alt="Original ${displayName}" />
        </div>
        <div class="image-box calculated">
          <h4>Calculated</h4>
          <img src="${calculatedUrl}" alt="Calculated ${displayName}" />
        </div>
        <div class="image-box expected">
          <h4>Expected</h4>
          <img src="/source-results/${imageName}.${modelName}.png" alt="Expected ${displayName}" />
        </div>
      </div>
    </div>
  `;
}

// Create model section HTML
function createModelSection(
  modelName: string,
  modelResults: Map<
    string,
    { original: Blob; calculated: Blob; expected: Blob }
  >
): string {
  const displayName = modelName
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  const testRows = Array.from(modelResults.entries())
    .map(([imageName, results]) => {
      const testImage = testImages.find(img => img.name === imageName);
      if (!testImage) return '';

      const calculatedUrl = URL.createObjectURL(results.calculated);
      return createTestRow(testImage, modelName, calculatedUrl);
    })
    .join('');

  return `
    <div class="model-section">
      <h3>${displayName}</h3>
      <div class="test-grid">
        ${testRows}
      </div>
    </div>
  `;
}

// Run all model tests
async function runAllModelTests() {
  try {
    hideError();
    hideResults();
    setLoading(true, 'Initializing...');

    // Clear previous results
    resultsData.clear();

    // Get available models
    const availableModels = getAvailableModels().filter(
      name => name !== 'u2net_custom'
    );
    console.log('Available models:', availableModels);

    // Initialize progress UI
    modelsProgress.innerHTML = '';
    availableModels.forEach(modelName => {
      modelsProgress.appendChild(createModelProgressItem(modelName));
    });

    const totalOperations = availableModels.length * testImages.length;
    let currentOperation = 0;

    // Process each model
    for (
      let modelIndex = 0;
      modelIndex < availableModels.length;
      modelIndex++
    ) {
      const modelName = availableModels[modelIndex];
      const displayName = modelName
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());

      updateModelProgress(modelName, 'processing');
      setLoading(true, `Loading ${displayName} model...`);

      console.log(`Starting test for model: ${modelName}`);

      // Create session for the model
      const session = newSession(modelName);
      const modelResults = new Map<
        string,
        { original: Blob; calculated: Blob; expected: Blob }
      >();

      // Process each test image for this model
      for (let imageIndex = 0; imageIndex < testImages.length; imageIndex++) {
        const testImage = testImages[imageIndex];

        setLoading(
          true,
          `Processing ${testImage.displayName} with ${displayName} (${imageIndex + 1}/${testImages.length})...`
        );

        console.log(`Processing ${testImage.name} with ${modelName}`);

        try {
          // Fetch original image
          const originalResponse = await fetch(
            `/fixtures/${testImage.name}.jpg`
          );
          if (!originalResponse.ok) {
            throw new Error(
              `Failed to fetch original ${testImage.name}: ${originalResponse.statusText}`
            );
          }
          const originalBlob = await originalResponse.blob();

          // Process the image
          const calculatedBlob = await processTestImage(
            testImage,
            modelName,
            session
          );

          // Fetch expected result
          const expectedBlob = await fetchExpectedResult(testImage, modelName);

          // Store results
          modelResults.set(testImage.name, {
            original: originalBlob,
            calculated: calculatedBlob,
            expected: expectedBlob,
          });

          console.log(`Completed ${testImage.name} with ${modelName}`);
        } catch (err) {
          console.error(
            `Failed to process ${testImage.name} with ${modelName}:`,
            err
          );
          // Continue with other images even if one fails
        }

        currentOperation++;
        updateProgress(currentOperation, totalOperations);
      }

      // Store model results
      resultsData.set(modelName, modelResults);

      // Clean up session
      await session.dispose();

      updateModelProgress(modelName, 'completed');
      console.log(`Completed all tests for ${modelName}`);
    }

    // Display results
    setLoading(false);
    displayResults();
    downloadBtn.disabled = false;
    console.log('All model tests completed successfully!');
  } catch (err) {
    console.error('Error in all model tests:', err);
    showError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    setLoading(false);
  }
}

// Display results in UI
function displayResults() {
  resultsContainer.innerHTML = '';

  for (const [modelName, modelResults] of resultsData.entries()) {
    const modelSection = createModelSection(modelName, modelResults);
    resultsContainer.insertAdjacentHTML('beforeend', modelSection);
  }

  showResults();
}

// Generate and download ZIP file
async function downloadResults() {
  try {
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Generating ZIP...';

    const zip = new JSZip();

    // Add each model's results to the ZIP
    for (const [modelName, modelResults] of resultsData.entries()) {
      const modelFolder = zip.folder(modelName);
      if (!modelFolder) continue;

      // Add each test image's results to the model folder
      for (const [imageName, results] of modelResults.entries()) {
        modelFolder.file(`${imageName}-original.jpg`, results.original);
        modelFolder.file(`${imageName}-calculated.png`, results.calculated);
        modelFolder.file(`${imageName}-expected.png`, results.expected);
      }
    }

    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    // Create download link
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rembg-test-results-${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    downloadBtn.textContent = 'Download Results as ZIP';
    downloadBtn.disabled = false;

    console.log('ZIP file generated and downloaded successfully!');
  } catch (err) {
    console.error('Error generating ZIP:', err);
    showError(
      `Error generating ZIP: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
    downloadBtn.textContent = 'Download Results as ZIP';
    downloadBtn.disabled = false;
  }
}

// Initialize the page
function initialize() {
  console.log('All models test page initialized');

  // Verify available models
  const availableModels = getAvailableModels();
  console.log('Available models:', availableModels);

  // Add event listeners
  runAllTestsBtn.addEventListener('click', runAllModelTests);
  downloadBtn.addEventListener('click', downloadResults);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);
