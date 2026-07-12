import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "server_data");
const CACHE_FILE = path.join(DATA_DIR, "api_cache.json");
const TRACKS_METADATA_FILE = path.join(DATA_DIR, "tracks.json");
const AUDIO_DIR = path.join(DATA_DIR, "audio");
const COVERS_DIR = path.join(DATA_DIR, "covers");
const HOME_CACHE_FILE = path.join(DATA_DIR, "home_cache.json");

// Ensure directories exist on load
function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }
  if (!fs.existsSync(COVERS_DIR)) {
    fs.mkdirSync(COVERS_DIR, { recursive: true });
  }
}

interface CacheEntry {
  data: any;
  timestamp: number;
}

export interface ServerTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  url: string;
  coverUrl: string;
  genre: string;
  description?: string;
  isYoutube?: boolean;
  youtubeId?: string;
  createdAt?: number; // timestamp to evict tracks and cache files older than 7 days
}

// 7 days in milliseconds (7 * 24 * 60 * 60 * 1000)
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const LIMITS_FILE = path.join(DATA_DIR, "search_limits.json");

class ServerDb {
  private apiCache: Record<string, CacheEntry> = {};
  private tracks: Record<string, ServerTrack> = {};
  private searchLimits: Record<string, number> = {};
  private homeCache: any = null;

  constructor() {
    this.init();
  }

  private init() {
    ensureDirs();
    
    // Load api cache
    if (fs.existsSync(CACHE_FILE)) {
      try {
        const raw = fs.readFileSync(CACHE_FILE, "utf-8");
        this.apiCache = JSON.parse(raw);
        console.log(`[Database] Loaded ${Object.keys(this.apiCache).length} cached API responses.`);
      } catch (e) {
        console.error("[Database] Error loading API cache, resetting:", e);
        this.apiCache = {};
      }
    }

    // Load tracks metadata
    if (fs.existsSync(TRACKS_METADATA_FILE)) {
      try {
        const raw = fs.readFileSync(TRACKS_METADATA_FILE, "utf-8");
        this.tracks = JSON.parse(raw);
        console.log(`[Database] Loaded ${Object.keys(this.tracks).length} uploaded track profiles.`);
      } catch (e) {
        console.error("[Database] Error loading tracks metadata, resetting:", e);
        this.tracks = {};
      }
    }

    // Load search limits
    if (fs.existsSync(LIMITS_FILE)) {
      try {
        const raw = fs.readFileSync(LIMITS_FILE, "utf-8");
        this.searchLimits = JSON.parse(raw);
        console.log(`[Database] Loaded search limits cache.`);
      } catch (e) {
        this.searchLimits = {};
      }
    }

    // Load home cache
    if (fs.existsSync(HOME_CACHE_FILE)) {
      try {
        const raw = fs.readFileSync(HOME_CACHE_FILE, 'utf-8');
        this.homeCache = JSON.parse(raw);
        console.log(`[Database] Loaded home dashboard cache.`);
      } catch (e) {
        this.homeCache = null;
      }
    }

    // Clean up old entries
    this.cleanupOldData();
  }

  /**
   * Cleans up API caches and custom uploads older than 7 days
   */
  public cleanupOldData() {
    ensureDirs();
    const now = Date.now();
    let cacheChanged = false;
    let tracksChanged = false;

    // 1. Clean api caches
    for (const key in this.apiCache) {
      const entry = this.apiCache[key];
      if (now - entry.timestamp > SEVEN_DAYS_MS) {
        delete this.apiCache[key];
        cacheChanged = true;
      }
    }

    // 2. Clear custom tracks older than 7 days
    for (const trackId in this.tracks) {
      const track = this.tracks[trackId];
      const createdAt = track.createdAt || now;
      if (now - createdAt > SEVEN_DAYS_MS) {
        const audioPath = path.join(AUDIO_DIR, `${trackId}.bin`);
        const coverPath = path.join(COVERS_DIR, `${trackId}.bin`);
        
        if (fs.existsSync(audioPath)) {
          try { fs.unlinkSync(audioPath); } catch {}
        }
        if (fs.existsSync(coverPath)) {
          try { fs.unlinkSync(coverPath); } catch {}
        }

        delete this.tracks[trackId];
        tracksChanged = true;
        console.log(`[Database] Evicted 7+ days old custom track: ${track.title} by ${track.artist}`);
      }
    }

    // Clean old search limits (keep only last 14 days)
    let limitsChanged = false;
    const limitKeys = Object.keys(this.searchLimits);
    if (limitKeys.length > 14) {
      limitKeys.sort();
      // Remove oldest dates
      const toRemove = limitKeys.slice(0, limitKeys.length - 14);
      for (const d of toRemove) {
        delete this.searchLimits[d];
      }
      limitsChanged = true;
    }

    if (cacheChanged) {
      this.saveCache();
    }
    if (tracksChanged) {
      this.saveTracks();
    }
    if (limitsChanged) {
      this.saveLimits();
    }
  }

  private saveCache() {
    try {
      fs.writeFileSync(CACHE_FILE, JSON.stringify(this.apiCache, null, 2), "utf-8");
    } catch (e) {
      console.error("[Database] Failed to write API cache:", e);
    }
  }

  private saveTracks() {
    try {
      fs.writeFileSync(TRACKS_METADATA_FILE, JSON.stringify(this.tracks, null, 2), "utf-8");
    } catch (e) {
      console.error("[Database] Failed to write tracks metadata:", e);
    }
  }

  private saveLimits() {
    try {
      fs.writeFileSync(LIMITS_FILE, JSON.stringify(this.searchLimits, null, 2), "utf-8");
    } catch (e) {
      console.error("[Database] Failed to write search limits:", e);
    }
  }

