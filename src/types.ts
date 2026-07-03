/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  url: string; // audio MP3 source
  coverUrl: string; // image source
  genre: string;
  description?: string;
  isYoutube?: boolean;
  youtubeId?: string;
  isDemo?: boolean; // placeholder/demo track flag
  isOffline?: boolean; // locally stored file
  category?: string; // playlist/category assignment
  isPodcast?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  coverUrl: string;
  description?: string;
}

export interface CustomPlaylist {
  id: string;
  name: string;
  description?: string;
  trackIds: string[];
  createdAt: string;
}

export enum NavigationTab {
  WELCOME = 'welcome',
  HOME = 'home',
  DISCOVER = 'discover',
  LIVE_STAGE = 'livestage',
  PLAYER = 'player',
  LIBRARY = 'library',
  COLLECTIONS = 'collections'
}
