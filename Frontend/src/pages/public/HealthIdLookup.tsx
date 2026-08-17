import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  ShieldCheck, Search, QrCode, Lock, AlertTriangle, CheckCircle2, 
  Clock, PhoneCall, HeartPulse, UserCheck, ShieldAlert
} from 'lucide-react';
import { searchHealthIdApi } from '../../services/healthIdService';

export const HealthIdLookup: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    
    setError('');
    setLoading(true);
    const res = await searchHealthIdApi(query);
    setLoading(false);

    if (res.success && res.patient) {
      const p = res.patient;
      const rawName = p.name || 'Patient User';
      const nameParts = rawName.split(' ');
      const maskedName = nameParts.map(part => part.charAt(0) + '*'.repeat(Math.max(1, part.length - 1))).join(' ');
      const rawPhone = p.phoneNumber || p.email || '+91 99887 76655';
      const maskedPhone = rawPhone.length > 6 ? rawPhone.substring(0, 4) + '*****' + rawPhone.slice(-2) : rawPhone;

      setProfile({
        healthId: res.healthId || query.trim().toUpperCase(),
        fullName: p.name,
        maskedName: maskedName,
        age: p.dateOfBirth ? (new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()) || 25 : 25,
        gender: p.gender || 'Unspecified',
        bloodGroup: p.bloodGroup || 'O+ Positive',
        allergies: (p.healthProfile && p.healthProfile.allergies) || 'None logged',
        email: p.email,
        phoneNumber: p.phoneNumber,
        maskedEmergencyContact: maskedPhone,
        emergencySharingEnabled: true,
        lastUpdated: new Date().toISOString().split('T')[0]
      });
    } else {
      setProfile(null);
      setError(res.message || 'Health ID not found');
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '40px auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header Banner */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #0f766e 0%, #10b981 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 24px -6px rgba(15, 118, 110, 0.4)' }}>
          <ShieldCheck size={32} />
        </div>
        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Jivexa Health OS • Emergency Portal
        </span>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-dark)' }}>
          Public Health ID Verification
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '540px', lineHeight: '1.6' }}>
          Instantly verify emergency health identity data. Sensitive medical records remain strictly encrypted and consent-protected.
        </p>
      </div>

      {/* Search Input Box */}
      <Card style={{ padding: '28px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-dark)' }}>
            Enter Jivexa Health ID (JHID) or Scan QR Badge:
          </label>
          <div style={{ display: 'flex', gap: '12px' }} className="flex-col-mobile">
            <Input
              placeholder="e.g. JIV-2026-849201"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ height: '48px', fontSize: '1rem', fontWeight: 700, fontFamily: 'monospace' }}
              icon={<Search size={20} style={{ color: 'var(--primary)' }} />}
            />
            <Button type="submit" isLoading={loading} style={{ height: '48px', borderRadius: '12px', padding: '0 28px', fontWeight: 800 }}>
              Verify Health ID
            </Button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '14px', marginTop: '6px' }}>
            <span>Need sample ID? Try <code style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 700 }} onClick={() => { setQuery('JIV-2026-849201'); }}>JIV-2026-849201</code></span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--secondary)', fontWeight: 700 }}>
              <QrCode size={14} /> Scanner Ready
            </span>
          </div>
        </form>
      </Card>

      {error && (
        <div style={{ backgroundColor: 'var(--error-light)', border: '1px solid var(--error)', borderRadius: '16px', padding: '16px 20px', color: 'var(--error)', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Level 1 Public Profile Display */}
      {profile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Main Card */}
          <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1.5px solid var(--border)', padding: '28px', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #0f766e 0%, #10b981 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.5rem', boxShadow: '0 8px 16px -4px rgba(15,118,110,0.3)' }}>
                  {profile.maskedName.charAt(0)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 900 }}>{profile.maskedName}</h2>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '3px 8px', borderRadius: '6px' }}>
                      Level 1 Public Emergency View
                    </span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-muted)' }}>
                    JHID: {profile.healthId}
                  </span>
                </div>
              </div>

              {/* Emergency Mode Status Badge */}
              <div style={{
                backgroundColor: profile.emergencySharingEnabled ? 'var(--secondary-light)' : '#f1f5f9',
                border: profile.emergencySharingEnabled ? '1px solid var(--secondary)' : '1px solid var(--border)',
                borderRadius: '16px',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <HeartPulse size={18} style={{ color: profile.emergencySharingEnabled ? 'var(--secondary)' : 'var(--text-muted)' }} />
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: profile.emergencySharingEnabled ? 'var(--secondary)' : 'var(--text-muted)', display: 'block' }}>
                    {profile.emergencySharingEnabled ? '⚡ Emergency Mode ACTIVE' : '🔒 Standard Privacy Mode'}
                  </span>
                  {profile.emergencySharingEnabled && profile.emergencyAccessExpiry && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Expires: {new Date(profile.emergencyAccessExpiry).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Basic Emergency Data Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }} className="grid-2-mobile">
              <div style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', backgroundColor: 'var(--surface-raised)' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase' }}>Demographics</span>
                <p style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '4px' }}>{profile.age} Yrs • {profile.gender}</p>
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', backgroundColor: '#f0fdf4' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase' }}>Blood Group</span>
                <p style={{ fontSize: '1.05rem', fontWeight: 900, color: '#166534', marginTop: '4px' }}>{profile.bloodGroup}</p>
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', backgroundColor: 'var(--error-light)' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--error)', textTransform: 'uppercase' }}>⚠️ Critical Allergies</span>
                <p style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--error)', marginTop: '4px' }}>{profile.allergies}</p>
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', backgroundColor: '#fffbe6' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>Emergency Contact</span>
                <p style={{ fontSize: '0.88rem', fontWeight: 800, color: '#92400e', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <PhoneCall size={14} /> {profile.maskedEmergencyContact}
                </p>
              </div>
            </div>

            {/* Privacy Shield & Locked Info Notice */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px border-dashed var(--border)', borderRadius: '18px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dark)', fontWeight: 800, fontSize: '0.92rem' }}>
                <Lock size={18} style={{ color: 'var(--primary)' }} />
                <span>Protected Clinical Data (Level 2 & Level 3 Access Control)</span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                The following records are strictly encrypted and hidden on public lookup:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <span>• 🔒 Diagnostic Lab & Imaging Reports</span>
                <span>• 🔒 Active Prescription History</span>
                <span>• 🔒 Practitioner Consultation Notes</span>
                <span>• 🔒 Historical Medical Documents</span>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Are you a verified practitioner? Log in to your doctor workstation to request access.
                </span>
                <a href="#/login" style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <UserCheck size={14} /> Doctor Login & Verification
                </a>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
