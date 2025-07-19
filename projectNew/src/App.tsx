import React, { useState, useEffect } from 'react';
import { HomePage } from './components/HomePage';
import { DocumentPreview } from './components/DocumentPreview';
import { ChatInterface } from './components/ChatInterface';
import { ThemeToggle } from './components/ThemeToggle';
import { APIStatus } from './components/APIStatus';
import { Footer } from './components/Footer';
import { useTheme } from './hooks/useTheme';
import type { Document } from './types';

function App() {
  const [document, setDocument] = useState<Document | null>(null);
  const { toggleTheme } = useTheme();

  useEffect(() => {
    const handleKeyboardShortcuts = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        toggleTheme();
      }
      
      if (e.key === 'Escape') {
        // Clear current input or reset app
        if (document) {
          setDocument(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyboardShortcuts);
    return () => window.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [document, toggleTheme]);

  if (!document) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="absolute top-4 right-4 z-10 flex items-center space-x-3">
          <APIStatus />
          <ThemeToggle />
        </header>

        <HomePage onDocumentReady={setDocument} />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 dark:from-gray-900 dark:via-blue-950 dark:to-gray-900">
      {/* Header */}
      <header className="p-4 flex justify-between items-center bg-white/5 dark:bg-gray-900/50 backdrop-blur-sm border-b border-white/10 dark:border-gray-800/50">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setDocument(null)}
            className="px-4 py-2 bg-white/10 dark:bg-gray-800/50 hover:bg-white/20 dark:hover:bg-gray-700/50 text-white rounded-lg transition-all duration-200 border border-white/20 dark:border-gray-700/50"
          >
            ← New Document
          </button>
          <h1 className="text-xl font-bold text-white">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              DocuMind AI
            </span>
          </h1>
        </div>
        
        <div className="flex items-center space-x-3">
          <APIStatus />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Document Preview */}
        <div className="lg:col-span-1">
          <DocumentPreview document={document} />
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <ChatInterface document={document} />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;