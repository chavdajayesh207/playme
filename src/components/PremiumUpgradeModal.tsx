import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Crown, Zap, Headphones, CheckCircle2, ShieldCheck, X } from 'lucide-react';

export const PremiumUpgradeModal: React.FC = () => {
  const { showPremiumModal, setShowPremiumModal, upgradeToPremium } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'info' | 'payment' | 'success'>('info');

  if (!showPremiumModal) return null;

  const handleCheckout = () => {
    setStep('payment');
  };

  const processPayment = () => {
    setProcessing(true);
    // Simulate network request to payment gateway
    setTimeout(async () => {
      setProcessing(false);
      setStep('success');
      setTimeout(() => {
        upgradeToPremium();
      }, 2000); // Close after showing success state
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-md bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl rounded-3xl overflow-hidden shadow-[0_24px_80px_rgba(0,242,255,0.1)] relative">
        
        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-[-20%] w-40 h-40 bg-[#00f2ff]/20 rounded-full blur-[60px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-40 h-40 bg-pink-500/20 rounded-full blur-[60px] pointer-events-none animate-pulse" />
        
        {/* Close Button */}
        <button 
          onClick={() => setShowPremiumModal(false)}
          className="absolute top-4 right-4 text-[#b9cacb] hover:text-white bg-black/40 p-2 rounded-full z-50 cursor-pointer"
        >
          <X size={20} />
        </button>

        {step === 'info' && (
          <div className="p-8 text-center relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-[#00f2ff]/20 to-blue-500/10 border border-[#00f2ff]/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(0,242,255,0.2)]">
              <Crown size={32} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
            </div>
            
            <h2 className="text-2xl font-headline font-bold text-white mb-2">
              Playme. Premium
            </h2>
            <p className="text-sm text-[#b9cacb] mb-8">
              Unlock the ultimate audiophile experience.
            </p>

            <div className="space-y-4 text-left mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#00f2ff]/10 text-[#00f2ff]"><Headphones size={18} /></div>
                <div>
                  <h4 className="text-sm font-bold text-white">Lossless Hi-Res Audio</h4>
                  <p className="text-xs text-[#b9cacb]">Uncompressed studio quality sound.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400"><Zap size={18} /></div>
                <div>
                  <h4 className="text-sm font-bold text-white">Unlimited AI DJ</h4>
                  <p className="text-xs text-[#b9cacb]">Endless AI-curated mood mixers.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><CheckCircle2 size={18} /></div>
                <div>
                  <h4 className="text-sm font-bold text-white">Ad-Free & Offline</h4>
                  <p className="text-xs text-[#b9cacb]">No interruptions, listen anywhere.</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-white/[0.02] to-white/[0.05] rounded-2xl p-4 mb-6 border border-white/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] [background-size:16px_16px] opacity-[0.03]" />
              <div className="relative z-10 text-3xl font-bold text-white">₹99<span className="text-sm text-[#b9cacb] font-normal">/month</span></div>
              <p className="relative z-10 text-[10px] uppercase tracking-wider text-[#00f2ff] mt-1 font-bold">Cancel anytime</p>
            </div>

            <button 
              onClick={handleCheckout}
              className="w-full bg-[#00f2ff] hover:bg-[#00f2ff]/80 text-[#002022] font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(0,242,255,0.3)] hover:scale-[1.02] active:scale-95 text-sm tracking-wide"
            >
              Subscribe for ₹99
            </button>
          </div>
        )}

        {step === 'payment' && (
          <div className="p-8 text-center min-h-[400px] flex flex-col justify-center relative z-10">
            <h2 className="text-xl font-bold text-white mb-6">Payment Details</h2>
            
            <div className="bg-white/5 p-4 rounded-xl text-left border border-white/10 mb-6 backdrop-blur-md">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-[#b9cacb]">Playme Premium</span>
                <span className="text-sm font-bold text-white">₹99.00</span>
              </div>
              <div className="flex gap-2 text-[10px] text-emerald-400 items-center justify-center bg-emerald-500/10 py-2.5 rounded-lg font-bold uppercase tracking-wider">
                <ShieldCheck size={14} /> Secured by Razorpay
              </div>
            </div>

            <button 
              onClick={processPayment}
              disabled={processing}
              className="w-full bg-gradient-to-r from-[#00f2ff] to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold py-4 rounded-xl transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 text-sm tracking-wide"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-t-transparent border-black animate-spin" />
                  Processing...
                </>
              ) : (
                'Pay ₹99'
              )}
            </button>
            <p className="text-[10px] text-[#b9cacb]/50 mt-4 text-center px-4">
              *This is a mock transaction for demonstration purposes. No real money will be charged.
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="p-8 text-center min-h-[400px] flex flex-col justify-center items-center relative z-10">
            <div className="w-20 h-20 bg-[#00f2ff]/20 rounded-full flex items-center justify-center mb-6 animate-bounce border border-[#00f2ff]/30 shadow-[0_0_30px_rgba(0,242,255,0.3)]">
              <CheckCircle2 size={40} className="text-[#00f2ff]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to Premium!</h2>
            <p className="text-sm text-[#b9cacb]">
              Your account has been upgraded. Enjoy Lossless Audio and unlimited AI.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
