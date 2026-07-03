/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from './AudioPlayerContext';
import { Track } from '../types';
import { searchYoutubeMusic } from '../lib/youtube';
import { 
  Search, 
  Compass, 
  Play, 
  Podcast, 
  ArrowUpRight,
  Plus,
  Tv,
  Sparkles,
  CloudLightning,
  Music4,
  Loader2,
  CheckCircle2,
  Folder,
  FolderOpen,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SongActionsMenu } from './SongActionsMenu';
import { Logo } from './Logo';
import { ScrollContainer } from './ScrollContainer';
import { PodcastDirectory } from './PodcastDirectory';


interface DiscoverViewProps {
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  initialActiveTab?: 'local' | 'cloud';
  onActiveTabChange?: (tab: 'local' | 'cloud') => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  searchQuery: externalSearchQuery,
  setSearchQuery: externalSetSearchQuery,
  initialActiveTab,
  onActiveTabChange,
}) => {
  const { playTrack, currentTrack, allTracks, allGenres, addUserTrack } = useAudioPlayer();
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [internalActiveTab, setInternalActiveTab] = useState<'local' | 'cloud'>('cloud');
  const [openedFolder, setOpenedFolder] = useState<string | null>(null);

  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = externalSetSearchQuery !== undefined ? externalSetSearchQuery : setInternalSearchQuery;

  const activeTab = initialActiveTab !== undefined ? initialActiveTab : internalActiveTab;
  const setActiveTab = onActiveTabChange !== undefined ? onActiveTabChange : setInternalActiveTab;

  useEffect(() => {
    setOpenedFolder(null);
  }, [selectedCategory, searchQuery, internalActiveTab, initialActiveTab]);

  // Cloud Search State
  const [cloudTracks, setCloudTracks] = useState<Track[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [addedTrackIds, setAddedTrackIds] = useState<Record<string, boolean>>({});

  const categories = ['All', ...allGenres.map((g) => g.name)];

  // Local playme catalogue search matching
  const filteredLocalTracks = allTracks.filter((track) => {
    const matchesSearch =
      (track.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (track.artist || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (track.album || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || (track.genre || '').toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  // Group tracks by category when 'All' is selected
  const getGroupedTracks = () => {
    const groups: Record<string, Track[]> = {};
    filteredLocalTracks.forEach((track) => {
      const genre = track.genre || 'Uncategorized';
      if (!groups[genre]) {
        groups[genre] = [];
      }
      groups[genre].push(track);
    });
    return groups;
  };

  // Query YouTube Music database dynamically
  useEffect(() => {
    if (!searchQuery.trim()) {
      setCloudTracks([]);
      return;
    }

    // Auto-switch to YouTube Music when user types
    setActiveTab('cloud');
    setIsLoadingCloud(true);
    setCloudError(null);

    const delayDebounceFn = setTimeout(() => {
      searchYoutubeMusic(searchQuery)
        .then((results) => {
          setCloudTracks(results || []);
          setIsLoadingCloud(false);
        })
        .catch((err) => {
          console.warn('Cloud music search failure:', err);
          setCloudError(err.message || 'Limit exceeded or YouTube API unavailable. Showing local matches.');
          setIsLoadingCloud(false);
        });
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Handle saving online track to local collection/IndexedDB
  const handleAddToLibrary = async (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    try {
      await addUserTrack({
        ...track,
        genre: track.genre || 'Cloud Discovery',
        album: track.album || 'Cloud Stream',
      }, null, null);
      setAddedTrackIds(prev => ({ ...prev, [track.id]: true }));
    } catch (err) {
      console.error('Failed to add track to library', err);
    }
  };

  return (
    <div id="discover-feed" className="px-4 md:px-8 py-6 max-w-7xl mx-auto flex flex-col gap-8 pb-24">
      {/* Header & Search */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6 relative before:absolute before:bottom-0 before:left-0 before:right-0 before:h-[1px] before:bg-gradient-to-r before:from-[#00f2ff]/20 before:via-pink-500/10 before:to-transparent">
        <div>
          <h2 className="font-headline-lg text-3xl md:text-4xl font-bold text-[#e5e2e3] flex items-center gap-2">
            <span>Explore Discovery</span>
            <Compass className="text-[#00f2ff] animate-pulse" size={28} />
          </h2>
          <p className="text-xs text-[#b9cacb] mt-1 font-label-mono uppercase tracking-widest">
            Search offline play, uploads, & YouTube Music
          </p>
        </div>

        {/* Search bar */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            id="discover-search-input"
            placeholder="Search artists, tracks, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#201f20]/60 backdrop-blur-md border border-white/10 text-xs md:text-sm text-[#e5e2e3] placeholder-[#b9cacb]/40 focus:outline-hidden focus:border-[#00f2ff] transition-all"
          />
          <Search className="absolute left-3.5 top-3.5 text-[#b9cacb]/40" size={16} />
        </div>
      </header>

      {/* Database Mode Switcher Tabs */}
      <div className="flex border-b border-white/5 pb-2 gap-4">
        <button
          onClick={() => setActiveTab('local')}
          className={`pb-2 px-1 font-semibold text-xs tracking-wider uppercase transition-all relative ${
            activeTab === 'local' ? 'text-[#00f2ff]' : 'text-[#b9cacb] hover:text-white'
          }`}
        >
          Offline Play ({filteredLocalTracks.length})
          {activeTab === 'local' && (
            <motion.div layoutId="searchTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00f2ff]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('cloud')}
          className={`pb-2 px-1 font-semibold text-xs tracking-wider uppercase transition-all relative flex items-center gap-1.5 leading-none ${
            activeTab === 'cloud' ? 'text-pink-400' : 'text-[#b9cacb] hover:text-white'
          }`}
        >
          <CloudLightning size={12} className="text-pink-500 animate-bounce" />
          <span>YouTube Music</span>
          {activeTab === 'cloud' && (
            <motion.div layoutId="searchTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
          )}
        </button>
      </div>

      {activeTab === 'local' ? (
        <>
          {/* Categories scroller */}
          <section id="category-scroller" className="w-full">
            <ScrollContainer>
              {categories.map((cat) => (
                <button
                  key={cat}
                  id={`search-cat-${cat}`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-2 rounded-full font-semibold text-xs transition-all tracking-wide cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-[#00f2ff] text-[#00363a] shadow-[0_4px_12px_rgba(0,242,255,0.25)]'
                      : 'bg-white/5 hover:bg-white/10 text-[#b9cacb] hover:text-[#e5e2e3]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </ScrollContainer>
          </section>

          {/* Main Results panel */}
          <section id="results-and-featured">
            <h3 className="font-label-mono text-[10px] text-white/40 uppercase tracking-widest mb-4">
              Matched results ({filteredLocalTracks.length})
            </h3>

            {filteredLocalTracks.length === 0 ? (
              <div className="text-center py-20 text-[#b9cacb]">
                <p className="text-sm">No tracks matched your search query or filters.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className="mt-4 text-xs font-semibold text-[#00f2ff] hover:underline cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : selectedCategory === 'All' ? (
              openedFolder === null ? (
                /* Folders Grid View */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                  {Object.entries(getGroupedTracks()).map(([categoryName, tracks]) => {
                    const coverUrl = tracks[0]?.coverUrl;
                    return (
                      <div
                        key={categoryName}
                        onClick={() => setOpenedFolder(categoryName)}
                        className="bg-[#1c1b1c]/40 hover:bg-white/5 border border-white/5 hover:border-[#00f2ff]/30 p-3.5 rounded-2xl transition-all duration-300 cursor-pointer flex items-center gap-4 h-[110px] relative overflow-hidden group shadow-lg hover:shadow-[0_12px_30px_rgba(0,242,255,0.08)] hover:-translate-y-1"
                      >
                        {/* Gradient Glow backdrop */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#00f2ff]/5 via-transparent to-[#00f2ff]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                        {/* Left Side: Folder details */}
                        <div className="flex-1 flex flex-col justify-between h-full min-w-0 z-[2]">
                          <div className="w-8 h-8 rounded-lg bg-[#00f2ff]/10 text-[#00f2ff] flex items-center justify-center shadow-[0_0_10px_rgba(0,242,255,0.1)] group-hover:shadow-[0_0_15px_rgba(0,242,255,0.25)] transition-all duration-300 group-hover:scale-105 shrink-0">
                            <Folder size={16} className="fill-current" />
                          </div>

                          <div className="mt-1.5 min-w-0">
                            <h4 className="font-headline text-xs font-bold text-white uppercase tracking-wide group-hover:text-[#00f2ff] transition-colors truncate">
                              {categoryName}
                            </h4>
                            <span className="text-[9px] font-mono font-medium text-[#b9cacb]/50 block mt-0.5">
                              {tracks.length} track{tracks.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        {/* Right Side: 3D Rotated 4K Cover Sleeve */}
                        <div className="relative w-20 h-20 shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.4)] transition-all duration-500 transform rotate-[6deg] group-hover:scale-105 group-hover:rotate-[3deg]">
                          {coverUrl ? (
                            <img
                              src={coverUrl}
                              alt={categoryName}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#1c1b1c] flex items-center justify-center text-[#b9cacb]/30">
                              <Music4 size={24} />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Inside Opened Category Folder */
                <div className="space-y-6 animate-fade-in">
                  {/* Explorer Header Navigation Bar */}
                  <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setOpenedFolder(null)}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white cursor-pointer hover:scale-105 active:scale-95 transition-all flex items-center justify-center border border-white/5"
                        title="Back to Folders"
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-[#00f2ff] font-bold">Category Folder Directory</span>
                        <h4 className="font-headline text-sm font-bold text-white uppercase flex items-center gap-2 mt-0.5">
                          <FolderOpen size={16} className="text-[#00f2ff]" />
                          <span>{openedFolder}</span>
                        </h4>
                      </div>
                    </div>
                    <span className="text-xs text-[#b9cacb] font-medium bg-black/35 px-3.5 py-1.5 rounded-full border border-white/5">
                      {(getGroupedTracks()[openedFolder] || []).length} file{ (getGroupedTracks()[openedFolder] || []).length > 1 ? 's' : '' } detected
                    </span>
                  </div>

                  {/* Folder Tracks Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(getGroupedTracks()[openedFolder] || []).map((track) => {
                      const isActive = currentTrack?.id === track.id;
                      return (
                        <div
                          key={track.id}
                          onClick={() => playTrack(track, allTracks)}
                          className={`p-4 rounded-2xl border transition-all duration-200 flex items-center gap-4 cursor-pointer group ${
                            isActive
                              ? 'bg-[#00f2ff]/10 border-[#00f2ff]/30 shadow-[0_0_20px_rgba(0,242,255,0.05)]'
                              : 'bg-[#1c1b1c]/40 hover:bg-white/5 border-white/5'
                          }`}
                        >
                          {/* Track Art */}
                          <div className="w-16 h-16 rounded-xl overflow-hidden relative shrink-0 border border-white/10">
                            <img alt={track.title} className="w-full h-full object-cover" src={track.coverUrl} referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play size={18} fill="currentColor" className="text-white" />
                            </div>
                          </div>

                          {/* Track Info */}
                          <div className="flex-grow min-w-0 pr-2">
                            <div className="flex justify-between items-start gap-1">
                              <h4
                                className={`font-semibold text-sm truncate ${
                                  isActive ? 'text-[#00f2ff]' : 'text-white'
                                }`}
                              >
                                {track.title}
                              </h4>
                              <SongActionsMenu track={track} />
                            </div>
                            <p className="text-xs text-[#b9cacb] mt-0.5 truncate">{track.artist}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="font-label-mono text-[9px] text-[#b9cacb]/60 inline-block font-medium bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {track.genre}
                              </span>
                              {(track as any).isDemo && (
                                <span className="text-[8px] text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                  Demo
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLocalTracks.map((track) => {
                  const isActive = currentTrack?.id === track.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => playTrack(track, allTracks)}
                      className={`p-4 rounded-2xl border transition-all duration-200 flex items-center gap-4 cursor-pointer group ${
                        isActive
                          ? 'bg-[#00f2ff]/10 border-[#00f2ff]/30 shadow-[0_0_20px_rgba(0,242,255,0.05)]'
                          : 'bg-[#1c1b1c]/40 hover:bg-white/5 border-white/5'
                      }`}
                    >
                      {/* Track Art */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden relative shrink-0 border border-white/10">
                        <img alt={track.title} className="w-full h-full object-cover" src={track.coverUrl} referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play size={18} fill="currentColor" className="text-white" />
                        </div>
                      </div>

                      {/* Track Info */}
                      <div className="flex-grow min-w-0 pr-2">
                        <div className="flex justify-between items-start gap-1">
                          <h4
                            className={`font-semibold text-sm truncate ${
                              isActive ? 'text-[#00f2ff]' : 'text-white'
                            }`}
                          >
                            {track.title}
                          </h4>
                          <SongActionsMenu track={track} />
                        </div>
                        <p className="text-xs text-[#b9cacb] mt-0.5 truncate">{track.artist}</p>
                        <span className="font-label-mono text-[9px] text-[#b9cacb]/60 inline-block mt-1 font-medium bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                          {track.genre}
                        </span>
                        {(track as any).isDemo && (
                          <span className="text-[8px] text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ml-1">
                            Demo
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : (
        /* Cloud Search Results Component */
        <section id="cloud-results">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-label-mono text-[10px] text-white/40 uppercase tracking-widest flex items-center gap-2">
              <Logo size={14} withText={false} animate className="shrink-0" />
              <span>Play Me ({cloudTracks.length})</span>
            </h3>
            {searchQuery.trim() && (
              <span className="text-[10px] text-[#b9cacb] bg-[#feecff]/5 border border-[#fcddff]/10 px-2.5 py-1 rounded-full font-sans">
                Full streaming support enabled
              </span>
            )}
          </div>

          {!searchQuery.trim() ? (
            <div className="text-center py-20 text-[#b9cacb] border border-dashed border-white/5 rounded-3xl bg-[#141314]/20">
              <Music4 size={32} className="mx-auto text-pink-500/40 mb-3 animate-pulse" />
              <p className="text-sm font-semibold text-white">Start typing to search global cloud tracks</p>
              <p className="text-xs text-white/50 mt-1 max-w-sm mx-auto">
                Search through millions of official studio releases, covers, live concert sets, and regional classics.
              </p>
            </div>
          ) : isLoadingCloud ? (
            <div className="text-center py-24 text-pink-400">
              <Loader2 size={36} className="mx-auto animate-spin mb-4 text-pink-500" />
              <p className="text-sm font-semibold">Consulting YouTube Music global indexes...</p>
              <p className="text-xs text-white/40 mt-1">Sourcing high-resolution audio files and covers</p>
            </div>
          ) : cloudError ? (
            <div className="p-6 text-center border border-red-500/10 rounded-2xl bg-red-500/5 text-red-400">
              <p className="text-sm font-bold">Search Proxy Offline</p>
              <p className="text-xs mt-1 text-white/50">{cloudError}</p>
            </div>
          ) : cloudTracks.length === 0 ? (
            <div className="text-center py-20 text-[#b9cacb]">
              <p className="text-sm">No remote cloud results found for "{searchQuery}".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cloudTracks.map((track) => {
                const isActive = currentTrack?.youtubeId === track.youtubeId || currentTrack?.id === track.id;
                const isAdded = addedTrackIds[track.id] || allTracks.some(t => t.youtubeId === track.youtubeId);

                return (
                  <div
                    key={track.id}
                    onClick={() => playTrack(track, [...allTracks, ...cloudTracks])}
                    className={`p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 cursor-pointer group/card relative ${
                      isActive
                        ? 'bg-gradient-to-r from-pink-500/10 to-rose-400/5 border-pink-500/30 shadow-[0_0_20px_rgba(244,63,94,0.05)]'
                        : 'bg-[#1c1b1c]/40 hover:bg-white/5 border-white/5'
                    }`}
                  >
                    {/* Track Art */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden relative shrink-0 border border-white/10">
                      <img alt={track.title} className="w-full h-full object-cover" src={track.coverUrl} referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity">
                        <Play size={18} fill="currentColor" className="text-white" />
                      </div>
                    </div>

                    {/* Track Info */}
                    <div className="flex-grow min-w-0 pr-8">
                      <div className="flex justify-between items-start gap-1">
                        <h4
                          className={`font-semibold text-sm truncate ${
                            isActive ? 'text-pink-400' : 'text-white'
                          }`}
                        >
                          {track.title}
                        </h4>
                      </div>
                      <p className="text-xs text-[#b9cacb] mt-0.5 truncate">{track.artist}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="font-label-mono text-[9px] text-[#b9cacb]/60 inline-block font-medium bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider select-none">
                          Cloud Playable
                        </span>
                        {isAdded && (
                          <span className="text-[9px] text-emerald-400 flex items-center gap-0.5 bg-emerald-500/10 px-1.5 py-0.5 rounded-full font-semibold">
                            <CheckCircle2 size={9} /> Saved
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons Container */}
                    <div className="absolute right-4 flex items-center gap-1 z-20">
                      <button
                        onClick={(e) => handleAddToLibrary(e, track)}
                        disabled={isAdded}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          isAdded
                            ? 'text-emerald-400/60 bg-emerald-500/5'
                            : 'text-[#b9cacb] hover:text-white bg-white/5 hover:bg-white/10 hover:scale-105 active:scale-95'
                        }`}
                        title={isAdded ? "Added to local My Studio" : "Add to local My Studio"}
                      >
                        {isAdded ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                      </button>

                      <SongActionsMenu track={track} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Podcast Directory Hub */}
      <PodcastDirectory />
    </div>
  );
};

