import * as ort from 'onnxruntime-web';
import { logInfo, logPerformance, logError } from './logger';

/**
 * Parameters for image normalization used by ONNX models
 *
 * @interface NormalizationParams
 */
export interface NormalizationParams {
    /** Mean values for RGB channels (typically ImageNet values) */
    mean: [number, number, number];
    /** Standard deviation values for RGB channels (typically ImageNet values) */
    std: [number, number, number];
    /** Target size [width, height] for model input */
    size: [number, number];
}

/**
 * Convert HTMLImageElement or ImageData to HTMLCanvasElement.
 *
 * Creates a new canvas and draws the input image onto it. For HTMLImageElement,
 * uses naturalWidth/Height to preserve original dimensions.
 *
 * @param image - The image to convert (HTMLImageElement or ImageData)
 * @returns A new HTMLCanvasElement containing the image
 *
 * @throws {Error} When canvas context creation fails
 *
 * @example
 * ```typescript
 * // Convert an image element to canvas
 * const img = document.getElementById('myImage') as HTMLImageElement;
 * const canvas = imageToCanvas(img);
 *
 * // Convert ImageData to canvas
 * const ctx = someCanvas.getContext('2d');
 * const imageData = ctx.getImageData(0, 0, 100, 100);
 * const canvas = imageToCanvas(imageData);
 * ```
 */
export function imageToCanvas(
    image: HTMLImageElement | ImageData
): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to get context for canvas');
    }

    if (image instanceof HTMLImageElement) {
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        ctx.drawImage(image, 0, 0);
    } else {
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.putImageData(image, 0, 0);
    }

    return canvas;
}

/**
 * Extract ImageData from an HTMLCanvasElement.
 *
 * Gets the pixel data from the entire canvas as ImageData object.
 *
 * @param canvas - The canvas to extract data from
 * @returns ImageData containing the canvas pixel data
 *
 * @throws {Error} When canvas context creation fails
 *
 * @example
 * ```typescript
 * const canvas = document.createElement('canvas');
 * const ctx = canvas.getContext('2d');
 * ctx.fillRect(0, 0, 100, 100);
 *
 * const imageData = canvasToImageData(canvas);
 * console.log(`Canvas size: ${imageData.width}x${imageData.height}`);
 * ```
 */
export function canvasToImageData(canvas: HTMLCanvasElement): ImageData {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to get context for canvas');
    }
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * Create an HTMLCanvasElement from ImageData.
 *
 * Creates a new canvas with the same dimensions as the ImageData and draws
 * the pixel data onto it.
 *
 * @param imageData - The ImageData to convert
 * @returns A new HTMLCanvasElement containing the image data
 *
 * @throws {Error} When canvas context creation fails
 *
 * @example
 * ```typescript
 * // Create ImageData programmatically
 * const imageData = new ImageData(100, 100);
 * const data = imageData.data;
 * for (let i = 0; i < data.length; i += 4) {
 *   data[i] = 255;     // R
 *   data[i + 1] = 0;   // G
 *   data[i + 2] = 0;   // B
 *   data[i + 3] = 255; // A
 * }
 *
 * const canvas = imageDataToCanvas(imageData);
 * ```
 */
export function imageDataToCanvas(imageData: ImageData): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to get context for canvas');
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

/**
 * Convert File or Blob to HTMLImageElement.
 *
 * Creates an object URL from the file/blob and loads it as an image.
 * The object URL is automatically cleaned up after loading.
 *
 * @param file - The File or Blob to convert to an image
 * @returns Promise that resolves to an HTMLImageElement
 *
 * @throws {Error} When image loading fails (invalid format, corrupted data, etc.)
 *
 * @example
 * ```typescript
 * // Convert file input to image
 * const fileInput = document.getElementById('file') as HTMLInputElement;
 * const file = fileInput.files[0];
 * const image = await fileToImage(file);
 *
 * // Convert blob to image
 * const response = await fetch('image.jpg');
 * const blob = await response.blob();
 * const image = await fileToImage(blob);
 * ```
 */
