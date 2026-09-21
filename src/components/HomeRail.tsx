/**
 * HomeRail.tsx
 * Data-driven content rail for the Amazon Music-style home dashboard.
 * Card styles: 'compact' | 'large' | 'wide' | 'genre-overlay' | 'video' | 'artist' | 'station'
 */

import React, { useRef, useState, useCallback } from 'react';
import { Play, Pause, Heart, MoreHorizontal, ChevronLeft, ChevronRight, Radio } from 'lucide-react';
import { useAudioPlayer } from './AudioPlayerContext';
import { Track } from '../types';

export type CardStyle = 'compact' | 'large' | 'wide' | 'genre-overlay' | 'video' | 'artist' | 'station';

export interface RailTrack {
  id: string;
  title: string;
  artist: string;
  channelTitle?: string;
  album?: string;
  duration: number;
  url: string;
  coverUrl: string;
  genre: string;
  isYoutube?: boolean;
  youtubeId?: string;
  views?: string;
  publishedAt?: string;
  description?: string;
  genreLabel?: string;  // for genre-overlay & station cards
}

interface HomeRailProps {
  id?: string;
  title: string;
  subtitle?: string;
  tracks: RailTrack[];
  cardStyle: CardStyle;
  onSeeMore?: () => void;
  badge?: string;
  accentColor?: string;
  maxVisible?: number;
}

function railTrackToTrack(t: RailTrack): Track {
  return {
    id: t.id, title: t.title, artist: t.artist || t.channelTitle || 'Unknown',
    album: t.album || 'YouTube Music', duration: t.duration, url: t.url,
    coverUrl: t.coverUrl, genre: t.genre || 'Music', description: t.description,
    isYoutube: t.isYoutube ?? true, youtubeId: t.youtubeId,
  };
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Compact Song Row Card ────────────────────────────────────────────────────
function CompactCard({ track, index, onPlay, isCurrentlyPlaying, isFav, onToggleFav }: {
  track: RailTrack; index: number; onPlay: () => void;
  isCurrentlyPlaying: boolean; isFav: boolean; onToggleFav: (e: React.MouseEvent) => void;
  key?: React.Key;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onClick={onPlay}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group
        ${isCurrentlyPlaying ? 'bg-white/[0.07] border border-white/10' : 'hover:bg-white/[0.05] border border-transparent'}`}
    >
      <div className="w-7 h-7 shrink-0 flex items-center justify-center">
        {isCurrentlyPlaying ? (
          <div className="flex items-end gap-[2px] h-4">
            <span className="w-[3px] bg-[#1ed760] rounded-sm animate-[equalizerBar_0.8s_ease-in-out_infinite_alternate]" style={{ height: '60%' }} />
            <span className="w-[3px] bg-[#1ed760] rounded-sm animate-[equalizerBar_0.8s_ease-in-out_0.15s_infinite_alternate]" style={{ height: '100%' }} />
            <span className="w-[3px] bg-[#1ed760] rounded-sm animate-[equalizerBar_0.8s_ease-in-out_0.3s_infinite_alternate]" style={{ height: '40%' }} />
          </div>
        ) : hovered ? <Play size={14} fill="white" className="text-white ml-0.5" />
          : <span className="text-[12px] text-white/30 font-mono font-bold">{index + 1}</span>
        }
      </div>
      <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 bg-white/5">
        <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-medium truncate leading-tight ${isCurrentlyPlaying ? 'text-[#1ed760]' : 'text-white'}`}>{track.title}</p>
        <p className="text-[11px] text-white/45 truncate mt-0.5">{track.artist || track.channelTitle}</p>
      </div>
      {track.duration > 0 && <span className="text-[11px] text-white/30 font-mono shrink-0 hidden sm:block">{formatDuration(track.duration)}</span>}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onToggleFav} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10">
          <Heart size={13} className={isFav ? 'text-[#1ed760] fill-[#1ed760]' : 'text-white/50'} />
        </button>
        <button className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10">
          <MoreHorizontal size={13} className="text-white/50" />
        </button>
      </div>
    </div>
  );
}

