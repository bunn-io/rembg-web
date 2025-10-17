/**
 * WebNN (Web Neural Network API) utilities for rembg-web
 *
 * Provides feature detection, configuration validation, and execution provider
 * management for WebNN hardware acceleration support.
 */

import { SessionOptions } from '../sessions/base';
import { logInfo, logPerformance, logDebug, logWarn } from './logger';
import { isWebGPUAvailable } from './webgpu';

// WebNN API type declarations (for browsers that support it)
declare global {
    interface Navigator {
        ml?: {
            createContext(options?: object): Promise<object>;
        };
    }
}

/**
 * WebNN device types supported by the API.
 *
 * @example
 * ```typescript
 * const deviceType: WebNNDeviceType = 'gpu';
 * const isSupported = await isWebNNDeviceSupported(deviceType);
 * ```
 */
export type WebNNDeviceType = 'cpu' | 'gpu' | 'npu';

/**
 * WebNN power preference options.
 *
 * @example
 * ```typescript
 * const powerPref: WebNNPowerPreference = 'high-performance';
 * const options = { webnnPowerPreference: powerPref };
 * ```
 */
export type WebNNPowerPreference = 'default' | 'low-power' | 'high-performance';

/**
 * WebNN configuration options.
 *
 * @example
 * ```typescript
 * const config: WebNNConfig = {
 *   deviceType: 'gpu',
 *   powerPreference: 'high-performance'
 * };
 * ```
 */
export interface WebNNConfig {
    deviceType: WebNNDeviceType;
    powerPreference: WebNNPowerPreference;
}

/**
 * Check if WebNN API is available in the current browser
 *
 * @returns true if WebNN is supported, false otherwise
 *
 * @example
 * ```typescript
 * if (isWebNNAvailable()) {
 *   console.log('WebNN is supported!');
 * } else {
 *   console.log('WebNN not available, using fallback');
 * }
 * ```
 */
export function isWebNNAvailable(): boolean {
    try {
        // Check if the WebNN API is available
        return (
            typeof navigator !== 'undefined' &&
            'ml' in navigator &&
            typeof navigator.ml === 'object' &&
            navigator.ml !== null
        );
    } catch (error) {
        logDebug('WebNN availability check failed:', error);
        return false;
    }
}

/**
 * Get the recommended execution providers based on WebNN availability and options
 *
 * @param options - Session options including WebNN preferences
 * @returns Array of execution provider names in order of preference
 *
 * @example
 * ```typescript
 * const providers = getExecutionProviders({
 *   preferWebNN: true,
 *   webnnDeviceType: 'gpu'
 * });
 * // Returns: ['webnn', 'webgl', 'cpu'] if WebNN is available
 * // Returns: ['webgl', 'cpu'] if WebNN is not available
 * ```
 */
