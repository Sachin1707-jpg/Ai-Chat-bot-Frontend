import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.errors import APIError

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Enable CORS for all routes (important for development with local frontend files)
CORS(app)

# Validate API Key configuration
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    logger.warning("GEMINI_API_KEY environment variable is not set. The Gemini client may fail to initialize.")

# Initialize Gemini Client
try:
    # Under the google-genai SDK, genai.Client initialized without arguments 
    # will automatically load GEMINI_API_KEY from environment variables.
    # We pass it explicitly to ensure correctness.
    client = genai.Client(api_key=api_key)
    logger.info("Gemini client successfully initialized.")
except Exception as e:
    logger.critical(f"Failed to initialize Gemini Client: {e}")
    client = None

# We use the latest recommended Gemini Flash model
# gemini-2.5-flash is optimized for speed, low latency, and high intelligence
GEMINI_MODEL = "gemini-2.5-flash"

@app.route('/chat', methods=['POST'])
def chat():
    if not client:
        return jsonify({
            "error": "Gemini API client is not initialized. Please configure the GEMINI_API_KEY in backend/.env."
        }), 500

    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing JSON request body"}), 400

    # The user can send either a single 'message' (string) or a list 'history' of past messages
    user_message = data.get("message")
    chat_history = data.get("history", [])

    if not user_message and not chat_history:
        return jsonify({"error": "No 'message' or 'history' provided in the request body"}), 400

    try:
        contents = []

        # If chat history is provided, we format it for multi-turn conversation
        for turn in chat_history:
            role = turn.get("role")
            text = turn.get("text")
            if role in ["user", "model"] and text:
                contents.append({
                    "role": "user" if role == "user" else "model",
                    "parts": [{"text": text}]
                })

        # Append the current message if it's not already in the history list
        if user_message:
            contents.append({
                "role": "user",
                "parts": [{"text": user_message}]
            })

        logger.info(f"Sending request to Gemini API ({GEMINI_MODEL}) with {len(contents)} turns.")

        # Generate response using Client
        # Using client.models.generate_content as standard for the google-genai SDK
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                # System instructions can be added optionally for a chatbot personality
                system_instruction="You are a helpful, friendly, and highly intelligent AI chatbot assistant powered by Gemini. You give clear, concise, and structured answers. Use Markdown formatting when appropriate, such as bold text, lists, and code blocks."
            )
        )

        ai_response = response.text
        if not ai_response:
            # Fallback if text is empty (e.g. content safety flags)
            ai_response = "I'm sorry, I could not generate a response. The content may have been filtered or blocked."
            logger.warning("Empty response received from Gemini API.")

        return jsonify({
            "response": ai_response,
            "model": GEMINI_MODEL
        })

    except APIError as e:
        logger.error(f"Gemini API Error: {e}")
        return jsonify({
            "error": "Gemini API Error",
            "details": str(e)
        }), 502
    except Exception as e:
        logger.error(f"Internal server error: {e}")
        return jsonify({
            "error": "Internal Server Error",
            "details": str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "api_configured": bool(api_key),
        "model": GEMINI_MODEL
    })
@app.route("/")
def home():
    return "Backend is running successfully!"

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    debug_mode = os.getenv("FLASK_ENV") == "development"
    logger.info(f"Starting Flask server on port {port} (debug={debug_mode})...")
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
