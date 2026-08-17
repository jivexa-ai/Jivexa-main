import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHealthData, HealthRecord } from '../../context/HealthDataContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Toast } from '../../components/ui/Toast';
import { FileText, Plus, Search, Trash2, Download, FileCode, CheckCircle, ShieldAlert } from 'lucide-react';

export const HealthRecordsExplorer: React.FC = () => {
  const { user } = useAuth();
  const { healthRecords, uploadHealthRecord, deleteHealthRecord } = useHealthData();
  
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newDoc, setNewDoc] = useState({ name: '', type: 'Lab Report' as HealthRecord['type'], fileName: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const patientRecs = healthRecords.filter((r) => r.patientId === user?.id);
  
  const filteredRecs = patientRecs.filter((rec) => {
    const matchesSearch = rec.name.toLowerCase().includes(search.toLowerCase()) || 
                          rec.fileName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterType === 'All' || rec.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.name || !newDoc.fileName) {
      setErrorMsg('Please complete all document inputs.');
      return;
    }

    setErrorMsg('');
    setIsUploading(true);
    setUploadProgress(10);

    const progressTimer = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressTimer);
          return 90;
        }
        return prev + 25;
      });
    }, 200);

    try {
      const res = await uploadHealthRecord(
        newDoc.name,
        newDoc.type,
        newDoc.fileName,
        '1.4 MB'
      );
      
      if (res.success) {
        clearInterval(progressTimer);
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setIsUploadOpen(false);
          setNewDoc({ name: '', type: 'Lab Report', fileName: '' });
          setToastMsg('Document uploaded successfully.');
        }, 300);
      }
    } catch (e) {
      clearInterval(progressTimer);
      setIsUploading(false);
      setErrorMsg('Failed to upload document.');
    }
  };

  const handleDownload = (recName: string) => {
    setToastMsg(`Downloading mock file: "${recName}"`);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this health record?')) {
      deleteHealthRecord(id);
      setToastMsg('Document deleted successfully.');
    }
  };

  const typesOptions = [
    { value: 'Lab Report', label: 'Lab Report (Blood work, Scans)' },
    { value: 'Prescription', label: 'Prescription' },
    { value: 'Vaccination', label: 'Vaccination' },
    { value: 'Other', label: 'Other Reports' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Health Vault</span>
          <h1 style={{ fontWeight: 800, marginTop: '2px' }}>My Health Records</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Securely save and manage your reports, labs, and prescriptions.
          </p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)}>
          <Plus size={16} />
          Upload Document
        </Button>
      </div>

      <div className="card flex-col-mobile gap-sm" style={{ padding: '16px 20px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, position: 'relative', width: '100%' }}>
          <Input 
            placeholder="Search records by name or filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ height: '38px', fontSize: '0.85rem', paddingLeft: '32px' }}
            icon={<Search size={14} style={{ color: 'var(--text-light)' }} />}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%', maxWidth: '380px' }} className="w-100-mobile">
          {['All', 'Lab Report', 'Prescription', 'Other'].map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterType(tag)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: filterType === tag ? 'var(--primary-light)' : 'white',
                color: filterType === tag ? 'var(--primary)' : 'var(--text-muted)',
                transition: 'all var(--transition-fast)'
              }}
            >
              {tag === 'All' ? 'All Files' : tag}
            </button>
          ))}
        </div>
      </div>

      {filteredRecs.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: 'white' }}>
          <FileText size={48} style={{ color: 'var(--text-light)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No health records found</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '380px', margin: '4px auto 0 auto' }}>
            You haven't uploaded any records matching the filters. Click "Upload Document" to add files.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }} className="grid-3-mobile">
          {filteredRecs.map((rec) => (
            <Card 
              key={rec.id}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={18} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.name}</span>
                </div>
              }
              subtitle={
                <span style={{ 
                  display: 'inline-block', 
                  fontSize: '0.72rem', 
                  fontWeight: 600, 
                  color: rec.type === 'Prescription' ? 'var(--secondary)' : 'var(--primary)',
                  backgroundColor: rec.type === 'Prescription' ? 'var(--secondary-light)' : 'var(--primary-light)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  marginTop: '4px'
                }}>
                  {rec.type}
                </span>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: 'var(--text-light)', display: 'inline' }}>Uploaded: </span>
                  <span style={{ fontWeight: 600 }}>{rec.date}</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>{rec.fileName} ({rec.fileSize})</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleDownload(rec.name)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      title="Download File"
                    >
                      <Download size={15} />
                    </button>
                    {rec.uploadedBy === 'Patient' && (
                      <button 
                        onClick={() => handleDelete(rec.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--error)' }}
                        title="Delete File"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title="Upload Health Document">
        <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {errorMsg && (
            <div style={{ backgroundColor: 'var(--error-light)', border: '1px solid var(--error)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', color: 'var(--error)', fontSize: '0.82rem', fontWeight: 500 }}>
              {errorMsg}
            </div>
          )}

          <Input 
            label="Document Name" 
            placeholder="e.g. Annual Blood Sugar Report" 
            value={newDoc.name}
            onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
            required
            disabled={isUploading}
          />

          <Select 
            label="Document Category"
            options={typesOptions}
            value={newDoc.type}
            onChange={(val) => setNewDoc({ ...newDoc, type: val as HealthRecord['type'] })}
            disabled={isUploading}
          />

          <Input 
            label="Select Mock File" 
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setNewDoc({ ...newDoc, fileName: file.name });
              }
            }}
            required
            disabled={isUploading}
            helperText="Supported file formats: PDF, JPG, PNG."
          />

          {isUploading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{ height: '6px', backgroundColor: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', backgroundColor: 'var(--primary)', transition: 'width 0.2s' }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isUploading}>
              Confirm Upload
            </Button>
          </div>
        </form>
      </Modal>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: 'var(--surface)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
        <ShieldAlert size={20} style={{ color: 'var(--warning)', flexShrink: 0 }} />
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          **Security Notice:** Uploaded documents are encrypted at rest. Practitioners can inspect reports only when you authorize medical appointments.
        </span>
      </div>

      {toastMsg && (
        <Toast message={toastMsg} onClose={() => setToastMsg('')} />
      )}
    </div>
  );
};
