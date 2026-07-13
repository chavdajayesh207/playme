import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Shield, Headphones, Bell, Monitor, Info,
  Smartphone, MonitorSpeaker, Check, ToggleLeft, ToggleRight,
  ChevronRight, LogOut, Key, Trash2, Clock
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { LegalModal } from './LegalModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [showLegalDocument, setShowLegalDocument] = useState<'terms' | 'privacy' | null>(null);

  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  React.useEffect(() => {
    if (activeTab === 'account' && user) {
      setSessionsLoading(true);
      const token = localStorage.getItem('playme_token');
      fetch('/api/auth/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.sessions) setSessions(data.sessions);
        if (data.currentSessionId) setCurrentSessionId(data.currentSessionId);
      })
      .catch(console.error)
      .finally(() => setSessionsLoading(false));
    }
  }, [activeTab, user]);

  const removeSession = async (sessionId: string) => {
    const token = localStorage.getItem('playme_token');
    try {
      await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(s => s.filter(x => x.sessionId !== sessionId));
    } catch (e) { console.error(e); }
  };

  const removeAllOtherSessions = async () => {
    const token = localStorage.getItem('playme_token');
    try {
      await fetch(`/api/auth/sessions`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(s => s.filter(x => x.sessionId === currentSessionId));
    } catch (e) { console.error(e); }
  };
  
  // Persisted states
  const [audioQuality, setAudioQuality] = useState(() => localStorage.getItem('playme_audioQuality') || 'high');
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('playme_notifications');
    return saved ? JSON.parse(saved) : { email: true, push: false, updates: true };
  });
  
  const [hardwareAccel, setHardwareAccel] = useState(() => localStorage.getItem('playme_hardwareAccel') !== 'false');
  const [autoAdjustQuality, setAutoAdjustQuality] = useState(() => localStorage.getItem('playme_autoAdjustQuality') !== 'false');
  const [reduceMotion, setReduceMotion] = useState(() => localStorage.getItem('playme_reduceMotion') === 'true');
  const [showLyricsOverlay, setShowLyricsOverlay] = useState(() => localStorage.getItem('playme_showLyricsOverlay') !== 'false');

  // Persistence Effects
  React.useEffect(() => { localStorage.setItem('playme_audioQuality', audioQuality); }, [audioQuality]);
  React.useEffect(() => { localStorage.setItem('playme_notifications', JSON.stringify(notifications)); }, [notifications]);
  React.useEffect(() => { localStorage.setItem('playme_hardwareAccel', hardwareAccel.toString()); }, [hardwareAccel]);
  React.useEffect(() => { localStorage.setItem('playme_autoAdjustQuality', autoAdjustQuality.toString()); }, [autoAdjustQuality]);
  React.useEffect(() => { localStorage.setItem('playme_showLyricsOverlay', showLyricsOverlay.toString()); }, [showLyricsOverlay]);
  
  React.useEffect(() => { 
    localStorage.setItem('playme_reduceMotion', reduceMotion.toString()); 
    if (reduceMotion) document.documentElement.classList.add('reduce-motion');
    else document.documentElement.classList.remove('reduce-motion');
  }, [reduceMotion]);

  if (!isOpen) return null;

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

  const tabs = [
    { id: 'account', label: 'Account Security', icon: Shield },
    { id: 'audio', label: 'Audio Quality', icon: Headphones },
    { id: 'display', label: 'Display & UI', icon: Monitor },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'about', label: 'About PlayMe', icon: Info },
  ];

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[150] flex items-center justify-center p-4 sm:p-8 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative bg-[#001416]/95 border border-white/10 rounded-[32px] w-full max-w-5xl h-[85vh] overflow-hidden shadow-[0_0_80px_rgba(0,242,255,0.15)] flex flex-col md:flex-row"
      >
        {/* Dynamic Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00f2ff]/5 hidden md:block blur-[120px] rounded-full pointer-events-none" />

        {/* Sidebar */}
        <div className="md:w-72 bg-black/40 border-r border-white/5 p-6 flex flex-col shrink-0">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-headline font-bold text-white tracking-wide">Settings</h2>
            <button onClick={onClose} className="md:hidden p-2 bg-white/5 rounded-full text-white/70 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <nav className="flex-1 space-y-2 overflow-y-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/20 shadow-[0_0_15px_rgba(0,242,255,0.1)]' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <tab.icon size={18} className={activeTab === tab.id ? 'text-[#00f2ff]' : 'text-white/40'} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative overflow-y-auto p-6 md:p-10 custom-scrollbar">
          <button onClick={onClose} className="hidden md:flex absolute top-8 right-8 p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/70 hover:text-white transition-all z-20 active:scale-95">
            <X size={20} />
          </button>

          <div className="max-w-2xl mt-4 md:mt-0 relative z-10">
            {/* ACCOUNT TAB */}
            {activeTab === 'account' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                  <Shield className="text-emerald-400" /> Account Details
                </h3>
                
                {user ? (
                  <div className="space-y-4">
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
                      <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Email Address</p>
                      <p className="text-white text-lg font-medium">{user.email}</p>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="bg-black/40 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
                        <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Auth Provider</p>
                        <div className="flex items-center gap-2">
                          <Key size={16} className="text-[#00f2ff]" />
                          <p className="text-white font-medium capitalize">{getProviderLabel(user.provider)}</p>
                        </div>
                      </div>
                      <div className="bg-black/40 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
                        <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Phone Number</p>
                        <p className="text-white font-medium">{user.phoneNumber || 'Not provided'}</p>
                      </div>
                    </div>

                    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
                      <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Account ID</p>
                      <p className="text-white/60 font-mono text-sm break-all">{user.uid}</p>
                    </div>

                    {/* Logged-in Devices Section */}
                    <div className="pt-4 pb-2">
                      <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Monitor size={18} className="text-[#00f2ff]" /> Logged-in Devices
                      </h4>
                      {sessionsLoading ? (
                        <p className="text-white/50 text-sm">Loading sessions...</p>
                      ) : (
                        <div className="space-y-3">
                          {sessions.map((session, idx) => (
                            <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-white/[0.04] transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                  {session.deviceInfo === 'Mobile' ? <Smartphone size={18} className="text-pink-400" /> : <Monitor size={18} className="text-blue-400" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-white font-medium text-sm flex items-center flex-wrap gap-2">
                                    <span className="truncate">{session.os} • {session.browser}</span>
                                    {session.sessionId === currentSessionId && (
                                      <span className="text-[9px] bg-[#00f2ff]/20 text-[#00f2ff] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold shrink-0">
                                        This Device
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-white/40 text-[11px] mt-1 flex items-center gap-1 truncate">
                                    <Clock size={10} /> Last active: {new Date(session.lastActive).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              {session.sessionId !== currentSessionId && (
                                <button 
                                  onClick={() => removeSession(session.sessionId)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-full transition-colors shrink-0 ml-2"
                                  title="Remove Device"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-8 border-t border-white/5">
                      <button 
                        onClick={() => { removeAllOtherSessions(); logout(); onClose(); }}
                        className="flex items-center gap-2 px-6 py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-bold transition-colors border border-red-500/20 w-full justify-center md:w-auto"
                      >
                        <LogOut size={18} /> Sign Out on all devices
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-white/50">You are not logged in.</p>
                )}
              </motion.div>
            )}

            {/* AUDIO TAB */}
            {activeTab === 'audio' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                  <Headphones className="text-[#00f2ff]" /> Audio Quality
                </h3>
                
                <div className="space-y-4">
                  {[
                    { id: 'lossless', title: 'Lossless Hi-Res', desc: 'Maximum quality (up to 24-bit/192kHz). Uses more data.' },
                    { id: 'high', title: 'High Quality', desc: 'Standard premium quality (320kbps). Recommended.' },
                    { id: 'data-saver', title: 'Data Saver', desc: 'Optimized for cellular networks (96kbps).' }
                  ].map(q => (
                    <div 
                      key={q.id}
                      onClick={() => setAudioQuality(q.id)}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        audioQuality === q.id 
                          ? 'bg-[#00f2ff]/10 border-[#00f2ff] shadow-[0_0_20px_rgba(0,242,255,0.15)]' 
                          : 'bg-black/40 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div>
                        <h4 className="text-white font-bold">{q.title}</h4>
                        <p className="text-white/50 text-sm mt-1">{q.desc}</p>
                      </div>
                      {audioQuality === q.id && <Check size={20} className="text-[#00f2ff]" />}
                    </div>
                  ))}
                </div>

                <div className="mt-8 bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-white font-bold">Hardware Acceleration</h4>
                      <p className="text-white/50 text-sm mt-1">Use device GPU for audio processing</p>
                    </div>
                    <button onClick={() => setHardwareAccel(!hardwareAccel)}>
                      {hardwareAccel ? <ToggleRight size={32} className="text-[#00f2ff]" /> : <ToggleLeft size={32} className="text-white/30" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-bold">Auto-adjust Quality</h4>
                      <p className="text-white/50 text-sm mt-1">Dynamically adapt based on network speed</p>
                    </div>
                    <button onClick={() => setAutoAdjustQuality(!autoAdjustQuality)}>
                      {autoAdjustQuality ? <ToggleRight size={32} className="text-[#00f2ff]" /> : <ToggleLeft size={32} className="text-white/30" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                  <Bell className="text-yellow-400" /> Notifications
                </h3>

                <div className="space-y-4">
                  <div className="bg-black/40 border border-white/5 p-6 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-bold">Email Notifications</h4>
                      <p className="text-white/50 text-sm mt-1">Receive weekly summaries and artist updates</p>
                    </div>
                    <button onClick={() => setNotifications({...notifications, email: !notifications.email})}>
                      {notifications.email ? <ToggleRight size={32} className="text-[#00f2ff]" /> : <ToggleLeft size={32} className="text-white/30" />}
                    </button>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-6 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-bold">Push Notifications</h4>
                      <p className="text-white/50 text-sm mt-1">Get instantly notified for new releases</p>
                    </div>
                    <button onClick={() => setNotifications({...notifications, push: !notifications.push})}>
                      {notifications.push ? <ToggleRight size={32} className="text-[#00f2ff]" /> : <ToggleLeft size={32} className="text-white/30" />}
                    </button>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-6 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-bold">App Updates</h4>
                      <p className="text-white/50 text-sm mt-1">New feature announcements</p>
                    </div>
                    <button onClick={() => setNotifications({...notifications, updates: !notifications.updates})}>
                      {notifications.updates ? <ToggleRight size={32} className="text-[#00f2ff]" /> : <ToggleLeft size={32} className="text-white/30" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* DISPLAY TAB */}
            {activeTab === 'display' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                  <Monitor className="text-pink-400" /> Display & UI
                </h3>
                
                <div className="bg-black/40 border border-white/5 p-6 rounded-2xl mb-6">
                  <h4 className="text-white font-bold mb-4">Theme Appearance</h4>
                  <div className="p-4 rounded-xl border border-[#00f2ff] bg-[#00f2ff]/10 text-center shadow-[0_0_15px_rgba(0,242,255,0.1)] flex items-center justify-center gap-3">
                    <MonitorSpeaker className="text-[#00f2ff]" size={24} />
                    <span className="text-white text-sm font-bold">System Default</span>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="bg-black/40 border border-white/5 p-6 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-bold">Reduce Motion</h4>
                      <p className="text-white/50 text-sm mt-1">Minimize animations for performance</p>
                    </div>
                    <button onClick={() => setReduceMotion(!reduceMotion)}>
                      {reduceMotion ? <ToggleRight size={32} className="text-[#00f2ff]" /> : <ToggleLeft size={32} className="text-white/30" />}
                    </button>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-6 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-bold">Show Lyrics Overlay</h4>
                      <p className="text-white/50 text-sm mt-1">Automatically show lyrics on track change</p>
                    </div>
                    <button onClick={() => setShowLyricsOverlay(!showLyricsOverlay)}>
                      {showLyricsOverlay ? <ToggleRight size={32} className="text-[#00f2ff]" /> : <ToggleLeft size={32} className="text-white/30" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ABOUT TAB */}
            {activeTab === 'about' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center justify-center md:justify-start gap-2">
                  <Info className="text-purple-400" /> About PlayMe
                </h3>
                
                <div className="bg-black/40 border border-white/5 p-8 rounded-3xl flex flex-col items-center md:items-start mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#00f2ff] to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
                     <MonitorSpeaker className="text-white" size={32} />
                  </div>
                  <h4 className="text-3xl font-headline font-black text-white mb-2">PlayMe Music</h4>
                  <p className="text-white/50 mb-6">Version 5.4.0 Build 2026</p>
                  
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <button className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer">Check for Updates</button>
                    <button onClick={() => setShowLegalDocument('terms')} className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer">Terms of Service</button>
                    <button onClick={() => setShowLegalDocument('privacy')} className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer">Privacy Policy</button>
                  </div>
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </motion.div>
      <LegalModal document={showLegalDocument} onClose={() => setShowLegalDocument(null)} />
    </div>
  );
};
