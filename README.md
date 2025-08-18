AI-Recommender-Chatbot-for-omx-digital

An AI-powered **onboarding and support chatbot** built with **Flask + JavaScript**.  
The assistant guides users through an interactive onboarding flow, recommends the right OMX product, and answers FAQs from a dataset.  
If the question is out of scope, it redirects users to contact support.

---

Features
- Onboarding Flow – asks business type, size, and goals.
- Smart Recommendation** – suggests either:
  - OMX Sales → for lead management, CRM, automation, analytics.
  - OMX Flow → for WhatsApp automation, chatbot flows, bulk campaigns.
- FAQ Support – answers user queries from a dataset.
- Fallback – directs users to contact sales/support if question is outside scope.
- Modern UI – clean chat interface with interactive buttons.


Tech Stack

Backend: Python (Flask)
Frontend: HTML, CSS, JavaScript
AI: SentenceTransformer (semantic search for FAQ answers)
Data: JSON (FAQ + onboarding dataset)

Install Dependencies :
pip install flask sentence_transformers

Run the App:
python app.py
