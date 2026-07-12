/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Track } from '../types';
import { useAudioPlayer } from './AudioPlayerContext';
import { Play, Pause, Flame, Disc, Radio, ChevronRight, Music3, Eye, ThumbsUp, Clock, Calendar, Loader2, RefreshCw, TrendingUp, Headphones, Star, Mic, Heart, Sparkles } from 'lucide-react';
import { LyricsShowcase } from './LyricsShowcase';
import { SongActionsMenu } from './SongActionsMenu';
import { HScroll } from './HScroll';
import { MUSIC_GENRES } from '../lib/musicHubData';

interface HomeCategory {
  title: string;
  emoji: string;
  tracks: HomeTrack[];
}

interface HomeTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  url: string;
  coverUrl: string;
  genre: string;
  description?: string;
  isYoutube: boolean;
  youtubeId: string;
  views?: string;
  likes?: string;
  publishedAt?: string;
  channelTitle?: string;
}

interface HomeData {
  trending: HomeCategory;
  popularPlaylists: HomeCategory;
  topCharts: HomeCategory;
  recentlyReleased: HomeCategory;
  recommended: HomeCategory;
  livePerformances: HomeCategory;
  updatedAt: string | null;
  message?: string;
}

interface HomeDashboardViewProps {
  onBrowseAll: () => void;
}

