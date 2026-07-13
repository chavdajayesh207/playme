/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAudioPlayer, useAudioTime } from './AudioPlayerContext';
import { TRACKS } from '../data';
import { Track } from '../types';
import { Visualizer } from './Visualizer';
import { AIPlayerIntelligence } from './AIPlayerIntelligence';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Heart,
  Volume2,
  VolumeX,
  ListMusic,
  Maximize2
} from 'lucide-react';

export const ImmersivePlayerView: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    volume,
    isShuffle,
    isRepeat,
    playTrack,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    toggleFavorite,
    isFavorite,
    queue
  } = useAudioPlayer();

  const { currentTime, duration } = useAudioTime();

  const tracksList = queue && queue.length > 0 ? queue : TRACKS;
  let activeIndex = currentTrack ? tracksList.findIndex((t) => t.id === currentTrack.id) : 0;
  if (activeIndex === -1) {
    activeIndex = 0;
  }

  // Helper to format seconds like "1:56"
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seek(val);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
  };

  const getCarouselClass = (offset: number) => {
    switch (offset) {
      case 0:
        return 'carousel-item active z-20 scale-100 opacity-100 relative';
      case -1:
        return 'carousel-item prev hidden sm:block z-10 -translate-x-[45%] scale-80 opacity-65 absolute';
      case 1:
        return 'carousel-item next hidden sm:block z-10 translate-x-[45%] scale-80 opacity-65 absolute';
      case -2:
        return 'carousel-item far-prev hidden lg:block z-0 -translate-x-[80%] scale-65 opacity-35 absolute';
      case 2:
        return 'carousel-item far-next hidden lg:block z-0 translate-x-[80%] scale-65 opacity-35 absolute';
      default:
        return 'hidden absolute';
    }
  };

  return (
    <div
      id="immersive-player-view"
      className="flex-grow flex flex-col justify-center items-center w-full max-w-6xl mx-auto px-4 py-4 md:py-8 select-none relative pb-32"
    >
      {/* 3D Carousel Stage */}
      <div 
        className="w-full relative h-[360px] md:h-[450px] flex justify-center items-center carousel-perspective overflow-visible mb-6"
        id="player-carousel-stage"
      >
        {tracksList.map((track, i) => {
          let offset = i - activeIndex;

          // Seamless circular scrolling offsets
          if (tracksList.length >= 5) {
            if (offset < -2) offset += tracksList.length;
            if (offset > 2) offset -= tracksList.length;
          }

          // If offset is still outside range, don't show it in the 5-card carousel
          if (Math.abs(offset) > 2) return null;

          const baseClass = getCarouselClass(offset);
          const isCurrent = offset === 0;

          return (
            <div
              key={track.id}
              onClick={() => playTrack(track, tracksList)}
              className={`w-[250px] h-[320px] md:w-[350px] md:h-[430px] rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 ease-out cursor-pointer ${baseClass}`}
              style={{
                transformStyle: 'preserve-3d',
              }}
            >
              <img
                alt={track.title}
                className="w-full h-full object-cover select-none pointer-events-none"
                src={track.coverUrl}
              />
              
              {/* Bottom Details Overlay on Active Glass card */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent flex flex-col justify-end p-6 z-10 transition-all">
                {isCurrent && (
                  <div className="font-label-mono text-[9px] text-[#00f2ff] mb-1.5 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-[#00f2ff]" />
                    <span>Streaming HQ Playback</span>
                  </div>
                )}
                <h3 className="font-headline-lg text-lg md:text-2xl font-bold text-white tracking-tight leading-snug">
                  {track.title}
                </h3>
                <p className="text-xs md:text-sm text-[#b9cacb] mt-0.5">{track.artist}</p>
                {isCurrent && track.description && (
                  <p className="text-[10px] text-white/40 italic leading-normal line-clamp-2 mt-2">
                    {track.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Title & Track Details with Liked Triggers */}
      {currentTrack && (
        <div className="w-full max-w-3xl flex items-center justify-between mb-8 px-4">
          <div className="text-left">
            <p className="font-label-mono text-[9px] text-[#00f2ff] uppercase tracking-widest font-semibold">
              Playing Now
            </p>
            <h2 className="font-headline-lg text-2xl md:text-3xl font-bold text-white mt-1">
              {currentTrack.title}
            </h2>
            <p className="text-sm text-[#b9cacb] mt-0.5">{currentTrack.artist} — {currentTrack.album}</p>
          </div>
          <button
            onClick={() => toggleFavorite(currentTrack.id)}
            id="player-fav-btn"
            className="w-12 h-12 rounded-full border border-white/10 hover:border-white/20 flex items-center justify-center transition-all bg-white/5 active:scale-90 hover:bg-white/10 cursor-pointer"
          >
            <Heart
              size={22}
              className={`transition-colors duration-200 ${
                isFavorite(currentTrack.id) ? 'fill-[#ff5ec3] text-[#ff5ec3]' : 'text-white'
              }`}
            />
          </button>
        </div>
      )}

      {/* Floating Central Glass Control Panel */}
      <div
        id="player-controls-panel"
        className="glass-panel w-full max-w-4xl rounded-full px-6 md:px-10 py-5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
      >
        {/* Core Transport Buttons */}
        <div className="flex items-center gap-4 md:gap-6 shrink-0" id="transport-row">
          <button
            onClick={toggleShuffle}
            className={`transition-colors cursor-pointer ${
              isShuffle ? 'text-[#00f2ff]' : 'text-[#b9cacb] hover:text-[#e5e2e3]'
            }`}
          >
            <Shuffle size={18} />
          </button>
          
          <button
            onClick={prevTrack}
            className="text-white hover:text-[#00f2ff] transition-colors cursor-pointer"
          >
            <SkipBack size={24} fill="currentColor" />
          </button>

          {/* LARGE PULSING PLAY/PAUSE */}
          <button
            onClick={togglePlay}
            id="player-play-toggle-btn"
            className="w-14 h-14 rounded-full bg-[#00f2ff] text-[#00363a] flex items-center justify-center shadow-[0_4px_20px_rgba(0,242,255,0.45)] hover:shadow-[0_0_30px_rgba(0,242,255,0.7)] hover:scale-105 active:scale-95 transition-all cursor-pointer relative"
          >
            {isPlaying && (
              <span className="absolute inset-0 rounded-full border border-[#00f2ff]/60 animate-ping" />
            )}
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
          </button>

          <button
            onClick={nextTrack}
            className="text-white hover:text-[#00f2ff] transition-colors cursor-pointer"
          >
            <SkipForward size={24} fill="currentColor" />
          </button>

          <button
            onClick={toggleRepeat}
            className={`transition-colors cursor-pointer ${
              isRepeat ? 'text-[#00f2ff]' : 'text-[#b9cacb] hover:text-[#e5e2e3]'
            }`}
          >
            <Repeat size={18} />
          </button>
        </div>

        {/* Dynamic Progress and Visualizer bars */}
        <div className="flex-grow w-full flex items-center gap-4" id="progress-container">
          <span className="font-label-mono text-xs text-[#b9cacb] font-medium min-w-[36px] text-right">
            {formatTime(currentTime)}
          </span>

          <div className="flex-grow flex flex-col gap-1">
            {/* Visualizer and Time Tracker bar row */}
            <div className="flex justify-between items-end h-5 px-1 pb-1">
              <span className="font-label-mono text-[9px] text-[#00f2ff] opacity-80 uppercase tracking-widest uppercase">
                {currentTrack?.genre || 'MUSIC'}
              </span>
              <Visualizer isPlaying={isPlaying} barCount={16} heightClass="h-4 pb-0.5" />
            </div>

            <div className="relative group w-full h-1 bg-white/10 rounded-full">
              <input
                type="range"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeekChange}
              />
              <div
                className="h-full bg-[#00f2ff] rounded-full relative shadow-[0_0_8px_rgba(0,242,255,0.8)]"
                style={{ width: `${(currentTime / (duration || 100)) * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_rgba(255,255,255,1)]" />
              </div>
            </div>
          </div>

          <span className="font-label-mono text-xs text-[#b9cacb] font-medium min-w-[36px]">
            {formatTime(duration)}
          </span>
        </div>

        {/* Volume & Queue controls */}
        <div className="flex items-center gap-4 shrink-0" id="volume-row">
          <div className="flex items-center gap-2 group">
            <button
              onClick={toggleMute}
              className="text-[#b9cacb] hover:text-white transition-colors cursor-pointer"
            >
              {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <div className="w-16 h-1 bg-white/15 rounded-full relative">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={handleVolumeChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div
                className="h-full bg-[#b9cacb] group-hover:bg-[#00f2ff] rounded-full transition-colors"
                style={{ width: `${volume * 100}%` }}
              />
            </div>
          </div>

          <span className="h-4 w-px bg-white/15 hidden md:block" />

          <button className="text-[#b9cacb] hover:text-[#00f2ff] transition-colors relative cursor-pointer">
            <ListMusic size={18} />
          </button>
        </div>
      </div>

      {/* Playme. Integrated Intelligence Dashboard */}
      <AIPlayerIntelligence />
    </div>
  );
};
