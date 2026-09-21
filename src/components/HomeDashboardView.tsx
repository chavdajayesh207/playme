/**
 * HomeDashboardView.tsx
 * Full Amazon Music-style personalized home dashboard.
 *
 * 🤖 AI PERSONALIZATION: Sections are dynamically ordered based on user's
 * listening history. The more you listen, the better it gets. Sections
 * most relevant to your taste rise to the top automatically.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Track } from '../types';
import { useAudioPlayer } from './AudioPlayerContext';
import { Play, Pause, Loader2, RefreshCw, Flame, ChevronRight, Sparkles, Radio, Tag } from 'lucide-react';
import { HomeRail, RailTrack } from './HomeRail';
import { TOP_LYRIC_TRACKS } from '../topLyricTracks';
import {
  getMadeForYou, getTimeSectionLabel, getTopArtists, getPersonalizedNewSectionOrder
} from '../lib/recommendation';
import { getRecentTracks, getFrequentTracks, buildTasteSignals, ListenEvent } from '../lib/behaviorTracker';

// ─── Types ────────────────────────────────────────────────────────────────────
interface HomeTrack {
  id: string; title: string; artist: string; album?: string; duration: number;
  url: string; coverUrl: string; genre: string; description?: string;
  isYoutube: boolean; youtubeId: string; views?: string; likes?: string;
  publishedAt?: string; channelTitle?: string;
}

interface HomeCategory { title: string; emoji: string; tracks: HomeTrack[]; }

interface HomeData {
  trending: HomeCategory;
  songsForYou?: HomeCategory;
  popularPlaylists: HomeCategory;
  topCharts: HomeCategory;
  recentlyReleased: HomeCategory;
  recommended: HomeCategory;
  livePerformances: HomeCategory;
  ultraHdPlaylists?: HomeCategory;
  trendingPlaylists?: HomeCategory;
  albumsForYou?: HomeCategory;
  popularContent?: HomeCategory;
  basedOnRecents?: HomeCategory;
  // New sections
  stayUpbeat?: HomeCategory;
  newReleasesForYou?: HomeCategory;
  hotPlaylists?: HomeCategory;
  communityPlaylists?: HomeCategory;
  soulSoothers?: HomeCategory;
  decades90s?: HomeCategory;
  stayIndie?: HomeCategory;
  onTheRoad?: HomeCategory;
  stationsForYou?: HomeCategory;
  updatedAt: string | null;
  message?: string;
}

interface HomeDashboardViewProps { onBrowseAll: () => void; onClose?: () => void; }

// ─── Utilities ────────────────────────────────────────────────────────────────
function formatViews(views: string | undefined): string {
  if (!views) return '';
  const n = parseInt(views, 10);
  if (isNaN(n)) return views;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function timeAgo(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today'; if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`; if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function homeTrackToRailTrack(ht: HomeTrack): RailTrack {
  return {
    id: ht.id, title: ht.title, artist: ht.artist, channelTitle: ht.channelTitle,
    album: ht.album || 'YouTube Music', duration: ht.duration, url: ht.url,
    coverUrl: ht.coverUrl, genre: ht.genre || 'Music', description: ht.description,
    isYoutube: ht.isYoutube, youtubeId: ht.youtubeId, views: ht.views, publishedAt: ht.publishedAt,
  };
}

function listenEventToRailTrack(e: ListenEvent): RailTrack {
  return {
    id: e.trackId, title: e.title, artist: e.artist, duration: e.duration || 0,
    url: e.url || '', coverUrl: e.coverUrl, genre: e.genre, isYoutube: true,
    youtubeId: e.youtubeId || '', album: e.album,
  };
}

function homeTrackToTrack(ht: HomeTrack): Track {
  return {
    id: ht.id, title: ht.title, artist: ht.artist, album: ht.album || 'YouTube Music',
    duration: ht.duration, url: ht.url, coverUrl: ht.coverUrl, genre: ht.genre || 'Music',
    isYoutube: ht.isYoutube, youtubeId: ht.youtubeId,
  };
}

// ─── Static data ──────────────────────────────────────────────────────────────
const ETERNAL_CLASSICS: RailTrack[] = [
  { id: 'ec-1', title: 'Anand Bakshi Signature', artist: 'Kishore Kumar, R. D. Burman', duration: 5711, url: 'https://youtube.com/watch?v=_lQ7jA7pWkM', coverUrl: 'https://i.ytimg.com/vi/_lQ7jA7pWkM/hq720.jpg', genre: 'Bollywood', isYoutube: true, youtubeId: '_lQ7jA7pWkM' },
  { id: 'ec-2', title: 'Best of Retro Romance: Bollywood', artist: 'Asha Bhosle, Mohammed Rafi', duration: 2570, url: 'https://youtube.com/watch?v=kNWxcffZGL0', coverUrl: 'https://i.ytimg.com/vi/kNWxcffZGL0/hq720.jpg', genre: 'Bollywood', isYoutube: true, youtubeId: 'kNWxcffZGL0' },
  { id: 'ec-3', title: 'Unforgettable R. D. Burman', artist: 'Anup Ghosal, R. D. Burman', duration: 1524, url: 'https://youtube.com/watch?v=Jcmrtv7vLGc', coverUrl: 'https://i.ytimg.com/vi/Jcmrtv7vLGc/hqdefault.jpg', genre: 'Bollywood', isYoutube: true, youtubeId: 'Jcmrtv7vLGc' },
  { id: 'ec-4', title: '70s Bollywood Romance', artist: 'Kishore Kumar, Kalyanji', duration: 5405, url: 'https://youtube.com/watch?v=CeO-2xTCDTU', coverUrl: 'https://i.ytimg.com/vi/CeO-2xTCDTU/hq720.jpg', genre: 'Bollywood', isYoutube: true, youtubeId: 'CeO-2xTCDTU' },
  { id: 'ec-5', title: 'Unforgettable Asha Bhosle', artist: 'Asha Bhosle, Mohammed Rafi', duration: 4066, url: 'https://youtube.com/watch?v=v2XRkY27b2s', coverUrl: 'https://i.ytimg.com/vi/v2XRkY27b2s/hq720.jpg', genre: 'Bollywood', isYoutube: true, youtubeId: 'v2XRkY27b2s' },
  { id: 'ec-6', title: '60s Bollywood Romance', artist: 'Lata Mangeshkar, Mohammed Rafi', duration: 322, url: 'https://youtube.com/watch?v=v13cUeX6_co', coverUrl: 'https://i.ytimg.com/vi/v13cUeX6_co/hq720.jpg', genre: 'Bollywood', isYoutube: true, youtubeId: 'v13cUeX6_co' },
  { id: 'ec-7', title: '70s Bollywood Flashback', artist: 'Kishore Kumar, Asha Bhosle', duration: 7429, url: 'https://youtube.com/watch?v=c6x8eSUbsRQ', coverUrl: 'https://i.ytimg.com/vi/c6x8eSUbsRQ/hq720.jpg', genre: 'Bollywood', isYoutube: true, youtubeId: 'c6x8eSUbsRQ' },
  { id: 'ec-8', title: '80s Bollywood Flashback', artist: 'Kishore Kumar, Asha Bhosle', duration: 9346, url: 'https://youtube.com/watch?v=8ZLnS0hnS2U', coverUrl: 'https://i.ytimg.com/vi/8ZLnS0hnS2U/hq720.jpg', genre: 'Bollywood', isYoutube: true, youtubeId: '8ZLnS0hnS2U' },
];

const GENRE_TAGS = [
  'Bollywood', 'Indian Pop', 'Ghazal', 'Pop', 'Indie', 'Alternative', 'Punjabi Pop',
  'Dance & Electronic', 'Rock', 'Tollywood', 'Kollywood', 'Hip-Hop', 'Sandalwood', 'Mollywood',
  'K-Pop', 'Children\'s Music', 'Jazz', 'Country', 'LATIN', 'Afro', 'R&B',
  'Rabindra Sangeet', 'Indian Classical', 'Indian Devotional', 'Sufi', 'Lo-Fi',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Cinematic hero banner that rotates through trending tracks */
