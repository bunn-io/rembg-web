# rembg-web Examples

This directory contains various examples demonstrating different features and use cases of the rembg-web library.

## Examples

### 1. Basic Usage (`basic-usage.html`)

Demonstrates the most basic usage of rembg-web for background removal.

**Features:**

- File input for image selection
- Simple background removal
- Side-by-side comparison of original and processed images
- Error handling and loading states

**Usage:**

1. Open `basic-usage.html` in a web browser
2. Select an image file
3. Click "Process Image" to remove the background

### 2. Mask Only (`mask-only.html`)

Shows how to generate only the mask (black/white) instead of the full processed image.

**Features:**

- `onlyMask: true` option
- Grayscale mask output
- White areas = foreground, black areas = background

**Use Cases:**

- Creating custom backgrounds
- Image compositing
- Mask-based image editing

### 3. Custom Background (`custom-background.html`)

Demonstrates how to replace the background with a custom color.

**Features:**

- Color picker for background color selection
- Alpha/transparency slider
- Real-time color preview
- RGBA color support

**Use Cases:**

- Product photography
- Portrait editing
- Social media content creation

### 4. Session Reuse (`session-reuse.html`)

Shows how to reuse sessions for better performance when processing multiple images.

**Features:**

- Session creation and management
- Multiple image processing
- Performance statistics
- Model selection
- Batch processing

**Benefits:**

- Faster processing for multiple images
- Reduced memory usage
- Better user experience

### 5. Progress Tracking (`progress-tracking.html`)

Demonstrates how to track progress during background removal processing.

**Features:**

- Real-time progress updates
- Step-by-step progress indicators
- Download progress tracking
- Processing status messages
- Progress log with timestamps

**Use Cases:**

- Long-running operations
- User experience improvement
- Debugging and monitoring
- Progress feedback for users

### 6. Pixel Comparison (`pixel-compare.html`)

A tool for comparing two images pixel by pixel and highlighting differences.

**Features:**

- Drag and drop interface for easy image selection
- Pixel-by-pixel comparison algorithm
- Configurable difference threshold
- Visual difference highlighting (red pixels)
- Detailed statistics (total pixels, different pixels, percentage)
- Real-time comparison with adjustable sensitivity

**Use Cases:**

- Testing and comparing different model outputs
- Quality assurance and validation
- Debugging image processing results
- Performance analysis between different processing methods

## Running the Examples

### Quick Start (Recommended)

1. **Start the development server:**

   ```bash
   yarn examples
   ```

   This will build the library and start a local server on port 8080.

2. **Open examples in your browser:**
   - Navigate to `http://localhost:8080/examples/`
   - Click on any example HTML file to run it

### Alternative Methods

#### Option 1: Using Python

```bash
# Build first
yarn build

# Python 3
python3 -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```

#### Option 2: Using Node.js (serve)

```bash
yarn serve:node
```

#### Option 3: Using Node.js (http-server)

```bash
# Build first
yarn build

# Start server
npx http-server -p 8080
```

#### Option 4: Using PHP

```bash
# Build first
yarn build

# Start server
php -S localhost:8080
```

### Accessing Examples

Open your browser and navigate to:

- `http://localhost:8080/examples/basic-usage.html`
- `http://localhost:8080/examples/mask-only.html`
- `http://localhost:8080/examples/custom-background.html`
- `http://localhost:8080/examples/session-reuse.html`
- `http://localhost:8080/examples/progress-tracking.html`
- `http://localhost:8080/examples/pixel-compare.html`

### ⚠️ Important Note

**Do NOT open the HTML files directly in your browser** (file:// URLs) as this will cause CORS errors. The examples must be served through an HTTP server to work properly.

## Model Files

Make sure you have the required ONNX model files in the `/public/models/` directory:

- `u2net.onnx`
- `u2netp.onnx`
- `u2net_human_seg.onnx`
- `u2net_cloth_seg.onnx`

## Browser Compatibility

These examples require:

- Modern browser with ES6 module support
- WebAssembly support
- Web Workers support

**Supported Browsers:**

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure you're serving the examples from a local server, not opening the HTML files directly.

2. **Model Not Found**: Ensure the ONNX model files are in the correct location (`/public/models/`).

3. **WebAssembly Errors**: Check that your browser supports WebAssembly and that the WASM files are accessible.

4. **Memory Issues**: For large images or multiple images, consider using session reuse to manage memory better.

### Performance Tips

1. **Use Session Reuse**: For multiple images, create a session once and reuse it.

2. **Optimize Images**: Resize large images before processing to improve performance.

3. **Choose the Right Model**:
   - `u2net`: General purpose
   - `u2netp`: Faster, lighter
   - `u2net_human_seg`: Best for people
   - `u2net_cloth_seg`: Best for clothing

## Contributing

To add new examples:

1. Create a new HTML file in this directory
2. Follow the existing structure and styling
3. Update this README with documentation
4. Test in multiple browsers
5. Ensure proper error handling and loading states
