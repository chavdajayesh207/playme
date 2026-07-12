import React, { useState } from 'react';
import { X, Sparkles, Wand2, ShieldCheck, Zap, Download } from 'lucide-react';
import { useAudioPlayer } from './AudioPlayerContext';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const { setIsSubscribed } = useAudioPlayer();
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = () => {
    setIsSubscribed(true);
    setSuccess(true);
    setTimeout(() => {
      onClose();
      setSuccess(false);
    }, 2200);
  };

  return (
    <div
      id="upgrade-pro-modal-container"
      className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center p-4"
    >
      <div
        id="upgrade-pro-modal-content"
        className="relative bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl rounded-3xl w-full max-w-lg overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.6)] p-6 md:p-8 flex flex-col gap-6"
      >
        {/* Glow Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-56 h-56 bg-[#00f2ff]/6 rounded-full hidden md:block blur-[60px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-56 h-56 bg-pink-500/6 rounded-full hidden md:block blur-[60px] pointer-events-none animate-pulse" />

        {/* Close Button */}
        <button
          onClick={onClose}
          id="close-upgrade-modal-btn"
          className="absolute top-5 right-5 text-[#b9cacb] hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors cursor-pointer z-20"
        >
          <X size={18} />
        </button>

        {success ? (
          <div className="text-center py-10 flex flex-col items-center justify-center gap-4 animate-pulse relative z-10">
            <div className="w-16 h-16 rounded-full bg-[#00f2ff]/10 flex items-center justify-center text-[#00f2ff] border border-[#00f2ff]/20">
              <Sparkles size={32} />
            </div>
            <h3 className="font-headline-lg text-2xl font-bold text-white tracking-tight">
              Upgrade Successful!
            </h3>
            <p className="text-sm text-[#b9cacb] max-w-xs leading-relaxed font-sans">
              Playme Pro membership unlocked. Enjoy Dolby Spatial Audio, offline high-quality downloads, and real-time visualizers!
            </p>
          </div>
        ) : (
          <>
            <div className="text-left mt-2 relative z-10">
              <span className="font-label-mono text-[9px] bg-pink-500/10 border border-pink-500/20 text-pink-400 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                premium subscription
              </span>
              <h3 className="font-headline-lg text-2xl md:text-3xl font-black text-white tracking-tight mt-3">
                Playme Pro
              </h3>
              <p className="text-sm text-[#b9cacb] mt-1 pr-6 leading-relaxed font-sans">
                Unlock high-fidelity 3D audio, unrestricted downloads, and interactive real-time visualizers.
              </p>
            </div>

            {/* Pros list */}
            <div className="flex flex-col gap-4 my-1 relative z-10 font-sans" id="pro-features-rows">
              <div className="flex items-start gap-3.5">
                <div className="p-1.5 rounded-xl bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/20 shrink-0">
                  <Wand2 size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-normal">Full Dolby Atmos 3D Spatial Audio</h4>
                  <p className="text-[11px] text-[#b9cacb] leading-normal">Cinematic soundstage directly through standard headphones.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-1.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 shrink-0">
                  <Download size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-normal">High-Quality Offline Downloads</h4>
                  <p className="text-[11px] text-[#b9cacb] leading-normal">Save YouTube Music & Videos in MP3 and MP4 formats for completely offline listening/viewing.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-1.5 rounded-xl bg-[#ff571a]/10 text-[#ff571a] border border-[#ff571a]/20 shrink-0">
                  <Zap size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-normal">Lossless Skip Speeds & Quality</h4>
                  <p className="text-[11px] text-[#b9cacb] leading-normal">Lossless streaming bitrates up to 320kbps with zero buffer skipping.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-1.5 rounded-xl bg-[#e3d4ff]/10 text-[#e3d4ff] border border-[#e3d4ff]/20 shrink-0">
                  <ShieldCheck size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-normal">Zero Ad Interruptions</h4>
                  <p className="text-[11px] text-[#b9cacb] leading-normal">Pure uninterrupted stage experience across mobile and web.</p>
                </div>
              </div>
            </div>

            {/* Price section and triggers */}
            <div className="bg-white/[0.03] p-4.5 rounded-2xl border border-white/[0.08] flex items-center justify-between mt-1 backdrop-blur-md relative z-10 font-sans">
              <div>
                <p className="font-label-mono text-[9px] text-[#00f2ff]/80 uppercase tracking-widest leading-none font-bold">
                  base model plan
                </p>
                <p className="text-2xl font-black text-white mt-1.5 flex items-baseline gap-1">
                  ₹99 <span className="text-xs text-[#b9cacb] font-normal">/ month</span>
                </p>
              </div>
              <p className="text-[9px] font-label-mono text-[#e3d4ff] font-bold bg-[#e3d4ff]/10 border border-[#e3d4ff]/20 px-3 py-1.5 rounded-full tracking-wider uppercase">
                RUPEES 99 FOR ALL
              </p>
            </div>

            <button
              id="confirm-upgrade-pay-btn"
              onClick={handleUpgrade}
              className="w-full py-4 rounded-full bg-gradient-to-r from-pink-500 via-[#00f2ff] to-rose-500 text-white font-extrabold text-xs tracking-wider uppercase shadow-[0_4px_25px_rgba(236,72,153,0.3)] hover:shadow-[0_0_35px_rgba(0,242,255,0.5)] transition-all cursor-pointer text-center mt-2 hover:scale-[1.02] active:scale-[0.98] relative z-10"
            >
              Unlock Premium Access
            </button>
          </>
        )}
      </div>
    </div>
  );
};
