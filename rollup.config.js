import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default defineConfig([
  // ES Module build (tree-shakeable)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'es',
      sourcemap: true,
    },
    plugins: [
      typescript({
        declaration: true,
        declarationDir: 'dist',
        sourceMap: true,
      }),
      nodeResolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
    ],
    external: ['onnxruntime-web'], // Keep external for tree shaking
  },
  
  // UMD build (CDN/script tag)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'RembgWeb',
      sourcemap: true,
      globals: {
        'onnxruntime-web': 'ort',
      },
    },
    plugins: [
      typescript({
        declaration: false,
        sourceMap: true,
      }),
      nodeResolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
    ],
    external: ['onnxruntime-web'], // External dependency
    onwarn(warning, warn) {
      // Suppress warnings about external dependencies
      if (warning.code === 'UNRESOLVED_IMPORT') return;
      warn(warning);
    },
  },
  
  // Minified UMD build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.umd.min.js',
      format: 'umd',
      name: 'RembgWeb',
      sourcemap: true,
      globals: {
        'onnxruntime-web': 'ort',
      },
    },
    plugins: [
      typescript({
        declaration: false,
        sourceMap: true,
      }),
      nodeResolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
      terser({
        compress: {
          drop_console: true,
        },
      }),
    ],
    external: ['onnxruntime-web'],
    onwarn(warning, warn) {
      // Suppress warnings about external dependencies
      if (warning.code === 'UNRESOLVED_IMPORT') return;
      warn(warning);
    },
  },
]);
