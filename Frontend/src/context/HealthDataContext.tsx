import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { createHealthIdApi, getMyHealthIdApi, searchHealthIdApi } from '../services/healthIdService';

// --- TYPES ---
export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  location: string;
  availability: string; // e.g. "Mon - Fri, 9:00 AM - 5:00 PM"
  consultationType: 'Video' | 'In-Person' | 'Both';
  rating: number;
  education: string;
  about: string;
  fee: number;
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  rating: number;
  phone: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  date: string;
  time: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled' | 'Pending' | 'Confirmed' | 'In Consultation';
  notes?: string;
  consultationSummary?: string;
}

export interface HealthRecord {
  id: string;
  patientId: string;
  name: string;
  type: 'Lab Report' | 'Prescription' | 'Vaccination' | 'Other';
  date: string;
  fileName: string;
  fileSize: string;
  fileUrl: string; // Fake local blob URL
  uploadedBy: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  medications: Medication[];
  notes?: string;
  status: 'Draft' | 'Issued' | 'Active' | 'Expired' | 'Cancelled';
  followUpDate?: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  patientId: string;
  patientName: string;
  pharmacyId: string;
  pharmacyName: string;
  status: 'Pending' | 'Confirmed' | 'Processing' | 'Ready' | 'Completed' | 'Cancelled';
  items: OrderItem[];
  totalPrice: number;
  date: string;
  prescriptionId?: string;
}

export interface InventoryItem {
  id: string;
  pharmacyId: string;
  name: string;
  stock: number;
  price: number;
  category: string;
  sku: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'appointment' | 'record' | 'order' | 'security' | 'system' | 'emergency';
  isRead: boolean;
  timestamp: string;
}

export interface HealthGoal {
  id: string;
  patientId: string;
  type: 'Steps' | 'Water' | 'Sleep' | 'Calories';
  target: number;
  current: number;
  unit: string;
}

import { MedicalReportRecord, SharedReportRecord } from '../types';

export interface AccessRequest {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  healthId: string;
}

export interface AccessLog {
  id: string;
  patientId?: string;
  healthId: string;
  accessorRole: 'PUBLIC' | 'DOCTOR' | 'PATIENT' | 'EMERGENCY';
  accessType: 'PUBLIC_EMERGENCY_LOOKUP' | 'EMERGENCY_MODE_INSTANT' | 'DOCTOR_CLINICAL_FULL';
  accessedAt: string;
}

export interface PatientProfile {
  userId: string;
  jivexaHealthId?: string;
  bloodGroup: string;
  allergies: string;
  conditions: string;
  emergencyContact: string;
  emergencySharingEnabled?: boolean;
  emergencyAccessExpiry?: string;
}

export interface AmbulanceVehicle {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerPhone: string;
  vehicleNumber: string;
  type: 'Basic' | 'Oxygen' | 'ICU' | 'ALS';
  availability: 'Available' | 'Offline' | 'Busy';
  latitude: number;
  longitude: number;
  hospitalPartner: string;
  rating: number;
  baseFare: number;
}

export interface AmbulanceBooking {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  jivexaHealthId?: string;
  ambulanceId?: string;
  ambulanceType: 'Basic' | 'Oxygen' | 'ICU' | 'ALS';
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  pickupAddress: string;
  destinationAddress: string;
  pickupLat: number;
  pickupLng: number;
  destLat: number;
  destLng: number;
  status: 'Pending' | 'Accepted' | 'Arrived' | 'In Transit' | 'Completed' | 'Cancelled';
  fare: number;
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
}

interface HealthDataContextType {
  doctors: Doctor[];
  pharmacies: Pharmacy[];
  appointments: Appointment[];
  healthRecords: HealthRecord[];
  prescriptions: Prescription[];
  orders: Order[];
  inventory: InventoryItem[];
  notifications: Notification[];
  healthGoals: HealthGoal[];
  patientProfile: PatientProfile | null;
  medicalReports: MedicalReportRecord[];
  sharedReports: SharedReportRecord[];
  accessRequests: AccessRequest[];
  accessLogs: AccessLog[];
  ambulances: AmbulanceVehicle[];
  ambulanceBookings: AmbulanceBooking[];
  
  // Patient operations
  bookAppointment: (doctorId: string, date: string, time: string, notes: string) => Promise<{ success: boolean; appointment?: Appointment }>;
  cancelAppointment: (id: string) => void;
  rescheduleAppointment: (id: string, date: string, time: string) => void;
  uploadHealthRecord: (name: string, type: HealthRecord['type'], fileName: string, fileSize: string) => Promise<{ success: boolean }>;
  deleteHealthRecord: (id: string) => void;
  placePharmacyOrder: (pharmacyId: string, items: OrderItem[], prescriptionId?: string) => Promise<{ success: boolean; order?: Order }>;
  updatePatientProfile: (data: Partial<PatientProfile>) => void;
  saveAnalyzedReport: (report: MedicalReportRecord) => void;
  shareReportWithDoctor: (reportId: string, doctorId: string) => Promise<{ success: boolean }>;
  
  // JHID & Consent Access Operations
  generateOrGetHealthId: (userId: string) => string;
  searchPatientByHealthId: (healthId: string) => Promise<{ success: boolean; patientInfo?: any; error?: string }>;
  getPublicHealthIdProfile: (healthId: string) => Promise<{ success: boolean; publicProfile?: any; error?: string }>;
  toggleEmergencyAccessMode: (enabled: boolean, durationHours?: number) => Promise<{ success: boolean }>;
  requestPatientAccess: (healthId: string) => Promise<{ success: boolean; error?: string }>;
  respondAccessRequest: (requestId: string, status: 'approved' | 'rejected') => Promise<{ success: boolean }>;
  revokeDoctorAccess: (doctorId: string) => Promise<{ success: boolean }>;

  // Ambulance Network Operations
  bookAmbulance: (details: { ambulanceType: 'Basic' | 'Oxygen' | 'ICU' | 'ALS'; pickupAddress: string; destinationAddress: string; pickupLat: number; pickupLng: number; destLat: number; destLng: number; fare: number }) => Promise<{ success: boolean; booking?: AmbulanceBooking }>;
  updateAmbulanceBookingStatus: (bookingId: string, status: AmbulanceBooking['status']) => Promise<{ success: boolean }>;
  toggleAmbulanceAvailability: (ambulanceId: string, availability: AmbulanceVehicle['availability']) => Promise<{ success: boolean }>;

  // Doctor operations
  completeConsultation: (appointmentId: string, summary: string, meds?: Medication[], notes?: string, followUpDate?: string, status?: Prescription['status']) => void;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => Promise<void>;
  
  // Pharmacy operations
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  updateInventoryStock: (itemId: string, stock: number) => void;
  
  // General
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (userId: string, message: string, type: Notification['type']) => void;
}

// --- INITIAL DEMO DATA ---
const INITIAL_DOCTORS: Doctor[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Dr. Anand Sen',
    specialty: 'Cardiologist',
    experience: 15,
    location: 'Indiranagar, Bengaluru',
    availability: 'Mon, Wed, Fri (10:00 AM - 4:00 PM)',
    consultationType: 'Both',
    rating: 4.9,
    education: 'MBBS, MD (Cardiology) - AIIMS Delhi',
    about: 'Dr. Anand Sen is a senior cardiologist with over 15 years of experience treating coronary artery disease, arrhythmias, and hypertension. He is dedicated to preventive cardiac care.',
    fee: 800,
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Dr. Priya Sharma',
    specialty: 'Pediatrician',
    experience: 12,
    location: 'Koramangala, Bengaluru',
    availability: 'Tue, Thu, Sat (9:00 AM - 1:00 PM)',
    consultationType: 'Both',
    rating: 4.8,
    education: 'MBBS, DCH - Bangalore Medical College',
    about: 'Dr. Priya Sharma is a passionate pediatrician specializing in childhood growth development, immunizations, and general pediatric illnesses.',
    fee: 600,
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Dr. Rajesh Patel',
    specialty: 'Dermatologist',
    experience: 10,
    location: 'Jayanagar, Bengaluru',
    availability: 'Mon - Fri (5:00 PM - 8:00 PM)',
    consultationType: 'Video',
    rating: 4.7,
    education: 'MBBS, MD (Dermatology) - KEM Hospital Mumbai',
    about: 'Dr. Rajesh Patel focuses on skin cancer screening, acne management, eczema treatment, and clinical hair fall therapies.',
    fee: 700,
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Dr. Meera Nair',
    specialty: 'General Physician',
    experience: 8,
    location: 'Whitefield, Bengaluru',
    availability: 'Mon - Sat (9:00 AM - 5:00 PM)',
    consultationType: 'Both',
    rating: 4.6,
    education: 'MBBS - Madras Medical College',
    about: 'Dr. Meera Nair handles primary healthcare concerns, metabolic management, infectious diseases, and routine health assessments.',
    fee: 500,
  }
];

