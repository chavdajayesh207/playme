import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "server_data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

/** Lightweight track stub stored in history (not the full Track object) */
export interface HistoryEntry {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  playedAt: number; // epoch ms
}

const MAX_HISTORY = 50;

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatar: string;
  isVerified: boolean;
  createdAt: number;
  updatedAt: number;
  lastLogin: number;
  resetToken?: string;
  resetTokenExpiry?: number;
  verificationToken?: string;
  verificationTokenExpiry?: number;
  phoneNumber?: string;
  // ── Cloud-synced user data ──
  favorites?: string[];          // track IDs
  followedArtists?: string[];    // artist names
  history?: HistoryEntry[];      // last 50 played tracks
  settings?: Record<string, any>; // user preferences
}

class UserDb {
  private users: Record<string, UserRecord> = {};

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(USERS_FILE)) {
      try {
        const raw = fs.readFileSync(USERS_FILE, "utf-8");
        this.users = JSON.parse(raw);
        console.log(`[User DB] Loaded ${Object.keys(this.users).length} user profiles.`);
      } catch (e) {
        console.error("[User DB] Error loading user database, resetting:", e);
        this.users = {};
      }
    } else {
      this.save();
    }
  }

  private save() {
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify(this.users, null, 2), "utf-8");
    } catch (e) {
      console.error("[User DB] Error saving user database:", e);
    }
  }

  public findByEmail(email: string): UserRecord | null {
    const cleanEmail = email.trim().toLowerCase();
    for (const id in this.users) {
      if (this.users[id].email.toLowerCase() === cleanEmail) {
        return this.users[id];
      }
    }
    return null;
  }

  public findById(id: string): UserRecord | null {
    return this.users[id] || null;
  }

  public findByResetToken(token: string): UserRecord | null {
    for (const id in this.users) {
      const u = this.users[id];
      if (u.resetToken === token && u.resetTokenExpiry && u.resetTokenExpiry > Date.now()) {
        return u;
      }
    }
    return null;
  }

  public findByVerificationToken(token: string): UserRecord | null {
    for (const id in this.users) {
      const u = this.users[id];
      if (u.verificationToken === token && u.verificationTokenExpiry && u.verificationTokenExpiry > Date.now()) {
        return u;
      }
    }
    return null;
  }

  public create(name: string, email: string, passwordHash: string): UserRecord {
    const cleanEmail = email.trim().toLowerCase();
    const id = crypto.randomUUID();
    const now = Date.now();
    const user: UserRecord = {
      id,
      name,
      email: cleanEmail,
      passwordHash,
      avatar: `https://api.dicebear.com/9.x/micah/svg?seed=${encodeURIComponent(name)}&backgroundColor=transparent&baseColor=f9a8d4,fcd34d,86efac,93c5fd&mouth=smile,laughing`,
      isVerified: false,
      createdAt: now,
      updatedAt: now,
      lastLogin: now
    };
    this.users[id] = user;
    this.save();
    return user;
  }

  public update(id: string, updates: Partial<UserRecord>): UserRecord | null {
    if (!this.users[id]) return null;
    this.users[id] = {
      ...this.users[id],
      ...updates,
      updatedAt: Date.now()
    };
    this.save();
    return this.users[id];
  }

  /**
   * Sync user-specific data (favorites, history, followedArtists, settings).
   * History is automatically capped at MAX_HISTORY (50) entries.
   */
  public syncUserData(
    id: string,
    payload: {
      favorites?: string[];
      followedArtists?: string[];
      history?: HistoryEntry[];
      settings?: Record<string, any>;
    }
  ): UserRecord | null {
    if (!this.users[id]) return null;

    const user = this.users[id];

    if (payload.favorites !== undefined) {
      user.favorites = payload.favorites;
    }
    if (payload.followedArtists !== undefined) {
      user.followedArtists = payload.followedArtists;
    }
    if (payload.history !== undefined) {
      // Cap history to the most recent MAX_HISTORY entries
      user.history = payload.history.slice(-MAX_HISTORY);
    }
    if (payload.settings !== undefined) {
      user.settings = { ...(user.settings || {}), ...payload.settings };
    }

    user.updatedAt = Date.now();
    this.save();
    return user;
  }

  /** Return only the sync-safe fields for a user (no password hash, tokens, etc.) */
  public getUserSyncData(id: string): {
    favorites: string[];
    followedArtists: string[];
    history: HistoryEntry[];
    settings: Record<string, any>;
  } | null {
    const user = this.users[id];
    if (!user) return null;
    return {
      favorites: user.favorites || [],
      followedArtists: user.followedArtists || [],
      history: user.history || [],
      settings: user.settings || {},
    };
  }
}

export const userDb = new UserDb();
