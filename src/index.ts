import { BaseSession } from './sessions/base';
import { newSession } from './sessionFactory';
import {
  imageToCanvas,
  canvasToBlob,
  fileToImage,
  arrayBufferToImage,
  naiveCutout,
  applyBackgroundColor,
  postProcessMask,
  createMaskOnly,
} from './utils/image';
import { logInfo, logPerformance, logError } from './utils/logger';

export interface ProgressInfo {
  /** Current step being executed */
  step: 'downloading' | 'processing' | 'postprocessing' | 'complete';
  /** Progress percentage (0-100) */
  progress: number;
  /** Human-readable message about current operation */
  message: string;
}

export interface RemoveOptions {
  /** Custom session to use (if not provided, will create a new u2net session) */
  session?: BaseSession;
  /** Return only the mask (black/white) instead of the cutout */
  onlyMask?: boolean;
  /** Apply post-processing to smooth the mask */
  postProcessMask?: boolean;
  /** Background color to apply (RGBA values 0-255) */
  bgcolor?: [number, number, number, number];
  /** Progress callback function */
  onProgress?: (info: ProgressInfo) => void;
}

/**
 * Remove background from an image using AI-powered segmentation.
 *
 * This is the main function for background removal. It supports multiple input formats
 * and provides various processing options including mask-only output, custom backgrounds,
 * and post-processing.
 *
 * @param data - Input image as File, Blob, ArrayBuffer, HTMLImageElement, or HTMLCanvasElement
 * @param options - Processing options
 * @returns Promise<Blob> - Processed image as PNG blob with transparent background
 *
 * @example
 * ```typescript
 * // Basic usage
 * const fileInput = document.getElementById('file') as HTMLInputElement;
 * const file = fileInput.files[0];
 * const result = await remove(file);
 *
 * // With progress tracking
 * const result = await remove(file, {
 *   onProgress: (info) => console.log(`${info.step}: ${info.progress}%`)
 * });
 *
 * // Mask only output
 * const mask = await remove(file, { onlyMask: true });
 *
 * // Custom background color
 * const result = await remove(file, {
 *   bgcolor: [255, 0, 0, 255] // Red background
 * });
 * ```
 *
 * @throws {Error} When input type is not supported
 * @throws {Error} When model fails to generate masks
 * @throws {Error} When browser doesn't support required features (WASM, IndexedDB, etc.)
 */
