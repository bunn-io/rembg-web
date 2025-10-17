import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rembgConfig } from '../../../src/config';
import { IsNetAnimeSession } from '../../../src/sessions/isnet_anime';
import { IsNetGeneralUseSession } from '../../../src/sessions/isnet_general_use';
import { SiluetaSession } from '../../../src/sessions/silueta';
import { U2NetSession } from '../../../src/sessions/u2net';
import { U2NetClothSegSession } from '../../../src/sessions/u2net_cloth_seg';
import { U2NetHumanSegSession } from '../../../src/sessions/u2net_human_seg';
import { U2NetpSession } from '../../../src/sessions/u2netp';

describe('Session Base URL Configuration', () => {
  beforeEach(() => {
    // Reset config to defaults before each test
    rembgConfig.resetToDefaults();
  });

  describe('Default Base URL', () => {
    it('should use default base URL for all session types', () => {
      expect(rembgConfig.getBaseUrl()).toBe('/models');

      // Test each session type
      const isnetAnime = new IsNetAnimeSession();
      const isnetGeneral = new IsNetGeneralUseSession();
      const silueta = new SiluetaSession();
      const u2net = new U2NetSession();
      const u2netCloth = new U2NetClothSegSession();
      const u2netHuman = new U2NetHumanSegSession();
      const u2netp = new U2NetpSession();

      // Access the protected method through type assertion for testing
      expect((isnetAnime as any).getDefaultModelUrl()).toBe(
        '/models/isnet-anime.onnx'
      );
      expect((isnetGeneral as any).getDefaultModelUrl()).toBe(
        '/models/isnet-general-use.onnx'
      );
      expect((silueta as any).getDefaultModelUrl()).toBe(
        '/models/silueta.onnx'
      );
      expect((u2net as any).getDefaultModelUrl()).toBe('/models/u2net.onnx');
      expect((u2netCloth as any).getDefaultModelUrl()).toBe(
        '/models/u2net_cloth_seg.onnx'
      );
      expect((u2netHuman as any).getDefaultModelUrl()).toBe(
        '/models/u2net_human_seg.onnx'
      );
      expect((u2netp as any).getDefaultModelUrl()).toBe('/models/u2netp.onnx');
    });
  });

  describe('Custom Base URL', () => {
    it('should use custom base URL for all session types', () => {
      // Set custom base URL
      rembgConfig.setBaseUrl('/custom-models');
      expect(rembgConfig.getBaseUrl()).toBe('/custom-models');

      // Test each session type
      const isnetAnime = new IsNetAnimeSession();
      const isnetGeneral = new IsNetGeneralUseSession();
      const silueta = new SiluetaSession();
      const u2net = new U2NetSession();
      const u2netCloth = new U2NetClothSegSession();
      const u2netHuman = new U2NetHumanSegSession();
      const u2netp = new U2NetpSession();

      // Access the protected method through type assertion for testing
      expect((isnetAnime as any).getDefaultModelUrl()).toBe(
        '/custom-models/isnet-anime.onnx'
      );
      expect((isnetGeneral as any).getDefaultModelUrl()).toBe(
        '/custom-models/isnet-general-use.onnx'
      );
      expect((silueta as any).getDefaultModelUrl()).toBe(
        '/custom-models/silueta.onnx'
      );
      expect((u2net as any).getDefaultModelUrl()).toBe(
        '/custom-models/u2net.onnx'
      );
      expect((u2netCloth as any).getDefaultModelUrl()).toBe(
        '/custom-models/u2net_cloth_seg.onnx'
      );
      expect((u2netHuman as any).getDefaultModelUrl()).toBe(
        '/custom-models/u2net_human_seg.onnx'
      );
      expect((u2netp as any).getDefaultModelUrl()).toBe(
        '/custom-models/u2netp.onnx'
      );
    });

    it('should handle URLs with protocols', () => {
      // Set base URL with protocol
      rembgConfig.setBaseUrl('https://example.com/models');
      expect(rembgConfig.getBaseUrl()).toBe('https://example.com/models');

      // Test a few session types
      const isnetAnime = new IsNetAnimeSession();
      const u2net = new U2NetSession();

      expect((isnetAnime as any).getDefaultModelUrl()).toBe(
        'https://example.com/models/isnet-anime.onnx'
      );
      expect((u2net as any).getDefaultModelUrl()).toBe(
        'https://example.com/models/u2net.onnx'
      );
    });

    it('should handle URLs with trailing slash', () => {
      // Set base URL with trailing slash
      rembgConfig.setBaseUrl('https://example.com/models/');
      expect(rembgConfig.getBaseUrl()).toBe('https://example.com/models/');

      // Test a session type
      const u2net = new U2NetSession();
      expect((u2net as any).getDefaultModelUrl()).toBe(
        'https://example.com/models//u2net.onnx'
      );
    });

    it('should handle relative paths', () => {
      // Set relative base URL
      rembgConfig.setBaseUrl('./models');
      expect(rembgConfig.getBaseUrl()).toBe('./models');

      // Test a session type
      const u2net = new U2NetSession();
      expect((u2net as any).getDefaultModelUrl()).toBe('./models/u2net.onnx');
    });
  });

  describe('Dynamic Base URL Changes', () => {
    it('should reflect base URL changes in new session instances', () => {
      // Start with default
      let u2net = new U2NetSession();
      expect((u2net as any).getDefaultModelUrl()).toBe('/models/u2net.onnx');

      // Change base URL
      rembgConfig.setBaseUrl('/new-models');

      // Create new session instance
      u2net = new U2NetSession();
      expect((u2net as any).getDefaultModelUrl()).toBe(
        '/new-models/u2net.onnx'
      );
    });

    it('should affect existing session instances when base URL changes', () => {
      // Create session with default base URL
      const u2net = new U2NetSession();
      expect((u2net as any).getDefaultModelUrl()).toBe('/models/u2net.onnx');

      // Change base URL
      rembgConfig.setBaseUrl('/new-models');

      // Existing session should use new URL (since getDefaultModelUrl() calls rembgConfig.getBaseUrl() at runtime)
      expect((u2net as any).getDefaultModelUrl()).toBe(
        '/new-models/u2net.onnx'
      );
    });
  });

  describe('Integration with Model Path Configuration', () => {
    it('should prioritize custom model paths over base URL', () => {
      // Set custom base URL
      rembgConfig.setBaseUrl('/custom-models');

      // Set custom model path for specific model
      rembgConfig.setCustomModelPath('u2net', '/absolute/path/u2net.onnx');

      // Create session
      const u2net = new U2NetSession();

      // The session should use the custom path, not the base URL
      // This tests the getModelUrl() method which checks custom paths first
      expect((u2net as any).getModelUrl()).toBe('/absolute/path/u2net.onnx');
    });

    it('should fall back to base URL when no custom path is set', () => {
      // Set custom base URL
      rembgConfig.setBaseUrl('/custom-models');

      // Don't set custom model path
      // Create session
      const u2net = new U2NetSession();

      // The session should use the base URL
      expect((u2net as any).getModelUrl()).toBe('/custom-models/u2net.onnx');
    });
  });
});