  // Daily search limit accessors
  public getSearchCount(dateStr: string): number {
    return this.searchLimits[dateStr] || 0;
  }

  public incrementSearchCount(dateStr: string): number {
    const current = this.getSearchCount(dateStr);
    this.searchLimits[dateStr] = current + 1;
    this.saveLimits();
    return this.searchLimits[dateStr];
  }

  /**
   * Scan cached search responses and local catalogs using query token scoring.
   * Leverages 7-day user search history to satisfy new searches offline/when quota matches fail.
   */
  public searchCachedAndStaticTracks(query: string, staticTracks: any[]): any[] {
    const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    if (tokens.length === 0) return [];

    const candidates = new Map<string, any>();

    const addCandidate = (track: any) => {
      if (!track || !track.id) return;
      const titleLower = (track.title || "").toLowerCase();
      const artistLower = (track.artist || "").toLowerCase();
      const genreLower = (track.genre || "").toLowerCase();
      const descLower = (track.description || "").toLowerCase();

      let score = 0;
      for (const token of tokens) {
        if (titleLower.includes(token)) score += 10;
        if (artistLower.includes(token)) score += 5;
        if (genreLower.includes(token)) score += 3;
        if (descLower.includes(token)) score += 1;
      }

      if (score > 0) {
        const existing = candidates.get(track.id);
        if (!existing || existing.score < score) {
          candidates.set(track.id, { ...track, score });
        }
      }
    };

    // 1. Add static tracks catalog
    for (const t of staticTracks) {
      addCandidate(t);
    }

    // 2. Add custom uploaded tracks catalog
    for (const t of this.getTracksArray()) {
      addCandidate(t);
    }

    // 3. Scan the API cache history (Last 7 days)
    for (const key in this.apiCache) {
      if (key.startsWith("yt_search_") || key.startsWith("aimood_") || key.includes("spotify_recs") || key.includes("yt_live_")) {
        const cachedResults = this.apiCache[key].data;
        if (Array.isArray(cachedResults)) {
          for (const track of cachedResults) {
            addCandidate(track);
          }
        } else if (cachedResults && Array.isArray(cachedResults.tracks)) {
          for (const track of cachedResults.tracks) {
            addCandidate(track);
          }
        }
      }
    }

    // Sort by score descending
    const sorted = Array.from(candidates.values())
      .sort((a, b) => b.score - a.score)
      .map(({ score, ...track }) => track);

    if (sorted.length === 0 && staticTracks.length > 0) {
      console.log(`[Resiliency] Fallback search yielded 0 results. Returning standard preset catalogs.`);
      return staticTracks.slice(0, 6);
    }

    return sorted;
  }

  // API Cache Accessors
  public getCache(key: string): any | null {
    const entry = this.apiCache[key];
    if (!entry) return null;

    // Validates cache is under 7 days
    const now = Date.now();
    if (now - entry.timestamp > SEVEN_DAYS_MS) {
      delete this.apiCache[key];
      this.saveCache();
      return null;
    }
    return entry.data;
  }

  public setCache(key: string, data: any) {
    this.apiCache[key] = {
      data,
      timestamp: Date.now(),
    };
    this.saveCache();
  }

  // Uploaded track accessors
  public getTracksArray(): ServerTrack[] {
    return Object.values(this.tracks);
  }

  public getTrack(id: string): ServerTrack | null {
    return this.tracks[id] || null;
  }

  public saveTrack(track: ServerTrack, audioBuffer?: Buffer, audioMime?: string, coverBuffer?: Buffer, coverMime?: string) {
    track.createdAt = track.createdAt || Date.now();
    this.tracks[track.id] = track;
    this.saveTracks();

    if (audioBuffer) {
      const audioPath = path.join(AUDIO_DIR, `${track.id}.bin`);
      const meta = { mime: audioMime || "audio/mpeg", data: audioBuffer.toString("base64") };
      fs.writeFileSync(audioPath, JSON.stringify(meta), "utf-8");
    }

    if (coverBuffer) {
      const coverPath = path.join(COVERS_DIR, `${track.id}.bin`);
      const meta = { mime: coverMime || "image/png", data: coverBuffer.toString("base64") };
      fs.writeFileSync(coverPath, JSON.stringify(meta), "utf-8");
    }
  }

  public getAudioFile(id: string): { buffer: Buffer; mimeType: string } | null {
    const audioPath = path.join(AUDIO_DIR, `${id}.bin`);
    if (!fs.existsSync(audioPath)) return null;

    try {
      const raw = fs.readFileSync(audioPath, "utf-8");
      const meta = JSON.parse(raw);
      return {
        buffer: Buffer.from(meta.data, "base64"),
        mimeType: meta.mime,
      };
    } catch {
      return null;
    }
  }

  public getCoverFile(id: string): { buffer: Buffer; mimeType: string } | null {
    const coverPath = path.join(COVERS_DIR, `${id}.bin`);
    if (!fs.existsSync(coverPath)) return null;

    try {
      const raw = fs.readFileSync(coverPath, "utf-8");
      const meta = JSON.parse(raw);
      return {
        buffer: Buffer.from(meta.data, "base64"),
        mimeType: meta.mime,
      };
    } catch {
      return null;
    }
  }

  // Home Dashboard Cache Accessors
  public getHomeCache(): any | null {
    return this.homeCache;
  }

  public setHomeCache(data: any) {
    this.homeCache = data;
    this.saveHomeCache();
  }

  private saveHomeCache() {
    try {
      fs.writeFileSync(HOME_CACHE_FILE, JSON.stringify(this.homeCache, null, 2), 'utf-8');
    } catch (e) {
      console.error('[Database] Failed to write home cache:', e);
    }
  }
}

export const serverDb = new ServerDb();
