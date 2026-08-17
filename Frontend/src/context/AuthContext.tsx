import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { nodeAuthLogin, nodeAuthSignup, nodeAuthGetMe, nodeAuthSendOTP, nodeAuthVerifyOTP } from '../services/nodeAuthService';

export type UserRole = 'PATIENT' | 'DOCTOR' | 'PHARMACY' | 'ADMIN' | 'AMBULANCE_PARTNER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  verified: boolean;
  onboarded: boolean;
  phone?: string;
  dob?: string;
}

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  signup: (email: string, name: string, role: UserRole, password?: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (code: string) => Promise<{ success: boolean; error?: string }>;
  sendOTP: (email?: string) => Promise<{ success: boolean; error?: string; message?: string; previewUrl?: string }>;
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

    // 1. Check Local Registered Users Cache
    const registeredUsersJSON = localStorage.getItem('jivexa_registered_users');
    if (registeredUsersJSON) {
      try {
        const usersList: User[] = JSON.parse(registeredUsersJSON);
        const match = usersList.find((u) => u.id === id || u.email.toLowerCase() === email.toLowerCase());
        if (match) {
          onboardingCompleted = Boolean(match.onboarded);
          role = match.role;
          if (match.name) name = match.name;
        }
      } catch (e) {}
    }

    // 2. Query Supabase Database if configured
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
        console.warn('Could not fetch Supabase user profile:', err);
      }
    } else {
      if (role !== 'PATIENT') {
        onboardingCompleted = true;
      }
    }

    return {
      id,
      email,
      name,
      role,
      verified: true,
      onboarded: onboardingCompleted,
      phone,
      dob
    };
  };

  // Load session on mount
  useEffect(() => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    let authSubscription: any = null;

    const initializeAuth = async () => {
      // 1. Try Node.js Backend JWT token first
      const nodeToken = localStorage.getItem('jivexa_node_jwt_token');
      if (nodeToken) {
        try {
          const nodeRes = await nodeAuthGetMe();
          if (nodeRes.success && nodeRes.user) {
            const userProfile: User = {
              id: nodeRes.user.id || `node_${Date.now()}`,
              email: nodeRes.user.email,
              name: nodeRes.user.name,
              role: nodeRes.user.role || 'PATIENT',
              verified: true,
              onboarded: true
            };
            setUser(userProfile);
            localStorage.setItem('jivexa_session_user', JSON.stringify(userProfile));
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.warn('[Node Auth Init Warning]:', e);
        }
      }

      const savedUserJSON = localStorage.getItem('jivexa_session_user');
      if (savedUserJSON) {
        try {
          setUser(JSON.parse(savedUserJSON));
        } catch (e) {
          localStorage.removeItem('jivexa_session_user');
        }
      }

      if (!isSupabaseConfigured || !supabase) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const profile = await fetchUserProfile(
            session.user.id,
            session.user.email!,
            session.user.user_metadata?.name,
            session.user.user_metadata?.role
          );
          setUser(profile);
          localStorage.setItem('jivexa_session_user', JSON.stringify(profile));
        }
      } catch (err) {
        console.warn('[Supabase Auth Init] Warning:', err);
      } finally {
        setIsLoading(false);
      }

      // Supabase Auth State Listener
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

  // LOGIN IMPLEMENTATION
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; role?: UserRole }> => {
    setIsLoading(true);
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedPassword = password.trim();

    if (!sanitizedEmail || !sanitizedEmail.includes('@')) {
      setIsLoading(false);
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (!sanitizedPassword) {
      setIsLoading(false);
      return { success: false, error: 'Password is required.' };
    }

    // 1. Attempt Node.js + Express + MongoDB Backend API
    try {
      const nodeRes = await nodeAuthLogin(sanitizedEmail, sanitizedPassword);
      if (nodeRes.success && nodeRes.user) {
        const userProfile: User = {
          id: nodeRes.user.id || `node_${Date.now()}`,
          email: nodeRes.user.email,
          name: nodeRes.user.name,
          role: nodeRes.user.role || 'PATIENT',
          verified: true,
          onboarded: true
        };
        setUser(userProfile);
        localStorage.setItem('jivexa_session_user', JSON.stringify(userProfile));
        setIsLoading(false);
        return { success: true, role: userProfile.role };
      }
    } catch (e) {
      // Continue to Supabase / Local fallback
    }

    // Helper for fallback local login
    const attemptLocalFallbackLogin = () => {
      const registeredUsersJSON = localStorage.getItem('jivexa_registered_users');
      if (registeredUsersJSON) {
        try {
          const usersList: User[] = JSON.parse(registeredUsersJSON);
          const match = usersList.find((u) => u.email.toLowerCase().trim() === sanitizedEmail);
          if (match) {
            setUser(match);
            localStorage.setItem('jivexa_session_user', JSON.stringify(match));
            setIsLoading(false);
            return { success: true, role: match.role };
          }
        } catch (e) {}
      }
      return null;
    };

    if (!isSupabaseConfigured || !supabase) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const localRes = attemptLocalFallbackLogin();
      if (localRes) return localRes;

      setIsLoading(false);
      return { success: false, error: 'Invalid credentials. Please register an account first.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: sanitizedPassword
      });

      if (error) {
        const errMsg = error.message || '';

        const localRes = attemptLocalFallbackLogin();
        if (localRes) return localRes;

        if (errMsg.includes('Invalid login credentials')) {
          setIsLoading(false);
          return { success: false, error: 'Invalid email or password. Please check your credentials or create a new account.' };
        }

        if (errMsg.includes('Email not confirmed')) {
          setIsLoading(false);
          return { success: false, error: 'Your email address is not confirmed. Please check your inbox or sign up.' };
        }

        setIsLoading(false);
        return { success: false, error: error.message || 'Login failed.' };
      }

      if (data.user) {
        const profile = await fetchUserProfile(
          data.user.id,
          data.user.email!,
          data.user.user_metadata?.name,
          data.user.user_metadata?.role
        );
        setUser(profile);
        localStorage.setItem('jivexa_session_user', JSON.stringify(profile));
        
        syncUserProfile(profile.id, profile.email, profile.name, profile.role);
        
        setIsLoading(false);
        return { success: true, role: profile.role };
      }

      setIsLoading(false);
      return { success: false, error: 'Login session failed.' };
    } catch (err: any) {
      console.warn('[Supabase Login Exception]:', err);
      
      const localRes = attemptLocalFallbackLogin();
      if (localRes) return localRes;

      setIsLoading(false);
      return { success: false, error: err.message || 'Authentication failed. Please try again.' };
    }
  };

  // SIGNUP IMPLEMENTATION
  const signup = async (email: string, name: string, role: UserRole, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedName = name.trim();
    const sanitizedPassword = (password || 'SecurePass123!').trim();

    if (!sanitizedEmail || !sanitizedEmail.includes('@')) {
      setIsLoading(false);
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (!sanitizedName) {
      setIsLoading(false);
      return { success: false, error: 'Full name is required.' };
    }

    if (sanitizedPassword.length < 6) {
      setIsLoading(false);
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    // 1. Attempt Node.js + Express + MongoDB Backend API
    try {
      const nodeRes = await nodeAuthSignup(sanitizedName, sanitizedEmail, sanitizedPassword, role);
      if (nodeRes.success && nodeRes.user) {
        const userProfile: User = {
          id: nodeRes.user.id || `node_${Date.now()}`,
          email: nodeRes.user.email,
          name: nodeRes.user.name,
          role: nodeRes.user.role || role,
          verified: true,
          onboarded: role !== 'PATIENT'
        };
        setUser(userProfile);
        localStorage.setItem('jivexa_session_user', JSON.stringify(userProfile));
        setIsLoading(false);
        return { success: true };
      } else if (nodeRes.error && !nodeRes.error.includes('connection error')) {
        setIsLoading(false);
        return { success: false, error: nodeRes.error };
      }
    } catch (e) {
      // Continue to Supabase / Local fallback
    }

    // Always update local registered cache so offline login & role checks work seamlessly
    const registerLocalUser = (id: string, verified: boolean): User => {
      const registeredUsersJSON = localStorage.getItem('jivexa_registered_users');
      let usersList: User[] = [];
      if (registeredUsersJSON) {
        try { usersList = JSON.parse(registeredUsersJSON); } catch (e) {}
      }

      const existing = usersList.find((u) => u.email.toLowerCase() === sanitizedEmail);
      if (existing) {
        existing.name = sanitizedName;
        existing.role = role;
        localStorage.setItem('jivexa_registered_users', JSON.stringify(usersList));
        return existing;
      }

      const newUser: User = {
        id,
        email: sanitizedEmail,
        name: sanitizedName,
        role,
        verified,
        onboarded: role !== 'PATIENT'
      };

      usersList.push(newUser);
      localStorage.setItem('jivexa_registered_users', JSON.stringify(usersList));
      return newUser;
    };

    if (!isSupabaseConfigured || !supabase) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const newUser = registerLocalUser(`usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, true);
      setUser(newUser);
      localStorage.setItem('jivexa_session_user', JSON.stringify(newUser));
      setIsLoading(false);
      return { success: true };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: sanitizedPassword,
        options: {
          data: {
            name: sanitizedName,
            role
          }
        }
      });

      if (error) {
        const errMsg = error.message || '';
        if (errMsg.includes('User already registered') || errMsg.includes('already exists')) {
          setIsLoading(false);
          return { success: false, error: 'An account with this email address already exists. Please log in.' };
        }
        setIsLoading(false);
        return { success: false, error: error.message || 'Signup failed.' };
      }

      if (data.user) {
        const newUser = registerLocalUser(data.user.id, Boolean(data.session));
        setUser(newUser);
        localStorage.setItem('jivexa_session_user', JSON.stringify(newUser));
        
        // Sync profile to database tables
        syncUserProfile(data.user.id, sanitizedEmail, sanitizedName, role);
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      console.warn('[Supabase Signup Exception]:', err);
      // Fallback register
      const newUser = registerLocalUser(`usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, true);
      setUser(newUser);
      localStorage.setItem('jivexa_session_user', JSON.stringify(newUser));
      setIsLoading(false);
      return { success: true };
    }
  };

  const verifyEmail = async (code: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      const targetEmail = user?.email || '';
      const nodeRes = await nodeAuthVerifyOTP(code, targetEmail);
      if (nodeRes.success) {
        const updatedUser = user ? { ...user, verified: true } : (nodeRes.user || null);
        setUser(updatedUser);
        if (updatedUser) {
          localStorage.setItem('jivexa_session_user', JSON.stringify(updatedUser));
        }
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        return { success: false, error: nodeRes.error || 'Invalid 6-digit OTP code.' };
      }
    } catch (e: any) {
      setIsLoading(false);
      return { success: false, error: e.message || 'OTP verification failed.' };
    }
  };

  const sendOTP = async (email?: string): Promise<{ success: boolean; error?: string; message?: string; previewUrl?: string }> => {
    const targetEmail = email || user?.email || '';
    if (!targetEmail || !targetEmail.includes('@') || !targetEmail.includes('.')) {
      return { success: false, error: 'Please enter a valid, complete email address (e.g. user@domain.com)' };
    }

    try {
      const nodeRes = await nodeAuthSendOTP(targetEmail);
      if (nodeRes.success) {
        return { success: true, message: nodeRes.message, previewUrl: nodeRes.previewUrl };
      } else {
        return { success: false, error: nodeRes.error || 'Failed to dispatch OTP email.' };
      }
    } catch (e: any) {
      return { success: false, error: 'Could not send OTP email. Please try again.' };
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

    const registeredUsersJSON = localStorage.getItem('jivexa_registered_users');
    if (registeredUsersJSON) {
      try {
        const usersList: User[] = JSON.parse(registeredUsersJSON);
        const updatedList = usersList.map((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase() ? { ...u, ...data, onboarded: true } : u);
        localStorage.setItem('jivexa_registered_users', JSON.stringify(updatedList));
      } catch (e) {}
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('patients')
          .upsert({
            user_id: user.id,
            onboarding_completed: true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (data.phone || data.dob) {
          await supabase
            .from('profiles')
            .update({
              phone: data.phone,
              date_of_birth: data.dob
            })
            .eq('id', user.id);
        }
      } catch (err) {
        console.warn('Error updating onboarding status in Supabase:', err);
      }
    }

    return { success: true };
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('jivexa_session_user');
    localStorage.removeItem('jivexa_node_jwt_token');
    try {
      await nodeAuthLogout();
    } catch (e) {}
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {}
    }
  };

  const role = user ? user.role : null;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      role,
      isAuthenticated,
      isLoading,
      login,
      signup,
      verifyEmail,
      sendOTP,
      resetPassword,
      updateOnboarding,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
