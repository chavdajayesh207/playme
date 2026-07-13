/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAudioPlayer, useAudioTime } from './AudioPlayerContext';
import { Play, Pause, SkipForward, SkipBack, Heart, Volume2, VolumeX } from 'lucide-react';
import { NavigationTab } from '../types';
import { Visualizer } from './Visualizer';

interface FloatingPlayerBarProps {
  onExpandPlayer: () => void;
}

export const FloatingPlayerBar: React.FC<FloatingPlayerBarProps> = ({ onExpandPlayer }) => {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    nextTrack,
    prevTrack,
    volume,
    setVolume,
    toggleMute,
    toggleFavorite,
    isFavorite,
  } = useAudioPlayer();

  const { currentTime, duration } = useAudioTime();

  const progressPercent = (currentTime / (duration || 100)) * 100;

  if (!currentTrack) return null;

  return (
    <div
      id="bottom-floating-player-bar"
      className="fixed bottom-0 left-0 md:left-64 right-0 z-30 p-2 md:p-4 bg-[#131314]/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-between gap-4 h-20 shadow-[0_-8px_32px_rgba(0,0,0,0.5)] select-none"
    >
      {/* Top tiny progress line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10">
        <div
          className="h-full bg-[#00f2ff] shadow-[0_0_8px_rgba(0,242,255,0.7)] transition-all duration-100 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Left: Active track details */}
      <div className="flex items-center gap-3 min-w-0 max-w-[200px] md:max-w-xs shrink-0">
        <div
          onClick={onExpandPlayer}
          className="w-11 h-11 rounded-lg overflow-hidden border border-white/10 shrink-0 cursor-pointer hover:scale-105 transition-transform"
        >
          <img alt="Thumbnail" className="w-full h-full object-cover" src={currentTrack.coverUrl} />
        </div>
        <div className="min-w-0 cursor-pointer truncate" onClick={onExpandPlayer}>
          <h4 className="text-xs md:text-sm font-bold text-white truncate leading-snug">
            {currentTrack.title}
          </h4>
          <p className="font-label-mono text-[9px] md:text-[10px] text-[#b9cacb] mt-0.5 truncate uppercase tracking-wide">
            {currentTrack.artist}
          </p>
        </div>
        <Visualizer isPlaying={isPlaying} barCount={4} heightClass="h-3 ml-2 shrink-0 hidden sm:flex" />
      </div>

      {/* Center: Play controls */}
      <div className="flex items-center gap-3 md:gap-4 justify-center" id="mini-controls-bar">
        <button
          onClick={prevTrack}
          className="text-white hover:text-[#00f2ff] transition-colors p-1.5 hover:bg-white/5 rounded-full cursor-pointer shrink-0"
        >
          <SkipBack size={18} fill="currentColor" />
        </button>

        <button
          onClick={togglePlay}
          id="mini-play-toggle"
          className="w-10 h-10 rounded-full bg-[#00f2ff] text-[#00363a] flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
        </button>

        <button
          onClick={nextTrack}
          className="text-white hover:text-[#00f2ff] transition-colors p-1.5 hover:bg-white/5 rounded-full cursor-pointer shrink-0"
        >
          <SkipForward size={18} fill="currentColor" />
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3 shrink-0" id="mini-actions-row">
        <button
          onClick={() => toggleFavorite(currentTrack.id)}
          className="text-[#b9cacb] hover:text-white p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer"
        >
          <Heart
            size={18}
            className={isFavorite(currentTrack.id) ? 'fill-[#ff5ec3] text-[#ff5ec3]' : ''}
          />
        </button>

        {/* Volume controls */}
        <div className="hidden sm:flex items-center gap-2 group cursor-pointer">
          <button
            onClick={toggleMute}
            className="text-[#b9cacb] hover:text-white transition-colors cursor-pointer"
          >
            {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <div className="w-16 h-1 bg-white/10 rounded-full relative">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div
              className="h-full bg-white group-hover:bg-[#00f2ff] rounded-full"
              style={{ width: `${volume * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
