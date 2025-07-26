import uvicorn
import os
import shutil
from dotenv import load_dotenv
from uuid import uuid4
from typing import Optional, Dict, List

from fastapi import FastAPI, HTTPException, status, BackgroundTasks, UploadFile, File, Form
from pydantic import BaseModel, Field # Import Field for Pydantic models

# Import CORSMiddleware
from fastapi.middleware.cors import CORSMiddleware

# Supabase client library
from supabase import create_client, Client

load_dotenv()

# --- Supabase Config ---
SUPABASE_URL: str = os.getenv("SUPABASE_URL")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY")
SUPABASE_BUCKET: str = "documindai"

supabase: Optional[Client] = None # Initialize as Optional and None
if not SUPABASE_URL or not SUPABASE_KEY:
    print("EnvironmentError: Supabase credentials (SUPABASE_URL, SUPABASE_KEY) are missing. Supabase operations will be skipped.")
else:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        # Optional: Test connection, though list() will do that anyway
        print("Supabase client initialized successfully.")
    except Exception as e:
        print(f"Error initializing Supabase client: {e}. Supabase operations will be skipped.")
        supabase = None


# --- FastAPI App Initialization ---
app = FastAPI(
    title="DocuMind AI Backend",
    description="FastAPI server for document processing and RAG integration.",
    version="0.1.0",
    docs_url="/documentation",
    redoc_url="/redoc",
)

# --- CORS Configuration ---
origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:5173", # Common React/Vite development server default
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173", # Added for completeness if 127.0.0.1 is used with Vite default
    # "https://your-production-frontend-url.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Placeholder for RAG System ---
class MockRAGSystem:
    def load_faiss_index_and_metadata(self, file_path: str, faiss_index_path: str, meta_path: str):
        print(f"MockRAGSystem: Processing {file_path} to create FAISS index at {faiss_index_path} and metadata at {meta_path}")
        with open(faiss_index_path, "w") as f:
            f.write("dummy faiss index content")
        with open(meta_path, "w") as f:
            f.write('{"status": "mocked_metadata"}')
        print("MockRAGSystem: FAISS index and metadata generated.")

rag_system = MockRAGSystem()

# --- Supabase Helper Functions ---

def upload_to_supabase(local_path: str, storage_path: str, content_type: str):
    """Uploads a local file to Supabase storage."""
    if not supabase:
        print(f"Skipping upload to Supabase: Supabase client not initialized. File: {local_path}")
        return

    try:
        with open(local_path, "rb") as f:
            supabase.storage.from_(SUPABASE_BUCKET).upload(storage_path, f, {
                "content-type": content_type,
                "x-upsert": "true"
            })
        print(f"Successfully uploaded {local_path} to Supabase at {storage_path}")
    except Exception as e:
        print(f"Error uploading {local_path} to Supabase: {e}")
        # In a real app, you might want to log this error more robustly
        # and potentially re-raise if it's critical.

async def save_and_upload_to_supabase(
    file_object: UploadFile, session_id: str, content_type: str
) -> tuple[str, str]:
    """
    Saves an uploaded file locally and then uploads it to Supabase.
    Returns the saved filename and its local path.
    """
    safe_filename = file_object.filename.replace(' ', '_') if file_object.filename else "unknown_file"
    
    tmp_dir = os.path.join('tmp')
    os.makedirs(tmp_dir, exist_ok=True)
    
    save_name = f"{session_id}_{safe_filename}"
    save_path = os.path.join(tmp_dir, save_name)

    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file_object.file, buffer)
        print(f"Saved uploaded file locally to {save_path}")

        upload_to_supabase(save_path, f"{session_id}/{safe_filename}", content_type)
        
        return save_name, save_path
    except Exception as e:
        if os.path.exists(save_path):
            os.remove(save_path)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to process file: {e}")


