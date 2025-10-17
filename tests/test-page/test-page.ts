/**
 * Test page initialization and library loading
 */

// Extend the global window object to include our test utilities and rembg

// Make this a module by adding an export
export {};

/**
 * Get query parameter value from URL
 */
function getQueryParam(param: string): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

/**
 * Get the selected model from query parameters
 */
function getSelectedModel(): string | null {
  return getQueryParam('model');
}

/**
 * If playground is true, we will not run the tests
 * tests can run scripts with the exposed rembg object
 *
 */
function playground() {
  return getQueryParam('playground');
}

async function testu2net(module: typeof import('rembg-web')) {
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Test timed out'));
    }, 120 * 1000);
    const testDiv = document.createElement('div');
    testDiv.className = 'test-images';
    document.getElementById('imageResults')!.appendChild(testDiv);
    const sourceImage = document.createElement('img');
    const expectedImage = document.createElement('img');
    expectedImage.src = '/results/u2net.png';
    sourceImage.src = '/test-image.jpg';
    sourceImage.onload = async () => {
      const processedImage = document.createElement('img');
      processedImage.id = 'u2net-processed';
      processedImage.src = URL.createObjectURL(
        await module.remove(sourceImage, {
          session: await module.newSession('u2net'),
        })
      );
      testDiv.appendChild(processedImage);
      clearTimeout(timeout);
      resolve(true);
    };
    testDiv.appendChild(sourceImage);
    sourceImage.id = 'u2net-source';
    testDiv.appendChild(expectedImage);
    expectedImage.id = 'u2net-expected';
  });
}

async function testu2netp(module: typeof import('rembg-web')) {
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Test timed out'));
    }, 120 * 1000);
    const testDiv = document.createElement('div');
    testDiv.className = 'test-images';
    document.getElementById('imageResults')!.appendChild(testDiv);
    const sourceImage = document.createElement('img');
    const expectedImage = document.createElement('img');
    expectedImage.src = '/results/u2netp.png';
    sourceImage.src = '/test-image.jpg';
    sourceImage.onload = async () => {
      const processedImage = document.createElement('img');
      processedImage.id = 'u2netp-processed';
      processedImage.src = URL.createObjectURL(
        await module.remove(sourceImage, {
          session: await module.newSession('u2netp'),
        })
      );
      testDiv.appendChild(processedImage);
      clearTimeout(timeout);
      resolve(true);
    };
    testDiv.appendChild(sourceImage);
    sourceImage.id = 'u2netp-source';
    testDiv.appendChild(expectedImage);
    expectedImage.id = 'u2netp-expected';
  });
}

async function testu2netHumanSeg(module: typeof import('rembg-web')) {
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Test timed out'));
    }, 120 * 1000);
    const testDiv = document.createElement('div');
    testDiv.className = 'test-images';
    document.getElementById('imageResults')!.appendChild(testDiv);
    const sourceImage = document.createElement('img');
    const expectedImage = document.createElement('img');
    expectedImage.src = '/results/u2net_human_seg.png';
    sourceImage.src = '/test-human.jpg';
    sourceImage.onload = async () => {
      const processedImage = document.createElement('img');
      processedImage.id = 'u2net_human_seg-processed';
      processedImage.src = URL.createObjectURL(
        await module.remove(sourceImage, {
          session: await module.newSession('u2net_human_seg'),
        })
      );
      testDiv.appendChild(processedImage);
      clearTimeout(timeout);
      resolve(true);
    };
    testDiv.appendChild(sourceImage);
    sourceImage.id = 'u2net_human_seg-source';
    testDiv.appendChild(expectedImage);
    expectedImage.id = 'u2net_human_seg-expected';
  });
}

async function testu2netClothSeg(module: typeof import('rembg-web')) {
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Test timed out'));
    }, 120 * 1000);
    const testDiv = document.createElement('div');
    testDiv.className = 'test-images';
    document.getElementById('imageResults')!.appendChild(testDiv);
    const sourceImage = document.createElement('img');
    const expectedImage = document.createElement('img');
    expectedImage.src = '/results/u2net_cloth_seg.png';
    sourceImage.src = '/test-human.jpg';
    sourceImage.onload = async () => {
      const processedImage = document.createElement('img');
      processedImage.id = 'u2net_cloth_seg-processed';
      processedImage.src = URL.createObjectURL(
        await module.remove(sourceImage, {
          session: await module.newSession('u2net_cloth_seg'),
        })
      );
      testDiv.appendChild(processedImage);
      clearTimeout(timeout);
      resolve(true);
    };
    testDiv.appendChild(sourceImage);
    sourceImage.id = 'u2net_cloth_seg-source';
    testDiv.appendChild(expectedImage);
    expectedImage.id = 'u2net_cloth_seg-expected';
  });
}