export function fileToImage(file: File | Blob): Promise<HTMLImageElement> {
    const startTime = performance.now();
    logInfo(
        `[fileToImage] Converting ${file instanceof File ? file.name : 'blob'} (${(file.size / 1024).toFixed(1)}KB)...`
    );

    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            const loadTime = performance.now() - startTime;
            logPerformance(
                `[fileToImage] Image loaded: ${loadTime.toFixed(2)}ms (${img.naturalWidth}x${img.naturalHeight})`
            );
            URL.revokeObjectURL(objectUrl);
            resolve(img);
        };
        img.onerror = error => {
            const errorTime = performance.now() - startTime;
            logError(
                `[fileToImage] Image load failed: ${errorTime.toFixed(2)}ms`,
                error
            );
            URL.revokeObjectURL(objectUrl);
            reject(error);
        };
        img.src = objectUrl;
    });
}

/**
 * Convert ArrayBuffer to HTMLImageElement.
 *
 * Creates a Blob from the ArrayBuffer and loads it as an image.
 * Useful for processing binary image data from network requests or file operations.
 *
 * @param buffer - The ArrayBuffer containing image data
 * @returns Promise that resolves to an HTMLImageElement
 *
 * @throws {Error} When image loading fails (invalid format, corrupted data, etc.)
 *
 * @example
 * ```typescript
 * // Convert fetch response to image
 * const response = await fetch('image.png');
 * const buffer = await response.arrayBuffer();
 * const image = await arrayBufferToImage(buffer);
 *
 * // Convert FileReader result to image
 * const file = fileInput.files[0];
 * const buffer = await file.arrayBuffer();
 * const image = await arrayBufferToImage(buffer);
 * ```
 */
export function arrayBufferToImage(
    buffer: ArrayBuffer
): Promise<HTMLImageElement> {
    const startTime = performance.now();
    logInfo(
        `[arrayBufferToImage] Converting buffer (${(buffer.byteLength / 1024).toFixed(1)}KB)...`
    );

    return new Promise((resolve, reject) => {
        const blob = new Blob([buffer]);
        const img = new Image();
        const objectUrl = URL.createObjectURL(blob);

        img.onload = () => {
            const loadTime = performance.now() - startTime;
            logPerformance(
                `[arrayBufferToImage] Image loaded: ${loadTime.toFixed(2)}ms (${img.naturalWidth}x${img.naturalHeight})`
            );
            URL.revokeObjectURL(objectUrl);
            resolve(img);
        };
        img.onerror = error => {
            const errorTime = performance.now() - startTime;
            logError(
                `[arrayBufferToImage] Image load failed: ${errorTime.toFixed(2)}ms`,
                error
            );
            URL.revokeObjectURL(objectUrl);
            reject(error);
        };
        img.src = objectUrl;
    });
}

/**
 * Convert HTMLCanvasElement to Blob.
 *
 * Exports the canvas content as a binary blob in the specified format.
 * Defaults to PNG format if no mime type is provided.
 *
 * @param canvas - The canvas to convert
 * @param mimeType - The MIME type for the output blob (default: 'image/png')
 * @returns Promise that resolves to a Blob containing the image data
 *
 * @throws {Error} When canvas conversion fails
 *
 * @example
 * ```typescript
 * const canvas = document.createElement('canvas');
 * const ctx = canvas.getContext('2d');
 * ctx.fillRect(0, 0, 100, 100);
 *
 * // Convert to PNG blob
 * const pngBlob = await canvasToBlob(canvas);
 *
 * // Convert to JPEG blob
 * const jpegBlob = await canvasToBlob(canvas, 'image/jpeg');
 *
 * // Download the blob
 * const url = URL.createObjectURL(pngBlob);
 * const a = document.createElement('a');
 * a.href = url;
 * a.download = 'image.png';
 * a.click();
 * ```
 */
export function canvasToBlob(
    canvas: HTMLCanvasElement,
    mimeType: string = 'image/png'
): Promise<Blob> {
    const startTime = performance.now();
    logInfo(
        `[canvasToBlob] Converting ${canvas.width}x${canvas.height} canvas to ${mimeType}...`
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            const conversionTime = performance.now() - startTime;
            if (blob) {
                logPerformance(
                    `[canvasToBlob] Conversion complete: ${conversionTime.toFixed(2)}ms (${(blob.size / 1024).toFixed(1)}KB)`
                );
                resolve(blob);
            } else {
                logError(
                    `[canvasToBlob] Conversion failed: ${conversionTime.toFixed(2)}ms`
                );
                reject(new Error('Failed to convert canvas to blob'));
            }
        }, mimeType);
    });
}

