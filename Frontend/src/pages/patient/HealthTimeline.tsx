import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useHealthData } from '../../context/HealthDataContext';
import { Card } from '../../components/ui/Card';
import { 
  Activity, Calendar, FileText, ShoppingBag, 
  UserPlus, CheckCircle, ArrowDown, ArrowUp 
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  type: 'account' | 'record' | 'appointment' | 'prescription' | 'order';
}

export const PatientHealthTimeline: React.FC = () => {
  const { user } = useAuth();
  const { appointments, healthRecords, prescriptions, orders } = useHealthData();
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const timelineEvents: TimelineEvent[] = [];

  timelineEvents.push({
    id: 'evt_acc',
    date: '2026-06-01',
    title: 'Account Created',
    description: 'Welcome to Jivexa Health OS. Secure health vault initialized.',
    icon: <UserPlus size={16} />,
    color: 'var(--primary)',
    bgColor: 'var(--primary-light)',
    type: 'account'
  });

  if (user?.onboarded) {
    timelineEvents.push({
      id: 'evt_onb',
      date: '2026-06-02',
      title: 'Health Profile Configured',
      description: 'Completed onboarding metrics: Blood Group, Allergies, and emergency details logged.',
      icon: <CheckCircle size={16} />,
      color: 'var(--secondary)',
      bgColor: 'var(--secondary-light)',
      type: 'account'
    });
  }

  healthRecords
    .filter((r) => r.patientId === user?.id)
    .forEach((rec) => {
      timelineEvents.push({
        id: `evt_rec_${rec.id}`,
        date: rec.date,
        title: `Uploaded document: "${rec.name}"`,
        description: `Category: ${rec.type} • File: ${rec.fileName}`,
        icon: <FileText size={16} />,
        color: 'var(--info)',
        bgColor: 'var(--info-light)',
        type: 'record'
      });
    });

  appointments
    .filter((a) => a.patientId === user?.id)
    .forEach((appt) => {
      let desc = `Practitioner: ${appt.doctorName} (${appt.doctorSpecialty}) • Time: ${appt.time}`;
      if (appt.status === 'Completed' && appt.consultationSummary) {
        desc += ` • Summary: "${appt.consultationSummary}"`;
      }
      timelineEvents.push({
        id: `evt_appt_${appt.id}`,
        date: appt.date,
        title: `Doctor consultation: ${appt.status}`,
        description: desc,
        icon: <Calendar size={16} />,
        color: appt.status === 'Cancelled' ? 'var(--error)' : 'var(--primary)',
        bgColor: appt.status === 'Cancelled' ? 'var(--error-light)' : 'var(--primary-light)',
        type: 'appointment'
      });
    });

  prescriptions
    .filter((p) => p.patientId === user?.id)
    .forEach((pres) => {
      const medNames = pres.medications.map((m) => m.name).join(', ');
      timelineEvents.push({
        id: `evt_pres_${pres.id}`,
        date: pres.date,
        title: `Digital Prescription issued`,
        description: `Doctor: ${pres.doctorName} • Prescribed: ${medNames}`,
        icon: <Activity size={16} />,
        color: 'var(--secondary)',
        bgColor: 'var(--secondary-light)',
        type: 'prescription'
      });
    });

  orders
    .filter((o) => o.patientId === user?.id)
    .forEach((ord) => {
      const itemsText = ord.items.map((i) => `${i.name} (x${i.quantity})`).join(', ');
      timelineEvents.push({
        id: `evt_ord_${ord.id}`,
        date: ord.date,
        title: `Pharmacy Order: ${ord.status}`,
        description: `Items: ${itemsText} • Total price paid: ₹${ord.totalPrice}`,
        icon: <ShoppingBag size={16} />,
        color: ord.status === 'Completed' ? 'var(--secondary)' : 'var(--warning)',
        bgColor: ord.status === 'Completed' ? 'var(--secondary-light)' : 'var(--warning-light)',
        type: 'order'
      });
    });

  const sortedEvents = [...timelineEvents].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Health Log</span>
          <h1 style={{ fontWeight: 800, marginTop: '2px' }}>My Health Timeline</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            A comprehensive chronological summary of your historical medical activities.
          </p>
        </div>

        <button
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'white',
            border: '1px solid var(--border)',
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {sortOrder === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
          <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
        </button>
      </div>

      <div style={{ position: 'relative', paddingLeft: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={{
          position: 'absolute',
          left: '15px',
          top: '12px',
          bottom: '12px',
          width: '2px',
          backgroundColor: 'var(--border)'
        }} />

        {sortedEvents.map((evt) => (
          <div key={evt.id} style={{ position: 'relative', animation: 'fadeIn 0.3s ease' }}>
            
            <div style={{
              position: 'absolute',
              left: '-32px',
              top: '4px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: evt.bgColor,
              color: evt.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white',
              boxShadow: 'var(--shadow-sm)',
              transform: 'translateX(-50%)',
              zIndex: 10
            }}>
              {evt.icon}
            </div>

            <Card style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '16px', marginBottom: '8px' }} className="flex-col-mobile">
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{evt.title}</h4>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: 600 }}>
                  {new Date(evt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                {evt.description}
              </p>
            </Card>

          </div>
        ))}
      </div>

    </div>
  );
};
