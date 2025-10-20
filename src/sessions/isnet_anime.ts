import { BaseSession, SessionOptions } from './base';
import { NormalizationParams } from '../utils/image';
import { rembgConfig } from '../config';

/**
 * ISNet Anime model session for anime/manga background removal.
 *
 * Specialized version of ISNet trained specifically for anime and manga images.
 * Provides superior results for animated content with better preservation
 * of artistic details and cleaner edge detection.
 *
 * @example
 * ```typescript
 * // Create an ISNet anime session
 * const session = new IsNetAnimeSession();
 *
 * // Or with custom options
 * const session = new IsNetAnimeSession({
 *   preferWebNN: true,
 *   webnnDeviceType: 'gpu'
 * });
 *
 * // Initialize and use
 * await session.initialize();
 * const masks = await session.predict(imageCanvas);
 * ```
 */
export class IsNetAnimeSession extends BaseSession {
  constructor(options?: SessionOptions) {
    super('isnet-anime', options);
  }

  /**
   * Get default model URL for ISNet Anime
   */
  protected getDefaultModelUrl(): string {
    return `${rembgConfig.getBaseUrl()}/isnet-anime.onnx`;
  }

  /**
   * Get normalization parameters for ISNet Anime
   * These match the Python version: mean=(0.485, 0.456, 0.406), std=(1.0, 1.0, 1.0)
   * DIS models use larger input size: 1024x1024
   */
  protected getNormalizationParams(): NormalizationParams {
    return {
      mean: [0.485, 0.456, 0.406],
      std: [1.0, 1.0, 1.0],
      size: [1024, 1024],
    };
  }

  /**
   * Get the input tensor name for ISNet Anime
   * Uses dynamic input name like Python version: self.inner_session.get_inputs()[0].name
   */
  protected getInputName(): string {
    if (this.session) {
      // Get the first input name dynamically like Python version
      return this.session.inputNames[0];
    }
    // Fallback to common input name for ISNet models
    return 'input_image';
  }

  /**
   * Get the output shape for ISNet Anime
   */
  protected getOutputShape(): [number, number, number, number] {
    return [1, 1, 1024, 1024];
  }

  /**
   * Get model name
   */
  static getName(): string {
    return 'isnet-anime';
  }
}