async function testu2netCustom(module: typeof import('rembg-web')) {
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Test timed out'));
    }, 120 * 1000);
    const testDiv = document.createElement('div');
    testDiv.className = 'test-images';
    document.getElementById('imageResults')!.appendChild(testDiv);
    const sourceImage = document.createElement('img');
    const expectedImage = document.createElement('img');
    expectedImage.src = '/results/u2net.png'; // Use u2net result as expected
    sourceImage.src = '/test-image.jpg';
    sourceImage.onload = async () => {
      const processedImage = document.createElement('img');
      processedImage.id = 'u2net_custom-processed';
      processedImage.src = URL.createObjectURL(
        await module.remove(sourceImage, {
          session: await module.newSession('u2net_custom', {
            modelPath: '/models/u2net.onnx', // Use existing u2net model as custom
            inputSize: [320, 320],
            mean: [0.485, 0.456, 0.406],
            std: [0.229, 0.224, 0.225],
            inputName: 'input.1',
          }),
        })
      );
      testDiv.appendChild(processedImage);
      clearTimeout(timeout);
      resolve(true);
    };
    testDiv.appendChild(sourceImage);
    sourceImage.id = 'u2net_custom-source';
    testDiv.appendChild(expectedImage);
    expectedImage.id = 'u2net_custom-expected';
  });
}

async function testIsNetGeneralUse(module: typeof import('rembg-web')) {
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Test timed out'));
    }, 180 * 1000); // Longer timeout for DIS model
    const testDiv = document.createElement('div');
    testDiv.className = 'test-images';
    document.getElementById('imageResults')!.appendChild(testDiv);
    const sourceImage = document.createElement('img');
    const expectedImage = document.createElement('img');
    expectedImage.src = '/results/isnet-general-use.png'; // Expected result
    sourceImage.src = '/test-image.jpg';
    sourceImage.onload = async () => {
      const processedImage = document.createElement('img');
      processedImage.id = 'isnet-general-use-processed';
      processedImage.src = URL.createObjectURL(
        await module.remove(sourceImage, {
          session: await module.newSession('isnet-general-use'),
        })
      );
      testDiv.appendChild(processedImage);
      clearTimeout(timeout);
      resolve(true);
    };
    testDiv.appendChild(sourceImage);
    sourceImage.id = 'isnet-general-use-source';
    testDiv.appendChild(expectedImage);
    expectedImage.id = 'isnet-general-use-expected';
  });
}

async function testIsNetAnime(module: typeof import('rembg-web')) {
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Test timed out'));
    }, 180 * 1000); // Longer timeout for DIS model
    const testDiv = document.createElement('div');
    testDiv.className = 'test-images';
    document.getElementById('imageResults')!.appendChild(testDiv);
    const sourceImage = document.createElement('img');
    const expectedImage = document.createElement('img');
    expectedImage.src = '/results/isnet-anime.png'; // Expected result
    sourceImage.src = '/test-anime.jpg';
    sourceImage.onload = async () => {
      const processedImage = document.createElement('img');
      processedImage.id = 'isnet-anime-processed';
      processedImage.src = URL.createObjectURL(
        await module.remove(sourceImage, {
          session: await module.newSession('isnet-anime'),
        })
      );
      testDiv.appendChild(processedImage);
      clearTimeout(timeout);
      resolve(true);
    };
    testDiv.appendChild(sourceImage);
    sourceImage.id = 'isnet-anime-source';
    testDiv.appendChild(expectedImage);
    expectedImage.id = 'isnet-anime-expected';
  });
}

async function testSilueta(module: typeof import('rembg-web')) {
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Test timed out'));
    }, 120 * 1000);
    const testDiv = document.createElement('div');
    testDiv.className = 'test-images';
    document.getElementById('imageResults')!.appendChild(testDiv);
    const sourceImage = document.createElement('img');
    const expectedImage = document.createElement('img');
    expectedImage.src = '/results/silueta.png';
    sourceImage.src = '/test-image.jpg';
    sourceImage.onload = async () => {
      const processedImage = document.createElement('img');
      processedImage.id = 'silueta-processed';
      processedImage.src = URL.createObjectURL(
        await module.remove(sourceImage, {
          session: await module.newSession('silueta'),
        })
      );
      testDiv.appendChild(processedImage);
      clearTimeout(timeout);
      resolve(true);
    };
    testDiv.appendChild(sourceImage);
    sourceImage.id = 'silueta-source';
    testDiv.appendChild(expectedImage);
    expectedImage.id = 'silueta-expected';
  });
}

