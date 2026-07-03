import React, { useState, useEffect, useRef } from 'react';
import { useAudioPlayer } from './AudioPlayerContext';
import { Track } from '../types';
import { searchYoutubeMusic } from '../lib/youtube';
import {
  Play, Search, TrendingUp, Sparkles, Music2, Headphones, Radio, Mic2,
  MapPin, Disc3, Heart, Loader2, ChevronRight, Star, Globe2, Zap, Crown,
  Flame, BarChart3, Podcast, Volume2, Activity, Wand2,
  Coffee, Target, Dumbbell, CloudRain, Moon, Car, Compass, Smile, Frown,
  Repeat, History, ArrowLeft
} from 'lucide-react';
import {
  MUSIC_MOODS, MUSIC_GENRES, MUSIC_CHARTS, MUSIC_TRENDING, NEW_RELEASES,
  ARTIST_CATEGORIES, LIVE_SESSIONS, RADIO_CATEGORIES, WORLD_REGIONS,
  MADE_FOR_YOU_MOCK, EDITORS_PICKS, TOP_LABELS, MusicHubItem
} from '../lib/musicHubData';
import { HScroll } from './HScroll';

// ============================================================
// PlayMe Music Hub — Premium Immersive Discovery Page
// Design: Matches PlayMe's glass-portal-card / #00f2ff accent
// ============================================================

// 🎨 Helpers for mapping to premium Lucide Icons
const getMoodIcon = (id: string, size = 20) => {
  switch (id) {
    case 'chill': return <Coffee size={size} />;
    case 'focus': return <Target size={size} />;
    case 'workout': return <Dumbbell size={size} />;
    case 'romantic': return <Heart size={size} />;
    case 'rain': return <CloudRain size={size} />;
    case 'sleep': return <Moon size={size} />;
    case 'party': return <Sparkles size={size} />;
    case 'night-drive': return <Car size={size} />;
    case 'meditation': return <Compass size={size} />;
    case 'happy': return <Smile size={size} />;
    case 'sad': return <Frown size={size} />;
    case 'festival': return <Music2 size={size} />;
    default: return <Activity size={size} />;
  }
};

const getMadeForYouIcon = (id: string, size = 24) => {
  switch (id) {
    case 'mix1': return <Sparkles size={size} />;
    case 'mix2': return <Compass size={size} />;
    case 'mix3': return <Repeat size={size} />;
    case 'mix4': return <Coffee size={size} />;
    case 'mix5': return <Zap size={size} />;
    case 'mix6': return <History size={size} />;
    default: return <Wand2 size={size} />;
  }
};

// HScroll extracted to shared component

