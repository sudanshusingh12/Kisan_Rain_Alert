"""
Kisan Rain Alert - Master Flask Application Entrypoint
Serves REST API routes and the responsive AgriTech frontend.
"""

import os
import sys
import logging
from pathlib import Path
from flask import Flask, send_from_directory
from flask_cors import CORS

# Add backend directory to sys.path
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BACKEND_DIR.parent
DIST_DIR = PROJECT_DIR / "frontend" / "dist"
FRONTEND_DIR = DIST_DIR if DIST_DIR.exists() else PROJECT_DIR / "frontend"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from config import Config
from routes import api_bp
from scheduler import start_scheduler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("kisan_rain_alert")

def create_app() -> Flask:
    # Use static_folder=None to prevent Flask's built-in static rule from intercepting SPA routes with 404
    app = Flask(__name__, static_folder=None)
    app.config.from_object(Config)

    # Enable Cross-Origin Resource Sharing
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register API routes blueprint
    app.register_blueprint(api_bp)

    # ------------------------------------------------------------------------
    # FRONTEND SPA ROUTING (React.js)
    # ------------------------------------------------------------------------
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_spa(path):
        # Check if the requested path corresponds to an existing static file in dist
        target = DIST_DIR / path
        if path and target.exists() and not target.is_dir():
            return send_from_directory(str(DIST_DIR), path)
        # Otherwise, serve the React entry index.html for client-side routing
        return send_from_directory(str(DIST_DIR), "index.html")

    @app.errorhandler(404)
    def handle_404(e):
        return send_from_directory(str(DIST_DIR), "index.html")

    # Start background rainfall monitoring scheduler
    # In development, prevent duplicate scheduler threads during Flask debug reload
    if not app.debug or os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        start_scheduler()

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    logger.info("==================================================================")
    logger.info("KISAN RAIN ALERT - FULL STACK SERVER INITIALIZING")
    logger.info(f"Frontend Directory: {FRONTEND_DIR}")
    logger.info(f"Access Application at: http://127.0.0.1:{port}")
    logger.info("==================================================================")
    app.run(host="0.0.0.0", port=port, debug=Config.DEBUG)

