# Model Comparison Results

This document compares the results from our rembg implementation against the original rembg results.

## Quick Performance Overview

| Model             | Source                                               | TS (this) rewrite                                                 | Python (source) Implementation                                     | Notes                    |
| ----------------- | ---------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------ |
| isnet-anime       | ![anime-girl-1](../public/fixtures/anime-girl-1.jpg) | ![our](../public/calculated-results/anime-girl-1.isnet-anime.png) | ![original](../public/source-results/anime-girl-1.isnet-anime.png) | Specialized for anime    |
| isnet-general-use | ![car-1](../public/fixtures/car-1.jpg)               | ![our](../public/calculated-results/car-1.isnet-general-use.png)  | ![original](../public/source-results/car-1.isnet-general-use.png)  | General purpose          |
| silueta           | ![car-1](../public/fixtures/car-1.jpg)               | ![our](../public/calculated-results/car-1.silueta.png)            | ![original](../public/source-results/car-1.silueta.png)            | Good for objects         |
| u2net             | ![plants-1](../public/fixtures/plants-1.jpg)         | ![our](../public/calculated-results/plants-1.u2net.png)           | ![original](../public/source-results/plants-1.u2net.png)           | Classic model            |
| u2net_cloth_seg   | ![cloth-1](../public/fixtures/cloth-1.jpg)           | ![our](../public/calculated-results/cloth-1.u2net_cloth_seg.png)  | ![original](../public/source-results/cloth-1.u2net_cloth_seg.png)  | Specialized for clothing |
| u2net_human_seg   | ![car-1](../public/fixtures/car-1.jpg)               | ![our](../public/calculated-results/car-1.u2net_human_seg.png)    | ![original](../public/source-results/car-1.u2net_human_seg.png)    | Specialized for humans   |
| u2netp            | ![car-1](../public/fixtures/car-1.jpg)               | ![our](../public/calculated-results/car-1.u2netp.png)             | ![original](../public/source-results/car-1.u2netp.png)             | Lightweight version      |

## Detailed Model Comparisons

### ISNet Anime

| Source                                               | Our Result                                                        | Original Result                                                    |
| ---------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| ![anime-girl-1](../public/fixtures/anime-girl-1.jpg) | ![our](../public/calculated-results/anime-girl-1.isnet-anime.png) | ![original](../public/source-results/anime-girl-1.isnet-anime.png) |
| ![car-1](../public/fixtures/car-1.jpg)               | ![our](../public/calculated-results/car-1.isnet-anime.png)        | ![original](../public/source-results/car-1.isnet-anime.png)        |
| ![cloth-1](../public/fixtures/cloth-1.jpg)           | ![our](../public/calculated-results/cloth-1.isnet-anime.png)      | ![original](../public/source-results/cloth-1.isnet-anime.png)      |
| ![plants-1](../public/fixtures/plants-1.jpg)         | ![our](../public/calculated-results/plants-1.isnet-anime.png)     | ![original](../public/source-results/plants-1.isnet-anime.png)     |

### ISNet General Use

| Source                                               | Our Result                                                              | Original Result                                                          |
| ---------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| ![anime-girl-1](../public/fixtures/anime-girl-1.jpg) | ![our](../public/calculated-results/anime-girl-1.isnet-general-use.png) | ![original](../public/source-results/anime-girl-1.isnet-general-use.png) |
| ![car-1](../public/fixtures/car-1.jpg)               | ![our](../public/calculated-results/car-1.isnet-general-use.png)        | ![original](../public/source-results/car-1.isnet-general-use.png)        |
| ![cloth-1](../public/fixtures/cloth-1.jpg)           | ![our](../public/calculated-results/cloth-1.isnet-general-use.png)      | ![original](../public/source-results/cloth-1.isnet-general-use.png)      |
| ![plants-1](../public/fixtures/plants-1.jpg)         | ![our](../public/calculated-results/plants-1.isnet-general-use.png)     | ![original](../public/source-results/plants-1.isnet-general-use.png)     |

### Silueta

