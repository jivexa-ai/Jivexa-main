import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useHealthData } from '../../context/HealthDataContext';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import { Calendar, Clock, DollarSign, MapPin, ArrowLeft } from 'lucide-react';

export const DoctorSettings: React.FC = () => {
  const { user } = useAuth();
  const { doctors } = useHealthData();
  const navigate = useNavigate();

  const activeDoc = doctors.find((d) => d.id === user?.id) || doctors.find((d) => d.id === '00000000-0000-0000-0000-000000000001') || doctors.find((d) => d.id === 'doc_1') || doctors[0];

  const [form, setForm] = useState({
    fee: activeDoc?.fee || 800,
    location: activeDoc?.location || 'Indiranagar, Bengaluru',
    availability: activeDoc?.availability || 'Mon, Wed, Fri (10:00 AM - 4:00 PM)',
    days: {
      mon: true, tue: false, wed: true, thu: false, fri: true, sat: false
    }
  });

  const [toastMsg, setToastMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSaving(false);
    setToastMsg('Consultation scheduler preferences saved successfully.');
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
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
          <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Practitioner Settings</span>
          <h1 style={{ fontWeight: 800, marginTop: '2px' }}>Consultation & Schedule</h1>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={18} /><span>Weekly Session Slots</span></div>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 600 }}>Active Practice Days</label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
                {Object.keys(form.days).map((day) => (
                  <label 
                    key={day} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      padding: '8px 14px', 
                      border: '1px solid var(--border)', 
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'white',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={form.days[day as keyof typeof form.days]} 
                      onChange={() => setForm({
                        ...form,
                        days: { ...form.days, [day]: !form.days[day as keyof typeof form.days] }
                      })}
                    />
                    <span style={{ textTransform: 'capitalize' }}>{day}</span>
                  </label>
                ))}
              </div>
            </div>

            <Input 
              label="Availability Text (Displayed on Search Directory)"
              value={form.availability}
              onChange={(e) => setForm({ ...form, availability: e.target.value })}
              required
            />
          </div>
        </Card>

        <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><DollarSign size={18} /><span>Consultation Parameters</span></div>}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }} className="grid-2-mobile">
            <Input 
              label="Consultation Fee (₹)"
              type="number"
              value={form.fee}
              onChange={(e) => setForm({ ...form, fee: Number(e.target.value) })}
              required
            />
            <Input 
              label="Clinic Physical Location Address"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              icon={<MapPin size={16} />}
              required
            />
          </div>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button type="button" variant="outline" onClick={() => navigate('/doctor/dashboard')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Save Availability Changes
          </Button>
        </div>

      </form>

      {toastMsg && (
        <Toast message={toastMsg} onClose={() => setToastMsg('')} />
      )}

    </div>
  );
};
