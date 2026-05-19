"""
AgriVision Model Verification Test Script.
Loads the trained crop leaf classification model from the backend/models directory
and runs predictions on a target test image file.
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing import image

# =====================================================================
# PATH RESOLUTIONS
# =====================================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Try target backend directory first, fallback to local file
MODEL_PATHS = [
    os.path.join(BASE_DIR, "../backend/models/crop_damage_model.h5"),
    os.path.join(BASE_DIR, "crop_damage_model.h5")
]

IMAGE_PATH = os.path.join(BASE_DIR, "test_leaf.jpg")
IMG_SIZE = 128

def run_test():
    # Find active model file
    active_model_path = None
    for p in MODEL_PATHS:
        if os.path.exists(p):
            active_model_path = p
            break
            
    if active_model_path is None:
        raise FileNotFoundError(
            f"Trained model not found. Checked: {MODEL_PATHS}. Please run train_cnn.py first."
        )

    print(f"Loading trained Keras CNN model from: {active_model_path}...")
    model = tf.keras.models.load_model(active_model_path)

    # Verify target test image
    if not os.path.exists(IMAGE_PATH):
        raise FileNotFoundError(
            f"Test image not found at: {IMAGE_PATH}. Please provide a test leaf image."
        )

    print(f"Loading and preprocessing test image from: {IMAGE_PATH}...")
    img = image.load_img(IMAGE_PATH, target_size=(IMG_SIZE, IMG_SIZE))
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = img_array / 255.0

    print("Running classification prediction...")
    prediction = model.predict(img_array)

    # Sigmoid Output: confidence score (1.0 = healthy, 0.0 = damaged)
    confidence = float(prediction[0][0])

    if confidence >= 0.5:
        result = "HEALTHY CROP"
        confidence_score = confidence * 100
    else:
        result = "DAMAGED CROP"
        confidence_score = (1.0 - confidence) * 100

    print("\n" + "="*40)
    print(f"🌾 AI Classification Result: {result}")
    print(f"📊 Model Confidence Score: {confidence_score:.2f}%")
    print("="*40)

if __name__ == "__main__":
    run_test()
