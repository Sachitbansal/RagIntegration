export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  responseTime?: number;
}

export interface Document {
  id: string;
  name: string;
  size: number;
  type: 'pdf' | 'text';
  content?: string;
  uploadProgress?: number;
}

export interface APIResponse {
  answer: string;
  confidence: number;
}

export interface UploadResponse {
  document_id: string;
  status: string;
}

export type Theme = 'dark' | 'light';

export interface APIStatus {
  status: 'online' | 'offline' | 'checking';
  lastChecked: Date;
}