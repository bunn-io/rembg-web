import { BaseSession, SessionOptions } from './base';
import { NormalizationParams } from '../utils/image';
import { rembgConfig } from '../config';

/**
 * U2Net Human Segmentation model session.
 *
 * Specialized version of U2Net trained specifically for human segmentation.
 * Provides superior results for images containing people, with better
 * edge detection and more accurate human body segmentation.
 *
 * @example
 * ```typescript
 * // Create a human segmentation session
 * const session = new U2NetHumanSegSession();
 *
 * // Or with custom options
 * const session = new U2NetHumanSegSession({
 *   preferWebNN: true,
 *   webnnDeviceType: 'gpu'
 * });
 *
 * // Initialize and use
 * await session.initialize();
 * const masks = await session.predict(imageCanvas);
 * ```
 */
export class U2NetHumanSegSession extends BaseSession {
  constructor(options?: SessionOptions) {
    super('u2net_human_seg', options);
  }

  /**
   * Get default model URL for U2Net Human Segmentation
   * Matches Python: downloads from GitHub releases
   */
  protected getDefaultModelUrl(): string {
    return `${rembgConfig.getBaseUrl()}/u2net_human_seg.onnx`;
  }

  /**
   * Get normalization parameters for U2Net Human Segmentation
   * Matches Python version exactly: mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225), size=(320, 320)
   */
  protected getNormalizationParams(): NormalizationParams {
    return {
      mean: [0.485, 0.456, 0.406],
      std: [0.229, 0.224, 0.225],
      size: [320, 320],
    };
  }

  /**
   * Get the input tensor name for U2Net Human Segmentation
   */
  protected getInputName(): string {
    if (this.session) {
      // Get the first input name dynamically like Python version
      return this.session.inputNames[0];
    }
    // Fallback to common input name for U2Net Human Segmentation models
    return 'input_image';
  }

  /**
   * Get the output shape for U2Net Human Segmentation
   */
  protected getOutputShape(): [number, number, number, number] {
    return [1, 1, 320, 320];
  }

  /**
   * Get model name
   * Matches Python: return "u2net_human_seg"
   */
  static getName(): string {
    return 'u2net_human_seg';
  }
}
