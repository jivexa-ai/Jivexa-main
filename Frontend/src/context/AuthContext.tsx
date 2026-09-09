import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { 
  nodeAuthLogin, 
  nodeAuthSignup, 
  nodeAuthLogout, 
  nodeAuthGetMe, 
  nodeAuthSendOTP, 
  nodeAuthVerifyOTP,
  nodeAuthSubmitVerification
} from '../services/nodeAuthService';

export type UserRole = 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'ADMIN' | 'AMBULANCE_PARTNER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  verified: boolean;
  emailVerified?: boolean;
  accountStatus?: string;
  onboarded: boolean;
  phone?: string;
  dob?: string;
  professionalDetails?: any;
  vehicleDetails?: any;
  licenseDetails?: any;
}

export interface AuthActionResult {
  success: boolean;
  error?: string;
  requireOtp?: boolean;
  email?: string;
  maskedEmail?: string;
  role?: UserRole;
  message?: string;
  previewUrl?: string;
  accountStatus?: string;
}

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<AuthActionResult>;
  signup: (email: string, name: string, role: UserRole, password?: string, extraFields?: Record<string, any>) => Promise<AuthActionResult>;
  verifyEmail: (code: string, email?: string) => Promise<AuthActionResult>;
  sendOTP: (email?: string) => Promise<AuthActionResult>;
  submitRoleVerification: (payload: Record<string, any>) => Promise<AuthActionResult>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateOnboarding: (data: Partial<User>) => Promise<{ success: boolean }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInitializingRef = useRef(false);

  // Sync user profile to database tables (users, profiles, role tables)
  const syncUserProfile = async (id: string, email: string, name: string, role: UserRole) => {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      // 1. Sync public.users
      await supabase
        .from('users')
        .upsert({
          id,
          email,
          role,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      // 2. Sync public.profiles
      await supabase
        .from('profiles')
        .upsert({
          id,
          full_name: name,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      // 3. Sync Role Specific Tables
      if (role === 'PATIENT') {
        await supabase
          .from('patients')
          .upsert({
            user_id: id,
            onboarding_completed: false,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
      } else if (role === 'DOCTOR') {
        await supabase
          .from('doctors')
          .upsert({
            user_id: id,
            specialty: 'General Medicine',
            experience_years: 5,
            consultation_fee: 500
          }, { onConflict: 'user_id' });
      } else if (role === 'PHARMACY') {
        await supabase
          .from('pharmacies')
          .upsert({
            user_id: id,
            pharmacy_name: name,
            license_number: `LIC-${Date.now()}`
          }, { onConflict: 'user_id' });
      }
    } catch (err) {
      console.warn('[Supabase Sync] Profile upsert warning:', err);
    }
  };

  // Securely fetch role, onboarding status, and metadata
  const fetchUserProfile = async (id: string, email: string, fallbackName?: string, fallbackRole?: string): Promise<User> => {
    let onboardingCompleted = false;
    let name = fallbackName || email.split('@')[0];
    let role = (fallbackRole || 'PATIENT') as UserRole;
    let phone: string | undefined;
    let dob: string | undefined;

    // Query Supabase Database if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', id)
          .maybeSingle();

        if (userData?.role) {
          role = userData.role as UserRole;
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, phone, date_of_birth')
          .eq('id', id)
          .maybeSingle();

        if (profileData?.full_name) {
          name = profileData.full_name;
          phone = profileData.phone || undefined;
          dob = profileData.date_of_birth || undefined;
        }

        if (role === 'PATIENT') {
          const { data: patientData } = await supabase
            .from('patients')
            .select('onboarding_completed')
            .eq('user_id', id)
            .maybeSingle();

          if (patientData && patientData.onboarding_completed !== null && patientData.onboarding_completed !== undefined) {
            onboardingCompleted = Boolean(patientData.onboarding_completed);
          }
        } else {
          onboardingCompleted = true;
        }
      } catch (err) {
        console.warn('[Fetch User Profile Error]:', err);
      }
    }

    return {
      id,
      email,
      name,
      role,
      verified: true,
      emailVerified: true,
      accountStatus: 'ACTIVE',
      onboarded: onboardingCompleted,
      phone,
      dob
    };
  };

  useEffect(() => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    let authSubscription: { unsubscribe: () => void } | null = null;

    const initializeAuth = async () => {
      // 1. Check Node.js / Express Cookie Session
      try {
        const nodeRes = await nodeAuthGetMe();
        if (nodeRes.success && nodeRes.user) {
          const userProfile: User = {
            id: nodeRes.user.id || `node_${Date.now()}`,
            email: nodeRes.user.email,
            name: nodeRes.user.name,
            role: nodeRes.user.role || 'PATIENT',
            verified: Boolean(nodeRes.user.emailVerified || nodeRes.user.verified),
            emailVerified: Boolean(nodeRes.user.emailVerified),
            accountStatus: nodeRes.user.accountStatus || 'ACTIVE',
            onboarded: true,
            professionalDetails: nodeRes.user.professionalDetails,
            vehicleDetails: nodeRes.user.vehicleDetails,
            licenseDetails: nodeRes.user.licenseDetails
          };
          setUser(userProfile);
          localStorage.setItem('jivexa_session_user', JSON.stringify(userProfile));
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.warn('[Auth Context] Node session lookup skipped');
      }

      // If backend session lookup fails/is unauthenticated, clear local session storage
      setUser(null);
      localStorage.removeItem('jivexa_session_user');

      // 3. Fallback: Check Supabase Auth Session
      if (!isSupabaseConfigured || !supabase) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await fetchUserProfile(
            session.user.id,
            session.user.email!,
            session.user.user_metadata?.name,
            session.user.user_metadata?.role
          );
          setUser(profile);
          localStorage.setItem('jivexa_session_user', JSON.stringify(profile));
        } else {
          setUser(null);
          localStorage.removeItem('jivexa_session_user');
        }
      } catch (err) {
        console.error('[Initialize Auth Error]:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchUserProfile(
            session.user.id,
            session.user.email!,
            session.user.user_metadata?.name,
            session.user.user_metadata?.role
          );
          setUser(profile);
          localStorage.setItem('jivexa_session_user', JSON.stringify(profile));
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('jivexa_session_user');
        }
      });

      authSubscription = subscription;
    };

    initializeAuth();

    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  // LOGIN IMPLEMENTATION (BACKEND ONLY)
  const login = async (email: string, password: string, role?: UserRole): Promise<AuthActionResult> => {
    setIsLoading(true);
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedPassword = password.trim();

    if (!sanitizedEmail) {
      setIsLoading(false);
      return { success: false, error: 'Please enter your email address.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      setIsLoading(false);
      return { success: false, error: 'Please enter a valid email address (e.g. user@domain.com).' };
    }

    if (!sanitizedPassword) {
      setIsLoading(false);
      return { success: false, error: 'Please enter your password.' };
    }

    try {
      const nodeRes = await nodeAuthLogin(sanitizedEmail, sanitizedPassword, role);
      if (nodeRes.success && nodeRes.user) {
        const userProfile: User = {
          id: nodeRes.user.id || `node_${Date.now()}`,
          email: nodeRes.user.email,
          name: nodeRes.user.name,
          role: (nodeRes.user.role || role || 'PATIENT') as UserRole,
          verified: true,
          emailVerified: true,
          accountStatus: nodeRes.user.accountStatus || 'ACTIVE',
          onboarded: true,
          professionalDetails: nodeRes.user.professionalDetails,
          vehicleDetails: nodeRes.user.vehicleDetails,
          licenseDetails: nodeRes.user.licenseDetails
        };
        setUser(userProfile);
        localStorage.setItem('jivexa_session_user', JSON.stringify(userProfile));
        setIsLoading(false);
        return { success: true, role: userProfile.role };
      } else {
        setIsLoading(false);
        return { 
          success: false, 
          error: nodeRes.error || 'Invalid credentials or login failed.',
          requireOtp: nodeRes.requireOtp,
          email: nodeRes.email || sanitizedEmail
        };
      }
    } catch (e: any) {
      setIsLoading(false);
      return {
        success: false,
        error: e.message || 'Authentication service is unavailable.'
      };
    }
  };

  // SIGNUP IMPLEMENTATION (BACKEND ONLY)
  const signup = async (
    email: string, 
    name: string, 
    role: UserRole, 
    password?: string,
    extraFields?: Record<string, any>
  ): Promise<AuthActionResult> => {
    setIsLoading(true);
    let sanitizedEmail = email.toLowerCase().trim();
    const sanitizedName = name.trim();
    const sanitizedPassword = (password || '').trim();

    if (!sanitizedName) {
      setIsLoading(false);
      return { success: false, error: 'Full name is required.' };
    }
    if (sanitizedName.length < 3) {
      setIsLoading(false);
      return { success: false, error: 'Name must be at least 3 characters long.' };
    }

    if (!sanitizedEmail) {
      setIsLoading(false);
      return { success: false, error: 'Please enter an email address.' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (sanitizedEmail.includes('@') && !emailRegex.test(sanitizedEmail)) {
      setIsLoading(false);
      return { success: false, error: 'Invalid email address format (e.g. user@domain.com).' };
    }
    if (!sanitizedEmail.includes('@')) {
      sanitizedEmail = `${sanitizedEmail}@jivexa.com`;
    }

    if (!sanitizedPassword) {
      setIsLoading(false);
      return { success: false, error: 'Please choose a password.' };
    }
    if (sanitizedPassword.length < 8) {
      setIsLoading(false);
      return { success: false, error: 'Password must be at least 8 characters long.' };
    }
    if (!/[A-Z]/.test(sanitizedPassword)) {
      setIsLoading(false);
      return { success: false, error: 'Password must contain at least one uppercase letter (A-Z).' };
    }
    if (!/[a-z]/.test(sanitizedPassword)) {
      setIsLoading(false);
      return { success: false, error: 'Password must contain at least one lowercase letter (a-z).' };
    }
    if (!/[0-9]/.test(sanitizedPassword)) {
      setIsLoading(false);
      return { success: false, error: 'Password must contain at least one number (0-9).' };
    }
    if (!/[^A-Za-z0-9]/.test(sanitizedPassword)) {
      setIsLoading(false);
      return { success: false, error: 'Password must contain at least one special symbol (@!#$ etc.).' };
    }

    try {
      const nodeRes = await nodeAuthSignup(sanitizedName, sanitizedEmail, sanitizedPassword, role, extraFields);
      if (nodeRes.success && nodeRes.user) {
        const userProfile: User = {
          id: nodeRes.user.id || `usr_${Date.now()}`,
          email: nodeRes.user.email || sanitizedEmail,
          name: nodeRes.user.name || sanitizedName,
          role: (nodeRes.user.role || role) as UserRole,
          verified: Boolean(nodeRes.user.verified ?? true),
          emailVerified: Boolean(nodeRes.user.emailVerified ?? true),
          accountStatus: nodeRes.user.accountStatus || 'ACTIVE',
          onboarded: true,
          professionalDetails: nodeRes.user.professionalDetails || (extraFields?.nmcRegistrationNumber ? { nmcRegistrationNumber: extraFields.nmcRegistrationNumber, stateMedicalCouncil: extraFields.stateMedicalCouncil } : undefined),
          vehicleDetails: nodeRes.user.vehicleDetails || (extraFields?.vehicleNumber ? { vehicleNumber: extraFields.vehicleNumber } : undefined),
          licenseDetails: nodeRes.user.licenseDetails || (extraFields?.drugLicenseNumber ? { drugLicenseNumber: extraFields.drugLicenseNumber, gstin: extraFields.gstin } : undefined)
        };

        setUser(userProfile);
        localStorage.setItem('jivexa_session_user', JSON.stringify(userProfile));
        setIsLoading(false);
        return { 
          success: true, 
          role: userProfile.role,
          requireOtp: nodeRes.requireOtp,
          maskedEmail: nodeRes.maskedEmail,
          previewUrl: nodeRes.previewUrl,
          message: nodeRes.message
        };
      } else {
        setIsLoading(false);
        return { 
          success: false, 
          error: nodeRes.error || 'Registration failed.' 
        };
      }
    } catch (e: any) {
      setIsLoading(false);
      return {
        success: false,
        error: e.message || 'Authentication service is unavailable.'
      };
    }
  };

  const verifyEmail = async (code: string, emailTarget?: string): Promise<AuthActionResult> => {
    setIsLoading(true);

    try {
      const targetEmail = emailTarget || user?.email || '';
      const nodeRes = await nodeAuthVerifyOTP(targetEmail, code);
      if (nodeRes.success && nodeRes.user) {
        const userProfile: User = {
          id: nodeRes.user.id || `node_${Date.now()}`,
          email: nodeRes.user.email,
          name: nodeRes.user.name,
          role: nodeRes.user.role || 'PATIENT',
          verified: true,
          emailVerified: true,
          accountStatus: nodeRes.user.accountStatus || 'ACTIVE',
          onboarded: true,
          professionalDetails: nodeRes.user.professionalDetails,
          vehicleDetails: nodeRes.user.vehicleDetails,
          licenseDetails: nodeRes.user.licenseDetails
        };
        setUser(userProfile);
        localStorage.setItem('jivexa_session_user', JSON.stringify(userProfile));
        setIsLoading(false);
        return { success: true, role: userProfile.role, message: nodeRes.message };
      } else {
        setIsLoading(false);
        return { success: false, error: nodeRes.error || 'Invalid 6-digit OTP code.' };
      }
    } catch (e: any) {
      setIsLoading(false);
      return { success: false, error: e.message || 'OTP verification failed.' };
    }
  };

  const sendOTP = async (emailTarget?: string): Promise<AuthActionResult> => {
    const targetEmail = emailTarget || user?.email || '';
    if (!targetEmail || !targetEmail.includes('@') || !targetEmail.includes('.')) {
      return { success: false, error: 'Please enter a valid, complete email address (e.g. user@domain.com)' };
    }

    try {
      const nodeRes = await nodeAuthSendOTP(targetEmail);
      if (nodeRes.success) {
        return { success: true, message: nodeRes.message, maskedEmail: nodeRes.maskedEmail, previewUrl: nodeRes.previewUrl };
      } else {
        return { success: false, error: nodeRes.error || 'Failed to dispatch OTP email.' };
      }
    } catch (e: any) {
      return { success: false, error: 'Could not send OTP email. Please try again.' };
    }
  };

  const submitRoleVerification = async (payload: Record<string, any>): Promise<AuthActionResult> => {
    try {
      const nodeRes = await nodeAuthSubmitVerification(payload);
      if (!nodeRes.success) {
        return { success: false, error: nodeRes.error || 'Verification submission failed.' };
      }
      if (user) {
        const updated: User = {
          ...user,
          accountStatus: nodeRes.accountStatus || 'PENDING_REVIEW',
          professionalDetails: payload.nmcRegistrationNumber ? { nmcRegistrationNumber: payload.nmcRegistrationNumber, stateMedicalCouncil: payload.stateMedicalCouncil } : user.professionalDetails,
          vehicleDetails: payload.vehicleNumber ? { vehicleNumber: payload.vehicleNumber } : user.vehicleDetails,
          licenseDetails: payload.drugLicenseNumber ? { drugLicenseNumber: payload.drugLicenseNumber, gstin: payload.gstin } : user.licenseDetails
        };
        setUser(updated);
        localStorage.setItem('jivexa_session_user', JSON.stringify(updated));
      }
      return { success: true, message: nodeRes.message || 'Verification submitted.', accountStatus: nodeRes.accountStatus || 'PENDING_REVIEW' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to submit verification details.' };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const sanitizedEmail = email.toLowerCase().trim();
    if (!sanitizedEmail || !sanitizedEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (!isSupabaseConfigured || !supabase) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
        redirectTo: `${window.location.origin}/#/reset-password-confirm`
      });
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Password reset request failed.' };
    }
  };

  const updateOnboarding = async (data: Partial<User>): Promise<{ success: boolean }> => {
    if (!user) return { success: false };

    const updatedUser = { ...user, ...data, onboarded: true };
    setUser(updatedUser);
    localStorage.setItem('jivexa_session_user', JSON.stringify(updatedUser));
    return { success: true };
  };

  const logout = () => {
    nodeAuthLogout();
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    setUser(null);
    localStorage.removeItem('jivexa_session_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        verifyEmail,
        sendOTP,
        submitRoleVerification,
        resetPassword,
        updateOnboarding,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
