from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from internship_agent import scrape_website_text, generate_internship_content
import os
import logging
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app) # Enable Cross-Origin Resource Sharing so GitHub Pages can request this backend

# Setup rate limiting to prevent abuse
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["20 per hour"],
    storage_uri="memory://"
)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/generate", methods=["POST"])
@limiter.limit("5 per minute")
def generate():
    data = request.json
    url = data.get("url")
    user_raw_text = data.get("raw_text") # Can be effectively sent to bypass scraping if website blocks it
    api_key = os.getenv("NVIDIA_API_KEY")
    
    if not url and not user_raw_text:
        return jsonify({"error": "URL or Raw Text is required"}), 400
    if not api_key:
        return jsonify({"error": "Backend configuration error: API Key missing"}), 500
        
    try:
        # 1. Provide raw_text directly if user bypassed scraping, otherwise scrape the URL
        if user_raw_text and user_raw_text.strip():
            raw_text = user_raw_text
        else:
            raw_text = scrape_website_text(url)
            
        # 2. Complete Generation passing url or a fallback "No URL Provided"
        content = generate_internship_content(raw_text, url or "No URL Provided", api_key)
        
        # Optionally, we can attempt to parse the content into Poster and WhatsApp Caption
        # We will let the frontend handle the display. It might be easier to just split by "TASK 2: WHATSAPP CAPTION" or similar if we want.
        # But for now, we just pass the full content and the frontend can parse it.
        
        return jsonify({
            "success": True,
            "content": content
        })
    except ValueError as e:
        # ValueError is raised by our own validation (SSRF, bad URL, etc.)
        # Safe to show to the client as we control the message.
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400
    except Exception as e:
        # Log the real error server-side for debugging, but never expose it to the client.
        logging.exception("Unhandled error during content generation")
        return jsonify({
            "success": False,
            "error": "An internal server error occurred. Please try again later."
        }), 500

if __name__ == "__main__":
    app.run(debug=False)
