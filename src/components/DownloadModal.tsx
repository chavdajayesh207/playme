import React, { useState } from 'react';
import { X, Download, Loader2, CheckCircle } from 'lucide-react';
import { useAudioPlayer } from './AudioPlayerContext';
import { Track } from '../types';
import { useAuth } from './AuthContext';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose, currentTrack }) => {
  const { user } = useAuth();
  const { downloadTrack, downloadingTrackId, downloadProgress, isSubscribed } = useAudioPlayer();

  if (!isOpen) return null;

  const isDownloading = currentTrack && downloadingTrackId === currentTrack.id;

  const handleDownload = async (format: 'mp3' | 'mp4') => {
    if (!currentTrack) return;
    
    if (!user) {
      if (confirm("Downloads are only available to logged-in users. Please log in or sign up first! Would you like to log in now?")) {
        window.dispatchEvent(new CustomEvent('open-auth-modal'));
      }
      onClose();
      return;
    }

    if (!isSubscribed) {
      window.dispatchEvent(new CustomEvent('open-upgrade-modal'));
      onClose();
      return;
    }

    await downloadTrack(currentTrack, format);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
      <div className="relative bg-[#0b0a0c] border border-white/[0.08] backdrop-blur-2xl rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.6)] p-6 flex flex-col gap-5 transition-all">
        
        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-[-20%] w-40 h-40 bg-[#00f2ff]/10 rounded-full blur-[50px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-40 h-40 bg-pink-500/10 rounded-full blur-[50px] pointer-events-none animate-pulse" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={!!isDownloading}
          className="absolute top-4 right-4 text-[#b9cacb] hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors cursor-pointer z-20 disabled:opacity-50"
        >
          <X size={18} />
        </button>

        <div className="relative z-10 flex flex-col items-center mt-2">
          <h3 className="font-headline-lg text-xl font-bold text-white tracking-tight">
            Download Offline
          </h3>
          <p className="text-sm text-[#b9cacb] mt-2 leading-relaxed max-w-[250px] truncate">
            {currentTrack?.title || 'Unknown Track'}
          </p>
        </div>

        <div className="flex flex-col gap-3 mt-4 relative z-10">
          <button
            disabled={!!isDownloading}
            onClick={() => handleDownload('mp3')}
            className="w-full text-left px-4 py-4 rounded-xl text-sm font-semibold text-white/90 hover:text-white bg-white/5 hover:bg-white/10 flex items-center gap-3 transition-all cursor-pointer disabled:opacity-50 border border-white/5"
          >
            <Download size={18} className={user ? "text-[#00f2ff]" : "text-gray-500"} />
            <span>
              {isDownloading ? `Downloading MP3 (${downloadProgress}%)` : 'Download Offline MP3'}
            </span>
          </button>

          <button
            disabled={!!isDownloading}
            onClick={() => handleDownload('mp4')}
            className="w-full text-left px-4 py-4 rounded-xl text-sm font-semibold text-white/90 hover:text-white bg-white/5 hover:bg-white/10 flex items-center gap-3 transition-all cursor-pointer disabled:opacity-50 border border-white/5"
          >
            <Download size={18} className={user ? "text-pink-400" : "text-gray-500"} />
            <span>
              {isDownloading ? `Downloading MP4 (${downloadProgress}%)` : 'Download Offline MP4'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
