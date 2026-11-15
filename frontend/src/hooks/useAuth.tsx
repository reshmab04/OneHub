import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import api from '@/services/api';

interface AuthState {
  authenticated: boolean;
  email: string | null;
  fullName: string | null;
  role: 'admin' | 'user' | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<string | null>;
  register: (fullName: string, email: string, password: string, confirmPassword: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const emptyState: AuthState = {
  authenticated: false,
  email: null,
  fullName: null,
  role: null,
  loading: false,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ ...emptyState, loading: true });

  const checkAuth = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      const { email, fullName, role } = res.data.data;
      setState({ authenticated: true, email, fullName, role, loading: false });
    } catch {
      setState({ ...emptyState });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string): Promise<string | null> => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const d = res.data.data;
      setState({ authenticated: true, email: d.email, fullName: d.fullName, role: d.role, loading: false });
      return null;
    } catch (err: any) {
      return err.response?.data?.error || 'Login failed. Please try again.';
    }
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    confirmPassword: string,
  ): Promise<string | null> => {
    try {
      const res = await api.post('/auth/register', { fullName, email, password, confirmPassword });
      const d = res.data.data;
      setState({ authenticated: true, email: d.email, fullName: d.fullName, role: d.role, loading: false });
      return null;
    } catch (err: any) {
      return err.response?.data?.error || 'Registration failed. Please try again.';
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Clear state even if the request fails
    }
    setState({ ...emptyState });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
