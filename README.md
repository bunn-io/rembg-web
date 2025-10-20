# @bunnio/rembg-web

[![npm version](https://img.shields.io/npm/v/@bunnio/rembg-web?style=flat-square)](https://www.npmjs.com/package/@bunnio/rembg-web)
[![npm downloads](https://img.shields.io/npm/dm/@bunnio/rembg-web?style=flat-square)](https://www.npmjs.com/package/@bunnio/rembg-web)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@bunnio/rembg-web?style=flat-square)](https://bundlephobia.com/package/@bunnio/rembg-web)
[![GitHub stars](https://img.shields.io/github/stars/bunn-io/rembg-web?style=flat-square)](https://github.com/bunn-io/rembg-web)
[![License](https://img.shields.io/npm/l/@bunnio/rembg-web?style=flat-square)](https://github.com/bunn-io/rembg-web/blob/main/LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/bunn-io/rembg-web/ci.yml?style=flat-square)](https://github.com/bunn-io/rembg-web/actions)

> **Background Removal for the Web** - A TypeScript/JavaScript port of [danielgatis/rembg](https://github.com/danielgatis/rembg) designed to run directly in browsers using ONNX Runtime Web.

[📖 Documentation](https://bunn-io.github.io/rembg-web/) • [🎮 Examples](https://bunn-io.github.io/rembg-web/examples/) • [📦 npm](https://www.npmjs.com/package/@bunnio/rembg-web) • [🐛 Issues](https://github.com/bunn-io/rembg-web/issues)

## Start using in minutes

### Install in your project:

```bash
npm install @bunnio/rembg-web onnxruntime-web
# or
yarn add @bunnio/rembg-web onnxruntime-web
```

### Use embedded:

**ES Module:**

```html
<head>
  <!-- Load ONNX Runtime Web -->
  <script src="https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.0/dist/ort.min.js"></script>
</head>
<body>
  <script type="module">
    import {
      remove,
      rembgConfig,
    } from 'https://unpkg.com/@bunnio/rembg-web@latest/dist/index.js';

    // If you want to use the huggingface hosted model (only for dev)
    // Configure model base URL
    rembgConfig.setBaseUrl(
      'https://huggingface.co/bunnio/dis_anime/resolve/main'
    );

    // Basic usage
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    const result = await remove(file);
    const url = URL.createObjectURL(result);

    // Display result
    document.getElementById('result').src = url;
  </script>
</body>
```

**UMD:**

```html
<head>
  <!-- Make sure to load runtimes in the header, before the scripts is called -->
  <!-- Load ONNX Runtime Web -->
  <script src="https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.0/dist/ort.min.js"></script>
  <script src="https://unpkg.com/@bunnio/rembg-web@latest/dist/index.umd.min.js"></script>
</head>
<script>
  // If you want to use the huggingface hosted model (only for dev)
  // Configure model base URL
  rembgWeb.rembgConfig.setBaseUrl(
    'https://huggingface.co/bunnio/dis_anime/resolve/main'
  );

  // Basic usage
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];

  const result = await rembgWeb.remove(file);
  const url = URL.createObjectURL(result);

  // Display result
  document.getElementById('result').src = url;
</script>
```

## Live Preview:

> [More Examples!!](https://bunn-io.github.io/rembg-web/examples)

## Performance

> Tested on a @3.87Ghz (x5687), single core runtime (no threading), no webNN or webGPU (not that it would matter. see below)

<!-- prettier-ignore -->
| Model             | Anime Example (ms)  | Car Example (ms) | Human Example (ms) | Plant Example (ms)  |
| ----------------- | ------------        | --------------   | ------------------ | ------------------- |
| u2netp            | 1002.34             | 916.45ms         | 961.62ms           |  1005.66ms          |
| silueta           | 2060.13             | 2007.23ms        | 1940.59ms          |  1962.44ms          |
| u2net_human_seg   | 2534.33             | 2723.88ms        | 2706.10ms          |  2747.44ms          |
| u2net             | 2711.10             | 2621.96ms        | 2688.20ms          |  2521.23ms          |
| isnet-anime       | 7120.79             | 7054.62ms        | 6975.49ms          |  7641.50ms          |
| isnet-general-use | 7194.93             | 7064.19ms        | 7285.58ms          |  7667.17ms          |
| u2net_cloth_seg   | 15150.91            | 14794.81ms       | 14949.86ms         |  14931.25ms         |

> Results averaged over 20 "predict" runs

## Available Models

u2net models, silueta, DIS (isnet-general, isnet-anime)

## Not Planned

BiRefNet family

For some reason BiRefNet Simple had issues getting started with onyx-web, currently I don't plan on adding that.

I will probably try out the huggingface version, see if it's working

### Size issue

All other models have significant sizes, making it less feasable as a tool for web dev stuff.
If there's demand I can have a crack at it, feel free to create a feature request for it.

## CORS issue

Since these models are expected to run in the browser, might have cors issues

by default all models expect you to serve their appropriate onnx config file locally

- /models/u2net_cloth_seg.onnx
- /models/u2net_human_seg.onnx
- /models/u2net.onnx
- /models/u2netp.onnx
- /models/isnet-general-use.onnx
- /models/isnet-anime.onnx
- /models/silueta.onnx

...

## Big Testing meltdown

I spend 4 hours trying to understand why the tests initially weren't working, ultimately there was one takeaway

> webgl

The result quality is dependant on the webgl availability, so if you test it make sure that the flag is enabled (it is by default)

> see: playwright.config.ts

## ⚠️ Important: webNN

WebNN support is working, but on my personal testing, I saw no visible difference. This is because webNN still uses CPU.

If you want to checkout how it beahves on your device, you can use "benchmark" demo.

## ⚠️ Important: webGPU

WebGPU support is implemented and available, but currently none of the models are compatible with WebGPU execution providers in ONNX Runtime Web.

While WebGPU would provide significant performance improvements, the current model implementations require WebGL or CPU execution. WebGPU support is included for future compatibility as ONNX Runtime Web adds WebGPU support for these model types.

For now, use WebGL or CPU execution providers for optimal compatibility.

## ⚠️ Important: Custom Models

When using custom models, you have to manage model and session caching!

If you are not sure whether the last custom model was the same you are trying to use now, it's best to just disable caching (with flags).

You can use DataURL-s to store the file locally, and passed that to the sessionFactory.

---

# AI Generated Info Below

A web-based background removal library powered by AI models. This is a TypeScript/JavaScript port of the popular [rembg](https://github.com/danielgatis/rembg) Python library, designed to run directly in browsers using ONNX Runtime Web.

## Features

- 🚀 **Browser-native**: Runs entirely in the browser using WebAssembly
- 🎯 **Multiple AI Models**: Support for U2Net family models optimized for different use cases
- 📱 **Zero Dependencies**: No server required - everything runs client-side (except for hosting the models)
- 🎨 **Flexible Input**: Accepts File, Blob, ArrayBuffer, HTMLImageElement, or HTMLCanvasElement
- ⚡ **Caching**: Automatic model and session caching for better performance
- 🔧 **Customizable**: Support for custom models and post-processing options
- 🚀 **WebNN Support**: Optional hardware acceleration via Web Neural Network API (Chrome 119+, Edge 119+)
- 🎮 **WebGPU Support**: High-performance GPU acceleration via WebGPU API (Chrome 113+, Edge 113+)

## Available Models

- **u2net**: General-purpose background removal (default)
- **u2netp**: Lightweight version of U2Net
- **u2net_human_seg**: Optimized for human subjects
- **u2net_cloth_seg**: Specialized for clothing segmentation
- **isnet-general-use**: DIS model for general use cases (higher accuracy, larger model)
- **isnet-anime**: DIS model optimized for anime/manga style images
- **silueta**: Silueta model for background removal
- **u2net_custom**: Use your own custom ONNX models

## Installation

```bash
npm install @bunnio/rembg-web onnxruntime-web
# or
yarn add @bunnio/rembg-web onnxruntime-web
```

### CDN Usage

You can also use rembg-web directly from a CDN without installation:

```html
<script type="module">
  import {
    remove,
    newSession,
  } from 'https://unpkg.com/@bunnio/rembg-web@latest/dist/index.js';

  // Your code here
</script>
```

## Quick Start

```typescript
import { remove, newSession } from '@bunnio/rembg-web';

// Basic usage
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const file = fileInput.files[0];

const result = await remove(file);
const url = URL.createObjectURL(result);

// With custom options
const result = await remove(file, {
  onlyMask: true, // Return only the mask
  postProcessMask: true, // Apply smoothing
  bgcolor: [255, 0, 0, 255], // Red background
  session: newSession('u2net_human_seg'), // Use specific model
  onProgress: info => {
    console.log(`${info.step}: ${info.progress}% - ${info.message}`);
  },
});

// With WebNN acceleration (optional)
const webnnSession = newSession('u2net', undefined, {
  preferWebNN: true,
  webnnDeviceType: 'gpu',
  webnnPowerPreference: 'high-performance',
});
const acceleratedResult = await remove(file, { session: webnnSession });

// With WebGPU acceleration (optional)
const webgpuSession = newSession('u2net', undefined, {
  preferWebGPU: true,
  webgpuPowerPreference: 'high-performance',
});
const webgpuResult = await remove(file, { session: webgpuSession });

// With both WebNN and WebGPU (priority: WebNN > WebGPU > WebGL > CPU)
const hybridSession = newSession('u2net', undefined, {
  preferWebNN: true,
  preferWebGPU: true,
  webnnDeviceType: 'gpu',
  webnnPowerPreference: 'high-performance',
  webgpuPowerPreference: 'high-performance',
});
const hybridResult = await remove(file, { session: hybridSession });
```

## Model Setup

To use the models, you need to download and place the ONNX model files in your public directory:

### Download Models

Use the provided script to download the required model files:

```bash
# Download all models
yarn fetch-models

# Download a specific model
yarn fetch-models u2net.onnx

# Force re-download all models
yarn fetch-models --force
```

The script will download models from GitHub Releases and place them in `public/models/`. Models are cached in your browser's IndexedDB for future use.

### Model Information

| Model             | Size   | Input Size | Use Case                      |
| ----------------- | ------ | ---------- | ----------------------------- |
| u2net             | ~176MB | 320x320    | General purpose (default)     |
| u2netp            | ~4.7MB | 320x320    | Lightweight general purpose   |
| u2net_human_seg   | ~176MB | 320x320    | Human subjects                |
| u2net_cloth_seg   | ~176MB | 320x320    | Clothing segmentation         |
| isnet-general-use | ~178MB | 1024x1024  | High accuracy general purpose |

**Note:** The `isnet-general-use` model uses a larger input size (1024x1024) and may provide better accuracy for complex scenes, but requires more processing time and memory.

## Configuration

rembg-web includes a central configuration system that allows you to customize model paths for each model. This is useful when you want to host models on your own server or use different model versions.

### Using the Configuration System

```typescript
import { rembgConfig } from '@bunnio/rembg-web';

// Set custom model path for u2net
rembgConfig.setCustomModelPath(
  'u2net',
  'https://my-server.com/models/u2net.onnx'
);

// Set custom model path for u2net_human_seg
rembgConfig.setCustomModelPath(
  'u2net_human_seg',
  '/custom/path/human_seg.onnx'
);

// Check if a model has a custom path
if (rembgConfig.hasCustomPath('u2net')) {
  console.log('u2net has a custom path configured');
}

// Get the current path for a model
const u2netPath = rembgConfig.getCustomModelPath('u2net');

// Reset all paths to defaults
rembgConfig.resetToDefaults();

// Get all available models
const models = rembgConfig.getAvailableModels();
```

### Environment Variables (Alternative)

You can also set model paths using environment variables in Node.js environments:

```bash
export REMBG_U2NET_MODEL_PATH="/custom/path/u2net.onnx"
export REMBG_U2NETP_MODEL_PATH="/custom/path/u2netp.onnx"
export REMBG_U2NET_HUMAN_SEG_MODEL_PATH="/custom/path/human_seg.onnx"
```

### Browser Environment

In browser environments, you can set global variables or use meta tags:

```html
<!-- Using meta tags -->
<meta name="REMBG_U2NET_MODEL_PATH" content="/custom/path/u2net.onnx" />

<!-- Or set global variables -->
<script>
  window.REMBG_U2NET_MODEL_PATH = '/custom/path/u2net.onnx';
</script>
```

## Advanced Configuration

### Global Settings

The `rembgConfig` singleton provides advanced configuration options for logging, caching, and hardware acceleration:

```typescript
import { rembgConfig } from '@bunnio/rembg-web';

// Enable detailed logging
rembgConfig.enableGeneralLogging(true);
rembgConfig.enablePerformanceLogging(true);

// Configure cache behavior
rembgConfig.setSessionCacheBypass(false);
rembgConfig.setModelCacheBypass(false);

// Global WebNN/WebGPU settings
rembgConfig.enableWebNN(true);
rembgConfig.setWebNNDeviceType('gpu');
rembgConfig.enableWebGPU(true);
```

### Session Options

Additional session options for fine-grained control:

```typescript
const session = await newSession('u2net', undefined, {
  // Cache control
  bypassSessionCache: false, // Force new session creation
  bypassModelCache: false, // Force model re-download

  // Progress tracking during session initialization
  onProgress: info => {
    console.log(`Session: ${info.step} - ${info.progress}%`);
  },
});
```

See [API Documentation](https://bunn-io.github.io/rembg-web/) for complete configuration options.

## API Reference

### `remove(data, options?)`

Remove background from an image and return as Blob.

**Parameters:**

- `data`: File | Blob | ArrayBuffer | HTMLImageElement | HTMLCanvasElement
- `options`: RemoveOptions (optional)

**Returns:** Promise<Blob>

### `removeToCanvas(data, options?)`

Remove background from an image and return as HTMLCanvasElement.

**Parameters:**

- `data`: File | Blob | ArrayBuffer | HTMLImageElement | HTMLCanvasElement
- `options`: RemoveOptions (optional)

**Returns:** Promise<HTMLCanvasElement>

### `newSession(modelName, config?)`

Create a new model session.

**Parameters:**

- `modelName`: string (default: 'u2net')
- `config`: U2NetCustomConfig (required for u2net_custom)

**Returns:** BaseSession

### RemoveOptions

```typescript
interface RemoveOptions {
  session?: BaseSession; // Custom session to use
  onlyMask?: boolean; // Return only mask (black/white)
  postProcessMask?: boolean; // Apply post-processing smoothing
  bgcolor?: [number, number, number, number]; // RGBA background color
  onProgress?: (info: ProgressInfo) => void; // Progress callback
}

interface ProgressInfo {
  step: 'downloading' | 'processing' | 'postprocessing' | 'complete';
  progress: number; // 0-100
  message: string; // Human-readable status message
}
```

## Model Management

```typescript
import {
  getAvailableModels,
  clearModelCache,
  clearModelCacheForModel,
  disposeAllSessions,
} from '@bunnio/rembg-web';

// Get available models
const models = getAvailableModels();
console.log(models); // ['u2net', 'u2netp', 'u2net_human_seg', 'u2net_cloth_seg', 'isnet-general-use', 'isnet-anime', 'silueta', 'u2net_custom']

// Clear all cached models from IndexedDB
await clearModelCache();

// Clear cache for a specific model
await clearModelCacheForModel('u2net');

// Dispose all sessions
await disposeAllSessions();
```

## Custom Models

```typescript
import { newSession } from '@bunnio/rembg-web';

// Use a custom ONNX model
const customSession = newSession('u2net_custom', {
  modelPath: '/path/to/your/model.onnx',
});

const result = await remove(imageFile, { session: customSession });
```

## Bundle Size

The library is optimized for size and performance:

- **Main bundle**: ~8KB gzipped (excluding ONNX Runtime)
- **Total size**: ~65KB uncompressed
- **ONNX Runtime**: ~1.5MB (loaded separately by the browser)

The library uses tree-shaking to ensure only the code you use is included in your bundle.

## Browser Support

- Chrome/Edge 88+ (WebNN support in 119+, WebGPU support in 113+)
- Firefox 78+ (WebGPU behind flag)
- Safari 14+ (WebGPU in Technology Preview)

Requires WebAssembly and Web Workers support.

### Hardware Acceleration

#### WebNN Support

WebNN support is available (with caveats, see above,short: no difference)

#### WebGPU Support

WebGPU support is available (with caveats, see above,short: does not work with models, will fail on execution)

#### Execution Provider Priority

When both WebNN and WebGPU are enabled, the system uses the following priority order:

1. **WebNN** (if available)
2. **WebGPU** (if available)
3. **WebGL** (fallback)
4. **CPU** (final fallback)

## Development

```bash
# Install dependencies
yarn install

# Build the library
yarn build

# Run tests
yarn test

# Start directly linked demos
yarn test:demo

# Analyze bundle size
yarn size

# Check bundle size limits
yarn analyze

# Start Docs devserver
yarn docs:dev
```

## Examples

The `/examples` directory contains several HTML examples demonstrating different features:

- **Basic Usage**: Simple background removal
- **Mask Only**: Generate masks instead of processed images
- **Custom Background**: Replace background with custom colors
- **Session Reuse**: Performance optimization for multiple images
- **Progress Tracking**: Real-time progress updates
- **WebNN Acceleration**: Hardware-accelerated processing with WebNN
- **WebGPU Acceleration**: High-performance GPU acceleration with WebGPU

### Running Examples

1. **Start the development server:**

   ```bash
   yarn docs:dev
   ```

2. **Open in browser:**
   - Navigate to `http://localhost:3000`
   - Click on any example HTML file

**⚠️ Important:** Examples must be served through an HTTP server (not opened directly) to avoid CORS errors.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Advanced Features

### Model Integrity Verification

Verify model integrity and validate downloads:

```typescript
import { verifyModelIntegrity, validateModel } from '@bunnio/rembg-web';

// Verify model integrity
const isValid = await verifyModelIntegrity('u2net.onnx', modelData);
const validated = await validateModel('u2net.onnx', modelData);
```

### Cloth Segmentation Options

Specialized options for clothing segmentation:

```typescript
import { U2NetClothSegSession } from '@bunnio/rembg-web';

const session = new U2NetClothSegSession();
session.setClothCategory('upper'); // 'upper' | 'lower' | 'full' | 'all'
```

### Hardware Detection

Check WebNN and WebGPU availability:

```typescript
import {
  isWebNNAvailable,
  isWebGPUAvailable,
  getWebNNInfo,
} from '@bunnio/rembg-web';

const webnnAvailable = isWebNNAvailable();
const webgpuAvailable = isWebGPUAvailable();
const webnnInfo = await getWebNNInfo();
```

### Direct Session Usage

Use session classes directly for advanced control:

```typescript
import { U2NetSession, IsNetGeneralUseSession } from '@bunnio/rembg-web';

const session = new U2NetSession({ preferWebNN: true });
await session.initialize();
const masks = await session.predict(imageCanvas);
```

See [API Documentation](https://bunn-io.github.io/rembg-web/) for complete utility functions and advanced usage.

## Troubleshooting

### Common Issues

**CORS Errors**

- Make sure you're serving your application from an HTTP server, not opening HTML files directly
- Use `yarn examples` or a local server like `python3 -m http.server 8080`

**Model Not Found**

- Run `yarn fetch-models` to download the required ONNX model files
- Ensure models are in the `public/models/` directory
- Check browser console for specific error messages

**WebAssembly Errors**

- Verify your browser supports WebAssembly
- Check that WASM files are accessible
- Try refreshing the page and clearing browser cache

**Memory Issues**

- Use smaller images for faster processing
- Try the `u2netp` model for lower memory usage
- Close other browser tabs to free up memory
- Use session reuse for multiple images

**Performance Issues**

- Use `u2netp` model for faster processing
- Resize large images before processing
- Enable hardware acceleration (WebNN/WebGPU) if available
- Use session reuse for batch processing

### Getting Help

- 📖 [Documentation](https://bunn-io.github.io/rembg-web/)
- 🎮 [Examples](https://bunn-io.github.io/rembg-web/examples/)
- 🐛 [GitHub Issues](https://github.com/bunn-io/rembg-web/issues)
- 💬 [GitHub Discussions](https://github.com/bunn-io/rembg-web/discussions)

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

- 🐛 [Report Bugs](https://github.com/bunn-io/rembg-web/issues/new?template=bug_report.md)
- ✨ [Request Features](https://github.com/bunn-io/rembg-web/issues/new?template=feature_request.md)
- 📖 [Improve Documentation](https://github.com/bunn-io/rembg-web/issues/new?template=feature_request.md)

## Acknowledgments

This project is inspired by [danielgatis/rembg](https://github.com/danielgatis/rembg) and uses the same AI models for consistent results. Built with modern web technologies and designed for the browser-first world.
