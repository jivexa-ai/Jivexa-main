import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHealthData } from '../../context/HealthDataContext';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Toast } from '../../components/ui/Toast';
import { 
  Shield, User, Heart, AlertCircle, Activity, 
  Phone, Mail, Calendar, Droplets, Stethoscope, 
  FileText, ShieldCheck, CheckCircle2, Award, Scale
} from 'lucide-react';

export const PatientProfileEdit: React.FC = () => {
  const { user, updateOnboarding } = useAuth();
  const { patientProfile, updatePatientProfile } = useHealthData();
  
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    dob: user?.dob || '',
    gender: 'Male',
    height: '175',
    weight: '68',
    bloodGroup: patientProfile?.bloodGroup || 'O+ Positive',
    allergies: patientProfile?.allergies || 'Peanuts, Penicillin (mild)',
    conditions: patientProfile?.conditions || 'Mild Asthma',
    emergencyName: 'Ramesh Gangwar',
    emergencyRelation: 'Father',
    emergencyContact: patientProfile?.emergencyContact || '+91 98765 43210',
    insuranceProvider: 'Star Health Allied Insurance',
    policyNumber: 'SH-99482710-X',
    organDonor: 'Yes',
    primaryDoctor: 'Dr. Sarah Jenkins (Cardiology)'
  });

  const [toastMessage, setToastMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Auto-calculate BMI
  const heightM = (parseFloat(form.height) || 170) / 100;
  const weightKg = parseFloat(form.weight) || 70;
  const bmiVal = (weightKg / (heightM * heightM)).toFixed(1);
  const bmiNum = parseFloat(bmiVal);
  const bmiCategory = bmiNum < 18.5 ? 'Underweight' : bmiNum < 24.9 ? 'Healthy / Normal' : bmiNum < 29.9 ? 'Overweight' : 'Obese';
  const bmiBadgeColor = bmiNum >= 18.5 && bmiNum <= 24.9 ? '#10b981' : '#f59e0b';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.dob) {
      setError('Please fill in all required personal details.');
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
        emergencyContact: `${form.emergencyName} (${form.emergencyRelation}): ${form.emergencyContact}`
      });

      await updateOnboarding({
        name: form.name,
        phone: form.phone,
        dob: form.dob
      });

      setToastMessage('🎉 Profile updated successfully! All medical preferences saved.');
    } catch (e) {
      setError('Failed to save profile settings.');
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

  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other / Prefer not to say' }
  ];

  const organDonorOptions = [
    { value: 'Yes', label: 'Registered Organ Donor' },
    { value: 'No', label: 'Not Registered' }
  ];

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* BRAND HEADER BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #10b981 100%)',
        borderRadius: '24px',
        padding: '32px 36px',
        color: 'white',
        boxShadow: '0 12px 30px -8px rgba(15, 118, 110, 0.4)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            border: '3px solid rgba(255, 255, 255, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            fontWeight: 900,
            color: 'white',
            backdropFilter: 'blur(10px)'
          }}>
            {form.name ? form.name.charAt(0).toUpperCase() : 'P'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white' }}>{form.name || 'Patient Profile'}</h1>
              <span style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)', fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: '12px', color: 'white' }}>Verified Patient</span>
            </div>
            <p style={{ opacity: 0.9, fontSize: '0.88rem', marginTop: '4px' }}>
              JIVEXA Patient ID: JVX-889420 • Connected to Secure Health Ecosystem
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: '10px 16px', borderRadius: '16px', backdropFilter: 'blur(8px)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', opacity: 0.8, fontWeight: 700 }}>Blood Group</span>
            <div style={{ fontSize: '1rem', fontWeight: 800 }}>{form.bloodGroup.split(' ')[0]}</div>
          </div>

          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: '10px 16px', borderRadius: '16px', backdropFilter: 'blur(8px)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', opacity: 0.8, fontWeight: 700 }}>Calculated BMI</span>
            <div style={{ fontSize: '1rem', fontWeight: 800 }}>{bmiVal}</div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {error && (
          <div style={{ backgroundColor: 'var(--error-light)', border: '1.5px solid var(--error)', padding: '14px 18px', borderRadius: '16px', color: 'var(--error)', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* 1. PERSONAL INFORMATION CARD */}
        <Card style={{ borderRadius: '24px', padding: '28px' }} title={<div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)' }}><User size={22} /><span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-dark)' }}>Personal Information</span></div>}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="grid-2-mobile">
            <Input 
              label="Full Name *" 
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input 
              label="Contact Phone *" 
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
            <Input 
              label="Date of Birth *" 
              type="date"
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
              required
            />
            <Select
              label="Gender"
              options={genderOptions}
              value={form.gender}
              onChange={(val) => setForm({ ...form, gender: val })}
            />
            <Input 
              label="Primary Email" 
              type="email"
              value={user?.email || 'patient@jivexa.com'}
              disabled
              helperText="Email changes require security verification."
            />
            <Input
              label="Preferred Clinic / Hospital"
              value={form.primaryDoctor}
              onChange={(e) => setForm({ ...form, primaryDoctor: e.target.value })}
            />
          </div>
        </Card>

        {/* 2. VITALS & BIOMETRICS CARD */}
        <Card style={{ borderRadius: '24px', padding: '28px' }} title={<div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)' }}><Scale size={22} /><span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-dark)' }}>Vitals & Biometrics</span></div>}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }} className="grid-2-mobile">
            <Input 
              label="Height (cm)" 
              type="number"
              value={form.height}
              onChange={(e) => setForm({ ...form, height: e.target.value })}
            />
            <Input 
              label="Weight (kg)" 
              type="number"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dark)' }}>Body Mass Index (BMI)</label>
              <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 14px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-dark)' }}>{bmiVal}</span>
                <span style={{ backgroundColor: bmiBadgeColor, color: 'white', fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: '12px' }}>
                  {bmiCategory}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* 3. HEALTH & CLINICAL INFORMATION CARD */}
        <Card style={{ borderRadius: '24px', padding: '28px' }} title={<div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)' }}><Heart size={22} /><span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-dark)' }}>Clinical Health Profile</span></div>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="grid-2-mobile">
              <Select 
                label="Blood Group"
                options={bloodGroupOptions}
                value={form.bloodGroup}
                onChange={(val) => setForm({ ...form, bloodGroup: val })}
              />
              <Select 
                label="Organ Donor Status"
                options={organDonorOptions}
                value={form.organDonor}
                onChange={(val) => setForm({ ...form, organDonor: val })}
              />
            </div>
            
            <Input 
              label="Known Active Allergies" 
              placeholder="e.g. Peanuts, Penicillin, Dust (leave blank if none)" 
              value={form.allergies}
              onChange={(e) => setForm({ ...form, allergies: e.target.value })}
              helperText="Highlighted automatically during emergency consultations."
            />
            
            <Input 
              label="Chronic Medical Conditions" 
              placeholder="e.g. Mild Asthma, Hypertension, Type 2 Diabetes" 
              value={form.conditions}
              onChange={(e) => setForm({ ...form, conditions: e.target.value })}
              helperText="Assists doctors in selecting safer prescription dosages."
            />
          </div>
        </Card>

        {/* 4. EMERGENCY CONTACT & INSURANCE CARD */}
        <Card style={{ borderRadius: '24px', padding: '28px' }} title={<div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)' }}><Phone size={22} /><span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-dark)' }}>Emergency Contacts & Health Insurance</span></div>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }} className="grid-2-mobile">
              <Input 
                label="Emergency Contact Name" 
                placeholder="Full Name"
                value={form.emergencyName}
                onChange={(e) => setForm({ ...form, emergencyName: e.target.value })}
              />
              <Input 
                label="Relationship" 
                placeholder="Parent / Spouse / Sibling"
                value={form.emergencyRelation}
                onChange={(e) => setForm({ ...form, emergencyRelation: e.target.value })}
              />
              <Input 
                label="Emergency Phone" 
                placeholder="+91 Mobile Number"
                value={form.emergencyContact}
                onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="grid-2-mobile">
              <Input 
                label="Health Insurance Provider" 
                placeholder="Provider Name (e.g. Star Health)"
                value={form.insuranceProvider}
                onChange={(e) => setForm({ ...form, insuranceProvider: e.target.value })}
              />
              <Input 
                label="Policy / Member ID Number" 
                placeholder="Policy Reference Number"
                value={form.policyNumber}
                onChange={(e) => setForm({ ...form, policyNumber: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* ACTION BUTTONS */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '8px' }}>
          <Button type="button" variant="outline" onClick={() => window.history.back()} style={{ borderRadius: '12px', padding: '12px 24px', fontWeight: 700 }}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving} style={{ borderRadius: '12px', padding: '12px 32px', fontWeight: 800, backgroundColor: 'var(--primary)', boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)' }}>
            Save Profile Updates
          </Button>
        </div>

      </form>

      {/* HIPAA COMPLIANCE FOOTER */}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'center', backgroundColor: '#f0fdfa', padding: '18px 24px', borderRadius: '20px', border: '1px solid rgba(15, 118, 110, 0.2)' }}>
        <ShieldCheck size={24} style={{ color: 'var(--primary)', flexShrink: 0 }} />
        <span style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
          <strong>JIVEXA HIPAA & Encrypted Privacy Standard:</strong> Your personal medical records and emergency logs are encrypted with 256-bit AES protection. Information is strictly shared with authorized healthcare practitioners during emergency consults.
        </span>
      </div>

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage('')} />
      )}

    </div>
  );
};
