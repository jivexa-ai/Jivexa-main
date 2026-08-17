import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { BrandLogo } from '../../components/common/BrandLogo';
import { RoleIllustrationGraphic } from '../../components/common/RoleIllustrations';
import { checkUserRoleRegistration } from '../../services/authRoleService';
import { 
  Heart, Shield, Check, Lock, Mail, User, Stethoscope, 
  Pill, Siren, CheckCircle2, ShieldCheck, ArrowRight, HelpCircle, Activity, Sparkles
} from 'lucide-react';

// --- ROLE HIGHLIGHTS CONFIGURATION ---
const roleHighlights: Record<UserRole, {
  badge: string;
  title: string;
  desc: string;
  gradient: string;
  features: string[];
}> = {
  PATIENT: {
    badge: 'JIVEXA HEALTH ECOSYSTEM',
    title: 'Your Complete Health Journey, AI-Connected.',
    desc: 'Access your secure Health Vault, AI report analysis, digital prescriptions, and 24/7 emergency ambulance network in one place.',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #0284c7 60%, #10b981 100%)',
    features: ['Instant AI Lab Report Analyzer', 'Consent-Based Health ID Access', '24/7 Emergency Ambulance Booking']
  },
  DOCTOR: {
    badge: 'PRACTITIONER CLINICAL WORKSTATION',
    title: 'Streamlined Consultations & Consent-Based Access.',
    desc: 'Manage online & in-clinic consultations, access complete patient summaries with consent, and issue instant digital prescriptions.',
    gradient: 'linear-gradient(135deg, #064e3b 0%, #059669 60%, #0284c7 100%)',
    features: ['Digital Consent Request Workstation', 'E-Prescriptions with QR Verification', 'Integrated Patient Health Timeline']
  },
  AMBULANCE_PARTNER: {
    badge: '24/7 EMERGENCY AMBULANCE NETWORK',
    title: 'Rapid Emergency Dispatch & Live GPS Telemetry.',
    desc: 'Accept nearby patient emergency requests, provide real-time GPS tracking telemetry, and coordinate with hospital trauma centers.',
    gradient: 'linear-gradient(135deg, #450a0a 0%, #dc2626 60%, #0f172a 100%)',
    features: ['Live GPS Telemetry & Patient Navigation', 'Basic, Oxygen & ICU Fleet Categories', 'Hospital Emergency Pre-Notification']
  },
  PHARMACY: {
    badge: 'PHARMACY FULFILLMENT HUB',
    title: 'Verified Digital Rx Dispensing & Inventory.',
    desc: 'Process verified doctor digital prescriptions, manage inventory stock, and track home delivery medicine orders in real-time.',
    gradient: 'linear-gradient(135deg, #451a03 0%, #d97706 60%, #059669 100%)',
    features: ['Instant QR Digital Rx Validation', 'Inventory & Stock Availability Sync', 'Patient Delivery Order Dispatch']
  },
  ADMIN: {
    badge: 'SYSTEM CONTROL',
    title: 'Administrative Security & Audit Control.',
    desc: 'Platform analytics, user verification, and HIPAA compliance logs.',
    gradient: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)',
    features: ['System Audit Logs', 'Practitioner Licensing Verification', 'Platform Telemetry']
  }
};

