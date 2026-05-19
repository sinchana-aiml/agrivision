"""
Lazy-loading singleton model manager for loading and retrieving the
trained CNN crop damage detection model.
"""

import os
import logging
import tensorflow as tf

logger = logging.getLogger(__name__)

# Cache model instance
_model = None

def get_model():
    """
    Returns the loaded TensorFlow Keras model instance.
    Loads it from the local filesystem on the first call.
    """
    global _model
    if _model is None:
        model_path = os.path.join(os.path.dirname(__file__), "crop_damage_model.h5")
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"Model file 'crop_damage_model.h5' not found in models directory: {os.path.dirname(model_path)}"
            )
        
        logger.info(f"Loading Keras CNN model from: {model_path}...")
        _model = tf.keras.models.load_model(model_path)
        logger.info("Model loaded successfully!")
        
    return _model
