import React from 'react';
import { 
  User, Heart, Activity, Sparkles, ShieldCheck, Stethoscope, 
  FileText, Pill, Siren, CheckCircle2, Navigation, Clock, Shield
} from 'lucide-react';
import { UserRole } from '../../context/AuthContext';

// --- 1. PATIENT 3D VISUAL ILLUSTRATION ---
export const Patient3DIllustration: React.FC = () => {
  return (
    <div style={{ position: 'relative', width: '100%', height: '310px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      {/* Background Soft Glow */}
      <div style={{
        position: 'absolute',
        width: '240px',
        height: '240px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(2, 132, 199, 0.35) 0%, rgba(16, 185, 129, 0.15) 60%, transparent 80%)',
        filter: 'blur(30px)'
      }} />

      {/* Main 3D Card Frame */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
        backdropFilter: 'blur(16px)',
        border: '1.5px solid rgba(255, 255, 255, 0.25)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        overflow: 'hidden'
      }}>
        {/* Animated Patient Avatar & Heart Ring */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <div style={{
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0284c7 0%, #10b981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 30px rgba(2, 132, 199, 0.4)',
            border: '4px solid rgba(255, 255, 255, 0.3)'
          }}>
            <User size={48} style={{ color: 'white' }} />
          </div>
          <div style={{
            position: 'absolute',
            bottom: '-4px',
            right: '-4px',
            backgroundColor: '#10b981',
            color: 'white',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(16, 185, 129, 0.4)',
            border: '2px solid white'
          }} className="animate-pulse">
            <Heart size={18} />
          </div>
        </div>

        {/* JHID Permanent Health Identifier Card */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.82)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          padding: '12px 20px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center',
          width: '85%'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '2px' }}>
            <ShieldCheck size={14} style={{ color: '#38bdf8' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#93c5fd' }}>Permanent Health ID</span>
          </div>
          <span style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '0.06em', fontFamily: 'monospace', color: '#ffffff' }}>
            JIV-2026-849201
          </span>
        </div>

        {/* Floating AI Status Pill */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          backgroundColor: 'rgba(16, 185, 129, 0.25)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '20px',
          padding: '4px 12px',
          fontSize: '0.72rem',
          fontWeight: 800,
          color: '#6ee7b7',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Sparkles size={12} /> AI Health Assistant Active
        </div>
      </div>
    </div>
  );
};

// --- 2. DOCTOR 3D VISUAL ILLUSTRATION ---
export const Doctor3DIllustration: React.FC = () => {
  return (
    <div style={{ position: 'relative', width: '100%', height: '310px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      {/* Background Soft Glow */}
      <div style={{
        position: 'absolute',
        width: '240px',
        height: '240px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(2, 132, 199, 0.15) 60%, transparent 80%)',
        filter: 'blur(30px)'
      }} />

      {/* Main 3D Card Frame */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
        backdropFilter: 'blur(16px)',
        border: '1.5px solid rgba(255, 255, 255, 0.25)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        overflow: 'hidden'
      }}>
        {/* Animated Stethoscope & Practitioner Badge */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <div style={{
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 30px rgba(16, 185, 129, 0.4)',
            border: '4px solid rgba(255, 255, 255, 0.3)'
          }}>
            <Stethoscope size={48} style={{ color: 'white' }} />
          </div>
          <div style={{
            position: 'absolute',
            bottom: '-4px',
            right: '-4px',
            backgroundColor: '#0284c7',
            color: 'white',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(2, 132, 199, 0.4)',
            border: '2px solid white'
          }}>
            <FileText size={18} />
          </div>
        </div>

        {/* Certified Doctor Digital Rx Badge */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.82)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          padding: '12px 20px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center',
          width: '85%'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '2px' }}>
            <CheckCircle2 size={14} style={{ color: '#34d399' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a7f3d0' }}>Practitioner Workstation</span>
          </div>
          <span style={{ fontSize: '1.05rem', fontWeight: 900, letterSpacing: '0.02em', color: '#ffffff' }}>
            Consent-Based Patient Access
          </span>
        </div>

        {/* Floating Status Pill */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          backgroundColor: 'rgba(2, 132, 199, 0.25)',
          border: '1px solid rgba(2, 132, 199, 0.4)',
          borderRadius: '20px',
          padding: '4px 12px',
          fontSize: '0.72rem',
          fontWeight: 800,
          color: '#93c5fd',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Shield size={12} /> Medical License Verified
        </div>
      </div>
    </div>
  );
};

// --- 3. AMBULANCE 3D VISUAL ILLUSTRATION ---
export const Ambulance3DIllustration: React.FC = () => {
  return (
    <div style={{ position: 'relative', width: '100%', height: '310px', borderRadius: '22px', overflow: 'hidden', border: '1.5px solid rgba(255, 255, 255, 0.25)', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
      <img
        src="/assets/images/ambulance-illustration.jpg"
        alt="Jivexa Health Emergency Ambulance"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/assets/images/jivexa-3d-reveal.jpg';
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }}
      />

      {/* Overlay Live Emergency Telemetry Badge */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        right: '16px',
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderRadius: '16px',
        padding: '12px 18px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} className="animate-pulse">
          <Siren size={20} />
        </div>
        <div>
          <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'white', margin: 0 }}>24/7 Emergency Dispatch Fleet</h4>
          <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Real-time GPS Tracking & Hospital Pre-Notification</span>
        </div>
      </div>
    </div>
  );
};

// --- 4. PHARMACY 3D VISUAL ILLUSTRATION ---
export const Pharmacy3DIllustration: React.FC = () => {
  return (
    <div style={{ position: 'relative', width: '100%', height: '310px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      {/* Background Soft Glow */}
      <div style={{
        position: 'absolute',
        width: '240px',
        height: '240px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, rgba(16, 185, 129, 0.15) 60%, transparent 80%)',
        filter: 'blur(30px)'
      }} />

      {/* Main 3D Card Frame */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
        backdropFilter: 'blur(16px)',
        border: '1.5px solid rgba(255, 255, 255, 0.25)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        overflow: 'hidden'
      }}>
        {/* Animated Pill Container */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <div style={{
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b 0%, #10b981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 30px rgba(245, 158, 11, 0.4)',
            border: '4px solid rgba(255, 255, 255, 0.3)'
          }}>
            <Pill size={48} style={{ color: 'white' }} />
          </div>
          <div style={{
            position: 'absolute',
            bottom: '-4px',
            right: '-4px',
            backgroundColor: '#10b981',
            color: 'white',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(16, 185, 129, 0.4)',
            border: '2px solid white'
          }}>
            <CheckCircle2 size={18} />
          </div>
        </div>

        {/* Pharmacy Dispatch Order Queue Card */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.82)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          padding: '12px 20px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center',
          width: '85%'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '2px' }}>
            <Clock size={14} style={{ color: '#fcd34d' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fef08a' }}>Order Fulfillment Hub</span>
          </div>
          <span style={{ fontSize: '1.05rem', fontWeight: 900, letterSpacing: '0.02em', color: '#ffffff' }}>
            Verified Electronic Rx Engine
          </span>
        </div>

        {/* Floating Status Pill */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          backgroundColor: 'rgba(245, 158, 11, 0.25)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: '20px',
          padding: '4px 12px',
          fontSize: '0.72rem',
          fontWeight: 800,
          color: '#fde68a',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Activity size={12} /> Stock Sync Online
        </div>
      </div>
    </div>
  );
};

// --- GRAPHIC DISPATCHER ---
export const RoleIllustrationGraphic: React.FC<{ role: UserRole }> = ({ role }) => {
  switch (role) {
    case 'DOCTOR':
      return <Doctor3DIllustration />;
    case 'AMBULANCE_PARTNER':
      return <Ambulance3DIllustration />;
    case 'PHARMACY':
      return <Pharmacy3DIllustration />;
    case 'PATIENT':
    default:
      return <Patient3DIllustration />;
  }
};
