onnxruntime# ONNX Models Directory

This directory contains the ONNX model files required for rembg-web to function. These files are **not included in the repository** due to their large size (several hundred MB total).

## Downloading Models

Use the provided script to download the required model files:

```bash
# Download all models
yarn fetch-models

# Download a specific model
yarn fetch-models u2net.onnx

# Force re-download all models
yarn fetch-models --force
```

## Available Models

| Model File               | Size   | Description                                  |
| ------------------------ | ------ | -------------------------------------------- |
| `u2net.onnx`             | ~176MB | General-purpose background removal (default) |
| `u2netp.onnx`            | ~4.7MB | Lightweight version for faster processing    |
| `u2net_human_seg.onnx`   | ~176MB | Optimized for human subjects                 |
| `u2net_cloth_seg.onnx`   | ~176MB | Specialized for clothing segmentation        |
| `isnet-general-use.onnx` | ~178MB | High accuracy general purpose model          |
| `isnet-anime.onnx`       | ~178MB | Optimized for anime-style images             |
| `silueta.onnx`           | ~43MB  | Silhouette-based background removal          |

## Model Sources

Models are downloaded from the GitHub Release v1.0.0 of this repository. The `fetch-models` script will:

1. Fetch the release information from GitHub API
2. Download each model file with progress tracking
3. Verify file integrity
4. Skip already downloaded models (unless `--force` is used)

## Manual Download

If you prefer to download models manually, you can find them in the [GitHub Releases](https://github.com/bunn-io/rembg-web/releases/tag/0.0.0) section.

## Usage

Once downloaded, you will need to serve them as assets, so that CORS download is possible.

You can run

> yarn test:demo

To checkout some example usage

```typescript
import { remove, newSession } from '@bunnio/rembg-web';

// Uses u2net.onnx by default
const result = await remove(imageFile);

// Use a specific model
const session = newSession('u2net_human_seg');
const result = await remove(imageFile, { session });
```

## Troubleshooting

- **CORS errors**: Make sure you're serving your application from an HTTP server, not opening HTML files directly
- **Model not found**: Run `yarn fetch-models` to download the required models
