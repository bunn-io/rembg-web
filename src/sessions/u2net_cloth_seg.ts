import * as ort from 'onnxruntime-web';
import { BaseSession, SessionOptions } from './base';
import { NormalizationParams, normalizeImage } from '../utils/image';
import { logInfo, logPerformance } from '../utils/logger';
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
        return 'input';
    }

    /**
     * Get the output shape for U2Net Cloth Segmentation
     */
    protected getOutputShape(): [number, number, number, number] {
        return [1, 3, 768, 768];
    }

    /**
     * Override predict method to handle different input tensor name
     */
    async predict(
        imageCanvas: HTMLCanvasElement
    ): Promise<HTMLCanvasElement[]> {
        if (!this.session) {
            await this.initialize();
        }

        if (!this.session) {
            throw new Error('Session not initialized');
        }

        // Normalize image for model input
        const normalized = normalizeImage(
            imageCanvas,
            this.getNormalizationParams(),
            this.getInputName()
        );

        // Run inference
        const results = await this.session.run(normalized);

        // Process outputs
        return this.processOutputs(results, {
            width: imageCanvas.width,
            height: imageCanvas.height,
        });
    }

    /**
     * Process U2Net Cloth Segmentation model outputs to create masks
     * This follows the Python implementation: log_softmax + argmax
     */
    protected processOutputs(
        outputs: ort.InferenceSession.OnnxValueMapType,
        originalSize: { width: number; height: number }
    ): HTMLCanvasElement[] {
        const startTime = performance.now();
        logInfo(
            `[u2net_cloth_seg] Processing outputs for ${originalSize.width}x${originalSize.height} image...`
        );

        // U2Net Cloth Segmentation outputs a tensor with shape [1, 3, 768, 768]
        // Python: pred = ort_outs, pred = log_softmax(pred[0], 1), pred = np.argmax(pred, axis=1, keepdims=True)
        const outputTensor = outputs[Object.keys(outputs)[0]] as ort.Tensor;
        const outputData = outputTensor.data as Float32Array;

        // Get dimensions: [batch, channels, height, width]
        const [, channels, height, width] = outputTensor.dims;
        logInfo(
            `[u2net_cloth_seg] Output tensor shape: [1, ${channels}, ${height}, ${width}]`
        );

        // Apply log_softmax along channel dimension (axis=1)
        const logSoftmaxStart = performance.now();
        const logSoftmaxData = this.logSoftmax(
            outputData,
            channels,
            height * width
        );
        const logSoftmaxTime = performance.now() - logSoftmaxStart;
        logPerformance(
            `[u2net_cloth_seg] Log softmax: ${logSoftmaxTime.toFixed(2)}ms`
        );

        // Apply argmax along channel dimension
        const argmaxStart = performance.now();
        const argmaxData = this.argmax(
            logSoftmaxData,
            channels,
            height * width
        );
        const argmaxTime = performance.now() - argmaxStart;
        logPerformance(`[u2net_cloth_seg] Argmax: ${argmaxTime.toFixed(2)}ms`);

        // Create 3 separate binary masks for each cloth category
        const masks: HTMLCanvasElement[] = [];
        const maskCreationStart = performance.now();

        // Create masks for each category (upper=1, lower=2, full=3)
        for (let categoryIndex = 1; categoryIndex <= 3; categoryIndex++) {
            const categoryStart = performance.now();
            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = width;
            maskCanvas.height = height;
            const maskCtx = maskCanvas.getContext('2d');
            if (!maskCtx) {
                throw new Error('Failed to get context for mask canvas');
            }
            const maskImageData = maskCtx.createImageData(width, height);

            // Create binary mask for this category
            for (let i = 0; i < argmaxData.length; i++) {
                const value = argmaxData[i] === categoryIndex ? 255 : 0;
                const pixelIndex = i * 4;
                maskImageData.data[pixelIndex] = value; // R
                maskImageData.data[pixelIndex + 1] = value; // G
                maskImageData.data[pixelIndex + 2] = value; // B
                maskImageData.data[pixelIndex + 3] = 255; // A
            }

            maskCtx.putImageData(maskImageData, 0, 0);

            // Resize to original image size
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

            masks.push(resizedCanvas);
            const categoryTime = performance.now() - categoryStart;
            logPerformance(
                `[u2net_cloth_seg] Category ${categoryIndex} mask creation: ${categoryTime.toFixed(2)}ms`
            );
        }

        const maskCreationTime = performance.now() - maskCreationStart;
        logPerformance(
            `[u2net_cloth_seg] All mask creation: ${maskCreationTime.toFixed(2)}ms`
        );

        let runTime = 0;
        // Filter masks based on cloth category setting
        switch (this.clothCategory) {
            case 'upper':
                runTime = performance.now() - startTime;
                logPerformance(
                    `[u2net_cloth_seg] Total output processing (upper): ${runTime.toFixed(2)}ms`
                );
                return [masks[0]]; // upper cloth (index 0)
            case 'lower':
                runTime = performance.now() - startTime;
                logPerformance(
                    `[u2net_cloth_seg] Total output processing (lower): ${runTime.toFixed(2)}ms`
                );
                return [masks[1]]; // lower cloth (index 1)
            case 'full':
                runTime = performance.now() - startTime;
                logPerformance(
                    `[u2net_cloth_seg] Total output processing (full): ${runTime.toFixed(2)}ms`
                );
                return [masks[2]]; // full body cloth (index 2)
            case 'all':
                runTime = performance.now() - startTime;
                logPerformance(
                    `[u2net_cloth_seg] Total output processing (all): ${runTime.toFixed(2)}ms`
                );
                return masks; // all 3 masks
            case 'combined':
                /*eslint-disable no-case-declarations */
                // Combine all masks into one
                runTime = performance.now();
                logInfo('[u2net_cloth_seg] Creating combined mask...');

                const combinedCanvas = document.createElement('canvas');
                combinedCanvas.width = originalSize.width;
                combinedCanvas.height = originalSize.height;
                const combinedCtx = combinedCanvas.getContext('2d');
                if (!combinedCtx) {
                    throw new Error(
                        'Failed to get context for combined canvas'
                    );
                }

                // Create a combined mask by OR-ing all individual masks
                const combinedImageData = combinedCtx.createImageData(
                    originalSize.width,
                    originalSize.height
                );

                // Initialize with zeros
                runTime = performance.now();
                for (let i = 0; i < combinedImageData.data.length; i += 4) {
                    combinedImageData.data[i] = 0; // R
                    combinedImageData.data[i + 1] = 0; // G
                    combinedImageData.data[i + 2] = 0; // B
                    combinedImageData.data[i + 3] = 255; // A
                }
                const initTime = performance.now() - runTime;
                logPerformance(
                    `[u2net_cloth_seg] Combined mask initialization: ${initTime.toFixed(2)}ms`
                );

                // Combine all masks by taking the maximum value at each pixel
                const combineStart = performance.now();
                for (let maskIndex = 0; maskIndex < masks.length; maskIndex++) {
                    const maskCtx = masks[maskIndex].getContext('2d');
                    if (!maskCtx) continue;

                    const maskImageData = maskCtx.getImageData(
                        0,
                        0,
                        originalSize.width,
                        originalSize.height
                    );

                    for (let i = 0; i < maskImageData.data.length; i += 4) {
                        const maskValue = maskImageData.data[i]; // Use R channel as the mask value
                        const currentValue = combinedImageData.data[i];

                        // Take the maximum value (OR operation for binary masks)
                        const combinedValue = Math.max(currentValue, maskValue);
                        combinedImageData.data[i] = combinedValue; // R
                        combinedImageData.data[i + 1] = combinedValue; // G
                        combinedImageData.data[i + 2] = combinedValue; // B
                        // Alpha stays 255
                    }
                }
                const combineTime = performance.now() - combineStart;
                logPerformance(
                    `[u2net_cloth_seg] Mask combination: ${combineTime.toFixed(2)}ms`
                );

                const putImageStart = performance.now();
                combinedCtx.putImageData(combinedImageData, 0, 0);
                const putImageTime = performance.now() - putImageStart;
                logPerformance(
                    `[u2net_cloth_seg] Combined mask putImageData: ${putImageTime.toFixed(2)}ms`
                );

                const combinedTime = performance.now() - runTime;
                logPerformance(
                    `[u2net_cloth_seg] Total combined mask creation: ${combinedTime.toFixed(2)}ms`
                );

                const totalCombinedTime = performance.now() - startTime;
                logPerformance(
                    `[u2net_cloth_seg] Total output processing (combined): ${totalCombinedTime.toFixed(2)}ms`
                );

                return [combinedCanvas];
            /*eslint-enable no-case-declarations */
            default:
                runTime = performance.now() - startTime;
                logPerformance(
                    `[u2net_cloth_seg] Total output processing: ${runTime.toFixed(2)}ms`
                );
                return masks; // all 3 masks
        }
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
                result[c * spatialSize + i] =
                    data[c * spatialSize + i] - logSumExp;
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
