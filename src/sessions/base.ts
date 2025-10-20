import * as ort from 'onnxruntime-web';
import {
  normalizeImage,
  NormalizationParams,
  processModelOutput,
} from '../utils/image';
import { rembgConfig } from '../config';
import { validateModel } from '../utils/integrity';
import {
  getExecutionProviders,
  validateWebNNConfig,
  isWebNNAvailable,
} from '../utils/webnn';
import { isWebGPUAvailable, validateWebGPUConfig } from '../utils/webgpu';
import {
  logInfo,
  logPerformance,
  logWarn,
  logError,
  logDebug,
  Performance,
  PerformanceSync,
} from '../utils/logger';

/**
 * Configuration options for ONNX Runtime sessions.
 *
 * Provides comprehensive control over session behavior including hardware
 * acceleration, threading, and caching options.
 *
 * @example
 * ```typescript
 * const options: SessionOptions = {
 *   preferWebNN: true,
 *   webnnDeviceType: 'gpu',
 *   numThreads: 8,
 *   onProgress: (info) => console.log(`${info.step}: ${info.progress}%`)
 * };
 *
 * const session = await newSession('u2net', undefined, options);
 * ```
 */
export interface SessionOptions {
  /** Enable SIMD instructions for better performance */
  simd?: boolean;
  /** Enable proxy for WebAssembly */
  proxy?: boolean;
  /** Number of threads for ONNX Runtime */
  numThreads?: number;
  /** Explicit execution providers (overrides automatic selection) */
  executionProviders?: string[];
  // WebNN-specific options
  /** Enable WebNN if available */
  preferWebNN?: boolean;
  /** Preferred WebNN device type */
  webnnDeviceType?: 'cpu' | 'gpu' | 'npu';
  /** WebNN power preference */
  webnnPowerPreference?: 'default' | 'low-power' | 'high-performance';
  // WebGPU-specific options
  /** Enable WebGPU if available */
  preferWebGPU?: boolean;
  /** WebGPU power preference */
  webgpuPowerPreference?: 'default' | 'low-power' | 'high-performance';
  // Cache-bypass options
  /** Force new session creation even if cached */
  bypassSessionCache?: boolean;
  /** Force model re-download even if in IndexedDB */
  bypassModelCache?: boolean;
  /** Progress callback for session initialization */
  onProgress?: (info: {
    step: string;
    progress: number;
    message: string;
  }) => void;
}

// Default ONNX Runtime configuration
const defaultSessionOptions: SessionOptions = {
  simd: true, // Enable SIMD by default for better performance
  proxy: false,
  numThreads: 4, // Allow more threads by default
  // Don't set executionProviders here - let getExecutionProviders() handle it
};

// Configure ONNX Runtime Web for browser environment
function configureONNXRuntime(
  options: SessionOptions = defaultSessionOptions
): void {
  ort.env.wasm.simd = options.simd ?? defaultSessionOptions.simd;
  ort.env.wasm.proxy = options.proxy ?? defaultSessionOptions.proxy;
  ort.env.wasm.numThreads =
    options.numThreads ?? defaultSessionOptions.numThreads;
}

// Initialize with default configuration
configureONNXRuntime();

/**
 * Abstract base class for all ONNX model sessions.
 *
 * Provides common functionality for model loading, caching, and inference.
 * All specific model implementations (U2Net, ISNet, etc.) extend this class.
 *
 * @example
 * ```typescript
 * // Create a custom session class
 * class MyModelSession extends BaseSession {
 *   constructor(options?: SessionOptions) {
 *     super('my-model', options);
 *   }
 *
 *   protected getDefaultModelUrl(): string {
 *     return '/models/my-model.onnx';
 *   }
 *
 *   protected getNormalizationParams(): NormalizationParams {
 *     return { mean: [0.485, 0.456, 0.406], std: [0.229, 0.224, 0.225], size: [320, 320] };
 *   }
 *
 *   // ... implement other abstract methods
 * }
 * ```
 */
