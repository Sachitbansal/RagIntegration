import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Zap } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { apiClient } from '../utils/api';
import { QUICK_ACTIONS } from '../utils/constants';

export function HomePage() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sessions, setSessions] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState(false);


  useEffect(() => {
    // Fetch sessions from backend
    const fetchAndSetSessions = async () => {
      const sessions = await apiClient.fetchSessions();
      setSessions(sessions);
      console.log("Fetched sessions:", sessions);
    };
    fetchAndSetSessions();
  }, []);


  const handleTextSubmit = async () => {
    if (!text.trim()) return;
    setIsUploading(true);
    try {
      const response = await apiClient.analyzeText(text);
      // Navigate to session route with new session/document id
      navigate(`/session/${response.document_id}`);
    } catch (error) {
      console.error('Error analyzing text:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const response = await apiClient.uploadPDF(file, setUploadProgress);
      navigate(`/session/${response.document_id}`);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleSessionClick = async (session: { id: string; name: string }) => {
    setIsLoadingSession(true);
    try {
      // Optionally, you can check if session exists or load it here
      navigate(`/session/${session.id}`);
    } catch (error) {
      alert('Failed to load session.');
    } finally {
      setIsLoadingSession(false);
    }
  };

  if (isUploading || isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 dark:from-gray-900 dark:via-blue-950 dark:to-gray-900">
        <div className="text-center space-y-6">
          <LoadingSpinner
            message={isLoadingSession ? 'Loading session...' : (uploadProgress > 0 ? `Uploading... ${Math.round(uploadProgress)}%` : "Analyzing document...")}
            size="lg"
          />
          {uploadProgress > 0 && !isLoadingSession && (
            <div className="w-64 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 dark:from-gray-900 dark:via-blue-950 dark:to-gray-900 flex items-center justify-center p-4 pt-20 md:pt-0">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              DocuMind AI
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Intelligent Document Analysis & Question-Answering Platform
          </p>
          <p className="text-gray-400">
            Powered by RAG (Retrieval-Augmented Generation) Technology
          </p>
        </div>

        {/* Input Methods */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Text Input */}
          <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-white/20 dark:border-gray-700/50">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Paste Your Text</h2>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your text here for AI analysis..."
              className="w-full h-48 p-4 bg-white/5 dark:bg-gray-900/50 border border-white/10 dark:border-gray-700/50 rounded-xl text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <button
              onClick={handleTextSubmit}
              disabled={!text.trim()}
              className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
            >
              <Zap className="w-5 h-5 inline mr-2" />
              Analyze Text
            </button>
          </div>

          {/* File Upload */}
          <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-white/20 dark:border-gray-700/50">
            <div className="flex items-center space-x-3 mb-4">
              <Upload className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Upload PDF</h2>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative h-48 border-2 border-dashed rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer ${isDragging
                  ? 'border-blue-400 bg-blue-400/10'
                  : 'border-white/30 dark:border-gray-600/50 hover:border-blue-400 hover:bg-blue-400/5'
                }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-center">
                <Upload className={`w-12 h-12 mx-auto mb-4 transition-colors ${isDragging ? 'text-blue-400' : 'text-gray-400'
                  }`} />
                <p className="text-gray-400">Drag & drop a PDF file here, or click to upload</p>
              </div>
            </div>

            <input
              type="file"
              accept="application/pdf"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="hidden"
            />
          </div>
        </div>

        {/* Sessions Card */}
        {sessions.length > 0 && (
          <div className="mt-8 mb-8">
            <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-white/20 dark:border-gray-700/50">
              <h2 className="text-xl font-semibold text-white mb-4">Older Conversations</h2>
              <div className="flex flex-wrap gap-3">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => handleSessionClick(session)}
                    className="px-4 py-2 bg-white/5 dark:bg-gray-800/30 hover:bg-white/10 dark:hover:bg-gray-700/50 text-gray-300 text-sm rounded-lg border border-white/10 dark:border-gray-700/50 transition-all duration-200"
                  >
                    {session.name || session.id}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 mb-4">Quick Actions:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {QUICK_ACTIONS.map((action, index) => (
              <button
                key={index}
                className="px-4 py-2 bg-white/5 dark:bg-gray-800/30 hover:bg-white/10 dark:hover:bg-gray-700/50 text-gray-300 text-sm rounded-lg border border-white/10 dark:border-gray-700/50 transition-all duration-200"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
