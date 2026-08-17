import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHealthData } from '../../context/HealthDataContext';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Toast } from '../../components/ui/Toast';
import { Shield, User, Heart, AlertCircle } from 'lucide-react';

export const PatientProfileEdit: React.FC = () => {
  const { user, updateOnboarding } = useAuth();
  const { patientProfile, updatePatientProfile } = useHealthData();
  
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    dob: user?.dob || '',
    bloodGroup: patientProfile?.bloodGroup || 'O+ Positive',
    allergies: patientProfile?.allergies || '',
    conditions: patientProfile?.conditions || '',
    emergencyContact: patientProfile?.emergencyContact || ''
  });

  const [toastMessage, setToastMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.dob) {
      setError('Please fill in all personal details.');
      return;
    }

    setError('');
    setIsSaving(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      updatePatientProfile({
        bloodGroup: form.bloodGroup,
        allergies: form.allergies,
        conditions: form.conditions,
        emergencyContact: form.emergencyContact
      });

      await updateOnboarding({
        name: form.name,
        phone: form.phone,
        dob: form.dob
      });

      setToastMessage('Profile settings updated successfully.');
    } catch (e) {
      setError('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const bloodGroupOptions = [
    { value: 'A+ Positive', label: 'A+ Positive' },
    { value: 'A- Negative', label: 'A- Negative' },
    { value: 'B+ Positive', label: 'B+ Positive' },
    { value: 'B- Negative', label: 'B- Negative' },
    { value: 'AB+ Positive', label: 'AB+ Positive' },
    { value: 'AB- Negative', label: 'AB- Negative' },
    { value: 'O+ Positive', label: 'O+ Positive' },
    { value: 'O- Negative', label: 'O- Negative' }
  ];

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Health Profile</span>
        <h1 style={{ fontWeight: 800, marginTop: '2px' }}>Manage My Profile</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          Consolidate your clinical preferences and emergency contact logs.
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {error && (
          <div style={{ backgroundColor: 'var(--error-light)', border: '1px solid var(--error)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', color: 'var(--error)', fontSize: '0.82rem', fontWeight: 500 }}>
            {error}
          </div>
        )}

        <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><User size={18} /><span>Personal Information</span></div>}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="grid-2-mobile">
            <Input 
              label="Full Name" 
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input 
              label="Contact Phone" 
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
            <Input 
              label="Date of Birth" 
              type="date"
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
              required
            />
            <Input 
              label="Primary Email" 
              type="email"
              value={user?.email || ''}
              disabled
              helperText="Email changes require security verification."
            />
          </div>
        </Card>

        <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Heart size={18} /><span>Health Information</span></div>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="grid-2-mobile">
              <Select 
                label="Blood Group"
                options={bloodGroupOptions}
                value={form.bloodGroup}
                onChange={(val) => setForm({ ...form, bloodGroup: val })}
              />
              <Input 
                label="Emergency Contact Log" 
                placeholder="Name (+91 Phone Number)" 
                value={form.emergencyContact}
                onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
              />
            </div>
            
            <Input 
              label="Known Active Allergies" 
              placeholder="e.g. Peanuts, Penicillin (leave blank if none)" 
              value={form.allergies}
              onChange={(e) => setForm({ ...form, allergies: e.target.value })}
              helperText="Will be highlighted on doctor consult queues."
            />
            
            <Input 
              label="Chronic Medical Conditions" 
              placeholder="e.g. Mild Asthma, Hypertension" 
              value={form.conditions}
              onChange={(e) => setForm({ ...form, conditions: e.target.value })}
              helperText="Helps practitioners suggest safer pharmacological dosage options."
            />
          </div>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Save Profile Updates
          </Button>
        </div>

      </form>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: 'var(--surface)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
        <Shield size={20} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          **HIPAA Data Standard:** JIVEXA does not share medical profiles with third-party advertisers. Access permissions are limited to verified clinical practitioners and pharmacy logs.
        </span>
      </div>

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage('')} />
      )}

    </div>
  );
};
