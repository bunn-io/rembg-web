# CDN Examples

This directory contains examples that use rembg-web directly from a CDN without requiring installation. These examples are perfect for:

- Quick testing and prototyping
- Sharing with others without setup
- Learning how to use the library
- Integration into existing projects

## Available Examples

### 1. Basic Usage (`basic-usage.html`)

Demonstrates the most basic usage of rembg-web loaded from CDN.

**Features:**

- File upload with drag & drop
- Model selection
- Progress tracking
- Result download
- Error handling

**CDN Import:**

```javascript
import {
  remove,
  newSession,
} from 'https://unpkg.com/@bunnio/rembg-web@latest/dist/index.js';
```

## How to Use

1. **Open any HTML file** in a modern web browser
2. **Upload an image** using the file input or drag & drop
3. **Select a model** from the dropdown (optional)
4. **Click "Process Image"** to remove the background
5. **Download the result** when processing is complete

## Requirements

- Modern browser with ES6 module support
- WebAssembly support
- Web Workers support
- Internet connection (for CDN and model downloads)

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+

## Model Loading

The examples automatically download models from GitHub Releases when needed. The first time you use a model, it will be downloaded and cached in your browser's IndexedDB for future use.

## Troubleshooting

### CORS Errors

Make sure you're opening the HTML files through an HTTP server, not directly from the file system. You can use:

```bash
# Python 3
python3 -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080

# Node.js
npx http-server -p 8080

# PHP
php -S localhost:8080
```

### Model Download Issues

- Check your internet connection
- Ensure the GitHub Releases are accessible
- Try refreshing the page and processing again

### Performance Issues

- Use smaller images for faster processing
- Try the `u2netp` model for faster results
- Close other browser tabs to free up memory

## Customization

You can easily customize these examples by:

1. **Changing the CDN version:**

   ```javascript
   // Use specific version
   import { remove } from 'https://unpkg.com/@bunnio/rembg-web@1.0.0/dist/index.js';

   // Use latest
   import { remove } from 'https://unpkg.com/@bunnio/rembg-web@latest/dist/index.js';
   ```

2. **Adding custom options:**

   ```javascript
   const result = await remove(file, {
     onlyMask: true,
     postProcessMask: true,
     bgcolor: [255, 0, 0, 255], // Red background
     onProgress: info => console.log(info),
   });
   ```

3. **Using different models:**
   ```javascript
   const session = newSession('u2net_human_seg');
   const result = await remove(file, { session });
   ```

## Integration

To integrate these examples into your own project:

1. Copy the HTML structure
2. Update the CDN import URL
3. Customize the UI and functionality
4. Add your own styling and features

## Support

If you encounter issues with these examples:

1. Check the browser console for error messages
2. Ensure you're using a supported browser
3. Try the troubleshooting steps above
4. Open an issue on [GitHub](https://github.com/boldizsar-pal/rembg-web/issues)
