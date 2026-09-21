/**
 * recommendation.ts
 * Scores and ranks candidate tracks based on the user's taste profile.
 * Also provides AI-powered section affinity scores and personalization helpers.
 */

import { buildTasteSignals, getTimeContext, getSessionContext, TasteSignals, getRecentTracks } from './behaviorTracker';

export interface HomeTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  url: string;
  coverUrl: string;
  genre: string;
  description?: string;
  isYoutube: boolean;
  youtubeId: string;
  views?: string;
  likes?: string;
  publishedAt?: string;
  channelTitle?: string;
}

// ── Scoring weights ────────────────────────────────────────────────────────────
const W = {
  genreMatch: 0.25,
  artistMatch: 0.20,
  likedBonus: 0.15,
  popularity: 0.12,
  completion: 0.10,
  newness: 0.08,
  sessionContext: 0.07,
  exploration: 0.03,
};

function viewsToNumber(views: string | undefined): number {
  if (!views) return 0;
  const n = parseInt(views, 10);
  return isNaN(n) ? 0 : n;
}

function publishedToNewness(publishedAt: string | undefined): number {
  if (!publishedAt) return 0.3;
  const ageMs = Date.now() - new Date(publishedAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays <= 7) return 1.0;
  if (ageDays <= 30) return 0.8;
  if (ageDays <= 90) return 0.6;
  if (ageDays <= 365) return 0.4;
  return 0.2;
}

function normalize(val: number, max: number): number {
  if (max === 0) return 0;
  return Math.min(val / max, 1.0);
}

function scoreTrack(
  track: HomeTrack,
  signals: TasteSignals,
  maxViews: number,
  sessionCtx: { genre: string | null; artist: string | null }
): number {
  const genre = (track.genre || '').toLowerCase().trim();
  const artist = (track.artist || track.channelTitle || '').toLowerCase().trim();

  const genreScore = normalize(signals.genres[genre] || 0, Math.max(...Object.values(signals.genres), 1));
  const artistScore = normalize(signals.artists[artist] || 0, Math.max(...Object.values(signals.artists), 1));
  const likedScore = signals.likedIds.has(track.id) ? 1.0 : 0.0;
  const popularityScore = normalize(viewsToNumber(track.views), maxViews);
  const plays = signals.playCount[track.id] || 0;
  const completionScore = plays > 0 ? Math.min(plays / 5, 1.0) : 0;
  const newnessScore = publishedToNewness(track.publishedAt);

  let sessionScore = 0;
  if (sessionCtx.genre && genre.includes(sessionCtx.genre)) sessionScore = 1.0;
  else if (sessionCtx.artist && artist.includes(sessionCtx.artist)) sessionScore = 0.8;

  const explorationScore = (parseInt(track.id.slice(-4) || '0', 16) % 100) / 100;
  if (signals.skippedIds.has(track.id)) return 0.01;

  return (
    W.genreMatch * genreScore +
    W.artistMatch * artistScore +
    W.likedBonus * likedScore +
    W.popularity * popularityScore +
    W.completion * completionScore +
    W.newness * newnessScore +
    W.sessionContext * sessionScore +
    W.exploration * explorationScore
  );
}

