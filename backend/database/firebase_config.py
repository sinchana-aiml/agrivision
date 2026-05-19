"""
Firebase configuration and database integration wrapper.
Provides a unified interface for database operations, allowing
easy swapping between in-memory mock storage and real Firebase Firestore.
"""

import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =====================================================================
# FUTURE FIREBASE INTEGRATION SETUP
# =====================================================================
# To enable real Firebase integration, follow these steps:
# 1. Install firebase-admin: pip install firebase-admin
# 2. Download your Firebase Admin SDK service account JSON key file.
# 3. Save it as backend/database/firebase_credentials.json (add it to your .gitignore).
# 4. Uncomment the Firebase initialization block below.

"""
import firebase_admin
from firebase_admin import credentials, firestore

try:
    cred_path = os.path.join(os.path.dirname(__file__), "firebase_credentials.json")
    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        USE_FIREBASE = True
        logger.info("Firebase successfully initialized!")
    else:
        USE_FIREBASE = False
        logger.warning("Firebase credentials not found. Falling back to In-Memory DB.")
except Exception as e:
    logger.error(f"Error initializing Firebase: {e}")
    USE_FIREBASE = False
"""

USE_FIREBASE = False

# Mock in-memory database
_claims_db = []

class ClaimsDatabase:
    """
    Unified manager for crop insurance claims.
    Seamlessly switches between Firestore and local in-memory storage.
    """
    
    @staticmethod
    def get_all():
        """Retrieve all insurance claims."""
        if USE_FIREBASE:
            # Firestore implementation:
            # docs = db.collection("claims").stream()
            # return [doc.to_dict() for doc in docs]
            pass
        return _claims_db

    @staticmethod
    def get_by_id(claim_id):
        """Retrieve a specific claim by its ID."""
        if USE_FIREBASE:
            # doc = db.collection("claims").document(str(claim_id)).get()
            # return doc.to_dict() if doc.exists else None
            pass
        for claim in _claims_db:
            if claim["id"] == claim_id:
                return claim
        return None

    @staticmethod
    def add_claim(crop, damage_percentage, result):
        """Create and add a new claim to the database."""
        new_id = len(_claims_db) + 1
        
        claim = {
            "id": new_id,
            "crop": crop,
            "damage": damage_percentage,
            "result": result,
            "location": "Not updated",
            "status": "Pending",
            "amount": 0
        }
        
        if USE_FIREBASE:
            # db.collection("claims").document(str(new_id)).set(claim)
            pass
            
        _claims_db.append(claim)
        return claim

    @staticmethod
    def update_location(claim_id, latitude, longitude):
        """Update the geolocation details of a claim."""
        location_str = f"Lat: {latitude}, Lon: {longitude}"
        
        if USE_FIREBASE:
            # db.collection("claims").document(str(claim_id)).update({
            #     "location": location_str
            # })
            pass
            
        claim = ClaimsDatabase.get_by_id(claim_id)
        if claim:
            claim["location"] = location_str
            return True
        return False

    @staticmethod
    def update_status(claim_id, status, amount):
        """Approve/reject a claim and set the approved payout amount."""
        if USE_FIREBASE:
            # db.collection("claims").document(str(claim_id)).update({
            #     "status": status,
            #     "amount": amount
            # })
            pass
            
        claim = ClaimsDatabase.get_by_id(claim_id)
        if claim:
            claim["status"] = status
            claim["amount"] = amount
            return claim
        return None
