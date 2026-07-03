/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Dexie, { type Table } from 'dexie';
import { Track } from '../types';
import { GenreItem } from '../data';

export class PlaymeDexieDatabase extends Dexie {
  users!: Table<any>;
  playlists!: Table<any>;
  playlist_songs!: Table<any>;
  liked_songs!: Table<any>;
  user_settings!: Table<any>;
  listening_history!: Table<any>;
  sync_queue!: Table<any>;
  tracks!: Table<any>;
  genres!: Table<any>;

  constructor() {
    super('PlaymeDexieDatabase');
    this.version(3).stores({
      users: 'uid, email, updatedAt',
      playlists: 'id, userId, updatedAt, isDeleted',
      playlist_songs: 'id, playlistId, trackId, userId, isDeleted',
      liked_songs: 'id, userId, trackId, updatedAt, isDeleted',
      user_settings: 'userId, updatedAt',
      listening_history: 'id, userId, trackId, listenedAt',
      sync_queue: 'id, tableName, timestamp',
      tracks: 'id, isYoutube, downloadedFormat',
      genres: 'id'
    });
  }
}

export const playmeDb = new PlaymeDexieDatabase();

export async function initDB(): Promise<IDBDatabase> {
  if (!playmeDb.isOpen()) {
    await playmeDb.open();
  }
  return playmeDb.backendDB();
}

export async function saveUserTrack(
  track: Track,
  audioFile: Blob | null,
  coverFile: Blob | null = null
): Promise<void> {
  await playmeDb.tracks.put({
    id: track.id,
    title: track.title,
    artist: track.artist,
    album: track.album || '',
    duration: track.duration,
    genre: track.genre,
    description: track.description || '',
    audioBlob: audioFile,
    coverBlob: coverFile,
    coverUrl: track.coverUrl,
    isYoutube: track.isYoutube || false,
    youtubeId: track.youtubeId || '',
    downloadedFormat: track.isYoutube ? 'mp3' : null,
    downloadedAt: Date.now()
  });
}

export async function deleteUserTrack(trackId: string): Promise<void> {
  await playmeDb.tracks.delete(trackId);
}

export async function getUserTracks(): Promise<any[]> {
  const allTracks = await playmeDb.tracks.toArray();
  return allTracks.map((t: any) => ({
    id: t.id,
    title: t.title,
    artist: t.artist,
    album: t.album,
    duration: t.duration,
    genre: t.genre,
    description: t.description,
    url: t.audioBlob ? URL.createObjectURL(t.audioBlob) : t.coverUrl,
    coverUrl: t.coverBlob ? URL.createObjectURL(t.coverBlob) : t.coverUrl,
    audioBlob: t.audioBlob,
    coverBlob: t.coverBlob,
    isYoutube: t.isYoutube,
    youtubeId: t.youtubeId,
    isOffline: true
  }));
}

export async function saveUserGenre(genre: GenreItem): Promise<void> {
  await playmeDb.genres.put({
    id: genre.id,
    name: genre.name,
    count: genre.count,
    coverUrl: genre.coverUrl,
    hue: genre.hue
  });
}

export async function deleteUserGenre(genreId: string): Promise<void> {
  await playmeDb.genres.delete(genreId);
}

export async function getUserGenres(): Promise<GenreItem[]> {
  return await playmeDb.genres.toArray();
}
