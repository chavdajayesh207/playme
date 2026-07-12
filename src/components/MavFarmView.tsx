import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from './AudioPlayerContext';
import { useAuth } from './AuthContext';
import { Track } from '../types';
import { Search, ShoppingCart, ArrowLeft, Home, Music, List, User, Folder, Mic, MoreVertical, Bell, Download, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Heart, EyeOff, AlignLeft, ScrollText, Clock, Minus, Plus, RotateCcw, Repeat, Share2, Camera, Activity, Zap, Crown, ChevronDown, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LiveStageView } from './LiveStageView';
import { DiscoverView } from './DiscoverView';
import { CollectionsView } from './CollectionsView';
import { LibraryView } from './LibraryView';
import { HomeDashboardView } from './HomeDashboardView';
import { Logo } from './Logo';
import { fetchSyncedLyrics, getActiveLyricIndex, type SyncedLyricLine, type LyricsResult } from '../lib/lyrics';
import { ErrorBoundary } from './ErrorBoundary';
import { SongActionsMenu } from './SongActionsMenu';
import { WordByWordLine } from './WordByWordLine';
import { DownloadModal } from './DownloadModal';

enum TabletTab {
  HOME = 'home',
  LIVE = 'live',
  GENRES = 'genres',
  FAVORITES = 'favorites',
  LIBRARY = 'library'
}

type LyricMode = 'off' | 'line' | 'scroll';

interface MavFarmViewProps {
  onAuthClick: () => void;
  onProfileClick?: () => void;
  onToggleLayout?: () => void;
}

