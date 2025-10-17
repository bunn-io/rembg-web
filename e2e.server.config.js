import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Root directory for the dev server
  root: 'tests/test-page',
  publicDir: '../../public',
  
  // Build configuration
  build: {
    // Output directory for built files
    // outDir: '../../dist-test',
    // Don't clear the output directory (preserve dist folder)
    emptyOutDir: false,
    // Rollup options
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'tests/test-page/test-page.html'),
        
      }
    }
  },
  
  // Development server configuration
  server: {
    port: 3000,
    open: true,
    // Configure headers for WASM files
    // Add cache busting
    force: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      // Disable caching for development
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
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
