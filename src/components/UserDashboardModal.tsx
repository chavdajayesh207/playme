import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Shield, ShieldCheck, Music, Heart, FileAudio, Sliders, VolumeX, Eye, HelpCircle, LogOut } from 'lucide-react';
import { useAudioPlayer } from './AudioPlayerContext';
import { useAuth } from './AuthContext';

interface UserDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserDashboardModal: React.FC<UserDashboardModalProps> = ({ isOpen, onClose }) => {
  const { user, logout, sendVerificationEmail } = useAuth();
  const {
    allTracks,
    favoriteIds,
    videoOpacity,
    setVideoOpacity,
    lyricsOffset,
    setLyricsOffset,
    isSubscribed
  } = useAudioPlayer();

  if (!isOpen) return null;

  const uploadedCount = allTracks.filter(t => t.id.startsWith('user-')).length;
  const favoritesCount = favoriteIds.length;

  const [verificationSent, setVerificationSent] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleResendVerification = async () => {
    setVerifying(true);
    try {
      await sendVerificationEmail();
      setVerificationSent(true);
    } catch (err) {
      console.warn('[UserDashboard] Verification email resend failed:', err);
    } finally {
      setVerifying(false);
    }
  };

  const handleDisconnect = () => {
    logout();
    onClose();
  };

  const handleConnect = () => {
    onClose();
    window.dispatchEvent(new CustomEvent('open-auth-modal'));
  };

  const handleUpgrade = () => {
    onClose();
    window.dispatchEvent(new CustomEvent('open-upgrade-modal'));
  };

  return (
    <div id="user-dashboard-overlay" className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.4 }}
        id="user-dashboard-content"
        className="relative bg-white/[0.02] border border-white/[0.08] backdrop-blur-2xl rounded-3xl w-full max-w-lg overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.6)] p-6 md:p-8 flex flex-col gap-6"
      >
        {/* Neon Glow Accents */}
        <div className="absolute top-[-10%] left-[-10%] w-56 h-56 bg-[#00f2ff]/6 rounded-full hidden md:block blur-[60px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-56 h-56 bg-pink-500/6 rounded-full hidden md:block blur-[60px] pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-center relative z-10">
          <h3 className="font-headline-lg text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sliders size={20} className="text-[#00f2ff]" />
            <span>User Studio Control</span>
          </h3>
          <button
            onClick={onClose}
            className="text-[#b9cacb] hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Card */}
        <div className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-4 relative z-10 backdrop-blur-md">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-pink-500/50 shrink-0 flex items-center justify-center bg-white/5 shadow-md">
            {user?.photoURL ? (
              <img alt={user.displayName || 'User'} src={user.photoURL} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-pink-400 uppercase">
                {(user?.displayName || user?.email || 'G').slice(0, 2)}
              </span>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <h4 className="text-md font-bold text-white truncate">
              {user ? (user.displayName || 'Active Member') : 'Guest Listener'}
            </h4>
            <p className="text-xs text-[#b9cacb]/60 truncate mt-0.5 font-sans">
              {user ? (user.email || 'Local Profile') : 'Offline session mode'}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
              {isSubscribed ? (
                <span className="inline-flex items-center gap-1 text-[9px] font-label-mono bg-pink-500/15 border border-pink-500/30 text-pink-400 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  <ShieldCheck size={10} />
                  <span>Playme Pro</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[9px] font-label-mono bg-white/5 border border-white/10 text-[#b9cacb] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  <Shield size={10} />
                  <span>Free Member</span>
                </span>
              )}

              {user && (
                user.isVerified ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-label-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    <ShieldCheck size={10} />
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[9px] font-label-mono bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      <span>Unverified</span>
                    </span>
                    <button
                      onClick={handleResendVerification}
                      disabled={verifying || verificationSent}
                      className="text-[10px] text-[#00f2ff] hover:underline cursor-pointer bg-transparent border-none p-0 disabled:text-gray-500 font-bold"
                    >
                      {verifying ? 'Sending...' : verificationSent ? 'Email Sent!' : 'Verify Now'}
                    </button>
                  </span>
                )
              )}
            </div>
          </div>

          {!isSubscribed && (
            <button
              onClick={handleUpgrade}
              className="px-4.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:scale-105 active:scale-95 transition-all text-white shadow-md shadow-pink-500/25 shrink-0 cursor-pointer"
            >
              Get Pro
            </button>
          )}
        </div>

        {/* Grid Stats */}
        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 shrink-0">
              <Heart size={16} fill="currentColor" />
            </div>
            <div>
              <p className="text-[10px] text-[#b9cacb]/60 uppercase tracking-widest font-label-mono">Liked Songs</p>
              <p className="text-lg font-bold text-white mt-0.5">{favoritesCount}</p>
            </div>
          </div>

          <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#00f2ff]/10 flex items-center justify-center text-[#00f2ff] shrink-0">
              <FileAudio size={16} />
            </div>
            <div>
              <p className="text-[10px] text-[#b9cacb]/60 uppercase tracking-widest font-label-mono">My Uploads</p>
              <p className="text-lg font-bold text-white mt-0.5">{uploadedCount}</p>
            </div>
          </div>
        </div>

        {/* Interactive Customizations (Accessible to All Users) */}
        <div className="flex flex-col gap-4 bg-white/[0.01] border border-white/5 p-4 rounded-2xl relative z-10">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2 flex items-center gap-1.5">
            <Eye size={13} className="text-purple-400" />
            <span>Display & Lyrics Settings</span>
          </h4>

          {/* Visualizer Opacity Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#b9cacb]">Visualizer Opacity</span>
              <span className="font-mono font-bold text-white">{Math.round(videoOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={videoOpacity}
              onChange={(e) => setVideoOpacity(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00f2ff]"
            />
          </div>

          {/* Lyrics Delay Adjuster */}
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-[#b9cacb]">Lyrics Offset Delay</span>
              <span className="font-mono font-bold text-white">{lyricsOffset > 0 ? `+${lyricsOffset}` : lyricsOffset}s</span>
            </div>
            <input
              type="range"
              min="-10"
              max="10"
              step="0.5"
              value={lyricsOffset}
              onChange={(e) => setLyricsOffset(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-1 relative z-10 select-none">
          <div className="flex items-center gap-1 text-[10px] text-[#b9cacb]/40">
            <HelpCircle size={12} />
            <span>Need assistance? Support 24/7</span>
          </div>

          {user ? (
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-1.5 px-4.5 py-2 text-xs font-bold rounded-xl bg-white/5 hover:bg-red-500/10 text-[#b9cacb] hover:text-red-400 border border-white/5 transition-all cursor-pointer"
            >
              <LogOut size={12} />
              <span>Disconnect</span>
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-[#00f2ff]/10 hover:bg-[#00f2ff] hover:text-black border border-[#00f2ff]/30 transition-all text-[#00f2ff] cursor-pointer"
            >
              <User size={12} />
              <span>Connect Account</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