/**
 * Normalize image for ONNX model input.
 *
 * Resizes the image to the target size and applies normalization using mean/std values.
 * The normalization process includes dynamic scaling and ImageNet-style preprocessing.
 * Output is in CHW format (channels, height, width) as required by ONNX models.
 *
 * @param canvas - The input image canvas
 * @param params - Normalization parameters (mean, std, size)
 * @param inputName - The input tensor name for the ONNX model (default: 'input.1')
 * @returns Object with input tensor ready for ONNX inference
 *
 * @throws {Error} When canvas context creation fails
 *
 * @example
 * ```typescript
 * const canvas = document.createElement('canvas');
 * // ... draw image to canvas ...
 *
 * const params = {
 *   mean: [0.485, 0.456, 0.406], // ImageNet mean
 *   std: [0.229, 0.224, 0.225],  // ImageNet std
 *   size: [320, 320]             // Model input size
 * };
 *
 * const input = normalizeImage(canvas, params);
 * const results = await session.run(input);
 * ```
 */
export function normalizeImage(
    canvas: HTMLCanvasElement,
    params: NormalizationParams,
    inputName: string = 'input.1'
): { [inputName: string]: ort.Tensor } {
    const startTime = performance.now();

    // Create a temporary canvas for resizing
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = params.size[0];
    tempCanvas.height = params.size[1];
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) {
        throw new Error('Failed to get context for temp canvas');
    }

    // Enable high-quality image smoothing (closest to LANCZOS)
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';

    // Resize image
    tempCtx.drawImage(canvas, 0, 0, params.size[0], params.size[1]);
    const resizeTime = performance.now();

    // Get pixel data
    const imageData = tempCtx.getImageData(
        0,
        0,
        params.size[0],
        params.size[1]
    );
    const data = imageData.data;
    const width = params.size[0];
    const height = params.size[1];

    // Find max value across all pixels (like Python: im_ary / max(np.max(im_ary), 1e-6))
    let maxValue = 0;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i] / 255.0;
        const g = data[i + 1] / 255.0;
        const b = data[i + 2] / 255.0;
        maxValue = Math.max(maxValue, r, g, b);
    }
    const divisor = Math.max(maxValue, 1e-6);
    const maxFindTime = performance.now();

    // Create normalized array (CHW format: channels, height, width)
    const normalized = new Float32Array(3 * height * width);

    // Normalize each channel
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pixelIndex = (y * width + x) * 4;
            const r = data[pixelIndex] / 255.0;
            const g = data[pixelIndex + 1] / 255.0;
            const b = data[pixelIndex + 2] / 255.0;

            // Apply dynamic normalization then (pixel - mean) / std
            // Matches Python: im_ary = im_ary / max(np.max(im_ary), 1e-6)
            const rNormalized = r / divisor;
            const gNormalized = g / divisor;
            const bNormalized = b / divisor;

            // Apply mean/std normalization
            const rNorm = (rNormalized - params.mean[0]) / params.std[0];
            const gNorm = (gNormalized - params.mean[1]) / params.std[1];
            const bNorm = (bNormalized - params.mean[2]) / params.std[2];

            // Store in CHW format
            normalized[y * width + x] = rNorm; // R channel
            normalized[height * width + y * width + x] = gNorm; // G channel
            normalized[2 * height * width + y * width + x] = bNorm; // B channel
        }
    }
    const normalizeTime = performance.now();

    // Create ONNX tensor
    const tensor = new ort.Tensor('float32', normalized, [1, 3, height, width]);
    const tensorTime = performance.now();

    // Log performance metrics
    logPerformance(`[normalizeImage] Performance:
    - Resize: ${(resizeTime - startTime).toFixed(2)}ms
    - Max find: ${(maxFindTime - resizeTime).toFixed(2)}ms
    - Normalize: ${(normalizeTime - maxFindTime).toFixed(2)}ms
    - Tensor: ${(tensorTime - normalizeTime).toFixed(2)}ms
    - Total: ${(tensorTime - startTime).toFixed(2)}ms
    - Max value: ${maxValue.toFixed(6)}, Divisor: ${divisor.toFixed(6)}`);

    return { [inputName]: tensor };
}

