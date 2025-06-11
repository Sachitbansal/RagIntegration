const CONVERSATIONS_KEY = 'chatbot-conversations';
const CURRENT_CONVERSATION_KEY = 'chatbot-current-conversation';

export const saveConversations = (conversations) => {
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
};

export const loadConversations = () => {
  try {
    const saved = localStorage.getItem(CONVERSATIONS_KEY);
    if (!saved) return [];
    
    const conversations = JSON.parse(saved);
    return conversations.map((conv) => ({
      ...conv,
      createdAt: new Date(conv.createdAt),
      updatedAt: new Date(conv.updatedAt),
      messages: conv.messages.map((msg) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    }));
  } catch (error) {
    console.error('Error loading conversations:', error);
    return [];
  }
};

export const saveCurrentConversationId = (id) => {
  localStorage.setItem(CURRENT_CONVERSATION_KEY, id);
};

export const loadCurrentConversationId = () => {
  return localStorage.getItem(CURRENT_CONVERSATION_KEY);
};

export const generateConversationTitle = (firstMessage) => {
  const maxLength = 50;
  if (firstMessage.length <= maxLength) {
    return firstMessage;
  }
  return firstMessage.substring(0, maxLength).trim() + '...';
};