import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useHealthData } from '../../context/HealthDataContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { 
  Heart, MessageSquare, Clipboard, Calendar, Pill, 
  Activity, ArrowRight, Star, Clock, AlertCircle, Plus, Check, Sparkles,
  ShieldCheck, Copy, QrCode, Lock, CheckCircle2, XCircle, UserCheck, Siren
} from 'lucide-react';
import { Toast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';

export const PatientDashboard: React.FC = () => {
  const { user, updateOnboarding } = useAuth();
  const { 
    appointments, healthRecords, healthGoals, patientProfile, updatePatientProfile,
    accessRequests, respondAccessRequest, revokeDoctorAccess,
    toggleEmergencyAccessMode, accessLogs 
  } = useHealthData();
  const navigate = useNavigate();

  const [toastMsg, setToastMsg] = useState('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [emergencyExpiryHours, setEmergencyExpiryHours] = useState(24);
  const [isTogglingEmergency, setIsTogglingEmergency] = useState(false);

  // --- ONBOARDING STATE ---
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardForm, setOnboardForm] = useState({
    dob: user?.dob || '',
    phone: user?.phone || '',
    bloodGroup: patientProfile?.bloodGroup || 'O+ Positive',
    allergies: patientProfile?.allergies || '',
    conditions: patientProfile?.conditions || '',
    emergencyContact: patientProfile?.emergencyContact || '',
    goalSteps: '8000',
    goalWater: '3000'
  });

  const handleOnboardSubmit = async () => {
    updatePatientProfile({
      bloodGroup: onboardForm.bloodGroup,
      allergies: onboardForm.allergies,
      conditions: onboardForm.conditions,
      emergencyContact: onboardForm.emergencyContact
    });
    
    await updateOnboarding({
      onboarded: true,
      phone: onboardForm.phone,
      dob: onboardForm.dob
    });
  };

  const handleSkipOnboarding = async () => {
    await updateOnboarding({ onboarded: true });
  };

  if (user && !user.onboarded) {
    const totalSteps = 6;
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>Onboarding Profile</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Step {onboardingStep} of {totalSteps}</span>
        </div>
        <div style={{ height: '4px', backgroundColor: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: `${(onboardingStep / totalSteps) * 100}%`, height: '100%', backgroundColor: 'var(--primary)', transition: 'width 0.3s ease' }} />
        </div>

        <Card title={`Step ${onboardingStep}: ${
          onboardingStep === 1 ? 'Welcome to JIVEXA' :
          onboardingStep === 2 ? 'Basic Profile' :
          onboardingStep === 3 ? 'Health Preferences' :
          onboardingStep === 4 ? 'Emergency Contact (Optional)' :
          onboardingStep === 5 ? 'Health Goals' :
          'Complete Profile'
        }`}>
          {onboardingStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', alignItems: 'center', padding: '20px 0' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={28} fill="var(--primary)" style={{ margin: 'auto' }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Welcome to Your Health Operating System</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                JIVEXA is designed to help you consolidate your medical records, communicate with doctors, and understand diagnostic reports simply. Let's configure your profile.
              </p>
              <Button onClick={() => setOnboardingStep(2)} style={{ marginTop: '12px' }}>Begin Configuration</Button>
            </div>
          )}

          {onboardingStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input 
                label="Date of Birth" 
                type="date" 
                value={onboardForm.dob}
                onChange={(e) => setOnboardForm({ ...onboardForm, dob: e.target.value })}
              />
              <Input 
                label="Phone Number" 
                placeholder="+91 98765 43210" 
                value={onboardForm.phone}
                onChange={(e) => setOnboardForm({ ...onboardForm, phone: e.target.value })}
              />
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <Button variant="outline" onClick={() => setOnboardingStep(1)}>Back</Button>
                <Button onClick={() => setOnboardingStep(3)} style={{ flex: 1 }}>Continue</Button>
              </div>
            </div>
          )}

          {onboardingStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Select 
                label="Blood Group"
                options={[
                  { value: 'A+ Positive', label: 'A+ Positive' },
                  { value: 'A- Negative', label: 'A- Negative' },
                  { value: 'B+ Positive', label: 'B+ Positive' },
                  { value: 'B- Negative', label: 'B- Negative' },
                  { value: 'AB+ Positive', label: 'AB+ Positive' },
                  { value: 'AB- Negative', label: 'AB- Negative' },
                  { value: 'O+ Positive', label: 'O+ Positive' },
                  { value: 'O- Negative', label: 'O- Negative' }
                ]}
                value={onboardForm.bloodGroup}
                onChange={(val) => setOnboardForm({ ...onboardForm, bloodGroup: val })}
              />
              <Input 
                label="Known Drug / Food Allergies" 
                placeholder="e.g. Peanuts, Penicillin (leave blank if none)" 
                value={onboardForm.allergies}
                onChange={(e) => setOnboardForm({ ...onboardForm, allergies: e.target.value })}
              />
              <Input 
                label="Existing Conditions / Diagnoses" 
                placeholder="e.g. Mild Asthma, Hypertension" 
                value={onboardForm.conditions}
                onChange={(e) => setOnboardForm({ ...onboardForm, conditions: e.target.value })}
              />
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <Button variant="outline" onClick={() => setOnboardingStep(2)}>Back</Button>
                <Button onClick={() => setOnboardingStep(4)} style={{ flex: 1 }}>Continue</Button>
              </div>
            </div>
          )}

          {onboardingStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Providing an emergency contact allows emergency practitioners to contact your representative if required.
              </p>
              <Input 
                label="Emergency Contact Name & Phone" 
                placeholder="Amit Gangwar (+91 99887 76655)" 
                value={onboardForm.emergencyContact}
                onChange={(e) => setOnboardForm({ ...onboardForm, emergencyContact: e.target.value })}
              />
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <Button variant="outline" onClick={() => setOnboardingStep(3)}>Back</Button>
                <Button onClick={() => setOnboardingStep(5)} style={{ flex: 1 }}>Continue</Button>
              </div>
            </div>
          )}

          {onboardingStep === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input 
                label="Daily Steps Goal" 
                type="number"
                value={onboardForm.goalSteps}
                onChange={(e) => setOnboardForm({ ...onboardForm, goalSteps: e.target.value })}
              />
              <Input 
                label="Daily Water Intake Goal (ml)" 
                type="number"
                value={onboardForm.goalWater}
                onChange={(e) => setOnboardForm({ ...onboardForm, goalWater: e.target.value })}
              />
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <Button variant="outline" onClick={() => setOnboardingStep(4)}>Back</Button>
                <Button onClick={() => setOnboardingStep(6)} style={{ flex: 1 }}>Continue</Button>
              </div>
            </div>
          )}

          {onboardingStep === 6 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={24} style={{ margin: 'auto' }} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Profile Configured!</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Your data is stored securely. You can modify these settings anytime from your dashboard settings.
              </p>
              <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '12px' }}>
                <Button variant="outline" onClick={() => setOnboardingStep(5)}>Back</Button>
                <Button onClick={handleOnboardSubmit} style={{ flex: 1 }}>Enter Dashboard</Button>
              </div>
            </div>
          )}
        </Card>
        
        {onboardingStep < 6 && (
          <button onClick={handleSkipOnboarding} style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem', alignSelf: 'center' }}>
            Skip onboarding and set up later
          </button>
        )}
      </div>
    );
  }

  const activeAppts = appointments.filter((a) => a.patientId === user?.id && ['Upcoming', 'Confirmed', 'In Consultation', 'Pending'].includes(a.status));
  const recentRecords = healthRecords.filter((r) => r.patientId === user?.id).slice(0, 3);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Patient Dashboard</span>
          <h1 style={{ fontWeight: 800, marginTop: '2px' }}>Good morning, {user?.name.split(' ')[0]}.</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => navigate('/patient/ambulance')}
            style={{
              backgroundColor: 'var(--error)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 18px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
            }}
          >
            <Siren size={16} />
            Book Ambulance
          </button>
          <button 
            onClick={() => navigate('/patient/ai-report-analyzer')}
            style={{
              backgroundColor: 'var(--secondary-light)',
              color: 'var(--secondary)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 18px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Sparkles size={16} />
            AI Report Analyzer
          </button>
          <button 
            onClick={() => navigate('/patient/ai-assistant')}
            style={{
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 18px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <MessageSquare size={16} />
            Ask AI Assistant
          </button>
          <button 
            onClick={() => navigate('/patient/appointments')}
            style={{
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 18px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Calendar size={16} />
            Book Consultation
          </button>
        </div>
      </div>

      {/* JIVEXA HEALTH ID CARD */}
      <div style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #115e59 50%, #0d9488 100%)',
        borderRadius: '24px',
        padding: '24px 28px',
        color: 'white',
        boxShadow: '0 16px 32px -10px rgba(15, 118, 110, 0.35)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <ShieldCheck size={18} style={{ color: '#5eead4' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#ccfbf1' }}>Permanent Health Identifier</span>
          </div>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '0.04em', fontFamily: 'monospace' }}>
            {patientProfile?.jivexaHealthId || 'JIV-2026-849201'}
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#e6fffa', opacity: 0.9 }}>
            Share your JHID with doctors to grant secure consent-based access to your health summary
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => {
              const hid = patientProfile?.jivexaHealthId || 'JIV-2026-849201';
              navigator.clipboard.writeText(hid);
              setToastMsg(`JIVEXA Health ID (${hid}) copied to clipboard!`);
            }}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              borderRadius: '14px',
              padding: '10px 18px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Copy size={16} />
            Copy Health ID
          </button>

          <button
            onClick={() => setIsQrModalOpen(true)}
            style={{
              backgroundColor: 'white',
              color: '#0f766e',
              border: 'none',
              borderRadius: '14px',
              padding: '10px 18px',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <QrCode size={16} />
            QR Badge
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }} className="grid-2-mobile">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* DOCTOR CONSENT ACCESS MANAGER CARD */}
          <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Lock size={20} style={{ color: 'var(--primary)' }} /><span style={{ fontWeight: 800, fontSize: '1.05rem' }}>Manage Doctor Access & Consent</span></div>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Pending Consent Requests */}
              {accessRequests.filter((r) => r.patientId === user?.id && r.status === 'pending').length > 0 && (
                <div style={{ backgroundColor: 'var(--warning-light)', border: '1px solid var(--warning)', borderRadius: '16px', padding: '16px 20px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '12px' }}>
                    ⚡ Pending Access Requests ({accessRequests.filter((r) => r.patientId === user?.id && r.status === 'pending').length}):
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {accessRequests.filter((r) => r.patientId === user?.id && r.status === 'pending').map((req) => (
                      <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <div>
                          <h4 style={{ fontSize: '0.92rem', fontWeight: 800 }}>{req.doctorName}</h4>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{req.doctorSpecialty} • Requested Access</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Button size="sm" onClick={async () => {
                            await respondAccessRequest(req.id, 'approved');
                            setToastMsg(`Granted access to ${req.doctorName}.`);
                          }}>
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={async () => {
                            await respondAccessRequest(req.id, 'rejected');
                            setToastMsg(`Declined request from ${req.doctorName}.`);
                          }}>
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approved Doctors List */}
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>
                  Authorized Doctors with Active Consent:
                </span>
                {accessRequests.filter((r) => r.patientId === user?.id && r.status === 'approved').length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '12px 0' }}>
                    No doctors currently have authorized access to your Health ID summary.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {accessRequests.filter((r) => r.patientId === user?.id && r.status === 'approved').map((req) => (
                      <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '14px', padding: '12px 16px', backgroundColor: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <UserCheck size={18} style={{ color: 'var(--secondary)' }} />
                          <div>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{req.doctorName}</h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.doctorSpecialty}</span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={async () => {
                          await revokeDoctorAccess(req.doctorId);
                          setToastMsg(`Revoked access for ${req.doctorName}.`);
                        }}>
                          Revoke Access
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </Card>

          {/* LEVEL 3 EMERGENCY ACCESS MODE CONTROLS */}
          <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Activity size={20} style={{ color: 'var(--secondary)' }} /><span style={{ fontWeight: 800, fontSize: '1.05rem' }}>Instant Emergency Access Sharing Mode</span></div>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Enable emergency instant sharing to allow ER responders to view critical emergency data using your Health ID without waiting for manual consent.
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', backgroundColor: '#f8fafc', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                    Emergency Mode: {patientProfile?.emergencySharingEnabled ? '⚡ ENABLED' : '🔒 DISABLED'}
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {patientProfile?.emergencySharingEnabled && patientProfile.emergencyAccessExpiry
                      ? `Active until ${new Date(patientProfile.emergencyAccessExpiry).toLocaleString()}`
                      : 'Disabled — standard consent rules apply.'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {!patientProfile?.emergencySharingEnabled && (
                    <Select
                      value={String(emergencyExpiryHours)}
                      onChange={(val) => setEmergencyExpiryHours(Number(val))}
                      options={[
                        { value: '24', label: 'Duration: 24 Hours' },
                        { value: '48', label: 'Duration: 48 Hours' },
                        { value: '168', label: 'Duration: 7 Days' }
                      ]}
                      style={{ height: '38px', fontSize: '0.82rem' }}
                    />
                  )}

                  <Button
                    isLoading={isTogglingEmergency}
                    onClick={async () => {
                      setIsTogglingEmergency(true);
                      const nextState = !patientProfile?.emergencySharingEnabled;
                      await toggleEmergencyAccessMode(nextState, emergencyExpiryHours);
                      setIsTogglingEmergency(false);
                      setToastMsg(`Emergency Access Mode ${nextState ? 'ENABLED' : 'DISABLED'}.`);
                    }}
                    style={{
                      backgroundColor: patientProfile?.emergencySharingEnabled ? 'var(--error)' : 'var(--secondary)',
                      borderRadius: '12px',
                      padding: '8px 20px',
                      fontWeight: 800
                    }}
                  >
                    {patientProfile?.emergencySharingEnabled ? 'Disable Emergency Mode' : 'Enable Emergency Mode'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* AUDIT ACCESS LOG HISTORY */}
          <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Clock size={20} style={{ color: 'var(--primary)' }} /><span style={{ fontWeight: 800, fontSize: '1.05rem' }}>Health ID Access Audit Logs</span></div>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Immutable log of all public lookups, emergency views, and practitioner accesses to your Health ID profile.
              </span>

              {accessLogs.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '12px 0' }}>
                  No access events recorded yet. Every Health ID query will be logged here in real-time.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                  {accessLogs.map((log) => (
                    <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dotted var(--border)', paddingBottom: '8px', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: log.accessType === 'DOCTOR_CLINICAL_FULL' ? 'var(--primary-light)' : log.accessType === 'EMERGENCY_MODE_INSTANT' ? 'var(--secondary-light)' : '#f1f5f9',
                          color: log.accessType === 'DOCTOR_CLINICAL_FULL' ? 'var(--primary)' : log.accessType === 'EMERGENCY_MODE_INSTANT' ? 'var(--secondary)' : 'var(--text-muted)'
                        }}>
                          {log.accessorRole}
                        </span>
                        <span style={{ fontWeight: 600 }}>{log.accessType.replace(/_/g, ' ')}</span>
                      </div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {new Date(log.accessedAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }} className="grid-3-mobile">
            {healthGoals.map((goal) => (
              <div 
                key={goal.id} 
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  backgroundColor: 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase' }}>{goal.type}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                    {Math.round((goal.current / goal.target) * 100)}%
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{goal.current}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ {goal.target} {goal.unit}</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'var(--border)', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
                  <div style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%`, height: '100%', backgroundColor: 'var(--primary)' }} />
                </div>
              </div>
            ))}
          </div>

          <Card 
            title="Upcoming Consultations"
            headerAction={
              <Link to="/patient/appointments" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Manage Bookings</Link>
            }
          >
            {activeAppts.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Calendar size={32} style={{ color: 'var(--text-light)', marginBottom: '12px' }} />
                <p style={{ fontSize: '0.9rem' }}>No upcoming doctor appointments scheduled.</p>
                <Button variant="outline" onClick={() => navigate('/patient/doctors')} style={{ marginTop: '12px' }}>Find a Practitioner</Button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activeAppts.map((appt) => (
                  <div 
                    key={appt.id}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    className="flex-col-mobile gap-sm"
                  >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                        <span style={{ margin: 'auto' }}>{appt.doctorName.charAt(4)}</span>
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{appt.doctorName}</h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{appt.doctorSpecialty} • Video Consultation</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }} className="w-100-mobile justify-between">
                      <div style={{ textAlign: 'right' }} className="text-left-mobile">
                        <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600 }}>{new Date(appt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-light)' }}>{appt.time}</span>
                      </div>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        padding: '4px 10px', 
                        backgroundColor: appt.status === 'In Consultation' ? 'var(--warning-light)' : (appt.status === 'Pending' ? 'var(--error-light)' : 'var(--secondary-light)'), 
                        color: appt.status === 'In Consultation' ? 'var(--warning)' : (appt.status === 'Pending' ? 'var(--error)' : 'var(--secondary)'),
                        borderRadius: '4px' 
                      }}>
                        {appt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Quick Operations</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }} className="grid-2-mobile">
              <div 
                onClick={() => navigate('/patient/ai-assistant')}
                className="card card-hover" 
                style={{ textAlign: 'center', padding: '20px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}
              >
                <MessageSquare size={22} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Ask AI</span>
              </div>
              <div 
                onClick={() => navigate('/patient/doctors')}
                className="card card-hover" 
                style={{ textAlign: 'center', padding: '20px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}
              >
                <Heart size={22} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Find Doctor</span>
              </div>
              <div 
                onClick={() => navigate('/patient/health-records')}
                className="card card-hover" 
                style={{ textAlign: 'center', padding: '20px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}
              >
                <Clipboard size={22} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>View Records</span>
              </div>
              <div 
                onClick={() => navigate('/patient/profile')}
                className="card card-hover" 
                style={{ textAlign: 'center', padding: '20px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}
              >
                <Activity size={22} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Edit Profile</span>
              </div>
            </div>
          </div>

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <Card title="My Health Profile">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-light)', fontWeight: 500 }}>Blood Group</span>
                <span style={{ fontWeight: 600 }}>{patientProfile?.bloodGroup || 'O+'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-light)', fontWeight: 500 }}>Active Allergies</span>
                <span style={{ fontWeight: 600, color: 'var(--error)' }}>{patientProfile?.allergies || 'None logged'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-light)', fontWeight: 500 }}>Diagnosed Conditions</span>
                <span style={{ fontWeight: 600 }}>{patientProfile?.conditions || 'None logged'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ color: 'var(--text-light)', fontWeight: 500 }}>Emergency Contact</span>
                <span style={{ fontWeight: 600 }}>{patientProfile?.emergencyContact || 'Not configured'}</span>
              </div>
              <Button variant="outline" onClick={() => navigate('/patient/profile')} style={{ marginTop: '8px', height: '36px', fontSize: '0.82rem' }}>Update Health Info</Button>
            </div>
          </Card>

          <Card 
            title="Recent Documents"
            headerAction={<Link to="/patient/health-records" style={{ fontSize: '0.85rem', fontWeight: 600 }}>View All</Link>}
          >
            {recentRecords.length === 0 ? (
              <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--text-light)', fontSize: '0.82rem' }}>
                No reports uploaded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentRecords.map((rec) => (
                  <div 
                    key={rec.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '0.82rem',
                      borderBottom: '1px solid var(--surface-raised)',
                      paddingBottom: '8px'
                    }}
                  >
                    <Clipboard size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <span style={{ display: 'block', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{rec.name}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>{rec.date} • {rec.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>
      </div>

      {/* TOAST & QR MODAL */}
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg('')} />}

      <Modal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} title="Your JIVEXA Health ID QR Badge">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '10px 0', textAlign: 'center' }}>
          <div style={{ backgroundColor: 'white', border: '3px solid var(--primary)', borderRadius: '24px', padding: '24px', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '160px', height: '160px', borderRadius: '16px', background: 'linear-gradient(135deg, #0f766e 0%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <QrCode size={110} />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: 'monospace', color: 'var(--primary)' }}>
              {patientProfile?.jivexaHealthId || 'JIV-2026-849201'}
            </span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '340px' }}>
            Present this QR Badge or Health ID to authorized healthcare practitioners to grant instant consent-based clinical summary access.
          </p>

          <Button onClick={() => setIsQrModalOpen(false)} style={{ borderRadius: '12px', width: '100%' }}>Close QR Badge</Button>
        </div>
      </Modal>

      <style>{`
        @media (max-width: 768px) {
          .flex-col-mobile { flex-direction: column !important; align-items: flex-start !important; }
          .text-left-mobile { text-align: left !important; }
          .w-100-mobile { width: 100% !important; }
        }
      `}</style>
    </div>
  );
};