function HeroBanner({ tracks, onBrowseAll, onPlayTrack, currentTrack, isPlaying }: {
  tracks: HomeTrack[]; onBrowseAll: () => void;
  onPlayTrack: (t: HomeTrack, q: HomeTrack[]) => void;
  currentTrack: Track | null; isPlaying: boolean;
}) {
  const [heroIndex, setHeroIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!tracks.length) return;
    intervalRef.current = setInterval(() => setHeroIndex(p => (p + 1) % Math.min(tracks.length, 5)), 8000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [tracks.length]);

  if (!tracks.length) return null;
  const hero = tracks[heroIndex];

  return (
    <section className="flex flex-col">
      {/* Cinematic trending banner — single hero */}
      <div className="relative overflow-hidden cursor-pointer group" style={{ height: 'clamp(260px, 32vw, 420px)' }}
        onClick={() => onPlayTrack(hero, tracks)}>
        <div key={heroIndex} className="absolute inset-0 bg-cover bg-center transition-all duration-1000" style={{ backgroundImage: `url(${hero.coverUrl})` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20 z-10" />

        <div className="absolute inset-0 z-20 flex items-end px-6 md:px-10 pb-8 md:pb-12">
          <div className="flex items-end justify-between w-full">
            <div className="flex flex-col gap-2 max-w-[60%] md:max-w-[48%]">
              <div className="flex items-center gap-2">
                <span className="bg-[#1ed760]/15 text-[#1ed760] border border-[#1ed760]/25 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <Flame size={9} className="animate-pulse" /> Trending #{heroIndex + 1}
                </span>
                {hero.views && <span className="bg-white/10 backdrop-blur-sm text-white/60 text-[9px] font-mono px-2 py-1 rounded-full">{formatViews(hero.views)} views</span>}
              </div>
              <h2 className="text-white font-black text-2xl md:text-4xl tracking-tight leading-tight drop-shadow-2xl line-clamp-2">{hero.title}</h2>
              <p className="text-white/55 text-sm font-medium truncate">{hero.channelTitle || hero.artist}</p>
              <div className="flex items-center gap-3 mt-2">
                <button onClick={(e) => { e.stopPropagation(); onPlayTrack(hero, tracks); }}
                  className="flex items-center gap-2 bg-white text-black font-bold text-sm px-6 py-2.5 rounded-full hover:bg-white/90 active:scale-95 transition-all shadow-[0_4px_20px_rgba(255,255,255,0.25)] cursor-pointer">
                  {currentTrack?.id === hero.id && isPlaying ? <><Pause size={15} fill="black" /> Pause</> : <><Play size={15} fill="black" className="ml-0.5" /> Play</>}
                </button>
                <button onClick={(e) => { e.stopPropagation(); onBrowseAll(); }}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold text-sm px-5 py-2.5 rounded-full border border-white/15 cursor-pointer transition-all">
                  Browse All
                </button>
              </div>
            </div>
            {/* Side track list - desktop */}
            <div className="hidden md:flex flex-col gap-2">
              {tracks.slice(0, 5).map((t, i) => (
                <button key={t.id} onClick={(e) => { e.stopPropagation(); setHeroIndex(i); }}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all cursor-pointer max-w-[210px] w-full
                    ${i === heroIndex ? 'bg-white/12 border-white/25 backdrop-blur-md' : 'bg-black/30 border-white/5 hover:bg-white/8 hover:border-white/10 backdrop-blur-sm'}`}>
                  <img src={t.coverUrl} alt={t.title} className="w-8 h-8 rounded-md object-cover shrink-0" />
                  <div className="min-w-0 text-left">
                    <p className="text-[11px] font-semibold text-white truncate">{t.title}</p>
                    <p className="text-[9px] text-white/40 truncate">{t.artist}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Mobile dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-1.5 md:hidden">
          {tracks.slice(0, 5).map((_, i) => (
            <button key={i} onClick={(e) => { e.stopPropagation(); setHeroIndex(i); }}
              className={`rounded-full transition-all cursor-pointer ${i === heroIndex ? 'w-5 h-1.5 bg-[#1ed760]' : 'w-1.5 h-1.5 bg-white/30'}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** 🤖 AI Personalization Banner */
function PersonalizationBanner({ topArtist, sectionOrder }: { topArtist: string | null; sectionOrder: string[] }) {
  if (!topArtist) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1ed760]/5 border border-[#1ed760]/15">
      <div className="w-8 h-8 rounded-full bg-[#1ed760]/15 flex items-center justify-center shrink-0">
        <Sparkles size={14} className="text-[#1ed760]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold text-white">Personalized for you based on your listening</p>
        <p className="text-[10px] text-white/40 mt-0.5">Top artist: <span className="text-[#1ed760] font-semibold">{topArtist}</span> · Sections auto-reorder as you listen more</p>
      </div>
      <Sparkles size={16} className="text-[#1ed760]/40 shrink-0" />
    </div>
  );
}

/** Music by Genre — tag cloud */
function GenreTagCloud({ onBrowseAll }: { onBrowseAll: () => void }) {
  return (
    <section id="rail-genre-tags" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[18px] md:text-[20px] font-bold text-white tracking-tight">Music by Genre</h3>
          <p className="text-[10px] text-white/35 font-mono uppercase tracking-widest mt-0.5">{GENRE_TAGS.length} GENRES • BROWSE BY MOOD</p>
        </div>
        <button onClick={onBrowseAll} className="text-[11px] font-bold text-white/50 hover:text-white uppercase tracking-widest border border-white/10 hover:border-white/25 px-3 py-1.5 rounded-full transition-all cursor-pointer">
          See More
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {GENRE_TAGS.map(genre => (
          <button key={genre} onClick={onBrowseAll}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 hover:border-white/20 text-white/75 hover:text-white text-[12px] font-medium transition-all cursor-pointer active:scale-95">
            {genre}
          </button>
        ))}
      </div>
    </section>
  );
}

/** Most Loved Artists — circles from user's listening history */
function MostLovedArtistsSection({ onBrowseAll, recentTracks }: { onBrowseAll: () => void; recentTracks: RailTrack[] }) {
  const topArtists = getTopArtists(10);
  if (topArtists.length === 0 && recentTracks.length === 0) return null;

  // Build artist cards from top artists + fallback to recent track thumbnails
  const artistCards: RailTrack[] = topArtists.length > 0
    ? topArtists.map((a, i) => ({
        id: `artist-${i}`,
        title: a.artist,
        artist: a.artist,
        genreLabel: a.artist,
        duration: 0,
        url: recentTracks.find(t => t.artist?.toLowerCase() === a.artist.toLowerCase())?.url || '',
        coverUrl: a.coverUrl || recentTracks.find(t => t.artist?.toLowerCase().includes(a.artist.toLowerCase().split(' ')[0]))?.coverUrl ||
          `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&auto=format&fit=crop&q=80`,
        genre: 'Artist',
        isYoutube: true,
        youtubeId: '',
      }))
    : recentTracks.slice(0, 8).map(t => ({
        ...t,
        genreLabel: t.artist,
      }));

  return (
    <HomeRail
      id="rail-most-loved-artists"
      title="Most Loved Artists"
      subtitle={`${artistCards.length} ARTISTS • FROM YOUR LISTENING HISTORY`}
      tracks={artistCards}
      cardStyle="artist"
      onSeeMore={onBrowseAll}
      badge="YOU"
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({ onBrowseAll, onClose }) => {
  const { playTrack, currentTrack, isPlaying, togglePlay, allTracks } = useAudioPlayer();

  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [continueListening, setContinueListening] = useState<RailTrack[]>([]);
  const [frequentPlays, setFrequentPlays] = useState<RailTrack[]>([]);
  const [topArtistName, setTopArtistName] = useState<string | null>(null);

  const fetchHomeData = useCallback(async () => {
    try { setIsLoading(true); setError(null);
      const res = await fetch('/api/home');
      if (!res.ok) throw new Error(`Failed to load home data (${res.status})`);
      setHomeData(await res.json());
    } catch (e: any) { setError(e.message || 'Failed to load home data'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchHomeData(); }, [fetchHomeData]);

  useEffect(() => {
    const recentEvents = getRecentTracks(12);
    setContinueListening(recentEvents.map(listenEventToRailTrack));
    setFrequentPlays(getFrequentTracks(2, 12).map(listenEventToRailTrack));
    const top = getTopArtists(1);
    setTopArtistName(top.length > 0 ? top[0].artist : null);
  }, []);

  const handlePlayTrack = useCallback((track: HomeTrack, queue: HomeTrack[]) => {
    const t = homeTrackToTrack(track);
    if (currentTrack?.id === t.id) { togglePlay(); return; }
    playTrack(t, queue.map(homeTrackToTrack));
  }, [currentTrack, playTrack, togglePlay]);

  // ── Derived data ─────────────────────────────────────────────────────────
  const trending = homeData?.trending?.tracks || [];
  const songsForYou = (homeData?.songsForYou?.tracks || trending).map(homeTrackToRailTrack);
  const popularPlaylists = (homeData?.popularPlaylists?.tracks || []).map(homeTrackToRailTrack);
  const topCharts = (homeData?.topCharts?.tracks || []).map(homeTrackToRailTrack);
  const recentlyReleased = (homeData?.recentlyReleased?.tracks || []).map(homeTrackToRailTrack);
  const recommended = (homeData?.recommended?.tracks || []).map(homeTrackToRailTrack);
  const livePerformances = (homeData?.livePerformances?.tracks || []).map(homeTrackToRailTrack);

  // Ultra HD Playlists (genre-overlay)
  const ULTRA_HD_GENRES = ['Romance', 'Bollywood', 'Lo-Fi', 'I-Pop', 'Workout', 'Drive', 'Feel Good', 'Chill'];
  const ultraHdRail = (homeData?.ultraHdPlaylists?.tracks || homeData?.popularPlaylists?.tracks || [])
    .map((t, i): RailTrack => ({ ...homeTrackToRailTrack(t), genreLabel: ULTRA_HD_GENRES[i % ULTRA_HD_GENRES.length] }));

  // Trending Playlists (genre-overlay)
  const TRENDING_PL_GENRES = ['Feel Good Hindi', 'Feel Good Punjabi', 'Party', 'Bollywood Soul', 'Love Songs', 'Dance Party', 'Long Drive', 'Workout'];
  const trendingPlaylistsRail = (homeData?.trendingPlaylists?.tracks || homeData?.recommended?.tracks || [])
    .map((t, i): RailTrack => ({ ...homeTrackToRailTrack(t), genreLabel: TRENDING_PL_GENRES[i % TRENDING_PL_GENRES.length] }));

  const albumsForYou = (homeData?.albumsForYou?.tracks || topCharts).map(t => typeof t === 'object' && 'id' in t ? t : homeTrackToRailTrack(t as HomeTrack));
  const popularContent = (homeData?.popularContent?.tracks || []).map(homeTrackToRailTrack);
  const basedOnRecentsRail = (homeData?.basedOnRecents?.tracks || []).map(homeTrackToRailTrack);

  // NEW sections
  // Stay Upbeat (genre-overlay)
  const UPBEAT_GENRES = ['Feel Good Bollywood Retro', 'Punjabi Remixes', 'Katta Flow', 'Punjabi Dance Party', 'Bollywood Dance Party', 'Punjab Junction', 'Soundcheck: Telugu', 'I-Pop Party'];
  const stayUpbeatRail = (homeData?.stayUpbeat?.tracks || homeData?.popularPlaylists?.tracks || [])
    .map((t, i): RailTrack => ({ ...homeTrackToRailTrack(t), genreLabel: UPBEAT_GENRES[i % UPBEAT_GENRES.length] }));

  const newReleasesForYou = (homeData?.newReleasesForYou?.tracks || homeData?.recentlyReleased?.tracks || []).map(homeTrackToRailTrack);

  // Hot Playlists (genre-overlay)
  const HOT_PLAYLIST_LABELS = ['Fresh Hindi', 'Black Cat Energy', 'Top Tucker', 'Aahe!', 'Fully Tolly', 'Kannada Hits', 'Lo-fi Malayalam', 'Marathi Hits'];
  const hotPlaylistsRail = (homeData?.hotPlaylists?.tracks || homeData?.trendingPlaylists?.tracks || homeData?.trending?.tracks || [])
    .map((t, i): RailTrack => ({ ...homeTrackToRailTrack(t), genreLabel: HOT_PLAYLIST_LABELS[i % HOT_PLAYLIST_LABELS.length] }));

  const communityPlaylists = (homeData?.communityPlaylists?.tracks || homeData?.popularPlaylists?.tracks || []).map(homeTrackToRailTrack);

  // Soul Soothers (genre-overlay)
  const SOUL_LABELS = ['100 Greatest Sufi', 'Rainy Day Jams', 'Bollywood Chill', 'Bollywood Soul Soothers', 'Best of Bollywood Sufi', 'Mollywood Premam', 'Lo-Fi Hindi', 'Rain Check: I-Pop'];
  const soulSoothersRail = (homeData?.soulSoothers?.tracks || homeData?.recommended?.tracks || [])
    .map((t, i): RailTrack => ({ ...homeTrackToRailTrack(t), genreLabel: SOUL_LABELS[i % SOUL_LABELS.length] }));

  const decades90sRail = (homeData?.decades90s?.tracks || []).map(homeTrackToRailTrack);

  // Stay Indie (genre-overlay)
  const INDIE_LABELS = ['Best of Coke Studio', 'Ultimate Love Songs', 'Heartbroken Indie', 'Made in Indie', 'Tamil Pop', 'Gethu Flow', 'Breakthrough India', 'Telugu Pop'];
  const stayIndieRail = (homeData?.stayIndie?.tracks || [])
    .map((t, i): RailTrack => ({ ...homeTrackToRailTrack(t), genreLabel: INDIE_LABELS[i % INDIE_LABELS.length] }));

  const onTheRoadRail = (homeData?.onTheRoad?.tracks || []).map(homeTrackToRailTrack);

  // Artist Spotlight — top played artist's tracks from all data
  const artistSpotlightTracks = useMemo(() => {
    if (!topArtistName || !homeData) return [];
    const allTracks = [
      ...(homeData.trending?.tracks || []),
      ...(homeData.songsForYou?.tracks || []),
      ...(homeData.topCharts?.tracks || []),
      ...(homeData.recommended?.tracks || []),
      ...(homeData.stayUpbeat?.tracks || []),
    ];
    const filtered = allTracks.filter(t =>
      (t.artist || t.channelTitle || '').toLowerCase().includes(topArtistName.split(' ')[0].toLowerCase())
    );
    return filtered.length >= 3 ? filtered.map(homeTrackToRailTrack) : [];
  }, [homeData, topArtistName]);

  const lyricTracks = useMemo(() => {
    // 1. Gather all tracks from homeData
    const allHomeTracks: any[] = [
      ...(homeData?.trending?.tracks || []),
      ...(homeData?.songsForYou?.tracks || []),
      ...(homeData?.popularPlaylists?.tracks || []),
      ...(homeData?.topCharts?.tracks || []),
      ...(homeData?.recentlyReleased?.tracks || []),
      ...(homeData?.recommended?.tracks || []),
      ...(homeData?.stayUpbeat?.tracks || []),
      ...(homeData?.newReleasesForYou?.tracks || []),
      ...(homeData?.hotPlaylists?.tracks || []),
      ...(homeData?.communityPlaylists?.tracks || []),
      ...(homeData?.soulSoothers?.tracks || []),
      ...(homeData?.decades90s?.tracks || []),
      ...(homeData?.stayIndie?.tracks || []),
      ...(homeData?.onTheRoad?.tracks || []),
      ...(homeData?.stationsForYou?.tracks || []),
    ];

    // 2. Filter homeData tracks that specifically have the hasLyrics flag from the backend
    let withLyrics = allHomeTracks.filter(t => t.hasLyrics === true).map(t => typeof t === 'object' && 'id' in t ? t : homeTrackToRailTrack(t as HomeTrack));

    // 3. To ensure we always have 20-30 tracks as requested, pad with the top 30 global lyric tracks
    if (withLyrics.length < 30) {
      const padding = TOP_LYRIC_TRACKS
        .filter(t => !withLyrics.find(w => w.id === t.id || w.youtubeId === t.youtubeId))
        .slice(0, 30 - withLyrics.length)
        .map(t => typeof t === 'object' && 'id' in t ? t : homeTrackToRailTrack(t as any))
        .map((t: any) => ({ ...t, hasLyrics: true }));
      withLyrics = [...withLyrics, ...padding as any[]];
    }

    // 4. Deduplicate by ID
    return Array.from(new Map(withLyrics.map(t => [t.id, t])).values());
  }, [allTracks, homeData]);

  // Stations for You (station style with labels)
  const STATION_LABELS = ['Desi Vibes Radio', 'baelist Radio', 'Bollywood Romance', 'Kishore Kumar', '2010s Bollywood', 'Bollywood Party', 'Top Punjabi', '90s Indian Pop'];
  const stationsForYouRail = (homeData?.stationsForYou?.tracks || homeData?.recommended?.tracks || [])
    .map((t, i): RailTrack => ({ ...homeTrackToRailTrack(t), genreLabel: STATION_LABELS[i % STATION_LABELS.length] }));

  // Trending songs (compact 4-col)
  const trendingSongsRail = [...trending, ...(homeData?.topCharts?.tracks || [])].slice(0, 16).map(homeTrackToRailTrack);

  // Made For You
  const mfyCandidates = [...trending, ...(homeData?.songsForYou?.tracks || []), ...(homeData?.topCharts?.tracks || []), ...(homeData?.recommended?.tracks || [])];
  const madeForYou = getMadeForYou(mfyCandidates, 12).map(homeTrackToRailTrack);

  // Time of day
  const timeSection = getTimeSectionLabel();

  // 🤖 AI section ordering for new sections
  const newSectionOrder = getPersonalizedNewSectionOrder();

  // ── Loading / Error states ─────────────────────────────────────────────────
  if (isLoading && !homeData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <Loader2 className="w-8 h-8 text-[#1ed760] animate-spin" />
        <p className="text-[11px] text-white/40 font-mono uppercase tracking-widest">Building your personalized dashboard...</p>
      </div>
    );
  }

  if (error && !homeData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-sm text-red-400">{error}</p>
        <button onClick={fetchHomeData} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-full text-white text-sm cursor-pointer">
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  // ── Render all new sections in AI-personalized order ──────────────────────
  const newSectionComponents: Record<string, React.ReactNode> = {
    stayUpbeat: stayUpbeatRail.length > 0 && (
      <HomeRail key="stayUpbeat" id="rail-stay-upbeat" title="Stay Upbeat" subtitle="DANCE & PARTY PICKS FOR YOU" tracks={stayUpbeatRail.slice(0, 10)} cardStyle="genre-overlay" onSeeMore={onBrowseAll} />
    ),
    newReleasesForYou: newReleasesForYou.length > 0 && (
      <HomeRail key="newReleasesForYou" id="rail-new-releases" title="New Releases for You" subtitle="FRESH DROPS • POWERED BY YOUTUBE" tracks={newReleasesForYou} cardStyle="large" badge="NEW" onSeeMore={onBrowseAll} />
    ),
    hotPlaylists: hotPlaylistsRail.length > 0 && (
      <HomeRail key="hotPlaylists" id="rail-hot-playlists" title="Hot Playlists" subtitle="TRENDING RIGHT NOW" tracks={hotPlaylistsRail.slice(0, 10)} cardStyle="genre-overlay" onSeeMore={onBrowseAll} />
    ),
    communityPlaylists: communityPlaylists.length > 0 && (
      <HomeRail key="communityPlaylists" id="rail-community-playlists" title="Community Playlists" subtitle="LISTENER PLAYLISTS FOR YOU" tracks={communityPlaylists} cardStyle="large" onSeeMore={onBrowseAll} />
    ),
    soulSoothers: soulSoothersRail.length > 0 && (
      <HomeRail key="soulSoothers" id="rail-soul-soothers" title="Soul Soothers" subtitle="SUFI • CHILL • DEVOTIONAL" tracks={soulSoothersRail.slice(0, 10)} cardStyle="genre-overlay" onSeeMore={onBrowseAll} />
    ),
    decades90s: decades90sRail.length > 0 && (
      <HomeRail key="decades90s" id="rail-decades" title="90s & 2000s" subtitle="NOSTALGIC CLASSICS • REDISCOVER" tracks={decades90sRail} cardStyle="large" onSeeMore={onBrowseAll} />
    ),
    stayIndie: stayIndieRail.length > 0 && (
      <HomeRail key="stayIndie" id="rail-stay-indie" title="Stay Indie" subtitle="INDEPENDENT MUSIC • COKE STUDIO" tracks={stayIndieRail.slice(0, 10)} cardStyle="genre-overlay" onSeeMore={onBrowseAll} />
    ),
    onTheRoad: onTheRoadRail.length > 0 && (
      <HomeRail key="onTheRoad" id="rail-on-the-road" title="On the Road" subtitle="BEST MUSIC FOR LONG DRIVES" tracks={onTheRoadRail} cardStyle="wide" onSeeMore={onBrowseAll} />
    ),
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div id="home-dashboard" className="flex flex-col gap-0 pb-28" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>

      {/* ═══════════════════════ HERO BANNERS ═══════════════════════ */}
      <HeroBanner tracks={trending} onBrowseAll={onBrowseAll} onPlayTrack={handlePlayTrack} currentTrack={currentTrack} isPlaying={isPlaying} />

      {/* ═══════════════════════ PADDED CONTENT ═══════════════════════ */}
      <div className="flex flex-col gap-9 px-4 md:px-8 pt-8" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>

        {/* Songs for You */}
        {songsForYou.length > 0 && (
          <HomeRail id="rail-songs-for-you" title="Songs for You" subtitle={`${songsForYou.length} TRACKS • POWERED BY YOUTUBE`}
            tracks={songsForYou} cardStyle="compact" maxVisible={16} onSeeMore={onBrowseAll} />
        )}

        {/* Sing Along: Lyrics */}
        {lyricTracks.length > 0 && (
          <HomeRail id="rail-lyrics" title="Sing Along: Lyrics" subtitle={`${Math.max(20, lyricTracks.length)} TRACKS WITH LYRICS`}
            tracks={lyricTracks.slice(0, 30)} cardStyle="compact" maxVisible={16} onSeeMore={onBrowseAll} />
        )}

        {/* Eternal Classics */}
        <HomeRail id="rail-classics" title="Eternal Classics" subtitle="TIMELESS BOLLYWOOD • ALWAYS LOVED"
          tracks={ETERNAL_CLASSICS} cardStyle="large" onSeeMore={onBrowseAll} />

        {/* Ultra HD Playlists */}
        {ultraHdRail.length > 0 && (
          <HomeRail id="rail-ultra-hd" title="Ultra HD Playlists" subtitle="GENRE PICKS • HIGH FIDELITY"
            tracks={ultraHdRail.slice(0, 10)} cardStyle="genre-overlay" onSeeMore={onBrowseAll} />
        )}

        {/* Featured This Week */}
        {recentlyReleased.length > 0 && (
          <HomeRail id="rail-featured" title="Featured This Week" subtitle="NEW DROPS • FRESH FROM YOUTUBE"
            tracks={recentlyReleased} cardStyle="wide" badge="NEW" onSeeMore={onBrowseAll} />
        )}

        {/* Playlists for You */}
        {recommended.length > 0 && (
          <HomeRail id="rail-playlists" title="Playlists for You" subtitle={`${recommended.length} CURATED MIXES`}
            tracks={recommended} cardStyle="large" onSeeMore={onBrowseAll} />
        )}

        {/* Popular Ultra HD Content */}
        {popularContent.length > 0 && (
          <HomeRail id="rail-popular-content" title="Popular Ultra HD Content" subtitle="TOP PICKS • HIGHEST QUALITY"
            tracks={popularContent} cardStyle="large" onSeeMore={onBrowseAll} />
        )}

        {/* Top Videos */}
        {livePerformances.length > 0 && (
          <HomeRail id="rail-top-videos" title="Top Videos" subtitle="MUSIC VIDEOS • LIVE SESSIONS"
            tracks={livePerformances} cardStyle="video" onSeeMore={onBrowseAll} />
        )}

        {/* Based on Your Recents */}
        {continueListening.length > 0 && (
          <HomeRail id="rail-recents" title="Based on Your Recents"
            subtitle={`${continueListening.length} TRACKS • FROM YOUR LAST SESSION`}
            tracks={continueListening} cardStyle="compact" maxVisible={12} onSeeMore={onBrowseAll} />
        )}

        {/* ═══════════════════════════════════════════════════════════════
            🤖 AI PERSONALIZED NEW SECTIONS (order changes based on taste)
           ═══════════════════════════════════════════════════════════════ */}
        {newSectionOrder.map(key => newSectionComponents[key] || null)}

        {/* Most Loved Artists */}
        <MostLovedArtistsSection onBrowseAll={onBrowseAll} recentTracks={continueListening} />

        {/* Artist Spotlight (user's top artist) */}
        {artistSpotlightTracks.length > 0 && topArtistName && (
          <HomeRail id="rail-artist-spotlight" title={topArtistName} subtitle="STATION • YOUR TOP ARTIST"
            tracks={artistSpotlightTracks} cardStyle="large" badge="TOP ARTIST" onSeeMore={onBrowseAll} />
        )}

        {/* Stations for You */}
        {stationsForYouRail.length > 0 && (
          <HomeRail id="rail-stations" title="Stations for You" subtitle="CURATED RADIO STATIONS"
            tracks={stationsForYouRail.slice(0, 10)} cardStyle="station" onSeeMore={onBrowseAll} />
        )}

        {/* Music by Genre */}
        <GenreTagCloud onBrowseAll={onBrowseAll} />

        {/* Albums for You */}
        {albumsForYou.length > 0 && (
          <HomeRail id="rail-albums" title="Albums for You" subtitle="CURATED FOR YOUR TASTE"
            tracks={albumsForYou as RailTrack[]} cardStyle="large" onSeeMore={onBrowseAll} />
        )}

        {/* Trending Playlists */}
        {trendingPlaylistsRail.length > 0 && (
          <HomeRail id="rail-trending-playlists" title="Trending Playlists" subtitle="HOT RIGHT NOW"
            tracks={trendingPlaylistsRail.slice(0, 10)} cardStyle="genre-overlay" onSeeMore={onBrowseAll} />
        )}

        {/* Trending Songs (compact 4-col) */}
        {trendingSongsRail.length > 0 && (
          <HomeRail id="rail-trending-songs" title="Trending Songs"
            subtitle={`${trendingSongsRail.length} SONGS • LIVE FROM YOUTUBE`}
            tracks={trendingSongsRail} cardStyle="compact" maxVisible={16} onSeeMore={onBrowseAll} />
        )}

        {/* Made For You */}
        {madeForYou.length > 0 && continueListening.length > 0 && (
          <HomeRail id="rail-mfy" title="Made For You" subtitle="PERSONALIZED BY PLAYME AI"
            tracks={madeForYou} cardStyle="large" badge="AI" onSeeMore={onBrowseAll} />
        )}

        {/* Time-of-day */}
        {popularPlaylists.length > 0 && (
          <HomeRail id="rail-time" title={timeSection.title} subtitle={timeSection.subtitle}
            tracks={popularPlaylists} cardStyle="large" onSeeMore={onBrowseAll} />
        )}

        {/* Frequent Plays */}
        {frequentPlays.length > 0 && (
          <HomeRail id="rail-frequent" title="Your Frequent Plays" subtitle="TRACKS YOU KEEP COMING BACK TO"
            tracks={frequentPlays} cardStyle="large" onSeeMore={onBrowseAll} />
        )}

        {/* Podcasts Hub promo */}
        <section id="rail-podcasts" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[18px] md:text-[20px] font-bold text-white tracking-tight">Podcasts in the Spotlight</h3>
              <p className="text-[10px] text-white/35 font-mono uppercase tracking-widest mt-0.5">FEATURED PODCASTS • AUDIO BROADCASTS</p>
            </div>
            <button onClick={() => window.dispatchEvent(new CustomEvent('playme-navigate', { detail: { tab: 'livestage' } }))}
              className="text-[11px] font-bold text-white/50 hover:text-white uppercase tracking-widest border border-white/10 hover:border-white/25 px-3 py-1.5 rounded-full transition-all cursor-pointer">
              See More
            </button>
          </div>
          <div className="flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-pink-500/10 to-rose-500/5 border border-white/5 cursor-pointer hover:bg-white/[0.03] transition-colors"
            onClick={() => window.dispatchEvent(new CustomEvent('playme-navigate', { detail: { tab: 'livestage' } }))}>
            <div className="w-12 h-12 rounded-xl bg-pink-500/20 border border-pink-500/20 flex items-center justify-center shrink-0">
              <Radio size={22} className="text-pink-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Explore the Podcast Hub</p>
              <p className="text-white/40 text-xs mt-0.5">Hundreds of episodes from top creators, live from YouTube</p>
            </div>
            <div className="ml-auto flex items-center gap-2 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/25 text-pink-300 text-xs font-bold px-4 py-2 rounded-full transition-all shrink-0">
              Open Hub <ChevronRight size={12} />
            </div>
          </div>
        </section>

        {/* Personalization prompt (if no listening history) */}
        {continueListening.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-8 px-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
            <Sparkles className="text-[#1ed760]/60" size={28} />
            <p className="text-white font-semibold text-sm">Play songs to personalize your dashboard</p>
            <p className="text-white/40 text-xs max-w-md">
              Playme's AI learns from what you listen to. After a few plays, sections auto-reorder to match your taste — "Made For You", "Artist Spotlight", "Most Loved Artists" and more appear here.
            </p>
            <button onClick={onBrowseAll} className="mt-1 bg-[#1ed760] text-black font-bold text-sm px-5 py-2.5 rounded-full hover:bg-[#1ed760]/90 active:scale-95 transition-all cursor-pointer">
              Start Listening
            </button>
          </div>
        )}

        {homeData?.updatedAt && (
          <div className="text-center text-[9px] text-white/15 font-mono uppercase tracking-widest pb-4">
            Dashboard updated {timeAgo(homeData.updatedAt)} · Auto-refreshes every 6 hours · Powered by YouTube
          </div>
        )}
      </div>
    </div>
  );
};
