import React from 'react';
import { Music2, Play, Heart, Share2, Headphones } from 'lucide-react';
import type { SharedTrack } from './SocialTypes';
import { useAudioPlayer } from '../AudioPlayerContext';

interface MusicMessageCardProps {
  track: SharedTrack;
  isMine: boolean;
  onListenTogether?: (track: SharedTrack) => void;
}

function formatDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const MusicMessageCard: React.FC<MusicMessageCardProps> = ({ track, isMine, onListenTogether }) => {
  const { playTrack, allTracks, toggleFavorite, isFavorite } = useAudioPlayer();

  const handlePlay = () => {
    // Try to find this track in the existing library
    const found = allTracks.find(t =>
      t.title.toLowerCase().includes(track.title.toLowerCase()) ||
      (track.youtubeId && t.youtubeId === track.youtubeId)
    );
    if (found) {
      playTrack(found);
    }
  };

  const liked = isFavorite ? isFavorite(track.id) : false;

  return (
    <div className={`rounded-2xl overflow-hidden border transition-all duration-200 hover:scale-[1.01] group ${
      isMine
        ? 'bg-pink-500/10 border-pink-500/20 hover:border-pink-500/40'
        : 'bg-white/[0.05] border-white/10 hover:border-white/25'
    }`} style={{ width: '100%', maxWidth: '280px' }}>
      {/* Cover Art */}
      <div className="relative h-28 bg-gradient-to-br from-pink-900/40 to-purple-900/40 overflow-hidden">
        {track.coverUrl ? (
          <img
            src={track.coverUrl}
            alt={track.title}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music2 size={40} className="text-white/20" />
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        {/* Music icon badge */}
        <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-md rounded-full px-2 py-0.5 flex items-center gap-1">
          <Music2 size={10} className="text-pink-400" />
          <span className="text-[9px] text-pink-400 font-bold uppercase tracking-wider">Music</span>
        </div>
        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5">
          <span className="text-[10px] text-white/80 font-mono">{formatDuration(track.duration)}</span>
        </div>
      </div>

      {/* Track Info */}
      <div className="p-3">
        <p className="text-white font-semibold text-[13px] leading-tight truncate">{track.title}</p>
        <p className="text-white/50 text-[11px] truncate mt-0.5">{track.artist}</p>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={handlePlay}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-400 transition-colors text-white text-[11px] font-bold"
          >
            <Play size={12} fill="white" />
            Play
          </button>

          <button
            onClick={() => toggleFavorite && toggleFavorite(track.id)}
            className={`p-1.5 rounded-xl transition-colors ${liked ? 'text-pink-400 bg-pink-500/20' : 'text-white/40 hover:text-pink-400 bg-white/5 hover:bg-pink-500/10'}`}
            title="Like"
          >
            <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
          </button>

          <button
            className="p-1.5 rounded-xl text-white/40 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
            title="Share"
          >
            <Share2 size={14} />
          </button>
        </div>

        {/* Listen Together */}
        <button
          onClick={() => onListenTogether?.(track)}
          className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-white/5 hover:bg-pink-500/10 border border-white/10 hover:border-pink-500/30 text-white/60 hover:text-pink-400 text-[11px] font-semibold transition-all"
        >
          <Headphones size={12} />
          Listen Together
        </button>
      </div>
    </div>
  );
};
