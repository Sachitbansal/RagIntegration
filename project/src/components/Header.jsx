import React from 'react';
import { Menu, Sun, Moon, Bot } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Header = ({ onToggleSidebar, sidebarOpen }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Menu size={20} className="text-gray-700 dark:text-gray-300" />
        </button>
        
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              AI Assistant
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your intelligent companion
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={toggleTheme}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        {theme === 'light' ? (
          <Moon size={20} className="text-gray-700 dark:text-gray-300" />
        ) : (
          <Sun size={20} className="text-gray-700 dark:text-gray-300" />
        )}
      </button>
    </header>
  );
};

export default Header;