// ─── Large Square Card ────────────────────────────────────────────────────────
function LargeCard({ track, onPlay, isCurrentlyPlaying, isFav, onToggleFav }: {
  track: RailTrack; onPlay: () => void;
  isCurrentlyPlaying: boolean; isFav: boolean; onToggleFav: (e: React.MouseEvent) => void;
}) {
  return (
    <div onClick={onPlay} className="group relative shrink-0 cursor-pointer" style={{ width: 'clamp(140px, 14vw, 200px)' }}>
      <div className={`relative rounded-xl overflow-hidden aspect-square mb-2.5 transition-all duration-300
        ${isCurrentlyPlaying ? 'shadow-[0_0_0_2px_#1ed760,0_0_16px_rgba(30,215,96,0.25)]' : 'group-hover:brightness-75'}`}>
        <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" loading="lazy" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 flex items-end justify-end p-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-[#1ed760] shadow-[0_4px_20px_rgba(30,215,96,0.5)] flex items-center justify-center transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
            {isCurrentlyPlaying ? <Pause size={16} fill="black" className="text-black" /> : <Play size={16} fill="black" className="text-black ml-0.5" />}
          </div>
        </div>
        <button onClick={onToggleFav} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Heart size={12} className={isFav ? 'text-[#1ed760] fill-[#1ed760]' : 'text-white'} />
        </button>
      </div>
      <p className={`text-[13px] font-medium line-clamp-1 px-0.5 ${isCurrentlyPlaying ? 'text-[#1ed760]' : 'text-white'}`}>{track.title}</p>
      <p className="text-[11px] text-white/45 line-clamp-1 px-0.5 mt-0.5">{track.artist || track.channelTitle}</p>
    </div>
  );
}

// ─── Wide 16:9 Card ───────────────────────────────────────────────────────────
function WideCard({ track, onPlay, isCurrentlyPlaying, isFav, onToggleFav }: {
  track: RailTrack; onPlay: () => void;
  isCurrentlyPlaying: boolean; isFav: boolean; onToggleFav: (e: React.MouseEvent) => void;
}) {
  return (
    <div onClick={onPlay} className="group relative shrink-0 cursor-pointer" style={{ width: 'clamp(160px, 18vw, 240px)' }}>
      <div className={`relative rounded-xl overflow-hidden aspect-video mb-2.5 bg-white/5
        ${isCurrentlyPlaying ? 'shadow-[0_0_0_2px_#1ed760,0_0_16px_rgba(30,215,96,0.25)]' : ''}`}>
        <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" loading="lazy" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-[#1ed760] shadow-[0_4px_20px_rgba(30,215,96,0.5)] flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all">
            {isCurrentlyPlaying ? <Pause size={16} fill="black" className="text-black" /> : <Play size={16} fill="black" className="text-black ml-0.5" />}
          </div>
        </div>
        <button onClick={onToggleFav} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Heart size={12} className={isFav ? 'text-[#1ed760] fill-[#1ed760]' : 'text-white'} />
        </button>
        {track.duration > 0 && <span className="absolute bottom-1.5 right-1.5 bg-black/75 text-white/80 text-[9px] font-mono px-1.5 py-0.5 rounded">{formatDuration(track.duration)}</span>}
      </div>
      <p className={`text-[13px] font-medium line-clamp-2 px-0.5 ${isCurrentlyPlaying ? 'text-[#1ed760]' : 'text-white'}`}>{track.title}</p>
      <p className="text-[11px] text-white/45 line-clamp-1 px-0.5 mt-0.5">{track.artist || track.channelTitle}</p>
    </div>
  );
}