export async function remove(
  data: File | Blob | ArrayBuffer | HTMLImageElement | HTMLCanvasElement,
  options: RemoveOptions = {}
): Promise<Blob> {
  const removeStartTime = performance.now();
  logInfo('[remove] Starting background removal process...');

  const emitProgress = (
    step: ProgressInfo['step'],
    progress: number,
    message: string
  ) => {
    if (options.onProgress) {
      options.onProgress({ step, progress, message });
    }
  };

  try {
    emitProgress('downloading', 0, 'Initializing...');

    // Convert input to canvas
    const inputProcessingStart = performance.now();
    let inputCanvas: HTMLCanvasElement;

    if (data instanceof HTMLCanvasElement) {
      inputCanvas = data;
      emitProgress('downloading', 20, 'Input ready');
      logInfo('[remove] Input is already a canvas');
    } else if (data instanceof HTMLImageElement) {
      const canvasStart = performance.now();
      inputCanvas = imageToCanvas(data);
      const canvasTime = performance.now() - canvasStart;
      logPerformance(
        `[remove] Image to canvas conversion: ${canvasTime.toFixed(2)}ms`
      );
      emitProgress('downloading', 20, 'Input ready');
    } else if (data instanceof File || data instanceof Blob) {
      emitProgress('downloading', 10, 'Loading image...');
      const fileStart = performance.now();
      const image = await fileToImage(data);
      const fileTime = performance.now() - fileStart;
      logPerformance(
        `[remove] File to image conversion: ${fileTime.toFixed(2)}ms`
      );

      const canvasStart = performance.now();
      inputCanvas = imageToCanvas(image);
      const canvasTime = performance.now() - canvasStart;
      logPerformance(
        `[remove] Image to canvas conversion: ${canvasTime.toFixed(2)}ms`
      );
      emitProgress('downloading', 20, 'Input ready');
    } else if (data instanceof ArrayBuffer) {
      emitProgress('downloading', 10, 'Loading image...');
      const bufferStart = performance.now();
      const image = await arrayBufferToImage(data);
      const bufferTime = performance.now() - bufferStart;
      logPerformance(
        `[remove] ArrayBuffer to image conversion: ${bufferTime.toFixed(2)}ms`
      );

      const canvasStart = performance.now();
      inputCanvas = imageToCanvas(image);
      const canvasTime = performance.now() - canvasStart;
      logPerformance(
        `[remove] Image to canvas conversion: ${canvasTime.toFixed(2)}ms`
      );
      emitProgress('downloading', 20, 'Input ready');
    } else {
      throw new Error(
        'Unsupported input type. Supported types: File, Blob, ArrayBuffer, HTMLImageElement, HTMLCanvasElement'
      );
    }

    const inputProcessingTime = performance.now() - inputProcessingStart;
    logPerformance(
      `[remove] Total input processing: ${inputProcessingTime.toFixed(2)}ms (${inputCanvas.width}x${inputCanvas.height})`
    );

    // Get or create session
    const sessionStart = performance.now();
    emitProgress('downloading', 30, 'Preparing model...');
    const session = options.session || (await newSession('u2net'));
    const sessionTime = performance.now() - sessionStart;
    logPerformance(`[remove] Session creation: ${sessionTime.toFixed(2)}ms`);

    // Run prediction to get masks
    const predictionStart = performance.now();
    emitProgress('processing', 40, 'Running AI model...');
    const masks = await session.predict(inputCanvas);
    const predictionTime = performance.now() - predictionStart;
    logPerformance(`[remove] Model prediction: ${predictionTime.toFixed(2)}ms`);

    if (masks.length === 0) {
      throw new Error('No masks generated from model');
    }

    emitProgress('processing', 70, 'Processing mask...');
    // Use the first mask
    let mask = masks[0];

    // Apply post-processing if requested
    if (options.postProcessMask) {
      const postProcessStart = performance.now();
      emitProgress('postprocessing', 80, 'Applying post-processing...');
      mask = postProcessMask(mask);
      const postProcessTime = performance.now() - postProcessStart;
      logPerformance(
        `[remove] Post-processing: ${postProcessTime.toFixed(2)}ms`
      );
    }

    // Return only mask if requested
    if (options.onlyMask) {
      const maskOnlyStart = performance.now();
      emitProgress('postprocessing', 90, 'Creating mask output...');
      const maskOnly = createMaskOnly(mask);
      const maskOnlyTime = performance.now() - maskOnlyStart;
      logPerformance(
        `[remove] Mask-only creation: ${maskOnlyTime.toFixed(2)}ms`
      );

      const blobStart = performance.now();
      const blob = await canvasToBlob(maskOnly, 'image/png');
      const blobTime = performance.now() - blobStart;
      logPerformance(
        `[remove] Canvas to blob conversion: ${blobTime.toFixed(2)}ms`
      );

      emitProgress('complete', 100, 'Complete');
      const totalTime = performance.now() - removeStartTime;
      logPerformance(
        `[remove] Total processing time (mask-only): ${totalTime.toFixed(2)}ms`
      );
      return blob;
    }

    // Create cutout
    const cutoutStart = performance.now();
    emitProgress('postprocessing', 85, 'Creating cutout...');
    let result = naiveCutout(inputCanvas, mask);
    const cutoutTime = performance.now() - cutoutStart;
    logPerformance(`[remove] Cutout creation: ${cutoutTime.toFixed(2)}ms`);

    // Apply background color if specified
    if (options.bgcolor) {
      const bgColorStart = performance.now();
      emitProgress('postprocessing', 90, 'Applying background color...');
      result = applyBackgroundColor(result, options.bgcolor);
      const bgColorTime = performance.now() - bgColorStart;
      logPerformance(
        `[remove] Background color application: ${bgColorTime.toFixed(2)}ms`
      );
    }

    // Convert to blob and return
    const finalBlobStart = performance.now();
    emitProgress('postprocessing', 95, 'Finalizing output...');
    const blob = await canvasToBlob(result, 'image/png');
    const finalBlobTime = performance.now() - finalBlobStart;
    logPerformance(
      `[remove] Final canvas to blob conversion: ${finalBlobTime.toFixed(2)}ms`
    );

    emitProgress('complete', 100, 'Complete');
    const totalTime = performance.now() - removeStartTime;
    logPerformance(`[remove] Total processing time: ${totalTime.toFixed(2)}ms`);
    return blob;
  } catch (error) {
    const totalTime = performance.now() - removeStartTime;
    console.error(
      `[remove] Processing failed (${totalTime.toFixed(2)}ms):`,
      error
    );

    // Emit error progress if callback is provided
    if (options.onProgress) {
      options.onProgress({
        step: 'complete',
        progress: 0,
        message: `Error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      });
    }
    throw error;
  }
}

/**
 * Remove background from an image and return as HTMLCanvasElement.
 *
 * Similar to the `remove()` function but returns a canvas instead of a blob.
 * This is useful when you need to perform additional canvas operations
 * or want to avoid the blob conversion overhead.
 *
 * @param data - Input image as File, Blob, ArrayBuffer, HTMLImageElement, or HTMLCanvasElement
 * @param options - Processing options
 * @returns Promise<HTMLCanvasElement> - Processed image as canvas with transparent background
 *
 * @example
 * ```typescript
 * // Get canvas for further processing
 * const canvas = await removeToCanvas(file);
 * const ctx = canvas.getContext('2d');
 * // Perform additional canvas operations...
 *
 * // Convert to blob when ready
 * const blob = await new Promise(resolve =>
 *   canvas.toBlob(resolve, 'image/png')
 * );
 * ```
 *
 * @throws {Error} When input type is not supported
 * @throws {Error} When model fails to generate masks
 * @throws {Error} When browser doesn't support required features (WASM, IndexedDB, etc.)
 */
export async function removeToCanvas(
  data: File | Blob | ArrayBuffer | HTMLImageElement | HTMLCanvasElement,
  options: RemoveOptions = {}
): Promise<HTMLCanvasElement> {
  const removeStartTime = performance.now();
  logInfo('[removeToCanvas] Starting background removal process...');

  const emitProgress = (
    step: ProgressInfo['step'],
    progress: number,
    message: string
  ) => {
    if (options.onProgress) {
      options.onProgress({ step, progress, message });
    }
  };

  try {
    emitProgress('downloading', 0, 'Initializing...');

    // Convert input to canvas
    const inputProcessingStart = performance.now();
    let inputCanvas: HTMLCanvasElement;

    if (data instanceof HTMLCanvasElement) {
      inputCanvas = data;
      emitProgress('downloading', 20, 'Input ready');
      logInfo('[removeToCanvas] Input is already a canvas');
    } else if (data instanceof HTMLImageElement) {
      const canvasStart = performance.now();
      inputCanvas = imageToCanvas(data);
      const canvasTime = performance.now() - canvasStart;
      logPerformance(
        `[removeToCanvas] Image to canvas conversion: ${canvasTime.toFixed(2)}ms`
      );
      emitProgress('downloading', 20, 'Input ready');
    } else if (data instanceof File || data instanceof Blob) {
      emitProgress('downloading', 10, 'Loading image...');
      const fileStart = performance.now();
      const image = await fileToImage(data);
      const fileTime = performance.now() - fileStart;
      logPerformance(
        `[removeToCanvas] File to image conversion: ${fileTime.toFixed(2)}ms`
      );

      const canvasStart = performance.now();
      inputCanvas = imageToCanvas(image);
      const canvasTime = performance.now() - canvasStart;
      logPerformance(
        `[removeToCanvas] Image to canvas conversion: ${canvasTime.toFixed(2)}ms`
      );
      emitProgress('downloading', 20, 'Input ready');
    } else if (data instanceof ArrayBuffer) {
      emitProgress('downloading', 10, 'Loading image...');
      const bufferStart = performance.now();
      const image = await arrayBufferToImage(data);
      const bufferTime = performance.now() - bufferStart;
      logPerformance(
        `[removeToCanvas] ArrayBuffer to image conversion: ${bufferTime.toFixed(2)}ms`
      );

      const canvasStart = performance.now();
      inputCanvas = imageToCanvas(image);
      const canvasTime = performance.now() - canvasStart;
      logPerformance(
        `[removeToCanvas] Image to canvas conversion: ${canvasTime.toFixed(2)}ms`
      );
      emitProgress('downloading', 20, 'Input ready');
    } else {
      throw new Error(
        'Unsupported input type. Supported types: File, Blob, ArrayBuffer, HTMLImageElement, HTMLCanvasElement'
      );
    }

    const inputProcessingTime = performance.now() - inputProcessingStart;
    logPerformance(
      `[removeToCanvas] Total input processing: ${inputProcessingTime.toFixed(2)}ms (${inputCanvas.width}x${inputCanvas.height})`
    );

    // Get or create session
    const sessionStart = performance.now();
    emitProgress('downloading', 30, 'Preparing model...');
    const session = options.session || (await newSession('u2net'));
    const sessionTime = performance.now() - sessionStart;
    logPerformance(
      `[removeToCanvas] Session creation: ${sessionTime.toFixed(2)}ms`
    );

    // Run prediction to get masks
    const predictionStart = performance.now();
    emitProgress('processing', 40, 'Running AI model...');
    const masks = await session.predict(inputCanvas);
    const predictionTime = performance.now() - predictionStart;
    logPerformance(
      `[removeToCanvas] Model prediction: ${predictionTime.toFixed(2)}ms`
    );

    if (masks.length === 0) {
      throw new Error('No masks generated from model');
    }

    emitProgress('processing', 70, 'Processing mask...');
    // Use the first mask
    let mask = masks[0];

    // Apply post-processing if requested
    if (options.postProcessMask) {
      const postProcessStart = performance.now();
      emitProgress('postprocessing', 80, 'Applying post-processing...');
      mask = postProcessMask(mask);
      const postProcessTime = performance.now() - postProcessStart;
      logPerformance(
        `[removeToCanvas] Post-processing: ${postProcessTime.toFixed(2)}ms`
      );
    }

    // Return only mask if requested
    if (options.onlyMask) {
      const maskOnlyStart = performance.now();
      emitProgress('postprocessing', 90, 'Creating mask output...');
      const result = createMaskOnly(mask);
      const maskOnlyTime = performance.now() - maskOnlyStart;
      logPerformance(
        `[removeToCanvas] Mask-only creation: ${maskOnlyTime.toFixed(2)}ms`
      );

      emitProgress('complete', 100, 'Complete');
      const totalTime = performance.now() - removeStartTime;
      logPerformance(
        `[removeToCanvas] Total processing time (mask-only): ${totalTime.toFixed(2)}ms`
      );
      return result;
    }

    // Create cutout
    const cutoutStart = performance.now();
    emitProgress('postprocessing', 85, 'Creating cutout...');
    let result = naiveCutout(inputCanvas, mask);
    const cutoutTime = performance.now() - cutoutStart;
    logPerformance(
      `[removeToCanvas] Cutout creation: ${cutoutTime.toFixed(2)}ms`
    );

    // Apply background color if specified
    if (options.bgcolor) {
      const bgColorStart = performance.now();
      emitProgress('postprocessing', 90, 'Applying background color...');
      result = applyBackgroundColor(result, options.bgcolor);
      const bgColorTime = performance.now() - bgColorStart;
      logPerformance(
        `[removeToCanvas] Background color application: ${bgColorTime.toFixed(2)}ms`
      );
    }

    emitProgress('complete', 100, 'Complete');
    const totalTime = performance.now() - removeStartTime;
    logPerformance(
      `[removeToCanvas] Total processing time: ${totalTime.toFixed(2)}ms`
    );
    return result;
  } catch (error) {
    const totalTime = performance.now() - removeStartTime;
    console.error(
      `[removeToCanvas] Processing failed (${totalTime.toFixed(2)}ms):`,
      error
    );

    // Emit error progress if callback is provided
    if (options.onProgress) {
      options.onProgress({
        step: 'complete',
        progress: 0,
        message: `Error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      });
    }
    throw error;
  }
}

