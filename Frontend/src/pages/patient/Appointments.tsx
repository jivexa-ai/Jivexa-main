import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHealthData, Appointment } from '../../context/HealthDataContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Toast } from '../../components/ui/Toast';
import { Calendar, Clock, Video, User, AlertCircle, RefreshCw, XCircle, CheckCircle2 } from 'lucide-react';

export const PatientAppointments: React.FC = () => {
  const { user } = useAuth();
  const { appointments, rescheduleAppointment, cancelAppointment } = useHealthData();
  
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Completed' | 'Cancelled'>('Upcoming');
  
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [isReschedOpen, setIsReschedOpen] = useState(false);
  const [reschedForm, setReschedForm] = useState({ date: '', time: '10:00 AM' });
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [toastMsg, setToastMsg] = useState('');

  const patientAppts = appointments.filter((a) => a.patientId === user?.id);
  const filtered = patientAppts.filter((a) => {
    if (activeTab === 'Upcoming') return ['Upcoming', 'Confirmed', 'In Consultation', 'Pending'].includes(a.status);
    if (activeTab === 'Completed') return a.status === 'Completed';
    return a.status === 'Cancelled';
  });

  const handleCancelClick = (id: string) => {
    if (window.confirm('Are you sure you want to cancel this medical consultation?')) {
      cancelAppointment(id);
      setToastMsg('Appointment cancelled successfully.');
    }
  };

  const handleOpenReschedule = (appt: Appointment) => {
    setSelectedAppt(appt);
    setIsReschedOpen(true);
    setReschedForm({ date: appt.date, time: appt.time });
  };

  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;

    setIsUpdating(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    rescheduleAppointment(selectedAppt.id, reschedForm.date, reschedForm.time);
    setIsReschedOpen(false);
    setIsUpdating(false);
    setToastMsg(`Appointment rescheduled to ${reschedForm.date} at ${reschedForm.time}.`);
  };

  const timeSlots = [
    { value: '09:00 AM', label: '09:00 AM' },
    { value: '10:00 AM', label: '10:00 AM' },
    { value: '10:30 AM', label: '10:30 AM' },
    { value: '11:00 AM', label: '11:00 AM' },
    { value: '02:00 PM', label: '02:00 PM' },
    { value: '03:30 PM', label: '03:30 PM' },
    { value: '05:00 PM', label: '05:00 PM' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Consultations</span>
          <h1 style={{ fontWeight: 800, marginTop: '2px' }}>My Appointments</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Track and coordinate consultations with medical professionals.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '24px' }}>
        {(['Upcoming', 'Completed', 'Cancelled'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 6px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.92rem',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            {tab} {tab === 'Upcoming' ? 'Consults' : tab === 'Completed' ? 'History' : 'Bookings'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: 'white' }}>
          <Calendar size={40} style={{ color: 'var(--text-light)', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No appointments found</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            There are no appointments listed under "{activeTab}".
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {filtered.map((appt) => (
            <Card 
              key={appt.id}
              title={
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                    <span style={{ margin: 'auto' }}>{appt.doctorName.charAt(4)}</span>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 700 }}>{appt.doctorName}</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{appt.doctorSpecialty}</p>
                  </div>
                </div>
              }
              headerAction={
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '4px',
                  backgroundColor: 
                    (appt.status === 'Upcoming' || appt.status === 'Confirmed') ? 'var(--primary-light)' : 
                    appt.status === 'In Consultation' ? 'var(--warning-light)' :
                    appt.status === 'Completed' ? 'var(--secondary-light)' : 'var(--error-light)',
                  color: 
                    (appt.status === 'Upcoming' || appt.status === 'Confirmed') ? 'var(--primary)' : 
                    appt.status === 'In Consultation' ? 'var(--warning)' :
                    appt.status === 'Completed' ? 'var(--secondary)' : 'var(--error)',
                }}>
                  {appt.status}
                </span>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }} className="grid-3-mobile">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={15} style={{ color: 'var(--text-light)' }} />
                    <span>Scheduled: **{appt.date}**</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={15} style={{ color: 'var(--text-light)' }} />
                    <span>Time Slot: **{appt.time}**</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Video size={15} style={{ color: 'var(--text-light)' }} />
                    <span>Consultation: **Video Call**</span>
                  </div>
                </div>

                {appt.notes && (
                  <div style={{ padding: '12px 16px', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>Patient Symptoms Note:</span>
                    "{appt.notes}"
                  </div>
                )}

                {appt.status === 'Completed' && appt.consultationSummary && (
                  <div style={{ padding: '14px 18px', backgroundColor: 'var(--secondary-light)', borderLeft: '3px solid var(--secondary)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', fontSize: '0.82rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--secondary)', display: 'block', marginBottom: '4px' }}>Clinical Consultation Summary:</span>
                    {appt.consultationSummary}
                  </div>
                )}

                {['Upcoming', 'Pending', 'Confirmed'].includes(appt.status) && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <button 
                      onClick={() => handleCancelClick(appt.id)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        backgroundColor: 'transparent',
                        color: 'var(--error)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <XCircle size={14} />
                      Cancel Consult
                    </button>
                    <button 
                      onClick={() => handleOpenReschedule(appt)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        backgroundColor: 'transparent',
                        color: 'var(--primary)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <RefreshCw size={14} />
                      Reschedule Slot
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isReschedOpen} onClose={() => setIsReschedOpen(false)} title={`Reschedule Appointment: ${selectedAppt?.doctorName}`}>
        {selectedAppt && (
          <form onSubmit={handleConfirmReschedule} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="grid-2-mobile">
              <Input 
                label="New Date" 
                type="date"
                value={reschedForm.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setReschedForm({ ...reschedForm, date: e.target.value })}
                required
                disabled={isUpdating}
              />
              <Select 
                label="New Session Slot"
                options={timeSlots}
                value={reschedForm.time}
                onChange={(val) => setReschedForm({ ...reschedForm, time: val })}
                disabled={isUpdating}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <Button type="button" variant="outline" onClick={() => setIsReschedOpen(false)} disabled={isUpdating}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isUpdating}>
                Save Rescheduled Time
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {toastMsg && (
        <Toast message={toastMsg} onClose={() => setToastMsg('')} />
      )}
    </div>
  );
};
