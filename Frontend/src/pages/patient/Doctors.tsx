import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHealthData, Doctor } from '../../context/HealthDataContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Toast } from '../../components/ui/Toast';
import { Search, Star, MapPin, Calendar, Clock, Video, User, CheckCircle2 } from 'lucide-react';

export const DoctorDiscovery: React.FC = () => {
  const { doctors, bookAppointment } = useHealthData();
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('All');
  const [consultType, setConsultType] = useState('All');

  // Booking Modal State
  const [selectedDoc, setSelectedDoc] = useState<Doctor | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({ date: '', time: '10:00 AM', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase()) || 
                          doc.specialty.toLowerCase().includes(search.toLowerCase()) ||
                          doc.location.toLowerCase().includes(search.toLowerCase());
    const matchesSpecialty = specialty === 'All' || doc.specialty === specialty;
    const matchesType = consultType === 'All' || 
                        doc.consultationType === consultType || 
                        doc.consultationType === 'Both';
    return matchesSearch && matchesSpecialty && matchesType;
  });

  const specialties = ['All', 'Cardiologist', 'Pediatrician', 'Dermatologist', 'General Physician'];

  const handleOpenBooking = (doc: Doctor) => {
    setSelectedDoc(doc);
    setIsBookingOpen(true);
    setBookingForm({
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time: '10:00 AM',
      notes: ''
    });
    setErrorMsg('');
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;
    if (!bookingForm.date || !bookingForm.time) {
      setErrorMsg('Please select appointment date and time.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await bookAppointment(
        selectedDoc.id,
        bookingForm.date,
        bookingForm.time,
        bookingForm.notes
      );

      if (res.success) {
        setIsBookingOpen(false);
        setToastMsg(`Appointment scheduled successfully with ${selectedDoc.name}!`);
      } else {
        setErrorMsg('Booking failed. Please try again.');
      }
    } catch (e) {
      setErrorMsg('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
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
      <div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Practitioners</span>
        <h1 style={{ fontWeight: 800, marginTop: '2px' }}>Find a Healthcare Practitioner</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          Schedule online video calls or physical consultations.
        </p>
      </div>

      <div className="card grid-3-mobile" style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px' }}>
        <div style={{ position: 'relative' }}>
          <Input 
            placeholder="Search doctors by name, specialty, or clinic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ height: '40px', fontSize: '0.85rem', paddingLeft: '32px' }}
            icon={<Search size={14} style={{ color: 'var(--text-light)' }} />}
          />
        </div>

        <Select 
          options={specialties.map((s) => ({ value: s, label: s === 'All' ? 'All Specialties' : s }))}
          value={specialty}
          onChange={(val) => setSpecialty(val)}
          style={{ height: '40px' }}
        />

        <Select 
          options={[
            { value: 'All', label: 'All Formats' },
            { value: 'Video', label: 'Video Call only' },
            { value: 'In-Person', label: 'Clinic Visit only' }
          ]}
          value={consultType}
          onChange={(val) => setConsultType(val)}
          style={{ height: '40px' }}
        />
      </div>

      {filteredDoctors.length === 0 ? (
        <div className="card" style={{ padding: '48px 20px', textAlign: 'center', backgroundColor: 'white' }}>
          <User size={40} style={{ color: 'var(--text-light)', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No practitioners found</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            We couldn't find any doctor matching your search terms. Try adjusting filters.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="grid-2-mobile">
          {filteredDoctors.map((doc) => (
            <Card 
              key={doc.id}
              title={
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '1.2rem' }}>
                    <span style={{ margin: 'auto' }}>{doc.name.charAt(4)}</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{doc.name}</h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>{doc.specialty}</p>
                  </div>
                </div>
              }
              headerAction={
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent)' }}>
                  <Star size={14} fill="var(--accent)" />
                  <span>{doc.rating}</span>
                </div>
              }
              hoverable
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                <p style={{ color: 'var(--text-muted)', lineHeight: '1.5', minHeight: '44px' }}>
                  {doc.about}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border)', paddingTop: '12px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={14} style={{ color: 'var(--text-light)' }} />
                    <span>{doc.location}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={14} style={{ color: 'var(--text-light)' }} />
                    <span>{doc.availability}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Video size={14} style={{ color: 'var(--text-light)' }} />
                    <span>Consultation: **{doc.consultationType}** • Fee: **₹{doc.fee}**</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <Button onClick={() => handleOpenBooking(doc)}>
                    Book Consultation
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} title={`Book Consultation: ${selectedDoc?.name}`}>
        {selectedDoc && (
          <form onSubmit={handleConfirmBooking} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {errorMsg && (
              <div style={{ backgroundColor: 'var(--error-light)', border: '1px solid var(--error)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', color: 'var(--error)', fontSize: '0.82rem', fontWeight: 500 }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: 'var(--surface-raised)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--secondary)' }} />
              <div style={{ fontSize: '0.8rem' }}>
                Consultation Specialty: **{selectedDoc.specialty}** <br />
                Standard Session Fee: **₹{selectedDoc.fee}** (to be paid online or at clinic)
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="grid-2-mobile">
              <Input 
                label="Appointment Date" 
                type="date"
                value={bookingForm.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                required
                disabled={isSubmitting}
              />
              
              <Select 
                label="Available Session Slot"
                options={timeSlots}
                value={bookingForm.time}
                onChange={(val) => setBookingForm({ ...bookingForm, time: val })}
                disabled={isSubmitting}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 600 }}>Reason for Visit (Describe symptoms briefly)</label>
              <textarea 
                rows={3}
                placeholder="e.g. Seeking second opinion on ECG readings, prescription refills."
                value={bookingForm.notes}
                onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                disabled={isSubmitting}
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.92rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <Button type="button" variant="outline" onClick={() => setIsBookingOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Confirm Appointment
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