/**
 * Create a new session for the specified model.
 *
 * Sessions are used to manage model loading, caching, and inference.
 * Creating a session upfront can improve performance when processing
 * multiple images with the same model.
 *
 * @param modelName - Name of the model to use (default: 'u2net')
 * @returns BaseSession instance for the specified model
 *
 * @example
 * ```typescript
 * // Create a session for reuse
 * const session = newSession('u2net');
 *
 * // Process multiple images with the same session
 * const result1 = await remove(image1, { session });
 * const result2 = await remove(image2, { session });
 * ```
 *
 * @throws {Error} When model name is not supported
 * @throws {Error} When model fails to load
 */
export { newSession };

/**
 * Get list of available model names.
 *
 * @returns Array of available model names
 *
 * @example
 * ```typescript
 * const models = getAvailableModels();
 * console.log('Available models:', models);
 * // Output: ['u2net', 'u2netp', 'u2net_human_seg', 'u2net_cloth_seg']
 * ```
 */
export { getAvailableModels } from './sessionFactory';

/**
 * Clear session cache.
 *
 * Removes all cached sessions from memory. This can help free up memory
 * when switching between different models or when memory usage is high.
 *
 * @example
 * ```typescript
 * // Clear all cached sessions
 * clearSessionCache();
 * ```
 */
