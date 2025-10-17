import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Root directory for the dev server
  root: 'demo',
  publicDir: '../public',
  
  // Build configuration
  build: {
    // Output directory for built files
    outDir: '../dist-test',
    // Don't clear the output directory (preserve dist folder)
    emptyOutDir: false,
    // Rollup options
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'demo/index.html'),
        'model-test': resolve(__dirname, 'demo/model-test.html'),
        'user-upload': resolve(__dirname, 'demo/user-upload.html'),
        'all-models-test': resolve(__dirname, 'demo/all-models-test.html'),
        'webnn-acceleration': resolve(__dirname, 'demo/webnn-acceleration.html'),
      }
    }
  },
  
  // Development server configuration
  server: {
    port: 3000,
    host: '0.0.0.0',
    open: true,
    // Configure headers for WASM files
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      // Alias for the library
      'rembg-web': resolve(__dirname, 'dist/index.js')
    }
  },
  
  // Optimize dependencies
  optimizeDeps: {
    // Don't pre-bundle ONNX Runtime Web to avoid WASM issues
    exclude: ['onnxruntime-web']
  },
  
  // Configure asset handling
  assetsInclude: ['**/*.wasm'],
  
  // Worker configuration for ONNX Runtime
  worker: {
    format: 'es'
  }
});
