import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { askAIHealthAssistant, AIResponse } from '../../services/ai';
import { 
  MessageSquare, Plus, Search, Trash2, Send, Heart, 
  AlertTriangle, Shield, Check, Info, Loader2 
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  isEmergency?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastUpdated: Date;
}

export const AIAssistantChat: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`jivexa_chats_${user?.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const formatted = parsed.map((c: any) => ({
          ...c,
          lastUpdated: new Date(c.lastUpdated),
          messages: c.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
        }));
        setConversations(formatted);
        if (formatted.length > 0) {
          setActiveConvId(formatted[0].id);
        }
      } catch (e) {
        localStorage.removeItem(`jivexa_chats_${user?.id}`);
      }
    }
  }, [user?.id]);

  const syncConversations = (list: Conversation[]) => {
    setConversations(list);
    localStorage.setItem(`jivexa_chats_${user?.id}`, JSON.stringify(list));
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeConvId, isLoading]);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  const startNewConversation = (initialTitle = 'New Conversation') => {
    const newConv: Conversation = {
      id: `chat_${Date.now()}`,
      title: initialTitle,
      messages: [],
      lastUpdated: new Date()
    };
    const updated = [newConv, ...conversations];
    syncConversations(updated);
    setActiveConvId(newConv.id);
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    let currentConvId = activeConvId;
    let currentConvs = [...conversations];

    if (!currentConvId) {
      const newId = `chat_${Date.now()}`;
      const newTitle = textToSend.slice(0, 30) + (textToSend.length > 30 ? '...' : '');
      const newConv: Conversation = {
        id: newId,
        title: newTitle,
        messages: [],
        lastUpdated: new Date()
      };
      currentConvs = [newConv, ...currentConvs];
      currentConvId = newId;
    }

    const targetConvIndex = currentConvs.findIndex((c) => c.id === currentConvId);
    if (targetConvIndex === -1) return;

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    const targetConv = { ...currentConvs[targetConvIndex] };
    targetConv.messages = [...targetConv.messages, userMsg];
    targetConv.lastUpdated = new Date();
    
    if (targetConv.title === 'New Conversation') {
      targetConv.title = textToSend.slice(0, 30) + (textToSend.length > 30 ? '...' : '');
    }

    currentConvs[targetConvIndex] = targetConv;
    const sorted = [
      targetConv,
      ...currentConvs.filter((c) => c.id !== currentConvId)
    ];

    syncConversations(sorted);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response: AIResponse = await askAIHealthAssistant(textToSend);
      const aiMsg: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        sender: 'ai',
        text: response.text,
        timestamp: new Date(),
        isEmergency: response.isEmergency
      };

      const updatedConvs = sorted.map((c) => {
        if (c.id === currentConvId) {
          return {
            ...c,
            messages: [...c.messages, aiMsg],
            lastUpdated: new Date()
          };
        }
        return c;
      });

      syncConversations(updatedConvs);
    } catch (err) {
      const errMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        sender: 'ai',
        text: 'Sorry, I encountered an issue processing your request. Please try again.',
        timestamp: new Date()
      };
      const updatedConvs = sorted.map((c) => c.id === currentConvId ? { ...c, messages: [...c.messages, errMsg] } : c);
      syncConversations(updatedConvs);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = conversations.filter((c) => c.id !== id);
    syncConversations(filtered);
    if (activeConvId === id) {
      setActiveConvId(filtered.length > 0 ? filtered[0].id : null);
    }
  };

  const clearAllConversations = () => {
    syncConversations([]);
    setActiveConvId(null);
  };

  const filteredConvs = conversations.filter((c) => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.messages.some((m) => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const suggestedQuestions = [
    'Tell me about common causes of headaches.',
    'What should I know about seasonal allergies?',
    'How can I prepare for a doctor appointment?',
    'Explain simple terms in medical blood reports.'
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', height: 'calc(100vh - var(--header-height) - 48px)' }} className="chat-layout-mobile">
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px', overflow: 'hidden' }} className="chat-history-sidebar">
        <Button onClick={() => startNewConversation()} style={{ height: '38px', fontSize: '0.85rem' }} fullWidth>
          <Plus size={16} />
          New Conversation
        </Button>

        <div style={{ position: 'relative' }}>
          <Input 
            placeholder="Search chat history"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ height: '36px', fontSize: '0.82rem', paddingLeft: '32px' }}
            icon={<Search size={14} style={{ color: 'var(--text-light)' }} />}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {filteredConvs.length === 0 ? (
            <div style={{ padding: '20px 0', color: 'var(--text-light)', fontSize: '0.78rem', textAlign: 'center' }}>
              No history found.
            </div>
          ) : (
            filteredConvs.map((conv) => {
              const isActive = conv.id === activeConvId;
              return (
                <div 
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--text-main)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                  className="chat-history-item"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                    <MessageSquare size={14} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: isActive ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.title}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => deleteConversation(conv.id, e)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-light)', opacity: isActive ? 1 : 0 }}
                    className="delete-chat-btn"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {conversations.length > 0 && (
          <button 
            onClick={clearAllConversations}
            style={{ background: 'transparent', border: 'none', color: 'var(--error)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', padding: '6px' }}
          >
            <Trash2 size={12} />
            Clear All History
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', position: 'relative' }}>
        
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>AI Health Assistant</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Educational health info companion</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--secondary)', fontSize: '0.78rem', fontWeight: 600 }}>
            <Shield size={14} />
            <span>Secure consultation channel</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            backgroundColor: 'var(--info-light)',
            border: '1px solid var(--info)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}>
            <Info size={18} style={{ color: 'var(--info)', flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
              **Educational Disclaimer:** This AI provides general healthcare information and does not replace diagnostic assessments by a qualified physician. **Do not use this system for active medical emergencies.**
            </p>
          </div>

          {(!activeConv || activeConv.messages.length === 0) ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '40px 20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={24} style={{ margin: 'auto' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ fontWeight: 700 }}>How can JIVEXA help you today?</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '400px' }}>
                  Ask questions about health reports, symptom explanations, or prepare questions to ask your physician during your next consult.
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%', maxWidth: '560px', marginTop: '12px' }} className="grid-1-mobile">
                {suggestedQuestions.map((q, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: 'var(--surface-raised)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'left',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: 'var(--text-main)',
                      transition: 'all var(--transition-fast)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-light)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-raised)'}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            activeConv.messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div 
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                    width: '100%'
                  }}
                >
                  <div 
                    style={{
                      maxWidth: '80%',
                      padding: '14px 18px',
                      borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      backgroundColor: isUser ? 'var(--primary)' : msg.isEmergency ? 'var(--error-light)' : 'var(--surface-raised)',
                      color: isUser ? 'white' : 'var(--text-main)',
                      border: msg.isEmergency ? '1px solid var(--error)' : 'none',
                      boxShadow: 'var(--shadow-sm)',
                      fontSize: '0.88rem',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {msg.text.split('\n').map((line, lIdx) => {
                      if (line.startsWith('###')) {
                        return <h4 key={lIdx} style={{ fontSize: '1rem', fontWeight: 700, margin: '12px 0 6px 0', color: isUser ? 'white' : 'var(--primary)' }}>{line.replace('###', '')}</h4>;
                      }
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <strong key={lIdx} style={{ display: 'block', margin: '8px 0 4px 0' }}>{line.replace(/\*\*/g, '')}</strong>;
                      }
                      return <p key={lIdx} style={{ margin: '4px 0' }}>{line}</p>;
                    })}
                  </div>
                </div>
              );
            })
          )}

          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
              <div style={{
                maxWidth: '80%',
                padding: '14px 18px',
                borderRadius: '16px 16px 16px 2px',
                backgroundColor: 'var(--surface-raised)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.88rem',
                color: 'var(--text-muted)'
              }}>
                <Loader2 size={16} className="animate-pulse" />
                <span>Simulating clinical guidance lookup...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {activeConv && activeConv.messages.length > 0 && !isLoading && (
          <div style={{ padding: '0 24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {activeConv.messages[activeConv.messages.length - 1].sender === 'ai' && (
              ['How can I preparing for a consult?', 'Explain lipid profile levels.', 'Find a general physician'].map((q, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'white',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    color: 'var(--primary)',
                    fontWeight: 600
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-light)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  {q}
                </button>
              ))
            )}
          </div>
        )}

        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px' }}>
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputMessage); }}
            style={{ display: 'flex', width: '100%', gap: '12px' }}
          >
            <input 
              placeholder="Ask JIVEXA Health Assistant..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '12px 18px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                outline: 'none',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.92rem'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--border-focus)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            />
            <Button type="submit" disabled={isLoading || !inputMessage.trim()}>
              <Send size={16} />
              <span className="sr-mobile-hide">Send</span>
            </Button>
          </form>
        </div>

      </div>

      <style>{`
        .chat-history-item:hover .delete-chat-btn { opacity: 1 !important; }
        @media (max-width: 768px) {
          .chat-layout-mobile {
            grid-template-columns: 1fr !important;
          }
          .chat-history-sidebar {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
