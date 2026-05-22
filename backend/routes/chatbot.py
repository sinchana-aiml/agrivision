"""
AgriVision Chatbot Route
Handles farmer queries via Groq LLM API with an agriculture/PMFBY-focused system prompt.
"""

import os
import logging
from flask import Blueprint, request, jsonify
from groq import Groq

chatbot_bp = Blueprint("chatbot", __name__)
logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are AgriBot, a helpful agricultural assistant embedded in the AgriVision PMFBY crop insurance portal.

You help Indian farmers with:
- Crop disease identification and symptoms (Tomato, Pepper, Wheat and general crops)
- Causes and reasons behind crop damage (fungal, bacterial, viral, pest, weather)
- Treatment and prevention suggestions for diseased crops
- PMFBY (Pradhan Mantri Fasal Bima Yojana) insurance scheme — eligibility, claim process, payout rules
- Farming best practices, irrigation, fertilizer, and seasonal advice
- Interpreting AI damage assessment results from the portal

Rules:
- Always respond in simple, friendly language a farmer can understand
- Keep answers concise but informative (3-5 sentences max unless a list is needed)
- If asked about something unrelated to farming or PMFBY, politely redirect to agricultural topics
- Use bullet points for lists of symptoms, treatments, or steps
- Always be encouraging and supportive toward farmers
"""

@chatbot_bp.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    if not data or not data.get("message"):
        return jsonify({"error": "No message provided"}), 400

    user_message = data["message"].strip()
    history = data.get("history", [])  # list of {role, content}

    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        return jsonify({"error": "GROQ_API_KEY not set in environment"}), 500

    try:
        client = Groq(api_key=api_key)

        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        # Include last 6 messages of history for context
        for msg in history[-6:]:
            if msg.get("role") in ("user", "assistant") and msg.get("content"):
                messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": user_message})

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=512,
            temperature=0.7,
        )

        reply = response.choices[0].message.content.strip()
        return jsonify({"reply": reply})

    except Exception as e:
        logger.error(f"Groq API error: {e}")
        return jsonify({"error": str(e)}), 500
