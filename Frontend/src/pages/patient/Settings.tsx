import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Toast } from '../../components/ui/Toast';
import { Bell, Lock, Shield, Eye, Trash2, Heart } from 'lucide-react';

export const PatientSettings: React.FC = () => {
  const { user, logout } = useAuth();
  
  const [allowNotifs, setAllowNotifs] = useState(true);
  const [allowEmailNotifs, setAllowEmailNotifs] = useState(false);
  
  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' });
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);
  const [passError, setPassError] = useState('');
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const [toastMsg, setToastMsg] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passForm.current || !passForm.new || !passForm.confirm) return;

    if (passForm.new !== passForm.confirm) {
      setPassError('New passwords do not match.');
      return;
    }

    setPassError('');
    setIsUpdatingPass(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    setIsUpdatingPass(false);
    setToastMsg('Password changed successfully.');
    setPassForm({ current: '', new: '', confirm: '' });
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText.toLowerCase() === 'delete') {
      setIsDeleteOpen(false);
      alert('Your account is being scheduled for deletion in compliance with HIPAA records duration requirements.');
      logout();
    }
  };

  const handleDownloadBackup = () => {
    setToastMsg('Exporting Patient Health Data backup in PDF format...');
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preferences</span>
        <h1 style={{ fontWeight: 800, marginTop: '2px' }}>Account Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          Configure notifications, change passwords, and manage privacy settings.
        </p>
      </div>

      <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Bell size={18} /><span>Notification Preferences</span></div>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="flex-col-mobile gap-sm">
            <div>
              <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600 }}>Enable In-App Notifications</span>
              <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Receive appointment reminders and prescription notifications in dashboard.</span>
            </div>
            <input 
              type="checkbox" 
              checked={allowNotifs} 
              onChange={() => setAllowNotifs(!allowNotifs)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px' }} className="flex-col-mobile gap-sm">
            <div>
              <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600 }}>Enable Email Alerts</span>
              <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Send medication schedules and order updates to: **{user?.email}**</span>
            </div>
            <input 
              type="checkbox" 
              checked={allowEmailNotifs} 
              onChange={() => setAllowEmailNotifs(!allowEmailNotifs)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </div>
        </div>
      </Card>

      <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Lock size={18} /><span>Change Password</span></div>}>
        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {passError && (
            <div style={{ backgroundColor: 'var(--error-light)', border: '1px solid var(--error)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', color: 'var(--error)', fontSize: '0.82rem', fontWeight: 500 }}>
              {passError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="grid-2-mobile">
            <Input 
              label="Current Password" 
              type="password"
              placeholder="••••••••"
              value={passForm.current}
              onChange={(e) => setPassForm({ ...passForm, current: e.target.value })}
              required
              disabled={isUpdatingPass}
            />
            <div />
            <Input 
              label="New Password" 
              type="password"
              placeholder="••••••••"
              value={passForm.new}
              onChange={(e) => setPassForm({ ...passForm, new: e.target.value })}
              required
              disabled={isUpdatingPass}
            />
            <Input 
              label="Confirm New Password" 
              type="password"
              placeholder="••••••••"
              value={passForm.confirm}
              onChange={(e) => setPassForm({ ...passForm, confirm: e.target.value })}
              required
              disabled={isUpdatingPass}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
            <Button type="submit" isLoading={isUpdatingPass}>Change Password</Button>
          </div>
        </form>
      </Card>

      <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Shield size={18} /><span>Privacy & Dangerous Actions</span></div>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="flex-col-mobile gap-sm">
            <div>
              <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600 }}>Download Personal Data Backup</span>
              <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Download a complete encrypted PDF transcript of your logged health metrics, allergies, records, and prescriptions.</span>
            </div>
            <Button variant="outline" onClick={handleDownloadBackup}>Export Data</Button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '20px', alignItems: 'center' }} className="flex-col-mobile gap-sm">
            <div>
              <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--error)' }}>Close JIVEXA Account</span>
              <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Permanently remove your health profile. This action cannot be undone.</span>
            </div>
            <Button variant="danger" onClick={() => setIsDeleteOpen(true)}>Delete Account</Button>
          </div>
        </div>
      </Card>

      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Close My Account">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--error-light)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--error)', display: 'flex', gap: '10px' }}>
            <Trash2 size={20} style={{ color: 'var(--error)', flexShrink: 0 }} />
            <p style={{ fontSize: '0.8rem', color: 'var(--error)', fontWeight: 600 }}>
              WARNING: This is a destructive operation. All records in your health vault and timeline will be queued for deletion.
            </p>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            To confirm this deletion request, please type **delete** in the input field below:
          </p>

          <Input 
            placeholder="Type 'delete' to verify"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText.toLowerCase() !== 'delete'}
            >
              Permanently Delete Account
            </Button>
          </div>
        </div>
      </Modal>

      {toastMsg && (
        <Toast message={toastMsg} onClose={() => setToastMsg('')} />
      )}

    </div>
  );
};
