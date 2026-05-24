"""
Plant Validation Utility — AgriVision
======================================
Lightweight pre-filter that checks whether an uploaded image likely contains
a plant or leaf BEFORE passing it to the CNN model.

Method: Green Pixel Percentage Analysis
  - Converts image to RGB and scans each pixel for green channel dominance.
  - If the green pixel ratio is below GREEN_PIXEL_THRESHOLD, the image is
    rejected and never reaches the TensorFlow model.
  - Blocks non-plant images (human faces, rooms, objects, screenshots, etc.)
    without requiring any additional ML model or heavy dependency.

Team note: Adjust GREEN_PIXEL_THRESHOLD if you find valid leaf images being
rejected (lower it) or non-plant images slipping through (raise it).
"""

import io
import numpy as np
from PIL import Image

# Minimum fraction of pixels that must be green-dominant for the image
# to be accepted as a valid plant/leaf photo.
# 0.08 = 8% — works well for most real-world crop leaf photos.
GREEN_PIXEL_THRESHOLD = 0.08


def is_plant_image(image_bytes: bytes) -> tuple[bool, float]:
    """
    Analyses raw image bytes and returns whether the image likely contains
    a plant or leaf based on green pixel dominance.

    Args:
        image_bytes (bytes): Raw uploaded image file bytes.

    Returns:
        tuple[bool, float]:
            - bool  : True if image passes plant validation, False otherwise.
            - float : The computed green pixel ratio (for logging/debugging).
    """
    # Open image and force standard RGB (handles PNG alpha, CMYK, grayscale, etc.)
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Downsample to 64×64 — fast pixel scan, accuracy is sufficient at this scale
    image = image.resize((64, 64))
    pixels = np.array(image, dtype=np.float32)  # shape: (64, 64, 3)

    r, g, b = pixels[:, :, 0], pixels[:, :, 1], pixels[:, :, 2]

    # A pixel qualifies as "green-dominant" when:
    #   1. Green channel strictly exceeds both Red and Blue channels
    #   2. Green channel has meaningful brightness (> 40) — avoids counting
    #      near-black shadow pixels that technically satisfy condition 1
    green_mask = (g > r) & (g > b) & (g > 40)

    green_ratio = float(np.sum(green_mask)) / (64 * 64)

    is_valid = green_ratio >= GREEN_PIXEL_THRESHOLD
    return is_valid, round(green_ratio, 4)