export function getExecutionProviders(options: SessionOptions = {}): string[] {
    const startTime = performance.now();
    logInfo('[getExecutionProviders] Determining execution providers...');

    const providers: string[] = [];
    logInfo('[getExecutionProviders] Input options:', {
        executionProviders: options.executionProviders,
        preferWebNN: options.preferWebNN,
        webnnDeviceType: options.webnnDeviceType,
        webnnPowerPreference: options.webnnPowerPreference,
        preferWebGPU: options.preferWebGPU,
        webgpuPowerPreference: options.webgpuPowerPreference,
    });

    // If user explicitly provided execution providers, use those
    if (options.executionProviders && options.executionProviders.length > 0) {
        const explicitTime = performance.now() - startTime;
        logPerformance(
            `[getExecutionProviders] Using explicit providers: ${explicitTime.toFixed(2)}ms`
        );
        logInfo(
            `[getExecutionProviders] Using explicit execution providers: ${options.executionProviders.join(', ')}`
        );
        return [...options.executionProviders];
    }

    // Check if WebNN should be preferred
    const webnnCheckStart = performance.now();
    const preferWebNN = options.preferWebNN ?? false;
    const webnnAvailable = isWebNNAvailable();
    const webnnCheckTime = performance.now() - webnnCheckStart;
    logPerformance(
        `[getExecutionProviders] WebNN preference check: ${webnnCheckTime.toFixed(2)}ms`
    );

    logInfo(
        `[getExecutionProviders] WebNN status: preferWebNN=${preferWebNN}, available=${webnnAvailable}`
    );

    if (preferWebNN && webnnAvailable) {
        providers.push('webnn');
        logInfo(
            '[getExecutionProviders] WebNN execution provider added to preference list'
        );
    } else if (preferWebNN && !webnnAvailable) {
        logWarn(
            '[getExecutionProviders] WebNN was preferred but is not available in this browser'
        );
    }

    // Check if WebGPU should be preferred
    const webgpuCheckStart = performance.now();
    const preferWebGPU = options.preferWebGPU ?? false;
    const webgpuAvailable = isWebGPUAvailable();
    const webgpuCheckTime = performance.now() - webgpuCheckStart;
    logPerformance(
        `[getExecutionProviders] WebGPU preference check: ${webgpuCheckTime.toFixed(2)}ms`
    );

    logInfo(
        `[getExecutionProviders] WebGPU status: preferWebGPU=${preferWebGPU}, available=${webgpuAvailable}`
    );

    if (preferWebGPU && webgpuAvailable) {
        providers.push('webgpu');
        logInfo(
            '[getExecutionProviders] WebGPU execution provider added to preference list'
        );
    } else if (preferWebGPU && !webgpuAvailable) {
        logWarn(
            '[getExecutionProviders] WebGPU was preferred but is not available in this browser'
        );
    }

    // Add fallback providers in order of preference
    providers.push('webgl', 'cpu');

    const totalTime = performance.now() - startTime;
    logPerformance(
        `[getExecutionProviders] Provider selection complete: ${totalTime.toFixed(2)}ms (${providers.join(', ')})`
    );

    return providers;
}

/**
 * Validate WebNN configuration options
 *
 * @param options - Session options to validate
 * @returns true if configuration is valid, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = validateWebNNConfig({
 *   preferWebNN: true,
 *   webnnDeviceType: 'gpu'
 * });
 * ```
 */
export function validateWebNNConfig(options: SessionOptions): boolean {
    // Check device type
    if (
        options?.webnnDeviceType &&
        !['cpu', 'gpu', 'npu'].includes(options.webnnDeviceType)
    ) {
        logWarn(`Invalid WebNN device type: ${options.webnnDeviceType}`);
        return false;
    }

    // Check power preference
    if (
        options?.webnnPowerPreference &&
        !['default', 'low-power', 'high-performance'].includes(
            options.webnnPowerPreference
        )
    ) {
        logWarn(
            `Invalid WebNN power preference: ${options.webnnPowerPreference}`
        );
        return false;
    }

    // Check WebGPU power preference
    if (
        options?.webgpuPowerPreference &&
        !['default', 'low-power', 'high-performance'].includes(
            options.webgpuPowerPreference
        )
    ) {
        logWarn(
            `Invalid WebGPU power preference: ${options.webgpuPowerPreference}`
        );
        return false;
    }

    return true;
}

/**
 * Get WebNN context options based on session configuration
 *
 * @param options - Session options
 * @returns WebNN context options object
 *
 * @example
 * ```typescript
 * const contextOptions = getWebNNContextOptions({
 *   webnnDeviceType: 'gpu',
 *   webnnPowerPreference: 'high-performance'
 * });
 * ```
 */
export function getWebNNContextOptions(
    options: SessionOptions
): SessionOptions & Partial<WebNNConfig> {
    const contextOptions: SessionOptions & Partial<WebNNConfig> = {};

    if (options.webnnDeviceType) {
        contextOptions.deviceType = options.webnnDeviceType;
    }

    if (options.webnnPowerPreference) {
        contextOptions.powerPreference = options.webnnPowerPreference;
    }

    return contextOptions;
}

/**
 * Check if a specific WebNN device type is supported
 *
 * @param deviceType - The device type to check
 * @returns Promise that resolves to true if supported, false otherwise
 *
 * @example
 * ```typescript
 * const gpuSupported = await isWebNNDeviceSupported('gpu');
 * if (gpuSupported) {
 *   console.log('GPU acceleration available via WebNN');
 * }
 * ```
 */
