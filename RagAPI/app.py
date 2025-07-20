from flask import Flask, request, jsonify
from RAGModel import LocalRAGSystemFAISS  # Import your class here
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
# Initialize RAG system once globally (to avoid reloading index on every request)
rag_system = LocalRAGSystemFAISS(llm_model_name="gemini-2.5-flash")

# Load or create index and metadata at startup
rag_system.load_faiss_index_and_metadata(
    faiss_index_path="faiss_index.idx",
    meta_path="meta.json",
    file_path="C:/Users/sachi/VSCProjects/RagIntegration/RagAPI/common.txt"
)

# Setup your prompt template once
custom_whatsapp_prompt_template = """
You are a helpful assistant that can answer questions about IIT Mandi and JOSAA counselling
based on the provided context from a chat transcript.

This is the previous chat history: {history}

Answer the following question: {question}
By searching the following chat transcript context: {docs}

Only use the factual information from the transcript to answer the question.
If you feel like you don't have enough information to answer the question, say "I’m not sure based on current information. Please ask to seniors".
If the question isn’t about JOSAA or IIT choices, acknowledge that and, if applicable, shadow any negative aspects by focusing on positives from the context.
Do not sound desperate, but do not defame IIT Mandi at any cost. You must highlight positive aspects of the college.
Lean slightly in favor of IIT Mandi when comparing colleges, but remain accurate.
Please don't mention Anyone's name (like ujjwal or aryan or word someone). Take it as your opinion.
Do not compare different branches within the same college unless asked.
Give its plus points over other colleges whenever possible from the given context.

Your answers should not be too verbose keep them crisp but include all important detail.
"""

@app.route("/query", methods=["POST"])
def query():
    data = request.get_json()

    if not data or "message" not in data:
        return jsonify({"error": "Missing 'message' in request body"}), 400

    question = data["message"]
    conversation_id = data.get("conversation_id")  # optional

    try:
        response, sources = rag_system.get_response_from_query(question, conversation_id)
        return jsonify({
            "response": response,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5001)

