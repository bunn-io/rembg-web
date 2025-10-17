import { test, expect } from '@playwright/test';
import { compareImages, loadExpectedResult } from './helpers/image-comparison';
import { U2NetClothSegSession } from 'rembg-web';

const MODEL_NAME = 'u2net_cloth_seg';
const FIXTURES = ['anime-girl-1', 'car-1', 'cloth-1', 'plants-1'];
const TIMEOUT = 180000; // 3 minutes

test.describe(`${MODEL_NAME} model`, () => {
  for (const fixture of FIXTURES) {
    test(`should process ${fixture} correctly`, async ({ page }) => {
      test.setTimeout(TIMEOUT);

      await page.goto('/test-page.html?playground=true');

      // Wait for library to load
      await page.waitForFunction(() => window.rembg !== undefined);

      // Process image in browser with real ONNX
      const resultArray = await page.evaluate(
        async ({ fixtureName, modelName }) => {
          const response = await fetch(`/fixtures/${fixtureName}.jpg`);
          const session = (await window.rembg.newSession(
            modelName
          )) as U2NetClothSegSession;
          session.setClothCategory('all');
          const imageBlob = await response.blob();
          const image = await window.rembg.canvasTools.fileToImage(imageBlob);
          const canvas = window.rembg.canvasTools.imageToCanvas(image);
          const masks = await session.predict(canvas);
          const canvases: HTMLCanvasElement[] = [];
          for (let mask of masks) {
            mask = window.rembg.canvasTools.postProcessMask(mask);
            const image = await window.rembg.canvasTools.fileToImage(imageBlob);
            const canvas = window.rembg.canvasTools.imageToCanvas(image);
            canvases.push(window.rembg.canvasTools.naiveCutout(canvas, mask));
          }
          // Merge canvases vertically into one
          if (canvases.length === 0) throw new Error('No cutouts to merge');

          // Assuming all canvases are the same width/height
          const width = canvases[0].width;
          const height = canvases[0].height;
          const mergedCanvas = document.createElement('canvas');
          mergedCanvas.width = width;
          mergedCanvas.height = height * canvases.length;
          const ctx = mergedCanvas.getContext('2d');
          if (!ctx) throw new Error('Failed to get merged canvas context');

          for (let i = 0; i < canvases.length; i++) {
            ctx.drawImage(canvases[i], 0, i * height, width, height);
          }

          const resultBlob = await new Promise<Blob>((resolve, reject) => {
            mergedCanvas.toBlob(blob => {
              if (blob) resolve(blob);
              else reject(new Error('Failed to convert merged canvas to Blob'));
            }, 'image/png');
          });

          // Convert merged canvas to Blob (PNG)
          return Array.from(new Uint8Array(await resultBlob.arrayBuffer()));
        },
        { fixtureName: fixture, modelName: MODEL_NAME }
      );

      // Load expected result
      const expectedArray = await loadExpectedResult(fixture, MODEL_NAME);

      // Compare images pixel by pixel
      const comparison = compareImages(
        new Uint8Array(resultArray),
        expectedArray,
        0 // No tolerance - exact match required
      );

      console.log(`${MODEL_NAME} - ${fixture}:`);
      console.log(`  Total pixels: ${comparison.totalPixels}`);
      console.log(`  Different pixels: ${comparison.differentPixels}`);
      console.log(
        `  Percentage different: ${comparison.percentageDifferent.toFixed(2)}%`
      );
      console.log(`  Max difference: ${comparison.maxDifference}`);
      console.log(
        `  Average difference: ${comparison.averageDifference.toFixed(2)}`
      );
      console.log(`  Identical: ${comparison.identical}`);

      // Images should be identical
      expect(comparison.identical).toBe(true);
    });
  }
});
