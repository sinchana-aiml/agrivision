"""
Image processing utilities for AgriVision.
Provides helper functions for resizing, normalizing, and preparing crop images for the CNN model.
"""

import io
import numpy as np
from PIL import Image

def preprocess_image(image_bytes, target_size=(128, 128)):
    """
    Reads raw image bytes, converts to RGB PIL Image, resizes,
    normalizes pixel values to [0, 1], and adds a batch dimension.
    
    Args:
        image_bytes (bytes): The raw uploaded file bytes.
        target_size (tuple): The expected (width, height) input of the model.
        
    Returns:
        np.ndarray: preprocessed image batch array ready for prediction.
    """
    # Open image from raw bytes and convert to standard RGB mode
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    
    # Resize to match training specifications
    image = image.resize(target_size)
    
    # Convert PIL Image to Float NumPy Array and normalize [0, 1]
    img_array = np.array(image) / 255.0
    
    # Expand dims to represent batch size of 1: (1, height, width, channels)
    img_array = np.expand_dims(img_array, axis=0)
    
    return img_array
