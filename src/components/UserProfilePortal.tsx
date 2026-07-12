/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, User, Mail, Phone, LogOut, Edit2, Save, AlertCircle,
  CheckCircle2, Shield, Calendar, Settings, Lock, Play, Heart,
  Download, Crown, Activity, Headphones, Music, Star, Clock, Disc, ChevronRight, Zap, BadgeCheck, ListMusic
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { useAudioPlayer } from './AudioPlayerContext';
import { Logo } from './Logo';
import { SettingsModal } from './SettingsModal';
import { LegalModal } from './LegalModal';

interface UserProfilePortalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfilePortal: React.FC<UserProfilePortalProps> = ({ isOpen, onClose }) => {
  const { user, logout, updateUserProfile, isSubscribed, setShowPremiumModal } = useAuth();
  const { allTracks, favoriteIds, playlists, playTrack } = useAudioPlayer();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLegalDocument, setShowLegalDocument] = useState<'terms' | 'privacy' | null>(null);

  // Computed Real Data
  const favoriteTracks = useMemo(() => allTracks.filter(t => favoriteIds.includes(t.id)), [allTracks, favoriteIds]);
  
  const topArtists = useMemo(() => {
    // Extract unique artists from favorites, fallback to all tracks
    const sourceTracks = favoriteTracks.length > 0 ? favoriteTracks : allTracks;
    const artistCounts: Record<string, { name: string, image: string, count: number }> = {};
    
    sourceTracks.forEach(t => {
      if (!t.artist) return;
      if (!artistCounts[t.artist]) {
        artistCounts[t.artist] = {
          name: t.artist,
          image: t.coverUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80',
          count: 0
        };
      }
      artistCounts[t.artist].count += 1;
    });

    return Object.values(artistCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4); // Top 4
  }, [favoriteTracks, allTracks]);

  if (!isOpen || !user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Display name cannot be empty.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await updateUserProfile({
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim() || undefined
      });
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (err) {
      console.error('Logout failed:', err);
      setError('Failed to logout. Please try again.');
    }
  };

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case 'google.com': return 'Google Account';
      case 'github.com': return 'GitHub Account';
      case 'apple.com': return 'Apple ID';
      case 'phone': return 'Phone Auth';
      case 'password': return 'Email & Password';
      default: return provider;
    }
  };

  return (
    <div id="user-profile-overlay" className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[100] flex items-center justify-center p-0 sm:p-4 md:p-8 overflow-hidden font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 40 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        id="user-profile-content"
        className="relative bg-[#001416]/90 backdrop-blur-3xl w-full max-w-[1600px] h-full sm:rounded-[32px] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,1)] border border-white/10"
      >
        {/* Dynamic Glowing Background Blob */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[50%] bg-[#00f2ff]/10 hidden md:block blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/5 hidden md:block blur-[120px] rounded-full pointer-events-none" />

        {/* --- HEADER SECTION --- */}
        <div className="relative pt-20 pb-10 px-8 md:px-12 lg:px-16 flex flex-col md:flex-row items-center md:items-end gap-8 shrink-0 border-b border-white/5 bg-gradient-to-b from-[#00f2ff]/5 to-transparent">
          
          {/* Top Nav Actions */}
          <div className="absolute top-6 right-6 md:top-8 md:right-8 flex items-center gap-4 z-20">
            <button onClick={() => setIsSettingsOpen(true)} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-white transition-all hover:scale-105 active:scale-95" title="Settings">
              <Settings size={20} />
            </button>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-white transition-all hover:scale-105 active:scale-95">
              <X size={20} />
            </button>
          </div>

          <Logo className="absolute top-6 left-6 md:top-8 md:left-8 h-8 w-auto text-white opacity-80" withText={true} />

          {/* Animated Avatar */}
          <div className="relative group shrink-0 mt-8 md:mt-0">
            <div className="absolute -inset-2 bg-gradient-to-tr from-[#00f2ff] via-blue-500 to-purple-600 rounded-full animate-[spin_4s_linear_infinite] opacity-80 blur-[4px]" />
            <div className="absolute -inset-1 bg-gradient-to-tr from-[#00f2ff] via-blue-500 to-purple-600 rounded-full" />
            <div className="absolute -inset-1 bg-gradient-to-tr from-[#00f2ff] via-blue-500 to-purple-600 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative w-40 h-40 md:w-56 md:h-56 rounded-full bg-[#121212] border-[6px] border-[#080808] flex items-center justify-center overflow-hidden z-10 shadow-2xl transition-transform duration-500 group-hover:scale-[0.98]">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
              ) : (
                <User size={80} className="text-white/20" />
              )}
              <button onClick={() => setIsEditing(true)} className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                <Edit2 size={32} className="text-white mb-2" />
                <span className="text-sm font-bold text-white tracking-wider">EDIT</span>
              </button>
            </div>
          </div>

          {/* User Details */}
          <div className="flex flex-col gap-2 text-center md:text-left z-10 mt-4 md:mt-0">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
              <BadgeCheck className="text-blue-400" size={20} />
              <span className="text-xs font-bold text-white uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded-full">
                PlayMe User
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-headline font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#00f2ff]/70 tracking-tighter leading-none py-1 drop-shadow-lg">
              {user.displayName || 'Guest'}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-4 text-sm font-medium text-white/50 mt-2">
              <span className="flex items-center gap-1"><Crown size={16} className={isSubscribed ? "text-yellow-500" : "text-gray-500"} /> {isSubscribed ? 'Premium' : 'Free Plan'}</span>
              <span>•</span>
              <span>Joined {new Date(user.createdAt).getFullYear() || '2026'}</span>
            </div>
          </div>
        </div>

        {/* --- SCROLLABLE CONTENT --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-12 lg:px-16 pb-32 relative z-10">
          
          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-8 gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => { if (favoriteTracks.length > 0) playTrack(favoriteTracks[0], favoriteTracks); }}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-[#002022] transition-all ${favoriteTracks.length > 0 ? 'bg-[#00f2ff] hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(0,242,255,0.4)]' : 'bg-white/10 opacity-50 cursor-not-allowed'}`}
              >
                <Play size={24} className="ml-1 fill-[#002022]" />
              </button>
              <button onClick={() => setIsEditing(!isEditing)} className="px-6 py-2.5 rounded-full border border-white/20 text-white font-bold text-sm hover:bg-white/10 transition-colors">
                {isEditing ? 'Cancel Editing' : 'Edit Profile'}
              </button>
              <button className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                <Activity size={18} />
              </button>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 px-4 py-2 rounded-full transition-colors text-sm font-bold tracking-wider">
              <LogOut size={18} /> LOGOUT
            </button>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-8">
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 rounded-2xl p-4 flex gap-3 items-center text-sm font-bold shadow-lg">
                  <AlertCircle size={20} className="text-red-500" />
                  <p>{error}</p>
                </div>
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-8">
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 rounded-2xl p-4 flex gap-3 items-center text-sm font-bold shadow-lg">
                  <CheckCircle2 size={20} className="text-emerald-500" />
                  <p>{success}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isEditing && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.03] border border-white/10 p-8 rounded-[32px] shadow-2xl mb-12 backdrop-blur-xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3"><Edit2 size={24} className="text-purple-400" /> Edit Your Details</h2>
              <form onSubmit={handleSaveProfile} className="space-y-6 max-w-2xl">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[11px] font-bold text-white/50 mb-2 block uppercase tracking-widest pl-1">Display Name</label>
                    <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all" placeholder="Your display name" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-white/50 mb-2 block uppercase tracking-widest pl-1">Phone Number (Optional)</label>
                    <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all" placeholder="+1 (555) 000-0000" />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" disabled={loading} className="px-8 py-4 rounded-2xl bg-white text-black font-bold text-sm hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2">
                    <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} className="px-8 py-4 rounded-2xl bg-transparent border border-white/20 text-white font-bold text-sm hover:bg-white/5 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* --- REAL STATS GRID --- */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
            {[
              { 
                icon: Headphones, 
                label: 'All Platform Tracks', 
                value: allTracks.length.toString(), 
                color: 'text-purple-400', 
                bg: 'bg-purple-500/10',
                onClick: () => {
                  window.dispatchEvent(new CustomEvent('playme-navigate', { 
                    detail: { tab: 'genres', subtab: 'local' } 
                  }));
                  onClose();
                }
              },
              { 
                icon: Heart, 
                label: 'Saved Favorites', 
                value: favoriteTracks.length.toString(), 
                color: 'text-pink-400', 
                bg: 'bg-pink-500/10',
                onClick: () => {
                  window.dispatchEvent(new CustomEvent('playme-navigate', { 
                    detail: { tab: 'favorites', librarySubTab: 'favorites' } 
                  }));
                  onClose();
                }
              },
              { 
                icon: ListMusic, 
                label: 'My Playlists', 
                value: playlists.length.toString(), 
                color: 'text-blue-400', 
                bg: 'bg-blue-500/10',
                onClick: () => {
                  window.dispatchEvent(new CustomEvent('playme-navigate', { 
                    detail: { tab: 'favorites', librarySubTab: 'playlists' } 
                  }));
                  onClose();
                }
              },
              { 
                icon: Star, 
                label: 'Top Artists', 
                value: topArtists.length.toString(), 
                color: 'text-yellow-400', 
                bg: 'bg-yellow-500/10',
                onClick: () => {
                  const element = document.getElementById('portal-top-artists-section');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }
              }
            ].map((stat, i) => (
              <div 
                key={i} 
                onClick={stat.onClick}
                className="bg-[#1c1b1c]/40 border border-white/5 rounded-3xl p-6 hover:bg-[#1c1b1c]/60 hover:border-[#00f2ff]/20 hover:shadow-[0_0_25px_rgba(0,242,255,0.08)] hover:-translate-y-1 transition-all duration-300 group cursor-pointer backdrop-blur-md relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                <div className={`w-12 h-12 rounded-full ${stat.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative z-10`}>
                  <stat.icon size={24} className={stat.color} />
                </div>
                <h3 className="text-3xl font-headline font-bold text-white mb-1 relative z-10">{stat.value}</h3>
                <p className="text-[11px] font-sans text-[#b9cacb]/60 relative z-10">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* --- MAIN DASHBOARD COLUMNS --- */}
          <div className="grid lg:grid-cols-3 gap-8 md:gap-12 mb-12">
            
            {/* LEFT COLUMN: Top Tracks & Account */}
            <div className="lg:col-span-2 space-y-12">
              
              {/* Real Favorite Tracks */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Star className="text-yellow-400" /> Your Favorite Tracks</h2>
                  {favoriteTracks.length > 5 && <button className="text-sm font-bold text-white/50 hover:text-white uppercase tracking-wider">See All ({favoriteTracks.length})</button>}
                </div>
                {favoriteTracks.length > 0 ? (
                  <div className="space-y-3">
                    {favoriteTracks.slice(0, 8).map((track, i) => (
                      <div key={track.id} onClick={() => playTrack(track, favoriteTracks)} className="flex items-center gap-3.5 p-3 rounded-2xl cursor-pointer transition-all duration-300 border border-white/5 bg-[#1c1b1c]/40 hover:border-white/15 hover:bg-[#1c1b1c]/60 group relative overflow-hidden">
                        <div className="w-4 text-center text-[10px] text-white/30 font-bold group-hover:hidden ml-1">{i + 1}</div>
                        <div className="w-4 text-center hidden group-hover:block ml-1"><Play size={12} className="text-[#00f2ff] fill-[#00f2ff]" /></div>
                        
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 ml-2">
                          <img src={track.coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=150&q=80'} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play size={18} className="text-white fill-white" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0 ml-1">
                          <h4 className="font-semibold text-[13px] leading-snug line-clamp-1 transition-colors text-white group-hover:text-[#00f2ff]">{track.title}</h4>
                          <p className="text-[11px] text-[#b9cacb]/60 mt-0.5 truncate">{track.artist}</p>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-[#b9cacb]/60 hover:text-pink-400">
                          <Heart size={18} className="fill-pink-500 text-pink-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 text-center">
                    <Heart size={48} className="text-white/10 mx-auto mb-4" />
                    <p className="text-white/40">You haven't favorited any tracks yet. Go discover some music!</p>
                  </div>
                )}
              </div>

              {/* Settings Shortcut */}
              <div>
                <button onClick={() => setIsSettingsOpen(true)} className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:bg-white/[0.05] hover:border-white/20 transition-all cursor-pointer text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Shield className="text-emerald-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Account & Security</h3>
                      <p className="text-white/50 text-sm">Manage your email, password, and active sessions</p>
                    </div>
                  </div>
                  <ChevronRight className="text-white/30 group-hover:text-white transition-colors" />
                </button>
              </div>

            </div>

            {/* RIGHT COLUMN: Subscription & Artists */}
            <div className="space-y-12">
              
              {/* Premium Subscription Card */}
              <div className="relative bg-gradient-to-br from-[#00f2ff]/20 via-[#002022] to-black p-1 rounded-[32px] overflow-hidden group shadow-[0_0_40px_rgba(0,242,255,0.05)]">
                <div className="absolute inset-0 bg-gradient-to-r from-[#00f2ff] via-blue-500 to-transparent opacity-20 group-hover:opacity-40 blur-xl transition-opacity duration-500" />
                <div className="relative bg-[#030303]/80 backdrop-blur-2xl rounded-[28px] p-8 h-full border border-white/10">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <span className="bg-white text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block">Active Plan</span>
                      <h3 className="text-3xl font-headline font-black text-white">{isSubscribed ? 'Premium' : 'Free Tier'}</h3>
                    </div>
                    <Crown size={32} className={`${isSubscribed ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 'text-gray-500'}`} />
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60 font-medium">Audio Quality</span>
                      <span className="text-white font-bold bg-white/10 px-2 py-1 rounded-md">{isSubscribed ? 'Lossless Hi-Res' : 'Standard'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60 font-medium">Downloads</span>
                      <span className="text-white font-bold bg-white/10 px-2 py-1 rounded-md">{isSubscribed ? 'Unlimited' : 'None'}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      if (!isSubscribed) {
                        onClose();
                        setShowPremiumModal(true);
                      }
                    }}
                    className="w-full py-4 rounded-xl bg-[#00f2ff] hover:bg-[#00f2ff]/80 text-[#002022] font-bold text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(0,242,255,0.3)] active:scale-95"
                  >
                    {isSubscribed ? 'Manage Subscription' : 'Upgrade to Premium'}
                  </button>
                </div>
              </div>

              {/* Real Top Artists from Context */}
              <div id="portal-top-artists-section">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><Disc className="text-cyan-400" /> Top Artists</h2>
                {topArtists.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {topArtists.map((artist, idx) => (
                      <div key={idx} className="flex flex-col items-center p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-colors group cursor-pointer text-center">
                        <img src={artist.image} alt={artist.name} className="w-24 h-24 rounded-full object-cover mb-3 shadow-lg group-hover:scale-105 transition-transform duration-300" />
                        <h4 className="text-white font-bold truncate w-full">{artist.name}</h4>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">{artist.count} saved tracks</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/40 text-sm">No artists saved yet.</p>
                )}
              </div>

            </div>
          </div>

          {/* --- REAL PLAYLISTS CAROUSEL --- */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Music className="text-pink-400" /> Your Playlists</h2>
            </div>
            {playlists.length > 0 ? (
              <div className="flex gap-6 overflow-x-auto custom-scrollbar pb-8 -mx-6 px-6 md:-mx-12 md:px-12 lg:-mx-16 lg:px-16 snap-x">
                {playlists.map(playlist => (
                  <div key={playlist.id} className="min-w-[200px] md:min-w-[240px] snap-start group cursor-pointer">
                    <div className="aspect-square w-full rounded-2xl bg-gradient-to-br from-[#00f2ff]/20 to-[#002022] border border-white/5 p-4 flex flex-col justify-end relative overflow-hidden shadow-xl mb-4 group-hover:-translate-y-2 transition-all duration-300 group-hover:border-[#00f2ff]/30">
                      {/* Pattern background */}
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] [background-size:16px_16px]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#030303]/90 via-black/20 to-transparent" />
                      <div className="relative z-10 flex items-center justify-between">
                        <span className="text-[#b9cacb]/80 text-[11px] font-bold tracking-widest uppercase">{playlist.trackIds.length} Songs</span>
                      </div>
                    </div>
                    <h4 className="text-white font-bold text-lg truncate group-hover:text-purple-400 transition-colors">{playlist.name}</h4>
                    <p className="text-white/40 text-sm font-medium">Created {new Date(playlist.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
               <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 text-center">
                 <ListMusic size={48} className="text-white/10 mx-auto mb-4" />
                 <p className="text-white/40">You haven't created any playlists yet.</p>
               </div>
            )}
          </div>

          {/* --- APP INFO & LINKS --- */}
          <div className="mt-16 pt-8 border-t border-white/5 flex flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-6 text-sm font-medium text-white/50">
              <button onClick={() => setShowLegalDocument('terms')} className="hover:text-[#00f2ff] transition-colors cursor-pointer">Terms of Service</button>
              <span className="w-1 h-1 bg-white/20 rounded-full" />
              <button onClick={() => setShowLegalDocument('privacy')} className="hover:text-[#00f2ff] transition-colors cursor-pointer">Privacy Policy</button>
            </div>
            <p className="text-[10px] text-white/30 font-mono tracking-widest">
              PLAYME VERSION 5.4.0 BUILD 2026
            </p>
          </div>

        </div>
      </motion.div>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <LegalModal document={showLegalDocument} onClose={() => setShowLegalDocument(null)} />
    </div>
  );
};
