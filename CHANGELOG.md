# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-20

### Added

- **Initial Release**: Complete TypeScript/JavaScript port of rembg for the web
- **Multiple AI Models**: Support for U2Net, ISNet, and Silueta models
  - `u2net`: General-purpose background removal (default)
  - `u2netp`: Lightweight version for faster processing (~4.7MB)
  - `u2net_human_seg`: Optimized for human subjects
  - `u2net_cloth_seg`: Specialized for clothing segmentation
  - `isnet-general-use`: High accuracy general purpose model
  - `isnet-anime`: Optimized for anime-style images
  - `silueta`: Silhouette-based background removal
- **Browser-Native**: Runs entirely in the browser using WebAssembly
- **Flexible Input Support**: Accepts File, Blob, ArrayBuffer, HTMLImageElement, or HTMLCanvasElement
- **Hardware Acceleration**: Optional WebNN and ~~WebGPU~~ support for faster processing
- **Progress Tracking**: Real-time progress callbacks during processing
- **Custom Backgrounds**: Support for custom background colors and transparency
- **Mask Generation**: Option to generate masks instead of processed images
- **Post-Processing**: Optional mask smoothing and refinement
- **Session Management**: Reusable sessions for better performance
- **Model Caching**: Automatic model caching in IndexedDB
- **Configuration System**: Centralized model path configuration
- **TypeScript Support**: Full TypeScript definitions and type safety
- **Comprehensive Documentation**: API docs, examples, and guides
- **Model Download Script**: CLI tool for downloading ONNX models
- **GitHub Pages**: Hosted documentation and examples
- **CI/CD Pipeline**: Automated testing, building, and deployment
- **Community Health**: Issue templates, contributing guidelines, and code of conduct

### Technical Features

- **WebAssembly Integration**: Uses ONNX Runtime Web for AI model execution
- **Memory Management**: Efficient memory usage with automatic cleanup
- **Error Handling**: Comprehensive error handling and user-friendly messages
- **Browser Compatibility**: Tested on Chrome 140
- **Bundle Optimization**: Tree-shaking support and minimal bundle size (~8KB gzipped)
- **Performance Monitoring**: Built-in performance logging and metrics
- **Security**: Secure model loading and execution in browser sandbox

### Developer Experience

- **Easy Installation**: Simple npm/yarn installation
- **Quick Start**: Minimal setup required
- **Rich Examples**: Multiple example implementations
- **Interactive Demos**: Live examples on GitHub Pages
- **API Documentation**: Auto-generated from JSDoc comments
- **Type Safety**: Full TypeScript support with comprehensive types
- **Testing**: Unit tests and end-to-end tests with Playwright
- **Linting**: ESLint and Prettier configuration
- **CI/CD**: Automated testing and deployment workflows

### Known Limitations

- **Model Size**: Models range from 4.7MB to 178MB
- **Browser Requirements**: Requires WebAssembly and Web Workers support
- **Hardware Acceleration**: WebNN support varies by browser, currently requires feature flag for most browsers
- **webGPU**: WebGPU is implemented, but does not work with the models
- **Memory Usage**: Large images may require significant memory
- **Processing Time**: Complex images may take several seconds to process

### Breaking Changes

- This is the initial release, so no breaking changes from previous versions

### Migration Guide

- This is the initial release, so no migration is needed
- For future versions, migration guides will be provided in the documentation

### Security

- All processing happens locally in the browser
- No data is sent to external servers (except for model downloads)
- Models are loaded from trusted sources (GitHub Releases)

### Performance

- **Bundle Size**: ~8KB gzipped core library
- **Model Loading**: Models cached in IndexedDB after first download
- **Processing Speed**: Varies by model and hardware acceleration
- **Hardware Acceleration**: WebNN/WebGPU support for faster processing

### Browser Support

- **Chrome/Edge 140+**: Full support including WebNN (119+) and WebGPU

### Dependencies

- **@webgpu/types**: WebGPU type definitions
- **onnxruntime-web**: ONNX Runtime for WebAssembly execution

### Development Dependencies

- **TypeScript**: Type checking and compilation
- **Vitest**: Unit testing framework
- **Playwright**: End-to-end testing
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeDoc**: API documentation generation
- **Vite**: Development server and build tool