export function rankTracks(candidates: HomeTrack[]): HomeTrack[] {
  if (candidates.length === 0) return [];
  const signals = buildTasteSignals();
  const sessionCtx = getSessionContext();
  const maxViews = Math.max(...candidates.map(t => viewsToNumber(t.views)), 1);
  const scored = candidates.map(track => ({
    track,
    score: scoreTrack(track, signals, maxViews, sessionCtx),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.track);
}

export function diversify(ranked: HomeTrack[], maxPerArtist = 2): HomeTrack[] {
  const artistCount: Record<string, number> = {};
  const result: HomeTrack[] = [];
  const overflow: HomeTrack[] = [];
  for (const track of ranked) {
    const artist = (track.artist || track.channelTitle || 'unknown').toLowerCase();
    const count = artistCount[artist] || 0;
    if (count < maxPerArtist) {
      artistCount[artist] = count + 1;
      result.push(track);
    } else {
      overflow.push(track);
    }
  }
  return [...result, ...overflow];
}

export function getMadeForYou(candidates: HomeTrack[], limit = 15): HomeTrack[] {
  const signals = buildTasteSignals();
  const ranked = rankTracks(candidates);
  const filtered = ranked.filter(t => !signals.skippedIds.has(t.id));
  return diversify(filtered).slice(0, limit);
}

export function getTimeSectionLabel(): { title: string; subtitle: string } {
  const ctx = getTimeContext();
  switch (ctx) {
    case 'morning': return { title: 'Rise & Shine', subtitle: 'MORNING PICKS FOR YOU' };
    case 'afternoon': return { title: 'Keep the Vibe', subtitle: 'AFTERNOON FOCUS PICKS' };
    case 'evening': return { title: 'Stay Upbeat', subtitle: 'YOUR EVENING PLAYLIST' };
    case 'night': return { title: 'Wind Down', subtitle: 'LATE NIGHT CHILL PICKS' };
  }
}

// ─── AI Personalization Helpers ───────────────────────────────────────────────

/**
 * Get top artists from user's listening history.
 */
export function getTopArtists(limit = 8): { artist: string; score: number; coverUrl?: string }[] {
  const signals = buildTasteSignals();
  const recentTracks = getRecentTracks(50);

  // Build a map of artist → latest cover URL
  const artistCovers: Record<string, string> = {};
  for (const e of recentTracks) {
    const a = (e.artist || '').toLowerCase();
    if (!artistCovers[a] && e.coverUrl) {
      artistCovers[a] = e.coverUrl;
    }
  }

  return Object.entries(signals.artists)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([artist, score]) => ({
      artist: artist.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      score,
      coverUrl: artistCovers[artist.toLowerCase()],
    }));
}

/**
 * Get top genres from user's listening history.
 */
export function getTopGenres(limit = 5): { genre: string; score: number }[] {
  const signals = buildTasteSignals();
  return Object.entries(signals.genres)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([genre, score]) => ({
      genre: genre.charAt(0).toUpperCase() + genre.slice(1),
      score,
    }));
}

/**
 * Get the user's #1 most-listened artist name (for Artist Spotlight section).
 */
export function getTopArtist(): string | null {
  const top = getTopArtists(1);
  return top.length > 0 ? top[0].artist : null;
}

/**
 * Compute affinity scores for each home section based on user listening history.
 * Higher score = section is more relevant to the user → should appear first.
 * Returns a map of sectionKey → score (0–100).
 */
export function getSectionAffinities(): Record<string, number> {
  const signals = buildTasteSignals();
  const g = signals.genres;
  const hasHistory = Object.keys(signals.playCount).length > 0;

  // Helper: sum of multiple genre scores
  const sum = (...keys: string[]) => keys.reduce((acc, k) => acc + (g[k.toLowerCase()] || 0), 0);

  return {
    stayUpbeat: sum('dance', 'party', 'punjabi', 'upbeat', 'bhangra', 'edm', 'pop'),
    soulSoothers: sum('sufi', 'chill', 'soul', 'devotional', 'spiritual', 'ghazal', 'classical'),
    stayIndie: sum('indie', 'independent', 'alternative', 'coke studio', 'folk'),
    decades90s: sum('90s', 'classic', 'retro', 'nostalgia', 'old', 'vintage', 'evergreen'),
    onTheRoad: sum('road trip', 'drive', 'travel', 'adventure', 'long drive'),
    hotPlaylists: sum('trending', 'hot', 'popular', 'charts', 'new'),
    communityPlaylists: hasHistory ? 20 : 5,
    newReleasesForYou: hasHistory ? 30 : 20,
  };
}

/**
 * Returns a sorted list of new section keys ordered by user affinity (most relevant first).
 */
export function getPersonalizedNewSectionOrder(): string[] {
  const affinities = getSectionAffinities();
  return Object.entries(affinities)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);
}

export function getPersonalizedSectionOrder(signals: TasteSignals): string[] {
  const hasHistory = Object.keys(signals.playCount).length > 0;
  const hasLikes = signals.likedIds.size > 0;

  const base = [
    'hero',
    hasHistory ? 'continueListening' : null,
    'trendingSongs',
    hasHistory ? 'madeForYou' : null,
    hasHistory ? 'basedOnRecents' : null,
    'trendingPlaylists',
    'stayUpbeat',
    hasLikes ? 'playlists' : null,
    'albums',
    'featured',
    hasHistory ? 'frequentPlays' : null,
    'eternalClassics',
    'podcasts',
  ].filter(Boolean) as string[];

  return base;
}
