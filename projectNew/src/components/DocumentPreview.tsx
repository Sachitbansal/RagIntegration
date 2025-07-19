import React, { useState } from 'react';
import { FileText, File } from 'lucide-react';
import type { Document } from '../types';

interface DocumentPreviewProps {
  document: Document;
}

export function DocumentPreview({ document }: DocumentPreviewProps) {
  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="h-full bg-white/10 dark:bg-gray-800/50 backdrop-blur-lg rounded-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 dark:border-gray-700/50">
        <div className="flex items-center space-x-3">
          {document.type === 'pdf' ? (
            <File className="w-6 h-6 text-red-400" />
          ) : (
            <FileText className="w-6 h-6 text-blue-400" />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold truncate">
              {document.name}
            </h3>
            <p className="text-gray-400 text-sm">
              {formatFileSize(document.size)}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
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
              <File className="w-16 h-16 text-gray-500 mx-auto mb-4" />
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