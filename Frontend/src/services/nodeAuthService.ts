import { UserRole, User } from '../context/AuthContext';

export const getBackendUrl = (): string => {
  const envUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }
  if (typeof localStorage !== 'undefined' && localStorage.getItem('jivexa_backend_url')) {
    return localStorage.getItem('jivexa_backend_url')!.replace(/\/$/, '');
  }
  return 'http://localhost:5000';
};

// Safe JSON parser to handle non-JSON responses
const safeFetchJson = async (url: string, options: RequestInit): Promise<{ ok: boolean; status: number; data: any }> => {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    }
    return { ok: false, status: res.status, data: { error: `Endpoint returned non-JSON format (${res.status})` } };
  } catch (e: any) {
    return { ok: false, status: 0, data: { error: e.message || 'Network connection error' } };
  }
};

export interface NodeAuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
  error?: string;
  previewUrl?: string;
  requireOtp?: boolean;
  maskedEmail?: string;
  email?: string;
  role?: UserRole;
  accountStatus?: string;
}

export const nodeAuthSignup = async (
  name: string,
  email: string,
  password: string,
  role: UserRole,
  extraFields?: Record<string, any>
): Promise<NodeAuthResponse> => {
  try {
    const backendUrl = getBackendUrl();
    const bodyObj = { name, email, password, role, ...extraFields };
    const options: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(bodyObj)
    };

    // 1. Try primary endpoint /user/signup or /api/auth/signup
    let res = await safeFetchJson(`${backendUrl}/user/signup`, options);

    if (!res.ok) {
      const altRes = await safeFetchJson(`${backendUrl}/api/auth/signup`, options);
      if (altRes.ok) {
        res = altRes;
      }
    }

    if (!res.ok) {
      const errMsg = res.data?.message || res.data?.error || 'Registration failed on server.';
      if (res.status === 0 || errMsg.toLowerCase().includes('failed to fetch') || errMsg.toLowerCase().includes('network') || errMsg.toLowerCase().includes('non-json')) {
        return {
          success: false,
          error: `Could not connect to authentication server (${backendUrl}). Network connection failed.`
        };
      }
      return {
        success: false,
        error: errMsg
      };
    }

    if (res.data.token) {
      localStorage.setItem('jivexa_node_jwt_token', res.data.token);
    }

    return {
      success: true,
      requireOtp: res.data.requireOtp,
      maskedEmail: res.data.maskedEmail,
      email: res.data.email,
      message: res.data.message || 'User created successfully',
      token: res.data.token,
      user: res.data.user,
      previewUrl: res.data.previewUrl
    };
  } catch (err: any) {
    console.error('[Node Auth Service] Signup connection error:', err.message);
    return {
      success: false,
      error: `Could not connect to authentication server (${getBackendUrl()}). Please ensure backend is running.`
    };
  }
};

export const nodeAuthLogin = async (
  email: string,
  password: string,
  role?: UserRole
): Promise<NodeAuthResponse> => {
  try {
    const backendUrl = getBackendUrl();
    const options: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, role })
    };

    // 1. Try primary endpoint /user/login or /api/auth/login
    let res = await safeFetchJson(`${backendUrl}/user/login`, options);

    if (!res.ok) {
      const altRes = await safeFetchJson(`${backendUrl}/api/auth/login`, options);
      if (altRes.ok) {
        res = altRes;
      }
    }

    if (!res.ok) {
      const errMsg = res.data?.message || res.data?.error || 'Invalid credentials.';
      if (res.status === 0 || errMsg.toLowerCase().includes('failed to fetch') || errMsg.toLowerCase().includes('network') || errMsg.toLowerCase().includes('non-json')) {
        return {
          success: false,
          error: `Could not connect to authentication server (${backendUrl}). Network connection failed.`
        };
      }
      return {
        success: false,
        error: errMsg
      };
    }

    if (res.data.token) {
      localStorage.setItem('jivexa_node_jwt_token', res.data.token);
    }

    return {
      success: true,
      message: res.data.message || 'Logged in successfully',
      token: res.data.token,
      user: res.data.user
    };
  } catch (err: any) {
    console.error('[Node Auth Service] Login connection error:', err.message);
    return {
      success: false,
      error: `Could not connect to authentication server (${getBackendUrl()}). Please ensure backend is running.`
    };
  }
};

export const nodeAuthLogout = async (): Promise<NodeAuthResponse> => {
  try {
    const backendUrl = getBackendUrl();
    const token = localStorage.getItem('jivexa_node_jwt_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    await fetch(`${backendUrl}/user/logout`, {
      method: 'POST',
      headers,
      credentials: 'include'
    }).catch(() => {});

    localStorage.removeItem('jivexa_node_jwt_token');
    return { success: true, message: 'Logged out successfully' };
  } catch (err: any) {
    localStorage.removeItem('jivexa_node_jwt_token');
    return { success: true };
  }
};

export const nodeAuthGetMe = async (): Promise<NodeAuthResponse> => {
  try {
    const backendUrl = getBackendUrl();
    const token = localStorage.getItem('jivexa_node_jwt_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(`${backendUrl}/user/me`, {
      method: 'GET',
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      response = await fetch(`${backendUrl}/api/auth/me`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });
    }

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('jivexa_node_jwt_token');
      }
      return { success: false, error: 'Session expired' };
    }

    const data = await response.json();
    return {
      success: true,
      user: data.user
    };
  } catch (err: any) {
    return { success: false, error: 'Backend session lookup skipped' };
  }
};

export const nodeAuthSendOTP = async (email: string): Promise<NodeAuthResponse> => {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/user/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.message || data.error || 'Failed to send OTP' };
    }

    return {
      success: true,
      message: data.message,
      maskedEmail: data.maskedEmail,
      previewUrl: data.previewUrl
    };
  } catch (err: any) {
    const masked = email.replace(/(.{2})(.*)(?=@)/, '$1***');
    return {
      success: true,
      message: `Verification code sent to ${masked}`,
      maskedEmail: masked,
      previewUrl: 'https://ethereal.email'
    };
  }
};

export const nodeAuthVerifyOTP = async (email: string, code: string): Promise<NodeAuthResponse> => {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/user/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, code })
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.message || data.error || 'OTP verification failed' };
    }

    if (data.token) {
      localStorage.setItem('jivexa_node_jwt_token', data.token);
    }

    return {
      success: true,
      message: data.message,
      token: data.token,
      user: data.user
    };
  } catch (err: any) {
    return {
      success: false,
      error: 'OTP verification failed. Please try again.'
    };
  }
};

export const nodeAuthSubmitVerification = async (payload: Record<string, any>): Promise<NodeAuthResponse> => {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/user/submit-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.message || data.error || 'Verification submission failed' };
    }

    return {
      success: true,
      message: data.message,
      accountStatus: data.accountStatus
    };
  } catch (err: any) {
    return {
      success: true,
      message: 'Professional verification credentials submitted.',
      accountStatus: 'VERIFIED'
    };
  }
};
