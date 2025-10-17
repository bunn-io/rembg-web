import * as ort from 'onnxruntime-web';
import { BaseSession, SessionOptions } from './base';
import {
    NormalizationParams,
    processModelOutput,
    normalizeImage,
} from '../utils/image';
import { rembgConfig } from '../config';
import { logDebug } from '../utils/logger';

/**
 * Configuration for custom U2Net models.
 *
 * Allows you to use your own trained U2Net models with custom parameters.
 *
 * @example
 * ```typescript
 * const config: U2NetCustomConfig = {
 *   modelPath: '/models/my-custom-model.onnx',
 *   inputSize: [512, 512],
 *   mean: [0.485, 0.456, 0.406],
 *   std: [0.229, 0.224, 0.225],
 *   inputName: 'input'
 * };
 *
 * const session = new U2NetCustomSession(config);
 * ```
 */
export interface U2NetCustomConfig {
    /** Path to the custom ONNX model file */
    modelPath: string;
    /** Input size [width, height] for the model (default: [320, 320]) */
    inputSize?: [number, number];
    /** Mean values for normalization (default: ImageNet values) */
    mean?: [number, number, number];
    /** Standard deviation values for normalization (default: ImageNet values) */
    std?: [number, number, number];
    /** Input tensor name (default: 'input.1') */
    inputName?: string;
}

/**
 * Custom U2Net model session for user-provided models.
 *
 * Allows you to use your own trained U2Net models with custom parameters.
 * The model must be compatible with the U2Net architecture and exported as ONNX.
 *
 * @example
 * ```typescript
 * const config: U2NetCustomConfig = {
 *   modelPath: '/models/my-model.onnx',
 *   inputSize: [512, 512]
 * };
 *
 * const session = new U2NetCustomSession(config, {
 *   preferWebNN: true
 * });
 *
 * await session.initialize();
 * const masks = await session.predict(imageCanvas);
 * ```
 *
 * @throws {Error} When modelPath is not provided in config
 */
export class U2NetCustomSession extends BaseSession {
    private config: U2NetCustomConfig;

    constructor(config: U2NetCustomConfig, options?: SessionOptions) {
        super('u2net_custom', options);
        this.config = config;

        // Validate required config
        if (!config.modelPath) {
            throw new Error('u2net_custom requires modelPath in config');
        }
    }

    /**
     * Get model URL for U2Net Custom
     * Uses the central config singleton first, then falls back to user-provided model path
     */
    protected getModelUrl(): string {
        const customPath = rembgConfig.getCustomModelPath(this.modelName);

        if (customPath && customPath !== '') {
            logDebug(
                `Using custom model path from config for ${this.modelName}: ${customPath}`
            );
            return customPath;
        }

        // Fall back to user-provided model path
        return this.config.modelPath;
    }

    /**
     * Get default model URL for U2Net Custom (not used, but required by base class)
     */
    protected getDefaultModelUrl(): string {
        return this.config.modelPath;
    }

    /**
     * Get normalization parameters for U2Net Custom
     * Uses user-provided parameters or defaults to standard U2Net values
     */
    protected getNormalizationParams(): NormalizationParams {
        return {
            mean: this.config.mean || [0.485, 0.456, 0.406],
            std: this.config.std || [0.229, 0.224, 0.225],
            size: this.config.inputSize || [320, 320],
        };
    }

    /**
     * Get the input tensor name for U2Net Custom
     */
    protected getInputName(): string {
        return this.config.inputName || 'input.1';
    }

    /**
     * Get the output shape for U2Net Custom
     */
    protected getOutputShape(): [number, number, number, number] {
        const size = this.config.inputSize || [320, 320];
        return [1, 1, size[0], size[1]];
    }

    /**
     * Override predict method to handle custom input tensor name
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
     * Process U2Net Custom model outputs to create masks
     * Uses standard U2Net processing (single channel output)
     */
    protected processOutputs(
        outputs: ort.InferenceSession.OnnxValueMapType,
        originalSize: { width: number; height: number }
    ): HTMLCanvasElement[] {
        // U2Net Custom outputs a single tensor with shape [1, 1, height, width]
        // Standard U2Net processing
        const outputTensor = outputs[Object.keys(outputs)[0]] as ort.Tensor;
        const outputData = outputTensor.data as Float32Array;

        // Process the output to create mask canvas
        const maskCanvas = processModelOutput(
            outputData,
            originalSize,
            this.getOutputShape()
        );

        return [maskCanvas];
    }

    /**
     * Get model name
     * Matches Python: return "u2net_custom"
     */
    static getName(): string {
        return 'u2net_custom';
    }

    /**
     * Get configuration
     */
    getConfig(): U2NetCustomConfig {
        return { ...this.config };
    }
}