/**
 * Process ONNX model output to create mask canvas.
 *
 * Converts raw model output (Float32Array) into a grayscale mask canvas.
 * The output is normalized to 0-255 range and resized to match the original image dimensions.
 *
 * @param output - Raw model output as Float32Array
 * @param originalSize - Original image dimensions for resizing
 * @param outputShape - Model output shape [batch, channels, height, width] (default: [1, 1, 320, 320])
 * @returns HTMLCanvasElement containing the processed mask
 *
 * @throws {Error} When canvas context creation fails
 *
 * @example
 * ```typescript
 * // After running ONNX inference
 * const results = await session.run(input);
 * const outputTensor = results[Object.keys(results)[0]] as ort.Tensor;
 * const outputData = outputTensor.data as Float32Array;
 *
 * const maskCanvas = processModelOutput(
 *   outputData,
 *   { width: 800, height: 600 },
 *   [1, 1, 320, 320]
 * );
 *
 * // Use the mask for background removal
 * const cutout = naiveCutout(originalCanvas, maskCanvas);
 * ```
 */
export function processModelOutput(
    output: Float32Array,
    originalSize: { width: number; height: number },
    outputShape: [number, number, number, number] = [1, 1, 320, 320]
): HTMLCanvasElement {
    const startTime = performance.now();
    logInfo(
        `[processModelOutput] Processing output (${output.length} values) for ${originalSize.width}x${originalSize.height} image...`
    );

    const [, , height, width] = outputShape;

    // Extract the mask data
    const extractStart = performance.now();
    const maskData = output.slice(0, height * width);
    const extractTime = performance.now() - extractStart;
    logPerformance(
        `[processModelOutput] Data extraction: ${extractTime.toFixed(2)}ms`
    );

    // Find min/max for normalization
    const minMaxStart = performance.now();
    let min = maskData[0];
    let max = maskData[0];
    for (let i = 1; i < maskData.length; i++) {
        if (maskData[i] < min) min = maskData[i];
        if (maskData[i] > max) max = maskData[i];
    }
    const minMaxTime = performance.now() - minMaxStart;
    logPerformance(
        `[processModelOutput] Min/max calculation: ${minMaxTime.toFixed(2)}ms (min=${min.toFixed(6)}, max=${max.toFixed(6)})`
    );

    // Normalize to 0-1 range
    const normalizeStart = performance.now();
    const normalized = new Float32Array(maskData.length);
    for (let i = 0; i < maskData.length; i++) {
        normalized[i] = (maskData[i] - min) / (max - min);
    }
    const normalizeTime = performance.now() - normalizeStart;
    logPerformance(
        `[processModelOutput] Normalization: ${normalizeTime.toFixed(2)}ms`
    );

    // Create canvas for mask
    const canvasCreateStart = performance.now();
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) {
        throw new Error('Failed to get context for mask canvas');
    }
    const maskImageData = maskCtx.createImageData(width, height);

    // Set grayscale data
    for (let i = 0; i < normalized.length; i++) {
        const value = Math.round(normalized[i] * 255);
        const pixelIndex = i * 4;
        maskImageData.data[pixelIndex] = value; // R
        maskImageData.data[pixelIndex + 1] = value; // G
        maskImageData.data[pixelIndex + 2] = value; // B
        maskImageData.data[pixelIndex + 3] = 255; // A
    }

    maskCtx.putImageData(maskImageData, 0, 0);
    const canvasCreateTime = performance.now() - canvasCreateStart;
    logPerformance(
        `[processModelOutput] Canvas creation: ${canvasCreateTime.toFixed(2)}ms`
    );

    // Resize to original image size
    const resizeStart = performance.now();
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = originalSize.width;
    resizedCanvas.height = originalSize.height;
    const resizedCtx = resizedCanvas.getContext('2d');
    if (!resizedCtx) {
        throw new Error('Failed to get context for resized canvas');
    }
    resizedCtx.drawImage(
        maskCanvas,
        0,
        0,
        originalSize.width,
        originalSize.height
    );
    const resizeTime = performance.now() - resizeStart;
    logPerformance(
        `[processModelOutput] Resize: ${resizeTime.toFixed(2)}ms (${width}x${height} → ${originalSize.width}x${originalSize.height})`
    );

    const totalTime = performance.now() - startTime;
    logPerformance(
        `[processModelOutput] Total processing: ${totalTime.toFixed(2)}ms`
    );

    return resizedCanvas;
}