export abstract class BaseSession {
  protected modelName: string;
  protected session: ort.InferenceSession | null = null;
  protected modelData: ArrayBuffer | null = null;
  protected options: SessionOptions;

  constructor(modelName: string, options: SessionOptions = {}) {
    this.modelName = modelName;
    this.options = { ...defaultSessionOptions, ...options };

    // Ensure undefined values are replaced with defaults
    this.options.simd = this.options.simd ?? defaultSessionOptions.simd;
    this.options.proxy = this.options.proxy ?? defaultSessionOptions.proxy;
    this.options.numThreads =
      this.options.numThreads ?? defaultSessionOptions.numThreads;

    // Configure ONNX Runtime with these options
    configureONNXRuntime(this.options);
  }
  private emitProgress(step: string, progress: number, message: string): void {
    if (this.options.onProgress) {
      this.options.onProgress({ step, progress, message });
    }
  }
  /**
   * Initialize the ONNX session
   *
   * If ONNX profiling is enabled (via rembgConfig.enableONNXProfiling(true)),
   * ONNX Runtime will collect profiling data for each inference run.
   * Profiling data is automatically outputted to the console after each inference.
   */
  @Performance()
  async initialize(): Promise<void> {
    logInfo(`[${this.modelName}] Starting session initialization...`);
    this.emitProgress('initializing', 0, 'Starting session initialization...');
    if (this.session) {
      logInfo(`[${this.modelName}] Session already initialized, skipping`);
      this.emitProgress(
        'initializing',
        100,
        'Session already initialized, skipping'
      );
      return; // Already initialized
    }

    this.emitProgress('initializing', 20, 'Validating configuration...');
    await this.validateConfiguration();
    this.emitProgress('initializing', 50, 'Downloading model...');
    this.modelData = await this.downloadModel();
    this.emitProgress('initializing', 60, 'Setting up execution providers...');
    const executionProviders = await this.setupExecutionProviders();
    this.emitProgress('initializing', 80, 'Creating session...');
    await this.createSession(executionProviders);
    this.emitProgress('initializing', 100, 'Session initialized successfully');
  }

  /**
   * Validate WebNN and WebGPU configuration
   */
  @Performance()
  private async validateConfiguration(): Promise<void> {
    if (!validateWebNNConfig(this.options)) {
      logWarn('Invalid WebNN configuration, falling back to default providers');
    }
    if (!validateWebGPUConfig(this.options)) {
      logWarn(
        'Invalid WebGPU configuration, falling back to default providers'
      );
    }
  }

  /**
   * Setup execution providers and log availability
   */
  @Performance()
  private async setupExecutionProviders(): Promise<string[]> {
    const executionProviders = getExecutionProviders(this.options);

    // Log WebNN and WebGPU availability for debugging
    if (this.options.preferWebNN) {
      const webnnAvailable = isWebNNAvailable();
      logInfo(
        `WebNN requested: ${webnnAvailable ? 'Available' : 'Not Available'}`
      );
      if (webnnAvailable) {
        logInfo(`Using execution providers: ${executionProviders.join(', ')}`);
      }
    }
    if (this.options.preferWebGPU) {
      const webgpuAvailable = isWebGPUAvailable();
      logInfo(
        `WebGPU requested: ${webgpuAvailable ? 'Available' : 'Not Available'}`
      );
      if (webgpuAvailable) {
        logInfo(`Using execution providers: ${executionProviders.join(', ')}`);
      }
    }

    return executionProviders;
  }

