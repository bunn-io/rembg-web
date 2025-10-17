import { remove, rembgConfig, enableONNXProfiling } from 'rembg-web';

// Enable logging for demo
rembgConfig.enableGeneralLogging(true);
rembgConfig.enablePerformanceLogging(true);

// Get DOM elements
const processBtn = document.getElementById('processBtn') as HTMLButtonElement;
const loading = document.getElementById('loading') as HTMLDivElement;
const error = document.getElementById('error') as HTMLDivElement;
const originalImg = document.getElementById('originalImg') as HTMLImageElement;
const processedImg = document.getElementById(
  'processedImg'
) as HTMLImageElement;
const onnxProfilingCheckbox = document.getElementById(
  'onnxProfiling'
) as HTMLInputElement;

// Show/hide loading state
function setLoading(isLoading: boolean) {
  loading.style.display = isLoading ? 'block' : 'none';
  processBtn.disabled = isLoading;
  processBtn.textContent = isLoading ? 'Processing...' : 'Process Image';
}

// Show error message
function showError(message: string) {
  error.textContent = message;
  error.style.display = 'block';
}

// Hide error message
function hideError() {
  error.style.display = 'none';
}

// Process the image
async function processImage() {
  try {
    setLoading(true);
    hideError();

    console.log('Starting image processing...');

    // Fetch the test image
    const response = await fetch('/test-image.jpg');
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const imageBlob = await response.blob();
    console.log('Image fetched, size:', imageBlob.size);

    // Test if model is accessible
    console.log('Testing model accessibility...');
    try {
      const modelResponse = await fetch('/models/u2net.onnx');
      console.log('Model response status:', modelResponse.status);
      if (!modelResponse.ok) {
        throw new Error(
          `Model not accessible: ${modelResponse.status} ${modelResponse.statusText}`
        );
      }
      console.log('Model is accessible');
    } catch (modelError) {
      console.error('Model accessibility test failed:', modelError);
      throw new Error(`Model not accessible: ${modelError}`);
    }

    // Process the image with rembg-web
    console.log('Processing with rembg-web...');
    console.log('Image blob type:', imageBlob.type);
    console.log('Image blob size:', imageBlob.size);

    try {
      const processedBlob = await remove(imageBlob, {
        postProcessMask: true,
      });
      console.log('Processing complete, result size:', processedBlob.size);

      // Create object URL for the processed image
      const processedUrl = URL.createObjectURL(processedBlob);
      processedImg.src = processedUrl;

      console.log('Demo completed successfully!');
    } catch (removeError) {
      console.error('Error in remove function:', removeError);
      throw removeError;
    }
  } catch (err) {
    console.error('Error processing image:', err);
    showError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  } finally {
    setLoading(false);
  }
}

// Add click event listener to the process button
processBtn.addEventListener('click', processImage);

// Add event listener for ONNX profiling checkbox
if (onnxProfilingCheckbox) {
  onnxProfilingCheckbox.addEventListener('change', e => {
    enableONNXProfiling((e.target as HTMLInputElement).checked);
  });
}

// Auto-process on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('Demo page loaded, starting auto-processing...');
  processImage();
});
