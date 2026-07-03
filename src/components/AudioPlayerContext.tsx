/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Track, CustomPlaylist } from '../types';
import { TRACKS, GENRES, GenreItem } from '../data';
import { playmeDb, getUserTracks, getUserGenres, saveUserTrack, deleteUserTrack, saveUserGenre, deleteUserGenre } from '../lib/db';
import { queueSyncAction } from '../lib/sync';
import { useAuth } from './AuthContext';

interface AudioPlayerContextType {
  currentTrack: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isShuffle: boolean;
  isRepeat: boolean;
  favoriteIds: string[];
  queue: Track[];
  allTracks: Track[];
  allGenres: GenreItem[];
  playlists: CustomPlaylist[];
  playTrack: (track: Track, customQueue?: Track[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleFavorite: (trackId: string) => void;
  isFavorite: (trackId: string) => boolean;
  addUserTrack: (track: Track, audioFile?: File | null, coverFile?: File | null) => Promise<void>;
  removeUserTrack: (trackId: string) => Promise<void>;
  addUserGenre: (genre: GenreItem) => Promise<void>;
  removeUserGenre: (genreId: string) => Promise<void>;
  isHomeTabActive: boolean;
  setIsHomeTabActive: (active: boolean) => void;
  showDashboard: boolean;
  setShowDashboard: (show: boolean) => void;
  isYtFallbackActive: boolean;
  videoOpacity: number;
  setVideoOpacity: (opacity: number) => void;
  createPlaylist: (name: string, description?: string) => void;
  deletePlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  playNext: (track: Track) => void;
  addToQueue: (track: Track) => void;
  toggleDemoTrack: (trackId: string) => void;
  downloadTrack: (track: Track, format: 'mp3' | 'mp4') => Promise<void>;
  downloadingTrackId: string | null;
  downloadProgress: number;
  lyricsOffset: number;
  setLyricsOffset: (offset: number) => void;
  audioQuality: 'Lossless' | 'High' | 'Data Saver';
  setAudioQuality: (quality: 'Lossless' | 'High' | 'Data Saver') => void;
  placeholderRect: DOMRect | null;
  setPlaceholderRect: (rect: DOMRect | null) => void;
  isSubscribed: boolean;
  setIsSubscribed: (subscribed: boolean) => void;
  isAutoplay: boolean;
  setIsAutoplay: (autoplay: boolean) => void;
  vibeQueue: Track[];
  loadingVibeQueue: boolean;
  generateVibeQueue: (track: Track, force?: boolean) => Promise<void>;
  startRadio: (track: Track) => Promise<void>;
  continueMyMood: () => Promise<void>;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

const StableYoutubeIframe = React.memo(() => {
  return (
    <div 
      className="w-full h-full bg-black"
      dangerouslySetInnerHTML={{ __html: '<div id="youtube-player-iframe" class="w-full h-full bg-black"></div>' }}
    />
  );
}, () => true);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allTracks, setAllTracks] = useState<Track[]>(TRACKS);
  const [allGenres, setAllGenres] = useState<GenreItem[]>(GENRES);
  const [currentTrack, setCurrentTrack] = useState<Track>(TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const isPlayingRef = useRef<boolean>(false);
  const currentTrackRef = useRef<Track>(TRACKS[0]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(TRACKS[0].duration);
  const [volume, setVolumeState] = useState<number>(0.75);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);
  const isRepeatRef = useRef<boolean>(false);
  useEffect(() => {
    isRepeatRef.current = isRepeat;
  }, [isRepeat]);
  const [queue, setQueue] = useState<Track[]>(TRACKS);
  const [manuallyQueued, setManuallyQueued] = useState<Track[]>([]);
  const [isYtFallbackActive, setIsYtFallbackActive] = useState<boolean>(false);
  const [isHomeTabActive, setIsHomeTabActive] = useState<boolean>(true);
  const isHomeTabActiveRef = useRef<boolean>(true);
  const [showDashboard, setShowDashboard] = useState<boolean>(true);
  const [audioQuality, setAudioQuality] = useState<'Lossless' | 'High' | 'Data Saver'>('High');

  useEffect(() => {
    isHomeTabActiveRef.current = isHomeTabActive;
  }, [isHomeTabActive]);

  const { user } = useAuth();
  const userId = user?.uid || 'local_user';

  const [videoOpacity, setVideoOpacity] = useState<number>(0.85);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(['charlie-puth-how-long', 'space-station-deep-house']);
  const [playlists, setPlaylists] = useState<CustomPlaylist[]>([]);
  const [downloadingTrackId, setDownloadingTrackId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [offlineSourceUrl, setOfflineSourceUrl] = useState<string | null>(null);
  const [lyricsOffset, setLyricsOffset] = useState<number>(0);
  const [placeholderRect, setPlaceholderRect] = useState<DOMRect | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(() => {
    return localStorage.getItem('playme_is_subscribed') === 'true';
  });

  const handleSetSubscribed = (val: boolean) => {
    setIsSubscribed(val);
    localStorage.setItem('playme_is_subscribed', val ? 'true' : 'false');
  };

  const [isAutoplay, setIsAutoplay] = useState<boolean>(() => {
    return localStorage.getItem('playme_autoplay') !== 'false';
  });
  const [vibeQueue, setVibeQueue] = useState<Track[]>([]);
  const [loadingVibeQueue, setLoadingVibeQueue] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('playme_autoplay', isAutoplay ? 'true' : 'false');
  }, [isAutoplay]);

  const generateVibeQueue = async (track: Track, force = false) => {
    if (!track) return;
    if (!isAutoplay && !force) return;

    setLoadingVibeQueue(true);
    try {
      const historyRes = queue.slice(0, 5).map(t => `${t.title} by ${t.artist}`);
      const res = await fetch('/api/ai/vibe-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: track.title,
          artist: track.artist,
          genre: track.genre,
          history: historyRes
        })
      });

