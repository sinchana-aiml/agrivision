"""
Claims Decision and Metadata Blueprints.
Manages updates to existing claims such as setting GPS geolocations and officer approvals.
"""

import logging
from flask import Blueprint, request, jsonify

from backend.database.firebase_config import ClaimsDatabase
from backend.utils.location_utils import is_valid_coordinate

logger = logging.getLogger(__name__)
claims_bp = Blueprint("claims", __name__)

@claims_bp.route("/add_location", methods=["POST"])
def add_location():
    """
    Appends GPS coordinates to an existing crop damage insurance claim.
    """
    try:
        data = request.json or {}
        claim_id = data.get("id")
        lat = data.get("latitude")
        lon = data.get("longitude")

        if not claim_id:
            return jsonify({"error": "Missing claim ID"}), 400
            
        if lat is None or lon is None:
            return jsonify({"error": "Missing latitude/longitude"}), 400

        # Validate coordinate bounds
        if not is_valid_coordinate(lat, lon):
            logger.warning(f"Invalid coordinate received: Lat={lat}, Lon={lon}")
            return jsonify({"error": "Geographical coordinates out of bounds"}), 400

        # Update in database
        success = ClaimsDatabase.update_location(claim_id, lat, lon)
        if success:
            logger.info(f"Updated location for claim #{claim_id}: {lat}, {lon}")
            return jsonify({"message": "Location updated successfully"}), 200
        else:
            return jsonify({"error": "Claim record not found"}), 404
            
    except Exception as e:
        logger.error(f"Error updating claim location: {e}")
        return jsonify({"error": f"Failed to update location: {str(e)}"}), 500


@claims_bp.route("/sanction", methods=["POST"])
def sanction_claim():
    """
    Officer Decision endpoint.
    Approves or rejects a claim and allocates PMFBY fund disbursement amounts.
    """
    try:
        data = request.json or {}
        claim_id = data.get("id")
        amount = data.get("amount", 0)
        status = data.get("status")  # "Approved" or "Rejected" (optional, falls back based on amount)

        if not claim_id:
            return jsonify({"error": "Missing claim ID"}), 400

        # If status isn't specified, infer from amount
        if not status:
            status = "Approved" if amount > 0 else "Rejected"

        # Update in database
        updated_claim = ClaimsDatabase.update_status(claim_id, status, amount)
        if updated_claim:
            logger.info(f"Claim #{claim_id} status updated to '{status}' with amount: ₹{amount}")
            return jsonify(updated_claim), 200
        else:
            return jsonify({"error": "Claim record not found"}), 404
            
    except Exception as e:
        logger.error(f"Error processing claim sanction: {e}")
        return jsonify({"error": f"Failed to sanction claim: {str(e)}"}), 500
