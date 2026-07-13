import React, { createContext, useContext, useState, useEffect } from 'react';
import { playmeDb } from '../lib/db';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  avatar?: string;
  createdAt: string;
  provider: 'password';
  isVerified?: boolean;
  phoneNumber?: string;
  isSubscribed?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<UserProfile>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<UserProfile>;
  resetPassword: (email: string) => Promise<void>;
  resetPasswordConfirm: (token: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: { displayName?: string; phoneNumber?: string }) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  isSubscribed: boolean;
  showPremiumModal: boolean;
  setShowPremiumModal: (show: boolean) => void;
  upgradeToPremium: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const formatUserProfile = (raw: any): UserProfile => {
  return {
    uid: raw.uid,
    email: raw.email,
    displayName: raw.displayName || raw.name || '',
    photoURL: raw.photoURL || raw.avatar || '',
    avatar: raw.avatar,
    provider: raw.provider || 'password',
    createdAt: raw.createdAt,
    isVerified: raw.isVerified || false,
    phoneNumber: raw.phoneNumber || '',
    isSubscribed: raw.isSubscribed || false
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const syncProfileToLocalDB = async (profile: UserProfile) => {
    try {
      await playmeDb.users.put({
        uid: profile.uid,
        email: profile.email,
        displayName: profile.displayName,
        photoURL: profile.photoURL || profile.avatar,
        phoneNumber: profile.phoneNumber,
        provider: profile.provider,
        createdAt: profile.createdAt,
        updatedAt: new Date().toISOString(),
        isSubscribed: profile.isSubscribed || false
      });
    } catch (dbErr) {
      console.warn('[Auth] Local Dexie write failed:', dbErr);
    }
  };

  useEffect(() => {
    const initSession = async () => {
      const token = localStorage.getItem('playme_auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (res.ok) {
          const rawProfile = await res.json();
          const profile = formatUserProfile(rawProfile);
          setUser(profile);
          await syncProfileToLocalDB(profile);
        } else {
          localStorage.removeItem('playme_auth_token');
          setUser(null);
        }
      } catch (err) {
        console.warn('[Auth] Failed to verify session:', err);
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, []);

  const loginWithEmail = async (email: string, pass: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      const profile = formatUserProfile(data.user);
      localStorage.setItem('playme_auth_token', data.token);
      setUser(profile);
      await syncProfileToLocalDB(profile);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pass })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      const profile = formatUserProfile(data.user);
      localStorage.setItem('playme_auth_token', data.token);
      setUser(profile);
      await syncProfileToLocalDB(profile);
      return profile;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    const res = await fetch('/api/auth/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Reset request failed');
    }
  };

  const resetPasswordConfirm = async (email: string, otp: string, pass: string): Promise<void> => {
    const res = await fetch('/api/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, password: pass })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Password reset failed');
    }
  };

  const logout = async (): Promise<void> => {
    localStorage.removeItem('playme_auth_token');
    setUser(null);
  };

  const updateUserProfile = async (updates: { displayName?: string; phoneNumber?: string }) => {
    if (!user) return;
    const token = localStorage.getItem('playme_auth_token');
    if (!token) return;

    const res = await fetch('/api/auth/update-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update profile');
    }

    const profile = formatUserProfile(data.user);
    setUser(profile);
    await syncProfileToLocalDB(profile);
  };

  const sendVerificationEmail = async (): Promise<void> => {
    const token = localStorage.getItem('playme_auth_token');
    if (!token) throw new Error('Not authenticated');

    const res = await fetch('/api/auth/send-verification', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send verification email');
    }
  };

  const verifyEmail = async (verifyToken: string): Promise<void> => {
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: verifyToken })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Verification failed');
    }

    // After verifying, if we are logged in, refresh our profile
    const token = localStorage.getItem('playme_auth_token');
    if (token) {
      const meRes = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (meRes.ok) {
        const rawProfile = await meRes.json();
        const profile = formatUserProfile(rawProfile);
        setUser(profile);
        await syncProfileToLocalDB(profile);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithEmail,
        signUpWithEmail,
        resetPassword,
        resetPasswordConfirm,
        logout,
        updateUserProfile,
        sendVerificationEmail,
        verifyEmail,
        isSubscribed: user?.isSubscribed || false,
        showPremiumModal,
        setShowPremiumModal,
        upgradeToPremium: async () => {
          if (!user) return;
          const updatedProfile = { ...user, isSubscribed: true };
          setUser(updatedProfile);
          await syncProfileToLocalDB(updatedProfile);
          setShowPremiumModal(false);
        }
      }}
    >
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
