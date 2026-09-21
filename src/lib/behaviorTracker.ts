/**
 * behaviorTracker.ts
 * Tracks user listening behavior and stores it in localStorage.
 * Data syncs to the logged-in account when auth is available.
 */

export type EventType =
  | 'PLAY'
  | 'SKIP'
  | 'COMPLETE'
  | 'REPLAY'
  | 'LIKE'
  | 'UNLIKE'
  | 'SEARCH'
  | 'ADD_TO_QUEUE'
  | 'ADD_TO_PLAYLIST';

export interface ListenEvent {
  type: EventType;
  trackId: string;
  title: string;
  artist: string;
  genre: string;
  coverUrl: string;
  youtubeId?: string;
  url?: string;
  album?: string;
  duration?: number;
  timestamp: number; // unix ms
  sessionId: string;
  completionPercent?: number; // 0–100, for PLAY events
}

export interface TasteSignals {
  genres: Record<string, number>;   // genre → score
  artists: Record<string, number>;  // artist → score
  likedIds: Set<string>;
  skippedIds: Set<string>;
  playCount: Record<string, number>; // trackId → count
}

const STORAGE_KEY = 'playme_behavior_v2';
const MAX_EVENTS = 500; // cap to avoid storage bloat

// ── Session ID (per browser session) ──────────────────────────────────────────
let _sessionId = sessionStorage.getItem('playme_session') || '';
if (!_sessionId) {
  _sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  sessionStorage.setItem('playme_session', _sessionId);
}

// ── Internal helpers ──────────────────────────────────────────────────────────
function loadEvents(): ListenEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEvents(events: ListenEvent[]): void {
  try {
    // Keep only the most recent MAX_EVENTS
    const trimmed = events.slice(-MAX_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage full — silently ignore
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Record a listening event.
 */
export function trackEvent(
  type: EventType,
  track: {
    id: string;
    title: string;
    artist: string;
    genre: string;
    coverUrl: string;
    youtubeId?: string;
    url?: string;
    album?: string;
    duration?: number;
  },
  meta?: { completionPercent?: number }
): void {
  const events = loadEvents();
  const event: ListenEvent = {
    type,
    trackId: track.id,
    title: track.title,
    artist: track.artist,
    genre: track.genre || 'Unknown',
    coverUrl: track.coverUrl,
    youtubeId: track.youtubeId,
    url: track.url,
    album: track.album,
    duration: track.duration,
    timestamp: Date.now(),
    sessionId: _sessionId,
    completionPercent: meta?.completionPercent,
  };
  events.push(event);
  saveEvents(events);
}

/**
 * Get all stored events, most recent first.
 */
export function getHistory(): ListenEvent[] {
  return loadEvents().reverse();
}

/**
 * Get the last N unique tracks the user played (most recent first).
 * Used for "Continue Listening" and "Based on Your Recents".
 */
export function getRecentTracks(limit = 15): ListenEvent[] {
  const events = loadEvents().reverse();
  const seen = new Set<string>();
  const result: ListenEvent[] = [];
  for (const e of events) {
    if (e.type === 'PLAY' && !seen.has(e.trackId)) {
      seen.add(e.trackId);
      result.push(e);
      if (result.length >= limit) break;
    }
  }
  return result;
}

/**
 * Get tracks the user has played ≥ threshold times.
 * Used for "Your Frequent Plays".
 */
export function getFrequentTracks(threshold = 2, limit = 20): ListenEvent[] {
  const events = loadEvents();
  const countMap: Record<string, { event: ListenEvent; count: number }> = {};
  for (const e of events) {
    if (e.type === 'PLAY') {
      if (!countMap[e.trackId]) {
        countMap[e.trackId] = { event: e, count: 0 };
      }
      countMap[e.trackId].count++;
    }
  }
  return Object.values(countMap)
    .filter(({ count }) => count >= threshold)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(({ event }) => event);
}

/**
 * Get IDs of tracks the user skipped early (negative signal).
 */
export function getSkippedIds(): Set<string> {
  const events = loadEvents();
  return new Set(events.filter(e => e.type === 'SKIP').map(e => e.trackId));
}

/**
 * Get IDs of tracks the user liked.
 */
export function getLikedIds(): Set<string> {
  const events = loadEvents();
  const liked = new Set<string>();
  for (const e of events) {
    if (e.type === 'LIKE') liked.add(e.trackId);
    if (e.type === 'UNLIKE') liked.delete(e.trackId);
  }
  return liked;
}

/**
 * Build a taste profile from stored events.
 * Returns weighted scores per genre and artist.
 */
export function buildTasteSignals(): TasteSignals {
  const events = loadEvents();
  const genres: Record<string, number> = {};
  const artists: Record<string, number> = {};
  const playCount: Record<string, number> = {};

  const weights: Record<EventType, number> = {
    COMPLETE: 3,
    REPLAY: 2,
    LIKE: 4,
    PLAY: 1,
    SKIP: -2,
    UNLIKE: -1,
    SEARCH: 0.5,
    ADD_TO_QUEUE: 1.5,
    ADD_TO_PLAYLIST: 2,
  };

  for (const e of events) {
    const w = weights[e.type] ?? 0;
    if (w === 0) continue;

    // Genre scoring
    const genre = (e.genre || 'Unknown').toLowerCase().trim();
    genres[genre] = (genres[genre] || 0) + w;

    // Artist scoring
    const artist = (e.artist || 'Unknown').toLowerCase().trim();
    artists[artist] = (artists[artist] || 0) + w;

    // Play count
    if (e.type === 'PLAY') {
      playCount[e.trackId] = (playCount[e.trackId] || 0) + 1;
    }
  }

  return {
    genres,
    artists,
    likedIds: getLikedIds(),
    skippedIds: getSkippedIds(),
    playCount,
  };
}

/**
 * Get time-of-day context.
 */
export function getTimeContext(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Detect the current session's dominant genre/artist (last 3 plays).
 */
export function getSessionContext(): { genre: string | null; artist: string | null } {
  const recent = getRecentTracks(3);
  if (recent.length === 0) return { genre: null, artist: null };

  const genreCount: Record<string, number> = {};
  const artistCount: Record<string, number> = {};

  for (const e of recent) {
    const g = (e.genre || '').toLowerCase();
    const a = (e.artist || '').toLowerCase();
    genreCount[g] = (genreCount[g] || 0) + 1;
    artistCount[a] = (artistCount[a] || 0) + 1;
  }

  const topGenre = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const topArtist = Object.entries(artistCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return { genre: topGenre, artist: topArtist };
}

/**
 * Clear all stored behavior data (e.g., on logout if desired).
 */
export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