export { clearSessionCache } from './sessionFactory';

/**
 * Dispose all cached sessions.
 *
 * Properly disposes of all cached sessions, freeing up memory and
 * cleaning up resources. This is more thorough than clearSessionCache()
 * as it also disposes of ONNX Runtime sessions.
 *
 * @example
 * ```typescript
 * // Dispose all sessions
 * disposeAllSessions();
 * ```
 */
export { disposeAllSessions } from './sessionFactory';

/**
 * Clear all cached models from IndexedDB.
 *
 * Removes cached model files from IndexedDB storage. This forces
 * models to be re-downloaded on next use, which can help with
 * corrupted cache or when you want to ensure you have the latest models.
 *
 * @param modelName - Optional specific model to clear (if not provided, clears all)
 *
 * @example
 * ```typescript
 * // Clear all cached models
 * clearModelCache();
 *
 * // Clear specific model
 * clearModelCacheForModel('u2net');
 * ```
 */
export { clearModelCache, clearModelCacheForModel } from './sessionFactory';

/**
 * Get cache statistics and performance metrics.
 *
 * Returns information about session cache performance including hit rates,
 * eviction counts, and current cache size.
 *
 * @returns Cache statistics object
 *
 * @example
 * ```typescript
 * const stats = getCacheStats();
 * console.log(`Cache hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
 * console.log(`Current sessions: ${stats.currentSessions}/${stats.maxSessions}`);
 * ```
 */
