"""
Crop Damage Image Analysis Route.
Receives farmer uploads, passes them to the preloaded CNN model,
and registers a new insurance claim.
"""

import logging
from flask import Blueprint, request, jsonify

# Modular Imports
from backend.utils.image_processing import preprocess_image
from backend.utils.damage_calc import format_percentage
from backend.utils.plant_validation import is_plant_image
from backend.models.model_loader import get_model
from backend.database.firebase_config import ClaimsDatabase

logger = logging.getLogger(__name__)
analyze_bp = Blueprint("analyze", __name__)

@analyze_bp.route("/analyze", methods=["POST"])
def analyze():
    """
    Accepts raw crop image and metadata from a farmer upload,
    runs CNN prediction, estimates damage percent, and creates a pending claim.
    """
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    crop = request.form.get("crop", "Unknown")

    try:
        # Read bytes once — reused for both validation and preprocessing
        image_bytes = file.read()

        # ── Plant Validation Gate ─────────────────────────────────────────
        # Reject non-plant images (faces, rooms, objects) before they reach
        # the CNN model. Returns HTTP 422 with a structured error payload
        # that the frontend intercepts to show a user-friendly message.
        is_valid, green_ratio = is_plant_image(image_bytes)
        if not is_valid:
            logger.warning(
                f"Plant validation rejected upload for crop '{crop}'. "
                f"Green pixel ratio: {green_ratio} (threshold: 0.08)"
            )
            return jsonify({
                "error": "invalid_plant",
                "message": "Please upload a valid crop or leaf image."
            }), 422
        # ─────────────────────────────────────────────────────────────────

        # Preprocess the validated image bytes for CNN input
        img_array = preprocess_image(image_bytes)
        
        # Load the model (singleton loads only on first request)
        model = get_model()
        
        # Predict class confidence
        prediction = model.predict(img_array)
        healthy_prob = float(prediction[0][0])
        damage_prob = 1.0 - healthy_prob
        
        # Determine classification results
        result = "Healthy" if healthy_prob >= 0.5 else "Damaged"
        damage_percentage = format_percentage(damage_prob * 100, 2)
        
        # Save claim in Firebase or local mock DB
        claim = ClaimsDatabase.add_claim(
            crop=crop,
            damage_percentage=damage_percentage,
            result=result
        )
        
        logger.info(f"Successfully processed claim #{claim['id']} for crop '{crop}'. Result: {result} ({damage_percentage}%)")
        
        return jsonify({
            "claim_id": claim["id"],
            "result": result,
            "damage": damage_percentage
        }), 200
        
    except Exception as e:
        logger.error(f"Error during image analysis: {str(e)}", exc_info=True)
        return jsonify({"error": f"Failed to analyze image: {str(e)}"}), 500
