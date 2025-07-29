# 🧠 DocuMind AI - Project Overview

## 🔍 Problem Statement

**DocuMind AI** enables users to upload documents and interact with them through a chat interface using **Retrieval-Augmented Generation (RAG)**. The system processes documents, stores them, and enables users to ask questions as if chatting with the document.

---

## 🔧 Tech Stack

### 🖥️ Frontend – React + Vite
- `useState`, `useEffect` for local state
- `React Router` (planned): to manage dynamic session-based URLs (`/session/:id`)
- Components:
  - `HomePage` → Upload documents
  - `ChatInterface` → Chat with document
  - `DocumentPreview`, `ThemeToggle`, `APIStatus`, `Footer`
- Google Login via [Google Identity Services](https://developers.google.com/identity/gsi/web)

### 🔙 Backend – Flask (Python)
- Libraries:
  - `Flask`, `Flask-CORS`, `python-dotenv`
  - `langchain`, `faiss-cpu`, `sentence-transformers`, `PyMuPDF`
  - `supabase`, `langchain-community`
  - `google-auth`, `google-auth-oauthlib` for OAuth token verification
- API Endpoints:
  - `/api/upload` – Upload document
  - `/api/list-sessions` – Get uploaded session names
  - `/api/auth/google` – Verify Google identity token
- RAG Pipeline:
  - Chunk documents → Embed → Store in FAISS index
  - Query: Embed → Similarity Search → Prompt LLM with relevant context

### ☁️ Storage & Authentication – Supabase
- Buckets used to store uploaded PDFs
- Used for managing user-specific sessions and document folders

### 🐳 Deployment – Docker
- Dockerized Flask backend
- GitHub → Server Pull → `docker build` + `docker run -d` setup
- Persistent Docker image with rebuild on new pushes
- Commands:
  - `docker build -t ragapi-image .`
  - `docker run -d -p 5001:5000 --name ragapi-container ragapi-image`

---

## ✅ Features Implemented

- ✅ Upload PDF documents to Supabase
- ✅ List stored sessions
- ✅ Document parsing and vector indexing (RAG)
- ✅ Chat interface for question answering
- ✅ Google Sign-In (in progress – CORS & origin fix)
- ✅ Dockerized backend with rebuild + restart workflow
- ✅ API responses structured with error handling

---

## 🚧 Issues / Bugs
- `shutil` mistakenly added to `requirements.txt` (fixed – it’s a built-in module)
- CORS preflight `OPTIONS` request returns 404 → now handled properly
- Supabase `.list()` response may need folder filtering logic
- Google Identity: "Given origin is not allowed for client ID" → Need to add both frontend (`http://localhost:5173`) and backend (`http://127.0.0.1:5001`) origins in Google Console

---

## 📌 Next Steps

- [ ] Finalize Google login and store user metadata
- [ ] Integrate `React Router` to route to `/session/:id` after document upload
- [ ] Improve Supabase folder detection (filter only valid sessions)
- [ ] Add persistence: Store FAISS index and metadata
- [ ] Deploy with HTTPS + connect to subdomain (`ragapi.sbssdigital.com`)
- [ ] Optional: Add user dashboard for past chats/documents

---

## 🧠 Project Idea in One Line

> *DocuMind AI is your AI copilot for documents — upload, chat, understand, all in one interface.*