// ─── Video Card (with cyan VIDEO badge) ──────────────────────────────────────
function VideoCard({ track, onPlay, isCurrentlyPlaying, isFav, onToggleFav }: {
  track: RailTrack; onPlay: () => void;
  isCurrentlyPlaying: boolean; isFav: boolean; onToggleFav: (e: React.MouseEvent) => void;
}) {
  return (
    <div onClick={onPlay} className="group relative shrink-0 cursor-pointer" style={{ width: 'clamp(160px, 18vw, 240px)' }}>
      <div className={`relative rounded-xl overflow-hidden aspect-video mb-2.5 bg-white/5
        ${isCurrentlyPlaying ? 'shadow-[0_0_0_2px_#1ed760,0_0_16px_rgba(30,215,96,0.25)]' : ''}`}>
        <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" loading="lazy" referrerPolicy="no-referrer" />
        <span className="absolute top-2 left-2 bg-[#00c8ff] text-black text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm">VIDEO</span>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-[#1ed760] flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all">
            {isCurrentlyPlaying ? <Pause size={16} fill="black" className="text-black" /> : <Play size={16} fill="black" className="text-black ml-0.5" />}
          </div>
        </div>
        <button onClick={onToggleFav} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Heart size={12} className={isFav ? 'text-[#1ed760] fill-[#1ed760]' : 'text-white'} />
        </button>
      </div>
      <p className="text-[10px] font-bold text-[#00c8ff] uppercase tracking-widest px-0.5 mb-0.5">VIDEO</p>
      <p className={`text-[13px] font-medium line-clamp-2 px-0.5 ${isCurrentlyPlaying ? 'text-[#1ed760]' : 'text-white'}`}>{track.title}</p>
      <p className="text-[11px] text-white/45 line-clamp-1 px-0.5 mt-0.5">{track.artist || track.channelTitle}</p>
    </div>
  );
}

// ─── Genre Overlay Card ───────────────────────────────────────────────────────
const GENRE_GRADIENTS: Record<string, string> = {
  romance: 'from-pink-700 via-pink-800 to-rose-900',
  bollywood: 'from-amber-700 via-orange-800 to-yellow-900',
  'lo-fi': 'from-indigo-700 via-purple-800 to-blue-900',
  'i-pop': 'from-cyan-700 via-sky-800 to-blue-900',
  workout: 'from-red-700 via-rose-800 to-red-900',
  drive: 'from-slate-700 via-gray-800 to-zinc-900',
  'feel good': 'from-emerald-700 via-green-800 to-teal-900',
  chill: 'from-blue-700 via-indigo-800 to-violet-900',
  'feel good hindi': 'from-orange-700 via-amber-800 to-yellow-900',
  'feel good punjabi': 'from-yellow-700 via-amber-800 to-orange-900',
  party: 'from-fuchsia-700 via-purple-800 to-pink-900',
  hindi: 'from-orange-700 via-red-800 to-rose-900',
  'black cat energy': 'from-zinc-800 via-neutral-900 to-black',
  'top tucker': 'from-yellow-700 via-amber-700 to-orange-800',
  'fully tolly': 'from-cyan-700 via-teal-800 to-green-900',
  'kannada hits': 'from-red-700 via-orange-800 to-yellow-900',
  'lo-fi malayalam': 'from-emerald-700 via-teal-800 to-blue-900',
  'marathi hits': 'from-orange-700 via-amber-700 to-yellow-800',
  'fresh hindi': 'from-green-700 via-emerald-800 to-teal-900',
  'bollywood chill': 'from-blue-700 via-indigo-800 to-purple-900',
  'bollywood soul soothers': 'from-purple-700 via-indigo-800 to-blue-900',
  'rainy day jams': 'from-slate-700 via-blue-800 to-indigo-900',
  'soul soothers': 'from-indigo-700 via-purple-800 to-fuchsia-900',
  'heartbroken indie': 'from-rose-700 via-red-800 to-pink-900',
  'made in indie': 'from-green-700 via-emerald-800 to-teal-900',
  'tamil pop': 'from-yellow-700 via-orange-800 to-red-900',
  'gethu flow': 'from-violet-700 via-purple-800 to-indigo-900',
  'stay indie': 'from-teal-700 via-cyan-800 to-blue-900',
  'breakthrough india': 'from-blue-700 via-indigo-800 to-violet-900',
  'telugu pop': 'from-pink-700 via-rose-800 to-red-900',
  default: 'from-zinc-700 via-zinc-800 to-stone-900',
};

function GenreOverlayCard({ track, onPlay, isCurrentlyPlaying, isFav, onToggleFav, genreLabel }: {
  track: RailTrack; onPlay: () => void;
  isCurrentlyPlaying: boolean; isFav: boolean; onToggleFav: (e: React.MouseEvent) => void;
  genreLabel: string;
}) {
  const key = genreLabel.toLowerCase();
  const gradient = GENRE_GRADIENTS[key] || GENRE_GRADIENTS.default;
  return (
    <div onClick={onPlay} className="group relative shrink-0 cursor-pointer" style={{ width: 'clamp(140px, 14vw, 200px)' }}>
      <div className={`relative rounded-xl overflow-hidden aspect-square mb-2.5
        ${isCurrentlyPlaying ? 'shadow-[0_0_0_2px_#1ed760,0_0_16px_rgba(30,215,96,0.25)]' : ''}`}>
        <img src={track.coverUrl} alt={track.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]" loading="lazy" referrerPolicy="no-referrer" />
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-75 mix-blend-multiply`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
        <span className="absolute top-2 left-2 bg-[#00c8ff]/20 border border-[#00c8ff]/40 text-[#00c8ff] text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm backdrop-blur-sm">UHD</span>
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white font-black text-[18px] leading-tight drop-shadow-2xl line-clamp-2">{genreLabel}</p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-[#1ed760] shadow-[0_4px_20px_rgba(30,215,96,0.5)] flex items-center justify-center scale-90 group-hover:scale-100 transition-transform">
            {isCurrentlyPlaying ? <Pause size={18} fill="black" className="text-black" /> : <Play size={18} fill="black" className="text-black ml-0.5" />}
          </div>
        </div>
        <button onClick={onToggleFav} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Heart size={12} className={isFav ? 'text-[#1ed760] fill-[#1ed760]' : 'text-white'} />
        </button>
      </div>
      <p className={`text-[13px] font-medium line-clamp-1 px-0.5 ${isCurrentlyPlaying ? 'text-[#1ed760]' : 'text-white/80'}`}>{genreLabel}</p>
      <p className="text-[11px] text-white/40 line-clamp-1 px-0.5 mt-0.5">{track.artist || track.channelTitle}</p>
    </div>
  );
}

// ─── Artist Circular Card ─────────────────────────────────────────────────────
function ArtistCard({ track, onPlay, isCurrentlyPlaying }: {
  track: RailTrack; onPlay: () => void; isCurrentlyPlaying: boolean;
}) {
  const artistName = track.genreLabel || track.artist || track.channelTitle || 'Artist';
  return (
    <div onClick={onPlay} className="group flex flex-col items-center gap-3 shrink-0 cursor-pointer" style={{ width: 'clamp(100px, 10vw, 140px)' }}>
      <div className={`relative w-full aspect-square rounded-full overflow-hidden transition-all duration-300
        ${isCurrentlyPlaying ? 'shadow-[0_0_0_3px_#1ed760,0_0_25px_rgba(30,215,96,0.4)]' : 'group-hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]'}`}
      >
        <img src={track.coverUrl || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&auto=format&fit=crop&seed=${track.id}`} alt={artistName} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.08]" loading="lazy" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-[#1ed760] flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all">
            {isCurrentlyPlaying ? <Pause size={14} fill="black" className="text-black" /> : <Play size={14} fill="black" className="text-black ml-0.5" />}
          </div>
        </div>
      </div>
      <p className={`text-[12px] font-semibold text-center line-clamp-1 w-full transition-colors ${isCurrentlyPlaying ? 'text-[#1ed760]' : 'text-white/80 group-hover:text-white'}`}>{artistName}</p>
    </div>
  );
}

