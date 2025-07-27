import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LoadingSpinner } from './LoadingSpinner';
import type { Document } from '../types';
import { apiClient } from '../utils/api';

export function DocumentPreview() {
  const { sessionId } = useParams();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchDocument() {
      if (!sessionId) return;
      setLoading(true);
      try {
        // Use the same API as ChatInterface
        const doc = await apiClient.getDocumentBySessionId(sessionId);
        setDocument(doc);
        console.log("Fetched document:", doc);
      } catch (e) {
        setDocument(null);
        console.error("Error fetching document:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchDocument();
  }, [sessionId]);

  if (loading || !document) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner message={loading ? 'Loading document...' : 'No document loaded.'} size="md" />
      </div>
    );
  }

  return (
    <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 h-full">
      <h2 className="text-xl font-semibold text-white mb-4">Document Preview</h2>
      <div className="p-4 h-full overflow-y-auto">
        {document.type === 'text' && document.content ? (
          <div className="prose prose-invert max-w-none">
            <pre
              className="text-gray-300 text-sm whitespace-pre-wrap font-sans leading-relaxed max-h-[60vh] overflow-y-auto w-full pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
              style={{ direction: 'ltr', overflowX: 'hidden' }}
            >
              {document.content}
            </pre>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              {/* You can import and use an icon here if desired */}
              <span className="w-16 h-16 inline-block mb-4 bg-gray-500 rounded-full" />
              <p className="text-gray-400">PDF preview coming soon</p>
              <p className="text-gray-500 text-sm mt-2">
                Document uploaded successfully
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