const INITIAL_PHARMACIES: Pharmacy[] = [
  { id: '00000000-0000-0000-0000-000000000011', name: 'Jivexa Pharmacy Hub', address: 'Indiranagar Main Rd, Bengaluru', rating: 4.8, phone: '+91 80 4123 4567' },
  { id: '00000000-0000-0000-0000-000000000012', name: 'Apollo Pharmacy', address: 'Koramangala 8th Block, Bengaluru', rating: 4.5, phone: '+91 80 4987 6543' },
  { id: '00000000-0000-0000-0000-000000000013', name: 'MedPlus Pharmacy', address: 'Jayanagar 4th Block, Bengaluru', rating: 4.6, phone: '+91 80 4356 7890' }
];

const INITIAL_INVENTORY = (pharmId: string): InventoryItem[] => [
  { id: `${pharmId}_inv_1`, pharmacyId: pharmId, name: 'Paracetamol 500mg', stock: 120, price: 15, category: 'Analgesics', sku: 'sku-para-500' },
  { id: `${pharmId}_inv_2`, pharmacyId: pharmId, name: 'Amoxicillin 250mg', stock: 85, price: 65, category: 'Antibiotics', sku: 'sku-amox-250' },
  { id: `${pharmId}_inv_3`, pharmacyId: pharmId, name: 'Cetirizine 10mg', stock: 200, price: 20, category: 'Antihistamines', sku: 'sku-ceti-10' },
  { id: `${pharmId}_inv_4`, pharmacyId: pharmId, name: 'Metformin 500mg', stock: 150, price: 40, category: 'Anti-Diabetic', sku: 'sku-metf-500' },
  { id: `${pharmId}_inv_5`, pharmacyId: pharmId, name: 'Atorvastatin 10mg', stock: 95, price: 80, category: 'Cardiovascular', sku: 'sku-ator-10' }
];

const HealthDataContext = createContext<HealthDataContextType | undefined>(undefined);

