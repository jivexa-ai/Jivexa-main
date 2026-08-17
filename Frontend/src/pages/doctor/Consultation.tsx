import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHealthData, Medication } from '../../context/HealthDataContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { 
  Stethoscope, User, Heart, AlertTriangle, 
  Plus, Trash2, Clipboard, FileText, ArrowLeft, ShieldCheck, Search
} from 'lucide-react';

const PRODUCT_SUGGESTIONS = [
  'Paracetamol 500mg',
  'Amoxicillin 250mg',
  'Cetirizine 10mg',
  'Metformin 500mg',
  'Atorvastatin 10mg'
];

export const DoctorConsultation: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { appointments, healthRecords, completeConsultation } = useHealthData();
  const navigate = useNavigate();

  const appt = appointments.find((a) => a.id === appointmentId);
  const patientId = appt?.patientId || '';

  const [summary, setSummary] = useState('');
  const [meds, setMeds] = useState<Medication[]>([
    { name: '', dosage: '1 tablet', frequency: 'Once daily', duration: '5 Days', instructions: '' }
  ]);
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [loadingPatient, setLoadingPatient] = useState(false);

  const [focusedMedIdx, setFocusedMedIdx] = useState<number | null>(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    if (!patientId) return;
    setLoadingPatient(true);

    const fetchPatientDetails = async () => {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase!
            .from('patients')
            .select('blood_group, allergies, chronic_conditions, emergency_contact')
            .eq('user_id', patientId)
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
          console.error("Consultation file lookup error", err);
        } finally {
          setLoadingPatient(false);
        }
      } else {
        setTimeout(() => {
          setPatientDetails({
            bloodGroup: 'O+ Positive',
            allergies: 'Peanuts, Penicillin',
            conditions: 'Mild Asthma, Eczema',
            emergencyContact: 'Neha Gangwar (+91 99887 76655)'
          });
          setLoadingPatient(false);
        }, 200);
      }
    };

    fetchPatientDetails();
  }, [patientId]);

  const sharedDocs = healthRecords.filter((r) => r.patientId === patientId);

  const handleAddMedicine = () => {
    setMeds([...meds, { name: '', dosage: '1 tablet', frequency: 'Once daily', duration: '5 Days', instructions: '' }]);
  };

  const handleRemoveMedicine = (idx: number) => {
    const updated = meds.filter((_, i) => i !== idx);
    setMeds(updated);
  };

  const handleMedChange = (idx: number, field: keyof Medication, val: string) => {
    const updated = [...meds];
    updated[idx] = { ...updated[idx], [field]: val };
    setMeds(updated);
  };

  const handleCompleteSubmit = async (e: React.FormEvent, status: 'Draft' | 'Issued' = 'Issued') => {
    e.preventDefault();
    if (!appt) return;
    
    if (!summary.trim()) {
      setErrorMsg('Please enter a clinical consultation summary.');
      window.scrollTo(0, 0);
      return;
    }

    const validMeds = meds.filter((m) => m.name.trim() !== '');

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      await completeConsultation(
        appt.id, 
        summary, 
        validMeds, 
        notes, 
        followUpDate || undefined, 
        status
      );

      setToastMsg(
        status === 'Draft' 
          ? 'Consultation progress saved as Draft.' 
          : 'Consultation completed and digital prescription issued.'
      );
      
      setTimeout(() => {
        navigate('/doctor/dashboard');
      }, 1200);

    } catch (e) {
      setErrorMsg('An error occurred during submission.');
      setIsSubmitting(false);
    }
  };

  if (!appt) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h3>Appointment record not found.</h3>
        <Button onClick={() => navigate('/doctor/dashboard')} style={{ marginTop: '12px' }}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg('')} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={() => navigate('/doctor/dashboard')}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            padding: '8px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)'
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Consultation Workstation</span>
          <h1 style={{ fontWeight: 800, marginTop: '2px' }}>Consultation: {appt.patientName}</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }} className="grid-2-mobile">
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <Card title="Patient Clinical Details">
            {loadingPatient ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', padding: '12px 0' }}>Loading file details...</div>
            ) : patientDetails ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-light)' }}>Blood Group</span>
                  <span style={{ fontWeight: 600 }}>{patientDetails.bloodGroup}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-light)' }}>Allergies Log</span>
                  <span style={{ fontWeight: 600, color: 'var(--error)' }}>{patientDetails.allergies}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-light)' }}>Chronic Conditions</span>
                  <span style={{ fontWeight: 600 }}>{patientDetails.conditions}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ color: 'var(--text-light)' }}>Emergency Contact</span>
                  <span style={{ fontWeight: 600 }}>{patientDetails.emergencyContact}</span>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', padding: '12px 0' }}>Allergies and profiles unavailable.</div>
            )}
          </Card>

          <Card title="Shared Health Records">
            {sharedDocs.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', textAlign: 'center', padding: '12px 0' }}>
                No records shared by patient.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sharedDocs.map((doc) => (
                  <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', borderBottom: '1px solid var(--surface-raised)', paddingBottom: '6px' }}>
                    <FileText size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <span style={{ display: 'block', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{doc.name}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>{doc.date} • {doc.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <form style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {errorMsg && (
              <div style={{ backgroundColor: 'var(--error-light)', border: '1px solid var(--error)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', color: 'var(--error)', fontSize: '0.82rem', fontWeight: 500 }}>
                {errorMsg}
              </div>
            )}

            <Card title="Consultation Summary">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 600 }}>Clinical Assessment Notes</label>
                <textarea 
                  rows={4}
                  placeholder="Record summary of diagnosis, physical examinations, and patient advice."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  disabled={isSubmitting}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    width: '100%'
                  }}
                  required
                />
              </div>
            </Card>

            <Card 
              title="Prescription Composer"
              headerAction={
                <Button type="button" variant="outline" onClick={handleAddMedicine} style={{ height: '32px', fontSize: '0.78rem' }}>
                  <Plus size={14} />
                  Add Medicine
                </Button>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {meds.map((med, idx) => (
                  <div 
                    key={idx}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '16px',
                      backgroundColor: 'var(--surface-raised)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      position: 'relative'
                    }}
                  >
                    {meds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicine(idx)}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--error)',
                          cursor: 'pointer',
                          zIndex: 10
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', position: 'relative' }} className="grid-2-mobile">
                      
                      <div style={{ position: 'relative' }}>
                        <Input 
                          label="Medicine Name"
                          placeholder="e.g. Paracetamol"
                          value={med.name}
                          onFocus={() => setFocusedMedIdx(idx)}
                          onBlur={() => setTimeout(() => setFocusedMedIdx(null), 200)}
                          onChange={(e) => handleMedChange(idx, 'name', e.target.value)}
                          required
                          disabled={isSubmitting}
                        />
                        {focusedMedIdx === idx && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            backgroundColor: 'white',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            boxShadow: 'var(--shadow-md)',
                            zIndex: 100,
                            maxHeight: '180px',
                            overflowY: 'auto',
                            marginTop: '2px'
                          }}>
                            {PRODUCT_SUGGESTIONS.filter(name => 
                              name.toLowerCase().includes(med.name.toLowerCase())
                            ).map((name) => (
                              <div
                                key={name}
                                onMouseDown={() => handleMedChange(idx, 'name', name)}
                                style={{
                                  padding: '10px 12px',
                                  fontSize: '0.82rem',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid var(--surface-raised)'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-light)'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                              >
                                💊 {name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <Input 
                        label="Dosage"
                        placeholder="e.g. 1 tablet"
                        value={med.dosage}
                        onChange={(e) => handleMedChange(idx, 'dosage', e.target.value)}
                        disabled={isSubmitting}
                      />
                      <Input 
                        label="Frequency"
                        placeholder="e.g. Once daily"
                        value={med.frequency}
                        onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                        disabled={isSubmitting}
                      />
                      <Input 
                        label="Duration"
                        placeholder="e.g. 5 Days"
                        value={med.duration}
                        onChange={(e) => handleMedChange(idx, 'duration', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>

                    <Input 
                      label="Special Instructions (Optional)"
                      placeholder="e.g. Take after meals"
                      value={med.instructions}
                      onChange={(e) => handleMedChange(idx, 'instructions', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                ))}

                <Input 
                  label="Follow-Up Appointment Date (Optional)"
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  disabled={isSubmitting}
                />

                <Input 
                  label="Prescription Footnotes (General Advice)"
                  placeholder="e.g. Avoid cold drinks, get rest"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </Card>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
              <Button type="button" variant="outline" onClick={() => navigate('/doctor/dashboard')} disabled={isSubmitting}>
                Discard
              </Button>
              <Button 
                type="button" 
                variant="danger" 
                onClick={(e) => handleCompleteSubmit(e, 'Draft')} 
                disabled={isSubmitting}
                style={{ backgroundColor: 'var(--surface-raised)', color: 'var(--text-main)', border: '1px solid var(--border)' }}
              >
                Save as Draft
              </Button>
              <Button 
                type="button" 
                onClick={(e) => handleCompleteSubmit(e, 'Issued')} 
                isLoading={isSubmitting}
              >
                Issue Prescription
              </Button>
            </div>

          </form>

        </div>

      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: 'white', padding: '16px 20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
        <ShieldCheck size={20} style={{ color: 'var(--secondary)' }} />
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          **Prescription Integrity Standard:** Completing this session signs the prescription digitally with your clinical credentials and dispatches the record to the patient and database securely.
        </span>
      </div>

    </div>
  );
};
