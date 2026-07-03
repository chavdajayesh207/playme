/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Track } from '../types';

// Standard fallback key provided by the user
const DEFAULT_API_KEY = 'AIzaSyC1DL-jzZ9cRrjG05sRGkDheyN7WJ2t9hE';

export function getYoutubeApiKey(): string {
  const savedKey = localStorage.getItem('playme_yt_api_key');
  if (savedKey && savedKey.trim()) {
    return savedKey.trim();
  }
  return ((import.meta as any).env?.VITE_YOUTUBE_API_KEY as string) || DEFAULT_API_KEY;
}

/**
 * Helpers to parse ISO 8601 duration (e.g. PT4M13S) to seconds
 */
function parseISO8601Duration(durationStr: string): number {
  const matches = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!matches) {
    return 180; // default 3 minutes fallback
  }
  const hours = parseInt(matches[1] || '0', 10);
  const minutes = parseInt(matches[2] || '0', 10);
  const seconds = parseInt(matches[3] || '0', 10);
  return (hours * 3600) + (minutes * 60) + seconds;
}

/**
 * Perform a secure fetch on YouTube API with correct type and category limits
 */
/**
 * Normalizes a track from the API to ensure all required fields have safe defaults.
 */
function normalizeTrack(track: any): Track {
  return {
    ...track,
    id: track.id || `yt-unknown-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: track.title || 'Untitled Track',
    artist: track.artist || 'Unknown Artist',
    album: track.album || 'Cloud Stream',
    duration: track.duration || 180,
    url: track.url || '',
    coverUrl: track.coverUrl || '',
    genre: track.genre || 'Cloud Discovery',
  };
}

export async function searchYoutubeMusic(query: string, videoDuration?: string, channelId?: string, maxResults: number = 50): Promise<Track[]> {
  const apiKey = getYoutubeApiKey();

  let url = `/api/youtube/search?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;
  if (videoDuration) {
    url += `&videoDuration=${encodeURIComponent(videoDuration)}`;
  }
  if (channelId) {
    url += `&channelId=${encodeURIComponent(channelId)}`;
  }
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers['x-youtube-api-key'] = apiKey;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `YouTube search returned status ${response.status}`);
  }

  const data = await response.json();
  const tracks = Array.isArray(data) ? data : [];
  return tracks.map(normalizeTrack);
}

/**
 * Fetch detailed channel information including subscriber count
 */
export async function getChannelInfo(channelName: string): Promise<any> {
  const apiKey = getYoutubeApiKey();
  const url = `/api/youtube/channel-info?channelName=${encodeURIComponent(channelName)}`;
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers['x-youtube-api-key'] = apiKey;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch channel info: ${response.status}`);
  }

  return response.json();
}

/**
 * Searches YouTube explicitly for Live Music Events, Concerts, Festivals or Broadcast sessions
 */
export async function searchLiveMusicEvents(
  query: string,
  filterType: 'all' | 'live' | 'concert' | 'festival' | 'acoustic' = 'all'
): Promise<Track[]> {
  const apiKey = getYoutubeApiKey();

  const url = `/api/youtube/live-events?q=${encodeURIComponent(query)}&filterType=${filterType}`;
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers['x-youtube-api-key'] = apiKey;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `YouTube search returned status ${response.status}`);
  }

  const data = await response.json();
  const tracks = Array.isArray(data) ? data : [];
  return tracks.map(normalizeTrack);
}

/**
 * Clean up common YouTube noises in video titles to match elegant player appearance
 */
function cleanTitle(title: string): string {
  return title
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\[\s*(?:Official\s+)?(?:Music\s+)?(?:Video|Audio|Lyrics)\s*\]/gi, '')
    .replace(/\(\s*(?:Official\s+)?(?:Music\s+)?(?:Video|Audio|Lyrics)\s*\)/gi, '')
    .replace(/\(\s*Lyrics\s*\)/gi, '')
    .trim();
}

/**
 * Clean up standard corporate records extensions in channel titles
 */
function cleanArtistName(name: string): string {
  return name
    .replace(/\s+-\s+topic$/i, '')
    .replace(/\s+vevo$/i, '')
    .trim();
}