export const MavFarmView: React.FC<MavFarmViewProps> = ({ onAuthClick, onProfileClick, onToggleLayout }) => {
  const { user, logout, isSubscribed, setShowPremiumModal } = useAuth();
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    playTrack,
    allTracks,
    volume,
    setVolume,
    toggleMute,
    isFavorite,
    toggleFavorite,
    setIsHomeTabActive,
    videoOpacity,
    setVideoOpacity,
    isYtFallbackActive,
    lyricsOffset,
    setLyricsOffset,
    showDashboard,
    setShowDashboard,
    isRepeat,
    toggleRepeat,
    isShuffle,
    toggleShuffle,
    queue,
    favoriteIds,
    isAutoplay,
    setIsAutoplay,
    vibeQueue,
    loadingVibeQueue,
    startRadio,
    continueMyMood,
    audioQuality,
    setAudioQuality,
    setPlaceholderRect,
  } = useAudioPlayer();

  const [activeTab, setActiveTab] = useState<TabletTab>(TabletTab.HOME);
  const [searchQuery, setSearchQuery] = useState('');
  const [discoverSubTab, setDiscoverSubTab] = useState<'local' | 'global'>('local');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [lyricMode, setLyricMode] = useState<LyricMode>('off');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSharingStory, setIsSharingStory] = useState(false);

  const [userVideoOpacity, setUserVideoOpacity] = useState<number>(videoOpacity || 0.85);
  const homePlayerScrollRef = React.useRef<HTMLDivElement>(null);
  const dashboardScrollRef = React.useRef<HTMLDivElement>(null);
  const otherTabsScrollRef = React.useRef<HTMLDivElement>(null);
  const lyricsImageRef = React.useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (homePlayerScrollRef.current) {
      homePlayerScrollRef.current.scrollTop = 0;
    }
    if (videoOpacity > 0) {
      setUserVideoOpacity(videoOpacity);
    }
  }, [currentTrack?.id]);

  useEffect(() => {
    const handleNavToPodcast = () => {
      setActiveTab(TabletTab.LIVE);
    };
    window.addEventListener('navigate-to-podcast-host', handleNavToPodcast);
    return () => window.removeEventListener('navigate-to-podcast-host', handleNavToPodcast);
  }, []);

  // Reset scroll position when activeTab or showDashboard changes (navigation)
  useEffect(() => {
    const resetScrolls = () => {
      if (homePlayerScrollRef.current) {
        homePlayerScrollRef.current.scrollTop = 0;
      }
      if (dashboardScrollRef.current) {
        dashboardScrollRef.current.scrollTop = 0;
      }
      if (otherTabsScrollRef.current) {
        otherTabsScrollRef.current.scrollTop = 0;
      }
    };
    resetScrolls();
    const t = setTimeout(resetScrolls, 50); // Double check for async mount
    return () => clearTimeout(t);
  }, [activeTab, showDashboard]);

  // Keep userVideoOpacity updated when videoOpacity changes (only when scrolled to top / above threshold)
  useEffect(() => {
    if (videoOpacity > 0 && homePlayerScrollRef.current && homePlayerScrollRef.current.scrollTop <= 50) {
      setUserVideoOpacity(videoOpacity);
    }
  }, [videoOpacity]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    if (top > 50) {
      if (videoOpacity > 0) {
        setVideoOpacity(0.0);
      }
    } else {
      // Restore video opacity when scrolled up
      if (videoOpacity === 0.0 && userVideoOpacity > 0) {
        setVideoOpacity(userVideoOpacity);
      }
    }
  };

  const [followedArtists, setFollowedArtists] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('playme_followed_artists');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleFollowArtist = (artistName: string) => {
    setFollowedArtists(prev => {
      const next = { ...prev, [artistName]: !prev[artistName] };
      localStorage.setItem('playme_followed_artists', JSON.stringify(next));
      return next;
    });
  };

  const isArtistFollowed = (artistName: string) => !!followedArtists[artistName];

  const [followedCredits, setFollowedCredits] = useState<Record<string, boolean>>({});
  const toggleFollowCredit = (name: string) => {
    setFollowedCredits(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const getMonthlyListeners = (artist: string) => {
    let hash = 0;
    for (let i = 0; i < artist.length; i++) {
      hash = artist.charCodeAt(i) + ((hash << 5) - hash);
    }
    const base = Math.abs(hash % 38) + 3; // 3 to 40 Million
    const thousands = Math.abs((hash >> 4) % 900) + 100;
    const hundreds = Math.abs((hash >> 8) % 900) + 100;
    return `${base},${thousands},${hundreds}`;
  };

  const getArtistBio = (artist: string) => {
    const name = artist.toLowerCase();
    if (name.includes('sachin') || name.includes('jigar')) {
      return 'Sachin-Jigar is a premier Indian music composer duo consisting of Sachin Sanghvi and Jigar Saraiya. They compose primarily for Bollywood and Gujarati cinema, blending acoustic warmth with high-energy electronic beats. With millions of monthly listeners, they continue to shape the soundscape of modern Indian music.';
    }
    if (name.includes('arijit')) {
      return 'Arijit Singh is a legendary Indian playback singer and music composer. Known for his soulful, emotive vocals and unparalleled vocal range, he is widely regarded as one of the most successful and versatile singers in the history of Indian cinema, capturing the hearts of millions across the globe.';
    }
    if (name.includes('charlie') || name.includes('puth')) {
      return 'Charlie Puth is an internationally acclaimed American singer, songwriter, and record producer. Renowned for his perfect pitch and infectious pop melodies, Puth rose to global fame with chart-topping hits like "See You Again" and "Attention", building a reputation as a master pop craftsman.';
    }
    return `${artist} is a highly accomplished recording artist celebrated for their unique sonic texture and storytelling. Blending modern production elements with timeless melodies, they have carved a distinctive space in the music industry, drawing passionate listeners worldwide.`;
  };

  const getCreditsList = (track: any) => {
    const mainArtist = track.artist || 'Unknown';
    let singer = 'Arijit Singh';
    let lyricist = 'Priya Saraiya';

    const name = mainArtist.toLowerCase();
    if (name.includes('sachin') || name.includes('jigar')) {
      singer = 'Arijit Singh';
      lyricist = 'Priya Saraiya';
    } else if (name.includes('charlie') || name.includes('puth')) {
      singer = 'Selena Gomez';
      lyricist = 'Charlie Puth';
    } else {
      singer = 'Local Vocalist';
      lyricist = 'Creative Writer';
    }

    return [
      { name: mainArtist, role: 'Main Artist • Composer • Producer', key: 'main' },
      { name: singer, role: 'Featured Vocalist', key: 'singer' },
      { name: lyricist, role: 'Lyricist • Writer', key: 'lyricist' },
    ];
  };

  const getNextTrackInQueue = () => {
    if (!currentTrack || !queue || queue.length === 0) return null;
    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex !== -1 && currentIndex < queue.length - 1) {
      return queue[currentIndex + 1];
    }
    return queue[0];
  };

  // Auto-switch to dashboard when user logs in
  useEffect(() => {
    if (user) {
      setShowDashboard(true);
    }
  }, [user]);

  // Auto-switch to player view when track starts playing
  useEffect(() => {
    if (currentTrack && isPlaying) {
      setShowDashboard(false);
    }
  }, [currentTrack, isPlaying]);

  const handleTabChange = (tab: TabletTab) => {
    setActiveTab(tab);
    setIsHomeTabActive(tab === TabletTab.HOME);
  };

  useEffect(() => {
    setIsHomeTabActive(activeTab === TabletTab.HOME);
  }, [activeTab, setIsHomeTabActive]);

  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { tab, subtab, query } = customEvent.detail || {};
      if (tab) {
        handleTabChange(tab as TabletTab);
        if (tab !== TabletTab.HOME) {
          setShowDashboard(false);
        }
      }
      if (subtab && tab === TabletTab.GENRES) {
        setDiscoverSubTab(subtab as 'local' | 'cloud');
      }
      if (query !== undefined) {
        setSearchQuery(query);
      }
    };
    window.addEventListener('playme-navigate', handleNavigate);
    return () => window.removeEventListener('playme-navigate', handleNavigate);
  }, []);



  const volumeTrackRef = React.useRef<HTMLDivElement>(null);
  const lyricsScrollRef = React.useRef<HTMLDivElement>(null);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);

  const calculateVolumeFromY = (clientY: number) => {
    if (!volumeTrackRef.current) return;
    const rect = volumeTrackRef.current.getBoundingClientRect();
    const distance = rect.bottom - clientY;
    const newVol = Math.max(0, Math.min(1, distance / rect.height));
    setVolume(newVol);
  };

  const handleVolumeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingVolume(true);
    calculateVolumeFromY(e.clientY);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      calculateVolumeFromY(moveEvent.clientY);
    };

    const handleMouseUp = () => {
      setIsDraggingVolume(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleVolumeTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDraggingVolume(true);
    if (e.touches.length > 0) {
      calculateVolumeFromY(e.touches[0].clientY);
    }

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length > 0) {
        calculateVolumeFromY(moveEvent.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      setIsDraggingVolume(false);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const activeIndex = currentTrack ? allTracks.findIndex((t) => t.id === currentTrack.id) : 0;
  const getCarouselTracks = () => {
    if (allTracks.length === 0) return [];
    const count = 7;
    const half = Math.floor(count / 2);
    const result: { track: Track; indexOffset: number }[] = [];
    const safeActiveIndex = activeIndex >= 0 ? activeIndex : 0;

    for (let i = -half; i <= half; i++) {
      let index = (safeActiveIndex + i) % allTracks.length;
      if (index < 0) index += allTracks.length;
      const track = allTracks[index] || allTracks[0];
      if (track) {
        result.push({ track, indexOffset: i });
      }
    }
    return result;
  };

  const carouselTracks = getCarouselTracks();
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickedPercentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    const seekTarget = (clickedPercentage / 100) * duration;
    seek(seekTarget);
  };

  const handleCopyLink = () => {
    if (!currentTrack) return;
    const shareUrl = `${window.location.origin}?track=${currentTrack.id}`;
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
      setShowMoreMenu(false);
    }, 2000);
  };

  const handleShareStory = async () => {
    if (!currentTrack || isSharingStory) return;
    setIsSharingStory(true);
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const coverImg = new Image();
      coverImg.crossOrigin = 'anonymous';
      coverImg.src = currentTrack.coverUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=1080&h=1920';
      
      await new Promise((resolve, reject) => {
        coverImg.onload = resolve;
        coverImg.onerror = reject;
      });

      // Draw dynamic gradient overlay instead of simple black
      const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      bgGradient.addColorStop(0, 'rgba(10, 10, 20, 0.6)');
      bgGradient.addColorStop(1, 'rgba(20, 0, 30, 0.9)');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Heavy blur and brightness adjustments on the cover image background
      ctx.filter = 'blur(60px) brightness(0.5) saturate(1.5)';
      ctx.drawImage(coverImg, -200, -200, canvas.width + 400, canvas.height + 400);
      ctx.filter = 'none';

      // Draw a subtle noise/texture overlay (simulated by a very faint pattern or just a sleek gradient)
      const sleekGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      sleekGradient.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
      sleekGradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
      ctx.fillStyle = sleekGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Card Dimensions
      const cardWidth = 860;
      const cardHeight = 1100;
      const cardX = (canvas.width - cardWidth) / 2;
      const cardY = (canvas.height - cardHeight) / 2;
      
      // Card Shadow (Premium Glow)
      ctx.shadowColor = 'rgba(0, 242, 255, 0.15)';
      ctx.shadowBlur = 60;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 20;

      // Draw glassmorphic card
      ctx.fillStyle = 'rgba(20, 20, 25, 0.4)';
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 60);
      ctx.fill();
      
      // Card Border (Glass reflection)
      ctx.shadowColor = 'transparent'; // turn off shadow for border
      const borderGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + cardHeight);
      borderGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      borderGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
      borderGradient.addColorStop(1, 'rgba(0, 242, 255, 0.3)');
      ctx.strokeStyle = borderGradient;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Top branding (PLAYME logo) inside card
      ctx.fillStyle = '#00f2ff';
      ctx.font = 'bold 32px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('PLAYME', cardX + 60, cardY + 80);

      // Draw album cover inside card with glowing shadow
      const imgSize = 700;
      const imgX = (canvas.width - imgSize) / 2;
      const imgY = cardY + 140;
      
      // Album cover glow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 20;
      
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(imgX, imgY, imgSize, imgSize, 40);
      ctx.fill(); // fill to create the shadow
      ctx.clip(); // clip for the image
      ctx.drawImage(coverImg, imgX, imgY, imgSize, imgSize);
      ctx.restore();
      
      ctx.shadowColor = 'transparent'; // reset shadow

      // Draw text
      ctx.textAlign = 'center';
      
      // Track Title (Gradient Text)
      const titleGradient = ctx.createLinearGradient(0, imgY + imgSize + 80, 0, imgY + imgSize + 130);
      titleGradient.addColorStop(0, '#ffffff');
      titleGradient.addColorStop(1, '#cccccc');
      ctx.fillStyle = titleGradient;
      ctx.font = 'bold 64px sans-serif';
      let title = currentTrack.title;
      if (title.length > 25) title = title.substring(0, 22) + '...';
      ctx.fillText(title, canvas.width / 2, imgY + imgSize + 110);

      // Artist Name
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '500 42px sans-serif';
      ctx.fillText(currentTrack.artist, canvas.width / 2, imgY + imgSize + 180);

      // Playback Progress Bar (Mock UI)
      const barY = cardY + cardHeight - 120;
      const barX = cardX + 80;
      const barWidth = cardWidth - 160;
      
      // Background track
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barWidth, 8, 4);
      ctx.fill();
      
      // Active track (Cyan gradient)
      const activeBarGradient = ctx.createLinearGradient(barX, 0, barX + (barWidth * 0.4), 0);
      activeBarGradient.addColorStop(0, '#00f2ff');
      activeBarGradient.addColorStop(1, '#e3d4ff');
      ctx.fillStyle = activeBarGradient;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barWidth * 0.4, 8, 4);
      ctx.fill();
      
      // Playhead dot (Glow)
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00f2ff';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(barX + (barWidth * 0.4), barY + 4, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      
      // Time text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '24px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('1:24', barX, barY + 45);
      ctx.textAlign = 'right';
      ctx.fillText('3:45', barX + barWidth, barY + 45);

      // Bottom "Listen on Playme" CTA
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = '600 40px sans-serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;
      ctx.fillText('Tap to listen on Playme', canvas.width / 2, canvas.height - 120);
      ctx.shadowColor = 'transparent';

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (!blob) throw new Error('Failed to create blob');

      const file = new File([blob], 'story-share.jpg', { type: 'image/jpeg' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Listening to ${currentTrack.title}`,
          text: `Check out ${currentTrack.title} by ${currentTrack.artist} on Playme!`,
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `playme-story-${currentTrack.id}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to share story:', err);
      alert('Could not generate story image. Please try again.');
    } finally {
      setIsSharingStory(false);
      setShowMoreMenu(false);
    }
  };

  const isYtActive = currentTrack?.isYoutube && !isYtFallbackActive && activeTab === TabletTab.HOME;
  const isPodcastPlayerActive = currentTrack?.isPodcast && currentTrack?.isYoutube && !showDashboard && activeTab === TabletTab.HOME;

  // ========== LYRICS SYSTEM (LRCLIB + Genius + Local) ==========
  const [lyricsResult, setLyricsResult] = useState<LyricsResult>({ lines: [], source: 'none', isSynced: false });
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [lastFetchedTrackId, setLastFetchedTrackId] = useState('');

  // Fetch lyrics when track changes using the new LRCLIB service
  useEffect(() => {
    if (!currentTrack) return;
    const trackKey = currentTrack.id;
    if (trackKey === lastFetchedTrackId) return;

    setLastFetchedTrackId(trackKey);
    setIsLoadingLyrics(true);
    setLyricsResult({ lines: [], source: 'none', isSynced: false });

    const fetchLyrics = async () => {
      try {
        const dur = duration > 10 ? duration : 180;
        const result = await fetchSyncedLyrics(currentTrack.title, currentTrack.artist, dur, currentTrack.youtubeId);
        setLyricsResult(result);
      } catch (err) {
        console.warn('[Lyrics] Fetch failed:', err);
      } finally {
        setIsLoadingLyrics(false);
      }
    };

    const timer = setTimeout(fetchLyrics, 300);
    return () => clearTimeout(timer);
  }, [currentTrack?.id, currentTrack?.title, currentTrack?.artist]);

  // Re-fetch with correct duration once duration becomes available
  useEffect(() => {
    if (!currentTrack || !duration || duration <= 10) return;
    if (lyricsResult.source === 'none' || (!lyricsResult.isSynced && lyricsResult.lines.length > 0)) {
      // Re-fetch to get better timing with actual duration
      const refetch = async () => {
        try {
          const result = await fetchSyncedLyrics(currentTrack.title, currentTrack.artist, duration, currentTrack.youtubeId);
          if (result.lines.length > 0) setLyricsResult(result);
        } catch (err) { /* silent */ }
      };
      const timer = setTimeout(refetch, 500);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  // Active lyric computation using binary search with dynamic sync micro-offset calibration
  const tracksLyrics = lyricsResult.lines;
  const activeLyricIndex = getActiveLyricIndex(tracksLyrics, currentTime + lyricsOffset);
  const activeLyric = tracksLyrics[activeLyricIndex];
  const nextLyric = tracksLyrics[activeLyricIndex + 1];

  // Automatically exit lyric mode if there are no lyrics available for the current track
  useEffect(() => {
    if (lyricMode !== 'off' && !isLoadingLyrics && tracksLyrics.length === 0) {
      setLyricMode('off');
      if (videoOpacity === 0.12) setVideoOpacity(1.0);
    }
  }, [lyricMode, isLoadingLyrics, tracksLyrics.length, videoOpacity, setVideoOpacity]);

  // Sync YouTube Video into Immersive Lyrics Panel
  useEffect(() => {
    if (lyricMode !== 'off' && isYtActive) {
      const el = lyricsImageRef.current;
      if (!el) return;

      const updateRect = () => {
        if (lyricsImageRef.current) {
          setPlaceholderRect(lyricsImageRef.current.getBoundingClientRect());
        }
      };

      // Ensure rect is updated immediately, on resize, and on scroll
      updateRect();
      const observer = new ResizeObserver(updateRect);
      observer.observe(el);
      window.addEventListener('resize', updateRect);
      window.addEventListener('scroll', updateRect, true);
      
      return () => {
        observer.disconnect();
        window.removeEventListener('resize', updateRect);
        window.removeEventListener('scroll', updateRect, true);
        setPlaceholderRect(null);
      };
    } else {
      setPlaceholderRect(null);
    }
  }, [lyricMode, isYtActive, setPlaceholderRect]);

  // Lyrics source label for badge
  const getLyricsSourceLabel = () => {
    switch (lyricsResult.source) {
      case 'youtube-cc': return '♪ YouTube CC';
      case 'lrclib-synced': return '♪ SYNCED';
      case 'lrclib-plain': return 'PLAIN LYRICS';
      case 'genius': return 'GENIUS';
      case 'local': return 'LOCAL';
      default: return '';
    }
  };

  // Auto-scroll lyrics in scroll mode (Amazon Music-style centering)
  useEffect(() => {
    if (lyricMode !== 'scroll' || !lyricsScrollRef.current) return;
    const activeEl = lyricsScrollRef.current.querySelector('[data-lyric-active="true"]') as HTMLElement;
    if (activeEl) {
      const container = lyricsScrollRef.current;
      const containerHeight = container.clientHeight;
      const lineHeight = activeEl.offsetHeight;
      container.scrollTo({
        top: activeEl.offsetTop - containerHeight / 2 + lineHeight / 2,
        behavior: 'smooth'
      });
    }
  }, [activeLyricIndex, lyricMode]);

  // Adaptive overlay strength based on video opacity
  const getOverlayOpacity = () => {
    if (!isYtActive) return 0.7;
    if (videoOpacity >= 0.9) return 0.65;
    if (videoOpacity >= 0.6) return 0.45;
    if (videoOpacity >= 0.3) return 0.25;
    return 0.1;
  };

  const getLyricGlowClass = () => {
    if (!isYtActive) return 'text-glow';
    return videoOpacity >= 0.6 ? 'text-glow-strong' : 'text-glow';
  };

  return (
    <div 
      id="playme-fullscreen-player"
      className={`${
        isYtActive ? 'bg-transparent' : 'hero-bg-mav'
      } min-h-screen w-full ${isPodcastPlayerActive ? 'pointer-events-none' : 'z-10'} flex flex-col justify-between relative overflow-hidden`}
    >
      {/* Artist Background / Poster Layer */}
      <div 
        className={`absolute inset-0 z-0 select-none pointer-events-none transition-all duration-700 ${
          isYtActive ? 'bg-transparent' : 'bg-[#1a0b0d]'
        }`} 
        id="hero-bg-layer"
      >
        <AnimatePresence mode="wait">
          {!isYtActive && currentTrack && (
            <motion.img
              key={currentTrack.id}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
              style={{ opacity: activeTab === TabletTab.HOME ? 0.85 : 0.25 }}
              src={currentTrack.coverUrl}
              initial={{ opacity: 0 }}
              animate={{ opacity: activeTab === TabletTab.HOME ? 0.85 : 0.25 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </AnimatePresence>
        
        {/* Cinematic Backdrop overlays — adaptive to video poster mode for lyric readability */}
        <div 
          className={`absolute inset-0 transition-opacity duration-700 ${
            isYtActive 
              ? 'bg-gradient-to-t from-black/95 via-black/30 to-black/15' 
              : 'bg-gradient-to-t from-[#1a0b0d]/90 via-[#1a0b0d]/30 to-transparent'
          }`} 
          style={{ opacity: getOverlayOpacity() }}
        />
        {/* Extra left-side gradient for lyrics readability on bright video */}
        {isYtActive && (
          <div 
            className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent transition-opacity duration-700"
            style={{ opacity: videoOpacity >= 0.6 ? 0.8 : 0.3 }}
          />
        )}
      </div>

        {/* Top Header Navigation — Logo left, Search center, Premium right */}
        <nav className={`relative z-[35] flex items-center justify-between px-6 md:px-8 py-4 md:py-5 shrink-0 gap-4 transition-opacity duration-500 ${isPodcastPlayerActive ? 'pointer-events-none' : ''} ${lyricMode !== 'off' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {/* LEFT: PlayMe Logo */}
          <div 
            onClick={() => {
              handleTabChange(TabletTab.HOME);
              setShowDashboard(false);
              setLyricMode('off');
              if (videoOpacity === 0.12) setVideoOpacity(1.0);
            }}
            className={`flex items-center space-x-2 cursor-pointer group shrink-0 ${lyricMode !== 'off' ? 'pointer-events-none' : 'pointer-events-auto'}`}
            title="Playme Player"
          >
            <Logo size={32} theme="dark" animate />
            <ArrowLeft className="w-4 h-4 text-pink-500 group-hover:-translate-x-0.5 transition-transform" />
          </div>

          {/* CENTER: Spotify-style Search Bar */}
          <div className={`flex-1 max-w-lg mx-auto px-2 ${lyricMode !== 'off' ? 'pointer-events-none' : 'pointer-events-auto'}`}>
            <div className="search-bar-spotify flex items-center px-4 py-2.5 w-full">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input 
                className="bg-transparent border-none focus:ring-0 text-sm w-full ml-3 placeholder-gray-500 text-white outline-none font-medium" 
                placeholder="What do you want to play?" 
                type="text"
                value={searchQuery}
                onFocus={() => {
                  if (activeTab !== TabletTab.GENRES) {
                    handleTabChange(TabletTab.GENRES);
                  }
                }}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeTab !== TabletTab.GENRES) {
                    handleTabChange(TabletTab.GENRES);
                  }
                }}
              />
            </div>
          </div>

          {/* RIGHT: Premium button (Removed) */}
          <div className={`flex items-center shrink-0 ${isPodcastPlayerActive ? 'pointer-events-none' : 'pointer-events-auto'}`}>
            <div className="w-10 h-10 pointer-events-none" />
          </div>
        </nav>

        {/* Content Area */}
        <div className="relative z-10 flex-grow flex h-full px-6 md:px-8 items-center overflow-hidden">
          {/* Navigation Bar (Bottom on Mobile, Left Sidebar on Desktop) */}
          <aside className={`fixed bottom-2 md:bottom-auto left-1/2 md:left-8 md:top-1/2 -translate-x-1/2 md:-translate-x-0 md:-translate-y-1/2 flex flex-row md:flex-col justify-center z-[100] pointer-events-auto transition-opacity duration-500 w-[95%] md:w-auto ${lyricMode !== 'off' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="hidden md:flex mb-4">
              <button 
                onClick={() => {
                  handleTabChange(TabletTab.HOME);
                  setShowDashboard(false); // Force show player view
                }}
                className={`glass-mav w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all hover:scale-105 cursor-pointer text-white ${
                  activeTab === TabletTab.HOME && !showDashboard ? 'ring-1 ring-pink-500 bg-pink-500/20' : ''
                }`}
                title="Go to Home Player"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
            <div className="glass-dark-mav w-full md:w-14 rounded-[2rem] md:rounded-3xl py-3 px-4 md:px-0 md:py-6 flex flex-row md:flex-col items-center justify-around md:justify-center space-x-2 md:space-x-0 md:space-y-6 sidebar-nav-scroll shadow-2xl backdrop-blur-xl border border-white/10" id="sidebar-nav">
              <button 
                onClick={() => {
                  if (activeTab === TabletTab.HOME && showDashboard) {
                    if (dashboardScrollRef.current) {
                      dashboardScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  } else {
                    handleTabChange(TabletTab.HOME);
                    setShowDashboard(true); // Force show dashboard view
                  }
                }}
                className={`p-3 md:p-2 rounded-2xl transition-all cursor-pointer shrink-0 ${activeTab === TabletTab.HOME && showDashboard ? 'text-white bg-white/15' : 'text-gray-400 hover:text-pink-400'}`}
                title="Home Dashboard"
              >
                <Home className="w-6 h-6 md:w-5 md:h-5" />
              </button>
              <button 
                onClick={() => {
                  if (activeTab === TabletTab.GENRES) {
                    if (otherTabsScrollRef.current) {
                      otherTabsScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  } else {
                    handleTabChange(TabletTab.GENRES);
                  }
                }}
                className={`p-3 md:p-2 rounded-2xl transition-all cursor-pointer shrink-0 ${activeTab === TabletTab.GENRES ? 'text-white bg-white/15' : 'text-gray-400 hover:text-pink-400'}`}
                title="Discover & Search"
              >
                <Search className="w-6 h-6 md:w-5 md:h-5" />
              </button>
              <button 
                onClick={() => {
                  if (activeTab === TabletTab.LIVE) {
                    if (otherTabsScrollRef.current) {
                      otherTabsScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  } else {
                    handleTabChange(TabletTab.LIVE);
                  }
                }}
                className={`p-3 md:p-2 rounded-2xl transition-all cursor-pointer shrink-0 ${activeTab === TabletTab.LIVE ? 'text-white bg-white/15' : 'text-gray-400 hover:text-pink-400'}`}
                title="Live Music"
              >
                <Music className="w-6 h-6 md:w-5 md:h-5" />
              </button>
              <button 
                onClick={() => {
                  if (activeTab === TabletTab.FAVORITES) {
                    if (otherTabsScrollRef.current) {
                      otherTabsScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  } else {
                    handleTabChange(TabletTab.FAVORITES);
                  }
                }}
                className={`p-3 md:p-2 rounded-2xl transition-all cursor-pointer shrink-0 ${activeTab === TabletTab.FAVORITES ? 'text-white bg-white/15' : 'text-gray-400 hover:text-pink-400'}`}
                title="Library"
              >
                <Folder className="w-6 h-6 md:w-5 md:h-5" />
              </button>
              <button 
                onClick={() => {
                  if (activeTab === TabletTab.LIBRARY) {
                    if (otherTabsScrollRef.current) {
                      otherTabsScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  } else {
                    handleTabChange(TabletTab.LIBRARY);
                  }
                }}
                className={`p-3 md:p-2 rounded-2xl transition-all cursor-pointer shrink-0 ${activeTab === TabletTab.LIBRARY ? 'text-white bg-white/15' : 'text-gray-400 hover:text-pink-400'}`}
                title="Upload & Manage"
              >
                <List className="w-6 h-6 md:w-5 md:h-5" />
              </button>
            </div>
          </aside>

          <div className="flex-1 flex flex-col h-full ml-0 md:ml-28 lg:ml-32 mr-0 md:mr-12 lg:mr-32 justify-between min-w-0 pr-1 select-none overflow-hidden relative pb-[80px] md:pb-0">
            <AnimatePresence mode="wait">
              {activeTab === TabletTab.HOME ? (
                showDashboard ? (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                    className="flex-grow h-full w-full relative z-30"
                  >
                    <div ref={dashboardScrollRef} className="flex-grow overflow-y-auto pr-2 pb-4 h-full scrollbar-thin scrollbar-thumb-white/10 custom-scroll w-full relative">
                  <style>{`
                    .custom-scroll::-webkit-scrollbar {
                      width: 6px;
                    }
                    .custom-scroll::-webkit-scrollbar-track {
                      background: transparent;
                    }
                    .custom-scroll::-webkit-scrollbar-thumb {
                      background: rgba(255, 255, 255, 0.15);
                      border-radius: 9999px;
                    }
                    .custom-scroll::-webkit-scrollbar-thumb:hover {
                      background: rgba(255, 255, 255, 0.3);
                    }
                  `}</style>
                  <ErrorBoundary inline>
                    <HomeDashboardView onBrowseAll={() => handleTabChange(TabletTab.GENRES)} />
                  </ErrorBoundary>
                </div>
              </motion.div>
              ) : isPodcastPlayerActive ? (
                <motion.div
                  key="podcast"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-grow flex flex-col justify-between h-full pb-4 select-none relative w-full pointer-events-none"
                />
              ) : (
                <motion.div
                  key="player"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                  className="flex-grow h-full w-full relative z-30"
                >
                  <div 
                    ref={homePlayerScrollRef}
                    onScroll={handleScroll}
                    id="home-player-scroll-container"
                    className={`flex-grow h-full pr-1.5 custom-scroll scroll-smooth w-full relative ${
                      lyricMode === 'off' ? 'overflow-y-auto pb-24' : 'overflow-hidden pb-4'
                    }`}
                    onClick={(e) => {
                      if (lyricMode !== 'off') return;
                      const target = e.target as HTMLElement;
                      // Ignore clicks on functional buttons or interactive areas
                      if (target.closest('button, a, input, [role="button"], .playback-bar, #artist-carousel, .song-actions-menu, .lyric-mode-pill')) return;
                      
                      // Do nothing if no lyrics are available
                      if (!isLoadingLyrics && tracksLyrics.length === 0) return;
                      
                      setLyricMode('scroll');
                      if (currentTrack?.isYoutube) {
                        setVideoOpacity(0.12);
                      }
                    }}
                  >
                  <style>{`
                    #home-player-scroll-container::-webkit-scrollbar {
                      width: 6px;
                    }
                    #home-player-scroll-container::-webkit-scrollbar-track {
                      background: transparent;
                    }
                    #home-player-scroll-container::-webkit-scrollbar-thumb {
                      background: rgba(255, 255, 255, 0.15);
                      border-radius: 9999px;
                    }
                    #home-player-scroll-container::-webkit-scrollbar-thumb:hover {
                      background: rgba(255, 255, 255, 0.3);
                    }
                  `}</style>

                  {/* FIRST FOLD: The player UI itself */}
                  <div className={`h-[calc(100vh-140px)] min-h-[calc(100vh-140px)] max-h-[calc(100vh-140px)] flex flex-col justify-between w-full pb-8 ${
                    lyricMode === 'off' ? 'pt-12 md:pt-16' : 'pt-2.5 md:pt-4'
                  }`}>
                    {/* Left Controller Panel occupies full width space */}
                    <div className={`flex flex-col h-full w-full transition-all duration-300 flex-grow min-h-0 pb-4 ${lyricMode === 'off' ? 'justify-end' : 'justify-start'}`}>
                      {/* Tagline */}
                      <div className={`flex flex-col h-full min-h-0 ${lyricMode === 'off' ? 'mt-10 md:mt-16 justify-end' : 'mt-2 md:mt-3 flex-grow'}`}>
                        {!isYtActive && (
                          <span className="uppercase tracking-widest text-[9px] font-bold text-pink-500 mb-1 block animate-pulse">
                            Hot Music • Playme Live
                          </span>
                        )}
                        {currentTrack && (
                          <div className={`flex flex-col space-y-3 flex-grow min-h-0 ${lyricMode === 'off' ? 'w-full max-w-none justify-end' : 'w-full max-w-none h-full justify-start'}`}>
                            {lyricMode === 'off' && !isYtActive && (
                              <div className="w-full flex justify-center py-6 md:py-10 animate-floating shrink-0">
                                <div className="relative group select-none">
                                  {/* Soft ambient glow behind cover */}
                                  <div 
                                    className="absolute -inset-1.5 rounded-[24px] bg-gradient-to-r from-pink-500/30 to-purple-600/30 blur-xl opacity-75 group-hover:opacity-100 transition-opacity duration-500"
                                  />
                                  <img
                                    src={currentTrack.coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60'}
                                    alt={currentTrack.title}
                                    className="w-48 h-48 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 object-cover rounded-[24px] border border-white/10 shadow-[0_24px_50px_rgba(0,0,0,0.6)] relative z-10 select-none pointer-events-none"
                                  />
                                </div>
                              </div>
                            )}

                            {/* ===== IMMERSIVE LYRICS — Amazon Music Style Full Screen Overlay ===== */}
                            {lyricMode !== 'off' && (isLoadingLyrics || tracksLyrics.length > 0) && (
                              <div className="fixed inset-0 z-[35] bg-black overflow-hidden flex flex-col animate-fade-in"
                                onClick={(e) => {
                                  const target = e.target as HTMLElement;
                                  
                                  // Ignore clicks on functional buttons or interactive areas
                                  if (target.closest('button, a, input, [role="button"], .playback-bar, .lyric-immersive-line, .lyric-immersive-next, .song-actions-menu, .lyric-mode-pill, .lyric-sync-controller')) return;
                                  
                                  // Ignore if clicking the scrollbar of the lyrics container
                                  if (target.classList.contains('lyrics-immersive-scroll') && e.clientX >= target.getBoundingClientRect().right - 20) {
                                    return;
                                  }

                                  setLyricMode('off');
                                  if (videoOpacity === 0.12) setVideoOpacity(1.0);
                                }}
                              >
                                {/* Amazon Music style blurred background */}
                                <div 
                                  className="absolute inset-0 bg-cover bg-center"
                                  style={{ 
                                    backgroundImage: `url(${currentTrack.coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60'})`,
                                    transform: 'scale(1.15)',
                                    filter: 'blur(48px) brightness(0.75) saturate(1.15)'
                                  }}
                                />
                                {/* Amazon Music style darkening overlay gradient (darker on right for lyrics) */}
                                <div 
                                  className="absolute inset-0"
                                  style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.20), rgba(0,0,0,0.55))' }} 
                                />

                                {/* Top Bar: Close Button (Chevron Down) */}
                                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
                                  <button onClick={() => {
                                      setLyricMode('off');
                                      if (videoOpacity === 0.12) setVideoOpacity(1.0);
                                    }} 
                                    className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all backdrop-blur-md cursor-pointer"
                                  >
                                    <ChevronDown size={28} />
                                  </button>
                                </div>

                                {/* Two-panel layout */}
                                <div className="relative z-10 flex flex-col md:flex-row h-full w-full pt-20 px-8 md:px-16 pb-[160px] gap-8 md:gap-16">
                                  
                                  {/* Left Panel — Album Art ONLY (Amazon Music style) */}
                                  <div className="flex flex-col items-center md:items-start justify-center shrink-0 md:w-[45%] h-full max-h-[80vh]">
                                    <img
                                      ref={lyricsImageRef}
                                      src={currentTrack.coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60'}
                                      alt={currentTrack.title}
                                      className={`immersive-album-cover w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[460px] lg:h-[460px] object-cover select-none pointer-events-none shadow-2xl rounded-[32px] transition-opacity duration-500 ${isYtActive ? 'opacity-0' : 'opacity-100'}`}
                                    />
                                  </div>

                                  {/* Right Panel — Lyrics */}
                                  <div className="flex-grow flex flex-col justify-center overflow-hidden h-full md:w-[55%] pb-8 rounded-[32px] backdrop-blur-[12px]">
                                    
                                    {/* SCROLL MODE — Full immersive lyrics */}
                                    {lyricMode === 'scroll' && (
                                      <div 
                                        ref={lyricsScrollRef} 
                                        className="lyrics-immersive-scroll flex flex-col gap-2 px-2 md:px-8 h-full w-full"
                                      >
                                        <div className="h-[30vh] shrink-0" /> {/* Top padding so active line is centered */}
                                        {tracksLyrics.map((line, idx) => {
                                          const isActive = idx === activeLyricIndex;
                                          const isPast = idx < activeLyricIndex;
                                          return (
                                            <p
                                              key={idx}
                                              data-lyric-active={isActive ? 'true' : 'false'}
                                              onClick={() => seek(line.time)}
                                              className={`lyric-immersive-line ${
                                                isActive
                                                  ? 'is-active lyric-immersive-active-anim'
                                                  : isPast
                                                    ? 'is-past'
                                                    : 'is-future'
                                              }`}
                                            >
                                              {line.text}
                                            </p>
                                          );
                                        })}
                                        <div className="h-[40vh] shrink-0" /> {/* Bottom padding */}
                                      </div>
                                    )}

                                    {/* LINE MODE — Single active + next preview */}
                                    {lyricMode === 'line' && (
                                      <div className="flex flex-col gap-6 justify-center px-4 md:px-8 h-full">
                                        <p key={activeLyricIndex} className="lyric-immersive-single lyric-immersive-active-anim select-none">
                                          {activeLyric ? (
                                            <WordByWordLine
                                              text={activeLyric.text}
                                              startTime={activeLyric.time}
                                              endTime={nextLyric ? nextLyric.time : duration}
                                              currentTime={currentTime + lyricsOffset}
                                              glowClass=""
                                              activeColorClass="text-white"
                                              inactiveColorClass="text-white/30"
                                            />
                                          ) : (
                                            isLoadingLyrics ? "✨ Loading lyrics..." : ""
                                          )}
                                        </p>
                                        {nextLyric && (
                                          <p className="lyric-immersive-next select-none truncate">
                                            {nextLyric.text}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Amazon Music Style Bottom Playback Bar */}
                                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col gap-4 bg-gradient-to-t from-black via-black/80 to-transparent z-50 pointer-events-auto">
                                  {/* Top Row: Info + Actions */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex flex-col max-w-[50%] md:max-w-[40%] lg:max-w-[30%]">
                                      <h3 className="text-xl md:text-2xl lg:text-3xl font-black text-white leading-tight truncate capitalize drop-shadow-md">
                                        {currentTrack.title || 'Unknown'}
                                      </h3>
                                      <p className="text-sm md:text-base lg:text-lg font-bold text-white/70 truncate drop-shadow-md">
                                        {currentTrack.artist || 'Unknown Artist'}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-3 md:gap-4">
                                      <SongActionsMenu track={currentTrack} direction="up" />

                                      {/* Lyric Mode Toggles */}
                                      <div className="flex bg-black/50 border border-white/10 rounded-full p-1 select-none shrink-0 backdrop-blur-xl shadow-2xl">
                                        <button onClick={() => { setLyricMode('off'); if (videoOpacity === 0.12) setVideoOpacity(1.0); }} className={`p-1.5 md:p-2 rounded-full transition-all cursor-pointer ${lyricMode === 'off' ? 'bg-white/20 text-white shadow-sm' : 'text-white/50 hover:text-white/80'}`} title="Lyrics Off"><EyeOff size={16} /></button>
                                        <button onClick={() => setLyricMode('line')} className={`p-1.5 md:p-2 rounded-full transition-all cursor-pointer ${lyricMode === 'line' ? 'bg-[#00f2ff]/20 text-[#00f2ff] shadow-sm' : 'text-white/50 hover:text-white/80'}`} title="Line-by-Line Lyrics"><AlignLeft size={16} /></button>
                                        <button onClick={() => setLyricMode('scroll')} className={`p-1.5 md:p-2 rounded-full transition-all cursor-pointer ${lyricMode === 'scroll' ? 'bg-[#00f2ff]/20 text-[#00f2ff] shadow-sm' : 'text-white/50 hover:text-white/80'}`} title="Full Scrolling Lyrics"><ScrollText size={16} /></button>
                                      </div>

                                      {/* Sync Offset */}
                                      <div className="lyric-sync-controller hidden md:flex items-center gap-1 bg-black/50 border border-white/10 rounded-full p-1 select-none shrink-0 text-white/50 backdrop-blur-xl shadow-2xl">
                                        <button onClick={() => setLyricsOffset(lyricsOffset - 0.5)} className="p-1.5 hover:bg-white/10 rounded-full transition-all cursor-pointer" title="Delay lyrics (-0.5s)"><Minus size={14} /></button>
                                        <span className="font-mono font-bold text-[#00f2ff] px-1 select-none min-w-[36px] text-center text-xs">{lyricsOffset === 0 ? 'SYNC' : `${lyricsOffset > 0 ? '+' : ''}${lyricsOffset.toFixed(1)}s`}</span>
                                        <button onClick={() => setLyricsOffset(lyricsOffset + 0.5)} className="p-1.5 hover:bg-white/10 rounded-full transition-all cursor-pointer" title="Speed up lyrics (+0.5s)"><Plus size={14} /></button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Progress Bar */}
                                  <div className="w-full flex items-center gap-3">
                                    <span className="text-[10px] md:text-xs text-white/50 font-medium w-8 md:w-10 text-right font-mono tracking-wider">
                                      {formatTime(currentTime)}
                                    </span>
                                    <div 
                                      className="flex-grow h-1.5 md:h-2 bg-white/20 rounded-full cursor-pointer relative overflow-hidden group"
                                      onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const pos = (e.clientX - rect.left) / rect.width;
                                        seek(pos * duration);
                                      }}
                                    >
                                      <div 
                                        className="absolute top-0 left-0 h-full bg-white rounded-full group-hover:bg-[#00f2ff] transition-colors"
                                        style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] md:text-xs text-white/50 font-medium w-8 md:w-10 text-left font-mono tracking-wider">
                                      -{formatTime(duration - currentTime)}
                                    </span>
                                  </div>

                                  {/* Playback Controls Row */}
                                  <div className="flex items-center justify-between px-2 md:px-8 mt-1">
                                    <div className="flex items-center gap-4">
                                      <button onClick={toggleShuffle} className={`p-2 rounded-full cursor-pointer ${isShuffle ? 'text-[#00f2ff]' : 'text-white/50 hover:text-white'}`}>
                                        <Shuffle size={20} />
                                      </button>
                                      <button onClick={prevTrack} className="p-2 text-white/70 hover:text-white cursor-pointer active:scale-95 transition-transform">
                                        <SkipBack size={24} />
                                      </button>
                                    </div>
                                    
                                    <button 
                                      onClick={togglePlay}
                                      className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-white rounded-full hover:scale-105 active:scale-95 transition-transform text-black cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                                    >
                                      {isPlaying ? <Pause size={28} className="fill-black" /> : <Play size={28} className="fill-black ml-1.5" />}
                                    </button>

                                    <div className="flex items-center gap-4">
                                      <button onClick={nextTrack} className="p-2 text-white/70 hover:text-white cursor-pointer active:scale-95 transition-transform">
                                        <SkipForward size={24} />
                                      </button>
                                      <button onClick={toggleRepeat} className={`p-2 rounded-full cursor-pointer ${isRepeat ? 'text-[#00f2ff]' : 'text-white/50 hover:text-white'}`}>
                                        <Repeat size={20} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Normal Dashboard Song Title + Artist (Only shown when lyrics are off) */}
                            {lyricMode === 'off' && (
                              <div className="flex flex-col space-y-1 text-left min-w-0 shrink-0 mt-4 pb-2 animate-fade-in">
                                <p className={`text-[10px] font-mono uppercase tracking-widest text-pink-500 animate-pulse ${isYtActive ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]' : ''}`}>Now Playing</p>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <h2 className={`text-base md:text-lg font-extrabold text-white select-none capitalize tracking-tight leading-tight truncate ${isYtActive ? 'drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]' : ''}`}>
                                    {(currentTrack.title || '').toUpperCase()}
                                    <span className="text-white/40 font-normal lowercase italic px-1.5">by</span>
                                    <span className={`text-[#00f2ff] ${isYtActive ? 'drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] text-shadow-sm' : 'drop-shadow-[0_0_8px_rgba(0,242,255,0.3)]'}`}>{currentTrack.artist || 'Unknown'}</span>
                                  </h2>
                                  <SongActionsMenu track={currentTrack} />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Background Video Mode Selector for YouTube media */}
                        {currentTrack?.isYoutube && !isYtFallbackActive && (
                          <div className="mt-3 flex items-center gap-2 text-[9px] uppercase font-bold tracking-widest text-[#00f2ff]/80 animate-fade-in flex-wrap shrink-0">
                            <div className="flex flex-wrap bg-black/60 border border-white/10 rounded-2xl p-0.5 gap-0.5 max-w-full">
                              <button
                                onClick={() => setVideoOpacity(1.0)}
                                className={`px-2.5 py-0.5 rounded-full transition-all text-[8.5px] font-bold cursor-pointer ${videoOpacity === 1.0 ? 'bg-[#00f2ff] text-black shadow-md shadow-[#00f2ff]/20' : 'text-white/60 hover:text-white'}`}
                                title="Play YouTube video in its absolute full, vibrant physical presentation"
                              >
                                FULL (100%)
                              </button>
                              <button
                                onClick={() => setVideoOpacity(0.8)}
                                className={`px-2.5 py-0.5 rounded-full transition-all text-[8.5px] font-bold cursor-pointer ${videoOpacity === 0.8 ? 'bg-[#00f2ff] text-black shadow-md shadow-[#00f2ff]/20' : 'text-white/60 hover:text-white'}`}
                                title="Rich vibrant video with slightly softened contrast overlays"
                              >
                                VIVID (80%)
                              </button>
                              <button
                                onClick={() => setVideoOpacity(0.4)}
                                className={`px-2.5 py-0.5 rounded-full transition-all text-[8.5px] font-bold cursor-pointer ${videoOpacity === 0.4 ? 'bg-[#00f2ff] text-black shadow-md shadow-[#00f2ff]/20' : 'text-white/60 hover:text-white'}`}
                                title="Softer ambient visualization"
                              >
                                AMBIENT (40%)
                              </button>
                              <button
                                onClick={() => setVideoOpacity(0.12)}
                                className={`px-2.5 py-0.5 rounded-full transition-all text-[8.5px] font-bold cursor-pointer ${videoOpacity === 0.12 ? 'bg-[#00f2ff] text-black shadow-md shadow-[#00f2ff]/20' : 'text-white/60 hover:text-white'}`}
                                title="Dim backdrop accent"
                              >
                                DIM (12%)
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Responsive Player Controls near hero */}
                        <div className="mt-4 md:mt-8 flex items-center space-x-4 md:space-x-6">
                          <div className="flex items-center space-x-3 md:space-x-4">
                            <button 
                              onClick={prevTrack}
                              className={`hover:scale-110 active:scale-95 transition-all cursor-pointer ${isYtActive ? 'text-white/80 hover:text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]' : 'text-white/60 hover:text-white'}`}
                            >
                              <SkipBack className="w-5 h-5 fill-current" />
                            </button>
                            <button 
                              onClick={togglePlay}
                              id="mavfarm-play-btn"
                              className="w-12 h-12 md:w-14 h-14 bg-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/40 hover:scale-105 active:scale-95 transition-all text-white cursor-pointer"
                            >
                              {isPlaying ? (
                                <Pause className="w-5 h-5 fill-current" />
                              ) : (
                                <Play className="w-5 h-5 fill-current ml-1" />
                              )}
                            </button>
                            <button 
                              onClick={nextTrack}
                              className={`hover:scale-110 active:scale-95 transition-all cursor-pointer ${isYtActive ? 'text-white/80 hover:text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]' : 'text-white/60 hover:text-white'}`}
                            >
                              <SkipForward className="w-5 h-5 fill-current" />
                            </button>

                            {/* Favorite button on Home view */}
                            {currentTrack && (
                              <button 
                                onClick={() => toggleFavorite(currentTrack.id)}
                                className="ml-2 p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 hover:scale-110 transition-all cursor-pointer flex items-center justify-center"
                                title={isFavorite(currentTrack.id) ? 'Remove bookmark' : 'Bookmark to My Saved list'}
                              >
                                <Heart 
                                  className={`w-4 h-4 ${
                                    isFavorite(currentTrack.id) 
                                      ? 'text-pink-500 fill-pink-500 scale-110 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]' 
                                      : 'text-white/60 hover:text-white'
                                  }`} 
                                />
                              </button>
                            )}

                            {/* Repeat button on Home view */}
                            {currentTrack && (
                              <button 
                                onClick={toggleRepeat}
                                className="ml-2 p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 hover:scale-110 transition-all cursor-pointer flex items-center justify-center"
                                title={isRepeat ? 'Disable Repeat' : 'Enable Repeat (Play again and again)'}
                              >
                                <Repeat 
                                  className={`w-4 h-4 transition-all ${
                                    isRepeat 
                                      ? 'text-pink-500 scale-110 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]' 
                                      : 'text-white/60 hover:text-white'
                                  }`} 
                                />
                              </button>
                            )}
                          </div>

                          {/* Progress bar info */}
                          <div className="flex-grow max-w-sm space-y-1.5 md:space-y-2">
                            <div className="flex justify-between text-[9px] text-white/50 font-bold uppercase tracking-widest font-mono">
                              <span>{formatTime(currentTime)}</span>
                              <span>{formatTime(duration)}</span>
                            </div>
                            <div 
                              onClick={handleProgressClick}
                              className="playback-bar bg-white/20 h-1.5 rounded-full cursor-pointer relative group"
                            >
                              <div 
                                className="playback-progress bg-pink-500 h-full rounded-full transition-all duration-100 relative"
                                style={{ width: `${progressPercent}%` }}
                              >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full scale-0 group-hover:scale-100 transition-all shadow-md" />
                              </div>
                            </div>
                          </div>
                          
                          {/* Moved Lyric Controls to bottom right */}
                          <div className="flex items-center gap-1.5 md:gap-2 ml-auto">
                            {/* Instagram-style Lyric Mode Toggle Pill */}
                            <div className="lyric-mode-pill flex bg-black/50 backdrop-blur-xl border border-white/10 rounded-full p-1 select-none shrink-0 shadow-2xl">
                              <button
                                onClick={() => {
                                  setLyricMode('off');
                                  if (videoOpacity === 0.12) setVideoOpacity(1.0); // Revert to full 100% if it was explicitly dimmed for lyrics
                                }}
                                className={`p-1.5 rounded-full transition-all cursor-pointer ${lyricMode === 'off' ? 'bg-white/20 text-white shadow-sm' : 'text-white/50 hover:text-white/80'}`}
                                title="Lyrics Off"
                              >
                                <EyeOff size={11} />
                              </button>
                              <button
                                onClick={() => {
                                  if (!isLoadingLyrics && tracksLyrics.length === 0) return;
                                  setLyricMode('line');
                                  setVideoOpacity(0.12);
                                }}
                                className={`p-1.5 rounded-full transition-all ${lyricMode === 'line' ? 'bg-[#00f2ff]/20 text-[#00f2ff] shadow-sm' : 'text-white/50 hover:text-white/80'} ${!isLoadingLyrics && tracksLyrics.length === 0 ? 'opacity-30 cursor-not-allowed hover:text-white/40' : 'cursor-pointer'}`}
                                title={!isLoadingLyrics && tracksLyrics.length === 0 ? "No lyrics available" : "Line-by-Line Lyrics"}
                              >
                                <AlignLeft size={11} />
                              </button>
                              <button
                                onClick={() => {
                                  if (!isLoadingLyrics && tracksLyrics.length === 0) return;
                                  setLyricMode('scroll');
                                  setVideoOpacity(0.12);
                                }}
                                className={`p-1.5 rounded-full transition-all ${lyricMode === 'scroll' ? 'bg-[#00f2ff]/20 text-[#00f2ff] shadow-sm' : 'text-white/50 hover:text-white/80'} ${!isLoadingLyrics && tracksLyrics.length === 0 ? 'opacity-30 cursor-not-allowed hover:text-white/40' : 'cursor-pointer'}`}
                                title={!isLoadingLyrics && tracksLyrics.length === 0 ? "No lyrics available" : "Full Scrolling Lyrics"}
                              >
                                <ScrollText size={11} />
                              </button>
                            </div>

                            {/* Sync Offset Calibration Adjustment Controller */}
                            <div className="flex items-center gap-1 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full p-1 select-none shrink-0 text-white/50 shadow-2xl">
                              <button
                                onClick={() => setLyricsOffset(lyricsOffset - 0.5)}
                                className="p-1 hover:bg-white/10 rounded-full transition-all cursor-pointer flex items-center justify-center"
                                title="Delay lyrics (-0.5s)"
                              >
                                <Minus size={10} />
                              </button>
                              <span className="font-mono font-bold text-[#00f2ff] px-1.5 select-none min-w-[34px] text-center text-[9px]">
                                {lyricsOffset === 0 ? 'SYNC' : `${lyricsOffset > 0 ? '+' : ''}${lyricsOffset.toFixed(1)}s`}
                              </span>
                              <button
                                onClick={() => setLyricsOffset(lyricsOffset + 0.5)}
                                className="p-1 hover:bg-white/10 rounded-full transition-all cursor-pointer flex items-center justify-center"
                                title="Speed up lyrics (+0.5s)"
                              >
                                <Plus size={10} />
                              </button>
                              {lyricsOffset !== 0 && (
                                <button
                                  onClick={() => setLyricsOffset(0)}
                                  className="p-1 hover:bg-white/10 rounded-full transition-all cursor-pointer text-white/70"
                                  title="Reset Sync"
                                >
                                  <RotateCcw size={10} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Circular Tracks Carousel Slider */}
                    <div className="relative flex items-center justify-center space-x-2 md:space-x-4 pb-8 md:pb-12 mt-4 overflow-visible" id="artist-carousel">
                      {carouselTracks.map(({ track, indexOffset }, idx) => {
                        const isActive = indexOffset === 0;

                        let wrapperClass = "p-0 bg-transparent rounded-full";
                        let imgClass = "w-14 h-14 opacity-30 hover:opacity-100 border border-white/10";
                        let containerClass = "z-0";

                        if (isActive) {
                          wrapperClass = "p-1.5 md:p-2 bg-white/20 backdrop-blur-xl border border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.2)] rounded-full";
                          imgClass = "w-24 h-24 md:w-28 md:h-28 opacity-100 shadow-inner";
                          containerClass = "z-30 scale-110 mx-2 md:mx-4";
                        } else if (Math.abs(indexOffset) === 1) {
                          wrapperClass = "p-0.5 bg-white/5 backdrop-blur-sm rounded-full border border-white/20 shadow-lg";
                          imgClass = "w-16 h-16 md:w-20 md:h-20 opacity-70 hover:opacity-90";
                          containerClass = "z-20";
                        } else if (Math.abs(indexOffset) === 2) {
                          wrapperClass = "p-0 rounded-full";
                          imgClass = "w-14 h-14 md:w-16 md:h-16 opacity-40 hover:opacity-70 border border-white/10";
                          containerClass = "z-10";
                        } else {
                          wrapperClass = "p-0 rounded-full";
                          imgClass = "w-10 h-10 md:w-12 md:h-12 opacity-20 hover:opacity-50 border border-white/5";
                          containerClass = "z-0 hidden sm:flex"; // hide furthest on small screens
                        }

                        return (
                          <div
                            key={track.id + '-' + idx}
                            onClick={() => playTrack(track, allTracks)}
                            className={`cursor-pointer transition-all duration-700 ease-out flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 group ${containerClass}`}
                            title={track.title}
                          >
                            <div className={`${wrapperClass} transition-all duration-700 ease-out`}>
                              <div className={`relative rounded-full overflow-hidden ${imgClass} transition-all duration-700 ease-out`}>
                                <img 
                                  alt={track.title} 
                                  className="w-full h-full object-cover select-none pointer-events-none" 
                                  src={track.coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60'} 
                                />
                                
                                {/* Hover playing mask overlays */}
                                {isActive && (
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-all">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        togglePlay();
                                      }}
                                      className="w-10 h-10 md:w-12 md:h-12 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/60 transition-all text-white cursor-pointer shadow-lg"
                                    >
                                      {isPlaying ? (
                                        <Pause className="w-5 h-5 fill-current drop-shadow-md" />
                                      ) : (
                                        <Play className="w-5 h-5 fill-current ml-0.5 drop-shadow-md" />
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SECOND FOLD: Spotify-like details (Related tracks, Artist bio, Credits, Next Queue) */}
                  {lyricMode === 'off' && currentTrack && (
                    <div className="mt-4 pb-16 w-full text-left">
                      <div className="border-t border-white/10 my-8 w-full" />

                      {/* ── QUICK-ACCESS DOCK above Related Tracks ── */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/10 rounded-full p-1 shadow-lg select-none">
                          <button
                            onClick={() => {
                              if (homePlayerScrollRef.current) {
                                homePlayerScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                              }
                            }}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.12em] bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 transition-all duration-300 cursor-pointer active:scale-95 animate-fade-in"
                            title="Back to Player"
                            id="back-to-home-btn"
                          >
                            <Home className="w-3.5 h-3.5 text-pink-400" />
                            <span>Home</span>
                          </button>
                          <div className="w-px h-3 bg-white/10" />
                          <button
                            onClick={() => {
                              setDiscoverSubTab('local');
                              handleTabChange(TabletTab.GENRES);
                            }}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.12em] text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300 cursor-pointer active:scale-95"
                            title="See all tracks"
                            id="see-all-tracks-btn"
                          >
                            <Search className="w-3.5 h-3.5 text-pink-400" />
                            <span>See All</span>
                          </button>
                        </div>
                        <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest font-semibold">Quick navigation</span>
                      </div>

                      {/* Related Tracks & Videos */}
                      <section className="mb-10">
                        <h3 className="text-sm md:text-base font-bold text-white mb-4 uppercase tracking-widest font-mono text-pink-500">Related tracks & videos</h3>
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x">
                          {allTracks
                            .filter(t => t.id !== currentTrack.id)
                            .slice(0, 6)
                            .map((track) => (
                              <div
                                key={track.id}
                                onClick={() => playTrack(track, allTracks)}
                                className="w-40 md:w-48 shrink-0 snap-start bg-[#161517]/40 border border-white/5 rounded-2xl p-3 cursor-pointer hover:bg-white/5 hover:border-white/10 transition-all duration-300 group"
                              >
                                <div className="aspect-[16/10] w-full rounded-xl overflow-hidden relative shadow-md bg-black/20 animate-pulse-slow">
                                  <img 
                                    src={track.coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60'} 
                                    alt={track.title} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white shadow-md shadow-pink-500/20 translate-y-2 group-hover:translate-y-0 transition-transform">
                                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                    </div>
                                  </div>
                                </div>
                                <p className="text-xs font-bold text-white mt-2.5 truncate w-full capitalize">{track.title}</p>
                                <p className="text-[10px] text-white/50 truncate w-full mt-0.5">{track.artist}</p>
                              </div>
                            ))}
                        </div>
                      </section>

                      {/* Your Favorites */}
                      {(() => {
                        const favoriteTracks = allTracks.filter(t => favoriteIds.includes(t.id));
                        return (
                          <section className="mb-10">
                            <h3 className="text-sm md:text-base font-bold text-white mb-4 uppercase tracking-widest font-mono text-pink-500 flex items-center gap-2">
                              <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
                              Your Favorites ({favoriteTracks.length})
                            </h3>
                            {favoriteTracks.length > 0 ? (
                              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x">
                                {favoriteTracks.map((track) => (
                                  <div
                                    key={`fav-${track.id}`}
                                    onClick={() => playTrack(track, favoriteTracks)}
                                    className="w-40 md:w-48 shrink-0 snap-start bg-[#161517]/40 border border-white/5 rounded-2xl p-3 cursor-pointer hover:bg-white/5 hover:border-white/10 transition-all duration-300 group"
                                  >
                                    <div className="aspect-[16/10] w-full rounded-xl overflow-hidden relative shadow-md bg-black/20">
                                      <img 
                                        src={track.coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60'} 
                                        alt={track.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white shadow-md shadow-pink-500/20 translate-y-2 group-hover:translate-y-0 transition-transform">
                                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                        </div>
                                      </div>
                                    </div>
                                    <p className="text-xs font-bold text-white mt-2.5 truncate w-full capitalize">{track.title}</p>
                                    <p className="text-[10px] text-white/50 truncate w-full mt-0.5">{track.artist}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="glass-dark-mav p-6 rounded-2xl border border-white/5 text-center text-white/50 text-xs flex flex-col items-center justify-center gap-2">
                                <Heart className="w-8 h-8 text-white/20" />
                                <p>No favorites saved yet. Heart songs to see them here!</p>
                              </div>
                            )}
                          </section>
                        );
                      })()}

                      {/* Two-Column Grid: About Artist (Left) & Credits + Queue (Right) */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                        {/* Column 1: About the Artist */}
                        <div className="glass-dark-mav rounded-3xl overflow-hidden border border-white/10 relative p-6 flex flex-col justify-between min-h-[380px] group">
                          {/* Ambient Backdrop Banner */}
                          <div 
                            className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-20 pointer-events-none transition-all duration-700" 
                            style={{ backgroundImage: `url(${currentTrack.coverUrl})` }} 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#090809]/95 via-transparent to-transparent pointer-events-none" />

                          <div className="relative z-10">
                            {/* Artist Header Info */}
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10 shadow-lg shrink-0">
                                <img src={currentTrack.coverUrl} className="w-full h-full object-cover" alt={currentTrack.artist} />
                              </div>
                              <div>
                                <p className="text-[9px] font-mono uppercase tracking-widest text-pink-500 font-bold">Verified Artist</p>
                                <h4 className="text-lg md:text-xl font-black text-white mt-0.5">{currentTrack.artist || 'Unknown Artist'}</h4>
                                <p className="text-[10px] text-white/50 mt-0.5">
                                  {getMonthlyListeners(currentTrack.artist)} monthly listeners
                                </p>
                              </div>
                            </div>

                            {/* Artist Bio text */}
                            <p className="text-xs text-white/70 leading-relaxed font-sans line-clamp-5">
                              {getArtistBio(currentTrack.artist)}
                            </p>
                          </div>

                          <div className="mt-6 relative z-10 flex items-center justify-between">
                            <button 
                              onClick={() => toggleFollowArtist(currentTrack.artist)}
                              className={`px-6 py-2.5 rounded-full font-bold text-xs transition-all duration-300 cursor-pointer ${
                                isArtistFollowed(currentTrack.artist)
                                  ? 'bg-white/10 border border-white/20 text-white hover:bg-white/15'
                                  : 'bg-white text-black hover:scale-105 active:scale-95 shadow-md shadow-white/10'
                              }`}
                            >
                              {isArtistFollowed(currentTrack.artist) ? 'Following' : 'Follow'}
                            </button>
                            <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Playme Spotlight</span>
                          </div>
                        </div>

                        {/* Column 2: Credits & Next Queue */}
                        <div className="flex flex-col gap-6">
                          {/* Credits Card */}
                          <div className="glass-dark-mav rounded-3xl p-6 border border-white/10 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-bold">Credits</h4>
                              <button className="text-[9px] text-[#00f2ff] hover:underline cursor-pointer bg-transparent border-none p-0 font-bold uppercase tracking-wider">Show all</button>
                            </div>
                            <div className="space-y-4">
                              {getCreditsList(currentTrack).map((credit) => {
                                const isFollowed = !!followedCredits[credit.name];
                                return (
                                  <div key={credit.key} className="flex justify-between items-center">
                                    <div className="text-left min-w-0">
                                      <p className="text-xs font-bold text-white truncate capitalize">{credit.name}</p>
                                      <p className="text-[9px] text-white/50 truncate mt-0.5">{credit.role}</p>
                                    </div>
                                    <button 
                                      onClick={() => toggleFollowCredit(credit.name)}
                                      className={`px-3 py-1 rounded-full font-bold text-[9px] transition-all cursor-pointer ${
                                        isFollowed 
                                          ? 'border border-white/20 text-white bg-white/5' 
                                          : 'border border-pink-500/30 text-pink-400 hover:text-white hover:bg-pink-500/20'
                                      }`}
                                    >
                                      {isFollowed ? 'Following' : 'Follow'}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Next in Queue Card */}
                          {getNextTrackInQueue() && (
                            <div className="glass-dark-mav rounded-3xl p-6 border border-white/10 relative">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/40 font-bold">Next in queue</h4>
                                <button 
                                  onClick={() => setShowDashboard(true)}
                                  className="text-[9px] text-[#00f2ff] hover:underline cursor-pointer bg-transparent border-none p-0 font-bold uppercase tracking-wider"
                                >
                                  Open queue
                                </button>
                              </div>
                              {(() => {
                                const nextTrack = getNextTrackInQueue()!;
                                return (
                                  <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0">
                                        <img src={nextTrack.coverUrl} className="w-full h-full object-cover" alt={nextTrack.title} />
                                      </div>
                                      <div className="min-w-0 text-left">
                                        <p className="text-xs font-bold text-white truncate uppercase tracking-tight">{nextTrack.title}</p>
                                        <p className="text-[10px] text-white/50 truncate mt-0.5">{nextTrack.artist}</p>
                                      </div>
                                    </div>
                                    <button 
                                      onClick={() => playTrack(nextTrack, queue)}
                                      className="p-2.5 rounded-full bg-pink-500 hover:bg-pink-400 text-white hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer flex items-center justify-center"
                                    >
                                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                    </button>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
              )
            ) : (
              /* Glass panel scrollable wrapping other tabs safely */
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                className="flex-1 h-full w-full relative z-30"
              >
                <div ref={otherTabsScrollRef} className="flex-1 overflow-y-auto pr-2 pb-4 h-full scrollbar-thin scrollbar-thumb-white/10 custom-scroll w-full relative">
                <style>{`
                  .custom-scroll::-webkit-scrollbar {
                    width: 6px;
                  }
                  .custom-scroll::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  .custom-scroll::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.15);
                    border-radius: 9999px;
                  }
                  .custom-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                  }
                `}</style>
                {activeTab === TabletTab.LIVE && <ErrorBoundary inline><LiveStageView /></ErrorBoundary>}
                {activeTab === TabletTab.GENRES && <ErrorBoundary inline><DiscoverView searchQuery={searchQuery} setSearchQuery={setSearchQuery} initialActiveTab={discoverSubTab} onActiveTabChange={setDiscoverSubTab} /></ErrorBoundary>}
                {activeTab === TabletTab.FAVORITES && <ErrorBoundary inline><CollectionsView onAuthClick={onAuthClick} /></ErrorBoundary>}
                {activeTab === TabletTab.LIBRARY && <ErrorBoundary inline><LibraryView /></ErrorBoundary>}
              </div>
            </motion.div>
            )}
            </AnimatePresence>
          </div>

          {/* Right vertical utility selectors */}
          <aside className={`fixed right-6 md:right-8 top-1/2 -translate-y-1/2 flex flex-col justify-center space-y-4 md:space-y-6 z-50 transition-opacity duration-500 ${lyricMode !== 'off' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="glass-dark-mav px-2.5 md:px-4 py-4 md:py-6 rounded-full flex flex-col items-center space-y-4 md:space-y-6 text-white">
              <button 
                onClick={() => handleTabChange(TabletTab.LIVE)}
                className="hover:scale-110 text-gray-400 hover:text-white transition-all cursor-pointer"
                title="Mav Stage Streams"
              >
                <Mic className="w-5 h-5" />
              </button>
              
              {/* Dynamic Draggable Volume Controller */}
              <div className="flex flex-col items-center gap-2 relative py-1 group/volume w-full">
                <button 
                  onClick={toggleMute}
                  className="hover:scale-110 transition-colors cursor-pointer text-gray-400 hover:text-white flex items-center justify-center h-5 w-5"
                  title={`Volume: ${Math.round(volume * 100)}% (Click to mute)`}
                >
                  {volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-pink-500" />
                  )}
                </button>
                
                <div 
                  ref={volumeTrackRef}
                  onMouseDown={handleVolumeMouseDown}
                  onTouchStart={handleVolumeTouchStart}
                  className="w-1.5 h-16 md:h-20 bg-white/10 rounded-full cursor-ns-resize relative group-hover/volume:bg-white/20 transition-colors"
                  title="Drag up/down to adjust volume"
                >
                  {/* Fill track */}
                  <div 
                    className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-pink-500 to-rose-400 rounded-full"
                    style={{ height: `${volume * 100}%` }}
                  />
                  {/* Knob */}
                  <div 
                    className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_8px_rgba(236,72,153,0.5)] cursor-ns-resize transition-transform duration-75 ${
                      isDraggingVolume ? 'scale-125 bg-pink-300' : 'hover:scale-125'
                    }`}
                    style={{ bottom: `calc(${volume * 100}% - 6px)` }}
                  />
                </div>
              </div>

              <div className="relative">
                <button 
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="hover:scale-110 text-gray-400 hover:text-white transition-all cursor-pointer"
                  title="More Options"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                <AnimatePresence>
                  {showMoreMenu && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9, x: 20 }}
                      className="absolute right-[calc(100%+16px)] top-1/2 -translate-y-1/2 w-64 glass-dark-mav rounded-2xl p-2 z-[60] border border-white/10 shadow-2xl flex flex-col gap-1"
                    >
                      {/* Social & Share */}
                      <div className="px-3 py-2 text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold">Share & Social</div>
                      
                      <button 
                        onClick={handleCopyLink}
                        disabled={isCopied}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-xs text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer font-sans"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>{isCopied ? 'Link Copied!' : 'Copy Link to Track'}</span>
                      </button>
                      
                      <button 
                        onClick={handleShareStory}
                        disabled={isSharingStory}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-xs text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer font-sans"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{isSharingStory ? 'Generating...' : 'Share to Story (IG/Snap)'}</span>
                      </button>
                      
                      <div className="h-px bg-white/10 my-1 mx-2" />
                      
                      {/* Audio Quality */}
                      <div className="px-3 py-2 text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold">Audio Quality</div>
                      
                      {['Lossless', 'High', 'Data Saver'].map((quality) => (
                        <button 
                          key={quality}
                          onClick={() => {
                            if (!isSubscribed && (quality === 'Lossless' || quality === 'High')) {
                              setShowMoreMenu(false);
                              setShowPremiumModal(true);
                              return;
                            }
                            setAudioQuality(quality as 'Lossless' | 'High' | 'Data Saver');
                            setShowMoreMenu(false);
                          }}
                          className={`flex items-center justify-between w-full px-3 py-2 text-xs hover:bg-white/10 rounded-xl transition-all cursor-pointer font-sans ${audioQuality === quality ? 'text-[#00f2ff] font-semibold' : 'text-white/80 hover:text-white'}`}
                        >
                          <div className="flex items-center gap-3">
                            {quality === 'Lossless' ? <Zap className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                            <span className="flex items-center gap-1.5">
                              {quality} 
                              {(quality === 'Lossless' || quality === 'High') && <Crown size={10} className="text-yellow-500" />}
                            </span>
                          </div>
                          {audioQuality === quality && <div className="w-1.5 h-1.5 rounded-full bg-[#00f2ff]" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="glass-dark-mav px-2.5 md:px-4 py-4 rounded-full flex flex-col items-center space-y-4 text-white">
                <button 
                  onClick={() => handleTabChange(TabletTab.FAVORITES)}
                  className="hover:scale-110 text-gray-400 hover:text-white transition-all relative cursor-pointer"
                  title="Your Favorited Track list"
                >
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
              </button>
              <button 
                onClick={() => setShowDownloadModal(true)}
                className="hover:scale-110 text-gray-400 hover:text-white transition-all cursor-pointer"
                title="Download Track (MP3/MP4)"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </aside>
        </div>

        {/* Adaptive Footer Navigation Bar — glassmorphic, adapts to video/audio mode */}
        <div className={`hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 ${isPodcastPlayerActive ? 'z-[35]' : 'z-[40]'} justify-center select-none pointer-events-none`}>
          <div 
            className={`flex items-center gap-1 px-1.5 py-1.5 rounded-full transition-all duration-500 ${lyricMode !== 'off' ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'} ${
              isYtActive 
                ? 'bg-black/50 backdrop-blur-xl border border-white/15 shadow-[0_4px_30px_rgba(0,0,0,0.5)]' 
                : 'bg-white/[0.06] backdrop-blur-md border border-white/10 shadow-[0_2px_20px_rgba(0,0,0,0.3)]'
            }`}
          >
            <button
              onClick={() => {
                if (activeTab === TabletTab.HOME) {
                  // Already on home — scroll back to top of player view
                  if (homePlayerScrollRef.current) {
                    homePlayerScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                  setShowDashboard(false);
                } else {
                  handleTabChange(TabletTab.HOME);
                  setShowDashboard(false);
                }
              }}
              className={`px-5 md:px-7 py-2 md:py-2.5 rounded-full text-[11px] md:text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 cursor-pointer ${
                activeTab === TabletTab.HOME
                  ? isYtActive
                    ? 'bg-white/20 text-white shadow-md backdrop-blur-sm drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]'
                    : 'bg-pink-500/20 text-pink-400 shadow-md'
                  : isYtActive
                    ? 'text-white/70 hover:text-white hover:bg-white/10 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]'
                    : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
              title="Return to Main Track info"
            >
              HOME
            </button>
            <div className={`w-px h-4 rounded-full ${isYtActive ? 'bg-white/20' : 'bg-white/10'}`} />
            <button
              onClick={() => {
                if (activeTab === TabletTab.GENRES) {
                  if (otherTabsScrollRef.current) {
                    otherTabsScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                } else {
                  setDiscoverSubTab('local');
                  handleTabChange(TabletTab.GENRES);
                }
              }}
              className={`px-5 md:px-7 py-2 md:py-2.5 rounded-full text-[11px] md:text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 cursor-pointer ${
                activeTab === TabletTab.GENRES
                  ? isYtActive
                    ? 'bg-white/20 text-white shadow-md backdrop-blur-sm drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]'
                    : 'bg-pink-500/20 text-pink-400 shadow-md'
                  : isYtActive
                    ? 'text-white/70 hover:text-white hover:bg-white/10 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]'
                    : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
              title="Search and Discover Offline Catalog"
            >
              SEE ALL
            </button>
          </div>
        </div>

        {/* Fixed Guest Listener / User Badge (Top-Right on Mobile, Bottom-Left on Desktop) */}
        <div className={`fixed top-6 right-6 md:top-auto md:bottom-6 md:left-8 md:right-auto z-[60] pointer-events-auto transition-opacity duration-500 flex items-center gap-3 ${lyricMode !== 'off' ? 'opacity-0 pointer-events-none' : 'opacity-100'} user-badge-bottom select-none`}
          onClick={() => {
            if (!user) onAuthClick();
          }}
          title={user ? `Logged in as ${user.displayName}` : 'Sign In / User Profile'}
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-pink-500/60 shrink-0 flex items-center justify-center bg-white/5 cursor-pointer hover:border-pink-400/80 transition-colors" onClick={(e) => { e.stopPropagation(); if (user && onProfileClick) onProfileClick(); }}>
              {user ? (
                user.photoURL ? (
                  <img alt={user.displayName} src={user.photoURL} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-pink-400 uppercase">
                    {(user.displayName || user.email || 'U').slice(0, 2)}
                  </span>
                )
              ) : (
                <User className="w-4 h-4 text-gray-400" />
              )}
            </div>
            {isSubscribed && (
              <div className="absolute -top-1 -right-1 bg-black rounded-full p-0.5">
                <Crown size={12} className="text-yellow-400 fill-yellow-400" />
              </div>
            )}
          </div>
          <div className="flex flex-col text-left leading-tight flex-1 min-w-0">
            <span className="text-white text-[11px] font-bold uppercase tracking-wider truncate max-w-[120px]">
              {user ? user.displayName : 'Guest Listener'}
            </span>
            <div className="flex gap-1">
              {user && (
                <button 
                  onClick={(e) => { e.stopPropagation(); if (onProfileClick) onProfileClick(); }}
                  className="text-[8px] text-[#00f2ff] hover:text-[#00f2ff]/80 font-bold tracking-wider uppercase text-left cursor-pointer"
                >
                  MANAGE
                </button>
              )}
              <button 
                onClick={(e) => { e.stopPropagation(); user ? logout() : onAuthClick(); }}
                className="text-[8px] text-pink-400 hover:text-pink-300 font-bold tracking-wider uppercase text-left cursor-pointer"
              >
                {user ? 'LOGOUT' : 'SIGN IN'}
              </button>
            </div>
          </div>
      </div>
      <DownloadModal 
        isOpen={showDownloadModal} 
        onClose={() => setShowDownloadModal(false)} 
        currentTrack={currentTrack} 
      />
    </div>
  );
};
