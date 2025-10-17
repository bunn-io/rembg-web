# E2E Tests for rembg-web

This directory contains end-to-end tests for the rembg-web library, testing actual ONNX model execution in a real browser environment.

## Test Structure

Tests are organized by model, with one test file per model:

- `u2net.spec.ts` - U2Net model tests
- `u2netp.spec.ts` - U2Net-P (lightweight) model tests
- `u2net_human_seg.spec.ts` - U2Net Human Segmentation model tests
- `u2net_cloth_seg.spec.ts` - U2Net Cloth Segmentation model tests
- `silueta.spec.ts` - Silueta model tests
- `isnet-general-use.spec.ts` - IS-Net General Use model tests
- `isnet-anime.spec.ts` - IS-Net Anime model tests

## Test Fixtures

Test images are located in `/public/fixtures/`:

- `anime-girl-1.jpg` - Anime character
- `car-1.jpg` - Car image
- `cloth-1.jpg` - Clothing image
- `plants-1.jpg` - Plants image

## Expected Results

Expected results from the Python rembg implementation are stored in `/public/source-results/` with the naming pattern: `{fixture}.{model}.png`

## How Tests Work

Each test:

1. Loads the rembg library in a real browser
2. Fetches a fixture image from `/fixtures/`
3. Runs `remove()` with the specific model using real ONNX inference
4. Computes a perceptual hash of the result
5. Compares it with the perceptual hash of the expected result from Python rembg
6. Passes if hashes match (indicating identical or near-identical output)

## Running Tests

```bash
# Run all tests
yarn test

# Run tests for a specific model
yarn test:u2net
yarn test:u2netp
yarn test:silueta
yarn test:isnet

# Run with headed browser (see what's happening)
yarn test:headed

# Run a specific test file
yarn build && playwright test u2net.spec.ts

# Run tests for a specific fixture
yarn build && playwright test --grep "anime-girl-1"
```

## Comparison Method

Tests use **pixel-by-pixel comparison** to ensure exact matches between the JavaScript implementation and the Python reference results. This provides:

- Precise validation that the JavaScript implementation produces identical output
- Detailed statistics about any differences (total pixels, different pixels, percentage different, max/average difference)
- Confidence that the implementation is working correctly

## Test Timeout

Each test has a 3-minute timeout to account for:

- Model download (first run)
- ONNX model initialization
- Inference execution
- Result processing

## Adding New Tests

To add tests for a new model:

1. Ensure the model is registered in `src/sessionFactory.ts`
2. Add expected results to `/public/source-results/` (4 files: one per fixture)
3. Create a new test file: `tests/e2e/{model-name}.spec.ts`
4. Copy the structure from an existing test file
5. Update `MODEL_NAME` constant
6. Add a convenience script to `package.json` if desired

## Debugging Failed Tests

If a test fails:

1. Check the console output for pixel comparison statistics
2. Run with `--headed` to see the browser
3. Compare the actual result with the expected result manually
4. Verify the model is producing correct output
5. If the output is correct but pixels differ, you may need to update the expected result

## CI/CD

Tests run in CI with:

- Retries: 2 attempts on failure
- Workers: 1 (sequential execution to avoid resource contention)
- Headless browser mode
- 10-minute timeout for server startup (model downloads)
