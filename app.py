from flask import Flask, request, jsonify, send_from_directory
from sentence_transformers import SentenceTransformer, util
import numpy as np
import json
import random

app = Flask(__name__, static_folder='static')

# Load data
with open('data.json') as f:
    data = json.load(f)

# Initialize AI model
model = SentenceTransformer('all-MiniLM-L6-v2')
faq_embeddings = model.encode([q["question"] for q in data["faqs"]], convert_to_tensor=True)

# Routes
@app.route('/')
def serve_frontend():
    return send_from_directory('templates', 'index.html')

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route('/api/onboarding', methods=['GET'])
def get_onboarding():
    return jsonify({
        "business_types": data["onboarding"]["business_types"],
        "business_sizes": data["onboarding"]["business_sizes"],
        "goals": data["onboarding"]["goals"]
    })

@app.route('/api/recommend', methods=['POST'])
def recommend():
    user_data = request.json
    
    # Enhanced decision logic
    goals = [goal.lower() for goal in user_data.get("goals", [])]
    business_type = user_data.get("business_type", "").lower()
    
    # Score products based on goals
    sales_score = sum(1 for keyword in ["lead", "crm", "sales", "pipeline"] 
                  if any(keyword in goal for goal in goals))
    
    flow_score = sum(1 for keyword in ["whatsapp", "bulk", "chatbot", "support"] 
                  if any(keyword in goal for goal in goals))
    
    # Industry-specific weighting
    if business_type in ["e-commerce", "retail"]:
        flow_score += 2
    
    if sales_score >= flow_score:
        return jsonify({
            "recommendation": "OMX Sales",
            "product": data["products"]["OMX Sales"],
            "match_reason": "Your focus on CRM and lead management"
        })
    else:
        return jsonify({
            "recommendation": "OMX Flow",
            "product": data["products"]["OMX Flow"],
            "match_reason": "Your WhatsApp automation needs"
        })

@app.route('/api/faq', methods=['POST'])
def handle_faq():
    question = request.json.get("question", "").strip().lower()
    
    # Check for direct matches
    direct_match = next((faq for faq in data["faqs"] 
                       if question == faq["question"].lower()), None)
    if direct_match:
        return jsonify(direct_match)
    
    # Semantic search
    question_embed = model.encode(question, convert_to_tensor=True)
    similarities = util.pytorch_cos_sim(question_embed, faq_embeddings)[0]
    best_match_idx = np.argmax(similarities)
    
    if similarities[best_match_idx] > 0.65:
        return jsonify(data["faqs"][best_match_idx])
    else:
        return jsonify({
            "answer": random.choice(data["contact"]["fallback_messages"]),
            "contact": {
                "email": data["contact"]["support_email"],
                "phone": data["contact"]["phone"],
                "action": "Would you like to be connected?"
            }
        })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