// --- LEFT HERO ILLUSTRATION PANEL ---
const AuthHeroPanel: React.FC<{ activeRole: UserRole }> = ({ activeRole }) => {
  const graphic = roleHighlights[activeRole] || roleHighlights.PATIENT;

  return (
    <div style={{
      flex: '1.1',
      background: graphic.gradient,
      borderRadius: '28px',
      padding: '40px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 24px 48px -12px rgba(2, 132, 199, 0.35)',
      minHeight: '640px',
      transition: 'background 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    }} className="sr-mobile-hide">
      
      {/* Ambient Lighting Overlay */}
      <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '360px', height: '360px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)', filter: 'blur(45px)', pointerEvents: 'none' }} />

      {/* Top Header Lockup */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <BrandLogo size="lg" variant="light" />
        <span style={{
          fontSize: '0.74rem',
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          backgroundColor: 'rgba(255, 255, 255, 0.16)',
          padding: '6px 14px',
          borderRadius: '20px',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.22)'
        }}>
          {graphic.badge}
        </span>
      </div>

      {/* DEDICATED 3D ILLUSTRATION CONTAINER (CHANGES IMMEDIATELY WITH ROLE) */}
      <div style={{ position: 'relative', zIndex: 10, margin: '24px 0', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        <RoleIllustrationGraphic role={activeRole} />
      </div>

      {/* Bottom Text Narrative & Feature Checklist */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 style={{ fontSize: '1.55rem', fontWeight: 900, color: 'white', lineHeight: '1.25', letterSpacing: '-0.02em' }}>
          {graphic.title}
        </h2>
        <p style={{ fontSize: '0.88rem', color: '#e2e8f0', lineHeight: '1.55' }}>
          {graphic.desc}
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
          {graphic.features.map((feat, idx) => (
            <span key={idx} style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              backgroundColor: 'rgba(255, 255, 255, 0.14)',
              color: '#ffffff',
              padding: '4px 10px',
              borderRadius: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Check size={12} style={{ color: '#38bdf8' }} />
              {feat}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
};

// --- SELECTABLE ROLE CARDS COMPONENT ---
const RoleSelectorCards: React.FC<{ activeRole: UserRole; onSelectRole: (role: UserRole) => void }> = ({ activeRole, onSelectRole }) => {
  const roles = [
    {
      id: 'PATIENT' as UserRole,
      title: 'Patient',
      desc: 'Personal Health & AI Insights',
      icon: <User size={18} style={{ color: activeRole === 'PATIENT' ? '#0284c7' : 'var(--text-muted)' }} />,
      color: '#0284c7'
    },
    {
      id: 'DOCTOR' as UserRole,
      title: 'Doctor',
      desc: 'Clinical Consults & Digital Rx',
      icon: <Stethoscope size={18} style={{ color: activeRole === 'DOCTOR' ? '#10b981' : 'var(--text-muted)' }} />,
      color: '#10b981'
    },
    {
      id: 'AMBULANCE_PARTNER' as UserRole,
      title: 'Ambulance',
      desc: '24/7 Emergency Dispatch Fleet',
      icon: <Siren size={18} style={{ color: activeRole === 'AMBULANCE_PARTNER' ? '#ef4444' : 'var(--text-muted)' }} />,
      color: '#ef4444'
    },
    {
      id: 'PHARMACY' as UserRole,
      title: 'Pharmacy',
      desc: 'Medicine Orders & Stock Sync',
      icon: <Pill size={18} style={{ color: activeRole === 'PHARMACY' ? '#f59e0b' : 'var(--text-muted)' }} />,
      color: '#f59e0b'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
      <label style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
        Select Account Category:
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {roles.map((r) => {
          const isSelected = activeRole === r.id;
          return (
            <div
              key={r.id}
              onClick={() => onSelectRole(r.id)}
              style={{
                border: isSelected ? `2px solid ${r.color}` : '1.5px solid var(--border)',
                backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isSelected ? '0 6px 18px -4px rgba(2, 132, 199, 0.2)' : 'none',
                position: 'relative'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: isSelected ? '#ffffff' : 'var(--surface-raised)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {r.icon}
              </div>

              <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</h4>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {r.desc}
                </p>
              </div>

              {isSelected && (
                <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                  <CheckCircle2 size={15} style={{ color: r.color }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- LOGIN VIEW ---
export const Login: React.FC = () => {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Helper to parse role from URL search parameters e.g. /login?role=AMBULANCE_PARTNER
  const getInitialRole = (): UserRole => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role')?.toUpperCase();
    if (roleParam === 'AMBULANCE' || roleParam === 'AMBULANCE_PARTNER') return 'AMBULANCE_PARTNER';
    if (roleParam === 'DOCTOR') return 'DOCTOR';
    if (roleParam === 'PHARMACY') return 'PHARMACY';
    return 'PATIENT';
  };

  const [activeRole, setActiveRole] = useState<UserRole>(getInitialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showAdminContact, setShowAdminContact] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const roleFromUrl = getInitialRole();
    setActiveRole(roleFromUrl);
  }, [location.search]);

  const handleTabChange = (role: UserRole) => {
    setActiveRole(role);
    setError('');
    setShowAdminContact(false);
  };

  const getRoleLoginTitle = () => {
    switch (activeRole) {
      case 'DOCTOR': return 'Sign In as Doctor';
      case 'AMBULANCE_PARTNER': return 'Sign In as Ambulance Partner';
      case 'PHARMACY': return 'Sign In as Pharmacist';
      default: return 'Sign In as Patient';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError('');
    setShowAdminContact(false);
    setIsLoading(true);

    try {
      const res = await login(email, password);
      if (res.success && res.role) {
        const dashboardRoutes: Record<UserRole, string> = {
          PATIENT: '/patient/dashboard',
          DOCTOR: '/doctor/dashboard',
          PHARMACY: '/pharmacy/dashboard',
          ADMIN: '/admin/dashboard',
          AMBULANCE_PARTNER: '/ambulance/dashboard'
        };
        navigate(dashboardRoutes[res.role]);
      } else {
        setError(res.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An unexpected error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 'calc(100vh - var(--header-height) - 40px)',
      padding: '24px 20px',
      background: 'radial-gradient(circle at 50% 20%, rgba(2, 132, 199, 0.08) 0%, rgba(16, 185, 129, 0.04) 50%, transparent 80%)'
    }}>
      <div style={{
        display: 'flex',
        maxWidth: '1040px',
        width: '100%',
        gap: '32px',
        alignItems: 'stretch'
      }}>
        {/* Left Side Dynamic 3D Illustration Panel */}
        <AuthHeroPanel activeRole={activeRole} />

        {/* Right Side Glassmorphism Form */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Card title={
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              <div style={{ display: 'none' }} className="sr-mobile-block">
                <BrandLogo size="md" />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                {getRoleLoginTitle()}
              </h2>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Select your account category below and enter your credentials.
              </span>
            </div>
          } style={{ width: '100%', borderRadius: '24px', boxShadow: 'var(--shadow-xl)', padding: '32px' }}>

            {/* 1. ROLE CARDS (BEFORE EMAIL FIELD) */}
            <RoleSelectorCards activeRole={activeRole} onSelectRole={handleTabChange} />

            {/* 2. AUTHENTICATION INPUT FIELDS */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {error && (
                <div style={{
                  backgroundColor: 'var(--error-light)',
                  border: '1px solid var(--error)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--error)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <span>{error}</span>
                  {showAdminContact && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => alert('Contacting JIVEXA Administration: Support hotline +91 1800 9900 11 or email admin@jivexa.in')}
                      style={{ borderColor: 'var(--error)', color: 'var(--error)', marginTop: '4px' }}
                    >
                      Contact JIVEXA Administration
                    </Button>
                  )}
                </div>
              )}

              <Input 
                label="Email Address" 
                type="email" 
                placeholder="name@domain.com" 
                icon={<Mail size={16} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input 
                label="Password" 
                type="password" 
                placeholder="••••••••" 
                icon={<Lock size={16} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div style={{ textAlign: 'right' }}>
                <Link to="/forgot-password" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)' }}>Forgot password?</Link>
              </div>

              <Button type="submit" isLoading={isLoading} fullWidth style={{ height: '46px', fontSize: '0.98rem', fontWeight: 800 }}>
                Sign In as {activeRole === 'PATIENT' ? 'Patient' : activeRole === 'DOCTOR' ? 'Doctor' : activeRole === 'PHARMACY' ? 'Pharmacist' : 'Ambulance Partner'}
              </Button>
              
              <div style={{ textAlign: 'center', fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Don't have an account? <Link to={`/signup?role=${activeRole}`} style={{ fontWeight: 800, color: 'var(--primary)' }}>Create Account</Link>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

// --- SIGNUP VIEW ---
export const Signup: React.FC = () => {
  const { signup } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getInitialRole = (): UserRole => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role')?.toUpperCase();
    if (roleParam === 'AMBULANCE' || roleParam === 'AMBULANCE_PARTNER') return 'AMBULANCE_PARTNER';
    if (roleParam === 'DOCTOR') return 'DOCTOR';
    if (roleParam === 'PHARMACY') return 'PHARMACY';
    return 'PATIENT';
  };

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(getInitialRole);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const roleFromUrl = getInitialRole();
    setRole(roleFromUrl);
  }, [location.search]);

  const getRoleSignupTitle = () => {
    switch (role) {
      case 'DOCTOR': return 'Register as Doctor';
      case 'AMBULANCE_PARTNER': return 'Register Ambulance Fleet';
      case 'PHARMACY': return 'Register Pharmacy Hub';
      default: return 'Register as Patient';
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const res = await signup(email, name, role, password);
      if (res.success) {
        const dashboardRoutes: Record<UserRole, string> = {
          PATIENT: '/patient/dashboard',
          DOCTOR: '/doctor/dashboard',
          PHARMACY: '/pharmacy/dashboard',
          ADMIN: '/admin/dashboard',
          AMBULANCE_PARTNER: '/ambulance/dashboard'
        };
        navigate(dashboardRoutes[role] || '/patient/dashboard');
      } else {
        setError(res.error || 'Signup failed.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 'calc(100vh - var(--header-height) - 40px)',
      padding: '24px 20px',
      background: 'radial-gradient(circle at 50% 20%, rgba(2, 132, 199, 0.08) 0%, rgba(16, 185, 129, 0.04) 50%, transparent 80%)'
    }}>
      <div style={{
        display: 'flex',
        maxWidth: '1040px',
        width: '100%',
        gap: '32px',
        alignItems: 'stretch'
      }}>
        {/* Left Side Dynamic 3D Illustration Panel */}
        <AuthHeroPanel activeRole={role} />

        {/* Right Side Glassmorphism Signup Card */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Card title={
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              <div style={{ display: 'none' }} className="sr-mobile-block">
                <BrandLogo size="md" />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                {getRoleSignupTitle()}
              </h2>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Select your account category below and complete registration.
              </span>
            </div>
          } style={{ width: '100%', borderRadius: '24px', boxShadow: 'var(--shadow-xl)', padding: '32px' }}>

            {/* 1. SELECTABLE ROLE CARDS (MUST APPEAR BEFORE NAME FIELD) */}
            <RoleSelectorCards activeRole={role} onSelectRole={(r) => setRole(r)} />

            {/* 2. REGISTRATION INPUT FIELDS (APPEAR AFTER ROLE CARDS) */}
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && (
                <div style={{ backgroundColor: 'var(--error-light)', border: '1px solid var(--error)', padding: '10px 14px', borderRadius: 'var(--radius-md)', color: 'var(--error)', fontSize: '0.84rem', fontWeight: 600 }}>
                  {error}
                </div>
              )}

              <Input 
                label="Full Name" 
                placeholder="User Name" 
                icon={<User size={16} />}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input 
                label="Email Address" 
                type="email" 
                placeholder="abc@abc.in" 
                icon={<Mail size={16} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input 
                label="Choose Password" 
                type="password" 
                placeholder="••••••••" 
                icon={<Lock size={16} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Input 
                label="Confirm Password" 
                type="password" 
                placeholder="••••••••" 
                icon={<Lock size={16} />}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Button type="submit" isLoading={isLoading} fullWidth style={{ height: '46px', fontSize: '0.98rem', fontWeight: 800, marginTop: '8px' }}>
                Register as {role === 'PATIENT' ? 'Patient' : role === 'DOCTOR' ? 'Doctor' : role === 'PHARMACY' ? 'Pharmacy' : 'Ambulance Partner'}
              </Button>
              
              <div style={{ textAlign: 'center', fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Already have an account? <Link to={`/login?role=${role}`} style={{ fontWeight: 800, color: 'var(--primary)' }}>Sign In</Link>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

// --- EMAIL OTP VERIFICATION VIEW ---
export const Verify: React.FC = () => {
  const { verifyEmail, sendOTP, user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [emailWarning, setEmailWarning] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();

  // Validate 100% correct email format
  const validateEmailFormat = (val: string): boolean => {
    const trimmed = val.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!trimmed) {
      setEmailWarning('Email address is required for OTP dispatch.');
      return false;
    }
    if (!emailRegex.test(trimmed)) {
      setEmailWarning('⚠️ Warning: Please enter a 100% valid email address (e.g., founder@jivexa.com)');
      return false;
    }
    setEmailWarning('');
    return true;
  };

  // Initial OTP Dispatch on mount
  useEffect(() => {
    const target = user?.email || email;
    if (target && validateEmailFormat(target)) {
      handleDispatchOTP(target);
    }
  }, []);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let interval: any = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleDispatchOTP = async (targetEmail?: string) => {
    const mailToUse = targetEmail || email;
    if (!validateEmailFormat(mailToUse)) return;

    setIsSendingOTP(true);
    setError('');
    setInfoMessage('');

    try {
      const res = await sendOTP(mailToUse);
      if (res.success) {
        setInfoMessage(res.message || `Verification code sent to ${mailToUse}`);
        if (res.previewUrl) setPreviewUrl(res.previewUrl);
        setResendTimer(60);
        setCanResend(false);
      } else {
        setError(res.error || 'Failed to dispatch verification code to email.');
      }
    } catch (err) {
      setError('Connection error while requesting OTP email.');
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError('Please enter a 6-digit numeric verification code.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const res = await verifyEmail(code);
      if (res.success) {
        const targetRole = user?.role || 'PATIENT';
        const dashboardRoutes: Record<UserRole, string> = {
          PATIENT: '/patient/dashboard',
          DOCTOR: '/doctor/dashboard',
          PHARMACY: '/pharmacy/dashboard',
          ADMIN: '/admin/dashboard',
          AMBULANCE_PARTNER: '/ambulance/dashboard'
        };
        navigate(dashboardRoutes[targetRole]);
      } else {
        setError(res.error || 'Invalid or expired 6-digit OTP code.');
      }
    } catch (err) {
      setError('An unexpected error occurred during verification.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - var(--header-height) - 80px)', padding: 'var(--space-md)' }}>
      <Card title={
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%' }}>
          <BrandLogo size="lg" />
          <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
            Real Email OTP Verification
          </span>
        </div>
      } style={{ maxWidth: '440px', width: '100%', borderRadius: 'var(--radius-xl)', padding: '28px' }}>

        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '18px', alignItems: 'center' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'rgba(2, 132, 199, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={26} style={{ margin: 'auto' }} />
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>Check Your Email Inbox</h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: '1.4' }}>
              We have dispatched a 6-digit security code to your email. Enter the code below to complete account verification.
            </p>
          </div>

          {/* Email Address & Format Validation Warning */}
          <div style={{ width: '100%' }}>
            <Input 
              label="Recipient Email Address"
              type="email"
              placeholder="name@domain.com"
              icon={<Mail size={16} />}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                validateEmailFormat(e.target.value);
              }}
              required
            />
            {emailWarning && (
              <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, marginTop: '6px' }}>
                {emailWarning}
              </div>
            )}
          </div>

          {/* Messages & Errors */}
          {error && (
            <div style={{ width: '100%', backgroundColor: 'var(--error-light)', border: '1px solid var(--error)', padding: '10px 14px', borderRadius: 'var(--radius-md)', color: 'var(--error)', fontSize: '0.84rem', fontWeight: 600 }}>
              {error}
            </div>
          )}

          {infoMessage && (
            <div style={{ width: '100%', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--secondary)', padding: '10px 14px', borderRadius: 'var(--radius-md)', color: 'var(--secondary)', fontSize: '0.84rem', fontWeight: 600, textAlign: 'center' }}>
              {infoMessage}
            </div>
          )}

          {/* Live Ethereal Email Preview Button (For Instant Test Inspection) */}
          {previewUrl && (
            <a 
              href={previewUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '8px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none' }}
            >
              ✉️ Open Sent Email in Browser Preview
            </a>
          )}

          {/* 6-Digit OTP Code Input */}
          <div style={{ width: '100%' }}>
            <Input 
              label="6-Digit Verification Code"
              placeholder="• • • • • •"
              style={{ textAlign: 'center', letterSpacing: '10px', fontSize: '1.3rem', fontWeight: 800 }}
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>

          <Button type="submit" isLoading={isLoading} fullWidth style={{ height: '46px', fontWeight: 800, fontSize: '0.96rem' }}>
            Verify OTP Code
          </Button>

          {/* Resend OTP with Countdown Timer */}
          <div style={{ textAlign: 'center', marginTop: '4px' }}>
            {canResend ? (
              <button 
                type="button" 
                onClick={() => handleDispatchOTP()}
                disabled={isSendingOTP}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', fontSize: '0.86rem', textDecoration: 'underline' }}
              >
                {isSendingOTP ? 'Dispatching Email...' : 'Resend Verification Code'}
              </button>
            ) : (
              <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Resend OTP in <strong>{resendTimer}s</strong>
              </span>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
};

// --- FORGOT PASSWORD VIEW ---
export const ForgotPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await resetPassword(email);
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error || 'Failed.');
      }
    } catch (e) {
      setError('An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - var(--header-height) - 80px)', padding: 'var(--space-md)' }}>
      <Card title={<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%' }}><BrandLogo size="lg" /><span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>Reset Password</span></div>} style={{ maxWidth: '420px', width: '100%', borderRadius: 'var(--radius-xl)' }}>
        {success ? (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={24} style={{ margin: 'auto' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Link Dispatched</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Check your email. We have sent instructions to reset your password if your account exists.
              </p>
            </div>
            <Link to="/login" style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '8px' }}>Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Enter the email address associated with your JIVEXA account, and we will dispatch a recovery link.
            </p>

            {error && (
              <div style={{ backgroundColor: 'var(--error-light)', border: '1px solid var(--error)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', color: 'var(--error)', fontSize: '0.82rem', fontWeight: 500 }}>
                {error}
              </div>
            )}

            <Input 
              label="Email Address" 
              type="email" 
              placeholder="mayank@jivexa.in" 
              icon={<Mail size={16} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button type="submit" isLoading={isLoading} fullWidth>Send Reset Link</Button>

            <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              <Link to="/login" style={{ fontWeight: 600 }}>Return to Login</Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
