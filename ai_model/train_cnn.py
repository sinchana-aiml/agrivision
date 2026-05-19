"""
AgriVision CNN Training Script.
Constructs a 2D Convolutional Neural Network (CNN) to classify
healthy vs damaged crop leaves, saves the resulting weights to backend/models,
and exports training performance graphs to graphs/.
"""

import os
import matplotlib.pyplot as plt
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# =====================================================================
# PATH RESOLUTION & SYSTEM CONFIG
# =====================================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "dataset")
MODEL_OUTPUT_PATH = os.path.join(BASE_DIR, "../backend/models/crop_damage_model.h5")
GRAPH_OUTPUT_PATH = os.path.join(BASE_DIR, "graphs/training_accuracy.png")

# Image parameters matching frontend input
IMG_SIZE = 128
BATCH_SIZE = 32

def train_model():
    # Verify dataset presence
    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(
            f"Dataset directory not found at: {DATASET_PATH}. Please populate training images."
        )

    print("Initializing Data Generators with 80/20 train/validation split...")
    # Data generator (auto label from folder names)
    datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=0.2
    )

    train_data = datagen.flow_from_directory(
        DATASET_PATH,
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode='binary',
        subset='training'
    )

    val_data = datagen.flow_from_directory(
        DATASET_PATH,
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode='binary',
        subset='validation'
    )

    print("Building Keras 2D Sequential CNN Model...")
    # CNN model architecture
    model = Sequential([
        Conv2D(32, (3,3), activation='relu', input_shape=(IMG_SIZE, IMG_SIZE, 3)),
        MaxPooling2D(2,2),

        Conv2D(64, (3,3), activation='relu'),
        MaxPooling2D(2,2),

        Flatten(),
        Dense(128, activation='relu'),
        Dense(1, activation='sigmoid') # Sigmoid for binary classification (healthy: 1, damaged: 0)
    ])

    # Compile model
    model.compile(
        optimizer='adam',
        loss='binary_crossentropy',
        metrics=['accuracy']
    )

    # Train model
    epochs = 5
    print(f"Beginning training for {epochs} epochs...")
    history = model.fit(
        train_data,
        validation_data=val_data,
        epochs=epochs
    )

    print(f"Saving fully trained Keras model weights to: {MODEL_OUTPUT_PATH}...")
    # Make sure output directory exists
    os.makedirs(os.path.dirname(MODEL_OUTPUT_PATH), exist_ok=True)
    model.save(MODEL_OUTPUT_PATH)
    print("Model saved successfully!")

    print("Plotting accuracy curves...")
    # Plot accuracy and save it in graphs/
    plt.figure(figsize=(8, 5))
    plt.plot(history.history['accuracy'], label='Train Accuracy', color='#10b981', linewidth=2)
    plt.plot(history.history['val_accuracy'], label='Validation Accuracy', color='#3b82f6', linewidth=2)
    plt.legend(loc='lower right')
    plt.title("CNN Training Accuracy Curves")
    plt.xlabel("Epoch")
    plt.ylabel("Accuracy")
    plt.grid(True, linestyle="--", alpha=0.5)
    
    # Ensure graphs directory exists
    os.makedirs(os.path.dirname(GRAPH_OUTPUT_PATH), exist_ok=True)
    plt.savefig(GRAPH_OUTPUT_PATH, dpi=150)
    print(f"Training accuracy graph exported to: {GRAPH_OUTPUT_PATH}")
    
    plt.show()

if __name__ == "__main__":
    train_model()
