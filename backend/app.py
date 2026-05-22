"""
AgriVision Flask Backend Entrypoint.
Initializes the Flask server, enables CORS, registers blueprint routers,
and serves the web frontend.
"""

import os
import sys
import logging
from dotenv import load_dotenv
load_dotenv()

# Ensure root directory is in python path for absolute imports when running directly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask
from flask_cors import CORS

# Import Blueprints
from backend.routes.analyze import analyze_bp
from backend.routes.dashboard import dashboard_bp
from backend.routes.claims import claims_bp
from backend.routes.chatbot import chatbot_bp

# Configure logs
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

def create_app():
    """
    App factory to build and configure the Flask web application.
    """
    # Serve the frontend directory static files at root URL path
    app = Flask(
        __name__, 
        static_folder=os.path.join(os.path.dirname(__file__), "../frontend"),
        static_url_path=""
    )
    
    # Enable Cross-Origin Resource Sharing
    CORS(app)
    
    # Serve login page at root, index at /index.html
    @app.route("/")
    def root():
        return app.send_static_file("login.html")

    @app.route("/login.html")
    def login():
        return app.send_static_file("login.html")

    @app.route("/index.html")
    def index():
        return app.send_static_file("index.html")
    
    # Register blueprints
    app.register_blueprint(analyze_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(claims_bp)
    app.register_blueprint(chatbot_bp)
    
    logger.info("Modular backend services initialized successfully!")
    return app

if __name__ == "__main__":
    app = create_app()
    # Read host and port from environment or default
    port = int(os.environ.get("PORT", 5000))
    host = "0.0.0.0"
    
    logger.info(f"Starting AgriVision Dev Server on http://{host}:{port}...")
    app.run(host=host, port=port, debug=False)
