import { UserRole, User } from '../context/AuthContext';

const NODE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export interface NodeAuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
  error?: string;
  previewUrl?: string;
}

export const nodeAuthSignup = async (
  name: string,
  email: string,
  password: string,
  role: UserRole,
  age?: number
): Promise<NodeAuthResponse> => {
  try {
    const response = await fetch(`${NODE_BACKEND_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ name, email, password, role, age })
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Backend signup failed'
      };
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
    console.warn('[Node Auth Service] Could not reach backend server:', err.message);
    return { success: false, error: 'Backend server connection error. Please ensure backend is running.' };
  }
};

export const nodeAuthLogin = async (
  email: string,
  password: string
): Promise<NodeAuthResponse> => {
  try {
    const response = await fetch(`${NODE_BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Invalid login credentials'
      };
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
    console.warn('[Node Auth Service] Could not reach backend server:', err.message);
    return { success: false, error: 'Backend server connection error. Please ensure backend is running.' };
  }
};

export const nodeAuthLogout = async (): Promise<NodeAuthResponse> => {
  try {
    const token = localStorage.getItem('jivexa_node_jwt_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    await fetch(`${NODE_BACKEND_URL}/api/auth/logout`, {
      method: 'POST',
      headers,
      credentials: 'include'
    });

    localStorage.removeItem('jivexa_node_jwt_token');
    return { success: true, message: 'Logged out successfully' };
  } catch (err: any) {
    localStorage.removeItem('jivexa_node_jwt_token');
    return { success: true };
  }
};

export const nodeAuthGetMe = async (): Promise<NodeAuthResponse> => {
  try {
    const token = localStorage.getItem('jivexa_node_jwt_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${NODE_BACKEND_URL}/api/auth/me`, {
      method: 'GET',
      headers,
      credentials: 'include'
    });

    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('jivexa_node_jwt_token');
      }
      return { success: false, error: data.error || data.message || 'Token validation failed' };
    }

    return {
      success: true,
      user: data.user
    };
  } catch (err: any) {
    console.warn('[Node Auth Service] Could not reach backend server:', err.message);
    return { success: false, error: 'Backend server connection error' };
  }
};

export const nodeAuthSendOTP = async (email?: string): Promise<NodeAuthResponse> => {
  try {
    const token = localStorage.getItem('jivexa_node_jwt_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${NODE_BACKEND_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || data.message || 'Failed to dispatch OTP email' };
    }

    return {
      success: true,
      message: data.message,
      previewUrl: data.previewUrl
    };
  } catch (err: any) {
    return { success: false, error: 'Could not connect to authentication server to send OTP.' };
  }
};

export const nodeAuthVerifyOTP = async (code: string, email?: string): Promise<NodeAuthResponse> => {
  try {
    const token = localStorage.getItem('jivexa_node_jwt_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${NODE_BACKEND_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ code, email })
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || data.message || 'OTP verification failed' };
    }

    return {
      success: true,
      message: data.message,
      user: data.user
    };
  } catch (err: any) {
    return { success: false, error: 'Could not connect to authentication server to verify OTP.' };
  }
};