| Source                                               | Our Result                                                    | Original Result                                                |
| ---------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------- |
| ![anime-girl-1](../public/fixtures/anime-girl-1.jpg) | ![our](../public/calculated-results/anime-girl-1.silueta.png) | ![original](../public/source-results/anime-girl-1.silueta.png) |
| ![car-1](../public/fixtures/car-1.jpg)               | ![our](../public/calculated-results/car-1.silueta.png)        | ![original](../public/source-results/car-1.silueta.png)        |
| ![cloth-1](../public/fixtures/cloth-1.jpg)           | ![our](../public/calculated-results/cloth-1.silueta.png)      | ![original](../public/source-results/cloth-1.silueta.png)      |
| ![plants-1](../public/fixtures/plants-1.jpg)         | ![our](../public/calculated-results/plants-1.silueta.png)     | ![original](../public/source-results/plants-1.silueta.png)     |

### U2Net

| Source                                               | Our Result                                                  | Original Result                                              |
| ---------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| ![anime-girl-1](../public/fixtures/anime-girl-1.jpg) | ![our](../public/calculated-results/anime-girl-1.u2net.png) | ![original](../public/source-results/anime-girl-1.u2net.png) |
| ![car-1](../public/fixtures/car-1.jpg)               | ![our](../public/calculated-results/car-1.u2net.png)        | ![original](../public/source-results/car-1.u2net.png)        |
| ![cloth-1](../public/fixtures/cloth-1.jpg)           | ![our](../public/calculated-results/cloth-1.u2net.png)      | ![original](../public/source-results/cloth-1.u2net.png)      |
| ![plants-1](../public/fixtures/plants-1.jpg)         | ![our](../public/calculated-results/plants-1.u2net.png)     | ![original](../public/source-results/plants-1.u2net.png)     |

### U2Net Cloth Segmentation

| Source                                               | Our Result                                                            | Original Result                                                        |
| ---------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| ![anime-girl-1](../public/fixtures/anime-girl-1.jpg) | ![our](../public/calculated-results/anime-girl-1.u2net_cloth_seg.png) | ![original](../public/source-results/anime-girl-1.u2net_cloth_seg.png) |
| ![car-1](../public/fixtures/car-1.jpg)               | ![our](../public/calculated-results/car-1.u2net_cloth_seg.png)        | ![original](../public/source-results/car-1.u2net_cloth_seg.png)        |
| ![cloth-1](../public/fixtures/cloth-1.jpg)           | ![our](../public/calculated-results/cloth-1.u2net_cloth_seg.png)      | ![original](../public/source-results/cloth-1.u2net_cloth_seg.png)      |
| ![plants-1](../public/fixtures/plants-1.jpg)         | ![our](../public/calculated-results/plants-1.u2net_cloth_seg.png)     | ![original](../public/source-results/plants-1.u2net_cloth_seg.png)     |

### U2Net Human Segmentation

| Source                                               | Our Result                                                            | Original Result                                                        |
| ---------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| ![anime-girl-1](../public/fixtures/anime-girl-1.jpg) | ![our](../public/calculated-results/anime-girl-1.u2net_human_seg.png) | ![original](../public/source-results/anime-girl-1.u2net_human_seg.png) |
| ![car-1](../public/fixtures/car-1.jpg)               | ![our](../public/calculated-results/car-1.u2net_human_seg.png)        | ![original](../public/source-results/car-1.u2net_human_seg.png)        |
| ![cloth-1](../public/fixtures/cloth-1.jpg)           | ![our](../public/calculated-results/cloth-1.u2net_human_seg.png)      | ![original](../public/source-results/cloth-1.u2net_human_seg.png)      |
| ![plants-1](../public/fixtures/plants-1.jpg)         | ![our](../public/calculated-results/plants-1.u2net_human_seg.png)     | ![original](../public/source-results/plants-1.u2net_human_seg.png)     |

### U2NetP (Lightweight)

| Source                                               | Our Result                                                   | Original Result                                               |
| ---------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
| ![anime-girl-1](../public/fixtures/anime-girl-1.jpg) | ![our](../public/calculated-results/anime-girl-1.u2netp.png) | ![original](../public/source-results/anime-girl-1.u2netp.png) |
| ![car-1](../public/fixtures/car-1.jpg)               | ![our](../public/calculated-results/car-1.u2netp.png)        | ![original](../public/source-results/car-1.u2netp.png)        |
| ![cloth-1](../public/fixtures/cloth-1.jpg)           | ![our](../public/calculated-results/cloth-1.u2netp.png)      | ![original](../public/source-results/cloth-1.u2netp.png)      |
| ![plants-1](../public/fixtures/plants-1.jpg)         | ![our](../public/calculated-results/plants-1.u2netp.png)     | ![original](../public/source-results/plants-1.u2netp.png)     |
