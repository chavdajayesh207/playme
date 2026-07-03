/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useAudioPlayer } from './AudioPlayerContext';
import { Track } from '../types';
import { GenreItem } from '../data';
import {
  UploadCloud,
  FolderPlus,
  Music,
  Trash2,
  Play,
  CheckCircle,
  XCircle,
  Tag,
  BookOpen,
  Eye,
  Compass,
  FileAudio,
  Plus,
  Loader2,
  Sparkles,
  Youtube,
  Search,
  Bookmark,
  ExternalLink
} from 'lucide-react';
import { searchYoutubeMusic } from '../lib/youtube';

// Preset dynamic covers so users can easily select beautiful gradients for categories or tracks
const PRESET_GRADIENTS = [
  { name: 'Cosmic Cyan', value: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60' },
  { name: 'Aurora Indigo', value: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=500&auto=format&fit=crop&q=60' },
  { name: 'Neon Coral', value: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=500&auto=format&fit=crop&q=60' },
  { name: 'Melting Violet', value: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&auto=format&fit=crop&q=60' },
];

export const LibraryView: React.FC = () => {
  const {
    allTracks,
    allGenres,
    playTrack,
    addUserTrack,
    removeUserTrack,
    addUserGenre,
    removeUserGenre,
    currentTrack,
    isPlaying
  } = useAudioPlayer();

  // Navigation subtabs inside the Library view
  const [activeSubTab, setActiveSubTab] = useState<'upload' | 'categories'>('upload');

  // New Track Upload Form State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreset, setCoverPreset] = useState<string>(PRESET_GRADIENTS[0].value);
  const [trackTitle, setTrackTitle] = useState('');
  const [trackArtist, setTrackArtist] = useState('');
  const [trackAlbum, setTrackAlbum] = useState('');
  const [trackGenre, setTrackGenre] = useState('');
  const [trackDesc, setTrackDesc] = useState('');

  // Form uploading progress indicator
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Custom Category/Genre Form State
  const [genreName, setGenreName] = useState('');
  const [genreDesc, setGenreDesc] = useState('');
  const [genreCoverFile, setGenreCoverFile] = useState<File | null>(null);
  const [genreCoverPreset, setGenreCoverPreset] = useState<string>(PRESET_GRADIENTS[1].value);

  const [categoryStatus, setCategoryStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const genreCoverInputRef = useRef<HTMLInputElement>(null);

  // Drag & drop logic state for audio files
  const [isDragOver, setIsDragOver] = useState(false);

  // Extracts duration automatically using a transient Audio Object
  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);
      audio.src = objectUrl;
      audio.addEventListener('loadedmetadata', () => {
        resolve(Math.round(audio.duration));
        URL.revokeObjectURL(objectUrl);
      });
      audio.addEventListener('error', () => {
        resolve(180); // 3:00 default fallback
        URL.revokeObjectURL(objectUrl);
      });
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/')) {
        setAudioFile(file);
        // Autofill track name if empty
        const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setTrackTitle(cleanName);
      } else {
        setUploadStatus({ type: 'error', message: 'Please drop a valid audio file (MP3, WAV, M4A).' });
      }
    }
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudioFile(file);
      const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setTrackTitle(cleanName);
    }
  };

  const handleTrackFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) {
      setUploadStatus({ type: 'error', message: 'You must select or drop an audio file.' });
      return;
    }
    if (!trackTitle.trim() || !trackArtist.trim() || !trackGenre) {
      setUploadStatus({ type: 'error', message: 'Title, Artist, and Genre/Category are required.' });
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatus(null);

      // 1. Calculate duration automatically
      const duration = await getAudioDuration(audioFile);

      // 2. Generate a unique ID based on title & time
      const id = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);

      // 3. Build track schema
      const isPodcastCategory = [
        'Business & Entrepreneurship',
        'Technology & AI',
        'Finance & Investing',
        'Self-Improvement',
        'Health & Fitness',
        'Education',
        'News',
        'Sports',
        'Entertainment',
        'Spirituality'
      ].includes(trackGenre);

      const newTrack: Track = {
        id,
        title: trackTitle.trim(),
        artist: trackArtist.trim(),
        album: trackAlbum.trim() || (isPodcastCategory ? 'My Podcasts' : 'My Uploads'),
        genre: isPodcastCategory ? 'Podcast' : trackGenre,
        duration,
        url: '', // populated transiently by reloadTracks
        coverUrl: coverPreset, // Preset fallback
        description: trackDesc.trim() || (isPodcastCategory ? 'Custom shared podcast stream.' : 'Custom shared local stream.'),
        isOffline: true,
        isPodcast: isPodcastCategory,
        category: isPodcastCategory ? trackGenre : undefined
      };

      // 4. Save to Database context
      await addUserTrack(newTrack, audioFile, coverFile);

      // 5. Success feedback & Reset Form
      setUploadStatus({ type: 'success', message: 'Audio file fully ingested & compiled to Playme catalogue!' });
      setAudioFile(null);
      setCoverFile(null);
      setTrackTitle('');
      setTrackArtist('');
      setTrackAlbum('');
      setTrackGenre('');
      setTrackDesc('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (coverInputRef.current) coverInputRef.current.value = '';
    } catch (err: any) {
      setUploadStatus({ type: 'error', message: err.message || 'Error occurred while saving track.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genreName.trim() || !genreDesc.trim()) {
      setCategoryStatus({ type: 'error', message: 'Please provide both Name and descriptions.' });
      return;
    }

    try {
      setCategoryStatus(null);
      const id = 'genre-' + genreName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');

      // Check for conflict
      if (allGenres.some((g) => g.id === id)) {
        setCategoryStatus({ type: 'error', message: 'A category with this name already exists.' });
        return;
      }

      // 1. Create Cover URL trigger (custom or preset)
      let coverUrl = genreCoverPreset;
      if (genreCoverFile) {
        // We will store the preset value, but custom file could also be read as ObjectUrl later.
        // For custom category, we can read genreCoverFile directly as a blob URL on load if we wanted,
        // but to keep custom indexDB clean, we can store custom categories cleanly.
        coverUrl = URL.createObjectURL(genreCoverFile);
      }

      const newGenre: GenreItem = {
        id,
        name: genreName.trim(),
        coverUrl,
        description: genreDesc.trim(),
        trackId: '', // initially empty or launches custom queue
      };

      await addUserGenre(newGenre);
      setCategoryStatus({ type: 'success', message: `Category "${genreName}" added beautifully.` });
      setGenreName('');
      setGenreDesc('');
      setGenreCoverFile(null);
      if (genreCoverInputRef.current) genreCoverInputRef.current.value = '';
    } catch (err: any) {
      setCategoryStatus({ type: 'error', message: err.message || 'Failed to register custom category.' });
    }
  };

  // Filter only user tracks from our global state (ID starts with 'user-')
  const userUploadedTracks = allTracks.filter((t) => t.id.startsWith('user-'));
  // Filter only custom user genres (ID starts with 'genre-')
  const userCustomGenres = allGenres.filter((g) => g.id.startsWith('genre-'));

  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div id="library-feed" className="px-4 md:px-8 py-6 max-w-7xl mx-auto flex flex-col gap-8 pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="font-headline-lg text-3xl md:text-4xl font-bold text-[#e5e2e3] flex items-center gap-2">
            <span>My Studio</span>
            <Sparkles className="text-[#00f2ff] animate-pulse" size={28} />
          </h2>
          <p className="text-xs text-[#b9cacb] mt-1 font-label-mono uppercase tracking-widest">
            Upload local audio blocks and configure customized categorizations
          </p>
        </div>

        {/* Subtabs switches */}
        <div className="flex bg-white/5 p-1 rounded-full border border-white/10 shrink-0 select-none self-start md:self-auto gap-0.5">
          <button
            onClick={() => setActiveSubTab('upload')}
            className={`px-4 py-1.5 rounded-full font-semibold text-xs transition-colors cursor-pointer ${
              activeSubTab === 'upload'
                ? 'bg-[#00f2ff] text-[#002022]'
                : 'text-[#b9cacb] hover:text-white'
            }`}
          >
            Upload Music
          </button>
          <button
            onClick={() => setActiveSubTab('categories')}
            className={`px-4 py-1.5 rounded-full font-semibold text-xs transition-colors cursor-pointer ${
              activeSubTab === 'categories'
                ? 'bg-[#00f2ff] text-[#002022]'
                : 'text-[#b9cacb] hover:text-white'
            }`}
          >
            My Categories
          </button>
        </div>
      </header>

      {/* RENDER TAB 1: UPLOAD MUSIC WORKSPACE */}
      {activeSubTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="music-upload-tab">
          {/* Form Side - 7Cols */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileAudio size={18} className="text-[#00f2ff]" />
              <span>Ingest New Media File</span>
            </h3>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center gap-4 cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                isDragOver
                  ? 'border-[#00f2ff] bg-[#00f2ff]/10 scale-[1.01]'
                  : 'border-white/10 bg-[#1c1b1c]/40 hover:border-white/20 hover:bg-[#201f20]/40'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="audio/*"
                onChange={handleAudioSelect}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-[#b9cacb] group-hover:text-[#00f2ff] transition-colors">
                {audioFile ? (
                  <CheckCircle size={28} className="text-[#00f2ff] animate-bounce" />
                ) : (
                  <UploadCloud size={28} />
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-white leading-normal">
                  {audioFile ? `Selected: ${audioFile.name}` : 'Click or drag & drop audio track'}
                </p>
                <p className="text-xs text-[#b9cacb] mt-1.5">
                  Supports MP3, WAV, FLAC, M4A up to 50MB
                </p>
              </div>

              {audioFile && (
                <span className="text-[10px] font-label-mono bg-[#00f2ff]/15 text-[#00f2ff] font-bold px-3 py-1 rounded-full uppercase">
                  {(audioFile.size / (1024 * 1024)).toFixed(2)} MB • READY
                </span>
              )}
            </div>

            {/* Fields form */}
            <form onSubmit={handleTrackFormSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-mono text-[10px] text-[#b9cacb] uppercase tracking-wider">
                    Track Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter track title"
                    value={trackTitle}
                    onChange={(e) => setTrackTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#201f20]/60 border border-white/10 text-xs md:text-sm text-white focus:outline-hidden focus:border-[#00f2ff] transition-colors"
                  />
                </div>

                {/* Artist */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-mono text-[10px] text-[#b9cacb] uppercase tracking-wider">
                    Artist Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter artist name"
                    value={trackArtist}
                    onChange={(e) => setTrackArtist(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#201f20]/60 border border-white/10 text-xs md:text-sm text-white focus:outline-hidden focus:border-[#00f2ff] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Album */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-mono text-[10px] text-[#b9cacb] uppercase tracking-wider">
                    Album Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Single Release"
                    value={trackAlbum}
                    onChange={(e) => setTrackAlbum(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#201f20]/60 border border-white/10 text-xs md:text-sm text-white focus:outline-hidden focus:border-[#00f2ff] transition-colors"
                  />
                </div>

                {/* Category/Genre Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-mono text-[10px] text-[#b9cacb] uppercase tracking-wider">
                    Category/Genre *
                  </label>
                  <select
                    required
                    value={trackGenre}
                    onChange={(e) => setTrackGenre(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#201f20]/60 border border-white/10 text-xs md:text-sm text-white focus:outline-hidden focus:border-[#00f2ff] transition-colors select-none"
                  >
                    <option value="" disabled className="bg-[#131314]">Select Category</option>
                    <optgroup label="Music Genres" className="bg-[#131314] text-gray-400 font-bold">
                      {allGenres.map((g) => (
                        <option key={g.id} value={g.name} className="bg-[#131314] text-white">
                          {g.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Podcast Categories" className="bg-[#131314] text-gray-400 font-bold">
                      {[
                        'Business & Entrepreneurship',
                        'Technology & AI',
                        'Finance & Investing',
                        'Self-Improvement',
                        'Health & Fitness',
                        'Education',
                        'News',
                        'Sports',
                        'Entertainment',
                        'Spirituality'
                      ].map((cat) => (
                        <option key={cat} value={cat} className="bg-[#131314] text-white">
                          {cat}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-mono text-[10px] text-[#b9cacb] uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  placeholder="Share details about this spatial track or podcast episode..."
                  value={trackDesc}
                  rows={2}
                  onChange={(e) => setTrackDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#201f20]/60 border border-white/10 text-xs md:text-sm text-white focus:outline-hidden focus:border-[#00f2ff] transition-colors resize-none"
                />
              </div>

              {/* Choose Cover Art */}
              <div className="flex flex-col gap-3">
                <label className="font-label-mono text-[10px] text-[#b9cacb] uppercase tracking-wider">
                  Select Visual Card Style
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {PRESET_GRADIENTS.map((p) => (
                    <div
                      key={p.name}
                      onClick={() => {
                        setCoverPreset(p.value);
                        setCoverFile(null); // Clear custom uploaded image to use preset
                      }}
                      className={`h-20 rounded-xl overflow-hidden relative cursor-pointer border group flex items-end p-2 transition-all ${
                        coverPreset === p.value && !coverFile
                          ? 'border-[#00f2ff] ring-2 ring-[#00f2ff]/30 shadow-lg'
                          : 'border-white/5 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={p.value} alt={p.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <span className="relative text-[10px] font-semibold text-white truncate">{p.name}</span>
                    </div>
                  ))}
                </div>

                {/* Or Custom Upload */}
                <div className="flex items-center gap-4 mt-1">
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-white cursor-pointer"
                  >
                    Upload Custom Image
                  </button>
                  <input
                    type="file"
                    ref={coverInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setCoverFile(e.target.files[0]);
                        setCoverPreset(''); // remove preset
                      }
                    }}
                    className="hidden"
                  />
                  {coverFile && (
                    <p className="text-xs text-[#00f2ff] flex items-center gap-1">
                      <CheckCircle size={12} />
                      <span>{coverFile.name} loaded</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Status Alert feedback banner */}
              {uploadStatus && (
                <div
                  className={`p-4 rounded-2xl flex items-center gap-3 border text-xs leading-normal ${
                    uploadStatus.type === 'success'
                      ? 'bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#00f2ff]'
                      : 'bg-[#ff571a]/5 border-[#ff571a]/20 text-[#ff571a]'
                  }`}
                >
                  {uploadStatus.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                  <p>{uploadStatus.message}</p>
                </div>
              )}

              {/* Trigger button */}
              <button
                type="submit"
                disabled={isUploading}
                className="w-full mt-2 py-3.5 rounded-full bg-[#00f2ff] text-[#00363a] font-bold text-sm tracking-wide shadow-[0_4px_15px_rgba(0,242,255,0.2)] hover:shadow-[0_0_25px_rgba(0,242,255,0.5)] active:scale-[0.99] hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Compiling waveform triggers...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={16} />
                    <span>Compile to Device library</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* List Side - 5Cols */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Music size={18} className="text-[#ff5ec3]" />
              <span>Compilation Grid ({userUploadedTracks.length})</span>
            </h3>

            {userUploadedTracks.length === 0 ? (
              <div className="border border-white/5 bg-[#1c1b1c]/20 rounded-3xl p-16 text-center text-[#b9cacb]/60 flex flex-col items-center justify-center gap-3">
                <FileAudio size={42} className="text-white/10" />
                <p className="text-xs max-w-xs leading-relaxed">
                  Your device library catalog is empty. Drag a music block on the workspace to ingest spatial streams.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                {userUploadedTracks.map((track) => {
                  const isActive = currentTrack?.id === track.id;
                  return (
                    <div
                      key={track.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-[#00f2ff]/10 border-[#00f2ff]/30 shadow-lg'
                          : 'bg-[#1c1b1c]/40 border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl overflow-hidden border border-white/10 shrink-0 select-none">
                          <img alt={track.title} className="w-full h-full object-cover" src={track.coverUrl} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate leading-snug">
                            {track.title}
                          </h4>
                          <p className="text-[10px] text-[#b9cacb] truncate mt-0.5">
                            {track.artist}
                          </p>
                          <span className="font-label-mono text-[8px] tracking-wider text-[#00f2ff] uppercase block mt-0.5 font-bold">
                            {track.genre}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 select-none">
                        <button
                          onClick={() => playTrack(track, allTracks)}
                          className="w-8 h-8 rounded-full bg-[#00f2ff]/10 hover:bg-[#00f2ff] hover:text-[#00363a] text-[#00f2ff] flex items-center justify-center transition-all cursor-pointer"
                        >
                          <Play size={12} fill="currentColor" className="ml-0.5" />
                        </button>
                        <button
                          onClick={() => removeUserTrack(track.id)}
                          className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#ff571a]/25 hover:text-[#ff5ec3] text-[#b9cacb] flex items-center justify-center transition-all cursor-pointer"
                          title="Erase track"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENDER TAB 2: CREATE & MANAGE CUSTOM CATEGORIES */}
      {activeSubTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="categories-tab">
          {/* Form Create - 5Cols */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FolderPlus size={18} className="text-[#00f2ff]" />
              <span>Forge New Category</span>
            </h3>

            <form onSubmit={handleCategorySubmit} className="flex flex-col gap-4">
              {/* Category Name */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-mono text-[10px] text-[#b9cacb] uppercase tracking-wider">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dream Pop"
                  value={genreName}
                  onChange={(e) => setGenreName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#201f20]/60 border border-white/10 text-xs md:text-sm text-white focus:outline-hidden focus:border-[#00f2ff] transition-colors"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-mono text-[10px] text-[#b9cacb] uppercase tracking-wider">
                  Category Description *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the vibes, sounds, and textures curated here..."
                  value={genreDesc}
                  onChange={(e) => setGenreDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#201f20]/60 border border-white/10 text-xs md:text-sm text-white focus:outline-hidden focus:border-[#00f2ff] transition-colors resize-none"
                />
              </div>

              {/* Presets Row */}
              <div className="flex flex-col gap-3">
                <label className="font-label-mono text-[10px] text-[#b9cacb] uppercase tracking-wider">
                  Gradient cover style
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {PRESET_GRADIENTS.map((p) => (
                    <div
                      key={p.name}
                      onClick={() => {
                        setGenreCoverPreset(p.value);
                        setGenreCoverFile(null);
                      }}
                      className={`h-16 rounded-xl overflow-hidden relative cursor-pointer border flex items-end p-2 transition-all ${
                        genreCoverPreset === p.value && !genreCoverFile
                          ? 'border-[#00f2ff] ring-2 ring-[#00f2ff]/20'
                          : 'border-white/5 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={p.value} alt={p.name} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <span className="relative text-[10px] font-semibold text-white whitespace-nowrap">{p.name}</span>
                    </div>
                  ))}
                </div>

                {/* Custom category thumbnail Optional */}
                <div className="flex items-center gap-4 mt-1">
                  <button
                    type="button"
                    onClick={() => genreCoverInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-white cursor-pointer"
                  >
                    Custom Category Image
                  </button>
                  <input
                    type="file"
                    ref={genreCoverInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setGenreCoverFile(e.target.files[0]);
                        setGenreCoverPreset('');
                      }
                    }}
                    className="hidden"
                  />
                  {genreCoverFile && (
                    <p className="text-xs text-[#00f2ff] flex items-center gap-1">
                      <CheckCircle size={10} />
                      <span>{genreCoverFile.name} loaded</span>
                    </p>
                  )}
                </div>
              </div>

              {categoryStatus && (
                <div
                  className={`p-4 rounded-2xl flex items-center gap-3 border text-xs leading-normal ${
                    categoryStatus.type === 'success'
                      ? 'bg-[#00f2ff]/5 border-[#00f2ff]/20 text-[#00f2ff]'
                      : 'bg-[#ff571a]/5 border-[#ff571a]/20 text-[#ff571a]'
                  }`}
                >
                  <CheckCircle size={16} />
                  <p>{categoryStatus.message}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-2 py-3.5 rounded-full bg-gradient-to-r from-[#00f2ff] to-[#e3d4ff] text-[#002022] font-bold text-sm shadow-[0_4px_15px_rgba(0,242,255,0.2)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                <span>Publish custom Category</span>
              </button>
            </form>
          </div>

          {/* List Display - 7Cols */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Tag size={18} className="text-[#ff5ec3]" />
              <span>Category Schema Workspace ({userCustomGenres.length})</span>
            </h3>

            {userCustomGenres.length === 0 ? (
              <div className="border border-white/5 bg-[#1c1b1c]/20 rounded-3xl p-16 text-center text-[#b9cacb]/60 flex flex-col items-center justify-center gap-3">
                <Tag size={42} className="text-white/10" />
                <p className="text-xs max-w-xs leading-relaxed">
                  No custom channels have been registered yet. Input high-fidelity styles from the creation console.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userCustomGenres.map((genre) => {
                  // Count tracks belonging directly to this category
                  const counts = allTracks.filter((t) => t.genre === genre.name).length;
                  return (
                    <div
                      key={genre.id}
                      className="rounded-2xl overflow-hidden bg-[#1c1b1c]/50 border border-white/5 relative group h-40 flex flex-col justify-end p-4 shadow-md"
                    >
                      <img
                        alt={genre.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-500"
                        src={genre.coverUrl}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                      {/* Header indicators */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 text-[9px] font-label-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-pulse" />
                        <span>{counts} tracks</span>
                      </div>

                      <button
                        onClick={() => removeUserGenre(genre.id)}
                        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-red-500/20 text-[#b9cacb] hover:text-red-400 transition-all cursor-pointer"
                        title="Delete custom category"
                      >
                        <Trash2 size={12} />
                      </button>

                      <div className="relative z-10">
                        <h4 className="font-bold text-white text-md tracking-tight">
                          {genre.name}
                        </h4>
                        <p className="text-[10px] text-[#b9cacb] line-clamp-2 mt-1 min-h-[30px] leading-relaxed">
                          {genre.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