// ─── Station Card (with Radio badge) ─────────────────────────────────────────
function StationCard({ track, onPlay, isCurrentlyPlaying, isFav, onToggleFav }: {
  track: RailTrack; onPlay: () => void;
  isCurrentlyPlaying: boolean; isFav: boolean; onToggleFav: (e: React.MouseEvent) => void;
}) {
  const stationName = track.genreLabel || track.title;
  const key = stationName.toLowerCase();
  const gradient = GENRE_GRADIENTS[key] || GENRE_GRADIENTS.default;
  return (
    <div onClick={onPlay} className="group relative shrink-0 cursor-pointer" style={{ width: 'clamp(140px, 14vw, 200px)' }}>
      <div className={`relative rounded-xl overflow-hidden aspect-square mb-2.5
        ${isCurrentlyPlaying ? 'shadow-[0_0_0_2px_#1ed760,0_0_16px_rgba(30,215,96,0.25)]' : ''}`}>
        <img src={track.coverUrl} alt={track.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" loading="lazy" referrerPolicy="no-referrer" />
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-60 mix-blend-multiply`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        {/* Radio badge */}
        <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center">
          <Radio size={14} className="text-white" />
        </div>
        {/* Station name */}
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white font-bold text-[14px] leading-tight line-clamp-2 drop-shadow">{stationName}</p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-[#1ed760] shadow-[0_4px_20px_rgba(30,215,96,0.5)] flex items-center justify-center scale-90 group-hover:scale-100 transition-transform">
            {isCurrentlyPlaying ? <Pause size={18} fill="black" className="text-black" /> : <Play size={18} fill="black" className="text-black ml-0.5" />}
          </div>
        </div>
        <button onClick={onToggleFav} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Heart size={12} className={isFav ? 'text-[#1ed760] fill-[#1ed760]' : 'text-white'} />
        </button>
      </div>
      <p className={`text-[13px] font-medium line-clamp-1 px-0.5 ${isCurrentlyPlaying ? 'text-[#1ed760]' : 'text-white/80'}`}>{stationName}</p>
      <p className="text-[11px] text-white/40 line-clamp-1 px-0.5 mt-0.5">{track.artist || track.channelTitle}</p>
    </div>
  );
}

// ─── Main HomeRail Component ──────────────────────────────────────────────────
export const HomeRail: React.FC<HomeRailProps> = ({
  id, title, subtitle, tracks, cardStyle, onSeeMore, badge, accentColor = 'text-white', maxVisible,
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay, toggleFavorite, isFavorite } = useAudioPlayer();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const visibleTracks = maxVisible ? tracks.slice(0, maxVisible) : tracks;

  const handlePlayTrack = useCallback((track: RailTrack, queue: RailTrack[]) => {
    const t = railTrackToTrack(track);
    const q = queue.map(railTrackToTrack);
    if (currentTrack?.id === t.id) togglePlay();
    else playTrack(t, q);
  }, [currentTrack, playTrack, togglePlay]);

  const handleToggleFav = useCallback((e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    toggleFavorite(trackId);
  }, [toggleFavorite]);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -scrollRef.current.clientWidth * 0.8 : scrollRef.current.clientWidth * 0.8, behavior: 'smooth' });
  };

  const onScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  if (visibleTracks.length === 0) return null;

  const GENRE_LABELS_ULTRA = ['Romance', 'Bollywood', 'Lo-Fi', 'I-Pop', 'Workout', 'Drive', 'Feel Good', 'Chill', 'Party', 'Hindi'];
  const STATION_LABELS = ['Desi Vibes Radio', 'Bollywood Romance', 'Kishore Kumar', '2010s Bollywood', 'Bollywood Party', 'Top Punjabi', '90s Indian Pop', 'Ghazal Lounge'];

  return (
    <section id={id} className="flex flex-col gap-4">
      {/* ── Section Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[18px] md:text-[20px] font-bold text-white tracking-tight">{title}</h3>
            {badge && <span className="bg-[#1ed760]/10 text-[#1ed760] text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-[#1ed760]/20">{badge}</span>}
          </div>
          {subtitle && <p className="text-[10px] text-white/35 font-mono uppercase tracking-widest mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          {cardStyle !== 'compact' && (
            <>
              <button onClick={() => scroll('left')} disabled={!canScrollLeft}
                className={`hidden sm:flex w-7 h-7 items-center justify-center rounded-full border transition-all
                  ${canScrollLeft ? 'border-white/20 text-white hover:bg-white/10 cursor-pointer' : 'border-white/5 text-white/20 cursor-default'}`}>
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => scroll('right')} disabled={!canScrollRight}
                className={`hidden sm:flex w-7 h-7 items-center justify-center rounded-full border transition-all
                  ${canScrollRight ? 'border-white/20 text-white hover:bg-white/10 cursor-pointer' : 'border-white/5 text-white/20 cursor-default'}`}>
                <ChevronRight size={14} />
              </button>
            </>
          )}
          {onSeeMore && (
            <button onClick={onSeeMore} className="text-[11px] font-bold text-white/50 hover:text-white uppercase tracking-widest border border-white/10 hover:border-white/25 px-3 py-1.5 rounded-full transition-all cursor-pointer">
              See More
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {cardStyle === 'compact' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-0.5">
          {visibleTracks.map((track, i) => (
            <CompactCard key={track.id} track={track} index={i}
              onPlay={() => handlePlayTrack(track, visibleTracks)}
              isCurrentlyPlaying={currentTrack?.id === track.id && isPlaying}
              isFav={isFavorite(track.id)}
              onToggleFav={(e) => handleToggleFav(e, track.id)}
            />
          ))}
        </div>
      ) : (
        <div ref={scrollRef} onScroll={onScroll} className="flex gap-4 overflow-x-auto pt-4 pb-6 px-4 -mx-4 home-rail-scroll snap-x snap-mandatory">
          {visibleTracks.map((track, index) => {
            const isActive = currentTrack?.id === track.id && isPlaying;
            const fav = isFavorite(track.id);
            const play = () => handlePlayTrack(track, visibleTracks);
            const toggleFav = (e: React.MouseEvent) => handleToggleFav(e, track.id);

            return (
              <div key={track.id} className="snap-start">
                {cardStyle === 'large' && <LargeCard track={track} onPlay={play} isCurrentlyPlaying={isActive} isFav={fav} onToggleFav={toggleFav} />}
                {cardStyle === 'wide' && <WideCard track={track} onPlay={play} isCurrentlyPlaying={isActive} isFav={fav} onToggleFav={toggleFav} />}
                {cardStyle === 'video' && <VideoCard track={track} onPlay={play} isCurrentlyPlaying={isActive} isFav={fav} onToggleFav={toggleFav} />}
                {cardStyle === 'genre-overlay' && <GenreOverlayCard track={track} onPlay={play} isCurrentlyPlaying={isActive} isFav={fav} onToggleFav={toggleFav} genreLabel={track.genreLabel || GENRE_LABELS_ULTRA[index % GENRE_LABELS_ULTRA.length]} />}
                {cardStyle === 'artist' && <ArtistCard track={track} onPlay={play} isCurrentlyPlaying={isActive} />}
                {cardStyle === 'station' && <StationCard track={track} onPlay={play} isCurrentlyPlaying={isActive} isFav={fav} onToggleFav={toggleFav} />}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
