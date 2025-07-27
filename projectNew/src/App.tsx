import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { DocumentPreview } from './components/DocumentPreview';
import { ChatInterface } from './components/ChatInterface';
import { ThemeToggle } from './components/ThemeToggle';
import { APIStatus } from './components/APIStatus';
import { Footer } from './components/Footer';
import { useTheme } from './hooks/useTheme';
import { GoogleLogin } from '@react-oauth/google';
import { apiClient } from './utils/api';

function AppRoutes() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const handleGoogleLoginSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      try {
        await apiClient.loginWithGoogle(credentialResponse.credential);
        setShowLoginModal(false);
        // Optionally store user info/token here
      } catch (err) {
        alert('Google login failed');
      }
    }
  };
  const handleGoogleLoginError = () => {
    alert('Google login failed');
  };
  const navigate = useNavigate();
  const params = useParams();
  const { toggleTheme } = useTheme();
  useEffect(() => {
    const handleKeyboardShortcuts = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        toggleTheme();
      }
      if (e.key === 'Escape') {
        // Go back to home page
        if (params.sessionId) {
          navigate('/');
        }
      }
    };
    window.addEventListener('keydown', handleKeyboardShortcuts);
    return () => window.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [toggleTheme, params.sessionId, navigate]);
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="absolute top-4 right-4 z-10 flex items-center space-x-3">
              <APIStatus />
              <ThemeToggle />
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-6 rounded-xl border border-white/20 shadow-lg transition-all duration-200"
              >
                Login
              </button>
            </header>
            {showLoginModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl w-full max-w-xs text-center relative">
                  <button
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl font-bold"
                    onClick={() => setShowLoginModal(false)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                  <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Sign in</h2>
                  <GoogleLogin
                    onSuccess={handleGoogleLoginSuccess}
                    onError={handleGoogleLoginError}
                    useOneTap
                  />
                </div>
              </div>
            )}
            <HomePage />
            <Footer />
          </div>
        }
      />
      <Route
        path="/session/:sessionId"
        element={
          <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 dark:from-gray-900 dark:via-blue-950 dark:to-gray-900">
            {/* Header */}
            <header className="p-4 flex justify-between items-center bg-white/5 dark:bg-gray-900/50 backdrop-blur-sm border-b border-white/10 dark:border-gray-800/50">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('/')}
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
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-6 rounded-xl border border-white/20 shadow-lg transition-all duration-200"
                >
                  Login
                </button>
              </div>
            </header>
            {showLoginModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl w-full max-w-xs text-center relative">
                  <button
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl font-bold"
                    onClick={() => setShowLoginModal(false)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                  <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Sign in</h2>
                  <GoogleLogin
                    onSuccess={handleGoogleLoginSuccess}
                    onError={handleGoogleLoginError}
                    useOneTap
                  />
                </div>
              </div>
            )}
            {/* Main Content */}
            <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 pt-20">
              {/* Document Preview */}
              <div className="lg:col-span-1">
                <DocumentPreview />
              </div>
              {/* Chat Interface */}
              <div className="lg:col-span-2">
                <ChatInterface />
              </div>
            </main>
            <Footer />
          </div>
        }
      />
    </Routes>
  );
}


function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;