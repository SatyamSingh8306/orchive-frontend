'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

interface User {
  id: string;
  email: string;
  name: string;
  created_at?: string;
  is_active?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: {
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
  }) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (
    token: string,
    newPassword: string,
    confirmPassword: string
  ) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await api.get('/auth/me');

      setUser(data);
    } catch (err) {
      console.error('Auth check failed:', err);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<boolean> => {
    setError(null);

    try {
      const { data } = await api.post('/auth/login', {
        email,
        password,
      });

      localStorage.setItem(
        'token',
        data.access_token
      );

      await checkAuth();

      return true;
    } catch (err: any) {
      console.error('Login error:', err);

      setError(
        err.response?.data?.detail ||
          'Login failed'
      );

      return false;
    }
  };

  const signup = async (userData: {
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
  }): Promise<boolean> => {
    setError(null);

    try {
      await api.post('/auth/signup', userData);

      return true;
    } catch (err: any) {
      console.error('Signup error:', err);

      setError(
        err.response?.data?.detail ||
          'Signup failed'
      );

      return false;
    }
  };

  const forgotPassword = async (
    email: string
  ): Promise<boolean> => {
    setError(null);

    try {
      await api.post('/auth/forgot-password', {
        email,
      });

      return true;
    } catch (err: any) {
      console.error(
        'Forgot password error:',
        err
      );

      setError(
        err.response?.data?.detail ||
          'Failed to send reset email'
      );

      return false;
    }
  };

  const resetPassword = async (
    token: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<boolean> => {
    setError(null);

    try {
      await api.post('/auth/reset-password', {
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      return true;
    } catch (err: any) {
      console.error(
        'Reset password error:',
        err
      );

      setError(
        err.response?.data?.detail ||
          'Failed to reset password'
      );

      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        forgotPassword,
        resetPassword,
        logout,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};