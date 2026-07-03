import React, { useState, useRef, useEffect } from 'react';
import { useAudioPlayer } from './AudioPlayerContext';
import { useAuth } from './AuthContext';
import { Track } from '../types';
import {
  MoreVertical,
  Play,
  Heart,
  Plus,
  Trash2,
  Bookmark,
  Check,
  Music,
  FolderHeart,
  Sparkles,
  Download
} from 'lucide-react';

interface SongActionsMenuProps {
  track: Track;
  className?: string;
}

export const SongActionsMenu: React.FC<SongActionsMenuProps> = ({ track, className = '' }) => {
  const { user } = useAuth();
  const {
    toggleFavorite,
    isFavorite,
    playlists,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    playNext,
    addToQueue,
    toggleDemoTrack,
    removeUserTrack,
    currentTrack,
    downloadTrack,
    downloadingTrackId,
    downloadProgress,
    isSubscribed
  } = useAudioPlayer();

  const [isOpen, setIsOpen] = useState(false);
  const [showPlaylistsSubmenu, setShowPlaylistsSubmenu] = useState(false);
  const [align, setAlign] = useState<'left' | 'right'>('right');
  const menuRef = useRef<HTMLDivElement>(null);

  const isLiked = isFavorite(track.id);
  const isDemo = !!track.isDemo;
  const isDownloading = downloadingTrackId === track.id;

  const handleDownload = async (e: React.MouseEvent, format: 'mp3' | 'mp4') => {
    e.stopPropagation();
    if (!user) {
      if (confirm("Downloads are only available to logged-in users. Please log in or sign up first! Would you like to log in now?")) {
        window.dispatchEvent(new CustomEvent('open-auth-modal'));
      }
      setIsOpen(false);
      return;
    }

    if (!isSubscribed) {
      window.dispatchEvent(new CustomEvent('open-upgrade-modal'));
      setIsOpen(false);
      return;
    }

    await downloadTrack(track, format);
    setIsOpen(false);
  };

  // Toggle dropdown visibility with viewport position check to prevent screen overflow
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      // If button is in the left half of the screen, align menu left-0 to prevent left clipping
      if (rect.left < screenWidth / 2) {
        setAlign('left');
      } else {
        setAlign('right');
      }
    }
    setIsOpen(!isOpen);
    setShowPlaylistsSubmenu(false);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowPlaylistsSubmenu(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePlayNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    playNext(track);
    setIsOpen(false);
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(track);
    setIsOpen(false);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(track.id);
    setIsOpen(false);
  };

  const handleToggleDemo = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleDemoTrack(track.id);
    setIsOpen(false);
  };

  const handleDeleteTrack = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const isYtSaved = !!track.isYoutube;
    const confirmMsg = isYtSaved
      ? `Remove "${track.title}" from your Offline & Local catalog?`
      : `Are you sure you want to delete "${track.title}" from your library?`;

    if (window.confirm(confirmMsg)) {
      try {
        await removeUserTrack(track.id);
      } catch (err) {
        console.error('Failed to delete track:', err);
      }
      setIsOpen(false);
    }
  };

  const handlePlaylistClick = (e: React.MouseEvent, playlistId: string, isInPlaylist: boolean) => {
    e.stopPropagation();
    if (isInPlaylist) {
      removeTrackFromPlaylist(playlistId, track.id);
    } else {
      addTrackToPlaylist(playlistId, track.id);
    }
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Three dots Trigger button */}
      <button
        onClick={handleToggle}
        className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 active:scale-90 transition-all shrink-0 cursor-pointer"
        title="Song Actions"
      >
        <MoreVertical size={16} />
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} mt-2 w-56 rounded-2xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl p-1.5 z-50 animate-fade-in select-none`}>
          {!showPlaylistsSubmenu ? (
            <div className="flex flex-col gap-0.5">
              {/* Play Next */}
              <button
                onClick={handlePlayNext}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <Play size={14} className="text-emerald-400" />
                <span>Play Next</span>
              </button>

              {/* Add to Queue */}
              <button
                onClick={handleAddToQueue}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <Plus size={14} className="text-[#00f2ff]" />
                <span>Add to Queue</span>
              </button>

              {/* Toggle Favorite */}
              <button
                onClick={handleToggleFavorite}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <Heart size={14} className={isLiked ? 'fill-pink-500 text-pink-500' : 'text-pink-400'} />
                <span>{isLiked ? 'Liked Song' : 'Like Song'}</span>
              </button>

              {/* Add to Playlist Submenu Trigger */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPlaylistsSubmenu(true);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Bookmark size={14} className="text-purple-400" />
                  <span>Add to Playlist</span>
                </div>
                <span className="text-[10px] opacity-45">▶</span>
              </button>

              {/* Toggle Demo Status */}
              <button
                onClick={handleToggleDemo}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <Sparkles size={14} className={isDemo ? 'text-amber-400 fill-amber-400' : 'text-amber-400'} />
                <span>{isDemo ? 'Remove Demo Badge' : 'Mark as Demo Track'}</span>
              </button>

              {/* YouTube Downloads */}
              {track.isYoutube && !track.isOffline && (
                <>
                  <div className="border-t border-white/5 my-1" />
                  <button
                    disabled={isDownloading}
                    onClick={(e) => handleDownload(e, 'mp3')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Download size={14} className={user ? "text-[#00f2ff]" : "text-gray-500"} />
                    <span>
                      {isDownloading ? `Downloading MP3 (${downloadProgress}%)` : 'Download Offline MP3'}
                    </span>
                  </button>

                  <button
                    disabled={isDownloading}
                    onClick={(e) => handleDownload(e, 'mp4')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Download size={14} className={user ? "text-pink-400" : "text-gray-500"} />
                    <span>
                      {isDownloading ? `Downloading MP4 (${downloadProgress}%)` : 'Download Offline MP4'}
                    </span>
                  </button>
                </>
              )}

              {/* Delete uploaded track fallback */}
              {track.isOffline && (
                <div className="border-t border-white/5 my-1" />
              )}
              {track.isOffline && (
                <button
                  onClick={handleDeleteTrack}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2.5 transition-all cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>{track.isYoutube ? 'Remove Offline Cache' : 'Delete Upload'}</span>
                </button>
              )}
            </div>
          ) : (
            /* Custom Playlists selection Submenu */
            <div className="flex flex-col gap-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPlaylistsSubmenu(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded-xl text-[10px] font-bold text-pink-500 uppercase tracking-widest hover:bg-white/5 flex items-center gap-2.5 transition-all cursor-pointer"
              >
                <span>◀ Back to Menu</span>
              </button>
              <div className="border-b border-white/5 my-1" />

              {playlists.length === 0 ? (
                <div className="px-3 py-3 text-center text-[10px] text-white/40 italic">
                  No Playlists created yet. Create one inside the library tab!
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto scrollbar-thin">
                  {playlists.map((playlist) => {
                    const isInPlaylist = playlist.trackIds.includes(track.id);
                    return (
                      <button
                        key={playlist.id}
                        onClick={(e) => handlePlaylistClick(e, playlist.id, isInPlaylist)}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 flex items-center justify-between transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Music size={12} className="text-[#00f2ff] shrink-0" />
                          <span className="truncate">{playlist.name}</span>
                        </div>
                        {isInPlaylist && <Check size={12} className="text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
