import { create } from 'zustand';

interface Message {
  id: number;
  sender_id: string;
  sender_name: string;
  content: string;
  message_type: string;
  created_at: string;
  conversation_id: number;
}

interface Conversation {
  id: number;
  conversation_type: string;
  status: string;
  last_message?: string;
  last_message_time?: string;
  participants: any[];
  unread_count?: number;
  created_at: string;
}

interface ChatStore {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isEscalated: boolean;
  escalationReason: string | null;
  setConversations: (convs: Conversation[]) => void;
  setCurrentConversation: (conv: Conversation | null) => void;
  setMessages: (messages: Message[]) => void;
  setLoading: (loading: boolean) => void;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: number) => Promise<void>;
  sendMessage: (conversationId: number, content: string, type?: string) => Promise<boolean>;
  escalateConversation: (conversationId: number) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  isEscalated: false,
  escalationReason: null,
  setConversations: (conversations) => set({ conversations }),
  setCurrentConversation: (conv) => set({ currentConversation: conv }),
  setMessages: (messages) => set({ messages }),
  setLoading: (isLoading) => set({ isLoading }),
  loadConversations: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/chat/conversations');
      const data = await res.json();
      if (data.conversations) set({ conversations: data.conversations });
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  loadMessages: async (conversationId) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/chat/messages?conversationId=${conversationId}`);
      const data = await res.json();
      if (data.messages) set({ messages: data.messages });
      if (data.escalated) {
        set({ isEscalated: true, escalationReason: data.escalation_reason || 'rule_of_four' });
      } else {
        set({ isEscalated: false, escalationReason: null });
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  sendMessage: async (conversationId, content, type = 'text') => {
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId, content, message_type: type }),
      });
      const data = await res.json();
      if (data.blocked) {
        set({ isEscalated: true, escalationReason: data.reason });
        return false;
      }
      if (data.message) {
        set({ messages: [...get().messages, data.message] });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  },
  escalateConversation: async (conversationId) => {
    try {
      await fetch(`/api/chat/escalate/${conversationId}`, { method: 'POST' });
      set({ isEscalated: true });
    } catch (error) {
      console.error('Failed to escalate:', error);
    }
  },
}));
