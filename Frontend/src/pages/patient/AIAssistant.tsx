import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { MarkdownText } from '../../components/common/MarkdownText';
import { streamAIHealthAssistant, fetchUserTokenUsage, upgradeUserToPro } from '../../services/ai';
import { 
  MessageSquare, Plus, Search, Trash2, Send, Heart, 
  AlertTriangle, Shield, ShieldCheck, Check, Info, Loader2, Sparkles, Zap, Lock, Crown, Bot, User, CheckCircle,
  FileText, Activity, Pill, Stethoscope, Calendar, ArrowRight, Menu, X, ChevronRight, HeartPulse
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Token tracking & subscription state
  const [tokensUsed, setTokensUsed] = useState(0);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'free' | 'active'>('free');
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isUpgrading, setIsUpgrading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    setIsMobileSidebarOpen(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
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
      const newTitle = textToSend.slice(0, 32) + (textToSend.length > 32 ? '...' : '');
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
    
    if (targetConv.title === 'New Conversation' || targetConv.title.startsWith('chat_')) {
      targetConv.title = textToSend.slice(0, 32) + (textToSend.length > 32 ? '...' : '');
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
      await streamAIHealthAssistant(
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

  // 4 Main Healthcare Suggestion Cards
  const emptyStateSuggestions = [
    {
      title: 'Understand a health report',
      subtext: 'Explain lab tests, blood vitals & diagnostic readings',
      prompt: 'Can you help me understand a blood or lab test report? What are the key parameters and normal ranges?',
      icon: <FileText size={18} style={{ color: '#0f766e' }} />
    },
    {
      title: 'Explain symptoms',
      subtext: 'Analyze symptom patterns & when to seek clinical care',
      prompt: 'Can you explain common causes and when to see a doctor for symptoms like headache, fatigue, or fever?',
      icon: <Activity size={18} style={{ color: '#0f766e' }} />
    },
    {
      title: 'Ask about a medicine',
      subtext: 'Learn usage guidelines, precautions & common interactions',
      prompt: 'What are the general guidelines, common uses, and safety precautions when taking prescribed medicines?',
      icon: <Pill size={18} style={{ color: '#0f766e' }} />
    },
    {
      title: 'Prepare for a doctor visit',
      subtext: 'Generate structured questions to ask your physician',
      prompt: 'How can I prepare effectively for an upcoming doctor consultation? What questions should I write down?',
      icon: <Stethoscope size={18} style={{ color: '#0f766e' }} />
    }
  ];

  return (
    <div style={{
      width: '100%',
      maxWidth: '1280px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      height: 'calc(100vh - var(--header-height, 70px) - 36px)',
      minHeight: '600px',
      boxSizing: 'border-box'
    }}>
      
      {/* BRAND HEADER BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #0f766e 55%, #059669 100%)',
        borderRadius: '20px',
        padding: '18px 24px',
        color: 'white',
        boxShadow: '0 10px 25px -5px rgba(15, 118, 110, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle Ambient Glow */}
        <div style={{
          position: 'absolute',
          top: '-40%',
          right: '-5%',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            backgroundColor: 'rgba(255, 255, 255, 0.18)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.01em' }}>
                JIVEXA Health AI
              </h2>
              <span style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                letterSpacing: '0.02em',
                textTransform: 'uppercase'
              }}>
                24/7 Health & Medical AI Assistant
              </span>
            </div>
            <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.82rem', margin: '3px 0 0 0', fontWeight: 500 }}>
              AI-Powered Health. Connected Care. · Ask health queries, medicine issues, or get instant guidance.
            </p>
          </div>
        </div>

        {/* Mobile Sidebar Toggle Button */}
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          style={{
            display: 'none',
            padding: '8px 12px',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.3)',
            backgroundColor: 'rgba(255,255,255,0.15)',
            color: 'white',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
            alignItems: 'center',
            gap: '6px'
          }}
          className="mobile-sidebar-toggle-btn"
        >
          {isMobileSidebarOpen ? <X size={16} /> : <Menu size={16} />}
          <span>History</span>
        </button>
      </div>

      {/* MAIN TWO-COLUMN CHAT CONTAINER */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        gap: '16px',
        flex: 1,
        minHeight: 0,
        position: 'relative'
      }} className="chat-layout-mobile">
      
        {/* SIDEBAR: CONVERSATION HISTORY */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '18px',
          padding: '16px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }} className={`chat-history-sidebar ${isMobileSidebarOpen ? 'mobile-sidebar-open' : ''}`}>
          
          {/* New Conversation Action */}
          <Button 
            onClick={() => startNewConversation()} 
            style={{
              height: '42px',
              fontSize: '0.86rem',
              fontWeight: 800,
              backgroundColor: '#0f766e',
              color: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 12px -2px rgba(15, 118, 110, 0.3)'
            }} 
            fullWidth
          >
            <Plus size={18} />
            New Conversation
          </Button>

          {/* Search Bar */}
          <div style={{ position: 'relative' }}>
            <Input 
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                height: '38px',
                fontSize: '0.82rem',
                borderRadius: '10px',
                borderColor: '#e2e8f0',
                backgroundColor: '#f8fafc'
              }}
              icon={<Search size={15} style={{ color: '#94a3b8' }} />}
            />
          </div>

          {/* Conversations List */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '2px' }}>
            {filteredConvs.length === 0 ? (
              <div style={{
                padding: '36px 12px',
                color: 'var(--text-muted)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: '#ecfdf5',
                  color: '#0f766e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MessageSquare size={20} />
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  No conversations yet
                </span>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Start a new conversation with JIVEXA Health AI.
                </span>
                <button
                  type="button"
                  onClick={() => startNewConversation()}
                  style={{
                    marginTop: '6px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1px solid #0f766e',
                    backgroundColor: 'transparent',
                    color: '#0f766e',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  + Start Conversation
                </button>
              </div>
            ) : (
              filteredConvs.map((conv) => {
                const isActive = conv.id === activeConvId;
                return (
                  <div 
                    key={conv.id}
                    onClick={() => {
                      setActiveConvId(conv.id);
                      setIsMobileSidebarOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      backgroundColor: isActive ? '#ecfdf5' : 'transparent',
                      color: isActive ? '#0f766e' : 'var(--text-main)',
                      borderLeft: isActive ? '3px solid #0f766e' : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    className="chat-history-item"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                      <MessageSquare size={15} style={{ flexShrink: 0, color: isActive ? '#0f766e' : '#94a3b8' }} />
                      <span style={{
                        fontSize: '0.82rem',
                        fontWeight: isActive ? 800 : 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {conv.title}
                      </span>
                    </div>
                    <button 
                      type="button"
                      title="Delete chat"
                      onClick={(e) => deleteConversation(conv.id, e)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94a3b8',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: isActive ? 0.8 : 0,
                        transition: 'opacity 0.15s ease, color 0.15s ease'
                      }}
                      className="delete-chat-btn"
                      onMouseOver={(e) => (e.currentTarget.style.color = '#ef4444')}
                      onMouseOut={(e) => (e.currentTarget.style.color = '#94a3b8')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {conversations.length > 0 && (
            <button 
              type="button"
              onClick={clearAllConversations}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                justifyContent: 'center',
                padding: '6px',
                transition: 'color 0.15s ease'
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = '#ef4444')}
              onMouseOut={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              <Trash2 size={13} />
              Clear All History
            </button>
          )}
        </div>

        {/* MAIN CHAT WORKSPACE */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '18px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          
          {/* TOP HEADER BAR: TITLE, TOKEN USAGE & SECURITY */}
          <div style={{
            padding: '12px 20px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <div>
                <h3 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  JIVEXA Health AI
                </h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  24/7 Health & Medical AI Assistant
                </span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Subtle Minimized Token Display */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#f8fafc',
                padding: '5px 12px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0'
              }}>
                <Zap size={13} style={{ color: '#0f766e' }} />
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  AI Usage · {tokensUsed.toLocaleString()} / {maxTokens.toLocaleString()}
                </span>
                <div style={{ width: '44px', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min((tokensUsed / maxTokens) * 100, 100)}%`,
                    height: '100%',
                    backgroundColor: tokensUsed >= maxTokens ? 'var(--error)' : '#0f766e',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Security Indicator */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color: '#059669',
                fontSize: '0.74rem',
                fontWeight: 700,
                backgroundColor: '#ecfdf5',
                padding: '5px 10px',
                borderRadius: '12px',
                border: '1px solid #a7f3d0'
              }}>
                <Lock size={12} />
                <span className="sr-mobile-hide">Secure Channel</span>
              </div>
            </div>
          </div>

          {/* CHAT MESSAGES CONTAINER */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            backgroundColor: '#ffffff'
          }}>
            
            {/* MEDICAL DISCLAIMER: VISUALLY SECONDARY & COMPACT */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <Info size={16} style={{ color: '#0f766e', flexShrink: 0 }} />
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.45' }}>
                <strong style={{ color: 'var(--text-main)' }}>Health information only:</strong> General educational information and not a substitute for professional medical advice. Not for emergencies.
              </p>
            </div>

            {/* EMPTY STATE: WHEN NO MESSAGES IN ACTIVE CONVERSATION */}
            {(!activeConv || activeConv.messages.length === 0) ? (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px',
                padding: '28px 16px',
                textAlign: 'center'
              }}>
                
                {/* Emblem & Titles */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, #0f766e 0%, #10b981 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 20px -4px rgba(15, 118, 110, 0.35)'
                  }}>
                    <HeartPulse size={28} />
                  </div>

                  <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0f766e', marginTop: '4px' }}>
                    Your intelligent health companion
                  </span>

                  <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
                    How can I help you today?
                  </h3>

                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0, maxWidth: '520px', lineHeight: '1.5' }}>
                    Ask about health reports, symptoms, medicines, or prepare questions for your next doctor consultation.
                  </p>
                </div>

                {/* 4 Clickable Healthcare Suggestion Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  width: '100%',
                  maxWidth: '680px'
                }} className="grid-1-mobile">
                  {emptyStateSuggestions.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSendMessage(item.prompt)}
                      style={{
                        padding: '14px 16px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                      }}
                      className="suggestion-card-hover"
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: '#ecfdf5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {item.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-main)' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.35' }}>
                          {item.subtext}
                        </div>
                      </div>
                      <ChevronRight size={16} style={{ color: '#cbd5e1', alignSelf: 'center', flexShrink: 0 }} />
                    </div>
                  ))}
                </div>

              </div>
            ) : (
              /* ACTIVE MESSAGES STREAM */
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
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      maxWidth: isUser ? '72%' : '80%',
                      flexDirection: isUser ? 'row-reverse' : 'row'
                    }} className="message-bubble-wrapper">
                      
                      {/* Avatar */}
                      {!isUser ? (
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '10px',
                          backgroundColor: '#0f766e',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px',
                          boxShadow: '0 2px 8px rgba(15, 118, 110, 0.25)'
                        }}>
                          <Sparkles size={16} />
                        </div>
                      ) : (
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '10px',
                          backgroundColor: '#f1f5f9',
                          color: '#0f766e',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <User size={16} />
                        </div>
                      )}

                      {/* Bubble Content */}
                      <div 
                        style={{
                          padding: '14px 18px',
                          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          backgroundColor: isUser ? '#0f766e' : msg.isEmergency ? '#fef2f2' : '#ffffff',
                          color: isUser ? '#ffffff' : '#0f172a',
                          border: isUser ? 'none' : msg.isEmergency ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
                          boxShadow: isUser ? '0 4px 14px -2px rgba(15, 118, 110, 0.25)' : '0 2px 8px rgba(0,0,0,0.03)',
                          fontSize: '0.92rem',
                          lineHeight: '1.6'
                        }}
                      >
                        {!isUser && msg.provider && !msg.isStreaming && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            color: '#0f766e',
                            marginBottom: '6px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                          }}>
                            <span>{msg.provider}</span>
                          </div>
                        )}

                        {!isUser && (!msg.text || !msg.text.trim()) ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 4px' }}>
                            <span className="dot-bounce dot-1" style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#0f766e', display: 'inline-block' }} />
                            <span className="dot-bounce dot-2" style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#0f766e', display: 'inline-block' }} />
                            <span className="dot-bounce dot-3" style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#0f766e', display: 'inline-block' }} />
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

          {/* FOLLOW-UP QUICK PROMPTS (WHEN AI FINISHED RESPONDING) */}
          {activeConv && activeConv.messages.length > 0 && !isLoading && (
            <div style={{ padding: '0 24px 8px 24px', display: 'flex', gap: '8px', flexWrap: 'wrap', backgroundColor: '#ffffff' }}>
              {activeConv.messages[activeConv.messages.length - 1].sender === 'ai' && (
                ['How can I prepare for a consult?', 'Explain lipid profile levels.', 'Find a general physician'].map((q, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(q)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '16px',
                      border: '1px solid #a7f3d0',
                      backgroundColor: '#ecfdf5',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      color: '#0f766e',
                      fontWeight: 700,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#d1fae5')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ecfdf5')}
                  >
                    {q}
                  </button>
                ))
              )}
            </div>
          )}

          {/* INPUT FORM: FIXED STICKY FOOTER */}
          <div style={{
            padding: '14px 20px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            gap: '10px',
            backgroundColor: '#ffffff'
          }}>
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputMessage); }}
              style={{ display: 'flex', width: '100%', gap: '10px', alignItems: 'center' }}
            >
              <input 
                ref={inputRef}
                placeholder={isLoading ? "JIVEXA Health AI is analyzing..." : "Ask JIVEXA Health AI anything..."}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: '14px',
                  border: '1.5px solid #e2e8f0',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.92rem',
                  backgroundColor: isLoading ? '#f8fafc' : '#ffffff',
                  color: 'var(--text-main)',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#0f766e';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(15, 118, 110, 0.12)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <Button 
                type="submit" 
                disabled={isLoading || !inputMessage.trim()} 
                style={{
                  borderRadius: '14px',
                  padding: '0 20px',
                  height: '46px',
                  backgroundColor: '#0f766e',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  boxShadow: '0 4px 12px -2px rgba(15, 118, 110, 0.3)'
                }}
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                <span className="sr-mobile-hide" style={{ marginLeft: '4px' }}>Send</span>
              </Button>
            </form>
          </div>

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

          <div style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '14px 18px', width: '100%', backgroundColor: 'var(--surface)', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

        .chat-history-item:hover {
          background-color: #f8fafc !important;
        }
        .chat-history-item:hover .delete-chat-btn {
          opacity: 1 !important;
        }
        .suggestion-card-hover:hover {
          border-color: #0f766e !important;
          background-color: #f0fdf4 !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px -4px rgba(15, 118, 110, 0.15) !important;
        }

        @media (max-width: 768px) {
          .chat-layout-mobile {
            grid-template-columns: 1fr !important;
          }
          .mobile-sidebar-toggle-btn {
            display: inline-flex !important;
          }
          .chat-history-sidebar {
            display: none !important;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 30;
            background: white;
          }
          .chat-history-sidebar.mobile-sidebar-open {
            display: flex !important;
          }
          .message-bubble-wrapper {
            max-width: 90% !important;
          }
        }
      `}</style>
    </div>
  );
};