      if (res.ok) {
        const data = await res.json();
        const tracks = data.tracks || [];
        setVibeQueue(tracks);
        
        if (tracks.length > 0) {
          const queueIds = new Set(queue.map(t => t.id));
          const newVibeTracks = tracks.filter((t: Track) => !queueIds.has(t.id) && t.id !== track.id);
          if (newVibeTracks.length > 0) {
            setQueue((prev) => [...prev, ...newVibeTracks]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to generate AI vibe queue:', err);
    } finally {
      setLoadingVibeQueue(false);
    }
  };

  const startRadio = async (track: Track) => {
    if (!track) return;
    setLoadingVibeQueue(true);
    try {
      const res = await fetch('/api/ai/vibe-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: track.title,
          artist: track.artist,
          genre: track.genre
        })
      });

      if (res.ok) {
        const data = await res.json();
        const tracks = data.tracks || [];
        setVibeQueue(tracks);
        playTrack(track, [track, ...tracks]);
      }
    } catch (err) {
      console.error('Failed to start radio:', err);
    } finally {
      setLoadingVibeQueue(false);
    }
  };

  const continueMyMood = async () => {
    if (!currentTrack) return;
    setLoadingVibeQueue(true);
    try {
      const seedTrack = queue.length > 0 ? queue[queue.length - 1] : currentTrack;
      const res = await fetch('/api/ai/vibe-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: seedTrack.title,
          artist: seedTrack.artist,
          genre: seedTrack.genre
        })
      });

      if (res.ok) {
        const data = await res.json();
        const tracks = data.tracks || [];
        if (tracks.length > 0) {
          setVibeQueue((prev) => [...prev, ...tracks]);
          const queueIds = new Set(queue.map(t => t.id));
          const newTracks = tracks.filter((t: Track) => !queueIds.has(t.id));
          setQueue((prev) => [...prev, ...newTracks]);
        }
      }
    } catch (err) {
      console.error('Failed to continue mood:', err);
    } finally {
      setLoadingVibeQueue(false);
    }
  };

  // Automatically fetch recommendations when current track changes
  useEffect(() => {
    if (currentTrack && isAutoplay) {
      generateVibeQueue(currentTrack);
    }
  }, [currentTrack?.id, isAutoplay]);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    async function resolveOfflineSrc() {
      if (currentTrack) {
        try {
          const trackFromDb = await playmeDb.tracks.get(currentTrack.id);
          if (active && trackFromDb && trackFromDb.audioBlob) {
            objectUrl = URL.createObjectURL(trackFromDb.audioBlob);
            setOfflineSourceUrl(objectUrl);
            console.log(`[Offline Playback] Resolving offline blob source for ${currentTrack.title}`);
          } else {
            setOfflineSourceUrl(null);
          }
        } catch {
          setOfflineSourceUrl(null);
        }
      }
    }
    resolveOfflineSrc();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [currentTrack?.id]);

  useEffect(() => {
    async function loadUserData() {
      try {
        const dbPlaylists = await playmeDb.playlists
          .where('userId')
          .equals(userId)
          .and((p) => p.isDeleted === 0)
          .toArray();

        const formattedPlaylists = [];
        for (const p of dbPlaylists) {
          const songs = await playmeDb.playlist_songs
            .where('playlistId')
            .equals(p.id)
            .and((s) => s.isDeleted === 0)
            .toArray();

          formattedPlaylists.push({
            id: p.id,
            name: p.name,
            description: p.description,
            trackIds: songs.map((s) => s.trackId),
            createdAt: p.createdAt
          });
        }

        if (formattedPlaylists.length === 0 && userId === 'local_user') {
          const samplePlaylist = {
            id: 'vibes-playlist',
            name: 'Chill Vibes',
            description: 'Smooth rhythms & cloud classics',
            userId: 'local_user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: 0
          };
          await playmeDb.playlists.put(samplePlaylist);
          await playmeDb.playlist_songs.put({
            id: 'vibes-playlist_charlie-puth-how-long',
            playlistId: 'vibes-playlist',
            trackId: 'charlie-puth-how-long',
            userId: 'local_user',
            addedAt: new Date().toISOString(),
            isDeleted: 0
          });
          await playmeDb.playlist_songs.put({
            id: 'vibes-playlist_space-station-deep-house',
            playlistId: 'vibes-playlist',
            trackId: 'space-station-deep-house',
            userId: 'local_user',
            addedAt: new Date().toISOString(),
            isDeleted: 0
          });
          formattedPlaylists.push({
            id: 'vibes-playlist',
            name: 'Chill Vibes',
            description: 'Smooth rhythms & cloud classics',
            trackIds: ['charlie-puth-how-long', 'space-station-deep-house'],
            createdAt: samplePlaylist.createdAt
          });
        }
        setPlaylists(formattedPlaylists);

        let likedTrackIds = (
          await playmeDb.liked_songs
            .where('userId')
            .equals(userId)
            .and((s) => s.isDeleted === 0)
            .toArray()
        ).map((s) => s.trackId);

        if (likedTrackIds.length === 0 && userId === 'local_user') {
          likedTrackIds = ['charlie-puth-how-long', 'space-station-deep-house'];
          for (const tid of likedTrackIds) {
            await playmeDb.liked_songs.put({
              id: `${userId}_${tid}`,
              userId,
              trackId: tid,
              likedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isDeleted: 0
            });
          }
        }
        setFavoriteIds(likedTrackIds);
      } catch (err) {
        console.warn('Failed to load user data from Dexie:', err);
      }
    }
    loadUserData();
  }, [userId]);

  useEffect(() => {
    setIsYtFallbackActive(false);
  }, [currentTrack?.id]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevVolumeRef = useRef<number>(0.75);

  const playAudio = (audio: HTMLAudioElement, onFailure?: (err: any) => void) => {
    try {
      // Ensure current volume is synced before starting play
      audio.volume = volume;

      // Clear any pending pause since we are actively requesting play
      (audio as any).shouldPauseAfterPlay = false;

      // De-duplicate redundant play calls while a play promise is active
      if ((audio as any).isPlayPending) {
        return;
      }

      const promise = audio.play();
      if (promise !== undefined) {
        (audio as any).isPlayPending = true;
        (audio as any).playPromise = promise;
        
        promise
          .then(() => {
            (audio as any).isPlayPending = false;
            if ((audio as any).shouldPauseAfterPlay) {
              audio.pause();
              (audio as any).shouldPauseAfterPlay = false;
            }
          })
          .catch((err) => {
            (audio as any).isPlayPending = false;
            (audio as any).shouldPauseAfterPlay = false;
            if (err.name !== 'AbortError') {
              console.log('Audio playback error:', err);
              if (onFailure) onFailure(err);
            }
          });
      }
    } catch (e) {
      console.warn('Sync audio play error:', e);
      if (onFailure) onFailure(e);
    }
  };

  const pauseAudio = (audio: HTMLAudioElement) => {
    if ((audio as any).isPlayPending) {
      (audio as any).shouldPauseAfterPlay = true;
    } else {
      audio.pause();
      (audio as any).shouldPauseAfterPlay = false;
    }
  };

  // Database synchronizers
  const reloadTracks = async () => {
    try {
      // 1. Fetch tracks direct from server API (In-Memory catalogue + Static set)
      let apiTracks: Track[] = [];
      try {
        const response = await fetch('/api/songs');
        if (response.ok) {
          const data = await response.json();
          apiTracks = data.tracks || [];
        }
      } catch (err) {
        console.warn('Could not fetch server tracks:', err);
      }

      // 2. Load locally cached metadata & custom local Blob URLs for absolute convenience
      const raw = await getUserTracks();
      const loaded: Track[] = raw.map((item) => {
        let audioUrl = item.url || '';
        if (item.audioBlob) {
          audioUrl = URL.createObjectURL(item.audioBlob);
        }
        let coverUrl = item.coverUrl || '';
        if (item.coverBlob) {
          coverUrl = URL.createObjectURL(item.coverBlob);
        }
        return {
          id: item.id || `unknown-${Date.now()}`,
          title: item.title || 'Untitled Track',
          artist: item.artist || 'Unknown Artist',
          album: item.album || (item.isYoutube ? 'YouTube Client' : 'Upload Set'),
          duration: item.duration || 180,
          url: audioUrl,
          coverUrl: coverUrl,
          genre: item.genre || 'My Mix',
          description: item.description || '',
          isYoutube: item.isYoutube || false,
          youtubeId: item.youtubeId || '',
          isOffline: item.isOffline !== undefined ? item.isOffline : true,
          isDemo: item.isDemo || false,
        };
      });

      // 3. Intelligently merge tracking sources
      const trackMap = new Map<string, Track>();

      // Seed with client initial static tracklist
      TRACKS.forEach((t) => trackMap.set(t.id, t));

      // Layer in server-provided API tracks (making them play from backend API real-time)
      apiTracks.forEach((t) => trackMap.set(t.id, t));

      // Layer in offline local IndexedDB blob representations (enabling high-fidelity zero latency)
      loaded.forEach((t) => trackMap.set(t.id, t));

      setAllTracks(Array.from(trackMap.values()));
    } catch (e) {
      console.error('Error reloading tracks:', e);
    }
  };

  const reloadGenres = async () => {
    try {
      const loaded = await getUserGenres();
      setAllGenres([...GENRES, ...loaded]);
    } catch (e) {
      console.error('Error reloading genres:', e);
    }
  };

  const addUserTrack = async (track: Track, audioFile: File | null = null, coverFile: File | null = null) => {
    // 1. Save Locally
    await saveUserTrack(track, audioFile, coverFile);

    // 2. Synchronously transmit binary files & metadata to server-level in-memory API to stream on-the-spot
    try {
      const getBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = (error) => reject(error);
        });
      };

      const payload: any = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        genre: track.genre,
        duration: track.duration,
        description: track.description,
        isYoutube: track.isYoutube,
        youtubeId: track.youtubeId,
      };

      if (audioFile) {
        payload.audioBase64 = await getBase64(audioFile);
        payload.audioMimeType = audioFile.type;
      }
      if (coverFile) {
        payload.coverBase64 = await getBase64(coverFile);
        payload.coverMimeType = coverFile.type;
      } else {
        payload.coverUrl = track.coverUrl;
      }

      await fetch('/api/songs/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      console.log(`Backend music sync fully completed for '${track.title}'`);
    } catch (syncErr) {
      console.warn('Background server API upload deferred (falling back to offline indexed storage):', syncErr);
    }

    await reloadTracks();
  };

  const removeUserTrack = async (trackId: string) => {
    const target = allTracks.find((t) => t.id === trackId);
    if (target && target.url && target.url.startsWith('blob:')) {
      URL.revokeObjectURL(target.url);
    }
    if (target && target.coverUrl && target.coverUrl.startsWith('blob:')) {
      URL.revokeObjectURL(target.coverUrl);
    }
    await deleteUserTrack(trackId);
    setFavoriteIds((prev) => prev.filter((id) => id !== trackId));
    await reloadTracks();
  };

  const addUserGenre = async (genre: GenreItem) => {
    await saveUserGenre(genre);
    await reloadGenres();
  };

  const removeUserGenre = async (genreId: string) => {
    await deleteUserGenre(genreId);
    await reloadGenres();
  };

  useEffect(() => {
    reloadTracks();
    reloadGenres();
  }, []);

  const ytPlayerRef = useRef<any>(null);
  const ytPlayInitPromiseRef = useRef<Promise<any> | null>(null);
  const [isVideoMinimized, setIsVideoMinimized] = useState<boolean>(false);

  // Initialize YouTube Iframe API if not loaded
  useEffect(() => {
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }
  }, []);

  function handleNext() {
    if (!currentTrack) return;
    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex === -1) return;

    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      setCurrentTrack(queue[randomIndex]);
    } else {
      const nextIndex = (currentIndex + 1) % queue.length;
      setCurrentTrack(queue[nextIndex]);
    }
    setCurrentTime(0);
  }

  const handleNextRef = useRef<() => void>(handleNext);
  useEffect(() => {
    handleNextRef.current = handleNext;
  });

  const initYoutubePlayer = (): Promise<any> => {
    const iframeEl = document.getElementById('youtube-player-iframe');
    const isIframeWiped = iframeEl && iframeEl.tagName === 'DIV';
    if (isIframeWiped) {
      console.log('[YouTube Player] Target element is simple DIV. Invalidation forced.');
      ytPlayerRef.current = null;
      ytPlayInitPromiseRef.current = null;
    }

    if (ytPlayInitPromiseRef.current) {
      return ytPlayInitPromiseRef.current;
    }

    ytPlayInitPromiseRef.current = new Promise((resolve) => {
      const createPlayer = () => {
        try {
          console.log('[YouTube Player] Instantiating YT.Player...');
          const player = new (window as any).YT.Player('youtube-player-iframe', {
            height: '100%',
            width: '100%',
            videoId: currentTrackRef.current?.youtubeId || '',
            playerVars: {
              autoplay: 1,
              controls: 1,
              disablekb: 1,
              fs: 0,
              rel: 0,
              showinfo: 0,
              iv_load_policy: 3,
              origin: window.location.origin,
              vq: audioQuality === 'Data Saver' ? 'small' : (audioQuality === 'Lossless' ? 'hd1080' : 'hd720'),
            },
            events: {
              onReady: () => {
                console.log('[YouTube Player] YT.Player onReady fired successfully.');
                ytPlayerRef.current = player;
                try {
                  if (volume === 0) {
                    if (typeof player.mute === 'function') player.mute();
                  } else {
                    if (typeof player.unMute === 'function') player.unMute();
                  }
                  if (typeof player.setVolume === 'function') {
                    player.setVolume(volume * 100);
                  }

                  if (isPlayingRef.current) {
                    if (typeof player.playVideo === 'function') {
                      player.playVideo();
                    }
                  } else {
                    if (typeof player.pauseVideo === 'function') {
                      player.pauseVideo();
                    }
                  }
                  
                  // Attempt to set playback quality on ready
                  if (typeof player.setPlaybackQuality === 'function') {
                    const qualityMap = {
                      'Data Saver': 'small',
                      'High': 'hd720',
                      'Lossless': 'hd1080'
                    };
                    player.setPlaybackQuality(qualityMap[audioQuality]);
                  }
                } catch (e) {
                  console.warn('[YouTube Player] config inside onReady failed:', e);
                }
                resolve(player);
              },
              onStateChange: (event: any) => {
                try {
                  // event.data === 1 => PLAYING
                  if (event.data === 1) {
                    if (!isPlayingRef.current) {
                      setIsPlaying(true);
                    }
                    setIsYtFallbackActive(false);
                  }
                  // event.data === 2 => PAUSED
                  if (event.data === 2) {
                    // If we are on the Home page, the video is a pointer-events-none poster behind the scene,
                    // so physical clicks on the video are impossible. Any pause event is either a browser autoplay block,
                    // loading stutter, or transient change. We MUST NOT sync it to isPlaying=false, otherwise it 
                    // breaks the play buttons on screen by reverting them back to paused!
                    if (!isHomeTabActiveRef.current) {
                      if (isPlayingRef.current) {
                        setIsPlaying(false);
                      }
                    }
                  }
                  // event.data === 0 => ENDED
                  if (event.data === 0) {
                    if (isRepeatRef.current) {
                      try { player.seekTo(0); } catch (_) {}
                      try { player.playVideo(); } catch (_) {}
                    } else {
                      handleNextRef.current();
                    }
                  }
                } catch (stateErr) {
                  console.warn('[YouTube Player] onStateChange handler error (safely caught):', stateErr);
                }
              },
              onError: (err: any) => {
                try {
                  console.error('[YouTube Player] onPlayerError:', err);
                  const errorCode = err?.data;
                  // Only act on absolute fatal errors (video deleted = 100, embed restricted = 101 or 150)
                  if (errorCode === 101 || errorCode === 150 || errorCode === 100) {
                    console.warn(`[YouTube Player] Critical unplayable error (${errorCode}). Switching to stable backup...`);
                    setIsYtFallbackActive(true);
                  } else {
                    console.warn(`[YouTube Player] Transient or browser-autoplay blocked onPlayerError (${errorCode}). Keeping player active.`);
                    // Attempt playing again if the user requested play
                    try {
                      if (isPlayingRef.current && typeof player.playVideo === 'function') {
                        player.playVideo();
                      }
                    } catch (_) {}
                  }
                } catch (handlerErr) {
                  console.warn('[YouTube Player] onError handler crashed (safely caught):', handlerErr);
                }
              },
            },
          });
        } catch (e) {
          console.warn('[YouTube Player] init player class error:', e);
          ytPlayInitPromiseRef.current = null;
          resolve(null);
        }
      };

      if (!(window as any).YT || !(window as any).YT.Player) {
        const interval = setInterval(() => {
          if ((window as any).YT && (window as any).YT.Player) {
            clearInterval(interval);
            createPlayer();
          }
        }, 150);
        setTimeout(() => {
          clearInterval(interval);
          ytPlayInitPromiseRef.current = null;
          resolve(null);
        }, 10000);
      } else {
        createPlayer();
      }
    });

    return ytPlayInitPromiseRef.current;
  };

  // Watch for quality changes and update the YouTube player on the fly
  useEffect(() => {
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setPlaybackQuality === 'function') {
      const qualityMap = {
        'Data Saver': 'small',
        'High': 'hd720',
        'Lossless': 'hd1080'
      };
      try {
        ytPlayerRef.current.setPlaybackQuality(qualityMap[audioQuality]);
        console.log(`[YouTube Player] Attempted to set streaming quality to: ${qualityMap[audioQuality]} (${audioQuality})`);
      } catch (err) {
        console.warn('Failed to set YouTube playback quality:', err);
      }
    }
  }, [audioQuality]);

  // Synchronize audio source with current track on single persistent element
  useEffect(() => {
    if (!currentTrack) return;
    const useHTML5Audio = !currentTrack.isYoutube || isYtFallbackActive || !!offlineSourceUrl;
    if (useHTML5Audio) {
      const audio = audioRef.current;
      if (!audio) return;

      // Map YouTube URLs to a playable MP3 URL if we are falling back or if the URL is not a direct audio file
      const targetUrl = offlineSourceUrl || (currentTrack.url && !currentTrack.url.includes('youtube.com') && !currentTrack.url.includes('youtu.be') && (currentTrack.url.startsWith('http') || currentTrack.url.startsWith('blob:') || currentTrack.url.startsWith('/api/')))
        ? (offlineSourceUrl || currentTrack.url)
        : (() => {
            // Hash currentTrack.id or title to pick a stable SoundHelix song (1-16)
            const idStr = currentTrack.id || currentTrack.title || '1';
            let hash = 0;
            for (let i = 0; i < idStr.length; i++) {
              hash += idStr.charCodeAt(i);
            }
            const songNum = (hash % 16) + 1;
            return `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${songNum}.mp3`;
          })();

      if (audio.src !== targetUrl) {
        const wasPlaying = isPlaying;
        
        // Pause, assign new source, and load cleanly
        pauseAudio(audio);
        audio.src = targetUrl;
        audio.load();
        setCurrentTime(0);
        setDuration(currentTrack.duration || 180);

        if (wasPlaying) {
          playAudio(audio, () => {
            setIsPlaying(false);
          });
        }
      }
    } else {
      if (audioRef.current) {
        pauseAudio(audioRef.current);
      }
      setDuration(currentTrack.duration || 180);
      setCurrentTime(0);
    }
  }, [currentTrack?.id, currentTrack?.isYoutube, isYtFallbackActive, offlineSourceUrl]);

  // Handle HTML5 persistent audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    const handleTimeUpdate = () => {
      if (!currentTrack.isYoutube || isYtFallbackActive || !!offlineSourceUrl) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleDurationChange = () => {
      if ((!currentTrack.isYoutube || isYtFallbackActive || !!offlineSourceUrl) && !isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      if (!currentTrack.isYoutube || isYtFallbackActive || !!offlineSourceUrl) {
        if (isRepeat) {
          audio.currentTime = 0;
          playAudio(audio);
        } else {
          handleNextRef.current();
        }
      }
    };

    const handleCanPlay = () => {
      if ((!currentTrack.isYoutube || isYtFallbackActive || !!offlineSourceUrl) && isPlaying) {
        playAudio(audio, () => {
          setIsPlaying(false);
        });
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [currentTrack?.id, currentTrack?.isYoutube, isYtFallbackActive, isPlaying, isRepeat, offlineSourceUrl]);

  // Synchronize playing states
  useEffect(() => {
    const isYtEffective = currentTrack?.isYoutube && !isYtFallbackActive && !offlineSourceUrl;
    if (isYtEffective) {
      const iframeEl = document.getElementById('youtube-player-iframe');
      const isIframeWiped = iframeEl && iframeEl.tagName === 'DIV';
      if (isIframeWiped || !iframeEl) {
        console.log('[YouTube Player] Self-Healing: Resetting stale references during track synchronization.');
        ytPlayerRef.current = null;
        ytPlayInitPromiseRef.current = null;
      }

      if (audioRef.current) {
        pauseAudio(audioRef.current);
      }
      if (isPlaying) {
        const handlePlayerAction = (player: any) => {
          try {
            if (!player || typeof player.pauseVideo !== 'function') {
              console.warn('[YouTube Player] handlePlayerAction: player is invalid or destroyed.');
              return;
            }
            if (!isPlayingRef.current) {
              try { player.pauseVideo(); } catch (_) {}
              return;
            }
            try {
              if (volume === 0) {
                if (typeof player.mute === 'function') player.mute();
              } else {
                if (typeof player.unMute === 'function') player.unMute();
              }
              if (typeof player.setVolume === 'function') {
                player.setVolume(volume * 100);
              }
              if (typeof player.loadVideoById === 'function') {
                let currentVideoId = '';
                try {
                  if (typeof player.getVideoData === 'function') {
                    currentVideoId = player.getVideoData()?.video_id || '';
                  }
                } catch (dataErr) {
                  console.warn('Could not read getVideoData safely:', dataErr);
                }
                
                const targetVideoId = currentTrackRef.current?.youtubeId || '';
                if (currentVideoId !== targetVideoId && targetVideoId) {
                  player.loadVideoById({
                    videoId: targetVideoId,
                    startSeconds: currentTime > 0 ? currentTime : 0,
                  });
                } else if (typeof player.playVideo === 'function') {
                  player.playVideo();
                }
              }
            } catch (err) {
              console.warn('YT direct play failed:', err);
              setIsYtFallbackActive(true);
            }
          } catch (outerErr) {
            console.warn('[YouTube Player] handlePlayerAction outer error (safely caught):', outerErr);
          }
        };

        if (ytPlayerRef.current) {
          handlePlayerAction(ytPlayerRef.current);
        } else {
          initYoutubePlayer().then((player) => {
            if (player) {
              handlePlayerAction(player);
            } else {
              setIsYtFallbackActive(true);
            }
          });
        }
      } else {
        try {
          if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
            ytPlayerRef.current.pauseVideo();
          }
        } catch (_) {}
      }
    } else {
      try {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
          ytPlayerRef.current.pauseVideo();
        }
      } catch (_) {}
      if (!audioRef.current) return;
      if (isPlaying) {
        playAudio(audioRef.current, () => {
          setIsPlaying(false);
        });
      } else {
        pauseAudio(audioRef.current);
      }
    }
  }, [isPlaying, currentTrack?.id, currentTrack?.isYoutube, isYtFallbackActive, offlineSourceUrl]);

  // Periodic YouTube time tracking loop
  useEffect(() => {
    let interval: any = null;
    const isYtEffective = currentTrack?.isYoutube && !isYtFallbackActive && !offlineSourceUrl;
    if (isPlaying && isYtEffective) {
      interval = setInterval(() => {
        try {
          if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
            const ct = ytPlayerRef.current.getCurrentTime();
            setCurrentTime(ct);
            if (typeof ytPlayerRef.current.getDuration === 'function') {
              const dur = ytPlayerRef.current.getDuration();
              if (dur && dur > 0 && Math.abs(dur - duration) > 2) {
                setDuration(dur);
              }
            }
          }
        } catch (timerErr) {
          // Silently handle — player may be destroyed during tab switch
        }
      }, 150);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentTrack?.id, currentTrack?.isYoutube, isYtFallbackActive, duration, offlineSourceUrl]);

  // Synchronize Volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    try {
      if (ytPlayerRef.current) {
        if (typeof ytPlayerRef.current.setVolume === 'function') {
          ytPlayerRef.current.setVolume(volume * 100);
        }
        if (volume === 0) {
          if (typeof ytPlayerRef.current.mute === 'function') {
            ytPlayerRef.current.mute();
          }
        } else {
          if (typeof ytPlayerRef.current.unMute === 'function') {
            ytPlayerRef.current.unMute();
          }
        }
      }
    } catch (err) {
      console.warn('YT Volume/Unmute sync failed:', err);
    }
  }, [volume]);

  // Sync favorites with localstorage
  useEffect(() => {
    localStorage.setItem('playme_favs', JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  const playTrack = (track: Track, customQueue?: Track[]) => {
    // Remove from manuallyQueued since it starts playing now
    setManuallyQueued((prev) => prev.filter((t) => t.id !== track.id));

    if (customQueue) {
      if (manuallyQueued.length > 0) {
        const activeManual = manuallyQueued.filter((t) => t.id !== track.id);
        const manualIds = new Set(activeManual.map((t) => t.id));
        const activeRemainder = customQueue.filter((t) => t.id !== track.id && !manualIds.has(t.id));
        setQueue([track, ...activeManual, ...activeRemainder]);
      } else {
        setQueue(customQueue);
      }
    }
    // Proactively reset fallback flag so that we always try our hardest to load the YouTube media stream first!
    if (track.isYoutube) {
      setIsYtFallbackActive(false);
    }
    setCurrentTrack(track);
    setIsPlaying(true);
    setLyricsOffset(0);

    // Record listening history and queue sync
    const recordListeningHistory = async (trackId: string) => {
      try {
        const historyId = `history-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const historyRecord = {
          id: historyId,
          userId,
          trackId,
          listenedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await playmeDb.listening_history.put(historyRecord);
        if (user) {
          await queueSyncAction('insert', 'listening_history', historyId, historyRecord);
        }
      } catch (err) {
        console.warn('Failed to record listening history:', err);
      }
    };
    recordListeningHistory(track.id);
  };

  const togglePlay = () => {
    setIsPlaying((prev) => {
      const nextIsPlaying = !prev;
      // If the user manually requests play for a YouTube track, reset the fallback flag so we can retry loading YouTube!
      if (nextIsPlaying && currentTrack?.isYoutube) {
        setIsYtFallbackActive(false);
      }
      return nextIsPlaying;
    });
  };

  const handlePrev = () => {
    if (!currentTrack) return;
    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex === -1) return;

    const isYtEffective = currentTrack.isYoutube && !isYtFallbackActive && !offlineSourceUrl;
    if (isYtEffective) {
      try {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function' && ytPlayerRef.current.getCurrentTime() > 5) {
          ytPlayerRef.current.seekTo(0, true);
          setCurrentTime(0);
        } else {
          const prevIndex = currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
          setCurrentTrack(queue[prevIndex]);
          setCurrentTime(0);
        }
      } catch (prevErr) {
        console.warn('[YouTube Player] prevTrack seek error (safely caught):', prevErr);
        const prevIndex = currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
        setCurrentTrack(queue[prevIndex]);
        setCurrentTime(0);
      }
    } else {
      if (audioRef.current && audioRef.current.currentTime > 5) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
      } else {
        const prevIndex = currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
        setCurrentTrack(queue[prevIndex]);
        setCurrentTime(0);
      }
    }
  };

  const seek = (seconds: number) => {
    if (!currentTrack) return;
    const isYtEffective = currentTrack.isYoutube && !isYtFallbackActive && !offlineSourceUrl;
    if (isYtEffective) {
      try {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
          ytPlayerRef.current.seekTo(seconds, true);
        }
      } catch (seekErr) {
        console.warn('[YouTube Player] seek error (safely caught):', seekErr);
      }
      setCurrentTime(seconds);
    } else if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  const setVolume = (vol: number) => {
    const boundVol = Math.max(0, Math.min(1, vol));
    if (boundVol > 0) {
      prevVolumeRef.current = boundVol;
    }
    setVolumeState(boundVol);
  };

  const toggleMute = () => {
    if (volume > 0) {
      prevVolumeRef.current = volume;
      setVolumeState(0);
    } else {
      setVolumeState(prevVolumeRef.current || 0.75);
    }
  };

  const toggleShuffle = () => {
    setIsShuffle((prev) => !prev);
  };

  const toggleRepeat = () => {
    setIsRepeat((prev) => !prev);
  };

  const toggleFavorite = async (trackId: string) => {
    if (typeof trackId !== 'string' || !trackId) {
      console.warn('toggleFavorite was called with an invalid non-string trackId:', trackId);
      return;
    }

    const cloudTrack = (currentTrack && currentTrack.id === trackId) ? currentTrack : queue.find((t) => t.id === trackId);
    if (cloudTrack && cloudTrack.isYoutube) {
      const isSaved = allTracks.some((t) => t.id === trackId);
      if (!isSaved) {
        addUserTrack(cloudTrack).catch((err) => console.warn('Background auto-backup of favorited track:', err));
      }
    }

    const isFav = favoriteIds.includes(trackId);
    const newFavs = isFav ? favoriteIds.filter((id) => id !== trackId) : [...favoriteIds, trackId];
    setFavoriteIds(newFavs);

    const recordId = `${userId}_${trackId}`;
    const record = {
      id: recordId,
      userId,
      trackId,
      likedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: isFav ? 1 : 0
    };

    try {
      await playmeDb.liked_songs.put(record);
      if (user) {
        await queueSyncAction(isFav ? 'delete' : 'insert', 'liked_songs', recordId, record);
      }
    } catch (err) {
      console.warn('Failed to sync favorite status locally:', err);
    }
  };

  const isFavorite = (trackId: string) => typeof trackId === 'string' && favoriteIds.includes(trackId);

  // Custom playlist operations
  const createPlaylist = async (name: string, description?: string) => {
    if (!name.trim()) return;
    const playlistId = `playlist-${Date.now()}`;
    const newPlaylist: CustomPlaylist = {
      id: playlistId,
      name: name.trim(),
      description: description?.trim() || '',
      trackIds: [],
      createdAt: new Date().toISOString()
    };
    setPlaylists((prev) => [...prev, newPlaylist]);

    const dbRecord = {
      id: playlistId,
      name: name.trim(),
      description: description?.trim() || '',
      userId,
      createdAt: newPlaylist.createdAt,
      updatedAt: new Date().toISOString(),
      isDeleted: 0
    };

    try {
      await playmeDb.playlists.put(dbRecord);
      if (user) {
        await queueSyncAction('insert', 'playlists', playlistId, dbRecord);
      }
    } catch (err) {
      console.warn('Failed to save playlist locally:', err);
    }
  };

  const deletePlaylist = async (id: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
    try {
      const playlist = await playmeDb.playlists.get(id);
      if (playlist) {
        playlist.isDeleted = 1;
        playlist.updatedAt = new Date().toISOString();
        await playmeDb.playlists.put(playlist);
        if (user) {
          await queueSyncAction('delete', 'playlists', id, playlist);
        }
      }
    } catch (err) {
      console.warn('Failed to delete playlist locally:', err);
    }
  };

  const addTrackToPlaylist = async (playlistId: string, trackId: string) => {
    const cloudTrack = (currentTrack && currentTrack.id === trackId)
      ? currentTrack
      : queue.find((t) => t.id === trackId) || allTracks.find((t) => t.id === trackId);

    if (cloudTrack && cloudTrack.isYoutube) {
      const isSaved = allTracks.some((t) => t.id === trackId);
      if (!isSaved) {
        addUserTrack(cloudTrack).catch((err) => console.warn('Background auto-backup of playlist track:', err));
      }
    }

    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          if (!p.trackIds.includes(trackId)) {
            return { ...p, trackIds: [...p.trackIds, trackId] };
          }
        }
        return p;
      })
    );

    const recordId = `${playlistId}_${trackId}`;
    const dbRecord = {
      id: recordId,
      playlistId,
      trackId,
      userId,
      addedAt: new Date().toISOString(),
      isDeleted: 0
    };

    try {
      await playmeDb.playlist_songs.put(dbRecord);
      if (user) {
        await queueSyncAction('insert', 'playlist_songs', recordId, dbRecord);
      }
    } catch (err) {
      console.warn('Failed to add playlist song locally:', err);
    }
  };

  const removeTrackFromPlaylist = async (playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          return { ...p, trackIds: p.trackIds.filter((id) => id !== trackId) };
        }
        return p;
      })
    );

    const recordId = `${playlistId}_${trackId}`;
    try {
      const record = await playmeDb.playlist_songs.get(recordId);
      if (record) {
        record.isDeleted = 1;
        await playmeDb.playlist_songs.put(record);
        if (user) {
          await queueSyncAction('delete', 'playlist_songs', recordId, record);
        }
      }
    } catch (err) {
      console.warn('Failed to remove playlist song locally:', err);
    }
  };

  const downloadTrack = async (track: Track, format: 'mp3' | 'mp4') => {
    if (!user) {
      if (confirm("Downloads are only available to logged-in users. Please log in or sign up first! Would you like to log in now?")) {
        window.dispatchEvent(new CustomEvent('open-auth-modal'));
      }
      return;
    }
    if (!track.youtubeId) return;
    setDownloadingTrackId(track.id);
    setDownloadProgress(10);
    try {
      console.log(`[Downloader] Starting download for ${track.title} as ${format}...`);
      const res = await fetch(`/api/youtube/download?youtubeId=${track.youtubeId}&format=${format}`);
      if (!res.ok) throw new Error(`Download failed with status ${res.status}`);
      setDownloadProgress(50);
      const blob = await res.blob();
      setDownloadProgress(80);

      let coverBlob: Blob | null = null;
      if (track.coverUrl) {
        try {
          const coverRes = await fetch(track.coverUrl);
          if (coverRes.ok) {
            coverBlob = await coverRes.blob();
          }
        } catch (coverErr) {
          console.warn("Failed to cache cover image blob:", coverErr);
        }
      }

      await playmeDb.tracks.put({
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album || "",
        duration: track.duration,
        genre: track.genre,
        description: track.description || "",
        audioBlob: blob,
        coverBlob: coverBlob,
        coverUrl: track.coverUrl,
        isYoutube: track.isYoutube,
        youtubeId: track.youtubeId,
        downloadedFormat: format,
        downloadedAt: Date.now()
      });
      setDownloadProgress(100);
      await reloadTracks();
      console.log(`[Downloader] Successfully cached track offline: ${track.title}`);
    } catch (err) {
      console.error("[Downloader] Error downloading track:", err);
      alert(`Failed to download song: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDownloadingTrackId(null);
      setDownloadProgress(0);
    }
  };

  // Queue actions
  const playNext = (track: Track) => {
    // Add to allTracks if missing (so we can render it later)
    const exists = allTracks.some((t) => t.id === track.id);
    if (!exists) {
      setAllTracks((prev) => [...prev, track]);
    }

    setManuallyQueued((prev) => {
      const filtered = prev.filter((t) => t.id !== track.id);
      return [track, ...filtered];
    });

    setQueue((prev) => {
      const filtered = prev.filter((t) => t.id !== track.id);
      if (!currentTrack) return [track, ...filtered];
      const currentIndex = filtered.findIndex((t) => t.id === currentTrack.id);
      if (currentIndex === -1) {
        return [currentTrack, track, ...filtered];
      }
      const nextQueue = [...filtered];
      nextQueue.splice(currentIndex + 1, 0, track);
      return nextQueue;
    });
  };

  const addToQueue = (track: Track) => {
    const exists = allTracks.some((t) => t.id === track.id);
    if (!exists) {
      setAllTracks((prev) => [...prev, track]);
    }
    setManuallyQueued((prev) => {
      if (prev.some((t) => t.id === track.id)) return prev;
      return [...prev, track];
    });
    setQueue((prev) => {
      if (prev.some((t) => t.id === track.id)) return prev;
      return [...prev, track];
    });
  };

  // Toggles isDemo dynamically
  const toggleDemoTrack = (trackId: string) => {
    setAllTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          return { ...t, isDemo: !t.isDemo };
        }
        return t;
      })
    );
    if (currentTrack && currentTrack.id === trackId) {
      setCurrentTrack((prev) => (prev ? { ...prev, isDemo: !prev.isDemo } : prev));
    }
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isShuffle,
        isRepeat,
        favoriteIds,
        queue,
        allTracks,
        allGenres,
        playlists,
        playTrack,
        togglePlay,
        nextTrack: handleNext,
        prevTrack: handlePrev,
        seek,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        toggleFavorite,
        isFavorite,
        addUserTrack,
        removeUserTrack,
        addUserGenre,
        removeUserGenre,
        isHomeTabActive,
        setIsHomeTabActive,
        showDashboard,
        setShowDashboard,
        isYtFallbackActive,
        videoOpacity,
        setVideoOpacity,
        createPlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        playNext,
        addToQueue,
        toggleDemoTrack,
        downloadTrack,
        downloadingTrackId,
        downloadProgress,
        lyricsOffset,
        setLyricsOffset,
        audioQuality,
        setAudioQuality,
        placeholderRect,
        setPlaceholderRect,
        isSubscribed,
        setIsSubscribed: handleSetSubscribed,
        isAutoplay,
        setIsAutoplay,
        vibeQueue,
        loadingVibeQueue,
        generateVibeQueue,
        startRadio,
        continueMyMood,
      }}
    >
      {children}
      <audio
        ref={audioRef}
        className="hidden"
        preload="auto"
      />
      {/* Positioned off-screen with small dimensions when not active; morphs between full-screen poster background and pip window based on active tab to prevent video throttling */}
      <div 
        id="youtube-player-container" 
        className={`transition-[width,height,opacity,border-radius,top,left,bottom,right,transform] duration-500 ease-in-out ${
          (currentTrack?.isYoutube && !isYtFallbackActive && !offlineSourceUrl)
            ? (isHomeTabActive
                ? (!showDashboard && placeholderRect
                    ? 'fixed border border-white/10 bg-black pointer-events-auto z-[25] overflow-hidden shadow-lg animate-fade-in'
                    : 'fixed border border-white/10 bg-black pointer-events-auto z-[5] overflow-hidden'
                  )
                : 'fixed rounded-xl overflow-hidden border border-[#feecff]/10 bg-black/95 z-50 pointer-events-auto shadow-[0_12px_45px_rgba(0,0,0,0.8)]'
              )
            : 'absolute pointer-events-none opacity-0 select-none z-0 overflow-hidden'
        }`} 
        style={
          (currentTrack?.isYoutube && !isYtFallbackActive && !offlineSourceUrl)
            ? (isHomeTabActive
                ? (!showDashboard && placeholderRect
                    ? { 
                        width: `${placeholderRect.width}px`, 
                        height: `${placeholderRect.height}px`, 
                        left: `${placeholderRect.left}px`, 
                        top: `${placeholderRect.top}px`, 
                        transform: 'none',
                        right: 'auto', 
                        bottom: 'auto', 
                        borderRadius: '16px',
                        opacity: 1 
                      }
                    : { 
                        width: 'calc(100vw - 32px)', 
                        height: 'calc(100vh - 32px)', 
                        left: '16px', 
                        top: '16px', 
                        transform: 'none',
                        right: 'auto', 
                        bottom: 'auto', 
                        borderRadius: '24px',
                        opacity: videoOpacity 
                      }
                  )
                : { 
                    width: isVideoMinimized ? '82px' : '280px', 
                    height: isVideoMinimized ? '50px' : '160px', 
                    left: 'auto', 
                    top: 'auto', 
                    transform: 'none',
                    right: '16px', 
                    bottom: '104px', 
                    borderRadius: '12px',
                    opacity: 1 
                  }
              )
            : { 
                left: '-999px', 
                top: '-999px', 
                transform: 'none',
                right: 'auto', 
                bottom: 'auto', 
                width: '4px', 
                height: '4px', 
                opacity: 0 
              }
        }
      >
        {/* Floating Mini Player Controls with responsive title (PIP Mode only) 
             CRITICAL: This div MUST always be rendered (never conditionally mounted/unmounted)
             because the YouTube IFrame API replaces its sibling <div> with an <iframe> directly 
             in the DOM. If React tries to insertBefore/removeChild on a changed sibling list, 
             it crashes with a NotFoundError. We use CSS opacity + pointer-events to show/hide instead. */}
        <div 
          className={`absolute top-2 right-2 flex items-center gap-1.5 z-10 bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/5 transition-opacity ${
            (currentTrack?.isYoutube && !isYtFallbackActive && !isHomeTabActive && !offlineSourceUrl)
              ? 'opacity-80 hover:opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsVideoMinimized(!isVideoMinimized);
            }}
            className="text-[9px] font-bold text-[#00f2ff] hover:text-white transition-colors cursor-pointer capitalize"
          >
            {isVideoMinimized ? 'Expand' : 'Pip Mode'}
          </button>
        </div>
        <StableYoutubeIframe />
      </div>
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};