export async function isWebNNDeviceSupported(
    deviceType: WebNNDeviceType
): Promise<boolean> {
    const startTime = performance.now();
    logInfo(
        `[isWebNNDeviceSupported] Checking support for device: ${deviceType}`
    );

    if (!isWebNNAvailable()) {
        const totalTime = performance.now() - startTime;
        logPerformance(
            `[isWebNNDeviceSupported] WebNN not available: ${totalTime.toFixed(2)}ms`
        );
        return false;
    }

    try {
        // Create a context with the specified device type
        const contextCreateStart = performance.now();
        const context = await navigator.ml?.createContext({
            deviceType,
        });
        const contextCreateTime = performance.now() - contextCreateStart;
        logPerformance(
            `[isWebNNDeviceSupported] Context creation for ${deviceType}: ${contextCreateTime.toFixed(2)}ms`
        );

        // If we can create the context, the device type is supported
        const supported = context !== null;
        const totalTime = performance.now() - startTime;
        logPerformance(
            `[isWebNNDeviceSupported] Device ${deviceType} supported: ${supported} (${totalTime.toFixed(2)}ms)`
        );
        return supported;
    } catch (error) {
        const totalTime = performance.now() - startTime;
        logDebug(
            `[isWebNNDeviceSupported] Device type '${deviceType}' not supported (${totalTime.toFixed(2)}ms):`,
            error
        );
        return false;
    }
}

/**
 * Get information about WebNN support and capabilities
 *
 * @returns Object containing WebNN support information
 *
 * @example
 * ```typescript
 * const info = await getWebNNInfo();
 * console.log('WebNN available:', info.available);
 * console.log('Supported devices:', info.supportedDevices);
 * ```
 */
export async function getWebNNInfo(): Promise<{
    available: boolean;
    supportedDevices: WebNNDeviceType[];
    userAgent: string;
}> {
    const startTime = performance.now();
    logInfo('[getWebNNInfo] Gathering WebNN information...');

    const availabilityCheckStart = performance.now();
    const available = isWebNNAvailable();
    const availabilityCheckTime = performance.now() - availabilityCheckStart;
    logPerformance(
        `[getWebNNInfo] Availability check: ${availabilityCheckTime.toFixed(2)}ms`
    );

    const supportedDevices: WebNNDeviceType[] = [];

    if (available) {
        // Test each device type
        const deviceTypes: WebNNDeviceType[] = ['cpu', 'gpu', 'npu'];
        const deviceCheckStart = performance.now();

        for (const deviceType of deviceTypes) {
            const deviceStart = performance.now();
            if (await isWebNNDeviceSupported(deviceType)) {
                supportedDevices.push(deviceType);
            }
            const deviceTime = performance.now() - deviceStart;
            logPerformance(
                `[getWebNNInfo] Device ${deviceType} check: ${deviceTime.toFixed(2)}ms`
            );
        }

        const deviceCheckTime = performance.now() - deviceCheckStart;
        logPerformance(
            `[getWebNNInfo] All device checks: ${deviceCheckTime.toFixed(2)}ms`
        );
    }

    const totalTime = performance.now() - startTime;
    logPerformance(
        `[getWebNNInfo] Total info gathering: ${totalTime.toFixed(2)}ms (available: ${available}, devices: ${supportedDevices.join(', ')})`
    );

    return {
        available,
        supportedDevices,
        userAgent:
            typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    };
}

/**
 * Log WebNN support information to console
 * Useful for debugging and user information
 *
 * @example
 * ```typescript
 * logWebNNInfo();
 * // Outputs: "WebNN Support: Available (GPU, CPU)" or "WebNN Support: Not Available"
 * ```
 */
export async function logWebNNInfo(): Promise<void> {
    const info = await getWebNNInfo();

    if (info.available) {
        logInfo(
            `WebNN Support: Available (${info.supportedDevices.join(', ')})`
        );
    } else {
        logInfo('WebNN Support: Not Available');
    }
}