export { getCacheStats } from './sessionFactory';

/**
 * Configure cache settings.
 *
 * Allows you to adjust cache behavior including maximum number of
 * cached sessions and memory limits.
 *
 * @param options - Cache configuration options
 *
 * @example
 * ```typescript
 * // Limit cache to 3 sessions
 * configureCache({ maxSessions: 3 });
 *
 * // Set memory limit to 1GB
 * configureCache({ maxMemoryMB: 1024 });
 * ```
 */
export { configureCache } from './sessionFactory';

// Export types
export type { BaseSession } from './sessions/base';

// Export session classes
export { IsNetGeneralUseSession } from './sessions/isnet_general_use';
export {
  U2NetClothSegSession,
  U2NetClothSegOptions,
} from './sessions/u2net_cloth_seg';

// Export configuration
export { rembgConfig, RembgConfig } from './config';

// Export logging functions
export {
  enableGeneralLogging,
  enablePerformanceLogging,
  enableONNXProfiling,
  isGeneralLoggingEnabled,
  isPerformanceLoggingEnabled,
  isONNXProfilingEnabled,
} from './utils/logger';

const canvasTools = {
  imageToCanvas,
  canvasToBlob,
  fileToImage,
  arrayBufferToImage,
  naiveCutout,
  applyBackgroundColor,
  postProcessMask,
  createMaskOnly,
};
export { canvasTools };
// Export integrity utilities
export {
  verifyModelIntegrity,
  getModelHash,
  setModelHash,
  getAllModelHashes,
  validateModelSize,
  validateModel,
} from './utils/integrity';

// Export WebNN utilities
export {
  isWebNNAvailable,
  getExecutionProviders,
  validateWebNNConfig,
  getWebNNContextOptions,
  isWebNNDeviceSupported,
  getWebNNInfo,
  logWebNNInfo,
} from './utils/webnn';

// Export WebGPU utilities
export {
  isWebGPUAvailable,
  getWebGPUDevice,
  validateWebGPUConfig,
  getWebGPUContextOptions,
  getWebGPUInfo,
  logWebGPUInfo,
} from './utils/webgpu';

const version = '1.0.0';
export { version };
