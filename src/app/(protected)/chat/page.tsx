'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Send, MessageCircle, AlertTriangle, PlusCircle, X, User } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { toast } from 'sonner';
import { formatRelativeTime } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const { data: session } = useSession();
  const { conversations, currentConversation, messages, isLoading, isEscalated, escalationReason,
    loadConversations, loadMessages, sendMessage, setCurrentConversation } = useChatStore();
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [leaders, setLeaders] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = (session?.user as any)?.id;

  useEffect(() => {
    loadConversations();
    fetchLeaders();
  }, []);

  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
    }
  }, [currentConversation?.id]);

  // Real-time polling — refresh messages every 5 s
  useEffect(() => {
    if (!currentConversation) return;
    const interval = setInterval(() => {
      loadMessages(currentConversation.id);
    }, 5000);
    return () => clearInterval(interval);
  }, [currentConversation?.id]);

  // Poll conversations list every 15 s
  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchLeaders() {
    try {
      const res = await fetch('/api/leaders/available').catch(() => null);
      if (res) {
        const data = await res.json();
        setLeaders(data.leaders || []);
      }
    } catch {}
  }

  async function handleSend() {
    if (!messageText.trim() || !currentConversation) return;
    setSending(true);
    const success = await sendMessage(currentConversation.id, messageText);
    if (success) {
      setMessageText('');
    } else if (isEscalated) {
      toast.warning('⚠️ Rule of Four: A guardian has been added to this conversation.');
    }
    setSending(false);
  }

  async function startConversation(leaderId: string) {
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participant_ids: [leaderId], conversation_type: 'one_on_one' }),
      });
      const data = await res.json();
      if (data.conversation) {
        setShowNewChat(false);
        await loadConversations();
        setCurrentConversation(data.conversation);
      }
    } catch {
      toast.error('Failed to start conversation');
    }
  }

  const getConvName = (conv: any) => {
    const others = conv.participants?.filter((p: any) => p.user_id !== userId) || [];
    return others.map((p: any) => p.name).join(', ') || 'Chat';
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Conversations List */}
      <div className={cn(
        'flex flex-col border-r border-gray-200 bg-white',
        currentConversation ? 'hidden lg:flex lg:w-80' : 'flex w-full'
      )}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h1 className="font-bold text-gray-900">Messages</h1>
          <button
            onClick={() => setShowNewChat(true)}
            className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 px-4 text-gray-400">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-200" />
              <p className="font-medium text-gray-500">No conversations yet</p>
              <p className="text-sm mt-1">Connect with a leader to start a spiritual conversation</p>
              <button
                onClick={() => setShowNewChat(true)}
                className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700"
              >
                Start a conversation
              </button>
            </div>
          ) : (
            conversations.map((conv: any) => (
              <button
                key={conv.id}
                onClick={() => setCurrentConversation(conv)}
                className={cn(
                  'w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left',
                  currentConversation?.id === conv.id && 'bg-indigo-50 border-l-4 border-l-indigo-500'
                )}
              >
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarFallback>{getInitials(getConvName(conv))}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 text-sm truncate">{getConvName(conv)}</span>
                    {conv.last_message_time && (
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatRelativeTime(conv.last_message_time)}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-gray-500 truncate">{conv.last_message || 'No messages yet'}</p>
                    {conv.unread_count > 0 && (
                      <span className="bg-indigo-600 text-white text-xs rounded-full px-1.5 py-0.5 flex-shrink-0 ml-2">{conv.unread_count}</span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      {currentConversation ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-100 bg-white flex items-center gap-3">
            <button onClick={() => setCurrentConversation(null)} className="lg:hidden p-1 text-gray-500">
              ←
            </button>
            <Avatar className="h-9 w-9">
              <AvatarFallback>{getInitials(getConvName(currentConversation))}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-gray-900 text-sm">{getConvName(currentConversation)}</div>
              <div className="text-xs text-gray-500 capitalize">{currentConversation.conversation_type?.replace('_', ' ')}</div>
            </div>
            {currentConversation.status === 'escalated' && (
              <div className="ml-auto flex items-center gap-1.5 bg-orange-100 text-orange-700 px-2 py-1 rounded-lg text-xs font-medium">
                <AlertTriangle className="h-3 w-3" />
                Escalated
              </div>
            )}
          </div>

          {/* Rule of Four Warning */}
          {isEscalated && (
            <div className="mx-4 mt-3 p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-semibold text-orange-800">Rule of Four Activated</div>
                <div className="text-xs text-orange-600 mt-0.5">
                  For accountability, a pastor or guardian has been added to this conversation. This is for your protection.
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg: any) => {
              const isMe = msg.sender_id === userId;
              const isSystem = msg.message_type === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className="bg-gray-100 text-gray-600 text-xs px-4 py-2 rounded-full">{msg.content}</div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={cn('flex items-end gap-2', isMe ? 'flex-row-reverse' : 'flex-row')}>
                  {!isMe && (
                    <Avatar className="h-7 w-7 flex-shrink-0">
                      <AvatarFallback className="text-xs">{getInitials(msg.sender_name)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn('flex flex-col max-w-xs lg:max-w-md', isMe ? 'items-end' : 'items-start')}>
                    {!isMe && <span className="text-xs text-gray-500 mb-1 ml-1">{msg.sender_name}</span>}
                    <div className={cn(
                      'px-4 py-2.5 rounded-2xl text-sm',
                      isMe ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                    )}>
                      {msg.content}
                    </div>
                    <span className="text-xs text-gray-400 mt-1 px-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-100 pb-safe">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Type a message..."
                disabled={isEscalated}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSend}
                disabled={!messageText.trim() || sending || isEscalated}
                className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center text-gray-400">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-200" />
            <p className="font-medium text-gray-500">Select a conversation</p>
            <p className="text-sm mt-1">or start a new one to connect with your leader</p>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-gray-900">Start a Conversation</h3>
              <button onClick={() => setShowNewChat(false)}><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-4">Connect with an available leader for spiritual guidance</p>
              {leaders.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  No leaders available right now. Please check back later.
                </div>
              ) : (
                <div className="space-y-2">
                  {leaders.map((leader: any) => (
                    <button
                      key={leader.id}
                      onClick={() => startConversation(leader.user_id)}
                      className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-indigo-50 rounded-xl transition-colors text-left"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{getInitials(leader.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{leader.name}</div>
                        <div className="text-xs text-gray-500">{leader.bio?.substring(0, 50) || 'Church Leader'}</div>
                      </div>
                      <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Available</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