# --- Background Task Processor ---
async def process_text_upload_task(text: str, session_id: str):
    """
    Performs the heavy lifting of text processing, FAISS generation,
    and Supabase uploads in a background task.
    """
    tmp_dir = os.path.join('tmp')
    os.makedirs(tmp_dir, exist_ok=True)

    local_txt_path = os.path.join(tmp_dir, f"{session_id}_common.txt")
    
    try:
        with open(local_txt_path, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"Saved text locally to {local_txt_path}")
        
        upload_to_supabase(local_txt_path, f"{session_id}/common.txt", "text/plain")
        
        index_path = os.path.join(tmp_dir, f"{session_id}_faiss.idx")
        meta_path = os.path.join(tmp_dir, f"{session_id}_meta.json")
        
        rag_system.load_faiss_index_and_metadata(
            file_path=local_txt_path,
            faiss_index_path=index_path,
            meta_path=meta_path
        )
        print("FAISS index and metadata generated by RAG system.")
        
        upload_to_supabase(index_path, f"{session_id}/faiss.idx", "application/octet-stream")
        
        upload_to_supabase(meta_path, f"{session_id}/meta.json", "application/json")

        print(f"Background task completed for session_id: {session_id}")

    except Exception as e:
        print(f"Error during background processing for session_id {session_id}: {e}")
    finally:
        for path in [local_txt_path, index_path, meta_path]:
            if os.path.exists(path):
                try:
                    os.remove(path)
                    print(f"Cleaned up temporary file: {path}")
                except OSError as e:
                    print(f"Error cleaning up file {path}: {e}")

# --- Pydantic Models for Request/Response Bodies ---
class UploadTextRequest(BaseModel):
    text: str
    session_id: Optional[str] = None

class SessionListResponse(BaseModel):
    sessions: List[str] = Field(..., example=["session_id_1", "session_id_2"])


# --- FastAPI Endpoints ---

@app.get("/")
async def read_root():
    return {"message": "Welcome to DocuMind AI FastAPI Server!"}

@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """
    Health check endpoint to verify server status.
    Returns a simple 'ok' status.
    """
    return {"status": "ok"}

@app.post("/upload-text", status_code=status.HTTP_202_ACCEPTED)
async def upload_text_endpoint(
    request_data: UploadTextRequest,
    background_tasks: BackgroundTasks
):
    """
    Receives text, saves it, processes it (FAISS), and uploads files to Supabase.
    The heavy processing is offloaded to a background task.
    """
    text = request_data.text
    session_id = request_data.session_id if request_data.session_id else str(uuid4())
    if not text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing 'text' in request body"
        )
    background_tasks.add_task(process_text_upload_task, text, session_id)
    return {
        "message": "Text processing initiated in background. Check logs for status.",
        "session_id": session_id
    }

@app.get("/list-sessions", response_model=SessionListResponse)
async def list_sessions():
    """
    Lists all session IDs (folders) present in the Supabase storage bucket.
    """
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase client not initialized. Cannot list sessions."
        )
    try:
        # List objects with no prefix to get folders
        # Supabase's list() might return directories as items with 'name' and 'id'
        # but typically you'd also check 'type' or if 'name' ends with '/' for folders.
        # For simplicity, assuming 'name' directly gives folder names.
        # If your Supabase bucket is structured with 'session_id/file.txt',
        # listing with no prefix will give you the top-level 'session_id' directories.
        
        # Note: The list method in supabase-py is synchronous. If it were async,
        # you'd use await supabase.storage.from_(...).list(...)
        result = supabase.storage.from_(SUPABASE_BUCKET).list("", {"limit": 1000})
        
        # Supabase list() returns a list of dictionaries like:
        # [{'id': '...', 'name': 'folder_name/', 'updated_at': '...', 'created_at': '...', 'last_accessed_at': '...', 'metadata': {}, 'owner': '...', 'path': 'folder_name/', 'type': 'folder'}]
        # or for files:
        # [{'id': '...', 'name': 'file.txt', 'updated_at': '...', 'created_at': '...', 'last_accessed_at': '...', 'metadata': {}, 'owner': '...', 'path': 'folder_name/file.txt', 'type': 'file'}]

        sessions = [item['name'] for item in result]

        return {"sessions": sessions}
    except Exception as e:
        print(f"Error listing sessions from Supabase: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to list sessions: {e}")


# --- Run the Application ---
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)