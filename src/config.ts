/**
 * Central configuration singleton for rembg-web
 * Manages model paths and other configuration settings
 */
export class RembgConfig {
  private static instance: RembgConfig;
  private customModelPaths: Map<string, string> = new Map();
  private baseUrl: string = '/models';
  private webnnEnabled: boolean = false;
  private webnnDeviceType: 'cpu' | 'gpu' | 'npu' = 'gpu';
  private webnnPowerPreference: 'default' | 'low-power' | 'high-performance' =
    'default';
  private webgpuEnabled: boolean = false;
  private webgpuPowerPreference: 'default' | 'low-power' | 'high-performance' =
    'default';
  private generalLoggingEnabled: boolean = false;
  private performanceLoggingEnabled: boolean = false;
  private onnxProfilingEnabled: boolean = false;
  private sessionCacheBypass: boolean = false;
  private modelCacheBypass: boolean = false;

  private constructor() {
    // Initialize with default model paths
    this.initializeDefaultPaths();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): RembgConfig {
    if (!RembgConfig.instance) {
      RembgConfig.instance = new RembgConfig();
    }
    return RembgConfig.instance;
  }

  /**
   * Initialize default model paths
   */
  private initializeDefaultPaths(): void {
    this.customModelPaths.clear();
  }

  /**
   * Set a custom model path for a specific model
   * @param modelName - Name of the model
   * @param path - Custom path to the model file
   */
  public setCustomModelPath(modelName: string, path: string): void {
    this.customModelPaths.set(modelName, path);
    if (this.generalLoggingEnabled) {
      console.log(`Set custom model path for ${modelName}: ${path}`);
    }
  }

  /**
   * Get the model path for a specific model
   * @param modelName - Name of the model
   * @returns The model path, or undefined if not set
   */
  public getCustomModelPath(modelName: string): string | undefined {
    return this.customModelPaths.get(modelName);
  }

  /**
   * Get all configured model paths
   * @returns Map of model names to their paths
   */
  public getAllModelPaths(): Map<string, string> {
    return new Map(this.customModelPaths);
  }

  /**
   * Check if a model has a custom path configured
   * @param modelName - Name of the model
   * @returns True if a custom path is configured
   */
  public hasCustomPath(modelName: string): boolean {
    const path = this.customModelPaths.get(modelName);
    return path !== undefined && path !== '';
  }

  /**
   * Reset all model paths to defaults
   */
  public resetToDefaults(): void {
    this.baseUrl = '/models'; // Reset baseUrl to default
    this.customModelPaths.clear();
    this.initializeDefaultPaths();
    if (this.generalLoggingEnabled) {
      console.log('Reset all model paths to defaults');
    }
  }

  /**
   * Remove a custom model path (will use default)
   * @param modelName - Name of the model
   */
  public removeCustomPath(modelName: string): void {
    if (this.customModelPaths.has(modelName)) {
      this.customModelPaths.delete(modelName);
      if (this.generalLoggingEnabled) {
        console.log(`Removed custom path for ${modelName}`);
      }
    }
  }

  /**
   * Get list of all available model names
   * @returns Array of model names
   */
  public getAvailableModels(): string[] {
    return [
      'u2net',
      'u2netp',
      'u2net_human_seg',
      'u2net_cloth_seg',
      'isnet-general-use',
      'isnet-anime',
      'silueta',
      'u2net_custom',
    ];
  }

