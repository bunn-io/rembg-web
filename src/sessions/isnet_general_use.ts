import * as ort from 'onnxruntime-web';
import { BaseSession, SessionOptions } from './base';
import { NormalizationParams } from '../utils/image';
import { logInfo, logPerformance } from '../utils/logger';
import { rembgConfig } from '../config';

/**
 * ISNet General Use model session for high-quality background removal.
 *
 * ISNet (Interactive Segmentation Network) provides superior quality
 * background removal with better edge detection and detail preservation.
 * Uses larger input resolution (1024x1024) for higher quality results.
 *
 * @example
 * ```typescript
 * // Create an ISNet session
 * const session = new IsNetGeneralUseSession();
 *
 * // Or with custom options
 * const session = new IsNetGeneralUseSession({
 *   preferWebNN: true,
 *   webnnDeviceType: 'gpu'
 * });
 *
 * // Initialize and use
 * await session.initialize();
 * const masks = await session.predict(imageCanvas);
 * ```
 */
export class IsNetGeneralUseSession extends BaseSession {
    constructor(options?: SessionOptions) {
        super('isnet-general-use', options);
    }

    /**
     * Get default model URL for ISNet General Use
     */
    protected getDefaultModelUrl(): string {
        return `${rembgConfig.getBaseUrl()}/isnet-general-use.onnx`;
    }

    /**
     * Get normalization parameters for ISNet General Use
     * These match the Python version: mean=(0.5, 0.5, 0.5), std=(1.0, 1.0, 1.0)
     * DIS models use larger input size: 1024x1024
     */
    protected getNormalizationParams(): NormalizationParams {
        return {
            mean: [0.5, 0.5, 0.5],
            std: [1.0, 1.0, 1.0],
            size: [1024, 1024],
        };
    }

    /**
     * Get the input tensor name for ISNet General Use
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
     * Get the output shape for ISNet General Use
     */
    protected getOutputShape(): [number, number, number, number] {
        return [1, 1, 1024, 1024];
    }

    /**
     * Process ISNet General Use model outputs to create masks
     * Uses min-max normalization like the Python version
     */
    protected processOutputs(
        outputs: ort.InferenceSession.OnnxValueMapType,
        originalSize: { width: number; height: number }
    ): HTMLCanvasElement[] {
        const startTime = performance.now();
        logInfo(
            `[isnet-general-use] Processing outputs for ${originalSize.width}x${originalSize.height} image...`
        );

        // ISNet outputs a single tensor with shape [1, 1, 1024, 1024]
        const outputTensor = outputs[Object.keys(outputs)[0]] as ort.Tensor;
        const outputData = outputTensor.data as Float32Array;

        // Extract the first channel like Python: pred = ort_outs[0][:, 0, :, :]
        const [, , height, width] = this.getOutputShape();
        const channelData = new Float32Array(height * width);

        // Extract first channel (index 0) from the output
        const extractStart = performance.now();
        for (let i = 0; i < height * width; i++) {
            channelData[i] = outputData[i];
        }
        const extractTime = performance.now();
        logPerformance(
            `[isnet-general-use] Channel extraction: ${(extractTime - extractStart).toFixed(2)}ms`
        );

        // Apply min-max normalization like Python version
        const minMaxStart = performance.now();
        let min = channelData[0];
        let max = channelData[0];
        for (let i = 1; i < channelData.length; i++) {
            if (channelData[i] < min) min = channelData[i];
            if (channelData[i] > max) max = channelData[i];
        }
        const minMaxTime = performance.now();
        logPerformance(
            `[isnet-general-use] Min/max calculation: ${(minMaxTime - minMaxStart).toFixed(2)}ms (min=${min.toFixed(6)}, max=${max.toFixed(6)})`
        );

        // Normalize to 0-1 range: pred = (pred - mi) / (ma - mi)
        const normalizeStart = performance.now();
        const normalized = new Float32Array(channelData.length);
        for (let i = 0; i < channelData.length; i++) {
            normalized[i] = (channelData[i] - min) / (max - min);
        }
        const normalizeTime = performance.now();
        logPerformance(
            `[isnet-general-use] Normalization: ${(normalizeTime - normalizeStart).toFixed(2)}ms`
        );

        // Create mask canvas
        const canvasCreateStart = performance.now();
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = width;
        maskCanvas.height = height;
        const maskCtx = maskCanvas.getContext('2d');
        if (!maskCtx) {
            throw new Error('Failed to get context for mask canvas');
        }
        const maskImageData = maskCtx.createImageData(width, height);

        // Convert to grayscale image: (pred * 255).astype("uint8")
        for (let i = 0; i < normalized.length; i++) {
            const value = Math.round(normalized[i] * 255);
            const pixelIndex = i * 4;
            maskImageData.data[pixelIndex] = value; // R
            maskImageData.data[pixelIndex + 1] = value; // G
            maskImageData.data[pixelIndex + 2] = value; // B
            maskImageData.data[pixelIndex + 3] = 255; // A
        }
        const canvasCreateTime = performance.now();
        logPerformance(
            `[isnet-general-use] Canvas creation: ${(canvasCreateTime - canvasCreateStart).toFixed(2)}ms`
        );

        const putImageStart = performance.now();
        maskCtx.putImageData(maskImageData, 0, 0);
        const putImageTime = performance.now();
        logPerformance(
            `[isnet-general-use] Put image data: ${(putImageTime - putImageStart).toFixed(2)}ms`
        );

        // Resize to original image size like Python: mask.resize(img.size, Image.Resampling.LANCZOS)
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
        const resizeEnd = performance.now();
        logPerformance(
            `[isnet-general-use] Mask resize: ${(resizeEnd - resizeStart).toFixed(2)}ms (${width}x${height} → ${originalSize.width}x${originalSize.height})`
        );

        const totalTime = performance.now() - startTime;
        logPerformance(
            `[isnet-general-use] Total output processing: ${totalTime.toFixed(2)}ms`
        );

        return [resizedCanvas];
    }

    /**
     * Get model name
     */
    static getName(): string {
        return 'isnet-general-use';
    }
}
