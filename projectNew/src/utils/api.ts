import { API_BASE_URL, API_ENDPOINTS } from './constants';
import type { APIResponse, UploadResponse } from '../types';

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = "https://ragapi.sbssdigital.com/") {
    this.baseURL = baseURL;
  }

  async uploadPDF(file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('session_id', "randomID2"); 

      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));

      xhr.open('POST', `${this.baseURL}${API_ENDPOINTS.UPLOAD_PDF}`);
      xhr.send(formData);
    });
  }

  async analyzeText(text: string): Promise<UploadResponse> {
    try {
      const response = await fetch(`${this.baseURL}/upload-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await response.json();
      if (!response.ok || !data.session_id) {
        throw new Error(data.error || 'No response from server');
      }
      return {
        document_id: data.session_id,
        status: 'success'
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload text');
    }
  }

  async sendQuestion(question: string, documentId: string): Promise<APIResponse> {
    try {
      const response = await fetch(`${this.baseURL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, conversation_id: documentId })
      });
      const data = await response.json();
      if (!response.ok || !data.response) {
        throw new Error(data.error || 'No response from server');
      }
      return {
        answer: data.response,
        confidence: 1.0 // The backend does not return confidence, so we set a default
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch answer');
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}${API_ENDPOINTS.HEALTH}`);
      if (!response.ok) return false;
      const data = await response.json();
      return data.status === "ok";
    } catch {
      return false;
    }
  }

  async fetchSessions(): Promise<{ id: string; name: string }[]> {
    try {
      const res = await fetch(`${this.baseURL}/list-sessions`);
      const data = await res.json();
      if (data.sessions) {
        return data.sessions.map((id: string) => ({ id, name: id }));
      } else {
        return [];
      }
    } catch (error) {
      console.error("Fetch error:", error);
      return [];
    }
  }

  async loadSession(sessionId: string): Promise<string> {
    try {
      await fetch(`${this.baseURL}/load_session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      });
      const txtRes = await fetch(`${this.baseURL}/get-common-txt?session_id=${encodeURIComponent(sessionId)}`);
      return await txtRes.text();
    } catch (error) {
      throw new Error('Failed to load session.');
    }
  }


}

export const apiClient = new APIClient();