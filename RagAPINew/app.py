from flask import Flask, request, jsonify
import os
from RAGModel import LocalRAGSystemFAISS
from supabase import create_client
from uuid import uuid4
from dotenv import load_dotenv
from flask_cors import CORS
import fitz
import shutil


def extract_text_from_pdf(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    full_text = "\n".join(page.get_text() for page in doc)
    doc.close()
    return full_text

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

def upload_to_supabase(local_path, storage_path, content_type):
    with open(local_path, "rb") as f:
        supabase.storage.from_(SUPABASE_BUCKET).upload(storage_path, f, {
            "content-type": content_type,
            "x-upsert": "true"
        })

def save_and_upload_to_supabase(file_or_path, session_id, filename, content_type, is_file_object=False):
    # Sanitize filename
    safe_filename = filename.replace(' ', '_')
    tmp_dir = os.path.join('RagAPINew/tmp')
    os.makedirs(tmp_dir, exist_ok=True)
    save_name = f"{session_id}_{safe_filename}"
    save_path = os.path.join(tmp_dir, save_name)
    if is_file_object:
        file_or_path.save(save_path)
    else:
        # file_or_path is a local path, copy to save_path
        import shutil
        shutil.copyfile(file_or_path, save_path)
    upload_to_supabase(save_path, f"{session_id}/{safe_filename}", content_type)
    return save_name, save_path

def process_text_upload(text, session_id):
    # === 1. Save to tmp/common.txt ===
    tmp_dir = "RagAPINew/tmp"
    os.makedirs(tmp_dir, exist_ok=True)
    local_txt_path = os.path.join(tmp_dir, f"{session_id}_common.txt")
    with open(local_txt_path, "w", encoding="utf-8") as f:
        f.write(text)
        
    print("made common.txt")
    # Use the new function to save and upload
    upload_to_supabase(local_txt_path, f"{session_id}/common.txt", "text/plain")
    # save_and_upload_to_supabase(local_txt_path, session_id, "common.txt", "text/plain")
    print("uploaded file to supabase")
    # === 3. Generate FAISS + metadata ===
    index_path = os.path.join(tmp_dir, f"{session_id}_faiss.idx")
    meta_path = os.path.join(tmp_dir, f"{session_id}_meta.json")
    rag_system.load_faiss_index_and_metadata(
        file_path=local_txt_path,
        faiss_index_path=index_path,
        meta_path=meta_path
    )
    
    print("given files to rag")
    # === 4. Upload FAISS index ===
    upload_to_supabase(index_path, f"{session_id}/faiss.idx", "application/octet-stream")
    # === 5. Upload Metadata ===
    upload_to_supabase(meta_path, f"{session_id}/meta.json", "application/json")
    return {
        "message": "Text uploaded and FAISS files created and uploaded",
        "session_id": session_id
    }
    
@app.route('/session/<session_id>/document', methods=['GET'])
def get_session_document(session_id):
    """
    Returns document info and content for a session.
    - If common.txt exists, returns as text document.
    - If only PDF exists, returns as PDF (no preview content).
    """
    try:
        # Try to download common.txt from Supabase
        import tempfile
        tmp_dir = tempfile.gettempdir()
        local_txt_path = os.path.join(tmp_dir, f"{session_id}_common.txt")
        remote_txt_path = f"{session_id}/common.txt"
        try:
            # Download common.txt
            res = supabase.storage.from_(SUPABASE_BUCKET).download(remote_txt_path)
            with open(local_txt_path, "wb") as f:
                f.write(res)
            # Download faiss.idx and meta.json
            faiss_path = os.path.join(tmp_dir, f"{session_id}_faiss.idx")
            meta_path = os.path.join(tmp_dir, f"{session_id}_meta.json")
            res_faiss = supabase.storage.from_(SUPABASE_BUCKET).download(f"{session_id}/faiss.idx")
            with open(faiss_path, "wb") as f:
                f.write(res_faiss)
            res_meta = supabase.storage.from_(SUPABASE_BUCKET).download(f"{session_id}/meta.json")
            with open(meta_path, "wb") as f:
                f.write(res_meta)
            # Load into RAG model
            rag_system.load_faiss_index_and_metadata(
                file_path=local_txt_path,
                faiss_index_path=faiss_path,
                meta_path=meta_path
            )
            with open(local_txt_path, "r", encoding="utf-8") as f:
                content = f.read()
            doc_info = {
                "id": session_id,
                "name": "common.txt",
                "type": "text",
                "size": len(content.encode("utf-8")),
                "content": content
            }
            return jsonify(doc_info)
        except Exception:
            # If no common.txt, try to find a PDF
            # List files in the session folder
            result = supabase.storage.from_(SUPABASE_BUCKET).list(session_id)
            pdf_file = None
            for item in result:
                if item['name'].lower().endswith('.pdf'):
                    pdf_file = item['name']
                    break
            if pdf_file:
                remote_pdf_path = f"{session_id}/{pdf_file}"
                # Get file size
                meta = supabase.storage.from_(SUPABASE_BUCKET).get_metadata(remote_pdf_path)
                doc_info = {
                    "id": session_id,
                    "name": pdf_file,
                    "type": "pdf",
                    "size": meta.get('size', 0),
                    "content": None
                }
                return jsonify(doc_info)
            return jsonify({"error": "No document found for this session."}), 404
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
        resp = process_text_upload(text, session_id)
        return jsonify(resp)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/upload-pdf', methods=['POST'])
def upload_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    session_id = str(uuid4())
    if not session_id:
        return jsonify({"error": "Missing session_id"}), 400
    if not file.filename or file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    filename = file.filename
    if not filename.lower().endswith('.pdf'):
        return jsonify({"error": "Only PDF files are allowed"}), 400
    save_name, save_path = save_and_upload_to_supabase(file, session_id, filename, "application/pdf", is_file_object=True)
    # Optionally extract text
    text = extract_text_from_pdf(save_path)
    
    try:
        resp = process_text_upload(text, session_id)
        return jsonify(resp)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
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


@app.route("/list-sessions", methods=["GET"])
def list_sessions():
    try:
        # List objects with no prefix to get folders
        result = supabase.storage.from_(SUPABASE_BUCKET).list("", {"limit": 1000})
        
        # Filter folder names (those ending with '/')
        sessions = [item['name'] for item in result]

        return jsonify({"sessions": sessions})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/load_session", methods=["POST"])
def load_session():
    data = request.get_json()
    session_id = data.get("session_id")

    if not session_id:
        return jsonify({"error": "Missing session_id"}), 400

    try:
        file_names = ["common.txt", "faiss.idx", "meta.json"]
        tmp_dir = os.path.join("RagAPINew", "tmp")
        if os.path.exists(tmp_dir):
            shutil.rmtree(tmp_dir)
    
        os.makedirs(tmp_dir, exist_ok=True)
    
        for file_name in file_names:
            remote_path = f"{session_id}/{file_name}"
            local_path = os.path.join(tmp_dir, file_name)

            res = supabase.storage.from_(SUPABASE_BUCKET).download(remote_path)
            with open(local_path, "wb") as f:
                f.write(res)
                
        rag_system.load_faiss_index_and_metadata(
                faiss_index_path="RagAPINew/tmp/faiss.idx",
                meta_path="RagAPINew/tmp/meta.json",
                file_path="RagAPINew/tmp/common.txt"
            )

        return jsonify({
            "message": "Files downloaded successfully",
            "saved_to": tmp_dir,
            "files": file_names
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/get-common-txt", methods=["GET"])
def get_common_txt():
    # session_id is ignored for local path
    txt_path = os.path.join("RagAPINew", "tmp", "common.txt")
    if not os.path.exists(txt_path):
        return "common.txt not found", 404
    try:
        with open(txt_path, "r", encoding="utf-8") as f:
            content = f.read()
        return content, 200, {"Content-Type": "text/plain; charset=utf-8"}
    except Exception as e:
        return str(e), 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