export const MusicHubView: React.FC = () => {
  const { playTrack, currentTrack } = useAudioPlayer();

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [activeSubHub, setActiveSubHub] = useState<MusicHubItem | null>(null);
  const [subHubLoading, setSubHubLoading] = useState(false);
  
  // Local classification buckets for SubHub
  const [subHubTopSongs, setSubHubTopSongs] = useState<Track[]>([]);
  const [subHubMixes, setSubHubMixes] = useState<Track[]>([]);
  const [subHubLive, setSubHubLive] = useState<Track[]>([]);
  const [subHubTrending, setSubHubTrending] = useState<Track[]>([]);

  // Featured hero rotation
  const heroItems = [
    { title: 'Blinding Lights', artist: 'The Weeknd', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80', query: 'The Weeknd Blinding Lights' },
    { title: 'Shape of You', artist: 'Ed Sheeran', image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=80', query: 'Ed Sheeran Shape of You' },
    { title: 'Senorita', artist: 'Camila Cabello', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&q=80', query: 'Shawn Mendes Camila Cabello Senorita' },
  ];
  const [heroIdx, setHeroIdx] = useState(0);
  const featured = heroItems[heroIdx];

  useEffect(() => {
    const timer = setInterval(() => setHeroIdx(i => (i + 1) % heroItems.length), 8000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setActiveSubHub(null);
    try {
      const results = await searchYoutubeMusic(searchQuery);
      setSearchResults(results);
    } catch { /* noop */ } finally { setIsSearching(false); }
  };

  useEffect(() => {
    const handleOpenSubHub = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.item) {
        openSubHub(customEvent.detail.item);
      }
    };
    window.addEventListener('playme-open-subhub', handleOpenSubHub);
    return () => window.removeEventListener('playme-open-subhub', handleOpenSubHub);
  }, []);

  const openSubHub = async (item: MusicHubItem) => {
    setActiveSubHub(item);
    setSubHubLoading(true);
    
    // Clear previous results
    setSubHubTopSongs([]);
    setSubHubMixes([]);
    setSubHubLive([]);
    setSubHubTrending([]);
    
    try {
      // Modify query slightly to ensure high quality official tracks
      // Using 'long' duration helps find mixes, but we actually want a mix of both.
      // Since YouTube API limits us, we will fetch standard videos (maxResults=50 in server)
      // and classify them locally.
      const query = `${item.query} top hits official`;
      const results = await searchYoutubeMusic(query);
      
      // Local Classification Engine (Phase 1)
      const topSongs: Track[] = [];
      const mixes: Track[] = [];
      const live: Track[] = [];
      const trending: Track[] = [];

      results.forEach(track => {
        const titleLower = track.title.toLowerCase();
        const duration = track.duration;

        const isLive = titleLower.includes('live') || titleLower.includes('concert') || titleLower.includes('performance');
        const isLong = duration > 900; // > 15 mins

        if (isLong) {
          mixes.push(track);
        } else if (isLive) {
          live.push(track);
        } else if (duration < 420) { // < 7 mins
          topSongs.push(track);
        } else {
          trending.push(track);
        }
      });

      // Distribute any leftovers or balance buckets
      if (trending.length < 4 && topSongs.length > 8) {
        trending.push(...topSongs.splice(8));
      }

      setSubHubTopSongs(topSongs);
      setSubHubMixes(mixes);
      setSubHubLive(live);
      setSubHubTrending(trending);

    } catch (err) {
      console.error('Failed to load subhub content:', err);
    } finally {
      setSubHubLoading(false);
    }
  };

  const clearSearch = () => { setSearchResults([]); setSearchQuery(''); };
  const closeSubHub = () => { setActiveSubHub(null); };

  // =============================================
  // Reusable section header
  // =============================================
  const SectionHeader = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) => (
    <div className="flex items-center gap-3 mb-5">
      <div className="p-2.5 rounded-xl bg-[#00f2ff]/10 border border-[#00f2ff]/20 text-[#00f2ff]">
        {icon}
      </div>
      <div>
        <h2 className="font-headline text-xl md:text-2xl font-bold text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-[11px] text-[#b9cacb]/60 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );



  // =============================================
  // Track results grid (for section drill-down)
  // =============================================
  const renderTrackGrid = (tracks: Track[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tracks.map(track => (
        <div
          key={track.id}
          onClick={() => playTrack(track, tracks)}
          className={`flex items-center gap-3.5 p-3 rounded-2xl cursor-pointer transition-all duration-300 border relative overflow-hidden group ${
            currentTrack?.id === track.id
              ? 'border-[#00f2ff]/40 bg-[#00f2ff]/5 shadow-[0_0_25px_rgba(0,242,255,0.08)]'
              : 'border-white/5 bg-[#1c1b1c]/40 hover:border-white/15 hover:bg-[#1c1b1c]/60'
          }`}
        >
          <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
            <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play size={18} className="text-white fill-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold text-[13px] leading-snug line-clamp-2 transition-colors ${currentTrack?.id === track.id ? 'text-[#00f2ff]' : 'text-white group-hover:text-[#00f2ff]'}`}>
              {track.title}
            </h4>
            <p className="text-[11px] text-[#b9cacb]/60 mt-0.5 truncate">{track.artist}</p>
          </div>
        </div>
      ))}
    </div>
  );

  // =============================================
  // MAIN RENDER
  // =============================================
  return (
    <div className="flex flex-col gap-0 animate-fade-in -mx-4 md:-mx-8 -mt-6">

      {/* ========== 1. HERO SECTION ========== */}
      <section className="relative h-[55vh] min-h-[380px] max-h-[520px] w-full flex items-end overflow-hidden">
        {/* Background image with blur */}
        <div className="absolute inset-0 z-0">
          <img
            key={heroIdx}
            src={featured.image}
            alt=""
            className="w-full h-full object-cover scale-110 transition-opacity duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#030303]/80 via-transparent to-transparent" />
        </div>

        {/* Ambient glow orbs */}
        <div className="absolute top-10 right-20 w-96 h-96 bg-[#00f2ff]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 w-80 h-80 bg-pink-500/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Hero Content */}
        <div className="relative z-10 w-full px-4 md:px-8 pb-8">
          <span className="uppercase tracking-widest text-[9px] font-mono font-bold text-[#00f2ff] bg-[#00f2ff]/10 px-3 py-1 rounded-full border border-[#00f2ff]/20 inline-block mb-4">
            ✦ Featured Today
          </span>
          <h1 className="font-headline font-bold text-4xl md:text-6xl text-white tracking-tight leading-none mb-2">
            {featured.title}
          </h1>
          <p className="text-lg text-[#b9cacb] font-sans mb-6">{featured.artist}</p>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => openSubHub({ id: 'featured', name: featured.title, emoji: '✨', query: featured.query, image: featured.image })}
              className="px-7 py-3 rounded-full bg-[#00f2ff] text-[#002022] font-bold text-sm flex items-center gap-2 hover:shadow-[0_0_25px_rgba(0,242,255,0.5)] transition-all active:scale-95"
            >
              <Play size={16} className="fill-[#002022]" /> Listen Now
            </button>
            <button className="px-7 py-3 rounded-full bg-white/[0.06] border border-white/10 text-white font-semibold text-sm hover:bg-white/10 backdrop-blur-md transition-all active:scale-95">
              Explore Artist
            </button>
          </div>

          {/* Hero dots */}
          <div className="flex gap-2 mt-6">
            {heroItems.map((_, i) => (
              <button key={i} onClick={() => setHeroIdx(i)} className={`h-1.5 rounded-full transition-all duration-500 ${i === heroIdx ? 'w-8 bg-[#00f2ff]' : 'w-1.5 bg-white/20 hover:bg-white/40'}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ========== 2. SEARCH BAR ========== */}
      <section className="relative z-20 px-4 md:px-8 -mt-4 mb-8">
        <form onSubmit={handleSearch} className="relative group max-w-3xl">
          <div className="absolute inset-0 bg-[#00f2ff]/5 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
          <div className="relative search-bar-spotify flex items-center pr-2">
            <Search size={18} className="text-[#b9cacb]/60 ml-5 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search songs, artists, albums, genres, moods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-white text-sm px-2 py-3.5 placeholder:text-[#b9cacb]/40 font-sans"
            />
            {searchQuery && (
              <button type="button" onClick={clearSearch} className="px-3 py-1 mr-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 text-[10px] font-bold uppercase tracking-wider transition-colors">
                Clear
              </button>
            )}
            <button
              type="submit"
              disabled={isSearching}
              className="px-5 py-2 rounded-full bg-[#00f2ff] text-[#002022] font-bold text-xs tracking-wide hover:shadow-[0_0_15px_rgba(0,242,255,0.4)] transition-all disabled:opacity-50 flex items-center gap-2 active:scale-95"
            >
              {isSearching ? <Loader2 className="animate-spin" size={14} /> : <><Search size={12} /> Search</>}
            </button>
          </div>
        </form>
      </section>

      {/* ========== SEARCH RESULTS ========== */}
      {searchResults.length > 0 && (
        <section className="px-4 md:px-8 mb-10 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <SectionHeader icon={<Search size={20} />} title="Search Results" subtitle={`${searchResults.length} results for "${searchQuery}"`} />
            <button onClick={clearSearch} className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95">
              <ArrowLeft size={14} /> Back to Music Hub
            </button>
          </div>
          {renderTrackGrid(searchResults)}
        </section>
      )}

      {/* ========== SUB-HUB VIEW (DYNAMIC DISCOVERY PAGE) ========== */}
      {activeSubHub && (
        <section className="animate-fade-in -mt-6">
          {/* SubHub Hero */}
          <div className="relative h-48 md:h-56 w-full flex items-end overflow-hidden mb-6 rounded-3xl shadow-lg border border-white/5">
            <div className="absolute inset-0">
              <img src={activeSubHub.image} alt={activeSubHub.name} className="w-full h-full object-cover scale-105" />
              <div className={`absolute inset-0 bg-gradient-to-t ${activeSubHub.color || 'from-[#030303]'} via-[#030303]/80 to-[#030303]/40`} />
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
            </div>
            
            <div className="relative z-10 w-full px-5 md:px-8 pb-6 flex flex-col items-start justify-end h-full">
              <button onClick={closeSubHub} className="mb-auto mt-6 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 backdrop-blur-md active:scale-95">
                <ArrowLeft size={14} /> Back to Hub
              </button>
              
              <div className="flex items-center gap-3 md:gap-4 mt-4">
                <span className="text-4xl md:text-5xl drop-shadow-lg">{activeSubHub.emoji}</span>
                <div>
                  <h1 className="font-headline font-bold text-3xl md:text-4xl text-white tracking-tight drop-shadow-lg">
                    {activeSubHub.name}
                  </h1>
                  {activeSubHub.subtitle && <p className="text-[#b9cacb] mt-0.5 text-sm md:text-base">{activeSubHub.subtitle}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* SubHub Content */}
          <div className="px-4 md:px-8 space-y-10 pb-24">
            {subHubLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#00f2ff]">
                <Loader2 size={40} className="animate-spin mb-4" />
                <p className="text-sm font-medium text-[#b9cacb]/80">Curating the best of {activeSubHub.name}...</p>
              </div>
            ) : (
              <>
                {subHubTopSongs.length > 0 && (
                  <section>
                    <SectionHeader icon={<Flame size={20} />} title="Top Songs" subtitle={`Hottest hits in ${activeSubHub.name}`} />
                    <HScroll>
                      {subHubTopSongs.map(track => (
                        <div
                          key={track.id}
                          onClick={() => playTrack(track, subHubTopSongs)}
                          className="flex-none w-36 md:w-44 rounded-2xl snap-start cursor-pointer group relative overflow-hidden transition-all duration-500 hover:scale-[1.03] border border-white/5 bg-[#1c1b1c]/40 hover:border-[#00f2ff]/30"
                        >
                          <div className="aspect-square overflow-hidden rounded-t-2xl relative">
                            <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-12 h-12 rounded-full bg-[#00f2ff] flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.5)] scale-90 group-hover:scale-100 transition-transform">
                                <Play size={20} className="text-[#002022] fill-[#002022] ml-1" />
                              </div>
                            </div>
                          </div>
                          <div className="p-3">
                            <h3 className="font-headline text-sm font-bold text-white line-clamp-1 group-hover:text-[#00f2ff] transition-colors">{track.title}</h3>
                            <p className="text-[11px] text-[#b9cacb]/60 mt-1 truncate">{track.artist}</p>
                          </div>
                        </div>
                      ))}
                    </HScroll>
                  </section>
                )}

                {subHubTrending.length > 0 && (
                  <section>
                    <SectionHeader icon={<Sparkles size={20} />} title="Trending & Discover" subtitle="Fresh picks and rising tracks" />
                    <HScroll>
                      {subHubTrending.map(track => (
                        <div
                          key={track.id}
                          onClick={() => playTrack(track, subHubTrending)}
                          className="flex-none w-64 md:w-72 rounded-2xl snap-start cursor-pointer group relative overflow-hidden transition-all duration-500 hover:scale-[1.02] border border-white/5 bg-[#1c1b1c]/40 hover:border-white/20 p-3 flex items-center gap-4"
                        >
                          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 relative">
                            <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play size={18} className="text-white fill-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-headline text-sm font-bold text-white line-clamp-2 leading-tight group-hover:text-[#00f2ff] transition-colors">{track.title}</h3>
                            <p className="text-[11px] text-[#b9cacb]/60 mt-1 truncate">{track.artist}</p>
                          </div>
                        </div>
                      ))}
                    </HScroll>
                  </section>
                )}

                {subHubMixes.length > 0 && (
                  <section>
                    <SectionHeader icon={<Radio size={20} />} title="Mixes & Long Sessions" subtitle="Over 15 minutes of continuous vibes" />
                    <HScroll>
                      {subHubMixes.map(track => (
                        <div
                          key={track.id}
                          onClick={() => playTrack(track, subHubMixes)}
                          className="flex-none w-48 md:w-56 rounded-2xl snap-start cursor-pointer group relative overflow-hidden transition-all duration-500 hover:scale-[1.03] border border-white/5 bg-[#1c1b1c]/40 hover:border-[#00f2ff]/30"
                        >
                          <div className="aspect-video overflow-hidden rounded-t-2xl relative">
                            <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] text-white font-mono font-medium backdrop-blur-md">
                              Long Play
                            </div>
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-10 h-10 rounded-full bg-[#00f2ff] flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.4)] scale-90 group-hover:scale-100 transition-transform">
                                <Play size={16} className="text-[#002022] fill-[#002022] ml-1" />
                              </div>
                            </div>
                          </div>
                          <div className="p-3">
                            <h3 className="font-headline text-sm font-bold text-white line-clamp-2 leading-tight group-hover:text-[#00f2ff] transition-colors">{track.title}</h3>
                            <p className="text-[11px] text-[#b9cacb]/60 mt-1 truncate">{track.artist}</p>
                          </div>
                        </div>
                      ))}
                    </HScroll>
                  </section>
                )}

                {subHubLive.length > 0 && (
                  <section>
                    <SectionHeader icon={<Mic2 size={20} />} title="Live & Performances" subtitle="Experience the stage" />
                    <HScroll>
                      {subHubLive.map(track => (
                        <div
                          key={track.id}
                          onClick={() => playTrack(track, subHubLive)}
                          className="flex-none w-48 md:w-60 rounded-2xl snap-start cursor-pointer group relative overflow-hidden transition-all duration-500 hover:scale-[1.03] border border-white/5 bg-[#1c1b1c]/40 hover:border-rose-500/30"
                        >
                          <div className="aspect-video overflow-hidden rounded-t-2xl relative">
                            <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute top-2 left-2 bg-rose-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-lg animate-pulse">
                              LIVE
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center scale-90 group-hover:scale-100 transition-transform">
                                <Play size={16} className="text-black fill-black ml-1" />
                              </div>
                            </div>
                          </div>
                          <div className="p-3">
                            <h3 className="font-headline text-sm font-bold text-white line-clamp-1 group-hover:text-rose-400 transition-colors">{track.title}</h3>
                            <p className="text-[11px] text-[#b9cacb]/60 mt-1 truncate">{track.artist}</p>
                          </div>
                        </div>
                      ))}
                    </HScroll>
                  </section>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* ========== 3. ALL DISCOVERY SECTIONS ========== */}
      {!searchResults.length && !activeSubHub && (
        <div className="px-4 md:px-8 space-y-10 pb-24">

          {/* ❤️ Made For You */}
          <section>
            <SectionHeader icon={<Wand2 size={20} />} title="Made For You" subtitle="Personalized mixes based on your taste" />
            <HScroll>
              {MADE_FOR_YOU_MOCK.map(item => (
                <div
                  key={item.id}
                  onClick={() => openSubHub(item)}
                  className="flex-none w-40 h-44 md:w-52 md:h-56 rounded-3xl snap-start cursor-pointer group relative overflow-hidden transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(0,242,255,0.08)] border border-white/5"
                >
                  <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-80 transition-opacity duration-300`} />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute inset-0 p-5 flex flex-col justify-between">
                    <div className="text-[#00f2ff] bg-black/40 backdrop-blur-md p-2 rounded-xl w-fit border border-white/10 flex items-center justify-center">
                      {getMadeForYouIcon(item.id, 20)}
                    </div>
                    <div>
                      <h3 className="font-headline text-base font-bold text-white mb-1 drop-shadow-md">{item.name}</h3>
                      <p className="text-[10px] text-white/60 line-clamp-2 font-sans">{item.subtitle}</p>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 border border-white/20">
                    <Play size={14} className="text-white fill-white ml-0.5" />
                  </div>
                </div>
              ))}
            </HScroll>
          </section>

          {/* 🔥 Trending */}
          <section>
            <SectionHeader icon={<TrendingUp size={20} />} title="Trending Now" subtitle="What the world is listening to right now" />
            <HScroll>
              {MUSIC_TRENDING.map(item => (
                <div
                  key={item.id}
                  onClick={() => openSubHub(item)}
                  className="flex-none w-44 md:w-52 rounded-2xl snap-start cursor-pointer group relative overflow-hidden transition-all duration-500 hover:scale-[1.03] border border-white/5 bg-[#1c1b1c]/40 hover:border-white/15"
                >
                  <div className="aspect-square overflow-hidden rounded-t-2xl">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1c1b1c] via-transparent to-transparent" />
                  </div>
                  <div className="p-3.5">
                    <span className="text-lg mr-2">{item.emoji}</span>
                    <h3 className="inline font-headline text-sm font-bold text-white">{item.name}</h3>
                  </div>
                  <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[#00f2ff] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 shadow-[0_4px_20px_rgba(0,242,255,0.4)]">
                    <Play size={14} className="text-[#002022] fill-[#002022] ml-0.5" />
                  </div>
                </div>
              ))}
            </HScroll>
          </section>

          {/* 🆕 New Releases */}
          <section>
            <SectionHeader icon={<Zap size={20} />} title="New Releases" subtitle="Latest songs from around the world" />
            <HScroll>
              {NEW_RELEASES.map(item => (
                <div
                  key={item.id}
                  onClick={() => openSubHub(item)}
                  className="flex-none w-44 md:w-52 rounded-2xl snap-start cursor-pointer group relative overflow-hidden transition-all duration-500 hover:scale-[1.03] border border-white/5 bg-[#1c1b1c]/40 hover:border-[#00f2ff]/25"
                >
                  <div className="aspect-square overflow-hidden rounded-t-2xl">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1c1b1c] via-transparent to-transparent" />
                  </div>
                  <div className="p-3.5">
                    <span className="text-lg mr-2">{item.emoji}</span>
                    <h3 className="inline font-headline text-sm font-bold text-white">{item.name}</h3>
                  </div>
                </div>
              ))}
            </HScroll>
          </section>

          {/* 🏆 Charts */}
          <section>
            <SectionHeader icon={<BarChart3 size={20} />} title="Global Charts" subtitle="Top 100 across the world" />
            <HScroll>
              {MUSIC_CHARTS.map(item => (
                <div
                  key={item.id}
                  onClick={() => openSubHub(item)}
                  className="flex-none w-48 md:w-56 h-32 rounded-2xl snap-start cursor-pointer group relative overflow-hidden transition-all duration-500 hover:scale-[1.03] border border-white/5"
                >
                  <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end gap-3">
                    <span className="text-2xl">{item.emoji}</span>
                    <div>
                      <h3 className="font-headline text-sm font-bold text-white leading-snug">{item.name}</h3>
                      <p className="text-[9px] text-white/50 font-mono uppercase tracking-wider">Updated Today</p>
                    </div>
                  </div>
                </div>
              ))}
            </HScroll>
          </section>

          {/* 🎭 Moods & Activities */}
          <section>
            <SectionHeader icon={<Activity size={20} />} title="Moods & Activities" subtitle="Music for every moment" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {MUSIC_MOODS.map(mood => (
                <div
                  key={mood.id}
                  onClick={() => openSubHub(mood)}
                  className="rounded-2xl cursor-pointer group relative overflow-hidden h-28 transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(0,242,255,0.06)] border border-white/5"
                >
                  <img src={mood.image} alt={mood.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className={`absolute inset-0 bg-gradient-to-br ${mood.color}`} />
                  <div className="absolute inset-0 flex items-center justify-center gap-2.5">
                    <span className="text-white filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                      {getMoodIcon(mood.id, 18)}
                    </span>
                    <h3 className="font-headline text-base font-bold text-white drop-shadow-md">{mood.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 🎼 Genres */}
          <section>
            <SectionHeader icon={<Music2 size={20} />} title="Browse Genres" subtitle="Dive into any genre" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
              {MUSIC_GENRES.map(genre => (
                <div
                  key={genre.id}
                  onClick={() => openSubHub(genre)}
                  className="rounded-2xl cursor-pointer group relative overflow-hidden aspect-[4/5] transition-all duration-500 hover:scale-105 hover:-translate-y-1 border border-white/5"
                >
                  <img src={genre.image} alt={genre.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
                    <h3 className="font-headline text-sm font-bold text-white tracking-wide">{genre.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 👨‍🎤 Artists */}
          <section>
            <SectionHeader icon={<Crown size={20} />} title="Artists" subtitle="Discover artists across the spectrum" />
            <HScroll>
              {ARTIST_CATEGORIES.map(item => (
                <div
                  key={item.id}
                  onClick={() => openSubHub(item)}
                  className="flex-none w-36 md:w-44 rounded-2xl snap-start cursor-pointer group relative overflow-hidden transition-all duration-500 hover:scale-[1.03] border border-white/5"
                >
                  <div className="aspect-square overflow-hidden rounded-t-2xl">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent" />
                  </div>
                  <div className="p-3 bg-[#1c1b1c]/40">
                    <span className="mr-1.5">{item.emoji}</span>
                    <h3 className="inline font-headline text-xs font-bold text-white">{item.name}</h3>
                  </div>
                </div>
              ))}
            </HScroll>
          </section>

          {/* ⭐ Editor's Picks */}
          <section>
            <SectionHeader icon={<Star size={20} />} title="Editor's Picks" subtitle="Handpicked by the PlayMe team" />
            <HScroll>
              {EDITORS_PICKS.map(item => (
                <div
                  key={item.id}
                  onClick={() => openSubHub(item)}
                  className="flex-none w-56 md:w-72 h-36 rounded-2xl snap-start cursor-pointer group relative overflow-hidden transition-all duration-500 hover:scale-[1.02] border border-white/5"
                >
                  <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end gap-3">
                    <span className="text-2xl">{item.emoji}</span>
                    <h3 className="font-headline text-base font-bold text-white drop-shadow-md">{item.name}</h3>
                  </div>
                </div>
              ))}
            </HScroll>
          </section>

          {/* 🎙 Live Sessions */}
          <section>
            <SectionHeader icon={<Mic2 size={20} />} title="Live Sessions" subtitle="Concerts, acoustic sets & unplugged" />
            <HScroll>
              {LIVE_SESSIONS.map(item => (
                <div
                  key={item.id}
                  onClick={() => openSubHub(item)}
                  className="flex-none w-44 md:w-52 rounded-2xl snap-start cursor-pointer group relative overflow-hidden transition-all duration-500 hover:scale-[1.03] border border-white/5 bg-[#1c1b1c]/40 hover:border-white/15"
                >
                  <div className="aspect-video overflow-hidden rounded-t-2xl">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1c1b1c] via-transparent to-transparent" />
                  </div>
                  <div className="p-3.5 flex items-center gap-2">
                    <span className="text-base">{item.emoji}</span>
                    <h3 className="font-headline text-xs font-bold text-white">{item.name}</h3>
                  </div>
                </div>
              ))}
            </HScroll>
          </section>

          {/* 📻 Radio */}
          <section>
            <SectionHeader icon={<Radio size={20} />} title="Radio" subtitle="Non-stop curated stations" />
            <HScroll>
              {RADIO_CATEGORIES.map(item => (
                <div
                  key={item.id}
                  onClick={() => openSubHub(item)}
                  className="flex-none w-40 h-40 md:w-48 md:h-48 rounded-2xl snap-start cursor-pointer group relative overflow-hidden transition-all duration-500 hover:scale-[1.03] border border-white/5"
                >
                  <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-2">
                    <span className="text-xl">{item.emoji}</span>
                    <h3 className="font-headline text-sm font-bold text-white">{item.name}</h3>
                  </div>
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-red-500/80 text-white text-[8px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Volume2 size={8} /> LIVE
                  </div>
                </div>
              ))}
            </HScroll>
          </section>

          {/* 🌍 Around the World */}
          <section>
            <SectionHeader icon={<Globe2 size={20} />} title="Around the World" subtitle="Music from every corner of the globe" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {WORLD_REGIONS.map(region => (
                <div
                  key={region.id}
                  onClick={() => openSubHub(region)}
                  className="rounded-2xl cursor-pointer group relative overflow-hidden h-28 transition-all duration-500 hover:scale-[1.03] border border-white/5"
                >
                  <img src={region.image} alt={region.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-black/50 group-hover:bg-black/35 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center gap-3">
                    <span className="text-3xl">{region.emoji}</span>
                    <h3 className="font-headline text-lg font-bold text-white">{region.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 🏷️ Featured Labels */}
          <section>
            <SectionHeader icon={<Disc3 size={20} />} title="Featured Labels" subtitle="Music from the world's top labels" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3">
              {TOP_LABELS.map(label => (
                <div
                  key={label.name}
                  onClick={() => openSubHub(label)}
                  className="bg-[#1c1b1c]/40 hover:bg-[#1c1b1c]/60 border border-white/5 hover:border-[#00f2ff]/20 rounded-2xl p-3 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(0,0,0,0.4)]"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shadow-lg bg-white/5 p-1">
                    <img src={label.image} alt={label.name} className="w-full h-full object-contain rounded-full bg-white" />
                  </div>
                  <span className="text-[10px] font-bold text-[#b9cacb] text-center leading-tight">{label.name}</span>
                </div>
              ))}
            </div>
          </section>

        </div>
      )}
    </div>
  );
};
