from flask import Flask, request, jsonify
import os
from RAGModel import LocalRAGSystemFAISS
from supabase import create_client
from uuid import uuid4
from dotenv import load_dotenv
from flask_cors import CORS
rag_system = LocalRAGSystemFAISS(llm_model_name="gemini-2.5-flash")

app = Flask(__name__)
load_dotenv()
CORS(app)

# --- Supabase Config ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_BUCKET = "documindai"

if not SUPABASE_URL or not SUPABASE_KEY:
    raise EnvironmentError("Supabase credentials are missing")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- Existing Query Endpoint ---
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

# --- ✅ New Upload Text Endpoint ---
@app.route("/upload-text", methods=["POST"])
def upload_text():
    data = request.get_json()
    text = data.get("text")
    session_id = data.get("session_id", str(uuid4()))  # Optional, generates if not given

    if not text:
        return jsonify({"error": "Missing 'text' in request body"}), 400

    try:
        # === 1. Save to tmp/common.txt ===
        tmp_dir = "RagAPINew/tmp"
        os.makedirs(tmp_dir, exist_ok=True)

        local_txt_path = os.path.join(tmp_dir, f"{session_id}_common.txt")
        with open(local_txt_path, "w", encoding="utf-8") as f:
            f.write(text)

        # === 2. Upload common.txt to Supabase ===
        with open(local_txt_path, "rb") as f:
            storage_path = f"{session_id}/common.txt"
            supabase.storage.from_(SUPABASE_BUCKET).upload(storage_path, f, {
                "content-type": "text/plain",
                "x-upsert": "true"
            })

        # === 3. Generate FAISS + metadata ===
        index_path = os.path.join(tmp_dir, f"{session_id}_faiss.idx")
        meta_path = os.path.join(tmp_dir, f"{session_id}_meta.json")

        rag_system.load_faiss_index_and_metadata(
            file_path=local_txt_path,
            faiss_index_path=index_path,
            meta_path=meta_path
        )

        # === 4. Upload FAISS index ===
        with open(index_path, "rb") as f_idx:
            supabase.storage.from_(SUPABASE_BUCKET).upload(f"{session_id}/faiss.idx", f_idx, {
                "content-type": "application/octet-stream",
                "x-upsert": "true"
            })

        # === 5. Upload Metadata ===
        with open(meta_path, "rb") as f_meta:
            supabase.storage.from_(SUPABASE_BUCKET).upload(f"{session_id}/meta.json", f_meta, {
                "content-type": "application/json",
                "x-upsert": "true"
            })

        return jsonify({
            "message": "Text uploaded and FAISS files created and uploaded",
            "session_id": session_id
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/list-sessions", methods=["GET"])
def list_sessions():
    try:
        # List objects with no prefix to get folders
        result = supabase.storage.from_(SUPABASE_BUCKET).list("", {"limit": 1000})
        
        # Filter folder names (those ending with '/')
        sessions = [item['name'] for item in result if item['name'].endswith('/')]

        return jsonify({"sessions": sessions})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=5001)
