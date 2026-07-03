/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { AudioPlayerProvider, useAudioPlayer } from './components/AudioPlayerContext';
import { AuthProvider, useAuth } from './components/AuthContext';
import { AuthModal } from './components/AuthModal';
import { UserProfilePortal } from './components/UserProfilePortal';
import { MavFarmView } from './components/MavFarmView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PremiumUpgradeModal } from './components/PremiumUpgradeModal';

const MainAppContent: React.FC = () => {
  const { verifyEmail } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const [verifyStatus, setVerifyStatus] = useState<{
    loading: boolean;
    error: string | null;
    success: string | null;
  }>({
    loading: false,
    error: null,
    success: null
  });

  const { currentTrack, isHomeTabActive, isYtFallbackActive } = useAudioPlayer();
  const isYtActive = currentTrack?.isYoutube && isHomeTabActive && !isYtFallbackActive;

  React.useEffect(() => {
    const handleOpenAuth = () => setIsAuthOpen(true);
    window.addEventListener('open-auth-modal', handleOpenAuth);
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('reset_token')) {
      setIsAuthOpen(true);
    }

    const verifyToken = urlParams.get('verify_token');
    if (verifyToken) {
      setVerifyStatus({ loading: true, error: null, success: null });
      verifyEmail(verifyToken)
        .then(() => {
          setVerifyStatus({ loading: false, error: null, success: 'Email verified successfully!' });
          window.history.replaceState({}, document.title, window.location.pathname);
          setIsProfileOpen(true);
          setTimeout(() => {
            setVerifyStatus(prev => ({ ...prev, success: null }));
          }, 4000);
        })
        .catch((err) => {
          setVerifyStatus({ loading: false, error: err.message || 'Verification failed', success: null });
          window.history.replaceState({}, document.title, window.location.pathname);
          setTimeout(() => {
            setVerifyStatus(prev => ({ ...prev, error: null }));
          }, 6000);
        });
    }

    return () => window.removeEventListener('open-auth-modal', handleOpenAuth);
  }, []);

  return (
    <div id="playme-main-wrapper" className={`${isYtActive ? 'bg-transparent' : 'bg-[#131314]'} text-[#e5e2e3] font-sans min-h-screen relative overflow-x-hidden`}>
      <MavFarmView 
        onAuthClick={() => setIsAuthOpen(true)}
        onProfileClick={() => setIsProfileOpen(true)}
      />
      
      {/* Verification Notification Banner */}
      <AnimatePresence>
        {(verifyStatus.loading || verifyStatus.success || verifyStatus.error) && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] max-w-sm w-full px-4"
          >
            <div className={`p-4 rounded-2xl border backdrop-blur-xl shadow-lg flex items-center gap-3 ${
              verifyStatus.error 
                ? 'bg-red-500/10 border-red-500/20 text-red-200' 
                : verifyStatus.success
                ? 'bg-[#00f2ff]/10 border-[#00f2ff]/20 text-[#00f2ff]'
                : 'bg-white/[0.02] border-white/10 text-white'
            }`}>
              {verifyStatus.loading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
              )}
              {verifyStatus.success && <CheckCircle2 size={16} className="text-[#00f2ff] shrink-0" />}
              {verifyStatus.error && <AlertCircle size={16} className="text-red-400 shrink-0" />}
              
              <span className="text-xs font-medium leading-relaxed">
                {verifyStatus.loading && 'Verifying your email...'}
                {verifyStatus.success && 'Email verified successfully! Opening profile...'}
                {verifyStatus.error && verifyStatus.error}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      
      <UserProfilePortal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      
      <PremiumUpgradeModal />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AudioPlayerProvider>
          <ErrorBoundary>
            <MainAppContent />
          </ErrorBoundary>
        </AudioPlayerProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
