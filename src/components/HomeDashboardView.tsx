/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Track } from '../types';
import { TRACKS, FEATURED_TRENDING_IMAGE } from '../data';
import { useAudioPlayer } from './AudioPlayerContext';
import { Play, Pause, Flame, Disc, Radio, Sliders, ChevronRight, Music3, Volume2, Home, Search } from 'lucide-react';
import { LyricsShowcase } from './LyricsShowcase';
import { SongActionsMenu } from './SongActionsMenu';
import { HScroll } from './HScroll';
import { MUSIC_GENRES } from '../lib/musicHubData';

interface HomeDashboardViewProps {
  onBrowseAll: () => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({ onBrowseAll }) => {
  const { playTrack, currentTrack, isPlaying, togglePlay, allTracks, allGenres, setShowDashboard } = useAudioPlayer();

  const POPULAR_PLAYLISTS = [
    {
      id: 'bollywood-vibes',
      name: 'Bollywood & Sufi Hits',
      description: 'A.R. Rahman classics, emotional guitar chords, and subcontinental acoustic magic.',
      coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60',
      trackIds: ['ar-rahman-dil-se-re', 'local-train-choo-lo', 'prateek-kuhad-cold-mess']
    },
    {
      id: 'global-chart',
      name: 'Global Chartbusters',
      description: 'The Weeknd, Charlie Puth, DJ Snake, and international billboard chart toppers.',
      coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60',
      trackIds: ['the-weeknd-blinding-lights', 'charlie-puth-how-long', 'dj-snake-let-me-love-you']
    },
    {
      id: 'study-lofi',
      name: 'Late Night Chill Lo-fi',
      description: 'Analog tape crackles, cassettes, and comforting ambient focus tracks.',
      coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=60',
      trackIds: ['retro-vintage-mix', 'design-talks-podcast', 'space-station-deep-house']
    },
    {
      id: 'deep-focuser',
      name: 'Deep Focus Rave',
      description: 'Hypnotic house progressions, laser pulses, and techno kicks.',
      coverUrl: 'https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=500&auto=format&fit=crop&q=60',
      trackIds: ['space-station-deep-house', 'club-life-electronic', 'live-ocean-stage']
    }
  ];

  const handlePlayPlaylist = (trackIds: string[]) => {
    const playlistTracks = allTracks.filter((t) => trackIds.includes(t.id));
    if (playlistTracks.length > 0) {
      const orderedTracks = trackIds
        .map(id => playlistTracks.find(t => t.id === id))
        .filter((t): t is Track => t !== undefined);
      playTrack(orderedTracks[0], orderedTracks);
    }
  };

  const handlePlayById = (id: string) => {
    const track = allTracks.find((t) => t.id === id);
    if (track) {
      if (currentTrack?.id === track.id) {
        togglePlay();
      } else {
        playTrack(track, allTracks);
      }
    }
  };

  const getFeaturedTrack = (id: string): Track | undefined => {
    return allTracks.find((t) => t.id === id);
  };

  const spaceStation = getFeaturedTrack('space-station-deep-house') || TRACKS[2];
  const designTalks = getFeaturedTrack('design-talks-podcast') || TRACKS[3];
  const clubLife = getFeaturedTrack('club-life-electronic') || TRACKS[1];

  return (
    <div
      id="home-dashboard"
      className="px-4 md:px-8 py-6 max-w-7xl mx-auto flex flex-col gap-12 pb-24 cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          togglePlay();
        }
      }}
      title={currentTrack?.isYoutube ? "Click background canvas to toggle video playback" : undefined}
    >
      {/* Dynamic welcome header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="font-headline-lg text-3xl md:text-4xl font-bold text-[#e5e2e3] flex items-center gap-2">
            <span>Trending Now</span>
            <Flame className="text-[#ff571a] animate-pulse" size={28} />
          </h2>
          <div className="flex items-center gap-3 flex-wrap mt-1">
            <p className="text-xs text-[#b9cacb] font-label-mono uppercase tracking-widest">
              Curated fresh every hour
            </p>
            {currentTrack?.isYoutube && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/30 font-mono font-bold transition-all cursor-pointer"
                title="Click to play or pause the ambient background YouTube video feed instantly"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-[#00f2ff] animate-ping' : 'bg-red-500'}`} />
                Background Video: {isPlaying ? 'ACTIVE (Click to Pause)' : 'PAUSED (Click to Play)'}
              </button>
            )}
          </div>
        </div>
        {/* Quick Access Navigation Pill Dock */}
        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/10 rounded-full p-1 shadow-lg select-none self-start md:self-auto shrink-0">
          <button
            onClick={() => {
              setShowDashboard(false);
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.12em] text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300 cursor-pointer active:scale-95"
            title="Go to Player"
            id="dashboard-go-to-player-btn"
          >
            <Home className="w-3.5 h-3.5 text-pink-400" />
            <span>Home</span>
          </button>
          <div className="w-px h-3 bg-white/10" />
          <button
            onClick={onBrowseAll}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.12em] bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 transition-all duration-300 cursor-pointer active:scale-95"
            title="See all tracks"
            id="dashboard-see-all-tracks-btn"
          >
            <Search className="w-3.5 h-3.5 text-pink-400" />
            <span>See All</span>
          </button>
        </div>
      </header>

      {/* Bento Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="trending-bento-grid">
        {/* Large Featured Card (Club Life) */}
        <div
          id="featured-bento-card-large"
          className="lg:col-span-2 relative h-72 md:h-[350px] rounded-3xl overflow-hidden group cursor-pointer border border-white/5"
          onClick={() => handlePlayById('club-life-electronic')}
        >
          <img
            alt="Club Life Cover"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            src={FEATURED_TRENDING_IMAGE}
          />
          {/* Top category label */}
          <div className="absolute top-4 left-4 z-20 bg-[#ff571a] text-[#521300] font-bold font-label-mono text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
            LIVE PREMIERE
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0f] via-[#0e0e0f]/30 to-transparent z-10" />

          {/* Bottom Card Labels */}
          <div className="absolute bottom-0 left-0 w-full p-6 z-20 flex justify-between items-end backdrop-blur-[2px]">
            <div>
              <p className="font-label-mono text-[#00f2ff] text-[10px] mb-1.5 uppercase tracking-widest flex items-center gap-1">
                <Music3 size={11} className="animate-spin" style={{ animationDuration: '8s' }} />
                <span>POPULAR LIVE DJ SET</span>
              </p>
              <h3 className="font-headline-lg text-2xl md:text-3xl font-bold text-white tracking-tight">
                Club Life: Electronic
              </h3>
              <p className="text-sm text-[#b9cacb] mt-1 font-medium">
                DJ Phantom • Synth Lead Set
              </p>
            </div>
            <button
              id="large-play-trigger"
              className="w-14 h-14 rounded-full bg-[#00f2ff] hover:bg-[#74f5ff] text-[#00363a] flex items-center justify-center shadow-[0_4px_20px_rgba(0,242,255,0.4)] transition-all duration-300 transform group-hover:scale-110 active:scale-95 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handlePlayById('club-life-electronic');
              }}
            >
              {currentTrack?.id === 'club-life-electronic' && isPlaying ? (
                <Pause size={20} fill="currentColor" />
              ) : (
                <Play size={20} fill="currentColor" className="ml-1" />
              )}
            </button>
          </div>
        </div>

        {/* Stacked Side items */}
        <div className="flex flex-col gap-4 justify-between" id="bento-stacked-items">
          {/* Card 1: Space Station */}
          <div
            id="mini-card-space-station"
            onClick={() => handlePlayById(spaceStation.id)}
            className="flex-1 relative rounded-2xl p-4 flex items-center gap-4 bg-[#201f20]/40 backdrop-blur-md border border-white/5 hover:bg-white/10 transition-all cursor-pointer group"
          >
            <div className="w-20 h-20 rounded-xl overflow-hidden relative shrink-0 border border-white/10">
              <img
                alt="Space Station"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                src={spaceStation.coverUrl}
              />
              <div className={`absolute inset-0 bg-black/45 flex items-center justify-center transition-opacity ${
                currentTrack?.id === spaceStation.id && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
                {currentTrack?.id === spaceStation.id && isPlaying ? (
                  <Pause size={20} fill="currentColor" className="text-white" />
                ) : (
                  <Play size={20} fill="currentColor" className="text-white" />
                )}
              </div>
            </div>
            <div className="flex-grow min-w-0 pr-1">
              <div className="flex justify-between items-start gap-1">
                <h4 className="font-bold text-white text-md truncate leading-snug">
                  {spaceStation.title}
                </h4>
                <div onClick={(e) => e.stopPropagation()}>
                  <SongActionsMenu track={spaceStation} />
                </div>
              </div>
              <p className="text-xs text-[#b9cacb] mt-0.5">{spaceStation.artist}</p>
              <p className="font-label-mono text-[9px] text-[#ff571a] font-semibold mt-1 uppercase tracking-wider">
                Deep House Groove
              </p>
              {/* Animated Progress wave bar preview */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-grow h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-[#00f2ff] rounded-full transition-all duration-300 ${
                      currentTrack?.id === spaceStation.id && isPlaying ? 'w-[58%] animate-pulse' : 'w-[20%]'
                    }`}
                  />
                </div>
                <span className="font-label-mono text-[8.5px] text-[#b9cacb]">58% Playrate</span>
              </div>
            </div>
          </div>

          {/* Card 2: Design Talks */}
          <div
            id="mini-card-design-talks"
            onClick={() => handlePlayById(designTalks.id)}
            className="flex-1 relative rounded-2xl p-4 flex items-center gap-4 bg-[#201f20]/40 backdrop-blur-md border border-white/5 hover:bg-white/10 transition-all cursor-pointer group"
          >
            <div className="w-20 h-20 rounded-xl overflow-hidden relative shrink-0 border border-white/10">
              <img
                alt="Design Talks"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                src={designTalks.coverUrl}
              />
              <div className={`absolute inset-0 bg-black/45 flex items-center justify-center transition-opacity ${
                currentTrack?.id === designTalks.id && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
                {currentTrack?.id === designTalks.id && isPlaying ? (
                  <Pause size={20} fill="currentColor" className="text-white" />
                ) : (
                  <Play size={20} fill="currentColor" className="text-white" />
                )}
              </div>
            </div>
            <div className="flex-grow min-w-0 pr-1">
              <div className="flex justify-between items-start gap-1">
                <h4 className="font-bold text-white text-md truncate leading-snug">
                  {designTalks.title}
                </h4>
                <div onClick={(e) => e.stopPropagation()}>
                  <SongActionsMenu track={designTalks} />
                </div>
              </div>
              <p className="text-xs text-[#b9cacb] mt-0.5">{designTalks.artist}</p>
              <p className="font-label-mono text-[9px] text-[#e3d4ff] font-semibold mt-1 uppercase tracking-wider">
                Creative Podcast
              </p>
              <div className="mt-3 text-[10px] text-[#b9cacb] italic truncate">
                "Simple structure yields clean UI..."
              </div>
            </div>
          </div>
        </div>
      </section>

      <LyricsShowcase />

      {/* Popular Curated Playlists */}
      <section id="popular-playlists-section">
        <div className="flex flex-col gap-2 mb-6">
          <h3 className="font-headline-lg text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <span>Popular Playlists</span>
            <span className="text-[10px] bg-[#00f2ff]/15 text-[#00f2ff] font-label-mono uppercase tracking-widest font-bold px-2 py-0.5 rounded-full">MUST LISTEN</span>
          </h3>
          <p className="text-xs text-[#b9cacb] font-label-mono uppercase tracking-widest mt-0.5">
            Highly played sets tailored with deep premium vibes. Play to trigger full station queue instantly.
          </p>
        </div>

        <HScroll>
          {POPULAR_PLAYLISTS.map((playlist) => (
            <div
              key={playlist.id}
              id={`playlist-card-${playlist.id}`}
              onClick={() => handlePlayPlaylist(playlist.trackIds)}
              className="group relative bg-[#201f20]/30 hover:bg-[#201f20]/60 p-4 rounded-2xl border border-white/5 hover:border-[#00f2ff]/25 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[290px] w-[260px] md:w-[280px] shrink-0 snap-start shadow-lg"
            >
              <div className="flex flex-col gap-3">
                {/* Playlist Art Cover */}
                <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 shrink-0 bg-neutral-900">
                  <img
                    alt={playlist.name}
                    src={playlist.coverUrl}
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                  />
                  {/* Floating badge count */}
                  <span className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-mono font-bold text-[#00f2ff]">
                    {playlist.trackIds.length} tracks
                  </span>
                  {/* On hover play button overlay */}
                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <div className="w-11 h-11 rounded-full bg-[#00f2ff] text-black flex items-center justify-center shadow-lg shadow-[#00f2ff]/20 transform scale-90 group-hover:scale-100 transition-transform">
                      <Play size={16} fill="currentColor" className="ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Info Text */}
                <div className="flex flex-col gap-1">
                  <h4 className="font-headline font-bold text-white text-md group-hover:text-[#00f2ff] transition-colors">
                    {playlist.name}
                  </h4>
                  <p className="text-xs text-[#b9cacb] leading-relaxed line-clamp-2">
                    {playlist.description}
                  </p>
                </div>
              </div>

              {/* Tracks badge sequence */}
              <div className="border-t border-white/5 pt-3.5 mt-2.5 flex items-center justify-between">
                <span className="text-[9px] text-[#b9cacb] font-label-mono uppercase tracking-widest font-semibold">
                  Station Stream
                </span>
                <span className="text-[9.5px] bg-[#ff571a]/10 text-[#ff8056] px-2 py-0.5 rounded-full font-semibold font-mono">
                  🔥 {92 + Math.floor(playlist.name.length * 1.5)}k plays
                </span>
              </div>
            </div>
          ))}
        </HScroll>
      </section>

      {/* Genres / Asymmetric Cards */}
      <section id="browse-genres-list">
        <div className="flex flex-col gap-2 mb-6">
          <h3 className="font-headline-lg text-2xl md:text-3xl font-bold text-white">
            Browse Genres
          </h3>
          <p className="text-xs text-[#b9cacb] font-label-mono uppercase tracking-widest mt-0.5">
            Tap a genre to stream active featured track
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
                  <h3 className="font-headline text-sm font-bold text-white tracking-wide">
                    {genre.name}
                  </h3>
                </div>
              </div>
            ))}
        </HScroll>
      </section>
    </div>
  );
};
