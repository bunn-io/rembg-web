import * as ort from 'onnxruntime-web';
import { BaseSession, SessionOptions } from './base';
import { NormalizationParams, processModelOutput } from '../utils/image';
import { rembgConfig } from '../config';

/**
 * Options for U2Net cloth segmentation.
 *
 * @example
 * ```typescript
 * const options: U2NetClothSegOptions = {
 *   clothCategory: 'upper'
 * };
 * ```
 */
export interface U2NetClothSegOptions {
  /** Category of clothing to segment */
  clothCategory?: 'upper' | 'lower' | 'full' | 'all';
}

/**
 * U2Net Cloth Segmentation model session.
 *
 * Specialized version of U2Net trained for clothing segmentation.
 * Can segment different types of clothing (upper body, lower body, full body)
 * and is particularly useful for fashion applications and clothing analysis.
 *
 * @example
 * ```typescript
 * // Create a cloth segmentation session
 * const session = new U2NetClothSegSession();
 *
 * // Set clothing category
 * session.setClothCategory('upper');
 *
 * // Initialize and use
 * await session.initialize();
 * const masks = await session.predict(imageCanvas);
 * ```
 */
export class U2NetClothSegSession extends BaseSession {
  private clothCategory: 'upper' | 'lower' | 'full' | 'all' | 'combined' =
    'combined';

  constructor(options?: SessionOptions) {
    super('u2net_cloth_seg', options);
  }

  /**
   * Set the cloth category filter for this session
   */
  setClothCategory(
    category: 'upper' | 'lower' | 'full' | 'all' | 'combined'
  ): void {
    this.clothCategory = category;
  }

  /**
   * Get the current cloth category setting
   */
  getClothCategory(): 'upper' | 'lower' | 'full' | 'all' | 'combined' {
    return this.clothCategory;
  }

  /**
   * Get default model URL for U2Net Cloth Segmentation
   * Matches Python: downloads from GitHub releases
   */
  protected getDefaultModelUrl(): string {
    return `${rembgConfig.getBaseUrl()}/u2net_cloth_seg.onnx`;
  }

  /**
   * Get normalization parameters for U2Net Cloth Segmentation
   * This model uses 768x768 input size, not 320x320 like other U2Net models
   */
  protected getNormalizationParams(): NormalizationParams {
    return {
      mean: [0.485, 0.456, 0.406],
      std: [0.229, 0.224, 0.225],
      size: [768, 768],
    };
  }

  /**
   * Get the input tensor name for U2Net Cloth Segmentation
   */
  protected getInputName(): string {
    if (this.session) {
      // Get the first input name dynamically like Python version
      return this.session.inputNames[0];
    }
    // Fallback to common input name for U2Net Cloth Segmentation models
    return 'input_image';
  }

  /**
   * Get the output shape for U2Net Cloth Segmentation
   */
  protected getOutputShape(): [number, number, number, number] {
    return [1, 3, 768, 768];
  }

  /**
   * Process U2Net Cloth Segmentation model outputs to create masks as Float32Array
   * Returns 3 masks: upper, lower, and full body cloth segmentation
   */
  outputToMaskArray(
    outputs: ort.InferenceSession.OnnxValueMapType
  ): Float32Array[] {
    const outputTensor = outputs[Object.keys(outputs)[0]] as ort.Tensor;
    const outputData = outputTensor.data as Float32Array;

    // Get dimensions: [batch, channels, height, width]
    const [, channels, height, width] = outputTensor.dims;

    // Apply log_softmax along channel dimension (axis=1)
    const logSoftmaxData = this.logSoftmax(
      outputData,
      channels,
      height * width
    );

    // Apply argmax along channel dimension
    const argmaxData = this.argmax(logSoftmaxData, channels, height * width);

    // Create 3 separate binary masks for each cloth category as Float32Array
    const masks: Float32Array[] = [];

    // Create masks for each category (upper=1, lower=2, full=3)
    for (let categoryIndex = 1; categoryIndex <= 3; categoryIndex++) {
      const maskData = new Float32Array(height * width);

      // Create binary mask for this category
      // For compatiblity with the general normalization process, we use 255.5 instead of 1.0
      // This way we won't have to implement custom mask creation logic for this model.
      for (let i = 0; i < argmaxData.length; i++) {
        maskData[i] = argmaxData[i] === categoryIndex ? 255.5 : 0.0;
      }

      masks.push(maskData);
    }

    return masks;
  }

  /**
   * Process mask array to create mask canvas
   * @param maskArray - Model output mask array
   * @param originalSize - Original image dimensions for resizing
   * @returns HTMLCanvasElement
   */
  maskArrayToMaskCanvas(
    maskArray: Float32Array,
    originalSize: { width: number; height: number }
  ): HTMLCanvasElement {
    return processModelOutput(maskArray, originalSize, this.getOutputShape());
  }

  /**
   * Apply log_softmax along channel dimension
   * Equivalent to scipy.special.log_softmax(pred[0], 1)
   */
  private logSoftmax(
    data: Float32Array,
    channels: number,
    spatialSize: number
  ): Float32Array {
    const result = new Float32Array(data.length);

    for (let i = 0; i < spatialSize; i++) {
      // Find max value across channels for numerical stability
      let maxVal = data[i];
      for (let c = 1; c < channels; c++) {
        maxVal = Math.max(maxVal, data[c * spatialSize + i]);
      }

      // Compute sum of exp values
      let sumExp = 0;
      for (let c = 0; c < channels; c++) {
        sumExp += Math.exp(data[c * spatialSize + i] - maxVal);
      }

      // Compute log_softmax
      const logSumExp = Math.log(sumExp) + maxVal;
      for (let c = 0; c < channels; c++) {
        result[c * spatialSize + i] = data[c * spatialSize + i] - logSumExp;
      }
    }

    return result;
  }

  /**
   * Apply argmax along channel dimension
   * Equivalent to np.argmax(pred, axis=1, keepdims=True)
   */
  private argmax(
    data: Float32Array,
    channels: number,
    spatialSize: number
  ): Uint8Array {
    const result = new Uint8Array(spatialSize);

    for (let i = 0; i < spatialSize; i++) {
      let maxVal = data[i];
      let maxIndex = 0;

      for (let c = 1; c < channels; c++) {
        const val = data[c * spatialSize + i];
        if (val > maxVal) {
          maxVal = val;
          maxIndex = c;
        }
      }

      result[i] = maxIndex;
    }

    return result;
  }

  /**
   * Get model name
   * Matches Python: return "u2net_cloth_seg"
   */
  static getName(): string {
    return 'u2net_cloth_seg';
  }
}
