import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHealthData } from '../../context/HealthDataContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Toast } from '../../components/ui/Toast';
import { processAndAnalyzeReport, SAMPLE_LAB_REPORTS } from '../../services/ai/reportAnalyzer';
import { sendReportChatMessage, ReportChatMessage } from '../../services/ai/reportChatService';
import { extractTextFromPDFOrImage } from '../../services/ai/pdfParser';
import { AIReportAnalysisResult, MedicalReportRecord } from '../../types';
import { 
  FileText, Upload, Sparkles, AlertTriangle, CheckCircle2, 
  HelpCircle, Lightbulb, Share2, History, ArrowRight, ShieldCheck, 
  RefreshCw, FileCheck, FileSpreadsheet, MessageSquare, Send, User as UserIcon,
  AlertCircle, FileCode, CheckCheck, Lock, Activity, Heart, Stethoscope, 
  Apple, Mic, Paperclip, Check
} from 'lucide-react';

export const AIReportAnalyzer: React.FC = () => {
  const { user } = useAuth();
  const { doctors, medicalReports, saveAnalyzedReport, shareReportWithDoctor } = useHealthData();

  // Active View Tab: 'Analyzer' | 'History'
  const [activeTab, setActiveTab] = useState<'Analyzer' | 'History'>('Analyzer');

  // Upload & Drag-and-Drop State
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [secureFileUrl, setSecureFileUrl] = useState<string>('');

  const [currentAnalysis, setCurrentAnalysis] = useState<AIReportAnalysisResult | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string; type: string } | null>(null);

  // Sharing Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [isSharing, setIsSharing] = useState(false);

  // AI Health Chat State (Report Scoped)
  const [chatMessages, setChatMessages] = useState<ReportChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Toast
  const [toastMsg, setToastMsg] = useState('');

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isChatTyping]);

  // Initialize Report Chat Context when analysis is active
  useEffect(() => {
    if (currentAnalysis) {
      setChatMessages([
        {
          id: `msg_welcome_${Date.now()}`,
          sender: 'ai',
          text: `Hello ${user?.name?.split(' ')[0] || 'there'}! I am your JIVEXA AI Report Assistant. I have loaded the context for **${currentAnalysis.reportTitle}** (Health Score: ${currentAnalysis.healthScore}/100).\n\nAsk me anything about your parameters, diet, lifestyle, or doctor recommendations!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sections: {
            directAnswer: `Hello ${user?.name?.split(' ')[0] || 'there'}! I am your JIVEXA AI Report Assistant.`,
            explanation: `I have synchronized the complete clinical parameters from your ${currentAnalysis.reportTitle} (Report Health Score: ${currentAnalysis.healthScore}/100).`,
            lifestyleAdvice: [
              'Ask me about specific parameters (e.g. Hemoglobin, Cholesterol, Glucose)',
              'Ask for dietary tips or exercise recommendations',
              'Get a checklist of questions to ask your doctor'
            ],
            disclaimer: 'AI-generated information is for educational purposes only. Always consult a qualified physician.'
          }
        }
      ]);
    }
  }, [currentAnalysis, user?.name]);

  // Execute PDF Extraction & AI Analysis
  const handleFileSelected = async (file: File) => {
    setUploadError('');
    setUploadedFile({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      type: file.type || 'application/pdf'
    });

    setIsProcessing(true);
    setUploadProgress(10);
    setStatusMessage('Reading PDF stream and initializing OCR engine...');

    const extractRes = await extractTextFromPDFOrImage(file, (percent, msg) => {
      setUploadProgress(percent);
      setStatusMessage(msg);
    });

    if (!extractRes.success) {
      setIsProcessing(false);
      setUploadError(extractRes.error || 'Failed to parse medical report file.');
      return;
    }

    setSecureFileUrl(extractRes.secureFileUrl);

    setStatusMessage('Running clinical parameter analysis & scoring...');
    const result = await processAndAnalyzeReport(file.name, extractRes.rawText);

    setCurrentAnalysis(result);
    setIsProcessing(false);

    const reportRecord: MedicalReportRecord = {
      id: result.reportId,
      patientId: user?.id || 'patient_001',
      fileName: file.name,
      fileType: file.type || 'application/pdf',
      fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      fileUrl: extractRes.secureFileUrl,
      uploadedAt: result.analyzedAt,
      analysis: result
    };
    saveAnalyzedReport(reportRecord);
    setToastMsg('Medical PDF report analyzed successfully.');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleSelectSample = async (sample: typeof SAMPLE_LAB_REPORTS[0]) => {
    setUploadError('');
    setUploadedFile({
      name: sample.fileName,
      size: sample.fileSize,
      type: sample.fileType
    });

    setIsProcessing(true);
    setUploadProgress(20);
    setStatusMessage('Loading sample medical report stream...');

    await new Promise(r => setTimeout(r, 600));
    setUploadProgress(70);
    setStatusMessage('Extracting sample clinical parameters...');

    const result = await processAndAnalyzeReport(sample.fileName, sample.rawText);
    setUploadProgress(100);

    setCurrentAnalysis(result);
    setIsProcessing(false);

    const reportRecord: MedicalReportRecord = {
      id: result.reportId,
      patientId: user?.id || 'patient_001',
      fileName: sample.fileName,
      fileType: sample.fileType,
      fileSize: sample.fileSize,
      fileUrl: '/assets/sample_report_preview.pdf',
      uploadedAt: result.analyzedAt,
      analysis: result
    };
    saveAnalyzedReport(reportRecord);
    setToastMsg('Sample medical report analyzed.');
  };

  const handleShareReport = async () => {
    if (!currentAnalysis || !selectedDoctorId) return;
    setIsSharing(true);

    const doc = doctors.find((d) => d.id === selectedDoctorId);
    const res = await shareReportWithDoctor(currentAnalysis.reportId, selectedDoctorId);

    setIsSharing(false);
    setIsShareModalOpen(false);

    if (res.success) {
      setToastMsg(`Report shared with ${doc?.name || 'Doctor'} successfully.`);
    } else {
      setToastMsg('Failed to share report. Please try again.');
    }
  };

  const handleSendChatMessage = async (presetText?: string) => {
    const textToSend = presetText || chatInput;
    if (!textToSend.trim() || !currentAnalysis || isChatTyping) return;

    const userMsg: ReportChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...chatMessages, userMsg];
    setChatMessages(updatedHistory);
    if (!presetText) setChatInput('');
    setIsChatTyping(true);

    const aiMsg = await sendReportChatMessage(currentAnalysis, textToSend, updatedHistory);
    
    setIsChatTyping(false);
    setChatMessages((prev) => [...prev, aiMsg]);
  };

  const CHIP_QUESTIONS = [
    { label: '💊 Do I need medicine?', text: 'Do I need medicine?' },
    { label: '🥗 What foods should I eat?', text: 'What foods should I eat?' },
    { label: '🏃 Can I exercise?', text: 'Can I exercise?' },
    { label: '🩺 Should I consult a doctor?', text: 'Should I consult a doctor?' },
    { label: '❤️ Explain Hemoglobin', text: 'Explain Hemoglobin' },
    { label: '🧬 Explain Cholesterol', text: 'Explain Cholesterol' },
    { label: '⚡ Explain Glucose', text: 'Explain Glucose' }
  ];

  // Helper for gauge stroke color
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 70) return '#0d9488';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1080px', margin: '0 auto' }}>
      
      {/* Toast Notification */}
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg('')} />}

      {/* Modern Glassmorphic Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #115e59 50%, #0d9488 100%)',
        color: 'white',
        borderRadius: '24px',
        padding: '36px',
        boxShadow: '0 20px 40px -15px rgba(15, 118, 110, 0.35)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background ambient glow shapes */}
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(94, 234, 212, 0.15)', filter: 'blur(40px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '640px', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255, 255, 255, 0.18)', backdropFilter: 'blur(10px)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '14px' }}>
            <Sparkles size={14} style={{ color: '#5eead4' }} />
            NEXT-GEN HEALTH OS • CLINICAL AI ENGINE
          </div>
          <h1 style={{ color: 'white', fontWeight: 900, fontSize: '2.1rem', marginBottom: '10px', letterSpacing: '-0.02em' }}>JIVEXA AI Medical Report Analyzer</h1>
          <p style={{ color: '#ccfbf1', fontSize: '0.96rem', lineHeight: '1.65' }}>
            Upload lab reports, blood counts, and clinical scans. Extract exact parameter values, calculate health scores, and chat with a context-locked AI medical assistant.
          </p>
        </div>

        {/* Tab switch */}
        <div style={{ display: 'flex', gap: '12px', zIndex: 2 }}>
          <Button 
            onClick={() => setActiveTab('Analyzer')} 
            variant={activeTab === 'Analyzer' ? 'secondary' : 'outline'}
            style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', height: '44px', borderRadius: '14px', padding: '0 20px', fontWeight: 700 }}
          >
            <Sparkles size={16} />
            Report Analyzer
          </Button>
          <Button 
            onClick={() => setActiveTab('History')} 
            variant={activeTab === 'History' ? 'secondary' : 'outline'}
            style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', height: '44px', borderRadius: '14px', padding: '0 20px', fontWeight: 700 }}
          >
            <History size={16} />
            Report Vault ({medicalReports.length})
          </Button>
        </div>
      </div>

      {/* --- TAB 1: REPORT ANALYZER WORKSTATION --- */}
      {activeTab === 'Analyzer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* UPLOAD & PROCESSING CARD */}
          {!currentAnalysis && !isProcessing && (
            <Card style={{ borderRadius: '24px', padding: '32px' }} title={<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Upload size={22} style={{ color: 'var(--primary)' }} /><span style={{ fontWeight: 800, fontSize: '1.15rem' }}>Upload Medical Report (PDF / Image)</span></div>}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Upload Error Banner */}
                {uploadError && (
                  <div style={{ backgroundColor: 'var(--error-light)', border: '1px solid var(--error)', borderRadius: '16px', padding: '16px', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.88rem', fontWeight: 600 }}>
                    <AlertCircle size={20} style={{ flexShrink: 0 }} />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Drag and Drop Zone */}
                <label 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  style={{
                    border: isDragging ? '2.5px dashed var(--primary)' : '2px dashed #cbd5e1',
                    backgroundColor: isDragging ? 'rgba(15, 118, 110, 0.06)' : '#f8fafc',
                    borderRadius: '20px',
                    padding: '48px 24px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '14px',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #0f766e 0%, #10b981 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px -5px rgba(15, 118, 110, 0.4)' }}>
                    <FileSpreadsheet size={32} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Drag & Drop PDF or Image Medical Report Here</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Supports PDF, JPG, JPEG, PNG (Blood Tests, CBC, Lipid Panels, Prescriptions, Scanned Labs up to 25MB)
                    </p>
                  </div>
                  <input 
                    type="file" 
                    accept=".pdf,.png,.jpg,.jpeg" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelected(e.target.files[0]);
                      }
                    }} 
                    style={{ display: 'none' }}
                  />
                  <Button type="button" style={{ marginTop: '8px', borderRadius: '12px', padding: '10px 24px', fontWeight: 700 }}>Select PDF / Image File</Button>
                </label>

                {/* Sample Reports Quick Loader */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '12px' }}>
                    ⚡ Or test immediately with sample clinical PDF reports:
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="grid-2-mobile">
                    {SAMPLE_LAB_REPORTS.map((sample) => (
                      <div 
                        key={sample.id}
                        onClick={() => handleSelectSample(sample)}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: '16px',
                          padding: '16px 20px',
                          backgroundColor: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s ease',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={20} />
                          </div>
                          <div>
                            <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>{sample.title}</h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sample.fileName} • {sample.fileSize}</span>
                          </div>
                        </div>
                        <ArrowRight size={16} style={{ color: 'var(--primary)' }} />
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </Card>
          )}

          {/* STEPPER & UPLOAD PROGRESS ANIMATION */}
          {isProcessing && (
            <Card style={{ textAlign: 'center', padding: '54px 24px', borderRadius: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '520px', margin: '0 auto' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid var(--primary-light)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
                  <Sparkles size={28} style={{ position: 'absolute', top: '26px', left: '26px', color: 'var(--primary)' }} />
                </div>

                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Processing {uploadedFile?.name}...</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700, marginTop: '4px' }}>
                    {statusMessage}
                  </p>
                </div>

                {/* Live Progress Bar */}
                <div style={{ width: '100%', backgroundColor: '#e2e8f0', borderRadius: '10px', height: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #0f766e, #10b981)', height: '100%', transition: 'width 0.3s ease' }} />
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-light)' }}>{uploadProgress}% Complete</span>

                {/* Progress Stepper List */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', marginTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.88rem', color: uploadProgress >= 25 ? 'var(--primary)' : 'var(--text-light)', fontWeight: uploadProgress >= 25 ? 600 : 400 }}>
                    <CheckCircle2 size={18} style={{ color: uploadProgress >= 25 ? 'var(--secondary)' : 'var(--border)' }} />
                    <span>1. Document Sandbox & Secure Stream Access</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.88rem', color: uploadProgress >= 60 ? 'var(--primary)' : 'var(--text-light)', fontWeight: uploadProgress >= 60 ? 600 : 400 }}>
                    <CheckCircle2 size={18} style={{ color: uploadProgress >= 60 ? 'var(--secondary)' : 'var(--border)' }} />
                    <span>2. PDF Text Stream & OCR Extraction Engine</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.88rem', color: uploadProgress >= 90 ? 'var(--primary)' : 'var(--text-light)', fontWeight: uploadProgress >= 90 ? 600 : 400 }}>
                    <CheckCircle2 size={18} style={{ color: uploadProgress >= 90 ? 'var(--secondary)' : 'var(--border)' }} />
                    <span>3. Clinical Parameter & Reference Range Parser</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.88rem', color: uploadProgress >= 100 ? 'var(--primary)' : 'var(--text-light)', fontWeight: uploadProgress >= 100 ? 600 : 400 }}>
                    <CheckCircle2 size={18} style={{ color: uploadProgress >= 100 ? 'var(--secondary)' : 'var(--border)' }} />
                    <span>4. Finalizing AI Report Health Score & Chat Assistant</span>
                  </div>
                </div>

              </div>
            </Card>
          )}

          {/* --- AI ANALYSIS RESULT PRESENTATION --- */}
          {currentAnalysis && !isProcessing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Action Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <Button variant="outline" onClick={() => setCurrentAnalysis(null)} style={{ borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                  <RefreshCw size={16} />
                  Analyze Another PDF / Report
                </Button>

                <div style={{ display: 'flex', gap: '12px' }}>
                  {secureFileUrl && (
                    <a 
                      href={secureFileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 18px',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'white',
                        color: 'var(--primary)',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        textDecoration: 'none'
                      }}
                    >
                      <FileCode size={16} />
                      View Uploaded Document
                    </a>
                  )}

                  <Button onClick={() => setIsShareModalOpen(true)} style={{ borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                    <Share2 size={16} />
                    Share Report With Doctor
                  </Button>
                </div>
              </div>

              {/* Top Summary & Health Score Banner */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }} className="grid-2-mobile">
                
                {/* Health Score Gauge Card */}
                <Card style={{ backgroundColor: 'white', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '32px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Report Health Score</span>
                  
                  {/* SVG Circular Animated Score Ring */}
                  <div style={{ position: 'relative', margin: '20px 0', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="130" height="130" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                      <circle 
                        cx="60" cy="60" r="50" 
                        fill="none" 
                        stroke={getScoreColor(currentAnalysis.healthScore)} 
                        strokeWidth="10" 
                        strokeDasharray="314"
                        strokeDashoffset={314 - (314 * currentAnalysis.healthScore) / 100}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                      />
                    </svg>
                    <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>{currentAnalysis.healthScore}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>/ 100</span>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    padding: '6px 16px',
                    borderRadius: '20px',
                    backgroundColor: (currentAnalysis.healthScore >= 80 ? 'var(--secondary-light)' : 'var(--warning-light)') as string,
                    color: (currentAnalysis.healthScore >= 80 ? 'var(--secondary)' : 'var(--warning)') as string
                  }}>
                    {currentAnalysis.scoreStatus}
                  </span>
                </Card>

                {/* Executive Summary Card */}
                <Card style={{ borderRadius: '24px', padding: '32px' }} title="Executive AI Health Summary">
                  <p style={{ fontSize: '0.96rem', color: 'var(--text-main)', lineHeight: '1.75', whiteSpace: 'pre-line' }}>
                    {currentAnalysis.summary}
                  </p>
                </Card>

              </div>

              {/* Parameters Requiring Attention & Abnormalities */}
              {currentAnalysis.abnormalFindings.length > 0 && (
                <Card style={{ borderRadius: '24px' }} title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error)' }}><AlertTriangle size={22} /><span style={{ fontWeight: 800 }}>Parameters Requiring Attention</span></div>}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {currentAnalysis.abnormalFindings.concat(currentAnalysis.attentionParameters).map((param, idx) => (
                      <div 
                        key={idx}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: '18px',
                          padding: '20px',
                          backgroundColor: (param.status === 'Abnormal' ? 'var(--error-light)' : 'var(--warning-light)') as string,
                          borderColor: (param.status === 'Abnormal' ? 'var(--error)' : 'var(--warning)') as string
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }} className="flex-col-mobile gap-sm">
                          <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>{param.name}</h4>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Measured: <strong>{param.value}</strong> • Reference: {param.referenceRange}</span>
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', backgroundColor: 'white', color: (param.status === 'Abnormal' ? 'var(--error)' : 'var(--warning)') as string }}>
                            {param.status.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ borderTop: '1px dashed rgba(0,0,0,0.1)', paddingTop: '10px', marginTop: '10px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>💡 Patient-Friendly Explanation:</span>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '4px', lineHeight: '1.6' }}>
                            {param.simpleExplanation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Normal Findings Table */}
              <Card style={{ borderRadius: '24px' }} title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)' }}><CheckCircle2 size={22} /><span style={{ fontWeight: 800 }}>Normal & Optimal Findings</span></div>}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--surface-raised)', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 800 }}>Test Parameter</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800 }}>Measured Value</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800 }}>Reference Range</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800 }}>Clinical Meaning</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentAnalysis.normalFindings.map((param, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 700 }}>{param.name}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--secondary)' }}>{param.value}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{param.referenceRange}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-main)', fontSize: '0.85rem' }}>{param.simpleExplanation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Two Column Grid: Doctor Questions & Lifestyle Tips */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="grid-2-mobile">
                
                {/* Doctor Questions Checklist */}
                <Card style={{ borderRadius: '24px' }} title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><HelpCircle size={20} /><span style={{ fontWeight: 800 }}>Questions to Ask Your Doctor</span></div>}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {currentAnalysis.questionsForDoctor.map((q, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '0.9rem', borderBottom: '1px solid var(--surface-raised)', paddingBottom: '10px' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{idx + 1}.</span>
                        <span>{q}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* General Lifestyle Suggestions */}
                <Card style={{ borderRadius: '24px' }} title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Lightbulb size={20} /><span style={{ fontWeight: 800 }}>General Lifestyle Suggestions</span></div>}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {currentAnalysis.lifestyleSuggestions.map((tip, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '0.9rem', borderBottom: '1px solid var(--surface-raised)', paddingBottom: '10px' }}>
                        <span style={{ color: 'var(--secondary)', fontWeight: 800 }}>✓</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </Card>

              </div>

              {/* ========================================================================= */}
              {/* --- REDESIGNED PREMIUM HEALTH-TECH AI REPORT CHAT SECTION --- */}
              {/* ========================================================================= */}
              <div style={{
                borderRadius: '24px',
                border: '1px solid rgba(203, 213, 225, 0.8)',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(240,253,250,0.4) 100%)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 20px 40px -15px rgba(15, 118, 110, 0.15)',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}>
                
                {/* 1. PREMIUM CHAT HEADER */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                  paddingBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {/* Glowing Circular JIVEXA AI Avatar */}
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0f766e 0%, #10b981 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
                      position: 'relative'
                    }}>
                      <Activity size={24} />
                      <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981', border: '2px solid white' }} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>AI Medical Report Assistant</h2>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)' }}>
                          ⚡ Online
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Lock size={12} style={{ color: 'var(--primary)' }} />
                        Context Locked: <strong>{currentAnalysis.reportTitle}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Header Health Score Badge */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: 'white',
                    padding: '8px 16px',
                    borderRadius: '16px',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: `3px solid ${getScoreColor(currentAnalysis.healthScore)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.82rem', color: 'var(--primary)' }}>
                      {currentAnalysis.healthScore}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>Report Health Score</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: getScoreColor(currentAnalysis.healthScore) }}>{currentAnalysis.scoreStatus}</span>
                    </div>
                  </div>
                </div>

                {/* 2. VIBRANT SUGGESTED QUESTIONS CHIPS */}
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>
                    💡 Suggested Follow-Up Questions:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {CHIP_QUESTIONS.map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendChatMessage(chip.text)}
                        disabled={isChatTyping}
                        style={{
                          border: '1px solid rgba(15, 118, 110, 0.2)',
                          background: 'white',
                          color: 'var(--primary)',
                          borderRadius: '20px',
                          padding: '8px 16px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.borderColor = 'var(--primary)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.borderColor = 'rgba(15, 118, 110, 0.2)';
                        }}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. CHAT CONVERSATION STREAM */}
                <div style={{
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: '20px',
                  backgroundColor: '#f8fafc',
                  padding: '24px',
                  minHeight: '320px',
                  maxHeight: '460px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}>
                  {chatMessages.map((msg) => (
                    <div 
                      key={msg.id}
                      style={{
                        display: 'flex',
                        gap: '14px',
                        alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: msg.sender === 'user' ? '75%' : '90%'
                      }}
                    >
                      {/* AI Avatar */}
                      {msg.sender === 'ai' && (
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #0f766e 0%, #10b981 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 10px rgba(15, 118, 110, 0.3)' }}>
                          <Activity size={20} />
                        </div>
                      )}

                      {/* USER BUBBLE vs AI STRUCTURED CARDS */}
                      {msg.sender === 'user' ? (
                        <div style={{
                          background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                          color: 'white',
                          borderRadius: '20px 20px 4px 20px',
                          padding: '14px 20px',
                          boxShadow: '0 8px 16px -4px rgba(15, 118, 110, 0.3)'
                        }}>
                          <p style={{ fontSize: '0.92rem', lineHeight: '1.6', color: 'white', fontWeight: 500 }}>{msg.text}</p>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '6px', opacity: 0.8, fontSize: '0.68rem' }}>
                            <span>{msg.timestamp}</span>
                            <CheckCheck size={14} />
                          </div>
                        </div>
                      ) : (
                        /* AI BEAUTIFUL STRUCTURED CARDS (NO RAW MARKDOWN) */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                          
                          {/* Section 1: Direct Answer */}
                          {msg.sections?.directAnswer && (
                            <div style={{ backgroundColor: 'white', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: 800, fontSize: '0.88rem', marginBottom: '6px' }}>
                                <CheckCircle2 size={18} />
                                <span>Direct Answer</span>
                              </div>
                              <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: '1.65', fontWeight: 600 }}>
                                {msg.sections.directAnswer}
                              </p>
                            </div>
                          )}

                          {/* Section 2: Explanation */}
                          {msg.sections?.explanation && (
                            <div style={{ backgroundColor: '#f0fdfa', border: '1px solid rgba(15, 118, 110, 0.2)', borderRadius: '16px', padding: '16px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.88rem', marginBottom: '6px' }}>
                                <Lightbulb size={18} />
                                <span>Explanation</span>
                              </div>
                              <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.65' }}>
                                {msg.sections.explanation}
                              </p>
                            </div>
                          )}

                          {/* Section 3: Lifestyle Advice */}
                          {msg.sections?.lifestyleAdvice && msg.sections.lifestyleAdvice.length > 0 && (
                            <div style={{ backgroundColor: 'white', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '16px', padding: '16px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: 800, fontSize: '0.88rem', marginBottom: '8px' }}>
                                <Apple size={18} />
                                <span>Lifestyle Advice</span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {msg.sections.lifestyleAdvice.map((advice, i) => (
                                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.88rem' }}>
                                    <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>
                                    <span>{advice}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Section 4: Doctor Recommendation */}
                          {msg.sections?.doctorAdvice && msg.sections.doctorAdvice.length > 0 && (
                            <div style={{ backgroundColor: '#f8fafc', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0284c7', fontWeight: 800, fontSize: '0.88rem', marginBottom: '8px' }}>
                                <Stethoscope size={18} />
                                <span>Doctor Recommendation</span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {msg.sections.doctorAdvice.map((docTip, i) => (
                                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.88rem' }}>
                                    <span style={{ color: '#0284c7', fontWeight: 700 }}>•</span>
                                    <span>{docTip}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Fallback Text if sections not formatted */}
                          {!msg.sections && (
                            <div style={{ backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px 20px' }}>
                              <p style={{ fontSize: '0.9rem', lineHeight: '1.65', whiteSpace: 'pre-line' }}>{msg.text}</p>
                            </div>
                          )}

                          <span style={{ fontSize: '0.68rem', color: 'var(--text-light)', alignSelf: 'flex-end', marginTop: '2px' }}>
                            {msg.timestamp}
                          </span>

                        </div>
                      )}

                      {/* User Avatar */}
                      {msg.sender === 'user' && (
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>
                          {user?.name?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* AI Typing Animation Shimmer */}
                  {isChatTyping && (
                    <div style={{ display: 'flex', gap: '14px', alignSelf: 'flex-start', alignItems: 'center' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #0f766e 0%, #10b981 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Activity size={20} />
                      </div>
                      <div style={{ backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '16px', padding: '12px 20px', fontSize: '0.88rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Sparkles size={16} style={{ animation: 'spin 1.5s linear infinite' }} />
                        <span>JIVEXA AI is analyzing your report context...</span>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* 4. REDESIGNED CHAT INPUT CAPSULE */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChatMessage();
                  }}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    backgroundColor: 'white',
                    border: '1.5px solid rgba(203, 213, 225, 0.9)',
                    borderRadius: '28px',
                    padding: '8px 12px 8px 20px',
                    boxShadow: '0 8px 20px -5px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <Paperclip size={18} style={{ color: 'var(--text-light)', cursor: 'pointer' }} />
                  <input 
                    type="text" 
                    placeholder="Ask anything about your medical report..." 
                    value={chatInput} 
                    onChange={(e) => setChatInput(e.target.value)} 
                    disabled={isChatTyping}
                    style={{
                      flex: 1,
                      border: 'none',
                      backgroundColor: 'transparent',
                      fontSize: '0.95rem',
                      outline: 'none',
                      color: 'var(--text-main)'
                    }}
                  />
                  <Mic size={18} style={{ color: 'var(--text-light)', cursor: 'pointer' }} />
                  <button 
                    type="submit" 
                    disabled={!chatInput.trim() || isChatTyping}
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0f766e 0%, #10b981 100%)',
                      color: 'white',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: chatInput.trim() && !isChatTyping ? 'pointer' : 'not-allowed',
                      opacity: chatInput.trim() && !isChatTyping ? 1 : 0.6,
                      boxShadow: '0 4px 12px rgba(15, 118, 110, 0.3)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Send size={18} />
                  </button>
                </form>

                {/* 5. PREMIUM DISCLAIMER FOOTER CARD */}
                <div style={{
                  backgroundColor: 'rgba(240, 253, 250, 0.8)',
                  border: '1px solid rgba(15, 118, 110, 0.2)',
                  borderRadius: '16px',
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <ShieldCheck size={22} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                    <strong>🛡 Educational Purpose Only:</strong> AI-generated medical information is for educational context. Always consult a qualified healthcare professional before taking medical decisions.
                  </p>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* --- TAB 2: REPORT HISTORY VAULT --- */}
      {activeTab === 'History' && (
        <Card style={{ borderRadius: '24px' }} title="Analyzed Medical Reports Archive">
          {medicalReports.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FileCheck size={40} style={{ color: 'var(--text-light)', marginBottom: '12px' }} />
              <p style={{ fontSize: '0.9rem' }}>No medical reports uploaded or analyzed yet.</p>
              <Button onClick={() => setActiveTab('Analyzer')} style={{ marginTop: '16px' }}>Upload Your First Report</Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {medicalReports.map((rep) => (
                <div 
                  key={rep.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '18px',
                    padding: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  className="flex-col-mobile gap-sm"
                >
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={22} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.98rem', fontWeight: 800 }}>{rep.fileName}</h4>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Analyzed: {rep.uploadedAt} • Size: {rep.fileSize}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {rep.analysis && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: '12px', backgroundColor: (rep.analysis.healthScore >= 80 ? 'var(--secondary-light)' : 'var(--warning-light)') as string, color: (rep.analysis.healthScore >= 80 ? 'var(--secondary)' : 'var(--warning)') as string }}>
                        Score: {rep.analysis.healthScore}/100
                      </span>
                    )}

                    <Button 
                      variant="outline" 
                      onClick={() => {
                        if (rep.analysis) {
                          setCurrentAnalysis(rep.analysis);
                          setActiveTab('Analyzer');
                        }
                      }}
                      style={{ height: '36px', fontSize: '0.82rem', borderRadius: '10px', fontWeight: 700 }}
                    >
                      View Summary & AI Chat
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* --- DOCTOR SHARING MODAL --- */}
      <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Share AI Report With Doctor">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Select a verified doctor from your network. The doctor will receive a secure copy of your report PDF alongside this AI analysis summary.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Choose Practitioner:</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
              {doctors.map((doc) => (
                <div 
                  key={doc.id}
                  onClick={() => setSelectedDoctorId(doc.id)}
                  style={{
                    border: '1.5px solid var(--border)',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    borderColor: (selectedDoctorId === doc.id ? 'var(--primary)' : 'var(--border)') as string,
                    backgroundColor: (selectedDoctorId === doc.id ? 'var(--primary-light)' : 'white') as string,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800 }}>{doc.name}</h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{doc.specialty} • {doc.location}</span>
                  </div>
                  {selectedDoctorId === doc.id && <CheckCircle2 size={18} style={{ color: 'var(--primary)' }} />}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <Button variant="outline" onClick={() => setIsShareModalOpen(false)} disabled={isSharing}>Cancel</Button>
            <Button onClick={handleShareReport} isLoading={isSharing} disabled={!selectedDoctorId}>
              Confirm & Share Report
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