/**
 * Apply naive cutout by compositing image with mask.
 *
 * Creates a new canvas with the original image where the mask is applied as the alpha channel.
 * White areas in the mask become opaque, black areas become transparent.
 * This is the core function for background removal.
 *
 * @param imageCanvas - The original image canvas
 * @param maskCanvas - The mask canvas (grayscale, white=foreground, black=background)
 * @returns HTMLCanvasElement with transparent background where mask is black
 *
 * @throws {Error} When canvas context creation fails
 *
 * @example
 * ```typescript
 * // Load original image and generate mask
 * const imageCanvas = imageToCanvas(imageElement);
 * const maskCanvas = await generateMask(imageCanvas);
 *
 * // Create cutout with transparent background
 * const cutout = naiveCutout(imageCanvas, maskCanvas);
 *
 * // Display result
 * document.body.appendChild(cutout);
 * ```
 */
export function naiveCutout(
    imageCanvas: HTMLCanvasElement,
    maskCanvas: HTMLCanvasElement
): HTMLCanvasElement {
    const startTime = performance.now();
    logInfo(
        `[naiveCutout] Creating cutout for ${imageCanvas.width}x${imageCanvas.height} image...`
    );

    const result = document.createElement('canvas');
    result.width = imageCanvas.width;
    result.height = imageCanvas.height;
    const resultCtx = result.getContext('2d');
    if (!resultCtx) {
        throw new Error('Failed to get context for result canvas');
    }

    // Draw the original image
    const drawStart = performance.now();
    resultCtx.drawImage(imageCanvas, 0, 0);
    const drawTime = performance.now() - drawStart;
    logPerformance(`[naiveCutout] Image draw: ${drawTime.toFixed(2)}ms`);

    // Get image and mask data
    const dataExtractionStart = performance.now();
    const imageData = resultCtx.getImageData(0, 0, result.width, result.height);
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) {
        throw new Error('Failed to get context for mask canvas');
    }
    const maskData = maskCtx.getImageData(
        0,
        0,
        maskCanvas.width,
        maskCanvas.height
    );
    const dataExtractionTime = performance.now() - dataExtractionStart;
    logPerformance(
        `[naiveCutout] Data extraction: ${dataExtractionTime.toFixed(2)}ms`
    );

    // Apply mask as alpha channel
    const maskApplicationStart = performance.now();
    for (let i = 0; i < imageData.data.length; i += 4) {
        const maskIndex = i;
        const maskValue = maskData.data[maskIndex]; // Use red channel as mask value
        imageData.data[i + 3] = maskValue; // Set alpha channel
    }
    const maskApplicationTime = performance.now() - maskApplicationStart;
    logPerformance(
        `[naiveCutout] Mask application: ${maskApplicationTime.toFixed(2)}ms`
    );

    const putImageStart = performance.now();
    resultCtx.putImageData(imageData, 0, 0);
    const putImageTime = performance.now() - putImageStart;
    logPerformance(
        `[naiveCutout] Put image data: ${putImageTime.toFixed(2)}ms`
    );

    const totalTime = performance.now() - startTime;
    logPerformance(
        `[naiveCutout] Total cutout creation: ${totalTime.toFixed(2)}ms`
    );

    return result;
}

