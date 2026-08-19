import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { MarkdownText } from '../../components/common/MarkdownText';
import { streamAIHealthAssistant, fetchUserTokenUsage, upgradeUserToPro, AIResponse } from '../../services/ai';
import { 
  MessageSquare, Plus, Search, Trash2, Send, Heart, 
  AlertTriangle, Shield, Check, Info, Loader2, Sparkles, Zap, Lock, Crown, Bot, User, CheckCircle
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  isEmergency?: boolean;
  provider?: string;
  isStreaming?: boolean;
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
  
  // Token tracking & subscription state
  const [tokensUsed, setTokensUsed] = useState(0);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'free' | 'active'>('free');
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isUpgrading, setIsUpgrading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch token usage on load
  useEffect(() => {
    const loadUsage = async () => {
      const stats = await fetchUserTokenUsage(user?.id);
      setTokensUsed(stats.tokensUsedThisPeriod || 0);
      setMaxTokens(stats.maxTokens || 1000);
    };
    loadUsage();
  }, [user?.id]);

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

  const handleUpgradeToPro = async () => {
    setIsUpgrading(true);
    const res = await upgradeUserToPro(user?.id);
    setIsUpgrading(false);
    if (res.success) {
      setSubscriptionStatus('active');
      setIsPaywallOpen(false);
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

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

    const aiMsgId = `msg_ai_${Date.now()}`;
    let streamingText = '';
    let currentProvider = 'Groq AI (Llama 3.3)';
    let isEmergencyFlag = false;

    // Insert initial "Thinking..." placeholder
    setConversations((prev) => 
      prev.map((c) => {
        if (c.id === currentConvId) {
          return {
            ...c,
            messages: [
              ...c.messages,
              {
                id: aiMsgId,
                sender: 'ai',
                text: '',
                timestamp: new Date(),
                isStreaming: true
              }
            ]
          };
        }
        return c;
      })
    );

    let lastUpdate = 0;

    try {
      const result = await streamAIHealthAssistant(
        textToSend,
        targetConv.messages.map(m => ({ sender: m.sender, text: m.text })),
        (chunk, provider, isEmerg) => {
          streamingText += chunk;
          if (provider) currentProvider = provider;
          if (isEmerg) isEmergencyFlag = true;

          const now = Date.now();
          if (now - lastUpdate > 20 || chunk.includes('\n')) {
            lastUpdate = now;
            setConversations((prev) => 
              prev.map((c) => {
                if (c.id === currentConvId) {
                  const existingAiIndex = c.messages.findIndex(m => m.id === aiMsgId);
                  const aiMsgObj: ChatMessage = {
                    id: aiMsgId,
                    sender: 'ai',
                    text: streamingText,
                    timestamp: new Date(),
                    provider: currentProvider,
                    isEmergency: isEmergencyFlag,
                    isStreaming: true
                  };
                  if (existingAiIndex === -1) {
                    return { ...c, messages: [...c.messages, aiMsgObj] };
                  } else {
                    const updatedMsgs = [...c.messages];
                    updatedMsgs[existingAiIndex] = aiMsgObj;
                    return { ...c, messages: updatedMsgs };
                  }
                }
                return c;
              })
            );
          }
        },
        user?.id
      );

      // Finalize streaming message state
      setConversations((prev) => 
        prev.map((c) => {
          if (c.id === currentConvId) {
            return {
              ...c,
              messages: c.messages.map((m) => 
                m.id === aiMsgId ? { ...m, isStreaming: false, text: streamingText || m.text } : m
              )
            };
          }
          return c;
        })
      );

      const stats = await fetchUserTokenUsage(user?.id);
      setTokensUsed(stats.tokensUsedThisPeriod || 0);
      setMaxTokens(stats.maxTokens || 1000);
    } catch (err) {
      console.error('[AI Chat Error]', err);
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
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - var(--header-height) - 48px)' }}>
      {/* BRAND HEADER BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #10b981 100%)',
        borderRadius: '20px',
        padding: '20px 28px',
        color: 'white',
        boxShadow: '0 8px 24px -6px rgba(15, 118, 110, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            backdropFilter: 'blur(8px)'
          }}>
            <MessageSquare size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white' }}>JIVEXA Health AI Bot</h2>
              <span style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>24/7 Clinical & Health AI Bot</span>
            </div>
            <p style={{ opacity: 0.9, fontSize: '0.82rem', marginTop: '2px' }}>
              Ask health queries, medicine issues, or get instant JIVEXA platform guidance with visual flowcharts.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px', flex: 1, minHeight: 0 }} className="chat-layout-mobile">
      
      {/* SIDEBAR HISTORY */}
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

      {/* MAIN CHAT WORKSPACE */}
      <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', position: 'relative' }}>
        
        {/* HEADER BAR WITH TOKEN TRACKING */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)' }}>JIVEXA Health AI Bot</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Exclusively Health, Medicine & JIVEXA Platform Guidance</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* 6-Hour Token Quota Badge with Progress Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f8fafc', padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border)' }}>
              <Zap size={14} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                Tokens: {tokensUsed.toLocaleString()} / {maxTokens.toLocaleString()}
              </span>
              <div style={{ width: '60px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min((tokensUsed / maxTokens) * 100, 100)}%`, height: '100%', backgroundColor: tokensUsed >= maxTokens ? 'var(--error)' : 'var(--primary)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--secondary)', fontSize: '0.78rem', fontWeight: 600 }}>
              <Shield size={14} />
              <span className="sr-mobile-hide">Secure Channel</span>
            </div>
          </div>
        </div>

        {/* CHAT MESSAGES CONTAINER */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
              <strong>Educational Disclaimer:</strong> This AI provides general healthcare information and does not replace diagnostic assessments by a qualified physician. <strong>Do not use this system for active medical emergencies.</strong>
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
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    width: '100%',
                    animation: 'chatBubbleFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', maxWidth: isUser ? '65%' : '76%' }}>
                    {!isUser && (
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                        boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
                      }}>
                        <Sparkles size={16} />
                      </div>
                    )}

                    <div 
                      style={{
                        padding: '14px 18px',
                        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        backgroundColor: isUser ? 'var(--primary)' : msg.isEmergency ? '#fef2f2' : '#f8fafc',
                        color: isUser ? 'white' : '#0f172a',
                        border: isUser ? 'none' : msg.isEmergency ? '1.5px solid var(--error)' : '1px solid var(--border)',
                        boxShadow: isUser ? '0 4px 12px rgba(2, 132, 199, 0.25)' : '0 2px 8px rgba(0,0,0,0.03)',
                        fontSize: '0.92rem',
                        lineHeight: '1.6'
                      }}
                    >
                      {!isUser && msg.provider && !msg.isStreaming && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          <span>{msg.provider}</span>
                        </div>
                      )}

                      {!isUser && (!msg.text || !msg.text.trim()) ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 4px' }}>
                          <span className="dot-bounce dot-1" style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'inline-block' }} />
                          <span className="dot-bounce dot-2" style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'inline-block' }} />
                          <span className="dot-bounce dot-3" style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'inline-block' }} />
                        </div>
                      ) : (
                        <MarkdownText content={msg.text} isUser={isUser} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div ref={chatEndRef} />
        </div>

        {activeConv && activeConv.messages.length > 0 && !isLoading && (
          <div style={{ padding: '0 24px 8px 24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {activeConv.messages[activeConv.messages.length - 1].sender === 'ai' && (
              ['How can I prepare for a consult?', 'Explain lipid profile levels.', 'Find a general physician'].map((q, idx) => (
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

        {/* INPUT FORM */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px', backgroundColor: 'white' }}>
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputMessage); }}
            style={{ display: 'flex', width: '100%', gap: '12px' }}
          >
            <input 
              placeholder={isLoading ? "JIVEXA Assistant is generating response..." : "Ask JIVEXA Health Assistant..."}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '12px 18px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                outline: 'none',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.92rem',
                backgroundColor: isLoading ? '#f8fafc' : 'white'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--border-focus)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            />
            <Button type="submit" disabled={isLoading || !inputMessage.trim()} style={{ borderRadius: '12px', padding: '0 20px' }}>
              <Send size={16} />
              <span className="sr-mobile-hide">Send</span>
            </Button>
          </form>
        </div>

      </div>

      {/* JIVEXA PRO PREMIUM UPGRADE MODAL */}
      <Modal isOpen={isPaywallOpen} onClose={() => setIsPaywallOpen(false)} title="👑 UNLOCK JIVEXA PRO UNLIMITED HEALTH AI">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center', alignItems: 'center', padding: '10px 0' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Crown size={36} />
          </div>

          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-dark)' }}>
              Free 1,000 Token Limit Reached
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: '1.5', maxWidth: '420px' }}>
              Upgrade to <strong>JIVEXA Pro</strong> to continue asking unlimited healthcare questions with 24/7 priority response speed.
            </p>
          </div>

          {/* SUBSCRIPTION PLAN SELECTION CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', width: '100%' }}>
            {/* MONTHLY PLAN */}
            <div 
              onClick={() => setSelectedPlan('monthly')}
              style={{
                border: selectedPlan === 'monthly' ? '2px solid #d97706' : '1px solid var(--border)',
                borderRadius: '16px',
                padding: '16px',
                backgroundColor: selectedPlan === 'monthly' ? '#fffbebfb' : '#fafafa',
                cursor: 'pointer',
                textAlign: 'left',
                position: 'relative',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Monthly Plan
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-dark)', marginTop: '4px' }}>
                ₹149 <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ month</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Flexible monthly billing, cancel anytime
              </p>
              {selectedPlan === 'monthly' && (
                <div style={{ position: 'absolute', top: '12px', right: '12px', color: '#d97706' }}>
                  <CheckCircle size={18} />
                </div>
              )}
            </div>

            {/* YEARLY PLAN */}
            <div 
              onClick={() => setSelectedPlan('yearly')}
              style={{
                border: selectedPlan === 'yearly' ? '2px solid #d97706' : '1px solid var(--border)',
                borderRadius: '16px',
                padding: '16px',
                backgroundColor: selectedPlan === 'yearly' ? '#fffbebfb' : '#fafafa',
                cursor: 'pointer',
                textAlign: 'left',
                position: 'relative',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Annual Plan
                </span>
                <span style={{ backgroundColor: '#fef3c7', color: '#d97706', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '6px' }}>
                  SAVE 16%
                </span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-dark)', marginTop: '4px' }}>
                ₹1,500 <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ year</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Just ₹125/mo — Best value for families
              </p>
              {selectedPlan === 'yearly' && (
                <div style={{ position: 'absolute', top: '12px', right: '12px', color: '#d97706' }}>
                  <CheckCircle size={18} />
                </div>
              )}
            </div>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '14px 18px', width: '100%', backgroundColor: '#ffffff', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 700 }}>
              <Check size={16} style={{ color: 'var(--secondary)' }} />
              <span>Unlimited Groq Llama 3.3 AI Health Queries</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 700 }}>
              <Check size={16} style={{ color: 'var(--secondary)' }} />
              <span>Instant AI Blood & Lab Report Explanations</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 700 }}>
              <Check size={16} style={{ color: 'var(--secondary)' }} />
              <span>Zero Queue Priority Telemetry Server Access</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
            <Button
              isLoading={isUpgrading}
              onClick={handleUpgradeToPro}
              style={{
                backgroundColor: '#d97706',
                color: 'white',
                borderRadius: '14px',
                height: '48px',
                fontWeight: 900,
                fontSize: '1rem',
                boxShadow: '0 8px 20px rgba(217, 119, 6, 0.35)'
              }}
            >
              <Crown size={20} /> Activate JIVEXA Pro ({selectedPlan === 'monthly' ? '₹149 / Month' : '₹1,500 / Year'})
            </Button>

            <Button
              variant="outline"
              onClick={() => setIsPaywallOpen(false)}
              style={{ borderRadius: '14px' }}
            >
              Cancel & Close
            </Button>
          </div>
        </div>
      </Modal>

      <style>{`
        @keyframes chatBubbleFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1.1); opacity: 1; }
        }
        .dot-bounce { animation: dotBounce 1.2s infinite ease-in-out; }
        .dot-1 { animation-delay: 0s; }
        .dot-2 { animation-delay: 0.2s; }
        .dot-3 { animation-delay: 0.4s; }

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
    </div>
  );
};
