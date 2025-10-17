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

// Get DOM elements
const modelSelect = document.getElementById('modelSelect') as HTMLSelectElement;
const runTestBtn = document.getElementById('runTestBtn') as HTMLButtonElement;
const loading = document.getElementById('loading') as HTMLDivElement;
const progressText = document.getElementById('progressText') as HTMLDivElement;
const error = document.getElementById('error') as HTMLDivElement;
const results = document.getElementById('results') as HTMLDivElement;
const modelTitle = document.getElementById('modelTitle') as HTMLDivElement;
const testGrid = document.getElementById('testGrid') as HTMLDivElement;

// Test images configuration
const testImages = [
  { name: 'anime-girl-1', displayName: 'Anime Girl' },
  { name: 'car-1', displayName: 'Car' },
  { name: 'cloth-1', displayName: 'Cloth' },
  { name: 'plants-1', displayName: 'Plants' },
];

// Show/hide loading state
function setLoading(isLoading: boolean, message: string = 'Processing...') {
  loading.classList.toggle('active', isLoading);
  runTestBtn.disabled = isLoading;
  runTestBtn.textContent = isLoading ? 'Processing...' : 'Run Test';
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

// Create image element
function createImageElement(src: string, alt: string): HTMLImageElement {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.loading = 'lazy';
  return img;
}

// Create test row HTML
function createTestRow(
  testImage: (typeof testImages)[0],
  modelName: string
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
          <img id="calculated-${imageName}" alt="Calculated ${displayName}" />
        </div>
        <div class="image-box expected">
          <h4>Expected</h4>
          <img src="/source-results/${imageName}.${modelName}.png" alt="Expected ${displayName}" />
        </div>
      </div>
    </div>
  `;
}
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

// Run the model test
async function runModelTest() {
  try {
    const selectedModel = modelSelect.value;
    hideError();
    hideResults();
    setLoading(true, 'Initializing...');

    console.log(`Starting test for model: ${selectedModel}`);

    // Update model title
    const modelDisplayName =
      modelSelect.options[modelSelect.selectedIndex].text;
    modelTitle.textContent = `Results for ${modelDisplayName}`;

    // Create session for the selected model
    setLoading(true, 'Loading model...');
    const session = await newSession(selectedModel);

    // Create test grid HTML
    testGrid.innerHTML = testImages
      .map(testImage => createTestRow(testImage, selectedModel))
      .join('');

    // Process each test image sequentially
    for (let i = 0; i < testImages.length; i++) {
      const testImage = testImages[i];
      setLoading(
        true,
        `Processing ${testImage.displayName} (${i + 1}/${testImages.length})...`
      );

      console.log(`Processing ${testImage.name} with ${selectedModel}`);

      try {
        const processedBlob = await processTestImage(
          testImage,
          selectedModel,
          session
        );

        // Create object URL and set the calculated image
        const processedUrl = URL.createObjectURL(processedBlob);
        const calculatedImg = document.getElementById(
          `calculated-${testImage.name}`
        ) as HTMLImageElement;
        if (calculatedImg) {
          calculatedImg.src = processedUrl;
        }

        console.log(`Completed ${testImage.name}`);
      } catch (err) {
        console.error(`Failed to process ${testImage.name}:`, err);
        // Continue with other images even if one fails
        const calculatedImg = document.getElementById(
          `calculated-${testImage.name}`
        ) as HTMLImageElement;
        if (calculatedImg) {
          calculatedImg.src =
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yPC90ZXh0Pjwvc3ZnPg==';
          calculatedImg.alt = `Error processing ${testImage.displayName}`;
        }
      }
    }

    // Clean up session
    await session.dispose();

    setLoading(false);
    showResults();
    console.log('Model test completed successfully!');
  } catch (err) {
    console.error('Error in model test:', err);
    showError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    setLoading(false);
  }
}

// Initialize the page
function initialize() {
  console.log('Model test page initialized');

  // Verify available models
  const availableModels = getAvailableModels();
  console.log('Available models:', availableModels);

  // Add event listener to run test button
  runTestBtn.addEventListener('click', runModelTest);

  // Auto-run test on page load (optional)
  // runModelTest();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);
