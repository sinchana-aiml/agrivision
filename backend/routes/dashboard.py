"""
Officer Dashboard Route.
Serves overall statistics and comprehensive list of submitted crop claims.
"""

import logging
from flask import Blueprint, jsonify
from backend.database.firebase_config import ClaimsDatabase

logger = logging.getLogger(__name__)
dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/dashboard", methods=["GET"])
def get_dashboard_data():
    """
    Returns a JSON array of all registered insurance claims.
    Used by the administrative dashboard to display table records.
    """
    try:
        claims = ClaimsDatabase.get_all()
        logger.info(f"Retrieved {len(claims)} claim records from database.")
        return jsonify(claims), 200
    except Exception as e:
        logger.error(f"Error retrieving dashboard claims: {e}")
        return jsonify({"error": "Failed to load dashboard data"}), 500