function formatViews(views: string | undefined): string {
  if (!views) return '';
  const num = parseInt(views, 10);
  if (isNaN(num)) return views;
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function timeAgo(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  trending: <Flame className="text-orange-400" size={20} />,
  popularPlaylists: <Music3 className="text-cyan-400" size={20} />,
  topCharts: <TrendingUp className="text-green-400" size={20} />,
  recentlyReleased: <Headphones className="text-purple-400" size={20} />,
  recommended: <Star className="text-yellow-400" size={20} />,
  livePerformances: <Mic className="text-pink-400" size={20} />,
};

const SECTION_COLORS: Record<string, string> = {
  trending: 'from-orange-500/20 to-red-600/10',
  popularPlaylists: 'from-cyan-500/20 to-blue-600/10',
  topCharts: 'from-green-500/20 to-emerald-600/10',
  recentlyReleased: 'from-purple-500/20 to-violet-600/10',
  recommended: 'from-yellow-500/20 to-amber-600/10',
  livePerformances: 'from-pink-500/20 to-rose-600/10',
};

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({ onBrowseAll }) => {
  const { playTrack, currentTrack, isPlaying, togglePlay, allTracks, setShowDashboard } = useAudioPlayer();

  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendingIndex, setTrendingIndex] = useState(0);

  // Fetch home data from /api/home
  const fetchHomeData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/home');
      if (!res.ok) throw new Error(`Failed to load home data (${res.status})`);
      const data: HomeData = await res.json();
      setHomeData(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load home data');
      console.error('[HomeDashboard] Fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  // Auto-rotate trending hero every 10 seconds
  useEffect(() => {
    if (!homeData?.trending?.tracks?.length) return;
    const interval = setInterval(() => {
      setTrendingIndex(prev => (prev + 1) % Math.min(homeData.trending.tracks.length, 5));
    }, 10000);
    return () => clearInterval(interval);
  }, [homeData?.trending?.tracks?.length]);

  // Convert HomeTrack to Track for playback
  const homeTrackToTrack = (ht: HomeTrack): Track => ({
    id: ht.id,
    title: ht.title,
    artist: ht.artist,
    album: ht.album || 'YouTube Music',
    duration: ht.duration,
    url: ht.url,
    coverUrl: ht.coverUrl,
    genre: ht.genre || 'Music',
    description: ht.description,
    isYoutube: ht.isYoutube,
    youtubeId: ht.youtubeId,
  });

  const handlePlayHomeTrack = (ht: HomeTrack, sectionTracks: HomeTrack[]) => {
    const track = homeTrackToTrack(ht);
    const queueTracks = sectionTracks.map(homeTrackToTrack);
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track, queueTracks);
    }
  };

  // Loading state
  if (isLoading && !homeData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
        <p className="text-sm text-white/50 font-mono uppercase tracking-widest">Loading live dashboard...</p>
      </div>
    );
  }

  // Error state
  if (error && !homeData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={fetchHomeData}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-full text-white text-sm transition-all cursor-pointer"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }

  const trending = homeData?.trending?.tracks || [];
  const heroTrack = trending[trendingIndex] || trending[0];
  const sections = homeData ? [
    { key: 'trending', data: homeData.trending },
    { key: 'popularPlaylists', data: homeData.popularPlaylists },
    { key: 'topCharts', data: homeData.topCharts },
    { key: 'recentlyReleased', data: homeData.recentlyReleased },
    { key: 'recommended', data: homeData.recommended },
    { key: 'livePerformances', data: homeData.livePerformances },
  ].filter(s => s.data?.tracks?.length > 0) : [];

  return (
    <div
      id="home-dashboard"
      className="px-4 md:px-8 py-6 max-w-7xl mx-auto flex flex-col gap-12 pb-24"
    >
      {/* ═══ TRENDING HERO ═══ */}
      {heroTrack && (
        <section className="relative">
          {/* Hero Banner */}
          <div
            className="relative h-[35vh] md:h-[380px] rounded-3xl overflow-hidden group cursor-pointer border border-white/10 shadow-2xl"
            onClick={() => handlePlayHomeTrack(heroTrack, trending)}
          >
            {/* Background image with transition */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-out group-hover:scale-[1.03]"
              style={{ backgroundImage: `url(${heroTrack.coverUrl})` }}
            />
            {/* Darkening overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent z-10" />

            {/* Top badge */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
              <div className="bg-orange-500/90 text-white font-bold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-sm">
                <Flame size={11} className="animate-pulse" />
                TRENDING #{trendingIndex + 1}
              </div>
              {heroTrack.views && (
                <div className="bg-black/50 backdrop-blur-md text-white/80 text-[9px] font-mono px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Eye size={10} />
                  {formatViews(heroTrack.views)} views
                </div>
              )}
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 z-20 flex justify-between items-end">
              <div className="max-w-[75%]">
                <p className="font-mono text-cyan-400 text-[10px] mb-1.5 uppercase tracking-widest flex items-center gap-1">
                  <Music3 size={11} className="animate-spin" style={{ animationDuration: '8s' }} />
                  <span>{heroTrack.channelTitle || heroTrack.artist}</span>
                </p>
                <h3 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-lg capitalize">
                  {heroTrack.title}
                </h3>
                <div className="flex items-center gap-3 mt-2 text-white/60 text-xs">
                  {heroTrack.duration > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {formatDuration(heroTrack.duration)}
                    </span>
                  )}
                  {heroTrack.publishedAt && (
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {timeAgo(heroTrack.publishedAt)}
                    </span>
                  )}
                  {heroTrack.likes && (
                    <span className="flex items-center gap-1">
                      <ThumbsUp size={10} />
                      {formatViews(heroTrack.likes)}
                    </span>
                  )}
                </div>
              </div>
              <button
                className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-cyan-400 hover:bg-cyan-300 text-black flex items-center justify-center shadow-[0_4px_20px_rgba(0,242,255,0.4)] transition-all duration-300 transform group-hover:scale-110 active:scale-95 cursor-pointer shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayHomeTrack(heroTrack, trending);
                }}
              >
                {currentTrack?.id === heroTrack.id && isPlaying ? (
                  <Pause size={22} fill="currentColor" />
                ) : (
                  <Play size={22} fill="currentColor" className="ml-1" />
                )}
              </button>
            </div>

            {/* Trending carousel dots */}
            <div className="absolute bottom-6 right-6 z-20 flex items-center gap-1.5 md:hidden">
              {trending.slice(0, 5).map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setTrendingIndex(i); }}
                  className={`rounded-full transition-all cursor-pointer ${
                    i === trendingIndex
                      ? 'w-6 h-2 bg-cyan-400'
                      : 'w-2 h-2 bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Trending carousel pills (desktop) */}
          <HScroll className="hidden md:flex items-center gap-2 mt-4 pb-1">
            {trending.slice(0, 8).map((t, i) => (
              <button
                key={t.id}
                onClick={() => setTrendingIndex(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-300 cursor-pointer shrink-0 ${
                  i === trendingIndex
                    ? 'bg-cyan-400/15 border-cyan-400/40 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <img src={t.coverUrl} alt={t.title} className="w-8 h-8 rounded-lg object-cover" />
                <div className="text-left min-w-0">
                  <p className="text-[10px] font-bold truncate max-w-[120px] capitalize">{t.title}</p>
                  <p className="text-[8px] text-white/40 truncate">{t.artist}</p>
                </div>
              </button>
            ))}
          </HScroll>
        </section>
      )}

      <LyricsShowcase />

      {/* ═══ DYNAMIC SECTIONS ═══ */}
      {sections.map(({ key, data }) => {
        // Skip trending from the grid sections — it has its own hero
        if (key === 'trending') return null;

        return (
          <section key={key} id={`home-section-${key}`}>
            {/* Section Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                {SECTION_ICONS[key] || <Sparkles className="text-white/50" size={20} />}
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                    {data.emoji} {data.title}
                  </h3>
                  <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest mt-0.5">
                    {data.tracks.length} tracks • Live from YouTube
                  </p>
                </div>
              </div>
            </div>

            {/* Cards Horizontal Scroll */}
            <HScroll>
              {data.tracks.map((track) => (
                <div
                  key={track.id}
                  onClick={() => handlePlayHomeTrack(track, data.tracks)}
                  className={`group relative bg-gradient-to-br ${SECTION_COLORS[key] || 'from-white/5 to-white/[0.02]'} hover:from-white/10 hover:to-white/5 p-3.5 rounded-2xl border border-white/5 hover:border-white/15 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[260px] w-[80vw] sm:w-[220px] md:w-[240px] max-w-[280px] shrink-0 snap-start shadow-lg backdrop-blur-sm`}
                >
                  {/* Cover Art */}
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/30">
                    <img
                      alt={track.title}
                      src={track.coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60'}
                      className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
                      loading="lazy"
                    />
                    {/* Duration badge */}
                    {track.duration > 0 && (
                      <span className="absolute bottom-1.5 right-1.5 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-white/90">
                        {formatDuration(track.duration)}
                      </span>
                    )}
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                      <div className="w-10 h-10 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-lg shadow-cyan-400/20 transform scale-90 group-hover:scale-100 transition-transform">
                        {currentTrack?.id === track.id && isPlaying ? (
                          <Pause size={14} fill="currentColor" />
                        ) : (
                          <Play size={14} fill="currentColor" className="ml-0.5" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Track Info */}
                  <div className="flex flex-col gap-0.5 mt-3 flex-grow">
                    <h4 className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors leading-snug line-clamp-2 capitalize">
                      {track.title}
                    </h4>
                    <p className="text-[10px] text-white/50 truncate mt-0.5">
                      {track.channelTitle || track.artist}
                    </p>
                  </div>

                  {/* Stats Row */}
                  <div className="border-t border-white/5 pt-2.5 mt-2 flex items-center justify-between text-[9px] text-white/40 font-mono">
                    {track.views && (
                      <span className="flex items-center gap-1">
                        <Eye size={9} />
                        {formatViews(track.views)}
                      </span>
                    )}
                    {track.publishedAt && (
                      <span className="flex items-center gap-1">
                        <Calendar size={9} />
                        {timeAgo(track.publishedAt)}
                      </span>
                    )}
                    {!track.views && !track.publishedAt && (
                      <span className="text-white/20">YouTube Music</span>
                    )}
                  </div>
                </div>
              ))}
            </HScroll>
          </section>
        );
      })}

      {/* ═══ BROWSE GENRES ═══ */}
      <section id="browse-genres-list">
        <div className="flex flex-col gap-2 mb-6">
          <h3 className="text-2xl md:text-3xl font-black text-white">
            Browse Genres
          </h3>
          <p className="text-xs text-white/40 font-mono uppercase tracking-widest mt-0.5">
            Tap a genre to explore curated YouTube streams
          </p>
        </div>

        <HScroll>
          {MUSIC_GENRES.map((genre) => (
            <div
              key={genre.id}
              id={`genre-card-${genre.id}`}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('playme-navigate', {
                  detail: { tab: 'genres', subtab: 'cloud', query: genre.query || genre.name }
                }));
              }}
              className="rounded-2xl cursor-pointer group relative overflow-hidden aspect-[4/5] w-32 md:w-40 shrink-0 snap-start transition-all duration-500 hover:scale-105 hover:-translate-y-1 border border-white/5"
            >
              <img
                alt={genre.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                src={genre.image}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  {genre.name}
                </h3>
              </div>
            </div>
          ))}
        </HScroll>
      </section>

      {/* Last Updated */}
      {homeData?.updatedAt && (
        <div className="text-center text-[9px] text-white/20 font-mono uppercase tracking-widest pb-4">
          Dashboard data updated {timeAgo(homeData.updatedAt)} • Live from YouTube
        </div>
      )}
    </div>
  );
};
