import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import MessageInput from './components/MessageInput';
import { sendMessageToAPI } from './services/chatService';
import {
  saveConversations,
  loadConversations,
  saveCurrentConversationId,
  loadCurrentConversationId,
  generateConversationTitle
} from './utils/localStorage';

function ChatApp() {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load conversations and current conversation on mount
  useEffect(() => {
    const savedConversations = loadConversations();
    const savedCurrentId = loadCurrentConversationId();
    
    setConversations(savedConversations);
    
    if (savedCurrentId && savedConversations.some(conv => conv.id === savedCurrentId)) {
      setCurrentConversationId(savedCurrentId);
    } else if (savedConversations.length > 0) {
      setCurrentConversationId(savedConversations[0].id);
    }
  }, []);

  // Save conversations whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      saveConversations(conversations);
    }
  }, [conversations]);

  // Save current conversation ID whenever it changes
  useEffect(() => {
    if (currentConversationId) {
      saveCurrentConversationId(currentConversationId);
    }
  }, [currentConversationId]);

  const getCurrentConversation = () => {
    return conversations.find(conv => conv.id === currentConversationId) || null;
  };

  const createNewConversation = () => {
    const newConversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    return newConversation.id;
  };

  const updateConversation = (conversationId, updates) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, ...updates, updatedAt: new Date() }
        : conv
    ));
  };

  const handleSendMessage = async (content) => {
    let conversationId = currentConversationId;
    
    // Create new conversation if none exists
    if (!conversationId) {
      conversationId = createNewConversation();
    }

    const userMessage = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date()
    };

    // Add user message to conversation
    const currentConv = getCurrentConversation();
    const updatedMessages = [...(currentConv?.messages || []), userMessage];
    
    updateConversation(conversationId, { 
      messages: updatedMessages,
      title: currentConv?.messages.length === 0 ? generateConversationTitle(content) : currentConv?.title
    });

    setIsLoading(true);

    try {
      // Send message to API
      const response = await sendMessageToAPI(content, conversationId);
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date()
      };

      // Add assistant message to conversation
      updateConversation(conversationId, {
        messages: [...updatedMessages, assistantMessage]
      });
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        role: 'assistant',
        timestamp: new Date()
      };

      updateConversation(conversationId, {
        messages: [...updatedMessages, errorMessage]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = (id) => {
    setCurrentConversationId(id);
  };

  const handleNewConversation = () => {
    createNewConversation();
  };

  const handleDeleteConversation = (id) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
    
    if (currentConversationId === id) {
      const remaining = conversations.filter(conv => conv.id !== id);
      setCurrentConversationId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const currentConversation = getCurrentConversation();

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          isOpen={sidebarOpen}
        />
        
        <div className="flex-1 flex flex-col">
          <ChatArea 
            messages={currentConversation?.messages || []}
            isLoading={isLoading}
          />
          
          <MessageInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ChatApp />
    </ThemeProvider>
  );
}

export default App;