import('rembg-web')
  .then(module => {
    window.rembg = module;
    console.log('Working');
    document.getElementById('status')!.textContent =
      'Library loaded successfully';

    if (playground()) {
      return;
    }

    // Log available models and selected model
    const models = module.getAvailableModels();
    const selectedModel = getSelectedModel();
    const modelInfo = selectedModel
      ? `<div class="status info">Testing Model: ${selectedModel}</div>`
      : '<div class="status info">Testing All Models</div>';

    document.getElementById('testResults')!.innerHTML = `
        <div class="status success">Available Models</div>
        <div>Found: ${models.join(', ')}</div>
        ${modelInfo}
      `;
    async function testAll() {
      const selectedModel = getSelectedModel();

      if (selectedModel) {
        // Run only the selected model test
        switch (selectedModel.toLowerCase()) {
          case 'u2net':
            await testu2net(module);
            break;
          case 'u2netp':
            await testu2netp(module);
            break;
          case 'u2net_human_seg':
            await testu2netHumanSeg(module);
            break;
          case 'u2net_cloth_seg':
            await testu2netClothSeg(module);
            break;
          case 'u2net_custom':
            await testu2netCustom(module);
            break;
          case 'isnet-general-use':
            await testIsNetGeneralUse(module);
            break;
          case 'isnet-anime':
            await testIsNetAnime(module);
            break;
          case 'silueta':
            await testSilueta(module);
            break;
          default:
            const status = document.createElement('div');
            status.className = 'status error';
            status.textContent = `Unknown model: ${selectedModel}. Available models: u2net, u2netp, u2net_human_seg, u2net_cloth_seg, u2net_custom, isnet-general-use, isnet-anime, silueta`;
            document.getElementById('status')!.appendChild(status);
            console.warn(
              `Unknown model: ${selectedModel}. Available models: u2net, u2netp, u2net_human_seg, u2net_cloth_seg, u2net_custom, isnet-general-use, isnet-anime, silueta`
            );
            // Fall back to running all tests
            await testu2net(module);
            await module.disposeAllSessions();
            await testu2netp(module);
            await module.disposeAllSessions();
            await testu2netHumanSeg(module);
            await module.disposeAllSessions();
            await testu2netClothSeg(module);
            await module.disposeAllSessions();
            await testu2netCustom(module);
            await module.disposeAllSessions();
            await testIsNetGeneralUse(module);
            await module.disposeAllSessions();
            await testIsNetAnime(module);
            await module.disposeAllSessions();
            await testSilueta(module);
            await module.disposeAllSessions();
        }
      } else {
        // No model specified, run all tests
        await testu2net(module);
        await module.disposeAllSessions();
        await testu2netp(module);
        await module.disposeAllSessions();
        await testu2netHumanSeg(module);
        await module.disposeAllSessions();
        await testu2netClothSeg(module);
        await module.disposeAllSessions();
        await testu2netCustom(module);
        await module.disposeAllSessions();
        await testIsNetGeneralUse(module);
        await module.disposeAllSessions();
        await testIsNetAnime(module);
        await module.disposeAllSessions();
        await testSilueta(module);
        await module.disposeAllSessions();
      }
    }
    testAll()
      .then(() => {
        const selectedModel = getSelectedModel();
        const successMessage = selectedModel
          ? `Test completed successfully for model: ${selectedModel}`
          : 'All tests completed successfully';
        document.getElementById('status')!.textContent = successMessage;
      })
      .catch(error => {
        const selectedModel = getSelectedModel();
        const errorMessage = selectedModel
          ? `Test failed for model: ${selectedModel}`
          : 'All tests completed with errors';
        document.getElementById('status')!.textContent = errorMessage;
        console.error('Test error:', error);
      });
  })
  .catch(error => {
    document.getElementById('status')!.textContent = `Failed to load library: ${
      (error as Error).message
    }`;
    document.getElementById('testResults')!.innerHTML = `
        <div class="status error">Failed to load library</div>
        <div>${(error as Error).message}</div>
      `;
    console.error('Library loading error:', error);
  });