export const HealthDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id || '';
  const userName = user?.name || '';

  // State slices
  const [doctors, setDoctors] = useState<Doctor[]>(INITIAL_DOCTORS);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>(INITIAL_PHARMACIES);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [healthGoals, setHealthGoals] = useState<HealthGoal[]>([]);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);

  const [medicalReports, setMedicalReports] = useState<MedicalReportRecord[]>(() => {
    const saved = localStorage.getItem('jivexa_db_medical_reports');
    return saved ? JSON.parse(saved) : [];
  });

  const [sharedReports, setSharedReports] = useState<SharedReportRecord[]>(() => {
    const saved = localStorage.getItem('jivexa_db_shared_reports');
    return saved ? JSON.parse(saved) : [];
  });

  const saveAnalyzedReport = (report: MedicalReportRecord) => {
    setMedicalReports((prev) => {
      const updated = [report, ...prev.filter((r) => r.id !== report.id)];
      localStorage.setItem('jivexa_db_medical_reports', JSON.stringify(updated));
      return updated;
    });
  };

  const shareReportWithDoctor = async (reportId: string, doctorId: string): Promise<{ success: boolean }> => {
    const report = medicalReports.find((r) => r.id === reportId);
    const doc = doctors.find((d) => d.id === doctorId);
    if (!report || !doc) return { success: false };

    const sharedRecord: SharedReportRecord = {
      id: `shared_${Date.now()}`,
      reportId: report.id,
      patientId: userId,
      patientName: userName || 'Patient',
      doctorId: doc.id,
      doctorName: doc.name,
      sharedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      reviewStatus: 'Pending Review',
      reportTitle: report.fileName,
      analysisSummary: report.analysis?.summary || 'AI Medical Report Analysis',
      healthScore: report.analysis?.healthScore || 85
    };

    setSharedReports((prev) => {
      const updated = [sharedRecord, ...prev];
      localStorage.setItem('jivexa_db_shared_reports', JSON.stringify(updated));
      return updated;
    });

    await addNotification(doc.id, `Patient ${userName || 'Patient'} shared a new AI Medical Report (${report.fileName}) for your review.`, 'record');

    return { success: true };
  };

  // Sync utilities for mock mode
  const syncAppointments = (list: Appointment[]) => {
    setAppointments(list);
    localStorage.setItem('jivexa_db_appointments', JSON.stringify(list));
  };

  const syncRecords = (list: HealthRecord[]) => {
    setHealthRecords(list);
    localStorage.setItem('jivexa_db_records', JSON.stringify(list));
  };

  const syncPrescriptions = (list: Prescription[]) => {
    setPrescriptions(list);
    localStorage.setItem('jivexa_db_prescriptions', JSON.stringify(list));
  };

  const syncOrders = (list: Order[]) => {
    setOrders(list);
    localStorage.setItem('jivexa_db_orders', JSON.stringify(list));
  };

  const syncInventory = (list: InventoryItem[]) => {
    setInventory(list);
    localStorage.setItem('jivexa_db_inventory', JSON.stringify(list));
  };

  const syncNotifications = (list: Notification[]) => {
    setNotifications(list);
    localStorage.setItem(`jivexa_notifications_${userId}`, JSON.stringify(list));
  };

  // Load database from localStorage or Supabase on mount and whenever userId changes
  useEffect(() => {
    if (!userId) return;

    if (!isSupabaseConfigured) {
      // Load or initialize Patient profile
      const savedProfile = localStorage.getItem(`jivexa_profile_${userId}`);
      if (savedProfile) {
        setPatientProfile(JSON.parse(savedProfile));
      } else {
        const defaultProfile: PatientProfile = {
          userId,
          bloodGroup: 'O+ Positive',
          allergies: 'Peanuts, Penicillin (mild)',
          conditions: 'Mild Asthma',
          emergencyContact: 'Amit Gangwar (+91 99887 76655)',
        };
        setPatientProfile(defaultProfile);
        localStorage.setItem(`jivexa_profile_${userId}`, JSON.stringify(defaultProfile));
      }

      // Fetch permanent MongoDB Health ID
      if (user && user.role === 'PATIENT') {
        getMyHealthIdApi().then((res) => {
          if (res.success && res.healthId) {
            setPatientProfile((prev) => {
              const updated: PatientProfile = {
                ...(prev || { userId }),
                jivexaHealthId: res.healthId,
                bloodGroup: res.patient?.bloodGroup || prev?.bloodGroup || 'O+ Positive',
                allergies: (res.patient?.healthProfile && res.patient?.healthProfile.allergies) || prev?.allergies || 'Peanuts, Penicillin (mild)',
                conditions: (res.patient?.healthProfile && res.patient?.healthProfile.conditions) || prev?.conditions || 'Mild Asthma',
                emergencyContact: (res.patient?.phoneNumber || res.patient?.email) || prev?.emergencyContact || 'Amit Gangwar (+91 99887 76655)'
              };
              localStorage.setItem(`jivexa_profile_${userId}`, JSON.stringify(updated));
              return updated;
            });
          }
        }).catch((e) => {
          console.warn('[HealthDataContext] Could not fetch MongoDB Health ID:', e);
        });
      }

      // Load or initialize Appointments
      const savedAppts = localStorage.getItem('jivexa_db_appointments');
      if (savedAppts) {
        setAppointments(JSON.parse(savedAppts));
      } else {
        const defaultAppts: Appointment[] = [
          {
            id: 'appt_1',
            patientId: 'user_patient_001',
            patientName: 'Mayank Gangwar',
            doctorId: '00000000-0000-0000-0000-000000000001',
            doctorName: 'Dr. Anand Sen',
            doctorSpecialty: 'Cardiologist',
            date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days in future
            time: '10:30 AM',
            status: 'Upcoming',
            notes: 'Routine health checkup and consultation regarding chest pressure logs.'
          },
          {
            id: 'appt_2',
            patientId: 'user_patient_001',
            patientName: 'Mayank Gangwar',
            doctorId: '00000000-0000-0000-0000-000000000003',
            doctorName: 'Dr. Rajesh Patel',
            doctorSpecialty: 'Dermatologist',
            date: '2026-07-20',
            time: '05:30 PM',
            status: 'Completed',
            notes: 'Follow-up for eczema rash.',
            consultationSummary: 'Eczema shows improvement. Advised to continue moisturizing twice daily. Discontinued topical steroids as skin cleared up.'
          }
        ];
        setAppointments(defaultAppts);
        localStorage.setItem('jivexa_db_appointments', JSON.stringify(defaultAppts));
      }

      // Load or initialize Records
      const savedRecords = localStorage.getItem('jivexa_db_records');
      if (savedRecords) {
        setHealthRecords(JSON.parse(savedRecords));
      } else {
        const defaultRecords: HealthRecord[] = [
          {
            id: 'rec_1',
            patientId: 'user_patient_001',
            name: 'Lipid Profile Blood Test Log',
            type: 'Lab Report',
            date: '2026-06-15',
            fileName: 'lipid_profile_june26.pdf',
            fileSize: '1.2 MB',
            fileUrl: '#',
            uploadedBy: 'Patient'
          },
          {
            id: 'rec_2',
            patientId: 'user_patient_001',
            name: 'ECG Electrocardiogram Log',
            type: 'Lab Report',
            date: '2026-07-02',
            fileName: 'ecg_reading.png',
            fileSize: '820 KB',
            fileUrl: '#',
            uploadedBy: 'Jivexa Diagnostics'
          }
        ];
        setHealthRecords(defaultRecords);
        localStorage.setItem('jivexa_db_records', JSON.stringify(defaultRecords));
      }

      // Load or initialize Prescriptions
      const savedPrescriptions = localStorage.getItem('jivexa_db_prescriptions');
      if (savedPrescriptions) {
        setPrescriptions(JSON.parse(savedPrescriptions));
      } else {
        const defaultPrescriptions: Prescription[] = [
          {
            id: 'pres_1',
            patientId: 'user_patient_001',
            patientName: 'Mayank Gangwar',
            doctorId: '00000000-0000-0000-0000-000000000003',
            doctorName: 'Dr. Rajesh Patel',
            date: '2026-07-20',
            medications: [
              { name: 'Cetirizine 10mg', dosage: '1 tablet', frequency: 'Once daily at night', duration: '10 Days', instructions: 'Take after dinner' },
              { name: 'Hydrocortisone Cream 1%', dosage: 'Thin layer', frequency: 'Twice daily', duration: '7 Days', instructions: 'Apply to affected areas only' }
            ],
            notes: 'Keep skin hydrated. Avoid heavily scented body washes.',
            status: 'Issued',
            followUpDate: '2026-08-10'
          }
        ];
        setPrescriptions(defaultPrescriptions);
        localStorage.setItem('jivexa_db_prescriptions', JSON.stringify(defaultPrescriptions));
      }

      // Load or initialize Inventory
      const savedInv = localStorage.getItem('jivexa_db_inventory');
      if (savedInv) {
        setInventory(JSON.parse(savedInv));
      } else {
        const defaultInv = INITIAL_PHARMACIES.reduce<InventoryItem[]>((acc, p) => {
          return [...acc, ...INITIAL_INVENTORY(p.id)];
        }, []);
        setInventory(defaultInv);
        localStorage.setItem('jivexa_db_inventory', JSON.stringify(defaultInv));
      }

      // Load or initialize Orders
      const savedOrders = localStorage.getItem('jivexa_db_orders');
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      } else {
        const defaultOrders: Order[] = [
          {
            id: 'ord_1',
            patientId: 'user_patient_001',
            patientName: 'Mayank Gangwar',
            pharmacyId: '00000000-0000-0000-0000-000000000011',
            pharmacyName: 'Jivexa Pharmacy Hub',
            status: 'Completed',
            items: [
              { name: 'Cetirizine 10mg', quantity: 1, price: 20 },
              { name: 'Paracetamol 500mg', quantity: 2, price: 15 }
            ],
            totalPrice: 50,
            date: '2026-07-21',
            prescriptionId: 'pres_1'
          }
        ];
        setOrders(defaultOrders);
        localStorage.setItem('jivexa_db_orders', JSON.stringify(defaultOrders));
      }

      // Load or initialize Health Goals
      const savedGoals = localStorage.getItem(`jivexa_goals_${userId}`);
      if (savedGoals) {
        setHealthGoals(JSON.parse(savedGoals));
      } else {
        const defaultGoals: HealthGoal[] = [
          { id: 'goal_1', patientId: userId, type: 'Steps', target: 8000, current: 5420, unit: 'steps' },
          { id: 'goal_2', patientId: userId, type: 'Water', target: 3000, current: 1800, unit: 'ml' }
        ];
        setHealthGoals(defaultGoals);
        localStorage.setItem(`jivexa_goals_${userId}`, JSON.stringify(defaultGoals));
      }

      // Load or initialize Notifications
      const savedNotifications = localStorage.getItem(`jivexa_notifications_${userId}`);
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      } else {
        const defaultNotifications: Notification[] = [
          {
            id: 'notif_1',
            userId,
            message: 'Welcome to JIVEXA Health OS! Complete your profile configuration to share details with doctors.',
            type: 'system',
            isRead: false,
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
          },
          {
            id: 'notif_2',
            userId,
            message: 'Appointment booked successfully with Dr. Anand Sen.',
            type: 'appointment',
            isRead: true,
            timestamp: new Date(Date.now() - 86400000).toISOString()
          }
        ];
        setNotifications(defaultNotifications);
        localStorage.setItem(`jivexa_notifications_${userId}`, JSON.stringify(defaultNotifications));
      }
      return;
    }

    // Real Supabase Data Loader
    const loadSupabaseData = async () => {
      try {
        // 1. Fetch doctors directory
        const { data: rawDocs } = await supabase!
          .from('doctors')
          .select(`
            user_id, specialty, experience_years, bio, education, clinic_address, consultation_fee, availability_slots, average_rating,
            profiles(full_name)
          `);
        
        if (rawDocs) {
          const mappedDocs = rawDocs.map((rd: any) => ({
            id: rd.user_id,
            name: rd.profiles?.full_name || 'Dr. Practitioner',
            specialty: rd.specialty,
            experience: rd.experience_years,
            location: rd.clinic_address || 'Clinic',
            availability: rd.availability_slots?.slots?.[0] || 'Mon - Fri (9:00 AM - 5:00 PM)',
            consultationType: 'Both' as const,
            rating: Number(rd.average_rating) || 5.0,
            education: rd.education || 'MBBS',
            about: rd.bio || 'General Practitioner',
            fee: rd.consultation_fee
          }));
          setDoctors(mappedDocs);
        }

        // 2. Fetch pharmacies directory
        const { data: rawPharms } = await supabase!
          .from('pharmacies')
          .select('user_id, name, address, phone, rating');
        
        if (rawPharms) {
          const mappedPharms = rawPharms.map((rp: any) => ({
            id: rp.user_id,
            name: rp.name,
            address: rp.address,
            rating: Number(rp.rating) || 5.0,
            phone: rp.phone
          }));
          setPharmacies(mappedPharms);
        }

        // 3. Fetch Patient Profile
        const { data: profile } = await supabase!
          .from('patients')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (profile) {
          setPatientProfile({
            userId: profile.user_id,
            bloodGroup: profile.blood_group || 'O+',
            allergies: profile.allergies || 'None logged',
            conditions: profile.chronic_conditions || 'None logged',
            emergencyContact: profile.emergency_contact || 'None logged'
          });
        } else if (user?.role === 'PATIENT') {
          const defaultProfile = {
            user_id: userId,
            blood_group: 'O+ Positive',
            allergies: 'None logged',
            chronic_conditions: 'None logged',
            emergency_contact: 'None logged',
            onboarding_completed: false
          };
          await supabase!.from('patients').insert(defaultProfile);
          setPatientProfile({
            userId,
            bloodGroup: defaultProfile.blood_group,
            allergies: defaultProfile.allergies,
            conditions: defaultProfile.chronic_conditions,
            emergencyContact: defaultProfile.emergency_contact
          });
        }

        // 4. Fetch Appointments
        const { data: rawAppts } = await supabase!
          .from('appointments')
          .select(`
            id, patient_id, doctor_id, slot_date, slot_time, status, intake_notes, consultation_summary,
            patient:patients(user_id, profiles(full_name)),
            doctor:doctors(user_id, specialty, profiles(full_name))
          `)
          .or(`patient_id.eq.${userId},doctor_id.eq.${userId}`)
          .order('slot_date', { ascending: false });

        if (rawAppts) {
          const mappedAppts = rawAppts.map((ra: any) => ({
            id: ra.id,
            patientId: ra.patient_id,
            patientName: ra.patient?.profiles?.full_name || 'Patient',
            doctorId: ra.doctor_id,
            doctorName: ra.doctor?.profiles?.full_name || 'Doctor',
            doctorSpecialty: ra.doctor?.specialty || 'General Practitioner',
            date: ra.slot_date,
            time: ra.slot_time,
            status: ra.status,
            notes: ra.intake_notes,
            consultationSummary: ra.consultation_summary
          }));
          setAppointments(mappedAppts);
        }

        // 5. Fetch Health Records & Medical Documents
        const { data: docs } = await supabase!
          .from('medical_documents')
          .select('*')
          .eq('patient_id', userId)
          .order('created_at', { ascending: false });
        if (docs) {
          const mappedRecs = docs.map((d: any) => ({
            id: d.id,
            patientId: d.patient_id,
            name: d.name,
            type: d.document_type,
            date: d.created_at.split('T')[0],
            fileName: d.name,
            fileSize: d.file_size || 'Unknown',
            fileUrl: d.storage_path,
            uploadedBy: 'Uploaded'
          }));
          setHealthRecords(mappedRecs);
        }

        // 6. Fetch Prescriptions & Medications
        const { data: prescs } = await supabase!
          .from('prescriptions')
          .select(`
            id, appointment_id, patient_id, doctor_id, issued_date, notes, status, follow_up_date,
            patient:patients(profiles(full_name)),
            doctor:doctors(profiles(full_name)),
            medications(*)
          `)
          .or(`patient_id.eq.${userId},doctor_id.eq.${userId}`)
          .order('created_at', { ascending: false });

        if (prescs) {
          const mappedPres = prescs.map((rp: any) => ({
            id: rp.id,
            patientId: rp.patient_id,
            patientName: rp.patient?.profiles?.full_name || 'Patient',
            doctorId: rp.doctor_id,
            doctorName: rp.doctor?.profiles?.full_name || 'Doctor',
            date: rp.issued_date,
            notes: rp.notes,
            status: rp.status || 'Issued',
            followUpDate: rp.follow_up_date || undefined,
            medications: rp.medications.map((m: any) => ({
              name: m.medicine_name,
              dosage: m.dosage,
              frequency: m.frequency,
              duration: m.duration,
              instructions: m.special_instructions
            }))
          }));
          setPrescriptions(mappedPres);
        }

        // 7. Fetch Inventory
        let invQuery = supabase!.from('inventory').select('id, pharmacy_id, medicine_name, stock_count, price, category, sku');
        if (user?.role === 'PHARMACY') {
          invQuery = invQuery.eq('pharmacy_id', userId);
        }
        const { data: rawInv } = await invQuery;
        if (rawInv) {
          setInventory(rawInv.map((ri: any) => ({
            id: ri.id,
            pharmacyId: ri.pharmacy_id,
            name: ri.medicine_name,
            stock: ri.stock_count,
            price: ri.price,
            category: ri.category || 'General',
            sku: ri.sku
          })));
        }

        // 8. Fetch Orders
        let ordQuery = supabase!.from('orders').select(`
          id, patient_id, pharmacy_id, prescription_id, total_price, status, created_at,
          patient:patients(profiles(full_name)),
          pharmacy:pharmacies(name),
          order_items(*)
        `);
        if (user?.role === 'PATIENT') {
          ordQuery = ordQuery.eq('patient_id', userId);
        } else if (user?.role === 'PHARMACY') {
          ordQuery = ordQuery.eq('pharmacy_id', userId);
        }
        const { data: rawOrders } = await ordQuery.order('created_at', { ascending: false });
        if (rawOrders) {
          const mappedOrders = rawOrders.map((ro: any) => ({
            id: ro.id,
            patientId: ro.patient_id,
            patientName: ro.patient?.profiles?.full_name || 'Patient',
            pharmacyId: ro.pharmacy_id,
            pharmacyName: ro.pharmacy?.name || 'Pharmacy',
            status: ro.status,
            totalPrice: ro.total_price,
            date: ro.created_at.split('T')[0],
            prescriptionId: ro.prescription_id,
            items: ro.order_items.map((oi: any) => ({
              name: oi.name,
              quantity: oi.quantity,
              price: oi.price
            }))
          }));
          setOrders(mappedOrders);
        }

        // 9. Fetch Health Goals
        if (user?.role === 'PATIENT') {
          const { data: goals } = await supabase!
            .from('health_goals')
            .select('*')
            .eq('patient_id', userId);
          if (goals) {
            setHealthGoals(goals.map((g: any) => ({
              id: g.id,
              patientId: g.patient_id,
              type: g.metric_type,
              target: g.target_value,
              current: g.current_value,
              unit: g.metric_unit
            })));
          }
        }

        // 10. Fetch Notifications
        const { data: notifs } = await supabase!
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (notifs) {
          setNotifications(notifs.map((n: any) => ({
            id: n.id,
            userId: n.user_id,
            message: n.message,
            type: n.category,
            isRead: n.is_read,
            timestamp: n.created_at
          })));
        }

      } catch (err) {
        console.error("Error loading profile details from Supabase", err);
      }
    };

    loadSupabaseData();
  }, [userId]);

  // --- ACTIONS ---

  const bookAppointment = async (doctorId: string, date: string, time: string, notes: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const doctor = doctors.find((d) => d.id === doctorId);
    if (!doctor) return { success: false };

    const appointmentData = {
      patient_id: userId,
      doctor_id: doctorId,
      slot_date: date,
      slot_time: time,
      status: 'Upcoming',
      intake_notes: notes
    };

    let newAppt: Appointment;

    if (!isSupabaseConfigured) {
      newAppt = {
        id: `appt_${Date.now()}`,
        patientId: userId,
        patientName: userName,
        doctorId,
        doctorName: doctor.name,
        doctorSpecialty: doctor.specialty,
        date,
        time,
        status: 'Upcoming',
        notes
      };
      const updated = [newAppt, ...appointments];
      syncAppointments(updated);
    } else {
      try {
        const { data, error } = await supabase!
          .from('appointments')
          .insert(appointmentData)
          .select(`
            id, patient_id, doctor_id, slot_date, slot_time, status, intake_notes,
            patient:patients(profiles(full_name)),
            doctor:doctors(profiles(full_name), specialty)
          `)
          .single();

        if (error) throw error;

        const apptData = data as any;
        newAppt = {
          id: apptData.id,
          patientId: apptData.patient_id,
          patientName: apptData.patient?.profiles?.full_name || userName,
          doctorId: apptData.doctor_id,
          doctorName: apptData.doctor?.profiles?.full_name || doctor.name,
          doctorSpecialty: apptData.doctor?.specialty || doctor.specialty,
          date: apptData.slot_date,
          time: apptData.slot_time,
          status: apptData.status,
          notes: apptData.intake_notes
        };
        setAppointments((prev) => [newAppt, ...prev]);
      } catch (err) {
        console.error("Supabase booking failed", err);
        return { success: false };
      }
    }

    addNotification(userId, `Appointment scheduled with ${doctor.name} on ${date} at ${time}.`, 'appointment');
    addNotification(doctorId, `New appointment request from ${userName} on ${date} at ${time}.`, 'appointment');

    return { success: true, appointment: newAppt };
  };

  const cancelAppointment = async (id: string) => {
    const appt = appointments.find((a) => a.id === id);
    if (!appt) return;

    if (!isSupabaseConfigured) {
      const updated = appointments.map((a) => a.id === id ? { ...a, status: 'Cancelled' as const } : a);
      syncAppointments(updated);
    } else {
      try {
        const { error } = await supabase!
          .from('appointments')
          .update({ status: 'Cancelled' })
          .eq('id', id);
        if (error) throw error;
        setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status: 'Cancelled' as const } : a));
      } catch (err) {
        console.error("Cancel appointment in Supabase failed", err);
      }
    }

    addNotification(userId, `Appointment with ${appt.doctorName} has been cancelled.`, 'appointment');
    addNotification(appt.doctorId, `Appointment with ${userName} has been cancelled.`, 'appointment');
  };

  const rescheduleAppointment = async (id: string, date: string, time: string) => {
    const appt = appointments.find((a) => a.id === id);
    if (!appt) return;

    if (!isSupabaseConfigured) {
      const updated = appointments.map((a) => a.id === id ? { ...a, date, time, status: 'Upcoming' as const } : a);
      syncAppointments(updated);
    } else {
      try {
        const { error } = await supabase!
          .from('appointments')
          .update({ slot_date: date, slot_time: time, status: 'Upcoming' })
          .eq('id', id);
        if (error) throw error;
        setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, date, time, status: 'Upcoming' as const } : a));
      } catch (err) {
        console.error("Reschedule appointment in Supabase failed", err);
      }
    }

    addNotification(userId, `Appointment with ${appt.doctorName} rescheduled to ${date} at ${time}.`, 'appointment');
    addNotification(appt.doctorId, `Appointment with ${userName} rescheduled to ${date} at ${time}.`, 'appointment');
  };

  const uploadHealthRecord = async (name: string, type: HealthRecord['type'], fileName: string, fileSize: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    let newRecord: HealthRecord;

    if (!isSupabaseConfigured) {
      newRecord = {
        id: `rec_${Date.now()}`,
        patientId: userId,
        name,
        type,
        date: new Date().toISOString().split('T')[0],
        fileName,
        fileSize,
        fileUrl: '#',
        uploadedBy: 'Patient'
      };
      const updated = [newRecord, ...healthRecords];
      syncRecords(updated);
    } else {
      try {
        const { data, error } = await supabase!
          .from('medical_documents')
          .insert({
            patient_id: userId,
            name,
            document_type: type,
            storage_path: `documents/${userId}/${fileName}`, 
            file_size: fileSize,
            uploaded_by: userId
          })
          .select('*')
          .single();

        if (error) throw error;

        newRecord = {
          id: data.id,
          patientId: data.patient_id,
          name: data.name,
          type: data.document_type,
          date: data.created_at.split('T')[0],
          fileName: data.name,
          fileSize: data.file_size || 'Unknown',
          fileUrl: data.storage_path,
          uploadedBy: 'Patient'
        };
        setHealthRecords((prev) => [newRecord, ...prev]);
      } catch (err) {
        console.error("Supabase record upload failed", err);
        return { success: false };
      }
    }

    addNotification(userId, `Document "${name}" uploaded successfully.`, 'record');
    return { success: true };
  };

  const deleteHealthRecord = async (id: string) => {
    const rec = healthRecords.find((r) => r.id === id);
    const name = rec ? rec.name : 'Record';
    
    if (!isSupabaseConfigured) {
      const updated = healthRecords.filter((r) => r.id !== id);
      syncRecords(updated);
    } else {
      try {
        const { error } = await supabase!
          .from('medical_documents')
          .delete()
          .eq('id', id);
        if (error) throw error;
        setHealthRecords((prev) => prev.filter((r) => r.id !== id));
      } catch (err) {
        console.error("Delete document failed", err);
      }
    }

    addNotification(userId, `Document "${name}" was deleted.`, 'record');
  };

  const placePharmacyOrder = async (pharmacyId: string, items: OrderItem[], prescriptionId?: string) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const pharmacy = pharmacies.find((p) => p.id === pharmacyId);
    if (!pharmacy) return { success: false };

    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let newOrder: Order;

    if (!isSupabaseConfigured) {
      newOrder = {
        id: `ord_${Date.now()}`,
        patientId: userId,
        patientName: userName,
        pharmacyId,
        pharmacyName: pharmacy.name,
        status: 'Pending',
        items,
        totalPrice,
        date: new Date().toISOString().split('T')[0],
        prescriptionId
      };
      const updated = [newOrder, ...orders];
      syncOrders(updated);
    } else {
      try {
        const { data: orderData, error: orderErr } = await supabase!
          .from('orders')
          .insert({
            patient_id: userId,
            pharmacy_id: pharmacyId,
            prescription_id: prescriptionId || null,
            total_price: totalPrice,
            status: 'Pending'
          })
          .select(`
            id, patient_id, pharmacy_id, prescription_id, total_price, status, created_at,
            patient:patients(profiles(full_name)),
            pharmacy:pharmacies(name)
          `)
          .single();

        if (orderErr) throw orderErr;

        const itemRows = items.map((it) => ({
          order_id: orderData.id,
          name: it.name,
          quantity: it.quantity,
          price: it.price
        }));
        const { error: itemsErr } = await supabase!
          .from('order_items')
          .insert(itemRows);

        if (itemsErr) throw itemsErr;

        const rawOrder = orderData as any;
        newOrder = {
          id: rawOrder.id,
          patientId: rawOrder.patient_id,
          patientName: rawOrder.patient?.profiles?.full_name || userName,
          pharmacyId: rawOrder.pharmacy_id,
          pharmacyName: rawOrder.pharmacy?.name || pharmacy.name,
          status: rawOrder.status,
          items,
          totalPrice: rawOrder.total_price,
          date: rawOrder.created_at.split('T')[0],
          prescriptionId: rawOrder.prescription_id
        };
        setOrders((prev) => [newOrder, ...prev]);
      } catch (err) {
        console.error("Place order failed in Supabase", err);
        return { success: false };
      }
    }

    addNotification(userId, `Order placed successfully at ${pharmacy.name}. Total: ₹${totalPrice}.`, 'order');
    addNotification(pharmacyId, `New order received from ${userName}.`, 'order');

    return { success: true, order: newOrder };
  };

  const updatePatientProfile = async (data: Partial<PatientProfile>) => {
    if (!patientProfile) return;

    if (!isSupabaseConfigured) {
      const updated = { ...patientProfile, ...data };
      setPatientProfile(updated);
      localStorage.setItem(`jivexa_profile_${userId}`, JSON.stringify(updated));
    } else {
      try {
        const { error } = await supabase!
          .from('patients')
          .update({
            blood_group: data.bloodGroup,
            allergies: data.allergies,
            chronic_conditions: data.conditions,
            emergency_contact: data.emergencyContact
          })
          .eq('user_id', userId);
        if (error) throw error;
        setPatientProfile((prev) => prev ? { ...prev, ...data } : null);
      } catch (err) {
        console.error("Update patient profile failed", err);
      }
    }
    addNotification(userId, 'Health profile updated successfully.', 'system');
  };

  const completeConsultation = async (
    appointmentId: string, 
    summary: string, 
    meds: Medication[] = [], 
    notes = '', 
    followUpDate?: string,
    status?: Prescription['status']
  ) => {
    const appt = appointments.find((a) => a.id === appointmentId);
    if (!appt) return;

    if (!isSupabaseConfigured) {
      const updatedAppts = appointments.map((a) => 
        a.id === appointmentId 
          ? { ...a, status: 'Completed' as const, consultationSummary: summary } 
          : a
      );
      syncAppointments(updatedAppts);

      if (meds.length > 0 || notes || followUpDate) {
        const newPrescription: Prescription = {
          id: `pres_${Date.now()}`,
          patientId: appt.patientId,
          patientName: appt.patientName,
          doctorId: appt.doctorId,
          doctorName: appt.doctorName,
          date: new Date().toISOString().split('T')[0],
          medications: meds,
          notes,
          status: status || 'Issued',
          followUpDate
        };
        const updatedPres = [newPrescription, ...prescriptions];
        syncPrescriptions(updatedPres);

        if (status === 'Issued' || status === 'Active' || !status) {
          const newRecord: HealthRecord = {
            id: `rec_pres_${Date.now()}`,
            patientId: appt.patientId,
            name: `Prescription from ${appt.doctorName}`,
            type: 'Prescription',
            date: new Date().toISOString().split('T')[0],
            fileName: `prescription_${newPrescription.id}.pdf`,
            fileSize: '45 KB',
            fileUrl: '#',
            uploadedBy: appt.doctorName
          };
          syncRecords([newRecord, ...healthRecords]);
        }
        addNotification(appt.patientId, `New prescription ${status ? status.toLowerCase() : 'issued'} by ${appt.doctorName}.`, 'record');
      }
    } else {
      try {
        const { error: apptErr } = await supabase!
          .from('appointments')
          .update({ status: 'Completed', consultation_summary: summary })
          .eq('id', appointmentId);
        if (apptErr) throw apptErr;

        setAppointments((prev) => prev.map((a) => 
          a.id === appointmentId ? { ...a, status: 'Completed' as const, consultationSummary: summary } : a
        ));

        if (meds.length > 0 || notes || followUpDate) {
          const { data: presData, error: presErr } = await supabase!
            .from('prescriptions')
            .insert({
              appointment_id: appointmentId,
              patient_id: appt.patientId,
              doctor_id: appt.doctorId,
              notes,
              status: status || 'Issued',
              follow_up_date: followUpDate || null
            })
            .select('*')
            .single();

          if (presErr) throw presErr;

          if (meds.length > 0) {
            const medRows = meds.map((m) => ({
              prescription_id: presData.id,
              medicine_name: m.name,
              dosage: m.dosage,
              frequency: m.frequency,
              duration: m.duration,
              special_instructions: m.instructions || null
            }));

            const { error: medsErr } = await supabase!
              .from('medications')
              .insert(medRows);
            if (medsErr) throw medsErr;
          }

          if (status === 'Issued' || status === 'Active' || !status) {
            const { data: docData, error: docErr } = await supabase!
              .from('medical_documents')
              .insert({
                patient_id: appt.patientId,
                name: `Prescription from ${appt.doctorName}`,
                document_type: 'Prescription',
                storage_path: `prescriptions/${presData.id}.pdf`,
                file_size: '45 KB',
                uploaded_by: appt.doctorId
              })
              .select('*')
              .single();
            if (docErr) throw docErr;

            const newRecord: HealthRecord = {
              id: docData.id,
              patientId: docData.patient_id,
              name: docData.name,
              type: docData.document_type,
              date: docData.created_at.split('T')[0],
              fileName: `prescription_${presData.id}.pdf`,
              fileSize: '45 KB',
              fileUrl: docData.storage_path,
              uploadedBy: appt.doctorName
            };
            setHealthRecords((prev) => [newRecord, ...prev]);
          }

          const newPrescription: Prescription = {
            id: presData.id,
            patientId: appt.patientId,
            patientName: appt.patientName,
            doctorId: appt.doctorId,
            doctorName: appt.doctorName,
            date: presData.issued_date,
            medications: meds,
            notes,
            status: presData.status,
            followUpDate: presData.follow_up_date || undefined
          };
          setPrescriptions((prev) => [newPrescription, ...prev]);
          addNotification(appt.patientId, `New prescription ${status ? status.toLowerCase() : 'issued'} by ${appt.doctorName}.`, 'record');
        }
      } catch (err) {
        console.error("Consultation completion failed", err);
      }
    }

    addNotification(appt.patientId, `Consultation notes ready for your visit on ${appt.date} with ${appt.doctorName}.`, 'appointment');
    addNotification(appt.doctorId, `Consultation with ${appt.patientName} marked completed.`, 'appointment');
  };

  const updateAppointmentStatus = async (id: string, status: Appointment['status']) => {
    const appt = appointments.find((a) => a.id === id);
    if (!appt) return;

    if (!isSupabaseConfigured) {
      const updated = appointments.map((a) => a.id === id ? { ...a, status } : a);
      syncAppointments(updated);
      addNotification(appt.patientId, `Appointment status updated to ${status}.`, 'appointment');
      addNotification(appt.doctorId, `Appointment status updated to ${status}.`, 'appointment');
    } else {
      try {
        const { error } = await supabase!
          .from('appointments')
          .update({ status })
          .eq('id', id);
        if (error) throw error;
        setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
        addNotification(appt.patientId, `Appointment status updated to ${status}.`, 'appointment');
        addNotification(appt.doctorId, `Appointment status updated to ${status}.`, 'appointment');
      } catch (err) {
        console.error("Failed to update appointment status in Supabase", err);
      }
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    if (!isSupabaseConfigured) {
      const updated = orders.map((o) => o.id === orderId ? { ...o, status } : o);
      syncOrders(updated);
    } else {
      try {
        const { error } = await supabase!
          .from('orders')
          .update({ status })
          .eq('id', orderId);
        if (error) throw error;
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
      } catch (err) {
        console.error("Update order status failed", err);
      }
    }

    addNotification(order.patientId, `Your order status at ${order.pharmacyName} is now: ${status}.`, 'order');
    addNotification(order.pharmacyId, `Order ${orderId} updated to ${status}.`, 'order');
  };

  const updateInventoryStock = async (itemId: string, stock: number) => {
    if (!isSupabaseConfigured) {
      const updated = inventory.map((i) => i.id === itemId ? { ...i, stock } : i);
      syncInventory(updated);
    } else {
      try {
        const { error } = await supabase!
          .from('inventory')
          .update({ stock_count: stock })
          .eq('id', itemId);
        if (error) throw error;
        setInventory((prev) => prev.map((i) => i.id === itemId ? { ...i, stock } : i));
      } catch (err) {
        console.error("Inventory stock updates failed", err);
      }
    }
  };

  const markNotificationAsRead = async (id: string) => {
    if (!isSupabaseConfigured) {
      const updated = notifications.map((n) => n.id === id ? { ...n, isRead: true } : n);
      syncNotifications(updated);
    } else {
      try {
        const { error } = await supabase!
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id);
        if (error) throw error;
        setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
      } catch (err) {
        console.error("Mark notification read failed", err);
      }
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!isSupabaseConfigured) {
      const updated = notifications.map((n) => ({ ...n, isRead: true }));
      syncNotifications(updated);
    } else {
      try {
        const { error } = await supabase!
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', userId);
        if (error) throw error;
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } catch (err) {
        console.error("Mark all notifications read failed", err);
      }
    }
  };

  const addNotification = async (targetId: string, message: string, type: Notification['type']) => {
    const newNotif: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId: targetId,
      message,
      type,
      isRead: false,
      timestamp: new Date().toISOString()
    };

    if (!isSupabaseConfigured) {
      if (targetId === userId) {
        setNotifications((prev) => {
          const list = [newNotif, ...prev];
          localStorage.setItem(`jivexa_notifications_${userId}`, JSON.stringify(list));
          return list;
        });
      } else {
        const otherSaved = localStorage.getItem(`jivexa_notifications_${targetId}`);
        let otherList: Notification[] = [];
        if (otherSaved) {
          otherList = JSON.parse(otherSaved);
        }
        otherList.unshift(newNotif);
        localStorage.setItem(`jivexa_notifications_${targetId}`, JSON.stringify(otherList));
      }
      return;
    }

    try {
      const { data, error } = await supabase!
        .from('notifications')
        .insert({
          user_id: targetId,
          message,
          category: type
        })
        .select('*')
        .single();
      
      if (error) throw error;

      if (targetId === userId) {
        const addedNotif: Notification = {
          id: data.id,
          userId: data.user_id,
          message: data.message,
          type: data.category,
          isRead: data.is_read,
          timestamp: data.created_at
        };
        setNotifications((prev) => [addedNotif, ...prev]);
      }
    } catch (err) {
      console.error("Error creating notification", err);
    }
  };

  // --- JHID & CONSENT MANAGEMENT ---
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);

  const generateOrGetHealthId = (targetUserId: string): string => {
    if (patientProfile && patientProfile.userId === targetUserId && patientProfile.jivexaHealthId) {
      return patientProfile.jivexaHealthId;
    }
    let hash = 0;
    for (let i = 0; i < targetUserId.length; i++) {
      hash = (hash << 5) - hash + targetUserId.charCodeAt(i);
      hash |= 0;
    }
    const positiveHash = Math.abs(hash);
    const numPart = String((positiveHash * 997 + 100000) % 900000 + 100000);
    return `JIV-2026-${numPart}`;
  };

  const searchPatientByHealthId = async (healthId: string) => {
    const cleanId = healthId.trim().toUpperCase();
    
    // Sample patient diagnostic reports associated with Health ID
    const sampleReports = [
      {
        id: 'rep_cbc_01',
        name: 'Complete Blood Count (CBC) Panel & Hematology Analysis',
        type: 'Lab Report',
        date: '2026-08-10',
        fileSize: '2.4 MB',
        summary: 'Hemoglobin: 14.2 g/dL (Normal: 13.5-17.5). WBC: 7,200/mcL (Normal). Platelet Count: 250,000/mcL. Overall hematology profile is optimal.',
        score: 92,
        status: 'Verified Optimal'
      },
      {
        id: 'rep_xray_02',
        name: 'Digital Chest X-Ray (PA View) & AI Diagnostic Imaging Summary',
        type: 'Imaging / Radiology',
        date: '2026-07-28',
        fileSize: '5.8 MB',
        summary: 'Lungs clear bilaterally. No focal parenchymal consolidation, pleural effusion, or pneumothorax observed. Cardiac size within normal limits.',
        score: 96,
        status: 'Normal Diagnostic'
      },
      {
        id: 'rep_lipid_03',
        name: 'Comprehensive Lipid & Metabolic Function Profile',
        type: 'Lab Report',
        date: '2026-06-15',
        fileSize: '1.8 MB',
        summary: 'Total Cholesterol: 175 mg/dL (Desirable < 200). HDL: 52 mg/dL. LDL: 98 mg/dL. Triglycerides: 120 mg/dL. Fasting Glucose: 92 mg/dL.',
        score: 90,
        status: 'Normal'
      }
    ];

    // 1. Supabase Query
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: pData } = await supabase
          .from('patients')
          .select('user_id, jivexa_health_id, blood_group, allergies, chronic_conditions, profiles(full_name, phone, date_of_birth)')
          .eq('jivexa_health_id', cleanId)
          .maybeSingle();

        if (pData) {
          const pid = pData.user_id;
          return {
            success: true,
            patientInfo: {
              userId: pid,
              name: (pData.profiles as any)?.full_name || 'Patient User',
              healthId: cleanId,
              bloodGroup: pData.blood_group || 'O+ Positive',
              allergies: pData.allergies || 'Penicillin (mild)',
              conditions: pData.chronic_conditions || 'None logged',
              consentStatus: 'approved',
              reports: sampleReports
            }
          };
        }
      } catch (err) {
        console.error('Error searching patient by Health ID:', err);
      }
    }

    // 2. Local fallback check
    if (patientProfile && (patientProfile.jivexaHealthId === cleanId || generateOrGetHealthId(patientProfile.userId) === cleanId)) {
      return {
        success: true,
        patientInfo: {
          userId: patientProfile.userId,
          name: user?.name || 'Patient User',
          healthId: cleanId,
          bloodGroup: patientProfile.bloodGroup || 'O+ Positive',
          allergies: patientProfile.allergies || 'Penicillin (mild)',
          conditions: patientProfile.conditions || 'None logged',
          consentStatus: 'approved',
          reports: sampleReports
        }
      };
    }

    // Default mock patient search fallback for test / typed Health IDs (e.g., JIV-2026-255930, JIV-2026-849201, etc.)
    return {
      success: true,
      patientInfo: {
        userId: `usr_patient_${cleanId.replace(/[^A-Z0-9]/g, '')}`,
        name: 'Piyush Tiwari',
        healthId: cleanId,
        bloodGroup: 'O+ Positive',
        allergies: 'Penicillin (mild)',
        conditions: 'Thyroid, Mild Asthma',
        consentStatus: 'approved',
        reports: sampleReports
      }
    };
  };

  const requestPatientAccess = async (healthId: string) => {
    const cleanId = healthId.trim().toUpperCase();
    const searchRes = await searchPatientByHealthId(cleanId);
    if (!searchRes.success || !searchRes.patientInfo) {
      return { success: false, error: (searchRes as any).error || 'Patient not found.' };
    }

    const targetPatientId = searchRes.patientInfo.userId;
    const docName = user?.name || 'Dr. Practitioner';

    const newReq: AccessRequest = {
      id: `req_${Date.now()}`,
      patientId: targetPatientId,
      patientName: searchRes.patientInfo.name,
      doctorId: userId,
      doctorName: docName,
      doctorSpecialty: 'Specialist Physician',
      status: 'pending',
      createdAt: new Date().toISOString(),
      healthId: cleanId
    };

    setAccessRequests((prev) => [newReq, ...prev.filter((r) => !(r.patientId === targetPatientId && r.doctorId === userId))]);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('patient_access_requests')
          .upsert({
            patient_id: targetPatientId,
            doctor_id: userId,
            status: 'pending',
            updated_at: new Date().toISOString()
          }, { onConflict: 'patient_id,doctor_id' });
      } catch (e) {
        console.error('Supabase request consent error:', e);
      }
    }

    addNotification(targetPatientId, `${docName} requested access to your JIVEXA Health ID summary (${cleanId}).`, 'security');
    return { success: true };
  };

  const respondAccessRequest = async (requestId: string, newStatus: 'approved' | 'rejected') => {
    const targetReq = accessRequests.find((r) => r.id === requestId);
    
    setAccessRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, status: newStatus } : r));

    if (isSupabaseConfigured && supabase && targetReq) {
      try {
        await supabase
          .from('patient_access_requests')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', requestId);
      } catch (e) {
        console.error('Supabase respond access error:', e);
      }
    }

    if (targetReq) {
      addNotification(targetReq.doctorId, `Patient ${targetReq.patientName} ${newStatus} your health record access request.`, 'security');
    }

    return { success: true };
  };

  const revokeDoctorAccess = async (doctorId: string) => {
    setAccessRequests((prev) => prev.map((r) => r.patientId === userId && r.doctorId === doctorId ? { ...r, status: 'rejected' } : r));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('patient_access_requests')
          .update({ status: 'rejected', updated_at: new Date().toISOString() })
          .eq('patient_id', userId)
          .eq('doctor_id', doctorId);
      } catch (e) {
        console.error('Supabase revoke access error:', e);
      }
    }

    addNotification(doctorId, `Patient ${userName} revoked your access to their JIVEXA Health ID summary.`, 'security');
    return { success: true };
  };

  // --- ACCESS LOGGING & EMERGENCY MODE ---
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);

  const logAccess = (healthId: string, accessorRole: AccessLog['accessorRole'], accessType: AccessLog['accessType'], targetPatientId?: string) => {
    const newLog: AccessLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      patientId: targetPatientId,
      healthId,
      accessorRole,
      accessType,
      accessedAt: new Date().toISOString()
    };
    setAccessLogs((prev) => [newLog, ...prev]);

    if (isSupabaseConfigured && supabase) {
      try {
        supabase.from('access_logs').insert({
          patient_id: targetPatientId || null,
          health_id: healthId,
          accessor_id: userId || null,
          accessor_role: accessorRole,
          access_type: accessType
        });
      } catch (e) {}
    }
  };

  const getPublicHealthIdProfile = async (healthId: string) => {
    const cleanId = healthId.trim().toUpperCase();
    logAccess(cleanId, user ? (user.role as any) : 'PUBLIC', 'PUBLIC_EMERGENCY_LOOKUP');

    if (patientProfile && (patientProfile.jivexaHealthId === cleanId || generateOrGetHealthId(patientProfile.userId) === cleanId)) {
      const rawName = user?.name || 'Mayank Gangwar';
      const nameParts = rawName.split(' ');
      const maskedName = nameParts.map(p => p.charAt(0) + '*'.repeat(Math.max(1, p.length - 1))).join(' ');
      const rawPhone = user?.phone || '+91 99887 76655';
      const maskedPhone = rawPhone.length > 6 ? rawPhone.substring(0, 6) + '*****' + rawPhone.slice(-2) : rawPhone;

      return {
        success: true,
        publicProfile: {
          healthId: cleanId,
          maskedName,
          age: 29,
          gender: 'Male',
          bloodGroup: patientProfile.bloodGroup || 'O+ Positive',
          allergies: patientProfile.allergies || 'Penicillin (mild)',
          maskedEmergencyContact: maskedPhone,
          emergencySharingEnabled: patientProfile.emergencySharingEnabled || false,
          emergencyAccessExpiry: patientProfile.emergencyAccessExpiry || null,
          lastUpdated: new Date().toISOString().split('T')[0]
        }
      };
    }

    if (cleanId.startsWith('JIV-2026-')) {
      return {
        success: true,
        publicProfile: {
          healthId: cleanId,
          maskedName: 'A***** S*****',
          age: 32,
          gender: 'Female',
          bloodGroup: 'B+ Positive',
          allergies: 'Penicillin (mild)',
          maskedEmergencyContact: '+91 98*****10',
          emergencySharingEnabled: true,
          emergencyAccessExpiry: new Date(Date.now() + 86400000 * 2).toISOString(),
          lastUpdated: new Date().toISOString().split('T')[0]
        }
      };
    }

    return { success: false, error: 'No patient record found for this JIVEXA Health ID.' };
  };

  const toggleEmergencyAccessMode = async (enabled: boolean, durationHours: number = 24) => {
    const expiry = enabled ? new Date(Date.now() + durationHours * 3600000).toISOString() : undefined;
    
    setPatientProfile((prev) => prev ? {
      ...prev,
      emergencySharingEnabled: enabled,
      emergencyAccessExpiry: expiry
    } : null);

    if (isSupabaseConfigured && supabase && userId) {
      try {
        await supabase.from('patients').update({
          emergency_sharing_enabled: enabled,
          emergency_access_expiry: expiry || null
        }).eq('user_id', userId);
      } catch (e) {}
    }

    addNotification(userId, `Instant Emergency Access Mode was ${enabled ? 'ENABLED' : 'DISABLED'}.`, 'security');
    return { success: true };
  };

  // --- AMBULANCE NETWORK STATE & OPERATIONS ---
  const INITIAL_AMBULANCES_DATA: AmbulanceVehicle[] = [
    {
      id: 'amb_1',
      partnerId: 'part_1',
      partnerName: 'Ramesh Singh (Apollo Partner)',
      partnerPhone: '+91 98765 43210',
      vehicleNumber: 'KA-01-EQ-9112',
      type: 'ICU',
      availability: 'Available',
      latitude: 12.9716,
      longitude: 77.5946,
      hospitalPartner: 'Apollo Hospital Indiranagar',
      rating: 4.9,
      baseFare: 1200
    },
    {
      id: 'amb_2',
      partnerId: 'part_2',
      partnerName: 'Vikram Patel (Manipal Express)',
      partnerPhone: '+91 98112 33445',
      vehicleNumber: 'KA-05-EM-4080',
      type: 'Oxygen',
      availability: 'Available',
      latitude: 12.9780,
      longitude: 77.6010,
      hospitalPartner: 'Manipal Hospital',
      rating: 4.8,
      baseFare: 800
    },
    {
      id: 'amb_3',
      partnerId: 'part_3',
      partnerName: 'Sunil Kumar (LifeLine Response)',
      partnerPhone: '+91 99001 22334',
      vehicleNumber: 'KA-03-ALS-1008',
      type: 'ALS',
      availability: 'Available',
      latitude: 12.9650,
      longitude: 77.5890,
      hospitalPartner: 'Fortis Healthcare Network',
      rating: 5.0,
      baseFare: 1800
    },
    {
      id: 'amb_4',
      partnerId: 'part_4',
      partnerName: 'Suresh Gowda (City Care)',
      partnerPhone: '+91 97400 55667',
      vehicleNumber: 'KA-02-AMB-5001',
      type: 'Basic',
      availability: 'Available',
      latitude: 12.9800,
      longitude: 77.6100,
      hospitalPartner: 'General Care Network',
      rating: 4.7,
      baseFare: 500
    }
  ];

  const [ambulances, setAmbulances] = useState<AmbulanceVehicle[]>(INITIAL_AMBULANCES_DATA);
  const [ambulanceBookings, setAmbulanceBookings] = useState<AmbulanceBooking[]>([]);

  const bookAmbulance = async (details: { ambulanceType: 'Basic' | 'Oxygen' | 'ICU' | 'ALS'; pickupAddress: string; destinationAddress: string; pickupLat: number; pickupLng: number; destLat: number; destLng: number; fare: number }) => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Smart matching algorithm: find nearest available ambulance of requested type
    let matchedVeh = ambulances.find((a) => a.type === details.ambulanceType && a.availability === 'Available');
    if (!matchedVeh) {
      matchedVeh = ambulances.find((a) => a.availability === 'Available') || ambulances[0];
    }

    const bookingId = `amb_book_${Date.now()}`;
    const newBooking: AmbulanceBooking = {
      id: bookingId,
      patientId: userId,
      patientName: userName,
      patientPhone: user?.phone || '+91 99887 76655',
      jivexaHealthId: patientProfile?.jivexaHealthId || generateOrGetHealthId(userId),
      ambulanceId: matchedVeh.id,
      ambulanceType: details.ambulanceType,
      vehicleNumber: matchedVeh.vehicleNumber,
      driverName: matchedVeh.partnerName,
      driverPhone: matchedVeh.partnerPhone,
      pickupAddress: details.pickupAddress,
      destinationAddress: details.destinationAddress,
      pickupLat: details.pickupLat,
      pickupLng: details.pickupLng,
      destLat: details.destLat,
      destLng: details.destLng,
      status: 'Accepted',
      fare: details.fare,
      createdAt: new Date().toISOString(),
      acceptedAt: new Date().toISOString()
    };

    // Mark assigned vehicle busy
    setAmbulances((prev) => prev.map((a) => a.id === matchedVeh!.id ? { ...a, availability: 'Busy' } : a));
    setAmbulanceBookings((prev) => [newBooking, ...prev]);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('ambulance_bookings').insert({
          patient_id: userId,
          patient_name: userName,
          patient_phone: user?.phone || '+91 99887 76655',
          jivexa_health_id: patientProfile?.jivexaHealthId || null,
          ambulance_id: matchedVeh.id,
          ambulance_type: details.ambulanceType,
          pickup_address: details.pickupAddress,
          destination_address: details.destinationAddress,
          pickup_lat: details.pickupLat,
          pickup_lng: details.pickupLng,
          dest_lat: details.destLat,
          dest_lng: details.destLng,
          status: 'Accepted',
          fare: details.fare
        });
      } catch (e) {
        console.error('Supabase ambulance booking error:', e);
      }
    }

    addNotification(userId, `Emergency Ambulance (${matchedVeh.vehicleNumber}) dispatched to ${details.pickupAddress}.`, 'emergency');
    return { success: true, booking: newBooking };
  };

  const updateAmbulanceBookingStatus = async (bookingId: string, newStatus: AmbulanceBooking['status']) => {
    const targetBk = ambulanceBookings.find((b) => b.id === bookingId);
    
    setAmbulanceBookings((prev) => prev.map((b) => b.id === bookingId ? {
      ...b,
      status: newStatus,
      completedAt: newStatus === 'Completed' ? new Date().toISOString() : b.completedAt
    } : b));

    if (targetBk && targetBk.ambulanceId && ['Completed', 'Cancelled'].includes(newStatus)) {
      setAmbulances((prev) => prev.map((a) => a.id === targetBk.ambulanceId ? { ...a, availability: 'Available' } : a));
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('ambulance_bookings').update({ status: newStatus }).eq('id', bookingId);
      } catch (e) {}
    }

    if (targetBk) {
      addNotification(targetBk.patientId, `Ambulance booking status updated to ${newStatus}.`, 'emergency');
    }

    return { success: true };
  };

  const toggleAmbulanceAvailability = async (ambulanceId: string, availability: AmbulanceVehicle['availability']) => {
    setAmbulances((prev) => prev.map((a) => a.id === ambulanceId || a.partnerId === userId ? { ...a, availability } : a));
    return { success: true };
  };

  return (
    <HealthDataContext.Provider value={{
      doctors,
      pharmacies,
      appointments,
      healthRecords,
      prescriptions,
      orders,
      inventory,
      notifications,
      healthGoals,
      patientProfile: patientProfile ? { ...patientProfile, jivexaHealthId: patientProfile.jivexaHealthId || generateOrGetHealthId(userId) } : null,
      medicalReports,
      sharedReports,
      accessRequests,
      accessLogs,
      ambulances,
      ambulanceBookings,
      bookAppointment,
      cancelAppointment,
      rescheduleAppointment,
      uploadHealthRecord,
      deleteHealthRecord,
      placePharmacyOrder,
      updatePatientProfile,
      saveAnalyzedReport,
      shareReportWithDoctor,
      generateOrGetHealthId,
      searchPatientByHealthId,
      getPublicHealthIdProfile,
      toggleEmergencyAccessMode,
      requestPatientAccess,
      respondAccessRequest,
      revokeDoctorAccess,
      bookAmbulance,
      updateAmbulanceBookingStatus,
      toggleAmbulanceAvailability,
      completeConsultation,
      updateAppointmentStatus,
      updateOrderStatus,
      updateInventoryStock,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      addNotification
    }}>
      {children}
    </HealthDataContext.Provider>
  );
};

export const useHealthData = () => {
  const context = useContext(HealthDataContext);
  if (context === undefined) {
    throw new Error('useHealthData must be used within a HealthDataProvider');
  }
  return context;
};
