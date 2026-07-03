/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from './AudioPlayerContext';
import { useAuth } from './AuthContext';
import { searchYoutubeMusic } from '../lib/youtube';
import { Track } from '../types';
import { 
  Sparkles, 
  BookOpen, 
  Compass, 
  BarChart3, 
  Tv2, 
  Plus, 
  Play, 
  MessageSquare, 
  Volume2, 
  Search, 
  Dumbbell, 
  Laptop, 
  Coffee, 
  Heart, 
  ArrowRight,
  Info
} from 'lucide-react';

export const AIPlayerIntelligence: React.FC = () => {
  const { currentTrack, playTrack, queue } = useAudioPlayer();
  const { isSubscribed, setShowPremiumModal } = useAuth();

  // Selected Tab state
  const [activeTab, setActiveTab] = useState<'lyrics' | 'spotify' | 'lastfm' | 'mood'>('lyrics');

  // Loaders
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [loadingLastfm, setLoadingLastfm] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);

  // States
  const [lyricsData, setLyricsData] = useState<{ lyrics: string; url?: string; headerImage?: string } | null>(null);
  const [spotifyRecs, setSpotifyRecs] = useState<any[]>([]);
  const [lastfmStats, setLastfmStats] = useState<any>(null);
  
  // AI DJ/Mood Vibe Generator States
  const [moodInput, setMoodInput] = useState('');
  const [aiPlaylist, setAiPlaylist] = useState<any[]>([]);
  const [moodQueriesUsed, setMoodQueriesUsed] = useState(0);
  
  // AI Music Tutor States
  const [tutorQuery, setTutorQuery] = useState('');
  const [tutorExplanation, setTutorExplanation] = useState<string>('');
  const [loadingTutor, setLoadingTutor] = useState(false);

  // AI Behind the Song story
  const [songStory, setSongStory] = useState<string>('');
  const [loadingStory, setLoadingStory] = useState(false);

  // Fetch track details when selected song changes
  useEffect(() => {
    if (!currentTrack) return;

    // Reset temporary states
    setLyricsData(null);
    setSpotifyRecs([]);
    setLastfmStats(null);
    setTutorExplanation('');
    setSongStory('');

    // Trigger parallel data fetch securely from our backend proxy endpoints
    fetchLyrics();
    fetchSpotifyRecommendations();
    fetchLastfmInformation();
  }, [currentTrack?.id, currentTrack?.title, currentTrack?.artist]);

  // ------------------------------------------
  // Fetch Functions
  // ------------------------------------------
  const fetchLyrics = async () => {
    if (!currentTrack) return;
    setLoadingLyrics(true);
    try {
      const res = await fetch(`/api/genius/lyrics?title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.artist)}`);
      if (res.ok) {
        const data = await res.json();
        setLyricsData(data);
      }
    } catch (e) {
      console.error('Error loading lyrics:', e);
    } finally {
      setLoadingLyrics(false);
    }
  };

  const fetchSpotifyRecommendations = async () => {
    if (!currentTrack) return;
    setLoadingRecs(true);
    try {
      // Clean artist names like "DJ ..." or "featuring ..." slightly for cleaner matching
      const cleanArtist = (currentTrack.artist || '').split(' • ')[0].split(' ft.')[0].split(' feat.')[0];
      const res = await fetch(`/api/spotify/recommendations?title=${encodeURIComponent(currentTrack.title || '')}&artist=${encodeURIComponent(cleanArtist)}`);
      if (res.ok) {
        const data = await res.json();
        setSpotifyRecs(data.tracks || []);
      }
    } catch (e) {
      console.error('Spotify recommendation error:', e);
    } finally {
      setLoadingRecs(false);
    }
  };

  const fetchLastfmInformation = async () => {
    if (!currentTrack) return;
    setLoadingLastfm(true);
    try {
      const cleanArtist = (currentTrack.artist || '').split(' • ')[0];
      const res = await fetch(`/api/lastfm?title=${encodeURIComponent(currentTrack.title || '')}&artist=${encodeURIComponent(cleanArtist)}`);
      if (res.ok) {
        const data = await res.json();
        if (!data.statsNotFound) {
          setLastfmStats(data);
        }
      }
    } catch (e) {
      console.error('Last.fm error:', e);
    } finally {
      setLoadingLastfm(false);
    }
  };

  // Trigger Gemini - Behind the Song Story Biography
  const fetchBehindTheSongStory = async () => {
    if (!currentTrack) return;
    if (songStory) return; // already loaded
    setLoadingStory(true);
    try {
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: currentTrack.title, artist: currentTrack.artist }),
      });
      if (res.ok) {
        const data = await res.json();
        setSongStory(data.summary);
      }
    } catch (e) {
      console.error('AI Summary error:', e);
    } finally {
      setLoadingStory(false);
    }
  };

  // Trigger Gemini - Language and Cultural Tutor translation
  const handleAskTutor = async (selectedText: string) => {
    if (!currentTrack) return;
    setLoadingTutor(true);
    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentTrack.title,
          artist: currentTrack.artist,
          lyrics: lyricsData?.lyrics || '',
          quoteLines: selectedText,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTutorExplanation(data.feedback);
      }
    } catch (e) {
      console.error('AI Tutor error:', e);
    } finally {
      setLoadingTutor(false);
    }
  };

  // Trigger Gemini AI DJ playlist matching custom mood/vibe
  const processMoodAI = async (vibeText: string) => {
    const query = vibeText || moodInput;
    if (!query.trim()) return;

    if (!isSubscribed && moodQueriesUsed >= 2) {
      setShowPremiumModal(true);
      return;
    }
    
    setLoadingAI(true);
    setMoodQueriesUsed(prev => prev + 1);
    try {
      const cleanTracks = queue.slice(0, 5).map(t => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        album: t.album,
        genre: t.genre
      }));
      const res = await fetch('/api/ai/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: query,
          currentTracks: cleanTracks, // pass current songs as context
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiPlaylist(data.tracks || []);
      }
    } catch (e) {
      console.error('AI DJ generation error:', e);
    } finally {
      setLoadingAI(false);
    }
  };

  // Directly resolve similar Spotify track metadata into standard playable YouTube tracks
  const handlePlayRecommendedTrack = async (track: any, appendOnly = false) => {
    try {
      const ytResults = await searchYoutubeMusic(`${track.artist} ${track.title}`);
      if (ytResults && ytResults.length > 0) {
        const resolvedTrack = ytResults[0];
        // Retain premium Spotify background cover if YouTube image is standard
        if (track.coverUrl) resolvedTrack.coverUrl = track.coverUrl;
        resolvedTrack.album = track.album || resolvedTrack.album;

        if (appendOnly) {
          // Append to player queue
          playTrack(currentTrack, [...queue, resolvedTrack]);
        } else {
          // Play immediately
          playTrack(resolvedTrack, [resolvedTrack, ...queue]);
        }
      } else {
        alert("Sorry, we couldn't resolve this track to an active YouTube Music stream.");
      }
    } catch (err) {
      console.warn("Could not load suggested track:", err);
    }
  };

  // Play the entire AI Mood playlist
  const handleLaunchMoodQueue = () => {
    if (aiPlaylist.length === 0) return;
    // Replace whole playing list with AI generated tracks
    playTrack(aiPlaylist[0], aiPlaylist);
  };

  // Append AI playlist to queue
  const handleAppendMoodQueue = () => {
    if (aiPlaylist.length === 0) return;
    playTrack(currentTrack, [...queue, ...aiPlaylist]);
  };

  // Preset quick mood tags
  const MOOD_PRESETS = [
    { label: 'Gym Beast Mode', icon: <Dumbbell size={13} />, text: 'High BPM, upbeat intense dance workout music electronic' },
    { label: 'Indie Coding Slop', icon: <Laptop size={13} />, text: 'Ambient lo-fi beats, synthwave music for programming' },
    { label: 'Gujarati Chill Vibes', icon: <Coffee size={13} />, text: 'Beautiful regional Gujarati acoustic or ambient pop folk music' },
    { label: 'Heartbroken Late Night', icon: <Heart size={13} />, text: 'Melancholic, sad piano or downbeat soulful pop, Charlie Puth style' },
  ];

  return (
    <div 
      className="w-full max-w-4xl bg-[#1b1a1c]/70 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden mt-6 flex flex-col shadow-2xl"
      id="ai-intelligence-panel"
    >
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-white/5 gap-4 bg-gradient-to-r from-purple-500/10 via-transparent to-cyan-500/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <h3 className="font-headline font-bold text-lg text-white">Playme. Intelligence</h3>
            <p className="text-xs text-[#b9cacb] mt-0.5">Dual-engine music proxy, lyrics & cultural tutor</p>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex gap-1 bg-[#0b0a0c]/60 p-1 rounded-xl self-stretch sm:self-auto overflow-x-auto min-w-0">
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'lyrics' 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/10' 
                : 'text-[#b9cacb] hover:text-white hover:bg-white/5'
            }`}
          >
            Lyrics & Tutor
          </button>
          
          <button
            onClick={() => setActiveTab('spotify')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'spotify' 
                ? 'bg-[#1db954] text-black shadow-lg shadow-green-500/10' 
                : 'text-[#b9cacb] hover:text-white hover:bg-white/5'
            }`}
          >
            Spotify Recs
          </button>

          <button
            onClick={() => setActiveTab('lastfm')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'lastfm' 
                ? 'bg-[#d51007] text-white shadow-lg' 
                : 'text-[#b9cacb] hover:text-white hover:bg-white/5'
            }`}
          >
            Last.fm Intel
          </button>

          <button
            onClick={() => setActiveTab('mood')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'mood' 
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-black shadow-lg' 
                : 'text-[#b9cacb] hover:text-white hover:bg-white/5'
            }`}
          >
            AI DJ Mood
          </button>
        </div>
      </div>

      {/* Dynamic Body Content */}
      <div className="p-6 min-h-[300px]" id="intelligence-tab-content">
        
        {/* TAB 1: LYRICS & TUTOR */}
        {activeTab === 'lyrics' && (
          <div className="flex flex-col gap-6" id="lyrics-tab-container">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              
              {/* Lyrics scroll container */}
              <div className="md:col-span-3 flex flex-col bg-[#0b0a0c]/40 rounded-2xl border border-white/[0.03] p-4 relative">
                <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-3">
                  <span className="font-label-mono text-[10px] text-purple-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <BookOpen size={11} /> Screenplay Lyrics
                  </span>
                  {lyricsData?.url && (
                    <a 
                      href={lyricsData.url} 
                      target="_blank" 
                      referrerPolicy="no-referrer"
                      className="text-[10px] text-purple-400 hover:underline"
                    >
                      Genius Link ↗
                    </a>
                  )}
                </div>

                {loadingLyrics ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-purple-500 animate-spin" />
                    <p className="text-xs text-[#b9cacb] italic">Scraping verified Genius lyric pages...</p>
                  </div>
                ) : lyricsData?.lyrics ? (
                  <div className="max-h-[340px] overflow-y-auto pr-2 custom-scrollbar text-left">
                    <p className="text-xs text-[#b9cacb] font-label-mono mb-4 italic text-purple-300">
                      💡 Click on any lyrics segment to prompt our AI Music Tutor to translate and analyze the context instantly!
                    </p>
                    {lyricsData.lyrics.split('\n').map((line, i) => {
                      const isHeading = line.startsWith('[') && line.endsWith(']');
                      if (isHeading) {
                        return (
                          <div 
                            key={i} 
                            className="font-bold text-xs text-purple-400 opacity-60 tracking-wider font-label-mono uppercase mt-4 mb-2 first:mt-0"
                          >
                            {line}
                          </div>
                        );
                      }
                      return (
                        <p
                          key={i}
                          onClick={() => {
                            setTutorQuery(line);
                            handleAskTutor(line);
                          }}
                          className="text-[#e1fdff] hover:text-purple-300 font-sans font-medium leading-relaxed select-text cursor-pointer hover:bg-white/5 px-2 py-0.5 rounded transition-transform origin-left hover:scale-[1.01]"
                        >
                          {line || '\u00A0'}
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                    <Compass size={32} className="text-[#b9cacb]/20 mb-2" />
                    <p className="text-sm font-semibold text-white">No lyrics cataloged</p>
                    <p className="text-xs text-[#b9cacb] mt-1 max-w-xs">We couldn't scrape lyrics matching this exact metadata. Try playing another song!</p>
                  </div>
                )}
              </div>

              {/* Tutor breakdown column */}
              <div className="md:col-span-2 flex flex-col gap-4">
                
                {/* AI Tutor tool block */}
                <div className="flex flex-col bg-purple-950/20 rounded-2xl border border-purple-500/10 p-4 min-h-[160px]">
                  <h4 className="text-xs font-bold font-label-mono text-purple-300 uppercase tracking-widest flex items-center gap-1.5 border-b border-purple-500/10 pb-2.5">
                    <Sparkles size={11} className="text-purple-400" /> AI Classroom Tutor
                  </h4>

                  {loadingTutor ? (
                    <div className="flex flex-col items-center justify-center flex-grow py-8 gap-2">
                      <div className="w-5 h-5 rounded-full border-2 border-t-transparent border-purple-400 animate-spin" />
                      <span className="text-[10px] text-purple-300 italic">Translating cultural context...</span>
                    </div>
                  ) : tutorExplanation ? (
                    <div className="text-xs text-[#b9cacb] text-left overflow-y-auto max-h-[280px] pr-1 py-1 flex flex-col gap-2.5">
                      <div className="bg-purple-900/10 p-2 rounded-lg text-[11px] text-purple-300 italic border border-purple-500/10">
                        Selected: "{tutorQuery}"
                      </div>
                      <div className="markdown-body space-y-2 leading-relaxed h-full">
                        {tutorExplanation.split('\n').map((para, i) => (
                          <p key={i}>{para}</p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center flex-grow py-8 text-[#b9cacb]/50 px-2">
                      <BookOpen size={24} className="opacity-40 mb-2" />
                      <p className="text-[11px] font-medium leading-relaxed">
                        Tap any lyric line to unlock active learning! Great for exploring multilingual tracks.
                      </p>
                    </div>
                  )}
                </div>

                {/* Behind the Track story biographical background */}
                <div className="flex flex-col bg-[#0b0a0c]/40 rounded-2xl border border-white/[0.03] p-4 flex-grow">
                  <h4 className="text-xs font-bold font-label-mono text-[#b9cacb] uppercase tracking-widest flex justify-between items-center border-b border-white/5 pb-2.5">
                    <span className="flex items-center gap-1.5">
                      <Info size={11} /> Behind the Song
                    </span>
                    {!songStory && !loadingStory && (
                      <button 
                        onClick={fetchBehindTheSongStory}
                        className="text-[9px] bg-white/5 border border-white/5 text-[#00f2ff] px-2 py-0.5 rounded-full hover:bg-white/10 active:scale-95 transition-all font-sans cursor-pointer"
                      >
                        Ask Gemini
                      </button>
                    )}
                  </h4>

                  {loadingStory ? (
                    <div className="flex flex-col items-center justify-center flex-grow py-8 gap-2">
                      <div className="w-5 h-5 rounded-full border-2 border-t-transparent border-[#00f2ff] animate-spin" />
                    </div>
                  ) : songStory ? (
                    <div className="text-xs text-[#b9cacb] text-left pr-1 overflow-y-auto max-h-[160px] leading-relaxed pt-2">
                      {songStory.split('\n').map((p, idx) => (
                        <p key={idx} className="mb-2 last:mb-0">{p}</p>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center flex-grow py-8 text-[#b9cacb]/40">
                      <p className="text-[11px]">Click 'Ask Gemini' to read how this song was written, recorded, and optimized.</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SPOTIFY RECOMMENDATIONS */}
        {activeTab === 'spotify' && (
          <div className="flex flex-col gap-4 text-left" id="spotify-recs-tab">
            <header className="flex justify-between items-center mb-2">
              <div>
                <h4 className="font-headline font-bold text-white text-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#1db954]" />
                  Similar Songs on Spotify
                </h4>
                <p className="text-xs text-[#b9cacb] mt-0.5">Spotify's recommend engine matched content you can stream free</p>
              </div>
            </header>

            {loadingRecs ? (
              <div className="flex flex-col justify-center items-center py-16 gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-[#1db954] animate-spin" />
                <p className="text-xs text-[#b9cacb] italic">Consulting Spotify recommendation servers...</p>
              </div>
            ) : spotifyRecs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {spotifyRecs.map((track, i) => (
                  <div 
                    key={i} 
                    className="flex items-center gap-3 bg-[#0b0a0c]/40 border border-white/[0.03] p-3 rounded-2xl group hover:border-[#1db954]/20 transition-all justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {track.coverUrl ? (
                        <img 
                          alt={track.title} 
                          src={track.coverUrl} 
                          className="w-11 h-11 rounded-lg object-cover shrink-0" 
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-xs font-bold text-[#b9cacb]">
                          ?
                        </div>
                      )}
                      
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate leading-snug">{track.title}</p>
                        <p className="text-[10px] text-[#b9cacb] truncate mt-0.5">{track.artist}</p>
                      </div>
                    </div>

                    {/* Interactive play triggers with automatic YouTube lookup resolution! */}
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handlePlayRecommendedTrack(track, false)}
                        title="Stream Song Now via YouTube Convertor"
                        className="w-8 h-8 rounded-full bg-[#1db954] text-black hover:bg-green-400 font-bold flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
                      >
                        <Play size={11} fill="currentColor" className="ml-0.5" />
                      </button>
                      <button
                        onClick={() => handlePlayRecommendedTrack(track, true)}
                        title="Append to inactive Queue"
                        className="w-8 h-8 rounded-full border border-white/10 hover:border-[#1db954]/40 hover:bg-[#1db954]/5 text-white flex items-center justify-center transition-all cursor-pointer"
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <Compass size={32} className="text-white/10 mb-2" />
                <p className="text-sm font-semibold text-white">No hybrid recommendations matches found</p>
                <p className="text-xs text-[#b9cacb] mt-1">This metadata has not been completely indexed on international database indexes.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LAST.FM INTEL */}
        {activeTab === 'lastfm' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left" id="lastfm-tab">
            <div className="md:col-span-1 flex flex-col gap-4 bg-[#0b0a0c]/40 rounded-2xl border border-white/[0.03] p-4">
              <h4 className="text-xs font-bold font-label-mono text-[#d51007] uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2.5">
                <BarChart3 size={12} /> Listening Stats
              </h4>

              {loadingLastfm ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <div className="w-5 h-5 rounded-full border-2 border-t-transparent border-[#d51007] animate-spin" />
                </div>
              ) : lastfmStats ? (
                <div className="flex flex-col gap-4 py-2">
                  <div>
                    <span className="text-[10px] text-[#b9cacb] font-label-mono uppercase tracking-wider block">Global Listeners</span>
                    <span className="text-xl font-bold font-mono text-white mt-0.5 block">
                      {Number(lastfmStats.listeners).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#b9cacb] font-label-mono uppercase tracking-wider block">Total Plays</span>
                    <span className="text-xl font-bold font-mono text-white mt-0.5 block">
                      {Number(lastfmStats.playcount).toLocaleString()}
                    </span>
                  </div>
                  {lastfmStats.tags && lastfmStats.tags.length > 0 && (
                    <div>
                      <span className="text-[10px] text-[#b9cacb] font-label-mono uppercase tracking-wider block mb-1.5">Top Genres</span>
                      <div className="flex flex-wrap gap-1.5">
                        {lastfmStats.tags.map((tag: string, i: number) => (
                          <span key={i} className="text-[9px] bg-red-950/20 text-[#ff807a] border border-red-500/10 px-2 py-0.5 rounded-full uppercase font-semibold">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center text-[#b9cacb]/40">
                  <p className="text-[11px]">No active listening counters cataloged for this artist.</p>
                </div>
              )}
            </div>

            <div className="md:col-span-2 flex flex-col bg-[#0b0a0c]/40 rounded-2xl border border-white/[0.03] p-4">
              <h4 className="text-xs font-bold font-label-mono text-[#b9cacb] uppercase tracking-widest flex items-center gap-1.5 border-b border-white/5 pb-2.5">
                Last.fm Artist Encyclopedia Biography
              </h4>
              <div className="text-xs text-[#b9cacb] leading-relaxed pt-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                {lastfmStats?.summary ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: lastfmStats.summary }} 
                    className="space-y-2 select-text" 
                  />
                ) : (
                  <p className="italic text-[#b9cacb]/40 text-center py-12">
                    Encyclopedia biography loading... If this persists, biometric summaries are generated dynamically via our integrated Gemini proxy service.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AI DJ MOOD ZONE */}
        {activeTab === 'mood' && (
          <div className="flex flex-col gap-6 text-left" id="mood-tab">
            <header>
              <h4 className="font-headline font-bold text-white text-md flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                AI DJ Mood Mixer & Playlist Generator
              </h4>
              <p className="text-xs text-[#b9cacb] mt-0.5">Describe your custom state. We will resolve suggestions to active streaming videos instantly.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              
              {/* Left query & presets panel */}
              <div className="md:col-span-2 flex flex-col gap-4">
                
                {/* Mood input area */}
                <div className="flex flex-col bg-[#0b0a0c]/40 p-4 border border-white/[0.03] rounded-2xl">
                  <label className="text-[10px] text-teal-400 font-label-mono uppercase tracking-widest font-bold mb-2 block">
                    Describe your Vibe!
                  </label>
                  <textarea
                    rows={2}
                    value={moodInput}
                    onChange={(e) => setMoodInput(e.target.value)}
                    placeholder="E.g., peaceful acoustic hindi covers for coding in study environment..."
                    className="w-full bg-[#131214] border border-white/5 hover:border-teal-500/30 focus:border-teal-400 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none resize-none transition-all"
                  />
                  
                  <button
                    onClick={() => processMoodAI('')}
                    disabled={loadingAI || !moodInput.trim()}
                    className="mt-3 w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-black font-bold text-xs py-2.5 rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1 hover:shadow-cyan-500/10 cursor-pointer"
                  >
                    {loadingAI ? (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent border-black animate-spin" />
                        <span>Querying DJ...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} />
                        <span>{!isSubscribed && moodQueriesUsed >= 2 ? 'Unlock Unlimited AI' : 'Generate AI Trackset'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Mood presets list */}
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] text-[#b9cacb] font-label-mono uppercase tracking-wider block">Quick Presets</span>
                  <div className="flex flex-col gap-1.5">
                    {MOOD_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setMoodInput(p.text);
                          processMoodAI(p.text);
                        }}
                        className="flex items-center gap-2 text-left bg-white/5 border border-white/[0.02] hover:bg-white/10 text-xs text-[#e1fdff] px-3 py-2 rounded-xl transition-all cursor-pointer"
                      >
                        <span className="text-teal-400">{p.icon}</span>
                        <span className="truncate">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right generated playlist panel */}
              <div className="md:col-span-3 flex flex-col bg-[#0b0a0c]/40 p-4 border border-white/[0.03] rounded-2xl min-h-[220px]">
                <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-3">
                  <span className="text-[10px] text-teal-400 font-label-mono uppercase tracking-widest font-bold flex items-center gap-1.5">
                    Suggested Soundscape
                  </span>
                  {aiPlaylist.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleLaunchMoodQueue}
                        className="text-[9px] bg-teal-400 hover:bg-teal-300 text-black font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer"
                        title="Discard active backlist and launch AI mix"
                      >
                        Play Mix
                      </button>
                      <button
                        onClick={handleAppendMoodQueue}
                        className="text-[9px] bg-white/5 hover:bg-white/10 text-[#00f2ff] px-2.5 py-1 rounded-full transition-all cursor-pointer border border-white/5"
                        title="Add tracklist to back of active playqueue"
                      >
                        Append Queue
                      </button>
                    </div>
                  )}
                </div>

                {loadingAI ? (
                  <div className="flex flex-col justify-center items-center flex-grow gap-2 py-12 text-center">
                    <div className="w-6 h-6 rounded-full border-2 border-t-transparent border-teal-400 animate-spin" />
                    <p className="text-[10px] text-[#b9cacb] italic max-w-xs px-4">
                      Gemini is generating song layouts and resolving titles with YouTube servers...
                    </p>
                  </div>
                ) : aiPlaylist.length > 0 ? (
                  <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {aiPlaylist.map((track, i) => (
                      <div 
                        key={i} 
                        className="flex flex-col bg-teal-950/10 border border-teal-500/5 p-3 rounded-xl gap-2 group hover:border-teal-400/20"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {track.coverUrl && (
                              <img src={track.coverUrl} className="w-8 h-8 rounded object-cover shrink-0" alt="" />
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate leading-snug">{track.title}</p>
                              <p className="text-[9px] text-[#b9cacb] mt-0.5 truncate">{track.artist}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => playTrack(track, [track, ...queue])}
                            className="w-6 h-6 rounded-full bg-teal-500 text-black hover:bg-teal-400 flex items-center justify-center shrink-0 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                            title="Play this single song immediately"
                          >
                            <Play size={8} fill="currentColor" className="ml-0.5" />
                          </button>
                        </div>
                        
                        {track.description && (
                          <p className="text-[10px] text-teal-200/50 italic border-t border-white/5 pt-1.5 leading-normal">
                            💬 "{track.description}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col justify-center items-center flex-grow text-center text-[#b9cacb]/40 py-12 px-4 border border-dashed border-white/5 rounded-xl">
                    <Sparkles size={20} className="mb-2 text-teal-400 animate-bounce" />
                    <p className="text-xs font-bold text-[#e1fdff]">AI DJ ready to build custom streams</p>
                    <p className="text-[10px] text-[#b9cacb] mt-1 max-w-xs leading-relaxed">
                      Enter what you are doing or select a preset to generate a customized, resolved playlist.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
