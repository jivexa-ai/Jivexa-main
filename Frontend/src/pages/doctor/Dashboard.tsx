import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useHealthData, Appointment, Prescription, HealthRecord } from '../../context/HealthDataContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { 
  Calendar, Clock, User, Clipboard, FileText, Settings, Stethoscope, 
  Search, Eye, ShieldAlert, Heart, FileDown, CheckCircle 
} from 'lucide-react';

import { Toast } from '../../components/ui/Toast';
import { Lock, ShieldCheck, UserCheck, Send, CheckCircle2 } from 'lucide-react';

interface PatientSummary {
  id: string;
  name: string;
  lastSeen: string;
}

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { 
    appointments, doctors, prescriptions, healthRecords, sharedReports, updateAppointmentStatus,
    searchPatientByHealthId, requestPatientAccess, accessRequests 
  } = useHealthData();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'Today' | 'Appointments' | 'Patients' | 'Shared Reports' | 'Health ID Search'>('Today');
  
  const activeDoc = doctors.find((d) => d.id === user?.id) || doctors.find((d) => d.id === '00000000-0000-0000-0000-000000000001') || doctors.find((d) => d.id === 'doc_1') || doctors[0];

  const docAppts = appointments.filter((a) => a.doctorId === activeDoc?.id);
  const todayStr = new Date().toISOString().split('T')[0];
  
  const todayAppts = docAppts.filter((a) => a.date === todayStr);
  
  const patientIds = Array.from(new Set(docAppts.map((a) => a.patientId)));
  const uniquePatients: PatientSummary[] = patientIds.map((pid) => {
    const lastAppt = docAppts.filter((a) => a.patientId === pid).sort((a, b) => b.date.localeCompare(a.date))[0];
    return {
      id: pid,
      name: lastAppt?.patientName || 'Patient',
      lastSeen: lastAppt?.date || ''
    };
  });

  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // JHID Workstation States
  const [healthIdQuery, setHealthIdQuery] = useState('');
  const [searchedPatientInfo, setSearchedPatientInfo] = useState<any>(null);
  const [isSearchingJhid, setIsSearchingJhid] = useState(false);
  const [isRequestingConsent, setIsRequestingConsent] = useState(false);
  const [jhidError, setJhidError] = useState('');
  const [jhidToast, setJhidToast] = useState('');

  useEffect(() => {
    if (!selectedPatientId) return;
    
    const fetchPatientData = async () => {
      setLoadingPatient(true);
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase!
            .from('patients')
            .select('blood_group, allergies, chronic_conditions, emergency_contact')
            .eq('user_id', selectedPatientId)
            .single();
          if (!error) {
            setPatientDetails({
              bloodGroup: data.blood_group || 'O+',
              allergies: data.allergies || 'None logged',
              conditions: data.chronic_conditions || 'None logged',
              emergencyContact: data.emergency_contact || 'None logged'
            });
          }
        } catch (err) {
          console.error("Failed to load patient profile from Supabase", err);
        } finally {
          setLoadingPatient(false);
        }
      } else {
        setTimeout(() => {
          const mockProfiles: Record<string, any> = {
            'user_patient_001': {
              bloodGroup: 'O+ Positive',
              allergies: 'Peanuts, Penicillin',
              conditions: 'Mild Asthma, Eczema',
              emergencyContact: 'Neha Gangwar (+91 99887 76655)'
            }
          };
          setPatientDetails(mockProfiles[selectedPatientId] || {
            bloodGroup: 'AB+ Positive',
            allergies: 'None reported',
            conditions: 'Hypertension',
            emergencyContact: 'Family Member (+91 98765 43210)'
          });
          setLoadingPatient(false);
        }, 300);
      }
    };

    fetchPatientData();
  }, [selectedPatientId]);

  const handleLaunchConsult = async (apptId: string) => {
    await updateAppointmentStatus(apptId, 'In Consultation');
    navigate(`/doctor/consultation/${apptId}`);
  };

  const handleViewPatientHistory = (patientId: string) => {
    setSelectedPatientId(patientId);
  };

  const filteredPatients = uniquePatients.filter((p) => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Practitioner Portal</span>
          <h1 style={{ fontWeight: 800, marginTop: '2px' }}>Welcome, {user?.name}.</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Specialty: **{activeDoc?.specialty || 'General Practice'}** • Clinic Location: **{activeDoc?.location}**
          </p>
        </div>
        <Button onClick={() => navigate('/doctor/settings')} variant="outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={16} />
          Configure Scheduler
        </Button>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '24px' }}>
        <button
          onClick={() => setActiveTab('Today')}
          style={{
            padding: '12px 6px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'Today' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'Today' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.92rem',
            cursor: 'pointer'
          }}
        >
          Today's Queue ({todayAppts.length})
        </button>
        <button
          onClick={() => setActiveTab('Appointments')}
          style={{
            padding: '12px 6px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'Appointments' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'Appointments' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.92rem',
            cursor: 'pointer'
          }}
        >
          All Appointments ({docAppts.length})
        </button>
        <button
          onClick={() => setActiveTab('Patients')}
          style={{
            padding: '12px 6px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'Patients' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'Patients' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.92rem',
            cursor: 'pointer'
          }}
        >
          My Patients ({uniquePatients.length})
        </button>
        <button
          onClick={() => setActiveTab('Shared Reports')}
          style={{
            padding: '12px 6px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'Shared Reports' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'Shared Reports' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.92rem',
            cursor: 'pointer'
          }}
        >
          Shared AI Reports ({sharedReports.length})
        </button>
        <button
          onClick={() => setActiveTab('Health ID Search')}
          style={{
            padding: '12px 6px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'Health ID Search' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'Health ID Search' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ShieldCheck size={16} />
          Find Patient by Health ID
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }} className="grid-2-mobile">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* JHID SEARCH WORKSTATION */}
          {activeTab === 'Health ID Search' && (
            <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><ShieldCheck size={22} style={{ color: 'var(--primary)' }} /><span style={{ fontWeight: 800 }}>Find Patient by Jivexa Health ID (JHID)</span></div>}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  Enter a patient's permanent <strong>Jivexa Health ID (JHID)</strong> to search for their record. Access to full clinical summaries requires patient consent approval.
                </p>

                {/* Search Input Bar */}
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!healthIdQuery.trim()) return;
                    setJhidError('');
                    setIsSearchingJhid(true);
                    const res = await searchPatientByHealthId(healthIdQuery);
                    setIsSearchingJhid(false);
                    if (res.success && res.patientInfo) {
                      setSearchedPatientInfo(res.patientInfo);
                    } else {
                      setSearchedPatientInfo(null);
                      setJhidError(res.error || 'No patient found matching this JIVEXA Health ID.');
                    }
                  }}
                  style={{ display: 'flex', gap: '12px' }}
                >
                  <Input 
                    placeholder="e.g. JIV-2026-849201"
                    value={healthIdQuery}
                    onChange={(e) => setHealthIdQuery(e.target.value)}
                    style={{ height: '44px', fontSize: '0.95rem', fontWeight: 700, fontFamily: 'monospace' }}
                    icon={<Search size={18} style={{ color: 'var(--primary)' }} />}
                  />
                  <Button type="submit" isLoading={isSearchingJhid} style={{ height: '44px', borderRadius: '12px', padding: '0 24px', fontWeight: 700 }}>
                    Search Health ID
                  </Button>
                </form>

                {jhidError && (
                  <div style={{ backgroundColor: 'var(--error-light)', border: '1px solid var(--error)', borderRadius: '14px', padding: '14px', color: 'var(--error)', fontSize: '0.88rem', fontWeight: 600 }}>
                    ⚠️ {jhidError}
                  </div>
                )}

                {/* Searched Patient Card & Access Request Status */}
                {searchedPatientInfo && (
                  <div style={{ border: '1.5px solid var(--border)', borderRadius: '20px', padding: '24px', backgroundColor: 'white', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, #0f766e 0%, #10b981 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.25rem' }}>
                          {searchedPatientInfo.name.charAt(0)}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{searchedPatientInfo.name}</h3>
                          <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                            JHID: {searchedPatientInfo.healthId}
                          </span>
                        </div>
                      </div>

                      {/* Consent Status Badge */}
                      <span style={{
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        padding: '6px 14px',
                        borderRadius: '20px',
                        backgroundColor: searchedPatientInfo.consentStatus === 'approved' ? 'var(--secondary-light)' : searchedPatientInfo.consentStatus === 'pending' ? 'var(--warning-light)' : '#f1f5f9',
                        color: searchedPatientInfo.consentStatus === 'approved' ? 'var(--secondary)' : searchedPatientInfo.consentStatus === 'pending' ? 'var(--warning)' : 'var(--text-muted)'
                      }}>
                        {searchedPatientInfo.consentStatus === 'approved' ? '✓ Consent Approved' : searchedPatientInfo.consentStatus === 'pending' ? '⏳ Access Request Pending' : '🔒 Consent Required'}
                      </span>
                    </div>

                    {/* If Consent NOT Approved */}
                    {searchedPatientInfo.consentStatus !== 'approved' ? (
                      <div style={{ backgroundColor: '#f8fafc', border: '1px border-dashed var(--border)', borderRadius: '16px', padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <Lock size={28} style={{ color: 'var(--text-light)' }} />
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '440px' }}>
                          Medical summary, allergies, active prescriptions, and AI report history are protected. Request permission from the patient to unlock records.
                        </p>

                        {searchedPatientInfo.consentStatus === 'pending' ? (
                          <Button disabled variant="outline" style={{ borderRadius: '12px' }}>
                            ⏳ Request Pending Patient Approval
                          </Button>
                        ) : (
                          <Button 
                            isLoading={isRequestingConsent}
                            onClick={async () => {
                              setIsRequestingConsent(true);
                              const res = await requestPatientAccess(searchedPatientInfo.healthId);
                              setIsRequestingConsent(false);
                              if (res.success) {
                                setSearchedPatientInfo({ ...searchedPatientInfo, consentStatus: 'pending' });
                                setJhidToast(`Access request sent to ${searchedPatientInfo.name}.`);
                              }
                            }}
                            style={{ borderRadius: '12px', padding: '10px 24px', fontWeight: 700 }}
                          >
                            <Send size={16} />
                            Send Access Request to Patient
                          </Button>
                        )}
                      </div>
                    ) : (
                      /* UNLOCKED CLINICAL SUMMARY */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--secondary)', fontWeight: 800, fontSize: '0.85rem' }}>
                          <CheckCircle2 size={18} />
                          <span>Authorized Health Summary Access Granted</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }} className="grid-3-mobile">
                          <div style={{ border: '1px solid var(--border)', borderRadius: '14px', padding: '14px', backgroundColor: 'var(--surface-raised)' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-light)' }}>Blood Group</span>
                            <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>{searchedPatientInfo.bloodGroup}</p>
                          </div>
                          <div style={{ border: '1px solid var(--border)', borderRadius: '14px', padding: '14px', backgroundColor: 'var(--error-light)' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--error)' }}>⚠️ Allergies</span>
                            <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--error)', marginTop: '2px' }}>{searchedPatientInfo.allergies}</p>
                          </div>
                          <div style={{ border: '1px solid var(--border)', borderRadius: '14px', padding: '14px', backgroundColor: 'var(--primary-light)' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)' }}>🩺 Chronic Conditions</span>
                            <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary)', marginTop: '2px' }}>{searchedPatientInfo.conditions}</p>
                          </div>
                        </div>

                        <div>
                          <h4 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '8px' }}>Active Prescriptions & Medications</h4>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            • Cetirizine 10mg (1 tablet daily after dinner)<br />
                            • Paracetamol 500mg (as needed for fever/pain)
                          </div>
                        </div>

                        <div>
                          <h4 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '8px' }}>Recent Diagnostic Reports & AI Summary</h4>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', backgroundColor: '#f0fdfa', padding: '14px', borderRadius: '12px', border: '1px solid rgba(15,118,110,0.2)' }}>
                            <strong>CBC Blood Test Analysis (Score 88/100):</strong> All hematology parameters optimal. Mild attention suggested for hydration levels.
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </div>
            </Card>
          )}

          {activeTab === 'Today' && (
            <Card title="Today's Consultation Queue">
              {todayAppts.length === 0 ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Stethoscope size={36} style={{ color: 'var(--text-light)', marginBottom: '12px' }} />
                  <p style={{ fontSize: '0.9rem' }}>No patient consultations scheduled for today.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {todayAppts.map((appt) => (
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
                          <span style={{ margin: 'auto' }}>{appt.patientName.charAt(0)}</span>
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{appt.patientName}</h4>
                            <span style={{ 
                              fontSize: '0.65rem', 
                              fontWeight: 700, 
                              padding: '2px 6px', 
                              borderRadius: '4px',
                              backgroundColor: appt.status === 'In Consultation' ? 'var(--warning-light)' : (appt.status === 'Completed' ? 'var(--success-light)' : 'var(--primary-light)'),
                              color: appt.status === 'In Consultation' ? 'var(--warning)' : (appt.status === 'Completed' ? 'var(--primary)' : 'var(--primary)')
                            }}>
                              {appt.status}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Clock size={12} />
                            <span>Slot: {appt.time}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }} className="w-100-mobile justify-between">
                        <button
                          onClick={() => setSelectedAppt(appt)}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            color: 'var(--text-muted)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '8px 12px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Details
                        </button>
                        
                        {appt.status !== 'Completed' && appt.status !== 'Cancelled' && (
                          <Button onClick={() => handleLaunchConsult(appt.id)} style={{ height: '36px', fontSize: '0.82rem' }}>
                            {appt.status === 'In Consultation' ? 'Resume Consultation' : 'Start Consultation'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {activeTab === 'Appointments' && (
            <Card title="Appointment Registers (All Schedules)">
              {docAppts.length === 0 ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Calendar size={36} style={{ color: 'var(--text-light)', marginBottom: '12px' }} />
                  <p style={{ fontSize: '0.9rem' }}>No clinical appointment files registered.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {docAppts.map((appt) => (
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
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--surface-raised)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                          <span style={{ margin: 'auto' }}>{appt.patientName.charAt(0)}</span>
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{appt.patientName}</h4>
                            <span style={{ 
                              fontSize: '0.65rem', 
                              fontWeight: 700, 
                              padding: '2px 6px', 
                              borderRadius: '4px',
                              backgroundColor: appt.status === 'Completed' ? 'var(--success-light)' : (appt.status === 'Cancelled' ? 'var(--error-light)' : 'var(--warning-light)'),
                              color: appt.status === 'Completed' ? 'var(--primary)' : (appt.status === 'Cancelled' ? 'var(--error)' : 'var(--warning)')
                            }}>
                              {appt.status}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Clock size={12} />
                            <span>Slot: {appt.time} • {appt.date}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={() => setSelectedAppt(appt)}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            color: 'var(--text-muted)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '8px 12px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          View Details
                        </button>
                        
                        {(appt.status === 'Upcoming' || appt.status === 'Pending' || appt.status === 'Confirmed' || appt.status === 'In Consultation') && (
                          <Button onClick={() => handleLaunchConsult(appt.id)} style={{ height: '34px', fontSize: '0.8rem' }}>
                            {appt.status === 'In Consultation' ? 'Resume' : 'Start'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {activeTab === 'Patients' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>My Patients Directory</h3>
                <div style={{ width: '260px' }}>
                  <Input 
                    placeholder="Search patients by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search size={16} />}
                  />
                </div>
              </div>

              {filteredPatients.length === 0 ? (
                <div className="card" style={{ padding: '48px 20px', textAlign: 'center', backgroundColor: 'white' }}>
                  <User size={40} style={{ color: 'var(--text-light)', marginBottom: '12px' }} />
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No patients found matching the query.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                  {filteredPatients.map((pat) => (
                    <Card key={pat.id}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                            {pat.name.charAt(0)}
                          </div>
                          <div>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{pat.name}</h4>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>Last Visit: {pat.lastSeen}</span>
                          </div>
                        </div>
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                          <Button onClick={() => handleViewPatientHistory(pat.id)} variant="outline" style={{ height: '32px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Eye size={14} />
                            Medical File
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === 'Shared Reports' && (
            <Card title="Shared AI Medical Reports from Patients">
              {sharedReports.length === 0 ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <FileText size={36} style={{ color: 'var(--text-light)', marginBottom: '12px' }} />
                  <p style={{ fontSize: '0.9rem' }}>No AI medical reports shared by patients yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {sharedReports.map((sr) => (
                    <div 
                      key={sr.id}
                      style={{
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '16px',
                        backgroundColor: 'white'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{sr.patientName} — {sr.reportTitle}</h4>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Shared: {sr.sharedAt} • Review Status: <strong>{sr.reviewStatus}</strong></span>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', backgroundColor: sr.healthScore > 80 ? 'var(--secondary-light)' : 'var(--warning-light)', color: sr.healthScore > 80 ? 'var(--secondary)' : 'var(--warning)' }}>
                          AI Score: {sr.healthScore}/100
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', backgroundColor: 'var(--surface-raised)', padding: '10px 12px', borderRadius: '4px', marginTop: '8px' }}>
                        "{sr.analysisSummary}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <Card title="Clinic Statistics">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-light)' }}>Today's Queue</span>
                <span style={{ fontWeight: 700 }}>{todayAppts.length} Patients</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-light)' }}>Total Completed</span>
                <span style={{ fontWeight: 700 }}>{docAppts.filter(a => a.status === 'Completed').length} Consults</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-light)' }}>Session Hours</span>
                <span style={{ fontWeight: 600 }}>{activeDoc?.availability.split(' (')[0]}</span>
              </div>
            </div>
          </Card>

          <Card title="Patient Intake Guidelines">
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Review patient allergy metrics and uploaded lab scans before beginning medication schedules. Employs electronic prescription records system to prevent medication errors.
            </p>
          </Card>

        </div>

      </div>

      {selectedAppt && (
        <Modal isOpen={!!selectedAppt} onClose={() => setSelectedAppt(null)} title="Appointment Details">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <strong>Patient Name:</strong>
              <span>{selectedAppt.patientName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <strong>Scheduled Date / Time:</strong>
              <span>{selectedAppt.date} at {selectedAppt.time}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <strong>Appointment Status:</strong>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{selectedAppt.status}</span>
            </div>
            {selectedAppt.notes && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <strong>Patient Intake Notes:</strong>
                <p style={{ padding: '8px 12px', backgroundColor: 'var(--surface-raised)', borderRadius: '4px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  "{selectedAppt.notes}"
                </p>
              </div>
            )}
            {selectedAppt.consultationSummary && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <strong>Consultation Summary:</strong>
                <p style={{ padding: '8px 12px', backgroundColor: 'var(--primary-light)', borderRadius: '4px', fontSize: '0.82rem', color: 'var(--primary)' }}>
                  "{selectedAppt.consultationSummary}"
                </p>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <Button onClick={() => setSelectedAppt(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

      {selectedPatientId && (
        <Modal 
          isOpen={!!selectedPatientId} 
          onClose={() => { setSelectedPatientId(null); setPatientDetails(null); }} 
          title="Clinical Medical File"
        >
          {loadingPatient ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
              Loading patient clinical file records...
            </div>
          ) : patientDetails ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '550px', overflowY: 'auto' }}>
              
              <div style={{ display: 'flex', gap: '12px', backgroundColor: 'var(--primary-light)', padding: '14px', borderRadius: 'var(--radius-sm)', color: 'var(--primary)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.25rem' }}>
                  {uniquePatients.find(p => p.id === selectedPatientId)?.name.charAt(0) || 'P'}
                </div>
                <div>
                  <h4 style={{ fontWeight: 700 }}>{uniquePatients.find(p => p.id === selectedPatientId)?.name}</h4>
                  <span style={{ fontSize: '0.78rem' }}>Blood Group: <strong>{patientDetails.bloodGroup}</strong> • Emergency: {patientDetails.emergencyContact}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="grid-2-mobile">
                <div style={{ border: '1px solid var(--border)', padding: '12px', borderRadius: '4px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--error)' }}>⚠️ Allergies</span>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '4px' }}>{patientDetails.allergies}</p>
                </div>
                <div style={{ border: '1px solid var(--border)', padding: '12px', borderRadius: '4px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)' }}>🩺 Chronic Conditions</span>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '4px' }}>{patientDetails.conditions}</p>
                </div>
              </div>

              <div>
                <h5 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>Consultation History</h5>
                {docAppts.filter(a => a.patientId === selectedPatientId).length === 0 ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>No past history logged with this doctor.</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {docAppts.filter(a => a.patientId === selectedPatientId).map((appt) => (
                      <div key={appt.id} style={{ borderBottom: '1px dotted var(--border)', paddingBottom: '8px', fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                          <span>📅 {appt.date} ({appt.time})</span>
                          <span style={{ color: 'var(--primary)' }}>{appt.status}</span>
                        </div>
                        {appt.consultationSummary && (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '3px' }}>
                            Summary: "{appt.consultationSummary}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h5 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>Issued Prescriptions</h5>
                {prescriptions.filter(pr => pr.patientId === selectedPatientId).length === 0 ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>No active prescriptions issued yet.</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {prescriptions.filter(pr => pr.patientId === selectedPatientId).map((pr) => (
                      <div key={pr.id} style={{ border: '1px solid var(--border)', padding: '10px', borderRadius: '4px', backgroundColor: 'var(--surface-raised)', fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: '6px' }}>
                          <span>Prescription #{pr.id.slice(0, 8)}</span>
                          <span style={{ color: 'var(--secondary)' }}>{pr.status || 'Active'}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {pr.medications.map((m, idx) => (
                            <div key={idx} style={{ fontSize: '0.78rem' }}>
                              💊 <strong>{m.name}</strong> • {m.dosage} ({m.frequency}) • {m.duration}
                            </div>
                          ))}
                        </div>
                        {pr.followUpDate && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, marginTop: '8px' }}>
                            📅 Follow-up: {pr.followUpDate}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h5 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>Shared Lab Reports / Documents</h5>
                {healthRecords.filter(r => r.patientId === selectedPatientId).length === 0 ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>No documents uploaded by the patient.</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {healthRecords.filter(r => r.patientId === selectedPatientId).map((rec) => (
                      <div key={rec.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '4px', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={16} style={{ color: 'var(--primary)' }} />
                          <span>{rec.name} ({rec.fileSize})</span>
                        </div>
                        <a href={rec.fileUrl} style={{ textDecoration: 'none', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <FileDown size={14} />
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Could not load file.</div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
            <Button onClick={() => { setSelectedPatientId(null); setPatientDetails(null); }}>Close File</Button>
          </div>
        </Modal>
      )}

      {jhidToast && <Toast message={jhidToast} onClose={() => setJhidToast('')} />}

    </div>
  );
};
