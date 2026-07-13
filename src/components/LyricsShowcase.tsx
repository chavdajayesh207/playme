/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAudioPlayer, useAudioTime } from './AudioPlayerContext';
import { fetchSyncedLyrics, getActiveLyricIndex, type SyncedLyricLine, type LyricsResult } from '../lib/lyrics';
import { motion, AnimatePresence } from 'motion/react';
import { WordByWordLine } from './WordByWordLine';
import { 
  AlignLeft, 
  Type, 
  Sparkles, 
  Compass, 
  VolumeX, 
  Volume2, 
  Play, 
  Pause, 
  Tv, 
  Layers, 
  Smartphone,
  ChevronUp,
  Instagram,
  Minus,
  Plus,
  RotateCcw
} from 'lucide-react';

export type LyricStyleModeType = 'karaoke' | 'kinetic' | 'retro-card';

export const LyricsShowcase: React.FC = () => {
  const { 
    currentTrack, 
    isPlaying, 
    togglePlay, 
    seek,
    videoOpacity,
    setVideoOpacity,
    lyricsOffset,
    setLyricsOffset
  } = useAudioPlayer();

  const { currentTime, duration } = useAudioTime();

  const [styleMode, setStyleMode] = useState<LyricStyleModeType>('karaoke');
  const [backgroundEffect, setBackgroundEffect] = useState<boolean>(true);
  
  const karaokeContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLButtonElement>(null);

  const [lyricsResult, setLyricsResult] = useState<LyricsResult>({ lines: [], source: 'none', isSynced: false });
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);

  // Fetch real-time synced lyrics when the current track or duration changes
  useEffect(() => {
    if (!currentTrack) {
      setLyricsResult({ lines: [], source: 'none', isSynced: false });
      return;
    }
    
    setIsLoadingLyrics(true);
    
    const loadLyrics = async () => {
      try {
        const dur = duration > 10 ? duration : (currentTrack.duration || 180);
        const res = await fetchSyncedLyrics(currentTrack.title, currentTrack.artist, dur, currentTrack.youtubeId);
        setLyricsResult(res);
      } catch (err) {
        console.warn('[Showcase] Lyrics fetch failed:', err);
      } finally {
        setIsLoadingLyrics(false);
      }
    };

    const timer = setTimeout(loadLyrics, 300);
    return () => clearTimeout(timer);
  }, [currentTrack?.id, duration]);

  const lyrics = lyricsResult.lines;

  // Determine current active lyric index using our highly optimized binary search
  const activeLineIndex = getActiveLyricIndex(lyrics, currentTime + lyricsOffset);

  const activeLyric = lyrics[activeLineIndex] || { text: '🎵 [Intro / Instrumental]', time: 0 };

  // Scroll active lyric to center in scrolling karaoke mode (like Apple Music or Instagram Lyrics Roll)
  useEffect(() => {
    if (styleMode === 'karaoke' && activeLineRef.current && karaokeContainerRef.current) {
      const container = karaokeContainerRef.current;
      const activeLine = activeLineRef.current;
      const offsetTop = activeLine.offsetTop;
      const containerHeight = container.clientHeight;
      const activeLineHeight = activeLine.clientHeight;

      container.scrollTo({
        top: offsetTop - containerHeight / 2 + activeLineHeight / 2,
        behavior: 'smooth',
      });
    }
  }, [activeLineIndex, styleMode, currentTrack?.id]);

  const handleLineClick = (time: number) => {
    seek(time);
    if (!isPlaying) {
      togglePlay();
    }
  };

  if (!currentTrack) return null;

  const renderHeader = () => null;

  if (isLoadingLyrics) {
    return (
      <section id="synced-lyrics-section" className="flex flex-col gap-4">
        {renderHeader()}
        <div 
          id="instagram-lyrics-engine-loading" 
          className="relative rounded-2xl overflow-hidden p-6 select-none h-[340px] flex flex-col justify-center items-center gap-4 animate-fade-in"
        >
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-tr from-[#00f2ff]/20 via-pink-500/10 to-transparent rounded-full hidden md:block blur-[90px]" />
          </div>
          <div className="w-10 h-10 rounded-full border-4 border-t-[#00f2ff] border-r-pink-500 border-white/10 animate-spin z-10" />
          <p className="text-xs font-mono uppercase tracking-widest text-[#00f2ff]/80 animate-pulse font-bold z-10">
            Syncing Realtime Lyrics...
          </p>
        </div>
      </section>
    );
  }

  if (lyrics.length === 0) {
    return null;
  }

  return (
    <section id="synced-lyrics-section" className="flex flex-col gap-4 w-full">
      {renderHeader()}
      <div 
        id="instagram-lyrics-engine" 
        className="relative rounded-2xl overflow-hidden p-5 md:p-6 select-none w-full"
      >
      <div className="relative z-10 flex flex-col h-[340px]">
        {/* Top Control Bar with Info and Style Icons */}
        <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
          {/* Lyrics Sync Calibration Adjuster */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-0.5 select-none shrink-0 text-white/60">
            <button
              onClick={() => setLyricsOffset(lyricsOffset - 0.5)}
              className="p-1 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
              title="Delay lyrics (-0.5s)"
            >
              <Minus size={10} />
            </button>
            <span className="font-mono font-bold text-[#00f2ff] px-1 select-none min-w-[34px] text-center text-[9px]">
              {lyricsOffset === 0 ? 'SYNC' : `${lyricsOffset > 0 ? '+' : ''}${lyricsOffset.toFixed(1)}s`}
            </span>
            <button
              onClick={() => setLyricsOffset(lyricsOffset + 0.5)}
              className="p-1 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
              title="Speed up lyrics (+0.5s)"
            >
              <Plus size={10} />
            </button>
            {lyricsOffset !== 0 && (
              <button
                onClick={() => setLyricsOffset(0)}
                className="p-1 text-pink-400 hover:text-pink-300 transition-colors cursor-pointer flex items-center justify-center"
                title="Reset offset"
              >
                <RotateCcw size={9} />
              </button>
            )}
          </div>

          {/* Instagram-style visual style selectors */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStyleMode('karaoke')}
              className={`p-1.5 rounded-full transition-all border shrink-0 flex items-center justify-center cursor-pointer ${
                styleMode === 'karaoke' 
                  ? 'bg-white text-black border-white shadow-lg' 
                  : 'bg-white/5 text-white/70 hover:text-white border-white/10'
              }`}
              title="Style 1: Scrolling Karaoke Roll"
            >
              <AlignLeft size={14} />
            </button>
            <button
              onClick={() => setStyleMode('kinetic')}
              className={`p-1.5 rounded-full transition-all border shrink-0 flex items-center justify-center cursor-pointer ${
                styleMode === 'kinetic' 
                  ? 'bg-gradient-to-r from-pink-500 to-[#00f2ff] text-white border-transparent shadow-lg' 
                  : 'bg-white/5 text-white/70 hover:text-white border-white/10'
              }`}
              title="Style 2: Kinetic Typography Zoom"
            >
              <Type size={14} />
            </button>
            <button
              onClick={() => setStyleMode('retro-card')}
              className={`p-1.5 rounded-full transition-all border shrink-0 flex items-center justify-center cursor-pointer ${
                styleMode === 'retro-card' 
                  ? 'bg-rose-500 text-white border-rose-400 shadow-md' 
                  : 'bg-white/5 text-white/70 hover:text-white border-white/10'
              }`}
              title="Style 3: Retro Music Card Poster"
            >
              <Sparkles size={14} />
            </button>
          </div>
        </div>

        {/* Content Showcase Area depending on active style mode */}
        <div className="flex-grow overflow-hidden relative my-4 flex items-center justify-center">

          {/* MODE 1: Scrolling Karaoke Roll (Amazon Music Style) */}
          {styleMode === 'karaoke' && (
            <div 
              ref={karaokeContainerRef}
              className="w-full h-full overflow-y-auto px-2 md:px-4 py-8 lyrics-immersive-scroll flex flex-col gap-2 static"
            >
              {lyrics.map((line, i) => {
                const isActive = i === activeLineIndex;
                const isPast = i < activeLineIndex;
                return (
                  <button
                    key={`${line.time}-${i}`}
                    ref={isActive ? activeLineRef : null}
                    onClick={() => handleLineClick(line.time)}
                    className={`w-full text-left py-1 px-3 transition-all duration-300 cursor-pointer focus:outline-none flex items-start ${
                      isActive 
                        ? 'text-white text-2xl md:text-3xl font-black opacity-100 scale-100 drop-shadow-[0_2px_15px_rgba(255,255,255,0.3)] lyric-immersive-active-anim' 
                        : isPast 
                          ? 'text-white text-xl md:text-2xl font-bold opacity-20 scale-[0.98]' 
                          : 'text-white text-xl md:text-2xl font-bold opacity-45 scale-[0.98] hover:opacity-60'
                    }`}
                  >
                    <span className="break-words select-text leading-tight">{line.text}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* MODE 2: Kinetic Typography Bounce Zoom */}
          {styleMode === 'kinetic' && (
            <div className="text-center px-4 w-full h-full flex flex-col justify-center items-center relative py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeLyric.time}-${activeLineIndex}`}
                  initial={{ opacity: 0, scale: 0.85, y: 15 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    y: 0,
                    textShadow: '0 0 15px rgba(0,242,255,0.4)'
                  }}
                  exit={{ opacity: 0, scale: 1.1, y: -15 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                  className="max-w-[480px] break-words"
                >
                  <div className="text-2xl md:text-3xl font-black tracking-tight uppercase leading-snug select-text flex justify-center">
                    <WordByWordLine
                      text={activeLyric.text}
                      startTime={activeLyric.time}
                      endTime={lyrics[activeLineIndex + 1] ? lyrics[activeLineIndex + 1].time : duration}
                      currentTime={currentTime + lyricsOffset}
                      activeColorClass="text-white bg-clip-text bg-gradient-to-r from-white via-[#00f2ff] to-pink-500 text-transparent"
                      glowClass="drop-shadow-[0_0_15px_rgba(0,242,255,0.4)]"
                    />
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Next upcoming line preview */}
              {activeLineIndex < lyrics.length - 1 && (
                <div className="absolute bottom-2 text-white/20 text-[11px] font-mono hover:text-white/40 cursor-pointer select-none transition-all flex items-center gap-1 mt-4">
                  <span>Up Next:</span>
                  <span className="italic truncate max-w-[200px]">{lyrics[activeLineIndex + 1].text}</span>
                </div>
              )}
            </div>
          )}

          {/* MODE 3: Retro Block Music Card */}
          {styleMode === 'retro-card' && (
            <div className="w-full h-full flex items-center justify-center py-4">
              <div className="bg-[#201f20]/30 backdrop-blur-sm w-full max-w-[340px] aspect-[1.5/1] rounded-2xl shadow-lg p-5 border border-white/10 flex flex-col justify-between transition-transform duration-300 transform hover:scale-[1.03] hover:rotate-1 relative overflow-hidden group">
                
                {/* Vinyl record animated decoration background */}
                <div className="absolute right-[-30px] bottom-[-20px] w-32 h-32 rounded-full border-[10px] border-white/5 bg-black/40 flex items-center justify-center animate-spin group-hover:scale-110 transition-transform duration-500">
                  <div className="w-10 h-10 rounded-full border-[3px] border-white/10 bg-[#00f2ff]/20" />
                </div>

                <div className="flex items-center justify-between border-b border-white/15 pb-2 relative z-10">
                  <span className="text-[10px] uppercase font-bold text-white tracking-widest font-mono">
                    {currentTrack?.genre || 'MUSIC STATE'}
                  </span>
                  <Instagram size={14} className="text-white" />
                </div>

                {/* Main animated retro lyric container */}
                <div className="flex-grow flex items-center pr-12 relative z-10">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeLyric.text}
                      initial={{ rotate: -2, scale: 0.95, opacity: 0 }}
                      animate={{ rotate: 1, scale: 1, opacity: 1 }}
                      exit={{ rotate: 2, scale: 1.05, opacity: 0 }}
                      className="text-base md:text-lg font-black text-white italic tracking-wide leading-tight drop-shadow-md select-text"
                    >
                      <WordByWordLine
                        text={activeLyric.text}
                        startTime={activeLyric.time}
                        endTime={lyrics[activeLineIndex + 1] ? lyrics[activeLineIndex + 1].time : duration}
                        currentTime={currentTime + lyricsOffset}
                        activeColorClass="text-yellow-300 font-extrabold scale-[1.03]"
                        glowClass=""
                        inactiveColorClass="text-white/60"
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Footer labels info */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-white truncate">{currentTrack?.title}</p>
                    <p className="text-[9.5px] font-medium text-white/70 truncate">{currentTrack?.artist}</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlay();
                    }}
                    className="p-1.5 rounded-full bg-white text-black hover:scale-110 active:scale-95 transition-transform flex items-center justify-center shadow-lg cursor-pointer"
                  >
                    {isPlaying ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Seek timeline bar removed as timings are shown on parent player */}

      </div>
    </div>
  </section>
);
};
