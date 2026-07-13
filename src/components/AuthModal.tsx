import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { Logo } from './Logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthTab = 'login' | 'signup' | 'forgot' | 'reset';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    loginWithEmail,
    signUpWithEmail,
    resetPassword,
    resetPasswordConfirm
  } = useAuth();

  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('login');
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setOtp('');
    setName('');
    setError(null);
    setSuccess(null);
    setLoading(false);
  };

  const handleTabChange = (tab: AuthTab) => {
    setError(null);
    setSuccess(null);
    setLoading(false);
    setActiveTab(tab);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both valid email and password credentials.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await loginWithEmail(email, password);
      setSuccess('Logged in successfully!');
      setTimeout(() => {
        onClose();
        clearForm();
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      setError('All fields are required to create a Playme account.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signUpWithEmail(email, password, name);
      setSuccess('Account created and logged in successfully! Welcome email sent.');
      setTimeout(() => {
        onClose();
        clearForm();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email to request recovery.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await resetPassword(email);
      setSuccess('OTP sent successfully! Check your inbox.');
      setTimeout(() => {
        setActiveTab('reset');
        setSuccess(null);
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Unable to locate account with this email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the 6-digit OTP sent to your email.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await resetPasswordConfirm(email, otp, password);
      setSuccess('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        setActiveTab('login');
        clearForm();
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. OTP might be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialClick = (provider: string) => {
    setError(`Login with ${provider} is disabled. Please sign in using your email credentials.`);
  };

  if (!isOpen) return null;

  return (
    <div id="auth-modal-overlay" className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', duration: 0.45 }}
        id="auth-modal-content"
        className="relative bg-[#001416]/95 backdrop-blur-xl border border-white/10 rounded-[32px] w-full max-w-4xl overflow-hidden shadow-[0_0_80px_rgba(0,242,255,0.15)] grid grid-cols-1 md:grid-cols-2"
      >
        {/* Left Side: Form Column */}
        <div className="p-8 md:p-12 flex flex-col justify-center relative z-10 min-h-[500px]">
          
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              <Logo size={24} theme="dark" animate={true} />
            </div>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer animate-pulse-slow"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-grow flex flex-col justify-center">
            {/* Dynamic Headers */}
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                {activeTab === 'login' && 'Access your account'}
                {activeTab === 'signup' && 'Create an account'}
                {activeTab === 'forgot' && 'Reset your password'}
                {activeTab === 'reset' && 'Set new password'}
              </h2>
            </div>

            {/* Notification Messages */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-200 p-3 rounded-2xl text-xs leading-normal font-sans mb-4"
                >
                  <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                  <span className="flex-1">{error}</span>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-start gap-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 p-3 rounded-2xl text-xs leading-normal font-sans mb-4"
                >
                  <CheckCircle2 size={15} className="text-[#0fac6d] shrink-0 mt-0.5" />
                  <span className="flex-1">{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Forms Container */}
            <AnimatePresence mode="wait">
              {activeTab === 'login' && (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleEmailLogin}
                  className="space-y-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className={`text-[10px] font-mono uppercase tracking-widest font-semibold transition-colors duration-300 ${
                      focusedField === 'email' ? 'text-[#00f2ff]' : 'text-white/40'
                    }`}>
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. jayesh@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="w-full bg-black/50 border border-white/10 rounded-full px-5 py-3.5 text-xs text-white focus:outline-none focus:border-[#00f2ff]/50 placeholder:text-white/20 font-sans transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className={`text-[10px] font-mono uppercase tracking-widest font-semibold transition-colors duration-300 ${
                        focusedField === 'password' ? 'text-[#00f2ff]' : 'text-white/40'
                      }`}>
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => handleTabChange('forgot')}
                        className="text-[10px] text-[#00f2ff] hover:underline cursor-pointer bg-transparent border-none p-0 font-bold"
                      >
                        Forgot?
                      </button>
                    </div>
                    <input
                      type="password"
                      placeholder="Enter password..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="w-full bg-black/50 border border-white/10 rounded-full px-5 py-3.5 text-xs text-white focus:outline-none focus:border-[#00f2ff]/50 placeholder:text-white/20 font-sans transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#00f2ff] text-[#002022] font-bold text-xs py-4 rounded-full font-sans cursor-pointer hover:bg-[#00f2ff]/80 transition-colors shadow-[0_0_20px_rgba(0,242,255,0.3)] active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? 'Logging In...' : 'Log in'}
                  </button>

                </motion.form>
              )}

              {activeTab === 'signup' && (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleEmailSignUp}
                  className="space-y-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className={`text-[10px] font-mono uppercase tracking-widest font-semibold transition-colors duration-300 ${
                      focusedField === 'name' ? 'text-[#00f2ff]' : 'text-white/40'
                    }`}>
                      Username
                    </label>
                    <input
                      type="text"
                      placeholder="Username"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="w-full bg-black/50 border border-white/10 rounded-full px-5 py-3.5 text-xs text-white focus:outline-none focus:border-[#00f2ff]/50 placeholder:text-white/20 font-sans transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={`text-[10px] font-mono uppercase tracking-widest font-semibold transition-colors duration-300 ${
                      focusedField === 'email' ? 'text-[#00f2ff]' : 'text-white/40'
                    }`}>
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="w-full bg-black/50 border border-white/10 rounded-full px-5 py-3.5 text-xs text-white focus:outline-none focus:border-[#00f2ff]/50 placeholder:text-white/20 font-sans transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={`text-[10px] font-mono uppercase tracking-widest font-semibold transition-colors duration-300 ${
                      focusedField === 'password' ? 'text-[#00f2ff]' : 'text-white/40'
                    }`}>
                      Password
                    </label>
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="w-full bg-black/50 border border-white/10 rounded-full px-5 py-3.5 text-xs text-white focus:outline-none focus:border-[#00f2ff]/50 placeholder:text-white/20 font-sans transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#00f2ff] text-[#002022] font-bold text-xs py-4 rounded-full font-sans cursor-pointer hover:bg-[#00f2ff]/80 transition-colors shadow-[0_0_20px_rgba(0,242,255,0.3)] active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? 'Creating Account...' : 'Sign up'}
                  </button>

                </motion.form>
              )}

              {activeTab === 'forgot' && (
                <motion.form
                  key="forgot"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleForgotPassword}
                  className="space-y-4"
                >
                  <button
                    type="button"
                    onClick={() => handleTabChange('login')}
                    className="inline-flex items-center gap-1.5 text-[10px] font-mono text-white/40 hover:text-white transition-colors uppercase font-bold self-start cursor-pointer border-none bg-transparent mb-2"
                  >
                    <ArrowLeft size={11} />
                    <span>Back to log in</span>
                  </button>

                  <div className="flex flex-col gap-1.5">
                    <label className={`text-[10px] font-mono uppercase tracking-widest font-semibold transition-colors duration-300 ${
                      focusedField === 'email' ? 'text-[#00f2ff]' : 'text-white/40'
                    }`}>
                      Registered Email
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. jayesh@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="w-full bg-black/50 border border-white/10 rounded-full px-5 py-3.5 text-xs text-white focus:outline-none focus:border-[#00f2ff]/50 placeholder:text-white/20 font-sans transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#00f2ff] text-[#002022] font-bold text-xs py-4 rounded-full font-sans cursor-pointer hover:bg-[#00f2ff]/80 transition-colors shadow-[0_0_20px_rgba(0,242,255,0.3)] active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? 'Dispatched Request...' : 'Send Recovery Email'}
                  </button>
                </motion.form>
              )}

              {activeTab === 'reset' && (
                <motion.form
                  key="reset"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleResetPassword}
                  className="space-y-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className={`text-[10px] font-mono uppercase tracking-widest font-semibold transition-colors duration-300 ${
                      focusedField === 'otp' ? 'text-[#00f2ff]' : 'text-white/40'
                    }`}>
                      6-Digit OTP
                    </label>
                    <input
                      type="text"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      onFocus={() => setFocusedField('otp')}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="w-full bg-black/50 border border-white/10 rounded-full px-5 py-3.5 text-xs text-white focus:outline-none focus:border-[#00f2ff]/50 placeholder:text-white/20 font-sans transition-all tracking-[5px]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={`text-[10px] font-mono uppercase tracking-widest font-semibold transition-colors duration-300 ${
                      focusedField === 'password' ? 'text-[#00f2ff]' : 'text-white/40'
                    }`}>
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="w-full bg-black/50 border border-white/10 rounded-full px-5 py-3.5 text-xs text-white focus:outline-none focus:border-[#00f2ff]/50 placeholder:text-white/20 font-sans transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={`text-[10px] font-mono uppercase tracking-widest font-semibold transition-colors duration-300 ${
                      focusedField === 'confirmPassword' ? 'text-[#00f2ff]' : 'text-white/40'
                    }`}>
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="w-full bg-black/50 border border-white/10 rounded-full px-5 py-3.5 text-xs text-white focus:outline-none focus:border-[#00f2ff]/50 placeholder:text-white/20 font-sans transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#00f2ff] text-[#002022] font-bold text-xs py-4 rounded-full font-sans cursor-pointer hover:bg-[#00f2ff]/80 transition-colors shadow-[0_0_20px_rgba(0,242,255,0.3)] active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? 'Updating Password...' : 'Reset Password'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Already have an account footer toggle */}
            {activeTab !== 'forgot' && activeTab !== 'reset' && (
              <div className="mt-8 text-center text-xs text-white/50 font-sans select-none">
                {activeTab === 'login' ? (
                  <p>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => handleTabChange('signup')}
                      className="text-[#00f2ff] hover:underline font-bold cursor-pointer font-sans bg-transparent border-none p-0 ml-1"
                    >
                      Sign up
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => handleTabChange('login')}
                      className="text-[#00f2ff] hover:underline font-bold cursor-pointer font-sans bg-transparent border-none p-0 ml-1"
                    >
                      Login
                    </button>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Visual Accent */}
        <div className="hidden md:block p-6 h-full min-h-[500px] select-none bg-[#020202] relative overflow-hidden">
          {/* Abstract background blobs */}
          <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-gradient-to-br from-[#00f2ff]/20 via-purple-600/10 to-transparent hidden md:block blur-[80px] pointer-events-none" />
          
          <div className="w-full h-full rounded-[24px] border border-white/10 bg-black/40 backdrop-blur-3xl flex flex-col items-center justify-center p-8 relative overflow-hidden shadow-2xl">
            {/* Dynamic rings */}
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <div className="w-[120%] aspect-square rounded-full border border-[#00f2ff]/30 animate-[spin_10s_linear_infinite] border-dashed" />
              <div className="absolute w-[80%] aspect-square rounded-full border border-purple-500/30 animate-[spin_15s_linear_infinite_reverse] border-dotted" />
            </div>
            
            {/* Center icon / brand */}
            <div className="relative z-10 p-6 bg-black/60 rounded-3xl border border-white/10 backdrop-blur-xl shadow-[0_0_40px_rgba(0,242,255,0.2)]">
               <Logo size={48} theme="dark" animate={true} withText={false} />
            </div>
            
            <h3 className="relative z-10 text-white font-headline font-bold text-2xl mt-8 tracking-wide drop-shadow-md">
              Unlock Your Vibe.
            </h3>
            <p className="relative z-10 text-[#b9cacb]/60 text-sm mt-3 font-sans text-center max-w-[200px]">
              Access premium lossless audio and AI-curated playlists.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
