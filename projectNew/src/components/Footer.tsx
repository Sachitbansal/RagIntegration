import React from 'react';
import { Heart, Mail, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto bg-white/5 dark:bg-gray-900/50 backdrop-blur-sm border-t border-white/10 dark:border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Creator Attribution */}
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Created by</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">Sachit Bansal</span>
          </div>

          {/* Version and Links */}
          <div className="flex items-center space-x-6 text-sm">
            <span className="text-gray-600 dark:text-gray-400">DocuMind AI v1.0</span>
            <div className="flex items-center space-x-4">
              <a
                href="mailto:contact@documind.ai"
                className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>Contact</span>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Linkedin className="w-4 h-4" />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-xs text-gray-500 dark:text-gray-500">
            © 2025 DocuMind AI. All rights reserved.
          </div>
        </div>

        {/* Additional Links */}
        <div className="mt-4 pt-4 border-t border-white/10 dark:border-gray-800/50">
          <div className="flex justify-center space-x-6 text-xs text-gray-500 dark:text-gray-500">
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Documentation
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}