  /**
   * Create ONNX session with fallback logic
   */
  @Performance()
  private async createSession(executionProviders: string[]): Promise<void> {
    let sessionCreated = false;
    let lastError: Error | null = null;

    if (!this.modelData) {
      throw new Error('Model data not found');
    }

    for (const provider of executionProviders) {
      try {
        logInfo(
          `[${this.modelName}] Attempting to create session with provider: ${provider}`
        );
        this.session = await ort.InferenceSession.create(this.modelData, {
          executionProviders: [provider],
          enableProfiling: rembgConfig.isONNXProfilingEnabled(),
        });
        logPerformance(
          `[${this.modelName}] Successfully created session with provider: ${provider}`
        );
        if (rembgConfig.isONNXProfilingEnabled()) {
          logInfo(
            `[${this.modelName}] ONNX profiling enabled - data will be logged after each inference`
          );
        }
        sessionCreated = true;
        break;
      } catch (error) {
        logWarn(
          `[${this.modelName}] Failed to create session with provider '${provider}':`,
          error
        );
        lastError = error as Error;
        continue;
      }
    }

    if (!sessionCreated) {
      throw new Error(
        `Failed to create ONNX session with any provider. Last error: ${lastError?.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Download model file with IndexedDB caching
   */
  @Performance()
  protected async downloadModel(): Promise<ArrayBuffer> {
    logInfo(`[${this.modelName}] Starting model download...`);

    // Check IndexedDB cache first (unless bypassed)
    if (!this.options.bypassModelCache) {
      try {
        this.emitProgress('downloading', 10, 'Checking cache...');
        const cachedModel = await this.getCachedModel();

        if (cachedModel) {
          logInfo(`[${this.modelName}] Using cached model: ${this.modelName}`);
          this.emitProgress('downloading', 100, 'Using cached model');
          return cachedModel;
        }
      } catch (error) {
        logWarn(
          `[${this.modelName}] IndexedDB cache unavailable, falling back to direct download:`,
          error
        );
      }
    } else {
      logInfo(
        `[${this.modelName}] Model cache bypassed, forcing fresh download`
      );
    }

    // Download model
    logInfo(`[${this.modelName}] Downloading model: ${this.modelName}`);
    const modelUrl = this.getModelUrl();
    this.emitProgress('downloading', 20, 'Starting download...');

    try {
      const response = await fetch(modelUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      logInfo(
        `[${this.modelName}] Model size: ${(total / (1024 * 1024)).toFixed(2)}MB`
      );

      if (total > 0) {
        this.emitProgress('downloading', 30, 'Downloading model...');

        const reader = response.body?.getReader();
        if (reader) {
          const chunks: Uint8Array[] = [];
          let received = 0;

          let done = false;
          while (!done) {
            const result = await reader.read();
            done = result.done;
            if (done || !result.value) break;
            const value = result.value;

            chunks.push(value);
            received += value.length;

            const progress = 30 + Math.round((received / total) * 60);
            this.emitProgress(
              'downloading',
              progress,
              `Downloading model... ${Math.round((received / total) * 100)}%`
            );
          }

          const modelData = new Uint8Array(received);
          let position = 0;
          for (const chunk of chunks) {
            modelData.set(chunk, position);
            position += chunk.length;
          }

          this.emitProgress('downloading', 90, 'Download complete');

          // Validate model integrity
          this.emitProgress('downloading', 95, 'Validating model...');
          const isValid = await validateModel(this.modelName, modelData.buffer);

          if (!isValid) {
            throw new Error(
              `Model integrity validation failed for ${this.modelName}`
            );
          }

          // Try to cache the model, but don't fail if IndexedDB is unavailable
          try {
            await this.cacheModel(modelData.buffer);
          } catch (cacheError) {
            logWarn(
              `[${this.modelName}] Failed to cache model, but download succeeded:`,
              cacheError
            );
          }

          this.emitProgress('downloading', 100, 'Model ready');
          return modelData.buffer;
        }
      }

      // Fallback to simple download if streaming is not available
      this.emitProgress('downloading', 50, 'Downloading model...');
      const modelData = await response.arrayBuffer();

      this.emitProgress('downloading', 90, 'Download complete');

      // Validate model integrity
      this.emitProgress('downloading', 95, 'Validating model...');
      const isValid = await validateModel(this.modelName, modelData);

      if (!isValid) {
        throw new Error(
          `Model integrity validation failed for ${this.modelName}`
        );
      }

      // Try to cache the model, but don't fail if IndexedDB is unavailable
      try {
        await this.cacheModel(modelData);
      } catch (cacheError) {
        logWarn(
          `[${this.modelName}] Failed to cache model, but download succeeded:`,
          cacheError
        );
      }

      this.emitProgress('downloading', 100, 'Model ready');
      return modelData;
    } catch (error) {
      logError(`[${this.modelName}] Model download failed:`, error);
      throw new Error(`Failed to download model ${this.modelName}: ${error}`);
    }
  }

  /**
   * Get cached model from IndexedDB
   */
  @Performance()
  private async getCachedModel(): Promise<ArrayBuffer | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('rembg-models', 2);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['models'], 'readonly');
        const store = transaction.objectStore('models');
        const getRequest = store.get(this.modelName);

        getRequest.onsuccess = () => {
          const result = getRequest.result;
          if (!result) {
            resolve(null);
            return;
          }

          // Check if the cached model version matches the current version
          const currentVersion = this.getModelVersion();
          const cachedVersion = result.version || '1.0.0'; // Default for old cached models

          if (cachedVersion !== currentVersion) {
            logDebug(
              `Model version mismatch for ${this.modelName}: cached=${cachedVersion}, current=${currentVersion}`
            );
            resolve(null); // Return null to force re-download
            return;
          }

          resolve(result.data || null);
        };

        getRequest.onerror = () => reject(getRequest.error);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('models')) {
          const store = db.createObjectStore('models', {
            keyPath: 'name',
          });
          store.createIndex('version', 'version', { unique: false });
        }
      };
    });
  }

  /**
   * Cache model in IndexedDB
   */
  @Performance()
  private async cacheModel(modelData: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('rembg-models', 2);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['models'], 'readwrite');
        const store = transaction.objectStore('models');
        const putRequest = store.put({
          name: this.modelName,
          data: modelData,
          timestamp: Date.now(),
          version: this.getModelVersion(),
        });

        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('models')) {
          const store = db.createObjectStore('models', {
            keyPath: 'name',
          });
          store.createIndex('version', 'version', { unique: false });
        }
      };
    });
  }

  /**
   * Get model URL for download
   * Uses the central config singleton to get the model path
   */
  protected getModelUrl(): string {
    const customPath = rembgConfig.getCustomModelPath(this.modelName);

    if (customPath && customPath !== '') {
      logInfo(`Using custom model path for ${this.modelName}: ${customPath}`);
      return customPath;
    }

    // Fall back to default implementation
    return this.getDefaultModelUrl();
  }

  /**
   * Get default model URL for download (to be implemented by subclasses)
   */
  protected abstract getDefaultModelUrl(): string;

  /**
   * Get normalization parameters for this model
   */
  protected abstract getNormalizationParams(): NormalizationParams;

  /**
   * Get the input tensor name for this model
   */
  protected abstract getInputName(): string;

  /**
   * Get the output shape for this model
   */
  protected abstract getOutputShape(): [number, number, number, number];

  /**
   * Get the model version for cache invalidation
   */
  protected getModelVersion(): string {
    return '1.0.0'; // Default version, can be overridden by subclasses
  }

  @PerformanceSync()
  prepareInput(imageCanvas: HTMLCanvasElement): {
    [inputName: string]: ort.Tensor;
  } {
    return normalizeImage(
      imageCanvas,
      this.getNormalizationParams(),
      this.getInputName()
    );
  }

  @Performance()
  async runInference(input: {
    [inputName: string]: ort.Tensor;
  }): Promise<ort.InferenceSession.OnnxValueMapType> {
    if (!this.session) {
      throw new Error('Session not initialized');
    }
    const results = await this.session.run(input);
    if (rembgConfig.isONNXProfilingEnabled()) {
      try {
        this.session.endProfiling();
        logInfo(`[${this.modelName}] ONNX profiling data outputted to console`);
      } catch (error) {
        logWarn(`[${this.modelName}] Failed to collect profiling data:`, error);
      }
    }
    return results;
  }

  /**
   * Predict masks for input image
   */
  @Performance()
  async predict(imageCanvas: HTMLCanvasElement): Promise<HTMLCanvasElement[]> {
    logInfo(
      `[${this.modelName}] Starting prediction for ${imageCanvas.width}x${imageCanvas.height} image...`
    );

    if (!this.session) {
      await this.initialize();
    }

    if (!this.session) {
      throw new Error('Session not initialized');
    }

    // Normalize image for model input
    const input = this.prepareInput(imageCanvas);

    // Run inference
    const results = await this.runInference(input);
    const masks = this.outputToMaskArray(results);
    logInfo(`[${this.modelName}] Predicted ${masks.length} masks`);
    return masks.map(mask =>
      this.maskArrayToMaskCanvas(mask, {
        width: imageCanvas.width,
        height: imageCanvas.height,
      })
    );
  }

  /**
   * generic model output processing
   *
   * Most models output a single tensor with shape [1, 1, height, width]
   * This method extracts the data from the tensor and returns it as a Float32Array
   * @param outputs - Model outputs
   * @returns [Mask array]
   */
  @PerformanceSync()
  outputToMaskArray(
    outputs: ort.InferenceSession.OnnxValueMapType
  ): Float32Array[] {
    const outputTensor = outputs[Object.keys(outputs)[0]] as ort.Tensor;
    const outputData = outputTensor.data as Float32Array;

    return [outputData];
  }

  /**
   * Generic mask array to mask canvas processing
   *
   * Most models just normalize, resize
   * and return the result as a mask canvas.
   *
   * @param maskArray - Model output mask array
   * @param originalSize - Original image dimensions for resizing
   * @returns HTMLCanvasElement
   */
  @PerformanceSync()
  maskArrayToMaskCanvas(
    maskArray: Float32Array,
    originalSize: { width: number; height: number }
  ): HTMLCanvasElement {
    return processModelOutput(maskArray, originalSize, this.getOutputShape());
  }

  /**
   * Get model name
   */
  static getName(): string {
    throw new Error('getName() must be implemented by subclass');
  }

  /**
   * Get model name (instance method)
   */
  getName(): string {
    return this.modelName;
  }

  /**
   * Get session options
   */
  getOptions(): SessionOptions {
    return { ...this.options };
  }

  /**
   * Dispose of resources
   */
  async dispose(): Promise<void> {
    if (this.session) {
      await this.session.release();
      this.session = null;
    }
    this.modelData = null;
  }

  /**
   * Clear all cached models from IndexedDB
   */
  static async clearCache(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.deleteDatabase('rembg-models');

        request.onsuccess = () => {
          logInfo('Model cache cleared successfully');
          resolve();
        };
        request.onerror = () => {
          logWarn('Failed to clear model cache:', request.error);
          reject(request.error);
        };
      } catch (error) {
        logWarn('IndexedDB not available for cache clearing:', error);
        reject(error);
      }
    });
  }

  /**
   * Clear cache for a specific model
   */
  static async clearModelCache(modelName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open('rembg-models', 2);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['models'], 'readwrite');
          const store = transaction.objectStore('models');
          const deleteRequest = store.delete(modelName);

          deleteRequest.onsuccess = () => {
            logInfo(`Model cache cleared for ${modelName}`);
            resolve();
          };
          deleteRequest.onerror = () => reject(deleteRequest.error);
        };

        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('models')) {
            const store = db.createObjectStore('models', {
              keyPath: 'name',
            });
            store.createIndex('version', 'version', {
              unique: false,
            });
          }
        };
      } catch (error) {
        logWarn('IndexedDB not available for cache clearing:', error);
        reject(error);
      }
    });
  }
}
