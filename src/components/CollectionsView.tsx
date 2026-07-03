import React, { useState } from 'react';
import { useAudioPlayer } from './AudioPlayerContext';
import { useAuth } from './AuthContext';
import { Track } from '../types';
import {
  Play,
  Heart,
  Trash2,
  FolderHeart,
  Music,
  User,
  Mail,
  Calendar,
  Sparkles,
  LogIn,
  Plus,
  Bookmark,
  Check,
  FolderPlus,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { SongActionsMenu } from './SongActionsMenu';
import { motion, AnimatePresence } from 'motion/react';

interface CollectionsViewProps {
  onAuthClick?: () => void;
}

type LibraryTab = 'favorites' | 'playlists' | 'offline' | 'demo';

export const CollectionsView: React.FC<CollectionsViewProps> = ({ onAuthClick }) => {
  const {
    favoriteIds,
    playTrack,
    currentTrack,
    toggleFavorite,
    allTracks,
    playlists,
    createPlaylist,
    deletePlaylist,
    removeTrackFromPlaylist
  } = useAudioPlayer();

  const { user } = useAuth();
  
  // Tab Management
  const [activeTab, setActiveTab] = useState<LibraryTab>('favorites');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  // Playlist Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  React.useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { tab, librarySubTab } = customEvent.detail || {};
      if (tab === 'favorites' && librarySubTab) {
        setActiveTab(librarySubTab as LibraryTab);
        setSelectedPlaylistId(null);
      }
    };
    window.addEventListener('playme-navigate', handleNavigate);
    return () => window.removeEventListener('playme-navigate', handleNavigate);
  }, []);

  // Sourced and parsed tracks lists
  const favoriteTracks = allTracks.filter((track) => favoriteIds.includes(track.id));
  const offlineTracks = allTracks.filter((track) => track.isOffline);
  const demoTracks = allTracks.filter((track) => track.isDemo);

  const handlePlayFavoriteAll = () => {
    if (favoriteTracks.length > 0) {
      playTrack(favoriteTracks[0], favoriteTracks);
    }
  };

  const handlePlayPlaylistAll = (playlistTracks: Track[]) => {
    if (playlistTracks.length > 0) {
      playTrack(playlistTracks[0], playlistTracks);
    }
  };

  const handleCreatePlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    createPlaylist(newPlaylistName, newPlaylistDesc);
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    setShowCreateModal(false);
  };

  // Get active selected playlist
  const activePlaylist = playlists.find(p => p.id === selectedPlaylistId);
  const activePlaylistTracks = activePlaylist
    ? allTracks.filter(t => activePlaylist.trackIds.includes(t.id))
    : [];

  return (
    <div id="collections-feed" className="px-4 md:px-8 py-6 max-w-7xl mx-auto flex flex-col gap-8 pb-24 select-none">
      
      {/* Sleek multi-tab Library navigation bar */}
      <div className="flex border-b border-white/5 pb-2 gap-4 md:gap-6 overflow-x-auto scrollbar-none">
        <button
          onClick={() => { setActiveTab('favorites'); setSelectedPlaylistId(null); }}
          className={`pb-2 px-1 font-semibold text-xs tracking-wider uppercase transition-all relative whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'favorites' ? 'text-[#ff5ec3]' : 'text-white/40 hover:text-white'
          }`}
        >
          <Heart size={12} className={activeTab === 'favorites' ? 'fill-current' : ''} />
          <span>Curated Favorites ({favoriteTracks.length})</span>
          {activeTab === 'favorites' && (
            <motion.div layoutId="libraryTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff5ec3]" />
          )}
        </button>

        <button
          onClick={() => { setActiveTab('playlists'); }}
          className={`pb-2 px-1 font-semibold text-xs tracking-wider uppercase transition-all relative whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'playlists' ? 'text-[#00f2ff]' : 'text-white/40 hover:text-white'
          }`}
        >
          <Bookmark size={12} />
          <span>Custom Folders ({playlists.length})</span>
          {activeTab === 'playlists' && (
            <motion.div layoutId="libraryTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00f2ff]" />
          )}
        </button>

        <button
          onClick={() => { setActiveTab('offline'); setSelectedPlaylistId(null); }}
          className={`pb-2 px-1 font-semibold text-xs tracking-wider uppercase transition-all relative whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'offline' ? 'text-[#a2ff00]' : 'text-white/40 hover:text-white'
          }`}
        >
          <Laptop size={12} />
          <span>Offline & Local ({offlineTracks.length})</span>
          {activeTab === 'offline' && (
            <motion.div layoutId="libraryTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#a2ff00]" />
          )}
        </button>

        <button
          onClick={() => { setActiveTab('demo'); setSelectedPlaylistId(null); }}
          className={`pb-2 px-1 font-semibold text-xs tracking-wider uppercase transition-all relative whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'demo' ? 'text-amber-400' : 'text-white/40 hover:text-white'
          }`}
        >
          <Sparkles size={12} />
          <span>Demo Catalogs ({demoTracks.length})</span>
          {activeTab === 'demo' && (
            <motion.div layoutId="libraryTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
          )}
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}
      <AnimatePresence mode="wait">
        
        {/* 1. FAVORITES TAB */}
        {activeTab === 'favorites' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
            key="favs-tab"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                  <span>Your Curated Favorites</span>
                  <FolderHeart className="text-[#ff5ec3] animate-pulse" size={22} />
                </h3>
                <p className="text-[10px] text-white/50 font-mono uppercase tracking-widest mt-1">
                  Private offline playlist synced to system index
                </p>
              </div>

              {favoriteTracks.length > 0 && (
                <button
                  onClick={handlePlayFavoriteAll}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold text-xs shadow-[0_4px_15px_rgba(255,94,195,0.3)] hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-2 cursor-pointer self-start"
                >
                  <Play size={12} fill="currentColor" />
                  <span>PLAY FAVORITES</span>
                </button>
              )}
            </div>

            {favoriteTracks.length === 0 ? (
              <div className="text-center py-20 text-[#b9cacb] border border-dashed border-white/5 rounded-3xl bg-[#141314]/20 flex flex-col items-center justify-center gap-4">
                <Heart size={36} className="text-pink-500/30 animate-bounce" />
                <div>
                  <h4 className="font-bold text-white text-sm">No favorites saved yet</h4>
                  <p className="text-xs text-white/50 mt-1 max-w-xs mx-auto">
                    Click the heart icon on any local or YouTube Music song inside Discover feed to add them here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {favoriteTracks.map((track, i) => {
                  const isActive = currentTrack?.id === track.id;
                  return (
                    <div
                      key={track.id}
                      className={`p-3 rounded-2xl flex items-center justify-between border transition-all duration-200 group ${
                        isActive ? 'bg-[#ff5ec3]/10 border-[#ff5ec3]/20 shadow-[0_0_20px_rgba(255,94,195,0.05)]' : 'bg-[#1c1b1c]/45 hover:bg-white/5 border-white/5'
                      }`}
                    >
                      <div
                        onClick={() => playTrack(track, favoriteTracks)}
                        className="flex items-center gap-4 cursor-pointer flex-grow min-w-0"
                      >
                        <span className="font-mono text-xs text-white/40 w-6 text-center shrink-0">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 relative">
                          <img alt={track.title} className="w-full h-full object-cover" src={track.coverUrl} />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play size={14} fill="currentColor" className="text-white" />
                          </div>
                        </div>
                        <div className="truncate pr-4">
                          <h4 className={`text-sm font-semibold truncate ${isActive ? 'text-[#ff5ec3]' : 'text-white'}`}>{track.title}</h4>
                          <p className="text-xs text-white/50 mt-0.5 truncate">{track.artist}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-semibold font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block">
                          {track.genre}
                        </span>
                        <SongActionsMenu track={track} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* 2. PLAYLISTS TAB */}
        {activeTab === 'playlists' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
            key="playlists-tab"
          >
            {/* Playlists view wrapper */}
            {!selectedPlaylistId ? (
              <>
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                      <span>Custom Library Folders</span>
                      <FolderPlus className="text-[#00f2ff]" size={22} />
                    </h3>
                    <p className="text-[10px] text-white/50 font-mono uppercase tracking-widest mt-1">
                      Group local catalog and YouTube Music cloud tracks into folders
                    </p>
                  </div>

                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-5 py-2 rounded-full bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Plus size={14} />
                    <span>CREATE FOLDER</span>
                  </button>
                </div>

                {/* Playlist Grid */}
                {playlists.length === 0 ? (
                  <div className="text-center py-20 text-[#b9cacb] border border-dashed border-white/5 rounded-3xl bg-[#141314]/20 flex flex-col items-center justify-center gap-4">
                    <Bookmark size={36} className="text-[#00f2ff]/30 animate-pulse" />
                    <div>
                      <h4 className="font-bold text-white text-sm">No folders created yet</h4>
                      <p className="text-xs text-white/50 mt-1 max-w-xs mx-auto">
                        Organize your collections by creating folders and adding cloud or local tracks from song context menus.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {playlists.map((playlist) => (
                      <div
                        key={playlist.id}
                        onClick={() => setSelectedPlaylistId(playlist.id)}
                        className="p-5 rounded-3xl border border-white/5 bg-[#1c1b1c]/45 hover:bg-white/5 hover:border-[#00f2ff]/30 cursor-pointer group transition-all duration-300 relative shadow-lg shadow-black/20"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00f2ff]/20 to-indigo-500/20 border border-[#00f2ff]/20 flex items-center justify-center text-[#00f2ff] group-hover:scale-105 transition-transform shrink-0 shadow-md">
                          <Music size={24} />
                        </div>
                        <h4 className="font-bold text-md text-white mt-4 group-hover:text-[#00f2ff] transition-colors truncate">
                          {playlist.name}
                        </h4>
                        <p className="text-xs text-white/50 mt-1 truncate min-h-[16px]">
                          {playlist.description || 'Custom collection folder'}
                        </p>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5 text-[10px] text-white/40 uppercase tracking-widest font-mono font-semibold">
                          <span>{playlist.trackIds.length} Songs</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Are you sure you want to delete folder "${playlist.name}"?`)) {
                                deletePlaylist(playlist.id);
                              }
                            }}
                            className="p-1 rounded-full text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                            title="Delete Folder"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* INDIVIDUAL PLAYLIST DETAIL VIEW */
              <div className="flex flex-col gap-6">
                <button
                  onClick={() => setSelectedPlaylistId(null)}
                  className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-[10px] uppercase font-bold tracking-widest transition-all self-start flex items-center gap-1.5 cursor-pointer"
                >
                  ◀ BACK TO FOLDERS
                </button>

                <div className="glass-dark-mav p-6 md:p-8 rounded-3xl border border-white/5 flex flex-col md:flex-row gap-6 relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#00f2ff]/5 rounded-full blur-[80px] pointer-events-none" />
                  
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-tr from-[#00f2ff]/30 to-indigo-500/20 border border-[#00f2ff]/20 flex items-center justify-center text-[#00f2ff] shrink-0 shadow-md">
                    <Music size={36} className="animate-pulse" />
                  </div>

                  <div className="flex-grow min-w-0">
                    <h3 className="text-2xl md:text-3xl font-black text-white capitalize leading-tight truncate">
                      {activePlaylist?.name}
                    </h3>
                    <p className="text-xs text-white/60 mt-1 max-w-xl">
                      {activePlaylist?.description || 'Custom collection folder'}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-white/40 uppercase font-mono tracking-widest font-semibold items-center">
                      <span>Created: {new Date(activePlaylist?.createdAt || '').toLocaleDateString()}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                      <span>{activePlaylistTracks.length} tracks catalogued</span>
                    </div>
                  </div>

                  {activePlaylistTracks.length > 0 && (
                    <button
                      onClick={() => handlePlayPlaylistAll(activePlaylistTracks)}
                      className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#00f2ff] to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 text-[#00363a] font-black text-xs shadow-[0_4px_15px_rgba(0,242,255,0.3)] hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-2 cursor-pointer self-start md:self-center shrink-0"
                    >
                      <Play size={12} fill="currentColor" />
                      <span>PLAY FOLDER</span>
                    </button>
                  )}
                </div>

                {activePlaylistTracks.length === 0 ? (
                  <div className="text-center py-20 text-[#b9cacb] border border-dashed border-white/5 rounded-3xl bg-[#141314]/20 flex flex-col items-center justify-center gap-4">
                    <Music size={32} className="text-white/20" />
                    <div>
                      <h4 className="font-bold text-white text-sm">Folder is empty</h4>
                      <p className="text-xs text-white/50 mt-1 max-w-xs mx-auto">
                        To add songs, click the three dots menu next to any song in Home or Discover and click 'Add to Playlist'.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {activePlaylistTracks.map((track, i) => {
                      const isActive = currentTrack?.id === track.id;
                      return (
                        <div
                          key={track.id}
                          className={`p-3 rounded-2xl flex items-center justify-between border transition-all duration-200 group ${
                            isActive ? 'bg-[#00f2ff]/10 border-[#00f2ff]/20' : 'bg-[#1c1b1c]/45 hover:bg-white/5 border-white/5'
                          }`}
                        >
                          <div
                            onClick={() => playTrack(track, activePlaylistTracks)}
                            className="flex items-center gap-4 cursor-pointer flex-grow min-w-0"
                          >
                            <span className="font-mono text-xs text-white/40 w-6 text-center shrink-0">
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 relative">
                              <img alt={track.title} className="w-full h-full object-cover" src={track.coverUrl} />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play size={14} fill="currentColor" className="text-white" />
                              </div>
                            </div>
                            <div className="truncate pr-4">
                              <h4 className={`text-sm font-semibold truncate ${isActive ? 'text-[#00f2ff]' : 'text-white'}`}>{track.title}</h4>
                              <p className="text-xs text-white/50 mt-0.5 truncate">{track.artist}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <SongActionsMenu track={track} />
                            <button
                              onClick={() => removeTrackFromPlaylist(activePlaylist!.id, track.id)}
                              className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-red-400 transition-all cursor-pointer"
                              title="Remove from Folder"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* 3. OFFLINE / LOCAL TAB */}
        {activeTab === 'offline' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
            key="offline-tab"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                  <span>Offline Catalogues</span>
                  <Laptop className="text-[#a2ff00]" size={22} />
                </h3>
                <p className="text-[10px] text-white/50 font-mono uppercase tracking-widest mt-1">
                  Locally imported and cached audio files available networkless
                </p>
              </div>

              {offlineTracks.length > 0 && (
                <button
                  onClick={() => playTrack(offlineTracks[0], offlineTracks)}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#a2ff00] to-emerald-500 text-black font-extrabold text-xs shadow-[0_4px_15px_rgba(162,255,0,0.25)] hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-2 cursor-pointer self-start"
                >
                  <Play size={12} fill="currentColor" />
                  <span>PLAY ALL LOCAL</span>
                </button>
              )}
            </div>

            {offlineTracks.length === 0 ? (
              <div className="text-center py-20 text-[#b9cacb] border border-dashed border-white/5 rounded-3xl bg-[#141314]/20 flex flex-col items-center justify-center gap-4">
                <Laptop size={36} className="text-[#a2ff00]/30 animate-pulse" />
                <div>
                  <h4 className="font-bold text-white text-sm">No offline tracks imported</h4>
                  <p className="text-xs text-white/50 mt-1 max-w-xs mx-auto">
                    Go to the 'My Studio' library tab, drop an MP3/WAV file, and upload your offline music collection locally!
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {offlineTracks.map((track, i) => {
                  const isActive = currentTrack?.id === track.id;
                  return (
                    <div
                      key={track.id}
                      className={`p-3 rounded-2xl flex items-center justify-between border transition-all duration-200 group ${
                        isActive ? 'bg-[#a2ff00]/10 border-[#a2ff00]/20' : 'bg-[#1c1b1c]/45 hover:bg-white/5 border-white/5'
                      }`}
                    >
                      <div
                        onClick={() => playTrack(track, offlineTracks)}
                        className="flex items-center gap-4 cursor-pointer flex-grow min-w-0"
                      >
                        <span className="font-mono text-xs text-white/40 w-6 text-center shrink-0">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 relative">
                          <img alt={track.title} className="w-full h-full object-cover" src={track.coverUrl} />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play size={14} fill="currentColor" className="text-white" />
                          </div>
                        </div>
                        <div className="truncate pr-4">
                          <h4 className={`text-sm font-semibold truncate ${isActive ? 'text-[#a2ff00]' : 'text-white'}`}>{track.title}</h4>
                          <p className="text-xs text-white/50 mt-0.5 truncate">{track.artist}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-semibold font-mono text-white/40 bg-white/5 px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block">
                          {track.genre}
                        </span>
                        <SongActionsMenu track={track} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* 4. DEMO CATALOG TAB */}
        {activeTab === 'demo' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
            key="demo-tab"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                  <span>Demo Catalog Tracks</span>
                  <Sparkles className="text-amber-400" size={22} />
                </h3>
                <p className="text-[10px] text-white/50 font-mono uppercase tracking-widest mt-1">
                  Interactive templates and demonstration placeholder assets
                </p>
              </div>

              {demoTracks.length > 0 && (
                <button
                  onClick={() => playTrack(demoTracks[0], demoTracks)}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold text-xs shadow-[0_4px_15px_rgba(245,158,11,0.25)] hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-2 cursor-pointer self-start"
                >
                  <Play size={12} fill="currentColor" />
                  <span>PLAY ALL DEMOS</span>
                </button>
              )}
            </div>

            {demoTracks.length === 0 ? (
              <div className="text-center py-20 text-[#b9cacb] border border-dashed border-white/5 rounded-3xl bg-[#141314]/20 flex flex-col items-center justify-center gap-4">
                <Sparkles size={36} className="text-amber-400/30 animate-pulse" />
                <div>
                  <h4 className="font-bold text-white text-sm">No demo badges active</h4>
                  <p className="text-xs text-white/50 mt-1 max-w-xs mx-auto">
                    To mark songs as demos, click the three dots context menu next to any local or cloud track and select 'Mark as Demo Track'.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {demoTracks.map((track, i) => {
                  const isActive = currentTrack?.id === track.id;
                  return (
                    <div
                      key={track.id}
                      className={`p-3 rounded-2xl flex items-center justify-between border transition-all duration-200 group ${
                        isActive ? 'bg-amber-400/10 border-amber-400/20' : 'bg-[#1c1b1c]/45 hover:bg-white/5 border-white/5'
                      }`}
                    >
                      <div
                        onClick={() => playTrack(track, demoTracks)}
                        className="flex items-center gap-4 cursor-pointer flex-grow min-w-0"
                      >
                        <span className="font-mono text-xs text-white/40 w-6 text-center shrink-0">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 relative">
                          <img alt={track.title} className="w-full h-full object-cover" src={track.coverUrl} />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play size={14} fill="currentColor" className="text-white" />
                          </div>
                        </div>
                        <div className="truncate pr-4">
                          <h4 className={`text-sm font-semibold truncate ${isActive ? 'text-amber-400' : 'text-white'}`}>{track.title}</h4>
                          <p className="text-xs text-white/50 mt-0.5 truncate">{track.artist}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] text-amber-400 font-extrabold uppercase bg-amber-500/15 border border-amber-500/35 px-2 py-0.5 rounded-full tracking-widest">
                          Demo Template
                        </span>
                        <SongActionsMenu track={track} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE PLAYLIST MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-black/90 border border-white/10 p-6 rounded-3xl relative shadow-2xl"
          >
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span>Create Playlist Folder</span>
              <FolderPlus size={18} className="text-[#00f2ff]" />
            </h3>
            
            <form onSubmit={handleCreatePlaylistSubmit} className="mt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Folder Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Synth Wave Chillout"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00f2ff] transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Description (Optional)</label>
                <textarea
                  placeholder="Describe your playlist..."
                  rows={3}
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#00f2ff] transition-all resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl hover:bg-white/5 text-xs text-white font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00f2ff] hover:bg-[#00f2ff]/90 text-[#00363a] text-xs font-black cursor-pointer active:scale-95 transition-all shadow-md shadow-[#00f2ff]/20"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