/**
 * Apply a solid background color to an image.
 *
 * Creates a new canvas with the specified background color and composites
 * the original image on top. Useful for replacing transparent backgrounds
 * with solid colors.
 *
 * @param imageCanvas - The image canvas (can have transparent areas)
 * @param color - RGBA color values [red, green, blue, alpha] (0-255 range)
 * @returns HTMLCanvasElement with the specified background color
 *
 * @throws {Error} When canvas context creation fails
 *
 * @example
 * ```typescript
 * // Apply white background
 * const withWhiteBg = applyBackgroundColor(cutout, [255, 255, 255, 255]);
 *
 * // Apply red background with 50% opacity
 * const withRedBg = applyBackgroundColor(cutout, [255, 0, 0, 128]);
 *
 * // Apply transparent background (no change)
 * const withTransparentBg = applyBackgroundColor(cutout, [0, 0, 0, 0]);
 * ```
 */
export function applyBackgroundColor(
    imageCanvas: HTMLCanvasElement,
    color: [number, number, number, number]
): HTMLCanvasElement {
    const result = document.createElement('canvas');
    result.width = imageCanvas.width;
    result.height = imageCanvas.height;
    const resultCtx = result.getContext('2d');
    if (!resultCtx) {
        throw new Error('Failed to get context for result canvas');
    }

    // Fill with background color
    resultCtx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${
        color[3] / 255
    })`;
    resultCtx.fillRect(0, 0, result.width, result.height);

    // Composite the image on top
    resultCtx.drawImage(imageCanvas, 0, 0);

    return result;
}

/**
 * Apply simple post-processing to smooth mask edges.
 *
 * Applies a 2px blur filter to the mask to create smoother edges.
 * This helps reduce jagged edges in the final cutout.
 *
 * @param maskCanvas - The original mask canvas
 * @returns HTMLCanvasElement with smoothed mask
 *
 * @throws {Error} When canvas context creation fails
 *
 * @example
 * ```typescript
 * // Generate raw mask from model
 * const rawMask = processModelOutput(outputData, originalSize);
 *
 * // Apply smoothing
 * const smoothMask = postProcessMask(rawMask);
 *
 * // Use smoothed mask for better cutout
 * const cutout = naiveCutout(originalCanvas, smoothMask);
 * ```
 */
export function postProcessMask(
    maskCanvas: HTMLCanvasElement
): HTMLCanvasElement {
    const result = document.createElement('canvas');
    result.width = maskCanvas.width;
    result.height = maskCanvas.height;
    const resultCtx = result.getContext('2d');
    if (!resultCtx) {
        throw new Error('Failed to get context for result canvas');
    }

    // Apply a simple blur effect
    resultCtx.filter = 'blur(2px)';
    resultCtx.drawImage(maskCanvas, 0, 0);
    resultCtx.filter = 'none';

    return result;
}

/**
 * Convert mask to grayscale black/white representation.
 *
 * Creates a new canvas showing only the mask as a grayscale image.
 * White areas represent the foreground, black areas represent the background.
 * Useful for debugging mask quality or saving mask-only outputs.
 *
 * @param maskCanvas - The mask canvas to convert
 * @returns HTMLCanvasElement containing grayscale mask
 *
 * @throws {Error} When canvas context creation fails
 *
 * @example
 * ```typescript
 * // Generate mask from model
 * const mask = processModelOutput(outputData, originalSize);
 *
 * // Create mask-only visualization
 * const maskOnly = createMaskOnly(mask);
 *
 * // Display mask for debugging
 * document.body.appendChild(maskOnly);
 *
 * // Or save as blob
 * const maskBlob = await canvasToBlob(maskOnly);
 * ```
 */
export function createMaskOnly(
    maskCanvas: HTMLCanvasElement
): HTMLCanvasElement {
    const result = document.createElement('canvas');
    result.width = maskCanvas.width;
    result.height = maskCanvas.height;
    const resultCtx = result.getContext('2d');
    if (!resultCtx) {
        throw new Error('Failed to get context for result canvas');
    }

    // Draw mask as grayscale
    resultCtx.drawImage(maskCanvas, 0, 0);

    // Convert to grayscale
    const imageData = resultCtx.getImageData(0, 0, result.width, result.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const gray = data[i]; // Use red channel as grayscale value
        data[i] = gray; // R
        data[i + 1] = gray; // G
        data[i + 2] = gray; // B
        data[i + 3] = 255; // A
    }

    resultCtx.putImageData(imageData, 0, 0);
    return result;
}