  /**
   * Set the base URL for model paths
   * @param baseUrl - Base URL for model files (e.g., '/models', 'https://example.com/models')
   */
  public setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
    if (this.generalLoggingEnabled) {
      console.log(`Set base URL for models: ${baseUrl}`);
    }
    // Reinitialize default paths with new base URL
    this.initializeDefaultPaths();
  }

  /**
   * Get the current base URL for model paths
   * @returns The current base URL
   */
  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Enable or disable WebNN support globally
   * @param enable - Whether to enable WebNN
   */
  public enableWebNN(enable: boolean): void {
    this.webnnEnabled = enable;
    if (this.generalLoggingEnabled) {
      console.log(`WebNN support ${enable ? 'enabled' : 'disabled'} globally`);
    }
  }

  /**
   * Set the preferred WebNN device type
   * @param deviceType - The device type to prefer ('cpu', 'gpu', or 'npu')
   */
  public setWebNNDeviceType(deviceType: 'cpu' | 'gpu' | 'npu'): void {
    this.webnnDeviceType = deviceType;
    if (this.generalLoggingEnabled) {
      console.log(`WebNN device type set to: ${deviceType}`);
    }
  }

  /**
   * Set the WebNN power preference
   * @param preference - The power preference ('default', 'low-power', or 'high-performance')
   */
  public setWebNNPowerPreference(
    preference: 'default' | 'low-power' | 'high-performance'
  ): void {
    this.webnnPowerPreference = preference;
    if (this.generalLoggingEnabled) {
      console.log(`WebNN power preference set to: ${preference}`);
    }
  }

  /**
   * Check if WebNN is enabled globally
   * @returns True if WebNN is enabled
   */
  public isWebNNEnabled(): boolean {
    return this.webnnEnabled;
  }

  /**
   * Get the current WebNN device type
   * @returns The current device type
   */
  public getWebNNDeviceType(): 'cpu' | 'gpu' | 'npu' {
    return this.webnnDeviceType;
  }

  /**
   * Get the current WebNN power preference
   * @returns The current power preference
   */
  public getWebNNPowerPreference():
    | 'default'
    | 'low-power'
    | 'high-performance' {
    return this.webnnPowerPreference;
  }

  /**
   * Get all WebNN configuration settings
   * @returns Object containing all WebNN settings
   */
  public getWebNNConfig(): {
    enabled: boolean;
    deviceType: 'cpu' | 'gpu' | 'npu';
    powerPreference: 'default' | 'low-power' | 'high-performance';
  } {
    return {
      enabled: this.webnnEnabled,
      deviceType: this.webnnDeviceType,
      powerPreference: this.webnnPowerPreference,
    };
  }

  /**
   * Reset WebNN settings to defaults
   */
  public resetWebNNSettings(): void {
    this.webnnEnabled = false;
    this.webnnDeviceType = 'gpu';
    this.webnnPowerPreference = 'default';
    if (this.generalLoggingEnabled) {
      console.log('WebNN settings reset to defaults');
    }
  }

  /**
   * Enable or disable WebGPU support globally
   * @param enable - Whether to enable WebGPU
   */
  public enableWebGPU(enable: boolean): void {
    this.webgpuEnabled = enable;
    if (this.generalLoggingEnabled) {
      console.log(`WebGPU support ${enable ? 'enabled' : 'disabled'} globally`);
    }
  }

  /**
   * Set the WebGPU power preference
   * @param preference - The power preference ('default', 'low-power', or 'high-performance')
   */
  public setWebGPUPowerPreference(
    preference: 'default' | 'low-power' | 'high-performance'
  ): void {
    this.webgpuPowerPreference = preference;
    if (this.generalLoggingEnabled) {
      console.log(`WebGPU power preference set to: ${preference}`);
    }
  }

  /**
   * Check if WebGPU is enabled globally
   * @returns True if WebGPU is enabled
   */
  public isWebGPUEnabled(): boolean {
    return this.webgpuEnabled;
  }

  /**
   * Get the current WebGPU power preference
   * @returns The current power preference
   */
  public getWebGPUPowerPreference():
    | 'default'
    | 'low-power'
    | 'high-performance' {
    return this.webgpuPowerPreference;
  }

  /**
   * Get all WebGPU configuration settings
   * @returns Object containing all WebGPU settings
   */
  public getWebGPUConfig(): {
    enabled: boolean;
    powerPreference: 'default' | 'low-power' | 'high-performance';
  } {
    return {
      enabled: this.webgpuEnabled,
      powerPreference: this.webgpuPowerPreference,
    };
  }

  /**
   * Reset WebGPU settings to defaults
   */
  public resetWebGPUSettings(): void {
    this.webgpuEnabled = false;
    this.webgpuPowerPreference = 'default';
    if (this.generalLoggingEnabled) {
      console.log('WebGPU settings reset to defaults');
    }
  }

  /**
   * Enable or disable general logging (info, debug messages)
   * @param enable - Whether to enable general logging
   */
  public enableGeneralLogging(enable: boolean): void {
    this.generalLoggingEnabled = enable;
    if (this.generalLoggingEnabled) {
      console.log(`General logging ${enable ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Enable or disable performance logging (timing messages)
   * @param enable - Whether to enable performance logging
   */
  public enablePerformanceLogging(enable: boolean): void {
    this.performanceLoggingEnabled = enable;
    if (this.performanceLoggingEnabled) {
      console.log(`Performance logging ${enable ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Check if general logging is enabled
   * @returns True if general logging is enabled
   */
  public isGeneralLoggingEnabled(): boolean {
    return this.generalLoggingEnabled;
  }

  /**
   * Check if performance logging is enabled
   * @returns True if performance logging is enabled
   */
  public isPerformanceLoggingEnabled(): boolean {
    return this.performanceLoggingEnabled;
  }

  /**
   * Enable or disable ONNX Runtime profiling
   * @param enable - Whether to enable ONNX profiling
   */
  public enableONNXProfiling(enable: boolean): void {
    this.onnxProfilingEnabled = enable;
    if (this.onnxProfilingEnabled) {
      console.log(`ONNX profiling ${enable ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Check if ONNX profiling is enabled
   * @returns True if ONNX profiling is enabled
   */
  public isONNXProfilingEnabled(): boolean {
    return this.onnxProfilingEnabled;
  }

  /**
   * Get all logging configuration settings
   * @returns Object containing all logging settings
   */
  public getLoggingConfig(): {
    generalLogging: boolean;
    performanceLogging: boolean;
    onnxProfiling: boolean;
  } {
    return {
      generalLogging: this.generalLoggingEnabled,
      performanceLogging: this.performanceLoggingEnabled,
      onnxProfiling: this.onnxProfilingEnabled,
    };
  }

  /**
   * Reset logging settings to defaults
   */
  public resetLoggingSettings(): void {
    this.generalLoggingEnabled = false;
    this.performanceLoggingEnabled = false;
    this.onnxProfilingEnabled = false;
    if (this.generalLoggingEnabled) {
      console.log('Logging settings reset to defaults');
    }
  }

  /**
   * Enable or disable session cache bypass globally
   * @param bypass - Whether to bypass session cache
   */
  public setSessionCacheBypass(bypass: boolean): void {
    this.sessionCacheBypass = bypass;
    if (this.generalLoggingEnabled) {
      console.log(
        `Session cache bypass ${bypass ? 'enabled' : 'disabled'} globally`
      );
    }
  }
  /**
   * Enable or disable model cache bypass globally
   * @param bypass - Whether to bypass model cache
   */
  public setModelCacheBypass(bypass: boolean): void {
    this.modelCacheBypass = bypass;
    if (this.generalLoggingEnabled) {
      console.log(
        `Model cache bypass ${bypass ? 'enabled' : 'disabled'} globally`
      );
    }
  }

  /**
   * Check if session cache bypass is enabled globally
   * @returns True if session cache bypass is enabled
   */
  public isSessionCacheBypassEnabled(): boolean {
    return this.sessionCacheBypass;
  }

  /**
   * Check if model cache bypass is enabled globally
   * @returns True if model cache bypass is enabled
   */
  public isModelCacheBypassEnabled(): boolean {
    return this.modelCacheBypass;
  }

  /**
   * Get all cache bypass configuration settings
   * @returns Object containing all cache bypass settings
   */
  public getCacheBypassConfig(): {
    sessionCacheBypass: boolean;
    modelCacheBypass: boolean;
  } {
    return {
      sessionCacheBypass: this.sessionCacheBypass,
      modelCacheBypass: this.modelCacheBypass,
    };
  }

  /**
   * Reset cache bypass settings to defaults
   */
  public resetCacheBypassSettings(): void {
    this.sessionCacheBypass = false;
    this.modelCacheBypass = false;
    if (this.generalLoggingEnabled) {
      console.log('Cache bypass settings reset to defaults');
    }
  }
}

// Export singleton instance
export const rembgConfig = RembgConfig.getInstance();
