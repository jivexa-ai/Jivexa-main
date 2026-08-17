import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useHealthData, AmbulanceBooking } from '../../context/HealthDataContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';
import { 
  Siren, Navigation, CheckCircle2, XCircle, Phone, 
  MapPin, ShieldCheck, DollarSign, Clock, AlertTriangle, Activity, UserCheck,
  Truck, Settings, Home, ListFilter, FileText, ChevronRight, RefreshCw, Check
} from 'lucide-react';

export const AmbulancePartnerDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { ambulances, ambulanceBookings, updateAmbulanceBookingStatus, toggleAmbulanceAvailability } = useHealthData();

  const activeAmbulance = ambulances.find((a) => a.partnerId === user?.id) || ambulances[0];
  const [isOnline, setIsOnline] = useState(activeAmbulance?.availability === 'Available');
  const [toastMsg, setToastMsg] = useState('');
  const [dispatchRadius, setDispatchRadius] = useState('10');
  const [sirenSoundEnabled, setSirenSoundEnabled] = useState(true);

  // Active accepted booking assigned to this partner
  const assignedBooking = ambulanceBookings.find((b) => ['Accepted', 'Arrived', 'In Transit'].includes(b.status));
  // Pending request waiting for acceptance
  const pendingBooking = ambulanceBookings.find((b) => b.status === 'Pending');

  // Determine active sub-tab from path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('requests')) return 'requests';
    if (path.includes('active-trips')) return 'active-trips';
    if (path.includes('history')) return 'history';
    if (path.includes('driver-profile')) return 'driver-profile';
    if (path.includes('vehicle-details')) return 'vehicle-details';
    if (path.includes('settings')) return 'settings';
    return 'overview';
  };

  const activeTab = getActiveTab();

  const handleToggleOnline = async () => {
    const nextStatus = !isOnline ? 'Available' : 'Offline';
    setIsOnline(!isOnline);
    await toggleAmbulanceAvailability(activeAmbulance.id, nextStatus);
    setToastMsg(`Ambulance partner status set to ${nextStatus}.`);
  };

  const tabs = [
    { id: 'overview', label: 'Overview Dashboard', path: '/ambulance/dashboard', icon: <Home size={16} /> },
    { id: 'requests', label: 'Emergency Requests', path: '/ambulance/requests', icon: <Siren size={16} /> },
    { id: 'active-trips', label: 'Active Trips', path: '/ambulance/active-trips', icon: <Navigation size={16} /> },
    { id: 'history', label: 'Trip History', path: '/ambulance/history', icon: <Clock size={16} /> },
    { id: 'driver-profile', label: 'Driver Profile', path: '/ambulance/driver-profile', icon: <UserCheck size={16} /> },
    { id: 'vehicle-details', label: 'Vehicle Details', path: '/ambulance/vehicle-details', icon: <Truck size={16} /> },
    { id: 'settings', label: 'Settings', path: '/ambulance/settings', icon: <Settings size={16} /> },
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '24px auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ── HEADER BANNER & ONLINE TOGGLE ────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '24px',
        padding: '24px 28px',
        color: 'white',
        boxShadow: 'var(--shadow-xl)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            backgroundColor: isOnline ? '#10b981' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: isOnline ? '0 0 24px rgba(16, 185, 129, 0.5)' : 'none'
          }}>
            <Siren size={28} className={isOnline ? 'animate-pulse' : ''} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#38bdf8' }}>
                JIVEXA HEALTH AMBULANCE OPERATOR WORKSTATION
              </span>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', marginTop: '2px' }}>
              Welcome, {user?.name || 'Ramesh Singh'}
            </h1>
            <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              Vehicle: <strong style={{ color: 'white' }}>{activeAmbulance?.vehicleNumber || 'KA-01-EQ-9112'}</strong> • Category: <strong style={{ color: '#34d399' }}>{activeAmbulance?.type || 'ICU'} Ambulance</strong> • Hospital: <strong style={{ color: 'white' }}>{activeAmbulance?.hospitalPartner || 'Apollo Hospital'}</strong>
            </span>
          </div>
        </div>

        <button
          onClick={handleToggleOnline}
          style={{
            backgroundColor: isOnline ? '#10b981' : '#475569',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            padding: '12px 24px',
            fontSize: '0.92rem',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: isOnline ? '0 8px 20px -4px rgba(16, 185, 129, 0.4)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'white' }} className={isOnline ? 'animate-pulse' : ''} />
          {isOnline ? '🟢 ONLINE (Ready for Emergency Dispatch)' : '🔴 OFFLINE'}
        </button>
      </div>

      {/* ── SUB-NAVIGATION TABS BAR ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: '6px',
        backgroundColor: '#ffffff',
        padding: '6px',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        overflowX: 'auto'
      }}>
        {tabs.map((t) => {
          const isSelected = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => navigate(t.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: isSelected ? 800 : 600,
                fontSize: '0.86rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.18s ease'
              }}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB CONTENT 1: OVERVIEW DASHBOARD ───────────────────────────────── */}
      {(activeTab === 'overview' || activeTab === 'requests') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Incoming Dispatch Alert Modal / Card */}
          {isOnline && pendingBooking && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '2px solid var(--error)',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 12px 32px -6px rgba(220, 38, 38, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }} className="animate-pulse">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Siren size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--error)', margin: 0 }}>⚡ INCOMING EMERGENCY DISPATCH REQUEST</h3>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-dark)', fontWeight: 700 }}>Requested Category: {pendingBooking.ambulanceType} Ambulance</span>
                  </div>
                </div>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>₹{pendingBooking.fare}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: 'white', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)' }} className="grid-2-mobile">
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--error)', textTransform: 'uppercase' }}>Pickup Location</span>
                  <p style={{ fontSize: '0.92rem', fontWeight: 800, marginTop: '2px', color: 'var(--text-main)' }}>{pendingBooking.pickupAddress}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>Destination Hospital</span>
                  <p style={{ fontSize: '0.92rem', fontWeight: 800, marginTop: '2px', color: 'var(--text-main)' }}>{pendingBooking.destinationAddress}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <Button
                  onClick={async () => {
                    await updateAmbulanceBookingStatus(pendingBooking.id, 'Accepted');
                    setToastMsg('⚡ Emergency Ride Accepted! Patient notified.');
                  }}
                  style={{ flex: 1, backgroundColor: 'var(--secondary)', height: '48px', borderRadius: '14px', fontWeight: 900, fontSize: '1rem' }}
                >
                  <CheckCircle2 size={20} /> Accept Emergency Ride (₹{pendingBooking.fare})
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    await updateAmbulanceBookingStatus(pendingBooking.id, 'Cancelled');
                    setToastMsg('Dispatch request declined.');
                  }}
                  style={{ borderRadius: '14px', height: '48px' }}
                >
                  Decline
                </Button>
              </div>
            </div>
          )}

          {/* Active Trip Telemetry Controls */}
          {assignedBooking && (
            <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Navigation size={22} style={{ color: 'var(--primary)' }} /><span style={{ fontWeight: 900 }}>Active Emergency Ride Telemetry</span></div>}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div style={{ backgroundColor: '#f0f9ff', border: '1.5px solid rgba(2, 132, 199, 0.3)', borderRadius: '18px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                      Current Ride Status: <strong style={{ color: '#0369a1' }}>{assignedBooking.status}</strong>
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginTop: '2px', color: 'var(--text-main)' }}>Patient: {assignedBooking.patientName}</h3>
                    <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                      Phone: <strong>{assignedBooking.patientPhone}</strong> • Health ID: <strong>{assignedBooking.jivexaHealthId || 'JIV-2026-849201'}</strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {assignedBooking.status === 'Accepted' && (
                      <Button
                        onClick={async () => {
                          await updateAmbulanceBookingStatus(assignedBooking.id, 'Arrived');
                          setToastMsg('Marked status: Arrived at pickup location.');
                        }}
                        style={{ borderRadius: '12px', fontWeight: 800 }}
                      >
                        Mark Arrived at Pickup
                      </Button>
                    )}

                    {assignedBooking.status === 'Arrived' && (
                      <Button
                        onClick={async () => {
                          await updateAmbulanceBookingStatus(assignedBooking.id, 'In Transit');
                          setToastMsg('Marked status: In Transit to Hospital.');
                        }}
                        style={{ backgroundColor: 'var(--secondary)', borderRadius: '12px', fontWeight: 800 }}
                      >
                        Start Ride to Hospital
                      </Button>
                    )}

                    {assignedBooking.status === 'In Transit' && (
                      <Button
                        onClick={async () => {
                          await updateAmbulanceBookingStatus(assignedBooking.id, 'Completed');
                          setToastMsg(`Emergency Ride Completed! Fare ₹${assignedBooking.fare} collected.`);
                        }}
                        style={{ backgroundColor: 'var(--secondary)', borderRadius: '12px', fontWeight: 900 }}
                      >
                        Complete Ride & Collect Fare (₹{assignedBooking.fare})
                      </Button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="grid-2-mobile">
                  <div style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', backgroundColor: 'white' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--error)', textTransform: 'uppercase' }}>Pickup Address</span>
                    <p style={{ fontSize: '0.9rem', fontWeight: 800, marginTop: '2px' }}>{assignedBooking.pickupAddress}</p>
                  </div>
                  <div style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', backgroundColor: 'white' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>Destination Hospital</span>
                    <p style={{ fontSize: '0.9rem', fontWeight: 800, marginTop: '2px' }}>{assignedBooking.destinationAddress}</p>
                  </div>
                </div>

              </div>
            </Card>
          )}

          {/* Partner Key Metrics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }} className="grid-2-mobile">
            <div style={{ border: '1px solid var(--border)', borderRadius: '18px', padding: '18px', backgroundColor: '#f0fdf4' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Today's Earnings</span>
              <p style={{ fontSize: '1.6rem', fontWeight: 900, color: '#15803d', marginTop: '4px', margin: 0 }}>₹3,800</p>
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: '18px', padding: '18px', backgroundColor: 'var(--primary-light)' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Completed Rides</span>
              <p style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--primary)', marginTop: '4px', margin: 0 }}>4 Dispatches</p>
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: '18px', padding: '18px', backgroundColor: '#fff7ed' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Avg. Response Time</span>
              <p style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ea580c', marginTop: '4px', margin: 0 }}>4.2 mins</p>
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: '18px', padding: '18px', backgroundColor: '#f8fafc' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Partner Rating</span>
              <p style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '4px', margin: 0 }}>⭐ 4.9 / 5.0</p>
            </div>
          </div>

        </div>
      )}

      {/* ── TAB CONTENT 2: ACTIVE TRIPS & SIMULATED GPS MAP ─────────────────── */}
      {activeTab === 'active-trips' && (
        <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Navigation size={22} style={{ color: 'var(--primary)' }} /><span style={{ fontWeight: 900 }}>GPS Telemetry Radar & Live Route</span></div>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{
              height: '320px',
              borderRadius: '20px',
              backgroundColor: '#0f172a',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.8)'
            }}>
              {/* Animated Radar Pulse circles */}
              <div style={{ position: 'absolute', width: '220px', height: '220px', borderRadius: '50%', border: '1px solid rgba(16, 185, 129, 0.3)' }} className="animate-ping" />
              <div style={{ position: 'absolute', width: '140px', height: '140px', borderRadius: '50%', border: '1px solid rgba(2, 132, 199, 0.4)' }} />

              <div style={{ textAlign: 'center', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="animate-pulse">
                  <Siren size={24} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white', margin: 0 }}>GPS Telemetry Live Stream</h3>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Vehicle KA-01-EQ-9112 • En Route to Apollo Trauma Center</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="grid-2-mobile">
              <div style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', backgroundColor: 'white' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>Patient Status</span>
                <p style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '2px', color: 'var(--text-main)' }}>Oxygen Level: 96% • Stable Vitals</p>
              </div>
              <div style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', backgroundColor: 'white' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--secondary)', textTransform: 'uppercase' }}>Hospital Pre-Notification</span>
                <p style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '2px', color: 'var(--text-main)' }}>Trauma Bay #3 Reserved ✓</p>
              </div>
            </div>

          </div>
        </Card>
      )}

      {/* ── TAB CONTENT 3: TRIP HISTORY ────────────────────────────────────── */}
      {activeTab === 'history' && (
        <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Clock size={22} style={{ color: 'var(--primary)' }} /><span style={{ fontWeight: 900 }}>Historical Dispatch Log & Earnings</span></div>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Complete log of all emergency rides completed by vehicle KA-01-EQ-9112.
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { id: 'EMG-88120', date: 'Today, 02:30 PM', patient: 'Amitabh Sen', fare: 1200, type: 'ICU Ambulance', hospital: 'Apollo Hospital', status: 'Completed' },
                { id: 'EMG-88119', date: 'Today, 11:15 AM', patient: 'Priya Reddy', fare: 800, type: 'Oxygen Ambulance', hospital: 'Manipal Hospital', status: 'Completed' },
                { id: 'EMG-88114', date: 'Yesterday, 08:45 PM', patient: 'Karan Sharma', fare: 1800, type: 'ALS Ambulance', hospital: 'Fortis Healthcare', status: 'Completed' },
                { id: 'EMG-88102', date: '05 Aug 2026, 04:10 PM', patient: 'Sunita Verma', fare: 1500, type: 'ICU Ambulance', hospital: 'Max Super Specialty', status: 'Completed' },
              ].map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '16px', padding: '14px 18px', backgroundColor: 'white', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--primary)', backgroundColor: 'var(--primary-light)', padding: '2px 8px', borderRadius: '6px' }}>{item.id}</span>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>{item.patient} ({item.type})</h4>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      {item.hospital} • {item.date}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--secondary)' }}>+₹{item.fare}</span>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, padding: '4px 10px', backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)', borderRadius: '6px' }}>{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* ── TAB CONTENT 4: DRIVER PROFILE ───────────────────────────────────── */}
      {activeTab === 'driver-profile' && (
        <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><UserCheck size={22} style={{ color: 'var(--primary)' }} /><span style={{ fontWeight: 900 }}>Commercial Driver Profile</span></div>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '18px', border: '1px solid var(--border)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900 }}>
                {user?.name?.charAt(0) || 'R'}
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>{user?.name || 'Ramesh Singh'}</h3>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Commercial Emergency Driver • 8+ Years Experience</span>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', backgroundColor: 'var(--secondary-light)', color: 'var(--secondary)', borderRadius: '6px' }}>Verified Partner ✓</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '6px' }}>Rating: ⭐ 4.9</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="grid-2-mobile">
              <div style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', backgroundColor: 'white' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>Commercial DL Number</span>
                <strong style={{ fontSize: '0.95rem' }}>DL-KA-2018-99201</strong>
              </div>
              <div style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', backgroundColor: 'white' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>Emergency Phone Number</span>
                <strong style={{ fontSize: '0.95rem' }}>+91 98765 43210</strong>
              </div>
            </div>

          </div>
        </Card>
      )}

      {/* ── TAB CONTENT 5: VEHICLE DETAILS & EQUIPMENT ──────────────────────── */}
      {activeTab === 'vehicle-details' && (
        <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Truck size={22} style={{ color: 'var(--primary)' }} /><span style={{ fontWeight: 900 }}>Vehicle Details & Medical Equipment Audit</span></div>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="grid-2-mobile">
              <div style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', backgroundColor: 'white' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>Vehicle Registration (RC)</span>
                <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>KA-01-EQ-9112</strong>
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', backgroundColor: 'white' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>Ambulance Category</span>
                <strong style={{ fontSize: '1rem', color: 'var(--secondary)' }}>ICU & Advanced Life Support (ALS)</strong>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '12px' }}>On-Board Medical Equipment Audit:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }} className="grid-2-mobile">
                {[
                  { name: 'Medical Oxygen Cylinder', status: '95% Capacity (Passed ✓)' },
                  { name: 'ICU Portable Ventilator', status: 'Operational (Passed ✓)' },
                  { name: 'Automated External Defibrillator', status: 'Charged & Ready (Passed ✓)' },
                  { name: 'Stretcher & Spinal Board', status: 'Inspected (Passed ✓)' },
                ].map((eq, i) => (
                  <div key={i} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={18} style={{ color: '#166534' }} />
                    <div>
                      <strong style={{ fontSize: '0.86rem', display: 'block' }}>{eq.name}</strong>
                      <span style={{ fontSize: '0.74rem', color: '#15803d' }}>{eq.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </Card>
      )}

      {/* ── TAB CONTENT 6: SETTINGS ────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <Card title={<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Settings size={22} style={{ color: 'var(--primary)' }} /><span style={{ fontWeight: 900 }}>Partner Preferences & Settings</span></div>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Dispatch Search Radius</h4>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Receive emergency alerts within this range.</span>
              </div>
              <select
                value={dispatchRadius}
                onChange={(e) => setDispatchRadius(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--border)', fontWeight: 700 }}
              >
                <option value="5">5 km Radius</option>
                <option value="10">10 km Radius</option>
                <option value="20">20 km Radius</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Emergency Siren Audio Alert</h4>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Play loud siren alert sound when emergency ride is requested.</span>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSirenSoundEnabled(!sirenSoundEnabled);
                  setToastMsg(`Siren sound alert ${!sirenSoundEnabled ? 'ENABLED' : 'DISABLED'}.`);
                }}
                style={{ borderRadius: '10px', fontWeight: 700 }}
              >
                {sirenSoundEnabled ? '🔊 ENABLED' : '🔇 MUTED'}
              </Button>
            </div>

          </div>
        </Card>
      )}

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg('')} />}

    </div>
  );
};
